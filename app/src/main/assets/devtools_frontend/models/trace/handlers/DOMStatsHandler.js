"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
let domStatsByFrameId = /* @__PURE__ */ new Map();
export function reset() {
  domStatsByFrameId = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (!Types.Events.isDOMStats(event)) {
    return;
  }
  const domStatEvents = Platform.MapUtilities.getWithDefault(domStatsByFrameId, event.args.data.frame, () => []);
  domStatEvents.push(event);
}
export async function finalize() {
}
export function data() {
  return { domStatsByFrameId };
}
//# sourceMappingURL=DOMStatsHandler.js.map
