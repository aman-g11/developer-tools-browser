"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as ProtocolClient from "../../core/protocol_client/protocol_client.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Foundation from "../../foundation/foundation.js";
import * as AiAssistanceModel from "../../models/ai_assistance/ai_assistance.js";
import * as AutofillManager from "../../models/autofill_manager/autofill_manager.js";
import * as Badges from "../../models/badges/badges.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as Breakpoints from "../../models/breakpoints/breakpoints.js";
import * as CrUXManager from "../../models/crux-manager/crux-manager.js";
import * as IssuesManager from "../../models/issues_manager/issues_manager.js";
import * as LiveMetrics from "../../models/live-metrics/live-metrics.js";
import * as Logs from "../../models/logs/logs.js";
import * as Persistence from "../../models/persistence/persistence.js";
import * as ProjectSettings from "../../models/project_settings/project_settings.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as PanelCommon from "../../panels/common/common.js";
import * as Snippets from "../../panels/snippets/snippets.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as Snackbar from "../../ui/components/snackbars/snackbars.js";
import * as UIHelpers from "../../ui/helpers/helpers.js";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import { html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { ExecutionContextSelector } from "./ExecutionContextSelector.js";
const UIStrings = {
  /**
   * @description Title of item in main
   */
  customizeAndControlDevtools: "Customize and control DevTools",
  /**
   * @description Title element text content in Main
   */
  dockSide: "Dock side",
  /**
   * @description Title element title in Main
   * @example {Ctrl+Shift+D} PH1
   */
  placementOfDevtoolsRelativeToThe: "Placement of DevTools relative to the page. ({PH1} to restore last position)",
  /**
   * @description Text to undock the DevTools
   */
  undockIntoSeparateWindow: "Undock into separate window",
  /**
   * @description Text to dock the DevTools to the bottom of the browser tab
   */
  dockToBottom: "Dock to bottom",
  /**
   * @description Text to dock the DevTools to the right of the browser tab
   */
  dockToRight: "Dock to right",
  /**
   * @description Text to dock the DevTools to the left of the browser tab
   */
  dockToLeft: "Dock to left",
  /**
   * @description Text in Main
   */
  focusDebuggee: "Focus page",
  /**
   * @description Text in Main
   */
  hideConsoleDrawer: "Hide console drawer",
  /**
   * @description Text in Main
   */
  showConsoleDrawer: "Show console drawer",
  /**
   * @description A context menu item in the Main
   */
  moreTools: "More tools",
  /**
   * @description Text for the viewing the help options
   */
  help: "Help",
  /**
   * @description Text describing how to navigate the dock side menu
   */
  dockSideNavigation: "Use left and right arrow keys to navigate the options",
  /**
   * @description Notification shown to the user whenever DevTools receives an external request.
   */
  externalRequestReceived: "`DevTools` received an external request",
  /**
   * @description Notification shown to the user whenever DevTools has finished downloading a local AI model.
   */
  aiModelDownloaded: "AI model downloaded",
  /**
   * @description A title of the menu item in the main menu leading to https://github.com/ChromeDevTools/chrome-devtools-mcp.
   */
  getDevToolsMcp: "Get `DevTools MCP`"
};
const str_ = i18n.i18n.registerUIStrings("entrypoints/main/MainImpl.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let loadedPanelCommonModule;
const WINDOW_LOCAL_STORAGE = {
  register(_setting) {
  },
  async get(setting) {
    return window.localStorage.getItem(setting);
  },
  set(setting, value) {
    window.localStorage.setItem(setting, value);
  },
  remove(setting) {
    window.localStorage.removeItem(setting);
  },
  clear: () => window.localStorage.clear()
};
export class MainImpl {
  #readyForTestPromise = Promise.withResolvers();
  #veStartPromise;
  #universe;
  constructor() {
    MainImpl.instanceForTest = this;
    void this.#loaded();
  }
  static time(label) {
    if (Host.InspectorFrontendHost.isUnderTest()) {
      return;
    }
    console.time(label);
  }
  static timeEnd(label) {
    if (Host.InspectorFrontendHost.isUnderTest()) {
      return;
    }
    console.timeEnd(label);
  }
  async #loaded() {
    console.timeStamp("Main._loaded");
    Root.Runtime.Runtime.setPlatform(Host.Platform.platform());
    const [config, prefs] = await Promise.all([
      new Promise((resolve) => {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.getHostConfig(resolve);
      }),
      new Promise(
        (resolve) => Host.InspectorFrontendHost.InspectorFrontendHostInstance.getPreferences(resolve)
      )
    ]);
    console.timeStamp("Main._gotPreferences");
    this.#initializeGlobalsForLayoutTests();
    Object.assign(Root.Runtime.hostConfig, config);
    const creationOptions = {
      settingsCreationOptions: {
        ...this.createSettingsStorage(prefs),
        settingRegistrations: Common.SettingRegistration.getRegisteredSettings(),
        logSettingAccess: VisualLogging.logSettingAccess,
        runSettingsMigration: !Host.InspectorFrontendHost.isUnderTest()
      }
    };
    this.#universe = new Foundation.Universe.Universe(creationOptions);
    Root.DevToolsContext.setGlobalInstance(this.#universe.context);
    await this.requestAndRegisterLocaleData();
    Host.userMetrics.syncSetting(Common.Settings.Settings.instance().moduleSetting("sync-preferences").get());
    const veLogging = config.devToolsVeLogging;
    const veLogsTestMode = Common.Settings.Settings.instance().createSetting("veLogsTestMode", false).get();
    if (veLogging?.enabled) {
      if (veLogging?.testing || veLogsTestMode) {
        VisualLogging.setVeDebugLoggingEnabled(true, VisualLogging.DebugLoggingFormat.TEST);
        const options = {
          processingThrottler: new Common.Throttler.Throttler(0),
          keyboardLogThrottler: new Common.Throttler.Throttler(10),
          hoverLogThrottler: new Common.Throttler.Throttler(50),
          dragLogThrottler: new Common.Throttler.Throttler(50),
          clickLogThrottler: new Common.Throttler.Throttler(10),
          resizeLogThrottler: new Common.Throttler.Throttler(10)
        };
        this.#veStartPromise = VisualLogging.startLogging(options);
      } else {
        this.#veStartPromise = VisualLogging.startLogging();
      }
    }
    void this.#createAppUI();
  }
  #initializeGlobalsForLayoutTests() {
    self.Extensions ||= {};
    self.Host ||= {};
    self.Host.userMetrics ||= Host.userMetrics;
    self.Host.UserMetrics ||= Host.UserMetrics;
    self.ProtocolClient ||= {};
    self.ProtocolClient.test ||= ProtocolClient.InspectorBackend.test;
  }
  async requestAndRegisterLocaleData() {
    const settingLanguage = Common.Settings.Settings.instance().moduleSetting("language").get();
    const devToolsLocale = i18n.DevToolsLocale.DevToolsLocale.instance({
      create: true,
      data: {
        navigatorLanguage: navigator.language,
        settingLanguage,
        lookupClosestDevToolsLocale: i18n.i18n.lookupClosestSupportedDevToolsLocale
      }
    });
    Host.userMetrics.language(devToolsLocale.locale);
    if (devToolsLocale.locale !== "en-US") {
      await i18n.i18n.fetchAndRegisterLocaleData("en-US");
    }
    try {
      await i18n.i18n.fetchAndRegisterLocaleData(devToolsLocale.locale);
    } catch (error) {
      console.warn(
        `Unable to fetch & register locale data for '${devToolsLocale.locale}', falling back to 'en-US'. Cause: `,
        error
      );
      devToolsLocale.forceFallbackLocale();
    }
  }
  createSettingsStorage(prefs) {
    this.#initializeExperiments();
    let storagePrefix = "";
    if (Host.Platform.isCustomDevtoolsFrontend()) {
      storagePrefix = "__custom__";
    } else if (!Root.Runtime.Runtime.queryParam("can_dock") && Boolean(Root.Runtime.Runtime.queryParam("debugFrontend")) && !Host.InspectorFrontendHost.isUnderTest()) {
      storagePrefix = "__bundled__";
    }
    let localStorage;
    if (!Host.InspectorFrontendHost.isUnderTest() && window.localStorage) {
      localStorage = new Common.Settings.SettingsStorage(window.localStorage, WINDOW_LOCAL_STORAGE, storagePrefix);
    } else {
      localStorage = new Common.Settings.SettingsStorage({}, void 0, storagePrefix);
    }
    const hostUnsyncedStorage = {
      register: (name) => Host.InspectorFrontendHost.InspectorFrontendHostInstance.registerPreference(name, { synced: false }),
      set: Host.InspectorFrontendHost.InspectorFrontendHostInstance.setPreference,
      get: (name) => {
        return new Promise((resolve) => {
          Host.InspectorFrontendHost.InspectorFrontendHostInstance.getPreference(name, resolve);
        });
      },
      remove: Host.InspectorFrontendHost.InspectorFrontendHostInstance.removePreference,
      clear: Host.InspectorFrontendHost.InspectorFrontendHostInstance.clearPreferences
    };
    const hostSyncedStorage = {
      ...hostUnsyncedStorage,
      register: (name) => Host.InspectorFrontendHost.InspectorFrontendHostInstance.registerPreference(name, { synced: true })
    };
    const syncedStorage = new Common.Settings.SettingsStorage(prefs, hostSyncedStorage, storagePrefix);
    const globalStorage = new Common.Settings.SettingsStorage(prefs, hostUnsyncedStorage, storagePrefix);
    return { syncedStorage, globalStorage, localStorage };
  }
  #migrateValueFromLegacyToHostExperiment(legacyExperimentName, hostExperiment) {
    const value = Root.Runtime.experiments.getValueFromStorage(legacyExperimentName);
    if (value !== void 0 && hostExperiment.aboutFlag) {
      hostExperiment.setEnabled(value);
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.setChromeFlag(hostExperiment.aboutFlag, value);
    }
  }
  #initializeExperiments() {
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.CAPTURE_NODE_CREATION_STACKS,
      "Capture node creation stacks"
    );
    Root.Runtime.experiments.register(Root.ExperimentNames.ExperimentName.LIVE_HEAP_PROFILE, "Live heap profile");
    const enableProtocolMonitor = (Root.Runtime.hostConfig.devToolsProtocolMonitor?.enabled ?? false) || Boolean(Root.Runtime.Runtime.queryParam("isChromeForTesting"));
    const protocolMonitorExperiment = Root.Runtime.experiments.registerHostExperiment({
      name: Root.ExperimentNames.ExperimentName.PROTOCOL_MONITOR,
      title: "Protocol Monitor",
      aboutFlag: "devtools-protocol-monitor",
      isEnabled: enableProtocolMonitor,
      requiresChromeRestart: false,
      docLink: "https://developer.chrome.com/blog/new-in-devtools-92/#protocol-monitor"
    });
    this.#migrateValueFromLegacyToHostExperiment(
      Root.ExperimentNames.ExperimentName.PROTOCOL_MONITOR,
      protocolMonitorExperiment
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.SAMPLING_HEAP_PROFILER_TIMELINE,
      "Sampling heap profiler timeline"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.SHOW_OPTION_TO_EXPOSE_INTERNALS_IN_HEAP_SNAPSHOT,
      "Show option to expose internals in heap snapshots"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.TIMELINE_INVALIDATION_TRACKING,
      "Performance panel: invalidation tracking"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.TIMELINE_SHOW_ALL_EVENTS,
      "Performance panel: show all events"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.TIMELINE_V8_RUNTIME_CALL_STATS,
      "Performance panel: V8 runtime call stats"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.TIMELINE_DEBUG_MODE,
      "Performance panel: debug mode (trace event details, etc)"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.INSTRUMENTATION_BREAKPOINTS,
      "Instrumentation breakpoints"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.USE_SOURCE_MAP_SCOPES,
      "Use scope information from source maps"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.APCA,
      "Advanced Perceptual Contrast Algorithm (APCA) replacing previous contrast ratio and AA/AAA guidelines",
      "https://developer.chrome.com/blog/new-in-devtools-89/#apca"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.FULL_ACCESSIBILITY_TREE,
      "Full accessibility tree view in the Elements panel",
      "https://developer.chrome.com/blog/new-in-devtools-90/#accessibility-tree",
      "https://g.co/devtools/a11y-tree-feedback"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.FONT_EDITOR,
      "New font editor in the Styles tab",
      "https://developer.chrome.com/blog/new-in-devtools-89/#font"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.EXPERIMENTAL_COOKIE_FEATURES,
      "Experimental cookie features"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.AUTHORED_DEPLOYED_GROUPING,
      "Group sources into authored and deployed trees",
      "https://goo.gle/authored-deployed",
      "https://goo.gle/authored-deployed-feedback"
    );
    Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.JUST_MY_CODE,
      "Hide ignore-listed code in Sources tree view"
    );
    Root.Runtime.experiments.registerHostExperiment({
      name: Root.ExperimentNames.ExperimentName.DURABLE_MESSAGES,
      title: "Durable Messages",
      aboutFlag: "devtools-enable-durable-messages",
      isEnabled: Root.Runtime.hostConfig.devToolsEnableDurableMessages?.enabled ?? false,
      requiresChromeRestart: false
    });
    Root.Runtime.experiments.registerHostExperiment({
      name: Root.ExperimentNames.ExperimentName.JPEG_XL,
      title: "JPEG XL support",
      aboutFlag: "enable-jxl-image-format",
      isEnabled: Root.Runtime.hostConfig.devToolsJpegXlImageFormat?.enabled ?? false,
      requiresChromeRestart: true
    });
    Root.Runtime.experiments.enableExperimentsByDefault([
      Root.ExperimentNames.ExperimentName.FULL_ACCESSIBILITY_TREE,
      Root.ExperimentNames.ExperimentName.USE_SOURCE_MAP_SCOPES
    ]);
    Root.Runtime.experiments.cleanUpStaleExperiments();
    const enabledExperiments = Root.Runtime.Runtime.queryParam("enabledExperiments");
    if (enabledExperiments) {
      Root.Runtime.experiments.setServerEnabledExperiments(enabledExperiments.split(";"));
    }
    if (Host.InspectorFrontendHost.isUnderTest()) {
      const testParam = Root.Runtime.Runtime.queryParam("test");
      if (testParam?.includes("live-line-level-heap-profile.js")) {
        Root.Runtime.experiments.enableForTest(Root.ExperimentNames.ExperimentName.LIVE_HEAP_PROFILE);
      }
    }
    for (const experiment of Root.Runtime.experiments.allConfigurableExperiments()) {
      if (experiment.isEnabled()) {
        Host.userMetrics.experimentEnabledAtLaunch(experiment.name);
      } else {
        Host.userMetrics.experimentDisabledAtLaunch(experiment.name);
      }
    }
  }
  async #createAppUI() {
    MainImpl.time("Main._createAppUI");
    const isolatedFileSystemManager = Persistence.IsolatedFileSystemManager.IsolatedFileSystemManager.instance();
    isolatedFileSystemManager.addEventListener(
      Persistence.IsolatedFileSystemManager.Events.FileSystemError,
      (event) => Snackbar.Snackbar.Snackbar.show({ message: event.data })
    );
    const defaultThemeSetting = "systemPreferred";
    const themeSetting = Common.Settings.Settings.instance().createSetting("ui-theme", defaultThemeSetting);
    UI.UIUtils.initializeUIUtils(document);
    if (!ThemeSupport.ThemeSupport.hasInstance()) {
      ThemeSupport.ThemeSupport.instance({ forceNew: true, setting: themeSetting });
    }
    UI.UIUtils.addPlatformClass(document.documentElement);
    UI.UIUtils.installComponentRootStyles(document.body);
    this.#addMainEventListeners(document);
    const canDock = Boolean(Root.Runtime.Runtime.queryParam("can_dock"));
    UI.ZoomManager.ZoomManager.instance(
      { forceNew: true, win: window, frontendHost: Host.InspectorFrontendHost.InspectorFrontendHostInstance }
    );
    UI.ContextMenu.ContextMenu.initialize();
    UI.ContextMenu.ContextMenu.installHandler(document);
    UI.ViewManager.ViewManager.instance({ forceNew: true, universe: this.#universe });
    Logs.NetworkLog.NetworkLog.instance();
    Logs.LogManager.LogManager.instance();
    IssuesManager.IssuesManager.IssuesManager.instance({
      forceNew: true,
      ensureFirst: true,
      showThirdPartyIssuesSetting: IssuesManager.Issue.getShowThirdPartyIssuesSetting(),
      hideIssueSetting: IssuesManager.IssuesManager.getHideIssueByCodeSetting()
    });
    UI.DockController.DockController.instance({ forceNew: true, canDock });
    SDK.DOMDebuggerModel.DOMDebuggerManager.instance({ forceNew: true });
    const targetManager = SDK.TargetManager.TargetManager.instance();
    targetManager.addEventListener(
      SDK.TargetManager.Events.SUSPEND_STATE_CHANGED,
      this.#onSuspendStateChanged.bind(this)
    );
    Workspace.FileManager.FileManager.instance({ forceNew: true });
    Bindings.NetworkProject.NetworkProjectManager.instance();
    new Bindings.PresentationConsoleMessageHelper.PresentationConsoleMessageManager();
    targetManager.setScopeTarget(targetManager.primaryPageTarget());
    UI.Context.Context.instance().addFlavorChangeListener(SDK.Target.Target, ({ data }) => {
      const outermostTarget = data?.outermostTarget();
      targetManager.setScopeTarget(outermostTarget);
    });
    Breakpoints.BreakpointManager.BreakpointManager.instance({
      forceNew: true,
      workspace: Workspace.Workspace.WorkspaceImpl.instance(),
      targetManager,
      debuggerWorkspaceBinding: Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance()
    });
    self.Extensions.extensionServer = PanelCommon.ExtensionServer.ExtensionServer.instance({ forceNew: true });
    new Persistence.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding(
      isolatedFileSystemManager,
      Workspace.Workspace.WorkspaceImpl.instance()
    );
    isolatedFileSystemManager.addPlatformFileSystem(
      "snippet://",
      new Snippets.ScriptSnippetFileSystem.SnippetFileSystem()
    );
    const persistenceImpl = Persistence.Persistence.PersistenceImpl.instance({
      forceNew: true,
      workspace: Workspace.Workspace.WorkspaceImpl.instance(),
      breakpointManager: Breakpoints.BreakpointManager.BreakpointManager.instance()
    });
    const linkDecorator = new PanelCommon.PersistenceUtils.LinkDecorator(persistenceImpl);
    Components.Linkifier.Linkifier.setLinkDecorator(linkDecorator);
    Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance(
      { forceNew: true, workspace: Workspace.Workspace.WorkspaceImpl.instance() }
    );
    new ExecutionContextSelector(targetManager, UI.Context.Context.instance());
    const projectSettingsModel = ProjectSettings.ProjectSettingsModel.ProjectSettingsModel.instance({
      forceNew: true,
      hostConfig: Root.Runtime.hostConfig,
      pageResourceLoader: SDK.PageResourceLoader.PageResourceLoader.instance(),
      targetManager
    });
    const automaticFileSystemManager = Persistence.AutomaticFileSystemManager.AutomaticFileSystemManager.instance({
      forceNew: true,
      inspectorFrontendHost: Host.InspectorFrontendHost.InspectorFrontendHostInstance,
      projectSettingsModel
    });
    Persistence.AutomaticFileSystemWorkspaceBinding.AutomaticFileSystemWorkspaceBinding.instance({
      forceNew: true,
      automaticFileSystemManager,
      isolatedFileSystemManager,
      workspace: Workspace.Workspace.WorkspaceImpl.instance()
    });
    AutofillManager.AutofillManager.AutofillManager.instance();
    LiveMetrics.LiveMetrics.instance();
    CrUXManager.CrUXManager.instance();
    const builtInAi = AiAssistanceModel.BuiltInAi.BuiltInAi.instance();
    builtInAi.addEventListener(
      AiAssistanceModel.BuiltInAi.Events.DOWNLOADED_AND_SESSION_CREATED,
      () => Snackbar.Snackbar.Snackbar.show({ message: i18nString(UIStrings.aiModelDownloaded) })
    );
    new PauseListener();
    const actionRegistryInstance = UI.ActionRegistry.ActionRegistry.instance({ forceNew: true });
    UI.ShortcutRegistry.ShortcutRegistry.instance({ forceNew: true, actionRegistry: actionRegistryInstance });
    this.#registerMessageSinkListener();
    if (Host.GdpClient.isGdpProfilesAvailable()) {
      void Host.GdpClient.GdpClient.instance().getProfile().then((getProfileResponse) => {
        if (!getProfileResponse) {
          return;
        }
        const { profile, isEligible } = getProfileResponse;
        const hasProfile = Boolean(profile);
        const contextString = hasProfile ? "has-profile" : isEligible ? "no-profile-and-eligible" : "no-profile-and-not-eligible";
        void VisualLogging.logFunctionCall("gdp-client-initialize", contextString);
      });
      void Badges.UserBadges.instance().initialize();
      Badges.UserBadges.instance().addEventListener(Badges.Events.BADGE_TRIGGERED, async (ev) => {
        loadedPanelCommonModule ??= await import("../../panels/common/common.js");
        const badgeNotification = new loadedPanelCommonModule.BadgeNotification();
        const { badge, reason } = ev.data;
        void badgeNotification.present(badge, reason);
      });
    }
    const conversationHandler = AiAssistanceModel.ConversationHandler.ConversationHandler.instance();
    conversationHandler.addEventListener(
      AiAssistanceModel.ConversationHandler.ConversationHandlerEvents.EXTERNAL_REQUEST_RECEIVED,
      () => Snackbar.Snackbar.Snackbar.show({ message: i18nString(UIStrings.externalRequestReceived) })
    );
    conversationHandler.addEventListener(
      AiAssistanceModel.ConversationHandler.ConversationHandlerEvents.EXTERNAL_CONVERSATION_STARTED,
      (event) => void VisualLogging.logFunctionCall(`start-conversation-${event.data}`, "external")
    );
    if (Root.Runtime.hostConfig.devToolsGeminiRebranding?.enabled) {
      await PanelCommon.GeminiRebrandPromoDialog.maybeShow();
    }
    MainImpl.timeEnd("Main._createAppUI");
    const appProvider = Common.AppProvider.getRegisteredAppProviders()[0];
    if (!appProvider) {
      throw new Error("Unable to boot DevTools, as the appprovider is missing");
    }
    await this.#showAppUI(await appProvider.loadAppProvider());
  }
  async #showAppUI(appProvider) {
    MainImpl.time("Main._showAppUI");
    const app = appProvider.createApp();
    UI.DockController.DockController.instance().initialize();
    ThemeSupport.ThemeSupport.instance().fetchColorsAndApplyHostTheme();
    app.presentUI(document);
    if (UI.ActionRegistry.ActionRegistry.instance().hasAction("elements.toggle-element-search")) {
      const toggleSearchNodeAction = UI.ActionRegistry.ActionRegistry.instance().getAction("elements.toggle-element-search");
      Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(
        Host.InspectorFrontendHostAPI.Events.EnterInspectElementMode,
        () => {
          void toggleSearchNodeAction.execute();
        },
        this
      );
    }
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.events.addEventListener(
      Host.InspectorFrontendHostAPI.Events.RevealSourceLine,
      this.#revealSourceLine,
      this
    );
    const inspectorView = UI.InspectorView.InspectorView.instance();
    Persistence.NetworkPersistenceManager.NetworkPersistenceManager.instance().addEventListener(
      Persistence.NetworkPersistenceManager.Events.LOCAL_OVERRIDES_REQUESTED,
      (event) => {
        inspectorView.displaySelectOverrideFolderInfobar(event.data);
      }
    );
    await inspectorView.createToolbars();
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.loadCompleted();
    UI.ARIAUtils.LiveAnnouncer.initializeAnnouncerElements();
    UI.DockController.DockController.instance().announceDockLocation();
    window.setTimeout(this.#initializeTarget.bind(this), 0);
    MainImpl.timeEnd("Main._showAppUI");
  }
  async #initializeTarget() {
    MainImpl.time("Main._initializeTarget");
    for (const runnableInstanceFunction of Common.Runnable.earlyInitializationRunnables()) {
      await runnableInstanceFunction().run();
    }
    await this.#veStartPromise;
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.readyForTest();
    this.#readyForTestPromise.resolve();
    window.setTimeout(this.#lateInitialization.bind(this), 100);
    await this.#maybeInstallVeInspectionBinding();
    MainImpl.timeEnd("Main._initializeTarget");
  }
  async #maybeInstallVeInspectionBinding() {
    const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    const url = primaryPageTarget?.targetInfo()?.url;
    const origin = url ? Common.ParsedURL.ParsedURL.extractOrigin(url) : void 0;
    const binding = "__devtools_ve_inspection_binding__";
    if (primaryPageTarget && await VisualLogging.isUnderInspection(origin)) {
      const runtimeModel = primaryPageTarget.model(SDK.RuntimeModel.RuntimeModel);
      await runtimeModel?.addBinding({ name: binding });
      runtimeModel?.addEventListener(SDK.RuntimeModel.Events.BindingCalled, (event) => {
        if (event.data.name === binding) {
          if (event.data.payload === "true" || event.data.payload === "false") {
            VisualLogging.setVeDebuggingEnabled(event.data.payload === "true", (query) => {
              VisualLogging.setVeDebuggingEnabled(false);
              void runtimeModel?.defaultExecutionContext()?.evaluate(
                {
                  expression: `window.inspect(${JSON.stringify(query)})`,
                  includeCommandLineAPI: false,
                  silent: true,
                  returnByValue: false,
                  generatePreview: false
                },
                /* userGesture */
                false,
                /* awaitPromise */
                false
              );
            });
          } else {
            VisualLogging.setHighlightedVe(event.data.payload === "null" ? null : event.data.payload);
          }
        }
      });
    }
  }
  async #lateInitialization() {
    MainImpl.time("Main._lateInitialization");
    PanelCommon.ExtensionServer.ExtensionServer.instance().initializeExtensions();
    const promises = Common.Runnable.lateInitializationRunnables().map(async (lateInitializationLoader) => {
      const runnable = await lateInitializationLoader();
      return await runnable.run();
    });
    if (Root.Runtime.experiments.isEnabled(Root.ExperimentNames.ExperimentName.LIVE_HEAP_PROFILE)) {
      const PerfUI = await import("../../ui/legacy/components/perf_ui/perf_ui.js");
      const setting = "memory-live-heap-profile";
      if (Common.Settings.Settings.instance().moduleSetting(setting).get()) {
        promises.push(PerfUI.LiveHeapProfile.LiveHeapProfile.instance().run());
      } else {
        const changeListener = async (event) => {
          if (!event.data) {
            return;
          }
          Common.Settings.Settings.instance().moduleSetting(setting).removeChangeListener(changeListener);
          void PerfUI.LiveHeapProfile.LiveHeapProfile.instance().run();
        };
        Common.Settings.Settings.instance().moduleSetting(setting).addChangeListener(changeListener);
      }
    }
    MainImpl.timeEnd("Main._lateInitialization");
  }
  readyForTest() {
    return this.#readyForTestPromise.promise;
  }
  #registerMessageSinkListener() {
    Common.Console.Console.instance().addEventListener(Common.Console.Events.MESSAGE_ADDED, messageAdded);
    function messageAdded({ data: message }) {
      if (message.show) {
        Common.Console.Console.instance().show();
      }
    }
  }
  #revealSourceLine(event) {
    const { url, lineNumber, columnNumber } = event.data;
    const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);
    if (uiSourceCode) {
      void Common.Revealer.reveal(uiSourceCode.uiLocation(lineNumber, columnNumber));
      return;
    }
    function listener(event2) {
      const uiSourceCode2 = event2.data;
      if (uiSourceCode2.url() === url) {
        void Common.Revealer.reveal(uiSourceCode2.uiLocation(lineNumber, columnNumber));
        Workspace.Workspace.WorkspaceImpl.instance().removeEventListener(
          Workspace.Workspace.Events.UISourceCodeAdded,
          listener
        );
      }
    }
    Workspace.Workspace.WorkspaceImpl.instance().addEventListener(
      Workspace.Workspace.Events.UISourceCodeAdded,
      listener
    );
  }
  #postDocumentKeyDown(event) {
    if (!event.handled) {
      UI.ShortcutRegistry.ShortcutRegistry.instance().handleShortcut(event);
    }
  }
  #redispatchClipboardEvent(event) {
    const eventCopy = new CustomEvent("clipboard-" + event.type, { bubbles: true });
    eventCopy["original"] = event;
    const document2 = event.target && event.target.ownerDocument;
    const target = document2 ? UI.DOMUtilities.deepActiveElement(document2) : null;
    if (target) {
      target.dispatchEvent(eventCopy);
    }
    if (eventCopy.handled) {
      event.preventDefault();
    }
  }
  #contextMenuEventFired(event) {
    if (event.handled || event.target.classList.contains("popup-glasspane")) {
      event.preventDefault();
    }
  }
  #addMainEventListeners(document2) {
    document2.addEventListener("keydown", this.#postDocumentKeyDown.bind(this), false);
    document2.addEventListener("beforecopy", this.#redispatchClipboardEvent.bind(this), true);
    document2.addEventListener("copy", this.#redispatchClipboardEvent.bind(this), false);
    document2.addEventListener("cut", this.#redispatchClipboardEvent.bind(this), false);
    document2.addEventListener("paste", this.#redispatchClipboardEvent.bind(this), false);
    document2.addEventListener("contextmenu", this.#contextMenuEventFired.bind(this), true);
  }
  #onSuspendStateChanged() {
    const suspended = SDK.TargetManager.TargetManager.instance().allTargetsSuspended();
    UI.InspectorView.InspectorView.instance().onSuspendStateChanged(suspended);
  }
  static instanceForTest = null;
}
globalThis.Main = globalThis.Main || {};
globalThis.Main.Main = MainImpl;
export class ZoomActionDelegate {
  handleAction(_context, actionId) {
    if (Host.InspectorFrontendHost.InspectorFrontendHostInstance.isHostedMode()) {
      return false;
    }
    switch (actionId) {
      case "main.zoom-in":
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.zoomIn();
        return true;
      case "main.zoom-out":
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.zoomOut();
        return true;
      case "main.zoom-reset":
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.resetZoom();
        return true;
    }
    return false;
  }
}
export class SearchActionDelegate {
  handleAction(_context, actionId) {
    let searchableView = UI.SearchableView.SearchableView.fromElement(
      UI.DOMUtilities.deepActiveElement(document)
    );
    if (!searchableView) {
      const currentPanel = UI.InspectorView.InspectorView.instance().currentPanelDeprecated();
      if (currentPanel?.searchableView) {
        searchableView = currentPanel.searchableView();
      }
      if (!searchableView) {
        return false;
      }
    }
    switch (actionId) {
      case "main.search-in-panel.find":
        return searchableView.handleFindShortcut();
      case "main.search-in-panel.cancel":
        return searchableView.handleCancelSearchShortcut();
      case "main.search-in-panel.find-next":
        return searchableView.handleFindNextShortcut();
      case "main.search-in-panel.find-previous":
        return searchableView.handleFindPreviousShortcut();
    }
    return false;
  }
}
let mainMenuItemInstance;
export class MainMenuItem {
  #item;
  constructor() {
    this.#item = new UI.Toolbar.ToolbarMenuButton(
      this.#handleContextMenu.bind(this),
      /* isIconDropdown */
      true,
      /* useSoftMenu */
      true,
      "main-menu",
      "dots-vertical"
    );
    this.#item.element.classList.add("main-menu");
    this.#item.setTitle(i18nString(UIStrings.customizeAndControlDevtools));
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!mainMenuItemInstance || forceNew) {
      mainMenuItemInstance = new MainMenuItem();
    }
    return mainMenuItemInstance;
  }
  item() {
    return this.#item;
  }
  #handleContextMenu(contextMenu) {
    const dockController = UI.DockController.DockController.instance();
    if (dockController.canDock()) {
      const dockItemElement = document.createElement("div");
      dockItemElement.classList.add("flex-auto", "flex-centered", "location-menu");
      dockItemElement.setAttribute(
        "jslog",
        `${VisualLogging.item("dock-side").track({ keydown: "ArrowDown|ArrowLeft|ArrowRight" })}`
      );
      dockItemElement.tabIndex = -1;
      UI.ARIAUtils.setLabel(dockItemElement, UIStrings.dockSide + UIStrings.dockSideNavigation);
      const [toggleDockSideShortcut] = UI.ShortcutRegistry.ShortcutRegistry.instance().shortcutsForAction("main.toggle-dock");
      render(html`
        <span class="dockside-title"
              title=${i18nString(UIStrings.placementOfDevtoolsRelativeToThe, { PH1: toggleDockSideShortcut.title() })}>
          ${i18nString(UIStrings.dockSide)}
        </span>
        <devtools-toolbar @mousedown=${(event) => event.consume()}>
          <devtools-button class="toolbar-button"
                           jslog=${VisualLogging.toggle().track({ click: true }).context("current-dock-state-undock")}
                           title=${i18nString(UIStrings.undockIntoSeparateWindow)}
                           aria-label=${i18nString(UIStrings.undockIntoSeparateWindow)}
                           .iconName=${"dock-window"}
                           .toggled=${dockController.dockSide() === UI.DockController.DockState.UNDOCKED}
                           .toggledIconName=${"dock-window"}
                           .toggleType=${Buttons.Button.ToggleType.PRIMARY}
                           .variant=${Buttons.Button.Variant.ICON_TOGGLE}
                           @click=${setDockSide.bind(null, UI.DockController.DockState.UNDOCKED)}></devtools-button>
          <devtools-button class="toolbar-button"
                           jslog=${VisualLogging.toggle().track({ click: true }).context("current-dock-state-left")}
                           title=${i18nString(UIStrings.dockToLeft)}
                           aria-label=${i18nString(UIStrings.dockToLeft)}
                           .iconName=${"dock-left"}
                           .toggled=${dockController.dockSide() === UI.DockController.DockState.LEFT}
                           .toggledIconName=${"dock-left"}
                           .toggleType=${Buttons.Button.ToggleType.PRIMARY}
                           .variant=${Buttons.Button.Variant.ICON_TOGGLE}
                           @click=${setDockSide.bind(null, UI.DockController.DockState.LEFT)}></devtools-button>
          <devtools-button class="toolbar-button"
                           jslog=${VisualLogging.toggle().track({ click: true }).context("current-dock-state-bottom")}
                           title=${i18nString(UIStrings.dockToBottom)}
                           aria-label=${i18nString(UIStrings.dockToBottom)}
                           .iconName=${"dock-bottom"}
                           .toggled=${dockController.dockSide() === UI.DockController.DockState.BOTTOM}
                           .toggledIconName=${"dock-bottom"}
                           .toggleType=${Buttons.Button.ToggleType.PRIMARY}
                           .variant=${Buttons.Button.Variant.ICON_TOGGLE}
                           @click=${setDockSide.bind(null, UI.DockController.DockState.BOTTOM)}></devtools-button>
          <devtools-button class="toolbar-button"
                           jslog=${VisualLogging.toggle().track({ click: true }).context("current-dock-state-right")}
                           title=${i18nString(UIStrings.dockToRight)}
                           aria-label=${i18nString(UIStrings.dockToRight)}
                           .iconName=${"dock-right"}
                           .toggled=${dockController.dockSide() === UI.DockController.DockState.RIGHT}
                           .toggledIconName=${"dock-right"}
                           .toggleType=${Buttons.Button.ToggleType.PRIMARY}
                           .variant=${Buttons.Button.Variant.ICON_TOGGLE}
                           @click=${setDockSide.bind(null, UI.DockController.DockState.RIGHT)}></devtools-button>
        </devtools-toolbar>
      `, dockItemElement, { host: this });
      dockItemElement.addEventListener("keydown", (event) => {
        let dir = 0;
        if (event.key === "ArrowLeft") {
          dir = -1;
        } else if (event.key === "ArrowRight") {
          dir = 1;
        } else if (event.key === "ArrowDown") {
          const contextMenuElement = dockItemElement.closest(".soft-context-menu");
          contextMenuElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
          return;
        } else {
          return;
        }
        const buttons = Array.from(dockItemElement.querySelectorAll("devtools-button"));
        let index = buttons.findIndex((button2) => button2.hasFocus());
        index = Platform.NumberUtilities.clamp(index + dir, 0, buttons.length - 1);
        buttons[index].focus();
        event.consume(true);
      });
      contextMenu.headerSection().appendCustomItem(dockItemElement, "dock-side");
    }
    const button = this.#item.element;
    function setDockSide(side) {
      void dockController.once(UI.DockController.Events.AFTER_DOCK_SIDE_CHANGED).then(() => button.focus());
      dockController.setDockSide(side);
      contextMenu.discard();
    }
    contextMenu.defaultSection().appendAction(
      "freestyler.main-menu",
      void 0,
      /* optional */
      true
    );
    contextMenu.defaultSection().appendItem(i18nString(UIStrings.getDevToolsMcp), () => {
      UIHelpers.openInNewTab("https://github.com/ChromeDevTools/chrome-devtools-mcp");
    }, {
      additionalElement: UI.UIUtils.maybeCreateNewBadge("get-devtools-mcp"),
      jslogContext: "get-devtools-mcp"
    });
    contextMenu.defaultSection().appendSeparator();
    if (dockController.dockSide() === UI.DockController.DockState.UNDOCKED) {
      const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
      if (mainTarget && mainTarget.type() === SDK.Target.Type.FRAME) {
        contextMenu.defaultSection().appendAction("inspector-main.focus-debuggee", i18nString(UIStrings.focusDebuggee));
      }
    }
    contextMenu.defaultSection().appendAction(
      "main.toggle-drawer",
      UI.InspectorView.InspectorView.instance().drawerVisible() ? i18nString(UIStrings.hideConsoleDrawer) : i18nString(UIStrings.showConsoleDrawer)
    );
    contextMenu.appendItemsAtLocation("mainMenu");
    const moreTools = contextMenu.defaultSection().appendSubMenuItem(i18nString(UIStrings.moreTools), false, "more-tools");
    const viewExtensions = UI.ViewManager.ViewManager.instance().getRegisteredViewExtensions();
    viewExtensions.sort((extension1, extension2) => {
      const title1 = extension1.title();
      const title2 = extension2.title();
      return title1.localeCompare(title2);
    });
    for (const viewExtension of viewExtensions) {
      const location = viewExtension.location();
      const persistence = viewExtension.persistence();
      const title = viewExtension.title();
      const id = viewExtension.viewId();
      if (id === "issues-pane") {
        moreTools.defaultSection().appendItem(title, () => {
          Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.HAMBURGER_MENU);
          void UI.ViewManager.ViewManager.instance().showView(
            "issues-pane",
            /* userGesture */
            true
          );
        }, { jslogContext: id });
        continue;
      }
      if (persistence !== "closeable") {
        continue;
      }
      if (location !== "drawer-view" && location !== "panel") {
        continue;
      }
      moreTools.defaultSection().appendItem(title, () => {
        void UI.ViewManager.ViewManager.instance().showView(id, true, false);
      }, { isPreviewFeature: viewExtension.isPreviewFeature(), jslogContext: id });
    }
    const helpSubMenu = contextMenu.footerSection().appendSubMenuItem(i18nString(UIStrings.help), false, "help");
    helpSubMenu.appendItemsAtLocation("mainMenuHelp");
  }
}
let settingsButtonProviderInstance;
export class SettingsButtonProvider {
  #settingsButton;
  constructor() {
    this.#settingsButton = UI.Toolbar.Toolbar.createActionButton("settings.show");
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!settingsButtonProviderInstance || forceNew) {
      settingsButtonProviderInstance = new SettingsButtonProvider();
    }
    return settingsButtonProviderInstance;
  }
  item() {
    return this.#settingsButton;
  }
}
export class PauseListener {
  constructor() {
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.DebuggerModel.DebuggerModel,
      SDK.DebuggerModel.Events.DebuggerPaused,
      this.#debuggerPaused,
      this
    );
  }
  #debuggerPaused(event) {
    SDK.TargetManager.TargetManager.instance().removeModelListener(
      SDK.DebuggerModel.DebuggerModel,
      SDK.DebuggerModel.Events.DebuggerPaused,
      this.#debuggerPaused,
      this
    );
    const debuggerModel = event.data;
    const debuggerPausedDetails = debuggerModel.debuggerPausedDetails();
    UI.Context.Context.instance().setFlavor(SDK.Target.Target, debuggerModel.target());
    void Common.Revealer.reveal(debuggerPausedDetails);
  }
}
export function sendOverProtocol(method, params) {
  return new Promise((resolve, reject) => {
    const sendRawMessage = ProtocolClient.InspectorBackend.test.sendRawMessage;
    if (!sendRawMessage) {
      return reject("Unable to send message to test client");
    }
    sendRawMessage(method, params, (err, ...results) => {
      if (err) {
        return reject(err);
      }
      return resolve(results);
    });
  });
}
export class ReloadActionDelegate {
  handleAction(_context, actionId) {
    switch (actionId) {
      case "main.debug-reload":
        Components.Reload.reload();
        return true;
    }
    return false;
  }
}
export async function handleExternalRequest(input) {
  const generator = await handleExternalRequestGenerator(input);
  let result;
  do {
    result = await generator.next();
  } while (!result.done);
  const response = result.value;
  if (response.type === AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR) {
    throw new Error(response.message);
  }
  if (response.type === AiAssistanceModel.AiAgent.ExternalRequestResponseType.ANSWER) {
    return {
      response: response.message,
      devToolsLogs: response.devToolsLogs
    };
  }
  throw new Error("Received no response of type answer or type error");
}
globalThis.handleExternalRequest = handleExternalRequest;
export async function handleExternalRequestGenerator(input) {
  switch (input.kind) {
    case "PERFORMANCE_RELOAD_GATHER_INSIGHTS": {
      const TimelinePanel = await import("../../panels/timeline/timeline.js");
      return TimelinePanel.TimelinePanel.TimelinePanel.handleExternalRecordRequest();
    }
    case "PERFORMANCE_ANALYZE": {
      const TimelinePanel = await import("../../panels/timeline/timeline.js");
      return await TimelinePanel.TimelinePanel.TimelinePanel.handleExternalAnalyzeRequest(input.args.prompt);
    }
    case "NETWORK_DEBUGGER": {
      const AiAssistanceModel2 = await import("../../models/ai_assistance/ai_assistance.js");
      const conversationHandler = AiAssistanceModel2.ConversationHandler.ConversationHandler.instance();
      return await conversationHandler.handleExternalRequest({
        conversationType: AiAssistanceModel2.AiHistoryStorage.ConversationType.NETWORK,
        prompt: input.args.prompt,
        requestUrl: input.args.requestUrl
      });
    }
    case "LIVE_STYLE_DEBUGGER": {
      const AiAssistanceModel2 = await import("../../models/ai_assistance/ai_assistance.js");
      const conversationHandler = AiAssistanceModel2.ConversationHandler.ConversationHandler.instance();
      return await conversationHandler.handleExternalRequest({
        conversationType: AiAssistanceModel2.AiHistoryStorage.ConversationType.STYLING,
        prompt: input.args.prompt,
        selector: input.args.selector
      });
    }
  }
  return async function* () {
    return {
      type: AiAssistanceModel.AiAgent.ExternalRequestResponseType.ERROR,
      // @ts-expect-error
      message: `Debugging with an agent of type '${input.kind}' is not implemented yet.`
    };
  }();
}
globalThis.handleExternalRequestGenerator = handleExternalRequestGenerator;
//# sourceMappingURL=MainImpl.js.map
