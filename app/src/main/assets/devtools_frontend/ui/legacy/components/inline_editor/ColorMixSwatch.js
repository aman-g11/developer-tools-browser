"use strict";
import * as Common from "../../../../core/common/common.js";
import * as Platform from "../../../../core/platform/platform.js";
import * as Lit from "../../../lit/lit.js";
import * as VisualLogging from "../../../visual_logging/visual_logging.js";
import colorMixSwatchStyles from "./colorMixSwatch.css.js";
const { html, render, Directives: { ref } } = Lit;
export class ColorMixChangedEvent extends Event {
  static eventName = "colormixchanged";
  data;
  constructor(text) {
    super(ColorMixChangedEvent.eventName, {});
    this.data = { text };
  }
}
export class ColorMixSwatch extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });
  colorMixText = "";
  // color-mix(in srgb, hotpink, white)
  firstColorText = "";
  // hotpink
  secondColorText = "";
  // white
  #icon = null;
  mixedColor() {
    const colorText = this.#icon?.computedStyleMap().get("color")?.toString() ?? null;
    return colorText ? Common.Color.parse(colorText) : null;
  }
  setFirstColor(text) {
    if (this.firstColorText) {
      this.colorMixText = this.colorMixText.replace(this.firstColorText, text);
    }
    this.firstColorText = text;
    this.dispatchEvent(new ColorMixChangedEvent(this.colorMixText));
    this.#render();
  }
  setSecondColor(text) {
    if (this.secondColorText) {
      this.colorMixText = Platform.StringUtilities.replaceLast(this.colorMixText, this.secondColorText, text);
    }
    this.secondColorText = text;
    this.dispatchEvent(new ColorMixChangedEvent(this.colorMixText));
    this.#render();
  }
  setColorMixText(text) {
    this.colorMixText = text;
    this.dispatchEvent(new ColorMixChangedEvent(this.colorMixText));
    this.#render();
  }
  getText() {
    return this.colorMixText;
  }
  #render() {
    if (!this.colorMixText || !this.firstColorText || !this.secondColorText) {
      render(this.colorMixText, this.shadow, { host: this });
      return;
    }
    render(
      html`<style>${colorMixSwatchStyles}</style><div class="swatch-icon"
      ${ref((e) => {
        this.#icon = e;
      })}
      jslog=${VisualLogging.cssColorMix()}
      style="--color: ${this.colorMixText}">
        <span class="swatch swatch-left" id="swatch-1" style="--color: ${this.firstColorText}"></span>
        <span class="swatch swatch-right" id="swatch-2" style="--color: ${this.secondColorText}"></span>
        <span class="swatch swatch-mix" id="mix-result" style="--color: ${this.colorMixText}"></span></div>`,
      this.shadow,
      { host: this }
    );
  }
}
customElements.define("devtools-color-mix-swatch", ColorMixSwatch);
//# sourceMappingURL=ColorMixSwatch.js.map
