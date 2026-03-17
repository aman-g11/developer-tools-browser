"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Protocol from "../../generated/protocol.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as JSON5 from "../../third_party/json5/json5.js";
import * as SourceFrame from "../../ui/legacy/components/source_frame/source_frame.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import { KeyValueStorageItemsView } from "./KeyValueStorageItemsView.js";
const UIStrings = {
  /**
   * @description Name for the "Extension Storage Items" table that shows the content of the extension Storage.
   */
  extensionStorageItems: "Extension Storage Items",
  /**
   * @description Text for announcing that the "Extension Storage Items" table was cleared, that is, all
   * entries were deleted.
   */
  extensionStorageItemsCleared: "Extension Storage Items cleared"
};
const str_ = i18n.i18n.registerUIStrings("panels/application/ExtensionStorageItemsView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export var ExtensionStorageItemsDispatcher;
((ExtensionStorageItemsDispatcher2) => {
  let Events;
  ((Events2) => {
    Events2["ITEM_EDITED"] = "ItemEdited";
    Events2["ITEMS_REFRESHED"] = "ItemsRefreshed";
  })(Events = ExtensionStorageItemsDispatcher2.Events || (ExtensionStorageItemsDispatcher2.Events = {}));
})(ExtensionStorageItemsDispatcher || (ExtensionStorageItemsDispatcher = {}));
export class ExtensionStorageItemsView extends KeyValueStorageItemsView {
  #extensionStorage;
  extensionStorageItemsDispatcher;
  constructor(extensionStorage, view) {
    super(
      i18nString(UIStrings.extensionStorageItems),
      "extension-storage",
      true,
      view,
      void 0,
      { jslog: `${VisualLogging.pane().context("extension-storage-data")}`, classes: ["storage-view", "table"] }
    );
    this.extensionStorageItemsDispatcher = new Common.ObjectWrapper.ObjectWrapper();
    this.setStorage(extensionStorage);
  }
  get #isEditable() {
    return this.#extensionStorage.storageArea !== Protocol.Extensions.StorageArea.Managed;
  }
  /**
   * When parsing a value provided by the user, attempt to treat it as JSON,
   * falling back to a string otherwise.
   */
  parseValue(input) {
    try {
      return JSON5.parse(input);
    } catch {
      return input;
    }
  }
  removeItem(key) {
    void this.#extensionStorage.removeItem(key).then(() => {
      this.refreshItems();
    });
  }
  setItem(key, value) {
    void this.#extensionStorage.setItem(key, this.parseValue(value)).then(() => {
      this.refreshItems();
      this.extensionStorageItemsDispatcher.dispatchEventToListeners("ItemEdited" /* ITEM_EDITED */);
    });
  }
  createPreview(key, value) {
    const url = "extension-storage://" + this.#extensionStorage.extensionId + "/" + this.#extensionStorage.storageArea + "/preview/" + key;
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
  setStorage(extensionStorage) {
    this.#extensionStorage = extensionStorage;
    this.editable = this.#isEditable;
    this.refreshItems();
  }
  #extensionStorageItemsCleared() {
    if (!this.isShowing()) {
      return;
    }
    this.itemsCleared();
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.extensionStorageItemsCleared));
  }
  deleteSelectedItem() {
    if (!this.#isEditable) {
      return;
    }
    this.deleteSelectedItem();
  }
  refreshItems() {
    void this.#refreshItems();
  }
  async #refreshItems() {
    const items = await this.#extensionStorage.getItems();
    if (!items || !this.toolbar) {
      return;
    }
    const filteredItems = Object.entries(items).map(([key, value]) => ({ key, value: typeof value === "string" ? value : JSON.stringify(value) })).filter((item) => this.toolbar?.filterRegex?.test(`${item.key} ${item.value}`) ?? true);
    this.showItems(filteredItems);
    this.extensionStorageItemsDispatcher.dispatchEventToListeners(
      "ItemsRefreshed" /* ITEMS_REFRESHED */
    );
  }
  deleteAllItems() {
    if (!this.#isEditable) {
      return;
    }
    this.#extensionStorage.clear().then(
      () => {
        this.#extensionStorageItemsCleared();
      },
      () => {
        throw new Error("Unable to clear storage.");
      }
    );
  }
}
//# sourceMappingURL=ExtensionStorageItemsView.js.map
