"use strict";
import "../../../../ui/kit/kit.js";
import "../../../../ui/components/tooltips/tooltips.js";
import "../../../../ui/components/spinners/spinners.js";
import * as Common from "../../../../core/common/common.js";
import * as Host from "../../../../core/host/host.js";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Platform from "../../../../core/platform/platform.js";
import * as Root from "../../../../core/root/root.js";
import * as AiAssistanceModels from "../../../../models/ai_assistance/ai_assistance.js";
import * as Buttons from "../../../../ui/components/buttons/buttons.js";
import * as ComponentHelpers from "../../../../ui/components/helpers/helpers.js";
import * as UIHelpers from "../../../../ui/helpers/helpers.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../../../ui/legacy/theme_support/theme_support.js";
import * as Lit from "../../../../ui/lit/lit.js";
import * as VisualLogging from "../../../../ui/visual_logging/visual_logging.js";
import * as PanelCommon from "../../../common/common.js";
import entryLabelOverlayStyles from "./entryLabelOverlay.css.js";
const { html, Directives } = Lit;
const UIStrings = {
  /**
   * @description Accessible label used to explain to a user that they are viewing an entry label.
   */
  entryLabel: "Entry label",
  /**
   * @description Accessible label used to prompt the user to input text into the field.
   */
  inputTextPrompt: "Enter an annotation label",
  /**
   * @description Text displayed on a button that generates an AI label.
   */
  generateLabelButton: "Generate label",
  /**
   * @description Label used for screenreaders on the FRE dialog
   */
  freDialog: "Get AI-powered annotation suggestions dialog",
  /**
   * @description Screen-reader text for a tooltip link for navigating to "AI innovations" settings where the user can learn more about auto-annotations.
   */
  learnMoreAriaLabel: "Learn more about auto annotations in settings",
  /**
   * @description Screen-reader text for a tooltip icon.
   */
  moreInfoAriaLabel: "More information about this feature"
};
const UIStringsNotTranslate = {
  /**
   * @description Tooltip link for the navigating to "AI innovations" page in settings.
   */
  learnMore: "Learn more in settings",
  /**
   * @description Security disclaimer text displayed when the information icon on a button that generates an AI label is hovered.
   */
  generateLabelSecurityDisclaimer: "The selected call stack is sent to Google. This data may be seen by human reviewers to improve this feature. This is an experimental AI feature and won't always get it right.",
  /**
   * @description Enterprise users with logging off - Security disclaimer text displayed when the information icon on a button that generates an AI label is hovered.
   */
  generateLabelSecurityDisclaimerLoggingOff: "The selected call stack is sent to Google. This data will not be used to improve Google's AI models. Your organization may change these settings at any time. This is an experimental AI feature and won't always get it right.",
  /**
   * @description The `Generate AI label button` tooltip disclaimer for when the feature is not available and the reason can be checked in settings.
   */
  autoAnnotationNotAvailableDisclaimer: "Auto annotations are not available.",
  /**
   * @description The `Generate AI label button` tooltip disclaimer for when the feature is not available because the user is offline.
   */
  autoAnnotationNotAvailableOfflineDisclaimer: "Auto annotations are not available because you are offline.",
  /**
   * @description Header text for the AI-powered annotations suggestions disclaimer dialog.
   */
  freDisclaimerHeader: "Get AI-powered annotation suggestions",
  /**
   * @description Text shown when the AI-powered annotation is being generated.
   */
  generatingLabel: "Generating label",
  /**
   * @description Text shown when the generation of the AI-powered annotation failed.
   */
  generationFailed: "Generation failed",
  /**
   * @description First disclaimer item text for the fre dialog - AI won't always get it right.
   */
  freDisclaimerAiWontAlwaysGetItRight: "This feature uses AI and won\u2019t always get it right",
  /**
   * @description Second disclaimer item text for the fre dialog - trace data is sent to Google.
   */
  freDisclaimerPrivacyDataSentToGoogle: "To generate annotation suggestions, your performance trace is sent to Google. This data may be seen by human reviewers to improve this feature.",
  /**
   * @description Second disclaimer item text for the fre dialog - trace data is sent to Google.
   */
  freDisclaimerPrivacyDataSentToGoogleNoLogging: "To generate annotation suggestions, your performance trace is sent to Google. This data will not be used to improve Google\u2019s AI models. Your organization may change these settings at any time.",
  /**
   * @description Text for the 'learn more' button displayed in fre.
   */
  learnMoreButton: "Learn more"
};
var AIButtonState = /* @__PURE__ */ ((AIButtonState2) => {
  AIButtonState2["ENABLED"] = "enabled";
  AIButtonState2["DISABLED"] = "disabled";
  AIButtonState2["HIDDEN"] = "hidden";
  AIButtonState2["GENERATION_FAILED"] = "generation_failed";
  AIButtonState2["GENERATING_LABEL"] = "generating_label";
  return AIButtonState2;
})(AIButtonState || {});
const str_ = i18n.i18n.registerUIStrings("panels/timeline/overlays/components/EntryLabelOverlay.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const lockedString = i18n.i18n.lockedString;
function isAiAssistanceServerSideLoggingEnabled() {
  if (Root.Runtime.hostConfig.devToolsGeminiRebranding?.enabled) {
    return false;
  }
  return !Root.Runtime.hostConfig.aidaAvailability?.disallowLogging;
}
export class EntryLabelRemoveEvent extends Event {
  static eventName = "entrylabelremoveevent";
  constructor() {
    super(EntryLabelRemoveEvent.eventName);
  }
}
export class EntryLabelChangeEvent extends Event {
  constructor(newLabel) {
    super(EntryLabelChangeEvent.eventName);
    this.newLabel = newLabel;
  }
  static eventName = "entrylabelchangeevent";
}
export class LabelAnnotationsConsentDialogVisibilityChange extends Event {
  constructor(isVisible) {
    super(LabelAnnotationsConsentDialogVisibilityChange.eventName, { bubbles: true, composed: true });
    this.isVisible = isVisible;
  }
  static eventName = "labelannotationsconsentdialogvisiblitychange";
}
export class EntryLabelOverlay extends HTMLElement {
  // The label is angled on the left from the centre of the entry it belongs to.
  // `LABEL_AND_CONNECTOR_SHIFT_LENGTH` specifies how many pixels to the left it is shifted.
  static LABEL_AND_CONNECTOR_SHIFT_LENGTH = 8;
  // Length of the line that connects the label to the entry.
  static LABEL_CONNECTOR_HEIGHT = 7;
  // Set the max label length to avoid labels that could signicantly increase the file size.
  static MAX_LABEL_LENGTH = 100;
  #shadow = this.attachShadow({ mode: "open" });
  // Once a label is bound for deletion, we remove it from the DOM via events
  // that are dispatched. But in the meantime the blur event of the input box
  // can fire, and that triggers a second removal. So we set this flag after
  // the first removal to avoid a duplicate event firing which is a no-op but
  // causes errors when we try to delete an already deleted annotation.
  #isPendingRemoval = false;
  // The label is set to editable when it is double clicked. If the user clicks away from the label box
  // element, the label is set to not editable until it double clicked.s
  #isLabelEditable = true;
  #entryLabelVisibleHeight = null;
  #labelPartsWrapper = null;
  #entryHighlightWrapper = null;
  #inputField = null;
  #connectorLineContainer = null;
  #label;
  #shouldDrawBelowEntry;
  #richTooltip = Directives.createRef();
  #noLogging;
  /**
   * Required to generate a label with AI.
   */
  #callTree = null;
  // Creates or gets the setting if it exists.
  #aiAnnotationsEnabledSetting = Common.Settings.Settings.instance().createSetting("ai-annotations-enabled", false);
  #agent = new AiAssistanceModels.PerformanceAnnotationsAgent.PerformanceAnnotationsAgent({
    aidaClient: new Host.AidaClient.AidaClient(),
    serverSideLoggingEnabled: isAiAssistanceServerSideLoggingEnabled()
  });
  /**
   * We track this because when the user is in this flow we don't want the
   * empty annotation label to be removed on blur, as we take them to the flow &
   * want to keep the label there for when they come back from the flow having
   * consented, hopefully!
   */
  #inAIConsentDialogFlow = false;
  #currAIButtonState = "hidden" /* HIDDEN */;
  /**
   * The entry label overlay consists of 3 parts - the label part with the label string inside,
   * the line connecting the label to the entry, and a black box around an entry to highlight the entry with a label.
   * ________
   * |_label__|                <-- label part with the label string inside
   *     \
   *      \                   <-- line connecting the label to the entry with a circle at the end
   *       \
   * _______◯_________
   * |_____entry______|         <--- box around an entry
   *
   * `drawLabel` method below draws the first part.
   * `drawConnector` method below draws the second part - the connector line with a circle and the svg container for them.
   * `drawEntryHighlightWrapper` draws the third part.
   * We only rerender the first part if the label changes and the third part if the size of the entry changes.
   * The connector and circle shapes never change so we only draw the second part when the component is created.
   *
   * Otherwise, the entry label overlay object only gets repositioned.
   */
  constructor(label, shouldDrawBelowEntry = false) {
    super();
    this.#render();
    this.#shouldDrawBelowEntry = shouldDrawBelowEntry;
    this.#labelPartsWrapper = this.#shadow.querySelector(".label-parts-wrapper");
    this.#inputField = this.#labelPartsWrapper?.querySelector(".input-field") ?? null;
    this.#connectorLineContainer = this.#labelPartsWrapper?.querySelector(".connectorContainer") ?? null;
    this.#entryHighlightWrapper = this.#labelPartsWrapper?.querySelector(".entry-highlight-wrapper") ?? null;
    this.#label = label;
    this.#noLogging = Root.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue === Root.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;
    this.#drawLabel(label);
    if (label !== "") {
      this.setLabelEditabilityAndRemoveEmptyLabel(false);
    }
    const ariaLabel = label === "" ? i18nString(UIStrings.inputTextPrompt) : label;
    this.#inputField?.setAttribute("aria-label", ariaLabel);
    this.#drawConnector();
  }
  /**
   * So we can provide a mocked agent in tests. Do not call this method outside of a test!
   */
  overrideAIAgentForTest(agent) {
    this.#agent = agent;
  }
  entryHighlightWrapper() {
    return this.#entryHighlightWrapper;
  }
  #handleLabelInputKeyUp() {
    const labelBoxTextContent = this.#inputField?.textContent?.trim() ?? "";
    if (labelBoxTextContent !== this.#label) {
      this.#label = labelBoxTextContent;
      this.dispatchEvent(new EntryLabelChangeEvent(this.#label));
      this.#inputField?.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    }
    this.#setAIButtonRenderState();
    this.#render();
    this.#inputField?.setAttribute("aria-label", labelBoxTextContent);
  }
  #handleLabelInputKeyDown(event) {
    if (!this.#inputField) {
      return false;
    }
    const allowedKeysAfterReachingLenLimit = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight"
    ];
    if ((event.key === Platform.KeyboardUtilities.ENTER_KEY || event.key === Platform.KeyboardUtilities.ESCAPE_KEY) && this.#isLabelEditable) {
      this.#inputField.blur();
      this.setLabelEditabilityAndRemoveEmptyLabel(false);
      return false;
    }
    if (this.#inputField.textContent !== null && this.#inputField.textContent.length <= EntryLabelOverlay.MAX_LABEL_LENGTH) {
      return true;
    }
    if (allowedKeysAfterReachingLenLimit.includes(event.key)) {
      return true;
    }
    if (event.key.length === 1 && event.ctrlKey) {
      return true;
    }
    event.preventDefault();
    return false;
  }
  #handleLabelInputPaste(event) {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData || !this.#inputField) {
      return;
    }
    const pastedText = clipboardData.getData("text").replace(/(\r\n|\n|\r)/gm, "");
    const newText = this.#inputField.textContent + pastedText;
    const trimmedText = newText.slice(0, EntryLabelOverlay.MAX_LABEL_LENGTH + 1);
    this.#inputField.textContent = trimmedText;
    this.#placeCursorAtInputEnd();
  }
  set entryLabelVisibleHeight(entryLabelVisibleHeight) {
    this.#entryLabelVisibleHeight = entryLabelVisibleHeight;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    if (this.#isLabelEditable) {
      this.#focusInputBox();
    }
    this.#drawLabel();
    this.#drawConnector();
  }
  #drawConnector() {
    if (!this.#connectorLineContainer) {
      console.error("`connectorLineContainer` element is missing.");
      return;
    }
    if (this.#shouldDrawBelowEntry && this.#entryLabelVisibleHeight) {
      const translation = this.#entryLabelVisibleHeight + EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT;
      this.#connectorLineContainer.style.transform = `translateY(${translation}px) rotate(180deg)`;
    }
    const connector = this.#connectorLineContainer.querySelector("line");
    const circle = this.#connectorLineContainer.querySelector("circle");
    if (!connector || !circle) {
      console.error("Some entry label elements are missing.");
      return;
    }
    this.#connectorLineContainer.setAttribute(
      "width",
      (EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH * 2).toString()
    );
    this.#connectorLineContainer.setAttribute("height", EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT.toString());
    connector.setAttribute("x1", "0");
    connector.setAttribute("y1", "0");
    connector.setAttribute("x2", EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString());
    connector.setAttribute("y2", EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT.toString());
    const connectorColor = ThemeSupport.ThemeSupport.instance().getComputedValue("--color-text-primary");
    connector.setAttribute("stroke", connectorColor);
    connector.setAttribute("stroke-width", "2");
    circle.setAttribute("cx", EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString());
    circle.setAttribute("cy", (EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT + 1).toString());
    circle.setAttribute("r", "3");
    circle.setAttribute("fill", connectorColor);
  }
  #drawLabel(initialLabel) {
    if (!this.#inputField) {
      console.error("`labelBox`element is missing.");
      return;
    }
    if (typeof initialLabel === "string") {
      this.#inputField.innerText = initialLabel;
    }
    let xTranslation = null;
    let yTranslation = null;
    if (this.#shouldDrawBelowEntry) {
      xTranslation = EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH;
    } else {
      xTranslation = EntryLabelOverlay.LABEL_AND_CONNECTOR_SHIFT_LENGTH * -1;
    }
    if (this.#shouldDrawBelowEntry && this.#entryLabelVisibleHeight) {
      const verticalTransform = this.#entryLabelVisibleHeight + EntryLabelOverlay.LABEL_CONNECTOR_HEIGHT * 2 + this.#inputField?.offsetHeight;
      yTranslation = verticalTransform;
    }
    let transformString = "";
    if (xTranslation) {
      transformString += `translateX(${xTranslation}px) `;
    }
    if (yTranslation) {
      transformString += `translateY(${yTranslation}px)`;
    }
    if (transformString.length) {
      this.#inputField.style.transform = transformString;
    }
  }
  #focusInputBox() {
    if (!this.#inputField) {
      console.error("`labelBox` element is missing.");
      return;
    }
    this.#inputField.focus();
  }
  setLabelEditabilityAndRemoveEmptyLabel(editable) {
    if (this.#inAIConsentDialogFlow && editable === false) {
      return;
    }
    if (editable) {
      this.setAttribute("data-user-editing-label", "true");
    } else {
      this.removeAttribute("data-user-editing-label");
    }
    this.#isLabelEditable = editable;
    this.#render();
    if (editable && this.#inputField) {
      this.#placeCursorAtInputEnd();
      this.#focusInputBox();
    }
    const newLabelText = this.#inputField?.textContent?.trim() ?? "";
    if (!editable && newLabelText.length === 0 && !this.#isPendingRemoval) {
      this.#isPendingRemoval = true;
      this.dispatchEvent(new EntryLabelRemoveEvent());
    }
  }
  /**
   * Places the user's cursor at the end of the input. We do this when the user
   * focuses the input with either the keyboard or mouse, and when they paste in
   * text, so that the cursor is placed in a useful position to edit.
   */
  #placeCursorAtInputEnd() {
    if (!this.#inputField) {
      return;
    }
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.#inputField);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  set callTree(callTree) {
    this.#callTree = callTree;
    this.#setAIButtonRenderState();
  }
  // Generate the AI label suggestion if:
  // 1. the user has already already seen the fre dialog and confirmed the feature usage
  // or
  // 2. turned on the `generate AI labels` setting through the AI settings panel
  //
  // Otherwise, show the fre dialog with a 'Got it' button that turns the setting on.
  async #handleAiButtonClick() {
    if (this.#aiAnnotationsEnabledSetting.get()) {
      if (!this.#callTree || !this.#inputField) {
        return;
      }
      try {
        this.#currAIButtonState = "generating_label" /* GENERATING_LABEL */;
        UI.ARIAUtils.LiveAnnouncer.alert(UIStringsNotTranslate.generatingLabel);
        this.#render();
        this.#focusInputBox();
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
        this.#label = await this.#agent.generateAIEntryLabel(this.#callTree);
        this.dispatchEvent(new EntryLabelChangeEvent(this.#label));
        this.#inputField.innerText = this.#label;
        this.#placeCursorAtInputEnd();
        this.#setAIButtonRenderState();
        this.#render();
      } catch {
        this.#currAIButtonState = "generation_failed" /* GENERATION_FAILED */;
        void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
      }
    } else {
      this.#inAIConsentDialogFlow = true;
      this.#render();
      const hasConsented = await this.#showUserAiFirstRunDialog();
      this.#inAIConsentDialogFlow = false;
      this.setLabelEditabilityAndRemoveEmptyLabel(true);
      if (hasConsented) {
        await this.#handleAiButtonClick();
      }
    }
  }
  /**
   * @returns `true` if the user has now consented, and `false` otherwise.
   */
  async #showUserAiFirstRunDialog() {
    this.dispatchEvent(new LabelAnnotationsConsentDialogVisibilityChange(true));
    const userConsented = await PanelCommon.FreDialog.show({
      ariaLabel: i18nString(UIStrings.freDialog),
      header: { iconName: "pen-spark", text: lockedString(UIStringsNotTranslate.freDisclaimerHeader) },
      reminderItems: [
        {
          iconName: "psychiatry",
          content: lockedString(UIStringsNotTranslate.freDisclaimerAiWontAlwaysGetItRight)
        },
        {
          iconName: "google",
          content: this.#noLogging ? lockedString(UIStringsNotTranslate.freDisclaimerPrivacyDataSentToGoogleNoLogging) : lockedString(UIStringsNotTranslate.freDisclaimerPrivacyDataSentToGoogle)
        }
      ],
      onLearnMoreClick: () => {
        UIHelpers.openInNewTab("https://developer.chrome.com/docs/devtools/performance/annotations#auto-annotations");
      },
      learnMoreButtonText: UIStringsNotTranslate.learnMoreButton
    });
    this.dispatchEvent(new LabelAnnotationsConsentDialogVisibilityChange(false));
    if (userConsented) {
      this.#aiAnnotationsEnabledSetting.set(true);
    }
    return this.#aiAnnotationsEnabledSetting.get();
  }
  #setAIButtonRenderState() {
    const hasAiExperiment = Boolean(Root.Runtime.hostConfig.devToolsAiGeneratedTimelineLabels?.enabled);
    const aiDisabledByEnterprisePolicy = Root.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue === Root.Runtime.GenAiEnterprisePolicyValue.DISABLE;
    const dataToGenerateLabelAvailable = this.#callTree !== null;
    const labelIsEmpty = this.#label?.length <= 0;
    if (!hasAiExperiment || aiDisabledByEnterprisePolicy || !dataToGenerateLabelAvailable || !labelIsEmpty) {
      this.#currAIButtonState = "hidden" /* HIDDEN */;
    } else {
      const aiAvailable = Root.Runtime.hostConfig.aidaAvailability?.enabled && !Root.Runtime.hostConfig.aidaAvailability?.blockedByAge && !Root.Runtime.hostConfig.aidaAvailability?.blockedByGeo && navigator.onLine;
      if (aiAvailable) {
        this.#currAIButtonState = "enabled" /* ENABLED */;
      } else {
        this.#currAIButtonState = "disabled" /* DISABLED */;
      }
    }
  }
  #renderAITooltip(opts) {
    return html`<devtools-tooltip
    variant="rich"
    id="info-tooltip"
    ${Directives.ref(this.#richTooltip)}>
      <div class="info-tooltip-container">
        ${opts.textContent} ${opts.includeSettingsButton ? html`
          <button
            class="link tooltip-link"
            role="link"
            jslog=${VisualLogging.link("open-ai-settings").track({
      click: true
    })}
            @click=${this.#onTooltipLearnMoreClick}
            aria-label=${i18nString(UIStrings.learnMoreAriaLabel)}
          >${lockedString(UIStringsNotTranslate.learnMore)}</button>
        ` : Lit.nothing}
      </div>
    </devtools-tooltip>`;
  }
  #renderGeneratingLabelAiButton() {
    return html`
      <span
        class="ai-label-loading">
        <devtools-spinner></devtools-spinner>
        <span class="generate-label-text">${lockedString(UIStringsNotTranslate.generatingLabel)}</span>
      </span>
    `;
  }
  #renderAiButton() {
    if (this.#currAIButtonState === "generation_failed" /* GENERATION_FAILED */) {
      return html`
        <span
          class="ai-label-error">
          <devtools-icon
            class="warning extra-large"
            name="warning"
            style="color: var(--ref-palette-error50)">
          </devtools-icon>
          <span class="generate-label-text">${lockedString(UIStringsNotTranslate.generationFailed)}</span>
        </span>
      `;
    }
    return html`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-button-wrapper only-pen-wrapper"
        @mousedown=${(e) => e.preventDefault()}>
        <button
          class="ai-label-button enabled"
          @click=${this.#handleAiButtonClick}
          jslog=${VisualLogging.link("timeline.annotations.ai-generate-label").track({
      click: true
    })}>
          <devtools-icon
            class="pen-icon extra-large"
            name="pen-spark"
            style="color: var(--icon-primary);">
          </devtools-icon>
          <span class="generate-label-text">${i18nString(UIStrings.generateLabelButton)}</span>
        </button>
        <devtools-button
          aria-details="info-tooltip"
          class="pen-icon"
          .title=${i18nString(UIStrings.moreInfoAriaLabel)}
          .iconName=${"info"}
          .variant=${Buttons.Button.Variant.ICON}
          ></devtools-button>
        ${this.#renderAITooltip({
      textContent: this.#noLogging ? lockedString(UIStringsNotTranslate.generateLabelSecurityDisclaimerLoggingOff) : lockedString(UIStringsNotTranslate.generateLabelSecurityDisclaimer),
      includeSettingsButton: true
    })}
      </span>
    `;
  }
  #onTooltipLearnMoreClick() {
    this.#richTooltip?.value?.hidePopover();
    void UI.ViewManager.ViewManager.instance().showView("chrome-ai");
  }
  // The disabled button rendered when the `generate AI label` feature is not available
  // because of the geolocation, age or if they are not logged in into the google account.
  //
  // If the user is offline, display the same button with a different tooltip.
  #renderDisabledAiButton() {
    const noConnection = navigator.onLine === false;
    return html`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-disabled-button-wrapper only-pen-wrapper"
        @mousedown=${(e) => e.preventDefault()}>
        <button
          class="ai-label-button disabled"
          ?disabled=${true}
          @click=${this.#handleAiButtonClick}>
          <devtools-icon
            aria-details="info-tooltip"
            class="pen-icon extra-large"
            name="pen-spark"
            style="color: var(--sys-color-state-disabled);">
          </devtools-icon>
        </button>
        ${this.#renderAITooltip({
      textContent: noConnection ? lockedString(UIStringsNotTranslate.autoAnnotationNotAvailableOfflineDisclaimer) : lockedString(UIStringsNotTranslate.autoAnnotationNotAvailableDisclaimer),
      includeSettingsButton: !noConnection
    })}
      </span>
    `;
  }
  #handleFocusOutEvent(event) {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && this.#shadow.contains(relatedTarget)) {
      return;
    }
    this.setLabelEditabilityAndRemoveEmptyLabel(false);
  }
  #render() {
    const inputFieldClasses = Lit.Directives.classMap({
      "input-field": true,
      // When the consent modal pops up, we want the input to look like it has focus so it visually doesn't change.
      // Once the consent flow is closed, we restore focus and maintain the appearance.
      "fake-focus-state": this.#inAIConsentDialogFlow
    });
    Lit.render(
      html`
        <style>${entryLabelOverlayStyles}</style>
        <span class="label-parts-wrapper" role="region" aria-label=${i18nString(UIStrings.entryLabel)}
          @focusout=${this.#handleFocusOutEvent}
        >
          <span
            class="label-button-input-wrapper">
            <span
              class=${inputFieldClasses}
              role="textbox"
              @focus=${() => {
        this.setLabelEditabilityAndRemoveEmptyLabel(true);
      }}
              @dblclick=${() => {
        this.setLabelEditabilityAndRemoveEmptyLabel(true);
      }}
              @keydown=${this.#handleLabelInputKeyDown}
              @paste=${this.#handleLabelInputPaste}
              @input=${this.#handleLabelInputKeyUp}
              contenteditable=${this.#isLabelEditable ? "plaintext-only" : false}
              jslog=${VisualLogging.textField("timeline.annotations.entry-label-input").track({ keydown: true, click: true, change: true })}
              tabindex="0"
            ></span>
            ${this.#isLabelEditable && this.#inputField?.innerText !== "" ? html`
              <button
                class="delete-button"
                @click=${() => this.dispatchEvent(new EntryLabelRemoveEvent())}
                jslog=${VisualLogging.action("timeline.annotations.delete-entry-label").track({ click: true })}>
              <devtools-icon name="cross" class="small" style="color: var(--color-background);"
              ></devtools-icon>
              </button>
            ` : Lit.nothing}
            ${(() => {
        switch (this.#currAIButtonState) {
          case "hidden" /* HIDDEN */:
            return Lit.nothing;
          case "enabled" /* ENABLED */:
            return this.#renderAiButton();
          case "generating_label" /* GENERATING_LABEL */:
            return this.#renderGeneratingLabelAiButton();
          case "generation_failed" /* GENERATION_FAILED */:
            return this.#renderAiButton();
          case "disabled" /* DISABLED */:
            return this.#renderDisabledAiButton();
        }
      })()}
          </span>
          <svg class="connectorContainer">
            <line/>
            <circle/>
          </svg>
          <div class="entry-highlight-wrapper"></div>
        </span>`,
      this.#shadow,
      { host: this }
    );
  }
}
customElements.define("devtools-entry-label-overlay", EntryLabelOverlay);
//# sourceMappingURL=EntryLabelOverlay.js.map
