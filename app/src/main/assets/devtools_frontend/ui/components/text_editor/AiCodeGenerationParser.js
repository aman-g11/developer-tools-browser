"use strict";
import * as CodeMirror from "../../../third_party/codemirror.next/codemirror.next.js";
const LINE_COMMENT_PATTERN = /^(?:\/\/|#)\s*/gm;
const BLOCK_COMMENT_START_PATTERN = /^\/\*+\s*/;
const BLOCK_COMMENT_END_PATTERN = /\s*\*+\/$/;
const BLOCK_COMMENT_LINE_PREFIX_PATTERN = /^\s*\*\s?/;
function findLastNonWhitespacePos(state, cursorPosition) {
  const line = state.doc.lineAt(cursorPosition);
  const textBefore = line.text.substring(0, cursorPosition - line.from);
  const effectiveEnd = line.from + textBefore.trimEnd().length;
  return effectiveEnd;
}
function resolveCommentNode(state, cursorPosition) {
  const tree = CodeMirror.syntaxTree(state);
  const lookupPos = findLastNonWhitespacePos(state, cursorPosition);
  const node = tree.resolveInner(lookupPos, -1);
  const nodeType = node.type.name;
  if (nodeType.includes("Comment")) {
    if (!nodeType.includes("BlockComment")) {
      return node;
    }
    let hasInternalError = false;
    tree.iterate({
      from: node.from,
      to: node.to,
      enter: (n) => {
        if (n.type.isError) {
          hasInternalError = true;
          return false;
        }
        return true;
      }
    });
    return hasInternalError ? void 0 : node;
  }
  return;
}
function extractBlockCommentText(rawText) {
  if (!rawText.match(BLOCK_COMMENT_START_PATTERN)) {
    return;
  }
  let cleaned = rawText.replace(BLOCK_COMMENT_START_PATTERN, "");
  if (!cleaned.match(BLOCK_COMMENT_END_PATTERN)) {
    return;
  }
  cleaned = cleaned.replace(BLOCK_COMMENT_END_PATTERN, "");
  cleaned = cleaned.split("\n").map((line) => line.replace(BLOCK_COMMENT_LINE_PREFIX_PATTERN, "")).join("\n").trim();
  return cleaned;
}
function extractLineComment(node, state) {
  let firstNode = node;
  let lastNode = node;
  let prev = node.prevSibling;
  while (prev?.type.name.includes("LineComment")) {
    firstNode = prev;
    prev = prev.prevSibling;
  }
  let next = node.nextSibling;
  while (next?.type.name.includes("LineComment")) {
    lastNode = next;
    next = next.nextSibling;
  }
  const fullRawText = state.doc.sliceString(firstNode.from, lastNode.to);
  const concatenatedText = fullRawText.replaceAll(LINE_COMMENT_PATTERN, "").replace(/\n\s*\n/g, "\n").trim();
  return concatenatedText ? { text: concatenatedText, to: lastNode.to } : void 0;
}
export class AiCodeGenerationParser {
  static extractCommentNodeInfo(state, cursorPosition) {
    const node = resolveCommentNode(state, cursorPosition);
    if (!node) {
      return;
    }
    const nodeType = node.type.name;
    const rawText = state.doc.sliceString(node.from, node.to);
    let text = "";
    if (nodeType.includes("LineComment")) {
      return extractLineComment(node, state);
    }
    if (nodeType.includes("BlockComment")) {
      text = extractBlockCommentText(rawText) ?? "";
    } else {
      text = rawText;
    }
    if (!Boolean(text)) {
      return;
    }
    return { text, to: node.to };
  }
}
//# sourceMappingURL=AiCodeGenerationParser.js.map
