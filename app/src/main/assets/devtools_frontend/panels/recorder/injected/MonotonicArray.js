"use strict";
export class MonotonicArray {
  #values = /* @__PURE__ */ new WeakMap();
  #nextId = 1;
  getOrInsert = (node) => {
    const value = this.#values.get(node);
    if (value !== void 0) {
      return value;
    }
    this.#values.set(node, this.#nextId);
    this.#nextId++;
    return this.#nextId - 1;
  };
}
//# sourceMappingURL=MonotonicArray.js.map
