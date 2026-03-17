"use strict";
import * as CodeMirror from "../../third_party/codemirror.next/codemirror.next.js";
export function createCssTokenizer() {
  async function tokenize(line, callback) {
    const streamParser = await CodeMirror.cssStreamParser();
    const stream = new CodeMirror.StringStream(line, 4, 2);
    const state = streamParser.startState(2);
    let lastPos = stream.pos;
    while (!stream.eol()) {
      stream.start = lastPos;
      let tokenType = streamParser.token(stream, state);
      if (tokenType === "error" && state.state === "maybeprop") {
        tokenType = "property";
      }
      const segment = stream.current();
      callback(segment, tokenType);
      lastPos = stream.pos;
    }
  }
  return tokenize;
}
//# sourceMappingURL=CodeMirrorUtils.js.map
