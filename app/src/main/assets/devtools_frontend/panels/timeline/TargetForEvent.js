"use strict";
import * as SDK from "../../core/sdk/sdk.js";
export function targetForEvent(parsedTrace, event) {
  const targetManager = SDK.TargetManager.TargetManager.instance();
  const workerId = parsedTrace.data.Workers.workerIdByThread.get(event.tid);
  if (workerId) {
    return targetManager.targetById(workerId);
  }
  return targetManager.primaryPageTarget();
}
//# sourceMappingURL=TargetForEvent.js.map
