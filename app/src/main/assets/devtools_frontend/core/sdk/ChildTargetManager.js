"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Common from "../common/common.js";
import * as Host from "../host/host.js";
import { PrimaryPageChangeType, ResourceTreeModel } from "./ResourceTreeModel.js";
import { SDKModel } from "./SDKModel.js";
import { SecurityOriginManager } from "./SecurityOriginManager.js";
import { StorageKeyManager } from "./StorageKeyManager.js";
import { Capability, Type } from "./Target.js";
import { Events as TargetManagerEvents } from "./TargetManager.js";
const UIStrings = {
  /**
   * @description Text that refers to the main target. The main target is the primary webpage that
   * DevTools is connected to. This text is used in various places in the UI as a label/name to inform
   * the user which target/webpage they are currently connected to, as DevTools may connect to multiple
   * targets at the same time in some scenarios.
   */
  main: "Main"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/ChildTargetManager.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class ChildTargetManager extends SDKModel {
  #targetManager;
  #parentTarget;
  #targetAgent;
  #targetInfos = /* @__PURE__ */ new Map();
  #childTargetsBySessionId = /* @__PURE__ */ new Map();
  #childTargetsById = /* @__PURE__ */ new Map();
  #parentTargetId = null;
  constructor(parentTarget) {
    super(parentTarget);
    this.#targetManager = parentTarget.targetManager();
    this.#parentTarget = parentTarget;
    this.#targetAgent = parentTarget.targetAgent();
    parentTarget.registerTargetDispatcher(this);
    const browserTarget = this.#targetManager.browserTarget();
    if (browserTarget) {
      if (browserTarget !== parentTarget) {
        void browserTarget.targetAgent().invoke_autoAttachRelated(
          { targetId: parentTarget.id(), waitForDebuggerOnStart: true }
        );
      }
    } else if (parentTarget.type() === Type.NODE) {
      void this.#targetAgent.invoke_setAutoAttach({ autoAttach: true, waitForDebuggerOnStart: true, flatten: false });
    } else {
      void this.#targetAgent.invoke_setAutoAttach({ autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
    }
    if (parentTarget.parentTarget()?.type() !== Type.FRAME && !Host.InspectorFrontendHost.isUnderTest()) {
      void this.#targetAgent.invoke_setDiscoverTargets({ discover: true });
      void this.#targetAgent.invoke_setRemoteLocations({ locations: [{ host: "localhost", port: 9229 }] });
    }
  }
  static install(attachCallback) {
    ChildTargetManager.attachCallback = attachCallback;
    SDKModel.register(ChildTargetManager, { capabilities: Capability.TARGET, autostart: true });
  }
  childTargets() {
    return Array.from(this.#childTargetsBySessionId.values());
  }
  async suspendModel() {
    await this.#targetAgent.invoke_setAutoAttach({ autoAttach: true, waitForDebuggerOnStart: false, flatten: true });
  }
  async resumeModel() {
    await this.#targetAgent.invoke_setAutoAttach({ autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
  }
  dispose() {
    for (const sessionId of this.#childTargetsBySessionId.keys()) {
      this.detachedFromTarget({ sessionId });
    }
  }
  targetCreated({ targetInfo }) {
    this.#targetInfos.set(targetInfo.targetId, targetInfo);
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners("TargetCreated" /* TARGET_CREATED */, targetInfo);
  }
  targetInfoChanged({ targetInfo }) {
    this.#targetInfos.set(targetInfo.targetId, targetInfo);
    const target = this.#childTargetsById.get(targetInfo.targetId);
    if (target) {
      void target.setHasCrashed(false);
      if (target.targetInfo()?.subtype === "prerender" && !targetInfo.subtype) {
        const resourceTreeModel = target.model(ResourceTreeModel);
        target.updateTargetInfo(targetInfo);
        if (resourceTreeModel?.mainFrame) {
          resourceTreeModel.primaryPageChanged(resourceTreeModel.mainFrame, PrimaryPageChangeType.ACTIVATION);
        }
        target.setName(i18nString(UIStrings.main));
      } else {
        target.updateTargetInfo(targetInfo);
      }
    }
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners("TargetInfoChanged" /* TARGET_INFO_CHANGED */, targetInfo);
  }
  targetDestroyed({ targetId }) {
    this.#targetInfos.delete(targetId);
    this.fireAvailableTargetsChanged();
    this.dispatchEventToListeners("TargetDestroyed" /* TARGET_DESTROYED */, targetId);
  }
  targetCrashed({ targetId }) {
    const target = this.#childTargetsById.get(targetId);
    if (target) {
      target.setHasCrashed(true);
    }
  }
  fireAvailableTargetsChanged() {
    this.#targetManager.dispatchEventToListeners(
      TargetManagerEvents.AVAILABLE_TARGETS_CHANGED,
      [...this.#targetInfos.values()]
    );
  }
  async getParentTargetId() {
    if (!this.#parentTargetId) {
      this.#parentTargetId = (await this.#parentTarget.targetAgent().invoke_getTargetInfo({})).targetInfo.targetId;
    }
    return this.#parentTargetId;
  }
  async getTargetInfo() {
    return (await this.#parentTarget.targetAgent().invoke_getTargetInfo({})).targetInfo;
  }
  async attachedToTarget({ sessionId, targetInfo, waitingForDebugger }) {
    if (this.#parentTargetId === targetInfo.targetId) {
      return;
    }
    let type = Type.BROWSER;
    let targetName = "";
    if (targetInfo.type === "worker" && targetInfo.title && targetInfo.title !== targetInfo.url) {
      targetName = targetInfo.title;
    } else if (!["page", "iframe", "webview"].includes(targetInfo.type)) {
      const KNOWN_FRAME_PATTERNS = [
        "^chrome://print/$",
        "^chrome://file-manager/",
        "^chrome://feedback/",
        "^chrome://.*\\.top-chrome/$",
        "^chrome://view-cert/$",
        "^devtools://"
      ];
      if (KNOWN_FRAME_PATTERNS.some((p) => targetInfo.url.match(p))) {
        type = Type.FRAME;
      } else {
        const parsedURL = Common.ParsedURL.ParsedURL.fromString(targetInfo.url);
        targetName = parsedURL ? parsedURL.lastPathComponentWithFragment() : "#" + ++ChildTargetManager.lastAnonymousTargetId;
      }
    }
    if (targetInfo.type === "iframe" || targetInfo.type === "webview") {
      type = Type.FRAME;
    } else if (targetInfo.type === "background_page" || targetInfo.type === "app" || targetInfo.type === "popup_page") {
      type = Type.FRAME;
    } else if (targetInfo.type === "page") {
      type = Type.FRAME;
    } else if (targetInfo.type === "browser_ui") {
      type = Type.FRAME;
    } else if (targetInfo.type === "worker") {
      type = Type.Worker;
    } else if (targetInfo.type === "worklet") {
      type = Type.WORKLET;
    } else if (targetInfo.type === "shared_worker") {
      type = Type.SHARED_WORKER;
    } else if (targetInfo.type === "shared_storage_worklet") {
      type = Type.SHARED_STORAGE_WORKLET;
    } else if (targetInfo.type === "service_worker") {
      type = Type.ServiceWorker;
    } else if (targetInfo.type === "auction_worklet") {
      type = Type.AUCTION_WORKLET;
    } else if (targetInfo.type === "node_worker") {
      type = Type.NODE_WORKER;
    }
    const target = this.#targetManager.createTarget(
      targetInfo.targetId,
      targetName,
      type,
      this.#parentTarget,
      sessionId,
      void 0,
      void 0,
      targetInfo
    );
    this.#childTargetsBySessionId.set(sessionId, target);
    this.#childTargetsById.set(target.id(), target);
    if (ChildTargetManager.attachCallback) {
      await ChildTargetManager.attachCallback({ target, waitingForDebugger });
    }
    if (waitingForDebugger) {
      void target.runtimeAgent().invoke_runIfWaitingForDebugger();
    }
    if (type !== Type.FRAME && target.hasAllCapabilities(Capability.STORAGE)) {
      await this.initializeStorage(target);
    }
  }
  async initializeStorage(target) {
    const storageAgent = target.storageAgent();
    const response = await storageAgent.invoke_getStorageKey({});
    const storageKey = response.storageKey;
    if (response.getError() || !storageKey) {
      console.error(`Failed to get storage key for target ${target.id()}: ${response.getError()}`);
      return;
    }
    const storageKeyManager = target.model(StorageKeyManager);
    if (storageKeyManager) {
      storageKeyManager.setMainStorageKey(storageKey);
      storageKeyManager.updateStorageKeys(/* @__PURE__ */ new Set([storageKey]));
    }
    const securityOriginManager = target.model(SecurityOriginManager);
    if (securityOriginManager) {
      const origin = new URL(storageKey).origin;
      securityOriginManager.setMainSecurityOrigin(origin, "");
      securityOriginManager.updateSecurityOrigins(/* @__PURE__ */ new Set([origin]));
    }
  }
  detachedFromTarget({ sessionId }) {
    const target = this.#childTargetsBySessionId.get(sessionId);
    if (target) {
      target.dispose("target terminated");
      this.#childTargetsBySessionId.delete(sessionId);
      this.#childTargetsById.delete(target.id());
    }
  }
  receivedMessageFromTarget({}) {
  }
  targetInfos() {
    return Array.from(this.#targetInfos.values());
  }
  static lastAnonymousTargetId = 0;
  static attachCallback;
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["TARGET_CREATED"] = "TargetCreated";
  Events2["TARGET_DESTROYED"] = "TargetDestroyed";
  Events2["TARGET_INFO_CHANGED"] = "TargetInfoChanged";
  return Events2;
})(Events || {});
//# sourceMappingURL=ChildTargetManager.js.map
