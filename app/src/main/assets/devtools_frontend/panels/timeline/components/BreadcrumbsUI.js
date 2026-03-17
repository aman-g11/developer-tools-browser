"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Trace from "../../../models/trace/trace.js";
import * as ComponentHelpers from "../../../ui/components/helpers/helpers.js";
import * as UI from "../../../ui/legacy/legacy.js";
import * as Lit from "../../../ui/lit/lit.js";
import * as VisualLogging from "../../../ui/visual_logging/visual_logging.js";
import { flattenBreadcrumbs } from "./Breadcrumbs.js";
import breadcrumbsUIStyles from "./breadcrumbsUI.css.js";
const { render, html } = Lit;
const UIStrings = {
  /**
   * @description A context menu item in the Minimap Breadcrumb context menu.
   * This context menu option activates the breadcrumb that the context menu was opened on.
   */
  activateBreadcrumb: "Activate breadcrumb",
  /**
   * @description A context menu item in the Minimap Breadcrumb context menu.
   * This context menu option removed all the child breadcrumbs and activates
   * the breadcrumb that the context menu was opened on.
   */
  removeChildBreadcrumbs: "Remove child breadcrumbs"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/BreadcrumbsUI.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class BreadcrumbActivatedEvent extends Event {
  constructor(breadcrumb, childBreadcrumbsRemoved) {
    super(BreadcrumbActivatedEvent.eventName);
    this.breadcrumb = breadcrumb;
    this.childBreadcrumbsRemoved = childBreadcrumbsRemoved;
  }
  static eventName = "breadcrumbactivated";
}
export class BreadcrumbsUI extends HTMLElement {
  #shadow = this.attachShadow({ mode: "open" });
  #initialBreadcrumb = null;
  #activeBreadcrumb = null;
  set data(data) {
    this.#initialBreadcrumb = data.initialBreadcrumb;
    this.#activeBreadcrumb = data.activeBreadcrumb;
    void ComponentHelpers.ScheduledRender.scheduleRender(this, this.#render);
  }
  #activateBreadcrumb(breadcrumb) {
    this.#activeBreadcrumb = breadcrumb;
    this.dispatchEvent(new BreadcrumbActivatedEvent(breadcrumb));
  }
  #showBreadcrumbsAndScrollLastCrumbIntoView() {
    const container = this.#shadow.querySelector(".breadcrumbs");
    if (!container) {
      return;
    }
    container.style.display = "flex";
    requestAnimationFrame(() => {
      if (container.scrollWidth - container.clientWidth > 0) {
        requestAnimationFrame(() => {
          container.scrollLeft = container.scrollWidth - container.clientWidth;
        });
      }
    });
  }
  #onContextMenu(event, breadcrumb) {
    const menu = new UI.ContextMenu.ContextMenu(event);
    menu.defaultSection().appendItem(i18nString(UIStrings.activateBreadcrumb), () => {
      this.dispatchEvent(new BreadcrumbActivatedEvent(breadcrumb));
    });
    menu.defaultSection().appendItem(i18nString(UIStrings.removeChildBreadcrumbs), () => {
      this.dispatchEvent(new BreadcrumbActivatedEvent(breadcrumb, true));
    });
    void menu.show();
  }
  #renderElement(breadcrumb, index) {
    const breadcrumbRange = Trace.Helpers.Timing.microToMilli(breadcrumb.window.range);
    return html`
          <div class="breadcrumb" @contextmenu=${(event) => this.#onContextMenu(event, breadcrumb)} @click=${() => this.#activateBreadcrumb(breadcrumb)}
          jslog=${VisualLogging.item("timeline.breadcrumb-select").track({ click: true, resize: true })}>
           <span class="${breadcrumb === this.#activeBreadcrumb ? "active-breadcrumb" : ""} range">
            ${index === 0 ? `Full range (${i18n.TimeUtilities.preciseMillisToString(breadcrumbRange, 2)})` : `${i18n.TimeUtilities.preciseMillisToString(breadcrumbRange, 2)}`}
            </span>
          </div>
          ${breadcrumb.child !== null ? html`
            <devtools-icon name="chevron-right" class="medium">` : ""}
      `;
  }
  #render() {
    const output = html`
      <style>${breadcrumbsUIStyles}</style>
      ${this.#initialBreadcrumb === null ? Lit.nothing : html`<div class="breadcrumbs" jslog=${VisualLogging.section("breadcrumbs")}>
        ${flattenBreadcrumbs(this.#initialBreadcrumb).map((breadcrumb, index) => this.#renderElement(breadcrumb, index))}
      </div>`}
    `;
    render(output, this.#shadow, { host: this });
    if (this.#initialBreadcrumb?.child) {
      this.#showBreadcrumbsAndScrollLastCrumbIntoView();
    }
  }
}
customElements.define("devtools-breadcrumbs-ui", BreadcrumbsUI);
//# sourceMappingURL=BreadcrumbsUI.js.map
