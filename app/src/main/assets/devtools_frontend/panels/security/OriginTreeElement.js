"use strict";
import * as Protocol from "../../generated/protocol.js";
import { SecurityPanelSidebarTreeElement } from "./SecurityPanelSidebarTreeElement.js";
export class ShowOriginEvent extends Event {
  static eventName = "showorigin";
  origin;
  constructor(origin) {
    super(ShowOriginEvent.eventName, { bubbles: true, composed: true });
    this.origin = origin;
  }
}
export class OriginTreeElement extends SecurityPanelSidebarTreeElement {
  #securityState;
  #renderTreeElement;
  #origin = null;
  constructor(className, renderTreeElement, origin = null) {
    super();
    this.#renderTreeElement = renderTreeElement;
    this.#origin = origin;
    this.listItemElement.classList.add(className);
    this.#securityState = null;
    this.setSecurityState(Protocol.Security.SecurityState.Unknown);
  }
  setSecurityState(newSecurityState) {
    this.#securityState = newSecurityState;
    this.#renderTreeElement(this);
  }
  securityState() {
    return this.#securityState;
  }
  origin() {
    return this.#origin;
  }
  showElement() {
    this.listItemElement.dispatchEvent(new ShowOriginEvent(this.#origin));
  }
}
//# sourceMappingURL=OriginTreeElement.js.map
