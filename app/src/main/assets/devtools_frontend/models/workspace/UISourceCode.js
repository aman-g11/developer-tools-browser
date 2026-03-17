"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as TextUtils from "../text_utils/text_utils.js";
import { IgnoreListManager } from "./IgnoreListManager.js";
import { Events as WorkspaceImplEvents } from "./WorkspaceImpl.js";
const UIStrings = {
  /**
   * @description Text for the index of something
   */
  index: "(index)",
  /**
   * @description Text in UISource Code of the DevTools local workspace
   */
  thisFileWasChangedExternally: "This file was changed externally. Would you like to reload it?"
};
const str_ = i18n.i18n.registerUIStrings("models/workspace/UISourceCode.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class UISourceCode extends Common.ObjectWrapper.ObjectWrapper {
  #origin;
  #parentURL;
  #project;
  #url;
  #name;
  #contentType;
  #requestContentPromise = null;
  #decorations = /* @__PURE__ */ new Map();
  #hasCommits = false;
  #messages = null;
  #content = null;
  #forceLoadOnCheckContent = false;
  #checkingContent = false;
  #lastAcceptedContent = null;
  #workingCopy = null;
  #workingCopyGetter = null;
  #disableEdit = false;
  #contentEncoded;
  #isKnownThirdParty = false;
  #isUnconditionallyIgnoreListed = false;
  #containsAiChanges = false;
  constructor(project, url, contentType) {
    super();
    this.#project = project;
    this.#url = url;
    const parsedURL = Common.ParsedURL.ParsedURL.fromString(url);
    if (parsedURL) {
      this.#origin = parsedURL.securityOrigin();
      this.#parentURL = Common.ParsedURL.ParsedURL.concatenate(this.#origin, parsedURL.folderPathComponents);
      if (parsedURL.queryParams && !(parsedURL.lastPathComponent && contentType.isFromSourceMap())) {
        this.#name = parsedURL.lastPathComponent + "?" + parsedURL.queryParams;
      } else {
        try {
          this.#name = decodeURIComponent(parsedURL.lastPathComponent);
        } catch {
          this.#name = parsedURL.lastPathComponent;
        }
      }
    } else {
      this.#origin = Platform.DevToolsPath.EmptyUrlString;
      this.#parentURL = Platform.DevToolsPath.EmptyUrlString;
      this.#name = url;
    }
    this.#contentType = contentType;
  }
  requestMetadata() {
    return this.#project.requestMetadata(this);
  }
  name() {
    return this.#name;
  }
  mimeType() {
    return this.#project.mimeType(this);
  }
  url() {
    return this.#url;
  }
  // Identifier used for deduplicating scripts that are considered by the
  // DevTools UI to be the same script. For now this is just the url but this
  // is likely to change in the future.
  canonicalScriptId() {
    return `${this.#contentType.name()},${this.#url}`;
  }
  parentURL() {
    return this.#parentURL;
  }
  origin() {
    return this.#origin;
  }
  fullDisplayName() {
    return this.#project.fullDisplayName(this);
  }
  displayName(skipTrim) {
    if (!this.#name) {
      return i18nString(UIStrings.index);
    }
    const name = this.#name;
    return skipTrim ? name : Platform.StringUtilities.trimEndWithMaxLength(name, 100);
  }
  canRename() {
    return this.#project.canRename();
  }
  rename(newName) {
    const { resolve, promise } = Promise.withResolvers();
    this.#project.rename(this, newName, innerCallback.bind(this));
    return promise;
    function innerCallback(success, newName2, newURL, newContentType) {
      if (success) {
        this.#updateName(
          newName2,
          newURL,
          newContentType
        );
      }
      resolve(success);
    }
  }
  remove() {
    this.#project.deleteFile(this);
  }
  #updateName(name, url, contentType) {
    const oldURL = this.#url;
    this.#name = name;
    if (url) {
      this.#url = url;
    } else {
      this.#url = Common.ParsedURL.ParsedURL.relativePathToUrlString(name, oldURL);
    }
    if (contentType) {
      this.#contentType = contentType;
    }
    this.dispatchEventToListeners("TitleChanged" /* TitleChanged */, this);
    this.project().workspace().dispatchEventToListeners(
      WorkspaceImplEvents.UISourceCodeRenamed,
      { oldURL, uiSourceCode: this }
    );
  }
  contentURL() {
    return this.url();
  }
  contentType() {
    return this.#contentType;
  }
  project() {
    return this.#project;
  }
  requestContentData({ cachedWasmOnly } = {}) {
    if (this.#requestContentPromise) {
      return this.#requestContentPromise;
    }
    if (this.#content) {
      return Promise.resolve(this.#content);
    }
    if (cachedWasmOnly && this.mimeType() === "application/wasm") {
      return Promise.resolve(new TextUtils.WasmDisassembly.WasmDisassembly([], [], []));
    }
    this.#requestContentPromise = this.#requestContent();
    return this.#requestContentPromise;
  }
  async #requestContent() {
    if (this.#content) {
      throw new Error("Called UISourceCode#requestContentImpl even though content is available for " + this.#url);
    }
    try {
      this.#content = await this.#project.requestFileContent(this);
    } catch (err) {
      this.#content = { error: err ? String(err) : "" };
    }
    return this.#content;
  }
  #decodeContent(content) {
    if (!content) {
      return null;
    }
    return content.isEncoded && content.content ? window.atob(content.content) : content.content;
  }
  /** Only used to compare whether content changed */
  #unsafeDecodeContentData(content) {
    if (!content || TextUtils.ContentData.ContentData.isError(content)) {
      return null;
    }
    return content.createdFromBase64 ? window.atob(content.base64) : content.text;
  }
  async checkContentUpdated() {
    if (!this.#content && !this.#forceLoadOnCheckContent) {
      return;
    }
    if (!this.#project.canSetFileContent() || this.#checkingContent) {
      return;
    }
    this.#checkingContent = true;
    const updatedContent = TextUtils.ContentData.ContentData.asDeferredContent(await this.#project.requestFileContent(this));
    if ("error" in updatedContent) {
      return;
    }
    this.#checkingContent = false;
    if (updatedContent.content === null) {
      const workingCopy = this.workingCopy();
      this.#contentCommitted("", false);
      this.setWorkingCopy(workingCopy);
      return;
    }
    if (this.#lastAcceptedContent === updatedContent.content) {
      return;
    }
    if (this.#unsafeDecodeContentData(this.#content) === this.#decodeContent(updatedContent)) {
      this.#lastAcceptedContent = null;
      return;
    }
    if (!this.isDirty() || this.#workingCopy === updatedContent.content) {
      this.#contentCommitted(updatedContent.content, false);
      return;
    }
    await Common.Revealer.reveal(this);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    const shouldUpdate = window.confirm(i18nString(UIStrings.thisFileWasChangedExternally));
    if (shouldUpdate) {
      this.#contentCommitted(updatedContent.content, false);
    } else {
      this.#lastAcceptedContent = updatedContent.content;
    }
  }
  forceLoadOnCheckContent() {
    this.#forceLoadOnCheckContent = true;
  }
  #commitContent(content) {
    if (this.#project.canSetFileContent()) {
      void this.#project.setFileContent(this, content, false);
    }
    this.#contentCommitted(content, true);
  }
  #contentCommitted(content, committedByUser) {
    this.#lastAcceptedContent = null;
    this.#content = new TextUtils.ContentData.ContentData(content, Boolean(this.#contentEncoded), this.mimeType());
    this.#requestContentPromise = null;
    this.#hasCommits = true;
    this.#resetWorkingCopy();
    const data = { uiSourceCode: this, content, encoded: this.#contentEncoded };
    this.dispatchEventToListeners("WorkingCopyCommitted" /* WorkingCopyCommitted */, data);
    this.#project.workspace().dispatchEventToListeners(WorkspaceImplEvents.WorkingCopyCommitted, data);
    if (committedByUser) {
      this.#project.workspace().dispatchEventToListeners(WorkspaceImplEvents.WorkingCopyCommittedByUser, data);
    }
  }
  addRevision(content) {
    this.#commitContent(content);
  }
  hasCommits() {
    return this.#hasCommits;
  }
  workingCopy() {
    return this.workingCopyContent().content || "";
  }
  workingCopyContent() {
    return this.workingCopyContentData().asDeferedContent();
  }
  workingCopyContentData() {
    if (this.#workingCopyGetter) {
      this.#workingCopy = this.#workingCopyGetter();
      this.#workingCopyGetter = null;
    }
    const contentData = this.#content ? TextUtils.ContentData.ContentData.contentDataOrEmpty(this.#content) : TextUtils.ContentData.EMPTY_TEXT_CONTENT_DATA;
    if (this.#workingCopy !== null) {
      return new TextUtils.ContentData.ContentData(
        this.#workingCopy,
        /* isBase64 */
        false,
        contentData.mimeType
      );
    }
    return contentData;
  }
  resetWorkingCopy() {
    this.#resetWorkingCopy();
    this.#workingCopyChanged();
  }
  #resetWorkingCopy() {
    this.#workingCopy = null;
    this.#workingCopyGetter = null;
    this.setContainsAiChanges(false);
  }
  setWorkingCopy(newWorkingCopy) {
    this.#workingCopy = newWorkingCopy;
    this.#workingCopyGetter = null;
    this.#workingCopyChanged();
  }
  setContainsAiChanges(containsAiChanges) {
    this.#containsAiChanges = containsAiChanges;
  }
  containsAiChanges() {
    return this.#containsAiChanges;
  }
  setContent(content, isBase64) {
    this.#contentEncoded = isBase64;
    if (this.#project.canSetFileContent()) {
      void this.#project.setFileContent(this, content, isBase64);
    }
    this.#contentCommitted(content, true);
  }
  setWorkingCopyGetter(workingCopyGetter) {
    this.#workingCopyGetter = workingCopyGetter;
    this.#workingCopyChanged();
  }
  #workingCopyChanged() {
    this.#removeAllMessages();
    this.dispatchEventToListeners("WorkingCopyChanged" /* WorkingCopyChanged */, this);
    this.#project.workspace().dispatchEventToListeners(WorkspaceImplEvents.WorkingCopyChanged, { uiSourceCode: this });
  }
  removeWorkingCopyGetter() {
    if (!this.#workingCopyGetter) {
      return;
    }
    this.#workingCopy = this.#workingCopyGetter();
    this.#workingCopyGetter = null;
  }
  commitWorkingCopy() {
    if (this.isDirty()) {
      this.#commitContent(this.workingCopy());
    }
  }
  isDirty() {
    return this.#workingCopy !== null || this.#workingCopyGetter !== null;
  }
  isKnownThirdParty() {
    return this.#isKnownThirdParty;
  }
  markKnownThirdParty() {
    this.#isKnownThirdParty = true;
  }
  /**
   * {@link markAsUnconditionallyIgnoreListed}
   */
  isUnconditionallyIgnoreListed() {
    return this.#isUnconditionallyIgnoreListed;
  }
  isFetchXHR() {
    return [Common.ResourceType.resourceTypes.XHR, Common.ResourceType.resourceTypes.Fetch].includes(
      this.contentType()
    );
  }
  /**
   * Unconditionally ignore list this UISourcecode, ignoring any user
   * setting. We use this to mark breakpoint/logpoint condition scripts for now.
   */
  markAsUnconditionallyIgnoreListed() {
    this.#isUnconditionallyIgnoreListed = true;
  }
  extension() {
    return Common.ParsedURL.ParsedURL.extractExtension(this.#name);
  }
  content() {
    if (!this.#content || "error" in this.#content) {
      return "";
    }
    return this.#content.text;
  }
  loadError() {
    return this.#content && "error" in this.#content && this.#content.error || null;
  }
  searchInContent(query, caseSensitive, isRegex) {
    if (!this.#content || "error" in this.#content) {
      return this.#project.searchInFileContent(this, query, caseSensitive, isRegex);
    }
    return Promise.resolve(
      TextUtils.TextUtils.performSearchInContentData(this.#content, query, caseSensitive, isRegex)
    );
  }
  contentLoaded() {
    return Boolean(this.#content);
  }
  uiLocation(lineNumber, columnNumber) {
    return new UILocation(this, lineNumber, columnNumber);
  }
  messages() {
    return this.#messages ? new Set(this.#messages) : /* @__PURE__ */ new Set();
  }
  addLineMessage(level, text, lineNumber, columnNumber, clickHandler) {
    const range = TextUtils.TextRange.TextRange.createFromLocation(lineNumber, columnNumber || 0);
    const message = new Message(level, text, clickHandler, range);
    this.addMessage(message);
    return message;
  }
  addMessage(message) {
    if (!this.#messages) {
      this.#messages = /* @__PURE__ */ new Set();
    }
    this.#messages.add(message);
    this.dispatchEventToListeners("MessageAdded" /* MessageAdded */, message);
  }
  removeMessage(message) {
    if (this.#messages?.delete(message)) {
      this.dispatchEventToListeners("MessageRemoved" /* MessageRemoved */, message);
    }
  }
  #removeAllMessages() {
    if (!this.#messages) {
      return;
    }
    for (const message of this.#messages) {
      this.dispatchEventToListeners("MessageRemoved" /* MessageRemoved */, message);
    }
    this.#messages = null;
  }
  setDecorationData(type, data) {
    if (data !== this.#decorations.get(type)) {
      this.#decorations.set(type, data);
      this.dispatchEventToListeners("DecorationChanged" /* DecorationChanged */, type);
    }
  }
  getDecorationData(type) {
    return this.#decorations.get(type);
  }
  disableEdit() {
    this.#disableEdit = true;
  }
  editDisabled() {
    return this.#disableEdit;
  }
  isIgnoreListed() {
    return IgnoreListManager.instance().isUserOrSourceMapIgnoreListedUISourceCode(this);
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["WorkingCopyChanged"] = "WorkingCopyChanged";
  Events2["WorkingCopyCommitted"] = "WorkingCopyCommitted";
  Events2["TitleChanged"] = "TitleChanged";
  Events2["MessageAdded"] = "MessageAdded";
  Events2["MessageRemoved"] = "MessageRemoved";
  Events2["DecorationChanged"] = "DecorationChanged";
  return Events2;
})(Events || {});
export class UILocation {
  uiSourceCode;
  lineNumber;
  columnNumber;
  constructor(uiSourceCode, lineNumber, columnNumber) {
    this.uiSourceCode = uiSourceCode;
    this.lineNumber = lineNumber;
    this.columnNumber = columnNumber;
  }
  linkText(skipTrim = false, showColumnNumber = false) {
    const displayName = this.uiSourceCode.displayName(skipTrim);
    const lineAndColumnText = this.lineAndColumnText(showColumnNumber);
    let text = lineAndColumnText ? displayName + ":" + lineAndColumnText : displayName;
    if (this.uiSourceCode.isDirty()) {
      text = "*" + text;
    }
    return text;
  }
  lineAndColumnText(showColumnNumber = false) {
    let lineAndColumnText;
    if (this.uiSourceCode.mimeType() === "application/wasm") {
      if (typeof this.columnNumber === "number") {
        lineAndColumnText = `0x${this.columnNumber.toString(16)}`;
      }
    } else {
      lineAndColumnText = `${this.lineNumber + 1}`;
      if (showColumnNumber && typeof this.columnNumber === "number") {
        lineAndColumnText += ":" + (this.columnNumber + 1);
      }
    }
    return lineAndColumnText;
  }
  id() {
    if (typeof this.columnNumber === "number") {
      return this.uiSourceCode.project().id() + ":" + this.uiSourceCode.url() + ":" + this.lineNumber + ":" + this.columnNumber;
    }
    return this.lineId();
  }
  lineId() {
    return this.uiSourceCode.project().id() + ":" + this.uiSourceCode.url() + ":" + this.lineNumber;
  }
  static comparator(location1, location2) {
    return location1.compareTo(location2);
  }
  compareTo(other) {
    if (this.uiSourceCode.url() !== other.uiSourceCode.url()) {
      return this.uiSourceCode.url() > other.uiSourceCode.url() ? 1 : -1;
    }
    if (this.lineNumber !== other.lineNumber) {
      return this.lineNumber - other.lineNumber;
    }
    if (this.columnNumber === other.columnNumber) {
      return 0;
    }
    if (typeof this.columnNumber !== "number") {
      return -1;
    }
    if (typeof other.columnNumber !== "number") {
      return 1;
    }
    return this.columnNumber - other.columnNumber;
  }
  isIgnoreListed() {
    return this.uiSourceCode.isIgnoreListed();
  }
}
export class UILocationRange {
  uiSourceCode;
  range;
  constructor(uiSourceCode, range) {
    this.uiSourceCode = uiSourceCode;
    this.range = range;
  }
}
export class UIFunctionBounds {
  uiSourceCode;
  range;
  name;
  constructor(uiSourceCode, range, name) {
    this.uiSourceCode = uiSourceCode;
    this.range = range;
    this.name = name;
  }
}
export class Message {
  #level;
  #text;
  range;
  #clickHandler;
  constructor(level, text, clickHandler, range) {
    this.#level = level;
    this.#text = text;
    this.range = range ?? new TextUtils.TextRange.TextRange(0, 0, 0, 0);
    this.#clickHandler = clickHandler;
  }
  level() {
    return this.#level;
  }
  text() {
    return this.#text;
  }
  clickHandler() {
    return this.#clickHandler;
  }
  lineNumber() {
    return this.range.startLine;
  }
  columnNumber() {
    return this.range.startColumn;
  }
  isEqual(another) {
    return this.text() === another.text() && this.level() === another.level() && this.range.equal(another.range);
  }
}
((Message2) => {
  let Level;
  ((Level2) => {
    Level2["ERROR"] = "Error";
    Level2["ISSUE"] = "Issue";
    Level2["WARNING"] = "Warning";
  })(Level = Message2.Level || (Message2.Level = {}));
})(Message || (Message = {}));
export class UISourceCodeMetadata {
  modificationTime;
  contentSize;
  constructor(modificationTime, contentSize) {
    this.modificationTime = modificationTime;
    this.contentSize = contentSize;
  }
}
export var DecoratorType = /* @__PURE__ */ ((DecoratorType2) => {
  DecoratorType2["PERFORMANCE"] = "performance";
  DecoratorType2["MEMORY"] = "memory";
  DecoratorType2["COVERAGE"] = "coverage";
  return DecoratorType2;
})(DecoratorType || {});
export function createMappedProfileData(profileData, originalToMappedLocation) {
  const mappedProfileData = /* @__PURE__ */ new Map();
  for (const [lineNumber, columnData] of profileData) {
    for (const [columnNumber, data] of columnData) {
      const mappedLocation = originalToMappedLocation(lineNumber - 1, columnNumber - 1);
      if (!mappedLocation) {
        continue;
      }
      const oneBasedFormattedLineNumber = mappedLocation[0] + 1;
      const oneBasedFormattedColumnNumber = mappedLocation[1] + 1;
      let mappedColumnData = mappedProfileData.get(oneBasedFormattedLineNumber);
      if (!mappedColumnData) {
        mappedColumnData = /* @__PURE__ */ new Map();
        mappedProfileData.set(oneBasedFormattedLineNumber, mappedColumnData);
      }
      mappedColumnData.set(
        oneBasedFormattedColumnNumber,
        (mappedColumnData.get(oneBasedFormattedColumnNumber) || 0) + data
      );
    }
  }
  return mappedProfileData;
}
//# sourceMappingURL=UISourceCode.js.map
