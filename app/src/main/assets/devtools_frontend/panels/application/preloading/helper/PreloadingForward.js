"use strict";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Protocol from "../../../../generated/protocol.js";
import * as Logs from "../../../../models/logs/logs.js";
export class RuleSetView {
  ruleSetId;
  constructor(ruleSetId) {
    this.ruleSetId = ruleSetId;
  }
}
export class AttemptViewWithFilter {
  ruleSetId;
  constructor(ruleSetId) {
    this.ruleSetId = ruleSetId;
  }
}
export function preloadStatusCode(attempt) {
  switch (attempt.action) {
    case Protocol.Preload.SpeculationAction.Prefetch:
      return prefetchStatusCode(attempt.requestId);
    case Protocol.Preload.SpeculationAction.Prerender:
    case Protocol.Preload.SpeculationAction.PrerenderUntilScript:
      return prerenderStatusCode(attempt.key.loaderId);
  }
  return void 0;
}
function prefetchStatusCode(requestId) {
  const networkLog = Logs.NetworkLog.NetworkLog.instance();
  const requests = networkLog.requestsForId(requestId);
  if (requests.length > 0) {
    return requests[requests.length - 1].statusCode;
  }
  return void 0;
}
function prerenderStatusCode(loaderId) {
  const frame = SDK.ResourceTreeModel.ResourceTreeModel.frames().find((f) => f.loaderId === loaderId);
  if (!frame) {
    return void 0;
  }
  const networkManager = frame.resourceTreeModel().target().model(SDK.NetworkManager.NetworkManager);
  const request = networkManager?.requestForLoaderId(loaderId);
  return request?.statusCode === 0 ? void 0 : request?.statusCode;
}
//# sourceMappingURL=PreloadingForward.js.map
