"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as Lit from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { ConsoleFilter, FilterType } from "./ConsoleFilter.js";
import consoleSidebarStyles from "./consoleSidebar.css.js";
const UIStrings = {
  /**
   * @description Filter name in Console Sidebar of the Console panel. This is shown when we fail to
   * parse a URL when trying to display console messages from each URL separately. This might be
   * because the console message does not come from any particular URL. This should be translated as
   * a term that indicates 'not one of the other URLs listed here'.
   */
  other: "<other>",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many user messages exist.
   */
  dUserMessages: "{n, plural, =0 {No user messages} =1 {# user message} other {# user messages}}",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many messages exist.
   */
  dMessages: "{n, plural, =0 {No messages} =1 {# message} other {# messages}}",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many errors exist.
   */
  dErrors: "{n, plural, =0 {No errors} =1 {# error} other {# errors}}",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many warnings exist.
   */
  dWarnings: "{n, plural, =0 {No warnings} =1 {# warning} other {# warnings}}",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many info messages exist.
   */
  dInfo: "{n, plural, =0 {No info} =1 {# info} other {# info}}",
  /**
   * @description Text in Console Sidebar of the Console panel to show how many verbose messages exist.
   */
  dVerbose: "{n, plural, =0 {No verbose} =1 {# verbose} other {# verbose}}"
};
const str_ = i18n.i18n.registerUIStrings("panels/console/ConsoleSidebar.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { render, html, nothing } = Lit;
export var GroupName = /* @__PURE__ */ ((GroupName2) => {
  GroupName2["CONSOLE_API"] = "user message";
  GroupName2["ALL"] = "message";
  GroupName2["ERROR"] = "error";
  GroupName2["WARNING"] = "warning";
  GroupName2["INFO"] = "info";
  GroupName2["VERBOSE"] = "verbose";
  return GroupName2;
})(GroupName || {});
const GROUP_ICONS = {
  ["message" /* ALL */]: { icon: "list", label: UIStrings.dMessages },
  ["user message" /* CONSOLE_API */]: { icon: "profile", label: UIStrings.dUserMessages },
  ["error" /* ERROR */]: { icon: "cross-circle", label: UIStrings.dErrors },
  ["warning" /* WARNING */]: { icon: "warning", label: UIStrings.dWarnings },
  ["info" /* INFO */]: { icon: "info", label: UIStrings.dInfo },
  ["verbose" /* VERBOSE */]: { icon: "bug", label: UIStrings.dVerbose }
};
export const DEFAULT_VIEW = (input, output, target) => {
  render(
    html`<devtools-tree
        navigation-variant
        hide-overflow
        .template=${html`
          <ul role="tree">
            ${input.groups.map(
      (group) => html`
              <li
                role="treeitem"
                @select=${() => input.onSelectionChanged(group.filter)}
                ?selected=${group.filter === input.selectedFilter}>
                  <style>${consoleSidebarStyles}</style>
                  <devtools-icon name=${GROUP_ICONS[group.name].icon}></devtools-icon>
                  ${/* eslint-disable-next-line @devtools/l10n-i18nString-call-only-with-uistrings */
      i18nString(GROUP_ICONS[group.name].label, {
        n: group.messageCount
      })}
                  ${group.messageCount === 0 ? nothing : html`
                  <ul role="group">
                    ${group.urlGroups.values().map((urlGroup) => html`
                      <li
                        @select=${() => input.onSelectionChanged(urlGroup.filter)}
                        role="treeitem"
                        ?selected=${urlGroup.filter === input.selectedFilter}
                        title=${urlGroup.url ?? ""}>
                          <devtools-icon name=document></devtools-icon>
                          ${urlGroup.filter.name} <span class=count>${urlGroup.count}</span>
                      </li>`)}
                  </ul>`}
              </li>`
    )}
        </ul>`}
        ></devtools-tree>`,
    target
  );
};
export class ConsoleFilterGroup {
  urlGroups = /* @__PURE__ */ new Map();
  messageCount = 0;
  name;
  filter;
  constructor(name, parsedFilters, levelsMask) {
    this.name = name;
    this.filter = new ConsoleFilter(name, parsedFilters, null, levelsMask);
  }
  onMessage(viewMessage) {
    const message = viewMessage.consoleMessage();
    const shouldIncrementCounter = message.type !== SDK.ConsoleModel.FrontendMessageType.Command && message.type !== SDK.ConsoleModel.FrontendMessageType.Result && !message.isGroupMessage();
    if (!this.filter.shouldBeVisible(viewMessage) || !shouldIncrementCounter) {
      return;
    }
    const child = this.#getUrlGroup(message.url || null);
    child.count++;
    this.messageCount++;
  }
  clear() {
    this.messageCount = 0;
    this.urlGroups.clear();
  }
  #getUrlGroup(url) {
    let child = this.urlGroups.get(url);
    if (child) {
      return child;
    }
    const filter = this.filter.clone();
    child = { filter, url, count: 0 };
    const parsedURL = url ? Common.ParsedURL.ParsedURL.fromString(url) : null;
    if (url) {
      filter.name = parsedURL ? parsedURL.displayName : url;
    } else {
      filter.name = i18nString(UIStrings.other);
    }
    filter.parsedFilters.push({ key: FilterType.Url, text: url, negative: false, regex: void 0 });
    this.urlGroups.set(url, child);
    return child;
  }
}
const CONSOLE_API_PARSED_FILTERS = [{
  key: FilterType.Source,
  text: Common.Console.FrontendMessageSource.ConsoleAPI,
  negative: false,
  regex: void 0
}];
export class ConsoleSidebar extends Common.ObjectWrapper.eventMixin(UI.Widget.VBox) {
  #view;
  #groups = [
    new ConsoleFilterGroup("message" /* ALL */, [], ConsoleFilter.allLevelsFilterValue()),
    new ConsoleFilterGroup("user message" /* CONSOLE_API */, CONSOLE_API_PARSED_FILTERS, ConsoleFilter.allLevelsFilterValue()),
    new ConsoleFilterGroup("error" /* ERROR */, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Error)),
    new ConsoleFilterGroup("warning" /* WARNING */, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Warning)),
    new ConsoleFilterGroup("info" /* INFO */, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Info)),
    new ConsoleFilterGroup("verbose" /* VERBOSE */, [], ConsoleFilter.singleLevelMask(Protocol.Log.LogEntryLevel.Verbose))
  ];
  #selectedFilterSetting = Common.Settings.Settings.instance().createSetting("console.sidebar-selected-filter", null);
  #selectedFilter = this.#groups.find((group) => group.name === this.#selectedFilterSetting.get())?.filter;
  constructor(element, view = DEFAULT_VIEW) {
    super(element, {
      jslog: `${VisualLogging.pane("sidebar").track({ resize: true })}`,
      useShadowDom: true
    });
    this.#view = view;
    this.setMinimumSize(125, 0);
    this.performUpdate();
  }
  performUpdate() {
    const input = {
      groups: this.#groups,
      selectedFilter: this.#selectedFilter ?? this.#groups[0].filter,
      onSelectionChanged: (filter) => {
        this.#selectedFilter = filter;
        this.#selectedFilterSetting.set(filter.name);
        this.dispatchEventToListeners("FilterSelected" /* FILTER_SELECTED */);
      }
    };
    this.#view(input, {}, this.contentElement);
  }
  clear() {
    for (const group of this.#groups) {
      group.clear();
    }
    this.requestUpdate();
  }
  onMessageAdded(viewMessage) {
    for (const group of this.#groups) {
      group.onMessage(viewMessage);
    }
    this.requestUpdate();
  }
  shouldBeVisible(viewMessage) {
    return this.#selectedFilter?.shouldBeVisible(viewMessage) ?? true;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["FILTER_SELECTED"] = "FilterSelected";
  return Events2;
})(Events || {});
//# sourceMappingURL=ConsoleSidebar.js.map
