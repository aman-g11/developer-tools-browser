"use strict";
import { html, render } from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import elementsPanelLinkStyles from "./elementsPanelLink.css.js";
export class ElementsPanelLink extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #onElementRevealIconClick = () => {
  };
  #onElementRevealIconMouseEnter = () => {
  };
  #onElementRevealIconMouseLeave = () => {
  };
  set data(data) {
    this.#onElementRevealIconClick = data.onElementRevealIconClick;
    this.#onElementRevealIconMouseEnter = data.onElementRevealIconMouseEnter;
    this.#onElementRevealIconMouseLeave = data.onElementRevealIconMouseLeave;
    this.#update();
  }
  #update() {
    this.#render();
  }
  #render() {
    render(html`
      <style>${elementsPanelLinkStyles}</style>
      <span
        class="element-reveal-icon"
        jslog=${VisualLogging.link("elements-panel").track({ click: true })}
        @click=${this.#onElementRevealIconClick}
        @mouseenter=${this.#onElementRevealIconMouseEnter}
        @mouseleave=${this.#onElementRevealIconMouseLeave}></span>
      `, this.#shadow, { host: this });
  }
}
customElements.define("devtools-elements-panel-link", ElementsPanelLink);
//# sourceMappingURL=ElementsPanelLink.js.map
