"use strict";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { BaseInsightComponent } from "./BaseInsightComponent.js";
import { Checklist } from "./Checklist.js";
const { html } = Lit;
const { widget } = UI.Widget;
export class CharacterSet extends BaseInsightComponent {
  internalName = "character-set";
  hasAskAiSupport() {
    return true;
  }
  getEstimatedSavingsTime() {
    return this.model?.metricSavings?.FCP ?? null;
  }
  renderContent() {
    if (!this.model?.data) {
      return Lit.nothing;
    }
    return html`${widget(Checklist, { checklist: this.model.data.checklist })}`;
  }
}
//# sourceMappingURL=CharacterSet.js.map
