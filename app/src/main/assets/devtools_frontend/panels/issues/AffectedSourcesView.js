"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { AffectedResourcesView } from "./AffectedResourcesView.js";
const UIStrings = {
  /**
   * @description Singular or Plural label for number of affected sources (consisting of (source) file name + line number) in issue view
   */
  nSources: "{n, plural, =1 {# source} other {# sources}}"
};
const str_ = i18n.i18n.registerUIStrings("panels/issues/AffectedSourcesView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class AffectedSourcesView extends AffectedResourcesView {
  #appendAffectedSources(affectedSources) {
    let count = 0;
    for (const source of affectedSources) {
      this.#appendAffectedSource(source);
      count++;
    }
    this.updateAffectedResourceCount(count);
  }
  getResourceNameWithCount(count) {
    return i18nString(UIStrings.nSources, { n: count });
  }
  #appendAffectedSource({ url, lineNumber, columnNumber }) {
    const cellElement = document.createElement("td");
    const linkifierURLOptions = { columnNumber, lineNumber, tabStop: true, showColumnNumber: false, inlineFrameIndex: 0 };
    const anchorElement = Components.Linkifier.Linkifier.linkifyURL(url, linkifierURLOptions);
    anchorElement.setAttribute("jslog", `${VisualLogging.link("source-location").track({ click: true })}`);
    cellElement.appendChild(anchorElement);
    const rowElement = document.createElement("tr");
    rowElement.classList.add("affected-resource-source");
    rowElement.appendChild(cellElement);
    this.affectedResources.appendChild(rowElement);
  }
  update() {
    this.clear();
    this.#appendAffectedSources(this.issue.sources());
  }
}
//# sourceMappingURL=AffectedSourcesView.js.map
