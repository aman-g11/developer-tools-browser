"use strict";
import * as Types from "../types/types.js";
let textPaintByDOMNodeId = /* @__PURE__ */ new Map();
export function reset() {
  textPaintByDOMNodeId = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (!Types.Events.isLargestTextPaintCandidate(event)) {
    return;
  }
  if (!event.args.data) {
    return;
  }
  textPaintByDOMNodeId.set(event.args.data.DOMNodeId, event);
}
export async function finalize() {
}
export function data() {
  return textPaintByDOMNodeId;
}
//# sourceMappingURL=LargestTextPaintHandler.js.map
