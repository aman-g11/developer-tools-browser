"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as i18n from "../i18n/i18n.js";
import { RemoteObjectImpl, RemoteObjectProperty } from "./RemoteObject.js";
import { contains } from "./SourceMapScopesInfo.js";
const UIStrings = {
  /**
   * @description Title of a section in the debugger showing local JavaScript variables.
   */
  local: "Local",
  /**
   * @description Text that refers to closure as a programming term
   */
  closure: "Closure",
  /**
   * @description Noun that represents a section or block of code in the Debugger Model. Shown in the Sources tab, while paused on a breakpoint.
   */
  block: "Block",
  /**
   * @description Title of a section in the debugger showing JavaScript variables from the global scope.
   */
  global: "Global",
  /**
   * @description Text in Scope Chain Sidebar Pane of the Sources panel
   */
  returnValue: "Return value"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/SourceMapScopeChainEntry.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class SourceMapScopeChainEntry {
  #callFrame;
  #scope;
  #range;
  #isInnerMostFunction;
  #returnValue;
  /**
   * @param isInnerMostFunction If `scope` is the innermost 'function' scope. Only used for labeling as we name the
   * scope of the paused function 'Local', while other outer 'function' scopes are named 'Closure'.
   */
  constructor(callFrame, scope, range, isInnerMostFunction, returnValue) {
    this.#callFrame = callFrame;
    this.#scope = scope;
    this.#range = range;
    this.#isInnerMostFunction = isInnerMostFunction;
    this.#returnValue = returnValue;
  }
  extraProperties() {
    if (this.#returnValue) {
      return [new RemoteObjectProperty(
        i18nString(UIStrings.returnValue),
        this.#returnValue,
        void 0,
        void 0,
        void 0,
        void 0,
        void 0,
        /* synthetic */
        true
      )];
    }
    return [];
  }
  callFrame() {
    return this.#callFrame;
  }
  type() {
    switch (this.#scope.kind) {
      case "global":
        return Protocol.Debugger.ScopeType.Global;
      case "function":
        return this.#isInnerMostFunction ? Protocol.Debugger.ScopeType.Local : Protocol.Debugger.ScopeType.Closure;
      case "block":
        return Protocol.Debugger.ScopeType.Block;
    }
    return this.#scope.kind ?? "";
  }
  typeName() {
    switch (this.#scope.kind) {
      case "global":
        return i18nString(UIStrings.global);
      case "function":
        return this.#isInnerMostFunction ? i18nString(UIStrings.local) : i18nString(UIStrings.closure);
      case "block":
        return i18nString(UIStrings.block);
    }
    return this.#scope.kind ?? "";
  }
  name() {
    return this.#scope.name;
  }
  range() {
    return null;
  }
  object() {
    return new SourceMapScopeRemoteObject(this.#callFrame, this.#scope, this.#range);
  }
  description() {
    return "";
  }
  icon() {
    return void 0;
  }
}
class SourceMapScopeRemoteObject extends RemoteObjectImpl {
  #callFrame;
  #scope;
  #range;
  constructor(callFrame, scope, range) {
    super(
      callFrame.debuggerModel.runtimeModel(),
      /* objectId */
      void 0,
      "object",
      /* sub type */
      void 0,
      /* value */
      null
    );
    this.#callFrame = callFrame;
    this.#scope = scope;
    this.#range = range;
  }
  async doGetProperties(_ownProperties, accessorPropertiesOnly, generatePreview) {
    if (accessorPropertiesOnly) {
      return { properties: [], internalProperties: [] };
    }
    const properties = [];
    for (const [index, variable] of this.#scope.variables.entries()) {
      const expression = this.#findExpression(index);
      if (expression === null) {
        properties.push(SourceMapScopeRemoteObject.#unavailableProperty(variable));
        continue;
      }
      const result = await this.#callFrame.evaluate({ expression, generatePreview });
      if ("error" in result || result.exceptionDetails) {
        properties.push(SourceMapScopeRemoteObject.#unavailableProperty(variable));
      } else {
        properties.push(new RemoteObjectProperty(
          variable,
          result.object,
          /* enumerable */
          false,
          /* writable */
          false,
          /* isOwn */
          true,
          /* wasThrown */
          false
        ));
      }
    }
    return { properties, internalProperties: [] };
  }
  /** @returns null if the variable is unavailable at the current paused location */
  #findExpression(index) {
    if (!this.#range) {
      return null;
    }
    const expressionOrSubRanges = this.#range.values[index];
    if (typeof expressionOrSubRanges === "string") {
      return expressionOrSubRanges;
    }
    if (expressionOrSubRanges === null) {
      return null;
    }
    const pausedPosition = this.#callFrame.location();
    for (const range of expressionOrSubRanges) {
      if (contains({ start: range.from, end: range.to }, pausedPosition.lineNumber, pausedPosition.columnNumber)) {
        return range.value ?? null;
      }
    }
    return null;
  }
  static #unavailableProperty(name) {
    return new RemoteObjectProperty(
      name,
      null,
      /* enumerable */
      false,
      /* writeable */
      false,
      /* isOwn */
      true,
      /* wasThrown */
      false
    );
  }
}
//# sourceMappingURL=SourceMapScopeChainEntry.js.map
