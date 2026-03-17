"use strict";
import * as Types from "../types/types.js";
let frames = /* @__PURE__ */ new Map();
export function reset() {
  frames = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isTracingStartedInBrowser(event)) {
    for (const frame of event.args.data?.frames ?? []) {
      frames.set(frame.frame, frame);
    }
    return;
  }
  if (Types.Events.isCommitLoad(event)) {
    const frameData = event.args.data;
    if (!frameData) {
      return;
    }
    const frame = frames.get(frameData.frame);
    if (!frame) {
      return;
    }
    frames.set(frameData.frame, {
      ...frame,
      url: frameData.url || frame.url,
      name: frameData.name || frameData.name
    });
  }
}
export async function finalize() {
}
export function data() {
  return {
    frames
  };
}
//# sourceMappingURL=PageFramesHandler.js.map
