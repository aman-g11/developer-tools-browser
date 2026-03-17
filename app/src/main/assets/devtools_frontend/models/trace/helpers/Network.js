"use strict";
import * as Protocol from "../../../generated/protocol.js";
const NON_RENDER_BLOCKING_VALUES = /* @__PURE__ */ new Set([
  "non_blocking",
  "dynamically_injected_non_blocking",
  "potentially_blocking"
]);
export function isSyntheticNetworkRequestEventRenderBlocking(event) {
  return !NON_RENDER_BLOCKING_VALUES.has(event.args.data.renderBlocking);
}
const HIGH_NETWORK_PRIORITIES = /* @__PURE__ */ new Set([
  Protocol.Network.ResourcePriority.VeryHigh,
  Protocol.Network.ResourcePriority.High,
  Protocol.Network.ResourcePriority.Medium
]);
export function isSyntheticNetworkRequestHighPriority(event) {
  return HIGH_NETWORK_PRIORITIES.has(event.args.data.priority);
}
export const CACHEABLE_STATUS_CODES = /* @__PURE__ */ new Set([200, 203, 206]);
export const STATIC_RESOURCE_TYPES = /* @__PURE__ */ new Set([
  Protocol.Network.ResourceType.Font,
  Protocol.Network.ResourceType.Image,
  Protocol.Network.ResourceType.Media,
  Protocol.Network.ResourceType.Script,
  Protocol.Network.ResourceType.Stylesheet
]);
export const NON_NETWORK_SCHEMES = [
  "blob",
  // @see https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
  "data",
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
  "intent",
  // @see https://developer.chrome.com/docs/multidevice/android/intents/
  "file",
  // @see https://en.wikipedia.org/wiki/File_URI_scheme
  "filesystem",
  // @see https://developer.mozilla.org/en-US/docs/Web/API/FileSystem
  "chrome-extension"
];
export function parseCacheControl(header) {
  if (!header) {
    return null;
  }
  const directives = header.split(",").map((directive) => directive.trim());
  const cacheControlOptions = {};
  for (const directive of directives) {
    const [key, value] = directive.split("=").map((part) => part.trim());
    switch (key) {
      case "max-age": {
        const maxAge = parseInt(value, 10);
        if (!isNaN(maxAge)) {
          cacheControlOptions["max-age"] = maxAge;
        }
        break;
      }
      case "no-cache":
        cacheControlOptions["no-cache"] = true;
        break;
      case "no-store":
        cacheControlOptions["no-store"] = true;
        break;
      case "must-revalidate":
        cacheControlOptions["must-revalidate"] = true;
        break;
      case "private":
        cacheControlOptions["private"] = true;
        break;
      default:
        break;
    }
  }
  return cacheControlOptions;
}
const SECURE_LOCALHOST_DOMAINS = ["localhost", "127.0.0.1"];
export function isSyntheticNetworkRequestLocalhost(event) {
  try {
    const hostname = new URL(event.args.data.url).hostname;
    return SECURE_LOCALHOST_DOMAINS.includes(hostname) || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}
//# sourceMappingURL=Network.js.map
