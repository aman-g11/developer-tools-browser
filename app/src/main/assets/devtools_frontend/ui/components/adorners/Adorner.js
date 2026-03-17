"use strict";
import { html, render } from "../../../ui/lit/lit.js";
import * as UI from "../../legacy/legacy.js";
import adornerStyles from "./adorner.css.js";
export class Adorner extends HTMLElement {
  name = "";
  #shadow = this.attachShadow({ mode: "open" });
  #isToggle = false;
  cloneNode(deep) {
    const node = UI.UIUtils.cloneCustomElement(this, deep);
    node.name = this.name;
    node.#isToggle = this.#isToggle;
    return node;
  }
  connectedCallback() {
    if (!this.getAttribute("aria-label")) {
      this.setAttribute("aria-label", this.name);
    }
    this.#render();
  }
  static observedAttributes = ["active", "toggleable"];
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    switch (name) {
      case "active":
        this.#toggle(newValue === "true");
        break;
      case "toggleable":
        this.#isToggle = newValue === "true";
        this.#toggle(this.getAttribute("active") === "true");
        break;
    }
  }
  isActive() {
    return this.getAttribute("aria-pressed") === "true";
  }
  /**
   * Toggle the active state of the adorner. Optionally pass `true` to force-set
   * an active state; pass `false` to force-set an inactive state.
   */
  #toggle(forceActiveState) {
    if (!this.#isToggle) {
      return;
    }
    const shouldBecomeActive = forceActiveState === void 0 ? !this.isActive() : forceActiveState;
    this.setAttribute("role", "button");
    this.setAttribute("aria-pressed", Boolean(shouldBecomeActive).toString());
  }
  show() {
    this.classList.remove("hidden");
  }
  hide() {
    this.classList.add("hidden");
  }
  #render() {
    render(html`<style>${adornerStyles}</style><slot></slot>`, this.#shadow, { host: this });
  }
}
customElements.define("devtools-adorner", Adorner);
//# sourceMappingURL=Adorner.js.map
