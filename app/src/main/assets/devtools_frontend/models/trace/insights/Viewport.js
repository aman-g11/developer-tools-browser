"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Handlers from "../handlers/handlers.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import {
  InsightCategory,
  InsightKeys,
  InsightWarning
} from "./types.js";
export const UIStrings = {
  /** Title of an insight that provides details about if the page's viewport is optimized for mobile viewing. */
  title: "Optimize viewport for mobile",
  /**
   * @description Text to tell the user how a viewport meta element can improve performance. \xa0 is a non-breaking space
   */
  description: "Tap interactions may be [delayed by up to 300\xA0ms](https://developer.chrome.com/docs/performance/insights/viewport) if the viewport is not optimized for mobile.",
  /**
   * @description Text for a label describing the portion of an interaction event that was delayed due to a bad mobile viewport.
   */
  mobileTapDelayLabel: "Mobile tap delay"
};
const str_ = i18n.i18n.registerUIStrings("models/trace/insights/Viewport.ts", UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
function finalize(partialModel) {
  return {
    insightKey: InsightKeys.VIEWPORT,
    strings: UIStrings,
    title: i18nString(UIStrings.title),
    description: i18nString(UIStrings.description),
    docs: "https://developer.chrome.com/docs/performance/insights/viewport",
    category: InsightCategory.INP,
    state: partialModel.mobileOptimized === false ? "fail" : "pass",
    ...partialModel
  };
}
export function isViewportInsight(model) {
  return model.insightKey === InsightKeys.VIEWPORT;
}
export function generateInsight(data, context) {
  const viewportEvent = data.UserInteractions.parseMetaViewportEvents.find((event) => {
    if (event.args.data.frame !== context.frameId) {
      return false;
    }
    return Helpers.Timing.eventIsInBounds(event, context.bounds);
  });
  const compositorEvents = data.UserInteractions.beginCommitCompositorFrameEvents.filter((event) => {
    if (event.args.frame !== context.frameId) {
      return false;
    }
    if (viewportEvent && event.ts < viewportEvent.ts) {
      return false;
    }
    return Helpers.Timing.eventIsInBounds(event, context.bounds);
  });
  if (!compositorEvents.length) {
    return finalize({
      mobileOptimized: null,
      warnings: [InsightWarning.NO_LAYOUT]
    });
  }
  for (const event of compositorEvents) {
    if (!event.args.is_mobile_optimized) {
      const longPointerInteractions = [...data.UserInteractions.interactionsOverThreshold.values()].filter(
        (interaction) => Handlers.ModelHandlers.UserInteractions.categoryOfInteraction(interaction) === "POINTER" && interaction.inputDelay >= 5e4
      );
      const inputDelay = Math.max(0, ...longPointerInteractions.map((interaction) => interaction.inputDelay)) / 1e3;
      const inpMetricSavings = Platform.NumberUtilities.clamp(inputDelay, 0, 300);
      return finalize({
        mobileOptimized: false,
        viewportEvent,
        longPointerInteractions,
        metricSavings: { INP: inpMetricSavings }
      });
    }
  }
  return finalize({
    mobileOptimized: true,
    viewportEvent
  });
}
export function createOverlays(model) {
  if (!model.longPointerInteractions) {
    return [];
  }
  return model.longPointerInteractions.map((interaction) => {
    const delay = Math.min(interaction.inputDelay, 300 * 1e3);
    const bounds = Helpers.Timing.traceWindowFromMicroSeconds(
      Types.Timing.Micro(interaction.ts),
      Types.Timing.Micro(interaction.ts + delay)
    );
    return {
      type: "TIMESPAN_BREAKDOWN",
      entry: interaction,
      sections: [{ bounds, label: i18nString(UIStrings.mobileTapDelayLabel), showDuration: true }],
      renderLocation: "ABOVE_EVENT"
    };
  });
}
//# sourceMappingURL=Viewport.js.map
