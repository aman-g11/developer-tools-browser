"use strict";
export class CSSFontFace {
  #fontFamily;
  #fontVariationAxes;
  #fontVariationAxesByTag = /* @__PURE__ */ new Map();
  #src;
  #fontDisplay;
  constructor(payload) {
    this.#fontFamily = payload.fontFamily;
    this.#fontVariationAxes = payload.fontVariationAxes || [];
    this.#src = payload.src;
    this.#fontDisplay = payload.fontDisplay;
    for (const axis of this.#fontVariationAxes) {
      this.#fontVariationAxesByTag.set(axis.tag, axis);
    }
  }
  getFontFamily() {
    return this.#fontFamily;
  }
  getSrc() {
    return this.#src;
  }
  getFontDisplay() {
    return this.#fontDisplay;
  }
  getVariationAxisByTag(tag) {
    return this.#fontVariationAxesByTag.get(tag);
  }
}
//# sourceMappingURL=CSSFontFace.js.map
