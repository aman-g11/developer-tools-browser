"use strict";
import * as Protocol from "../../generated/protocol.js";
import { Issue, IssueCategory, IssueKind } from "./Issue.js";
export class PermissionElementIssue extends Issue {
  #issueDetails;
  constructor(issueDetails, issuesModel) {
    const issueCode = [
      Protocol.Audits.InspectorIssueCode.PermissionElementIssue,
      issueDetails.issueType
    ].join("::");
    super(issueCode, issueDetails, issuesModel);
    this.#issueDetails = issueDetails;
  }
  getCategory() {
    return IssueCategory.PERMISSION_ELEMENT;
  }
  getDescription() {
    const issueType = this.#issueDetails.issueType;
    switch (issueType) {
      case Protocol.Audits.PermissionElementIssueType.InvalidType:
        return {
          file: "permissionElementInvalidType.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.FencedFrameDisallowed:
        return {
          file: "permissionElementFencedFrameDisallowed.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.CspFrameAncestorsMissing:
        return {
          file: "permissionElementCspFrameAncestorsMissing.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.PermissionsPolicyBlocked:
        return {
          file: "permissionElementPermissionsPolicyBlocked.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""],
            ["PLACEHOLDER_PermissionName", this.#issueDetails.permissionName || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.PaddingRightUnsupported:
        return {
          file: "permissionElementPaddingRightUnsupported.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.PaddingBottomUnsupported:
        return {
          file: "permissionElementPaddingBottomUnsupported.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.InsetBoxShadowUnsupported:
        return {
          file: "permissionElementInsetBoxShadowUnsupported.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.RequestInProgress:
        return {
          file: "permissionElementRequestInProgress.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.UntrustedEvent:
        return {
          file: "permissionElementUntrustedEvent.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.RegistrationFailed:
        return {
          file: "permissionElementRegistrationFailed.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.TypeNotSupported:
        return {
          file: "permissionElementTypeNotSupported.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.InvalidTypeActivation:
        return {
          file: "permissionElementInvalidTypeActivation.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.SecurityChecksFailed:
        return {
          file: "permissionElementSecurityChecksFailed.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.ActivationDisabled: {
        if (this.#issueDetails.occluderNodeInfo && this.#issueDetails.occluderParentNodeInfo) {
          return {
            file: "permissionElementActivationDisabledWithOccluderParent.md",
            substitutions: /* @__PURE__ */ new Map([
              ["PLACEHOLDER_DisableReason", this.#issueDetails.disableReason || ""],
              ["PLACEHOLDER_OccluderInfo", this.#issueDetails.occluderNodeInfo || ""],
              ["PLACEHOLDER_Type", this.#issueDetails.type || ""],
              ["PLACEHOLDER_OccluderParentInfo", this.#issueDetails.occluderParentNodeInfo || ""]
            ]),
            links: []
          };
        }
        if (this.#issueDetails.occluderNodeInfo) {
          return {
            file: "permissionElementActivationDisabledWithOccluder.md",
            substitutions: /* @__PURE__ */ new Map([
              ["PLACEHOLDER_DisableReason", this.#issueDetails.disableReason || ""],
              ["PLACEHOLDER_OccluderInfo", this.#issueDetails.occluderNodeInfo || ""],
              ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
            ]),
            links: []
          };
        }
        return {
          file: "permissionElementActivationDisabled.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_DisableReason", this.#issueDetails.disableReason || ""],
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      }
      case Protocol.Audits.PermissionElementIssueType.GeolocationDeprecated:
        return {
          file: "permissionElementGeolocationDeprecated.md",
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.InvalidDisplayStyle:
        return {
          file: "permissionElementInvalidDisplayStyle.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.NonOpaqueColor:
        return {
          file: "permissionElementNonOpaqueColor.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.LowContrast:
        return {
          file: "permissionElementLowContrast.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.FontSizeTooSmall:
        return {
          file: "permissionElementFontSizeTooSmall.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.FontSizeTooLarge:
        return {
          file: "permissionElementFontSizeTooLarge.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      case Protocol.Audits.PermissionElementIssueType.InvalidSizeValue:
        return {
          file: "permissionElementInvalidSizeValue.md",
          substitutions: /* @__PURE__ */ new Map([
            ["PLACEHOLDER_Type", this.#issueDetails.type || ""]
          ]),
          links: []
        };
      default:
        console.warn("Unknown PermissionElementIssueType:", issueType);
        return null;
    }
  }
  elements() {
    if (this.#issueDetails.nodeId) {
      const target = this.model()?.target();
      const result = [{
        backendNodeId: this.#issueDetails.nodeId,
        nodeName: this.#issueDetails.type || "Affected element",
        target: target || null
      }];
      return result;
    }
    return [];
  }
  getKind() {
    return this.#issueDetails.isWarning ? IssueKind.IMPROVEMENT : IssueKind.PAGE_ERROR;
  }
  primaryKey() {
    return `${Protocol.Audits.InspectorIssueCode.PermissionElementIssue}-${JSON.stringify(this.#issueDetails)}`;
  }
  static fromInspectorIssue(issuesModel, inspectorIssue) {
    const permissionElementIssueDetails = inspectorIssue.details.permissionElementIssueDetails;
    if (!permissionElementIssueDetails) {
      console.warn("Permission element issue without details received.");
      return [];
    }
    return [new PermissionElementIssue(permissionElementIssueDetails, issuesModel)];
  }
}
//# sourceMappingURL=PermissionElementIssue.js.map
