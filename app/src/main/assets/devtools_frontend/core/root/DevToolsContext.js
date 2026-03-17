"use strict";
export class WritableDevToolsContext {
  #instances = /* @__PURE__ */ new Map();
  get(ctor) {
    const instance = this.#instances.get(ctor);
    if (!instance) {
      throw new Error(`No instance for ${ctor.name}. Ensure the bootstrapper creates it.`);
    }
    return instance;
  }
  /** @deprecated Should only be used by existing `instance` accessors. */
  has(ctor) {
    return this.#instances.has(ctor);
  }
  /**
   * Should only be used by existing `instance` accessors and the bootstrapper.
   */
  set(ctor, instance) {
    this.#instances.set(ctor, instance);
  }
  /** @deprecated Should only be used by existing `removeInstance` static methods. */
  delete(ctor) {
    this.#instances.delete(ctor);
  }
}
let gInstance = null;
export function globalInstance() {
  if (!gInstance) {
    gInstance = new WritableDevToolsContext();
  }
  return gInstance;
}
export function setGlobalInstance(context) {
  gInstance = context;
}
//# sourceMappingURL=DevToolsContext.js.map
