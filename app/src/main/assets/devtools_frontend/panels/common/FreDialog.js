"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as Lit from "../../ui/lit/lit.js";
import styles from "./freDialog.css.js";
const { html, Directives: { ifDefined } } = Lit;
const UIStrings = {
  /**
   * @description Header text for the feature reminder dialog.
   */
  thingsToConsider: "Things to consider",
  /**
   * @description Text for the learn more button in the feature reminder dialog.
   */
  learnMore: "Learn more",
  /**
   * @description Text for the cancel button in the feature reminder dialog.
   */
  cancel: "Cancel",
  /**
   * @description Text for the got it button in the feature reminder dialog.
   */
  gotIt: "Got it"
};
const str_ = i18n.i18n.registerUIStrings("panels/common/FreDialog.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class FreDialog {
  static show({ header, reminderItems, onLearnMoreClick, ariaLabel, learnMoreButtonText, learnMoreButtonAriaLabel }) {
    const dialog = new UI.Dialog.Dialog();
    if (ariaLabel) {
      dialog.setAriaLabel(ariaLabel);
    }
    dialog.contentElement.tabIndex = -1;
    const result = Promise.withResolvers();
    Lit.render(html`
      <div class="fre-disclaimer">
        <style>
          ${styles}
        </style>
        <header>
          <div class="header-icon-container">
            <devtools-icon name=${header.iconName}></devtools-icon>
          </div>
          <h2 tabindex="-1">
            ${header.text}
          </h2>
        </header>
        <main class="reminder-container">
          <h3>${i18nString(UIStrings.thingsToConsider)}</h3>
          ${reminderItems.map((reminderItem) => html`
            <div class="reminder-item">
              <devtools-icon class="reminder-icon" name=${reminderItem.iconName}></devtools-icon>
              <span>${reminderItem.content}</span>
            </div>
          `)}
        </main>
        <footer>
          <devtools-button
            @click=${onLearnMoreClick}
            .jslogContext=${"fre-disclaimer.learn-more"}
            .variant=${Buttons.Button.Variant.OUTLINED}
            .title=${learnMoreButtonAriaLabel ?? i18nString(UIStrings.learnMore)}
            aria-label=${ifDefined(learnMoreButtonAriaLabel)}>
            ${learnMoreButtonText ?? i18nString(UIStrings.learnMore)}
          </devtools-button>
          <div class="right-buttons">
            <devtools-button
              @click=${() => {
      result.resolve(false);
      dialog.hide();
    }}
              .jslogContext=${"fre-disclaimer.cancel"}
              .variant=${Buttons.Button.Variant.TONAL}>
              ${i18nString(UIStrings.cancel)}
            </devtools-button>
            <devtools-button
              @click=${() => {
      result.resolve(true);
      dialog.hide();
    }}
              .jslogContext=${"fre-disclaimer.continue"}
              .variant=${Buttons.Button.Variant.PRIMARY}>
              ${i18nString(UIStrings.gotIt)}
            </devtools-button>
          </div>
        </footer>
      </div>`, dialog.contentElement);
    dialog.setOutsideClickCallback((ev) => {
      ev.consume(true);
      dialog.hide();
      result.resolve(false);
    });
    dialog.setOnHideCallback(() => {
      result.resolve(false);
    });
    dialog.setSizeBehavior(UI.GlassPane.SizeBehavior.MEASURE_CONTENT);
    dialog.setDimmed(true);
    dialog.show();
    dialog.contentElement.focus();
    return result.promise;
  }
  constructor() {
  }
}
//# sourceMappingURL=FreDialog.js.map
