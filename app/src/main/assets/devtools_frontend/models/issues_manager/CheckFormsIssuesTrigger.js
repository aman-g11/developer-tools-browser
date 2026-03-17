"use strict";
import * as SDK from "../../core/sdk/sdk.js";
let checkFormsIssuesTriggerInstance = null;
export class CheckFormsIssuesTrigger {
  constructor() {
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ResourceTreeModel.ResourceTreeModel,
      SDK.ResourceTreeModel.Events.Load,
      this.#pageLoaded,
      this,
      { scoped: true }
    );
    for (const model of SDK.TargetManager.TargetManager.instance().models(SDK.ResourceTreeModel.ResourceTreeModel)) {
      if (model.target().outermostTarget() !== model.target()) {
        continue;
      }
      this.#checkFormsIssues(model);
    }
  }
  static instance({ forceNew } = { forceNew: false }) {
    if (!checkFormsIssuesTriggerInstance || forceNew) {
      checkFormsIssuesTriggerInstance = new CheckFormsIssuesTrigger();
    }
    return checkFormsIssuesTriggerInstance;
  }
  // TODO(crbug.com/1399414): Handle response by dropping current issues in favor of new ones.
  #checkFormsIssues(resourceTreeModel) {
    void resourceTreeModel.target().auditsAgent().invoke_checkFormsIssues();
  }
  #pageLoaded(event) {
    const { resourceTreeModel } = event.data;
    this.#checkFormsIssues(resourceTreeModel);
  }
}
//# sourceMappingURL=CheckFormsIssuesTrigger.js.map
