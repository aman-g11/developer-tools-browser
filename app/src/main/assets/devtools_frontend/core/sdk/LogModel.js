"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as Host from "../host/host.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
export class LogModel extends SDKModel {
  #logAgent;
  constructor(target) {
    super(target);
    target.registerLogDispatcher(this);
    this.#logAgent = target.logAgent();
    void this.#logAgent.invoke_enable();
    if (!Host.InspectorFrontendHost.isUnderTest()) {
      void this.#logAgent.invoke_startViolationsReport({
        config: [
          { name: Protocol.Log.ViolationSettingName.LongTask, threshold: 200 },
          { name: Protocol.Log.ViolationSettingName.LongLayout, threshold: 30 },
          { name: Protocol.Log.ViolationSettingName.BlockedEvent, threshold: 100 },
          { name: Protocol.Log.ViolationSettingName.BlockedParser, threshold: -1 },
          { name: Protocol.Log.ViolationSettingName.Handler, threshold: 150 },
          { name: Protocol.Log.ViolationSettingName.RecurringHandler, threshold: 50 },
          { name: Protocol.Log.ViolationSettingName.DiscouragedAPIUse, threshold: -1 }
        ]
      });
    }
  }
  entryAdded({ entry }) {
    this.dispatchEventToListeners("EntryAdded" /* ENTRY_ADDED */, { logModel: this, entry });
  }
  requestClear() {
    void this.#logAgent.invoke_clear();
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ENTRY_ADDED"] = "EntryAdded";
  return Events2;
})(Events || {});
SDKModel.register(LogModel, { capabilities: Capability.LOG, autostart: true });
//# sourceMappingURL=LogModel.js.map
