"use strict";
import * as Common from "../../core/common/common.js";
let instance = null;
export class RecorderPluginManager extends Common.ObjectWrapper.ObjectWrapper {
  #plugins = /* @__PURE__ */ new Set();
  #views = /* @__PURE__ */ new Map();
  static instance() {
    if (!instance) {
      instance = new RecorderPluginManager();
    }
    return instance;
  }
  addPlugin(plugin) {
    this.#plugins.add(plugin);
    this.dispatchEventToListeners("pluginAdded" /* PLUGIN_ADDED */, plugin);
  }
  removePlugin(plugin) {
    this.#plugins.delete(plugin);
    this.dispatchEventToListeners("pluginRemoved" /* PLUGIN_REMOVED */, plugin);
  }
  plugins() {
    return Array.from(this.#plugins.values());
  }
  registerView(descriptor) {
    this.#views.set(descriptor.id, descriptor);
    this.dispatchEventToListeners("viewRegistered" /* VIEW_REGISTERED */, descriptor);
  }
  views() {
    return Array.from(this.#views.values());
  }
  getViewDescriptor(id) {
    return this.#views.get(id);
  }
  showView(id) {
    const descriptor = this.#views.get(id);
    if (!descriptor) {
      throw new Error(`View with id ${id} is not found.`);
    }
    this.dispatchEventToListeners("showViewRequested" /* SHOW_VIEW_REQUESTED */, descriptor);
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["PLUGIN_ADDED"] = "pluginAdded";
  Events2["PLUGIN_REMOVED"] = "pluginRemoved";
  Events2["VIEW_REGISTERED"] = "viewRegistered";
  Events2["SHOW_VIEW_REQUESTED"] = "showViewRequested";
  return Events2;
})(Events || {});
//# sourceMappingURL=RecorderPluginManager.js.map
