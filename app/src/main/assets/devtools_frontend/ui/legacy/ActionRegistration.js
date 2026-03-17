"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import { Context } from "./Context.js";
const UIStrings = {
  /**
   * @description Title of the keybind category 'Elements' in Settings' Shortcuts pannel.
   */
  elements: "Elements",
  /**
   * @description Title of the keybind category 'Screenshot' in Settings' Shortcuts pannel.
   */
  screenshot: "Screenshot",
  /**
   * @description Title of the keybind category 'Network' in Settings' Shortcuts pannel.
   */
  network: "Network",
  /**
   * @description Title of the keybind category 'Memory' in Settings' Shortcuts pannel.
   */
  memory: "Memory",
  /**
   * @description Title of the keybind category 'JavaScript Profiler' in Settings' Shortcuts pannel.
   */
  javascript_profiler: "JavaScript Profiler",
  /**
   * @description Title of the keybind category 'Console' in Settings' Shortcuts pannel.
   */
  console: "Console",
  /**
   * @description Title of the keybind category 'Performance' in Settings' Shortcuts pannel.
   */
  performance: "Performance",
  /**
   * @description Title of the keybind category 'Mobile' in Settings' Shortcuts pannel.
   */
  mobile: "Mobile",
  /**
   * @description Title of the keybind category 'Help' in Settings' Shortcuts pannel.
   */
  help: "Help",
  /**
   * @description Title of the keybind category 'Layers' in Settings' Shortcuts pannel.
   */
  layers: "Layers",
  /**
   * @description Title of the keybind category 'Navigation' in Settings' Shortcuts pannel.
   */
  navigation: "Navigation",
  /**
   * @description Title of the keybind category 'Drawer' in Settings' Shortcuts pannel.
   */
  drawer: "Drawer",
  /**
   * @description Title of the keybind category 'Global' in Settings' Shortcuts pannel.
   */
  global: "Global",
  /**
   * @description Title of the keybind category 'Resources' in Settings' Shortcuts pannel.
   */
  resources: "Resources",
  /**
   * @description Title of the keybind category 'Background Services' in Settings' Shortcuts pannel.
   */
  background_services: "Background Services",
  /**
   * @description Title of the keybind category 'Settings' in Settings' Shortcuts pannel.
   */
  settings: "Settings",
  /**
   * @description Title of the keybind category 'Debugger' in Settings' Shortcuts pannel.
   */
  debugger: "Debugger",
  /**
   * @description Title of the keybind category 'Sources' in Settings' Shortcuts pannel.
   */
  sources: "Sources",
  /**
   * @description Title of the keybind category 'Rendering' in Settings' Shortcuts pannel.
   */
  rendering: "Rendering",
  /**
   * @description Title of the keybind category 'Recorder' in Settings' Shortcuts pannel.
   */
  recorder: "Recorder",
  /**
   * @description Title of the keybind category 'Changes' in Settings' Shortcuts pannel.
   */
  changes: "Changes"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/ActionRegistration.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class Action extends Common.ObjectWrapper.ObjectWrapper {
  #enabled = true;
  #toggled = false;
  actionRegistration;
  constructor(actionRegistration) {
    super();
    this.actionRegistration = actionRegistration;
  }
  id() {
    return this.actionRegistration.actionId;
  }
  async execute(opts) {
    if (!this.actionRegistration.loadActionDelegate) {
      return false;
    }
    const delegate = await this.actionRegistration.loadActionDelegate();
    const actionId = this.id();
    return delegate.handleAction(Context.instance(), actionId, opts);
  }
  icon() {
    return this.actionRegistration.iconClass;
  }
  toggledIcon() {
    return this.actionRegistration.toggledIconClass;
  }
  toggleWithRedColor() {
    return Boolean(this.actionRegistration.toggleWithRedColor);
  }
  setEnabled(enabled) {
    if (this.#enabled === enabled) {
      return;
    }
    this.#enabled = enabled;
    this.dispatchEventToListeners("Enabled" /* ENABLED */, enabled);
  }
  enabled() {
    return this.#enabled;
  }
  category() {
    return this.actionRegistration.category;
  }
  tags() {
    if (this.actionRegistration.tags) {
      return this.actionRegistration.tags.map((tag) => tag()).join("\0");
    }
  }
  toggleable() {
    return Boolean(this.actionRegistration.toggleable);
  }
  title() {
    let title = this.actionRegistration.title ? this.actionRegistration.title() : i18n.i18n.lockedString("");
    const options = this.actionRegistration.options;
    if (options) {
      for (const pair of options) {
        if (pair.value !== this.#toggled) {
          title = pair.title();
        }
      }
    }
    return title;
  }
  toggled() {
    return this.#toggled;
  }
  setToggled(toggled) {
    console.assert(this.toggleable(), "Shouldn't be toggling an untoggleable action", this.id());
    if (this.#toggled === toggled) {
      return;
    }
    this.#toggled = toggled;
    this.dispatchEventToListeners("Toggled" /* TOGGLED */, toggled);
  }
  options() {
    return this.actionRegistration.options;
  }
  contextTypes() {
    if (this.actionRegistration.contextTypes) {
      return this.actionRegistration.contextTypes();
    }
    return void 0;
  }
  canInstantiate() {
    return Boolean(this.actionRegistration.loadActionDelegate);
  }
  bindings() {
    return this.actionRegistration.bindings;
  }
  configurableBindings() {
    return this.actionRegistration.configurableBindings ?? true;
  }
  experiment() {
    return this.actionRegistration.experiment;
  }
  featurePromotionId() {
    return this.actionRegistration.featurePromotionId;
  }
  setting() {
    return this.actionRegistration.setting;
  }
  condition() {
    return this.actionRegistration.condition;
  }
  order() {
    return this.actionRegistration.order;
  }
}
const registeredActions = /* @__PURE__ */ new Map();
export function registerActionExtension(registration) {
  const actionId = registration.actionId;
  if (registeredActions.has(actionId)) {
    throw new Error(`Duplicate action ID '${actionId}'`);
  }
  if (!Platform.StringUtilities.isExtendedKebabCase(actionId)) {
    throw new Error(`Invalid action ID '${actionId}'`);
  }
  registeredActions.set(actionId, new Action(registration));
}
export function reset() {
  registeredActions.clear();
}
export function getRegisteredActionExtensions() {
  return Array.from(registeredActions.values()).filter((action) => {
    const settingName = action.setting();
    try {
      if (settingName && !Common.Settings.moduleSetting(settingName).get()) {
        return false;
      }
    } catch (err) {
      if (err.message.startsWith("No setting registered")) {
        return false;
      }
    }
    return Root.Runtime.Runtime.isDescriptorEnabled({
      experiment: action.experiment(),
      condition: action.condition()
    });
  }).sort((firstAction, secondAction) => {
    const order1 = firstAction.order() || 0;
    const order2 = secondAction.order() || 0;
    return order1 - order2;
  });
}
export function maybeRemoveActionExtension(actionId) {
  return registeredActions.delete(actionId);
}
export var Platforms = /* @__PURE__ */ ((Platforms2) => {
  Platforms2["ALL"] = "All platforms";
  Platforms2["MAC"] = "mac";
  Platforms2["WINDOWS_LINUX"] = "windows,linux";
  Platforms2["ANDROID"] = "Android";
  Platforms2["WINDOWS"] = "windows";
  return Platforms2;
})(Platforms || {});
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ENABLED"] = "Enabled";
  Events2["TOGGLED"] = "Toggled";
  return Events2;
})(Events || {});
export var ActionCategory = /* @__PURE__ */ ((ActionCategory2) => {
  ActionCategory2["NONE"] = "";
  ActionCategory2["ELEMENTS"] = "ELEMENTS";
  ActionCategory2["SCREENSHOT"] = "SCREENSHOT";
  ActionCategory2["NETWORK"] = "NETWORK";
  ActionCategory2["MEMORY"] = "MEMORY";
  ActionCategory2["JAVASCRIPT_PROFILER"] = "JAVASCRIPT_PROFILER";
  ActionCategory2["CONSOLE"] = "CONSOLE";
  ActionCategory2["PERFORMANCE"] = "PERFORMANCE";
  ActionCategory2["MOBILE"] = "MOBILE";
  ActionCategory2["HELP"] = "HELP";
  ActionCategory2["LAYERS"] = "LAYERS";
  ActionCategory2["NAVIGATION"] = "NAVIGATION";
  ActionCategory2["DRAWER"] = "DRAWER";
  ActionCategory2["GLOBAL"] = "GLOBAL";
  ActionCategory2["RESOURCES"] = "RESOURCES";
  ActionCategory2["BACKGROUND_SERVICES"] = "BACKGROUND_SERVICES";
  ActionCategory2["SETTINGS"] = "SETTINGS";
  ActionCategory2["DEBUGGER"] = "DEBUGGER";
  ActionCategory2["SOURCES"] = "SOURCES";
  ActionCategory2["RENDERING"] = "RENDERING";
  ActionCategory2["RECORDER"] = "RECORDER";
  ActionCategory2["CHANGES"] = "CHANGES";
  return ActionCategory2;
})(ActionCategory || {});
export function getLocalizedActionCategory(category) {
  switch (category) {
    case "ELEMENTS" /* ELEMENTS */:
      return i18nString(UIStrings.elements);
    case "SCREENSHOT" /* SCREENSHOT */:
      return i18nString(UIStrings.screenshot);
    case "NETWORK" /* NETWORK */:
      return i18nString(UIStrings.network);
    case "MEMORY" /* MEMORY */:
      return i18nString(UIStrings.memory);
    case "JAVASCRIPT_PROFILER" /* JAVASCRIPT_PROFILER */:
      return i18nString(UIStrings.javascript_profiler);
    case "CONSOLE" /* CONSOLE */:
      return i18nString(UIStrings.console);
    case "PERFORMANCE" /* PERFORMANCE */:
      return i18nString(UIStrings.performance);
    case "MOBILE" /* MOBILE */:
      return i18nString(UIStrings.mobile);
    case "HELP" /* HELP */:
      return i18nString(UIStrings.help);
    case "LAYERS" /* LAYERS */:
      return i18nString(UIStrings.layers);
    case "NAVIGATION" /* NAVIGATION */:
      return i18nString(UIStrings.navigation);
    case "DRAWER" /* DRAWER */:
      return i18nString(UIStrings.drawer);
    case "GLOBAL" /* GLOBAL */:
      return i18nString(UIStrings.global);
    case "RESOURCES" /* RESOURCES */:
      return i18nString(UIStrings.resources);
    case "BACKGROUND_SERVICES" /* BACKGROUND_SERVICES */:
      return i18nString(UIStrings.background_services);
    case "SETTINGS" /* SETTINGS */:
      return i18nString(UIStrings.settings);
    case "DEBUGGER" /* DEBUGGER */:
      return i18nString(UIStrings.debugger);
    case "SOURCES" /* SOURCES */:
      return i18nString(UIStrings.sources);
    case "RENDERING" /* RENDERING */:
      return i18nString(UIStrings.rendering);
    case "RECORDER" /* RECORDER */:
      return i18nString(UIStrings.recorder);
    case "CHANGES" /* CHANGES */:
      return i18nString(UIStrings.changes);
    case "" /* NONE */:
      return i18n.i18n.lockedString("");
  }
  return i18n.i18n.lockedString(category);
}
export var IconClass = /* @__PURE__ */ ((IconClass2) => {
  IconClass2["LARGEICON_NODE_SEARCH"] = "select-element";
  IconClass2["START_RECORDING"] = "record-start";
  IconClass2["STOP_RECORDING"] = "record-stop";
  IconClass2["REFRESH"] = "refresh";
  IconClass2["CLEAR"] = "clear";
  IconClass2["EYE"] = "eye";
  IconClass2["LARGEICON_PHONE"] = "devices";
  IconClass2["PLAY"] = "play";
  IconClass2["DOWNLOAD"] = "download";
  IconClass2["LARGEICON_PAUSE"] = "pause";
  IconClass2["LARGEICON_RESUME"] = "resume";
  IconClass2["MOP"] = "mop";
  IconClass2["BIN"] = "bin";
  IconClass2["LARGEICON_SETTINGS_GEAR"] = "gear";
  IconClass2["LARGEICON_STEP_OVER"] = "step-over";
  IconClass2["LARGE_ICON_STEP_INTO"] = "step-into";
  IconClass2["LARGE_ICON_STEP"] = "step";
  IconClass2["LARGE_ICON_STEP_OUT"] = "step-out";
  IconClass2["BREAKPOINT_CROSSED_FILLED"] = "breakpoint-crossed-filled";
  IconClass2["BREAKPOINT_CROSSED"] = "breakpoint-crossed";
  IconClass2["PLUS"] = "plus";
  IconClass2["UNDO"] = "undo";
  IconClass2["COPY"] = "copy";
  IconClass2["IMPORT"] = "import";
  return IconClass2;
})(IconClass || {});
export var KeybindSet = /* @__PURE__ */ ((KeybindSet2) => {
  KeybindSet2["DEVTOOLS_DEFAULT"] = "devToolsDefault";
  KeybindSet2["VS_CODE"] = "vsCode";
  return KeybindSet2;
})(KeybindSet || {});
//# sourceMappingURL=ActionRegistration.js.map
