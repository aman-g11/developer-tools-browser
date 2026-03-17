"use strict";
import * as Common from "../../core/common/common.js";
export const DiffWrapper = {
  charDiff: function(text1, text2, cleanup) {
    const differ = new diff_match_patch();
    const diff = differ.diff_main(text1, text2);
    if (cleanup) {
      differ.diff_cleanupSemantic(diff);
    }
    return diff;
  },
  lineDiff: function(lines1, lines2) {
    const idMap = new Common.CharacterIdMap.CharacterIdMap();
    const text1 = lines1.map((line) => idMap.toChar(line)).join("");
    const text2 = lines2.map((line) => idMap.toChar(line)).join("");
    if (text1 === text2) {
      return [];
    }
    const diff = DiffWrapper.charDiff(text1, text2);
    const lineDiff = [];
    for (let i = 0; i < diff.length; i++) {
      const lines = [];
      for (let j = 0; j < diff[i][1].length; j++) {
        lines.push(idMap.fromChar(diff[i][1][j]) || "");
      }
      lineDiff.push({ 0: diff[i][0], 1: lines });
    }
    return lineDiff;
  },
  convertToEditDiff: function(diff) {
    const normalized = [];
    let added = 0;
    let removed = 0;
    for (let i = 0; i < diff.length; ++i) {
      const token = diff[i];
      if (token[0] === 0 /* Equal */) {
        flush();
        normalized.push([0 /* Equal */, token[1].length]);
      } else if (token[0] === -1 /* Delete */) {
        removed += token[1].length;
      } else {
        added += token[1].length;
      }
    }
    flush();
    return normalized;
    function flush() {
      if (added && removed) {
        const min = Math.min(added, removed);
        normalized.push([2 /* Edit */, min]);
        added -= min;
        removed -= min;
      }
      if (added || removed) {
        const balance = added - removed;
        const type = balance < 0 ? -1 /* Delete */ : 1 /* Insert */;
        normalized.push([type, Math.abs(balance)]);
        added = 0;
        removed = 0;
      }
    }
  },
  /**
   * Scores character-sequence diffs, giving higher scores for longer sequences.
   */
  characterScore: function(item, against) {
    let score = 0;
    const diff = DiffWrapper.charDiff(item, against);
    for (let i = 0; i < diff.length; ++i) {
      if (diff[i][0] === 0 /* Equal */) {
        score += diff[i][1].length * diff[i][1].length;
      }
    }
    return score;
  }
};
export var Operation = /* @__PURE__ */ ((Operation2) => {
  Operation2[Operation2["Equal"] = 0] = "Equal";
  Operation2[Operation2["Insert"] = 1] = "Insert";
  Operation2[Operation2["Delete"] = -1] = "Delete";
  Operation2[Operation2["Edit"] = 2] = "Edit";
  return Operation2;
})(Operation || {});
//# sourceMappingURL=DiffWrapper.js.map
