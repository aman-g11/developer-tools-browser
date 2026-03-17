"use strict";
export function isDebugMode() {
  return Boolean(localStorage.getItem("debugAiAssistancePanelEnabled"));
}
export function isStructuredLogEnabled() {
  return Boolean(localStorage.getItem("aiAssistanceStructuredLogEnabled"));
}
export function debugLog(...log) {
  if (!isDebugMode()) {
    return;
  }
  console.log(...log);
}
function setDebugAiAssistanceEnabled(enabled) {
  if (enabled) {
    localStorage.setItem("debugAiAssistancePanelEnabled", "true");
  } else {
    localStorage.removeItem("debugAiAssistancePanelEnabled");
  }
  setAiAssistanceStructuredLogEnabled(enabled);
}
globalThis.setDebugAiAssistanceEnabled = setDebugAiAssistanceEnabled;
function setAiAssistanceStructuredLogEnabled(enabled) {
  if (enabled) {
    localStorage.setItem("aiAssistanceStructuredLogEnabled", "true");
  } else {
    localStorage.removeItem("aiAssistanceStructuredLogEnabled");
  }
}
globalThis.setAiAssistanceStructuredLogEnabled = setAiAssistanceStructuredLogEnabled;
//# sourceMappingURL=debug.js.map
