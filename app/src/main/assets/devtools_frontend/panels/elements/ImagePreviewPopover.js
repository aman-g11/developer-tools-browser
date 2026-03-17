"use strict";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as UI from "../../ui/legacy/legacy.js";
export class ImagePreviewPopover {
  getLinkElement;
  popover;
  #getNodeFeatures;
  constructor(container, getLinkElement, getNodeFeatures) {
    this.getLinkElement = getLinkElement;
    this.#getNodeFeatures = getNodeFeatures;
    this.popover = new UI.PopoverHelper.PopoverHelper(container, this.handleRequest.bind(this), "elements.image-preview");
    this.popover.setTimeout(0, 100);
  }
  handleRequest(event) {
    const link = this.getLinkElement(event);
    if (!link) {
      return null;
    }
    const href = elementToURLMap.get(link);
    if (!href) {
      return null;
    }
    return {
      box: link.boxInWindow(),
      show: async (popover) => {
        const precomputedFeatures = await this.#getNodeFeatures(link);
        const preview = await Components.ImagePreview.ImagePreview.build(href, true, {
          precomputedFeatures,
          align: Components.ImagePreview.Align.CENTER
        });
        if (preview) {
          popover.contentElement.appendChild(preview);
        }
        return Boolean(preview);
      }
    };
  }
  hide() {
    this.popover.hidePopover();
  }
  static setImageUrl(element, url) {
    elementToURLMap.set(element, url);
    return element;
  }
  static getImageURL(element) {
    return elementToURLMap.get(element);
  }
}
const elementToURLMap = /* @__PURE__ */ new WeakMap();
//# sourceMappingURL=ImagePreviewPopover.js.map
