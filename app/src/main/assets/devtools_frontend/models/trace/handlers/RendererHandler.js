"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as auctionWorkletsData } from "./AuctionWorkletsHandler.js";
import * as HandlerHelpers from "./helpers.js";
import { data as metaHandlerData } from "./MetaHandler.js";
import { data as networkRequestHandlerData } from "./NetworkRequestsHandler.js";
import { data as samplesHandlerData } from "./SamplesHandler.js";
let processes = /* @__PURE__ */ new Map();
let entityMappings = {
  eventsByEntity: /* @__PURE__ */ new Map(),
  entityByEvent: /* @__PURE__ */ new Map(),
  createdEntityCache: /* @__PURE__ */ new Map(),
  entityByUrlCache: /* @__PURE__ */ new Map()
};
let compositorTileWorkers = Array();
let entryToNode = /* @__PURE__ */ new Map();
let completeEventStack = [];
let config = Types.Configuration.defaults();
const makeRendererProcess = () => ({
  url: null,
  isOnMainFrame: false,
  threads: /* @__PURE__ */ new Map()
});
const makeRendererThread = () => ({
  name: null,
  entries: [],
  profileCalls: [],
  layoutEvents: [],
  recalcStyleEvents: []
});
const getOrCreateRendererProcess = (processes2, pid) => {
  return Platform.MapUtilities.getWithDefault(processes2, pid, makeRendererProcess);
};
const getOrCreateRendererThread = (process, tid) => {
  return Platform.MapUtilities.getWithDefault(process.threads, tid, makeRendererThread);
};
export function handleUserConfig(userConfig) {
  config = userConfig;
}
export function reset() {
  processes = /* @__PURE__ */ new Map();
  entryToNode = /* @__PURE__ */ new Map();
  entityMappings = {
    eventsByEntity: /* @__PURE__ */ new Map(),
    entityByEvent: /* @__PURE__ */ new Map(),
    createdEntityCache: /* @__PURE__ */ new Map(),
    entityByUrlCache: /* @__PURE__ */ new Map()
  };
  completeEventStack = [];
  compositorTileWorkers = [];
}
export function handleEvent(event) {
  if (Types.Events.isThreadName(event) && event.args.name?.startsWith("CompositorTileWorker")) {
    compositorTileWorkers.push({
      pid: event.pid,
      tid: event.tid
    });
  }
  if (Types.Events.isBegin(event) || Types.Events.isEnd(event)) {
    const process = getOrCreateRendererProcess(processes, event.pid);
    const thread = getOrCreateRendererThread(process, event.tid);
    const completeEvent = makeCompleteEvent(event);
    if (!completeEvent) {
      return;
    }
    thread.entries.push(completeEvent);
    return;
  }
  if (Types.Events.isInstant(event) || Types.Events.isComplete(event)) {
    const process = getOrCreateRendererProcess(processes, event.pid);
    const thread = getOrCreateRendererThread(process, event.tid);
    thread.entries.push(event);
  }
  if (Types.Events.isLayout(event)) {
    const process = getOrCreateRendererProcess(processes, event.pid);
    const thread = getOrCreateRendererThread(process, event.tid);
    thread.layoutEvents.push(event);
  }
  if (Types.Events.isRecalcStyle(event)) {
    const process = getOrCreateRendererProcess(processes, event.pid);
    const thread = getOrCreateRendererThread(process, event.tid);
    thread.recalcStyleEvents.push(event);
  }
}
export async function finalize() {
  const { mainFrameId, rendererProcessesByFrame, threadsInProcess } = metaHandlerData();
  entityMappings = networkRequestHandlerData().entityMappings;
  assignMeta(processes, mainFrameId, rendererProcessesByFrame, threadsInProcess);
  sanitizeProcesses(processes);
  buildHierarchy(processes);
  sanitizeThreads(processes);
}
export function data() {
  return {
    processes,
    compositorTileWorkers: gatherCompositorThreads(),
    entryToNode,
    entityMappings: {
      entityByEvent: entityMappings.entityByEvent,
      eventsByEntity: entityMappings.eventsByEntity,
      createdEntityCache: entityMappings.createdEntityCache,
      entityByUrlCache: entityMappings.entityByUrlCache
    }
  };
}
function gatherCompositorThreads() {
  const threadsByProcess = /* @__PURE__ */ new Map();
  for (const worker of compositorTileWorkers) {
    const byProcess = threadsByProcess.get(worker.pid) || [];
    byProcess.push(worker.tid);
    threadsByProcess.set(worker.pid, byProcess);
  }
  return threadsByProcess;
}
export function assignMeta(processes2, mainFrameId, rendererProcessesByFrame, threadsInProcess) {
  assignOrigin(processes2, rendererProcessesByFrame);
  assignIsMainFrame(processes2, mainFrameId, rendererProcessesByFrame);
  assignThreadName(processes2, threadsInProcess);
}
export function assignOrigin(processes2, rendererProcessesByFrame) {
  for (const renderProcessesByPid of rendererProcessesByFrame.values()) {
    for (const [pid, processWindows] of renderProcessesByPid) {
      for (const processInfo of processWindows.flat()) {
        const process = getOrCreateRendererProcess(processes2, pid);
        if (process.url === null || process.url === "about:blank") {
          try {
            new URL(processInfo.frame.url);
            process.url = processInfo.frame.url;
          } catch {
            process.url = null;
          }
        }
      }
    }
  }
}
export function assignIsMainFrame(processes2, mainFrameId, rendererProcessesByFrame) {
  for (const [frameId, renderProcessesByPid] of rendererProcessesByFrame) {
    for (const [pid] of renderProcessesByPid) {
      const process = getOrCreateRendererProcess(processes2, pid);
      if (frameId === mainFrameId) {
        process.isOnMainFrame = true;
      }
    }
  }
}
export function assignThreadName(processes2, threadsInProcess) {
  for (const [pid, process] of processes2) {
    for (const [tid, threadInfo] of threadsInProcess.get(pid) ?? []) {
      const thread = getOrCreateRendererThread(process, tid);
      thread.name = threadInfo?.args.name ?? `${tid}`;
    }
  }
}
export function sanitizeProcesses(processes2) {
  const auctionWorklets = auctionWorkletsData().worklets;
  const metaData = metaHandlerData();
  if (metaData.traceIsGeneric) {
    return;
  }
  for (const [pid, process] of processes2) {
    if (process.url === null) {
      const maybeWorklet = auctionWorklets.get(pid);
      if (maybeWorklet) {
        process.url = maybeWorklet.host;
      } else {
        processes2.delete(pid);
      }
      continue;
    }
  }
}
export function sanitizeThreads(processes2) {
  for (const [, process] of processes2) {
    for (const [tid, thread] of process.threads) {
      if (!thread.tree?.roots.size) {
        process.threads.delete(tid);
      }
    }
  }
}
export function buildHierarchy(processes2, options) {
  const samplesData = samplesHandlerData();
  for (const [pid, process] of processes2) {
    for (const [tid, thread] of process.threads) {
      if (!thread.entries.length) {
        thread.tree = Helpers.TreeHelpers.makeEmptyTraceEntryTree();
        continue;
      }
      Helpers.Trace.sortTraceEventsInPlace(thread.entries);
      const samplesDataForThread = samplesData.profilesInProcess.get(pid)?.get(tid);
      if (samplesDataForThread) {
        const cpuProfile = samplesDataForThread.parsedProfile;
        const samplesIntegrator = cpuProfile && new Helpers.SamplesIntegrator.SamplesIntegrator(
          cpuProfile,
          samplesDataForThread.profileId,
          pid,
          tid,
          config
        );
        const profileCalls = samplesIntegrator?.buildProfileCalls(thread.entries);
        if (samplesIntegrator && profileCalls) {
          thread.entries = Helpers.Trace.mergeEventsInOrder(thread.entries, profileCalls);
          thread.profileCalls = profileCalls;
          const jsSamples = samplesIntegrator.jsSampleEvents;
          if (jsSamples.length) {
            thread.entries = Helpers.Trace.mergeEventsInOrder(thread.entries, jsSamples);
          }
        }
      }
      const treeData = Helpers.TreeHelpers.treify(thread.entries, options);
      thread.tree = treeData.tree;
      for (const [entry, node] of treeData.entryToNode) {
        entryToNode.set(entry, node);
        HandlerHelpers.addEventToEntityMapping(entry, entityMappings);
      }
    }
  }
}
export function makeCompleteEvent(event) {
  if (Types.Events.isEnd(event)) {
    const beginEvent = completeEventStack.pop();
    if (!beginEvent) {
      return null;
    }
    if (beginEvent.name !== event.name || beginEvent.cat !== event.cat) {
      console.error(
        "Begin/End events mismatch at " + beginEvent.ts + " (" + beginEvent.name + ") vs. " + event.ts + " (" + event.name + ")"
      );
      return null;
    }
    beginEvent.dur = Types.Timing.Micro(event.ts - beginEvent.ts);
    return null;
  }
  const syntheticComplete = {
    ...event,
    ph: Types.Events.Phase.COMPLETE,
    dur: Types.Timing.Micro(0)
  };
  completeEventStack.push(syntheticComplete);
  return syntheticComplete;
}
export function deps() {
  return ["Meta", "Samples", "AuctionWorklets", "NetworkRequests"];
}
//# sourceMappingURL=RendererHandler.js.map
