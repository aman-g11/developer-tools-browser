"use strict";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import { CSSQuery } from "./CSSQuery.js";
export class CSSContainerQuery extends CSSQuery {
  name;
  physicalAxes;
  logicalAxes;
  queriesScrollState;
  queriesAnchored;
  static parseContainerQueriesPayload(cssModel, payload) {
    return payload.map((cq) => new CSSContainerQuery(cssModel, cq));
  }
  constructor(cssModel, payload) {
    super(cssModel);
    this.reinitialize(payload);
  }
  reinitialize(payload) {
    this.text = payload.text;
    this.range = payload.range ? TextUtils.TextRange.TextRange.fromObject(payload.range) : null;
    this.styleSheetId = payload.styleSheetId;
    this.name = payload.name;
    this.physicalAxes = payload.physicalAxes;
    this.logicalAxes = payload.logicalAxes;
    this.queriesScrollState = payload.queriesScrollState;
    this.queriesAnchored = payload.queriesAnchored;
  }
  active() {
    return true;
  }
  async getContainerForNode(nodeId) {
    const containerNode = await this.cssModel.domModel().getContainerForNode(
      nodeId,
      this.name,
      this.physicalAxes,
      this.logicalAxes,
      this.queriesScrollState,
      this.queriesAnchored
    );
    if (!containerNode) {
      return;
    }
    return new CSSContainerQueryContainer(containerNode);
  }
}
export class CSSContainerQueryContainer {
  containerNode;
  constructor(containerNode) {
    this.containerNode = containerNode;
  }
  async getContainerSizeDetails() {
    const styles = await this.containerNode.domModel().cssModel().getComputedStyle(this.containerNode.id);
    if (!styles) {
      return;
    }
    const containerType = styles.get("container-type");
    const writingMode = styles.get("writing-mode");
    if (!containerType || !writingMode) {
      return;
    }
    const queryAxis = getQueryAxisFromContainerType(`${containerType}`);
    const physicalAxis = getPhysicalAxisFromQueryAxis(queryAxis, writingMode);
    let width, height;
    if (physicalAxis === "Both" /* BOTH */ || physicalAxis === "Horizontal" /* HORIZONTAL */) {
      width = styles.get("width");
    }
    if (physicalAxis === "Both" /* BOTH */ || physicalAxis === "Vertical" /* VERTICAL */) {
      height = styles.get("height");
    }
    return {
      queryAxis,
      physicalAxis,
      width,
      height
    };
  }
}
export const getQueryAxisFromContainerType = (propertyValue) => {
  const segments = propertyValue.split(" ");
  let isInline = false;
  for (const segment of segments) {
    if (segment === "size") {
      return "size" /* BOTH */;
    }
    isInline = isInline || segment === "inline-size";
  }
  if (isInline) {
    return "inline-size" /* INLINE */;
  }
  return "" /* NONE */;
};
export const getPhysicalAxisFromQueryAxis = (queryAxis, writingMode) => {
  const isVerticalWritingMode = writingMode.startsWith("vertical");
  switch (queryAxis) {
    case "" /* NONE */:
      return "" /* NONE */;
    case "size" /* BOTH */:
      return "Both" /* BOTH */;
    case "inline-size" /* INLINE */:
      return isVerticalWritingMode ? "Vertical" /* VERTICAL */ : "Horizontal" /* HORIZONTAL */;
    case "block-size" /* BLOCK */:
      return isVerticalWritingMode ? "Horizontal" /* HORIZONTAL */ : "Vertical" /* VERTICAL */;
  }
};
export var QueryAxis = /* @__PURE__ */ ((QueryAxis2) => {
  QueryAxis2["NONE"] = "";
  QueryAxis2["INLINE"] = "inline-size";
  QueryAxis2["BLOCK"] = "block-size";
  QueryAxis2["BOTH"] = "size";
  return QueryAxis2;
})(QueryAxis || {});
export var PhysicalAxis = /* @__PURE__ */ ((PhysicalAxis2) => {
  PhysicalAxis2["NONE"] = "";
  PhysicalAxis2["HORIZONTAL"] = "Horizontal";
  PhysicalAxis2["VERTICAL"] = "Vertical";
  PhysicalAxis2["BOTH"] = "Both";
  return PhysicalAxis2;
})(PhysicalAxis || {});
//# sourceMappingURL=CSSContainerQuery.js.map
