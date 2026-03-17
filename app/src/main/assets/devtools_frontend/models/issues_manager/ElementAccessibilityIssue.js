"use strict";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
import {
  resolveLazyDescription
} from "./MarkdownIssueDescription.js";
export class ElementAccessibilityIssue extends Issue {
  constructor(issueDetails, issuesModel, issueId) {
    const issueCode = [
      Protocol.Audits.InspectorIssueCode.ElementAccessibilityIssue,
      issueDetails.elementAccessibilityIssueReason
    ].join("::");
    super(issueCode, issueDetails, issuesModel, issueId);
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getDescription() {
    if (this.isInteractiveContentAttributesSelectDescendantIssue()) {
      return {
        file: "selectElementAccessibilityInteractiveContentAttributesSelectDescendant.md",
        links: []
      };
    }
    const description = issueDescriptions.get(this.details().elementAccessibilityIssueReason);
    if (!description) {
      return null;
    }
    return resolveLazyDescription(description);
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  isInteractiveContentAttributesSelectDescendantIssue() {
    return this.details().hasDisallowedAttributes && (this.details().elementAccessibilityIssueReason !== Protocol.Audits.ElementAccessibilityIssueReason.InteractiveContentOptionChild && this.details().elementAccessibilityIssueReason !== Protocol.Audits.ElementAccessibilityIssueReason.InteractiveContentSummaryDescendant);
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const elementAccessibilityIssueDetails = inspectorIssue.details.elementAccessibilityIssueDetails;
    if (!elementAccessibilityIssueDetails) {
      console.warn("Element Accessibility issue without details received.");
      return [];
    }
    return [new ElementAccessibilityIssue(elementAccessibilityIssueDetails, issuesModel, inspectorIssue.issueId)];
  }
}
const issueDescriptions = /* @__PURE__ */ new Map([
  [
    Protocol.Audits.ElementAccessibilityIssueReason.DisallowedSelectChild,
    {
      file: "selectElementAccessibilityDisallowedSelectChild.md",
      links: []
    }
  ],
  [
    Protocol.Audits.ElementAccessibilityIssueReason.DisallowedOptGroupChild,
    {
      file: "selectElementAccessibilityDisallowedOptGroupChild.md",
      links: []
    }
  ],
  [
    Protocol.Audits.ElementAccessibilityIssueReason.NonPhrasingContentOptionChild,
    {
      file: "selectElementAccessibilityNonPhrasingContentOptionChild.md",
      links: []
    }
  ],
  [
    Protocol.Audits.ElementAccessibilityIssueReason.InteractiveContentOptionChild,
    {
      file: "selectElementAccessibilityInteractiveContentOptionChild.md",
      links: []
    }
  ],
  [
    Protocol.Audits.ElementAccessibilityIssueReason.InteractiveContentLegendChild,
    {
      file: "selectElementAccessibilityInteractiveContentLegendChild.md",
      links: []
    }
  ],
  [
    Protocol.Audits.ElementAccessibilityIssueReason.InteractiveContentSummaryDescendant,
    {
      file: "summaryElementAccessibilityInteractiveContentSummaryDescendant.md",
      links: []
    }
  ]
]);
//# sourceMappingURL=ElementAccessibilityIssue.js.map
