"use strict";
export const extensionPalette = [
  "primary",
  "primary-light",
  "primary-dark",
  "secondary",
  "secondary-light",
  "secondary-dark",
  "tertiary",
  "tertiary-light",
  "tertiary-dark",
  "error",
  "warning"
];
export function isExtensionPayloadMarker(payload) {
  return payload.dataType === "marker";
}
export function isExtensionEntryObj(payload) {
  const hasTrack = "track" in payload && Boolean(payload.track);
  const validEntryType = payload.dataType === "track-entry" || payload.dataType === void 0;
  return validEntryType && hasTrack;
}
export function isConsoleTimestampPayloadTrackEntry(payload) {
  return payload.url !== void 0 && payload.description !== void 0;
}
export function isValidExtensionPayload(payload) {
  return isExtensionPayloadMarker(payload) || isExtensionEntryObj(payload) || isConsoleTimestampPayloadTrackEntry(payload);
}
export function isSyntheticExtensionEntry(entry) {
  return entry.cat === "devtools.extension";
}
//# sourceMappingURL=Extensions.js.map
