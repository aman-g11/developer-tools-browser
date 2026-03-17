"use strict";
import { CategorizedBreakpoint, Category } from "./CategorizedBreakpoint.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
import { TargetManager } from "./TargetManager.js";
export var InstrumentationNames = /* @__PURE__ */ ((InstrumentationNames2) => {
  InstrumentationNames2["BEFORE_BIDDER_WORKLET_BIDDING_START"] = "beforeBidderWorkletBiddingStart";
  InstrumentationNames2["BEFORE_BIDDER_WORKLET_REPORTING_START"] = "beforeBidderWorkletReportingStart";
  InstrumentationNames2["BEFORE_SELLER_WORKLET_SCORING_START"] = "beforeSellerWorkletScoringStart";
  InstrumentationNames2["BEFORE_SELLER_WORKLET_REPORTING_START"] = "beforeSellerWorkletReportingStart";
  InstrumentationNames2["SET_TIMEOUT"] = "setTimeout";
  InstrumentationNames2["CLEAR_TIMEOUT"] = "clearTimeout";
  InstrumentationNames2["SET_TIMEOUT_CALLBACK"] = "setTimeout.callback";
  InstrumentationNames2["SET_INTERVAL"] = "setInterval";
  InstrumentationNames2["CLEAR_INTERVAL"] = "clearInterval";
  InstrumentationNames2["SET_INTERVAL_CALLBACK"] = "setInterval.callback";
  InstrumentationNames2["SCRIPT_FIRST_STATEMENT"] = "scriptFirstStatement";
  InstrumentationNames2["SCRIPT_BLOCKED_BY_CSP"] = "scriptBlockedByCSP";
  InstrumentationNames2["SHARED_STORAGE_WORKLET_SCRIPT_FIRST_STATEMENT"] = "sharedStorageWorkletScriptFirstStatement";
  InstrumentationNames2["REQUEST_ANIMATION_FRAME"] = "requestAnimationFrame";
  InstrumentationNames2["CANCEL_ANIMATION_FRAME"] = "cancelAnimationFrame";
  InstrumentationNames2["REQUEST_ANIMATION_FRAME_CALLBACK"] = "requestAnimationFrame.callback";
  InstrumentationNames2["WEBGL_ERROR_FIRED"] = "webglErrorFired";
  InstrumentationNames2["WEBGL_WARNING_FIRED"] = "webglWarningFired";
  InstrumentationNames2["ELEMENT_SET_INNER_HTML"] = "Element.setInnerHTML";
  InstrumentationNames2["CANVAS_CONTEXT_CREATED"] = "canvasContextCreated";
  InstrumentationNames2["GEOLOCATION_GET_CURRENT_POSITION"] = "Geolocation.getCurrentPosition";
  InstrumentationNames2["GEOLOCATION_WATCH_POSITION"] = "Geolocation.watchPosition";
  InstrumentationNames2["NOTIFICATION_REQUEST_PERMISSION"] = "Notification.requestPermission";
  InstrumentationNames2["DOM_WINDOW_CLOSE"] = "DOMWindow.close";
  InstrumentationNames2["DOCUMENT_WRITE"] = "Document.write";
  InstrumentationNames2["AUDIO_CONTEXT_CREATED"] = "audioContextCreated";
  InstrumentationNames2["AUDIO_CONTEXT_CLOSED"] = "audioContextClosed";
  InstrumentationNames2["AUDIO_CONTEXT_RESUMED"] = "audioContextResumed";
  InstrumentationNames2["AUDIO_CONTEXT_SUSPENDED"] = "audioContextSuspended";
  return InstrumentationNames2;
})(InstrumentationNames || {});
export class EventBreakpointsModel extends SDKModel {
  agent;
  constructor(target) {
    super(target);
    this.agent = target.eventBreakpointsAgent();
  }
}
class EventListenerBreakpoint extends CategorizedBreakpoint {
  setEnabled(enabled) {
    if (this.enabled() === enabled) {
      return;
    }
    super.setEnabled(enabled);
    for (const model of TargetManager.instance().models(EventBreakpointsModel)) {
      this.updateOnModel(model);
    }
  }
  updateOnModel(model) {
    if (this.enabled()) {
      void model.agent.invoke_setInstrumentationBreakpoint({ eventName: this.name });
    } else {
      void model.agent.invoke_removeInstrumentationBreakpoint({ eventName: this.name });
    }
  }
  static instrumentationPrefix = "instrumentation:";
}
let eventBreakpointManagerInstance;
export class EventBreakpointsManager {
  #eventListenerBreakpoints = [];
  constructor() {
    this.createInstrumentationBreakpoints(Category.AUCTION_WORKLET, [
      "beforeBidderWorkletBiddingStart" /* BEFORE_BIDDER_WORKLET_BIDDING_START */,
      "beforeBidderWorkletReportingStart" /* BEFORE_BIDDER_WORKLET_REPORTING_START */,
      "beforeSellerWorkletScoringStart" /* BEFORE_SELLER_WORKLET_SCORING_START */,
      "beforeSellerWorkletReportingStart" /* BEFORE_SELLER_WORKLET_REPORTING_START */
    ]);
    this.createInstrumentationBreakpoints(Category.ANIMATION, [
      "requestAnimationFrame" /* REQUEST_ANIMATION_FRAME */,
      "cancelAnimationFrame" /* CANCEL_ANIMATION_FRAME */,
      "requestAnimationFrame.callback" /* REQUEST_ANIMATION_FRAME_CALLBACK */
    ]);
    this.createInstrumentationBreakpoints(Category.CANVAS, [
      "canvasContextCreated" /* CANVAS_CONTEXT_CREATED */,
      "webglErrorFired" /* WEBGL_ERROR_FIRED */,
      "webglWarningFired" /* WEBGL_WARNING_FIRED */
    ]);
    this.createInstrumentationBreakpoints(Category.GEOLOCATION, [
      "Geolocation.getCurrentPosition" /* GEOLOCATION_GET_CURRENT_POSITION */,
      "Geolocation.watchPosition" /* GEOLOCATION_WATCH_POSITION */
    ]);
    this.createInstrumentationBreakpoints(Category.NOTIFICATION, [
      "Notification.requestPermission" /* NOTIFICATION_REQUEST_PERMISSION */
    ]);
    this.createInstrumentationBreakpoints(Category.PARSE, [
      "Element.setInnerHTML" /* ELEMENT_SET_INNER_HTML */,
      "Document.write" /* DOCUMENT_WRITE */
    ]);
    this.createInstrumentationBreakpoints(Category.SCRIPT, [
      "scriptFirstStatement" /* SCRIPT_FIRST_STATEMENT */,
      "scriptBlockedByCSP" /* SCRIPT_BLOCKED_BY_CSP */
    ]);
    this.createInstrumentationBreakpoints(Category.SHARED_STORAGE_WORKLET, [
      "sharedStorageWorkletScriptFirstStatement" /* SHARED_STORAGE_WORKLET_SCRIPT_FIRST_STATEMENT */
    ]);
    this.createInstrumentationBreakpoints(Category.TIMER, [
      "setTimeout" /* SET_TIMEOUT */,
      "clearTimeout" /* CLEAR_TIMEOUT */,
      "setTimeout.callback" /* SET_TIMEOUT_CALLBACK */,
      "setInterval" /* SET_INTERVAL */,
      "clearInterval" /* CLEAR_INTERVAL */,
      "setInterval.callback" /* SET_INTERVAL_CALLBACK */
    ]);
    this.createInstrumentationBreakpoints(Category.WINDOW, [
      "DOMWindow.close" /* DOM_WINDOW_CLOSE */
    ]);
    this.createInstrumentationBreakpoints(Category.WEB_AUDIO, [
      "audioContextCreated" /* AUDIO_CONTEXT_CREATED */,
      "audioContextClosed" /* AUDIO_CONTEXT_CLOSED */,
      "audioContextResumed" /* AUDIO_CONTEXT_RESUMED */,
      "audioContextSuspended" /* AUDIO_CONTEXT_SUSPENDED */
    ]);
    TargetManager.instance().observeModels(EventBreakpointsModel, this);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!eventBreakpointManagerInstance || forceNew) {
      eventBreakpointManagerInstance = new EventBreakpointsManager();
    }
    return eventBreakpointManagerInstance;
  }
  createInstrumentationBreakpoints(category, instrumentationNames) {
    for (const instrumentationName of instrumentationNames) {
      this.#eventListenerBreakpoints.push(new EventListenerBreakpoint(category, instrumentationName));
    }
  }
  eventListenerBreakpoints() {
    return this.#eventListenerBreakpoints.slice();
  }
  resolveEventListenerBreakpoint({ eventName }) {
    if (!eventName.startsWith(EventListenerBreakpoint.instrumentationPrefix)) {
      return null;
    }
    const instrumentationName = eventName.substring(EventListenerBreakpoint.instrumentationPrefix.length);
    return this.#eventListenerBreakpoints.find((b) => b.name === instrumentationName) || null;
  }
  modelAdded(eventBreakpointModel) {
    for (const breakpoint of this.#eventListenerBreakpoints) {
      if (breakpoint.enabled()) {
        breakpoint.updateOnModel(eventBreakpointModel);
      }
    }
  }
  modelRemoved(_eventBreakpointModel) {
  }
}
SDKModel.register(EventBreakpointsModel, { capabilities: Capability.EVENT_BREAKPOINTS, autostart: false });
//# sourceMappingURL=EventBreakpointsModel.js.map
