"use strict";
export var DataOrigin = /* @__PURE__ */ ((DataOrigin2) => {
  DataOrigin2["CPU_PROFILE"] = "CPUProfile";
  DataOrigin2["TRACE_EVENTS"] = "TraceEvents";
  return DataOrigin2;
})(DataOrigin || {});
export var EntriesLinkState = /* @__PURE__ */ ((EntriesLinkState2) => {
  EntriesLinkState2["CREATION_NOT_STARTED"] = "creation_not_started";
  EntriesLinkState2["PENDING_TO_EVENT"] = "pending_to_event";
  EntriesLinkState2["CONNECTED"] = "connected";
  return EntriesLinkState2;
})(EntriesLinkState || {});
export var EventKeyType = /* @__PURE__ */ ((EventKeyType2) => {
  EventKeyType2["RAW_EVENT"] = "r";
  EventKeyType2["SYNTHETIC_EVENT"] = "s";
  EventKeyType2["PROFILE_CALL"] = "p";
  EventKeyType2["LEGACY_TIMELINE_FRAME"] = "l";
  return EventKeyType2;
})(EventKeyType || {});
export function isTimeRangeAnnotation(annotation) {
  return annotation.type === "TIME_RANGE";
}
export function isEntryLabelAnnotation(annotation) {
  return annotation.type === "ENTRY_LABEL";
}
export function isEntriesLinkAnnotation(annotation) {
  return annotation.type === "ENTRIES_LINK";
}
export function traceEventKeyToValues(key) {
  const parts = key.split("-");
  const type = parts[0];
  switch (type) {
    case "p" /* PROFILE_CALL */:
      if (parts.length !== 5 || !parts.every((part, i) => i === 0 || typeof part === "number" || !isNaN(parseInt(part, 10)))) {
        throw new Error(`Invalid ProfileCallKey: ${key}`);
      }
      return {
        type: parts[0],
        processID: parseInt(parts[1], 10),
        threadID: parseInt(parts[2], 10),
        sampleIndex: parseInt(parts[3], 10),
        protocol: parseInt(parts[4], 10)
      };
    case "r" /* RAW_EVENT */:
      if (parts.length !== 2 || !(typeof parts[1] === "number" || !isNaN(parseInt(parts[1], 10)))) {
        throw new Error(`Invalid RawEvent Key: ${key}`);
      }
      return {
        type: parts[0],
        rawIndex: parseInt(parts[1], 10)
      };
    case "s" /* SYNTHETIC_EVENT */:
      if (parts.length !== 2 || !(typeof parts[1] === "number" || !isNaN(parseInt(parts[1], 10)))) {
        throw new Error(`Invalid SyntheticEvent Key: ${key}`);
      }
      return {
        type: parts[0],
        rawIndex: parseInt(parts[1], 10)
      };
    case "l" /* LEGACY_TIMELINE_FRAME */: {
      if (parts.length !== 2 || Number.isNaN(parseInt(parts[1], 10))) {
        throw new Error(`Invalid LegacyTimelineFrame Key: ${key}`);
      }
      return {
        type,
        rawIndex: parseInt(parts[1], 10)
      };
    }
    default:
      throw new Error(`Unknown trace event key: ${key}`);
  }
}
//# sourceMappingURL=File.js.map
