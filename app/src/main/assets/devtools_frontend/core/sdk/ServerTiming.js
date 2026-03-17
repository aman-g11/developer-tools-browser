"use strict";
import * as Common from "../common/common.js";
import * as i18n from "../i18n/i18n.js";
const UIStrings = {
  /**
   * @description Text in Server Timing
   * @example {sql-lookup} PH1
   */
  deprecatedSyntaxFoundPleaseUse: 'Deprecated syntax found for metric "{PH1}". Please use: <name>;dur=<duration>;desc=<description>',
  /**
   * @description Text in Server Timing
   * @example {https} PH1
   */
  duplicateParameterSIgnored: 'Duplicate parameter "{PH1}" ignored.',
  /**
   * @description Text in Server Timing
   * @example {https} PH1
   */
  noValueFoundForParameterS: 'No value found for parameter "{PH1}".',
  /**
   * @description Text in Server Timing
   * @example {https} PH1
   */
  unrecognizedParameterS: 'Unrecognized parameter "{PH1}".',
  /**
   * @description Text in Server Timing
   */
  extraneousTrailingCharacters: "Extraneous trailing characters.",
  /**
   * @description Text in Server Timing
   * @example {https} PH1
   * @example {2.0} PH2
   */
  unableToParseSValueS: 'Unable to parse "{PH1}" value "{PH2}".'
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/ServerTiming.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export const cloudflarePrefix = "(cf) ";
export const cloudinaryPrefix = "(cld) ";
export class ServerTiming {
  metric;
  value;
  description;
  constructor(metric, value, description) {
    this.metric = metric;
    this.value = value;
    this.description = description;
  }
  static parseHeaders(headers) {
    const rawServerTimingHeaders = headers.filter((item) => item.name.toLowerCase() === "server-timing");
    if (!rawServerTimingHeaders.length) {
      return null;
    }
    const serverTimings = rawServerTimingHeaders.reduce((timings, header) => {
      const timing = this.createFromHeaderValue(header.value);
      timings.push(...timing.map(function(entry) {
        return new ServerTiming(entry.name, entry.dur ?? null, entry.desc ?? "");
      }));
      return timings;
    }, []);
    return serverTimings;
  }
  static createFromHeaderValue(valueString) {
    function trimLeadingWhiteSpace() {
      valueString = valueString.replace(/^\s*/, "");
    }
    function consumeDelimiter(char) {
      console.assert(char.length === 1);
      trimLeadingWhiteSpace();
      if (valueString.charAt(0) !== char) {
        return false;
      }
      valueString = valueString.substring(1);
      return true;
    }
    function consumeToken() {
      const result2 = /^(?:\s*)([\w!#$%&'*+\-.^`|~]+)(?:\s*)(.*)/.exec(valueString);
      if (!result2) {
        return null;
      }
      valueString = result2[2];
      return result2[1];
    }
    function consumeTokenOrQuotedString() {
      trimLeadingWhiteSpace();
      if (valueString.charAt(0) === '"') {
        return consumeQuotedString();
      }
      return consumeToken();
    }
    function consumeQuotedString() {
      console.assert(valueString.charAt(0) === '"');
      valueString = valueString.substring(1);
      let value = "";
      while (valueString.length) {
        const result2 = /^([^"\\]*)(.*)/.exec(valueString);
        if (!result2) {
          return null;
        }
        value += result2[1];
        if (result2[2].charAt(0) === '"') {
          valueString = result2[2].substring(1);
          return value;
        }
        console.assert(result2[2].charAt(0) === "\\");
        value += result2[2].charAt(1);
        valueString = result2[2].substring(2);
      }
      return null;
    }
    function consumeExtraneous() {
      const result2 = /([,;].*)/.exec(valueString);
      if (result2) {
        valueString = result2[1];
      }
    }
    const result = [];
    let name;
    while ((name = consumeToken()) !== null) {
      const entry = { name };
      if (valueString.charAt(0) === "=") {
        this.showWarning(i18nString(UIStrings.deprecatedSyntaxFoundPleaseUse, { PH1: name }));
      }
      while (consumeDelimiter(";")) {
        let paramName;
        if ((paramName = consumeToken()) === null) {
          continue;
        }
        paramName = paramName.toLowerCase();
        const parseParameter = this.getParserForParameter(paramName);
        let paramValue = null;
        if (consumeDelimiter("=")) {
          paramValue = consumeTokenOrQuotedString();
          consumeExtraneous();
        }
        if (parseParameter) {
          if (entry.hasOwnProperty(paramName)) {
            this.showWarning(i18nString(UIStrings.duplicateParameterSIgnored, { PH1: paramName }));
            continue;
          }
          if (paramValue === null) {
            this.showWarning(i18nString(UIStrings.noValueFoundForParameterS, { PH1: paramName }));
          }
          parseParameter.call(this, entry, paramValue);
        } else {
          this.showWarning(i18nString(UIStrings.unrecognizedParameterS, { PH1: paramName }));
        }
      }
      result.push(entry);
      if (entry.name === "cfL4" && entry.desc) {
        new URLSearchParams(entry.desc).entries().forEach(([key, val]) => {
          result.push({ name: `${cloudflarePrefix}${key}`, desc: val });
        });
      }
      if (entry.name === "content-info" && entry.desc) {
        new URLSearchParams(entry.desc.replace(/,/g, "&")).entries().forEach(([key, val]) => {
          result.push({ name: `${cloudinaryPrefix}${key}`, desc: val });
        });
      }
      if (!consumeDelimiter(",")) {
        break;
      }
    }
    if (valueString.length) {
      this.showWarning(i18nString(UIStrings.extraneousTrailingCharacters));
    }
    return result;
  }
  static getParserForParameter(paramName) {
    switch (paramName) {
      case "dur": {
        let durParser2 = function(entry, paramValue) {
          entry.dur = 0;
          if (paramValue !== null) {
            const duration = parseFloat(paramValue);
            if (isNaN(duration)) {
              ServerTiming.showWarning(i18nString(UIStrings.unableToParseSValueS, { PH1: paramName, PH2: paramValue }));
              return;
            }
            entry.dur = duration;
          }
        };
        var durParser = durParser2;
        return durParser2;
      }
      case "desc": {
        let descParser2 = function(entry, paramValue) {
          entry.desc = paramValue || "";
        };
        var descParser = descParser2;
        return descParser2;
      }
      default: {
        return null;
      }
    }
  }
  static showWarning(msg) {
    Common.Console.Console.instance().warn(`ServerTiming: ${msg}`);
  }
}
//# sourceMappingURL=ServerTiming.js.map
