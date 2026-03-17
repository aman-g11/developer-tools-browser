"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Trace from "../../models/trace/trace.js";
import * as TraceBounds from "../../services/trace_bounds/trace_bounds.js";
import * as Tracing from "../../services/tracing/tracing.js";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as UI from "../../ui/legacy/legacy.js";
import { Directives, html, nothing, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as TimelineComponents from "./components/components.js";
import { EventsTimelineTreeView } from "./EventsTimelineTreeView.js";
import { targetForEvent } from "./TargetForEvent.js";
import { ThirdPartyTreeViewWidget } from "./ThirdPartyTreeView.js";
import detailsViewStyles from "./timelineDetailsView.css.js";
import { TimelineLayersView } from "./TimelineLayersView.js";
import { TimelinePaintProfilerView } from "./TimelinePaintProfilerView.js";
import {
  selectionFromRangeMilliSeconds,
  selectionIsEvent,
  selectionIsRange
} from "./TimelineSelection.js";
import { TimelineSelectorStatsView } from "./TimelineSelectorStatsView.js";
import {
  AggregatedTimelineTreeView,
  BottomUpTimelineTreeView,
  CallTreeTimelineTreeView,
  TimelineStackView,
  TimelineTreeView
} from "./TimelineTreeView.js";
import { TimelineUIUtils } from "./TimelineUIUtils.js";
import { TracingFrameLayerTree } from "./TracingLayerTree.js";
const UIStrings = {
  /**
   * @description Text for the summary view
   */
  summary: "Summary",
  /**
   * @description Text in Timeline Details View of the Performance panel
   */
  bottomup: "Bottom-up",
  /**
   * @description Text in Timeline Details View of the Performance panel
   */
  callTree: "Call tree",
  /**
   * @description Text in Timeline Details View of the Performance panel
   */
  eventLog: "Event log",
  /**
   * @description Title of the paint profiler, old name of the performance pane
   */
  paintProfiler: "Paint profiler",
  /**
   * @description Title of the Layers tool
   */
  layers: "Layers",
  /**
   * @description Title of the selector stats tab
   */
  selectorStats: "Selector stats"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/TimelineDetailsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { widget } = UI.Widget;
export class TimelineDetailsPane extends Common.ObjectWrapper.eventMixin(UI.Widget.VBox) {
  detailsLinkifier;
  tabbedPane;
  defaultDetailsWidget;
  #summaryContent = new SummaryView();
  rangeDetailViews;
  #selectedEvents;
  lazyPaintProfilerView;
  lazyLayersView;
  preferredTabId;
  selection;
  updateContentsScheduled;
  lazySelectorStatsView;
  #parsedTrace = null;
  #eventToRelatedInsightsMap = null;
  #onTraceBoundsChangeBound = this.#onTraceBoundsChange.bind(this);
  #thirdPartyTree = new ThirdPartyTreeViewWidget();
  #entityMapper = null;
  constructor(delegate) {
    super();
    this.registerRequiredCSS(detailsViewStyles);
    this.element.classList.add("timeline-details");
    this.detailsLinkifier = new Components.Linkifier.Linkifier();
    this.tabbedPane = new UI.TabbedPane.TabbedPane();
    this.tabbedPane.show(this.element);
    this.tabbedPane.headerElement().setAttribute(
      "jslog",
      `${VisualLogging.toolbar("sidebar").track({ keydown: "ArrowUp|ArrowLeft|ArrowDown|ArrowRight|Enter|Space" })}`
    );
    this.defaultDetailsWidget = new UI.Widget.VBox();
    this.defaultDetailsWidget.element.classList.add("timeline-details-view");
    this.defaultDetailsWidget.element.setAttribute("jslog", `${VisualLogging.pane("details").track({ resize: true })}`);
    this.#summaryContent.contentElement.classList.add("timeline-details-view-body");
    this.#summaryContent.show(this.defaultDetailsWidget.contentElement);
    this.appendTab("details" /* Details */, i18nString(UIStrings.summary), this.defaultDetailsWidget);
    this.setPreferredTab("details" /* Details */);
    this.rangeDetailViews = /* @__PURE__ */ new Map();
    this.updateContentsScheduled = false;
    const bottomUpView = new BottomUpTimelineTreeView();
    this.appendTab("bottom-up" /* BottomUp */, i18nString(UIStrings.bottomup), bottomUpView);
    this.rangeDetailViews.set("bottom-up" /* BottomUp */, bottomUpView);
    const callTreeView = new CallTreeTimelineTreeView();
    this.appendTab("call-tree" /* CallTree */, i18nString(UIStrings.callTree), callTreeView);
    this.rangeDetailViews.set("call-tree" /* CallTree */, callTreeView);
    const eventsView = new EventsTimelineTreeView(delegate);
    this.appendTab("event-log" /* EventLog */, i18nString(UIStrings.eventLog), eventsView);
    this.rangeDetailViews.set("event-log" /* EventLog */, eventsView);
    this.rangeDetailViews.values().forEach((view) => {
      view.addEventListener(
        TimelineTreeView.Events.TREE_ROW_HOVERED,
        (node) => this.dispatchEventToListeners(TimelineTreeView.Events.TREE_ROW_HOVERED, node.data)
      );
      view.addEventListener(TimelineTreeView.Events.TREE_ROW_CLICKED, (node) => {
        this.dispatchEventToListeners(TimelineTreeView.Events.TREE_ROW_CLICKED, node.data);
      });
      if (view instanceof AggregatedTimelineTreeView) {
        view.stackView.addEventListener(
          TimelineStackView.Events.TREE_ROW_HOVERED,
          (node) => this.dispatchEventToListeners(TimelineTreeView.Events.TREE_ROW_HOVERED, { node: node.data })
        );
      }
    });
    this.#thirdPartyTree.addEventListener(TimelineTreeView.Events.TREE_ROW_HOVERED, (node) => {
      this.dispatchEventToListeners(
        TimelineTreeView.Events.TREE_ROW_HOVERED,
        { node: node.data.node, events: node.data.events }
      );
    });
    this.#thirdPartyTree.addEventListener(TimelineTreeView.Events.BOTTOM_UP_BUTTON_CLICKED, (node) => {
      this.selectTab("bottom-up" /* BottomUp */, node.data, AggregatedTimelineTreeView.GroupBy.ThirdParties);
    });
    this.#thirdPartyTree.addEventListener(TimelineTreeView.Events.TREE_ROW_CLICKED, (node) => {
      this.dispatchEventToListeners(
        TimelineTreeView.Events.TREE_ROW_CLICKED,
        { node: node.data.node, events: node.data.events }
      );
    });
    this.tabbedPane.addEventListener(UI.TabbedPane.Events.TabSelected, this.tabSelected, this);
    TraceBounds.TraceBounds.onChange(this.#onTraceBoundsChangeBound);
    this.lazySelectorStatsView = null;
  }
  /**
   * This selects a given tabbedPane tab.
   * Additionally, if provided a node, we open that node and
   * if a groupBySetting is included, we groupBy.
   */
  selectTab(tabName, node, groupBySetting) {
    this.tabbedPane.selectTab(tabName, true, true);
    this.tabbedPane.focusSelectedTabHeader();
    switch (tabName) {
      case "call-tree" /* CallTree */:
      case "event-log" /* EventLog */:
      case "paint-profiler" /* PaintProfiler */:
      case "layer-viewer" /* LayerViewer */:
      case "selector-stats" /* SelectorStats */: {
        break;
      }
      case "details" /* Details */: {
        this.updateContentsFromWindow();
        break;
      }
      case "bottom-up" /* BottomUp */: {
        if (!(this.tabbedPane.visibleView instanceof BottomUpTimelineTreeView)) {
          return;
        }
        const bottomUp = this.tabbedPane.visibleView;
        if (groupBySetting) {
          bottomUp.setGroupBySetting(groupBySetting);
          bottomUp.refreshTree();
        }
        if (!node) {
          return;
        }
        const treeNode = bottomUp.eventToTreeNode.get(node.event);
        if (!treeNode) {
          return;
        }
        bottomUp.selectProfileNode(treeNode, true);
        const gridNode = bottomUp.dataGridNodeForTreeNode(treeNode);
        if (gridNode) {
          gridNode.expand();
        }
        break;
      }
      default: {
        Platform.assertNever(tabName, `Unknown Tab: ${tabName}. Add new case to switch.`);
      }
    }
  }
  selectorStatsView() {
    if (this.lazySelectorStatsView) {
      return this.lazySelectorStatsView;
    }
    this.lazySelectorStatsView = new TimelineSelectorStatsView(
      this.#parsedTrace
    );
    return this.lazySelectorStatsView;
  }
  getDetailsContentElementForTest() {
    return this.#summaryContent.contentElement;
  }
  revealEventInTreeView(event) {
    if (this.tabbedPane.visibleView instanceof TimelineTreeView) {
      this.tabbedPane.visibleView.highlightEventInTree(event);
    }
  }
  async #onTraceBoundsChange(event) {
    if (event.updateType === "MINIMAP_BOUNDS") {
      if (this.selection) {
        await this.setSelection(this.selection);
      }
    }
    if (event.updateType === "RESET" || event.updateType === "VISIBLE_WINDOW") {
      if (!this.selection) {
        this.scheduleUpdateContentsFromWindow();
      }
    }
  }
  async setModel(data) {
    if (this.#parsedTrace !== data.parsedTrace) {
      this.lazySelectorStatsView = null;
      this.#parsedTrace = data.parsedTrace;
    }
    if (data.parsedTrace) {
      this.#summaryContent.filmStrip = Trace.Extras.FilmStrip.fromHandlerData(data.parsedTrace.data);
      this.#entityMapper = new Trace.EntityMapper.EntityMapper(data.parsedTrace);
    }
    this.#selectedEvents = data.selectedEvents;
    this.#eventToRelatedInsightsMap = data.eventToRelatedInsightsMap;
    this.#summaryContent.eventToRelatedInsightsMap = this.#eventToRelatedInsightsMap;
    this.#summaryContent.parsedTrace = this.#parsedTrace;
    this.#summaryContent.entityMapper = this.#entityMapper;
    this.tabbedPane.closeTabs(["paint-profiler" /* PaintProfiler */, "layer-viewer" /* LayerViewer */], false);
    for (const view of this.rangeDetailViews.values()) {
      view.setModelWithEvents(data.selectedEvents, data.parsedTrace, data.entityMapper);
    }
    this.#thirdPartyTree.setModelWithEvents(data.selectedEvents, data.parsedTrace, data.entityMapper);
    this.#summaryContent.requestUpdate();
    this.lazyPaintProfilerView = null;
    this.lazyLayersView = null;
    await this.setSelection(null);
  }
  /**
   * Updates the UI shown in the Summary tab, and updates the UI to select the
   * summary tab.
   */
  async updateSummaryPane() {
    const allTabs = this.tabbedPane.otherTabs("details" /* Details */);
    for (let i = 0; i < allTabs.length; ++i) {
      if (!this.rangeDetailViews.has(allTabs[i])) {
        this.tabbedPane.closeTab(allTabs[i]);
      }
    }
    this.#summaryContent.requestUpdate();
    await this.#summaryContent.updateComplete;
  }
  updateContents() {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      return;
    }
    const visibleWindow = traceBoundsState.milli.timelineTraceWindow;
    const view = this.rangeDetailViews.get(this.tabbedPane.selectedTabId || "");
    if (view) {
      view.updateContents(this.selection || selectionFromRangeMilliSeconds(visibleWindow.min, visibleWindow.max));
    }
  }
  appendTab(id, tabTitle, view, isCloseable) {
    this.tabbedPane.appendTab(id, tabTitle, view, void 0, void 0, isCloseable);
    if (this.preferredTabId !== this.tabbedPane.selectedTabId) {
      this.tabbedPane.selectTab(id);
    }
  }
  headerElement() {
    return this.tabbedPane.headerElement();
  }
  setPreferredTab(tabId) {
    this.preferredTabId = tabId;
  }
  /**
   * This forces a recalculation and rerendering of the timings
   * breakdown of a track.
   * User actions like zooming or scrolling can trigger many updates in
   * short time windows, so we debounce the calls in those cases. Single
   * sporadic calls (like selecting a new track) don't need to be
   * debounced. The forceImmediateUpdate param configures the debouncing
   * behaviour.
   */
  scheduleUpdateContentsFromWindow(forceImmediateUpdate = false) {
    if (!this.#parsedTrace) {
      void this.updateSummaryPane();
      return;
    }
    if (forceImmediateUpdate) {
      this.updateContentsFromWindow();
      return;
    }
    if (!this.updateContentsScheduled) {
      this.updateContentsScheduled = true;
      setTimeout(() => {
        if (!this.updateContentsScheduled) {
          return;
        }
        this.updateContentsScheduled = false;
        this.updateContentsFromWindow();
      }, 100);
    }
  }
  updateContentsFromWindow() {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      return;
    }
    const visibleWindow = traceBoundsState.milli.timelineTraceWindow;
    this.updateSelectedRangeStats(visibleWindow.min, visibleWindow.max);
    this.updateContents();
  }
  #addLayerTreeForSelectedFrame(frame) {
    const target = SDK.TargetManager.TargetManager.instance().rootTarget();
    if (frame.layerTree && target) {
      const layerTreeForFrame = new TracingFrameLayerTree(target, frame.layerTree);
      const layersView = this.layersView();
      layersView.showLayerTree(layerTreeForFrame);
      if (!this.tabbedPane.hasTab("layer-viewer" /* LayerViewer */)) {
        this.appendTab("layer-viewer" /* LayerViewer */, i18nString(UIStrings.layers), layersView);
      }
    }
  }
  async #setSelectionForTraceEvent(event) {
    if (!this.#parsedTrace) {
      return;
    }
    this.#summaryContent.selectedRange = null;
    this.#summaryContent.selectedEvent = event;
    this.#summaryContent.eventToRelatedInsightsMap = this.#eventToRelatedInsightsMap;
    this.#summaryContent.linkifier = this.detailsLinkifier;
    this.#summaryContent.target = targetForEvent(this.#parsedTrace, event);
    await this.updateSummaryPane();
    this.appendExtraDetailsTabsForTraceEvent(event);
  }
  async setSelection(selection) {
    if (!this.#parsedTrace) {
      return;
    }
    this.detailsLinkifier.reset();
    this.selection = selection;
    if (!this.selection) {
      this.#summaryContent.selectedEvent = null;
      this.scheduleUpdateContentsFromWindow(
        /* forceImmediateUpdate */
        true
      );
      return;
    }
    if (selectionIsEvent(selection)) {
      this.updateContentsScheduled = false;
      if (Trace.Types.Events.isLegacyTimelineFrame(selection.event)) {
        this.#addLayerTreeForSelectedFrame(selection.event);
      }
      await this.#setSelectionForTraceEvent(selection.event);
    } else if (selectionIsRange(selection)) {
      const timings = Trace.Helpers.Timing.traceWindowMicroSecondsToMilliSeconds(selection.bounds);
      this.updateSelectedRangeStats(timings.min, timings.max);
    }
    this.updateContents();
  }
  tabSelected(event) {
    if (!event.data.isUserGesture) {
      return;
    }
    this.setPreferredTab(event.data.tabId);
    this.updateContents();
  }
  layersView() {
    if (this.lazyLayersView) {
      return this.lazyLayersView;
    }
    this.lazyLayersView = new TimelineLayersView(this.showSnapshotInPaintProfiler.bind(this));
    return this.lazyLayersView;
  }
  paintProfilerView() {
    if (this.lazyPaintProfilerView) {
      return this.lazyPaintProfilerView;
    }
    if (!this.#parsedTrace) {
      return null;
    }
    this.lazyPaintProfilerView = new TimelinePaintProfilerView(this.#parsedTrace);
    return this.lazyPaintProfilerView;
  }
  showSnapshotInPaintProfiler(snapshot) {
    const paintProfilerView = this.paintProfilerView();
    if (!paintProfilerView) {
      return;
    }
    paintProfilerView.setSnapshot(snapshot);
    if (!this.tabbedPane.hasTab("paint-profiler" /* PaintProfiler */)) {
      this.appendTab("paint-profiler" /* PaintProfiler */, i18nString(UIStrings.paintProfiler), paintProfilerView, true);
    }
    this.tabbedPane.selectTab("paint-profiler" /* PaintProfiler */, true);
  }
  showSelectorStatsForIndividualEvent(event) {
    this.showAggregatedSelectorStats([event]);
  }
  showAggregatedSelectorStats(events) {
    const selectorStatsView = this.selectorStatsView();
    selectorStatsView.setAggregatedEvents(events);
    if (!this.tabbedPane.hasTab("selector-stats" /* SelectorStats */)) {
      this.appendTab("selector-stats" /* SelectorStats */, i18nString(UIStrings.selectorStats), selectorStatsView);
    }
  }
  /**
   * When some events are selected, we show extra tabs. E.g. paint events get
   * the Paint Profiler, and layout events might get CSS Selector Stats if
   * they are available in the trace.
   */
  appendExtraDetailsTabsForTraceEvent(event) {
    if (Trace.Types.Events.isPaint(event) || Trace.Types.Events.isRasterTask(event)) {
      this.showEventInPaintProfiler(event);
    }
    if (Trace.Types.Events.isRecalcStyle(event)) {
      this.showSelectorStatsForIndividualEvent(event);
    }
  }
  showEventInPaintProfiler(event) {
    const paintProfilerModel = SDK.TargetManager.TargetManager.instance().models(SDK.PaintProfiler.PaintProfilerModel)[0];
    if (!paintProfilerModel) {
      return;
    }
    const paintProfilerView = this.paintProfilerView();
    if (!paintProfilerView) {
      return;
    }
    const hasProfileData = paintProfilerView.setEvent(paintProfilerModel, event);
    if (!hasProfileData) {
      return;
    }
    if (this.tabbedPane.hasTab("paint-profiler" /* PaintProfiler */)) {
      return;
    }
    this.appendTab("paint-profiler" /* PaintProfiler */, i18nString(UIStrings.paintProfiler), paintProfilerView);
  }
  updateSelectedRangeStats(startTime, endTime) {
    if (!this.#selectedEvents || !this.#parsedTrace || !this.#entityMapper) {
      return;
    }
    this.#summaryContent.selectedEvent = null;
    this.#summaryContent.selectedRange = {
      events: this.#selectedEvents,
      thirdPartyTree: this.#thirdPartyTree,
      startTime,
      endTime
    };
    void this.updateSummaryPane().then(() => {
      this.#thirdPartyTree.updateContents(this.selection || selectionFromRangeMilliSeconds(startTime, endTime));
    });
    const isSelectorStatsEnabled = Common.Settings.Settings.instance().createSetting("timeline-capture-selector-stats", false).get();
    if (this.#selectedEvents && isSelectorStatsEnabled) {
      const eventsInRange = Trace.Helpers.Trace.findRecalcStyleEvents(
        this.#selectedEvents,
        Trace.Helpers.Timing.milliToMicro(startTime),
        Trace.Helpers.Timing.milliToMicro(endTime)
      );
      if (eventsInRange.length > 0) {
        this.showAggregatedSelectorStats(eventsInRange);
      }
    }
  }
}
export var Tab = /* @__PURE__ */ ((Tab2) => {
  Tab2["Details"] = "details";
  Tab2["EventLog"] = "event-log";
  Tab2["CallTree"] = "call-tree";
  Tab2["BottomUp"] = "bottom-up";
  Tab2["PaintProfiler"] = "paint-profiler";
  Tab2["LayerViewer"] = "layer-viewer";
  Tab2["SelectorStats"] = "selector-stats";
  return Tab2;
})(Tab || {});
const SUMMARY_DEFAULT_VIEW = (input, _output, target) => {
  render(
    html`
        <style>${detailsViewStyles}</style>
        ${Directives.until(renderSelectedEventDetails(input))}
        ${input.selectedRange ? generateRangeSummaryDetails(input) : nothing}
        <devtools-widget data-related-insight-chips ${widget(
      TimelineComponents.RelatedInsightChips.RelatedInsightChips,
      {
        activeEvent: input.selectedEvent,
        eventToInsightsMap: input.eventToRelatedInsightsMap
      }
    )}></devtools-widget>
      `,
    target
  );
};
class SummaryView extends UI.Widget.Widget {
  #view;
  selectedEvent = null;
  eventToRelatedInsightsMap = null;
  parsedTrace = null;
  entityMapper = null;
  target = null;
  linkifier = null;
  filmStrip = null;
  selectedRange = null;
  constructor(element, view = SUMMARY_DEFAULT_VIEW) {
    super(element);
    this.#view = view;
  }
  performUpdate() {
    this.#view(
      {
        selectedEvent: this.selectedEvent,
        eventToRelatedInsightsMap: this.eventToRelatedInsightsMap,
        parsedTrace: this.parsedTrace,
        entityMapper: this.entityMapper,
        target: this.target,
        linkifier: this.linkifier,
        filmStrip: this.filmStrip,
        selectedRange: this.selectedRange
      },
      {},
      this.contentElement
    );
  }
}
function generateRangeSummaryDetails(input) {
  const { parsedTrace, selectedRange } = input;
  if (!selectedRange || !parsedTrace) {
    return nothing;
  }
  const minBoundsMilli = Trace.Helpers.Timing.microToMilli(parsedTrace.data.Meta.traceBounds.min);
  const { events, startTime, endTime, thirdPartyTree } = selectedRange;
  const aggregatedStats = TimelineUIUtils.statsForTimeRange(events, startTime, endTime);
  const startOffset = startTime - minBoundsMilli;
  const endOffset = endTime - minBoundsMilli;
  const summaryDetailElem = TimelineUIUtils.generateSummaryDetails(aggregatedStats, startOffset, endOffset, events, thirdPartyTree);
  return html`${summaryDetailElem}`;
}
async function renderSelectedEventDetails(input) {
  const { selectedEvent, parsedTrace, linkifier } = input;
  if (!selectedEvent || !parsedTrace || !linkifier) {
    return nothing;
  }
  const traceRecordingIsFresh = parsedTrace ? Tracing.FreshRecording.Tracker.instance().recordingIsFresh(parsedTrace) : false;
  if (Trace.Types.Events.isSyntheticLayoutShift(selectedEvent) || Trace.Types.Events.isSyntheticLayoutShiftCluster(selectedEvent)) {
    return html`
      <devtools-widget data-layout-shift-details ${widget(
      TimelineComponents.LayoutShiftDetails.LayoutShiftDetails,
      {
        event: selectedEvent,
        parsedTrace: input.parsedTrace,
        isFreshRecording: traceRecordingIsFresh
      }
    )}
      ></devtools-widget>`;
  }
  if (Trace.Types.Events.isSyntheticNetworkRequest(selectedEvent)) {
    return html`
      <devtools-widget data-network-request-details ${widget(
      TimelineComponents.NetworkRequestDetails.NetworkRequestDetails,
      {
        request: selectedEvent,
        entityMapper: input.entityMapper,
        target: input.target,
        linkifier: input.linkifier,
        parsedTrace: input.parsedTrace
      }
    )}
      ></devtools-widget>
    `;
  }
  if (Trace.Types.Events.isLegacyTimelineFrame(selectedEvent) && input.filmStrip) {
    const matchedFilmStripFrame = getFilmStripFrame(input.filmStrip, selectedEvent);
    const content = TimelineUIUtils.generateDetailsContentForFrame(selectedEvent, input.filmStrip, matchedFilmStripFrame);
    return html`${content}`;
  }
  const traceEventDetails = await TimelineUIUtils.buildTraceEventDetails(parsedTrace, selectedEvent, linkifier, true, input.entityMapper);
  return html`${traceEventDetails}`;
}
const filmStripFrameCache = /* @__PURE__ */ new WeakMap();
function getFilmStripFrame(filmStrip, frame) {
  const fromCache = filmStripFrameCache.get(frame);
  if (typeof fromCache !== "undefined") {
    return fromCache;
  }
  const screenshotTime = frame.idle ? frame.startTime : frame.endTime;
  const filmStripFrame = Trace.Extras.FilmStrip.frameClosestToTimestamp(filmStrip, screenshotTime);
  if (!filmStripFrame) {
    filmStripFrameCache.set(frame, null);
    return null;
  }
  const frameTimeMilliSeconds = Trace.Helpers.Timing.microToMilli(filmStripFrame.screenshotEvent.ts);
  const frameEndTimeMilliSeconds = Trace.Helpers.Timing.microToMilli(frame.endTime);
  if (frameTimeMilliSeconds - frameEndTimeMilliSeconds < 10) {
    filmStripFrameCache.set(frame, filmStripFrame);
    return filmStripFrame;
  }
  filmStripFrameCache.set(frame, null);
  return null;
}
//# sourceMappingURL=TimelineDetailsView.js.map
