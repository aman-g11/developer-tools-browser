"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
import { getNavigationForTraceEvent } from "./Trace.js";
export const milliToMicro = (value) => Types.Timing.Micro(value * 1e3);
export const secondsToMilli = (value) => Types.Timing.Milli(value * 1e3);
export const secondsToMicro = (value) => milliToMicro(secondsToMilli(value));
export const microToMilli = (value) => Types.Timing.Milli(value / 1e3);
export const microToSeconds = (value) => Types.Timing.Seconds(value / 1e3 / 1e3);
export function timeStampForEventAdjustedByClosestNavigation(event, traceBounds, navigationsByNavigationId, softNavigationsById, navigationsByFrameId) {
  let eventTimeStamp = event.ts - traceBounds.min;
  if (event.name === Types.Events.Name.MARK_LCP_CANDIDATE_FOR_SOFT_NAVIGATION && event.args?.data?.performanceTimelineNavigationId) {
    const navigationForEvent = softNavigationsById.get(event.args.data.performanceTimelineNavigationId);
    if (navigationForEvent) {
      eventTimeStamp = event.ts - navigationForEvent.ts;
    }
  } else if (event.args?.data?.navigationId) {
    const navigationForEvent = navigationsByNavigationId.get(event.args.data.navigationId);
    if (navigationForEvent) {
      eventTimeStamp = event.ts - navigationForEvent.ts;
    }
  } else if (event.args?.data?.frame) {
    const navigationForEvent = getNavigationForTraceEvent(event, event.args.data.frame, navigationsByFrameId);
    if (navigationForEvent) {
      eventTimeStamp = event.ts - navigationForEvent.ts;
    }
  }
  return Types.Timing.Micro(eventTimeStamp);
}
export function expandWindowByPercentOrToOneMillisecond(annotationWindow, maxTraceWindow, percentage) {
  let newMin = annotationWindow.min - annotationWindow.range * (percentage / 100) / 2;
  let newMax = annotationWindow.max + annotationWindow.range * (percentage / 100) / 2;
  if (newMax - newMin < 1e3) {
    const rangeMiddle = (annotationWindow.min + annotationWindow.max) / 2;
    newMin = rangeMiddle - 500;
    newMax = rangeMiddle + 500;
  }
  newMin = Math.max(newMin, maxTraceWindow.min);
  newMax = Math.min(newMax, maxTraceWindow.max);
  const expandedWindow = {
    min: Types.Timing.Micro(newMin),
    max: Types.Timing.Micro(newMax),
    range: Types.Timing.Micro(newMax - newMin)
  };
  return expandedWindow;
}
export function eventTimingsMicroSeconds(event) {
  return {
    startTime: event.ts,
    endTime: event.ts + (event.dur ?? 0),
    duration: event.dur || 0
  };
}
export function eventTimingsMilliSeconds(event) {
  return {
    startTime: event.ts / 1e3,
    endTime: (event.ts + (event.dur ?? 0)) / 1e3,
    duration: (event.dur || 0) / 1e3
  };
}
export function traceWindowMilliSeconds(bounds) {
  return {
    min: microToMilli(bounds.min),
    max: microToMilli(bounds.max),
    range: microToMilli(bounds.range)
  };
}
export function traceWindowMicroSecondsToMilliSeconds(bounds) {
  return {
    min: microToMilli(bounds.min),
    max: microToMilli(bounds.max),
    range: microToMilli(bounds.range)
  };
}
export function traceWindowFromMilliSeconds(min, max) {
  const traceWindow = {
    min: milliToMicro(min),
    max: milliToMicro(max),
    range: Types.Timing.Micro(milliToMicro(max) - milliToMicro(min))
  };
  return traceWindow;
}
export function traceWindowFromMicroSeconds(min, max) {
  const traceWindow = {
    min,
    max,
    range: max - min
  };
  return traceWindow;
}
export function traceWindowFromEvent(event) {
  return {
    min: event.ts,
    max: event.ts + (event.dur ?? 0),
    range: event.dur ?? 0
  };
}
export function traceWindowFromOverlay(overlay) {
  switch (overlay.type) {
    case "ENTRY_LABEL":
    case "ENTRY_OUTLINE":
    case "ENTRY_SELECTED": {
      return traceWindowFromEvent(overlay.entry);
    }
    case "TIMESPAN_BREAKDOWN": {
      const windows = overlay.sections.map((s) => s.bounds);
      if (overlay.entry) {
        windows.push(traceWindowFromEvent(overlay.entry));
      }
      return combineTraceWindowsMicro(windows);
    }
    case "CANDY_STRIPED_TIME_RANGE":
    case "TIME_RANGE": {
      return structuredClone(overlay.bounds);
    }
    case "ENTRIES_LINK": {
      const from = traceWindowFromEvent(overlay.entryFrom);
      if (!overlay.entryTo) {
        return from;
      }
      const to = traceWindowFromEvent(overlay.entryTo);
      return combineTraceWindowsMicro([from, to]);
    }
    case "TIMESTAMP_MARKER":
      return traceWindowFromMicroSeconds(overlay.timestamp, overlay.timestamp);
    case "TIMINGS_MARKER":
      return traceWindowFromMicroSeconds(overlay.adjustedTimestamp, overlay.adjustedTimestamp);
    case "BOTTOM_INFO_BAR":
      return null;
    default:
      Platform.TypeScriptUtilities.assertNever(overlay, `Unexpected overlay ${overlay}`);
  }
}
export function combineTraceWindowsMicro(windows) {
  if (!windows.length) {
    return null;
  }
  const result = structuredClone(windows[0]);
  for (const bounds of windows.slice(1)) {
    result.min = Math.min(result.min, bounds.min);
    result.max = Math.max(result.max, bounds.max);
  }
  result.range = result.max - result.min;
  return result;
}
export function boundsIncludeTimeRange(data) {
  const { min: visibleMin, max: visibleMax } = data.bounds;
  const { min: rangeMin, max: rangeMax } = data.timeRange;
  return visibleMin <= rangeMax && visibleMax >= rangeMin;
}
export function eventIsInBounds(event, bounds) {
  const startTime = event.ts;
  return startTime <= bounds.max && bounds.min < startTime + (event.dur ?? 0);
}
export function timestampIsInBounds(bounds, timestamp) {
  return timestamp >= bounds.min && timestamp <= bounds.max;
}
export function windowFitsInsideBounds(data) {
  return data.window.min >= data.bounds.min && data.window.max <= data.bounds.max;
}
export function windowsEqual(w1, w2) {
  return w1.min === w2.min && w1.max === w2.max;
}
//# sourceMappingURL=Timing.js.map
