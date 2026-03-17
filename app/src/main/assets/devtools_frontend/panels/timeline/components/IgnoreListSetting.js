"use strict";
import "../../../ui/components/menus/menus.js";
import * as Common from "../../../core/common/common.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Workspace from "../../../models/workspace/workspace.js";
import * as Buttons from "../../../ui/components/buttons/buttons.js";
import * as Dialogs from "../../../ui/components/dialogs/dialogs.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import ignoreListSettingStyles from "./ignoreListSetting.css.js";
const { html, Directives } = Lit;
const { live } = Directives;
const UIStrings = {
  /**
   * @description Text title for the button to open the ignore list setting.
   */
  showIgnoreListSettingDialog: "Show ignore list setting dialog",
  /**
   * @description Text title for ignore list setting.
   */
  ignoreList: "Ignore list",
  /**
   * @description Text description for ignore list setting.
   */
  ignoreListDescription: "Add regular expression rules to remove matching scripts from the flame chart.",
  /**
   * @description Pattern title in Framework Ignore List Settings Tab of the Settings
   * @example {ad.*?} regex
   */
  ignoreScriptsWhoseNamesMatchS: "Ignore scripts whose names match ''{regex}''",
  /**
   * @description Label for the button to remove an regex
   * @example {ad.*?} regex
   */
  removeRegex: "Remove the regex: ''{regex}''",
  /**
   * @description Aria accessible name in Ignore List Settings Dialog in Performance panel. It labels the input
   * field used to add new or edit existing regular expressions that match file names to ignore in the debugger.
   */
  addNewRegex: "Add a regular expression rule for the script's URL",
  /**
   * @description Aria accessible name in Ignore List Settings Dialog in Performance panel. It labels the checkbox of
   * the input field used to enable the new regular expressions that match file names to ignore in the debugger.
   */
  ignoreScriptsWhoseNamesMatchNewRegex: "Ignore scripts whose names match the new regex"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/IgnoreListSetting.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export const DEFAULT_VIEW = (input, output, target) => {
  const {
    ignoreListEnabled,
    regexes,
    newRegexValue,
    newRegexChecked,
    onExistingRegexEnableToggle,
    onRemoveRegexByIndex,
    onNewRegexInputBlur,
    onNewRegexInputChange,
    onNewRegexInputFocus,
    onNewRegexAdd,
    onNewRegexCancel
  } = input;
  function renderItem(regex, index) {
    const helpText = i18nString(UIStrings.ignoreScriptsWhoseNamesMatchS, { regex: regex.pattern });
    return html`
      <div class='regex-row'>
        <devtools-checkbox title=${helpText} aria-label=${helpText} ?checked=${!regex.disabled}
          @change=${(event) => onExistingRegexEnableToggle(regex, event.currentTarget.checked)}
          .jslogContext=${"timeline.ignore-list-pattern"}>${regex.pattern}</devtools-checkbox>
        <devtools-button
            @click=${() => onRemoveRegexByIndex(index)}
            .data=${{
      variant: Buttons.Button.Variant.ICON,
      iconName: "bin",
      title: i18nString(UIStrings.removeRegex, { regex: regex.pattern }),
      jslogContext: "timeline.ignore-list-pattern.remove"
    }}>
        </devtools-button>
      </div>
    `;
  }
  Lit.render(html`
    <style>${ignoreListSettingStyles}</style>
    <devtools-button-dialog
      @contextmenu=${(e) => e.stopPropagation()}
      .data=${{
    openOnRender: false,
    jslogContext: "timeline.ignore-list",
    variant: Buttons.Button.Variant.TOOLBAR,
    iconName: "compress",
    disabled: !ignoreListEnabled,
    iconTitle: i18nString(UIStrings.showIgnoreListSettingDialog),
    horizontalAlignment: Dialogs.Dialog.DialogHorizontalAlignment.AUTO,
    closeButton: true,
    dialogTitle: i18nString(UIStrings.ignoreList)
  }}>
      <div class='ignore-list-setting-content'>
        <div class='ignore-list-setting-description'>${i18nString(UIStrings.ignoreListDescription)}</div>
        ${regexes.map(renderItem)}

        <div class='new-regex-row'>
          <devtools-checkbox
            title=${i18nString(UIStrings.ignoreScriptsWhoseNamesMatchNewRegex)}
            .jslogContext=${"timeline.ignore-list-new-regex.checkbox"}
            .checked=${newRegexChecked}
          >
          </devtools-checkbox>
          <input
            @blur=${(event) => onNewRegexInputBlur(event.currentTarget.value)}
            @input=${(event) => onNewRegexInputChange(event.currentTarget.value)}
            @focus=${(event) => onNewRegexInputFocus(event.currentTarget.value)}
            @keydown=${(event) => {
    const el = event.currentTarget;
    if (event.key === Platform.KeyboardUtilities.ENTER_KEY) {
      onNewRegexAdd(el.value);
    } else if (event.key === Platform.KeyboardUtilities.ESCAPE_KEY) {
      onNewRegexCancel();
      el.blur();
      event.stopImmediatePropagation();
    }
  }}
            class="harmony-input new-regex-text-input"
            title=${i18nString(UIStrings.addNewRegex)}
            placeholder='/framework\\.js$'
            .value=${live(newRegexValue)}
            .jslogContext=${"timeline.ignore-list-new-regex.text"}>
        </div>
      </div>
    </devtools-button-dialog>
  `, target);
};
export class IgnoreListSetting extends UI.Widget.Widget {
  static createWidgetElement() {
    const widgetElement = document.createElement("devtools-widget");
    widgetElement.widgetConfig = UI.Widget.widgetConfig(IgnoreListSetting);
    return widgetElement;
  }
  #view;
  #ignoreListEnabled = Common.Settings.Settings.instance().moduleSetting("enable-ignore-listing");
  #regexPatterns = this.#getSkipStackFramesPatternSetting().getAsArray();
  #newRegexValue = "";
  #newRegexChecked = false;
  #editingRegexSetting = null;
  constructor(element, view = DEFAULT_VIEW) {
    super(element, { useShadowDom: true });
    this.#view = view;
    this.element.classList.remove("vbox", "flex-auto");
    Common.Settings.Settings.instance().moduleSetting("skip-stack-frames-pattern").addChangeListener(this.requestUpdate.bind(this));
    Common.Settings.Settings.instance().moduleSetting("enable-ignore-listing").addChangeListener(this.requestUpdate.bind(this));
  }
  #getSkipStackFramesPatternSetting() {
    return Common.Settings.Settings.instance().moduleSetting("skip-stack-frames-pattern");
  }
  #onNewRegexInputFocus(value) {
    this.#editingRegexSetting = { pattern: value, disabled: false };
    this.#regexPatterns.push(this.#editingRegexSetting);
  }
  #finishEditing() {
    if (!this.#editingRegexSetting) {
      return;
    }
    const lastRegex = this.#regexPatterns.pop();
    if (lastRegex && lastRegex !== this.#editingRegexSetting) {
      console.warn("The last regex is not the editing one.");
      this.#regexPatterns.push(lastRegex);
    }
    this.#editingRegexSetting = null;
    this.#getSkipStackFramesPatternSetting().setAsArray(this.#regexPatterns);
  }
  #resetInput() {
    this.#newRegexValue = "";
    this.#newRegexChecked = false;
    this.requestUpdate();
  }
  #onNewRegexInputBlur(value) {
    const newRegex = value.trim();
    this.#finishEditing();
    if (!regexInputIsValid(newRegex)) {
      return;
    }
    Workspace.IgnoreListManager.IgnoreListManager.instance().addRegexToIgnoreList(newRegex);
    this.#resetInput();
  }
  #onNewRegexAdd(value) {
    this.#onNewRegexInputBlur(value);
    this.#onNewRegexInputFocus("");
  }
  #onNewRegexCancel() {
    this.#finishEditing();
    this.#resetInput();
  }
  /**
   * When it is in the 'preview' mode, the last regex in the array is the editing one.
   * So we want to remove it for some usage, like rendering the existed rules or validating the rules.
   */
  #getExistingRegexes() {
    if (this.#editingRegexSetting) {
      const lastRegex = this.#regexPatterns[this.#regexPatterns.length - 1];
      if (lastRegex && lastRegex === this.#editingRegexSetting) {
        return this.#regexPatterns.slice(0, -1);
      }
    }
    return this.#regexPatterns;
  }
  #onNewRegexInputChange(value) {
    const newRegex = value.trim();
    this.#newRegexValue = newRegex;
    if (this.#editingRegexSetting && regexInputIsValid(newRegex)) {
      this.#editingRegexSetting.pattern = newRegex;
      this.#editingRegexSetting.disabled = !Boolean(newRegex);
      this.#getSkipStackFramesPatternSetting().setAsArray(this.#regexPatterns);
    }
  }
  /**
   * Deal with an existing regex being toggled. Note that this handler only
   * deals with enabling/disabling regexes already in the ignore list, it does
   * not deal with enabling/disabling the new regex.
   */
  #onExistingRegexEnableToggle(regex, checked) {
    regex.disabled = !checked;
    this.#getSkipStackFramesPatternSetting().setAsArray(this.#regexPatterns);
  }
  #onRemoveRegexByIndex(index) {
    this.#regexPatterns.splice(index, 1);
    this.#getSkipStackFramesPatternSetting().setAsArray(this.#regexPatterns);
  }
  performUpdate() {
    const input = {
      ignoreListEnabled: this.#ignoreListEnabled.get(),
      regexes: this.#getExistingRegexes(),
      newRegexValue: this.#newRegexValue,
      newRegexChecked: this.#newRegexChecked,
      onExistingRegexEnableToggle: this.#onExistingRegexEnableToggle.bind(this),
      onRemoveRegexByIndex: this.#onRemoveRegexByIndex.bind(this),
      onNewRegexInputBlur: this.#onNewRegexInputBlur.bind(this),
      onNewRegexInputChange: this.#onNewRegexInputChange.bind(this),
      onNewRegexInputFocus: this.#onNewRegexInputFocus.bind(this),
      onNewRegexAdd: this.#onNewRegexAdd.bind(this),
      onNewRegexCancel: this.#onNewRegexCancel.bind(this)
    };
    this.#view(input, void 0, this.contentElement);
  }
}
export function regexInputIsValid(inputValue) {
  const pattern = inputValue.trim();
  if (!pattern.length) {
    return false;
  }
  let regex;
  try {
    regex = new RegExp(pattern);
  } catch {
  }
  return Boolean(regex);
}
//# sourceMappingURL=IgnoreListSetting.js.map
