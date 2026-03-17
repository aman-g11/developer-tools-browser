"use strict";
import { OverlayModel } from "./OverlayModel.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
export var ScreenshotMode = /* @__PURE__ */ ((ScreenshotMode2) => {
  ScreenshotMode2["FROM_VIEWPORT"] = "fromViewport";
  ScreenshotMode2["FROM_CLIP"] = "fromClip";
  ScreenshotMode2["FULLPAGE"] = "fullpage";
  return ScreenshotMode2;
})(ScreenshotMode || {});
export class ScreenCaptureModel extends SDKModel {
  #agent;
  #nextScreencastOperationId = 1;
  #screencastOperations = [];
  constructor(target) {
    super(target);
    this.#agent = target.pageAgent();
    target.registerPageDispatcher(this);
  }
  async startScreencast(format, quality, maxWidth, maxHeight, everyNthFrame, onFrame, onVisibilityChanged) {
    const currentRequest = this.#screencastOperations.at(-1);
    if (currentRequest) {
      await this.#agent.invoke_stopScreencast();
    }
    const operation = {
      id: this.#nextScreencastOperationId++,
      request: {
        format,
        quality,
        maxWidth,
        maxHeight,
        everyNthFrame
      },
      callbacks: {
        onScreencastFrame: onFrame,
        onScreencastVisibilityChanged: onVisibilityChanged
      }
    };
    this.#screencastOperations.push(operation);
    void this.#agent.invoke_startScreencast({ format, quality, maxWidth, maxHeight, everyNthFrame });
    return operation.id;
  }
  stopScreencast(id) {
    const operationToStop = this.#screencastOperations.pop();
    if (!operationToStop) {
      throw new Error("There is no screencast operation to stop.");
    }
    if (operationToStop.id !== id) {
      throw new Error("Trying to stop a screencast operation that is not being served right now.");
    }
    void this.#agent.invoke_stopScreencast();
    const nextOperation = this.#screencastOperations.at(-1);
    if (nextOperation) {
      void this.#agent.invoke_startScreencast({
        format: nextOperation.request.format,
        quality: nextOperation.request.quality,
        maxWidth: nextOperation.request.maxWidth,
        maxHeight: nextOperation.request.maxHeight,
        everyNthFrame: nextOperation.request.everyNthFrame
      });
    }
  }
  async captureScreenshot(format, quality, mode, clip) {
    const properties = {
      format,
      quality,
      fromSurface: true
    };
    switch (mode) {
      case "fromClip" /* FROM_CLIP */:
        properties.captureBeyondViewport = true;
        properties.clip = clip;
        break;
      case "fullpage" /* FULLPAGE */:
        properties.captureBeyondViewport = true;
        break;
      case "fromViewport" /* FROM_VIEWPORT */:
        properties.captureBeyondViewport = false;
        break;
      default:
        throw new Error("Unexpected or unspecified screnshotMode");
    }
    await OverlayModel.muteHighlight();
    const result = await this.#agent.invoke_captureScreenshot(properties);
    await OverlayModel.unmuteHighlight();
    return result.data;
  }
  screencastFrame({ data, metadata, sessionId }) {
    void this.#agent.invoke_screencastFrameAck({ sessionId });
    const currentRequest = this.#screencastOperations.at(-1);
    if (currentRequest) {
      currentRequest.callbacks.onScreencastFrame.call(null, data, metadata);
    }
  }
  screencastVisibilityChanged({ visible }) {
    const currentRequest = this.#screencastOperations.at(-1);
    if (currentRequest) {
      currentRequest.callbacks.onScreencastVisibilityChanged.call(null, visible);
    }
  }
  backForwardCacheNotUsed(_params) {
  }
  domContentEventFired(_params) {
  }
  loadEventFired(_params) {
  }
  lifecycleEvent(_params) {
  }
  navigatedWithinDocument(_params) {
  }
  frameAttached(_params) {
  }
  frameNavigated(_params) {
  }
  documentOpened(_params) {
  }
  frameDetached(_params) {
  }
  frameStartedLoading(_params) {
  }
  frameStoppedLoading(_params) {
  }
  frameRequestedNavigation(_params) {
  }
  frameStartedNavigating(_params) {
  }
  frameSubtreeWillBeDetached(_params) {
  }
  frameScheduledNavigation(_params) {
  }
  frameClearedScheduledNavigation(_params) {
  }
  frameResized() {
  }
  javascriptDialogOpening(_params) {
  }
  javascriptDialogClosed(_params) {
  }
  interstitialShown() {
  }
  interstitialHidden() {
  }
  windowOpen(_params) {
  }
  fileChooserOpened(_params) {
  }
  compilationCacheProduced(_params) {
  }
  downloadWillBegin(_params) {
  }
  downloadProgress() {
  }
  prefetchStatusUpdated(_params) {
  }
  prerenderStatusUpdated(_params) {
  }
}
SDKModel.register(ScreenCaptureModel, { capabilities: Capability.SCREEN_CAPTURE, autostart: false });
//# sourceMappingURL=ScreenCaptureModel.js.map
