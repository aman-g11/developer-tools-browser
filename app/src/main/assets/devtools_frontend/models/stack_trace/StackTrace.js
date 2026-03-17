"use strict";
export var MissingDebugInfoType = /* @__PURE__ */ ((MissingDebugInfoType2) => {
  MissingDebugInfoType2["NO_INFO"] = "NO_INFO";
  MissingDebugInfoType2["PARTIAL_INFO"] = "PARTIAL_INFO";
  return MissingDebugInfoType2;
})(MissingDebugInfoType || {});
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["UPDATED"] = "UPDATED";
  return Events2;
})(Events || {});
export class DebuggableFrameFlavor {
  static #last;
  frame;
  /** Use the static {@link for}. Only public to satisfy the `setFlavor` Ctor type  */
  constructor(frame) {
    this.frame = frame;
  }
  get sdkFrame() {
    return this.frame.sdkFrame;
  }
  /** @returns the same instance of DebuggableFrameFlavor for repeated calls with the same (i.e. deep equal) DebuggableFrame */
  static for(frame) {
    function equals(a, b) {
      return a.url === b.url && a.uiSourceCode === b.uiSourceCode && a.name === b.name && a.line === b.line && a.column === b.column && a.sdkFrame === b.sdkFrame && JSON.stringify(a.missingDebugInfo) === JSON.stringify(b.missingDebugInfo);
    }
    if (!DebuggableFrameFlavor.#last || !equals(DebuggableFrameFlavor.#last.frame, frame)) {
      DebuggableFrameFlavor.#last = new DebuggableFrameFlavor(frame);
    }
    return DebuggableFrameFlavor.#last;
  }
}
//# sourceMappingURL=StackTrace.js.map
