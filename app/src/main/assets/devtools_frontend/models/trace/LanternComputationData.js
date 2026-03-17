"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as Handlers from "./handlers/handlers.js";
import * as Lantern from "./lantern/lantern.js";
function createProcessedNavigation(data, frameId, navigation) {
  const scoresByNav = data.PageLoadMetrics.metricScoresByFrameId.get(frameId);
  if (!scoresByNav) {
    throw new Lantern.Core.LanternError("missing metric scores for frame");
  }
  const scores = scoresByNav.get(navigation);
  if (!scores) {
    throw new Lantern.Core.LanternError("missing metric scores for specified navigation");
  }
  const getTimestampOrUndefined = (metric) => {
    const metricScore = scores.get(metric);
    if (!metricScore?.event) {
      return;
    }
    return metricScore.event.ts;
  };
  const getTimestamp = (metric) => {
    const metricScore = scores.get(metric);
    if (!metricScore?.event) {
      throw new Lantern.Core.LanternError(`missing metric: ${metric}`);
    }
    return metricScore.event.ts;
  };
  return {
    timestamps: {
      firstContentfulPaint: getTimestamp(Handlers.ModelHandlers.PageLoadMetrics.MetricName.FCP),
      largestContentfulPaint: getTimestampOrUndefined(Handlers.ModelHandlers.PageLoadMetrics.MetricName.LCP)
    }
  };
}
function createParsedUrl(url) {
  if (typeof url === "string") {
    url = new URL(url);
  }
  return {
    scheme: url.protocol.split(":")[0],
    // Intentional, DevTools uses different terminology
    host: url.hostname,
    securityOrigin: url.origin
  };
}
function findWorkerThreads(trace) {
  const workerThreads = /* @__PURE__ */ new Map();
  const workerCreationEvents = ["ServiceWorker thread", "DedicatedWorker thread"];
  for (const event of trace.traceEvents) {
    if (event.name !== "thread_name" || !event.args.name) {
      continue;
    }
    if (!workerCreationEvents.includes(event.args.name)) {
      continue;
    }
    const tids = workerThreads.get(event.pid);
    if (tids) {
      tids.push(event.tid);
    } else {
      workerThreads.set(event.pid, [event.tid]);
    }
  }
  return workerThreads;
}
function createLanternRequest(parsedTrace, workerThreads, request) {
  if (request.args.data.hasResponse && request.args.data.connectionId === void 0) {
    throw new Lantern.Core.LanternError("Trace is too old");
  }
  let url;
  try {
    url = new URL(request.args.data.url);
  } catch {
    return;
  }
  const timing = request.args.data.timing ? {
    // These two timings are not included in the trace.
    workerFetchStart: -1,
    workerRespondWithSettled: -1,
    receiveHeadersStart: -1,
    ...request.args.data.timing
  } : void 0;
  const networkRequestTime = timing ? timing.requestTime * 1e3 : request.args.data.syntheticData.downloadStart / 1e3;
  let fromWorker = false;
  const tids = workerThreads.get(request.pid);
  if (tids?.includes(request.tid)) {
    fromWorker = true;
  }
  if (parsedTrace.Workers.workerIdByThread.has(request.tid)) {
    fromWorker = true;
  }
  const initiator = request.args.data.initiator ?? { type: Protocol.Network.InitiatorType.Other };
  if (request.args.data.stackTrace) {
    const callFrames = request.args.data.stackTrace.map((f) => {
      return {
        scriptId: String(f.scriptId),
        url: f.url,
        lineNumber: f.lineNumber - 1,
        columnNumber: f.columnNumber - 1,
        functionName: f.functionName
      };
    });
    initiator.stack = { callFrames };
  }
  let resourceType = request.args.data.resourceType;
  if (request.args.data.initiator?.fetchType === "xmlhttprequest") {
    resourceType = "XHR";
  } else if (request.args.data.initiator?.fetchType === "fetch") {
    resourceType = "Fetch";
  }
  let resourceSize = request.args.data.decodedBodyLength ?? 0;
  if (url.protocol === "data:" && resourceSize === 0) {
    const commaIndex = url.pathname.indexOf(",");
    if (url.pathname.substring(0, commaIndex).includes(";base64")) {
      resourceSize = atob(url.pathname.substring(commaIndex + 1)).length;
    } else {
      resourceSize = url.pathname.length - commaIndex - 1;
    }
  }
  return {
    rawRequest: request,
    requestId: request.args.data.requestId,
    connectionId: request.args.data.connectionId ?? 0,
    connectionReused: request.args.data.connectionReused ?? false,
    url: request.args.data.url,
    protocol: request.args.data.protocol,
    parsedURL: createParsedUrl(url),
    documentURL: request.args.data.requestingFrameUrl,
    rendererStartTime: request.ts / 1e3,
    networkRequestTime,
    responseHeadersEndTime: request.args.data.syntheticData.downloadStart / 1e3,
    networkEndTime: request.args.data.syntheticData.finishTime / 1e3,
    transferSize: request.args.data.encodedDataLength,
    resourceSize,
    fromDiskCache: request.args.data.syntheticData.isDiskCached,
    fromMemoryCache: request.args.data.syntheticData.isMemoryCached,
    isLinkPreload: request.args.data.isLinkPreload,
    finished: request.args.data.finished,
    failed: request.args.data.failed,
    statusCode: request.args.data.statusCode,
    initiator,
    timing,
    resourceType,
    mimeType: request.args.data.mimeType,
    priority: request.args.data.priority,
    frameId: request.args.data.frame,
    fromWorker,
    serverResponseTime: request.args.data.lrServerResponseTime
  };
}
function chooseInitiatorRequest(request, requestsByURL) {
  if (request.redirectSource) {
    return request.redirectSource;
  }
  const initiatorURL = Lantern.Graph.PageDependencyGraph.getNetworkInitiators(request)[0];
  let candidates = requestsByURL.get(initiatorURL) || [];
  candidates = candidates.filter((c) => {
    return c.responseHeadersEndTime <= request.rendererStartTime && c.finished && !c.failed;
  });
  if (candidates.length > 1) {
    const nonPrefetchCandidates = candidates.filter((cand) => cand.resourceType !== Lantern.Types.NetworkRequestTypes.Other);
    if (nonPrefetchCandidates.length) {
      candidates = nonPrefetchCandidates;
    }
  }
  if (candidates.length > 1) {
    const sameFrameCandidates = candidates.filter((cand) => cand.frameId === request.frameId);
    if (sameFrameCandidates.length) {
      candidates = sameFrameCandidates;
    }
  }
  if (candidates.length > 1 && request.initiator.type === "parser") {
    const documentCandidates = candidates.filter((cand) => cand.resourceType === Lantern.Types.NetworkRequestTypes.Document);
    if (documentCandidates.length) {
      candidates = documentCandidates;
    }
  }
  if (candidates.length > 1) {
    const linkPreloadCandidates = candidates.filter((c) => c.isLinkPreload);
    if (linkPreloadCandidates.length) {
      const nonPreloadCandidates = candidates.filter((c) => !c.isLinkPreload);
      const allPreloaded = nonPreloadCandidates.every((c) => c.fromDiskCache || c.fromMemoryCache);
      if (nonPreloadCandidates.length && allPreloaded) {
        candidates = linkPreloadCandidates;
      }
    }
  }
  return candidates.length === 1 ? candidates[0] : null;
}
function linkInitiators(lanternRequests) {
  const requestsByURL = /* @__PURE__ */ new Map();
  for (const request of lanternRequests) {
    const requests = requestsByURL.get(request.url) || [];
    requests.push(request);
    requestsByURL.set(request.url, requests);
  }
  for (const request of lanternRequests) {
    const initiatorRequest = chooseInitiatorRequest(request, requestsByURL);
    if (initiatorRequest) {
      request.initiatorRequest = initiatorRequest;
    }
  }
}
function createNetworkRequests(trace, data, startTime = 0, endTime = Number.POSITIVE_INFINITY) {
  const workerThreads = findWorkerThreads(trace);
  const lanternRequestsNoRedirects = [];
  for (const request of data.NetworkRequests.byTime) {
    if (request.ts >= startTime && request.ts < endTime) {
      const lanternRequest = createLanternRequest(data, workerThreads, request);
      if (lanternRequest) {
        lanternRequestsNoRedirects.push(lanternRequest);
      }
    }
  }
  const lanternRequests = [];
  for (const request of [...lanternRequestsNoRedirects]) {
    if (!request.rawRequest) {
      continue;
    }
    const redirects = request.rawRequest.args.data.redirects;
    if (!redirects.length) {
      lanternRequests.push(request);
      continue;
    }
    const requestChain = [];
    for (const redirect of redirects) {
      const redirectedRequest = structuredClone(request);
      redirectedRequest.networkRequestTime = redirect.ts / 1e3;
      redirectedRequest.rendererStartTime = redirectedRequest.networkRequestTime;
      redirectedRequest.networkEndTime = (redirect.ts + redirect.dur) / 1e3;
      redirectedRequest.responseHeadersEndTime = redirectedRequest.networkEndTime;
      redirectedRequest.timing = {
        requestTime: redirectedRequest.networkRequestTime / 1e3,
        receiveHeadersStart: redirectedRequest.responseHeadersEndTime,
        receiveHeadersEnd: redirectedRequest.responseHeadersEndTime,
        proxyStart: -1,
        proxyEnd: -1,
        dnsStart: -1,
        dnsEnd: -1,
        connectStart: -1,
        connectEnd: -1,
        sslStart: -1,
        sslEnd: -1,
        sendStart: -1,
        sendEnd: -1,
        workerStart: -1,
        workerReady: -1,
        workerFetchStart: -1,
        workerRespondWithSettled: -1,
        pushStart: -1,
        pushEnd: -1
      };
      redirectedRequest.url = redirect.url;
      redirectedRequest.parsedURL = createParsedUrl(redirect.url);
      redirectedRequest.statusCode = 302;
      redirectedRequest.resourceType = void 0;
      redirectedRequest.transferSize = 400;
      requestChain.push(redirectedRequest);
      lanternRequests.push(redirectedRequest);
    }
    requestChain.push(request);
    lanternRequests.push(request);
    for (let i = 0; i < requestChain.length; i++) {
      const request2 = requestChain[i];
      if (i > 0) {
        request2.redirectSource = requestChain[i - 1];
        request2.redirects = requestChain.slice(0, i);
      }
      if (i !== requestChain.length - 1) {
        request2.redirectDestination = requestChain[i + 1];
      }
    }
    for (let i = 1; i < requestChain.length; i++) {
      requestChain[i].requestId = `${requestChain[i - 1].requestId}:redirect`;
    }
  }
  linkInitiators(lanternRequests);
  return lanternRequests;
}
function collectMainThreadEvents(trace, data) {
  const Meta = data.Meta;
  const mainFramePids = Meta.mainFrameNavigations.length ? new Set(Meta.mainFrameNavigations.map((nav) => nav.pid)) : Meta.topLevelRendererIds;
  const rendererPidToTid = /* @__PURE__ */ new Map();
  for (const pid of mainFramePids) {
    const threads = Meta.threadsInProcess.get(pid) ?? [];
    let found = false;
    for (const [tid, thread] of threads) {
      if (thread.args.name === "CrRendererMain") {
        rendererPidToTid.set(pid, tid);
        found = true;
        break;
      }
    }
    if (found) {
      continue;
    }
    for (const [tid, thread] of threads) {
      if (thread.args.name === "CrBrowserMain") {
        rendererPidToTid.set(pid, tid);
        found = true;
        break;
      }
    }
  }
  return trace.traceEvents.filter((e) => rendererPidToTid.get(e.pid) === e.tid);
}
function createGraph(requests, trace, data, url) {
  const mainThreadEvents = collectMainThreadEvents(trace, data);
  if (!url) {
    url = {
      requestedUrl: requests[0].url,
      mainDocumentUrl: ""
    };
    let request = requests[0];
    while (request.redirectDestination) {
      request = request.redirectDestination;
    }
    url.mainDocumentUrl = request.url;
  }
  return Lantern.Graph.PageDependencyGraph.createGraph(mainThreadEvents, requests, url);
}
export {
  createGraph,
  createNetworkRequests,
  createProcessedNavigation
};
//# sourceMappingURL=LanternComputationData.js.map
