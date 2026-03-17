"use strict";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { SplitWidget } from "./SplitWidget.js";
import { VBox } from "./Widget.js";
export class Panel extends VBox {
  panelName;
  constructor(name, useShadowDom) {
    super({ useShadowDom });
    this.element.setAttribute("jslog", `${VisualLogging.panel().context(name).track({ resize: true })}`);
    this.element.classList.add("panel");
    this.element.setAttribute("aria-label", name);
    this.element.classList.add(name);
    this.panelName = name;
    self.UI = self.UI || {};
    self.UI.panels = self.UI.panels || {};
    UI.panels[name] = this;
  }
  get name() {
    return this.panelName;
  }
  searchableView() {
    return null;
  }
  elementsToRestoreScrollPositionsFor() {
    return [];
  }
}
export class PanelWithSidebar extends Panel {
  panelSplitWidget;
  mainWidget;
  sidebarWidget;
  constructor(name, defaultWidth) {
    super(name);
    this.panelSplitWidget = new SplitWidget(true, false, this.panelName + "-panel-split-view-state", defaultWidth || 200);
    this.panelSplitWidget.show(this.element);
    this.mainWidget = new VBox();
    this.panelSplitWidget.setMainWidget(this.mainWidget);
    this.sidebarWidget = new VBox();
    this.sidebarWidget.setMinimumSize(100, 25);
    this.panelSplitWidget.setSidebarWidget(this.sidebarWidget);
    this.sidebarWidget.element.classList.add("panel-sidebar");
    this.sidebarWidget.element.setAttribute("jslog", `${VisualLogging.pane("sidebar").track({ resize: true })}`);
  }
  panelSidebarElement() {
    return this.sidebarWidget.element;
  }
  mainElement() {
    return this.mainWidget.element;
  }
  splitWidget() {
    return this.panelSplitWidget;
  }
}
//# sourceMappingURL=Panel.js.map
