"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Trace from "../../models/trace/trace.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
const UIStrings = {
  /**
   * @description Text in the Performance panel to show how long was spent in a particular part of the code.
   * The first placeholder is the total time taken for this node and all children, the second is the self time
   * (time taken in this node, without children included).
   * @example {10ms} PH1
   * @example {10ms} PH2
   */
  sSelfS: "{PH1} (self {PH2})"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/AppenderUtils.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function buildGroupStyle(extra) {
  const defaultGroupStyle = {
    padding: 4,
    height: 17,
    collapsible: PerfUI.FlameChart.GroupCollapsibleState.ALWAYS,
    color: ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-on-surface"),
    backgroundColor: ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container"),
    nestingLevel: 0,
    shareHeaderLine: true
  };
  return Object.assign(defaultGroupStyle, extra);
}
export function buildTrackHeader(jslogContext, startLevel, name, style, selectable, expanded, showStackContextMenu) {
  const group = {
    startLevel,
    name,
    style,
    selectable,
    expanded,
    showStackContextMenu
  };
  if (jslogContext !== null) {
    group.jslogContext = jslogContext;
  }
  return group;
}
export function getDurationString(totalTime, selfTime) {
  if (!totalTime) {
    return "";
  }
  const totalMs = Trace.Helpers.Timing.microToMilli(totalTime);
  if (selfTime === void 0) {
    return i18n.TimeUtilities.millisToString(totalMs, true);
  }
  const selfMs = Trace.Helpers.Timing.microToMilli(selfTime);
  const minSelfTimeSignificance = Trace.Types.Timing.Milli(1e-6);
  const formattedTime = Math.abs(totalMs - selfMs) > minSelfTimeSignificance && selfMs > minSelfTimeSignificance ? i18nString(UIStrings.sSelfS, {
    PH1: i18n.TimeUtilities.millisToString(totalMs, true),
    PH2: i18n.TimeUtilities.millisToString(selfMs, true)
  }) : i18n.TimeUtilities.millisToString(totalMs, true);
  return formattedTime;
}
export function getEventLevel(event, lastTimestampByLevel) {
  let level = 0;
  const startTime = event.ts;
  const endTime = event.ts + (event.dur || 0);
  while (level < lastTimestampByLevel.length && startTime < lastTimestampByLevel[level]) {
    ++level;
  }
  lastTimestampByLevel[level] = endTime;
  return level;
}
export function addDecorationToEvent(timelineData, eventIndex, decoration) {
  const decorationsForEvent = timelineData.entryDecorations[eventIndex] || [];
  decorationsForEvent.push(decoration);
  timelineData.entryDecorations[eventIndex] = decorationsForEvent;
}
//# sourceMappingURL=AppenderUtils.js.map
