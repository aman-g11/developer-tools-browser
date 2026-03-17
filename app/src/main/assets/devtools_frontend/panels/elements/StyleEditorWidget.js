"use strict";
import { createIcon } from "../../ui/kit/kit.js";
import * as UI from "../../ui/legacy/legacy.js";
import { StylePropertyTreeElement } from "./StylePropertyTreeElement.js";
let instance = null;
export class StyleEditorWidget extends UI.Widget.VBox {
  editor;
  stylesContainer;
  section;
  editorContainer;
  #triggerKey;
  constructor() {
    super({ useShadowDom: true });
    this.contentElement.tabIndex = 0;
    this.setDefaultFocusedElement(this.contentElement);
    this.editorContainer = document.createElement("div");
    this.contentElement.appendChild(this.editorContainer);
    this.onPropertySelected = this.onPropertySelected.bind(this);
    this.onPropertyDeselected = this.onPropertyDeselected.bind(this);
  }
  getSection() {
    return this.section;
  }
  async onPropertySelected(event) {
    if (!this.section) {
      return;
    }
    const target = ensureTreeElementForProperty(this.section, event.data.name);
    target.property.value = event.data.value;
    target.updateTitle();
    await target.applyStyleText(target.renderedPropertyText(), false);
    this.requestUpdate();
  }
  async onPropertyDeselected(event) {
    if (!this.section) {
      return;
    }
    const target = ensureTreeElementForProperty(this.section, event.data.name);
    await target.applyStyleText("", false);
    this.requestUpdate();
  }
  bindContext(stylesContainer, section) {
    this.stylesContainer = stylesContainer;
    this.section = section;
    this.editor?.addEventListener("propertyselected", this.onPropertySelected);
    this.editor?.addEventListener("propertydeselected", this.onPropertyDeselected);
  }
  setTriggerKey(value) {
    this.#triggerKey = value;
  }
  getTriggerKey() {
    return this.#triggerKey;
  }
  unbindContext() {
    this.stylesContainer = void 0;
    this.section = void 0;
    this.editor?.removeEventListener("propertyselected", this.onPropertySelected);
    this.editor?.removeEventListener("propertydeselected", this.onPropertyDeselected);
  }
  async render() {
    if (!this.editor) {
      return;
    }
    this.editor.data = {
      authoredProperties: this.section ? getAuthoredStyles(this.section, this.editor.getEditableProperties()) : /* @__PURE__ */ new Map(),
      computedProperties: this.stylesContainer ? await fetchComputedStyles(this.stylesContainer) : /* @__PURE__ */ new Map()
    };
  }
  async performUpdate() {
    await super.performUpdate();
    await this.render();
  }
  static instance() {
    if (!instance) {
      instance = new StyleEditorWidget();
    }
    return instance;
  }
  setEditor(editorClass) {
    if (!(this.editor instanceof editorClass)) {
      this.contentElement.removeChildren();
      this.editor = new editorClass();
      this.contentElement.appendChild(this.editor);
    }
  }
  static createTriggerButton(stylesContainer, section, editorClass, buttonTitle, triggerKey) {
    const triggerButton = createIcon("flex-wrap", "styles-pane-button");
    triggerButton.title = buttonTitle;
    triggerButton.role = "button";
    triggerButton.onclick = async (event) => {
      event.stopPropagation();
      const popoverHelper = stylesContainer.swatchPopoverHelper();
      const widget = StyleEditorWidget.instance();
      widget.element.classList.toggle("with-padding", true);
      widget.setEditor(editorClass);
      widget.bindContext(stylesContainer, section);
      widget.setTriggerKey(triggerKey);
      await widget.render();
      widget.focus();
      const scrollerElement = triggerButton.enclosingNodeOrSelfWithClass("style-panes-wrapper");
      const onScroll = () => {
        popoverHelper.hide(true);
      };
      const onStylesUpdateCompleted = widget.requestUpdate.bind(widget);
      stylesContainer.addStyleUpdateListener(onStylesUpdateCompleted);
      popoverHelper.show(widget, triggerButton, () => {
        widget.unbindContext();
        if (scrollerElement) {
          scrollerElement.removeEventListener("scroll", onScroll);
        }
        stylesContainer.removeStyleUpdateListener(onStylesUpdateCompleted);
      });
      if (scrollerElement) {
        scrollerElement.addEventListener("scroll", onScroll);
      }
    };
    triggerButton.onmouseup = (event) => {
      event.stopPropagation();
    };
    return triggerButton;
  }
}
function ensureTreeElementForProperty(section, propertyName) {
  const target = section.propertiesTreeOutline.rootElement().children().find(
    (child) => child instanceof StylePropertyTreeElement && child.property.name === propertyName
  );
  if (target) {
    return target;
  }
  const newTarget = section.addNewBlankProperty();
  newTarget.property.name = propertyName;
  return newTarget;
}
async function fetchComputedStyles(stylesContainer) {
  const computedStyleModel = stylesContainer.computedStyleModel();
  const style = await computedStyleModel.fetchComputedStyle();
  return style ? style.computedStyle : /* @__PURE__ */ new Map();
}
function getAuthoredStyles(section, editableProperties) {
  const authoredProperties = /* @__PURE__ */ new Map();
  const editablePropertiesSet = new Set(editableProperties.map((prop) => prop.propertyName));
  for (const prop of section.style().leadingProperties()) {
    if (editablePropertiesSet.has(prop.name)) {
      authoredProperties.set(prop.name, prop.value);
    }
  }
  return authoredProperties;
}
//# sourceMappingURL=StyleEditorWidget.js.map
