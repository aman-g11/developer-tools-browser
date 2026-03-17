"use strict";
import * as Protocol from "../../generated/protocol.js";
export var RequestTimeRangeNames = /* @__PURE__ */ ((RequestTimeRangeNames2) => {
  RequestTimeRangeNames2["PUSH"] = "push";
  RequestTimeRangeNames2["QUEUEING"] = "queueing";
  RequestTimeRangeNames2["BLOCKING"] = "blocking";
  RequestTimeRangeNames2["CONNECTING"] = "connecting";
  RequestTimeRangeNames2["DNS"] = "dns";
  RequestTimeRangeNames2["PROXY"] = "proxy";
  RequestTimeRangeNames2["RECEIVING"] = "receiving";
  RequestTimeRangeNames2["RECEIVING_PUSH"] = "receiving-push";
  RequestTimeRangeNames2["SENDING"] = "sending";
  RequestTimeRangeNames2["SERVICE_WORKER"] = "serviceworker";
  RequestTimeRangeNames2["SERVICE_WORKER_PREPARATION"] = "serviceworker-preparation";
  RequestTimeRangeNames2["SERVICE_WORKER_RESPOND_WITH"] = "serviceworker-respondwith";
  RequestTimeRangeNames2["SERVICE_WORKER_ROUTER_EVALUATION"] = "serviceworker-routerevaluation";
  RequestTimeRangeNames2["SERVICE_WORKER_CACHE_LOOKUP"] = "serviceworker-cachelookup";
  RequestTimeRangeNames2["SSL"] = "ssl";
  RequestTimeRangeNames2["TOTAL"] = "total";
  RequestTimeRangeNames2["WAITING"] = "waiting";
  return RequestTimeRangeNames2;
})(RequestTimeRangeNames || {});
export const ServiceWorkerRangeNames = /* @__PURE__ */ new Set([
  "serviceworker" /* SERVICE_WORKER */,
  "serviceworker-preparation" /* SERVICE_WORKER_PREPARATION */,
  "serviceworker-respondwith" /* SERVICE_WORKER_RESPOND_WITH */,
  "serviceworker-routerevaluation" /* SERVICE_WORKER_ROUTER_EVALUATION */,
  "serviceworker-cachelookup" /* SERVICE_WORKER_CACHE_LOOKUP */
]);
export const ConnectionSetupRangeNames = /* @__PURE__ */ new Set([
  "queueing" /* QUEUEING */,
  "blocking" /* BLOCKING */,
  "connecting" /* CONNECTING */,
  "dns" /* DNS */,
  "proxy" /* PROXY */,
  "ssl" /* SSL */
]);
export function calculateRequestTimeRanges(request, navigationStart) {
  const result = [];
  function addRange(name, start, end) {
    if (start < Number.MAX_VALUE && start <= end) {
      result.push({ name, start, end });
    }
  }
  function firstPositive(numbers) {
    for (let i = 0; i < numbers.length; ++i) {
      if (numbers[i] > 0) {
        return numbers[i];
      }
    }
    return void 0;
  }
  function addOffsetRange(name, start, end) {
    if (start >= 0 && end >= 0) {
      addRange(name, startTime + start / 1e3, startTime + end / 1e3);
    }
  }
  function addMaybeNegativeOffsetRange(name, start, end) {
    addRange(name, startTime + start / 1e3, startTime + end / 1e3);
  }
  const timing = request.timing;
  if (!timing) {
    const start = request.issueTime() !== -1 ? request.issueTime() : request.startTime !== -1 ? request.startTime : 0;
    const hasDifferentIssueAndStartTime = request.issueTime() !== -1 && request.startTime !== -1 && request.issueTime() !== request.startTime;
    const middle = request.responseReceivedTime === -1 ? hasDifferentIssueAndStartTime ? request.startTime : Number.MAX_VALUE : request.responseReceivedTime;
    const end = request.endTime === -1 ? Number.MAX_VALUE : request.endTime;
    addRange("total" /* TOTAL */, start, end);
    addRange("blocking" /* BLOCKING */, start, middle);
    const state = request.responseReceivedTime === -1 ? "connecting" /* CONNECTING */ : "receiving" /* RECEIVING */;
    addRange(state, middle, end);
    return result;
  }
  const issueTime = request.issueTime();
  const startTime = timing.requestTime;
  const endTime = firstPositive([request.endTime, request.responseReceivedTime]) || startTime;
  addRange("total" /* TOTAL */, issueTime < startTime ? issueTime : startTime, endTime);
  if (timing.pushStart) {
    const pushEnd = timing.pushEnd || endTime;
    if (pushEnd > navigationStart) {
      addRange("push" /* PUSH */, Math.max(timing.pushStart, navigationStart), pushEnd);
    }
  }
  if (issueTime < startTime) {
    addRange("queueing" /* QUEUEING */, issueTime, startTime);
  }
  const responseReceived = (request.responseReceivedTime - startTime) * 1e3;
  if (request.fetchedViaServiceWorker) {
    addOffsetRange("blocking" /* BLOCKING */, 0, timing.workerStart);
    addOffsetRange("serviceworker-preparation" /* SERVICE_WORKER_PREPARATION */, timing.workerStart, timing.workerReady);
    addOffsetRange(
      "serviceworker-respondwith" /* SERVICE_WORKER_RESPOND_WITH */,
      timing.workerFetchStart,
      timing.workerRespondWithSettled
    );
    addOffsetRange("serviceworker" /* SERVICE_WORKER */, timing.workerReady, timing.sendEnd);
    addOffsetRange("waiting" /* WAITING */, timing.sendEnd, responseReceived);
  } else if (!timing.pushStart) {
    const blockingEnd = firstPositive([timing.dnsStart, timing.connectStart, timing.sendStart, responseReceived]) || 0;
    addOffsetRange("blocking" /* BLOCKING */, 0, blockingEnd);
    addOffsetRange("proxy" /* PROXY */, timing.proxyStart, timing.proxyEnd);
    addOffsetRange("dns" /* DNS */, timing.dnsStart, timing.dnsEnd);
    addOffsetRange("connecting" /* CONNECTING */, timing.connectStart, timing.connectEnd);
    addOffsetRange("ssl" /* SSL */, timing.sslStart, timing.sslEnd);
    addOffsetRange("sending" /* SENDING */, timing.sendStart, timing.sendEnd);
    addOffsetRange(
      "waiting" /* WAITING */,
      Math.max(timing.sendEnd, timing.connectEnd, timing.dnsEnd, timing.proxyEnd, blockingEnd),
      responseReceived
    );
  }
  const { serviceWorkerRouterInfo } = request;
  if (serviceWorkerRouterInfo) {
    if (timing.workerRouterEvaluationStart) {
      let routerEvaluationEnd = timing.sendStart;
      if (serviceWorkerRouterInfo?.matchedSourceType === Protocol.Network.ServiceWorkerRouterSource.Cache && timing.workerCacheLookupStart) {
        routerEvaluationEnd = timing.workerCacheLookupStart;
      } else if (serviceWorkerRouterInfo?.actualSourceType === Protocol.Network.ServiceWorkerRouterSource.FetchEvent) {
        routerEvaluationEnd = timing.workerStart;
      }
      addMaybeNegativeOffsetRange(
        "serviceworker-routerevaluation" /* SERVICE_WORKER_ROUTER_EVALUATION */,
        timing.workerRouterEvaluationStart,
        routerEvaluationEnd
      );
    }
    if (timing.workerCacheLookupStart) {
      let cacheLookupEnd = timing.sendStart;
      if (serviceWorkerRouterInfo?.actualSourceType === Protocol.Network.ServiceWorkerRouterSource.Cache) {
        cacheLookupEnd = timing.receiveHeadersStart;
      }
      addMaybeNegativeOffsetRange(
        "serviceworker-cachelookup" /* SERVICE_WORKER_CACHE_LOOKUP */,
        timing.workerCacheLookupStart,
        cacheLookupEnd
      );
    }
  }
  if (request.endTime !== -1) {
    addRange(
      timing.pushStart ? "receiving-push" /* RECEIVING_PUSH */ : "receiving" /* RECEIVING */,
      request.responseReceivedTime,
      endTime
    );
  }
  return result;
}
//# sourceMappingURL=RequestTimeRanges.js.map
