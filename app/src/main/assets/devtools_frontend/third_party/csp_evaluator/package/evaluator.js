"use strict";
/**
 * @author lwe@google.com (Lukas Weichselbaum)
 *
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
 */
import * as parserChecks from "./checks/parser_checks.js";
import * as securityChecks from "./checks/security_checks.js";
import * as strictcspChecks from "./checks/strictcsp_checks.js";
import * as csp from "./csp.js";
export class CspEvaluator {
  version;
  csp;
  /**
   * List of findings reported by checks.
   *
   */
  findings = [];
  /**
   * @param parsedCsp A parsed Content Security Policy.
   * @param cspVersion CSP version to apply checks for.
   */
  constructor(parsedCsp, cspVersion) {
    this.version = cspVersion || csp.Version.CSP3;
    this.csp = parsedCsp;
  }
  /**
   * Evaluates a parsed CSP against a set of checks
   * @param parsedCspChecks list of checks to run on the parsed CSP (i.e.
   *     checks like backward compatibility checks, which are independent of the
   *     actual CSP version).
   * @param effectiveCspChecks list of checks to run on the effective CSP.
   * @return List of Findings.
   * @export
   */
  evaluate(parsedCspChecks, effectiveCspChecks) {
    this.findings = [];
    const checks = effectiveCspChecks || DEFAULT_CHECKS;
    const effectiveCsp = this.csp.getEffectiveCsp(this.version, this.findings);
    if (parsedCspChecks) {
      for (const check of parsedCspChecks) {
        this.findings = this.findings.concat(check(this.csp));
      }
    }
    for (const check of checks) {
      this.findings = this.findings.concat(check(effectiveCsp));
    }
    return this.findings;
  }
}
export const DEFAULT_CHECKS = [
  securityChecks.checkScriptUnsafeInline,
  securityChecks.checkScriptUnsafeEval,
  securityChecks.checkPlainUrlSchemes,
  securityChecks.checkWildcards,
  securityChecks.checkMissingDirectives,
  securityChecks.checkScriptAllowlistBypass,
  securityChecks.checkFlashObjectAllowlistBypass,
  securityChecks.checkIpSource,
  securityChecks.checkNonceLength,
  securityChecks.checkSrcHttp,
  securityChecks.checkDeprecatedDirective,
  parserChecks.checkUnknownDirective,
  parserChecks.checkMissingSemicolon,
  parserChecks.checkInvalidKeyword
];
export const STRICTCSP_CHECKS = [
  strictcspChecks.checkStrictDynamic,
  strictcspChecks.checkStrictDynamicNotStandalone,
  strictcspChecks.checkUnsafeInlineFallback,
  strictcspChecks.checkAllowlistFallback,
  strictcspChecks.checkRequiresTrustedTypesForScripts
];
//# sourceMappingURL=evaluator.js.map
