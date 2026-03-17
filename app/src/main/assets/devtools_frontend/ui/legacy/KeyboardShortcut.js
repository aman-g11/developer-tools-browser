"use strict";
import * as Host from "../../core/host/host.js";
import { DefaultShortcutSetting } from "./ShortcutRegistry.js";
export class KeyboardShortcut {
  descriptors;
  action;
  type;
  keybindSets;
  constructor(descriptors, action, type, keybindSets) {
    this.descriptors = descriptors;
    this.action = action;
    this.type = type;
    this.keybindSets = keybindSets || /* @__PURE__ */ new Set();
  }
  title() {
    return this.descriptors.map((descriptor) => descriptor.name).join(" ");
  }
  isDefault() {
    return this.type === "DefaultShortcut" /* DEFAULT_SHORTCUT */ || this.type === "DisabledDefault" /* DISABLED_DEFAULT */ || this.type === "KeybindSetShortcut" /* KEYBIND_SET_SHORTCUT */ && this.keybindSets.has(DefaultShortcutSetting);
  }
  changeType(type) {
    return new KeyboardShortcut(this.descriptors, this.action, type);
  }
  changeKeys(descriptors) {
    this.descriptors = descriptors;
    return this;
  }
  descriptorsMatch(descriptors) {
    if (descriptors.length !== this.descriptors.length) {
      return false;
    }
    return descriptors.every((descriptor, index) => descriptor.key === this.descriptors[index].key);
  }
  hasKeybindSet(keybindSet) {
    return !this.keybindSets || this.keybindSets.has(keybindSet);
  }
  equals(shortcut) {
    return this.descriptorsMatch(shortcut.descriptors) && this.type === shortcut.type && this.action === shortcut.action;
  }
  static createShortcutFromSettingObject(settingObject) {
    return new KeyboardShortcut(settingObject.descriptors, settingObject.action, settingObject.type);
  }
  /**
   * Creates a number encoding keyCode in the lower 8 bits and modifiers mask in the higher 8 bits.
   * It is useful for matching pressed keys.
   */
  static makeKey(keyCode, modifiers) {
    if (typeof keyCode === "string") {
      keyCode = keyCode.charCodeAt(0) - (/^[a-z]/.test(keyCode) ? 32 : 0);
    }
    modifiers = modifiers || Modifiers.None.value;
    return KeyboardShortcut.makeKeyFromCodeAndModifiers(keyCode, modifiers);
  }
  static makeKeyFromEvent(keyboardEvent) {
    let modifiers = Modifiers.None.value;
    if (keyboardEvent.shiftKey) {
      modifiers |= Modifiers.Shift.value;
    }
    if (keyboardEvent.ctrlKey) {
      modifiers |= Modifiers.Ctrl.value;
    }
    if (keyboardEvent.altKey) {
      modifiers |= Modifiers.Alt.value;
    }
    if (keyboardEvent.metaKey) {
      modifiers |= Modifiers.Meta.value;
    }
    const keyCode = keyboardEvent.keyCode || keyboardEvent["__keyCode"];
    return KeyboardShortcut.makeKeyFromCodeAndModifiers(keyCode, modifiers);
  }
  // This checks if a "control equivalent" key is pressed. For non-mac platforms this means checking
  // if control is pressed but not meta. On mac, we instead check if meta is pressed but not control.
  static eventHasCtrlEquivalentKey(event) {
    return Host.Platform.isMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  }
  static eventHasEitherCtrlOrMeta(event) {
    return event.metaKey || event.ctrlKey;
  }
  static hasNoModifiers(event) {
    const keyboardEvent = event;
    return !keyboardEvent.ctrlKey && !keyboardEvent.shiftKey && !keyboardEvent.altKey && !keyboardEvent.metaKey;
  }
  static hasAtLeastOneModifier(event) {
    return KeyboardShortcut.hasNoModifiers(event) === false;
  }
  static makeDescriptor(key, modifiers) {
    return {
      key: KeyboardShortcut.makeKey(typeof key === "string" ? key : key.code, modifiers),
      name: KeyboardShortcut.shortcutToString(key, modifiers)
    };
  }
  static makeDescriptorFromBindingShortcut(shortcut) {
    const [keyString, ...modifierStrings] = shortcut.split(/\+(?!$)/).reverse();
    let modifiers = 0;
    for (const modifierString of modifierStrings) {
      const modifier = Modifiers[modifierString].value;
      console.assert(
        typeof modifier !== "undefined",
        `Only one key other than modifier is allowed in shortcut <${shortcut}>`
      );
      modifiers |= modifier;
    }
    console.assert(keyString.length > 0, `Modifiers-only shortcuts are not allowed (encountered <${shortcut}>)`);
    const key = Keys[keyString] || KeyBindings[keyString];
    if (key && "shiftKey" in key && key.shiftKey) {
      modifiers |= Modifiers.Shift.value;
    }
    return KeyboardShortcut.makeDescriptor(key ? key : keyString, modifiers);
  }
  static shortcutToString(key, modifiers) {
    if (typeof key !== "string" && KeyboardShortcut.isModifier(key.code)) {
      return KeyboardShortcut.modifiersToString(modifiers);
    }
    return KeyboardShortcut.modifiersToString(modifiers) + KeyboardShortcut.keyName(key);
  }
  static keyName(key) {
    if (typeof key === "string") {
      return key.toUpperCase();
    }
    if (typeof key.name === "string") {
      return key.name;
    }
    return key.name[Host.Platform.platform()] || key.name.other || "";
  }
  static makeKeyFromCodeAndModifiers(keyCode, modifiers) {
    return keyCode & 255 | (modifiers || 0) << 8;
  }
  static keyCodeAndModifiersFromKey(key) {
    return { keyCode: key & 255, modifiers: key >> 8 };
  }
  static isModifier(key) {
    const { keyCode } = KeyboardShortcut.keyCodeAndModifiersFromKey(key);
    return keyCode === Keys.Shift.code || keyCode === Keys.Ctrl.code || keyCode === Keys.Alt.code || keyCode === Keys.Meta.code;
  }
  static modifiersToString(modifiers) {
    const isMac = Host.Platform.isMac();
    const m = Modifiers;
    const modifierNames = /* @__PURE__ */ new Map([
      [m.Ctrl, isMac ? "Ctrl\u2004" : "Ctrl\u200A+\u200A"],
      [m.Alt, isMac ? "\u2325\u2004" : "Alt\u200A+\u200A"],
      [m.Shift, isMac ? "\u21E7\u2004" : "Shift\u200A+\u200A"],
      [m.Meta, isMac ? "\u2318\u2004" : "Win\u200A+\u200A"]
    ]);
    return [m.Meta, m.Ctrl, m.Alt, m.Shift].map(mapModifiers).join("");
    function mapModifiers(m2) {
      return (modifiers || 0) & m2.value ? (
        /** @type {string} */
        modifierNames.get(m2)
      ) : "";
    }
  }
  static keyCodeToKey(keyCode) {
    return Object.values(Keys).find((key) => key.code === keyCode);
  }
  static modifierValueToModifier(modifierValue) {
    return Object.values(Modifiers).find((modifier) => modifier.value === modifierValue);
  }
}
export const Modifiers = {
  None: { value: 0, name: "None" },
  Shift: { value: 1, name: "Shift" },
  Ctrl: { value: 2, name: "Ctrl" },
  Alt: { value: 4, name: "Alt" },
  Meta: { value: 8, name: "Meta" },
  CtrlOrMeta: {
    value: Host.Platform.isMac() ? 8 : 2,
    name: Host.Platform.isMac() ? "Meta" : "Ctrl"
  },
  ShiftOrOption: {
    value: Host.Platform.isMac() ? 4 : 1,
    name: Host.Platform.isMac() ? "Alt" : "Shift"
  }
};
const leftKey = {
  code: 37,
  name: "\u2190"
};
const upKey = {
  code: 38,
  name: "\u2191"
};
const rightKey = {
  code: 39,
  name: "\u2192"
};
const downKey = {
  code: 40,
  name: "\u2193"
};
const ctrlKey = {
  code: 17,
  name: "Ctrl"
};
const escKey = {
  code: 27,
  name: "Esc"
};
const spaceKey = {
  code: 32,
  name: "Space"
};
const plusKey = {
  code: 187,
  name: "+"
};
const backquoteKey = {
  code: 192,
  name: "`"
};
const quoteKey = {
  code: 222,
  name: "'"
};
const metaKey = {
  code: 91,
  name: "Meta"
};
export const Keys = {
  Backspace: { code: 8, name: "\u21A4" },
  Tab: { code: 9, name: { mac: "\u21E5", other: "Tab" } },
  Enter: { code: 13, name: { mac: "\u21A9", other: "Enter" } },
  Shift: { code: 16, name: { mac: "\u21E7", other: "Shift" } },
  Ctrl: ctrlKey,
  Control: ctrlKey,
  Alt: { code: 18, name: "Alt" },
  Esc: escKey,
  Escape: escKey,
  Space: spaceKey,
  " ": spaceKey,
  PageUp: { code: 33, name: { mac: "\u21DE", other: "PageUp" } },
  // also NUM_NORTH_EAST
  PageDown: { code: 34, name: { mac: "\u21DF", other: "PageDown" } },
  // also NUM_SOUTH_EAST
  End: { code: 35, name: { mac: "\u2197", other: "End" } },
  // also NUM_SOUTH_WEST
  Home: { code: 36, name: { mac: "\u2196", other: "Home" } },
  // also NUM_NORTH_WEST
  Left: leftKey,
  // also NUM_WEST
  Up: upKey,
  // also NUM_NORTH
  Right: rightKey,
  // also NUM_EAST
  Down: downKey,
  // also NUM_SOUTH
  ArrowLeft: leftKey,
  ArrowUp: upKey,
  ArrowRight: rightKey,
  ArrowDown: downKey,
  Delete: { code: 46, name: "Del" },
  Zero: { code: 48, name: "0" },
  C: { code: 67, name: "C" },
  H: { code: 72, name: "H" },
  N: { code: 78, name: "N" },
  O: { code: 79, name: "O" },
  P: { code: 80, name: "P" },
  R: { code: 82, name: "R" },
  S: { code: 83, name: "S" },
  U: { code: 85, name: "U" },
  V: { code: 86, name: "V" },
  X: { code: 88, name: "X" },
  Meta: metaKey,
  F1: { code: 112, name: "F1" },
  F2: { code: 113, name: "F2" },
  F3: { code: 114, name: "F3" },
  F4: { code: 115, name: "F4" },
  F5: { code: 116, name: "F5" },
  F6: { code: 117, name: "F6" },
  F7: { code: 118, name: "F7" },
  F8: { code: 119, name: "F8" },
  F9: { code: 120, name: "F9" },
  F10: { code: 121, name: "F10" },
  F11: { code: 122, name: "F11" },
  F12: { code: 123, name: "F12" },
  Semicolon: { code: 186, name: ";" },
  NumpadPlus: { code: 107, name: "Numpad +" },
  NumpadMinus: { code: 109, name: "Numpad -" },
  Numpad0: { code: 96, name: "Numpad 0" },
  Plus: plusKey,
  Equal: plusKey,
  Comma: { code: 188, name: "," },
  Minus: { code: 189, name: "-" },
  Period: { code: 190, name: "." },
  Slash: { code: 191, name: "/" },
  QuestionMark: { code: 191, name: "?" },
  Apostrophe: backquoteKey,
  Tilde: { code: 192, name: "Tilde" },
  Backquote: backquoteKey,
  IntlBackslash: backquoteKey,
  LeftSquareBracket: { code: 219, name: "[" },
  RightSquareBracket: { code: 221, name: "]" },
  Backslash: { code: 220, name: "\\" },
  SingleQuote: quoteKey,
  Quote: quoteKey,
  // "default" command/ctrl key for platform, Command on Mac, Ctrl on other platforms
  CtrlOrMeta: Host.Platform.isMac() ? metaKey : ctrlKey
};
export var Type = /* @__PURE__ */ ((Type2) => {
  Type2["USER_SHORTCUT"] = "UserShortcut";
  Type2["DEFAULT_SHORTCUT"] = "DefaultShortcut";
  Type2["DISABLED_DEFAULT"] = "DisabledDefault";
  Type2["UNSET_SHORTCUT"] = "UnsetShortcut";
  Type2["KEYBIND_SET_SHORTCUT"] = "KeybindSetShortcut";
  return Type2;
})(Type || {});
export const KeyBindings = {};
(function() {
  for (const key in Keys) {
    const descriptor = Keys[key];
    if (typeof descriptor === "object" && descriptor["code"]) {
      const name = typeof descriptor["name"] === "string" ? descriptor["name"] : key;
      KeyBindings[name] = descriptor;
    }
  }
})();
//# sourceMappingURL=KeyboardShortcut.js.map
