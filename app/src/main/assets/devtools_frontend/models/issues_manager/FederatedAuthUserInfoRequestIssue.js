"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
import {
  resolveLazyDescription
} from "./MarkdownIssueDescription.js";
const UIStrings = {
  /**
   * @description Title for Client Hint specification url link
   */
  fedCmUserInfo: "Federated Credential Management User Info API"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/FederatedAuthUserInfoRequestIssue.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
export class FederatedAuthUserInfoRequestIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(
      {
        code: Protocol.Audits.InspectorIssueCode.FederatedAuthUserInfoRequestIssue,
        umaCode: [
          Protocol.Audits.InspectorIssueCode.FederatedAuthUserInfoRequestIssue,
          issueDetails.federatedAuthUserInfoRequestIssueReason
        ].join("::")
      },
      issueDetails,
      issuesModel
    );
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getDescription() {
    const description = issueDescriptions.get(this.details().federatedAuthUserInfoRequestIssueReason);
    if (!description) {
      return null;
    }
    return resolveLazyDescription(description);
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const details = inspectorIssue.details.federatedAuthUserInfoRequestIssueDetails;
    if (!details) {
      console.warn("Federated auth user info request issue without details received.");
      return [];
    }
    return [new FederatedAuthUserInfoRequestIssue(details, issuesModel)];
  }
}
const issueDescriptions = /* @__PURE__ */ new Map([
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NotSameOrigin,
    {
      file: "federatedAuthUserInfoRequestNotSameOrigin.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NotIframe,
    {
      file: "federatedAuthUserInfoRequestNotIframe.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NotPotentiallyTrustworthy,
    {
      file: "federatedAuthUserInfoRequestNotPotentiallyTrustworthy.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NoAPIPermission,
    {
      file: "federatedAuthUserInfoRequestNoApiPermission.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NotSignedInWithIdp,
    {
      file: "federatedAuthUserInfoRequestNotSignedInWithIdp.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NoAccountSharingPermission,
    {
      file: "federatedAuthUserInfoRequestNoAccountSharingPermission.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.InvalidConfigOrWellKnown,
    {
      file: "federatedAuthUserInfoRequestInvalidConfigOrWellKnown.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.InvalidAccountsResponse,
    {
      file: "federatedAuthUserInfoRequestInvalidAccountsResponse.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ],
  [
    Protocol.Audits.FederatedAuthUserInfoRequestIssueReason.NoReturningUserFromFetchedAccounts,
    {
      file: "federatedAuthUserInfoRequestNoReturningUserFromFetchedAccounts.md",
      links: [{
        link: "https://fedidcg.github.io/FedCM/",
        linkTitle: i18nLazyString(UIStrings.fedCmUserInfo)
      }]
    }
  ]
]);
//# sourceMappingURL=FederatedAuthUserInfoRequestIssue.js.map
