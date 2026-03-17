"use strict";
export var ThreadType = /* @__PURE__ */ ((ThreadType2) => {
  ThreadType2["MAIN_THREAD"] = "MAIN_THREAD";
  ThreadType2["WORKER"] = "WORKER";
  ThreadType2["RASTERIZER"] = "RASTERIZER";
  ThreadType2["AUCTION_WORKLET"] = "AUCTION_WORKLET";
  ThreadType2["OTHER"] = "OTHER";
  ThreadType2["CPU_PROFILE"] = "CPU_PROFILE";
  ThreadType2["THREAD_POOL"] = "THREAD_POOL";
  return ThreadType2;
})(ThreadType || {});
function getThreadTypeForRendererThread(pid, thread, auctionWorkletsData) {
  let threadType = "OTHER" /* OTHER */;
  if (thread.name === "CrRendererMain") {
    threadType = "MAIN_THREAD" /* MAIN_THREAD */;
  } else if (thread.name === "DedicatedWorker thread") {
    threadType = "WORKER" /* WORKER */;
  } else if (thread.name?.startsWith("CompositorTileWorker")) {
    threadType = "RASTERIZER" /* RASTERIZER */;
  } else if (auctionWorkletsData.worklets.has(pid)) {
    threadType = "AUCTION_WORKLET" /* AUCTION_WORKLET */;
  } else if (thread.name?.startsWith("ThreadPool")) {
    threadType = "THREAD_POOL" /* THREAD_POOL */;
  }
  return threadType;
}
export function threadsInRenderer(rendererData, auctionWorkletsData) {
  const foundThreads = [];
  if (rendererData.processes.size) {
    for (const [pid, process] of rendererData.processes) {
      for (const [tid, thread] of process.threads) {
        if (!thread.tree) {
          continue;
        }
        const threadType = getThreadTypeForRendererThread(pid, thread, auctionWorkletsData);
        foundThreads.push({
          name: thread.name,
          pid,
          tid,
          processIsOnMainFrame: process.isOnMainFrame,
          entries: thread.entries,
          tree: thread.tree,
          type: threadType,
          entryToNode: rendererData.entryToNode
        });
      }
    }
  }
  return foundThreads;
}
const threadsInHandlerDataCache = /* @__PURE__ */ new WeakMap();
export function threadsInTrace(handlerData) {
  const cached = threadsInHandlerDataCache.get(handlerData);
  if (cached) {
    return cached;
  }
  const threadsFromRenderer = threadsInRenderer(handlerData.Renderer, handlerData.AuctionWorklets);
  if (threadsFromRenderer.length) {
    threadsInHandlerDataCache.set(handlerData, threadsFromRenderer);
    return threadsFromRenderer;
  }
  const foundThreads = [];
  if (handlerData.Samples.profilesInProcess.size) {
    for (const [pid, process] of handlerData.Samples.profilesInProcess) {
      for (const [tid, thread] of process) {
        if (!thread.profileTree) {
          continue;
        }
        foundThreads.push({
          pid,
          tid,
          // CPU Profile threads do not have a name.
          name: null,
          entries: thread.profileCalls,
          // There is no concept of a "Main Frame" in a CPU profile.
          processIsOnMainFrame: false,
          tree: thread.profileTree,
          type: "CPU_PROFILE" /* CPU_PROFILE */,
          entryToNode: handlerData.Samples.entryToNode
        });
      }
    }
  }
  threadsInHandlerDataCache.set(handlerData, foundThreads);
  return foundThreads;
}
//# sourceMappingURL=Threads.js.map
