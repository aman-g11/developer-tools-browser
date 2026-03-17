"use strict";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as EmulationModel from "../../models/emulation/emulation.js";
import * as UI from "../../ui/legacy/legacy.js";
import { DeviceModeView } from "./DeviceModeView.js";
let deviceModeWrapperInstance;
export class DeviceModeWrapper extends UI.Widget.VBox {
  inspectedPagePlaceholder;
  deviceModeView;
  toggleDeviceModeAction;
  showDeviceModeSetting;
  constructor(inspectedPagePlaceholder) {
    super();
    this.inspectedPagePlaceholder = inspectedPagePlaceholder;
    this.deviceModeView = null;
    this.toggleDeviceModeAction = UI.ActionRegistry.ActionRegistry.instance().getAction("emulation.toggle-device-mode");
    const model = EmulationModel.DeviceModeModel.DeviceModeModel.instance();
    this.showDeviceModeSetting = model.enabledSetting();
    this.showDeviceModeSetting.setRequiresUserAction(Boolean(Root.Runtime.Runtime.queryParam("hasOtherClients")));
    this.showDeviceModeSetting.addChangeListener(this.update.bind(this, false));
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.OverlayModel.OverlayModel,
      SDK.OverlayModel.Events.SCREENSHOT_REQUESTED,
      this.screenshotRequestedFromOverlay,
      this
    );
    this.update(true);
  }
  static instance(opts = { forceNew: null, inspectedPagePlaceholder: null }) {
    const { forceNew, inspectedPagePlaceholder } = opts;
    if (!deviceModeWrapperInstance || forceNew) {
      if (!inspectedPagePlaceholder) {
        throw new Error(
          `Unable to create DeviceModeWrapper: inspectedPagePlaceholder must be provided: ${new Error().stack}`
        );
      }
      deviceModeWrapperInstance = new DeviceModeWrapper(inspectedPagePlaceholder);
    }
    return deviceModeWrapperInstance;
  }
  toggleDeviceMode() {
    this.showDeviceModeSetting.set(!this.showDeviceModeSetting.get());
  }
  isDeviceModeOn() {
    return this.showDeviceModeSetting.get();
  }
  captureScreenshot(fullSize, clip) {
    if (!this.deviceModeView) {
      this.deviceModeView = new DeviceModeView();
    }
    this.deviceModeView.setNonEmulatedAvailableSize(this.inspectedPagePlaceholder.element);
    if (fullSize) {
      void this.deviceModeView.captureFullSizeScreenshot();
    } else if (clip) {
      void this.deviceModeView.captureAreaScreenshot(clip);
    } else {
      void this.deviceModeView.captureScreenshot();
    }
    return true;
  }
  screenshotRequestedFromOverlay(event) {
    const clip = event.data;
    this.captureScreenshot(false, clip);
  }
  update(force) {
    this.toggleDeviceModeAction.setToggled(this.showDeviceModeSetting.get());
    const shouldShow = this.showDeviceModeSetting.get();
    if (!force && shouldShow === this.deviceModeView?.isShowing()) {
      return;
    }
    if (shouldShow) {
      if (!this.deviceModeView) {
        this.deviceModeView = new DeviceModeView();
      }
      this.deviceModeView.show(this.element);
      this.inspectedPagePlaceholder.clearMinimumSize();
      this.inspectedPagePlaceholder.show(this.deviceModeView.element);
    } else {
      if (this.deviceModeView) {
        this.deviceModeView.exitHingeMode();
        this.deviceModeView.detach();
      }
      this.inspectedPagePlaceholder.restoreMinimumSize();
      this.inspectedPagePlaceholder.show(this.element);
    }
  }
}
export class ActionDelegate {
  handleAction(context, actionId) {
    switch (actionId) {
      case "emulation.capture-screenshot":
        return DeviceModeWrapper.instance().captureScreenshot();
      case "emulation.capture-node-screenshot": {
        const node = context.flavor(SDK.DOMModel.DOMNode);
        if (!node) {
          return true;
        }
        async function captureClip() {
          if (!node) {
            return;
          }
          const object = await node.resolveToObject();
          if (!object) {
            return;
          }
          const nodeBoxModel = await node.boxModel();
          if (!nodeBoxModel) {
            throw new Error(`Unable to get box model of the node: ${new Error().stack}`);
          }
          const nodeBorderQuad = nodeBoxModel.border;
          const metrics = await node.domModel().target().pageAgent().invoke_getLayoutMetrics();
          if (metrics.getError()) {
            throw new Error(`Unable to get metrics: ${new Error().stack}`);
          }
          const scrollX = metrics.cssVisualViewport.pageX;
          const scrollY = metrics.cssVisualViewport.pageY;
          const { x: oopifOffsetX, y: oopifOffsetY } = await getOopifOffset(node.domModel().target());
          const clip = {
            x: oopifOffsetX + scrollX + nodeBorderQuad[0],
            y: oopifOffsetY + scrollY + nodeBorderQuad[1],
            width: nodeBoxModel.width,
            height: nodeBoxModel.height,
            scale: 1
          };
          const zoom = metrics.cssVisualViewport.zoom ?? 1;
          clip.x *= zoom;
          clip.y *= zoom;
          clip.width *= zoom;
          clip.height *= zoom;
          DeviceModeWrapper.instance().captureScreenshot(false, clip);
        }
        void captureClip();
        return true;
      }
      case "emulation.capture-full-height-screenshot":
        return DeviceModeWrapper.instance().captureScreenshot(true);
      case "emulation.toggle-device-mode":
        DeviceModeWrapper.instance().toggleDeviceMode();
        return true;
    }
    return false;
  }
}
async function getOopifOffset(target) {
  if (!target) {
    return { x: 0, y: 0 };
  }
  const parentTarget = target.parentTarget();
  if (!parentTarget || parentTarget.type() !== SDK.Target.Type.FRAME) {
    return { x: 0, y: 0 };
  }
  const frameId = target.model(SDK.ResourceTreeModel.ResourceTreeModel)?.mainFrame?.id;
  if (!frameId) {
    return { x: 0, y: 0 };
  }
  const parentDOMModel = parentTarget.model(SDK.DOMModel.DOMModel);
  if (!parentDOMModel) {
    return { x: 0, y: 0 };
  }
  const frameOwnerDeferred = await parentDOMModel.getOwnerNodeForFrame(frameId);
  const frameOwner = await frameOwnerDeferred?.resolvePromise();
  if (!frameOwner) {
    return { x: 0, y: 0 };
  }
  const boxModel = await frameOwner.boxModel();
  if (!boxModel) {
    return { x: 0, y: 0 };
  }
  const contentQuad = boxModel.content;
  const iframeContentX = contentQuad[0];
  const iframeContentY = contentQuad[1];
  const parentMetrics = await parentTarget.pageAgent().invoke_getLayoutMetrics();
  if (parentMetrics.getError()) {
    return { x: 0, y: 0 };
  }
  const scrollX = parentMetrics.cssVisualViewport.pageX;
  const scrollY = parentMetrics.cssVisualViewport.pageY;
  const parentOffset = await getOopifOffset(parentTarget);
  return {
    x: iframeContentX + scrollX + parentOffset.x,
    y: iframeContentY + scrollY + parentOffset.y
  };
}
//# sourceMappingURL=DeviceModeWrapper.js.map
