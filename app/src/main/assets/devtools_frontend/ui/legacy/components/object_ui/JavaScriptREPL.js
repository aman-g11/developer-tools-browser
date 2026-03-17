"use strict";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Formatter from "../../../../models/formatter/formatter.js";
import * as SourceMapScopes from "../../../../models/source_map_scopes/source_map_scopes.js";
import * as Acorn from "../../../../third_party/acorn/acorn.js";
import * as UI from "../../legacy.js";
import { RemoteObjectPreviewFormatter } from "./RemoteObjectPreviewFormatter.js";
export class JavaScriptREPL {
  static wrapObjectLiteral(code) {
    const result = /^\s*\{\s*(.*)\s*\}[\s;]*$/.exec(code);
    if (result === null) {
      return code;
    }
    const [, body] = result;
    let level = 0;
    for (const c of body) {
      if (c === "{") {
        level++;
      } else if (c === "}" && --level < 0) {
        return code;
      }
    }
    const parse = (expression) => void Acorn.parse(
      expression,
      { ecmaVersion: 2022, allowAwaitOutsideFunction: true, ranges: false, allowReturnOutsideFunction: true }
    );
    try {
      parse("return {" + body + "};");
      const wrappedCode = "({" + body + "})";
      parse(wrappedCode);
      return wrappedCode;
    } catch {
      return code;
    }
  }
  static async evaluate(text, executionContext, throwOnSideEffect, replMode, timeout, objectGroup, awaitPromise = false, silent = false) {
    const isTextLong = text.length > maxLengthForEvaluation;
    if (!text || throwOnSideEffect && isTextLong) {
      return null;
    }
    let expression = text;
    const callFrame = executionContext.debuggerModel.selectedCallFrame();
    if (callFrame?.script.isJavaScript()) {
      const nameMap = await SourceMapScopes.NamesResolver.allVariablesInCallFrame(callFrame);
      try {
        expression = await Formatter.FormatterWorkerPool.formatterWorkerPool().javaScriptSubstitute(expression, nameMap);
      } catch {
      }
    }
    expression = JavaScriptREPL.wrapObjectLiteral(expression);
    const options = {
      expression,
      generatePreview: true,
      includeCommandLineAPI: true,
      throwOnSideEffect,
      timeout,
      objectGroup,
      disableBreaks: true,
      replMode,
      silent
    };
    return await executionContext.evaluate(options, false, awaitPromise);
  }
  static async evaluateAndBuildPreview(text, throwOnSideEffect, replMode, timeout, allowErrors, objectGroup, awaitPromise = false, silent = false) {
    const executionContext = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
    if (!executionContext) {
      return { preview: document.createDocumentFragment(), result: null };
    }
    const result = await JavaScriptREPL.evaluate(
      text,
      executionContext,
      throwOnSideEffect,
      replMode,
      timeout,
      objectGroup,
      awaitPromise,
      silent
    );
    if (!result) {
      return { preview: document.createDocumentFragment(), result: null };
    }
    const formatter = new RemoteObjectPreviewFormatter();
    const preview = formatter.renderEvaluationResultPreviewFragment(result, allowErrors);
    return { preview, result };
  }
}
const maxLengthForEvaluation = 2e3;
//# sourceMappingURL=JavaScriptREPL.js.map
