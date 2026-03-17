"use strict";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import { toHexString } from "./LinearMemoryInspectorUtils.js";
import linearMemoryViewerStyles from "./linearMemoryViewer.css.js";
const { render, html } = Lit;
export class ByteSelectedEvent extends Event {
  static eventName = "byteselected";
  data;
  constructor(address) {
    super(ByteSelectedEvent.eventName);
    this.data = address;
  }
}
export class ResizeEvent extends Event {
  static eventName = "resize";
  data;
  constructor(numBytesPerPage) {
    super(ResizeEvent.eventName);
    this.data = numBytesPerPage;
  }
}
const BYTE_GROUP_MARGIN = 8;
const BYTE_GROUP_SIZE = 4;
export class LinearMemoryViewer extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #resizeObserver = new ResizeObserver(() => requestAnimationFrame(this.#resize.bind(this)));
  #isObservingResize = false;
  #memory = new Uint8Array();
  #address = 0;
  #memoryOffset = 0;
  #highlightInfo;
  #focusedMemoryHighlight;
  #numRows = 1;
  #numBytesInRow = BYTE_GROUP_SIZE;
  #focusOnByte = true;
  #lastKeyUpdateSent = void 0;
  set data(data) {
    if (data.address < data.memoryOffset || data.address > data.memoryOffset + data.memory.length || data.address < 0) {
      throw new Error("Address is out of bounds.");
    }
    if (data.memoryOffset < 0) {
      throw new Error("Memory offset has to be greater or equal to zero.");
    }
    this.#memory = data.memory;
    this.#address = data.address;
    this.#highlightInfo = data.highlightInfo;
    this.#focusedMemoryHighlight = data.focusedMemoryHighlight;
    this.#memoryOffset = data.memoryOffset;
    this.#focusOnByte = data.focus;
    this.#update();
  }
  connectedCallback() {
    this.style.setProperty("--byte-group-margin", `${BYTE_GROUP_MARGIN}px`);
  }
  disconnectedCallback() {
    this.#isObservingResize = false;
    this.#resizeObserver.disconnect();
  }
  #update() {
    this.#updateDimensions();
    this.#render();
    this.#focusOnView();
    this.#engageResizeObserver();
  }
  #focusOnView() {
    if (this.#focusOnByte) {
      const view = this.#shadow.querySelector(".view");
      if (view) {
        view.focus();
      }
    }
  }
  #resize() {
    this.#update();
    this.dispatchEvent(new ResizeEvent(this.#numBytesInRow * this.#numRows));
  }
  /** Recomputes the number of rows and (byte) columns that fit into the current view. */
  #updateDimensions() {
    if (this.clientWidth === 0 || this.clientHeight === 0 || !this.shadowRoot) {
      this.#numBytesInRow = BYTE_GROUP_SIZE;
      this.#numRows = 1;
      return;
    }
    const firstByteCell = this.shadowRoot.querySelector(".byte-cell");
    const textCell = this.shadowRoot.querySelector(".text-cell");
    const divider = this.shadowRoot.querySelector(".divider");
    const rowElement = this.shadowRoot.querySelector(".row");
    const addressText = this.shadowRoot.querySelector(".address");
    if (!firstByteCell || !textCell || !divider || !rowElement || !addressText) {
      this.#numBytesInRow = BYTE_GROUP_SIZE;
      this.#numRows = 1;
      return;
    }
    const byteCellWidth = firstByteCell.getBoundingClientRect().width;
    const textCellWidth = textCell.getBoundingClientRect().width;
    const groupWidth = BYTE_GROUP_SIZE * (byteCellWidth + textCellWidth) + BYTE_GROUP_MARGIN;
    const dividerWidth = divider.getBoundingClientRect().width;
    const addressTextAndDividerWidth = firstByteCell.getBoundingClientRect().left - addressText.getBoundingClientRect().left;
    const widthToFill = this.clientWidth - 1 - addressTextAndDividerWidth - dividerWidth;
    if (widthToFill < groupWidth) {
      this.#numBytesInRow = BYTE_GROUP_SIZE;
      this.#numRows = 1;
      return;
    }
    this.#numBytesInRow = Math.floor(widthToFill / groupWidth) * BYTE_GROUP_SIZE;
    this.#numRows = Math.floor(this.clientHeight / rowElement.clientHeight);
  }
  #engageResizeObserver() {
    if (!this.#resizeObserver || this.#isObservingResize) {
      return;
    }
    this.#resizeObserver.observe(this);
    this.#isObservingResize = true;
  }
  #render() {
    const jslog = VisualLogging.section().track({ keydown: "ArrowUp|ArrowDown|ArrowLeft|ArrowRight|PageUp|PageDown" }).context("linear-memory-inspector.viewer");
    render(html`
      <style>${linearMemoryViewerStyles}</style>
      <div class="view" tabindex="0" @keydown=${this.#onKeyDown} jslog=${jslog}>
        ${this.#renderView()}
      </div>
      `, this.#shadow, { host: this });
  }
  #onKeyDown(event) {
    const keyboardEvent = event;
    let newAddress = void 0;
    if (keyboardEvent.code === "ArrowUp") {
      newAddress = this.#address - this.#numBytesInRow;
    } else if (keyboardEvent.code === "ArrowDown") {
      newAddress = this.#address + this.#numBytesInRow;
    } else if (keyboardEvent.code === "ArrowLeft") {
      newAddress = this.#address - 1;
    } else if (keyboardEvent.code === "ArrowRight") {
      newAddress = this.#address + 1;
    } else if (keyboardEvent.code === "PageUp") {
      newAddress = this.#address - this.#numBytesInRow * this.#numRows;
    } else if (keyboardEvent.code === "PageDown") {
      newAddress = this.#address + this.#numBytesInRow * this.#numRows;
    }
    if (newAddress !== void 0 && newAddress !== this.#lastKeyUpdateSent) {
      this.#lastKeyUpdateSent = newAddress;
      this.dispatchEvent(new ByteSelectedEvent(newAddress));
    }
  }
  #renderView() {
    const itemTemplates = [];
    for (let i = 0; i < this.#numRows; ++i) {
      itemTemplates.push(this.#renderRow(i));
    }
    return html`${itemTemplates}`;
  }
  #renderRow(row) {
    const { startIndex, endIndex } = { startIndex: row * this.#numBytesInRow, endIndex: (row + 1) * this.#numBytesInRow };
    const classMap = {
      address: true,
      selected: Math.floor((this.#address - this.#memoryOffset) / this.#numBytesInRow) === row
    };
    return html`
    <div class="row">
      <span class=${Lit.Directives.classMap(classMap)}>${toHexString({ number: startIndex + this.#memoryOffset, pad: 8, prefix: false })}</span>
      <span class="divider"></span>
      ${this.#renderByteValues(startIndex, endIndex)}
      <span class="divider"></span>
      ${this.#renderCharacterValues(startIndex, endIndex)}
    </div>
    `;
  }
  #renderByteValues(startIndex, endIndex) {
    const cells = [];
    for (let i = startIndex; i < endIndex; ++i) {
      const actualIndex = i + this.#memoryOffset;
      const addMargin = i !== startIndex && (i - startIndex) % BYTE_GROUP_SIZE === 0;
      const selected = i === this.#address - this.#memoryOffset;
      const shouldBeHighlighted = this.#shouldBeHighlighted(actualIndex);
      const focusedMemoryArea = this.#isFocusedArea(actualIndex);
      const classMap = {
        cell: true,
        "byte-cell": true,
        "byte-group-margin": addMargin,
        selected,
        "highlight-area": shouldBeHighlighted,
        "focused-area": focusedMemoryArea
      };
      const isSelectableCell = i < this.#memory.length;
      const byteValue = isSelectableCell ? html`${toHexString({ number: this.#memory[i], pad: 2, prefix: false })}` : "";
      const onSelectedByte = isSelectableCell ? this.#onSelectedByte.bind(this, actualIndex) : "";
      const jslog = VisualLogging.tableCell("linear-memory-inspector.byte-cell").track({ click: true });
      cells.push(html`<span class=${Lit.Directives.classMap(classMap)} @click=${onSelectedByte} jslog=${jslog}>${byteValue}</span>`);
    }
    return html`${cells}`;
  }
  #renderCharacterValues(startIndex, endIndex) {
    const cells = [];
    for (let i = startIndex; i < endIndex; ++i) {
      const actualIndex = i + this.#memoryOffset;
      const shouldBeHighlighted = this.#shouldBeHighlighted(actualIndex);
      const focusedMemoryArea = this.#isFocusedArea(actualIndex);
      const classMap = {
        cell: true,
        "text-cell": true,
        selected: this.#address - this.#memoryOffset === i,
        "highlight-area": shouldBeHighlighted,
        "focused-area": focusedMemoryArea
      };
      const isSelectableCell = i < this.#memory.length;
      const value = isSelectableCell ? html`${this.#toAscii(this.#memory[i])}` : "";
      const onSelectedByte = isSelectableCell ? this.#onSelectedByte.bind(this, i + this.#memoryOffset) : "";
      const jslog = VisualLogging.tableCell("linear-memory-inspector.text-cell").track({ click: true });
      cells.push(html`<span class=${Lit.Directives.classMap(classMap)} @click=${onSelectedByte} jslog=${jslog}>${value}</span>`);
    }
    return html`${cells}`;
  }
  #toAscii(byte) {
    if (byte >= 20 && byte <= 127) {
      return String.fromCharCode(byte);
    }
    return ".";
  }
  #onSelectedByte(index) {
    this.dispatchEvent(new ByteSelectedEvent(index));
  }
  #shouldBeHighlighted(index) {
    if (this.#highlightInfo === void 0) {
      return false;
    }
    return this.#highlightInfo.startAddress <= index && index < this.#highlightInfo.startAddress + this.#highlightInfo.size;
  }
  #isFocusedArea(index) {
    if (!this.#focusedMemoryHighlight) {
      return false;
    }
    return this.#focusedMemoryHighlight.startAddress <= index && index < this.#focusedMemoryHighlight.startAddress + this.#focusedMemoryHighlight.size;
  }
}
customElements.define("devtools-linear-memory-inspector-viewer", LinearMemoryViewer);
//# sourceMappingURL=LinearMemoryViewer.js.map
