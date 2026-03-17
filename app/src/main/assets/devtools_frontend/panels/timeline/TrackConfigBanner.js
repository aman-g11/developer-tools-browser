"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
const UIStrings = {
  /**
   * @description Message shown in a banner when some tracks are hidden in the timeline.
   */
  someTracksAreHidden: "Some tracks are hidden in this trace. You can configure tracks by right clicking the track name.",
  /**
   * @description Text for a button to show all hidden tracks.
   */
  showAll: "Show all",
  /**
   * @description Text for a button that opens a view to configure which tracks are visible.
   */
  configureTracks: "Configure tracks"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/TrackConfigBanner.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const hiddenTracksInfoBarByParsedTrace = /* @__PURE__ */ new WeakMap();
export function createHiddenTracksOverlay(parsedTrace, callbacks) {
  const status = hiddenTracksInfoBarByParsedTrace.get(parsedTrace);
  if (status === "DISMISSED") {
    return null;
  }
  if (status instanceof UI.Infobar.Infobar) {
    return {
      type: "BOTTOM_INFO_BAR",
      infobar: status
    };
  }
  const infobarForTrace = new UI.Infobar.Infobar(
    UI.Infobar.Type.WARNING,
    i18nString(UIStrings.someTracksAreHidden),
    [
      {
        text: i18nString(UIStrings.showAll),
        delegate: callbacks.onShowAllTracks,
        dismiss: true
      },
      {
        text: i18nString(UIStrings.configureTracks),
        delegate: callbacks.onShowTrackConfigurationMode,
        dismiss: true,
        buttonVariant: Buttons.Button.Variant.PRIMARY
      }
    ]
  );
  infobarForTrace.setCloseCallback(() => {
    callbacks.onClose();
    hiddenTracksInfoBarByParsedTrace.set(parsedTrace, "DISMISSED");
  });
  hiddenTracksInfoBarByParsedTrace.set(parsedTrace, infobarForTrace);
  return { type: "BOTTOM_INFO_BAR", infobar: infobarForTrace };
}
//# sourceMappingURL=TrackConfigBanner.js.map
