"use strict";
import * as Protocol from "../../../generated/protocol.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { getLogNormalScore } from "./Statistics.js";
import {
  InsightKeys
} from "./types.js";
const GRAPH_SAVINGS_PRECISION = 50;
export function getInsight(insightName, insightSet) {
  return insightSet.model[insightName];
}
export function getLCP(insightSet) {
  const insight = getInsight(InsightKeys.LCP_BREAKDOWN, insightSet);
  if (!insight || !insight.lcpMs || !insight.lcpEvent) {
    return null;
  }
  const value = Helpers.Timing.milliToMicro(insight.lcpMs);
  return { value, event: insight.lcpEvent };
}
export function getINP(insightSet) {
  const insight = getInsight(InsightKeys.INP_BREAKDOWN, insightSet);
  if (!insight?.longestInteractionEvent?.dur) {
    return null;
  }
  const value = insight.longestInteractionEvent.dur;
  return { value, event: insight.longestInteractionEvent };
}
export function getCLS(insightSet) {
  const insight = getInsight(InsightKeys.CLS_CULPRITS, insightSet);
  if (!insight) {
    return { value: 0, worstClusterEvent: null };
  }
  let maxScore = 0;
  let worstCluster;
  for (const cluster of insight.clusters) {
    if (cluster.clusterCumulativeScore > maxScore) {
      maxScore = cluster.clusterCumulativeScore;
      worstCluster = cluster;
    }
  }
  return { value: maxScore, worstClusterEvent: worstCluster ?? null };
}
export function evaluateLCPMetricScore(value) {
  return getLogNormalScore({ p10: 2500, median: 4e3 }, value);
}
export function evaluateINPMetricScore(value) {
  return getLogNormalScore({ p10: 200, median: 500 }, value);
}
export function evaluateCLSMetricScore(value) {
  return getLogNormalScore({ p10: 0.1, median: 0.25 }, value);
}
function getPageResult(cruxFieldData, url, origin, scope = null) {
  return cruxFieldData.find((result) => {
    const key = scope ? result[`${scope.pageScope}-${scope.deviceScope}`]?.record.key : (result["url-ALL"] || result["origin-ALL"])?.record.key;
    return key?.url && key.url === url || key?.origin && key.origin === origin;
  });
}
function getMetricResult(pageResult, name, scope = null) {
  const scopes = [];
  if (scope) {
    scopes.push(scope);
  } else {
    scopes.push({ pageScope: "url", deviceScope: "ALL" });
    scopes.push({ pageScope: "origin", deviceScope: "ALL" });
  }
  for (const scope2 of scopes) {
    const key = `${scope2.pageScope}-${scope2.deviceScope}`;
    let value = pageResult[key]?.record.metrics[name]?.percentiles?.p75;
    if (typeof value === "string") {
      value = Number(value);
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return { value, pageScope: scope2.pageScope };
    }
  }
  return null;
}
function getMetricTimingResult(pageResult, name, scope = null) {
  const result = getMetricResult(pageResult, name, scope);
  if (result) {
    const valueMs = result.value;
    return { value: Helpers.Timing.milliToMicro(valueMs), pageScope: result.pageScope };
  }
  return null;
}
export function getFieldMetricsForInsightSet(insightSet, metadata, scope = null) {
  const cruxFieldData = metadata?.cruxFieldData;
  if (!cruxFieldData) {
    return null;
  }
  const pageResult = getPageResult(cruxFieldData, insightSet.url.href, insightSet.url.origin, scope);
  if (!pageResult) {
    return null;
  }
  return {
    fcp: getMetricTimingResult(pageResult, "first_contentful_paint", scope),
    lcp: getMetricTimingResult(pageResult, "largest_contentful_paint", scope),
    inp: getMetricTimingResult(pageResult, "interaction_to_next_paint", scope),
    cls: getMetricResult(pageResult, "cumulative_layout_shift", scope),
    lcpBreakdown: {
      ttfb: getMetricTimingResult(pageResult, "largest_contentful_paint_image_time_to_first_byte", scope),
      loadDelay: getMetricTimingResult(pageResult, "largest_contentful_paint_image_resource_load_delay", scope),
      loadDuration: getMetricTimingResult(pageResult, "largest_contentful_paint_image_resource_load_duration", scope),
      renderDelay: getMetricTimingResult(pageResult, "largest_contentful_paint_image_element_render_delay", scope)
    }
  };
}
export function calculateMetricWeightsForSorting(insightSet, metadata) {
  const weights = {
    lcp: 1 / 3,
    inp: 1 / 3,
    cls: 1 / 3
  };
  const cruxFieldData = metadata?.cruxFieldData;
  if (!cruxFieldData) {
    return weights;
  }
  const fieldMetrics = getFieldMetricsForInsightSet(insightSet, metadata);
  if (!fieldMetrics) {
    return weights;
  }
  const fieldLcp = fieldMetrics.lcp?.value ?? null;
  const fieldInp = fieldMetrics.inp?.value ?? null;
  const fieldCls = fieldMetrics.cls?.value ?? null;
  const fieldLcpScore = fieldLcp !== null ? evaluateLCPMetricScore(Helpers.Timing.microToMilli(fieldLcp)) : 0;
  const fieldInpScore = fieldInp !== null ? evaluateINPMetricScore(Helpers.Timing.microToMilli(fieldInp)) : 0;
  const fieldClsScore = fieldCls !== null ? evaluateCLSMetricScore(fieldCls) : 0;
  const fieldLcpScoreInverted = 1 - fieldLcpScore;
  const fieldInpScoreInverted = 1 - fieldInpScore;
  const fieldClsScoreInverted = 1 - fieldClsScore;
  const invertedSum = fieldLcpScoreInverted + fieldInpScoreInverted + fieldClsScoreInverted;
  if (!invertedSum) {
    return weights;
  }
  weights.lcp = fieldLcpScoreInverted / invertedSum;
  weights.inp = fieldInpScoreInverted / invertedSum;
  weights.cls = fieldClsScoreInverted / invertedSum;
  return weights;
}
function estimateSavingsWithGraphs(wastedBytesByRequestId, simulator, graph) {
  const simulationBeforeChanges = simulator.simulate(graph);
  const originalTransferSizes = /* @__PURE__ */ new Map();
  graph.traverse((node) => {
    if (node.type !== "network") {
      return;
    }
    const wastedBytes = wastedBytesByRequestId.get(node.request.requestId);
    if (!wastedBytes) {
      return;
    }
    const original = node.request.transferSize;
    originalTransferSizes.set(node.request.requestId, original);
    node.request.transferSize = Math.max(original - wastedBytes, 0);
  });
  const simulationAfterChanges = simulator.simulate(graph);
  graph.traverse((node) => {
    if (node.type !== "network") {
      return;
    }
    const originalTransferSize = originalTransferSizes.get(node.request.requestId);
    if (originalTransferSize === void 0) {
      return;
    }
    node.request.transferSize = originalTransferSize;
  });
  let savings = simulationBeforeChanges.timeInMs - simulationAfterChanges.timeInMs;
  savings = Math.round(savings / GRAPH_SAVINGS_PRECISION) * GRAPH_SAVINGS_PRECISION;
  return Types.Timing.Milli(savings);
}
export function metricSavingsForWastedBytes(wastedBytesByRequestId, context) {
  if (!context.navigation || !context.lantern) {
    return;
  }
  if (!wastedBytesByRequestId.size) {
    return { FCP: Types.Timing.Milli(0), LCP: Types.Timing.Milli(0) };
  }
  const simulator = context.lantern.simulator;
  const fcpGraph = context.lantern.metrics.firstContentfulPaint.optimisticGraph;
  const lcpGraph = context.lantern.metrics.largestContentfulPaint.optimisticGraph;
  return {
    FCP: estimateSavingsWithGraphs(wastedBytesByRequestId, simulator, fcpGraph),
    LCP: estimateSavingsWithGraphs(wastedBytesByRequestId, simulator, lcpGraph)
  };
}
export function isRequestCompressed(request) {
  if (!request.args.data.responseHeaders) {
    return false;
  }
  const patterns = [
    /^content-encoding$/i,
    /^x-content-encoding-over-network$/i,
    /^x-original-content-encoding$/i
    // Lightrider.
  ];
  const compressionTypes = ["gzip", "br", "deflate", "zstd"];
  return request.args.data.responseHeaders.some(
    (header) => patterns.some((p) => header.name.match(p)) && compressionTypes.includes(header.value)
  );
}
export function isRequestServedFromBrowserCache(request) {
  if (!request.args.data.responseHeaders || request.args.data.failed) {
    return false;
  }
  if (request.args.data.statusCode === 304) {
    return true;
  }
  const { transferSize, resourceSize } = getRequestSizes(request);
  const ratio = resourceSize ? transferSize / resourceSize : 0;
  if (ratio < 0.01) {
    return true;
  }
  return false;
}
function getRequestSizes(request) {
  const resourceSize = request.args.data.decodedBodyLength;
  const transferSize = request.args.data.encodedDataLength;
  return { resourceSize, transferSize };
}
export function estimateCompressedContentSize(request, totalBytes, resourceType) {
  if (!request || isRequestServedFromBrowserCache(request)) {
    switch (resourceType) {
      case "Stylesheet":
        return Math.round(totalBytes * 0.2);
      case "Script":
      case "Document":
        return Math.round(totalBytes * 0.33);
      default:
        return Math.round(totalBytes * 0.5);
    }
  }
  const { transferSize, resourceSize } = getRequestSizes(request);
  let contentTransferSize = transferSize;
  if (!isRequestCompressed(request)) {
    contentTransferSize = resourceSize;
  }
  if (request.args.data.resourceType === resourceType) {
    return contentTransferSize;
  }
  const compressionRatio = Number.isFinite(resourceSize) && resourceSize > 0 ? contentTransferSize / resourceSize : 1;
  return Math.round(totalBytes * compressionRatio);
}
export function estimateCompressionRatioForScript(script) {
  if (!script.request) {
    return 1;
  }
  const request = script.request;
  const contentLength = request.args.data.decodedBodyLength ?? script.content?.length ?? 0;
  const compressedSize = estimateCompressedContentSize(request, contentLength, Protocol.Network.ResourceType.Script);
  if (contentLength === 0 || compressedSize === 0) {
    return 1;
  }
  const compressionRatio = compressedSize / contentLength;
  return compressionRatio;
}
export function calculateDocFirstByteTs(docRequest) {
  if (docRequest.args.data.protocol === "file") {
    return docRequest.ts;
  }
  const timing = docRequest.args.data.timing;
  if (!timing) {
    return null;
  }
  return Types.Timing.Micro(
    Helpers.Timing.secondsToMicro(timing.requestTime) + Helpers.Timing.milliToMicro(timing.receiveHeadersStart ?? timing.receiveHeadersEnd)
  );
}
export function insightBounds(insight, insightSetBounds) {
  const overlays = insight.createOverlays?.() ?? [];
  const windows = overlays.map(Helpers.Timing.traceWindowFromOverlay).filter((bounds) => !!bounds);
  const overlaysBounds = Helpers.Timing.combineTraceWindowsMicro(windows);
  if (overlaysBounds) {
    return overlaysBounds;
  }
  return insightSetBounds;
}
//# sourceMappingURL=Common.js.map
