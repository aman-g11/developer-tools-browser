"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as Trace from "../../models/trace/trace.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import {
  addDecorationToEvent,
  buildGroupStyle,
  buildTrackHeader,
  getDurationString
} from "./AppenderUtils.js";
import {
  entryIsVisibleInTimeline,
  VisualLoggingTrackName
} from "./CompatibilityTracksAppender.js";
import * as ModificationsManager from "./ModificationsManager.js";
import * as Utils from "./utils/utils.js";
const UIStrings = {
  /**
   * @description Text shown for an entry in the flame chart that is ignored because it matches
   * a predefined ignore list.
   * @example {/analytics\.js$} rule
   */
  onIgnoreList: "On ignore list ({rule})",
  /**
   * @description Refers to the "Main frame", meaning the top level frame. See https://www.w3.org/TR/html401/present/frames.html
   * @example {example.com} PH1
   */
  mainS: "Main \u2014 {PH1}",
  /**
   * @description Refers to the main thread of execution of a program. See https://developer.mozilla.org/en-US/docs/Glossary/Main_thread
   */
  main: "Main",
  /**
   * @description Refers to any frame in the page. See https://www.w3.org/TR/html401/present/frames.html
   * @example {https://example.com} PH1
   */
  frameS: "Frame \u2014 {PH1}",
  /**
   * @description A web worker in the page. See https://developer.mozilla.org/en-US/docs/Web/API/Worker
   * @example {https://google.com} PH1
   */
  workerS: "`Worker` \u2014 {PH1}",
  /**
   * @description A web worker in the page. See https://developer.mozilla.org/en-US/docs/Web/API/Worker
   * @example {FormatterWorker} PH1
   * @example {https://google.com} PH2
   */
  workerSS: "`Worker`: {PH1} \u2014 {PH2}",
  /**
   * @description Label for a web worker exclusively allocated for a purpose.
   */
  dedicatedWorker: "Dedicated `Worker`",
  /**
   * @description A generic name given for a thread running in the browser (sequence of programmed instructions).
   * The placeholder is an enumeration given to the thread.
   * @example {1} PH1
   */
  threadS: "Thread {PH1}",
  /**
   * @description Rasterization in computer graphics.
   */
  raster: "Raster",
  /**
   * @description Threads used for background tasks.
   */
  threadPool: "Thread pool",
  /**
   * @description Name for a thread that rasterizes graphics in a website.
   * @example {2} PH1
   */
  rasterizerThreadS: "Rasterizer thread {PH1}",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   * @example {2} PH1
   */
  threadPoolThreadS: "Thread pool worker {PH1}",
  /**
   * @description Title of a bidder auction worklet with known URL in the timeline flame chart of the Performance panel
   * @example {https://google.com} PH1
   */
  bidderWorkletS: "Bidder Worklet \u2014 {PH1}",
  /**
   * @description Title of a bidder auction worklet in the timeline flame chart of the Performance panel with an unknown URL
   */
  bidderWorklet: "Bidder Worklet",
  /**
   * @description Title of a seller auction worklet in the timeline flame chart of the Performance panel with an unknown URL
   */
  sellerWorklet: "Seller Worklet",
  /**
   * @description Title of an auction worklet in the timeline flame chart of the Performance panel with an unknown URL
   */
  unknownWorklet: "Auction Worklet",
  /**
   * @description Title of control thread of a service process for an auction worklet in the timeline flame chart of the Performance panel with an unknown URL
   */
  workletService: "Auction Worklet service",
  /**
   * @description Title of a seller auction worklet with known URL in the timeline flame chart of the Performance panel
   * @example {https://google.com} PH1
   */
  sellerWorkletS: "Seller Worklet \u2014 {PH1}",
  /**
   * @description Title of an auction worklet with known URL in the timeline flame chart of the Performance panel
   * @example {https://google.com} PH1
   */
  unknownWorkletS: "Auction Worklet \u2014 {PH1}",
  /**
   * @description Title of control thread of a service process for an auction worklet with known URL in the timeline flame chart of the Performance panel
   * @example {https://google.com} PH1
   */
  workletServiceS: "Auction Worklet service \u2014 {PH1}"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/ThreadAppender.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class ThreadAppender {
  appenderName = "Thread";
  #colorGenerator;
  #compatibilityBuilder;
  #parsedTrace;
  #entries = [];
  #tree;
  #processId;
  #threadId;
  #threadDefaultName;
  #expanded = false;
  #headerAppended = false;
  threadType = Trace.Handlers.Threads.ThreadType.MAIN_THREAD;
  isOnMainFrame;
  #showAllEventsEnabled = Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_SHOW_ALL_EVENTS);
  #url = "";
  #headerNestingLevel = null;
  constructor(compatibilityBuilder, parsedTrace, processId, threadId, threadName, type, entries, tree) {
    this.#compatibilityBuilder = compatibilityBuilder;
    this.#colorGenerator = new Common.Color.Generator({ min: 30, max: 330, count: void 0 }, { min: 50, max: 80, count: 3 }, 85);
    this.#colorGenerator.setColorForID("", "#f2ecdc");
    this.#parsedTrace = parsedTrace;
    this.#processId = processId;
    this.#threadId = threadId;
    if (!entries || !tree) {
      throw new Error(`Could not find data for thread with id ${threadId} in process with id ${processId}`);
    }
    this.#entries = entries;
    this.#tree = tree;
    this.#threadDefaultName = threadName || i18nString(UIStrings.threadS, { PH1: threadId });
    this.isOnMainFrame = Boolean(this.#parsedTrace.data.Renderer?.processes.get(processId)?.isOnMainFrame);
    this.threadType = type;
    if (this.#parsedTrace.data.AuctionWorklets.worklets.has(processId)) {
      this.appenderName = "Thread_AuctionWorklet";
    }
    this.#url = this.#parsedTrace.data.Renderer?.processes.get(this.#processId)?.url || "";
  }
  processId() {
    return this.#processId;
  }
  threadId() {
    return this.#threadId;
  }
  /**
   * Appends into the flame chart data the data corresponding to the
   * this thread.
   * @param trackStartLevel the horizontal level of the flame chart events where
   * the track's events will start being appended.
   * @param expanded whether the track should be rendered expanded.
   * @returns the first available level to append more data after having
   * appended the track's events.
   */
  appendTrackAtLevel(trackStartLevel, expanded = false) {
    if (this.#entries.length === 0) {
      return trackStartLevel;
    }
    this.#expanded = expanded;
    return this.#appendTreeAtLevel(trackStartLevel);
  }
  setHeaderNestingLevel(level) {
    this.#headerNestingLevel = level;
  }
  /**
   * Track header is appended only if there are events visible on it.
   * Otherwise we don't append any track. So, instead of preemptively
   * appending a track before appending its events, we only do so once
   * we have detected that the track contains an event that is visible.
   */
  #ensureTrackHeaderAppended(trackStartLevel) {
    if (this.#headerAppended) {
      return;
    }
    if (this.threadType === Trace.Handlers.Threads.ThreadType.RASTERIZER || this.threadType === Trace.Handlers.Threads.ThreadType.THREAD_POOL) {
      this.#appendGroupedTrackHeaderAndTitle(trackStartLevel, this.threadType);
    } else {
      this.#appendTrackHeaderAtLevel(trackStartLevel);
    }
    this.#headerAppended = true;
  }
  setHeaderAppended(headerAppended) {
    this.#headerAppended = headerAppended;
  }
  headerAppended() {
    return this.#headerAppended;
  }
  /**
   * Adds into the flame chart data the header corresponding to this
   * thread. A header is added in the shape of a group in the flame
   * chart data. A group has a predefined style and a reference to the
   * definition of the legacy track (which should be removed in the
   * future).
   * @param currentLevel the flame chart level at which the header is
   * appended.
   */
  #appendTrackHeaderAtLevel(currentLevel) {
    const trackIsCollapsible = this.#entries.length > 0;
    const style = buildGroupStyle({
      shareHeaderLine: false,
      collapsible: trackIsCollapsible ? PerfUI.FlameChart.GroupCollapsibleState.ALWAYS : PerfUI.FlameChart.GroupCollapsibleState.NEVER
    });
    if (this.#headerNestingLevel !== null) {
      style.nestingLevel = this.#headerNestingLevel;
    }
    const visualLoggingName = this.#visualLoggingNameForThread();
    const group = buildTrackHeader(
      visualLoggingName,
      currentLevel,
      this.trackName(),
      style,
      /* selectable= */
      true,
      this.#expanded,
      /* showStackContextMenu= */
      true
    );
    this.#compatibilityBuilder.registerTrackForGroup(group, this);
  }
  #visualLoggingNameForThread() {
    switch (this.threadType) {
      case Trace.Handlers.Threads.ThreadType.MAIN_THREAD:
        return this.isOnMainFrame ? VisualLoggingTrackName.THREAD_MAIN : VisualLoggingTrackName.THREAD_FRAME;
      case Trace.Handlers.Threads.ThreadType.WORKER:
        return VisualLoggingTrackName.THREAD_WORKER;
      case Trace.Handlers.Threads.ThreadType.RASTERIZER:
        return VisualLoggingTrackName.THREAD_RASTERIZER;
      case Trace.Handlers.Threads.ThreadType.AUCTION_WORKLET:
        return VisualLoggingTrackName.THREAD_AUCTION_WORKLET;
      case Trace.Handlers.Threads.ThreadType.OTHER:
        return VisualLoggingTrackName.THREAD_OTHER;
      case Trace.Handlers.Threads.ThreadType.CPU_PROFILE:
        return VisualLoggingTrackName.THREAD_CPU_PROFILE;
      case Trace.Handlers.Threads.ThreadType.THREAD_POOL:
        return VisualLoggingTrackName.THREAD_POOL;
      default:
        return null;
    }
  }
  /**
   * Raster threads are rendered under a single header in the
   * flamechart. However, each thread has a unique title which needs to
   * be added to the flamechart data.
   */
  #appendGroupedTrackHeaderAndTitle(trackStartLevel, threadType) {
    const currentTrackCount = this.#compatibilityBuilder.getCurrentTrackCountForThreadType(threadType);
    if (currentTrackCount === 0) {
      const trackIsCollapsible = this.#entries.length > 0;
      const headerStyle = buildGroupStyle({
        shareHeaderLine: false,
        collapsible: trackIsCollapsible ? PerfUI.FlameChart.GroupCollapsibleState.ALWAYS : PerfUI.FlameChart.GroupCollapsibleState.NEVER
      });
      const headerGroup = buildTrackHeader(
        null,
        trackStartLevel,
        this.trackName(),
        headerStyle,
        /* selectable= */
        false,
        this.#expanded
      );
      this.#compatibilityBuilder.getFlameChartTimelineData().groups.push(headerGroup);
    }
    const titleStyle = buildGroupStyle({ padding: 2, nestingLevel: 1, collapsible: PerfUI.FlameChart.GroupCollapsibleState.NEVER });
    const rasterizerTitle = this.threadType === Trace.Handlers.Threads.ThreadType.RASTERIZER ? i18nString(UIStrings.rasterizerThreadS, { PH1: currentTrackCount + 1 }) : i18nString(UIStrings.threadPoolThreadS, { PH1: currentTrackCount + 1 });
    const visualLoggingName = this.#visualLoggingNameForThread();
    const titleGroup = buildTrackHeader(
      visualLoggingName,
      trackStartLevel,
      rasterizerTitle,
      titleStyle,
      /* selectable= */
      true,
      this.#expanded
    );
    this.#compatibilityBuilder.registerTrackForGroup(titleGroup, this);
  }
  trackName() {
    let threadTypeLabel = null;
    switch (this.threadType) {
      case Trace.Handlers.Threads.ThreadType.MAIN_THREAD:
        threadTypeLabel = this.isOnMainFrame ? i18nString(UIStrings.mainS, { PH1: this.#url }) : i18nString(UIStrings.frameS, { PH1: this.#url });
        break;
      case Trace.Handlers.Threads.ThreadType.CPU_PROFILE:
        threadTypeLabel = i18nString(UIStrings.main);
        break;
      case Trace.Handlers.Threads.ThreadType.WORKER:
        threadTypeLabel = this.#buildNameForWorker();
        break;
      case Trace.Handlers.Threads.ThreadType.RASTERIZER:
        threadTypeLabel = i18nString(UIStrings.raster);
        break;
      case Trace.Handlers.Threads.ThreadType.THREAD_POOL:
        threadTypeLabel = i18nString(UIStrings.threadPool);
        break;
      case Trace.Handlers.Threads.ThreadType.OTHER:
        break;
      case Trace.Handlers.Threads.ThreadType.AUCTION_WORKLET:
        threadTypeLabel = this.#buildNameForAuctionWorklet();
        break;
      default:
        return Platform.assertNever(this.threadType, `Unknown thread type: ${this.threadType}`);
    }
    let suffix = "";
    if (this.#parsedTrace.data.Meta.traceIsGeneric) {
      suffix = suffix + ` (${this.threadId()})`;
    }
    return (threadTypeLabel || this.#threadDefaultName) + suffix;
  }
  getUrl() {
    return this.#url;
  }
  getEntries() {
    return this.#entries;
  }
  #buildNameForAuctionWorklet() {
    const workletMetadataEvent = this.#parsedTrace.data.AuctionWorklets.worklets.get(this.#processId);
    if (!workletMetadataEvent) {
      return i18nString(UIStrings.unknownWorklet);
    }
    const host = workletMetadataEvent.host ? `https://${workletMetadataEvent.host}` : "";
    const shouldAddHost = host.length > 0;
    const isUtilityThread = workletMetadataEvent.args.data.utilityThread.tid === this.#threadId;
    const isBidderOrSeller = workletMetadataEvent.args.data.v8HelperThread.tid === this.#threadId;
    if (isUtilityThread) {
      return shouldAddHost ? i18nString(UIStrings.workletServiceS, { PH1: host }) : i18nString(UIStrings.workletService);
    }
    if (isBidderOrSeller) {
      switch (workletMetadataEvent.type) {
        case Trace.Types.Events.AuctionWorkletType.SELLER:
          return shouldAddHost ? i18nString(UIStrings.sellerWorkletS, { PH1: host }) : i18nString(UIStrings.sellerWorklet);
        case Trace.Types.Events.AuctionWorkletType.BIDDER:
          return shouldAddHost ? i18nString(UIStrings.bidderWorkletS, { PH1: host }) : i18nString(UIStrings.bidderWorklet);
        case Trace.Types.Events.AuctionWorkletType.UNKNOWN:
          return shouldAddHost ? i18nString(UIStrings.unknownWorkletS, { PH1: host }) : i18nString(UIStrings.unknownWorklet);
        default:
          Platform.assertNever(
            workletMetadataEvent.type,
            `Unexpected Auction Worklet Type ${workletMetadataEvent.type}`
          );
      }
    }
    return shouldAddHost ? i18nString(UIStrings.unknownWorkletS, { PH1: host }) : i18nString(UIStrings.unknownWorklet);
  }
  #buildNameForWorker() {
    const url = this.#parsedTrace.data.Renderer?.processes.get(this.#processId)?.url || "";
    const workerId = this.#parsedTrace.data.Workers.workerIdByThread.get(this.#threadId);
    const workerURL = workerId ? this.#parsedTrace.data.Workers.workerURLById.get(workerId) : url;
    let workerName = workerURL ? i18nString(UIStrings.workerS, { PH1: workerURL }) : i18nString(UIStrings.dedicatedWorker);
    const workerTarget = workerId !== void 0 && SDK.TargetManager.TargetManager.instance().targetById(workerId);
    if (workerTarget) {
      workerName = i18nString(UIStrings.workerSS, { PH1: workerTarget.name(), PH2: url });
    }
    return workerName;
  }
  /**
   * Adds into the flame chart data the entries of this thread, which
   * includes trace events and JS calls.
   * @param currentLevel the flame chart level from which entries will
   * be appended.
   * @returns the next level after the last occupied by the appended
   * entries (the first available level to append more data).
   */
  #appendTreeAtLevel(trackStartLevel) {
    return this.#appendNodesAtLevel(this.#tree.roots, trackStartLevel);
  }
  /**
   * Traverses the trees formed by the provided nodes in breadth first
   * fashion and appends each node's entry on each iteration. As each
   * entry is handled, a check for the its visibility or if it's ignore
   * listed is done before appending.
   */
  #appendNodesAtLevel(nodes, startingLevel, parentIsIgnoredListed = false) {
    const invisibleEntries = ModificationsManager.ModificationsManager.activeManager()?.getEntriesFilter().invisibleEntries() ?? [];
    let maxDepthInTree = startingLevel;
    for (const node of nodes) {
      let nextLevel = startingLevel;
      const entry = node.entry;
      const entryIsIgnoreListed = Utils.IgnoreList.isIgnoreListedEntry(entry);
      const entryIsVisible = !invisibleEntries.includes(entry) && (entryIsVisibleInTimeline(entry, this.#parsedTrace) || this.#showAllEventsEnabled);
      const skipEventDueToIgnoreListing = entryIsIgnoreListed && parentIsIgnoredListed;
      if (entryIsVisible && !skipEventDueToIgnoreListing) {
        this.#appendEntryAtLevel(entry, startingLevel);
        nextLevel++;
      }
      const depthInChildTree = this.#appendNodesAtLevel(node.children, nextLevel, entryIsIgnoreListed);
      maxDepthInTree = Math.max(depthInChildTree, maxDepthInTree);
    }
    return maxDepthInTree;
  }
  #appendEntryAtLevel(entry, level) {
    this.#ensureTrackHeaderAppended(level);
    const index = this.#compatibilityBuilder.appendEventAtLevel(entry, level, this);
    this.#addDecorationsToEntry(entry, index);
  }
  #addDecorationsToEntry(entry, index) {
    const flameChartData = this.#compatibilityBuilder.getFlameChartTimelineData();
    if (ModificationsManager.ModificationsManager.activeManager()?.getEntriesFilter().isEntryExpandable(entry)) {
      addDecorationToEvent(
        flameChartData,
        index,
        { type: PerfUI.FlameChart.FlameChartDecorationType.HIDDEN_DESCENDANTS_ARROW }
      );
    }
    const warnings = this.#parsedTrace.data.Warnings.perEvent.get(entry);
    if (!warnings) {
      return;
    }
    addDecorationToEvent(flameChartData, index, { type: PerfUI.FlameChart.FlameChartDecorationType.WARNING_TRIANGLE });
    if (!warnings.includes("LONG_TASK")) {
      return;
    }
    addDecorationToEvent(flameChartData, index, {
      type: PerfUI.FlameChart.FlameChartDecorationType.CANDY,
      startAtTime: Trace.Handlers.ModelHandlers.Warnings.LONG_MAIN_THREAD_TASK_THRESHOLD
    });
  }
  /*
    ------------------------------------------------------------------------------------
     The following methods  are invoked by the flame chart renderer to query features about
     events on rendering.
    ------------------------------------------------------------------------------------
  */
  /**
   * Gets the color an event added by this appender should be rendered with.
   */
  colorForEvent(event) {
    if (this.#parsedTrace.data.Meta.traceIsGeneric) {
      return event.name ? `hsl(${Platform.StringUtilities.hashCode(event.name) % 300 + 30}, 40%, 70%)` : "#ccc";
    }
    if (Trace.Types.Events.isProfileCall(event)) {
      if (event.callFrame.functionName === "(idle)") {
        return categoryColorValue(Trace.Styles.getCategoryStyles().idle);
      }
      if (event.callFrame.functionName === "(program)") {
        return categoryColorValue(Trace.Styles.getCategoryStyles().other);
      }
      if (event.callFrame.scriptId === "0") {
        return categoryColorValue(Trace.Styles.getCategoryStyles().scripting);
      }
      return this.#colorGenerator.colorForID(event.callFrame.url);
    }
    const eventStyles = Trace.Styles.getEventStyle(event.name);
    if (eventStyles) {
      return categoryColorValue(eventStyles.category);
    }
    return categoryColorValue(Trace.Styles.getCategoryStyles().other);
  }
  /**
   * Gets the title an event added by this appender should be rendered with.
   */
  titleForEvent(entry) {
    if (Utils.IgnoreList.isIgnoreListedEntry(entry)) {
      const rule = Utils.IgnoreList.getIgnoredReasonString(entry);
      return i18nString(UIStrings.onIgnoreList, { rule });
    }
    return Trace.Name.forEntry(entry, this.#parsedTrace);
  }
  setPopoverInfo(event, info) {
    if (Trace.Types.Events.isParseHTML(event)) {
      const startLine = event.args["beginData"]["startLine"];
      const endLine = event.args["endData"]?.["endLine"];
      const eventURL = event.args["beginData"]["url"];
      const url = Bindings.ResourceUtils.displayNameForURL(eventURL);
      const range = endLine !== -1 || endLine === startLine ? `${startLine}...${endLine}` : startLine;
      info.title += ` - ${url} [${range}]`;
    }
    const selfTime = this.#parsedTrace.data.Renderer.entryToNode.get(event)?.selfTime;
    info.formattedTime = getDurationString(event.dur, selfTime);
  }
}
function categoryColorValue(category) {
  return ThemeSupport.ThemeSupport.instance().getComputedValue(category.cssVariable);
}
//# sourceMappingURL=ThreadAppender.js.map
