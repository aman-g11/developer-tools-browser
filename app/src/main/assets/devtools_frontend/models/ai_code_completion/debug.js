"use strict";
export function isDebugMode() {
  return Boolean(localStorage.getItem("debugAiCodeCompletionEnabled"));
}
export function debugLog(...log) {
  if (!isDebugMode()) {
    return;
  }
  console.log(...log);
}
function setDebugAiCodeCompletionEnabled(enabled) {
  if (enabled) {
    localStorage.setItem("debugAiCodeCompletionEnabled", "true");
  } else {
    localStorage.removeItem("debugAiCodeCompletionEnabled");
  }
}
globalThis.setDebugAiCodeCompletionEnabled = setDebugAiCodeCompletionEnabled;
//# sourceMappingURL=debug.js.map
