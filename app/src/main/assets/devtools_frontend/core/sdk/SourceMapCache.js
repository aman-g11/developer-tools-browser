"use strict";
export class SourceMapCache {
  static #INSTANCE = new SourceMapCache("devtools-source-map-cache");
  static instance() {
    if (typeof window === "undefined") {
      return IN_MEMORY_INSTANCE;
    }
    return this.#INSTANCE;
  }
  static createForTest(name) {
    return new SourceMapCache(name);
  }
  #name;
  #cachePromise;
  constructor(name) {
    this.#name = name;
  }
  async set(debugId, sourceMap) {
    const cache = await this.#cache();
    await cache.put(SourceMapCache.#urlForDebugId(debugId), new Response(JSON.stringify(sourceMap)));
  }
  async get(debugId) {
    const cache = await this.#cache();
    const response = await cache.match(SourceMapCache.#urlForDebugId(debugId));
    return await response?.json() ?? null;
  }
  async #cache() {
    if (this.#cachePromise) {
      return await this.#cachePromise;
    }
    this.#cachePromise = window.caches.open(this.#name);
    return await this.#cachePromise;
  }
  /** The Cache API only allows URL as keys, so we construct a simple one. Given that we have our own cache, we have no risk of conflicting URLs */
  static #urlForDebugId(debugId) {
    return "http://debug.id/" + encodeURIComponent(debugId);
  }
  async disposeForTest() {
    await window.caches.delete(this.#name);
  }
}
const IN_MEMORY_INSTANCE = new class {
  #cache = /* @__PURE__ */ new Map();
  async set(debugId, sourceMap) {
    this.#cache.set(debugId, sourceMap);
  }
  async get(debugId) {
    return this.#cache.get(debugId) ?? null;
  }
  async disposeForTest() {
  }
}();
//# sourceMappingURL=SourceMapCache.js.map
