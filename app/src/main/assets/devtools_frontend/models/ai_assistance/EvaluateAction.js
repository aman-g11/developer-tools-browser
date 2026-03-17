"use strict";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import { PAGE_EXPOSED_FUNCTIONS } from "./injected.js";
export function formatError(message) {
  return `Error: ${message}`;
}
export class SideEffectError extends Error {
}
export function getErrorStackOnThePage() {
  return { stack: this.stack, message: this.message };
}
export function stringifyObjectOnThePage() {
  const seenBefore = /* @__PURE__ */ new WeakMap();
  return JSON.stringify(this, function replacer(key, value) {
    if (typeof value === "object" && value !== null) {
      if (seenBefore.has(value)) {
        return "(cycle)";
      }
      seenBefore.set(value, true);
    }
    if (value instanceof HTMLElement) {
      const idAttribute = value.id ? ` id="${value.id}"` : "";
      const classAttribute = value.classList.value ? ` class="${value.classList.value}"` : "";
      return `<${value.nodeName.toLowerCase()}${idAttribute}${classAttribute}>${value.hasChildNodes() ? "..." : ""}</${value.nodeName.toLowerCase()}>`;
    }
    if (this instanceof CSSStyleDeclaration) {
      if (!isNaN(Number(key))) {
        return void 0;
      }
    }
    return value;
  });
}
export async function stringifyRemoteObject(object, functionDeclaration) {
  switch (object.type) {
    case Protocol.Runtime.RemoteObjectType.String:
      return `'${object.value}'`;
    case Protocol.Runtime.RemoteObjectType.Bigint:
      return `${object.value}n`;
    case Protocol.Runtime.RemoteObjectType.Boolean:
    case Protocol.Runtime.RemoteObjectType.Number:
      return `${object.value}`;
    case Protocol.Runtime.RemoteObjectType.Undefined:
      return "undefined";
    case Protocol.Runtime.RemoteObjectType.Symbol:
    case Protocol.Runtime.RemoteObjectType.Function:
      return `${object.description}`;
    case Protocol.Runtime.RemoteObjectType.Object: {
      if (object.subtype === "error") {
        const res2 = await object.callFunctionJSON(getErrorStackOnThePage, []);
        if (!res2) {
          throw new Error("Could not stringify the object" + object);
        }
        return EvaluateAction.stringifyError(res2, functionDeclaration);
      }
      const res = await object.callFunction(stringifyObjectOnThePage);
      if (!res.object || res.object.type !== Protocol.Runtime.RemoteObjectType.String) {
        throw new Error("Could not stringify the object" + object);
      }
      return res.object.value;
    }
    default:
      throw new Error("Unknown type to stringify " + object.type);
  }
}
export class EvaluateAction {
  static async execute(functionDeclaration, args, executionContext, { throwOnSideEffect }) {
    if (executionContext.debuggerModel.selectedCallFrame()) {
      return formatError("Cannot evaluate JavaScript because the execution is paused on a breakpoint.");
    }
    const response = await executionContext.callFunctionOn({
      functionDeclaration,
      returnByValue: false,
      allowUnsafeEvalBlockedByCSP: false,
      throwOnSideEffect,
      userGesture: true,
      awaitPromise: true,
      arguments: args.map((remoteObject) => {
        return { objectId: remoteObject.objectId };
      })
    });
    try {
      if (!response) {
        throw new Error("Response is not found");
      }
      if ("error" in response) {
        return formatError(response.error);
      }
      if (response.exceptionDetails) {
        const exceptionDescription = response.exceptionDetails.exception?.description;
        if (SDK.RuntimeModel.RuntimeModel.isSideEffectFailure(response)) {
          throw new SideEffectError(exceptionDescription);
        }
        return formatError(exceptionDescription ?? "JS exception");
      }
      return await stringifyRemoteObject(response.object, functionDeclaration);
    } finally {
      executionContext.runtimeModel.releaseEvaluationResult(response);
    }
  }
  static getExecutedLineFromStack(stack, pageExposedFunctions) {
    const lines = stack.split("\n");
    const stackLines = lines.map((curr) => curr.trim()).filter((trimmedLine) => {
      return trimmedLine.startsWith("at");
    });
    const selectedStack = stackLines.find((stackLine) => {
      const splittedStackLine = stackLine.split(" ");
      if (splittedStackLine.length < 2) {
        return false;
      }
      const signature = splittedStackLine[1] === "async" ? splittedStackLine[2] : (
        // if the stack line contains async the function name is the next element
        splittedStackLine[1]
      );
      const lastDotIndex = signature.lastIndexOf(".");
      const functionName = lastDotIndex !== -1 ? signature.substring(lastDotIndex + 1) : signature;
      return !pageExposedFunctions.includes(functionName);
    });
    if (!selectedStack) {
      return null;
    }
    const frameLocationRegex = /:(\d+)(?::\d+)?\)?$/;
    const match = selectedStack.match(frameLocationRegex);
    if (!match?.[1]) {
      return null;
    }
    const lineNum = parseInt(match[1], 10);
    if (isNaN(lineNum)) {
      return null;
    }
    return lineNum - 1;
  }
  static stringifyError(result, functionDeclaration) {
    if (!result.stack) {
      return `Error: ${result.message}`;
    }
    const lineNum = EvaluateAction.getExecutedLineFromStack(result.stack, PAGE_EXPOSED_FUNCTIONS);
    if (!lineNum) {
      return `Error: ${result.message}`;
    }
    const functionLines = functionDeclaration.split("\n");
    const errorLine = functionLines[lineNum];
    if (!errorLine) {
      return `Error: ${result.message}`;
    }
    return `Error: executing the line "${errorLine.trim()}" failed with the following error:
${result.message}`;
  }
}
//# sourceMappingURL=EvaluateAction.js.map
