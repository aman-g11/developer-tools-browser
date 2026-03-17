"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
export class DOMStorage extends Common.ObjectWrapper.ObjectWrapper {
  model;
  #storageKey;
  #isLocalStorage;
  constructor(model, storageKey, isLocalStorage) {
    super();
    this.model = model;
    this.#storageKey = storageKey;
    this.#isLocalStorage = isLocalStorage;
  }
  static storageId(storageKey, isLocalStorage) {
    return { storageKey, isLocalStorage };
  }
  get id() {
    return DOMStorage.storageId(this.#storageKey, this.#isLocalStorage);
  }
  get storageKey() {
    return this.#storageKey;
  }
  get isLocalStorage() {
    return this.#isLocalStorage;
  }
  getItems() {
    return this.model.agent.invoke_getDOMStorageItems({ storageId: this.id }).then(({ entries }) => entries);
  }
  setItem(key, value) {
    void this.model.agent.invoke_setDOMStorageItem({ storageId: this.id, key, value });
  }
  removeItem(key) {
    void this.model.agent.invoke_removeDOMStorageItem({ storageId: this.id, key });
  }
  clear() {
    void this.model.agent.invoke_clear({ storageId: this.id });
  }
}
((DOMStorage2) => {
  let Events2;
  ((Events3) => {
    Events3["DOM_STORAGE_ITEMS_CLEARED"] = "DOMStorageItemsCleared";
    Events3["DOM_STORAGE_ITEM_REMOVED"] = "DOMStorageItemRemoved";
    Events3["DOM_STORAGE_ITEM_ADDED"] = "DOMStorageItemAdded";
    Events3["DOM_STORAGE_ITEM_UPDATED"] = "DOMStorageItemUpdated";
  })(Events2 = DOMStorage2.Events || (DOMStorage2.Events = {}));
})(DOMStorage || (DOMStorage = {}));
export class DOMStorageModel extends SDK.SDKModel.SDKModel {
  #storageKeyManager;
  #storages;
  agent;
  enabled;
  constructor(target) {
    super(target);
    this.#storageKeyManager = target.model(SDK.StorageKeyManager.StorageKeyManager);
    this.#storages = {};
    this.agent = target.domstorageAgent();
  }
  enable() {
    if (this.enabled) {
      return;
    }
    this.target().registerDOMStorageDispatcher(new DOMStorageDispatcher(this));
    if (this.#storageKeyManager) {
      this.#storageKeyManager.addEventListener(
        SDK.StorageKeyManager.Events.STORAGE_KEY_ADDED,
        this.storageKeyAdded,
        this
      );
      this.#storageKeyManager.addEventListener(
        SDK.StorageKeyManager.Events.STORAGE_KEY_REMOVED,
        this.storageKeyRemoved,
        this
      );
      for (const storageKey of this.#storageKeyManager.storageKeys()) {
        this.addStorageKey(storageKey);
      }
    }
    void this.agent.invoke_enable();
    this.enabled = true;
  }
  clearForStorageKey(storageKey) {
    if (!this.enabled) {
      return;
    }
    for (const isLocal of [true, false]) {
      const key = this.storageKey(storageKey, isLocal);
      const storage = this.#storages[key];
      if (!storage) {
        return;
      }
      storage.clear();
    }
    this.removeStorageKey(storageKey);
    this.addStorageKey(storageKey);
  }
  storageKeyAdded(event) {
    this.addStorageKey(event.data);
  }
  addStorageKey(storageKey) {
    for (const isLocal of [true, false]) {
      const key = this.storageKey(storageKey, isLocal);
      console.assert(!this.#storages[key]);
      const storage = new DOMStorage(this, storageKey, isLocal);
      this.#storages[key] = storage;
      this.dispatchEventToListeners("DOMStorageAdded" /* DOM_STORAGE_ADDED */, storage);
    }
  }
  storageKeyRemoved(event) {
    this.removeStorageKey(event.data);
  }
  removeStorageKey(storageKey) {
    for (const isLocal of [true, false]) {
      const key = this.storageKey(storageKey, isLocal);
      const storage = this.#storages[key];
      if (!storage) {
        continue;
      }
      delete this.#storages[key];
      this.dispatchEventToListeners("DOMStorageRemoved" /* DOM_STORAGE_REMOVED */, storage);
    }
  }
  storageKey(storageKey, isLocalStorage) {
    return JSON.stringify(DOMStorage.storageId(storageKey, isLocalStorage));
  }
  domStorageItemsCleared(storageId) {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }
    domStorage.dispatchEventToListeners("DOMStorageItemsCleared" /* DOM_STORAGE_ITEMS_CLEARED */);
  }
  domStorageItemRemoved(storageId, key) {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }
    const eventData = { key };
    domStorage.dispatchEventToListeners("DOMStorageItemRemoved" /* DOM_STORAGE_ITEM_REMOVED */, eventData);
  }
  domStorageItemAdded(storageId, key, value) {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }
    const eventData = { key, value };
    domStorage.dispatchEventToListeners("DOMStorageItemAdded" /* DOM_STORAGE_ITEM_ADDED */, eventData);
  }
  domStorageItemUpdated(storageId, key, oldValue, value) {
    const domStorage = this.storageForId(storageId);
    if (!domStorage) {
      return;
    }
    const eventData = { key, oldValue, value };
    domStorage.dispatchEventToListeners("DOMStorageItemUpdated" /* DOM_STORAGE_ITEM_UPDATED */, eventData);
  }
  storageForId(storageId) {
    console.assert(Boolean(storageId.storageKey));
    return this.#storages[this.storageKey(storageId.storageKey || "", storageId.isLocalStorage)];
  }
  storages() {
    const result = [];
    for (const id in this.#storages) {
      result.push(this.#storages[id]);
    }
    return result;
  }
}
SDK.SDKModel.SDKModel.register(DOMStorageModel, { capabilities: SDK.Target.Capability.DOM_STORAGE, autostart: false });
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["DOM_STORAGE_ADDED"] = "DOMStorageAdded";
  Events2["DOM_STORAGE_REMOVED"] = "DOMStorageRemoved";
  return Events2;
})(Events || {});
export class DOMStorageDispatcher {
  model;
  constructor(model) {
    this.model = model;
  }
  domStorageItemsCleared({ storageId }) {
    this.model.domStorageItemsCleared(storageId);
  }
  domStorageItemRemoved({ storageId, key }) {
    this.model.domStorageItemRemoved(storageId, key);
  }
  domStorageItemAdded({ storageId, key, newValue }) {
    this.model.domStorageItemAdded(storageId, key, newValue);
  }
  domStorageItemUpdated({ storageId, key, oldValue, newValue }) {
    this.model.domStorageItemUpdated(storageId, key, oldValue, newValue);
  }
}
//# sourceMappingURL=DOMStorageModel.js.map
