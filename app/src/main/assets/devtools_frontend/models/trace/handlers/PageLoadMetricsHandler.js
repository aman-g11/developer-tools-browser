"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
let metricScoresByFrameId = /* @__PURE__ */ new Map();
let allMarkerEvents = [];
let metaCharsetCheckEventsByNavigation = /* @__PURE__ */ new Map();
let metaCharsetCheckEventsArray = [];
export function reset() {
  metricScoresByFrameId = /* @__PURE__ */ new Map();
  pageLoadEventsArray = [];
  allMarkerEvents = [];
  selectedLCPCandidateEvents = /* @__PURE__ */ new Set();
  metaCharsetCheckEventsByNavigation = /* @__PURE__ */ new Map();
  metaCharsetCheckEventsArray = [];
}
let pageLoadEventsArray = [];
let selectedLCPCandidateEvents = /* @__PURE__ */ new Set();
export function handleEvent(event) {
  if (Types.Events.isMetaCharsetCheck(event)) {
    metaCharsetCheckEventsArray.push(event);
    return;
  }
  if (!Types.Events.eventIsPageLoadEvent(event)) {
    return;
  }
  pageLoadEventsArray.push(event);
}
function storePageLoadMetricAgainstNavigationId(navigation, event) {
  const frameId = getFrameIdForPageLoadEvent(event);
  const { rendererProcessesByFrame } = metaHandlerData();
  const rendererProcessesInFrame = rendererProcessesByFrame.get(frameId);
  if (!rendererProcessesInFrame) {
    return;
  }
  const processData = rendererProcessesInFrame.get(event.pid);
  if (!processData) {
    return;
  }
  if (Types.Events.isNavigationStart(event)) {
    return;
  }
  if (Types.Events.isFirstContentfulPaint(event)) {
    const fcpTime = Types.Timing.Micro(event.ts - navigation.ts);
    const classification = scoreClassificationForFirstContentfulPaint(fcpTime);
    const metricScore = { event, metricName: "FCP" /* FCP */, classification, navigation, timing: fcpTime };
    storeMetricScore(frameId, navigation, metricScore);
    return;
  }
  if (Types.Events.isFirstPaint(event)) {
    const paintTime = Types.Timing.Micro(event.ts - navigation.ts);
    const classification = "unclassified" /* UNCLASSIFIED */;
    const metricScore = { event, metricName: "FP" /* FP */, classification, navigation, timing: paintTime };
    storeMetricScore(frameId, navigation, metricScore);
    return;
  }
  if (Types.Events.isMarkDOMContent(event)) {
    const dclTime = Types.Timing.Micro(event.ts - navigation.ts);
    const metricScore = {
      event,
      metricName: "DCL" /* DCL */,
      classification: scoreClassificationForDOMContentLoaded(dclTime),
      navigation,
      timing: dclTime
    };
    storeMetricScore(frameId, navigation, metricScore);
    return;
  }
  if (Types.Events.isInteractiveTime(event)) {
    const ttiValue = Types.Timing.Micro(event.ts - navigation.ts);
    const tti = {
      event,
      metricName: "TTI" /* TTI */,
      classification: scoreClassificationForTimeToInteractive(ttiValue),
      navigation,
      timing: ttiValue
    };
    storeMetricScore(frameId, navigation, tti);
    const tbtValue = Helpers.Timing.milliToMicro(Types.Timing.Milli(event.args.args.total_blocking_time_ms));
    const tbt = {
      event,
      metricName: "TBT" /* TBT */,
      classification: scoreClassificationForTotalBlockingTime(tbtValue),
      navigation,
      timing: tbtValue
    };
    storeMetricScore(frameId, navigation, tbt);
    return;
  }
  if (Types.Events.isMarkLoad(event)) {
    const loadTime = Types.Timing.Micro(event.ts - navigation.ts);
    const metricScore = {
      event,
      metricName: "L" /* L */,
      classification: "unclassified" /* UNCLASSIFIED */,
      navigation,
      timing: loadTime
    };
    storeMetricScore(frameId, navigation, metricScore);
    return;
  }
  if (Types.Events.isAnyLargestContentfulPaintCandidate(event)) {
    const candidateIndex = event.args.data?.candidateIndex;
    if (!candidateIndex) {
      throw new Error("Largest Contentful Paint unexpectedly had no candidateIndex.");
    }
    const lcpTime = Types.Timing.Micro(event.ts - navigation.ts);
    const lcp = {
      event,
      metricName: "LCP" /* LCP */,
      classification: scoreClassificationForLargestContentfulPaint(lcpTime),
      navigation,
      timing: lcpTime
    };
    const metricsByNavigation = Platform.MapUtilities.getWithDefault(metricScoresByFrameId, frameId, () => /* @__PURE__ */ new Map());
    const metrics = Platform.MapUtilities.getWithDefault(metricsByNavigation, navigation, () => /* @__PURE__ */ new Map());
    const lastLCPCandidate = metrics.get("LCP" /* LCP */);
    if (lastLCPCandidate === void 0) {
      selectedLCPCandidateEvents.add(lcp.event);
      storeMetricScore(frameId, navigation, lcp);
      return;
    }
    const lastLCPCandidateEvent = lastLCPCandidate.event;
    if (!Types.Events.isAnyLargestContentfulPaintCandidate(lastLCPCandidateEvent)) {
      return;
    }
    const lastCandidateIndex = lastLCPCandidateEvent.args.data?.candidateIndex;
    if (!lastCandidateIndex) {
      return;
    }
    if (lastCandidateIndex < candidateIndex) {
      selectedLCPCandidateEvents.delete(lastLCPCandidateEvent);
      selectedLCPCandidateEvents.add(lcp.event);
      storeMetricScore(frameId, navigation, lcp);
    }
    return;
  }
  if (Types.Events.isLayoutShift(event)) {
    return;
  }
  if (Types.Events.isSoftNavigationStart(event)) {
    return;
  }
  return Platform.assertNever(event, `Unexpected event type: ${event}`);
}
function storeMetricScore(frameId, navigation, metricScore) {
  const metricsByNavigation = Platform.MapUtilities.getWithDefault(metricScoresByFrameId, frameId, () => /* @__PURE__ */ new Map());
  const metrics = Platform.MapUtilities.getWithDefault(metricsByNavigation, navigation, () => /* @__PURE__ */ new Map());
  metrics.delete(metricScore.metricName);
  metrics.set(metricScore.metricName, metricScore);
}
export function getFrameIdForPageLoadEvent(event) {
  if (Types.Events.isFirstContentfulPaint(event) || Types.Events.isInteractiveTime(event) || Types.Events.isAnyLargestContentfulPaintCandidate(event) || Types.Events.isNavigationStart(event) || Types.Events.isSoftNavigationStart(event) || Types.Events.isLayoutShift(event) || Types.Events.isFirstPaint(event)) {
    return event.args.frame;
  }
  if (Types.Events.isMarkDOMContent(event) || Types.Events.isMarkLoad(event)) {
    const frameId = event.args.data?.frame;
    if (!frameId) {
      throw new Error("MarkDOMContent unexpectedly had no frame ID.");
    }
    return frameId;
  }
  Platform.assertNever(event, `Unexpected event type: ${event}`);
}
function getNavigationForPageLoadEvent(event) {
  if (Types.Events.isFirstContentfulPaint(event) || Types.Events.isAnyLargestContentfulPaintCandidate(event) || Types.Events.isFirstPaint(event)) {
    const { navigationsByNavigationId, softNavigationsById } = metaHandlerData();
    let navigation;
    if (event.name === Types.Events.Name.MARK_LCP_CANDIDATE_FOR_SOFT_NAVIGATION && event.args.data?.performanceTimelineNavigationId) {
      navigation = softNavigationsById.get(event.args.data.performanceTimelineNavigationId);
      if (!navigation) {
        return null;
      }
    } else {
      const navigationId = event.args.data?.navigationId;
      if (!navigationId) {
        throw new Error(`Trace event unexpectedly had no navigation ID: ${JSON.stringify(event, null, 2)}`);
      }
      navigation = navigationsByNavigationId.get(navigationId);
    }
    if (!navigation) {
      return null;
    }
    return navigation;
  }
  if (Types.Events.isSoftNavigationStart(event)) {
    const { softNavigationsById } = metaHandlerData();
    return softNavigationsById.get(event.args.context.performanceTimelineNavigationId) ?? null;
  }
  if (Types.Events.isMarkDOMContent(event) || Types.Events.isInteractiveTime(event) || Types.Events.isLayoutShift(event) || Types.Events.isMarkLoad(event)) {
    const frameId = getFrameIdForPageLoadEvent(event);
    const { navigationsByFrameId } = metaHandlerData();
    return Helpers.Trace.getNavigationForTraceEvent(event, frameId, navigationsByFrameId);
  }
  if (Types.Events.isNavigationStart(event)) {
    return null;
  }
  return Platform.assertNever(event, `Unexpected event type: ${event}`);
}
export function scoreClassificationForFirstContentfulPaint(fcpScoreInMicroseconds) {
  const FCP_GOOD_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(1.8));
  const FCP_MEDIUM_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(3));
  let scoreClassification = "bad" /* BAD */;
  if (fcpScoreInMicroseconds <= FCP_MEDIUM_TIMING) {
    scoreClassification = "ok" /* OK */;
  }
  if (fcpScoreInMicroseconds <= FCP_GOOD_TIMING) {
    scoreClassification = "good" /* GOOD */;
  }
  return scoreClassification;
}
export function scoreClassificationForTimeToInteractive(ttiTimeInMicroseconds) {
  const TTI_GOOD_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(3.8));
  const TTI_MEDIUM_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(7.3));
  let scoreClassification = "bad" /* BAD */;
  if (ttiTimeInMicroseconds <= TTI_MEDIUM_TIMING) {
    scoreClassification = "ok" /* OK */;
  }
  if (ttiTimeInMicroseconds <= TTI_GOOD_TIMING) {
    scoreClassification = "good" /* GOOD */;
  }
  return scoreClassification;
}
export function scoreClassificationForLargestContentfulPaint(lcpTimeInMicroseconds) {
  const LCP_GOOD_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(2.5));
  const LCP_MEDIUM_TIMING = Helpers.Timing.secondsToMicro(Types.Timing.Seconds(4));
  let scoreClassification = "bad" /* BAD */;
  if (lcpTimeInMicroseconds <= LCP_MEDIUM_TIMING) {
    scoreClassification = "ok" /* OK */;
  }
  if (lcpTimeInMicroseconds <= LCP_GOOD_TIMING) {
    scoreClassification = "good" /* GOOD */;
  }
  return scoreClassification;
}
export function scoreClassificationForDOMContentLoaded(_dclTimeInMicroseconds) {
  return "unclassified" /* UNCLASSIFIED */;
}
export function scoreClassificationForTotalBlockingTime(tbtTimeInMicroseconds) {
  const TBT_GOOD_TIMING = Helpers.Timing.milliToMicro(Types.Timing.Milli(200));
  const TBT_MEDIUM_TIMING = Helpers.Timing.milliToMicro(Types.Timing.Milli(600));
  let scoreClassification = "bad" /* BAD */;
  if (tbtTimeInMicroseconds <= TBT_MEDIUM_TIMING) {
    scoreClassification = "ok" /* OK */;
  }
  if (tbtTimeInMicroseconds <= TBT_GOOD_TIMING) {
    scoreClassification = "good" /* GOOD */;
  }
  return scoreClassification;
}
function gatherFinalLCPEvents() {
  const allFinalLCPEvents = [];
  const dataForAllFrames = [...metricScoresByFrameId.values()];
  const dataForAllNavigations = dataForAllFrames.flatMap((frameData) => [...frameData.values()]);
  for (let i = 0; i < dataForAllNavigations.length; i++) {
    const navigationData = dataForAllNavigations[i];
    const lcpInNavigation = navigationData.get("LCP" /* LCP */);
    if (!lcpInNavigation?.event) {
      continue;
    }
    allFinalLCPEvents.push(lcpInNavigation.event);
  }
  return allFinalLCPEvents;
}
export async function finalize() {
  pageLoadEventsArray.sort((a, b) => a.ts - b.ts);
  for (const pageLoadEvent of pageLoadEventsArray) {
    const navigation = getNavigationForPageLoadEvent(pageLoadEvent);
    if (navigation) {
      storePageLoadMetricAgainstNavigationId(navigation, pageLoadEvent);
    }
  }
  const { navigationsByFrameId } = metaHandlerData();
  metaCharsetCheckEventsArray.sort((a, b) => a.ts - b.ts);
  for (const metaCharsetCheckEvent of metaCharsetCheckEventsArray) {
    const frameId = metaCharsetCheckEvent.args.data?.frame;
    if (!frameId) {
      continue;
    }
    const navigation = Helpers.Trace.getNavigationForTraceEvent(metaCharsetCheckEvent, frameId, navigationsByFrameId);
    if (!navigation) {
      continue;
    }
    const eventsForNavigation = Platform.MapUtilities.getWithDefault(metaCharsetCheckEventsByNavigation, navigation, () => []);
    eventsForNavigation.push(metaCharsetCheckEvent);
  }
  const allFinalLCPEvents = gatherFinalLCPEvents();
  const mainFrame = metaHandlerData().mainFrameId;
  const allEventsButLCP = pageLoadEventsArray.filter((event) => !Types.Events.isAnyLargestContentfulPaintCandidate(event));
  const markerEvents = [...allFinalLCPEvents, ...allEventsButLCP].filter(Types.Events.isMarkerEvent);
  allMarkerEvents = markerEvents.filter((event) => getFrameIdForPageLoadEvent(event) === mainFrame).sort((a, b) => a.ts - b.ts);
}
export function data() {
  return {
    metricScoresByFrameId,
    allMarkerEvents,
    metaCharsetCheckEventsByNavigation
  };
}
export function deps() {
  return ["Meta"];
}
export var ScoreClassification = /* @__PURE__ */ ((ScoreClassification2) => {
  ScoreClassification2["GOOD"] = "good";
  ScoreClassification2["OK"] = "ok";
  ScoreClassification2["BAD"] = "bad";
  ScoreClassification2["UNCLASSIFIED"] = "unclassified";
  return ScoreClassification2;
})(ScoreClassification || {});
export var MetricName = /* @__PURE__ */ ((MetricName2) => {
  MetricName2["FCP"] = "FCP";
  MetricName2["FP"] = "FP";
  MetricName2["L"] = "L";
  MetricName2["LCP"] = "LCP";
  MetricName2["DCL"] = "DCL";
  MetricName2["TTI"] = "TTI";
  MetricName2["TBT"] = "TBT";
  MetricName2["CLS"] = "CLS";
  MetricName2["NAV"] = "Nav";
  MetricName2["SOFT_NAV"] = "Nav*";
  MetricName2["SOFT_LCP"] = "LCP*";
  return MetricName2;
})(MetricName || {});
export function metricIsLCP(metric) {
  return metric.metricName === "LCP" /* LCP */;
}
//# sourceMappingURL=PageLoadMetricsHandler.js.map
