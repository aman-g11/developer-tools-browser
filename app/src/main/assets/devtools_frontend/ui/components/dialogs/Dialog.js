"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as ComponentHelpers from "../../../ui/components/helpers/helpers.js";
import * as RenderCoordinator from "../../../ui/components/render_coordinator/render_coordinator.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import * as UI from "../../legacy/legacy.js";
import * as Buttons from "../buttons/buttons.js";
import dialogStyles from "./dialog.css.js";
const { html } = Lit;
const UIStrings = {
  /**
   * @description Title of close button for the shortcuts dialog.
   */
  close: "Close"
};
const str_ = i18n.i18n.registerUIStrings("ui/components/dialogs/Dialog.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const IS_DIALOG_SUPPORTED = "HTMLDialogElement" in globalThis;
export const CONNECTOR_HEIGHT = 10;
const CONNECTOR_WIDTH = 2 * CONNECTOR_HEIGHT;
const DIALOG_ANIMATION_OFFSET = 20;
export const DIALOG_SIDE_PADDING = 5;
export const DIALOG_VERTICAL_PADDING = 3;
export const DIALOG_PADDING_FROM_WINDOW = 3 * CONNECTOR_HEIGHT;
export const MODAL = "MODAL";
export class Dialog extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #forceDialogCloseInDevToolsBound = this.#forceDialogCloseInDevToolsMutation.bind(this);
  #handleScrollAttemptBound = this.#handleScrollAttempt.bind(this);
  #props = {
    origin: MODAL,
    position: "bottom" /* BOTTOM */,
    horizontalAlignment: "center" /* CENTER */,
    getConnectorCustomXPosition: null,
    dialogShownCallback: null,
    closeOnESC: true,
    closeOnScroll: true,
    closeButton: false,
    dialogTitle: "",
    jslogContext: "",
    state: "expanded" /* EXPANDED */
  };
  #dialog = null;
  #isPendingShowDialog = false;
  #isPendingCloseDialog = false;
  #hitArea = new DOMRect(0, 0, 0, 0);
  #dialogClientRect = new DOMRect(0, 0, 0, 0);
  #bestVerticalPosition = null;
  #bestHorizontalAlignment = null;
  #devtoolsMutationObserver = new MutationObserver((mutations) => {
    if (this.#props.expectedMutationsSelector) {
      const allExcluded = mutations.every((mutation) => {
        return mutation.target instanceof Element && mutation.target.matches(this.#props.expectedMutationsSelector ?? "");
      });
      if (allExcluded) {
        return;
      }
    }
    this.#forceDialogCloseInDevToolsBound();
  });
  #dialogResizeObserver = new ResizeObserver(this.#updateDialogBounds.bind(this));
  #devToolsBoundingElement = UI.UIUtils.getDevToolsBoundingElement();
  // We bind here because we have to listen to keydowns on the entire window,
  // not on the Dialog element itself. This is because if the user has the
  // dialog open, but their focus is elsewhere, and they hit ESC, we should
  // still close the dialog.
  #onKeyDownBound = this.#onKeyDown.bind(this);
  get origin() {
    return this.#props.origin;
  }
  set origin(origin) {
    this.#props.origin = origin;
    this.#onStateChange();
  }
  set expectedMutationsSelector(mutationSelector) {
    this.#props.expectedMutationsSelector = mutationSelector;
  }
  get expectedMutationsSelector() {
    return this.#props.expectedMutationsSelector;
  }
  get position() {
    return this.#props.position;
  }
  set position(position) {
    this.#props.position = position;
    this.#onStateChange();
  }
  get horizontalAlignment() {
    return this.#props.horizontalAlignment;
  }
  set horizontalAlignment(alignment) {
    this.#props.horizontalAlignment = alignment;
    this.#onStateChange();
  }
  get bestVerticalPosition() {
    return this.#bestVerticalPosition;
  }
  get bestHorizontalAlignment() {
    return this.#bestHorizontalAlignment;
  }
  get getConnectorCustomXPosition() {
    return this.#props.getConnectorCustomXPosition;
  }
  set getConnectorCustomXPosition(connectorXPosition) {
    this.#props.getConnectorCustomXPosition = connectorXPosition;
    this.#onStateChange();
  }
  get dialogShownCallback() {
    return this.#props.dialogShownCallback;
  }
  get jslogContext() {
    return this.#props.jslogContext;
  }
  set dialogShownCallback(dialogShownCallback) {
    this.#props.dialogShownCallback = dialogShownCallback;
    this.#onStateChange();
  }
  set closeOnESC(closeOnESC) {
    this.#props.closeOnESC = closeOnESC;
    this.#onStateChange();
  }
  set closeOnScroll(closeOnScroll) {
    this.#props.closeOnScroll = closeOnScroll;
    this.#onStateChange();
  }
  set closeButton(closeButton) {
    this.#props.closeButton = closeButton;
    this.#onStateChange();
  }
  set dialogTitle(dialogTitle) {
    this.#props.dialogTitle = dialogTitle;
    this.#onStateChange();
  }
  set jslogContext(jslogContext) {
    this.#props.jslogContext = jslogContext;
    this.#onStateChange();
  }
  set state(state) {
    this.#props.state = state;
    if (this.#props.state === "collapsed" /* COLLAPSED */ || this.#props.state === "disabled" /* DISABLED */) {
      this.#forceDialogCloseInDevToolsBound();
    }
    this.#onStateChange();
  }
  #updateDialogBounds() {
    this.#dialogClientRect = this.#getDialog().getBoundingClientRect();
  }
  #onStateChange() {
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
  }
  connectedCallback() {
    window.addEventListener("resize", this.#forceDialogCloseInDevToolsBound);
    this.#devtoolsMutationObserver.observe(this.#devToolsBoundingElement, { childList: true, subtree: true });
    this.#devToolsBoundingElement.addEventListener("wheel", this.#handleScrollAttemptBound);
    this.style.setProperty("--dialog-padding", "0");
    this.style.setProperty("--dialog-display", IS_DIALOG_SUPPORTED ? "block" : "none");
    this.style.setProperty("--override-dialog-content-border", `${CONNECTOR_HEIGHT}px solid transparent`);
    this.style.setProperty("--dialog-padding", `${DIALOG_VERTICAL_PADDING}px ${DIALOG_SIDE_PADDING}px`);
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this.#forceDialogCloseInDevToolsBound);
    this.#devToolsBoundingElement.removeEventListener("wheel", this.#handleScrollAttemptBound);
    this.#devtoolsMutationObserver.disconnect();
    this.#dialogResizeObserver.disconnect();
  }
  #getDialog() {
    if (!this.#dialog) {
      this.#dialog = this.#shadow.querySelector("dialog");
      if (!this.#dialog) {
        throw new Error("Dialog not found");
      }
      this.#dialogResizeObserver.observe(this.#dialog);
    }
    return this.#dialog;
  }
  getHitArea() {
    return this.#hitArea;
  }
  async setDialogVisible(show) {
    if (show) {
      await this.#showDialog();
      return;
    }
    this.#closeDialog();
  }
  async #handlePointerEvent(evt) {
    evt.stopPropagation();
    if (evt instanceof PointerEvent && evt.pointerType === "") {
      return;
    }
    const eventWasInDialogContent = this.#mouseEventWasInDialogContent(evt);
    const eventWasInHitArea = this.#mouseEventWasInHitArea(evt);
    if (eventWasInDialogContent) {
      return;
    }
    if (evt.type === "pointermove") {
      if (eventWasInHitArea) {
        return;
      }
      this.dispatchEvent(new PointerLeftDialogEvent());
      return;
    }
    this.dispatchEvent(new ClickOutsideDialogEvent());
  }
  #animationEndedEvent() {
    this.dispatchEvent(new AnimationEndedEvent());
  }
  #mouseEventWasInDialogContent(evt) {
    const dialogBounds = this.#dialogClientRect;
    let animationOffSetValue = this.bestVerticalPosition === "bottom" /* BOTTOM */ ? DIALOG_ANIMATION_OFFSET : -1 * DIALOG_ANIMATION_OFFSET;
    if (this.#props.origin === MODAL) {
      animationOffSetValue = 0;
    }
    const eventWasDialogContentX = evt.pageX >= dialogBounds.left && evt.pageX <= dialogBounds.left + dialogBounds.width;
    const eventWasDialogContentY = evt.pageY >= dialogBounds.top + animationOffSetValue && evt.pageY <= dialogBounds.top + dialogBounds.height + animationOffSetValue;
    return eventWasDialogContentX && eventWasDialogContentY;
  }
  #mouseEventWasInHitArea(evt) {
    const hitAreaBounds = this.#hitArea;
    const eventWasInHitAreaX = evt.pageX >= hitAreaBounds.left && evt.pageX <= hitAreaBounds.left + hitAreaBounds.width;
    const eventWasInHitAreaY = evt.pageY >= hitAreaBounds.top && evt.pageY <= hitAreaBounds.top + hitAreaBounds.height;
    return eventWasInHitAreaX && eventWasInHitAreaY;
  }
  #getCoordinatesFromDialogOrigin(origin) {
    if (!origin || origin === MODAL) {
      throw new Error("Dialog origin is null");
    }
    const anchor = origin instanceof Function ? origin() : origin;
    if (anchor instanceof DOMPoint) {
      return { top: anchor.y, bottom: anchor.y, left: anchor.x, right: anchor.x };
    }
    if (anchor instanceof HTMLElement) {
      return anchor.getBoundingClientRect();
    }
    return anchor;
  }
  #getBestHorizontalAlignment(anchorBounds, devtoolsBounds) {
    if (devtoolsBounds.right - anchorBounds.left > anchorBounds.right - devtoolsBounds.left) {
      return "left" /* LEFT */;
    }
    return "right" /* RIGHT */;
  }
  #getBestVerticalPosition(originBounds, dialogHeight, devtoolsBounds) {
    if (originBounds.bottom + dialogHeight > devtoolsBounds.height && originBounds.top - dialogHeight > devtoolsBounds.top) {
      return "top" /* TOP */;
    }
    return "bottom" /* BOTTOM */;
  }
  #positionDialog() {
    if (!this.#props.origin) {
      return;
    }
    this.#isPendingShowDialog = true;
    void RenderCoordinator.read(() => {
      const devtoolsBounds = this.#devToolsBoundingElement.getBoundingClientRect();
      const devToolsWidth = devtoolsBounds.width;
      const devToolsHeight = devtoolsBounds.height;
      const devToolsLeft = devtoolsBounds.left;
      const devToolsTop = devtoolsBounds.top;
      const devToolsRight = devtoolsBounds.right;
      if (this.#props.origin === MODAL) {
        void RenderCoordinator.write(() => {
          this.style.setProperty("--dialog-top", `${devToolsTop}px`);
          this.style.setProperty("--dialog-left", `${devToolsLeft}px`);
          this.style.setProperty("--dialog-margin", "auto");
          this.style.setProperty("--dialog-margin-left", "auto");
          this.style.setProperty("--dialog-margin-bottom", "auto");
          this.style.setProperty("--dialog-max-height", `${devToolsHeight - DIALOG_PADDING_FROM_WINDOW}px`);
          this.style.setProperty("--dialog-max-width", `${devToolsWidth - DIALOG_PADDING_FROM_WINDOW}px`);
          this.style.setProperty("--dialog-right", `${document.body.clientWidth - devToolsRight}px`);
        });
        return;
      }
      const anchor = this.#props.origin;
      const absoluteAnchorBounds = this.#getCoordinatesFromDialogOrigin(anchor);
      const { top: anchorTop, right: anchorRight, bottom: anchorBottom, left: anchorLeft } = absoluteAnchorBounds;
      const originCenterX = (anchorLeft + anchorRight) / 2;
      const hitAreaWidth = anchorRight - anchorLeft + CONNECTOR_HEIGHT;
      const windowWidth = document.body.clientWidth;
      const connectorFixedXValue = this.#props.getConnectorCustomXPosition ? this.#props.getConnectorCustomXPosition() : originCenterX;
      void RenderCoordinator.write(() => {
        this.style.setProperty("--dialog-top", "0");
        const dialog = this.#getDialog();
        dialog.style.visibility = "hidden";
        if (this.#isPendingShowDialog && !dialog.hasAttribute("open")) {
          if (!dialog.isConnected) {
            return;
          }
          dialog.showModal();
          this.setAttribute("open", "");
          this.#isPendingShowDialog = false;
        }
        const { width: dialogWidth, height: dialogHeight } = dialog.getBoundingClientRect();
        this.#bestHorizontalAlignment = this.#props.horizontalAlignment === "auto" /* AUTO */ ? this.#getBestHorizontalAlignment(absoluteAnchorBounds, devtoolsBounds) : this.#props.horizontalAlignment;
        this.#bestVerticalPosition = this.#props.position === "auto" /* AUTO */ ? this.#getBestVerticalPosition(absoluteAnchorBounds, dialogHeight, devtoolsBounds) : this.#props.position;
        if (this.#bestHorizontalAlignment === "auto" /* AUTO */ || this.#bestVerticalPosition === "auto" /* AUTO */) {
          return;
        }
        this.#hitArea.height = anchorBottom - anchorTop + CONNECTOR_HEIGHT;
        this.#hitArea.width = hitAreaWidth;
        this.style.setProperty(
          "--content-min-width",
          `${connectorFixedXValue - anchorLeft + CONNECTOR_WIDTH + DIALOG_SIDE_PADDING * 2}px`
        );
        this.style.setProperty("--dialog-left", "auto");
        this.style.setProperty("--dialog-right", "auto");
        this.style.setProperty("--dialog-margin", "0");
        switch (this.#bestHorizontalAlignment) {
          case "left" /* LEFT */: {
            const dialogLeft = Math.max(anchorLeft, devToolsLeft);
            const devtoolsRightBorderToDialogLeft = devToolsRight - dialogLeft;
            const dialogMaxWidth = devtoolsRightBorderToDialogLeft - DIALOG_PADDING_FROM_WINDOW;
            this.style.setProperty("--dialog-left", `${dialogLeft}px`);
            this.#hitArea.x = anchorLeft;
            this.style.setProperty("--dialog-max-width", `${dialogMaxWidth}px`);
            break;
          }
          case "right" /* RIGHT */: {
            const windowRightBorderToAnchorRight = windowWidth - anchorRight;
            const windowRightBorderToDevToolsRight = windowWidth - devToolsRight;
            const windowRightBorderToDialogRight = Math.max(windowRightBorderToAnchorRight, windowRightBorderToDevToolsRight);
            const dialogRight = windowWidth - windowRightBorderToDialogRight;
            const devtoolsLeftBorderToDialogRight = dialogRight - devToolsLeft;
            const dialogMaxWidth = devtoolsLeftBorderToDialogRight - DIALOG_PADDING_FROM_WINDOW;
            this.#hitArea.x = windowWidth - windowRightBorderToDialogRight - hitAreaWidth;
            this.style.setProperty("--dialog-right", `${windowRightBorderToDialogRight}px`);
            this.style.setProperty("--dialog-max-width", `${dialogMaxWidth}px`);
            break;
          }
          case "center" /* CENTER */: {
            const dialogCappedWidth = Math.min(devToolsWidth - DIALOG_PADDING_FROM_WINDOW, dialogWidth);
            let dialogLeft = Math.max(originCenterX - dialogCappedWidth * 0.5, devToolsLeft);
            dialogLeft = Math.min(dialogLeft, devToolsRight - dialogCappedWidth);
            this.style.setProperty("--dialog-left", `${dialogLeft}px`);
            this.#hitArea.x = originCenterX - hitAreaWidth * 0.5;
            this.style.setProperty("--dialog-max-width", `${devToolsWidth - DIALOG_PADDING_FROM_WINDOW}px`);
            break;
          }
          default:
            Platform.assertNever(
              this.#bestHorizontalAlignment,
              `Unknown alignment type: ${this.#bestHorizontalAlignment}`
            );
        }
        switch (this.#bestVerticalPosition) {
          case "top" /* TOP */: {
            this.style.setProperty("--dialog-top", "0");
            this.style.setProperty("--dialog-margin", "auto");
            this.style.setProperty("--dialog-margin-bottom", `${innerHeight - anchorTop}px`);
            this.#hitArea.y = anchorTop - CONNECTOR_HEIGHT;
            this.style.setProperty("--dialog-offset-y", `${DIALOG_ANIMATION_OFFSET}px`);
            this.style.setProperty(
              "--dialog-max-height",
              `${devToolsHeight - (innerHeight - anchorTop) - DIALOG_PADDING_FROM_WINDOW}px`
            );
            break;
          }
          case "bottom" /* BOTTOM */: {
            this.style.setProperty("--dialog-top", `${anchorBottom}px`);
            this.#hitArea.y = anchorTop;
            this.style.setProperty("--dialog-offset-y", `-${DIALOG_ANIMATION_OFFSET}px`);
            this.style.setProperty(
              "--dialog-max-height",
              `${devToolsHeight - (anchorBottom - devToolsTop) - DIALOG_PADDING_FROM_WINDOW}px`
            );
            break;
          }
          default:
            Platform.assertNever(this.#bestVerticalPosition, `Unknown position type: ${this.#bestVerticalPosition}`);
        }
        dialog.close();
        dialog.style.visibility = "";
      });
    });
  }
  async #showDialog() {
    if (!IS_DIALOG_SUPPORTED) {
      return;
    }
    if (this.#isPendingShowDialog || this.hasAttribute("open")) {
      return;
    }
    this.#isPendingShowDialog = true;
    this.#positionDialog();
    await RenderCoordinator.done();
    this.#isPendingShowDialog = false;
    const dialog = this.#getDialog();
    if (!dialog.isConnected) {
      return;
    }
    if (!dialog.hasAttribute("open")) {
      dialog.showModal();
    }
    if (this.#props.dialogShownCallback) {
      await this.#props.dialogShownCallback();
    }
    this.#updateDialogBounds();
    document.body.addEventListener("keydown", this.#onKeyDownBound);
  }
  #handleScrollAttempt(event) {
    if (this.#mouseEventWasInDialogContent(event) || !this.#props.closeOnScroll || !this.#getDialog().hasAttribute("open")) {
      return;
    }
    this.#closeDialog();
    this.dispatchEvent(new ForcedDialogClose());
  }
  #onKeyDown(event) {
    if (!this.#getDialog().hasAttribute("open") || !this.#props.closeOnESC) {
      return;
    }
    if (event.key !== Platform.KeyboardUtilities.ESCAPE_KEY) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.#closeDialog();
    this.dispatchEvent(new ForcedDialogClose());
  }
  #onCancel(event) {
    event.stopPropagation();
    event.preventDefault();
    if (!this.#getDialog().hasAttribute("open") || !this.#props.closeOnESC) {
      return;
    }
    this.dispatchEvent(new ForcedDialogClose());
  }
  #forceDialogCloseInDevToolsMutation() {
    if (!this.#dialog?.hasAttribute("open")) {
      return;
    }
    if (this.#devToolsBoundingElement === document.body) {
      return;
    }
    this.#closeDialog();
    this.dispatchEvent(new ForcedDialogClose());
  }
  #closeDialog() {
    if (this.#isPendingCloseDialog || !this.#getDialog().hasAttribute("open")) {
      return;
    }
    this.#isPendingCloseDialog = true;
    void RenderCoordinator.write(() => {
      this.#hitArea.width = 0;
      this.removeAttribute("open");
      this.#getDialog().close();
      this.#isPendingCloseDialog = false;
      document.body.removeEventListener("keydown", this.#onKeyDownBound);
    });
  }
  getDialogBounds() {
    return this.#dialogClientRect;
  }
  #renderHeaderRow() {
    if (!this.#props.dialogTitle && !this.#props.closeButton) {
      return null;
    }
    return html`
        <span class="dialog-header-text">${this.#props.dialogTitle}</span>
        ${this.#props.closeButton ? html`
          <devtools-button
            @click=${this.#closeDialog}
            .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "cross",
      title: i18nString(UIStrings.close),
      size: Buttons.Button.Size.SMALL
    }}
            jslog=${VisualLogging.close().track({ click: true })}
          ></devtools-button>
        ` : Lit.nothing}
    `;
  }
  #render() {
    if (!ComponentHelpers.ScheduledRender.isScheduledRender(this)) {
      throw new Error("Dialog render was not scheduled");
    }
    if (!IS_DIALOG_SUPPORTED) {
      Lit.render(
        // clang-format off
        html`
        <slot></slot>
      `,
        this.#shadow,
        { host: this }
      );
      return;
    }
    let dialogContent = Lit.nothing;
    if (this.#props.state === "expanded" /* EXPANDED */) {
      dialogContent = html`
    <div id="content">
          <div class="dialog-header">${this.#renderHeaderRow()}</div>
          <div class='dialog-content'>
            <slot></slot>
          </div>
    </div>
    `;
    }
    Lit.render(html`
      <style>${dialogStyles}</style>
      <dialog @click=${this.#handlePointerEvent} @pointermove=${this.#handlePointerEvent} @cancel=${this.#onCancel} @animationend=${this.#animationEndedEvent}
              jslog=${VisualLogging.dialog(this.#props.jslogContext).track({ resize: true, keydown: "Escape" }).parent("mapped")}>
        ${dialogContent}
      </dialog>
    `, this.#shadow, { host: this });
    VisualLogging.setMappedParent(this.#getDialog(), this.parentElementOrShadowHost());
  }
  setBoundingElementForTesting(element) {
    this.#devToolsBoundingElement = element;
    this.#onStateChange();
  }
}
customElements.define("devtools-dialog", Dialog);
export class PointerLeftDialogEvent extends Event {
  static eventName = "pointerleftdialog";
  constructor() {
    super(PointerLeftDialogEvent.eventName, { bubbles: true, composed: true });
  }
}
export class ClickOutsideDialogEvent extends Event {
  static eventName = "clickoutsidedialog";
  constructor() {
    super(ClickOutsideDialogEvent.eventName, { bubbles: true, composed: true });
  }
}
export class AnimationEndedEvent extends Event {
  static eventName = "animationended";
  constructor() {
    super(AnimationEndedEvent.eventName, { bubbles: true, composed: true });
  }
}
export class ForcedDialogClose extends Event {
  static eventName = "forceddialogclose";
  constructor() {
    super(ForcedDialogClose.eventName, { bubbles: true, composed: true });
  }
}
export var DialogVerticalPosition = /* @__PURE__ */ ((DialogVerticalPosition2) => {
  DialogVerticalPosition2["TOP"] = "top";
  DialogVerticalPosition2["BOTTOM"] = "bottom";
  DialogVerticalPosition2["AUTO"] = "auto";
  return DialogVerticalPosition2;
})(DialogVerticalPosition || {});
export var DialogState = /* @__PURE__ */ ((DialogState2) => {
  DialogState2["EXPANDED"] = "expanded";
  DialogState2["COLLAPSED"] = "collapsed";
  DialogState2["DISABLED"] = "disabled";
  return DialogState2;
})(DialogState || {});
export var DialogHorizontalAlignment = /* @__PURE__ */ ((DialogHorizontalAlignment2) => {
  DialogHorizontalAlignment2["LEFT"] = "left";
  DialogHorizontalAlignment2["RIGHT"] = "right";
  DialogHorizontalAlignment2["CENTER"] = "center";
  DialogHorizontalAlignment2["AUTO"] = "auto";
  return DialogHorizontalAlignment2;
})(DialogHorizontalAlignment || {});
//# sourceMappingURL=Dialog.js.map
