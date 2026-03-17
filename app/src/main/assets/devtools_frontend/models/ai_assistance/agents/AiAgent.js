"use strict";
import * as Host from "../../../core/host/host.js";
import * as Root from "../../../core/root/root.js";
import * as Greendev from "../../greendev/greendev.js";
import { debugLog, isStructuredLogEnabled } from "../debug.js";
export var ResponseType = /* @__PURE__ */ ((ResponseType2) => {
  ResponseType2["CONTEXT"] = "context";
  ResponseType2["TITLE"] = "title";
  ResponseType2["THOUGHT"] = "thought";
  ResponseType2["ACTION"] = "action";
  ResponseType2["SIDE_EFFECT"] = "side-effect";
  ResponseType2["SUGGESTIONS"] = "suggestions";
  ResponseType2["ANSWER"] = "answer";
  ResponseType2["ERROR"] = "error";
  ResponseType2["QUERYING"] = "querying";
  ResponseType2["USER_QUERY"] = "user-query";
  ResponseType2["CONTEXT_CHANGE"] = "context-change";
  return ResponseType2;
})(ResponseType || {});
export var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["UNKNOWN"] = "unknown";
  ErrorType2["ABORT"] = "abort";
  ErrorType2["MAX_STEPS"] = "max-steps";
  ErrorType2["BLOCK"] = "block";
  ErrorType2["CROSS_ORIGIN"] = "cross-origin";
  return ErrorType2;
})(ErrorType || {});
export var MultimodalInputType = /* @__PURE__ */ ((MultimodalInputType2) => {
  MultimodalInputType2["SCREENSHOT"] = "screenshot";
  MultimodalInputType2["UPLOADED_IMAGE"] = "uploaded-image";
  return MultimodalInputType2;
})(MultimodalInputType || {});
export const MAX_STEPS = 10;
export var ExternalRequestResponseType = /* @__PURE__ */ ((ExternalRequestResponseType2) => {
  ExternalRequestResponseType2["ANSWER"] = "answer";
  ExternalRequestResponseType2["NOTIFICATION"] = "notification";
  ExternalRequestResponseType2["ERROR"] = "error";
  return ExternalRequestResponseType2;
})(ExternalRequestResponseType || {});
export class ConversationContext {
  isOriginAllowed(agentOrigin) {
    if (!agentOrigin) {
      return true;
    }
    return this.getOrigin() === agentOrigin;
  }
  /**
   * This method is called at the start of `AiAgent.run`.
   * It will be overridden in subclasses to fetch data related to the context item.
   */
  async refresh() {
    return;
  }
  async getSuggestions() {
    return;
  }
}
export class AiAgent {
  #sessionId;
  #aidaClient;
  #serverSideLoggingEnabled;
  confirmSideEffect;
  #functionDeclarations = /* @__PURE__ */ new Map();
  /**
   * Used in the debug mode and evals.
   */
  #structuredLog = [];
  /**
   * `context` does not change during `AiAgent.run()`, ensuring that calls to JS
   * have the correct `context`. We don't want element selection by the user to
   * change the `context` during an `AiAgent.run()`.
   */
  context;
  #history;
  #facts = /* @__PURE__ */ new Set();
  constructor(opts) {
    this.#aidaClient = opts.aidaClient;
    this.#serverSideLoggingEnabled = opts.serverSideLoggingEnabled ?? false;
    if (Root.Runtime.hostConfig.devToolsGeminiRebranding?.enabled) {
      this.#serverSideLoggingEnabled = false;
    }
    this.#sessionId = opts.sessionId ?? crypto.randomUUID();
    this.confirmSideEffect = opts.confirmSideEffectForTest ?? (() => Promise.withResolvers());
    this.#history = opts.history ?? [];
  }
  async enhanceQuery(query) {
    return query;
  }
  currentFacts() {
    return this.#facts;
  }
  get history() {
    return [...this.#history];
  }
  /**
   * Add a fact which will be sent for any subsequent requests.
   * Returns the new list of all facts.
   * Facts are never automatically removed.
   */
  addFact(fact) {
    this.#facts.add(fact);
    return this.#facts;
  }
  removeFact(fact) {
    return this.#facts.delete(fact);
  }
  clearFacts() {
    this.#facts.clear();
  }
  popPendingMultimodalInput() {
    return void 0;
  }
  preambleFeatures() {
    return [];
  }
  buildRequest(part, role) {
    const parts = Array.isArray(part) ? part : [part];
    const currentMessage = {
      parts,
      role
    };
    const history = [...this.#history];
    const declarations = [];
    for (const [name, definition] of this.#functionDeclarations.entries()) {
      declarations.push({
        name,
        description: definition.description,
        parameters: definition.parameters
      });
    }
    function validTemperature(temperature) {
      return typeof temperature === "number" && temperature >= 0 ? temperature : void 0;
    }
    const enableAidaFunctionCalling = declarations.length;
    const userTier = Host.AidaClient.convertToUserTierEnum(this.userTier);
    const preamble = userTier === Host.AidaClient.UserTier.TESTERS ? this.preamble : void 0;
    const facts = Array.from(this.#facts);
    const request = {
      client: Host.AidaClient.CLIENT_NAME,
      current_message: currentMessage,
      preamble,
      historical_contexts: history.length ? history : void 0,
      facts: facts.length ? facts : void 0,
      ...enableAidaFunctionCalling ? { function_declarations: declarations } : {},
      options: {
        temperature: validTemperature(this.options.temperature),
        model_id: this.options.modelId || void 0
      },
      metadata: {
        disable_user_content_logging: !(this.#serverSideLoggingEnabled ?? false),
        string_session_id: this.#sessionId,
        user_tier: userTier,
        client_version: Root.Runtime.getChromeVersion() + this.preambleFeatures().map((feature) => `+${feature}`).join("")
      },
      functionality_type: enableAidaFunctionCalling ? Host.AidaClient.FunctionalityType.AGENTIC_CHAT : Host.AidaClient.FunctionalityType.CHAT,
      client_feature: this.clientFeature
    };
    return request;
  }
  get sessionId() {
    return this.#sessionId;
  }
  /**
   * The AI has instructions to emit structured suggestions in their response. This
   * function parses for that.
   *
   * Note: currently only StylingAgent and PerformanceAgent utilize this, but
   * eventually all agents should support this.
   */
  parseTextResponseForSuggestions(text) {
    if (!text) {
      return { answer: "" };
    }
    const lines = text.split("\n");
    const answerLines = [];
    let suggestions;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("SUGGESTIONS:")) {
        try {
          suggestions = JSON.parse(trimmed.substring("SUGGESTIONS:".length).trim());
        } catch {
        }
      } else {
        answerLines.push(line);
      }
    }
    if (!suggestions && answerLines.at(-1)?.includes("SUGGESTIONS:")) {
      const [answer, suggestionsText] = answerLines[answerLines.length - 1].split("SUGGESTIONS:", 2);
      try {
        suggestions = JSON.parse(suggestionsText.trim().substring("SUGGESTIONS:".length).trim());
      } catch {
      }
      answerLines[answerLines.length - 1] = answer;
    }
    const response = {
      // If we could not parse the parts, consider the response to be an
      // answer.
      answer: answerLines.join("\n")
    };
    if (suggestions) {
      response.suggestions = suggestions;
    }
    return response;
  }
  /**
   * Parses a streaming text response into a
   * though/action/title/answer/suggestions component.
   */
  parseTextResponse(response) {
    return this.parseTextResponseForSuggestions(response.trim());
  }
  async finalizeAnswer(answer) {
    return answer;
  }
  /**
   * Declare a function that the AI model can call.
   * @param name The name of the function
   * @param declaration the function declaration. Currently functions must:
   * 1. Return an object of serializable key/value pairs. You cannot return
   *    anything other than a plain JavaScript object that can be serialized.
   * 2. Take one parameter which is an object that can have
   *    multiple keys and values. For example, rather than a function being called
   *    with two args, `foo` and `bar`, you should instead have the function be
   *    called with one object with `foo` and `bar` keys.
   */
  declareFunction(name, declaration) {
    if (this.#functionDeclarations.has(name)) {
      throw new Error(`Duplicate function declaration ${name}`);
    }
    this.#functionDeclarations.set(name, declaration);
  }
  clearDeclaredFunctions() {
    this.#functionDeclarations.clear();
  }
  async preRun() {
  }
  async *run(initialQuery, options, multimodalInput) {
    await this.preRun();
    await options.selected?.refresh();
    if (options.selected) {
      this.context = options.selected;
    }
    const enhancedQuery = await this.enhanceQuery(initialQuery, options.selected, multimodalInput?.type);
    Host.userMetrics.freestylerQueryLength(enhancedQuery.length);
    let query;
    query = multimodalInput ? [{ text: enhancedQuery }, multimodalInput.input] : [{ text: enhancedQuery }];
    let request = this.buildRequest(query, Host.AidaClient.Role.USER);
    yield* this.handleContextDetails(options.selected);
    const breakpointAgentEnabled = Greendev.Prototypes.instance().isEnabled("breakpointDebuggerAgent");
    const isBreakpointDebuggerAgent = this.constructor.name === "BreakpointDebuggerAgent";
    const finalMaxSteps = isBreakpointDebuggerAgent && breakpointAgentEnabled ? 1e3 : MAX_STEPS;
    for (let i = 0; i < finalMaxSteps; i++) {
      yield {
        type: "querying" /* QUERYING */
      };
      let rpcId;
      let textResponse = "";
      let functionCall = void 0;
      try {
        for await (const fetchResult of this.#aidaFetch(request, { signal: options.signal })) {
          rpcId = fetchResult.rpcId;
          textResponse = fetchResult.text ?? "";
          functionCall = fetchResult.functionCall;
          if (!functionCall && !fetchResult.completed) {
            const parsed = this.parseTextResponse(textResponse);
            const partialAnswer = "answer" in parsed ? parsed.answer : "";
            if (!partialAnswer) {
              continue;
            }
            yield {
              type: "answer" /* ANSWER */,
              text: partialAnswer,
              complete: false
            };
          }
        }
      } catch (err) {
        debugLog("Error calling the AIDA API", err);
        let error = "unknown" /* UNKNOWN */;
        if (err instanceof Host.AidaClient.AidaAbortError) {
          error = "abort" /* ABORT */;
        } else if (err instanceof Host.AidaClient.AidaBlockError) {
          error = "block" /* BLOCK */;
        }
        yield this.#createErrorResponse(error);
        break;
      }
      this.#history.push(request.current_message);
      if (textResponse) {
        const parsedResponse = this.parseTextResponse(textResponse);
        if (!("answer" in parsedResponse)) {
          throw new Error("Expected a completed response to have an answer");
        }
        if (!functionCall) {
          this.#history.push({
            parts: [{
              text: parsedResponse.answer
            }],
            role: Host.AidaClient.Role.MODEL
          });
        }
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.AiAssistanceAnswerReceived);
        yield await this.finalizeAnswer({
          type: "answer" /* ANSWER */,
          text: parsedResponse.answer,
          suggestions: parsedResponse.suggestions,
          complete: true,
          rpcId
        });
        if (!functionCall) {
          break;
        }
      }
      if (functionCall) {
        try {
          const result = yield* this.#callFunction(
            functionCall.name,
            functionCall.args,
            {
              ...options,
              explanation: textResponse
            }
          );
          if (options.signal?.aborted) {
            yield this.#createErrorResponse("abort" /* ABORT */);
            break;
          }
          if ("context" in result) {
            yield {
              type: "context-change" /* CONTEXT_CHANGE */,
              description: result.description,
              context: result.context,
              widgets: result.widgets
            };
            return;
          }
          query = {
            functionResponse: {
              name: functionCall.name,
              // Widgets are not sent back to the LLM
              response: { ...result, widgets: void 0 }
            }
          };
          request = this.buildRequest(query, Host.AidaClient.Role.ROLE_UNSPECIFIED);
        } catch (err) {
          debugLog("Error handling function call", err);
          yield this.#createErrorResponse("unknown" /* UNKNOWN */);
          break;
        }
      } else {
        yield this.#createErrorResponse(i - 1 === MAX_STEPS ? "max-steps" /* MAX_STEPS */ : "unknown" /* UNKNOWN */);
        break;
      }
    }
    if (isStructuredLogEnabled()) {
      window.dispatchEvent(new CustomEvent("aiassistancedone"));
    }
    return;
  }
  async *#callFunction(name, args, options) {
    const call = this.#functionDeclarations.get(name);
    if (!call) {
      throw new Error(`Function ${name} is not found.`);
    }
    const parts = [];
    if (options?.explanation) {
      parts.push({
        text: options.explanation
      });
    }
    parts.push({
      functionCall: {
        name,
        args
      }
    });
    this.#history.push({
      parts,
      role: Host.AidaClient.Role.MODEL
    });
    let code;
    if (call.displayInfoFromArgs) {
      const { title, thought, action: callCode } = call.displayInfoFromArgs(args);
      code = callCode;
      if (title) {
        yield {
          type: "title" /* TITLE */,
          title
        };
      }
      if (thought) {
        yield {
          type: "thought" /* THOUGHT */,
          thought
        };
      }
    }
    let result = await call.handler(args, options);
    if ("requiresApproval" in result) {
      if (code) {
        yield {
          type: "action" /* ACTION */,
          code,
          canceled: false
        };
      }
      const sideEffectConfirmationPromiseWithResolvers = this.confirmSideEffect();
      void sideEffectConfirmationPromiseWithResolvers.promise.then((result2) => {
        Host.userMetrics.actionTaken(
          result2 ? Host.UserMetrics.Action.AiAssistanceSideEffectConfirmed : Host.UserMetrics.Action.AiAssistanceSideEffectRejected
        );
      });
      if (options?.signal?.aborted) {
        sideEffectConfirmationPromiseWithResolvers.resolve(false);
      }
      options?.signal?.addEventListener("abort", () => {
        sideEffectConfirmationPromiseWithResolvers.resolve(false);
      }, { once: true });
      yield {
        type: "side-effect" /* SIDE_EFFECT */,
        confirm: sideEffectConfirmationPromiseWithResolvers.resolve,
        description: result.description
      };
      const approvedRun = await sideEffectConfirmationPromiseWithResolvers.promise;
      if (!approvedRun) {
        yield {
          type: "action" /* ACTION */,
          code,
          output: "Error: User denied code execution with side effects.",
          canceled: true
        };
        return {
          result: "Error: User denied code execution with side effects."
        };
      }
      result = await call.handler(args, {
        ...options,
        approved: true
      });
    }
    if ("result" in result) {
      yield {
        type: "action" /* ACTION */,
        code,
        output: typeof result.result === "string" ? result.result : JSON.stringify(result.result),
        widgets: result.widgets,
        canceled: false
      };
    }
    if ("error" in result) {
      yield {
        type: "action" /* ACTION */,
        code,
        output: result.error,
        canceled: false
      };
    }
    if ("context" in result) {
      return result;
    }
    return result;
  }
  async *#aidaFetch(request, options) {
    let aidaResponse = void 0;
    let rpcId;
    for await (aidaResponse of this.#aidaClient.doConversation(request, options)) {
      if (aidaResponse.functionCalls?.length) {
        debugLog("functionCalls.length", aidaResponse.functionCalls.length);
        yield {
          rpcId,
          functionCall: aidaResponse.functionCalls[0],
          completed: true,
          text: aidaResponse.explanation
        };
        break;
      }
      rpcId = aidaResponse.metadata.rpcGlobalId ?? rpcId;
      yield {
        rpcId,
        text: aidaResponse.explanation,
        completed: aidaResponse.completed
      };
    }
    debugLog({
      request,
      response: aidaResponse
    });
    if (isStructuredLogEnabled() && aidaResponse) {
      this.#structuredLog.push({
        request: structuredClone(request),
        aidaResponse
      });
      localStorage.setItem("aiAssistanceStructuredLog", JSON.stringify(this.#structuredLog));
    }
  }
  #removeLastRunParts() {
    this.#history.splice(this.#history.findLastIndex((item) => {
      return item.role === Host.AidaClient.Role.USER;
    }));
  }
  #createErrorResponse(error) {
    this.#removeLastRunParts();
    if (error !== "abort" /* ABORT */) {
      Host.userMetrics.actionTaken(Host.UserMetrics.Action.AiAssistanceError);
    }
    return {
      type: "error" /* ERROR */,
      error
    };
  }
}
//# sourceMappingURL=AiAgent.js.map
