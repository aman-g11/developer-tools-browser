"use strict";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import { CSSQuery } from "./CSSQuery.js";
export class CSSStartingStyle extends CSSQuery {
  static parseStartingStylePayload(cssModel, payload) {
    return payload.map((p) => new CSSStartingStyle(cssModel, p));
  }
  constructor(cssModel, payload) {
    super(cssModel);
    this.reinitialize(payload);
  }
  reinitialize(payload) {
    this.range = payload.range ? TextUtils.TextRange.TextRange.fromObject(payload.range) : null;
    this.styleSheetId = payload.styleSheetId;
  }
  active() {
    return true;
  }
}
//# sourceMappingURL=CSSStartingStyle.js.map
