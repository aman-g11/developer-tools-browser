"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
import { ScoreClassification } from "./PageLoadMetricsHandler.js";
import { data as screenshotsHandlerData } from "./ScreenshotsHandler.js";
export const MAX_CLUSTER_DURATION = Helpers.Timing.milliToMicro(Types.Timing.Milli(5e3));
export const MAX_SHIFT_TIME_DELTA = Helpers.Timing.milliToMicro(Types.Timing.Milli(1e3));
let layoutShiftEvents = [];
let layoutInvalidationEvents = [];
let scheduleStyleInvalidationEvents = [];
let styleRecalcInvalidationEvents = [];
let renderFrameImplCreateChildFrameEvents = [];
let domLoadingEvents = [];
let layoutImageUnsizedEvents = [];
let remoteFonts = [];
let backendNodeIds = /* @__PURE__ */ new Set();
let prePaintEvents = [];
let paintImageEvents = [];
let sessionMaxScore = 0;
let clsWindowID = -1;
let clusters = [];
let clustersByNavigationId = /* @__PURE__ */ new Map();
let scoreRecords = [];
export function reset() {
  layoutShiftEvents = [];
  layoutInvalidationEvents = [];
  scheduleStyleInvalidationEvents = [];
  styleRecalcInvalidationEvents = [];
  prePaintEvents = [];
  paintImageEvents = [];
  renderFrameImplCreateChildFrameEvents = [];
  layoutImageUnsizedEvents = [];
  domLoadingEvents = [];
  remoteFonts = [];
  backendNodeIds = /* @__PURE__ */ new Set();
  clusters = [];
  sessionMaxScore = 0;
  scoreRecords = [];
  clsWindowID = -1;
  clustersByNavigationId = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isLayoutShift(event) && !event.args.data?.had_recent_input) {
    layoutShiftEvents.push(event);
    return;
  }
  if (Types.Events.isLayoutInvalidationTracking(event)) {
    layoutInvalidationEvents.push(event);
    return;
  }
  if (Types.Events.isScheduleStyleInvalidationTracking(event)) {
    scheduleStyleInvalidationEvents.push(event);
  }
  if (Types.Events.isStyleRecalcInvalidationTracking(event)) {
    styleRecalcInvalidationEvents.push(event);
  }
  if (Types.Events.isPrePaint(event)) {
    prePaintEvents.push(event);
    return;
  }
  if (Types.Events.isRenderFrameImplCreateChildFrame(event)) {
    renderFrameImplCreateChildFrameEvents.push(event);
  }
  if (Types.Events.isDomLoading(event)) {
    domLoadingEvents.push(event);
  }
  if (Types.Events.isLayoutImageUnsized(event)) {
    layoutImageUnsizedEvents.push(event);
  }
  if (Types.Events.isBeginRemoteFontLoad(event)) {
    remoteFonts.push({
      display: event.args.display,
      url: event.args.url,
      beginRemoteFontLoadEvent: event
    });
  }
  if (Types.Events.isRemoteFontLoaded(event)) {
    for (const remoteFont of remoteFonts) {
      if (remoteFont.url === event.args.url) {
        remoteFont.name = event.args.name;
      }
    }
  }
  if (Types.Events.isPaintImage(event)) {
    paintImageEvents.push(event);
  }
}
function traceWindowFromTime(time) {
  return {
    min: time,
    max: time,
    range: Types.Timing.Micro(0)
  };
}
function updateTraceWindowMax(traceWindow, newMax) {
  traceWindow.max = newMax;
  traceWindow.range = Types.Timing.Micro(traceWindow.max - traceWindow.min);
}
function findScreenshots(timestamp) {
  const data2 = screenshotsHandlerData();
  if (data2.screenshots) {
    const before = Helpers.Trace.findPreviousEventBeforeTimestamp(data2.screenshots, timestamp);
    const after = before ? data2.screenshots[data2.screenshots.indexOf(before) + 1] : null;
    return { before, after };
  }
  if (data2.legacySyntheticScreenshots) {
    const before = Helpers.Trace.findPreviousEventBeforeTimestamp(data2.legacySyntheticScreenshots, timestamp);
    const after = before ? data2.legacySyntheticScreenshots[data2.legacySyntheticScreenshots.indexOf(before) + 1] : null;
    return { before, after };
  }
  return { before: null, after: null };
}
function buildScoreRecords() {
  const { traceBounds } = metaHandlerData();
  scoreRecords.push({ ts: traceBounds.min, score: 0 });
  for (const cluster of clusters) {
    let clusterScore = 0;
    if (cluster.events[0].args.data) {
      scoreRecords.push({ ts: cluster.clusterWindow.min, score: cluster.events[0].args.data.weighted_score_delta });
    }
    for (let i = 0; i < cluster.events.length; i++) {
      const event = cluster.events[i];
      if (!event.args.data) {
        continue;
      }
      clusterScore += event.args.data.weighted_score_delta;
      scoreRecords.push({ ts: event.ts, score: clusterScore });
    }
    scoreRecords.push({ ts: cluster.clusterWindow.max, score: 0 });
  }
}
function collectNodes() {
  backendNodeIds.clear();
  for (const layoutShift of layoutShiftEvents) {
    if (!layoutShift.args.data?.impacted_nodes) {
      continue;
    }
    for (const node of layoutShift.args.data.impacted_nodes) {
      backendNodeIds.add(node.node_id);
    }
  }
  for (const layoutInvalidation of layoutInvalidationEvents) {
    if (!layoutInvalidation.args.data?.nodeId) {
      continue;
    }
    backendNodeIds.add(layoutInvalidation.args.data.nodeId);
  }
  for (const scheduleStyleInvalidation of scheduleStyleInvalidationEvents) {
    if (!scheduleStyleInvalidation.args.data?.nodeId) {
      continue;
    }
    backendNodeIds.add(scheduleStyleInvalidation.args.data.nodeId);
  }
}
export async function finalize() {
  layoutShiftEvents.sort((a, b) => a.ts - b.ts);
  prePaintEvents.sort((a, b) => a.ts - b.ts);
  layoutInvalidationEvents.sort((a, b) => a.ts - b.ts);
  renderFrameImplCreateChildFrameEvents.sort((a, b) => a.ts - b.ts);
  domLoadingEvents.sort((a, b) => a.ts - b.ts);
  layoutImageUnsizedEvents.sort((a, b) => a.ts - b.ts);
  remoteFonts.sort((a, b) => a.beginRemoteFontLoadEvent.ts - b.beginRemoteFontLoadEvent.ts);
  paintImageEvents.sort((a, b) => a.ts - b.ts);
  await buildLayoutShiftsClusters();
  buildScoreRecords();
  collectNodes();
}
async function buildLayoutShiftsClusters() {
  const { navigationsByFrameId, mainFrameId, traceBounds } = metaHandlerData();
  const navigations = navigationsByFrameId.get(mainFrameId) || [];
  if (layoutShiftEvents.length === 0) {
    return;
  }
  let firstShiftTime = layoutShiftEvents[0].ts;
  let lastShiftTime = layoutShiftEvents[0].ts;
  let lastShiftNavigation = null;
  for (const event of layoutShiftEvents) {
    const clusterDurationExceeded = event.ts - firstShiftTime > MAX_CLUSTER_DURATION;
    const maxTimeDeltaSinceLastShiftExceeded = event.ts - lastShiftTime > MAX_SHIFT_TIME_DELTA;
    const currentShiftNavigation = Platform.ArrayUtilities.nearestIndexFromEnd(navigations, (nav) => nav.ts < event.ts);
    const hasNavigated = lastShiftNavigation !== currentShiftNavigation && currentShiftNavigation !== null;
    if (clusterDurationExceeded || maxTimeDeltaSinceLastShiftExceeded || hasNavigated || !clusters.length) {
      const clusterStartTime = event.ts;
      const endTimeByMaxSessionDuration = clusterDurationExceeded ? firstShiftTime + MAX_CLUSTER_DURATION : Infinity;
      const endTimeByMaxShiftGap = maxTimeDeltaSinceLastShiftExceeded ? lastShiftTime + MAX_SHIFT_TIME_DELTA : Infinity;
      const endTimeByNavigation = hasNavigated ? navigations[currentShiftNavigation].ts : Infinity;
      const previousClusterEndTime = Math.min(endTimeByMaxSessionDuration, endTimeByMaxShiftGap, endTimeByNavigation);
      if (clusters.length > 0) {
        const currentCluster2 = clusters[clusters.length - 1];
        updateTraceWindowMax(currentCluster2.clusterWindow, Types.Timing.Micro(previousClusterEndTime));
      }
      const navigationId = currentShiftNavigation === null ? Types.Events.NO_NAVIGATION : navigations[currentShiftNavigation].args.data?.navigationId;
      clusters.push(Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
        name: "SyntheticLayoutShiftCluster",
        // Will be replaced by the worst layout shift in the next for loop.
        rawSourceEvent: event,
        events: [],
        clusterWindow: traceWindowFromTime(clusterStartTime),
        clusterCumulativeScore: 0,
        scoreWindows: {
          good: traceWindowFromTime(clusterStartTime)
        },
        navigationId,
        // Set default Event so that this event is treated accordingly for the track appender.
        ts: event.ts,
        pid: event.pid,
        tid: event.tid,
        ph: Types.Events.Phase.COMPLETE,
        cat: "",
        dur: Types.Timing.Micro(-1)
        // This `cluster.dur` is updated below.
      }));
      firstShiftTime = clusterStartTime;
    }
    const currentCluster = clusters[clusters.length - 1];
    const timeFromNavigation = currentShiftNavigation !== null ? Types.Timing.Micro(event.ts - navigations[currentShiftNavigation].ts) : void 0;
    currentCluster.clusterCumulativeScore += event.args.data ? event.args.data.weighted_score_delta : 0;
    if (!event.args.data) {
      continue;
    }
    const shift = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
      rawSourceEvent: event,
      ...event,
      name: Types.Events.Name.SYNTHETIC_LAYOUT_SHIFT,
      args: {
        frame: event.args.frame,
        data: {
          ...event.args.data,
          rawEvent: event,
          navigationId: currentCluster.navigationId ?? void 0
        }
      },
      parsedData: {
        timeFromNavigation,
        screenshots: findScreenshots(event.ts),
        cumulativeWeightedScoreInWindow: currentCluster.clusterCumulativeScore,
        // The score of the session window is temporarily set to 0 just
        // to initialize it. Since we need to get the score of all shifts
        // in the session window to determine its value, its definite
        // value is set when stepping through the built clusters.
        sessionWindowData: { cumulativeWindowScore: 0, id: clusters.length }
      }
    });
    currentCluster.events.push(shift);
    updateTraceWindowMax(currentCluster.clusterWindow, event.ts);
    lastShiftTime = event.ts;
    lastShiftNavigation = currentShiftNavigation;
  }
  for (const cluster of clusters) {
    let weightedScore = 0;
    let windowID = -1;
    if (cluster === clusters[clusters.length - 1]) {
      const clusterEndByMaxDuration = MAX_CLUSTER_DURATION + cluster.clusterWindow.min;
      const clusterEndByMaxGap = cluster.clusterWindow.max + MAX_SHIFT_TIME_DELTA;
      const nextNavigationIndex = Platform.ArrayUtilities.nearestIndexFromBeginning(navigations, (nav) => nav.ts > cluster.clusterWindow.max);
      const nextNavigationTime = nextNavigationIndex ? navigations[nextNavigationIndex].ts : Infinity;
      const clusterEnd = Math.min(clusterEndByMaxDuration, clusterEndByMaxGap, traceBounds.max, nextNavigationTime);
      updateTraceWindowMax(cluster.clusterWindow, Types.Timing.Micro(clusterEnd));
    }
    let largestScore = 0;
    let worstShiftEvent = null;
    for (const shift of cluster.events) {
      weightedScore += shift.args.data ? shift.args.data.weighted_score_delta : 0;
      windowID = shift.parsedData.sessionWindowData.id;
      const ts = shift.ts;
      shift.parsedData.sessionWindowData.cumulativeWindowScore = cluster.clusterCumulativeScore;
      if (weightedScore < 0.1 /* NEEDS_IMPROVEMENT */) {
        updateTraceWindowMax(cluster.scoreWindows.good, ts);
      } else if (weightedScore >= 0.1 /* NEEDS_IMPROVEMENT */ && weightedScore < 0.25 /* BAD */) {
        if (!cluster.scoreWindows.needsImprovement) {
          updateTraceWindowMax(cluster.scoreWindows.good, Types.Timing.Micro(ts - 1));
          cluster.scoreWindows.needsImprovement = traceWindowFromTime(ts);
        }
        updateTraceWindowMax(cluster.scoreWindows.needsImprovement, ts);
      } else if (weightedScore >= 0.25 /* BAD */) {
        if (!cluster.scoreWindows.bad) {
          if (cluster.scoreWindows.needsImprovement) {
            updateTraceWindowMax(cluster.scoreWindows.needsImprovement, Types.Timing.Micro(ts - 1));
          } else {
            updateTraceWindowMax(cluster.scoreWindows.good, Types.Timing.Micro(ts - 1));
          }
          cluster.scoreWindows.bad = traceWindowFromTime(shift.ts);
        }
        updateTraceWindowMax(cluster.scoreWindows.bad, ts);
      }
      if (cluster.scoreWindows.bad) {
        updateTraceWindowMax(cluster.scoreWindows.bad, cluster.clusterWindow.max);
      } else if (cluster.scoreWindows.needsImprovement) {
        updateTraceWindowMax(cluster.scoreWindows.needsImprovement, cluster.clusterWindow.max);
      } else {
        updateTraceWindowMax(cluster.scoreWindows.good, cluster.clusterWindow.max);
      }
      const score = shift.args.data?.weighted_score_delta;
      if (score !== void 0 && score > largestScore) {
        largestScore = score;
        worstShiftEvent = shift;
      }
    }
    if (worstShiftEvent) {
      cluster.worstShiftEvent = worstShiftEvent;
      cluster.rawSourceEvent = worstShiftEvent.rawSourceEvent;
    }
    cluster.ts = cluster.events[0].ts;
    const lastShiftTimings = Helpers.Timing.eventTimingsMicroSeconds(cluster.events[cluster.events.length - 1]);
    cluster.dur = Types.Timing.Micro(lastShiftTimings.endTime - cluster.events[0].ts + MAX_SHIFT_TIME_DELTA);
    if (weightedScore > sessionMaxScore) {
      clsWindowID = windowID;
      sessionMaxScore = weightedScore;
    }
    if (cluster.navigationId) {
      const clustersForId = Platform.MapUtilities.getWithDefault(clustersByNavigationId, cluster.navigationId, () => {
        return [];
      });
      clustersForId.push(cluster);
    }
  }
}
export function data() {
  return {
    clusters,
    sessionMaxScore,
    clsWindowID,
    prePaintEvents,
    layoutInvalidationEvents,
    scheduleStyleInvalidationEvents,
    styleRecalcInvalidationEvents,
    renderFrameImplCreateChildFrameEvents,
    domLoadingEvents,
    layoutImageUnsizedEvents,
    remoteFonts,
    scoreRecords,
    backendNodeIds,
    clustersByNavigationId,
    paintImageEvents
  };
}
export function deps() {
  return ["Screenshots", "Meta"];
}
export function scoreClassificationForLayoutShift(score) {
  let state = ScoreClassification.GOOD;
  if (score >= 0.1 /* NEEDS_IMPROVEMENT */) {
    state = ScoreClassification.OK;
  }
  if (score >= 0.25 /* BAD */) {
    state = ScoreClassification.BAD;
  }
  return state;
}
export var LayoutShiftsThreshold = /* @__PURE__ */ ((LayoutShiftsThreshold2) => {
  LayoutShiftsThreshold2[LayoutShiftsThreshold2["GOOD"] = 0] = "GOOD";
  LayoutShiftsThreshold2[LayoutShiftsThreshold2["NEEDS_IMPROVEMENT"] = 0.1] = "NEEDS_IMPROVEMENT";
  LayoutShiftsThreshold2[LayoutShiftsThreshold2["BAD"] = 0.25] = "BAD";
  return LayoutShiftsThreshold2;
})(LayoutShiftsThreshold || {});
//# sourceMappingURL=LayoutShiftsHandler.js.map
