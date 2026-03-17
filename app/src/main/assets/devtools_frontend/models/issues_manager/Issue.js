"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
const UIStrings = {
  /**
   * @description The kind of an issue (plural) (Issues are categorized into kinds).
   */
  improvements: "Improvements",
  /**
   * @description The kind of an issue (plural) (Issues are categorized into kinds).
   */
  pageErrors: "Page Errors",
  /**
   * @description The kind of an issue (plural) (Issues are categorized into kinds).
   */
  breakingChanges: "Breaking Changes",
  /**
   * @description A description for a kind of issue we display in the issues tab.
   */
  pageErrorIssue: "A page error issue: the page is not working correctly",
  /**
   * @description A description for a kind of issue we display in the issues tab.
   */
  breakingChangeIssue: "A breaking change issue: the page may stop working in an upcoming version of Chrome",
  /**
   * @description A description for a kind of issue we display in the issues tab.
   */
  improvementIssue: "An improvement issue: there is an opportunity to improve the page"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/Issue.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var IssueCategory = /* @__PURE__ */ ((IssueCategory2) => {
  IssueCategory2["CROSS_ORIGIN_EMBEDDER_POLICY"] = "CrossOriginEmbedderPolicy";
  IssueCategory2["GENERIC"] = "Generic";
  IssueCategory2["MIXED_CONTENT"] = "MixedContent";
  IssueCategory2["COOKIE"] = "Cookie";
  IssueCategory2["HEAVY_AD"] = "HeavyAd";
  IssueCategory2["CONTENT_SECURITY_POLICY"] = "ContentSecurityPolicy";
  IssueCategory2["LOW_TEXT_CONTRAST"] = "LowTextContrast";
  IssueCategory2["CORS"] = "Cors";
  IssueCategory2["ATTRIBUTION_REPORTING"] = "AttributionReporting";
  IssueCategory2["QUIRKS_MODE"] = "QuirksMode";
  IssueCategory2["PERMISSION_ELEMENT"] = "PermissionElement";
  IssueCategory2["SELECTIVE_PERMISSIONS_INTERVENTION"] = "SelectivePermissionsIntervention";
  IssueCategory2["OTHER"] = "Other";
  return IssueCategory2;
})(IssueCategory || {});
export var IssueKind = /* @__PURE__ */ ((IssueKind2) => {
  IssueKind2["PAGE_ERROR"] = "PageError";
  IssueKind2["BREAKING_CHANGE"] = "BreakingChange";
  IssueKind2["IMPROVEMENT"] = "Improvement";
  return IssueKind2;
})(IssueKind || {});
export function getIssueKindName(issueKind) {
  switch (issueKind) {
    case "BreakingChange" /* BREAKING_CHANGE */:
      return i18nString(UIStrings.breakingChanges);
    case "Improvement" /* IMPROVEMENT */:
      return i18nString(UIStrings.improvements);
    case "PageError" /* PAGE_ERROR */:
      return i18nString(UIStrings.pageErrors);
  }
}
export function getIssueKindDescription(issueKind) {
  switch (issueKind) {
    case "PageError" /* PAGE_ERROR */:
      return i18nString(UIStrings.pageErrorIssue);
    case "BreakingChange" /* BREAKING_CHANGE */:
      return i18nString(UIStrings.breakingChangeIssue);
    case "Improvement" /* IMPROVEMENT */:
      return i18nString(UIStrings.improvementIssue);
  }
}
export function unionIssueKind(a, b) {
  if (a === "PageError" /* PAGE_ERROR */ || b === "PageError" /* PAGE_ERROR */) {
    return "PageError" /* PAGE_ERROR */;
  }
  if (a === "BreakingChange" /* BREAKING_CHANGE */ || b === "BreakingChange" /* BREAKING_CHANGE */) {
    return "BreakingChange" /* BREAKING_CHANGE */;
  }
  return "Improvement" /* IMPROVEMENT */;
}
export function getShowThirdPartyIssuesSetting() {
  return Common.Settings.Settings.instance().createSetting("show-third-party-issues", true);
}
export class Issue {
  #issueCode;
  #issuesModel;
  issueId = void 0;
  #issueDetails;
  #hidden;
  constructor(code, issueDetails, issuesModel = null, issueId) {
    this.#issueCode = typeof code === "object" ? code.code : code;
    this.#issueDetails = issueDetails;
    this.#issuesModel = issuesModel;
    this.issueId = issueId;
    Host.userMetrics.issueCreated(typeof code === "string" ? code : code.umaCode);
    this.#hidden = false;
  }
  code() {
    return this.#issueCode;
  }
  details() {
    return this.#issueDetails;
  }
  getBlockedByResponseDetails() {
    return [];
  }
  cookies() {
    return [];
  }
  rawCookieLines() {
    return [];
  }
  elements() {
    return [];
  }
  requests() {
    return [];
  }
  sources() {
    return [];
  }
  trackingSites() {
    return [];
  }
  isAssociatedWithRequestId(requestId) {
    for (const request of this.requests()) {
      if (request.requestId === requestId) {
        return true;
      }
    }
    return false;
  }
  /**
   * The model might be unavailable or belong to a target that has already been disposed.
   */
  model() {
    return this.#issuesModel;
  }
  isCausedByThirdParty() {
    return false;
  }
  getIssueId() {
    return this.issueId;
  }
  isHidden() {
    return this.#hidden;
  }
  setHidden(hidden) {
    this.#hidden = hidden;
  }
  maybeCreateConsoleMessage() {
    return;
  }
}
export function toZeroBasedLocation(location) {
  if (!location) {
    return void 0;
  }
  return {
    url: location.url,
    scriptId: location.scriptId,
    lineNumber: location.lineNumber,
    columnNumber: location.columnNumber === 0 ? void 0 : location.columnNumber - 1
  };
}
//# sourceMappingURL=Issue.js.map
