"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Root from "../../core/root/root.js";
import * as AIAssistance from "../../models/ai_assistance/ai_assistance.js";
import * as Trace from "../../models/trace/trace.js";
import * as SourceMapsResolver from "../../models/trace_source_maps_resolver/trace_source_maps_resolver.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import { CompatibilityTracksAppender } from "./CompatibilityTracksAppender.js";
import { initiatorsDataToDraw } from "./Initiators.js";
import { ModificationsManager } from "./ModificationsManager.js";
import { ThreadAppender } from "./ThreadAppender.js";
import timelineFlamechartPopoverStyles from "./timelineFlamechartPopover.css.js";
import { FlameChartStyle, Selection } from "./TimelineFlameChartView.js";
import {
  selectionFromEvent,
  selectionIsRange,
  selectionsEqual
} from "./TimelineSelection.js";
import { buildPersistedConfig } from "./TrackConfiguration.js";
import * as Utils from "./utils/utils.js";
const UIStrings = {
  /**
   * @description Text for rendering frames
   */
  frames: "Frames",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  idleFrame: "Idle frame",
  /**
   * @description Text in Timeline Frame Chart Data Provider of the Performance panel
   */
  droppedFrame: "Dropped frame",
  /**
   * @description Text in Timeline Frame Chart Data Provider of the Performance panel
   */
  partiallyPresentedFrame: "Partially-presented frame",
  /**
   * @description Text for a rendering frame
   */
  frame: "Frame",
  /**
   * @description Text for Hiding a function from the Flame Chart
   */
  hideFunction: "Hide function",
  /**
   * @description Text for Hiding all children of a function from the Flame Chart
   */
  hideChildren: "Hide children",
  /**
   * @description Text for Hiding all child entries that are identical to the selected entry from the Flame Chart
   */
  hideRepeatingChildren: "Hide repeating children",
  /**
   * @description Text for remove script from ignore list from the Flame Chart
   */
  removeScriptFromIgnoreList: "Remove script from ignore list",
  /**
   * @description Text for add script to ignore list from the Flame Chart
   */
  addScriptToIgnoreList: "Add script to ignore list",
  /**
   * @description Text for an action that shows all of the hidden children of an entry
   */
  resetChildren: "Reset children",
  /**
   * @description Text for an action that shows all of the hidden entries of the Flame Chart
   */
  resetTrace: "Reset trace",
  /**
   * @description Text of a context menu item to redirect to the AI assistance panel and to start a chat.
   */
  startAChat: "Start a chat",
  /**
   * @description Context menu item in Performance panel to label an entry.
   */
  labelEntry: "Label entry",
  /**
   * @description Context menu item in Performance panel to assess the purpose of an entry via AI.
   */
  assessThePurpose: "Assess the purpose",
  /**
   * @description Context menu item in Performance panel to identify time spent in a call tree via AI.
   */
  identifyTimeSpent: "Identify time spent",
  /**
   * @description Context menu item in Performance panel to find improvements for a call tree via AI.
   */
  findImprovements: "Find improvements"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/TimelineFlameChartDataProvider.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class TimelineFlameChartDataProvider extends Common.ObjectWrapper.ObjectWrapper {
  droppedFramePattern;
  partialFramePattern;
  #timelineData = null;
  currentLevel = 0;
  compatibilityTracksAppender = null;
  parsedTrace = null;
  #minimumBoundary = 0;
  timeSpan = 0;
  framesGroupStyle;
  screenshotsGroupStyle;
  // Contains all the entries that are DRAWN onto the track. Entries that have
  // been hidden - either by a user action, or because they aren't visible at
  // all - will not appear in this array and it will change per-render. For
  // example, if a user collapses an icicle in the flamechart, those entries
  // that are now hidden will no longer be in this array.
  // This also includes entrys that used to be special cased (e.g.
  // TimelineFrames) that are now of type Types.Events.Event and so the old
  // `TimelineFlameChartEntry` type has been removed in faovur of using
  // Trace.Types.Events.Event directly. See crrev.com/c/5973695 for details.
  entryData = [];
  entryTypeByLevel = [];
  entryIndexToTitle = [];
  #lastInitiatorEntryIndex = -1;
  lastSelection = null;
  #font = `${PerfUI.Font.DEFAULT_FONT_SIZE} ${PerfUI.Font.getFontFamilyForCanvas()}`;
  #eventIndexByEvent = /* @__PURE__ */ new WeakMap();
  #entityMapper = null;
  /**
   * When we create initiator chains for a selected event, we store those
   * chains in this map so that if the user reselects the same event we do not
   * have to recalculate. This is reset when the trace changes.
   */
  #initiatorsCache = /* @__PURE__ */ new Map();
  #persistedGroupConfigSetting = null;
  constructor() {
    super();
    this.reset();
    [this.droppedFramePattern, this.partialFramePattern] = this.preparePatternCanvas();
    this.framesGroupStyle = this.buildGroupStyle({ useFirstLineForOverview: true });
    this.screenshotsGroupStyle = this.buildGroupStyle({
      useFirstLineForOverview: true,
      nestingLevel: 1,
      collapsible: PerfUI.FlameChart.GroupCollapsibleState.NEVER,
      itemsHeight: 150
    });
    ThemeSupport.ThemeSupport.instance().addEventListener(ThemeSupport.ThemeChangeEvent.eventName, () => {
      const headers = [
        this.framesGroupStyle,
        this.screenshotsGroupStyle
      ];
      for (const header of headers) {
        header.color = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-on-surface");
        header.backgroundColor = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container");
      }
    });
    Utils.ImageCache.emitter.addEventListener(
      "screenshot-loaded",
      () => this.dispatchEventToListeners("DataChanged" /* DATA_CHANGED */)
    );
    Common.Settings.Settings.instance().moduleSetting("skip-stack-frames-pattern").addChangeListener(this.#onIgnoreListChanged.bind(this));
    Common.Settings.Settings.instance().moduleSetting("skip-content-scripts").addChangeListener(this.#onIgnoreListChanged.bind(this));
    Common.Settings.Settings.instance().moduleSetting("automatically-ignore-list-known-third-party-scripts").addChangeListener(this.#onIgnoreListChanged.bind(this));
    Common.Settings.Settings.instance().moduleSetting("enable-ignore-listing").addChangeListener(this.#onIgnoreListChanged.bind(this));
    Common.Settings.Settings.instance().moduleSetting("skip-anonymous-scripts").addChangeListener(this.#onIgnoreListChanged.bind(this));
  }
  handleTrackConfigurationChange(groups, indexesInVisualOrder) {
    if (!this.#persistedGroupConfigSetting) {
      return;
    }
    if (!this.parsedTrace) {
      return;
    }
    const persistedDataForTrace = buildPersistedConfig(groups, indexesInVisualOrder);
    this.#persistedGroupConfigSetting.set(persistedDataForTrace);
  }
  setPersistedGroupConfigSetting(setting) {
    this.#persistedGroupConfigSetting = setting;
  }
  hasTrackConfigurationMode() {
    return true;
  }
  getPossibleActions(entryIndex, groupIndex) {
    const data = this.timelineData();
    if (!data) {
      return;
    }
    const group = data.groups.at(groupIndex);
    if (!group || !group.expanded || !group.showStackContextMenu) {
      return;
    }
    return this.findPossibleContextMenuActions(entryIndex);
  }
  customizedContextMenu(mouseEvent, entryIndex, groupIndex) {
    const entry = this.eventByIndex(entryIndex);
    if (!entry) {
      return;
    }
    const possibleActions = this.getPossibleActions(entryIndex, groupIndex);
    const PERF_AI_ACTION_ID = "drjones.performance-panel-context";
    const perfAIEntryPointEnabled = Boolean(entry && this.parsedTrace && UI.ActionRegistry.ActionRegistry.instance().hasAction(PERF_AI_ACTION_ID));
    if (!possibleActions && !perfAIEntryPointEnabled) {
      return;
    }
    const contextMenu = new UI.ContextMenu.ContextMenu(mouseEvent);
    if (perfAIEntryPointEnabled && this.parsedTrace) {
      const callTree = AIAssistance.AICallTree.AICallTree.fromEvent(entry, this.parsedTrace);
      if (callTree) {
        let appendSubmenuPromptAction2 = function(submenu2, action2, label, prompt, jslogContext) {
          submenu2.defaultSection().appendItem(
            label,
            () => action2.execute({ prompt }),
            { disabled: !action2.enabled(), jslogContext }
          );
        };
        var appendSubmenuPromptAction = appendSubmenuPromptAction2;
        const action = UI.ActionRegistry.ActionRegistry.instance().getAction(PERF_AI_ACTION_ID);
        const submenu = contextMenu.footerSection().appendSubMenuItem(action.title(), false, PERF_AI_ACTION_ID);
        submenu.defaultSection().appendAction(PERF_AI_ACTION_ID, i18nString(UIStrings.startAChat));
        submenu.defaultSection().appendItem(i18nString(UIStrings.labelEntry), () => {
          this.dispatchEventToListeners(
            "EntryLabelAnnotationAdded" /* ENTRY_LABEL_ANNOTATION_ADDED */,
            { entryIndex, withLinkCreationButton: false }
          );
        }, {
          jslogContext: "timeline.annotations.create-entry-label"
        });
        appendSubmenuPromptAction2(
          submenu,
          action,
          i18nString(UIStrings.assessThePurpose),
          "What's the purpose of this entry?",
          PERF_AI_ACTION_ID + ".purpose"
        );
        appendSubmenuPromptAction2(
          submenu,
          action,
          i18nString(UIStrings.identifyTimeSpent),
          "Where is most time being spent in this call tree?",
          PERF_AI_ACTION_ID + ".time-spent"
        );
        appendSubmenuPromptAction2(
          submenu,
          action,
          i18nString(UIStrings.findImprovements),
          "How can I reduce the time of this call tree?",
          PERF_AI_ACTION_ID + ".improvements"
        );
      }
    }
    if (!possibleActions) {
      return contextMenu;
    }
    const hideEntryOption = contextMenu.defaultSection().appendItem(i18nString(UIStrings.hideFunction), () => {
      this.modifyTree(PerfUI.FlameChart.FilterAction.MERGE_FUNCTION, entryIndex);
    }, {
      disabled: !possibleActions?.[PerfUI.FlameChart.FilterAction.MERGE_FUNCTION],
      jslogContext: "hide-function"
    });
    hideEntryOption.setAccelerator(UI.KeyboardShortcut.Keys.H, [UI.KeyboardShortcut.Modifiers.None]);
    hideEntryOption.setIsDevToolsPerformanceMenuItem(true);
    const hideChildrenOption = contextMenu.defaultSection().appendItem(i18nString(UIStrings.hideChildren), () => {
      this.modifyTree(PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION, entryIndex);
    }, {
      disabled: !possibleActions?.[PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION],
      jslogContext: "hide-children"
    });
    hideChildrenOption.setAccelerator(UI.KeyboardShortcut.Keys.C, [UI.KeyboardShortcut.Modifiers.None]);
    hideChildrenOption.setIsDevToolsPerformanceMenuItem(true);
    const hideRepeatingChildrenOption = contextMenu.defaultSection().appendItem(i18nString(UIStrings.hideRepeatingChildren), () => {
      this.modifyTree(PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS, entryIndex);
    }, {
      disabled: !possibleActions?.[PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS],
      jslogContext: "hide-repeating-children"
    });
    hideRepeatingChildrenOption.setAccelerator(UI.KeyboardShortcut.Keys.R, [UI.KeyboardShortcut.Modifiers.None]);
    hideRepeatingChildrenOption.setIsDevToolsPerformanceMenuItem(true);
    const resetChildrenOption = contextMenu.defaultSection().appendItem(i18nString(UIStrings.resetChildren), () => {
      this.modifyTree(PerfUI.FlameChart.FilterAction.RESET_CHILDREN, entryIndex);
    }, {
      disabled: !possibleActions?.[PerfUI.FlameChart.FilterAction.RESET_CHILDREN],
      jslogContext: "reset-children"
    });
    resetChildrenOption.setAccelerator(UI.KeyboardShortcut.Keys.U, [UI.KeyboardShortcut.Modifiers.None]);
    resetChildrenOption.setIsDevToolsPerformanceMenuItem(true);
    contextMenu.defaultSection().appendItem(i18nString(UIStrings.resetTrace), () => {
      this.modifyTree(PerfUI.FlameChart.FilterAction.UNDO_ALL_ACTIONS, entryIndex);
    }, {
      disabled: !possibleActions?.[PerfUI.FlameChart.FilterAction.UNDO_ALL_ACTIONS],
      jslogContext: "reset-trace"
    });
    if (!this.parsedTrace || Trace.Types.Events.isLegacyTimelineFrame(entry)) {
      return contextMenu;
    }
    const url = SourceMapsResolver.SourceMapsResolver.resolvedURLForEntry(this.parsedTrace, entry);
    if (!url) {
      return contextMenu;
    }
    if (Utils.IgnoreList.isIgnoreListedEntry(entry)) {
      contextMenu.defaultSection().appendItem(i18nString(UIStrings.removeScriptFromIgnoreList), () => {
        Workspace.IgnoreListManager.IgnoreListManager.instance().unIgnoreListURL(url);
        this.#onIgnoreListChanged();
      }, {
        jslogContext: "remove-from-ignore-list"
      });
    } else {
      contextMenu.defaultSection().appendItem(i18nString(UIStrings.addScriptToIgnoreList), () => {
        Workspace.IgnoreListManager.IgnoreListManager.instance().ignoreListURL(url);
        this.#onIgnoreListChanged();
      }, {
        jslogContext: "add-to-ignore-list"
      });
    }
    return contextMenu;
  }
  #onIgnoreListChanged() {
    this.timelineData(
      /* rebuild= */
      true
    );
    this.dispatchEventToListeners("DataChanged" /* DATA_CHANGED */);
  }
  modifyTree(action, entryIndex) {
    const entry = this.entryData[entryIndex];
    ModificationsManager.activeManager()?.getEntriesFilter().applyFilterAction({ type: action, entry });
    this.timelineData(true);
    this.buildFlowForInitiator(entryIndex);
    this.dispatchEventToListeners("DataChanged" /* DATA_CHANGED */);
  }
  findPossibleContextMenuActions(entryIndex) {
    const entry = this.entryData[entryIndex];
    return ModificationsManager.activeManager()?.getEntriesFilter().findPossibleActions(entry);
  }
  handleFlameChartTransformKeyboardEvent(event, entryIndex, groupIndex) {
    const possibleActions = this.getPossibleActions(entryIndex, groupIndex);
    if (!possibleActions) {
      return;
    }
    let handled = false;
    if (event.code === "KeyH" && possibleActions[PerfUI.FlameChart.FilterAction.MERGE_FUNCTION]) {
      this.modifyTree(PerfUI.FlameChart.FilterAction.MERGE_FUNCTION, entryIndex);
      handled = true;
    } else if (event.code === "KeyC" && possibleActions[PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION]) {
      this.modifyTree(PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION, entryIndex);
      handled = true;
    } else if (event.code === "KeyR" && possibleActions[PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS]) {
      this.modifyTree(PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS, entryIndex);
      handled = true;
    } else if (event.code === "KeyU") {
      this.modifyTree(PerfUI.FlameChart.FilterAction.RESET_CHILDREN, entryIndex);
      handled = true;
    }
    if (handled) {
      event.consume(true);
    }
  }
  buildGroupStyle(extra) {
    const defaultGroupStyle = {
      padding: 4,
      height: 17,
      collapsible: PerfUI.FlameChart.GroupCollapsibleState.ALWAYS,
      color: ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-on-surface"),
      backgroundColor: ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container"),
      nestingLevel: 0,
      shareHeaderLine: true
    };
    return Object.assign(defaultGroupStyle, extra);
  }
  setModel(parsedTrace, entityMapper) {
    this.reset();
    this.parsedTrace = parsedTrace;
    const { traceBounds } = parsedTrace.data.Meta;
    const minTime = Trace.Helpers.Timing.microToMilli(traceBounds.min);
    const maxTime = Trace.Helpers.Timing.microToMilli(traceBounds.max);
    this.#minimumBoundary = minTime;
    this.timeSpan = minTime === maxTime ? 1e3 : maxTime - this.#minimumBoundary;
    this.#entityMapper = entityMapper;
  }
  /**
   * Instances and caches a CompatibilityTracksAppender using the
   * internal flame chart data and the trace parsed data coming from the
   * trace engine.
   * The model data must have been set to the data provider instance before
   * attempting to instance the CompatibilityTracksAppender.
   */
  compatibilityTracksAppenderInstance(forceNew = false) {
    if (!this.compatibilityTracksAppender || forceNew) {
      if (!this.parsedTrace) {
        throw new Error(
          "Attempted to instantiate a CompatibilityTracksAppender without having set the trace parse data first."
        );
      }
      this.#timelineData = this.#instantiateTimelineData();
      this.compatibilityTracksAppender = new CompatibilityTracksAppender(
        this.#timelineData,
        this.parsedTrace,
        this.entryData,
        this.entryTypeByLevel,
        this.#entityMapper
      );
    }
    return this.compatibilityTracksAppender;
  }
  #insertEventToEntryData(event) {
    this.entryData.push(event);
    return this.entryData.length - 1;
  }
  /**
   * Returns the instance of the timeline flame chart data, without
   * adding data to it. In case the timeline data hasn't been instanced
   * creates a new instance and returns it.
   */
  #instantiateTimelineData() {
    if (!this.#timelineData) {
      this.#timelineData = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
    }
    return this.#timelineData;
  }
  /**
   * Builds the flame chart data whilst allowing for a custom filtering of track appenders.
   * This is ONLY to be used in test environments.
   */
  buildWithCustomTracksForTest(options) {
    const compatAppender = this.compatibilityTracksAppenderInstance();
    const appenders = compatAppender.allVisibleTrackAppenders();
    let visibleTrackIndexCounter = 0;
    for (const appender of appenders) {
      const trackName = appender instanceof ThreadAppender ? appender.trackName() : appender.appenderName;
      const shouldIncludeTrack = options?.filterTracks?.call(null, trackName, visibleTrackIndexCounter) ?? true;
      if (!shouldIncludeTrack) {
        continue;
      }
      const shouldExpandTrack = options?.expandTracks?.call(null, trackName, visibleTrackIndexCounter) ?? true;
      this.currentLevel = appender.appendTrackAtLevel(this.currentLevel, shouldExpandTrack);
      visibleTrackIndexCounter++;
    }
  }
  groupTreeEvents(group) {
    return this.compatibilityTracksAppender?.groupEventsForTreeView(group) ?? null;
  }
  mainFrameNavigationStartEvents() {
    if (!this.parsedTrace) {
      return [];
    }
    return this.parsedTrace.data.Meta.mainFrameNavigations;
  }
  entryTitle(entryIndex) {
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "Screenshot" /* SCREENSHOT */) {
      return "";
    }
    if (entryType === "TrackAppender" /* TRACK_APPENDER */) {
      const timelineData = this.#timelineData;
      const eventLevel = timelineData.entryLevels[entryIndex];
      const event = this.entryData[entryIndex];
      return this.compatibilityTracksAppender?.titleForEvent(event, eventLevel) || null;
    }
    let title = this.entryIndexToTitle[entryIndex];
    if (!title) {
      title = `Unexpected entryIndex ${entryIndex}`;
      console.error(title);
    }
    return title;
  }
  textColor(index) {
    const event = this.entryData[index];
    return Utils.IgnoreList.isIgnoreListedEntry(event) ? "#888" : FlameChartStyle.textColor;
  }
  entryFont(_index) {
    return this.#font;
  }
  /**
   * Clear the cache and rebuild the timeline data This should be called
   * when the trace file is the same but we want to rebuild the timeline
   * data. Some possible example: when we hide/unhide an event, or the
   * ignore list is changed etc.
   */
  rebuildTimelineData() {
    this.currentLevel = 0;
    this.entryData = [];
    this.entryTypeByLevel = [];
    this.entryIndexToTitle = [];
    this.#eventIndexByEvent = /* @__PURE__ */ new WeakMap();
    if (this.#timelineData) {
      this.compatibilityTracksAppender?.setFlameChartDataAndEntryData(
        this.#timelineData,
        this.entryData,
        this.entryTypeByLevel
      );
      this.compatibilityTracksAppender?.threadAppenders().forEach(
        (threadAppender) => threadAppender.setHeaderAppended(false)
      );
    }
  }
  /**
   * Reset all data other than the UI elements.
   * This should be called when
   * - initialized the data provider
   * - a new trace file is coming (when `setModel()` is called)
   * etc.
   */
  reset() {
    this.currentLevel = 0;
    this.entryData = [];
    this.entryTypeByLevel = [];
    this.entryIndexToTitle = [];
    this.#eventIndexByEvent = /* @__PURE__ */ new WeakMap();
    this.#minimumBoundary = 0;
    this.timeSpan = 0;
    this.compatibilityTracksAppender?.reset();
    this.compatibilityTracksAppender = null;
    this.#timelineData = null;
    this.parsedTrace = null;
    this.#entityMapper = null;
    this.#lastInitiatorEntryIndex = -1;
    this.#initiatorsCache.clear();
  }
  maxStackDepth() {
    return this.currentLevel;
  }
  /**
   * Builds the flame chart data using the tracks appender (which use
   * the new trace engine). The result built data is cached and returned.
   */
  timelineData(rebuild = false) {
    if (!rebuild && this.#timelineData && this.#timelineData.entryLevels.length !== 0) {
      return this.#timelineData;
    }
    this.#timelineData = PerfUI.FlameChart.FlameChartTimelineData.createEmpty();
    if (rebuild) {
      this.rebuildTimelineData();
    }
    this.currentLevel = 0;
    if (this.parsedTrace) {
      this.compatibilityTracksAppender = this.compatibilityTracksAppenderInstance();
      if (this.parsedTrace.data.Meta.traceIsGeneric) {
        this.#processGenericTrace();
      } else {
        this.#processInspectorTrace();
      }
    }
    return this.#timelineData;
  }
  #processGenericTrace() {
    if (!this.compatibilityTracksAppender) {
      return;
    }
    const appendersByProcess = this.compatibilityTracksAppender.allThreadAppendersByProcess();
    for (const [pid, threadAppenders] of appendersByProcess) {
      const processGroupStyle = this.buildGroupStyle({ shareHeaderLine: false });
      const processName = this.parsedTrace?.data.Meta.processNames.get(pid)?.args.name || "Process";
      this.appendHeader(`${processName} (${pid})`, processGroupStyle, true, false);
      for (const appender of threadAppenders) {
        appender.setHeaderNestingLevel(1);
        this.currentLevel = appender.appendTrackAtLevel(this.currentLevel);
      }
    }
  }
  #processInspectorTrace() {
    this.#appendFramesAndScreenshotsTrack();
    const weight = (track) => {
      switch (track.appenderName) {
        case "Animations":
          return 0;
        case "Timings":
          return 1;
        case "Interactions":
          return 2;
        case "LayoutShifts":
          return 3;
        case "Extension":
          return 4;
        case "Thread":
          return 5;
        case "ServerTimings":
          return 6;
        case "GPU":
          return 7;
        case "Thread_AuctionWorklet":
          return 8;
        default:
          return 9;
      }
    };
    const allTrackAppenders = this.compatibilityTracksAppender ? this.compatibilityTracksAppender.allVisibleTrackAppenders() : [];
    allTrackAppenders.sort((a, b) => weight(a) - weight(b));
    for (const appender of allTrackAppenders) {
      if (!this.parsedTrace) {
        continue;
      }
      this.currentLevel = appender.appendTrackAtLevel(this.currentLevel);
      if (this.#timelineData && !this.#timelineData.selectedGroup) {
        if (appender instanceof ThreadAppender && (appender.threadType === Trace.Handlers.Threads.ThreadType.MAIN_THREAD || appender.threadType === Trace.Handlers.Threads.ThreadType.CPU_PROFILE)) {
          const group = this.compatibilityTracksAppender?.groupForAppender(appender);
          if (group) {
            this.#timelineData.selectedGroup = group;
          }
        }
      }
    }
    if (this.#timelineData?.selectedGroup) {
      this.#timelineData.selectedGroup.expanded = true;
    }
  }
  minimumBoundary() {
    return this.#minimumBoundary;
  }
  totalTime() {
    return this.timeSpan;
  }
  search(visibleWindow, filter) {
    const results = [];
    this.timelineData();
    for (let i = 0; i < this.entryData.length; ++i) {
      const entry = this.entryData[i];
      if (!entry) {
        continue;
      }
      if (Trace.Types.Events.isLegacyTimelineFrame(entry)) {
        continue;
      }
      if (Trace.Types.Events.isLegacyScreenshot(entry)) {
        continue;
      }
      if (!Trace.Helpers.Timing.eventIsInBounds(entry, visibleWindow)) {
        continue;
      }
      if (!filter || filter.accept(entry, this.parsedTrace?.data || void 0)) {
        const startTimeMilli = Trace.Helpers.Timing.microToMilli(entry.ts);
        results.push({ index: i, startTimeMilli, provider: "main" });
      }
    }
    return results;
  }
  getEntryTypeForLevel(level) {
    return this.entryTypeByLevel[level];
  }
  /**
   * The frames and screenshots track is special cased because it is rendered
   * differently to the rest of the tracks and not as a series of events. This
   * is why it is not done via the appender system; we track frames &
   * screenshots as a different EntryType to the TrackAppender entries,
   * because then when it comes to drawing we can decorate them differently.
   **/
  #appendFramesAndScreenshotsTrack() {
    if (this.entryData.length) {
      throw new Error("expected this.entryData to be empty");
    }
    if (!this.parsedTrace) {
      return;
    }
    const filmStrip = Trace.Extras.FilmStrip.fromHandlerData(this.parsedTrace.data);
    const hasScreenshots = filmStrip.frames.length > 0;
    const hasFrames = this.parsedTrace.data.Frames.frames.length > 0;
    if (!hasFrames && !hasScreenshots) {
      return;
    }
    this.framesGroupStyle.collapsible = hasScreenshots ? PerfUI.FlameChart.GroupCollapsibleState.ALWAYS : PerfUI.FlameChart.GroupCollapsibleState.NEVER;
    const expanded = Root.Runtime.Runtime.queryParam("flamechart-force-expand") === "frames";
    this.appendHeader(i18nString(UIStrings.frames), this.framesGroupStyle, false, expanded);
    this.entryTypeByLevel[this.currentLevel] = "Frame" /* FRAME */;
    for (const frame of this.parsedTrace.data.Frames.frames) {
      this.#appendFrame(frame);
    }
    ++this.currentLevel;
    if (!hasScreenshots) {
      return;
    }
    this.#appendScreenshots(filmStrip);
  }
  #appendScreenshots(filmStrip) {
    if (!this.#timelineData || !this.parsedTrace) {
      return;
    }
    this.appendHeader(
      "",
      this.screenshotsGroupStyle,
      false
      /* selectable */
    );
    this.entryTypeByLevel[this.currentLevel] = "Screenshot" /* SCREENSHOT */;
    const traceEnd = Trace.Helpers.Timing.traceWindowMilliSeconds(this.parsedTrace.data.Meta.traceBounds).max;
    for (let i = 0; i < filmStrip.frames.length; ++i) {
      const currentFrame = filmStrip.frames[i];
      const nextFrame = filmStrip.frames[i + 1];
      const startTimeMillis = Trace.Helpers.Timing.microToMilli(currentFrame.screenshotEvent.ts);
      const endTimeMillis = nextFrame ? Trace.Helpers.Timing.microToMilli(nextFrame.screenshotEvent.ts) : traceEnd;
      const durationMillis = endTimeMillis - startTimeMillis;
      const index = this.#insertEventToEntryData(currentFrame.screenshotEvent);
      this.#timelineData.entryLevels.splice(index, 0, this.currentLevel);
      this.#timelineData.entryStartTimes.splice(index, 0, startTimeMillis);
      this.#timelineData.entryTotalTimes.splice(index, 0, durationMillis);
      this.entryIndexToTitle.splice(index, 0, "");
    }
    ++this.currentLevel;
  }
  #entryTypeForIndex(entryIndex) {
    const level = this.timelineData().entryLevels[entryIndex];
    return this.entryTypeByLevel[level];
  }
  preparePopoverElement(entryIndex) {
    let time = "";
    let title;
    let warningElements = [];
    let timeElementClassName = "popoverinfo-time";
    const additionalContent = [];
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "TrackAppender" /* TRACK_APPENDER */) {
      if (!this.compatibilityTracksAppender) {
        return null;
      }
      const event = this.entryData[entryIndex];
      const timelineData = this.#timelineData;
      const eventLevel = timelineData.entryLevels[entryIndex];
      const popoverInfo = this.compatibilityTracksAppender.popoverInfo(event, eventLevel);
      title = popoverInfo.title;
      time = popoverInfo.formattedTime;
      warningElements = popoverInfo.warningElements || warningElements;
      if (popoverInfo.additionalElements?.length) {
        additionalContent.push(...popoverInfo.additionalElements);
      }
      this.dispatchEventToListeners("FlameChartItemHovered" /* FLAME_CHART_ITEM_HOVERED */, event);
    } else if (entryType === "Frame" /* FRAME */) {
      const frame = this.entryData[entryIndex];
      time = i18n.TimeUtilities.preciseMillisToString(Trace.Helpers.Timing.microToMilli(frame.duration), 1);
      if (frame.idle) {
        title = i18nString(UIStrings.idleFrame);
      } else if (frame.dropped) {
        title = frame.isPartial ? i18nString(UIStrings.partiallyPresentedFrame) : i18nString(UIStrings.droppedFrame);
        timeElementClassName = "popoverinfo-warning";
      } else {
        title = i18nString(UIStrings.frame);
      }
    } else {
      this.dispatchEventToListeners("FlameChartItemHovered" /* FLAME_CHART_ITEM_HOVERED */, null);
      return null;
    }
    const popoverElement = document.createElement("div");
    const root = UI.UIUtils.createShadowRootWithCoreStyles(popoverElement, { cssFile: timelineFlamechartPopoverStyles });
    const popoverContents = root.createChild("div", "timeline-flamechart-popover");
    popoverContents.createChild("span", timeElementClassName).textContent = time;
    popoverContents.createChild("span", "popoverinfo-title").textContent = title;
    for (const warningElement of warningElements) {
      warningElement.classList.add("popoverinfo-warning");
      popoverContents.appendChild(warningElement);
    }
    for (const elem of additionalContent) {
      popoverContents.appendChild(elem);
    }
    return popoverElement;
  }
  preparePopoverForCollapsedArrow(entryIndex) {
    const element = document.createElement("div");
    const root = UI.UIUtils.createShadowRootWithCoreStyles(element, { cssFile: timelineFlamechartPopoverStyles });
    const entry = this.entryData[entryIndex];
    const hiddenEntriesAmount = ModificationsManager.activeManager()?.getEntriesFilter().findHiddenDescendantsAmount(entry);
    if (!hiddenEntriesAmount) {
      return null;
    }
    const contents = root.createChild("div", "timeline-flamechart-popover");
    contents.createChild("span", "popoverinfo-title").textContent = hiddenEntriesAmount + " hidden";
    return element;
  }
  getDrawOverride(entryIndex) {
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType !== "TrackAppender" /* TRACK_APPENDER */) {
      return;
    }
    const timelineData = this.#timelineData;
    const eventLevel = timelineData.entryLevels[entryIndex];
    const event = this.entryData[entryIndex];
    return this.compatibilityTracksAppender?.getDrawOverride(event, eventLevel);
  }
  #entryColorForFrame(entryIndex) {
    const frame = this.entryData[entryIndex];
    if (frame.idle) {
      return "white";
    }
    if (frame.dropped) {
      if (frame.isPartial) {
        return "#f0e442";
      }
      return "#f08080";
    }
    return "#d7f0d1";
  }
  entryColor(entryIndex) {
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "Frame" /* FRAME */) {
      return this.#entryColorForFrame(entryIndex);
    }
    if (entryType === "TrackAppender" /* TRACK_APPENDER */) {
      const timelineData = this.#timelineData;
      const eventLevel = timelineData.entryLevels[entryIndex];
      const event = this.entryData[entryIndex];
      return this.compatibilityTracksAppender?.colorForEvent(event, eventLevel) || "";
    }
    return "";
  }
  preparePatternCanvas() {
    const size = 17;
    const droppedFrameCanvas = document.createElement("canvas");
    const partialFrameCanvas = document.createElement("canvas");
    droppedFrameCanvas.width = droppedFrameCanvas.height = size;
    partialFrameCanvas.width = partialFrameCanvas.height = size;
    const ctx = droppedFrameCanvas.getContext("2d", { willReadFrequently: true });
    ctx.translate(size * 0.5, size * 0.5);
    ctx.rotate(Math.PI * 0.25);
    ctx.translate(-size * 0.5, -size * 0.5);
    ctx.fillStyle = "rgb(255, 255, 255)";
    for (let x = -size; x < size * 2; x += 3) {
      ctx.fillRect(x, -size, 1, size * 3);
    }
    const droppedFramePattern = ctx.createPattern(droppedFrameCanvas, "repeat");
    const ctx2 = partialFrameCanvas.getContext("2d", { willReadFrequently: true });
    ctx2.strokeStyle = "rgb(255, 255, 255)";
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(17, 0);
    ctx2.lineTo(10, 7);
    ctx2.moveTo(8, 9);
    ctx2.lineTo(2, 15);
    ctx2.stroke();
    const partialFramePattern = ctx.createPattern(partialFrameCanvas, "repeat");
    return [droppedFramePattern, partialFramePattern];
  }
  drawFrame(entryIndex, context, barX, barY, barWidth, barHeight, transformColor) {
    const hPadding = 1;
    const frame = this.entryData[entryIndex];
    barX += hPadding;
    barWidth -= 2 * hPadding;
    context.fillStyle = transformColor(this.entryColor(entryIndex));
    if (frame.dropped) {
      context.fillRect(barX, barY, barWidth, barHeight);
      if (frame.isPartial) {
        context.fillStyle = this.partialFramePattern || context.fillStyle;
      } else {
        context.fillStyle = this.droppedFramePattern || context.fillStyle;
      }
    }
    context.fillRect(barX, barY, barWidth, barHeight);
    const frameDurationText = i18n.TimeUtilities.preciseMillisToString(Trace.Helpers.Timing.microToMilli(frame.duration), 1);
    const textWidth = context.measureText(frameDurationText).width;
    if (textWidth <= barWidth) {
      context.fillStyle = this.textColor(entryIndex);
      context.fillText(frameDurationText, barX + (barWidth - textWidth) / 2, barY + barHeight - 4);
    }
  }
  async drawScreenshot(entryIndex, context, barX, barY, barWidth, barHeight) {
    const screenshot = this.entryData[entryIndex];
    const image = Utils.ImageCache.getOrQueue(screenshot);
    if (!image) {
      return;
    }
    const imageX = barX + 1;
    const imageY = barY + 1;
    const imageHeight = barHeight - 2;
    const scale = imageHeight / image.naturalHeight;
    const imageWidth = Math.floor(image.naturalWidth * scale);
    context.save();
    context.beginPath();
    context.rect(barX, barY, barWidth, barHeight);
    context.clip();
    context.drawImage(image, imageX, imageY, imageWidth, imageHeight);
    context.strokeStyle = "#ccc";
    context.strokeRect(imageX - 0.5, imageY - 0.5, Math.min(barWidth - 1, imageWidth + 1), imageHeight);
    context.restore();
  }
  decorateEntry(entryIndex, context, text, barX, barY, barWidth, barHeight, unclippedBarX, timeToPixelRatio, transformColor) {
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "Frame" /* FRAME */) {
      this.drawFrame(entryIndex, context, barX, barY, barWidth, barHeight, transformColor);
      return true;
    }
    if (entryType === "Screenshot" /* SCREENSHOT */) {
      void this.drawScreenshot(entryIndex, context, barX, barY, barWidth, barHeight);
      return true;
    }
    if (entryType === "TrackAppender" /* TRACK_APPENDER */) {
      const entry = this.entryData[entryIndex];
      if (Trace.Types.Events.isSyntheticInteraction(entry)) {
        this.#drawInteractionEventWithWhiskers(
          context,
          entryIndex,
          text,
          entry,
          barX,
          barY,
          unclippedBarX,
          barWidth,
          barHeight,
          timeToPixelRatio
        );
        return true;
      }
    }
    return false;
  }
  /**
   * Draws the left and right whiskers around an interaction in the timeline.
   * @param context the canvas that will be drawn onto
   * @param entryIndex
   * @param entryTitle the title of the entry
   * @param entry the entry itself
   * @param barX the starting X pixel position of the bar representing this event. This is clipped: if the bar is off the left side of the screen, this value will be 0
   * @param barY the starting Y pixel position of the bar representing this event.
   * @param unclippedBarXStartPixel the starting X pixel position of the bar representing this event, not clipped. This means if the bar is off the left of the screen this will be a negative number.
   * @param barWidth the width of the full bar in pixels
   * @param barHeight the height of the full bar in pixels
   * @param timeToPixelRatio the ratio required to convert a millisecond time to a pixel value.
   **/
  #drawInteractionEventWithWhiskers(context, entryIndex, entryTitle, entry, barX, barY, unclippedBarXStartPixel, barWidth, barHeight, timeToPixelRatio) {
    const beginTime = Trace.Helpers.Timing.microToMilli(entry.ts);
    const entireBarEndXPixel = barX + barWidth;
    function timeToPixel(time) {
      const timeMilli = Trace.Helpers.Timing.microToMilli(time);
      return Math.floor(unclippedBarXStartPixel + (timeMilli - beginTime) * timeToPixelRatio);
    }
    context.save();
    context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container");
    let desiredBoxStartX = timeToPixel(entry.processingStart);
    const desiredBoxEndX = timeToPixel(entry.processingEnd);
    if (entry.processingEnd - entry.processingStart === 0) {
      desiredBoxStartX -= 1;
    }
    context.fillRect(barX, barY - 0.5, desiredBoxStartX - barX, barHeight);
    context.fillRect(desiredBoxEndX, barY - 0.5, entireBarEndXPixel - desiredBoxEndX, barHeight);
    function drawTick(begin, end, y) {
      const tickHeightPx = 6;
      context.moveTo(begin, y - tickHeightPx / 2);
      context.lineTo(begin, y + tickHeightPx / 2);
      context.moveTo(begin, y);
      context.lineTo(end, y);
    }
    const leftWhiskerX = timeToPixel(entry.ts);
    const rightWhiskerX = timeToPixel(Trace.Types.Timing.Micro(entry.ts + entry.dur));
    context.beginPath();
    context.lineWidth = 1;
    context.strokeStyle = "#ccc";
    const lineY = Math.floor(barY + barHeight / 2) + 0.5;
    const leftTick = leftWhiskerX + 0.5;
    const rightTick = rightWhiskerX - 0.5;
    drawTick(leftTick, desiredBoxStartX, lineY);
    drawTick(rightTick, desiredBoxEndX, lineY);
    context.stroke();
    if (entryTitle) {
      const textStartX = desiredBoxStartX > 0 ? desiredBoxStartX : barX;
      context.font = this.#font;
      const textWidth = UI.UIUtils.measureTextWidth(context, entryTitle);
      const textPadding = 5;
      const textBaseline = 5;
      if (textWidth <= desiredBoxEndX - textStartX + textPadding) {
        context.fillStyle = this.textColor(entryIndex);
        context.fillText(entryTitle, textStartX + textPadding, barY + barHeight - textBaseline);
      }
    }
    context.restore();
  }
  forceDecoration(entryIndex) {
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "Frame" /* FRAME */) {
      return true;
    }
    if (entryType === "Screenshot" /* SCREENSHOT */) {
      return true;
    }
    const event = this.entryData[entryIndex];
    if (Trace.Types.Events.isSyntheticInteraction(event)) {
      return true;
    }
    return Boolean(this.parsedTrace?.data.Warnings.perEvent.get(event));
  }
  appendHeader(title, style, selectable, expanded) {
    const group = { startLevel: this.currentLevel, name: title, style, selectable, expanded };
    this.#timelineData.groups.push(group);
    return group;
  }
  #appendFrame(frame) {
    const index = this.#insertEventToEntryData(frame);
    const durationMilliseconds = Trace.Helpers.Timing.microToMilli(frame.duration);
    this.entryIndexToTitle.splice(index, 0, i18n.TimeUtilities.millisToString(durationMilliseconds, true));
    if (!this.#timelineData) {
      return;
    }
    if (Array.isArray(this.#timelineData.entryLevels) && Array.isArray(this.#timelineData.entryTotalTimes) && Array.isArray(this.#timelineData.entryStartTimes)) {
      this.#timelineData.entryLevels.splice(index, 0, this.currentLevel);
      this.#timelineData.entryTotalTimes.splice(index, 0, durationMilliseconds);
      this.#timelineData.entryStartTimes.splice(index, 0, Trace.Helpers.Timing.microToMilli(frame.startTime));
    } else {
      this.#timelineData.entryLevels[index] = this.currentLevel;
      this.#timelineData.entryTotalTimes[index] = durationMilliseconds;
      this.#timelineData.entryStartTimes[index] = Trace.Helpers.Timing.microToMilli(frame.startTime);
    }
  }
  createSelection(entryIndex) {
    const entry = this.entryData[entryIndex];
    const timelineSelection = entry ? selectionFromEvent(entry) : null;
    if (timelineSelection) {
      this.lastSelection = new Selection(timelineSelection, entryIndex);
    }
    return timelineSelection;
  }
  formatValue(value, precision) {
    return i18n.TimeUtilities.preciseMillisToString(value, precision);
  }
  groupForEvent(entryIndex) {
    if (!this.compatibilityTracksAppender) {
      return null;
    }
    const level = this.#timelineData?.entryLevels[entryIndex] ?? null;
    if (level === null) {
      return null;
    }
    const groupForLevel = this.compatibilityTracksAppender.groupForLevel(level);
    if (!groupForLevel) {
      return null;
    }
    return groupForLevel;
  }
  canJumpToEntry(_entryIndex) {
    return false;
  }
  entryIndexForSelection(selection) {
    if (!selection || selectionIsRange(selection) || Trace.Types.Events.isNetworkTrackEntry(selection.event)) {
      return -1;
    }
    if (this.lastSelection && selectionsEqual(this.lastSelection.timelineSelection, selection)) {
      return this.lastSelection.entryIndex;
    }
    const index = this.entryData.indexOf(selection.event);
    if (index === -1) {
      if (this.#timelineData?.selectedGroup) {
        ModificationsManager.activeManager()?.getEntriesFilter().revealEntry(selection.event);
        this.timelineData(true);
      }
    }
    if (index !== -1) {
      this.lastSelection = new Selection(selection, index);
    }
    return index;
  }
  /**
   * Return the index for the given entry. Note that this method assumes that
   * timelineData() has been generated. If it hasn't, this method will return
   * null.
   */
  indexForEvent(targetEvent) {
    const fromCache = this.#eventIndexByEvent.get(targetEvent);
    if (typeof fromCache === "number") {
      return fromCache;
    }
    const index = this.entryData.indexOf(targetEvent);
    const result = index > -1 ? index : null;
    this.#eventIndexByEvent.set(targetEvent, result);
    return result;
  }
  /**
   * Build the data for initiators and initiated entries.
   * @param entryIndex
   * @returns if we should re-render the flame chart (canvas)
   */
  buildFlowForInitiator(entryIndex) {
    if (!this.parsedTrace || !this.compatibilityTracksAppender || !this.#timelineData) {
      return false;
    }
    if (this.#lastInitiatorEntryIndex === entryIndex) {
      return false;
    }
    this.#lastInitiatorEntryIndex = entryIndex;
    const previousInitiatorsDataLength = this.#timelineData.initiatorsData.length;
    if (entryIndex === -1) {
      if (this.#timelineData.initiatorsData.length === 0) {
        return false;
      }
      this.#timelineData.emptyInitiators();
      return true;
    }
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType !== "TrackAppender" /* TRACK_APPENDER */) {
      return false;
    }
    const cached = this.#initiatorsCache.get(entryIndex);
    if (cached) {
      this.#timelineData.initiatorsData = cached;
      return true;
    }
    const event = this.entryData[entryIndex];
    this.#timelineData.emptyInitiators();
    const hiddenEvents = ModificationsManager.activeManager()?.getEntriesFilter().invisibleEntries() ?? [];
    const expandableEntries = ModificationsManager.activeManager()?.getEntriesFilter().expandableEntries() ?? [];
    const initiatorsData = initiatorsDataToDraw(this.parsedTrace, event, hiddenEvents, expandableEntries);
    if (initiatorsData.length === 0) {
      this.#initiatorsCache.set(entryIndex, []);
    }
    if (previousInitiatorsDataLength === 0 && initiatorsData.length === 0) {
      return false;
    }
    for (const initiatorData of initiatorsData) {
      const eventIndex = this.indexForEvent(initiatorData.event);
      const initiatorIndex = this.indexForEvent(initiatorData.initiator);
      if (eventIndex === null || initiatorIndex === null) {
        continue;
      }
      this.#timelineData.initiatorsData.push({
        initiatorIndex,
        eventIndex,
        isInitiatorHidden: initiatorData.isInitiatorHidden,
        isEntryHidden: initiatorData.isEntryHidden
      });
    }
    this.#initiatorsCache.set(entryIndex, this.#timelineData.initiatorsData);
    return true;
  }
  eventByIndex(entryIndex) {
    if (entryIndex < 0) {
      return null;
    }
    const entryType = this.#entryTypeForIndex(entryIndex);
    if (entryType === "TrackAppender" /* TRACK_APPENDER */) {
      return this.entryData[entryIndex];
    }
    if (entryType === "Frame" /* FRAME */) {
      return this.entryData[entryIndex];
    }
    return null;
  }
}
export const InstantEventVisibleDurationMs = Trace.Types.Timing.Milli(1e-3);
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["DATA_CHANGED"] = "DataChanged";
  Events2["FLAME_CHART_ITEM_HOVERED"] = "FlameChartItemHovered";
  Events2["ENTRY_LABEL_ANNOTATION_ADDED"] = "EntryLabelAnnotationAdded";
  return Events2;
})(Events || {});
export var EntryType = /* @__PURE__ */ ((EntryType2) => {
  EntryType2["FRAME"] = "Frame";
  EntryType2["TRACK_APPENDER"] = "TrackAppender";
  EntryType2["SCREENSHOT"] = "Screenshot";
  return EntryType2;
})(EntryType || {});
//# sourceMappingURL=TimelineFlameChartDataProvider.js.map
