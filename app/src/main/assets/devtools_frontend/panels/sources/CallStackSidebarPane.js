"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as Persistence from "../../models/persistence/persistence.js";
import * as StackTrace from "../../models/stack_trace/stack_trace.js";
import * as Workspace from "../../models/workspace/workspace.js";
import { Icon } from "../../ui/kit/kit.js";
import * as UI from "../../ui/legacy/legacy.js";
import { Directives, html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import callStackSidebarPaneStyles from "./callStackSidebarPane.css.js";
import { QuickSourceView, SourcesPanel } from "./SourcesPanel.js";
const UIStrings = {
  /**
   * @description Text in Call Stack Sidebar Pane of the Sources panel
   */
  callStack: "Call Stack",
  /**
   * @description Not paused message element text content in Call Stack Sidebar Pane of the Sources panel
   */
  notPaused: "Not paused",
  /**
   * @description Text exposed to screen reader when navigating through a ignore-listed call frame in the sources panel
   */
  onIgnoreList: "on ignore list",
  /**
   * @description Show all link text content in Call Stack Sidebar Pane of the Sources panel
   */
  showIgnorelistedFrames: "Show ignore-listed frames",
  /**
   * @description Text to show more content
   */
  showMore: "Show more",
  /**
   * @description A context menu item in the Call Stack Sidebar Pane of the Sources panel
   */
  copyStackTrace: "Copy stack trace",
  /**
   * @description Text in Call Stack Sidebar Pane of the Sources panel when some call frames have warnings
   */
  callFrameWarnings: "Some call frames have warnings",
  /**
   * @description Error message that is displayed in UI when a file needed for debugging information for a call frame is missing
   * @example {src/myapp.debug.wasm.dwp} PH1
   */
  debugFileNotFound: 'Failed to load debug file "{PH1}".',
  /**
   * @description A context menu item in the Call Stack Sidebar Pane. "Restart" is a verb and
   * "frame" is a noun. "Frame" refers to an individual item in the call stack, i.e. a call frame.
   * The user opens this context menu by selecting a specific call frame in the call stack sidebar pane.
   */
  restartFrame: "Restart frame",
  /**
   * @description Error message that is displayed in UI debugging information cannot be found for a call frame
   * @example {main} PH1
   */
  failedToLoadDebugSymbolsForFunction: 'No debug information for function "{PH1}"',
  /**
   * @description Error message that is displayed in UI when a file needed for debugging information for a call frame is missing
   * @example {mainp.debug.wasm.dwp} PH1
   */
  debugSymbolsIncomplete: "The debug information for function {PH1} is incomplete"
};
const str_ = i18n.i18n.registerUIStrings("panels/sources/CallStackSidebarPane.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { createRef, ref } = Directives;
let callstackSidebarPaneInstance;
export class CallStackSidebarPane extends UI.View.SimpleView {
  ignoreListMessageElement;
  ignoreListCheckboxElement;
  notPausedMessageElement;
  callFrameWarningsElement;
  items;
  list;
  showMoreMessageElement;
  showIgnoreListed = false;
  maxAsyncStackChainDepth = defaultMaxAsyncStackChainDepth;
  updateItemThrottler = new Common.Throttler.Throttler(100);
  scheduledForUpdateItems = /* @__PURE__ */ new Set();
  muteActivateItem;
  #stackTrace = null;
  constructor() {
    super({
      jslog: `${VisualLogging.section("sources.callstack")}`,
      title: i18nString(UIStrings.callStack),
      viewId: "sources.callstack",
      useShadowDom: true
    });
    const [ignoreListMessageRef, ignoreListCheckboxRef, notPausedRef, warningRef, showMoreRef] = [
      createRef(),
      createRef(),
      createRef(),
      createRef(),
      createRef()
    ];
    const ignoreListCheckboxChanged = () => {
      this.showIgnoreListed = Boolean(ignoreListCheckboxRef.value?.checked);
      for (const item of this.items) {
        this.refreshItem(item);
      }
    };
    this.items = new UI.ListModel.ListModel();
    this.list = new UI.ListControl.ListControl(this.items, this, UI.ListControl.ListMode.NonViewport);
    this.list.element.addEventListener("contextmenu", this.onContextMenu.bind(this), false);
    self.onInvokeElement(this.list.element, (event) => {
      const item = this.list.itemForNode(event.target);
      if (item) {
        this.activateItem(item);
        event.consume(true);
      }
    });
    const onShowMoreClicked = () => {
      this.maxAsyncStackChainDepth += defaultMaxAsyncStackChainDepth;
      this.requestUpdate();
    };
    render(html`
      <style>${callStackSidebarPaneStyles}</style>
      <div class='ignore-listed-message' ${ref(ignoreListMessageRef)}>
        <label class='ignore-listed-message-label'>
          <input type='checkbox' tabindex=0 class='ignore-listed-checkbox'
              @change=${ignoreListCheckboxChanged} ${ref(ignoreListCheckboxRef)} />
          ${i18nString(UIStrings.showIgnorelistedFrames)}
        </label>
      </div>
      <div class='gray-info-message' tabindex=-1 ${ref(notPausedRef)}>
        ${i18nString(UIStrings.notPaused)}
      </div>
      <div class='call-frame-warnings-message' tabindex=-1 ${ref(warningRef)}>
        <devtools-icon .name=${"warning-filled"} class='call-frame-warning-icon small'></devtools-icon>
        ${i18nString(UIStrings.callFrameWarnings)}
      </div>
      ${this.list.element}
      <div class='show-more-message hidden' ${ref(showMoreRef)}>
        <button class='link' @click=${onShowMoreClicked}>${i18nString(UIStrings.showMore)}</button>
      </div>
    `, this.contentElement);
    this.ignoreListMessageElement = ignoreListMessageRef.value;
    this.ignoreListCheckboxElement = ignoreListCheckboxRef.value;
    this.notPausedMessageElement = notPausedRef.value;
    this.callFrameWarningsElement = warningRef.value;
    this.showMoreMessageElement = showMoreRef.value;
    this.requestUpdate();
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!callstackSidebarPaneInstance || forceNew) {
      callstackSidebarPaneInstance = new CallStackSidebarPane();
    }
    return callstackSidebarPaneInstance;
  }
  async flavorChanged(details) {
    this.showIgnoreListed = false;
    this.ignoreListCheckboxElement.checked = false;
    this.maxAsyncStackChainDepth = defaultMaxAsyncStackChainDepth;
    if (this.#stackTrace) {
      this.#stackTrace.removeEventListener(StackTrace.StackTrace.Events.UPDATED, this.requestUpdate, this);
      this.#stackTrace = null;
      this.requestUpdate();
    }
    if (details) {
      this.#stackTrace = await Bindings.DebuggerWorkspaceBinding.DebuggerWorkspaceBinding.instance().createStackTraceFromDebuggerPaused(details, details.debuggerModel.target());
      this.#stackTrace.addEventListener(StackTrace.StackTrace.Events.UPDATED, this.requestUpdate, this);
    }
    this.requestUpdate();
  }
  performUpdate() {
    this.callFrameWarningsElement.classList.add("hidden");
    if (!this.#stackTrace) {
      this.notPausedMessageElement.classList.remove("hidden");
      this.ignoreListMessageElement.classList.add("hidden");
      this.showMoreMessageElement.classList.add("hidden");
      this.items.replaceAll([]);
      UI.Context.Context.instance().setFlavor(StackTrace.StackTrace.DebuggableFrameFlavor, null);
      return;
    }
    this.notPausedMessageElement.classList.add("hidden");
    const items = [];
    const uniqueWarnings = /* @__PURE__ */ new Set();
    for (const frame of this.#stackTrace.syncFragment.frames) {
      items.push(Item.createForDebuggableFrame(frame));
      if (frame.missingDebugInfo) {
        uniqueWarnings.add(convertMissingDebugInfo(frame.missingDebugInfo, frame.sdkFrame.functionName).details);
      }
    }
    if (uniqueWarnings.size) {
      this.callFrameWarningsElement.classList.remove("hidden");
      UI.Tooltip.Tooltip.install(this.callFrameWarningsElement, Array.from(uniqueWarnings).join("\n"));
    }
    let { maxAsyncStackChainDepth } = this;
    let hasMore = false;
    for (const asyncFragment of this.#stackTrace.asyncFragments) {
      items.push(Item.createForAsyncHeader(this.#stackTrace, asyncFragment));
      for (const frame of asyncFragment.frames) {
        items.push(Item.createForFrame(frame));
      }
      if (--maxAsyncStackChainDepth <= 0) {
        hasMore = asyncFragment !== this.#stackTrace.asyncFragments.at(-1);
        break;
      }
    }
    this.showMoreMessageElement.classList.toggle("hidden", !hasMore);
    this.items.replaceAll(items);
    for (const item of this.items) {
      this.refreshItem(item);
    }
    if (this.maxAsyncStackChainDepth === defaultMaxAsyncStackChainDepth) {
      this.list.selectNextItem(
        true,
        false
        /* center */
      );
      const selectedItem = this.list.selectedItem();
      if (selectedItem && (UI.Context.Context.instance().flavor(QuickSourceView) || UI.Context.Context.instance().flavor(SourcesPanel))) {
        this.activateItem(selectedItem);
      }
    }
    this.updatedForTest();
  }
  updatedForTest() {
  }
  refreshItem(item) {
    this.scheduledForUpdateItems.add(item);
    void this.updateItemThrottler.schedule(async () => {
      const items = Array.from(this.scheduledForUpdateItems);
      this.scheduledForUpdateItems.clear();
      this.muteActivateItem = true;
      if (!this.showIgnoreListed && this.items.every((item2) => item2.isIgnoreListed)) {
        this.showIgnoreListed = true;
        for (let i = 0; i < this.items.length; ++i) {
          this.list.refreshItemByIndex(i);
        }
        this.ignoreListMessageElement.classList.toggle("hidden", true);
      } else {
        this.showIgnoreListed = this.ignoreListCheckboxElement.checked;
        const itemsSet = new Set(items);
        let hasIgnoreListed = false;
        for (let i = 0; i < this.items.length; ++i) {
          const item2 = this.items.at(i);
          if (itemsSet.has(item2)) {
            this.list.refreshItemByIndex(i);
          }
          hasIgnoreListed = hasIgnoreListed || item2.isIgnoreListed;
        }
        this.ignoreListMessageElement.classList.toggle("hidden", !hasIgnoreListed);
      }
      delete this.muteActivateItem;
    });
  }
  createElementForItem(item) {
    const element = document.createElement("div");
    element.classList.add("call-frame-item");
    const title = element.createChild("div", "call-frame-item-title");
    const titleElement = title.createChild("div", "call-frame-title-text");
    titleElement.textContent = item.title;
    if (item.isAsyncHeader) {
      element.classList.add("async-header");
    } else {
      UI.Tooltip.Tooltip.install(titleElement, item.title);
      const linkElement = element.createChild("div", "call-frame-location");
      linkElement.textContent = Platform.StringUtilities.trimMiddle(item.linkText, 30);
      UI.Tooltip.Tooltip.install(linkElement, item.linkText);
      element.classList.toggle("ignore-listed-call-frame", item.isIgnoreListed);
      if (item.isIgnoreListed) {
        UI.ARIAUtils.setDescription(element, i18nString(UIStrings.onIgnoreList));
      }
      if (!item.frame) {
        UI.ARIAUtils.setDisabled(element, true);
      }
    }
    const isSelected = item.frame === UI.Context.Context.instance().flavor(StackTrace.StackTrace.DebuggableFrameFlavor)?.frame;
    element.classList.toggle("selected", isSelected);
    UI.ARIAUtils.setSelected(element, isSelected);
    element.classList.toggle("hidden", !this.showIgnoreListed && item.isIgnoreListed);
    const icon = new Icon();
    icon.name = "large-arrow-right-filled";
    icon.classList.add("selected-call-frame-icon", "small");
    element.appendChild(icon);
    element.tabIndex = item === this.list.selectedItem() ? 0 : -1;
    if (item.frame?.missingDebugInfo) {
      const icon2 = new Icon();
      icon2.name = "warning-filled";
      icon2.classList.add("call-frame-warning-icon", "small");
      const { resources, details } = convertMissingDebugInfo(item.frame.missingDebugInfo, item.frame.sdkFrame.functionName);
      const messages = resources.map(
        (r) => i18nString(UIStrings.debugFileNotFound, { PH1: Common.ParsedURL.ParsedURL.extractName(r.resourceUrl) })
      );
      UI.Tooltip.Tooltip.install(icon2, [details, ...messages].join("\n"));
      element.appendChild(icon2);
    }
    return element;
  }
  heightForItem(_item) {
    console.assert(false);
    return 0;
  }
  isItemSelectable(_item) {
    return true;
  }
  selectedItemChanged(_from, _to, fromElement, toElement) {
    if (fromElement) {
      fromElement.tabIndex = -1;
    }
    if (toElement) {
      this.setDefaultFocusedElement(toElement);
      toElement.tabIndex = 0;
      if (this.hasFocus()) {
        toElement.focus();
      }
    }
  }
  updateSelectedItemARIA(_fromElement, _toElement) {
    return true;
  }
  onContextMenu(event) {
    const item = this.list.itemForNode(event.target);
    if (!item) {
      return;
    }
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    const debuggerCallFrame = item.frame?.sdkFrame;
    if (debuggerCallFrame) {
      contextMenu.defaultSection().appendItem(i18nString(UIStrings.restartFrame), () => {
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.StackFrameRestarted);
        void debuggerCallFrame.restart();
      }, { disabled: !debuggerCallFrame.canBeRestarted, jslogContext: "restart-frame" });
    }
    contextMenu.defaultSection().appendItem(
      i18nString(UIStrings.copyStackTrace),
      this.copyStackTrace.bind(this),
      { jslogContext: "copy-stack-trace" }
    );
    if (item.uiLocation) {
      this.appendIgnoreListURLContextMenuItems(contextMenu, item.uiLocation.uiSourceCode);
    }
    void contextMenu.show();
  }
  activateItem(item) {
    const uiLocation = item.uiLocation;
    if (this.muteActivateItem || !uiLocation) {
      return;
    }
    this.list.selectItem(item);
    const debuggerCallFrame = item.frame;
    const oldItem = this.activeCallFrameItem();
    if (debuggerCallFrame) {
      debuggerCallFrame.sdkFrame.debuggerModel.setSelectedCallFrame(debuggerCallFrame.sdkFrame);
      UI.Context.Context.instance().setFlavor(
        StackTrace.StackTrace.DebuggableFrameFlavor,
        StackTrace.StackTrace.DebuggableFrameFlavor.for(debuggerCallFrame)
      );
    } else {
      void Common.Revealer.reveal(uiLocation);
    }
    if (oldItem !== item) {
      if (oldItem) {
        this.refreshItem(oldItem);
      }
      this.refreshItem(item);
    }
  }
  activeCallFrameItem() {
    const frameFlavor = UI.Context.Context.instance().flavor(StackTrace.StackTrace.DebuggableFrameFlavor);
    if (frameFlavor) {
      return this.items.find((callFrameItem) => callFrameItem.frame === frameFlavor.frame) || null;
    }
    return null;
  }
  appendIgnoreListURLContextMenuItems(contextMenu, uiSourceCode) {
    const binding = Persistence.Persistence.PersistenceImpl.instance().binding(uiSourceCode);
    if (binding) {
      uiSourceCode = binding.network;
    }
    const menuSection = contextMenu.section("ignoreList");
    if (menuSection.items.length > 0) {
      return;
    }
    for (const { text, callback, jslogContext } of Workspace.IgnoreListManager.IgnoreListManager.instance().getIgnoreListURLContextMenuItems(uiSourceCode)) {
      menuSection.appendItem(text, callback, { jslogContext });
    }
  }
  selectNextCallFrameOnStack() {
    const oldItem = this.activeCallFrameItem();
    const startIndex = oldItem ? this.items.indexOf(oldItem) + 1 : 0;
    for (let i = startIndex; i < this.items.length; i++) {
      const newItem = this.items.at(i);
      if (newItem.frame) {
        this.activateItem(newItem);
        break;
      }
    }
  }
  selectPreviousCallFrameOnStack() {
    const oldItem = this.activeCallFrameItem();
    const startIndex = oldItem ? this.items.indexOf(oldItem) - 1 : this.items.length - 1;
    for (let i = startIndex; i >= 0; i--) {
      const newItem = this.items.at(i);
      if (newItem.frame) {
        this.activateItem(newItem);
        break;
      }
    }
  }
  copyStackTrace() {
    const text = [];
    for (const item of this.items) {
      let itemText = item.title;
      if (item.uiLocation) {
        itemText += " (" + item.uiLocation.linkText(
          true
          /* skipTrim */
        ) + ")";
      }
      text.push(itemText);
    }
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(text.join("\n"));
  }
}
export const elementSymbol = Symbol("element");
export const defaultMaxAsyncStackChainDepth = 32;
export class ActionDelegate {
  handleAction(_context, actionId) {
    switch (actionId) {
      case "debugger.next-call-frame":
        CallStackSidebarPane.instance().selectNextCallFrameOnStack();
        return true;
      case "debugger.previous-call-frame":
        CallStackSidebarPane.instance().selectPreviousCallFrameOnStack();
        return true;
    }
    return false;
  }
}
export class Item {
  isIgnoreListed = false;
  title = "";
  linkText = "";
  uiLocation = null;
  isAsyncHeader = false;
  /** Only set for synchronous frames */
  frame;
  static createForDebuggableFrame(frame) {
    const item = Item.createForFrame(frame);
    item.frame = frame;
    return item;
  }
  static createForFrame(frame) {
    const item = new Item(UI.UIUtils.beautifyFunctionName(frame.name ?? ""));
    const uiSourceCode = frame.uiSourceCode;
    if (uiSourceCode) {
      item.isIgnoreListed = uiSourceCode.isIgnoreListed() ?? false;
      item.uiLocation = uiSourceCode.uiLocation(frame.line, frame.column);
      item.linkText = item.uiLocation.linkText();
    }
    return item;
  }
  static createForAsyncHeader(stackTrace, fragment) {
    const description = UI.UIUtils.asyncFragmentLabel(stackTrace, fragment);
    const item = new Item(description);
    item.isAsyncHeader = true;
    return item;
  }
  constructor(title) {
    this.title = title;
  }
}
export function convertMissingDebugInfo(missingDebugInfo, functionName) {
  switch (missingDebugInfo.type) {
    case StackTrace.StackTrace.MissingDebugInfoType.PARTIAL_INFO:
      return {
        details: i18nString(UIStrings.debugSymbolsIncomplete, { PH1: functionName ?? "" }),
        resources: missingDebugInfo.missingDebugFiles
      };
    case StackTrace.StackTrace.MissingDebugInfoType.NO_INFO:
      return {
        details: i18nString(UIStrings.failedToLoadDebugSymbolsForFunction, { PH1: functionName ?? "" }),
        resources: []
      };
  }
}
//# sourceMappingURL=CallStackSidebarPane.js.map
