"use strict";
import * as Common from "../../core/common/common.js";
import * as Root from "../../core/root/root.js";
import { UISourceCode } from "./UISourceCode.js";
export var projectTypes = /* @__PURE__ */ ((projectTypes2) => {
  projectTypes2["Debugger"] = "debugger";
  projectTypes2["Formatter"] = "formatter";
  projectTypes2["Network"] = "network";
  projectTypes2["FileSystem"] = "filesystem";
  projectTypes2["ConnectableFileSystem"] = "connectablefilesystem";
  projectTypes2["ContentScripts"] = "contentscripts";
  projectTypes2["Service"] = "service";
  return projectTypes2;
})(projectTypes || {});
export class ProjectStore {
  #workspace;
  #id;
  #type;
  #displayName;
  #uiSourceCodes = /* @__PURE__ */ new Map();
  constructor(workspace, id, type, displayName) {
    this.#workspace = workspace;
    this.#id = id;
    this.#type = type;
    this.#displayName = displayName;
  }
  id() {
    return this.#id;
  }
  type() {
    return this.#type;
  }
  displayName() {
    return this.#displayName;
  }
  workspace() {
    return this.#workspace;
  }
  createUISourceCode(url, contentType) {
    return new UISourceCode(this, url, contentType);
  }
  addUISourceCode(uiSourceCode) {
    const url = uiSourceCode.url();
    if (this.uiSourceCodeForURL(url)) {
      return false;
    }
    this.#uiSourceCodes.set(url, uiSourceCode);
    this.#workspace.dispatchEventToListeners("UISourceCodeAdded" /* UISourceCodeAdded */, uiSourceCode);
    return true;
  }
  removeUISourceCode(url) {
    const uiSourceCode = this.#uiSourceCodes.get(url);
    if (uiSourceCode === void 0) {
      return;
    }
    this.#uiSourceCodes.delete(url);
    this.#workspace.dispatchEventToListeners("UISourceCodeRemoved" /* UISourceCodeRemoved */, uiSourceCode);
  }
  removeProject() {
    this.#workspace.removeProject(this);
    this.#uiSourceCodes.clear();
  }
  uiSourceCodeForURL(url) {
    return this.#uiSourceCodes.get(url) ?? null;
  }
  uiSourceCodes() {
    return this.#uiSourceCodes.values();
  }
  renameUISourceCode(uiSourceCode, newName) {
    const oldPath = uiSourceCode.url();
    const newPath = uiSourceCode.parentURL() ? Common.ParsedURL.ParsedURL.urlFromParentUrlAndName(uiSourceCode.parentURL(), newName) : Common.ParsedURL.ParsedURL.preEncodeSpecialCharactersInPath(newName);
    this.#uiSourceCodes.set(newPath, uiSourceCode);
    this.#uiSourceCodes.delete(oldPath);
  }
  // No-op implementation for a handful of interface methods.
  rename(_uiSourceCode, _newName, _callback) {
  }
  excludeFolder(_path) {
  }
  deleteFile(_uiSourceCode) {
  }
  deleteDirectoryRecursively(_path) {
    return Promise.resolve(false);
  }
  remove() {
  }
  indexContent(_progress) {
  }
}
export class WorkspaceImpl extends Common.ObjectWrapper.ObjectWrapper {
  #projects = /* @__PURE__ */ new Map();
  #hasResourceContentTrackingExtensions = false;
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!Root.DevToolsContext.globalInstance().has(WorkspaceImpl) || forceNew) {
      Root.DevToolsContext.globalInstance().set(WorkspaceImpl, new WorkspaceImpl());
    }
    return Root.DevToolsContext.globalInstance().get(WorkspaceImpl);
  }
  static removeInstance() {
    Root.DevToolsContext.globalInstance().delete(WorkspaceImpl);
  }
  uiSourceCode(projectId, url) {
    const project = this.#projects.get(projectId);
    return project ? project.uiSourceCodeForURL(url) : null;
  }
  uiSourceCodeForURL(url) {
    for (const project of this.#projects.values()) {
      const uiSourceCode = project.uiSourceCodeForURL(url);
      if (uiSourceCode) {
        return uiSourceCode;
      }
    }
    return null;
  }
  findCompatibleUISourceCodes(uiSourceCode) {
    const url = uiSourceCode.url();
    const contentType = uiSourceCode.contentType();
    const result = [];
    for (const project of this.#projects.values()) {
      if (uiSourceCode.project().type() !== project.type()) {
        continue;
      }
      const candidate = project.uiSourceCodeForURL(url);
      if (candidate && candidate.url() === url && candidate.contentType() === contentType) {
        result.push(candidate);
      }
    }
    return result;
  }
  uiSourceCodesForProjectType(type) {
    const result = [];
    for (const project of this.#projects.values()) {
      if (project.type() === type) {
        for (const uiSourceCode of project.uiSourceCodes()) {
          result.push(uiSourceCode);
        }
      }
    }
    return result;
  }
  addProject(project) {
    console.assert(!this.#projects.has(project.id()), `A project with id ${project.id()} already exists!`);
    this.#projects.set(project.id(), project);
    this.dispatchEventToListeners("ProjectAdded" /* ProjectAdded */, project);
  }
  removeProject(project) {
    this.#projects.delete(project.id());
    this.dispatchEventToListeners("ProjectRemoved" /* ProjectRemoved */, project);
  }
  project(projectId) {
    return this.#projects.get(projectId) || null;
  }
  projectForFileSystemRoot(root) {
    const projectId = Common.ParsedURL.ParsedURL.rawPathToUrlString(root);
    return this.project(projectId);
  }
  projects() {
    return [...this.#projects.values()];
  }
  projectsForType(type) {
    function filterByType(project) {
      return project.type() === type;
    }
    return this.projects().filter(filterByType);
  }
  uiSourceCodes() {
    const result = [];
    for (const project of this.#projects.values()) {
      for (const uiSourceCode of project.uiSourceCodes()) {
        result.push(uiSourceCode);
      }
    }
    return result;
  }
  setHasResourceContentTrackingExtensions(hasExtensions) {
    this.#hasResourceContentTrackingExtensions = hasExtensions;
  }
  hasResourceContentTrackingExtensions() {
    return this.#hasResourceContentTrackingExtensions;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["UISourceCodeAdded"] = "UISourceCodeAdded";
  Events2["UISourceCodeRemoved"] = "UISourceCodeRemoved";
  Events2["UISourceCodeRenamed"] = "UISourceCodeRenamed";
  Events2["WorkingCopyChanged"] = "WorkingCopyChanged";
  Events2["WorkingCopyCommitted"] = "WorkingCopyCommitted";
  Events2["WorkingCopyCommittedByUser"] = "WorkingCopyCommittedByUser";
  Events2["ProjectAdded"] = "ProjectAdded";
  Events2["ProjectRemoved"] = "ProjectRemoved";
  return Events2;
})(Events || {});
//# sourceMappingURL=WorkspaceImpl.js.map
