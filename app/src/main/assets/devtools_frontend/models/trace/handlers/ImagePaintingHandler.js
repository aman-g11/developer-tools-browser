"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
let paintImageEvents = /* @__PURE__ */ new Map();
let decodeLazyPixelRefEvents = /* @__PURE__ */ new Map();
let paintImageByLazyPixelRef = /* @__PURE__ */ new Map();
let eventToPaintImage = /* @__PURE__ */ new Map();
let urlToPaintImage = /* @__PURE__ */ new Map();
let paintEventToCorrectedDisplaySize = /* @__PURE__ */ new Map();
let didCorrectForHostDpr = false;
export function reset() {
  paintImageEvents = /* @__PURE__ */ new Map();
  decodeLazyPixelRefEvents = /* @__PURE__ */ new Map();
  paintImageByLazyPixelRef = /* @__PURE__ */ new Map();
  eventToPaintImage = /* @__PURE__ */ new Map();
  urlToPaintImage = /* @__PURE__ */ new Map();
  paintEventToCorrectedDisplaySize = /* @__PURE__ */ new Map();
  didCorrectForHostDpr = false;
}
export function handleEvent(event) {
  if (Types.Events.isPaintImage(event)) {
    const forProcess = paintImageEvents.get(event.pid) || /* @__PURE__ */ new Map();
    const forThread = forProcess.get(event.tid) || [];
    forThread.push(event);
    forProcess.set(event.tid, forThread);
    paintImageEvents.set(event.pid, forProcess);
    if (event.args.data.url) {
      const paintsForUrl = Platform.MapUtilities.getWithDefault(urlToPaintImage, event.args.data.url, () => []);
      paintsForUrl.push(event);
    }
    return;
  }
  if (Types.Events.isDecodeLazyPixelRef(event) && typeof event.args?.LazyPixelRef !== "undefined") {
    const forProcess = decodeLazyPixelRefEvents.get(event.pid) || /* @__PURE__ */ new Map();
    const forThread = forProcess.get(event.tid) || [];
    forThread.push(event);
    forProcess.set(event.tid, forThread);
    decodeLazyPixelRefEvents.set(event.pid, forProcess);
  }
  if (Types.Events.isDrawLazyPixelRef(event) && typeof event.args?.LazyPixelRef !== "undefined") {
    const lastPaintEvent = paintImageEvents.get(event.pid)?.get(event.tid)?.at(-1);
    if (!lastPaintEvent) {
      return;
    }
    paintImageByLazyPixelRef.set(event.args.LazyPixelRef, lastPaintEvent);
    return;
  }
  if (Types.Events.isDecodeImage(event)) {
    const lastPaintImageEventOnThread = paintImageEvents.get(event.pid)?.get(event.tid)?.at(-1);
    if (lastPaintImageEventOnThread) {
      eventToPaintImage.set(event, lastPaintImageEventOnThread);
      return;
    }
    const lastDecodeLazyPixelRef = decodeLazyPixelRefEvents.get(event.pid)?.get(event.tid)?.at(-1);
    if (typeof lastDecodeLazyPixelRef?.args?.LazyPixelRef === "undefined") {
      return;
    }
    const paintEvent = paintImageByLazyPixelRef.get(lastDecodeLazyPixelRef.args.LazyPixelRef);
    if (!paintEvent) {
      return;
    }
    eventToPaintImage.set(event, paintEvent);
  }
}
export async function finalize(options) {
  if (!options.metadata?.hostDPR) {
    return;
  }
  const { devicePixelRatio: emulatedDpr } = metaHandlerData();
  if (!emulatedDpr) {
    return;
  }
  for (const byThread of paintImageEvents.values()) {
    for (const paintEvents of byThread.values()) {
      for (const paintEvent of paintEvents) {
        const cssPixelsWidth = paintEvent.args.data.width / options.metadata.hostDPR;
        const cssPixelsHeight = paintEvent.args.data.height / options.metadata.hostDPR;
        const width = cssPixelsWidth * emulatedDpr;
        const height = cssPixelsHeight * emulatedDpr;
        paintEventToCorrectedDisplaySize.set(paintEvent, { width, height });
      }
    }
  }
  didCorrectForHostDpr = true;
}
export function data() {
  return {
    paintImageByDrawLazyPixelRef: paintImageByLazyPixelRef,
    paintImageForEvent: eventToPaintImage,
    paintImageEventForUrl: urlToPaintImage,
    paintEventToCorrectedDisplaySize,
    didCorrectForHostDpr
  };
}
//# sourceMappingURL=ImagePaintingHandler.js.map
