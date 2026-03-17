"use strict";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Buttons from "../../../../ui/components/buttons/buttons.js";
import * as LegacyComponents from "../../../../ui/legacy/components/utils/utils.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import * as PanelsCommon from "../../../common/common.js";
const { html } = Lit;
const { widget } = UI.Widget;
export const DEFAULT_VIEW = (input, output, target) => {
  const {
    relatedNodeEl,
    fallbackUrl,
    fallbackHtmlSnippet,
    fallbackText
  } = input;
  let template;
  if (relatedNodeEl) {
    template = html`<div class='node-link'>${relatedNodeEl}</div>`;
  } else if (fallbackUrl) {
    const MAX_URL_LENGTH = 20;
    const options = {
      tabStop: true,
      showColumnNumber: false,
      inlineFrameIndex: 0,
      maxLength: MAX_URL_LENGTH
    };
    const linkEl = LegacyComponents.Linkifier.Linkifier.linkifyURL(fallbackUrl, options);
    template = html`<div class='node-link'>
      <style>${Buttons.textButtonStyles}</style>
      ${linkEl}
    </div>`;
  } else if (fallbackHtmlSnippet) {
    template = html`<pre style='text-wrap: auto'>${fallbackHtmlSnippet}</pre>`;
  } else if (fallbackText) {
    template = html`<span>${fallbackText}</span>`;
  } else {
    template = Lit.nothing;
  }
  Lit.render(template, target);
};
export class NodeLink extends UI.Widget.Widget {
  #view;
  #backendNodeId;
  #frame;
  #options;
  #fallbackUrl;
  #fallbackHtmlSnippet;
  #fallbackText;
  /**
   * Track the linkified Node for a given backend NodeID to avoid repeated lookups on re-render.
   * Also tracks if we fail to resolve a node, to ensure we don't try on each subsequent re-render.
   */
  #linkifiedNodeForBackendId = /* @__PURE__ */ new Map();
  constructor(element, view = DEFAULT_VIEW) {
    super(element, { useShadowDom: true });
    this.#view = view;
  }
  set data(data) {
    this.#backendNodeId = data.backendNodeId;
    this.#frame = data.frame;
    this.#options = data.options;
    this.#fallbackUrl = data.fallbackUrl;
    this.#fallbackHtmlSnippet = data.fallbackHtmlSnippet;
    this.#fallbackText = data.fallbackText;
    this.requestUpdate();
  }
  async #linkify() {
    if (this.#backendNodeId === void 0) {
      return;
    }
    const fromCache = this.#linkifiedNodeForBackendId.get(this.#backendNodeId);
    if (fromCache) {
      if (fromCache === "NO_NODE_FOUND") {
        return void 0;
      }
      return fromCache;
    }
    const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    const domModel = target?.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return void 0;
    }
    const domNodesMap = await domModel.pushNodesByBackendIdsToFrontend(/* @__PURE__ */ new Set([this.#backendNodeId]));
    const node = domNodesMap?.get(this.#backendNodeId);
    if (!node) {
      this.#linkifiedNodeForBackendId.set(this.#backendNodeId, "NO_NODE_FOUND");
      return;
    }
    if (node.frameId() !== this.#frame) {
      this.#linkifiedNodeForBackendId.set(this.#backendNodeId, "NO_NODE_FOUND");
      return;
    }
    const linkedNode = PanelsCommon.DOMLinkifier.Linkifier.instance().linkify(node, this.#options);
    this.#linkifiedNodeForBackendId.set(this.#backendNodeId, linkedNode);
    return linkedNode;
  }
  async performUpdate() {
    const input = {
      relatedNodeEl: await this.#linkify(),
      fallbackUrl: this.#fallbackUrl,
      fallbackHtmlSnippet: this.#fallbackHtmlSnippet,
      fallbackText: this.#fallbackText
    };
    this.#view(input, void 0, this.contentElement);
  }
}
export function nodeLink(data) {
  return html`${widget(NodeLink, { data })}`;
}
//# sourceMappingURL=NodeLink.js.map
