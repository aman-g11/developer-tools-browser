"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Handlers from "../handlers/handlers.js";
import * as Helpers from "../helpers/helpers.js";
import {
  InsightCategory,
  InsightKeys
} from "./types.js";
export const UIStrings = {
  /**
   * @description Title of an insight that recommends using HTTP/2 over HTTP/1.1 because of the performance benefits. "HTTP" should not be translated.
   */
  title: "Modern HTTP",
  /**
   * @description Description of an insight that recommends recommends using HTTP/2 over HTTP/1.1 because of the performance benefits. "HTTP" should not be translated.
   */
  description: "HTTP/2 and HTTP/3 offer many benefits over HTTP/1.1, such as multiplexing. [Learn more about using modern HTTP](https://developer.chrome.com/docs/performance/insights/modern-http).",
  /**
   * @description Column header for a table where each cell represents a network request.
   */
  request: "Request",
  /**
   * @description Column header for a table where each cell represents the protocol of a network request.
   */
  protocol: "Protocol",
  /**
   * @description Text explaining that there were not requests that were slowed down by using HTTP/1.1. "HTTP/1.1" should not be translated.
   */
  noOldProtocolRequests: "No requests used HTTP/1.1, or its current use of HTTP/1.1 does not present a significant optimization opportunity. HTTP/1.1 requests are only flagged if six or more static assets originate from the same origin, and they are not served from a local development environment or a third-party source."
};
const str_ = i18n.i18n.registerUIStrings("models/trace/insights/ModernHTTP.ts", UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function isModernHTTPInsight(model) {
  return model.insightKey === InsightKeys.MODERN_HTTP;
}
function isMultiplexableStaticAsset(request, entityMappings, firstPartyEntity) {
  if (!Helpers.Network.STATIC_RESOURCE_TYPES.has(request.args.data.resourceType)) {
    return false;
  }
  if (request.args.data.decodedBodyLength < 100) {
    const entity = entityMappings.entityByEvent.get(request);
    if (entity) {
      if (firstPartyEntity?.name === entity.name) {
        return true;
      }
      if (!entity.isUnrecognized) {
        return false;
      }
    }
  }
  return true;
}
export function determineHttp1Requests(requests, entityMappings, firstPartyEntity) {
  const http1Requests = [];
  const groupedByOrigin = /* @__PURE__ */ new Map();
  for (const record of requests) {
    const url = new URL(record.args.data.url);
    if (!isMultiplexableStaticAsset(record, entityMappings, firstPartyEntity)) {
      continue;
    }
    if (Helpers.Network.isSyntheticNetworkRequestLocalhost(record)) {
      continue;
    }
    const originRequests = Platform.MapUtilities.getWithDefault(groupedByOrigin, url.origin, () => []);
    originRequests.push(record);
  }
  const seenURLs = /* @__PURE__ */ new Set();
  for (const request of requests) {
    if (seenURLs.has(request.args.data.url)) {
      continue;
    }
    if (request.args.data.fromServiceWorker) {
      continue;
    }
    const isOldHttp = /HTTP\/[01][.\d]?/i.test(request.args.data.protocol);
    if (!isOldHttp) {
      continue;
    }
    const url = new URL(request.args.data.url);
    const group = groupedByOrigin.get(url.origin) || [];
    if (group.length < 6) {
      continue;
    }
    seenURLs.add(request.args.data.url);
    http1Requests.push(request);
  }
  return http1Requests;
}
function computeWasteWithGraph(urlsToChange, graph, simulator) {
  const simulationBefore = simulator.simulate(graph);
  const originalProtocols = /* @__PURE__ */ new Map();
  graph.traverse((node) => {
    if (node.type !== "network") {
      return;
    }
    if (!urlsToChange.has(node.request.url)) {
      return;
    }
    originalProtocols.set(node.request.requestId, node.request.protocol);
    node.request.protocol = "h2";
  });
  const simulationAfter = simulator.simulate(graph);
  graph.traverse((node) => {
    if (node.type !== "network") {
      return;
    }
    const originalProtocol = originalProtocols.get(node.request.requestId);
    if (originalProtocol === void 0) {
      return;
    }
    node.request.protocol = originalProtocol;
  });
  const savings = simulationBefore.timeInMs - simulationAfter.timeInMs;
  return Platform.NumberUtilities.floor(savings, 1 / 10);
}
function computeMetricSavings(http1Requests, context) {
  if (!context.navigation || !context.lantern) {
    return;
  }
  const urlsToChange = new Set(http1Requests.map((r) => r.args.data.url));
  const fcpGraph = context.lantern.metrics.firstContentfulPaint.optimisticGraph;
  const lcpGraph = context.lantern.metrics.largestContentfulPaint.optimisticGraph;
  return {
    FCP: computeWasteWithGraph(urlsToChange, fcpGraph, context.lantern.simulator),
    LCP: computeWasteWithGraph(urlsToChange, lcpGraph, context.lantern.simulator)
  };
}
function finalize(partialModel) {
  return {
    insightKey: InsightKeys.MODERN_HTTP,
    strings: UIStrings,
    title: i18nString(UIStrings.title),
    description: i18nString(UIStrings.description),
    docs: "https://developer.chrome.com/docs/performance/insights/modern-http",
    category: InsightCategory.LCP,
    state: partialModel.http1Requests.length > 0 ? "fail" : "pass",
    ...partialModel,
    relatedEvents: partialModel.http1Requests
  };
}
export function generateInsight(data, context) {
  const isWithinContext = (event) => Helpers.Timing.eventIsInBounds(event, context.bounds);
  const contextRequests = data.NetworkRequests.byTime.filter(isWithinContext);
  const entityMappings = data.NetworkRequests.entityMappings;
  const firstPartyUrl = context.navigation?.args.data?.documentLoaderURL ?? data.Meta.mainFrameURL;
  const firstPartyEntity = Handlers.Helpers.getEntityForUrl(firstPartyUrl, entityMappings);
  const http1Requests = determineHttp1Requests(contextRequests, entityMappings, firstPartyEntity ?? null);
  return finalize({
    http1Requests,
    metricSavings: computeMetricSavings(http1Requests, context)
  });
}
export function createOverlayForRequest(request) {
  return {
    type: "ENTRY_OUTLINE",
    entry: request,
    outlineReason: "ERROR"
  };
}
export function createOverlays(model) {
  return model.http1Requests.map((req) => createOverlayForRequest(req)) ?? [];
}
//# sourceMappingURL=ModernHTTP.js.map
