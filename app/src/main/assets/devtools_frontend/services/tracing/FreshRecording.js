"use strict";
let instance = null;
export class Tracker {
  #freshRecordings = /* @__PURE__ */ new WeakSet();
  static instance(opts = { forceNew: false }) {
    if (!instance || opts.forceNew) {
      instance = new Tracker();
    }
    return instance;
  }
  registerFreshRecording(data) {
    this.#freshRecordings.add(data);
  }
  recordingIsFresh(data) {
    return this.#freshRecordings.has(data);
  }
  recordingIsFreshOrEnhanced(data) {
    return this.#freshRecordings.has(data) || data.metadata.enhancedTraceVersion !== void 0;
  }
}
//# sourceMappingURL=FreshRecording.js.map
