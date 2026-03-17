"use strict";
import * as Graph from "../graph/graph.js";
import { Metric } from "./Metric.js";
class FirstContentfulPaint extends Metric {
  static get coefficients() {
    return {
      intercept: 0,
      optimistic: 0.5,
      pessimistic: 0.5
    };
  }
  /**
   * Computes the set of URLs that *appeared* to be render-blocking based on our filter,
   * *but definitely were not* render-blocking based on the timing of their EvaluateScript task.
   * It also computes the set of corresponding CPU node ids that were needed for the paint at the
   * given timestamp.
   */
  static getRenderBlockingNodeData(graph, { cutoffTimestamp, treatNodeAsRenderBlocking, additionalCpuNodesToTreatAsRenderBlocking }) {
    const scriptUrlToNodeMap = /* @__PURE__ */ new Map();
    const cpuNodes = [];
    graph.traverse((node) => {
      if (node.type === Graph.BaseNode.types.CPU) {
        if (node.startTime <= cutoffTimestamp) {
          cpuNodes.push(node);
        }
        const scriptUrls = node.getEvaluateScriptURLs();
        for (const url of scriptUrls) {
          const existing = scriptUrlToNodeMap.get(url) || node;
          scriptUrlToNodeMap.set(url, node.startTime < existing.startTime ? node : existing);
        }
      }
    });
    cpuNodes.sort((a, b) => a.startTime - b.startTime);
    const possiblyRenderBlockingScriptUrls = Metric.getScriptUrls(graph, (node) => {
      return node.endTime <= cutoffTimestamp && treatNodeAsRenderBlocking(node);
    });
    const definitelyNotRenderBlockingScriptUrls = /* @__PURE__ */ new Set();
    const renderBlockingCpuNodeIds = /* @__PURE__ */ new Set();
    for (const url of possiblyRenderBlockingScriptUrls) {
      const cpuNodeForUrl = scriptUrlToNodeMap.get(url);
      if (!cpuNodeForUrl) {
        continue;
      }
      if (cpuNodes.includes(cpuNodeForUrl)) {
        renderBlockingCpuNodeIds.add(cpuNodeForUrl.id);
        continue;
      }
      definitelyNotRenderBlockingScriptUrls.add(url);
    }
    const firstLayout = cpuNodes.find((node) => node.didPerformLayout());
    if (firstLayout) {
      renderBlockingCpuNodeIds.add(firstLayout.id);
    }
    const firstPaint = cpuNodes.find((node) => node.childEvents.some((e) => e.name === "Paint"));
    if (firstPaint) {
      renderBlockingCpuNodeIds.add(firstPaint.id);
    }
    const firstParse = cpuNodes.find((node) => node.childEvents.some((e) => e.name === "ParseHTML"));
    if (firstParse) {
      renderBlockingCpuNodeIds.add(firstParse.id);
    }
    if (additionalCpuNodesToTreatAsRenderBlocking) {
      cpuNodes.filter(additionalCpuNodesToTreatAsRenderBlocking).forEach((node) => renderBlockingCpuNodeIds.add(node.id));
    }
    return {
      definitelyNotRenderBlockingScriptUrls,
      renderBlockingCpuNodeIds
    };
  }
  /**
   * Computes the graph required for the first paint of interest.
   */
  static getFirstPaintBasedGraph(dependencyGraph, { cutoffTimestamp, treatNodeAsRenderBlocking, additionalCpuNodesToTreatAsRenderBlocking }) {
    const rbData = this.getRenderBlockingNodeData(dependencyGraph, {
      cutoffTimestamp,
      treatNodeAsRenderBlocking,
      additionalCpuNodesToTreatAsRenderBlocking
    });
    const { definitelyNotRenderBlockingScriptUrls, renderBlockingCpuNodeIds } = rbData;
    return dependencyGraph.cloneWithRelationships((node) => {
      if (node.type === Graph.BaseNode.types.NETWORK) {
        const endedAfterPaint = node.endTime > cutoffTimestamp || node.startTime > cutoffTimestamp;
        if (endedAfterPaint && !node.isMainDocument()) {
          return false;
        }
        const url = node.request.url;
        if (definitelyNotRenderBlockingScriptUrls.has(url)) {
          return false;
        }
        return treatNodeAsRenderBlocking(node);
      }
      return renderBlockingCpuNodeIds.has(node.id);
    });
  }
  static getOptimisticGraph(dependencyGraph, processedNavigation) {
    return this.getFirstPaintBasedGraph(dependencyGraph, {
      cutoffTimestamp: processedNavigation.timestamps.firstContentfulPaint,
      // In the optimistic graph we exclude resources that appeared to be render-blocking but were
      // initiated by a script. While they typically have a very high importance and tend to have a
      // significant impact on the page's content, these resources don't technically block rendering.
      treatNodeAsRenderBlocking: (node) => node.hasRenderBlockingPriority() && node.initiatorType !== "script"
    });
  }
  static getPessimisticGraph(dependencyGraph, processedNavigation) {
    return this.getFirstPaintBasedGraph(dependencyGraph, {
      cutoffTimestamp: processedNavigation.timestamps.firstContentfulPaint,
      treatNodeAsRenderBlocking: (node) => node.hasRenderBlockingPriority()
    });
  }
}
export { FirstContentfulPaint };
//# sourceMappingURL=FirstContentfulPaint.js.map
