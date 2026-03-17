"use strict";
import "../tooltips/tooltips.js";
import "./SettingDeprecationWarning.js";
import "../../kit/kit.js";
import * as Host from "../../../core/host/host.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Lit from "../../lit/lit.js";
import * as VisualLogging from "../../visual_logging/visual_logging.js";
import * as Buttons from "../buttons/buttons.js";
import * as Input from "../input/input.js";
import settingCheckboxStyles from "./settingCheckbox.css.js";
const { html, Directives: { ifDefined } } = Lit;
const UIStrings = {
  /**
   * @description Text that is usually a hyperlink to more documentation
   */
  learnMore: "Learn more"
};
const str_ = i18n.i18n.registerUIStrings("ui/components/settings/SettingCheckbox.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class SettingCheckbox extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #setting;
  #changeListenerDescriptor;
  #textOverride;
  set data(data) {
    if (this.#changeListenerDescriptor && this.#setting) {
      this.#setting.removeChangeListener(this.#changeListenerDescriptor.listener);
    }
    this.#setting = data.setting;
    this.#textOverride = data.textOverride;
    this.#changeListenerDescriptor = this.#setting.addChangeListener(() => {
      this.#render();
    });
    this.#render();
  }
  icon() {
    if (!this.#setting) {
      return void 0;
    }
    if (this.#setting.deprecation) {
      return html`<devtools-setting-deprecation-warning .data=${this.#setting.deprecation}></devtools-setting-deprecation-warning>`;
    }
    const learnMore = this.#setting.learnMore();
    if (learnMore) {
      const jsLogContext = `${this.#setting.name}-documentation`;
      const data = {
        iconName: "info",
        variant: Buttons.Button.Variant.ICON,
        size: Buttons.Button.Size.SMALL,
        jslogContext: jsLogContext
      };
      const url = learnMore.url;
      if (learnMore.tooltip) {
        const id = `${this.#setting.name}-information`;
        return html`
          <devtools-button
            class="info-icon"
            aria-details=${id}
            aria-disabled=true
            accessibleLabel=${learnMore.tooltip()}
            .data=${data}
          ></devtools-button>
          <devtools-tooltip id=${id} variant="rich">
            <span>${learnMore.tooltip()}</span><br />
            ${url ? html`<devtools-link
                  href=${url}
                  class="link"
                  .jslogContext=${jsLogContext}
                  >${i18nString(UIStrings.learnMore)}</devtools-link
                >` : Lit.nothing}
          </devtools-tooltip>
        `;
      }
      if (url) {
        const handleClick = (event) => {
          Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(url);
          event.consume();
        };
        data.iconName = "help";
        data.title = i18nString(UIStrings.learnMore);
        return html`<devtools-button
          class="info-icon"
          @click=${handleClick}
          .data=${data}
        ></devtools-button>`;
      }
    }
    return void 0;
  }
  get checked() {
    if (!this.#setting || this.#setting.disabledReasons().length > 0) {
      return false;
    }
    return this.#setting.get();
  }
  #render() {
    if (!this.#setting) {
      throw new Error('No "Setting" object provided for rendering');
    }
    const icon = this.icon();
    const title = `${this.#setting.learnMore() ? this.#setting.learnMore()?.tooltip?.() : ""}`;
    const disabledReasons = this.#setting.disabledReasons();
    const reason = disabledReasons.length ? html`
      <devtools-button class="disabled-reason" .iconName=${"info"} .variant=${Buttons.Button.Variant.ICON} .size=${Buttons.Button.Size.SMALL} title=${ifDefined(disabledReasons.join("\n"))} @click=${onclick}></devtools-button>
    ` : Lit.nothing;
    Lit.render(
      html`
      <style>${Input.checkboxStyles}</style>
      <style>${settingCheckboxStyles}</style>
      <p>
        <label title=${title}>
          <input
            type="checkbox"
            .checked=${this.checked}
            ?disabled=${this.#setting.disabled()}
            @change=${this.#checkboxChanged}
            jslog=${VisualLogging.toggle().track({ change: true }).context(this.#setting.name)}
            aria-label=${this.#setting.title()}
          />
          ${this.#textOverride || this.#setting.title()}${reason}
        </label>
        ${icon}
      </p>`,
      this.#shadow,
      { host: this }
    );
  }
  #checkboxChanged(e) {
    this.#setting?.set(e.target.checked);
    this.dispatchEvent(new CustomEvent("change", {
      bubbles: true,
      composed: false
    }));
  }
}
customElements.define("setting-checkbox", SettingCheckbox);
//# sourceMappingURL=SettingCheckbox.js.map
