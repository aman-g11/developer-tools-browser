"use strict";
import * as SDK from "../../core/sdk/sdk.js";
import * as UI from "../../ui/legacy/legacy.js";
import { ElementsTreeOutline } from "./ElementsTreeOutline.js";
let rendererInstance;
export class Renderer {
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!rendererInstance || forceNew) {
      rendererInstance = new Renderer();
    }
    return rendererInstance;
  }
  async render(object, options) {
    let node = null;
    if (object instanceof SDK.DOMModel.DOMNode) {
      node = object;
    } else if (object instanceof SDK.DOMModel.DeferredDOMNode) {
      node = await object.resolvePromise();
    }
    if (!node) {
      return null;
    }
    const treeOutline = new ElementsTreeOutline(
      /* omitRootDOMNode: */
      false,
      /* selectEnabled: */
      true,
      /* hideGutter: */
      true
    );
    treeOutline.rootDOMNode = node;
    treeOutline.deindentSingleNode();
    treeOutline.setVisible(true);
    treeOutline.element.treeElementForTest = treeOutline.firstChild();
    treeOutline.setShowSelectionOnKeyboardFocus(
      /* show: */
      true,
      /* preventTabOrder: */
      true
    );
    if (options?.expand) {
      treeOutline.firstChild()?.expand();
    }
    const dispatchDimensionChange = () => {
      treeOutline.element.dispatchEvent(new CustomEvent("dimensionschanged"));
    };
    treeOutline.addEventListener(UI.TreeOutline.Events.ElementAttached, dispatchDimensionChange);
    treeOutline.addEventListener(UI.TreeOutline.Events.ElementExpanded, dispatchDimensionChange);
    treeOutline.addEventListener(UI.TreeOutline.Events.ElementCollapsed, dispatchDimensionChange);
    return {
      element: treeOutline.element,
      forceSelect: treeOutline.forceSelect.bind(treeOutline)
    };
  }
}
//# sourceMappingURL=ElementsTreeOutlineRenderer.js.map
