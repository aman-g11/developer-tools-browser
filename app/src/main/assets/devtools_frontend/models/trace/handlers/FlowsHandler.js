"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
let flowDataByGroupToken = /* @__PURE__ */ new Map();
let boundFlowData = /* @__PURE__ */ new Map();
let flowsById = /* @__PURE__ */ new Map();
let flowEvents = [];
let nonFlowEvents = [];
let flows = [];
const ID_COMPONENT_SEPARATOR = "-$-";
export function reset() {
  flows = [];
  flowEvents = [];
  nonFlowEvents = [];
  flowDataByGroupToken = /* @__PURE__ */ new Map();
  boundFlowData = /* @__PURE__ */ new Map();
  flowsById = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isFlowPhaseEvent(event)) {
    flowEvents.push(event);
    return;
  }
  nonFlowEvents.push(event);
}
function processNonFlowEvent(event) {
  const flowDataForEvent = boundFlowData.get(event.ts)?.get(event.pid)?.get(event.tid)?.get(event.cat);
  if (!flowDataForEvent) {
    return;
  }
  const { flows: flows2, bindingParsed } = flowDataForEvent;
  if (bindingParsed) {
    return;
  }
  for (const flowId of flows2) {
    const flow = Platform.MapUtilities.getWithDefault(
      flowsById,
      flowId,
      () => /* @__PURE__ */ new Map()
    );
    flow.set(event.ts, event);
  }
  flowDataForEvent.bindingParsed = true;
}
function processFlowEvent(flowPhaseEvent) {
  const flowGroup = flowGroupTokenForFlowPhaseEvent(flowPhaseEvent);
  switch (flowPhaseEvent.ph) {
    case Types.Events.Phase.FLOW_START: {
      const flowMetadata = { flowId: flowPhaseEvent.id, times: /* @__PURE__ */ new Map([[flowPhaseEvent.ts, void 0]]) };
      flowDataByGroupToken.set(flowGroup, flowPhaseEvent.id);
      addFlowIdToEventBinding(flowPhaseEvent, flowMetadata.flowId);
      return;
    }
    case Types.Events.Phase.FLOW_STEP: {
      const flowId = flowDataByGroupToken.get(flowGroup);
      if (flowId === void 0) {
        return;
      }
      addFlowIdToEventBinding(flowPhaseEvent, flowId);
      return;
    }
    case Types.Events.Phase.FLOW_END: {
      const flowId = flowDataByGroupToken.get(flowGroup);
      if (flowId === void 0) {
        return;
      }
      addFlowIdToEventBinding(flowPhaseEvent, flowId);
      flowDataByGroupToken.delete(flowGroup);
    }
  }
}
function addFlowIdToEventBinding(event, flowId) {
  const flowsByPid = Platform.MapUtilities.getWithDefault(
    boundFlowData,
    event.ts,
    () => /* @__PURE__ */ new Map()
  );
  const flowsByTid = Platform.MapUtilities.getWithDefault(
    flowsByPid,
    event.pid,
    () => /* @__PURE__ */ new Map()
  );
  const flowsByCat = Platform.MapUtilities.getWithDefault(
    flowsByTid,
    event.tid,
    () => /* @__PURE__ */ new Map()
  );
  const flowData = Platform.MapUtilities.getWithDefault(flowsByCat, event.cat, () => ({ flows: /* @__PURE__ */ new Set(), bindingParsed: false }));
  flowData.flows.add(flowId);
}
function flowGroupTokenForFlowPhaseEvent(event) {
  return `${event.cat}${ID_COMPONENT_SEPARATOR}${event.name}${ID_COMPONENT_SEPARATOR}${event.id}`;
}
export async function finalize() {
  flowEvents.forEach(processFlowEvent);
  nonFlowEvents.forEach(processNonFlowEvent);
  flows = [...flowsById.values()].map((flowMapping) => [...flowMapping.values()]).map((flow) => flow.filter((event) => event !== void 0)).filter((flow) => flow.length > 1);
}
export function data() {
  return {
    flows
  };
}
//# sourceMappingURL=FlowsHandler.js.map
