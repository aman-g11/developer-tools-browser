"use strict";
import * as Handlers from "../handlers/handlers.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import * as TraceFilter from "./TraceFilter.js";
import * as TraceTree from "./TraceTree.js";
function collectMainThreadActivity(data) {
  const mainFrameMainThread = data.Renderer.processes.values().find((p) => {
    const url = p.url ?? "";
    return p.isOnMainFrame && !url.startsWith("about:") && !url.startsWith("chrome:");
  })?.threads.values().find((t) => t.name === "CrRendererMain");
  if (!mainFrameMainThread) {
    return [];
  }
  return mainFrameMainThread.entries;
}
export function summarizeByThirdParty(data, traceBounds) {
  const mainThreadEvents = collectMainThreadActivity(data).sort(Helpers.Trace.eventTimeComparator);
  const groupingFunction = (event) => {
    const entity = data.Renderer.entityMappings.entityByEvent.get(event);
    return entity?.name ?? "";
  };
  const node = getBottomUpTree(mainThreadEvents, traceBounds, groupingFunction);
  const summaries = summarizeBottomUpByEntity(node, data);
  return summaries;
}
export function summarizeByURL(data, traceBounds) {
  const mainThreadEvents = collectMainThreadActivity(data).sort(Helpers.Trace.eventTimeComparator);
  const groupingFunction = (event) => {
    return Handlers.Helpers.getNonResolvedURL(event, data) ?? "";
  };
  const node = getBottomUpTree(mainThreadEvents, traceBounds, groupingFunction);
  const summaries = summarizeBottomUpByURL(node, data);
  return summaries;
}
function summarizeBottomUpByEntity(root, data) {
  const summaries = [];
  const topNodes = [...root.children().values()].flat();
  for (const node of topNodes) {
    if (node.id === "") {
      continue;
    }
    const entity = data.Renderer.entityMappings.entityByEvent.get(node.event);
    if (!entity) {
      continue;
    }
    const summary = {
      transferSize: node.transferSize,
      mainThreadTime: Types.Timing.Milli(node.selfTime),
      entity,
      relatedEvents: data.Renderer.entityMappings.eventsByEntity.get(entity) ?? []
    };
    summaries.push(summary);
  }
  return summaries;
}
function summarizeBottomUpByURL(root, data) {
  const summaries = [];
  const allRequests = data.NetworkRequests.byTime;
  const topNodes = [...root.children().values()].flat();
  for (const node of topNodes) {
    if (node.id === "" || typeof node.id !== "string") {
      continue;
    }
    const entity = data.Renderer.entityMappings.entityByEvent.get(node.event);
    if (!entity) {
      continue;
    }
    const url = node.id;
    const request = allRequests.find((r) => r.args.data.url === url);
    const summary = {
      request,
      url,
      entity,
      transferSize: node.transferSize,
      mainThreadTime: Types.Timing.Milli(node.selfTime)
    };
    summaries.push(summary);
  }
  return summaries;
}
function getBottomUpTree(mainThreadEvents, tracebounds, groupingFunction) {
  const visibleEvents = Helpers.Trace.VISIBLE_TRACE_EVENT_TYPES.values().toArray();
  const filter = new TraceFilter.VisibleEventsFilter(visibleEvents.concat([Types.Events.Name.SYNTHETIC_NETWORK_REQUEST]));
  const startTime = Helpers.Timing.microToMilli(tracebounds.min);
  const endTime = Helpers.Timing.microToMilli(tracebounds.max);
  return new TraceTree.BottomUpRootNode(mainThreadEvents, {
    textFilter: new TraceFilter.ExclusiveNameFilter([]),
    filters: [filter],
    startTime,
    endTime,
    eventGroupIdCallback: groupingFunction,
    calculateTransferSize: true,
    // Ensure we group by 3P alongside eventID for correct 3P grouping.
    forceGroupIdCallback: true
  });
}
//# sourceMappingURL=ThirdParties.js.map
