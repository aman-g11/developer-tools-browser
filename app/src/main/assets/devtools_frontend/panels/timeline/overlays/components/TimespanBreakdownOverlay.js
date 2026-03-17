"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as UI from "../../../../ui/legacy/legacy.js";
import { Directives, html, nothing, render } from "../../../../ui/lit/lit.js";
import timespanBreakdownOverlayStyles from "./timespanBreakdownOverlay.css.js";
const renderSection = (section, position) => {
  const style = Directives.styleMap(
    { left: position ? `${position.left}px` : void 0, width: position ? `${position.width}px` : void 0 }
  );
  return html`
      <div class="timespan-breakdown-overlay-section" style=${style}>
        <div class="timespan-breakdown-overlay-label">
          ${section.showDuration ? html`<span class="duration-text">${i18n.TimeUtilities.formatMicroSecondsAsMillisFixed(section.bounds.range)}</span> ` : nothing}
          <span class="section-label-text">${section.label}</span>
        </div>
      </div>`;
};
export const DEFAULT_VIEW = (input, _output, target) => {
  const style = Directives.styleMap({
    left: input.left ? `${input.left}px` : void 0,
    width: input.width ? `${input.width}px` : void 0,
    top: input.top ? `${input.top}px` : void 0,
    maxHeight: input.maxHeight ? `${input.maxHeight}px` : void 0,
    position: "relative"
  });
  render(
    html`
        <style>${timespanBreakdownOverlayStyles}</style>
        <div style=${style} class=${input.className}>
          ${input.sections?.map((curr, index) => {
      return renderSection(curr, input.positions[index]);
    })}
        </div>`,
    target
  );
};
export class TimespanBreakdownOverlay extends UI.Widget.Widget {
  #canvasRect = null;
  #sections = null;
  #sectionsPositions = [];
  #left = null;
  #width = null;
  #maxHeight = null;
  #top = null;
  #view;
  constructor(element, view = DEFAULT_VIEW) {
    super(element, { classes: ["devtools-timespan-breakdown-overlay"] });
    this.#view = view;
    this.requestUpdate();
  }
  set top(top) {
    this.#top = top;
    this.requestUpdate();
  }
  set maxHeight(maxHeight) {
    this.#maxHeight = maxHeight;
    this.requestUpdate();
  }
  set width(width) {
    this.#width = width;
    this.requestUpdate();
  }
  set left(left) {
    this.#left = left;
    this.requestUpdate();
  }
  set isBelowEntry(isBelow) {
    this.element.classList.toggle("is-below", isBelow);
  }
  set canvasRect(rect) {
    if (this.#canvasRect && rect && this.#canvasRect.width === rect.width && this.#canvasRect.height === rect.height) {
      return;
    }
    this.#canvasRect = rect;
    this.requestUpdate();
  }
  set widths(widths) {
    if (widths === this.#sectionsPositions) {
      return;
    }
    this.#sectionsPositions = widths;
    this.requestUpdate();
  }
  set sections(sections) {
    if (sections === this.#sections) {
      return;
    }
    this.#sections = sections;
    this.requestUpdate();
  }
  /**
   * We use this method after the overlay has been positioned in order to move
   * the section label as required to keep it on screen.
   * If the label is off to the left or right, we fix it to that corner and
   * align the text so the label is visible as long as possible.
   */
  checkSectionLabelPositioning() {
    const sections = this.element.querySelectorAll(".timespan-breakdown-overlay-section");
    if (!sections) {
      return;
    }
    if (!this.#canvasRect) {
      return;
    }
    const paddingForScrollbar = 9;
    const sectionLayoutData = /* @__PURE__ */ new Map();
    for (const section of sections) {
      const label = section.querySelector(".timespan-breakdown-overlay-label");
      if (!label) {
        continue;
      }
      const sectionRect = section.getBoundingClientRect();
      const labelRect = label.getBoundingClientRect();
      sectionLayoutData.set(section, { sectionRect, labelRect, label });
    }
    const minSectionWidthToShowAnyLabel = 30;
    for (const section of sections) {
      const layoutData = sectionLayoutData.get(section);
      if (!layoutData) {
        break;
      }
      const { labelRect, sectionRect, label } = layoutData;
      const labelHidden = sectionRect.width < minSectionWidthToShowAnyLabel;
      const labelTruncated = sectionRect.width - 5 <= labelRect.width;
      label.classList.toggle("labelHidden", labelHidden);
      label.classList.toggle("labelTruncated", labelTruncated);
      if (labelHidden || labelTruncated) {
        continue;
      }
      const labelLeftMarginToCenter = (sectionRect.width - labelRect.width) / 2;
      const newLabelX = sectionRect.x + labelLeftMarginToCenter;
      const labelOffLeftOfScreen = newLabelX < this.#canvasRect.x;
      label.classList.toggle("offScreenLeft", labelOffLeftOfScreen);
      const rightBound = this.#canvasRect.x + this.#canvasRect.width;
      const labelRightEdge = sectionRect.x + labelLeftMarginToCenter + labelRect.width;
      const labelOffRightOfScreen = labelRightEdge > rightBound;
      label.classList.toggle("offScreenRight", labelOffRightOfScreen);
      if (labelOffLeftOfScreen) {
        label.style.marginLeft = `${Math.abs(this.#canvasRect.x - sectionRect.x) + paddingForScrollbar}px`;
      } else if (labelOffRightOfScreen) {
        const leftMargin = rightBound - labelRect.width - sectionRect.x;
        label.style.marginLeft = `${leftMargin}px`;
      } else {
        label.style.marginLeft = `${labelLeftMarginToCenter}px`;
      }
    }
  }
  performUpdate() {
    let className = "timeline-segment-container";
    if (this.#sections) {
      if (this.#sections.length % 2 === 0) {
        className += " even-number-of-sections";
      } else {
        className += " odd-number-of-sections";
      }
    }
    this.#view({
      sections: this.#sections,
      positions: this.#sectionsPositions,
      left: this.#left,
      width: this.#width,
      top: this.#top,
      maxHeight: this.#maxHeight,
      className
    }, void 0, this.contentElement);
    this.checkSectionLabelPositioning();
  }
}
//# sourceMappingURL=TimespanBreakdownOverlay.js.map
