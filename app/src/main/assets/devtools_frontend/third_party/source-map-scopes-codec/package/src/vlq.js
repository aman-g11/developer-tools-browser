"use strict";
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const BASE64_CODES = new Uint8Array(123);
for (let index = 0; index < BASE64_CHARS.length; ++index) {
  BASE64_CODES[BASE64_CHARS.charCodeAt(index)] = index;
}
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE_MASK = (1 << 5) - 1;
const VLQ_CONTINUATION_MASK = 1 << 5;
export function encodeSigned(n) {
  n = n >= 0 ? 2 * n : 1 - 2 * n;
  return encodeUnsigned(n);
}
export function encodeUnsigned(n) {
  let result = "";
  while (true) {
    const digit = n & 31;
    n >>>= 5;
    if (n === 0) {
      result += BASE64_CHARS[digit];
      break;
    } else {
      result += BASE64_CHARS[32 + digit];
    }
  }
  return result;
}
export class TokenIterator {
  #string;
  #position;
  constructor(string) {
    this.#string = string;
    this.#position = 0;
  }
  nextChar() {
    return this.#string.charAt(this.#position++);
  }
  /** Returns the unicode value of the next character and advances the iterator  */
  nextCharCode() {
    return this.#string.charCodeAt(this.#position++);
  }
  peek() {
    return this.#string.charAt(this.#position);
  }
  hasNext() {
    return this.#position < this.#string.length;
  }
  nextSignedVLQ() {
    let result = this.nextUnsignedVLQ();
    const negative = result & 1;
    result >>>= 1;
    return negative ? -result : result;
  }
  nextUnsignedVLQ() {
    let result = 0;
    let shift = 0;
    let digit = 0;
    do {
      const charCode = this.nextCharCode();
      digit = BASE64_CODES[charCode];
      result += (digit & VLQ_BASE_MASK) << shift;
      shift += VLQ_BASE_SHIFT;
    } while (digit & VLQ_CONTINUATION_MASK);
    return result;
  }
  currentChar() {
    return this.#string.charAt(this.#position - 1);
  }
}
//# sourceMappingURL=vlq.js.map
