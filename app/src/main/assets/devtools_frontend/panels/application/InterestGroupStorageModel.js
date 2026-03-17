"use strict";
import * as SDK from "../../core/sdk/sdk.js";
export class InterestGroupStorageModel extends SDK.SDKModel.SDKModel {
  storageAgent;
  enabled;
  constructor(target) {
    super(target);
    target.registerStorageDispatcher(this);
    this.storageAgent = target.storageAgent();
    this.enabled = false;
  }
  enable() {
    if (this.enabled) {
      return;
    }
    void this.storageAgent.invoke_setInterestGroupTracking({ enable: true });
  }
  disable() {
    if (!this.enabled) {
      return;
    }
    void this.storageAgent.invoke_setInterestGroupTracking({ enable: false });
  }
  interestGroupAccessed(event) {
    this.dispatchEventToListeners("InterestGroupAccess" /* INTEREST_GROUP_ACCESS */, event);
  }
  attributionReportingTriggerRegistered(_event) {
  }
  indexedDBListUpdated(_event) {
  }
  indexedDBContentUpdated(_event) {
  }
  interestGroupAuctionEventOccurred(_event) {
  }
  interestGroupAuctionNetworkRequestCreated(_event) {
  }
  cacheStorageListUpdated(_event) {
  }
  cacheStorageContentUpdated(_event) {
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
SDK.SDKModel.SDKModel.register(
  InterestGroupStorageModel,
  { capabilities: SDK.Target.Capability.STORAGE, autostart: false }
);
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["INTEREST_GROUP_ACCESS"] = "InterestGroupAccess";
  return Events2;
})(Events || {});
//# sourceMappingURL=InterestGroupStorageModel.js.map
