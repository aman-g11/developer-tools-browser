"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as EmulationModel from "../../models/emulation/emulation.js";
import * as Emulation from "../emulation/emulation.js";
const UIStrings = {
  /**
   * @description Explanation for user that Ligthhouse can only audit HTTP/HTTPS pages
   */
  canOnlyAuditHttphttpsPages: "Can only audit pages on HTTP or HTTPS. Navigate to a different page.",
  /**
   * @description Text when stored data in one location may affect Lighthouse run
   * @example {IndexedDB} PH1
   */
  thereMayBeStoredDataAffectingSingular: "There may be stored data affecting loading performance in this location: {PH1}. Audit this page in an incognito window to prevent those resources from affecting your scores.",
  /**
   * @description Text when stored data in multiple locations may affect Lighthouse run
   * @example {IndexedDB, WebSQL} PH1
   */
  thereMayBeStoredDataAffectingLoadingPlural: "There may be stored data affecting loading performance in these locations: {PH1}. Audit this page in an incognito window to prevent those resources from affecting your scores.",
  /**
   * @description Help text in Lighthouse Controller
   */
  multipleTabsAreBeingControlledBy: "Multiple tabs are being controlled by the same `service worker`. Close your other tabs on the same origin to audit this page.",
  /**
   * @description Help text in Lighthouse Controller
   */
  atLeastOneCategoryMustBeSelected: "At least one category must be selected.",
  /**
   * @description Text in Application Panel Sidebar of the Application panel
   */
  localStorage: "Local storage",
  /**
   * @description Text in Application Panel Sidebar of the Application panel
   */
  indexeddb: "IndexedDB",
  /**
   * @description Text in Application Panel Sidebar of the Application panel
   */
  webSql: "Web SQL",
  /**
   * @description Text of checkbox to include running the performance audits in Lighthouse
   */
  performance: "Performance",
  /**
   * @description Tooltip text of checkbox to include running the performance audits in Lighthouse
   */
  howLongDoesThisAppTakeToShow: "How long does this app take to show content and become usable",
  /**
   * @description Text of checkbox to include running the Best Practices audits in Lighthouse
   */
  bestPractices: "Best practices",
  /**
   * @description Tooltip text of checkbox to include running the Best Practices audits in Lighthouse
   */
  doesThisPageFollowBestPractices: "Does this page follow best practices for modern web development",
  /**
   * @description Text of checkbox to include running the Accessibility audits in Lighthouse
   */
  accessibility: "Accessibility",
  /**
   * @description Tooltip text of checkbox to include running the Accessibility audits in Lighthouse
   */
  isThisPageUsableByPeopleWith: "Is this page usable by people with disabilities or impairments",
  /**
   * @description Text of checkbox to include running the Search Engine Optimization audits in Lighthouse
   */
  seo: "SEO",
  /**
   * @description Tooltip text of checkbox to include running the Search Engine Optimization audits in Lighthouse
   */
  isThisPageOptimizedForSearch: "Is this page optimized for search engine results ranking",
  /**
   * @description ARIA label for a radio button input to emulate mobile device behavior when running audits in Lighthouse.
   */
  applyMobileEmulation: "Apply mobile emulation",
  /**
   * @description Tooltip text of checkbox to emulate mobile device behavior when running audits in Lighthouse
   */
  applyMobileEmulationDuring: "Apply mobile emulation during auditing",
  /**
   * @description Tooltip text of checkbox to emulate desktop device behavior when running audits in Lighthouse
   */
  applyDesktopEmulationDuring: "Apply desktop emulation during auditing",
  /**
   * @description ARIA label for a radio button input to select the Lighthouse mode.
   */
  lighthouseMode: "Lighthouse mode",
  /**
   * @description Tooltip text of a radio button to select the Lighthouse mode. "Navigation" is a Lighthouse mode that audits a page navigation. "Timespan" is a Lighthouse mode that audits user interactions over a period of time. "Snapshot" is a Lighthouse mode that audits the current page state.
   */
  runLighthouseInMode: "Run Lighthouse in navigation, timespan, or snapshot mode",
  /**
   * @description Label of a radio option for a Lighthouse mode that audits a page navigation. This should be marked as the default radio option.
   */
  navigation: "Navigation (Default)",
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits a page navigation.
   */
  navigationTooltip: "Navigation mode analyzes a page load, exactly like the original Lighthouse reports.",
  /**
   * @description Label of a radio option for a Lighthouse mode that audits user interactions over a period of time.
   */
  timespan: "Timespan",
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits user interactions over a period of time.
   */
  timespanTooltip: "Timespan mode analyzes an arbitrary period of time, typically containing user interactions.",
  /**
   * @description Label of a radio option for a Lighthouse mode that audits the current page state.
   */
  snapshot: "Snapshot",
  /**
   * @description Tooltip description of a radio option for a Lighthouse mode that audits the current page state.
   */
  snapshotTooltip: "Snapshot mode analyzes the page in a particular state, typically after user interactions.",
  /**
   * @description Text for the mobile platform, as opposed to desktop
   */
  mobile: "Mobile",
  /**
   * @description Text for the desktop platform, as opposed to mobile
   */
  desktop: "Desktop",
  /**
   * @description Text for an option to select a throttling method.
   */
  throttlingMethod: "Throttling method",
  /**
   * @description Text for an option in a dropdown to use simulated throttling. This is the default setting.
   */
  simulatedThrottling: "Simulated throttling (default)",
  /**
   * @description Text for an option in a dropdown to use DevTools throttling. This option should only be used by advanced users.
   */
  devtoolsThrottling: "DevTools throttling (advanced)",
  /**
   * @description Tooltip text that appears when hovering over the 'Simulated Throttling' checkbox in the settings pane opened by clicking the setting cog in the start view of the audits panel
   */
  simulateASlowerPageLoadBasedOn: "Simulated throttling simulates a slower page load based on data from an initial unthrottled load. DevTools throttling actually slows down the page.",
  /**
   * @description Text of checkbox to reset storage features prior to running audits in Lighthouse
   */
  clearStorage: "Clear storage",
  /**
   * @description Tooltip text of checkbox to reset storage features prior to running audits in
   * Lighthouse. Resetting the storage clears/empties it to a neutral state.
   */
  resetStorageLocalstorage: "Reset storage (`cache`, `service workers`, etc) before auditing. (Good for performance & `PWA` testing)",
  /**
   * @description Text of checkbox to enable JavaScript sampling while running audits in Lighthouse
   */
  enableSampling: "Enable JS sampling",
  /**
   * @description Tooltip text of checkbox to enable JavaScript sampling while running audits in
   * Lighthouse. Resetting the storage clears/empties it to a neutral state.
   */
  enableJavaScriptSampling: "Enable JavaScript sampling during the Lighthouse run. This will provide more execution details in the performance panel when you view the trace, but has higher CPU overhead and may impact the performance of the page.",
  /**
   * @description Explanation for user that Lighthouse can only audit when JavaScript is enabled
   */
  javaScriptDisabled: "JavaScript is disabled. You need to enable JavaScript to audit this page. Open the Command Menu and run the Enable JavaScript command to enable JavaScript."
};
const str_ = i18n.i18n.registerUIStrings("panels/lighthouse/LighthouseController.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
class LighthouseRun {
  controller;
  inspectedURL;
  categoryIDs;
  flags;
  emulationStateBefore;
  protocolService;
  #isRunning;
  #cancelPromise = null;
  constructor(controller, protocolService, inspectedURL, categoryIDs, flags) {
    this.controller = controller;
    this.protocolService = protocolService;
    this.inspectedURL = inspectedURL;
    this.categoryIDs = categoryIDs;
    this.flags = flags;
    this.#isRunning = false;
  }
  isRunning() {
    return this.#isRunning;
  }
  async start() {
    this.#isRunning = true;
    try {
      await this.setupEmulationAndProtocolConnection();
      if (this.flags.mode === "timespan") {
        await this.protocolService.startTimespan(
          { inspectedURL: this.inspectedURL, categoryIDs: this.categoryIDs, flags: this.flags }
        );
      }
    } catch (err) {
      await this.cancel();
      throw err;
    }
  }
  async collect() {
    try {
      const lighthouseResponse = await this.protocolService.collectLighthouseResults(
        { inspectedURL: this.inspectedURL, categoryIDs: this.categoryIDs, flags: this.flags }
      );
      if (!lighthouseResponse) {
        throw new Error("No Lighthouse response");
      }
      if (lighthouseResponse.fatal) {
        const error = new Error(lighthouseResponse.message);
        error.stack = lighthouseResponse.stack;
        throw error;
      }
      return lighthouseResponse;
    } finally {
      await this.cancel();
    }
  }
  async cancel() {
    if (!this.#cancelPromise) {
      this.#isRunning = false;
      this.#cancelPromise = this.restoreEmulationAndProtocolConnection();
    }
    return await this.#cancelPromise;
  }
  /**
   * We set the device emulation on the DevTools-side for two reasons:
   * 1. To workaround some odd device metrics emulation bugs like occuluding viewports
   * 2. To get the attractive device outline
   */
  async setupEmulationAndProtocolConnection() {
    const emulationModel = EmulationModel.DeviceModeModel.DeviceModeModel.instance();
    this.emulationStateBefore = {
      emulation: {
        type: emulationModel.type(),
        enabled: emulationModel.enabledSetting().get(),
        outlineEnabled: emulationModel.deviceOutlineSetting().get(),
        toolbarControlsEnabled: emulationModel.toolbarControlsEnabledSetting().get(),
        scale: emulationModel.scaleSetting().get(),
        device: emulationModel.device(),
        mode: emulationModel.mode()
      },
      network: { conditions: SDK.NetworkManager.MultitargetNetworkManager.instance().networkConditions() }
    };
    emulationModel.toolbarControlsEnabledSetting().set(false);
    if ("formFactor" in this.flags && this.flags.formFactor === "desktop") {
      emulationModel.enabledSetting().set(false);
      emulationModel.emulate(EmulationModel.DeviceModeModel.Type.None, null, null);
    } else if (this.flags.formFactor === "mobile") {
      emulationModel.enabledSetting().set(true);
      emulationModel.deviceOutlineSetting().set(true);
      for (const device of EmulationModel.EmulatedDevices.EmulatedDevicesList.instance().standard()) {
        if (device.title === "Moto G Power") {
          emulationModel.emulate(EmulationModel.DeviceModeModel.Type.Device, device, device.modes[0], 1);
        }
      }
    }
    await this.protocolService.attach();
  }
  async restoreEmulationAndProtocolConnection() {
    await this.protocolService.detach();
    if (this.emulationStateBefore) {
      const emulationModel = EmulationModel.DeviceModeModel.DeviceModeModel.instance();
      emulationModel.emulate(EmulationModel.DeviceModeModel.Type.None, null, null);
      const { type, enabled, outlineEnabled, toolbarControlsEnabled, scale, device, mode: mode2 } = this.emulationStateBefore.emulation;
      emulationModel.enabledSetting().set(enabled);
      emulationModel.deviceOutlineSetting().set(outlineEnabled);
      emulationModel.toolbarControlsEnabledSetting().set(toolbarControlsEnabled);
      if (type === EmulationModel.DeviceModeModel.Type.Responsive) {
        emulationModel.scaleSetting().set(scale);
      }
      emulationModel.emulate(type, device, mode2, scale);
      SDK.NetworkManager.MultitargetNetworkManager.instance().setNetworkConditions(
        this.emulationStateBefore.network.conditions
      );
      delete this.emulationStateBefore;
    }
    Emulation.InspectedPagePlaceholder.InspectedPagePlaceholder.instance().update(true);
    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return;
    }
    const mode = this.flags.mode;
    if (mode === "navigation") {
      const inspectedURL = await this.controller.getInspectedURL();
      await resourceTreeModel.navigate(inspectedURL);
    }
  }
}
export class LighthouseController extends Common.ObjectWrapper.ObjectWrapper {
  protocolService;
  manager;
  serviceWorkerListeners;
  inspectedURL;
  currentLighthouseRun;
  lastAction = null;
  constructor(protocolService) {
    super();
    this.protocolService = protocolService;
    protocolService.registerStatusCallback(
      (message) => this.dispatchEventToListeners("AuditProgressChanged" /* AuditProgressChanged */, { message })
    );
    for (const preset of getPresets()) {
      preset.setting.addChangeListener(this.recomputePageAuditability.bind(this));
    }
    for (const runtimeSetting of getRuntimeSettings()) {
      runtimeSetting.setting.addChangeListener(this.recomputePageAuditability.bind(this));
    }
    const javaScriptDisabledSetting = Common.Settings.Settings.instance().moduleSetting("java-script-disabled");
    javaScriptDisabledSetting.addChangeListener(this.recomputePageAuditability.bind(this));
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.ServiceWorkerManager.ServiceWorkerManager, this);
    SDK.TargetManager.TargetManager.instance().addEventListener(
      SDK.TargetManager.Events.INSPECTED_URL_CHANGED,
      this.recomputePageAuditability,
      this
    );
  }
  modelAdded(serviceWorkerManager) {
    if (serviceWorkerManager.target() !== SDK.TargetManager.TargetManager.instance().primaryPageTarget()) {
      return;
    }
    this.manager = serviceWorkerManager;
    this.serviceWorkerListeners = [
      this.manager.addEventListener(
        SDK.ServiceWorkerManager.Events.REGISTRATION_UPDATED,
        this.recomputePageAuditability,
        this
      ),
      this.manager.addEventListener(
        SDK.ServiceWorkerManager.Events.REGISTRATION_DELETED,
        this.recomputePageAuditability,
        this
      )
    ];
    this.recomputePageAuditability();
  }
  modelRemoved(serviceWorkerManager) {
    if (this.manager !== serviceWorkerManager) {
      return;
    }
    if (this.serviceWorkerListeners) {
      Common.EventTarget.removeEventListeners(this.serviceWorkerListeners);
    }
    this.manager = null;
    this.recomputePageAuditability();
  }
  hasActiveServiceWorker() {
    if (!this.manager) {
      return false;
    }
    const mainTarget = this.manager.target();
    if (!mainTarget) {
      return false;
    }
    const inspectedURL = Common.ParsedURL.ParsedURL.fromString(mainTarget.inspectedURL());
    const inspectedOrigin = inspectedURL?.securityOrigin();
    for (const registration of this.manager.registrations().values()) {
      if (registration.securityOrigin !== inspectedOrigin) {
        continue;
      }
      for (const version of registration.versions.values()) {
        if (version.controlledClients.length > 1) {
          return true;
        }
      }
    }
    return false;
  }
  hasAtLeastOneCategory() {
    return getPresets().some((preset) => preset.setting.get());
  }
  unauditablePageMessage() {
    if (!this.manager || this.getFlags().mode !== "navigation") {
      return null;
    }
    const mainTarget = this.manager.target();
    const inspectedURL = mainTarget?.inspectedURL();
    if (!inspectedURL?.startsWith("http")) {
      return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
    }
    try {
      const isPdf = new URL(inspectedURL).pathname.endsWith(".pdf");
      if (isPdf) {
        return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
      }
    } catch {
      return i18nString(UIStrings.canOnlyAuditHttphttpsPages);
    }
    return null;
  }
  javaScriptDisabled() {
    return Common.Settings.Settings.instance().moduleSetting("java-script-disabled").get();
  }
  async hasImportantResourcesNotCleared() {
    const clearStorageSetting = getRuntimeSettings().find((runtimeSetting) => runtimeSetting.setting.name === "lighthouse.clear-storage");
    if (clearStorageSetting && !clearStorageSetting.setting.get()) {
      return "";
    }
    if (!this.manager) {
      return "";
    }
    const mainTarget = this.manager.target();
    const origin = mainTarget.inspectedURL();
    if (!origin) {
      return "";
    }
    const usageData = await mainTarget.storageAgent().invoke_getUsageAndQuota({ origin });
    if (usageData.getError()) {
      return "";
    }
    const locations = usageData.usageBreakdown.filter((usage) => usage.usage).map((usage) => STORAGE_TYPE_NAMES.get(usage.storageType)).map((i18nStringFn) => i18nStringFn ? i18nStringFn() : void 0).filter(Boolean);
    if (locations.length === 1) {
      return i18nString(UIStrings.thereMayBeStoredDataAffectingSingular, { PH1: String(locations[0]) });
    }
    if (locations.length > 1) {
      return i18nString(UIStrings.thereMayBeStoredDataAffectingLoadingPlural, { PH1: locations.join(", ") });
    }
    return "";
  }
  async evaluateInspectedURL() {
    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      throw new Error("Unable to find main target required for Lighthouse");
    }
    const inspectedURL = mainTarget.inspectedURL();
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    const navHistory = resourceTreeModel && await resourceTreeModel.navigationHistory();
    if (!resourceTreeModel || !navHistory) {
      return inspectedURL;
    }
    const { currentIndex, entries } = navHistory;
    const navigationEntry = entries[currentIndex];
    return navigationEntry.url;
  }
  getCurrentRun() {
    if (!this.currentLighthouseRun?.isRunning()) {
      return;
    }
    return {
      inspectedURL: this.currentLighthouseRun.inspectedURL,
      categoryIDs: this.currentLighthouseRun.categoryIDs,
      flags: this.currentLighthouseRun.flags
    };
  }
  getFlags() {
    const flags = {};
    for (const runtimeSetting of getRuntimeSettings()) {
      runtimeSetting.setFlags(flags, runtimeSetting.setting.get());
    }
    return flags;
  }
  getCategoryIDs() {
    const { mode } = this.getFlags();
    const categoryIDs = [];
    for (const preset of getPresets()) {
      if (mode && !preset.supportedModes.includes(mode)) {
        continue;
      }
      if (preset.setting.get()) {
        categoryIDs.push(preset.configID);
      }
    }
    return categoryIDs;
  }
  async getInspectedURL(options) {
    if (options?.force || !this.inspectedURL) {
      this.inspectedURL = await this.evaluateInspectedURL();
    }
    return this.inspectedURL;
  }
  recomputePageAuditability() {
    const hasActiveServiceWorker = this.hasActiveServiceWorker();
    const hasAtLeastOneCategory = this.hasAtLeastOneCategory();
    const unauditablePageMessage = this.unauditablePageMessage();
    const javaScriptDisabled = this.javaScriptDisabled();
    let helpText = "";
    if (hasActiveServiceWorker) {
      helpText = i18nString(UIStrings.multipleTabsAreBeingControlledBy);
    } else if (!hasAtLeastOneCategory) {
      helpText = i18nString(UIStrings.atLeastOneCategoryMustBeSelected);
    } else if (unauditablePageMessage) {
      helpText = unauditablePageMessage;
    } else if (javaScriptDisabled) {
      helpText = i18nString(UIStrings.javaScriptDisabled);
    }
    this.dispatchEventToListeners("PageAuditabilityChanged" /* PageAuditabilityChanged */, { helpText });
    void this.hasImportantResourcesNotCleared().then((warning) => {
      if (this.getFlags().mode !== "navigation") {
        warning = "";
      }
      this.dispatchEventToListeners("PageWarningsChanged" /* PageWarningsChanged */, { warning });
    });
  }
  recordMetrics(flags, categoryIds) {
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseStarted);
    for (const preset of getPresets()) {
      if (!categoryIds.includes(preset.configID)) {
        continue;
      }
      Host.userMetrics.lighthouseCategoryUsed(preset.userMetric);
    }
    switch (flags.mode) {
      case "navigation":
        Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.NAVIGATION);
        break;
      case "timespan":
        Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.TIMESPAN);
        break;
      case "snapshot":
        Host.userMetrics.lighthouseModeRun(Host.UserMetrics.LighthouseModeRun.SNAPSHOT);
        break;
    }
  }
  /**
   * Starts a LH run. By default it will use the categories based on what the
   * user has selected in the UI, but these can be overridden by passing in the
   * category IDs, in which case these take priority.
   */
  async startLighthouse(overrides) {
    if (this.lastAction) {
      await this.lastAction;
    }
    this.lastAction = new Promise(async (resolve) => {
      if (this.currentLighthouseRun) {
        await this.currentLighthouseRun.cancel();
        this.currentLighthouseRun = void 0;
      }
      const inspectedURL = await this.getInspectedURL({ force: true });
      const categoryIDs = overrides?.categoryIds ?? this.getCategoryIDs();
      const flags = this.getFlags();
      this.recordMetrics(flags, categoryIDs);
      this.currentLighthouseRun = new LighthouseRun(this, this.protocolService, inspectedURL, categoryIDs, flags);
      await this.currentLighthouseRun.start();
      resolve();
    });
    return await this.lastAction;
  }
  async collectLighthouseResults() {
    if (!this.currentLighthouseRun) {
      throw new Error("Lighthouse is not started");
    }
    const lighthouseResponse = await this.currentLighthouseRun.collect();
    Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseFinished);
    this.currentLighthouseRun = void 0;
    return lighthouseResponse;
  }
  async cancelLighthouse() {
    if (this.lastAction) {
      await this.lastAction;
    }
    this.lastAction = new Promise(async (resolve) => {
      if (this.currentLighthouseRun) {
        await this.currentLighthouseRun.cancel();
        this.currentLighthouseRun = void 0;
      }
      resolve();
    });
    return await this.lastAction;
  }
}
const STORAGE_TYPE_NAMES = /* @__PURE__ */ new Map([
  [Protocol.Storage.StorageType.Local_storage, i18nLazyString(UIStrings.localStorage)],
  [Protocol.Storage.StorageType.Indexeddb, i18nLazyString(UIStrings.indexeddb)],
  [Protocol.Storage.StorageType.Websql, i18nLazyString(UIStrings.webSql)]
]);
let presets = null;
export function getPresets() {
  if (!presets) {
    presets = [
      // configID maps to Lighthouse's Object.keys(config.categories)[0] value
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.cat-perf",
          true,
          Common.Settings.SettingStorageType.SYNCED
        ),
        configID: "performance",
        title: i18nLazyString(UIStrings.performance),
        description: i18nLazyString(UIStrings.howLongDoesThisAppTakeToShow),
        supportedModes: ["navigation", "timespan", "snapshot"],
        userMetric: Host.UserMetrics.LighthouseCategoryUsed.PERFORMANCE
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.cat-a11y",
          true,
          Common.Settings.SettingStorageType.SYNCED
        ),
        configID: "accessibility",
        title: i18nLazyString(UIStrings.accessibility),
        description: i18nLazyString(UIStrings.isThisPageUsableByPeopleWith),
        supportedModes: ["navigation", "snapshot"],
        userMetric: Host.UserMetrics.LighthouseCategoryUsed.ACCESSIBILITY
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.cat-best-practices",
          true,
          Common.Settings.SettingStorageType.SYNCED
        ),
        configID: "best-practices",
        title: i18nLazyString(UIStrings.bestPractices),
        description: i18nLazyString(UIStrings.doesThisPageFollowBestPractices),
        supportedModes: ["navigation", "timespan", "snapshot"],
        userMetric: Host.UserMetrics.LighthouseCategoryUsed.BEST_PRACTICES
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.cat-seo",
          true,
          Common.Settings.SettingStorageType.SYNCED
        ),
        configID: "seo",
        title: i18nLazyString(UIStrings.seo),
        description: i18nLazyString(UIStrings.isThisPageOptimizedForSearch),
        supportedModes: ["navigation", "snapshot"],
        userMetric: Host.UserMetrics.LighthouseCategoryUsed.SEO
      }
    ];
  }
  return presets;
}
let runtimeSettings = null;
export function getRuntimeSettings() {
  if (!runtimeSettings) {
    runtimeSettings = [
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.device-type",
          "mobile",
          Common.Settings.SettingStorageType.SYNCED
        ),
        title: i18nLazyString(UIStrings.applyMobileEmulation),
        description: i18nLazyString(UIStrings.applyMobileEmulationDuring),
        setFlags: (flags, value) => {
          flags.formFactor = value;
        },
        options: [
          {
            label: i18nLazyString(UIStrings.mobile),
            tooltip: i18nLazyString(UIStrings.applyMobileEmulationDuring),
            value: "mobile"
          },
          {
            label: i18nLazyString(UIStrings.desktop),
            tooltip: i18nLazyString(UIStrings.applyDesktopEmulationDuring),
            value: "desktop"
          }
        ]
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.mode",
          "navigation",
          Common.Settings.SettingStorageType.SYNCED
        ),
        title: i18nLazyString(UIStrings.lighthouseMode),
        description: i18nLazyString(UIStrings.runLighthouseInMode),
        setFlags: (flags, value) => {
          flags.mode = value;
        },
        options: [
          {
            label: i18nLazyString(UIStrings.navigation),
            tooltip: i18nLazyString(UIStrings.navigationTooltip),
            value: "navigation"
          },
          {
            label: i18nLazyString(UIStrings.timespan),
            tooltip: i18nLazyString(UIStrings.timespanTooltip),
            value: "timespan"
          },
          {
            label: i18nLazyString(UIStrings.snapshot),
            tooltip: i18nLazyString(UIStrings.snapshotTooltip),
            value: "snapshot"
          }
        ],
        learnMore: "https://github.com/GoogleChrome/lighthouse/blob/HEAD/docs/user-flows.md"
      },
      {
        // This setting is disabled, but we keep it around to show in the UI.
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.throttling",
          "simulate",
          Common.Settings.SettingStorageType.SYNCED
        ),
        title: i18nLazyString(UIStrings.throttlingMethod),
        // We will disable this when we have a Lantern trace viewer within DevTools.
        learnMore: "https://github.com/GoogleChrome/lighthouse/blob/master/docs/throttling.md#devtools-lighthouse-panel-throttling",
        description: i18nLazyString(UIStrings.simulateASlowerPageLoadBasedOn),
        setFlags: (flags, value) => {
          if (typeof value === "string") {
            flags.throttlingMethod = value;
          } else {
            flags.throttlingMethod = value ? "simulate" : "devtools";
          }
        },
        options: [
          { label: i18nLazyString(UIStrings.simulatedThrottling), value: "simulate" },
          { label: i18nLazyString(UIStrings.devtoolsThrottling), value: "devtools" }
        ]
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.clear-storage",
          true,
          Common.Settings.SettingStorageType.SYNCED
        ),
        title: i18nLazyString(UIStrings.clearStorage),
        description: i18nLazyString(UIStrings.resetStorageLocalstorage),
        setFlags: (flags, value) => {
          flags.disableStorageReset = !value;
        }
      },
      {
        setting: Common.Settings.Settings.instance().createSetting(
          "lighthouse.enable-sampling",
          false,
          Common.Settings.SettingStorageType.SYNCED
        ),
        title: i18nLazyString(UIStrings.enableSampling),
        description: i18nLazyString(UIStrings.enableJavaScriptSampling),
        setFlags: (flags, value) => {
          if (value) {
            flags.additionalTraceCategories = "disabled-by-default-v8.cpu_profiler";
          } else {
            flags.additionalTraceCategories = "";
          }
        }
      }
    ];
  }
  return runtimeSettings;
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["PageAuditabilityChanged"] = "PageAuditabilityChanged";
  Events2["PageWarningsChanged"] = "PageWarningsChanged";
  Events2["AuditProgressChanged"] = "AuditProgressChanged";
  return Events2;
})(Events || {});
//# sourceMappingURL=LighthouseController.js.map
