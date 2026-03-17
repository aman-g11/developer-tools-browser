"use strict";
import * as Common from "../../../core/common/common.js";
export class SharedObject {
  #mutex = new Common.Mutex.Mutex();
  #counter = 0;
  #value;
  #create;
  #destroy;
  constructor(create, destroy) {
    this.#create = create;
    this.#destroy = destroy;
  }
  /**
   * @returns The shared object and a release function. If the release function
   * throws, you may attempt to call it again (however this probably implies
   * your destroy function is bad).
   */
  async acquire() {
    await this.#mutex.run(async () => {
      if (this.#counter === 0) {
        this.#value = await this.#create();
      }
      ++this.#counter;
    });
    return [this.#value, this.#release.bind(this, { released: false })];
  }
  /**
   * Automatically perform an acquire and release.
   *
   * **If the release fails**, then this will throw and the object will be
   * permanently alive. This is expected to be a fatal error and you should
   * debug your destroy function.
   */
  async run(action) {
    const [value, release] = await this.acquire();
    try {
      const result = await action(value);
      return result;
    } finally {
      await release();
    }
  }
  async #release(state) {
    if (state.released) {
      throw new Error("Attempted to release object multiple times.");
    }
    try {
      state.released = true;
      await this.#mutex.run(async () => {
        if (this.#counter === 1) {
          await this.#destroy(this.#value);
          this.#value = void 0;
        }
        --this.#counter;
      });
    } catch (error) {
      state.released = false;
      throw error;
    }
  }
}
//# sourceMappingURL=SharedObject.js.map
