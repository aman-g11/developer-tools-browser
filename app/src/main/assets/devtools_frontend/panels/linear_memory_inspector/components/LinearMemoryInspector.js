"use strict";
import "./LinearMemoryViewer.js";
import * as Common from "../../../core/common/common.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as UI from "../../../ui/legacy/legacy.js";
import { html, nothing, render } from "../../../ui/lit/lit.js";
import { LinearMemoryHighlightChipList } from "./LinearMemoryHighlightChipList.js";
import linearMemoryInspectorStyles from "./linearMemoryInspector.css.js";
import { formatAddress, parseAddress } from "./LinearMemoryInspectorUtils.js";
import {
  Mode,
  Navigation
} from "./LinearMemoryNavigator.js";
import { LinearMemoryValueInterpreter } from "./LinearMemoryValueInterpreter.js";
import {
  Endianness,
  getDefaultValueTypeMapping,
  VALUE_INTEPRETER_MAX_NUM_BYTES
} from "./ValueInterpreterDisplayUtils.js";
const UIStrings = {
  /**
   * @description Tooltip text that appears when hovering over an invalid address in the address line in the Linear memory inspector
   * @example {0x00000000} PH1
   * @example {0x00400000} PH2
   */
  addressHasToBeANumberBetweenSAnd: "Address has to be a number between {PH1} and {PH2}"
};
const str_ = i18n.i18n.registerUIStrings("panels/linear_memory_inspector/components/LinearMemoryInspector.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { widget } = UI.Widget;
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["MEMORY_REQUEST"] = "MemoryRequest";
  Events2["ADDRESS_CHANGED"] = "AddressChanged";
  Events2["SETTINGS_CHANGED"] = "SettingsChanged";
  Events2["DELETE_MEMORY_HIGHLIGHT"] = "DeleteMemoryHighlight";
  return Events2;
})(Events || {});
class AddressHistoryEntry {
  #address = 0;
  #callback;
  constructor(address, callback) {
    if (address < 0) {
      throw new Error("Address should be a greater or equal to zero");
    }
    this.#address = address;
    this.#callback = callback;
  }
  valid() {
    return true;
  }
  reveal() {
    this.#callback(this.#address);
  }
}
export const DEFAULT_VIEW = (input, _output, target) => {
  const navigatorAddressToShow = input.currentNavigatorMode === Mode.SUBMITTED ? formatAddress(input.address) : input.currentNavigatorAddressLine;
  const navigatorAddressIsValid = isValidAddress(navigatorAddressToShow, input.outerMemoryLength);
  const invalidAddressMsg = i18nString(
    UIStrings.addressHasToBeANumberBetweenSAnd,
    { PH1: formatAddress(0), PH2: formatAddress(input.outerMemoryLength) }
  );
  const errorMsg = navigatorAddressIsValid ? void 0 : invalidAddressMsg;
  const highlightedMemoryAreas = input.highlightInfo ? [input.highlightInfo] : [];
  const focusedMemoryHighlight = getSmallestEnclosingMemoryHighlight(highlightedMemoryAreas, input.address);
  render(
    html`
    <style>${linearMemoryInspectorStyles}</style>
    <div class="view">
      <devtools-linear-memory-inspector-navigator
        .data=${{
      address: navigatorAddressToShow,
      valid: navigatorAddressIsValid,
      mode: input.currentNavigatorMode,
      error: errorMsg,
      canGoBackInHistory: input.canGoBackInHistory,
      canGoForwardInHistory: input.canGoForwardInHistory
    }}
        @refreshrequested=${input.onRefreshRequest}
        @addressinputchanged=${input.onAddressChange}
        @pagenavigation=${input.onNavigatePage}
        @historynavigation=${input.onNavigateHistory}></devtools-linear-memory-inspector-navigator>
      ${widget(LinearMemoryHighlightChipList, {
      highlightInfos: highlightedMemoryAreas,
      focusedMemoryHighlight,
      jumpToAddress: (address) => input.onJumpToAddress(address),
      deleteHighlight: input.onDeleteMemoryHighlight
    })}
      <devtools-linear-memory-inspector-viewer
        .data=${{
      memory: input.memorySlice,
      address: input.address,
      memoryOffset: input.viewerStart,
      focus: input.currentNavigatorMode === Mode.SUBMITTED,
      highlightInfo: input.highlightInfo,
      focusedMemoryHighlight
    }}
        @byteselected=${input.onByteSelected}
        @resize=${input.onResize}>
      </devtools-linear-memory-inspector-viewer>
    </div>
    ${input.hideValueInspector ? nothing : html`
    <div class="value-interpreter">
      ${widget(LinearMemoryValueInterpreter, {
      buffer: input.memory.slice(
        input.address - input.memoryOffset,
        input.address + VALUE_INTEPRETER_MAX_NUM_BYTES
      ).buffer,
      valueTypes: input.valueTypes,
      valueTypeModes: input.valueTypeModes,
      endianness: input.endianness,
      memoryLength: input.outerMemoryLength,
      onValueTypeModeChange: input.onValueTypeModeChanged,
      onJumpToAddressClicked: input.onJumpToAddress,
      onValueTypeToggled: input.onValueTypeToggled,
      onEndiannessChanged: input.onEndiannessChanged
    })}
    </div>`}
    `,
    target
  );
};
function getPageRangeForAddress(address, numBytesPerPage, outerMemoryLength) {
  const pageNumber = Math.floor(address / numBytesPerPage);
  const pageStartAddress = pageNumber * numBytesPerPage;
  const pageEndAddress = Math.min(pageStartAddress + numBytesPerPage, outerMemoryLength);
  return { start: pageStartAddress, end: pageEndAddress };
}
function isValidAddress(address, outerMemoryLength) {
  const newAddress = parseAddress(address);
  return newAddress !== void 0 && newAddress >= 0 && newAddress < outerMemoryLength;
}
function getSmallestEnclosingMemoryHighlight(highlightedMemoryAreas, address) {
  let smallestEnclosingHighlight;
  for (const highlightedMemory of highlightedMemoryAreas) {
    if (highlightedMemory.startAddress <= address && address < highlightedMemory.startAddress + highlightedMemory.size) {
      if (!smallestEnclosingHighlight) {
        smallestEnclosingHighlight = highlightedMemory;
      } else if (highlightedMemory.size < smallestEnclosingHighlight.size) {
        smallestEnclosingHighlight = highlightedMemory;
      }
    }
  }
  return smallestEnclosingHighlight;
}
export class LinearMemoryInspector extends Common.ObjectWrapper.eventMixin(
  UI.Widget.Widget
) {
  #history = new Common.SimpleHistoryManager.SimpleHistoryManager(10);
  #memory = new Uint8Array();
  #memoryOffset = 0;
  #outerMemoryLength = 0;
  #address = -1;
  #highlightInfo;
  #currentNavigatorMode = Mode.SUBMITTED;
  #currentNavigatorAddressLine = `${this.#address}`;
  #numBytesPerPage = 4;
  #valueTypeModes = getDefaultValueTypeMapping();
  #valueTypes = new Set(this.#valueTypeModes.keys());
  #endianness = Endianness.LITTLE;
  #hideValueInspector = false;
  #view;
  constructor(element, view) {
    super(element);
    this.#view = view ?? DEFAULT_VIEW;
  }
  set memory(value) {
    this.#memory = value;
    void this.requestUpdate();
  }
  set memoryOffset(value) {
    this.#memoryOffset = value;
    void this.requestUpdate();
  }
  set outerMemoryLength(value) {
    this.#outerMemoryLength = value;
    void this.requestUpdate();
  }
  set highlightInfo(value) {
    this.#highlightInfo = value;
    void this.requestUpdate();
  }
  set valueTypeModes(value) {
    this.#valueTypeModes = value;
    void this.requestUpdate();
  }
  set valueTypes(value) {
    this.#valueTypes = value;
    void this.requestUpdate();
  }
  set endianness(value) {
    this.#endianness = value;
    void this.requestUpdate();
  }
  set hideValueInspector(value) {
    this.#hideValueInspector = value;
    void this.requestUpdate();
  }
  get hideValueInspector() {
    return this.#hideValueInspector;
  }
  performUpdate() {
    const { start, end } = getPageRangeForAddress(this.#address, this.#numBytesPerPage, this.#outerMemoryLength);
    if (start < this.#memoryOffset || end > this.#memoryOffset + this.#memory.length) {
      this.dispatchEventToListeners("MemoryRequest" /* MEMORY_REQUEST */, { start, end, address: this.#address });
      return;
    }
    if (this.#address < this.#memoryOffset || this.#address > this.#memoryOffset + this.#memory.length || this.#address < 0) {
      throw new Error("Address is out of bounds.");
    }
    if (this.#highlightInfo) {
      if (this.#highlightInfo.size < 0) {
        this.#highlightInfo = void 0;
        throw new Error("Object size has to be greater than or equal to zero");
      }
      if (this.#highlightInfo.startAddress < 0 || this.#highlightInfo.startAddress >= this.#outerMemoryLength) {
        this.#highlightInfo = void 0;
        throw new Error("Object start address is out of bounds.");
      }
    }
    const viewInput = {
      memory: this.#memory,
      address: this.#address,
      memoryOffset: this.#memoryOffset,
      outerMemoryLength: this.#outerMemoryLength,
      valueTypes: this.#valueTypes,
      valueTypeModes: this.#valueTypeModes,
      endianness: this.#endianness,
      highlightInfo: this.#highlightInfo,
      hideValueInspector: this.#hideValueInspector,
      currentNavigatorMode: this.#currentNavigatorMode,
      currentNavigatorAddressLine: this.#currentNavigatorAddressLine,
      canGoBackInHistory: this.#history.canRollback(),
      canGoForwardInHistory: this.#history.canRollover(),
      onRefreshRequest: this.#onRefreshRequest.bind(this),
      onAddressChange: this.#onAddressChange.bind(this),
      onNavigatePage: this.#navigatePage.bind(this),
      onNavigateHistory: this.#navigateHistory.bind(this),
      onJumpToAddress: this.#onJumpToAddress.bind(this),
      onDeleteMemoryHighlight: this.#onDeleteMemoryHighlight.bind(this),
      onByteSelected: this.#onByteSelected.bind(this),
      onResize: this.#resize.bind(this),
      onValueTypeToggled: this.#onValueTypeToggled.bind(this),
      onValueTypeModeChanged: this.#onValueTypeModeChanged.bind(this),
      onEndiannessChanged: this.#onEndiannessChanged.bind(this),
      memorySlice: this.#memory.slice(start - this.#memoryOffset, end - this.#memoryOffset),
      viewerStart: start
    };
    this.#view(viewInput, {}, this.contentElement);
  }
  #onJumpToAddress(address) {
    this.#currentNavigatorMode = Mode.SUBMITTED;
    const addressInRange = Math.max(0, Math.min(address, this.#outerMemoryLength - 1));
    this.#jumpToAddress(addressInRange);
  }
  #onDeleteMemoryHighlight(highlight) {
    this.dispatchEventToListeners("DeleteMemoryHighlight" /* DELETE_MEMORY_HIGHLIGHT */, highlight);
  }
  #onRefreshRequest() {
    const { start, end } = getPageRangeForAddress(this.#address, this.#numBytesPerPage, this.#outerMemoryLength);
    this.dispatchEventToListeners("MemoryRequest" /* MEMORY_REQUEST */, { start, end, address: this.#address });
  }
  #onByteSelected(e) {
    this.#currentNavigatorMode = Mode.SUBMITTED;
    const addressInRange = Math.max(0, Math.min(e.data, this.#outerMemoryLength - 1));
    this.#jumpToAddress(addressInRange);
  }
  #createSettings() {
    return { valueTypes: this.#valueTypes, modes: this.#valueTypeModes, endianness: this.#endianness };
  }
  #onEndiannessChanged(endianness) {
    this.#endianness = endianness;
    this.dispatchEventToListeners("SettingsChanged" /* SETTINGS_CHANGED */, this.#createSettings());
    void this.requestUpdate();
  }
  #onAddressChange(e) {
    const { address, mode } = e.data;
    const isValid = isValidAddress(address, this.#outerMemoryLength);
    const newAddress = parseAddress(address);
    this.#currentNavigatorAddressLine = address;
    if (newAddress !== void 0 && isValid) {
      this.#currentNavigatorMode = mode;
      this.#jumpToAddress(newAddress);
      return;
    }
    if (mode === Mode.SUBMITTED && !isValid) {
      this.#currentNavigatorMode = Mode.INVALID_SUBMIT;
    } else {
      this.#currentNavigatorMode = Mode.EDIT;
    }
    void this.requestUpdate();
  }
  #onValueTypeToggled(type, checked) {
    const valueTypes = new Set(this.#valueTypes);
    if (checked) {
      valueTypes.add(type);
    } else {
      valueTypes.delete(type);
    }
    this.#valueTypes = valueTypes;
    this.dispatchEventToListeners("SettingsChanged" /* SETTINGS_CHANGED */, this.#createSettings());
    void this.requestUpdate();
  }
  #onValueTypeModeChanged(type, mode) {
    const valueTypeModes = new Map(this.#valueTypeModes);
    valueTypeModes.set(type, mode);
    this.#valueTypeModes = valueTypeModes;
    this.dispatchEventToListeners("SettingsChanged" /* SETTINGS_CHANGED */, this.#createSettings());
    void this.requestUpdate();
  }
  #navigateHistory(e) {
    return e.data === Navigation.FORWARD ? this.#history.rollover() : this.#history.rollback();
  }
  #navigatePage(e) {
    const newAddress = e.data === Navigation.FORWARD ? this.#address + this.#numBytesPerPage : this.#address - this.#numBytesPerPage;
    const addressInRange = Math.max(0, Math.min(newAddress, this.#outerMemoryLength - 1));
    this.#jumpToAddress(addressInRange);
  }
  #jumpToAddress(address) {
    if (address < 0 || address >= this.#outerMemoryLength) {
      console.warn(`Specified address is out of bounds: ${address}`);
      return;
    }
    this.address = address;
    void this.requestUpdate();
  }
  #resize(event) {
    this.#numBytesPerPage = event.data;
    void this.requestUpdate();
  }
  set address(address) {
    if (this.#address === address) {
      return;
    }
    const historyEntry = new AddressHistoryEntry(address, () => this.#jumpToAddress(address));
    this.#history.push(historyEntry);
    this.#address = address;
    this.dispatchEventToListeners("AddressChanged" /* ADDRESS_CHANGED */, this.#address);
    void this.requestUpdate();
  }
}
//# sourceMappingURL=LinearMemoryInspector.js.map
