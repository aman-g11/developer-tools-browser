"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Handlers from "./handlers/handlers.js";
import { getEventStyle } from "./Styles.js";
import * as Types from "./types/types.js";
const UIStrings = {
  /**
   * @description Text shown for an entry in the flame chart that has no explicit name.
   */
  anonymous: "(anonymous)",
  /**
   * @description Text used to show an EventDispatch event which has a type associated with it
   * @example {click} PH1
   */
  eventDispatchS: "Event: {PH1}",
  /**
   * @description Text shown for an entry in the flame chart that represents a frame.
   */
  frame: "Frame",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsConnectionOpened: "WebSocket opened",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   * @example {ws://example.com} PH1
   */
  wsConnectionOpenedWithUrl: "WebSocket opened: {PH1}",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  wsConnectionClosed: "WebSocket closed",
  /**
   * @description Text in Timeline Flame Chart Data Provider of the Performance panel
   */
  layoutShift: "Layout shift"
};
const str_ = i18n.i18n.registerUIStrings("models/trace/Name.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function forEntry(entry, parsedTrace) {
  if (Types.Events.isProfileCall(entry)) {
    if (parsedTrace) {
      const potentialCallName = Handlers.ModelHandlers.Samples.getProfileCallFunctionName(parsedTrace.data.Samples, entry);
      if (potentialCallName) {
        return potentialCallName;
      }
    }
    return entry.callFrame.functionName || i18nString(UIStrings.anonymous);
  }
  if (Types.Events.isLegacyTimelineFrame(entry)) {
    return i18n.i18n.lockedString(UIStrings.frame);
  }
  if (Types.Events.isDispatch(entry)) {
    return i18nString(UIStrings.eventDispatchS, { PH1: entry.args.data.type });
  }
  if (Types.Events.isSyntheticNetworkRequest(entry)) {
    const parsedURL = new Common.ParsedURL.ParsedURL(entry.args.data.url);
    const text = parsedURL.isValid ? `${parsedURL.displayName} (${parsedURL.host})` : entry.args.data.url || "Network request";
    return text;
  }
  if (Types.Events.isWebSocketCreate(entry)) {
    if (entry.args.data.url) {
      return i18nString(UIStrings.wsConnectionOpenedWithUrl, { PH1: entry.args.data.url });
    }
    return i18nString(UIStrings.wsConnectionOpened);
  }
  if (Types.Events.isWebSocketDestroy(entry)) {
    return i18nString(UIStrings.wsConnectionClosed);
  }
  if (Types.Events.isSyntheticInteraction(entry)) {
    return nameForInteractionEvent(entry);
  }
  if (Types.Events.isSyntheticLayoutShift(entry)) {
    return i18nString(UIStrings.layoutShift);
  }
  if (Types.Events.isSyntheticAnimation(entry) && entry.args.data.beginEvent.args.data.displayName) {
    return entry.args.data.beginEvent.args.data.displayName;
  }
  const eventStyleCustomName = getEventStyle(entry.name)?.title;
  return eventStyleCustomName || entry.name;
}
function nameForInteractionEvent(event) {
  const category = Handlers.ModelHandlers.UserInteractions.categoryOfInteraction(event);
  if (category === "OTHER") {
    return "Other";
  }
  if (category === "KEYBOARD") {
    return "Keyboard";
  }
  if (category === "POINTER") {
    return "Pointer";
  }
  return event.type;
}
//# sourceMappingURL=Name.js.map
