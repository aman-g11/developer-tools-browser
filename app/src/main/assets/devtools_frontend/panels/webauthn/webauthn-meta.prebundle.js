"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as UI from "../../ui/legacy/legacy.js";
const UIStrings = {
  /**
   * @description Title of WebAuthn tab in bottom drawer.
   */
  webauthn: "WebAuthn",
  /**
   * @description Command for showing the WebAuthn tab in bottom drawer.
   */
  showWebauthn: "Show WebAuthn"
};
const str_ = i18n.i18n.registerUIStrings("panels/webauthn/webauthn-meta.ts", UIStrings);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
let loadedWebauthnModule;
async function loadWebauthnModule() {
  if (!loadedWebauthnModule) {
    loadedWebauthnModule = await import("./webauthn.js");
  }
  return loadedWebauthnModule;
}
UI.ViewManager.registerViewExtension({
  location: UI.ViewManager.ViewLocationValues.DRAWER_VIEW,
  id: "webauthn-pane",
  title: i18nLazyString(UIStrings.webauthn),
  commandPrompt: i18nLazyString(UIStrings.showWebauthn),
  order: 100,
  persistence: UI.ViewManager.ViewPersistence.CLOSEABLE,
  async loadView() {
    const Webauthn = await loadWebauthnModule();
    return new Webauthn.WebauthnPane.WebauthnPaneImpl();
  }
});
//# sourceMappingURL=webauthn-meta.prebundle.js.map
