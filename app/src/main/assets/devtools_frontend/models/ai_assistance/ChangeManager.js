"use strict";
import * as Common from "../../core/common/common.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
function formatStyles(styles, indent = 2) {
  const lines = Object.entries(styles).map(([key, value]) => `${" ".repeat(indent)}${key}: ${value};`);
  return lines.join("\n");
}
export class ChangeManager {
  #stylesheetMutex = new Common.Mutex.Mutex();
  #cssModelToStylesheetId = /* @__PURE__ */ new Map();
  #stylesheetChanges = /* @__PURE__ */ new Map();
  #backupStylesheetChanges = /* @__PURE__ */ new Map();
  constructor() {
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ResourceTreeModel.ResourceTreeModel,
      SDK.ResourceTreeModel.Events.PrimaryPageChanged,
      this.clear,
      this
    );
  }
  async stashChanges() {
    for (const [cssModel, stylesheetMap] of this.#cssModelToStylesheetId.entries()) {
      const stylesheetIds = Array.from(stylesheetMap.values());
      await Promise.allSettled(stylesheetIds.map(async (id) => {
        this.#backupStylesheetChanges.set(id, this.#stylesheetChanges.get(id) ?? []);
        this.#stylesheetChanges.delete(id);
        await cssModel.setStyleSheetText(id, "", true);
      }));
    }
  }
  dropStashedChanges() {
    this.#backupStylesheetChanges.clear();
  }
  async popStashedChanges() {
    const cssModelAndStyleSheets = Array.from(this.#cssModelToStylesheetId.entries());
    await Promise.allSettled(cssModelAndStyleSheets.map(async ([cssModel, stylesheetMap]) => {
      const frameAndStylesheet = Array.from(stylesheetMap.entries());
      return await Promise.allSettled(frameAndStylesheet.map(async ([frameId, stylesheetId]) => {
        const changes = this.#backupStylesheetChanges.get(stylesheetId) ?? [];
        return await Promise.allSettled(changes.map(async (change) => {
          return await this.addChange(cssModel, frameId, change);
        }));
      }));
    }));
  }
  async clear() {
    const models = Array.from(this.#cssModelToStylesheetId.keys());
    const results = await Promise.allSettled(models.map(async (model) => {
      await this.#onCssModelDisposed({ data: model });
    }));
    this.#cssModelToStylesheetId.clear();
    this.#stylesheetChanges.clear();
    this.#backupStylesheetChanges.clear();
    const firstFailed = results.find((result) => result.status === "rejected");
    if (firstFailed) {
      console.error(firstFailed.reason);
    }
  }
  async addChange(cssModel, frameId, change) {
    const stylesheetId = await this.#getStylesheet(cssModel, frameId);
    const changes = this.#stylesheetChanges.get(stylesheetId) || [];
    const existingChange = changes.find((c) => c.className === change.className);
    const stylesKebab = Platform.StringUtilities.toKebabCaseKeys(change.styles);
    if (existingChange) {
      Object.assign(existingChange.styles, stylesKebab);
      existingChange.groupId = change.groupId;
      existingChange.turnId = change.turnId;
    } else {
      changes.push({
        ...change,
        styles: stylesKebab
      });
    }
    const content = this.#formatChangesForInspectorStylesheet(changes);
    await cssModel.setStyleSheetText(stylesheetId, content, true);
    this.#stylesheetChanges.set(stylesheetId, changes);
    return content;
  }
  formatChangesForPatching(groupId, includeSourceLocation = false) {
    return Array.from(this.#stylesheetChanges.values()).flatMap(
      (changesPerStylesheet) => changesPerStylesheet.filter((change) => change.groupId === groupId).map((change) => this.#formatChange(change, includeSourceLocation))
    ).filter((change) => change !== "").join("\n\n");
  }
  getChangedNodesForGroupId(groupId, turnId) {
    const nodes = /* @__PURE__ */ new Set();
    for (const changes of this.#stylesheetChanges.values()) {
      for (const change of changes) {
        if (change.groupId === groupId && change.backendNodeId && (turnId === void 0 || change.turnId === turnId)) {
          nodes.add(change.backendNodeId);
        }
      }
    }
    return Array.from(nodes);
  }
  #formatChangesForInspectorStylesheet(changes) {
    return changes.map((change) => {
      return `.${change.className} {
  ${change.selector}& {
${formatStyles(change.styles, 4)}
  }
}`;
    }).join("\n");
  }
  #formatChange(change, includeSourceLocation = false) {
    const sourceLocation = includeSourceLocation && change.sourceLocation ? `/* related resource: ${change.sourceLocation} */
` : "";
    const simpleSelector = includeSourceLocation && change.simpleSelector ? ` /* the element was ${change.simpleSelector} */` : "";
    return `${sourceLocation}${change.selector} {${simpleSelector}
${formatStyles(change.styles)}
}`;
  }
  async #getStylesheet(cssModel, frameId) {
    return await this.#stylesheetMutex.run(async () => {
      let frameToStylesheet = this.#cssModelToStylesheetId.get(cssModel);
      if (!frameToStylesheet) {
        frameToStylesheet = /* @__PURE__ */ new Map();
        this.#cssModelToStylesheetId.set(cssModel, frameToStylesheet);
        cssModel.addEventListener(SDK.CSSModel.Events.ModelDisposed, this.#onCssModelDisposed, this);
      }
      let stylesheetId = frameToStylesheet.get(frameId);
      if (!stylesheetId) {
        const styleSheetHeader = await cssModel.createInspectorStylesheet(
          frameId,
          /* force */
          true
        );
        if (!styleSheetHeader) {
          throw new Error("inspector-stylesheet is not found");
        }
        stylesheetId = styleSheetHeader.id;
        frameToStylesheet.set(frameId, stylesheetId);
      }
      return stylesheetId;
    });
  }
  async #onCssModelDisposed(event) {
    return await this.#stylesheetMutex.run(async () => {
      const cssModel = event.data;
      cssModel.removeEventListener(SDK.CSSModel.Events.ModelDisposed, this.#onCssModelDisposed, this);
      const stylesheetIds = Array.from(this.#cssModelToStylesheetId.get(cssModel)?.values() ?? []);
      const results = await Promise.allSettled(stylesheetIds.map(async (id) => {
        this.#stylesheetChanges.delete(id);
        this.#backupStylesheetChanges.delete(id);
        await cssModel.setStyleSheetText(id, "", true);
      }));
      this.#cssModelToStylesheetId.delete(cssModel);
      const firstFailed = results.find((result) => result.status === "rejected");
      if (firstFailed) {
        throw new Error(firstFailed.reason);
      }
    });
  }
}
//# sourceMappingURL=ChangeManager.js.map
