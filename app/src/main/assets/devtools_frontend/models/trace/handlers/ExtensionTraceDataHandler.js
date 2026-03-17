"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as userTimingsData } from "./UserTimingsHandler.js";
let extensionTrackEntries = [];
let extensionTrackData = [];
let extensionMarkers = [];
let entryToNode = /* @__PURE__ */ new Map();
let timeStampByName = /* @__PURE__ */ new Map();
let syntheticConsoleEntriesForTimingsTrack = [];
export function handleEvent(_event) {
}
export function reset() {
  extensionTrackEntries = [];
  syntheticConsoleEntriesForTimingsTrack = [];
  extensionTrackData = [];
  extensionMarkers = [];
  entryToNode = /* @__PURE__ */ new Map();
  timeStampByName = /* @__PURE__ */ new Map();
}
export async function finalize() {
  createExtensionFlameChartEntries();
}
function createExtensionFlameChartEntries() {
  const pairedMeasures = userTimingsData().performanceMeasures;
  const marks = userTimingsData().performanceMarks;
  const mergedRawExtensionEvents = Helpers.Trace.mergeEventsInOrder(pairedMeasures, marks);
  extractPerformanceAPIExtensionEntries(mergedRawExtensionEvents);
  extractConsoleAPIExtensionEntries();
  Helpers.Trace.sortTraceEventsInPlace(extensionTrackEntries);
  Helpers.Extensions.buildTrackDataFromExtensionEntries(extensionTrackEntries, extensionTrackData, entryToNode);
}
export function extractConsoleAPIExtensionEntries() {
  const consoleTimeStamps = userTimingsData().timestampEvents;
  for (const currentTimeStamp of consoleTimeStamps) {
    if (!currentTimeStamp.args.data) {
      continue;
    }
    const timeStampName = String(currentTimeStamp.args.data.name ?? currentTimeStamp.args.data.message);
    timeStampByName.set(timeStampName, currentTimeStamp);
    const { devtoolsObj: extensionData, userDetail } = extensionDataInConsoleTimeStamp(currentTimeStamp);
    const start = currentTimeStamp.args.data.start;
    const end = currentTimeStamp.args.data.end;
    if (!extensionData && !start && !end) {
      continue;
    }
    const startTimeStamp = typeof start === "number" ? Types.Timing.Micro(start) : timeStampByName.get(String(start))?.ts;
    const endTimeStamp = typeof end === "number" ? Types.Timing.Micro(end) : timeStampByName.get(String(end))?.ts;
    if (endTimeStamp !== void 0 && startTimeStamp === void 0) {
      continue;
    }
    const entryStartTime = startTimeStamp ?? currentTimeStamp.ts;
    const entryEndTime = endTimeStamp ?? currentTimeStamp.ts;
    if (extensionData) {
      const unregisteredExtensionEntry = {
        ...currentTimeStamp,
        name: timeStampName,
        cat: "devtools.extension",
        devtoolsObj: extensionData,
        userDetail,
        rawSourceEvent: currentTimeStamp,
        dur: Types.Timing.Micro(entryEndTime - entryStartTime),
        ts: entryStartTime,
        ph: Types.Events.Phase.COMPLETE
      };
      const extensionEntry = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent(unregisteredExtensionEntry);
      extensionTrackEntries.push(extensionEntry);
      continue;
    }
    const unregisteredSyntheticTimeStamp = {
      ...currentTimeStamp,
      name: timeStampName,
      cat: "disabled-by-default-v8.inspector",
      ph: Types.Events.Phase.COMPLETE,
      ts: entryStartTime,
      dur: Types.Timing.Micro(entryEndTime - entryStartTime),
      rawSourceEvent: currentTimeStamp
    };
    const syntheticTimeStamp = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent(
      unregisteredSyntheticTimeStamp
    );
    syntheticConsoleEntriesForTimingsTrack.push(syntheticTimeStamp);
  }
}
export function extractPerformanceAPIExtensionEntries(timings) {
  for (const timing of timings) {
    const { devtoolsObj, userDetail } = extensionDataInPerformanceTiming(timing);
    if (!devtoolsObj) {
      continue;
    }
    const extensionSyntheticEntry = {
      name: timing.name,
      ph: Types.Extensions.isExtensionPayloadMarker(devtoolsObj) ? Types.Events.Phase.INSTANT : Types.Events.Phase.COMPLETE,
      pid: timing.pid,
      tid: timing.tid,
      ts: timing.ts,
      dur: timing.dur,
      cat: "devtools.extension",
      devtoolsObj,
      userDetail,
      rawSourceEvent: Types.Events.isSyntheticUserTiming(timing) ? timing.rawSourceEvent : timing
    };
    if (Types.Extensions.isExtensionPayloadMarker(devtoolsObj)) {
      const extensionMarker = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent(
        extensionSyntheticEntry
      );
      extensionMarkers.push(extensionMarker);
      continue;
    }
    if (Types.Extensions.isExtensionEntryObj(extensionSyntheticEntry.devtoolsObj)) {
      const extensionTrackEntry = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent(
        extensionSyntheticEntry
      );
      extensionTrackEntries.push(extensionTrackEntry);
      continue;
    }
  }
}
export function extensionDataInPerformanceTiming(timing) {
  const timingDetail = Types.Events.isPerformanceMark(timing) ? timing.args.data?.detail : timing.args.data.beginEvent.args.detail;
  if (!timingDetail) {
    return { devtoolsObj: null, userDetail: null };
  }
  const devtoolsObj = Helpers.Trace.parseDevtoolsDetails(timingDetail, "devtools");
  let userDetail = null;
  try {
    userDetail = JSON.parse(timingDetail);
    delete userDetail.devtools;
  } catch {
  }
  return { devtoolsObj, userDetail };
}
export function extensionDataInConsoleTimeStamp(timeStamp) {
  if (!timeStamp.args.data || !timeStamp.args.data.track) {
    return { devtoolsObj: null, userDetail: null };
  }
  let userDetail = null;
  try {
    userDetail = JSON.parse(timeStamp.args.data?.devtools || '""');
  } catch {
  }
  const devtoolsObj = {
    // the color is defaulted to primary if it's value isn't one from
    // the defined palette (see ExtensionUI::extensionEntryColor) so
    // we don't need to check the value is valid here.
    color: String(timeStamp.args.data.color),
    track: String(timeStamp.args.data.track),
    dataType: "track-entry",
    trackGroup: timeStamp.args.data.trackGroup !== void 0 ? String(timeStamp.args.data.trackGroup) : void 0
  };
  return { devtoolsObj, userDetail };
}
export function data() {
  return {
    entryToNode,
    extensionTrackData,
    extensionMarkers,
    syntheticConsoleEntriesForTimingsTrack
  };
}
export function deps() {
  return ["UserTimings"];
}
//# sourceMappingURL=ExtensionTraceDataHandler.js.map
