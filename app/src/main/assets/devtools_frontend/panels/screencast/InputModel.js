"use strict";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
const BUTTONS = [
  Protocol.Input.MouseButton.Left,
  Protocol.Input.MouseButton.Middle,
  Protocol.Input.MouseButton.Right,
  Protocol.Input.MouseButton.Back,
  Protocol.Input.MouseButton.Forward
];
const MOUSE_EVENT_TYPES = {
  mousedown: Protocol.Input.DispatchMouseEventRequestType.MousePressed,
  mouseup: Protocol.Input.DispatchMouseEventRequestType.MouseReleased,
  mousemove: Protocol.Input.DispatchMouseEventRequestType.MouseMoved
};
export class InputModel extends SDK.SDKModel.SDKModel {
  inputAgent;
  activeMouseOffsetTop;
  constructor(target) {
    super(target);
    this.inputAgent = target.inputAgent();
    this.activeMouseOffsetTop = null;
  }
  emitKeyEvent(event) {
    let type;
    switch (event.type) {
      case "keydown":
        type = Protocol.Input.DispatchKeyEventRequestType.KeyDown;
        break;
      case "keyup":
        type = Protocol.Input.DispatchKeyEventRequestType.KeyUp;
        break;
      case "keypress":
        type = Protocol.Input.DispatchKeyEventRequestType.Char;
        break;
      default:
        return;
    }
    const text = event.type === "keypress" ? String.fromCharCode(event.charCode) : void 0;
    void this.inputAgent.invoke_dispatchKeyEvent({
      type,
      modifiers: this.modifiersForEvent(event),
      text,
      unmodifiedText: text ? text.toLowerCase() : void 0,
      keyIdentifier: event.keyIdentifier,
      code: event.code,
      key: event.key,
      windowsVirtualKeyCode: event.keyCode,
      nativeVirtualKeyCode: event.keyCode,
      autoRepeat: event.repeat,
      isKeypad: event.location === 3,
      isSystemKey: false,
      location: event.location !== 3 ? event.location : void 0
    });
  }
  emitMouseEvent(event, offsetTop, zoom) {
    if (!(event.type in MOUSE_EVENT_TYPES)) {
      return;
    }
    if (event.type === "mousedown" || this.activeMouseOffsetTop === null) {
      this.activeMouseOffsetTop = offsetTop;
    }
    void this.inputAgent.invoke_dispatchMouseEvent({
      type: MOUSE_EVENT_TYPES[event.type],
      x: Math.round(event.offsetX / zoom),
      y: Math.round(event.offsetY / zoom - this.activeMouseOffsetTop),
      modifiers: this.modifiersForEvent(event),
      button: BUTTONS[event.button],
      clickCount: event.detail
    });
    if (event.type === "mouseup") {
      this.activeMouseOffsetTop = null;
    }
  }
  emitWheelEvent(event, offsetTop, zoom) {
    if (this.activeMouseOffsetTop === null) {
      this.activeMouseOffsetTop = offsetTop;
    }
    void this.inputAgent.invoke_dispatchMouseEvent({
      type: Protocol.Input.DispatchMouseEventRequestType.MouseWheel,
      x: Math.round(event.offsetX / zoom),
      y: Math.round(event.offsetY / zoom - this.activeMouseOffsetTop),
      modifiers: this.modifiersForEvent(event),
      button: BUTTONS[event.button],
      clickCount: event.detail,
      deltaX: event.deltaX / zoom,
      deltaY: event.deltaY / zoom
    });
  }
  modifiersForEvent(event) {
    return Number(event.getModifierState("Alt")) | Number(event.getModifierState("Control")) << 1 | Number(event.getModifierState("Meta")) << 2 | Number(event.getModifierState("Shift")) << 3;
  }
}
SDK.SDKModel.SDKModel.register(InputModel, {
  capabilities: SDK.Target.Capability.INPUT,
  autostart: false
});
//# sourceMappingURL=InputModel.js.map
