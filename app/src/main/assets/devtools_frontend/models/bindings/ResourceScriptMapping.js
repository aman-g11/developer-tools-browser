"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as Formatter from "../formatter/formatter.js";
import * as TextUtils from "../text_utils/text_utils.js";
import * as Workspace from "../workspace/workspace.js";
import { ContentProviderBasedProject } from "./ContentProviderBasedProject.js";
import { DebuggerWorkspaceBinding } from "./DebuggerWorkspaceBinding.js";
import { NetworkProject } from "./NetworkProject.js";
import { metadataForURL } from "./ResourceUtils.js";
const UIStrings = {
  /**
   * @description Error text displayed in the console when editing a live script fails. LiveEdit is
   *the name of the feature for editing code that is already running.
   * @example {warning} PH1
   */
  liveEditFailed: "`LiveEdit` failed: {PH1}",
  /**
   * @description Error text displayed in the console when compiling a live-edited script fails. LiveEdit is
   *the name of the feature for editing code that is already running.
   * @example {connection lost} PH1
   */
  liveEditCompileFailed: "`LiveEdit` compile failed: {PH1}"
};
const str_ = i18n.i18n.registerUIStrings("models/bindings/ResourceScriptMapping.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class ResourceScriptMapping {
  debuggerModel;
  #workspace;
  debuggerWorkspaceBinding;
  #uiSourceCodeToScriptFile;
  #projects;
  #scriptToUISourceCode;
  #eventListeners;
  constructor(debuggerModel, workspace, debuggerWorkspaceBinding) {
    this.debuggerModel = debuggerModel;
    this.#workspace = workspace;
    this.debuggerWorkspaceBinding = debuggerWorkspaceBinding;
    this.#uiSourceCodeToScriptFile = /* @__PURE__ */ new Map();
    this.#projects = /* @__PURE__ */ new Map();
    this.#scriptToUISourceCode = /* @__PURE__ */ new Map();
    const runtimeModel = debuggerModel.runtimeModel();
    this.#eventListeners = [
      this.debuggerModel.addEventListener(
        SDK.DebuggerModel.Events.ParsedScriptSource,
        (event) => this.addScript(event.data),
        this
      ),
      this.debuggerModel.addEventListener(SDK.DebuggerModel.Events.GlobalObjectCleared, this.globalObjectCleared, this),
      runtimeModel.addEventListener(
        SDK.RuntimeModel.Events.ExecutionContextDestroyed,
        this.executionContextDestroyed,
        this
      ),
      runtimeModel.target().targetManager().addEventListener(
        SDK.TargetManager.Events.INSPECTED_URL_CHANGED,
        this.inspectedURLChanged,
        this
      )
    ];
  }
  project(script) {
    const prefix = script.isContentScript() ? "js:extensions:" : "js::";
    const projectId = prefix + this.debuggerModel.target().id() + ":" + script.frameId;
    let project = this.#projects.get(projectId);
    if (!project) {
      const projectType = script.isContentScript() ? Workspace.Workspace.projectTypes.ContentScripts : Workspace.Workspace.projectTypes.Network;
      project = new ContentProviderBasedProject(
        this.#workspace,
        projectId,
        projectType,
        "",
        false
        /* isServiceProject */
      );
      NetworkProject.setTargetForProject(project, this.debuggerModel.target());
      this.#projects.set(projectId, project);
    }
    return project;
  }
  uiSourceCodeForScript(script) {
    return this.#scriptToUISourceCode.get(script) ?? null;
  }
  rawLocationToUILocation(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return null;
    }
    const uiSourceCode = this.#scriptToUISourceCode.get(script);
    if (!uiSourceCode) {
      return null;
    }
    const scriptFile = this.#uiSourceCodeToScriptFile.get(uiSourceCode);
    if (!scriptFile) {
      return null;
    }
    if (scriptFile.hasDivergedFromVM() && !scriptFile.isMergingToVM() || scriptFile.isDivergingFromVM()) {
      return null;
    }
    if (scriptFile.script !== script) {
      return null;
    }
    const { lineNumber, columnNumber = 0 } = rawLocation;
    return uiSourceCode.uiLocation(lineNumber, columnNumber);
  }
  uiLocationToRawLocations(uiSourceCode, lineNumber, columnNumber) {
    const scriptFile = this.#uiSourceCodeToScriptFile.get(uiSourceCode);
    if (!scriptFile) {
      return [];
    }
    const { script } = scriptFile;
    if (!script) {
      return [];
    }
    return [this.debuggerModel.createRawLocation(script, lineNumber, columnNumber)];
  }
  uiLocationRangeToRawLocationRanges(uiSourceCode, { startLine, startColumn, endLine, endColumn }) {
    const scriptFile = this.#uiSourceCodeToScriptFile.get(uiSourceCode);
    if (!scriptFile) {
      return null;
    }
    const { script } = scriptFile;
    if (!script) {
      return null;
    }
    const start = this.debuggerModel.createRawLocation(script, startLine, startColumn);
    const end = this.debuggerModel.createRawLocation(script, endLine, endColumn);
    return [{ start, end }];
  }
  inspectedURLChanged(event) {
    for (let target = this.debuggerModel.target(); target !== event.data; target = target.parentTarget()) {
      if (target === null) {
        return;
      }
    }
    for (const script of Array.from(this.#scriptToUISourceCode.keys())) {
      this.removeScripts([script]);
      this.addScript(script);
    }
  }
  async functionBoundsAtRawLocation(rawLocation) {
    const script = rawLocation.script();
    if (!script) {
      return null;
    }
    const uiSourceCode = this.#scriptToUISourceCode.get(script);
    if (!uiSourceCode) {
      return null;
    }
    const scopeTreeAndText = script ? await SDK.ScopeTreeCache.scopeTreeForScript(script) : null;
    if (!scopeTreeAndText) {
      return null;
    }
    const offset = scopeTreeAndText.text.offsetFromPosition(rawLocation.lineNumber, rawLocation.columnNumber);
    const results = [];
    (function walk(nodes) {
      for (const node of nodes) {
        if (!(offset >= node.start && offset < node.end)) {
          continue;
        }
        results.push(node);
        walk(node.children);
      }
    })([scopeTreeAndText.scopeTree]);
    const result = results.findLast(
      (node) => node.kind === Formatter.FormatterWorkerPool.ScopeKind.FUNCTION || node.kind === Formatter.FormatterWorkerPool.ScopeKind.ARROW_FUNCTION
    );
    if (!result) {
      return null;
    }
    const startPosition = scopeTreeAndText.text.positionFromOffset(result.start);
    const endPosition = scopeTreeAndText.text.positionFromOffset(result.end);
    const name = "";
    const range = new TextUtils.TextRange.TextRange(
      startPosition.lineNumber,
      startPosition.columnNumber,
      endPosition.lineNumber,
      endPosition.columnNumber
    );
    return new Workspace.UISourceCode.UIFunctionBounds(uiSourceCode, range, name);
  }
  addScript(script) {
    if (script.isLiveEdit() || script.isBreakpointCondition) {
      return;
    }
    let url = script.sourceURL;
    if (!url) {
      return;
    }
    if (script.hasSourceURL) {
      url = SDK.SourceMapManager.SourceMapManager.resolveRelativeSourceURL(script.debuggerModel.target(), url);
    } else {
      if (script.isInlineScript()) {
        return;
      }
      if (script.isContentScript()) {
        const parsedURL = new Common.ParsedURL.ParsedURL(url);
        if (!parsedURL.isValid) {
          return;
        }
      }
    }
    const project = this.project(script);
    const oldUISourceCode = project.uiSourceCodeForURL(url);
    if (oldUISourceCode) {
      const oldScriptFile = this.#uiSourceCodeToScriptFile.get(oldUISourceCode);
      if (oldScriptFile?.script) {
        this.removeScripts([oldScriptFile.script]);
      }
    }
    const originalContentProvider = script.originalContentProvider();
    const uiSourceCode = project.createUISourceCode(url, originalContentProvider.contentType());
    NetworkProject.setInitialFrameAttribution(uiSourceCode, script.frameId);
    const metadata = metadataForURL(this.debuggerModel.target(), script.frameId, url);
    const scriptFile = new ResourceScriptFile(this, uiSourceCode, script);
    this.#uiSourceCodeToScriptFile.set(uiSourceCode, scriptFile);
    this.#scriptToUISourceCode.set(script, uiSourceCode);
    const mimeType = script.isWasm() ? "application/wasm" : "text/javascript";
    project.addUISourceCodeWithProvider(uiSourceCode, originalContentProvider, metadata, mimeType);
    void this.debuggerWorkspaceBinding.updateLocations(script);
  }
  scriptFile(uiSourceCode) {
    return this.#uiSourceCodeToScriptFile.get(uiSourceCode) || null;
  }
  removeScripts(scripts) {
    const uiSourceCodesByProject = new Platform.MapUtilities.Multimap();
    for (const script of scripts) {
      const uiSourceCode = this.#scriptToUISourceCode.get(script);
      if (!uiSourceCode) {
        continue;
      }
      const scriptFile = this.#uiSourceCodeToScriptFile.get(uiSourceCode);
      if (scriptFile) {
        scriptFile.dispose();
      }
      this.#uiSourceCodeToScriptFile.delete(uiSourceCode);
      this.#scriptToUISourceCode.delete(script);
      uiSourceCodesByProject.set(uiSourceCode.project(), uiSourceCode);
      void this.debuggerWorkspaceBinding.updateLocations(script);
    }
    for (const project of uiSourceCodesByProject.keysArray()) {
      const uiSourceCodes = uiSourceCodesByProject.get(project);
      let allInProjectRemoved = true;
      for (const projectSourceCode of project.uiSourceCodes()) {
        if (!uiSourceCodes.has(projectSourceCode)) {
          allInProjectRemoved = false;
          break;
        }
      }
      if (allInProjectRemoved) {
        this.#projects.delete(project.id());
        project.removeProject();
      } else {
        uiSourceCodes.forEach((c) => project.removeUISourceCode(c.url()));
      }
    }
  }
  executionContextDestroyed(event) {
    const executionContext = event.data;
    this.removeScripts(this.debuggerModel.scriptsForExecutionContext(executionContext));
  }
  globalObjectCleared() {
    const scripts = Array.from(this.#scriptToUISourceCode.keys());
    this.removeScripts(scripts);
  }
  resetForTest() {
    this.globalObjectCleared();
  }
  dispose() {
    Common.EventTarget.removeEventListeners(this.#eventListeners);
    this.globalObjectCleared();
  }
}
export class ResourceScriptFile extends Common.ObjectWrapper.ObjectWrapper {
  #resourceScriptMapping;
  uiSourceCode;
  script;
  #scriptSource;
  #isDivergingFromVM;
  #hasDivergedFromVM;
  #isMergingToVM;
  #updateMutex = new Common.Mutex.Mutex();
  constructor(resourceScriptMapping, uiSourceCode, script) {
    super();
    this.#resourceScriptMapping = resourceScriptMapping;
    this.uiSourceCode = uiSourceCode;
    this.script = this.uiSourceCode.contentType().isScript() ? script : null;
    this.uiSourceCode.addEventListener(Workspace.UISourceCode.Events.WorkingCopyChanged, this.workingCopyChanged, this);
    this.uiSourceCode.addEventListener(
      Workspace.UISourceCode.Events.WorkingCopyCommitted,
      this.workingCopyCommitted,
      this
    );
  }
  isDiverged() {
    if (this.uiSourceCode.isDirty()) {
      return true;
    }
    if (!this.script) {
      return false;
    }
    if (typeof this.#scriptSource === "undefined" || this.#scriptSource === null) {
      return false;
    }
    const workingCopy = this.uiSourceCode.workingCopy();
    if (!workingCopy) {
      return false;
    }
    if (!workingCopy.startsWith(this.#scriptSource.trimEnd())) {
      return true;
    }
    const suffix = this.uiSourceCode.workingCopy().substr(this.#scriptSource.length);
    return Boolean(suffix.length) && !suffix.match(SDK.Script.sourceURLRegex);
  }
  workingCopyChanged() {
    void this.update();
  }
  workingCopyCommitted() {
    if (Root.Runtime.hostConfig.devToolsLiveEdit?.enabled === false) {
      return;
    }
    if (this.uiSourceCode.project().canSetFileContent()) {
      return;
    }
    if (!this.script) {
      return;
    }
    const source = this.uiSourceCode.workingCopy();
    void this.script.editSource(source).then(({ status, exceptionDetails }) => {
      void this.scriptSourceWasSet(source, status, exceptionDetails);
    });
  }
  async scriptSourceWasSet(source, status, exceptionDetails) {
    if (status === Protocol.Debugger.SetScriptSourceResponseStatus.Ok) {
      this.#scriptSource = source;
    }
    await this.update();
    if (status === Protocol.Debugger.SetScriptSourceResponseStatus.Ok) {
      return;
    }
    if (!exceptionDetails) {
      Common.Console.Console.instance().addMessage(
        i18nString(UIStrings.liveEditFailed, { PH1: getErrorText(status) }),
        Common.Console.MessageLevel.WARNING
      );
      return;
    }
    const messageText = i18nString(UIStrings.liveEditCompileFailed, { PH1: exceptionDetails.text });
    this.uiSourceCode.addLineMessage(
      Workspace.UISourceCode.Message.Level.ERROR,
      messageText,
      exceptionDetails.lineNumber,
      exceptionDetails.columnNumber
    );
    function getErrorText(status2) {
      switch (status2) {
        case Protocol.Debugger.SetScriptSourceResponseStatus.BlockedByActiveFunction:
          return "Functions that are on the stack (currently being executed) can not be edited";
        case Protocol.Debugger.SetScriptSourceResponseStatus.BlockedByActiveGenerator:
          return "Async functions/generators that are active can not be edited";
        case Protocol.Debugger.SetScriptSourceResponseStatus.BlockedByTopLevelEsModuleChange:
          return "The top-level of ES modules can not be edited";
        case Protocol.Debugger.SetScriptSourceResponseStatus.CompileError:
        case Protocol.Debugger.SetScriptSourceResponseStatus.Ok:
          throw new Error("Compile errors and Ok status must not be reported on the console");
      }
    }
  }
  async update() {
    const release = await this.#updateMutex.acquire();
    const diverged = this.isDiverged();
    if (diverged && !this.#hasDivergedFromVM) {
      await this.divergeFromVM();
    } else if (!diverged && this.#hasDivergedFromVM) {
      await this.mergeToVM();
    }
    release();
  }
  async divergeFromVM() {
    if (this.script) {
      this.#isDivergingFromVM = true;
      await this.#resourceScriptMapping.debuggerWorkspaceBinding.updateLocations(this.script);
      this.#isDivergingFromVM = void 0;
      this.#hasDivergedFromVM = true;
      this.dispatchEventToListeners(ResourceScriptFile.Events.DID_DIVERGE_FROM_VM);
    }
  }
  async mergeToVM() {
    if (this.script) {
      this.#hasDivergedFromVM = void 0;
      this.#isMergingToVM = true;
      await this.#resourceScriptMapping.debuggerWorkspaceBinding.updateLocations(this.script);
      this.#isMergingToVM = void 0;
      this.dispatchEventToListeners(ResourceScriptFile.Events.DID_MERGE_TO_VM);
    }
  }
  hasDivergedFromVM() {
    return Boolean(this.#hasDivergedFromVM);
  }
  isDivergingFromVM() {
    return Boolean(this.#isDivergingFromVM);
  }
  isMergingToVM() {
    return Boolean(this.#isMergingToVM);
  }
  checkMapping() {
    if (!this.script || typeof this.#scriptSource !== "undefined") {
      this.mappingCheckedForTest();
      return;
    }
    void this.script.requestContentData().then((content) => {
      this.#scriptSource = TextUtils.ContentData.ContentData.textOr(content, null);
      void this.update().then(() => this.mappingCheckedForTest());
    });
  }
  mappingCheckedForTest() {
  }
  dispose() {
    this.uiSourceCode.removeEventListener(
      Workspace.UISourceCode.Events.WorkingCopyChanged,
      this.workingCopyChanged,
      this
    );
    this.uiSourceCode.removeEventListener(
      Workspace.UISourceCode.Events.WorkingCopyCommitted,
      this.workingCopyCommitted,
      this
    );
  }
  addSourceMapURL(sourceMapURL) {
    if (!this.script) {
      return;
    }
    this.script.debuggerModel.setSourceMapURL(this.script, sourceMapURL);
  }
  addDebugInfoURL(debugInfoURL) {
    if (!this.script) {
      return;
    }
    const { pluginManager } = DebuggerWorkspaceBinding.instance();
    pluginManager.setDebugInfoURL(this.script, debugInfoURL);
  }
  hasSourceMapURL() {
    return Boolean(this.script?.sourceMapURL);
  }
  async missingSymbolFiles() {
    if (!this.script) {
      return null;
    }
    const { pluginManager } = this.#resourceScriptMapping.debuggerWorkspaceBinding;
    const sources = await pluginManager.getSourcesForScript(this.script);
    return sources && "missingSymbolFiles" in sources ? sources.missingSymbolFiles : null;
  }
}
((ResourceScriptFile2) => {
  let Events;
  ((Events2) => {
    Events2["DID_MERGE_TO_VM"] = "DidMergeToVM";
    Events2["DID_DIVERGE_FROM_VM"] = "DidDivergeFromVM";
  })(Events = ResourceScriptFile2.Events || (ResourceScriptFile2.Events = {}));
})(ResourceScriptFile || (ResourceScriptFile = {}));
//# sourceMappingURL=ResourceScriptMapping.js.map
