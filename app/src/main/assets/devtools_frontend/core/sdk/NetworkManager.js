"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as Common from "../common/common.js";
import * as i18n from "../i18n/i18n.js";
import * as Platform from "../platform/platform.js";
import * as Root from "../root/root.js";
import { Cookie } from "./Cookie.js";
import {
  DirectSocketChunkType,
  DirectSocketStatus,
  DirectSocketType,
  Events as NetworkRequestEvents,
  NetworkRequest
} from "./NetworkRequest.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
import { TargetManager } from "./TargetManager.js";
const UIStrings = {
  /**
   * @description Explanation why no content is shown for WebSocket connection.
   */
  noContentForWebSocket: "Content for WebSockets is currently not supported",
  /**
   * @description Explanation why no content is shown for redirect response.
   */
  noContentForRedirect: "No content available because this request was redirected",
  /**
   * @description Explanation why no content is shown for preflight request.
   */
  noContentForPreflight: "No content available for preflight request",
  /**
   * @description Text to indicate that network throttling is disabled
   */
  noThrottling: "No throttling",
  /**
   * @description Text to indicate the network connectivity is offline
   */
  offline: "Offline",
  /**
   * @description Text in Network Manager representing the "3G" throttling preset.
   */
  slowG: "3G",
  // Named `slowG` for legacy reasons and because this value
  // is serialized locally on the user's machine: if we
  // change it we break their stored throttling settings.
  // (See crrev.com/c/2947255)
  /**
   * @description Text in Network Manager representing the "Slow 4G" throttling preset
   */
  fastG: "Slow 4G",
  // Named `fastG` for legacy reasons and because this value
  // is serialized locally on the user's machine: if we
  // change it we break their stored throttling settings.
  // (See crrev.com/c/2947255)
  /**
   * @description Text in Network Manager representing the "Fast 4G" throttling preset
   */
  fast4G: "Fast 4G",
  /**
   * @description Text in Network Manager representing the "Blocking" throttling preset
   */
  block: "Block",
  /**
   * @description Text in Network Manager
   * @example {https://example.com} PH1
   */
  requestWasBlockedByDevtoolsS: 'Request was blocked by DevTools: "{PH1}"',
  /**
   * @description Message in Network Manager
   * @example {XHR} PH1
   * @example {GET} PH2
   * @example {https://example.com} PH3
   */
  sFailedLoadingSS: '{PH1} failed loading: {PH2} "{PH3}".',
  /**
   * @description Message in Network Manager
   * @example {XHR} PH1
   * @example {GET} PH2
   * @example {https://example.com} PH3
   */
  sFinishedLoadingSS: '{PH1} finished loading: {PH2} "{PH3}".',
  /**
   * @description One of direct socket connection statuses
   */
  directSocketStatusOpening: "Opening",
  /**
   * @description One of direct socket connection statuses
   */
  directSocketStatusOpen: "Open",
  /**
   * @description One of direct socket connection statuses
   */
  directSocketStatusClosed: "Closed",
  /**
   * @description One of direct socket connection statuses
   */
  directSocketStatusAborted: "Aborted"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/NetworkManager.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
const requestToManagerMap = /* @__PURE__ */ new WeakMap();
const CONNECTION_TYPES = /* @__PURE__ */ new Map([
  ["2g", Protocol.Network.ConnectionType.Cellular2g],
  ["3g", Protocol.Network.ConnectionType.Cellular3g],
  ["4g", Protocol.Network.ConnectionType.Cellular4g],
  ["bluetooth", Protocol.Network.ConnectionType.Bluetooth],
  ["wifi", Protocol.Network.ConnectionType.Wifi],
  ["wimax", Protocol.Network.ConnectionType.Wimax]
]);
export function customUserNetworkConditionsSetting() {
  return Common.Settings.Settings.instance().moduleSetting("custom-network-conditions");
}
export function activeNetworkThrottlingKeySetting() {
  return Common.Settings.Settings.instance().createSetting(
    "active-network-condition-key",
    "NO_THROTTLING" /* NO_THROTTLING */
  );
}
export class NetworkManager extends SDKModel {
  dispatcher;
  fetchDispatcher;
  #networkAgent;
  #bypassServiceWorkerSetting;
  activeNetworkThrottlingKey = activeNetworkThrottlingKeySetting();
  constructor(target) {
    super(target);
    this.dispatcher = new NetworkDispatcher(this);
    this.fetchDispatcher = new FetchDispatcher(target.fetchAgent(), this);
    this.#networkAgent = target.networkAgent();
    target.registerNetworkDispatcher(this.dispatcher);
    target.registerFetchDispatcher(this.fetchDispatcher);
    if (Common.Settings.Settings.instance().moduleSetting("cache-disabled").get()) {
      void this.#networkAgent.invoke_setCacheDisabled({ cacheDisabled: true });
    }
    void this.#networkAgent.invoke_enable({
      maxPostDataSize: MAX_EAGER_POST_REQUEST_BODY_LENGTH,
      enableDurableMessages: Root.Runtime.hostConfig.devToolsEnableDurableMessages?.enabled,
      maxTotalBufferSize: MAX_RESPONSE_BODY_TOTAL_BUFFER_LENGTH,
      reportDirectSocketTraffic: true
    });
    void this.#networkAgent.invoke_setAttachDebugStack({ enabled: true });
    this.#bypassServiceWorkerSetting = Common.Settings.Settings.instance().createSetting("bypass-service-worker", false);
    if (this.#bypassServiceWorkerSetting.get()) {
      this.bypassServiceWorkerChanged();
    }
    this.#bypassServiceWorkerSetting.addChangeListener(this.bypassServiceWorkerChanged, this);
    Common.Settings.Settings.instance().moduleSetting("cache-disabled").addChangeListener(this.cacheDisabledSettingChanged, this);
  }
  static forRequest(request) {
    return requestToManagerMap.get(request) || null;
  }
  static canReplayRequest(request) {
    return Boolean(requestToManagerMap.get(request)) && Boolean(request.backendRequestId()) && !request.isRedirect() && request.resourceType() === Common.ResourceType.resourceTypes.XHR;
  }
  static replayRequest(request) {
    const manager = requestToManagerMap.get(request);
    const requestId = request.backendRequestId();
    if (!manager || !requestId || request.isRedirect()) {
      return;
    }
    void manager.#networkAgent.invoke_replayXHR({ requestId });
  }
  static async searchInRequest(request, query, caseSensitive, isRegex) {
    const manager = NetworkManager.forRequest(request);
    const requestId = request.backendRequestId();
    if (!manager || !requestId || request.isRedirect()) {
      return [];
    }
    const response = await manager.#networkAgent.invoke_searchInResponseBody({ requestId, query, caseSensitive, isRegex });
    return TextUtils.TextUtils.performSearchInSearchMatches(response.result || [], query, caseSensitive, isRegex);
  }
  static async requestContentData(request) {
    if (request.resourceType() === Common.ResourceType.resourceTypes.WebSocket) {
      return { error: i18nString(UIStrings.noContentForWebSocket) };
    }
    if (!request.finished) {
      await request.once(NetworkRequestEvents.FINISHED_LOADING);
    }
    if (request.isRedirect()) {
      return { error: i18nString(UIStrings.noContentForRedirect) };
    }
    if (request.isPreflightRequest()) {
      return { error: i18nString(UIStrings.noContentForPreflight) };
    }
    const manager = NetworkManager.forRequest(request);
    if (!manager) {
      return { error: "No network manager for request" };
    }
    const requestId = request.backendRequestId();
    if (!requestId) {
      return { error: "No backend request id for request" };
    }
    const response = await manager.#networkAgent.invoke_getResponseBody({ requestId });
    const error = response.getError();
    if (error) {
      return { error };
    }
    return new TextUtils.ContentData.ContentData(
      response.body,
      response.base64Encoded,
      request.mimeType,
      request.charset() ?? void 0
    );
  }
  /**
   * Returns the already received bytes for an in-flight request. After calling this method
   * "dataReceived" events will contain additional data.
   */
  static async streamResponseBody(request) {
    if (request.finished) {
      return { error: "Streaming the response body is only available for in-flight requests." };
    }
    const manager = NetworkManager.forRequest(request);
    if (!manager) {
      return { error: "No network manager for request" };
    }
    const requestId = request.backendRequestId();
    if (!requestId) {
      return { error: "No backend request id for request" };
    }
    const response = await manager.#networkAgent.invoke_streamResourceContent({ requestId });
    const error = response.getError();
    if (error) {
      return { error };
    }
    await request.waitForResponseReceived();
    return new TextUtils.ContentData.ContentData(
      response.bufferedData,
      /* isBase64=*/
      true,
      request.mimeType,
      request.charset() ?? void 0
    );
  }
  static async requestPostData(request) {
    const manager = NetworkManager.forRequest(request);
    if (!manager) {
      console.error("No network manager for request");
      return null;
    }
    const requestId = request.backendRequestId();
    if (!requestId) {
      console.error("No backend request id for request");
      return null;
    }
    try {
      const { postData, base64Encoded } = await manager.#networkAgent.invoke_getRequestPostData({ requestId });
      if (base64Encoded && postData) {
        const binaryString = window.atob(postData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const requestContentType = request.requestContentType();
        const charset = requestContentType ? Platform.MimeType.parseContentType(requestContentType).charset ?? "utf-8" : "utf-8";
        const contentEncoding = request.requestContentEncoding()?.toLowerCase();
        if (contentEncoding) {
          const decompressed = await NetworkManager.#tryDecompressBody(bytes.buffer, contentEncoding, charset);
          if (decompressed !== null) {
            return decompressed;
          }
        }
        return new TextDecoder(charset).decode(bytes);
      }
      return postData;
    } catch (e) {
      return e.message;
    }
  }
  /**
   * Attempts to decompress a compressed request body.
   * Returns the decompressed string, or null if decompression is not applicable.
   */
  static async #tryDecompressBody(buffer, encoding, charset) {
    try {
      if (encoding.includes("gzip") && Common.Gzip.isGzip(buffer)) {
        return await Common.Gzip.decompress(buffer, charset);
      }
      if (encoding.includes("deflate")) {
        return await Common.Gzip.decompressDeflate(buffer, charset);
      }
    } catch (e) {
      console.warn("Failed to decompress request body:", e);
    }
    return null;
  }
  static connectionType(conditions) {
    if (!conditions.download && !conditions.upload) {
      return Protocol.Network.ConnectionType.None;
    }
    try {
      const title = typeof conditions.title === "function" ? conditions.title().toLowerCase() : conditions.title.toLowerCase();
      for (const [name, protocolType] of CONNECTION_TYPES) {
        if (title.includes(name)) {
          return protocolType;
        }
      }
    } catch {
      return Protocol.Network.ConnectionType.None;
    }
    return Protocol.Network.ConnectionType.Other;
  }
  static lowercaseHeaders(headers) {
    const newHeaders = {};
    for (const headerName in headers) {
      newHeaders[headerName.toLowerCase()] = headers[headerName];
    }
    return newHeaders;
  }
  requestForURL(url) {
    return this.dispatcher.requestForURL(url);
  }
  requestForId(id) {
    return this.dispatcher.requestForId(id);
  }
  requestForLoaderId(loaderId) {
    return this.dispatcher.requestForLoaderId(loaderId);
  }
  cacheDisabledSettingChanged({ data: enabled }) {
    void this.#networkAgent.invoke_setCacheDisabled({ cacheDisabled: enabled });
  }
  dispose() {
    Common.Settings.Settings.instance().moduleSetting("cache-disabled").removeChangeListener(this.cacheDisabledSettingChanged, this);
  }
  bypassServiceWorkerChanged() {
    void this.#networkAgent.invoke_setBypassServiceWorker({ bypass: this.#bypassServiceWorkerSetting.get() });
  }
  async getSecurityIsolationStatus(frameId) {
    const result = await this.#networkAgent.invoke_getSecurityIsolationStatus({ frameId: frameId ?? void 0 });
    if (result.getError()) {
      return null;
    }
    return result.status;
  }
  async enableReportingApi(enable = true) {
    return await this.#networkAgent.invoke_enableReportingApi({ enable });
  }
  async enableDeviceBoundSessions(enable = true) {
    return await this.#networkAgent.invoke_enableDeviceBoundSessions({ enable });
  }
  async loadNetworkResource(frameId, url, options) {
    const result = await this.#networkAgent.invoke_loadNetworkResource({ frameId: frameId ?? void 0, url, options });
    if (result.getError()) {
      throw new Error(result.getError());
    }
    return result.resource;
  }
  clearRequests() {
    this.dispatcher.clearRequests();
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["RequestStarted"] = "RequestStarted";
  Events2["RequestUpdated"] = "RequestUpdated";
  Events2["RequestFinished"] = "RequestFinished";
  Events2["RequestUpdateDropped"] = "RequestUpdateDropped";
  Events2["ResponseReceived"] = "ResponseReceived";
  Events2["MessageGenerated"] = "MessageGenerated";
  Events2["RequestRedirected"] = "RequestRedirected";
  Events2["LoadingFinished"] = "LoadingFinished";
  Events2["ReportingApiReportAdded"] = "ReportingApiReportAdded";
  Events2["ReportingApiReportUpdated"] = "ReportingApiReportUpdated";
  Events2["ReportingApiEndpointsChangedForOrigin"] = "ReportingApiEndpointsChangedForOrigin";
  Events2["DeviceBoundSessionsAdded"] = "DeviceBoundSessionsAdded";
  Events2["DeviceBoundSessionEventOccurred"] = "DeviceBoundSessionEventOccurred";
  return Events2;
})(Events || {});
export const BlockingConditions = {
  key: "BLOCKING" /* BLOCKING */,
  block: true,
  title: i18nLazyString(UIStrings.block)
};
export const NoThrottlingConditions = {
  key: "NO_THROTTLING" /* NO_THROTTLING */,
  title: i18nLazyString(UIStrings.noThrottling),
  i18nTitleKey: UIStrings.noThrottling,
  download: -1,
  upload: -1,
  latency: 0
};
export const OfflineConditions = {
  key: "OFFLINE" /* OFFLINE */,
  title: i18nLazyString(UIStrings.offline),
  i18nTitleKey: UIStrings.offline,
  download: 0,
  upload: 0,
  latency: 0
};
const slow3GTargetLatency = 400;
export const Slow3GConditions = {
  key: "SPEED_3G" /* SPEED_3G */,
  title: i18nLazyString(UIStrings.slowG),
  i18nTitleKey: UIStrings.slowG,
  // ~500Kbps down
  download: 500 * 1e3 / 8 * 0.8,
  // ~500Kbps up
  upload: 500 * 1e3 / 8 * 0.8,
  // 400ms RTT
  latency: slow3GTargetLatency * 5,
  targetLatency: slow3GTargetLatency
};
const slow4GTargetLatency = 150;
export const Slow4GConditions = {
  key: "SPEED_SLOW_4G" /* SPEED_SLOW_4G */,
  title: i18nLazyString(UIStrings.fastG),
  i18nTitleKey: UIStrings.fastG,
  // ~1.6 Mbps down
  download: 1.6 * 1e3 * 1e3 / 8 * 0.9,
  // ~0.75 Mbps up
  upload: 750 * 1e3 / 8 * 0.9,
  // 150ms RTT
  latency: slow4GTargetLatency * 3.75,
  targetLatency: slow4GTargetLatency
};
const fast4GTargetLatency = 60;
export const Fast4GConditions = {
  key: "SPEED_FAST_4G" /* SPEED_FAST_4G */,
  title: i18nLazyString(UIStrings.fast4G),
  i18nTitleKey: UIStrings.fast4G,
  // 9 Mbps down
  download: 9 * 1e3 * 1e3 / 8 * 0.9,
  // 1.5 Mbps up
  upload: 1.5 * 1e3 * 1e3 / 8 * 0.9,
  // 60ms RTT
  latency: fast4GTargetLatency * 2.75,
  targetLatency: fast4GTargetLatency
};
const MAX_EAGER_POST_REQUEST_BODY_LENGTH = 64 * 1024;
const MAX_RESPONSE_BODY_TOTAL_BUFFER_LENGTH = 250 * 1024 * 1024;
export class FetchDispatcher {
  #fetchAgent;
  #manager;
  constructor(agent, manager) {
    this.#fetchAgent = agent;
    this.#manager = manager;
  }
  requestPaused({ requestId, request, resourceType, responseStatusCode, responseHeaders, networkId }) {
    const networkRequest = networkId ? this.#manager.requestForId(networkId) : null;
    if (networkRequest?.originalResponseHeaders.length === 0 && responseHeaders) {
      networkRequest.originalResponseHeaders = responseHeaders;
    }
    void MultitargetNetworkManager.instance().requestIntercepted(new InterceptedRequest(
      this.#fetchAgent,
      request,
      resourceType,
      requestId,
      networkRequest,
      responseStatusCode,
      responseHeaders
    ));
  }
  authRequired({}) {
  }
}
export class NetworkDispatcher {
  #manager;
  #requestsById = /* @__PURE__ */ new Map();
  #requestsByURL = /* @__PURE__ */ new Map();
  #requestsByLoaderId = /* @__PURE__ */ new Map();
  #requestIdToExtraInfoBuilder = /* @__PURE__ */ new Map();
  /**
   * In case of an early abort or a cache hit, the Trust Token done event is
   * reported before the request itself is created in `requestWillBeSent`.
   * This causes the event to be lost as no `NetworkRequest` instance has been
   * created yet.
   * This map caches the events temporarily and populates the NetworkRequest
   * once it is created in `requestWillBeSent`.
   */
  #requestIdToTrustTokenEvent = /* @__PURE__ */ new Map();
  constructor(manager) {
    this.#manager = manager;
    MultitargetNetworkManager.instance().addEventListener(
      MultitargetNetworkManager.Events.REQUEST_INTERCEPTED,
      this.#markAsIntercepted.bind(this)
    );
  }
  #markAsIntercepted(event) {
    const request = this.requestForId(event.data);
    if (request) {
      request.setWasIntercepted(true);
    }
  }
  headersMapToHeadersArray(headersMap) {
    const result = [];
    for (const name in headersMap) {
      const values = headersMap[name].split("\n");
      for (let i = 0; i < values.length; ++i) {
        result.push({ name, value: values[i] });
      }
    }
    return result;
  }
  updateNetworkRequestWithRequest(networkRequest, request) {
    networkRequest.requestMethod = request.method;
    networkRequest.setRequestHeaders(this.headersMapToHeadersArray(request.headers));
    const isCompressed = Boolean(networkRequest.requestContentEncoding());
    networkRequest.setRequestFormData(Boolean(request.hasPostData), isCompressed ? null : request.postData || null);
    networkRequest.setInitialPriority(request.initialPriority);
    networkRequest.mixedContentType = request.mixedContentType || Protocol.Security.MixedContentType.None;
    networkRequest.setReferrerPolicy(request.referrerPolicy);
    networkRequest.setIsSameSite(request.isSameSite || false);
    networkRequest.setIsAdRelated(request.isAdRelated || false);
  }
  updateNetworkRequestWithResponse(networkRequest, response) {
    if (response.url && networkRequest.url() !== response.url) {
      networkRequest.setUrl(response.url);
    }
    networkRequest.mimeType = response.mimeType;
    networkRequest.setCharset(response.charset);
    if (!networkRequest.statusCode || networkRequest.wasIntercepted()) {
      networkRequest.statusCode = response.status;
    }
    if (!networkRequest.statusText || networkRequest.wasIntercepted()) {
      networkRequest.statusText = response.statusText;
    }
    if (!networkRequest.hasExtraResponseInfo() || networkRequest.wasIntercepted()) {
      networkRequest.responseHeaders = this.headersMapToHeadersArray(response.headers);
    }
    if (response.encodedDataLength >= 0) {
      networkRequest.setTransferSize(response.encodedDataLength);
    }
    if (response.requestHeaders && !networkRequest.hasExtraRequestInfo()) {
      networkRequest.setRequestHeaders(this.headersMapToHeadersArray(response.requestHeaders));
      networkRequest.setRequestHeadersText(response.requestHeadersText || "");
    }
    networkRequest.connectionReused = response.connectionReused;
    networkRequest.connectionId = String(response.connectionId);
    if (response.remoteIPAddress) {
      networkRequest.setRemoteAddress(response.remoteIPAddress, response.remotePort || -1);
    }
    if (response.fromServiceWorker) {
      networkRequest.fetchedViaServiceWorker = true;
    }
    if (response.fromDiskCache) {
      networkRequest.setFromDiskCache();
    }
    if (response.fromPrefetchCache) {
      networkRequest.setFromPrefetchCache();
    }
    if (response.fromEarlyHints) {
      networkRequest.setFromEarlyHints();
    }
    if (response.cacheStorageCacheName) {
      networkRequest.setResponseCacheStorageCacheName(response.cacheStorageCacheName);
    }
    if (response.serviceWorkerRouterInfo) {
      networkRequest.serviceWorkerRouterInfo = response.serviceWorkerRouterInfo;
    }
    if (response.responseTime) {
      networkRequest.setResponseRetrievalTime(new Date(response.responseTime));
    }
    networkRequest.timing = response.timing;
    networkRequest.protocol = response.protocol || "";
    networkRequest.alternateProtocolUsage = response.alternateProtocolUsage;
    if (response.serviceWorkerResponseSource) {
      networkRequest.setServiceWorkerResponseSource(response.serviceWorkerResponseSource);
    }
    networkRequest.setSecurityState(response.securityState);
    if (response.securityDetails) {
      networkRequest.setSecurityDetails(response.securityDetails);
    }
    const newResourceType = Common.ResourceType.ResourceType.fromMimeTypeOverride(networkRequest.mimeType);
    if (newResourceType) {
      networkRequest.setResourceType(newResourceType);
    }
    if (networkRequest.responseReceivedPromiseResolve) {
      networkRequest.responseReceivedPromiseResolve();
    } else {
      networkRequest.responseReceivedPromise = Promise.resolve();
    }
  }
  requestForId(id) {
    return this.#requestsById.get(id) || null;
  }
  requestForURL(url) {
    return this.#requestsByURL.get(url) || null;
  }
  requestForLoaderId(loaderId) {
    return this.#requestsByLoaderId.get(loaderId) || null;
  }
  resourceChangedPriority({ requestId, newPriority }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (networkRequest) {
      networkRequest.setPriority(newPriority);
    }
  }
  signedExchangeReceived({ requestId, info }) {
    let networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      networkRequest = this.#requestsByURL.get(info.outerResponse.url);
      if (!networkRequest) {
        return;
      }
      const backendRequestId = networkRequest.backendRequestId() || requestId;
      requestId = backendRequestId;
    }
    networkRequest.setSignedExchangeInfo(info);
    networkRequest.setResourceType(Common.ResourceType.resourceTypes.SignedExchange);
    this.updateNetworkRequestWithResponse(networkRequest, info.outerResponse);
    this.updateNetworkRequest(networkRequest);
    this.getExtraInfoBuilder(requestId).addHasExtraInfo(info.hasExtraInfo);
    this.#manager.dispatchEventToListeners(
      "ResponseReceived" /* ResponseReceived */,
      { request: networkRequest, response: info.outerResponse }
    );
  }
  requestWillBeSent({
    requestId,
    loaderId,
    documentURL,
    request,
    timestamp,
    wallTime,
    initiator,
    redirectHasExtraInfo,
    redirectResponse,
    type,
    frameId,
    hasUserGesture,
    renderBlockingBehavior
  }) {
    let networkRequest = this.#requestsById.get(requestId);
    if (networkRequest) {
      if (!redirectResponse) {
        return;
      }
      if (!networkRequest.signedExchangeInfo()) {
        this.responseReceived({
          requestId,
          loaderId,
          timestamp,
          type: type || Protocol.Network.ResourceType.Other,
          response: redirectResponse,
          hasExtraInfo: redirectHasExtraInfo,
          frameId
        });
      }
      networkRequest = this.appendRedirect(requestId, timestamp, request.url);
      this.#manager.dispatchEventToListeners("RequestRedirected" /* RequestRedirected */, networkRequest);
    } else {
      networkRequest = NetworkRequest.create(
        requestId,
        request.url,
        documentURL,
        frameId ?? null,
        loaderId,
        initiator,
        hasUserGesture
      );
      if (renderBlockingBehavior) {
        networkRequest.setRenderBlockingBehavior(renderBlockingBehavior);
      }
      requestToManagerMap.set(networkRequest, this.#manager);
    }
    networkRequest.hasNetworkData = true;
    this.updateNetworkRequestWithRequest(networkRequest, request);
    networkRequest.setIssueTime(timestamp, wallTime);
    networkRequest.setResourceType(
      type ? Common.ResourceType.resourceTypes[type] : Common.ResourceType.resourceTypes.Other
    );
    if (request.trustTokenParams) {
      networkRequest.setTrustTokenParams(request.trustTokenParams);
    }
    const maybeTrustTokenEvent = this.#requestIdToTrustTokenEvent.get(requestId);
    if (maybeTrustTokenEvent) {
      networkRequest.setTrustTokenOperationDoneEvent(maybeTrustTokenEvent);
      this.#requestIdToTrustTokenEvent.delete(requestId);
    }
    this.getExtraInfoBuilder(requestId).addRequest(networkRequest);
    this.startNetworkRequest(networkRequest, request);
  }
  requestServedFromCache({ requestId }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.setFromMemoryCache();
  }
  responseReceived({ requestId, loaderId, timestamp, type, response, hasExtraInfo, frameId }) {
    const networkRequest = this.#requestsById.get(requestId);
    const lowercaseHeaders = NetworkManager.lowercaseHeaders(response.headers);
    if (!networkRequest) {
      const lastModifiedHeader = lowercaseHeaders["last-modified"];
      const eventData = {
        url: response.url,
        frameId: frameId ?? null,
        loaderId,
        resourceType: type,
        mimeType: response.mimeType,
        lastModified: lastModifiedHeader ? new Date(lastModifiedHeader) : null
      };
      this.#manager.dispatchEventToListeners("RequestUpdateDropped" /* RequestUpdateDropped */, eventData);
      return;
    }
    networkRequest.responseReceivedTime = timestamp;
    networkRequest.setResourceType(Common.ResourceType.resourceTypes[type]);
    this.updateNetworkRequestWithResponse(networkRequest, response);
    this.updateNetworkRequest(networkRequest);
    this.getExtraInfoBuilder(requestId).addHasExtraInfo(hasExtraInfo);
    this.#manager.dispatchEventToListeners("ResponseReceived" /* ResponseReceived */, { request: networkRequest, response });
  }
  dataReceived(event) {
    let networkRequest = this.#requestsById.get(event.requestId);
    if (!networkRequest) {
      networkRequest = this.maybeAdoptMainResourceRequest(event.requestId);
    }
    if (!networkRequest) {
      return;
    }
    networkRequest.addDataReceivedEvent(event);
    this.updateNetworkRequest(networkRequest);
  }
  loadingFinished({ requestId, timestamp: finishTime, encodedDataLength }) {
    let networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      networkRequest = this.maybeAdoptMainResourceRequest(requestId);
    }
    if (!networkRequest) {
      return;
    }
    this.getExtraInfoBuilder(requestId).finished();
    this.finishNetworkRequest(networkRequest, finishTime, encodedDataLength);
    this.#manager.dispatchEventToListeners("LoadingFinished" /* LoadingFinished */, networkRequest);
  }
  loadingFailed({
    requestId,
    timestamp: time,
    type: resourceType,
    errorText: localizedDescription,
    canceled,
    blockedReason,
    corsErrorStatus
  }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.failed = true;
    networkRequest.setResourceType(Common.ResourceType.resourceTypes[resourceType]);
    networkRequest.canceled = Boolean(canceled);
    if (blockedReason) {
      networkRequest.setBlockedReason(blockedReason);
      if (blockedReason === Protocol.Network.BlockedReason.Inspector) {
        const message = i18nString(UIStrings.requestWasBlockedByDevtoolsS, { PH1: networkRequest.url() });
        this.#manager.dispatchEventToListeners("MessageGenerated" /* MessageGenerated */, { message, requestId, warning: true });
      }
    }
    if (corsErrorStatus) {
      networkRequest.setCorsErrorStatus(corsErrorStatus);
    }
    networkRequest.localizedFailDescription = localizedDescription;
    this.getExtraInfoBuilder(requestId).finished();
    this.finishNetworkRequest(networkRequest, time, -1);
  }
  webSocketCreated({ requestId, url: requestURL, initiator }) {
    const networkRequest = NetworkRequest.createForSocket(requestId, requestURL, initiator);
    requestToManagerMap.set(networkRequest, this.#manager);
    networkRequest.setResourceType(Common.ResourceType.resourceTypes.WebSocket);
    this.startNetworkRequest(networkRequest, null);
  }
  webSocketWillSendHandshakeRequest({ requestId, timestamp: time, wallTime, request }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.requestMethod = "GET";
    networkRequest.setRequestHeaders(this.headersMapToHeadersArray(request.headers));
    networkRequest.setIssueTime(time, wallTime);
    this.updateNetworkRequest(networkRequest);
  }
  webSocketHandshakeResponseReceived({ requestId, timestamp: time, response }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.statusCode = response.status;
    networkRequest.statusText = response.statusText;
    networkRequest.responseHeaders = this.headersMapToHeadersArray(response.headers);
    networkRequest.responseHeadersText = response.headersText || "";
    if (response.requestHeaders) {
      networkRequest.setRequestHeaders(this.headersMapToHeadersArray(response.requestHeaders));
    }
    if (response.requestHeadersText) {
      networkRequest.setRequestHeadersText(response.requestHeadersText);
    }
    networkRequest.responseReceivedTime = time;
    networkRequest.protocol = "websocket";
    this.updateNetworkRequest(networkRequest);
  }
  webSocketFrameReceived({ requestId, timestamp: time, response }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.addProtocolFrame(response, time, false);
    networkRequest.responseReceivedTime = time;
    this.updateNetworkRequest(networkRequest);
  }
  webSocketFrameSent({ requestId, timestamp: time, response }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.addProtocolFrame(response, time, true);
    networkRequest.responseReceivedTime = time;
    this.updateNetworkRequest(networkRequest);
  }
  webSocketFrameError({ requestId, timestamp: time, errorMessage }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.addProtocolFrameError(errorMessage, time);
    networkRequest.responseReceivedTime = time;
    this.updateNetworkRequest(networkRequest);
  }
  webSocketClosed({ requestId, timestamp: time }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    this.finishNetworkRequest(networkRequest, time, -1);
  }
  eventSourceMessageReceived({ requestId, timestamp: time, eventName, eventId, data }) {
    const networkRequest = this.#requestsById.get(requestId);
    if (!networkRequest) {
      return;
    }
    networkRequest.addEventSourceMessage(time, eventName, eventId, data);
  }
  requestIntercepted({}) {
  }
  requestWillBeSentExtraInfo({
    requestId,
    associatedCookies,
    headers,
    deviceBoundSessionUsages,
    clientSecurityState,
    connectTiming,
    siteHasCookieInOtherPartition,
    appliedNetworkConditionsId
  }) {
    const blockedRequestCookies = [];
    const includedRequestCookies = [];
    for (const { blockedReasons, exemptionReason, cookie } of associatedCookies) {
      if (blockedReasons.length === 0) {
        includedRequestCookies.push({ exemptionReason, cookie: Cookie.fromProtocolCookie(cookie) });
      } else {
        blockedRequestCookies.push({ blockedReasons, cookie: Cookie.fromProtocolCookie(cookie) });
      }
    }
    const extraRequestInfo = {
      blockedRequestCookies,
      includedRequestCookies,
      requestHeaders: this.headersMapToHeadersArray(headers),
      deviceBoundSessionUsages,
      clientSecurityState,
      connectTiming,
      siteHasCookieInOtherPartition,
      appliedNetworkConditionsId
    };
    this.getExtraInfoBuilder(requestId).addRequestExtraInfo(extraRequestInfo);
    const networkRequest = this.#requestsById.get(requestId);
    if (appliedNetworkConditionsId && networkRequest) {
      networkRequest.setAppliedNetworkConditions(appliedNetworkConditionsId);
      this.updateNetworkRequest(networkRequest);
    }
  }
  responseReceivedEarlyHints({
    requestId,
    headers
  }) {
    this.getExtraInfoBuilder(requestId).setEarlyHintsHeaders(this.headersMapToHeadersArray(headers));
  }
  responseReceivedExtraInfo({
    requestId,
    blockedCookies,
    headers,
    headersText,
    resourceIPAddressSpace,
    statusCode,
    cookiePartitionKey,
    cookiePartitionKeyOpaque,
    exemptedCookies
  }) {
    const extraResponseInfo = {
      blockedResponseCookies: blockedCookies.map((blockedCookie) => ({
        blockedReasons: blockedCookie.blockedReasons,
        cookieLine: blockedCookie.cookieLine,
        cookie: blockedCookie.cookie ? Cookie.fromProtocolCookie(blockedCookie.cookie) : null
      })),
      responseHeaders: this.headersMapToHeadersArray(headers),
      responseHeadersText: headersText,
      resourceIPAddressSpace,
      statusCode,
      cookiePartitionKey,
      cookiePartitionKeyOpaque,
      exemptedResponseCookies: exemptedCookies?.map((exemptedCookie) => ({
        cookie: Cookie.fromProtocolCookie(exemptedCookie.cookie),
        cookieLine: exemptedCookie.cookieLine,
        exemptionReason: exemptedCookie.exemptionReason
      }))
    };
    this.getExtraInfoBuilder(requestId).addResponseExtraInfo(extraResponseInfo);
  }
  getExtraInfoBuilder(requestId) {
    let builder;
    if (!this.#requestIdToExtraInfoBuilder.has(requestId)) {
      builder = new ExtraInfoBuilder();
      this.#requestIdToExtraInfoBuilder.set(requestId, builder);
    } else {
      builder = this.#requestIdToExtraInfoBuilder.get(requestId);
    }
    return builder;
  }
  appendRedirect(requestId, time, redirectURL) {
    const originalNetworkRequest = this.#requestsById.get(requestId);
    if (!originalNetworkRequest) {
      throw new Error(`Could not find original network request for ${requestId}`);
    }
    let redirectCount = 0;
    for (let redirect = originalNetworkRequest.redirectSource(); redirect; redirect = redirect.redirectSource()) {
      redirectCount++;
    }
    originalNetworkRequest.markAsRedirect(redirectCount);
    this.finishNetworkRequest(originalNetworkRequest, time, -1);
    const newNetworkRequest = NetworkRequest.create(
      requestId,
      redirectURL,
      originalNetworkRequest.documentURL,
      originalNetworkRequest.frameId,
      originalNetworkRequest.loaderId,
      originalNetworkRequest.initiator(),
      originalNetworkRequest.hasUserGesture() ?? void 0
    );
    requestToManagerMap.set(newNetworkRequest, this.#manager);
    newNetworkRequest.setRedirectSource(originalNetworkRequest);
    originalNetworkRequest.setRedirectDestination(newNetworkRequest);
    return newNetworkRequest;
  }
  maybeAdoptMainResourceRequest(requestId) {
    const request = MultitargetNetworkManager.instance().inflightMainResourceRequests.get(requestId);
    if (!request) {
      return null;
    }
    const oldDispatcher = NetworkManager.forRequest(request).dispatcher;
    oldDispatcher.#requestsById.delete(requestId);
    oldDispatcher.#requestsByURL.delete(request.url());
    const loaderId = request.loaderId;
    if (loaderId) {
      oldDispatcher.#requestsByLoaderId.delete(loaderId);
    }
    const builder = oldDispatcher.#requestIdToExtraInfoBuilder.get(requestId);
    oldDispatcher.#requestIdToExtraInfoBuilder.delete(requestId);
    this.#requestsById.set(requestId, request);
    this.#requestsByURL.set(request.url(), request);
    if (loaderId) {
      this.#requestsByLoaderId.set(loaderId, request);
    }
    if (builder) {
      this.#requestIdToExtraInfoBuilder.set(requestId, builder);
    }
    requestToManagerMap.set(request, this.#manager);
    return request;
  }
  startNetworkRequest(networkRequest, originalRequest) {
    this.#requestsById.set(networkRequest.requestId(), networkRequest);
    this.#requestsByURL.set(networkRequest.url(), networkRequest);
    const loaderId = networkRequest.loaderId;
    if (loaderId) {
      this.#requestsByLoaderId.set(loaderId, networkRequest);
    }
    if (networkRequest.loaderId === networkRequest.requestId() || networkRequest.loaderId === "") {
      MultitargetNetworkManager.instance().inflightMainResourceRequests.set(networkRequest.requestId(), networkRequest);
    }
    this.#manager.dispatchEventToListeners("RequestStarted" /* RequestStarted */, { request: networkRequest, originalRequest });
  }
  updateNetworkRequest(networkRequest) {
    this.#manager.dispatchEventToListeners("RequestUpdated" /* RequestUpdated */, networkRequest);
  }
  finishNetworkRequest(networkRequest, finishTime, encodedDataLength) {
    networkRequest.endTime = finishTime;
    networkRequest.finished = true;
    if (encodedDataLength >= 0) {
      const redirectSource = networkRequest.redirectSource();
      if (redirectSource?.signedExchangeInfo()) {
        networkRequest.setTransferSize(0);
        redirectSource.setTransferSize(encodedDataLength);
        this.updateNetworkRequest(redirectSource);
      } else {
        networkRequest.setTransferSize(encodedDataLength);
      }
    }
    this.#manager.dispatchEventToListeners("RequestFinished" /* RequestFinished */, networkRequest);
    MultitargetNetworkManager.instance().inflightMainResourceRequests.delete(networkRequest.requestId());
    if (Common.Settings.Settings.instance().moduleSetting("monitoring-xhr-enabled").get() && networkRequest.resourceType().category() === Common.ResourceType.resourceCategories.XHR) {
      let message;
      const failedToLoad = networkRequest.failed || networkRequest.hasErrorStatusCode();
      if (failedToLoad) {
        message = i18nString(
          UIStrings.sFailedLoadingSS,
          { PH1: networkRequest.resourceType().title(), PH2: networkRequest.requestMethod, PH3: networkRequest.url() }
        );
      } else {
        message = i18nString(
          UIStrings.sFinishedLoadingSS,
          { PH1: networkRequest.resourceType().title(), PH2: networkRequest.requestMethod, PH3: networkRequest.url() }
        );
      }
      this.#manager.dispatchEventToListeners(
        "MessageGenerated" /* MessageGenerated */,
        { message, requestId: networkRequest.requestId(), warning: false }
      );
    }
  }
  clearRequests() {
    for (const [requestId, request] of this.#requestsById) {
      if (request.finished) {
        this.#requestsById.delete(requestId);
      }
    }
    for (const [requestURL, request] of this.#requestsByURL) {
      if (request.finished) {
        this.#requestsByURL.delete(requestURL);
      }
    }
    for (const [requestLoaderId, request] of this.#requestsByLoaderId) {
      if (request.finished) {
        this.#requestsByLoaderId.delete(requestLoaderId);
      }
    }
    for (const [requestId, builder] of this.#requestIdToExtraInfoBuilder) {
      if (builder.isFinished()) {
        this.#requestIdToExtraInfoBuilder.delete(requestId);
      }
    }
  }
  webTransportCreated({ transportId, url: requestURL, timestamp: time, initiator }) {
    const networkRequest = NetworkRequest.createForSocket(transportId, requestURL, initiator);
    networkRequest.hasNetworkData = true;
    requestToManagerMap.set(networkRequest, this.#manager);
    networkRequest.setResourceType(Common.ResourceType.resourceTypes.WebTransport);
    networkRequest.setIssueTime(time, 0);
    this.startNetworkRequest(networkRequest, null);
  }
  webTransportConnectionEstablished({ transportId, timestamp: time }) {
    const networkRequest = this.#requestsById.get(transportId);
    if (!networkRequest) {
      return;
    }
    networkRequest.responseReceivedTime = time;
    networkRequest.endTime = time + 1e-3;
    this.updateNetworkRequest(networkRequest);
  }
  webTransportClosed({ transportId, timestamp: time }) {
    const networkRequest = this.#requestsById.get(transportId);
    if (!networkRequest) {
      return;
    }
    networkRequest.endTime = time;
    this.finishNetworkRequest(networkRequest, time, 0);
  }
  directTCPSocketCreated(event) {
    const requestURL = this.concatHostPort(event.remoteAddr, event.remotePort);
    const networkRequest = NetworkRequest.createForSocket(
      event.identifier,
      requestURL,
      event.initiator
    );
    networkRequest.hasNetworkData = true;
    networkRequest.setRemoteAddress(event.remoteAddr, event.remotePort);
    networkRequest.protocol = i18n.i18n.lockedString("tcp");
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusOpening);
    networkRequest.directSocketInfo = {
      type: DirectSocketType.TCP,
      status: DirectSocketStatus.OPENING,
      createOptions: {
        remoteAddr: event.remoteAddr,
        remotePort: event.remotePort,
        noDelay: event.options.noDelay,
        keepAliveDelay: event.options.keepAliveDelay,
        sendBufferSize: event.options.sendBufferSize,
        receiveBufferSize: event.options.receiveBufferSize,
        dnsQueryType: event.options.dnsQueryType
      }
    };
    networkRequest.setResourceType(Common.ResourceType.resourceTypes.DirectSocket);
    networkRequest.setIssueTime(event.timestamp, event.timestamp);
    requestToManagerMap.set(networkRequest, this.#manager);
    this.startNetworkRequest(networkRequest, null);
  }
  directTCPSocketOpened(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    networkRequest.responseReceivedTime = event.timestamp;
    networkRequest.directSocketInfo.status = DirectSocketStatus.OPEN;
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusOpen);
    networkRequest.directSocketInfo.openInfo = {
      remoteAddr: event.remoteAddr,
      remotePort: event.remotePort,
      localAddr: event.localAddr,
      localPort: event.localPort
    };
    networkRequest.setRemoteAddress(event.remoteAddr, event.remotePort);
    const requestURL = this.concatHostPort(event.remoteAddr, event.remotePort);
    networkRequest.setUrl(requestURL);
    this.updateNetworkRequest(networkRequest);
  }
  directTCPSocketAborted(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    networkRequest.failed = true;
    networkRequest.directSocketInfo.status = DirectSocketStatus.ABORTED;
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusAborted);
    networkRequest.directSocketInfo.errorMessage = event.errorMessage;
    this.finishNetworkRequest(networkRequest, event.timestamp, 0);
  }
  directTCPSocketClosed(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusClosed);
    networkRequest.directSocketInfo.status = DirectSocketStatus.CLOSED;
    this.finishNetworkRequest(networkRequest, event.timestamp, 0);
  }
  directTCPSocketChunkSent(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest) {
      return;
    }
    networkRequest.addDirectSocketChunk({
      data: event.data,
      type: DirectSocketChunkType.SEND,
      timestamp: event.timestamp
    });
    networkRequest.responseReceivedTime = event.timestamp;
    this.updateNetworkRequest(networkRequest);
  }
  directTCPSocketChunkReceived(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest) {
      return;
    }
    networkRequest.addDirectSocketChunk({
      data: event.data,
      type: DirectSocketChunkType.RECEIVE,
      timestamp: event.timestamp
    });
    networkRequest.responseReceivedTime = event.timestamp;
    this.updateNetworkRequest(networkRequest);
  }
  directUDPSocketCreated(event) {
    let requestURL = "";
    let type;
    if (event.options.remoteAddr && event.options.remotePort) {
      requestURL = this.concatHostPort(event.options.remoteAddr, event.options.remotePort);
      type = DirectSocketType.UDP_CONNECTED;
    } else if (event.options.localAddr) {
      requestURL = this.concatHostPort(event.options.localAddr, event.options.localPort);
      type = DirectSocketType.UDP_BOUND;
    } else {
      return;
    }
    const networkRequest = NetworkRequest.createForSocket(
      event.identifier,
      requestURL,
      event.initiator
    );
    networkRequest.hasNetworkData = true;
    if (event.options.remoteAddr && event.options.remotePort) {
      networkRequest.setRemoteAddress(event.options.remoteAddr, event.options.remotePort);
    }
    networkRequest.protocol = i18n.i18n.lockedString("udp");
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusOpening);
    networkRequest.directSocketInfo = {
      type,
      status: DirectSocketStatus.OPENING,
      createOptions: {
        remoteAddr: event.options.remoteAddr,
        remotePort: event.options.remotePort,
        localAddr: event.options.localAddr,
        localPort: event.options.localPort,
        sendBufferSize: event.options.sendBufferSize,
        receiveBufferSize: event.options.receiveBufferSize,
        dnsQueryType: event.options.dnsQueryType,
        multicastLoopback: event.options.multicastLoopback,
        multicastTimeToLive: event.options.multicastTimeToLive,
        multicastAllowAddressSharing: event.options.multicastAllowAddressSharing
      },
      joinedMulticastGroups: /* @__PURE__ */ new Set()
    };
    networkRequest.setResourceType(Common.ResourceType.resourceTypes.DirectSocket);
    networkRequest.setIssueTime(event.timestamp, event.timestamp);
    requestToManagerMap.set(networkRequest, this.#manager);
    this.startNetworkRequest(networkRequest, null);
  }
  directUDPSocketOpened(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    let requestURL;
    if (networkRequest.directSocketInfo.type === DirectSocketType.UDP_CONNECTED) {
      if (!event.remoteAddr || !event.remotePort) {
        return;
      }
      networkRequest.setRemoteAddress(event.remoteAddr, event.remotePort);
      requestURL = this.concatHostPort(event.remoteAddr, event.remotePort);
    } else {
      requestURL = this.concatHostPort(event.localAddr, event.localPort);
    }
    networkRequest.setUrl(requestURL);
    networkRequest.responseReceivedTime = event.timestamp;
    networkRequest.directSocketInfo.status = DirectSocketStatus.OPEN;
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusOpen);
    networkRequest.directSocketInfo.openInfo = {
      remoteAddr: event.remoteAddr,
      remotePort: event.remotePort,
      localAddr: event.localAddr,
      localPort: event.localPort
    };
    this.updateNetworkRequest(networkRequest);
  }
  directUDPSocketAborted(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    networkRequest.failed = true;
    networkRequest.directSocketInfo.status = DirectSocketStatus.ABORTED;
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusAborted);
    networkRequest.directSocketInfo.errorMessage = event.errorMessage;
    this.finishNetworkRequest(networkRequest, event.timestamp, 0);
  }
  directUDPSocketClosed(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    networkRequest.statusText = i18nString(UIStrings.directSocketStatusClosed);
    networkRequest.directSocketInfo.status = DirectSocketStatus.CLOSED;
    this.finishNetworkRequest(networkRequest, event.timestamp, 0);
  }
  directUDPSocketChunkSent(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest) {
      return;
    }
    networkRequest.addDirectSocketChunk({
      data: event.message.data,
      type: DirectSocketChunkType.SEND,
      timestamp: event.timestamp,
      remoteAddress: event.message.remoteAddr,
      remotePort: event.message.remotePort
    });
    networkRequest.responseReceivedTime = event.timestamp;
    this.updateNetworkRequest(networkRequest);
  }
  directUDPSocketChunkReceived(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest) {
      return;
    }
    networkRequest.addDirectSocketChunk({
      data: event.message.data,
      type: DirectSocketChunkType.RECEIVE,
      timestamp: event.timestamp,
      remoteAddress: event.message.remoteAddr,
      remotePort: event.message.remotePort
    });
    networkRequest.responseReceivedTime = event.timestamp;
    this.updateNetworkRequest(networkRequest);
  }
  directUDPSocketJoinedMulticastGroup(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo) {
      return;
    }
    if (!networkRequest.directSocketInfo.joinedMulticastGroups) {
      networkRequest.directSocketInfo.joinedMulticastGroups = /* @__PURE__ */ new Set();
    }
    if (!networkRequest.directSocketInfo.joinedMulticastGroups.has(event.IPAddress)) {
      networkRequest.directSocketInfo.joinedMulticastGroups.add(event.IPAddress);
      this.updateNetworkRequest(networkRequest);
    }
  }
  directUDPSocketLeftMulticastGroup(event) {
    const networkRequest = this.#requestsById.get(event.identifier);
    if (!networkRequest?.directSocketInfo?.joinedMulticastGroups) {
      return;
    }
    if (networkRequest.directSocketInfo.joinedMulticastGroups.delete(event.IPAddress)) {
      this.updateNetworkRequest(networkRequest);
    }
  }
  trustTokenOperationDone(event) {
    const request = this.#requestsById.get(event.requestId);
    if (!request) {
      this.#requestIdToTrustTokenEvent.set(event.requestId, event);
      return;
    }
    request.setTrustTokenOperationDoneEvent(event);
  }
  reportingApiReportAdded(data) {
    this.#manager.dispatchEventToListeners("ReportingApiReportAdded" /* ReportingApiReportAdded */, data.report);
  }
  reportingApiReportUpdated(data) {
    this.#manager.dispatchEventToListeners("ReportingApiReportUpdated" /* ReportingApiReportUpdated */, data.report);
  }
  reportingApiEndpointsChangedForOrigin(data) {
    this.#manager.dispatchEventToListeners("ReportingApiEndpointsChangedForOrigin" /* ReportingApiEndpointsChangedForOrigin */, data);
  }
  deviceBoundSessionsAdded(_params) {
    this.#manager.dispatchEventToListeners("DeviceBoundSessionsAdded" /* DeviceBoundSessionsAdded */, _params.sessions);
  }
  deviceBoundSessionEventOccurred(_params) {
    this.#manager.dispatchEventToListeners("DeviceBoundSessionEventOccurred" /* DeviceBoundSessionEventOccurred */, _params);
  }
  policyUpdated() {
  }
  /**
   * @deprecated
   * This method is only kept for usage in a web test.
   */
  createNetworkRequest(requestId, frameId, loaderId, url, documentURL, initiator) {
    const request = NetworkRequest.create(
      requestId,
      url,
      documentURL,
      frameId,
      loaderId,
      initiator
    );
    requestToManagerMap.set(request, this.#manager);
    return request;
  }
  concatHostPort(host, port) {
    if (!port || port === 0) {
      return host;
    }
    return `${host}:${port}`;
  }
}
export var RequestURLPatternValidity = /* @__PURE__ */ ((RequestURLPatternValidity2) => {
  RequestURLPatternValidity2["VALID"] = "valid";
  RequestURLPatternValidity2["FAILED_TO_PARSE"] = "failed-to-parse";
  RequestURLPatternValidity2["HAS_REGEXP_GROUPS"] = "has-regexp-groups";
  return RequestURLPatternValidity2;
})(RequestURLPatternValidity || {});
export class RequestURLPattern {
  constructor(constructorString, pattern) {
    this.constructorString = constructorString;
    this.pattern = pattern;
    if (pattern.hasRegExpGroups) {
      throw new Error("RegExp groups are not allowed");
    }
  }
  static isValidPattern(pattern) {
    try {
      const urlPattern = new URLPattern(pattern);
      return urlPattern.hasRegExpGroups ? "has-regexp-groups" /* HAS_REGEXP_GROUPS */ : "valid" /* VALID */;
    } catch {
      return "failed-to-parse" /* FAILED_TO_PARSE */;
    }
  }
  static create(constructorString) {
    try {
      const urlPattern = new URLPattern(constructorString);
      return urlPattern.hasRegExpGroups ? null : new RequestURLPattern(constructorString, urlPattern);
    } catch {
      return null;
    }
  }
  static upgradeFromWildcard(pattern) {
    const tryCreate = (constructorString) => {
      const result = this.create(constructorString);
      if (result?.pattern.protocol === "localhost" && result?.pattern.hostname === "") {
        return tryCreate(`*://${constructorString}`);
      }
      return result;
    };
    return tryCreate(pattern) ?? // Try to upgrade patterns created from the network panel, which either blocks the full url (sans
    // protocol) or just the domain name. In both cases the wildcard patterns had implicit wildcards at the end.
    // We explicitly add that here, which will match both domain names without path (implicitly setting pathname
    // to '*') and urls with path (appending * to the pathname).
    tryCreate(`*://${pattern}*`);
  }
}
export class RequestCondition extends Common.ObjectWrapper.ObjectWrapper {
  #pattern;
  #enabled;
  #conditions;
  #ruleIds = /* @__PURE__ */ new Set();
  static createFromSetting(setting) {
    if ("urlPattern" in setting) {
      const pattern2 = RequestURLPattern.create(setting.urlPattern) ?? {
        wildcardURL: setting.urlPattern,
        upgradedPattern: RequestURLPattern.upgradeFromWildcard(setting.urlPattern) ?? void 0
      };
      const conditions = getPredefinedOrBlockingCondition(setting.conditions) ?? customUserNetworkConditionsSetting().get().find((condition) => condition.key === setting.conditions) ?? NoThrottlingConditions;
      return new this(pattern2, setting.enabled, conditions);
    }
    const pattern = {
      wildcardURL: setting.url,
      upgradedPattern: RequestURLPattern.upgradeFromWildcard(setting.url) ?? void 0
    };
    return new this(pattern, setting.enabled, BlockingConditions);
  }
  static create(pattern, conditions) {
    return new this(
      pattern,
      /* enabled=*/
      true,
      conditions
    );
  }
  constructor(pattern, enabled, conditions) {
    super();
    this.#pattern = pattern;
    this.#enabled = enabled;
    this.#conditions = conditions;
  }
  get isBlocking() {
    return this.conditions === BlockingConditions;
  }
  get ruleIds() {
    return this.#ruleIds;
  }
  get constructorString() {
    return this.#pattern instanceof RequestURLPattern ? this.#pattern.constructorString : this.#pattern.upgradedPattern?.constructorString;
  }
  get wildcardURL() {
    return "wildcardURL" in this.#pattern ? this.#pattern.wildcardURL : void 0;
  }
  get constructorStringOrWildcardURL() {
    return this.#pattern instanceof RequestURLPattern ? this.#pattern.constructorString : this.#pattern.upgradedPattern?.constructorString ?? this.#pattern.wildcardURL;
  }
  set pattern(pattern) {
    this.#pattern = pattern;
    this.dispatchEventToListeners(RequestCondition.Events.REQUEST_CONDITION_CHANGED);
  }
  get enabled() {
    return this.#enabled;
  }
  set enabled(enabled) {
    this.#enabled = enabled;
    this.dispatchEventToListeners(RequestCondition.Events.REQUEST_CONDITION_CHANGED);
  }
  get conditions() {
    return this.#conditions;
  }
  set conditions(conditions) {
    this.#conditions = conditions;
    this.#ruleIds = /* @__PURE__ */ new Set();
    this.dispatchEventToListeners(RequestCondition.Events.REQUEST_CONDITION_CHANGED);
  }
  toSetting() {
    const enabled = this.enabled;
    if (this.#pattern instanceof RequestURLPattern) {
      return { enabled, urlPattern: this.#pattern.constructorString, conditions: this.#conditions.key };
    }
    if (this.#conditions !== BlockingConditions && this.#pattern.upgradedPattern) {
      return { enabled, urlPattern: this.#pattern.upgradedPattern.constructorString, conditions: this.#conditions.key };
    }
    return { enabled, url: this.#pattern.wildcardURL };
  }
  get originalOrUpgradedURLPattern() {
    return this.#pattern instanceof RequestURLPattern ? this.#pattern.pattern : this.#pattern.upgradedPattern?.pattern;
  }
}
((RequestCondition2) => {
  let Events2;
  ((Events3) => {
    Events3["REQUEST_CONDITION_CHANGED"] = "request-condition-changed";
  })(Events2 = RequestCondition2.Events || (RequestCondition2.Events = {}));
})(RequestCondition || (RequestCondition = {}));
export class RequestConditions extends Common.ObjectWrapper.ObjectWrapper {
  #setting = Common.Settings.Settings.instance().createSetting("network-blocked-patterns", []);
  #conditionsEnabledSetting = Common.Settings.Settings.instance().moduleSetting("request-blocking-enabled");
  #conditions = [];
  #requestConditionsById = /* @__PURE__ */ new Map();
  #conditionsAppliedForTestPromise = Promise.resolve();
  constructor() {
    super();
    for (const condition of this.#setting.get()) {
      try {
        this.#conditions.push(RequestCondition.createFromSetting(condition));
      } catch (e) {
        console.error("Error loading throttling settings: ", e);
      }
    }
    for (const condition of this.#conditions) {
      condition.addEventListener("request-condition-changed" /* REQUEST_CONDITION_CHANGED */, this.#conditionsChanged, this);
    }
    this.#conditionsEnabledSetting.addChangeListener(
      () => this.dispatchEventToListeners(RequestConditions.Events.REQUEST_CONDITIONS_CHANGED)
    );
  }
  get count() {
    return this.#conditions.length;
  }
  get conditionsEnabled() {
    return this.#conditionsEnabledSetting.get();
  }
  set conditionsEnabled(enabled) {
    if (this.#conditionsEnabledSetting.get() === enabled) {
      return;
    }
    this.#conditionsEnabledSetting.set(enabled);
  }
  findCondition(pattern) {
    return this.#conditions.find((condition) => condition.constructorString === pattern);
  }
  has(url) {
    return Boolean(this.findCondition(url));
  }
  add(...conditions) {
    this.#conditions.push(...conditions);
    for (const condition of conditions) {
      condition.addEventListener("request-condition-changed" /* REQUEST_CONDITION_CHANGED */, this.#conditionsChanged, this);
    }
    this.#conditionsChanged();
  }
  decreasePriority(condition) {
    const index = this.#conditions.indexOf(condition);
    if (index < 0 || index >= this.#conditions.length - 1) {
      return;
    }
    Platform.ArrayUtilities.swap(this.#conditions, index, index + 1);
    this.#conditionsChanged();
  }
  increasePriority(condition) {
    const index = this.#conditions.indexOf(condition);
    if (index <= 0) {
      return;
    }
    Platform.ArrayUtilities.swap(this.#conditions, index - 1, index);
    this.#conditionsChanged();
  }
  delete(condition) {
    const index = this.#conditions.indexOf(condition);
    if (index < 0) {
      return;
    }
    condition.removeEventListener("request-condition-changed" /* REQUEST_CONDITION_CHANGED */, this.#conditionsChanged, this);
    this.#conditions.splice(index, 1);
    this.#conditionsChanged();
  }
  clear() {
    this.#conditions.splice(0);
    this.#conditionsChanged();
    for (const condition of this.#conditions) {
      condition.removeEventListener("request-condition-changed" /* REQUEST_CONDITION_CHANGED */, this.#conditionsChanged, this);
    }
  }
  #conditionsChanged() {
    this.#setting.set(this.#conditions.map((condition) => condition.toSetting()));
    this.dispatchEventToListeners(RequestConditions.Events.REQUEST_CONDITIONS_CHANGED);
  }
  get conditions() {
    return this.#conditions.values();
  }
  applyConditions(offline, globalConditions, ...agents) {
    function isNonBlockingCondition(condition) {
      return !("block" in condition);
    }
    const urlPatterns = [];
    const matchedNetworkConditions = [];
    if (this.conditionsEnabled) {
      for (const condition of this.#conditions) {
        const urlPattern = condition.constructorString;
        const conditions = condition.conditions;
        if (!condition.enabled || !urlPattern || conditions === NoThrottlingConditions) {
          continue;
        }
        const block = !isNonBlockingCondition(conditions);
        urlPatterns.push({ urlPattern, block });
        if (!block) {
          const { ruleIds } = condition;
          matchedNetworkConditions.push({ ruleIds, urlPattern, conditions });
        }
      }
    }
    if (globalConditions) {
      matchedNetworkConditions.push({ conditions: globalConditions });
    }
    const promises = [];
    for (const agent of agents) {
      promises.push(agent.invoke_setBlockedURLs({ urlPatterns }));
      promises.push(agent.invoke_emulateNetworkConditionsByRule({
        offline,
        matchedNetworkConditions: matchedNetworkConditions.map(
          ({ urlPattern, conditions }) => ({
            urlPattern: urlPattern ?? "",
            latency: conditions.latency,
            downloadThroughput: conditions.download < 0 ? 0 : conditions.download,
            uploadThroughput: conditions.upload < 0 ? 0 : conditions.upload,
            packetLoss: (conditions.packetLoss ?? 0) < 0 ? 0 : conditions.packetLoss,
            packetQueueLength: conditions.packetQueueLength,
            packetReordering: conditions.packetReordering,
            connectionType: NetworkManager.connectionType(conditions)
          })
        )
      }).then((response) => {
        if (!response.getError()) {
          for (let i = 0; i < response.ruleIds.length; ++i) {
            const ruleId = response.ruleIds[i];
            const { ruleIds, conditions, urlPattern } = matchedNetworkConditions[i];
            if (ruleIds) {
              this.#requestConditionsById.set(ruleId, { urlPattern, conditions });
              matchedNetworkConditions[i].ruleIds?.add(ruleId);
            }
          }
        }
      }));
      promises.push(agent.invoke_overrideNetworkState({
        offline,
        latency: globalConditions?.latency ?? 0,
        downloadThroughput: globalConditions?.download ?? -1,
        uploadThroughput: globalConditions?.upload ?? -1,
        connectionType: globalConditions ? NetworkManager.connectionType(globalConditions) : Protocol.Network.ConnectionType.None
      }));
    }
    this.#conditionsAppliedForTestPromise = this.#conditionsAppliedForTestPromise.then(() => Promise.all(promises));
    return urlPatterns.length > 0;
  }
  conditionsAppliedForTest() {
    return this.#conditionsAppliedForTestPromise;
  }
  conditionsForId(appliedNetworkConditionsId) {
    const requestConditions = this.#requestConditionsById.get(appliedNetworkConditionsId);
    if (!requestConditions) {
      return void 0;
    }
    const { conditions, urlPattern } = requestConditions;
    return new AppliedNetworkConditions(conditions, appliedNetworkConditionsId, urlPattern);
  }
}
((RequestConditions2) => {
  let Events2;
  ((Events3) => {
    Events3["REQUEST_CONDITIONS_CHANGED"] = "request-conditions-changed";
  })(Events2 = RequestConditions2.Events || (RequestConditions2.Events = {}));
})(RequestConditions || (RequestConditions = {}));
export class AppliedNetworkConditions {
  constructor(conditions, appliedNetworkConditionsId, urlPattern) {
    this.conditions = conditions;
    this.appliedNetworkConditionsId = appliedNetworkConditionsId;
    this.urlPattern = urlPattern;
  }
}
export class MultitargetNetworkManager extends Common.ObjectWrapper.ObjectWrapper {
  #targetManager;
  #userAgentOverride = "";
  #userAgentMetadataOverride = null;
  #customAcceptedEncodings = null;
  #networkAgents = /* @__PURE__ */ new Set();
  #fetchAgents = /* @__PURE__ */ new Set();
  inflightMainResourceRequests = /* @__PURE__ */ new Map();
  #networkConditions = NoThrottlingConditions;
  #updatingInterceptionPatternsPromise = null;
  #requestConditions = new RequestConditions();
  #urlsForRequestInterceptor = new Platform.MapUtilities.Multimap();
  #extraHeaders;
  #customUserAgent;
  #isBlocking = false;
  constructor(targetManager) {
    super();
    this.#targetManager = targetManager;
    const blockedPatternChanged = () => {
      this.updateBlockedPatterns();
      this.dispatchEventToListeners(MultitargetNetworkManager.Events.BLOCKED_PATTERNS_CHANGED);
    };
    this.#requestConditions.addEventListener(
      "request-conditions-changed" /* REQUEST_CONDITIONS_CHANGED */,
      blockedPatternChanged
    );
    this.updateBlockedPatterns();
    this.#targetManager.observeModels(NetworkManager, this);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew, targetManager } = opts;
    if (!Root.DevToolsContext.globalInstance().has(MultitargetNetworkManager) || forceNew) {
      Root.DevToolsContext.globalInstance().set(
        MultitargetNetworkManager,
        new MultitargetNetworkManager(targetManager ?? TargetManager.instance())
      );
    }
    return Root.DevToolsContext.globalInstance().get(MultitargetNetworkManager);
  }
  static dispose() {
    Root.DevToolsContext.globalInstance().delete(MultitargetNetworkManager);
  }
  static patchUserAgentWithChromeVersion(uaString) {
    const chromeVersion = Root.Runtime.getChromeVersion();
    if (chromeVersion.length > 0) {
      const additionalAppVersion = chromeVersion.split(".", 1)[0] + ".0.100.0";
      return Platform.StringUtilities.sprintf(uaString, chromeVersion, additionalAppVersion);
    }
    return uaString;
  }
  static patchUserAgentMetadataWithChromeVersion(userAgentMetadata) {
    if (!userAgentMetadata.brands) {
      return;
    }
    const chromeVersion = Root.Runtime.getChromeVersion();
    if (chromeVersion.length === 0) {
      return;
    }
    const majorVersion = chromeVersion.split(".", 1)[0];
    for (const brand of userAgentMetadata.brands) {
      if (brand.version.includes("%s")) {
        brand.version = Platform.StringUtilities.sprintf(brand.version, majorVersion);
      }
    }
    if (userAgentMetadata.fullVersion) {
      if (userAgentMetadata.fullVersion.includes("%s")) {
        userAgentMetadata.fullVersion = Platform.StringUtilities.sprintf(userAgentMetadata.fullVersion, chromeVersion);
      }
    }
  }
  modelAdded(networkManager) {
    const networkAgent = networkManager.target().networkAgent();
    const fetchAgent = networkManager.target().fetchAgent();
    if (this.#extraHeaders) {
      void networkAgent.invoke_setExtraHTTPHeaders({ headers: this.#extraHeaders });
    }
    if (this.currentUserAgent()) {
      void networkAgent.invoke_setUserAgentOverride(
        { userAgent: this.currentUserAgent(), userAgentMetadata: this.#userAgentMetadataOverride || void 0 }
      );
    }
    this.#requestConditions.applyConditions(
      this.isOffline(),
      this.isThrottling() ? this.#networkConditions : null,
      networkAgent
    );
    if (this.isIntercepting()) {
      void fetchAgent.invoke_enable({ patterns: this.#urlsForRequestInterceptor.valuesArray() });
    }
    if (this.#customAcceptedEncodings === null) {
      void networkAgent.invoke_clearAcceptedEncodingsOverride();
    } else {
      void networkAgent.invoke_setAcceptedEncodings({ encodings: this.#customAcceptedEncodings });
    }
    this.#networkAgents.add(networkAgent);
    this.#fetchAgents.add(fetchAgent);
  }
  modelRemoved(networkManager) {
    for (const entry of this.inflightMainResourceRequests) {
      const manager = NetworkManager.forRequest(entry[1]);
      if (manager !== networkManager) {
        continue;
      }
      this.inflightMainResourceRequests.delete(entry[0]);
    }
    this.#networkAgents.delete(networkManager.target().networkAgent());
    this.#fetchAgents.delete(networkManager.target().fetchAgent());
  }
  isThrottling() {
    return this.#networkConditions.download >= 0 || this.#networkConditions.upload >= 0 || this.#networkConditions.latency > 0;
  }
  isOffline() {
    return !this.#networkConditions.download && !this.#networkConditions.upload;
  }
  setNetworkConditions(conditions) {
    this.#networkConditions = conditions;
    this.#requestConditions.applyConditions(
      this.isOffline(),
      this.isThrottling() ? this.#networkConditions : null,
      ...this.#networkAgents
    );
    this.dispatchEventToListeners(MultitargetNetworkManager.Events.CONDITIONS_CHANGED);
  }
  networkConditions() {
    return this.#networkConditions;
  }
  updateNetworkConditions(networkAgent) {
    const conditions = this.#networkConditions;
    if (!this.isThrottling()) {
      void networkAgent.invoke_emulateNetworkConditions({
        offline: false,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0
      });
    } else {
      void networkAgent.invoke_emulateNetworkConditions({
        offline: this.isOffline(),
        latency: conditions.latency,
        downloadThroughput: conditions.download < 0 ? 0 : conditions.download,
        uploadThroughput: conditions.upload < 0 ? 0 : conditions.upload,
        packetLoss: (conditions.packetLoss ?? 0) < 0 ? 0 : conditions.packetLoss,
        packetQueueLength: conditions.packetQueueLength,
        packetReordering: conditions.packetReordering,
        connectionType: NetworkManager.connectionType(conditions)
      });
    }
  }
  setExtraHTTPHeaders(headers) {
    this.#extraHeaders = headers;
    for (const agent of this.#networkAgents) {
      void agent.invoke_setExtraHTTPHeaders({ headers: this.#extraHeaders });
    }
  }
  currentUserAgent() {
    return this.#customUserAgent ? this.#customUserAgent : this.#userAgentOverride;
  }
  updateUserAgentOverride() {
    const userAgent = this.currentUserAgent();
    for (const agent of this.#networkAgents) {
      void agent.invoke_setUserAgentOverride(
        { userAgent, userAgentMetadata: this.#userAgentMetadataOverride || void 0 }
      );
    }
  }
  setUserAgentOverride(userAgent, userAgentMetadataOverride) {
    const uaChanged = this.#userAgentOverride !== userAgent;
    this.#userAgentOverride = userAgent;
    if (!this.#customUserAgent) {
      this.#userAgentMetadataOverride = userAgentMetadataOverride;
      this.updateUserAgentOverride();
    } else {
      this.#userAgentMetadataOverride = null;
    }
    if (uaChanged) {
      this.dispatchEventToListeners(MultitargetNetworkManager.Events.USER_AGENT_CHANGED);
    }
  }
  setCustomUserAgentOverride(userAgent, userAgentMetadataOverride = null) {
    this.#customUserAgent = userAgent;
    this.#userAgentMetadataOverride = userAgentMetadataOverride;
    this.updateUserAgentOverride();
  }
  setCustomAcceptedEncodingsOverride(acceptedEncodings) {
    this.#customAcceptedEncodings = acceptedEncodings;
    this.updateAcceptedEncodingsOverride();
    this.dispatchEventToListeners(MultitargetNetworkManager.Events.ACCEPTED_ENCODINGS_CHANGED);
  }
  clearCustomAcceptedEncodingsOverride() {
    this.#customAcceptedEncodings = null;
    this.updateAcceptedEncodingsOverride();
    this.dispatchEventToListeners(MultitargetNetworkManager.Events.ACCEPTED_ENCODINGS_CHANGED);
  }
  isAcceptedEncodingOverrideSet() {
    return this.#customAcceptedEncodings !== null;
  }
  updateAcceptedEncodingsOverride() {
    const customAcceptedEncodings = this.#customAcceptedEncodings;
    for (const agent of this.#networkAgents) {
      if (customAcceptedEncodings === null) {
        void agent.invoke_clearAcceptedEncodingsOverride();
      } else {
        void agent.invoke_setAcceptedEncodings({ encodings: customAcceptedEncodings });
      }
    }
  }
  get requestConditions() {
    return this.#requestConditions;
  }
  isBlocking() {
    return this.#isBlocking && this.requestConditions.conditionsEnabled;
  }
  updateBlockedPatterns() {
    this.#isBlocking = this.#requestConditions.applyConditions(
      this.isOffline(),
      this.isThrottling() ? this.#networkConditions : null,
      ...this.#networkAgents
    );
  }
  isIntercepting() {
    return Boolean(this.#urlsForRequestInterceptor.size);
  }
  setInterceptionHandlerForPatterns(patterns, requestInterceptor) {
    this.#urlsForRequestInterceptor.deleteAll(requestInterceptor);
    for (const newPattern of patterns) {
      this.#urlsForRequestInterceptor.set(requestInterceptor, newPattern);
    }
    return this.updateInterceptionPatternsOnNextTick();
  }
  updateInterceptionPatternsOnNextTick() {
    if (!this.#updatingInterceptionPatternsPromise) {
      this.#updatingInterceptionPatternsPromise = Promise.resolve().then(this.updateInterceptionPatterns.bind(this));
    }
    return this.#updatingInterceptionPatternsPromise;
  }
  async updateInterceptionPatterns() {
    if (!Common.Settings.Settings.instance().moduleSetting("cache-disabled").get()) {
      Common.Settings.Settings.instance().moduleSetting("cache-disabled").set(true);
    }
    this.#updatingInterceptionPatternsPromise = null;
    const promises = [];
    for (const agent of this.#fetchAgents) {
      promises.push(agent.invoke_enable({ patterns: this.#urlsForRequestInterceptor.valuesArray() }));
    }
    this.dispatchEventToListeners(MultitargetNetworkManager.Events.INTERCEPTORS_CHANGED);
    await Promise.all(promises);
  }
  async requestIntercepted(interceptedRequest) {
    for (const requestInterceptor of this.#urlsForRequestInterceptor.keysArray()) {
      await requestInterceptor(interceptedRequest);
      if (interceptedRequest.hasResponded() && interceptedRequest.networkRequest) {
        this.dispatchEventToListeners(
          MultitargetNetworkManager.Events.REQUEST_INTERCEPTED,
          interceptedRequest.networkRequest.requestId()
        );
        return;
      }
    }
    if (!interceptedRequest.hasResponded()) {
      interceptedRequest.continueRequestWithoutChange();
    }
  }
  clearBrowserCache() {
    for (const agent of this.#networkAgents) {
      void agent.invoke_clearBrowserCache();
    }
  }
  clearBrowserCookies() {
    for (const agent of this.#networkAgents) {
      void agent.invoke_clearBrowserCookies();
    }
  }
  async getCertificate(origin) {
    const target = this.#targetManager.primaryPageTarget();
    if (!target) {
      return [];
    }
    const certificate = await target.networkAgent().invoke_getCertificate({ origin });
    if (!certificate) {
      return [];
    }
    return certificate.tableNames;
  }
  appliedRequestConditions(requestInternal) {
    if (!requestInternal.appliedNetworkConditionsId) {
      return void 0;
    }
    return this.requestConditions.conditionsForId(requestInternal.appliedNetworkConditionsId);
  }
}
((MultitargetNetworkManager2) => {
  let Events2;
  ((Events3) => {
    Events3["BLOCKED_PATTERNS_CHANGED"] = "BlockedPatternsChanged";
    Events3["CONDITIONS_CHANGED"] = "ConditionsChanged";
    Events3["USER_AGENT_CHANGED"] = "UserAgentChanged";
    Events3["INTERCEPTORS_CHANGED"] = "InterceptorsChanged";
    Events3["ACCEPTED_ENCODINGS_CHANGED"] = "AcceptedEncodingsChanged";
    Events3["REQUEST_INTERCEPTED"] = "RequestIntercepted";
    Events3["REQUEST_FULFILLED"] = "RequestFulfilled";
  })(Events2 = MultitargetNetworkManager2.Events || (MultitargetNetworkManager2.Events = {}));
})(MultitargetNetworkManager || (MultitargetNetworkManager = {}));
export class InterceptedRequest {
  #fetchAgent;
  #hasResponded = false;
  request;
  resourceType;
  responseStatusCode;
  responseHeaders;
  requestId;
  networkRequest;
  constructor(fetchAgent, request, resourceType, requestId, networkRequest, responseStatusCode, responseHeaders) {
    this.#fetchAgent = fetchAgent;
    this.request = request;
    this.resourceType = resourceType;
    this.responseStatusCode = responseStatusCode;
    this.responseHeaders = responseHeaders;
    this.requestId = requestId;
    this.networkRequest = networkRequest;
  }
  hasResponded() {
    return this.#hasResponded;
  }
  static mergeSetCookieHeaders(originalSetCookieHeaders, setCookieHeadersFromOverrides) {
    const generateHeaderMap = (headers) => {
      const result = /* @__PURE__ */ new Map();
      for (const header of headers) {
        const match = header.value.match(/^([a-zA-Z0-9!#$%&'*+.^_`|~-]+=)(.*)$/);
        if (match) {
          if (result.has(match[1])) {
            result.get(match[1])?.push(header.value);
          } else {
            result.set(match[1], [header.value]);
          }
        } else if (result.has(header.value)) {
          result.get(header.value)?.push(header.value);
        } else {
          result.set(header.value, [header.value]);
        }
      }
      return result;
    };
    const originalHeadersMap = generateHeaderMap(originalSetCookieHeaders);
    const overridesHeaderMap = generateHeaderMap(setCookieHeadersFromOverrides);
    const mergedHeaders = [];
    for (const [key, headerValues] of originalHeadersMap) {
      if (overridesHeaderMap.has(key)) {
        for (const headerValue of overridesHeaderMap.get(key) || []) {
          mergedHeaders.push({ name: "set-cookie", value: headerValue });
        }
      } else {
        for (const headerValue of headerValues) {
          mergedHeaders.push({ name: "set-cookie", value: headerValue });
        }
      }
    }
    for (const [key, headerValues] of overridesHeaderMap) {
      if (originalHeadersMap.has(key)) {
        continue;
      }
      for (const headerValue of headerValues) {
        mergedHeaders.push({ name: "set-cookie", value: headerValue });
      }
    }
    return mergedHeaders;
  }
  async continueRequestWithContent(contentBlob, encoded, responseHeaders, isBodyOverridden) {
    this.#hasResponded = true;
    const body = encoded ? await contentBlob.text() : await Common.Base64.encode(contentBlob).catch((err) => {
      console.error(err);
      return "";
    });
    const responseCode = isBodyOverridden ? 200 : this.responseStatusCode || 200;
    if (this.networkRequest) {
      const originalSetCookieHeaders = this.networkRequest?.originalResponseHeaders.filter((header) => header.name === "set-cookie") || [];
      const setCookieHeadersFromOverrides = responseHeaders.filter((header) => header.name === "set-cookie");
      this.networkRequest.setCookieHeaders = InterceptedRequest.mergeSetCookieHeaders(originalSetCookieHeaders, setCookieHeadersFromOverrides);
      this.networkRequest.hasOverriddenContent = isBodyOverridden;
    }
    void this.#fetchAgent.invoke_fulfillRequest({ requestId: this.requestId, responseCode, body, responseHeaders });
    MultitargetNetworkManager.instance().dispatchEventToListeners(
      "RequestFulfilled" /* REQUEST_FULFILLED */,
      this.request.url
    );
  }
  continueRequestWithoutChange() {
    console.assert(!this.#hasResponded);
    this.#hasResponded = true;
    void this.#fetchAgent.invoke_continueRequest({ requestId: this.requestId });
  }
  async responseBody() {
    const response = await this.#fetchAgent.invoke_getResponseBody({ requestId: this.requestId });
    const error = response.getError();
    if (error) {
      return { error };
    }
    const { mimeType, charset } = this.getMimeTypeAndCharset();
    return new TextUtils.ContentData.ContentData(
      response.body,
      response.base64Encoded,
      mimeType ?? "application/octet-stream",
      charset ?? void 0
    );
  }
  isRedirect() {
    return this.responseStatusCode !== void 0 && this.responseStatusCode >= 300 && this.responseStatusCode < 400;
  }
  /**
   * Tries to determine the MIME type and charset for this intercepted request.
   * Looks at the intercepted response headers first (for Content-Type header), then
   * checks the `NetworkRequest` if we have one.
   */
  getMimeTypeAndCharset() {
    for (const header of this.responseHeaders ?? []) {
      if (header.name.toLowerCase() === "content-type") {
        return Platform.MimeType.parseContentType(header.value);
      }
    }
    const mimeType = this.networkRequest?.mimeType ?? null;
    const charset = this.networkRequest?.charset() ?? null;
    return { mimeType, charset };
  }
}
class ExtraInfoBuilder {
  #requests = [];
  #responseExtraInfoFlag = [];
  #requestExtraInfos = [];
  #responseExtraInfos = [];
  #responseEarlyHintsHeaders = [];
  #finished = false;
  addRequest(req) {
    this.#requests.push(req);
    this.sync(this.#requests.length - 1);
  }
  addHasExtraInfo(hasExtraInfo) {
    this.#responseExtraInfoFlag.push(hasExtraInfo);
    console.assert(this.#requests.length === this.#responseExtraInfoFlag.length, "request/response count mismatch");
    if (!hasExtraInfo) {
      this.#requestExtraInfos.splice(this.#requests.length - 1, 0, null);
      this.#responseExtraInfos.splice(this.#requests.length - 1, 0, null);
    }
    this.sync(this.#requests.length - 1);
  }
  addRequestExtraInfo(info) {
    this.#requestExtraInfos.push(info);
    this.sync(this.#requestExtraInfos.length - 1);
  }
  addResponseExtraInfo(info) {
    this.#responseExtraInfos.push(info);
    this.sync(this.#responseExtraInfos.length - 1);
  }
  setEarlyHintsHeaders(earlyHintsHeaders) {
    this.#responseEarlyHintsHeaders = earlyHintsHeaders;
    this.updateFinalRequest();
  }
  finished() {
    this.#finished = true;
    if (this.#responseExtraInfoFlag.length < this.#requests.length) {
      this.#responseExtraInfoFlag.push(true);
      this.sync(this.#responseExtraInfoFlag.length - 1);
    }
    console.assert(
      this.#requests.length === this.#responseExtraInfoFlag.length,
      "request/response count mismatch when request finished"
    );
    this.updateFinalRequest();
  }
  isFinished() {
    return this.#finished;
  }
  sync(index) {
    const req = this.#requests[index];
    if (!req) {
      return;
    }
    if (index >= this.#responseExtraInfoFlag.length) {
      return;
    }
    if (!this.#responseExtraInfoFlag[index]) {
      return;
    }
    const requestExtraInfo = this.#requestExtraInfos[index];
    if (requestExtraInfo) {
      req.addExtraRequestInfo(requestExtraInfo);
      this.#requestExtraInfos[index] = null;
    }
    const responseExtraInfo = this.#responseExtraInfos[index];
    if (responseExtraInfo) {
      req.addExtraResponseInfo(responseExtraInfo);
      this.#responseExtraInfos[index] = null;
    }
  }
  finalRequest() {
    if (!this.#finished) {
      return null;
    }
    return this.#requests[this.#requests.length - 1] || null;
  }
  updateFinalRequest() {
    if (!this.#finished) {
      return;
    }
    const finalRequest = this.finalRequest();
    finalRequest?.setEarlyHintsHeaders(this.#responseEarlyHintsHeaders);
  }
}
SDKModel.register(NetworkManager, { capabilities: Capability.NETWORK, autostart: true });
export function networkConditionsEqual(first, second) {
  if ("block" in first || "block" in second) {
    if ("block" in first && "block" in second) {
      const firstTitle2 = typeof first.title === "function" ? first.title() : first.title;
      const secondTitle2 = typeof second.title === "function" ? second.title() : second.title;
      return firstTitle2 === secondTitle2 && first.block === second.block;
    }
    return false;
  }
  const firstTitle = first.i18nTitleKey || (typeof first.title === "function" ? first.title() : first.title);
  const secondTitle = second.i18nTitleKey || (typeof second.title === "function" ? second.title() : second.title);
  return second.download === first.download && second.upload === first.upload && second.latency === first.latency && first.packetLoss === second.packetLoss && first.packetQueueLength === second.packetQueueLength && first.packetReordering === second.packetReordering && secondTitle === firstTitle;
}
export var PredefinedThrottlingConditionKey = /* @__PURE__ */ ((PredefinedThrottlingConditionKey2) => {
  PredefinedThrottlingConditionKey2["BLOCKING"] = "BLOCKING";
  PredefinedThrottlingConditionKey2["NO_THROTTLING"] = "NO_THROTTLING";
  PredefinedThrottlingConditionKey2["OFFLINE"] = "OFFLINE";
  PredefinedThrottlingConditionKey2["SPEED_3G"] = "SPEED_3G";
  PredefinedThrottlingConditionKey2["SPEED_SLOW_4G"] = "SPEED_SLOW_4G";
  PredefinedThrottlingConditionKey2["SPEED_FAST_4G"] = "SPEED_FAST_4G";
  return PredefinedThrottlingConditionKey2;
})(PredefinedThrottlingConditionKey || {});
export const THROTTLING_CONDITIONS_LOOKUP = /* @__PURE__ */ new Map([
  ["NO_THROTTLING" /* NO_THROTTLING */, NoThrottlingConditions],
  ["OFFLINE" /* OFFLINE */, OfflineConditions],
  ["SPEED_3G" /* SPEED_3G */, Slow3GConditions],
  ["SPEED_SLOW_4G" /* SPEED_SLOW_4G */, Slow4GConditions],
  ["SPEED_FAST_4G" /* SPEED_FAST_4G */, Fast4GConditions]
]);
function keyIsPredefined(key) {
  return !key.startsWith("USER_CUSTOM_SETTING_");
}
export function keyIsCustomUser(key) {
  return key.startsWith("USER_CUSTOM_SETTING_");
}
export function getPredefinedCondition(key) {
  if (!keyIsPredefined(key)) {
    return null;
  }
  return THROTTLING_CONDITIONS_LOOKUP.get(key) ?? null;
}
export function getPredefinedOrBlockingCondition(key) {
  return key === "BLOCKING" /* BLOCKING */ ? BlockingConditions : getPredefinedCondition(key);
}
export function getRecommendedNetworkPreset(rtt) {
  const RTT_COMPARISON_THRESHOLD = 200;
  const RTT_MINIMUM = 60;
  if (!Number.isFinite(rtt)) {
    return null;
  }
  if (rtt < RTT_MINIMUM) {
    return null;
  }
  const presets = THROTTLING_CONDITIONS_LOOKUP.values().filter((condition) => {
    return condition !== NoThrottlingConditions;
  }).toArray();
  let closestPreset = null;
  let smallestDiff = Infinity;
  for (const preset of presets) {
    const { targetLatency } = preset;
    if (!targetLatency) {
      continue;
    }
    const diff = Math.abs(targetLatency - rtt);
    if (diff > RTT_COMPARISON_THRESHOLD) {
      continue;
    }
    if (smallestDiff < diff) {
      continue;
    }
    closestPreset = preset;
    smallestDiff = diff;
  }
  return closestPreset;
}
//# sourceMappingURL=NetworkManager.js.map
