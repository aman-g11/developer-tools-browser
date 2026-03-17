"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _mimeType, _EditableContent_instances, highlight_fn, _suggestions, _handleKeyDownEvent, _SuggestionBox_instances, moveCursor_fn, dispatchSuggestEvent_fn, _cachedEditableContent, _SuggestionInput_instances, editableContent_get, _handleBlurEvent, _handleFocusEvent, _handleKeyDownEvent2, _handleInputEvent, _handleSuggestionInitEvent, _handleSuggestEvent;
import * as CodeHighlighter from "../../../ui/components/code_highlighter/code_highlighter.js";
import codeHighlighterStyles from "../../../ui/components/code_highlighter/codeHighlighter.css.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import contentEditableStyles from "./suggestionInput.css.js";
const mod = (a, n) => {
  return (a % n + n) % n;
};
function assert(predicate, message = "Assertion failed!") {
  if (!predicate) {
    throw new Error(message);
  }
}
const { html, Decorators, Directives, LitElement } = Lit;
const { customElement, property, state } = Decorators;
const { classMap } = Directives;
const jsonPropertyOptions = {
  hasChanged(value, oldValue) {
    return JSON.stringify(value) !== JSON.stringify(oldValue);
  },
  attribute: false
};
let EditableContent = class extends HTMLElement {
  constructor() {
    super();
    __privateAdd(this, _EditableContent_instances);
    __privateAdd(this, _mimeType, "");
    this.contentEditable = "true";
    this.tabIndex = 0;
    this.addEventListener("focus", () => {
      this.innerHTML = this.innerText;
    });
    this.addEventListener("blur", __privateMethod(this, _EditableContent_instances, highlight_fn).bind(this));
  }
  static get observedAttributes() {
    return ["disabled", "placeholder"];
  }
  set disabled(disabled) {
    this.contentEditable = String(!disabled);
  }
  get disabled() {
    return this.contentEditable !== "true";
  }
  set value(value) {
    this.innerText = value;
    __privateMethod(this, _EditableContent_instances, highlight_fn).call(this);
  }
  get value() {
    return this.innerText;
  }
  set mimeType(type) {
    __privateSet(this, _mimeType, type);
    __privateMethod(this, _EditableContent_instances, highlight_fn).call(this);
  }
  get mimeType() {
    return __privateGet(this, _mimeType);
  }
  attributeChangedCallback(name, _, value) {
    switch (name) {
      case "disabled":
        this.disabled = value !== null;
        break;
    }
  }
};
_mimeType = new WeakMap();
_EditableContent_instances = new WeakSet();
highlight_fn = function() {
  if (__privateGet(this, _mimeType)) {
    void CodeHighlighter.CodeHighlighter.highlightNode(this, __privateGet(this, _mimeType));
  }
};
EditableContent = __decorateClass([
  customElement("devtools-editable-content")
], EditableContent);
class SuggestEvent extends Event {
  static eventName = "suggest";
  constructor(suggestion) {
    super(SuggestEvent.eventName);
    this.suggestion = suggestion;
  }
}
class SuggestionInitEvent extends Event {
  static eventName = "suggestioninit";
  listeners;
  constructor(listeners) {
    super(SuggestionInitEvent.eventName);
    this.listeners = listeners;
  }
}
const defaultSuggestionFilter = (option, query) => option.toLowerCase().startsWith(query.toLowerCase());
let SuggestionBox = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _SuggestionBox_instances);
    __privateAdd(this, _suggestions, []);
    __privateAdd(this, _handleKeyDownEvent, (event) => {
      assert(event instanceof KeyboardEvent, "Bound to the wrong event.");
      if (__privateGet(this, _suggestions).length > 0) {
        switch (event.key) {
          case "ArrowDown":
            event.stopPropagation();
            event.preventDefault();
            __privateMethod(this, _SuggestionBox_instances, moveCursor_fn).call(this, 1);
            break;
          case "ArrowUp":
            event.stopPropagation();
            event.preventDefault();
            __privateMethod(this, _SuggestionBox_instances, moveCursor_fn).call(this, -1);
            break;
        }
      }
      switch (event.key) {
        case "Enter":
          if (__privateGet(this, _suggestions)[this.cursor]) {
            __privateMethod(this, _SuggestionBox_instances, dispatchSuggestEvent_fn).call(this, __privateGet(this, _suggestions)[this.cursor]);
          }
          event.preventDefault();
          break;
      }
    });
    this.options = [];
    this.expression = "";
    this.cursor = 0;
  }
  connectedCallback() {
    super.connectedCallback();
    this.dispatchEvent(
      new SuggestionInitEvent([["keydown", __privateGet(this, _handleKeyDownEvent)]])
    );
  }
  willUpdate(changedProperties) {
    if (changedProperties.has("options")) {
      this.options = Object.freeze([...this.options].sort());
    }
    if (changedProperties.has("expression") || changedProperties.has("options")) {
      this.cursor = 0;
      __privateSet(this, _suggestions, this.options.filter(
        (option) => (this.suggestionFilter || defaultSuggestionFilter)(option, this.expression)
      ));
    }
  }
  render() {
    if (__privateGet(this, _suggestions).length === 0) {
      return;
    }
    return html`<style>${contentEditableStyles}</style><ul class="suggestions">
      ${__privateGet(this, _suggestions).map((suggestion, index) => html`
        <li class=${classMap({ selected: index === this.cursor })}
            @mousedown=${__privateMethod(this, _SuggestionBox_instances, dispatchSuggestEvent_fn).bind(this, suggestion)}
            jslog=${VisualLogging.item("suggestion").track({ click: true, resize: true })}>
          ${suggestion}
        </li>`)}
    </ul>`;
  }
};
_suggestions = new WeakMap();
_handleKeyDownEvent = new WeakMap();
_SuggestionBox_instances = new WeakSet();
moveCursor_fn = function(delta) {
  this.cursor = mod(this.cursor + delta, __privateGet(this, _suggestions).length);
};
dispatchSuggestEvent_fn = function(suggestion) {
  this.dispatchEvent(new SuggestEvent(suggestion));
};
__decorateClass([
  property(jsonPropertyOptions)
], SuggestionBox.prototype, "options", 2);
__decorateClass([
  property()
], SuggestionBox.prototype, "expression", 2);
__decorateClass([
  property()
], SuggestionBox.prototype, "suggestionFilter", 2);
__decorateClass([
  state()
], SuggestionBox.prototype, "cursor", 2);
SuggestionBox = __decorateClass([
  customElement("devtools-suggestion-box")
], SuggestionBox);
export let SuggestionInput = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _SuggestionInput_instances);
    __privateAdd(this, _cachedEditableContent);
    __privateAdd(this, _handleBlurEvent, () => {
      window.getSelection()?.removeAllRanges();
      this.value = __privateGet(this, _SuggestionInput_instances, editableContent_get).value;
      this.expression = __privateGet(this, _SuggestionInput_instances, editableContent_get).value;
    });
    __privateAdd(this, _handleFocusEvent, (event) => {
      assert(event.target instanceof Node);
      const range = document.createRange();
      range.selectNodeContents(event.target);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    __privateAdd(this, _handleKeyDownEvent2, (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
    __privateAdd(this, _handleInputEvent, (event) => {
      this.expression = event.target.value;
    });
    __privateAdd(this, _handleSuggestionInitEvent, (event) => {
      for (const [name, listener] of event.listeners) {
        this.addEventListener(name, listener);
      }
    });
    __privateAdd(this, _handleSuggestEvent, (event) => {
      __privateGet(this, _SuggestionInput_instances, editableContent_get).value = event.suggestion;
      setTimeout(this.blur.bind(this), 0);
    });
    this.options = [];
    this.expression = "";
    this.placeholder = "";
    this.value = "";
    this.disabled = false;
    this.strikethrough = true;
    this.mimeType = "";
    this.autocomplete = true;
    this.addEventListener("blur", __privateGet(this, _handleBlurEvent));
    let jslog = VisualLogging.value().track({ keydown: "ArrowUp|ArrowDown|Enter", change: true, click: true });
    if (this.jslogContext) {
      jslog = jslog.context(this.jslogContext);
    }
    this.setAttribute("jslog", jslog.toString());
  }
  willUpdate(properties) {
    if (properties.has("value")) {
      this.expression = this.value;
    }
  }
  render() {
    return html`<style>${contentEditableStyles}</style>
      <style>${codeHighlighterStyles}</style>
      <devtools-editable-content
        ?disabled=${this.disabled}
        class=${classMap({
      strikethrough: !this.strikethrough
    })}
        .enterKeyHint=${"done"}
        .value=${this.value}
        .mimeType=${this.mimeType}
        @focus=${__privateGet(this, _handleFocusEvent)}
        @input=${__privateGet(this, _handleInputEvent)}
        @keydown=${__privateGet(this, _handleKeyDownEvent2)}
        autocapitalize="off"
        inputmode="text"
        placeholder=${this.placeholder}
        spellcheck="false"
      ></devtools-editable-content>
      <devtools-suggestion-box
        @suggestioninit=${__privateGet(this, _handleSuggestionInitEvent)}
        @suggest=${__privateGet(this, _handleSuggestEvent)}
        .options=${this.options}
        .suggestionFilter=${this.suggestionFilter}
        .expression=${this.autocomplete ? this.expression : ""}
      ></devtools-suggestion-box>`;
  }
};
_cachedEditableContent = new WeakMap();
_SuggestionInput_instances = new WeakSet();
editableContent_get = function() {
  if (__privateGet(this, _cachedEditableContent)) {
    return __privateGet(this, _cachedEditableContent);
  }
  const node = this.renderRoot.querySelector("devtools-editable-content");
  if (!node) {
    throw new Error("Attempted to query node before rendering.");
  }
  __privateSet(this, _cachedEditableContent, node);
  return node;
};
_handleBlurEvent = new WeakMap();
_handleFocusEvent = new WeakMap();
_handleKeyDownEvent2 = new WeakMap();
_handleInputEvent = new WeakMap();
_handleSuggestionInitEvent = new WeakMap();
_handleSuggestEvent = new WeakMap();
__publicField(SuggestionInput, "shadowRootOptions", {
  ...LitElement.shadowRootOptions,
  delegatesFocus: true
});
__decorateClass([
  property(jsonPropertyOptions)
], SuggestionInput.prototype, "options", 2);
__decorateClass([
  property({ type: Boolean })
], SuggestionInput.prototype, "autocomplete", 2);
__decorateClass([
  property()
], SuggestionInput.prototype, "suggestionFilter", 2);
__decorateClass([
  state()
], SuggestionInput.prototype, "expression", 2);
__decorateClass([
  property()
], SuggestionInput.prototype, "placeholder", 2);
__decorateClass([
  property()
], SuggestionInput.prototype, "value", 2);
__decorateClass([
  property({ type: Boolean })
], SuggestionInput.prototype, "disabled", 2);
__decorateClass([
  property({ type: Boolean })
], SuggestionInput.prototype, "strikethrough", 2);
__decorateClass([
  property()
], SuggestionInput.prototype, "mimeType", 2);
__decorateClass([
  property()
], SuggestionInput.prototype, "jslogContext", 2);
SuggestionInput = __decorateClass([
  customElement("devtools-suggestion-input")
], SuggestionInput);
//# sourceMappingURL=SuggestionInput.js.map
