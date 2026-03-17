"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as UI from "../../ui/legacy/legacy.js";
const UIStrings = {
  /**
   * @description Label for the autofill pane
   */
  autofill: "Autofill",
  /**
   * @description Command for showing the 'Autofill' pane
   */
  showAutofill: "Show Autofill"
};
const str_ = i18n.i18n.registerUIStrings("panels/autofill/autofill-meta.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
let loadedAutofillModule;
async function loadAutofillModule() {
  if (!loadedAutofillModule) {
    loadedAutofillModule = await import("./autofill.js");
  }
  return loadedAutofillModule;
}
UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: "autofill-view",
  title: i18nLazyString(UIStrings.autofill),
  commandPrompt: i18nLazyString(UIStrings.showAutofill),
  order: 100,
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  async loadView() {
    const Autofill = await loadAutofillModule();
    return new Autofill.AutofillView.AutofillView();
  }
});
//# sourceMappingURL=autofill-meta.prebundle.js.map
