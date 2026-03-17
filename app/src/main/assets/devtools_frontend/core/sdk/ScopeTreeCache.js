"use strict";
import * as Formatter from "../../models/formatter/formatter.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
const scopeTrees = /* @__PURE__ */ new WeakMap();
export function scopeTreeForScript(script) {
  if (script.isWasm()) {
    return Promise.resolve(null);
  }
  let promise = scopeTrees.get(script);
  if (promise === void 0) {
    promise = script.requestContentData().then((content) => {
      if (TextUtils.ContentData.ContentData.isError(content)) {
        return null;
      }
      const sourceType = script.isModule ? "module" : "script";
      return Formatter.FormatterWorkerPool.formatterWorkerPool().javaScriptScopeTree(content.text, sourceType).then((scopeTree) => scopeTree ? { scopeTree, text: content.textObj } : null).catch(() => null);
    });
    scopeTrees.set(script, promise);
  }
  return promise;
}
//# sourceMappingURL=ScopeTreeCache.js.map
