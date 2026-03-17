"use strict";
export var Category = /* @__PURE__ */ ((Category2) => {
  Category2["ANIMATION"] = "animation";
  Category2["AUCTION_WORKLET"] = "auction-worklet";
  Category2["CANVAS"] = "canvas";
  Category2["CLIPBOARD"] = "clipboard";
  Category2["CONTROL"] = "control";
  Category2["DEVICE"] = "device";
  Category2["DOM_MUTATION"] = "dom-mutation";
  Category2["DRAG_DROP"] = "drag-drop";
  Category2["GEOLOCATION"] = "geolocation";
  Category2["KEYBOARD"] = "keyboard";
  Category2["LOAD"] = "load";
  Category2["MEDIA"] = "media";
  Category2["MOUSE"] = "mouse";
  Category2["NOTIFICATION"] = "notification";
  Category2["PARSE"] = "parse";
  Category2["PICTURE_IN_PICTURE"] = "picture-in-picture";
  Category2["POINTER"] = "pointer";
  Category2["SCRIPT"] = "script";
  Category2["SHARED_STORAGE_WORKLET"] = "shared-storage-worklet";
  Category2["TIMER"] = "timer";
  Category2["TOUCH"] = "touch";
  Category2["TRUSTED_TYPE_VIOLATION"] = "trusted-type-violation";
  Category2["WEB_AUDIO"] = "web-audio";
  Category2["WINDOW"] = "window";
  Category2["WORKER"] = "worker";
  Category2["XHR"] = "xhr";
  return Category2;
})(Category || {});
export class CategorizedBreakpoint {
  /**
   * The name of this breakpoint as passed to 'setInstrumentationBreakpoint',
   * 'setEventListenerBreakpoint' and 'setBreakOnCSPViolation'.
   *
   * Note that the backend adds a 'listener:' and 'instrumentation:' prefix
   * to this name in the 'Debugger.paused' CDP event.
   */
  name;
  #category;
  #enabled;
  constructor(category, name) {
    this.#category = category;
    this.name = name;
    this.#enabled = false;
  }
  category() {
    return this.#category;
  }
  enabled() {
    return this.#enabled;
  }
  setEnabled(enabled) {
    this.#enabled = enabled;
  }
}
//# sourceMappingURL=CategorizedBreakpoint.js.map
