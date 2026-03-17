"use strict";
import * as Platform from "../../../../core/platform/platform.js";
import * as Geometry from "../../../../models/geometry/geometry.js";
import * as UI from "../../legacy.js";
export const CSSAngleRegex = /(?<value>[+-]?\d*\.?\d+)(?<unit>deg|grad|rad|turn)/;
export var AngleUnit = /* @__PURE__ */ ((AngleUnit2) => {
  AngleUnit2["DEG"] = "deg";
  AngleUnit2["GRAD"] = "grad";
  AngleUnit2["RAD"] = "rad";
  AngleUnit2["TURN"] = "turn";
  return AngleUnit2;
})(AngleUnit || {});
export const parseText = (text) => {
  const result = text.match(CSSAngleRegex);
  if (!result?.groups) {
    return null;
  }
  return {
    value: Number(result.groups.value),
    unit: result.groups.unit
  };
};
export const getAngleFromRadians = (rad, targetUnit) => {
  let value = rad;
  switch (targetUnit) {
    case "grad" /* GRAD */:
      value = Geometry.radiansToGradians(rad);
      break;
    case "deg" /* DEG */:
      value = Geometry.radiansToDegrees(rad);
      break;
    case "turn" /* TURN */:
      value = Geometry.radiansToTurns(rad);
      break;
  }
  return {
    value,
    unit: targetUnit
  };
};
export const getRadiansFromAngle = (angle) => {
  switch (angle.unit) {
    case "deg" /* DEG */:
      return Geometry.degreesToRadians(angle.value);
    case "grad" /* GRAD */:
      return Geometry.gradiansToRadians(angle.value);
    case "turn" /* TURN */:
      return Geometry.turnsToRadians(angle.value);
  }
  return angle.value;
};
export const get2DTranslationsForAngle = (angle, radius) => {
  const radian = getRadiansFromAngle(angle);
  return {
    translateX: Math.sin(radian) * radius,
    translateY: -Math.cos(radian) * radius
  };
};
export const roundAngleByUnit = (angle) => {
  let roundedValue = angle.value;
  switch (angle.unit) {
    case "deg" /* DEG */:
    case "grad" /* GRAD */:
      roundedValue = Math.round(angle.value);
      break;
    case "rad" /* RAD */:
      roundedValue = Math.round(angle.value * 1e4) / 1e4;
      break;
    case "turn" /* TURN */:
      roundedValue = Math.round(angle.value * 100) / 100;
      break;
    default:
      Platform.assertNever(angle.unit, `Unknown angle unit: ${angle.unit}`);
  }
  return {
    value: roundedValue,
    unit: angle.unit
  };
};
export const getNextUnit = (currentUnit) => {
  switch (currentUnit) {
    case "deg" /* DEG */:
      return "grad" /* GRAD */;
    case "grad" /* GRAD */:
      return "rad" /* RAD */;
    case "rad" /* RAD */:
      return "turn" /* TURN */;
    default:
      return "deg" /* DEG */;
  }
};
export const convertAngleUnit = (angle, newUnit) => {
  if (angle.unit === newUnit) {
    return angle;
  }
  const radian = getRadiansFromAngle(angle);
  return getAngleFromRadians(radian, newUnit);
};
export const getNewAngleFromEvent = (angle, event) => {
  const direction = UI.UIUtils.getValueModificationDirection(event);
  if (direction === null) {
    return;
  }
  let diff = direction === "Up" ? Math.PI / 180 : -Math.PI / 180;
  if (event.shiftKey) {
    diff *= 10;
  }
  const radian = getRadiansFromAngle(angle);
  return getAngleFromRadians(radian + diff, angle.unit);
};
//# sourceMappingURL=CSSAngleUtils.js.map
