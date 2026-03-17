"use strict";
import * as Common from "../../core/common/common.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
let autofillManagerInstance;
export class AutofillManager extends Common.ObjectWrapper.ObjectWrapper {
  #address = "";
  #filledFields = [];
  #matches = [];
  #autofillModel = null;
  constructor() {
    super();
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.AutofillModel.AutofillModel,
      SDK.AutofillModel.Events.ADDRESS_FORM_FILLED,
      this.#addressFormFilled,
      this,
      { scoped: true }
    );
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!autofillManagerInstance || forceNew) {
      autofillManagerInstance = new AutofillManager();
    }
    return autofillManagerInstance;
  }
  async #addressFormFilled({ data }) {
    this.#autofillModel = data.autofillModel;
    this.#processAddressFormFilledData(data.event);
    if (this.#address) {
      this.dispatchEventToListeners("AddressFormFilled" /* ADDRESS_FORM_FILLED */, {
        address: this.#address,
        filledFields: this.#filledFields,
        matches: this.#matches
      });
    }
  }
  getLastFilledAddressForm() {
    if (!this.#address || !this.#autofillModel) {
      return null;
    }
    return {
      address: this.#address,
      filledFields: this.#filledFields,
      matches: this.#matches
    };
  }
  highlightFilledField(filledField) {
    const backendNodeId = filledField.fieldId;
    const target = SDK.FrameManager.FrameManager.instance().getFrame(filledField.frameId)?.resourceTreeModel().target();
    if (target) {
      const deferredNode = new SDK.DOMModel.DeferredDOMNode(target, backendNodeId);
      const domModel = target.model(SDK.DOMModel.DOMModel);
      if (deferredNode && domModel) {
        domModel.overlayModel().highlightInOverlay({ deferredNode }, "all");
      }
    }
  }
  clearHighlightedFilledFields() {
    SDK.OverlayModel.OverlayModel.hideDOMNodeHighlight();
  }
  #processAddressFormFilledData({ addressUi, filledFields }) {
    const concatAddressFields = (addressFields) => addressFields.fields.filter((field) => field.value.length).map((field) => field.value).join(" ");
    this.#address = addressUi.addressFields.map((addressFields) => concatAddressFields(addressFields)).filter((str) => str.length).join("\n");
    this.#filledFields = filledFields;
    this.#matches = [];
    for (let i = 0; i < this.#filledFields.length; i++) {
      if (this.#filledFields[i].value === "") {
        continue;
      }
      const needle = Platform.StringUtilities.escapeForRegExp(this.#filledFields[i].value.replaceAll(/\s/g, " ")).replaceAll(/([.,]+)\s/g, "$1? ");
      const matches = this.#address.replaceAll(/\s/g, " ").matchAll(new RegExp(needle, "g"));
      for (const match of matches) {
        if (typeof match.index !== "undefined") {
          this.#matches.push({ startIndex: match.index, endIndex: match.index + match[0].length, filledFieldIndex: i });
        }
      }
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ADDRESS_FORM_FILLED"] = "AddressFormFilled";
  return Events2;
})(Events || {});
//# sourceMappingURL=AutofillManager.js.map
