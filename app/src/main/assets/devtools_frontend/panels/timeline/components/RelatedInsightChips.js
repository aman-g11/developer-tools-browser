"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import relatedInsightsStyles from "./relatedInsightChips.css.js";
const { html, render } = Lit;
const UIStrings = {
  /**
   * @description prefix shown next to related insight chips
   */
  insightKeyword: "Insight",
  /**
   * @description Prefix shown next to related insight chips and containing the insight name.
   * @example {Improve image delivery} PH1
   */
  insightWithName: "Insight: {PH1}"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/RelatedInsightChips.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class RelatedInsightChips extends UI.Widget.Widget {
  #view;
  #activeEvent = null;
  #eventToInsightsMap = /* @__PURE__ */ new Map();
  constructor(element, view = DEFAULT_VIEW) {
    super(element);
    this.#view = view;
  }
  set activeEvent(event) {
    if (event === this.#activeEvent) {
      return;
    }
    this.#activeEvent = event;
    this.requestUpdate();
  }
  set eventToInsightsMap(map) {
    this.#eventToInsightsMap = map ?? /* @__PURE__ */ new Map();
    this.requestUpdate();
  }
  performUpdate() {
    const input = {
      activeEvent: this.#activeEvent,
      eventToInsightsMap: this.#eventToInsightsMap,
      onInsightClick(insight) {
        insight.activateInsight();
      }
    };
    this.#view(input, {}, this.contentElement);
  }
}
export const DEFAULT_VIEW = (input, _output, target) => {
  const { activeEvent, eventToInsightsMap } = input;
  const relatedInsights = activeEvent ? eventToInsightsMap.get(activeEvent) ?? [] : [];
  if (!activeEvent || eventToInsightsMap.size === 0 || relatedInsights.length === 0) {
    render(Lit.nothing, target);
    return;
  }
  const insightMessages = relatedInsights.flatMap((insight) => {
    return insight.messages.map((message) => html`
          <li class="insight-message-box">
            <button type="button" @click=${(event) => {
      event.preventDefault();
      input.onInsightClick(insight);
    }}>
              <div class="insight-label">${i18nString(UIStrings.insightWithName, {
      PH1: insight.insightLabel
    })}</div>
              <div class="insight-message">${message}</div>
            </button>
          </li>
        `);
  });
  const insightChips = relatedInsights.flatMap((insight) => {
    return [html`
          <li class="insight-chip">
            <button type="button" @click=${(event) => {
      event.preventDefault();
      input.onInsightClick(insight);
    }}>
              <span class="keyword">${i18nString(UIStrings.insightKeyword)}</span>
              <span class="insight-label">${insight.insightLabel}</span>
            </button>
          </li>
        `];
  });
  render(
    html`<style>${relatedInsightsStyles}</style>
        <ul>${insightMessages}</ul>
        <ul>${insightChips}</ul>`,
    target
  );
};
//# sourceMappingURL=RelatedInsightChips.js.map
