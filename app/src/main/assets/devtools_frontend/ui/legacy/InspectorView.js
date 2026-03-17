"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import { createIcon } from "../kit/kit.js";
import * as VisualLogging from "../visual_logging/visual_logging.js";
import { ActionRegistry } from "./ActionRegistry.js";
import * as ARIAUtils from "./ARIAUtils.js";
import { Dialog } from "./Dialog.js";
import { DockController, DockState, Events as DockControllerEvents } from "./DockController.js";
import { GlassPane } from "./GlassPane.js";
import { Infobar, Type as InfobarType } from "./Infobar.js";
import { KeyboardShortcut } from "./KeyboardShortcut.js";
import { ShowMode, SplitWidget } from "./SplitWidget.js";
import { Events as TabbedPaneEvents } from "./TabbedPane.js";
import { ToolbarButton } from "./Toolbar.js";
import { Tooltip } from "./Tooltip.js";
import { ViewManager } from "./ViewManager.js";
import { VBox, WidgetFocusRestorer } from "./Widget.js";
const UIStrings = {
  /**
   * @description Title of more tabs button in inspector view
   */
  moreTools: "More Tools",
  /**
   * @description Text that appears when hovor over the close button on the drawer view
   */
  closeDrawer: "Close drawer",
  /**
   * @description The ARIA label for the main tab bar that contains the DevTools panels
   */
  panels: "Panels",
  /**
   * @description Title of an action that reloads the tab currently being debugged by DevTools
   */
  reloadDebuggedTab: "Reload page",
  /**
   * @description Title of an action that reloads the DevTools
   */
  reloadDevtools: "Reload DevTools",
  /**
   * @description Title of an action that restarts Chrome
   */
  restartChrome: "Restart Chrome",
  /**
   * @description Confirmation dialog text for restarting Chrome
   */
  areYouSureYouWantToRestartChrome: "Are you sure you want to restart Chrome?",
  /**
   * @description Text for context menu action to move a tab to the main tab bar
   */
  moveToMainTabBar: "Move to main tab bar",
  /**
   * @description Text for context menu action to move a tab to the drawer
   */
  moveToDrawer: "Move to drawer",
  /**
   * @description Text shown in a prompt to the user when DevTools is started and the
   * currently selected DevTools locale does not match Chrome's locale.
   * The placeholder is the current Chrome language.
   * @example {German} PH1
   */
  devToolsLanguageMissmatch: "DevTools is now available in {PH1}",
  /**
   * @description An option the user can select when we notice that DevTools
   * is configured with a different locale than Chrome. This option means DevTools will
   * always try and display the DevTools UI in the same language as Chrome.
   */
  setToBrowserLanguage: "Always match Chrome's language",
  /**
   * @description An option the user can select when DevTools notices that DevTools
   * is configured with a different locale than Chrome. This option means DevTools UI
   * will be switched to the language specified in the placeholder.
   * @example {German} PH1
   */
  setToSpecificLanguage: "Switch DevTools to {PH1}",
  /**
   * @description The aria label for main toolbar
   */
  mainToolbar: "Main toolbar",
  /**
   * @description The aria label for the drawer.
   */
  drawer: "Tool drawer",
  /**
   * @description The aria label for the drawer shown.
   */
  drawerShown: "Drawer shown",
  /**
   * @description The aria label for the drawer hidden.
   */
  drawerHidden: "Drawer hidden",
  /**
   * @description Request for the user to select a local file system folder for DevTools
   * to store local overrides in.
   */
  selectOverrideFolder: "Select a folder to store override files in",
  /**
   * @description Label for a button which opens a file picker.
   */
  selectFolder: "Select folder",
  /**
   * @description Text that appears when hover the toggle orientation button
   */
  toggleDrawerOrientation: "Toggle drawer orientation"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/InspectorView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let inspectorViewInstance = null;
const MIN_MAIN_PANEL_WIDTH = 240;
const MIN_VERTICAL_DRAWER_WIDTH = 200;
const MIN_INSPECTOR_WIDTH_HORIZONTAL_DRAWER = 250;
const MIN_INSPECTOR_WIDTH_VERTICAL_DRAWER = 450;
const MIN_INSPECTOR_HEIGHT = 72;
export var DrawerOrientation = /* @__PURE__ */ ((DrawerOrientation2) => {
  DrawerOrientation2["VERTICAL"] = "vertical";
  DrawerOrientation2["HORIZONTAL"] = "horizontal";
  DrawerOrientation2["UNSET"] = "unset";
  return DrawerOrientation2;
})(DrawerOrientation || {});
export var DockMode = /* @__PURE__ */ ((DockMode2) => {
  DockMode2["BOTTOM"] = "bottom";
  DockMode2["SIDE"] = "side";
  DockMode2["UNDOCKED"] = "undocked";
  return DockMode2;
})(DockMode || {});
export class InspectorView extends VBox {
  drawerOrientationByDockSetting;
  drawerSplitWidget;
  tabDelegate;
  drawerTabbedLocation;
  drawerTabbedPane;
  infoBarDiv;
  tabbedLocation;
  tabbedPane;
  keyDownBound;
  currentPanelLocked;
  focusRestorer;
  ownerSplitWidget;
  reloadRequiredInfobar;
  #chromeRestartRequiredInfobar;
  #debuggedTabReloadRequiredInfobar;
  #selectOverrideFolderInfobar;
  #resizeObserver;
  #toggleOrientationButton;
  constructor() {
    super();
    GlassPane.setContainer(this.element);
    this.setMinimumSize(MIN_INSPECTOR_WIDTH_HORIZONTAL_DRAWER, MIN_INSPECTOR_HEIGHT);
    this.drawerOrientationByDockSetting = Common.Settings.Settings.instance().createSetting("inspector.drawer-orientation-by-dock-mode", {
      ["bottom" /* BOTTOM */]: "unset" /* UNSET */,
      ["side" /* SIDE */]: "unset" /* UNSET */,
      ["undocked" /* UNDOCKED */]: "unset" /* UNSET */
    });
    const initialOrientation = this.#getOrientationForDockMode();
    const isVertical = initialOrientation === "vertical" /* VERTICAL */;
    this.drawerSplitWidget = new SplitWidget(isVertical, true, "inspector.drawer-split-view-state", 200, 200);
    this.drawerSplitWidget.hideSidebar();
    this.drawerSplitWidget.enableShowModeSaving();
    this.drawerSplitWidget.show(this.element);
    this.tabDelegate = new InspectorViewTabDelegate();
    this.drawerTabbedLocation = ViewManager.instance().createTabbedLocation(
      this.showDrawer.bind(this, {
        focus: false,
        hasTargetDrawer: true
      }),
      "drawer-view",
      true,
      true
    );
    const moreTabsButton = this.drawerTabbedLocation.enableMoreTabsButton();
    moreTabsButton.setTitle(i18nString(UIStrings.moreTools));
    this.drawerTabbedPane = this.drawerTabbedLocation.tabbedPane();
    this.setDrawerRelatedMinimumSizes();
    this.drawerTabbedPane.element.classList.add("drawer-tabbed-pane");
    this.drawerTabbedPane.element.setAttribute("jslog", `${VisualLogging.drawer()}`);
    const closeDrawerButton = new ToolbarButton(i18nString(UIStrings.closeDrawer), "cross");
    closeDrawerButton.element.setAttribute("jslog", `${VisualLogging.close().track({ click: true })}`);
    closeDrawerButton.addEventListener(ToolbarButton.Events.CLICK, this.closeDrawer, this);
    this.#toggleOrientationButton = new ToolbarButton(
      i18nString(UIStrings.toggleDrawerOrientation),
      this.drawerSplitWidget.isVertical() ? "dock-bottom" : "dock-right"
    );
    this.#toggleOrientationButton.element.setAttribute(
      "jslog",
      `${VisualLogging.toggle("toggle-drawer-orientation").track({ click: true })}`
    );
    this.#toggleOrientationButton.addEventListener(
      ToolbarButton.Events.CLICK,
      () => this.toggleDrawerOrientation(),
      this
    );
    this.drawerTabbedPane.addEventListener(
      TabbedPaneEvents.TabSelected,
      (event) => this.tabSelected(event.data.tabId),
      this
    );
    const selectedDrawerTab = this.drawerTabbedPane.selectedTabId;
    if (this.drawerSplitWidget.showMode() !== ShowMode.ONLY_MAIN && selectedDrawerTab) {
      Host.userMetrics.panelShown(selectedDrawerTab, true);
    }
    this.drawerTabbedPane.setTabDelegate(this.tabDelegate);
    const drawerElement = this.drawerTabbedPane.element;
    ARIAUtils.markAsComplementary(drawerElement);
    ARIAUtils.setLabel(drawerElement, i18nString(UIStrings.drawer));
    this.drawerSplitWidget.installResizer(this.drawerTabbedPane.headerElement());
    this.drawerSplitWidget.setSidebarWidget(this.drawerTabbedPane);
    if (Root.Runtime.hostConfig.devToolsFlexibleLayout?.verticalDrawerEnabled) {
      this.drawerTabbedPane.rightToolbar().appendToolbarItem(this.#toggleOrientationButton);
    }
    this.drawerTabbedPane.rightToolbar().appendToolbarItem(closeDrawerButton);
    this.drawerTabbedPane.headerElement().setAttribute("jslog", `${VisualLogging.toolbar("drawer").track({
      drag: true,
      keydown: "ArrowUp|ArrowLeft|ArrowDown|ArrowRight|Enter|Space"
    })}`);
    this.tabbedLocation = ViewManager.instance().createTabbedLocation(
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront.bind(
        Host.InspectorFrontendHost.InspectorFrontendHostInstance
      ),
      "panel",
      true,
      true,
      Root.Runtime.Runtime.queryParam("panel")
    );
    this.tabbedPane = this.tabbedLocation.tabbedPane();
    this.tabbedPane.setMinimumSize(MIN_MAIN_PANEL_WIDTH, 0);
    this.tabbedPane.element.classList.add("main-tabbed-pane");
    const allocatedSpace = Root.Runtime.conditions.canDock() ? "69px" : "41px";
    this.tabbedPane.leftToolbar().style.minWidth = allocatedSpace;
    this.tabbedPane.addEventListener(
      TabbedPaneEvents.TabSelected,
      (event) => this.tabSelected(event.data.tabId),
      this
    );
    const selectedTab = this.tabbedPane.selectedTabId;
    if (selectedTab) {
      Host.userMetrics.panelShown(selectedTab, true);
    }
    this.tabbedPane.setAccessibleName(i18nString(UIStrings.panels));
    this.tabbedPane.setTabDelegate(this.tabDelegate);
    const mainHeaderElement = this.tabbedPane.headerElement();
    ARIAUtils.markAsNavigation(mainHeaderElement);
    ARIAUtils.setLabel(mainHeaderElement, i18nString(UIStrings.mainToolbar));
    mainHeaderElement.setAttribute("jslog", `${VisualLogging.toolbar("main").track({
      drag: true,
      keydown: "ArrowUp|ArrowLeft|ArrowDown|ArrowRight|Enter|Space"
    })}`);
    Host.userMetrics.setLaunchPanel(this.tabbedPane.selectedTabId);
    if (Host.InspectorFrontendHost.isUnderTest()) {
      this.tabbedPane.setAutoSelectFirstItemOnShow(false);
    }
    this.drawerSplitWidget.setMainWidget(this.tabbedPane);
    this.drawerSplitWidget.setDefaultFocusedChild(this.tabbedPane);
    this.keyDownBound = this.keyDown.bind(this);
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(
      Host.InspectorFrontendHostAPI.Events.ShowPanel,
      showPanel.bind(this)
    );
    function showPanel({ data: panelName }) {
      void this.showPanel(panelName);
    }
    if (shouldShowLocaleInfobar()) {
      const infobar = createLocaleInfobar();
      infobar.setParentView(this);
      this.attachInfobar(infobar);
    }
    this.#resizeObserver = new ResizeObserver(this.#observedResize.bind(this));
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!inspectorViewInstance || forceNew) {
      inspectorViewInstance = new InspectorView();
    }
    return inspectorViewInstance;
  }
  static maybeGetInspectorViewInstance() {
    return inspectorViewInstance;
  }
  static removeInstance() {
    inspectorViewInstance = null;
  }
  applyDrawerOrientationForDockSideForTest() {
  }
  #applyDrawerOrientationForDockSide() {
    if (!this.drawerVisible()) {
      this.applyDrawerOrientationForDockSideForTest();
      return;
    }
    const newOrientation = this.#getOrientationForDockMode();
    this.#applyDrawerOrientation(newOrientation);
    this.applyDrawerOrientationForDockSideForTest();
  }
  #getDockMode() {
    const dockSide = DockController.instance().dockSide();
    if (dockSide === DockState.BOTTOM) {
      return "bottom" /* BOTTOM */;
    }
    if (dockSide === DockState.UNDOCKED) {
      return "undocked" /* UNDOCKED */;
    }
    return "side" /* SIDE */;
  }
  #getOrientationForDockMode() {
    const dockMode = this.#getDockMode();
    const orientationSetting = this.drawerOrientationByDockSetting.get();
    let orientation = orientationSetting[dockMode];
    if (orientation === "unset" /* UNSET */) {
      orientation = dockMode === "bottom" /* BOTTOM */ ? "vertical" /* VERTICAL */ : "horizontal" /* HORIZONTAL */;
    }
    return orientation;
  }
  #applyDrawerOrientation(orientation) {
    const shouldBeVertical = orientation === "vertical" /* VERTICAL */;
    const isVertical = this.drawerSplitWidget.isVertical();
    if (shouldBeVertical === isVertical) {
      return;
    }
    this.#toggleOrientationButton.setGlyph(shouldBeVertical ? "dock-bottom" : "dock-right");
    this.drawerSplitWidget.setVertical(shouldBeVertical);
    this.setDrawerRelatedMinimumSizes();
  }
  #observedResize() {
    const rect = this.element.getBoundingClientRect();
    this.element.style.setProperty("--devtools-window-left", `${rect.left}px`);
    this.element.style.setProperty("--devtools-window-right", `${window.innerWidth - rect.right}px`);
    this.element.style.setProperty("--devtools-window-width", `${rect.width}px`);
    this.element.style.setProperty("--devtools-window-top", `${rect.top}px`);
    this.element.style.setProperty("--devtools-window-bottom", `${window.innerHeight - rect.bottom}px`);
    this.element.style.setProperty("--devtools-window-height", `${rect.height}px`);
  }
  wasShown() {
    super.wasShown();
    this.#resizeObserver.observe(this.element);
    this.#observedResize();
    this.element.ownerDocument.addEventListener("keydown", this.keyDownBound, false);
    DockController.instance().addEventListener(
      DockControllerEvents.DOCK_SIDE_CHANGED,
      this.#applyDrawerOrientationForDockSide,
      this
    );
    this.#applyDrawerOrientationForDockSide();
  }
  willHide() {
    super.willHide();
    this.#resizeObserver.unobserve(this.element);
    this.element.ownerDocument.removeEventListener("keydown", this.keyDownBound, false);
    DockController.instance().removeEventListener(
      DockControllerEvents.DOCK_SIDE_CHANGED,
      this.#applyDrawerOrientationForDockSide,
      this
    );
  }
  resolveLocation(locationName) {
    if (locationName === "drawer-view") {
      return this.drawerTabbedLocation;
    }
    if (locationName === "panel") {
      return this.tabbedLocation;
    }
    return null;
  }
  async createToolbars() {
    await this.tabbedPane.leftToolbar().appendItemsAtLocation("main-toolbar-left");
    await this.tabbedPane.rightToolbar().appendItemsAtLocation("main-toolbar-right");
  }
  addPanel(view) {
    this.tabbedLocation.appendView(view);
  }
  hasPanel(panelName) {
    return this.tabbedPane.hasTab(panelName);
  }
  async panel(panelName) {
    const view = ViewManager.instance().view(panelName);
    if (!view) {
      throw new Error(`Expected view for panel '${panelName}'`);
    }
    return await view.widget();
  }
  onSuspendStateChanged(allTargetsSuspended) {
    this.currentPanelLocked = allTargetsSuspended;
    this.tabbedPane.setCurrentTabLocked(this.currentPanelLocked);
    this.tabbedPane.leftToolbar().setEnabled(!this.currentPanelLocked);
    this.tabbedPane.rightToolbar().setEnabled(!this.currentPanelLocked);
  }
  canSelectPanel(panelName) {
    return !this.currentPanelLocked || this.tabbedPane.selectedTabId === panelName;
  }
  async showPanel(panelName) {
    await ViewManager.instance().showView(panelName);
  }
  setPanelWarnings(tabId, warnings) {
    const tabbedPane = this.getTabbedPaneForTabId(tabId);
    if (tabbedPane) {
      let icon = null;
      if (warnings.length !== 0) {
        const warning = warnings.length === 1 ? warnings[0] : "\xB7 " + warnings.join("\n\xB7 ");
        icon = createIcon("warning-filled", "small");
        icon.classList.add("warning");
        Tooltip.install(icon, warning);
      }
      tabbedPane.setTrailingTabIcon(tabId, icon);
    }
  }
  getTabbedPaneForTabId(tabId) {
    if (this.tabbedPane.hasTab(tabId)) {
      return this.tabbedPane;
    }
    if (this.drawerTabbedPane.hasTab(tabId)) {
      return this.drawerTabbedPane;
    }
    return null;
  }
  currentPanelDeprecated() {
    return ViewManager.instance().materializedWidget(this.tabbedPane.selectedTabId || "");
  }
  showDrawer({ focus, hasTargetDrawer }) {
    if (this.drawerTabbedPane.isShowing()) {
      return;
    }
    this.drawerTabbedPane.setAutoSelectFirstItemOnShow(!hasTargetDrawer);
    this.drawerSplitWidget.showBoth();
    if (focus) {
      this.focusRestorer = new WidgetFocusRestorer(this.drawerTabbedPane);
    } else {
      this.focusRestorer = null;
    }
    this.#applyDrawerOrientationForDockSide();
    ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.drawerShown));
  }
  drawerVisible() {
    return this.drawerTabbedPane.isShowing();
  }
  closeDrawer() {
    if (!this.drawerTabbedPane.isShowing()) {
      return;
    }
    if (this.focusRestorer) {
      this.focusRestorer.restore();
    }
    this.drawerSplitWidget.hideSidebar(true);
    ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.drawerHidden));
  }
  toggleDrawerOrientation({ force } = {}) {
    if (!this.drawerTabbedPane.isShowing()) {
      return;
    }
    const dockMode = this.#getDockMode();
    const currentSettings = this.drawerOrientationByDockSetting.get();
    let newOrientation;
    if (force) {
      newOrientation = force;
    } else {
      const currentOrientation = this.#getOrientationForDockMode();
      newOrientation = currentOrientation === "vertical" /* VERTICAL */ ? "horizontal" /* HORIZONTAL */ : "vertical" /* VERTICAL */;
    }
    currentSettings[dockMode] = newOrientation;
    this.drawerOrientationByDockSetting.set(currentSettings);
    this.#applyDrawerOrientation(newOrientation);
  }
  isUserExplicitlyUpdatedDrawerOrientation() {
    const orientationSetting = this.drawerOrientationByDockSetting.get();
    const dockMode = this.#getDockMode();
    return orientationSetting[dockMode] !== "unset" /* UNSET */;
  }
  setDrawerRelatedMinimumSizes() {
    const drawerIsVertical = this.drawerSplitWidget.isVertical();
    if (drawerIsVertical) {
      this.drawerTabbedPane.setMinimumSize(MIN_VERTICAL_DRAWER_WIDTH, 27);
      this.setMinimumSize(MIN_INSPECTOR_WIDTH_VERTICAL_DRAWER, MIN_INSPECTOR_HEIGHT);
    } else {
      this.drawerTabbedPane.setMinimumSize(0, 27);
      this.setMinimumSize(MIN_INSPECTOR_WIDTH_HORIZONTAL_DRAWER, MIN_INSPECTOR_HEIGHT);
    }
  }
  setDrawerMinimized(minimized) {
    this.drawerSplitWidget.setSidebarMinimized(minimized);
    this.drawerSplitWidget.setResizable(!minimized);
  }
  drawerSize() {
    return this.drawerSplitWidget.sidebarSize();
  }
  setDrawerSize(size) {
    this.drawerSplitWidget.setSidebarSize(size);
  }
  totalSize() {
    return this.drawerSplitWidget.totalSize();
  }
  isDrawerMinimized() {
    return this.drawerSplitWidget.isSidebarMinimized();
  }
  isDrawerOrientationVertical() {
    return this.drawerSplitWidget.isVertical();
  }
  keyDown(event) {
    if (!KeyboardShortcut.eventHasCtrlEquivalentKey(event) || event.altKey || event.shiftKey) {
      return;
    }
    const panelShortcutEnabled = Common.Settings.moduleSetting("shortcut-panel-switch").get();
    if (panelShortcutEnabled) {
      let panelIndex = -1;
      if (event.keyCode > 48 && event.keyCode < 58) {
        panelIndex = event.keyCode - 49;
      } else if (event.keyCode > 96 && event.keyCode < 106 && event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD) {
        panelIndex = event.keyCode - 97;
      }
      if (panelIndex !== -1) {
        const panelName = this.tabbedPane.tabIds()[panelIndex];
        if (panelName) {
          if (!Dialog.hasInstance() && !this.currentPanelLocked) {
            void this.showPanel(panelName);
            void VisualLogging.logKeyDown(null, event, `panel-by-index-${panelName}`);
          }
          event.consume(true);
        }
      }
    }
  }
  onResize() {
    GlassPane.containerMoved(this.element);
  }
  topResizerElement() {
    return this.tabbedPane.headerElement();
  }
  toolbarItemResized() {
    this.tabbedPane.headerResized();
  }
  tabSelected(tabId) {
    Host.userMetrics.panelShown(tabId);
  }
  setOwnerSplit(splitWidget) {
    this.ownerSplitWidget = splitWidget;
  }
  ownerSplit() {
    return this.ownerSplitWidget || null;
  }
  minimize() {
    if (this.ownerSplitWidget) {
      this.ownerSplitWidget.setSidebarMinimized(true);
    }
  }
  restore() {
    if (this.ownerSplitWidget) {
      this.ownerSplitWidget.setSidebarMinimized(false);
    }
  }
  displayDebuggedTabReloadRequiredWarning(message) {
    if (!this.#debuggedTabReloadRequiredInfobar) {
      const infobar = new Infobar(
        InfobarType.INFO,
        message,
        [
          {
            text: i18nString(UIStrings.reloadDebuggedTab),
            delegate: () => {
              reloadDebuggedTab();
              this.removeDebuggedTabReloadRequiredWarning();
            },
            dismiss: false,
            buttonVariant: Buttons.Button.Variant.PRIMARY,
            jslogContext: "main.debug-reload"
          }
        ],
        void 0,
        "reload-required"
      );
      infobar.setParentView(this);
      this.attachInfobar(infobar);
      this.#debuggedTabReloadRequiredInfobar = infobar;
      infobar.setCloseCallback(() => {
        this.#debuggedTabReloadRequiredInfobar = void 0;
      });
      SDK.TargetManager.TargetManager.instance().addModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel,
        SDK.ResourceTreeModel.Events.PrimaryPageChanged,
        this.removeDebuggedTabReloadRequiredWarning,
        this
      );
    }
  }
  removeDebuggedTabReloadRequiredWarning() {
    if (this.#debuggedTabReloadRequiredInfobar) {
      this.#debuggedTabReloadRequiredInfobar.dispose();
      SDK.TargetManager.TargetManager.instance().removeModelListener(
        SDK.ResourceTreeModel.ResourceTreeModel,
        SDK.ResourceTreeModel.Events.PrimaryPageChanged,
        this.removeDebuggedTabReloadRequiredWarning,
        this
      );
    }
  }
  displayReloadRequiredWarning(message) {
    if (!this.reloadRequiredInfobar && !this.#chromeRestartRequiredInfobar) {
      const infobar = new Infobar(
        InfobarType.INFO,
        message,
        [
          {
            text: i18nString(UIStrings.reloadDevtools),
            delegate: () => reloadDevTools(),
            dismiss: false,
            buttonVariant: Buttons.Button.Variant.PRIMARY,
            jslogContext: "main.debug-reload"
          }
        ],
        void 0,
        "reload-required"
      );
      infobar.setParentView(this);
      this.attachInfobar(infobar);
      this.reloadRequiredInfobar = infobar;
      infobar.setCloseCallback(() => {
        this.reloadRequiredInfobar = void 0;
      });
    }
  }
  displayChromeRestartRequiredWarning(message) {
    if (this.reloadRequiredInfobar) {
      this.reloadRequiredInfobar.dispose();
    }
    if (!this.#chromeRestartRequiredInfobar) {
      const infobar = new Infobar(
        InfobarType.INFO,
        message,
        [
          {
            text: i18nString(UIStrings.restartChrome),
            delegate: () => {
              if (confirm(i18nString(UIStrings.areYouSureYouWantToRestartChrome))) {
                Host.InspectorFrontendHost.InspectorFrontendHostInstance.requestRestart();
              }
            },
            dismiss: false,
            buttonVariant: Buttons.Button.Variant.PRIMARY,
            jslogContext: "main.chrome-restart-chrome"
          }
        ],
        void 0,
        "reload-required"
      );
      infobar.setParentView(this);
      this.attachInfobar(infobar);
      this.#chromeRestartRequiredInfobar = infobar;
      infobar.setCloseCallback(() => {
        this.#chromeRestartRequiredInfobar = void 0;
      });
    }
  }
  displaySelectOverrideFolderInfobar(callback) {
    if (!this.#selectOverrideFolderInfobar) {
      const infobar = new Infobar(
        InfobarType.INFO,
        i18nString(UIStrings.selectOverrideFolder),
        [
          {
            text: i18nString(UIStrings.selectFolder),
            delegate: () => callback(),
            dismiss: true,
            buttonVariant: Buttons.Button.Variant.TONAL,
            jslogContext: "select-folder"
          }
        ],
        void 0,
        "select-override-folder"
      );
      infobar.setParentView(this);
      this.attachInfobar(infobar);
      this.#selectOverrideFolderInfobar = infobar;
      infobar.setCloseCallback(() => {
        this.#selectOverrideFolderInfobar = void 0;
      });
    }
  }
  createInfoBarDiv() {
    if (!this.infoBarDiv) {
      this.infoBarDiv = document.createElement("div");
      this.infoBarDiv.classList.add("flex-none");
      this.contentElement.insertBefore(this.infoBarDiv, this.contentElement.firstChild);
    }
  }
  attachInfobar(infobar) {
    this.createInfoBarDiv();
    this.infoBarDiv?.appendChild(infobar.element);
  }
}
function getDisableLocaleInfoBarSetting() {
  return Common.Settings.Settings.instance().createSetting("disable-locale-info-bar", false);
}
function shouldShowLocaleInfobar() {
  if (getDisableLocaleInfoBarSetting().get()) {
    return false;
  }
  const languageSettingValue = Common.Settings.Settings.instance().moduleSetting("language").get();
  if (languageSettingValue !== "en-US") {
    return false;
  }
  return !i18n.DevToolsLocale.localeLanguagesMatch(navigator.language, languageSettingValue) && i18n.DevToolsLocale.DevToolsLocale.instance().languageIsSupportedByDevTools(navigator.language);
}
function createLocaleInfobar() {
  const devtoolsLocale = i18n.DevToolsLocale.DevToolsLocale.instance();
  const closestSupportedLocale = devtoolsLocale.lookupClosestDevToolsLocale(navigator.language);
  const locale = new Intl.Locale(closestSupportedLocale);
  const closestSupportedLanguageInCurrentLocale = new Intl.DisplayNames([devtoolsLocale.locale], { type: "language" }).of(locale.language || "en") || "English";
  const languageSetting = Common.Settings.Settings.instance().moduleSetting("language");
  return new Infobar(
    InfobarType.INFO,
    i18nString(UIStrings.devToolsLanguageMissmatch, { PH1: closestSupportedLanguageInCurrentLocale }),
    [
      {
        text: i18nString(UIStrings.setToBrowserLanguage),
        delegate: () => {
          languageSetting.set("browserLanguage");
          getDisableLocaleInfoBarSetting().set(true);
          reloadDevTools();
        },
        dismiss: true,
        jslogContext: "set-to-browser-language"
      },
      {
        text: i18nString(UIStrings.setToSpecificLanguage, { PH1: closestSupportedLanguageInCurrentLocale }),
        delegate: () => {
          languageSetting.set(closestSupportedLocale);
          getDisableLocaleInfoBarSetting().set(true);
          reloadDevTools();
        },
        dismiss: true,
        jslogContext: "set-to-specific-language"
      }
    ],
    getDisableLocaleInfoBarSetting(),
    "language-mismatch"
  );
}
function reloadDevTools() {
  if (DockController.instance().canDock() && DockController.instance().dockSide() === DockState.UNDOCKED) {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.setIsDocked(true, function() {
    });
  }
  Host.InspectorFrontendHost.InspectorFrontendHostInstance.reattach(() => window.location.reload());
}
function reloadDebuggedTab() {
  void ActionRegistry.instance().getAction("inspector-main.reload").execute();
}
export class ActionDelegate {
  handleAction(_context, actionId) {
    switch (actionId) {
      case "main.toggle-drawer":
        if (InspectorView.instance().drawerVisible()) {
          InspectorView.instance().closeDrawer();
        } else {
          InspectorView.instance().showDrawer({
            focus: true,
            hasTargetDrawer: false
          });
        }
        return true;
      case "main.toggle-drawer-orientation":
        InspectorView.instance().toggleDrawerOrientation();
        return true;
      case "main.next-tab":
        InspectorView.instance().tabbedPane.selectNextTab();
        InspectorView.instance().tabbedPane.focus();
        return true;
      case "main.previous-tab":
        InspectorView.instance().tabbedPane.selectPrevTab();
        InspectorView.instance().tabbedPane.focus();
        return true;
    }
    return false;
  }
}
export class InspectorViewTabDelegate {
  closeTabs(tabbedPane, ids) {
    tabbedPane.closeTabs(ids, true);
  }
  moveToDrawer(tabId) {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.TabMovedToDrawer);
    ViewManager.instance().moveView(tabId, "drawer-view");
  }
  moveToMainTabBar(tabId) {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.TabMovedToMainPanel);
    ViewManager.instance().moveView(tabId, "panel");
  }
  onContextMenu(tabId, contextMenu) {
    if (tabId === "console" || tabId === "console-view") {
      return;
    }
    const locationName = ViewManager.instance().locationNameForViewId(tabId);
    if (locationName === "drawer-view") {
      contextMenu.defaultSection().appendItem(
        i18nString(UIStrings.moveToMainTabBar),
        this.moveToMainTabBar.bind(this, tabId),
        { jslogContext: "move-to-top" }
      );
    } else {
      contextMenu.defaultSection().appendItem(
        i18nString(UIStrings.moveToDrawer),
        this.moveToDrawer.bind(this, tabId),
        { jslogContext: "move-to-bottom" }
      );
    }
  }
}
//# sourceMappingURL=InspectorView.js.map
