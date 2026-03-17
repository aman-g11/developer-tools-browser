"use strict";
import "../../../ui/kit/kit.js";
import "../../../ui/legacy/legacy.js";
import * as Common from "../../../core/common/common.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import { assertNotNullOrUndefined } from "../../../core/platform/platform.js";
import * as SDK from "../../../core/sdk/sdk.js";
import * as Protocol from "../../../generated/protocol.js";
import * as TextUtils from "../../../models/text_utils/text_utils.js";
import * as Buttons from "../../../ui/components/buttons/buttons.js";
import emptyWidgetStyles from "../../../ui/legacy/emptyWidget.css.js";
import * as UI from "../../../ui/legacy/legacy.js";
import { Directives, html, render } from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import * as PreloadingComponents from "./components/components.js";
import { capitalizedAction, ruleSetTagOrLocationShort } from "./components/PreloadingString.js";
import * as PreloadingHelper from "./helper/helper.js";
import preloadingViewStyles from "./preloadingView.css.js";
import preloadingViewDropDownStyles from "./preloadingViewDropDown.css.js";
const { createRef, ref } = Directives;
const { widget } = UI.Widget;
const UIStrings = {
  /**
   * @description DropDown title for filtering preloading attempts by rule set
   */
  filterFilterByRuleSet: "Filter by rule set",
  /**
   * @description DropDown text for filtering preloading attempts by rule set: No filter
   */
  filterAllPreloads: "All speculative loads",
  /**
   * @description Dropdown subtitle for filtering preloading attempts by rule set
   *             when there are no rule sets in the page.
   */
  noRuleSets: "no rule sets",
  /**
   * @description Text in grid: Rule set is valid
   */
  validityValid: "Valid",
  /**
   * @description Text in grid: Rule set must be a valid JSON object
   */
  validityInvalid: "Invalid",
  /**
   * @description Text in grid: Rule set contains invalid rules and they are ignored
   */
  validitySomeRulesInvalid: "Some rules invalid",
  /**
   * @description Text in grid and details: Preloading attempt is not yet triggered.
   */
  statusNotTriggered: "Not triggered",
  /**
   * @description Text in grid and details: Preloading attempt is eligible but pending.
   */
  statusPending: "Pending",
  /**
   * @description Text in grid and details: Preloading is running.
   */
  statusRunning: "Running",
  /**
   * @description Text in grid and details: Preloading finished and the result is ready for the next navigation.
   */
  statusReady: "Ready",
  /**
   * @description Text in grid and details: Ready, then used.
   */
  statusSuccess: "Success",
  /**
   * @description Text in grid and details: Preloading failed.
   */
  statusFailure: "Failure",
  /**
   * @description Text to pretty print a file
   */
  prettyPrint: "Pretty print",
  /**
   * @description Placeholder text if there are no rules to show. https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules
   */
  noRulesDetected: "No rules detected",
  /**
   * @description Placeholder text if there are no rules to show. https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules
   */
  rulesDescription: "On this page you will see the speculation rules used to prefetch and prerender page navigations.",
  /**
   * @description Placeholder text if there are no speculation attempts for prefetching or prerendering urls. https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules
   */
  noPrefetchAttempts: "No speculation detected",
  /**
   * @description Placeholder text if there are no speculation attempts for prefetching or prerendering urls. https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules
   */
  prefetchDescription: "On this page you will see details on speculative loads.",
  /**
   * @description Text for a learn more link
   */
  learnMore: "Learn more"
};
const str_ = i18n.i18n.registerUIStrings("panels/application/preloading/PreloadingView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const SPECULATION_EXPLANATION_URL = "https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules";
const AllRuleSetRootId = Symbol("AllRuleSetRootId");
class PreloadingUIUtils {
  static status(status) {
    switch (status) {
      case SDK.PreloadingModel.PreloadingStatus.NOT_TRIGGERED:
        return i18nString(UIStrings.statusNotTriggered);
      case SDK.PreloadingModel.PreloadingStatus.PENDING:
        return i18nString(UIStrings.statusPending);
      case SDK.PreloadingModel.PreloadingStatus.RUNNING:
        return i18nString(UIStrings.statusRunning);
      case SDK.PreloadingModel.PreloadingStatus.READY:
        return i18nString(UIStrings.statusReady);
      case SDK.PreloadingModel.PreloadingStatus.SUCCESS:
        return i18nString(UIStrings.statusSuccess);
      case SDK.PreloadingModel.PreloadingStatus.FAILURE:
        return i18nString(UIStrings.statusFailure);
      // NotSupported is used to handle unreachable case. For example,
      // there is no code path for
      // PreloadingTriggeringOutcome::kTriggeredButPending in prefetch,
      // which is mapped to NotSupported. So, we regard it as an
      // internal error.
      case SDK.PreloadingModel.PreloadingStatus.NOT_SUPPORTED:
        return i18n.i18n.lockedString("Internal error");
    }
  }
  static preloadsStatusSummary(countsByStatus) {
    const LIST = [
      SDK.PreloadingModel.PreloadingStatus.NOT_TRIGGERED,
      SDK.PreloadingModel.PreloadingStatus.PENDING,
      SDK.PreloadingModel.PreloadingStatus.RUNNING,
      SDK.PreloadingModel.PreloadingStatus.READY,
      SDK.PreloadingModel.PreloadingStatus.SUCCESS,
      SDK.PreloadingModel.PreloadingStatus.FAILURE
    ];
    return LIST.filter((status) => (countsByStatus?.get(status) || 0) > 0).map((status) => (countsByStatus?.get(status) || 0) + " " + this.status(status)).join(", ").toLocaleLowerCase();
  }
  // Summary of error of rule set shown in grid.
  static validity({ errorType }) {
    switch (errorType) {
      case void 0:
        return i18nString(UIStrings.validityValid);
      case Protocol.Preload.RuleSetErrorType.SourceIsNotJsonObject:
      case Protocol.Preload.RuleSetErrorType.InvalidRulesetLevelTag:
        return i18nString(UIStrings.validityInvalid);
      case Protocol.Preload.RuleSetErrorType.InvalidRulesSkipped:
        return i18nString(UIStrings.validitySomeRulesInvalid);
    }
  }
  // Where a rule set came from, shown in grid.
  static location(ruleSet) {
    if (ruleSet.backendNodeId !== void 0) {
      return i18n.i18n.lockedString("<script>");
    }
    if (ruleSet.url !== void 0) {
      return ruleSet.url;
    }
    throw new Error("unreachable");
  }
  static processLocalId(id) {
    const index = id.indexOf(".");
    return index === -1 ? id : id.slice(index + 1);
  }
}
function pageURL() {
  return SDK.TargetManager.TargetManager.instance().scopeTarget()?.inspectedURL() || "";
}
export class PreloadingRuleSetView extends UI.Widget.VBox {
  model;
  focusedRuleSetId = null;
  warningsContainer;
  warningsView = new PreloadingComponents.PreloadingDisabledInfobar.PreloadingDisabledInfobar();
  hsplit;
  ruleSetGrid = new PreloadingComponents.RuleSetGrid.RuleSetGrid();
  ruleSetGridContainerRef = createRef();
  ruleSetDetailsRef;
  shouldPrettyPrint = Common.Settings.Settings.instance().moduleSetting("auto-pretty-print-minified").get();
  constructor(model) {
    super({ useShadowDom: true });
    this.registerRequiredCSS(emptyWidgetStyles, preloadingViewStyles);
    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.MODEL_UPDATED,
      this.render,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.WARNINGS_UPDATED,
      (e) => {
        Object.assign(this.warningsView, e.data);
      },
      this,
      { scoped: true }
    );
    this.warningsContainer = document.createElement("div");
    this.warningsContainer.classList.add("flex-none");
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);
    this.ruleSetGrid.addEventListener(
      PreloadingComponents.RuleSetGrid.Events.SELECT,
      this.onRuleSetsGridCellFocused,
      this
    );
    this.ruleSetDetailsRef = createRef();
    const onPrettyPrintToggle = () => {
      this.shouldPrettyPrint = !this.shouldPrettyPrint;
      this.updateRuleSetDetails();
    };
    render(
      html`
        <div class="empty-state">
          <span class="empty-state-header">${i18nString(UIStrings.noRulesDetected)}</span>
          <div class="empty-state-description">
            <span>${i18nString(UIStrings.rulesDescription)}</span>
            <devtools-link
              class="devtools-link"
              href=${SPECULATION_EXPLANATION_URL}
              jslogcontext="learn-more"
            >${i18nString(UIStrings.learnMore)}</devtools-link>
          </div>
        </div>
        <devtools-split-view sidebar-position="second">
          <div slot="main" ${ref(this.ruleSetGridContainerRef)}>
          </div>
          <div slot="sidebar" jslog=${VisualLogging.section("rule-set-details")}>
            <devtools-widget ${widget(PreloadingComponents.RuleSetDetailsView.RuleSetDetailsView, {
        ruleSet: this.getRuleSet(),
        shouldPrettyPrint: this.shouldPrettyPrint
      })} ${ref(this.ruleSetDetailsRef)}></devtools-widget>
          </div>
        </devtools-split-view>
        <div class="pretty-print-button" style="border-top: 1px solid var(--sys-color-divider)">
        <devtools-button
          .iconName=${"brackets"}
          .toggledIconName=${"brackets"}
          .toggled=${this.shouldPrettyPrint}
          .toggleType=${Buttons.Button.ToggleType.PRIMARY}
          .title=${i18nString(UIStrings.prettyPrint)}
          .variant=${Buttons.Button.Variant.ICON_TOGGLE}
          .size=${Buttons.Button.Size.REGULAR}
          @click=${onPrettyPrintToggle}
          jslog=${VisualLogging.action().track({ click: true }).context("preloading-status-panel-pretty-print")}></devtools-button>
        </div>`,
      this.contentElement,
      { host: this }
    );
    this.hsplit = this.contentElement.querySelector("devtools-split-view");
  }
  wasShown() {
    super.wasShown();
    this.warningsView.wasShown();
    this.render();
  }
  onScopeChange() {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }
  revealRuleSet(revealInfo) {
    this.focusedRuleSetId = revealInfo.ruleSetId;
    this.render();
  }
  updateRuleSetDetails() {
    const ruleSet = this.getRuleSet();
    const widget2 = this.ruleSetDetailsRef.value?.getWidget();
    if (widget2) {
      widget2.shouldPrettyPrint = this.shouldPrettyPrint;
      widget2.ruleSet = ruleSet;
    }
    if (ruleSet === null) {
      this.hsplit.setAttribute("sidebar-visibility", "hidden");
    } else {
      this.hsplit.removeAttribute("sidebar-visibility");
    }
  }
  getRuleSet() {
    const id = this.focusedRuleSetId;
    return id === null ? null : this.model.getRuleSetById(id);
  }
  render() {
    const countsByRuleSetId = this.model.getPreloadCountsByRuleSetId();
    const ruleSetRows = this.model.getAllRuleSets().map(({ id, value }) => {
      const countsByStatus = countsByRuleSetId.get(id) || /* @__PURE__ */ new Map();
      return {
        ruleSet: value,
        preloadsStatusSummary: PreloadingUIUtils.preloadsStatusSummary(countsByStatus)
      };
    });
    this.ruleSetGrid.data = { rows: ruleSetRows, pageURL: pageURL() };
    this.contentElement.classList.toggle("empty", ruleSetRows.length === 0);
    this.updateRuleSetDetails();
    const container = this.ruleSetGridContainerRef.value;
    if (container && this.ruleSetGrid.element.parentElement !== container) {
      this.ruleSetGrid.show(container);
    }
  }
  onRuleSetsGridCellFocused(event) {
    this.focusedRuleSetId = event.data;
    this.render();
  }
  getInfobarContainerForTest() {
    return this.warningsView.contentElement;
  }
  getRuleSetGridForTest() {
    return this.ruleSetGrid;
  }
}
export function applyFilterText(filterText, rows) {
  const trimmedFilter = filterText.trim();
  if (trimmedFilter === "") {
    return rows;
  }
  const FILTER_KEYS = ["url", "action", "status"];
  const parser = new TextUtils.TextUtils.FilterParser([...FILTER_KEYS]);
  const query = parser.parse(filterText.toLowerCase());
  const lastTerm = query.at(-1);
  if (!lastTerm) {
    return rows;
  }
  const isKeyWithNoValue = (lastTerm.key === void 0 || lastTerm.key === null) && FILTER_KEYS.some((key) => lastTerm.text === `${key}:`);
  if (isKeyWithNoValue) {
    query.pop();
  }
  if (query.length === 0) {
    return rows;
  }
  return rows.filter((row) => {
    const attempt = row.pipeline.getOriginallyTriggered();
    const url = attempt.key.url.toLowerCase();
    const action = capitalizedAction(attempt.action).toLowerCase();
    const status = PreloadingUIUtils.status(attempt.status).toLowerCase();
    return query.every((term) => {
      if (term.text === void 0 || term.text === null || term.text === "") {
        return true;
      }
      const searchText = term.text.toLowerCase();
      const key = term.key;
      switch (key) {
        case "url":
          return url.includes(searchText);
        case "action":
          return action.includes(searchText);
        case "status": {
          const statusValues = searchText.split(",");
          return statusValues.some((v) => status.includes(v));
        }
        case void 0:
          return url.includes(searchText) || action.includes(searchText) || status.includes(searchText);
        default:
          return false;
      }
    });
  });
}
export class PreloadingAttemptView extends UI.Widget.VBox {
  model;
  // Note that we use id of (representative) preloading attempt while we show pipelines in grid.
  // This is because `NOT_TRIGGERED` preloading attempts don't have pipeline id and we can use it.
  focusedPreloadingAttemptId = null;
  warningsContainer;
  warningsView = new PreloadingComponents.PreloadingDisabledInfobar.PreloadingDisabledInfobar();
  preloadingGrid = new PreloadingComponents.PreloadingGrid.PreloadingGrid();
  preloadingDetails = new PreloadingComponents.PreloadingDetailsReportView.PreloadingDetailsReportView();
  ruleSetSelector;
  textFilterUI;
  hsplit;
  clearButton;
  constructor(model) {
    super({
      jslog: `${VisualLogging.pane("preloading-speculations")}`,
      useShadowDom: true
    });
    this.registerRequiredCSS(emptyWidgetStyles, preloadingViewStyles);
    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.MODEL_UPDATED,
      this.render,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.WARNINGS_UPDATED,
      (e) => {
        Object.assign(this.warningsView, e.data);
      },
      this,
      { scoped: true }
    );
    this.warningsContainer = document.createElement("div");
    this.warningsContainer.classList.add("flex-none");
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);
    const vbox = new UI.Widget.VBox();
    const toolbar = vbox.contentElement.createChild("devtools-toolbar", "preloading-toolbar");
    toolbar.setAttribute("jslog", `${VisualLogging.toolbar()}`);
    this.ruleSetSelector = new PreloadingRuleSetSelector(() => this.render());
    toolbar.appendToolbarItem(this.ruleSetSelector.item());
    this.textFilterUI = new UI.Toolbar.ToolbarFilter(void 0, 1, 1);
    this.textFilterUI.addEventListener(UI.Toolbar.ToolbarInput.Event.TEXT_CHANGED, this.onTextFilterChanged, this);
    toolbar.appendToolbarItem(this.textFilterUI);
    toolbar.appendToolbarItem(new UI.Toolbar.ToolbarSeparator());
    this.clearButton = new UI.Toolbar.ToolbarButton("Clear speculative loads", "clear", void 0, "clear-speculative-loads");
    this.clearButton.addEventListener(UI.Toolbar.ToolbarButton.Events.CLICK, () => {
      const model2 = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
      if (!model2) {
        return;
      }
      model2.reset();
      this.textFilterUI.setValue("");
      this.ruleSetSelector.select(null);
      this.render();
    });
    toolbar.appendToolbarItem(this.clearButton);
    this.preloadingGrid.onSelect = this.onPreloadingGridCellFocused.bind(this);
    const preloadingGridContainer = document.createElement("div");
    preloadingGridContainer.className = "preloading-grid-widget-container";
    preloadingGridContainer.style = "height: 100%";
    this.preloadingGrid.show(preloadingGridContainer, null, true);
    render(
      html`
        <div class="empty-state">
          <span class="empty-state-header">${i18nString(UIStrings.noPrefetchAttempts)}</span>
          <div class="empty-state-description">
            <span>${i18nString(UIStrings.prefetchDescription)}</span>
            <devtools-link
              class="devtools-link"
              href=${SPECULATION_EXPLANATION_URL}
              jslogcontext="learn-more"
            >${i18nString(UIStrings.learnMore)}</devtools-link>
          </div>
        </div>
        <devtools-split-view sidebar-position="second" ${UI.Widget.widgetRef(
        UI.SplitWidget.SplitWidget,
        (w) => {
          this.hsplit = w;
        }
      )}>
          <div slot="main" class="overflow-auto" style="height: 100%">
            ${preloadingGridContainer}
          </div>
          <div slot="sidebar" class="overflow-auto" style="height: 100%">
            ${this.preloadingDetails}
          </div>
        </devtools-split-view>`,
      vbox.contentElement,
      { host: this }
    );
    vbox.show(this.contentElement);
  }
  wasShown() {
    super.wasShown();
    this.warningsView.wasShown();
    this.render();
  }
  onScopeChange() {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }
  setFilter(filter) {
    let id = filter.ruleSetId;
    if (id !== null && this.model.getRuleSetById(id) === void 0) {
      id = null;
    }
    this.ruleSetSelector.select(id);
    this.textFilterUI.setValue("");
    this.render();
  }
  onTextFilterChanged() {
    this.render();
  }
  updatePreloadingDetails() {
    const id = this.focusedPreloadingAttemptId;
    const preloadingAttempt = id === null ? null : this.model.getPreloadingAttemptById(id);
    if (preloadingAttempt === null) {
      this.preloadingDetails.data = null;
    } else {
      const pipeline = this.model.getPipeline(preloadingAttempt);
      const ruleSets = preloadingAttempt.ruleSetIds.map((id2) => this.model.getRuleSetById(id2)).filter((x) => x !== null);
      this.preloadingDetails.data = {
        pipeline,
        ruleSets,
        pageURL: pageURL()
      };
    }
  }
  render() {
    const filteringRuleSetId = this.ruleSetSelector.getSelected();
    const rows = this.model.getRepresentativePreloadingAttempts(filteringRuleSetId).map(({ id, value }) => {
      const attempt = value;
      const pipeline = this.model.getPipeline(attempt);
      const ruleSets = attempt.ruleSetIds.flatMap((id2) => {
        const ruleSet = this.model.getRuleSetById(id2);
        return ruleSet === null ? [] : [ruleSet];
      });
      const statusCode = PreloadingHelper.PreloadingForward.preloadStatusCode(attempt);
      return {
        id,
        pipeline,
        ruleSets,
        statusCode
      };
    });
    const filteredRows = applyFilterText(this.textFilterUI.valueWithoutSuggestion(), rows);
    this.preloadingGrid.rows = filteredRows;
    this.preloadingGrid.pageURL = pageURL();
    const wasEmpty = this.contentElement.classList.contains("empty");
    const isEmpty = rows.length === 0;
    this.contentElement.classList.toggle("empty", isEmpty);
    if (wasEmpty && !isEmpty) {
      this.hsplit?.doLayout();
    }
    this.updatePreloadingDetails();
  }
  onPreloadingGridCellFocused({ rowId }) {
    this.focusedPreloadingAttemptId = rowId;
    this.render();
  }
  getRuleSetSelectorToolbarItemForTest() {
    return this.ruleSetSelector.item();
  }
  getPreloadingGridForTest() {
    return this.preloadingGrid;
  }
  getPreloadingDetailsForTest() {
    return this.preloadingDetails;
  }
  selectRuleSetOnFilterForTest(id) {
    this.ruleSetSelector.select(id);
  }
}
export class PreloadingSummaryView extends UI.Widget.VBox {
  model;
  warningsContainer;
  warningsView = new PreloadingComponents.PreloadingDisabledInfobar.PreloadingDisabledInfobar();
  usedPreloading = new PreloadingComponents.UsedPreloadingView.UsedPreloadingView();
  constructor(model) {
    super({
      jslog: `${VisualLogging.pane("speculative-loads")}`,
      useShadowDom: true
    });
    this.registerRequiredCSS(emptyWidgetStyles, preloadingViewStyles);
    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.MODEL_UPDATED,
      this.render,
      this,
      { scoped: true }
    );
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.WARNINGS_UPDATED,
      (e) => {
        Object.assign(this.warningsView, e.data);
      },
      this,
      { scoped: true }
    );
    this.warningsContainer = document.createElement("div");
    this.warningsContainer.classList.add("flex-none");
    this.contentElement.insertBefore(this.warningsContainer, this.contentElement.firstChild);
    this.warningsView.show(this.warningsContainer);
    this.usedPreloading.show(this.contentElement);
  }
  wasShown() {
    super.wasShown();
    this.warningsView.wasShown();
    this.render();
  }
  onScopeChange() {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.render();
  }
  render() {
    this.usedPreloading.data = {
      pageURL: SDK.TargetManager.TargetManager.instance().scopeTarget()?.inspectedURL() || "",
      previousAttempts: this.model.getRepresentativePreloadingAttemptsOfPreviousPage().map(({ value }) => value),
      currentAttempts: this.model.getRepresentativePreloadingAttempts(null).map(({ value }) => value)
    };
  }
  getUsedPreloadingForTest() {
    return this.usedPreloading;
  }
}
class PreloadingRuleSetSelector {
  model;
  onSelectionChanged = () => {
  };
  toolbarItem;
  listModel;
  dropDown;
  constructor(onSelectionChanged) {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    SDK.TargetManager.TargetManager.instance().addScopeChangeListener(this.onScopeChange.bind(this));
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.PreloadingModel.PreloadingModel,
      SDK.PreloadingModel.Events.MODEL_UPDATED,
      this.onModelUpdated,
      this,
      { scoped: true }
    );
    this.listModel = new UI.ListModel.ListModel();
    this.dropDown = new UI.SoftDropDown.SoftDropDown(this.listModel, this);
    this.dropDown.setRowHeight(36);
    this.dropDown.setPlaceholderText(i18nString(UIStrings.filterAllPreloads));
    this.toolbarItem = new UI.Toolbar.ToolbarItem(this.dropDown.element);
    this.toolbarItem.setTitle(i18nString(UIStrings.filterFilterByRuleSet));
    this.toolbarItem.element.classList.add("toolbar-has-dropdown");
    this.toolbarItem.element.setAttribute(
      "jslog",
      `${VisualLogging.action("filter-by-rule-set").track({ click: true })}`
    );
    this.onModelUpdated();
    this.onSelectionChanged = onSelectionChanged;
  }
  onScopeChange() {
    const model = SDK.TargetManager.TargetManager.instance().scopeTarget()?.model(SDK.PreloadingModel.PreloadingModel);
    assertNotNullOrUndefined(model);
    this.model = model;
    this.onModelUpdated();
  }
  onModelUpdated() {
    const ids = this.model.getAllRuleSets().map(({ id }) => id);
    const items = [AllRuleSetRootId, ...ids];
    const selected = this.dropDown.getSelectedItem();
    const newSelected = selected === null || !items.includes(selected) ? AllRuleSetRootId : selected;
    this.listModel.replaceAll(items);
    this.dropDown.selectItem(newSelected);
    this.updateWidth(items);
  }
  // Updates the width for the DropDown element.
  updateWidth(items) {
    const DEFAULT_WIDTH = 315;
    const urlLengths = items.map((x) => this.titleFor(x).length);
    const maxLength = Math.max(...urlLengths);
    const width = Math.min(maxLength * 6 + 16, DEFAULT_WIDTH);
    this.dropDown.setWidth(width);
  }
  // AllRuleSetRootId is used within the selector to indicate the root item. When interacting with PreloadingModel,
  // it should be translated to null.
  translateItemIdToRuleSetId(id) {
    if (id === AllRuleSetRootId) {
      return null;
    }
    return id;
  }
  getSelected() {
    const selectItem = this.dropDown.getSelectedItem();
    if (selectItem === null) {
      return null;
    }
    return this.translateItemIdToRuleSetId(selectItem);
  }
  select(id) {
    this.dropDown.selectItem(id);
  }
  // Method for UI.Toolbar.Provider
  item() {
    return this.toolbarItem;
  }
  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|typeof AllRuleSetRootId>
  titleFor(id) {
    const convertedId = this.translateItemIdToRuleSetId(id);
    if (convertedId === null) {
      return i18nString(UIStrings.filterAllPreloads);
    }
    const ruleSet = this.model.getRuleSetById(convertedId);
    if (ruleSet === null) {
      return i18n.i18n.lockedString("Internal error");
    }
    return ruleSetTagOrLocationShort(ruleSet, pageURL());
  }
  subtitleFor(id) {
    const convertedId = this.translateItemIdToRuleSetId(id);
    const countsByStatus = this.model.getPreloadCountsByRuleSetId().get(convertedId) || /* @__PURE__ */ new Map();
    return PreloadingUIUtils.preloadsStatusSummary(countsByStatus) || `(${i18nString(UIStrings.noRuleSets)})`;
  }
  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|typeof AllRuleSetRootId>
  createElementForItem(id) {
    const element = document.createElement("div");
    const shadowRoot = UI.UIUtils.createShadowRootWithCoreStyles(element, { cssFile: preloadingViewDropDownStyles });
    const title = shadowRoot.createChild("div", "title");
    UI.UIUtils.createTextChild(title, Platform.StringUtilities.trimEndWithMaxLength(this.titleFor(id), 100));
    const subTitle = shadowRoot.createChild("div", "subtitle");
    UI.UIUtils.createTextChild(subTitle, this.subtitleFor(id));
    return element;
  }
  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|typeof AllRuleSetRootId>
  isItemSelectable(_id) {
    return true;
  }
  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|typeof AllRuleSetRootId>
  itemSelected(_id) {
    this.onSelectionChanged();
  }
  // Method for UI.SoftDropDown.Delegate<Protocol.Preload.RuleSetId|typeof AllRuleSetRootId>
  highlightedItemChanged(_from, _to, _fromElement, _toElement) {
  }
}
//# sourceMappingURL=PreloadingView.js.map
