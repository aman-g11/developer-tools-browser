"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import { AiExplorerBadge } from "./AiExplorerBadge.js";
import { CodeWhispererBadge } from "./CodeWhispererBadge.js";
import { DOMDetectiveBadge } from "./DOMDetectiveBadge.js";
import { SpeedsterBadge } from "./SpeedsterBadge.js";
import { StarterBadge } from "./StarterBadge.js";
export var BadgeTriggerReason = /* @__PURE__ */ ((BadgeTriggerReason2) => {
  BadgeTriggerReason2["AWARD"] = "Award";
  BadgeTriggerReason2["STARTER_BADGE_SETTINGS_NUDGE"] = "StarterBadgeSettingsNudge";
  BadgeTriggerReason2["STARTER_BADGE_PROFILE_NUDGE"] = "StarterBadgeProfileNudge";
  return BadgeTriggerReason2;
})(BadgeTriggerReason || {});
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["BADGE_TRIGGERED"] = "BadgeTriggered";
  return Events2;
})(Events || {});
const SNOOZE_TIME_MS = 24 * 60 * 60 * 1e3;
const MAX_SNOOZE_COUNT = 3;
const DELAY_BEFORE_TRIGGER = 1500;
let userBadgesInstance = void 0;
export class UserBadges extends Common.ObjectWrapper.ObjectWrapper {
  #badgeActionEventTarget = new Common.ObjectWrapper.ObjectWrapper();
  #receiveBadgesSetting;
  #allBadges;
  #starterBadgeSnoozeCount;
  #starterBadgeLastSnoozedTimestamp;
  #starterBadgeDismissed;
  static BADGE_REGISTRY = [
    StarterBadge,
    SpeedsterBadge,
    DOMDetectiveBadge,
    CodeWhispererBadge,
    AiExplorerBadge
  ];
  constructor() {
    super();
    this.#receiveBadgesSetting = Common.Settings.Settings.instance().moduleSetting("receive-gdp-badges");
    if (!Host.GdpClient.isBadgesEnabled()) {
      this.#receiveBadgesSetting.set(false);
    }
    this.#receiveBadgesSetting.addChangeListener(this.#reconcileBadges, this);
    this.#starterBadgeSnoozeCount = Common.Settings.Settings.instance().createSetting(
      "starter-badge-snooze-count",
      0,
      Common.Settings.SettingStorageType.SYNCED
    );
    this.#starterBadgeLastSnoozedTimestamp = Common.Settings.Settings.instance().createSetting(
      "starter-badge-last-snoozed-timestamp",
      0,
      Common.Settings.SettingStorageType.SYNCED
    );
    this.#starterBadgeDismissed = Common.Settings.Settings.instance().createSetting(
      "starter-badge-dismissed",
      false,
      Common.Settings.SettingStorageType.SYNCED
    );
    this.#allBadges = UserBadges.BADGE_REGISTRY.map((badgeCtor) => new badgeCtor({
      onTriggerBadge: this.#onTriggerBadge.bind(this),
      badgeActionEventTarget: this.#badgeActionEventTarget
    }));
  }
  static instance({ forceNew } = { forceNew: false }) {
    if (!userBadgesInstance || forceNew) {
      userBadgesInstance = new UserBadges();
    }
    return userBadgesInstance;
  }
  async initialize() {
    return await this.#reconcileBadges();
  }
  snoozeStarterBadge() {
    this.#starterBadgeSnoozeCount.set(this.#starterBadgeSnoozeCount.get() + 1);
    this.#starterBadgeLastSnoozedTimestamp.set(Date.now());
  }
  dismissStarterBadge() {
    this.#starterBadgeDismissed.set(true);
  }
  recordAction(action) {
    this.#badgeActionEventTarget.dispatchEventToListeners(action);
  }
  async #resolveBadgeTriggerReason(badge) {
    if (!badge.isStarterBadge) {
      return "Award" /* AWARD */;
    }
    const getProfileResponse = await Host.GdpClient.GdpClient.instance().getProfile();
    if (!getProfileResponse) {
      return;
    }
    const hasGdpProfile = Boolean(getProfileResponse.profile);
    const receiveBadgesSettingEnabled = Boolean(this.#receiveBadgesSetting.get());
    if (hasGdpProfile && receiveBadgesSettingEnabled) {
      return "Award" /* AWARD */;
    }
    if (this.#isStarterBadgeDismissed() || this.#isStarterBadgeSnoozed()) {
      return;
    }
    if (hasGdpProfile && !receiveBadgesSettingEnabled) {
      return "StarterBadgeSettingsNudge" /* STARTER_BADGE_SETTINGS_NUDGE */;
    }
    return "StarterBadgeProfileNudge" /* STARTER_BADGE_PROFILE_NUDGE */;
  }
  async #onTriggerBadge(badge, opts) {
    const triggerTime = Date.now();
    const reason = await this.#resolveBadgeTriggerReason(badge);
    if (!reason) {
      return;
    }
    if (reason === "Award" /* AWARD */) {
      const result = await Host.GdpClient.GdpClient.instance().createAward({ name: badge.name });
      if (!result) {
        return;
      }
    }
    const timeElapsedAfterTriggerCall = Date.now() - triggerTime;
    const delay = opts?.immediate ? 0 : Math.max(DELAY_BEFORE_TRIGGER - timeElapsedAfterTriggerCall, 0);
    setTimeout(() => {
      this.dispatchEventToListeners("BadgeTriggered" /* BADGE_TRIGGERED */, { badge, reason });
    }, delay);
  }
  #deactivateAllBadges() {
    this.#allBadges.forEach((badge) => {
      badge.deactivate();
    });
  }
  #isStarterBadgeDismissed() {
    return this.#starterBadgeDismissed.get();
  }
  #isStarterBadgeSnoozed() {
    const snoozeCount = this.#starterBadgeSnoozeCount.get();
    const lastSnoozed = this.#starterBadgeLastSnoozedTimestamp.get();
    const snoozedRecently = Date.now() - lastSnoozed < SNOOZE_TIME_MS;
    return snoozeCount >= MAX_SNOOZE_COUNT || snoozedRecently;
  }
  async #reconcileBadges() {
    const syncInfo = await new Promise(
      (resolve) => Host.InspectorFrontendHost.InspectorFrontendHostInstance.getSyncInformation(resolve)
    );
    if (!syncInfo.accountEmail) {
      this.#deactivateAllBadges();
      return;
    }
    if (!Host.GdpClient.isGdpProfilesAvailable() || !Host.GdpClient.isBadgesEnabled()) {
      this.#deactivateAllBadges();
      return;
    }
    const getProfileResponse = await Host.GdpClient.GdpClient.instance().getProfile();
    if (!getProfileResponse) {
      this.#deactivateAllBadges();
      return;
    }
    const hasGdpProfile = Boolean(getProfileResponse.profile);
    const isEligibleToCreateProfile = getProfileResponse.isEligible;
    if (!hasGdpProfile && !isEligibleToCreateProfile) {
      this.#deactivateAllBadges();
      return;
    }
    let awardedBadgeNames = null;
    if (hasGdpProfile) {
      awardedBadgeNames = await Host.GdpClient.GdpClient.instance().getAwardedBadgeNames(
        { names: this.#allBadges.map((badge) => badge.name) }
      );
      if (!awardedBadgeNames) {
        this.#deactivateAllBadges();
        return;
      }
    }
    const receiveBadgesSettingEnabled = Boolean(this.#receiveBadgesSetting.get());
    for (const badge of this.#allBadges) {
      if (awardedBadgeNames?.has(badge.name)) {
        badge.deactivate();
        continue;
      }
      const shouldActivateStarterBadge = badge.isStarterBadge && isEligibleToCreateProfile && Host.GdpClient.isStarterBadgeEnabled() && !this.#isStarterBadgeDismissed() && !this.#isStarterBadgeSnoozed();
      const shouldActivateActivityBasedBadge = !badge.isStarterBadge && hasGdpProfile && receiveBadgesSettingEnabled;
      if (shouldActivateStarterBadge || shouldActivateActivityBasedBadge) {
        badge.activate();
      } else {
        badge.deactivate();
      }
    }
    this.reconcileBadgesFinishedForTest();
  }
  reconcileBadgesFinishedForTest() {
  }
  isReceiveBadgesSettingEnabled() {
    return Boolean(this.#receiveBadgesSetting.get());
  }
}
//# sourceMappingURL=UserBadges.js.map
