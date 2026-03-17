"use strict";
import * as Common from "../../core/common/common.js";
import { AttributionReportingIssue } from "./AttributionReportingIssue.js";
import { ContentSecurityPolicyIssue } from "./ContentSecurityPolicyIssue.js";
import { CookieDeprecationMetadataIssue } from "./CookieDeprecationMetadataIssue.js";
import { CookieIssue } from "./CookieIssue.js";
import { CorsIssue } from "./CorsIssue.js";
import { DeprecationIssue } from "./DeprecationIssue.js";
import { ElementAccessibilityIssue } from "./ElementAccessibilityIssue.js";
import { GenericIssue } from "./GenericIssue.js";
import { HeavyAdIssue } from "./HeavyAdIssue.js";
import { Issue, IssueCategory, IssueKind, unionIssueKind } from "./Issue.js";
import { Events as IssuesManagerEvents } from "./IssuesManagerEvents.js";
import { MixedContentIssue } from "./MixedContentIssue.js";
import { PartitioningBlobURLIssue } from "./PartitioningBlobURLIssue.js";
import { PermissionElementIssue } from "./PermissionElementIssue.js";
import { QuirksModeIssue } from "./QuirksModeIssue.js";
import { SelectivePermissionsInterventionIssue } from "./SelectivePermissionsInterventionIssue.js";
import { SharedArrayBufferIssue } from "./SharedArrayBufferIssue.js";
export class AggregatedIssue extends Issue {
  #allIssues = /* @__PURE__ */ new Set();
  #affectedCookies = /* @__PURE__ */ new Map();
  #affectedRawCookieLines = /* @__PURE__ */ new Map();
  #affectedRequests = [];
  #affectedRequestIds = /* @__PURE__ */ new Set();
  #affectedLocations = /* @__PURE__ */ new Map();
  #heavyAdIssues = /* @__PURE__ */ new Set();
  #blockedByResponseDetails = /* @__PURE__ */ new Map();
  #bounceTrackingSites = /* @__PURE__ */ new Set();
  #corsIssues = /* @__PURE__ */ new Set();
  #cspIssues = /* @__PURE__ */ new Set();
  #deprecationIssues = /* @__PURE__ */ new Set();
  #issueKind = IssueKind.IMPROVEMENT;
  #cookieDeprecationMetadataIssues = /* @__PURE__ */ new Set();
  #mixedContentIssues = /* @__PURE__ */ new Set();
  #partitioningBlobURLIssues = /* @__PURE__ */ new Set();
  #permissionElementIssues = /* @__PURE__ */ new Set();
  #selectivePermissionsInterventionIssues = /* @__PURE__ */ new Set();
  #sharedArrayBufferIssues = /* @__PURE__ */ new Set();
  #quirksModeIssues = /* @__PURE__ */ new Set();
  #attributionReportingIssues = /* @__PURE__ */ new Set();
  #genericIssues = /* @__PURE__ */ new Set();
  #elementAccessibilityIssues = /* @__PURE__ */ new Set();
  #representative;
  #aggregatedIssuesCount = 0;
  #key;
  constructor(code, aggregationKey) {
    super(code, null);
    this.#key = aggregationKey;
  }
  primaryKey() {
    throw new Error("This should never be called");
  }
  aggregationKey() {
    return this.#key;
  }
  getBlockedByResponseDetails() {
    return this.#blockedByResponseDetails.values();
  }
  cookies() {
    return Array.from(this.#affectedCookies.values()).map((x) => x.cookie);
  }
  getRawCookieLines() {
    return this.#affectedRawCookieLines.values();
  }
  sources() {
    return this.#affectedLocations.values();
  }
  getBounceTrackingSites() {
    return this.#bounceTrackingSites.values();
  }
  cookiesWithRequestIndicator() {
    return this.#affectedCookies.values();
  }
  getHeavyAdIssues() {
    return this.#heavyAdIssues;
  }
  getCookieDeprecationMetadataIssues() {
    return this.#cookieDeprecationMetadataIssues;
  }
  getMixedContentIssues() {
    return this.#mixedContentIssues;
  }
  getCorsIssues() {
    return this.#corsIssues;
  }
  getCspIssues() {
    return this.#cspIssues;
  }
  getDeprecationIssues() {
    return this.#deprecationIssues;
  }
  requests() {
    return this.#affectedRequests.values();
  }
  getSelectivePermissionsInterventionIssues() {
    return this.#selectivePermissionsInterventionIssues;
  }
  getSharedArrayBufferIssues() {
    return this.#sharedArrayBufferIssues;
  }
  getQuirksModeIssues() {
    return this.#quirksModeIssues;
  }
  getAttributionReportingIssues() {
    return this.#attributionReportingIssues;
  }
  getGenericIssues() {
    return this.#genericIssues;
  }
  getElementAccessibilityIssues() {
    return this.#elementAccessibilityIssues;
  }
  getDescription() {
    if (this.#representative) {
      return this.#representative.getDescription();
    }
    return null;
  }
  getCategory() {
    if (this.#representative) {
      return this.#representative.getCategory();
    }
    return IssueCategory.OTHER;
  }
  getAggregatedIssuesCount() {
    return this.#aggregatedIssuesCount;
  }
  getPartitioningBlobURLIssues() {
    return this.#partitioningBlobURLIssues;
  }
  getPermissionElementIssues() {
    return this.#permissionElementIssues;
  }
  /**
   * Produces a primary key for a cookie. Use this instead of `JSON.stringify` in
   * case new fields are added to `AffectedCookie`.
   */
  #keyForCookie(cookie) {
    const { domain, path, name } = cookie;
    return `${domain};${path};${name}`;
  }
  addInstance(issue) {
    this.#aggregatedIssuesCount++;
    if (!this.#representative) {
      this.#representative = issue;
    }
    this.#allIssues.add(issue);
    this.#issueKind = unionIssueKind(this.#issueKind, issue.getKind());
    let hasRequest = false;
    for (const request of issue.requests()) {
      const { requestId } = request;
      hasRequest = true;
      if (requestId === void 0) {
        this.#affectedRequests.push(request);
      } else if (!this.#affectedRequestIds.has(requestId)) {
        this.#affectedRequests.push(request);
        this.#affectedRequestIds.add(requestId);
      }
    }
    for (const cookie of issue.cookies()) {
      const key = this.#keyForCookie(cookie);
      if (!this.#affectedCookies.has(key)) {
        this.#affectedCookies.set(key, { cookie, hasRequest });
      }
    }
    for (const rawCookieLine of issue.rawCookieLines()) {
      if (!this.#affectedRawCookieLines.has(rawCookieLine)) {
        this.#affectedRawCookieLines.set(rawCookieLine, { rawCookieLine, hasRequest });
      }
    }
    for (const site of issue.trackingSites()) {
      if (!this.#bounceTrackingSites.has(site)) {
        this.#bounceTrackingSites.add(site);
      }
    }
    for (const location of issue.sources()) {
      const key = JSON.stringify(location);
      if (!this.#affectedLocations.has(key)) {
        this.#affectedLocations.set(key, location);
      }
    }
    if (issue instanceof CookieDeprecationMetadataIssue) {
      this.#cookieDeprecationMetadataIssues.add(issue);
    }
    if (issue instanceof MixedContentIssue) {
      this.#mixedContentIssues.add(issue);
    }
    if (issue instanceof HeavyAdIssue) {
      this.#heavyAdIssues.add(issue);
    }
    for (const details of issue.getBlockedByResponseDetails()) {
      const key = JSON.stringify(details, ["parentFrame", "blockedFrame", "requestId", "frameId", "reason", "request"]);
      this.#blockedByResponseDetails.set(key, details);
    }
    if (issue instanceof ContentSecurityPolicyIssue) {
      this.#cspIssues.add(issue);
    }
    if (issue instanceof DeprecationIssue) {
      this.#deprecationIssues.add(issue);
    }
    if (issue instanceof SharedArrayBufferIssue) {
      this.#sharedArrayBufferIssues.add(issue);
    }
    if (issue instanceof CorsIssue) {
      this.#corsIssues.add(issue);
    }
    if (issue instanceof QuirksModeIssue) {
      this.#quirksModeIssues.add(issue);
    }
    if (issue instanceof AttributionReportingIssue) {
      this.#attributionReportingIssues.add(issue);
    }
    if (issue instanceof GenericIssue) {
      this.#genericIssues.add(issue);
    }
    if (issue instanceof ElementAccessibilityIssue) {
      this.#elementAccessibilityIssues.add(issue);
    }
    if (issue instanceof PartitioningBlobURLIssue) {
      this.#partitioningBlobURLIssues.add(issue);
    }
    if (issue instanceof PermissionElementIssue) {
      this.#permissionElementIssues.add(issue);
    }
    if (issue instanceof SelectivePermissionsInterventionIssue) {
      this.#selectivePermissionsInterventionIssues.add(issue);
    }
  }
  getKind() {
    return this.#issueKind;
  }
  getAllIssues() {
    return Array.from(this.#allIssues);
  }
  isHidden() {
    return this.#representative?.isHidden() || false;
  }
  setHidden(_value) {
    throw new Error("Should not call setHidden on aggregatedIssue");
  }
}
export class IssueAggregator extends Common.ObjectWrapper.ObjectWrapper {
  constructor(issuesManager) {
    super();
    this.issuesManager = issuesManager;
    this.issuesManager.addEventListener(IssuesManagerEvents.ISSUE_ADDED, this.#onIssueAdded, this);
    this.issuesManager.addEventListener(IssuesManagerEvents.FULL_UPDATE_REQUIRED, this.#onFullUpdateRequired, this);
    for (const issue of this.issuesManager.issues()) {
      this.#aggregateIssue(issue);
    }
  }
  #aggregatedIssuesByKey = /* @__PURE__ */ new Map();
  #hiddenAggregatedIssuesByKey = /* @__PURE__ */ new Map();
  #onIssueAdded(event) {
    this.#aggregateIssue(event.data.issue);
  }
  #onFullUpdateRequired() {
    this.#aggregatedIssuesByKey.clear();
    this.#hiddenAggregatedIssuesByKey.clear();
    for (const issue of this.issuesManager.issues()) {
      this.#aggregateIssue(issue);
    }
    this.dispatchEventToListeners("FullUpdateRequired" /* FULL_UPDATE_REQUIRED */);
  }
  #aggregateIssue(issue) {
    if (CookieIssue.isThirdPartyCookiePhaseoutRelatedIssue(issue)) {
      return;
    }
    const map = issue.isHidden() ? this.#hiddenAggregatedIssuesByKey : this.#aggregatedIssuesByKey;
    const aggregatedIssue = this.#aggregateIssueByStatus(map, issue);
    this.dispatchEventToListeners("AggregatedIssueUpdated" /* AGGREGATED_ISSUE_UPDATED */, aggregatedIssue);
    return aggregatedIssue;
  }
  #aggregateIssueByStatus(aggregatedIssuesMap, issue) {
    const key = issue.code();
    let aggregatedIssue = aggregatedIssuesMap.get(key);
    if (!aggregatedIssue) {
      aggregatedIssue = new AggregatedIssue(issue.code(), key);
      aggregatedIssuesMap.set(key, aggregatedIssue);
    }
    aggregatedIssue.addInstance(issue);
    return aggregatedIssue;
  }
  aggregatedIssues() {
    return [...this.#aggregatedIssuesByKey.values(), ...this.#hiddenAggregatedIssuesByKey.values()];
  }
  aggregatedIssueCodes() {
    return /* @__PURE__ */ new Set([...this.#aggregatedIssuesByKey.keys(), ...this.#hiddenAggregatedIssuesByKey.keys()]);
  }
  aggregatedIssueCategories() {
    const result = /* @__PURE__ */ new Set();
    for (const issue of this.#aggregatedIssuesByKey.values()) {
      result.add(issue.getCategory());
    }
    return result;
  }
  aggregatedIssueKinds() {
    const result = /* @__PURE__ */ new Set();
    for (const issue of this.#aggregatedIssuesByKey.values()) {
      result.add(issue.getKind());
    }
    return result;
  }
  numberOfAggregatedIssues() {
    return this.#aggregatedIssuesByKey.size;
  }
  numberOfHiddenAggregatedIssues() {
    return this.#hiddenAggregatedIssuesByKey.size;
  }
  keyForIssue(issue) {
    return issue.code();
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["AGGREGATED_ISSUE_UPDATED"] = "AggregatedIssueUpdated";
  Events2["FULL_UPDATE_REQUIRED"] = "FullUpdateRequired";
  return Events2;
})(Events || {});
//# sourceMappingURL=IssueAggregator.js.map
