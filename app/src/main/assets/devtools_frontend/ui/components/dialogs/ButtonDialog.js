"use strict";
import * as ComponentHelpers from "../../../ui/components/helpers/helpers.js";
import {
  Directives,
  html,
  render
} from "../../../ui/lit/lit.js";
import buttonDialogStyles from "./buttonDialog.css.js";
import {
  DialogHorizontalAlignment,
  DialogState,
  DialogVerticalPosition
} from "./Dialog.js";
const { ref } = Directives;
export class ButtonDialog extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #dialog = null;
  #showButton = null;
  #data = null;
  set data(data) {
    this.#data = data;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
  }
  #showDialog() {
    if (!this.#dialog) {
      throw new Error("Dialog not found");
    }
    if (this.#data?.state === DialogState.DISABLED) {
      void this.#dialog.setDialogVisible(false);
    } else {
      void this.#dialog.setDialogVisible(true);
    }
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
  }
  #closeDialog(evt) {
    if (!this.#dialog) {
      throw new Error("Dialog not found");
    }
    void this.#dialog.setDialogVisible(false);
    if (evt) {
      evt.stopImmediatePropagation();
    }
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
  }
  set state(state) {
    if (this.#data) {
      this.#data.state = state;
      void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
    }
  }
  #render() {
    if (!this.#data) {
      throw new Error("ButtonDialog.data is not set");
    }
    if (!ComponentHelpers.ScheduledRender.isScheduledRender(this)) {
      throw new Error("Button dialog render was not scheduled");
    }
    render(
      html`
      <style>${buttonDialogStyles}</style>
      <devtools-button
        @click=${this.#showDialog}
        ${ref((el) => {
        if (el instanceof HTMLElement) {
          this.#showButton = el;
        }
      })}
        .data=${{
        variant: this.#data.variant,
        iconName: this.#data.iconName,
        disabled: this.#data.disabled,
        title: this.#data.iconTitle,
        jslogContext: this.#data.jslogContext
      }}
      ></devtools-button>
      <devtools-dialog
        @clickoutsidedialog=${this.#closeDialog}
        .origin=${() => {
        if (!this.#showButton) {
          throw new Error("Button not found");
        }
        return this.#showButton;
      }}
        .position=${this.#data.position ?? DialogVerticalPosition.BOTTOM}
        .horizontalAlignment=${this.#data.horizontalAlignment ?? DialogHorizontalAlignment.RIGHT}
        .closeOnESC=${this.#data.closeOnESC ?? false}
        .closeOnScroll=${this.#data.closeOnScroll ?? false}
        .closeButton=${this.#data.closeButton ?? false}
        .dialogTitle=${this.#data.dialogTitle}
        .jslogContext=${this.#data.jslogContext ?? ""}
        .state=${this.#data.state ?? DialogState.EXPANDED}
        ${ref((el) => {
        if (el instanceof HTMLElement) {
          this.#dialog = el;
        }
      })}
      >
        <slot></slot>
      </devtools-dialog>
      `,
      this.#shadow,
      { host: this }
    );
    if (this.#data.openOnRender) {
      this.#showDialog();
      this.#data.openOnRender = false;
    }
  }
}
customElements.define("devtools-button-dialog", ButtonDialog);
//# sourceMappingURL=ButtonDialog.js.map
