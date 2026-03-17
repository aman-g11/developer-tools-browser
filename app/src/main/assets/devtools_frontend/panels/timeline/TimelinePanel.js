"use strict";
import "../../ui/legacy/legacy.js";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as AiAssistanceModel from "../../models/ai_assistance/ai_assistance.js";
import * as Badges from "../../models/badges/badges.js";
import * as CrUXManager from "../../models/crux-manager/crux-manager.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as Trace from "../../models/trace/trace.js";
import * as SourceMapsResolver from "../../models/trace_source_maps_resolver/trace_source_maps_resolver.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as TraceBounds from "../../services/trace_bounds/trace_bounds.js";
import * as Tracing from "../../services/tracing/tracing.js";
import * as Adorners from "../../ui/components/adorners/adorners.js";
import * as Dialogs from "../../ui/components/dialogs/dialogs.js";
import * as LegacyWrapper from "../../ui/components/legacy_wrapper/legacy_wrapper.js";
import * as Snackbars from "../../ui/components/snackbars/snackbars.js";
import { Link } from "../../ui/kit/kit.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import * as SettingsUI from "../../ui/legacy/components/settings_ui/settings_ui.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as MobileThrottling from "../mobile_throttling/mobile_throttling.js";
import { ActiveFilters } from "./ActiveFilters.js";
import * as AnnotationHelpers from "./AnnotationHelpers.js";
import { TraceLoadEvent } from "./BenchmarkEvents.js";
import * as TimelineComponents from "./components/components.js";
import * as TimelineInsights from "./components/insights/insights.js";
import { IsolateSelector } from "./IsolateSelector.js";
import { AnnotationModifiedEvent, ModificationsManager } from "./ModificationsManager.js";
import * as Overlays from "./overlays/overlays.js";
import { traceJsonGenerator } from "./SaveFileFormatter.js";
import { StatusDialog } from "./StatusDialog.js";
import { TimelineController } from "./TimelineController.js";
import { Tab } from "./TimelineDetailsView.js";
import { Events as TimelineFlameChartViewEvents, TimelineFlameChartView } from "./TimelineFlameChartView.js";
import { TimelineHistoryManager } from "./TimelineHistoryManager.js";
import { TimelineLoader } from "./TimelineLoader.js";
import { TimelineMiniMap } from "./TimelineMiniMap.js";
import timelinePanelStyles from "./timelinePanel.css.js";
import {
  rangeForSelection,
  selectionFromEvent,
  selectionIsRange,
  selectionsEqual
} from "./TimelineSelection.js";
import { TimelineUIUtils } from "./TimelineUIUtils.js";
import { createHiddenTracksOverlay } from "./TrackConfigBanner.js";
import { UIDevtoolsController } from "./UIDevtoolsController.js";
import { UIDevtoolsUtils } from "./UIDevtoolsUtils.js";
import * as Utils from "./utils/utils.js";
const UIStrings = {
  /**
   * @description Text that appears when user drag and drop something (for example, a file) in Timeline Panel of the Performance panel
   */
  dropTimelineFileOrUrlHere: "Drop trace file or URL here",
  /**
   * @description Title of disable capture jsprofile setting in timeline panel of the performance panel
   */
  disableJavascriptSamples: "Disable JavaScript samples",
  /**
   *@description Title of capture layers and pictures setting in timeline panel of the performance panel
   */
  enableAdvancedPaint: "Enable advanced paint instrumentation (slow)",
  /**
   * @description Title of CSS selector stats setting in timeline panel of the performance panel
   */
  enableSelectorStats: "Enable CSS selector stats (slow)",
  /**
   * @description Title of show screenshots setting in timeline panel of the performance panel
   */
  screenshots: "Screenshots",
  /**
   * @description Text for the memory of the page
   */
  memory: "Memory",
  /**
   * @description Text to clear content
   */
  clear: "Clear",
  /**
   * @description A label for a button that fixes something.
   */
  fixMe: "Fix me",
  /**
   * @description Tooltip text that appears when hovering over the largeicon load button
   */
  loadTrace: "Load trace\u2026",
  /**
   * @description Text to take screenshots
   */
  captureScreenshots: "Capture screenshots",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  showMemoryTimeline: "Show memory timeline",
  /**
   * @description Tooltip text that appears when hovering over the largeicon settings gear in show settings pane setting in timeline panel of the performance panel
   */
  captureSettings: "Capture settings",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  disablesJavascriptSampling: "Disables JavaScript sampling, reduces overhead when running against mobile devices",
  /**
   *@description Text in Timeline Panel of the Performance panel
   */
  capturesAdvancedPaint: "Captures advanced paint instrumentation, introduces significant performance overhead",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  capturesSelectorStats: "Captures CSS selector statistics",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  network: "Network:",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  cpu: "CPU:",
  /**
   * @description Title of the 'Network conditions' tool in the bottom drawer
   */
  networkConditions: "Network conditions",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  CpuThrottlingIsEnabled: "- CPU throttling is enabled",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  NetworkThrottlingIsEnabled: "- Network throttling is enabled",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  SignificantOverheadDueToPaint: "- Significant overhead due to paint instrumentation",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  SelectorStatsEnabled: "- Selector stats is enabled",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  JavascriptSamplingIsDisabled: "- JavaScript sampling is disabled",
  /**
   *@description Text in Timeline Panel of the Performance panel
   */
  stoppingTimeline: "Stopping timeline\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  received: "Received",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  processed: "Processed",
  /**
   * @description Text to close something
   */
  close: "Close",
  /**
   * @description Status text to indicate the recording has failed in the Performance panel
   */
  recordingFailed: "Recording failed",
  /**
   * @description Status text to indicate that exporting the trace has failed
   */
  exportingFailed: "Exporting the trace failed",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  initializingTracing: "Initializing tracing\u2026",
  /**
   * @description Text to indicate the progress of a trace. Informs the user that we are currently
   * creating a performance trace.
   */
  tracing: "Tracing\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  bufferUsage: "Buffer usage",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  loadingTrace: "Loading trace\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel
   */
  processingTrace: "Processing trace\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel. Shown to the user after they request to download the trace.
   */
  preparingTraceForDownload: "Preparing\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel. Shown to the user after they request to download the trace.
   */
  compressingTraceForDownload: "Compressing\u2026",
  /**
   * @description Text in Timeline Panel of the Performance panel. Shown to the user after they request to download the trace.
   */
  encodingTraceForDownload: "Encoding\u2026",
  /**
   * @description Tooltip description for a checkbox that toggles the visibility of data added by extensions of this panel (Performance).
   */
  showDataAddedByExtensions: "Show data added by extensions of the Performance panel",
  /**
   * Label for a checkbox that toggles the visibility of data added by extensions of this panel (Performance).
   */
  showCustomtracks: "Show custom tracks",
  /**
   * @description Tooltip for the the sidebar toggle in the Performance panel. Command to open/show the sidebar.
   */
  showSidebar: "Show sidebar",
  /**
   * @description Tooltip for the the sidebar toggle in the Performance panel. Command to close the sidebar.
   */
  hideSidebar: "Hide sidebar",
  /**
   * @description Screen reader announcement when the sidebar is shown in the Performance panel.
   */
  sidebarShown: "Performance sidebar shown",
  /**
   * @description Screen reader announcement when the sidebar is hidden in the Performance panel.
   */
  sidebarHidden: "Performance sidebar hidden",
  /**
   * @description Screen reader announcement when the user clears their selection
   */
  selectionCleared: "Selection cleared",
  /**
   * @description Screen reader announcement when the user selects a frame.
   */
  frameSelected: "Frame selected",
  /**
   * @description Screen reader announcement when the user selects a trace event.
   * @example {Paint} PH1
   */
  eventSelected: "Event {PH1} selected",
  /**
   * @description Text of a hyperlink to documentation.
   */
  learnMore: "Learn more",
  /**
   * @description Tooltip text for a button that takes the user back to the default view which shows performance metrics that are live.
   */
  backToLiveMetrics: "Go back to the live metrics page",
  /**
   * @description Description of the Timeline zoom keyboard instructions that appear in the shortcuts dialog
   */
  timelineZoom: "Zoom",
  /**
   * @description Description of the Timeline scrolling & panning instructions that appear in the shortcuts dialog.
   */
  timelineScrollPan: "Scroll & Pan",
  /**
   * @description Title for the Dim 3rd Parties checkbox.
   */
  dimThirdParties: "Dim 3rd parties",
  /**
   * @description Description for the Dim 3rd Parties checkbox tooltip describing how 3rd parties are classified.
   */
  thirdPartiesByThirdPartyWeb: "3rd parties classified by third-party-web",
  /**
   * @description Title of the shortcuts dialog shown to the user that lists keyboard shortcuts.
   */
  shortcutsDialogTitle: "Keyboard shortcuts for flamechart",
  /**
   * @description Notification shown to the user whenever DevTools receives an external request.
   */
  externalRequestReceived: "`DevTools` received an external request"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/TimelinePanel.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let timelinePanelInstance;
export class TimelinePanel extends Common.ObjectWrapper.eventMixin(UI.Panel.Panel) {
  dropTarget;
  recordingOptionUIControls;
  state;
  recordingPageReload;
  toggleRecordAction;
  recordReloadAction;
  #historyManager;
  disableCaptureJSProfileSetting;
  captureLayersAndPicturesSetting;
  captureSelectorStatsSetting;
  #thirdPartyTracksSetting;
  showScreenshotsSetting;
  showMemorySetting;
  panelToolbar;
  panelRightToolbar;
  timelinePane;
  #minimapComponent = new TimelineMiniMap();
  #viewMode = { mode: "LANDING_PAGE" };
  #dimThirdPartiesSetting = null;
  #thirdPartyCheckbox = null;
  #isNode = Root.Runtime.Runtime.isNode();
  #onAnnotationModifiedEventBound = this.#onAnnotationModifiedEvent.bind(this);
  /**
   * We get given any filters for a new trace when it is recorded/imported.
   * Because the user can then use the dropdown to navigate to another trace,
   * we store the filters by the trace index, so if the user then navigates back
   * to a previous trace we can reinstate the filters from this map.
   */
  #exclusiveFilterPerTrace = /* @__PURE__ */ new Map();
  /**
   * This widget holds the timeline sidebar which shows Insights & Annotations,
   * and the main UI which shows the timeline
   */
  #splitWidget = new UI.SplitWidget.SplitWidget(
    true,
    // isVertical
    false,
    // secondIsSidebar
    "timeline-panel-sidebar-state",
    // settingName (to persist the open/closed state for the user)
    TimelineComponents.Sidebar.DEFAULT_SIDEBAR_WIDTH_PX
  );
  statusPaneContainer;
  flameChart;
  #searchableView;
  showSettingsPaneButton;
  showSettingsPaneSetting;
  settingsPane;
  controller;
  cpuProfiler;
  clearButton;
  loadButton;
  saveButton;
  homeButton;
  askAiButton;
  statusDialog = null;
  landingPage;
  loader;
  showScreenshotsToolbarCheckbox;
  showMemoryToolbarCheckbox;
  networkThrottlingSelect;
  cpuThrottlingSelect;
  fileSelectorElement;
  selection = null;
  traceLoadStart;
  #traceEngineModel;
  #externalAIConversationData = null;
  #sourceMapsResolver = null;
  #entityMapper = null;
  #onSourceMapsNodeNamesResolvedBound = this.#onSourceMapsNodeNamesResolved.bind(this);
  #sidebarToggleButton = this.#splitWidget.createShowHideSidebarButton(
    i18nString(UIStrings.showSidebar),
    i18nString(UIStrings.hideSidebar),
    // These are used to announce to screen-readers and not shown visibly.
    i18nString(UIStrings.sidebarShown),
    i18nString(UIStrings.sidebarHidden),
    "timeline.sidebar"
    // jslog context
  );
  #sideBar = new TimelineComponents.Sidebar.SidebarWidget();
  #eventToRelatedInsights = /* @__PURE__ */ new Map();
  #shortcutsDialog = new Dialogs.ShortcutDialog.ShortcutDialog();
  /**
   * Track if the user has opened the shortcuts dialog before. We do this so that the
   * very first time the performance panel is open after the shortcuts dialog ships, we can
   * automatically pop it open to aid discovery.
   */
  #userHadShortcutsDialogOpenedOnce = Common.Settings.Settings.instance().createSetting(
    "timeline.user-had-shortcuts-dialog-opened-once",
    false
  );
  /**
   * Rather than auto-pop the sidebar every time the user records a trace,
   * which could get annoying, we instead persist the state of the sidebar
   * visibility to a setting so it's restored across sessions.
   * However, sometimes we have to automatically hide the sidebar, like when a
   * trace recording is happening, or the user is on the landing page. In those
   * times, we toggle this flag to true. Then, when we enter the VIEWING_TRACE
   * mode, we check this flag and pop the sidebar open if it's set to true.
   * Longer term a better fix here would be to divide the 3 UI screens
   * (status pane, landing page, trace view) into distinct components /
   * widgets, to avoid this complexity.
   */
  #restoreSidebarVisibilityOnTraceLoad = false;
  /**
   * Navigation radio buttons located in the shortcuts dialog.
   */
  #navigationRadioButtons = document.createElement("form");
  #modernNavRadioButton = UI.UIUtils.createRadioButton(
    "flamechart-selected-navigation",
    "Modern - normal scrolling",
    "timeline.select-modern-navigation"
  );
  #classicNavRadioButton = UI.UIUtils.createRadioButton(
    "flamechart-selected-navigation",
    "Classic - scroll to zoom",
    "timeline.select-classic-navigation"
  );
  #onMainEntryHovered;
  #hiddenTracksInfoBarByParsedTrace = /* @__PURE__ */ new WeakMap();
  #resourceLoader;
  constructor(resourceLoader, traceModel) {
    super("timeline");
    this.#resourceLoader = resourceLoader;
    this.registerRequiredCSS(timelinePanelStyles);
    const adornerContent = document.createElement("span");
    adornerContent.innerHTML = `<div style="
      font-size: 12px;
      transform: scale(1.25);
      color: transparent;
      background: linear-gradient(90deg,CLICK255 0 0 / 100%) 0%, rgb(255 154 0 / 100%) 10%, rgb(208 222 33 / 100%) 20%, rgb(79 220 74 / 100%) 30%, rgb(63 218 216 / 100%) 40%, rgb(47 201 226 / 100%) 50%, rgb(28 127 238 / 100%) 60%, rgb(95 21 242 / 100%) 70%, rgb(186 12 248 / 100%) 80%, rgb(251 7 217 / 100%) 90%, rgb(255 0 0 / 100%) 100%);
      -webkit-background-clip: text;
      ">\u{1F4AB}</div>`;
    const adorner = new Adorners.Adorner.Adorner();
    adorner.classList.add("fix-perf-icon");
    adorner.name = i18nString(UIStrings.fixMe);
    adorner.append(adornerContent);
    this.#traceEngineModel = traceModel || this.#instantiateNewModel();
    this.element.addEventListener("contextmenu", this.contextMenu.bind(this), false);
    this.dropTarget = new UI.DropTarget.DropTarget(
      this.element,
      [UI.DropTarget.Type.File, UI.DropTarget.Type.URI],
      i18nString(UIStrings.dropTimelineFileOrUrlHere),
      this.handleDrop.bind(this)
    );
    this.recordingOptionUIControls = [];
    this.state = "Idle" /* IDLE */;
    this.recordingPageReload = false;
    this.toggleRecordAction = UI.ActionRegistry.ActionRegistry.instance().getAction("timeline.toggle-recording");
    this.recordReloadAction = UI.ActionRegistry.ActionRegistry.instance().getAction("timeline.record-reload");
    this.#historyManager = new TimelineHistoryManager(this.#minimapComponent, this.#isNode);
    this.traceLoadStart = null;
    this.disableCaptureJSProfileSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-disable-js-sampling",
      false,
      Common.Settings.SettingStorageType.SESSION
    );
    this.disableCaptureJSProfileSetting.setTitle(i18nString(UIStrings.disableJavascriptSamples));
    this.captureLayersAndPicturesSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-capture-layers-and-pictures",
      false,
      Common.Settings.SettingStorageType.SESSION
    );
    this.captureLayersAndPicturesSetting.setTitle(i18nString(UIStrings.enableAdvancedPaint));
    this.captureSelectorStatsSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-capture-selector-stats",
      false,
      Common.Settings.SettingStorageType.SESSION
    );
    this.captureSelectorStatsSetting.setTitle(i18nString(UIStrings.enableSelectorStats));
    this.showScreenshotsSetting = Common.Settings.Settings.instance().createSetting("timeline-show-screenshots", !this.#isNode);
    this.showScreenshotsSetting.setTitle(i18nString(UIStrings.screenshots));
    this.showScreenshotsSetting.addChangeListener(this.updateMiniMap, this);
    this.showMemorySetting = Common.Settings.Settings.instance().createSetting(
      "timeline-show-memory",
      false,
      Common.Settings.SettingStorageType.SESSION
    );
    this.showMemorySetting.setTitle(i18nString(UIStrings.memory));
    this.showMemorySetting.addChangeListener(this.onMemoryModeChanged, this);
    this.#dimThirdPartiesSetting = Common.Settings.Settings.instance().createSetting(
      "timeline-dim-third-parties",
      false,
      Common.Settings.SettingStorageType.SESSION
    );
    this.#dimThirdPartiesSetting.setTitle(i18nString(UIStrings.dimThirdParties));
    this.#dimThirdPartiesSetting.addChangeListener(this.onDimThirdPartiesChanged, this);
    this.#thirdPartyTracksSetting = TimelinePanel.extensionDataVisibilitySetting();
    this.#thirdPartyTracksSetting.addChangeListener(this.#extensionDataVisibilityChanged, this);
    this.#thirdPartyTracksSetting.setTitle(i18nString(UIStrings.showCustomtracks));
    const timelineToolbarContainer = this.element.createChild("div", "timeline-toolbar-container");
    timelineToolbarContainer.setAttribute("jslog", `${VisualLogging.toolbar()}`);
    timelineToolbarContainer.role = "toolbar";
    this.panelToolbar = timelineToolbarContainer.createChild("devtools-toolbar", "timeline-main-toolbar");
    this.panelToolbar.role = "presentation";
    this.panelToolbar.wrappable = true;
    this.panelRightToolbar = timelineToolbarContainer.createChild("devtools-toolbar");
    this.panelRightToolbar.role = "presentation";
    if (!this.#isNode && this.canRecord()) {
      this.createSettingsPane();
      this.updateShowSettingsToolbarButton();
    }
    this.timelinePane = new UI.Widget.VBox();
    const topPaneElement = this.timelinePane.element.createChild("div", "hbox");
    topPaneElement.id = "timeline-overview-panel";
    this.#minimapComponent.show(topPaneElement);
    this.#minimapComponent.addEventListener(PerfUI.TimelineOverviewPane.Events.OVERVIEW_PANE_MOUSE_MOVE, (event) => {
      this.flameChart.addTimestampMarkerOverlay(event.data.timeInMicroSeconds);
    });
    this.#minimapComponent.addEventListener(PerfUI.TimelineOverviewPane.Events.OVERVIEW_PANE_MOUSE_LEAVE, async () => {
      await this.flameChart.removeTimestampMarkerOverlay();
    });
    this.statusPaneContainer = this.timelinePane.element.createChild("div", "status-pane-container fill");
    this.createFileSelector();
    this.flameChart = new TimelineFlameChartView(this);
    this.element.addEventListener(
      "toggle-popover",
      (event) => this.flameChart.togglePopover(event.detail)
    );
    this.#onMainEntryHovered = this.#onEntryHovered.bind(this, this.flameChart.getMainDataProvider());
    this.flameChart.getMainFlameChart().addEventListener(
      PerfUI.FlameChart.Events.ENTRY_HOVERED,
      this.#onMainEntryHovered
    );
    this.flameChart.addEventListener(TimelineFlameChartViewEvents.ENTRY_LABEL_ANNOTATION_CLICKED, (event) => {
      const selection = selectionFromEvent(event.data.entry);
      this.select(selection);
    });
    this.#searchableView = new UI.SearchableView.SearchableView(this.flameChart, null);
    this.#searchableView.setMinimumSize(0, 100);
    this.#searchableView.setMinimalSearchQuerySize(2);
    this.#searchableView.element.classList.add("searchable-view");
    this.#searchableView.show(this.timelinePane.element);
    this.flameChart.show(this.#searchableView.element);
    this.flameChart.setSearchableView(this.#searchableView);
    this.#searchableView.hideWidget();
    this.#splitWidget.setMainWidget(this.timelinePane);
    this.#splitWidget.setSidebarWidget(this.#sideBar);
    this.#splitWidget.enableShowModeSaving();
    this.#splitWidget.show(this.element);
    this.flameChart.overlays().addEventListener(Overlays.Overlays.TimeRangeMouseOverEvent.eventName, (event) => {
      const { overlay } = event;
      const overlayBounds = Overlays.Overlays.traceWindowContainingOverlays([overlay]);
      if (!overlayBounds) {
        return;
      }
      this.#minimapComponent.highlightBounds(
        overlayBounds,
        /* withBracket */
        false
      );
    });
    this.flameChart.overlays().addEventListener(Overlays.Overlays.TimeRangeMouseOutEvent.eventName, () => {
      this.#minimapComponent.clearBoundsHighlight();
    });
    this.#sideBar.element.addEventListener(TimelineInsights.SidebarInsight.InsightDeactivated.eventName, () => {
      this.#setActiveInsight(null);
    });
    this.#sideBar.element.addEventListener(TimelineInsights.SidebarInsight.InsightActivated.eventName, (event) => {
      const { model, insightSetKey } = event;
      this.#setActiveInsight({ model, insightSetKey });
      if (model.insightKey === Trace.Insights.Types.InsightKeys.THIRD_PARTIES) {
        void window.scheduler.postTask(() => {
          this.#openSummaryTab();
        }, { priority: "background" });
      }
    });
    this.#sideBar.element.addEventListener(TimelineInsights.SidebarInsight.InsightProvideOverlays.eventName, (event) => {
      const { overlays, options } = event;
      void window.scheduler.postTask(() => {
        this.flameChart.setOverlays(overlays, options);
        const overlaysBounds = Overlays.Overlays.traceWindowContainingOverlays(overlays);
        if (overlaysBounds) {
          this.#minimapComponent.highlightBounds(
            overlaysBounds,
            /* withBracket */
            true
          );
        } else {
          this.#minimapComponent.clearBoundsHighlight();
        }
      }, { priority: "user-visible" });
    });
    this.#sideBar.contentElement.addEventListener(TimelineInsights.EventRef.EventReferenceClick.eventName, (event) => {
      this.select(selectionFromEvent(event.event));
    });
    this.#sideBar.element.addEventListener(TimelineComponents.Sidebar.RemoveAnnotation.eventName, (event) => {
      const { removedAnnotation } = event;
      ModificationsManager.activeManager()?.removeAnnotation(removedAnnotation);
    });
    this.#sideBar.element.addEventListener(TimelineComponents.Sidebar.RevealAnnotation.eventName, (event) => {
      this.flameChart.revealAnnotation(event.annotation);
    });
    this.#sideBar.element.addEventListener(TimelineComponents.Sidebar.HoverAnnotation.eventName, (event) => {
      this.flameChart.hoverAnnotationInSidebar(event.annotation);
    });
    this.#sideBar.element.addEventListener(TimelineComponents.Sidebar.AnnotationHoverOut.eventName, () => {
      this.flameChart.sidebarAnnotationHoverOut();
    });
    this.#sideBar.element.addEventListener(TimelineInsights.SidebarInsight.InsightSetHovered.eventName, (event) => {
      if (event.bounds) {
        this.#minimapComponent.highlightBounds(
          event.bounds,
          /* withBracket */
          true
        );
      } else {
        this.#minimapComponent.clearBoundsHighlight();
      }
    });
    this.#sideBar.element.addEventListener(TimelineInsights.SidebarInsight.InsightSetZoom.eventName, (event) => {
      TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
        event.bounds,
        { ignoreMiniMapBounds: true, shouldAnimate: true }
      );
    });
    this.onMemoryModeChanged();
    this.populateToolbar();
    this.#showLandingPage();
    this.updateTimelineControls();
    SDK.TargetManager.TargetManager.instance().addEventListener(
      SDK.TargetManager.Events.SUSPEND_STATE_CHANGED,
      this.onSuspendStateChanged,
      this
    );
    const profilerModels = SDK.TargetManager.TargetManager.instance().models(SDK.CPUProfilerModel.CPUProfilerModel);
    for (const model of profilerModels) {
      for (const message of model.registeredConsoleProfileMessages) {
        this.consoleProfileFinished(message);
      }
    }
    SDK.TargetManager.TargetManager.instance().observeModels(
      SDK.CPUProfilerModel.CPUProfilerModel,
      {
        modelAdded: (model) => {
          model.addEventListener(
            SDK.CPUProfilerModel.Events.CONSOLE_PROFILE_FINISHED,
            (event) => this.consoleProfileFinished(event.data)
          );
        },
        modelRemoved: (_model) => {
        }
      }
    );
  }
  zoomEvent(event) {
    this.flameChart.zoomEvent(event);
  }
  /**
   * Activates an insight and ensures the sidebar is open too.
   * Pass `highlightInsight: true` to flash the insight with the background highlight colour.
   */
  #setActiveInsight(insight, opts = { highlightInsight: false }) {
    if (insight && this.#splitWidget.showMode() !== UI.SplitWidget.ShowMode.BOTH) {
      this.#splitWidget.showBoth();
    }
    this.#sideBar.setActiveInsight(insight, { highlight: opts.highlightInsight });
    this.flameChart.setActiveInsight(insight);
    if (insight) {
      const selectedInsight = new SelectedInsight(insight);
      UI.Context.Context.instance().setFlavor(SelectedInsight, selectedInsight);
    } else {
      UI.Context.Context.instance().setFlavor(SelectedInsight, null);
    }
  }
  /**
   * This disables the 3P checkbox in the toolbar.
   * If the checkbox was checked, we flip it to indeterminiate to communicate it doesn't currently apply.
   */
  set3PCheckboxDisabled(disabled) {
    this.#thirdPartyCheckbox?.applyEnabledState(!disabled);
    if (this.#dimThirdPartiesSetting?.get()) {
      this.#thirdPartyCheckbox?.setIndeterminate(disabled);
    }
  }
  static instance(opts = void 0) {
    if (opts) {
      timelinePanelInstance = new TimelinePanel(opts.resourceLoader, opts.traceModel);
    }
    if (!timelinePanelInstance) {
      throw new Error("No TimelinePanel instance");
    }
    return timelinePanelInstance;
  }
  static removeInstance() {
    SourceMapsResolver.SourceMapsResolver.clearResolvedNodeNames();
    Trace.Helpers.SyntheticEvents.SyntheticEventsManager.reset();
    TraceBounds.TraceBounds.BoundsManager.removeInstance();
    ModificationsManager.reset();
    ActiveFilters.removeInstance();
    timelinePanelInstance = void 0;
  }
  #instantiateNewModel() {
    const config = Trace.Types.Configuration.defaults();
    config.showAllEvents = Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_SHOW_ALL_EVENTS);
    config.includeRuntimeCallStats = Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_V8_RUNTIME_CALL_STATS);
    config.debugMode = Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_DEBUG_MODE);
    const traceEngineModel = Trace.TraceModel.Model.createWithAllHandlers(config);
    traceEngineModel.addEventListener(Trace.TraceModel.ModelUpdateEvent.eventName, (e) => {
      const updateEvent = e;
      const str = i18nString(UIStrings.processed);
      const traceParseMaxProgress = 0.7;
      if (updateEvent.data.type === Trace.TraceModel.ModelUpdateType.COMPLETE) {
        this.statusDialog?.updateProgressBar(str, 100 * traceParseMaxProgress);
      } else if (updateEvent.data.type === Trace.TraceModel.ModelUpdateType.PROGRESS_UPDATE) {
        const data = updateEvent.data.data;
        this.statusDialog?.updateProgressBar(str, data.percent * 100 * traceParseMaxProgress);
      }
    });
    this.#traceEngineModel = traceEngineModel;
    return this.#traceEngineModel;
  }
  static extensionDataVisibilitySetting() {
    return Common.Settings.Settings.instance().createSetting("timeline-show-extension-data", true);
  }
  searchableView() {
    return this.#searchableView;
  }
  wasShown() {
    super.wasShown();
    UI.Context.Context.instance().setFlavor(TimelinePanel, this);
    Host.userMetrics.panelLoaded("timeline", "DevTools.Launch.Timeline");
    const cruxManager = CrUXManager.CrUXManager.instance();
    cruxManager.addEventListener(CrUXManager.Events.FIELD_DATA_CHANGED, this.#onFieldDataChanged, this);
    this.#onFieldDataChanged();
  }
  willHide() {
    super.willHide();
    UI.Context.Context.instance().setFlavor(TimelinePanel, null);
    this.#historyManager.cancelIfShowing();
    const cruxManager = CrUXManager.CrUXManager.instance();
    cruxManager.removeEventListener(CrUXManager.Events.FIELD_DATA_CHANGED, this.#onFieldDataChanged, this);
  }
  #onFieldDataChanged() {
    const recs = Utils.Helpers.getThrottlingRecommendations();
    this.cpuThrottlingSelect?.updateRecommendedOption(recs.cpuOption);
    if (this.networkThrottlingSelect) {
      this.networkThrottlingSelect.recommendedConditions = recs.networkConditions;
    }
  }
  loadFromEvents(events) {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    this.prepareToLoadTimeline();
    this.loader = TimelineLoader.loadFromEvents(events, this);
  }
  loadFromTraceFile(traceFile) {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    this.prepareToLoadTimeline();
    this.loader = TimelineLoader.loadFromTraceFile(traceFile, this);
  }
  getFlameChart() {
    return this.flameChart;
  }
  /**
   * Determine if two view modes are equivalent. Useful because if
   * {@link TimelinePanel.#changeView} gets called and the new mode is identical to the current,
   * we can bail without doing any UI updates.
   */
  #viewModesEquivalent(m1, m2) {
    if (m1.mode === "LANDING_PAGE" && m2.mode === "LANDING_PAGE") {
      return true;
    }
    if (m1.mode === "STATUS_PANE_OVERLAY" && m2.mode === "STATUS_PANE_OVERLAY") {
      return true;
    }
    if (m1.mode === "VIEWING_TRACE" && m2.mode === "VIEWING_TRACE" && m1.traceIndex === m2.traceIndex) {
      return true;
    }
    return false;
  }
  #uninstallSourceMapsResolver() {
    if (this.#sourceMapsResolver) {
      SourceMapsResolver.SourceMapsResolver.clearResolvedNodeNames();
      this.#sourceMapsResolver.removeEventListener(
        SourceMapsResolver.SourceMappingsUpdated.eventName,
        this.#onSourceMapsNodeNamesResolvedBound
      );
      this.#sourceMapsResolver.uninstall();
      this.#sourceMapsResolver = null;
    }
  }
  #removeStatusPane() {
    if (this.statusDialog) {
      this.statusDialog.remove();
    }
    this.statusDialog = null;
  }
  hasActiveTrace() {
    return this.#viewMode.mode === "VIEWING_TRACE";
  }
  #changeView(newMode) {
    if (this.#viewModesEquivalent(this.#viewMode, newMode)) {
      return;
    }
    if (this.#viewMode.mode === "VIEWING_TRACE") {
      this.#uninstallSourceMapsResolver();
      this.#saveModificationsForActiveTrace();
      const manager = ModificationsManager.activeManager();
      if (manager) {
        manager.removeEventListener(AnnotationModifiedEvent.eventName, this.#onAnnotationModifiedEventBound);
      }
    }
    this.#viewMode = newMode;
    this.updateTimelineControls();
    switch (newMode.mode) {
      case "LANDING_PAGE": {
        this.#removeStatusPane();
        this.#showLandingPage();
        this.updateMiniMap();
        this.dispatchEventToListeners("IsViewingTrace" /* IS_VIEWING_TRACE */, false);
        this.#searchableView.hideWidget();
        return;
      }
      case "VIEWING_TRACE": {
        this.#hideLandingPage();
        this.#setModelForActiveTrace();
        this.#removeStatusPane();
        this.#showSidebarIfRequired();
        this.flameChart.dimThirdPartiesIfRequired();
        this.dispatchEventToListeners("IsViewingTrace" /* IS_VIEWING_TRACE */, true);
        return;
      }
      case "STATUS_PANE_OVERLAY": {
        this.#hideLandingPage();
        this.dispatchEventToListeners("IsViewingTrace" /* IS_VIEWING_TRACE */, false);
        this.#hideSidebar();
        return;
      }
      default:
        Platform.assertNever(newMode, "Unsupported TimelinePanel viewMode");
    }
  }
  #activeTraceIndex() {
    if (this.#viewMode.mode === "VIEWING_TRACE") {
      return this.#viewMode.traceIndex;
    }
    return null;
  }
  /**
   * Exposed for handling external requests.
   */
  get model() {
    return this.#traceEngineModel;
  }
  getOrCreateExternalAIConversationData() {
    if (!this.#externalAIConversationData) {
      const conversationHandler = AiAssistanceModel.ConversationHandler.ConversationHandler.instance();
      const focus = AiAssistanceModel.AIContext.getPerformanceAgentFocusFromModel(this.model);
      if (!focus) {
        throw new Error("could not create performance agent focus");
      }
      const conversation = new AiAssistanceModel.AiConversation.AiConversation(
        AiAssistanceModel.AiHistoryStorage.ConversationType.PERFORMANCE,
        [],
        void 0,
        /* isReadOnly */
        true,
        conversationHandler.aidaClient,
        void 0,
        /* isExternal */
        true
      );
      const selected = new AiAssistanceModel.PerformanceAgent.PerformanceTraceContext(focus);
      selected.external = true;
      this.#externalAIConversationData = {
        conversationHandler,
        conversation,
        selected
      };
    }
    return this.#externalAIConversationData;
  }
  invalidateExternalAIConversationData() {
    this.#externalAIConversationData = null;
  }
  /**
   * NOTE: this method only exists to enable some layout tests to be migrated to the new engine.
   * DO NOT use this method within DevTools. It is marked as deprecated so
   * within DevTools you are warned when using the method.
   * @deprecated
   **/
  getParsedTraceForLayoutTests() {
    const traceIndex = this.#activeTraceIndex();
    if (traceIndex === null) {
      throw new Error("No trace index active.");
    }
    const data = this.#traceEngineModel.parsedTrace(traceIndex)?.data;
    if (!data) {
      throw new Error("No trace engine data found.");
    }
    return data;
  }
  /**
   * NOTE: this method only exists to enable some layout tests to be migrated to the new engine.
   * DO NOT use this method within DevTools. It is marked as deprecated so
   * within DevTools you are warned when using the method.
   * @deprecated
   **/
  getTraceEngineRawTraceEventsForLayoutTests() {
    const traceIndex = this.#activeTraceIndex();
    if (traceIndex === null) {
      throw new Error("No trace index active.");
    }
    const data = this.#traceEngineModel.parsedTrace(traceIndex);
    if (!data) {
      throw new Error("No trace engine data found.");
    }
    return data.traceEvents;
  }
  #onEntryHovered(dataProvider, event) {
    const entryIndex = event.data;
    if (entryIndex === -1) {
      this.#minimapComponent.clearBoundsHighlight();
      return;
    }
    const traceEvent = dataProvider.eventByIndex(entryIndex);
    if (!traceEvent) {
      return;
    }
    const bounds = Trace.Helpers.Timing.traceWindowFromEvent(traceEvent);
    this.#minimapComponent.highlightBounds(
      bounds,
      /* withBracket */
      false
    );
  }
  loadFromCpuProfile(profile) {
    if (this.state !== "Idle" /* IDLE */ || profile === null) {
      return;
    }
    this.prepareToLoadTimeline();
    this.loader = TimelineLoader.loadFromCpuProfile(profile, this);
  }
  setState(state) {
    this.state = state;
    this.updateTimelineControls();
  }
  createSettingCheckbox(setting, tooltip) {
    const checkboxItem = new UI.Toolbar.ToolbarSettingCheckbox(setting, tooltip);
    this.recordingOptionUIControls.push(checkboxItem);
    return checkboxItem;
  }
  #addSidebarIconToToolbar() {
    if (this.panelToolbar.hasItem(this.#sidebarToggleButton)) {
      return;
    }
    this.panelToolbar.prependToolbarItem(this.#sidebarToggleButton);
  }
  /**
   * Used when the user deletes their last trace and is taken back to the
   * landing page - we don't add this icon until there is a trace loaded.
   */
  #removeSidebarIconFromToolbar() {
    this.panelToolbar.removeToolbarItem(this.#sidebarToggleButton);
  }
  /**
   * Returns false if DevTools is in a standalone context where tracing/recording are
   * NOT available.
   */
  canRecord() {
    return !Root.Runtime.Runtime.isTraceApp();
  }
  populateToolbar() {
    const canRecord = this.canRecord();
    if (canRecord || this.#isNode) {
      this.panelToolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton(this.toggleRecordAction));
    }
    if (canRecord) {
      this.panelToolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton(this.recordReloadAction));
    }
    this.clearButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.clear), "clear", void 0, "timeline.clear");
    this.clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.CLICK, () => this.onClearButton());
    this.panelToolbar.appendToolbarItem(this.clearButton);
    this.loadButton = new UI.Toolbar.ToolbarButton(i18nString(UIStrings.loadTrace), "import", void 0, "timeline.load-from-file");
    this.loadButton.addEventListener(UI.Toolbar.ToolbarButton.Events.CLICK, () => {
      Host.userMetrics.actionTaken(Host.UserMetrics.Action.PerfPanelTraceImported);
      this.selectFileToLoad();
    });
    const exportTraceOptions = new TimelineComponents.ExportTraceOptions.ExportTraceOptions();
    exportTraceOptions.data = {
      onExport: this.saveToFile.bind(this),
      buttonEnabled: this.state === "Idle" /* IDLE */ && this.#hasActiveTrace()
    };
    this.saveButton = new UI.Toolbar.ToolbarItem(exportTraceOptions);
    this.panelToolbar.appendSeparator();
    this.panelToolbar.appendToolbarItem(this.loadButton);
    this.panelToolbar.appendToolbarItem(this.saveButton);
    if (canRecord) {
      this.panelToolbar.appendSeparator();
      if (!this.#isNode) {
        this.homeButton = new UI.Toolbar.ToolbarButton(
          i18nString(UIStrings.backToLiveMetrics),
          "home",
          void 0,
          "timeline.back-to-live-metrics"
        );
        this.homeButton.addEventListener(UI.Toolbar.ToolbarButton.Events.CLICK, () => {
          this.#changeView({ mode: "LANDING_PAGE" });
          this.#historyManager.navigateToLandingPage();
        });
        this.panelToolbar.appendToolbarItem(this.homeButton);
        this.panelToolbar.appendSeparator();
      }
    }
    this.panelToolbar.appendToolbarItem(this.#historyManager.button());
    this.panelToolbar.appendSeparator();
    if (!this.#isNode) {
      this.showScreenshotsToolbarCheckbox = this.createSettingCheckbox(this.showScreenshotsSetting, i18nString(UIStrings.captureScreenshots));
      this.panelToolbar.appendToolbarItem(this.showScreenshotsToolbarCheckbox);
    }
    this.showMemoryToolbarCheckbox = this.createSettingCheckbox(this.showMemorySetting, i18nString(UIStrings.showMemoryTimeline));
    if (canRecord) {
      this.panelToolbar.appendToolbarItem(this.showMemoryToolbarCheckbox);
      this.panelToolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton("components.collect-garbage"));
    }
    this.panelToolbar.appendSeparator();
    this.panelToolbar.appendToolbarItem(
      new UI.Toolbar.ToolbarItem(TimelineComponents.IgnoreListSetting.IgnoreListSetting.createWidgetElement())
    );
    if (this.#dimThirdPartiesSetting) {
      const dimThirdPartiesCheckbox = this.createSettingCheckbox(this.#dimThirdPartiesSetting, i18nString(UIStrings.thirdPartiesByThirdPartyWeb));
      this.#thirdPartyCheckbox = dimThirdPartiesCheckbox;
      this.panelToolbar.appendToolbarItem(dimThirdPartiesCheckbox);
    }
    if (this.#isNode) {
      const isolateSelector = new IsolateSelector();
      this.panelToolbar.appendSeparator();
      this.panelToolbar.appendToolbarItem(isolateSelector);
    }
    if (!this.#isNode && canRecord) {
      this.panelRightToolbar.appendSeparator();
      this.panelRightToolbar.appendToolbarItem(this.showSettingsPaneButton);
    }
  }
  #setupNavigationSetting() {
    const currentNavSetting = Common.Settings.moduleSetting("flamechart-selected-navigation").get();
    const hideTheDialogForTests = localStorage.getItem("hide-shortcuts-dialog-for-test");
    const userHadShortcutsDialogOpenedOnce = this.#userHadShortcutsDialogOpenedOnce.get();
    this.#shortcutsDialog.prependElement(this.#navigationRadioButtons);
    const dialogToolbarItem = new UI.Toolbar.ToolbarItem(this.#shortcutsDialog);
    dialogToolbarItem.element.setAttribute(
      "jslog",
      `${VisualLogging.action().track({ click: true }).context("timeline.shortcuts-dialog-toggle")}`
    );
    this.panelRightToolbar.appendToolbarItem(dialogToolbarItem);
    this.#updateNavigationSettingSelection();
    this.#shortcutsDialog.addEventListener("click", this.#updateNavigationSettingSelection.bind(this));
    this.#shortcutsDialog.data = {
      customTitle: i18nString(UIStrings.shortcutsDialogTitle),
      shortcuts: this.#getShortcutsInfo(currentNavSetting === "classic"),
      open: !userHadShortcutsDialogOpenedOnce && hideTheDialogForTests !== "true" && !Host.InspectorFrontendHost.isUnderTest()
    };
    this.#navigationRadioButtons.classList.add("nav-radio-buttons");
    UI.ARIAUtils.markAsRadioGroup(this.#navigationRadioButtons);
    this.#modernNavRadioButton.radio.addEventListener("change", () => {
      this.#shortcutsDialog.data = { shortcuts: this.#getShortcutsInfo(
        /* isNavClassic */
        false
      ) };
      Common.Settings.moduleSetting("flamechart-selected-navigation").set("modern");
    });
    this.#classicNavRadioButton.radio.addEventListener("change", () => {
      this.#shortcutsDialog.data = { shortcuts: this.#getShortcutsInfo(
        /* isNavClassic */
        true
      ) };
      Common.Settings.moduleSetting("flamechart-selected-navigation").set("classic");
    });
    this.#navigationRadioButtons.appendChild(this.#modernNavRadioButton.label);
    this.#navigationRadioButtons.appendChild(this.#classicNavRadioButton.label);
    this.#userHadShortcutsDialogOpenedOnce.set(true);
    return this.#navigationRadioButtons;
  }
  #updateNavigationSettingSelection() {
    const currentNavSetting = Common.Settings.moduleSetting("flamechart-selected-navigation").get();
    if (currentNavSetting === "classic") {
      this.#classicNavRadioButton.radio.checked = true;
      Host.userMetrics.navigationSettingAtFirstTimelineLoad(
        Host.UserMetrics.TimelineNavigationSetting.SWITCHED_TO_CLASSIC
      );
    } else if (currentNavSetting === "modern") {
      this.#modernNavRadioButton.radio.checked = true;
      Host.userMetrics.navigationSettingAtFirstTimelineLoad(
        Host.UserMetrics.TimelineNavigationSetting.SWITCHED_TO_MODERN
      );
    }
  }
  #getShortcutsInfo(isNavClassic) {
    const metaKey = Host.Platform.isMac() ? "\u2318" : "Ctrl";
    if (isNavClassic) {
      return [
        {
          title: i18nString(UIStrings.timelineZoom),
          rows: [
            [{ key: "Scroll \u2195" }],
            [{ key: "W" }, { key: "S" }, { joinText: "or" }, { key: "+" }, { key: "-" }],
            { footnote: "hold shift for fast zoom" }
          ]
        },
        {
          title: i18nString(UIStrings.timelineScrollPan),
          rows: [
            [{ key: "Shift" }, { joinText: "+" }, { key: "Scroll \u2195" }],
            [{ key: "Scroll \u2194" }, { joinText: "or" }, { key: "A" }, { key: "D" }],
            [
              { key: "Drag" },
              { joinText: "or" },
              { key: "Shift" },
              { joinText: "+" },
              { key: "\u2191" },
              { key: "\u2193" },
              { key: "\u2190" },
              { key: "\u2192" }
            ]
          ]
        }
      ];
    }
    return [
      {
        title: i18nString(UIStrings.timelineZoom),
        rows: [
          [{ key: metaKey }, { joinText: "+" }, { key: "Scroll \u2195" }],
          [{ key: "W" }, { key: "S" }, { joinText: "or" }, { key: "+" }, { key: "-" }],
          { footnote: "" }
        ]
      },
      {
        title: i18nString(UIStrings.timelineScrollPan),
        rows: [
          [{ key: "Scroll \u2195" }],
          [
            { key: "Shift" },
            { joinText: "+" },
            { key: "Scroll \u2195" },
            { joinText: "or" },
            { key: "Scroll \u2194" },
            { joinText: "or" },
            { key: "A" },
            { key: "D" }
          ],
          [
            { key: "Drag" },
            { joinText: "or" },
            { key: "Shift" },
            { joinText: "+" },
            { key: "\u2191" },
            { key: "\u2193" },
            { key: "\u2190" },
            { key: "\u2192" }
          ]
        ]
      }
    ];
  }
  createSettingsPane() {
    this.showSettingsPaneSetting = Common.Settings.Settings.instance().createSetting("timeline-show-settings-toolbar", false);
    this.showSettingsPaneButton = new UI.Toolbar.ToolbarSettingToggle(
      this.showSettingsPaneSetting,
      "gear",
      i18nString(UIStrings.captureSettings),
      "gear-filled",
      "timeline-settings-toggle"
    );
    SDK.NetworkManager.MultitargetNetworkManager.instance().addEventListener(
      SDK.NetworkManager.MultitargetNetworkManager.Events.CONDITIONS_CHANGED,
      this.updateShowSettingsToolbarButton,
      this
    );
    SDK.CPUThrottlingManager.CPUThrottlingManager.instance().addEventListener(
      SDK.CPUThrottlingManager.Events.RATE_CHANGED,
      this.updateShowSettingsToolbarButton,
      this
    );
    this.disableCaptureJSProfileSetting.addChangeListener(this.updateShowSettingsToolbarButton, this);
    this.captureLayersAndPicturesSetting.addChangeListener(this.updateShowSettingsToolbarButton, this);
    this.captureSelectorStatsSetting.addChangeListener(this.updateShowSettingsToolbarButton, this);
    this.settingsPane = this.element.createChild("div", "timeline-settings-pane");
    this.settingsPane.setAttribute("jslog", `${VisualLogging.pane("timeline-settings-pane").track({ resize: true })}`);
    const cpuThrottlingPane = this.settingsPane.createChild("div");
    cpuThrottlingPane.append(i18nString(UIStrings.cpu));
    this.cpuThrottlingSelect = MobileThrottling.ThrottlingManager.throttlingManager().createCPUThrottlingSelector();
    cpuThrottlingPane.append(this.cpuThrottlingSelect.control.element);
    this.settingsPane.append(SettingsUI.SettingsUI.createSettingCheckbox(
      this.captureSelectorStatsSetting.title(),
      this.captureSelectorStatsSetting,
      i18nString(UIStrings.capturesSelectorStats)
    ));
    const networkThrottlingPane = this.settingsPane.createChild("div");
    networkThrottlingPane.append(i18nString(UIStrings.network));
    networkThrottlingPane.append(this.createNetworkConditionsSelectToolbarItem().element);
    this.settingsPane.append(SettingsUI.SettingsUI.createSettingCheckbox(
      this.captureLayersAndPicturesSetting.title(),
      this.captureLayersAndPicturesSetting,
      i18nString(UIStrings.capturesAdvancedPaint)
    ));
    this.settingsPane.append(SettingsUI.SettingsUI.createSettingCheckbox(
      this.disableCaptureJSProfileSetting.title(),
      this.disableCaptureJSProfileSetting,
      i18nString(UIStrings.disablesJavascriptSampling)
    ));
    const thirdPartyCheckbox = this.createSettingCheckbox(this.#thirdPartyTracksSetting, i18nString(UIStrings.showDataAddedByExtensions));
    const localLink = Link.create(
      "https://developer.chrome.com/docs/devtools/performance/extension",
      i18nString(UIStrings.learnMore)
    );
    localLink.style.marginLeft = "5px";
    thirdPartyCheckbox.element.shadowRoot?.appendChild(localLink);
    this.settingsPane.append(thirdPartyCheckbox.element);
    this.showSettingsPaneSetting.addChangeListener(this.updateSettingsPaneVisibility.bind(this));
    this.updateSettingsPaneVisibility();
  }
  createNetworkConditionsSelectToolbarItem() {
    const toolbarItem = new UI.Toolbar.ToolbarItem(document.createElement("div"));
    this.networkThrottlingSelect = MobileThrottling.NetworkThrottlingSelector.NetworkThrottlingSelect.createForGlobalConditions(
      toolbarItem.element,
      i18nString(UIStrings.networkConditions)
    );
    return toolbarItem;
  }
  prepareToLoadTimeline() {
    console.assert(this.state === "Idle" /* IDLE */);
    this.setState("Loading" /* LOADING */);
  }
  createFileSelector() {
    if (this.fileSelectorElement) {
      this.fileSelectorElement.remove();
    }
    this.fileSelectorElement = UI.UIUtils.createFileSelectorElement(this.loadFromFile.bind(this), ".json,.gz,.gzip,.cpuprofile");
    this.timelinePane.element.appendChild(this.fileSelectorElement);
  }
  contextMenu(event) {
    if (this.state === "StartPending" /* START_PENDING */ || this.state === "Recording" /* RECORDING */ || this.state === "StopPending" /* STOP_PENDING */) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const mouseEvent = event;
    if (this.flameChart.getMainFlameChart().coordinatesToEntryIndex(mouseEvent.offsetX, mouseEvent.offsetY) !== -1) {
      return;
    }
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.appendItemsAtLocation("timelineMenu");
    void contextMenu.show();
  }
  async saveToFile(config) {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return;
    }
    const parsedTrace = this.#traceEngineModel.parsedTrace(this.#viewMode.traceIndex);
    if (!parsedTrace) {
      return;
    }
    const mappedScriptsWithData = Trace.Handlers.ModelHandlers.Scripts.data().scripts;
    const scriptByIdMap = /* @__PURE__ */ new Map();
    for (const mapScript of mappedScriptsWithData) {
      scriptByIdMap.set(`${mapScript.isolate}.${mapScript.scriptId}`, mapScript);
    }
    const traceEvents = parsedTrace.traceEvents.map((event) => {
      if (Trace.Types.Events.isAnyScriptSourceEvent(event) && event.name !== "StubScriptCatchup") {
        const mappedScript = scriptByIdMap.get(`${event.args.data.isolate}.${event.args.data.scriptId}`);
        if (!config.includeResourceContent || mappedScript?.url && Trace.Helpers.Trace.isExtensionUrl(mappedScript.url)) {
          return {
            cat: event.cat,
            name: "StubScriptCatchup",
            ts: event.ts,
            dur: event.dur,
            ph: event.ph,
            pid: event.pid,
            tid: event.tid,
            args: {
              data: { isolate: event.args.data.isolate, scriptId: event.args.data.scriptId }
            }
          };
        }
      }
      return event;
    });
    const metadata = parsedTrace.metadata;
    metadata.modifications = config.addModifications ? ModificationsManager.activeManager()?.toJSON() : void 0;
    try {
      await this.innerSaveToFile(traceEvents, metadata, {
        includeResourceContent: config.includeResourceContent,
        includeSourceMaps: config.includeSourceMaps,
        addModifications: config.addModifications,
        shouldCompress: config.shouldCompress
      });
    } catch (e) {
      const error = e instanceof Error ? e : new Error(e);
      console.error(error.stack);
      if (error.name === "AbortError") {
        return;
      }
      this.#showExportTraceErrorDialog(error);
    } finally {
      this.statusDialog?.remove();
      this.statusDialog = null;
    }
  }
  async innerSaveToFile(traceEvents, metadata, config) {
    this.statusDialog = new StatusDialog(
      {
        hideStopButton: true,
        showProgress: true
      },
      async () => {
        this.statusDialog?.remove();
        this.statusDialog = null;
      }
    );
    this.statusDialog.showPane(this.statusPaneContainer, "tinted");
    this.statusDialog.updateStatus(i18nString(UIStrings.preparingTraceForDownload));
    this.statusDialog.updateProgressBar(i18nString(UIStrings.preparingTraceForDownload), 0);
    this.statusDialog.requestUpdate();
    await this.statusDialog.updateComplete;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const isoDate = Platform.DateUtilities.toISO8601Compact(metadata.startTime ? new Date(metadata.startTime) : /* @__PURE__ */ new Date());
    const isCpuProfile = metadata.dataOrigin === Trace.Types.File.DataOrigin.CPU_PROFILE;
    const { includeResourceContent, includeSourceMaps } = config;
    metadata.enhancedTraceVersion = includeResourceContent ? SDK.EnhancedTracesParser.EnhancedTracesParser.enhancedTraceVersion : void 0;
    let fileName = isCpuProfile ? `CPU-${isoDate}.cpuprofile` : `Trace-${isoDate}.json`;
    let blobParts = [];
    if (isCpuProfile) {
      const profile = Trace.Helpers.SamplesIntegrator.SamplesIntegrator.extractCpuProfileFromFakeTrace(traceEvents);
      blobParts = [JSON.stringify(profile)];
    } else {
      const filteredMetadataSourceMaps = includeResourceContent && includeSourceMaps ? this.#filterMetadataSourceMaps(metadata) : void 0;
      const filteredResources = includeResourceContent ? this.#filterMetadataResoures(metadata) : void 0;
      const formattedTraceIter = traceJsonGenerator(traceEvents, {
        ...metadata,
        sourceMaps: filteredMetadataSourceMaps,
        resources: filteredResources
      });
      blobParts = Array.from(formattedTraceIter);
    }
    if (!blobParts.length) {
      throw new Error("Trace content empty");
    }
    let blob = new Blob(blobParts, { type: "application/json" });
    blobParts.length = 0;
    if (config.shouldCompress) {
      this.statusDialog.updateStatus(i18nString(UIStrings.compressingTraceForDownload));
      this.statusDialog.updateProgressBar(i18nString(UIStrings.compressingTraceForDownload), 0);
      fileName = `${fileName}.gz`;
      const inputSize = blob.size;
      const monitoredStream = Common.Gzip.createMonitoredStream(blob.stream(), (bytesRead) => {
        this.statusDialog?.updateProgressBar(
          i18nString(UIStrings.compressingTraceForDownload),
          bytesRead / inputSize * 100
        );
      });
      const gzStream = Common.Gzip.compressStream(monitoredStream);
      blob = await new Response(gzStream, {
        headers: { "Content-Type": "application/gzip" }
      }).blob();
    }
    const blobType = blob.type;
    let bytesAsB64 = null;
    try {
      this.statusDialog.updateStatus(i18nString(UIStrings.encodingTraceForDownload));
      this.statusDialog.updateProgressBar(i18nString(UIStrings.encodingTraceForDownload), 100);
      bytesAsB64 = await Common.Base64.encode(blob);
      blob = new Blob();
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("failed to convert to base64")) {
      } else {
        throw err;
      }
    }
    if (bytesAsB64) {
      const contentData = new TextUtils.ContentData.ContentData(
        bytesAsB64,
        /* isBase64=*/
        true,
        blobType
      );
      await Workspace.FileManager.FileManager.instance().save(
        fileName,
        contentData,
        /* forceSaveAs=*/
        true
      );
      Workspace.FileManager.FileManager.instance().close(fileName);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
    this.statusDialog.remove();
    this.statusDialog = null;
  }
  async handleSaveToFileAction() {
    const exportTraceOptionsElement = this.saveButton.element;
    const state = exportTraceOptionsElement.state;
    await this.saveToFile({
      includeResourceContent: state.includeResourceContent,
      includeSourceMaps: state.includeSourceMaps,
      addModifications: state.includeAnnotations,
      shouldCompress: state.shouldCompress
    });
  }
  #filterMetadataSourceMaps(metadata) {
    if (!metadata.sourceMaps) {
      return void 0;
    }
    return metadata.sourceMaps.filter((value) => {
      return !Trace.Helpers.Trace.isExtensionUrl(value.url);
    });
  }
  #filterMetadataResoures(metadata) {
    if (!metadata.resources) {
      return void 0;
    }
    return metadata.resources;
  }
  #showExportTraceErrorDialog(error) {
    if (this.statusDialog) {
      this.statusDialog.remove();
    }
    this.statusDialog = new StatusDialog(
      {
        description: error.message ?? error.toString(),
        buttonText: i18nString(UIStrings.close),
        hideStopButton: false,
        showProgress: false,
        showTimer: false
      },
      async () => {
        this.statusDialog?.remove();
        this.statusDialog = null;
      }
    );
    this.statusDialog.showPane(this.statusPaneContainer);
    this.statusDialog.updateStatus(i18nString(UIStrings.exportingFailed));
  }
  async showHistoryDropdown() {
    const recordingData = await this.#historyManager.showHistoryDropDown();
    if (recordingData) {
      if (recordingData.type === "LANDING_PAGE") {
        this.#changeView({ mode: "LANDING_PAGE" });
      } else {
        this.#changeView({
          mode: "VIEWING_TRACE",
          traceIndex: recordingData.parsedTraceIndex
        });
      }
    }
  }
  revealParsedTrace(revealable) {
    const index = this.model.indexForTrace(revealable.parsedTrace);
    if (index === -1) {
      return;
    }
    if (this.#activeTraceIndex() === index) {
      return;
    }
    this.#changeView({
      mode: "VIEWING_TRACE",
      traceIndex: index
    });
  }
  navigateHistory(direction) {
    const recordingData = this.#historyManager.navigate(direction);
    if (recordingData?.type === "TRACE_INDEX") {
      this.#changeView({
        mode: "VIEWING_TRACE",
        traceIndex: recordingData.parsedTraceIndex
      });
    }
    return true;
  }
  #saveModificationsForActiveTrace() {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return;
    }
    const newModifications = ModificationsManager.activeManager()?.toJSON();
    if (newModifications) {
      this.#traceEngineModel.overrideModifications(this.#viewMode.traceIndex, newModifications);
    }
  }
  selectFileToLoad() {
    if (this.fileSelectorElement) {
      this.fileSelectorElement.click();
    }
  }
  async loadFromFile(file) {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    const content = await Common.Gzip.fileToString(file);
    if (content.includes("enhancedTraceVersion")) {
      this.#launchRehydratedSession(content);
    } else {
      this.loader = TimelineLoader.loadFromParsedJsonFile(JSON.parse(content), this);
      this.prepareToLoadTimeline();
    }
    this.createFileSelector();
  }
  #launchRehydratedSession(traceJson) {
    let rehydratingWindow = null;
    let pathToLaunch = null;
    const url = new URL(window.location.href);
    const pathToEntrypoint = url.pathname.slice(0, url.pathname.lastIndexOf("/"));
    url.pathname = `${pathToEntrypoint}/trace_app.html`;
    url.search = "";
    pathToLaunch = url.toString();
    const hostWindow = window;
    function onMessageHandler(ev) {
      if (url && ev.data?.type === "REHYDRATING_WINDOW_READY") {
        rehydratingWindow?.postMessage({ type: "REHYDRATING_TRACE_FILE", traceJson }, url.origin);
      }
      hostWindow.removeEventListener("message", onMessageHandler);
    }
    hostWindow.addEventListener("message", onMessageHandler);
    if (this.isDocked()) {
      rehydratingWindow = hostWindow.open(
        pathToLaunch,
        /* target: */
        "_blank",
        "noopener=false,popup=false"
      );
    } else {
      rehydratingWindow = hostWindow.open(
        pathToLaunch,
        /* target: */
        void 0,
        "noopener=false,popup=true"
      );
    }
  }
  async loadFromURL(url) {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    this.prepareToLoadTimeline();
    this.loader = await TimelineLoader.loadFromURL(url, this);
  }
  isDocked() {
    return UI.DockController.DockController.instance().dockSide() !== UI.DockController.DockState.UNDOCKED;
  }
  updateMiniMap() {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      this.#minimapComponent.setData(null);
      return;
    }
    const parsedTrace = this.#traceEngineModel.parsedTrace(this.#viewMode.traceIndex);
    const isCpuProfile = parsedTrace?.metadata.dataOrigin === Trace.Types.File.DataOrigin.CPU_PROFILE;
    if (!parsedTrace) {
      return;
    }
    this.#minimapComponent.setData({
      parsedTrace,
      isCpuProfile,
      settings: {
        showScreenshots: this.showScreenshotsSetting.get(),
        showMemory: this.showMemorySetting.get()
      }
    });
  }
  onMemoryModeChanged() {
    this.flameChart.updateCountersGraphToggle(this.showMemorySetting.get());
    this.updateMiniMap();
    this.doResize();
    this.select(null);
  }
  onDimThirdPartiesChanged() {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return;
    }
    this.flameChart.dimThirdPartiesIfRequired();
  }
  #extensionDataVisibilityChanged() {
    this.flameChart.rebuildDataForTrace({ updateType: "REDRAW_EXISTING_TRACE" });
  }
  updateSettingsPaneVisibility() {
    if (this.#isNode || !this.canRecord()) {
      return;
    }
    if (this.showSettingsPaneSetting.get()) {
      this.showSettingsPaneButton.setToggled(true);
      this.settingsPane?.classList.remove("hidden");
    } else {
      this.showSettingsPaneButton.setToggled(false);
      this.settingsPane?.classList.add("hidden");
    }
  }
  updateShowSettingsToolbarButton() {
    const messages = [];
    if (SDK.CPUThrottlingManager.CPUThrottlingManager.instance().cpuThrottlingRate() !== 1) {
      messages.push(i18nString(UIStrings.CpuThrottlingIsEnabled));
    }
    if (SDK.NetworkManager.MultitargetNetworkManager.instance().isThrottling()) {
      messages.push(i18nString(UIStrings.NetworkThrottlingIsEnabled));
    }
    if (this.captureLayersAndPicturesSetting.get()) {
      messages.push(i18nString(UIStrings.SignificantOverheadDueToPaint));
    }
    if (this.captureSelectorStatsSetting.get()) {
      messages.push(i18nString(UIStrings.SelectorStatsEnabled));
    }
    if (this.disableCaptureJSProfileSetting.get()) {
      messages.push(i18nString(UIStrings.JavascriptSamplingIsDisabled));
    }
    this.showSettingsPaneButton.setChecked(messages.length > 0);
    this.showSettingsPaneButton.element.style.setProperty("--dot-toggle-top", "16px");
    this.showSettingsPaneButton.element.style.setProperty("--dot-toggle-left", "15px");
    if (messages.length) {
      const tooltipElement = document.createElement("div");
      messages.forEach((message) => {
        tooltipElement.createChild("div").textContent = message;
      });
      this.showSettingsPaneButton.setTitle(tooltipElement.textContent || "");
    } else {
      this.showSettingsPaneButton.setTitle(i18nString(UIStrings.captureSettings));
    }
  }
  setUIControlsEnabled(enabled) {
    this.recordingOptionUIControls.forEach((control) => control.setEnabled(enabled));
  }
  async #evaluateInspectedURL() {
    if (!this.controller) {
      return Platform.DevToolsPath.EmptyUrlString;
    }
    const inspectedURL = this.controller.primaryPageTarget.inspectedURL();
    const resourceTreeModel = this.controller.primaryPageTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    const navHistory = resourceTreeModel && await resourceTreeModel.navigationHistory();
    if (!resourceTreeModel || !navHistory) {
      return inspectedURL;
    }
    const { currentIndex, entries } = navHistory;
    const navigationEntry = entries[currentIndex];
    return navigationEntry.url;
  }
  async #startCPUProfilingRecording() {
    try {
      this.cpuProfiler = UI.Context.Context.instance().flavor(SDK.CPUProfilerModel.CPUProfilerModel);
      if (!this.cpuProfiler) {
        const firstNodeTarget = SDK.TargetManager.TargetManager.instance().targets().find((target) => target.type() === SDK.Target.Type.NODE);
        if (!firstNodeTarget) {
          throw new Error("Could not load any Node target.");
        }
        if (firstNodeTarget) {
          this.cpuProfiler = firstNodeTarget.model(SDK.CPUProfilerModel.CPUProfilerModel);
        }
      }
      this.setUIControlsEnabled(false);
      this.#changeView({ mode: "STATUS_PANE_OVERLAY" });
      if (!this.cpuProfiler) {
        throw new Error("No Node target is found.");
      }
      await SDK.TargetManager.TargetManager.instance().suspendAllTargets("performance-timeline");
      await this.cpuProfiler.startRecording();
      this.statusDialog?.updateStatus(i18nString(UIStrings.tracing));
      this.recordingStarted();
    } catch (e) {
      await this.recordingFailed(e.message);
    }
  }
  async #startTraceRecording() {
    try {
      const rootTarget = SDK.TargetManager.TargetManager.instance().rootTarget();
      const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
      if (!primaryPageTarget) {
        throw new Error("Could not load primary page target.");
      }
      if (!rootTarget) {
        throw new Error("Could not load root target.");
      }
      if (UIDevtoolsUtils.isUiDevTools()) {
        this.controller = new UIDevtoolsController(rootTarget, primaryPageTarget, this);
      } else {
        this.controller = new TimelineController(rootTarget, primaryPageTarget, this);
      }
      this.setUIControlsEnabled(false);
      this.#changeView({ mode: "STATUS_PANE_OVERLAY" });
      if (!this.controller) {
        throw new Error("Could not create Timeline controller");
      }
      const urlToTrace = await this.#evaluateInspectedURL();
      await this.controller.startRecording({
        enableJSSampling: !this.disableCaptureJSProfileSetting.get(),
        capturePictures: this.captureLayersAndPicturesSetting.get(),
        captureFilmStrip: this.showScreenshotsSetting.get(),
        captureSelectorStats: this.captureSelectorStatsSetting.get(),
        navigateToUrl: this.recordingPageReload ? urlToTrace : void 0
      });
      this.recordingStarted();
    } catch (e) {
      await this.recordingFailed(e.message);
    }
  }
  async startRecording() {
    console.assert(!this.statusDialog, "Status pane is already opened.");
    this.setState("StartPending" /* START_PENDING */);
    this.showRecordingStarted();
    if (this.#isNode) {
      await this.#startCPUProfilingRecording();
    } else {
      await this.#startTraceRecording();
    }
    Badges.UserBadges.instance().recordAction(Badges.BadgeAction.PERFORMANCE_RECORDING_STARTED);
  }
  async stopRecording() {
    if (this.statusDialog) {
      this.statusDialog.finish();
      this.statusDialog.updateStatus(i18nString(UIStrings.stoppingTimeline));
      this.statusDialog.updateProgressBar(i18nString(UIStrings.received), 0);
    }
    this.setState("StopPending" /* STOP_PENDING */);
    if (this.controller) {
      await this.controller.stopRecording();
      this.setUIControlsEnabled(true);
      await this.controller.dispose();
      this.controller = null;
      return;
    }
    if (this.cpuProfiler) {
      const profile = await this.cpuProfiler.stopRecording();
      this.setState("Idle" /* IDLE */);
      this.loadFromCpuProfile(profile);
      this.setUIControlsEnabled(true);
      this.cpuProfiler = null;
      await SDK.TargetManager.TargetManager.instance().resumeAllTargets();
    }
  }
  async recordingFailed(error, rawEvents) {
    if (this.statusDialog) {
      this.statusDialog.remove();
    }
    this.statusDialog = new StatusDialog(
      {
        description: error,
        buttonText: i18nString(UIStrings.close),
        hideStopButton: false
      },
      // When recording failed, we should load null to go back to the landing page.
      async () => {
        this.statusDialog?.remove();
        await this.loadingComplete(
          /* no collectedEvents */
          [],
          /* exclusiveFilter= */
          null,
          /* metadata= */
          null
        );
      }
    );
    this.statusDialog.showPane(this.statusPaneContainer);
    this.statusDialog.updateStatus(i18nString(UIStrings.recordingFailed));
    if (rawEvents) {
      this.statusDialog.enableDownloadOfEvents(rawEvents);
    }
    this.setState("RecordingFailed" /* RECORDING_FAILED */);
    this.traceLoadStart = null;
    this.setUIControlsEnabled(true);
    if (this.controller) {
      await this.controller.dispose();
      this.controller = null;
    }
    void SDK.TargetManager.TargetManager.instance().resumeAllTargets();
  }
  onSuspendStateChanged() {
    this.updateTimelineControls();
  }
  consoleProfileFinished(data) {
    this.loadFromCpuProfile(data.cpuProfile);
    void UI.InspectorView.InspectorView.instance().showPanel("timeline");
  }
  updateTimelineControls() {
    if (this.#viewMode.mode === "VIEWING_TRACE") {
      this.#addSidebarIconToToolbar();
    }
    const exportTraceOptionsElement = this.saveButton.element;
    exportTraceOptionsElement.data = {
      onExport: this.saveToFile.bind(this),
      buttonEnabled: this.state === "Idle" /* IDLE */ && this.#hasActiveTrace()
    };
    this.#historyManager.setEnabled(this.state === "Idle" /* IDLE */);
    this.clearButton.setEnabled(this.state === "Idle" /* IDLE */);
    this.dropTarget.setEnabled(this.state === "Idle" /* IDLE */);
    this.loadButton.setEnabled(this.state === "Idle" /* IDLE */);
    this.toggleRecordAction.setToggled(this.state === "Recording" /* RECORDING */);
    this.toggleRecordAction.setEnabled(this.state === "Recording" /* RECORDING */ || this.state === "Idle" /* IDLE */);
    this.askAiButton?.setEnabled(this.state === "Idle" /* IDLE */ && this.#hasActiveTrace());
    this.panelToolbar.setEnabled(this.state !== "Loading" /* LOADING */);
    this.panelRightToolbar.setEnabled(this.state !== "Loading" /* LOADING */);
    if (!this.canRecord()) {
      return;
    }
    this.recordReloadAction.setEnabled(this.#isNode ? false : this.state === "Idle" /* IDLE */);
    this.homeButton?.setEnabled(this.state === "Idle" /* IDLE */ && this.#hasActiveTrace());
  }
  async toggleRecording() {
    if (this.state === "Idle" /* IDLE */) {
      this.recordingPageReload = false;
      await this.startRecording();
      Host.userMetrics.actionTaken(Host.UserMetrics.Action.TimelineStarted);
    } else if (this.state === "Recording" /* RECORDING */) {
      await this.stopRecording();
    }
  }
  recordReload() {
    if (this.state !== "Idle" /* IDLE */) {
      return;
    }
    this.recordingPageReload = true;
    void this.startRecording();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.TimelinePageReloadStarted);
  }
  onClearButton() {
    this.#historyManager.clear();
    this.#instantiateNewModel();
    ModificationsManager.reset();
    this.#uninstallSourceMapsResolver();
    this.flameChart.getMainDataProvider().reset();
    this.flameChart.getNetworkDataProvider().reset();
    this.flameChart.reset();
    this.#changeView({ mode: "LANDING_PAGE" });
    UI.Context.Context.instance().setFlavor(AiAssistanceModel.AIContext.AgentFocus, null);
  }
  #hasActiveTrace() {
    return this.#viewMode.mode === "VIEWING_TRACE";
  }
  #applyActiveFilters(traceIsGeneric, exclusiveFilter = null) {
    if (traceIsGeneric || Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_SHOW_ALL_EVENTS)) {
      return;
    }
    const newActiveFilters = exclusiveFilter ? [exclusiveFilter] : [
      TimelineUIUtils.visibleEventsFilter()
    ];
    ActiveFilters.instance().setFilters(newActiveFilters);
  }
  /**
   * Called when we update the active trace that is being shown to the user.
   * This is called from {@link TimelinePanel.#changeView} when we change the UI to show a
   * trace - either one the user has just recorded/imported, or one they have
   * navigated to via the dropdown.
   *
   * If you need code to execute whenever the active trace changes, this is the method to use.
   * If you need code to execute ONLY ON NEW TRACES, then use {@link TimelinePanel.loadingComplete}
   * You should not call this method directly if you want the UI to update; use
   * {@link TimelinePanel.#changeView} to control what is shown to the user.
   */
  #setModelForActiveTrace() {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return;
    }
    const { traceIndex } = this.#viewMode;
    const parsedTrace = this.#traceEngineModel.parsedTrace(traceIndex);
    const syntheticEventsManager = this.#traceEngineModel.syntheticTraceEventsManager(traceIndex);
    if (!parsedTrace || !syntheticEventsManager) {
      console.error(`setModelForActiveTrace was called with an invalid trace index: ${traceIndex}`);
      this.#changeView({ mode: "LANDING_PAGE" });
      return;
    }
    Trace.Helpers.SyntheticEvents.SyntheticEventsManager.activate(syntheticEventsManager);
    this.#minimapComponent.reset();
    const data = parsedTrace.data;
    TraceBounds.TraceBounds.BoundsManager.instance().resetWithNewBounds(
      data.Meta.traceBounds
    );
    const currentManager = ModificationsManager.initAndActivateModificationsManager(this.#traceEngineModel, traceIndex);
    if (!currentManager) {
      console.error("ModificationsManager could not be created or activated.");
    }
    this.statusDialog?.updateProgressBar(i18nString(UIStrings.processed), 70);
    this.flameChart.setModel(parsedTrace, this.#eventToRelatedInsights);
    this.flameChart.resizeToPreferredHeights();
    void this.flameChart.setSelectionAndReveal(null);
    this.#sideBar.setParsedTrace(parsedTrace);
    this.#searchableView.showWidget();
    const exclusiveFilter = this.#exclusiveFilterPerTrace.get(traceIndex) ?? null;
    this.#applyActiveFilters(parsedTrace.data.Meta.traceIsGeneric, exclusiveFilter);
    this.saveButton.element.updateContentVisibility({
      annotationsExist: currentManager ? currentManager.getAnnotations()?.length > 0 : false
    });
    currentManager?.addEventListener(AnnotationModifiedEvent.eventName, this.#onAnnotationModifiedEventBound);
    const topMostMainThreadAppender = this.flameChart.getMainDataProvider().compatibilityTracksAppenderInstance().threadAppenders().at(0);
    if (topMostMainThreadAppender) {
      const zoomedInBounds = Trace.Extras.MainThreadActivity.calculateWindow(
        parsedTrace.data.Meta.traceBounds,
        topMostMainThreadAppender.getEntries()
      );
      TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(zoomedInBounds);
    }
    const currModificationManager = ModificationsManager.activeManager();
    if (currModificationManager) {
      const annotations = currModificationManager.getAnnotations();
      const annotationEntryToColorMap = this.buildColorsAnnotationsMap(annotations);
      this.#sideBar.setAnnotations(annotations, annotationEntryToColorMap);
      this.flameChart.bulkAddOverlays(currModificationManager.getOverlays());
    }
    const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    const cpuProfiles = Array.from(parsedTrace.data.Samples.profilesInProcess).flatMap(([_processId, threadsInProcess]) => {
      const profiles = Array.from(threadsInProcess.values()).map((profileData) => profileData.parsedProfile);
      return profiles;
    });
    PerfUI.LineLevelProfile.Performance.instance().initialize(cpuProfiles, primaryPageTarget);
    this.#entityMapper = new Trace.EntityMapper.EntityMapper(parsedTrace);
    this.#sourceMapsResolver = new SourceMapsResolver.SourceMapsResolver(parsedTrace, this.#entityMapper);
    this.#sourceMapsResolver.addEventListener(
      SourceMapsResolver.SourceMappingsUpdated.eventName,
      this.#onSourceMapsNodeNamesResolvedBound
    );
    void this.#sourceMapsResolver.install();
    this.#entityMapper = new Trace.EntityMapper.EntityMapper(parsedTrace);
    this.statusDialog?.updateProgressBar(i18nString(UIStrings.processed), 80);
    this.updateMiniMap();
    this.statusDialog?.updateProgressBar(i18nString(UIStrings.processed), 90);
    this.updateTimelineControls();
    this.#maybeCreateHiddenTracksBanner(parsedTrace);
    this.#setActiveInsight(null);
    this.#eventToRelatedInsights.clear();
    if (parsedTrace.insights) {
      for (const [insightSetKey, insightSet] of parsedTrace.insights) {
        for (const model of Object.values(insightSet.model)) {
          let relatedEvents = model.relatedEvents;
          if (!relatedEvents) {
            relatedEvents = /* @__PURE__ */ new Map();
          } else if (Array.isArray(relatedEvents)) {
            relatedEvents = new Map(relatedEvents.map((e) => [e, []]));
          }
          for (const [event, messages] of relatedEvents.entries()) {
            const relatedInsights = this.#eventToRelatedInsights.get(event) ?? [];
            this.#eventToRelatedInsights.set(event, relatedInsights);
            relatedInsights.push({
              insightLabel: model.title,
              messages,
              activateInsight: () => {
                this.#setActiveInsight({ model, insightSetKey });
              }
            });
          }
        }
      }
    }
    if (this.#traceEngineModel.size() === 1) {
      this.#setupNavigationSetting();
      if (Common.Settings.moduleSetting("flamechart-selected-navigation").get() === "classic") {
        Host.userMetrics.navigationSettingAtFirstTimelineLoad(
          Host.UserMetrics.TimelineNavigationSetting.CLASSIC_AT_SESSION_FIRST_TRACE
        );
      } else {
        Host.userMetrics.navigationSettingAtFirstTimelineLoad(
          Host.UserMetrics.TimelineNavigationSetting.MODERN_AT_SESSION_FIRST_TRACE
        );
      }
    }
    if (parsedTrace.metadata.dataOrigin !== Trace.Types.File.DataOrigin.CPU_PROFILE) {
      UI.Context.Context.instance().setFlavor(
        AiAssistanceModel.AIContext.AgentFocus,
        AiAssistanceModel.AIContext.AgentFocus.fromParsedTrace(parsedTrace)
      );
    }
  }
  #onAnnotationModifiedEvent(e) {
    const event = e;
    const announcementText = AnnotationHelpers.ariaAnnouncementForModifiedEvent(event);
    if (announcementText) {
      UI.ARIAUtils.LiveAnnouncer.alert(announcementText);
    }
    const { overlay, action } = event;
    if (action === "Add") {
      this.flameChart.addOverlay(overlay);
    } else if (action === "Remove") {
      this.flameChart.removeOverlay(overlay);
    } else if (action === "UpdateTimeRange" && AnnotationHelpers.isTimeRangeLabel(overlay)) {
      this.flameChart.updateExistingOverlay(overlay, {
        bounds: overlay.bounds
      });
    } else if (action === "UpdateLinkToEntry" && AnnotationHelpers.isEntriesLink(overlay)) {
      this.flameChart.updateExistingOverlay(overlay, {
        entryTo: overlay.entryTo
      });
    } else if (action === "EnterLabelEditState" && AnnotationHelpers.isEntryLabel(overlay)) {
      this.flameChart.enterLabelEditMode(overlay);
    } else if (action === "LabelBringForward" && AnnotationHelpers.isEntryLabel(overlay)) {
      this.flameChart.bringLabelForward(overlay);
    }
    const currentManager = ModificationsManager.activeManager();
    const annotations = currentManager?.getAnnotations() ?? [];
    const annotationEntryToColorMap = this.buildColorsAnnotationsMap(annotations);
    this.#sideBar.setAnnotations(annotations, annotationEntryToColorMap);
    this.saveButton.element.updateContentVisibility({
      annotationsExist: currentManager ? currentManager.getAnnotations()?.length > 0 : false
    });
  }
  /**
   * After the user imports / records a trace, we auto-show the sidebar if:
   * 1. The user has never seen it before, so we show it once to aid discovery
   * 2. The user had it open, and we hid it (for example, during recording), so now we need to bring it back.
   */
  #showSidebarIfRequired() {
    const disabledByLocalStorage = window.localStorage.getItem("disable-auto-show-rpp-sidebar-for-test") === "true";
    if (Root.Runtime.Runtime.queryParam("disable-auto-performance-sidebar-reveal") !== null || disabledByLocalStorage) {
      return;
    }
    const needToRestore = this.#restoreSidebarVisibilityOnTraceLoad;
    const userHasSeenSidebar = this.#sideBar.sidebarHasBeenOpened();
    if ((!userHasSeenSidebar || needToRestore) && !this.#splitWidget.sidebarIsShowing()) {
      this.#splitWidget.showBoth();
    }
    this.#restoreSidebarVisibilityOnTraceLoad = false;
  }
  /**
   * Exposed for testing.
   */
  splitWidget() {
    return this.#splitWidget;
  }
  // Build a map mapping annotated entries to the colours that are used to display them in the FlameChart.
  // We need this map to display the entries in the sidebar with the same colours.
  buildColorsAnnotationsMap(annotations) {
    const annotationEntryToColorMap = /* @__PURE__ */ new Map();
    for (const annotation of annotations) {
      if (Trace.Types.File.isEntryLabelAnnotation(annotation)) {
        annotationEntryToColorMap.set(annotation.entry, this.getEntryColorByEntry(annotation.entry));
      } else if (Trace.Types.File.isEntriesLinkAnnotation(annotation)) {
        annotationEntryToColorMap.set(annotation.entryFrom, this.getEntryColorByEntry(annotation.entryFrom));
        if (annotation.entryTo) {
          annotationEntryToColorMap.set(annotation.entryTo, this.getEntryColorByEntry(annotation.entryTo));
        }
      }
    }
    return annotationEntryToColorMap;
  }
  /**
   * If the user imports or records a trace and we have any hidden tracks, we
   * show a warning banner at the bottom. This can be dismissed by the user and
   * if that happens we do not want to bring it back again.
   */
  #maybeCreateHiddenTracksBanner(parsedTrace) {
    const hasHiddenTracks = this.flameChart.hasHiddenTracks();
    if (!hasHiddenTracks) {
      return;
    }
    const maybeOverlay = createHiddenTracksOverlay(parsedTrace, {
      onClose: () => {
        this.flameChart.overlays().removeOverlaysOfType("BOTTOM_INFO_BAR");
        this.#hiddenTracksInfoBarByParsedTrace.set(parsedTrace, "DISMISSED");
      },
      onShowAllTracks: () => {
        this.flameChart.showAllMainChartTracks();
      },
      onShowTrackConfigurationMode: () => {
        this.flameChart.enterMainChartTrackConfigurationMode();
      }
    });
    if (maybeOverlay) {
      this.flameChart.addOverlay(maybeOverlay);
    }
  }
  getEntryColorByEntry(entry) {
    const mainIndex = this.flameChart.getMainDataProvider().indexForEvent(entry);
    const networkIndex = this.flameChart.getNetworkDataProvider().indexForEvent(entry);
    if (mainIndex !== null) {
      const color = this.flameChart.getMainDataProvider().entryColor(mainIndex);
      if (color === "white") {
        return ThemeSupport.ThemeSupport.instance().getComputedValue("--app-color-system");
      }
      return color;
    }
    if (networkIndex !== null) {
      const color = this.flameChart.getNetworkDataProvider().entryColor(networkIndex);
      return color;
    }
    console.warn("Could not get entry color for ", entry);
    return ThemeSupport.ThemeSupport.instance().getComputedValue("--app-color-system");
  }
  recordingStarted() {
    this.#changeView({ mode: "STATUS_PANE_OVERLAY" });
    this.setState("Recording" /* RECORDING */);
    if (this.statusDialog) {
      this.statusDialog.enableAndFocusButton();
      this.statusDialog.updateProgressBar(i18nString(UIStrings.bufferUsage), 0);
      this.statusDialog.startTimer();
    }
  }
  recordingProgress(usage) {
    if (this.statusDialog) {
      this.statusDialog.updateProgressBar(i18nString(UIStrings.bufferUsage), usage * 100);
    }
  }
  recordingStatus(status) {
    if (this.statusDialog) {
      this.statusDialog.updateStatus(status);
    }
  }
  /**
   * Hide the sidebar, but persist the user's state, because when they import a
   * trace we want to revert the sidebar back to what it was.
   */
  #hideSidebar() {
    if (this.#splitWidget.sidebarIsShowing()) {
      this.#restoreSidebarVisibilityOnTraceLoad = true;
      this.#splitWidget.hideSidebar();
    }
  }
  #showLandingPage() {
    this.updateSettingsPaneVisibility();
    this.#removeSidebarIconFromToolbar();
    this.#hideSidebar();
    if (this.landingPage) {
      this.landingPage.show(this.statusPaneContainer);
      return;
    }
    const liveMetrics = new TimelineComponents.LiveMetricsView.LiveMetricsView();
    this.landingPage = LegacyWrapper.LegacyWrapper.legacyWrapper(UI.Widget.Widget, liveMetrics);
    this.landingPage.element.classList.add("timeline-landing-page", "fill");
    this.landingPage.contentElement.classList.add("fill");
    this.landingPage.show(this.statusPaneContainer);
  }
  #hideLandingPage() {
    this.landingPage.detach();
    this.showSettingsPaneButton?.setToggled(false);
    this.settingsPane?.classList.add("hidden");
  }
  async loadingStarted() {
    this.#changeView({ mode: "STATUS_PANE_OVERLAY" });
    if (this.statusDialog) {
      this.statusDialog.remove();
    }
    this.statusDialog = new StatusDialog(
      {
        showProgress: true,
        hideStopButton: true
      },
      () => this.cancelLoading()
    );
    this.statusDialog.showPane(this.statusPaneContainer);
    this.statusDialog.updateStatus(i18nString(UIStrings.loadingTrace));
    if (!this.loader) {
      this.statusDialog.finish();
    }
    this.traceLoadStart = Trace.Types.Timing.Milli(performance.now());
    await this.loadingProgress(0);
  }
  async loadingProgress(progress) {
    if (typeof progress === "number" && this.statusDialog) {
      this.statusDialog.updateProgressBar(i18nString(UIStrings.received), progress * 100);
    }
  }
  async processingStarted() {
    this.statusDialog?.updateStatus(i18nString(UIStrings.processingTrace));
  }
  #onSourceMapsNodeNamesResolved() {
    this.flameChart.getMainDataProvider().timelineData(true);
    this.flameChart.getMainFlameChart().update();
  }
  /**
   * This is called with we are done loading a trace from a file, or after we
   * have recorded a fresh trace.
   *
   * IMPORTANT: All the code in here should be code that is only required when we have
   * recorded or imported from disk a brand new trace. If you need the code to
   * run when the user switches to an existing trace, please @see
   * #setModelForActiveTrace and put your code in there.
   **/
  async loadingComplete(collectedEvents, exclusiveFilter = null, metadata) {
    this.#traceEngineModel.resetProcessor();
    delete this.loader;
    const recordingIsFresh = this.state === "StopPending" /* STOP_PENDING */;
    this.setState("Idle" /* IDLE */);
    if (collectedEvents.length === 0) {
      if (this.#traceEngineModel.size()) {
        this.#changeView({
          mode: "VIEWING_TRACE",
          traceIndex: this.#traceEngineModel.lastTraceIndex()
        });
      } else {
        this.#changeView({ mode: "LANDING_PAGE" });
      }
      return;
    }
    try {
      await this.#executeNewTrace(collectedEvents, recordingIsFresh, metadata);
      const traceIndex = this.#traceEngineModel.lastTraceIndex();
      if (exclusiveFilter) {
        this.#exclusiveFilterPerTrace.set(traceIndex, exclusiveFilter);
      }
      this.#changeView({
        mode: "VIEWING_TRACE",
        traceIndex
      });
      const parsedTrace = this.#traceEngineModel.parsedTrace(traceIndex);
      if (!parsedTrace) {
        throw new Error(`Could not get trace data at index ${traceIndex}`);
      }
      if (recordingIsFresh) {
        Tracing.FreshRecording.Tracker.instance().registerFreshRecording(parsedTrace);
      }
      this.#historyManager.addRecording({
        data: {
          parsedTraceIndex: traceIndex,
          type: "TRACE_INDEX"
        },
        filmStripForPreview: Trace.Extras.FilmStrip.fromHandlerData(parsedTrace.data),
        parsedTrace
      });
      this.dispatchEventToListeners("RecordingCompleted" /* RECORDING_COMPLETED */, {
        traceIndex
      });
    } catch (error) {
      void this.recordingFailed(error.message, collectedEvents);
      console.error(error);
      this.dispatchEventToListeners("RecordingCompleted" /* RECORDING_COMPLETED */, { errorText: error.message });
    } finally {
      this.recordTraceLoadMetric();
    }
  }
  recordTraceLoadMetric() {
    if (!this.traceLoadStart) {
      return;
    }
    const start = this.traceLoadStart;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const end = Trace.Types.Timing.Milli(performance.now());
        const measure = performance.measure("TraceLoad", { start, end });
        const duration = Trace.Types.Timing.Milli(measure.duration);
        this.element.dispatchEvent(new TraceLoadEvent(duration));
        Host.userMetrics.performanceTraceLoad(measure);
      }, 0);
    });
  }
  /**
   * Store source maps on trace metadata (but just the non-data url ones).
   *
   * Many raw source maps are already in memory, but there are some cases where they may
   * not be and have to be fetched here:
   *
   * 1. If the trace processor (via `#createSourceMapResolver`) never fetched it,
   *    due to `ScriptHandler` skipping the script if it could not find an associated frame.
   * 2. If the initial fetch failed (perhaps the failure was intermittent and a
   *    subsequent attempt will work).
   */
  async #retainSourceMapsForEnhancedTrace(parsedTrace, metadata) {
    const handleScript = async (script) => {
      if (script.sourceMapUrlElided) {
        if (metadata.sourceMaps?.find((m) => m.url === script.url)) {
          return;
        }
        const rawSourceMap2 = script.sourceMap?.json();
        if (rawSourceMap2 && script.url) {
          metadata.sourceMaps?.push({ url: script.url, sourceMap: rawSourceMap2 });
        }
        return;
      }
      if (!script.sourceMapUrl || script.sourceMapUrl.startsWith("data:")) {
        return;
      }
      if (metadata.sourceMaps?.find((m) => m.sourceMapUrl === script.sourceMapUrl)) {
        return;
      }
      let rawSourceMap = script.sourceMap?.json();
      if (!rawSourceMap && !script.sourceMapUrlElided) {
        const initiator = {
          target: null,
          frameId: script.frame,
          initiatorUrl: script.url
        };
        rawSourceMap = await SDK.SourceMapManager.tryLoadSourceMap(
          this.#resourceLoader,
          script.sourceMapUrl,
          initiator
        );
      }
      if (script.url && rawSourceMap) {
        metadata.sourceMaps?.push({ url: script.url, sourceMapUrl: script.sourceMapUrl, sourceMap: rawSourceMap });
      }
    };
    metadata.sourceMaps = [];
    const promises = [];
    for (const script of parsedTrace?.data.Scripts.scripts.values() ?? []) {
      promises.push(handleScript(script));
    }
    await Promise.all(promises);
  }
  #createSourceMapResolver(isFreshRecording, metadata) {
    const debuggerModelForFrameId = /* @__PURE__ */ new Map();
    for (const target of SDK.TargetManager.TargetManager.instance().targets()) {
      const debuggerModel = target.model(SDK.DebuggerModel.DebuggerModel);
      if (!debuggerModel) {
        continue;
      }
      const resourceModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
      const activeFrameIds = (resourceModel?.frames() ?? []).map((frame) => frame.id);
      for (const frameId of activeFrameIds) {
        debuggerModelForFrameId.set(frameId, debuggerModel);
      }
    }
    async function getExistingSourceMap(frame, scriptId, scriptUrl) {
      const debuggerModel = debuggerModelForFrameId.get(frame);
      if (!debuggerModel) {
        return;
      }
      const script = debuggerModel.scriptForId(scriptId);
      if (!script || scriptUrl && scriptUrl !== script.sourceURL) {
        return;
      }
      return await debuggerModel.sourceMapManager().sourceMapForClientPromise(script);
    }
    return async function resolveSourceMap(params) {
      const { scriptId, scriptUrl, sourceUrl, sourceMapUrl, frame, cachedRawSourceMap } = params;
      if (cachedRawSourceMap) {
        return new SDK.SourceMap.SourceMap(
          sourceUrl,
          sourceMapUrl ?? "",
          cachedRawSourceMap
        );
      }
      if (isFreshRecording) {
        const map = await getExistingSourceMap(frame, scriptId, scriptUrl);
        if (map) {
          return map;
        }
      }
      if (!sourceMapUrl) {
        return null;
      }
      const isDataUrl = sourceMapUrl.startsWith("data:");
      if (!isFreshRecording && metadata?.sourceMaps && !isDataUrl) {
        const cachedSourceMap = metadata.sourceMaps.find((m) => m.sourceMapUrl === sourceMapUrl);
        if (cachedSourceMap) {
          return new SDK.SourceMap.SourceMap(sourceUrl, sourceMapUrl, cachedSourceMap.sourceMap);
        }
      }
      if (!isFreshRecording && !isDataUrl) {
        return null;
      }
      if (!sourceUrl) {
        return null;
      }
      const initiator = {
        target: debuggerModelForFrameId.get(frame)?.target() ?? null,
        frameId: frame,
        initiatorUrl: sourceUrl
      };
      const payload = await SDK.SourceMapManager.tryLoadSourceMap(
        TimelinePanel.instance().#resourceLoader,
        sourceMapUrl,
        initiator
      );
      return payload ? new SDK.SourceMap.SourceMap(sourceUrl, sourceMapUrl, payload) : null;
    };
  }
  async #retainResourceContentsForEnhancedTrace(parsedTrace, metadata) {
    const resourceTypesToRetain = /* @__PURE__ */ new Set([Protocol.Network.ResourceType.Document, Protocol.Network.ResourceType.Stylesheet]);
    for (const request of parsedTrace.data.NetworkRequests.byId.values()) {
      if (!resourceTypesToRetain.has(request.args.data.resourceType)) {
        continue;
      }
      const url = request.args.data.url;
      const resource = SDK.ResourceTreeModel.ResourceTreeModel.resourceForURL(url);
      if (!resource) {
        continue;
      }
      const content = await resource.requestContentData();
      if ("error" in content) {
        continue;
      }
      if (!content.isTextContent) {
        continue;
      }
      if (!metadata.resources) {
        metadata.resources = [];
      }
      metadata.resources.push({
        url,
        frame: resource.frameId ?? "",
        content: content.text,
        mimeType: content.mimeType
      });
    }
  }
  async #executeNewTrace(collectedEvents, isFreshRecording, metadata) {
    const config = {
      metadata: metadata ?? void 0,
      isFreshRecording,
      resolveSourceMap: this.#createSourceMapResolver(isFreshRecording, metadata),
      isCPUProfile: metadata?.dataOrigin === Trace.Types.File.DataOrigin.CPU_PROFILE
    };
    if (window.location.href.includes("devtools/bundled") || window.location.search.includes("debugFrontend")) {
      const times = {};
      config.logger = {
        start(id) {
          times[id] = performance.now();
        },
        end(id) {
          performance.measure(id, { start: times[id] });
        }
      };
    }
    await this.#traceEngineModel.parse(collectedEvents, config);
    if (isFreshRecording && metadata) {
      const traceIndex = this.#traceEngineModel.lastTraceIndex();
      const parsedTrace = this.#traceEngineModel.parsedTrace(traceIndex);
      if (parsedTrace) {
        await this.#retainSourceMapsForEnhancedTrace(parsedTrace, metadata);
        await this.#retainResourceContentsForEnhancedTrace(parsedTrace, metadata);
      }
    }
  }
  loadingCompleteForTest() {
  }
  showRecordingStarted() {
    this.#changeView({ mode: "STATUS_PANE_OVERLAY" });
    if (this.statusDialog) {
      this.statusDialog.remove();
    }
    this.statusDialog = new StatusDialog(
      {
        showTimer: true,
        showProgress: true,
        hideStopButton: false
      },
      () => this.stopRecording()
    );
    this.statusDialog.showPane(this.statusPaneContainer);
    this.statusDialog.updateStatus(i18nString(UIStrings.initializingTracing));
    this.statusDialog.updateProgressBar(i18nString(UIStrings.bufferUsage), 0);
  }
  cancelLoading() {
    if (this.loader) {
      void this.loader.cancel();
    }
  }
  frameForSelection(selection) {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return null;
    }
    if (selectionIsRange(selection)) {
      return null;
    }
    if (Trace.Types.Events.isSyntheticNetworkRequest(selection.event)) {
      return null;
    }
    const parsedTrace = this.#traceEngineModel.parsedTrace(this.#viewMode.traceIndex);
    if (!parsedTrace) {
      return null;
    }
    const endTime = rangeForSelection(selection).max;
    const lastFrameInSelection = Trace.Handlers.ModelHandlers.Frames.framesWithinWindow(
      parsedTrace.data.Frames.frames,
      endTime,
      endTime
    ).at(0);
    return lastFrameInSelection || null;
  }
  jumpToFrame(offset) {
    if (this.#viewMode.mode !== "VIEWING_TRACE") {
      return;
    }
    const currentFrame = this.selection && this.frameForSelection(this.selection);
    if (!currentFrame) {
      return;
    }
    const parsedTrace = this.#traceEngineModel.parsedTrace(this.#viewMode.traceIndex);
    if (!parsedTrace) {
      return;
    }
    let index = parsedTrace.data.Frames.frames.indexOf(currentFrame);
    console.assert(index >= 0, "Can't find current frame in the frame list");
    index = Platform.NumberUtilities.clamp(index + offset, 0, parsedTrace.data.Frames.frames.length - 1);
    const frame = parsedTrace.data.Frames.frames[index];
    this.#revealTimeRange(
      Trace.Helpers.Timing.microToMilli(frame.startTime),
      Trace.Helpers.Timing.microToMilli(frame.endTime)
    );
    this.select(selectionFromEvent(frame));
    return true;
  }
  #announceSelectionToAria(oldSelection, newSelection) {
    if (oldSelection !== null && newSelection === null) {
      UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.selectionCleared));
    }
    if (newSelection === null) {
      return;
    }
    if (oldSelection && selectionsEqual(oldSelection, newSelection)) {
      return;
    }
    if (selectionIsRange(newSelection)) {
      return;
    }
    if (Trace.Types.Events.isLegacyTimelineFrame(newSelection.event)) {
      UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.frameSelected));
      return;
    }
    const name = Trace.Name.forEntry(newSelection.event);
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.eventSelected, { PH1: name }));
  }
  select(selection) {
    this.#announceSelectionToAria(this.selection, selection);
    this.selection = selection;
    void this.flameChart.setSelectionAndReveal(selection);
  }
  selectEntryAtTime(events, time) {
    if (!events) {
      return;
    }
    if (events.length === 0) {
      this.select(null);
      return;
    }
    for (let index = Platform.ArrayUtilities.upperBound(events, time, (time2, event) => time2 - event.ts) - 1; index >= 0; --index) {
      const event = events[index];
      const { endTime } = Trace.Helpers.Timing.eventTimingsMilliSeconds(event);
      if (Trace.Helpers.Trace.isTopLevelEvent(event) && endTime < time) {
        break;
      }
      if (ActiveFilters.instance().isVisible(event) && endTime >= time) {
        this.select(selectionFromEvent(event));
        return;
      }
    }
    this.select(null);
  }
  highlightEvent(event) {
    this.flameChart.highlightEvent(event);
  }
  #revealTimeRange(startTime, endTime) {
    const traceBoundsState = TraceBounds.TraceBounds.BoundsManager.instance().state();
    if (!traceBoundsState) {
      return;
    }
    const traceWindow = traceBoundsState.milli.timelineTraceWindow;
    let offset = 0;
    if (traceWindow.max < endTime) {
      offset = endTime - traceWindow.max;
    } else if (traceWindow.min > startTime) {
      offset = startTime - traceWindow.min;
    }
    TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
      Trace.Helpers.Timing.traceWindowFromMilliSeconds(
        Trace.Types.Timing.Milli(traceWindow.min + offset),
        Trace.Types.Timing.Milli(traceWindow.max + offset)
      ),
      {
        shouldAnimate: true
      }
    );
  }
  handleDrop(dataTransfer) {
    const items = dataTransfer.items;
    if (!items.length) {
      return;
    }
    const item = items[0];
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.PerfPanelTraceImported);
    if (item.kind === "string") {
      const url = dataTransfer.getData("text/uri-list");
      if (new Common.ParsedURL.ParsedURL(url).isValid) {
        void this.loadFromURL(url);
      }
    } else if (item.kind === "file") {
      const file = items[0].getAsFile();
      if (!file) {
        return;
      }
      void this.loadFromFile(file);
    }
  }
  #openSummaryTab() {
    void this.flameChart.setSelectionAndReveal(null);
    this.flameChart.selectDetailsViewTab(Tab.Details, null);
  }
  /**
   * Used to reveal an insight - and is called from the AI Assistance panel when the user clicks on the Insight context button that is shown.
   * Revealing an insight should:
   * 1. Ensure the sidebar is open
   * 2. Ensure the insight is expanded
   *    (both of these should be true in the AI Assistance case)
   * 3. Flash the Insight with the highlight colour we use in other panels.
   */
  revealInsight(insightModel) {
    const insightSetKey = insightModel.navigation?.args.data?.navigationId ?? Trace.Types.Events.NO_NAVIGATION;
    this.#setActiveInsight({ model: insightModel, insightSetKey }, { highlightInsight: true });
  }
  revealCoreVitals(revealable) {
    if (this.#splitWidget.showMode() !== UI.SplitWidget.ShowMode.BOTH) {
      this.#splitWidget.showBoth();
    }
    this.#sideBar.openInsightsTab();
    if (revealable.insightSetKey) {
      this.#sideBar.setActiveInsightSet(revealable.insightSetKey);
      this.#setActiveInsight(null);
    }
  }
  static async executeRecordAndReload() {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    const panelInstance = TimelinePanel.instance();
    const result = await new Promise((resolve) => {
      function listener(e) {
        resolve(e.data);
        panelInstance.removeEventListener("RecordingCompleted" /* RECORDING_COMPLETED */, listener);
      }
      panelInstance.addEventListener("RecordingCompleted" /* RECORDING_COMPLETED */, listener);
      panelInstance.recordReload();
    });
    if ("errorText" in result) {
      throw new Error(result.errorText);
    }
    const trace = panelInstance.model.parsedTrace(result.traceIndex);
    if (!trace) {
      throw new Error("Failed to parse trace");
    }
    return trace;
  }
  static async *handleExternalRecordRequest() {
    yield {
      type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.NOTIFICATION,
      message: "Recording performance trace"
    };
    TimelinePanel.instance().invalidateExternalAIConversationData();
    void VisualLogging.logFunctionCall("timeline.record-reload", "external");
    Snackbars.Snackbar.Snackbar.show({ message: i18nString(UIStrings.externalRequestReceived) });
    const panelInstance = TimelinePanel.instance();
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    function onRecordingCompleted(eventData) {
      if ("errorText" in eventData) {
        return {
          type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR,
          message: `Error running the trace: ${eventData.errorText}`
        };
      }
      const parsedTrace = panelInstance.model.parsedTrace(eventData.traceIndex);
      if (!parsedTrace || !parsedTrace.insights || parsedTrace.insights.size === 0) {
        return {
          type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR,
          message: "The trace was loaded successfully but no Insights were detected."
        };
      }
      const insightSetId = Array.from(parsedTrace.insights.keys()).find((k) => k !== "NO_NAVIGATION");
      if (!insightSetId) {
        return {
          type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR,
          message: "The trace was loaded successfully but no navigation was detected."
        };
      }
      const insightsForNav = parsedTrace.insights.get(insightSetId);
      if (!insightsForNav) {
        return {
          type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR,
          message: "The trace was loaded successfully but no Insights were detected."
        };
      }
      let responseTextForNonPassedInsights = "";
      let responseTextForPassedInsights = "";
      for (const insight of Object.values(insightsForNav.model)) {
        const focus = AiAssistanceModel.AIContext.AgentFocus.fromParsedTrace(parsedTrace);
        const formatter = new AiAssistanceModel.PerformanceInsightFormatter.PerformanceInsightFormatter(focus, insight);
        if (!formatter.insightIsSupported()) {
          continue;
        }
        const formatted = formatter.formatInsight({ headingLevel: 3 });
        if (insight.state === "pass") {
          responseTextForPassedInsights += `${formatted}

`;
          continue;
        } else {
          responseTextForNonPassedInsights += `${formatted}

`;
        }
      }
      const finalText = `# Trace recording results

## Non-passing insights:

These insights highlight potential problems and opportunities to improve performance.
${responseTextForNonPassedInsights}

## Passing insights:

These insights are passing, which means they are not considered to highlight considerable performance problems.
${responseTextForPassedInsights}`;
      return {
        type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ANSWER,
        message: finalText,
        devToolsLogs: []
      };
    }
    return await new Promise((resolve) => {
      function listener(e) {
        resolve(onRecordingCompleted(e.data));
        panelInstance.removeEventListener("RecordingCompleted" /* RECORDING_COMPLETED */, listener);
      }
      panelInstance.addEventListener("RecordingCompleted" /* RECORDING_COMPLETED */, listener);
      panelInstance.recordReload();
    });
  }
  static async handleExternalAnalyzeRequest(prompt) {
    const data = TimelinePanel.instance().getOrCreateExternalAIConversationData();
    return await data.conversationHandler.handleExternalRequest({
      conversationType: AiAssistanceModel.AiHistoryStorage.ConversationType.PERFORMANCE,
      prompt,
      data
    });
  }
}
export var State = /* @__PURE__ */ ((State2) => {
  State2["IDLE"] = "Idle";
  State2["START_PENDING"] = "StartPending";
  State2["RECORDING"] = "Recording";
  State2["STOP_PENDING"] = "StopPending";
  State2["LOADING"] = "Loading";
  State2["RECORDING_FAILED"] = "RecordingFailed";
  return State2;
})(State || {});
export const rowHeight = 18;
export const headerHeight = 20;
export class TraceRevealer {
  async reveal(trace) {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    TimelinePanel.instance().loadFromTraceFile(trace);
  }
}
export class ParsedTraceRevealer {
  async reveal(traceRevealer) {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    TimelinePanel.instance().revealParsedTrace(traceRevealer);
  }
}
export class ParsedTraceRevealable {
  constructor(parsedTrace) {
    this.parsedTrace = parsedTrace;
  }
}
export class EventRevealer {
  async reveal(rEvent) {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    TimelinePanel.instance().select(selectionFromEvent(rEvent.event));
  }
}
export class InsightRevealer {
  async reveal(revealable) {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    TimelinePanel.instance().revealInsight(revealable.insight);
  }
}
export class CoreVitalsRevealer {
  async reveal(revealable) {
    await UI.ViewManager.ViewManager.instance().showView("timeline");
    TimelinePanel.instance().revealCoreVitals(revealable);
  }
}
export class ActionDelegate {
  handleAction(context, actionId) {
    const panel = context.flavor(TimelinePanel);
    if (panel === null) {
      return false;
    }
    switch (actionId) {
      case "timeline.toggle-recording":
        void panel.toggleRecording();
        return true;
      case "timeline.record-reload":
        panel.recordReload();
        return true;
      case "timeline.save-to-file":
        void panel.handleSaveToFileAction();
        return true;
      case "timeline.load-from-file":
        panel.selectFileToLoad();
        return true;
      case "timeline.jump-to-previous-frame":
        panel.jumpToFrame(-1);
        return true;
      case "timeline.jump-to-next-frame":
        panel.jumpToFrame(1);
        return true;
      case "timeline.show-history":
        void panel.showHistoryDropdown();
        return true;
      case "timeline.previous-recording":
        panel.navigateHistory(1);
        return true;
      case "timeline.next-recording":
        panel.navigateHistory(-1);
        return true;
    }
    return false;
  }
}
export class SelectedInsight {
  constructor(insight) {
    this.insight = insight;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["IS_VIEWING_TRACE"] = "IsViewingTrace";
  Events2["RECORDING_COMPLETED"] = "RecordingCompleted";
  return Events2;
})(Events || {});
//# sourceMappingURL=TimelinePanel.js.map
