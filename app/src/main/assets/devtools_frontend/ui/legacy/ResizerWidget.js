"use strict";
import * as Common from "../../core/common/common.js";
import { elementDragStart } from "./UIUtils.js";
export class ResizerWidget extends Common.ObjectWrapper.ObjectWrapper {
  #isEnabled = true;
  #elements = /* @__PURE__ */ new Set();
  #installDragOnMouseDownBound;
  #cursor = "nwse-resize";
  #startX;
  #startY;
  constructor() {
    super();
    this.#installDragOnMouseDownBound = this.#installDragOnMouseDown.bind(this);
  }
  isEnabled() {
    return this.#isEnabled;
  }
  setEnabled(enabled) {
    this.#isEnabled = enabled;
    this.updateElementCursors();
  }
  elements() {
    return [...this.#elements];
  }
  addElement(element) {
    if (!this.#elements.has(element)) {
      this.#elements.add(element);
      element.addEventListener("pointerdown", this.#installDragOnMouseDownBound, false);
      this.#updateElementCursor(element);
    }
  }
  removeElement(element) {
    if (this.#elements.has(element)) {
      this.#elements.delete(element);
      element.removeEventListener("pointerdown", this.#installDragOnMouseDownBound, false);
      element.style.removeProperty("cursor");
    }
  }
  updateElementCursors() {
    this.#elements.forEach(this.#updateElementCursor.bind(this));
  }
  #updateElementCursor(element) {
    if (this.#isEnabled) {
      element.style.setProperty("cursor", this.cursor());
      element.style.setProperty("touch-action", "none");
    } else {
      element.style.removeProperty("cursor");
      element.style.removeProperty("touch-action");
    }
  }
  cursor() {
    return this.#cursor;
  }
  setCursor(cursor) {
    this.#cursor = cursor;
    this.updateElementCursors();
  }
  #installDragOnMouseDown(event) {
    const element = event.target;
    if (!this.#elements.has(element)) {
      return false;
    }
    elementDragStart(element, this.#dragStart.bind(this), (event2) => {
      this.#drag(event2);
    }, this.#dragEnd.bind(this), this.cursor(), event);
    return void 0;
  }
  #dragStart(event) {
    if (!this.#isEnabled) {
      return false;
    }
    this.#startX = event.pageX;
    this.#startY = event.pageY;
    this.sendDragStart(this.#startX, this.#startY);
    return true;
  }
  sendDragStart(x, y) {
    this.dispatchEventToListeners("ResizeStart" /* RESIZE_START */, { startX: x, currentX: x, startY: y, currentY: y });
  }
  #drag(event) {
    if (!this.#isEnabled) {
      this.#dragEnd(event);
      return true;
    }
    this.sendDragMove(this.#startX, event.pageX, this.#startY, event.pageY, event.shiftKey);
    event.preventDefault();
    return false;
  }
  sendDragMove(startX, currentX, startY, currentY, shiftKey) {
    this.dispatchEventToListeners("ResizeUpdateXY" /* RESIZE_UPDATE_XY */, { startX, currentX, startY, currentY, shiftKey });
  }
  #dragEnd(_event) {
    this.dispatchEventToListeners("ResizeEnd" /* RESIZE_END */);
    this.#startX = void 0;
    this.#startY = void 0;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["RESIZE_START"] = "ResizeStart";
  Events2["RESIZE_UPDATE_XY"] = "ResizeUpdateXY";
  Events2["RESIZE_UPDATE_POSITION"] = "ResizeUpdatePosition";
  Events2["RESIZE_END"] = "ResizeEnd";
  return Events2;
})(Events || {});
export class SimpleResizerWidget extends ResizerWidget {
  #isVertical = true;
  isVertical() {
    return this.#isVertical;
  }
  /**
   * Vertical widget resizes height (along y-axis).
   */
  setVertical(vertical) {
    this.#isVertical = vertical;
    this.updateElementCursors();
  }
  cursor() {
    return this.#isVertical ? "ns-resize" : "ew-resize";
  }
  sendDragStart(x, y) {
    const position = this.#isVertical ? y : x;
    this.dispatchEventToListeners("ResizeStart" /* RESIZE_START */, { startPosition: position, currentPosition: position });
  }
  sendDragMove(startX, currentX, startY, currentY, shiftKey) {
    if (this.#isVertical) {
      this.dispatchEventToListeners(
        "ResizeUpdatePosition" /* RESIZE_UPDATE_POSITION */,
        { startPosition: startY, currentPosition: currentY, shiftKey }
      );
    } else {
      this.dispatchEventToListeners(
        "ResizeUpdatePosition" /* RESIZE_UPDATE_POSITION */,
        { startPosition: startX, currentPosition: currentX, shiftKey }
      );
    }
  }
}
//# sourceMappingURL=ResizerWidget.js.map
