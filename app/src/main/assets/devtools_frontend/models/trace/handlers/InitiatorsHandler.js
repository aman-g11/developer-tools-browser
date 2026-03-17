"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as AsyncJSCallsHandlerData } from "./AsyncJSCallsHandler.js";
import { data as flowsHandlerData } from "./FlowsHandler.js";
let lastScheduleStyleRecalcByFrame = /* @__PURE__ */ new Map();
let lastInvalidationEventForFrame = /* @__PURE__ */ new Map();
let lastRecalcByFrame = /* @__PURE__ */ new Map();
let eventToInitiatorMap = /* @__PURE__ */ new Map();
let initiatorToEventsMap = /* @__PURE__ */ new Map();
let timerInstallEventsById = /* @__PURE__ */ new Map();
let requestIdleCallbackEventsById = /* @__PURE__ */ new Map();
let webSocketCreateEventsById = /* @__PURE__ */ new Map();
let schedulePostTaskCallbackEventsById = /* @__PURE__ */ new Map();
export function reset() {
  lastScheduleStyleRecalcByFrame = /* @__PURE__ */ new Map();
  lastInvalidationEventForFrame = /* @__PURE__ */ new Map();
  lastRecalcByFrame = /* @__PURE__ */ new Map();
  timerInstallEventsById = /* @__PURE__ */ new Map();
  eventToInitiatorMap = /* @__PURE__ */ new Map();
  initiatorToEventsMap = /* @__PURE__ */ new Map();
  requestIdleCallbackEventsById = /* @__PURE__ */ new Map();
  webSocketCreateEventsById = /* @__PURE__ */ new Map();
  schedulePostTaskCallbackEventsById = /* @__PURE__ */ new Map();
}
function storeInitiator(data2) {
  eventToInitiatorMap.set(data2.event, data2.initiator);
  const eventsForInitiator = initiatorToEventsMap.get(data2.initiator) || [];
  eventsForInitiator.push(data2.event);
  initiatorToEventsMap.set(data2.initiator, eventsForInitiator);
}
export function handleEvent(event) {
  if (Types.Events.isScheduleStyleRecalculation(event)) {
    lastScheduleStyleRecalcByFrame.set(event.args.data.frame, event);
  } else if (Types.Events.isRecalcStyle(event)) {
    if (event.args.beginData) {
      lastRecalcByFrame.set(event.args.beginData.frame, event);
      const scheduledStyleForFrame = lastScheduleStyleRecalcByFrame.get(event.args.beginData.frame);
      if (scheduledStyleForFrame) {
        storeInitiator({
          event,
          initiator: scheduledStyleForFrame
        });
      }
    }
  } else if (Types.Events.isInvalidateLayout(event)) {
    let invalidationInitiator = event;
    if (!lastInvalidationEventForFrame.has(event.args.data.frame)) {
      const lastRecalcStyleForFrame = lastRecalcByFrame.get(event.args.data.frame);
      if (lastRecalcStyleForFrame) {
        const { endTime } = Helpers.Timing.eventTimingsMicroSeconds(lastRecalcStyleForFrame);
        const initiatorOfRecalcStyle = eventToInitiatorMap.get(lastRecalcStyleForFrame);
        if (initiatorOfRecalcStyle && endTime && endTime > event.ts) {
          invalidationInitiator = initiatorOfRecalcStyle;
        }
      }
    }
    lastInvalidationEventForFrame.set(event.args.data.frame, invalidationInitiator);
  } else if (Types.Events.isLayout(event)) {
    const lastInvalidation = lastInvalidationEventForFrame.get(event.args.beginData.frame);
    if (lastInvalidation) {
      storeInitiator({
        event,
        initiator: lastInvalidation
      });
    }
    lastInvalidationEventForFrame.delete(event.args.beginData.frame);
  } else if (Types.Events.isTimerInstall(event)) {
    timerInstallEventsById.set(event.args.data.timerId, event);
  } else if (Types.Events.isTimerFire(event)) {
    const matchingInstall = timerInstallEventsById.get(event.args.data.timerId);
    if (matchingInstall) {
      storeInitiator({ event, initiator: matchingInstall });
    }
  } else if (Types.Events.isRequestIdleCallback(event)) {
    requestIdleCallbackEventsById.set(event.args.data.id, event);
  } else if (Types.Events.isFireIdleCallback(event)) {
    const matchingRequestEvent = requestIdleCallbackEventsById.get(event.args.data.id);
    if (matchingRequestEvent) {
      storeInitiator({
        event,
        initiator: matchingRequestEvent
      });
    }
  } else if (Types.Events.isWebSocketCreate(event)) {
    webSocketCreateEventsById.set(event.args.data.identifier, event);
  } else if (Types.Events.isWebSocketInfo(event) || Types.Events.isWebSocketTransfer(event)) {
    const matchingCreateEvent = webSocketCreateEventsById.get(event.args.data.identifier);
    if (matchingCreateEvent) {
      storeInitiator({
        event,
        initiator: matchingCreateEvent
      });
    }
  } else if (Types.Events.isSchedulePostTaskCallback(event)) {
    schedulePostTaskCallbackEventsById.set(event.args.data.taskId, event);
  } else if (Types.Events.isRunPostTaskCallback(event) || Types.Events.isAbortPostTaskCallback(event)) {
    const matchingSchedule = schedulePostTaskCallbackEventsById.get(event.args.data.taskId);
    if (matchingSchedule) {
      storeInitiator({ event, initiator: matchingSchedule });
    }
  }
}
function createRelationshipsFromFlows() {
  const flows = flowsHandlerData().flows;
  for (let i = 0; i < flows.length; i++) {
    const flow = flows[i];
    for (let j = 0; j < flow.length - 1; j++) {
      storeInitiator({ event: flow[j + 1], initiator: flow[j] });
    }
  }
}
function createRelationshipsFromAsyncJSCalls() {
  const asyncCallEntries = AsyncJSCallsHandlerData().schedulerToRunEntryPoints.entries();
  for (const [asyncCaller, asyncCallees] of asyncCallEntries) {
    for (const asyncCallee of asyncCallees) {
      storeInitiator({ event: asyncCallee, initiator: asyncCaller });
    }
  }
}
export async function finalize() {
  createRelationshipsFromFlows();
  createRelationshipsFromAsyncJSCalls();
}
export function data() {
  return {
    eventToInitiator: eventToInitiatorMap,
    initiatorToEvents: initiatorToEventsMap
  };
}
export function deps() {
  return ["Flows", "AsyncJSCalls"];
}
//# sourceMappingURL=InitiatorsHandler.js.map
