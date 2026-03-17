"use strict";
import * as Common from "../../../core/common/common.js";
import * as Platform from "../../../core/platform/platform.js";
import * as AiAssistanceModel from "../../../models/ai_assistance/ai_assistance.js";
import * as Logs from "../../../models/logs/logs.js";
import * as MarkdownView from "../../../ui/components/markdown_view/markdown_view.js";
import * as Lit from "../../../ui/lit/lit.js";
const { html } = Lit;
export class MarkdownRendererWithCodeBlock extends MarkdownView.MarkdownView.MarkdownInsightRenderer {
  #revealableLink(revealable, label) {
    return html`<devtools-link @click=${(e) => {
      e.preventDefault();
      e.stopPropagation();
      void Common.Revealer.reveal(revealable);
    }}>${Platform.StringUtilities.trimEndWithMaxLength(label, 100)}</devtools-link>`;
  }
  #renderLink(href, fallbackText) {
    if (href.startsWith("#req-")) {
      const request = Logs.NetworkLog.NetworkLog.instance().requests().find(
        (req) => req.requestId() === href.substring(5)
      );
      if (request) {
        return this.#revealableLink(request, request.url());
      }
      return html`${fallbackText}`;
    }
    if (href.startsWith("#file-")) {
      const file = AiAssistanceModel.ContextSelectionAgent.ContextSelectionAgent.getUISourceCodes().find(
        (file2) => AiAssistanceModel.ContextSelectionAgent.ContextSelectionAgent.uiSourceCodeId.get(file2) === Number(href.substring(6))
      );
      if (file) {
        return this.#revealableLink(file, file.name());
      }
      return html`${fallbackText}`;
    }
    return null;
  }
  templateForToken(token) {
    if (token.type === "link") {
      const link = this.#renderLink(token.href, token.text);
      if (link) {
        return link;
      }
    }
    if (token.type === "code") {
      const lines = token.text.split("\n");
      if (lines[0]?.trim() === "css") {
        token.lang = "css";
        token.text = lines.slice(1).join("\n");
      }
    }
    if (token.type === "codespan") {
      const matches = token.text.match(/^\[(.*)\]\((.+)\)$/);
      if (matches?.[2]) {
        const link = this.#renderLink(
          matches[2],
          matches[1]
        );
        if (link) {
          return link;
        }
      }
    }
    return super.templateForToken(token);
  }
}
//# sourceMappingURL=MarkdownRendererWithCodeBlock.js.map
