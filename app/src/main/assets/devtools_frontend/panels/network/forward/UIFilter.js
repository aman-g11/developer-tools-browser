"use strict";
export var FilterType = /* @__PURE__ */ ((FilterType2) => {
  FilterType2["Domain"] = "domain";
  FilterType2["HasResponseHeader"] = "has-response-header";
  FilterType2["HasRequestHeader"] = "has-request-header";
  FilterType2["HasOverrides"] = "has-overrides";
  FilterType2["ResponseHeaderValueSetCookie"] = "response-header-set-cookie";
  FilterType2["Is"] = "is";
  FilterType2["LargerThan"] = "larger-than";
  FilterType2["Method"] = "method";
  FilterType2["MimeType"] = "mime-type";
  FilterType2["MixedContent"] = "mixed-content";
  FilterType2["Priority"] = "priority";
  FilterType2["Scheme"] = "scheme";
  FilterType2["SetCookieDomain"] = "set-cookie-domain";
  FilterType2["SetCookieName"] = "set-cookie-name";
  FilterType2["SetCookieValue"] = "set-cookie-value";
  FilterType2["ResourceType"] = "resource-type";
  FilterType2["CookieDomain"] = "cookie-domain";
  FilterType2["CookieName"] = "cookie-name";
  FilterType2["CookiePath"] = "cookie-path";
  FilterType2["CookieValue"] = "cookie-value";
  FilterType2["StatusCode"] = "status-code";
  FilterType2["Url"] = "url";
  return FilterType2;
})(FilterType || {});
export var IsFilterType = /* @__PURE__ */ ((IsFilterType2) => {
  IsFilterType2["RUNNING"] = "running";
  IsFilterType2["FROM_CACHE"] = "from-cache";
  IsFilterType2["SERVICE_WORKER_INTERCEPTED"] = "service-worker-intercepted";
  IsFilterType2["SERVICE_WORKER_INITIATED"] = "service-worker-initiated";
  return IsFilterType2;
})(IsFilterType || {});
export var MixedContentFilterValues = /* @__PURE__ */ ((MixedContentFilterValues2) => {
  MixedContentFilterValues2["ALL"] = "all";
  MixedContentFilterValues2["DISPLAYED"] = "displayed";
  MixedContentFilterValues2["BLOCKED"] = "blocked";
  MixedContentFilterValues2["BLOCK_OVERRIDDEN"] = "block-overridden";
  return MixedContentFilterValues2;
})(MixedContentFilterValues || {});
export class UIRequestFilter {
  filters;
  constructor(filters) {
    this.filters = filters;
  }
  static filters(filters) {
    return new UIRequestFilter(filters);
  }
}
//# sourceMappingURL=UIFilter.js.map
