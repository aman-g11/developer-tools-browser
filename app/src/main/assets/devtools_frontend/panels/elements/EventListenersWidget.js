"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as UI from "../../ui/legacy/legacy.js";
import { html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as EventListeners from "../event_listeners/event_listeners.js";
const { bindToAction, bindToSetting } = UI.UIUtils;
const UIStrings = {
  /**
   * @description Title of show framework listeners setting in event listeners widget of the elements panel
   */
  frameworkListeners: "Resolve `Framework` listeners",
  /**
   * @description Tooltip text that appears on the setting when hovering over it in Event Listeners Widget of the Elements panel
   */
  showListenersOnTheAncestors: "Show listeners on the ancestors",
  /**
   * @description Alternative title text of a setting in Event Listeners Widget of the Elements panel
   */
  ancestors: "Ancestors",
  /**
   * @description Title of dispatch filter in event listeners widget of the elements panel
   */
  eventListenersCategory: "Event listeners category",
  /**
   * @description Text for everything
   */
  all: "All",
  /**
   * @description Text in Event Listeners Widget of the Elements panel
   */
  passive: "Passive",
  /**
   * @description Text in Event Listeners Widget of the Elements panel
   */
  blocking: "Blocking",
  /**
   * @description Tooltip text that appears on the setting when hovering over it in Event Listeners Widget of the Elements panel
   */
  resolveEventListenersBoundWith: "Resolve event listeners bound with framework"
};
const str_ = i18n.i18n.registerUIStrings("panels/elements/EventListenersWidget.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { widget } = UI.Widget;
let eventListenersWidgetInstance;
export const DEFAULT_VIEW = (input, _output, target) => {
  render(html`
    <div jslog=${VisualLogging.pane("elements.event-listeners").track({ resize: true })}>
      <devtools-toolbar class="event-listener-toolbar" role="presentation">
        <devtools-button ${bindToAction(input.refreshEventListenersActionName)}></devtools-button>
        <devtools-checkbox title=${i18nString(UIStrings.showListenersOnTheAncestors)}
          ${bindToSetting(input.showForAncestorsSetting)}>
          ${i18nString(UIStrings.ancestors)}
        </devtools-checkbox>
        <select class="dispatch-filter"
          title=${i18nString(UIStrings.eventListenersCategory)}
          aria-label=${i18nString(UIStrings.eventListenersCategory)}
          jslog=${VisualLogging.filterDropdown().track({ change: true })}
          @change=${(e) => input.onDispatchFilterTypeChange(e.target.value)}>
          ${input.dispatchFilters.map((filter) => html`
            <option value=${filter.value} ?selected=${filter.value === input.selectedDispatchFilter}>
              ${filter.name}
            </option>`)}
        </select>
        <devtools-checkbox title=${i18nString(UIStrings.resolveEventListenersBoundWith)}
          ${bindToSetting(input.showFrameworkListenersSetting)}>
          ${i18nString(UIStrings.frameworkListeners)}
        </devtools-checkbox>
      </devtools-toolbar>
      ${widget(EventListeners.EventListenersView.EventListenersView, {
    changeCallback: input.onEventListenersViewChange,
    objects: input.eventListenerObjects,
    filter: input.filter
  })}
    </div>`, target);
};
export class EventListenersWidget extends UI.Widget.VBox {
  showForAncestorsSetting;
  dispatchFilterBySetting;
  showFrameworkListenersSetting;
  lastRequestedNode;
  #view;
  constructor(view = DEFAULT_VIEW) {
    super();
    this.#view = view;
    this.showForAncestorsSetting = Common.Settings.Settings.instance().moduleSetting("show-event-listeners-for-ancestors");
    this.showForAncestorsSetting.addChangeListener(this.requestUpdate.bind(this));
    this.dispatchFilterBySetting = Common.Settings.Settings.instance().createSetting("event-listener-dispatch-filter-type", DispatchFilterBy.All);
    this.dispatchFilterBySetting.addChangeListener(this.requestUpdate.bind(this));
    this.showFrameworkListenersSetting = Common.Settings.Settings.instance().createSetting("show-frameowkr-listeners", true);
    this.showFrameworkListenersSetting.setTitle(i18nString(UIStrings.frameworkListeners));
    this.showFrameworkListenersSetting.addChangeListener(this.requestUpdate.bind(this));
    UI.Context.Context.instance().addFlavorChangeListener(SDK.DOMModel.DOMNode, this.requestUpdate.bind(this));
    this.requestUpdate();
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!eventListenersWidgetInstance || forceNew) {
      eventListenersWidgetInstance = new EventListenersWidget();
    }
    return eventListenersWidgetInstance;
  }
  async performUpdate() {
    const dispatchFilter = this.dispatchFilterBySetting.get();
    const showPassive = dispatchFilter === DispatchFilterBy.All || dispatchFilter === DispatchFilterBy.Passive;
    const showBlocking = dispatchFilter === DispatchFilterBy.All || dispatchFilter === DispatchFilterBy.Blocking;
    const input = {
      refreshEventListenersActionName: "elements.refresh-event-listeners",
      showForAncestorsSetting: this.showForAncestorsSetting,
      dispatchFilterBySetting: this.dispatchFilterBySetting,
      showFrameworkListenersSetting: this.showFrameworkListenersSetting,
      onDispatchFilterTypeChange: (value) => {
        this.dispatchFilterBySetting.set(value);
      },
      onEventListenersViewChange: this.requestUpdate.bind(this),
      dispatchFilters: [
        { name: i18nString(UIStrings.all), value: DispatchFilterBy.All },
        { name: i18nString(UIStrings.passive), value: DispatchFilterBy.Passive },
        { name: i18nString(UIStrings.blocking), value: DispatchFilterBy.Blocking }
      ],
      selectedDispatchFilter: dispatchFilter,
      eventListenerObjects: [],
      filter: { showFramework: this.showFrameworkListenersSetting.get(), showPassive, showBlocking }
    };
    if (this.lastRequestedNode) {
      this.lastRequestedNode.domModel().runtimeModel().releaseObjectGroup(objectGroupName);
      delete this.lastRequestedNode;
    }
    const node = UI.Context.Context.instance().flavor(SDK.DOMModel.DOMNode);
    if (node) {
      this.lastRequestedNode = node;
      const selectedNodeOnly = !this.showForAncestorsSetting.get();
      const promises = [];
      promises.push(node.resolveToObject(objectGroupName));
      if (!selectedNodeOnly) {
        let currentNode = node.parentNode;
        while (currentNode) {
          promises.push(currentNode.resolveToObject(objectGroupName));
          currentNode = currentNode.parentNode;
        }
        promises.push(this.windowObjectInNodeContext(node));
      }
      input.eventListenerObjects = await Promise.all(promises);
    }
    this.#view(input, {}, this.contentElement);
  }
  wasShown() {
    UI.Context.Context.instance().setFlavor(EventListenersWidget, this);
    super.wasShown();
  }
  willHide() {
    super.willHide();
    UI.Context.Context.instance().setFlavor(EventListenersWidget, null);
  }
  windowObjectInNodeContext(node) {
    const executionContexts = node.domModel().runtimeModel().executionContexts();
    let context = executionContexts[0];
    if (node.frameId()) {
      for (let i = 0; i < executionContexts.length; ++i) {
        const executionContext = executionContexts[i];
        if (executionContext.frameId === node.frameId() && executionContext.isDefault) {
          context = executionContext;
        }
      }
    }
    return context.evaluate(
      {
        expression: "self",
        objectGroup: objectGroupName,
        includeCommandLineAPI: false,
        silent: true,
        returnByValue: false,
        generatePreview: false
      },
      /* userGesture */
      false,
      /* awaitPromise */
      false
    ).then((result) => {
      if ("object" in result) {
        return result.object;
      }
      return null;
    });
  }
  eventListenersArrivedForTest() {
  }
}
export const DispatchFilterBy = {
  All: "All",
  Blocking: "Blocking",
  Passive: "Passive"
};
const objectGroupName = "event-listeners-panel";
export class ActionDelegate {
  handleAction(_context, actionId) {
    switch (actionId) {
      case "elements.refresh-event-listeners": {
        EventListenersWidget.instance().requestUpdate();
        return true;
      }
    }
    return false;
  }
}
//# sourceMappingURL=EventListenersWidget.js.map
