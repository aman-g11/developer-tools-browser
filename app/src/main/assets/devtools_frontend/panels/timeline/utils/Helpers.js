"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as SDK from "../../../core/sdk/sdk.js";
import * as CrUXManager from "../../../models/crux-manager/crux-manager.js";
const MAX_ORIGIN_LENGTH = 60;
export function getThrottlingRecommendations() {
  let cpuOption = SDK.CPUThrottlingManager.CalibratedMidTierMobileThrottlingOption;
  if (cpuOption.rate() === 0) {
    cpuOption = SDK.CPUThrottlingManager.MidTierThrottlingOption;
  }
  let networkConditions = null;
  const response = CrUXManager.CrUXManager.instance().getSelectedFieldMetricData("round_trip_time");
  if (response?.percentiles) {
    const rtt = Number(response.percentiles.p75);
    networkConditions = SDK.NetworkManager.getRecommendedNetworkPreset(rtt);
  }
  return {
    cpuOption,
    networkConditions
  };
}
function createTrimmedUrlSearch(url) {
  const maxSearchValueLength = 8;
  let search = "";
  for (const [key, value] of url.searchParams) {
    if (search) {
      search += "&";
    }
    if (value) {
      search += `${key}=${Platform.StringUtilities.trimEndWithMaxLength(value, maxSearchValueLength)}`;
    } else {
      search += key;
    }
  }
  if (search) {
    search = "?" + search;
  }
  return search;
}
export function createUrlLabels(urls) {
  const labels = [];
  const isAllHttps = urls.every((url) => url.protocol === "https:");
  for (const [index, url] of urls.entries()) {
    const previousUrl = urls[index - 1];
    const sameHostAndProtocol = previousUrl && url.host === previousUrl.host && url.protocol === previousUrl.protocol;
    let elideHost = sameHostAndProtocol;
    let elideProtocol = isAllHttps;
    if (index === 0 && isAllHttps) {
      elideHost = true;
      elideProtocol = true;
    }
    const search = createTrimmedUrlSearch(url);
    if (!elideProtocol) {
      labels.push(`${url.protocol}//${url.host}${url.pathname}${search}`);
    } else if (!elideHost) {
      labels.push(`${url.host}${url.pathname}${search}`);
    } else {
      labels.push(`${url.pathname}${search}`);
    }
  }
  return labels.map((label) => label.length > 1 && label.endsWith("/") ? label.substring(0, label.length - 1) : label);
}
export function shortenUrl(url, maxChars = 20) {
  const parts = url.pathname === "/" ? [url.host] : url.pathname.split("/");
  let shortenedUrl = parts.at(-1) ?? "";
  if (shortenedUrl.length > maxChars) {
    return Platform.StringUtilities.trimMiddle(shortenedUrl, maxChars);
  }
  let i = parts.length - 1;
  while (--i >= 0) {
    if (shortenedUrl.length + parts[i].length <= maxChars) {
      shortenedUrl = `${parts[i]}/${shortenedUrl}`;
    }
  }
  return shortenedUrl;
}
export function formatOriginWithEntity(url, entity, parenthesizeEntity) {
  const origin = url.origin.replace("https://", "");
  if (!entity) {
    return origin;
  }
  let originWithEntity;
  if (entity.isUnrecognized) {
    originWithEntity = `${origin}`;
  } else {
    originWithEntity = parenthesizeEntity ? `${origin} (${entity.name})` : `${origin} - ${entity.name}`;
  }
  originWithEntity = Platform.StringUtilities.trimEndWithMaxLength(originWithEntity, MAX_ORIGIN_LENGTH);
  return originWithEntity;
}
export class RevealableInsight {
  constructor(insight) {
    this.insight = insight;
  }
}
export class RevealableCoreVitals {
  constructor(insightSetKey) {
    this.insightSetKey = insightSetKey;
  }
}
//# sourceMappingURL=Helpers.js.map
