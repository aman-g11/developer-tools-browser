"use strict";
import "../../../../ui/components/markdown_view/markdown_view.js";
import * as Trace from "../../../../models/trace/trace.js";
import * as Marked from "../../../../third_party/marked/marked.js";
import * as Lit from "../../../../ui/lit/lit.js";
const { html } = Lit;
export function shouldRenderForCategory(options) {
  return options.activeCategory === Trace.Insights.Types.InsightCategory.ALL || options.activeCategory === options.insightCategory;
}
export function md(markdown) {
  const tokens = Marked.Marked.lexer(markdown);
  const data = { tokens };
  return html`<devtools-markdown-view .data=${data}></devtools-markdown-view>`;
}
//# sourceMappingURL=Helpers.js.map
