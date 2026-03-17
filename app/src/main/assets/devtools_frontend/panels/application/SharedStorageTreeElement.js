"use strict";
import { createIcon } from "../../ui/kit/kit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { ApplicationPanelTreeElement } from "./ApplicationPanelTreeElement.js";
import { SharedStorageItemsView } from "./SharedStorageItemsView.js";
export class SharedStorageTreeElement extends ApplicationPanelTreeElement {
  view;
  constructor(resourcesPanel, sharedStorage) {
    super(resourcesPanel, sharedStorage.securityOrigin, false, "shared-storage-instance");
  }
  static async createElement(resourcesPanel, sharedStorage) {
    const treeElement = new SharedStorageTreeElement(resourcesPanel, sharedStorage);
    treeElement.view = await SharedStorageItemsView.createView(sharedStorage);
    treeElement.view.element.setAttribute("jslog", `${VisualLogging.pane("shared-storage-data")}`);
    const sharedStorageIcon = createIcon("database");
    treeElement.setLeadingIcons([sharedStorageIcon]);
    return treeElement;
  }
  get itemURL() {
    return "shared-storage://";
  }
  onselect(selectedByUser) {
    super.onselect(selectedByUser);
    this.resourcesPanel.showView(this.view);
    return false;
  }
}
//# sourceMappingURL=SharedStorageTreeElement.js.map
