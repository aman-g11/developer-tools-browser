"use strict";
import * as CodeMirror from "../../../third_party/codemirror.next/codemirror.next.js";
export const setHighlightedPosition = CodeMirror.StateEffect.define();
export const clearHighlightedPosition = CodeMirror.StateEffect.define();
export function positionHighlighter(executionLineClassName, executionTokenClassName) {
  const executionLine = CodeMirror.Decoration.line({ attributes: { class: executionLineClassName } });
  const executionToken = CodeMirror.Decoration.mark({ attributes: { class: executionTokenClassName } });
  const positionHighlightedState = CodeMirror.StateField.define({
    create() {
      return null;
    },
    update(pos, tr) {
      if (pos) {
        pos = tr.changes.mapPos(pos, -1, CodeMirror.MapMode.TrackDel);
      }
      for (const effect of tr.effects) {
        if (effect.is(clearHighlightedPosition)) {
          pos = null;
        } else if (effect.is(setHighlightedPosition)) {
          pos = Math.max(0, Math.min(effect.value, tr.newDoc.length - 1));
        }
      }
      return pos;
    }
  });
  function getHighlightedPosition(state) {
    return state.field(positionHighlightedState);
  }
  class PositionHighlighter {
    tree;
    decorations;
    constructor({ state }) {
      this.tree = CodeMirror.syntaxTree(state);
      this.decorations = this.#computeDecorations(state, getHighlightedPosition(state));
    }
    update(update) {
      const tree = CodeMirror.syntaxTree(update.state);
      const position = getHighlightedPosition(update.state);
      const positionChanged = position !== getHighlightedPosition(update.startState);
      if (tree.length !== this.tree.length || positionChanged) {
        this.tree = tree;
        this.decorations = this.#computeDecorations(update.state, position);
      } else {
        this.decorations = this.decorations.map(update.changes);
      }
    }
    #computeDecorations(state, position) {
      const builder = new CodeMirror.RangeSetBuilder();
      if (position !== null) {
        const { doc } = state;
        const line = doc.lineAt(position);
        builder.add(line.from, line.from, executionLine);
        const syntaxTree = CodeMirror.syntaxTree(state);
        const syntaxNode = syntaxTree.resolveInner(position, 1);
        const tokenEnd = Math.min(line.to, syntaxNode.to);
        if (tokenEnd > position) {
          builder.add(position, tokenEnd, executionToken);
        }
      }
      return builder.finish();
    }
  }
  const positionHighlighterSpec = {
    decorations: ({ decorations }) => decorations
  };
  return [
    positionHighlightedState,
    CodeMirror.ViewPlugin.fromClass(PositionHighlighter, positionHighlighterSpec)
  ];
}
//# sourceMappingURL=ExecutionPositionHighlighter.js.map
