"use strict";
export const EVENT_BINDING_NAME = "__chromium_devtools_metrics_reporter";
export const INTERNAL_KILL_SWITCH = "__chromium_devtools_kill_live_metrics";
export const SCRIPTS_PER_LOAF_LIMIT = 10;
export const LOAF_LIMIT = 5;
export function getUniqueLayoutShiftId(entry) {
  return `layout-shift-${entry.value}-${entry.startTime}`;
}
//# sourceMappingURL=spec.prebundle.js.map
