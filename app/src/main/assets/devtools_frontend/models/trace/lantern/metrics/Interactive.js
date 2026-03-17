"use strict";
import * as Core from "../core/core.js";
import * as Graph from "../graph/graph.js";
import {
  Metric
} from "./Metric.js";
const CRITICAL_LONG_TASK_THRESHOLD = 20;
class Interactive extends Metric {
  static get coefficients() {
    return {
      intercept: 0,
      optimistic: 0.45,
      pessimistic: 0.55
    };
  }
  static getOptimisticGraph(dependencyGraph) {
    const minimumCpuTaskDuration = CRITICAL_LONG_TASK_THRESHOLD * 1e3;
    return dependencyGraph.cloneWithRelationships((node) => {
      if (node.type === Graph.BaseNode.types.CPU) {
        return node.duration > minimumCpuTaskDuration;
      }
      const isImage = node.request.resourceType === "Image";
      const isScript = node.request.resourceType === "Script";
      return !isImage && (isScript || node.request.priority === "High" || node.request.priority === "VeryHigh");
    });
  }
  static getPessimisticGraph(dependencyGraph) {
    return dependencyGraph;
  }
  static getEstimateFromSimulation(simulationResult, extras) {
    if (!extras.lcpResult) {
      throw new Core.LanternError("missing lcpResult");
    }
    const lastTaskAt = Interactive.getLastLongTaskEndTime(simulationResult.nodeTimings);
    const minimumTime = extras.optimistic ? extras.lcpResult.optimisticEstimate.timeInMs : extras.lcpResult.pessimisticEstimate.timeInMs;
    return {
      timeInMs: Math.max(minimumTime, lastTaskAt),
      nodeTimings: simulationResult.nodeTimings
    };
  }
  static compute(data, extras) {
    const lcpResult = extras?.lcpResult;
    if (!lcpResult) {
      throw new Core.LanternError("LCP is required to calculate the Interactive metric");
    }
    const metricResult = super.compute(data, extras);
    metricResult.timing = Math.max(metricResult.timing, lcpResult.timing);
    return metricResult;
  }
  static getLastLongTaskEndTime(nodeTimings, duration = 50) {
    return Array.from(nodeTimings.entries()).filter(([node, timing]) => {
      if (node.type !== Graph.BaseNode.types.CPU) {
        return false;
      }
      return timing.duration > duration;
    }).map(([_, timing]) => timing.endTime).reduce((max, x) => Math.max(max || 0, x || 0), 0);
  }
}
export { Interactive };
//# sourceMappingURL=Interactive.js.map
