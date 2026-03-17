"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
export const stackTraceForEventInTrace = /* @__PURE__ */ new Map();
export function clearCacheForTrace(data) {
  stackTraceForEventInTrace.delete(data);
}
export function get(event, data) {
  let cacheForTrace = stackTraceForEventInTrace.get(data);
  if (!cacheForTrace) {
    cacheForTrace = /* @__PURE__ */ new Map();
    stackTraceForEventInTrace.set(data, cacheForTrace);
  }
  const resultFromCache = cacheForTrace.get(event);
  if (resultFromCache) {
    return resultFromCache;
  }
  let result = null;
  if (Types.Extensions.isSyntheticExtensionEntry(event)) {
    result = getForExtensionEntry(event, data);
  } else if (Types.Events.isPerformanceMeasureBegin(event)) {
    result = getForPerformanceMeasure(event, data);
  } else {
    result = getForEvent(event, data);
    const payloadCallFrames = getTraceEventPayloadStackAsProtocolCallFrame(event).filter((callFrame) => !isNativeJSFunction(callFrame));
    if (!result.callFrames.length) {
      result.callFrames = payloadCallFrames;
    } else {
      for (let i = 0; i < payloadCallFrames.length && i < result.callFrames.length; i++) {
        result.callFrames[i] = payloadCallFrames[i];
      }
    }
  }
  if (result) {
    cacheForTrace.set(event, result);
  }
  return result;
}
function getForEvent(event, data) {
  const entryToNode = data.Renderer.entryToNode.size > 0 ? data.Renderer.entryToNode : data.Samples.entryToNode;
  const topStackTrace = { callFrames: [] };
  let stackTrace = topStackTrace;
  let currentEntry;
  let node = entryToNode.get(event);
  const traceCache = stackTraceForEventInTrace.get(data) || /* @__PURE__ */ new Map();
  stackTraceForEventInTrace.set(data, traceCache);
  while (node) {
    if (!Types.Events.isProfileCall(node.entry)) {
      const maybeAsyncParent = data.AsyncJSCalls.runEntryPointToScheduler.get(node.entry);
      if (!maybeAsyncParent) {
        node = node.parent;
        continue;
      }
      const maybeAsyncParentNode2 = maybeAsyncParent && entryToNode.get(maybeAsyncParent.scheduler);
      if (maybeAsyncParentNode2) {
        stackTrace = addAsyncParentToStack(stackTrace, maybeAsyncParent.taskName);
        node = maybeAsyncParentNode2;
      }
      continue;
    }
    currentEntry = node.entry;
    const stackTraceFromCache = traceCache.get(node.entry);
    if (stackTraceFromCache) {
      stackTrace.callFrames.push(...stackTraceFromCache.callFrames.filter((callFrame) => !isNativeJSFunction(callFrame)));
      stackTrace.parent = stackTraceFromCache.parent;
      stackTrace.description = stackTrace.description || stackTraceFromCache.description;
      break;
    }
    if (!isNativeJSFunction(currentEntry.callFrame)) {
      stackTrace.callFrames.push(currentEntry.callFrame);
    }
    const maybeAsyncParentEvent = data.AsyncJSCalls.asyncCallToScheduler.get(currentEntry);
    const maybeAsyncParentNode = maybeAsyncParentEvent && entryToNode.get(maybeAsyncParentEvent.scheduler);
    if (maybeAsyncParentNode) {
      stackTrace = addAsyncParentToStack(stackTrace, maybeAsyncParentEvent.taskName);
      node = maybeAsyncParentNode;
      continue;
    }
    node = node.parent;
  }
  return topStackTrace;
}
function addAsyncParentToStack(stackTrace, taskName) {
  const parent = { callFrames: [] };
  stackTrace.parent = parent;
  parent.description = taskName;
  return parent;
}
function getForExtensionEntry(event, data) {
  const rawEvent = event.rawSourceEvent;
  if (Types.Events.isPerformanceMeasureBegin(rawEvent)) {
    return getForPerformanceMeasure(rawEvent, data);
  }
  if (!rawEvent) {
    return null;
  }
  return get(rawEvent, data);
}
function getForPerformanceMeasure(event, data) {
  let rawEvent = event;
  if (event.args.traceId === void 0) {
    return null;
  }
  rawEvent = data.UserTimings.measureTraceByTraceId.get(event.args.traceId);
  if (!rawEvent) {
    return null;
  }
  return get(rawEvent, data);
}
function isNativeJSFunction({ columnNumber, lineNumber, url, scriptId }) {
  return lineNumber === -1 && columnNumber === -1 && url === "" && scriptId === "0";
}
function getTraceEventPayloadStackAsProtocolCallFrame(event) {
  const payloadCallStack = Helpers.Trace.getZeroIndexedStackTraceInEventPayload(event) || [];
  const callFrames = [];
  for (const frame of payloadCallStack) {
    callFrames.push({ ...frame, scriptId: String(frame.scriptId) });
  }
  return callFrames;
}
//# sourceMappingURL=StackTraceForEvent.js.map
