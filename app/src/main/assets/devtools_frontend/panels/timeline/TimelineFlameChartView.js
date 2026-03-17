"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as AIAssistance from "../../models/ai_assistance/ai_assistance.js";
import * as CrUXManager from "../../models/crux-manager/crux-manager.js";
import * as Trace from "../../models/trace/trace.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as TraceBounds from "../../services/trace_bounds/trace_bounds.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { getAnnotationEntries, getAnnotationWindow } from "./AnnotationHelpers.js";
import * as TimelineInsights from "./components/insights/insights.js";
import { CountersGraph } from "./CountersGraph.js";
import { SHOULD_SHOW_EASTER_EGG } from "./EasterEgg.js";
import { ModificationsManager } from "./ModificationsManager.js";
import * as OverlayComponents from "./overlays/components/components.js";
import * as Overlays from "./overlays/overlays.js";
import { targetForEvent } from "./TargetForEvent.js";
import { TimelineDetailsPane } from "./TimelineDetailsView.js";
import { TimelineRegExp } from "./TimelineFilters.js";
import {
  Events as TimelineFlameChartDataProviderEvents,
  TimelineFlameChartDataProvider
} from "./TimelineFlameChartDataProvider.js";
import { TimelineFlameChartNetworkDataProvider } from "./TimelineFlameChartNetworkDataProvider.js";
import timelineFlameChartViewStyles from "./timelineFlameChartView.css.js";
import {
  rangeForSelection,
  selectionFromEvent,
  selectionFromRangeMilliSeconds,
  selectionIsEvent,
  selectionIsRange,
  selectionsEqual
} from "./TimelineSelection.js";
import { AggregatedTimelineTreeView, TimelineTreeView } from "./TimelineTreeView.js";
import * as Utils from "./utils/utils.js";
const UIStrings = {
  /**
   * @description Text in Timeline Flame Chart View of the Performance panel
   * @example {Frame} PH1
   * @example {10ms} PH2
   */
  sAtS: "{PH1} at {PH2}"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/TimelineFlameChartView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export const SORT_ORDER_PAGE_LOAD_MARKERS = {
  [Trace.Types.Events.Name.NAVIGATION_START]: 0,
  [Trace.Types.Events.Name.SOFT_NAVIGATION_START]: 1,
  [Trace.Types.Events.Name.MARK_LOAD]: 2,
  [Trace.Types.Events.Name.MARK_FCP]: 3,
  [Trace.Types.Events.Name.MARK_DOM_CONTENT]: 4,
  [Trace.Types.Events.Name.MARK_LCP_CANDIDATE]: 5,
  [Trace.Types.Events.Name.MARK_LCP_CANDIDATE_FOR_SOFT_NAVIGATION]: 6
};
const TIMESTAMP_THRESHOLD_MS = Trace.Types.Timing.Micro(10);
export class TimelineFlameChartView extends Common.ObjectWrapper.eventMixin(
  UI.Widget.VBox
) {
  delegate;
  /**
   * Tracks the indexes of matched entries when the user searches the panel.
   * Defaults to undefined which indicates the user has not searched.
   */
  searchResults = void 0;
  eventListeners;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  networkSplitWidget;
  mainDataProvider;
  mainFlameChart;
  networkDataProvider;
  networkFlameChart;
  networkPane;
  splitResizer;
  chartSplitWidget;
  brickGame;
  countersView;
  detailsSplitWidget;
  detailsView;
  onMainAddEntryLabelAnnotation;
  onNetworkAddEntryLabelAnnotation;
  #onMainEntriesLinkAnnotationCreated;
  #onNetworkEntriesLinkAnnotationCreated;
  onMainEntrySelected;
  onNetworkEntrySelected;
  #boundRefreshAfterIgnoreList;
  /** This is sorted by ts. */
  #selectedEvents;
  // TODO(crbug.com/1172300) Ignored during the jsdoc to ts migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupBySetting;
  searchableView;
  needsResizeToPreferredHeights;
  selectedSearchResult;
  searchRegex;
  #parsedTrace;
  #eventToRelatedInsightsMap = null;
  #selectedGroupName = null;
  #onTraceBoundsChangeBound = this.#onTraceBoundsChange.bind(this);
  #gameKeyMatches = 0;
  #gameTimeout = setTimeout(() => ({}), 0);
  #overlaysContainer = document.createElement("div");
  #overlays;
  // Tracks the in-progress time range annotation when the user alt/option clicks + drags, or when the user uses the keyboard
  #timeRangeSelectionAnnotation = null;
  // Keep track of the link annotation that hasn't been fully selected yet.
  // We only store it here when only 'entryFrom' has been selected and
  // 'EntryTo' selection still needs to be updated.
  #linkSelectionAnnotation = null;
  #currentInsightOverlays = [];
  #activeInsight = null;
  #markers = [];
  #tooltipElement = document.createElement("div");
  // We use an symbol as the loggable for each group. This is because
  // groups can get re-built at times and we need a common reference to act as
  // the reference for each group that we log. By storing these symbols in
  // a map keyed off the context of the group, we ensure we persist the
  // loggable even if the group gets rebuilt at some point in time.
  #loggableForGroupByLogContext = /* @__PURE__ */ new Map();
  #onMainEntryInvoked;
  #onNetworkEntryInvoked;
  #currentSelection = null;
  #entityMapper = null;
  // Only one dimmer is used at a time. The first dimmer, as defined by the following
  // order, that is `active` within this array is used.
  #flameChartDimmers = [];
  #searchDimmer = this.#registerFlameChartDimmer({ inclusive: false, outline: true });
  #treeRowHoverDimmer = this.#registerFlameChartDimmer({ inclusive: false, outline: true });
  #treeRowClickDimmer = this.#registerFlameChartDimmer({ inclusive: false, outline: false });
  #activeInsightDimmer = this.#registerFlameChartDimmer({ inclusive: false, outline: true });
  #thirdPartyCheckboxDimmer = this.#registerFlameChartDimmer({ inclusive: true, outline: false });
  /**
   * Determines if we respect the user's prefers-reduced-motion setting. We
   * absolutely should care about this; the only time we don't is in unit tests
   * when we need to force animations on and don't want the environment to
   * determine if they are on or not.
   * It is not expected that this flag is ever disabled in non-test environments.
   */
  #checkReducedMotion = true;
  /**
   * Persist the visual configuration of the tracks/groups into memory.
   * Note that the user cannot hide/show/re-order the network track; so storing
   * its configuration like this is a little overkill. But we use the
   * configuration to check if the network track is collapsed or expanded, and
   * it's easier to use the same configuration types for both.
   */
  #networkPersistedGroupConfigSetting;
  #mainPersistedGroupConfigSetting;
  constructor(delegate) {
    super({ jslog: `${VisualLogging.section("timeline.flame-chart-view")}` });
    this.registerRequiredCSS(timelineFlameChartViewStyles);
    this.element.classList.add("timeline-flamechart");
    this.delegate = delegate;
    this.eventListeners = [];
    this.#parsedTrace = null;
    const flameChartsContainer = new UI.Widget.VBox();
    flameChartsContainer.element.classList.add("flame-charts-container");
    this.networkSplitWidget = new UI.SplitWidget.SplitWidget(false, false, "timeline-flamechart-main-view", 150);
    this.networkSplitWidget.show(flameChartsContainer.element);
    this.#overlaysContainer.classList.add("timeline-overlays-container");
    flameChartsContainer.element.appendChild(this.#overlaysContainer);
    this.#tooltipElement.classList.add("timeline-entry-tooltip-element");
    flameChartsContainer.element.appendChild(this.#tooltipElement);
    this.networkSplitWidget.sidebarElement().style.zIndex = "120";
    this.#mainPersistedGroupConfigSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-persisted-main-flamechart-track-config",
      null
    );
    this.#networkPersistedGroupConfigSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-persisted-network-flamechart-track-config",
      null
    );
    this.mainDataProvider = new TimelineFlameChartDataProvider();
    this.mainDataProvider.setPersistedGroupConfigSetting(this.#mainPersistedGroupConfigSetting);
    this.mainDataProvider.addEventListener(
      TimelineFlameChartDataProviderEvents.DATA_CHANGED,
      () => this.mainFlameChart.scheduleUpdate()
    );
    this.mainDataProvider.addEventListener(
      TimelineFlameChartDataProviderEvents.FLAME_CHART_ITEM_HOVERED,
      (e) => this.detailsView.revealEventInTreeView(e.data)
    );
    this.mainFlameChart = new PerfUI.FlameChart.FlameChart(this.mainDataProvider, this, {
      // The TimelineOverlays are used for selected elements
      selectedElementOutline: false,
      tooltipElement: this.#tooltipElement,
      useOverlaysForCursorRuler: true,
      canvasVELogContext: "timeline.flamechart.main"
    });
    this.mainFlameChart.alwaysShowVerticalScroll();
    this.mainFlameChart.enableRuler(false);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.LATEST_DRAW_DIMENSIONS, (dimensions) => {
      this.#overlays.updateChartDimensions("main", dimensions.data.chart);
      this.#overlays.updateVisibleWindow(dimensions.data.traceWindow);
      void this.#overlays.update();
    });
    this.networkDataProvider = new TimelineFlameChartNetworkDataProvider();
    this.networkDataProvider.setPersistedGroupConfigSetting(this.#networkPersistedGroupConfigSetting);
    this.networkFlameChart = new PerfUI.FlameChart.FlameChart(this.networkDataProvider, this, {
      // The TimelineOverlays are used for selected elements
      selectedElementOutline: false,
      tooltipElement: this.#tooltipElement,
      useOverlaysForCursorRuler: true,
      canvasVELogContext: "timeline.flamechart.network"
    });
    this.networkFlameChart.alwaysShowVerticalScroll();
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.LATEST_DRAW_DIMENSIONS, (dimensions) => {
      this.#overlays.updateChartDimensions("network", dimensions.data.chart);
      this.#overlays.updateVisibleWindow(dimensions.data.traceWindow);
      void this.#overlays.update();
      this.mainFlameChart.setTooltipYPixelAdjustment(this.#overlays.networkChartOffsetHeight());
    });
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.MOUSE_MOVE, (event) => {
      void this.#processFlameChartMouseMoveEvent(event.data);
    });
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.MOUSE_MOVE, (event) => {
      void this.#processFlameChartMouseMoveEvent(event.data);
    });
    this.#overlays = new Overlays.Overlays.Overlays({
      container: this.#overlaysContainer,
      flameChartsContainers: {
        main: this.mainFlameChart.element,
        network: this.networkFlameChart.element
      },
      charts: {
        mainChart: this.mainFlameChart,
        mainProvider: this.mainDataProvider,
        networkChart: this.networkFlameChart,
        networkProvider: this.networkDataProvider
      },
      entryQueries: {
        parsedTrace: () => {
          return this.#parsedTrace;
        },
        isEntryCollapsedByUser: (entry) => {
          return ModificationsManager.activeManager()?.getEntriesFilter().entryIsInvisible(entry) ?? false;
        },
        firstVisibleParentForEntry(entry) {
          return ModificationsManager.activeManager()?.getEntriesFilter().firstVisibleParentEntryForEntry(entry) ?? null;
        }
      }
    });
    this.#overlays.addEventListener(Overlays.Overlays.ConsentDialogVisibilityChange.eventName, (e) => {
      const event = e;
      if (event.isVisible) {
        this.element.setAttribute("inert", "inert");
      } else {
        this.element.removeAttribute("inert");
      }
    });
    this.#overlays.addEventListener(Overlays.Overlays.EntryLabelMouseClick.eventName, (event) => {
      const { overlay } = event;
      this.dispatchEventToListeners(
        "EntryLabelAnnotationClicked" /* ENTRY_LABEL_ANNOTATION_CLICKED */,
        {
          entry: overlay.entry
        }
      );
    });
    this.#overlays.addEventListener(Overlays.Overlays.AnnotationOverlayActionEvent.eventName, (event) => {
      const { overlay, action } = event;
      if (action === "Remove") {
        if (ModificationsManager.activeManager()?.getAnnotationByOverlay(overlay) === this.#timeRangeSelectionAnnotation) {
          this.#timeRangeSelectionAnnotation = null;
        }
        ModificationsManager.activeManager()?.removeAnnotationOverlay(overlay);
      } else if (action === "Update") {
        ModificationsManager.activeManager()?.updateAnnotationOverlay(overlay);
      }
    });
    this.element.addEventListener(OverlayComponents.EntriesLinkOverlay.EntryLinkStartCreating.eventName, () => {
      this.focus();
    });
    this.networkPane = new UI.Widget.VBox();
    this.networkPane.setMinimumSize(23, 23);
    this.networkFlameChart.show(this.networkPane.element);
    this.splitResizer = this.networkPane.element.createChild("div", "timeline-flamechart-resizer");
    this.networkSplitWidget.hideDefaultResizer(true);
    this.networkSplitWidget.installResizer(this.splitResizer);
    this.networkSplitWidget.setMainWidget(this.mainFlameChart);
    this.networkSplitWidget.setSidebarWidget(this.networkPane);
    this.chartSplitWidget = new UI.SplitWidget.SplitWidget(false, true, "timeline-counters-split-view-state");
    this.countersView = new CountersGraph(this.delegate);
    this.chartSplitWidget.setMainWidget(flameChartsContainer);
    this.chartSplitWidget.setSidebarWidget(this.countersView);
    this.chartSplitWidget.hideDefaultResizer();
    this.chartSplitWidget.installResizer(this.countersView.resizerElement());
    this.detailsSplitWidget = new UI.SplitWidget.SplitWidget(false, true, "timeline-panel-details-split-view-state");
    this.detailsSplitWidget.element.classList.add("timeline-details-split");
    this.detailsView = new TimelineDetailsPane(delegate);
    this.detailsSplitWidget.installResizer(this.detailsView.headerElement());
    this.detailsSplitWidget.setMainWidget(this.chartSplitWidget);
    this.detailsSplitWidget.setSidebarWidget(this.detailsView);
    this.detailsSplitWidget.show(this.element);
    this.onMainAddEntryLabelAnnotation = this.onAddEntryLabelAnnotation.bind(this, this.mainDataProvider);
    this.onNetworkAddEntryLabelAnnotation = this.onAddEntryLabelAnnotation.bind(this, this.networkDataProvider);
    this.#onMainEntriesLinkAnnotationCreated = (event) => this.onEntriesLinkAnnotationCreate(this.mainDataProvider, event.data.entryFromIndex);
    this.#onNetworkEntriesLinkAnnotationCreated = (event) => this.onEntriesLinkAnnotationCreate(this.networkDataProvider, event.data.entryFromIndex);
    this.mainFlameChart.addEventListener(
      PerfUI.FlameChart.Events.ENTRY_LABEL_ANNOTATION_ADDED,
      this.onMainAddEntryLabelAnnotation,
      this
    );
    this.mainDataProvider.addEventListener(
      TimelineFlameChartDataProviderEvents.ENTRY_LABEL_ANNOTATION_ADDED,
      this.onMainAddEntryLabelAnnotation,
      this
    );
    this.networkFlameChart.addEventListener(
      PerfUI.FlameChart.Events.ENTRY_LABEL_ANNOTATION_ADDED,
      this.onNetworkAddEntryLabelAnnotation,
      this
    );
    this.mainFlameChart.addEventListener(
      PerfUI.FlameChart.Events.ENTRIES_LINK_ANNOTATION_CREATED,
      this.#onMainEntriesLinkAnnotationCreated,
      this
    );
    this.networkFlameChart.addEventListener(
      PerfUI.FlameChart.Events.ENTRIES_LINK_ANNOTATION_CREATED,
      this.#onNetworkEntriesLinkAnnotationCreated,
      this
    );
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.TRACKS_REORDER_STATE_CHANGED, (event) => {
      this.#overlays.toggleAllOverlaysDisplayed(!event.data);
    });
    this.detailsView.addEventListener(TimelineTreeView.Events.TREE_ROW_HOVERED, (e) => {
      if (e.data.events) {
        this.#updateFlameChartDimmerWithEvents(this.#treeRowHoverDimmer, e.data.events);
        return;
      }
      const events = e?.data?.node?.events ?? null;
      this.#updateFlameChartDimmerWithEvents(this.#treeRowHoverDimmer, events);
    });
    this.detailsView.addEventListener(TimelineTreeView.Events.TREE_ROW_CLICKED, (e) => {
      if (e.data.events) {
        this.#updateFlameChartDimmerWithEvents(this.#treeRowClickDimmer, e.data.events);
        return;
      }
      const events = e?.data?.node?.events ?? null;
      this.#updateFlameChartDimmerWithEvents(this.#treeRowClickDimmer, events);
    });
    this.onMainEntrySelected = this.onEntrySelected.bind(this, this.mainDataProvider);
    this.onNetworkEntrySelected = this.onEntrySelected.bind(this, this.networkDataProvider);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_SELECTED, this.onMainEntrySelected, this);
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_SELECTED, this.onNetworkEntrySelected, this);
    this.#onMainEntryInvoked = this.#onEntryInvoked.bind(this, this.mainDataProvider);
    this.#onNetworkEntryInvoked = this.#onEntryInvoked.bind(this, this.networkDataProvider);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_INVOKED, this.#onMainEntryInvoked, this);
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_INVOKED, this.#onNetworkEntryInvoked, this);
    this.mainFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_HOVERED, (event) => {
      this.onEntryHovered(event);
      this.updateLinkSelectionAnnotationWithToEntry(this.mainDataProvider, event.data);
    }, this);
    this.networkFlameChart.addEventListener(PerfUI.FlameChart.Events.ENTRY_HOVERED, (event) => {
      this.updateLinkSelectionAnnotationWithToEntry(this.networkDataProvider, event.data);
    }, this);
    this.#overlays.addEventListener(Overlays.Overlays.EventReferenceClick.eventName, (event) => {
      const eventRef = event;
      const fromTraceEvent = selectionFromEvent(eventRef.event);
      void this.openSelectionDetailsView(fromTraceEvent);
    });
    this.element.addEventListener(TimelineInsights.EventRef.EventReferenceClick.eventName, (event) => {
      void this.setSelectionAndReveal(selectionFromEvent(event.event));
    });
    this.element.addEventListener("keydown", this.#keydownHandler.bind(this));
    this.element.addEventListener("pointerdown", this.#pointerDownHandler.bind(this));
    this.#boundRefreshAfterIgnoreList = this.#refreshAfterIgnoreList.bind(this);
    this.#selectedEvents = null;
    this.groupBySetting = Common.Settings.Settings.instance().createSetting(
      "timeline-tree-group-by",
      AggregatedTimelineTreeView.GroupBy.None
    );
    this.groupBySetting.addChangeListener(this.refreshMainFlameChart, this);
    this.refreshMainFlameChart();
    TraceBounds.TraceBounds.onChange(this.#onTraceBoundsChangeBound);
  }
  containingElement() {
    return this.element;
  }
  // Activates or disables dimming when setting is toggled.
  dimThirdPartiesIfRequired() {
    if (!this.#parsedTrace) {
      return;
    }
    const dim = Common.Settings.Settings.instance().createSetting("timeline-dim-third-parties", false).get();
    const thirdPartyEvents = this.#entityMapper?.thirdPartyEvents() ?? [];
    if (dim && thirdPartyEvents.length) {
      this.#updateFlameChartDimmerWithEvents(this.#thirdPartyCheckboxDimmer, thirdPartyEvents);
    } else {
      this.#updateFlameChartDimmerWithEvents(this.#thirdPartyCheckboxDimmer, null);
    }
  }
  #registerFlameChartDimmer(opts) {
    const dimmer = {
      active: false,
      mainChartIndices: [],
      networkChartIndices: [],
      inclusive: opts.inclusive,
      outline: opts.outline
    };
    this.#flameChartDimmers.push(dimmer);
    return dimmer;
  }
  #updateFlameChartDimmerWithEvents(dimmer, events) {
    if (events) {
      dimmer.active = true;
      dimmer.mainChartIndices = events.map((event) => this.mainDataProvider.indexForEvent(event) ?? -1);
      dimmer.networkChartIndices = events.map((event) => this.networkDataProvider.indexForEvent(event) ?? -1);
    } else {
      dimmer.active = false;
      dimmer.mainChartIndices = [];
      dimmer.networkChartIndices = [];
    }
    this.#refreshDimming();
  }
  #updateFlameChartDimmerWithIndices(dimmer, mainChartIndices, networkChartIndices) {
    dimmer.active = true;
    dimmer.mainChartIndices = mainChartIndices;
    dimmer.networkChartIndices = networkChartIndices;
    this.#refreshDimming();
  }
  #refreshDimming() {
    const dimmer = this.#flameChartDimmers.find((dimmer2) => dimmer2.active);
    this.delegate.set3PCheckboxDisabled(Boolean(dimmer && dimmer !== this.#thirdPartyCheckboxDimmer));
    if (!dimmer) {
      this.mainFlameChart.disableDimming();
      this.networkFlameChart.disableDimming();
      return;
    }
    const mainOutline = typeof dimmer.outline === "boolean" ? dimmer.outline : dimmer.outline.main;
    const networkOutline = typeof dimmer.outline === "boolean" ? dimmer.outline : dimmer.outline.network;
    this.mainFlameChart.enableDimming(dimmer.mainChartIndices, dimmer.inclusive, mainOutline);
    this.networkFlameChart.enableDimming(dimmer.networkChartIndices, dimmer.inclusive, networkOutline);
  }
  #dimInsightRelatedEvents(relatedEvents) {
    const relatedMainIndices = relatedEvents.map((event) => this.mainDataProvider.indexForEvent(event) ?? -1);
    const relatedNetworkIndices = relatedEvents.map((event) => this.networkDataProvider.indexForEvent(event) ?? -1);
    this.#activeInsightDimmer.outline = {
      main: [...relatedMainIndices],
      network: [...relatedNetworkIndices]
    };
    for (const overlay of this.#currentInsightOverlays) {
      let bounds;
      if (overlay.type === "TIMESPAN_BREAKDOWN") {
        const firstSection = overlay.sections.at(0);
        const lastSection = overlay.sections.at(-1);
        if (firstSection && lastSection) {
          bounds = Trace.Helpers.Timing.traceWindowFromMicroSeconds(firstSection.bounds.min, lastSection.bounds.max);
        }
      } else if (overlay.type === "TIME_RANGE") {
        bounds = overlay.bounds;
      }
      if (!bounds) {
        continue;
      }
      let provider, relevantEvents;
      const overlayEvent = Overlays.Overlays.entriesForOverlay(overlay).at(0);
      if (overlayEvent) {
        if (this.mainDataProvider.indexForEvent(overlayEvent) !== null) {
          provider = this.mainDataProvider;
          relevantEvents = relatedMainIndices;
        } else if (this.networkDataProvider.indexForEvent(overlayEvent) !== null) {
          provider = this.networkDataProvider;
          relevantEvents = relatedNetworkIndices;
        }
      } else if (overlay.type === "TIMESPAN_BREAKDOWN") {
        provider = this.mainDataProvider;
        relevantEvents = relatedMainIndices;
      }
      if (!provider || !relevantEvents) {
        continue;
      }
      relevantEvents.push(...provider.search(bounds).map((r) => r.index));
    }
    this.#updateFlameChartDimmerWithIndices(this.#activeInsightDimmer, relatedMainIndices, relatedNetworkIndices);
  }
  #sortMarkersForPreferredVisualOrder(markers) {
    markers.sort((m1, m2) => {
      const m1Index = SORT_ORDER_PAGE_LOAD_MARKERS[m1.name] ?? Infinity;
      const m2Index = SORT_ORDER_PAGE_LOAD_MARKERS[m2.name] ?? Infinity;
      return m1Index - m2Index;
    });
  }
  #amendMarkerWithFieldData() {
    const metadata = this.#parsedTrace?.metadata;
    const insights = this.#parsedTrace?.insights;
    if (!metadata?.cruxFieldData || !insights) {
      return;
    }
    const fieldMetricResultsByNavigationId = /* @__PURE__ */ new Map();
    for (const insightSet of insights.values()) {
      if (insightSet.navigation?.args.data?.navigationId) {
        fieldMetricResultsByNavigationId.set(
          insightSet.navigation.args.data.navigationId,
          Trace.Insights.Common.getFieldMetricsForInsightSet(
            insightSet,
            metadata,
            CrUXManager.CrUXManager.instance().getSelectedScope()
          )
        );
      }
    }
    for (const marker of this.#markers) {
      for (const event of marker.entries) {
        const navigationId = event.args?.data?.navigationId;
        if (!navigationId) {
          continue;
        }
        const fieldMetricResults = fieldMetricResultsByNavigationId.get(navigationId);
        if (!fieldMetricResults) {
          continue;
        }
        let fieldMetricResult;
        if (event.name === Trace.Types.Events.Name.MARK_FCP) {
          fieldMetricResult = fieldMetricResults.fcp;
        } else if (event.name === Trace.Types.Events.Name.MARK_LCP_CANDIDATE) {
          fieldMetricResult = fieldMetricResults.lcp;
        }
        if (!fieldMetricResult) {
          continue;
        }
        marker.entryToFieldResult.set(event, fieldMetricResult);
      }
    }
  }
  setMarkers(parsedTrace) {
    if (!parsedTrace) {
      return;
    }
    this.bulkRemoveOverlays(this.#markers);
    const markerEvents = parsedTrace.data.PageLoadMetrics.allMarkerEvents;
    const markers = markerEvents.filter(
      (event) => event.name === Trace.Types.Events.Name.NAVIGATION_START || event.name === Trace.Types.Events.Name.SOFT_NAVIGATION_START || event.name === Trace.Types.Events.Name.MARK_LCP_CANDIDATE || event.name === Trace.Types.Events.Name.MARK_LCP_CANDIDATE_FOR_SOFT_NAVIGATION || event.name === Trace.Types.Events.Name.MARK_FCP || event.name === Trace.Types.Events.Name.MARK_DOM_CONTENT || event.name === Trace.Types.Events.Name.MARK_LOAD
    );
    this.#sortMarkersForPreferredVisualOrder(markers);
    const overlayByTs = /* @__PURE__ */ new Map();
    markers.forEach((marker) => {
      const adjustedTimestamp = Trace.Helpers.Timing.timeStampForEventAdjustedByClosestNavigation(
        marker,
        parsedTrace.data.Meta.traceBounds,
        parsedTrace.data.Meta.navigationsByNavigationId,
        parsedTrace.data.Meta.softNavigationsById,
        parsedTrace.data.Meta.navigationsByFrameId
      );
      let matchingOverlay = false;
      for (const [ts, overlay] of overlayByTs.entries()) {
        if (Math.abs(marker.ts - ts) <= TIMESTAMP_THRESHOLD_MS) {
          overlay.entries.push(marker);
          matchingOverlay = true;
          break;
        }
      }
      if (!matchingOverlay) {
        const overlay = {
          type: "TIMINGS_MARKER",
          entries: [marker],
          entryToFieldResult: /* @__PURE__ */ new Map(),
          adjustedTimestamp
        };
        overlayByTs.set(marker.ts, overlay);
      }
    });
    const markerOverlays = [...overlayByTs.values()];
    this.#markers = markerOverlays;
    if (this.#markers.length === 0) {
      return;
    }
    this.#amendMarkerWithFieldData();
    this.bulkAddOverlays(this.#markers);
  }
  setOverlays(overlays, options) {
    this.bulkRemoveOverlays(this.#currentInsightOverlays);
    this.#currentInsightOverlays = overlays;
    if (this.#currentInsightOverlays.length === 0) {
      return;
    }
    const traceBounds = TraceBounds.TraceBounds.BoundsManager.instance().state()?.micro.entireTraceBounds;
    if (!traceBounds) {
      return;
    }
    this.bulkAddOverlays(this.#currentInsightOverlays);
    const entries = [];
    for (const overlay of this.#currentInsightOverlays) {
      entries.push(...Overlays.Overlays.entriesForOverlay(overlay));
    }
    if (options.updateTraceWindow) {
      this.#bulkExpandGroupsForEntries(entries);
      const overlaysBounds = Overlays.Overlays.traceWindowContainingOverlays(this.#currentInsightOverlays);
      if (overlaysBounds) {
        const percentage = options.updateTraceWindowPercentage ?? 50;
        const expandedBounds = Trace.Helpers.Timing.expandWindowByPercentOrToOneMillisecond(overlaysBounds, traceBounds, percentage);
        TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
          expandedBounds,
          { ignoreMiniMapBounds: true, shouldAnimate: true }
        );
      }
    }
    let relatedEventsList = this.#activeInsight?.model.relatedEvents;
    if (!relatedEventsList) {
      relatedEventsList = [];
    } else if (relatedEventsList instanceof Map) {
      relatedEventsList = Array.from(relatedEventsList.keys());
    }
    this.#dimInsightRelatedEvents([...entries, ...relatedEventsList]);
    if (entries.length !== 0) {
      const earliestEntry = entries.reduce((earliest, current) => earliest.ts < current.ts ? earliest : current, entries[0]);
      requestAnimationFrame(() => {
        this.revealEventVertically(earliestEntry);
      });
    }
  }
  hoverAnnotationInSidebar(annotation) {
    const overlay = ModificationsManager.activeManager()?.getOverlaybyAnnotation(annotation);
    if (overlay?.type === "ENTRY_LABEL") {
      this.#overlays.highlightOverlay(overlay);
    }
  }
  sidebarAnnotationHoverOut() {
    this.#overlays.undimAllEntryLabels();
  }
  revealAnnotation(annotation) {
    const traceBounds = TraceBounds.TraceBounds.BoundsManager.instance().state()?.micro.entireTraceBounds;
    if (!traceBounds) {
      return;
    }
    const annotationWindow = getAnnotationWindow(annotation);
    if (!annotationWindow) {
      return;
    }
    const annotationEntries = getAnnotationEntries(annotation);
    for (const entry of annotationEntries) {
      this.#expandEntryTrack(entry);
    }
    const firstEntry = annotationEntries.at(0);
    if (firstEntry) {
      this.revealEventVertically(firstEntry);
    }
    const expandedBounds = Trace.Helpers.Timing.expandWindowByPercentOrToOneMillisecond(annotationWindow, traceBounds, 100);
    TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
      expandedBounds,
      { ignoreMiniMapBounds: true, shouldAnimate: true }
    );
  }
  setActiveInsight(insight) {
    this.#activeInsight = insight;
    this.bulkRemoveOverlays(this.#currentInsightOverlays);
    if (!this.#activeInsight) {
      this.#updateFlameChartDimmerWithEvents(this.#activeInsightDimmer, null);
    }
  }
  /**
   * Bulk expands the tracks (e.g. groups) that the given entries belong to.
   * Will update them all at once and then do a redraw.
   */
  #bulkExpandGroupsForEntries(entries) {
    const networkGroupIndexes = /* @__PURE__ */ new Set();
    const mainGroupIndexes = /* @__PURE__ */ new Set();
    for (const entry of entries) {
      const chartName = Overlays.Overlays.chartForEntry(entry);
      const provider = chartName === "main" ? this.mainDataProvider : this.networkDataProvider;
      const entryIndex = provider.indexForEvent?.(entry) ?? null;
      if (entryIndex === null) {
        continue;
      }
      const group = provider.groupForEvent?.(entryIndex) ?? null;
      if (!group) {
        continue;
      }
      if (group.expanded) {
        continue;
      }
      const groupIndex = provider.timelineData().groups.indexOf(group);
      if (chartName === "main") {
        mainGroupIndexes.add(groupIndex);
      } else {
        networkGroupIndexes.add(groupIndex);
      }
    }
    this.mainFlameChart.bulkExpandGroups([...mainGroupIndexes]);
    this.networkFlameChart.bulkExpandGroups([...networkGroupIndexes]);
  }
  /**
   * Expands the track / group that the given entry is in.
   */
  #expandEntryTrack(entry) {
    const chartName = Overlays.Overlays.chartForEntry(entry);
    const provider = chartName === "main" ? this.mainDataProvider : this.networkDataProvider;
    const entryChart = chartName === "main" ? this.mainFlameChart : this.networkFlameChart;
    const entryIndex = provider.indexForEvent?.(entry) ?? null;
    if (entryIndex === null) {
      return;
    }
    const group = provider.groupForEvent?.(entryIndex) ?? null;
    if (!group) {
      return;
    }
    const groupIndex = provider.timelineData().groups.indexOf(group);
    if (!group.expanded && groupIndex > -1) {
      entryChart.toggleGroupExpand(groupIndex);
    }
  }
  addTimestampMarkerOverlay(timestamp) {
    this.addOverlay({
      type: "TIMESTAMP_MARKER",
      timestamp
    });
  }
  async removeTimestampMarkerOverlay() {
    const removedCount = this.#overlays.removeOverlaysOfType("TIMESTAMP_MARKER");
    if (removedCount > 0) {
      await this.#overlays.update();
    }
  }
  async #processFlameChartMouseMoveEvent(data) {
    const { mouseEvent, timeInMicroSeconds } = data;
    if (!mouseEvent.shiftKey) {
      await this.removeTimestampMarkerOverlay();
    }
    if (!mouseEvent.metaKey && mouseEvent.shiftKey) {
      this.addTimestampMarkerOverlay(timeInMicroSeconds);
    }
  }
  #pointerDownHandler(event) {
    if (event.buttons === 2 && this.#linkSelectionAnnotation) {
      this.#clearLinkSelectionAnnotation(true);
      event.stopPropagation();
    }
  }
  #clearLinkSelectionAnnotation(deleteCurrentLink) {
    if (this.#linkSelectionAnnotation === null) {
      return;
    }
    if (deleteCurrentLink || this.#linkSelectionAnnotation.state !== Trace.Types.File.EntriesLinkState.CONNECTED) {
      ModificationsManager.activeManager()?.removeAnnotation(this.#linkSelectionAnnotation);
    }
    this.mainFlameChart.setLinkSelectionAnnotationIsInProgress(false);
    this.networkFlameChart.setLinkSelectionAnnotationIsInProgress(false);
    this.#linkSelectionAnnotation = null;
  }
  #setLinkSelectionAnnotation(linkSelectionAnnotation) {
    this.mainFlameChart.setLinkSelectionAnnotationIsInProgress(true);
    this.networkFlameChart.setLinkSelectionAnnotationIsInProgress(true);
    this.#linkSelectionAnnotation = linkSelectionAnnotation;
  }
  #createNewTimeRangeFromKeyboard(startTime, endTime) {
    if (this.#timeRangeSelectionAnnotation) {
      return;
    }
    this.#timeRangeSelectionAnnotation = {
      bounds: Trace.Helpers.Timing.traceWindowFromMicroSeconds(startTime, endTime),
      type: "TIME_RANGE",
      label: ""
    };
    ModificationsManager.activeManager()?.createAnnotation(
      this.#timeRangeSelectionAnnotation,
      { muteAriaNotifications: false, loadedFromFile: false }
    );
  }
  /**
   * Handles key presses that could impact the creation of a time range overlay with the keyboard.
   * @returns `true` if the event should not be propagated + have its default behaviour stopped.
   */
  #handleTimeRangeKeyboardCreation(event) {
    const visibleWindow = TraceBounds.TraceBounds.BoundsManager.instance().state()?.micro.timelineTraceWindow;
    if (!visibleWindow) {
      return false;
    }
    const timeRangeIncrementValue = visibleWindow.range * 0.02;
    switch (event.key) {
      // ArrowLeft + ArrowRight adjusts the right hand bound (the max) of the time range
      // alt/option + ArrowRight also starts a range if there isn't one already
      case "ArrowRight": {
        if (!this.#timeRangeSelectionAnnotation) {
          if (event.altKey) {
            let startTime = visibleWindow.min;
            if (this.#currentSelection) {
              startTime = rangeForSelection(this.#currentSelection).min;
            }
            this.#createNewTimeRangeFromKeyboard(
              startTime,
              Trace.Types.Timing.Micro(startTime + timeRangeIncrementValue)
            );
            return true;
          }
          return false;
        }
        this.#timeRangeSelectionAnnotation.bounds.max = Trace.Types.Timing.Micro(
          Math.min(this.#timeRangeSelectionAnnotation.bounds.max + timeRangeIncrementValue, visibleWindow.max)
        );
        this.#timeRangeSelectionAnnotation.bounds.range = Trace.Types.Timing.Micro(
          this.#timeRangeSelectionAnnotation.bounds.max - this.#timeRangeSelectionAnnotation.bounds.min
        );
        ModificationsManager.activeManager()?.updateAnnotation(this.#timeRangeSelectionAnnotation);
        return true;
      }
      case "ArrowLeft": {
        if (!this.#timeRangeSelectionAnnotation) {
          return false;
        }
        this.#timeRangeSelectionAnnotation.bounds.max = Trace.Types.Timing.Micro(
          // Shrink the RHS of the range, but make sure it cannot go below the min value.
          Math.max(
            this.#timeRangeSelectionAnnotation.bounds.max - timeRangeIncrementValue,
            this.#timeRangeSelectionAnnotation.bounds.min + 1
          )
        );
        this.#timeRangeSelectionAnnotation.bounds.range = Trace.Types.Timing.Micro(
          this.#timeRangeSelectionAnnotation.bounds.max - this.#timeRangeSelectionAnnotation.bounds.min
        );
        ModificationsManager.activeManager()?.updateAnnotation(this.#timeRangeSelectionAnnotation);
        return true;
      }
      // ArrowDown + ArrowUp adjusts the left hand bound (the min) of the time range
      case "ArrowUp": {
        if (!this.#timeRangeSelectionAnnotation) {
          return false;
        }
        this.#timeRangeSelectionAnnotation.bounds.min = Trace.Types.Timing.Micro(
          // Increase the LHS of the range, but make sure it cannot go above the max value.
          Math.min(
            this.#timeRangeSelectionAnnotation.bounds.min + timeRangeIncrementValue,
            this.#timeRangeSelectionAnnotation.bounds.max - 1
          )
        );
        this.#timeRangeSelectionAnnotation.bounds.range = Trace.Types.Timing.Micro(
          this.#timeRangeSelectionAnnotation.bounds.max - this.#timeRangeSelectionAnnotation.bounds.min
        );
        ModificationsManager.activeManager()?.updateAnnotation(this.#timeRangeSelectionAnnotation);
        return true;
      }
      case "ArrowDown": {
        if (!this.#timeRangeSelectionAnnotation) {
          return false;
        }
        this.#timeRangeSelectionAnnotation.bounds.min = Trace.Types.Timing.Micro(
          // Decrease the LHS, but make sure it cannot go beyond the minimum visible window.
          Math.max(this.#timeRangeSelectionAnnotation.bounds.min - timeRangeIncrementValue, visibleWindow.min)
        );
        this.#timeRangeSelectionAnnotation.bounds.range = Trace.Types.Timing.Micro(
          this.#timeRangeSelectionAnnotation.bounds.max - this.#timeRangeSelectionAnnotation.bounds.min
        );
        ModificationsManager.activeManager()?.updateAnnotation(this.#timeRangeSelectionAnnotation);
        return true;
      }
      default: {
        this.#timeRangeSelectionAnnotation = null;
        return false;
      }
    }
  }
  #keydownHandler(event) {
    const keyCombo = "fixme";
    if (this.#linkSelectionAnnotation && this.#linkSelectionAnnotation.state === Trace.Types.File.EntriesLinkState.CREATION_NOT_STARTED) {
      this.#clearLinkSelectionAnnotation(true);
      event.stopPropagation();
    }
    if (event.key === "Escape" && this.#linkSelectionAnnotation) {
      this.#clearLinkSelectionAnnotation(true);
      event.stopPropagation();
      event.preventDefault();
    }
    const eventHandledByKeyboardTimeRange = this.#handleTimeRangeKeyboardCreation(event);
    if (eventHandledByKeyboardTimeRange) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.key === keyCombo[this.#gameKeyMatches]) {
      this.#gameKeyMatches++;
      clearTimeout(this.#gameTimeout);
      this.#gameTimeout = setTimeout(() => {
        this.#gameKeyMatches = 0;
      }, 2e3);
    } else {
      this.#gameKeyMatches = 0;
      clearTimeout(this.#gameTimeout);
    }
    if (this.#gameKeyMatches !== keyCombo.length) {
      return;
    }
    this.runBrickBreakerGame();
  }
  forceAnimationsForTest() {
    this.#checkReducedMotion = false;
  }
  runBrickBreakerGame() {
    if (!SHOULD_SHOW_EASTER_EGG) {
      return;
    }
    if ([...this.element.childNodes].find((child) => child instanceof PerfUI.BrickBreaker.BrickBreaker)) {
      return;
    }
    this.brickGame = new PerfUI.BrickBreaker.BrickBreaker(this.mainFlameChart);
    this.brickGame.classList.add("brick-game");
    this.element.append(this.brickGame);
  }
  #onTraceBoundsChange(event) {
    if (event.updateType === "MINIMAP_BOUNDS") {
      return;
    }
    const visibleWindow = event.state.milli.timelineTraceWindow;
    const userHasReducedMotionSet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate = Boolean(event.options.shouldAnimate) && (this.#checkReducedMotion ? !userHasReducedMotionSet : true);
    this.mainFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max, shouldAnimate);
    this.networkDataProvider.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max, shouldAnimate);
    const debouncedUpdate = Common.Debouncer.debounce(() => {
      this.updateSearchResults(false, false);
    }, 100);
    debouncedUpdate();
  }
  getLinkSelectionAnnotation() {
    return this.#linkSelectionAnnotation;
  }
  getMainDataProvider() {
    return this.mainDataProvider;
  }
  getNetworkDataProvider() {
    return this.networkDataProvider;
  }
  refreshMainFlameChart() {
    this.mainFlameChart.update();
  }
  windowChanged(windowStartTime, windowEndTime, animate) {
    TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
      Trace.Helpers.Timing.traceWindowFromMilliSeconds(
        Trace.Types.Timing.Milli(windowStartTime),
        Trace.Types.Timing.Milli(windowEndTime)
      ),
      { shouldAnimate: animate }
    );
  }
  /**
   * @param startTime the start time of the selection in MilliSeconds
   * @param endTime the end time of the selection in MilliSeconds
   * TODO(crbug.com/346312365): update the type definitions in ChartViewport.ts
   */
  updateRangeSelection(startTime, endTime) {
    this.delegate.select(
      selectionFromRangeMilliSeconds(Trace.Types.Timing.Milli(startTime), Trace.Types.Timing.Milli(endTime))
    );
    const bounds = Trace.Helpers.Timing.traceWindowFromMilliSeconds(
      Trace.Types.Timing.Milli(startTime),
      Trace.Types.Timing.Milli(endTime)
    );
    if (this.#timeRangeSelectionAnnotation) {
      this.#timeRangeSelectionAnnotation.bounds = bounds;
      ModificationsManager.activeManager()?.updateAnnotation(this.#timeRangeSelectionAnnotation);
    } else {
      this.#timeRangeSelectionAnnotation = {
        type: "TIME_RANGE",
        label: "",
        bounds
      };
      ModificationsManager.activeManager()?.deleteEmptyRangeAnnotations();
      ModificationsManager.activeManager()?.createAnnotation(
        this.#timeRangeSelectionAnnotation,
        { muteAriaNotifications: false, loadedFromFile: false }
      );
    }
  }
  getMainFlameChart() {
    return this.mainFlameChart;
  }
  // This function is public for test purpose.
  getNetworkFlameChart() {
    return this.networkFlameChart;
  }
  updateSelectedGroup(flameChart, group) {
    if (flameChart !== this.mainFlameChart || this.#selectedGroupName === group?.name) {
      return;
    }
    this.#selectedGroupName = group?.name || null;
    this.#selectedEvents = group ? this.mainDataProvider.groupTreeEvents(group) : null;
    this.#updateDetailViews();
  }
  setModel(newParsedTrace, eventToRelatedInsightsMap) {
    if (newParsedTrace === this.#parsedTrace) {
      return;
    }
    this.#parsedTrace = newParsedTrace;
    this.#eventToRelatedInsightsMap = eventToRelatedInsightsMap;
    for (const dimmer of this.#flameChartDimmers) {
      dimmer.active = false;
      dimmer.mainChartIndices = [];
      dimmer.networkChartIndices = [];
    }
    this.rebuildDataForTrace({ updateType: "NEW_TRACE" });
  }
  /**
   * Resets the state of the UI data and initializes it again with the
   * current parsed trace.
   * @param opts.updateType determines if we are redrawing because we need to show a new trace,
   * or redraw an existing trace (if the user changed a setting).
   * This distinction is needed because in the latter case we do not want to
   * trigger some code such as Aria announcements for annotations if we are
   * just redrawing.
   */
  rebuildDataForTrace(opts) {
    if (!this.#parsedTrace) {
      return;
    }
    this.#selectedGroupName = null;
    Common.EventTarget.removeEventListeners(this.eventListeners);
    this.#selectedEvents = null;
    this.#entityMapper = new Trace.EntityMapper.EntityMapper(this.#parsedTrace);
    this.mainDataProvider.setModel(this.#parsedTrace, this.#entityMapper);
    this.networkDataProvider.setModel(this.#parsedTrace, this.#entityMapper);
    this.reset();
    const mainChartConfig = this.#mainPersistedGroupConfigSetting.get();
    if (mainChartConfig) {
      this.mainFlameChart.setPersistedConfig(mainChartConfig);
    }
    const networkChartConfig = this.#networkPersistedGroupConfigSetting.get();
    if (networkChartConfig) {
      this.networkFlameChart.setPersistedConfig(networkChartConfig);
    }
    this.setupWindowTimes();
    this.updateSearchResults(false, false);
    this.#updateFlameCharts();
    this.resizeToPreferredHeights();
    this.setMarkers(this.#parsedTrace);
    this.dimThirdPartiesIfRequired();
    ModificationsManager.activeManager()?.applyAnnotationsFromCache(
      { muteAriaNotifications: opts.updateType === "REDRAW_EXISTING_TRACE" }
    );
  }
  /**
   * Gets the persisted config (if the user has made any visual changes) in
   * order to save it to disk as part of the trace.
   */
  getPersistedConfigMetadata() {
    const main = this.#mainPersistedGroupConfigSetting.get();
    const network = this.#networkPersistedGroupConfigSetting.get();
    return { main, network };
  }
  reset() {
    if (this.networkDataProvider.isEmpty()) {
      this.mainFlameChart.enableRuler(true);
      this.networkSplitWidget.hideSidebar();
    } else {
      this.mainFlameChart.enableRuler(false);
      this.networkSplitWidget.showBoth();
      this.resizeToPreferredHeights();
    }
    this.#overlays.reset();
    this.mainFlameChart.reset();
    this.networkFlameChart.reset();
    this.updateSearchResults(false, false);
  }
  // TODO(paulirish): It's possible this is being called more than necessary. Attempt to clean up the lifecycle.
  setupWindowTimes() {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      throw new Error("TimelineFlameChartView could not set the window bounds.");
    }
    const visibleWindow = traceBoundsState.milli.timelineTraceWindow;
    this.mainFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkDataProvider.setWindowTimes(visibleWindow.min, visibleWindow.max);
    this.networkFlameChart.setWindowTimes(visibleWindow.min, visibleWindow.max);
  }
  #refreshAfterIgnoreList() {
    this.mainDataProvider.timelineData(true);
    this.mainFlameChart.scheduleUpdate();
  }
  #updateDetailViews() {
    this.countersView.setModel(this.#parsedTrace, this.#selectedEvents);
    void this.detailsView.setModel({
      parsedTrace: this.#parsedTrace,
      selectedEvents: this.#selectedEvents,
      eventToRelatedInsightsMap: this.#eventToRelatedInsightsMap,
      entityMapper: this.#entityMapper
    });
  }
  #updateFlameCharts() {
    this.mainFlameChart.scheduleUpdate();
    this.networkFlameChart.scheduleUpdate();
    this.#registerLoggableGroups();
  }
  hasHiddenTracks() {
    const groups = [
      ...this.mainFlameChart.timelineData()?.groups ?? [],
      ...this.networkFlameChart.timelineData()?.groups ?? []
    ];
    return groups.some((g) => g.hidden);
  }
  #registerLoggableGroups() {
    const groups = [
      ...this.mainFlameChart.timelineData()?.groups ?? [],
      ...this.networkFlameChart.timelineData()?.groups ?? []
    ];
    for (const group of groups) {
      if (!group.jslogContext) {
        continue;
      }
      const loggable = this.#loggableForGroupByLogContext.get(group.jslogContext) ?? Symbol(group.jslogContext);
      if (!this.#loggableForGroupByLogContext.has(group.jslogContext)) {
        this.#loggableForGroupByLogContext.set(group.jslogContext, loggable);
        VisualLogging.registerLoggable(
          loggable,
          `${VisualLogging.section().context(`timeline.${group.jslogContext}`)}`,
          this.delegate.element,
          new DOMRect(0, 0, 200, 100)
        );
      }
    }
  }
  // If an entry is hovered over and a creation of link annotation is in progress, update that annotation with a hovered entry.
  updateLinkSelectionAnnotationWithToEntry(dataProvider, entryIndex) {
    if (!this.#linkSelectionAnnotation || this.#linkSelectionAnnotation.state === Trace.Types.File.EntriesLinkState.CREATION_NOT_STARTED) {
      return;
    }
    const toSelectionObject = this.#selectionIfTraceEvent(entryIndex, dataProvider);
    if (toSelectionObject) {
      if (toSelectionObject === this.#linkSelectionAnnotation.entryFrom) {
        return;
      }
      const linkBetweenEntriesExists = ModificationsManager.activeManager()?.linkAnnotationBetweenEntriesExists(
        this.#linkSelectionAnnotation.entryFrom,
        toSelectionObject
      );
      if (linkBetweenEntriesExists) {
        return;
      }
      this.#linkSelectionAnnotation.state = Trace.Types.File.EntriesLinkState.CONNECTED;
      this.#linkSelectionAnnotation.entryTo = toSelectionObject;
    } else {
      this.#linkSelectionAnnotation.state = Trace.Types.File.EntriesLinkState.PENDING_TO_EVENT;
      delete this.#linkSelectionAnnotation["entryTo"];
    }
    ModificationsManager.activeManager()?.updateAnnotation(this.#linkSelectionAnnotation);
  }
  onEntryHovered(commonEvent) {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
    const entryIndex = commonEvent.data;
    const event = this.mainDataProvider.eventByIndex(entryIndex);
    if (!event || !this.#parsedTrace) {
      return;
    }
    if (Trace.Types.Events.isLegacyTimelineFrame(event)) {
      return;
    }
    const target = targetForEvent(this.#parsedTrace, event);
    if (!target) {
      return;
    }
    const nodeIds = Utils.EntryNodes.nodeIdsForEvent(this.#parsedTrace, event);
    for (const nodeId of nodeIds) {
      new SDK.DOMModel.DeferredDOMNode(target, nodeId).highlight();
    }
  }
  highlightEvent(event) {
    const entryIndex = event ? this.mainDataProvider.entryIndexForSelection(selectionFromEvent(event)) : -1;
    if (entryIndex >= 0) {
      this.mainFlameChart.highlightEntry(entryIndex);
    } else {
      this.mainFlameChart.hideHighlight();
    }
  }
  willHide() {
    super.willHide();
    this.#networkPersistedGroupConfigSetting.removeChangeListener(this.resizeToPreferredHeights, this);
    Workspace.IgnoreListManager.IgnoreListManager.instance().removeChangeListener(this.#boundRefreshAfterIgnoreList);
  }
  wasShown() {
    super.wasShown();
    this.#networkPersistedGroupConfigSetting.addChangeListener(this.resizeToPreferredHeights, this);
    Workspace.IgnoreListManager.IgnoreListManager.instance().addChangeListener(this.#boundRefreshAfterIgnoreList);
    if (this.needsResizeToPreferredHeights) {
      this.resizeToPreferredHeights();
    }
    this.#updateFlameCharts();
  }
  updateCountersGraphToggle(showMemoryGraph) {
    if (showMemoryGraph) {
      this.chartSplitWidget.showBoth();
    } else {
      this.chartSplitWidget.hideSidebar();
    }
  }
  zoomEvent(event) {
    const traceBounds = TraceBounds.TraceBounds.BoundsManager.instance().state()?.micro.entireTraceBounds;
    if (!traceBounds) {
      return;
    }
    this.#expandEntryTrack(event);
    this.revealEventVertically(event);
    const entryWindow = Trace.Helpers.Timing.traceWindowFromMicroSeconds(
      event.ts,
      Trace.Types.Timing.Micro(event.ts + (event.dur ?? 0))
    );
    const expandedBounds = Trace.Helpers.Timing.expandWindowByPercentOrToOneMillisecond(entryWindow, traceBounds, 100);
    TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
      expandedBounds,
      { ignoreMiniMapBounds: true, shouldAnimate: true }
    );
  }
  revealEvent(event) {
    const mainIndex = this.mainDataProvider.indexForEvent(event);
    const networkIndex = this.networkDataProvider.indexForEvent(event);
    if (mainIndex !== null) {
      this.mainFlameChart.revealEntry(mainIndex);
    } else if (networkIndex !== null) {
      this.networkFlameChart.revealEntry(networkIndex);
    }
  }
  // Given an event, it reveals its position vertically
  revealEventVertically(event) {
    const mainIndex = this.mainDataProvider.indexForEvent(event);
    const networkIndex = this.networkDataProvider.indexForEvent(event);
    if (mainIndex !== null) {
      this.mainFlameChart.revealEntryVertically(mainIndex);
    } else if (networkIndex !== null) {
      this.networkFlameChart.revealEntryVertically(networkIndex);
    }
  }
  async setSelectionAndReveal(selection) {
    if (selection && this.#currentSelection && selectionsEqual(selection, this.#currentSelection)) {
      return;
    }
    this.#currentSelection = selection;
    this.#overlays.removeOverlaysOfType("ENTRY_SELECTED");
    if ((selection === null || !selectionIsRange(selection)) && this.#timeRangeSelectionAnnotation && !this.#timeRangeSelectionAnnotation.label) {
      ModificationsManager.activeManager()?.removeAnnotation(this.#timeRangeSelectionAnnotation);
      this.#timeRangeSelectionAnnotation = null;
    }
    if (selection === null) {
      this.#updateFlameChartDimmerWithEvents(this.#treeRowClickDimmer, null);
    }
    const mainIndex = this.mainDataProvider.entryIndexForSelection(selection);
    this.mainDataProvider.buildFlowForInitiator(mainIndex);
    this.mainFlameChart.setSelectedEntry(mainIndex);
    const networkIndex = this.networkDataProvider.entryIndexForSelection(selection);
    this.networkDataProvider.buildFlowForInitiator(networkIndex);
    this.networkFlameChart.setSelectedEntry(networkIndex);
    if (this.detailsView) {
      await this.detailsView.setSelection(selection);
    }
    if (selectionIsEvent(selection)) {
      this.addOverlay({
        type: "ENTRY_SELECTED",
        entry: selection.event
      });
    }
    if (this.#linkSelectionAnnotation && this.#linkSelectionAnnotation.state === Trace.Types.File.EntriesLinkState.CREATION_NOT_STARTED) {
      this.#clearLinkSelectionAnnotation(true);
    }
    requestAnimationFrame(() => {
      if (!this.#parsedTrace) {
        return;
      }
      const event = selectionIsEvent(selection) ? selection.event : null;
      let focus = UI.Context.Context.instance().flavor(AIAssistance.AIContext.AgentFocus);
      if (focus) {
        focus = focus.withEvent(event);
      } else if (event) {
        focus = AIAssistance.AIContext.AgentFocus.fromEvent(this.#parsedTrace, event);
      } else {
        focus = null;
      }
      UI.Context.Context.instance().setFlavor(AIAssistance.AIContext.AgentFocus, focus);
    });
  }
  // Only opens the details view of a selection. This is used for Timing Markers. Timing markers replace
  // their entry with a new UI. Because of that, their entries can no longer be "selected" in the timings track,
  // so if clicked, we only open their details view.
  async openSelectionDetailsView(selection) {
    if (this.detailsView) {
      await this.detailsView.setSelection(selection);
    }
  }
  /**
   * Used to create multiple overlays at once without triggering a redraw for each one.
   */
  bulkAddOverlays(overlays) {
    for (const overlay of overlays) {
      this.#overlays.add(overlay);
    }
    void this.#overlays.update();
  }
  addOverlay(newOverlay) {
    const overlay = this.#overlays.add(newOverlay);
    void this.#overlays.update();
    return overlay;
  }
  bulkRemoveOverlays(overlays) {
    if (!overlays.length) {
      return;
    }
    for (const overlay of overlays) {
      this.#overlays.remove(overlay);
    }
    void this.#overlays.update();
  }
  removeOverlay(removedOverlay) {
    this.#overlays.remove(removedOverlay);
    void this.#overlays.update();
  }
  updateExistingOverlay(existingOverlay, newData) {
    this.#overlays.updateExisting(existingOverlay, newData);
    void this.#overlays.update();
  }
  enterLabelEditMode(overlay) {
    this.#overlays.enterLabelEditMode(overlay);
  }
  bringLabelForward(overlay) {
    this.#overlays.bringLabelForward(overlay);
  }
  enterMainChartTrackConfigurationMode() {
    this.mainFlameChart.enterTrackConfigurationMode();
  }
  showAllMainChartTracks() {
    this.mainFlameChart.showAllGroups();
  }
  async onAddEntryLabelAnnotation(dataProvider, event) {
    const selection = dataProvider.createSelection(event.data.entryIndex);
    if (selectionIsEvent(selection)) {
      await this.setSelectionAndReveal(selection);
      ModificationsManager.activeManager()?.createAnnotation(
        {
          type: "ENTRY_LABEL",
          entry: selection.event,
          label: ""
        },
        { loadedFromFile: false, muteAriaNotifications: false }
      );
      if (event.data.withLinkCreationButton) {
        this.onEntriesLinkAnnotationCreate(dataProvider, event.data.entryIndex, true);
      }
    }
  }
  onEntriesLinkAnnotationCreate(dataProvider, entryFromIndex, linkCreateButton) {
    const fromSelectionObject = entryFromIndex ? this.#selectionIfTraceEvent(entryFromIndex, dataProvider) : null;
    if (fromSelectionObject) {
      this.#setLinkSelectionAnnotation({
        type: "ENTRIES_LINK",
        entryFrom: fromSelectionObject,
        state: linkCreateButton ? Trace.Types.File.EntriesLinkState.CREATION_NOT_STARTED : Trace.Types.File.EntriesLinkState.PENDING_TO_EVENT
      });
      if (this.#linkSelectionAnnotation) {
        ModificationsManager.activeManager()?.createAnnotation(
          this.#linkSelectionAnnotation,
          { loadedFromFile: false, muteAriaNotifications: false }
        );
      }
    }
  }
  #selectionIfTraceEvent(index, dataProvider) {
    const selection = dataProvider.createSelection(index);
    return selectionIsEvent(selection) ? selection.event : null;
  }
  /**
   * Called when the user either:
   * 1. clicks with their mouse on an entry
   * 2. Uses the keyboard and presses "enter" whilst an entry is selected
   */
  #onEntryInvoked(dataProvider, event) {
    this.#updateSelectedEntryStatus(dataProvider, event);
    const entryIndex = event.data;
    if (this.#linkSelectionAnnotation) {
      this.handleToEntryOfLinkBetweenEntriesSelection(entryIndex);
    }
  }
  #updateSelectedEntryStatus(dataProvider, event) {
    const data = dataProvider.timelineData();
    if (!data) {
      return;
    }
    const entryIndex = event.data;
    const entryLevel = data.entryLevels[entryIndex];
    const group = groupForLevel(data.groups, entryLevel);
    if (group?.jslogContext) {
      const loggable = this.#loggableForGroupByLogContext.get(group.jslogContext) ?? null;
      if (loggable) {
        VisualLogging.logClick(loggable, new MouseEvent("click"));
      }
    }
    this.delegate.select(dataProvider.createSelection(entryIndex));
    const traceEventForSelection = dataProvider.eventByIndex(entryIndex);
    if (traceEventForSelection) {
      ModificationsManager.activeManager()?.bringEntryLabelForwardIfExists(traceEventForSelection);
    }
  }
  /**
   * This is invoked when the user uses their KEYBOARD ONLY to navigate between
   * events.
   * It IS NOT called when the user uses the mouse. See `onEntryInvoked`.
   */
  onEntrySelected(dataProvider, event) {
    this.#updateSelectedEntryStatus(dataProvider, event);
    const entryIndex = event.data;
    const toSelectionObject = this.#selectionIfTraceEvent(entryIndex, dataProvider);
    if (toSelectionObject && toSelectionObject !== this.#linkSelectionAnnotation?.entryTo) {
      this.updateLinkSelectionAnnotationWithToEntry(dataProvider, entryIndex);
    }
  }
  handleToEntryOfLinkBetweenEntriesSelection(toIndex) {
    if (this.#linkSelectionAnnotation && toIndex === -1) {
      ModificationsManager.activeManager()?.removeAnnotation(this.#linkSelectionAnnotation);
    } else if (this.#linkSelectionAnnotation && this.#linkSelectionAnnotation?.entryTo && this.#linkSelectionAnnotation?.entryFrom.ts > this.#linkSelectionAnnotation?.entryTo.ts) {
      const entryFrom = this.#linkSelectionAnnotation.entryFrom;
      const entryTo = this.#linkSelectionAnnotation.entryTo;
      this.#linkSelectionAnnotation.entryTo = entryFrom;
      this.#linkSelectionAnnotation.entryFrom = entryTo;
      ModificationsManager.activeManager()?.updateAnnotation(this.#linkSelectionAnnotation);
    }
    this.#clearLinkSelectionAnnotation(false);
  }
  resizeToPreferredHeights() {
    if (!this.isShowing()) {
      this.needsResizeToPreferredHeights = true;
      return;
    }
    this.needsResizeToPreferredHeights = false;
    this.networkPane.element.classList.toggle(
      "timeline-network-resizer-disabled",
      !this.networkDataProvider.isExpanded()
    );
    this.networkSplitWidget.setSidebarSize(
      this.networkDataProvider.preferredHeight() + this.splitResizer.clientHeight + PerfUI.FlameChart.RulerHeight + 2
    );
  }
  setSearchableView(searchableView) {
    this.searchableView = searchableView;
  }
  // UI.SearchableView.Searchable implementation
  jumpToNextSearchResult() {
    if (!this.searchResults?.length) {
      return;
    }
    const index = typeof this.selectedSearchResult !== "undefined" ? this.searchResults.indexOf(this.selectedSearchResult) : -1;
    this.#selectSearchResult(Platform.NumberUtilities.mod(index + 1, this.searchResults.length));
  }
  jumpToPreviousSearchResult() {
    if (!this.searchResults?.length) {
      return;
    }
    const index = typeof this.selectedSearchResult !== "undefined" ? this.searchResults.indexOf(this.selectedSearchResult) : 0;
    this.#selectSearchResult(Platform.NumberUtilities.mod(index - 1, this.searchResults.length));
  }
  supportsCaseSensitiveSearch() {
    return true;
  }
  supportsWholeWordSearch() {
    return true;
  }
  supportsRegexSearch() {
    return true;
  }
  #selectSearchResult(searchResultIndex) {
    this.searchableView.updateCurrentMatchIndex(searchResultIndex);
    const matchedResult = this.searchResults?.at(searchResultIndex) ?? null;
    if (!matchedResult) {
      return;
    }
    switch (matchedResult.provider) {
      case "main": {
        this.delegate.select(this.mainDataProvider.createSelection(matchedResult.index));
        this.mainFlameChart.showPopoverForSearchResult(matchedResult.index);
        break;
      }
      case "network": {
        this.delegate.select(this.networkDataProvider.createSelection(matchedResult.index));
        this.networkFlameChart.showPopoverForSearchResult(matchedResult.index);
        break;
      }
      case "other":
        break;
      default:
        Platform.assertNever(matchedResult.provider, `Unknown SearchResult[provider]: ${matchedResult.provider}`);
    }
    this.selectedSearchResult = matchedResult;
  }
  updateSearchResults(shouldJump, jumpBackwards) {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      return;
    }
    const oldSelectedSearchResult = this.selectedSearchResult;
    delete this.selectedSearchResult;
    this.searchResults = [];
    if (!this.searchRegex) {
      return;
    }
    const regExpFilter = new TimelineRegExp(this.searchRegex);
    const visibleWindow = traceBoundsState.micro.timelineTraceWindow;
    const mainMatches = this.mainDataProvider.search(visibleWindow, regExpFilter);
    const networkMatches = this.networkDataProvider.search(visibleWindow, regExpFilter);
    this.searchResults = mainMatches.concat(networkMatches).sort((m1, m2) => {
      return m1.startTimeMilli - m2.startTimeMilli;
    });
    this.searchableView.updateSearchMatchesCount(this.searchResults.length);
    this.#updateFlameChartDimmerWithIndices(
      this.#searchDimmer,
      mainMatches.map((m) => m.index),
      networkMatches.map((m) => m.index)
    );
    if (!shouldJump || !this.searchResults.length) {
      return;
    }
    let selectedIndex = this.#indexOfSearchResult(oldSelectedSearchResult);
    if (selectedIndex === -1) {
      selectedIndex = jumpBackwards ? this.searchResults.length - 1 : 0;
    }
    this.#selectSearchResult(selectedIndex);
  }
  #indexOfSearchResult(target) {
    if (!target) {
      return -1;
    }
    return this.searchResults?.findIndex((result) => {
      return result.provider === target.provider && result.index === target.index;
    }) ?? -1;
  }
  /**
   * Returns the indexes of the elements that matched the most recent
   * query. Elements are indexed by the data provider and correspond
   * to their position in the data provider entry data array.
   * Public only for tests.
   */
  getSearchResults() {
    return this.searchResults;
  }
  onSearchCanceled() {
    if (typeof this.selectedSearchResult !== "undefined") {
      this.delegate.select(null);
    }
    delete this.searchResults;
    delete this.selectedSearchResult;
    delete this.searchRegex;
    this.mainFlameChart.showPopoverForSearchResult(null);
    this.networkFlameChart.showPopoverForSearchResult(null);
    this.#updateFlameChartDimmerWithEvents(this.#searchDimmer, null);
  }
  performSearch(searchConfig, shouldJump, jumpBackwards) {
    this.searchRegex = searchConfig.toSearchRegex().regex;
    this.updateSearchResults(shouldJump, jumpBackwards);
  }
  togglePopover({ event, show }) {
    const entryIndex = this.mainDataProvider.indexForEvent(event);
    if (show && entryIndex) {
      this.mainFlameChart.setSelectedEntry(entryIndex);
      this.mainFlameChart.showPopoverForSearchResult(entryIndex);
    } else {
      this.mainFlameChart.hideHighlight();
    }
  }
  overlays() {
    return this.#overlays;
  }
  selectDetailsViewTab(tabName, node) {
    this.detailsView.selectTab(tabName, node);
  }
}
export class Selection {
  timelineSelection;
  entryIndex;
  constructor(selection, entryIndex) {
    this.timelineSelection = selection;
    this.entryIndex = entryIndex;
  }
}
export const FlameChartStyle = {
  textColor: "#333"
};
export class TimelineFlameChartMarker {
  #startTime;
  startOffset;
  style;
  constructor(startTime, startOffset, style) {
    this.#startTime = startTime;
    this.startOffset = startOffset;
    this.style = style;
  }
  startTime() {
    return this.#startTime;
  }
  color() {
    return this.style.color;
  }
  title() {
    if (this.style.lowPriority) {
      return null;
    }
    const startTime = i18n.TimeUtilities.millisToString(this.startOffset);
    return i18nString(UIStrings.sAtS, { PH1: this.style.title, PH2: startTime });
  }
  draw(context, x, _height, pixelsPerMillisecond) {
    const lowPriorityVisibilityThresholdInPixelsPerMs = 4;
    if (this.style.lowPriority && pixelsPerMillisecond < lowPriorityVisibilityThresholdInPixelsPerMs) {
      return;
    }
    if (!this.style.tall) {
      return;
    }
    context.save();
    context.strokeStyle = this.style.color;
    context.lineWidth = this.style.lineWidth;
    context.translate(this.style.lineWidth < 1 || this.style.lineWidth & 1 ? 0.5 : 0, 0.5);
    context.beginPath();
    context.moveTo(x, 0);
    context.setLineDash(this.style.dashStyle);
    context.lineTo(x, context.canvas.height);
    context.stroke();
    context.restore();
  }
}
export var ColorBy = /* @__PURE__ */ ((ColorBy2) => {
  ColorBy2["URL"] = "URL";
  return ColorBy2;
})(ColorBy || {});
export function groupForLevel(groups, level) {
  const groupForLevel2 = groups.find((group, groupIndex) => {
    const nextGroup = groups.at(groupIndex + 1);
    const groupEndLevel = nextGroup ? nextGroup.startLevel - 1 : Infinity;
    return group.startLevel <= level && groupEndLevel >= level;
  });
  return groupForLevel2 ?? null;
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ENTRY_LABEL_ANNOTATION_CLICKED"] = "EntryLabelAnnotationClicked";
  return Events2;
})(Events || {});
//# sourceMappingURL=TimelineFlameChartView.js.map
