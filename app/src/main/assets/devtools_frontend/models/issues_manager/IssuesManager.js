"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import { AttributionReportingIssue } from "./AttributionReportingIssue.js";
import { BounceTrackingIssue } from "./BounceTrackingIssue.js";
import { ClientHintIssue } from "./ClientHintIssue.js";
import { ConnectionAllowlistIssue } from "./ConnectionAllowlistIssue.js";
import { ContentSecurityPolicyIssue } from "./ContentSecurityPolicyIssue.js";
import { CookieDeprecationMetadataIssue } from "./CookieDeprecationMetadataIssue.js";
import { CookieIssue } from "./CookieIssue.js";
import { CorsIssue } from "./CorsIssue.js";
import { CrossOriginEmbedderPolicyIssue, isCrossOriginEmbedderPolicyIssue } from "./CrossOriginEmbedderPolicyIssue.js";
import { DeprecationIssue } from "./DeprecationIssue.js";
import { ElementAccessibilityIssue } from "./ElementAccessibilityIssue.js";
import { FederatedAuthRequestIssue } from "./FederatedAuthRequestIssue.js";
import { GenericIssue } from "./GenericIssue.js";
import { HeavyAdIssue } from "./HeavyAdIssue.js";
import { Events } from "./IssuesManagerEvents.js";
import { MixedContentIssue } from "./MixedContentIssue.js";
import { PartitioningBlobURLIssue } from "./PartitioningBlobURLIssue.js";
import { PermissionElementIssue } from "./PermissionElementIssue.js";
import { PropertyRuleIssue } from "./PropertyRuleIssue.js";
import { QuirksModeIssue } from "./QuirksModeIssue.js";
import { SelectivePermissionsInterventionIssue } from "./SelectivePermissionsInterventionIssue.js";
import { SharedArrayBufferIssue } from "./SharedArrayBufferIssue.js";
import { SharedDictionaryIssue } from "./SharedDictionaryIssue.js";
import { SourceFrameIssuesManager } from "./SourceFrameIssuesManager.js";
import { SRIMessageSignatureIssue } from "./SRIMessageSignatureIssue.js";
import { StylesheetLoadingIssue } from "./StylesheetLoadingIssue.js";
import { UnencodedDigestIssue } from "./UnencodedDigestIssue.js";
export { Events } from "./IssuesManagerEvents.js";
let issuesManagerInstance = null;
function createIssuesForBlockedByResponseIssue(issuesModel, inspectorIssue) {
  const blockedByResponseIssueDetails = inspectorIssue.details.blockedByResponseIssueDetails;
  if (!blockedByResponseIssueDetails) {
    console.warn("BlockedByResponse issue without details received.");
    return [];
  }
  if (isCrossOriginEmbedderPolicyIssue(blockedByResponseIssueDetails.reason)) {
    return [new CrossOriginEmbedderPolicyIssue(blockedByResponseIssueDetails, issuesModel)];
  }
  return [];
}
const issueCodeHandlers = /* @__PURE__ */ new Map([
  [
    Protocol.Audits.InspectorIssueCode.CookieIssue,
    CookieIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.MixedContentIssue,
    MixedContentIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.HeavyAdIssue,
    HeavyAdIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.ContentSecurityPolicyIssue,
    ContentSecurityPolicyIssue.fromInspectorIssue
  ],
  [Protocol.Audits.InspectorIssueCode.BlockedByResponseIssue, createIssuesForBlockedByResponseIssue],
  [
    Protocol.Audits.InspectorIssueCode.SharedArrayBufferIssue,
    SharedArrayBufferIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.SharedDictionaryIssue,
    SharedDictionaryIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.CorsIssue,
    CorsIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.QuirksModeIssue,
    QuirksModeIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.AttributionReportingIssue,
    AttributionReportingIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.GenericIssue,
    GenericIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.DeprecationIssue,
    DeprecationIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.ClientHintIssue,
    ClientHintIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.FederatedAuthRequestIssue,
    FederatedAuthRequestIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.BounceTrackingIssue,
    BounceTrackingIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.StylesheetLoadingIssue,
    StylesheetLoadingIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.PartitioningBlobURLIssue,
    PartitioningBlobURLIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.PropertyRuleIssue,
    PropertyRuleIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.CookieDeprecationMetadataIssue,
    CookieDeprecationMetadataIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.ElementAccessibilityIssue,
    ElementAccessibilityIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.SRIMessageSignatureIssue,
    SRIMessageSignatureIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.UnencodedDigestIssue,
    UnencodedDigestIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.ConnectionAllowlistIssue,
    ConnectionAllowlistIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.PermissionElementIssue,
    PermissionElementIssue.fromInspectorIssue
  ],
  [
    Protocol.Audits.InspectorIssueCode.SelectivePermissionsInterventionIssue,
    SelectivePermissionsInterventionIssue.fromInspectorIssue
  ]
]);
export function createIssuesFromProtocolIssue(issuesModel, inspectorIssue) {
  const handler = issueCodeHandlers.get(inspectorIssue.code);
  if (handler) {
    return handler(issuesModel, inspectorIssue);
  }
  console.warn(`No handler registered for issue code ${inspectorIssue.code}`);
  return [];
}
export var IssueStatus = /* @__PURE__ */ ((IssueStatus2) => {
  IssueStatus2["HIDDEN"] = "Hidden";
  IssueStatus2["UNHIDDEN"] = "Unhidden";
  return IssueStatus2;
})(IssueStatus || {});
export function defaultHideIssueByCodeSetting() {
  const setting = {};
  return setting;
}
export function getHideIssueByCodeSetting() {
  return Common.Settings.Settings.instance().createSetting(
    "hide-issue-by-code-setting-experiment-2021",
    defaultHideIssueByCodeSetting()
  );
}
export class IssuesManager extends Common.ObjectWrapper.ObjectWrapper {
  constructor(showThirdPartyIssuesSetting, hideIssueSetting) {
    super();
    this.showThirdPartyIssuesSetting = showThirdPartyIssuesSetting;
    this.hideIssueSetting = hideIssueSetting;
    new SourceFrameIssuesManager(this);
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.IssuesModel.IssuesModel, this);
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ResourceTreeModel.ResourceTreeModel,
      SDK.ResourceTreeModel.Events.PrimaryPageChanged,
      this.#onPrimaryPageChanged,
      this
    );
    SDK.FrameManager.FrameManager.instance().addEventListener(
      SDK.FrameManager.Events.FRAME_ADDED_TO_TARGET,
      this.#onFrameAddedToTarget,
      this
    );
    this.showThirdPartyIssuesSetting?.addChangeListener(() => this.#updateFilteredIssues());
    this.hideIssueSetting?.addChangeListener(() => this.#updateFilteredIssues());
    SDK.TargetManager.TargetManager.instance().observeTargets(
      {
        targetAdded: (target) => {
          if (target.outermostTarget() === target) {
            this.#updateFilteredIssues();
          }
        },
        targetRemoved: (_) => {
        }
      },
      { scoped: true }
    );
  }
  #eventListeners = /* @__PURE__ */ new WeakMap();
  #allIssues = /* @__PURE__ */ new Map();
  #filteredIssues = /* @__PURE__ */ new Map();
  #issueCounts = /* @__PURE__ */ new Map();
  #hiddenIssueCount = /* @__PURE__ */ new Map();
  #thirdPartyCookiePhaseoutIssueCount = /* @__PURE__ */ new Map();
  #issuesById = /* @__PURE__ */ new Map();
  #issuesByOutermostTarget = /* @__PURE__ */ new Map();
  static instance(opts = {
    forceNew: false,
    ensureFirst: false
  }) {
    if (issuesManagerInstance && opts.ensureFirst) {
      throw new Error(
        'IssuesManager was already created. Either set "ensureFirst" to false or make sure that this invocation is really the first one.'
      );
    }
    if (!issuesManagerInstance || opts.forceNew) {
      issuesManagerInstance = new IssuesManager(opts.showThirdPartyIssuesSetting, opts.hideIssueSetting);
    }
    return issuesManagerInstance;
  }
  static removeInstance() {
    issuesManagerInstance = null;
  }
  #onPrimaryPageChanged(event) {
    const { frame, type } = event.data;
    const keptIssues = /* @__PURE__ */ new Map();
    for (const [key, issue] of this.#allIssues.entries()) {
      if (issue.isAssociatedWithRequestId(frame.loaderId)) {
        keptIssues.set(key, issue);
      } else if (type === SDK.ResourceTreeModel.PrimaryPageChangeType.ACTIVATION && frame.resourceTreeModel().target() === issue.model()?.target()) {
        keptIssues.set(key, issue);
      } else if (issue.code() === Protocol.Audits.InspectorIssueCode.BounceTrackingIssue || issue.code() === Protocol.Audits.InspectorIssueCode.CookieIssue) {
        const networkManager = frame.resourceTreeModel().target().model(SDK.NetworkManager.NetworkManager);
        if (networkManager?.requestForLoaderId(frame.loaderId)?.hasUserGesture() === false) {
          keptIssues.set(key, issue);
        }
      }
    }
    this.#allIssues = keptIssues;
    this.#updateFilteredIssues();
  }
  #onFrameAddedToTarget(event) {
    const { frame } = event.data;
    if (frame.isOutermostFrame() && SDK.TargetManager.TargetManager.instance().isInScope(frame.resourceTreeModel())) {
      this.#updateFilteredIssues();
    }
  }
  modelAdded(issuesModel) {
    const listener = issuesModel.addEventListener(SDK.IssuesModel.Events.ISSUE_ADDED, this.#onIssueAddedEvent, this);
    this.#eventListeners.set(issuesModel, listener);
  }
  modelRemoved(issuesModel) {
    const listener = this.#eventListeners.get(issuesModel);
    if (listener) {
      Common.EventTarget.removeEventListeners([listener]);
    }
  }
  #onIssueAddedEvent(event) {
    const { issuesModel, inspectorIssue } = event.data;
    const issues = createIssuesFromProtocolIssue(issuesModel, inspectorIssue);
    for (const issue of issues) {
      this.addIssue(issuesModel, issue);
      const message = issue.maybeCreateConsoleMessage();
      if (!message) {
        continue;
      }
      issuesModel.target().model(SDK.ConsoleModel.ConsoleModel)?.addMessage(message);
    }
  }
  addIssue(issuesModel, issue) {
    if (!issue.getDescription()) {
      return;
    }
    const primaryKey = issue.primaryKey();
    if (this.#allIssues.has(primaryKey)) {
      return;
    }
    this.#allIssues.set(primaryKey, issue);
    const outermostTarget = issuesModel.target().outermostTarget();
    if (outermostTarget) {
      let issuesForTarget = this.#issuesByOutermostTarget.get(outermostTarget);
      if (!issuesForTarget) {
        issuesForTarget = /* @__PURE__ */ new Set();
        this.#issuesByOutermostTarget.set(outermostTarget, issuesForTarget);
      }
      issuesForTarget.add(issue);
    }
    if (this.#issueFilter(issue)) {
      this.#filteredIssues.set(primaryKey, issue);
      this.#issueCounts.set(issue.getKind(), 1 + (this.#issueCounts.get(issue.getKind()) || 0));
      const issueId = issue.getIssueId();
      if (issueId) {
        this.#issuesById.set(issueId, issue);
      }
      const values = this.hideIssueSetting?.get();
      this.#updateIssueHiddenStatus(issue, values);
      if (CookieIssue.isThirdPartyCookiePhaseoutRelatedIssue(issue)) {
        this.#thirdPartyCookiePhaseoutIssueCount.set(
          issue.getKind(),
          1 + (this.#thirdPartyCookiePhaseoutIssueCount.get(issue.getKind()) || 0)
        );
      } else if (issue.isHidden()) {
        this.#hiddenIssueCount.set(issue.getKind(), 1 + (this.#hiddenIssueCount.get(issue.getKind()) || 0));
      }
      this.dispatchEventToListeners(Events.ISSUE_ADDED, { issuesModel, issue });
    }
    this.dispatchEventToListeners(Events.ISSUES_COUNT_UPDATED);
  }
  issues() {
    return this.#filteredIssues.values();
  }
  numberOfIssues(kind) {
    if (kind) {
      return (this.#issueCounts.get(kind) ?? 0) - this.numberOfHiddenIssues(kind) - this.numberOfThirdPartyCookiePhaseoutIssues(kind);
    }
    return this.#filteredIssues.size - this.numberOfHiddenIssues() - this.numberOfThirdPartyCookiePhaseoutIssues();
  }
  numberOfHiddenIssues(kind) {
    if (kind) {
      return this.#hiddenIssueCount.get(kind) ?? 0;
    }
    let count = 0;
    for (const num of this.#hiddenIssueCount.values()) {
      count += num;
    }
    return count;
  }
  numberOfThirdPartyCookiePhaseoutIssues(kind) {
    if (kind) {
      return this.#thirdPartyCookiePhaseoutIssueCount.get(kind) ?? 0;
    }
    let count = 0;
    for (const num of this.#thirdPartyCookiePhaseoutIssueCount.values()) {
      count += num;
    }
    return count;
  }
  numberOfAllStoredIssues() {
    return this.#allIssues.size;
  }
  #issueFilter(issue) {
    const scopeTarget = SDK.TargetManager.TargetManager.instance().scopeTarget();
    if (!scopeTarget) {
      return false;
    }
    if (!this.#issuesByOutermostTarget.get(scopeTarget)?.has(issue)) {
      return false;
    }
    return this.showThirdPartyIssuesSetting?.get() || !issue.isCausedByThirdParty();
  }
  #updateIssueHiddenStatus(issue, values) {
    const code = issue.code();
    if (values?.[code]) {
      if (values[code] === "Hidden" /* HIDDEN */) {
        issue.setHidden(true);
        return;
      }
      issue.setHidden(false);
      return;
    }
  }
  #updateFilteredIssues() {
    this.#filteredIssues.clear();
    this.#issueCounts.clear();
    this.#issuesById.clear();
    this.#hiddenIssueCount.clear();
    this.#thirdPartyCookiePhaseoutIssueCount.clear();
    const values = this.hideIssueSetting?.get();
    for (const [key, issue] of this.#allIssues) {
      if (this.#issueFilter(issue)) {
        this.#updateIssueHiddenStatus(issue, values);
        this.#filteredIssues.set(key, issue);
        this.#issueCounts.set(issue.getKind(), 1 + (this.#issueCounts.get(issue.getKind()) ?? 0));
        if (issue.isHidden()) {
          this.#hiddenIssueCount.set(issue.getKind(), 1 + (this.#hiddenIssueCount.get(issue.getKind()) || 0));
        }
        const issueId = issue.getIssueId();
        if (issueId) {
          this.#issuesById.set(issueId, issue);
        }
      }
    }
    this.dispatchEventToListeners(Events.FULL_UPDATE_REQUIRED);
    this.dispatchEventToListeners(Events.ISSUES_COUNT_UPDATED);
  }
  unhideAllIssues() {
    for (const issue of this.#allIssues.values()) {
      issue.setHidden(false);
    }
    this.hideIssueSetting?.set(defaultHideIssueByCodeSetting());
  }
  getIssueById(id) {
    return this.#issuesById.get(id);
  }
}
globalThis.addIssueForTest = (issue) => {
  const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
  const issuesModel = mainTarget?.model(SDK.IssuesModel.IssuesModel);
  issuesModel?.issueAdded({ issue });
};
//# sourceMappingURL=IssuesManager.js.map
