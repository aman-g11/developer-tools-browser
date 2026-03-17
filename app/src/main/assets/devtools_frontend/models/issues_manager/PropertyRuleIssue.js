"use strict";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
export class PropertyRuleIssue extends Issue {
  #primaryKey;
  constructor(issueDetails, issuesModel) {
    const code = JSON.stringify(issueDetails);
    super(code, issueDetails, issuesModel);
    this.#primaryKey = code;
  }
  sources() {
    return [this.details().sourceCodeLocation];
  }
  primaryKey() {
    return this.#primaryKey;
  }
  getPropertyName() {
    switch (this.details().propertyRuleIssueReason) {
      case Protocol.Audits.PropertyRuleIssueReason.InvalidInherits:
        return "inherits";
      case Protocol.Audits.PropertyRuleIssueReason.InvalidInitialValue:
        return "initial-value";
      case Protocol.Audits.PropertyRuleIssueReason.InvalidSyntax:
        return "syntax";
    }
    return "";
  }
  getDescription() {
    if (this.details().propertyRuleIssueReason === Protocol.Audits.PropertyRuleIssueReason.InvalidName) {
      return {
        file: "propertyRuleInvalidNameIssue.md",
        links: []
      };
    }
    const value = this.details().propertyValue ? `: ${this.details().propertyValue}` : "";
    const property = `${this.getPropertyName()}${value}`;
    return {
      file: "propertyRuleIssue.md",
      substitutions: /* @__PURE__ */ new Map([["PLACEHOLDER_property", property]]),
      links: []
    };
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issueModel, inspectorIssue) {
    const propertyRuleIssueDetails = inspectorIssue.details.propertyRuleIssueDetails;
    if (!propertyRuleIssueDetails) {
      console.warn("Property rule issue without details received");
      return [];
    }
    return [new PropertyRuleIssue(propertyRuleIssueDetails, issueModel)];
  }
}
//# sourceMappingURL=PropertyRuleIssue.js.map
