"use strict";
import * as ThemeSupport from "../../theme_support/theme_support.js";
import { ARROW_SIDE } from "./FlameChart.js";
export function horizontalLine(context, width, y) {
  context.moveTo(0, y);
  context.lineTo(width, y);
}
export function drawExpansionArrow(context, x, y, expanded) {
  const arrowHeight = ARROW_SIDE * Math.sqrt(3) / 2;
  const arrowCenterOffset = Math.round(arrowHeight / 2);
  context.save();
  context.beginPath();
  context.translate(x, y);
  context.rotate(expanded ? Math.PI / 2 : 0);
  context.moveTo(-arrowCenterOffset, -ARROW_SIDE / 2);
  context.lineTo(-arrowCenterOffset, ARROW_SIDE / 2);
  context.lineTo(arrowHeight - arrowCenterOffset, 0);
  context.fill();
  context.restore();
}
export function drawIcon(context, x, y, width, pathData, iconColor = "--sys-color-on-surface") {
  const p = new Path2D(pathData);
  context.save();
  context.translate(x, y);
  context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue("--sys-color-cdt-base-container");
  context.fillRect(0, 0, width, width);
  context.fillStyle = ThemeSupport.ThemeSupport.instance().getComputedValue(iconColor);
  const scale = width / 20;
  context.scale(scale, scale);
  context.fill(p);
  context.restore();
}
//# sourceMappingURL=CanvasHelper.js.map
