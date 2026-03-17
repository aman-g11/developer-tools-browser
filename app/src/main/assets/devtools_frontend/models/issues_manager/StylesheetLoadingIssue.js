"use strict";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
export const lateImportStylesheetLoadingCode = [
  Protocol.Audits.InspectorIssueCode.StylesheetLoadingIssue,
  Protocol.Audits.StyleSheetLoadingIssueReason.LateImportRule
].join("::");
export class StylesheetLoadingIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    const code = `${Protocol.Audits.InspectorIssueCode.StylesheetLoadingIssue}::${issueDetails.styleSheetLoadingIssueReason}`;
    super(code, issueDetails, issuesModel);
  }
  sources() {
    return [this.details().sourceCodeLocation];
  }
  requests() {
    const details = this.details();
    if (!details.failedRequestInfo) {
      return [];
    }
    const { url, requestId } = details.failedRequestInfo;
    if (!requestId) {
      return [];
    }
    return [{ url, requestId }];
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getDescription() {
    switch (this.details().styleSheetLoadingIssueReason) {
      case Protocol.Audits.StyleSheetLoadingIssueReason.LateImportRule:
        return {
          file: "stylesheetLateImport.md",
          links: []
        };
      case Protocol.Audits.StyleSheetLoadingIssueReason.RequestFailed:
        return {
          file: "stylesheetRequestFailed.md",
          links: []
        };
    }
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issueModel, inspectorIssue) {
    const stylesheetLoadingDetails = inspectorIssue.details.stylesheetLoadingIssueDetails;
    if (!stylesheetLoadingDetails) {
      console.warn("Stylesheet loading issue without details received");
      return [];
    }
    return [new StylesheetLoadingIssue(stylesheetLoadingDetails, issueModel)];
  }
}
//# sourceMappingURL=StylesheetLoadingIssue.js.map
