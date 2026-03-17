"use strict";
import * as Common from "../../core/common/common.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as ColorPicker from "../../ui/legacy/components/color_picker/color_picker.js";
import * as InlineEditor from "../../ui/legacy/components/inline_editor/inline_editor.js";
import * as UI from "../../ui/legacy/legacy.js";
const UIStrings = {
  /**
   * @description Tooltip text for an icon that opens the cubic bezier editor, which is a tool that
   * allows the user to edit cubic-bezier CSS properties directly.
   */
  openCubicBezierEditor: "Open cubic bezier editor",
  /**
   * @description Tooltip text for an icon that opens shadow editor. The shadow editor is a tool
   * which allows the user to edit CSS shadow properties.
   */
  openShadowEditor: "Open shadow editor"
};
const str_ = i18n.i18n.registerUIStrings("panels/elements/ColorSwatchPopoverIcon.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class BezierPopoverIcon {
  treeElement;
  swatchPopoverHelper;
  swatch;
  bezierText;
  boundBezierChanged;
  boundOnScroll;
  bezierEditor;
  scrollerElement;
  originalPropertyText;
  constructor({
    treeElement,
    swatchPopoverHelper,
    swatch,
    bezierText
  }) {
    this.treeElement = treeElement;
    this.swatchPopoverHelper = swatchPopoverHelper;
    this.swatch = swatch;
    this.bezierText = bezierText;
    UI.Tooltip.Tooltip.install(this.swatch, i18nString(UIStrings.openCubicBezierEditor));
    this.swatch.addEventListener("click", this.iconClick.bind(this), false);
    this.swatch.addEventListener("keydown", this.iconClick.bind(this), false);
    this.swatch.addEventListener("mousedown", (event) => event.consume(), false);
    this.boundBezierChanged = this.bezierChanged.bind(this);
    this.boundOnScroll = this.onScroll.bind(this);
  }
  iconClick(event) {
    if (event instanceof KeyboardEvent && !Platform.KeyboardUtilities.isEnterOrSpaceKey(event)) {
      return;
    }
    event.consume(true);
    if (this.swatchPopoverHelper.isShowing()) {
      this.swatchPopoverHelper.hide(true);
      return;
    }
    const model = InlineEditor.AnimationTimingModel.AnimationTimingModel.parse(this.bezierText.innerText) || InlineEditor.AnimationTimingModel.LINEAR_BEZIER;
    this.bezierEditor = new InlineEditor.BezierEditor.BezierEditor(model);
    this.bezierEditor.addEventListener(InlineEditor.BezierEditor.Events.BEZIER_CHANGED, this.boundBezierChanged);
    this.swatchPopoverHelper.show(this.bezierEditor, this.swatch, this.onPopoverHidden.bind(this));
    this.scrollerElement = this.swatch.enclosingNodeOrSelfWithClass("style-panes-wrapper");
    if (this.scrollerElement) {
      this.scrollerElement.addEventListener("scroll", this.boundOnScroll, false);
    }
    this.originalPropertyText = this.treeElement.property.propertyText;
    this.treeElement.stylesContainer().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
      this.treeElement.property,
      false
      /* forName */
    );
    if (uiLocation) {
      void Common.Revealer.reveal(
        uiLocation,
        true
        /* omitFocus */
      );
    }
  }
  bezierChanged(event) {
    this.bezierText.textContent = event.data;
    void this.treeElement.applyStyleText(this.treeElement.renderedPropertyText(), false);
  }
  onScroll(_event) {
    this.swatchPopoverHelper.hide(true);
  }
  onPopoverHidden(commitEdit) {
    if (this.scrollerElement) {
      this.scrollerElement.removeEventListener("scroll", this.boundOnScroll, false);
    }
    if (this.bezierEditor) {
      this.bezierEditor.removeEventListener(InlineEditor.BezierEditor.Events.BEZIER_CHANGED, this.boundBezierChanged);
    }
    this.bezierEditor = void 0;
    const propertyText = commitEdit ? this.treeElement.renderedPropertyText() : this.originalPropertyText || "";
    void this.treeElement.applyStyleText(propertyText, true);
    this.treeElement.stylesContainer().setEditingStyle(false);
    delete this.originalPropertyText;
  }
}
export var ColorSwatchPopoverIconEvents = /* @__PURE__ */ ((ColorSwatchPopoverIconEvents2) => {
  ColorSwatchPopoverIconEvents2["COLOR_CHANGED"] = "colorchanged";
  return ColorSwatchPopoverIconEvents2;
})(ColorSwatchPopoverIconEvents || {});
export class ColorSwatchPopoverIcon extends Common.ObjectWrapper.ObjectWrapper {
  treeElement;
  swatchPopoverHelper;
  swatch;
  contrastInfo;
  boundSpectrumChanged;
  boundOnScroll;
  spectrum;
  scrollerElement;
  originalPropertyText;
  constructor(treeElement, swatchPopoverHelper, swatch) {
    super();
    this.treeElement = treeElement;
    this.swatchPopoverHelper = swatchPopoverHelper;
    this.swatch = swatch;
    this.swatch.addEventListener(InlineEditor.ColorSwatch.ClickEvent.eventName, this.iconClick.bind(this));
    this.contrastInfo = null;
    this.boundSpectrumChanged = this.spectrumChanged.bind(this);
    this.boundOnScroll = this.onScroll.bind(this);
  }
  generateCSSVariablesPalette() {
    const matchedStyles = this.treeElement.matchedStyles();
    const style = this.treeElement.property.ownerStyle;
    const cssVariables = matchedStyles.availableCSSVariables(style);
    const colors = [];
    const colorNames = [];
    for (const cssVariable of cssVariables) {
      if (cssVariable === this.treeElement.property.name) {
        continue;
      }
      const value = matchedStyles.computeCSSVariable(style, cssVariable);
      if (!value) {
        continue;
      }
      const color = Common.Color.parse(value.value);
      if (!color) {
        continue;
      }
      colors.push(value.value);
      colorNames.push(cssVariable);
    }
    return { title: "CSS Variables", mutable: false, matchUserFormat: true, colors, colorNames };
  }
  setContrastInfo(contrastInfo) {
    this.contrastInfo = contrastInfo;
  }
  iconClick(event) {
    event.consume(true);
    this.showPopover();
  }
  async toggleEyeDropper() {
    await this.spectrum?.toggleColorPicker();
  }
  showPopover() {
    if (this.swatchPopoverHelper.isShowing()) {
      this.swatchPopoverHelper.hide(true);
      return;
    }
    const color = this.swatch.color;
    if (!color) {
      return;
    }
    this.spectrum = new ColorPicker.Spectrum.Spectrum(this.contrastInfo);
    this.spectrum.setColor(color);
    this.spectrum.addPalette(this.generateCSSVariablesPalette());
    this.spectrum.addEventListener(ColorPicker.Spectrum.Events.SIZE_CHANGED, this.spectrumResized, this);
    this.spectrum.addEventListener(ColorPicker.Spectrum.Events.COLOR_CHANGED, this.boundSpectrumChanged);
    this.swatchPopoverHelper.show(this.spectrum, this.swatch, this.onPopoverHidden.bind(this));
    this.scrollerElement = this.swatch.enclosingNodeOrSelfWithClass("style-panes-wrapper");
    if (this.scrollerElement) {
      this.scrollerElement.addEventListener("scroll", this.boundOnScroll, false);
    }
    this.originalPropertyText = this.treeElement.property.propertyText;
    this.treeElement.stylesContainer().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
      this.treeElement.property,
      false
      /* forName */
    );
    if (uiLocation) {
      void Common.Revealer.reveal(
        uiLocation,
        true
        /* omitFocus */
      );
    }
    UI.Context.Context.instance().setFlavor(ColorSwatchPopoverIcon, this);
  }
  spectrumResized() {
    this.swatchPopoverHelper.reposition();
  }
  async spectrumChanged(event) {
    const getColor = (colorText) => {
      const color2 = Common.Color.parse(colorText);
      const customProperty = this.spectrum?.colorName()?.startsWith("--") && `var(${this.spectrum.colorName()})`;
      if (!color2 || !customProperty) {
        return color2;
      }
      if (color2.is(Common.Color.Format.HEX) || color2.is(Common.Color.Format.HEXA) || color2.is(Common.Color.Format.RGB) || color2.is(Common.Color.Format.RGBA)) {
        return new Common.Color.Legacy(color2.rgba(), color2.format(), customProperty);
      }
      if (color2.is(Common.Color.Format.HSL)) {
        return new Common.Color.HSL(color2.h, color2.s, color2.l, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.HWB)) {
        return new Common.Color.HWB(color2.h, color2.w, color2.b, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.LCH)) {
        return new Common.Color.LCH(color2.l, color2.c, color2.h, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.OKLCH)) {
        return new Common.Color.Oklch(color2.l, color2.c, color2.h, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.LAB)) {
        return new Common.Color.Lab(color2.l, color2.a, color2.b, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.OKLAB)) {
        return new Common.Color.Oklab(color2.l, color2.a, color2.b, color2.alpha, customProperty);
      }
      if (color2.is(Common.Color.Format.SRGB) || color2.is(Common.Color.Format.SRGB_LINEAR) || color2.is(Common.Color.Format.DISPLAY_P3) || color2.is(Common.Color.Format.A98_RGB) || color2.is(Common.Color.Format.PROPHOTO_RGB) || color2.is(Common.Color.Format.REC_2020) || color2.is(Common.Color.Format.XYZ) || color2.is(Common.Color.Format.XYZ_D50) || color2.is(Common.Color.Format.XYZ_D65)) {
        return new Common.Color.ColorFunction(
          color2.colorSpace,
          color2.p0,
          color2.p1,
          color2.p2,
          color2.alpha,
          customProperty
        );
      }
      throw new Error(`Forgot to handle color format ${color2.format()}`);
    };
    const color = getColor(event.data);
    if (!color) {
      return;
    }
    this.swatch.renderColor(color);
    this.dispatchEventToListeners("colorchanged" /* COLOR_CHANGED */, color);
  }
  onScroll(_event) {
    this.swatchPopoverHelper.hide(true);
  }
  onPopoverHidden(commitEdit) {
    if (this.scrollerElement) {
      this.scrollerElement.removeEventListener("scroll", this.boundOnScroll, false);
    }
    if (this.spectrum) {
      this.spectrum.removeEventListener(ColorPicker.Spectrum.Events.COLOR_CHANGED, this.boundSpectrumChanged);
    }
    this.spectrum = void 0;
    const propertyText = commitEdit ? this.treeElement.renderedPropertyText() : this.originalPropertyText || "";
    void this.treeElement.applyStyleText(propertyText, true);
    this.treeElement.stylesContainer().setEditingStyle(false);
    delete this.originalPropertyText;
    UI.Context.Context.instance().setFlavor(ColorSwatchPopoverIcon, null);
  }
}
export var ShadowEvents = /* @__PURE__ */ ((ShadowEvents2) => {
  ShadowEvents2["SHADOW_CHANGED"] = "shadowChanged";
  return ShadowEvents2;
})(ShadowEvents || {});
export class ShadowSwatchPopoverHelper extends Common.ObjectWrapper.ObjectWrapper {
  treeElement;
  swatchPopoverHelper;
  shadowSwatch;
  iconElement;
  boundShadowChanged;
  boundOnScroll;
  cssShadowEditor;
  scrollerElement;
  originalPropertyText;
  constructor(treeElement, swatchPopoverHelper, shadowSwatch) {
    super();
    this.treeElement = treeElement;
    this.swatchPopoverHelper = swatchPopoverHelper;
    this.shadowSwatch = shadowSwatch;
    this.iconElement = shadowSwatch.iconElement();
    UI.Tooltip.Tooltip.install(this.iconElement, i18nString(UIStrings.openShadowEditor));
    this.iconElement.addEventListener("click", this.iconClick.bind(this), false);
    this.iconElement.addEventListener("keydown", this.keyDown.bind(this), false);
    this.iconElement.addEventListener("mousedown", (event) => event.consume(), false);
    this.boundShadowChanged = this.shadowChanged.bind(this);
    this.boundOnScroll = this.onScroll.bind(this);
  }
  keyDown(event) {
    if (Platform.KeyboardUtilities.isEnterOrSpaceKey(event)) {
      event.consume(true);
      this.showPopover();
    }
  }
  iconClick(event) {
    event.consume(true);
    this.showPopover();
  }
  showPopover() {
    if (this.swatchPopoverHelper.isShowing()) {
      this.swatchPopoverHelper.hide(true);
      return;
    }
    this.cssShadowEditor = new InlineEditor.CSSShadowEditor.CSSShadowEditor();
    this.cssShadowEditor.element.classList.toggle("with-padding", true);
    this.cssShadowEditor.setModel(this.shadowSwatch.model());
    this.cssShadowEditor.addEventListener(InlineEditor.CSSShadowEditor.Events.SHADOW_CHANGED, this.boundShadowChanged);
    this.swatchPopoverHelper.show(this.cssShadowEditor, this.iconElement, this.onPopoverHidden.bind(this));
    this.scrollerElement = this.iconElement.enclosingNodeOrSelfWithClass("style-panes-wrapper");
    if (this.scrollerElement) {
      this.scrollerElement.addEventListener("scroll", this.boundOnScroll, false);
    }
    this.originalPropertyText = this.treeElement.property.propertyText;
    this.treeElement.stylesContainer().setEditingStyle(true);
    const uiLocation = Bindings.CSSWorkspaceBinding.CSSWorkspaceBinding.instance().propertyUILocation(
      this.treeElement.property,
      false
      /* forName */
    );
    if (uiLocation) {
      void Common.Revealer.reveal(
        uiLocation,
        true
        /* omitFocus */
      );
    }
  }
  shadowChanged(event) {
    this.dispatchEventToListeners("shadowChanged" /* SHADOW_CHANGED */, event.data);
  }
  onScroll(_event) {
    this.swatchPopoverHelper.hide(true);
  }
  onPopoverHidden(commitEdit) {
    if (this.scrollerElement) {
      this.scrollerElement.removeEventListener("scroll", this.boundOnScroll, false);
    }
    if (this.cssShadowEditor) {
      this.cssShadowEditor.removeEventListener(
        InlineEditor.CSSShadowEditor.Events.SHADOW_CHANGED,
        this.boundShadowChanged
      );
    }
    this.cssShadowEditor = void 0;
    const propertyText = commitEdit ? this.treeElement.renderedPropertyText() : this.originalPropertyText || "";
    void this.treeElement.applyStyleText(propertyText, true);
    this.treeElement.stylesContainer().setEditingStyle(false);
    delete this.originalPropertyText;
  }
}
export class FontEditorSectionManager {
  treeElementMap;
  swatchPopoverHelper;
  section;
  stylesContainer;
  fontEditor;
  scrollerElement;
  boundFontChanged;
  boundOnScroll;
  boundResized;
  constructor(swatchPopoverHelper, section) {
    this.treeElementMap = /* @__PURE__ */ new Map();
    this.swatchPopoverHelper = swatchPopoverHelper;
    this.section = section;
    this.stylesContainer = null;
    this.fontEditor = null;
    this.scrollerElement = null;
    this.boundFontChanged = this.fontChanged.bind(this);
    this.boundOnScroll = this.onScroll.bind(this);
    this.boundResized = this.fontEditorResized.bind(this);
  }
  fontChanged(event) {
    const { propertyName, value } = event.data;
    const treeElement = this.treeElementMap.get(propertyName);
    void this.updateFontProperty(propertyName, value, treeElement);
  }
  async updateFontProperty(propertyName, value, treeElement) {
    if (treeElement?.treeOutline && treeElement.valueElement && treeElement.property.parsedOk && treeElement.property.range) {
      let elementRemoved = false;
      treeElement.valueElement.textContent = value;
      treeElement.property.value = value;
      let styleText;
      const propertyName2 = treeElement.property.name;
      if (value.length) {
        styleText = treeElement.renderedPropertyText();
      } else {
        styleText = "";
        elementRemoved = true;
        this.fixIndex(treeElement.property.index);
      }
      this.treeElementMap.set(propertyName2, treeElement);
      await treeElement.applyStyleText(styleText, true);
      if (elementRemoved) {
        this.treeElementMap.delete(propertyName2);
      }
    } else if (value.length) {
      const newProperty = this.section.addNewBlankProperty();
      if (newProperty) {
        newProperty.property.name = propertyName;
        newProperty.property.value = value;
        newProperty.updateTitle();
        await newProperty.applyStyleText(newProperty.renderedPropertyText(), true);
        this.treeElementMap.set(newProperty.property.name, newProperty);
      }
    }
    this.section.onpopulate();
    this.swatchPopoverHelper.reposition();
    return;
  }
  fontEditorResized() {
    this.swatchPopoverHelper.reposition();
  }
  fixIndex(removedIndex) {
    for (const treeElement of this.treeElementMap.values()) {
      if (treeElement.property.index > removedIndex) {
        treeElement.property.index -= 1;
      }
    }
  }
  createPropertyValueMap() {
    const propertyMap = /* @__PURE__ */ new Map();
    for (const fontProperty of this.treeElementMap) {
      const propertyName = fontProperty[0];
      const treeElement = fontProperty[1];
      if (treeElement.property.value.length) {
        propertyMap.set(propertyName, treeElement.property.value);
      } else {
        this.treeElementMap.delete(propertyName);
      }
    }
    return propertyMap;
  }
  registerFontProperty(treeElement) {
    const propertyName = treeElement.property.name;
    if (this.treeElementMap.has(propertyName)) {
      const treeElementFromMap = this.treeElementMap.get(propertyName);
      if (!treeElement.overloaded() || treeElementFromMap?.overloaded()) {
        this.treeElementMap.set(propertyName, treeElement);
      }
    } else {
      this.treeElementMap.set(propertyName, treeElement);
    }
  }
  async showPopover(iconElement, stylesContainer) {
    if (this.swatchPopoverHelper.isShowing()) {
      this.swatchPopoverHelper.hide(true);
      return;
    }
    this.stylesContainer = stylesContainer;
    const propertyValueMap = this.createPropertyValueMap();
    this.fontEditor = new InlineEditor.FontEditor.FontEditor(propertyValueMap);
    this.fontEditor.addEventListener(InlineEditor.FontEditor.Events.FONT_CHANGED, this.boundFontChanged);
    this.fontEditor.addEventListener(InlineEditor.FontEditor.Events.FONT_EDITOR_RESIZED, this.boundResized);
    this.swatchPopoverHelper.show(this.fontEditor, iconElement, this.onPopoverHidden.bind(this));
    this.scrollerElement = iconElement.enclosingNodeOrSelfWithClass("style-panes-wrapper");
    if (this.scrollerElement) {
      this.scrollerElement.addEventListener("scroll", this.boundOnScroll, false);
    }
    this.stylesContainer.setEditingStyle(true);
  }
  onScroll() {
    this.swatchPopoverHelper.hide(true);
  }
  onPopoverHidden() {
    if (this.scrollerElement) {
      this.scrollerElement.removeEventListener("scroll", this.boundOnScroll, false);
    }
    this.section.onpopulate();
    if (this.fontEditor) {
      this.fontEditor.removeEventListener(InlineEditor.FontEditor.Events.FONT_CHANGED, this.boundFontChanged);
    }
    this.fontEditor = null;
    if (this.stylesContainer) {
      this.stylesContainer.setEditingStyle(false);
    }
    this.section.resetToolbars();
    this.section.onpopulate();
  }
}
//# sourceMappingURL=ColorSwatchPopoverIcon.js.map
