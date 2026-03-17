"use strict";
/**
 * @fileoverview CSP definitions and helper functions.
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
import { Finding, Severity, Type } from "./finding.js";
export class Csp {
  directives = {};
  /**
   * Clones a CSP object.
   * @return clone of parsedCsp.
   */
  clone() {
    const clone = new Csp();
    for (const [directive, directiveValues] of Object.entries(
      this.directives
    )) {
      if (directiveValues) {
        clone.directives[directive] = [...directiveValues];
      }
    }
    return clone;
  }
  /**
   * Converts this CSP back into a string.
   * @return CSP string.
   */
  convertToString() {
    let cspString = "";
    for (const [directive, directiveValues] of Object.entries(
      this.directives
    )) {
      cspString += directive;
      if (directiveValues !== void 0) {
        for (let value, i = 0; value = directiveValues[i]; i++) {
          cspString += " ";
          cspString += value;
        }
      }
      cspString += "; ";
    }
    return cspString;
  }
  /**
   * Returns CSP as it would be seen by a UA supporting a specific CSP version.
   * @param cspVersion CSP.
   * @param optFindings findings about ignored directive values will be added
   *     to this array, if passed. (e.g. CSP2 ignores 'unsafe-inline' in
   *     presence of a nonce or a hash)
   * @return The effective CSP.
   */
  getEffectiveCsp(cspVersion, optFindings) {
    const findings = optFindings || [];
    const effectiveCsp = this.clone();
    const directive = effectiveCsp.getEffectiveDirective("script-src" /* SCRIPT_SRC */);
    const values = this.directives[directive] || [];
    const effectiveCspValues = effectiveCsp.directives[directive];
    if (effectiveCspValues && (effectiveCsp.policyHasScriptNonces() || effectiveCsp.policyHasScriptHashes())) {
      if (cspVersion >= 2 /* CSP2 */) {
        if (values.includes("'unsafe-inline'" /* UNSAFE_INLINE */)) {
          arrayRemove(effectiveCspValues, "'unsafe-inline'" /* UNSAFE_INLINE */);
          findings.push(new Finding(
            Type.IGNORED,
            "unsafe-inline is ignored if a nonce or a hash is present. (CSP2 and above)",
            Severity.NONE,
            directive,
            "'unsafe-inline'" /* UNSAFE_INLINE */
          ));
        }
      } else {
        for (const value of values) {
          if (value.startsWith("'nonce-") || value.startsWith("'sha")) {
            arrayRemove(effectiveCspValues, value);
          }
        }
      }
    }
    if (effectiveCspValues && this.policyHasStrictDynamic()) {
      if (cspVersion >= 3 /* CSP3 */) {
        for (const value of values) {
          if (!value.startsWith("'") || value === "'self'" /* SELF */ || value === "'unsafe-inline'" /* UNSAFE_INLINE */) {
            arrayRemove(effectiveCspValues, value);
            findings.push(new Finding(
              Type.IGNORED,
              "Because of strict-dynamic this entry is ignored in CSP3 and above",
              Severity.NONE,
              directive,
              value
            ));
          }
        }
      } else {
        arrayRemove(effectiveCspValues, "'strict-dynamic'" /* STRICT_DYNAMIC */);
      }
    }
    if (cspVersion < 3 /* CSP3 */) {
      delete effectiveCsp.directives["report-to" /* REPORT_TO */];
      delete effectiveCsp.directives["worker-src" /* WORKER_SRC */];
      delete effectiveCsp.directives["manifest-src" /* MANIFEST_SRC */];
      delete effectiveCsp.directives["trusted-types" /* TRUSTED_TYPES */];
      delete effectiveCsp.directives["require-trusted-types-for" /* REQUIRE_TRUSTED_TYPES_FOR */];
    }
    return effectiveCsp;
  }
  /**
   * Returns default-src if directive is a fetch directive and is not present in
   * this CSP. Otherwise the provided directive is returned.
   * @param directive CSP.
   * @return The effective directive.
   */
  getEffectiveDirective(directive) {
    if (!(directive in this.directives) && FETCH_DIRECTIVES.includes(directive)) {
      return "default-src" /* DEFAULT_SRC */;
    }
    return directive;
  }
  /**
   * Returns the passed directives if present in this CSP or default-src
   * otherwise.
   * @param directives CSP.
   * @return The effective directives.
   */
  getEffectiveDirectives(directives) {
    const effectiveDirectives = new Set(directives.map((val) => this.getEffectiveDirective(val)));
    return [...effectiveDirectives];
  }
  /**
   * Checks if this CSP is using nonces for scripts.
   * @return true, if this CSP is using script nonces.
   */
  policyHasScriptNonces() {
    const directiveName = this.getEffectiveDirective("script-src" /* SCRIPT_SRC */);
    const values = this.directives[directiveName] || [];
    return values.some((val) => isNonce(val));
  }
  /**
   * Checks if this CSP is using hashes for scripts.
   * @return true, if this CSP is using script hashes.
   */
  policyHasScriptHashes() {
    const directiveName = this.getEffectiveDirective("script-src" /* SCRIPT_SRC */);
    const values = this.directives[directiveName] || [];
    return values.some((val) => isHash(val));
  }
  /**
   * Checks if this CSP is using strict-dynamic.
   * @return true, if this CSP is using CSP nonces.
   */
  policyHasStrictDynamic() {
    const directiveName = this.getEffectiveDirective("script-src" /* SCRIPT_SRC */);
    const values = this.directives[directiveName] || [];
    return values.includes("'strict-dynamic'" /* STRICT_DYNAMIC */);
  }
}
export var Keyword = /* @__PURE__ */ ((Keyword2) => {
  Keyword2["SELF"] = "'self'";
  Keyword2["NONE"] = "'none'";
  Keyword2["UNSAFE_INLINE"] = "'unsafe-inline'";
  Keyword2["UNSAFE_EVAL"] = "'unsafe-eval'";
  Keyword2["WASM_EVAL"] = "'wasm-eval'";
  Keyword2["WASM_UNSAFE_EVAL"] = "'wasm-unsafe-eval'";
  Keyword2["STRICT_DYNAMIC"] = "'strict-dynamic'";
  Keyword2["UNSAFE_HASHED_ATTRIBUTES"] = "'unsafe-hashed-attributes'";
  Keyword2["UNSAFE_HASHES"] = "'unsafe-hashes'";
  Keyword2["REPORT_SAMPLE"] = "'report-sample'";
  Keyword2["BLOCK"] = "'block'";
  Keyword2["ALLOW"] = "'allow'";
  return Keyword2;
})(Keyword || {});
export var TrustedTypesSink = /* @__PURE__ */ ((TrustedTypesSink2) => {
  TrustedTypesSink2["SCRIPT"] = "'script'";
  return TrustedTypesSink2;
})(TrustedTypesSink || {});
export var Directive = /* @__PURE__ */ ((Directive2) => {
  Directive2["CHILD_SRC"] = "child-src";
  Directive2["CONNECT_SRC"] = "connect-src";
  Directive2["DEFAULT_SRC"] = "default-src";
  Directive2["FONT_SRC"] = "font-src";
  Directive2["FRAME_SRC"] = "frame-src";
  Directive2["IMG_SRC"] = "img-src";
  Directive2["MEDIA_SRC"] = "media-src";
  Directive2["OBJECT_SRC"] = "object-src";
  Directive2["SCRIPT_SRC"] = "script-src";
  Directive2["SCRIPT_SRC_ATTR"] = "script-src-attr";
  Directive2["SCRIPT_SRC_ELEM"] = "script-src-elem";
  Directive2["STYLE_SRC"] = "style-src";
  Directive2["STYLE_SRC_ATTR"] = "style-src-attr";
  Directive2["STYLE_SRC_ELEM"] = "style-src-elem";
  Directive2["PREFETCH_SRC"] = "prefetch-src";
  Directive2["MANIFEST_SRC"] = "manifest-src";
  Directive2["WORKER_SRC"] = "worker-src";
  Directive2["BASE_URI"] = "base-uri";
  Directive2["PLUGIN_TYPES"] = "plugin-types";
  Directive2["SANDBOX"] = "sandbox";
  Directive2["DISOWN_OPENER"] = "disown-opener";
  Directive2["FORM_ACTION"] = "form-action";
  Directive2["FRAME_ANCESTORS"] = "frame-ancestors";
  Directive2["NAVIGATE_TO"] = "navigate-to";
  Directive2["REPORT_TO"] = "report-to";
  Directive2["REPORT_URI"] = "report-uri";
  Directive2["BLOCK_ALL_MIXED_CONTENT"] = "block-all-mixed-content";
  Directive2["UPGRADE_INSECURE_REQUESTS"] = "upgrade-insecure-requests";
  Directive2["REFLECTED_XSS"] = "reflected-xss";
  Directive2["REFERRER"] = "referrer";
  Directive2["REQUIRE_SRI_FOR"] = "require-sri-for";
  Directive2["TRUSTED_TYPES"] = "trusted-types";
  Directive2["REQUIRE_TRUSTED_TYPES_FOR"] = "require-trusted-types-for";
  Directive2["WEBRTC"] = "webrtc";
  return Directive2;
})(Directive || {});
export const FETCH_DIRECTIVES = [
  "child-src" /* CHILD_SRC */,
  "connect-src" /* CONNECT_SRC */,
  "default-src" /* DEFAULT_SRC */,
  "font-src" /* FONT_SRC */,
  "frame-src" /* FRAME_SRC */,
  "img-src" /* IMG_SRC */,
  "manifest-src" /* MANIFEST_SRC */,
  "media-src" /* MEDIA_SRC */,
  "object-src" /* OBJECT_SRC */,
  "script-src" /* SCRIPT_SRC */,
  "script-src-attr" /* SCRIPT_SRC_ATTR */,
  "script-src-elem" /* SCRIPT_SRC_ELEM */,
  "style-src" /* STYLE_SRC */,
  "style-src-attr" /* STYLE_SRC_ATTR */,
  "style-src-elem" /* STYLE_SRC_ELEM */,
  "worker-src" /* WORKER_SRC */
];
export var Version = /* @__PURE__ */ ((Version2) => {
  Version2[Version2["CSP1"] = 1] = "CSP1";
  Version2[Version2["CSP2"] = 2] = "CSP2";
  Version2[Version2["CSP3"] = 3] = "CSP3";
  return Version2;
})(Version || {});
export function isDirective(directive) {
  return Object.values(Directive).includes(directive);
}
export function isKeyword(keyword) {
  return Object.values(Keyword).includes(keyword);
}
export function isUrlScheme(urlScheme) {
  const pattern = new RegExp("^[a-zA-Z][+a-zA-Z0-9.-]*:$");
  return pattern.test(urlScheme);
}
export const STRICT_NONCE_PATTERN = new RegExp("^'nonce-[a-zA-Z0-9+/_-]+[=]{0,2}'$");
export const NONCE_PATTERN = new RegExp("^'nonce-(.+)'$");
export function isNonce(nonce, strictCheck) {
  const pattern = strictCheck ? STRICT_NONCE_PATTERN : NONCE_PATTERN;
  return pattern.test(nonce);
}
export const STRICT_HASH_PATTERN = new RegExp("^'(sha256|sha384|sha512)-[a-zA-Z0-9+/]+[=]{0,2}'$");
export const HASH_PATTERN = new RegExp("^'(sha256|sha384|sha512)-(.+)'$");
export function isHash(hash, strictCheck) {
  const pattern = strictCheck ? STRICT_HASH_PATTERN : HASH_PATTERN;
  return pattern.test(hash);
}
export class CspError extends Error {
  /**
   * @param message An optional error message.
   */
  constructor(message) {
    super(message);
  }
}
function arrayRemove(arr, item) {
  if (arr.includes(item)) {
    const idx = arr.findIndex((elem) => item === elem);
    arr.splice(idx, 1);
  }
}
//# sourceMappingURL=csp.js.map
