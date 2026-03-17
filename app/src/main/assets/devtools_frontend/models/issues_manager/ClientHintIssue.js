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
  clientHintsInfrastructure: "Client Hints Infrastructure"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/ClientHintIssue.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
export class ClientHintIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(
      {
        code: Protocol.Audits.InspectorIssueCode.ClientHintIssue,
        umaCode: [Protocol.Audits.InspectorIssueCode.ClientHintIssue, issueDetails.clientHintIssueReason].join("::")
      },
      issueDetails,
      issuesModel
    );
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getDescription() {
    const description = issueDescriptions.get(this.details().clientHintIssueReason);
    if (!description) {
      return null;
    }
    return resolveLazyDescription(description);
  }
  sources() {
    return [this.details().sourceCodeLocation];
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    return IssueKind.BREAKING_CHANGE;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const details = inspectorIssue.details.clientHintIssueDetails;
    if (!details) {
      console.warn("Client Hint issue without details received.");
      return [];
    }
    return [new ClientHintIssue(details, issuesModel)];
  }
}
const issueDescriptions = /* @__PURE__ */ new Map([
  [
    Protocol.Audits.ClientHintIssueReason.MetaTagAllowListInvalidOrigin,
    {
      file: "clientHintMetaTagAllowListInvalidOrigin.md",
      links: [{
        link: "https://wicg.github.io/client-hints-infrastructure/",
        linkTitle: i18nLazyString(UIStrings.clientHintsInfrastructure)
      }]
    }
  ],
  [
    Protocol.Audits.ClientHintIssueReason.MetaTagModifiedHTML,
    {
      file: "clientHintMetaTagModifiedHTML.md",
      links: [{
        link: "https://wicg.github.io/client-hints-infrastructure/",
        linkTitle: i18nLazyString(UIStrings.clientHintsInfrastructure)
      }]
    }
  ]
]);
//# sourceMappingURL=ClientHintIssue.js.map
