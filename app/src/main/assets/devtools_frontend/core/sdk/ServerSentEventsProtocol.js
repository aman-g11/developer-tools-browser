"use strict";
export class ServerSentEventsParser {
  #onEventCallback;
  #decoder;
  // Parser state.
  #isRecognizingCrLf = false;
  #line = "";
  #id = "";
  #data = "";
  #eventType = "";
  constructor(callback, encodingLabel) {
    this.#onEventCallback = callback;
    this.#decoder = new Base64TextDecoder(this.#onTextChunk.bind(this), encodingLabel);
  }
  async addBase64Chunk(raw) {
    await this.#decoder.addBase64Chunk(raw);
  }
  addTextChunk(chunk) {
    this.#onTextChunk(chunk);
  }
  #onTextChunk(chunk) {
    let start = 0;
    for (let i = 0; i < chunk.length; ++i) {
      if (this.#isRecognizingCrLf && chunk[i] === "\n") {
        this.#isRecognizingCrLf = false;
        ++start;
        continue;
      }
      this.#isRecognizingCrLf = false;
      if (chunk[i] === "\r" || chunk[i] === "\n") {
        this.#line += chunk.substring(start, i);
        this.#parseLine();
        this.#line = "";
        start = i + 1;
        this.#isRecognizingCrLf = chunk[i] === "\r";
      }
    }
    this.#line += chunk.substring(start);
  }
  #parseLine() {
    if (this.#line.length === 0) {
      if (this.#data.length > 0) {
        const data = this.#data.slice(0, -1);
        this.#onEventCallback(this.#eventType || "message", data, this.#id);
        this.#data = "";
      }
      this.#eventType = "";
      return;
    }
    let fieldNameEnd = this.#line.indexOf(":");
    let fieldValueStart;
    if (fieldNameEnd < 0) {
      fieldNameEnd = this.#line.length;
      fieldValueStart = fieldNameEnd;
    } else {
      fieldValueStart = fieldNameEnd + 1;
      if (fieldValueStart < this.#line.length && this.#line[fieldValueStart] === " ") {
        ++fieldValueStart;
      }
    }
    const fieldName = this.#line.substring(0, fieldNameEnd);
    if (fieldName === "event") {
      this.#eventType = this.#line.substring(fieldValueStart);
      return;
    }
    if (fieldName === "data") {
      this.#data += this.#line.substring(fieldValueStart);
      this.#data += "\n";
    }
    if (fieldName === "id") {
      this.#id = this.#line.substring(fieldValueStart);
    }
  }
}
class Base64TextDecoder {
  #decoder;
  #writer;
  constructor(onTextChunk, encodingLabel) {
    this.#decoder = new TextDecoderStream(encodingLabel);
    this.#writer = this.#decoder.writable.getWriter();
    void this.#decoder.readable.pipeTo(new WritableStream({ write: onTextChunk }));
  }
  async addBase64Chunk(chunk) {
    const binString = window.atob(chunk);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    await this.#writer.ready;
    await this.#writer.write(bytes);
  }
}
//# sourceMappingURL=ServerSentEventsProtocol.js.map
