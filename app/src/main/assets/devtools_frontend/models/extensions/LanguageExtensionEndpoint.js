"use strict";
import * as Bindings from "../bindings/bindings.js";
import { PrivateAPI } from "./ExtensionAPI.js";
import { ExtensionEndpoint } from "./ExtensionEndpoint.js";
class LanguageExtensionEndpointImpl extends ExtensionEndpoint {
  plugin;
  constructor(plugin, port) {
    super(port);
    this.plugin = plugin;
  }
  handleEvent({ event }) {
    switch (event) {
      case PrivateAPI.LanguageExtensionPluginEvents.UnregisteredLanguageExtensionPlugin: {
        this.disconnect();
        const { pluginManager } = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
        pluginManager.removePlugin(this.plugin);
        break;
      }
    }
  }
}
export class LanguageExtensionEndpoint {
  supportedScriptTypes;
  endpoint;
  extensionOrigin;
  allowFileAccess;
  name;
  constructor(allowFileAccess, extensionOrigin, name, supportedScriptTypes, port) {
    this.name = name;
    this.extensionOrigin = extensionOrigin;
    this.supportedScriptTypes = supportedScriptTypes;
    this.endpoint = new LanguageExtensionEndpointImpl(this, port);
    this.allowFileAccess = allowFileAccess;
  }
  canAccessURL(url) {
    try {
      return !url || this.allowFileAccess || new URL(url).protocol !== "file:";
    } catch {
      return true;
    }
  }
  handleScript(script) {
    try {
      if (!this.canAccessURL(script.contentURL()) || script.hasSourceURL && !this.canAccessURL(script.sourceURL) || script.debugSymbols?.externalURL && !this.canAccessURL(script.debugSymbols.externalURL)) {
        return false;
      }
    } catch {
      return false;
    }
    const language = script.scriptLanguage();
    return language !== null && script.debugSymbols !== null && language === this.supportedScriptTypes.language && this.supportedScriptTypes.symbol_types.includes(script.debugSymbols.type);
  }
  createPageResourceLoadInitiator() {
    return {
      target: null,
      frameId: null,
      extensionId: this.extensionOrigin,
      initiatorUrl: this.extensionOrigin
    };
  }
  /**
   * Notify the plugin about a new script
   */
  addRawModule(rawModuleId, symbolsURL, rawModule) {
    if (!this.canAccessURL(symbolsURL) || !this.canAccessURL(rawModule.url)) {
      return Promise.resolve([]);
    }
    return this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.AddRawModule,
      { rawModuleId, symbolsURL, rawModule }
    );
  }
  /**
   * Notifies the plugin that a script is removed.
   */
  removeRawModule(rawModuleId) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.RemoveRawModule, { rawModuleId });
  }
  /**
   * Find locations in raw modules from a location in a source file
   */
  sourceLocationToRawLocation(sourceLocation) {
    return this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.SourceLocationToRawLocation,
      { sourceLocation }
    );
  }
  /**
   * Find locations in source files from a location in a raw module
   */
  rawLocationToSourceLocation(rawLocation) {
    return this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.RawLocationToSourceLocation,
      { rawLocation }
    );
  }
  getScopeInfo(type) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.GetScopeInfo, { type });
  }
  /**
   * List all variables in lexical scope at a given location in a raw module
   */
  listVariablesInScope(rawLocation) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.ListVariablesInScope, { rawLocation });
  }
  /**
   * List all function names (including inlined frames) at location
   */
  getFunctionInfo(rawLocation) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.GetFunctionInfo, { rawLocation });
  }
  /**
   * Find locations in raw modules corresponding to the inline function
   *  that rawLocation is in.
   */
  getInlinedFunctionRanges(rawLocation) {
    return this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.GetInlinedFunctionRanges,
      { rawLocation }
    );
  }
  /**
   * Find locations in raw modules corresponding to inline functions
   *  called by the function or inline frame that rawLocation is in.
   */
  getInlinedCalleesRanges(rawLocation) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.GetInlinedCalleesRanges, { rawLocation });
  }
  async getMappedLines(rawModuleId, sourceFileURL) {
    return await this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.GetMappedLines,
      { rawModuleId, sourceFileURL }
    );
  }
  async evaluate(expression, context, stopId) {
    return await this.endpoint.sendRequest(
      PrivateAPI.LanguageExtensionPluginCommands.FormatValue,
      { expression, context, stopId }
    );
  }
  getProperties(objectId) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.GetProperties, { objectId });
  }
  releaseObject(objectId) {
    return this.endpoint.sendRequest(PrivateAPI.LanguageExtensionPluginCommands.ReleaseObject, { objectId });
  }
}
//# sourceMappingURL=LanguageExtensionEndpoint.js.map
