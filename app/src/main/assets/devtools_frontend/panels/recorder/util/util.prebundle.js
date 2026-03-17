"use strict";
import * as SharedObject from "./SharedObject.js";
const isDebugBuild = false;
const DEVTOOLS_RECORDER_WORLD_NAME = "devtools_recorder";
class InjectedScript {
  static #injectedScript;
  static async get() {
    if (!this.#injectedScript) {
      this.#injectedScript = (await fetch(
        new URL("../injected/injected.generated.js", import.meta.url)
      )).text();
    }
    return await this.#injectedScript;
  }
}
export { DEVTOOLS_RECORDER_WORLD_NAME, InjectedScript, isDebugBuild, SharedObject };
//# sourceMappingURL=util.prebundle.js.map
