"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { LiveAnnouncer } from "./ARIAUtils.js";
import { ToolbarButton } from "./Toolbar.js";
const UIStrings = {
  /**
   * @description Text to close something
   */
  close: "Close",
  /**
   * @description Text announced when the DevTools are undocked
   */
  devtoolsUndocked: "DevTools is undocked",
  /**
   * @description Text announced when the DevTools are docked to the left, right, or bottom of the browser tab
   * @example {bottom} PH1
   */
  devToolsDockedTo: "DevTools is docked to {PH1}"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/DockController.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let dockControllerInstance;
export class DockController extends Common.ObjectWrapper.ObjectWrapper {
  #canDock;
  closeButton;
  currentDockStateSetting;
  lastDockStateSetting;
  #dockSide = void 0;
  constructor(canDock) {
    super();
    this.#canDock = canDock;
    this.closeButton = new ToolbarButton(i18nString(UIStrings.close), "cross");
    this.closeButton.element.setAttribute("jslog", `${VisualLogging.close().track({ click: true })}`);
    this.closeButton.element.classList.add("close-devtools");
    this.closeButton.addEventListener(
      ToolbarButton.Events.CLICK,
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.closeWindow.bind(
        Host.InspectorFrontendHost.InspectorFrontendHostInstance
      )
    );
    this.currentDockStateSetting = Common.Settings.Settings.instance().moduleSetting("currentDockState");
    this.lastDockStateSetting = Common.Settings.Settings.instance().createSetting("last-dock-state", "bottom" /* BOTTOM */);
    if (!canDock) {
      this.#dockSide = "undocked" /* UNDOCKED */;
      this.closeButton.setVisible(false);
      return;
    }
    this.currentDockStateSetting.addChangeListener(this.dockSideChanged, this);
    if (states.indexOf(this.currentDockStateSetting.get()) === -1) {
      this.currentDockStateSetting.set("right" /* RIGHT */);
    }
    if (states.indexOf(this.lastDockStateSetting.get()) === -1) {
      this.currentDockStateSetting.set("bottom" /* BOTTOM */);
    }
  }
  static instance(opts = { forceNew: null, canDock: false }) {
    const { forceNew, canDock } = opts;
    if (!dockControllerInstance || forceNew) {
      dockControllerInstance = new DockController(canDock);
    }
    return dockControllerInstance;
  }
  initialize() {
    if (!this.#canDock) {
      return;
    }
    this.dockSideChanged();
  }
  dockSideChanged() {
    this.setDockSide(this.currentDockStateSetting.get());
  }
  dockSide() {
    return this.#dockSide;
  }
  /**
   * Whether the DevTools can be docked, used to determine if we show docking UI.
   * Set via `Root.Runtime.Runtime.queryParam('can_dock')`. See https://cs.chromium.org/can_dock+f:window
   *
   * Shouldn't be used as a heuristic for target connection state.
   */
  canDock() {
    return this.#canDock;
  }
  isVertical() {
    return this.#dockSide === "right" /* RIGHT */ || this.#dockSide === "left" /* LEFT */;
  }
  setDockSide(dockSide) {
    if (states.indexOf(dockSide) === -1) {
      dockSide = states[0];
    }
    if (this.#dockSide === dockSide) {
      return;
    }
    if (this.#dockSide !== void 0) {
      document.body.classList.remove(this.#dockSide);
    }
    document.body.classList.add(dockSide);
    if (this.#dockSide) {
      this.lastDockStateSetting.set(this.#dockSide);
    }
    const eventData = { from: this.#dockSide, to: dockSide };
    this.dispatchEventToListeners("BeforeDockSideChanged" /* BEFORE_DOCK_SIDE_CHANGED */, eventData);
    console.timeStamp("DockController.setIsDocked");
    this.#dockSide = dockSide;
    this.currentDockStateSetting.set(dockSide);
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.setIsDocked(
      dockSide !== "undocked" /* UNDOCKED */,
      this.setIsDockedResponse.bind(this, eventData)
    );
    this.closeButton.setVisible(this.#dockSide !== "undocked" /* UNDOCKED */);
    this.dispatchEventToListeners("DockSideChanged" /* DOCK_SIDE_CHANGED */, eventData);
  }
  setIsDockedResponse(eventData) {
    this.dispatchEventToListeners("AfterDockSideChanged" /* AFTER_DOCK_SIDE_CHANGED */, eventData);
    this.announceDockLocation();
  }
  toggleDockSide() {
    if (this.lastDockStateSetting.get() === this.currentDockStateSetting.get()) {
      const index = states.indexOf(this.currentDockStateSetting.get()) || 0;
      this.lastDockStateSetting.set(states[(index + 1) % states.length]);
    }
    this.setDockSide(this.lastDockStateSetting.get());
  }
  announceDockLocation() {
    if (this.#dockSide === "undocked" /* UNDOCKED */) {
      LiveAnnouncer.alert(i18nString(UIStrings.devtoolsUndocked));
    } else {
      LiveAnnouncer.alert(i18nString(UIStrings.devToolsDockedTo, { PH1: this.#dockSide || "" }));
    }
  }
}
export var DockState = /* @__PURE__ */ ((DockState2) => {
  DockState2["BOTTOM"] = "bottom";
  DockState2["RIGHT"] = "right";
  DockState2["LEFT"] = "left";
  DockState2["UNDOCKED"] = "undocked";
  return DockState2;
})(DockState || {});
const states = ["right" /* RIGHT */, "bottom" /* BOTTOM */, "left" /* LEFT */, "undocked" /* UNDOCKED */];
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["BEFORE_DOCK_SIDE_CHANGED"] = "BeforeDockSideChanged";
  Events2["DOCK_SIDE_CHANGED"] = "DockSideChanged";
  Events2["AFTER_DOCK_SIDE_CHANGED"] = "AfterDockSideChanged";
  return Events2;
})(Events || {});
export class ToggleDockActionDelegate {
  handleAction(_context, _actionId) {
    DockController.instance().toggleDockSide();
    return true;
  }
}
let closeButtonProviderInstance;
export class CloseButtonProvider {
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!closeButtonProviderInstance || forceNew) {
      closeButtonProviderInstance = new CloseButtonProvider();
    }
    return closeButtonProviderInstance;
  }
  item() {
    return DockController.instance().closeButton;
  }
}
//# sourceMappingURL=DockController.js.map
