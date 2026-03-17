"use strict";
import * as Common from "../common/common.js";
import * as Platform from "../platform/platform.js";
import * as ProtocolClient from "../protocol_client/protocol_client.js";
import { SDKModel } from "./SDKModel.js";
export class Target extends ProtocolClient.InspectorBackend.TargetBase {
  #targetManager;
  #name;
  #inspectedURL = Platform.DevToolsPath.EmptyUrlString;
  #inspectedURLName = "";
  #capabilitiesMask;
  #type;
  #parentTarget;
  #id;
  #modelByConstructor = /* @__PURE__ */ new Map();
  #isSuspended;
  /**
   * Generally when a target crashes we don't need to know, with one exception.
   * If a target crashes during the recording of a performance trace, after the
   * trace when we try to resume() it, it will fail because it has crashed. This
   * causes the performance panel to freeze (see crbug.com/333989070). So we
   * mark the target as crashed so we can exit without trying to resume it. In
   * `ChildTargetManager` we will mark a target as "un-crashed" when we get the
   * `targetInfoChanged` event. This helps ensure we can deal with cases where
   * the page crashes, but a reload fixes it and the targets get restored (see
   * crbug.com/387258086).
   */
  #hasCrashed = false;
  #targetInfo;
  #creatingModels;
  constructor(targetManager, id, name, type, parentTarget, sessionId, suspended, connection, targetInfo) {
    super(parentTarget, sessionId, connection);
    this.#targetManager = targetManager;
    this.#name = name;
    this.#capabilitiesMask = 0;
    switch (type) {
      case "frame" /* FRAME */:
        this.#capabilitiesMask = 1 /* BROWSER */ | 8192 /* STORAGE */ | 2 /* DOM */ | 4 /* JS */ | 8 /* LOG */ | 16 /* NETWORK */ | 32 /* TARGET */ | 128 /* TRACING */ | 256 /* EMULATION */ | 1024 /* INPUT */ | 2048 /* INSPECTOR */ | 32768 /* AUDITS */ | 65536 /* WEB_AUTHN */ | 131072 /* IO */ | 262144 /* MEDIA */ | 524288 /* EVENT_BREAKPOINTS */ | 1048576 /* DOM_STORAGE */;
        if (parentTarget?.type() !== "frame" /* FRAME */) {
          this.#capabilitiesMask |= 4096 /* DEVICE_EMULATION */ | 64 /* SCREEN_CAPTURE */ | 512 /* SECURITY */ | 16384 /* SERVICE_WORKER */;
          if (Common.ParsedURL.schemeIs(targetInfo?.url, "chrome-extension:")) {
            this.#capabilitiesMask &= ~512 /* SECURITY */;
          }
        }
        break;
      case "service-worker" /* ServiceWorker */:
        this.#capabilitiesMask = 4 /* JS */ | 8 /* LOG */ | 16 /* NETWORK */ | 32 /* TARGET */ | 2048 /* INSPECTOR */ | 131072 /* IO */ | 524288 /* EVENT_BREAKPOINTS */;
        if (parentTarget?.type() !== "frame" /* FRAME */) {
          this.#capabilitiesMask |= 1 /* BROWSER */;
        }
        break;
      case "shared-worker" /* SHARED_WORKER */:
        this.#capabilitiesMask = 4 /* JS */ | 8 /* LOG */ | 16 /* NETWORK */ | 32 /* TARGET */ | 131072 /* IO */ | 262144 /* MEDIA */ | 2048 /* INSPECTOR */ | 524288 /* EVENT_BREAKPOINTS */;
        if (parentTarget?.type() !== "frame" /* FRAME */) {
          this.#capabilitiesMask |= 8192 /* STORAGE */;
        }
        break;
      case "shared-storage-worklet" /* SHARED_STORAGE_WORKLET */:
        this.#capabilitiesMask = 4 /* JS */ | 8 /* LOG */ | 2048 /* INSPECTOR */ | 524288 /* EVENT_BREAKPOINTS */;
        break;
      case "worker" /* Worker */:
        this.#capabilitiesMask = 4 /* JS */ | 8 /* LOG */ | 16 /* NETWORK */ | 32 /* TARGET */ | 131072 /* IO */ | 262144 /* MEDIA */ | 256 /* EMULATION */ | 524288 /* EVENT_BREAKPOINTS */;
        if (parentTarget?.type() !== "frame" /* FRAME */) {
          this.#capabilitiesMask |= 8192 /* STORAGE */;
        }
        break;
      case "worklet" /* WORKLET */:
        this.#capabilitiesMask = 4 /* JS */ | 8 /* LOG */ | 524288 /* EVENT_BREAKPOINTS */ | 16 /* NETWORK */;
        break;
      case "node" /* NODE */:
        this.#capabilitiesMask = 4 /* JS */ | 16 /* NETWORK */ | 32 /* TARGET */ | 131072 /* IO */ | 1048576 /* DOM_STORAGE */;
        break;
      case "auction-worklet" /* AUCTION_WORKLET */:
        this.#capabilitiesMask = 4 /* JS */ | 524288 /* EVENT_BREAKPOINTS */;
        break;
      case "browser" /* BROWSER */:
        this.#capabilitiesMask = 32 /* TARGET */ | 131072 /* IO */;
        break;
      case "tab" /* TAB */:
        this.#capabilitiesMask = 32 /* TARGET */ | 128 /* TRACING */;
        break;
      case "node-worker" /* NODE_WORKER */:
        this.#capabilitiesMask = 4 /* JS */ | 16 /* NETWORK */ | 32 /* TARGET */ | 131072 /* IO */;
    }
    this.#type = type;
    this.#parentTarget = parentTarget;
    this.#id = id;
    this.#isSuspended = suspended;
    this.#targetInfo = targetInfo;
  }
  /** Creates the models in the order in which they are provided */
  createModels(models) {
    this.#creatingModels = true;
    for (const model of models) {
      this.model(model);
    }
    this.#creatingModels = false;
  }
  id() {
    return this.#id;
  }
  name() {
    return this.#name || this.#inspectedURLName;
  }
  setName(name) {
    if (this.#name === name) {
      return;
    }
    this.#name = name;
    this.#targetManager.onNameChange(this);
  }
  type() {
    return this.#type;
  }
  markAsNodeJSForTest() {
    this.#type = "node" /* NODE */;
  }
  targetManager() {
    return this.#targetManager;
  }
  hasAllCapabilities(capabilitiesMask) {
    return (this.#capabilitiesMask & capabilitiesMask) === capabilitiesMask;
  }
  decorateLabel(label) {
    return this.#type === "worker" /* Worker */ || this.#type === "service-worker" /* ServiceWorker */ ? "\u2699 " + label : label;
  }
  parentTarget() {
    return this.#parentTarget;
  }
  outermostTarget() {
    let lastTarget = null;
    let currentTarget = this;
    do {
      if (currentTarget.type() !== "tab" /* TAB */ && currentTarget.type() !== "browser" /* BROWSER */) {
        lastTarget = currentTarget;
      }
      currentTarget = currentTarget.parentTarget();
    } while (currentTarget);
    return lastTarget;
  }
  dispose(reason) {
    super.dispose(reason);
    this.#targetManager.removeTarget(this);
    for (const model of this.#modelByConstructor.values()) {
      model.dispose();
    }
  }
  model(modelClass) {
    if (!this.#modelByConstructor.get(modelClass)) {
      const info = SDKModel.registeredModels.get(modelClass);
      if (info === void 0) {
        throw new Error("Model class is not registered");
      }
      if ((this.#capabilitiesMask & info.capabilities) === info.capabilities) {
        const model = new modelClass(this);
        this.#modelByConstructor.set(modelClass, model);
        if (!this.#creatingModels) {
          this.#targetManager.modelAdded(modelClass, model, this.#targetManager.isInScope(this));
        }
      }
    }
    return this.#modelByConstructor.get(modelClass) || null;
  }
  models() {
    return this.#modelByConstructor;
  }
  inspectedURL() {
    return this.#inspectedURL;
  }
  setInspectedURL(inspectedURL) {
    this.#inspectedURL = inspectedURL;
    const parsedURL = Common.ParsedURL.ParsedURL.fromString(inspectedURL);
    this.#inspectedURLName = parsedURL ? parsedURL.lastPathComponentWithFragment() : "#" + this.#id;
    this.#targetManager.onInspectedURLChange(this);
    if (!this.#name) {
      this.#targetManager.onNameChange(this);
    }
  }
  hasCrashed() {
    return this.#hasCrashed;
  }
  setHasCrashed(isCrashed) {
    const wasCrashed = this.#hasCrashed;
    this.#hasCrashed = isCrashed;
    if (wasCrashed && !isCrashed) {
      void this.resume();
    }
  }
  async suspend(reason) {
    if (this.#isSuspended) {
      return;
    }
    this.#isSuspended = true;
    if (this.#hasCrashed) {
      return;
    }
    await Promise.all(Array.from(this.models().values(), (m) => m.preSuspendModel(reason)));
    await Promise.all(Array.from(this.models().values(), (m) => m.suspendModel(reason)));
  }
  async resume() {
    if (!this.#isSuspended) {
      return;
    }
    this.#isSuspended = false;
    if (this.#hasCrashed) {
      return;
    }
    await Promise.all(Array.from(this.models().values(), (m) => m.resumeModel()));
    await Promise.all(Array.from(this.models().values(), (m) => m.postResumeModel()));
  }
  suspended() {
    return this.#isSuspended;
  }
  updateTargetInfo(targetInfo) {
    this.#targetInfo = targetInfo;
  }
  targetInfo() {
    return this.#targetInfo;
  }
}
export var Type = /* @__PURE__ */ ((Type2) => {
  Type2["FRAME"] = "frame";
  Type2["ServiceWorker"] = "service-worker";
  Type2["Worker"] = "worker";
  Type2["SHARED_WORKER"] = "shared-worker";
  Type2["SHARED_STORAGE_WORKLET"] = "shared-storage-worklet";
  Type2["NODE"] = "node";
  Type2["BROWSER"] = "browser";
  Type2["AUCTION_WORKLET"] = "auction-worklet";
  Type2["WORKLET"] = "worklet";
  Type2["TAB"] = "tab";
  Type2["NODE_WORKER"] = "node-worker";
  return Type2;
})(Type || {});
export var Capability = /* @__PURE__ */ ((Capability2) => {
  Capability2[Capability2["BROWSER"] = 1] = "BROWSER";
  Capability2[Capability2["DOM"] = 2] = "DOM";
  Capability2[Capability2["JS"] = 4] = "JS";
  Capability2[Capability2["LOG"] = 8] = "LOG";
  Capability2[Capability2["NETWORK"] = 16] = "NETWORK";
  Capability2[Capability2["TARGET"] = 32] = "TARGET";
  Capability2[Capability2["SCREEN_CAPTURE"] = 64] = "SCREEN_CAPTURE";
  Capability2[Capability2["TRACING"] = 128] = "TRACING";
  Capability2[Capability2["EMULATION"] = 256] = "EMULATION";
  Capability2[Capability2["SECURITY"] = 512] = "SECURITY";
  Capability2[Capability2["INPUT"] = 1024] = "INPUT";
  Capability2[Capability2["INSPECTOR"] = 2048] = "INSPECTOR";
  Capability2[Capability2["DEVICE_EMULATION"] = 4096] = "DEVICE_EMULATION";
  Capability2[Capability2["STORAGE"] = 8192] = "STORAGE";
  Capability2[Capability2["SERVICE_WORKER"] = 16384] = "SERVICE_WORKER";
  Capability2[Capability2["AUDITS"] = 32768] = "AUDITS";
  Capability2[Capability2["WEB_AUTHN"] = 65536] = "WEB_AUTHN";
  Capability2[Capability2["IO"] = 131072] = "IO";
  Capability2[Capability2["MEDIA"] = 262144] = "MEDIA";
  Capability2[Capability2["EVENT_BREAKPOINTS"] = 524288] = "EVENT_BREAKPOINTS";
  Capability2[Capability2["DOM_STORAGE"] = 1048576] = "DOM_STORAGE";
  Capability2[Capability2["NONE"] = 0] = "NONE";
  return Capability2;
})(Capability || {});
//# sourceMappingURL=Target.js.map
