"use strict";
import { html, nothing, render } from "../../lit/lit.js";
import cardStyles from "./card.css.js";
export class Card extends HTMLElement {
  static observedAttributes = ["heading"];
  #shadow = this.attachShadow({ mode: "open" });
  constructor() {
    super();
    this.#render();
  }
  /**
   * Yields the value of the `"heading"` attribute of this `Card`.
   *
   * @returns the value of the `"heading"` attribute or `null` if the attribute
   *          is absent.
   */
  get heading() {
    return this.getAttribute("heading");
  }
  /**
   * Changes the value of the `"heading"` attribute of this `Card`. If you pass
   * `null`, the `"heading"` attribute will be removed from this element.
   *
   * @param heading the new heading of `null` to unset.
   */
  set heading(heading) {
    if (heading) {
      this.setAttribute("heading", heading);
    } else {
      this.removeAttribute("heading");
    }
  }
  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.#render();
    }
  }
  #render() {
    render(
      html`
        <style>${cardStyles}</style>
        <div id="card">
          <div id="heading">
            <slot name="heading-prefix"></slot>
            <div role="heading" aria-level="2">${this.heading ?? nothing}</div>
            <slot name="heading-suffix"></slot>
          </div>
          <slot id="content"></slot>
        </div>`,
      this.#shadow,
      { host: this }
    );
  }
}
customElements.define("devtools-card", Card);
//# sourceMappingURL=Card.js.map
