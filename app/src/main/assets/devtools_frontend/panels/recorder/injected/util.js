"use strict";
export function assert(condition) {
  if (!condition) {
    throw new Error("Assertion failed!");
  }
}
export const haultImmediateEvent = (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
};
export const getMouseEventOffsets = (event, target) => {
  const rect = target.getBoundingClientRect();
  return { offsetX: event.clientX - rect.x, offsetY: event.clientY - rect.y };
};
export const getClickableTargetFromEvent = (event) => {
  for (const element of event.composedPath()) {
    if (!(element instanceof Element)) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      continue;
    }
    return element;
  }
  throw new Error(`No target is found in event of type ${event.type}`);
};
export const createClickAttributes = (event, target) => {
  let deviceType;
  if (event instanceof PointerEvent) {
    switch (event.pointerType) {
      case "mouse":
        break;
      case "pen":
      case "touch":
        deviceType = event.pointerType;
        break;
      default:
        return;
    }
  }
  const { offsetX, offsetY } = getMouseEventOffsets(event, target);
  if (offsetX < 0 || offsetY < 0) {
    return;
  }
  return {
    button: ["auxiliary", "secondary", "back", "forward"][event.button - 1],
    deviceType,
    offsetX,
    offsetY
  };
};
//# sourceMappingURL=util.js.map
