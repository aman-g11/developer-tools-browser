"use strict";
import * as Geometry from "../../../../models/geometry/geometry.js";
import { CSSLinearEasingModel } from "./CSSLinearEasingModel.js";
export class AnimationTimingModel {
  static parse(text) {
    const cssLinearEasingModel = CSSLinearEasingModel.parse(text);
    if (cssLinearEasingModel) {
      return cssLinearEasingModel;
    }
    return Geometry.CubicBezier.parse(text) || null;
  }
}
export const LINEAR_BEZIER = Geometry.LINEAR_BEZIER;
//# sourceMappingURL=AnimationTimingModel.js.map
