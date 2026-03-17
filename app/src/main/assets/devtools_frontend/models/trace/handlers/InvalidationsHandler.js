"use strict";
import * as Types from "../types/types.js";
const frameStateByFrame = /* @__PURE__ */ new Map();
let maxInvalidationsPerEvent = null;
export function reset() {
  frameStateByFrame.clear();
  maxInvalidationsPerEvent = null;
}
export function handleUserConfig(userConfig) {
  maxInvalidationsPerEvent = userConfig.maxInvalidationEventsPerEvent;
}
function getState(frameId) {
  let frameState = frameStateByFrame.get(frameId);
  if (!frameState) {
    frameState = {
      invalidationsForEvent: /* @__PURE__ */ new Map(),
      invalidationCountForEvent: /* @__PURE__ */ new Map(),
      lastRecalcStyleEvent: null,
      pendingInvalidations: [],
      hasPainted: false
    };
    frameStateByFrame.set(frameId, frameState);
  }
  return frameState;
}
function getFrameId(event) {
  if (Types.Events.isRecalcStyle(event) || Types.Events.isLayout(event)) {
    return event.args.beginData?.frame ?? null;
  }
  return event.args?.data?.frame ?? null;
}
function addInvalidationToEvent(frameState, event, invalidation) {
  const existingInvalidations = frameState.invalidationsForEvent.get(event) || [];
  existingInvalidations.push(invalidation);
  if (maxInvalidationsPerEvent !== null && existingInvalidations.length > maxInvalidationsPerEvent) {
    existingInvalidations.shift();
  }
  frameState.invalidationsForEvent.set(event, existingInvalidations);
  const count = frameState.invalidationCountForEvent.get(event) ?? 0;
  frameState.invalidationCountForEvent.set(event, count + 1);
}
export function handleEvent(event) {
  if (maxInvalidationsPerEvent === 0) {
    return;
  }
  const frameId = getFrameId(event);
  if (!frameId) {
    return;
  }
  const thisFrame = getState(frameId);
  if (Types.Events.isRecalcStyle(event)) {
    thisFrame.lastRecalcStyleEvent = event;
    for (const invalidation of thisFrame.pendingInvalidations) {
      if (Types.Events.isLayoutInvalidationTracking(invalidation)) {
        continue;
      }
      addInvalidationToEvent(thisFrame, event, invalidation);
    }
    return;
  }
  if (Types.Events.isInvalidationTracking(event)) {
    if (thisFrame.hasPainted) {
      thisFrame.pendingInvalidations.length = 0;
      thisFrame.lastRecalcStyleEvent = null;
      thisFrame.hasPainted = false;
    }
    if (thisFrame.lastRecalcStyleEvent && (Types.Events.isScheduleStyleInvalidationTracking(event) || Types.Events.isStyleRecalcInvalidationTracking(event) || Types.Events.isStyleInvalidatorInvalidationTracking(event))) {
      const recalcLastRecalc = thisFrame.lastRecalcStyleEvent;
      const recalcEndTime = recalcLastRecalc.ts + (recalcLastRecalc.dur || 0);
      if (event.ts >= recalcLastRecalc.ts && event.ts <= recalcEndTime) {
        addInvalidationToEvent(thisFrame, recalcLastRecalc, event);
      }
    }
    thisFrame.pendingInvalidations.push(event);
    return;
  }
  if (Types.Events.isPaint(event)) {
    thisFrame.hasPainted = true;
    return;
  }
  if (Types.Events.isLayout(event)) {
    for (const invalidation of thisFrame.pendingInvalidations) {
      if (!Types.Events.isLayoutInvalidationTracking(invalidation)) {
        continue;
      }
      addInvalidationToEvent(thisFrame, event, invalidation);
    }
  }
}
export async function finalize() {
}
export function data() {
  const invalidationsForEvent = /* @__PURE__ */ new Map();
  const invalidationCountForEvent = /* @__PURE__ */ new Map();
  for (const frame of frameStateByFrame.values()) {
    for (const [event, invalidations] of frame.invalidationsForEvent.entries()) {
      invalidationsForEvent.set(event, invalidations);
    }
    for (const [event, count] of frame.invalidationCountForEvent.entries()) {
      invalidationCountForEvent.set(event, count);
    }
  }
  return {
    invalidationsForEvent,
    invalidationCountForEvent
  };
}
//# sourceMappingURL=InvalidationsHandler.js.map
