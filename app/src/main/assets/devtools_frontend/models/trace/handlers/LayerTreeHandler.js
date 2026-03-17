"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
let paintEvents = [];
let snapshotEvents = [];
let paintToSnapshotMap = /* @__PURE__ */ new Map();
let lastPaintForLayerId = {};
let currentMainFrameLayerTreeId = null;
let updateLayerEvents = [];
let relevantEvents = [];
export function reset() {
  paintEvents = [];
  snapshotEvents = [];
  paintToSnapshotMap = /* @__PURE__ */ new Map();
  lastPaintForLayerId = {};
  currentMainFrameLayerTreeId = null;
  updateLayerEvents = [];
  relevantEvents = [];
}
export function handleEvent(event) {
  if (Types.Events.isPaint(event) || Types.Events.isDisplayListItemListSnapshot(event) || Types.Events.isUpdateLayer(event) || Types.Events.isSetLayerId(event)) {
    relevantEvents.push(event);
  }
}
export async function finalize() {
  const metaData = metaHandlerData();
  Helpers.Trace.sortTraceEventsInPlace(relevantEvents);
  for (const event of relevantEvents) {
    if (Types.Events.isSetLayerId(event)) {
      if (metaData.mainFrameId !== event.args.data.frame) {
        continue;
      }
      currentMainFrameLayerTreeId = event.args.data.layerTreeId;
    } else if (Types.Events.isUpdateLayer(event)) {
      updateLayerEvents.push(event);
    } else if (Types.Events.isPaint(event)) {
      if (!event.args.data.layerId) {
        continue;
      }
      paintEvents.push(event);
      lastPaintForLayerId[event.args.data.layerId] = event;
      continue;
    } else if (Types.Events.isDisplayListItemListSnapshot(event)) {
      let lastUpdateLayerEventForThread = null;
      for (let i = updateLayerEvents.length - 1; i > -1; i--) {
        const updateEvent = updateLayerEvents[i];
        if (updateEvent.pid === event.pid && updateEvent.tid === event.tid) {
          lastUpdateLayerEventForThread = updateEvent;
          break;
        }
      }
      if (!lastUpdateLayerEventForThread) {
        continue;
      }
      if (lastUpdateLayerEventForThread.args.layerTreeId !== currentMainFrameLayerTreeId) {
        continue;
      }
      const paintEvent = lastPaintForLayerId[lastUpdateLayerEventForThread.args.layerId];
      if (!paintEvent) {
        continue;
      }
      snapshotEvents.push(event);
      paintToSnapshotMap.set(paintEvent, event);
    }
  }
}
export function data() {
  return {
    paints: paintEvents,
    snapshots: snapshotEvents,
    paintsToSnapshots: paintToSnapshotMap
  };
}
export function deps() {
  return ["Meta"];
}
//# sourceMappingURL=LayerTreeHandler.js.map
