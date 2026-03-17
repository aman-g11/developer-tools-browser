"use strict";
import * as PuppeteerReplay from "../../../third_party/puppeteer-replay/puppeteer-replay.js";
export const EXTENSION_PREFIX = "extension_";
export class ExtensionConverter {
  #idx;
  #extension;
  constructor(idx, extension) {
    this.#idx = idx;
    this.#extension = extension;
  }
  getId() {
    return EXTENSION_PREFIX + this.#idx;
  }
  getFormatName() {
    return this.#extension.getName();
  }
  getMediaType() {
    return this.#extension.getMediaType();
  }
  getFilename(flow) {
    const fileExtension = this.#mediaTypeToExtension(
      this.#extension.getMediaType()
    );
    return `${flow.title}${fileExtension}`;
  }
  async stringify(flow) {
    const text = await this.#extension.stringify(flow);
    const sourceMap = PuppeteerReplay.parseSourceMap(text);
    return [PuppeteerReplay.stripSourceMap(text), sourceMap];
  }
  async stringifyStep(step) {
    return await this.#extension.stringifyStep(step);
  }
  #mediaTypeToExtension(mediaType) {
    switch (mediaType) {
      case "application/json":
        return ".json";
      case "application/javascript":
      case "text/javascript":
        return ".js";
      case "application/typescript":
      case "text/typescript":
        return ".ts";
      default:
        return "";
    }
  }
}
//# sourceMappingURL=ExtensionConverter.js.map
