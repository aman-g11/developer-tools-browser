"use strict";
import "./Table.js";
import "../../../../ui/kit/kit.js";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Trace from "../../../../models/trace/trace.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { BaseInsightComponent } from "./BaseInsightComponent.js";
import { eventRef } from "./EventRef.js";
import { md } from "./Helpers.js";
import networkDependencyTreeInsightStyles from "./networkDependencyTreeInsight.css.js";
import { nodeLink } from "./NodeLink.js";
import { renderOthersLabel, Table } from "./Table.js";
const { UIStrings, i18nString } = Trace.Insights.Models.NetworkDependencyTree;
const { html } = Lit;
const { widget } = UI.Widget;
export const MAX_CHAINS_TO_SHOW = 5;
export class NetworkDependencyTree extends BaseInsightComponent {
  internalName = "long-critical-network-tree";
  #relatedRequests = null;
  #countOfChains = 0;
  hasAskAiSupport() {
    return true;
  }
  #createOverlayForChain(requests) {
    const overlays = [];
    requests.forEach((entry) => overlays.push({
      type: "ENTRY_OUTLINE",
      entry,
      outlineReason: "ERROR"
    }));
    return overlays;
  }
  #renderNetworkTreeRow(node) {
    const requestStyles = Lit.Directives.styleMap({
      display: "flex",
      "--override-timeline-link-text-color": node.isLongest ? "var(--sys-color-error)" : "",
      color: node.isLongest ? "var(--sys-color-error)" : "",
      backgroundColor: this.#relatedRequests?.has(node.request) ? "var(--sys-color-state-hover-on-subtle)" : ""
    });
    const urlStyles = Lit.Directives.styleMap({
      flex: "auto"
    });
    return html`
      <div style=${requestStyles}>
        <span style=${urlStyles}>${eventRef(node.request)}</span>
        <span>
          ${i18n.TimeUtilities.formatMicroSecondsTime(Trace.Types.Timing.Micro(node.timeFromInitialRequest))}
        </span>
      </div>
    `;
  }
  mapNetworkDependencyToRow(node) {
    if (this.#countOfChains >= MAX_CHAINS_TO_SHOW) {
      if (node.children.length === 0) {
        this.#countOfChains++;
      }
      return null;
    }
    if (node.children.length === 0) {
      this.#countOfChains++;
    }
    return {
      values: [this.#renderNetworkTreeRow(node)],
      overlays: this.#createOverlayForChain(node.relatedRequests),
      // Filter out the empty rows otherwise the `Table`component will render a super short row
      subRows: node.children.map((child) => this.mapNetworkDependencyToRow(child)).filter((row) => row !== null)
    };
  }
  #renderNetworkDependencyTree(nodes) {
    if (nodes.length === 0) {
      return null;
    }
    const rows = [{
      // Add one empty row so the main document request can also has a left border
      values: [],
      // Filter out the empty rows otherwise the `Table` component will render a super short row
      subRows: nodes.map((node) => this.mapNetworkDependencyToRow(node)).filter((row) => row !== null)
    }];
    if (this.#countOfChains > MAX_CHAINS_TO_SHOW) {
      rows.push({
        values: [renderOthersLabel(this.#countOfChains - MAX_CHAINS_TO_SHOW)]
      });
    }
    return html`
      ${widget(Table, {
      data: {
        insight: this,
        headers: [i18nString(UIStrings.columnRequest), i18nString(UIStrings.columnTime)],
        rows
      }
    })}`;
  }
  #renderNetworkTreeSection() {
    if (!this.model) {
      return Lit.nothing;
    }
    if (!this.model.rootNodes.length) {
      return html`
        <style>${networkDependencyTreeInsightStyles}</style>
        <div class="insight-section">${i18nString(UIStrings.noNetworkDependencyTree)}</div>
      `;
    }
    return html`
      <style>${networkDependencyTreeInsightStyles}</style>
      <div class="insight-section">
        <div class="max-time">
          ${i18nString(UIStrings.maxCriticalPathLatency)}
          <br>
          <span class='longest'> ${i18n.TimeUtilities.formatMicroSecondsTime(this.model.maxTime)}</span>
        </div>
      </div>
      <div class="insight-section">
        ${this.#renderNetworkDependencyTree(this.model.rootNodes)}
      </div>
    `;
  }
  #renderTooManyPreconnectsWarning() {
    if (!this.model) {
      return Lit.nothing;
    }
    if (this.model.preconnectedOrigins.length <= Trace.Insights.Models.NetworkDependencyTree.TOO_MANY_PRECONNECTS_THRESHOLD) {
      return Lit.nothing;
    }
    const warningStyles = Lit.Directives.styleMap({
      backgroundColor: "var(--sys-color-surface-yellow)",
      padding: " var(--sys-size-5) var(--sys-size-8);",
      display: "flex"
    });
    return html`
      <div style=${warningStyles}>
        ${md(i18nString(UIStrings.tooManyPreconnectLinksWarning))}
      </div>
    `;
  }
  #renderPreconnectOriginsTable() {
    if (!this.model) {
      return Lit.nothing;
    }
    const preconnectOriginsTableTitle = html`
      <style>${networkDependencyTreeInsightStyles}</style>
      <div class='section-title'>${i18nString(UIStrings.preconnectOriginsTableTitle)}</div>
      <div class="insight-description">${md(i18nString(UIStrings.preconnectOriginsTableDescription))}</div>
    `;
    if (!this.model.preconnectedOrigins.length) {
      return html`
        <div class="insight-section">
          ${preconnectOriginsTableTitle}
          ${i18nString(UIStrings.noPreconnectOrigins)}
        </div>
      `;
    }
    const rows = this.model.preconnectedOrigins.map((preconnectOrigin) => {
      const subRows = [];
      if (preconnectOrigin.unused) {
        subRows.push({
          values: [md(i18nString(UIStrings.unusedWarning))]
        });
      }
      if (preconnectOrigin.crossorigin) {
        subRows.push({
          values: [md(i18nString(UIStrings.crossoriginWarning))]
        });
      }
      if (preconnectOrigin.source === "ResponseHeader") {
        return {
          values: [preconnectOrigin.url, eventRef(preconnectOrigin.request, { text: preconnectOrigin.headerText })],
          subRows
        };
      }
      const nodeEl = nodeLink({
        backendNodeId: preconnectOrigin.node_id,
        frame: preconnectOrigin.frame,
        fallbackHtmlSnippet: `<link rel="preconnect" href="${preconnectOrigin.url}">`
      });
      return {
        values: [preconnectOrigin.url, nodeEl],
        subRows
      };
    });
    return html`
      <div class="insight-section">
        ${preconnectOriginsTableTitle}
        ${this.#renderTooManyPreconnectsWarning()}
        ${widget(Table, {
      data: {
        insight: this,
        headers: [i18nString(UIStrings.columnOrigin), i18nString(UIStrings.columnSource)],
        rows
      }
    })}
      </div>
    `;
  }
  #renderEstSavingTable() {
    if (!this.model) {
      return Lit.nothing;
    }
    const estSavingTableTitle = html`
      <style>${networkDependencyTreeInsightStyles}</style>
      <div class='section-title'>${i18nString(UIStrings.estSavingTableTitle)}</div>
      <div class="insight-description">${md(i18nString(UIStrings.estSavingTableDescription))}</div>
    `;
    if (!this.model.preconnectCandidates.length) {
      return html`
        <div class="insight-section">
          ${estSavingTableTitle}
          ${i18nString(UIStrings.noPreconnectCandidates)}
        </div>
      `;
    }
    const rows = this.model.preconnectCandidates.map(
      (candidate) => ({
        values: [candidate.origin, i18n.TimeUtilities.millisToString(candidate.wastedMs)]
      })
    );
    return html`
      <div class="insight-section">
        ${estSavingTableTitle}
        ${widget(Table, {
      data: {
        insight: this,
        headers: [i18nString(UIStrings.columnOrigin), i18nString(UIStrings.columnWastedMs)],
        rows
      }
    })}
      </div>
    `;
  }
  renderContent() {
    return html`
      ${this.#renderNetworkTreeSection()}
      ${this.#renderPreconnectOriginsTable()}
      ${this.#renderEstSavingTable()}
    `;
  }
}
//# sourceMappingURL=NetworkDependencyTree.js.map
