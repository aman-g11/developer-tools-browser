"use strict";
import * as Trace from "../../../models/trace/trace.js";
import * as Buttons from "../../../ui/components/buttons/buttons.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as Utils from "../utils/utils.js";
import * as Insights from "./insights/insights.js";
import sidebarInsightsTabStyles from "./sidebarInsightsTab.css.js";
import { SidebarSingleInsightSet } from "./SidebarSingleInsightSet.js";
const { html } = Lit;
const { widgetConfig } = UI.Widget;
export const DEFAULT_VIEW = (input, output, target) => {
  const {
    parsedTrace,
    labels,
    activeInsightSet,
    activeInsight,
    selectedCategory,
    onInsightSetToggled,
    onInsightSetHovered,
    onInsightSetUnhovered,
    onZoomClick
  } = input;
  const insights = parsedTrace.insights;
  if (!insights) {
    return;
  }
  const hasMultipleInsightSets = insights.size > 1;
  Lit.render(html`
    <style>${sidebarInsightsTabStyles}</style>
    <div class="insight-sets-wrapper">
      ${[...insights.values()].map((insightSet, index) => {
    const { id, url } = insightSet;
    const data = {
      insightSetKey: id,
      activeCategory: selectedCategory,
      activeInsight,
      parsedTrace
    };
    const selected = insightSet === activeInsightSet;
    const contents = html`
          <devtools-widget
            data-insight-set-key=${id}
            .widgetConfig=${widgetConfig(SidebarSingleInsightSet, { data })}
          ></devtools-widget>
        `;
    if (hasMultipleInsightSets) {
      return html`<details ?open=${selected}>
            <summary
              @click=${() => onInsightSetToggled(insightSet)}
              @mouseenter=${() => onInsightSetHovered(insightSet)}
              @mouseleave=${() => onInsightSetUnhovered()}
              title=${url.href}>
              ${renderDropdownIcon(selected)}
              <span>${labels[index]}</span>
              <span class='zoom-button'
                @click=${(event) => {
        event.stopPropagation();
        onZoomClick(insightSet);
      }}
              >
                ${renderZoomButton(selected)}
              </span>
            </summary>
            ${contents}
          </details>`;
    }
    return contents;
  })}
    </div>
  `, target);
};
function renderZoomButton(insightSetToggled) {
  const classes = Lit.Directives.classMap({
    "zoom-icon": true,
    active: insightSetToggled
  });
  return html`
  <div class=${classes}>
      <devtools-button .data=${{
    variant: Buttons.Button.Variant.ICON,
    iconName: "center-focus-weak",
    size: Buttons.Button.Size.SMALL
  }}
    ></devtools-button></div>`;
}
function renderDropdownIcon(insightSetToggled) {
  const containerClasses = Lit.Directives.classMap({
    "dropdown-icon": true,
    active: insightSetToggled
  });
  return html`
    <div class=${containerClasses}>
      <devtools-button .data=${{
    variant: Buttons.Button.Variant.ICON,
    iconName: "chevron-right",
    size: Buttons.Button.Size.SMALL
  }}
    ></devtools-button></div>
  `;
}
export class SidebarInsightsTab extends UI.Widget.Widget {
  static createWidgetElement() {
    const widgetElement = document.createElement("devtools-widget");
    return widgetElement;
  }
  #view;
  #parsedTrace = null;
  #activeInsight = null;
  #selectedCategory = Trace.Insights.Types.InsightCategory.ALL;
  /**
   * When a trace has sets of insights, we show an accordion with each
   * set within. A set can be specific to a single navigation, or include the
   * beginning of the trace up to the first navigation.
   * You can only have one of these open at any time.
   */
  #selectedInsightSet = null;
  constructor(element, view = DEFAULT_VIEW) {
    super(element, { useShadowDom: true });
    this.#view = view;
  }
  // TODO(paulirish): add back a disconnectedCallback() to avoid memory leaks that doesn't cause b/372943062
  set parsedTrace(data) {
    if (data === this.#parsedTrace) {
      return;
    }
    this.#parsedTrace = data;
    this.#selectedInsightSet = null;
    if (this.#parsedTrace?.insights) {
      this.#selectedInsightSet = [...this.#parsedTrace.insights.values()].at(0) ?? null;
    }
    this.requestUpdate();
  }
  get activeInsight() {
    return this.#activeInsight;
  }
  set activeInsight(active) {
    if (active === this.#activeInsight) {
      return;
    }
    this.#activeInsight = active;
    if (this.#activeInsight) {
      this.#selectedInsightSet = this.#parsedTrace?.insights?.get(this.#activeInsight.insightSetKey) ?? null;
    }
    this.requestUpdate();
  }
  setActiveInsightSet(insightSetKey) {
    if (this.#parsedTrace?.insights) {
      const insightSet = this.#parsedTrace.insights.get(insightSetKey);
      if (insightSet) {
        this.#selectedInsightSet = insightSet;
        this.requestUpdate();
      }
    }
  }
  #onInsightSetToggled(insightSet) {
    this.#selectedInsightSet = this.#selectedInsightSet === insightSet ? null : insightSet;
    if (this.#selectedInsightSet?.id !== this.#activeInsight?.insightSetKey) {
      this.element.dispatchEvent(new Insights.SidebarInsight.InsightDeactivated());
    }
    this.requestUpdate();
  }
  #onInsightSetHovered(insightSet) {
    this.element.dispatchEvent(new Insights.SidebarInsight.InsightSetHovered(insightSet.bounds));
  }
  #onInsightSetUnhovered() {
    this.element.dispatchEvent(new Insights.SidebarInsight.InsightSetHovered());
  }
  #onZoomClick(insightSet) {
    this.element.dispatchEvent(new Insights.SidebarInsight.InsightSetZoom(insightSet.bounds));
  }
  highlightActiveInsight() {
    if (!this.#activeInsight) {
      return;
    }
    const set = this.element.shadowRoot?.querySelector(
      `[data-insight-set-key="${this.#activeInsight.insightSetKey}"]`
    );
    void set?.getWidget()?.highlightActiveInsight();
  }
  performUpdate() {
    if (!this.#parsedTrace?.insights) {
      return;
    }
    const insightSets = [...this.#parsedTrace.insights.values()];
    const input = {
      parsedTrace: this.#parsedTrace,
      labels: Utils.Helpers.createUrlLabels(insightSets.map(({ url }) => url)),
      activeInsightSet: this.#selectedInsightSet,
      activeInsight: this.#activeInsight,
      selectedCategory: this.#selectedCategory,
      onInsightSetToggled: this.#onInsightSetToggled.bind(this),
      onInsightSetHovered: this.#onInsightSetHovered.bind(this),
      onInsightSetUnhovered: this.#onInsightSetUnhovered.bind(this),
      onZoomClick: this.#onZoomClick.bind(this)
    };
    this.#view(input, void 0, this.contentElement);
  }
}
//# sourceMappingURL=SidebarInsightsTab.js.map
