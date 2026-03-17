"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
const UIStrings = {
  /**
   * @description Assertion error message when failing to load a file.
   */
  unableToReadFilesWithThis: "`PlatformFileSystem` cannot read files."
};
const str_ = i18n.i18n.registerUIStrings("models/persistence/PlatformFileSystem.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var PlatformFileSystemType = /* @__PURE__ */ ((PlatformFileSystemType2) => {
  PlatformFileSystemType2["SNIPPETS"] = "snippets";
  PlatformFileSystemType2["OVERRIDES"] = "overrides";
  PlatformFileSystemType2["WORKSPACE_PROJECT"] = "workspace-project";
  return PlatformFileSystemType2;
})(PlatformFileSystemType || {});
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["FILE_SYSTEM_ERROR"] = "file-system-error";
  return Events2;
})(Events || {});
export class PlatformFileSystem extends Common.ObjectWrapper.ObjectWrapper {
  #path;
  #type;
  /**
   * True if the filesystem was automatically discovered (see
   * https://goo.gle/devtools-json-design).
   */
  automatic;
  constructor(path, type, automatic) {
    super();
    this.#path = path;
    this.#type = type;
    this.automatic = automatic;
  }
  getMetadata(_path) {
    return Promise.resolve(null);
  }
  initialFilePaths() {
    return [];
  }
  initialGitFolders() {
    return [];
  }
  path() {
    return this.#path;
  }
  embedderPath() {
    throw new Error("Not implemented");
  }
  type() {
    return this.#type;
  }
  async createFile(_path, _name) {
    return await Promise.resolve(null);
  }
  deleteFile(_path) {
    return Promise.resolve(false);
  }
  deleteDirectoryRecursively(_path) {
    return Promise.resolve(false);
  }
  requestFileBlob(_path) {
    return Promise.resolve(null);
  }
  async requestFileContent(_path) {
    return { error: i18nString(UIStrings.unableToReadFilesWithThis) };
  }
  setFileContent(_path, _content, _isBase64) {
    throw new Error("Not implemented");
  }
  renameFile(_path, _newName, callback) {
    callback(false);
  }
  addExcludedFolder(_path) {
  }
  removeExcludedFolder(_path) {
  }
  fileSystemRemoved() {
  }
  isFileExcluded(_folderPath) {
    return false;
  }
  excludedFolders() {
    return /* @__PURE__ */ new Set();
  }
  searchInPath(_query, _progress) {
    return Promise.resolve([]);
  }
  indexContent(progress) {
    queueMicrotask(() => {
      progress.done = true;
    });
  }
  mimeFromPath(_path) {
    throw new Error("Not implemented");
  }
  canExcludeFolder(_path) {
    return false;
  }
  contentType(_path) {
    throw new Error("Not implemented");
  }
  tooltipForURL(_url) {
    throw new Error("Not implemented");
  }
  supportsAutomapping() {
    throw new Error("Not implemented");
  }
}
//# sourceMappingURL=PlatformFileSystem.js.map
