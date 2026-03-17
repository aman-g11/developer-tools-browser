"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
const UIStrings = {
  /**
   * @description Label for the link for SharedArrayBuffer Issues. The full text reads "Enabling `SharedArrayBuffer`"
   * and is the title of an article that describes how to enable a JavaScript feature called SharedArrayBuffer.
   */
  enablingSharedArrayBuffer: "Enabling `SharedArrayBuffer`"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/SharedArrayBufferIssue.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class SharedArrayBufferIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    const umaCode = [Protocol.Audits.InspectorIssueCode.SharedArrayBufferIssue, issueDetails.type].join("::");
    super({ code: Protocol.Audits.InspectorIssueCode.SharedArrayBufferIssue, umaCode }, issueDetails, issuesModel);
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getDescription() {
    return {
      file: "sharedArrayBuffer.md",
      links: [{
        link: "https://developer.chrome.com/blog/enabling-shared-array-buffer/",
        linkTitle: i18nString(UIStrings.enablingSharedArrayBuffer)
      }]
    };
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    if (this.details().isWarning) {
      return IssueKind.BREAKING_CHANGE;
    }
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const sabIssueDetails = inspectorIssue.details.sharedArrayBufferIssueDetails;
    if (!sabIssueDetails) {
      console.warn("SAB transfer issue without details received.");
      return [];
    }
    return [new SharedArrayBufferIssue(sabIssueDetails, issuesModel)];
  }
}
//# sourceMappingURL=SharedArrayBufferIssue.js.map
