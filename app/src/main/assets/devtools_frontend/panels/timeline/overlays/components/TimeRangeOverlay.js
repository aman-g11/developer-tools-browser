"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Platform from "../../../../core/platform/platform.js";
import { html, render } from "../../../../ui/lit/lit.js";
import * as VisualLogging from "../../../../ui/visual_logging/visual_logging.js";
import timeRangeOverlayStyles from "./timeRangeOverlay.css.js";
const UIStrings = {
  /**
   * @description Accessible label used to explain to a user that they are viewing an entry label.
   */
  timeRange: "Time range"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/overlays/components/TimeRangeOverlay.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class TimeRangeLabelChangeEvent extends Event {
  constructor(newLabel) {
    super(TimeRangeLabelChangeEvent.eventName);
    this.newLabel = newLabel;
  }
  static eventName = "timerangelabelchange";
}
export class TimeRangeRemoveEvent extends Event {
  static eventName = "timerangeremoveevent";
  constructor() {
    super(TimeRangeRemoveEvent.eventName);
  }
}
export class TimeRangeOverlay extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #duration = null;
  #canvasRect = null;
  #label;
  // The label is set to editable and in focus anytime the label is empty and when the label it is double clicked.
  // If the user clicks away from the selected range element and the label is not empty, the label is set to not editable until it is double clicked.
  #isLabelEditable = true;
  #rangeContainer = null;
  #labelBox = null;
  constructor(initialLabel) {
    super();
    this.#render();
    this.#rangeContainer = this.#shadow.querySelector(".range-container");
    this.#labelBox = this.#rangeContainer?.querySelector(".label-text") ?? null;
    this.#label = initialLabel;
    if (!this.#labelBox) {
      console.error("`labelBox` element is missing.");
      return;
    }
    this.#labelBox.innerText = initialLabel;
    if (initialLabel) {
      this.#labelBox?.setAttribute("aria-label", initialLabel);
      this.#setLabelEditability(false);
    }
  }
  set canvasRect(rect) {
    if (rect === null) {
      return;
    }
    if (this.#canvasRect && this.#canvasRect.width === rect.width && this.#canvasRect.height === rect.height) {
      return;
    }
    this.#canvasRect = rect;
    this.#render();
  }
  set duration(duration) {
    if (duration === this.#duration) {
      return;
    }
    this.#duration = duration;
    this.#render();
  }
  /**
   * This calculates how much of the time range is in the user's view. This is
   * used to determine how much of the label can fit into the view, and if we
   * should even show the label.
   */
  #visibleOverlayWidth(overlayRect) {
    if (!this.#canvasRect) {
      return 0;
    }
    const { x: overlayStartX, width } = overlayRect;
    const overlayEndX = overlayStartX + width;
    const canvasStartX = this.#canvasRect.x;
    const canvasEndX = this.#canvasRect.x + this.#canvasRect.width;
    const leftVisible = Math.max(canvasStartX, overlayStartX);
    const rightVisible = Math.min(canvasEndX, overlayEndX);
    return rightVisible - leftVisible;
  }
  /**
   * We use this method after the overlay has been positioned in order to move
   * the label as required to keep it on screen.
   * If the label is off to the left or right, we fix it to that corner and
   * align the text so the label is visible as long as possible.
   */
  updateLabelPositioning() {
    if (!this.#rangeContainer) {
      return;
    }
    if (!this.#canvasRect || !this.#labelBox) {
      return;
    }
    const paddingForScrollbar = 9;
    const overlayRect = this.getBoundingClientRect();
    const labelFocused = this.#shadow.activeElement === this.#labelBox;
    const labelRect = this.#rangeContainer.getBoundingClientRect();
    const visibleOverlayWidth = this.#visibleOverlayWidth(overlayRect) - paddingForScrollbar;
    const durationBox = this.#rangeContainer.querySelector(".duration") ?? null;
    const durationBoxLength = durationBox?.getBoundingClientRect().width;
    if (!durationBoxLength) {
      return;
    }
    const overlayTooNarrow = visibleOverlayWidth <= durationBoxLength;
    const hideLabel = overlayTooNarrow && !labelFocused && this.#label.length > 0;
    this.#rangeContainer.classList.toggle("labelHidden", hideLabel);
    if (hideLabel) {
      return;
    }
    const labelLeftMarginToCenter = (overlayRect.width - labelRect.width) / 2;
    const newLabelX = overlayRect.x + labelLeftMarginToCenter;
    const labelOffLeftOfScreen = newLabelX < this.#canvasRect.x;
    this.#rangeContainer.classList.toggle("offScreenLeft", labelOffLeftOfScreen);
    const rightBound = this.#canvasRect.x + this.#canvasRect.width;
    const labelRightEdge = overlayRect.x + labelLeftMarginToCenter + labelRect.width;
    const labelOffRightOfScreen = labelRightEdge > rightBound;
    this.#rangeContainer.classList.toggle("offScreenRight", labelOffRightOfScreen);
    if (labelOffLeftOfScreen) {
      this.#rangeContainer.style.marginLeft = `${Math.abs(this.#canvasRect.x - overlayRect.x) + paddingForScrollbar}px`;
    } else if (labelOffRightOfScreen) {
      this.#rangeContainer.style.marginRight = `${overlayRect.right - this.#canvasRect.right + paddingForScrollbar}px`;
    } else {
      this.#rangeContainer.style.margin = "0px";
    }
    if (this.#labelBox?.innerText === "") {
      this.#setLabelEditability(true);
    }
  }
  #focusInputBox() {
    if (!this.#labelBox) {
      console.error("`labelBox` element is missing.");
      return;
    }
    this.#labelBox.focus();
  }
  #setLabelEditability(editable) {
    if (this.#labelBox?.innerText === "") {
      this.#focusInputBox();
      return;
    }
    this.#isLabelEditable = editable;
    this.#render();
    if (editable) {
      this.#focusInputBox();
    }
  }
  #handleLabelInputKeyUp() {
    const labelBoxTextContent = this.#labelBox?.textContent ?? "";
    if (labelBoxTextContent !== this.#label) {
      this.#label = labelBoxTextContent;
      this.dispatchEvent(new TimeRangeLabelChangeEvent(this.#label));
      this.#labelBox?.setAttribute("aria-label", labelBoxTextContent);
    }
  }
  #handleLabelInputKeyDown(event) {
    if (event.key === Platform.KeyboardUtilities.ENTER_KEY || event.key === Platform.KeyboardUtilities.ESCAPE_KEY) {
      event.stopPropagation();
      if (this.#label === "") {
        this.dispatchEvent(new TimeRangeRemoveEvent());
      }
      this.#labelBox?.blur();
      return false;
    }
    return true;
  }
  #render() {
    const durationText = this.#duration ? i18n.TimeUtilities.formatMicroSecondsTime(this.#duration) : "";
    render(
      html`
          <style>${timeRangeOverlayStyles}</style>
          <span class="range-container" role="region" aria-label=${i18nString(UIStrings.timeRange)}>
            <span
             class="label-text"
             role="textbox"
             @focusout=${() => this.#setLabelEditability(false)}
             @dblclick=${() => this.#setLabelEditability(true)}
             @keydown=${this.#handleLabelInputKeyDown}
             @keyup=${this.#handleLabelInputKeyUp}
             contenteditable=${this.#isLabelEditable ? "plaintext-only" : false}
             jslog=${VisualLogging.textField("timeline.annotations.time-range-label-input").track({ keydown: true, click: true })}
            ></span>
            <span class="duration">${durationText}</span>
          </span>
          `,
      this.#shadow,
      { host: this }
    );
    this.updateLabelPositioning();
  }
}
customElements.define("devtools-time-range-overlay", TimeRangeOverlay);
//# sourceMappingURL=TimeRangeOverlay.js.map
