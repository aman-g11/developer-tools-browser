"use strict";
import * as Core from "../core/core.js";
import * as Graph from "../graph/graph.js";
import {
  Metric
} from "./Metric.js";
const mobileSlow4GRtt = 150;
class SpeedIndex extends Metric {
  static get coefficients() {
    return {
      // Note that the optimistic estimate is based on the real observed speed index rather than a
      // real lantern graph (and the final estimate will be Math.max(FCP, Speed Index)).
      intercept: 0,
      optimistic: 1.4,
      pessimistic: 0.4
    };
  }
  static getScaledCoefficients(rttMs) {
    const defaultCoefficients = this.coefficients;
    const defaultRttExcess = mobileSlow4GRtt - 30;
    const multiplier = Math.max((rttMs - 30) / defaultRttExcess, 0);
    return {
      intercept: defaultCoefficients.intercept * multiplier,
      optimistic: 0.5 + (defaultCoefficients.optimistic - 0.5) * multiplier,
      pessimistic: 0.5 + (defaultCoefficients.pessimistic - 0.5) * multiplier
    };
  }
  static getOptimisticGraph(dependencyGraph) {
    return dependencyGraph;
  }
  static getPessimisticGraph(dependencyGraph) {
    return dependencyGraph;
  }
  static getEstimateFromSimulation(simulationResult, extras) {
    if (!extras.fcpResult) {
      throw new Core.LanternError("missing fcpResult");
    }
    if (extras.observedSpeedIndex === void 0) {
      throw new Core.LanternError("missing observedSpeedIndex");
    }
    const fcpTimeInMs = extras.fcpResult.pessimisticEstimate.timeInMs;
    const estimate = extras.optimistic ? extras.observedSpeedIndex : SpeedIndex.computeLayoutBasedSpeedIndex(simulationResult.nodeTimings, fcpTimeInMs);
    return {
      timeInMs: estimate,
      nodeTimings: simulationResult.nodeTimings
    };
  }
  static compute(data, extras) {
    const fcpResult = extras?.fcpResult;
    if (!fcpResult) {
      throw new Core.LanternError("FCP is required to calculate the SpeedIndex metric");
    }
    const metricResult = super.compute(data, extras);
    metricResult.timing = Math.max(metricResult.timing, fcpResult.timing);
    return metricResult;
  }
  /**
   * Approximate speed index using layout events from the simulated node timings.
   * The layout-based speed index is the weighted average of the endTime of CPU nodes that contained
   * a 'Layout' task. log(duration) is used as the weight to stand for "significance" to the page.
   *
   * If no layout events can be found or the endTime of a CPU task is too early, FCP is used instead.
   *
   * This approach was determined after evaluating the accuracy/complexity tradeoff of many
   * different methods. Read more in the evaluation doc.
   *
   * @see https://docs.google.com/document/d/1qJWXwxoyVLVadezIp_Tgdk867G3tDNkkVRvUJSH3K1E/edit#
   */
  static computeLayoutBasedSpeedIndex(nodeTimings, fcpTimeInMs) {
    const layoutWeights = [];
    for (const [node, timing] of nodeTimings.entries()) {
      if (node.type !== Graph.BaseNode.types.CPU) {
        continue;
      }
      if (node.childEvents.some((x) => x.name === "Layout")) {
        const timingWeight = Math.max(Math.log2(timing.endTime - timing.startTime), 0);
        layoutWeights.push({ time: timing.endTime, weight: timingWeight });
      }
    }
    const totalWeightedTime = layoutWeights.map((evt) => evt.weight * Math.max(evt.time, fcpTimeInMs)).reduce((a, b) => a + b, 0);
    const totalWeight = layoutWeights.map((evt) => evt.weight).reduce((a, b) => a + b, 0);
    if (!totalWeight) {
      return fcpTimeInMs;
    }
    return totalWeightedTime / totalWeight;
  }
}
export { SpeedIndex };
//# sourceMappingURL=SpeedIndex.js.map
