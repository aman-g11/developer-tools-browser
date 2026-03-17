"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as Common from "../common/common.js";
import * as Host from "../host/host.js";
import * as i18n from "../i18n/i18n.js";
import * as Platform from "../platform/platform.js";
import { FrontendMessageType } from "./ConsoleModelTypes.js";
import { CPUProfilerModel, Events as CPUProfilerModelEvents } from "./CPUProfilerModel.js";
import {
  BreakpointType,
  COND_BREAKPOINT_SOURCE_URL,
  Events as DebuggerModelEvents,
  LOGPOINT_SOURCE_URL
} from "./DebuggerModel.js";
import { LogModel } from "./LogModel.js";
import { RemoteObject } from "./RemoteObject.js";
import {
  Events as ResourceTreeModelEvents,
  ResourceTreeModel
} from "./ResourceTreeModel.js";
import {
  Events as RuntimeModelEvents,
  RuntimeModel
} from "./RuntimeModel.js";
import { SDKModel } from "./SDKModel.js";
import { Capability, Type } from "./Target.js";
import { TargetManager } from "./TargetManager.js";
export { FrontendMessageType } from "./ConsoleModelTypes.js";
const UIStrings = {
  /**
   * @description Text shown when the main frame (page) of the website was navigated to a different URL.
   * @example {https://example.com} PH1
   */
  navigatedToS: "Navigated to {PH1}",
  /**
   * @description Text shown when the main frame (page) of the website was navigated to a different URL
   * and the page was restored from back/forward cache (https://web.dev/bfcache/).
   * @example {https://example.com} PH1
   */
  bfcacheNavigation: "Navigation to {PH1} was restored from back/forward cache (see https://web.dev/bfcache/)",
  /**
   * @description Text shown in the console when a performance profile (with the given name) was started.
   * @example {title} PH1
   */
  profileSStarted: "Profile ''{PH1}'' started.",
  /**
   * @description Text shown in the console when a performance profile (with the given name) was stopped.
   * @example {name} PH1
   */
  profileSFinished: "Profile ''{PH1}'' finished.",
  /**
   * @description Error message shown in the console after the user tries to save a JavaScript value to a temporary variable.
   */
  failedToSaveToTempVariable: "Failed to save to temp variable."
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/ConsoleModel.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class ConsoleModel extends SDKModel {
  #messages = [];
  #messagesByTimestamp = new Platform.MapUtilities.Multimap();
  #messageByExceptionId = /* @__PURE__ */ new Map();
  #warnings = 0;
  #errors = 0;
  #violations = 0;
  #pageLoadSequenceNumber = 0;
  #targetListeners = /* @__PURE__ */ new WeakMap();
  constructor(target) {
    super(target);
    const resourceTreeModel = target.model(ResourceTreeModel);
    if (!resourceTreeModel || resourceTreeModel.cachedResourcesLoaded()) {
      this.initTarget(target);
      return;
    }
    const eventListener = resourceTreeModel.addEventListener(ResourceTreeModelEvents.CachedResourcesLoaded, () => {
      Common.EventTarget.removeEventListeners([eventListener]);
      this.initTarget(target);
    });
  }
  initTarget(target) {
    const eventListeners = [];
    const cpuProfilerModel = target.model(CPUProfilerModel);
    if (cpuProfilerModel) {
      eventListeners.push(cpuProfilerModel.addEventListener(
        CPUProfilerModelEvents.CONSOLE_PROFILE_STARTED,
        this.consoleProfileStarted.bind(this, cpuProfilerModel)
      ));
      eventListeners.push(cpuProfilerModel.addEventListener(
        CPUProfilerModelEvents.CONSOLE_PROFILE_FINISHED,
        this.consoleProfileFinished.bind(this, cpuProfilerModel)
      ));
    }
    const resourceTreeModel = target.model(ResourceTreeModel);
    if (resourceTreeModel && target.parentTarget()?.type() !== Type.FRAME) {
      eventListeners.push(resourceTreeModel.addEventListener(
        ResourceTreeModelEvents.PrimaryPageChanged,
        this.primaryPageChanged,
        this
      ));
    }
    const runtimeModel = target.model(RuntimeModel);
    if (runtimeModel) {
      eventListeners.push(runtimeModel.addEventListener(
        RuntimeModelEvents.ExceptionThrown,
        this.exceptionThrown.bind(this, runtimeModel)
      ));
      eventListeners.push(runtimeModel.addEventListener(
        RuntimeModelEvents.ExceptionRevoked,
        this.exceptionRevoked.bind(this, runtimeModel)
      ));
      eventListeners.push(runtimeModel.addEventListener(
        RuntimeModelEvents.ConsoleAPICalled,
        this.consoleAPICalled.bind(this, runtimeModel)
      ));
      if (target.parentTarget()?.type() !== Type.FRAME) {
        eventListeners.push(runtimeModel.debuggerModel().addEventListener(
          DebuggerModelEvents.GlobalObjectCleared,
          this.clearIfNecessary,
          this
        ));
      }
      eventListeners.push(runtimeModel.addEventListener(
        RuntimeModelEvents.QueryObjectRequested,
        this.queryObjectRequested.bind(this, runtimeModel)
      ));
    }
    this.#targetListeners.set(target, eventListeners);
  }
  targetRemoved(target) {
    const runtimeModel = target.model(RuntimeModel);
    if (runtimeModel) {
      this.#messageByExceptionId.delete(runtimeModel);
    }
    Common.EventTarget.removeEventListeners(this.#targetListeners.get(target) || []);
  }
  async evaluateCommandInConsole(executionContext, originatingMessage, expression, useCommandLineAPI) {
    const result = await executionContext.evaluate(
      {
        expression,
        objectGroup: "console",
        includeCommandLineAPI: useCommandLineAPI,
        silent: false,
        returnByValue: false,
        generatePreview: true,
        replMode: true,
        allowUnsafeEvalBlockedByCSP: false
      },
      Common.Settings.Settings.instance().moduleSetting("console-user-activation-eval").get(),
      /* awaitPromise */
      false
    );
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleEvaluated);
    if ("error" in result) {
      return;
    }
    await Common.Console.Console.instance().showPromise();
    this.dispatchEventToListeners(
      "CommandEvaluated" /* CommandEvaluated */,
      { result: result.object, commandMessage: originatingMessage, exceptionDetails: result.exceptionDetails }
    );
  }
  addCommandMessage(executionContext, text) {
    const commandMessage = new ConsoleMessage(
      executionContext.runtimeModel,
      Protocol.Log.LogEntrySource.Javascript,
      null,
      text,
      { type: FrontendMessageType.Command }
    );
    commandMessage.setExecutionContextId(executionContext.id);
    this.addMessage(commandMessage);
    return commandMessage;
  }
  addMessage(msg) {
    msg.setPageLoadSequenceNumber(this.#pageLoadSequenceNumber);
    if (msg.source === Common.Console.FrontendMessageSource.ConsoleAPI && msg.type === Protocol.Runtime.ConsoleAPICalledEventType.Clear) {
      this.clearIfNecessary();
    }
    this.#messages.push(msg);
    this.#messagesByTimestamp.set(msg.timestamp, msg);
    const runtimeModel = msg.runtimeModel();
    const exceptionId = msg.getExceptionId();
    if (exceptionId && runtimeModel) {
      let modelMap = this.#messageByExceptionId.get(runtimeModel);
      if (!modelMap) {
        modelMap = /* @__PURE__ */ new Map();
        this.#messageByExceptionId.set(runtimeModel, modelMap);
      }
      modelMap.set(exceptionId, msg);
    }
    this.incrementErrorWarningCount(msg);
    this.dispatchEventToListeners("MessageAdded" /* MessageAdded */, msg);
  }
  exceptionThrown(runtimeModel, event) {
    const exceptionWithTimestamp = event.data;
    const affectedResources = extractExceptionMetaData(exceptionWithTimestamp.details.exceptionMetaData);
    const consoleMessage = ConsoleMessage.fromException(
      runtimeModel,
      exceptionWithTimestamp.details,
      void 0,
      exceptionWithTimestamp.timestamp,
      void 0,
      affectedResources
    );
    consoleMessage.setExceptionId(exceptionWithTimestamp.details.exceptionId);
    this.addMessage(consoleMessage);
  }
  exceptionRevoked(runtimeModel, event) {
    const exceptionId = event.data;
    const modelMap = this.#messageByExceptionId.get(runtimeModel);
    const exceptionMessage = modelMap ? modelMap.get(exceptionId) : null;
    if (!exceptionMessage) {
      return;
    }
    this.#errors--;
    exceptionMessage.level = Protocol.Log.LogEntryLevel.Verbose;
    this.dispatchEventToListeners("MessageUpdated" /* MessageUpdated */, exceptionMessage);
  }
  consoleAPICalled(runtimeModel, event) {
    const call = event.data;
    let level = Protocol.Log.LogEntryLevel.Info;
    if (call.type === Protocol.Runtime.ConsoleAPICalledEventType.Debug) {
      level = Protocol.Log.LogEntryLevel.Verbose;
    } else if (call.type === Protocol.Runtime.ConsoleAPICalledEventType.Error || call.type === Protocol.Runtime.ConsoleAPICalledEventType.Assert) {
      level = Protocol.Log.LogEntryLevel.Error;
    } else if (call.type === Protocol.Runtime.ConsoleAPICalledEventType.Warning) {
      level = Protocol.Log.LogEntryLevel.Warning;
    } else if (call.type === Protocol.Runtime.ConsoleAPICalledEventType.Info || call.type === Protocol.Runtime.ConsoleAPICalledEventType.Log) {
      level = Protocol.Log.LogEntryLevel.Info;
    }
    let message = "";
    if (call.args.length && call.args[0].unserializableValue) {
      message = call.args[0].unserializableValue;
    } else if (call.args.length && (typeof call.args[0].value !== "object" && typeof call.args[0].value !== "undefined" || call.args[0].value === null)) {
      message = String(call.args[0].value);
    } else if (call.args.length && call.args[0].description) {
      message = call.args[0].description;
    }
    const callFrame = call.stackTrace?.callFrames.length ? call.stackTrace.callFrames[0] : null;
    const details = {
      type: call.type,
      url: callFrame?.url,
      line: callFrame?.lineNumber,
      column: callFrame?.columnNumber,
      parameters: call.args,
      stackTrace: call.stackTrace,
      timestamp: call.timestamp,
      executionContextId: call.executionContextId,
      context: call.context
    };
    const consoleMessage = new ConsoleMessage(runtimeModel, Common.Console.FrontendMessageSource.ConsoleAPI, level, message, details);
    for (const msg of this.#messagesByTimestamp.get(consoleMessage.timestamp).values()) {
      if (consoleMessage.isEqual(msg)) {
        return;
      }
    }
    this.addMessage(consoleMessage);
  }
  queryObjectRequested(runtimeModel, event) {
    const { objects, executionContextId } = event.data;
    const details = {
      type: FrontendMessageType.QueryObjectResult,
      parameters: [objects],
      executionContextId
    };
    const consoleMessage = new ConsoleMessage(
      runtimeModel,
      Common.Console.FrontendMessageSource.ConsoleAPI,
      Protocol.Log.LogEntryLevel.Info,
      "",
      details
    );
    this.addMessage(consoleMessage);
  }
  clearIfNecessary() {
    if (!Common.Settings.Settings.instance().moduleSetting("preserve-console-log").get()) {
      this.clear();
    }
    ++this.#pageLoadSequenceNumber;
  }
  primaryPageChanged(event) {
    if (Common.Settings.Settings.instance().moduleSetting("preserve-console-log").get()) {
      const { frame } = event.data;
      if (frame.backForwardCacheDetails.restoredFromCache) {
        Common.Console.Console.instance().log(i18nString(UIStrings.bfcacheNavigation, { PH1: frame.url }));
      } else {
        Common.Console.Console.instance().log(i18nString(UIStrings.navigatedToS, { PH1: frame.url }));
      }
    }
  }
  consoleProfileStarted(cpuProfilerModel, event) {
    const { data } = event;
    this.addConsoleProfileMessage(
      cpuProfilerModel,
      Protocol.Runtime.ConsoleAPICalledEventType.Profile,
      data.scriptLocation,
      i18nString(UIStrings.profileSStarted, { PH1: data.title })
    );
  }
  consoleProfileFinished(cpuProfilerModel, event) {
    const { data } = event;
    this.addConsoleProfileMessage(
      cpuProfilerModel,
      Protocol.Runtime.ConsoleAPICalledEventType.ProfileEnd,
      data.scriptLocation,
      i18nString(UIStrings.profileSFinished, { PH1: data.title })
    );
  }
  addConsoleProfileMessage(cpuProfilerModel, type, scriptLocation, messageText) {
    const script = scriptLocation.script();
    const callFrames = [{
      functionName: "",
      scriptId: scriptLocation.scriptId,
      url: script ? script.contentURL() : "",
      lineNumber: scriptLocation.lineNumber,
      columnNumber: scriptLocation.columnNumber || 0
    }];
    this.addMessage(new ConsoleMessage(
      cpuProfilerModel.runtimeModel(),
      Common.Console.FrontendMessageSource.ConsoleAPI,
      Protocol.Log.LogEntryLevel.Info,
      messageText,
      { type, stackTrace: { callFrames } }
    ));
  }
  incrementErrorWarningCount(msg) {
    if (msg.source === Protocol.Log.LogEntrySource.Violation) {
      this.#violations++;
      return;
    }
    switch (msg.level) {
      case Protocol.Log.LogEntryLevel.Warning:
        this.#warnings++;
        break;
      case Protocol.Log.LogEntryLevel.Error:
        this.#errors++;
        break;
    }
  }
  messages() {
    return this.#messages;
  }
  // messages[] are not ordered by timestamp.
  static allMessagesUnordered() {
    const messages = [];
    for (const target of TargetManager.instance().targets()) {
      const targetMessages = target.model(ConsoleModel)?.messages() || [];
      messages.push(...targetMessages);
    }
    return messages;
  }
  static requestClearMessages() {
    for (const logModel of TargetManager.instance().models(LogModel)) {
      logModel.requestClear();
    }
    for (const runtimeModel of TargetManager.instance().models(RuntimeModel)) {
      runtimeModel.discardConsoleEntries();
      runtimeModel.releaseObjectGroup("live-expression");
    }
    for (const target of TargetManager.instance().targets()) {
      target.model(ConsoleModel)?.clear();
    }
  }
  clear() {
    this.#messages = [];
    this.#messagesByTimestamp.clear();
    this.#messageByExceptionId.clear();
    this.#errors = 0;
    this.#warnings = 0;
    this.#violations = 0;
    this.dispatchEventToListeners("ConsoleCleared" /* ConsoleCleared */);
  }
  errors() {
    return this.#errors;
  }
  static allErrors() {
    let errors = 0;
    for (const target of TargetManager.instance().targets()) {
      errors += target.model(ConsoleModel)?.errors() || 0;
    }
    return errors;
  }
  warnings() {
    return this.#warnings;
  }
  static allWarnings() {
    let warnings = 0;
    for (const target of TargetManager.instance().targets()) {
      warnings += target.model(ConsoleModel)?.warnings() || 0;
    }
    return warnings;
  }
  violations() {
    return this.#violations;
  }
  async saveToTempVariable(currentExecutionContext, remoteObject) {
    if (!remoteObject || !currentExecutionContext) {
      failedToSave(null);
      return;
    }
    const executionContext = currentExecutionContext;
    const result = await executionContext.globalObject(
      /* objectGroup */
      "",
      /* generatePreview */
      false
    );
    if ("error" in result || Boolean(result.exceptionDetails) || !result.object) {
      failedToSave("object" in result && result.object || null);
      return;
    }
    const globalObject = result.object;
    const callFunctionResult = await globalObject.callFunction(saveVariable, [RemoteObject.toCallArgument(remoteObject)]);
    globalObject.release();
    if (callFunctionResult.wasThrown || callFunctionResult.object?.type !== "string") {
      failedToSave(callFunctionResult.object || null);
    } else {
      const text = callFunctionResult.object.value;
      const message = this.addCommandMessage(executionContext, text);
      void this.evaluateCommandInConsole(
        executionContext,
        message,
        text,
        /* useCommandLineAPI */
        false
      );
    }
    if (callFunctionResult.object) {
      callFunctionResult.object.release();
    }
    function saveVariable(value) {
      const prefix = "temp";
      let index = 1;
      while (prefix + index in this) {
        ++index;
      }
      const name = prefix + index;
      this[name] = value;
      return name;
    }
    function failedToSave(result2) {
      let message = i18nString(UIStrings.failedToSaveToTempVariable);
      if (result2) {
        message = message + " " + result2.description;
      }
      Common.Console.Console.instance().error(message);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ConsoleCleared"] = "ConsoleCleared";
  Events2["MessageAdded"] = "MessageAdded";
  Events2["MessageUpdated"] = "MessageUpdated";
  Events2["CommandEvaluated"] = "CommandEvaluated";
  return Events2;
})(Events || {});
function extractExceptionMetaData(metaData) {
  if (!metaData) {
    return void 0;
  }
  return { requestId: metaData.requestId || void 0, issueId: metaData.issueId || void 0 };
}
function areAffectedResourcesEquivalent(a, b) {
  return a?.requestId === b?.requestId;
}
function areStackTracesEquivalent(stackTrace1, stackTrace2) {
  if (!stackTrace1 !== !stackTrace2) {
    return false;
  }
  if (!stackTrace1 || !stackTrace2) {
    return true;
  }
  const callFrames1 = stackTrace1.callFrames;
  const callFrames2 = stackTrace2.callFrames;
  if (callFrames1.length !== callFrames2.length) {
    return false;
  }
  for (let i = 0, n = callFrames1.length; i < n; ++i) {
    if (callFrames1[i].scriptId !== callFrames2[i].scriptId || callFrames1[i].functionName !== callFrames2[i].functionName || callFrames1[i].lineNumber !== callFrames2[i].lineNumber || callFrames1[i].columnNumber !== callFrames2[i].columnNumber) {
      return false;
    }
  }
  return areStackTracesEquivalent(stackTrace1.parent, stackTrace2.parent);
}
export class ConsoleMessage {
  #runtimeModel;
  source;
  level;
  messageText;
  type;
  url;
  line;
  column;
  parameters;
  stackTrace;
  timestamp;
  #executionContextId;
  scriptId;
  workerId;
  context;
  #originatingConsoleMessage = null;
  #pageLoadSequenceNumber = void 0;
  #exceptionId = void 0;
  #affectedResources;
  category;
  /**
   * The parent frame of the `console.log` call of logpoints or conditional breakpoints
   * if they called `console.*` explicitly. The parent frame is where V8 paused
   * and consequently where the logpoint is set.
   *
   * Is `null` for page console.logs, commands, command results, etc.
   */
  stackFrameWithBreakpoint = null;
  #originatingBreakpointType = null;
  constructor(runtimeModel, source, level, messageText, details) {
    this.#runtimeModel = runtimeModel;
    this.source = source;
    this.level = level;
    this.messageText = messageText;
    this.type = details?.type || Protocol.Runtime.ConsoleAPICalledEventType.Log;
    this.url = details?.url;
    this.line = details?.line || 0;
    this.column = details?.column || 0;
    this.parameters = details?.parameters;
    this.stackTrace = details?.stackTrace;
    this.timestamp = details?.timestamp || Date.now();
    this.#executionContextId = details?.executionContextId || 0;
    this.scriptId = details?.scriptId;
    this.workerId = details?.workerId;
    this.#affectedResources = details?.affectedResources;
    this.category = details?.category;
    if (!this.#executionContextId && this.#runtimeModel) {
      if (this.scriptId) {
        this.#executionContextId = this.#runtimeModel.executionContextIdForScriptId(this.scriptId);
      } else if (this.stackTrace) {
        this.#executionContextId = this.#runtimeModel.executionContextForStackTrace(this.stackTrace);
      }
    }
    if (details?.context) {
      const match = details?.context.match(/[^#]*/);
      this.context = match?.[0];
    }
    if (this.stackTrace) {
      const { callFrame, type } = ConsoleMessage.#stackFrameWithBreakpoint(this.stackTrace);
      this.stackFrameWithBreakpoint = callFrame;
      this.#originatingBreakpointType = type;
    }
  }
  getAffectedResources() {
    return this.#affectedResources;
  }
  setPageLoadSequenceNumber(pageLoadSequenceNumber) {
    this.#pageLoadSequenceNumber = pageLoadSequenceNumber;
  }
  static fromException(runtimeModel, exceptionDetails, messageType, timestamp, forceUrl, affectedResources) {
    const details = {
      type: messageType,
      url: forceUrl || exceptionDetails.url,
      line: exceptionDetails.lineNumber,
      column: exceptionDetails.columnNumber,
      parameters: exceptionDetails.exception ? [RemoteObject.fromLocalObject(exceptionDetails.text), exceptionDetails.exception] : void 0,
      stackTrace: exceptionDetails.stackTrace,
      timestamp,
      executionContextId: exceptionDetails.executionContextId,
      scriptId: exceptionDetails.scriptId,
      affectedResources
    };
    return new ConsoleMessage(
      runtimeModel,
      Protocol.Log.LogEntrySource.Javascript,
      Protocol.Log.LogEntryLevel.Error,
      RuntimeModel.simpleTextFromException(exceptionDetails),
      details
    );
  }
  runtimeModel() {
    return this.#runtimeModel;
  }
  target() {
    return this.#runtimeModel ? this.#runtimeModel.target() : null;
  }
  setOriginatingMessage(originatingMessage) {
    this.#originatingConsoleMessage = originatingMessage;
    this.#executionContextId = originatingMessage.#executionContextId;
  }
  originatingMessage() {
    return this.#originatingConsoleMessage;
  }
  setExecutionContextId(executionContextId) {
    this.#executionContextId = executionContextId;
  }
  getExecutionContextId() {
    return this.#executionContextId;
  }
  getExceptionId() {
    return this.#exceptionId;
  }
  setExceptionId(exceptionId) {
    this.#exceptionId = exceptionId;
  }
  isGroupMessage() {
    return this.type === Protocol.Runtime.ConsoleAPICalledEventType.StartGroup || this.type === Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed || this.type === Protocol.Runtime.ConsoleAPICalledEventType.EndGroup;
  }
  isGroupStartMessage() {
    return this.type === Protocol.Runtime.ConsoleAPICalledEventType.StartGroup || this.type === Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed;
  }
  isErrorOrWarning() {
    return this.level === Protocol.Log.LogEntryLevel.Warning || this.level === Protocol.Log.LogEntryLevel.Error;
  }
  isGroupable() {
    const isUngroupableError = this.level === Protocol.Log.LogEntryLevel.Error && (this.source === Protocol.Log.LogEntrySource.Javascript || this.source === Protocol.Log.LogEntrySource.Network);
    return this.source !== Common.Console.FrontendMessageSource.ConsoleAPI && this.type !== FrontendMessageType.Command && this.type !== FrontendMessageType.Result && this.type !== FrontendMessageType.System && !isUngroupableError;
  }
  groupCategoryKey() {
    return [this.source, this.level, this.type, this.#pageLoadSequenceNumber].join(":");
  }
  isEqual(msg) {
    if (!msg) {
      return false;
    }
    if (this.parameters) {
      if (!msg.parameters || this.parameters.length !== msg.parameters.length) {
        return false;
      }
      for (let i = 0; i < msg.parameters.length; ++i) {
        const msgParam = msg.parameters[i];
        const param = this.parameters[i];
        if (typeof msgParam === "string" || typeof param === "string") {
          return false;
        }
        if (msgParam.type === "object" && msgParam.subtype !== "error") {
          if (!msgParam.objectId || msgParam.objectId !== param.objectId || msg.timestamp !== this.timestamp) {
            return false;
          }
        }
        if (param.type !== msgParam.type || param.value !== msgParam.value || param.description !== msgParam.description) {
          return false;
        }
      }
    }
    return this.runtimeModel() === msg.runtimeModel() && this.source === msg.source && this.type === msg.type && this.level === msg.level && this.line === msg.line && this.url === msg.url && this.scriptId === msg.scriptId && this.messageText === msg.messageText && this.#executionContextId === msg.#executionContextId && areAffectedResourcesEquivalent(this.#affectedResources, msg.#affectedResources) && areStackTracesEquivalent(this.stackTrace, msg.stackTrace);
  }
  get originatesFromLogpoint() {
    return this.#originatingBreakpointType === BreakpointType.LOGPOINT;
  }
  /** @returns true, iff this was a console.* call in a conditional breakpoint */
  get originatesFromConditionalBreakpoint() {
    return this.#originatingBreakpointType === BreakpointType.CONDITIONAL_BREAKPOINT;
  }
  static #stackFrameWithBreakpoint({ callFrames }) {
    const markerSourceUrls = [COND_BREAKPOINT_SOURCE_URL, LOGPOINT_SOURCE_URL];
    const lastBreakpointFrameIndex = callFrames.findLastIndex(({ url }) => markerSourceUrls.includes(url));
    if (lastBreakpointFrameIndex === -1 || lastBreakpointFrameIndex === callFrames.length - 1) {
      return { callFrame: null, type: null };
    }
    const type = callFrames[lastBreakpointFrameIndex].url === LOGPOINT_SOURCE_URL ? BreakpointType.LOGPOINT : BreakpointType.CONDITIONAL_BREAKPOINT;
    return { callFrame: callFrames[lastBreakpointFrameIndex + 1], type };
  }
}
SDKModel.register(ConsoleModel, { capabilities: Capability.JS, autostart: true });
export const MessageSourceDisplayName = /* @__PURE__ */ new Map([
  [Protocol.Log.LogEntrySource.XML, "xml"],
  [Protocol.Log.LogEntrySource.Javascript, "javascript"],
  [Protocol.Log.LogEntrySource.Network, "network"],
  [Common.Console.FrontendMessageSource.ConsoleAPI, "console-api"],
  [Protocol.Log.LogEntrySource.Storage, "storage"],
  [Protocol.Log.LogEntrySource.Appcache, "appcache"],
  [Protocol.Log.LogEntrySource.Rendering, "rendering"],
  [Common.Console.FrontendMessageSource.CSS, "css"],
  [Protocol.Log.LogEntrySource.Security, "security"],
  [Protocol.Log.LogEntrySource.Deprecation, "deprecation"],
  [Protocol.Log.LogEntrySource.Worker, "worker"],
  [Protocol.Log.LogEntrySource.Violation, "violation"],
  [Protocol.Log.LogEntrySource.Intervention, "intervention"],
  [Protocol.Log.LogEntrySource.Recommendation, "recommendation"],
  [Protocol.Log.LogEntrySource.Other, "other"],
  [Common.Console.FrontendMessageSource.ISSUE_PANEL, "issue-panel"]
]);
//# sourceMappingURL=ConsoleModel.js.map
