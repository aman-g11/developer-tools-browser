"use strict";
const DNS_RESOLUTION_RTT_MULTIPLIER = 2;
class DNSCache {
  static rttMultiplier = DNS_RESOLUTION_RTT_MULTIPLIER;
  rtt;
  resolvedDomainNames;
  constructor({ rtt }) {
    this.rtt = rtt;
    this.resolvedDomainNames = /* @__PURE__ */ new Map();
  }
  getTimeUntilResolution(request, options) {
    const { requestedAt = 0, shouldUpdateCache = false } = options || {};
    const domain = request.parsedURL.host;
    const cacheEntry = this.resolvedDomainNames.get(domain);
    let timeUntilResolved = this.rtt * DNSCache.rttMultiplier;
    if (cacheEntry) {
      const timeUntilCachedIsResolved = Math.max(cacheEntry.resolvedAt - requestedAt, 0);
      timeUntilResolved = Math.min(timeUntilCachedIsResolved, timeUntilResolved);
    }
    const resolvedAt = requestedAt + timeUntilResolved;
    if (shouldUpdateCache) {
      this.updateCacheResolvedAtIfNeeded(request, resolvedAt);
    }
    return timeUntilResolved;
  }
  updateCacheResolvedAtIfNeeded(request, resolvedAt) {
    const domain = request.parsedURL.host;
    const cacheEntry = this.resolvedDomainNames.get(domain) || { resolvedAt };
    cacheEntry.resolvedAt = Math.min(cacheEntry.resolvedAt, resolvedAt);
    this.resolvedDomainNames.set(domain, cacheEntry);
  }
  /**
   * Forcefully sets the DNS resolution time for a request.
   * Useful for testing and alternate execution simulations.
   */
  setResolvedAt(domain, resolvedAt) {
    this.resolvedDomainNames.set(domain, { resolvedAt });
  }
}
export { DNSCache };
//# sourceMappingURL=DNSCache.js.map
