"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
const UIStrings = {
  /**
   * @description When DevTools doesn't know the URL that initiated a network request, we
   * show this phrase instead. 'unknown' would also work in this context.
   */
  anonymous: "<anonymous>"
};
const str_ = i18n.i18n.registerUIStrings("models/logs/NetworkLog.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let networkLogInstance;
export class NetworkLog extends Common.ObjectWrapper.ObjectWrapper {
  #requests = [];
  #sentNetworkRequests = [];
  #receivedNetworkResponses = [];
  #requestsSet = /* @__PURE__ */ new Set();
  #requestsMap = /* @__PURE__ */ new Map();
  #pageLoadForManager = /* @__PURE__ */ new Map();
  #unresolvedPreflightRequests = /* @__PURE__ */ new Map();
  #modelListeners = /* @__PURE__ */ new WeakMap();
  #initiatorData = /* @__PURE__ */ new WeakMap();
  #isRecording = true;
  constructor() {
    super();
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.NetworkManager.NetworkManager, this);
    const recordLogSetting = Common.Settings.Settings.instance().moduleSetting("network-log.record-log");
    recordLogSetting.addChangeListener(() => {
      const preserveLogSetting = Common.Settings.Settings.instance().moduleSetting("network-log.preserve-log");
      if (!preserveLogSetting.get() && recordLogSetting.get()) {
        this.reset(true);
      }
      this.setIsRecording(recordLogSetting.get());
    }, this);
  }
  static instance() {
    if (!networkLogInstance) {
      networkLogInstance = new NetworkLog();
    }
    return networkLogInstance;
  }
  static removeInstance() {
    networkLogInstance = void 0;
  }
  modelAdded(networkManager) {
    const eventListeners = [];
    eventListeners.push(
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestStarted, this.onRequestStarted, this)
    );
    eventListeners.push(
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestUpdated, this.onRequestUpdated, this)
    );
    eventListeners.push(
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestRedirected, this.onRequestRedirect, this)
    );
    eventListeners.push(
      networkManager.addEventListener(SDK.NetworkManager.Events.RequestFinished, this.onRequestUpdated, this)
    );
    eventListeners.push(networkManager.addEventListener(
      SDK.NetworkManager.Events.MessageGenerated,
      this.networkMessageGenerated.bind(this, networkManager)
    ));
    eventListeners.push(
      networkManager.addEventListener(SDK.NetworkManager.Events.ResponseReceived, this.onResponseReceived, this)
    );
    const resourceTreeModel = networkManager.target().model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (resourceTreeModel) {
      eventListeners.push(
        resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.WillReloadPage, this.willReloadPage, this)
      );
      eventListeners.push(resourceTreeModel.addEventListener(
        SDK.ResourceTreeModel.Events.PrimaryPageChanged,
        this.onPrimaryPageChanged,
        this
      ));
      eventListeners.push(resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.Load, this.onLoad, this));
      eventListeners.push(resourceTreeModel.addEventListener(
        SDK.ResourceTreeModel.Events.DOMContentLoaded,
        this.onDOMContentLoaded.bind(this, resourceTreeModel)
      ));
    }
    this.#modelListeners.set(networkManager, eventListeners);
  }
  modelRemoved(networkManager) {
    this.removeNetworkManagerListeners(networkManager);
  }
  removeNetworkManagerListeners(networkManager) {
    Common.EventTarget.removeEventListeners(this.#modelListeners.get(networkManager) || []);
  }
  setIsRecording(enabled) {
    if (this.#isRecording === enabled) {
      return;
    }
    this.#isRecording = enabled;
    if (enabled) {
      SDK.TargetManager.TargetManager.instance().observeModels(SDK.NetworkManager.NetworkManager, this);
    } else {
      SDK.TargetManager.TargetManager.instance().unobserveModels(SDK.NetworkManager.NetworkManager, this);
      SDK.TargetManager.TargetManager.instance().models(SDK.NetworkManager.NetworkManager).forEach(this.removeNetworkManagerListeners.bind(this));
    }
  }
  requestForURL(url) {
    return this.#requests.find((request) => request.url() === url) || null;
  }
  originalRequestForURL(url) {
    return this.#sentNetworkRequests.find((request) => request.url === url) || null;
  }
  originalResponseForURL(url) {
    return this.#receivedNetworkResponses.find((response) => response.url === url) || null;
  }
  requests() {
    return this.#requests;
  }
  requestByManagerAndId(networkManager, requestId) {
    for (let i = this.#requests.length - 1; i >= 0; i--) {
      const request = this.#requests[i];
      if (requestId === request.requestId() && networkManager === SDK.NetworkManager.NetworkManager.forRequest(request)) {
        return request;
      }
    }
    return null;
  }
  requestByManagerAndURL(networkManager, url) {
    for (const request of this.#requests) {
      if (url === request.url() && networkManager === SDK.NetworkManager.NetworkManager.forRequest(request)) {
        return request;
      }
    }
    return null;
  }
  initializeInitiatorSymbolIfNeeded(request) {
    let initiatorInfo = this.#initiatorData.get(request);
    if (initiatorInfo) {
      return initiatorInfo;
    }
    initiatorInfo = {
      info: null,
      chain: null
    };
    this.#initiatorData.set(request, initiatorInfo);
    return initiatorInfo;
  }
  static initiatorInfoForRequest(request, existingInitiatorData) {
    const initiatorInfo = existingInitiatorData || {
      info: null,
      chain: null
    };
    let type = SDK.NetworkRequest.InitiatorType.OTHER;
    let url = Platform.DevToolsPath.EmptyUrlString;
    let lineNumber = void 0;
    let columnNumber = void 0;
    let scriptId = null;
    let initiatorStack = null;
    let initiatorRequest = null;
    const initiator = request.initiator();
    const redirectSource = request.redirectSource();
    if (redirectSource) {
      type = SDK.NetworkRequest.InitiatorType.REDIRECT;
      url = redirectSource.url();
    } else if (initiator) {
      if (initiator.type === Protocol.Network.InitiatorType.Parser) {
        type = SDK.NetworkRequest.InitiatorType.PARSER;
        url = initiator.url ? initiator.url : url;
        lineNumber = initiator.lineNumber;
        columnNumber = initiator.columnNumber;
      } else if (initiator.type === Protocol.Network.InitiatorType.Script) {
        for (let stack = initiator.stack; stack; ) {
          const topFrame = stack.callFrames.length ? stack.callFrames[0] : null;
          if (!topFrame) {
            stack = stack.parent;
            continue;
          }
          type = SDK.NetworkRequest.InitiatorType.SCRIPT;
          url = topFrame.url || i18nString(UIStrings.anonymous);
          lineNumber = topFrame.lineNumber;
          columnNumber = topFrame.columnNumber;
          scriptId = topFrame.scriptId;
          break;
        }
        if (!initiator.stack && initiator.url) {
          type = SDK.NetworkRequest.InitiatorType.SCRIPT;
          url = initiator.url;
          lineNumber = initiator.lineNumber;
        }
        if (initiator.stack?.callFrames?.length) {
          initiatorStack = initiator.stack;
        }
      } else if (initiator.type === Protocol.Network.InitiatorType.Preload) {
        type = SDK.NetworkRequest.InitiatorType.PRELOAD;
      } else if (initiator.type === Protocol.Network.InitiatorType.Preflight) {
        type = SDK.NetworkRequest.InitiatorType.PREFLIGHT;
        initiatorRequest = request.preflightInitiatorRequest();
      } else if (initiator.type === Protocol.Network.InitiatorType.SignedExchange) {
        type = SDK.NetworkRequest.InitiatorType.SIGNED_EXCHANGE;
        url = initiator.url || Platform.DevToolsPath.EmptyUrlString;
      }
    }
    initiatorInfo.info = { type, url, lineNumber, columnNumber, scriptId, stack: initiatorStack, initiatorRequest };
    return initiatorInfo.info;
  }
  initiatorInfoForRequest(request) {
    const initiatorInfo = this.initializeInitiatorSymbolIfNeeded(request);
    if (initiatorInfo.info) {
      return initiatorInfo.info;
    }
    return NetworkLog.initiatorInfoForRequest(request, initiatorInfo);
  }
  initiatorGraphForRequest(request) {
    const initiated = /* @__PURE__ */ new Map();
    const networkManager = SDK.NetworkManager.NetworkManager.forRequest(request);
    for (const otherRequest of this.#requests) {
      const otherRequestManager = SDK.NetworkManager.NetworkManager.forRequest(otherRequest);
      if (networkManager === otherRequestManager && this.initiatorChain(otherRequest).has(request)) {
        const initiatorRequest = this.initiatorRequest(otherRequest);
        if (initiatorRequest) {
          initiated.set(otherRequest, initiatorRequest);
        }
      }
    }
    return { initiators: this.initiatorChain(request), initiated };
  }
  initiatorChain(request) {
    const initiatorDataForRequest = this.initializeInitiatorSymbolIfNeeded(request);
    let initiatorChainCache = initiatorDataForRequest.chain;
    if (initiatorChainCache) {
      return initiatorChainCache;
    }
    initiatorChainCache = /* @__PURE__ */ new Set();
    let checkRequest = request;
    while (checkRequest) {
      const initiatorData = this.initializeInitiatorSymbolIfNeeded(checkRequest);
      if (initiatorData.chain) {
        initiatorChainCache = initiatorChainCache.union(initiatorData.chain);
        break;
      }
      if (initiatorChainCache.has(checkRequest)) {
        break;
      }
      initiatorChainCache.add(checkRequest);
      checkRequest = this.initiatorRequest(checkRequest);
    }
    initiatorDataForRequest.chain = initiatorChainCache;
    return initiatorChainCache;
  }
  initiatorRequest(request) {
    const initiatorData = this.initializeInitiatorSymbolIfNeeded(request);
    if (initiatorData.request !== void 0) {
      return initiatorData.request;
    }
    const url = this.initiatorInfoForRequest(request).url;
    const networkManager = SDK.NetworkManager.NetworkManager.forRequest(request);
    initiatorData.request = networkManager ? this.requestByManagerAndURL(networkManager, url) : null;
    return initiatorData.request;
  }
  willReloadPage() {
    if (!Common.Settings.Settings.instance().moduleSetting("network-log.preserve-log").get()) {
      this.reset(true);
    }
  }
  onPrimaryPageChanged(event) {
    const mainFrame = event.data.frame;
    const manager = mainFrame.resourceTreeModel().target().model(SDK.NetworkManager.NetworkManager);
    if (!manager || mainFrame.resourceTreeModel().target().parentTarget()?.type() === SDK.Target.Type.FRAME) {
      return;
    }
    if (mainFrame.url !== mainFrame.unreachableUrl() && Common.ParsedURL.schemeIs(mainFrame.url, "chrome-error:")) {
      return;
    }
    const preserveLog = Common.Settings.Settings.instance().moduleSetting("network-log.preserve-log").get();
    const oldRequests = this.#requests;
    const oldManagerRequests = this.#requests.filter((request) => SDK.NetworkManager.NetworkManager.forRequest(request) === manager);
    const oldRequestsSet = this.#requestsSet;
    this.#requests = [];
    this.#sentNetworkRequests = [];
    this.#receivedNetworkResponses = [];
    this.#requestsSet = /* @__PURE__ */ new Set();
    this.#requestsMap.clear();
    this.#unresolvedPreflightRequests.clear();
    this.dispatchEventToListeners("Reset" /* Reset */, { clearIfPreserved: !preserveLog });
    let currentPageLoad = null;
    const requestsToAdd = [];
    for (const request of oldManagerRequests) {
      if (event.data.type !== SDK.ResourceTreeModel.PrimaryPageChangeType.ACTIVATION && request.loaderId !== mainFrame.loaderId) {
        continue;
      }
      if (!currentPageLoad) {
        currentPageLoad = new SDK.PageLoad.PageLoad(request);
        let redirectSource = request.redirectSource();
        while (redirectSource) {
          requestsToAdd.push(redirectSource);
          redirectSource = redirectSource.redirectSource();
        }
      }
      requestsToAdd.push(request);
    }
    const serviceWorkerRequestsToAdd = [];
    for (const swRequest of oldRequests) {
      if (!swRequest.initiatedByServiceWorker()) {
        continue;
      }
      const keepRequest = requestsToAdd.some(
        (request) => request.url() === swRequest.url() && request.issueTime() <= swRequest.issueTime()
      );
      if (keepRequest) {
        serviceWorkerRequestsToAdd.push(swRequest);
      }
    }
    requestsToAdd.push(...serviceWorkerRequestsToAdd);
    for (const request of requestsToAdd) {
      currentPageLoad?.bindRequest(request);
      oldRequestsSet.delete(request);
      this.addRequest(request);
    }
    if (preserveLog) {
      for (const request of oldRequestsSet) {
        this.addRequest(request, true);
        request.preserved = true;
      }
    }
    if (currentPageLoad) {
      this.#pageLoadForManager.set(manager, currentPageLoad);
    }
  }
  addRequest(request, preserveLog) {
    this.#requests.push(request);
    this.#requestsSet.add(request);
    const requestList = this.#requestsMap.get(request.requestId());
    if (!requestList) {
      this.#requestsMap.set(request.requestId(), [request]);
    } else {
      requestList.push(request);
    }
    this.tryResolvePreflightRequests(request);
    this.dispatchEventToListeners("RequestAdded" /* RequestAdded */, { request, preserveLog });
  }
  removeRequest(request) {
    const index = this.#requests.indexOf(request);
    if (index > -1) {
      this.#requests.splice(index, 1);
    }
    this.#requestsSet.delete(request);
    this.#requestsMap.delete(request.requestId());
    this.dispatchEventToListeners("RequestRemoved" /* RequestRemoved */, { request });
  }
  tryResolvePreflightRequests(request) {
    if (request.isPreflightRequest()) {
      const initiator = request.initiator();
      if (initiator?.requestId) {
        const [initiatorRequest] = this.requestsForId(initiator.requestId);
        if (initiatorRequest) {
          request.setPreflightInitiatorRequest(initiatorRequest);
          initiatorRequest.setPreflightRequest(request);
        } else {
          this.#unresolvedPreflightRequests.set(initiator.requestId, request);
        }
      }
    } else {
      const preflightRequest = this.#unresolvedPreflightRequests.get(request.requestId());
      if (preflightRequest) {
        this.#unresolvedPreflightRequests.delete(request.requestId());
        request.setPreflightRequest(preflightRequest);
        preflightRequest.setPreflightInitiatorRequest(request);
        const data = this.#initiatorData.get(preflightRequest);
        if (data) {
          data.info = null;
        }
        this.dispatchEventToListeners("RequestUpdated" /* RequestUpdated */, { request: preflightRequest });
      }
    }
  }
  importRequests(requests) {
    this.reset(true);
    this.#requests = [];
    this.#sentNetworkRequests = [];
    this.#receivedNetworkResponses = [];
    this.#requestsSet.clear();
    this.#requestsMap.clear();
    this.#unresolvedPreflightRequests.clear();
    for (const request of requests) {
      this.addRequest(request);
    }
  }
  onRequestStarted(event) {
    const { request, originalRequest } = event.data;
    if (originalRequest) {
      this.#sentNetworkRequests.push(originalRequest);
    }
    this.#requestsSet.add(request);
    const manager = SDK.NetworkManager.NetworkManager.forRequest(request);
    const pageLoad = manager ? this.#pageLoadForManager.get(manager) : null;
    if (pageLoad) {
      pageLoad.bindRequest(request);
    }
    this.addRequest(request);
  }
  onResponseReceived(event) {
    const response = event.data.response;
    this.#receivedNetworkResponses.push(response);
  }
  onRequestUpdated(event) {
    const request = event.data;
    if (!this.#requestsSet.has(request)) {
      return;
    }
    this.dispatchEventToListeners("RequestUpdated" /* RequestUpdated */, { request });
  }
  onRequestRedirect(event) {
    this.#initiatorData.delete(event.data);
  }
  onDOMContentLoaded(resourceTreeModel, event) {
    const networkManager = resourceTreeModel.target().model(SDK.NetworkManager.NetworkManager);
    const pageLoad = networkManager ? this.#pageLoadForManager.get(networkManager) : null;
    if (pageLoad) {
      pageLoad.contentLoadTime = event.data;
    }
  }
  onLoad(event) {
    const networkManager = event.data.resourceTreeModel.target().model(SDK.NetworkManager.NetworkManager);
    const pageLoad = networkManager ? this.#pageLoadForManager.get(networkManager) : null;
    if (pageLoad) {
      pageLoad.loadTime = event.data.loadTime;
    }
  }
  reset(clearIfPreserved) {
    this.#requests = [];
    this.#sentNetworkRequests = [];
    this.#receivedNetworkResponses = [];
    this.#requestsSet.clear();
    this.#requestsMap.clear();
    this.#unresolvedPreflightRequests.clear();
    const managers = new Set(
      SDK.TargetManager.TargetManager.instance().models(SDK.NetworkManager.NetworkManager)
    );
    for (const manager of this.#pageLoadForManager.keys()) {
      if (!managers.has(manager)) {
        this.#pageLoadForManager.delete(manager);
      }
    }
    this.dispatchEventToListeners("Reset" /* Reset */, { clearIfPreserved });
  }
  networkMessageGenerated(networkManager, event) {
    const { message, warning, requestId } = event.data;
    const consoleMessage = new SDK.ConsoleModel.ConsoleMessage(
      networkManager.target().model(SDK.RuntimeModel.RuntimeModel),
      Protocol.Log.LogEntrySource.Network,
      warning ? Protocol.Log.LogEntryLevel.Warning : Protocol.Log.LogEntryLevel.Info,
      message
    );
    this.associateConsoleMessageWithRequest(consoleMessage, requestId);
    networkManager.target().model(SDK.ConsoleModel.ConsoleModel)?.addMessage(consoleMessage);
  }
  associateConsoleMessageWithRequest(consoleMessage, requestId) {
    const target = consoleMessage.target();
    const networkManager = target ? target.model(SDK.NetworkManager.NetworkManager) : null;
    if (!networkManager) {
      return;
    }
    const request = this.requestByManagerAndId(networkManager, requestId);
    if (!request) {
      return;
    }
    consoleMessageToRequest.set(consoleMessage, request);
    const initiator = request.initiator();
    if (initiator) {
      consoleMessage.stackTrace = initiator.stack || void 0;
      if (initiator.url) {
        consoleMessage.url = initiator.url;
        consoleMessage.line = initiator.lineNumber || 0;
      }
    }
  }
  static requestForConsoleMessage(consoleMessage) {
    return consoleMessageToRequest.get(consoleMessage) || null;
  }
  requestsForId(requestId) {
    return this.#requestsMap.get(requestId) || [];
  }
}
const consoleMessageToRequest = /* @__PURE__ */ new WeakMap();
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["Reset"] = "Reset";
  Events2["RequestAdded"] = "RequestAdded";
  Events2["RequestUpdated"] = "RequestUpdated";
  Events2["RequestRemoved"] = "RequestRemoved";
  return Events2;
})(Events || {});
//# sourceMappingURL=NetworkLog.js.map
