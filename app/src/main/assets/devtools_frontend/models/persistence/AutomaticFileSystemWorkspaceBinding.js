"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as Workspace from "../workspace/workspace.js";
import {
  Events as AutomaticFileSystemManagerEvents
} from "./AutomaticFileSystemManager.js";
import {
  Events as IsolatedFileSystemManagerEvents
} from "./IsolatedFileSystemManager.js";
export class FileSystem {
  automaticFileSystem;
  automaticFileSystemManager;
  #workspace;
  constructor(automaticFileSystem, automaticFileSystemManager, workspace) {
    this.automaticFileSystem = automaticFileSystem;
    this.automaticFileSystemManager = automaticFileSystemManager;
    this.#workspace = workspace;
  }
  workspace() {
    return this.#workspace;
  }
  id() {
    return `${this.type()}:${this.automaticFileSystem.root}:${this.automaticFileSystem.uuid}`;
  }
  type() {
    return Workspace.Workspace.projectTypes.ConnectableFileSystem;
  }
  isServiceProject() {
    return false;
  }
  displayName() {
    const { root } = this.automaticFileSystem;
    let slash = root.lastIndexOf("/");
    if (slash === -1 && Host.Platform.isWin()) {
      slash = root.lastIndexOf("\\");
    }
    return root.substr(slash + 1);
  }
  async requestMetadata(_uiSourceCode) {
    throw new Error("Not implemented");
  }
  async requestFileContent(_uiSourceCode) {
    throw new Error("Not implemented");
  }
  canSetFileContent() {
    return false;
  }
  async setFileContent(_uiSourceCode, _newContent, _isBase64) {
    throw new Error("Not implemented");
  }
  fullDisplayName(_uiSourceCode) {
    throw new Error("Not implemented");
  }
  mimeType(_uiSourceCode) {
    throw new Error("Not implemented");
  }
  canRename() {
    return false;
  }
  rename(_uiSourceCode, _newName, _callback) {
    throw new Error("Not implemented");
  }
  excludeFolder(_path) {
    throw new Error("Not implemented");
  }
  canExcludeFolder(_path) {
    return false;
  }
  async createFile(_path, _name, _content, _isBase64) {
    throw new Error("Not implemented");
  }
  canCreateFile() {
    return false;
  }
  deleteFile(_uiSourceCode) {
    throw new Error("Not implemented");
  }
  async deleteDirectoryRecursively(_path) {
    throw new Error("Not implemented");
  }
  remove() {
  }
  removeUISourceCode(_url) {
    throw new Error("Not implemented");
  }
  async searchInFileContent(_uiSourceCode, _query, _caseSensitive, _isRegex) {
    return [];
  }
  async findFilesMatchingSearchRequest(_searchConfig, _filesMatchingFileQuery, _progress) {
    return /* @__PURE__ */ new Map();
  }
  indexContent(_progress) {
  }
  uiSourceCodeForURL(_url) {
    return null;
  }
  uiSourceCodes() {
    return [];
  }
}
let automaticFileSystemWorkspaceBindingInstance;
export class AutomaticFileSystemWorkspaceBinding {
  #automaticFileSystemManager;
  #fileSystem = null;
  #isolatedFileSystemManager;
  #workspace;
  /**
   * @internal
   */
  constructor(automaticFileSystemManager, isolatedFileSystemManager, workspace) {
    this.#automaticFileSystemManager = automaticFileSystemManager;
    this.#isolatedFileSystemManager = isolatedFileSystemManager;
    this.#workspace = workspace;
    this.#automaticFileSystemManager.addEventListener(
      AutomaticFileSystemManagerEvents.AUTOMATIC_FILE_SYSTEM_CHANGED,
      this.#update,
      this
    );
    this.#isolatedFileSystemManager.addEventListener(
      IsolatedFileSystemManagerEvents.FileSystemAdded,
      this.#update,
      this
    );
    this.#isolatedFileSystemManager.addEventListener(
      IsolatedFileSystemManagerEvents.FileSystemRemoved,
      this.#update,
      this
    );
    this.#update();
  }
  /**
   * Yields the `AutomaticFileSystemWorkspaceBinding` singleton.
   *
   * @returns the singleton.
   */
  static instance({ forceNew, automaticFileSystemManager, isolatedFileSystemManager, workspace } = {
    forceNew: false,
    automaticFileSystemManager: null,
    isolatedFileSystemManager: null,
    workspace: null
  }) {
    if (!automaticFileSystemWorkspaceBindingInstance || forceNew) {
      if (!automaticFileSystemManager || !isolatedFileSystemManager || !workspace) {
        throw new Error(
          "Unable to create AutomaticFileSystemWorkspaceBinding: automaticFileSystemManager, isolatedFileSystemManager, and workspace must be provided"
        );
      }
      automaticFileSystemWorkspaceBindingInstance = new AutomaticFileSystemWorkspaceBinding(
        automaticFileSystemManager,
        isolatedFileSystemManager,
        workspace
      );
    }
    return automaticFileSystemWorkspaceBindingInstance;
  }
  /**
   * Clears the `AutomaticFileSystemWorkspaceBinding` singleton (if any);
   */
  static removeInstance() {
    if (automaticFileSystemWorkspaceBindingInstance) {
      automaticFileSystemWorkspaceBindingInstance.#dispose();
      automaticFileSystemWorkspaceBindingInstance = void 0;
    }
  }
  #dispose() {
    if (this.#fileSystem) {
      this.#workspace.removeProject(this.#fileSystem);
    }
    this.#automaticFileSystemManager.removeEventListener(
      AutomaticFileSystemManagerEvents.AUTOMATIC_FILE_SYSTEM_CHANGED,
      this.#update,
      this
    );
    this.#isolatedFileSystemManager.removeEventListener(
      IsolatedFileSystemManagerEvents.FileSystemAdded,
      this.#update,
      this
    );
    this.#isolatedFileSystemManager.removeEventListener(
      IsolatedFileSystemManagerEvents.FileSystemRemoved,
      this.#update,
      this
    );
  }
  #update() {
    const automaticFileSystem = this.#automaticFileSystemManager.automaticFileSystem;
    if (this.#fileSystem !== null) {
      if (this.#fileSystem.automaticFileSystem === automaticFileSystem) {
        return;
      }
      this.#workspace.removeProject(this.#fileSystem);
      this.#fileSystem = null;
    }
    if (automaticFileSystem !== null && automaticFileSystem.state !== "connected") {
      const fileSystemURL = Common.ParsedURL.ParsedURL.rawPathToUrlString(automaticFileSystem.root);
      if (this.#isolatedFileSystemManager.fileSystem(fileSystemURL) === null) {
        this.#fileSystem = new FileSystem(
          automaticFileSystem,
          this.#automaticFileSystemManager,
          this.#workspace
        );
        this.#workspace.addProject(this.#fileSystem);
      }
    }
  }
}
//# sourceMappingURL=AutomaticFileSystemWorkspaceBinding.js.map
