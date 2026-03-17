"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Platform from "../../../../core/platform/platform.js";
import * as Trace from "../../../../models/trace/trace.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { BaseInsightComponent } from "./BaseInsightComponent.js";
import { Table } from "./Table.js";
const { UIStrings, i18nString, createOverlaysForSubpart } = Trace.Insights.Models.INPBreakdown;
const { html } = Lit;
const { widget } = UI.Widget;
export class INPBreakdown extends BaseInsightComponent {
  internalName = "inp";
  hasAskAiSupport() {
    return this.model?.longestInteractionEvent !== void 0;
  }
  renderContent() {
    const event = this.model?.longestInteractionEvent;
    if (!event) {
      return html`<div class="insight-section">${i18nString(UIStrings.noInteractions)}</div>`;
    }
    const time = (us) => i18n.TimeUtilities.millisToString(Platform.Timing.microSecondsToMilliSeconds(us));
    return html`
      <div class="insight-section">
        ${widget(Table, {
      data: {
        insight: this,
        headers: [i18nString(UIStrings.subpart), i18nString(UIStrings.duration)],
        rows: [
          {
            values: [i18nString(UIStrings.inputDelay), time(event.inputDelay)],
            overlays: createOverlaysForSubpart(event, 0)
          },
          {
            values: [i18nString(UIStrings.processingDuration), time(event.mainThreadHandling)],
            overlays: createOverlaysForSubpart(event, 1)
          },
          {
            values: [i18nString(UIStrings.presentationDelay), time(event.presentationDelay)],
            overlays: createOverlaysForSubpart(event, 2)
          }
        ]
      }
    })}
      </div>`;
  }
}
//# sourceMappingURL=INPBreakdown.js.map
