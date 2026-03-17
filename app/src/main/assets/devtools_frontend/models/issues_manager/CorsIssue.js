"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
const UIStrings = {
  /**
   * @description Label for the link for CORS Local Network Access issues
   */
  corsLocalNetworkAccess: "Local Network Access",
  /**
   * @description Label for the link for CORS network issues
   */
  CORS: "Cross-Origin Resource Sharing (`CORS`)"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/CorsIssue.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var IssueCode = /* @__PURE__ */ ((IssueCode2) => {
  IssueCode2["INSECURE_LOCAL_NETWORK"] = "CorsIssue::InsecureLocalNetwork";
  IssueCode2["INVALID_HEADER_VALUES"] = "CorsIssue::InvalidHeaders";
  IssueCode2["WILDCARD_ORIGN_NOT_ALLOWED"] = "CorsIssue::WildcardOriginWithCredentials";
  IssueCode2["PREFLIGHT_RESPONSE_INVALID"] = "CorsIssue::PreflightResponseInvalid";
  IssueCode2["ORIGIN_MISMATCH"] = "CorsIssue::OriginMismatch";
  IssueCode2["ALLOW_CREDENTIALS_REQUIRED"] = "CorsIssue::AllowCredentialsRequired";
  IssueCode2["METHOD_DISALLOWED_BY_PREFLIGHT_RESPONSE"] = "CorsIssue::MethodDisallowedByPreflightResponse";
  IssueCode2["HEADER_DISALLOWED_BY_PREFLIGHT_RESPONSE"] = "CorsIssue::HeaderDisallowedByPreflightResponse";
  IssueCode2["REDIRECT_CONTAINS_CREDENTIALS"] = "CorsIssue::RedirectContainsCredentials";
  IssueCode2["DISALLOWED_BY_MODE"] = "CorsIssue::DisallowedByMode";
  IssueCode2["CORS_DISABLED_SCHEME"] = "CorsIssue::CorsDisabledScheme";
  IssueCode2["PREFLIGHT_MISSING_ALLOW_EXTERNAL"] = "CorsIssue::PreflightMissingAllowExternal";
  IssueCode2["PREFLIGHT_INVALID_ALLOW_EXTERNAL"] = "CorsIssue::PreflightInvalidAllowExternal";
  IssueCode2["NO_CORS_REDIRECT_MODE_NOT_FOLLOW"] = "CorsIssue::NoCorsRedirectModeNotFollow";
  IssueCode2["INVALID_LOCAL_NETWORK_ACCESS"] = "CorsIssue::InvalidLocalNetworkAccess";
  IssueCode2["LOCAL_NETWORK_ACCESS_PERMISSION_DENIED"] = "CorsIssue::LocalNetworkAccessPermissionDenied";
  return IssueCode2;
})(IssueCode || {});
function getIssueCode(details) {
  switch (details.corsErrorStatus.corsError) {
    case Protocol.Network.CorsError.InvalidAllowMethodsPreflightResponse:
    case Protocol.Network.CorsError.InvalidAllowHeadersPreflightResponse:
    case Protocol.Network.CorsError.PreflightMissingAllowOriginHeader:
    case Protocol.Network.CorsError.PreflightMultipleAllowOriginValues:
    case Protocol.Network.CorsError.PreflightInvalidAllowOriginValue:
    case Protocol.Network.CorsError.MissingAllowOriginHeader:
    case Protocol.Network.CorsError.MultipleAllowOriginValues:
    case Protocol.Network.CorsError.InvalidAllowOriginValue:
      return "CorsIssue::InvalidHeaders" /* INVALID_HEADER_VALUES */;
    case Protocol.Network.CorsError.PreflightWildcardOriginNotAllowed:
    case Protocol.Network.CorsError.WildcardOriginNotAllowed:
      return "CorsIssue::WildcardOriginWithCredentials" /* WILDCARD_ORIGN_NOT_ALLOWED */;
    case Protocol.Network.CorsError.PreflightInvalidStatus:
    case Protocol.Network.CorsError.PreflightDisallowedRedirect:
    case Protocol.Network.CorsError.InvalidResponse:
      return "CorsIssue::PreflightResponseInvalid" /* PREFLIGHT_RESPONSE_INVALID */;
    case Protocol.Network.CorsError.AllowOriginMismatch:
    case Protocol.Network.CorsError.PreflightAllowOriginMismatch:
      return "CorsIssue::OriginMismatch" /* ORIGIN_MISMATCH */;
    case Protocol.Network.CorsError.InvalidAllowCredentials:
    case Protocol.Network.CorsError.PreflightInvalidAllowCredentials:
      return "CorsIssue::AllowCredentialsRequired" /* ALLOW_CREDENTIALS_REQUIRED */;
    case Protocol.Network.CorsError.MethodDisallowedByPreflightResponse:
      return "CorsIssue::MethodDisallowedByPreflightResponse" /* METHOD_DISALLOWED_BY_PREFLIGHT_RESPONSE */;
    case Protocol.Network.CorsError.HeaderDisallowedByPreflightResponse:
      return "CorsIssue::HeaderDisallowedByPreflightResponse" /* HEADER_DISALLOWED_BY_PREFLIGHT_RESPONSE */;
    case Protocol.Network.CorsError.RedirectContainsCredentials:
      return "CorsIssue::RedirectContainsCredentials" /* REDIRECT_CONTAINS_CREDENTIALS */;
    case Protocol.Network.CorsError.DisallowedByMode:
      return "CorsIssue::DisallowedByMode" /* DISALLOWED_BY_MODE */;
    case Protocol.Network.CorsError.CorsDisabledScheme:
      return "CorsIssue::CorsDisabledScheme" /* CORS_DISABLED_SCHEME */;
    case Protocol.Network.CorsError.PreflightMissingAllowExternal:
      return "CorsIssue::PreflightMissingAllowExternal" /* PREFLIGHT_MISSING_ALLOW_EXTERNAL */;
    case Protocol.Network.CorsError.PreflightInvalidAllowExternal:
      return "CorsIssue::PreflightInvalidAllowExternal" /* PREFLIGHT_INVALID_ALLOW_EXTERNAL */;
    case Protocol.Network.CorsError.InsecureLocalNetwork:
      return "CorsIssue::InsecureLocalNetwork" /* INSECURE_LOCAL_NETWORK */;
    case Protocol.Network.CorsError.NoCorsRedirectModeNotFollow:
      return "CorsIssue::NoCorsRedirectModeNotFollow" /* NO_CORS_REDIRECT_MODE_NOT_FOLLOW */;
    case Protocol.Network.CorsError.InvalidLocalNetworkAccess:
      return "CorsIssue::InvalidLocalNetworkAccess" /* INVALID_LOCAL_NETWORK_ACCESS */;
    case Protocol.Network.CorsError.LocalNetworkAccessPermissionDenied:
      return "CorsIssue::LocalNetworkAccessPermissionDenied" /* LOCAL_NETWORK_ACCESS_PERMISSION_DENIED */;
  }
}
export class CorsIssue extends Issue {
  constructor(issueDetails, issuesModel, issueId) {
    super(getIssueCode(issueDetails), issueDetails, issuesModel, issueId);
  }
  getCategory() {
    return IssueCategory.CORS;
  }
  getDescription() {
    switch (getIssueCode(this.details())) {
      case "CorsIssue::InvalidHeaders" /* INVALID_HEADER_VALUES */:
        return {
          file: "corsInvalidHeaderValues.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::WildcardOriginWithCredentials" /* WILDCARD_ORIGN_NOT_ALLOWED */:
        return {
          file: "corsWildcardOriginNotAllowed.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::PreflightResponseInvalid" /* PREFLIGHT_RESPONSE_INVALID */:
        return {
          file: "corsPreflightResponseInvalid.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::OriginMismatch" /* ORIGIN_MISMATCH */:
        return {
          file: "corsOriginMismatch.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::AllowCredentialsRequired" /* ALLOW_CREDENTIALS_REQUIRED */:
        return {
          file: "corsAllowCredentialsRequired.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::MethodDisallowedByPreflightResponse" /* METHOD_DISALLOWED_BY_PREFLIGHT_RESPONSE */:
        return {
          file: "corsMethodDisallowedByPreflightResponse.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::HeaderDisallowedByPreflightResponse" /* HEADER_DISALLOWED_BY_PREFLIGHT_RESPONSE */:
        return {
          file: "corsHeaderDisallowedByPreflightResponse.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::RedirectContainsCredentials" /* REDIRECT_CONTAINS_CREDENTIALS */:
        return {
          file: "corsRedirectContainsCredentials.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::DisallowedByMode" /* DISALLOWED_BY_MODE */:
        return {
          file: "corsDisallowedByMode.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::CorsDisabledScheme" /* CORS_DISABLED_SCHEME */:
        return {
          file: "corsDisabledScheme.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::NoCorsRedirectModeNotFollow" /* NO_CORS_REDIRECT_MODE_NOT_FOLLOW */:
        return {
          file: "corsNoCorsRedirectModeNotFollow.md",
          links: [{
            link: "https://web.dev/cross-origin-resource-sharing",
            linkTitle: i18nString(UIStrings.CORS)
          }]
        };
      case "CorsIssue::InsecureLocalNetwork" /* INSECURE_LOCAL_NETWORK */:
      case "CorsIssue::LocalNetworkAccessPermissionDenied" /* LOCAL_NETWORK_ACCESS_PERMISSION_DENIED */:
        return {
          file: "corsLocalNetworkAccessPermissionDenied.md",
          links: [{
            link: "https://developer.chrome.com/blog/local-network-access",
            linkTitle: i18nString(UIStrings.corsLocalNetworkAccess)
          }]
        };
      case "CorsIssue::PreflightMissingAllowExternal" /* PREFLIGHT_MISSING_ALLOW_EXTERNAL */:
      case "CorsIssue::PreflightInvalidAllowExternal" /* PREFLIGHT_INVALID_ALLOW_EXTERNAL */:
      case "CorsIssue::InvalidLocalNetworkAccess" /* INVALID_LOCAL_NETWORK_ACCESS */:
        return null;
    }
  }
  primaryKey() {
    return JSON.stringify(this.details());
  }
  getKind() {
    if (this.details().isWarning && this.details().corsErrorStatus.corsError === Protocol.Network.CorsError.InsecureLocalNetwork) {
      return IssueKind.BREAKING_CHANGE;
    }
    return IssueKind.PAGE_ERROR;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const corsIssueDetails = inspectorIssue.details.corsIssueDetails;
    if (!corsIssueDetails) {
      console.warn("Cors issue without details received.");
      return [];
    }
    return [new CorsIssue(corsIssueDetails, issuesModel, inspectorIssue.issueId)];
  }
}
//# sourceMappingURL=CorsIssue.js.map
