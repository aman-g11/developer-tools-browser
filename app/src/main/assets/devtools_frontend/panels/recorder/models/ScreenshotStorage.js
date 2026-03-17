"use strict";
import * as Common from "../../../core/common/common.js";
let instance = null;
const DEFAULT_MAX_STORAGE_SIZE = 50 * 1024 * 1024;
export class ScreenshotStorage {
  #screenshotSettings;
  #screenshots;
  #maxStorageSize;
  constructor(maxStorageSize = DEFAULT_MAX_STORAGE_SIZE) {
    this.#screenshotSettings = Common.Settings.Settings.instance().createSetting(
      "recorder-screenshots",
      []
    );
    this.#screenshots = this.#loadFromSettings();
    this.#maxStorageSize = maxStorageSize;
  }
  clear() {
    this.#screenshotSettings.set([]);
    this.#screenshots = /* @__PURE__ */ new Map();
  }
  getScreenshotForSection(recordingName, index) {
    const screenshot = this.#screenshots.get(
      this.#calculateKey(recordingName, index)
    );
    if (!screenshot) {
      return null;
    }
    this.#syncWithSettings(screenshot);
    return screenshot.data;
  }
  storeScreenshotForSection(recordingName, index, data) {
    const screenshot = { recordingName, index, data };
    this.#screenshots.set(this.#calculateKey(recordingName, index), screenshot);
    this.#syncWithSettings(screenshot);
  }
  deleteScreenshotsForRecording(recordingName) {
    for (const [key, entry] of this.#screenshots) {
      if (entry.recordingName === recordingName) {
        this.#screenshots.delete(key);
      }
    }
    this.#syncWithSettings();
  }
  #calculateKey(recordingName, index) {
    return `${recordingName}:${index}`;
  }
  #loadFromSettings() {
    const screenshots = /* @__PURE__ */ new Map();
    const data = this.#screenshotSettings.get();
    for (const item of data) {
      screenshots.set(this.#calculateKey(item.recordingName, item.index), item);
    }
    return screenshots;
  }
  #syncWithSettings(modifiedScreenshot) {
    if (modifiedScreenshot) {
      const key = this.#calculateKey(
        modifiedScreenshot.recordingName,
        modifiedScreenshot.index
      );
      this.#screenshots.delete(key);
      this.#screenshots.set(key, modifiedScreenshot);
    }
    const screenshots = [];
    let currentStorageSize = 0;
    for (const [key, screenshot] of Array.from(
      this.#screenshots.entries()
    ).reverse()) {
      if (currentStorageSize < this.#maxStorageSize) {
        currentStorageSize += screenshot.data.length;
        screenshots.push(screenshot);
      } else {
        this.#screenshots.delete(key);
      }
    }
    this.#screenshotSettings.set(screenshots.reverse());
  }
  static instance(opts = { forceNew: null, maxStorageSize: DEFAULT_MAX_STORAGE_SIZE }) {
    const { forceNew, maxStorageSize } = opts;
    if (!instance || forceNew) {
      instance = new ScreenshotStorage(maxStorageSize);
    }
    return instance;
  }
}
//# sourceMappingURL=ScreenshotStorage.js.map
