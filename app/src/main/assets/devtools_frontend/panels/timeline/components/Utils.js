"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Protocol from "../../../generated/protocol.js";
import * as ThemeSupport from "../../../ui/legacy/theme_support/theme_support.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
const UIStrings = {
  /**
   * @description ms is the short form of milli-seconds and the placeholder is a decimal number.
   * The shortest form or abbreviation of milliseconds should be used, as there is
   * limited room in this UI.
   * @example {2.14} PH1
   */
  fms: "{PH1}[ms]()",
  /**
   * @description s is short for seconds and the placeholder is a decimal number
   * The shortest form or abbreviation of seconds should be used, as there is
   * limited room in this UI.
   * @example {2.14} PH1
   */
  fs: "{PH1}[s]()"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/Utils.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var NetworkCategory = /* @__PURE__ */ ((NetworkCategory2) => {
  NetworkCategory2["DOC"] = "Doc";
  NetworkCategory2["CSS"] = "CSS";
  NetworkCategory2["JS"] = "JS";
  NetworkCategory2["FONT"] = "Font";
  NetworkCategory2["IMG"] = "Img";
  NetworkCategory2["MEDIA"] = "Media";
  NetworkCategory2["WASM"] = "Wasm";
  NetworkCategory2["OTHER"] = "Other";
  return NetworkCategory2;
})(NetworkCategory || {});
export function networkResourceCategory(request) {
  const { mimeType } = request.args.data;
  switch (request.args.data.resourceType) {
    case Protocol.Network.ResourceType.Document:
      return "Doc" /* DOC */;
    case Protocol.Network.ResourceType.Stylesheet:
      return "CSS" /* CSS */;
    case Protocol.Network.ResourceType.Image:
      return "Img" /* IMG */;
    case Protocol.Network.ResourceType.Media:
      return "Media" /* MEDIA */;
    case Protocol.Network.ResourceType.Font:
      return "Font" /* FONT */;
    case Protocol.Network.ResourceType.Script:
    case Protocol.Network.ResourceType.WebSocket:
      return "JS" /* JS */;
    default:
      return mimeType === void 0 ? "Other" /* OTHER */ : mimeType.endsWith("/css") ? "CSS" /* CSS */ : mimeType.endsWith("javascript") ? "JS" /* JS */ : mimeType.startsWith("image/") ? "Img" /* IMG */ : mimeType.startsWith("audio/") || mimeType.startsWith("video/") ? "Media" /* MEDIA */ : mimeType.startsWith("font/") || mimeType.includes("font-") ? "Font" /* FONT */ : mimeType === "application/wasm" ? "Wasm" /* WASM */ : mimeType.startsWith("text/") ? "Doc" /* DOC */ : (
        // Ultimate fallback:
        "Other" /* OTHER */
      );
  }
}
export function colorForNetworkCategory(category) {
  let cssVarName = "--app-color-system";
  switch (category) {
    case "Doc" /* DOC */:
      cssVarName = "--app-color-doc";
      break;
    case "JS" /* JS */:
      cssVarName = "--app-color-scripting";
      break;
    case "CSS" /* CSS */:
      cssVarName = "--app-color-css";
      break;
    case "Img" /* IMG */:
      cssVarName = "--app-color-image";
      break;
    case "Media" /* MEDIA */:
      cssVarName = "--app-color-media";
      break;
    case "Font" /* FONT */:
      cssVarName = "--app-color-font";
      break;
    case "Wasm" /* WASM */:
      cssVarName = "--app-color-wasm";
      break;
    case "Other" /* OTHER */:
    default:
      cssVarName = "--app-color-system";
      break;
  }
  return ThemeSupport.ThemeSupport.instance().getComputedValue(cssVarName);
}
export function colorForNetworkRequest(request) {
  const category = networkResourceCategory(request);
  return colorForNetworkCategory(category);
}
export const LCP_THRESHOLDS = [2500, 4e3];
export const CLS_THRESHOLDS = [0.1, 0.25];
export const INP_THRESHOLDS = [200, 500];
export function rateMetric(value, thresholds) {
  if (value <= thresholds[0]) {
    return "good";
  }
  if (value <= thresholds[1]) {
    return "needs-improvement";
  }
  return "poor";
}
export function renderMetricValue(jslogContext, value, thresholds, format, options) {
  const metricValueEl = document.createElement("span");
  metricValueEl.classList.add("metric-value");
  if (value === void 0) {
    metricValueEl.classList.add("waiting");
    metricValueEl.textContent = "-";
    return metricValueEl;
  }
  metricValueEl.textContent = format(value);
  const rating = rateMetric(value, thresholds);
  metricValueEl.classList.add(rating);
  metricValueEl.setAttribute("jslog", `${VisualLogging.section(jslogContext)}`);
  if (options?.dim) {
    metricValueEl.classList.add("dim");
  }
  return metricValueEl;
}
export var NumberWithUnit;
((NumberWithUnit2) => {
  function parse(text) {
    const startBracket = text.indexOf("[");
    const endBracket = startBracket !== -1 && text.indexOf("]", startBracket);
    const startParen = endBracket && text.indexOf("(", endBracket);
    const endParen = startParen && text.indexOf(")", startParen);
    if (!endParen || endParen === -1) {
      return null;
    }
    const firstPart = text.substring(0, startBracket);
    const unitPart = text.substring(startBracket + 1, endBracket);
    const lastPart = text.substring(endParen + 1);
    return { firstPart, unitPart, lastPart };
  }
  NumberWithUnit2.parse = parse;
  function formatMicroSecondsAsSeconds(time) {
    const element = document.createElement("span");
    element.classList.add("number-with-unit");
    const milliseconds = Platform.Timing.microSecondsToMilliSeconds(time);
    const seconds = Platform.Timing.milliSecondsToSeconds(milliseconds);
    const text = i18nString(UIStrings.fs, { PH1: seconds.toFixed(2) });
    const result = parse(text);
    if (!result) {
      element.textContent = i18n.TimeUtilities.formatMicroSecondsAsSeconds(time);
      return { text, element };
    }
    const { firstPart, unitPart, lastPart } = result;
    if (firstPart) {
      element.append(firstPart);
    }
    element.createChild("span", "unit").textContent = unitPart;
    if (lastPart) {
      element.append(lastPart);
    }
    return { text: element.textContent, element };
  }
  NumberWithUnit2.formatMicroSecondsAsSeconds = formatMicroSecondsAsSeconds;
  function formatMicroSecondsAsMillisFixed(time, fractionDigits = 0) {
    const element = document.createElement("span");
    element.classList.add("number-with-unit");
    const milliseconds = Platform.Timing.microSecondsToMilliSeconds(time);
    const text = i18nString(UIStrings.fms, { PH1: milliseconds.toFixed(fractionDigits) });
    const result = parse(text);
    if (!result) {
      element.textContent = i18n.TimeUtilities.formatMicroSecondsAsMillisFixed(time);
      return { text, element };
    }
    const { firstPart, unitPart, lastPart } = result;
    if (firstPart) {
      element.append(firstPart);
    }
    element.createChild("span", "unit").textContent = unitPart;
    if (lastPart) {
      element.append(lastPart);
    }
    return { text: element.textContent, element };
  }
  NumberWithUnit2.formatMicroSecondsAsMillisFixed = formatMicroSecondsAsMillisFixed;
})(NumberWithUnit || (NumberWithUnit = {}));
export function determineCompareRating(metric, localValue, fieldValue) {
  let thresholds;
  let compareThreshold;
  switch (metric) {
    case "LCP":
      thresholds = LCP_THRESHOLDS;
      compareThreshold = 1e3;
      break;
    case "CLS":
      thresholds = CLS_THRESHOLDS;
      compareThreshold = 0.1;
      break;
    case "INP":
      thresholds = INP_THRESHOLDS;
      compareThreshold = 200;
      break;
    default:
      Platform.assertNever(metric, `Unknown metric: ${metric}`);
  }
  const localRating = rateMetric(localValue, thresholds);
  const fieldRating = rateMetric(fieldValue, thresholds);
  if (localRating === "good" && fieldRating === "good") {
    return "similar";
  }
  if (localValue - fieldValue > compareThreshold) {
    return "worse";
  }
  if (fieldValue - localValue > compareThreshold) {
    return "better";
  }
  return "similar";
}
export function isFieldWorseThanLocal(local, field) {
  if (local.lcp !== void 0 && field.lcp !== void 0) {
    if (determineCompareRating("LCP", local.lcp, field.lcp) === "better") {
      return true;
    }
  }
  if (local.inp !== void 0 && field.inp !== void 0) {
    if (determineCompareRating("LCP", local.inp, field.inp) === "better") {
      return true;
    }
  }
  return false;
}
//# sourceMappingURL=Utils.js.map
