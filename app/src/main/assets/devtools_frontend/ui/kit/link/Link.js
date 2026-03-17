"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as UIHelpers from "../../helpers/helpers.js";
import { html, render } from "../../lit/lit.js";
import * as VisualLogging from "../../visual_logging/visual_logging.js";
import linkStyles from "./link.css.js";
export class Link extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  static observedAttributes = ["href", "jslogcontext"];
  connectedCallback() {
    if (!this.hasAttribute("tabindex")) {
      this.setAttribute("tabindex", "0");
    }
    this.#setDefaultTitle();
    this.#onJslogContextChange();
    this.setAttribute("role", "link");
    this.setAttribute("target", "_blank");
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeyDown);
    this.#render();
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeyDown);
  }
  #handleOpeningLink(event) {
    const href = this.href;
    if (!href) {
      return;
    }
    UIHelpers.openInNewTab(href);
    event.consume();
  }
  get href() {
    return this.getAttribute("href");
  }
  set href(href) {
    this.setAttribute("href", href);
  }
  get jslogContext() {
    return this.getAttribute("jslogcontext");
  }
  set jslogContext(jslogContext) {
    this.setAttribute("jslogcontext", jslogContext);
  }
  #onJslogContextChange() {
    const jslogContext = this.jslogContext ?? void 0;
    const jslog = VisualLogging.link().track({ click: true, keydown: "Enter|Space" }).context(jslogContext);
    this.setAttribute("jslog", jslog.toString());
  }
  #setDefaultTitle() {
    if (!this.hasAttribute("title") && this.href) {
      this.setAttribute("title", this.href);
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      return;
    }
    if (name === "jslogcontext") {
      return this.#onJslogContextChange();
    }
    if (name === "href") {
      this.#setDefaultTitle();
    }
    this.#render();
  }
  #onClick = (event) => {
    this.#handleOpeningLink(event);
  };
  #onKeyDown = (event) => {
    if (Platform.KeyboardUtilities.isEnterOrSpaceKey(event)) {
      this.#handleOpeningLink(event);
    }
  };
  #render() {
    render(
      html`<style>
          ${linkStyles}
        </style><slot></slot>`,
      this.#shadow,
      { host: this }
    );
  }
  /**
   * Should be used only by old code relying on imperative API,
   * which we are activly migrating away from.
   * @deprecated
   */
  static create(url, linkText, className, jsLogContext, tabindex = 0) {
    const link = new Link();
    link.href = url;
    linkText = linkText ?? url;
    link.textContent = Platform.StringUtilities.trimMiddle(linkText, 150);
    const classes = className ? `${className} devtools-link` : "devtools-link";
    link.setAttribute("class", classes);
    if (jsLogContext) {
      link.setAttribute("jslogcontext", jsLogContext);
    }
    if (tabindex !== 0) {
      link.setAttribute("tabindex", String(tabindex));
    }
    return link;
  }
}
customElements.define("devtools-link", Link);
//# sourceMappingURL=Link.js.map
