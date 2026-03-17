"use strict";
import "../../../../ui/kit/kit.js";
import "../../../../ui/components/report_view/report_view.js";
import "./MismatchedPreloadingGrid.js";
import * as Common from "../../../../core/common/common.js";
import * as i18n from "../../../../core/i18n/i18n.js";
import { assertNotNullOrUndefined } from "../../../../core/platform/platform.js";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Protocol from "../../../../generated/protocol.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import { html, nothing, render } from "../../../../ui/lit/lit.js";
import * as VisualLogging from "../../../../ui/visual_logging/visual_logging.js";
import * as PreloadingHelper from "../helper/helper.js";
import { MismatchedPreloadingGrid } from "./MismatchedPreloadingGrid.js";
import preloadingGridStyles from "./preloadingGrid.css.js";
import { prefetchFailureReason, prerenderFailureReason } from "./PreloadingString.js";
import usedPreloadingStyles from "./usedPreloadingView.css.js";
const UIStrings = {
  /**
   * @description Header for preloading status.
   */
  speculativeLoadingStatusForThisPage: "Speculative loading status for this page",
  /**
   * @description Label for failure reason of preloading
   */
  detailsFailureReason: "Failure reason",
  /**
   * @description Message that tells this page was prerendered.
   */
  downgradedPrefetchUsed: "The initiating page attempted to prerender this page's URL. The prerender failed, but the resulting response body was still used as a prefetch.",
  /**
   * @description Message that tells this page was prefetched.
   */
  prefetchUsed: "This page was successfully prefetched.",
  /**
   * @description Message that tells this page was prerendered.
   */
  prerenderUsed: "This page was successfully prerendered.",
  /**
   * @description Message that tells this page was prefetched.
   */
  prefetchFailed: "The initiating page attempted to prefetch this page's URL, but the prefetch failed, so a full navigation was performed instead.",
  /**
   * @description Message that tells this page was prerendered.
   */
  prerenderFailed: "The initiating page attempted to prerender this page's URL, but the prerender failed, so a full navigation was performed instead.",
  /**
   * @description Message that tells this page was not preloaded.
   */
  noPreloads: "The initiating page did not attempt to speculatively load this page's URL.",
  /**
   * @description Header for current URL.
   */
  currentURL: "Current URL",
  /**
   * @description Header for mismatched preloads.
   */
  preloadedURLs: "URLs being speculatively loaded by the initiating page",
  /**
   * @description Header for summary.
   */
  speculationsInitiatedByThisPage: "Speculations initiated by this page",
  /**
   * @description Link text to reveal rules.
   */
  viewAllRules: "View all speculation rules",
  /**
   * @description Link text to reveal preloads.
   */
  viewAllSpeculations: "View all speculations",
  /**
   * @description Link to learn more about Preloading
   */
  learnMore: "Learn more: Speculative loading on developer.chrome.com",
  /**
   * @description Header for the table of mismatched network request header.
   */
  mismatchedHeadersDetail: "Mismatched HTTP request headers",
  /**
   * @description Label for badge, indicating speculative load successfully used for this page.
   */
  badgeSuccess: "Success",
  /**
   * @description Label for badge, indicating speculative load failed for this page.
   */
  badgeFailure: "Failure",
  /**
   * @description Label for badge, indicating no speculative loads used for this page.
   */
  badgeNoSpeculativeLoads: "No speculative loads",
  /**
   * @description Label for badge, indicating how many not triggered speculations there are.
   */
  badgeNotTriggeredWithCount: "{n, plural, =1 {# not triggered} other {# not triggered}}",
  /**
   * @description Label for badge, indicating how many in progress speculations there are.
   */
  badgeInProgressWithCount: "{n, plural, =1 {# in progress} other {# in progress}}",
  /**
   * @description Label for badge, indicating how many succeeded speculations there are.
   */
  badgeSuccessWithCount: "{n, plural, =1 {# success} other {# success}}",
  /**
   * @description Label for badge, indicating how many failed speculations there are.
   */
  badgeFailureWithCount: "{n, plural, =1 {# failure} other {# failures}}",
  /**
   * @description The name of the HTTP request header.
   */
  headerName: "Header name",
  /**
   * @description The value of the HTTP request header in initial navigation.
   */
  initialNavigationValue: "Value in initial navigation",
  /**
   * @description The value of the HTTP request header in activation navigation.
   */
  activationNavigationValue: "Value in activation navigation",
  /**
   * @description The string to indicate the value of the header is missing.
   */
  missing: "(missing)"
};
const str_ = i18n.i18n.registerUIStrings("panels/application/preloading/components/UsedPreloadingView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { widget } = UI.Widget;
export var UsedKind = /* @__PURE__ */ ((UsedKind2) => {
  UsedKind2["DOWNGRADED_PRERENDER_TO_PREFETCH_AND_USED"] = "DowngradedPrerenderToPrefetchAndUsed";
  UsedKind2["PREFETCH_USED"] = "PrefetchUsed";
  UsedKind2["PRERENDER_USED"] = "PrerenderUsed";
  UsedKind2["PREFETCH_FAILED"] = "PrefetchFailed";
  UsedKind2["PRERENDER_FAILED"] = "PrerenderFailed";
  UsedKind2["NO_PRELOADS"] = "NoPreloads";
  return UsedKind2;
})(UsedKind || {});
function renderSpeculativeLoadingStatusForThisPageSections({ kind, prefetch, prerenderLike, mismatchedData, attemptWithMismatchedHeaders }) {
  let badge;
  let basicMessage;
  switch (kind) {
    case "DowngradedPrerenderToPrefetchAndUsed" /* DOWNGRADED_PRERENDER_TO_PREFETCH_AND_USED */:
      badge = { type: "success" };
      basicMessage = html`${i18nString(UIStrings.downgradedPrefetchUsed)}`;
      break;
    case "PrefetchUsed" /* PREFETCH_USED */:
      badge = { type: "success" };
      basicMessage = html`${i18nString(UIStrings.prefetchUsed)}`;
      break;
    case "PrerenderUsed" /* PRERENDER_USED */:
      badge = { type: "success" };
      basicMessage = html`${i18nString(UIStrings.prerenderUsed)}`;
      break;
    case "PrefetchFailed" /* PREFETCH_FAILED */:
      badge = { type: "failure" };
      basicMessage = html`${i18nString(UIStrings.prefetchFailed)}`;
      break;
    case "PrerenderFailed" /* PRERENDER_FAILED */:
      badge = { type: "failure" };
      basicMessage = html`${i18nString(UIStrings.prerenderFailed)}`;
      break;
    case "NoPreloads" /* NO_PRELOADS */:
      badge = { type: "neutral", message: i18nString(UIStrings.badgeNoSpeculativeLoads) };
      basicMessage = html`${i18nString(UIStrings.noPreloads)}`;
      break;
  }
  let maybeFailureReasonMessage;
  if (kind === "PrefetchFailed" /* PREFETCH_FAILED */) {
    assertNotNullOrUndefined(prefetch);
    maybeFailureReasonMessage = prefetchFailureReason(prefetch);
  } else if (kind === "PrerenderFailed" /* PRERENDER_FAILED */ || kind === "DowngradedPrerenderToPrefetchAndUsed" /* DOWNGRADED_PRERENDER_TO_PREFETCH_AND_USED */) {
    assertNotNullOrUndefined(prerenderLike);
    maybeFailureReasonMessage = prerenderFailureReason(
      prerenderLike
    );
  }
  return html`
    <devtools-report-section-header>
      ${i18nString(UIStrings.speculativeLoadingStatusForThisPage)}
    </devtools-report-section-header>
    <devtools-report-section>
      <div>
        <div class="status-badge-container">
          ${renderBadge(badge)}
        </div>
        <div>
          ${basicMessage}
        </div>
      </div>
    </devtools-report-section>

    ${maybeFailureReasonMessage !== void 0 ? html`
      <devtools-report-section-header>
        ${i18nString(UIStrings.detailsFailureReason)}
      </devtools-report-section-header>
      <devtools-report-section>
        ${maybeFailureReasonMessage}
      </devtools-report-section>` : nothing}

    ${mismatchedData ? renderMismatchedSections(mismatchedData) : nothing}
    ${attemptWithMismatchedHeaders ? renderMismatchedHTTPHeadersSections(attemptWithMismatchedHeaders) : nothing}`;
}
function renderMismatchedSections(data) {
  return html`
    <devtools-report-section-header>
      ${i18nString(UIStrings.currentURL)}
    </devtools-report-section-header>
    <devtools-report-section>
      <devtools-link
        class="link devtools-link"
        href=${data.pageURL}
        jslogcontext="current-url"
      >${data.pageURL}</devtools-link>
    </devtools-report-section>

    <devtools-report-section-header>
      ${i18nString(UIStrings.preloadedURLs)}
    </devtools-report-section-header>
    <devtools-report-section jslog=${VisualLogging.section("preloaded-urls")}>
      ${widget(MismatchedPreloadingGrid, { data })}
    </devtools-report-section>`;
}
function renderMismatchedHTTPHeadersSections(attempt) {
  return html`
    <devtools-report-section-header>
      ${i18nString(UIStrings.mismatchedHeadersDetail)}
    </devtools-report-section-header>
    <devtools-report-section>
      <style>${preloadingGridStyles}</style>
      <div class="preloading-container">
        <devtools-data-grid striped inline>
          <table>
            <tr>
              <th id="header-name" weight="30" sortable>
                ${i18nString(UIStrings.headerName)}
              </th>
              <th id="initial-value" weight="30" sortable>
                ${i18nString(UIStrings.initialNavigationValue)}
              </th>
              <th id="activation-value" weight="30" sortable>
                ${i18nString(UIStrings.activationNavigationValue)}
              </th>
            </tr>
            ${(attempt.mismatchedHeaders ?? []).map((mismatchedHeaders) => html`
              <tr>
                <td>${mismatchedHeaders.headerName}</td>
                <td>${mismatchedHeaders.initialValue ?? i18nString(UIStrings.missing)}</td>
                <td>${mismatchedHeaders.activationValue ?? i18nString(UIStrings.missing)}</td>
              </tr>
            `)}
          </table>
        </devtools-data-grid>
      </div>
    </devtools-report-section>`;
}
function renderSpeculationsInitiatedByThisPageSummarySections({ badges, revealRuleSetView, revealAttemptViewWithFilter }) {
  return html`
    <devtools-report-section-header>
      ${i18nString(UIStrings.speculationsInitiatedByThisPage)}
    </devtools-report-section-header>
    <devtools-report-section>
      <div>
        <div class="status-badge-container">
          ${badges.map(renderBadge)}
        </div>

        <div class="reveal-links">
          <button class="link devtools-link" @click=${revealRuleSetView}
              jslog=${VisualLogging.action("view-all-rules").track({ click: true })}>
            ${i18nString(UIStrings.viewAllRules)}
          </button>
         ・
          <button class="link devtools-link" @click=${revealAttemptViewWithFilter}
              jslog=${VisualLogging.action("view-all-speculations").track({ click: true })}>
           ${i18nString(UIStrings.viewAllSpeculations)}
          </button>
        </div>
      </div>
    </devtools-report-section>`;
}
function renderBadge(config) {
  const badge = (klass, iconName, message) => {
    return html`
      <span class=${klass}>
        <devtools-icon name=${iconName}></devtools-icon>
        <span>
          ${message}
        </span>
      </span>
    `;
  };
  switch (config.type) {
    case "success": {
      let message;
      if (config.count === void 0) {
        message = i18nString(UIStrings.badgeSuccess);
      } else {
        message = i18nString(UIStrings.badgeSuccessWithCount, { n: config.count });
      }
      return badge("status-badge status-badge-success", "check-circle", message);
    }
    case "failure": {
      let message;
      if (config.count === void 0) {
        message = i18nString(UIStrings.badgeFailure);
      } else {
        message = i18nString(UIStrings.badgeFailureWithCount, { n: config.count });
      }
      return badge("status-badge status-badge-failure", "cross-circle", message);
    }
    case "neutral":
      return badge("status-badge status-badge-neutral", "clear", config.message);
  }
}
const DEFAULT_VIEW = (input, _output, target) => {
  render(html`
    <style>${usedPreloadingStyles}</style>
    <devtools-report>
      ${renderSpeculativeLoadingStatusForThisPageSections(input.speculativeLoadingStatusData)}

      <devtools-report-divider></devtools-report-divider>

      ${renderSpeculationsInitiatedByThisPageSummarySections(input.speculationsInitiatedSummaryData)}

      <devtools-report-divider></devtools-report-divider>

      <devtools-report-section>
        <devtools-link
          class="link devtools-link"
          href=${"https://developer.chrome.com/blog/prerender-pages/"}
          jslogcontext="learn-more"
        >${i18nString(UIStrings.learnMore)}</devtools-link>
      </devtools-report-section>
    </devtools-report>`, target);
};
export class UsedPreloadingView extends UI.Widget.VBox {
  #view;
  constructor(view = DEFAULT_VIEW) {
    super({ useShadowDom: true });
    this.#view = view;
  }
  #data = {
    pageURL: "",
    previousAttempts: [],
    currentAttempts: []
  };
  set data(data) {
    this.#data = data;
    this.requestUpdate();
  }
  performUpdate() {
    const viewInput = {
      speculativeLoadingStatusData: this.#getSpeculativeLoadingStatusForThisPageData(),
      speculationsInitiatedSummaryData: this.#getSpeculationsInitiatedByThisPageSummaryData()
    };
    this.#view(viewInput, void 0, this.contentElement);
  }
  #isPrerenderLike(speculationAction) {
    return [
      Protocol.Preload.SpeculationAction.Prerender,
      Protocol.Preload.SpeculationAction.PrerenderUntilScript
    ].includes(speculationAction);
  }
  #isPrerenderAttempt(attempt) {
    return this.#isPrerenderLike(attempt.action);
  }
  #getSpeculativeLoadingStatusForThisPageData() {
    const pageURL = Common.ParsedURL.ParsedURL.urlWithoutHash(this.#data.pageURL);
    const forThisPage = this.#data.previousAttempts.filter(
      (attempt) => Common.ParsedURL.ParsedURL.urlWithoutHash(attempt.key.url) === pageURL
    );
    const prefetch = forThisPage.filter((attempt) => attempt.key.action === Protocol.Preload.SpeculationAction.Prefetch)[0];
    const prerenderLike = forThisPage.filter((attempt) => this.#isPrerenderLike(attempt.action))[0];
    let kind = "NoPreloads" /* NO_PRELOADS */;
    if (prerenderLike?.status === SDK.PreloadingModel.PreloadingStatus.FAILURE && prefetch?.status === SDK.PreloadingModel.PreloadingStatus.SUCCESS) {
      kind = "DowngradedPrerenderToPrefetchAndUsed" /* DOWNGRADED_PRERENDER_TO_PREFETCH_AND_USED */;
    } else if (prefetch?.status === SDK.PreloadingModel.PreloadingStatus.SUCCESS) {
      kind = "PrefetchUsed" /* PREFETCH_USED */;
    } else if (prerenderLike?.status === SDK.PreloadingModel.PreloadingStatus.SUCCESS) {
      kind = "PrerenderUsed" /* PRERENDER_USED */;
    } else if (prefetch?.status === SDK.PreloadingModel.PreloadingStatus.FAILURE) {
      kind = "PrefetchFailed" /* PREFETCH_FAILED */;
    } else if (prerenderLike?.status === SDK.PreloadingModel.PreloadingStatus.FAILURE) {
      kind = "PrerenderFailed" /* PRERENDER_FAILED */;
    } else {
      kind = "NoPreloads" /* NO_PRELOADS */;
    }
    return {
      kind,
      prefetch,
      prerenderLike,
      mismatchedData: this.#getMismatchedData(kind),
      attemptWithMismatchedHeaders: this.#getAttemptWithMismatchedHeaders()
    };
  }
  #getMismatchedData(kind) {
    if (kind !== "NoPreloads" /* NO_PRELOADS */ || this.#data.previousAttempts.length === 0) {
      return void 0;
    }
    const rows = this.#data.previousAttempts.map((attempt) => {
      return {
        url: attempt.key.url,
        action: attempt.key.action,
        status: attempt.status
      };
    });
    return {
      pageURL: this.#data.pageURL,
      rows
    };
  }
  #getAttemptWithMismatchedHeaders() {
    const attempt = this.#data.previousAttempts.find(
      (attempt2) => this.#isPrerenderAttempt(attempt2) && attempt2.mismatchedHeaders !== null
    );
    if (!attempt?.mismatchedHeaders) {
      return void 0;
    }
    if (attempt.key.url !== this.#data.pageURL) {
      throw new Error("unreachable");
    }
    return attempt;
  }
  #getSpeculationsInitiatedByThisPageSummaryData() {
    const count = this.#data.currentAttempts.reduce((acc, attempt) => {
      acc.set(attempt.status, (acc.get(attempt.status) ?? 0) + 1);
      return acc;
    }, /* @__PURE__ */ new Map());
    const notTriggeredCount = count.get(SDK.PreloadingModel.PreloadingStatus.NOT_TRIGGERED) ?? 0;
    const readyCount = count.get(SDK.PreloadingModel.PreloadingStatus.READY) ?? 0;
    const failureCount = count.get(SDK.PreloadingModel.PreloadingStatus.FAILURE) ?? 0;
    const inProgressCount = (count.get(SDK.PreloadingModel.PreloadingStatus.PENDING) ?? 0) + (count.get(SDK.PreloadingModel.PreloadingStatus.RUNNING) ?? 0);
    const badges = [];
    if (this.#data.currentAttempts.length === 0) {
      badges.push({ type: "neutral", message: i18nString(UIStrings.badgeNoSpeculativeLoads) });
    }
    if (notTriggeredCount > 0) {
      badges.push({ type: "neutral", message: i18nString(UIStrings.badgeNotTriggeredWithCount, { n: notTriggeredCount }) });
    }
    if (inProgressCount > 0) {
      badges.push({ type: "neutral", message: i18nString(UIStrings.badgeInProgressWithCount, { n: inProgressCount }) });
    }
    if (readyCount > 0) {
      badges.push({ type: "success", count: readyCount });
    }
    if (failureCount > 0) {
      badges.push({ type: "failure", count: failureCount });
    }
    const revealRuleSetView = () => {
      void Common.Revealer.reveal(new PreloadingHelper.PreloadingForward.RuleSetView(null));
    };
    const revealAttemptViewWithFilter = () => {
      void Common.Revealer.reveal(new PreloadingHelper.PreloadingForward.AttemptViewWithFilter(null));
    };
    return { badges, revealRuleSetView, revealAttemptViewWithFilter };
  }
}
//# sourceMappingURL=UsedPreloadingView.js.map
