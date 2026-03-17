"use strict";
import * as Lit from "../../../ui/lit/lit.js";
import nodeTextStyles from "./nodeText.css.js";
const { render, html } = Lit;
export class NodeText extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #nodeTitle = "";
  #nodeId = "";
  #nodeClasses = [];
  set data(data) {
    this.#nodeTitle = data.nodeTitle;
    this.#nodeId = data.nodeId;
    this.#nodeClasses = data.nodeClasses;
    this.#render();
  }
  #render() {
    const hasId = Boolean(this.#nodeId);
    const hasNodeClasses = Boolean(this.#nodeClasses && this.#nodeClasses.length > 0);
    const parts = [
      html`<span class="node-label-name">${this.#nodeTitle}</span>`
    ];
    if (this.#nodeId) {
      const classes = Lit.Directives.classMap({
        "node-label-id": true,
        "node-multiple-descriptors": hasNodeClasses
      });
      parts.push(html`<span class=${classes}>#${CSS.escape(this.#nodeId)}</span>`);
    }
    if (this.#nodeClasses && this.#nodeClasses.length > 0) {
      const text = this.#nodeClasses.map((c) => `.${CSS.escape(c)}`).join("");
      const classes = Lit.Directives.classMap({
        "node-label-class": true,
        "node-multiple-descriptors": hasId
      });
      parts.push(html`<span class=${classes}>${text}</span>`);
    }
    render(html`
      <style>${nodeTextStyles}</style>
      ${parts}
    `, this.#shadow, {
      host: this
    });
  }
}
customElements.define("devtools-node-text", NodeText);
//# sourceMappingURL=NodeText.js.map
