"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as SourceFrame from "../../ui/legacy/components/source_frame/source_frame.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { DOMStorage } from "./DOMStorageModel.js";
import { KeyValueStorageItemsView } from "./KeyValueStorageItemsView.js";
const UIStrings = {
  /**
   * @description Name for the "DOM Storage Items" table that shows the content of the DOM Storage.
   */
  domStorageItems: "DOM Storage Items",
  /**
   * @description Text for announcing that the "DOM Storage Items" table was cleared, that is, all
   * entries were deleted.
   */
  domStorageItemsCleared: "DOM Storage Items cleared",
  /**
   * @description Text for announcing a DOM Storage key/value item has been deleted
   */
  domStorageItemDeleted: "The storage item was deleted."
};
const str_ = i18n.i18n.registerUIStrings("panels/application/DOMStorageItemsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class DOMStorageItemsView extends KeyValueStorageItemsView {
  domStorage;
  eventListeners;
  constructor(domStorage) {
    super(i18nString(UIStrings.domStorageItems), "dom-storage", true);
    this.domStorage = domStorage;
    if (domStorage.storageKey) {
      this.toolbar?.setStorageKey(domStorage.storageKey);
    }
    this.element.classList.add("storage-view", "table");
    this.showPreview(null, null);
    this.eventListeners = [];
    this.setStorage(domStorage);
  }
  createPreview(key, value) {
    const protocol = this.domStorage.isLocalStorage ? "localstorage" : "sessionstorage";
    const url = `${protocol}://${key}`;
    const provider = TextUtils.StaticContentProvider.StaticContentProvider.fromString(
      url,
      Common.ResourceType.resourceTypes.XHR,
      value
    );
    return SourceFrame.PreviewFactory.PreviewFactory.createPreview(
      provider,
      "text/plain"
    );
  }
  setStorage(domStorage) {
    Common.EventTarget.removeEventListeners(this.eventListeners);
    this.domStorage = domStorage;
    const storageKind = domStorage.isLocalStorage ? "local-storage-data" : "session-storage-data";
    this.element.setAttribute("jslog", `${VisualLogging.pane().context(storageKind)}`);
    if (domStorage.storageKey) {
      this.toolbar?.setStorageKey(domStorage.storageKey);
    }
    this.eventListeners = [
      this.domStorage.addEventListener(DOMStorage.Events.DOM_STORAGE_ITEMS_CLEARED, this.domStorageItemsCleared, this),
      this.domStorage.addEventListener(DOMStorage.Events.DOM_STORAGE_ITEM_REMOVED, this.domStorageItemRemoved, this),
      this.domStorage.addEventListener(DOMStorage.Events.DOM_STORAGE_ITEM_ADDED, this.domStorageItemAdded, this),
      this.domStorage.addEventListener(DOMStorage.Events.DOM_STORAGE_ITEM_UPDATED, this.domStorageItemUpdated, this)
    ];
    this.refreshItems();
  }
  domStorageItemsCleared() {
    if (!this.isShowing()) {
      return;
    }
    this.itemsCleared();
  }
  itemsCleared() {
    super.itemsCleared();
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.domStorageItemsCleared));
  }
  domStorageItemRemoved(event) {
    if (!this.isShowing()) {
      return;
    }
    this.itemRemoved(event.data.key);
  }
  itemRemoved(key) {
    super.itemRemoved(key);
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.domStorageItemDeleted));
  }
  domStorageItemAdded(event) {
    if (!this.isShowing()) {
      return;
    }
    this.itemAdded(event.data.key, event.data.value);
  }
  domStorageItemUpdated(event) {
    if (!this.isShowing()) {
      return;
    }
    this.itemUpdated(event.data.key, event.data.value);
  }
  refreshItems() {
    void this.#refreshItems();
  }
  async #refreshItems() {
    const items = await this.domStorage.getItems();
    if (!items || !this.toolbar) {
      return;
    }
    const { filterRegex } = this.toolbar;
    const filteredItems = items.map((item) => ({ key: item[0], value: item[1] })).filter((item) => filterRegex?.test(`${item.key} ${item.value}`) ?? true);
    this.showItems(filteredItems);
  }
  deleteAllItems() {
    this.domStorage.clear();
    this.domStorageItemsCleared();
  }
  removeItem(key) {
    this.domStorage?.removeItem(key);
  }
  setItem(key, value) {
    this.domStorage?.setItem(key, value);
  }
}
//# sourceMappingURL=DOMStorageItemsView.js.map
