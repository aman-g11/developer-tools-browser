"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
const UIStrings = {
  /**
   * @description Title for a learn more link in Selective Permissions Intervention issue description
   */
  selectivePermissionsIntervention: "Selective Permissions Intervention"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/SelectivePermissionsInterventionIssue.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class SelectivePermissionsInterventionIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(Protocol.Audits.InspectorIssueCode.SelectivePermissionsInterventionIssue, issueDetails, issuesModel);
  }
  primaryKey() {
    return `${Protocol.Audits.InspectorIssueCode.SelectivePermissionsInterventionIssue}-${JSON.stringify(this.details())}`;
  }
  getDescription() {
    return {
      file: "selectivePermissionsIntervention.md",
      links: [
        {
          link: "https://crbug.com/435223477",
          linkTitle: i18nString(UIStrings.selectivePermissionsIntervention)
        }
      ]
    };
  }
  getCategory() {
    return IssueCategory.SELECTIVE_PERMISSIONS_INTERVENTION;
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const selectivePermissionsInterventionIssueDetails = inspectorIssue.details.selectivePermissionsInterventionIssueDetails;
    if (!selectivePermissionsInterventionIssueDetails) {
      console.warn("Selective Permissions Intervention issue without details received.");
      return [];
    }
    return [new SelectivePermissionsInterventionIssue(selectivePermissionsInterventionIssueDetails, issuesModel)];
  }
}
//# sourceMappingURL=SelectivePermissionsInterventionIssue.js.map
