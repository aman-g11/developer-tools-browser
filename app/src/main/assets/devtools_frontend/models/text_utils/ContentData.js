"use strict";
import * as Platform from "../../core/platform/platform.js";
import { contentAsDataURL } from "./ContentProvider.js";
import { Text } from "./Text.js";
export class ContentData {
  mimeType;
  charset;
  #contentAsBase64;
  #contentAsText;
  #contentAsTextObj;
  constructor(data, isBase64, mimeType, charset) {
    this.charset = charset || "utf-8";
    if (isBase64) {
      this.#contentAsBase64 = data;
    } else {
      this.#contentAsText = data;
    }
    this.mimeType = mimeType;
    if (!this.mimeType) {
      this.mimeType = isBase64 ? "application/octet-stream" : "text/plain";
    }
  }
  /**
   * Returns the data as base64.
   *
   * @throws if this `ContentData` was constructed from text content.
   */
  get base64() {
    if (this.#contentAsBase64 === void 0) {
      throw new Error("Encoding text content as base64 is not supported");
    }
    return this.#contentAsBase64;
  }
  /**
   * Returns the content as text. If this `ContentData` was constructed with base64
   * encoded bytes, it will use the provided charset to attempt to decode the bytes.
   *
   * @throws if `mimeType` is not a text type.
   */
  get text() {
    if (this.#contentAsText !== void 0) {
      return this.#contentAsText;
    }
    if (!this.isTextContent) {
      throw new Error("Cannot interpret binary data as text");
    }
    const binaryString = window.atob(this.#contentAsBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    this.#contentAsText = new TextDecoder(this.charset).decode(bytes);
    return this.#contentAsText;
  }
  /** @returns true, if this `ContentData` was constructed from text content or the mime type indicates text that can be decoded */
  get isTextContent() {
    return this.#createdFromText || Platform.MimeType.isTextType(this.mimeType);
  }
  get isEmpty() {
    return !Boolean(this.#contentAsBase64) && !Boolean(this.#contentAsText);
  }
  get createdFromBase64() {
    return this.#contentAsBase64 !== void 0;
  }
  get #createdFromText() {
    return this.#contentAsBase64 === void 0;
  }
  /**
   * Returns the text content as a `Text` object. The returned object is always the same to
   * minimize the number of times we have to calculate the line endings array.
   *
   * @throws if `mimeType` is not a text type.
   */
  get textObj() {
    if (this.#contentAsTextObj === void 0) {
      this.#contentAsTextObj = new Text(this.text);
    }
    return this.#contentAsTextObj;
  }
  /**
   * @returns True, iff the contents (base64 or text) are equal.
   * Does not compare mime type and charset, but will decode base64 data if both
   * mime types indicate that it's text content.
   */
  contentEqualTo(other) {
    if (this.#contentAsBase64 !== void 0 && other.#contentAsBase64 !== void 0) {
      return this.#contentAsBase64 === other.#contentAsBase64;
    }
    if (this.#contentAsText !== void 0 && other.#contentAsText !== void 0) {
      return this.#contentAsText === other.#contentAsText;
    }
    if (this.isTextContent && other.isTextContent) {
      return this.text === other.text;
    }
    return false;
  }
  asDataUrl() {
    if (this.#contentAsBase64 !== void 0) {
      const charset = this.isTextContent ? this.charset : null;
      return contentAsDataURL(this.#contentAsBase64, this.mimeType ?? "", true, charset);
    }
    return contentAsDataURL(this.text, this.mimeType ?? "", false, "utf-8");
  }
  /**
   * @deprecated Used during migration from `DeferredContent` to `ContentData`.
   */
  asDeferedContent() {
    if (this.isTextContent) {
      return { content: this.text, isEncoded: false };
    }
    if (this.#contentAsText !== void 0) {
      return { content: this.#contentAsText, isEncoded: false };
    }
    if (this.#contentAsBase64 !== void 0) {
      return { content: this.#contentAsBase64, isEncoded: true };
    }
    throw new Error("Unreachable");
  }
  static isError(contentDataOrError) {
    return "error" in contentDataOrError;
  }
  /** @returns `value` if the passed `ContentDataOrError` is an error, or the text content otherwise */
  static textOr(contentDataOrError, value) {
    if (ContentData.isError(contentDataOrError)) {
      return value;
    }
    return contentDataOrError.text;
  }
  /** @returns an empty 'text/plain' content data if the passed `ContentDataOrError` is an error, or the content data itself otherwise */
  static contentDataOrEmpty(contentDataOrError) {
    if (ContentData.isError(contentDataOrError)) {
      return EMPTY_TEXT_CONTENT_DATA;
    }
    return contentDataOrError;
  }
  /**
   * @deprecated Used during migration from `DeferredContent` to `ContentData`.
   */
  static asDeferredContent(contentDataOrError) {
    if (ContentData.isError(contentDataOrError)) {
      return { error: contentDataOrError.error, content: null, isEncoded: false };
    }
    return contentDataOrError.asDeferedContent();
  }
}
export const EMPTY_TEXT_CONTENT_DATA = new ContentData(
  "",
  /* isBase64 */
  false,
  "text/plain"
);
//# sourceMappingURL=ContentData.js.map
