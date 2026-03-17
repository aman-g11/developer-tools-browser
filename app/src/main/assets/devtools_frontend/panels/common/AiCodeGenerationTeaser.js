"use strict";
import "../../ui/components/tooltips/tooltips.js";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Root from "../../core/root/root.js";
import * as AiCodeCompletion from "../../models/ai_code_completion/ai_code_completion.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
import { Directives, html, nothing, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import styles from "./aiCodeGenerationTeaser.css.js";
const UIStringsNotTranslate = {
  /**
   * @description Text for teaser to generate code.
   */
  toGenerateCode: "to generate code",
  /**
   * @description Text for teaser to generate code.
   */
  ctrlItoGenerateCode: "ctrl+i to generate code",
  /**
   * @description Text for teaser to generate code in Mac.
   */
  cmdItoGenerateCode: "cmd+i to generate code",
  /**
   * @description Text for teaser to learn how data is being used.
   */
  toLearnHowYourDataIsBeingUsed: "to learn how your data is being used.",
  /**
   * @description Aria label for teaser to generate code.
   */
  pressCtrlPeriodToLearnHowYourDataIsBeingUsed: "Press ctrl . (\u201Cperiod\u201D) to learn how your data is being used.",
  /**
   * @description Aria label for teaser to generate code in Mac.
   */
  pressCmdPeriodToLearnHowYourDataIsBeingUsed: "Press cmd . (\u201Cperiod\u201D) to learn how your data is being used.",
  /**
   * @description Text for teaser when generating suggestion.
   */
  generating: "Generating... (",
  /**
   * @description Text for teaser when generating suggestion.
   */
  toCancel: " to cancel)",
  /**
   * @description Text for teaser when generating suggestion.
   */
  generatingAriaLabel: "Generating. Press escape to cancel.",
  /**
   * @description Text for teaser for discoverability.
   */
  writeACommentToGenerateCode: "Write a comment to generate code",
  /**
   * @description Text for teaser for discoverability.
   */
  writeACommentToGenerateCodeInConsole: "Write a comment to generate code. Try typing: '// add red borders to all the divs'.",
  /**
   * @description Text for teaser when suggestion has been generated.
   */
  tab: "tab",
  /**
   * @description Text for teaser when suggestion has been generated.
   */
  or: "or",
  /**
   * @description Text for teaser when suggestion has been generated.
   */
  enter: "enter",
  /**
   * @description Text for teaser when suggestion has been generated.
   */
  toAccept: "to accept",
  /**
   * @description Text for teaser keys.
   */
  ctrl: "ctrl",
  /**
   * @description Text for teaser keys.
   */
  cmd: "cmd",
  /**
   * @description Text for teaser keys.
   */
  i: "i",
  /**
   * @description Text for teaser keys.
   */
  period: ".",
  /**
   * @description Text for teaser keys.
   */
  esc: "esc",
  /**
   * @description Text for tooltip shown on hovering over "Relevant Data" in the disclaimer text for AI code generation in Console panel.
   */
  tooltipDisclaimerTextForAiCodeGenerationInConsole: "To generate code suggestions, your console input and the history of your current console session are shared with Google. This data may be seen by human reviewers to improve this feature.",
  /**
   * @description Text for tooltip shown on hovering over "Relevant Data" in the disclaimer text for AI code generation in Console panel.
   */
  tooltipDisclaimerTextForAiCodeGenerationNoLoggingInConsole: "To generate code suggestions, your console input and the history of your current console session are shared with Google. This data will not be used to improve Google\u2019s AI models. Your organization may change these settings at any time.",
  /**
   * @description Text for tooltip shown on hovering over "Relevant Data" in the disclaimer text for AI code generation in Sources panel.
   */
  tooltipDisclaimerTextForAiCodeGenerationInSources: "To generate code suggestions, the contents of the currently open file are shared with Google. This data may be seen by human reviewers to improve this feature.",
  /**
   * @description Text for tooltip shown on hovering over "Relevant Data" in the disclaimer text for AI code generation in Sources panel.
   */
  tooltipDisclaimerTextForAiCodeGenerationNoLoggingInSources: "To generate code suggestions, the contents of the currently open file are shared with Google. This data will not be used to improve Google\u2019s AI models. Your organization may change these settings at any time.",
  /**
   * @description Text for tooltip button which redirects to AI settings
   */
  manageInSettings: "Manage in settings",
  /**
   * @description Title for disclaimer info button in the teaser to generate code.
   */
  learnMoreAboutHowYourDataIsBeingUsed: "Learn more about how your data is being used"
};
const lockedString = i18n.i18n.lockedString;
export const PROMOTION_ID = "ai-code-generation";
export var AiCodeGenerationTeaserDisplayState = /* @__PURE__ */ ((AiCodeGenerationTeaserDisplayState2) => {
  AiCodeGenerationTeaserDisplayState2["TRIGGER"] = "trigger";
  AiCodeGenerationTeaserDisplayState2["DISCOVERY"] = "discovery";
  AiCodeGenerationTeaserDisplayState2["LOADING"] = "loading";
  AiCodeGenerationTeaserDisplayState2["GENERATED"] = "generated";
  return AiCodeGenerationTeaserDisplayState2;
})(AiCodeGenerationTeaserDisplayState || {});
function getTooltipDisclaimerText(noLogging, panel) {
  switch (panel) {
    case AiCodeCompletion.AiCodeCompletion.ContextFlavor.CONSOLE:
      return noLogging ? lockedString(UIStringsNotTranslate.tooltipDisclaimerTextForAiCodeGenerationNoLoggingInConsole) : lockedString(UIStringsNotTranslate.tooltipDisclaimerTextForAiCodeGenerationInConsole);
    case AiCodeCompletion.AiCodeCompletion.ContextFlavor.SOURCES:
      return noLogging ? lockedString(UIStringsNotTranslate.tooltipDisclaimerTextForAiCodeGenerationNoLoggingInSources) : lockedString(UIStringsNotTranslate.tooltipDisclaimerTextForAiCodeGenerationInSources);
    case AiCodeCompletion.AiCodeCompletion.ContextFlavor.STYLES:
      return "";
  }
}
export const DEFAULT_VIEW = (input, output, target) => {
  if (!input.panel) {
    render(nothing, target);
    return;
  }
  let teaserLabel;
  switch (input.displayState) {
    case "trigger" /* TRIGGER */: {
      if (!input.disclaimerTooltipId) {
        render(nothing, target);
        return;
      }
      const toLearnHowYourDataIsBeingUsedScreenReaderOnly = Host.Platform.isMac() ? UIStringsNotTranslate.pressCmdPeriodToLearnHowYourDataIsBeingUsed : UIStringsNotTranslate.pressCtrlPeriodToLearnHowYourDataIsBeingUsed;
      const screenReaderText = (Host.Platform.isMac() ? UIStringsNotTranslate.cmdItoGenerateCode : UIStringsNotTranslate.ctrlItoGenerateCode) + " " + toLearnHowYourDataIsBeingUsedScreenReaderOnly;
      const cmdOrCtrl = Host.Platform.isMac() ? lockedString(UIStringsNotTranslate.cmd) : lockedString(UIStringsNotTranslate.ctrl);
      const toGenerateCode = html`<span class="ai-code-generation-keyboard-action">
          <span>${cmdOrCtrl}</span>
          <span>${lockedString(UIStringsNotTranslate.i)}</span>
        </span>&nbsp;${lockedString(UIStringsNotTranslate.toGenerateCode)}`;
      const toLearnHowYourDataIsBeingUsedVisible = html`<span class="ai-code-generation-keyboard-action">
          <span>${cmdOrCtrl}</span>
          <span>${lockedString(UIStringsNotTranslate.period)}</span>
        </span>&nbsp;${lockedString(UIStringsNotTranslate.toLearnHowYourDataIsBeingUsed)}`;
      const teaserText = input.showDataUsageTeaser ? html`${toGenerateCode}.&nbsp;${toLearnHowYourDataIsBeingUsedVisible}` : toGenerateCode;
      const tooltipDisclaimerText = getTooltipDisclaimerText(input.noLogging, input.panel);
      teaserLabel = html`<div class="ai-code-generation-teaser-trigger">
        <span aria-hidden="true">${teaserText}</span>
        <span class="ai-code-generation-teaser-screen-reader-only" aria-atomic="true" aria-live="assertive">
          ${lockedString(screenReaderText)}
        </span>
        &nbsp;<devtools-button
          .data=${{
        title: lockedString(UIStringsNotTranslate.learnMoreAboutHowYourDataIsBeingUsed),
        size: Buttons.Button.Size.MICRO,
        iconName: "info",
        variant: Buttons.Button.Variant.ICON,
        jslogContext: "ai-code-generation-teaser.info-button"
      }}
            aria-details=${input.disclaimerTooltipId}
            aria-describedby=${input.disclaimerTooltipId}
          ></devtools-button>
          <devtools-tooltip
              id=${input.disclaimerTooltipId}
              variant="rich"
              jslogContext="ai-code-generation-disclaimer"
              ${Directives.ref((el) => {
        if (el instanceof HTMLElement) {
          output.hideTooltip = () => {
            el.hidePopover();
          };
          output.showTooltip = () => {
            el.showPopover();
            UI.ARIAUtils.LiveAnnouncer.status(tooltipDisclaimerText);
          };
        }
      })}>
            <div class="disclaimer-tooltip-container"><div class="tooltip-text">
                ${tooltipDisclaimerText}
                </div>
                <span
                    tabIndex="0"
                    class="link"
                    role="link"
                    jslog=${VisualLogging.link("open-ai-settings").track({
        click: true
      })}
                    @click=${input.onManageInSettingsTooltipClick}
                >${lockedString(UIStringsNotTranslate.manageInSettings)}</span></div></devtools-tooltip>
                  </div>`;
      break;
    }
    case "discovery" /* DISCOVERY */: {
      if (!input.showDiscoveryTeaser) {
        teaserLabel = nothing;
        break;
      }
      const newBadge = UI.UIUtils.maybeCreateNewBadge(PROMOTION_ID);
      const teaserText = input.panel === AiCodeCompletion.AiCodeCompletion.ContextFlavor.CONSOLE ? lockedString(UIStringsNotTranslate.writeACommentToGenerateCodeInConsole) : lockedString(UIStringsNotTranslate.writeACommentToGenerateCode);
      teaserLabel = newBadge ? html`${teaserText}&nbsp;${newBadge}` : nothing;
      break;
    }
    case "loading" /* LOADING */: {
      const teaserAriaLabel = lockedString(UIStringsNotTranslate.generatingAriaLabel);
      teaserLabel = html`
        <div class="ai-code-generation-teaser-screen-reader-only">${teaserAriaLabel}</div>
        <span class="ai-code-generation-spinner" aria-hidden="true">
          &nbsp;${lockedString(UIStringsNotTranslate.generating)}
          <span class="ai-code-generation-keyboard-action"><span>${lockedString(UIStringsNotTranslate.esc)}</span></span>
          ${lockedString(UIStringsNotTranslate.toCancel)}&nbsp;
        </span>
        <span class="ai-code-generation-timer" aria-hidden="true" ${Directives.ref((el) => {
        if (el) {
          output.setTimerText = (text) => {
            el.textContent = text;
          };
        }
      })}></span>`;
      break;
    }
    case "generated" /* GENERATED */: {
      teaserLabel = html`<div class="ai-code-generation-teaser-generated">
          <span>${lockedString(UIStringsNotTranslate.tab)}</span>
          &nbsp;${lockedString(UIStringsNotTranslate.or)}&nbsp;
          <span>${lockedString(UIStringsNotTranslate.enter)}</span>
          &nbsp;${lockedString(UIStringsNotTranslate.toAccept)}
        </div>`;
      break;
    }
  }
  render(
    html`
          <style>${styles}</style>
          <style>@scope to (devtools-widget > *) { ${UI.inspectorCommonStyles} }</style>
          <div class="ai-code-generation-teaser">
            &nbsp;${teaserLabel}
          </div>
        `,
    target
  );
};
export class AiCodeGenerationTeaser extends UI.Widget.Widget {
  #view;
  #viewOutput = {};
  #displayState = "discovery" /* DISCOVERY */;
  #disclaimerTooltipId;
  #noLogging;
  // Whether the enterprise setting is `ALLOW_WITHOUT_LOGGING` or not.
  #panel;
  #timerIntervalId;
  #loadStartTime;
  #aiCodeGenerationUsedSetting = Common.Settings.Settings.instance().createSetting("ai-code-generation-used", false);
  static #showDataUsageTeaser = true;
  static #discoveryTeaserShownInSession = false;
  constructor(view) {
    super();
    this.markAsExternallyManaged();
    this.#noLogging = Root.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue === Root.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;
    this.#view = view ?? DEFAULT_VIEW;
    this.requestUpdate();
  }
  performUpdate() {
    this.#view(
      {
        displayState: this.#displayState,
        onManageInSettingsTooltipClick: this.#onManageInSettingsTooltipClick.bind(this),
        disclaimerTooltipId: this.#disclaimerTooltipId,
        noLogging: this.#noLogging,
        showDataUsageTeaser: AiCodeGenerationTeaser.#showDataUsageTeaser,
        showDiscoveryTeaser: !this.#aiCodeGenerationUsedSetting.get() && !AiCodeGenerationTeaser.#discoveryTeaserShownInSession,
        panel: this.#panel
      },
      this.#viewOutput,
      this.contentElement
    );
  }
  willHide() {
    super.willHide();
    this.#stopLoadingAnimation();
  }
  get displayState() {
    return this.#displayState;
  }
  set displayState(displayState) {
    if (displayState === this.#displayState) {
      return;
    }
    if (this.#displayState === "trigger" /* TRIGGER */) {
      AiCodeGenerationTeaser.#showDataUsageTeaser = false;
    }
    if (this.#displayState === "discovery" /* DISCOVERY */) {
      AiCodeGenerationTeaser.#discoveryTeaserShownInSession = true;
    }
    this.#displayState = displayState;
    this.requestUpdate();
    if (this.#displayState === "loading" /* LOADING */) {
      void this.updateComplete.then(() => {
        void this.#startLoadingAnimation();
      });
    } else if (this.#loadStartTime) {
      this.#stopLoadingAnimation();
    }
  }
  #startLoadingAnimation() {
    this.#stopLoadingAnimation();
    this.#loadStartTime = performance.now();
    this.#viewOutput.setTimerText?.("(0s)");
    this.#timerIntervalId = window.setInterval(() => {
      if (this.#loadStartTime) {
        const elapsedSeconds = Math.floor((performance.now() - this.#loadStartTime) / 1e3);
        this.#viewOutput.setTimerText?.(`(${elapsedSeconds}s)`);
      }
    }, 1e3);
  }
  #stopLoadingAnimation() {
    if (this.#timerIntervalId) {
      clearInterval(this.#timerIntervalId);
      this.#timerIntervalId = void 0;
    }
    this.#loadStartTime = void 0;
  }
  set disclaimerTooltipId(disclaimerTooltipId) {
    this.#disclaimerTooltipId = disclaimerTooltipId;
    this.requestUpdate();
  }
  set panel(panel) {
    this.#panel = panel;
    this.requestUpdate();
  }
  #onManageInSettingsTooltipClick(event) {
    event.stopPropagation();
    this.#viewOutput.hideTooltip?.();
    void UI.ViewManager.ViewManager.instance().showView("chrome-ai");
    event.consume(true);
  }
  showTooltip() {
    this.#viewOutput.showTooltip?.();
  }
  static setDiscoveryTeaserShownInSessionForTest(value) {
    AiCodeGenerationTeaser.#discoveryTeaserShownInSession = value;
  }
}
//# sourceMappingURL=AiCodeGenerationTeaser.js.map
