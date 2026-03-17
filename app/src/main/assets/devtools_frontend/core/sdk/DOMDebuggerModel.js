"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as Common from "../common/common.js";
import * as Platform from "../platform/platform.js";
import { CategorizedBreakpoint, Category } from "./CategorizedBreakpoint.js";
import { DOMModel, Events as DOMModelEvents } from "./DOMModel.js";
import { RemoteObject } from "./RemoteObject.js";
import { RuntimeModel } from "./RuntimeModel.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
import { TargetManager } from "./TargetManager.js";
export class DOMDebuggerModel extends SDKModel {
  agent;
  #runtimeModel;
  #domModel;
  #domBreakpoints;
  #domBreakpointsSetting;
  suspended = false;
  constructor(target) {
    super(target);
    this.agent = target.domdebuggerAgent();
    this.#runtimeModel = target.model(RuntimeModel);
    this.#domModel = target.model(DOMModel);
    this.#domModel.addEventListener(DOMModelEvents.DocumentUpdated, this.documentUpdated, this);
    this.#domModel.addEventListener(DOMModelEvents.NodeRemoved, this.nodeRemoved, this);
    this.#domBreakpoints = [];
    this.#domBreakpointsSetting = Common.Settings.Settings.instance().createLocalSetting("dom-breakpoints", []);
    if (this.#domModel.existingDocument()) {
      void this.documentUpdated();
    }
  }
  runtimeModel() {
    return this.#runtimeModel;
  }
  async suspendModel() {
    this.suspended = true;
  }
  async resumeModel() {
    this.suspended = false;
  }
  async eventListeners(remoteObject) {
    console.assert(remoteObject.runtimeModel() === this.#runtimeModel);
    if (!remoteObject.objectId) {
      return [];
    }
    const listeners = await this.agent.invoke_getEventListeners({ objectId: remoteObject.objectId });
    const eventListeners = [];
    for (const payload of listeners.listeners || []) {
      const location = this.#runtimeModel.debuggerModel().createRawLocationByScriptId(
        payload.scriptId,
        payload.lineNumber,
        payload.columnNumber
      );
      if (!location) {
        continue;
      }
      eventListeners.push(new EventListener(
        this,
        remoteObject,
        payload.type,
        payload.useCapture,
        payload.passive,
        payload.once,
        payload.handler ? this.#runtimeModel.createRemoteObject(payload.handler) : null,
        payload.originalHandler ? this.#runtimeModel.createRemoteObject(payload.originalHandler) : null,
        location,
        null
      ));
    }
    return eventListeners;
  }
  retrieveDOMBreakpoints() {
    void this.#domModel.requestDocument();
  }
  domBreakpoints() {
    return this.#domBreakpoints.slice();
  }
  hasDOMBreakpoint(node, type) {
    return this.#domBreakpoints.some((breakpoint) => breakpoint.node === node && breakpoint.type === type);
  }
  setDOMBreakpoint(node, type) {
    for (const breakpoint2 of this.#domBreakpoints) {
      if (breakpoint2.node === node && breakpoint2.type === type) {
        this.toggleDOMBreakpoint(breakpoint2, true);
        return breakpoint2;
      }
    }
    const breakpoint = new DOMBreakpoint(this, node, type, true);
    this.#domBreakpoints.push(breakpoint);
    this.enableDOMBreakpoint(breakpoint);
    this.saveDOMBreakpoints();
    this.dispatchEventToListeners("DOMBreakpointAdded" /* DOM_BREAKPOINT_ADDED */, breakpoint);
    return breakpoint;
  }
  removeDOMBreakpoint(node, type) {
    this.removeDOMBreakpoints((breakpoint) => breakpoint.node === node && breakpoint.type === type);
  }
  removeAllDOMBreakpoints() {
    this.removeDOMBreakpoints((_breakpoint) => true);
  }
  toggleDOMBreakpoint(breakpoint, enabled) {
    if (enabled === breakpoint.enabled) {
      return;
    }
    breakpoint.enabled = enabled;
    if (enabled) {
      this.enableDOMBreakpoint(breakpoint);
    } else {
      this.disableDOMBreakpoint(breakpoint);
    }
    this.saveDOMBreakpoints();
    this.dispatchEventToListeners("DOMBreakpointToggled" /* DOM_BREAKPOINT_TOGGLED */, breakpoint);
  }
  enableDOMBreakpoint(breakpoint) {
    if (breakpoint.node.id) {
      void this.agent.invoke_setDOMBreakpoint({ nodeId: breakpoint.node.id, type: breakpoint.type });
      breakpoint.node.setMarker(Marker, true);
    }
  }
  disableDOMBreakpoint(breakpoint) {
    if (breakpoint.node.id) {
      void this.agent.invoke_removeDOMBreakpoint({ nodeId: breakpoint.node.id, type: breakpoint.type });
      breakpoint.node.setMarker(Marker, this.nodeHasBreakpoints(breakpoint.node) ? true : null);
    }
  }
  nodeHasBreakpoints(node) {
    for (const breakpoint of this.#domBreakpoints) {
      if (breakpoint.node === node && breakpoint.enabled) {
        return true;
      }
    }
    return false;
  }
  resolveDOMBreakpointData(auxData) {
    const type = auxData["type"];
    const node = this.#domModel.nodeForId(auxData["nodeId"]);
    if (!type || !node) {
      return null;
    }
    let targetNode = null;
    let insertion = false;
    if (type === Protocol.DOMDebugger.DOMBreakpointType.SubtreeModified) {
      insertion = auxData["insertion"] || false;
      targetNode = this.#domModel.nodeForId(auxData["targetNodeId"]);
    }
    return { type, node, targetNode, insertion };
  }
  currentURL() {
    const domDocument = this.#domModel.existingDocument();
    return domDocument ? domDocument.documentURL : Platform.DevToolsPath.EmptyUrlString;
  }
  async documentUpdated() {
    if (this.suspended) {
      return;
    }
    const removed = this.#domBreakpoints;
    this.#domBreakpoints = [];
    this.dispatchEventToListeners("DOMBreakpointsRemoved" /* DOM_BREAKPOINTS_REMOVED */, removed);
    const document = await this.#domModel.requestDocument();
    const currentURL = document ? document.documentURL : Platform.DevToolsPath.EmptyUrlString;
    for (const breakpoint of this.#domBreakpointsSetting.get()) {
      if (breakpoint.url === currentURL) {
        void this.#domModel.pushNodeByPathToFrontend(breakpoint.path).then(appendBreakpoint.bind(this, breakpoint));
      }
    }
    function appendBreakpoint(breakpoint, nodeId) {
      const node = nodeId ? this.#domModel.nodeForId(nodeId) : null;
      if (!node) {
        return;
      }
      for (const existingBreakpoint of this.#domBreakpoints) {
        if (existingBreakpoint.node === node && existingBreakpoint.type === breakpoint.type) {
          return;
        }
      }
      const domBreakpoint = new DOMBreakpoint(this, node, breakpoint.type, breakpoint.enabled);
      this.#domBreakpoints.push(domBreakpoint);
      if (breakpoint.enabled) {
        this.enableDOMBreakpoint(domBreakpoint);
      }
      this.dispatchEventToListeners("DOMBreakpointAdded" /* DOM_BREAKPOINT_ADDED */, domBreakpoint);
    }
  }
  removeDOMBreakpoints(filter) {
    const removed = [];
    const left = [];
    for (const breakpoint of this.#domBreakpoints) {
      if (filter(breakpoint)) {
        removed.push(breakpoint);
        if (breakpoint.enabled) {
          breakpoint.enabled = false;
          this.disableDOMBreakpoint(breakpoint);
        }
      } else {
        left.push(breakpoint);
      }
    }
    if (!removed.length) {
      return;
    }
    this.#domBreakpoints = left;
    this.saveDOMBreakpoints();
    this.dispatchEventToListeners("DOMBreakpointsRemoved" /* DOM_BREAKPOINTS_REMOVED */, removed);
  }
  nodeRemoved(event) {
    if (this.suspended) {
      return;
    }
    const { node } = event.data;
    const children = node.children() || [];
    this.removeDOMBreakpoints((breakpoint) => breakpoint.node === node || children.indexOf(breakpoint.node) !== -1);
  }
  saveDOMBreakpoints() {
    const currentURL = this.currentURL();
    const breakpoints = this.#domBreakpointsSetting.get().filter((breakpoint) => breakpoint.url !== currentURL);
    for (const breakpoint of this.#domBreakpoints) {
      breakpoints.push(
        { url: currentURL, path: breakpoint.node.path(), type: breakpoint.type, enabled: breakpoint.enabled }
      );
    }
    this.#domBreakpointsSetting.set(breakpoints);
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["DOM_BREAKPOINT_ADDED"] = "DOMBreakpointAdded";
  Events2["DOM_BREAKPOINT_TOGGLED"] = "DOMBreakpointToggled";
  Events2["DOM_BREAKPOINTS_REMOVED"] = "DOMBreakpointsRemoved";
  return Events2;
})(Events || {});
const Marker = "breakpoint-marker";
export class DOMBreakpoint {
  domDebuggerModel;
  node;
  type;
  enabled;
  constructor(domDebuggerModel, node, type, enabled) {
    this.domDebuggerModel = domDebuggerModel;
    this.node = node;
    this.type = type;
    this.enabled = enabled;
  }
}
export class EventListener {
  #domDebuggerModel;
  #eventTarget;
  #type;
  #useCapture;
  #passive;
  #once;
  #handler;
  #originalHandler;
  #location;
  #sourceURL;
  #customRemoveFunction;
  #origin;
  constructor(domDebuggerModel, eventTarget, type, useCapture, passive, once, handler, originalHandler, location, customRemoveFunction, origin) {
    this.#domDebuggerModel = domDebuggerModel;
    this.#eventTarget = eventTarget;
    this.#type = type;
    this.#useCapture = useCapture;
    this.#passive = passive;
    this.#once = once;
    this.#handler = handler;
    this.#originalHandler = originalHandler || handler;
    this.#location = location;
    const script = location.script();
    this.#sourceURL = script ? script.contentURL() : Platform.DevToolsPath.EmptyUrlString;
    this.#customRemoveFunction = customRemoveFunction;
    this.#origin = origin || EventListener.Origin.RAW;
  }
  domDebuggerModel() {
    return this.#domDebuggerModel;
  }
  type() {
    return this.#type;
  }
  useCapture() {
    return this.#useCapture;
  }
  passive() {
    return this.#passive;
  }
  once() {
    return this.#once;
  }
  handler() {
    return this.#handler;
  }
  location() {
    return this.#location;
  }
  sourceURL() {
    return this.#sourceURL;
  }
  originalHandler() {
    return this.#originalHandler;
  }
  canRemove() {
    return Boolean(this.#customRemoveFunction) || this.#origin !== EventListener.Origin.FRAMEWORK_USER;
  }
  remove() {
    if (!this.canRemove()) {
      return Promise.resolve(void 0);
    }
    if (this.#origin !== EventListener.Origin.FRAMEWORK_USER) {
      let removeListener2 = function(type, listener, useCapture) {
        this.removeEventListener(type, listener, useCapture);
        if (this["on" + type]) {
          this["on" + type] = void 0;
        }
      };
      var removeListener = removeListener2;
      return this.#eventTarget.callFunction(
        removeListener2,
        [
          RemoteObject.toCallArgument(this.#type),
          RemoteObject.toCallArgument(this.#originalHandler),
          RemoteObject.toCallArgument(this.#useCapture)
        ]
      ).then(() => void 0);
    }
    if (this.#customRemoveFunction) {
      let callCustomRemove2 = function(type, listener, useCapture, passive) {
        this.call(null, type, listener, useCapture, passive);
      };
      var callCustomRemove = callCustomRemove2;
      return this.#customRemoveFunction.callFunction(
        callCustomRemove2,
        [
          RemoteObject.toCallArgument(this.#type),
          RemoteObject.toCallArgument(this.#originalHandler),
          RemoteObject.toCallArgument(this.#useCapture),
          RemoteObject.toCallArgument(this.#passive)
        ]
      ).then(() => void 0);
    }
    return Promise.resolve(void 0);
  }
  canTogglePassive() {
    return this.#origin !== EventListener.Origin.FRAMEWORK_USER;
  }
  togglePassive() {
    return this.#eventTarget.callFunction(
      callTogglePassive,
      [
        RemoteObject.toCallArgument(this.#type),
        RemoteObject.toCallArgument(this.#originalHandler),
        RemoteObject.toCallArgument(this.#useCapture),
        RemoteObject.toCallArgument(this.#passive)
      ]
    ).then(() => void 0);
    function callTogglePassive(type, listener, useCapture, passive) {
      this.removeEventListener(type, listener, { capture: useCapture });
      this.addEventListener(type, listener, { capture: useCapture, passive: !passive });
    }
  }
  origin() {
    return this.#origin;
  }
  markAsFramework() {
    this.#origin = EventListener.Origin.FRAMEWORK;
  }
  isScrollBlockingType() {
    return this.#type === "touchstart" || this.#type === "touchmove" || this.#type === "mousewheel" || this.#type === "wheel";
  }
}
((EventListener2) => {
  let Origin;
  ((Origin2) => {
    Origin2["RAW"] = "Raw";
    Origin2["FRAMEWORK"] = "Framework";
    Origin2["FRAMEWORK_USER"] = "FrameworkUser";
  })(Origin = EventListener2.Origin || (EventListener2.Origin = {}));
})(EventListener || (EventListener = {}));
export class CSPViolationBreakpoint extends CategorizedBreakpoint {
  #type;
  constructor(category, type) {
    super(category, type);
    this.#type = type;
  }
  type() {
    return this.#type;
  }
}
export class DOMEventListenerBreakpoint extends CategorizedBreakpoint {
  eventTargetNames;
  constructor(eventName, eventTargetNames, category) {
    super(category, eventName);
    this.eventTargetNames = eventTargetNames;
  }
  setEnabled(enabled) {
    if (this.enabled() === enabled) {
      return;
    }
    super.setEnabled(enabled);
    for (const model of TargetManager.instance().models(DOMDebuggerModel)) {
      this.updateOnModel(model);
    }
  }
  updateOnModel(model) {
    for (const eventTargetName of this.eventTargetNames) {
      if (this.enabled()) {
        void model.agent.invoke_setEventListenerBreakpoint({ eventName: this.name, targetName: eventTargetName });
      } else {
        void model.agent.invoke_removeEventListenerBreakpoint({ eventName: this.name, targetName: eventTargetName });
      }
    }
  }
  static listener = "listener:";
}
let domDebuggerManagerInstance;
export class DOMDebuggerManager {
  #xhrBreakpointsSetting;
  #xhrBreakpoints = /* @__PURE__ */ new Map();
  #cspViolationsToBreakOn = [];
  #eventListenerBreakpoints = [];
  constructor() {
    this.#xhrBreakpointsSetting = Common.Settings.Settings.instance().createLocalSetting("xhr-breakpoints", []);
    for (const breakpoint of this.#xhrBreakpointsSetting.get()) {
      this.#xhrBreakpoints.set(breakpoint.url, breakpoint.enabled);
    }
    this.#cspViolationsToBreakOn.push(new CSPViolationBreakpoint(
      Category.TRUSTED_TYPE_VIOLATION,
      Protocol.DOMDebugger.CSPViolationType.TrustedtypeSinkViolation
    ));
    this.#cspViolationsToBreakOn.push(new CSPViolationBreakpoint(
      Category.TRUSTED_TYPE_VIOLATION,
      Protocol.DOMDebugger.CSPViolationType.TrustedtypePolicyViolation
    ));
    this.createEventListenerBreakpoints(
      Category.MEDIA,
      [
        "play",
        "pause",
        "playing",
        "canplay",
        "canplaythrough",
        "seeking",
        "seeked",
        "timeupdate",
        "ended",
        "ratechange",
        "durationchange",
        "volumechange",
        "loadstart",
        "progress",
        "suspend",
        "abort",
        "error",
        "emptied",
        "stalled",
        "loadedmetadata",
        "loadeddata",
        "waiting"
      ],
      ["audio", "video"]
    );
    this.createEventListenerBreakpoints(
      Category.PICTURE_IN_PICTURE,
      ["enterpictureinpicture", "leavepictureinpicture"],
      ["video"]
    );
    this.createEventListenerBreakpoints(Category.PICTURE_IN_PICTURE, ["resize"], ["PictureInPictureWindow"]);
    this.createEventListenerBreakpoints(Category.PICTURE_IN_PICTURE, ["enter"], ["documentPictureInPicture"]);
    this.createEventListenerBreakpoints(
      Category.CLIPBOARD,
      ["copy", "cut", "paste", "beforecopy", "beforecut", "beforepaste"],
      ["*"]
    );
    this.createEventListenerBreakpoints(
      Category.CONTROL,
      [
        "resize",
        "scroll",
        "scrollend",
        "scrollsnapchange",
        "scrollsnapchanging",
        "zoom",
        "focus",
        "blur",
        "select",
        "change",
        "submit",
        "reset"
      ],
      ["*"]
    );
    this.createEventListenerBreakpoints(Category.DEVICE, ["deviceorientation", "devicemotion"], ["*"]);
    this.createEventListenerBreakpoints(
      Category.DOM_MUTATION,
      [
        "DOMActivate",
        "DOMFocusIn",
        "DOMFocusOut",
        "DOMAttrModified",
        "DOMCharacterDataModified",
        "DOMNodeInserted",
        "DOMNodeInsertedIntoDocument",
        "DOMNodeRemoved",
        "DOMNodeRemovedFromDocument",
        "DOMSubtreeModified",
        "DOMContentLoaded"
      ],
      ["*"]
    );
    this.createEventListenerBreakpoints(
      Category.DRAG_DROP,
      ["drag", "dragstart", "dragend", "dragenter", "dragover", "dragleave", "drop"],
      ["*"]
    );
    this.createEventListenerBreakpoints(Category.KEYBOARD, ["keydown", "keyup", "keypress", "input"], ["*"]);
    this.createEventListenerBreakpoints(
      Category.LOAD,
      [
        "load",
        "beforeunload",
        "unload",
        "abort",
        "error",
        "hashchange",
        "popstate",
        "navigate",
        "navigatesuccess",
        "navigateerror",
        "currentchange",
        "navigateto",
        "navigatefrom",
        "finish",
        "dispose"
      ],
      ["*"]
    );
    this.createEventListenerBreakpoints(
      Category.MOUSE,
      [
        "auxclick",
        "click",
        "dblclick",
        "mousedown",
        "mouseup",
        "mouseover",
        "mousemove",
        "mouseout",
        "mouseenter",
        "mouseleave",
        "mousewheel",
        "wheel",
        "contextmenu"
      ],
      ["*"]
    );
    this.createEventListenerBreakpoints(
      Category.POINTER,
      [
        "pointerover",
        "pointerout",
        "pointerenter",
        "pointerleave",
        "pointerdown",
        "pointerup",
        "pointermove",
        "pointercancel",
        "gotpointercapture",
        "lostpointercapture",
        "pointerrawupdate"
      ],
      ["*"]
    );
    this.createEventListenerBreakpoints(Category.TOUCH, ["touchstart", "touchmove", "touchend", "touchcancel"], ["*"]);
    this.createEventListenerBreakpoints(Category.WORKER, ["message", "messageerror"], ["*"]);
    this.createEventListenerBreakpoints(
      Category.XHR,
      ["readystatechange", "load", "loadstart", "loadend", "abort", "error", "progress", "timeout"],
      ["xmlhttprequest", "xmlhttprequestupload"]
    );
    TargetManager.instance().observeModels(DOMDebuggerModel, this);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!domDebuggerManagerInstance || forceNew) {
      domDebuggerManagerInstance = new DOMDebuggerManager();
    }
    return domDebuggerManagerInstance;
  }
  cspViolationBreakpoints() {
    return this.#cspViolationsToBreakOn.slice();
  }
  createEventListenerBreakpoints(category, eventNames, eventTargetNames) {
    for (const eventName of eventNames) {
      this.#eventListenerBreakpoints.push(new DOMEventListenerBreakpoint(eventName, eventTargetNames, category));
    }
  }
  resolveEventListenerBreakpoint({ eventName, targetName }) {
    const listenerPrefix = "listener:";
    if (eventName.startsWith(listenerPrefix)) {
      eventName = eventName.substring(listenerPrefix.length);
    } else {
      return null;
    }
    targetName = (targetName || "*").toLowerCase();
    let result = null;
    for (const breakpoint of this.#eventListenerBreakpoints) {
      if (eventName && breakpoint.name === eventName && breakpoint.eventTargetNames.indexOf(targetName) !== -1) {
        result = breakpoint;
      }
      if (!result && eventName && breakpoint.name === eventName && breakpoint.eventTargetNames.indexOf("*") !== -1) {
        result = breakpoint;
      }
    }
    return result;
  }
  eventListenerBreakpoints() {
    return this.#eventListenerBreakpoints.slice();
  }
  updateCSPViolationBreakpoints() {
    const violationTypes = this.#cspViolationsToBreakOn.filter((v) => v.enabled()).map((v) => v.type());
    for (const model of TargetManager.instance().models(DOMDebuggerModel)) {
      this.updateCSPViolationBreakpointsForModel(model, violationTypes);
    }
  }
  updateCSPViolationBreakpointsForModel(model, violationTypes) {
    void model.agent.invoke_setBreakOnCSPViolation({ violationTypes });
  }
  xhrBreakpoints() {
    return this.#xhrBreakpoints;
  }
  saveXHRBreakpoints() {
    const breakpoints = [];
    for (const url of this.#xhrBreakpoints.keys()) {
      breakpoints.push({ url, enabled: this.#xhrBreakpoints.get(url) || false });
    }
    this.#xhrBreakpointsSetting.set(breakpoints);
  }
  addXHRBreakpoint(url, enabled) {
    this.#xhrBreakpoints.set(url, enabled);
    if (enabled) {
      for (const model of TargetManager.instance().models(DOMDebuggerModel)) {
        void model.agent.invoke_setXHRBreakpoint({ url });
      }
    }
    this.saveXHRBreakpoints();
  }
  removeXHRBreakpoint(url) {
    const enabled = this.#xhrBreakpoints.get(url);
    this.#xhrBreakpoints.delete(url);
    if (enabled) {
      for (const model of TargetManager.instance().models(DOMDebuggerModel)) {
        void model.agent.invoke_removeXHRBreakpoint({ url });
      }
    }
    this.saveXHRBreakpoints();
  }
  toggleXHRBreakpoint(url, enabled) {
    this.#xhrBreakpoints.set(url, enabled);
    for (const model of TargetManager.instance().models(DOMDebuggerModel)) {
      if (enabled) {
        void model.agent.invoke_setXHRBreakpoint({ url });
      } else {
        void model.agent.invoke_removeXHRBreakpoint({ url });
      }
    }
    this.saveXHRBreakpoints();
  }
  modelAdded(domDebuggerModel) {
    for (const url of this.#xhrBreakpoints.keys()) {
      if (this.#xhrBreakpoints.get(url)) {
        void domDebuggerModel.agent.invoke_setXHRBreakpoint({ url });
      }
    }
    for (const breakpoint of this.#eventListenerBreakpoints) {
      if (breakpoint.enabled()) {
        breakpoint.updateOnModel(domDebuggerModel);
      }
    }
    const violationTypes = this.#cspViolationsToBreakOn.filter((v) => v.enabled()).map((v) => v.type());
    this.updateCSPViolationBreakpointsForModel(domDebuggerModel, violationTypes);
  }
  modelRemoved(_domDebuggerModel) {
  }
}
SDKModel.register(DOMDebuggerModel, { capabilities: Capability.DOM, autostart: false });
//# sourceMappingURL=DOMDebuggerModel.js.map
