"use strict";
import * as Trace from "../../../models/trace/trace.js";
import { AICallTree } from "./AICallTree.js";
function getPrimaryInsightSet(insights) {
  const insightSets = Array.from(insights.values());
  if (insightSets.length === 0) {
    return null;
  }
  if (insightSets.length === 1) {
    return insightSets[0];
  }
  return insightSets.filter((set) => set.navigation).at(0) ?? insightSets.at(0) ?? null;
}
export class AgentFocus {
  static fromParsedTrace(parsedTrace) {
    if (!parsedTrace.insights) {
      throw new Error("missing insights");
    }
    return new AgentFocus({
      parsedTrace,
      event: null,
      callTree: null,
      insight: null
    });
  }
  static fromInsight(parsedTrace, insight) {
    if (!parsedTrace.insights) {
      throw new Error("missing insights");
    }
    return new AgentFocus({
      parsedTrace,
      event: null,
      callTree: null,
      insight
    });
  }
  static fromEvent(parsedTrace, event) {
    if (!parsedTrace.insights) {
      throw new Error("missing insights");
    }
    const result = AgentFocus.#getCallTreeOrEvent(parsedTrace, event);
    return new AgentFocus({ parsedTrace, event: result.event, callTree: result.callTree, insight: null });
  }
  static fromCallTree(callTree) {
    return new AgentFocus({ parsedTrace: callTree.parsedTrace, event: null, callTree, insight: null });
  }
  #data;
  #primaryInsightSet;
  eventsSerializer = new Trace.EventsSerializer.EventsSerializer();
  constructor(data) {
    if (!data.parsedTrace.insights) {
      throw new Error("missing insights");
    }
    this.#data = data;
    this.#primaryInsightSet = getPrimaryInsightSet(data.parsedTrace.insights);
  }
  get parsedTrace() {
    return this.#data.parsedTrace;
  }
  get primaryInsightSet() {
    return this.#primaryInsightSet;
  }
  /** Note: at most one of event or callTree is non-null. */
  get event() {
    return this.#data.event;
  }
  /** Note: at most one of event or callTree is non-null. */
  get callTree() {
    return this.#data.callTree;
  }
  get insight() {
    return this.#data.insight;
  }
  withInsight(insight) {
    const focus = new AgentFocus(this.#data);
    focus.#data.insight = insight;
    return focus;
  }
  withEvent(event) {
    const focus = new AgentFocus(this.#data);
    const result = AgentFocus.#getCallTreeOrEvent(this.#data.parsedTrace, event);
    focus.#data.callTree = result.callTree;
    focus.#data.event = result.event;
    return focus;
  }
  lookupEvent(key) {
    try {
      return this.eventsSerializer.eventForKey(key, this.#data.parsedTrace);
    } catch (err) {
      if (err.toString().includes("Unknown trace event") || err.toString().includes("Unknown profile call")) {
        return null;
      }
      throw err;
    }
  }
  /**
   * If an event is a call tree, this returns that call tree and a null event.
   * If not a call tree, this only returns a non-null event if the event is a network
   * request.
   * This is an arbitrary limitation – it should be removed, but first we need to
   * improve the agent's knowledge of events that are not main-thread or network
   * events.
   */
  static #getCallTreeOrEvent(parsedTrace, event) {
    const callTree = event && AICallTree.fromEvent(event, parsedTrace);
    if (callTree) {
      return { callTree, event: null };
    }
    if (event && Trace.Types.Events.isSyntheticNetworkRequest(event)) {
      return { callTree: null, event };
    }
    return { callTree: null, event: null };
  }
}
export function getPerformanceAgentFocusFromModel(model) {
  const parsedTrace = model.parsedTrace();
  if (!parsedTrace) {
    return null;
  }
  return AgentFocus.fromParsedTrace(parsedTrace);
}
//# sourceMappingURL=AIContext.js.map
