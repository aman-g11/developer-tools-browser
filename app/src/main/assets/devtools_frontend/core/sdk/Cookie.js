"use strict";
const OPAQUE_PARTITION_KEY = "<opaque>";
export class Cookie {
  #name;
  #value;
  #type;
  #attributes = /* @__PURE__ */ new Map();
  #size = 0;
  #priority;
  #cookieLine = null;
  #partitionKey;
  constructor(name, value, type, priority, partitionKey) {
    this.#name = name;
    this.#value = value;
    this.#type = type;
    this.#priority = priority || "Medium";
    this.#partitionKey = partitionKey;
  }
  static fromProtocolCookie(protocolCookie) {
    const cookie = new Cookie(protocolCookie.name, protocolCookie.value, null, protocolCookie.priority);
    cookie.addAttribute("domain" /* DOMAIN */, protocolCookie["domain"]);
    cookie.addAttribute("path" /* PATH */, protocolCookie["path"]);
    if (protocolCookie["expires"]) {
      cookie.addAttribute("expires" /* EXPIRES */, protocolCookie["expires"] * 1e3);
    }
    if (protocolCookie["httpOnly"]) {
      cookie.addAttribute("http-only" /* HTTP_ONLY */);
    }
    if (protocolCookie["secure"]) {
      cookie.addAttribute("secure" /* SECURE */);
    }
    if (protocolCookie["sameSite"]) {
      cookie.addAttribute("same-site" /* SAME_SITE */, protocolCookie["sameSite"]);
    }
    if ("sourcePort" in protocolCookie) {
      cookie.addAttribute("source-port" /* SOURCE_PORT */, protocolCookie.sourcePort);
    }
    if ("sourceScheme" in protocolCookie) {
      cookie.addAttribute("source-scheme" /* SOURCE_SCHEME */, protocolCookie.sourceScheme);
    }
    if ("partitionKey" in protocolCookie) {
      if (protocolCookie.partitionKey) {
        cookie.setPartitionKey(
          protocolCookie.partitionKey.topLevelSite,
          protocolCookie.partitionKey.hasCrossSiteAncestor
        );
      }
    }
    if ("partitionKeyOpaque" in protocolCookie && protocolCookie.partitionKeyOpaque) {
      cookie.addAttribute("partition-key" /* PARTITION_KEY */, OPAQUE_PARTITION_KEY);
    }
    cookie.setSize(protocolCookie["size"]);
    return cookie;
  }
  key() {
    return (this.domain() || "-") + " " + this.name() + " " + (this.path() || "-") + " " + (this.partitionKey() ? this.topLevelSite() + " " + (this.hasCrossSiteAncestor() ? "cross_site" : "same_site") : "-");
  }
  name() {
    return this.#name;
  }
  value() {
    return this.#value;
  }
  type() {
    return this.#type;
  }
  httpOnly() {
    return this.#attributes.has("http-only" /* HTTP_ONLY */);
  }
  secure() {
    return this.#attributes.has("secure" /* SECURE */);
  }
  partitioned() {
    return this.#attributes.has("partitioned" /* PARTITIONED */) || Boolean(this.partitionKey()) || this.partitionKeyOpaque();
  }
  sameSite() {
    return this.#attributes.get("same-site" /* SAME_SITE */);
  }
  partitionKey() {
    return this.#partitionKey;
  }
  setPartitionKey(topLevelSite, hasCrossSiteAncestor) {
    this.#partitionKey = { topLevelSite, hasCrossSiteAncestor };
    if (!this.#attributes.has("partitioned" /* PARTITIONED */)) {
      this.addAttribute("partitioned" /* PARTITIONED */);
    }
  }
  topLevelSite() {
    if (!this.#partitionKey) {
      return "";
    }
    return this.#partitionKey?.topLevelSite;
  }
  setTopLevelSite(topLevelSite, hasCrossSiteAncestor) {
    this.setPartitionKey(topLevelSite, hasCrossSiteAncestor);
  }
  hasCrossSiteAncestor() {
    if (!this.#partitionKey) {
      return false;
    }
    return this.#partitionKey?.hasCrossSiteAncestor;
  }
  setHasCrossSiteAncestor(hasCrossSiteAncestor) {
    if (!this.partitionKey() || !Boolean(this.topLevelSite())) {
      return;
    }
    this.setPartitionKey(this.topLevelSite(), hasCrossSiteAncestor);
  }
  partitionKeyOpaque() {
    if (!this.#partitionKey) {
      return false;
    }
    return this.topLevelSite() === OPAQUE_PARTITION_KEY;
  }
  setPartitionKeyOpaque() {
    this.addAttribute("partition-key" /* PARTITION_KEY */, OPAQUE_PARTITION_KEY);
    this.setPartitionKey(OPAQUE_PARTITION_KEY, false);
  }
  priority() {
    return this.#priority;
  }
  session() {
    return !(this.#attributes.has("expires" /* EXPIRES */) || this.#attributes.has("max-age" /* MAX_AGE */));
  }
  path() {
    return this.#attributes.get("path" /* PATH */);
  }
  domain() {
    return this.#attributes.get("domain" /* DOMAIN */);
  }
  expires() {
    return this.#attributes.get("expires" /* EXPIRES */);
  }
  maxAge() {
    return this.#attributes.get("max-age" /* MAX_AGE */);
  }
  sourcePort() {
    return this.#attributes.get("source-port" /* SOURCE_PORT */);
  }
  sourceScheme() {
    return this.#attributes.get("source-scheme" /* SOURCE_SCHEME */);
  }
  size() {
    return this.#size;
  }
  /**
   * @deprecated
   */
  url() {
    if (!this.domain() || !this.path()) {
      return null;
    }
    let port = "";
    const sourcePort = this.sourcePort();
    if (sourcePort && sourcePort !== 80 && sourcePort !== 443) {
      port = `:${this.sourcePort()}`;
    }
    return (this.secure() ? "https://" : "http://") + this.domain() + port + this.path();
  }
  setSize(size) {
    this.#size = size;
  }
  expiresDate(requestDate) {
    if (this.maxAge()) {
      return new Date(requestDate.getTime() + 1e3 * this.maxAge());
    }
    if (this.expires()) {
      return new Date(this.expires());
    }
    return null;
  }
  addAttribute(key, value) {
    if (!key) {
      return;
    }
    switch (key) {
      case "priority" /* PRIORITY */:
        this.#priority = value;
        break;
      default:
        this.#attributes.set(key, value);
    }
  }
  hasAttribute(key) {
    return this.#attributes.has(key);
  }
  getAttribute(key) {
    return this.#attributes.get(key);
  }
  setCookieLine(cookieLine) {
    this.#cookieLine = cookieLine;
  }
  getCookieLine() {
    return this.#cookieLine;
  }
  matchesSecurityOrigin(securityOrigin) {
    const hostname = new URL(securityOrigin).hostname;
    return Cookie.isDomainMatch(this.domain(), hostname);
  }
  static isDomainMatch(domain, hostname) {
    if (hostname === domain) {
      return true;
    }
    if (domain?.[0] !== ".") {
      return false;
    }
    if (domain.substr(1) === hostname) {
      return true;
    }
    return hostname.length > domain.length && hostname.endsWith(domain);
  }
}
export var Type = /* @__PURE__ */ ((Type2) => {
  Type2[Type2["REQUEST"] = 0] = "REQUEST";
  Type2[Type2["RESPONSE"] = 1] = "RESPONSE";
  return Type2;
})(Type || {});
export var Attribute = /* @__PURE__ */ ((Attribute2) => {
  Attribute2["NAME"] = "name";
  Attribute2["VALUE"] = "value";
  Attribute2["SIZE"] = "size";
  Attribute2["DOMAIN"] = "domain";
  Attribute2["PATH"] = "path";
  Attribute2["EXPIRES"] = "expires";
  Attribute2["MAX_AGE"] = "max-age";
  Attribute2["HTTP_ONLY"] = "http-only";
  Attribute2["SECURE"] = "secure";
  Attribute2["SAME_SITE"] = "same-site";
  Attribute2["SOURCE_SCHEME"] = "source-scheme";
  Attribute2["SOURCE_PORT"] = "source-port";
  Attribute2["PRIORITY"] = "priority";
  Attribute2["PARTITIONED"] = "partitioned";
  Attribute2["PARTITION_KEY"] = "partition-key";
  Attribute2["PARTITION_KEY_SITE"] = "partition-key-site";
  Attribute2["HAS_CROSS_SITE_ANCESTOR"] = "has-cross-site-ancestor";
  return Attribute2;
})(Attribute || {});
//# sourceMappingURL=Cookie.js.map
