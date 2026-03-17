"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import * as Lit from "../../../../ui/lit/lit.js";
import { EventReferenceClick } from "./EventRef.js";
import tableStyles from "./table.css.js";
const UIStrings = {
  /**
   * @description Table row value representing the remaining items not shown in the table due to size constraints. This row will always represent at least 2 items.
   * @example {5} PH1
   */
  others: "{PH1} others"
};
const str_ = i18n.i18n.registerUIStrings("panels/timeline/components/insights/Table.ts", UIStrings);
export const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const { html } = Lit;
export function renderOthersLabel(numOthers) {
  return i18nString(UIStrings.others, { PH1: numOthers });
}
export function createLimitedRows(arr, aggregator, limit = 10) {
  if (arr.length === 0 || limit === 0) {
    return [];
  }
  const aggregateStartIndex = limit - 1;
  const items = arr.slice(0, aggregateStartIndex).map(aggregator.mapToRow.bind(aggregator));
  if (arr.length > limit) {
    items.push(aggregator.createAggregatedTableRow(arr.slice(aggregateStartIndex)));
  } else if (arr.length === limit) {
    items.push(aggregator.mapToRow(arr[aggregateStartIndex]));
  }
  return items;
}
export const DEFAULT_VIEW = (input, output, target) => {
  const {
    interactive,
    headers,
    flattenedRows,
    onHoverRow,
    onClickRow,
    onMouseLeave
  } = input;
  const numColumns = headers.length;
  function renderRow({ row, depth }) {
    const thStyles = Lit.Directives.styleMap({
      paddingLeft: `calc(${depth} * var(--sys-size-5))`,
      backgroundImage: `repeating-linear-gradient(
            to right,
            var(--sys-color-tonal-outline) 0 var(--sys-size-1),
            transparent var(--sys-size-1) var(--sys-size-5)
          )`,
      backgroundPosition: "0 0",
      backgroundRepeat: "no-repeat",
      backgroundSize: `calc(${depth} * var(--sys-size-5))`
    });
    const trStyles = Lit.Directives.styleMap({
      color: depth ? "var(--sys-color-on-surface-subtle)" : ""
    });
    const columnEls = row.values.map(
      (value, i) => i === 0 ? html`<th
              scope="row"
              colspan=${i === row.values.length - 1 ? numColumns - i : 1}
              style=${thStyles}>${value}
            </th>` : html`<td>${value}</td>`
    );
    return html`<tr style=${trStyles}>${columnEls}</tr>`;
  }
  const findRowAndEl = (el) => {
    const rowEl = el.closest("tr");
    const row = flattenedRows[rowEl.sectionRowIndex].row;
    return { row, rowEl };
  };
  Lit.render(
    html`
    <style>${tableStyles}</style>
    <table
        class=${Lit.Directives.classMap({
      interactive
    })}
        @mouseleave=${interactive ? onMouseLeave : null}>
      <thead>
        <tr>
          ${headers.map((h) => html`<th scope="col">${h}</th>`)}
        </tr>
      </thead>
      <tbody
        @mouseover=${interactive ? (e) => {
      const { row, rowEl } = findRowAndEl(e.target);
      onHoverRow(row, rowEl);
    } : null}
        @click=${interactive ? (e) => {
      const { row, rowEl } = findRowAndEl(e.target);
      onClickRow(row, rowEl);
    } : null}
      >${flattenedRows.map(renderRow)}</tbody>
    </table>`,
    target
  );
};
export class Table extends UI.Widget.Widget {
  #view;
  #insight;
  #state;
  #headers;
  /** The rows as given as by the user, which may include recursive rows via subRows. */
  #rows;
  /** All rows/subRows, in the order that they appear visually. This is the result of traversing `#rows` and any subRows found. */
  #flattenedRows;
  #rowToParentRow = /* @__PURE__ */ new Map();
  #interactive = false;
  #currentHoverRow = null;
  constructor(element, view = DEFAULT_VIEW) {
    super(element, { useShadowDom: true });
    this.#view = view;
  }
  set data(data) {
    this.#insight = data.insight;
    this.#state = data.insight.sharedTableState;
    this.#headers = data.headers;
    this.#rows = data.rows;
    this.#flattenedRows = this.#createFlattenedRows();
    this.#interactive = this.#rows.some((row) => row.overlays || row.subRows?.length);
    this.requestUpdate();
  }
  #createFlattenedRows() {
    if (!this.#rows) {
      return [];
    }
    const rowToParentRow = this.#rowToParentRow;
    rowToParentRow.clear();
    const flattenedRows = [];
    function traverse(parent, row, depth = 0) {
      if (parent) {
        rowToParentRow.set(row, parent);
      }
      flattenedRows.push({ depth, row });
      for (const subRow of row.subRows ?? []) {
        traverse(row, subRow, depth + 1);
      }
    }
    for (const row of this.#rows) {
      traverse(null, row);
    }
    return flattenedRows;
  }
  #onHoverRow(row, rowEl) {
    if (row === this.#currentHoverRow || !this.element.shadowRoot) {
      return;
    }
    for (const el of this.element.shadowRoot.querySelectorAll(".hover")) {
      el.classList.remove("hover");
    }
    let curRow = this.#rowToParentRow.get(row);
    while (curRow) {
      rowEl.classList.add("hover");
      curRow = this.#rowToParentRow.get(curRow);
    }
    this.#currentHoverRow = row;
    this.#onSelectedRowChanged(row, rowEl, { isHover: true });
  }
  #onClickRow(row, rowEl) {
    const overlays = row.overlays;
    if (overlays?.length === 1 && overlays[0].type === "ENTRY_OUTLINE") {
      this.element.dispatchEvent(new EventReferenceClick(overlays[0].entry));
      return;
    }
    this.#onSelectedRowChanged(row, rowEl, { sticky: true });
  }
  #onMouseLeave() {
    for (const el of this.element.shadowRoot?.querySelectorAll(".hover") ?? []) {
      el.classList.remove("hover");
    }
    this.#currentHoverRow = null;
    this.#onSelectedRowChanged(null, null);
  }
  #onSelectedRowChanged(row, rowEl, opts = {}) {
    if (!this.#state || !this.#insight) {
      return;
    }
    if (this.#state.selectionIsSticky && !opts.sticky) {
      return;
    }
    if (this.#state.selectionIsSticky && rowEl === this.#state.selectedRowEl) {
      rowEl = null;
      opts.sticky = false;
    }
    if (rowEl && row) {
      const overlays = row.overlays;
      if (overlays) {
        this.#insight.toggleTemporaryOverlays(overlays, { updateTraceWindow: !opts.isHover });
      }
    } else {
      this.#insight.toggleTemporaryOverlays(null, { updateTraceWindow: false });
    }
    this.#state.selectedRowEl?.classList.remove("selected");
    rowEl?.classList.add("selected");
    this.#state.selectedRowEl = rowEl;
    this.#state.selectionIsSticky = opts.sticky ?? false;
  }
  performUpdate() {
    if (!this.#headers || !this.#flattenedRows) {
      return;
    }
    const input = {
      interactive: this.#interactive,
      headers: this.#headers,
      flattenedRows: this.#flattenedRows,
      onHoverRow: this.#onHoverRow.bind(this),
      onClickRow: this.#onClickRow.bind(this),
      onMouseLeave: this.#onMouseLeave.bind(this)
    };
    this.#view(input, void 0, this.contentElement);
  }
}
//# sourceMappingURL=Table.js.map
