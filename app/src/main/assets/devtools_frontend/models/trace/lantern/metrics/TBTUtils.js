"use strict";
const BLOCKING_TIME_THRESHOLD = 50;
function calculateTbtImpactForEvent(event, startTimeMs, endTimeMs, topLevelEvent) {
  let threshold = BLOCKING_TIME_THRESHOLD;
  if (topLevelEvent) {
    threshold *= event.duration / topLevelEvent.duration;
  }
  if (event.duration < threshold) {
    return 0;
  }
  if (event.end < startTimeMs) {
    return 0;
  }
  if (event.start > endTimeMs) {
    return 0;
  }
  const clippedStart = Math.max(event.start, startTimeMs);
  const clippedEnd = Math.min(event.end, endTimeMs);
  const clippedDuration = clippedEnd - clippedStart;
  if (clippedDuration < threshold) {
    return 0;
  }
  return clippedDuration - threshold;
}
function calculateSumOfBlockingTime(topLevelEvents, startTimeMs, endTimeMs) {
  if (endTimeMs <= startTimeMs) {
    return 0;
  }
  let sumBlockingTime = 0;
  for (const event of topLevelEvents) {
    sumBlockingTime += calculateTbtImpactForEvent(event, startTimeMs, endTimeMs);
  }
  return sumBlockingTime;
}
export {
  BLOCKING_TIME_THRESHOLD,
  calculateSumOfBlockingTime,
  calculateTbtImpactForEvent
};
//# sourceMappingURL=TBTUtils.js.map
