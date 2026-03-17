"use strict";
import * as Common from "../common/common.js";
import * as Root from "../root/root.js";
import { Events as ResourceTreeModelEvents, ResourceTreeModel } from "./ResourceTreeModel.js";
import { TargetManager } from "./TargetManager.js";
export class FrameManager extends Common.ObjectWrapper.ObjectWrapper {
  #eventListeners = /* @__PURE__ */ new WeakMap();
  // Maps frameIds to #frames and a count of how many ResourceTreeModels contain this frame.
  // (OOPIFs are usually first attached to a new target and then detached from their old target,
  // therefore being contained in 2 models for a short period of time.)
  #frames = /* @__PURE__ */ new Map();
  #framesForTarget = /* @__PURE__ */ new Map();
  #outermostFrame = null;
  #transferringFramesDataCache = /* @__PURE__ */ new Map();
  #awaitedFrames = /* @__PURE__ */ new Map();
  constructor(targetManager) {
    super();
    targetManager.observeModels(ResourceTreeModel, this);
  }
  static instance({ forceNew } = { forceNew: false }) {
    if (!Root.DevToolsContext.globalInstance().has(FrameManager) || forceNew) {
      Root.DevToolsContext.globalInstance().set(FrameManager, new FrameManager(TargetManager.instance()));
    }
    return Root.DevToolsContext.globalInstance().get(FrameManager);
  }
  static removeInstance() {
    Root.DevToolsContext.globalInstance().delete(FrameManager);
  }
  modelAdded(resourceTreeModel) {
    const addListener = resourceTreeModel.addEventListener(ResourceTreeModelEvents.FrameAdded, this.frameAdded, this);
    const detachListener = resourceTreeModel.addEventListener(ResourceTreeModelEvents.FrameDetached, this.frameDetached, this);
    const navigatedListener = resourceTreeModel.addEventListener(ResourceTreeModelEvents.FrameNavigated, this.frameNavigated, this);
    const resourceAddedListener = resourceTreeModel.addEventListener(ResourceTreeModelEvents.ResourceAdded, this.resourceAdded, this);
    this.#eventListeners.set(
      resourceTreeModel,
      [addListener, detachListener, navigatedListener, resourceAddedListener]
    );
    this.#framesForTarget.set(resourceTreeModel.target().id(), /* @__PURE__ */ new Set());
  }
  modelRemoved(resourceTreeModel) {
    const listeners = this.#eventListeners.get(resourceTreeModel);
    if (listeners) {
      Common.EventTarget.removeEventListeners(listeners);
    }
    const frameSet = this.#framesForTarget.get(resourceTreeModel.target().id());
    if (frameSet) {
      for (const frameId of frameSet) {
        this.decreaseOrRemoveFrame(frameId);
      }
    }
    this.#framesForTarget.delete(resourceTreeModel.target().id());
  }
  frameAdded(event) {
    const frame = event.data;
    const frameData = this.#frames.get(frame.id);
    if (frameData) {
      frame.setCreationStackTrace(frameData.frame.getCreationStackTraceData());
      this.#frames.set(frame.id, { frame, count: frameData.count + 1 });
    } else {
      const cachedFrameAttributes = this.#transferringFramesDataCache.get(frame.id);
      if (cachedFrameAttributes?.creationStackTrace && cachedFrameAttributes?.creationStackTraceTarget) {
        frame.setCreationStackTrace({
          creationStackTrace: cachedFrameAttributes.creationStackTrace,
          creationStackTraceTarget: cachedFrameAttributes.creationStackTraceTarget
        });
      }
      this.#frames.set(frame.id, { frame, count: 1 });
      this.#transferringFramesDataCache.delete(frame.id);
    }
    this.resetOutermostFrame();
    const frameSet = this.#framesForTarget.get(frame.resourceTreeModel().target().id());
    if (frameSet) {
      frameSet.add(frame.id);
    }
    this.dispatchEventToListeners("FrameAddedToTarget" /* FRAME_ADDED_TO_TARGET */, { frame });
    this.resolveAwaitedFrame(frame);
  }
  frameDetached(event) {
    const { frame, isSwap } = event.data;
    this.decreaseOrRemoveFrame(frame.id);
    if (isSwap && !this.#frames.get(frame.id)) {
      const traceData = frame.getCreationStackTraceData();
      const cachedFrameAttributes = {
        ...traceData.creationStackTrace && { creationStackTrace: traceData.creationStackTrace },
        ...traceData.creationStackTrace && { creationStackTraceTarget: traceData.creationStackTraceTarget }
      };
      this.#transferringFramesDataCache.set(frame.id, cachedFrameAttributes);
    }
    const frameSet = this.#framesForTarget.get(frame.resourceTreeModel().target().id());
    if (frameSet) {
      frameSet.delete(frame.id);
    }
  }
  frameNavigated(event) {
    const frame = event.data;
    this.dispatchEventToListeners("FrameNavigated" /* FRAME_NAVIGATED */, { frame });
    if (frame.isOutermostFrame()) {
      this.dispatchEventToListeners("OutermostFrameNavigated" /* OUTERMOST_FRAME_NAVIGATED */, { frame });
    }
  }
  resourceAdded(event) {
    this.dispatchEventToListeners("ResourceAdded" /* RESOURCE_ADDED */, { resource: event.data });
  }
  decreaseOrRemoveFrame(frameId) {
    const frameData = this.#frames.get(frameId);
    if (frameData) {
      if (frameData.count === 1) {
        this.#frames.delete(frameId);
        this.resetOutermostFrame();
        this.dispatchEventToListeners("FrameRemoved" /* FRAME_REMOVED */, { frameId });
      } else {
        frameData.count--;
      }
    }
  }
  /**
   * Looks for the outermost frame in `#frames` and sets `#outermostFrame` accordingly.
   *
   * Important: This method needs to be called everytime `#frames` is updated.
   */
  resetOutermostFrame() {
    const outermostFrames = this.getAllFrames().filter((frame) => frame.isOutermostFrame());
    this.#outermostFrame = outermostFrames.length > 0 ? outermostFrames[0] : null;
  }
  /**
   * Returns the ResourceTreeFrame with a given frameId.
   * When a frame is being detached a new ResourceTreeFrame but with the same
   * frameId is created. Consequently getFrame() will return a different
   * ResourceTreeFrame after detachment. Callers of getFrame() should therefore
   * immediately use the function return value and not store it for later use.
   */
  getFrame(frameId) {
    const frameData = this.#frames.get(frameId);
    if (frameData) {
      return frameData.frame;
    }
    return null;
  }
  getAllFrames() {
    return Array.from(this.#frames.values(), (frameData) => frameData.frame);
  }
  getOutermostFrame() {
    return this.#outermostFrame;
  }
  async getOrWaitForFrame(frameId, notInTarget) {
    const frame = this.getFrame(frameId);
    if (frame && (!notInTarget || notInTarget !== frame.resourceTreeModel().target())) {
      return frame;
    }
    return await new Promise((resolve) => {
      const waiting = this.#awaitedFrames.get(frameId);
      if (waiting) {
        waiting.push({ notInTarget, resolve });
      } else {
        this.#awaitedFrames.set(frameId, [{ notInTarget, resolve }]);
      }
    });
  }
  resolveAwaitedFrame(frame) {
    const waiting = this.#awaitedFrames.get(frame.id);
    if (!waiting) {
      return;
    }
    const newWaiting = waiting.filter(({ notInTarget, resolve }) => {
      if (!notInTarget || notInTarget !== frame.resourceTreeModel().target()) {
        resolve(frame);
        return false;
      }
      return true;
    });
    if (newWaiting.length > 0) {
      this.#awaitedFrames.set(frame.id, newWaiting);
    } else {
      this.#awaitedFrames.delete(frame.id);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["FRAME_ADDED_TO_TARGET"] = "FrameAddedToTarget";
  Events2["FRAME_NAVIGATED"] = "FrameNavigated";
  Events2["FRAME_REMOVED"] = "FrameRemoved";
  Events2["RESOURCE_ADDED"] = "ResourceAdded";
  Events2["OUTERMOST_FRAME_NAVIGATED"] = "OutermostFrameNavigated";
  return Events2;
})(Events || {});
//# sourceMappingURL=FrameManager.js.map
