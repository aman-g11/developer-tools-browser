"use strict";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Platform from "../../../core/platform/platform.js";
const UIStrings = {
  /**
   * @description Text that is shown in the LinearMemoryInspector if a value could not be correctly formatted
   *             for the requested mode (e.g. we do not floats to be represented as hexadecimal numbers).
   *             Abbreviation stands for 'not applicable'.
   */
  notApplicable: "N/A"
};
const str_ = i18n.i18n.registerUIStrings("panels/linear_memory_inspector/components/ValueInterpreterDisplayUtils.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export const VALUE_INTEPRETER_MAX_NUM_BYTES = 8;
export var ValueType = /* @__PURE__ */ ((ValueType2) => {
  ValueType2["INT8"] = "Integer 8-bit";
  ValueType2["INT16"] = "Integer 16-bit";
  ValueType2["INT32"] = "Integer 32-bit";
  ValueType2["INT64"] = "Integer 64-bit";
  ValueType2["FLOAT32"] = "Float 32-bit";
  ValueType2["FLOAT64"] = "Float 64-bit";
  ValueType2["POINTER32"] = "Pointer 32-bit";
  ValueType2["POINTER64"] = "Pointer 64-bit";
  return ValueType2;
})(ValueType || {});
export var Endianness = /* @__PURE__ */ ((Endianness2) => {
  Endianness2["LITTLE"] = "Little Endian";
  Endianness2["BIG"] = "Big Endian";
  return Endianness2;
})(Endianness || {});
export var ValueTypeMode = /* @__PURE__ */ ((ValueTypeMode2) => {
  ValueTypeMode2["DECIMAL"] = "dec";
  ValueTypeMode2["HEXADECIMAL"] = "hex";
  ValueTypeMode2["OCTAL"] = "oct";
  ValueTypeMode2["SCIENTIFIC"] = "sci";
  return ValueTypeMode2;
})(ValueTypeMode || {});
export function getDefaultValueTypeMapping() {
  return new Map(DEFAULT_MODE_MAPPING);
}
const DEFAULT_MODE_MAPPING = /* @__PURE__ */ new Map([
  ["Integer 8-bit" /* INT8 */, "dec" /* DECIMAL */],
  ["Integer 16-bit" /* INT16 */, "dec" /* DECIMAL */],
  ["Integer 32-bit" /* INT32 */, "dec" /* DECIMAL */],
  ["Integer 64-bit" /* INT64 */, "dec" /* DECIMAL */],
  ["Float 32-bit" /* FLOAT32 */, "dec" /* DECIMAL */],
  ["Float 64-bit" /* FLOAT64 */, "dec" /* DECIMAL */],
  ["Pointer 32-bit" /* POINTER32 */, "hex" /* HEXADECIMAL */],
  ["Pointer 64-bit" /* POINTER64 */, "hex" /* HEXADECIMAL */]
]);
export const VALUE_TYPE_MODE_LIST = [
  "dec" /* DECIMAL */,
  "hex" /* HEXADECIMAL */,
  "oct" /* OCTAL */,
  "sci" /* SCIENTIFIC */
];
export function valueTypeToLocalizedString(valueType) {
  return i18n.i18n.lockedString(valueType);
}
export function isValidMode(type, mode) {
  switch (type) {
    case "Integer 8-bit" /* INT8 */:
    case "Integer 16-bit" /* INT16 */:
    case "Integer 32-bit" /* INT32 */:
    case "Integer 64-bit" /* INT64 */:
      return mode === "dec" /* DECIMAL */ || mode === "hex" /* HEXADECIMAL */ || mode === "oct" /* OCTAL */;
    case "Float 32-bit" /* FLOAT32 */:
    case "Float 64-bit" /* FLOAT64 */:
      return mode === "sci" /* SCIENTIFIC */ || mode === "dec" /* DECIMAL */;
    case "Pointer 32-bit" /* POINTER32 */:
    // fallthrough
    case "Pointer 64-bit" /* POINTER64 */:
      return mode === "hex" /* HEXADECIMAL */;
    default:
      return Platform.assertNever(type, `Unknown value type: ${type}`);
  }
}
export function isNumber(type) {
  switch (type) {
    case "Integer 8-bit" /* INT8 */:
    case "Integer 16-bit" /* INT16 */:
    case "Integer 32-bit" /* INT32 */:
    case "Integer 64-bit" /* INT64 */:
    case "Float 32-bit" /* FLOAT32 */:
    case "Float 64-bit" /* FLOAT64 */:
      return true;
    default:
      return false;
  }
}
export function getPointerAddress(type, buffer, endianness) {
  if (!isPointer(type)) {
    console.error(`Requesting address of a non-pointer type: ${type}.
`);
    return NaN;
  }
  try {
    const dataView = new DataView(buffer);
    const isLittleEndian = endianness === "Little Endian" /* LITTLE */;
    return type === "Pointer 32-bit" /* POINTER32 */ ? dataView.getUint32(0, isLittleEndian) : dataView.getBigUint64(0, isLittleEndian);
  } catch {
    return NaN;
  }
}
export function isPointer(type) {
  return type === "Pointer 32-bit" /* POINTER32 */ || type === "Pointer 64-bit" /* POINTER64 */;
}
export function format(formatData) {
  if (!formatData.mode) {
    console.error(`No known way of showing value for ${formatData.type}`);
    return i18nString(UIStrings.notApplicable);
  }
  const valueView = new DataView(formatData.buffer);
  const isLittleEndian = formatData.endianness === "Little Endian" /* LITTLE */;
  let value;
  try {
    switch (formatData.type) {
      case "Integer 8-bit" /* INT8 */:
        value = formatData.signed ? valueView.getInt8(0) : valueView.getUint8(0);
        return formatInteger(value, formatData.mode);
      case "Integer 16-bit" /* INT16 */:
        value = formatData.signed ? valueView.getInt16(0, isLittleEndian) : valueView.getUint16(0, isLittleEndian);
        return formatInteger(value, formatData.mode);
      case "Integer 32-bit" /* INT32 */:
        value = formatData.signed ? valueView.getInt32(0, isLittleEndian) : valueView.getUint32(0, isLittleEndian);
        return formatInteger(value, formatData.mode);
      case "Integer 64-bit" /* INT64 */:
        value = formatData.signed ? valueView.getBigInt64(0, isLittleEndian) : valueView.getBigUint64(0, isLittleEndian);
        return formatInteger(value, formatData.mode);
      case "Float 32-bit" /* FLOAT32 */:
        value = valueView.getFloat32(0, isLittleEndian);
        return formatFloat(value, formatData.mode);
      case "Float 64-bit" /* FLOAT64 */:
        value = valueView.getFloat64(0, isLittleEndian);
        return formatFloat(value, formatData.mode);
      case "Pointer 32-bit" /* POINTER32 */:
        value = valueView.getUint32(0, isLittleEndian);
        return formatInteger(value, "hex" /* HEXADECIMAL */);
      case "Pointer 64-bit" /* POINTER64 */:
        value = valueView.getBigUint64(0, isLittleEndian);
        return formatInteger(value, "hex" /* HEXADECIMAL */);
      default:
        return Platform.assertNever(formatData.type, `Unknown value type: ${formatData.type}`);
    }
  } catch {
    return i18nString(UIStrings.notApplicable);
  }
}
export function formatFloat(value, mode) {
  switch (mode) {
    case "dec" /* DECIMAL */:
      return value.toFixed(2).toString();
    case "sci" /* SCIENTIFIC */:
      return value.toExponential(2).toString();
    default:
      throw new Error(`Unknown mode for floats: ${mode}.`);
  }
}
export function formatInteger(value, mode) {
  switch (mode) {
    case "dec" /* DECIMAL */:
      return value.toString();
    case "hex" /* HEXADECIMAL */:
      if (value < 0) {
        return i18nString(UIStrings.notApplicable);
      }
      return "0x" + value.toString(16).toUpperCase();
    case "oct" /* OCTAL */:
      if (value < 0) {
        return i18nString(UIStrings.notApplicable);
      }
      return value.toString(8);
    default:
      throw new Error(`Unknown mode for integers: ${mode}.`);
  }
}
//# sourceMappingURL=ValueInterpreterDisplayUtils.js.map
