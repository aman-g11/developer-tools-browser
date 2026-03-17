"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
let syntheticEvents = [];
let measureTraceByTraceId = /* @__PURE__ */ new Map();
let performanceMeasureEvents = [];
let performanceMarkEvents = [];
let consoleTimings = [];
let timestampEvents = [];
export function reset() {
  syntheticEvents = [];
  performanceMeasureEvents = [];
  performanceMarkEvents = [];
  consoleTimings = [];
  timestampEvents = [];
  measureTraceByTraceId = /* @__PURE__ */ new Map();
}
const resourceTimingNames = [
  "workerStart",
  "redirectStart",
  "redirectEnd",
  "fetchStart",
  "domainLookupStart",
  "domainLookupEnd",
  "connectStart",
  "connectEnd",
  "secureConnectionStart",
  "requestStart",
  "responseStart",
  "responseEnd"
];
const navTimingNames = [
  "navigationStart",
  "unloadEventStart",
  "unloadEventEnd",
  "redirectStart",
  "redirectEnd",
  "fetchStart",
  "commitNavigationEnd",
  "domainLookupStart",
  "domainLookupEnd",
  "connectStart",
  "connectEnd",
  "secureConnectionStart",
  "requestStart",
  "responseStart",
  "responseEnd",
  "domLoading",
  "domInteractive",
  "domContentLoadedEventStart",
  "domContentLoadedEventEnd",
  "domComplete",
  "loadEventStart",
  "loadEventEnd"
];
const ignoredNames = [...resourceTimingNames, ...navTimingNames];
function getEventTimings(event) {
  if ("dur" in event) {
    return { start: event.ts, end: Types.Timing.Micro(event.ts + (event.dur ?? 0)) };
  }
  if (Types.Events.isConsoleTimeStamp(event)) {
    const { start, end } = event.args.data || {};
    if (typeof start === "number" && typeof end === "number") {
      return { start: Types.Timing.Micro(start), end: Types.Timing.Micro(end) };
    }
  }
  return { start: event.ts, end: event.ts };
}
function getEventTrack(event) {
  if (event.cat === "blink.user_timing") {
    const detailString = event.args.data.beginEvent.args?.detail;
    if (detailString) {
      const details = Helpers.Trace.parseDevtoolsDetails(detailString, "devtools");
      if (details && "track" in details) {
        return details.track;
      }
    }
  } else if (Types.Events.isConsoleTimeStamp(event)) {
    const track = event.args.data?.track;
    return typeof track === "string" ? track : void 0;
  }
  return void 0;
}
export function userTimingComparator(a, b, originalArray) {
  const { start: aStart, end: aEnd } = getEventTimings(a);
  const { start: bStart, end: bEnd } = getEventTimings(b);
  const timeDifference = Helpers.Trace.compareBeginAndEnd(aStart, bStart, aEnd, bEnd);
  if (timeDifference) {
    return timeDifference;
  }
  const aTrack = getEventTrack(a);
  const bTrack = getEventTrack(b);
  if (aTrack !== bTrack) {
    return 0;
  }
  const aIndex = originalArray.indexOf(a);
  const bIndex = originalArray.indexOf(b);
  return bIndex - aIndex;
}
export function handleEvent(event) {
  if (ignoredNames.includes(event.name)) {
    return;
  }
  if (Types.Events.isUserTimingMeasure(event)) {
    measureTraceByTraceId.set(event.args.traceId, event);
  }
  if (Types.Events.isPerformanceMeasure(event)) {
    performanceMeasureEvents.push(event);
    return;
  }
  if (Types.Events.isPerformanceMark(event)) {
    performanceMarkEvents.push(event);
  }
  if (Types.Events.isConsoleTime(event)) {
    consoleTimings.push(event);
  }
  if (Types.Events.isConsoleTimeStamp(event)) {
    timestampEvents.push(event);
  }
}
export async function finalize() {
  const asyncEvents = [...performanceMeasureEvents, ...consoleTimings];
  syntheticEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(asyncEvents);
  syntheticEvents = syntheticEvents.sort((a, b) => userTimingComparator(a, b, [...syntheticEvents]));
  timestampEvents = timestampEvents.sort((a, b) => userTimingComparator(a, b, [...timestampEvents]));
}
export function data() {
  return {
    consoleTimings: syntheticEvents.filter((e) => e.cat === "blink.console"),
    performanceMeasures: syntheticEvents.filter((e) => e.cat === "blink.user_timing"),
    performanceMarks: performanceMarkEvents,
    timestampEvents,
    measureTraceByTraceId
  };
}
//# sourceMappingURL=UserTimingsHandler.js.map
