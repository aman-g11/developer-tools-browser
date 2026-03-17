"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
import { ScoreClassification } from "./PageLoadMetricsHandler.js";
let beginCommitCompositorFrameEvents = [];
let parseMetaViewportEvents = [];
export const LONG_INTERACTION_THRESHOLD = Helpers.Timing.milliToMicro(Types.Timing.Milli(200));
const INP_GOOD_TIMING = LONG_INTERACTION_THRESHOLD;
const INP_MEDIUM_TIMING = Helpers.Timing.milliToMicro(Types.Timing.Milli(500));
let longestInteractionEvent = null;
let interactionEvents = [];
let interactionEventsWithNoNesting = [];
let eventTimingStartEventsForInteractions = [];
let eventTimingEndEventsForInteractions = [];
export function reset() {
  beginCommitCompositorFrameEvents = [];
  parseMetaViewportEvents = [];
  interactionEvents = [];
  eventTimingStartEventsForInteractions = [];
  eventTimingEndEventsForInteractions = [];
  interactionEventsWithNoNesting = [];
  longestInteractionEvent = null;
}
export function handleEvent(event) {
  if (Types.Events.isBeginCommitCompositorFrame(event)) {
    beginCommitCompositorFrameEvents.push(event);
    return;
  }
  if (Types.Events.isParseMetaViewport(event)) {
    parseMetaViewportEvents.push(event);
    return;
  }
  if (!Types.Events.isEventTiming(event)) {
    return;
  }
  if (Types.Events.isEventTimingEnd(event)) {
    eventTimingEndEventsForInteractions.push(event);
  }
  if (!event.args.data || !Types.Events.isEventTimingStart(event)) {
    return;
  }
  const { duration, interactionId } = event.args.data;
  if (duration < 1 || interactionId === void 0 || interactionId === 0) {
    return;
  }
  eventTimingStartEventsForInteractions.push(event);
}
const pointerEventTypes = /* @__PURE__ */ new Set([
  "pointerdown",
  "touchstart",
  "pointerup",
  "touchend",
  "mousedown",
  "mouseup",
  "click"
]);
const keyboardEventTypes = /* @__PURE__ */ new Set([
  "keydown",
  "keypress",
  "keyup"
]);
export function categoryOfInteraction(interaction) {
  if (pointerEventTypes.has(interaction.type)) {
    return "POINTER";
  }
  if (keyboardEventTypes.has(interaction.type)) {
    return "KEYBOARD";
  }
  return "OTHER";
}
export function removeNestedInteractionsAndSetProcessingTime(interactions) {
  const earliestEventForEndTimePerCategory = {
    POINTER: /* @__PURE__ */ new Map(),
    KEYBOARD: /* @__PURE__ */ new Map(),
    OTHER: /* @__PURE__ */ new Map()
  };
  function storeEventIfEarliestForCategoryAndEndTime(interaction) {
    const category = categoryOfInteraction(interaction);
    const earliestEventForEndTime = earliestEventForEndTimePerCategory[category];
    const endTime = Types.Timing.Micro(interaction.ts + interaction.dur);
    const earliestCurrentEvent = earliestEventForEndTime.get(endTime);
    if (!earliestCurrentEvent) {
      earliestEventForEndTime.set(endTime, interaction);
      return;
    }
    if (interaction.ts < earliestCurrentEvent.ts) {
      earliestEventForEndTime.set(endTime, interaction);
    } else if (interaction.ts === earliestCurrentEvent.ts && interaction.interactionId === earliestCurrentEvent.interactionId) {
      const currentProcessingDuration = earliestCurrentEvent.processingEnd - earliestCurrentEvent.processingStart;
      const newProcessingDuration = interaction.processingEnd - interaction.processingStart;
      if (newProcessingDuration > currentProcessingDuration) {
        earliestEventForEndTime.set(endTime, interaction);
      }
    }
    if (interaction.processingStart < earliestCurrentEvent.processingStart) {
      earliestCurrentEvent.processingStart = interaction.processingStart;
      writeSyntheticTimespans(earliestCurrentEvent);
    }
    if (interaction.processingEnd > earliestCurrentEvent.processingEnd) {
      earliestCurrentEvent.processingEnd = interaction.processingEnd;
      writeSyntheticTimespans(earliestCurrentEvent);
    }
  }
  for (const interaction of interactions) {
    storeEventIfEarliestForCategoryAndEndTime(interaction);
  }
  const keptEvents = Object.values(earliestEventForEndTimePerCategory).flatMap((eventsByEndTime) => Array.from(eventsByEndTime.values()));
  keptEvents.sort((eventA, eventB) => {
    return eventA.ts - eventB.ts;
  });
  return keptEvents;
}
function writeSyntheticTimespans(event) {
  const startEvent = event.args.data.beginEvent;
  const endEvent = event.args.data.endEvent;
  event.inputDelay = Types.Timing.Micro(event.processingStart - startEvent.ts);
  event.mainThreadHandling = Types.Timing.Micro(event.processingEnd - event.processingStart);
  event.presentationDelay = Types.Timing.Micro(endEvent.ts - event.processingEnd);
}
export async function finalize() {
  const { navigationsByFrameId } = metaHandlerData();
  const beginAndEndEvents = Platform.ArrayUtilities.mergeOrdered(
    eventTimingStartEventsForInteractions,
    eventTimingEndEventsForInteractions,
    Helpers.Trace.eventTimeComparator
  );
  const beginEventById = /* @__PURE__ */ new Map();
  for (const event of beginAndEndEvents) {
    if (Types.Events.isEventTimingStart(event)) {
      const forId = beginEventById.get(event.id) ?? [];
      forId.push(event);
      beginEventById.set(event.id, forId);
    } else if (Types.Events.isEventTimingEnd(event)) {
      const beginEvents = beginEventById.get(event.id) ?? [];
      const beginEvent = beginEvents.pop();
      if (!beginEvent) {
        continue;
      }
      const { type, interactionId, timeStamp, processingStart, processingEnd } = beginEvent.args.data;
      if (!type || !interactionId || !timeStamp || !processingStart || !processingEnd) {
        continue;
      }
      const processingStartRelativeToTraceTime = Types.Timing.Micro(
        Helpers.Timing.milliToMicro(processingStart) - Helpers.Timing.milliToMicro(timeStamp) + beginEvent.ts
      );
      const processingEndRelativeToTraceTime = Types.Timing.Micro(
        Helpers.Timing.milliToMicro(processingEnd) - Helpers.Timing.milliToMicro(timeStamp) + beginEvent.ts
      );
      const frameId = beginEvent.args.frame ?? beginEvent.args.data.frame ?? "";
      const navigation = Helpers.Trace.getNavigationForTraceEvent(beginEvent, frameId, navigationsByFrameId);
      const navigationId = navigation?.args.data?.navigationId;
      const interactionEvent = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
        // Use the start event to define the common fields.
        rawSourceEvent: beginEvent,
        cat: beginEvent.cat,
        name: beginEvent.name,
        pid: beginEvent.pid,
        tid: beginEvent.tid,
        ph: beginEvent.ph,
        processingStart: processingStartRelativeToTraceTime,
        processingEnd: processingEndRelativeToTraceTime,
        // These will be set in writeSyntheticTimespans()
        inputDelay: Types.Timing.Micro(-1),
        mainThreadHandling: Types.Timing.Micro(-1),
        presentationDelay: Types.Timing.Micro(-1),
        args: {
          data: {
            beginEvent,
            endEvent: event,
            frame: frameId,
            navigationId
          }
        },
        ts: beginEvent.ts,
        dur: Types.Timing.Micro(event.ts - beginEvent.ts),
        type: beginEvent.args.data.type,
        interactionId: beginEvent.args.data.interactionId
      });
      writeSyntheticTimespans(interactionEvent);
      interactionEvents.push(interactionEvent);
    }
  }
  Helpers.Trace.sortTraceEventsInPlace(interactionEvents);
  interactionEventsWithNoNesting.push(...removeNestedInteractionsAndSetProcessingTime(interactionEvents));
  for (const interactionEvent of interactionEventsWithNoNesting) {
    if (!longestInteractionEvent || longestInteractionEvent.dur < interactionEvent.dur) {
      longestInteractionEvent = interactionEvent;
    }
  }
}
export function data() {
  return {
    beginCommitCompositorFrameEvents,
    parseMetaViewportEvents,
    interactionEvents,
    interactionEventsWithNoNesting,
    longestInteractionEvent,
    interactionsOverThreshold: new Set(interactionEvents.filter((event) => {
      return event.dur > LONG_INTERACTION_THRESHOLD;
    }))
  };
}
export function deps() {
  return ["Meta"];
}
export function scoreClassificationForInteractionToNextPaint(timing) {
  if (timing <= INP_GOOD_TIMING) {
    return ScoreClassification.GOOD;
  }
  if (timing <= INP_MEDIUM_TIMING) {
    return ScoreClassification.OK;
  }
  return ScoreClassification.BAD;
}
//# sourceMappingURL=UserInteractionsHandler.js.map
