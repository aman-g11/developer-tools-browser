"use strict";
import * as Lit from "../../../lit/lit.js";
import cssAngleSwatchStyles from "./cssAngleSwatch.css.js";
import { AngleUnit, get2DTranslationsForAngle } from "./CSSAngleUtils.js";
const { render, html } = Lit;
const styleMap = Lit.Directives.styleMap;
const swatchWidth = 11;
export class CSSAngleSwatch extends HTMLElement {
  shadow = this.attachShadow({ mode: "open" });
  angle = {
    value: 0,
    unit: AngleUnit.RAD
  };
  set data(data) {
    this.angle = data.angle;
    this.render();
  }
  render() {
    const { translateX, translateY } = get2DTranslationsForAngle(this.angle, swatchWidth / 4);
    const miniHandStyle = {
      transform: `translate(${translateX}px, ${translateY}px) rotate(${this.angle.value}${this.angle.unit})`
    };
    render(html`
      <style>${cssAngleSwatchStyles}</style>
      <div class="swatch">
        <span class="mini-hand" style=${styleMap(miniHandStyle)}></span>
      </div>
    `, this.shadow, {
      host: this
    });
  }
}
customElements.define("devtools-css-angle-swatch", CSSAngleSwatch);
//# sourceMappingURL=CSSAngleSwatch.js.map
