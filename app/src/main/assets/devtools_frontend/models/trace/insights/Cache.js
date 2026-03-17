"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Protocol from "../../../generated/protocol.js";
import * as Helpers from "../helpers/helpers.js";
import { metricSavingsForWastedBytes } from "./Common.js";
import { linearInterpolation } from "./Statistics.js";
import {
  InsightCategory,
  InsightKeys
} from "./types.js";
export const UIStrings = {
  /**
   * @description Title of an insight that provides information and suggestions of resources that could improve their caching.
   */
  title: "Use efficient cache lifetimes",
  /**
   * @description Text to tell the user about how caching can help improve performance.
   */
  description: "A long cache lifetime can speed up repeat visits to your page. [Learn more about caching](https://developer.chrome.com/docs/performance/insights/cache).",
  /**
   * @description Column for a font loaded by the page to render text.
   */
  requestColumn: "Request",
  /**
   * @description Column for a resource cache's Time To Live.
   */
  cacheTTL: "Cache TTL",
  /**
   * @description Text describing that there were no requests found that need caching.
   */
  noRequestsToCache: "No requests with inefficient cache policies",
  /**
   * @description Table row value representing the remaining items not shown in the table due to size constraints. This row will always represent at least 2 items.
   * @example {5} PH1
   */
  others: "{PH1} others"
};
const str_ = i18n.i18n.registerUIStrings("models/trace/insights/Cache.ts", UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const IGNORE_THRESHOLD_IN_PERCENT = 0.925;
function finalize(partialModel) {
  return {
    insightKey: InsightKeys.CACHE,
    strings: UIStrings,
    title: i18nString(UIStrings.title),
    description: i18nString(UIStrings.description),
    docs: "https://developer.chrome.com/docs/performance/insights/cache",
    category: InsightCategory.ALL,
    state: partialModel.requests.length > 0 ? "fail" : "pass",
    ...partialModel
  };
}
export function isCacheable(request) {
  if (Helpers.Network.NON_NETWORK_SCHEMES.includes(request.args.data.protocol)) {
    return false;
  }
  return Boolean(
    Helpers.Network.CACHEABLE_STATUS_CODES.has(request.args.data.statusCode) && Helpers.Network.STATIC_RESOURCE_TYPES.has(request.args.data.resourceType || Protocol.Network.ResourceType.Other)
  );
}
export function computeCacheLifetimeInSeconds(headers, cacheControl) {
  if (cacheControl?.["max-age"] !== void 0) {
    return cacheControl["max-age"];
  }
  const expiresHeaders = headers.find((h) => h.name === "expires")?.value ?? null;
  if (expiresHeaders) {
    const expires = new Date(expiresHeaders).getTime();
    if (!expires) {
      return 0;
    }
    return Math.ceil((expires - Date.now()) / 1e3);
  }
  return null;
}
function getCacheHitProbability(maxAgeInSeconds) {
  const RESOURCE_AGE_IN_HOURS_DECILES = [0, 0.2, 1, 3, 8, 12, 24, 48, 72, 168, 8760, Infinity];
  const maxAgeInHours = maxAgeInSeconds / 3600;
  const upperDecileIndex = RESOURCE_AGE_IN_HOURS_DECILES.findIndex((decile) => decile >= maxAgeInHours);
  if (upperDecileIndex === RESOURCE_AGE_IN_HOURS_DECILES.length - 1) {
    return 1;
  }
  if (upperDecileIndex === 0) {
    return 0;
  }
  const upperDecileValue = RESOURCE_AGE_IN_HOURS_DECILES[upperDecileIndex];
  const lowerDecileValue = RESOURCE_AGE_IN_HOURS_DECILES[upperDecileIndex - 1];
  const upperDecile = upperDecileIndex / 10;
  const lowerDecile = (upperDecileIndex - 1) / 10;
  return linearInterpolation(lowerDecileValue, lowerDecile, upperDecileValue, upperDecile, maxAgeInHours);
}
export function getCombinedHeaders(responseHeaders) {
  const headers = /* @__PURE__ */ new Map();
  for (const header of responseHeaders) {
    const name = header.name.toLowerCase();
    if (headers.get(name)) {
      headers.set(name, `${headers.get(name)}, ${header.value}`);
    } else {
      headers.set(name, header.value);
    }
  }
  return headers;
}
export function cachingDisabled(headers, parsedCacheControl) {
  const cacheControl = headers?.get("cache-control") ?? null;
  const pragma = headers?.get("pragma") ?? null;
  if (!cacheControl && pragma?.includes("no-cache")) {
    return true;
  }
  if (parsedCacheControl && (parsedCacheControl["must-revalidate"] || parsedCacheControl["no-cache"] || parsedCacheControl["no-store"] || parsedCacheControl["private"])) {
    return true;
  }
  return false;
}
export function isCacheInsight(model) {
  return model.insightKey === InsightKeys.CACHE;
}
export function generateInsight(data, context) {
  const isWithinContext = (event) => Helpers.Timing.eventIsInBounds(event, context.bounds);
  const contextRequests = data.NetworkRequests.byTime.filter(isWithinContext);
  const results = [];
  let totalWastedBytes = 0;
  const wastedBytesByRequestId = /* @__PURE__ */ new Map();
  for (const req of contextRequests) {
    if (!req.args.data.responseHeaders || !isCacheable(req)) {
      continue;
    }
    const headers = getCombinedHeaders(req.args.data.responseHeaders);
    const cacheControl = headers.get("cache-control") ?? null;
    const parsedDirectives = Helpers.Network.parseCacheControl(cacheControl);
    if (cachingDisabled(headers, parsedDirectives)) {
      continue;
    }
    let ttl = computeCacheLifetimeInSeconds(req.args.data.responseHeaders, parsedDirectives);
    if (ttl !== null && (!Number.isFinite(ttl) || ttl <= 0)) {
      continue;
    }
    ttl = ttl || 0;
    const ttlDays = ttl / 86400;
    if (ttlDays >= 30) {
      continue;
    }
    const cacheHitProbability = getCacheHitProbability(ttl);
    if (cacheHitProbability > IGNORE_THRESHOLD_IN_PERCENT) {
      continue;
    }
    const transferSize = req.args.data.encodedDataLength || 0;
    const wastedBytes = (1 - cacheHitProbability) * transferSize;
    wastedBytesByRequestId.set(req.args.data.requestId, wastedBytes);
    totalWastedBytes += wastedBytes;
    results.push({ request: req, ttl, wastedBytes });
  }
  results.sort((a, b) => {
    return b.request.args.data.decodedBodyLength - a.request.args.data.decodedBodyLength || a.ttl - b.ttl;
  });
  return finalize({
    relatedEvents: results.map((r) => r.request),
    requests: results,
    metricSavings: metricSavingsForWastedBytes(wastedBytesByRequestId, context),
    wastedBytes: totalWastedBytes
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
  return model.requests.map((req) => createOverlayForRequest(req.request));
}
//# sourceMappingURL=Cache.js.map
