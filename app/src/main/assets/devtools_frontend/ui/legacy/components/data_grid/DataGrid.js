"use strict";
import * as Common from "../../../../core/common/common.js";
import * as Host from "../../../../core/host/host.js";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Platform from "../../../../core/platform/platform.js";
import * as VisualLogging from "../../../visual_logging/visual_logging.js";
import * as UI from "../../legacy.js";
import dataGridStyles from "./dataGrid.css.js";
const UIStrings = {
  /**
   * @description Accessible text label for expandible nodes in datagrids
   */
  expanded: "expanded",
  /**
   * @description accessible name for expandible nodes in datagrids
   */
  collapsed: "collapsed",
  /**
   * @description Accessible text for datagrid
   * @example {Coverage grid} PH1
   * @example {expanded} PH2
   */
  sRowS: "{PH1} Row {PH2}",
  /**
   * @description Number of rows in a grid
   * @example {1} PH1
   */
  rowsS: "Rows: {PH1}",
  /**
   * @description Default Accessible Text for a Datagrid. This text is read to the user by a
   * screenreader when they navigate to a table structure. The placeholders tell the user something
   * brief about the table contents i.e. the topic and how much data is in it.
   * @example {Network} PH1
   * @example {Rows: 27} PH2
   */
  sSUseTheUpAndDownArrowKeysTo: "{PH1} {PH2}, use the up and down arrow keys to navigate and interact with the rows of the table; Use browse mode to read cell by cell.",
  /**
   * @description A context menu item in the Data Grid of a data grid
   */
  sortByString: "Sort by",
  /**
   * @description A context menu item in data grids to reset the columns to their default weight
   */
  resetColumns: "Reset columns",
  /**
   * @description A context menu item in data grids to list header options.
   */
  headerOptions: "Header options",
  /**
   * @description Text to refresh the page
   */
  refresh: "Refresh",
  /**
   * @description A context menu item in the Data Grid of a data grid
   */
  addNew: "Add new",
  /**
   * @description A context menu item in the Data Grid of a data grid
   * @example {pattern} PH1
   */
  editS: 'Edit "{PH1}"',
  /**
   * @description Text to delete something
   */
  delete: "Delete",
  /**
   * @description Depth of a node in the datagrid
   * @example {1} PH1
   */
  levelS: "level {PH1}",
  /**
   * @description Text exposed to screen readers on checked items.
   */
  checked: "checked",
  /**
   * @description Accessible text indicating an empty row is created.
   */
  emptyRowCreated: "An empty table row has been created. You may double click or use context menu to edit.",
  /**
   * @description Text for screen reader to announce when focusing on a sortable column in data grid.
   * @example {ascending} PH1
   */
  enterToSort: "Column sort state: {PH1}. Press enter to apply sorting filter",
  /**
   * @description Label for sortable column headers.
   */
  sortableColumn: "Sortable column. Press enter to apply sorting filter"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/components/data_grid/DataGrid.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const elementToLongTextMap = /* @__PURE__ */ new WeakMap();
const nodeToColumnIdMap = /* @__PURE__ */ new WeakMap();
const elementToPreferedWidthMap = /* @__PURE__ */ new WeakMap();
const elementToPositionMap = /* @__PURE__ */ new WeakMap();
const elementToIndexMap = /* @__PURE__ */ new WeakMap();
export class DataGridImpl extends Common.ObjectWrapper.ObjectWrapper {
  element;
  displayName;
  editCallback;
  deleteCallback;
  refreshCallback;
  dataTableHeaders;
  scrollContainerInternal;
  #dataContainer;
  dataTable;
  inline;
  columnsArray;
  columns;
  visibleColumnsArray;
  cellClass;
  #dataTableHead;
  headerRow;
  dataTableColumnGroup;
  dataTableBody;
  topFillerRow;
  bottomFillerRow;
  editing;
  selectedNode;
  expandNodesWhenArrowing;
  indentWidth;
  resizers;
  columnWidthsInitialized;
  cornerWidth;
  resizeMethod;
  headerContextMenuCallback;
  rowContextMenuCallback;
  elementToDataGridNode;
  disclosureColumnId;
  sortColumnCell;
  #rootNode;
  editingNode;
  columnWeightsSetting;
  creationNode;
  currentResizer;
  dataGridWidget;
  constructor(dataGridParameters) {
    super();
    const { displayName, columns: columnsArray, deleteCallback, refreshCallback } = dataGridParameters;
    this.element = document.createElement("div");
    this.element.classList.add("data-grid");
    this.element.tabIndex = 0;
    this.element.addEventListener("keydown", this.keyDown.bind(this), false);
    this.element.addEventListener("contextmenu", this.contextMenu.bind(this), true);
    this.element.addEventListener("focusin", (event) => {
      this.updateGridAccessibleNameOnFocus();
      event.consume(true);
    });
    this.element.addEventListener("focusout", (event) => {
      event.consume(true);
    });
    UI.ARIAUtils.markAsApplication(this.element);
    this.displayName = displayName;
    this.deleteCallback = deleteCallback;
    this.refreshCallback = refreshCallback;
    this.dataTableHeaders = {};
    this.#dataContainer = this.element.createChild("div", "data-container");
    this.dataTable = this.#dataContainer.createChild("table", "data");
    this.scrollContainerInternal = this.#dataContainer;
    this.dataTable.addEventListener("dblclick", this.ondblclick.bind(this), false);
    this.dataTable.addEventListener("mousedown", this.mouseDownInDataTable.bind(this));
    this.dataTable.addEventListener("click", this.clickInDataTable.bind(this), true);
    this.inline = false;
    this.columnsArray = [];
    this.columns = {};
    this.visibleColumnsArray = columnsArray;
    columnsArray.forEach((column) => this.#addColumn(column));
    this.cellClass = null;
    this.dataTableColumnGroup = this.dataTable.createChild("colgroup");
    this.#dataTableHead = this.dataTable.createChild("thead");
    this.headerRow = this.#dataTableHead.createChild("tr");
    this.dataTableBody = this.dataTable.createChild("tbody");
    this.topFillerRow = this.dataTableBody.createChild("tr", "data-grid-filler-row revealed");
    UI.ARIAUtils.setHidden(this.topFillerRow, true);
    this.bottomFillerRow = this.dataTableBody.createChild("tr", "data-grid-filler-row revealed");
    UI.ARIAUtils.setHidden(this.bottomFillerRow, true);
    this.setVerticalPadding(0, 0, true);
    this.refreshHeader();
    this.editing = false;
    this.selectedNode = null;
    this.expandNodesWhenArrowing = true;
    this.setRootNode(new DataGridNode());
    this.setHasSelection(false);
    this.indentWidth = 15;
    this.resizers = [];
    this.columnWidthsInitialized = false;
    this.cornerWidth = CornerWidth;
    this.resizeMethod = "nearest" /* NEAREST */;
    this.headerContextMenuCallback = null;
    this.rowContextMenuCallback = null;
    this.elementToDataGridNode = /* @__PURE__ */ new WeakMap();
  }
  setEditCallback(editCallback, _internalToken) {
    this.editCallback = editCallback;
  }
  firstSelectableNode() {
    let firstSelectableNode = this.#rootNode;
    while (firstSelectableNode && !firstSelectableNode.selectable) {
      firstSelectableNode = firstSelectableNode.traverseNextNode(true) || void 0;
    }
    return firstSelectableNode;
  }
  lastSelectableNode() {
    let lastSelectableNode = this.#rootNode;
    let iterator = this.#rootNode;
    while (iterator) {
      if (iterator.selectable) {
        lastSelectableNode = iterator;
      }
      iterator = iterator.traverseNextNode(true) || void 0;
    }
    return lastSelectableNode;
  }
  setElementContent(element, value) {
    const columnId = this.columnIdFromNode(element);
    if (!columnId) {
      return;
    }
    const column = this.columns[columnId];
    const parentElement = element.parentElement;
    let gridNode;
    if (parentElement) {
      gridNode = this.elementToDataGridNode.get(parentElement);
    }
    if (column.dataType === "Boolean" /* BOOLEAN */) {
      DataGridImpl.setElementBoolean(element, Boolean(value), gridNode);
    } else if (value !== null) {
      DataGridImpl.setElementText(element, value, Boolean(column.longText), gridNode);
    }
  }
  static setElementText(element, newText, longText, gridNode) {
    if (longText && newText.length > 1e3) {
      element.textContent = Platform.StringUtilities.trimEndWithMaxLength(newText, 1e3);
      UI.Tooltip.Tooltip.install(element, newText);
      elementToLongTextMap.set(element, newText);
    } else {
      element.textContent = newText;
      UI.Tooltip.Tooltip.install(element, "");
      elementToLongTextMap.delete(element);
    }
    if (gridNode) {
      DataGridImpl.updateNodeAccessibleText(gridNode);
    }
  }
  static setElementBoolean(element, value, gridNode) {
    element.textContent = value ? "\u2713" : "";
    UI.Tooltip.Tooltip.install(element, "");
    if (gridNode) {
      DataGridImpl.updateNodeAccessibleText(gridNode);
    }
  }
  static updateNodeAccessibleText(gridNode) {
    let accessibleText = "";
    let colElement = gridNode.elementInternal?.children[0] || null;
    if (!colElement) {
      return;
    }
    while (colElement && !colElement.classList.contains("corner")) {
      let columnClass = null;
      for (const cssClass of colElement.classList) {
        if (cssClass.includes("-column")) {
          columnClass = cssClass.substring(0, cssClass.indexOf("-column"));
          break;
        }
      }
      if (columnClass && gridNode.dataGrid) {
        const colName = gridNode.dataGrid.columns[columnClass];
        if (colName) {
          accessibleText += `${colName.title}: ${colElement.textContent}, `;
        }
      }
      colElement = colElement.nextElementSibling;
    }
    if (accessibleText.length > 0) {
      accessibleText = accessibleText.substring(0, accessibleText.length - 2);
    }
    gridNode.nodeAccessibleText = accessibleText;
  }
  setStriped(isStriped) {
    this.element.classList.toggle("striped-data-grid", isStriped);
  }
  setFocusable(focusable) {
    this.element.tabIndex = focusable ? 0 : -1;
    if (focusable === false) {
      UI.ARIAUtils.removeRole(this.element);
    }
  }
  setHasSelection(hasSelected) {
    this.element.classList.toggle("no-selection", !hasSelected);
  }
  announceSelectedGridNode() {
    if (this.element === UI.DOMUtilities.deepActiveElement(this.element.ownerDocument) && this.selectedNode?.existingElement()) {
      let expandText;
      if (this.selectedNode.hasChildren()) {
        expandText = this.selectedNode.expanded ? i18nString(UIStrings.expanded) : i18nString(UIStrings.collapsed);
      }
      const accessibleText = expandText ? `${this.selectedNode.nodeAccessibleText}, ${expandText}` : this.selectedNode.nodeAccessibleText;
      UI.ARIAUtils.LiveAnnouncer.alert(accessibleText);
    }
  }
  getNumberOfRows() {
    return this.#rootNode ? this.enumerateChildren(this.#rootNode, [], 1).length : 0;
  }
  updateGridAccessibleNameOnFocus() {
    let accessibleText;
    if (this.selectedNode?.existingElement()) {
      let expandText = "";
      if (this.selectedNode.hasChildren()) {
        expandText = this.selectedNode.expanded ? i18nString(UIStrings.expanded) : i18nString(UIStrings.collapsed);
      }
      const rowHeader = i18nString(UIStrings.sRowS, { PH1: this.displayName, PH2: expandText });
      accessibleText = `${rowHeader} ${this.selectedNode.nodeAccessibleText}`;
    } else {
      if (!this.#rootNode) {
        return;
      }
      const numberOfRows = this.getNumberOfRows();
      const items = i18nString(UIStrings.rowsS, { PH1: numberOfRows });
      accessibleText = i18nString(UIStrings.sSUseTheUpAndDownArrowKeysTo, { PH1: this.displayName, PH2: items });
    }
    UI.ARIAUtils.LiveAnnouncer.alert(accessibleText);
  }
  #addColumn(column, position) {
    column.defaultWeight = column.weight;
    const columnId = column.id;
    if (columnId in this.columns) {
      this.#removeColumn(columnId);
    }
    if (position === void 0) {
      position = this.columnsArray.length;
    }
    this.columnsArray.splice(position, 0, column);
    this.columns[columnId] = column;
    if (column.disclosure) {
      this.disclosureColumnId = columnId;
    }
    const cell = document.createElement("th");
    cell.setAttribute(
      "jslog",
      `${VisualLogging.tableHeader().track({ click: column.sortable, resize: true }).context(Platform.StringUtilities.toKebabCase(columnId))}`
    );
    cell.className = columnId + "-column";
    cell.setAttribute("tabindex", "0");
    cell.setAttribute("role", "columnheader");
    nodeToColumnIdMap.set(cell, columnId);
    this.dataTableHeaders[columnId] = cell;
    const div = document.createElement("div");
    if (column.titleDOMFragment) {
      div.appendChild(column.titleDOMFragment);
    } else {
      div.textContent = column.title || null;
    }
    cell.appendChild(div);
    if (column.sort) {
      cell.classList.add(column.sort);
      this.sortColumnCell = cell;
    }
    if (column.sortable) {
      cell.addEventListener("click", this.clickInHeaderCell.bind(this), false);
      cell.addEventListener("keydown", this.keydownHeaderCell.bind(this), false);
      cell.classList.add("sortable");
      const icon = document.createElement("span");
      icon.className = "sort-order-icon";
      cell.createChild("div", "sort-order-icon-container").appendChild(icon);
      if (column.title) {
        const columnLabel = `${column.title} - ${i18nString(UIStrings.sortableColumn)}`;
        UI.ARIAUtils.setLabel(cell, columnLabel);
      }
    }
  }
  addColumn(column, position) {
    this.#addColumn(column, position);
  }
  #removeColumn(columnId) {
    const column = this.columns[columnId];
    if (!column) {
      return;
    }
    delete this.columns[columnId];
    const index = this.columnsArray.findIndex((columnConfig) => columnConfig.id === columnId);
    this.columnsArray.splice(index, 1);
    const cell = this.dataTableHeaders[columnId];
    if (cell.parentElement) {
      cell.parentElement.removeChild(cell);
    }
    delete this.dataTableHeaders[columnId];
  }
  removeColumn(columnId) {
    this.#removeColumn(columnId);
  }
  setCellClass(cellClass) {
    this.cellClass = cellClass;
  }
  refreshHeader() {
    this.dataTableColumnGroup.removeChildren();
    this.headerRow.removeChildren();
    this.topFillerRow.removeChildren();
    this.bottomFillerRow.removeChildren();
    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      const columnId = column.id;
      const dataColumn = this.dataTableColumnGroup.createChild("col");
      if (column.width) {
        dataColumn.style.width = column.width;
      }
      this.headerRow.appendChild(this.dataTableHeaders[columnId]);
      const topFillerRowCell = this.topFillerRow.createChild("th", "top-filler-td");
      topFillerRowCell.textContent = column.title || null;
      topFillerRowCell.scope = "col";
      const bottomFillerRowChild = this.bottomFillerRow.createChild("td", "bottom-filler-td");
      nodeToColumnIdMap.set(bottomFillerRowChild, columnId);
    }
    const headerCorner = this.headerRow.createChild("th", "corner");
    UI.ARIAUtils.setHidden(headerCorner, true);
    const topFillerRowCornerCell = this.topFillerRow.createChild("th", "corner");
    topFillerRowCornerCell.classList.add("top-filler-td");
    topFillerRowCornerCell.scope = "col";
    this.bottomFillerRow.createChild("td", "corner").classList.add("bottom-filler-td");
    this.dataTableColumnGroup.createChild("col", "corner");
  }
  setVerticalPadding(top, bottom, isConstructorTime = false) {
    const topPx = top + "px";
    const bottomPx = top || bottom ? bottom + "px" : "auto";
    if (this.topFillerRow.style.height === topPx && this.bottomFillerRow.style.height === bottomPx) {
      return;
    }
    this.topFillerRow.style.height = topPx;
    this.bottomFillerRow.style.height = bottomPx;
    if (!isConstructorTime) {
      this.dispatchEventToListeners("PaddingChanged" /* PADDING_CHANGED */);
    }
  }
  setRootNode(rootNode) {
    if (this.#rootNode) {
      this.#rootNode.removeChildren();
      this.#rootNode.dataGrid = null;
      this.#rootNode.isRoot = false;
    }
    this.#rootNode = rootNode;
    rootNode.isRoot = true;
    rootNode.setHasChildren(false);
    rootNode.expandedInternal = true;
    rootNode.revealedInternal = true;
    rootNode.selectable = false;
    rootNode.dataGrid = this;
  }
  rootNode() {
    let rootNode = this.#rootNode;
    if (!rootNode) {
      rootNode = new DataGridNode();
      this.setRootNode(rootNode);
    }
    return rootNode;
  }
  isColumnEditable(columnId) {
    const column = this.columns[columnId];
    return Boolean(column && column.editable && this.editCallback);
  }
  ondblclick(event) {
    if (!this.editCallback || this.editing || this.editingNode) {
      return;
    }
    const columnId = this.columnIdFromNode(event.target);
    if (!columnId || !this.isColumnEditable(columnId)) {
      return;
    }
    this.startEditing(event.target);
  }
  startEditingColumnOfDataGridNode(node, cellIndex) {
    this.editing = true;
    this.editingNode = node;
    this.editingNode.select();
    const editingNodeElement = this.editingNode.element();
    if (!editingNodeElement) {
      return;
    }
    const element = editingNodeElement.children[cellIndex];
    const elementLongText = elementToLongTextMap.get(element);
    if (elementLongText) {
      element.textContent = elementLongText;
    }
    const column = this.visibleColumnsArray[cellIndex];
    if (column.dataType === "Boolean" /* BOOLEAN */) {
      const checkboxElement = UI.UIUtils.CheckboxLabel.create(void 0, node.data[column.id]);
      UI.ARIAUtils.setLabel(checkboxElement, column.title || "");
      let hasChanged = false;
      checkboxElement.style.height = "100%";
      checkboxElement.classList.add("inside-datagrid");
      const initialValue = checkboxElement.checked;
      checkboxElement.addEventListener("change", () => {
        hasChanged = true;
        this.editingCommitted(element, checkboxElement.checked, initialValue, void 0, "forward");
      }, false);
      checkboxElement.addEventListener("keydown", (event) => {
        if (event.key === "Tab") {
          event.consume(true);
          hasChanged = true;
          return this.editingCommitted(
            element,
            checkboxElement.checked,
            initialValue,
            void 0,
            event.shiftKey ? "backward" : "forward"
          );
        }
        if (event.key === " ") {
          event.consume(true);
          checkboxElement.checked = !checkboxElement.checked;
        } else if (event.key === "Enter") {
          event.consume(true);
          hasChanged = true;
          this.editingCommitted(element, checkboxElement.checked, initialValue, void 0, "forward");
        }
      }, false);
      checkboxElement.addEventListener("blur", () => {
        if (hasChanged) {
          return;
        }
        this.editingCommitted(element, checkboxElement.checked, checkboxElement.checked, void 0, "next");
      }, false);
      element.innerHTML = "";
      element.appendChild(checkboxElement);
      checkboxElement.focus();
    } else {
      UI.InplaceEditor.InplaceEditor.startEditing(element, this.startEditingConfig(element));
      const componentSelection = element.getComponentSelection();
      if (componentSelection) {
        componentSelection.selectAllChildren(element);
      }
    }
  }
  startEditingNextEditableColumnOfDataGridNode(node, columnIdentifier, inclusive) {
    const column = this.columns[columnIdentifier];
    const cellIndex = this.visibleColumnsArray.indexOf(column);
    const nextEditableColumn = this.nextEditableColumn(cellIndex, false, inclusive);
    if (nextEditableColumn !== -1) {
      this.startEditingColumnOfDataGridNode(node, nextEditableColumn);
    }
  }
  startEditing(target) {
    const element = UI.UIUtils.enclosingNodeOrSelfWithNodeName(target, "td");
    if (!element) {
      return;
    }
    this.editingNode = this.dataGridNodeFromNode(target);
    if (!this.editingNode) {
      if (!this.creationNode) {
        return;
      }
      this.editingNode = this.creationNode;
    }
    if (this.editingNode instanceof CreationDataGridNode && this.editingNode.isCreationNode) {
      this.startEditingColumnOfDataGridNode(this.editingNode, this.nextEditableColumn(-1));
      return;
    }
    const columnId = this.columnIdFromNode(target);
    if (!columnId) {
      return;
    }
    const column = this.columns[columnId];
    const cellIndex = this.visibleColumnsArray.indexOf(column);
    if (this.editingNode) {
      this.startEditingColumnOfDataGridNode(this.editingNode, cellIndex);
    }
  }
  renderInline() {
    this.element.classList.add("inline");
    this.cornerWidth = 0;
    this.inline = true;
    this.updateWidths();
  }
  startEditingConfig(_element) {
    return new UI.InplaceEditor.Config(this.editingCommitted.bind(this), this.editingCancelled.bind(this), void 0);
  }
  editingCommitted(element, newText, _oldText, _context, moveDirection) {
    const columnId = this.columnIdFromNode(element);
    if (!columnId) {
      this.editingCancelled(element);
      return;
    }
    const column = this.columns[columnId];
    const cellIndex = this.visibleColumnsArray.indexOf(column);
    if (!this.editingNode) {
      return;
    }
    const valueBeforeEditing = this.editingNode.data[columnId];
    const currentEditingNode = this.editingNode;
    function moveToNextIfNeeded(wasChange) {
      if (!moveDirection) {
        return;
      }
      if (moveDirection === "forward") {
        const firstEditableColumn = this.nextEditableColumn(-1);
        const isCreationNode = currentEditingNode instanceof CreationDataGridNode && currentEditingNode.isCreationNode;
        if (isCreationNode && cellIndex === firstEditableColumn && !wasChange) {
          return;
        }
        const nextEditableColumn = this.nextEditableColumn(cellIndex);
        if (nextEditableColumn !== -1) {
          this.startEditingColumnOfDataGridNode(currentEditingNode, nextEditableColumn);
          return;
        }
        const nextDataGridNode = currentEditingNode.traverseNextNode(true, null, true);
        if (nextDataGridNode) {
          this.startEditingColumnOfDataGridNode(nextDataGridNode, firstEditableColumn);
          return;
        }
        if (isCreationNode && wasChange && this.creationNode) {
          this.addCreationNode(false);
          this.startEditingColumnOfDataGridNode(this.creationNode, firstEditableColumn);
          return;
        }
        return;
      }
      if (moveDirection === "backward") {
        const prevEditableColumn = this.nextEditableColumn(cellIndex, true);
        if (prevEditableColumn !== -1) {
          this.startEditingColumnOfDataGridNode(currentEditingNode, prevEditableColumn);
          return;
        }
        const lastEditableColumn = this.nextEditableColumn(this.visibleColumnsArray.length, true);
        const nextDataGridNode = currentEditingNode.traversePreviousNode(true, true);
        if (nextDataGridNode) {
          this.startEditingColumnOfDataGridNode(nextDataGridNode, lastEditableColumn);
        }
        return;
      }
    }
    this.setElementContent(element, newText);
    if (valueBeforeEditing === newText) {
      this.editingCancelled(element);
      moveToNextIfNeeded.call(this, false);
      return;
    }
    this.editingNode.data[columnId] = newText;
    if (!this.editCallback) {
      return;
    }
    this.editCallback(this.editingNode, columnId, valueBeforeEditing, newText, moveDirection);
    if (this.editingNode instanceof CreationDataGridNode && this.editingNode.isCreationNode) {
      this.addCreationNode(false);
    }
    this.editingCancelled(element);
    moveToNextIfNeeded.call(this, true);
  }
  editingCancelled(_element) {
    this.editing = false;
    this.editingNode = null;
  }
  nextEditableColumn(cellIndex, moveBackward, inclusive) {
    const increment = moveBackward ? -1 : 1;
    const start = inclusive ? cellIndex : cellIndex + increment;
    const columns = this.visibleColumnsArray;
    for (let i = start; i >= 0 && i < columns.length; i += increment) {
      if (this.isColumnEditable(columns[i].id)) {
        return i;
      }
    }
    return -1;
  }
  sortColumnId() {
    if (!this.sortColumnCell) {
      return null;
    }
    return nodeToColumnIdMap.get(this.sortColumnCell) || null;
  }
  sortOrder() {
    if (!this.sortColumnCell || this.sortColumnCell.classList.contains("sort-ascending" /* Ascending */)) {
      return "sort-ascending" /* Ascending */;
    }
    if (this.sortColumnCell.classList.contains("sort-descending" /* Descending */)) {
      return "sort-descending" /* Descending */;
    }
    return null;
  }
  isSortOrderAscending() {
    return !this.sortColumnCell || this.sortColumnCell.classList.contains("sort-ascending" /* Ascending */);
  }
  autoSizeWidths(widths, minPercent, maxPercent) {
    if (minPercent) {
      minPercent = Math.min(minPercent, Math.floor(100 / widths.length));
    }
    let totalWidth = 0;
    for (let i = 0; i < widths.length; ++i) {
      totalWidth += widths[i];
    }
    let totalPercentWidth = 0;
    for (let i = 0; i < widths.length; ++i) {
      let width = Math.round(100 * widths[i] / totalWidth);
      if (minPercent && width < minPercent) {
        width = minPercent;
      } else if (maxPercent && width > maxPercent) {
        width = maxPercent;
      }
      totalPercentWidth += width;
      widths[i] = width;
    }
    let recoupPercent = totalPercentWidth - 100;
    while (minPercent && recoupPercent > 0) {
      for (let i = 0; i < widths.length; ++i) {
        if (widths[i] > minPercent) {
          --widths[i];
          --recoupPercent;
          if (!recoupPercent) {
            break;
          }
        }
      }
    }
    while (maxPercent && recoupPercent < 0) {
      for (let i = 0; i < widths.length; ++i) {
        if (widths[i] < maxPercent) {
          ++widths[i];
          ++recoupPercent;
          if (!recoupPercent) {
            break;
          }
        }
      }
    }
    return widths;
  }
  /**
   * The range of |minPercent| and |maxPercent| is [0, 100].
   *
   * FYI: Only used in test: chromium/src/third_party/blink/web_tests/http/tests/devtools/components/datagrid.js
   */
  autoSizeColumns(minPercent, maxPercent, maxDescentLevel) {
    let widths = [];
    for (let i = 0; i < this.columnsArray.length; ++i) {
      widths.push((this.columnsArray[i].title || "").length);
    }
    maxDescentLevel = maxDescentLevel || 0;
    if (!this.#rootNode) {
      return;
    }
    const children = this.enumerateChildren(this.#rootNode, [], maxDescentLevel + 1);
    for (let i = 0; i < children.length; ++i) {
      const node = children[i];
      for (let j = 0; j < this.columnsArray.length; ++j) {
        const text = String(node.data[this.columnsArray[j].id]);
        if (text.length > widths[j]) {
          widths[j] = text.length;
        }
      }
    }
    widths = this.autoSizeWidths(widths, minPercent, maxPercent);
    for (let i = 0; i < this.columnsArray.length; ++i) {
      this.columnsArray[i].weight = widths[i];
    }
    this.columnWidthsInitialized = false;
    this.updateWidths();
  }
  enumerateChildren(rootNode, result, maxLevel) {
    if (!rootNode.isRoot) {
      result.push(rootNode);
    }
    if (!maxLevel) {
      return [];
    }
    for (let i = 0; i < rootNode.children.length; ++i) {
      this.enumerateChildren(rootNode.children[i], result, maxLevel - 1);
    }
    return result;
  }
  onResize() {
    this.updateWidths();
  }
  // Updates the widths of the table, including the positions of the column
  // resizers.
  //
  // IMPORTANT: This function MUST be called once after the element of the
  // DataGrid is attached to its parent element and every subsequent time the
  // width of the parent element is changed in order to make it possible to
  // resize the columns.
  //
  // If this function is not called after the DataGrid is attached to its
  // parent element, then the DataGrid's columns will not be resizable.
  updateWidths() {
    if (!this.columnWidthsInitialized && this.element.offsetWidth) {
      const tableWidth = this.element.offsetWidth - this.cornerWidth;
      const cells = this.#dataTableHead.rows[0].cells;
      const numColumns = cells.length - 1;
      for (let i = 0; i < numColumns; i++) {
        const column = this.visibleColumnsArray[i];
        if (!column.weight) {
          column.weight = 100 * this.getPreferredWidth(i) / tableWidth || 10;
        }
      }
      this.columnWidthsInitialized = true;
    }
    this.applyColumnWeights();
  }
  indexOfVisibleColumn(columnId) {
    return this.visibleColumnsArray.findIndex((column) => column.id === columnId);
  }
  setName(name) {
    this.columnWeightsSetting = Common.Settings.Settings.instance().createSetting("data-grid-" + name + "-column-weights", {});
    this.loadColumnWeights();
  }
  resetColumnWeights() {
    for (const column of this.columnsArray) {
      if (!column.defaultWeight) {
        continue;
      }
      column.weight = column.defaultWeight;
    }
    this.applyColumnWeights();
    this.saveColumnWeights();
  }
  loadColumnWeights() {
    if (!this.columnWeightsSetting) {
      return;
    }
    const weights = this.columnWeightsSetting.get();
    for (let i = 0; i < this.columnsArray.length; ++i) {
      const column = this.columnsArray[i];
      const weight = weights[column.id];
      if (weight) {
        column.weight = weight;
      }
    }
    this.applyColumnWeights();
  }
  saveColumnWeights() {
    if (!this.columnWeightsSetting) {
      return;
    }
    const weights = {};
    for (let i = 0; i < this.columnsArray.length; ++i) {
      const column = this.columnsArray[i];
      weights[column.id] = column.weight;
    }
    this.columnWeightsSetting.set(weights);
  }
  wasShown() {
    this.loadColumnWeights();
  }
  willHide() {
  }
  getPreferredWidth(columnIndex) {
    return elementToPreferedWidthMap.get(this.dataTableColumnGroup.children[columnIndex]) || this.#dataTableHead.rows[0].cells[columnIndex].offsetWidth;
  }
  applyColumnWeights() {
    let tableWidth = this.element.offsetWidth - this.cornerWidth - 1;
    if (tableWidth <= 0) {
      return;
    }
    let sumOfWeights = 0;
    const fixedColumnWidths = [];
    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      if (column.fixedWidth) {
        const width = this.getPreferredWidth(i);
        fixedColumnWidths[i] = width;
        tableWidth -= width;
      } else {
        sumOfWeights += this.visibleColumnsArray[i].weight || 0;
      }
    }
    let sum = 0;
    let lastOffset = 0;
    const minColumnWidth = ColumnResizePadding;
    for (let i = 0; i < this.visibleColumnsArray.length; ++i) {
      const column = this.visibleColumnsArray[i];
      let width;
      if (column.fixedWidth) {
        width = fixedColumnWidths[i];
      } else {
        sum += column.weight || 0;
        const offset = sum * tableWidth / sumOfWeights | 0;
        width = Math.max(offset - lastOffset, minColumnWidth);
        lastOffset = offset;
      }
      this.setPreferredWidth(i, width);
    }
    this.positionResizers();
  }
  setColumnsVisibility(columnsVisibility) {
    this.visibleColumnsArray = [];
    for (const column of this.columnsArray) {
      if (columnsVisibility.has(column.id)) {
        this.visibleColumnsArray.push(column);
      }
    }
    this.refreshHeader();
    this.applyColumnWeights();
    const nodes = this.enumerateChildren(this.rootNode(), [], -1);
    for (const node of nodes) {
      node.refresh();
    }
  }
  get scrollContainer() {
    return this.scrollContainerInternal;
  }
  positionResizers() {
    const headerTableColumns = this.dataTableColumnGroup.children;
    const numColumns = headerTableColumns.length - 1;
    const left = [];
    const resizers = this.resizers;
    while (resizers.length > numColumns - 1) {
      const resizer = resizers.pop();
      if (resizer) {
        resizer.remove();
      }
    }
    for (let i = 0; i < numColumns - 1; i++) {
      left[i] = (left[i - 1] || 0) + this.#dataTableHead.rows[0].cells[i].offsetWidth;
    }
    for (let i = 0; i < numColumns - 1; i++) {
      let resizer = resizers[i];
      if (!resizer) {
        resizer = document.createElement("div");
        elementToIndexMap.set(resizer, i);
        resizer.classList.add("data-grid-resizer");
        UI.UIUtils.installDragHandle(
          resizer,
          this.startResizerDragging.bind(this),
          this.resizerDragging.bind(this),
          this.endResizerDragging.bind(this),
          "col-resize"
        );
        this.element.appendChild(resizer);
        resizers.push(resizer);
      }
      if (elementToPositionMap.get(resizer) !== left[i]) {
        elementToPositionMap.set(resizer, left[i]);
        resizer.style.left = left[i] + "px";
      }
    }
  }
  addCreationNode(hasChildren) {
    if (this.creationNode) {
      this.creationNode.isCreationNode = false;
    }
    const emptyData = {};
    for (const column in this.columns) {
      emptyData[column] = null;
    }
    this.creationNode = new CreationDataGridNode(emptyData, hasChildren);
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.emptyRowCreated));
    this.rootNode().appendChild(this.creationNode);
  }
  keyDown(event) {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }
    if (this.selectedNode) {
      if (this.selectedNode.element().tabIndex < 0) {
        void VisualLogging.logKeyDown(this.selectedNode.element(), event);
      }
    }
    if (event.shiftKey || event.metaKey || event.ctrlKey || this.editing || UI.UIUtils.isEditing()) {
      return;
    }
    let handled = false;
    let nextSelectedNode;
    if (!this.selectedNode) {
      if (event.key === "ArrowUp" && !event.altKey) {
        nextSelectedNode = this.lastSelectableNode();
      } else if (event.key === "ArrowDown" && !event.altKey) {
        nextSelectedNode = this.firstSelectableNode();
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === "ArrowUp" && !event.altKey) {
      nextSelectedNode = this.selectedNode.traversePreviousNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traversePreviousNode(true);
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === "ArrowDown" && !event.altKey) {
      nextSelectedNode = this.selectedNode.traverseNextNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traverseNextNode(true);
      }
      handled = nextSelectedNode ? true : false;
    } else if (event.key === "ArrowLeft") {
      if (this.selectedNode.expanded) {
        if (event.altKey) {
          this.selectedNode.collapseRecursively();
        } else {
          this.selectedNode.collapse();
        }
        handled = true;
      } else if (this.selectedNode.parent && !this.selectedNode.parent.isRoot) {
        handled = true;
        if (this.selectedNode.parent.selectable) {
          nextSelectedNode = this.selectedNode.parent;
          handled = nextSelectedNode ? true : false;
        } else if (this.selectedNode.parent) {
          this.selectedNode.parent.collapse();
        }
      }
    } else if (event.key === "ArrowRight") {
      if (!this.expandNodesWhenArrowing) {
        return;
      }
      if (!this.selectedNode.revealed) {
        this.selectedNode.reveal();
        handled = true;
      } else if (this.selectedNode.hasChildren()) {
        handled = true;
        if (this.selectedNode.expanded) {
          nextSelectedNode = this.selectedNode.children[0];
          handled = nextSelectedNode ? true : false;
        } else if (event.altKey) {
          this.selectedNode.expandRecursively();
        } else {
          this.selectedNode.expand();
        }
      }
    } else if (event.keyCode === 8 || event.keyCode === 46) {
      if (this.deleteCallback) {
        handled = true;
        this.deleteCallback(this.selectedNode);
      }
    } else if (event.key === "Enter") {
      if (this.editCallback) {
        handled = true;
        const selectedNodeElement = this.selectedNode.element();
        if (!selectedNodeElement) {
          return;
        }
        this.startEditing(selectedNodeElement.children[this.nextEditableColumn(-1)]);
      } else {
        this.dispatchEventToListeners("OpenedNode" /* OPENED_NODE */, this.selectedNode);
      }
    }
    if (nextSelectedNode) {
      nextSelectedNode.reveal();
      nextSelectedNode.select();
    }
    const activeElement = UI.DOMUtilities.deepActiveElement(this.element.ownerDocument);
    if (handled && this.element !== activeElement && !this.element.contains(activeElement)) {
      this.element.focus();
    }
    if (handled) {
      event.consume(true);
    }
  }
  updateSelectionBeforeRemoval(root, _onlyAffectsSubtree) {
    let ancestor = this.selectedNode;
    while (ancestor && ancestor !== root) {
      ancestor = ancestor.parent;
    }
    if (!ancestor) {
      return;
    }
    let nextSelectedNode;
    ancestor = root;
    while (ancestor && !ancestor.nextSibling) {
      ancestor = ancestor.parent;
    }
    if (ancestor) {
      nextSelectedNode = ancestor.nextSibling;
    }
    while (nextSelectedNode && !nextSelectedNode.selectable) {
      nextSelectedNode = nextSelectedNode.traverseNextNode(true);
    }
    if (!nextSelectedNode || nextSelectedNode.isCreationNode) {
      if (!root) {
        return;
      }
      nextSelectedNode = root.traversePreviousNode(true);
      while (nextSelectedNode && !nextSelectedNode.selectable) {
        nextSelectedNode = nextSelectedNode.traversePreviousNode(true);
      }
    }
    if (nextSelectedNode) {
      nextSelectedNode.reveal();
      nextSelectedNode.select();
    } else if (this.selectedNode) {
      this.selectedNode.deselect();
    }
  }
  dataGridNodeFromNode(target) {
    const rowElement = UI.UIUtils.enclosingNodeOrSelfWithNodeName(target, "tr");
    return rowElement && this.elementToDataGridNode.get(rowElement) || null;
  }
  columnIdFromNode(target) {
    const cellElement = UI.UIUtils.enclosingNodeOrSelfWithNodeName(target, "td");
    return cellElement && nodeToColumnIdMap.get(cellElement) || null;
  }
  /**
   * Mark the data-grid as inert, meaning that it will not capture any user interactions.
   * Useful in some panels where the empty state is actually an absolutely
   * positioned div put over the panel, and in that case we need to ensure the
   * hidden, empty data grid, does not capture any user interaction - in particular if they tab through the UI.
   */
  setInert(isInert) {
    if (isInert) {
      this.element.setAttribute("inert", "inert");
    } else {
      this.element.removeAttribute("inert");
    }
  }
  clickInHeaderCell(event) {
    const cell = UI.UIUtils.enclosingNodeOrSelfWithNodeName(event.target, "th");
    if (!cell) {
      return;
    }
    this.sortByColumnHeaderCell(cell);
  }
  keydownHeaderCell(event) {
    if (event.key === "Enter" || event.key === " ") {
      this.clickInHeaderCell(event);
    }
  }
  /**
   * Sorts by column header cell.
   * Additionally applies the aria-sort label to a column's th.
   * Guidance on values of attribute taken from
   * https://www.w3.org/TR/wai-aria-practices/examples/grid/dataGrids.html.
   */
  sortByColumnHeaderCell(cell) {
    if (!nodeToColumnIdMap.has(cell) || !cell.classList.contains("sortable")) {
      return;
    }
    let sortOrder = "sort-ascending" /* Ascending */;
    if (cell === this.sortColumnCell && this.isSortOrderAscending()) {
      sortOrder = "sort-descending" /* Descending */;
    }
    if (this.sortColumnCell) {
      this.sortColumnCell.classList.remove("sort-ascending" /* Ascending */, "sort-descending" /* Descending */);
      this.sortColumnCell.removeAttribute("aria-sort");
    }
    this.sortColumnCell = cell;
    cell.classList.add(sortOrder);
    const ariaLabel = this.isSortOrderAscending() ? "ascending" : "descending";
    cell.setAttribute("aria-sort", ariaLabel);
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.enterToSort, { PH1: ariaLabel || "" }));
    this.dispatchEventToListeners("SortingChanged" /* SORTING_CHANGED */);
  }
  markColumnAsSortedBy(columnId, sortOrder) {
    if (this.sortColumnCell) {
      this.sortColumnCell.classList.remove("sort-ascending" /* Ascending */, "sort-descending" /* Descending */);
    }
    this.sortColumnCell = this.dataTableHeaders[columnId];
    this.sortColumnCell.classList.add(sortOrder);
  }
  headerTableHeader(columnId) {
    return this.dataTableHeaders[columnId];
  }
  mouseDownInDataTable(event) {
    const target = event.target;
    const gridNode = this.dataGridNodeFromNode(target);
    if (!gridNode || !gridNode.selectable || gridNode.isEventWithinDisclosureTriangle(event)) {
      return;
    }
    const columnId = this.columnIdFromNode(target);
    if (columnId && this.columns[columnId].nonSelectable) {
      return;
    }
    const mouseEvent = event;
    const modifier = Host.Platform.platform() === "mac" ? mouseEvent.metaKey : mouseEvent.ctrlKey;
    if (modifier) {
      if (gridNode.selected) {
        gridNode.deselect();
      } else {
        gridNode.select();
      }
    } else {
      gridNode.select();
      this.dispatchEventToListeners("OpenedNode" /* OPENED_NODE */, gridNode);
    }
  }
  setHeaderContextMenuCallback(callback) {
    this.headerContextMenuCallback = callback;
  }
  setRowContextMenuCallback(callback) {
    this.rowContextMenuCallback = callback;
  }
  contextMenu(event) {
    if (!(event instanceof MouseEvent)) {
      return;
    }
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    const target = event.target;
    const sortableVisibleColumns = this.visibleColumnsArray.filter((column) => {
      return column.sortable && column.title;
    });
    const sortableHiddenColumns = this.columnsArray.filter(
      (column) => sortableVisibleColumns.indexOf(column) === -1 && column.allowInSortByEvenWhenHidden
    );
    const sortableColumns = [...sortableVisibleColumns, ...sortableHiddenColumns];
    if (sortableColumns.length > 0) {
      const sortMenu = contextMenu.defaultSection().appendSubMenuItem(i18nString(UIStrings.sortByString), false, "sort-by");
      for (const column of sortableColumns) {
        const headerCell = this.dataTableHeaders[column.id];
        sortMenu.defaultSection().appendItem(
          column.title,
          this.sortByColumnHeaderCell.bind(this, headerCell),
          {
            jslogContext: Platform.StringUtilities.toKebabCase(column.id)
          }
        );
      }
    }
    if (target.isSelfOrDescendant(this.#dataTableHead)) {
      if (this.headerContextMenuCallback) {
        this.headerContextMenuCallback(contextMenu);
      }
      contextMenu.defaultSection().appendItem(
        i18nString(UIStrings.resetColumns),
        this.resetColumnWeights.bind(this),
        { jslogContext: "reset-columns" }
      );
      void contextMenu.show();
      return;
    }
    const headerSubMenu = contextMenu.defaultSection().appendSubMenuItem(i18nString(UIStrings.headerOptions), false, "header-options");
    if (this.headerContextMenuCallback) {
      this.headerContextMenuCallback(headerSubMenu);
    }
    headerSubMenu.defaultSection().appendItem(
      i18nString(UIStrings.resetColumns),
      this.resetColumnWeights.bind(this),
      { jslogContext: "reset-columns" }
    );
    const isContextMenuKey = event.button === 0;
    const gridNode = isContextMenuKey ? this.selectedNode : this.dataGridNodeFromNode(target);
    const selectedNodeElement = this.selectedNode?.existingElement();
    if (isContextMenuKey && selectedNodeElement) {
      const boundingRowRect = selectedNodeElement.getBoundingClientRect();
      if (boundingRowRect) {
        const x = (boundingRowRect.right + boundingRowRect.left) / 2;
        const y = (boundingRowRect.bottom + boundingRowRect.top) / 2;
        contextMenu.setX(x);
        contextMenu.setY(y);
      }
    }
    if (this.refreshCallback && (!gridNode || gridNode !== this.creationNode)) {
      contextMenu.defaultSection().appendItem(
        i18nString(UIStrings.refresh),
        this.refreshCallback.bind(this),
        { jslogContext: "refresh" }
      );
    }
    if (gridNode && gridNode.selectable && !gridNode.isEventWithinDisclosureTriangle(event)) {
      if (this.editCallback) {
        if (gridNode === this.creationNode) {
          const firstEditColumnIndex = this.nextEditableColumn(-1);
          const tableCellElement = gridNode.element().children[firstEditColumnIndex];
          contextMenu.defaultSection().appendItem(
            i18nString(UIStrings.addNew),
            this.startEditing.bind(this, tableCellElement),
            { jslogContext: "add-new" }
          );
        } else if (isContextMenuKey) {
          const firstEditColumnIndex = this.nextEditableColumn(-1);
          if (firstEditColumnIndex > -1) {
            const firstColumn = this.visibleColumnsArray[firstEditColumnIndex];
            if (firstColumn && this.isColumnEditable(firstColumn.id)) {
              contextMenu.defaultSection().appendItem(
                i18nString(UIStrings.editS, { PH1: String(firstColumn.title) }),
                this.startEditingColumnOfDataGridNode.bind(this, gridNode, firstEditColumnIndex),
                { jslogContext: "edit" }
              );
            }
          }
        } else {
          const columnId = this.columnIdFromNode(target);
          if (columnId && this.isColumnEditable(columnId)) {
            contextMenu.defaultSection().appendItem(
              i18nString(UIStrings.editS, { PH1: String(this.columns[columnId].title) }),
              this.startEditing.bind(this, target),
              { jslogContext: "edit" }
            );
          }
        }
      }
      if (this.deleteCallback && gridNode !== this.creationNode) {
        contextMenu.defaultSection().appendItem(
          i18nString(UIStrings.delete),
          this.deleteCallback.bind(this, gridNode),
          { jslogContext: "delete" }
        );
      }
      if (this.rowContextMenuCallback) {
        this.rowContextMenuCallback(contextMenu, gridNode);
      }
    }
    void contextMenu.show();
  }
  clickInDataTable(event) {
    const gridNode = this.dataGridNodeFromNode(event.target);
    if (!gridNode || !gridNode.hasChildren() || !gridNode.isEventWithinDisclosureTriangle(event)) {
      return;
    }
    if (gridNode.expanded) {
      if (event.altKey) {
        gridNode.collapseRecursively();
      } else {
        gridNode.collapse();
      }
    } else if (event.altKey) {
      gridNode.expandRecursively();
    } else {
      gridNode.expand();
    }
  }
  setResizeMethod(method) {
    this.resizeMethod = method;
  }
  startResizerDragging(event) {
    this.currentResizer = event.target;
    return true;
  }
  endResizerDragging() {
    this.currentResizer = null;
    this.saveColumnWeights();
  }
  resizerDragging(event) {
    const resizer = this.currentResizer;
    if (!resizer) {
      return;
    }
    let dragPoint = event.clientX - this.element.getBoundingClientRect().left;
    let leftEdgeOfPreviousColumn = 0;
    let leftCellIndex = elementToIndexMap.get(resizer);
    if (leftCellIndex === void 0) {
      return;
    }
    let rightCellIndex = leftCellIndex + 1;
    for (let i = 0; i < leftCellIndex; i++) {
      leftEdgeOfPreviousColumn += this.getPreferredWidth(i);
    }
    if (this.resizeMethod === "last" /* LAST */) {
      rightCellIndex = this.resizers.length;
    } else if (this.resizeMethod === "first" /* FIRST */) {
      leftEdgeOfPreviousColumn += this.getPreferredWidth(leftCellIndex) - this.getPreferredWidth(0);
      leftCellIndex = 0;
    }
    const rightEdgeOfNextColumn = leftEdgeOfPreviousColumn + this.getPreferredWidth(leftCellIndex) + this.getPreferredWidth(rightCellIndex);
    const leftMinimum = leftEdgeOfPreviousColumn + ColumnResizePadding;
    const rightMaximum = rightEdgeOfNextColumn - ColumnResizePadding;
    if (leftMinimum > rightMaximum) {
      return;
    }
    dragPoint = Platform.NumberUtilities.clamp(dragPoint, leftMinimum, rightMaximum);
    const position = dragPoint - CenterResizerOverBorderAdjustment;
    elementToPositionMap.set(resizer, position);
    resizer.style.left = position + "px";
    this.setPreferredWidth(leftCellIndex, dragPoint - leftEdgeOfPreviousColumn);
    this.setPreferredWidth(rightCellIndex, rightEdgeOfNextColumn - dragPoint);
    const leftColumn = this.visibleColumnsArray[leftCellIndex];
    const rightColumn = this.visibleColumnsArray[rightCellIndex];
    if (leftColumn.weight && rightColumn.weight) {
      const sumOfWeights = leftColumn.weight + rightColumn.weight;
      const delta = rightEdgeOfNextColumn - leftEdgeOfPreviousColumn;
      leftColumn.weight = (dragPoint - leftEdgeOfPreviousColumn) * sumOfWeights / delta;
      rightColumn.weight = (rightEdgeOfNextColumn - dragPoint) * sumOfWeights / delta;
    }
    this.positionResizers();
    this.updateWidths();
    event.preventDefault();
  }
  setPreferredWidth(columnIndex, width) {
    const dataTableChildElement = this.dataTableColumnGroup.children[columnIndex];
    elementToPreferedWidthMap.set(dataTableChildElement, width);
    dataTableChildElement.style.width = width + "px";
  }
  columnOffset(columnId) {
    if (!this.element.offsetWidth) {
      return 0;
    }
    for (let i = 1; i < this.visibleColumnsArray.length; ++i) {
      if (columnId === this.visibleColumnsArray[i].id) {
        if (this.resizers[i - 1]) {
          return elementToPositionMap.get(this.resizers[i - 1]) || 0;
        }
      }
    }
    return 0;
  }
  asWidget(element) {
    if (!this.dataGridWidget) {
      this.dataGridWidget = new DataGridWidget(this, element);
    }
    return this.dataGridWidget;
  }
  topFillerRowElement() {
    return this.topFillerRow;
  }
  // Note on the following methods:
  // The header row is a child of the scrollable container, and uses position: sticky
  // so it can visually obscure other elements below it in the grid. We need to manually
  // subtract the header's height when calculating the actual client area in which
  // data rows are visible. However, if a caller has set a different scroll container
  // then we report 0 height and the caller is expected to ensure their chosen scroll
  // container's height matches the visible scrollable data area as seen by the user.
  headerHeightInScroller() {
    return this.scrollContainer === this.#dataContainer ? this.headerHeight() : 0;
  }
  headerHeight() {
    return this.#dataTableHead.offsetHeight;
  }
  revealNode(element) {
    element.scrollIntoViewIfNeeded(false);
    if (element.offsetTop - this.scrollContainer.scrollTop < this.headerHeight()) {
      this.scrollContainer.scrollTop = element.offsetTop - this.headerHeight();
    }
  }
}
export const CornerWidth = 14;
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["SELECTED_NODE"] = "SelectedNode";
  Events2["DESELECTED_NODE"] = "DeselectedNode";
  Events2["OPENED_NODE"] = "OpenedNode";
  Events2["SORTING_CHANGED"] = "SortingChanged";
  Events2["PADDING_CHANGED"] = "PaddingChanged";
  Events2["EXPANDED_NODE"] = "ExpandedNode";
  Events2["COLLAPSED_NODE"] = "CollapsedNode";
  return Events2;
})(Events || {});
export var Order = /* @__PURE__ */ ((Order2) => {
  Order2["Ascending"] = "sort-ascending";
  Order2["Descending"] = "sort-descending";
  return Order2;
})(Order || {});
export var Align = /* @__PURE__ */ ((Align2) => {
  Align2["CENTER"] = "center";
  Align2["RIGHT"] = "right";
  return Align2;
})(Align || {});
export var DataType = /* @__PURE__ */ ((DataType2) => {
  DataType2["STRING"] = "String";
  DataType2["BOOLEAN"] = "Boolean";
  return DataType2;
})(DataType || {});
export const ColumnResizePadding = 30;
export const CenterResizerOverBorderAdjustment = 3;
export var ResizeMethod = /* @__PURE__ */ ((ResizeMethod2) => {
  ResizeMethod2["NEAREST"] = "nearest";
  ResizeMethod2["FIRST"] = "first";
  ResizeMethod2["LAST"] = "last";
  return ResizeMethod2;
})(ResizeMethod || {});
export class DataGridNode {
  elementInternal = null;
  expandedInternal = false;
  #selected = false;
  dirty = false;
  inactive = false;
  highlighted = false;
  #depth;
  revealedInternal;
  attachedInternal = false;
  savedPosition = null;
  #shouldRefreshChildren = true;
  children = [];
  dataGrid = null;
  parent = null;
  previousSibling = null;
  nextSibling = null;
  #disclosureToggleHitBoxWidth = 20;
  selectable = true;
  isRoot = false;
  nodeAccessibleText = "";
  cellAccessibleTextMap = /* @__PURE__ */ new Map();
  isCreationNode = false;
  #data;
  #hasChildren;
  constructor(data, hasChildren) {
    this.#data = data || {};
    this.#hasChildren = hasChildren || false;
  }
  element() {
    if (!this.elementInternal) {
      const element = this.createElement();
      this.createCells(element);
    }
    return this.elementInternal;
  }
  createElement() {
    this.elementInternal = document.createElement("tr");
    this.elementInternal.setAttribute("jslog", `${VisualLogging.tableRow().track({
      resize: true,
      keydown: "ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Enter|Space"
    })}`);
    this.elementInternal.classList.add("data-grid-data-grid-node");
    if (this.dataGrid) {
      this.dataGrid.elementToDataGridNode.set(this.elementInternal, this);
    }
    if (this.#hasChildren) {
      this.elementInternal.classList.add("parent");
    }
    if (this.expanded) {
      this.elementInternal.classList.add("expanded");
    }
    if (this.selected) {
      this.elementInternal.classList.add("selected");
    }
    if (this.revealed) {
      this.elementInternal.classList.add("revealed");
    }
    if (this.dirty) {
      this.elementInternal.classList.add("dirty");
    }
    if (this.inactive) {
      this.elementInternal.classList.add("inactive");
    }
    if (this.highlighted) {
      this.elementInternal.classList.add("highlighted");
    }
    if (this.isCreationNode) {
      this.elementInternal.classList.add("creation-node");
    }
    return this.elementInternal;
  }
  existingElement() {
    return this.elementInternal || null;
  }
  resetElement() {
    this.elementInternal = null;
  }
  createCells(element) {
    element.removeChildren();
    if (!this.dataGrid || !this.parent) {
      return;
    }
    const columnsArray = this.dataGrid.visibleColumnsArray;
    const accessibleTextArray = [];
    if (this.#hasChildren || !this.parent.isRoot) {
      accessibleTextArray.push(i18nString(UIStrings.levelS, { PH1: this.depth + 1 }));
    }
    for (let i = 0; i < columnsArray.length; ++i) {
      const column = columnsArray[i];
      const cell = element.appendChild(this.createCell(column.id));
      if (column.dataType === "Boolean" /* BOOLEAN */ && this.data[column.id] === true) {
        this.setCellAccessibleName(i18nString(UIStrings.checked), cell, column.id);
      }
      accessibleTextArray.push(`${column.title}: ${this.cellAccessibleTextMap.get(column.id) || cell.textContent}`);
    }
    this.nodeAccessibleText = accessibleTextArray.join(", ");
    const cornerCell = this.createTDWithClass("corner");
    UI.ARIAUtils.setHidden(cornerCell, true);
    element.appendChild(cornerCell);
  }
  get data() {
    return this.#data;
  }
  set data(x) {
    this.#data = x || {};
    this.refresh();
  }
  get revealed() {
    if (this.revealedInternal !== void 0) {
      return this.revealedInternal;
    }
    let currentAncestor = this.parent;
    while (currentAncestor && !currentAncestor.isRoot) {
      if (!currentAncestor.expanded) {
        this.revealedInternal = false;
        return false;
      }
      currentAncestor = currentAncestor.parent;
    }
    this.revealed = true;
    return true;
  }
  set revealed(x) {
    if (this.revealedInternal === x) {
      return;
    }
    this.revealedInternal = x;
    if (this.elementInternal) {
      this.elementInternal.classList.toggle("revealed", this.revealedInternal);
    }
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].revealed = x && this.expanded;
    }
  }
  isDirty() {
    return this.dirty;
  }
  setDirty(dirty) {
    if (this.dirty === dirty) {
      return;
    }
    this.dirty = dirty;
    if (!this.elementInternal) {
      return;
    }
    if (dirty) {
      this.elementInternal.classList.add("dirty");
    } else {
      this.elementInternal.classList.remove("dirty");
    }
  }
  setInactive(inactive) {
    if (this.inactive === inactive) {
      return;
    }
    this.inactive = inactive;
    if (!this.elementInternal) {
      return;
    }
    if (inactive) {
      this.elementInternal.classList.add("inactive");
    } else {
      this.elementInternal.classList.remove("inactive");
    }
  }
  setHighlighted(highlighted) {
    if (this.highlighted === highlighted) {
      return;
    }
    this.highlighted = highlighted;
    if (!this.elementInternal) {
      return;
    }
    if (highlighted) {
      this.elementInternal.classList.add("highlighted");
    } else {
      this.elementInternal.classList.remove("highlighted");
    }
  }
  hasChildren() {
    return this.#hasChildren;
  }
  setHasChildren(x) {
    if (this.#hasChildren === x) {
      return;
    }
    this.#hasChildren = x;
    if (!this.elementInternal) {
      return;
    }
    this.elementInternal.classList.toggle("parent", this.#hasChildren);
    this.elementInternal.classList.toggle("expanded", this.#hasChildren && this.expanded);
  }
  get depth() {
    if (this.#depth !== void 0) {
      return this.#depth;
    }
    if (this.parent && !this.parent.isRoot) {
      this.#depth = this.parent.depth + 1;
    } else {
      this.#depth = 0;
    }
    return this.#depth;
  }
  get leftPadding() {
    return this.depth * (this.dataGrid ? this.dataGrid.indentWidth : 1);
  }
  get shouldRefreshChildren() {
    return this.#shouldRefreshChildren;
  }
  set shouldRefreshChildren(x) {
    this.#shouldRefreshChildren = x;
    if (x && this.expanded) {
      this.expand();
    }
  }
  get selected() {
    return this.#selected;
  }
  set selected(x) {
    if (x) {
      this.select();
    } else {
      this.deselect();
    }
  }
  get expanded() {
    return this.expandedInternal;
  }
  set expanded(x) {
    if (x) {
      this.expand();
    } else {
      this.collapse();
    }
  }
  refresh() {
    if (!this.dataGrid) {
      this.elementInternal = null;
    }
    if (!this.elementInternal) {
      return;
    }
    this.createCells(this.elementInternal);
  }
  createTDWithClass(className) {
    const cell = document.createElement("td");
    if (className) {
      cell.className = className;
    }
    const cellClass = this.dataGrid ? this.dataGrid.cellClass : null;
    if (cellClass) {
      cell.classList.add(cellClass);
    }
    return cell;
  }
  createTD(columnId) {
    const cell = this.createTDWithClass(columnId + "-column");
    nodeToColumnIdMap.set(cell, columnId);
    if (this.dataGrid) {
      const editableCell = this.dataGrid.isColumnEditable(columnId);
      cell.setAttribute(
        "jslog",
        `${VisualLogging.tableCell().track({
          click: true,
          keydown: editableCell ? "Enter|Space|Escape" : false,
          dblclick: editableCell,
          change: editableCell
        }).context(Platform.StringUtilities.toKebabCase(columnId))}`
      );
      const alignment = this.dataGrid.columns[columnId].align;
      if (alignment) {
        cell.classList.add(alignment);
      }
      if (columnId === this.dataGrid.disclosureColumnId) {
        cell.classList.add("disclosure");
        if (this.leftPadding) {
          cell.style.setProperty("padding-left", this.leftPadding + "px");
        }
      }
      if (editableCell) {
        cell.tabIndex = 0;
        cell.ariaHasPopup = "true";
      }
    }
    return cell;
  }
  createCell(columnId) {
    const cell = this.createTD(columnId);
    const data = this.data[columnId];
    if (data instanceof Node) {
      cell.appendChild(data);
    } else if (data !== null && this.dataGrid) {
      this.dataGrid.setElementContent(cell, data);
    }
    return cell;
  }
  setCellAccessibleName(name, cell, columnId) {
    this.cellAccessibleTextMap.set(columnId, name);
    for (let i = 0; i < cell.children.length; i++) {
      UI.ARIAUtils.setHidden(cell.children[i], true);
    }
    UI.ARIAUtils.setLabel(cell, name);
  }
  nodeSelfHeight() {
    return 20;
  }
  appendChild(child) {
    this.insertChild(child, this.children.length);
  }
  resetNode(onlyCaches) {
    this.#depth = void 0;
    delete this.revealedInternal;
    if (onlyCaches) {
      return;
    }
    if (this.previousSibling) {
      this.previousSibling.nextSibling = this.nextSibling;
    }
    if (this.nextSibling) {
      this.nextSibling.previousSibling = this.previousSibling;
    }
    this.dataGrid = null;
    this.parent = null;
    this.nextSibling = null;
    this.previousSibling = null;
    this.attachedInternal = false;
  }
  insertChild(child, index) {
    if (!child) {
      throw new Error("insertChild: Node can't be undefined or null.");
    }
    if (child.parent === this) {
      const currentIndex = this.children.indexOf(child);
      if (currentIndex < 0) {
        console.assert(false, "Inconsistent DataGrid state");
      }
      if (currentIndex === index) {
        return;
      }
      if (currentIndex < index) {
        --index;
      }
    }
    child.remove();
    this.children.splice(index, 0, child);
    this.setHasChildren(true);
    child.parent = this;
    child.dataGrid = this.dataGrid;
    child.recalculateSiblings(index);
    child.#shouldRefreshChildren = true;
    let current = child.children[0];
    while (current) {
      current.resetNode(true);
      current.dataGrid = this.dataGrid;
      current.attachedInternal = false;
      current.#shouldRefreshChildren = true;
      current = current.traverseNextNode(false, child, true);
    }
    if (this.expanded) {
      child.attach();
    }
    if (!this.revealed) {
      child.revealed = false;
    }
  }
  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
  removeChild(child) {
    if (!child) {
      throw new Error("removeChild: Node can't be undefined or null.");
    }
    if (child.parent !== this) {
      throw new Error("removeChild: Node is not a child of this node.");
    }
    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(child, false);
    }
    child.detach();
    child.resetNode();
    Platform.ArrayUtilities.removeElement(this.children, child, true);
    if (this.children.length <= 0) {
      this.setHasChildren(false);
    }
  }
  removeChildren() {
    if (this.dataGrid) {
      this.dataGrid.updateSelectionBeforeRemoval(this, true);
    }
    for (let i = 0; i < this.children.length; ++i) {
      const child = this.children[i];
      child.detach();
      child.resetNode();
    }
    this.children = [];
    this.setHasChildren(false);
  }
  recalculateSiblings(myIndex) {
    if (!this.parent) {
      return;
    }
    const previousChild = this.parent.children[myIndex - 1] || null;
    if (previousChild) {
      previousChild.nextSibling = this;
    }
    this.previousSibling = previousChild;
    const nextChild = this.parent.children[myIndex + 1] || null;
    if (nextChild) {
      nextChild.previousSibling = this;
    }
    this.nextSibling = nextChild;
  }
  collapse() {
    if (this.isRoot) {
      return;
    }
    if (this.elementInternal) {
      this.elementInternal.classList.remove("expanded");
    }
    this.expandedInternal = false;
    if (this.selected && this.dataGrid) {
      this.dataGrid.announceSelectedGridNode();
    }
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].revealed = false;
    }
    this.dataGrid?.dispatchEventToListeners("CollapsedNode" /* COLLAPSED_NODE */, this);
  }
  collapseRecursively() {
    let item = this;
    while (item) {
      if (item.expanded) {
        item.collapse();
      }
      item = item.traverseNextNode(false, this, true);
    }
  }
  populate() {
  }
  expand() {
    if (!this.#hasChildren || this.expandedInternal) {
      return;
    }
    if (this.isRoot) {
      return;
    }
    if (this.revealed && !this.#shouldRefreshChildren) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i].revealed = true;
      }
    }
    if (this.#shouldRefreshChildren) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i].detach();
      }
      this.populate();
      if (this.attachedInternal) {
        for (let i = 0; i < this.children.length; ++i) {
          const child = this.children[i];
          if (this.revealed) {
            child.revealed = true;
          }
          child.attach();
        }
      }
      this.#shouldRefreshChildren = false;
    }
    if (this.elementInternal) {
      this.elementInternal.classList.add("expanded");
    }
    if (this.selected && this.dataGrid) {
      this.dataGrid.announceSelectedGridNode();
    }
    this.expandedInternal = true;
    this.dataGrid?.dispatchEventToListeners("ExpandedNode" /* EXPANDED_NODE */, this);
  }
  expandRecursively() {
    let item = this;
    while (item) {
      item.expand();
      item = item.traverseNextNode(false, this);
    }
  }
  reveal() {
    if (this.isRoot || !this.dataGrid) {
      return;
    }
    let currentAncestor = this.parent;
    while (currentAncestor && !currentAncestor.isRoot) {
      if (!currentAncestor.expanded) {
        currentAncestor.expand();
      }
      currentAncestor = currentAncestor.parent;
    }
    this.dataGrid.revealNode(this.element());
  }
  select(supressSelectedEvent) {
    if (!this.dataGrid || !this.selectable || this.selected) {
      return;
    }
    if (this.dataGrid.selectedNode) {
      this.dataGrid.selectedNode.deselect();
    }
    this.#selected = true;
    this.dataGrid.selectedNode = this;
    if (this.elementInternal) {
      this.elementInternal.classList.add("selected");
      this.elementInternal.focus();
      this.dataGrid.setHasSelection(true);
      this.dataGrid.announceSelectedGridNode();
    }
    if (!supressSelectedEvent) {
      this.dataGrid.dispatchEventToListeners("SelectedNode" /* SELECTED_NODE */, this);
    }
  }
  revealAndSelect() {
    if (this.isRoot) {
      return;
    }
    this.reveal();
    this.select();
  }
  deselect(supressDeselectedEvent) {
    if (this.dataGrid?.selectedNode !== this || !this.selected) {
      return;
    }
    this.#selected = false;
    this.dataGrid.selectedNode = null;
    if (this.elementInternal) {
      this.elementInternal.classList.remove("selected");
      this.dataGrid.setHasSelection(false);
    }
    if (!supressDeselectedEvent) {
      this.dataGrid.dispatchEventToListeners("DeselectedNode" /* DESELECTED_NODE */);
    }
  }
  traverseNextNode(skipHidden, stayWithin, dontPopulate, info) {
    if (!dontPopulate && this.#hasChildren) {
      this.populate();
    }
    if (info) {
      info.depthChange = 0;
    }
    let node = !skipHidden || this.revealed ? this.children[0] : null;
    if (node && (!skipHidden || this.expanded)) {
      if (info) {
        info.depthChange = 1;
      }
      return node;
    }
    if (this === stayWithin) {
      return null;
    }
    node = !skipHidden || this.revealed ? this.nextSibling : null;
    if (node) {
      return node;
    }
    node = this;
    while (node && !node.isRoot && !(!skipHidden || node.revealed ? node.nextSibling : null) && node.parent !== stayWithin) {
      if (info) {
        info.depthChange -= 1;
      }
      node = node.parent;
    }
    if (!node) {
      return null;
    }
    return !skipHidden || node.revealed ? node.nextSibling : null;
  }
  traversePreviousNode(skipHidden, dontPopulate) {
    let node = !skipHidden || this.revealed ? this.previousSibling : null;
    if (!dontPopulate && node && node.#hasChildren) {
      node.populate();
    }
    while (node && (!skipHidden || node.revealed && node.expanded ? node.children[node.children.length - 1] : null)) {
      if (!dontPopulate && node && node.#hasChildren) {
        node.populate();
      }
      node = !skipHidden || node.revealed && node.expanded ? node.children[node.children.length - 1] : null;
    }
    if (node) {
      return node;
    }
    if (!this.parent || this.parent.isRoot) {
      return null;
    }
    return this.parent;
  }
  isEventWithinDisclosureTriangle(event) {
    if (!this.#hasChildren) {
      return false;
    }
    const cell = UI.UIUtils.enclosingNodeOrSelfWithNodeName(event.target, "td");
    if (!cell || !(cell instanceof HTMLElement) || !cell.classList.contains("disclosure")) {
      return false;
    }
    const left = cell.getBoundingClientRect().left + this.leftPadding;
    return event.pageX >= left && event.pageX <= left + this.#disclosureToggleHitBoxWidth;
  }
  attach() {
    if (!this.dataGrid || this.attachedInternal) {
      return;
    }
    this.attachedInternal = true;
    const previousNode = this.traversePreviousNode(true, true);
    const previousElement = previousNode ? previousNode.element() : this.dataGrid.topFillerRow;
    this.dataGrid.dataTableBody.insertBefore(this.element(), previousElement.nextSibling);
    if (this.expandedInternal) {
      for (let i = 0; i < this.children.length; ++i) {
        this.children[i].attach();
      }
    }
  }
  detach() {
    if (!this.attachedInternal) {
      return;
    }
    this.attachedInternal = false;
    if (this.elementInternal) {
      this.elementInternal.remove();
    }
    for (let i = 0; i < this.children.length; ++i) {
      this.children[i].detach();
    }
  }
  savePosition() {
    if (this.savedPosition) {
      return;
    }
    if (!this.parent) {
      throw new Error("savePosition: Node must have a parent.");
    }
    this.savedPosition = { parent: this.parent, index: this.parent.children.indexOf(this) };
  }
  restorePosition() {
    if (!this.savedPosition) {
      return;
    }
    if (this.parent !== this.savedPosition.parent) {
      this.savedPosition.parent.insertChild(this, this.savedPosition.index);
    }
    this.savedPosition = null;
  }
}
export class CreationDataGridNode extends DataGridNode {
  isCreationNode;
  constructor(data, hasChildren) {
    super(data, hasChildren);
    this.isCreationNode = true;
  }
}
export class DataGridWidget extends UI.Widget.VBox {
  dataGrid;
  constructor(dataGrid, element) {
    super(element);
    this.dataGrid = dataGrid;
    this.element.appendChild(dataGrid.element);
    this.setDefaultFocusedElement(dataGrid.element);
    this.registerRequiredCSS(dataGridStyles);
  }
  wasShown() {
    super.wasShown();
    this.dataGrid.wasShown();
  }
  willHide() {
    this.dataGrid.willHide();
    super.willHide();
  }
  onResize() {
    super.onResize();
    this.dataGrid.onResize();
  }
  elementsToRestoreScrollPositionsFor() {
    return [this.dataGrid.scrollContainer];
  }
}
//# sourceMappingURL=DataGrid.js.map
