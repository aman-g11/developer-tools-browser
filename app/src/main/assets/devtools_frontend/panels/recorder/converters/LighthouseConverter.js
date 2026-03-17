"use strict";
import * as PuppeteerReplay from "../../../third_party/puppeteer-replay/puppeteer-replay.js";
import * as Models from "../models/models.js";
export class LighthouseConverter {
  #indent;
  constructor(indent) {
    this.#indent = indent;
  }
  getId() {
    return Models.ConverterIds.ConverterIds.LIGHTHOUSE;
  }
  getFormatName() {
    return "Puppeteer (including Lighthouse analysis)";
  }
  getFilename(flow) {
    return `${flow.title}.js`;
  }
  async stringify(flow) {
    const text = await PuppeteerReplay.stringify(flow, {
      extension: new PuppeteerReplay.LighthouseStringifyExtension(),
      indentation: this.#indent
    });
    const sourceMap = PuppeteerReplay.parseSourceMap(text);
    return [PuppeteerReplay.stripSourceMap(text), sourceMap];
  }
  async stringifyStep(step) {
    return await PuppeteerReplay.stringifyStep(step, {
      indentation: this.#indent
    });
  }
  getMediaType() {
    return "text/javascript";
  }
}
//# sourceMappingURL=LighthouseConverter.js.map
