"use strict";
import * as Root from "../../core/root/root.js";
export class WebCustomData {
  #data = /* @__PURE__ */ new Map();
  /** The test actually needs to wait for the result */
  fetchPromiseForTest;
  constructor(remoteBase) {
    if (!remoteBase) {
      this.fetchPromiseForTest = Promise.resolve();
      return;
    }
    this.fetchPromiseForTest = fetch(`${remoteBase}third_party/vscode.web-custom-data/browsers.css-data.json`).then((response) => response.json()).then((json) => {
      for (const property of json.properties) {
        this.#data.set(property.name, property);
      }
    }).catch();
  }
  /**
   * Creates a fresh `WebCustomData` instance using the standard
   * DevTools remote base.
   * Throws if no valid remoteBase was found.
   */
  static create() {
    const remoteBase = Root.Runtime.getRemoteBase();
    return new WebCustomData(remoteBase?.base ?? "");
  }
  /**
   * Returns the documentation for the CSS property `name` or `undefined` if
   * no such property is documented. Also returns `undefined` if data hasn't
   * finished loading or failed to load.
   */
  findCssProperty(name) {
    return this.#data.get(name);
  }
}
//# sourceMappingURL=WebCustomData.js.map
