"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _renderedAttributes, _StepEditor_instances, commit_fn, _handleSelectorPicked, _handleAttributeRequested, _handleAddOrRemoveClick, _handleKeyDownEvent, _handleInputBlur, _handleTypeInputBlur, _handleAddRowClickEvent, renderInlineButton_fn, renderDeleteButton_fn, renderTypeRow_fn, renderRow_fn, renderFrameRow_fn, renderSelectorsRow_fn, renderAssertedEvents_fn, renderAttributesRow_fn, renderAddRowButtons_fn, _ensureFocus;
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
import * as Buttons from "../../../ui/components/buttons/buttons.js";
import * as SuggestionInput from "../../../ui/components/suggestion_input/suggestion_input.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import * as Models from "../models/models.js";
import * as Util from "../util/util.js";
import { RequestSelectorAttributeEvent, SelectorPicker } from "./SelectorPicker.js";
import stepEditorStyles from "./stepEditor.css.js";
import {
  ArrayAssignments,
  assert,
  deepFreeze,
  immutableDeepAssign,
  InsertAssignment
} from "./util.js";
const { html, Decorators, Directives, LitElement } = Lit;
const { customElement, property, state } = Decorators;
const { live } = Directives;
const { widget } = UI.Widget;
const typeConverters = Object.freeze({
  string: (value) => value.trim(),
  number: (value) => {
    const number = parseFloat(value);
    if (Number.isNaN(number)) {
      return 0;
    }
    return number;
  },
  boolean: (value) => {
    if (value.toLowerCase() === "true") {
      return true;
    }
    return false;
  }
});
const dataTypeByAttribute = Object.freeze({
  selectors: "string",
  offsetX: "number",
  offsetY: "number",
  target: "string",
  frame: "number",
  assertedEvents: "string",
  value: "string",
  key: "string",
  operator: "string",
  count: "number",
  expression: "string",
  x: "number",
  y: "number",
  url: "string",
  type: "string",
  timeout: "number",
  duration: "number",
  button: "string",
  deviceType: "string",
  width: "number",
  height: "number",
  deviceScaleFactor: "number",
  isMobile: "boolean",
  hasTouch: "boolean",
  isLandscape: "boolean",
  download: "number",
  upload: "number",
  latency: "number",
  name: "string",
  parameters: "string",
  visible: "boolean",
  properties: "string",
  attributes: "string"
});
const defaultValuesByAttribute = deepFreeze({
  selectors: [[".cls"]],
  offsetX: 1,
  offsetY: 1,
  target: "main",
  frame: [0],
  assertedEvents: [
    { type: "navigation", url: "https://example.com", title: "Title" }
  ],
  value: "Value",
  key: "Enter",
  operator: ">=",
  count: 1,
  expression: "true",
  x: 0,
  y: 0,
  url: "https://example.com",
  timeout: 5e3,
  duration: 50,
  deviceType: "mouse",
  button: "primary",
  type: "click",
  width: 800,
  height: 600,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  isLandscape: true,
  download: 1e3,
  upload: 1e3,
  latency: 25,
  name: "customParam",
  parameters: "{}",
  properties: "{}",
  attributes: [{ name: "attribute", value: "value" }],
  visible: true
});
const attributesByType = deepFreeze({
  [Models.Schema.StepType.Click]: {
    required: ["selectors", "offsetX", "offsetY"],
    optional: [
      "assertedEvents",
      "button",
      "deviceType",
      "duration",
      "frame",
      "target",
      "timeout"
    ]
  },
  [Models.Schema.StepType.DoubleClick]: {
    required: ["offsetX", "offsetY", "selectors"],
    optional: [
      "assertedEvents",
      "button",
      "deviceType",
      "frame",
      "target",
      "timeout"
    ]
  },
  [Models.Schema.StepType.Hover]: {
    required: ["selectors"],
    optional: ["assertedEvents", "frame", "target", "timeout"]
  },
  [Models.Schema.StepType.Change]: {
    required: ["selectors", "value"],
    optional: ["assertedEvents", "frame", "target", "timeout"]
  },
  [Models.Schema.StepType.KeyDown]: {
    required: ["key"],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.KeyUp]: {
    required: ["key"],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.Scroll]: {
    required: [],
    optional: ["assertedEvents", "frame", "target", "timeout", "x", "y"]
  },
  [Models.Schema.StepType.Close]: {
    required: [],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.Navigate]: {
    required: ["url"],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.WaitForElement]: {
    required: ["selectors"],
    optional: [
      "assertedEvents",
      "attributes",
      "count",
      "frame",
      "operator",
      "properties",
      "target",
      "timeout",
      "visible"
    ]
  },
  [Models.Schema.StepType.WaitForExpression]: {
    required: ["expression"],
    optional: ["assertedEvents", "frame", "target", "timeout"]
  },
  [Models.Schema.StepType.CustomStep]: {
    required: ["name", "parameters"],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.EmulateNetworkConditions]: {
    required: ["download", "latency", "upload"],
    optional: ["assertedEvents", "target", "timeout"]
  },
  [Models.Schema.StepType.SetViewport]: {
    required: [
      "deviceScaleFactor",
      "hasTouch",
      "height",
      "isLandscape",
      "isMobile",
      "width"
    ],
    optional: ["assertedEvents", "target", "timeout"]
  }
});
const UIStrings = {
  /**
   * @description The text that is disabled when the steps were not saved due to an error. The error message itself is always in English and not translated.
   * @example {Saving failed} error
   */
  notSaved: "Not saved: {error}",
  /**
   * @description The button title that adds a new attribute to the form.
   * @example {timeout} attributeName
   */
  addAttribute: "Add {attributeName}",
  /**
   * @description The title of a button that deletes an attribute from the form.
   */
  deleteRow: "Delete row",
  /**
   * @description The title of a button that adds a new input field for the entry of the frame index. Frame index is the number of the frame within the page's frame tree.
   */
  addFrameIndex: "Add frame index within the frame tree",
  /**
   * @description The title of a button that removes a frame index field from the form.
   */
  removeFrameIndex: "Remove frame index",
  /**
   * @description The title of a button that adds a field to input a part of a selector in the editor form.
   */
  addSelectorPart: "Add a selector part",
  /**
   * @description The title of a button that removes a field to input a part of a selector in the editor form.
   */
  removeSelectorPart: "Remove a selector part",
  /**
   * @description The title of a button that adds a field to input a selector in the editor form.
   */
  addSelector: "Add a selector",
  /**
   * @description The title of a button that removes a field to input a selector in the editor form.
   */
  removeSelector: "Remove a selector",
  /**
   * @description The error message display when a user enters a type in the input not associates with any existing types.
   */
  unknownActionType: "Unknown action type."
};
const str_ = i18n.i18n.registerUIStrings("panels/recorder/components/StepEditor.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class StepEditedEvent extends Event {
  static eventName = "stepedited";
  data;
  constructor(step) {
    super(StepEditedEvent.eventName, { bubbles: true, composed: true });
    this.data = step;
  }
}
const cleanUndefineds = (value) => {
  return JSON.parse(JSON.stringify(value));
};
export class EditorState {
  static #puppeteer = new Util.SharedObject.SharedObject(
    () => Models.RecordingPlayer.RecordingPlayer.connectPuppeteer(),
    ({ browser }) => Models.RecordingPlayer.RecordingPlayer.disconnectPuppeteer(browser)
  );
  static async default(type) {
    const state2 = { type };
    const attributes = attributesByType[state2.type];
    let promise = Promise.resolve();
    for (const attribute of attributes.required) {
      promise = Promise.all([
        promise,
        (async () => Object.assign(state2, {
          [attribute]: await this.defaultByAttribute(state2, attribute)
        }))()
      ]);
    }
    await promise;
    return Object.freeze(state2);
  }
  static async defaultByAttribute(_state, attribute) {
    return await this.#puppeteer.run((puppeteer) => {
      switch (attribute) {
        case "assertedEvents": {
          return immutableDeepAssign(defaultValuesByAttribute.assertedEvents, new ArrayAssignments({
            0: {
              url: puppeteer.page.url() || defaultValuesByAttribute.assertedEvents[0].url
            }
          }));
        }
        case "url": {
          return puppeteer.page.url() || defaultValuesByAttribute.url;
        }
        case "height": {
          return puppeteer.page.evaluate(() => visualViewport.height) || defaultValuesByAttribute.height;
        }
        case "width": {
          return puppeteer.page.evaluate(() => visualViewport.width) || defaultValuesByAttribute.width;
        }
        default: {
          return defaultValuesByAttribute[attribute];
        }
      }
    });
  }
  static fromStep(step) {
    const state2 = structuredClone(step);
    for (const key of ["parameters", "properties"]) {
      if (key in step && step[key] !== void 0) {
        state2[key] = JSON.stringify(step[key]);
      }
    }
    if ("attributes" in step && step.attributes) {
      state2.attributes = [];
      for (const [name, value] of Object.entries(step.attributes)) {
        state2.attributes.push({ name, value });
      }
    }
    if ("selectors" in step) {
      state2.selectors = step.selectors.map((selector) => {
        if (typeof selector === "string") {
          return [selector];
        }
        return [...selector];
      });
    }
    return deepFreeze(state2);
  }
  static toStep(state2) {
    const step = structuredClone(state2);
    for (const key of ["parameters", "properties"]) {
      const value = state2[key];
      if (value) {
        Object.assign(step, { [key]: JSON.parse(value) });
      }
    }
    if (state2.attributes) {
      if (state2.attributes.length !== 0) {
        const attributes = {};
        for (const { name, value } of state2.attributes) {
          Object.assign(attributes, { [name]: value });
        }
        Object.assign(step, { attributes });
      } else if ("attributes" in step) {
        delete step.attributes;
      }
    }
    if (state2.selectors) {
      const selectors = state2.selectors.filter((selector) => selector.length > 0).map((selector) => {
        if (selector.length === 1) {
          return selector[0];
        }
        return [...selector];
      });
      if (selectors.length !== 0) {
        Object.assign(step, { selectors });
      } else if ("selectors" in step) {
        delete step.selectors;
      }
    }
    if (state2.frame?.length === 0 && "frame" in step) {
      delete step.frame;
    }
    return cleanUndefineds(Models.SchemaUtils.parseStep(step));
  }
}
export let StepEditor = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _StepEditor_instances);
    __privateAdd(this, _renderedAttributes, /* @__PURE__ */ new Set());
    __privateAdd(this, _handleSelectorPicked, (data) => {
      __privateMethod(this, _StepEditor_instances, commit_fn).call(this, immutableDeepAssign(this.state, {
        target: data.target,
        frame: data.frame,
        selectors: data.selectors.map((selector) => typeof selector === "string" ? [selector] : selector),
        offsetX: data.offsetX,
        offsetY: data.offsetY
      }));
    });
    __privateAdd(this, _handleAttributeRequested, (send) => {
      this.dispatchEvent(new RequestSelectorAttributeEvent(send));
    });
    __privateAdd(this, _handleAddOrRemoveClick, (assignments, query) => (event) => {
      event.preventDefault();
      event.stopPropagation();
      __privateMethod(this, _StepEditor_instances, commit_fn).call(this, immutableDeepAssign(this.state, assignments));
      __privateGet(this, _ensureFocus).call(this, query);
    });
    __privateAdd(this, _handleKeyDownEvent, (event) => {
      assert(event instanceof KeyboardEvent);
      if (event.target instanceof SuggestionInput.SuggestionInput.SuggestionInput && event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        const elements = this.renderRoot.querySelectorAll("devtools-suggestion-input");
        const element = [...elements].findIndex((value) => value === event.target);
        if (element >= 0 && element + 1 < elements.length) {
          elements[element + 1].focus();
        } else {
          event.target.blur();
        }
      }
    });
    __privateAdd(this, _handleInputBlur, (opts) => (event) => {
      assert(event.target instanceof SuggestionInput.SuggestionInput.SuggestionInput);
      if (event.target.disabled) {
        return;
      }
      const dataType = dataTypeByAttribute[opts.attribute];
      const value = typeConverters[dataType](event.target.value);
      const assignments = opts.from.bind(this)(value);
      if (!assignments) {
        return;
      }
      __privateMethod(this, _StepEditor_instances, commit_fn).call(this, immutableDeepAssign(this.state, assignments));
    });
    __privateAdd(this, _handleTypeInputBlur, async (event) => {
      assert(event.target instanceof SuggestionInput.SuggestionInput.SuggestionInput);
      if (event.target.disabled) {
        return;
      }
      const value = event.target.value;
      if (value === this.state.type) {
        return;
      }
      if (!Object.values(Models.Schema.StepType).includes(value)) {
        this.error = i18nString(UIStrings.unknownActionType);
        return;
      }
      __privateMethod(this, _StepEditor_instances, commit_fn).call(this, await EditorState.default(value));
    });
    __privateAdd(this, _handleAddRowClickEvent, async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const attribute = event.target.dataset.attribute;
      __privateMethod(this, _StepEditor_instances, commit_fn).call(this, immutableDeepAssign(this.state, {
        [attribute]: await EditorState.defaultByAttribute(this.state, attribute)
      }));
      __privateGet(this, _ensureFocus).call(this, `[data-attribute=${attribute}].attribute devtools-suggestion-input`);
    });
    __privateAdd(this, _ensureFocus, (query) => {
      void this.updateComplete.then(() => {
        const node = this.renderRoot.querySelector(query);
        node?.focus();
      });
    });
    this.state = { type: Models.Schema.StepType.WaitForElement };
    this.isTypeEditable = true;
    this.disabled = false;
  }
  createRenderRoot() {
    const root = super.createRenderRoot();
    root.addEventListener("keydown", __privateGet(this, _handleKeyDownEvent));
    return root;
  }
  set step(step) {
    this.state = deepFreeze(EditorState.fromStep(step));
    this.error = void 0;
  }
  render() {
    __privateSet(this, _renderedAttributes, /* @__PURE__ */ new Set());
    const result = html`
      <style>${stepEditorStyles}</style>
      <div class="wrapper" jslog=${VisualLogging.tree("step-editor")} >
        ${__privateMethod(this, _StepEditor_instances, renderTypeRow_fn).call(this, this.isTypeEditable)} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "target")}
        ${__privateMethod(this, _StepEditor_instances, renderFrameRow_fn).call(this)} ${__privateMethod(this, _StepEditor_instances, renderSelectorsRow_fn).call(this)}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "deviceType")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "button")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "url")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "x")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "y")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "offsetX")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "offsetY")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "value")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "key")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "operator")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "count")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "expression")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "duration")} ${__privateMethod(this, _StepEditor_instances, renderAssertedEvents_fn).call(this)}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "timeout")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "width")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "height")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "deviceScaleFactor")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "isMobile")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "hasTouch")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "isLandscape")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "download")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "upload")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "latency")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "name")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "parameters")}
        ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "visible")} ${__privateMethod(this, _StepEditor_instances, renderRow_fn).call(this, "properties")}
        ${__privateMethod(this, _StepEditor_instances, renderAttributesRow_fn).call(this)}
        ${this.error ? html`
              <div class="error">
                ${i18nString(UIStrings.notSaved, {
      error: this.error
    })}
              </div>
            ` : void 0}
        ${!this.disabled ? html`<div
              class="row-buttons wrapped gap row regular-font no-margin"
            >
              ${__privateMethod(this, _StepEditor_instances, renderAddRowButtons_fn).call(this)}
            </div>` : void 0}
      </div>
    `;
    for (const key of Object.keys(dataTypeByAttribute)) {
      if (!__privateGet(this, _renderedAttributes).has(key)) {
        throw new Error(`The editable attribute ${key} does not have UI`);
      }
    }
    return result;
  }
};
_renderedAttributes = new WeakMap();
_StepEditor_instances = new WeakSet();
commit_fn = function(updatedState) {
  try {
    this.dispatchEvent(new StepEditedEvent(EditorState.toStep(updatedState)));
    this.state = updatedState;
  } catch (error) {
    this.error = error.message;
  }
};
_handleSelectorPicked = new WeakMap();
_handleAttributeRequested = new WeakMap();
_handleAddOrRemoveClick = new WeakMap();
_handleKeyDownEvent = new WeakMap();
_handleInputBlur = new WeakMap();
_handleTypeInputBlur = new WeakMap();
_handleAddRowClickEvent = new WeakMap();
renderInlineButton_fn = function(opts) {
  if (this.disabled) {
    return;
  }
  return html`
      <devtools-button
        title=${opts.title}
        .accessibleLabel=${opts.title}
        .size=${Buttons.Button.Size.SMALL}
        .iconName=${opts.iconName}
        .variant=${Buttons.Button.Variant.ICON}
        jslog=${VisualLogging.action(opts.class).track({
    click: true
  })}
        class="inline-button ${opts.class}"
        @click=${opts.onClick}
      ></devtools-button>
    `;
};
renderDeleteButton_fn = function(attribute) {
  if (this.disabled) {
    return;
  }
  const attributes = attributesByType[this.state.type];
  const optional = [...attributes.optional].includes(attribute);
  if (!optional || this.disabled) {
    return;
  }
  return html`<devtools-button
      .size=${Buttons.Button.Size.SMALL}
      .iconName=${"bin"}
      .variant=${Buttons.Button.Variant.ICON}
      .title=${i18nString(UIStrings.deleteRow)}
      class="inline-button delete-row"
      data-attribute=${attribute}
      jslog=${VisualLogging.action("delete").track({ click: true })}
      @click=${(event) => {
    event.preventDefault();
    event.stopPropagation();
    __privateMethod(this, _StepEditor_instances, commit_fn).call(this, immutableDeepAssign(this.state, { [attribute]: void 0 }));
  }}
    ></devtools-button>`;
};
renderTypeRow_fn = function(editable) {
  __privateGet(this, _renderedAttributes).add("type");
  return html`<div class="row attribute" data-attribute="type" jslog=${VisualLogging.treeItem("type").track({ resize: true })}>
      <div id="type">type<span class="separator">:</span></div>
      <devtools-suggestion-input
        aria-labelledby="type"
        .disabled=${!editable || this.disabled}
        .options=${Object.values(Models.Schema.StepType)}
        .placeholder=${defaultValuesByAttribute.type}
        .value=${live(this.state.type)}
        @blur=${__privateGet(this, _handleTypeInputBlur)}
      ></devtools-suggestion-input>
    </div>`;
};
renderRow_fn = function(attribute) {
  __privateGet(this, _renderedAttributes).add(attribute);
  const attributeValue = this.state[attribute]?.toString();
  if (attributeValue === void 0) {
    return;
  }
  return html`<div class="row attribute" data-attribute=${attribute} jslog=${VisualLogging.treeItem(Platform.StringUtilities.toKebabCase(attribute)).track({ resize: true })}>
      <div id=${attribute}>${attribute}<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${this.disabled}
        aria-labelledby=${attribute}
        .placeholder=${defaultValuesByAttribute[attribute].toString()}
        .value=${live(attributeValue)}
        .mimeType=${(() => {
    switch (attribute) {
      case "expression":
        return "text/javascript";
      case "properties":
        return "application/json";
      default:
        return "";
    }
  })()}
        @blur=${__privateGet(this, _handleInputBlur).call(this, {
    attribute,
    from(value) {
      if (this.state[attribute] === void 0) {
        return;
      }
      return { [attribute]: value };
    }
  })}
      ></devtools-suggestion-input>
      ${__privateMethod(this, _StepEditor_instances, renderDeleteButton_fn).call(this, attribute)}
    </div>`;
};
renderFrameRow_fn = function() {
  __privateGet(this, _renderedAttributes).add("frame");
  if (this.state.frame === void 0) {
    return;
  }
  return html`
      <div class="attribute" data-attribute="frame" jslog=${VisualLogging.treeItem("frame").track({ resize: true })}>
        <div class="row">
          <div id="frame">frame<span class="separator">:</span></div>
          ${__privateMethod(this, _StepEditor_instances, renderDeleteButton_fn).call(this, "frame")}
        </div>
        ${this.state.frame.map((frame, index, frames) => {
    return html`
            <div class="padded row">
              <devtools-suggestion-input
                aria-labelledby="frame"
                .disabled=${this.disabled}
                .placeholder=${defaultValuesByAttribute.frame[0].toString()}
                .value=${live(frame.toString())}
                data-path=${`frame.${index}`}
                @blur=${__privateGet(this, _handleInputBlur).call(this, {
      attribute: "frame",
      from(value) {
        if (this.state.frame?.[index] === void 0) {
          return;
        }
        return {
          frame: new ArrayAssignments({ [index]: value })
        };
      }
    })}
              ></devtools-suggestion-input>
              ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "add-frame",
      title: i18nString(UIStrings.addFrameIndex),
      iconName: "plus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
        frame: new ArrayAssignments({
          [index + 1]: new InsertAssignment(
            defaultValuesByAttribute.frame[0]
          )
        })
      }, `devtools-suggestion-input[data-path="frame.${index + 1}"]`)
    })}
              ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "remove-frame",
      title: i18nString(UIStrings.removeFrameIndex),
      iconName: "minus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
        frame: new ArrayAssignments({ [index]: void 0 })
      }, `devtools-suggestion-input[data-path="frame.${Math.min(
        index,
        frames.length - 2
      )}"]`)
    })}
            </div>
          `;
  })}
      </div>
    `;
};
renderSelectorsRow_fn = function() {
  __privateGet(this, _renderedAttributes).add("selectors");
  if (this.state.selectors === void 0) {
    return;
  }
  return html`<div class="attribute" data-attribute="selectors" jslog=${VisualLogging.treeItem("selectors")}>
      <div class="row">
        <div>selectors<span class="separator">:</span></div>
        ${widget(SelectorPicker, {
    disabled: this.disabled,
    onSelectorPicked: __privateGet(this, _handleSelectorPicked),
    onAttributeRequested: __privateGet(this, _handleAttributeRequested)
  })}
        ${__privateMethod(this, _StepEditor_instances, renderDeleteButton_fn).call(this, "selectors")}
      </div>
      ${this.state.selectors.map((selector, index, selectors) => {
    return html`<div class="padded row" data-selector-path=${index}>
            <div id="selector-${index}">selector #${index + 1}<span class="separator">:</span></div>
            ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "add-selector",
      title: i18nString(UIStrings.addSelector),
      iconName: "plus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
        selectors: new ArrayAssignments({
          [index + 1]: new InsertAssignment(
            structuredClone(defaultValuesByAttribute.selectors[0])
          )
        })
      }, `devtools-suggestion-input[data-path="selectors.${index + 1}.0"]`)
    })}
            ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "remove-selector",
      title: i18nString(UIStrings.removeSelector),
      iconName: "minus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, { selectors: new ArrayAssignments({ [index]: void 0 }) }, `devtools-suggestion-input[data-path="selectors.${Math.min(
        index,
        selectors.length - 2
      )}.0"]`)
    })}
          </div>
          ${selector.map((part, partIndex, parts) => {
      return html`<div
              class="double padded row"
              data-selector-path="${index}.${partIndex}"
            >
              <devtools-suggestion-input
                aria-labelledby="selector-${index}"
                .disabled=${this.disabled}
                .placeholder=${defaultValuesByAttribute.selectors[0][0]}
                .value=${live(part)}
                data-path=${`selectors.${index}.${partIndex}`}
                @blur=${__privateGet(this, _handleInputBlur).call(this, {
        attribute: "selectors",
        from(value) {
          if (this.state.selectors?.[index]?.[partIndex] === void 0) {
            return;
          }
          return {
            selectors: new ArrayAssignments({
              [index]: new ArrayAssignments({
                [partIndex]: value
              })
            })
          };
        }
      })}
              ></devtools-suggestion-input>
              ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
        class: "add-selector-part",
        title: i18nString(UIStrings.addSelectorPart),
        iconName: "plus",
        onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
          selectors: new ArrayAssignments({
            [index]: new ArrayAssignments({
              [partIndex + 1]: new InsertAssignment(
                defaultValuesByAttribute.selectors[0][0]
              )
            })
          })
        }, `devtools-suggestion-input[data-path="selectors.${index}.${partIndex + 1}"]`)
      })}
              ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
        class: "remove-selector-part",
        title: i18nString(UIStrings.removeSelectorPart),
        iconName: "minus",
        onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
          selectors: new ArrayAssignments({
            [index]: new ArrayAssignments({
              [partIndex]: void 0
            })
          })
        }, `devtools-suggestion-input[data-path="selectors.${index}.${Math.min(
          partIndex,
          parts.length - 2
        )}"]`)
      })}
            </div>`;
    })}`;
  })}
    </div>`;
};
renderAssertedEvents_fn = function() {
  __privateGet(this, _renderedAttributes).add("assertedEvents");
  if (this.state.assertedEvents === void 0) {
    return;
  }
  return html`<div class="attribute" data-attribute="assertedEvents" jslog=${VisualLogging.treeItem("asserted-events")}>
      <div class="row">
        <div>asserted events<span class="separator">:</span></div>
        ${__privateMethod(this, _StepEditor_instances, renderDeleteButton_fn).call(this, "assertedEvents")}
      </div>
      ${this.state.assertedEvents.map((event, index) => {
    return html` <div class="padded row" jslog=${VisualLogging.treeItem("event-type")}>
            <div id="event-type">type<span class="separator">:</span></div>
            <div aria-labelledby="event-type">${event.type}</div>
          </div>
          <div class="padded row" jslog=${VisualLogging.treeItem("event-title")}>
            <div id="event-title">title<span class="separator">:</span></div>
            <devtools-suggestion-input
              aria-labelledby="event-title"
              .disabled=${this.disabled}
              .placeholder=${defaultValuesByAttribute.assertedEvents[0].title}
              .value=${live(event.title ?? "")}
              @blur=${__privateGet(this, _handleInputBlur).call(this, {
      attribute: "assertedEvents",
      from(value) {
        if (this.state.assertedEvents?.[index]?.title === void 0) {
          return;
        }
        return {
          assertedEvents: new ArrayAssignments({
            [index]: { title: value }
          })
        };
      }
    })}
            ></devtools-suggestion-input>
          </div>
          <div  id="event-url" class="padded row" jslog=${VisualLogging.treeItem("event-url")}>
            <div>url<span class="separator">:</span></div>
            <devtools-suggestion-input
              aria-labelledby="event-url"
              .disabled=${this.disabled}
              .placeholder=${defaultValuesByAttribute.assertedEvents[0].url}
              .value=${live(event.url ?? "")}
              @blur=${__privateGet(this, _handleInputBlur).call(this, {
      attribute: "url",
      from(value) {
        if (this.state.assertedEvents?.[index]?.url === void 0) {
          return;
        }
        return {
          assertedEvents: new ArrayAssignments({
            [index]: { url: value }
          })
        };
      }
    })}
            ></devtools-suggestion-input>
          </div>`;
  })}
    </div> `;
};
renderAttributesRow_fn = function() {
  __privateGet(this, _renderedAttributes).add("attributes");
  if (this.state.attributes === void 0) {
    return;
  }
  return html`<div class="attribute" data-attribute="attributes" jslog=${VisualLogging.treeItem("attributes")}>
      <div class="row">
        <div>attributes<span class="separator">:</span></div>
        ${__privateMethod(this, _StepEditor_instances, renderDeleteButton_fn).call(this, "attributes")}
      </div>
      ${this.state.attributes.map(({ name, value }, index, attributes) => {
    return html`<div class="padded row" jslog=${VisualLogging.treeItem("attribute")}>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${defaultValuesByAttribute.attributes[0].name}
            .value=${live(name)}
            data-path=${`attributes.${index}.name`}
            jslog=${VisualLogging.key().track({ change: true })}
            @blur=${__privateGet(this, _handleInputBlur).call(this, {
      attribute: "attributes",
      from(name2) {
        if (this.state.attributes?.[index]?.name === void 0) {
          return;
        }
        return {
          attributes: new ArrayAssignments({ [index]: { name: name2 } })
        };
      }
    })}
          ></devtools-suggestion-input>
          <span class="separator">:</span>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${defaultValuesByAttribute.attributes[0].value}
            .value=${live(value)}
            data-path=${`attributes.${index}.value`}
            @blur=${__privateGet(this, _handleInputBlur).call(this, {
      attribute: "attributes",
      from(value2) {
        if (this.state.attributes?.[index]?.value === void 0) {
          return;
        }
        return {
          attributes: new ArrayAssignments({ [index]: { value: value2 } })
        };
      }
    })}
          ></devtools-suggestion-input>
          ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "add-attribute-assertion",
      title: i18nString(UIStrings.addSelectorPart),
      iconName: "plus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, {
        attributes: new ArrayAssignments({
          [index + 1]: new InsertAssignment(
            (() => {
              {
                const names = new Set(
                  attributes.map(({ name: name3 }) => name3)
                );
                const defaultAttribute = defaultValuesByAttribute.attributes[0];
                let name2 = defaultAttribute.name;
                let i = 0;
                while (names.has(name2)) {
                  ++i;
                  name2 = `${defaultAttribute.name}-${i}`;
                }
                return { ...defaultAttribute, name: name2 };
              }
            })()
          )
        })
      }, `devtools-suggestion-input[data-path="attributes.${index + 1}.name"]`)
    })}
          ${__privateMethod(this, _StepEditor_instances, renderInlineButton_fn).call(this, {
      class: "remove-attribute-assertion",
      title: i18nString(UIStrings.removeSelectorPart),
      iconName: "minus",
      onClick: __privateGet(this, _handleAddOrRemoveClick).call(this, { attributes: new ArrayAssignments({ [index]: void 0 }) }, `devtools-suggestion-input[data-path="attributes.${Math.min(
        index,
        attributes.length - 2
      )}.value"]`)
    })}
        </div>`;
  })}
    </div>`;
};
renderAddRowButtons_fn = function() {
  const attributes = attributesByType[this.state.type];
  return [...attributes.optional].filter((attr) => this.state[attr] === void 0).map((attr) => {
    return html`<devtools-button
          .variant=${Buttons.Button.Variant.OUTLINED}
          class="add-row"
          data-attribute=${attr}
          jslog=${VisualLogging.action(`add-${Platform.StringUtilities.toKebabCase(attr)}`)}
          @click=${__privateGet(this, _handleAddRowClickEvent)}
        >
          ${i18nString(UIStrings.addAttribute, {
      attributeName: attr
    })}
        </devtools-button>`;
  });
};
_ensureFocus = new WeakMap();
__decorateClass([
  state()
], StepEditor.prototype, "state", 2);
__decorateClass([
  state()
], StepEditor.prototype, "error", 2);
__decorateClass([
  property({ type: Boolean })
], StepEditor.prototype, "isTypeEditable", 2);
__decorateClass([
  property({ type: Boolean })
], StepEditor.prototype, "disabled", 2);
StepEditor = __decorateClass([
  customElement("devtools-recorder-step-editor")
], StepEditor);
//# sourceMappingURL=StepEditor.js.map
