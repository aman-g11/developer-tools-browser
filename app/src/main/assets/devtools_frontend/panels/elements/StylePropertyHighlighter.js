"use strict";
import { PanelUtils } from "../utils/utils.js";
import { StylePropertyTreeElement } from "./StylePropertyTreeElement.js";
export class StylePropertyHighlighter {
  styleSidebarPane;
  constructor(ssp) {
    this.styleSidebarPane = ssp;
  }
  /**
   * Expand all shorthands, find the given property, scroll to it and highlight it.
   */
  async highlightProperty(cssProperty) {
    const section = this.styleSidebarPane.allSections().find((section2) => section2.style().allProperties().includes(cssProperty));
    if (!section) {
      return;
    }
    section.expand();
    section.showAllItems();
    const populatePromises = [];
    for (let treeElement2 = section.propertiesTreeOutline.firstChild(); treeElement2; treeElement2 = treeElement2.nextSibling) {
      populatePromises.push(treeElement2.onpopulate());
    }
    await Promise.all(populatePromises);
    const treeElement = this.findTreeElementFromSection((treeElement2) => treeElement2.property === cssProperty, section);
    if (treeElement) {
      treeElement.parent?.expand();
      this.scrollAndHighlightTreeElement(treeElement);
      section.element.focus();
    }
  }
  findAndHighlightSectionBlock(sectionBlockName) {
    const block = this.styleSidebarPane.getSectionBlockByName(sectionBlockName);
    if (!block || block.sections.length === 0) {
      return;
    }
    const [section] = block.sections;
    section.showAllItems();
    PanelUtils.highlightElement(block.titleElement());
  }
  findAndHighlightSection(sectionName, blockName) {
    const block = this.styleSidebarPane.getSectionBlockByName(blockName);
    const section = block?.sections.find((section2) => section2.headerText() === sectionName);
    if (!section || !block) {
      return;
    }
    block.expand(true);
    section.expand();
    section.showAllItems();
    PanelUtils.highlightElement(section.element);
  }
  /**
   * Find the first non-overridden property that matches the provided name, scroll to it and highlight it.
   */
  findAndHighlightPropertyName(propertyName, sectionName, blockName) {
    const block = blockName ? this.styleSidebarPane.getSectionBlockByName(blockName) : void 0;
    const sections = block?.sections ?? this.styleSidebarPane.allSections();
    if (!sections) {
      return false;
    }
    for (const section of sections) {
      if (sectionName && section.headerText() !== sectionName) {
        continue;
      }
      if (!section.style().hasActiveProperty(propertyName)) {
        continue;
      }
      block?.expand(true);
      section.expand();
      section.showAllItems();
      const treeElement = this.findTreeElementFromSection(
        (treeElement2) => treeElement2.property.name === propertyName && !treeElement2.overloaded(),
        section
      );
      if (treeElement) {
        this.scrollAndHighlightTreeElement(treeElement);
        section.element.focus();
        return true;
      }
    }
    return false;
  }
  findTreeElementFromSection(compareCb, section) {
    let treeElement = section.propertiesTreeOutline.firstChild();
    while (treeElement && treeElement instanceof StylePropertyTreeElement) {
      if (compareCb(treeElement)) {
        return treeElement;
      }
      treeElement = treeElement.traverseNextTreeElement(false, null, true);
    }
    return null;
  }
  scrollAndHighlightTreeElement(treeElement) {
    PanelUtils.highlightElement(treeElement.listItemElement);
  }
}
//# sourceMappingURL=StylePropertyHighlighter.js.map
