"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
import { data as metaData } from "./MetaHandler.js";
import { data as networkRequestsData } from "./NetworkRequestsHandler.js";
import { data as pageLoadMetricsData, MetricName } from "./PageLoadMetricsHandler.js";
let imagePaintsByNodeIdAndProcess = /* @__PURE__ */ new Map();
let lcpRequestByNavigationId = /* @__PURE__ */ new Map();
export function reset() {
  imagePaintsByNodeIdAndProcess = /* @__PURE__ */ new Map();
  lcpRequestByNavigationId = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (!Types.Events.isLargestImagePaintCandidate(event) || !event.args.data) {
    return;
  }
  const imagePaintsByNodeId = Platform.MapUtilities.getWithDefault(imagePaintsByNodeIdAndProcess, event.pid, () => /* @__PURE__ */ new Map());
  imagePaintsByNodeId.set(event.args.data.DOMNodeId, event);
}
export async function finalize() {
  const requests = networkRequestsData().byTime;
  const { traceBounds, navigationsByNavigationId } = metaData();
  const metricScoresByFrameId = pageLoadMetricsData().metricScoresByFrameId;
  for (const [navigationId, navigation] of navigationsByNavigationId) {
    const lcpMetric = metricScoresByFrameId.get(navigation.args.frame)?.get(navigation)?.get(MetricName.LCP);
    const lcpEvent = lcpMetric?.event;
    if (!lcpEvent || !Types.Events.isAnyLargestContentfulPaintCandidate(lcpEvent)) {
      continue;
    }
    const nodeId = lcpEvent.args.data?.nodeId;
    if (!nodeId) {
      continue;
    }
    const lcpImagePaintEvent = imagePaintsByNodeIdAndProcess.get(lcpEvent.pid)?.get(nodeId);
    const lcpUrl = lcpImagePaintEvent?.args.data?.imageUrl;
    if (!lcpUrl) {
      continue;
    }
    const startTime = navigation?.ts ?? traceBounds.min;
    const endTime = lcpImagePaintEvent.ts;
    let lcpRequest;
    for (const request of requests) {
      if (request.ts < startTime) {
        continue;
      }
      if (request.ts >= endTime) {
        break;
      }
      if (request.args.data.url === lcpUrl || request.args.data.redirects.some((r) => r.url === lcpUrl)) {
        lcpRequest = request;
        break;
      }
    }
    if (lcpRequest) {
      lcpRequestByNavigationId.set(navigationId, lcpRequest);
    }
  }
}
export function data() {
  return { lcpRequestByNavigationId };
}
export function deps() {
  return ["Meta", "NetworkRequests", "PageLoadMetrics"];
}
//# sourceMappingURL=LargestImagePaintHandler.js.map
