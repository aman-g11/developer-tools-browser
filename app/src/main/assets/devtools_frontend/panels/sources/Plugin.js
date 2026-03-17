"use strict";
export class Plugin {
  constructor(uiSourceCode, _transformer) {
    this.uiSourceCode = uiSourceCode;
  }
  static accepts(_uiSourceCode) {
    return false;
  }
  willHide() {
  }
  rightToolbarItems() {
    return [];
  }
  /**
   *
   * TODO(szuend): It is OK to asyncify this function (similar to {rightToolbarItems}),
   *               but it is currently not strictly necessary.
   */
  leftToolbarItems() {
    return [];
  }
  populateLineGutterContextMenu(_contextMenu, _lineNumber) {
  }
  populateTextAreaContextMenu(_contextMenu, _lineNumber, _columnNumber) {
  }
  decorationChanged(_type, _editor) {
  }
  editorExtension() {
    return [];
  }
  editorInitialized(_editor) {
  }
  dispose() {
  }
}
//# sourceMappingURL=Plugin.js.map
