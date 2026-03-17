"use strict";
import * as Trace from "../../../models/trace/trace.js";
import { AICallTree } from "./AICallTree.js";
export class AIQueries {
  static findMainThread(navigationId, parsedTrace) {
    let mainThreadPID = null;
    let mainThreadTID = null;
    if (navigationId) {
      const navigation = parsedTrace.data.Meta.navigationsByNavigationId.get(navigationId);
      if (navigation?.args.data?.isOutermostMainFrame) {
        mainThreadPID = navigation.pid;
        mainThreadTID = navigation.tid;
      }
    }
    const threads = Trace.Handlers.Threads.threadsInTrace(parsedTrace.data);
    const thread = threads.find((thread2) => {
      if (!thread2.processIsOnMainFrame) {
        return false;
      }
      if (mainThreadPID && mainThreadTID) {
        return thread2.pid === mainThreadPID && thread2.tid === mainThreadTID;
      }
      return thread2.type === Trace.Handlers.Threads.ThreadType.MAIN_THREAD;
    });
    return thread ?? null;
  }
  /**
   * Returns bottom up activity for the given range (within a single navigation / thread).
   */
  static mainThreadActivityBottomUpSingleNavigation(navigationId, bounds, parsedTrace) {
    const thread = this.findMainThread(navigationId, parsedTrace);
    if (!thread) {
      return null;
    }
    const events = AICallTree.findEventsForThread({ thread, parsedTrace, bounds });
    if (!events) {
      return null;
    }
    const visibleEvents = Trace.Helpers.Trace.VISIBLE_TRACE_EVENT_TYPES.values().toArray();
    const filter = new Trace.Extras.TraceFilter.VisibleEventsFilter(
      visibleEvents.concat([Trace.Types.Events.Name.SYNTHETIC_NETWORK_REQUEST])
    );
    const startTime = Trace.Helpers.Timing.microToMilli(bounds.min);
    const endTime = Trace.Helpers.Timing.microToMilli(bounds.max);
    return new Trace.Extras.TraceTree.BottomUpRootNode(events, {
      textFilter: new Trace.Extras.TraceFilter.ExclusiveNameFilter([]),
      filters: [filter],
      startTime,
      endTime
    });
  }
  /**
   * Returns bottom up activity for the given range (no matter the navigation / thread).
   */
  static mainThreadActivityBottomUp(bounds, parsedTrace) {
    const threads = [];
    if (parsedTrace.insights) {
      for (const insightSet of parsedTrace.insights?.values()) {
        const thread = this.findMainThread(insightSet.navigation?.args.data?.navigationId, parsedTrace);
        if (thread) {
          threads.push(thread);
        }
      }
    } else {
      const navigationId = parsedTrace.data.Meta.mainFrameNavigations[0].args.data?.navigationId;
      const thread = this.findMainThread(navigationId, parsedTrace);
      if (thread) {
        threads.push(thread);
      }
    }
    if (threads.length === 0) {
      return null;
    }
    const threadEvents = [...new Set(threads)].map((thread) => AICallTree.findEventsForThread({ thread, parsedTrace, bounds }) ?? []);
    const events = threadEvents.flat();
    if (events.length === 0) {
      return null;
    }
    const visibleEvents = Trace.Helpers.Trace.VISIBLE_TRACE_EVENT_TYPES.values().toArray();
    const filter = new Trace.Extras.TraceFilter.VisibleEventsFilter(
      visibleEvents.concat([Trace.Types.Events.Name.SYNTHETIC_NETWORK_REQUEST])
    );
    const startTime = Trace.Helpers.Timing.microToMilli(bounds.min);
    const endTime = Trace.Helpers.Timing.microToMilli(bounds.max);
    return new Trace.Extras.TraceTree.BottomUpRootNode(events, {
      textFilter: new Trace.Extras.TraceFilter.ExclusiveNameFilter([]),
      filters: [filter],
      startTime,
      endTime
    });
  }
  /**
   * Returns an AI Call Tree representing the activity on the main thread for
   * the relevant time range of the given insight.
   */
  static mainThreadActivityTopDown(navigationId, bounds, parsedTrace) {
    const thread = this.findMainThread(navigationId, parsedTrace);
    if (!thread) {
      return null;
    }
    return AICallTree.fromTimeOnThread({
      thread: {
        pid: thread.pid,
        tid: thread.tid
      },
      parsedTrace,
      bounds
    });
  }
  /**
   * Returns the top longest tasks as AI Call Trees.
   */
  static longestTasks(navigationId, bounds, parsedTrace, limit = 3) {
    const thread = this.findMainThread(navigationId, parsedTrace);
    if (!thread) {
      return null;
    }
    const tasks = AICallTree.findMainThreadTasks({ thread, parsedTrace, bounds });
    if (!tasks) {
      return null;
    }
    const topTasks = tasks.filter((e) => e.name === "RunTask").sort((a, b) => b.dur - a.dur).slice(0, limit);
    return topTasks.map((task) => {
      const tree = AICallTree.fromEvent(task, parsedTrace);
      if (tree) {
        tree.selectedNode = null;
      }
      return tree;
    }).filter((tree) => !!tree);
  }
}
//# sourceMappingURL=AIQueries.js.map
