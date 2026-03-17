"use strict";
export var RegisteredAdorners = /* @__PURE__ */ ((RegisteredAdorners2) => {
  RegisteredAdorners2["AD"] = "ad";
  RegisteredAdorners2["CONTAINER"] = "container";
  RegisteredAdorners2["FLEX"] = "flex";
  RegisteredAdorners2["GRID"] = "grid";
  RegisteredAdorners2["GRID_LANES"] = "grid-lanes";
  RegisteredAdorners2["MEDIA"] = "media";
  RegisteredAdorners2["POPOVER"] = "popover";
  RegisteredAdorners2["REVEAL"] = "reveal";
  RegisteredAdorners2["SCROLL"] = "scroll";
  RegisteredAdorners2["SCROLL_SNAP"] = "scroll-snap";
  RegisteredAdorners2["SLOT"] = "slot";
  RegisteredAdorners2["VIEW_SOURCE"] = "view-source";
  RegisteredAdorners2["STARTING_STYLE"] = "starting-style";
  RegisteredAdorners2["SUBGRID"] = "subgrid";
  RegisteredAdorners2["TOP_LAYER"] = "top-layer";
  return RegisteredAdorners2;
})(RegisteredAdorners || {});
export class AdornerManager {
  #adornerSettings = /* @__PURE__ */ new Map();
  #settingStore;
  constructor(settingStore) {
    this.#settingStore = settingStore;
    this.#syncSettings();
  }
  updateSettings(settings) {
    this.#adornerSettings = settings;
    this.#persistCurrentSettings();
  }
  getSettings() {
    return this.#adornerSettings;
  }
  isAdornerEnabled(adornerText) {
    return this.#adornerSettings.get(adornerText) || false;
  }
  #persistCurrentSettings() {
    const settingList = [];
    for (const [adorner, isEnabled] of this.#adornerSettings) {
      settingList.push({ adorner, isEnabled });
    }
    this.#settingStore.set(settingList);
  }
  #loadSettings() {
    const settingList = this.#settingStore.get();
    for (const setting of settingList) {
      this.#adornerSettings.set(setting.adorner, setting.isEnabled);
    }
  }
  #syncSettings() {
    this.#loadSettings();
    const outdatedAdorners = new Set(this.#adornerSettings.keys());
    for (const adorner of Object.values(RegisteredAdorners)) {
      outdatedAdorners.delete(adorner);
      if (!this.#adornerSettings.has(adorner)) {
        const isEnabled = adorner !== "media" /* MEDIA */;
        this.#adornerSettings.set(adorner, isEnabled);
      }
    }
    for (const outdatedAdorner of outdatedAdorners) {
      this.#adornerSettings.delete(outdatedAdorner);
    }
    this.#persistCurrentSettings();
  }
}
//# sourceMappingURL=AdornerManager.js.map
