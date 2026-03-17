"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import { ValueType, valueTypeToLocalizedString } from "./ValueInterpreterDisplayUtils.js";
import valueInterpreterSettingsStyles from "./valueInterpreterSettings.css.js";
const { render, html } = Lit;
const UIStrings = {
  /**
   * @description Name of a group of selectable value types that do not fall under integer and floating point value types, e.g. Pointer32. The group appears name appears under the Value Interpreter Settings.
   */
  otherGroup: "Other"
};
const str_ = i18n.i18n.registerUIStrings("panels/linear_memory_inspector/components/ValueInterpreterSettings.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
var ValueTypeGroup = /* @__PURE__ */ ((ValueTypeGroup2) => {
  ValueTypeGroup2["INTEGER"] = "Integer";
  ValueTypeGroup2["FLOAT"] = "Floating point";
  ValueTypeGroup2["OTHER"] = "Other";
  return ValueTypeGroup2;
})(ValueTypeGroup || {});
const GROUP_TO_TYPES = /* @__PURE__ */ new Map(
  [
    ["Integer" /* INTEGER */, [ValueType.INT8, ValueType.INT16, ValueType.INT32, ValueType.INT64]],
    ["Floating point" /* FLOAT */, [ValueType.FLOAT32, ValueType.FLOAT64]],
    ["Other" /* OTHER */, [ValueType.POINTER32, ValueType.POINTER64]]
  ]
);
function valueTypeGroupToLocalizedString(group) {
  if (group === "Other" /* OTHER */) {
    return i18nString(UIStrings.otherGroup);
  }
  return group;
}
export const DEFAULT_VIEW = (input, _output, target) => {
  render(html`
      <style>${valueInterpreterSettingsStyles}</style>
      <div class="settings" jslog=${VisualLogging.pane("settings")}>
       ${[...GROUP_TO_TYPES.keys()].map((group) => {
    const types = GROUP_TO_TYPES.get(group) ?? [];
    return html`
          <div class="value-types-selection">
            <span class="group">${valueTypeGroupToLocalizedString(group)}</span>
            ${types.map((type) => {
      return html`
                <devtools-checkbox
                  title=${valueTypeToLocalizedString(type)}
                  ?checked=${input.valueTypes.has(type)}
                  @change=${(e) => {
        const checkbox = e.target;
        input.onToggle(type, checkbox.checked);
      }} jslog=${VisualLogging.toggle().track({ change: true }).context(Platform.StringUtilities.toKebabCase(type))}
                  }>${valueTypeToLocalizedString(type)}</devtools-checkbox>
         `;
    })}
          </div>
        `;
  })}
      </div>
      `, target);
};
export class ValueInterpreterSettings extends UI.Widget.Widget {
  #view;
  #valueTypes = /* @__PURE__ */ new Set();
  #onToggle = () => {
  };
  constructor(element, view = DEFAULT_VIEW) {
    super(element);
    this.#view = view;
  }
  get valueTypes() {
    return this.#valueTypes;
  }
  set valueTypes(value) {
    this.#valueTypes = value;
    this.requestUpdate();
  }
  get onToggle() {
    return this.#onToggle;
  }
  set onToggle(value) {
    this.#onToggle = value;
    this.requestUpdate();
  }
  performUpdate() {
    const viewInput = {
      valueTypes: this.#valueTypes,
      onToggle: this.#onToggle
    };
    this.#view(viewInput, void 0, this.contentElement);
  }
}
//# sourceMappingURL=ValueInterpreterSettings.js.map
