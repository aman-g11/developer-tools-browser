"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import { html, render } from "../../ui/lit/lit.js";
import { AffectedElementsView } from "./AffectedElementsView.js";
const UIStrings = {
  /**
   * @description Noun for singular or plural number of affected element resource indication in issue view.
   */
  nElements: "{n, plural, =1 {# element} other {# elements}}"
};
const str_ = i18n.i18n.registerUIStrings("panels/issues/AffectedPermissionElementsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class AffectedPermissionElementsView extends AffectedElementsView {
  update() {
    this.clear();
    void this.#appendAffectedElements(this.issue.getPermissionElementIssues());
  }
  getResourceNameWithCount(count) {
    return i18nString(UIStrings.nElements, { n: count });
  }
  async #appendAffectedElements(issues) {
    let count = 0;
    const templates = [];
    for (const issue of issues) {
      for (const element of issue.elements()) {
        count++;
        templates.push(html`<tr>
          ${await this.createElementCell(element, this.issue.getCategory())}
        </tr>`);
      }
    }
    render(html`${templates}`, this.affectedResources);
    this.updateAffectedResourceCount(count);
  }
}
//# sourceMappingURL=AffectedPermissionElementsView.js.map
