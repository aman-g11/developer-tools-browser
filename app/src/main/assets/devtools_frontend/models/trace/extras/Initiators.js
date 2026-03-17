"use strict";
import { get as getStackTrace } from "./StackTraceForEvent.js";
export function getNetworkInitiator(data, event) {
  const networkHandlerInitiator = data.NetworkRequests.incompleteInitiator.get(event);
  if (networkHandlerInitiator?.args.data.mimeType === "text/css") {
    return networkHandlerInitiator;
  }
  const stack = getStackTrace(event.rawSourceEvent, data);
  const initiatorCallFrame = stack?.parent?.callFrames.at(0);
  if (!initiatorCallFrame) {
    return networkHandlerInitiator;
  }
  const matchingRequestIds = data.NetworkRequests.requestIdsByURL.get(initiatorCallFrame.url) ?? [];
  const matchingRequests = matchingRequestIds.map((id) => data.NetworkRequests.byId.get(id)).filter((req) => req !== void 0).filter((req) => req.ts < event.ts);
  return matchingRequests.at(-1);
}
//# sourceMappingURL=Initiators.js.map
