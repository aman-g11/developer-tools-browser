"use strict";
import * as Common from "../../core/common/common.js";
export var BadgeAction = /* @__PURE__ */ ((BadgeAction2) => {
  BadgeAction2["GDP_SIGN_UP_COMPLETE"] = "gdp-sign-up-complete";
  BadgeAction2["RECEIVE_BADGES_SETTING_ENABLED"] = "receive-badges-setting-enabled";
  BadgeAction2["CSS_RULE_MODIFIED"] = "css-rule-modified";
  BadgeAction2["DOM_ELEMENT_OR_ATTRIBUTE_EDITED"] = "dom-element-or-attribute-edited";
  BadgeAction2["MODERN_DOM_BADGE_CLICKED"] = "modern-dom-badge-clicked";
  BadgeAction2["STARTED_AI_CONVERSATION"] = "started-ai-conversation";
  BadgeAction2["PERFORMANCE_INSIGHT_CLICKED"] = "performance-insight-clicked";
  BadgeAction2["DEBUGGER_PAUSED"] = "debugger-paused";
  BadgeAction2["BREAKPOINT_ADDED"] = "breakpoint-added";
  BadgeAction2["CONSOLE_PROMPT_EXECUTED"] = "console-prompt-executed";
  BadgeAction2["PERFORMANCE_RECORDING_STARTED"] = "performance-recording-started";
  BadgeAction2["NETWORK_SPEED_THROTTLED"] = "network-speed-throttled";
  BadgeAction2["RECORDER_RECORDING_STARTED"] = "recorder-recording-started";
  return BadgeAction2;
})(BadgeAction || {});
export class Badge {
  #onTriggerBadge;
  #badgeActionEventTarget;
  #eventListeners = [];
  #triggeredBefore = false;
  isStarterBadge = false;
  constructor(context) {
    this.#onTriggerBadge = context.onTriggerBadge;
    this.#badgeActionEventTarget = context.badgeActionEventTarget;
  }
  trigger(opts) {
    if (this.#triggeredBefore) {
      return;
    }
    this.#triggeredBefore = true;
    this.deactivate();
    this.#onTriggerBadge(this, opts);
  }
  activate() {
    if (this.#eventListeners.length > 0) {
      return;
    }
    this.#eventListeners = this.interestedActions.map((actionType) => this.#badgeActionEventTarget.addEventListener(actionType, () => {
      this.handleAction(actionType);
    }, this));
  }
  deactivate() {
    if (!this.#eventListeners.length) {
      return;
    }
    Common.EventTarget.removeEventListeners(this.#eventListeners);
    this.#eventListeners = [];
    this.#triggeredBefore = false;
  }
}
//# sourceMappingURL=Badge.js.map
