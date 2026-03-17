"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
export class ExtensionStorage extends Common.ObjectWrapper.ObjectWrapper {
  #model;
  #extensionId;
  #name;
  #storageArea;
  constructor(model, extensionId, name, storageArea) {
    super();
    this.#model = model;
    this.#extensionId = extensionId;
    this.#name = name;
    this.#storageArea = storageArea;
  }
  get model() {
    return this.#model;
  }
  get extensionId() {
    return this.#extensionId;
  }
  get name() {
    return this.#name;
  }
  // Returns a key that uniquely identifies this extension ID and storage area,
  // but which is not unique across targets, so we can identify two identical
  // storage areas across frames.
  get key() {
    return `${this.extensionId}-${this.storageArea}`;
  }
  get storageArea() {
    return this.#storageArea;
  }
  async getItems(keys) {
    const params = {
      id: this.#extensionId,
      storageArea: this.#storageArea
    };
    if (keys) {
      params.keys = keys;
    }
    const response = await this.#model.agent.invoke_getStorageItems(params);
    if (response.getError()) {
      throw new Error(response.getError());
    }
    return response.data;
  }
  async setItem(key, value) {
    const response = await this.#model.agent.invoke_setStorageItems(
      { id: this.#extensionId, storageArea: this.#storageArea, values: { [key]: value } }
    );
    if (response.getError()) {
      throw new Error(response.getError());
    }
  }
  async removeItem(key) {
    const response = await this.#model.agent.invoke_removeStorageItems(
      { id: this.#extensionId, storageArea: this.#storageArea, keys: [key] }
    );
    if (response.getError()) {
      throw new Error(response.getError());
    }
  }
  async clear() {
    const response = await this.#model.agent.invoke_clearStorageItems({ id: this.#extensionId, storageArea: this.#storageArea });
    if (response.getError()) {
      throw new Error(response.getError());
    }
  }
  matchesTarget(target) {
    if (!target) {
      return false;
    }
    const targetURL = target.targetInfo()?.url;
    const parsedURL = targetURL ? Common.ParsedURL.ParsedURL.fromString(targetURL) : null;
    return parsedURL?.scheme === "chrome-extension" && parsedURL?.host === this.extensionId;
  }
}
export class ExtensionStorageModel extends SDK.SDKModel.SDKModel {
  #runtimeModel;
  #storages;
  agent;
  #enabled;
  constructor(target) {
    super(target);
    this.#runtimeModel = target.model(SDK.RuntimeModel.RuntimeModel);
    this.#storages = /* @__PURE__ */ new Map();
    this.agent = target.extensionsAgent();
  }
  enable() {
    if (this.#enabled) {
      return;
    }
    if (this.#runtimeModel) {
      this.#runtimeModel.addEventListener(
        SDK.RuntimeModel.Events.ExecutionContextCreated,
        this.#onExecutionContextCreated,
        this
      );
      this.#runtimeModel.addEventListener(
        SDK.RuntimeModel.Events.ExecutionContextDestroyed,
        this.#onExecutionContextDestroyed,
        this
      );
      this.#runtimeModel.executionContexts().forEach(this.#executionContextCreated, this);
    }
    this.#enabled = true;
  }
  #getStoragesForExtension(id) {
    const existingStorages = this.#storages.get(id);
    if (existingStorages) {
      return existingStorages;
    }
    const newStorages = /* @__PURE__ */ new Map();
    this.#storages.set(id, newStorages);
    return newStorages;
  }
  #addExtension(id, name) {
    for (const storageArea of [
      Protocol.Extensions.StorageArea.Session,
      Protocol.Extensions.StorageArea.Local,
      Protocol.Extensions.StorageArea.Sync,
      Protocol.Extensions.StorageArea.Managed
    ]) {
      const storages = this.#getStoragesForExtension(id);
      const storage = new ExtensionStorage(this, id, name, storageArea);
      console.assert(!storages.get(storageArea));
      storage.getItems([]).then(() => {
        if (this.#storages.get(id) !== storages) {
          return;
        }
        if (storages.get(storageArea)) {
          return;
        }
        storages.set(storageArea, storage);
        this.dispatchEventToListeners("ExtensionStorageAdded" /* EXTENSION_STORAGE_ADDED */, storage);
      }).catch(
        () => {
        }
      );
    }
  }
  #removeExtension(id) {
    const storages = this.#storages.get(id);
    if (!storages) {
      return;
    }
    for (const [key, storage] of storages) {
      storages.delete(key);
      this.dispatchEventToListeners("ExtensionStorageRemoved" /* EXTENSION_STORAGE_REMOVED */, storage);
    }
    this.#storages.delete(id);
  }
  #executionContextCreated(context) {
    const extensionId = this.#extensionIdForContext(context);
    if (extensionId) {
      this.#addExtension(extensionId, context.name);
    }
  }
  #onExecutionContextCreated(event) {
    this.#executionContextCreated(event.data);
  }
  #extensionIdForContext(context) {
    const url = Common.ParsedURL.ParsedURL.fromString(context.origin);
    return url?.scheme === "chrome-extension" ? url.host : void 0;
  }
  #executionContextDestroyed(context) {
    const extensionId = this.#extensionIdForContext(context);
    if (extensionId) {
      if (this.#runtimeModel?.executionContexts().some((c) => this.#extensionIdForContext(c) === extensionId)) {
        return;
      }
      this.#removeExtension(extensionId);
    }
  }
  #onExecutionContextDestroyed(event) {
    this.#executionContextDestroyed(event.data);
  }
  storageForIdAndArea(id, storageArea) {
    return this.#storages.get(id)?.get(storageArea);
  }
  storages() {
    const result = [];
    for (const storages of this.#storages.values()) {
      result.push(...storages.values());
    }
    return result;
  }
}
SDK.SDKModel.SDKModel.register(ExtensionStorageModel, { capabilities: SDK.Target.Capability.JS, autostart: false });
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["EXTENSION_STORAGE_ADDED"] = "ExtensionStorageAdded";
  Events2["EXTENSION_STORAGE_REMOVED"] = "ExtensionStorageRemoved";
  return Events2;
})(Events || {});
//# sourceMappingURL=ExtensionStorageModel.js.map
