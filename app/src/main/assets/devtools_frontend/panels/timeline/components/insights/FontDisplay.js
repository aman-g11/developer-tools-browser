"use strict";
import "./Table.js";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Trace from "../../../../models/trace/trace.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { BaseInsightComponent } from "./BaseInsightComponent.js";
import { eventRef } from "./EventRef.js";
import { createLimitedRows, renderOthersLabel, Table } from "./Table.js";
const { UIStrings, i18nString } = Trace.Insights.Models.FontDisplay;
const { html } = Lit;
const { widget } = UI.Widget;
export class FontDisplay extends BaseInsightComponent {
  internalName = "font-display";
  #overlayForRequest = /* @__PURE__ */ new Map();
  hasAskAiSupport() {
    return true;
  }
  createOverlays() {
    this.#overlayForRequest.clear();
    if (!this.model) {
      return [];
    }
    const overlays = this.model.createOverlays?.();
    if (!overlays) {
      return [];
    }
    for (const overlay of overlays.filter((overlay2) => overlay2.type === "ENTRY_OUTLINE")) {
      this.#overlayForRequest.set(overlay.entry, overlay);
    }
    return overlays;
  }
  mapToRow(font) {
    const overlay = this.#overlayForRequest.get(font.request);
    return {
      values: [
        eventRef(font.request, { text: font.name }),
        i18n.TimeUtilities.millisToString(font.wastedTime)
      ],
      overlays: overlay ? [overlay] : []
    };
  }
  createAggregatedTableRow(remaining) {
    return {
      values: [renderOthersLabel(remaining.length), ""],
      overlays: remaining.map((r) => this.#overlayForRequest.get(r.request)).filter((o) => !!o)
    };
  }
  getEstimatedSavingsTime() {
    return this.model?.metricSavings?.FCP ?? null;
  }
  renderContent() {
    if (!this.model) {
      return Lit.nothing;
    }
    const rows = createLimitedRows(this.model.fonts, this);
    return html`
      <div class="insight-section">
        ${widget(Table, {
      data: {
        insight: this,
        headers: [i18nString(UIStrings.fontColumn), i18nString(UIStrings.wastedTimeColumn)],
        rows
      }
    })}
      </div>`;
  }
}
//# sourceMappingURL=FontDisplay.js.map
