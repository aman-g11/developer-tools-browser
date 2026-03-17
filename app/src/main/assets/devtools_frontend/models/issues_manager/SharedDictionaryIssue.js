"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
import {
  resolveLazyDescription
} from "./MarkdownIssueDescription.js";
const UIStrings = {
  /**
   * @description Title for Compression Dictionary Transport specification url link
   */
  compressionDictionaryTransport: "Compression Dictionary Transport"
};
const str_ = i18n.i18n.registerUIStrings("models/issues_manager/SharedDictionaryIssue.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
export var IssueCode = /* @__PURE__ */ ((IssueCode2) => {
  IssueCode2["USE_ERROR_NO_CORP_CROSS_ORIGIN_NO_CORS_REQUEST"] = "SharedDictionaryIssue::UseErrorNoCorpCrossOriginNoCorsRequest";
  IssueCode2["USE_ERROR_DICTIONARY_LOAD_FAILURE"] = "SharedDictionaryIssue::UseErrorDictionaryLoadFailure";
  IssueCode2["USE_ERROR_MATCHING_DICTIONARY_NOT_USED"] = "SharedDictionaryIssue::UseErrorMatchingDictionaryNotUsed";
  IssueCode2["USE_ERROR_UNEXPECTED_CONTENT_DICTIONARY_HEADER"] = "SharedDictionaryIssue::UseErrorUnexpectedContentDictionaryHeader";
  IssueCode2["WRITE_ERROR_CROSS_ORIGIN_NO_CORS_REQUEST"] = "SharedDictionaryIssue::WriteErrorCossOriginNoCorsRequest";
  IssueCode2["WRITE_ERROR_DISALLOWED_BY_SETTINGS"] = "SharedDictionaryIssue::WriteErrorDisallowedBySettings";
  IssueCode2["WRITE_ERROR_EXPIRED_RESPONSE"] = "SharedDictionaryIssue::WriteErrorExpiredResponse";
  IssueCode2["WRITE_ERROR_FEATURE_DISABLED"] = "SharedDictionaryIssue::WriteErrorFeatureDisabled";
  IssueCode2["WRITE_ERROR_INSUFFICIENT_RESOURCES"] = "SharedDictionaryIssue::WriteErrorInsufficientResources";
  IssueCode2["WRITE_ERROR_INVALID_MATCH_FIELD"] = "SharedDictionaryIssue::WriteErrorInvalidMatchField";
  IssueCode2["WRITE_ERROR_INVALID_STRUCTURED_HEADER"] = "SharedDictionaryIssue::WriteErrorInvalidStructuredHeader";
  IssueCode2["WRITE_ERROR_INVALID_TTL_FIELD"] = "SharedDictionaryIssue::WriteErrorInvalidTTLField";
  IssueCode2["WRITE_ERROR_NAVIGATION_REQUEST"] = "SharedDictionaryIssue::WriteErrorNavigationRequest";
  IssueCode2["WRITE_ERROR_NO_CORP_COSS_ORIGIN_NO_CORS_REQUEST"] = "SharedDictionaryIssue::WriteErrorNoCorpCossOriginNoCorsRequest";
  IssueCode2["WRITE_ERROR_NO_MATCH_FIELD"] = "SharedDictionaryIssue::WriteErrorNoMatchField";
  IssueCode2["WRITE_ERROR_NON_INTEGER_TTL_FIELD"] = "SharedDictionaryIssue::WriteErrorNonIntegerTTLField";
  IssueCode2["WRITE_ERROR_NON_LIST_MATCH_DEST_FIELD"] = "SharedDictionaryIssue::WriteErrorNonListMatchDestField";
  IssueCode2["WRITE_ERROR_NON_SECURE_CONTEXT"] = "SharedDictionaryIssue::WriteErrorNonSecureContext";
  IssueCode2["WRITE_ERROR_NON_STRING_ID_FIELD"] = "SharedDictionaryIssue::WriteErrorNonStringIdField";
  IssueCode2["WRITE_ERROR_NON_STRING_IN_MATCH_DEST_LIST"] = "SharedDictionaryIssue::WriteErrorNonStringInMatchDestList";
  IssueCode2["WRITE_ERROR_NON_STRING_MATCH_FIELD"] = "SharedDictionaryIssue::WriteErrorNonStringMatchField";
  IssueCode2["WRITE_ERROR_NON_TOKEN_TYPE_FIELD"] = "SharedDictionaryIssue::WriteErrorNonTokenTypeField";
  IssueCode2["WRITE_ERROR_REQUEST_ABORTED"] = "SharedDictionaryIssue::WriteErrorRequestAborted";
  IssueCode2["WRITE_ERROR_SHUTTING_DOWN"] = "SharedDictionaryIssue::WriteErrorShuttingDown";
  IssueCode2["WRITE_ERROR_TOO_LONG_ID_FIELD"] = "SharedDictionaryIssue::WriteErrorTooLongIdField";
  IssueCode2["WRITE_ERROR_UNSUPPORTED_TYPE"] = "SharedDictionaryIssue::WriteErrorUnsupportedType";
  IssueCode2["UNKNOWN"] = "SharedDictionaryIssue::WriteErrorUnknown";
  return IssueCode2;
})(IssueCode || {});
function getIssueCode(details) {
  switch (details.sharedDictionaryError) {
    case Protocol.Audits.SharedDictionaryError.UseErrorNoCorpCrossOriginNoCorsRequest:
      return "SharedDictionaryIssue::UseErrorNoCorpCrossOriginNoCorsRequest" /* USE_ERROR_NO_CORP_CROSS_ORIGIN_NO_CORS_REQUEST */;
    case Protocol.Audits.SharedDictionaryError.UseErrorDictionaryLoadFailure:
      return "SharedDictionaryIssue::UseErrorDictionaryLoadFailure" /* USE_ERROR_DICTIONARY_LOAD_FAILURE */;
    case Protocol.Audits.SharedDictionaryError.UseErrorMatchingDictionaryNotUsed:
      return "SharedDictionaryIssue::UseErrorMatchingDictionaryNotUsed" /* USE_ERROR_MATCHING_DICTIONARY_NOT_USED */;
    case Protocol.Audits.SharedDictionaryError.UseErrorUnexpectedContentDictionaryHeader:
      return "SharedDictionaryIssue::UseErrorUnexpectedContentDictionaryHeader" /* USE_ERROR_UNEXPECTED_CONTENT_DICTIONARY_HEADER */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorCossOriginNoCorsRequest:
      return "SharedDictionaryIssue::WriteErrorCossOriginNoCorsRequest" /* WRITE_ERROR_CROSS_ORIGIN_NO_CORS_REQUEST */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorDisallowedBySettings:
      return "SharedDictionaryIssue::WriteErrorDisallowedBySettings" /* WRITE_ERROR_DISALLOWED_BY_SETTINGS */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorExpiredResponse:
      return "SharedDictionaryIssue::WriteErrorExpiredResponse" /* WRITE_ERROR_EXPIRED_RESPONSE */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorFeatureDisabled:
      return "SharedDictionaryIssue::WriteErrorFeatureDisabled" /* WRITE_ERROR_FEATURE_DISABLED */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInsufficientResources:
      return "SharedDictionaryIssue::WriteErrorInsufficientResources" /* WRITE_ERROR_INSUFFICIENT_RESOURCES */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInvalidMatchField:
      return "SharedDictionaryIssue::WriteErrorInvalidMatchField" /* WRITE_ERROR_INVALID_MATCH_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInvalidStructuredHeader:
      return "SharedDictionaryIssue::WriteErrorInvalidStructuredHeader" /* WRITE_ERROR_INVALID_STRUCTURED_HEADER */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorInvalidTTLField:
      return "SharedDictionaryIssue::WriteErrorInvalidTTLField" /* WRITE_ERROR_INVALID_TTL_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNavigationRequest:
      return "SharedDictionaryIssue::WriteErrorNavigationRequest" /* WRITE_ERROR_NAVIGATION_REQUEST */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNoCorpCossOriginNoCorsRequest:
      return "SharedDictionaryIssue::WriteErrorNoCorpCossOriginNoCorsRequest" /* WRITE_ERROR_NO_CORP_COSS_ORIGIN_NO_CORS_REQUEST */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNoMatchField:
      return "SharedDictionaryIssue::WriteErrorNoMatchField" /* WRITE_ERROR_NO_MATCH_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonIntegerTTLField:
      return "SharedDictionaryIssue::WriteErrorNonIntegerTTLField" /* WRITE_ERROR_NON_INTEGER_TTL_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonListMatchDestField:
      return "SharedDictionaryIssue::WriteErrorNonListMatchDestField" /* WRITE_ERROR_NON_LIST_MATCH_DEST_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonSecureContext:
      return "SharedDictionaryIssue::WriteErrorNonSecureContext" /* WRITE_ERROR_NON_SECURE_CONTEXT */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonStringIdField:
      return "SharedDictionaryIssue::WriteErrorNonStringIdField" /* WRITE_ERROR_NON_STRING_ID_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonStringInMatchDestList:
      return "SharedDictionaryIssue::WriteErrorNonStringInMatchDestList" /* WRITE_ERROR_NON_STRING_IN_MATCH_DEST_LIST */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonStringMatchField:
      return "SharedDictionaryIssue::WriteErrorNonStringMatchField" /* WRITE_ERROR_NON_STRING_MATCH_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorNonTokenTypeField:
      return "SharedDictionaryIssue::WriteErrorNonTokenTypeField" /* WRITE_ERROR_NON_TOKEN_TYPE_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorRequestAborted:
      return "SharedDictionaryIssue::WriteErrorRequestAborted" /* WRITE_ERROR_REQUEST_ABORTED */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorShuttingDown:
      return "SharedDictionaryIssue::WriteErrorShuttingDown" /* WRITE_ERROR_SHUTTING_DOWN */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorTooLongIdField:
      return "SharedDictionaryIssue::WriteErrorTooLongIdField" /* WRITE_ERROR_TOO_LONG_ID_FIELD */;
    case Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedType:
      return "SharedDictionaryIssue::WriteErrorUnsupportedType" /* WRITE_ERROR_UNSUPPORTED_TYPE */;
    default:
      return "SharedDictionaryIssue::WriteErrorUnknown" /* UNKNOWN */;
  }
}
export class SharedDictionaryIssue extends Issue {
  constructor(issueDetails, issuesModel) {
    super(
      {
        code: getIssueCode(issueDetails),
        umaCode: [
          Protocol.Audits.InspectorIssueCode.SharedDictionaryIssue,
          issueDetails.sharedDictionaryError
        ].join("::")
      },
      issueDetails,
      issuesModel
    );
  }
  requests() {
    if (this.details().request) {
      return [this.details().request];
    }
    return [];
  }
  getCategory() {
    return IssueCategory.OTHER;
  }
  getDescription() {
    const description = issueDescriptions.get(this.details().sharedDictionaryError);
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
    const details = inspectorIssue.details.sharedDictionaryIssueDetails;
    if (!details) {
      console.warn("Shared Dictionary issue without details received.");
      return [];
    }
    return [new SharedDictionaryIssue(details, issuesModel)];
  }
}
const specLinks = [{
  link: "https://datatracker.ietf.org/doc/draft-ietf-httpbis-compression-dictionary/",
  linkTitle: i18nLazyString(UIStrings.compressionDictionaryTransport)
}];
const issueDescriptions = /* @__PURE__ */ new Map([
  [
    Protocol.Audits.SharedDictionaryError.UseErrorNoCorpCrossOriginNoCorsRequest,
    {
      file: "sharedDictionaryUseErrorNoCorpCrossOriginNoCorsRequest.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorDictionaryLoadFailure,
    {
      file: "sharedDictionaryUseErrorDictionaryLoadFailure.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorMatchingDictionaryNotUsed,
    {
      file: "sharedDictionaryUseErrorMatchingDictionaryNotUsed.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.UseErrorUnexpectedContentDictionaryHeader,
    {
      file: "sharedDictionaryUseErrorUnexpectedContentDictionaryHeader.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorCossOriginNoCorsRequest,
    {
      file: "sharedDictionaryWriteErrorCossOriginNoCorsRequest.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorDisallowedBySettings,
    {
      file: "sharedDictionaryWriteErrorDisallowedBySettings.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorExpiredResponse,
    {
      file: "sharedDictionaryWriteErrorExpiredResponse.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorFeatureDisabled,
    {
      file: "sharedDictionaryWriteErrorFeatureDisabled.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInsufficientResources,
    {
      file: "sharedDictionaryWriteErrorInsufficientResources.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInvalidMatchField,
    {
      file: "sharedDictionaryWriteErrorInvalidMatchField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInvalidStructuredHeader,
    {
      file: "sharedDictionaryWriteErrorInvalidStructuredHeader.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorInvalidTTLField,
    {
      file: "sharedDictionaryWriteErrorInvalidTTLField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNavigationRequest,
    {
      file: "sharedDictionaryWriteErrorNavigationRequest.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNoCorpCossOriginNoCorsRequest,
    {
      file: "sharedDictionaryWriteErrorNoCorpCossOriginNoCorsRequest.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNoMatchField,
    {
      file: "sharedDictionaryWriteErrorNoMatchField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonIntegerTTLField,
    {
      file: "sharedDictionaryWriteErrorNonIntegerTTLField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonListMatchDestField,
    {
      file: "sharedDictionaryWriteErrorNonListMatchDestField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonSecureContext,
    {
      file: "sharedDictionaryWriteErrorNonSecureContext.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonStringIdField,
    {
      file: "sharedDictionaryWriteErrorNonStringIdField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonStringInMatchDestList,
    {
      file: "sharedDictionaryWriteErrorNonStringInMatchDestList.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonStringMatchField,
    {
      file: "sharedDictionaryWriteErrorNonStringMatchField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorNonTokenTypeField,
    {
      file: "sharedDictionaryWriteErrorNonTokenTypeField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorRequestAborted,
    {
      file: "sharedDictionaryWriteErrorRequestAborted.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorShuttingDown,
    {
      file: "sharedDictionaryWriteErrorShuttingDown.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorTooLongIdField,
    {
      file: "sharedDictionaryWriteErrorTooLongIdField.md",
      links: specLinks
    }
  ],
  [
    Protocol.Audits.SharedDictionaryError.WriteErrorUnsupportedType,
    {
      file: "sharedDictionaryWriteErrorUnsupportedType.md",
      links: specLinks
    }
  ]
]);
//# sourceMappingURL=SharedDictionaryIssue.js.map
