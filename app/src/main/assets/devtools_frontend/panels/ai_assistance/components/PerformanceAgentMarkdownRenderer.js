"use strict";
import * as Common from "../../../core/common/common.js";
import * as SDK from "../../../core/sdk/sdk.js";
import * as Trace from "../../../models/trace/trace.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as PanelsCommon from "../../common/common.js";
import { MarkdownRendererWithCodeBlock } from "./MarkdownRendererWithCodeBlock.js";
const { html } = Lit.StaticHtml;
const { ref, createRef } = Lit.Directives;
export class PerformanceAgentMarkdownRenderer extends MarkdownRendererWithCodeBlock {
  constructor(mainFrameId = "", lookupEvent = () => null) {
    super();
    this.mainFrameId = mainFrameId;
    this.lookupEvent = lookupEvent;
  }
  templateForToken(token) {
    if (token.type === "link" && token.href.startsWith("#")) {
      if (token.href.startsWith("#node-")) {
        const nodeId = Number(token.href.replace("#node-", ""));
        const templateRef = createRef();
        void this.#linkifyNode(nodeId, token.text).then((node) => {
          if (!templateRef.value || !node) {
            return;
          }
          templateRef.value.textContent = "";
          templateRef.value.append(node);
        });
        return html`<span ${ref(templateRef)}>${token.text}</span>`;
      }
      const event = this.lookupEvent(token.href.slice(1));
      if (!event) {
        return html`${token.text}`;
      }
      let label = token.text;
      let title = "";
      if (Trace.Types.Events.isSyntheticNetworkRequest(event)) {
        title = event.args.data.url;
      } else {
        label += ` (${event.name})`;
      }
      return html`<a href="#" draggable=false .title=${title} @click=${(e) => {
        e.stopPropagation();
        void Common.Revealer.reveal(new SDK.TraceObject.RevealableEvent(event));
      }}>${label}</a>`;
    }
    return super.templateForToken(token);
  }
  // Taken from front_end/panels/timeline/components/insights/NodeLink.ts
  // Would be nice to move the above component to somewhere that allows the AI
  // Assistance panel to also use it.
  async #linkifyNode(backendNodeId, label) {
    if (backendNodeId === void 0) {
      return;
    }
    const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    const domModel = target?.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return void 0;
    }
    const domNodesMap = await domModel.pushNodesByBackendIdsToFrontend(/* @__PURE__ */ new Set([backendNodeId]));
    const node = domNodesMap?.get(backendNodeId);
    if (!node) {
      return;
    }
    if (node.frameId() !== this.mainFrameId) {
      return;
    }
    const linkedNode = PanelsCommon.DOMLinkifier.Linkifier.instance().linkify(node, { textContent: label });
    return linkedNode;
  }
}
//# sourceMappingURL=PerformanceAgentMarkdownRenderer.js.map
