"use strict";
import * as Annotations from "../../models/annotations/annotations.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import { html, nothing, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import annotationStyles from "./annotation.css.js";
const LABEL_AND_CONNECTOR_SHIFT_LENGTH = 8;
const LABEL_CONNECTOR_HEIGHT = 7;
export const DEFAULT_VIEW = (input, _, target) => {
  const { inputText: label, isExpanded, anchored, expandable, showCloseButton, clickHandler, closeHandler } = input;
  const connectorColor = ThemeSupport.ThemeSupport.instance().getComputedValue("--color-text-primary");
  const overlayStyles = [
    anchored ? "left: 17px; top: 11px;" : "",
    !expandable ? "pointer-events: none;" : ""
  ].join(" ");
  render(html`
    <style>${annotationStyles}</style>
    ${anchored ? html`
      <svg class="connectorContainer"
        width=${LABEL_AND_CONNECTOR_SHIFT_LENGTH * 2}
        height=${LABEL_CONNECTOR_HEIGHT}>
        <line
          x1=${LABEL_AND_CONNECTOR_SHIFT_LENGTH}
          y1=0
          x2=${LABEL_AND_CONNECTOR_SHIFT_LENGTH * 2}
          y2=${LABEL_CONNECTOR_HEIGHT}
          stroke=${connectorColor}
          stroke-width=2
        />
        <circle
          cx=${LABEL_AND_CONNECTOR_SHIFT_LENGTH}
          cy=0
          r=3
          fill=${connectorColor}
        />
      </svg>
    ` : nothing}
    <div class='overlay' style=${overlayStyles} @click=${expandable ? clickHandler : null}>
      ${isExpanded ? label : "!"}
    </div>
    ${showCloseButton ? html`<svg @click=${closeHandler} class="close-button" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="7.5" fill="#EEE" stroke="#888"/>
          <path d="M5 5L11 11M5 11L11 5" stroke="#888" stroke-width="2"/>
        </svg>` : nothing}
    `, target);
};
export class Annotation extends UI.Widget.Widget {
  #view;
  #id;
  #inputText;
  #x = 0;
  #y = 0;
  #isExpanded = false;
  #hasShown = false;
  #anchored = false;
  #expandable = false;
  #showCloseButton = false;
  constructor(id, label, showExpanded, anchored, expandable, showCloseButton, view = DEFAULT_VIEW) {
    super({ jslog: `${VisualLogging.panel("annotation").track({ resize: true })}`, useShadowDom: true });
    this.#id = id;
    this.#view = view;
    this.#isExpanded = showExpanded;
    this.#inputText = label;
    this.#anchored = anchored;
    this.#expandable = expandable;
    this.#showCloseButton = showCloseButton;
  }
  #toggle() {
    this.#isExpanded = !this.#isExpanded;
    this.requestUpdate();
  }
  #closeHandler() {
    this.hide();
    Annotations.AnnotationRepository.instance().deleteAnnotation(this.#id);
  }
  wasShown() {
    this.element.style.position = "absolute";
    this.element.style.left = `${this.#x}px`;
    this.element.style.top = `${this.#y}px`;
    super.wasShown();
    this.#hasShown = true;
    this.requestUpdate();
  }
  performUpdate() {
    if (!this.isShowing()) {
      return;
    }
    const input = {
      inputText: this.#inputText,
      isExpanded: this.#isExpanded,
      anchored: this.#anchored,
      expandable: this.#expandable,
      showCloseButton: this.#showCloseButton,
      x: this.#x,
      y: this.#y,
      clickHandler: this.#toggle.bind(this),
      closeHandler: this.#closeHandler.bind(this)
    };
    this.#view(input, void 0, this.contentElement);
    if (this.#showCloseButton) {
      const overlay = this.contentElement.querySelector(".overlay");
      const closeButton = this.contentElement.querySelector(".close-button");
      if (overlay && closeButton) {
        const overlayLeft = parseFloat(overlay.style.left || "0");
        const overlayWidth = overlay.getBoundingClientRect().width;
        closeButton.style.left = `${overlayLeft + overlayWidth - 16}px`;
      }
    }
  }
  hide() {
    this.detach();
  }
  getCoordinates() {
    return { x: this.#x, y: this.#y };
  }
  setCoordinates(x, y) {
    this.#x = x;
    this.#y = y;
    if (this.isShowing()) {
      this.element.style.left = `${this.#x}px`;
      this.element.style.top = `${this.#y}px`;
    }
    this.requestUpdate();
  }
  hasShown() {
    return this.#hasShown;
  }
}
//# sourceMappingURL=Annotation.js.map
