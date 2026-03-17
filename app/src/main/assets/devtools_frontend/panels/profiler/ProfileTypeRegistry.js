"use strict";
import { DetachedElementsProfileType } from "./HeapDetachedElementsView.js";
import { SamplingHeapProfileType } from "./HeapProfileView.js";
import { HeapSnapshotProfileType, TrackingHeapSnapshotProfileType } from "./HeapSnapshotView.js";
export class ProfileTypeRegistry {
  heapSnapshotProfileType;
  samplingHeapProfileType;
  trackingHeapSnapshotProfileType;
  detachedElementProfileType;
  constructor() {
    this.heapSnapshotProfileType = new HeapSnapshotProfileType();
    this.samplingHeapProfileType = new SamplingHeapProfileType();
    this.trackingHeapSnapshotProfileType = new TrackingHeapSnapshotProfileType();
    this.detachedElementProfileType = new DetachedElementsProfileType();
  }
}
export const instance = new ProfileTypeRegistry();
//# sourceMappingURL=ProfileTypeRegistry.js.map
