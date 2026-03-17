"use strict";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Bindings from "../../../../models/bindings/bindings.js";
import * as Workspace from "../../../../models/workspace/workspace.js";
let performanceInstance;
export class Performance {
  helper;
  constructor() {
    this.helper = new Helper(Workspace.UISourceCode.DecoratorType.PERFORMANCE);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!performanceInstance || forceNew) {
      performanceInstance = new Performance();
    }
    return performanceInstance;
  }
  initialize(profiles, target) {
    this.helper.reset();
    for (const profile of profiles) {
      this.appendCPUProfile(profile, target);
    }
    void this.helper.update();
  }
  appendLegacyCPUProfile(profile, target) {
    const nodesToGo = [profile.profileHead];
    const sampleDuration = (profile.profileEndTime - profile.profileStartTime) / profile.totalHitCount;
    while (nodesToGo.length) {
      const nodes = nodesToGo.pop()?.children ?? [];
      for (let i = 0; i < nodes.length; ++i) {
        const node = nodes[i];
        nodesToGo.push(node);
        if (!node.url || !node.positionTicks) {
          continue;
        }
        for (let j = 0; j < node.positionTicks.length; ++j) {
          const lineInfo = node.positionTicks[j];
          const line = lineInfo.line;
          const time = lineInfo.ticks * sampleDuration;
          this.helper.addLocationData(target, node.url, { line, column: 1 }, time);
        }
      }
    }
  }
  appendCPUProfile(profile, target) {
    if (!profile.lines) {
      this.appendLegacyCPUProfile(profile, target);
      return;
    }
    if (!profile.samples || !profile.columns) {
      return;
    }
    for (let i = 1; i < profile.samples.length; ++i) {
      const line = profile.lines[i];
      const column = profile.columns?.[i];
      if (!line || !column) {
        continue;
      }
      const node = profile.nodeByIndex(i);
      if (!node) {
        continue;
      }
      const scriptIdOrUrl = Number(node.scriptId) || node.url;
      if (!scriptIdOrUrl) {
        continue;
      }
      const time = profile.timestamps[i] - profile.timestamps[i - 1];
      this.helper.addLocationData(target, scriptIdOrUrl, { line, column }, time);
    }
  }
}
let memoryInstance;
export class Memory {
  helper;
  constructor() {
    this.helper = new Helper(Workspace.UISourceCode.DecoratorType.MEMORY);
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!memoryInstance || forceNew) {
      memoryInstance = new Memory();
    }
    return memoryInstance;
  }
  reset() {
    this.helper.reset();
    void this.helper.update();
  }
  initialize(profilesAndTargets) {
    this.helper.reset();
    for (const { profile, target } of profilesAndTargets) {
      this.appendHeapProfile(profile, target);
    }
    void this.helper.update();
  }
  appendHeapProfile(profile, target) {
    const helper = this.helper;
    processNode(profile.head);
    function processNode(node) {
      node.children.forEach(processNode);
      if (!node.selfSize) {
        return;
      }
      const script = Number(node.callFrame.scriptId) || node.callFrame.url;
      if (!script) {
        return;
      }
      const line = node.callFrame.lineNumber + 1;
      const column = node.callFrame.columnNumber + 1;
      helper.addLocationData(target, script, { line, column }, node.selfSize);
    }
  }
}
export class Helper {
  type;
  locationPool = new Bindings.LiveLocation.LiveLocationPool();
  /**
   * Given a location in a script (with line and column numbers being 1-based) stores
   * the time spent at that location in a performance profile.
   */
  locationData = /* @__PURE__ */ new Map();
  constructor(type) {
    this.type = type;
    this.reset();
  }
  reset() {
    this.locationData = /* @__PURE__ */ new Map();
  }
  /**
   * Stores the time taken running a given script location (line and column)
   */
  addLocationData(target, scriptIdOrUrl, { line, column }, data) {
    let targetData = this.locationData.get(target);
    if (!targetData) {
      targetData = /* @__PURE__ */ new Map();
      this.locationData.set(target, targetData);
    }
    let scriptData = targetData.get(scriptIdOrUrl);
    if (!scriptData) {
      scriptData = /* @__PURE__ */ new Map();
      targetData.set(scriptIdOrUrl, scriptData);
    }
    let lineData = scriptData.get(line);
    if (!lineData) {
      lineData = /* @__PURE__ */ new Map();
      scriptData.set(line, lineData);
    }
    lineData.set(column, (lineData.get(column) || 0) + data);
  }
  async update() {
    this.locationPool.disposeAll();
    const decorationsBySource = /* @__PURE__ */ new Map();
    const pending = [];
    for (const [target, scriptToLineMap] of this.locationData) {
      const debuggerModel = target ? target.model(SDK.DebuggerModel.DebuggerModel) : null;
      for (const [scriptIdOrUrl, lineToDataMap] of scriptToLineMap) {
        const workspace = Workspace.Workspace.WorkspaceImpl.instance();
        if (debuggerModel) {
          const workspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
          for (const [lineNumber, lineData] of lineToDataMap) {
            for (const [columnNumber, data] of lineData) {
              const zeroBasedLine = lineNumber - 1;
              const zeroBasedColumn = columnNumber - 1;
              if (target) {
                const rawLocation = typeof scriptIdOrUrl === "string" ? debuggerModel.createRawLocationByURL(scriptIdOrUrl, zeroBasedLine, zeroBasedColumn || 0) : debuggerModel.createRawLocationByScriptId(
                  String(scriptIdOrUrl),
                  zeroBasedLine,
                  zeroBasedColumn || 0
                );
                if (rawLocation) {
                  pending.push(workspaceBinding.rawLocationToUILocation(rawLocation).then((uiLocation) => {
                    if (!uiLocation) {
                      return;
                    }
                    this.addLineColumnData(
                      decorationsBySource,
                      uiLocation.uiSourceCode,
                      uiLocation.lineNumber + 1,
                      (uiLocation.columnNumber ?? 0) + 1,
                      data
                    );
                    if (uiLocation.uiSourceCode.contentType().isFromSourceMap()) {
                      const script = rawLocation.script();
                      const uiSourceCode = script ? workspaceBinding.uiSourceCodeForScript(script) : null;
                      if (uiSourceCode) {
                        this.addLineColumnData(decorationsBySource, uiSourceCode, lineNumber, columnNumber, data);
                      }
                    }
                  }));
                }
              }
            }
          }
        } else if (typeof scriptIdOrUrl === "string") {
          const uiSourceCode = workspace.uiSourceCodeForURL(scriptIdOrUrl);
          if (uiSourceCode) {
            decorationsBySource.set(uiSourceCode, lineToDataMap);
          }
        }
      }
      await Promise.all(pending);
      for (const [uiSourceCode, lineMap] of decorationsBySource) {
        uiSourceCode.setDecorationData(this.type, lineMap);
      }
    }
    for (const uiSourceCode of Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodes()) {
      if (!decorationsBySource.has(uiSourceCode)) {
        uiSourceCode.setDecorationData(this.type, void 0);
      }
    }
  }
  addLineColumnData(decorationsBySource, uiSourceCode, lineOneIndexed, columnOneIndexed, data) {
    let lineMap = decorationsBySource.get(uiSourceCode);
    if (!lineMap) {
      lineMap = /* @__PURE__ */ new Map();
      decorationsBySource.set(uiSourceCode, lineMap);
    }
    let columnMap = lineMap.get(lineOneIndexed);
    if (!columnMap) {
      columnMap = /* @__PURE__ */ new Map();
      lineMap.set(lineOneIndexed, columnMap);
    }
    columnMap.set(columnOneIndexed, (columnMap.get(columnOneIndexed) ?? 0) + data);
  }
}
//# sourceMappingURL=LineLevelProfile.js.map
