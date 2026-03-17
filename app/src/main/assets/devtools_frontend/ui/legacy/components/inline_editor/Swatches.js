"use strict";
import "../../../kit/kit.js";
import { html, render } from "../../../lit/lit.js";
import cssShadowSwatchStyles from "./cssShadowSwatch.css.js";
export class CSSShadowSwatch extends HTMLElement {
  #icon;
  #model;
  constructor(model) {
    super();
    this.#model = model;
    render(
      html`
        <style>${cssShadowSwatchStyles}</style>
        <devtools-icon tabindex=-1 name="shadow" class="shadow-swatch-icon"></devtools-icon>`,
      this,
      { host: this }
    );
    this.#icon = this.querySelector("devtools-icon");
  }
  model() {
    return this.#model;
  }
  iconElement() {
    return this.#icon;
  }
}
customElements.define("css-shadow-swatch", CSSShadowSwatch);
//# sourceMappingURL=Swatches.js.map
