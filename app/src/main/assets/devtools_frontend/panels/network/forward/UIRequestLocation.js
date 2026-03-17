"use strict";
export var UIHeaderSection = /* @__PURE__ */ ((UIHeaderSection2) => {
  UIHeaderSection2["GENERAL"] = "General";
  UIHeaderSection2["REQUEST"] = "Request";
  UIHeaderSection2["RESPONSE"] = "Response";
  UIHeaderSection2["EARLY_HINTS"] = "EarlyHints";
  return UIHeaderSection2;
})(UIHeaderSection || {});
export var UIRequestTabs = /* @__PURE__ */ ((UIRequestTabs2) => {
  UIRequestTabs2["COOKIES"] = "cookies";
  UIRequestTabs2["DEVICE_BOUND_SESSIONS"] = "device-bound-sessions";
  UIRequestTabs2["EVENT_SOURCE"] = "eventSource";
  UIRequestTabs2["HEADERS_COMPONENT"] = "headers-component";
  UIRequestTabs2["PAYLOAD"] = "payload";
  UIRequestTabs2["INITIATOR"] = "initiator";
  UIRequestTabs2["PREVIEW"] = "preview";
  UIRequestTabs2["RESPONSE"] = "response";
  UIRequestTabs2["TIMING"] = "timing";
  UIRequestTabs2["TRUST_TOKENS"] = "trust-tokens";
  UIRequestTabs2["WS_FRAMES"] = "web-socket-frames";
  UIRequestTabs2["DIRECT_SOCKET_CONNECTION"] = "direct-socket-connection";
  UIRequestTabs2["DIRECT_SOCKET_CHUNKS"] = "direct-socket-chunks";
  return UIRequestTabs2;
})(UIRequestTabs || {});
export class UIRequestLocation {
  request;
  header;
  searchMatch;
  isUrlMatch;
  tab;
  filterOptions;
  constructor(request, header, searchMatch, urlMatch, tab, filterOptions) {
    this.request = request;
    this.header = header;
    this.searchMatch = searchMatch;
    this.isUrlMatch = urlMatch;
    this.tab = tab;
    this.filterOptions = filterOptions;
  }
  static requestHeaderMatch(request, header) {
    return new UIRequestLocation(
      request,
      { section: "Request" /* REQUEST */, header },
      null,
      false,
      void 0,
      void 0
    );
  }
  static responseHeaderMatch(request, header) {
    return new UIRequestLocation(
      request,
      { section: "Response" /* RESPONSE */, header },
      null,
      false,
      void 0,
      void 0
    );
  }
  static bodyMatch(request, searchMatch) {
    return new UIRequestLocation(request, null, searchMatch, false, void 0, void 0);
  }
  static urlMatch(request) {
    return new UIRequestLocation(request, null, null, true, void 0, void 0);
  }
  static header(request, section, name) {
    return new UIRequestLocation(request, { section, header: { name, value: "" } }, null, false, void 0, void 0);
  }
  static tab(request, tab, filterOptions) {
    return new UIRequestLocation(request, null, null, false, tab, filterOptions);
  }
}
//# sourceMappingURL=UIRequestLocation.js.map
