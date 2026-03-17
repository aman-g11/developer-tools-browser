"use strict";
import "../../ui/legacy/legacy.js";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as AiCodeCompletion from "../../models/ai_code_completion/ai_code_completion.js";
import * as AiCodeGeneration from "../../models/ai_code_generation/ai_code_generation.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as IssuesManager from "../../models/issues_manager/issues_manager.js";
import * as Logs from "../../models/logs/logs.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as CodeHighlighter from "../../ui/components/code_highlighter/code_highlighter.js";
import * as Highlighting from "../../ui/components/highlighting/highlighting.js";
import * as IssueCounter from "../../ui/components/issue_counter/issue_counter.js";
import { createIcon } from "../../ui/kit/kit.js";
import objectValueStyles from "../../ui/legacy/components/object_ui/objectValue.css.js";
import * as SettingsUI from "../../ui/legacy/components/settings_ui/settings_ui.js";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { AiCodeCompletionSummaryToolbar } from "../common/common.js";
import { ConsoleContextSelector } from "./ConsoleContextSelector.js";
import { ConsoleFilter, FilterType } from "./ConsoleFilter.js";
import { ConsolePinPane } from "./ConsolePinPane.js";
import { ConsolePrompt, Events as ConsolePromptEvents } from "./ConsolePrompt.js";
import { ConsoleSidebar, Events } from "./ConsoleSidebar.js";
import consoleViewStyles from "./consoleView.css.js";
import {
  ConsoleCommand,
  ConsoleCommandResult,
  ConsoleGroupViewMessage,
  ConsoleTableMessageView,
  ConsoleViewMessage,
  getMessageForElement
} from "./ConsoleViewMessage.js";
import { ConsoleViewport } from "./ConsoleViewport.js";
const UIStrings = {
  /**
   * @description Label for button which links to Issues tab, specifying how many issues there are.
   */
  issuesWithColon: "{n, plural, =0 {No Issues} =1 {# Issue:} other {# Issues:}}",
  /**
   * @description Text for the tooltip of the issue counter toolbar item
   */
  issueToolbarTooltipGeneral: "Some problems no longer generate console messages, but are surfaced in the issues tab.",
  /**
   * @description Text for the tooltip of the issue counter toolbar item. The placeholder indicates how many issues
   * there are in the Issues tab broken down by kind.
   * @example {1 page error, 2 breaking changes} issueEnumeration
   */
  issueToolbarClickToView: "Click to view {issueEnumeration}",
  /**
   * @description Text for the tooltip of the issue counter toolbar item. The placeholder indicates how many issues
   * there are in the Issues tab broken down by kind.
   */
  issueToolbarClickToGoToTheIssuesTab: "Click to go to the issues tab",
  /**
   * @description Text in Console View of the Console panel
   */
  findStringInLogs: "Find string in logs",
  /**
   * @description Tooltip text that appears when hovering over the largeicon settings gear in show settings pane setting in console view of the console panel
   */
  consoleSettings: "Console settings",
  /**
   * @description Title of a setting under the Console category that can be invoked through the Command Menu
   */
  groupSimilarMessagesInConsole: "Group similar messages",
  /**
   * @description Title of a setting under the Console category that can be invoked through the Command Menu
   */
  showCorsErrorsInConsole: "CORS errors in console",
  /**
   * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
   * open/show the sidebar.
   */
  showConsoleSidebar: "Show console sidebar",
  /**
   * @description Tooltip for the the console sidebar toggle in the Console panel. Command to
   * open/show the sidebar.
   */
  hideConsoleSidebar: "Hide console sidebar",
  /**
   * @description Screen reader announcement when the sidebar is shown in the Console panel.
   */
  consoleSidebarShown: "Console sidebar shown",
  /**
   * @description Screen reader announcement when the sidebar is hidden in the Console panel.
   */
  consoleSidebarHidden: "Console sidebar hidden",
  /**
   * @description Tooltip text that appears on the setting to preserve log when hovering over the item
   */
  doNotClearLogOnPageReload: "Do not clear log on page reload / navigation",
  /**
   * @description Text to preserve the log after refreshing
   */
  preserveLog: "Preserve log",
  /**
   * @description Text in Console View of the Console panel
   */
  networkMessages: "Network messages",
  /**
   * @description Tooltip text that appears on the setting when hovering over it in Console View of the Console panel
   */
  onlyShowMessagesFromTheCurrentContext: "Only show messages from the current context (`top`, `iframe`, `worker`, extension)",
  /**
   * @description Alternative title text of a setting in Console View of the Console panel
   */
  selectedContextOnly: "Selected context only",
  /**
   * @description Description of a setting that controls whether XMLHttpRequests are logged in the console.
   */
  logXMLHttpRequests: "Log XMLHttpRequests",
  /**
   * @description Tooltip text that appears on the setting when hovering over it in Console View of the Console panel
   */
  eagerlyEvaluateTextInThePrompt: "Eagerly evaluate text in the prompt",
  /**
   * @description Description of a setting that controls whether text typed in the console should be autocompleted from commands executed in the local console history.
   */
  autocompleteFromHistory: "Autocomplete from history",
  /**
   * @description Description of a setting that controls whether user activation is triggered by evaluation'.
   */
  treatEvaluationAsUserActivation: "Treat evaluation as user activation",
  /**
   * @description Text in Console View of the Console panel, indicating that a number of console
   * messages have been hidden.
   */
  sHidden: "{n, plural, =1 {# hidden} other {# hidden}}",
  /**
   * @description Alert message for screen readers when the console is cleared
   */
  consoleCleared: "Console cleared",
  /**
   * @description Text in Console View of the Console panel
   * @example {index.js} PH1
   */
  hideMessagesFromS: "Hide messages from {PH1}",
  /**
   * @description Text to save content as a specific file type
   */
  saveAs: "Save as\u2026",
  /**
   * @description Text to copy Console log to clipboard
   */
  copyConsole: "Copy console",
  /**
   * @description A context menu item in the Console View of the Console panel
   */
  copyVisibleStyledSelection: "Copy visible styled selection",
  /**
   * @description Text to replay an XHR request
   */
  replayXhr: "Replay XHR",
  /**
   * @description Text to indicate DevTools is writing to a file
   */
  writingFile: "Writing file\u2026",
  /**
   * @description Text to indicate the searching is in progress
   */
  searching: "Searching\u2026",
  /**
   * @description Text in Console View of the Console panel
   */
  egEventdCdnUrlacom: "e.g. `/eventd/ -cdn url:a.com`",
  /**
   * @description Sdk console message message level verbose of level Labels in Console View of the Console panel
   */
  verbose: "Verbose",
  /**
   * @description Sdk console message message level info of level Labels in Console View of the Console panel
   */
  info: "Info",
  /**
   * @description Sdk console message message level warning of level Labels in Console View of the Console panel
   */
  warnings: "Warnings",
  /**
   * @description Text for errors
   */
  errors: "Errors",
  /**
   * @description Tooltip text of the info icon shown next to the filter drop down
   *              in the Console panels main toolbar when the sidebar is active.
   */
  overriddenByFilterSidebar: "Log levels are controlled by the console sidebar.",
  /**
   * @description Text in Console View of the Console panel
   */
  customLevels: "Custom levels",
  /**
   * @description Text in Console View of the Console panel
   * @example {Warnings} PH1
   */
  sOnly: "{PH1} only",
  /**
   * @description Text in Console View of the Console panel
   */
  allLevels: "All levels",
  /**
   * @description Text in Console View of the Console panel
   */
  defaultLevels: "Default levels",
  /**
   * @description Text in Console View of the Console panel
   */
  hideAll: "Hide all",
  /**
   * @description Title of level menu button in console view of the console panel
   * @example {All levels} PH1
   */
  logLevelS: "Log level: {PH1}",
  /**
   * @description A context menu item in the Console View of the Console panel
   */
  default: "Default",
  /**
   * @description Text summary to indicate total number of messages in console for accessibility/screen readers.
   * @example {5} PH1
   */
  filteredMessagesInConsole: "{PH1} messages in console"
};
const str_ = i18n.i18n.registerUIStrings("panels/console/ConsoleView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
let consoleViewInstance;
const MIN_HISTORY_LENGTH_FOR_DISABLING_SELF_XSS_WARNING = 5;
const DISCLAIMER_TOOLTIP_ID = "console-ai-code-completion-disclaimer-tooltip";
const SPINNER_TOOLTIP_ID = "console-ai-code-completion-spinner-tooltip";
const CITATIONS_TOOLTIP_ID = "console-ai-code-completion-citations-tooltip";
export class ConsoleView extends UI.Widget.VBox {
  #searchableView;
  sidebar;
  isSidebarOpen;
  filter;
  consoleToolbarContainer;
  splitWidget;
  contentsElement;
  visibleViewMessages;
  hiddenByFilterCount;
  shouldBeHiddenCache;
  lastShownHiddenByFilterCount;
  currentMatchRangeIndex;
  searchRegex;
  groupableMessages;
  groupableMessageTitle;
  shortcuts;
  regexMatchRanges;
  consoleContextSelector;
  filterStatusText;
  showSettingsPaneSetting;
  showSettingsPaneButton;
  progressToolbarItem;
  groupSimilarSetting;
  showCorsErrorsSetting;
  timestampsSetting;
  consoleHistoryAutocompleteSetting;
  selfXssWarningDisabledSetting;
  pinPane;
  viewport;
  messagesElement;
  messagesCountElement;
  viewportThrottler;
  pendingBatchResize;
  onMessageResizedBound;
  promptElement;
  linkifier;
  consoleMessages;
  consoleGroupStarts;
  prompt;
  immediatelyFilterMessagesForTest;
  maybeDirtyWhileMuted;
  scheduledRefreshPromiseForTest;
  needsFullUpdate;
  buildHiddenCacheTimeout;
  searchShouldJumpBackwards;
  searchProgressIndicator;
  #searchTimeoutId;
  muteViewportUpdates;
  waitForScrollTimeout;
  issueCounter;
  pendingSidebarMessages = [];
  userHasOpenedSidebarAtLeastOnce = false;
  issueToolbarThrottle;
  requestResolver = new Logs.RequestResolver.RequestResolver();
  issueResolver = new IssuesManager.IssueResolver.IssueResolver();
  #isDetached = false;
  #onIssuesCountUpdateBound = this.#onIssuesCountUpdate.bind(this);
  aiCodeCompletionConfig;
  aiCodeCompletionSummaryToolbarContainer;
  aiCodeCompletionSummaryToolbar;
  constructor(viewportThrottlerTimeout) {
    super();
    this.setMinimumSize(0, 35);
    this.registerRequiredCSS(consoleViewStyles, objectValueStyles, CodeHighlighter.codeHighlighterStyles);
    this.#searchableView = new UI.SearchableView.SearchableView(this, null);
    this.#searchableView.element.classList.add("console-searchable-view");
    this.#searchableView.setPlaceholder(i18nString(UIStrings.findStringInLogs));
    this.#searchableView.setMinimalSearchQuerySize(0);
    this.sidebar = new ConsoleSidebar();
    this.sidebar.addEventListener(Events.FILTER_SELECTED, this.onFilterChanged.bind(this));
    this.isSidebarOpen = false;
    this.filter = new ConsoleViewFilter(this.onFilterChanged.bind(this));
    this.consoleToolbarContainer = this.element.createChild("div", "console-toolbar-container");
    this.consoleToolbarContainer.role = "toolbar";
    this.splitWidget = new UI.SplitWidget.SplitWidget(
      true,
      false,
      "console.sidebar.width",
      100
    );
    this.splitWidget.setMainWidget(this.#searchableView);
    this.splitWidget.setSidebarWidget(this.sidebar);
    this.splitWidget.show(this.element);
    this.splitWidget.hideSidebar();
    this.splitWidget.enableShowModeSaving();
    this.isSidebarOpen = this.splitWidget.showMode() === UI.SplitWidget.ShowMode.BOTH;
    this.filter.setLevelMenuOverridden(this.isSidebarOpen);
    this.splitWidget.addEventListener(UI.SplitWidget.Events.SHOW_MODE_CHANGED, (event) => {
      this.isSidebarOpen = event.data === UI.SplitWidget.ShowMode.BOTH;
      if (this.isSidebarOpen) {
        if (!this.userHasOpenedSidebarAtLeastOnce) {
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleSidebarOpened);
          this.userHasOpenedSidebarAtLeastOnce = true;
        }
        this.pendingSidebarMessages.forEach((message) => {
          this.sidebar.onMessageAdded(message);
        });
        this.pendingSidebarMessages = [];
      }
      this.filter.setLevelMenuOverridden(this.isSidebarOpen);
      this.onFilterChanged();
    });
    this.contentsElement = this.#searchableView.element;
    this.element.classList.add("console-view");
    this.visibleViewMessages = [];
    this.hiddenByFilterCount = 0;
    this.shouldBeHiddenCache = /* @__PURE__ */ new Set();
    this.groupableMessages = /* @__PURE__ */ new Map();
    this.groupableMessageTitle = /* @__PURE__ */ new Map();
    this.shortcuts = /* @__PURE__ */ new Map();
    this.regexMatchRanges = [];
    this.consoleContextSelector = new ConsoleContextSelector();
    this.filterStatusText = new UI.Toolbar.ToolbarText();
    this.filterStatusText.element.classList.add("dimmed");
    this.showSettingsPaneSetting = Common.Settings.Settings.instance().createSetting("console-show-settings-toolbar", false);
    this.showSettingsPaneButton = new UI.Toolbar.ToolbarSettingToggle(
      this.showSettingsPaneSetting,
      "gear",
      i18nString(UIStrings.consoleSettings),
      "gear-filled"
    );
    this.showSettingsPaneButton.element.setAttribute(
      "jslog",
      `${VisualLogging.toggleSubpane("console-settings").track({ click: true })}`
    );
    this.progressToolbarItem = new UI.Toolbar.ToolbarItem(document.createElement("div"));
    this.groupSimilarSetting = Common.Settings.Settings.instance().moduleSetting("console-group-similar");
    this.groupSimilarSetting.addChangeListener(() => this.updateMessageList());
    this.showCorsErrorsSetting = Common.Settings.Settings.instance().moduleSetting("console-shows-cors-errors");
    this.showCorsErrorsSetting.addChangeListener(() => this.updateMessageList());
    const toolbar = this.consoleToolbarContainer.createChild("devtools-toolbar", "console-main-toolbar");
    toolbar.setAttribute("jslog", `${VisualLogging.toolbar()}`);
    toolbar.role = "presentation";
    toolbar.wrappable = true;
    toolbar.appendToolbarItem(this.splitWidget.createShowHideSidebarButton(
      i18nString(UIStrings.showConsoleSidebar),
      i18nString(UIStrings.hideConsoleSidebar),
      i18nString(UIStrings.consoleSidebarShown),
      i18nString(UIStrings.consoleSidebarHidden),
      "console-sidebar"
    ));
    toolbar.appendToolbarItem(UI.Toolbar.Toolbar.createActionButton("console.clear"));
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this.consoleContextSelector.toolbarItem());
    toolbar.appendSeparator();
    const liveExpressionButton = UI.Toolbar.Toolbar.createActionButton("console.create-pin");
    toolbar.appendToolbarItem(liveExpressionButton);
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this.filter.textFilterUI);
    toolbar.appendToolbarItem(this.filter.levelMenuButton);
    toolbar.appendToolbarItem(this.filter.levelMenuButtonInfo);
    toolbar.appendToolbarItem(this.progressToolbarItem);
    toolbar.appendSeparator();
    this.issueCounter = new IssueCounter.IssueCounter.IssueCounter();
    this.issueCounter.id = "console-issues-counter";
    this.issueCounter.setAttribute("jslog", `${VisualLogging.counter("issues").track({ click: true })}`);
    const issuesToolbarItem = new UI.Toolbar.ToolbarItem(this.issueCounter);
    this.issueCounter.data = {
      clickHandler: () => {
        Host.userMetrics.issuesPanelOpenedFrom(Host.UserMetrics.IssueOpener.STATUS_BAR_ISSUES_COUNTER);
        void UI.ViewManager.ViewManager.instance().showView("issues-pane");
      },
      issuesManager: IssuesManager.IssuesManager.IssuesManager.instance(),
      accessibleName: i18nString(UIStrings.issueToolbarTooltipGeneral),
      displayMode: IssueCounter.IssueCounter.DisplayMode.OMIT_EMPTY
    };
    toolbar.appendToolbarItem(issuesToolbarItem);
    toolbar.appendSeparator();
    toolbar.appendToolbarItem(this.filterStatusText);
    toolbar.appendToolbarItem(this.showSettingsPaneButton);
    const monitoringXHREnabledSetting = Common.Settings.Settings.instance().moduleSetting("monitoring-xhr-enabled");
    this.timestampsSetting = Common.Settings.Settings.instance().moduleSetting("console-timestamps-enabled");
    this.consoleHistoryAutocompleteSetting = Common.Settings.Settings.instance().moduleSetting("console-history-autocomplete");
    this.selfXssWarningDisabledSetting = Common.Settings.Settings.instance().createSetting(
      "disable-self-xss-warning",
      false,
      Common.Settings.SettingStorageType.SYNCED
    );
    const settingsPane = this.contentsElement.createChild("div", "console-settings-pane");
    UI.ARIAUtils.setLabel(settingsPane, i18nString(UIStrings.consoleSettings));
    UI.ARIAUtils.markAsGroup(settingsPane);
    const consoleEagerEvalSetting = Common.Settings.Settings.instance().moduleSetting("console-eager-eval");
    const preserveConsoleLogSetting = Common.Settings.Settings.instance().moduleSetting("preserve-console-log");
    const userActivationEvalSetting = Common.Settings.Settings.instance().moduleSetting("console-user-activation-eval");
    settingsPane.append(
      SettingsUI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.networkMessages),
        this.filter.networkMessagesSetting,
        this.filter.networkMessagesSetting.title()
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.logXMLHttpRequests),
        monitoringXHREnabledSetting
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.preserveLog),
        preserveConsoleLogSetting,
        i18nString(UIStrings.doNotClearLogOnPageReload)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        consoleEagerEvalSetting.title(),
        consoleEagerEvalSetting,
        i18nString(UIStrings.eagerlyEvaluateTextInThePrompt)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        i18nString(UIStrings.selectedContextOnly),
        this.filter.filterByExecutionContextSetting,
        i18nString(UIStrings.onlyShowMessagesFromTheCurrentContext)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        this.consoleHistoryAutocompleteSetting.title(),
        this.consoleHistoryAutocompleteSetting,
        i18nString(UIStrings.autocompleteFromHistory)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        this.groupSimilarSetting.title(),
        this.groupSimilarSetting,
        i18nString(UIStrings.groupSimilarMessagesInConsole)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        userActivationEvalSetting.title(),
        userActivationEvalSetting,
        i18nString(UIStrings.treatEvaluationAsUserActivation)
      ),
      SettingsUI.SettingsUI.createSettingCheckbox(
        this.showCorsErrorsSetting.title(),
        this.showCorsErrorsSetting,
        i18nString(UIStrings.showCorsErrorsInConsole)
      )
    );
    if (!this.showSettingsPaneSetting.get()) {
      settingsPane.classList.add("hidden");
    }
    this.showSettingsPaneSetting.addChangeListener(
      () => settingsPane.classList.toggle("hidden", !this.showSettingsPaneSetting.get())
    );
    this.pinPane = new ConsolePinPane(() => this.prompt.focus());
    this.pinPane.element.classList.add("console-view-pinpane");
    this.pinPane.element.classList.remove("flex-auto");
    this.pinPane.show(this.contentsElement);
    this.viewport = new ConsoleViewport(this);
    this.viewport.setStickToBottom(true);
    this.viewport.contentElement().classList.add("console-group", "console-group-messages");
    this.contentsElement.appendChild(this.viewport.element);
    this.messagesElement = this.viewport.element;
    this.messagesElement.id = "console-messages";
    this.messagesElement.classList.add("monospace");
    this.messagesElement.addEventListener("click", this.messagesClicked.bind(this), false);
    ["paste", "clipboard-paste", "drop"].forEach((type) => {
      this.messagesElement.addEventListener(type, this.messagesPasted.bind(this), true);
    });
    this.messagesCountElement = this.consoleToolbarContainer.createChild("div", "message-count");
    UI.ARIAUtils.markAsPoliteLiveRegion(this.messagesCountElement, false);
    this.viewportThrottler = new Common.Throttler.Throttler(viewportThrottlerTimeout);
    this.pendingBatchResize = false;
    this.onMessageResizedBound = (e) => {
      void this.onMessageResized(e);
    };
    this.promptElement = this.messagesElement.createChild("div", "source-code");
    this.promptElement.id = "console-prompt";
    const selectAllFixer = this.messagesElement.createChild("div", "console-view-fix-select-all");
    selectAllFixer.textContent = ".";
    UI.ARIAUtils.setHidden(selectAllFixer, true);
    this.registerShortcuts();
    this.messagesElement.addEventListener("contextmenu", this.handleContextMenuEvent.bind(this), false);
    const throttler = new Common.Throttler.Throttler(100);
    const refilterMessages = () => throttler.schedule(async () => this.onFilterChanged());
    this.linkifier = new Components.Linkifier.Linkifier(UI.UIUtils.MaxLengthForDisplayedURLsInConsole);
    this.linkifier.addEventListener(Components.Linkifier.Events.LIVE_LOCATION_UPDATED, refilterMessages);
    this.consoleMessages = [];
    this.consoleGroupStarts = [];
    const devtoolsLocale = i18n.DevToolsLocale.DevToolsLocale.instance();
    this.aiCodeCompletionConfig = AiCodeCompletion.AiCodeCompletion.AiCodeCompletion.isAiCodeCompletionEnabled(devtoolsLocale.locale) ? {
      completionContext: {
        getPrefix: this.getConsoleMessageHistory.bind(this),
        additionalFiles: [{
          path: "devtools-console-context.js",
          content: AiCodeCompletion.AiCodeCompletion.consoleAdditionalContextFileContent,
          included_reason: Host.AidaClient.Reason.RELATED_FILE
        }],
        stopSequences: ["\n\n"]
      },
      generationContext: {
        additionalPreambleContext: AiCodeGeneration.AiCodeGeneration.additionalContextForConsole
      },
      onFeatureEnabled: () => {
        this.setupAiCodeCompletion();
      },
      onFeatureDisabled: () => {
        this.cleanupAiCodeCompletion();
      },
      onSuggestionAccepted: this.#onAiCodeCompletionSuggestionAccepted.bind(this),
      onRequestTriggered: this.#onAiCodeCompletionRequestTriggered.bind(this),
      onResponseReceived: this.#onAiCodeCompletionResponseReceived.bind(this),
      panel: AiCodeCompletion.AiCodeCompletion.ContextFlavor.CONSOLE
    } : void 0;
    this.prompt = new ConsolePrompt(this.aiCodeCompletionConfig);
    this.prompt.show(this.promptElement);
    this.prompt.element.addEventListener("keydown", this.promptKeyDown.bind(this), true);
    this.prompt.addEventListener(ConsolePromptEvents.TEXT_CHANGED, this.promptTextChanged, this);
    this.messagesElement.addEventListener("keydown", this.messagesKeyDown.bind(this), false);
    this.prompt.element.addEventListener("focusin", () => {
      if (this.isScrolledToBottom()) {
        this.viewport.setStickToBottom(true);
      }
    });
    this.consoleHistoryAutocompleteSetting.addChangeListener(this.consoleHistoryAutocompleteChanged, this);
    this.consoleHistoryAutocompleteChanged();
    this.updateFilterStatus();
    this.timestampsSetting.addChangeListener(this.consoleTimestampsSettingChanged, this);
    this.registerWithMessageSink();
    UI.Context.Context.instance().addFlavorChangeListener(
      SDK.RuntimeModel.ExecutionContext,
      this.executionContextChanged,
      this
    );
    this.messagesElement.addEventListener(
      "mousedown",
      (event) => this.updateStickToBottomOnPointerDown(event.button === 2),
      false
    );
    this.messagesElement.addEventListener("mouseup", this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener("mouseleave", this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener("wheel", this.updateStickToBottomOnWheel.bind(this), false);
    this.messagesElement.addEventListener("touchstart", this.updateStickToBottomOnPointerDown.bind(this, false), false);
    this.messagesElement.addEventListener("touchend", this.updateStickToBottomOnPointerUp.bind(this), false);
    this.messagesElement.addEventListener("touchcancel", this.updateStickToBottomOnPointerUp.bind(this), false);
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ConsoleModel.ConsoleModel,
      SDK.ConsoleModel.Events.ConsoleCleared,
      this.consoleCleared,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ConsoleModel.ConsoleModel,
      SDK.ConsoleModel.Events.MessageAdded,
      this.onConsoleMessageAdded,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ConsoleModel.ConsoleModel,
      SDK.ConsoleModel.Events.MessageUpdated,
      this.onConsoleMessageUpdated,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ConsoleModel.ConsoleModel,
      SDK.ConsoleModel.Events.CommandEvaluated,
      this.commandEvaluated,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.ConsoleModel.ConsoleModel, this, { scoped: true });
    const issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
    this.issueToolbarThrottle = new Common.Throttler.Throttler(100);
    issuesManager.addEventListener(
      IssuesManager.IssuesManager.Events.ISSUES_COUNT_UPDATED,
      this.#onIssuesCountUpdateBound
    );
  }
  static instance(opts) {
    if (!consoleViewInstance || opts?.forceNew) {
      consoleViewInstance = new ConsoleView(opts?.viewportThrottlerTimeout ?? 50);
    }
    return consoleViewInstance;
  }
  createAiCodeCompletionSummaryToolbar() {
    if (this.aiCodeCompletionSummaryToolbar) {
      return;
    }
    this.aiCodeCompletionSummaryToolbar = new AiCodeCompletionSummaryToolbar({
      citationsTooltipId: CITATIONS_TOOLTIP_ID,
      disclaimerTooltipId: DISCLAIMER_TOOLTIP_ID,
      spinnerTooltipId: SPINNER_TOOLTIP_ID,
      panel: AiCodeCompletion.AiCodeCompletion.ContextFlavor.CONSOLE
    });
    this.aiCodeCompletionSummaryToolbarContainer = this.element.createChild("div", "ai-code-completion-summary-toolbar-container");
    this.aiCodeCompletionSummaryToolbar.show(this.aiCodeCompletionSummaryToolbarContainer, void 0, true);
  }
  #onAiCodeCompletionSuggestionAccepted(citations) {
    if (!this.aiCodeCompletionSummaryToolbar || citations.length === 0) {
      return;
    }
    const citationsUri = citations.map((citation) => citation.uri).filter((uri) => Boolean(uri));
    this.aiCodeCompletionSummaryToolbar.updateCitations(citationsUri);
  }
  #onAiCodeCompletionRequestTriggered() {
    this.aiCodeCompletionSummaryToolbar?.setLoading(true);
  }
  #onAiCodeCompletionResponseReceived() {
    this.aiCodeCompletionSummaryToolbar?.setLoading(false);
  }
  clearConsole() {
    SDK.ConsoleModel.ConsoleModel.requestClearMessages();
    this.prompt.clearAiCodeCompletionCache();
  }
  #onIssuesCountUpdate() {
    void this.issueToolbarThrottle.schedule(async () => this.updateIssuesToolbarItem());
    this.issuesCountUpdatedForTest();
  }
  issuesCountUpdatedForTest() {
  }
  modelAdded(model) {
    model.messages().forEach(this.addConsoleMessage, this);
  }
  modelRemoved(model) {
    if (!Common.Settings.Settings.instance().moduleSetting("preserve-console-log").get() && model.target().outermostTarget() === model.target()) {
      this.consoleCleared();
    }
  }
  onFilterChanged() {
    this.filter.currentFilter.levelsMask = this.isSidebarOpen ? ConsoleFilter.allLevelsFilterValue() : this.filter.messageLevelFiltersSetting.get();
    this.cancelBuildHiddenCache();
    if (this.immediatelyFilterMessagesForTest) {
      for (const viewMessage of this.consoleMessages) {
        this.computeShouldMessageBeVisible(viewMessage);
      }
      this.updateMessageList();
      return;
    }
    this.buildHiddenCache(0, this.consoleMessages.slice());
  }
  setImmediatelyFilterMessagesForTest() {
    this.immediatelyFilterMessagesForTest = true;
  }
  searchableView() {
    return this.#searchableView;
  }
  clearHistory() {
    this.prompt.history().clear();
    this.prompt.clearAiCodeCompletionCache();
  }
  consoleHistoryAutocompleteChanged() {
    this.prompt.setAddCompletionsFromHistory(this.consoleHistoryAutocompleteSetting.get());
  }
  itemCount() {
    return this.visibleViewMessages.length;
  }
  itemElement(index) {
    return this.visibleViewMessages[index];
  }
  fastHeight(index) {
    return this.visibleViewMessages[index].fastHeight();
  }
  minimumRowHeight() {
    return 16;
  }
  registerWithMessageSink() {
    Common.Console.Console.instance().messages().forEach(this.addSinkMessage, this);
    Common.Console.Console.instance().addEventListener(Common.Console.Events.MESSAGE_ADDED, ({ data: message }) => {
      this.addSinkMessage(message);
    }, this);
  }
  addSinkMessage(message) {
    let level = Protocol.Log.LogEntryLevel.Verbose;
    switch (message.level) {
      case Common.Console.MessageLevel.INFO:
        level = Protocol.Log.LogEntryLevel.Info;
        break;
      case Common.Console.MessageLevel.ERROR:
        level = Protocol.Log.LogEntryLevel.Error;
        break;
      case Common.Console.MessageLevel.WARNING:
        level = Protocol.Log.LogEntryLevel.Warning;
        break;
    }
    const source = message.source || Protocol.Log.LogEntrySource.Other;
    const consoleMessage = new SDK.ConsoleModel.ConsoleMessage(
      null,
      source,
      level,
      message.text,
      { type: SDK.ConsoleModel.FrontendMessageType.System, timestamp: message.timestamp }
    );
    this.addConsoleMessage(consoleMessage);
  }
  consoleTimestampsSettingChanged() {
    this.updateMessageList();
    this.consoleMessages.forEach((viewMessage) => viewMessage.updateTimestamp());
    this.groupableMessageTitle.forEach((viewMessage) => viewMessage.updateTimestamp());
  }
  executionContextChanged() {
    this.prompt.clearAutocomplete();
  }
  willHide() {
    super.willHide();
    this.hidePromptSuggestBox();
  }
  wasShown() {
    super.wasShown();
    if (this.#isDetached) {
      const issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
      issuesManager.addEventListener(
        IssuesManager.IssuesManager.Events.ISSUES_COUNT_UPDATED,
        this.#onIssuesCountUpdateBound
      );
    }
    this.#isDetached = false;
    this.updateIssuesToolbarItem();
    this.viewport.refresh();
  }
  focus() {
    if (this.viewport.hasVirtualSelection()) {
      this.viewport.contentElement().focus();
    } else {
      this.focusPrompt();
    }
  }
  focusPrompt() {
    if (!this.prompt.hasFocus()) {
      const oldStickToBottom = this.viewport.stickToBottom();
      const oldScrollTop = this.viewport.element.scrollTop;
      this.prompt.focus();
      this.viewport.setStickToBottom(oldStickToBottom);
      this.viewport.element.scrollTop = oldScrollTop;
    }
  }
  restoreScrollPositions() {
    if (this.viewport.stickToBottom()) {
      this.immediatelyScrollToBottom();
    } else {
      super.restoreScrollPositions();
    }
  }
  onResize() {
    this.scheduleViewportRefresh();
    this.hidePromptSuggestBox();
    if (this.viewport.stickToBottom()) {
      this.immediatelyScrollToBottom();
    }
    for (let i = 0; i < this.visibleViewMessages.length; ++i) {
      this.visibleViewMessages[i].onResize();
    }
  }
  hidePromptSuggestBox() {
    this.prompt.clearAutocomplete();
  }
  async invalidateViewport() {
    this.updateIssuesToolbarItem();
    if (this.muteViewportUpdates) {
      this.maybeDirtyWhileMuted = true;
      return;
    }
    if (this.needsFullUpdate) {
      this.updateMessageList();
      delete this.needsFullUpdate;
    } else {
      this.viewport.invalidate();
    }
    return;
  }
  onDetach() {
    this.#isDetached = true;
    const issuesManager = IssuesManager.IssuesManager.IssuesManager.instance();
    issuesManager.removeEventListener(
      IssuesManager.IssuesManager.Events.ISSUES_COUNT_UPDATED,
      this.#onIssuesCountUpdateBound
    );
  }
  updateIssuesToolbarItem() {
    if (this.#isDetached) {
      return;
    }
    const manager = IssuesManager.IssuesManager.IssuesManager.instance();
    const issueEnumeration = IssueCounter.IssueCounter.getIssueCountsEnumeration(manager);
    const issuesTitleGotoIssues = manager.numberOfIssues() === 0 ? i18nString(UIStrings.issueToolbarClickToGoToTheIssuesTab) : i18nString(UIStrings.issueToolbarClickToView, { issueEnumeration });
    const issuesTitleGeneral = i18nString(UIStrings.issueToolbarTooltipGeneral);
    const issuesTitle = `${issuesTitleGeneral} ${issuesTitleGotoIssues}`;
    UI.Tooltip.Tooltip.install(this.issueCounter, issuesTitle);
    this.issueCounter.data = {
      ...this.issueCounter.data,
      leadingText: i18nString(UIStrings.issuesWithColon, { n: manager.numberOfIssues() }),
      accessibleName: issuesTitle
    };
  }
  scheduleViewportRefresh() {
    if (this.muteViewportUpdates) {
      this.maybeDirtyWhileMuted = true;
      return;
    }
    this.scheduledRefreshPromiseForTest = this.viewportThrottler.schedule(this.invalidateViewport.bind(this));
  }
  getScheduledRefreshPromiseForTest() {
    return this.scheduledRefreshPromiseForTest;
  }
  immediatelyScrollToBottom() {
    this.viewport.setStickToBottom(true);
    this.promptElement.scrollIntoView(true);
  }
  updateFilterStatus() {
    if (this.hiddenByFilterCount === this.lastShownHiddenByFilterCount) {
      return;
    }
    this.filterStatusText.setText(i18nString(UIStrings.sHidden, { n: this.hiddenByFilterCount }));
    this.filterStatusText.setVisible(Boolean(this.hiddenByFilterCount));
    this.lastShownHiddenByFilterCount = this.hiddenByFilterCount;
  }
  onConsoleMessageAdded(event) {
    const message = event.data;
    this.addConsoleMessage(message);
  }
  addConsoleMessage(message) {
    const viewMessage = this.createViewMessage(message);
    consoleMessageToViewMessage.set(message, viewMessage);
    if (message.type === SDK.ConsoleModel.FrontendMessageType.Command || message.type === SDK.ConsoleModel.FrontendMessageType.Result) {
      const lastMessage = this.consoleMessages[this.consoleMessages.length - 1];
      const newTimestamp = lastMessage && messagesSortedBySymbol.get(lastMessage) || 0;
      messagesSortedBySymbol.set(viewMessage, newTimestamp);
    } else {
      messagesSortedBySymbol.set(viewMessage, viewMessage.consoleMessage().timestamp);
    }
    let insertAt;
    if (!this.consoleMessages.length || timeComparator(viewMessage, this.consoleMessages[this.consoleMessages.length - 1]) > 0) {
      insertAt = this.consoleMessages.length;
    } else {
      insertAt = Platform.ArrayUtilities.upperBound(this.consoleMessages, viewMessage, timeComparator);
    }
    const insertedInMiddle = insertAt < this.consoleMessages.length;
    this.consoleMessages.splice(insertAt, 0, viewMessage);
    if (message.type === SDK.ConsoleModel.FrontendMessageType.Command) {
      this.prompt.history().pushHistoryItem(message.messageText);
      if (this.prompt.history().length() >= MIN_HISTORY_LENGTH_FOR_DISABLING_SELF_XSS_WARNING && !this.selfXssWarningDisabledSetting.get()) {
        this.selfXssWarningDisabledSetting.set(true);
      }
    } else if (message.type !== SDK.ConsoleModel.FrontendMessageType.Result) {
      const consoleGroupStartIndex = Platform.ArrayUtilities.upperBound(this.consoleGroupStarts, viewMessage, timeComparator) - 1;
      if (consoleGroupStartIndex >= 0) {
        const currentGroup = this.consoleGroupStarts[consoleGroupStartIndex];
        addToGroup(viewMessage, currentGroup);
      }
      if (message.isGroupStartMessage()) {
        insertAt = Platform.ArrayUtilities.upperBound(this.consoleGroupStarts, viewMessage, timeComparator);
        this.consoleGroupStarts.splice(insertAt, 0, viewMessage);
      }
    }
    this.filter.onMessageAdded(message);
    if (this.isSidebarOpen) {
      this.sidebar.onMessageAdded(viewMessage);
    } else {
      this.pendingSidebarMessages.push(viewMessage);
    }
    let shouldGoIntoGroup = false;
    const shouldGroupSimilar = this.groupSimilarSetting.get();
    if (message.isGroupable()) {
      const groupKey = viewMessage.groupKey();
      shouldGoIntoGroup = shouldGroupSimilar && this.groupableMessages.has(groupKey);
      let list = this.groupableMessages.get(groupKey);
      if (!list) {
        list = [];
        this.groupableMessages.set(groupKey, list);
      }
      list.push(viewMessage);
    }
    this.computeShouldMessageBeVisible(viewMessage);
    if (!shouldGoIntoGroup && !insertedInMiddle) {
      this.appendMessageToEnd(
        viewMessage,
        !shouldGroupSimilar
        /* crbug.com/1082963: prevent collapse of same messages when "Group similar" is false */
      );
      this.updateFilterStatus();
      this.#searchableView.updateSearchMatchesCount(this.regexMatchRanges.length);
    } else {
      this.needsFullUpdate = true;
    }
    this.scheduleViewportRefresh();
    this.consoleMessageAddedForTest(viewMessage);
    function addToGroup(viewMessage2, currentGroup) {
      const currentEnd = currentGroup.groupEnd();
      if (currentEnd !== null) {
        if (timeComparator(viewMessage2, currentEnd) > 0) {
          const parent = currentGroup.consoleGroup();
          if (parent === null) {
            return;
          }
          addToGroup(viewMessage2, parent);
          return;
        }
      }
      if (viewMessage2.consoleMessage().type === Protocol.Runtime.ConsoleAPICalledEventType.EndGroup) {
        currentGroup.setGroupEnd(viewMessage2);
      } else {
        viewMessage2.setConsoleGroup(currentGroup);
      }
    }
    function timeComparator(viewMessage1, viewMessage2) {
      return (messagesSortedBySymbol.get(viewMessage1) || 0) - (messagesSortedBySymbol.get(viewMessage2) || 0);
    }
  }
  onConsoleMessageUpdated(event) {
    const message = event.data;
    const viewMessage = consoleMessageToViewMessage.get(message);
    if (viewMessage) {
      viewMessage.updateMessageElement();
      this.computeShouldMessageBeVisible(viewMessage);
      this.updateMessageList();
    }
  }
  consoleMessageAddedForTest(_viewMessage) {
  }
  shouldMessageBeVisible(viewMessage) {
    return !this.shouldBeHiddenCache.has(viewMessage);
  }
  computeShouldMessageBeVisible(viewMessage) {
    if (this.filter.shouldBeVisible(viewMessage) && (!this.isSidebarOpen || this.sidebar.shouldBeVisible(viewMessage))) {
      this.shouldBeHiddenCache.delete(viewMessage);
    } else {
      this.shouldBeHiddenCache.add(viewMessage);
    }
  }
  appendMessageToEnd(viewMessage, preventCollapse) {
    if (viewMessage.consoleMessage().category === Protocol.Log.LogEntryCategory.Cors && !this.showCorsErrorsSetting.get()) {
      return;
    }
    const lastMessage = this.visibleViewMessages[this.visibleViewMessages.length - 1];
    if (viewMessage.consoleMessage().type === Protocol.Runtime.ConsoleAPICalledEventType.EndGroup) {
      if (lastMessage) {
        const group = lastMessage.consoleGroup();
        if (group && !group.messagesHidden()) {
          lastMessage.incrementCloseGroupDecorationCount();
        }
      }
      return;
    }
    if (!this.shouldMessageBeVisible(viewMessage)) {
      this.hiddenByFilterCount++;
      return;
    }
    if (!preventCollapse && this.tryToCollapseMessages(viewMessage, this.visibleViewMessages[this.visibleViewMessages.length - 1])) {
      return;
    }
    const currentGroup = viewMessage.consoleGroup();
    showGroup(currentGroup, this.visibleViewMessages);
    if (!currentGroup?.messagesHidden()) {
      const originatingMessage = viewMessage.consoleMessage().originatingMessage();
      const adjacent = Boolean(originatingMessage && lastMessage?.consoleMessage() === originatingMessage);
      viewMessage.setAdjacentUserCommandResult(adjacent);
      this.visibleViewMessages.push(viewMessage);
      this.searchMessage(this.visibleViewMessages.length - 1);
    }
    this.messageAppendedForTests();
    function showGroup(currentGroup2, visibleViewMessages) {
      if (currentGroup2 === null) {
        return;
      }
      if (visibleViewMessages.includes(currentGroup2)) {
        return;
      }
      const parentGroup = currentGroup2.consoleGroup();
      if (parentGroup) {
        showGroup(parentGroup, visibleViewMessages);
      }
      visibleViewMessages.push(currentGroup2);
    }
  }
  messageAppendedForTests() {
  }
  createViewMessage(message) {
    switch (message.type) {
      case SDK.ConsoleModel.FrontendMessageType.Command:
        return new ConsoleCommand(
          message,
          this.linkifier,
          this.requestResolver,
          this.issueResolver,
          this.onMessageResizedBound
        );
      case SDK.ConsoleModel.FrontendMessageType.Result:
        return new ConsoleCommandResult(
          message,
          this.linkifier,
          this.requestResolver,
          this.issueResolver,
          this.onMessageResizedBound
        );
      case Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed:
      case Protocol.Runtime.ConsoleAPICalledEventType.StartGroup:
        return new ConsoleGroupViewMessage(
          message,
          this.linkifier,
          this.requestResolver,
          this.issueResolver,
          this.updateMessageList.bind(this),
          this.onMessageResizedBound
        );
      case Protocol.Runtime.ConsoleAPICalledEventType.Table:
        return new ConsoleTableMessageView(
          message,
          this.linkifier,
          this.requestResolver,
          this.issueResolver,
          this.onMessageResizedBound
        );
      default:
        return new ConsoleViewMessage(
          message,
          this.linkifier,
          this.requestResolver,
          this.issueResolver,
          this.onMessageResizedBound
        );
    }
  }
  async onMessageResized(event) {
    const treeElement = event.data instanceof UI.TreeOutline.TreeElement ? event.data.treeOutline?.element : event.data;
    if (this.pendingBatchResize || !treeElement) {
      return;
    }
    this.pendingBatchResize = true;
    await Promise.resolve();
    this.viewport.setStickToBottom(this.isScrolledToBottom());
    if (treeElement.offsetHeight <= this.messagesElement.offsetHeight) {
      treeElement.scrollIntoViewIfNeeded();
    }
    this.pendingBatchResize = false;
  }
  getConsoleMessageHistory() {
    const currentExecutionContext = UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext);
    let consoleMessages = "";
    if (currentExecutionContext) {
      const consoleModel = currentExecutionContext.target().model(SDK.ConsoleModel.ConsoleModel);
      if (consoleModel) {
        let lastMessage = "";
        for (const message of consoleModel.messages()) {
          if (message.type !== SDK.ConsoleModel.FrontendMessageType.Command || message.messageText === lastMessage) {
            continue;
          }
          lastMessage = message.messageText;
          consoleMessages = consoleMessages + message.messageText + "\n\n";
        }
      }
    }
    return consoleMessages;
  }
  consoleCleared() {
    const hadFocus = this.viewport.element.hasFocus();
    this.cancelBuildHiddenCache();
    this.currentMatchRangeIndex = -1;
    this.consoleMessages = [];
    this.groupableMessages.clear();
    this.groupableMessageTitle.clear();
    this.sidebar.clear();
    this.pendingSidebarMessages = [];
    this.updateMessageList();
    this.hidePromptSuggestBox();
    this.viewport.setStickToBottom(true);
    this.linkifier.reset();
    this.filter.clear();
    this.requestResolver.clear();
    this.consoleGroupStarts = [];
    this.aiCodeCompletionSummaryToolbar?.clearCitations();
    if (hadFocus) {
      this.prompt.focus();
    }
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.consoleCleared));
  }
  handleContextMenuEvent(event) {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    const eventTarget = event.target;
    if (eventTarget.isSelfOrDescendant(this.promptElement)) {
      void contextMenu.show();
      return;
    }
    const sourceElement = eventTarget.enclosingNodeOrSelfWithClass("console-message-wrapper");
    const consoleViewMessage = sourceElement && getMessageForElement(sourceElement);
    const consoleMessage = consoleViewMessage ? consoleViewMessage.consoleMessage() : null;
    if (consoleViewMessage) {
      UI.Context.Context.instance().setFlavor(ConsoleViewMessage, consoleViewMessage);
    }
    if (consoleMessage && !consoleViewMessage?.element()?.matches(".has-insight") && consoleViewMessage?.shouldShowInsights()) {
      contextMenu.headerSection().appendAction(
        consoleViewMessage?.getExplainActionId(),
        void 0,
        /* optional=*/
        true
      );
    }
    if (consoleMessage?.url) {
      const menuTitle = i18nString(
        UIStrings.hideMessagesFromS,
        { PH1: new Common.ParsedURL.ParsedURL(consoleMessage.url).displayName }
      );
      contextMenu.headerSection().appendItem(
        menuTitle,
        this.filter.addMessageURLFilter.bind(this.filter, consoleMessage.url),
        { jslogContext: "hide-messages-from" }
      );
    }
    contextMenu.defaultSection().appendAction("console.clear");
    contextMenu.defaultSection().appendAction("console.clear.history");
    contextMenu.saveSection().appendItem(
      i18nString(UIStrings.copyConsole),
      this.copyConsole.bind(this),
      { jslogContext: "copy-console" }
    );
    contextMenu.saveSection().appendItem(
      i18nString(UIStrings.saveAs),
      this.saveConsole.bind(this),
      { jslogContext: "save-as" }
    );
    if (this.element.hasSelection()) {
      contextMenu.clipboardSection().appendItem(
        i18nString(UIStrings.copyVisibleStyledSelection),
        this.viewport.copyWithStyles.bind(this.viewport),
        { jslogContext: "copy-visible-styled-selection" }
      );
    }
    if (consoleMessage) {
      const request = Logs.NetworkLog.NetworkLog.requestForConsoleMessage(consoleMessage);
      if (request && SDK.NetworkManager.NetworkManager.canReplayRequest(request)) {
        contextMenu.debugSection().appendItem(
          i18nString(UIStrings.replayXhr),
          SDK.NetworkManager.NetworkManager.replayRequest.bind(null, request),
          { jslogContext: "replay-xhr" }
        );
      }
    }
    void contextMenu.show();
  }
  async saveConsole() {
    const url = SDK.TargetManager.TargetManager.instance().scopeTarget().inspectedURL();
    const parsedURL = Common.ParsedURL.ParsedURL.fromString(url);
    const filename = Platform.StringUtilities.sprintf("%s-%d.log", parsedURL ? parsedURL.host : "console", Date.now());
    const stream = new Bindings.FileUtils.FileOutputStream();
    const progressIndicator = document.createElement("devtools-progress");
    progressIndicator.title = i18nString(UIStrings.writingFile);
    progressIndicator.totalWork = this.itemCount();
    const chunkSize = 350;
    if (!await stream.open(filename)) {
      return;
    }
    this.progressToolbarItem.element.appendChild(progressIndicator);
    let messageIndex = 0;
    while (messageIndex < this.itemCount() && !progressIndicator.canceled) {
      const messageContents = [];
      let i;
      for (i = 0; i < chunkSize && i + messageIndex < this.itemCount(); ++i) {
        const message = this.itemElement(messageIndex + i);
        messageContents.push(message.toExportString());
      }
      messageIndex += i;
      await stream.write(messageContents.join("\n") + "\n");
      progressIndicator.worked = messageIndex;
    }
    void stream.close();
    progressIndicator.done = true;
  }
  async copyConsole() {
    const messageContents = [];
    for (let i = 0; i < this.itemCount(); i++) {
      const message = this.itemElement(i);
      messageContents.push(message.toExportString());
    }
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(messageContents.join("\n") + "\n");
  }
  tryToCollapseMessages(viewMessage, lastMessage) {
    const timestampsShown = this.timestampsSetting.get();
    if (!timestampsShown && lastMessage && !viewMessage.consoleMessage().isGroupMessage() && viewMessage.consoleMessage().type !== SDK.ConsoleModel.FrontendMessageType.Command && viewMessage.consoleMessage().type !== SDK.ConsoleModel.FrontendMessageType.Result && viewMessage.consoleMessage().isEqual(lastMessage.consoleMessage())) {
      lastMessage.incrementRepeatCount();
      if (viewMessage.isLastInSimilarGroup()) {
        lastMessage.setInSimilarGroup(true, true);
      }
      return true;
    }
    return false;
  }
  buildHiddenCache(startIndex, viewMessages) {
    const startTime = Date.now();
    let i;
    for (i = startIndex; i < viewMessages.length; ++i) {
      this.computeShouldMessageBeVisible(viewMessages[i]);
      if (i % 10 === 0 && Date.now() - startTime > 12) {
        break;
      }
    }
    if (i === viewMessages.length) {
      this.updateMessageList();
      return;
    }
    this.buildHiddenCacheTimeout = this.element.window().requestAnimationFrame(this.buildHiddenCache.bind(this, i + 1, viewMessages));
  }
  cancelBuildHiddenCache() {
    this.shouldBeHiddenCache.clear();
    if (this.buildHiddenCacheTimeout) {
      this.element.window().cancelAnimationFrame(this.buildHiddenCacheTimeout);
      delete this.buildHiddenCacheTimeout;
    }
  }
  updateMessageList() {
    this.regexMatchRanges = [];
    this.hiddenByFilterCount = 0;
    for (const visibleViewMessage of this.visibleViewMessages) {
      visibleViewMessage.resetCloseGroupDecorationCount();
      visibleViewMessage.resetIncrementRepeatCount();
    }
    this.visibleViewMessages = [];
    if (this.groupSimilarSetting.get()) {
      this.addGroupableMessagesToEnd();
    } else {
      for (const consoleMessage of this.consoleMessages) {
        consoleMessage.setInSimilarGroup(false);
        if (consoleMessage.consoleMessage().isGroupable()) {
          consoleMessage.clearConsoleGroup();
        }
        this.appendMessageToEnd(
          consoleMessage,
          true
          /* crbug.com/1082963: prevent collaps`e of same messages when "Group similar" is false */
        );
      }
    }
    this.updateFilterStatus();
    this.#searchableView.updateSearchMatchesCount(this.regexMatchRanges.length);
    this.highlightMatch(this.currentMatchRangeIndex, false);
    this.viewport.invalidate();
    this.messagesCountElement.setAttribute(
      "aria-label",
      i18nString(UIStrings.filteredMessagesInConsole, { PH1: this.visibleViewMessages.length })
    );
  }
  addGroupableMessagesToEnd() {
    const alreadyAdded = /* @__PURE__ */ new Set();
    const processedGroupKeys = /* @__PURE__ */ new Set();
    for (const viewMessage of this.consoleMessages) {
      const message = viewMessage.consoleMessage();
      if (alreadyAdded.has(message)) {
        continue;
      }
      if (!message.isGroupable()) {
        this.appendMessageToEnd(viewMessage);
        alreadyAdded.add(message);
        continue;
      }
      const key = viewMessage.groupKey();
      const viewMessagesInGroup = this.groupableMessages.get(key);
      if (!viewMessagesInGroup || viewMessagesInGroup.length < 5) {
        viewMessage.setInSimilarGroup(false);
        this.appendMessageToEnd(viewMessage);
        alreadyAdded.add(message);
        continue;
      }
      if (processedGroupKeys.has(key)) {
        continue;
      }
      if (!viewMessagesInGroup.find((x) => this.shouldMessageBeVisible(x))) {
        for (const viewMessageInGroup of viewMessagesInGroup) {
          alreadyAdded.add(viewMessageInGroup.consoleMessage());
        }
        processedGroupKeys.add(key);
        continue;
      }
      let startGroupViewMessage = this.groupableMessageTitle.get(key);
      if (!startGroupViewMessage) {
        const startGroupMessage = new SDK.ConsoleModel.ConsoleMessage(
          null,
          message.source,
          message.level,
          viewMessage.groupTitle(),
          { type: Protocol.Runtime.ConsoleAPICalledEventType.StartGroupCollapsed }
        );
        startGroupViewMessage = this.createViewMessage(startGroupMessage);
        this.groupableMessageTitle.set(key, startGroupViewMessage);
      }
      startGroupViewMessage.setRepeatCount(viewMessagesInGroup.length);
      this.appendMessageToEnd(startGroupViewMessage);
      for (const viewMessageInGroup of viewMessagesInGroup) {
        viewMessageInGroup.setInSimilarGroup(
          true,
          viewMessagesInGroup[viewMessagesInGroup.length - 1] === viewMessageInGroup
        );
        viewMessageInGroup.setConsoleGroup(startGroupViewMessage);
        this.appendMessageToEnd(viewMessageInGroup, true);
        alreadyAdded.add(viewMessageInGroup.consoleMessage());
      }
      const endGroupMessage = new SDK.ConsoleModel.ConsoleMessage(
        null,
        message.source,
        message.level,
        message.messageText,
        { type: Protocol.Runtime.ConsoleAPICalledEventType.EndGroup }
      );
      this.appendMessageToEnd(this.createViewMessage(endGroupMessage));
    }
  }
  messagesClicked(event) {
    const target = event.target;
    if (!this.messagesElement.hasSelection()) {
      const clickedOutsideMessageList = target === this.messagesElement || this.prompt.belowEditorElement().isSelfOrAncestor(target);
      if (clickedOutsideMessageList) {
        this.prompt.moveCaretToEndOfPrompt();
        this.focusPrompt();
      }
    }
  }
  messagesKeyDown(event) {
    const keyEvent = event;
    const hasActionModifier = keyEvent.ctrlKey || keyEvent.altKey || keyEvent.metaKey;
    if (hasActionModifier || keyEvent.key.length !== 1 || UI.UIUtils.isEditing() || this.messagesElement.hasSelection()) {
      return;
    }
    this.prompt.moveCaretToEndOfPrompt();
    this.focusPrompt();
  }
  messagesPasted(event) {
    if (!Root.Runtime.Runtime.queryParam("isChromeForTesting") && !Root.Runtime.Runtime.queryParam("disableSelfXssWarnings") && !this.selfXssWarningDisabledSetting.get()) {
      event.preventDefault();
      this.prompt.showSelfXssWarning();
    }
    if (UI.UIUtils.isEditing()) {
      return;
    }
    this.prompt.focus();
  }
  registerShortcuts() {
    this.shortcuts.set(
      UI.KeyboardShortcut.KeyboardShortcut.makeKey("u", UI.KeyboardShortcut.Modifiers.Ctrl.value),
      this.clearPromptBackwards.bind(this)
    );
  }
  clearPromptBackwards(e) {
    this.prompt.clear();
    void VisualLogging.logKeyDown(e.currentTarget, e, "clear-prompt");
  }
  promptKeyDown(event) {
    const keyboardEvent = event;
    if (keyboardEvent.key === "PageUp") {
      this.updateStickToBottomOnWheel();
      return;
    }
    const shortcut = UI.KeyboardShortcut.KeyboardShortcut.makeKeyFromEvent(keyboardEvent);
    const handler = this.shortcuts.get(shortcut);
    if (handler) {
      handler(keyboardEvent);
      keyboardEvent.preventDefault();
    }
  }
  printResult(result, originatingConsoleMessage, exceptionDetails) {
    if (!result) {
      return;
    }
    const level = Boolean(exceptionDetails) ? Protocol.Log.LogEntryLevel.Error : Protocol.Log.LogEntryLevel.Info;
    let message;
    if (!exceptionDetails) {
      message = new SDK.ConsoleModel.ConsoleMessage(
        result.runtimeModel(),
        Protocol.Log.LogEntrySource.Javascript,
        level,
        "",
        { type: SDK.ConsoleModel.FrontendMessageType.Result, parameters: [result] }
      );
    } else {
      message = SDK.ConsoleModel.ConsoleMessage.fromException(
        result.runtimeModel(),
        exceptionDetails,
        SDK.ConsoleModel.FrontendMessageType.Result,
        void 0,
        void 0
      );
    }
    message.setOriginatingMessage(originatingConsoleMessage);
    result.runtimeModel().target().model(SDK.ConsoleModel.ConsoleModel)?.addMessage(message);
  }
  commandEvaluated(event) {
    const { data } = event;
    this.printResult(data.result, data.commandMessage, data.exceptionDetails);
  }
  elementsToRestoreScrollPositionsFor() {
    return [this.messagesElement];
  }
  onSearchCanceled() {
    this.cleanupAfterSearch();
    for (const message of this.visibleViewMessages) {
      message.setSearchRegex(null);
    }
    this.currentMatchRangeIndex = -1;
    this.regexMatchRanges = [];
    this.searchRegex = null;
    this.viewport.refresh();
  }
  performSearch(searchConfig, shouldJump, jumpBackwards) {
    this.onSearchCanceled();
    this.#searchableView.updateSearchMatchesCount(0);
    this.searchRegex = searchConfig.toSearchRegex(true).regex;
    this.regexMatchRanges = [];
    this.currentMatchRangeIndex = -1;
    if (shouldJump) {
      this.searchShouldJumpBackwards = Boolean(jumpBackwards);
    }
    this.searchProgressIndicator = document.createElement("devtools-progress");
    this.searchProgressIndicator.title = i18nString(UIStrings.searching);
    this.searchProgressIndicator.totalWork = this.visibleViewMessages.length;
    this.progressToolbarItem.element.appendChild(this.searchProgressIndicator);
    this.#search(0);
  }
  cleanupAfterSearch() {
    delete this.searchShouldJumpBackwards;
    if (this.#searchTimeoutId) {
      clearTimeout(this.#searchTimeoutId);
      this.#searchTimeoutId = void 0;
    }
    if (this.searchProgressIndicator) {
      this.searchProgressIndicator.done = true;
      delete this.searchProgressIndicator;
    }
  }
  searchFinishedForTests() {
  }
  #search(index) {
    this.#searchTimeoutId = void 0;
    if (this.searchProgressIndicator?.canceled) {
      this.cleanupAfterSearch();
      return;
    }
    const startTime = Date.now();
    for (; index < this.visibleViewMessages.length && Date.now() - startTime < 100; ++index) {
      this.searchMessage(index);
    }
    this.#searchableView.updateSearchMatchesCount(this.regexMatchRanges.length);
    if (typeof this.searchShouldJumpBackwards !== "undefined" && this.regexMatchRanges.length) {
      this.highlightMatch(this.searchShouldJumpBackwards ? -1 : 0);
      delete this.searchShouldJumpBackwards;
    }
    if (index === this.visibleViewMessages.length) {
      this.cleanupAfterSearch();
      window.setTimeout(this.searchFinishedForTests.bind(this), 0);
      return;
    }
    this.#searchTimeoutId = window.setTimeout(this.#search.bind(this, index), 100);
    if (this.searchProgressIndicator) {
      this.searchProgressIndicator.worked = index;
    }
  }
  searchMessage(index) {
    const message = this.visibleViewMessages[index];
    message.setSearchRegex(this.searchRegex);
    for (let i = 0; i < message.searchCount(); ++i) {
      this.regexMatchRanges.push({ messageIndex: index, matchIndex: i });
    }
  }
  jumpToNextSearchResult() {
    this.highlightMatch(this.currentMatchRangeIndex + 1);
  }
  jumpToPreviousSearchResult() {
    this.highlightMatch(this.currentMatchRangeIndex - 1);
  }
  supportsCaseSensitiveSearch() {
    return true;
  }
  supportsWholeWordSearch() {
    return true;
  }
  supportsRegexSearch() {
    return true;
  }
  highlightMatch(index, scrollIntoView = true) {
    if (!this.regexMatchRanges.length) {
      return;
    }
    let matchRange;
    if (this.currentMatchRangeIndex >= 0) {
      matchRange = this.regexMatchRanges[this.currentMatchRangeIndex];
      const message2 = this.visibleViewMessages[matchRange.messageIndex];
      message2.searchHighlightNode(matchRange.matchIndex).classList.remove(Highlighting.highlightedCurrentSearchResultClassName);
    }
    index = Platform.NumberUtilities.mod(index, this.regexMatchRanges.length);
    this.currentMatchRangeIndex = index;
    this.#searchableView.updateCurrentMatchIndex(index);
    matchRange = this.regexMatchRanges[index];
    const message = this.visibleViewMessages[matchRange.messageIndex];
    const highlightNode = message.searchHighlightNode(matchRange.matchIndex);
    highlightNode.classList.add(Highlighting.highlightedCurrentSearchResultClassName);
    if (scrollIntoView) {
      this.viewport.scrollItemIntoView(matchRange.messageIndex);
      highlightNode.scrollIntoViewIfNeeded();
    }
  }
  updateStickToBottomOnPointerDown(isRightClick) {
    this.muteViewportUpdates = !isRightClick;
    this.viewport.setStickToBottom(false);
    if (this.waitForScrollTimeout) {
      clearTimeout(this.waitForScrollTimeout);
      delete this.waitForScrollTimeout;
    }
  }
  updateStickToBottomOnPointerUp() {
    if (!this.muteViewportUpdates) {
      return;
    }
    this.waitForScrollTimeout = window.setTimeout(updateViewportState.bind(this), 200);
    function updateViewportState() {
      this.muteViewportUpdates = false;
      if (this.isShowing()) {
        this.viewport.setStickToBottom(this.isScrolledToBottom());
      }
      if (this.maybeDirtyWhileMuted) {
        this.scheduleViewportRefresh();
        delete this.maybeDirtyWhileMuted;
      }
      delete this.waitForScrollTimeout;
      this.updateViewportStickinessForTest();
    }
  }
  updateViewportStickinessForTest() {
  }
  updateStickToBottomOnWheel() {
    this.updateStickToBottomOnPointerDown();
    this.updateStickToBottomOnPointerUp();
  }
  promptTextChanged() {
    const oldStickToBottom = this.viewport.stickToBottom();
    const willStickToBottom = this.isScrolledToBottom();
    this.viewport.setStickToBottom(willStickToBottom);
    if (willStickToBottom && !oldStickToBottom) {
      this.scheduleViewportRefresh();
    }
    this.promptTextChangedForTest();
  }
  promptTextChangedForTest() {
  }
  isScrolledToBottom() {
    const distanceToPromptEditorBottom = this.messagesElement.scrollHeight - this.messagesElement.scrollTop - this.messagesElement.clientHeight - this.prompt.belowEditorElement().offsetHeight;
    return distanceToPromptEditorBottom <= 2;
  }
  setupAiCodeCompletion() {
    this.createAiCodeCompletionSummaryToolbar();
  }
  cleanupAiCodeCompletion() {
    this.aiCodeCompletionSummaryToolbarContainer?.remove();
    this.aiCodeCompletionSummaryToolbarContainer = void 0;
    this.aiCodeCompletionSummaryToolbar = void 0;
  }
}
globalThis.Console = globalThis.Console || {};
globalThis.Console.ConsoleView = ConsoleView;
export class ConsoleViewFilter {
  filterChanged;
  messageLevelFiltersSetting;
  networkMessagesSetting;
  filterByExecutionContextSetting;
  suggestionBuilder;
  textFilterUI;
  textFilterSetting;
  filterParser;
  currentFilter;
  levelLabels;
  levelMenuButton;
  levelMenuButtonInfo;
  constructor(filterChangedCallback) {
    this.filterChanged = filterChangedCallback;
    this.messageLevelFiltersSetting = ConsoleViewFilter.levelFilterSetting();
    this.networkMessagesSetting = Common.Settings.Settings.instance().moduleSetting("network-messages");
    this.filterByExecutionContextSetting = Common.Settings.Settings.instance().moduleSetting("selected-context-filter-enabled");
    this.messageLevelFiltersSetting.addChangeListener(this.onFilterChanged.bind(this));
    this.networkMessagesSetting.addChangeListener(this.onFilterChanged.bind(this));
    this.filterByExecutionContextSetting.addChangeListener(this.onFilterChanged.bind(this));
    UI.Context.Context.instance().addFlavorChangeListener(
      SDK.RuntimeModel.ExecutionContext,
      this.onFilterChanged,
      this
    );
    const filterKeys = Object.values(FilterType);
    this.suggestionBuilder = new UI.FilterSuggestionBuilder.FilterSuggestionBuilder(filterKeys);
    this.textFilterUI = new UI.Toolbar.ToolbarFilter(
      void 0,
      1,
      1,
      i18nString(UIStrings.egEventdCdnUrlacom),
      this.suggestionBuilder.completions.bind(this.suggestionBuilder),
      true
    );
    this.textFilterSetting = Common.Settings.Settings.instance().createSetting("console.text-filter", "");
    if (this.textFilterSetting.get()) {
      this.textFilterUI.setValue(this.textFilterSetting.get());
    }
    this.textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TEXT_CHANGED, () => {
      this.textFilterSetting.set(this.textFilterUI.value());
      this.onFilterChanged();
    });
    this.filterParser = new TextUtils.TextUtils.FilterParser(filterKeys);
    this.currentFilter = new ConsoleFilter("", [], null, this.messageLevelFiltersSetting.get());
    this.updateCurrentFilter();
    this.levelLabels = /* @__PURE__ */ new Map([
      [Protocol.Log.LogEntryLevel.Verbose, i18nString(UIStrings.verbose)],
      [Protocol.Log.LogEntryLevel.Info, i18nString(UIStrings.info)],
      [Protocol.Log.LogEntryLevel.Warning, i18nString(UIStrings.warnings)],
      [Protocol.Log.LogEntryLevel.Error, i18nString(UIStrings.errors)]
    ]);
    this.levelMenuButton = new UI.Toolbar.ToolbarMenuButton(this.appendLevelMenuItems.bind(this), void 0, void 0, "log-level");
    const levelMenuButtonInfoIcon = createIcon("info", "console-sidebar-levels-info");
    levelMenuButtonInfoIcon.title = i18nString(UIStrings.overriddenByFilterSidebar);
    this.levelMenuButtonInfo = new UI.Toolbar.ToolbarItem(levelMenuButtonInfoIcon);
    this.levelMenuButtonInfo.setVisible(false);
    this.updateLevelMenuButtonText();
    this.messageLevelFiltersSetting.addChangeListener(this.updateLevelMenuButtonText.bind(this));
  }
  onMessageAdded(message) {
    if (message.type === SDK.ConsoleModel.FrontendMessageType.Command || message.type === SDK.ConsoleModel.FrontendMessageType.Result || message.isGroupMessage()) {
      return;
    }
    if (message.context) {
      this.suggestionBuilder.addItem(FilterType.Context, message.context);
    }
    if (message.source) {
      this.suggestionBuilder.addItem(FilterType.Source, message.source);
    }
    if (message.url) {
      this.suggestionBuilder.addItem(FilterType.Url, message.url);
    }
  }
  setLevelMenuOverridden(overridden) {
    this.levelMenuButton.setEnabled(!overridden);
    this.levelMenuButtonInfo.setVisible(overridden);
    if (overridden) {
      this.levelMenuButton.setText(i18nString(UIStrings.customLevels));
    } else {
      this.updateLevelMenuButtonText();
    }
  }
  static levelFilterSetting() {
    return Common.Settings.Settings.instance().createSetting(
      "message-level-filters",
      ConsoleFilter.defaultLevelsFilterValue()
    );
  }
  updateCurrentFilter() {
    const parsedFilters = this.filterParser.parse(this.textFilterUI.value());
    for (const { key } of parsedFilters) {
      switch (key) {
        case FilterType.Context:
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleFilterByContext);
          break;
        case FilterType.Source:
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleFilterBySource);
          break;
        case FilterType.Url:
          Host.userMetrics.actionTaken(Host.UserMetrics.Action.ConsoleFilterByUrl);
          break;
      }
    }
    if (!this.networkMessagesSetting.get()) {
      parsedFilters.push(
        { key: FilterType.Source, text: Protocol.Log.LogEntrySource.Network, negative: true, regex: void 0 }
      );
    }
    this.currentFilter.executionContext = this.filterByExecutionContextSetting.get() ? UI.Context.Context.instance().flavor(SDK.RuntimeModel.ExecutionContext) : null;
    this.currentFilter.parsedFilters = parsedFilters;
    this.currentFilter.levelsMask = this.messageLevelFiltersSetting.get();
  }
  onFilterChanged() {
    this.updateCurrentFilter();
    this.filterChanged();
  }
  updateLevelMenuButtonText() {
    let isAll = true;
    let isDefault = true;
    const allValue = ConsoleFilter.allLevelsFilterValue();
    const defaultValue = ConsoleFilter.defaultLevelsFilterValue();
    let text = null;
    const levels = this.messageLevelFiltersSetting.get();
    const allLevels = {
      Verbose: Protocol.Log.LogEntryLevel.Verbose,
      Info: Protocol.Log.LogEntryLevel.Info,
      Warning: Protocol.Log.LogEntryLevel.Warning,
      Error: Protocol.Log.LogEntryLevel.Error
    };
    for (const name of Object.values(allLevels)) {
      isAll = isAll && levels[name] === allValue[name];
      isDefault = isDefault && levels[name] === defaultValue[name];
      if (levels[name]) {
        text = text ? i18nString(UIStrings.customLevels) : i18nString(UIStrings.sOnly, { PH1: String(this.levelLabels.get(name)) });
      }
    }
    if (isAll) {
      text = i18nString(UIStrings.allLevels);
    } else if (isDefault) {
      text = i18nString(UIStrings.defaultLevels);
    } else {
      text = text || i18nString(UIStrings.hideAll);
    }
    this.levelMenuButton.element.classList.toggle("warning", !isAll && !isDefault);
    this.levelMenuButton.setText(text);
    this.levelMenuButton.setTitle(i18nString(UIStrings.logLevelS, { PH1: text }));
  }
  appendLevelMenuItems(contextMenu) {
    const setting = this.messageLevelFiltersSetting;
    const levels = setting.get();
    contextMenu.headerSection().appendItem(
      i18nString(UIStrings.default),
      () => setting.set(ConsoleFilter.defaultLevelsFilterValue()),
      { jslogContext: "default" }
    );
    for (const [level, levelText] of this.levelLabels.entries()) {
      contextMenu.defaultSection().appendCheckboxItem(
        levelText,
        toggleShowLevel.bind(null, level),
        { checked: levels[level], jslogContext: level }
      );
    }
    function toggleShowLevel(level) {
      levels[level] = !levels[level];
      setting.set(levels);
    }
  }
  addMessageURLFilter(url) {
    if (!url) {
      return;
    }
    const suffix = this.textFilterUI.value() ? ` ${this.textFilterUI.value()}` : "";
    this.textFilterUI.setValue(`-url:${url}${suffix}`);
    this.textFilterSetting.set(this.textFilterUI.value());
    this.onFilterChanged();
  }
  shouldBeVisible(viewMessage) {
    return this.currentFilter.shouldBeVisible(viewMessage);
  }
  clear() {
    this.suggestionBuilder.clear();
  }
  reset() {
    this.messageLevelFiltersSetting.set(ConsoleFilter.defaultLevelsFilterValue());
    this.filterByExecutionContextSetting.set(false);
    this.networkMessagesSetting.set(true);
    this.textFilterUI.setValue("");
    this.onFilterChanged();
  }
}
export class ActionDelegate {
  handleAction(_context, actionId) {
    switch (actionId) {
      case "console.toggle":
        if (ConsoleView.instance().hasFocus() && UI.InspectorView.InspectorView.instance().drawerVisible()) {
          UI.InspectorView.InspectorView.instance().closeDrawer();
          return true;
        }
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.bringToFront();
        Common.Console.Console.instance().show();
        ConsoleView.instance().focusPrompt();
        return true;
      case "console.clear":
        ConsoleView.instance().clearConsole();
        return true;
      case "console.clear.history":
        ConsoleView.instance().clearHistory();
        return true;
      case "console.create-pin":
        ConsoleView.instance().pinPane.addPin(
          "",
          true
          /* userGesture */
        );
        return true;
    }
    return false;
  }
}
const messagesSortedBySymbol = /* @__PURE__ */ new WeakMap();
const consoleMessageToViewMessage = /* @__PURE__ */ new WeakMap();
//# sourceMappingURL=ConsoleView.js.map
