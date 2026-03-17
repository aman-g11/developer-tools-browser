"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
import { resolveScopeChain } from "./NamesResolver.js";
export class ScopeChainModel extends Common.ObjectWrapper.ObjectWrapper {
  #callFrame;
  /** We use the `Throttler` here to make sure that `#boundUpdate` is not run multiple times simultanously */
  #throttler = new Common.Throttler.Throttler(5);
  #boundUpdate = this.#update.bind(this);
  constructor(callFrame) {
    super();
    this.#callFrame = callFrame;
    this.#callFrame.debuggerModel.addEventListener(
      SDK.DebuggerModel.Events.DebugInfoAttached,
      this.#debugInfoAttached,
      this
    );
    this.#callFrame.debuggerModel.sourceMapManager().addEventListener(
      SDK.SourceMapManager.Events.SourceMapAttached,
      this.#sourceMapAttached,
      this
    );
    void this.#throttler.schedule(this.#boundUpdate);
  }
  dispose() {
    this.#callFrame.debuggerModel.removeEventListener(
      SDK.DebuggerModel.Events.DebugInfoAttached,
      this.#debugInfoAttached,
      this
    );
    this.#callFrame.debuggerModel.sourceMapManager().removeEventListener(
      SDK.SourceMapManager.Events.SourceMapAttached,
      this.#sourceMapAttached,
      this
    );
    this.listeners?.clear();
  }
  async #update() {
    const scopeChain = await resolveScopeChain(this.#callFrame);
    this.dispatchEventToListeners("ScopeChainUpdated" /* SCOPE_CHAIN_UPDATED */, new ScopeChain(scopeChain));
  }
  #debugInfoAttached(event) {
    if (event.data === this.#callFrame.script) {
      void this.#throttler.schedule(this.#boundUpdate);
    }
  }
  #sourceMapAttached(event) {
    if (event.data.client === this.#callFrame.script) {
      void this.#throttler.schedule(this.#boundUpdate);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["SCOPE_CHAIN_UPDATED"] = "ScopeChainUpdated";
  return Events2;
})(Events || {});
export class ScopeChain {
  scopeChain;
  constructor(scopeChain) {
    this.scopeChain = scopeChain;
  }
}
//# sourceMappingURL=ScopeChainModel.js.map
