"use strict";
import * as Annotations from "../../annotations/annotations.js";
import * as Logs from "../../logs/logs.js";
import * as NetworkTimeCalculator from "../../network_time_calculator/network_time_calculator.js";
import * as TextUtils from "../../text_utils/text_utils.js";
import { seconds } from "./UnitFormatters.js";
const MAX_HEADERS_SIZE = 1e3;
const MAX_BODY_SIZE = 1e4;
function sanitizeHeaders(headers) {
  return headers.map((header) => {
    if (NetworkRequestFormatter.allowHeader(header.name)) {
      return header;
    }
    return { name: header.name, value: "<redacted>" };
  });
}
export class NetworkRequestFormatter {
  #calculator;
  #request;
  static allowHeader(headerName) {
    return allowedHeaders.has(headerName.toLowerCase().trim());
  }
  static formatHeaders(title, headers, addListPrefixToEachLine) {
    return formatLines(
      title,
      sanitizeHeaders(headers).map((header) => {
        const prefix = addListPrefixToEachLine ? "- " : "";
        return prefix + header.name + ": " + header.value + "\n";
      }),
      MAX_HEADERS_SIZE
    );
  }
  static async formatBody(title, request, maxBodySize) {
    const data = await request.requestContentData();
    if (TextUtils.ContentData.ContentData.isError(data)) {
      return "";
    }
    if (data.isEmpty) {
      return `${title}
<empty response>`;
    }
    if (data.isTextContent) {
      const dataAsText = data.text;
      if (dataAsText.length > maxBodySize) {
        return `${title}
${dataAsText.substring(0, maxBodySize) + "... <truncated>"}`;
      }
      return `${title}
${dataAsText}`;
    }
    return `${title}
<binary data>`;
  }
  static formatInitiatorUrl(initiatorUrl, allowedOrigin) {
    const initiatorOrigin = new URL(initiatorUrl).origin;
    if (initiatorOrigin === allowedOrigin) {
      return initiatorUrl;
    }
    return "<redacted cross-origin initiator URL>";
  }
  static formatStatus(status) {
    let responseStatus = "";
    if (status.statusCode) {
      responseStatus = `Response status: ${status.statusCode} ${status.statusText}
`;
    }
    const flags = [];
    flags.push(status.finished ? "finished" : "pending");
    if (status.failed) {
      flags.push("failed");
    }
    if (status.canceled) {
      flags.push("canceled");
    }
    if (status.preserved) {
      flags.push("preserved");
    }
    const requestStatus = flags.length > 0 ? `Network request status: ${flags.join(", ")}
` : "";
    return `${responseStatus}${requestStatus}`;
  }
  static formatFailureReasons(reasons) {
    const lines = [];
    if (reasons.blockedReason) {
      lines.push(`Blocked reason: ${reasons.blockedReason}`);
    }
    if (reasons.corsErrorStatus) {
      lines.push(`CORS error: ${reasons.corsErrorStatus.corsError} ${reasons.corsErrorStatus.failedParameter}`);
    }
    if (reasons.localizedFailDescription) {
      lines.push(`Fail description: ${reasons.localizedFailDescription}`);
    }
    return lines.length > 0 ? `${lines.join("\n")}
` : "";
  }
  constructor(request, calculator) {
    this.#request = request;
    this.#calculator = calculator;
  }
  formatRequestHeaders() {
    return NetworkRequestFormatter.formatHeaders("Request headers:", this.#request.requestHeaders());
  }
  formatResponseHeaders() {
    return NetworkRequestFormatter.formatHeaders("Response headers:", this.#request.responseHeaders);
  }
  async formatResponseBody() {
    return await NetworkRequestFormatter.formatBody("Response body:", this.#request, MAX_BODY_SIZE);
  }
  /**
   * Note: nothing here should include information from origins other than
   * the request's origin.
   */
  async formatNetworkRequest() {
    let responseBody = await this.formatResponseBody();
    if (responseBody) {
      responseBody = `

${responseBody}`;
    }
    return `Request: ${this.#request.url()}
${Annotations.AnnotationRepository.annotationsEnabled() ? `
Request ID: ${this.#request.requestId()}
` : ""}
${this.formatRequestHeaders()}

${this.formatResponseHeaders()}${responseBody}

${this.formatStatus()}${this.formatFailureReasons()}
Request timing:
${this.formatNetworkRequestTiming()}

Request initiator chain:
${this.formatRequestInitiatorChain()}`;
  }
  formatStatus() {
    return NetworkRequestFormatter.formatStatus({
      statusCode: this.#request.statusCode,
      statusText: this.#request.statusText,
      failed: this.#request.failed,
      canceled: this.#request.canceled,
      preserved: this.#request.preserved,
      finished: this.#request.finished
    });
  }
  formatFailureReasons() {
    return NetworkRequestFormatter.formatFailureReasons({
      blockedReason: this.#request.blockedReason(),
      corsErrorStatus: this.#request.corsErrorStatus(),
      localizedFailDescription: this.#request.localizedFailDescription
    });
  }
  /**
   * Note: nothing here should include information from origins other than
   * the request's origin.
   */
  formatRequestInitiatorChain() {
    const allowedOrigin = new URL(this.#request.url()).origin;
    let initiatorChain = "";
    let lineStart = "- URL: ";
    const graph = Logs.NetworkLog.NetworkLog.instance().initiatorGraphForRequest(this.#request);
    for (const initiator of Array.from(graph.initiators).reverse()) {
      initiatorChain = initiatorChain + lineStart + NetworkRequestFormatter.formatInitiatorUrl(initiator.url(), allowedOrigin) + "\n";
      lineStart = "	" + lineStart;
      if (initiator === this.#request) {
        initiatorChain = this.#formatRequestInitiated(graph.initiated, this.#request, initiatorChain, lineStart, allowedOrigin);
      }
    }
    return initiatorChain.trim();
  }
  formatNetworkRequestTiming() {
    const results = NetworkTimeCalculator.calculateRequestTimeRanges(this.#request, this.#calculator.minimumBoundary());
    const getDuration = (name) => {
      const result = results.find((r) => r.name === name);
      if (!result) {
        return;
      }
      return seconds(result.end - result.start);
    };
    const labels = [
      {
        label: "Queued at (timestamp)",
        value: seconds(this.#request.issueTime() - this.#calculator.zeroTime())
      },
      {
        label: "Started at (timestamp)",
        value: seconds(this.#request.startTime - this.#calculator.zeroTime())
      },
      {
        label: "Queueing (duration)",
        value: getDuration("queueing")
      },
      {
        label: "Connection start (stalled) (duration)",
        value: getDuration("blocking")
      },
      {
        label: "Request sent (duration)",
        value: getDuration("sending")
      },
      {
        label: "Waiting for server response (duration)",
        value: getDuration("waiting")
      },
      {
        label: "Content download (duration)",
        value: getDuration("receiving")
      },
      {
        label: "Duration (duration)",
        value: getDuration("total")
      }
    ];
    return labels.filter((label) => !!label.value).map((label) => `${label.label}: ${label.value}`).join("\n");
  }
  #formatRequestInitiated(initiated, parentRequest, initiatorChain, lineStart, allowedOrigin) {
    const visited = /* @__PURE__ */ new Set();
    visited.add(this.#request);
    for (const [keyRequest, initiatedRequest] of initiated.entries()) {
      if (initiatedRequest === parentRequest) {
        if (!visited.has(keyRequest)) {
          visited.add(keyRequest);
          initiatorChain = initiatorChain + lineStart + NetworkRequestFormatter.formatInitiatorUrl(keyRequest.url(), allowedOrigin) + "\n";
          initiatorChain = this.#formatRequestInitiated(initiated, keyRequest, initiatorChain, "	" + lineStart, allowedOrigin);
        }
      }
    }
    return initiatorChain;
  }
}
const allowedHeaders = /* @__PURE__ */ new Set([
  ":authority",
  ":method",
  ":path",
  ":scheme",
  "a-im",
  "accept-ch",
  "accept-charset",
  "accept-datetime",
  "accept-encoding",
  "accept-language",
  "accept-patch",
  "accept-ranges",
  "accept",
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
  "access-control-allow-origin",
  "access-control-expose-headers",
  "access-control-max-age",
  "access-control-request-headers",
  "access-control-request-method",
  "age",
  "allow",
  "alt-svc",
  "cache-control",
  "connection",
  "content-disposition",
  "content-encoding",
  "content-language",
  "content-location",
  "content-range",
  "content-security-policy",
  "content-type",
  "correlation-id",
  "date",
  "delta-base",
  "dnt",
  "expect-ct",
  "expect",
  "expires",
  "forwarded",
  "front-end-https",
  "host",
  "http2-settings",
  "if-modified-since",
  "if-range",
  "if-unmodified-source",
  "im",
  "last-modified",
  "link",
  "location",
  "max-forwards",
  "nel",
  "origin",
  "permissions-policy",
  "pragma",
  "preference-applied",
  "proxy-connection",
  "public-key-pins",
  "range",
  "referer",
  "refresh",
  "report-to",
  "retry-after",
  "save-data",
  "sec-gpc",
  "server",
  "status",
  "strict-transport-security",
  "te",
  "timing-allow-origin",
  "tk",
  "trailer",
  "transfer-encoding",
  "upgrade-insecure-requests",
  "upgrade",
  "user-agent",
  "vary",
  "via",
  "warning",
  "www-authenticate",
  "x-att-deviceid",
  "x-content-duration",
  "x-content-security-policy",
  "x-content-type-options",
  "x-correlation-id",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-frame-options",
  "x-http-method-override",
  "x-powered-by",
  "x-redirected-by",
  "x-request-id",
  "x-requested-with",
  "x-ua-compatible",
  "x-wap-profile",
  "x-webkit-csp",
  "x-xss-protection"
]);
function formatLines(title, lines, maxLength) {
  let result = "";
  for (const line of lines) {
    if (result.length + line.length > maxLength) {
      break;
    }
    result += line;
  }
  result = result.trim();
  return result && title ? title + "\n" + result : result;
}
//# sourceMappingURL=NetworkRequestFormatter.js.map
