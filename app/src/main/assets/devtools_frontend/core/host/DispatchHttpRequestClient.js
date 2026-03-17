"use strict";
import { InspectorFrontendHostInstance } from "./InspectorFrontendHost.js";
export var ErrorType = /* @__PURE__ */ ((ErrorType2) => {
  ErrorType2["HTTP_RESPONSE_UNAVAILABLE"] = "HTTP_RESPONSE_UNAVAILABLE";
  ErrorType2["NOT_FOUND"] = "NOT_FOUND";
  ErrorType2["ABORT"] = "ABORT";
  return ErrorType2;
})(ErrorType || {});
export class DispatchHttpRequestError extends Error {
  constructor(type, response, options) {
    super(void 0, options);
    this.type = type;
    this.response = response;
  }
}
export async function makeHttpRequest(request, options) {
  const signal = options?.signal;
  if (signal?.aborted) {
    throw new DispatchHttpRequestError("ABORT" /* ABORT */);
  }
  const response = await new Promise((resolve, reject) => {
    const onAbort = () => {
      reject(new DispatchHttpRequestError("ABORT" /* ABORT */));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    InspectorFrontendHostInstance.dispatchHttpRequest(request, (result) => {
      signal?.removeEventListener("abort", onAbort);
      resolve(result);
    });
  });
  debugLog({ request, response });
  if (response.statusCode === 404) {
    throw new DispatchHttpRequestError("NOT_FOUND" /* NOT_FOUND */, response);
  }
  if ("response" in response && response.statusCode === 200) {
    if (request.streamId && !response.response) {
      return null;
    }
    try {
      return JSON.parse(response.response);
    } catch (err) {
      throw new DispatchHttpRequestError("HTTP_RESPONSE_UNAVAILABLE" /* HTTP_RESPONSE_UNAVAILABLE */, response, { cause: err });
    }
  }
  throw new DispatchHttpRequestError("HTTP_RESPONSE_UNAVAILABLE" /* HTTP_RESPONSE_UNAVAILABLE */, response);
}
function isDebugMode() {
  return Boolean(localStorage.getItem("debugDispatchHttpRequestEnabled"));
}
function debugLog(...log) {
  if (!isDebugMode()) {
    return;
  }
  console.log("debugLog", ...log);
}
function setDebugDispatchHttpRequestEnabled(enabled) {
  if (enabled) {
    localStorage.setItem("debugDispatchHttpRequestEnabled", "true");
  } else {
    localStorage.removeItem("debugDispatchHttpRequestEnabled");
  }
}
globalThis.setDebugDispatchHttpRequestEnabled = setDebugDispatchHttpRequestEnabled;
//# sourceMappingURL=DispatchHttpRequestClient.js.map
