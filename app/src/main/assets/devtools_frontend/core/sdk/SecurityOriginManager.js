"use strict";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
export class SecurityOriginManager extends SDKModel {
  // if a URL is unreachable, the browser will jump to an error page at
  // 'chrome-error://chromewebdata/', and |this.#mainSecurityOriginInternal| stores
  // its origin. In this situation, the original unreachable URL's security
  // origin will be stored in |this.#unreachableMainSecurityOriginInternal|.
  #mainSecurityOrigin = "";
  #unreachableMainSecurityOrigin = "";
  #securityOrigins = /* @__PURE__ */ new Set();
  updateSecurityOrigins(securityOrigins) {
    const oldOrigins = this.#securityOrigins;
    this.#securityOrigins = securityOrigins;
    for (const origin of oldOrigins) {
      if (!this.#securityOrigins.has(origin)) {
        this.dispatchEventToListeners("SecurityOriginRemoved" /* SecurityOriginRemoved */, origin);
      }
    }
    for (const origin of this.#securityOrigins) {
      if (!oldOrigins.has(origin)) {
        this.dispatchEventToListeners("SecurityOriginAdded" /* SecurityOriginAdded */, origin);
      }
    }
  }
  securityOrigins() {
    return [...this.#securityOrigins];
  }
  mainSecurityOrigin() {
    return this.#mainSecurityOrigin;
  }
  unreachableMainSecurityOrigin() {
    return this.#unreachableMainSecurityOrigin;
  }
  setMainSecurityOrigin(securityOrigin, unreachableSecurityOrigin) {
    this.#mainSecurityOrigin = securityOrigin;
    this.#unreachableMainSecurityOrigin = unreachableSecurityOrigin || null;
    this.dispatchEventToListeners("MainSecurityOriginChanged" /* MainSecurityOriginChanged */, {
      mainSecurityOrigin: this.#mainSecurityOrigin,
      unreachableMainSecurityOrigin: this.#unreachableMainSecurityOrigin
    });
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["SecurityOriginAdded"] = "SecurityOriginAdded";
  Events2["SecurityOriginRemoved"] = "SecurityOriginRemoved";
  Events2["MainSecurityOriginChanged"] = "MainSecurityOriginChanged";
  return Events2;
})(Events || {});
SDKModel.register(SecurityOriginManager, { capabilities: Capability.NONE, autostart: false });
//# sourceMappingURL=SecurityOriginManager.js.map
