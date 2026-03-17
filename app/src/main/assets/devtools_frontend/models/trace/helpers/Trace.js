"use strict";
import * as Common from "../../../core/common/common.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
import { SyntheticEventsManager } from "./SyntheticEvents.js";
import { eventTimingsMicroSeconds } from "./Timing.js";
export function stackTraceInEvent(event) {
  if (event.args?.data?.stackTrace) {
    return event.args.data.stackTrace;
  }
  if (event.args?.stackTrace) {
    return event.args.stackTrace;
  }
  if (Types.Events.isRecalcStyle(event)) {
    return event.args.beginData?.stackTrace || null;
  }
  if (Types.Events.isLayout(event)) {
    return event.args.beginData.stackTrace ?? null;
  }
  if (Types.Events.isFunctionCall(event)) {
    const data = event.args.data;
    if (!data) {
      return null;
    }
    const { columnNumber, lineNumber, url, scriptId, functionName } = data;
    if (lineNumber === void 0 || functionName === void 0 || columnNumber === void 0 || scriptId === void 0 || url === void 0) {
      return null;
    }
    return [{ columnNumber, lineNumber, url, scriptId, functionName }];
  }
  if (Types.Events.isProfileCall(event)) {
    const callFrame = event.callFrame;
    if (!callFrame) {
      return null;
    }
    const { columnNumber, lineNumber, url, scriptId, functionName } = callFrame;
    if (lineNumber === void 0 || functionName === void 0 || columnNumber === void 0 || scriptId === void 0 || url === void 0) {
      return null;
    }
    return [{ columnNumber, lineNumber, url, scriptId, functionName }];
  }
  return null;
}
export function extractOriginFromTrace(firstNavigationURL) {
  const url = Common.ParsedURL.ParsedURL.fromString(firstNavigationURL);
  if (url) {
    if (url.host.startsWith("www.")) {
      return url.host.slice(4);
    }
    return url.host;
  }
  return null;
}
export function addEventToProcessThread(event, eventsInProcessThread) {
  const { tid, pid } = event;
  let eventsInThread = eventsInProcessThread.get(pid);
  if (!eventsInThread) {
    eventsInThread = /* @__PURE__ */ new Map();
  }
  let events = eventsInThread.get(tid);
  if (!events) {
    events = [];
  }
  events.push(event);
  eventsInThread.set(event.tid, events);
  eventsInProcessThread.set(event.pid, eventsInThread);
}
export function compareBeginAndEnd(aBeginTime, bBeginTime, aEndTime, bEndTime) {
  if (aBeginTime < bBeginTime) {
    return -1;
  }
  if (aBeginTime > bBeginTime) {
    return 1;
  }
  if (aEndTime > bEndTime) {
    return -1;
  }
  if (aEndTime < bEndTime) {
    return 1;
  }
  return 0;
}
export function eventTimeComparator(a, b) {
  const aBeginTime = a.ts;
  const bBeginTime = b.ts;
  const aDuration = a.dur ?? 0;
  const bDuration = b.dur ?? 0;
  const aEndTime = aBeginTime + aDuration;
  const bEndTime = bBeginTime + bDuration;
  const timeDifference = compareBeginAndEnd(aBeginTime, bBeginTime, aEndTime, bEndTime);
  if (timeDifference) {
    return timeDifference;
  }
  if (Types.Events.isProfileCall(a) && !Types.Events.isProfileCall(b)) {
    return -1;
  }
  if (Types.Events.isProfileCall(b) && !Types.Events.isProfileCall(a)) {
    return 1;
  }
  return 0;
}
export function sortTraceEventsInPlace(events) {
  events.sort(eventTimeComparator);
}
export function mergeEventsInOrder(eventsArray1, eventsArray2) {
  const result = [];
  let i = 0;
  let j = 0;
  while (i < eventsArray1.length && j < eventsArray2.length) {
    const event1 = eventsArray1[i];
    const event2 = eventsArray2[j];
    const compareValue = eventTimeComparator(event1, event2);
    if (compareValue <= 0) {
      result.push(event1);
      i++;
    }
    if (compareValue === 1) {
      result.push(event2);
      j++;
    }
  }
  while (i < eventsArray1.length) {
    result.push(eventsArray1[i++]);
  }
  while (j < eventsArray2.length) {
    result.push(eventsArray2[j++]);
  }
  return result;
}
export function parseDevtoolsDetails(timingDetail, key) {
  try {
    const detailObj = JSON.parse(timingDetail);
    if (!(key in detailObj)) {
      return null;
    }
    if (!Types.Extensions.isValidExtensionPayload(detailObj[key])) {
      return null;
    }
    return detailObj[key];
  } catch {
    return null;
  }
}
export function getNavigationForTraceEvent(event, eventFrameId, navigationsByFrameId) {
  const navigations = navigationsByFrameId.get(eventFrameId);
  if (!navigations || eventFrameId === "") {
    return null;
  }
  const eventNavigationIndex = Platform.ArrayUtilities.nearestIndexFromEnd(navigations, (navigation) => navigation.ts <= event.ts);
  if (eventNavigationIndex === null) {
    return null;
  }
  return navigations[eventNavigationIndex];
}
export function extractId(event) {
  return event.id ?? event.id2?.global ?? event.id2?.local;
}
export function activeURLForFrameAtTime(frameId, time, rendererProcessesByFrame) {
  const processData = rendererProcessesByFrame.get(frameId);
  if (!processData) {
    return null;
  }
  for (const processes of processData.values()) {
    for (const processInfo of processes) {
      if (processInfo.window.min > time || processInfo.window.max < time) {
        continue;
      }
      return processInfo.frame.url;
    }
  }
  return null;
}
export function makeProfileCall(node, profileId, sampleIndex, ts, pid, tid) {
  return {
    cat: "",
    name: "ProfileCall",
    nodeId: node.id,
    args: {},
    ph: Types.Events.Phase.COMPLETE,
    pid,
    tid,
    ts,
    dur: Types.Timing.Micro(0),
    callFrame: node.callFrame,
    sampleIndex,
    profileId
  };
}
function matchEvents(unpairedEvents) {
  sortTraceEventsInPlace(unpairedEvents);
  const matches = [];
  const beginEventsById = /* @__PURE__ */ new Map();
  const instantEventsById = /* @__PURE__ */ new Map();
  for (const event of unpairedEvents) {
    const id = getSyntheticId(event);
    if (id === void 0) {
      continue;
    }
    if (Types.Events.isPairableAsyncBegin(event)) {
      const existingEvents = beginEventsById.get(id) ?? [];
      existingEvents.push(event);
      beginEventsById.set(id, existingEvents);
    } else if (Types.Events.isPairableAsyncInstant(event)) {
      const existingEvents = instantEventsById.get(id) ?? [];
      existingEvents.push(event);
      instantEventsById.set(id, existingEvents);
    } else if (Types.Events.isPairableAsyncEnd(event)) {
      const beginEventsWithMatchingId = beginEventsById.get(id) ?? [];
      const beginEvent = beginEventsWithMatchingId.pop();
      if (!beginEvent) {
        continue;
      }
      const instantEventsWithMatchingId = instantEventsById.get(id) ?? [];
      const instantEventsForThisGroup = [];
      while (instantEventsWithMatchingId.length > 0) {
        if (instantEventsWithMatchingId[0].ts >= beginEvent.ts) {
          const event2 = instantEventsWithMatchingId.pop();
          if (event2) {
            instantEventsForThisGroup.push(event2);
          }
        } else {
          break;
        }
      }
      const matchingGroup = {
        begin: beginEvent,
        end: event,
        instant: instantEventsForThisGroup,
        syntheticId: id
      };
      matches.push(matchingGroup);
    }
  }
  for (const [id, beginEvents] of beginEventsById) {
    const beginEvent = beginEvents.pop();
    if (!beginEvent) {
      continue;
    }
    const matchingInstantEvents = instantEventsById.get(id);
    if (matchingInstantEvents?.length) {
      matches.push({
        syntheticId: id,
        begin: beginEvent,
        end: null,
        instant: matchingInstantEvents
      });
    }
  }
  return matches;
}
export function getSyntheticId(event) {
  const id = extractId(event);
  return id && `${event.cat}:${id}:${event.name}`;
}
function createSortedSyntheticEvents(matchedPairs) {
  const syntheticEvents = [];
  for (const eventsTriplet of matchedPairs) {
    let eventsArePairable2 = function(data) {
      const instantEventsMatch = data.instantEvents ? data.instantEvents.some((e) => id === getSyntheticId(e)) : false;
      const endEventMatch = data.endEvent ? id === getSyntheticId(data.endEvent) : false;
      return Boolean(id) && (instantEventsMatch || endEventMatch);
    };
    var eventsArePairable = eventsArePairable2;
    const id = eventsTriplet.syntheticId;
    const beginEvent = eventsTriplet.begin;
    const endEvent = eventsTriplet.end;
    const instantEvents = eventsTriplet.instant;
    if (!beginEvent || !(endEvent || instantEvents)) {
      continue;
    }
    const triplet = { beginEvent, endEvent, instantEvents };
    if (!eventsArePairable2(triplet)) {
      continue;
    }
    const targetEvent = endEvent || beginEvent;
    const event = SyntheticEventsManager.registerSyntheticEvent({
      rawSourceEvent: triplet.beginEvent,
      cat: targetEvent.cat,
      ph: targetEvent.ph,
      pid: targetEvent.pid,
      tid: targetEvent.tid,
      id,
      // Both events have the same name, so it doesn't matter which we pick to
      // use as the description
      name: beginEvent.name,
      dur: Types.Timing.Micro(targetEvent.ts - beginEvent.ts),
      ts: beginEvent.ts,
      args: {
        data: triplet
      }
    });
    if (event.dur < 0) {
      continue;
    }
    syntheticEvents.push(event);
  }
  sortTraceEventsInPlace(syntheticEvents);
  return syntheticEvents;
}
export function createMatchedSortedSyntheticEvents(unpairedAsyncEvents) {
  const matchedPairs = matchEvents(unpairedAsyncEvents);
  const syntheticEvents = createSortedSyntheticEvents(matchedPairs);
  return syntheticEvents;
}
export function getZeroIndexedLineAndColumnForEvent(event) {
  const numbers = getRawLineAndColumnNumbersForEvent(event);
  const { lineNumber, columnNumber } = numbers;
  switch (event.name) {
    // All these events have line/column numbers which are 1 indexed; so we
    // subtract to make them 0 indexed.
    case Types.Events.Name.FUNCTION_CALL:
    case Types.Events.Name.EVALUATE_SCRIPT:
    case Types.Events.Name.COMPILE:
    case Types.Events.Name.CACHE_SCRIPT: {
      return {
        lineNumber: typeof lineNumber === "number" ? lineNumber - 1 : void 0,
        columnNumber: typeof columnNumber === "number" ? columnNumber - 1 : void 0
      };
    }
    case Types.Events.Name.PROFILE_CALL: {
      const callFrame = event.callFrame;
      return {
        lineNumber: typeof lineNumber === "number" ? callFrame.lineNumber - 1 : void 0,
        columnNumber: typeof columnNumber === "number" ? callFrame.columnNumber - 1 : void 0
      };
    }
    default: {
      return numbers;
    }
  }
}
export function getZeroIndexedStackTraceInEventPayload(event) {
  const stack = stackTraceInEvent(event);
  if (!stack) {
    return null;
  }
  switch (event.name) {
    case Types.Events.Name.SCHEDULE_STYLE_RECALCULATION:
    case Types.Events.Name.INVALIDATE_LAYOUT:
    case Types.Events.Name.FUNCTION_CALL:
    case Types.Events.Name.LAYOUT:
    case Types.Events.Name.RECALC_STYLE: {
      return stack.map(makeZeroBasedCallFrame);
    }
    default: {
      if (Types.Events.isUserTiming(event) || Types.Extensions.isSyntheticExtensionEntry(event)) {
        return stack.map(makeZeroBasedCallFrame);
      }
      return stack;
    }
  }
}
export function getStackTraceTopCallFrameInEventPayload(event) {
  const stack = stackTraceInEvent(event);
  if (!stack || stack.length === 0) {
    return null;
  }
  switch (event.name) {
    case Types.Events.Name.SCHEDULE_STYLE_RECALCULATION:
    case Types.Events.Name.INVALIDATE_LAYOUT:
    case Types.Events.Name.FUNCTION_CALL:
    case Types.Events.Name.LAYOUT:
    case Types.Events.Name.RECALC_STYLE: {
      return makeZeroBasedCallFrame(stack[0]);
    }
    default: {
      if (Types.Events.isUserTiming(event) || Types.Extensions.isSyntheticExtensionEntry(event)) {
        return makeZeroBasedCallFrame(stack[0]);
      }
      return stack[0];
    }
  }
}
export function rawCallFrameForEntry(entry) {
  if (Types.Events.isProfileCall(entry)) {
    return entry.callFrame;
  }
  const topCallFrame = getStackTraceTopCallFrameInEventPayload(entry);
  if (topCallFrame) {
    return topCallFrame;
  }
  return null;
}
export function makeZeroBasedCallFrame(callFrame) {
  const normalizedCallFrame = { ...callFrame };
  normalizedCallFrame.lineNumber = callFrame.lineNumber && callFrame.lineNumber - 1;
  normalizedCallFrame.columnNumber = callFrame.columnNumber && callFrame.columnNumber - 1;
  return normalizedCallFrame;
}
function getRawLineAndColumnNumbersForEvent(event) {
  if (!event.args?.data) {
    return {};
  }
  let lineNumber = void 0;
  let columnNumber = void 0;
  if ("lineNumber" in event.args.data && typeof event.args.data.lineNumber === "number") {
    lineNumber = event.args.data.lineNumber;
  }
  if ("columnNumber" in event.args.data && typeof event.args.data.columnNumber === "number") {
    columnNumber = event.args.data.columnNumber;
  }
  return { lineNumber, columnNumber };
}
export function frameIDForEvent(event) {
  if (event.args && "beginData" in event.args && typeof event.args.beginData === "object" && event.args.beginData !== null && "frame" in event.args.beginData && typeof event.args.beginData.frame === "string") {
    return event.args.beginData.frame;
  }
  if (event.args?.data?.frame) {
    return event.args.data.frame;
  }
  return null;
}
const DevToolsTimelineEventCategory = "disabled-by-default-devtools.timeline";
export function isTopLevelEvent(event) {
  return event.cat.includes(DevToolsTimelineEventCategory) && event.name === Types.Events.Name.RUN_TASK;
}
export function isExtensionUrl(url) {
  return url.startsWith("extensions:") || url.startsWith("chrome-extension:");
}
function topLevelEventIndexEndingAfter(events, time) {
  let index = Platform.ArrayUtilities.upperBound(events, time, (time2, event) => time2 - event.ts) - 1;
  while (index > 0 && !isTopLevelEvent(events[index])) {
    index--;
  }
  return Math.max(index, 0);
}
export function findRecalcStyleEvents(events, startTime, endTime) {
  const foundEvents = [];
  const startEventIndex = topLevelEventIndexEndingAfter(events, startTime);
  for (let i = startEventIndex; i < events.length; i++) {
    const event = events[i];
    if (!Types.Events.isRecalcStyle(event)) {
      continue;
    }
    if (event.ts >= (endTime || Infinity)) {
      continue;
    }
    foundEvents.push(event);
  }
  return foundEvents;
}
export function findNextEventAfterTimestamp(candidates, ts) {
  const index = Platform.ArrayUtilities.nearestIndexFromBeginning(candidates, (candidate) => ts < candidate.ts);
  return index === null ? null : candidates[index];
}
export function findPreviousEventBeforeTimestamp(candidates, ts) {
  const index = Platform.ArrayUtilities.nearestIndexFromEnd(candidates, (candidate) => candidate.ts < ts);
  return index === null ? null : candidates[index];
}
export function forEachEvent(events, config) {
  const globalStartTime = config.startTime ?? Types.Timing.Micro(0);
  const globalEndTime = config.endTime || Types.Timing.Micro(Infinity);
  const ignoreAsyncEvents = config.ignoreAsyncEvents === false ? false : true;
  const stack = [];
  const startEventIndex = topLevelEventIndexEndingAfter(events, globalStartTime);
  for (let i = startEventIndex; i < events.length; i++) {
    const currentEvent = events[i];
    const currentEventTimings = eventTimingsMicroSeconds(currentEvent);
    if (currentEventTimings.endTime < globalStartTime) {
      continue;
    }
    if (currentEventTimings.startTime > globalEndTime) {
      break;
    }
    const isIgnoredAsyncEvent = ignoreAsyncEvents && Types.Events.isPhaseAsync(currentEvent.ph);
    if (isIgnoredAsyncEvent || Types.Events.isFlowPhase(currentEvent.ph)) {
      continue;
    }
    let lastEventOnStack = stack.at(-1);
    let lastEventEndTime = lastEventOnStack ? eventTimingsMicroSeconds(lastEventOnStack).endTime : null;
    while (lastEventOnStack && lastEventEndTime && lastEventEndTime <= currentEventTimings.startTime) {
      stack.pop();
      config.onEndEvent(lastEventOnStack);
      lastEventOnStack = stack.at(-1);
      lastEventEndTime = lastEventOnStack ? eventTimingsMicroSeconds(lastEventOnStack).endTime : null;
    }
    if (config.eventFilter && !config.eventFilter(currentEvent)) {
      continue;
    }
    if (currentEventTimings.duration) {
      config.onStartEvent(currentEvent);
      stack.push(currentEvent);
    } else if (config.onInstantEvent) {
      config.onInstantEvent(currentEvent);
    }
  }
  while (stack.length) {
    const last = stack.pop();
    if (last) {
      config.onEndEvent(last);
    }
  }
}
const parsedCategories = /* @__PURE__ */ new Map();
export function eventHasCategory(event, category) {
  let parsedCategoriesForEvent = parsedCategories.get(event.cat);
  if (!parsedCategoriesForEvent) {
    parsedCategoriesForEvent = new Set(event.cat.split(",") || []);
  }
  return parsedCategoriesForEvent.has(category);
}
export function isMatchingCallFrame(eventFrame, nodeFrame) {
  return eventFrame.columnNumber === nodeFrame.columnNumber && eventFrame.lineNumber === nodeFrame.lineNumber && String(eventFrame.scriptId) === nodeFrame.scriptId && eventFrame.url === nodeFrame.url && eventFrame.functionName === nodeFrame.functionName;
}
export function eventContainsTimestamp(event, ts) {
  return event.ts <= ts && event.ts + (event.dur || 0) >= ts;
}
export function extractSampleTraceId(event) {
  if (!event.args) {
    return null;
  }
  if ("beginData" in event.args) {
    const beginData = event.args["beginData"];
    return beginData.sampleTraceId ?? null;
  }
  return event.args?.sampleTraceId ?? event.args?.data?.sampleTraceId ?? null;
}
export const VISIBLE_TRACE_EVENT_TYPES = /* @__PURE__ */ new Set([
  Types.Events.Name.ABORT_POST_TASK_CALLBACK,
  Types.Events.Name.ANIMATION,
  Types.Events.Name.ASYNC_TASK,
  Types.Events.Name.BACKGROUND_DESERIALIZE,
  Types.Events.Name.CACHE_MODULE,
  Types.Events.Name.CACHE_SCRIPT,
  Types.Events.Name.CANCEL_ANIMATION_FRAME,
  Types.Events.Name.CANCEL_IDLE_CALLBACK,
  Types.Events.Name.COMMIT,
  Types.Events.Name.COMPILE_CODE,
  Types.Events.Name.COMPILE_MODULE,
  Types.Events.Name.COMPILE,
  Types.Events.Name.COMPOSITE_LAYERS,
  Types.Events.Name.COMPUTE_INTERSECTION,
  Types.Events.Name.CONSOLE_TIME,
  Types.Events.Name.CPPGC_SWEEP,
  Types.Events.Name.CRYPTO_DO_DECRYPT_REPLY,
  Types.Events.Name.CRYPTO_DO_DECRYPT,
  Types.Events.Name.CRYPTO_DO_DIGEST_REPLY,
  Types.Events.Name.CRYPTO_DO_DIGEST,
  Types.Events.Name.CRYPTO_DO_ENCRYPT_REPLY,
  Types.Events.Name.CRYPTO_DO_ENCRYPT,
  Types.Events.Name.CRYPTO_DO_SIGN_REPLY,
  Types.Events.Name.CRYPTO_DO_SIGN,
  Types.Events.Name.CRYPTO_DO_VERIFY_REPLY,
  Types.Events.Name.CRYPTO_DO_VERIFY,
  Types.Events.Name.DECODE_IMAGE,
  Types.Events.Name.EMBEDDER_CALLBACK,
  Types.Events.Name.EVALUATE_MODULE,
  Types.Events.Name.EVALUATE_SCRIPT,
  Types.Events.Name.EVENT_DISPATCH,
  Types.Events.Name.EVENT_TIMING,
  Types.Events.Name.FINALIZE_DESERIALIZATION,
  Types.Events.Name.FIRE_ANIMATION_FRAME,
  Types.Events.Name.FIRE_IDLE_CALLBACK,
  Types.Events.Name.FUNCTION_CALL,
  Types.Events.Name.GC_COLLECT_GARBARGE,
  Types.Events.Name.GC,
  Types.Events.Name.GPU_TASK,
  Types.Events.Name.HANDLE_POST_MESSAGE,
  Types.Events.Name.HIT_TEST,
  Types.Events.Name.JS_SAMPLE,
  Types.Events.Name.LAYERIZE,
  Types.Events.Name.LAYOUT,
  Types.Events.Name.MAJOR_GC,
  Types.Events.Name.MINOR_GC,
  Types.Events.Name.OPTIMIZE_CODE,
  Types.Events.Name.PAINT_SETUP,
  Types.Events.Name.PAINT,
  Types.Events.Name.PARSE_AUTHOR_STYLE_SHEET,
  Types.Events.Name.PARSE_HTML,
  Types.Events.Name.PRE_PAINT,
  Types.Events.Name.PROFILE_CALL,
  Types.Events.Name.PROGRAM,
  Types.Events.Name.RASTER_TASK,
  Types.Events.Name.REQUEST_ANIMATION_FRAME,
  Types.Events.Name.REQUEST_IDLE_CALLBACK,
  Types.Events.Name.RESOURCE_FINISH,
  Types.Events.Name.RESOURCE_RECEIVE_DATA,
  Types.Events.Name.RESOURCE_RECEIVE_RESPONSE,
  Types.Events.Name.RESOURCE_SEND_REQUEST,
  Types.Events.Name.RESOURCE_WILL_SEND_REQUEST,
  Types.Events.Name.RUN_MICROTASKS,
  Types.Events.Name.RUN_POST_TASK_CALLBACK,
  Types.Events.Name.RUN_TASK,
  Types.Events.Name.SCHEDULE_POST_MESSAGE,
  Types.Events.Name.SCHEDULE_POST_TASK_CALLBACK,
  Types.Events.Name.SCHEDULE_STYLE_RECALCULATION,
  Types.Events.Name.SCROLL_LAYER,
  Types.Events.Name.START_PROFILING,
  Types.Events.Name.STREAMING_COMPILE_SCRIPT_PARSING,
  Types.Events.Name.STREAMING_COMPILE_SCRIPT_WAITING,
  Types.Events.Name.STREAMING_COMPILE_SCRIPT,
  Types.Events.Name.SYNTHETIC_LAYOUT_SHIFT_CLUSTER,
  Types.Events.Name.SYNTHETIC_LAYOUT_SHIFT,
  Types.Events.Name.TIME_STAMP,
  Types.Events.Name.TIMER_FIRE,
  Types.Events.Name.TIMER_INSTALL,
  Types.Events.Name.TIMER_REMOVE,
  Types.Events.Name.UPDATE_LAYER_TREE,
  Types.Events.Name.RECALC_STYLE,
  Types.Events.Name.USER_TIMING,
  Types.Events.Name.V8_CONSOLE_RUN_TASK,
  Types.Events.Name.WASM_CACHED_MODULE,
  Types.Events.Name.WASM_COMPILED_MODULE,
  Types.Events.Name.WASM_MODULE_CACHE_HIT,
  Types.Events.Name.WASM_MODULE_CACHE_INVALID,
  Types.Events.Name.WASM_STREAM_FROM_RESPONSE_CALLBACK,
  Types.Events.Name.WEB_SOCKET_CREATE,
  Types.Events.Name.WEB_SOCKET_DESTROY,
  Types.Events.Name.WEB_SOCKET_RECEIVE_HANDSHAKE_REQUEST,
  Types.Events.Name.WEB_SOCKET_RECEIVE,
  Types.Events.Name.WEB_SOCKET_SEND_HANDSHAKE_REQUEST,
  Types.Events.Name.WEB_SOCKET_SEND,
  Types.Events.Name.XHR_LOAD,
  Types.Events.Name.XHR_READY_STATE_CHANGED
]);
//# sourceMappingURL=Trace.js.map
