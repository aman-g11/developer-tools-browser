"use strict";
import { html, render } from "../../lit/lit.js";
import spinnerStyles from "./spinner.css.js";
export class Spinner extends HTMLElement {
  static observedAttributes = ["active"];
  #shadow = this.attachShadow({ mode: "open" });
  constructor(props) {
    super();
    this.active = props?.active ?? true;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (name === "active") {
      this.#render();
    }
  }
  /**
   * Returns whether the spinner is active or not.
   */
  get active() {
    return this.hasAttribute("active");
  }
  /**
   * Sets the `"active"` attribute for the spinner.
   */
  set active(active) {
    this.toggleAttribute("active", active);
  }
  connectedCallback() {
    this.#render();
  }
  #render() {
    const content = this.active ? html`
      <div class="indeterminate-spinner">
        <div class="left-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
        <div class="center-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
        <div class="right-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50%" cy="50%" r="2.75rem"></circle></svg>
        </div>
      </div>
    ` : html`
      <div class="inactive-spinner">
        <svg viewBox="0 0 100 100">
          <circle cx="50%" cy="50%" r="2.75rem"></circle>
        </svg>
      </div>
    `;
    render(html`
      <style>
        ${spinnerStyles}
      </style>
      ${content}
    `, this.#shadow, { host: this });
  }
}
customElements.define("devtools-spinner", Spinner);
//# sourceMappingURL=Spinner.js.map
