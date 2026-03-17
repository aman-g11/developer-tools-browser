"use strict";
import * as CodeMirror from "../../../third_party/codemirror.next/codemirror.next.js";
export var Direction = /* @__PURE__ */ ((Direction2) => {
  Direction2[Direction2["FORWARD"] = 1] = "FORWARD";
  Direction2[Direction2["BACKWARD"] = -1] = "BACKWARD";
  return Direction2;
})(Direction || {});
export class TextEditorHistory {
  #editor;
  #history;
  constructor(editor, history) {
    this.#editor = editor;
    this.#history = history;
  }
  /**
   * Replaces the text editor content with entries from the history. Does nothing
   * if the cursor is not positioned correctly (unless `force` is `true`).
   */
  moveHistory(dir, force = false) {
    const { editor } = this.#editor, { main } = editor.state.selection;
    const isBackward = dir === -1 /* BACKWARD */;
    if (!force) {
      if (!main.empty) {
        return false;
      }
      const cursorCoords = editor.coordsAtPos(main.head);
      const endCoords = editor.coordsAtPos(isBackward ? 0 : editor.state.doc.length);
      if (cursorCoords && endCoords && (isBackward ? cursorCoords.top > endCoords.top + 5 : cursorCoords.bottom < endCoords.bottom - 5)) {
        return false;
      }
    }
    const text = editor.state.doc.toString();
    const history = this.#history;
    const newText = isBackward ? history.previous(text) : history.next(text);
    if (newText === void 0) {
      return false;
    }
    const cursorPos = newText.length;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: newText },
      selection: CodeMirror.EditorSelection.cursor(cursorPos),
      scrollIntoView: true
    });
    if (isBackward) {
      const firstLineBreak = newText.search(/\n|$/);
      editor.dispatch({
        selection: CodeMirror.EditorSelection.cursor(firstLineBreak)
      });
    }
    return true;
  }
  historyCompletions(context) {
    const { explicit, pos, state } = context;
    const text = state.doc.toString();
    const caretIsAtEndOfPrompt = pos === text.length;
    if (!caretIsAtEndOfPrompt || !text.length && !explicit) {
      return null;
    }
    const matchingEntries = this.#history.matchingEntries(text);
    if (!matchingEntries.size) {
      return null;
    }
    const options = [...matchingEntries].map((label) => ({ label, type: "secondary", boost: -1e5 }));
    return { from: 0, to: text.length, options };
  }
}
//# sourceMappingURL=TextEditorHistory.js.map
