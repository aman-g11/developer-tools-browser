"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as Trace from "../../models/trace/trace.js";
import * as SourceMapsResolver from "../../models/trace_source_maps_resolver/trace_source_maps_resolver.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import { AnimationsTrackAppender } from "./AnimationsTrackAppender.js";
import { getDurationString, getEventLevel } from "./AppenderUtils.js";
import * as TimelineComponents from "./components/components.js";
import { ExtensionTrackAppender } from "./ExtensionTrackAppender.js";
import { GPUTrackAppender } from "./GPUTrackAppender.js";
import { InteractionsTrackAppender } from "./InteractionsTrackAppender.js";
import { LayoutShiftsTrackAppender } from "./LayoutShiftsTrackAppender.js";
import { ThreadAppender } from "./ThreadAppender.js";
import {
  EntryType,
  InstantEventVisibleDurationMs
} from "./TimelineFlameChartDataProvider.js";
import { TimelinePanel } from "./TimelinePanel.js";
import { TimingsTrackAppender } from "./TimingsTrackAppender.js";
import * as TimelineUtils from "./utils/utils.js";
export function entryIsVisibleInTimeline(entry, parsedTrace) {
  if (parsedTrace?.data.Meta.traceIsGeneric) {
    return true;
  }
  if (Trace.Types.Events.isUpdateCounters(entry)) {
    return true;
  }
  if (Trace.Types.Events.isSchedulePostMessage(entry) || Trace.Types.Events.isHandlePostMessage(entry)) {
    return true;
  }
  if (Trace.Types.Extensions.isSyntheticExtensionEntry(entry)) {
    return true;
  }
  const eventStyle = Trace.Styles.getEventStyle(entry.name);
  const eventIsTiming = Trace.Types.Events.isConsoleTime(entry) || Trace.Types.Events.isPerformanceMeasure(entry) || Trace.Types.Events.isPerformanceMark(entry) || Trace.Types.Events.isConsoleTimeStamp(entry);
  return eventStyle && !eventStyle.hidden || eventIsTiming;
}
const HIDDEN_THREAD_NAMES = /* @__PURE__ */ new Set(["Chrome_ChildIOThread", "Compositor", "GpuMemoryThread", "PerfettoTrace"]);
export const TrackNames = [
  "Animations",
  "Timings",
  "Interactions",
  "GPU",
  "LayoutShifts",
  "Thread",
  "Thread_AuctionWorklet",
  "Extension",
  "ServerTimings"
];
export var VisualLoggingTrackName = /* @__PURE__ */ ((VisualLoggingTrackName2) => {
  VisualLoggingTrackName2["ANIMATIONS"] = "animations";
  VisualLoggingTrackName2["TIMINGS"] = "timings";
  VisualLoggingTrackName2["INTERACTIONS"] = "interactions";
  VisualLoggingTrackName2["GPU"] = "gpu";
  VisualLoggingTrackName2["LAYOUT_SHIFTS"] = "layout-shifts";
  VisualLoggingTrackName2["SERVER_TIMINGS"] = "server.timings";
  VisualLoggingTrackName2["THREAD_CPU_PROFILE"] = "thread.cpu-profile";
  VisualLoggingTrackName2["THREAD_MAIN"] = "thread.main";
  VisualLoggingTrackName2["THREAD_FRAME"] = "thread.frame";
  VisualLoggingTrackName2["THREAD_WORKER"] = "thread.worker";
  VisualLoggingTrackName2["THREAD_AUCTION_WORKLET"] = "thread.auction-worklet";
  VisualLoggingTrackName2["THREAD_RASTERIZER"] = "thread.rasterizer";
  VisualLoggingTrackName2["THREAD_POOL"] = "thread.pool";
  VisualLoggingTrackName2["THREAD_OTHER"] = "thread.other";
  VisualLoggingTrackName2["EXTENSION"] = "extension";
  VisualLoggingTrackName2["ANGULAR_TRACK"] = "angular-track";
  VisualLoggingTrackName2["NETWORK"] = "network";
  return VisualLoggingTrackName2;
})(VisualLoggingTrackName || {});
export class CompatibilityTracksAppender {
  #trackForLevel = /* @__PURE__ */ new Map();
  #trackForGroup = /* @__PURE__ */ new Map();
  #eventsForTrack = /* @__PURE__ */ new Map();
  #trackEventsForTreeview = /* @__PURE__ */ new Map();
  #flameChartData;
  #parsedTrace;
  #entryData;
  #colorGenerator;
  #allTrackAppenders = [];
  #visibleTrackNames = /* @__PURE__ */ new Set([...TrackNames]);
  #legacyEntryTypeByLevel;
  #timingsTrackAppender;
  #animationsTrackAppender;
  #interactionsTrackAppender;
  #gpuTrackAppender;
  #layoutShiftsTrackAppender;
  #threadAppenders = [];
  #entityMapper;
  /**
   * @param flameChartData the data used by the flame chart renderer on
   * which the track data will be appended.
   * @param parsedTrace the trace parsing engines output.
   * @param entryData the array containing all event to be rendered in
   * the flamechart.
   * @param legacyEntryTypeByLevel an array containing the type of
   * each entry in the entryData array. Indexed by the position the
   * corresponding entry occupies in the entryData array. This reference
   * is needed only for compatibility with the legacy flamechart
   * architecture and should be removed once all tracks use the new
   * system.
   * @param entityMapper 3P entity data for the trace.
   */
  constructor(flameChartData, parsedTrace, entryData, legacyEntryTypeByLevel, entityMapper) {
    this.#flameChartData = flameChartData;
    this.#parsedTrace = parsedTrace;
    this.#entityMapper = entityMapper;
    this.#entryData = entryData;
    this.#colorGenerator = new Common.Color.Generator(
      /* hueSpace= */
      { min: 30, max: 55 },
      /* satSpace= */
      { min: 70, max: 100, count: 6 },
      /* lightnessSpace= */
      50,
      /* alphaSpace= */
      0.7
    );
    this.#legacyEntryTypeByLevel = legacyEntryTypeByLevel;
    this.#timingsTrackAppender = new TimingsTrackAppender(this, this.#parsedTrace, this.#colorGenerator);
    this.#allTrackAppenders.push(this.#timingsTrackAppender);
    this.#interactionsTrackAppender = new InteractionsTrackAppender(this, this.#parsedTrace, this.#colorGenerator);
    this.#allTrackAppenders.push(this.#interactionsTrackAppender);
    this.#animationsTrackAppender = new AnimationsTrackAppender(this, this.#parsedTrace);
    this.#allTrackAppenders.push(this.#animationsTrackAppender);
    this.#gpuTrackAppender = new GPUTrackAppender(this, this.#parsedTrace);
    this.#allTrackAppenders.push(this.#gpuTrackAppender);
    this.#layoutShiftsTrackAppender = new LayoutShiftsTrackAppender(this, this.#parsedTrace);
    this.#allTrackAppenders.push(this.#layoutShiftsTrackAppender);
    this.#addThreadAppenders();
    this.#addExtensionAppenders();
    this.onThemeChange = this.onThemeChange.bind(this);
    ThemeSupport.ThemeSupport.instance().addEventListener(ThemeSupport.ThemeChangeEvent.eventName, this.onThemeChange);
  }
  reset() {
    ThemeSupport.ThemeSupport.instance().removeEventListener(
      ThemeSupport.ThemeChangeEvent.eventName,
      this.onThemeChange
    );
  }
  setFlameChartDataAndEntryData(flameChartData, entryData, legacyEntryTypeByLevel) {
    this.#trackForGroup.clear();
    this.#flameChartData = flameChartData;
    this.#entryData = entryData;
    this.#legacyEntryTypeByLevel = legacyEntryTypeByLevel;
  }
  getFlameChartTimelineData() {
    return this.#flameChartData;
  }
  onThemeChange() {
    for (const group of this.#flameChartData.groups) {
      group.style.color = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-on-surface");
      group.style.backgroundColor = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container");
    }
  }
  #addExtensionAppenders() {
    if (!TimelinePanel.extensionDataVisibilitySetting().get()) {
      return;
    }
    const tracks = this.#parsedTrace.data.ExtensionTraceData.extensionTrackData;
    for (const trackData of tracks) {
      this.#allTrackAppenders.push(new ExtensionTrackAppender(this, trackData));
    }
  }
  #addThreadAppenders() {
    const threadTrackOrder = (appender) => {
      switch (appender.threadType) {
        case Trace.Handlers.Threads.ThreadType.MAIN_THREAD: {
          if (appender.isOnMainFrame) {
            const url = appender.getUrl();
            if (url.startsWith("about:") || url.startsWith("chrome:")) {
              return 2;
            }
            return 0;
          }
          return 1;
        }
        case Trace.Handlers.Threads.ThreadType.WORKER:
          return 3;
        case Trace.Handlers.Threads.ThreadType.AUCTION_WORKLET:
          return 3;
        case Trace.Handlers.Threads.ThreadType.RASTERIZER:
          return 4;
        case Trace.Handlers.Threads.ThreadType.THREAD_POOL:
          return 5;
        case Trace.Handlers.Threads.ThreadType.OTHER:
          return 7;
        default:
          return 8;
      }
    };
    const threads = Trace.Handlers.Threads.threadsInTrace(this.#parsedTrace.data);
    const showAllEvents = Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.TIMELINE_SHOW_ALL_EVENTS);
    for (const { pid, tid, name, type, entries, tree } of threads) {
      if (this.#parsedTrace.data.Meta.traceIsGeneric) {
        this.#threadAppenders.push(new ThreadAppender(
          this,
          this.#parsedTrace,
          pid,
          tid,
          name,
          Trace.Handlers.Threads.ThreadType.OTHER,
          entries,
          tree
        ));
        continue;
      }
      if (name && HIDDEN_THREAD_NAMES.has(name) && !showAllEvents) {
        continue;
      }
      const matchingWorklet = this.#parsedTrace.data.AuctionWorklets.worklets.get(pid);
      if (matchingWorklet) {
        const tids = [matchingWorklet.args.data.utilityThread.tid, matchingWorklet.args.data.v8HelperThread.tid];
        if (tids.includes(tid)) {
          this.#threadAppenders.push(new ThreadAppender(
            this,
            this.#parsedTrace,
            pid,
            tid,
            "",
            Trace.Handlers.Threads.ThreadType.AUCTION_WORKLET,
            entries,
            tree
          ));
        }
        continue;
      }
      this.#threadAppenders.push(new ThreadAppender(this, this.#parsedTrace, pid, tid, name, type, entries, tree));
    }
    this.#threadAppenders.sort(
      (a, b) => threadTrackOrder(a) - threadTrackOrder(b) || b.getEntries().length - a.getEntries().length
    );
    this.#allTrackAppenders.push(...this.#threadAppenders);
  }
  timingsTrackAppender() {
    return this.#timingsTrackAppender;
  }
  animationsTrackAppender() {
    return this.#animationsTrackAppender;
  }
  interactionsTrackAppender() {
    return this.#interactionsTrackAppender;
  }
  gpuTrackAppender() {
    return this.#gpuTrackAppender;
  }
  layoutShiftsTrackAppender() {
    return this.#layoutShiftsTrackAppender;
  }
  threadAppenders() {
    return this.#threadAppenders;
  }
  eventsInTrack(trackAppender) {
    const cachedData = this.#eventsForTrack.get(trackAppender);
    if (cachedData) {
      return cachedData;
    }
    let trackStartLevel = null;
    let trackEndLevel = null;
    for (const [level, track] of this.#trackForLevel) {
      if (track !== trackAppender) {
        continue;
      }
      if (trackStartLevel === null) {
        trackStartLevel = level;
      }
      trackEndLevel = level;
    }
    if (trackStartLevel === null || trackEndLevel === null) {
      throw new Error(`Could not find events for track: ${trackAppender}`);
    }
    const entryLevels = this.#flameChartData.entryLevels;
    const events = [];
    for (let i = 0; i < entryLevels.length; i++) {
      if (trackStartLevel <= entryLevels[i] && entryLevels[i] <= trackEndLevel) {
        events.push(this.#entryData[i]);
      }
    }
    events.sort((a, b) => a.ts - b.ts);
    this.#eventsForTrack.set(trackAppender, events);
    return events;
  }
  /**
   * Gets the events to be shown in the tree views of the details pane
   * (Bottom-up, Call tree, etc.). These are the events from the track
   * that can be arranged in a tree shape.
   */
  eventsForTreeView(trackAppender) {
    const cachedData = this.#trackEventsForTreeview.get(trackAppender);
    if (cachedData) {
      return cachedData;
    }
    let trackEvents = this.eventsInTrack(trackAppender);
    if (!Trace.Helpers.TreeHelpers.canBuildTreesFromEvents(trackEvents)) {
      trackEvents = trackEvents.filter((e) => !Trace.Types.Events.isPhaseAsync(e.ph));
    }
    this.#trackEventsForTreeview.set(trackAppender, trackEvents);
    return trackEvents;
  }
  /**
   * Caches the track appender that owns a flame chart group. FlameChart
   * groups are created for each track in the timeline. When an user
   * selects a track in the UI, the track's group is passed to the model
   * layer to inform about the selection.
   */
  registerTrackForGroup(group, appender) {
    this.#flameChartData.groups.push(group);
    this.#trackForGroup.set(group, appender);
  }
  /**
   * Returns number of tracks of given type already appended.
   * Used to name the "Raster Thread 6" tracks, etc
   */
  getCurrentTrackCountForThreadType(threadType) {
    return this.#threadAppenders.filter((appender) => appender.threadType === threadType && appender.headerAppended()).length;
  }
  /**
   * Looks up a FlameChart group for a given appender.
   */
  groupForAppender(targetAppender) {
    let foundGroup = null;
    for (const [group, appender] of this.#trackForGroup) {
      if (appender === targetAppender) {
        foundGroup = group;
        break;
      }
    }
    return foundGroup;
  }
  /**
   * Given a FlameChart group, gets the events to be shown in the tree
   * views if that group was registered by the appender system.
   */
  groupEventsForTreeView(group) {
    const track = this.#trackForGroup.get(group);
    if (!track) {
      return null;
    }
    return this.eventsForTreeView(track);
  }
  groupForLevel(level) {
    const appenderForLevel = this.#trackForLevel.get(level);
    if (!appenderForLevel) {
      return null;
    }
    return this.groupForAppender(appenderForLevel);
  }
  /**
   * Adds an event to the flame chart data at a defined level.
   * @param event the event to be appended,
   * @param level the level to append the event,
   * @param appender the track which the event belongs to.
   * @returns the index of the event in all events to be rendered in the flamechart.
   */
  appendEventAtLevel(event, level, appender) {
    this.#trackForLevel.set(level, appender);
    const index = this.#entryData.length;
    this.#entryData.push(event);
    this.#legacyEntryTypeByLevel[level] = EntryType.TRACK_APPENDER;
    this.#flameChartData.entryLevels[index] = level;
    this.#flameChartData.entryStartTimes[index] = Trace.Helpers.Timing.microToMilli(event.ts);
    const dur = event.dur || Trace.Helpers.Timing.milliToMicro(InstantEventVisibleDurationMs);
    this.#flameChartData.entryTotalTimes[index] = Trace.Helpers.Timing.microToMilli(dur);
    return index;
  }
  /**
   * Adds into the flame chart data a list of trace events.
   * @param events the trace events that will be appended to the flame chart.
   * The events should be taken straight from the trace handlers. The handlers
   * should sort the events by start time, and the parent event is before the
   * child.
   * @param trackStartLevel the flame chart level from which the events will
   * be appended.
   * @param appender the track that the trace events belong to.
   * @param eventAppendedCallback an optional function called after the
   * event has been added to the timeline data. This allows the caller
   * to know f.e. the position of the event in the entry data. Use this
   * hook to customize the data after it has been appended, f.e. to add
   * decorations to a set of the entries.
   * @returns the next level after the last occupied by the appended these
   * trace events (the first available level to append next track).
   */
  appendEventsAtLevel(events, trackStartLevel, appender, eventAppendedCallback) {
    if (Host.InspectorFrontendHost.isUnderTest()) {
      Platform.ArrayUtilities.assertArrayIsSorted(events, (a, b) => a.ts - b.ts);
    }
    const lastTimestampByLevel = [];
    for (let i = 0; i < events.length; ++i) {
      const event = events[i];
      if (!entryIsVisibleInTimeline(event, this.#parsedTrace)) {
        continue;
      }
      const level = getEventLevel(event, lastTimestampByLevel);
      const index = this.appendEventAtLevel(event, trackStartLevel + level, appender);
      eventAppendedCallback?.(event, index);
    }
    this.#legacyEntryTypeByLevel.length = trackStartLevel + lastTimestampByLevel.length;
    this.#legacyEntryTypeByLevel.fill(EntryType.TRACK_APPENDER, trackStartLevel);
    return trackStartLevel + lastTimestampByLevel.length;
  }
  /**
   * Gets the all track appenders that have been set to be visible.
   */
  allVisibleTrackAppenders() {
    return this.#allTrackAppenders.filter((track) => this.#visibleTrackNames.has(track.appenderName));
  }
  allThreadAppendersByProcess() {
    const appenders = this.allVisibleTrackAppenders();
    const result = /* @__PURE__ */ new Map();
    for (const appender of appenders) {
      if (!(appender instanceof ThreadAppender)) {
        continue;
      }
      const existing = result.get(appender.processId()) ?? [];
      existing.push(appender);
      result.set(appender.processId(), existing);
    }
    return result;
  }
  getDrawOverride(event, level) {
    const track = this.#trackForLevel.get(level);
    if (!track) {
      throw new Error("Track not found for level");
    }
    return track.getDrawOverride?.(event);
  }
  /**
   * Returns the color an event is shown with in the timeline.
   */
  colorForEvent(event, level) {
    const track = this.#trackForLevel.get(level);
    if (!track) {
      throw new Error("Track not found for level");
    }
    return track.colorForEvent(event);
  }
  /**
   * Returns the title an event is shown with in the timeline.
   */
  titleForEvent(event, level) {
    const track = this.#trackForLevel.get(level);
    if (!track) {
      throw new Error("Track not found for level");
    }
    if (track.titleForEvent) {
      return track.titleForEvent(event);
    }
    return Trace.Name.forEntry(event, this.#parsedTrace);
  }
  /**
   * Returns the info shown when an event in the timeline is hovered.
   */
  popoverInfo(event, level) {
    const track = this.#trackForLevel.get(level);
    if (!track) {
      throw new Error("Track not found for level");
    }
    const info = {
      title: this.titleForEvent(event, level),
      formattedTime: getDurationString(event.dur),
      warningElements: TimelineComponents.DetailsView.buildWarningElementsForEvent(event, this.#parsedTrace),
      additionalElements: [],
      url: null
    };
    if (track.setPopoverInfo) {
      track.setPopoverInfo(event, info);
    }
    const url = URL.parse(
      info.url ?? SourceMapsResolver.SourceMapsResolver.resolvedURLForEntry(this.#parsedTrace, event) ?? ""
    );
    if (url) {
      const MAX_PATH_LENGTH = 45;
      const path = Platform.StringUtilities.trimMiddle(url.href.replace(url.origin, ""), MAX_PATH_LENGTH);
      const urlElems = document.createElement("div");
      urlElems.createChild("span", "popoverinfo-url-path").textContent = path;
      const entity = this.#entityMapper ? this.#entityMapper.entityForEvent(event) : null;
      const originWithEntity = TimelineUtils.Helpers.formatOriginWithEntity(url, entity);
      urlElems.createChild("span", "popoverinfo-url-origin").textContent = `(${originWithEntity})`;
      info.additionalElements.push(urlElems);
    }
    return info;
  }
}
//# sourceMappingURL=CompatibilityTracksAppender.js.map
