"use strict";
import * as Common from "../../core/common/common.js";
export function parseSourcePositionsFromErrorStack(runtimeModel, stack) {
  if (!(/\n\s*at\s/.test(stack) || stack.startsWith("SyntaxError:"))) {
    return null;
  }
  const debuggerModel = runtimeModel.debuggerModel();
  const baseURL = runtimeModel.target().inspectedURL();
  const lines = stack.split("\n");
  const linkInfos = [];
  for (const line of lines) {
    const match = /^\s*at\s(async\s)?/.exec(line);
    if (!match) {
      if (linkInfos.length && linkInfos[linkInfos.length - 1].isCallFrame) {
        return null;
      }
      linkInfos.push({ line });
      continue;
    }
    const isCallFrame = true;
    let left = match[0].length;
    let right = line.length;
    let enclosedInBraces = false;
    if (line[right - 1] === ")") {
      right--;
      enclosedInBraces = true;
      left = line.lastIndexOf(" (", right);
      if (left < 0) {
        return null;
      }
      left += 2;
      const newRight = line.indexOf("), ", left);
      if (newRight > left) {
        right = newRight;
      }
    }
    const linkCandidate = line.substring(left, right);
    const splitResult = Common.ParsedURL.ParsedURL.splitLineAndColumn(linkCandidate);
    if (splitResult.url === "<anonymous>") {
      if (linkInfos.length && linkInfos[linkInfos.length - 1].isCallFrame && !linkInfos[linkInfos.length - 1].link) {
        linkInfos[linkInfos.length - 1].line += `
${line}`;
      } else {
        linkInfos.push({ line, isCallFrame });
      }
      continue;
    }
    let url = parseOrScriptMatch(debuggerModel, splitResult.url);
    if (!url && Common.ParsedURL.ParsedURL.isRelativeURL(splitResult.url)) {
      url = parseOrScriptMatch(debuggerModel, Common.ParsedURL.ParsedURL.completeURL(baseURL, splitResult.url));
    }
    if (!url) {
      return null;
    }
    linkInfos.push({
      line,
      isCallFrame,
      link: {
        url,
        prefix: line.substring(0, left),
        suffix: line.substring(right),
        enclosedInBraces,
        lineNumber: splitResult.lineNumber,
        columnNumber: splitResult.columnNumber
      }
    });
  }
  return linkInfos;
}
function parseOrScriptMatch(debuggerModel, url) {
  if (!url) {
    return null;
  }
  if (Common.ParsedURL.ParsedURL.isValidUrlString(url)) {
    return url;
  }
  if (debuggerModel.scriptsForSourceURL(url).length) {
    return url;
  }
  const fileUrl = new URL(url, "file://");
  if (debuggerModel.scriptsForSourceURL(fileUrl.href).length) {
    return fileUrl.href;
  }
  return null;
}
export function augmentErrorStackWithScriptIds(parsedFrames, protocolStackTrace) {
  for (const parsedFrame of parsedFrames) {
    const protocolFrame = protocolStackTrace.callFrames.find((frame) => framesMatch(parsedFrame, frame));
    if (protocolFrame && parsedFrame.link) {
      parsedFrame.link.scriptId = protocolFrame.scriptId;
    }
  }
}
function framesMatch(parsedFrame, protocolFrame) {
  if (!parsedFrame.link) {
    return false;
  }
  const { url, lineNumber, columnNumber } = parsedFrame.link;
  return url === protocolFrame.url && lineNumber === protocolFrame.lineNumber && columnNumber === protocolFrame.columnNumber;
}
//# sourceMappingURL=ErrorStackParser.js.map
