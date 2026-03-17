"use strict";
import "../../../ui/kit/kit.js";
import "../../../ui/legacy/legacy.js";
import * as Common from "../../../core/common/common.js";
import * as i18n from "../../../core/i18n/i18n.js";
import { html, nothing, render } from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import CSSPropertyDocsViewStyles from "./cssPropertyDocsView.css.js";
const UIStrings = {
  /**
   * @description Text for button that redirects to CSS property documentation.
   */
  learnMore: "Learn more",
  /**
   * @description Text for a checkbox to turn off the CSS property documentation.
   */
  dontShow: "Don't show",
  /**
   * @description Text indicating that the CSS property has limited availability across major browsers.
   */
  limitedAvailability: "Limited availability across major browsers",
  /**
   * @description Text indicating that the CSS property has limited availability across major browsers, with a list of unsupported browsers.
   * @example {Firefox} PH1
   * @example {Safari on iOS} PH1
   * @example {Chrome, Firefox on Android, or Safari} PH1
   */
  limitedAvailabilityInBrowsers: "Limited availability across major browsers (not fully implemented in {PH1})",
  /**
   * @description Text to display a combination of browser name and platform name.
   * @example {Safari} PH1
   * @example {iOS} PH2
   */
  browserOnPlatform: "{PH1} on {PH2}",
  /**
   * @description Text indicating that the CSS property is newly available across major browsers since a certain time.
   * @example {September 2015} PH1
   */
  newlyAvailableSince: "Newly available across major browsers (`Baseline` since {PH1})",
  /**
   * @description Text indicating that the CSS property is widely available across major browsers since a certain time.
   * @example {September 2015} PH1
   * @example {an unknown date} PH1
   */
  widelyAvailableSince: "Widely available across major browsers (`Baseline` since {PH1})",
  /**
   * @description Text indicating that a specific date is not known.
   */
  unknownDate: "an unknown date"
};
const str_ = i18n.i18n.registerUIStrings("panels/elements/components/CSSPropertyDocsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const BASELINE_HIGH_AVAILABILITY_ICON = "../../../Images/baseline-high-availability.svg";
const BASELINE_LOW_AVAILABILITY_ICON = "../../../Images/baseline-low-availability.svg";
const BASELINE_LIMITED_AVAILABILITY_ICON = "../../../Images/baseline-limited-availability.svg";
const getBaselineIconPath = (baseline) => {
  let relativePath;
  switch (baseline.status) {
    case "high" /* HIGH */:
      relativePath = BASELINE_HIGH_AVAILABILITY_ICON;
      break;
    case "low" /* LOW */:
      relativePath = BASELINE_LOW_AVAILABILITY_ICON;
      break;
    default:
      relativePath = BASELINE_LIMITED_AVAILABILITY_ICON;
  }
  return new URL(relativePath, import.meta.url).toString();
};
var BrowserId = /* @__PURE__ */ ((BrowserId2) => {
  BrowserId2["C"] = "C";
  BrowserId2["CA"] = "CA";
  BrowserId2["E"] = "E";
  BrowserId2["FF"] = "FF";
  BrowserId2["FFA"] = "FFA";
  BrowserId2["S"] = "S";
  BrowserId2["SM"] = "SM";
  return BrowserId2;
})(BrowserId || {});
const allBrowserIds = /* @__PURE__ */ new Set(
  ["C" /* C */, "CA" /* CA */, "E" /* E */, "FF" /* FF */, "FFA" /* FFA */, "S" /* S */, "SM" /* SM */]
);
var BrowserPlatform = /* @__PURE__ */ ((BrowserPlatform2) => {
  BrowserPlatform2["DESKTOP"] = "desktop";
  BrowserPlatform2["ANDROID"] = "Android";
  BrowserPlatform2["MACOS"] = "macOS";
  BrowserPlatform2["IOS"] = "iOS";
  return BrowserPlatform2;
})(BrowserPlatform || {});
const browserIdToNameAndPlatform = /* @__PURE__ */ new Map([
  ["C" /* C */, { name: "Chrome", platform: "desktop" /* DESKTOP */ }],
  ["CA" /* CA */, { name: "Chrome", platform: "Android" /* ANDROID */ }],
  ["E" /* E */, { name: "Edge", platform: "desktop" /* DESKTOP */ }],
  ["FF" /* FF */, { name: "Firefox", platform: "desktop" /* DESKTOP */ }],
  ["FFA" /* FFA */, { name: "Firefox", platform: "Android" /* ANDROID */ }],
  ["S" /* S */, { name: "Safari", platform: "macOS" /* MACOS */ }],
  ["SM" /* SM */, { name: "Safari", platform: "iOS" /* IOS */ }]
]);
function formatBrowserList(browserNames) {
  const formatter = new Intl.ListFormat(i18n.DevToolsLocale.DevToolsLocale.instance().locale, {
    style: "long",
    type: "disjunction"
  });
  return formatter.format(browserNames.entries().map(
    ([name, platforms]) => platforms.length !== 1 || platforms[0] === "desktop" /* DESKTOP */ ? name : i18nString(UIStrings.browserOnPlatform, { PH1: name, PH2: platforms[0] })
  ));
}
const formatBaselineDate = (date) => {
  if (!date) {
    return i18nString(UIStrings.unknownDate);
  }
  const parsedDate = new Date(date);
  const formatter = new Intl.DateTimeFormat(i18n.DevToolsLocale.DevToolsLocale.instance().locale, {
    month: "long",
    year: "numeric"
  });
  return formatter.format(parsedDate);
};
const getBaselineMissingBrowsers = (browsers) => {
  const browserIds = browsers.map((v) => v.replace(/\d*$/, ""));
  const missingBrowserIds = allBrowserIds.difference(new Set(browserIds));
  const missingBrowsers = /* @__PURE__ */ new Map();
  for (const id of missingBrowserIds) {
    const browserInfo = browserIdToNameAndPlatform.get(id);
    if (browserInfo) {
      const { name, platform } = browserInfo;
      missingBrowsers.set(name, [...missingBrowsers.get(name) ?? [], platform]);
    }
  }
  return missingBrowsers;
};
const getBaselineText = (baseline, browsers) => {
  if (baseline.status === "false" /* LIMITED */) {
    const missingBrowsers = browsers && getBaselineMissingBrowsers(browsers);
    if (missingBrowsers) {
      return i18nString(UIStrings.limitedAvailabilityInBrowsers, { PH1: formatBrowserList(missingBrowsers) });
    }
    return i18nString(UIStrings.limitedAvailability);
  }
  if (baseline.status === "low" /* LOW */) {
    return i18nString(UIStrings.newlyAvailableSince, { PH1: formatBaselineDate(baseline.baseline_low_date) });
  }
  return i18nString(UIStrings.widelyAvailableSince, { PH1: formatBaselineDate(baseline.baseline_high_date) });
};
export var BaselineStatus = /* @__PURE__ */ ((BaselineStatus2) => {
  BaselineStatus2["LIMITED"] = "false";
  BaselineStatus2["LOW"] = "low";
  BaselineStatus2["HIGH"] = "high";
  return BaselineStatus2;
})(BaselineStatus || {});
export class CSSPropertyDocsView extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #cssProperty;
  constructor(cssProperty) {
    super();
    this.#cssProperty = cssProperty;
    this.#render();
  }
  #dontShowChanged(e) {
    const showDocumentation = !e.target.checked;
    Common.Settings.Settings.instance().moduleSetting("show-css-property-documentation-on-hover").set(showDocumentation);
  }
  #render() {
    const { description, references, baseline, browsers } = this.#cssProperty;
    const link = references?.[0].url;
    render(html`
      <style>${CSSPropertyDocsViewStyles}</style>
      <div class="docs-popup-wrapper">
        ${description ? html`
          <div id="description">
            ${description}
          </div>
        ` : nothing}
        ${baseline ? html`
          <div id="baseline" class="docs-popup-section">
            <img
              id="baseline-icon"
              src=${getBaselineIconPath(baseline)}
              role="presentation"
            >
            <span>
              ${getBaselineText(baseline, browsers)}
            </span>
          </div>
        ` : nothing}
        ${link ? html`
          <div class="docs-popup-section footer">
            <devtools-link
              id="learn-more"
              href=${link}
              class="clickable underlined unbreakable-text"
            >
              ${i18nString(UIStrings.learnMore)}
            </devtools-link>
            <devtools-checkbox
              @change=${this.#dontShowChanged}
              jslog=${VisualLogging.toggle("css-property-doc").track({ change: true })}>
              ${i18nString(UIStrings.dontShow)}
            </devtools-checkbox>
          </div>
        ` : nothing}
      </div>
    `, this.#shadow, {
      host: this
    });
  }
}
customElements.define("devtools-css-property-docs-view", CSSPropertyDocsView);
//# sourceMappingURL=CSSPropertyDocsView.js.map
