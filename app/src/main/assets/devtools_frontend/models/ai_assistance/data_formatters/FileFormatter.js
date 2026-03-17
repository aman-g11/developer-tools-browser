"use strict";
import * as Bindings from "../../bindings/bindings.js";
import * as NetworkTimeCalculator from "../../network_time_calculator/network_time_calculator.js";
import { NetworkRequestFormatter } from "./NetworkRequestFormatter.js";
const MAX_FILE_SIZE = 1e4;
export class FileFormatter {
  static formatSourceMapDetails(selectedFile, debuggerWorkspaceBinding) {
    const mappedFileUrls = [];
    const sourceMapUrls = [];
    if (selectedFile.contentType().isFromSourceMap()) {
      for (const script of debuggerWorkspaceBinding.scriptsForUISourceCode(selectedFile)) {
        const uiSourceCode = debuggerWorkspaceBinding.uiSourceCodeForScript(script);
        if (uiSourceCode) {
          mappedFileUrls.push(uiSourceCode.url());
          if (script.sourceMapURL !== void 0) {
            sourceMapUrls.push(script.sourceMapURL);
          }
        }
      }
      for (const originURL of Bindings.SASSSourceMapping.SASSSourceMapping.uiSourceOrigin(selectedFile)) {
        mappedFileUrls.push(originURL);
      }
    } else if (selectedFile.contentType().isScript()) {
      for (const script of debuggerWorkspaceBinding.scriptsForUISourceCode(selectedFile)) {
        if (script.sourceMapURL !== void 0 && script.sourceMapURL !== "") {
          sourceMapUrls.push(script.sourceMapURL);
        }
      }
    }
    if (sourceMapUrls.length === 0) {
      return "";
    }
    let sourceMapDetails = "Source map: " + sourceMapUrls;
    if (mappedFileUrls.length > 0) {
      sourceMapDetails += "\nSource mapped from: " + mappedFileUrls;
    }
    return sourceMapDetails;
  }
  #file;
  constructor(file) {
    this.#file = file;
  }
  formatFile() {
    const debuggerWorkspaceBinding = Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance();
    const sourceMapDetails = FileFormatter.formatSourceMapDetails(this.#file, debuggerWorkspaceBinding);
    const lines = [
      `File name: ${this.#file.displayName()}`,
      `URL: ${this.#file.url()}`,
      sourceMapDetails
    ];
    const resource = Bindings.ResourceUtils.resourceForURL(this.#file.url());
    if (resource?.request) {
      const calculator = new NetworkTimeCalculator.NetworkTransferTimeCalculator();
      calculator.updateBoundaries(resource.request);
      lines.push(`Request initiator chain:
${new NetworkRequestFormatter(resource.request, calculator).formatRequestInitiatorChain()}`);
    }
    lines.push(`File content:
${this.#formatFileContent()}`);
    return lines.filter((line) => line.trim() !== "").join("\n");
  }
  #formatFileContent() {
    const contentData = this.#file.workingCopyContentData();
    const content = contentData.isTextContent ? contentData.text : "<binary data>";
    const truncated = content.length > MAX_FILE_SIZE ? content.slice(0, MAX_FILE_SIZE) + "..." : content;
    return `\`\`\`
${truncated}
\`\`\``;
  }
}
//# sourceMappingURL=FileFormatter.js.map
