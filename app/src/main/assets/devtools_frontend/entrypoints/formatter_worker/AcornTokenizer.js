"use strict";
import * as Platform from "../../core/platform/platform.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as Acorn from "../../third_party/acorn/acorn.js";
export class AcornTokenizer {
  #textCursor;
  #tokenLineStart;
  #tokenLineEnd;
  #tokens;
  #idx = 0;
  constructor(content, tokens) {
    this.#tokens = tokens;
    const contentLineEndings = Platform.StringUtilities.findLineEndingIndexes(content);
    this.#textCursor = new TextUtils.TextCursor.TextCursor(contentLineEndings);
    this.#tokenLineStart = 0;
    this.#tokenLineEnd = 0;
  }
  static punctuator(token, values) {
    return token.type !== Acorn.tokTypes.num && token.type !== Acorn.tokTypes.regexp && token.type !== Acorn.tokTypes.string && token.type !== Acorn.tokTypes.name && !token.type.keyword && (!values || token.type.label.length === 1 && values.indexOf(token.type.label) !== -1);
  }
  static keyword(token, keyword) {
    return Boolean(token.type.keyword) && token.type !== Acorn.tokTypes["_true"] && token.type !== Acorn.tokTypes["_false"] && token.type !== Acorn.tokTypes["_null"] && (!keyword || token.type.keyword === keyword);
  }
  static identifier(token, identifier) {
    return token.type === Acorn.tokTypes.name && (!identifier || token.value === identifier);
  }
  static arrowIdentifier(token, identifier) {
    return token.type === Acorn.tokTypes.arrow && (!identifier || token.type.label === identifier);
  }
  static lineComment(token) {
    return token.type === "Line";
  }
  static blockComment(token) {
    return token.type === "Block";
  }
  nextToken() {
    const token = this.#tokens[this.#idx++];
    if (!token || token.type === Acorn.tokTypes.eof) {
      return null;
    }
    this.#textCursor.advance(token.start);
    this.#tokenLineStart = this.#textCursor.lineNumber();
    this.#textCursor.advance(token.end);
    this.#tokenLineEnd = this.#textCursor.lineNumber();
    return token;
  }
  peekToken() {
    const token = this.#tokens[this.#idx];
    if (!token || token.type === Acorn.tokTypes.eof) {
      return null;
    }
    return token;
  }
  tokenLineStart() {
    return this.#tokenLineStart;
  }
  tokenLineEnd() {
    return this.#tokenLineEnd;
  }
}
export const ECMA_VERSION = 2022;
//# sourceMappingURL=AcornTokenizer.js.map
