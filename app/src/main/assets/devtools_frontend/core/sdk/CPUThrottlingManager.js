"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../i18n/i18n.js";
import { EmulationModel } from "./EmulationModel.js";
import { TargetManager } from "./TargetManager.js";
const UIStrings = {
  /**
   * @description Text label for a menu item indicating that no throttling is applied.
   */
  noThrottling: "No throttling",
  /**
   * @description Text label for a menu item indicating that a specific slowdown multiplier is applied.
   * @example {2} PH1
   */
  dSlowdown: "{PH1}\xD7 slowdown",
  /**
   * @description Text label for a menu item indicating an average mobile device.
   */
  calibratedMidTierMobile: "Mid-tier mobile",
  /**
   * @description Text label for a menu item indicating a below-average mobile device.
   */
  calibratedLowTierMobile: "Low-tier mobile",
  /**
   * @description Text label indicating why an option is not available, because the user's device is not fast enough to emulate a device.
   */
  calibrationErrorDeviceTooWeak: "Device is not powerful enough"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/CPUThrottlingManager.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
let throttlingManagerInstance;
export class CPUThrottlingManager extends Common.ObjectWrapper.ObjectWrapper {
  #cpuThrottlingOption;
  #calibratedThrottlingSetting;
  #hardwareConcurrency;
  #pendingMainTargetPromise;
  constructor() {
    super();
    this.#cpuThrottlingOption = NoThrottlingOption;
    this.#calibratedThrottlingSetting = Common.Settings.Settings.instance().createSetting(
      "calibrated-cpu-throttling",
      {},
      Common.Settings.SettingStorageType.GLOBAL
    );
    this.#calibratedThrottlingSetting.addChangeListener(this.#onCalibratedSettingChanged, this);
    TargetManager.instance().observeModels(EmulationModel, this);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!throttlingManagerInstance || forceNew) {
      throttlingManagerInstance = new CPUThrottlingManager();
    }
    return throttlingManagerInstance;
  }
  static removeInstance() {
    throttlingManagerInstance = void 0;
  }
  cpuThrottlingRate() {
    return this.#cpuThrottlingOption.rate();
  }
  cpuThrottlingOption() {
    return this.#cpuThrottlingOption;
  }
  #onCalibratedSettingChanged() {
    const currentOption = this.#cpuThrottlingOption;
    if (!currentOption.calibratedDeviceType) {
      return;
    }
    const rate = this.#cpuThrottlingOption.rate();
    if (rate === 0) {
      this.setCPUThrottlingOption(NoThrottlingOption);
      return;
    }
    for (const emulationModel of TargetManager.instance().models(EmulationModel)) {
      void emulationModel.setCPUThrottlingRate(rate);
    }
    this.dispatchEventToListeners("RateChanged" /* RATE_CHANGED */, rate);
  }
  setCPUThrottlingOption(option) {
    if (option === this.#cpuThrottlingOption) {
      return;
    }
    this.#cpuThrottlingOption = option;
    for (const emulationModel of TargetManager.instance().models(EmulationModel)) {
      void emulationModel.setCPUThrottlingRate(this.#cpuThrottlingOption.rate());
    }
    this.dispatchEventToListeners("RateChanged" /* RATE_CHANGED */, this.#cpuThrottlingOption.rate());
  }
  setHardwareConcurrency(concurrency) {
    this.#hardwareConcurrency = concurrency;
    for (const emulationModel of TargetManager.instance().models(EmulationModel)) {
      void emulationModel.setHardwareConcurrency(concurrency);
    }
    this.dispatchEventToListeners("HardwareConcurrencyChanged" /* HARDWARE_CONCURRENCY_CHANGED */, this.#hardwareConcurrency);
  }
  hasPrimaryPageTargetSet() {
    try {
      return TargetManager.instance().primaryPageTarget() !== null;
    } catch {
      return false;
    }
  }
  async getHardwareConcurrency() {
    const target = TargetManager.instance().primaryPageTarget();
    const existingCallback = this.#pendingMainTargetPromise;
    if (!target) {
      if (existingCallback) {
        return await new Promise((r) => {
          this.#pendingMainTargetPromise = (result2) => {
            r(result2);
            existingCallback(result2);
          };
        });
      }
      return await new Promise((r) => {
        this.#pendingMainTargetPromise = r;
      });
    }
    const evalResult = await target.runtimeAgent().invoke_evaluate(
      { expression: "navigator.hardwareConcurrency", returnByValue: true, silent: true, throwOnSideEffect: true }
    );
    const error = evalResult.getError();
    if (error) {
      throw new Error(error);
    }
    const { result, exceptionDetails } = evalResult;
    if (exceptionDetails) {
      throw new Error(exceptionDetails.text);
    }
    return result.value;
  }
  modelAdded(emulationModel) {
    if (this.#cpuThrottlingOption !== NoThrottlingOption) {
      void emulationModel.setCPUThrottlingRate(this.#cpuThrottlingOption.rate());
    }
    if (this.#hardwareConcurrency !== void 0) {
      void emulationModel.setHardwareConcurrency(this.#hardwareConcurrency);
    }
    if (this.#pendingMainTargetPromise) {
      const existingCallback = this.#pendingMainTargetPromise;
      this.#pendingMainTargetPromise = void 0;
      void this.getHardwareConcurrency().then(existingCallback);
    }
  }
  modelRemoved(_emulationModel) {
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["RATE_CHANGED"] = "RateChanged";
  Events2["HARDWARE_CONCURRENCY_CHANGED"] = "HardwareConcurrencyChanged";
  return Events2;
})(Events || {});
export var CPUThrottlingRates = /* @__PURE__ */ ((CPUThrottlingRates2) => {
  CPUThrottlingRates2[CPUThrottlingRates2["NO_THROTTLING"] = 1] = "NO_THROTTLING";
  CPUThrottlingRates2[CPUThrottlingRates2["MID_TIER_MOBILE"] = 4] = "MID_TIER_MOBILE";
  CPUThrottlingRates2[CPUThrottlingRates2["LOW_TIER_MOBILE"] = 6] = "LOW_TIER_MOBILE";
  CPUThrottlingRates2[CPUThrottlingRates2["EXTRA_SLOW"] = 20] = "EXTRA_SLOW";
  CPUThrottlingRates2[CPUThrottlingRates2["MidTierMobile"] = 4 /* MID_TIER_MOBILE */] = "MidTierMobile";
  CPUThrottlingRates2[CPUThrottlingRates2["LowEndMobile"] = 6 /* LOW_TIER_MOBILE */] = "LowEndMobile";
  return CPUThrottlingRates2;
})(CPUThrottlingRates || {});
function makeFixedPresetThrottlingOption(rate) {
  return {
    title: rate === 1 ? i18nLazyString(UIStrings.noThrottling) : i18nLazyString(UIStrings.dSlowdown, { PH1: rate }),
    rate: () => rate,
    jslogContext: rate === 1 ? "cpu-no-throttling" : `cpu-throttled-${rate}`
  };
}
export const NoThrottlingOption = makeFixedPresetThrottlingOption(1 /* NO_THROTTLING */);
export const MidTierThrottlingOption = makeFixedPresetThrottlingOption(4 /* MID_TIER_MOBILE */);
export const LowTierThrottlingOption = makeFixedPresetThrottlingOption(6 /* LOW_TIER_MOBILE */);
export const ExtraSlowThrottlingOption = makeFixedPresetThrottlingOption(20 /* EXTRA_SLOW */);
function makeCalibratedThrottlingOption(calibratedDeviceType) {
  const getSettingValue = () => {
    const setting = Common.Settings.Settings.instance().createSetting(
      "calibrated-cpu-throttling",
      {},
      Common.Settings.SettingStorageType.GLOBAL
    );
    const value = setting.get();
    if (calibratedDeviceType === "low-tier-mobile") {
      return value.low ?? null;
    }
    if (calibratedDeviceType === "mid-tier-mobile") {
      return value.mid ?? null;
    }
    return null;
  };
  return {
    title() {
      const typeString = calibratedDeviceType === "low-tier-mobile" ? i18nString(UIStrings.calibratedLowTierMobile) : i18nString(UIStrings.calibratedMidTierMobile);
      const value = getSettingValue();
      if (typeof value === "number") {
        return `${typeString} \u2013 ${value.toFixed(1)}\xD7`;
      }
      return typeString;
    },
    rate() {
      const value = getSettingValue();
      if (typeof value === "number") {
        return value;
      }
      return 0;
    },
    calibratedDeviceType,
    jslogContext: `cpu-throttled-calibrated-${calibratedDeviceType}`
  };
}
export const CalibratedLowTierMobileThrottlingOption = makeCalibratedThrottlingOption("low-tier-mobile");
export const CalibratedMidTierMobileThrottlingOption = makeCalibratedThrottlingOption("mid-tier-mobile");
export var CalibrationError = /* @__PURE__ */ ((CalibrationError2) => {
  CalibrationError2["DEVICE_TOO_WEAK"] = "DEVICE_TOO_WEAK";
  return CalibrationError2;
})(CalibrationError || {});
export function calibrationErrorToString(error) {
  if (error === "DEVICE_TOO_WEAK" /* DEVICE_TOO_WEAK */) {
    return i18nString(UIStrings.calibrationErrorDeviceTooWeak);
  }
  return error;
}
//# sourceMappingURL=CPUThrottlingManager.js.map
