"use strict";
/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author lwe@google.com (Lukas Weichselbaum)
 */
export class Finding {
  /**
   * @param type Type of the finding.
   * @param description Description of the finding.
   * @param severity Severity of the finding.
   * @param directive The CSP directive in which the finding occurred.
   * @param value The directive value, if exists.
   */
  constructor(type, description, severity, directive, value) {
    this.type = type;
    this.description = description;
    this.severity = severity;
    this.directive = directive;
    this.value = value;
  }
  /**
   * Returns the highest severity of a list of findings.
   * @param findings List of findings.
   * @return highest severity of a list of findings.
   */
  static getHighestSeverity(findings) {
    if (findings.length === 0) {
      return 100 /* NONE */;
    }
    const severities = findings.map((finding) => finding.severity);
    const min = (prev, cur) => prev < cur ? prev : cur;
    return severities.reduce(min, 100 /* NONE */);
  }
  equals(obj) {
    if (!(obj instanceof Finding)) {
      return false;
    }
    return obj.type === this.type && obj.description === this.description && obj.severity === this.severity && obj.directive === this.directive && obj.value === this.value;
  }
}
export var Severity = /* @__PURE__ */ ((Severity2) => {
  Severity2[Severity2["HIGH"] = 10] = "HIGH";
  Severity2[Severity2["SYNTAX"] = 20] = "SYNTAX";
  Severity2[Severity2["MEDIUM"] = 30] = "MEDIUM";
  Severity2[Severity2["HIGH_MAYBE"] = 40] = "HIGH_MAYBE";
  Severity2[Severity2["STRICT_CSP"] = 45] = "STRICT_CSP";
  Severity2[Severity2["MEDIUM_MAYBE"] = 50] = "MEDIUM_MAYBE";
  Severity2[Severity2["INFO"] = 60] = "INFO";
  Severity2[Severity2["NONE"] = 100] = "NONE";
  return Severity2;
})(Severity || {});
export var Type = /* @__PURE__ */ ((Type2) => {
  Type2[Type2["MISSING_SEMICOLON"] = 100] = "MISSING_SEMICOLON";
  Type2[Type2["UNKNOWN_DIRECTIVE"] = 101] = "UNKNOWN_DIRECTIVE";
  Type2[Type2["INVALID_KEYWORD"] = 102] = "INVALID_KEYWORD";
  Type2[Type2["NONCE_CHARSET"] = 106] = "NONCE_CHARSET";
  Type2[Type2["MISSING_DIRECTIVES"] = 300] = "MISSING_DIRECTIVES";
  Type2[Type2["SCRIPT_UNSAFE_INLINE"] = 301] = "SCRIPT_UNSAFE_INLINE";
  Type2[Type2["SCRIPT_UNSAFE_EVAL"] = 302] = "SCRIPT_UNSAFE_EVAL";
  Type2[Type2["PLAIN_URL_SCHEMES"] = 303] = "PLAIN_URL_SCHEMES";
  Type2[Type2["PLAIN_WILDCARD"] = 304] = "PLAIN_WILDCARD";
  Type2[Type2["SCRIPT_ALLOWLIST_BYPASS"] = 305] = "SCRIPT_ALLOWLIST_BYPASS";
  Type2[Type2["OBJECT_ALLOWLIST_BYPASS"] = 306] = "OBJECT_ALLOWLIST_BYPASS";
  Type2[Type2["NONCE_LENGTH"] = 307] = "NONCE_LENGTH";
  Type2[Type2["IP_SOURCE"] = 308] = "IP_SOURCE";
  Type2[Type2["DEPRECATED_DIRECTIVE"] = 309] = "DEPRECATED_DIRECTIVE";
  Type2[Type2["SRC_HTTP"] = 310] = "SRC_HTTP";
  Type2[Type2["STRICT_DYNAMIC"] = 400] = "STRICT_DYNAMIC";
  Type2[Type2["STRICT_DYNAMIC_NOT_STANDALONE"] = 401] = "STRICT_DYNAMIC_NOT_STANDALONE";
  Type2[Type2["NONCE_HASH"] = 402] = "NONCE_HASH";
  Type2[Type2["UNSAFE_INLINE_FALLBACK"] = 403] = "UNSAFE_INLINE_FALLBACK";
  Type2[Type2["ALLOWLIST_FALLBACK"] = 404] = "ALLOWLIST_FALLBACK";
  Type2[Type2["IGNORED"] = 405] = "IGNORED";
  Type2[Type2["REQUIRE_TRUSTED_TYPES_FOR_SCRIPTS"] = 500] = "REQUIRE_TRUSTED_TYPES_FOR_SCRIPTS";
  Type2[Type2["REPORTING_DESTINATION_MISSING"] = 600] = "REPORTING_DESTINATION_MISSING";
  Type2[Type2["REPORT_TO_ONLY"] = 601] = "REPORT_TO_ONLY";
  return Type2;
})(Type || {});
//# sourceMappingURL=finding.js.map
