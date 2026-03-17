"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Root from "../../core/root/root.js";
const UIStrings = {
  /**
   * @description Message shown to the user if the age check is not successful.
   */
  ageRestricted: "This feature is only available to users who are 18 years of age or older.",
  /**
   * @description The error message when the user is not logged in into Chrome.
   */
  notLoggedIn: "This feature is only available when you sign into Chrome with your Google account.",
  /**
   * @description Message shown when the user is offline.
   */
  offline: "This feature is only available with an active internet connection.",
  /**
   * @description Text informing the user that AI assistance is not available in Incognito mode or Guest mode.
   */
  notAvailableInIncognitoMode: "AI assistance is not available in Incognito mode or Guest mode."
};
const str_ = i18n.i18n.registerUIStrings("models/ai_assistance/AiUtils.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export function getDisabledReasons(aidaAvailability) {
  const reasons = [];
  if (Root.Runtime.hostConfig.isOffTheRecord) {
    reasons.push(i18nString(UIStrings.notAvailableInIncognitoMode));
  }
  switch (aidaAvailability) {
    case Host.AidaClient.AidaAccessPreconditions.NO_ACCOUNT_EMAIL:
    case Host.AidaClient.AidaAccessPreconditions.SYNC_IS_PAUSED:
      reasons.push(i18nString(UIStrings.notLoggedIn));
      break;
    // @ts-expect-error
    case Host.AidaClient.AidaAccessPreconditions.NO_INTERNET:
      reasons.push(i18nString(UIStrings.offline));
    case Host.AidaClient.AidaAccessPreconditions.AVAILABLE: {
      if (Root.Runtime.hostConfig?.aidaAvailability?.blockedByAge === true) {
        reasons.push(i18nString(UIStrings.ageRestricted));
      }
    }
  }
  reasons.push(...Common.Settings.Settings.instance().moduleSetting("ai-assistance-enabled").disabledReasons());
  return reasons;
}
export function isGeminiBranding() {
  return !!Root.Runtime.hostConfig.devToolsGeminiRebranding?.enabled;
}
export function getIconName() {
  return isGeminiBranding() ? "spark" : "smart-assistant";
}
//# sourceMappingURL=AiUtils.js.map
