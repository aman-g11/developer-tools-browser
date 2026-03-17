"use strict";
import * as SDK from "../../../core/sdk/sdk.js";
import * as Trace from "../../../models/trace/trace.js";
const nodeIdsForEventCache = /* @__PURE__ */ new WeakMap();
const domNodesForEventCache = /* @__PURE__ */ new WeakMap();
export function nodeIdsForEvent(parsedTrace, event) {
  const fromCache = nodeIdsForEventCache.get(event);
  if (fromCache) {
    return fromCache;
  }
  const foundIds = /* @__PURE__ */ new Set();
  if (Trace.Types.Events.isLayout(event)) {
    event.args.endData?.layoutRoots.forEach((root) => foundIds.add(root.nodeId));
  } else if (Trace.Types.Events.isSyntheticLayoutShift(event) && event.args.data?.impacted_nodes) {
    event.args.data.impacted_nodes.forEach((node) => foundIds.add(node.node_id));
  } else if (Trace.Types.Events.isAnyLargestContentfulPaintCandidate(event) && typeof event.args.data?.nodeId !== "undefined") {
    foundIds.add(event.args.data.nodeId);
  } else if (Trace.Types.Events.isPaint(event) && typeof event.args.data.nodeId !== "undefined") {
    foundIds.add(event.args.data.nodeId);
  } else if (Trace.Types.Events.isPaintImage(event) && typeof event.args.data.nodeId !== "undefined") {
    foundIds.add(event.args.data.nodeId);
  } else if (Trace.Types.Events.isScrollLayer(event) && typeof event.args.data.nodeId !== "undefined") {
    foundIds.add(event.args.data.nodeId);
  } else if (Trace.Types.Events.isSyntheticAnimation(event) && typeof event.args.data.beginEvent.args.data.nodeId !== "undefined") {
    foundIds.add(event.args.data.beginEvent.args.data.nodeId);
  } else if (Trace.Types.Events.isDecodeImage(event)) {
    const paintImageEvent = parsedTrace.data.ImagePainting.paintImageForEvent.get(event);
    if (typeof paintImageEvent?.args.data.nodeId !== "undefined") {
      foundIds.add(paintImageEvent.args.data.nodeId);
    }
  } else if (Trace.Types.Events.isDrawLazyPixelRef(event) && event.args?.LazyPixelRef) {
    const paintImageEvent = parsedTrace.data.ImagePainting.paintImageByDrawLazyPixelRef.get(event.args.LazyPixelRef);
    if (typeof paintImageEvent?.args.data.nodeId !== "undefined") {
      foundIds.add(paintImageEvent.args.data.nodeId);
    }
  } else if (Trace.Types.Events.isParseMetaViewport(event) && typeof event.args?.data.node_id !== "undefined") {
    foundIds.add(event.args.data.node_id);
  }
  nodeIdsForEventCache.set(event, foundIds);
  return foundIds;
}
export async function relatedDOMNodesForEvent(parsedTrace, event) {
  const fromCache = domNodesForEventCache.get(event);
  if (fromCache) {
    return fromCache;
  }
  const nodeIds = nodeIdsForEvent(parsedTrace, event);
  if (nodeIds.size) {
    const frame = event.args?.data?.frame;
    const result = await domNodesForBackendIds(frame, nodeIds);
    domNodesForEventCache.set(event, result);
    return result;
  }
  return null;
}
export async function domNodesForBackendIds(frameId, nodeIds) {
  const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
  const domModel = target?.model(SDK.DOMModel.DOMModel);
  const resourceTreeModel = target?.model(SDK.ResourceTreeModel.ResourceTreeModel);
  if (!domModel || !resourceTreeModel) {
    return /* @__PURE__ */ new Map();
  }
  if (frameId && !resourceTreeModel.frames().some((frame) => frame.id === frameId)) {
    return /* @__PURE__ */ new Map();
  }
  return await domModel.pushNodesByBackendIdsToFrontend(nodeIds) || /* @__PURE__ */ new Map();
}
//# sourceMappingURL=EntryNodes.js.map
