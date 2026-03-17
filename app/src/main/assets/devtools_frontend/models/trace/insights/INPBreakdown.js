"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Handlers from "../handlers/handlers.js";
import * as Helpers from "../helpers/helpers.js";
import {
  InsightCategory,
  InsightKeys
} from "./types.js";
export const UIStrings = {
  /**
   * @description Text to tell the user about the longest user interaction.
   */
  description: "Start investigating [how to improve INP](https://developer.chrome.com/docs/performance/insights/inp-breakdown) by looking at the longest subpart.",
  /**
   * @description Title for the performance insight "INP breakdown", which shows a breakdown of INP by subparts / sections.
   */
  title: "INP breakdown",
  /**
   * @description Label used for the subpart/component/stage/section of a larger duration.
   */
  subpart: "Subpart",
  /**
   * @description Label used for a time duration.
   */
  duration: "Duration",
  // TODO: these are repeated in InteractionBreakdown. Add a place for common strings?
  /**
   * @description Text shown next to the interaction event's input delay time in the detail view.
   */
  inputDelay: "Input delay",
  /**
   * @description Text shown next to the interaction event's thread processing duration in the detail view.
   */
  processingDuration: "Processing duration",
  /**
   * @description Text shown next to the interaction event's presentation delay time in the detail view.
   */
  presentationDelay: "Presentation delay",
  /**
   * @description Text status indicating that no user interactions were detected.
   */
  noInteractions: "No interactions detected"
};
const str_ = i18n.i18n.registerUIStrings("models/trace/insights/INPBreakdown.ts", UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function isINPBreakdownInsight(insight) {
  return insight.insightKey === InsightKeys.INP_BREAKDOWN;
}
function finalize(partialModel) {
  let state = "pass";
  if (partialModel.longestInteractionEvent) {
    const classification = Handlers.ModelHandlers.UserInteractions.scoreClassificationForInteractionToNextPaint(
      partialModel.longestInteractionEvent.dur
    );
    if (classification === Handlers.ModelHandlers.PageLoadMetrics.ScoreClassification.GOOD) {
      state = "informative";
    } else {
      state = "fail";
    }
  }
  return {
    insightKey: InsightKeys.INP_BREAKDOWN,
    strings: UIStrings,
    title: i18nString(UIStrings.title),
    description: i18nString(UIStrings.description),
    docs: "https://developer.chrome.com/docs/performance/insights/inp-breakdown",
    category: InsightCategory.INP,
    state,
    ...partialModel
  };
}
export function generateInsight(data, context) {
  const interactionEvents = data.UserInteractions.interactionEventsWithNoNesting.filter((event) => {
    return Helpers.Timing.eventIsInBounds(event, context.bounds);
  });
  if (!interactionEvents.length) {
    return finalize({});
  }
  const longestByInteractionId = /* @__PURE__ */ new Map();
  for (const event of interactionEvents) {
    const key = event.interactionId;
    const longest = longestByInteractionId.get(key);
    if (!longest || event.dur > longest.dur) {
      longestByInteractionId.set(key, event);
    }
  }
  const normalizedInteractionEvents = [...longestByInteractionId.values()];
  normalizedInteractionEvents.sort((a, b) => b.dur - a.dur);
  const highPercentileIndex = Math.min(9, Math.floor(normalizedInteractionEvents.length / 50));
  return finalize({
    relatedEvents: [normalizedInteractionEvents[0]],
    longestInteractionEvent: normalizedInteractionEvents[0],
    highPercentileInteractionEvent: normalizedInteractionEvents[highPercentileIndex]
  });
}
export function createOverlaysForSubpart(event, subpartIndex = -1) {
  const p1 = Helpers.Timing.traceWindowFromMicroSeconds(
    event.ts,
    event.ts + event.inputDelay
  );
  const p2 = Helpers.Timing.traceWindowFromMicroSeconds(
    p1.max,
    p1.max + event.mainThreadHandling
  );
  const p3 = Helpers.Timing.traceWindowFromMicroSeconds(
    p2.max,
    p2.max + event.presentationDelay
  );
  let sections = [
    { bounds: p1, label: i18nString(UIStrings.inputDelay), showDuration: true },
    { bounds: p2, label: i18nString(UIStrings.processingDuration), showDuration: true },
    { bounds: p3, label: i18nString(UIStrings.presentationDelay), showDuration: true }
  ];
  if (subpartIndex !== -1) {
    sections = [sections[subpartIndex]];
  }
  return [
    {
      type: "TIMESPAN_BREAKDOWN",
      sections,
      renderLocation: "BELOW_EVENT",
      entry: event
    }
  ];
}
export function createOverlays(model) {
  const event = model.longestInteractionEvent;
  if (!event) {
    return [];
  }
  return createOverlaysForSubpart(event);
}
//# sourceMappingURL=INPBreakdown.js.map
