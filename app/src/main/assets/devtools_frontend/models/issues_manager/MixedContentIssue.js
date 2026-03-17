"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
const UIStrings = {
  /**
   * @description Label for the link for Mixed Content Issues
   */
  preventingMixedContent: "Preventing mixed content"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/MixedContentIssue.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class MixedContentIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(Protocol.Audits.InspectorIssueCode.MixedContentIssue, issueDetails, issuesModel);
  }
  requests() {
    const details = this.details();
    if (details.request) {
      return [details.request];
    }
    return [];
  }
  getCategory() {
    return IssueCategory.MIXED_CONTENT;
  }
  getDescription() {
    return {
      file: "mixedContent.md",
      links: [{ link: "https://web.dev/what-is-mixed-content/", linkTitle: i18nString(UIStrings.preventingMixedContent) }]
    };
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    switch (this.details().resolutionStatus) {
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentAutomaticallyUpgraded:
        return IssueKind.IMPROVEMENT;
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentBlocked:
        return IssueKind.PAGE_ERROR;
      case Protocol.Audits.MixedContentResolutionStatus.MixedContentWarning:
        return IssueKind.IMPROVEMENT;
    }
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const mixedContentDetails = inspectorIssue.details.mixedContentIssueDetails;
    if (!mixedContentDetails) {
      console.warn("Mixed content issue without details received.");
      return [];
    }
    return [new MixedContentIssue(mixedContentDetails, issuesModel)];
  }
}
//# sourceMappingURL=MixedContentIssue.js.map
