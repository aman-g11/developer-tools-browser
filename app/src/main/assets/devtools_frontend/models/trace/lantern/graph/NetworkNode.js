"use strict";
import { BaseNode } from "./BaseNode.js";
const NON_NETWORK_SCHEMES = [
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
function isNonNetworkProtocol(protocol) {
  const urlScheme = protocol.includes(":") ? protocol.slice(0, protocol.indexOf(":")) : protocol;
  return NON_NETWORK_SCHEMES.includes(urlScheme);
}
class NetworkNode extends BaseNode {
  _request;
  constructor(networkRequest) {
    super(networkRequest.requestId);
    this._request = networkRequest;
  }
  get type() {
    return BaseNode.types.NETWORK;
  }
  get startTime() {
    return this._request.rendererStartTime * 1e3;
  }
  get endTime() {
    return this._request.networkEndTime * 1e3;
  }
  get rawRequest() {
    return this._request.rawRequest;
  }
  get request() {
    return this._request;
  }
  get initiatorType() {
    return this._request.initiator.type;
  }
  get fromDiskCache() {
    return Boolean(this._request.fromDiskCache);
  }
  get isNonNetworkProtocol() {
    return isNonNetworkProtocol(this.request.protocol) || // But `protocol` can fail to be populated if the request fails, so fallback to scheme.
    isNonNetworkProtocol(this.request.parsedURL.scheme);
  }
  /**
   * Returns whether this network request can be downloaded without a TCP connection.
   * During simulation we treat data coming in over a network connection separately from on-device data.
   */
  get isConnectionless() {
    return this.fromDiskCache || this.isNonNetworkProtocol;
  }
  hasRenderBlockingPriority() {
    const priority = this._request.priority;
    const isScript = this._request.resourceType === "Script";
    const isDocument = this._request.resourceType === "Document";
    const isBlockingScript = priority === "High" && isScript;
    const isBlockingHtmlImport = priority === "High" && isDocument;
    return priority === "VeryHigh" || isBlockingScript || isBlockingHtmlImport;
  }
  cloneWithoutRelationships() {
    const node = new NetworkNode(this._request);
    node.setIsMainDocument(this._isMainDocument);
    return node;
  }
}
export { NetworkNode };
//# sourceMappingURL=NetworkNode.js.map
