"use strict";
/**
 * @fileoverview Utils for CSP evaluator.
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
export function getSchemeFreeUrl(url) {
  url = url.replace(/^\w[+\w.-]*:\/\//i, "");
  url = url.replace(/^\/\//, "");
  return url;
}
export function getHostname(url) {
  const hostname = new URL(
    "https://" + getSchemeFreeUrl(url).replace(":*", "").replace("*", "wildcard_placeholder")
  ).hostname.replace("wildcard_placeholder", "*");
  const ipv6Regex = /^\[[\d:]+\]/;
  if (getSchemeFreeUrl(url).match(ipv6Regex) && !hostname.match(ipv6Regex)) {
    return "[" + hostname + "]";
  }
  return hostname;
}
function setScheme(u) {
  if (u.startsWith("//")) {
    return u.replace("//", "https://");
  }
  return u;
}
export function matchWildcardUrls(cspUrlString, listOfUrlStrings) {
  const cspUrl = new URL(setScheme(cspUrlString.replace(":*", "").replace("*", "wildcard_placeholder")));
  const listOfUrls = listOfUrlStrings.map((u) => new URL(setScheme(u)));
  const host = cspUrl.hostname.toLowerCase();
  const hostHasWildcard = host.startsWith("wildcard_placeholder.");
  const wildcardFreeHost = host.replace(/^\wildcard_placeholder/i, "");
  const path = cspUrl.pathname;
  const hasPath = path !== "/";
  for (const url of listOfUrls) {
    const domain = url.hostname;
    if (!domain.endsWith(wildcardFreeHost)) {
      continue;
    }
    if (!hostHasWildcard && host !== domain) {
      continue;
    }
    if (hasPath) {
      if (path.endsWith("/")) {
        if (!url.pathname.startsWith(path)) {
          continue;
        }
      } else {
        if (url.pathname !== path) {
          continue;
        }
      }
    }
    return url;
  }
  return null;
}
export function applyCheckFunktionToDirectives(parsedCsp, check) {
  const directiveNames = Object.keys(parsedCsp.directives);
  for (const directive of directiveNames) {
    const directiveValues = parsedCsp.directives[directive];
    if (directiveValues) {
      check(directive, directiveValues);
    }
  }
}
//# sourceMappingURL=utils.js.map
