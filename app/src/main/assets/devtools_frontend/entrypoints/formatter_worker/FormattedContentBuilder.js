"use strict";
export class FormattedContentBuilder {
  constructor(indentString) {
    this.indentString = indentString;
  }
  #lastOriginalPosition = 0;
  #formattedContent = [];
  #formattedContentLength = 0;
  #lastFormattedPosition = 0;
  #nestingLevel = 0;
  #newLines = 0;
  #enforceSpaceBetweenWords = true;
  #softSpace = false;
  #hardSpaces = 0;
  #cachedIndents = /* @__PURE__ */ new Map();
  #canBeIdentifierOrNumber = /[$\u200C\u200D\p{ID_Continue}]/u;
  mapping = { original: [0], formatted: [0] };
  setEnforceSpaceBetweenWords(value) {
    const oldValue = this.#enforceSpaceBetweenWords;
    this.#enforceSpaceBetweenWords = value;
    return oldValue;
  }
  addToken(token, offset) {
    if (this.#enforceSpaceBetweenWords && !this.#hardSpaces && !this.#softSpace) {
      const lastCharOfLastToken = this.#formattedContent.at(-1)?.at(-1) ?? "";
      if (this.#canBeIdentifierOrNumber.test(lastCharOfLastToken) && this.#canBeIdentifierOrNumber.test(token)) {
        this.addSoftSpace();
      }
    }
    this.#appendFormatting();
    this.#addMappingIfNeeded(offset);
    this.#addText(token);
  }
  addSoftSpace() {
    if (!this.#hardSpaces) {
      this.#softSpace = true;
    }
  }
  addHardSpace() {
    this.#softSpace = false;
    ++this.#hardSpaces;
  }
  addNewLine(noSquash) {
    if (!this.#formattedContentLength) {
      return;
    }
    if (noSquash) {
      ++this.#newLines;
    } else {
      this.#newLines = this.#newLines || 1;
    }
  }
  increaseNestingLevel() {
    this.#nestingLevel += 1;
  }
  decreaseNestingLevel() {
    if (this.#nestingLevel > 0) {
      this.#nestingLevel -= 1;
    }
  }
  content() {
    return this.#formattedContent.join("") + (this.#newLines ? "\n" : "");
  }
  #appendFormatting() {
    if (this.#newLines) {
      for (let i = 0; i < this.#newLines; ++i) {
        this.#addText("\n");
      }
      this.#addText(this.#indent());
    } else if (this.#softSpace) {
      this.#addText(" ");
    }
    if (this.#hardSpaces) {
      for (let i = 0; i < this.#hardSpaces; ++i) {
        this.#addText(" ");
      }
    }
    this.#newLines = 0;
    this.#softSpace = false;
    this.#hardSpaces = 0;
  }
  #indent() {
    const cachedValue = this.#cachedIndents.get(this.#nestingLevel);
    if (cachedValue) {
      return cachedValue;
    }
    let fullIndent = "";
    for (let i = 0; i < this.#nestingLevel; ++i) {
      fullIndent += this.indentString;
    }
    if (this.#nestingLevel <= 20) {
      this.#cachedIndents.set(this.#nestingLevel, fullIndent);
    }
    return fullIndent;
  }
  #addText(text) {
    this.#formattedContent.push(text);
    this.#formattedContentLength += text.length;
  }
  #addMappingIfNeeded(originalPosition) {
    if (originalPosition - this.#lastOriginalPosition === this.#formattedContentLength - this.#lastFormattedPosition) {
      return;
    }
    this.mapping.original.push(originalPosition);
    this.#lastOriginalPosition = originalPosition;
    this.mapping.formatted.push(this.#formattedContentLength);
    this.#lastFormattedPosition = this.#formattedContentLength;
  }
}
//# sourceMappingURL=FormattedContentBuilder.js.map
