"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import { assertNotNullOrUndefined } from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as StackTrace from "../stack_trace/stack_trace.js";
import * as TextUtils from "../text_utils/text_utils.js";
import * as Workspace from "../workspace/workspace.js";
import { ContentProviderBasedProject } from "./ContentProviderBasedProject.js";
import { NetworkProject } from "./NetworkProject.js";
const UIStrings = {
  /**
   * @description Error message that is displayed in the Console when language #plugins report errors
   * @example {File not found} PH1
   */
  errorInDebuggerLanguagePlugin: "Error in debugger language plugin: {PH1}",
  /**
   * @description Status message that is shown in the Console when debugging information is being
   *loaded. The 2nd and 3rd placeholders are URLs.
   * @example {C/C++ DevTools Support (DWARF)} PH1
   * @example {http://web.dev/file.wasm} PH2
   * @example {http://web.dev/file.wasm.debug.wasm} PH3
   */
  loadingDebugSymbolsForVia: "[{PH1}] Loading debug symbols for {PH2} (via {PH3})\u2026",
  /**
   * @description Status message that is shown in the Console when debugging information is being loaded
   * @example {C/C++ DevTools Support (DWARF)} PH1
   * @example {http://web.dev/file.wasm} PH2
   */
  loadingDebugSymbolsFor: "[{PH1}] Loading debug symbols for {PH2}\u2026",
  /**
   * @description Warning message that is displayed in the Console when debugging information was loaded, but no source files were found
   * @example {C/C++ DevTools Support (DWARF)} PH1
   * @example {http://web.dev/file.wasm} PH2
   */
  loadedDebugSymbolsForButDidnt: "[{PH1}] Loaded debug symbols for {PH2}, but didn't find any source files",
  /**
   * @description Status message that is shown in the Console when debugging information is successfully loaded
   * @example {C/C++ DevTools Support (DWARF)} PH1
   * @example {http://web.dev/file.wasm} PH2
   * @example {42} PH3
   */
  loadedDebugSymbolsForFound: "[{PH1}] Loaded debug symbols for {PH2}, found {PH3} source file(s)",
  /**
   * @description Error message that is displayed in the Console when debugging information cannot be loaded
   * @example {C/C++ DevTools Support (DWARF)} PH1
   * @example {http://web.dev/file.wasm} PH2
   * @example {File not found} PH3
   */
  failedToLoadDebugSymbolsFor: "[{PH1}] Failed to load debug symbols for {PH2} ({PH3})"
};
const str_ = i18n.i18n.registerUIStrings("models/bindings/DebuggerLanguagePlugins.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
function rawModuleIdForScript(script) {
  return `${script.sourceURL}@${script.hash}`;
}
function getRawLocation(callFrame) {
  const { script } = callFrame;
  return {
    rawModuleId: rawModuleIdForScript(script),
    codeOffset: callFrame.location().columnNumber - (script.codeOffset() || 0),
    inlineFrameIndex: callFrame.inlineFrameIndex
  };
}
class FormattingError extends Error {
  exception;
  exceptionDetails;
  constructor(exception, exceptionDetails) {
    const { description } = exceptionDetails.exception || {};
    super(description || exceptionDetails.text);
    this.exception = exception;
    this.exceptionDetails = exceptionDetails;
  }
  static makeLocal(callFrame, message) {
    const exception = {
      type: Protocol.Runtime.RemoteObjectType.Object,
      subtype: Protocol.Runtime.RemoteObjectSubtype.Error,
      description: message
    };
    const exceptionDetails = { text: "Uncaught", exceptionId: -1, columnNumber: 0, lineNumber: 0, exception };
    const errorObject = callFrame.debuggerModel.runtimeModel().createRemoteObject(exception);
    return new FormattingError(errorObject, exceptionDetails);
  }
}
class NamespaceObject extends SDK.RemoteObject.LocalJSONObject {
  get description() {
    return this.type;
  }
  get type() {
    return "namespace";
  }
}
async function getRemoteObject(callFrame, object) {
  if (!/^(local|global|operand)$/.test(object.valueClass)) {
    return { type: Protocol.Runtime.RemoteObjectType.Undefined };
  }
  const index = Number(object.index);
  const expression = `${object.valueClass}s[${index}]`;
  const response = await callFrame.debuggerModel.agent.invoke_evaluateOnCallFrame({
    callFrameId: callFrame.id,
    expression,
    silent: true,
    generatePreview: true,
    throwOnSideEffect: true
  });
  if (response.getError() || response.exceptionDetails) {
    return { type: Protocol.Runtime.RemoteObjectType.Undefined };
  }
  return response.result;
}
async function wrapRemoteObject(callFrame, object, plugin) {
  if (object.type === "reftype") {
    const obj = await getRemoteObject(callFrame, object);
    return callFrame.debuggerModel.runtimeModel().createRemoteObject(obj);
  }
  return new ExtensionRemoteObject(callFrame, object, plugin);
}
class SourceScopeRemoteObject extends SDK.RemoteObject.RemoteObjectImpl {
  variables;
  #callFrame;
  #plugin;
  stopId;
  constructor(callFrame, stopId, plugin) {
    super(callFrame.debuggerModel.runtimeModel(), void 0, "object", void 0, null);
    this.variables = [];
    this.#callFrame = callFrame;
    this.#plugin = plugin;
    this.stopId = stopId;
  }
  async doGetProperties(_ownProperties, accessorPropertiesOnly, _generatePreview) {
    if (accessorPropertiesOnly) {
      return { properties: [], internalProperties: [] };
    }
    const properties = [];
    const namespaces = {};
    function makeProperty(name, obj) {
      return new SDK.RemoteObject.RemoteObjectProperty(
        name,
        obj,
        /* enumerable=*/
        false,
        /* writable=*/
        false,
        /* isOwn=*/
        true,
        /* wasThrown=*/
        false
      );
    }
    for (const variable of this.variables) {
      let sourceVar;
      try {
        const evalResult = await this.#plugin.evaluate(variable.name, getRawLocation(this.#callFrame), this.stopId);
        sourceVar = evalResult ? await wrapRemoteObject(this.#callFrame, evalResult, this.#plugin) : new SDK.RemoteObject.LocalJSONObject(void 0);
      } catch (e) {
        console.warn(e);
        sourceVar = new SDK.RemoteObject.LocalJSONObject(void 0);
      }
      if (variable.nestedName && variable.nestedName.length > 1) {
        let parent = namespaces;
        for (let index = 0; index < variable.nestedName.length - 1; index++) {
          const nestedName = variable.nestedName[index];
          let child = parent[nestedName];
          if (!child) {
            child = new NamespaceObject({});
            parent[nestedName] = child;
          }
          parent = child.value;
        }
        const name = variable.nestedName[variable.nestedName.length - 1];
        parent[name] = sourceVar;
      } else {
        properties.push(makeProperty(variable.name, sourceVar));
      }
    }
    for (const namespace in namespaces) {
      properties.push(makeProperty(namespace, namespaces[namespace]));
    }
    return { properties, internalProperties: [] };
  }
}
export class SourceScope {
  #callFrame;
  #type;
  #typeName;
  #icon;
  #object;
  constructor(callFrame, stopId, type, typeName, icon, plugin) {
    if (icon && new URL(icon).protocol !== "data:") {
      throw new Error("The icon must be a data:-URL");
    }
    this.#callFrame = callFrame;
    this.#type = type;
    this.#typeName = typeName;
    this.#icon = icon;
    this.#object = new SourceScopeRemoteObject(callFrame, stopId, plugin);
  }
  async getVariableValue(name) {
    for (let v = 0; v < this.#object.variables.length; ++v) {
      if (this.#object.variables[v].name !== name) {
        continue;
      }
      const properties = await this.#object.getAllProperties(false, false);
      if (!properties.properties) {
        continue;
      }
      const { value } = properties.properties[v];
      if (value) {
        return value;
      }
    }
    return null;
  }
  callFrame() {
    return this.#callFrame;
  }
  type() {
    return this.#type;
  }
  typeName() {
    return this.#typeName;
  }
  name() {
    return void 0;
  }
  range() {
    return null;
  }
  object() {
    return this.#object;
  }
  description() {
    return "";
  }
  icon() {
    return this.#icon;
  }
  extraProperties() {
    return [];
  }
}
export class ExtensionRemoteObject extends SDK.RemoteObject.RemoteObject {
  extensionObject;
  plugin;
  callFrame;
  constructor(callFrame, extensionObject, plugin) {
    super();
    this.extensionObject = extensionObject;
    this.plugin = plugin;
    this.callFrame = callFrame;
  }
  get linearMemoryAddress() {
    return this.extensionObject.linearMemoryAddress;
  }
  get linearMemorySize() {
    return this.extensionObject.linearMemorySize;
  }
  get objectId() {
    return this.extensionObject.objectId;
  }
  get type() {
    if (this.extensionObject.type === "array" || this.extensionObject.type === "null") {
      return "object";
    }
    return this.extensionObject.type;
  }
  get subtype() {
    if (this.extensionObject.type === "array" || this.extensionObject.type === "null") {
      return this.extensionObject.type;
    }
    return void 0;
  }
  get value() {
    return this.extensionObject.value;
  }
  unserializableValue() {
    return void 0;
  }
  get description() {
    return this.extensionObject.description;
  }
  set description(_description) {
  }
  get hasChildren() {
    return this.extensionObject.hasChildren;
  }
  get preview() {
    return void 0;
  }
  get className() {
    return this.extensionObject.className ?? null;
  }
  arrayLength() {
    return 0;
  }
  arrayBufferByteLength() {
    return 0;
  }
  getOwnProperties(_generatePreview, _nonIndexedPropertiesOnly) {
    return this.getAllProperties(false, _generatePreview, _nonIndexedPropertiesOnly);
  }
  async getAllProperties(_accessorPropertiesOnly, _generatePreview, _nonIndexedPropertiesOnly) {
    const { objectId } = this.extensionObject;
    if (objectId) {
      assertNotNullOrUndefined(this.plugin.getProperties);
      const extensionObjectProperties = await this.plugin.getProperties(objectId);
      const properties = await Promise.all(extensionObjectProperties.map(
        async (p) => new SDK.RemoteObject.RemoteObjectProperty(
          p.name,
          await wrapRemoteObject(this.callFrame, p.value, this.plugin)
        )
      ));
      return { properties, internalProperties: null };
    }
    return { properties: null, internalProperties: null };
  }
  release() {
    const { objectId } = this.extensionObject;
    if (objectId) {
      assertNotNullOrUndefined(this.plugin.releaseObject);
      void this.plugin.releaseObject(objectId);
    }
  }
  debuggerModel() {
    return this.callFrame.debuggerModel;
  }
  runtimeModel() {
    return this.callFrame.debuggerModel.runtimeModel();
  }
  isLinearMemoryInspectable() {
    return this.extensionObject.linearMemoryAddress !== void 0;
  }
}
export class DebuggerLanguagePluginManager {
  #workspace;
  #debuggerWorkspaceBinding;
  #plugins;
  #debuggerModelToData;
  #rawModuleHandles;
  callFrameByStopId = /* @__PURE__ */ new Map();
  stopIdByCallFrame = /* @__PURE__ */ new Map();
  nextStopId = 0n;
  constructor(targetManager, workspace, debuggerWorkspaceBinding) {
    this.#workspace = workspace;
    this.#debuggerWorkspaceBinding = debuggerWorkspaceBinding;
    this.#plugins = [];
    this.#debuggerModelToData = /* @__PURE__ */ new Map();
    targetManager.observeModels(SDK.DebuggerModel.DebuggerModel, this);
    this.#rawModuleHandles = /* @__PURE__ */ new Map();
  }
  async evaluateOnCallFrame(callFrame, options) {
    const { script } = callFrame;
    const { expression, returnByValue, throwOnSideEffect } = options;
    const { plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return null;
    }
    const location = getRawLocation(callFrame);
    const sourceLocations = await plugin.rawLocationToSourceLocation(location);
    if (sourceLocations.length === 0) {
      return null;
    }
    if (returnByValue) {
      return { error: "Cannot return by value" };
    }
    if (throwOnSideEffect) {
      return { error: "Cannot guarantee side-effect freedom" };
    }
    try {
      const object = await plugin.evaluate(expression, location, this.stopIdForCallFrame(callFrame));
      if (object) {
        return { object: await wrapRemoteObject(callFrame, object, plugin) };
      }
      return { object: new SDK.RemoteObject.LocalJSONObject(void 0) };
    } catch (error) {
      if (error instanceof FormattingError) {
        const { exception: object2, exceptionDetails: exceptionDetails2 } = error;
        return { object: object2, exceptionDetails: exceptionDetails2 };
      }
      const { exception: object, exceptionDetails } = FormattingError.makeLocal(callFrame, error.message);
      return { object, exceptionDetails };
    }
  }
  stopIdForCallFrame(callFrame) {
    let stopId = this.stopIdByCallFrame.get(callFrame);
    if (stopId !== void 0) {
      return stopId;
    }
    stopId = this.nextStopId++;
    this.stopIdByCallFrame.set(callFrame, stopId);
    this.callFrameByStopId.set(stopId, callFrame);
    return stopId;
  }
  callFrameForStopId(stopId) {
    return this.callFrameByStopId.get(stopId);
  }
  modelAdded(debuggerModel) {
    this.#debuggerModelToData.set(debuggerModel, new ModelData(debuggerModel, this.#workspace));
    debuggerModel.addEventListener(SDK.DebuggerModel.Events.GlobalObjectCleared, this.globalObjectCleared, this);
    debuggerModel.addEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, this.parsedScriptSource, this);
    debuggerModel.addEventListener(SDK.DebuggerModel.Events.DebuggerResumed, this.debuggerResumed, this);
    debuggerModel.setEvaluateOnCallFrameCallback(this.evaluateOnCallFrame.bind(this));
  }
  modelRemoved(debuggerModel) {
    debuggerModel.removeEventListener(SDK.DebuggerModel.Events.GlobalObjectCleared, this.globalObjectCleared, this);
    debuggerModel.removeEventListener(SDK.DebuggerModel.Events.ParsedScriptSource, this.parsedScriptSource, this);
    debuggerModel.removeEventListener(SDK.DebuggerModel.Events.DebuggerResumed, this.debuggerResumed, this);
    debuggerModel.setEvaluateOnCallFrameCallback(null);
    const modelData = this.#debuggerModelToData.get(debuggerModel);
    if (modelData) {
      modelData.dispose();
      this.#debuggerModelToData.delete(debuggerModel);
    }
    this.#rawModuleHandles.forEach((rawModuleHandle, rawModuleId) => {
      const scripts = rawModuleHandle.scripts.filter((script) => script.debuggerModel !== debuggerModel);
      if (scripts.length === 0) {
        rawModuleHandle.plugin.removeRawModule(rawModuleId).catch((error) => {
          Common.Console.Console.instance().error(
            i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }),
            /* show=*/
            false
          );
        });
        this.#rawModuleHandles.delete(rawModuleId);
      } else {
        rawModuleHandle.scripts = scripts;
      }
    });
  }
  globalObjectCleared(event) {
    const debuggerModel = event.data;
    this.modelRemoved(debuggerModel);
    this.modelAdded(debuggerModel);
  }
  addPlugin(plugin) {
    this.#plugins.push(plugin);
    for (const debuggerModel of this.#debuggerModelToData.keys()) {
      for (const script of debuggerModel.scripts()) {
        if (this.hasPluginForScript(script)) {
          continue;
        }
        this.parsedScriptSource({ data: script });
      }
    }
  }
  removePlugin(plugin) {
    this.#plugins = this.#plugins.filter((p) => p !== plugin);
    const scripts = /* @__PURE__ */ new Set();
    this.#rawModuleHandles.forEach((rawModuleHandle, rawModuleId) => {
      if (rawModuleHandle.plugin !== plugin) {
        return;
      }
      rawModuleHandle.scripts.forEach((script) => scripts.add(script));
      this.#rawModuleHandles.delete(rawModuleId);
    });
    for (const script of scripts) {
      const modelData = this.#debuggerModelToData.get(script.debuggerModel);
      modelData.removeScript(script);
      this.parsedScriptSource({ data: script });
    }
  }
  hasPluginForScript(script) {
    const rawModuleId = rawModuleIdForScript(script);
    const rawModuleHandle = this.#rawModuleHandles.get(rawModuleId);
    return rawModuleHandle?.scripts.includes(script) ?? false;
  }
  /**
   * Returns the responsible language #plugin and the raw module ID for a script.
   *
   * This ensures that the `addRawModule` call finishes first such that the
   * caller can immediately issue calls to the returned #plugin without the
   * risk of racing with the `addRawModule` call. The returned #plugin will be
   * set to undefined to indicate that there's no #plugin for the script.
   */
  async rawModuleIdAndPluginForScript(script) {
    const rawModuleId = rawModuleIdForScript(script);
    const rawModuleHandle = this.#rawModuleHandles.get(rawModuleId);
    if (rawModuleHandle) {
      await rawModuleHandle.addRawModulePromise;
      if (rawModuleHandle === this.#rawModuleHandles.get(rawModuleId)) {
        return { rawModuleId, plugin: rawModuleHandle.plugin };
      }
    }
    return { rawModuleId, plugin: null };
  }
  uiSourceCodeForURL(debuggerModel, url) {
    const modelData = this.#debuggerModelToData.get(debuggerModel);
    if (modelData) {
      return modelData.getProject().uiSourceCodeForURL(url);
    }
    return null;
  }
  async rawLocationToUILocation(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return null;
    }
    const { rawModuleId, plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return null;
    }
    const pluginLocation = {
      rawModuleId,
      // RawLocation.#columnNumber is the byte offset in the full raw wasm module. Plugins expect the offset in the code
      // section, so subtract the offset of the code section in the module here.
      codeOffset: rawLocation.columnNumber - (script.codeOffset() || 0),
      inlineFrameIndex: rawLocation.inlineFrameIndex
    };
    try {
      const sourceLocations = await plugin.rawLocationToSourceLocation(pluginLocation);
      for (const sourceLocation of sourceLocations) {
        const uiSourceCode = this.uiSourceCodeForURL(
          script.debuggerModel,
          sourceLocation.sourceFileURL
        );
        if (!uiSourceCode) {
          continue;
        }
        return uiSourceCode.uiLocation(
          sourceLocation.lineNumber,
          sourceLocation.columnNumber >= 0 ? sourceLocation.columnNumber : void 0
        );
      }
    } catch (error) {
      Common.Console.Console.instance().error(
        i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }),
        /* show=*/
        false
      );
    }
    return null;
  }
  uiLocationToRawLocationRanges(uiSourceCode, lineNumber, columnNumber = -1) {
    const locationPromises = [];
    this.scriptsForUISourceCode(uiSourceCode).forEach((script) => {
      const rawModuleId = rawModuleIdForScript(script);
      const rawModuleHandle = this.#rawModuleHandles.get(rawModuleId);
      if (!rawModuleHandle) {
        return;
      }
      const { plugin } = rawModuleHandle;
      locationPromises.push(getLocations(rawModuleId, plugin, script));
    });
    if (locationPromises.length === 0) {
      return Promise.resolve(null);
    }
    return Promise.all(locationPromises).then((locations) => locations.flat()).catch((error) => {
      Common.Console.Console.instance().error(
        i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }),
        /* show=*/
        false
      );
      return null;
    });
    async function getLocations(rawModuleId, plugin, script) {
      const pluginLocation = { rawModuleId, sourceFileURL: uiSourceCode.url(), lineNumber, columnNumber };
      const rawLocations = await plugin.sourceLocationToRawLocation(pluginLocation);
      if (!rawLocations) {
        return [];
      }
      return rawLocations.map(
        (m) => ({
          start: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.startOffset) + (script.codeOffset() || 0)
          ),
          end: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.endOffset) + (script.codeOffset() || 0)
          )
        })
      );
    }
  }
  async uiLocationToRawLocations(uiSourceCode, lineNumber, columnNumber) {
    const locationRanges = await this.uiLocationToRawLocationRanges(uiSourceCode, lineNumber, columnNumber);
    if (!locationRanges) {
      return null;
    }
    return locationRanges.map(({ start }) => start);
  }
  async uiLocationRangeToRawLocationRanges(uiSourceCode, textRange) {
    const locationRangesPromises = [];
    for (let line = textRange.startLine; line <= textRange.endLine; ++line) {
      locationRangesPromises.push(this.uiLocationToRawLocationRanges(uiSourceCode, line));
    }
    const ranges = [];
    for (const locationRanges of await Promise.all(locationRangesPromises)) {
      if (locationRanges === null) {
        return null;
      }
      for (const range of locationRanges) {
        const [startLocation, endLocation] = await Promise.all([
          this.rawLocationToUILocation(range.start),
          this.rawLocationToUILocation(range.end)
        ]);
        if (startLocation === null || endLocation === null) {
          continue;
        }
        const overlap = textRange.intersection(new TextUtils.TextRange.TextRange(
          startLocation.lineNumber,
          startLocation.columnNumber ?? 0,
          endLocation.lineNumber,
          endLocation.columnNumber ?? Infinity
        ));
        if (!overlap.isEmpty()) {
          ranges.push(range);
        }
      }
    }
    return ranges;
  }
  async translateRawFramesStep(rawFrames, translatedFrames, target) {
    const frame = rawFrames[0];
    const script = target.model(SDK.DebuggerModel.DebuggerModel)?.scriptForId(frame.scriptId ?? "");
    if (!script) {
      return false;
    }
    const functionInfo = await this.getFunctionInfo(script, frame);
    if (!functionInfo) {
      return false;
    }
    rawFrames.shift();
    if ("frames" in functionInfo && functionInfo.frames.length) {
      const framePromises = functionInfo.frames.map(async ({ name }, index) => {
        const rawLocation = new SDK.DebuggerModel.Location(
          script.debuggerModel,
          script.scriptId,
          frame.lineNumber,
          frame.columnNumber,
          index
        );
        const uiLocation2 = await this.rawLocationToUILocation(rawLocation);
        return translatedFromUILocation(uiLocation2, name, frame);
      });
      translatedFrames.push(await Promise.all(framePromises));
      return true;
    }
    const uiLocation = await this.#debuggerWorkspaceBinding.rawLocationToUILocation(
      new SDK.DebuggerModel.Location(script.debuggerModel, script.scriptId, frame.lineNumber, frame.columnNumber)
    );
    const mappedFrame = translatedFromUILocation(uiLocation, frame.functionName, frame);
    if ("missingSymbolFiles" in functionInfo && functionInfo.missingSymbolFiles.length) {
      translatedFrames.push([{
        ...mappedFrame,
        missingDebugInfo: {
          type: StackTrace.StackTrace.MissingDebugInfoType.PARTIAL_INFO,
          missingDebugFiles: functionInfo.missingSymbolFiles
        }
      }]);
    } else {
      translatedFrames.push([{
        ...mappedFrame,
        missingDebugInfo: {
          type: StackTrace.StackTrace.MissingDebugInfoType.NO_INFO
        }
      }]);
    }
    return true;
    function translatedFromUILocation(uiLocation2, name, fallback) {
      if (uiLocation2) {
        return {
          uiSourceCode: uiLocation2.uiSourceCode,
          name,
          line: uiLocation2.lineNumber,
          column: uiLocation2.columnNumber ?? -1
        };
      }
      return {
        url: fallback.url,
        name: fallback.functionName,
        line: fallback.lineNumber,
        column: fallback.columnNumber
      };
    }
  }
  scriptsForUISourceCode(uiSourceCode) {
    for (const modelData of this.#debuggerModelToData.values()) {
      const scripts = modelData.uiSourceCodeToScripts.get(uiSourceCode);
      if (scripts) {
        return scripts;
      }
    }
    return [];
  }
  setDebugInfoURL(script, externalURL) {
    if (this.hasPluginForScript(script)) {
      return;
    }
    script.debugSymbols = { type: Protocol.Debugger.DebugSymbolsType.ExternalDWARF, externalURL };
    this.parsedScriptSource({ data: script });
    void script.debuggerModel.setDebugInfoURL(script, externalURL);
  }
  parsedScriptSource(event) {
    const script = event.data;
    if (!script.sourceURL) {
      return;
    }
    for (const plugin of this.#plugins) {
      if (!plugin.handleScript(script)) {
        continue;
      }
      const rawModuleId = rawModuleIdForScript(script);
      let rawModuleHandle = this.#rawModuleHandles.get(rawModuleId);
      if (!rawModuleHandle) {
        const sourceFileURLsPromise = (async () => {
          const console2 = Common.Console.Console.instance();
          const url = script.sourceURL;
          const symbolsUrl = script.debugSymbols?.externalURL || "";
          if (symbolsUrl) {
            console2.log(i18nString(UIStrings.loadingDebugSymbolsForVia, { PH1: plugin.name, PH2: url, PH3: symbolsUrl }));
          } else {
            console2.log(i18nString(UIStrings.loadingDebugSymbolsFor, { PH1: plugin.name, PH2: url }));
          }
          try {
            const code = !symbolsUrl && Common.ParsedURL.schemeIs(url, "wasm:") ? await script.getWasmBytecode() : void 0;
            const addModuleResult = await plugin.addRawModule(rawModuleId, symbolsUrl, { url, code });
            if (rawModuleHandle !== this.#rawModuleHandles.get(rawModuleId)) {
              return [];
            }
            if ("missingSymbolFiles" in addModuleResult) {
              const initiator = plugin.createPageResourceLoadInitiator();
              const missingSymbolFiles = addModuleResult.missingSymbolFiles.map((resource) => {
                const resourceUrl = resource;
                return { resourceUrl, initiator };
              });
              return { missingSymbolFiles };
            }
            const sourceFileURLs = addModuleResult;
            if (sourceFileURLs.length === 0) {
              console2.warn(i18nString(UIStrings.loadedDebugSymbolsForButDidnt, { PH1: plugin.name, PH2: url }));
            } else {
              console2.log(i18nString(
                UIStrings.loadedDebugSymbolsForFound,
                { PH1: plugin.name, PH2: url, PH3: sourceFileURLs.length }
              ));
            }
            return sourceFileURLs;
          } catch (error) {
            console2.error(
              i18nString(UIStrings.failedToLoadDebugSymbolsFor, { PH1: plugin.name, PH2: url, PH3: error.message }),
              /* show=*/
              false
            );
            this.#rawModuleHandles.delete(rawModuleId);
            return [];
          }
        })();
        rawModuleHandle = { rawModuleId, plugin, scripts: [script], addRawModulePromise: sourceFileURLsPromise };
        this.#rawModuleHandles.set(rawModuleId, rawModuleHandle);
      } else {
        rawModuleHandle.scripts.push(script);
      }
      void rawModuleHandle.addRawModulePromise.then((sourceFileURLs) => {
        if (script.debuggerModel.scriptForId(script.scriptId) === script) {
          const modelData = this.#debuggerModelToData.get(script.debuggerModel);
          if (modelData && Array.isArray(sourceFileURLs)) {
            modelData.addSourceFiles(script, sourceFileURLs);
          }
          void this.#debuggerWorkspaceBinding.updateLocations(script);
        }
      });
      return;
    }
  }
  debuggerResumed(event) {
    const resumedFrames = Array.from(this.callFrameByStopId.values()).filter((callFrame) => callFrame.debuggerModel === event.data);
    for (const callFrame of resumedFrames) {
      const stopId = this.stopIdByCallFrame.get(callFrame);
      assertNotNullOrUndefined(stopId);
      this.stopIdByCallFrame.delete(callFrame);
      this.callFrameByStopId.delete(stopId);
    }
  }
  getSourcesForScript(script) {
    const rawModuleId = rawModuleIdForScript(script);
    const rawModuleHandle = this.#rawModuleHandles.get(rawModuleId);
    if (rawModuleHandle) {
      return rawModuleHandle.addRawModulePromise;
    }
    return Promise.resolve(void 0);
  }
  async resolveScopeChain(callFrame) {
    const script = callFrame.script;
    const { rawModuleId, plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return null;
    }
    const location = {
      rawModuleId,
      codeOffset: callFrame.location().columnNumber - (script.codeOffset() || 0),
      inlineFrameIndex: callFrame.inlineFrameIndex
    };
    const stopId = this.stopIdForCallFrame(callFrame);
    try {
      const sourceMapping = await plugin.rawLocationToSourceLocation(location);
      if (sourceMapping.length === 0) {
        return null;
      }
      const scopes = /* @__PURE__ */ new Map();
      const variables = await plugin.listVariablesInScope(location);
      for (const variable of variables || []) {
        let scope = scopes.get(variable.scope);
        if (!scope) {
          const { type, typeName, icon } = await plugin.getScopeInfo(variable.scope);
          scope = new SourceScope(callFrame, stopId, type, typeName, icon, plugin);
          scopes.set(variable.scope, scope);
        }
        scope.object().variables.push(variable);
      }
      return Array.from(scopes.values());
    } catch (error) {
      Common.Console.Console.instance().error(
        i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }),
        /* show=*/
        false
      );
      return null;
    }
  }
  async getFunctionInfo(script, location) {
    const { rawModuleId, plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return null;
    }
    const rawLocation = {
      rawModuleId,
      codeOffset: location.columnNumber - (script.codeOffset() || 0),
      inlineFrameIndex: 0
    };
    try {
      const functionInfo = await plugin.getFunctionInfo(rawLocation);
      if ("missingSymbolFiles" in functionInfo) {
        const initiator = plugin.createPageResourceLoadInitiator();
        const missingSymbolFiles = functionInfo.missingSymbolFiles.map((resource) => {
          const resourceUrl = resource;
          return { resourceUrl, initiator };
        });
        return { missingSymbolFiles, ..."frames" in functionInfo && { frames: functionInfo.frames } };
      }
      return functionInfo;
    } catch (error) {
      Common.Console.Console.instance().warn(i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }));
      return { frames: [] };
    }
  }
  async getInlinedFunctionRanges(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return [];
    }
    const { rawModuleId, plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return [];
    }
    const pluginLocation = {
      rawModuleId,
      // RawLocation.#columnNumber is the byte offset in the full raw wasm module. Plugins expect the offset in the code
      // section, so subtract the offset of the code section in the module here.
      codeOffset: rawLocation.columnNumber - (script.codeOffset() || 0)
    };
    try {
      const locations = await plugin.getInlinedFunctionRanges(pluginLocation);
      return locations.map(
        (m) => ({
          start: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.startOffset) + (script.codeOffset() || 0)
          ),
          end: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.endOffset) + (script.codeOffset() || 0)
          )
        })
      );
    } catch (error) {
      Common.Console.Console.instance().warn(i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }));
      return [];
    }
  }
  async getInlinedCalleesRanges(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return [];
    }
    const { rawModuleId, plugin } = await this.rawModuleIdAndPluginForScript(script);
    if (!plugin) {
      return [];
    }
    const pluginLocation = {
      rawModuleId,
      // RawLocation.#columnNumber is the byte offset in the full raw wasm module. Plugins expect the offset in the code
      // section, so subtract the offset of the code section in the module here.
      codeOffset: rawLocation.columnNumber - (script.codeOffset() || 0)
    };
    try {
      const locations = await plugin.getInlinedCalleesRanges(pluginLocation);
      return locations.map(
        (m) => ({
          start: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.startOffset) + (script.codeOffset() || 0)
          ),
          end: new SDK.DebuggerModel.Location(
            script.debuggerModel,
            script.scriptId,
            0,
            Number(m.endOffset) + (script.codeOffset() || 0)
          )
        })
      );
    } catch (error) {
      Common.Console.Console.instance().warn(i18nString(UIStrings.errorInDebuggerLanguagePlugin, { PH1: error.message }));
      return [];
    }
  }
  async getMappedLines(uiSourceCode) {
    const rawModuleIds = await Promise.all(this.scriptsForUISourceCode(uiSourceCode).map((s) => this.rawModuleIdAndPluginForScript(s)));
    let mappedLines = null;
    for (const { rawModuleId, plugin } of rawModuleIds) {
      if (!plugin) {
        continue;
      }
      const lines = await plugin.getMappedLines(rawModuleId, uiSourceCode.url());
      if (lines === void 0) {
        continue;
      }
      if (mappedLines === null) {
        mappedLines = new Set(lines);
      } else {
        lines.forEach((l) => mappedLines.add(l));
      }
    }
    return mappedLines;
  }
}
class ModelData {
  project;
  uiSourceCodeToScripts;
  constructor(debuggerModel, workspace) {
    this.project = new ContentProviderBasedProject(
      workspace,
      "language_plugins::" + debuggerModel.target().id(),
      Workspace.Workspace.projectTypes.Network,
      "",
      false
      /* isServiceProject */
    );
    NetworkProject.setTargetForProject(this.project, debuggerModel.target());
    this.uiSourceCodeToScripts = /* @__PURE__ */ new Map();
  }
  addSourceFiles(script, urls) {
    const initiator = script.createPageResourceLoadInitiator();
    for (const url of urls) {
      let uiSourceCode = this.project.uiSourceCodeForURL(url);
      if (!uiSourceCode) {
        uiSourceCode = this.project.createUISourceCode(url, Common.ResourceType.resourceTypes.SourceMapScript);
        NetworkProject.setInitialFrameAttribution(uiSourceCode, script.frameId);
        this.uiSourceCodeToScripts.set(uiSourceCode, [script]);
        const contentProvider = new SDK.CompilerSourceMappingContentProvider.CompilerSourceMappingContentProvider(
          url,
          Common.ResourceType.resourceTypes.SourceMapScript,
          initiator
        );
        const mimeType = Common.ResourceType.ResourceType.mimeFromURL(url) || "text/javascript";
        this.project.addUISourceCodeWithProvider(uiSourceCode, contentProvider, null, mimeType);
      } else {
        const scripts = this.uiSourceCodeToScripts.get(uiSourceCode);
        if (!scripts.includes(script)) {
          scripts.push(script);
        }
      }
    }
  }
  removeScript(script) {
    this.uiSourceCodeToScripts.forEach((scripts, uiSourceCode) => {
      scripts = scripts.filter((s) => s !== script);
      if (scripts.length === 0) {
        this.uiSourceCodeToScripts.delete(uiSourceCode);
        this.project.removeUISourceCode(uiSourceCode.url());
      } else {
        this.uiSourceCodeToScripts.set(uiSourceCode, scripts);
      }
    });
  }
  dispose() {
    this.project.dispose();
  }
  getProject() {
    return this.project;
  }
}
//# sourceMappingURL=DebuggerLanguagePlugins.js.map
