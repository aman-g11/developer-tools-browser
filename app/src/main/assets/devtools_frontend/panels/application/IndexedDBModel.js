"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
const DEFAULT_BUCKET = "";
export class IndexedDBModel extends SDK.SDKModel.SDKModel {
  storageBucketModel;
  indexedDBAgent;
  storageAgent;
  // Used in web tests
  databasesInternal;
  databaseNamesByStorageKeyAndBucket;
  updatedStorageBuckets;
  throttler;
  enabled;
  constructor(target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.storageBucketModel = target.model(SDK.StorageBucketsModel.StorageBucketsModel);
    this.indexedDBAgent = target.indexedDBAgent();
    this.storageAgent = target.storageAgent();
    this.databasesInternal = /* @__PURE__ */ new Map();
    this.databaseNamesByStorageKeyAndBucket = /* @__PURE__ */ new Map();
    this.updatedStorageBuckets = /* @__PURE__ */ new Set();
    this.throttler = new Common.Throttler.Throttler(1e3);
  }
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static keyFromIDBKey(idbKey) {
    if (typeof idbKey === "undefined" || idbKey === null) {
      return void 0;
    }
    let key;
    switch (typeof idbKey) {
      case "number":
        key = {
          type: Protocol.IndexedDB.KeyType.Number,
          number: idbKey
        };
        break;
      case "string":
        key = {
          type: Protocol.IndexedDB.KeyType.String,
          string: idbKey
        };
        break;
      case "object":
        if (idbKey instanceof Date) {
          key = {
            type: Protocol.IndexedDB.KeyType.Date,
            date: idbKey.getTime()
          };
        } else if (Array.isArray(idbKey)) {
          const array = [];
          for (let i = 0; i < idbKey.length; ++i) {
            const nestedKey = IndexedDBModel.keyFromIDBKey(idbKey[i]);
            if (nestedKey) {
              array.push(nestedKey);
            }
          }
          key = {
            type: Protocol.IndexedDB.KeyType.Array,
            array
          };
        } else {
          return void 0;
        }
        break;
      default:
        return void 0;
    }
    return key;
  }
  static keyRangeFromIDBKeyRange(idbKeyRange) {
    return {
      lower: IndexedDBModel.keyFromIDBKey(idbKeyRange.lower),
      upper: IndexedDBModel.keyFromIDBKey(idbKeyRange.upper),
      lowerOpen: Boolean(idbKeyRange.lowerOpen),
      upperOpen: Boolean(idbKeyRange.upperOpen)
    };
  }
  static idbKeyPathFromKeyPath(keyPath) {
    let idbKeyPath;
    switch (keyPath.type) {
      case Protocol.IndexedDB.KeyPathType.Null:
        idbKeyPath = null;
        break;
      case Protocol.IndexedDB.KeyPathType.String:
        idbKeyPath = keyPath.string;
        break;
      case Protocol.IndexedDB.KeyPathType.Array:
        idbKeyPath = keyPath.array;
        break;
    }
    return idbKeyPath;
  }
  static keyPathStringFromIDBKeyPath(idbKeyPath) {
    if (typeof idbKeyPath === "string") {
      return '"' + idbKeyPath + '"';
    }
    if (idbKeyPath instanceof Array) {
      return '["' + idbKeyPath.join('", "') + '"]';
    }
    return null;
  }
  enable() {
    if (this.enabled) {
      return;
    }
    void this.indexedDBAgent.invoke_enable();
    if (this.storageBucketModel) {
      this.storageBucketModel.addEventListener(
        SDK.StorageBucketsModel.Events.BUCKET_ADDED,
        this.storageBucketAdded,
        this
      );
      this.storageBucketModel.addEventListener(
        SDK.StorageBucketsModel.Events.BUCKET_REMOVED,
        this.storageBucketRemoved,
        this
      );
      for (const { bucket } of this.storageBucketModel.getBuckets()) {
        this.addStorageBucket(bucket);
      }
    }
    this.enabled = true;
  }
  clearForStorageKey(storageKey) {
    if (!this.enabled || !this.databaseNamesByStorageKeyAndBucket.has(storageKey)) {
      return;
    }
    for (const [storageBucketName] of this.databaseNamesByStorageKeyAndBucket.get(storageKey) || []) {
      const storageBucket = this.storageBucketModel?.getBucketByName(storageKey, storageBucketName)?.bucket;
      if (storageBucket) {
        this.removeStorageBucket(storageBucket);
      }
    }
    this.databaseNamesByStorageKeyAndBucket.delete(storageKey);
    const bucketInfos = this.storageBucketModel?.getBucketsForStorageKey(storageKey) || [];
    for (const { bucket } of bucketInfos) {
      this.addStorageBucket(bucket);
    }
  }
  async deleteDatabase(databaseId) {
    if (!this.enabled) {
      return;
    }
    await this.indexedDBAgent.invoke_deleteDatabase(
      { storageBucket: databaseId.storageBucket, databaseName: databaseId.name }
    );
    void this.loadDatabaseNamesByStorageBucket(databaseId.storageBucket);
  }
  async refreshDatabaseNames() {
    for (const [storageKey] of this.databaseNamesByStorageKeyAndBucket) {
      const storageBucketNames = this.databaseNamesByStorageKeyAndBucket.get(storageKey)?.keys() || [];
      for (const storageBucketName of storageBucketNames) {
        const storageBucket = this.storageBucketModel?.getBucketByName(storageKey, storageBucketName)?.bucket;
        if (storageBucket) {
          await this.loadDatabaseNamesByStorageBucket(storageBucket);
        }
      }
    }
    this.dispatchEventToListeners("DatabaseNamesRefreshed" /* DatabaseNamesRefreshed */);
  }
  refreshDatabase(databaseId) {
    void this.loadDatabase(databaseId, true);
  }
  async clearObjectStore(databaseId, objectStoreName) {
    await this.indexedDBAgent.invoke_clearObjectStore(
      { storageBucket: databaseId.storageBucket, databaseName: databaseId.name, objectStoreName }
    );
  }
  async deleteEntries(databaseId, objectStoreName, idbKeyRange) {
    const keyRange = IndexedDBModel.keyRangeFromIDBKeyRange(idbKeyRange);
    await this.indexedDBAgent.invoke_deleteObjectStoreEntries(
      { storageBucket: databaseId.storageBucket, databaseName: databaseId.name, objectStoreName, keyRange }
    );
  }
  storageBucketAdded({ data: { bucketInfo: { bucket } } }) {
    this.addStorageBucket(bucket);
  }
  storageBucketRemoved({ data: { bucketInfo: { bucket } } }) {
    this.removeStorageBucket(bucket);
  }
  addStorageBucket(storageBucket) {
    const { storageKey } = storageBucket;
    if (!this.databaseNamesByStorageKeyAndBucket.has(storageKey)) {
      this.databaseNamesByStorageKeyAndBucket.set(storageKey, /* @__PURE__ */ new Map());
      void this.storageAgent.invoke_trackIndexedDBForStorageKey({ storageKey });
    }
    const storageKeyBuckets = this.databaseNamesByStorageKeyAndBucket.get(storageKey) || /* @__PURE__ */ new Map();
    console.assert(!storageKeyBuckets.has(storageBucket.name ?? DEFAULT_BUCKET));
    storageKeyBuckets.set(storageBucket.name ?? DEFAULT_BUCKET, /* @__PURE__ */ new Set());
    void this.loadDatabaseNamesByStorageBucket(storageBucket);
  }
  removeStorageBucket(storageBucket) {
    const { storageKey } = storageBucket;
    console.assert(this.databaseNamesByStorageKeyAndBucket.has(storageKey));
    const storageKeyBuckets = this.databaseNamesByStorageKeyAndBucket.get(storageKey) || /* @__PURE__ */ new Map();
    console.assert(storageKeyBuckets.has(storageBucket.name ?? DEFAULT_BUCKET));
    const databaseIds = storageKeyBuckets.get(storageBucket.name ?? DEFAULT_BUCKET) || /* @__PURE__ */ new Map();
    for (const databaseId of databaseIds) {
      this.databaseRemovedForStorageBucket(databaseId);
    }
    storageKeyBuckets.delete(storageBucket.name ?? DEFAULT_BUCKET);
    if (storageKeyBuckets.size === 0) {
      this.databaseNamesByStorageKeyAndBucket.delete(storageKey);
      void this.storageAgent.invoke_untrackIndexedDBForStorageKey({ storageKey });
    }
  }
  updateStorageKeyDatabaseNames(storageBucket, databaseNames) {
    const storageKeyBuckets = this.databaseNamesByStorageKeyAndBucket.get(storageBucket.storageKey);
    if (storageKeyBuckets === void 0) {
      return;
    }
    const newDatabases = new Set(databaseNames.map((databaseName) => new DatabaseId(storageBucket, databaseName)));
    const oldDatabases = new Set(storageKeyBuckets.get(storageBucket.name ?? DEFAULT_BUCKET));
    storageKeyBuckets.set(storageBucket.name ?? DEFAULT_BUCKET, newDatabases);
    for (const database of oldDatabases) {
      if (!database.inSet(newDatabases)) {
        this.databaseRemovedForStorageBucket(database);
      }
    }
    for (const database of newDatabases) {
      if (!database.inSet(oldDatabases)) {
        this.databaseAddedForStorageBucket(database);
      }
    }
  }
  databases() {
    const result = [];
    for (const [, buckets] of this.databaseNamesByStorageKeyAndBucket) {
      for (const [, databases] of buckets) {
        for (const database of databases) {
          result.push(database);
        }
      }
    }
    return result;
  }
  databaseAddedForStorageBucket(databaseId) {
    this.dispatchEventToListeners("DatabaseAdded" /* DatabaseAdded */, { model: this, databaseId });
  }
  databaseRemovedForStorageBucket(databaseId) {
    this.dispatchEventToListeners("DatabaseRemoved" /* DatabaseRemoved */, { model: this, databaseId });
  }
  async loadDatabaseNamesByStorageBucket(storageBucket) {
    const { storageKey } = storageBucket;
    const { databaseNames } = await this.indexedDBAgent.invoke_requestDatabaseNames({ storageBucket });
    if (!databaseNames) {
      return [];
    }
    if (!this.databaseNamesByStorageKeyAndBucket.has(storageKey)) {
      return [];
    }
    const storageKeyBuckets = this.databaseNamesByStorageKeyAndBucket.get(storageKey) || /* @__PURE__ */ new Map();
    if (!storageKeyBuckets.has(storageBucket.name ?? DEFAULT_BUCKET)) {
      return [];
    }
    this.updateStorageKeyDatabaseNames(storageBucket, databaseNames);
    return databaseNames;
  }
  async loadDatabase(databaseId, entriesUpdated) {
    const databaseWithObjectStores = (await this.indexedDBAgent.invoke_requestDatabase({
      storageBucket: databaseId.storageBucket,
      databaseName: databaseId.name
    })).databaseWithObjectStores;
    if (!this.databaseNamesByStorageKeyAndBucket.get(databaseId.storageBucket.storageKey)?.has(databaseId.storageBucket.name ?? DEFAULT_BUCKET)) {
      return;
    }
    if (!databaseWithObjectStores) {
      return;
    }
    const databaseModel = new Database(databaseId, databaseWithObjectStores.version);
    this.databasesInternal.set(databaseId, databaseModel);
    for (const objectStore of databaseWithObjectStores.objectStores) {
      const objectStoreIDBKeyPath = IndexedDBModel.idbKeyPathFromKeyPath(objectStore.keyPath);
      const objectStoreModel = new ObjectStore(objectStore.name, objectStoreIDBKeyPath, objectStore.autoIncrement);
      for (let j = 0; j < objectStore.indexes.length; ++j) {
        const index = objectStore.indexes[j];
        const indexIDBKeyPath = IndexedDBModel.idbKeyPathFromKeyPath(index.keyPath);
        const indexModel = new Index(index.name, indexIDBKeyPath, index.unique, index.multiEntry);
        objectStoreModel.indexes.set(indexModel.name, indexModel);
      }
      databaseModel.objectStores.set(objectStoreModel.name, objectStoreModel);
    }
    this.dispatchEventToListeners("DatabaseLoaded" /* DatabaseLoaded */, { model: this, database: databaseModel, entriesUpdated });
  }
  loadObjectStoreData(databaseId, objectStoreName, idbKeyRange, skipCount, pageSize, callback) {
    void this.requestData(
      databaseId,
      databaseId.name,
      objectStoreName,
      /* indexName=*/
      void 0,
      idbKeyRange,
      skipCount,
      pageSize,
      callback
    );
  }
  loadIndexData(databaseId, objectStoreName, indexName, idbKeyRange, skipCount, pageSize, callback) {
    void this.requestData(
      databaseId,
      databaseId.name,
      objectStoreName,
      indexName,
      idbKeyRange,
      skipCount,
      pageSize,
      callback
    );
  }
  async requestData(databaseId, databaseName, objectStoreName, indexName, idbKeyRange, skipCount, pageSize, callback) {
    const keyRange = idbKeyRange ? IndexedDBModel.keyRangeFromIDBKeyRange(idbKeyRange) : void 0;
    const runtimeModel = this.target().model(SDK.RuntimeModel.RuntimeModel);
    const response = await this.indexedDBAgent.invoke_requestData({
      storageBucket: databaseId.storageBucket,
      databaseName,
      objectStoreName,
      indexName,
      skipCount,
      pageSize,
      keyRange
    });
    if (!runtimeModel || !this.databaseNamesByStorageKeyAndBucket.get(databaseId.storageBucket.storageKey)?.has(databaseId.storageBucket.name ?? DEFAULT_BUCKET)) {
      return;
    }
    if (response.getError()) {
      console.error("IndexedDBAgent error: " + response.getError());
      return;
    }
    const dataEntries = response.objectStoreDataEntries;
    const entries = [];
    for (const dataEntry of dataEntries) {
      const key = runtimeModel?.createRemoteObject(dataEntry.key);
      const primaryKey = runtimeModel?.createRemoteObject(dataEntry.primaryKey);
      const value = runtimeModel?.createRemoteObject(dataEntry.value);
      if (!key || !primaryKey || !value) {
        return;
      }
      entries.push(new Entry(key, primaryKey, value));
    }
    callback(entries, response.hasMore);
  }
  async getMetadata(databaseId, objectStore) {
    const databaseName = databaseId.name;
    const objectStoreName = objectStore.name;
    const response = await this.indexedDBAgent.invoke_getMetadata(
      { storageBucket: databaseId.storageBucket, databaseName, objectStoreName }
    );
    if (response.getError()) {
      console.error("IndexedDBAgent error: " + response.getError());
      return null;
    }
    return { entriesCount: response.entriesCount, keyGeneratorValue: response.keyGeneratorValue };
  }
  async refreshDatabaseListForStorageBucket(storageBucket) {
    const databaseNames = await this.loadDatabaseNamesByStorageBucket(storageBucket);
    for (const databaseName of databaseNames) {
      void this.loadDatabase(new DatabaseId(storageBucket, databaseName), false);
    }
  }
  indexedDBListUpdated({ storageKey, bucketId }) {
    const storageBucket = this.storageBucketModel?.getBucketById(bucketId)?.bucket;
    if (storageKey && storageBucket) {
      this.updatedStorageBuckets.add(storageBucket);
      void this.throttler.schedule(() => {
        const promises = Array.from(this.updatedStorageBuckets, (storageBucket2) => {
          void this.refreshDatabaseListForStorageBucket(storageBucket2);
        });
        this.updatedStorageBuckets.clear();
        return Promise.all(promises);
      });
    }
  }
  indexedDBContentUpdated({ bucketId, databaseName, objectStoreName }) {
    const storageBucket = this.storageBucketModel?.getBucketById(bucketId)?.bucket;
    if (storageBucket) {
      const databaseId = new DatabaseId(storageBucket, databaseName);
      this.dispatchEventToListeners("IndexedDBContentUpdated" /* IndexedDBContentUpdated */, { databaseId, objectStoreName, model: this });
    }
  }
  attributionReportingTriggerRegistered(_event) {
  }
  cacheStorageListUpdated(_event) {
  }
  cacheStorageContentUpdated(_event) {
  }
  interestGroupAccessed(_event) {
  }
  interestGroupAuctionEventOccurred(_event) {
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
  attributionReportingSourceRegistered(_event) {
  }
  attributionReportingReportSent(_event) {
  }
  attributionReportingVerboseDebugReportSent(_event) {
  }
}
SDK.SDKModel.SDKModel.register(IndexedDBModel, { capabilities: SDK.Target.Capability.STORAGE, autostart: false });
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["DatabaseAdded"] = "DatabaseAdded";
  Events2["DatabaseRemoved"] = "DatabaseRemoved";
  Events2["DatabaseLoaded"] = "DatabaseLoaded";
  Events2["DatabaseNamesRefreshed"] = "DatabaseNamesRefreshed";
  Events2["IndexedDBContentUpdated"] = "IndexedDBContentUpdated";
  return Events2;
})(Events || {});
export class Entry {
  key;
  primaryKey;
  value;
  constructor(key, primaryKey, value) {
    this.key = key;
    this.primaryKey = primaryKey;
    this.value = value;
  }
}
export class DatabaseId {
  storageBucket;
  name;
  constructor(storageBucket, name) {
    this.storageBucket = storageBucket;
    this.name = name;
  }
  inBucket(storageBucket) {
    return this.storageBucket.name === storageBucket.name;
  }
  equals(databaseId) {
    return this.name === databaseId.name && this.storageBucket.name === databaseId.storageBucket.name && this.storageBucket.storageKey === databaseId.storageBucket.storageKey;
  }
  inSet(databaseSet) {
    for (const database of databaseSet) {
      if (this.equals(database)) {
        return true;
      }
    }
    return false;
  }
}
export class Database {
  databaseId;
  version;
  objectStores;
  constructor(databaseId, version) {
    this.databaseId = databaseId;
    this.version = version;
    this.objectStores = /* @__PURE__ */ new Map();
  }
}
export class ObjectStore {
  name;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyPath;
  autoIncrement;
  indexes;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(name, keyPath, autoIncrement) {
    this.name = name;
    this.keyPath = keyPath;
    this.autoIncrement = autoIncrement;
    this.indexes = /* @__PURE__ */ new Map();
  }
  get keyPathString() {
    return IndexedDBModel.keyPathStringFromIDBKeyPath(this.keyPath);
  }
}
export class Index {
  name;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyPath;
  unique;
  multiEntry;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(name, keyPath, unique, multiEntry) {
    this.name = name;
    this.keyPath = keyPath;
    this.unique = unique;
    this.multiEntry = multiEntry;
  }
  get keyPathString() {
    return IndexedDBModel.keyPathStringFromIDBKeyPath(this.keyPath);
  }
}
//# sourceMappingURL=IndexedDBModel.js.map
