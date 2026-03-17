"use strict";
import * as Trace from "../../models/trace/trace.js";
const MAX_PREDECESSOR_INITIATOR_LIMIT = 10;
export function initiatorsDataToDraw(parsedTrace, selectedEvent, hiddenEntries, expandableEntries) {
  const initiatorsData = [
    ...findInitiatorDataPredecessors(parsedTrace, selectedEvent),
    ...findInitiatorDataDirectSuccessors(selectedEvent, parsedTrace.data.Initiators.initiatorToEvents)
  ];
  initiatorsData.forEach(
    (initiatorData) => getClosestVisibleInitiatorEntriesAncestors(initiatorData, expandableEntries, hiddenEntries, parsedTrace)
  );
  return initiatorsData;
}
export function initiatorsDataToDrawForNetwork(parsedTrace, selectedEvent) {
  return findInitiatorDataPredecessors(parsedTrace, selectedEvent);
}
function findInitiatorDataPredecessors(parsedTrace, selectedEvent) {
  const initiatorsData = [];
  let currentEvent = selectedEvent;
  const visited = /* @__PURE__ */ new Set();
  visited.add(currentEvent);
  while (currentEvent && initiatorsData.length < MAX_PREDECESSOR_INITIATOR_LIMIT) {
    const currentInitiator = Trace.Types.Events.isSyntheticNetworkRequest(currentEvent) ? Trace.Extras.Initiators.getNetworkInitiator(parsedTrace.data, currentEvent) : parsedTrace.data.Initiators.eventToInitiator.get(currentEvent);
    if (currentInitiator) {
      if (visited.has(currentInitiator)) {
        break;
      }
      initiatorsData.push({ event: currentEvent, initiator: currentInitiator });
      currentEvent = currentInitiator;
      visited.add(currentEvent);
      continue;
    }
    const nodeForCurrentEvent = parsedTrace.data.Renderer.entryToNode.get(currentEvent);
    if (!nodeForCurrentEvent) {
      currentEvent = null;
      break;
    }
    currentEvent = nodeForCurrentEvent.parent?.entry || null;
  }
  return initiatorsData;
}
function findInitiatorDataDirectSuccessors(selectedEvent, initiatorToEvents) {
  const initiatorsData = [];
  const eventsInitiatedByCurrent = initiatorToEvents.get(selectedEvent);
  if (eventsInitiatedByCurrent) {
    eventsInitiatedByCurrent.forEach((event) => {
      initiatorsData.push({ event, initiator: selectedEvent });
    });
  }
  return initiatorsData;
}
function getClosestVisibleInitiatorEntriesAncestors(initiatorData, expandableEntries, hiddenEntries, parsedTrace) {
  if (hiddenEntries.includes(initiatorData.event)) {
    let nextParent = parsedTrace.data.Renderer.entryToNode.get(initiatorData.event)?.parent;
    while (nextParent?.entry && !expandableEntries.includes(nextParent?.entry)) {
      nextParent = nextParent.parent ?? void 0;
    }
    initiatorData.event = nextParent?.entry ?? initiatorData.event;
    initiatorData.isEntryHidden = true;
  }
  if (hiddenEntries.includes(initiatorData.initiator)) {
    let nextParent = parsedTrace.data.Renderer.entryToNode.get(initiatorData.initiator)?.parent;
    while (nextParent?.entry && !expandableEntries.includes(nextParent?.entry)) {
      nextParent = nextParent.parent ?? void 0;
    }
    initiatorData.initiator = nextParent?.entry ?? initiatorData.initiator;
    initiatorData.isInitiatorHidden = true;
  }
  return initiatorData;
}
//# sourceMappingURL=Initiators.js.map
