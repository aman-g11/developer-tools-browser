"use strict";
import * as Common from "../../../core/common/common.js";
import * as UI from "../../../ui/legacy/legacy.js";
import { InsightActivated, InsightDeactivated } from "./insights/SidebarInsight.js";
import { SidebarAnnotationsTab } from "./SidebarAnnotationsTab.js";
import { SidebarInsightsTab } from "./SidebarInsightsTab.js";
export class RemoveAnnotation extends Event {
  constructor(removedAnnotation) {
    super(RemoveAnnotation.eventName, { bubbles: true, composed: true });
    this.removedAnnotation = removedAnnotation;
  }
  static eventName = "removeannotation";
}
export class RevealAnnotation extends Event {
  constructor(annotation) {
    super(RevealAnnotation.eventName, { bubbles: true, composed: true });
    this.annotation = annotation;
  }
  static eventName = "revealannotation";
}
export class HoverAnnotation extends Event {
  constructor(annotation) {
    super(HoverAnnotation.eventName, { bubbles: true, composed: true });
    this.annotation = annotation;
  }
  static eventName = "hoverannotation";
}
export class AnnotationHoverOut extends Event {
  static eventName = "annotationhoverout";
  constructor() {
    super(AnnotationHoverOut.eventName, { bubbles: true, composed: true });
  }
}
export var SidebarTabs = /* @__PURE__ */ ((SidebarTabs2) => {
  SidebarTabs2["INSIGHTS"] = "insights";
  SidebarTabs2["ANNOTATIONS"] = "annotations";
  return SidebarTabs2;
})(SidebarTabs || {});
export const DEFAULT_SIDEBAR_TAB = "insights" /* INSIGHTS */;
export const DEFAULT_SIDEBAR_WIDTH_PX = 240;
const MIN_SIDEBAR_WIDTH_PX = 170;
export class SidebarWidget extends UI.Widget.VBox {
  #tabbedPane = new UI.TabbedPane.TabbedPane();
  #insightsView = new InsightsView();
  #annotationsView = new AnnotationsView();
  /**
   * If the user has an Insight open and then they collapse the sidebar, we
   * deactivate that Insight to avoid it showing overlays etc - as the user has
   * hidden the Sidebar & Insight from view. But we store it because when the
   * user pops the sidebar open, we want to re-activate it.
   */
  #insightToRestoreOnOpen = null;
  /**
   * We track if the user has opened the sidebar once. This is used to
   * automatically show the sidebar for new users when they first record or
   * import a trace, but then persist its state (so if they close it, it stays
   * closed).
   */
  #hasOpenedOnce = Common.Settings.Settings.instance().createSetting("timeline-sidebar-opened-at-least-once", false);
  constructor() {
    super();
    this.setMinimumSize(MIN_SIDEBAR_WIDTH_PX, 0);
    this.#tabbedPane.appendTab(
      "insights" /* INSIGHTS */,
      "Insights",
      this.#insightsView,
      void 0,
      void 0,
      false,
      false,
      0,
      "timeline.insights-tab"
    );
    this.#tabbedPane.appendTab(
      "annotations" /* ANNOTATIONS */,
      "Annotations",
      this.#annotationsView,
      void 0,
      void 0,
      false,
      false,
      1,
      "timeline.annotations-tab"
    );
    this.#tabbedPane.selectTab("insights" /* INSIGHTS */);
  }
  wasShown() {
    super.wasShown();
    this.#hasOpenedOnce.set(true);
    this.#tabbedPane.show(this.element);
    this.#updateAnnotationsCountBadge();
    if (this.#insightToRestoreOnOpen) {
      this.element.dispatchEvent(new InsightActivated(
        this.#insightToRestoreOnOpen.model,
        this.#insightToRestoreOnOpen.insightSetKey
      ));
      this.#insightToRestoreOnOpen = null;
    }
    if (this.#tabbedPane.selectedTabId === "insights" /* INSIGHTS */ && this.#tabbedPane.tabIsDisabled("insights" /* INSIGHTS */)) {
      this.#tabbedPane.selectTab("annotations" /* ANNOTATIONS */);
    }
  }
  willHide() {
    super.willHide();
    const currentlyActiveInsight = this.#insightsView.getActiveInsight();
    this.#insightToRestoreOnOpen = currentlyActiveInsight;
    if (currentlyActiveInsight) {
      this.element.dispatchEvent(new InsightDeactivated());
    }
  }
  setAnnotations(updatedAnnotations, annotationEntryToColorMap) {
    this.#annotationsView.setAnnotations(updatedAnnotations, annotationEntryToColorMap);
    this.#updateAnnotationsCountBadge();
  }
  #updateAnnotationsCountBadge() {
    const annotations = this.#annotationsView.deduplicatedAnnotations();
    this.#tabbedPane.setBadge("annotations", annotations.length > 0 ? annotations.length.toString() : null);
  }
  setParsedTrace(parsedTrace) {
    this.#insightsView.setParsedTrace(parsedTrace);
    this.#tabbedPane.setTabEnabled(
      "insights" /* INSIGHTS */,
      Boolean(parsedTrace?.insights && parsedTrace.insights.size > 0)
    );
  }
  setActiveInsight(activeInsight, opts) {
    this.#insightsView.setActiveInsight(activeInsight, opts);
    if (activeInsight) {
      this.#tabbedPane.selectTab("insights" /* INSIGHTS */);
    }
  }
  openInsightsTab() {
    this.#tabbedPane.selectTab("insights" /* INSIGHTS */);
  }
  setActiveInsightSet(insightSetKey) {
    this.#insightsView.setActiveInsightSet(insightSetKey);
  }
  /**
   * True if the sidebar has been visible at least one time. This is persisted
   * to the user settings so it persists across sessions. This is used because
   * we do not force the RPP sidebar open by default; if a user has seen it &
   * then closed it, we will not re-open it automatically. But if a user
   * has never seen it, we want them to see it once to know it exists.
   */
  sidebarHasBeenOpened() {
    return this.#hasOpenedOnce.get();
  }
}
class InsightsView extends UI.Widget.VBox {
  #component = SidebarInsightsTab.createWidgetElement();
  constructor() {
    super();
    this.element.classList.add("sidebar-insights");
    this.element.appendChild(this.#component);
  }
  setParsedTrace(parsedTrace) {
    this.#component.widgetConfig = UI.Widget.widgetConfig(SidebarInsightsTab, { parsedTrace });
  }
  getActiveInsight() {
    const widget = this.#component.getWidget();
    if (widget) {
      return widget.activeInsight;
    }
    return null;
  }
  setActiveInsight(active, opts) {
    const widget = this.#component.getWidget();
    if (!widget) {
      return;
    }
    widget.activeInsight = active;
    if (opts.highlight && active) {
      void widget.updateComplete.then(() => {
        void widget.highlightActiveInsight();
      });
    }
  }
  setActiveInsightSet(insightSetKey) {
    const widget = this.#component.getWidget();
    if (!widget) {
      return;
    }
    widget.setActiveInsightSet(insightSetKey);
  }
}
class AnnotationsView extends UI.Widget.VBox {
  #component = new SidebarAnnotationsTab();
  constructor() {
    super();
    this.element.classList.add("sidebar-annotations");
    this.#component.show(this.element);
  }
  setAnnotations(annotations, annotationEntryToColorMap) {
    this.#component.setData({ annotations, annotationEntryToColorMap });
  }
  /**
   * The component "de-duplicates" annotations to ensure implementation details
   * about how we create pending annotations don't leak into the UI. We expose
   * these here because we use this count to show the number of annotations in
   * the small adorner in the sidebar tab.
   */
  deduplicatedAnnotations() {
    return this.#component.deduplicatedAnnotations();
  }
}
//# sourceMappingURL=Sidebar.js.map
