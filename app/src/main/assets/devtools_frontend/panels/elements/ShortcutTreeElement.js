"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as Lit from "../../ui/lit/lit.js";
import * as VisualElements from "../../ui/visual_logging/visual_logging.js";
import * as ElementsComponents from "./components/components.js";
import { adornerRef, ElementsTreeElement } from "./ElementsTreeElement.js";
import { ElementsTreeOutline } from "./ElementsTreeOutline.js";
const { html, render } = Lit;
const UIStrings = {
  /**
   * @description Link text content in Elements Tree Outline of the Elements panel
   */
  reveal: "reveal"
};
const str_ = i18n.i18n.registerUIStrings("panels/elements/ShortcutTreeElement.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export const DEFAULT_VIEW = (input, _output, target) => {
  render(html`
    <div class="selection fill"></div>
    <span class="elements-tree-shortcut-title">\u21AA ${input.title}</span>
    <devtools-adorner
      .name=${ElementsComponents.AdornerManager.RegisteredAdorners.REVEAL}
      class="adorner-reveal"
      jslog=${VisualElements.adorner("reveal")}
      aria-label=${i18nString(UIStrings.reveal)}
      @click=${input.onRevealAdornerClick}
      @mousedown=${(e) => e.consume()}
      ${adornerRef()}>
      <span class="adorner-with-icon">
        <devtools-icon name="select-element"></devtools-icon>
        <span>${ElementsComponents.AdornerManager.RegisteredAdorners.REVEAL}</span>
      </span>
    </devtools-adorner>
  `, target);
};
export class ShortcutTreeElement extends UI.TreeOutline.TreeElement {
  nodeShortcut;
  #hovered;
  #view;
  constructor(nodeShortcut, view = DEFAULT_VIEW) {
    super("");
    this.nodeShortcut = nodeShortcut;
    this.#view = view;
    this.performUpdate();
  }
  get hovered() {
    return Boolean(this.#hovered);
  }
  set hovered(x) {
    if (this.#hovered === x) {
      return;
    }
    this.#hovered = x;
    this.listItemElement.classList.toggle("hovered", x);
  }
  deferredNode() {
    return this.nodeShortcut.deferredNode;
  }
  domModel() {
    return this.nodeShortcut.deferredNode.domModel();
  }
  setLeftIndentOverlay() {
    let indent = 24;
    if (this.parent && this.parent instanceof ElementsTreeElement) {
      const parentIndent = parseFloat(this.parent.listItemElement.style.getPropertyValue("--indent")) || 0;
      indent += parentIndent;
    }
    this.listItemElement.style.setProperty("--indent", indent + "px");
  }
  onattach() {
    this.setLeftIndentOverlay();
  }
  onselect(selectedByUser) {
    if (!selectedByUser) {
      return true;
    }
    this.nodeShortcut.deferredNode.highlight();
    this.nodeShortcut.deferredNode.resolve(resolved.bind(this));
    function resolved(node) {
      if (node && this.treeOutline instanceof ElementsTreeOutline) {
        this.treeOutline.selectedDOMNodeInternal = node;
        this.treeOutline.selectedNodeChanged(false);
      }
    }
    return true;
  }
  onRevealAdornerClick(event) {
    event.stopPropagation();
    this.nodeShortcut.deferredNode.resolve((node) => {
      void Common.Revealer.reveal(node);
    });
  }
  performUpdate() {
    let text = this.nodeShortcut.nodeName.toLowerCase();
    if (this.nodeShortcut.nodeType === Node.ELEMENT_NODE) {
      text = "<" + text + ">";
    }
    this.#view(
      {
        title: text,
        onRevealAdornerClick: this.onRevealAdornerClick.bind(this)
      },
      void 0,
      this.listItemElement
    );
  }
}
//# sourceMappingURL=ShortcutTreeElement.js.map
