"use strict";
import * as Platform from "../../core/platform/platform.js";
import { ContentData } from "./ContentData.js";
import { SearchMatch } from "./ContentProvider.js";
const KEY_VALUE_FILTER_REGEXP = /(?:^|\s)(\-)?([\w\-]+):([^\s]+)/;
const REGEXP_FILTER_REGEXP = /(?:^|\s)(\-)?\/([^\/\\]+(\\.[^\/]*)*)\//;
const TEXT_FILTER_REGEXP = /(?:^|\s)(\-)?([^\s]+)/;
const SPACE_CHAR_REGEXP = /\s/;
export const Utils = {
  isSpaceChar: function(char) {
    return SPACE_CHAR_REGEXP.test(char);
  },
  lineIndent: function(line) {
    let indentation = 0;
    while (indentation < line.length && Utils.isSpaceChar(line.charAt(indentation))) {
      ++indentation;
    }
    return line.substr(0, indentation);
  },
  splitStringByRegexes(text, regexes) {
    const matches = [];
    const globalRegexes = [];
    for (let i = 0; i < regexes.length; i++) {
      const regex = regexes[i];
      if (!regex.global) {
        globalRegexes.push(new RegExp(regex.source, regex.flags ? regex.flags + "g" : "g"));
      } else {
        globalRegexes.push(regex);
      }
    }
    doSplit(text, 0, 0);
    return matches;
    function doSplit(text2, regexIndex, startIndex) {
      if (regexIndex >= globalRegexes.length) {
        matches.push({ value: text2, position: startIndex, regexIndex: -1, captureGroups: [] });
        return;
      }
      const regex = globalRegexes[regexIndex];
      let currentIndex = 0;
      let result;
      regex.lastIndex = 0;
      while ((result = regex.exec(text2)) !== null) {
        const stringBeforeMatch = text2.substring(currentIndex, result.index);
        if (stringBeforeMatch) {
          doSplit(stringBeforeMatch, regexIndex + 1, startIndex + currentIndex);
        }
        const match = result[0];
        matches.push({
          value: match,
          position: startIndex + result.index,
          regexIndex,
          captureGroups: result.slice(1)
        });
        currentIndex = result.index + match.length;
      }
      const stringAfterMatches = text2.substring(currentIndex);
      if (stringAfterMatches) {
        doSplit(stringAfterMatches, regexIndex + 1, startIndex + currentIndex);
      }
    }
  }
};
export class FilterParser {
  keys;
  constructor(keys) {
    this.keys = keys;
  }
  static cloneFilter(filter) {
    return { key: filter.key, text: filter.text, regex: filter.regex, negative: filter.negative };
  }
  parse(query) {
    const splitFilters = Utils.splitStringByRegexes(query, [KEY_VALUE_FILTER_REGEXP, REGEXP_FILTER_REGEXP, TEXT_FILTER_REGEXP]);
    const parsedFilters = [];
    for (const { regexIndex, captureGroups } of splitFilters) {
      if (regexIndex === -1) {
        continue;
      }
      if (regexIndex === 0) {
        const startsWithMinus = captureGroups[0];
        const parsedKey = captureGroups[1];
        const parsedValue = captureGroups[2];
        if (this.keys.indexOf(parsedKey) !== -1) {
          parsedFilters.push({
            key: parsedKey,
            text: parsedValue,
            negative: Boolean(startsWithMinus)
          });
        } else {
          parsedFilters.push({
            text: `${parsedKey}:${parsedValue}`,
            negative: Boolean(startsWithMinus)
          });
        }
      } else if (regexIndex === 1) {
        const startsWithMinus = captureGroups[0];
        const parsedRegex = captureGroups[1];
        try {
          parsedFilters.push({
            regex: new RegExp(parsedRegex, "im"),
            negative: Boolean(startsWithMinus)
          });
        } catch {
          parsedFilters.push({
            text: `/${parsedRegex}/`,
            negative: Boolean(startsWithMinus)
          });
        }
      } else if (regexIndex === 2) {
        const startsWithMinus = captureGroups[0];
        const parsedText = captureGroups[1];
        parsedFilters.push({
          text: parsedText,
          negative: Boolean(startsWithMinus)
        });
      }
    }
    return parsedFilters;
  }
}
export class BalancedJSONTokenizer {
  callback;
  index;
  balance;
  buffer;
  findMultiple;
  closingDoubleQuoteRegex;
  lastBalancedIndex;
  constructor(callback, findMultiple) {
    this.callback = callback;
    this.index = 0;
    this.balance = 0;
    this.buffer = "";
    this.findMultiple = findMultiple || false;
    this.closingDoubleQuoteRegex = /[^\\](?:\\\\)*"/g;
  }
  write(chunk) {
    this.buffer += chunk;
    const lastIndex = this.buffer.length;
    const buffer = this.buffer;
    let index;
    for (index = this.index; index < lastIndex; ++index) {
      const character = buffer[index];
      if (character === '"') {
        this.closingDoubleQuoteRegex.lastIndex = index;
        if (!this.closingDoubleQuoteRegex.test(buffer)) {
          break;
        }
        index = this.closingDoubleQuoteRegex.lastIndex - 1;
      } else if (character === "{") {
        ++this.balance;
      } else if (character === "}") {
        --this.balance;
        if (this.balance < 0) {
          this.reportBalanced();
          return false;
        }
        if (!this.balance) {
          this.lastBalancedIndex = index + 1;
          if (!this.findMultiple) {
            break;
          }
        }
      } else if (character === "]" && !this.balance) {
        this.reportBalanced();
        return false;
      }
    }
    this.index = index;
    this.reportBalanced();
    return true;
  }
  reportBalanced() {
    if (!this.lastBalancedIndex) {
      return;
    }
    this.callback(this.buffer.slice(0, this.lastBalancedIndex));
    this.buffer = this.buffer.slice(this.lastBalancedIndex);
    this.index -= this.lastBalancedIndex;
    this.lastBalancedIndex = 0;
  }
  remainder() {
    return this.buffer;
  }
}
export const detectIndentation = function(lines) {
  const frequencies = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  let tabs = 0, previous = 0;
  for (const line of lines) {
    let current = 0;
    if (line.length !== 0) {
      let char = line.charAt(0);
      if (char === "	") {
        tabs++;
        continue;
      }
      while (char === " ") {
        char = line.charAt(++current);
      }
    }
    if (current === line.length) {
      previous = 0;
      continue;
    }
    const delta = Math.abs(current - previous);
    if (delta < frequencies.length) {
      frequencies[delta] = frequencies[delta] + 1;
    }
    previous = current;
  }
  let mostFrequentDelta = 0, highestFrequency = 0;
  for (let delta = 1; delta < frequencies.length; ++delta) {
    const frequency = frequencies[delta];
    if (frequency > highestFrequency) {
      highestFrequency = frequency;
      mostFrequentDelta = delta;
    }
  }
  if (tabs > mostFrequentDelta) {
    return "	";
  }
  if (!mostFrequentDelta) {
    return null;
  }
  return " ".repeat(mostFrequentDelta);
};
export const isMinified = function(text) {
  let lineCount = 0;
  for (let lastIndex = 0; lastIndex < text.length; ++lineCount) {
    let eolIndex = text.indexOf("\n", lastIndex);
    if (eolIndex < 0) {
      eolIndex = text.length;
    }
    lastIndex = eolIndex + 1;
  }
  return (text.length - lineCount) / lineCount >= 80;
};
export const performSearchInContentData = function(contentData, query, caseSensitive, isRegex) {
  if (ContentData.isError(contentData) || !contentData.isTextContent) {
    return [];
  }
  return performSearchInContent(contentData.textObj, query, caseSensitive, isRegex);
};
export const performSearchInContent = function(text, query, caseSensitive, isRegex) {
  const regex = Platform.StringUtilities.createSearchRegex(query, caseSensitive, isRegex);
  const result = [];
  for (let i = 0; i < text.lineCount(); ++i) {
    const lineContent = text.lineAt(i);
    const matches = lineContent.matchAll(regex);
    for (const match of matches) {
      result.push(new SearchMatch(i, lineContent, match.index, match[0].length));
    }
  }
  return result;
};
export const performSearchInSearchMatches = function(matches, query, caseSensitive, isRegex) {
  const regex = Platform.StringUtilities.createSearchRegex(query, caseSensitive, isRegex);
  const result = [];
  for (const { lineNumber, lineContent } of matches) {
    const matches2 = lineContent.matchAll(regex);
    for (const match of matches2) {
      result.push(new SearchMatch(lineNumber, lineContent, match.index, match[0].length));
    }
  }
  return result;
};
export const getOverlap = function(s1, s2) {
  const minLen = Math.min(s1.length, s2.length);
  for (let n = minLen; n > 0; n--) {
    const suffix = s1.slice(-n);
    const prefix = s2.substring(0, n);
    if (suffix === prefix) {
      return suffix;
    }
  }
  return null;
};
//# sourceMappingURL=TextUtils.js.map
