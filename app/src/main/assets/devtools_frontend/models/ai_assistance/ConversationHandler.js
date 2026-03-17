"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as NetworkTimeCalculator from "../network_time_calculator/network_time_calculator.js";
import {
  ExternalRequestResponseType,
  ResponseType
} from "./agents/AiAgent.js";
import { NetworkAgent, RequestContext } from "./agents/NetworkAgent.js";
import { NodeContext, StylingAgent } from "./agents/StylingAgent.js";
import { AiConversation, CONTEXT_TITLE } from "./AiConversation.js";
import {
  ConversationType
} from "./AiHistoryStorage.js";
import { getDisabledReasons } from "./AiUtils.js";
const UIStringsNotTranslate = {
  /**
   * @description Error message shown when AI assistance is not enabled in DevTools settings.
   */
  enableInSettings: "For AI features to be available, you need to enable AI assistance in DevTools settings."
};
const lockedString = i18n.i18n.lockedString;
function isAiAssistanceServerSideLoggingEnabled() {
  return !Root.Runtime.hostConfig.aidaAvailability?.disallowLogging;
}
async function inspectElementBySelector(selector) {
  const whitespaceTrimmedQuery = selector.trim();
  if (!whitespaceTrimmedQuery.length) {
    return null;
  }
  const showUAShadowDOM = Common.Settings.Settings.instance().moduleSetting("show-ua-shadow-dom").get();
  const domModels = SDK.TargetManager.TargetManager.instance().models(SDK.DOMModel.DOMModel, { scoped: true });
  const performSearchPromises = domModels.map((domModel) => domModel.performSearch(whitespaceTrimmedQuery, showUAShadowDOM));
  const resultCounts = await Promise.all(performSearchPromises);
  const index = resultCounts.findIndex((value) => value > 0);
  if (index >= 0) {
    return await domModels[index].searchResult(0);
  }
  return null;
}
async function inspectNetworkRequestByUrl(selector) {
  const networkManagers = SDK.TargetManager.TargetManager.instance().models(SDK.NetworkManager.NetworkManager, { scoped: true });
  const results = networkManagers.map((networkManager) => {
    let request2 = networkManager.requestForURL(Platform.DevToolsPath.urlString`${selector}`);
    if (!request2 && selector.at(-1) === "/") {
      request2 = networkManager.requestForURL(Platform.DevToolsPath.urlString`${selector.slice(0, -1)}`);
    } else if (!request2 && selector.at(-1) !== "/") {
      request2 = networkManager.requestForURL(Platform.DevToolsPath.urlString`${selector}/`);
    }
    return request2;
  }).filter((req) => !!req);
  const request = results.at(0);
  return request ?? null;
}
let conversationHandlerInstance;
export class ConversationHandler extends Common.ObjectWrapper.ObjectWrapper {
  #aiAssistanceEnabledSetting;
  #aidaClient;
  #aidaAvailability;
  constructor(aidaClient, aidaAvailability) {
    super();
    this.#aidaClient = aidaClient;
    this.#aidaAvailability = aidaAvailability;
    this.#aiAssistanceEnabledSetting = this.#getAiAssistanceEnabledSetting();
  }
  static instance(opts) {
    if (opts?.forceNew || conversationHandlerInstance === void 0) {
      const aidaClient = opts?.aidaClient ?? new Host.AidaClient.AidaClient();
      conversationHandlerInstance = new ConversationHandler(aidaClient, opts?.aidaAvailability);
    }
    return conversationHandlerInstance;
  }
  static removeInstance() {
    conversationHandlerInstance = void 0;
  }
  get aidaClient() {
    return this.#aidaClient;
  }
  #getAiAssistanceEnabledSetting() {
    try {
      return Common.Settings.moduleSetting("ai-assistance-enabled");
    } catch {
      return;
    }
  }
  async #getDisabledReasons() {
    if (this.#aidaAvailability === void 0) {
      this.#aidaAvailability = await Host.AidaClient.AidaClient.checkAccessPreconditions();
    }
    return getDisabledReasons(this.#aidaAvailability);
  }
  // eslint-disable-next-line require-yield
  async *#generateErrorResponse(message) {
    return {
      type: ExternalRequestResponseType.ERROR,
      message
    };
  }
  /**
   * Handles an external request using the given prompt and uses the
   * conversation type to use the correct agent.
   */
  async handleExternalRequest(parameters) {
    try {
      this.dispatchEventToListeners("ExternalRequestReceived" /* EXTERNAL_REQUEST_RECEIVED */);
      const disabledReasons = await this.#getDisabledReasons();
      const aiAssistanceSetting = this.#aiAssistanceEnabledSetting?.getIfNotDisabled();
      if (!aiAssistanceSetting) {
        disabledReasons.push(lockedString(UIStringsNotTranslate.enableInSettings));
      }
      if (disabledReasons.length > 0) {
        return this.#generateErrorResponse(disabledReasons.join(" "));
      }
      this.dispatchEventToListeners(
        "ExternalConversationStarted" /* EXTERNAL_CONVERSATION_STARTED */,
        parameters.conversationType
      );
      switch (parameters.conversationType) {
        case ConversationType.STYLING: {
          return await this.#handleExternalStylingConversation(parameters.prompt, parameters.selector);
        }
        case ConversationType.PERFORMANCE:
          return await this.#handleExternalPerformanceConversation(parameters.prompt, parameters.data);
        case ConversationType.NETWORK:
          if (!parameters.requestUrl) {
            return this.#generateErrorResponse("The url is required for debugging a network request.");
          }
          return await this.#handleExternalNetworkConversation(parameters.prompt, parameters.requestUrl);
      }
    } catch (error) {
      return this.#generateErrorResponse(error.message);
    }
  }
  async *#createAndDoExternalConversation(opts) {
    const { conversationType, aiAgent, prompt, selected } = opts;
    const conversation = new AiConversation(
      conversationType,
      [],
      aiAgent.sessionId,
      /* isReadOnly */
      true,
      this.#aidaClient,
      void 0,
      /* isExternal */
      true
    );
    return yield* this.#doExternalConversation({ conversation, prompt, selected });
  }
  async *#doExternalConversation(opts) {
    const { conversation, prompt, selected } = opts;
    conversation.setContext(selected);
    const generator = conversation.run(prompt);
    const devToolsLogs = [];
    for await (const data of generator) {
      if (data.type !== ResponseType.ANSWER || data.complete) {
        devToolsLogs.push(data);
      }
      if (data.type === ResponseType.TITLE) {
        yield {
          type: ExternalRequestResponseType.NOTIFICATION,
          message: data.title
        };
      }
      if (data.type === ResponseType.CONTEXT) {
        yield {
          type: ExternalRequestResponseType.NOTIFICATION,
          message: CONTEXT_TITLE
        };
      }
      if (data.type === ResponseType.SIDE_EFFECT) {
        data.confirm(true);
      }
      if (data.type === ResponseType.ANSWER && data.complete) {
        return {
          type: ExternalRequestResponseType.ANSWER,
          message: data.text,
          devToolsLogs
        };
      }
    }
    return {
      type: ExternalRequestResponseType.ERROR,
      message: "Something went wrong. No answer was generated."
    };
  }
  async #handleExternalStylingConversation(prompt, selector = "body") {
    const stylingAgent = new StylingAgent({
      aidaClient: this.#aidaClient,
      serverSideLoggingEnabled: isAiAssistanceServerSideLoggingEnabled()
    });
    const node = await inspectElementBySelector(selector);
    if (node) {
      await node.setAsInspectedNode();
    }
    const selected = node ? new NodeContext(node) : null;
    return this.#createAndDoExternalConversation({
      conversationType: ConversationType.STYLING,
      aiAgent: stylingAgent,
      prompt,
      selected
    });
  }
  async #handleExternalPerformanceConversation(prompt, data) {
    return this.#doExternalConversation({
      conversation: data.conversation,
      prompt,
      selected: data.selected
    });
  }
  async #handleExternalNetworkConversation(prompt, requestUrl) {
    const networkAgent = new NetworkAgent({
      aidaClient: this.#aidaClient,
      serverSideLoggingEnabled: isAiAssistanceServerSideLoggingEnabled()
    });
    const request = await inspectNetworkRequestByUrl(requestUrl);
    if (!request) {
      return this.#generateErrorResponse(`Can't find request with the given selector ${requestUrl}`);
    }
    const calculator = new NetworkTimeCalculator.NetworkTransferTimeCalculator();
    calculator.updateBoundaries(request);
    return this.#createAndDoExternalConversation({
      conversationType: ConversationType.NETWORK,
      aiAgent: networkAgent,
      prompt,
      selected: new RequestContext(request, calculator)
    });
  }
}
export var ConversationHandlerEvents = /* @__PURE__ */ ((ConversationHandlerEvents2) => {
  ConversationHandlerEvents2["EXTERNAL_REQUEST_RECEIVED"] = "ExternalRequestReceived";
  ConversationHandlerEvents2["EXTERNAL_CONVERSATION_STARTED"] = "ExternalConversationStarted";
  return ConversationHandlerEvents2;
})(ConversationHandlerEvents || {});
//# sourceMappingURL=ConversationHandler.js.map
