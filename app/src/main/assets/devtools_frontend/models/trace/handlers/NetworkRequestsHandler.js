"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Protocol from "../../../generated/protocol.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import * as HandlerHelpers from "./helpers.js";
import { data as metaHandlerData } from "./MetaHandler.js";
const MILLISECONDS_TO_MICROSECONDS = 1e3;
const SECONDS_TO_MICROSECONDS = 1e6;
let webSocketData = /* @__PURE__ */ new Map();
let linkPreconnectEvents = [];
let requestMap = /* @__PURE__ */ new Map();
let requestsById = /* @__PURE__ */ new Map();
let requestsByTime = [];
let requestIdsByURL = /* @__PURE__ */ new Map();
let networkRequestEventByInitiatorUrl = /* @__PURE__ */ new Map();
let eventToInitiatorMap = /* @__PURE__ */ new Map();
let entityMappings = {
  eventsByEntity: /* @__PURE__ */ new Map(),
  entityByEvent: /* @__PURE__ */ new Map(),
  createdEntityCache: /* @__PURE__ */ new Map(),
  entityByUrlCache: /* @__PURE__ */ new Map()
};
function storeTraceEventWithRequestId(requestId, key, value) {
  if (!requestMap.has(requestId)) {
    requestMap.set(requestId, {});
  }
  const traceEvents = requestMap.get(requestId);
  if (!traceEvents) {
    throw new Error(`Unable to locate trace events for request ID ${requestId}`);
  }
  if (Array.isArray(traceEvents[key])) {
    const target = traceEvents[key];
    const values = value;
    target.push(...values);
  } else {
    traceEvents[key] = value;
  }
}
function firstPositiveValueInList(entries) {
  for (const entry of entries) {
    if (entry && entry > 0) {
      return entry;
    }
  }
  return 0;
}
export function reset() {
  requestsById = /* @__PURE__ */ new Map();
  requestMap = /* @__PURE__ */ new Map();
  requestsByTime = [];
  networkRequestEventByInitiatorUrl = /* @__PURE__ */ new Map();
  eventToInitiatorMap = /* @__PURE__ */ new Map();
  webSocketData = /* @__PURE__ */ new Map();
  requestIdsByURL = /* @__PURE__ */ new Map();
  entityMappings = {
    eventsByEntity: /* @__PURE__ */ new Map(),
    entityByEvent: /* @__PURE__ */ new Map(),
    createdEntityCache: /* @__PURE__ */ new Map(),
    entityByUrlCache: /* @__PURE__ */ new Map()
  };
  linkPreconnectEvents = [];
}
export function handleEvent(event) {
  if (Types.Events.isResourceChangePriority(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "changePriority", event);
    return;
  }
  if (Types.Events.isResourceWillSendRequest(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "willSendRequests", [event]);
    return;
  }
  if (Types.Events.isResourceSendRequest(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "sendRequests", [event]);
    return;
  }
  if (Types.Events.isResourceReceiveResponse(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "receiveResponse", event);
    return;
  }
  if (Types.Events.isResourceReceivedData(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "receivedData", [event]);
    return;
  }
  if (Types.Events.isResourceFinish(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "resourceFinish", event);
    return;
  }
  if (Types.Events.isResourceMarkAsCached(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "resourceMarkAsCached", event);
    return;
  }
  if (Types.Events.isPreloadRenderBlockingStatusChangeEvent(event)) {
    storeTraceEventWithRequestId(event.args.data.requestId, "preloadRenderBlockingStatusChange", [event]);
  }
  if (Types.Events.isWebSocketCreate(event) || Types.Events.isWebSocketInfo(event) || Types.Events.isWebSocketTransfer(event)) {
    const identifier = event.args.data.identifier;
    if (!webSocketData.has(identifier)) {
      if (event.args.data.frame) {
        webSocketData.set(identifier, {
          frame: event.args.data.frame,
          webSocketIdentifier: identifier,
          events: [],
          syntheticConnection: null
        });
      } else if (event.args.data.workerId) {
        webSocketData.set(identifier, {
          workerId: event.args.data.workerId,
          webSocketIdentifier: identifier,
          events: [],
          syntheticConnection: null
        });
      }
    }
    webSocketData.get(identifier)?.events.push(event);
  }
  if (Types.Events.isLinkPreconnect(event)) {
    linkPreconnectEvents.push(event);
    return;
  }
}
export async function finalize() {
  const { rendererProcessesByFrame } = metaHandlerData();
  for (const [requestId, request] of requestMap.entries()) {
    if (!request.sendRequests) {
      continue;
    }
    const redirects = [];
    for (let i = 0; i < request.sendRequests.length - 1; i++) {
      const sendRequest = request.sendRequests[i];
      const nextSendRequest = request.sendRequests[i + 1];
      let ts = sendRequest.ts;
      let dur = Types.Timing.Micro(nextSendRequest.ts - sendRequest.ts);
      if (request.willSendRequests?.[i] && request.willSendRequests[i + 1]) {
        const willSendRequest = request.willSendRequests[i];
        const nextWillSendRequest = request.willSendRequests[i + 1];
        ts = willSendRequest.ts;
        dur = Types.Timing.Micro(nextWillSendRequest.ts - willSendRequest.ts);
      }
      redirects.push({
        url: sendRequest.args.data.url,
        priority: sendRequest.args.data.priority,
        requestMethod: sendRequest.args.data.requestMethod,
        ts,
        dur
      });
    }
    const firstSendRequest = request.sendRequests[0];
    const finalSendRequest = request.sendRequests[request.sendRequests.length - 1];
    if (finalSendRequest.args.data.url.startsWith("data:")) {
      continue;
    }
    const isLightrider = globalThis.isLightrider;
    if (isLightrider && request.resourceFinish && request.receiveResponse?.args.data.headers) {
      const lrSizeHeader = request.receiveResponse.args.data.headers.find((h) => h.name === "X-TotalFetchedSize");
      if (lrSizeHeader) {
        const size = parseFloat(lrSizeHeader.value);
        if (!isNaN(size)) {
          request.resourceFinish.args.data.encodedDataLength = size;
        }
      }
    }
    const isPushedResource = request.resourceFinish?.args.data.encodedDataLength !== 0;
    const isDiskCached = !!request.receiveResponse && request.receiveResponse.args.data.fromCache && !request.receiveResponse.args.data.fromServiceWorker && !isPushedResource;
    const isMemoryCached = request.resourceMarkAsCached !== void 0;
    let timing = isMemoryCached ? void 0 : request.receiveResponse?.args.data.timing;
    let lrServerResponseTime;
    if (isLightrider && request.receiveResponse?.args.data.headers) {
      timing = {
        requestTime: Helpers.Timing.microToSeconds(request.sendRequests.at(0)?.ts ?? 0),
        connectEnd: 0,
        connectStart: 0,
        dnsEnd: 0,
        dnsStart: 0,
        proxyEnd: 0,
        proxyStart: 0,
        pushEnd: 0,
        pushStart: 0,
        receiveHeadersEnd: 0,
        receiveHeadersStart: 0,
        sendEnd: 0,
        sendStart: 0,
        sslEnd: 0,
        sslStart: 0,
        workerReady: 0,
        workerStart: 0,
        ...timing
      };
      const TCPMsHeader = request.receiveResponse.args.data.headers.find((h) => h.name === "X-TCPMs");
      const TCPMs = TCPMsHeader ? Math.max(0, parseInt(TCPMsHeader.value, 10)) : 0;
      if (request.receiveResponse.args.data.protocol.startsWith("h3")) {
        timing.connectStart = 0;
        timing.connectEnd = TCPMs;
      } else {
        timing.connectStart = 0;
        timing.sslStart = TCPMs / 2;
        timing.connectEnd = TCPMs;
        timing.sslEnd = TCPMs;
      }
      const ResponseMsHeader = request.receiveResponse.args.data.headers.find((h) => h.name === "X-ResponseMs");
      if (ResponseMsHeader) {
        lrServerResponseTime = Math.max(0, parseInt(ResponseMsHeader.value, 10));
      }
    }
    const allowedProtocols = [
      "blob:",
      "file:",
      "filesystem:",
      "http:",
      "https:"
    ];
    if (!allowedProtocols.some((p) => firstSendRequest.args.data.url.startsWith(p))) {
      continue;
    }
    const initialPriority = finalSendRequest.args.data.priority;
    let finalPriority = initialPriority;
    if (request.changePriority) {
      finalPriority = request.changePriority.args.data.priority;
    }
    const startTime = request.willSendRequests?.length ? Types.Timing.Micro(request.willSendRequests[0].ts) : Types.Timing.Micro(firstSendRequest.ts);
    const endRedirectTime = request.willSendRequests?.length ? Types.Timing.Micro(request.willSendRequests[request.willSendRequests.length - 1].ts) : Types.Timing.Micro(finalSendRequest.ts);
    const endTime = request.resourceFinish ? request.resourceFinish.ts : endRedirectTime;
    const finishTime = request.resourceFinish?.args.data.finishTime ? Types.Timing.Micro(request.resourceFinish.args.data.finishTime * SECONDS_TO_MICROSECONDS) : Types.Timing.Micro(endTime);
    const networkDuration = Types.Timing.Micro(timing ? (finishTime || endRedirectTime) - endRedirectTime : 0);
    const processingDuration = Types.Timing.Micro(endTime - (finishTime || endTime));
    const redirectionDuration = Types.Timing.Micro(endRedirectTime - startTime);
    const queueingFromTraceData = timing ? timing.requestTime * SECONDS_TO_MICROSECONDS - endRedirectTime : 0;
    const queueing = Types.Timing.Micro(Platform.NumberUtilities.clamp(queueingFromTraceData, 0, Number.MAX_VALUE));
    const stalled = timing ? Types.Timing.Micro(firstPositiveValueInList([
      timing.dnsStart * MILLISECONDS_TO_MICROSECONDS,
      timing.connectStart * MILLISECONDS_TO_MICROSECONDS,
      timing.sendStart * MILLISECONDS_TO_MICROSECONDS,
      request.receiveResponse ? request.receiveResponse.ts - endRedirectTime : null
    ])) : request.receiveResponse ? Types.Timing.Micro(request.receiveResponse.ts - startTime) : Types.Timing.Micro(0);
    const sendStartTime = timing ? Types.Timing.Micro(
      timing.requestTime * SECONDS_TO_MICROSECONDS + timing.sendStart * MILLISECONDS_TO_MICROSECONDS
    ) : startTime;
    const waiting = timing ? Types.Timing.Micro((timing.receiveHeadersEnd - timing.sendEnd) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const serverResponseTime = timing ? Types.Timing.Micro(
      ((timing.receiveHeadersStart ?? timing.receiveHeadersEnd) - timing.sendEnd) * MILLISECONDS_TO_MICROSECONDS
    ) : Types.Timing.Micro(0);
    const downloadStart = timing ? Types.Timing.Micro(
      timing.requestTime * SECONDS_TO_MICROSECONDS + timing.receiveHeadersEnd * MILLISECONDS_TO_MICROSECONDS
    ) : startTime;
    const download = timing ? Types.Timing.Micro((finishTime || downloadStart) - downloadStart) : request.receiveResponse ? Types.Timing.Micro(endTime - request.receiveResponse.ts) : Types.Timing.Micro(0);
    const totalTime = Types.Timing.Micro(networkDuration + processingDuration);
    const dnsLookup = timing ? Types.Timing.Micro((timing.dnsEnd - timing.dnsStart) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const ssl = timing ? Types.Timing.Micro((timing.sslEnd - timing.sslStart) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const proxyNegotiation = timing ? Types.Timing.Micro((timing.proxyEnd - timing.proxyStart) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const requestSent = timing ? Types.Timing.Micro((timing.sendEnd - timing.sendStart) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const initialConnection = timing ? Types.Timing.Micro((timing.connectEnd - timing.connectStart) * MILLISECONDS_TO_MICROSECONDS) : Types.Timing.Micro(0);
    const { frame, url, renderBlocking: sendRequestIsRenderBlocking } = finalSendRequest.args.data;
    const { encodedDataLength, decodedBodyLength } = request.resourceFinish ? request.resourceFinish.args.data : { encodedDataLength: 0, decodedBodyLength: 0 };
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const requestingFrameUrl = Helpers.Trace.activeURLForFrameAtTime(frame, finalSendRequest.ts, rendererProcessesByFrame) || "";
    const preloadRenderBlockingStatusChange = request.preloadRenderBlockingStatusChange?.at(-1)?.args.data.renderBlocking;
    const isRenderBlocking = preloadRenderBlockingStatusChange ?? sendRequestIsRenderBlocking ?? "non_blocking";
    const networkEvent = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
      rawSourceEvent: finalSendRequest,
      args: {
        data: {
          // All data we create from trace events should be added to |syntheticData|.
          syntheticData: {
            dnsLookup,
            download,
            downloadStart,
            finishTime,
            initialConnection,
            isDiskCached,
            isHttps,
            isMemoryCached,
            isPushedResource,
            networkDuration,
            processingDuration,
            proxyNegotiation,
            queueing,
            redirectionDuration,
            requestSent,
            sendStartTime,
            ssl,
            stalled,
            totalTime,
            waiting,
            serverResponseTime
          },
          // All fields below are from TraceEventsForNetworkRequest.
          decodedBodyLength,
          encodedDataLength,
          frame,
          fromServiceWorker: request.receiveResponse?.args.data.fromServiceWorker,
          isLinkPreload: finalSendRequest.args.data.isLinkPreload || false,
          mimeType: request.receiveResponse?.args.data.mimeType ?? "",
          priority: finalPriority,
          initialPriority,
          protocol: request.receiveResponse?.args.data.protocol ?? "unknown",
          redirects,
          renderBlocking: isRenderBlocking,
          requestId,
          requestingFrameUrl,
          requestMethod: finalSendRequest.args.data.requestMethod,
          resourceType: finalSendRequest.args.data.resourceType ?? Protocol.Network.ResourceType.Other,
          statusCode: request.receiveResponse?.args.data.statusCode ?? 0,
          responseHeaders: request.receiveResponse?.args.data.headers ?? null,
          fetchPriorityHint: finalSendRequest.args.data.fetchPriorityHint ?? "auto",
          initiator: finalSendRequest.args.data.initiator,
          stackTrace: finalSendRequest.args.data.stackTrace,
          timing,
          lrServerResponseTime,
          url,
          failed: request.resourceFinish?.args.data.didFail ?? false,
          finished: Boolean(request.resourceFinish),
          hasResponse: Boolean(request.receiveResponse),
          connectionId: request.receiveResponse?.args.data.connectionId,
          connectionReused: request.receiveResponse?.args.data.connectionReused
        }
      },
      cat: "loading",
      name: Types.Events.Name.SYNTHETIC_NETWORK_REQUEST,
      ph: Types.Events.Phase.COMPLETE,
      dur: Types.Timing.Micro(endTime - startTime),
      tdur: Types.Timing.Micro(endTime - startTime),
      ts: Types.Timing.Micro(startTime),
      tts: Types.Timing.Micro(startTime),
      pid: finalSendRequest.pid,
      tid: finalSendRequest.tid
    });
    requestsByTime.push(networkEvent);
    requestsById.set(networkEvent.args.data.requestId, networkEvent);
    const requestsForUrl = requestIdsByURL.get(networkEvent.args.data.url) ?? [];
    requestsForUrl.push(networkEvent.args.data.requestId);
    requestIdsByURL.set(networkEvent.args.data.url, requestsForUrl);
    HandlerHelpers.addNetworkRequestToEntityMapping(networkEvent, entityMappings, request);
    const initiatorUrl = networkEvent.args.data.initiator?.url || Helpers.Trace.getStackTraceTopCallFrameInEventPayload(networkEvent)?.url;
    if (initiatorUrl) {
      const events = networkRequestEventByInitiatorUrl.get(initiatorUrl) ?? [];
      events.push(networkEvent);
      networkRequestEventByInitiatorUrl.set(initiatorUrl, events);
    }
  }
  for (const request of requestsByTime) {
    const initiatedEvents = networkRequestEventByInitiatorUrl.get(request.args.data.url);
    if (initiatedEvents) {
      for (const initiatedEvent of initiatedEvents) {
        eventToInitiatorMap.set(initiatedEvent, request);
      }
    }
  }
  finalizeWebSocketData();
}
export function data() {
  return {
    byId: requestsById,
    byTime: requestsByTime,
    requestIdsByURL,
    incompleteInitiator: eventToInitiatorMap,
    webSocket: [...webSocketData.values()],
    entityMappings: {
      entityByEvent: entityMappings.entityByEvent,
      eventsByEntity: entityMappings.eventsByEntity,
      createdEntityCache: entityMappings.createdEntityCache,
      entityByUrlCache: entityMappings.entityByUrlCache
    },
    linkPreconnectEvents
  };
}
export function deps() {
  return ["Meta"];
}
function finalizeWebSocketData() {
  webSocketData.forEach((data2) => {
    let startEvent = null;
    let endEvent = null;
    for (const event of data2.events) {
      if (Types.Events.isWebSocketCreate(event)) {
        startEvent = event;
      }
      if (Types.Events.isWebSocketDestroy(event)) {
        endEvent = event;
      }
    }
    data2.syntheticConnection = createSyntheticWebSocketConnection(startEvent, endEvent, data2.events[0]);
  });
}
function createSyntheticWebSocketConnection(startEvent, endEvent, firstRecordedEvent) {
  const { traceBounds } = metaHandlerData();
  const startTs = startEvent ? startEvent.ts : traceBounds.min;
  const endTs = endEvent ? endEvent.ts : traceBounds.max;
  const duration = endTs - startTs;
  const mainEvent = startEvent || endEvent || firstRecordedEvent;
  return {
    name: "SyntheticWebSocketConnection",
    cat: mainEvent.cat,
    ph: Types.Events.Phase.COMPLETE,
    ts: startTs,
    dur: duration,
    pid: mainEvent.pid,
    tid: mainEvent.tid,
    s: mainEvent.s,
    rawSourceEvent: mainEvent,
    _tag: "SyntheticEntryTag",
    args: {
      data: {
        identifier: mainEvent.args.data.identifier,
        priority: Protocol.Network.ResourcePriority.Low,
        url: mainEvent.args.data.url || ""
      }
    }
  };
}
//# sourceMappingURL=NetworkRequestsHandler.js.map
