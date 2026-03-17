"use strict";
import {
  createTextContent
} from "../../../../third_party/puppeteer/package/lib/esm/puppeteer/injected/TextContent.js";
import {
  textQuerySelectorAll
} from "../../../../third_party/puppeteer/package/lib/esm/puppeteer/injected/TextQuerySelector.js";
const MINIMUM_TEXT_LENGTH = 12;
const MAXIMUM_TEXT_LENGTH = 64;
const collect = (iter, max = Infinity) => {
  const results = [];
  for (const value of iter) {
    if (max <= 0) {
      break;
    }
    results.push(value);
    --max;
  }
  return results;
};
export const computeTextSelector = (node) => {
  const content = createTextContent(node).full.trim();
  if (!content) {
    return;
  }
  if (content.length <= MINIMUM_TEXT_LENGTH) {
    const elements = collect(textQuerySelectorAll(document, content), 2);
    if (elements.length !== 1 || elements[0] !== node) {
      return;
    }
    return [content];
  }
  if (content.length > MAXIMUM_TEXT_LENGTH) {
    return;
  }
  let left = MINIMUM_TEXT_LENGTH;
  let right = content.length;
  while (left <= right) {
    const center = left + (right - left >> 2);
    const elements = collect(
      textQuerySelectorAll(document, content.slice(0, center)),
      2
    );
    if (elements.length !== 1 || elements[0] !== node) {
      left = center + 1;
    } else {
      right = center - 1;
    }
  }
  if (right === content.length) {
    return;
  }
  const length = right + 1;
  const remainder = content.slice(length, length + MAXIMUM_TEXT_LENGTH);
  return [content.slice(0, length + remainder.search(/ |$/))];
};
//# sourceMappingURL=TextSelector.js.map
