"use strict";
import * as Core from "../core/core.js";
import { CPUNode } from "./CPUNode.js";
import { NetworkNode } from "./NetworkNode.js";
const SCHEDULABLE_TASK_TITLE_LH = "RunTask";
const SCHEDULABLE_TASK_TITLE_ALT1 = "ThreadControllerImpl::RunTask";
const SCHEDULABLE_TASK_TITLE_ALT2 = "ThreadControllerImpl::DoWork";
const SCHEDULABLE_TASK_TITLE_ALT3 = "TaskQueueManager::ProcessTaskFromWorkQueue";
const SIGNIFICANT_DUR_THRESHOLD_MS = 10;
const IGNORED_MIME_TYPES_REGEX = /^video/;
class PageDependencyGraph {
  static getNetworkInitiators(request) {
    if (!request.initiator) {
      return [];
    }
    if (request.initiator.url) {
      return [request.initiator.url];
    }
    if (request.initiator.type === "script") {
      const scriptURLs = /* @__PURE__ */ new Set();
      let stack = request.initiator.stack;
      while (stack) {
        const callFrames = stack.callFrames || [];
        for (const frame of callFrames) {
          if (frame.url) {
            scriptURLs.add(frame.url);
          }
        }
        stack = stack.parent;
      }
      return Array.from(scriptURLs);
    }
    return [];
  }
  static getNetworkNodeOutput(networkRequests) {
    const nodes = [];
    const idToNodeMap = /* @__PURE__ */ new Map();
    const urlToNodeMap = /* @__PURE__ */ new Map();
    const frameIdToNodeMap = /* @__PURE__ */ new Map();
    networkRequests.forEach((request) => {
      if (IGNORED_MIME_TYPES_REGEX.test(request.mimeType)) {
        return;
      }
      if (request.fromWorker) {
        return;
      }
      while (idToNodeMap.has(request.requestId)) {
        request.requestId += ":duplicate";
      }
      const node = new NetworkNode(request);
      nodes.push(node);
      const urlList = urlToNodeMap.get(request.url) || [];
      urlList.push(node);
      idToNodeMap.set(request.requestId, node);
      urlToNodeMap.set(request.url, urlList);
      if (request.frameId && request.resourceType === "Document" && request.documentURL === request.url) {
        const value = frameIdToNodeMap.has(request.frameId) ? null : node;
        frameIdToNodeMap.set(request.frameId, value);
      }
    });
    return { nodes, idToNodeMap, urlToNodeMap, frameIdToNodeMap };
  }
  static isScheduleableTask(evt) {
    return evt.name === SCHEDULABLE_TASK_TITLE_LH || evt.name === SCHEDULABLE_TASK_TITLE_ALT1 || evt.name === SCHEDULABLE_TASK_TITLE_ALT2 || evt.name === SCHEDULABLE_TASK_TITLE_ALT3;
  }
  /**
   * There should *always* be at least one top level event, having 0 typically means something is
   * drastically wrong with the trace and we should just give up early and loudly.
   */
  static assertHasToplevelEvents(events) {
    const hasToplevelTask = events.some(this.isScheduleableTask);
    if (!hasToplevelTask) {
      throw new Core.LanternError("Could not find any top level events");
    }
  }
  static getCPUNodes(mainThreadEvents) {
    const nodes = [];
    let i = 0;
    PageDependencyGraph.assertHasToplevelEvents(mainThreadEvents);
    while (i < mainThreadEvents.length) {
      const evt = mainThreadEvents[i];
      i++;
      if (!PageDependencyGraph.isScheduleableTask(evt) || !evt.dur) {
        continue;
      }
      let correctedEndTs = void 0;
      const children = [];
      for (const endTime = evt.ts + evt.dur; i < mainThreadEvents.length && mainThreadEvents[i].ts < endTime; i++) {
        const event = mainThreadEvents[i];
        if (PageDependencyGraph.isScheduleableTask(event) && event.dur) {
          correctedEndTs = event.ts - 1;
          break;
        }
        children.push(event);
      }
      nodes.push(new CPUNode(evt, children, correctedEndTs));
    }
    return nodes;
  }
  static linkNetworkNodes(rootNode, networkNodeOutput) {
    networkNodeOutput.nodes.forEach((node) => {
      const directInitiatorRequest = node.request.initiatorRequest || rootNode.request;
      const directInitiatorNode = networkNodeOutput.idToNodeMap.get(directInitiatorRequest.requestId) || rootNode;
      const canDependOnInitiator = !directInitiatorNode.isDependentOn(node) && node.canDependOn(directInitiatorNode);
      const initiators = PageDependencyGraph.getNetworkInitiators(node.request);
      if (initiators.length) {
        initiators.forEach((initiator) => {
          const parentCandidates = networkNodeOutput.urlToNodeMap.get(initiator) || [];
          if (parentCandidates.length === 1 && parentCandidates[0].startTime <= node.startTime && !parentCandidates[0].isDependentOn(node)) {
            node.addDependency(parentCandidates[0]);
          } else if (canDependOnInitiator) {
            directInitiatorNode.addDependent(node);
          }
        });
      } else if (canDependOnInitiator) {
        directInitiatorNode.addDependent(node);
      }
      if (node !== rootNode && node.getDependencies().length === 0 && node.canDependOn(rootNode)) {
        node.addDependency(rootNode);
      }
      if (!node.request.redirects) {
        return;
      }
      const redirects = [...node.request.redirects, node.request];
      for (let i = 1; i < redirects.length; i++) {
        const redirectNode = networkNodeOutput.idToNodeMap.get(redirects[i - 1].requestId);
        const actualNode = networkNodeOutput.idToNodeMap.get(redirects[i].requestId);
        if (actualNode && redirectNode) {
          actualNode.addDependency(redirectNode);
        }
      }
    });
  }
  static linkCPUNodes(rootNode, networkNodeOutput, cpuNodes) {
    const linkableResourceTypes = /* @__PURE__ */ new Set([
      "XHR",
      "Fetch",
      "Script"
    ]);
    function addDependentNetworkRequest(cpuNode, reqId) {
      const networkNode = networkNodeOutput.idToNodeMap.get(reqId);
      if (!networkNode || // Ignore all network nodes that started before this CPU task started
      // A network request that started earlier could not possibly have been started by this task
      networkNode.startTime <= cpuNode.startTime) {
        return;
      }
      const { request } = networkNode;
      const resourceType = request.resourceType || request.redirectDestination?.resourceType;
      if (!linkableResourceTypes.has(resourceType)) {
        return;
      }
      cpuNode.addDependent(networkNode);
    }
    function addDependencyOnFrame(cpuNode, frameId) {
      if (!frameId) {
        return;
      }
      const networkNode = networkNodeOutput.frameIdToNodeMap.get(frameId);
      if (!networkNode) {
        return;
      }
      if (networkNode.startTime >= cpuNode.startTime) {
        return;
      }
      cpuNode.addDependency(networkNode);
    }
    function addDependencyOnUrl(cpuNode, url) {
      if (!url) {
        return;
      }
      const minimumAllowableTimeSinceNetworkNodeEnd = -100 * 1e3;
      const candidates = networkNodeOutput.urlToNodeMap.get(url) || [];
      let minCandidate = null;
      let minDistance = Infinity;
      for (const candidate of candidates) {
        if (cpuNode.startTime <= candidate.startTime) {
          return;
        }
        const distance = cpuNode.startTime - candidate.endTime;
        if (distance >= minimumAllowableTimeSinceNetworkNodeEnd && distance < minDistance) {
          minCandidate = candidate;
          minDistance = distance;
        }
      }
      if (!minCandidate) {
        return;
      }
      cpuNode.addDependency(minCandidate);
    }
    const timers = /* @__PURE__ */ new Map();
    for (const node of cpuNodes) {
      for (const evt of node.childEvents) {
        if (!evt.args.data) {
          continue;
        }
        const argsUrl = evt.args.data.url;
        const stackTraceUrls = (evt.args.data.stackTrace || []).map((l) => l.url).filter(Boolean);
        switch (evt.name) {
          case "TimerInstall":
            timers.set(evt.args.data.timerId, node);
            stackTraceUrls.forEach((url) => addDependencyOnUrl(node, url));
            break;
          case "TimerFire": {
            const installer = timers.get(evt.args.data.timerId);
            if (!installer || installer.endTime > node.startTime) {
              break;
            }
            installer.addDependent(node);
            break;
          }
          case "InvalidateLayout":
          case "ScheduleStyleRecalculation":
            addDependencyOnFrame(node, evt.args.data.frame);
            stackTraceUrls.forEach((url) => addDependencyOnUrl(node, url));
            break;
          case "EvaluateScript":
            addDependencyOnFrame(node, evt.args.data.frame);
            addDependencyOnUrl(node, argsUrl);
            stackTraceUrls.forEach((url) => addDependencyOnUrl(node, url));
            break;
          case "XHRReadyStateChange":
            if (evt.args.data.readyState !== 4) {
              break;
            }
            addDependencyOnUrl(node, argsUrl);
            stackTraceUrls.forEach((url) => addDependencyOnUrl(node, url));
            break;
          case "FunctionCall":
          case "v8.compile":
            addDependencyOnFrame(node, evt.args.data.frame);
            addDependencyOnUrl(node, argsUrl);
            break;
          case "ParseAuthorStyleSheet":
            addDependencyOnFrame(node, evt.args.data.frame);
            addDependencyOnUrl(node, evt.args.data.styleSheetUrl);
            break;
          case "ResourceSendRequest":
            addDependencyOnFrame(node, evt.args.data.frame);
            addDependentNetworkRequest(node, evt.args.data.requestId);
            stackTraceUrls.forEach((url) => addDependencyOnUrl(node, url));
            break;
        }
      }
      if (node.getNumberOfDependencies() === 0 && node.canDependOn(rootNode)) {
        node.addDependency(rootNode);
      }
    }
    const minimumEvtDur = SIGNIFICANT_DUR_THRESHOLD_MS * 1e3;
    let foundFirstLayout = false;
    let foundFirstPaint = false;
    let foundFirstParse = false;
    for (const node of cpuNodes) {
      let isFirst = false;
      if (!foundFirstLayout && node.childEvents.some((evt) => evt.name === "Layout")) {
        isFirst = foundFirstLayout = true;
      }
      if (!foundFirstPaint && node.childEvents.some((evt) => evt.name === "Paint")) {
        isFirst = foundFirstPaint = true;
      }
      if (!foundFirstParse && node.childEvents.some((evt) => evt.name === "ParseHTML")) {
        isFirst = foundFirstParse = true;
      }
      if (isFirst || node.duration >= minimumEvtDur) {
        continue;
      }
      if (node.getNumberOfDependencies() === 1 || node.getNumberOfDependents() <= 1) {
        PageDependencyGraph.pruneNode(node);
      }
    }
  }
  /**
   * Removes the given node from the graph, but retains all paths between its dependencies and
   * dependents.
   */
  static pruneNode(node) {
    const dependencies = node.getDependencies();
    const dependents = node.getDependents();
    for (const dependency of dependencies) {
      node.removeDependency(dependency);
      for (const dependent of dependents) {
        dependency.addDependent(dependent);
      }
    }
    for (const dependent of dependents) {
      node.removeDependent(dependent);
    }
  }
  /**
   * TODO: remove when CDT backend in Lighthouse is gone. Until then, this is a useful debugging tool
   * to find delta between using CDP or the trace to create the network requests.
   *
   * When a test fails using the trace backend, I enabled this debug method and copied the network
   * requests when CDP was used, then when trace is used, and diff'd them. This method helped
   * remove non-logical differences from the comparison (order of properties, slight rounding
   * discrepancies, removing object cycles, etc).
   *
   * When using for a unit test, make sure to do `.only` so you are getting what you expect.
   */
  static debugNormalizeRequests(lanternRequests) {
    for (const request of lanternRequests) {
      request.rendererStartTime = Math.round(request.rendererStartTime * 1e3) / 1e3;
      request.networkRequestTime = Math.round(request.networkRequestTime * 1e3) / 1e3;
      request.responseHeadersEndTime = Math.round(request.responseHeadersEndTime * 1e3) / 1e3;
      request.networkEndTime = Math.round(request.networkEndTime * 1e3) / 1e3;
    }
    for (const r of lanternRequests) {
      delete r.rawRequest;
      if (r.initiatorRequest) {
        r.initiatorRequest = { id: r.initiatorRequest.requestId };
      }
      if (r.redirectDestination) {
        r.redirectDestination = { id: r.redirectDestination.requestId };
      }
      if (r.redirectSource) {
        r.redirectSource = { id: r.redirectSource.requestId };
      }
      if (r.redirects) {
        r.redirects = r.redirects.map((r2) => r2.requestId);
      }
    }
    const requests = lanternRequests.map((r) => ({
      requestId: r.requestId,
      connectionId: r.connectionId,
      connectionReused: r.connectionReused,
      url: r.url,
      protocol: r.protocol,
      parsedURL: r.parsedURL,
      documentURL: r.documentURL,
      rendererStartTime: r.rendererStartTime,
      networkRequestTime: r.networkRequestTime,
      responseHeadersEndTime: r.responseHeadersEndTime,
      networkEndTime: r.networkEndTime,
      transferSize: r.transferSize,
      resourceSize: r.resourceSize,
      fromDiskCache: r.fromDiskCache,
      fromMemoryCache: r.fromMemoryCache,
      finished: r.finished,
      statusCode: r.statusCode,
      redirectSource: r.redirectSource,
      redirectDestination: r.redirectDestination,
      redirects: r.redirects,
      failed: r.failed,
      initiator: r.initiator,
      timing: r.timing ? {
        requestTime: r.timing.requestTime,
        proxyStart: r.timing.proxyStart,
        proxyEnd: r.timing.proxyEnd,
        dnsStart: r.timing.dnsStart,
        dnsEnd: r.timing.dnsEnd,
        connectStart: r.timing.connectStart,
        connectEnd: r.timing.connectEnd,
        sslStart: r.timing.sslStart,
        sslEnd: r.timing.sslEnd,
        workerStart: r.timing.workerStart,
        workerReady: r.timing.workerReady,
        workerFetchStart: r.timing.workerFetchStart,
        workerRespondWithSettled: r.timing.workerRespondWithSettled,
        sendStart: r.timing.sendStart,
        sendEnd: r.timing.sendEnd,
        pushStart: r.timing.pushStart,
        pushEnd: r.timing.pushEnd,
        receiveHeadersStart: r.timing.receiveHeadersStart,
        receiveHeadersEnd: r.timing.receiveHeadersEnd
      } : r.timing,
      resourceType: r.resourceType,
      mimeType: r.mimeType,
      priority: r.priority,
      initiatorRequest: r.initiatorRequest,
      frameId: r.frameId,
      fromWorker: r.fromWorker,
      isLinkPreload: r.isLinkPreload,
      serverResponseTime: r.serverResponseTime
    })).filter((r) => !r.fromWorker);
    const debug = requests;
    console.log(debug);
  }
  static createGraph(mainThreadEvents, networkRequests, url) {
    const networkNodeOutput = PageDependencyGraph.getNetworkNodeOutput(networkRequests);
    const cpuNodes = PageDependencyGraph.getCPUNodes(mainThreadEvents);
    const { requestedUrl, mainDocumentUrl } = url;
    if (!requestedUrl) {
      throw new Core.LanternError("requestedUrl is required to get the root request");
    }
    if (!mainDocumentUrl) {
      throw new Core.LanternError("mainDocumentUrl is required to get the main resource");
    }
    const rootRequest = Core.NetworkAnalyzer.findResourceForUrl(networkRequests, requestedUrl);
    if (!rootRequest) {
      throw new Core.LanternError("rootRequest not found");
    }
    const rootNode = networkNodeOutput.idToNodeMap.get(rootRequest.requestId);
    if (!rootNode) {
      throw new Core.LanternError("rootNode not found");
    }
    const mainDocumentRequest = Core.NetworkAnalyzer.findLastDocumentForUrl(networkRequests, mainDocumentUrl);
    if (!mainDocumentRequest) {
      throw new Core.LanternError("mainDocumentRequest not found");
    }
    const mainDocumentNode = networkNodeOutput.idToNodeMap.get(mainDocumentRequest.requestId);
    if (!mainDocumentNode) {
      throw new Core.LanternError("mainDocumentNode not found");
    }
    PageDependencyGraph.linkNetworkNodes(rootNode, networkNodeOutput);
    PageDependencyGraph.linkCPUNodes(rootNode, networkNodeOutput, cpuNodes);
    mainDocumentNode.setIsMainDocument(true);
    if (NetworkNode.findCycle(rootNode)) {
      throw new Core.LanternError("Invalid dependency graph created, cycle detected");
    }
    return rootNode;
  }
  // Unused, but useful for debugging.
  static printGraph(rootNode, widthInCharacters = 80) {
    function padRight(str, target, padChar = " ") {
      return str + padChar.repeat(Math.max(target - str.length, 0));
    }
    const nodes = [];
    rootNode.traverse((node) => nodes.push(node));
    nodes.sort((a, b) => a.startTime - b.startTime);
    const nodeToLabel = /* @__PURE__ */ new Map();
    rootNode.traverse((node) => {
      const ascii = 65 + nodeToLabel.size;
      let label;
      if (ascii > 90) {
        label = `Z${ascii - 90}`;
      } else {
        label = String.fromCharCode(ascii);
      }
      nodeToLabel.set(node, label);
    });
    const min = nodes[0].startTime;
    const max = nodes.reduce((max2, node) => Math.max(max2, node.endTime), 0);
    const totalTime = max - min;
    const timePerCharacter = totalTime / widthInCharacters;
    nodes.forEach((node) => {
      const offset = Math.round((node.startTime - min) / timePerCharacter);
      const length = Math.ceil((node.endTime - node.startTime) / timePerCharacter);
      const bar = padRight("", offset) + padRight("", length, "=");
      const displayName = node.request ? node.request.url : node.type;
      console.log(padRight(bar, widthInCharacters), `| ${displayName.slice(0, 50)}`);
    });
    console.log();
    nodes.forEach((node) => {
      const displayName = node.request ? node.request.url : node.type;
      console.log(nodeToLabel.get(node), displayName.slice(0, widthInCharacters - 5));
      for (const child of node.dependents) {
        const displayName2 = child.request ? child.request.url : child.type;
        console.log("  ->", nodeToLabel.get(child), displayName2.slice(0, widthInCharacters - 10));
      }
      console.log();
    });
    const cyclePath = NetworkNode.findCycle(rootNode);
    console.log("Cycle?", cyclePath ? "yes" : "no");
    if (cyclePath) {
      const path = [...cyclePath];
      path.push(path[0]);
      console.log(path.map((node) => nodeToLabel.get(node)).join(" -> "));
    }
  }
}
export { PageDependencyGraph };
//# sourceMappingURL=PageDependencyGraph.js.map
