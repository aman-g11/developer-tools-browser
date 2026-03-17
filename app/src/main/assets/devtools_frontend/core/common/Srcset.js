"use strict";
export var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2[TokenType2["LITERAL"] = 0] = "LITERAL";
  TokenType2[TokenType2["URL"] = 1] = "URL";
  return TokenType2;
})(TokenType || {});
export function parseSrcset(value) {
  const result = [];
  let i = 0;
  while (value.length) {
    if (i++ > 0) {
      result.push({ value: " ", type: 0 /* LITERAL */ });
    }
    value = value.trim();
    let url = "";
    let descriptor = "";
    const indexOfSpace = value.search(/\s/);
    if (indexOfSpace === -1) {
      url = value;
    } else if (indexOfSpace > 0 && value[indexOfSpace - 1] === ",") {
      url = value.substring(0, indexOfSpace);
    } else {
      url = value.substring(0, indexOfSpace);
      const indexOfComma = value.indexOf(",", indexOfSpace);
      if (indexOfComma !== -1) {
        descriptor = value.substring(indexOfSpace, indexOfComma + 1);
      } else {
        descriptor = value.substring(indexOfSpace);
      }
    }
    if (url) {
      if (url.endsWith(",")) {
        result.push({ value: url.substring(0, url.length - 1), type: 1 /* URL */ });
        result.push({ type: 0 /* LITERAL */, value: "," });
      } else {
        result.push({ value: url, type: 1 /* URL */ });
      }
    }
    if (descriptor) {
      result.push({ type: 0 /* LITERAL */, value: descriptor });
    }
    value = value.substring(url.length + descriptor.length);
  }
  return result;
}
//# sourceMappingURL=Srcset.js.map
