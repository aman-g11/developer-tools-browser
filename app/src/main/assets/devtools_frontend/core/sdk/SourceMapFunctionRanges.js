"use strict";
import { TokenIterator } from "./SourceMap.js";
export function buildOriginalScopes(ranges) {
  validateStartBeforeEnd(ranges);
  ranges.sort((a, b) => comparePositions(a.start, b.start) || comparePositions(b.end, a.end));
  const root = {
    start: { line: 0, column: 0 },
    end: { line: Number.POSITIVE_INFINITY, column: Number.POSITIVE_INFINITY },
    kind: "Global",
    isStackFrame: false,
    children: [],
    variables: []
  };
  const stack = [root];
  for (const range of ranges) {
    let stackTop = stack.at(-1);
    while (true) {
      if (comparePositions(stackTop.end, range.start) <= 0) {
        stack.pop();
        stackTop = stack.at(-1);
      } else {
        break;
      }
    }
    if (comparePositions(range.start, stackTop.end) < 0 && comparePositions(stackTop.end, range.end) < 0) {
      throw new Error(`Range ${JSON.stringify(range)} and ${JSON.stringify(stackTop)} partially overlap.`);
    }
    const scope = createScopeFrom(range);
    stackTop.children.push(scope);
    stack.push(scope);
  }
  const lastChild = root.children.at(-1);
  if (lastChild) {
    root.end = lastChild.end;
  }
  return root;
}
function validateStartBeforeEnd(ranges) {
  for (const range of ranges) {
    if (comparePositions(range.start, range.end) >= 0) {
      throw new Error(`Invalid range. End before start: ${JSON.stringify(range)}`);
    }
  }
}
function createScopeFrom(range) {
  return {
    ...range,
    kind: "Function",
    isStackFrame: true,
    children: [],
    variables: []
  };
}
export function decodePastaRanges(encodedRanges, names) {
  const result = [];
  let nameIndex = 0;
  let startLineNumber = 0;
  let startColumnNumber = 0;
  let endLineNumber = 0;
  let endColumnNumber = 0;
  const tokenIter = new TokenIterator(encodedRanges);
  let atStart = true;
  while (tokenIter.hasNext()) {
    if (atStart) {
      atStart = false;
    } else if (tokenIter.peek() === ",") {
      tokenIter.next();
    } else {
      break;
    }
    nameIndex += tokenIter.nextVLQ();
    startLineNumber = endLineNumber + tokenIter.nextVLQ();
    startColumnNumber += tokenIter.nextVLQ();
    endLineNumber = startLineNumber + tokenIter.nextVLQ();
    endColumnNumber += tokenIter.nextVLQ();
    const name = names[nameIndex];
    if (name === void 0) {
      continue;
    }
    result.push({
      start: { line: startLineNumber, column: startColumnNumber },
      end: { line: endLineNumber, column: endColumnNumber },
      name
    });
  }
  return result;
}
function comparePositions(a, b) {
  return a.line - b.line || a.column - b.column;
}
//# sourceMappingURL=SourceMapFunctionRanges.js.map
