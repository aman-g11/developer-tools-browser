"use strict";
import * as Host from "../../core/host/host.js";
import * as UIHelpers from "../helpers/helpers.js";
import { Link } from "../kit/kit.js";
import {
  copyLinkAddressLabel,
  openLinkExternallyLabel
} from "./UIUtils.js";
export class LinkContextMenuProvider {
  appendApplicableItems(_event, contextMenu, target) {
    let targetNode = target;
    while (targetNode && !(targetNode instanceof Link)) {
      targetNode = targetNode.parentNodeOrShadowHost();
    }
    if (!targetNode?.href) {
      return;
    }
    const node = targetNode;
    contextMenu.revealSection().appendItem(openLinkExternallyLabel(), () => {
      if (node.href) {
        UIHelpers.openInNewTab(node.href);
      }
    }, { jslogContext: "open-in-new-tab" });
    contextMenu.revealSection().appendItem(copyLinkAddressLabel(), () => {
      if (node.href) {
        Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(node.href);
      }
    }, { jslogContext: "copy-link-address" });
  }
}
//# sourceMappingURL=LinkContextMenuProvider.js.map
