"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as Common from "../common/common.js";
import * as i18n from "../i18n/i18n.js";
import * as Platform from "../platform/platform.js";
import { Attribute } from "./Cookie.js";
import { CookieModel } from "./CookieModel.js";
import { CookieParser } from "./CookieParser.js";
import * as HttpReasonPhraseStrings from "./HttpReasonPhraseStrings.js";
import {
  Events as NetworkManagerEvents,
  NetworkManager
} from "./NetworkManager.js";
import { ServerSentEvents } from "./ServerSentEvents.js";
import { ServerTiming } from "./ServerTiming.js";
import { Type } from "./Target.js";
const UIStrings = {
  /**
   * @description Text in Network Request
   */
  binary: "(binary)",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  secureOnly: 'This cookie was blocked because it had the "`Secure`" attribute and the connection was not secure.',
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  notOnPath: "This cookie was blocked because its path was not an exact match for or a superdirectory of the request url's path.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  domainMismatch: "This cookie was blocked because neither did the request URL's domain exactly match the cookie's domain, nor was the request URL's domain a subdomain of the cookie's Domain attribute value.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  sameSiteStrict: 'This cookie was blocked because it had the "`SameSite=Strict`" attribute and the request was made from a different site. This includes top-level navigation requests initiated by other sites.',
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  sameSiteLax: 'This cookie was blocked because it had the "`SameSite=Lax`" attribute and the request was made from a different site and was not initiated by a top-level navigation.',
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  sameSiteUnspecifiedTreatedAsLax: 'This cookie didn\'t specify a "`SameSite`" attribute when it was stored and was defaulted to "SameSite=Lax," and was blocked because the request was made from a different site and was not initiated by a top-level navigation. The cookie had to have been set with "`SameSite=None`" to enable cross-site usage.',
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  sameSiteNoneInsecure: 'This cookie was blocked because it had the "`SameSite=None`" attribute but was not marked "Secure". Cookies without SameSite restrictions must be marked "Secure" and sent over a secure connection.',
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  userPreferences: "This cookie was blocked due to user preferences.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  thirdPartyPhaseout: "This cookie was blocked either because of Chrome flags or browser configuration. Learn more in the Issues panel.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  unknownError: "An unknown error was encountered when trying to send this cookie.",
  /**
   * @description Tooltip to explain why a cookie was blocked due to Schemeful Same-Site
   */
  schemefulSameSiteStrict: 'This cookie was blocked because it had the "`SameSite=Strict`" attribute but the request was cross-site. This includes top-level navigation requests initiated by other sites. This request is considered cross-site because the URL has a different scheme than the current site.',
  /**
   * @description Tooltip to explain why a cookie was blocked due to Schemeful Same-Site
   */
  schemefulSameSiteLax: 'This cookie was blocked because it had the "`SameSite=Lax`" attribute but the request was cross-site and was not initiated by a top-level navigation. This request is considered cross-site because the URL has a different scheme than the current site.',
  /**
   * @description Tooltip to explain why a cookie was blocked due to Schemeful Same-Site
   */
  schemefulSameSiteUnspecifiedTreatedAsLax: 'This cookie didn\'t specify a "`SameSite`" attribute when it was stored, was defaulted to "`SameSite=Lax"`, and was blocked because the request was cross-site and was not initiated by a top-level navigation. This request is considered cross-site because the URL has a different scheme than the current site.',
  /**
   * @description Tooltip to explain why a cookie was blocked due to exceeding the maximum size
   */
  nameValuePairExceedsMaxSize: "This cookie was blocked because it was too large. The combined size of the name and value must be less than or equal to 4096 characters.",
  /**
   * @description Tooltip to explain why an attempt to set a cookie via `Set-Cookie` HTTP header on a request's response was blocked.
   */
  thisSetcookieWasBlockedDueToUser: "This attempt to set a cookie via a `Set-Cookie` header was blocked due to user preferences.",
  /**
   * @description Tooltip to explain why an attempt to set a cookie via `Set-Cookie` HTTP header on a request's response was blocked.
   */
  thisSetcookieWasBlockedDueThirdPartyPhaseout: "Setting this cookie was blocked either because of Chrome flags or browser configuration. Learn more in the Issues panel.",
  /**
   * @description Tooltip to explain why an attempt to set a cookie via `Set-Cookie` HTTP header on a request's response was blocked.
   */
  thisSetcookieHadInvalidSyntax: "This `Set-Cookie` header had invalid syntax.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  thisSetcookieHadADisallowedCharacter: "This `Set-Cookie` header contained a disallowed character (a forbidden ASCII control character, or the tab character if it appears in the middle of the cookie name, value, an attribute name, or an attribute value).",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  theSchemeOfThisConnectionIsNot: "The scheme of this connection is not allowed to store cookies.",
  /**
   * @description Tooltip to explain why a cookie was blocked
   */
  anUnknownErrorWasEncounteredWhenTrying: "An unknown error was encountered when trying to store this cookie.",
  /**
   * @description Tooltip to explain why a cookie was blocked due to Schemeful Same-Site
   * @example {SameSite=Strict} PH1
   */
  thisSetcookieWasBlockedBecauseItHadTheSamesiteStrictLax: 'This attempt to set a cookie via a `Set-Cookie` header was blocked because it had the "{PH1}" attribute but came from a cross-site response which was not the response to a top-level navigation. This response is considered cross-site because the URL has a different scheme than the current site.',
  /**
   * @description Tooltip to explain why a cookie was blocked due to Schemeful Same-Site
   */
  thisSetcookieDidntSpecifyASamesite: 'This `Set-Cookie` header didn\'t specify a "`SameSite`" attribute, was defaulted to "`SameSite=Lax"`, and was blocked because it came from a cross-site response which was not the response to a top-level navigation. This response is considered cross-site because the URL has a different scheme than the current site.',
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonSecureOnly: 'This attempt to set a cookie via a `Set-Cookie` header was blocked because it had the "Secure" attribute but was not received over a secure connection.',
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   * @example {SameSite=Strict} PH1
   */
  blockedReasonSameSiteStrictLax: 'This attempt to set a cookie via a `Set-Cookie` header was blocked because it had the "{PH1}" attribute but came from a cross-site response which was not the response to a top-level navigation.',
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonSameSiteUnspecifiedTreatedAsLax: 'This `Set-Cookie` header didn\'t specify a "`SameSite`" attribute and was defaulted to "`SameSite=Lax,`" and was blocked because it came from a cross-site response which was not the response to a top-level navigation. The `Set-Cookie` had to have been set with "`SameSite=None`" to enable cross-site usage.',
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonSameSiteNoneInsecure: 'This attempt to set a cookie via a `Set-Cookie` header was blocked because it had the "`SameSite=None`" attribute but did not have the "Secure" attribute, which is required in order to use "`SameSite=None`".',
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonOverwriteSecure: "This attempt to set a cookie via a `Set-Cookie` header was blocked because it was not sent over a secure connection and would have overwritten a cookie with the Secure attribute.",
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonInvalidDomain: "This attempt to set a cookie via a `Set-Cookie` header was blocked because its Domain attribute was invalid with regards to the current host url.",
  /**
   * @description Tooltip to explain why an attempt to set a cookie via a `Set-Cookie` HTTP header on a request's response was blocked.
   */
  blockedReasonInvalidPrefix: 'This attempt to set a cookie via a `Set-Cookie` header was blocked because it used the "`__Secure-`" or "`__Host-`" prefix in its name and broke the additional rules applied to cookies with these prefixes as defined in `https://tools.ietf.org/html/draft-west-cookie-prefixes-05`.',
  /**
   * @description Tooltip to explain why a cookie was blocked when the size of the #name plus the size of the value exceeds the max size.
   */
  thisSetcookieWasBlockedBecauseTheNameValuePairExceedsMaxSize: "This attempt to set a cookie via a `Set-Cookie` header was blocked because the cookie was too large. The combined size of the name and value must be less than or equal to 4096 characters.",
  /**
   * @description Text in Network Manager
   * @example {https://example.com} PH1
   */
  setcookieHeaderIsIgnoredIn: "Set-Cookie header is ignored in response from url: {PH1}. The combined size of the name and value must be less than or equal to 4096 characters.",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonUserSetting: "This cookie is allowed by user preference.",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonTPCDMetadata: "This cookie is allowed by a third-party cookie deprecation trial grace period. Learn more: goo.gle/dt-grace.",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonTPCDDeprecationTrial: "This cookie is allowed by third-party cookie deprecation trial. Learn more: goo.gle/ps-dt.",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonTopLevelTPCDDeprecationTrial: "This cookie is allowed by top-level third-party cookie deprecation trial. Learn more: goo.gle/ps-dt.",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonTPCDHeuristics: "This cookie is allowed by third-party cookie heuristics. Learn more: goo.gle/hbe",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonEnterprisePolicy: "This cookie is allowed by Chrome Enterprise policy. Learn more: goo.gle/ce-3pc",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonStorageAccessAPI: "This cookie is allowed by the Storage Access API. Learn more: goo.gle/saa",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonTopLevelStorageAccessAPI: "This cookie is allowed by the top-level Storage Access API. Learn more: goo.gle/saa-top",
  /**
   * @description Tooltip to explain why the cookie should have been blocked by third-party cookie phaseout but is exempted.
   */
  exemptionReasonScheme: "This cookie is allowed by the top-level url scheme"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/NetworkRequest.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class NetworkRequest extends Common.ObjectWrapper.ObjectWrapper {
  #requestId;
  #backendRequestId;
  #documentURL;
  #frameId;
  #loaderId;
  #hasUserGesture;
  #initiator;
  #redirectSource = null;
  #preflightRequest = null;
  #preflightInitiatorRequest = null;
  #isRedirect = false;
  #redirectDestination = null;
  #issueTime = -1;
  #startTime = -1;
  #endTime = -1;
  #blockedReason = void 0;
  #renderBlockingBehavior;
  #corsErrorStatus = void 0;
  statusCode = 0;
  statusText = "";
  requestMethod = "";
  requestTime = 0;
  protocol = "";
  alternateProtocolUsage = void 0;
  mixedContentType = Protocol.Security.MixedContentType.None;
  #initialPriority = null;
  #currentPriority = null;
  #signedExchangeInfo = null;
  #resourceType = Common.ResourceType.resourceTypes.Other;
  #contentData = null;
  #streamingContentData = null;
  #frames = [];
  #responseHeaderValues = {};
  #responseHeadersText = "";
  #originalResponseHeaders = [];
  #sortedOriginalResponseHeaders;
  // This field is only used when intercepting and overriding requests, because
  // in that case 'this.responseHeaders' does not contain 'set-cookie' headers.
  #setCookieHeaders = [];
  #requestHeaders = [];
  #requestHeaderValues = {};
  #remoteAddress = "";
  #remoteAddressSpace = Protocol.Network.IPAddressSpace.Unknown;
  #referrerPolicy = null;
  #securityState = Protocol.Security.SecurityState.Unknown;
  #securityDetails = null;
  connectionId = "0";
  connectionReused = false;
  hasNetworkData = false;
  #formParametersPromise = null;
  #requestFormDataPromise = Promise.resolve(null);
  #hasExtraRequestInfo = false;
  #hasExtraResponseInfo = false;
  #blockedRequestCookies = [];
  #includedRequestCookies = [];
  #blockedResponseCookies = [];
  #exemptedResponseCookies = [];
  #responseCookiesPartitionKey = null;
  #responseCookiesPartitionKeyOpaque = null;
  #deviceBoundSessionUsages = [];
  #siteHasCookieInOtherPartition = false;
  localizedFailDescription = null;
  #url;
  #responseReceivedTime;
  #transferSize;
  #finished;
  #failed;
  #canceled;
  #preserved;
  #mimeType;
  #charset;
  #parsedURL;
  #name;
  #path;
  #clientSecurityState;
  #trustTokenParams;
  #trustTokenOperationDoneEvent;
  #responseCacheStorageCacheName;
  #serviceWorkerResponseSource;
  #wallIssueTime;
  #responseRetrievalTime;
  #resourceSize;
  #fromMemoryCache;
  #fromDiskCache;
  #fromPrefetchCache;
  #fromEarlyHints;
  #fetchedViaServiceWorker;
  #serviceWorkerRouterInfo;
  #timing;
  #requestHeadersText;
  #responseHeaders;
  #earlyHintsHeaders;
  #sortedResponseHeaders;
  #responseCookies;
  #serverTimings;
  #queryString;
  #parsedQueryParameters;
  #contentDataProvider;
  #isSameSite = null;
  #wasIntercepted = false;
  #associatedData = /* @__PURE__ */ new Map();
  #hasOverriddenContent = false;
  #hasThirdPartyCookiePhaseoutIssue = false;
  #serverSentEvents;
  responseReceivedPromise;
  responseReceivedPromiseResolve;
  directSocketInfo;
  #directSocketChunks = [];
  #isAdRelated;
  #appliedNetworkConditionsId;
  constructor(requestId, backendRequestId, url, documentURL, frameId, loaderId, initiator, hasUserGesture) {
    super();
    this.#requestId = requestId;
    this.#backendRequestId = backendRequestId;
    this.setUrl(url);
    this.#documentURL = documentURL;
    this.#frameId = frameId;
    this.#loaderId = loaderId;
    this.#initiator = initiator;
    this.#hasUserGesture = hasUserGesture;
    this.#isAdRelated = false;
  }
  static create(backendRequestId, url, documentURL, frameId, loaderId, initiator, hasUserGesture) {
    return new NetworkRequest(
      backendRequestId,
      backendRequestId,
      url,
      documentURL,
      frameId,
      loaderId,
      initiator,
      hasUserGesture
    );
  }
  static createForSocket(backendRequestId, requestURL, initiator) {
    return new NetworkRequest(
      backendRequestId,
      backendRequestId,
      requestURL,
      Platform.DevToolsPath.EmptyUrlString,
      null,
      null,
      initiator || null
    );
  }
  static createWithoutBackendRequest(requestId, url, documentURL, initiator) {
    return new NetworkRequest(
      requestId,
      void 0,
      url,
      documentURL,
      null,
      null,
      initiator
    );
  }
  identityCompare(other) {
    const thisId = this.requestId();
    const thatId = other.requestId();
    if (thisId > thatId) {
      return 1;
    }
    if (thisId < thatId) {
      return -1;
    }
    return 0;
  }
  requestId() {
    return this.#requestId;
  }
  backendRequestId() {
    return this.#backendRequestId;
  }
  url() {
    return this.#url;
  }
  isBlobRequest() {
    return Common.ParsedURL.schemeIs(this.#url, "blob:");
  }
  setUrl(x) {
    if (this.#url === x) {
      return;
    }
    this.#url = x;
    this.#parsedURL = new Common.ParsedURL.ParsedURL(x);
    this.#queryString = void 0;
    this.#parsedQueryParameters = void 0;
    this.#name = void 0;
    this.#path = void 0;
  }
  get documentURL() {
    return this.#documentURL;
  }
  get parsedURL() {
    return this.#parsedURL;
  }
  get frameId() {
    return this.#frameId;
  }
  get loaderId() {
    return this.#loaderId;
  }
  get appliedNetworkConditionsId() {
    return this.#appliedNetworkConditionsId;
  }
  setRemoteAddress(ip, port) {
    this.#remoteAddress = ip + ":" + port;
    this.dispatchEventToListeners("RemoteAddressChanged" /* REMOTE_ADDRESS_CHANGED */, this);
  }
  remoteAddress() {
    return this.#remoteAddress;
  }
  remoteAddressSpace() {
    return this.#remoteAddressSpace;
  }
  /**
   * The cache #name of the CacheStorage from where the response is served via
   * the ServiceWorker.
   */
  getResponseCacheStorageCacheName() {
    return this.#responseCacheStorageCacheName;
  }
  setResponseCacheStorageCacheName(x) {
    this.#responseCacheStorageCacheName = x;
  }
  serviceWorkerResponseSource() {
    return this.#serviceWorkerResponseSource;
  }
  setServiceWorkerResponseSource(serviceWorkerResponseSource) {
    this.#serviceWorkerResponseSource = serviceWorkerResponseSource;
  }
  setReferrerPolicy(referrerPolicy) {
    this.#referrerPolicy = referrerPolicy;
  }
  referrerPolicy() {
    return this.#referrerPolicy;
  }
  securityState() {
    return this.#securityState;
  }
  setSecurityState(securityState) {
    this.#securityState = securityState;
  }
  securityDetails() {
    return this.#securityDetails;
  }
  securityOrigin() {
    return this.#parsedURL.securityOrigin();
  }
  setSecurityDetails(securityDetails) {
    this.#securityDetails = securityDetails;
  }
  get startTime() {
    return this.#startTime || -1;
  }
  setIssueTime(monotonicTime, wallTime) {
    this.#issueTime = monotonicTime;
    this.#wallIssueTime = wallTime;
    this.#startTime = monotonicTime;
  }
  issueTime() {
    return this.#issueTime;
  }
  pseudoWallTime(monotonicTime) {
    return this.#wallIssueTime ? this.#wallIssueTime - this.#issueTime + monotonicTime : monotonicTime;
  }
  get responseReceivedTime() {
    return this.#responseReceivedTime || -1;
  }
  set responseReceivedTime(x) {
    this.#responseReceivedTime = x;
  }
  /**
   * The time at which the returned response was generated. For cached
   * responses, this is the last time the cache entry was validated.
   */
  getResponseRetrievalTime() {
    return this.#responseRetrievalTime;
  }
  setResponseRetrievalTime(x) {
    this.#responseRetrievalTime = x;
  }
  get endTime() {
    return this.#endTime || -1;
  }
  set endTime(x) {
    if (this.timing?.requestTime) {
      this.#endTime = Math.max(x, this.responseReceivedTime);
    } else {
      this.#endTime = x;
      if (this.#responseReceivedTime > x) {
        this.#responseReceivedTime = x;
      }
    }
    this.dispatchEventToListeners("TimingChanged" /* TIMING_CHANGED */, this);
  }
  get duration() {
    if (this.#endTime === -1 || this.#startTime === -1) {
      return -1;
    }
    return this.#endTime - this.#startTime;
  }
  get latency() {
    if (this.#responseReceivedTime === -1 || this.#startTime === -1) {
      return -1;
    }
    return this.#responseReceivedTime - this.#startTime;
  }
  get resourceSize() {
    return this.#resourceSize || 0;
  }
  set resourceSize(x) {
    this.#resourceSize = x;
  }
  get transferSize() {
    return this.#transferSize || 0;
  }
  increaseTransferSize(x) {
    this.#transferSize = (this.#transferSize || 0) + x;
  }
  setTransferSize(x) {
    this.#transferSize = x;
  }
  get finished() {
    return this.#finished;
  }
  set finished(x) {
    if (this.#finished === x) {
      return;
    }
    this.#finished = x;
    if (x) {
      this.dispatchEventToListeners("FinishedLoading" /* FINISHED_LOADING */, this);
    }
  }
  get failed() {
    return this.#failed;
  }
  set failed(x) {
    this.#failed = x;
  }
  get canceled() {
    return this.#canceled;
  }
  set canceled(x) {
    this.#canceled = x;
  }
  get preserved() {
    return this.#preserved;
  }
  set preserved(x) {
    this.#preserved = x;
  }
  blockedReason() {
    return this.#blockedReason;
  }
  setBlockedReason(reason) {
    this.#blockedReason = reason;
  }
  setRenderBlockingBehavior(renderBlocking) {
    this.#renderBlockingBehavior = renderBlocking;
  }
  renderBlockingBehavior() {
    return this.#renderBlockingBehavior;
  }
  corsErrorStatus() {
    return this.#corsErrorStatus;
  }
  setCorsErrorStatus(corsErrorStatus) {
    this.#corsErrorStatus = corsErrorStatus;
  }
  wasBlocked() {
    return Boolean(this.#blockedReason);
  }
  cached() {
    return (Boolean(this.#fromMemoryCache) || Boolean(this.#fromDiskCache)) && !this.#transferSize;
  }
  cachedInMemory() {
    return Boolean(this.#fromMemoryCache) && !this.#transferSize;
  }
  fromPrefetchCache() {
    return Boolean(this.#fromPrefetchCache);
  }
  setFromMemoryCache() {
    this.#fromMemoryCache = true;
    this.#timing = void 0;
  }
  get fromDiskCache() {
    return this.#fromDiskCache;
  }
  setFromDiskCache() {
    this.#fromDiskCache = true;
  }
  setFromPrefetchCache() {
    this.#fromPrefetchCache = true;
  }
  fromEarlyHints() {
    return Boolean(this.#fromEarlyHints);
  }
  setFromEarlyHints() {
    this.#fromEarlyHints = true;
  }
  /**
   * Returns true if the request was intercepted by a service worker and it
   * provided its own response.
   */
  get fetchedViaServiceWorker() {
    return Boolean(this.#fetchedViaServiceWorker);
  }
  set fetchedViaServiceWorker(x) {
    this.#fetchedViaServiceWorker = x;
  }
  get serviceWorkerRouterInfo() {
    return this.#serviceWorkerRouterInfo;
  }
  set serviceWorkerRouterInfo(x) {
    this.#serviceWorkerRouterInfo = x;
  }
  /**
   * Returns true if the request was matched to a route when using the
   * ServiceWorker static routing API.
   */
  hasMatchingServiceWorkerRouter() {
    return this.#serviceWorkerRouterInfo !== void 0 && this.serviceWorkerRouterInfo?.matchedSourceType !== void 0;
  }
  /**
   * Returns true if the request was sent by a service worker.
   */
  initiatedByServiceWorker() {
    const networkManager = NetworkManager.forRequest(this);
    if (!networkManager) {
      return false;
    }
    return networkManager.target().type() === Type.ServiceWorker;
  }
  get timing() {
    return this.#timing;
  }
  set timing(timingInfo) {
    if (!timingInfo || this.#fromMemoryCache) {
      return;
    }
    this.#startTime = timingInfo.requestTime;
    const headersReceivedTime = timingInfo.requestTime + timingInfo.receiveHeadersEnd / 1e3;
    if ((this.#responseReceivedTime || -1) < 0 || this.#responseReceivedTime > headersReceivedTime) {
      this.#responseReceivedTime = headersReceivedTime;
    }
    if (this.#startTime > this.#responseReceivedTime) {
      this.#responseReceivedTime = this.#startTime;
    }
    this.#timing = timingInfo;
    this.dispatchEventToListeners("TimingChanged" /* TIMING_CHANGED */, this);
  }
  setConnectTimingFromExtraInfo(connectTiming) {
    this.#startTime = connectTiming.requestTime;
    this.dispatchEventToListeners("TimingChanged" /* TIMING_CHANGED */, this);
  }
  get mimeType() {
    return this.#mimeType;
  }
  set mimeType(x) {
    this.#mimeType = x;
    if (x === Platform.MimeType.MimeType.EVENTSTREAM && !this.#serverSentEvents) {
      const parseFromStreamedData = this.resourceType() !== Common.ResourceType.resourceTypes.EventSource;
      this.#serverSentEvents = new ServerSentEvents(
        this,
        parseFromStreamedData
      );
    }
  }
  get displayName() {
    return this.#parsedURL.displayName;
  }
  name() {
    if (this.#name) {
      return this.#name;
    }
    this.parseNameAndPathFromURL();
    return this.#name;
  }
  path() {
    if (this.#path) {
      return this.#path;
    }
    this.parseNameAndPathFromURL();
    return this.#path;
  }
  parseNameAndPathFromURL() {
    if (this.#parsedURL.isDataURL()) {
      this.#name = this.#parsedURL.dataURLDisplayName();
      this.#path = "";
    } else if (this.#parsedURL.isBlobURL()) {
      this.#name = this.#parsedURL.url;
      this.#path = "";
    } else if (this.#parsedURL.isAboutBlank()) {
      this.#name = this.#parsedURL.url;
      this.#path = "";
    } else {
      this.#path = this.#parsedURL.host + this.#parsedURL.folderPathComponents;
      const networkManager = NetworkManager.forRequest(this);
      const inspectedURL = networkManager ? Common.ParsedURL.ParsedURL.fromString(
        networkManager.target().inspectedURL()
      ) : null;
      this.#path = Platform.StringUtilities.trimURL(
        this.#path,
        inspectedURL ? inspectedURL.host : ""
      );
      if (this.#parsedURL.lastPathComponent || this.#parsedURL.queryParams) {
        this.#name = this.#parsedURL.lastPathComponent + (this.#parsedURL.queryParams ? "?" + this.#parsedURL.queryParams : "");
      } else if (this.#parsedURL.folderPathComponents) {
        this.#name = this.#parsedURL.folderPathComponents.substring(
          this.#parsedURL.folderPathComponents.lastIndexOf("/") + 1
        ) + "/";
        this.#path = this.#path.substring(
          0,
          this.#path.lastIndexOf("/")
        );
      } else {
        this.#name = this.#parsedURL.host;
        this.#path = "";
      }
    }
  }
  get folder() {
    let path = this.#parsedURL.path;
    const indexOfQuery = path.indexOf("?");
    if (indexOfQuery !== -1) {
      path = path.substring(0, indexOfQuery);
    }
    const lastSlashIndex = path.lastIndexOf("/");
    return lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : "";
  }
  get pathname() {
    return this.#parsedURL.path;
  }
  resourceType() {
    return this.#resourceType;
  }
  setResourceType(resourceType) {
    this.#resourceType = resourceType;
  }
  get domain() {
    return this.#parsedURL.host;
  }
  get scheme() {
    return this.#parsedURL.scheme;
  }
  getInferredStatusText() {
    return this.statusText || HttpReasonPhraseStrings.getStatusText(this.statusCode);
  }
  redirectSource() {
    return this.#redirectSource;
  }
  setRedirectSource(originatingRequest) {
    this.#redirectSource = originatingRequest;
  }
  preflightRequest() {
    return this.#preflightRequest;
  }
  setPreflightRequest(preflightRequest) {
    this.#preflightRequest = preflightRequest;
  }
  preflightInitiatorRequest() {
    return this.#preflightInitiatorRequest;
  }
  setPreflightInitiatorRequest(preflightInitiatorRequest) {
    this.#preflightInitiatorRequest = preflightInitiatorRequest;
  }
  isPreflightRequest() {
    return this.#initiator !== null && this.#initiator !== void 0 && this.#initiator.type === Protocol.Network.InitiatorType.Preflight;
  }
  redirectDestination() {
    return this.#redirectDestination;
  }
  setRedirectDestination(redirectDestination) {
    this.#redirectDestination = redirectDestination;
  }
  requestHeaders() {
    return this.#requestHeaders;
  }
  setRequestHeaders(headers) {
    this.#requestHeaders = headers;
    this.dispatchEventToListeners("RequestHeadersChanged" /* REQUEST_HEADERS_CHANGED */);
  }
  requestHeadersText() {
    return this.#requestHeadersText;
  }
  setRequestHeadersText(text) {
    this.#requestHeadersText = text;
    this.dispatchEventToListeners("RequestHeadersChanged" /* REQUEST_HEADERS_CHANGED */);
  }
  requestHeaderValue(headerName) {
    if (this.#requestHeaderValues[headerName]) {
      return this.#requestHeaderValues[headerName];
    }
    this.#requestHeaderValues[headerName] = this.computeHeaderValue(
      this.requestHeaders(),
      headerName
    );
    return this.#requestHeaderValues[headerName];
  }
  requestFormData() {
    if (!this.#requestFormDataPromise) {
      this.#requestFormDataPromise = NetworkManager.requestPostData(this);
    }
    return this.#requestFormDataPromise;
  }
  setRequestFormData(hasData, data) {
    this.#requestFormDataPromise = hasData && data === null ? null : Promise.resolve(data);
    this.#formParametersPromise = null;
  }
  filteredProtocolName() {
    const protocol = this.protocol.toLowerCase();
    if (protocol === "h2") {
      return "http/2.0";
    }
    return protocol.replace(/^http\/2(\.0)?\+/, "http/2.0+");
  }
  requestHttpVersion() {
    const headersText = this.requestHeadersText();
    if (!headersText) {
      const version = this.requestHeaderValue("version") || this.requestHeaderValue(":version");
      if (version) {
        return version;
      }
      return this.filteredProtocolName();
    }
    const firstLine = headersText.split(/\r\n/)[0];
    const match = firstLine.match(/(HTTP\/\d+\.\d+)$/);
    return match ? match[1] : "HTTP/0.9";
  }
  get responseHeaders() {
    return this.#responseHeaders || [];
  }
  set responseHeaders(x) {
    this.#responseHeaders = x;
    this.#sortedResponseHeaders = void 0;
    this.#serverTimings = void 0;
    this.#responseCookies = void 0;
    this.#responseHeaderValues = {};
    this.dispatchEventToListeners("ResponseHeadersChanged" /* RESPONSE_HEADERS_CHANGED */);
  }
  get earlyHintsHeaders() {
    return this.#earlyHintsHeaders || [];
  }
  set earlyHintsHeaders(x) {
    this.#earlyHintsHeaders = x;
  }
  get originalResponseHeaders() {
    return this.#originalResponseHeaders;
  }
  set originalResponseHeaders(headers) {
    this.#originalResponseHeaders = headers;
    this.#sortedOriginalResponseHeaders = void 0;
  }
  get setCookieHeaders() {
    return this.#setCookieHeaders;
  }
  set setCookieHeaders(headers) {
    this.#setCookieHeaders = headers;
  }
  get responseHeadersText() {
    return this.#responseHeadersText;
  }
  set responseHeadersText(x) {
    this.#responseHeadersText = x;
    this.dispatchEventToListeners("ResponseHeadersChanged" /* RESPONSE_HEADERS_CHANGED */);
  }
  get sortedResponseHeaders() {
    if (this.#sortedResponseHeaders !== void 0) {
      return this.#sortedResponseHeaders;
    }
    this.#sortedResponseHeaders = this.responseHeaders.slice();
    return this.#sortedResponseHeaders.sort(function(a, b) {
      return Platform.StringUtilities.compare(
        a.name.toLowerCase(),
        b.name.toLowerCase()
      );
    });
  }
  get sortedOriginalResponseHeaders() {
    if (this.#sortedOriginalResponseHeaders !== void 0) {
      return this.#sortedOriginalResponseHeaders;
    }
    this.#sortedOriginalResponseHeaders = this.originalResponseHeaders.slice();
    return this.#sortedOriginalResponseHeaders.sort(function(a, b) {
      return Platform.StringUtilities.compare(
        a.name.toLowerCase(),
        b.name.toLowerCase()
      );
    });
  }
  get overrideTypes() {
    const types = [];
    if (this.hasOverriddenContent) {
      types.push("content");
    }
    if (this.hasOverriddenHeaders()) {
      types.push("headers");
    }
    return types;
  }
  get hasOverriddenContent() {
    return this.#hasOverriddenContent;
  }
  set hasOverriddenContent(value) {
    this.#hasOverriddenContent = value;
  }
  #deduplicateHeaders(sortedHeaders) {
    const dedupedHeaders = [];
    for (const header of sortedHeaders) {
      if (dedupedHeaders.length && dedupedHeaders[dedupedHeaders.length - 1].name === header.name) {
        dedupedHeaders[dedupedHeaders.length - 1].value += `, ${header.value}`;
      } else {
        dedupedHeaders.push({ name: header.name, value: header.value });
      }
    }
    return dedupedHeaders;
  }
  hasOverriddenHeaders() {
    if (!this.#originalResponseHeaders.length) {
      return false;
    }
    const responseHeaders = this.#deduplicateHeaders(
      this.sortedResponseHeaders
    );
    const originalResponseHeaders = this.#deduplicateHeaders(
      this.sortedOriginalResponseHeaders
    );
    if (responseHeaders.length !== originalResponseHeaders.length) {
      return true;
    }
    for (let i = 0; i < responseHeaders.length; i++) {
      if (responseHeaders[i].name.toLowerCase() !== originalResponseHeaders[i].name.toLowerCase()) {
        return true;
      }
      if (responseHeaders[i].value !== originalResponseHeaders[i].value) {
        return true;
      }
    }
    return false;
  }
  responseHeaderValue(headerName) {
    if (headerName in this.#responseHeaderValues) {
      return this.#responseHeaderValues[headerName];
    }
    this.#responseHeaderValues[headerName] = this.computeHeaderValue(
      this.responseHeaders,
      headerName
    );
    return this.#responseHeaderValues[headerName];
  }
  wasIntercepted() {
    return this.#wasIntercepted;
  }
  setWasIntercepted(wasIntercepted) {
    this.#wasIntercepted = wasIntercepted;
  }
  setEarlyHintsHeaders(headers) {
    this.earlyHintsHeaders = headers;
  }
  get responseCookies() {
    if (!this.#responseCookies) {
      this.#responseCookies = CookieParser.parseSetCookie(
        this.responseHeaderValue("Set-Cookie"),
        this.domain
      ) || [];
      if (this.#responseCookiesPartitionKey) {
        for (const cookie of this.#responseCookies) {
          if (cookie.partitioned()) {
            cookie.setPartitionKey(
              this.#responseCookiesPartitionKey.topLevelSite,
              this.#responseCookiesPartitionKey.hasCrossSiteAncestor
            );
          }
        }
      } else if (this.#responseCookiesPartitionKeyOpaque) {
        for (const cookie of this.#responseCookies) {
          cookie.setPartitionKeyOpaque();
        }
      }
    }
    return this.#responseCookies;
  }
  set responseCookies(responseCookies) {
    this.#responseCookies = responseCookies;
  }
  responseLastModified() {
    return this.responseHeaderValue("last-modified");
  }
  allCookiesIncludingBlockedOnes() {
    return [
      ...this.includedRequestCookies().map(
        (includedRequestCookie) => includedRequestCookie.cookie
      ),
      ...this.responseCookies,
      ...this.blockedRequestCookies().map(
        (blockedRequestCookie) => blockedRequestCookie.cookie
      ),
      ...this.blockedResponseCookies().map(
        (blockedResponseCookie) => blockedResponseCookie.cookie
      )
    ].filter((v) => !!v);
  }
  get serverTimings() {
    if (typeof this.#serverTimings === "undefined") {
      this.#serverTimings = ServerTiming.parseHeaders(
        this.responseHeaders
      );
    }
    return this.#serverTimings;
  }
  queryString() {
    if (this.#queryString !== void 0) {
      return this.#queryString;
    }
    let queryString = null;
    const url = this.url();
    const questionMarkPosition = url.indexOf("?");
    if (questionMarkPosition !== -1) {
      queryString = url.substring(questionMarkPosition + 1);
      const hashSignPosition = queryString.indexOf("#");
      if (hashSignPosition !== -1) {
        queryString = queryString.substring(0, hashSignPosition);
      }
    }
    this.#queryString = queryString;
    return this.#queryString;
  }
  get queryParameters() {
    if (this.#parsedQueryParameters) {
      return this.#parsedQueryParameters;
    }
    const queryString = this.queryString();
    if (!queryString) {
      return null;
    }
    this.#parsedQueryParameters = this.parseParameters(queryString);
    return this.#parsedQueryParameters;
  }
  async parseFormParameters() {
    const requestContentType = this.requestContentType();
    if (!requestContentType) {
      return null;
    }
    if (requestContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i)) {
      const formData2 = await this.requestFormData();
      if (!formData2) {
        return null;
      }
      return this.parseParameters(formData2);
    }
    const multipartDetails = requestContentType.match(
      /^multipart\/form-data\s*;\s*boundary\s*=\s*(\S+)\s*$/
    );
    if (!multipartDetails) {
      return null;
    }
    const boundary = multipartDetails[1];
    if (!boundary) {
      return null;
    }
    const formData = await this.requestFormData();
    if (!formData) {
      return null;
    }
    return this.parseMultipartFormDataParameters(formData, boundary);
  }
  formParameters() {
    if (!this.#formParametersPromise) {
      this.#formParametersPromise = this.parseFormParameters();
    }
    return this.#formParametersPromise;
  }
  responseHttpVersion() {
    const headersText = this.#responseHeadersText;
    if (!headersText) {
      const version = this.responseHeaderValue("version") || this.responseHeaderValue(":version");
      if (version) {
        return version;
      }
      return this.filteredProtocolName();
    }
    const firstLine = headersText.split(/\r\n/)[0];
    const match = firstLine.match(/^(HTTP\/\d+\.\d+)/);
    return match ? match[1] : "HTTP/0.9";
  }
  parseParameters(queryString) {
    function parseNameValue(pair) {
      const position = pair.indexOf("=");
      if (position === -1) {
        return { name: pair, value: "" };
      }
      return {
        name: pair.substring(0, position),
        value: pair.substring(position + 1)
      };
    }
    return queryString.split("&").map(parseNameValue);
  }
  /**
   * Parses multipart/form-data; boundary=boundaryString request bodies -
   * --boundaryString
   * Content-Disposition: form-data; #name="field-#name"; filename="r.gif"
   * Content-Type: application/octet-stream
   *
   * optionalValue
   * --boundaryString
   * Content-Disposition: form-data; #name="field-#name-2"
   *
   * optionalValue2
   * --boundaryString--
   */
  parseMultipartFormDataParameters(data, boundary) {
    const sanitizedBoundary = Platform.StringUtilities.escapeForRegExp(boundary);
    const keyValuePattern = new RegExp(
      // Header with an optional file #name.
      '^\\r\\ncontent-disposition\\s*:\\s*form-data\\s*;\\s*name="([^"]*)"(?:\\s*;\\s*filename="([^"]*)")?(?:\\r\\ncontent-type\\s*:\\s*([^\\r\\n]*))?\\r\\n\\r\\n(.*)\\r\\n$',
      "is"
    );
    const fields = data.split(
      new RegExp(`--${sanitizedBoundary}(?:--s*$)?`, "g")
    );
    return fields.reduce(parseMultipartField, []);
    function parseMultipartField(result, field) {
      const [match, name, filename, contentType, value] = field.match(keyValuePattern) || [];
      if (!match) {
        return result;
      }
      const processedValue = filename || contentType ? i18nString(UIStrings.binary) : value;
      result.push({ name, value: processedValue });
      return result;
    }
  }
  computeHeaderValue(headers, headerName) {
    headerName = headerName.toLowerCase();
    const values = [];
    for (let i = 0; i < headers.length; ++i) {
      if (headers[i].name.toLowerCase() === headerName) {
        values.push(headers[i].value);
      }
    }
    if (!values.length) {
      return void 0;
    }
    if (headerName === "set-cookie") {
      return values.join("\n");
    }
    return values.join(", ");
  }
  requestContentData() {
    if (this.#contentData) {
      return this.#contentData;
    }
    if (this.#contentDataProvider) {
      this.#contentData = this.#contentDataProvider();
    } else {
      this.#contentData = NetworkManager.requestContentData(this);
    }
    return this.#contentData;
  }
  setContentDataProvider(dataProvider) {
    console.assert(
      !this.#contentData,
      "contentData can only be set once."
    );
    this.#contentDataProvider = dataProvider;
  }
  requestStreamingContent() {
    if (this.#streamingContentData) {
      return this.#streamingContentData;
    }
    const contentPromise = this.finished ? this.requestContentData() : NetworkManager.streamResponseBody(this);
    this.#streamingContentData = contentPromise.then((contentData) => {
      if (TextUtils.ContentData.ContentData.isError(contentData)) {
        return contentData;
      }
      return TextUtils.StreamingContentData.StreamingContentData.from(
        contentData
      );
    });
    return this.#streamingContentData;
  }
  contentURL() {
    return this.#url;
  }
  contentType() {
    return this.#resourceType;
  }
  async searchInContent(query, caseSensitive, isRegex) {
    if (!this.#contentDataProvider) {
      return await NetworkManager.searchInRequest(
        this,
        query,
        caseSensitive,
        isRegex
      );
    }
    const contentData = await this.requestContentData();
    if (TextUtils.ContentData.ContentData.isError(contentData) || !contentData.isTextContent) {
      return [];
    }
    return TextUtils.TextUtils.performSearchInContentData(
      contentData,
      query,
      caseSensitive,
      isRegex
    );
  }
  requestContentType() {
    return this.requestHeaderValue("Content-Type");
  }
  requestContentEncoding() {
    return this.requestHeaderValue("Content-Encoding");
  }
  hasErrorStatusCode() {
    return this.statusCode >= 400;
  }
  setInitialPriority(priority) {
    this.#initialPriority = priority;
  }
  initialPriority() {
    return this.#initialPriority;
  }
  setPriority(priority) {
    this.#currentPriority = priority;
  }
  priority() {
    return this.#currentPriority || this.#initialPriority || null;
  }
  setSignedExchangeInfo(info) {
    this.#signedExchangeInfo = info;
  }
  signedExchangeInfo() {
    return this.#signedExchangeInfo;
  }
  async populateImageSource(image) {
    const contentData = await this.requestContentData();
    if (TextUtils.ContentData.ContentData.isError(contentData)) {
      return;
    }
    let imageSrc = contentData.asDataUrl();
    if (imageSrc === null && !this.#failed) {
      const cacheControl = this.responseHeaderValue("cache-control") || "";
      if (!cacheControl.includes("no-cache")) {
        imageSrc = this.#url;
      }
    }
    if (imageSrc !== null) {
      image.src = imageSrc;
    }
  }
  initiator() {
    return this.#initiator || null;
  }
  hasUserGesture() {
    return this.#hasUserGesture ?? null;
  }
  frames() {
    return this.#frames;
  }
  addProtocolFrameError(errorMessage, time) {
    this.addFrame({
      type: "error" /* Error */,
      text: errorMessage,
      time: this.pseudoWallTime(time),
      opCode: -1,
      mask: false
    });
  }
  addProtocolFrame(response, time, sent) {
    const type = sent ? "send" /* Send */ : "receive" /* Receive */;
    this.addFrame({
      type,
      text: response.payloadData,
      time: this.pseudoWallTime(time),
      opCode: response.opcode,
      mask: response.mask
    });
  }
  addFrame(frame) {
    this.#frames.push(frame);
    this.dispatchEventToListeners("WebsocketFrameAdded" /* WEBSOCKET_FRAME_ADDED */, frame);
  }
  directSocketChunks() {
    return this.#directSocketChunks;
  }
  addDirectSocketChunk(chunk) {
    this.#directSocketChunks.push(chunk);
    this.dispatchEventToListeners("DirectsocketChunkAdded" /* DIRECTSOCKET_CHUNK_ADDED */, chunk);
  }
  eventSourceMessages() {
    return this.#serverSentEvents?.eventSourceMessages ?? [];
  }
  addEventSourceMessage(time, eventName, eventId, data) {
    this.#serverSentEvents?.onProtocolEventSourceMessageReceived(
      eventName,
      data,
      eventId,
      this.pseudoWallTime(time)
    );
  }
  markAsRedirect(redirectCount) {
    this.#isRedirect = true;
    this.#requestId = `${this.#backendRequestId}:redirected.${redirectCount}`;
  }
  isRedirect() {
    return this.#isRedirect;
  }
  setRequestIdForTest(requestId) {
    this.#backendRequestId = requestId;
    this.#requestId = requestId;
  }
  charset() {
    return this.#charset ?? null;
  }
  setCharset(charset) {
    this.#charset = charset;
  }
  addExtraRequestInfo(extraRequestInfo) {
    this.#blockedRequestCookies = extraRequestInfo.blockedRequestCookies;
    this.setIncludedRequestCookies(extraRequestInfo.includedRequestCookies);
    this.setRequestHeaders(extraRequestInfo.requestHeaders);
    this.#hasExtraRequestInfo = true;
    this.setRequestHeadersText("");
    this.#deviceBoundSessionUsages = extraRequestInfo.deviceBoundSessionUsages || [];
    this.#clientSecurityState = extraRequestInfo.clientSecurityState;
    this.#appliedNetworkConditionsId = extraRequestInfo.appliedNetworkConditionsId;
    if (extraRequestInfo.connectTiming) {
      this.setConnectTimingFromExtraInfo(extraRequestInfo.connectTiming);
    }
    this.#siteHasCookieInOtherPartition = extraRequestInfo.siteHasCookieInOtherPartition ?? false;
    this.#hasThirdPartyCookiePhaseoutIssue = this.#blockedRequestCookies.some(
      (item) => item.blockedReasons.includes(
        Protocol.Network.CookieBlockedReason.ThirdPartyPhaseout
      )
    );
  }
  setAppliedNetworkConditions(appliedNetworkConditionsId) {
    this.#appliedNetworkConditionsId = appliedNetworkConditionsId;
  }
  getDeviceBoundSessionUsages() {
    return this.#deviceBoundSessionUsages;
  }
  hasExtraRequestInfo() {
    return this.#hasExtraRequestInfo;
  }
  blockedRequestCookies() {
    return this.#blockedRequestCookies;
  }
  setIncludedRequestCookies(includedRequestCookies) {
    this.#includedRequestCookies = includedRequestCookies;
  }
  includedRequestCookies() {
    return this.#includedRequestCookies;
  }
  hasRequestCookies() {
    return this.#includedRequestCookies.length > 0 || this.#blockedRequestCookies.length > 0;
  }
  siteHasCookieInOtherPartition() {
    return this.#siteHasCookieInOtherPartition;
  }
  // Parse the status text from the first line of the response headers text.
  // See net::HttpResponseHeaders::GetStatusText.
  static parseStatusTextFromResponseHeadersText(responseHeadersText) {
    const firstLineParts = responseHeadersText.split("\r")[0].split(" ");
    return firstLineParts.slice(2).join(" ");
  }
  addExtraResponseInfo(extraResponseInfo) {
    this.#blockedResponseCookies = extraResponseInfo.blockedResponseCookies;
    if (extraResponseInfo.exemptedResponseCookies) {
      this.#exemptedResponseCookies = extraResponseInfo.exemptedResponseCookies;
    }
    this.#responseCookiesPartitionKey = extraResponseInfo.cookiePartitionKey ? extraResponseInfo.cookiePartitionKey : null;
    this.#responseCookiesPartitionKeyOpaque = extraResponseInfo.cookiePartitionKeyOpaque || null;
    this.responseHeaders = extraResponseInfo.responseHeaders;
    this.originalResponseHeaders = extraResponseInfo.responseHeaders.map(
      (headerEntry) => ({ ...headerEntry })
    );
    if (extraResponseInfo.responseHeadersText) {
      this.responseHeadersText = extraResponseInfo.responseHeadersText;
      if (!this.requestHeadersText()) {
        let requestHeadersText = `${this.requestMethod} ${this.parsedURL.path}`;
        if (this.parsedURL.queryParams) {
          requestHeadersText += `?${this.parsedURL.queryParams}`;
        }
        requestHeadersText += " HTTP/1.1\r\n";
        for (const { name, value } of this.requestHeaders()) {
          requestHeadersText += `${name}: ${value}\r
`;
        }
        this.setRequestHeadersText(requestHeadersText);
      }
      this.statusText = NetworkRequest.parseStatusTextFromResponseHeadersText(
        extraResponseInfo.responseHeadersText
      );
    }
    this.#remoteAddressSpace = extraResponseInfo.resourceIPAddressSpace;
    if (extraResponseInfo.statusCode) {
      this.statusCode = extraResponseInfo.statusCode;
    }
    this.#hasExtraResponseInfo = true;
    const networkManager = NetworkManager.forRequest(this);
    if (!networkManager) {
      return;
    }
    for (const blockedCookie of this.#blockedResponseCookies) {
      if (blockedCookie.blockedReasons.includes(
        Protocol.Network.SetCookieBlockedReason.NameValuePairExceedsMaxSize
      )) {
        const message = i18nString(UIStrings.setcookieHeaderIsIgnoredIn, {
          PH1: this.url()
        });
        networkManager.dispatchEventToListeners(
          NetworkManagerEvents.MessageGenerated,
          { message, requestId: this.#requestId, warning: true }
        );
      }
    }
    const cookieModel = networkManager.target().model(CookieModel);
    if (!cookieModel) {
      return;
    }
    for (const exemptedCookie of this.#exemptedResponseCookies) {
      cookieModel.removeBlockedCookie(exemptedCookie.cookie);
    }
    for (const blockedCookie of this.#blockedResponseCookies) {
      const cookie = blockedCookie.cookie;
      if (!cookie) {
        continue;
      }
      if (blockedCookie.blockedReasons.includes(
        Protocol.Network.SetCookieBlockedReason.ThirdPartyPhaseout
      )) {
        this.#hasThirdPartyCookiePhaseoutIssue = true;
      }
      cookieModel.addBlockedCookie(
        cookie,
        blockedCookie.blockedReasons.map((blockedReason) => ({
          attribute: setCookieBlockedReasonToAttribute(blockedReason),
          uiString: setCookieBlockedReasonToUiString(blockedReason)
        }))
      );
    }
  }
  hasExtraResponseInfo() {
    return this.#hasExtraResponseInfo;
  }
  blockedResponseCookies() {
    return this.#blockedResponseCookies;
  }
  exemptedResponseCookies() {
    return this.#exemptedResponseCookies;
  }
  nonBlockedResponseCookies() {
    const blockedCookieLines = this.blockedResponseCookies().map(
      (blockedCookie) => blockedCookie.cookieLine
    );
    const responseCookies = this.responseCookies.filter((cookie) => {
      const index = blockedCookieLines.indexOf(cookie.getCookieLine());
      if (index !== -1) {
        blockedCookieLines[index] = null;
        return false;
      }
      return true;
    });
    return responseCookies;
  }
  responseCookiesPartitionKey() {
    return this.#responseCookiesPartitionKey;
  }
  responseCookiesPartitionKeyOpaque() {
    return this.#responseCookiesPartitionKeyOpaque;
  }
  redirectSourceSignedExchangeInfoHasNoErrors() {
    return this.#redirectSource !== null && this.#redirectSource.#signedExchangeInfo !== null && !this.#redirectSource.#signedExchangeInfo.errors;
  }
  clientSecurityState() {
    return this.#clientSecurityState;
  }
  setTrustTokenParams(trustTokenParams) {
    this.#trustTokenParams = trustTokenParams;
  }
  trustTokenParams() {
    return this.#trustTokenParams;
  }
  setTrustTokenOperationDoneEvent(doneEvent) {
    this.#trustTokenOperationDoneEvent = doneEvent;
    this.dispatchEventToListeners("TrustTokenResultAdded" /* TRUST_TOKEN_RESULT_ADDED */);
  }
  trustTokenOperationDoneEvent() {
    return this.#trustTokenOperationDoneEvent;
  }
  setIsSameSite(isSameSite) {
    this.#isSameSite = isSameSite;
  }
  isSameSite() {
    return this.#isSameSite;
  }
  setIsAdRelated(isAdRelated) {
    this.#isAdRelated = isAdRelated;
  }
  isAdRelated() {
    return this.#isAdRelated;
  }
  getAssociatedData(key) {
    return this.#associatedData.get(key) || null;
  }
  setAssociatedData(key, data) {
    this.#associatedData.set(key, data);
  }
  deleteAssociatedData(key) {
    this.#associatedData.delete(key);
  }
  hasThirdPartyCookiePhaseoutIssue() {
    return this.#hasThirdPartyCookiePhaseoutIssue;
  }
  addDataReceivedEvent({
    timestamp,
    dataLength,
    encodedDataLength,
    data
  }) {
    this.resourceSize += dataLength;
    if (encodedDataLength !== -1) {
      this.increaseTransferSize(encodedDataLength);
    }
    this.endTime = timestamp;
    if (data) {
      void this.#streamingContentData?.then((contentData) => {
        if (!TextUtils.StreamingContentData.isError(contentData)) {
          contentData.addChunk(data);
        }
      });
    }
  }
  waitForResponseReceived() {
    if (this.responseReceivedPromise) {
      return this.responseReceivedPromise;
    }
    const { promise, resolve } = Promise.withResolvers();
    this.responseReceivedPromise = promise;
    this.responseReceivedPromiseResolve = resolve;
    return this.responseReceivedPromise;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["FINISHED_LOADING"] = "FinishedLoading";
  Events2["TIMING_CHANGED"] = "TimingChanged";
  Events2["REMOTE_ADDRESS_CHANGED"] = "RemoteAddressChanged";
  Events2["REQUEST_HEADERS_CHANGED"] = "RequestHeadersChanged";
  Events2["RESPONSE_HEADERS_CHANGED"] = "ResponseHeadersChanged";
  Events2["WEBSOCKET_FRAME_ADDED"] = "WebsocketFrameAdded";
  Events2["DIRECTSOCKET_CHUNK_ADDED"] = "DirectsocketChunkAdded";
  Events2["EVENT_SOURCE_MESSAGE_ADDED"] = "EventSourceMessageAdded";
  Events2["TRUST_TOKEN_RESULT_ADDED"] = "TrustTokenResultAdded";
  return Events2;
})(Events || {});
export var InitiatorType = /* @__PURE__ */ ((InitiatorType2) => {
  InitiatorType2["OTHER"] = "other";
  InitiatorType2["PARSER"] = "parser";
  InitiatorType2["REDIRECT"] = "redirect";
  InitiatorType2["SCRIPT"] = "script";
  InitiatorType2["PRELOAD"] = "preload";
  InitiatorType2["SIGNED_EXCHANGE"] = "signedExchange";
  InitiatorType2["PREFLIGHT"] = "preflight";
  return InitiatorType2;
})(InitiatorType || {});
export var WebSocketFrameType = /* @__PURE__ */ ((WebSocketFrameType2) => {
  WebSocketFrameType2["Send"] = "send";
  WebSocketFrameType2["Receive"] = "receive";
  WebSocketFrameType2["Error"] = "error";
  return WebSocketFrameType2;
})(WebSocketFrameType || {});
export const cookieExemptionReasonToUiString = function(exemptionReason) {
  switch (exemptionReason) {
    case Protocol.Network.CookieExemptionReason.UserSetting:
      return i18nString(UIStrings.exemptionReasonUserSetting);
    case Protocol.Network.CookieExemptionReason.TPCDMetadata:
      return i18nString(UIStrings.exemptionReasonTPCDMetadata);
    case Protocol.Network.CookieExemptionReason.TopLevelTPCDDeprecationTrial:
      return i18nString(UIStrings.exemptionReasonTopLevelTPCDDeprecationTrial);
    case Protocol.Network.CookieExemptionReason.TPCDDeprecationTrial:
      return i18nString(UIStrings.exemptionReasonTPCDDeprecationTrial);
    case Protocol.Network.CookieExemptionReason.TPCDHeuristics:
      return i18nString(UIStrings.exemptionReasonTPCDHeuristics);
    case Protocol.Network.CookieExemptionReason.EnterprisePolicy:
      return i18nString(UIStrings.exemptionReasonEnterprisePolicy);
    case Protocol.Network.CookieExemptionReason.StorageAccess:
      return i18nString(UIStrings.exemptionReasonStorageAccessAPI);
    case Protocol.Network.CookieExemptionReason.TopLevelStorageAccess:
      return i18nString(UIStrings.exemptionReasonTopLevelStorageAccessAPI);
    case Protocol.Network.CookieExemptionReason.Scheme:
      return i18nString(UIStrings.exemptionReasonScheme);
  }
  return "";
};
export const cookieBlockedReasonToUiString = function(blockedReason) {
  switch (blockedReason) {
    case Protocol.Network.CookieBlockedReason.SecureOnly:
      return i18nString(UIStrings.secureOnly);
    case Protocol.Network.CookieBlockedReason.NotOnPath:
      return i18nString(UIStrings.notOnPath);
    case Protocol.Network.CookieBlockedReason.DomainMismatch:
      return i18nString(UIStrings.domainMismatch);
    case Protocol.Network.CookieBlockedReason.SameSiteStrict:
      return i18nString(UIStrings.sameSiteStrict);
    case Protocol.Network.CookieBlockedReason.SameSiteLax:
      return i18nString(UIStrings.sameSiteLax);
    case Protocol.Network.CookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:
      return i18nString(UIStrings.sameSiteUnspecifiedTreatedAsLax);
    case Protocol.Network.CookieBlockedReason.SameSiteNoneInsecure:
      return i18nString(UIStrings.sameSiteNoneInsecure);
    case Protocol.Network.CookieBlockedReason.UserPreferences:
      return i18nString(UIStrings.userPreferences);
    case Protocol.Network.CookieBlockedReason.UnknownError:
      return i18nString(UIStrings.unknownError);
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteStrict:
      return i18nString(UIStrings.schemefulSameSiteStrict);
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteLax:
      return i18nString(UIStrings.schemefulSameSiteLax);
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteUnspecifiedTreatedAsLax:
      return i18nString(UIStrings.schemefulSameSiteUnspecifiedTreatedAsLax);
    case Protocol.Network.CookieBlockedReason.NameValuePairExceedsMaxSize:
      return i18nString(UIStrings.nameValuePairExceedsMaxSize);
    case Protocol.Network.CookieBlockedReason.ThirdPartyPhaseout:
      return i18nString(UIStrings.thirdPartyPhaseout);
  }
  return "";
};
export const setCookieBlockedReasonToUiString = function(blockedReason) {
  switch (blockedReason) {
    case Protocol.Network.SetCookieBlockedReason.SecureOnly:
      return i18nString(UIStrings.blockedReasonSecureOnly);
    case Protocol.Network.SetCookieBlockedReason.SameSiteStrict:
      return i18nString(UIStrings.blockedReasonSameSiteStrictLax, {
        PH1: "SameSite=Strict"
      });
    case Protocol.Network.SetCookieBlockedReason.SameSiteLax:
      return i18nString(UIStrings.blockedReasonSameSiteStrictLax, {
        PH1: "SameSite=Lax"
      });
    case Protocol.Network.SetCookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:
      return i18nString(UIStrings.blockedReasonSameSiteUnspecifiedTreatedAsLax);
    case Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure:
      return i18nString(UIStrings.blockedReasonSameSiteNoneInsecure);
    case Protocol.Network.SetCookieBlockedReason.UserPreferences:
      return i18nString(UIStrings.thisSetcookieWasBlockedDueToUser);
    case Protocol.Network.SetCookieBlockedReason.SyntaxError:
      return i18nString(UIStrings.thisSetcookieHadInvalidSyntax);
    case Protocol.Network.SetCookieBlockedReason.SchemeNotSupported:
      return i18nString(UIStrings.theSchemeOfThisConnectionIsNot);
    case Protocol.Network.SetCookieBlockedReason.OverwriteSecure:
      return i18nString(UIStrings.blockedReasonOverwriteSecure);
    case Protocol.Network.SetCookieBlockedReason.InvalidDomain:
      return i18nString(UIStrings.blockedReasonInvalidDomain);
    case Protocol.Network.SetCookieBlockedReason.InvalidPrefix:
      return i18nString(UIStrings.blockedReasonInvalidPrefix);
    case Protocol.Network.SetCookieBlockedReason.UnknownError:
      return i18nString(UIStrings.anUnknownErrorWasEncounteredWhenTrying);
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteStrict:
      return i18nString(
        UIStrings.thisSetcookieWasBlockedBecauseItHadTheSamesiteStrictLax,
        { PH1: "SameSite=Strict" }
      );
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteLax:
      return i18nString(
        UIStrings.thisSetcookieWasBlockedBecauseItHadTheSamesiteStrictLax,
        { PH1: "SameSite=Lax" }
      );
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteUnspecifiedTreatedAsLax:
      return i18nString(UIStrings.thisSetcookieDidntSpecifyASamesite);
    case Protocol.Network.SetCookieBlockedReason.NameValuePairExceedsMaxSize:
      return i18nString(
        UIStrings.thisSetcookieWasBlockedBecauseTheNameValuePairExceedsMaxSize
      );
    case Protocol.Network.SetCookieBlockedReason.DisallowedCharacter:
      return i18nString(UIStrings.thisSetcookieHadADisallowedCharacter);
    case Protocol.Network.SetCookieBlockedReason.ThirdPartyPhaseout:
      return i18nString(UIStrings.thisSetcookieWasBlockedDueThirdPartyPhaseout);
  }
  return "";
};
export const cookieBlockedReasonToAttribute = function(blockedReason) {
  switch (blockedReason) {
    case Protocol.Network.CookieBlockedReason.SecureOnly:
      return Attribute.SECURE;
    case Protocol.Network.CookieBlockedReason.NotOnPath:
      return Attribute.PATH;
    case Protocol.Network.CookieBlockedReason.DomainMismatch:
      return Attribute.DOMAIN;
    case Protocol.Network.CookieBlockedReason.SameSiteStrict:
    case Protocol.Network.CookieBlockedReason.SameSiteLax:
    case Protocol.Network.CookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:
    case Protocol.Network.CookieBlockedReason.SameSiteNoneInsecure:
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteStrict:
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteLax:
    case Protocol.Network.CookieBlockedReason.SchemefulSameSiteUnspecifiedTreatedAsLax:
      return Attribute.SAME_SITE;
    case Protocol.Network.CookieBlockedReason.NameValuePairExceedsMaxSize:
    case Protocol.Network.CookieBlockedReason.UserPreferences:
    case Protocol.Network.CookieBlockedReason.ThirdPartyPhaseout:
    case Protocol.Network.CookieBlockedReason.UnknownError:
      return null;
  }
  return null;
};
export const setCookieBlockedReasonToAttribute = function(blockedReason) {
  switch (blockedReason) {
    case Protocol.Network.SetCookieBlockedReason.SecureOnly:
    case Protocol.Network.SetCookieBlockedReason.OverwriteSecure:
      return Attribute.SECURE;
    case Protocol.Network.SetCookieBlockedReason.SameSiteStrict:
    case Protocol.Network.SetCookieBlockedReason.SameSiteLax:
    case Protocol.Network.SetCookieBlockedReason.SameSiteUnspecifiedTreatedAsLax:
    case Protocol.Network.SetCookieBlockedReason.SameSiteNoneInsecure:
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteStrict:
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteLax:
    case Protocol.Network.SetCookieBlockedReason.SchemefulSameSiteUnspecifiedTreatedAsLax:
      return Attribute.SAME_SITE;
    case Protocol.Network.SetCookieBlockedReason.InvalidDomain:
      return Attribute.DOMAIN;
    case Protocol.Network.SetCookieBlockedReason.InvalidPrefix:
      return Attribute.NAME;
    case Protocol.Network.SetCookieBlockedReason.NameValuePairExceedsMaxSize:
    case Protocol.Network.SetCookieBlockedReason.UserPreferences:
    case Protocol.Network.SetCookieBlockedReason.ThirdPartyPhaseout:
    case Protocol.Network.SetCookieBlockedReason.SyntaxError:
    case Protocol.Network.SetCookieBlockedReason.SchemeNotSupported:
    case Protocol.Network.SetCookieBlockedReason.UnknownError:
    case Protocol.Network.SetCookieBlockedReason.DisallowedCharacter:
      return null;
  }
  return null;
};
export var DirectSocketType = /* @__PURE__ */ ((DirectSocketType2) => {
  DirectSocketType2[DirectSocketType2["TCP"] = 1] = "TCP";
  DirectSocketType2[DirectSocketType2["UDP_BOUND"] = 2] = "UDP_BOUND";
  DirectSocketType2[DirectSocketType2["UDP_CONNECTED"] = 3] = "UDP_CONNECTED";
  return DirectSocketType2;
})(DirectSocketType || {});
export var DirectSocketStatus = /* @__PURE__ */ ((DirectSocketStatus2) => {
  DirectSocketStatus2[DirectSocketStatus2["OPENING"] = 1] = "OPENING";
  DirectSocketStatus2[DirectSocketStatus2["OPEN"] = 2] = "OPEN";
  DirectSocketStatus2[DirectSocketStatus2["CLOSED"] = 3] = "CLOSED";
  DirectSocketStatus2[DirectSocketStatus2["ABORTED"] = 4] = "ABORTED";
  return DirectSocketStatus2;
})(DirectSocketStatus || {});
export var DirectSocketChunkType = /* @__PURE__ */ ((DirectSocketChunkType2) => {
  DirectSocketChunkType2["SEND"] = "send";
  DirectSocketChunkType2["RECEIVE"] = "receive";
  return DirectSocketChunkType2;
})(DirectSocketChunkType || {});
//# sourceMappingURL=NetworkRequest.js.map
