"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Trace from "../../../../models/trace/trace.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { BaseInsightComponent } from "./BaseInsightComponent.js";
import { createLimitedRows, renderOthersLabel, Table } from "./Table.js";
const { UIStrings, i18nString, createOverlaysForSummary } = Trace.Insights.Models.ThirdParties;
const { html } = Lit;
const { widget } = UI.Widget;
const MAX_TO_SHOW = 5;
export class ThirdParties extends BaseInsightComponent {
  internalName = "third-parties";
  #mainThreadTimeAggregator = {
    mapToRow: (summary) => ({
      values: [summary.entity.name, i18n.TimeUtilities.millisToString(summary.mainThreadTime)],
      overlays: createOverlaysForSummary(summary)
    }),
    createAggregatedTableRow: (remaining) => {
      const totalMainThreadTime = remaining.reduce((acc, summary) => acc + summary.mainThreadTime, 0);
      return {
        values: [renderOthersLabel(remaining.length), i18n.TimeUtilities.millisToString(totalMainThreadTime)],
        overlays: remaining.flatMap((summary) => createOverlaysForSummary(summary) ?? [])
      };
    }
  };
  #transferSizeAggregator = {
    mapToRow: (summary) => ({
      values: [summary.entity.name, i18n.ByteUtilities.formatBytesToKb(summary.transferSize)],
      overlays: createOverlaysForSummary(summary)
    }),
    createAggregatedTableRow: (remaining) => {
      const totalBytes = remaining.reduce((acc, summary) => acc + summary.transferSize, 0);
      return {
        values: [renderOthersLabel(remaining.length), i18n.ByteUtilities.formatBytesToKb(totalBytes)],
        overlays: remaining.flatMap((summary) => createOverlaysForSummary(summary) ?? [])
      };
    }
  };
  hasAskAiSupport() {
    return true;
  }
  renderContent() {
    if (!this.model) {
      return Lit.nothing;
    }
    let result = this.model.entitySummaries ?? [];
    if (this.model.firstPartyEntity) {
      result = result.filter((s) => s.entity !== this.model?.firstPartyEntity || null);
    }
    if (!result.length) {
      return html`<div class="insight-section">${i18nString(UIStrings.noThirdParties)}</div>`;
    }
    const topTransferSizeEntries = result.toSorted((a, b) => b.transferSize - a.transferSize);
    const topMainThreadTimeEntries = result.toSorted((a, b) => b.mainThreadTime - a.mainThreadTime);
    const sections = [];
    if (topTransferSizeEntries.length) {
      const rows = createLimitedRows(topTransferSizeEntries, this.#transferSizeAggregator, MAX_TO_SHOW);
      sections.push(html`
        <div class="insight-section">
          ${widget(Table, {
        data: {
          insight: this,
          headers: [i18nString(UIStrings.columnThirdParty), i18nString(UIStrings.columnTransferSize)],
          rows
        }
      })}
        </div>
      `);
    }
    if (topMainThreadTimeEntries.length) {
      const rows = createLimitedRows(topMainThreadTimeEntries, this.#mainThreadTimeAggregator, MAX_TO_SHOW);
      sections.push(html`
        <div class="insight-section">
          ${widget(Table, {
        data: {
          insight: this,
          headers: [i18nString(UIStrings.columnThirdParty), i18nString(UIStrings.columnMainThreadTime)],
          rows
        }
      })}
        </div>
      `);
    }
    return html`${sections}`;
  }
}
//# sourceMappingURL=ThirdParties.js.map
