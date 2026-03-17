"use strict";
import "../../ui/components/adorners/adorners.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as IssuesManager from "../../models/issues_manager/issues_manager.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
import { html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
const UIStrings = {
  /**
   * @description Title for the hidden issues row
   */
  hiddenIssues: "Hidden issues",
  /**
   * @description Label for the button to unhide all hidden issues
   */
  unhideAll: "Unhide all"
};
const str_ = i18n.i18n.registerUIStrings("panels/issues/HiddenIssuesRow.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const DEFAULT_VIEW = (input, _output, target) => {
  const stopPropagationForEnter = (event) => {
    if (event.key === "Enter") {
      event.stopImmediatePropagation();
    }
  };
  render(html`
  <div class="header">
    <devtools-adorner class="aggregated-issues-count" .name=${"countWrapper"}>
      <span>${input.count}</span>
    </devtools-adorner>
    <div class="title">${i18nString(UIStrings.hiddenIssues)}</div>
    <devtools-button class="unhide-all-issues-button"
                     jslog=${VisualLogging.action().track({ click: true }).context("issues.unhide-all-hiddes")}
                     @click=${input.onUnhideAllIssues}
                     @keydown=${stopPropagationForEnter}
                     .variant=${Buttons.Button.Variant.OUTLINED}>${i18nString(UIStrings.unhideAll)}</devtools-button>
  </div>`, target);
};
export class HiddenIssuesRow extends UI.TreeOutline.TreeElement {
  #view;
  constructor(view = DEFAULT_VIEW) {
    super(void 0, true, "hidden-issues");
    this.#view = view;
    this.toggleOnClick = true;
    this.listItemElement.classList.add("issue-category", "hidden-issues");
    this.childrenListElement.classList.add("hidden-issues-body");
    this.update(0);
  }
  update(count) {
    const issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
    const onUnhideAllIssues = issuesManager.unhideAllIssues.bind(issuesManager);
    const input = {
      count,
      onUnhideAllIssues
    };
    const output = void 0;
    this.#view(input, output, this.listItemElement);
  }
}
//# sourceMappingURL=HiddenIssuesRow.js.map
