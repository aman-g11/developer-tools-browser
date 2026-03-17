"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
import {
  resolveLazyDescription
} from "./MarkdownIssueDescription.js";
const UIStrings = {
  /**
   * @description Title for HTTP Message Signatures specification url
   */
  httpMessageSignatures: "HTTP Message Signatures (RFC9421)",
  /**
   * @description Title for Signature-based Integrity specification url
   */
  signatureBasedIntegrity: "Signature-based Integrity"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/SRIMessageSignatureIssue.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
function generateGroupingIssueCode(details) {
  const issueCode = `${Protocol.Audits.InspectorIssueCode.SRIMessageSignatureIssue}::${details.error}`;
  if (details.error === Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureMismatch) {
    return issueCode + details.signatureBase;
  }
  if (details.error === Protocol.Audits.SRIMessageSignatureError.ValidationFailedIntegrityMismatch) {
    return issueCode + details.integrityAssertions.join();
  }
  return issueCode;
}
export class SRIMessageSignatureIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(
      {
        code: generateGroupingIssueCode(issueDetails),
        umaCode: `${Protocol.Audits.InspectorIssueCode.SRIMessageSignatureIssue}::${issueDetails.error}`
      },
      issueDetails,
      issuesModel
    );
  }
  // Overriding `Issue<String>`:
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getDescription() {
    const details = this.details();
    const description = {
      file: `sri${details.error}.md`,
      links: [
        {
          link: "https://www.rfc-editor.org/rfc/rfc9421.html",
          linkTitle: i18nLazyString(UIStrings.httpMessageSignatures)
        },
        {
          link: "https://wicg.github.io/signature-based-sri/",
          linkTitle: i18nLazyString(UIStrings.signatureBasedIntegrity)
        }
      ],
      substitutions: /* @__PURE__ */ new Map()
    };
    if (details.error === Protocol.Audits.SRIMessageSignatureError.ValidationFailedSignatureMismatch) {
      description.substitutions?.set("PLACEHOLDER_signatureBase", () => details.signatureBase);
    }
    if (details.error === Protocol.Audits.SRIMessageSignatureError.ValidationFailedIntegrityMismatch) {
      description.substitutions?.set("PLACEHOLDER_integrityAssertions", () => {
        const prefix = "\n* ";
        return prefix + this.details().integrityAssertions.join(prefix);
      });
    }
    return resolveLazyDescription(description);
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  requests() {
    return this.details().request ? [this.details().request] : [];
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const details = inspectorIssue.details.sriMessageSignatureIssueDetails;
    if (!details) {
      console.warn("SRI Message Signature issue without details received.");
      return [];
    }
    return [new SRIMessageSignatureIssue(details, issuesModel)];
  }
}
//# sourceMappingURL=SRIMessageSignatureIssue.js.map
