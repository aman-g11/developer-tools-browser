"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Greendev from "../greendev/greendev.js";
import { AccessibilityAgent, AccessibilityContext } from "./agents/AccessibilityAgent.js";
import {
  ErrorType,
  ResponseType
} from "./agents/AiAgent.js";
import { BreakpointDebuggerAgent } from "./agents/BreakpointDebuggerAgent.js";
import { ContextSelectionAgent } from "./agents/ContextSelectionAgent.js";
import { FileAgent, FileContext } from "./agents/FileAgent.js";
import { NetworkAgent, RequestContext } from "./agents/NetworkAgent.js";
import { PerformanceAgent, PerformanceTraceContext } from "./agents/PerformanceAgent.js";
import { NodeContext, StylingAgent } from "./agents/StylingAgent.js";
import { AiHistoryStorage, ConversationType } from "./AiHistoryStorage.js";
export const NOT_FOUND_IMAGE_DATA = "";
export const CONTEXT_TITLE = "Analyzing data";
const MAX_TITLE_LENGTH = 80;
export function generateContextDetailsMarkdown(details) {
  const detailsMarkdown = [];
  for (const detail of details) {
    const text = `\`\`\`\`${detail.codeLang || ""}
${detail.text.trim()}
\`\`\`\``;
    detailsMarkdown.push(`**${detail.title}:**
${text}`);
  }
  return detailsMarkdown.join("\n\n");
}
export class AiConversation {
  static fromSerializedConversation(serializedConversation) {
    const history = serializedConversation.history.map((entry) => {
      if (entry.type === ResponseType.SIDE_EFFECT) {
        return { ...entry, confirm: () => {
        } };
      }
      return entry;
    });
    return new AiConversation(
      serializedConversation.type,
      history,
      serializedConversation.id,
      true,
      void 0,
      void 0,
      serializedConversation.isExternal,
      void 0,
      void 0
    );
  }
  id;
  // Handled in #updateAgent
  #type;
  // Handled in #updateAgent
  #agent;
  #isReadOnly;
  history;
  #isExternal;
  #aidaClient;
  #changeManager;
  #origin;
  #contexts = [];
  #performanceRecordAndReload;
  #onInspectElement;
  #networkTimeCalculator;
  constructor(type, data = [], id = crypto.randomUUID(), isReadOnly = true, aidaClient = new Host.AidaClient.AidaClient(), changeManager, isExternal = false, performanceRecordAndReload, onInspectElement, networkTimeCalculator) {
    this.#changeManager = changeManager;
    this.#aidaClient = aidaClient;
    this.#performanceRecordAndReload = performanceRecordAndReload;
    this.#onInspectElement = onInspectElement;
    this.#networkTimeCalculator = networkTimeCalculator;
    this.id = id;
    this.#isReadOnly = isReadOnly;
    this.#isExternal = isExternal;
    this.history = this.#reconstructHistory(data);
    this.#updateAgent(type);
  }
  get isReadOnly() {
    return this.#isReadOnly;
  }
  get title() {
    const query = this.history.find((response) => response.type === ResponseType.USER_QUERY)?.query;
    if (!query) {
      return;
    }
    if (this.#isExternal) {
      return `[External] ${query.substring(0, MAX_TITLE_LENGTH - 11)}${query.length > MAX_TITLE_LENGTH - 11 ? "\u2026" : ""}`;
    }
    return `${query.substring(0, MAX_TITLE_LENGTH)}${query.length > MAX_TITLE_LENGTH ? "\u2026" : ""}`;
  }
  get isEmpty() {
    return this.history.length === 0;
  }
  #setOriginIfEmpty(newOrigin) {
    if (!this.#origin) {
      this.#origin = newOrigin;
    }
  }
  setContext(updateContext) {
    if (!updateContext) {
      this.#contexts = [];
      if (isAiAssistanceContextSelectionAgentEnabled()) {
        this.#updateAgent(ConversationType.NONE);
      }
      return;
    }
    this.#contexts = [updateContext];
    if (isAiAssistanceContextSelectionAgentEnabled()) {
      if (updateContext instanceof FileContext) {
        this.#updateAgent(ConversationType.FILE);
      } else if (updateContext instanceof NodeContext) {
        this.#updateAgent(ConversationType.STYLING);
      } else if (updateContext instanceof RequestContext) {
        this.#updateAgent(ConversationType.NETWORK);
      } else if (updateContext instanceof PerformanceTraceContext) {
        this.#updateAgent(ConversationType.PERFORMANCE);
      } else if (updateContext instanceof AccessibilityContext) {
        this.#updateAgent(ConversationType.ACCESSIBILITY);
      }
    }
  }
  get selectedContext() {
    return this.#contexts.at(0);
  }
  getPendingMultimodalInput() {
    const greenDevEmulationEnabled = Greendev.Prototypes.instance().isEnabled("emulationCapabilities");
    return greenDevEmulationEnabled ? this.#agent.popPendingMultimodalInput() : void 0;
  }
  #reconstructHistory(historyWithoutImages) {
    const imageHistory = AiHistoryStorage.instance().getImageHistory();
    if (imageHistory && imageHistory.length > 0) {
      const history = [];
      for (const data of historyWithoutImages) {
        if (data.type === ResponseType.USER_QUERY && data.imageId) {
          const image = imageHistory.find((item) => item.id === data.imageId);
          const inlineData = image ? { data: image.data, mimeType: image.mimeType } : { data: NOT_FOUND_IMAGE_DATA, mimeType: "image/jpeg" };
          history.push({ ...data, imageInput: { inlineData } });
        } else {
          history.push(data);
        }
      }
      return history;
    }
    return historyWithoutImages;
  }
  getConversationMarkdown() {
    const contentParts = [];
    contentParts.push(
      `# Exported Chat from Chrome DevTools AI Assistance

**Export Timestamp (UTC):** ${(/* @__PURE__ */ new Date()).toISOString()}

---`
    );
    for (const item of this.history) {
      switch (item.type) {
        case ResponseType.USER_QUERY: {
          contentParts.push(`## User

${item.query}`);
          if (item.imageInput) {
            contentParts.push("User attached an image");
          }
          contentParts.push("## AI");
          break;
        }
        case ResponseType.CONTEXT: {
          contentParts.push(`### ${CONTEXT_TITLE}`);
          if (item.details && item.details.length > 0) {
            contentParts.push(generateContextDetailsMarkdown(item.details));
          }
          break;
        }
        case ResponseType.TITLE: {
          contentParts.push(`### ${item.title}`);
          break;
        }
        case ResponseType.THOUGHT: {
          contentParts.push(`${item.thought}`);
          break;
        }
        case ResponseType.ACTION: {
          if (!item.output) {
            break;
          }
          if (item.code) {
            contentParts.push(`**Code executed:**
\`\`\`
${item.code.trim()}
\`\`\``);
          }
          contentParts.push(`**Data returned:**
\`\`\`
${item.output}
\`\`\``);
          break;
        }
        case ResponseType.ANSWER: {
          if (item.complete) {
            contentParts.push(`### Answer

${item.text.trim()}`);
          }
          break;
        }
      }
    }
    return contentParts.join("\n\n");
  }
  archiveConversation() {
    this.#isReadOnly = true;
  }
  async addHistoryItem(item) {
    this.history.push(item);
    await AiHistoryStorage.instance().upsertHistoryEntry(this.serialize());
    if (item.type === ResponseType.USER_QUERY) {
      if (item.imageId && item.imageInput && "inlineData" in item.imageInput) {
        const inlineData = item.imageInput.inlineData;
        await AiHistoryStorage.instance().upsertImage({
          id: item.imageId,
          data: inlineData.data,
          mimeType: inlineData.mimeType
        });
      }
    }
  }
  serialize() {
    return {
      id: this.id,
      history: this.history.map((item) => {
        switch (item.type) {
          case ResponseType.CONTEXT_CHANGE: {
            return null;
          }
          case ResponseType.USER_QUERY: {
            return { ...item, imageInput: void 0 };
          }
          case ResponseType.SIDE_EFFECT: {
            return { ...item, confirm: void 0 };
          }
          case ResponseType.CONTEXT:
          case ResponseType.ACTION: {
            return { ...item, widgets: void 0 };
          }
          default:
            return item;
        }
      }).filter((history) => !!history),
      type: this.#type,
      isExternal: this.#isExternal
    };
  }
  #updateAgent(type) {
    if (this.#type === type) {
      return;
    }
    this.#type = type;
    const history = this.#agent?.history.map((content) => {
      return {
        ...content,
        parts: content.parts.filter((part) => !("functionCall" in part) && !("functionResponse" in part))
      };
    }).filter((content) => content.parts.length > 0);
    const options = {
      aidaClient: this.#aidaClient,
      serverSideLoggingEnabled: isAiAssistanceServerSideLoggingEnabled(),
      sessionId: this.id,
      changeManager: this.#changeManager,
      performanceRecordAndReload: this.#performanceRecordAndReload,
      onInspectElement: this.#onInspectElement,
      networkTimeCalculator: this.#networkTimeCalculator,
      allowedOrigin: this.allowedOrigin,
      history
    };
    switch (type) {
      case ConversationType.STYLING: {
        this.#agent = new StylingAgent(options);
        break;
      }
      case ConversationType.NETWORK: {
        this.#agent = new NetworkAgent(options);
        break;
      }
      case ConversationType.FILE: {
        this.#agent = new FileAgent(options);
        break;
      }
      case ConversationType.PERFORMANCE: {
        this.#agent = new PerformanceAgent(options);
        break;
      }
      case ConversationType.BREAKPOINT: {
        const breakpointAgentEnabled = Greendev.Prototypes.instance().isEnabled("breakpointDebuggerAgent");
        if (breakpointAgentEnabled) {
          this.#agent = new BreakpointDebuggerAgent(options);
        }
        break;
      }
      case ConversationType.ACCESSIBILITY: {
        this.#agent = new AccessibilityAgent(options);
        break;
      }
      case ConversationType.NONE: {
        this.#agent = new ContextSelectionAgent(options);
        break;
      }
      default:
        Platform.assertNever(type, "Unknown conversation type");
    }
  }
  async *run(initialQuery, options = {}) {
    if (this.isBlockedByOrigin) {
      throw new Error("cross-origin context data should not be included");
    }
    const userQuery = {
      type: ResponseType.USER_QUERY,
      query: initialQuery,
      imageInput: options.multimodalInput?.input,
      imageId: options.multimodalInput?.id
    };
    void this.addHistoryItem(userQuery);
    yield userQuery;
    yield* this.#runAgent(initialQuery, options);
  }
  #getQueryAfterSelection(initialQuery, selection) {
    return `${selection}
Original user query: ${initialQuery}`;
  }
  async *#runAgent(initialQuery, options = {}) {
    this.#setOriginIfEmpty(this.selectedContext?.getOrigin());
    if (this.isBlockedByOrigin) {
      yield {
        type: ResponseType.ERROR,
        error: ErrorType.CROSS_ORIGIN
      };
      return;
    }
    function shouldAddToHistory(data) {
      if (data.type === ResponseType.CONTEXT_CHANGE) {
        return false;
      }
      if (data.type === ResponseType.ANSWER && !data.complete) {
        return false;
      }
      return true;
    }
    for await (const data of this.#agent.run(
      initialQuery,
      {
        signal: options.signal,
        selected: this.selectedContext ?? null
      },
      options.multimodalInput
    )) {
      if (shouldAddToHistory(data)) {
        void this.addHistoryItem(data);
      }
      yield data;
      if (data.type === ResponseType.CONTEXT_CHANGE) {
        this.setContext(data.context);
        yield* this.#runAgent(this.#getQueryAfterSelection(initialQuery, data.description), options);
        return;
      }
    }
  }
  /**
   * Indicates whether the new conversation context is blocked due to cross-origin restrictions.
   * This happens when the conversation's context has a different
   * origin than the selected context.
   */
  get isBlockedByOrigin() {
    return !this.#contexts.every((context) => context.isOriginAllowed(this.#origin));
  }
  get origin() {
    return this.#origin;
  }
  get type() {
    return this.#type;
  }
  allowedOrigin = () => {
    if (this.#origin) {
      return this.#origin;
    }
    const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    const inspectedURL = target?.inspectedURL();
    this.#origin = inspectedURL ? new Common.ParsedURL.ParsedURL(inspectedURL).securityOrigin() : void 0;
    return this.#origin;
  };
}
function isAiAssistanceServerSideLoggingEnabled() {
  return !Root.Runtime.hostConfig.aidaAvailability?.disallowLogging;
}
function isAiAssistanceContextSelectionAgentEnabled() {
  return Boolean(Root.Runtime.hostConfig.devToolsAiAssistanceContextSelectionAgent?.enabled);
}
//# sourceMappingURL=AiConversation.js.map
