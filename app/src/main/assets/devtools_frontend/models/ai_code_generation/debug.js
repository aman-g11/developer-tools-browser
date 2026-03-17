"use strict";
export function isDebugMode() {
  return Boolean(localStorage.getItem("debugAiCodeGenerationEnabled"));
}
export function debugLog(...log) {
  if (!isDebugMode()) {
    return;
  }
  console.log(...log);
}
function setDebugAiCodeGenerationEnabled(enabled) {
  if (enabled) {
    localStorage.setItem("debugAiCodeGenerationEnabled", "true");
  } else {
    localStorage.removeItem("debugAiCodeGenerationEnabled");
  }
}
globalThis.setDebugAiCodeGenerationEnabled = setDebugAiCodeGenerationEnabled;
//# sourceMappingURL=debug.js.map
