"use strict";
import * as Common from "../common/common.js";
import * as i18n from "../i18n/i18n.js";
import { SDKModel } from "./SDKModel.js";
import { Events as StorageBucketsModelEvents, StorageBucketsModel } from "./StorageBucketsModel.js";
import { Capability } from "./Target.js";
const UIStrings = {
  /**
   * @description Text in Service Worker Cache Model
   * @example {https://cache} PH1
   * @example {error message} PH2
   */
  serviceworkercacheagentError: "`ServiceWorkerCacheAgent` error deleting cache entry {PH1} in cache: {PH2}"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/ServiceWorkerCacheModel.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class ServiceWorkerCacheModel extends SDKModel {
  cacheAgent;
  #storageAgent;
  #storageBucketModel;
  #caches = /* @__PURE__ */ new Map();
  #storageKeysTracked = /* @__PURE__ */ new Set();
  #storageBucketsUpdated = /* @__PURE__ */ new Set();
  #throttler = new Common.Throttler.Throttler(2e3);
  #enabled = false;
  // Used by tests to remove the Throttler timeout.
  #scheduleAsSoonAsPossible = false;
  /**
   * Invariant: This #model can only be constructed on a ServiceWorker target.
   */
  constructor(target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.cacheAgent = target.cacheStorageAgent();
    this.#storageAgent = target.storageAgent();
    this.#storageBucketModel = target.model(StorageBucketsModel);
  }
  enable() {
    if (this.#enabled) {
      return;
    }
    this.#storageBucketModel.addEventListener(StorageBucketsModelEvents.BUCKET_ADDED, this.storageBucketAdded, this);
    this.#storageBucketModel.addEventListener(
      StorageBucketsModelEvents.BUCKET_REMOVED,
      this.storageBucketRemoved,
      this
    );
    for (const storageBucket of this.#storageBucketModel.getBuckets()) {
      this.addStorageBucket(storageBucket.bucket);
    }
    this.#enabled = true;
  }
  clearForStorageKey(storageKey) {
    for (const [opaqueId, cache] of this.#caches.entries()) {
      if (cache.storageKey === storageKey) {
        this.#caches.delete(opaqueId);
        this.cacheRemoved(cache);
      }
    }
    for (const storageBucket of this.#storageBucketModel.getBucketsForStorageKey(storageKey)) {
      void this.loadCacheNames(storageBucket.bucket);
    }
  }
  refreshCacheNames() {
    for (const cache of this.#caches.values()) {
      this.cacheRemoved(cache);
    }
    this.#caches.clear();
    const storageBuckets = this.#storageBucketModel.getBuckets();
    for (const storageBucket of storageBuckets) {
      void this.loadCacheNames(storageBucket.bucket);
    }
  }
  async deleteCache(cache) {
    const response = await this.cacheAgent.invoke_deleteCache({ cacheId: cache.cacheId });
    if (response.getError()) {
      console.error(`ServiceWorkerCacheAgent error deleting cache ${cache.toString()}: ${response.getError()}`);
      return;
    }
    this.#caches.delete(cache.cacheId);
    this.cacheRemoved(cache);
  }
  async deleteCacheEntry(cache, request) {
    const response = await this.cacheAgent.invoke_deleteEntry({ cacheId: cache.cacheId, request });
    if (response.getError()) {
      Common.Console.Console.instance().error(i18nString(
        UIStrings.serviceworkercacheagentError,
        { PH1: cache.toString(), PH2: String(response.getError()) }
      ));
      return;
    }
  }
  loadCacheData(cache, skipCount, pageSize, pathFilter, callback) {
    void this.requestEntries(cache, skipCount, pageSize, pathFilter, callback);
  }
  loadAllCacheData(cache, pathFilter, callback) {
    void this.requestAllEntries(cache, pathFilter, callback);
  }
  caches() {
    return [...this.#caches.values()];
  }
  dispose() {
    for (const cache of this.#caches.values()) {
      this.cacheRemoved(cache);
    }
    this.#caches.clear();
    if (this.#enabled) {
      this.#storageBucketModel.removeEventListener(
        StorageBucketsModelEvents.BUCKET_ADDED,
        this.storageBucketAdded,
        this
      );
      this.#storageBucketModel.removeEventListener(
        StorageBucketsModelEvents.BUCKET_REMOVED,
        this.storageBucketRemoved,
        this
      );
    }
  }
  addStorageBucket(storageBucket) {
    void this.loadCacheNames(storageBucket);
    if (!this.#storageKeysTracked.has(storageBucket.storageKey)) {
      this.#storageKeysTracked.add(storageBucket.storageKey);
      void this.#storageAgent.invoke_trackCacheStorageForStorageKey({ storageKey: storageBucket.storageKey });
    }
  }
  removeStorageBucket(storageBucket) {
    let storageKeyCount = 0;
    for (const [opaqueId, cache] of this.#caches.entries()) {
      if (storageBucket.storageKey === cache.storageKey) {
        storageKeyCount++;
      }
      if (cache.inBucket(storageBucket)) {
        storageKeyCount--;
        this.#caches.delete(opaqueId);
        this.cacheRemoved(cache);
      }
    }
    if (storageKeyCount === 0) {
      this.#storageKeysTracked.delete(storageBucket.storageKey);
      void this.#storageAgent.invoke_untrackCacheStorageForStorageKey({ storageKey: storageBucket.storageKey });
    }
  }
  async loadCacheNames(storageBucket) {
    const response = await this.cacheAgent.invoke_requestCacheNames({ storageBucket });
    if (response.getError()) {
      return;
    }
    this.updateCacheNames(storageBucket, response.caches);
  }
  updateCacheNames(storageBucket, cachesJson) {
    function deleteAndSaveOldCaches(cache) {
      if (cache.inBucket(storageBucket) && !updatingCachesIds.has(cache.cacheId)) {
        oldCaches.set(cache.cacheId, cache);
        this.#caches.delete(cache.cacheId);
      }
    }
    const updatingCachesIds = /* @__PURE__ */ new Set();
    const newCaches = /* @__PURE__ */ new Map();
    const oldCaches = /* @__PURE__ */ new Map();
    for (const cacheJson of cachesJson) {
      const storageBucket2 = cacheJson.storageBucket ?? this.#storageBucketModel.getDefaultBucketForStorageKey(cacheJson.storageKey)?.bucket;
      if (!storageBucket2) {
        continue;
      }
      const cache = new Cache(this, storageBucket2, cacheJson.cacheName, cacheJson.cacheId);
      updatingCachesIds.add(cache.cacheId);
      if (this.#caches.has(cache.cacheId)) {
        continue;
      }
      newCaches.set(cache.cacheId, cache);
      this.#caches.set(cache.cacheId, cache);
    }
    this.#caches.forEach(deleteAndSaveOldCaches, this);
    newCaches.forEach(this.cacheAdded, this);
    oldCaches.forEach(this.cacheRemoved, this);
  }
  storageBucketAdded({ data: { bucketInfo: { bucket } } }) {
    this.addStorageBucket(bucket);
  }
  storageBucketRemoved({ data: { bucketInfo: { bucket } } }) {
    this.removeStorageBucket(bucket);
  }
  cacheAdded(cache) {
    this.dispatchEventToListeners("CacheAdded" /* CACHE_ADDED */, { model: this, cache });
  }
  cacheRemoved(cache) {
    this.dispatchEventToListeners("CacheRemoved" /* CACHE_REMOVED */, { model: this, cache });
  }
  async requestEntries(cache, skipCount, pageSize, pathFilter, callback) {
    const response = await this.cacheAgent.invoke_requestEntries({ cacheId: cache.cacheId, skipCount, pageSize, pathFilter });
    if (response.getError()) {
      console.error("ServiceWorkerCacheAgent error while requesting entries: ", response.getError());
      return;
    }
    callback(response.cacheDataEntries, response.returnCount);
  }
  async requestAllEntries(cache, pathFilter, callback) {
    const response = await this.cacheAgent.invoke_requestEntries({ cacheId: cache.cacheId, pathFilter });
    if (response.getError()) {
      console.error("ServiceWorkerCacheAgent error while requesting entries: ", response.getError());
      return;
    }
    callback(response.cacheDataEntries, response.returnCount);
  }
  cacheStorageListUpdated({ bucketId }) {
    const storageBucket = this.#storageBucketModel.getBucketById(bucketId)?.bucket;
    if (storageBucket) {
      this.#storageBucketsUpdated.add(storageBucket);
      void this.#throttler.schedule(
        () => {
          const promises = Array.from(this.#storageBucketsUpdated, (storageBucket2) => this.loadCacheNames(storageBucket2));
          this.#storageBucketsUpdated.clear();
          return Promise.all(promises);
        },
        this.#scheduleAsSoonAsPossible ? Common.Throttler.Scheduling.AS_SOON_AS_POSSIBLE : Common.Throttler.Scheduling.DEFAULT
      );
    }
  }
  cacheStorageContentUpdated({ bucketId, cacheName }) {
    const storageBucket = this.#storageBucketModel.getBucketById(bucketId)?.bucket;
    if (storageBucket) {
      this.dispatchEventToListeners("CacheStorageContentUpdated" /* CACHE_STORAGE_CONTENT_UPDATED */, { storageBucket, cacheName });
    }
  }
  attributionReportingTriggerRegistered(_event) {
  }
  indexedDBListUpdated(_event) {
  }
  indexedDBContentUpdated(_event) {
  }
  interestGroupAuctionEventOccurred(_event) {
  }
  interestGroupAccessed(_event) {
  }
  interestGroupAuctionNetworkRequestCreated(_event) {
  }
  sharedStorageAccessed(_event) {
  }
  sharedStorageWorkletOperationExecutionFinished(_event) {
  }
  storageBucketCreatedOrUpdated(_event) {
  }
  storageBucketDeleted(_event) {
  }
  setThrottlerSchedulesAsSoonAsPossibleForTest() {
    this.#scheduleAsSoonAsPossible = true;
  }
  attributionReportingSourceRegistered(_event) {
  }
  attributionReportingReportSent(_event) {
  }
  attributionReportingVerboseDebugReportSent(_event) {
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["CACHE_ADDED"] = "CacheAdded";
  Events2["CACHE_REMOVED"] = "CacheRemoved";
  Events2["CACHE_STORAGE_CONTENT_UPDATED"] = "CacheStorageContentUpdated";
  return Events2;
})(Events || {});
export class Cache {
  #model;
  storageKey;
  storageBucket;
  cacheName;
  cacheId;
  constructor(model, storageBucket, cacheName, cacheId) {
    this.#model = model;
    this.storageBucket = storageBucket;
    this.storageKey = storageBucket.storageKey;
    this.cacheName = cacheName;
    this.cacheId = cacheId;
  }
  inBucket(storageBucket) {
    return this.storageKey === storageBucket.storageKey && this.storageBucket.name === storageBucket.name;
  }
  equals(cache) {
    return this.cacheId === cache.cacheId;
  }
  toString() {
    return this.storageKey + this.cacheName;
  }
  async requestCachedResponse(url, requestHeaders) {
    const response = await this.#model.cacheAgent.invoke_requestCachedResponse(
      { cacheId: this.cacheId, requestURL: url, requestHeaders }
    );
    if (response.getError()) {
      return null;
    }
    return response.response;
  }
}
SDKModel.register(ServiceWorkerCacheModel, { capabilities: Capability.STORAGE, autostart: false });
//# sourceMappingURL=ServiceWorkerCacheModel.js.map
