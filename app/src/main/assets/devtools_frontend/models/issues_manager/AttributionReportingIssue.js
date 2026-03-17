"use strict";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
export var IssueCode = /* @__PURE__ */ ((IssueCode2) => {
  IssueCode2["PERMISSION_POLICY_DISABLED"] = "AttributionReportingIssue::PermissionPolicyDisabled";
  IssueCode2["UNTRUSTWORTHY_REPORTING_ORIGIN"] = "AttributionReportingIssue::UntrustworthyReportingOrigin";
  IssueCode2["INSECURE_CONTEXT"] = "AttributionReportingIssue::InsecureContext";
  IssueCode2["INVALID_REGISTER_SOURCE_HEADER"] = "AttributionReportingIssue::InvalidRegisterSourceHeader";
  IssueCode2["INVALID_REGISTER_TRIGGER_HEADER"] = "AttributionReportingIssue::InvalidRegisterTriggerHeader";
  IssueCode2["SOURCE_AND_TRIGGER_HEADERS"] = "AttributionReportingIssue::SourceAndTriggerHeaders";
  IssueCode2["SOURCE_IGNORED"] = "AttributionReportingIssue::SourceIgnored";
  IssueCode2["TRIGGER_IGNORED"] = "AttributionReportingIssue::TriggerIgnored";
  IssueCode2["OS_SOURCE_IGNORED"] = "AttributionReportingIssue::OsSourceIgnored";
  IssueCode2["OS_TRIGGER_IGNORED"] = "AttributionReportingIssue::OsTriggerIgnored";
  IssueCode2["INVALID_REGISTER_OS_SOURCE_HEADER"] = "AttributionReportingIssue::InvalidRegisterOsSourceHeader";
  IssueCode2["INVALID_REGISTER_OS_TRIGGER_HEADER"] = "AttributionReportingIssue::InvalidRegisterOsTriggerHeader";
  IssueCode2["WEB_AND_OS_HEADERS"] = "AttributionReportingIssue::WebAndOsHeaders";
  IssueCode2["NO_WEB_OR_OS_SUPPORT"] = "AttributionReportingIssue::NoWebOrOsSupport";
  IssueCode2["NAVIGATION_REGISTRATION_WITHOUT_TRANSIENT_USER_ACTIVATION"] = "AttributionReportingIssue::NavigationRegistrationWithoutTransientUserActivation";
  IssueCode2["INVALID_INFO_HEADER"] = "AttributionReportingIssue::InvalidInfoHeader";
  IssueCode2["NO_REGISTER_SOURCE_HEADER"] = "AttributionReportingIssue::NoRegisterSourceHeader";
  IssueCode2["NO_REGISTER_TRIGGER_HEADER"] = "AttributionReportingIssue::NoRegisterTriggerHeader";
  IssueCode2["NO_REGISTER_OS_SOURCE_HEADER"] = "AttributionReportingIssue::NoRegisterOsSourceHeader";
  IssueCode2["NO_REGISTER_OS_TRIGGER_HEADER"] = "AttributionReportingIssue::NoRegisterOsTriggerHeader";
  IssueCode2["NAVIGATION_REGISTRATION_UNIQUE_SCOPE_ALREADY_SET"] = "AttributionReportingIssue::NavigationRegistrationUniqueScopeAlreadySet";
  IssueCode2["UNKNOWN"] = "AttributionReportingIssue::Unknown";
  return IssueCode2;
})(IssueCode || {});
function getIssueCode(details) {
  switch (details.violationType) {
    case Protocol.Audits.AttributionReportingIssueType.PermissionPolicyDisabled:
      return "AttributionReportingIssue::PermissionPolicyDisabled" /* PERMISSION_POLICY_DISABLED */;
    case Protocol.Audits.AttributionReportingIssueType.UntrustworthyReportingOrigin:
      return "AttributionReportingIssue::UntrustworthyReportingOrigin" /* UNTRUSTWORTHY_REPORTING_ORIGIN */;
    case Protocol.Audits.AttributionReportingIssueType.InsecureContext:
      return "AttributionReportingIssue::InsecureContext" /* INSECURE_CONTEXT */;
    case Protocol.Audits.AttributionReportingIssueType.InvalidHeader:
      return "AttributionReportingIssue::InvalidRegisterSourceHeader" /* INVALID_REGISTER_SOURCE_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.InvalidRegisterTriggerHeader:
      return "AttributionReportingIssue::InvalidRegisterTriggerHeader" /* INVALID_REGISTER_TRIGGER_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.SourceAndTriggerHeaders:
      return "AttributionReportingIssue::SourceAndTriggerHeaders" /* SOURCE_AND_TRIGGER_HEADERS */;
    case Protocol.Audits.AttributionReportingIssueType.SourceIgnored:
      return "AttributionReportingIssue::SourceIgnored" /* SOURCE_IGNORED */;
    case Protocol.Audits.AttributionReportingIssueType.TriggerIgnored:
      return "AttributionReportingIssue::TriggerIgnored" /* TRIGGER_IGNORED */;
    case Protocol.Audits.AttributionReportingIssueType.OsSourceIgnored:
      return "AttributionReportingIssue::OsSourceIgnored" /* OS_SOURCE_IGNORED */;
    case Protocol.Audits.AttributionReportingIssueType.OsTriggerIgnored:
      return "AttributionReportingIssue::OsTriggerIgnored" /* OS_TRIGGER_IGNORED */;
    case Protocol.Audits.AttributionReportingIssueType.InvalidRegisterOsSourceHeader:
      return "AttributionReportingIssue::InvalidRegisterOsSourceHeader" /* INVALID_REGISTER_OS_SOURCE_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.InvalidRegisterOsTriggerHeader:
      return "AttributionReportingIssue::InvalidRegisterOsTriggerHeader" /* INVALID_REGISTER_OS_TRIGGER_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.WebAndOsHeaders:
      return "AttributionReportingIssue::WebAndOsHeaders" /* WEB_AND_OS_HEADERS */;
    case Protocol.Audits.AttributionReportingIssueType.NoWebOrOsSupport:
      return "AttributionReportingIssue::NoWebOrOsSupport" /* NO_WEB_OR_OS_SUPPORT */;
    case Protocol.Audits.AttributionReportingIssueType.NavigationRegistrationWithoutTransientUserActivation:
      return "AttributionReportingIssue::NavigationRegistrationWithoutTransientUserActivation" /* NAVIGATION_REGISTRATION_WITHOUT_TRANSIENT_USER_ACTIVATION */;
    case Protocol.Audits.AttributionReportingIssueType.InvalidInfoHeader:
      return "AttributionReportingIssue::InvalidInfoHeader" /* INVALID_INFO_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.NoRegisterSourceHeader:
      return "AttributionReportingIssue::NoRegisterSourceHeader" /* NO_REGISTER_SOURCE_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.NoRegisterTriggerHeader:
      return "AttributionReportingIssue::NoRegisterTriggerHeader" /* NO_REGISTER_TRIGGER_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.NoRegisterOsSourceHeader:
      return "AttributionReportingIssue::NoRegisterOsSourceHeader" /* NO_REGISTER_OS_SOURCE_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.NoRegisterOsTriggerHeader:
      return "AttributionReportingIssue::NoRegisterOsTriggerHeader" /* NO_REGISTER_OS_TRIGGER_HEADER */;
    case Protocol.Audits.AttributionReportingIssueType.NavigationRegistrationUniqueScopeAlreadySet:
      return "AttributionReportingIssue::NavigationRegistrationUniqueScopeAlreadySet" /* NAVIGATION_REGISTRATION_UNIQUE_SCOPE_ALREADY_SET */;
    default:
      return "AttributionReportingIssue::Unknown" /* UNKNOWN */;
  }
}
const structuredHeaderLink = {
  link: "https://tools.ietf.org/id/draft-ietf-httpbis-header-structure-15.html#rfc.section.4.2.2",
  linkTitle: "Structured Headers RFC"
};
export class AttributionReportingIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(getIssueCode(issueDetails), issueDetails, issuesModel);
  }
  getCategory() {
    return IssueCategory.ATTRIBUTION_REPORTING;
  }
  getHeaderValidatorLink(name) {
    const url = new URL("https://wicg.github.io/attribution-reporting-api/validate-headers");
    url.searchParams.set("header", name);
    const details = this.details();
    if (details.invalidParameter) {
      url.searchParams.set("json", details.invalidParameter);
    }
    return {
      link: url.toString(),
      linkTitle: "Header Validator"
    };
  }
  getDescription() {
    switch (this.code()) {
      case "AttributionReportingIssue::PermissionPolicyDisabled" /* PERMISSION_POLICY_DISABLED */:
        return {
          file: "arPermissionPolicyDisabled.md",
          links: []
        };
      case "AttributionReportingIssue::UntrustworthyReportingOrigin" /* UNTRUSTWORTHY_REPORTING_ORIGIN */:
        return {
          file: "arUntrustworthyReportingOrigin.md",
          links: []
        };
      case "AttributionReportingIssue::InsecureContext" /* INSECURE_CONTEXT */:
        return {
          file: "arInsecureContext.md",
          links: []
        };
      case "AttributionReportingIssue::InvalidRegisterSourceHeader" /* INVALID_REGISTER_SOURCE_HEADER */:
        return {
          file: "arInvalidRegisterSourceHeader.md",
          links: [this.getHeaderValidatorLink("source")]
        };
      case "AttributionReportingIssue::InvalidRegisterTriggerHeader" /* INVALID_REGISTER_TRIGGER_HEADER */:
        return {
          file: "arInvalidRegisterTriggerHeader.md",
          links: [this.getHeaderValidatorLink("trigger")]
        };
      case "AttributionReportingIssue::InvalidRegisterOsSourceHeader" /* INVALID_REGISTER_OS_SOURCE_HEADER */:
        return {
          file: "arInvalidRegisterOsSourceHeader.md",
          links: [this.getHeaderValidatorLink("os-source")]
        };
      case "AttributionReportingIssue::InvalidRegisterOsTriggerHeader" /* INVALID_REGISTER_OS_TRIGGER_HEADER */:
        return {
          file: "arInvalidRegisterOsTriggerHeader.md",
          links: [this.getHeaderValidatorLink("os-trigger")]
        };
      case "AttributionReportingIssue::SourceAndTriggerHeaders" /* SOURCE_AND_TRIGGER_HEADERS */:
        return {
          file: "arSourceAndTriggerHeaders.md",
          links: []
        };
      case "AttributionReportingIssue::WebAndOsHeaders" /* WEB_AND_OS_HEADERS */:
        return {
          file: "arWebAndOsHeaders.md",
          links: []
        };
      case "AttributionReportingIssue::SourceIgnored" /* SOURCE_IGNORED */:
        return {
          file: "arSourceIgnored.md",
          links: [structuredHeaderLink]
        };
      case "AttributionReportingIssue::TriggerIgnored" /* TRIGGER_IGNORED */:
        return {
          file: "arTriggerIgnored.md",
          links: [structuredHeaderLink]
        };
      case "AttributionReportingIssue::OsSourceIgnored" /* OS_SOURCE_IGNORED */:
        return {
          file: "arOsSourceIgnored.md",
          links: [structuredHeaderLink]
        };
      case "AttributionReportingIssue::OsTriggerIgnored" /* OS_TRIGGER_IGNORED */:
        return {
          file: "arOsTriggerIgnored.md",
          links: [structuredHeaderLink]
        };
      case "AttributionReportingIssue::NavigationRegistrationWithoutTransientUserActivation" /* NAVIGATION_REGISTRATION_WITHOUT_TRANSIENT_USER_ACTIVATION */:
        return {
          file: "arNavigationRegistrationWithoutTransientUserActivation.md",
          links: []
        };
      case "AttributionReportingIssue::NoWebOrOsSupport" /* NO_WEB_OR_OS_SUPPORT */:
        return {
          file: "arNoWebOrOsSupport.md",
          links: []
        };
      case "AttributionReportingIssue::InvalidInfoHeader" /* INVALID_INFO_HEADER */:
        return {
          file: "arInvalidInfoHeader.md",
          links: []
        };
      case "AttributionReportingIssue::NoRegisterSourceHeader" /* NO_REGISTER_SOURCE_HEADER */:
        return {
          file: "arNoRegisterSourceHeader.md",
          links: []
        };
      case "AttributionReportingIssue::NoRegisterTriggerHeader" /* NO_REGISTER_TRIGGER_HEADER */:
        return {
          file: "arNoRegisterTriggerHeader.md",
          links: []
        };
      case "AttributionReportingIssue::NoRegisterOsSourceHeader" /* NO_REGISTER_OS_SOURCE_HEADER */:
        return {
          file: "arNoRegisterOsSourceHeader.md",
          links: []
        };
      case "AttributionReportingIssue::NoRegisterOsTriggerHeader" /* NO_REGISTER_OS_TRIGGER_HEADER */:
        return {
          file: "arNoRegisterOsTriggerHeader.md",
          links: []
        };
      case "AttributionReportingIssue::NavigationRegistrationUniqueScopeAlreadySet" /* NAVIGATION_REGISTRATION_UNIQUE_SCOPE_ALREADY_SET */:
        return {
          file: "arNavigationRegistrationUniqueScopeAlreadySet.md",
          links: []
        };
      case "AttributionReportingIssue::Unknown" /* UNKNOWN */:
        return null;
    }
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const { attributionReportingIssueDetails } = inspectorIssue.details;
    if (!attributionReportingIssueDetails) {
      console.warn("Attribution Reporting issue without details received.");
      return [];
    }
    return [new AttributionReportingIssue(attributionReportingIssueDetails, issuesModel)];
  }
}
//# sourceMappingURL=AttributionReportingIssue.js.map
