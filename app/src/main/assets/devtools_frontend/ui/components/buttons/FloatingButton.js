"use strict";
import "../../kit/kit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import * as Lit from "../../lit/lit.js";
import floatingButtonStyles from "./floatingButton.css.js";
const { html, Directives: { classMap } } = Lit;
export class FloatingButton extends HTMLElement {
  static observedAttributes = ["icon-name", "jslogcontext"];
  #shadow = this.attachShadow({ mode: "open" });
  constructor() {
    super();
    this.role = "presentation";
    this.#render();
  }
  /**
   * Yields the value of the `"icon-name"` attribute of this `FloatingButton`
   * (`null` in case there's no `"icon-name"` on this element).
   */
  get iconName() {
    return this.getAttribute("icon-name");
  }
  /**
   * Changes the value of the `"icon-name"` attribute of this `FloatingButton`.
   * If you pass `null`, the `"icon-name"` attribute will be removed from this
   * element.
   *
   * @param the new icon name or `null` to unset.
   */
  set iconName(iconName) {
    if (iconName === null) {
      this.removeAttribute("icon-name");
    } else {
      this.setAttribute("icon-name", iconName);
    }
  }
  get jslogContext() {
    return this.getAttribute("jslogcontext");
  }
  set jslogContext(jslogContext) {
    if (jslogContext === null) {
      this.removeAttribute("jslogcontext");
    } else {
      this.setAttribute("jslogcontext", jslogContext);
    }
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) {
      return;
    }
    if (name === "icon-name") {
      this.#render();
    }
    if (name === "jslogcontext") {
      this.#updateJslog();
    }
  }
  #render() {
    const classes = classMap({
      gemini: this.iconName === "spark"
    });
    Lit.render(
      html`
        <style>${floatingButtonStyles}</style>
        <button class=${classes}><devtools-icon .name=${this.iconName}></devtools-icon></button>`,
      this.#shadow,
      { host: this }
    );
  }
  #updateJslog() {
    if (this.jslogContext) {
      this.setAttribute("jslog", `${VisualLogging.action().track({ click: true }).context(this.jslogContext)}`);
    } else {
      this.removeAttribute("jslog");
    }
  }
}
export const create = (iconName, title, jslogContext) => {
  const floatingButton = new FloatingButton();
  floatingButton.iconName = iconName;
  floatingButton.title = title;
  if (jslogContext) {
    floatingButton.jslogContext = jslogContext;
  }
  return floatingButton;
};
customElements.define("devtools-floating-button", FloatingButton);
//# sourceMappingURL=FloatingButton.js.map
