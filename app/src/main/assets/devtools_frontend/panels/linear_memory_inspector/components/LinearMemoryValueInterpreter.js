"use strict";
import "../../../ui/kit/kit.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Buttons from "../../../ui/components/buttons/buttons.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import linearMemoryValueInterpreterStyles from "./linearMemoryValueInterpreter.css.js";
import { ValueInterpreterDisplay } from "./ValueInterpreterDisplay.js";
import { Endianness } from "./ValueInterpreterDisplayUtils.js";
import { ValueInterpreterSettings } from "./ValueInterpreterSettings.js";
const UIStrings = {
  /**
   * @description Tooltip text that appears when hovering over the gear button to open and close settings in the Linear memory inspector. These settings
   *             allow the user to change the value type to view, such as 32-bit Integer, or 32-bit Float.
   */
  toggleValueTypeSettings: "Toggle value type settings",
  /**
   * @description Tooltip text that appears when hovering over the 'Little Endian' or 'Big Endian' setting in the Linear memory inspector.
   */
  changeEndianness: "Change `Endianness`"
};
const str_ = i18n.i18n.registerUIStrings("panels/linear_memory_inspector/components/LinearMemoryValueInterpreter.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { render, html } = Lit;
const { widget } = UI.Widget;
function renderEndiannessSetting(onEndiannessChanged, currentEndiannes) {
  return html`
    <label data-endianness-setting="true" title=${i18nString(UIStrings.changeEndianness)}>
      <select
        jslog=${VisualLogging.dropDown("linear-memory-inspector.endianess").track({ change: true })}
        style="border: none;"
        data-endianness="true" @change=${(e) => onEndiannessChanged(e.target.value)}>
        ${[Endianness.LITTLE, Endianness.BIG].map((endianness) => {
    return html`<option value=${endianness} .selected=${currentEndiannes === endianness}
            jslog=${VisualLogging.item(Platform.StringUtilities.toKebabCase(endianness)).track({ click: true, resize: true })}>${i18n.i18n.lockedString(endianness)}</option>`;
  })}
      </select>
    </label>
    `;
}
export const DEFAULT_VIEW = (input, _output, target) => {
  render(
    html`
    <style>${UI.inspectorCommonStyles}</style>
    <style>${linearMemoryValueInterpreterStyles}</style>
    <div class="value-interpreter">
      <div class="settings-toolbar">
        ${renderEndiannessSetting(input.onEndiannessChanged, input.endianness)}
        <devtools-button data-settings="true" class="toolbar-button ${input.showSettings ? "" : "disabled"}"
            title=${i18nString(UIStrings.toggleValueTypeSettings)} @click=${input.onSettingsToggle}
            jslog=${VisualLogging.toggleSubpane("linear-memory-inspector.toggle-value-settings").track({ click: true })}
            .iconName=${"gear"}
            .toggledIconName=${"gear-filled"}
            .toggleType=${Buttons.Button.ToggleType.PRIMARY}
            .variant=${Buttons.Button.Variant.ICON_TOGGLE}
        ></devtools-button>
      </div>
      <span class="divider"></span>
      <div>
        ${input.showSettings ? widget(ValueInterpreterSettings, {
      valueTypes: input.valueTypes,
      onToggle: input.onValueTypeToggled
    }) : widget(ValueInterpreterDisplay, {
      buffer: input.buffer,
      valueTypes: input.valueTypes,
      endianness: input.endianness,
      valueTypeModes: input.valueTypeModes,
      memoryLength: input.memoryLength,
      onValueTypeModeChange: input.onValueTypeModeChange,
      onJumpToAddressClicked: input.onJumpToAddressClicked
    })}
      </div>
    </div>
  `,
    target
  );
};
export class LinearMemoryValueInterpreter extends UI.Widget.Widget {
  #view;
  #endianness = Endianness.LITTLE;
  #buffer = new ArrayBuffer(0);
  #valueTypes = /* @__PURE__ */ new Set();
  #valueTypeModeConfig = /* @__PURE__ */ new Map();
  #memoryLength = 0;
  #showSettings = false;
  #onValueTypeModeChange = () => {
  };
  #onJumpToAddressClicked = () => {
  };
  #onEndiannessChanged = () => {
  };
  #onValueTypeToggled = () => {
  };
  constructor(element, view = DEFAULT_VIEW) {
    super(element);
    this.#view = view;
  }
  set buffer(value) {
    this.#buffer = value;
    this.requestUpdate();
  }
  get buffer() {
    return this.#buffer;
  }
  set valueTypes(value) {
    this.#valueTypes = value;
    this.requestUpdate();
  }
  get valueTypes() {
    return this.#valueTypes;
  }
  set valueTypeModes(value) {
    this.#valueTypeModeConfig = value;
    this.requestUpdate();
  }
  get valueTypeModes() {
    return this.#valueTypeModeConfig;
  }
  set endianness(value) {
    this.#endianness = value;
    this.requestUpdate();
  }
  get endianness() {
    return this.#endianness;
  }
  set memoryLength(value) {
    this.#memoryLength = value;
    this.requestUpdate();
  }
  get memoryLength() {
    return this.#memoryLength;
  }
  get onValueTypeModeChange() {
    return this.#onValueTypeModeChange;
  }
  set onValueTypeModeChange(value) {
    this.#onValueTypeModeChange = value;
    this.requestUpdate();
  }
  get onJumpToAddressClicked() {
    return this.#onJumpToAddressClicked;
  }
  set onJumpToAddressClicked(value) {
    this.#onJumpToAddressClicked = value;
    this.requestUpdate();
  }
  get onEndiannessChanged() {
    return this.#onEndiannessChanged;
  }
  set onEndiannessChanged(value) {
    this.#onEndiannessChanged = value;
    this.performUpdate();
  }
  get onValueTypeToggled() {
    return this.#onValueTypeToggled;
  }
  set onValueTypeToggled(value) {
    this.#onValueTypeToggled = value;
    this.performUpdate();
  }
  performUpdate() {
    const viewInput = {
      endianness: this.#endianness,
      buffer: this.#buffer,
      valueTypes: this.#valueTypes,
      valueTypeModes: this.#valueTypeModeConfig,
      memoryLength: this.#memoryLength,
      showSettings: this.#showSettings,
      onValueTypeModeChange: this.#onValueTypeModeChange,
      onJumpToAddressClicked: this.#onJumpToAddressClicked,
      onEndiannessChanged: this.#onEndiannessChanged,
      onValueTypeToggled: this.#onValueTypeToggled,
      onSettingsToggle: this.#onSettingsToggle.bind(this)
    };
    this.#view(viewInput, void 0, this.contentElement);
  }
  #onSettingsToggle() {
    this.#showSettings = !this.#showSettings;
    this.requestUpdate();
  }
}
//# sourceMappingURL=LinearMemoryValueInterpreter.js.map
