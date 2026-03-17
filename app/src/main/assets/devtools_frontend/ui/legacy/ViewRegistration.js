"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Root from "../../core/root/root.js";
const UIStrings = {
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Elements' panel.
   */
  elements: "Elements",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Drawer' panel.
   */
  drawer: "Drawer",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Drawer sidebar' panel.
   */
  drawer_sidebar: "Drawer sidebar",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Panel'.
   */
  panel: "Panel",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Network' panel.
   */
  network: "Network",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Settings' panel.
   */
  settings: "Settings",
  /**
   * @description Badge label for an entry in the Quick Open menu. Selecting the entry opens the 'Sources' panel.
   */
  sources: "Sources"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/ViewRegistration.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var ViewPersistence = /* @__PURE__ */ ((ViewPersistence2) => {
  ViewPersistence2["CLOSEABLE"] = "closeable";
  ViewPersistence2["PERMANENT"] = "permanent";
  ViewPersistence2["TRANSIENT"] = "transient";
  return ViewPersistence2;
})(ViewPersistence || {});
export var ViewLocationValues = /* @__PURE__ */ ((ViewLocationValues2) => {
  ViewLocationValues2["PANEL"] = "panel";
  ViewLocationValues2["SETTINGS_VIEW"] = "settings-view";
  ViewLocationValues2["ELEMENTS_SIDEBAR"] = "elements-sidebar";
  ViewLocationValues2["SOURCES_SIDEBAR_BOTTOM"] = "sources.sidebar-bottom";
  ViewLocationValues2["NAVIGATOR_VIEW"] = "navigator-view";
  ViewLocationValues2["DRAWER_VIEW"] = "drawer-view";
  ViewLocationValues2["DRAWER_SIDEBAR"] = "drawer-sidebar";
  ViewLocationValues2["NETWORK_SIDEBAR"] = "network-sidebar";
  ViewLocationValues2["SOURCES_SIDEBAR_TOP"] = "sources.sidebar-top";
  ViewLocationValues2["SOURCES_SIDEBAR_TABS"] = "sources.sidebar-tabs";
  return ViewLocationValues2;
})(ViewLocationValues || {});
const registeredViewExtensions = /* @__PURE__ */ new Map();
export function registerViewExtension(registration) {
  const viewId = registration.id;
  if (registeredViewExtensions.has(viewId)) {
    throw new Error(`Duplicate view id '${viewId}'`);
  }
  registeredViewExtensions.set(viewId, registration);
}
export function getRegisteredViewExtensions() {
  return registeredViewExtensions.values().filter(
    (view) => Root.Runtime.Runtime.isDescriptorEnabled({ experiment: view.experiment, condition: view.condition })
  ).toArray();
}
export function maybeRemoveViewExtension(viewId) {
  return registeredViewExtensions.delete(viewId);
}
const registeredLocationResolvers = [];
const viewLocationNameSet = /* @__PURE__ */ new Set();
export function registerLocationResolver(registration) {
  const locationName = registration.name;
  if (viewLocationNameSet.has(locationName)) {
    throw new Error(`Duplicate view location name registration '${locationName}'`);
  }
  viewLocationNameSet.add(locationName);
  registeredLocationResolvers.push(registration);
}
export function getRegisteredLocationResolvers() {
  return registeredLocationResolvers;
}
export function resetViewRegistration() {
  registeredViewExtensions.clear();
  registeredLocationResolvers.length = 0;
  viewLocationNameSet.clear();
}
export var ViewLocationCategory = /* @__PURE__ */ ((ViewLocationCategory2) => {
  ViewLocationCategory2["NONE"] = "";
  ViewLocationCategory2["ELEMENTS"] = "ELEMENTS";
  ViewLocationCategory2["DRAWER"] = "DRAWER";
  ViewLocationCategory2["DRAWER_SIDEBAR"] = "DRAWER_SIDEBAR";
  ViewLocationCategory2["PANEL"] = "PANEL";
  ViewLocationCategory2["NETWORK"] = "NETWORK";
  ViewLocationCategory2["SETTINGS"] = "SETTINGS";
  ViewLocationCategory2["SOURCES"] = "SOURCES";
  return ViewLocationCategory2;
})(ViewLocationCategory || {});
export function getLocalizedViewLocationCategory(category) {
  switch (category) {
    case "ELEMENTS" /* ELEMENTS */:
      return i18nString(UIStrings.elements);
    case "DRAWER" /* DRAWER */:
      return i18nString(UIStrings.drawer);
    case "DRAWER_SIDEBAR" /* DRAWER_SIDEBAR */:
      return i18nString(UIStrings.drawer_sidebar);
    case "PANEL" /* PANEL */:
      return i18nString(UIStrings.panel);
    case "NETWORK" /* NETWORK */:
      return i18nString(UIStrings.network);
    case "SETTINGS" /* SETTINGS */:
      return i18nString(UIStrings.settings);
    case "SOURCES" /* SOURCES */:
      return i18nString(UIStrings.sources);
    case "" /* NONE */:
      return i18n.i18n.lockedString("");
  }
}
//# sourceMappingURL=ViewRegistration.js.map
