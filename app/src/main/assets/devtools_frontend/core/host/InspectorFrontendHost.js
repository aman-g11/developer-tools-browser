"use strict";
import * as Common from "../common/common.js";
import * as Root from "../root/root.js";
import {
  EventDescriptors
} from "./InspectorFrontendHostAPI.js";
import { InspectorFrontendHostStub } from "./InspectorFrontendHostStub.js";
import { streamWrite as resourceLoaderStreamWrite } from "./ResourceLoader.js";
export let InspectorFrontendHostInstance;
class InspectorFrontendAPIImpl {
  constructor() {
    for (const descriptor of EventDescriptors) {
      this[descriptor[0]] = this.dispatch.bind(this, descriptor[0], descriptor[1], descriptor[2]);
    }
  }
  dispatch(name, signature, _runOnceLoaded, ...params) {
    if (signature.length < 2) {
      try {
        InspectorFrontendHostInstance.events.dispatchEventToListeners(name, params[0]);
      } catch (error) {
        console.error(error + " " + error.stack);
      }
      return;
    }
    const data = {};
    for (let i = 0; i < signature.length; ++i) {
      data[signature[i]] = params[i];
    }
    try {
      InspectorFrontendHostInstance.events.dispatchEventToListeners(name, data);
    } catch (error) {
      console.error(error + " " + error.stack);
    }
  }
  streamWrite(id, chunk) {
    resourceLoaderStreamWrite(id, chunk);
  }
}
export function installInspectorFrontendHost(instance) {
  globalThis.InspectorFrontendHost = InspectorFrontendHostInstance = instance;
  if (!(instance instanceof InspectorFrontendHostStub)) {
    const proto = InspectorFrontendHostStub.prototype;
    for (const name of Object.getOwnPropertyNames(proto)) {
      const stub = proto[name];
      if (typeof stub !== "function" || InspectorFrontendHostInstance[name]) {
        continue;
      }
      console.error(`Incompatible embedder: method Host.InspectorFrontendHost.${name} is missing. Using stub instead.`);
      InspectorFrontendHostInstance[name] = stub;
    }
  }
  InspectorFrontendHostInstance.events = new Common.ObjectWrapper.ObjectWrapper();
}
(function() {
  installInspectorFrontendHost(globalThis.InspectorFrontendHost ?? new InspectorFrontendHostStub());
  globalThis.InspectorFrontendAPI = new InspectorFrontendAPIImpl();
})();
export function isUnderTest(prefs) {
  if (Root.Runtime.Runtime.queryParam("test")) {
    return true;
  }
  if (prefs) {
    return prefs["isUnderTest"] === "true";
  }
  return Common.Settings.Settings.hasInstance() && Common.Settings.Settings.instance().createSetting("isUnderTest", false).get();
}
export { InspectorFrontendHostStub };
//# sourceMappingURL=InspectorFrontendHost.js.map
