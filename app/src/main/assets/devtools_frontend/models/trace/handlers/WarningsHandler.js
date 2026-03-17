"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as userInteractionsHandlerData } from "./UserInteractionsHandler.js";
import { data as workersData } from "./WorkersHandler.js";
let warningsPerEvent = /* @__PURE__ */ new Map();
let eventsPerWarning = /* @__PURE__ */ new Map();
let allEventsStack = [];
let jsInvokeStack = [];
let taskReflowEvents = [];
let longTaskEvents = [];
export const FORCED_REFLOW_THRESHOLD = Helpers.Timing.milliToMicro(Types.Timing.Milli(30));
export const LONG_MAIN_THREAD_TASK_THRESHOLD = Helpers.Timing.milliToMicro(Types.Timing.Milli(50));
export function reset() {
  warningsPerEvent = /* @__PURE__ */ new Map();
  eventsPerWarning = /* @__PURE__ */ new Map();
  allEventsStack = [];
  jsInvokeStack = [];
  taskReflowEvents = [];
  longTaskEvents = [];
}
function storeWarning(event, warning) {
  const existingWarnings = Platform.MapUtilities.getWithDefault(warningsPerEvent, event, () => []);
  existingWarnings.push(warning);
  warningsPerEvent.set(event, existingWarnings);
  const existingEvents = Platform.MapUtilities.getWithDefault(eventsPerWarning, warning, () => []);
  existingEvents.push(event);
  eventsPerWarning.set(warning, existingEvents);
}
export function handleEvent(event) {
  processForcedReflowWarning(event);
  if (event.name === Types.Events.Name.RUN_TASK) {
    const { duration } = Helpers.Timing.eventTimingsMicroSeconds(event);
    if (duration > LONG_MAIN_THREAD_TASK_THRESHOLD) {
      longTaskEvents.push(event);
    }
    return;
  }
  if (Types.Events.isFireIdleCallback(event)) {
    const { duration } = Helpers.Timing.eventTimingsMilliSeconds(event);
    if (duration > event.args.data.allottedMilliseconds) {
      storeWarning(event, "IDLE_CALLBACK_OVER_TIME");
    }
    return;
  }
}
function processForcedReflowWarning(event) {
  accomodateEventInStack(event, allEventsStack);
  accomodateEventInStack(
    event,
    jsInvokeStack,
    /* pushEventToStack */
    Types.Events.isJSInvocationEvent(event)
  );
  if (jsInvokeStack.length) {
    if (event.name === Types.Events.Name.LAYOUT || event.name === Types.Events.Name.RECALC_STYLE) {
      taskReflowEvents.push(event);
      return;
    }
  }
  if (allEventsStack.length === 1) {
    const totalTime = taskReflowEvents.reduce((time, event2) => time + (event2.dur || 0), 0);
    if (totalTime >= FORCED_REFLOW_THRESHOLD) {
      taskReflowEvents.forEach((reflowEvent) => storeWarning(reflowEvent, "FORCED_REFLOW"));
    }
    taskReflowEvents.length = 0;
  }
}
function accomodateEventInStack(event, stack, pushEventToStack = true) {
  let nextItem = stack.at(-1);
  while (nextItem && event.ts > nextItem.ts + (nextItem.dur || 0)) {
    stack.pop();
    nextItem = stack.at(-1);
  }
  if (!pushEventToStack) {
    return;
  }
  stack.push(event);
}
export function deps() {
  return ["UserInteractions", "Workers"];
}
export async function finalize() {
  const longInteractions = userInteractionsHandlerData().interactionsOverThreshold;
  for (const interaction of longInteractions) {
    storeWarning(interaction, "LONG_INTERACTION");
  }
  for (const event of longTaskEvents) {
    if (!(event.tid, workersData().workerIdByThread.has(event.tid))) {
      storeWarning(event, "LONG_TASK");
    }
  }
  longTaskEvents.length = 0;
}
export function data() {
  return {
    perEvent: warningsPerEvent,
    perWarning: eventsPerWarning
  };
}
//# sourceMappingURL=WarningsHandler.js.map
