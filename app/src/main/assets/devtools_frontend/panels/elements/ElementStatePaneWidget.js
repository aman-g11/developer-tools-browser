"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UIHelpers from "../../ui/helpers/helpers.js";
import * as UI from "../../ui/legacy/legacy.js";
import { html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { ElementsPanel } from "./ElementsPanel.js";
import elementStatePaneWidgetStyles from "./elementStatePaneWidget.css.js";
const { bindToSetting } = UI.UIUtils;
const UIStrings = {
  /**
   * @description Title of a section in the Element State Pane Widget of the Elements panel. The
   * controls in this section allow users to force a particular state on the selected element, e.g. a
   * focused state via :focus or a hover state via :hover.
   */
  forceElementState: "Force element state",
  /**
   * @description Tooltip text in Element State Pane Widget of the Elements panel. For a button that
   * opens a tool that toggles the various states of the selected element on/off.
   */
  toggleElementState: "Toggle Element State",
  /**
   * @description The name of a checkbox setting in the Element & Page State Pane Widget of the Elements panel.. This setting
   * emulates/pretends that the webpage is focused.
   */
  emulateFocusedPage: "Emulate a focused page",
  /**
   * @description Explanation text for the 'Emulate a focused page' setting in the Rendering tool.
   */
  emulatesAFocusedPage: "Keep page focused. Commonly used for debugging disappearing elements.",
  /**
   * @description Similar with forceElementState but allows users to force specific state of the selected element.
   */
  forceElementSpecificStates: "Force specific element state",
  /**
   * @description Text that is usually a hyperlink to more documentation
   */
  learnMore: "Learn more"
};
const str_ = i18n.i18n.registerUIStrings("panels/elements/ElementStatePaneWidget.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
var SpecificPseudoStates = /* @__PURE__ */ ((SpecificPseudoStates2) => {
  SpecificPseudoStates2["ENABLED"] = "enabled";
  SpecificPseudoStates2["DISABLED"] = "disabled";
  SpecificPseudoStates2["VALID"] = "valid";
  SpecificPseudoStates2["INVALID"] = "invalid";
  SpecificPseudoStates2["USER_VALID"] = "user-valid";
  SpecificPseudoStates2["USER_INVALID"] = "user-invalid";
  SpecificPseudoStates2["REQUIRED"] = "required";
  SpecificPseudoStates2["OPTIONAL"] = "optional";
  SpecificPseudoStates2["READ_ONLY"] = "read-only";
  SpecificPseudoStates2["READ_WRITE"] = "read-write";
  SpecificPseudoStates2["IN_RANGE"] = "in-range";
  SpecificPseudoStates2["OUT_OF_RANGE"] = "out-of-range";
  SpecificPseudoStates2["VISITED"] = "visited";
  SpecificPseudoStates2["LINK"] = "link";
  SpecificPseudoStates2["CHECKED"] = "checked";
  SpecificPseudoStates2["INDETERMINATE"] = "indeterminate";
  SpecificPseudoStates2["PLACEHOLDER_SHOWN"] = "placeholder-shown";
  SpecificPseudoStates2["AUTOFILL"] = "autofill";
  SpecificPseudoStates2["OPEN"] = "open";
  SpecificPseudoStates2["TARGET_CURRENT"] = "target-current";
  return SpecificPseudoStates2;
})(SpecificPseudoStates || {});
export const DEFAULT_VIEW = (input, _output, target) => {
  const createElementStateCheckbox = (state) => {
    return html`
        <div id=${state.state}>
          <devtools-checkbox class="small" @click=${input.onStateCheckboxClicked}
              jslog=${VisualLogging.toggle(state.state).track({ change: true })} ?checked=${state.checked} ?disabled=${state.disabled}
              title=${":" + state.state}>
          <span class="source-code">${":" + state.state}</span>
        </devtools-checkbox>
        </div>`;
  };
  render(html`
    <style>${elementStatePaneWidgetStyles}</style>
    <div class="styles-element-state-pane"
        jslog=${VisualLogging.pane("element-states")}>
      <div class="page-state-checkbox">
        <devtools-checkbox class="small" title=${i18nString(UIStrings.emulatesAFocusedPage)}
            ${bindToSetting("emulate-page-focus")}>${i18nString(UIStrings.emulateFocusedPage)}</devtools-checkbox>
        <devtools-button
            @click=${() => UIHelpers.openInNewTab("https://developer.chrome.com/docs/devtools/rendering/apply-effects#emulate_a_focused_page")}
           .data=${{
    variant: Buttons.Button.Variant.ICON,
    iconName: "help",
    size: Buttons.Button.Size.SMALL,
    jslogContext: "learn-more",
    title: i18nString(UIStrings.learnMore)
  }}></devtools-button>
      </div>
      <div class="section-header">
        <span>${i18nString(UIStrings.forceElementState)}</span>
      </div>
      <div class="pseudo-states-container" role="presentation">
        ${input.states.filter(({ type }) => type === "persistent").map((state) => createElementStateCheckbox(state))}
      </div>
      <details class="specific-details" ?hidden=${input.states.filter(({ type }) => type === "specific").every((state) => state.hidden)}>
        <summary class="force-specific-element-header section-header">
          <span>${i18nString(UIStrings.forceElementSpecificStates)}</span>
        </summary>
        <div class="pseudo-states-container specific-pseudo-states" role="presentation">
          ${input.states.filter(({ type, hidden }) => type === "specific" && !hidden).map((state) => createElementStateCheckbox(state))}
        </div>
      </details>
    </div>`, target);
};
export class ElementStatePaneWidget extends UI.Widget.Widget {
  #duals;
  #cssModel;
  #states = /* @__PURE__ */ new Map();
  #view;
  constructor(view = DEFAULT_VIEW) {
    super({ useShadowDom: true });
    this.#view = view;
    this.#duals = /* @__PURE__ */ new Map();
    const setDualStateCheckboxes = (first, second) => {
      this.#duals.set(first, second);
      this.#duals.set(second, first);
    };
    this.#states.set("active", { state: "active", type: "persistent" });
    this.#states.set("hover", { state: "hover", type: "persistent" });
    this.#states.set("focus", { state: "focus", type: "persistent" });
    this.#states.set("focus-within", { state: "focus-within", type: "persistent" });
    this.#states.set("focus-visible", { state: "focus-visible", type: "persistent" });
    this.#states.set("target", { state: "target", type: "persistent" });
    this.#states.set("enabled" /* ENABLED */, { state: "enabled" /* ENABLED */, type: "specific" });
    this.#states.set("disabled" /* DISABLED */, { state: "disabled" /* DISABLED */, type: "specific" });
    this.#states.set("valid" /* VALID */, { state: "valid" /* VALID */, type: "specific" });
    this.#states.set("invalid" /* INVALID */, { state: "invalid" /* INVALID */, type: "specific" });
    this.#states.set("user-valid" /* USER_VALID */, { state: "user-valid" /* USER_VALID */, type: "specific" });
    this.#states.set("user-invalid" /* USER_INVALID */, { state: "user-invalid" /* USER_INVALID */, type: "specific" });
    this.#states.set("required" /* REQUIRED */, { state: "required" /* REQUIRED */, type: "specific" });
    this.#states.set("optional" /* OPTIONAL */, { state: "optional" /* OPTIONAL */, type: "specific" });
    this.#states.set("read-only" /* READ_ONLY */, { state: "read-only" /* READ_ONLY */, type: "specific" });
    this.#states.set("read-write" /* READ_WRITE */, { state: "read-write" /* READ_WRITE */, type: "specific" });
    this.#states.set("in-range" /* IN_RANGE */, { state: "in-range" /* IN_RANGE */, type: "specific" });
    this.#states.set("out-of-range" /* OUT_OF_RANGE */, { state: "out-of-range" /* OUT_OF_RANGE */, type: "specific" });
    this.#states.set("visited" /* VISITED */, { state: "visited" /* VISITED */, type: "specific" });
    this.#states.set("link" /* LINK */, { state: "link" /* LINK */, type: "specific" });
    this.#states.set("checked" /* CHECKED */, { state: "checked" /* CHECKED */, type: "specific" });
    this.#states.set("indeterminate" /* INDETERMINATE */, { state: "indeterminate" /* INDETERMINATE */, type: "specific" });
    this.#states.set(
      "placeholder-shown" /* PLACEHOLDER_SHOWN */,
      { state: "placeholder-shown" /* PLACEHOLDER_SHOWN */, type: "specific" }
    );
    this.#states.set("autofill" /* AUTOFILL */, { state: "autofill" /* AUTOFILL */, type: "specific" });
    this.#states.set("open" /* OPEN */, { state: "open" /* OPEN */, type: "specific" });
    this.#states.set(
      "target-current" /* TARGET_CURRENT */,
      { state: "target-current" /* TARGET_CURRENT */, type: "specific" }
    );
    setDualStateCheckboxes("valid" /* VALID */, "invalid" /* INVALID */);
    setDualStateCheckboxes("user-valid" /* USER_VALID */, "user-invalid" /* USER_INVALID */);
    setDualStateCheckboxes("read-only" /* READ_ONLY */, "read-write" /* READ_WRITE */);
    setDualStateCheckboxes("in-range" /* IN_RANGE */, "out-of-range" /* OUT_OF_RANGE */);
    setDualStateCheckboxes("enabled" /* ENABLED */, "disabled" /* DISABLED */);
    setDualStateCheckboxes("visited" /* VISITED */, "link" /* LINK */);
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this.requestUpdate, this);
  }
  onStateCheckboxClicked(event) {
    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (!node || !(event.target instanceof UI.UIUtils.CheckboxLabel)) {
      return;
    }
    const state = event.target.title.slice(1);
    if (!state) {
      return;
    }
    const checked = event.target.checked;
    const dual = this.#duals.get(state);
    if (checked && dual) {
      node.domModel().cssModel().forcePseudoState(node, dual, false);
    }
    node.domModel().cssModel().forcePseudoState(node, state, checked);
  }
  updateModel(cssModel) {
    if (this.#cssModel === cssModel) {
      return;
    }
    if (this.#cssModel) {
      this.#cssModel.removeEventListener(SDK.CSSModel.Events.PseudoStateForced, this.requestUpdate, this);
    }
    this.#cssModel = cssModel;
    if (this.#cssModel) {
      this.#cssModel.addEventListener(SDK.CSSModel.Events.PseudoStateForced, this.requestUpdate, this);
    }
  }
  wasShown() {
    super.wasShown();
    this.requestUpdate();
  }
  async performUpdate() {
    let node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (node) {
      node = node.enclosingElementOrSelf();
    }
    this.updateModel(node ? node.domModel().cssModel() : null);
    if (node) {
      const nodePseudoState = node.domModel().cssModel().pseudoState(node);
      for (const state of this.#states.values()) {
        state.disabled = Boolean(node.pseudoType());
        state.checked = Boolean(nodePseudoState && nodePseudoState.indexOf(state.state) >= 0);
      }
    } else {
      for (const state of this.#states.values()) {
        state.disabled = true;
        state.checked = false;
      }
    }
    await this.#updateElementSpecificStatesTable(node);
    ButtonProvider.instance().item().setToggled([...this.#states.values()].some((input) => input.checked));
    const viewInput = {
      states: [...this.#states.values()],
      onStateCheckboxClicked: this.onStateCheckboxClicked.bind(this)
    };
    this.#view(viewInput, {}, this.contentElement);
  }
  async #updateElementSpecificStatesTable(node = null) {
    if (!node || node.nodeType() !== Node.ELEMENT_NODE) {
      [...this.#states.values()].filter(({ type }) => type === "specific").forEach((state) => {
        state.hidden = true;
      });
      return;
    }
    const hideSpecificCheckbox = (pseudoClass, hide) => {
      const state = this.#states.get(pseudoClass);
      if (state) {
        state.hidden = hide;
      }
    };
    const isElementOfTypes = (node2, types) => {
      return types.includes(node2.nodeName()?.toLowerCase());
    };
    const isAnchorElementWithHref = (node2) => {
      return isElementOfTypes(node2, ["a"]) && node2.getAttribute("href") !== void 0;
    };
    const isInputWithTypeRadioOrCheckbox = (node2) => {
      return isElementOfTypes(node2, ["input"]) && (node2.getAttribute("type") === "checkbox" || node2.getAttribute("type") === "radio");
    };
    const isContentEditable = (node2) => {
      return node2.getAttribute("contenteditable") !== void 0 || Boolean(node2.parentNode && isContentEditable(node2.parentNode));
    };
    const isDisabled = (node2) => {
      return node2.getAttribute("disabled") !== void 0;
    };
    const isMutable = (node2) => {
      if (isElementOfTypes(node2, ["input", "textarea"])) {
        return node2.getAttribute("readonly") === void 0 && !isDisabled(node2);
      }
      return isContentEditable(node2);
    };
    const isFormAssociatedCustomElement = async (node2) => {
      function getFormAssociatedField() {
        return "formAssociated" in this.constructor && this.constructor.formAssociated === true;
      }
      const response = await node2.callFunction(getFormAssociatedField);
      return response ? response.value : false;
    };
    const isFormAssociated = await isFormAssociatedCustomElement(node);
    if (isElementOfTypes(node, ["button", "input", "select", "textarea", "optgroup", "option", "fieldset"]) || isFormAssociated) {
      hideSpecificCheckbox("enabled" /* ENABLED */, !isDisabled(node));
      hideSpecificCheckbox("disabled" /* DISABLED */, isDisabled(node));
    } else {
      hideSpecificCheckbox("enabled" /* ENABLED */, true);
      hideSpecificCheckbox("disabled" /* DISABLED */, true);
    }
    if (isElementOfTypes(node, ["button", "fieldset", "input", "object", "output", "select", "textarea", "img"]) || isFormAssociated) {
      hideSpecificCheckbox("valid" /* VALID */, false);
      hideSpecificCheckbox("invalid" /* INVALID */, false);
    } else {
      hideSpecificCheckbox("valid" /* VALID */, true);
      hideSpecificCheckbox("invalid" /* INVALID */, true);
    }
    if (isElementOfTypes(node, ["input", "select", "textarea"])) {
      hideSpecificCheckbox("user-valid" /* USER_VALID */, false);
      hideSpecificCheckbox("user-invalid" /* USER_INVALID */, false);
      if (node.getAttribute("required") === void 0) {
        hideSpecificCheckbox("required" /* REQUIRED */, false);
        hideSpecificCheckbox("optional" /* OPTIONAL */, true);
      } else {
        hideSpecificCheckbox("required" /* REQUIRED */, true);
        hideSpecificCheckbox("optional" /* OPTIONAL */, false);
      }
    } else {
      hideSpecificCheckbox("user-valid" /* USER_VALID */, true);
      hideSpecificCheckbox("user-invalid" /* USER_INVALID */, true);
      hideSpecificCheckbox("required" /* REQUIRED */, true);
      hideSpecificCheckbox("optional" /* OPTIONAL */, true);
    }
    if (isMutable(node)) {
      hideSpecificCheckbox("read-write" /* READ_WRITE */, true);
      hideSpecificCheckbox("read-only" /* READ_ONLY */, false);
    } else {
      hideSpecificCheckbox("read-write" /* READ_WRITE */, false);
      hideSpecificCheckbox("read-only" /* READ_ONLY */, true);
    }
    if (isElementOfTypes(node, ["input"]) && (node.getAttribute("min") !== void 0 || node.getAttribute("max") !== void 0)) {
      hideSpecificCheckbox("in-range" /* IN_RANGE */, false);
      hideSpecificCheckbox("out-of-range" /* OUT_OF_RANGE */, false);
    } else {
      hideSpecificCheckbox("in-range" /* IN_RANGE */, true);
      hideSpecificCheckbox("out-of-range" /* OUT_OF_RANGE */, true);
    }
    if (isElementOfTypes(node, ["a", "area"]) && node.getAttribute("href") !== void 0) {
      hideSpecificCheckbox("visited" /* VISITED */, false);
      hideSpecificCheckbox("link" /* LINK */, false);
    } else {
      hideSpecificCheckbox("visited" /* VISITED */, true);
      hideSpecificCheckbox("link" /* LINK */, true);
    }
    if (isInputWithTypeRadioOrCheckbox(node) || isElementOfTypes(node, ["option"])) {
      hideSpecificCheckbox("checked" /* CHECKED */, false);
    } else {
      hideSpecificCheckbox("checked" /* CHECKED */, true);
    }
    if (isInputWithTypeRadioOrCheckbox(node) || isElementOfTypes(node, ["progress"])) {
      hideSpecificCheckbox("indeterminate" /* INDETERMINATE */, false);
    } else {
      hideSpecificCheckbox("indeterminate" /* INDETERMINATE */, true);
    }
    if (isElementOfTypes(node, ["input", "textarea"])) {
      hideSpecificCheckbox("placeholder-shown" /* PLACEHOLDER_SHOWN */, false);
    } else {
      hideSpecificCheckbox("placeholder-shown" /* PLACEHOLDER_SHOWN */, true);
    }
    if (isElementOfTypes(node, ["input"])) {
      hideSpecificCheckbox("autofill" /* AUTOFILL */, false);
    } else {
      hideSpecificCheckbox("autofill" /* AUTOFILL */, true);
    }
    if (isElementOfTypes(node, ["input", "select", "dialog", "details"])) {
      hideSpecificCheckbox("open" /* OPEN */, false);
    } else {
      hideSpecificCheckbox("open" /* OPEN */, true);
    }
    if (isAnchorElementWithHref(node) || node.pseudoType() === "scroll-marker") {
      hideSpecificCheckbox("target-current" /* TARGET_CURRENT */, false);
    } else {
      hideSpecificCheckbox("target-current" /* TARGET_CURRENT */, true);
    }
  }
}
let buttonProviderInstance;
export class ButtonProvider {
  button;
  view;
  constructor() {
    this.button = new UI.Toolbar.ToolbarToggle(i18nString(UIStrings.toggleElementState), "hover");
    this.button.addEventListener(UI.Toolbar.ToolbarButton.Events.CLICK, this.clicked, this);
    this.button.element.classList.add("element-state");
    this.button.element.setAttribute("jslog", `${VisualLogging.toggleSubpane("element-states").track({ click: true })}`);
    this.button.element.style.setProperty("--dot-toggle-top", "12px");
    this.button.element.style.setProperty("--dot-toggle-left", "18px");
    this.view = new ElementStatePaneWidget();
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!buttonProviderInstance || forceNew) {
      buttonProviderInstance = new ButtonProvider();
    }
    return buttonProviderInstance;
  }
  clicked() {
    ElementsPanel.instance().showToolbarPane(!this.view.isShowing() ? this.view : null, this.button);
  }
  item() {
    return this.button;
  }
}
//# sourceMappingURL=ElementStatePaneWidget.js.map
