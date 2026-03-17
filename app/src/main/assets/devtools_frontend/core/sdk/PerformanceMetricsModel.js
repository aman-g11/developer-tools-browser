"use strict";
import * as Platform from "../platform/platform.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
export class PerformanceMetricsModel extends SDKModel {
  #agent;
  #metricModes = /* @__PURE__ */ new Map([
    ["TaskDuration", "CumulativeTime" /* CUMULATIVE_TIME */],
    ["ScriptDuration", "CumulativeTime" /* CUMULATIVE_TIME */],
    ["LayoutDuration", "CumulativeTime" /* CUMULATIVE_TIME */],
    ["RecalcStyleDuration", "CumulativeTime" /* CUMULATIVE_TIME */],
    ["LayoutCount", "CumulativeCount" /* CUMULATIVE_COUNT */],
    ["RecalcStyleCount", "CumulativeCount" /* CUMULATIVE_COUNT */]
  ]);
  #metricData = /* @__PURE__ */ new Map();
  constructor(target) {
    super(target);
    this.#agent = target.performanceAgent();
  }
  enable() {
    return this.#agent.invoke_enable({});
  }
  disable() {
    return this.#agent.invoke_disable();
  }
  async requestMetrics() {
    const rawMetrics = await this.#agent.invoke_getMetrics() || [];
    const metrics = /* @__PURE__ */ new Map();
    const timestamp = performance.now();
    for (const metric of rawMetrics.metrics) {
      let data = this.#metricData.get(metric.name);
      if (!data) {
        data = { lastValue: void 0, lastTimestamp: void 0 };
        this.#metricData.set(metric.name, data);
      }
      let value;
      switch (this.#metricModes.get(metric.name)) {
        case "CumulativeTime" /* CUMULATIVE_TIME */:
          value = data.lastTimestamp && data.lastValue ? Platform.NumberUtilities.clamp(
            (metric.value - data.lastValue) * 1e3 / (timestamp - data.lastTimestamp),
            0,
            1
          ) : 0;
          data.lastValue = metric.value;
          data.lastTimestamp = timestamp;
          break;
        case "CumulativeCount" /* CUMULATIVE_COUNT */:
          value = data.lastTimestamp && data.lastValue ? Math.max(0, (metric.value - data.lastValue) * 1e3 / (timestamp - data.lastTimestamp)) : 0;
          data.lastValue = metric.value;
          data.lastTimestamp = timestamp;
          break;
        default:
          value = metric.value;
          break;
      }
      metrics.set(metric.name, value);
    }
    return { metrics, timestamp };
  }
}
var MetricMode = /* @__PURE__ */ ((MetricMode2) => {
  MetricMode2["CUMULATIVE_TIME"] = "CumulativeTime";
  MetricMode2["CUMULATIVE_COUNT"] = "CumulativeCount";
  return MetricMode2;
})(MetricMode || {});
SDKModel.register(PerformanceMetricsModel, { capabilities: Capability.DOM, autostart: false });
//# sourceMappingURL=PerformanceMetricsModel.js.map
