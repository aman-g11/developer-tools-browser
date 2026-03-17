"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
const IDLE_FUNCTION_CALL_NAMES = /* @__PURE__ */ new Set([
  "(program)",
  "(idle)",
  "(root)"
]);
export function calculateWindow(traceBounds, mainThreadEntries) {
  if (!mainThreadEntries.length) {
    return traceBounds;
  }
  const entriesWithIdleRemoved = mainThreadEntries.filter((entry) => {
    if (Types.Events.isProfileCall(entry) && (IDLE_FUNCTION_CALL_NAMES.has(entry.callFrame.functionName) || !entry.callFrame.functionName)) {
      return false;
    }
    return true;
  });
  if (entriesWithIdleRemoved.length === 0) {
    return traceBounds;
  }
  function findLowUtilizationRegion(startIndex, stopIndex) {
    const threshold = 0.1;
    let cutIndex = startIndex;
    const entryAtCut = entriesWithIdleRemoved[cutIndex];
    const timings = Helpers.Timing.eventTimingsMicroSeconds(entryAtCut);
    let cutTime = (timings.startTime + timings.endTime) / 2;
    let usedTime = 0;
    const step = Math.sign(stopIndex - startIndex);
    for (let i = startIndex; i !== stopIndex; i += step) {
      const task = entriesWithIdleRemoved[i];
      const taskTimings = Helpers.Timing.eventTimingsMicroSeconds(task);
      const taskTime = (taskTimings.startTime + taskTimings.endTime) / 2;
      const interval = Math.abs(cutTime - taskTime);
      if (usedTime < threshold * interval) {
        cutIndex = i;
        cutTime = taskTime;
        usedTime = 0;
      }
      usedTime += taskTimings.duration;
    }
    return cutIndex;
  }
  const rightIndex = findLowUtilizationRegion(entriesWithIdleRemoved.length - 1, 0);
  const leftIndex = findLowUtilizationRegion(0, rightIndex);
  const leftTimings = Helpers.Timing.eventTimingsMicroSeconds(entriesWithIdleRemoved[leftIndex]);
  const rightTimings = Helpers.Timing.eventTimingsMicroSeconds(entriesWithIdleRemoved[rightIndex]);
  let leftTime = leftTimings.startTime;
  let rightTime = rightTimings.endTime;
  const zoomedInSpan = rightTime - leftTime;
  if (zoomedInSpan < traceBounds.range * 0.1) {
    return traceBounds;
  }
  leftTime = Types.Timing.Micro(Math.max(leftTime - 0.05 * zoomedInSpan, traceBounds.min));
  rightTime = Types.Timing.Micro(Math.min(rightTime + 0.05 * zoomedInSpan, traceBounds.max));
  return {
    min: leftTime,
    max: rightTime,
    range: Types.Timing.Micro(rightTime - leftTime)
  };
}
//# sourceMappingURL=MainThreadActivity.js.map
