"use strict";
import * as Common from "../../core/common/common.js";
import { ResourceTreeModel } from "./ResourceTreeModel.js";
export class TraceObject {
  traceEvents;
  metadata;
  constructor(payload, meta) {
    if (Array.isArray(payload)) {
      this.traceEvents = payload;
      this.metadata = meta ?? {};
    } else {
      this.traceEvents = payload.traceEvents;
      this.metadata = payload.metadata;
    }
  }
}
export class RevealableEvent {
  // Only Trace.Types.Events.Event are passed in, but we can't depend on that type from SDK
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  constructor(event) {
    this.event = event;
  }
}
export class RevealableNetworkRequest {
  constructor(networkRequest) {
    this.networkRequest = networkRequest;
  }
  // Only Trace.Types.Events.SyntheticNetworkRequest are passed in, but we can't depend on that type from SDK
  static create(event) {
    const syntheticNetworkRequest = event;
    const url = syntheticNetworkRequest.args.data.url;
    const urlWithoutHash = Common.ParsedURL.ParsedURL.urlWithoutHash(url);
    const resource = ResourceTreeModel.resourceForURL(url) ?? ResourceTreeModel.resourceForURL(urlWithoutHash);
    const sdkNetworkRequest = resource?.request;
    return sdkNetworkRequest ? new RevealableNetworkRequest(sdkNetworkRequest) : null;
  }
}
//# sourceMappingURL=TraceObject.js.map
