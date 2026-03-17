"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Trace from "../../../models/trace/trace.js";
import * as uiI18n from "../../../ui/i18n/i18n.js";
import { Link } from "../../../ui/kit/kit.js";
const UIStrings = {
  /**
   * @description Text in the Performance panel for a forced style and layout calculation of elements
   * in a page. See https://developer.mozilla.org/en-US/docs/Glossary/Reflow
   */
  forcedReflow: "Forced reflow",
  /**
   * @description Text in Timeline UIUtils of the Performance panel
   * @example {Forced reflow} PH1
   */
  sIsALikelyPerformanceBottleneck: "{PH1} is a likely performance bottleneck.",
  /**
   * @description Text in the Performance panel for a function called during a time the browser was
   * idle (inactive), which to longer to execute than a predefined deadline.
   * @example {10ms} PH1
   */
  idleCallbackExecutionExtended: "Idle callback execution extended beyond deadline by {PH1}",
  /**
   * @description Text in the Performance panel which describes how long a task took.
   * @example {task} PH1
   * @example {10ms} PH2
   */
  sTookS: "{PH1} took {PH2}.",
  /**
   * @description Text in the Performance panel for a task that took long. See
   * https://developer.mozilla.org/en-US/docs/Glossary/Long_task
   */
  longTask: "Long task",
  /**
   * @description Text used to highlight a long interaction and link to web.dev/inp
   */
  longInteractionINP: "Long interaction",
  /**
   * @description Text in Timeline UIUtils of the Performance panel when the
   *             user clicks on a long interaction.
   * @example {Long interaction} PH1
   */
  sIsLikelyPoorPageResponsiveness: "{PH1} is indicating poor page responsiveness.",
  /**
   * @description Text in Timeline UIUtils of the Performance panel
   */
  websocketProtocol: "WebSocket protocol",
  /**
   * @description Details text indicating how many bytes were received in a WebSocket message
   * @example {1024} PH1
   */
  webSocketBytes: "{PH1} byte(s)",
  /**
   * @description Details text indicating how many bytes were sent in a WebSocket message
   */
  webSocketDataLength: "Data length"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/DetailsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function buildWarningElementsForEvent(event, parsedTrace) {
  const warnings = parsedTrace.data.Warnings.perEvent.get(event);
  const warningElements = [];
  if (!warnings) {
    return warningElements;
  }
  for (const warning of warnings) {
    const duration = Trace.Helpers.Timing.microToMilli(Trace.Types.Timing.Micro(event.dur || 0));
    const span = document.createElement("span");
    switch (warning) {
      case "FORCED_REFLOW": {
        const forcedReflowLink = Link.create(
          "https://developers.google.com/web/fundamentals/performance/rendering/avoid-large-complex-layouts-and-layout-thrashing#avoid-forced-synchronous-layouts",
          i18nString(UIStrings.forcedReflow),
          void 0,
          "forced-reflow"
        );
        span.appendChild(
          uiI18n.getFormatLocalizedString(str_, UIStrings.sIsALikelyPerformanceBottleneck, { PH1: forcedReflowLink })
        );
        break;
      }
      case "IDLE_CALLBACK_OVER_TIME": {
        if (!Trace.Types.Events.isFireIdleCallback(event)) {
          break;
        }
        const exceededMs = i18n.TimeUtilities.millisToString((duration || 0) - event.args.data["allottedMilliseconds"], true);
        span.textContent = i18nString(UIStrings.idleCallbackExecutionExtended, { PH1: exceededMs });
        break;
      }
      case "LONG_TASK": {
        const longTaskLink = Link.create(
          "https://web.dev/optimize-long-tasks/",
          i18nString(UIStrings.longTask),
          void 0,
          "long-tasks"
        );
        span.appendChild(uiI18n.getFormatLocalizedString(
          str_,
          UIStrings.sTookS,
          { PH1: longTaskLink, PH2: i18n.TimeUtilities.millisToString(duration || 0, true) }
        ));
        break;
      }
      case "LONG_INTERACTION": {
        const longInteractionINPLink = Link.create("https://web.dev/inp", i18nString(UIStrings.longInteractionINP), void 0, "long-interaction");
        span.appendChild(uiI18n.getFormatLocalizedString(
          str_,
          UIStrings.sIsLikelyPoorPageResponsiveness,
          { PH1: longInteractionINPLink }
        ));
        break;
      }
      default: {
        Platform.assertNever(warning, `Unhandled warning type ${warning}`);
      }
    }
    warningElements.push(span);
  }
  return warningElements;
}
export function buildRowsForWebSocketEvent(event, parsedTrace) {
  const rows = [];
  const initiator = parsedTrace.data.Initiators.eventToInitiator.get(event);
  if (initiator && Trace.Types.Events.isWebSocketCreate(initiator)) {
    rows.push({ key: i18n.i18n.lockedString("URL"), value: initiator.args.data.url });
    if (initiator.args.data.websocketProtocol) {
      rows.push({ key: i18nString(UIStrings.websocketProtocol), value: initiator.args.data.websocketProtocol });
    }
  } else if (Trace.Types.Events.isWebSocketCreate(event)) {
    rows.push({ key: i18n.i18n.lockedString("URL"), value: event.args.data.url });
    if (event.args.data.websocketProtocol) {
      rows.push({ key: i18nString(UIStrings.websocketProtocol), value: event.args.data.websocketProtocol });
    }
  }
  if (Trace.Types.Events.isWebSocketTransfer(event)) {
    if (event.args.data.dataLength) {
      rows.push({
        key: i18nString(UIStrings.webSocketDataLength),
        value: `${i18nString(UIStrings.webSocketBytes, { PH1: event.args.data.dataLength })}`
      });
    }
  }
  return rows;
}
export function generateInvalidationsList(invalidations) {
  const groupedByReason = {};
  const backendNodeIds = /* @__PURE__ */ new Set();
  for (const invalidation of invalidations) {
    backendNodeIds.add(invalidation.args.data.nodeId);
    let reason = invalidation.args.data.reason || "unknown";
    if (reason === "unknown" && Trace.Types.Events.isScheduleStyleInvalidationTracking(invalidation) && invalidation.args.data.invalidatedSelectorId) {
      switch (invalidation.args.data.invalidatedSelectorId) {
        case "attribute":
          reason = "Attribute";
          if (invalidation.args.data.changedAttribute) {
            reason += ` (${invalidation.args.data.changedAttribute})`;
          }
          break;
        case "class":
          reason = "Class";
          if (invalidation.args.data.changedClass) {
            reason += ` (${invalidation.args.data.changedClass})`;
          }
          break;
        case "id":
          reason = "Id";
          if (invalidation.args.data.changedId) {
            reason += ` (${invalidation.args.data.changedId})`;
          }
          break;
      }
    }
    if (reason === "PseudoClass" && Trace.Types.Events.isStyleRecalcInvalidationTracking(invalidation) && invalidation.args.data.extraData) {
      reason += invalidation.args.data.extraData;
    }
    if (reason === "Attribute" && Trace.Types.Events.isStyleRecalcInvalidationTracking(invalidation) && invalidation.args.data.extraData) {
      reason += ` (${invalidation.args.data.extraData})`;
    }
    if (reason === "StyleInvalidator") {
      continue;
    }
    const existing = groupedByReason[reason] || [];
    existing.push(invalidation);
    groupedByReason[reason] = existing;
  }
  return { groupedByReason, backendNodeIds };
}
//# sourceMappingURL=DetailsView.js.map
