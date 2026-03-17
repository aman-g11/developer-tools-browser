"use strict";
import * as SDK from "../../../../core/sdk/sdk.js";
export class GCActionDelegate {
  handleAction(_context, _actionId) {
    for (const heapProfilerModel of SDK.TargetManager.TargetManager.instance().models(
      SDK.HeapProfilerModel.HeapProfilerModel
    )) {
      void heapProfilerModel.collectGarbage();
    }
    return true;
  }
}
//# sourceMappingURL=GCActionDelegate.js.map
