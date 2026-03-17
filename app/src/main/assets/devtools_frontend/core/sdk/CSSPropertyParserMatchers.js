"use strict";
import * as Common from "../../core/common/common.js";
import {
  CSSMetadata,
  cssMetadata,
  CubicBezierKeywordValues
} from "./CSSMetadata.js";
import {
  ASTUtils,
  matchDeclaration,
  matcherBase,
  tokenizeDeclaration
} from "./CSSPropertyParser.js";
export class BaseVariableMatch {
  constructor(text, node, name, fallback, matching, computedTextCallback) {
    this.text = text;
    this.node = node;
    this.name = name;
    this.fallback = fallback;
    this.matching = matching;
    this.computedTextCallback = computedTextCallback;
  }
  computedText() {
    return this.computedTextCallback(this, this.matching);
  }
  fallbackValue() {
    if (!this.fallback) {
      return null;
    }
    if (this.fallback.length === 0) {
      return "";
    }
    if (this.matching.hasUnresolvedSubstitutionsRange(this.fallback[0], this.fallback[this.fallback.length - 1])) {
      return null;
    }
    return this.matching.getComputedTextRange(this.fallback[0], this.fallback[this.fallback.length - 1]);
  }
}
export class BaseVariableMatcher extends matcherBase(BaseVariableMatch) {
  // clang-format on
  #computedTextCallback;
  constructor(computedTextCallback) {
    super();
    this.#computedTextCallback = computedTextCallback;
  }
  matches(node, matching) {
    const callee = node.getChild("Callee");
    if (node.name !== "CallExpression" || !callee || matching.ast.text(callee) !== "var") {
      return null;
    }
    const args = ASTUtils.callArgs(node).map((args2) => Array.from(ASTUtils.stripComments(args2)));
    if (args.length < 1 || args[0].length !== 1) {
      return null;
    }
    const nameNode = args[0][0];
    const fallback = args.length === 2 ? args[1] : void 0;
    if (nameNode?.name !== "VariableName") {
      return null;
    }
    const varName = matching.ast.text(nameNode);
    if (!varName.startsWith("--")) {
      return null;
    }
    return new BaseVariableMatch(
      matching.ast.text(node),
      node,
      varName,
      fallback,
      matching,
      this.#computedTextCallback
    );
  }
}
export class VariableMatch extends BaseVariableMatch {
  constructor(text, node, name, fallback, matching, matchedStyles, style) {
    super(text, node, name, fallback, matching, () => this.resolveVariable()?.value ?? this.fallbackValue());
    this.matchedStyles = matchedStyles;
    this.style = style;
  }
  resolveVariable() {
    return this.matchedStyles.computeCSSVariable(this.style, this.name);
  }
}
export class VariableMatcher extends matcherBase(VariableMatch) {
  // clang-format on
  constructor(matchedStyles, style) {
    super();
    this.matchedStyles = matchedStyles;
    this.style = style;
  }
  matches(node, matching) {
    const match = new BaseVariableMatcher(() => null).matches(node, matching);
    return match ? new VariableMatch(
      match.text,
      match.node,
      match.name,
      match.fallback,
      match.matching,
      this.matchedStyles,
      this.style
    ) : null;
  }
}
export class AttributeMatch extends BaseVariableMatch {
  constructor(text, node, name, fallback, matching, type, isCSSTokens, isValidType, rawValue, substitutionText, matchedStyles, style, computedTextCallback) {
    super(text, node, name, fallback, matching, (_, matching2) => computedTextCallback(this, matching2));
    this.type = type;
    this.isCSSTokens = isCSSTokens;
    this.isValidType = isValidType;
    this.rawValue = rawValue;
    this.substitutionText = substitutionText;
    this.matchedStyles = matchedStyles;
    this.style = style;
  }
  rawAttributeValue() {
    return this.rawValue;
  }
  cssType() {
    return this.type ?? RAW_STRING_TYPE;
  }
  resolveAttributeValue() {
    return this.matchedStyles.computeAttribute(
      this.style,
      this.name,
      { type: this.cssType(), isCSSTokens: this.isCSSTokens }
    );
  }
}
let cssEvaluationElement = null;
function getCssEvaluationElement() {
  const id = "css-evaluation-element";
  if (!cssEvaluationElement) {
    cssEvaluationElement = document.getElementById(id);
    if (!cssEvaluationElement) {
      cssEvaluationElement = document.createElement("div");
      cssEvaluationElement.setAttribute("id", id);
      cssEvaluationElement.setAttribute("style", "hidden: true; --evaluation: attr(data-custom-expr type(*))");
      document.body.appendChild(cssEvaluationElement);
    }
  }
  return cssEvaluationElement;
}
export function localEvalCSS(value, type) {
  const element = getCssEvaluationElement();
  element.setAttribute("data-value", value);
  element.setAttribute("data-custom-expr", `attr(data-value ${type})`);
  return element.computedStyleMap().get("--evaluation")?.toString() ?? null;
}
export function isValidCSSType(type) {
  const element = getCssEvaluationElement();
  element.setAttribute("data-custom-expr", `attr(data-nonexistent ${type}, "good")`);
  return '"good"' === (element.computedStyleMap().get("--evaluation")?.toString() ?? null);
}
export function defaultValueForCSSType(type) {
  const element = getCssEvaluationElement();
  element.setAttribute("data-custom-expr", `attr(data-nonexistent ${type ?? ""})`);
  return element.computedStyleMap().get("--evaluation")?.toString() ?? null;
}
export const RAW_STRING_TYPE = "raw-string";
export class AttributeMatcher extends matcherBase(AttributeMatch) {
  // clang-format on
  constructor(matchedStyles, style, computedTextCallback) {
    super();
    this.matchedStyles = matchedStyles;
    this.style = style;
    this.computedTextCallback = computedTextCallback;
  }
  matches(node, matching) {
    const callee = node.getChild("Callee");
    if (node.name !== "CallExpression" || !callee || matching.ast.text(callee) !== "attr") {
      return null;
    }
    const args = ASTUtils.callArgs(node).map((args2) => Array.from(ASTUtils.stripComments(args2)));
    if (args.length < 1) {
      return null;
    }
    const nameNode = args[0][0];
    if (args[0].length < 1 || args[0].length > 2 || nameNode?.name !== "ValueName") {
      return null;
    }
    const fallback = args.length === 2 ? args[1] : void 0;
    let type = null;
    let isCSSTokens = false;
    if (args[0].length === 2) {
      const typeNode = args[0][1];
      type = matching.ast.text(typeNode);
      if (typeNode.name === "CallExpression") {
        if (matching.ast.text(typeNode.getChild("Callee")) !== "type") {
          return null;
        }
        isCSSTokens = true;
      } else if (typeNode.name !== "ValueName" && type !== "%") {
        return null;
      }
    }
    const isValidType = type === null || isValidCSSType(type);
    isCSSTokens = isCSSTokens && isValidType;
    const attrName = matching.ast.text(nameNode);
    const rawValue = this.matchedStyles.rawAttributeValueFromStyle(this.style, attrName);
    let substitutionText = null;
    if (rawValue !== null) {
      substitutionText = isCSSTokens ? rawValue : localEvalCSS(rawValue, type ?? RAW_STRING_TYPE);
    } else if (!fallback) {
      substitutionText = defaultValueForCSSType(type);
    }
    return new AttributeMatch(
      matching.ast.text(node),
      node,
      attrName,
      fallback,
      matching,
      type,
      isCSSTokens,
      isValidType,
      rawValue,
      substitutionText,
      this.matchedStyles,
      this.style,
      this.computedTextCallback ?? defaultComputeText
    );
    function defaultComputeText(match, _matching) {
      return match.resolveAttributeValue() ?? (isValidType ? match.fallbackValue() : defaultValueForCSSType(match.type));
    }
  }
}
export class BinOpMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
}
export class BinOpMatcher extends matcherBase(BinOpMatch) {
  // clang-format on
  accepts() {
    return true;
  }
  matches(node, matching) {
    return node.name === "BinaryExpression" ? new BinOpMatch(matching.ast.text(node), node) : null;
  }
}
export class TextMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
    if (node.name === "Comment") {
      this.computedText = () => "";
    }
  }
  computedText;
  render() {
    const span = document.createElement("span");
    span.appendChild(document.createTextNode(this.text));
    return [span];
  }
}
export class TextMatcher extends matcherBase(TextMatch) {
  // clang-format on
  accepts() {
    return true;
  }
  matches(node, matching) {
    if (!node.firstChild || node.name === "NumberLiteral") {
      const text = matching.ast.text(node);
      if (text.length) {
        return new TextMatch(text, node);
      }
    }
    return null;
  }
}
export class AngleMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
  computedText() {
    return this.text;
  }
}
export class AngleMatcher extends matcherBase(AngleMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isAngleAwareProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "NumberLiteral") {
      return null;
    }
    const unit = node.getChild("Unit");
    if (!unit || !["deg", "grad", "rad", "turn"].includes(matching.ast.text(unit))) {
      return null;
    }
    return new AngleMatch(matching.ast.text(node), node);
  }
}
function literalToNumber(node, ast) {
  if (node.type.name !== "NumberLiteral") {
    return null;
  }
  const text = ast.text(node);
  return Number(text.substring(0, text.length - ast.text(node.getChild("Unit")).length));
}
export class ColorMixMatch {
  constructor(text, node, space, color1, color2) {
    this.text = text;
    this.node = node;
    this.space = space;
    this.color1 = color1;
    this.color2 = color2;
  }
}
export class ColorMixMatcher extends matcherBase(ColorMixMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isColorAwareProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "CallExpression" || matching.ast.text(node.getChild("Callee")) !== "color-mix") {
      return null;
    }
    const computedValueTree = tokenizeDeclaration("--property", matching.getComputedText(node));
    if (!computedValueTree) {
      return null;
    }
    const value = ASTUtils.declValue(computedValueTree.tree);
    if (!value) {
      return null;
    }
    const computedValueArgs = ASTUtils.callArgs(value);
    if (computedValueArgs.length !== 3) {
      return null;
    }
    const [space, color1, color2] = computedValueArgs;
    if (space.length < 2 || computedValueTree.text(ASTUtils.stripComments(space).next().value) !== "in" || color1.length < 1 || color2.length < 1) {
      return null;
    }
    const p1 = color1.filter((n) => n.type.name === "NumberLiteral" && computedValueTree.text(n.getChild("Unit")) === "%");
    const p2 = color2.filter((n) => n.type.name === "NumberLiteral" && computedValueTree.text(n.getChild("Unit")) === "%");
    if (p1.length > 1 || p2.length > 1) {
      return null;
    }
    if (p1[0] && p2[0] && (literalToNumber(p1[0], computedValueTree) ?? 0) === 0 && (literalToNumber(p2[0], computedValueTree) ?? 0) === 0) {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.length !== 3) {
      return null;
    }
    return new ColorMixMatch(matching.ast.text(node), node, args[0], args[1], args[2]);
  }
}
export class ContrastColorMatch {
  constructor(text, node, color) {
    this.text = text;
    this.node = node;
    this.color = color;
  }
}
export class ContrastColorMatcher extends matcherBase(ContrastColorMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isColorAwareProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "CallExpression" || matching.ast.text(node.getChild("Callee")) !== "contrast-color") {
      return null;
    }
    if (matching.getComputedText(node) === "") {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.length !== 1) {
      return null;
    }
    return new ContrastColorMatch(matching.ast.text(node), node, args[0]);
  }
}
export class URLMatch {
  constructor(url, text, node) {
    this.url = url;
    this.text = text;
    this.node = node;
  }
}
export class URLMatcher extends matcherBase(URLMatch) {
  // clang-format on
  matches(node, matching) {
    if (node.name !== "CallLiteral") {
      return null;
    }
    const callee = node.getChild("CallTag");
    if (!callee || matching.ast.text(callee) !== "url") {
      return null;
    }
    const [, lparenNode, urlNode, rparenNode] = ASTUtils.siblings(callee);
    if (matching.ast.text(lparenNode) !== "(" || urlNode.name !== "ParenthesizedContent" && urlNode.name !== "StringLiteral" || matching.ast.text(rparenNode) !== ")") {
      return null;
    }
    const text = matching.ast.text(urlNode);
    const url = urlNode.name === "StringLiteral" ? text.substr(1, text.length - 2) : text.trim();
    return new URLMatch(url, matching.ast.text(node), node);
  }
}
export class LinearGradientMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
}
export class LinearGradientMatcher extends matcherBase(LinearGradientMatch) {
  // clang-format on
  matches(node, matching) {
    const text = matching.ast.text(node);
    if (node.name === "CallExpression" && matching.ast.text(node.getChild("Callee")) === "linear-gradient") {
      return new LinearGradientMatch(text, node);
    }
    return null;
  }
  accepts(propertyName) {
    return ["background", "background-image", "-webkit-mask-image"].includes(propertyName);
  }
}
export class ColorMatch {
  constructor(text, node, currentColorCallback, relativeColor) {
    this.text = text;
    this.node = node;
    this.currentColorCallback = currentColorCallback;
    this.relativeColor = relativeColor;
    this.computedText = currentColorCallback;
  }
  computedText;
}
export class ColorMatcher extends matcherBase(ColorMatch) {
  constructor(currentColorCallback) {
    super();
    this.currentColorCallback = currentColorCallback;
  }
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isColorAwareProperty(propertyName);
  }
  matches(node, matching) {
    const text = matching.ast.text(node);
    if (node.name === "ColorLiteral") {
      return new ColorMatch(text, node);
    }
    if (node.name === "ValueName") {
      if (Common.Color.Nicknames.has(text)) {
        return new ColorMatch(text, node);
      }
      if (text.toLowerCase() === "currentcolor" && this.currentColorCallback) {
        const callback = this.currentColorCallback;
        return new ColorMatch(text, node, () => callback() ?? text);
      }
    }
    if (node.name === "CallExpression") {
      const callee = node.getChild("Callee");
      const colorFunc = matching.ast.text(callee).toLowerCase();
      if (callee && colorFunc.match(/^(rgba?|hsla?|hwba?|lab|lch|oklab|oklch|color)$/)) {
        const args = ASTUtils.children(node.getChild("ArgList"));
        const colorText = args.length >= 2 ? matching.getComputedTextRange(args[0], args[args.length - 1]) : "";
        const isRelativeColorSyntax = Boolean(
          colorText.match(/^[^)]*\(\W*from\W+/) && !matching.hasUnresolvedSubstitutions(node) && CSS.supports("color", colorFunc + colorText)
        );
        if (!isRelativeColorSyntax) {
          return new ColorMatch(text, node);
        }
        const tokenized = matchDeclaration("--color", "--colorFunc" + colorText, [new ColorMatcher()]);
        if (!tokenized) {
          return null;
        }
        const [colorArgs] = ASTUtils.callArgs(ASTUtils.declValue(tokenized.ast.tree));
        if (colorArgs.length !== (colorFunc === "color" ? 6 : 5)) {
          return null;
        }
        const colorSpace = Common.Color.getFormat(colorFunc !== "color" ? colorFunc : matching.ast.text(colorArgs[2]));
        if (!colorSpace) {
          return null;
        }
        const baseColor = tokenized.getMatch(colorArgs[1]);
        if (tokenized.ast.text(colorArgs[0]) !== "from" || !(baseColor instanceof ColorMatch)) {
          return null;
        }
        return new ColorMatch(text, node, void 0, { colorSpace, baseColor });
      }
    }
    return null;
  }
}
function isRelativeColorChannelName(channel) {
  const maybeChannel = channel;
  switch (maybeChannel) {
    case Common.Color.ColorChannel.A:
    case Common.Color.ColorChannel.ALPHA:
    case Common.Color.ColorChannel.B:
    case Common.Color.ColorChannel.C:
    case Common.Color.ColorChannel.G:
    case Common.Color.ColorChannel.H:
    case Common.Color.ColorChannel.L:
    case Common.Color.ColorChannel.R:
    case Common.Color.ColorChannel.S:
    case Common.Color.ColorChannel.W:
    case Common.Color.ColorChannel.X:
    case Common.Color.ColorChannel.Y:
    case Common.Color.ColorChannel.Z:
      return true;
  }
  const catchFallback = maybeChannel;
  return false;
}
export class RelativeColorChannelMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
  getColorChannelValue(relativeColor) {
    const color = Common.Color.parse(relativeColor.baseColor.text)?.as(relativeColor.colorSpace);
    if (color instanceof Common.Color.ColorFunction) {
      switch (this.text) {
        case Common.Color.ColorChannel.R:
          return color.isXYZ() ? null : color.p0;
        case Common.Color.ColorChannel.G:
          return color.isXYZ() ? null : color.p1;
        case Common.Color.ColorChannel.B:
          return color.isXYZ() ? null : color.p2;
        case Common.Color.ColorChannel.X:
          return color.isXYZ() ? color.p0 : null;
        case Common.Color.ColorChannel.Y:
          return color.isXYZ() ? color.p1 : null;
        case Common.Color.ColorChannel.Z:
          return color.isXYZ() ? color.p2 : null;
        case Common.Color.ColorChannel.ALPHA:
          return color.alpha;
      }
    } else if (color instanceof Common.Color.Legacy) {
      switch (this.text) {
        case Common.Color.ColorChannel.R:
          return color.rgba()[0];
        case Common.Color.ColorChannel.G:
          return color.rgba()[1];
        case Common.Color.ColorChannel.B:
          return color.rgba()[2];
        case Common.Color.ColorChannel.ALPHA:
          return color.rgba()[3];
      }
    } else if (color && this.text in color) {
      return color[this.text];
    }
    return null;
  }
  computedText() {
    return this.text;
  }
}
export class RelativeColorChannelMatcher extends matcherBase(RelativeColorChannelMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isColorAwareProperty(propertyName);
  }
  matches(node, matching) {
    const text = matching.ast.text(node);
    if (node.name === "ValueName" && isRelativeColorChannelName(text)) {
      return new RelativeColorChannelMatch(text, node);
    }
    return null;
  }
}
export class LightDarkColorMatch {
  constructor(text, node, light, dark, style) {
    this.text = text;
    this.node = node;
    this.light = light;
    this.dark = dark;
    this.style = style;
  }
}
export class LightDarkColorMatcher extends matcherBase(LightDarkColorMatch) {
  // clang-format on
  constructor(style) {
    super();
    this.style = style;
  }
  accepts(propertyName) {
    return cssMetadata().isColorAwareProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "CallExpression" || matching.ast.text(node.getChild("Callee")) !== "light-dark") {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.length !== 2 || args[0].length === 0 || args[1].length === 0) {
      return null;
    }
    return new LightDarkColorMatch(matching.ast.text(node), node, args[0], args[1], this.style);
  }
}
export class AutoBaseMatch {
  constructor(text, node, auto, base) {
    this.text = text;
    this.node = node;
    this.auto = auto;
    this.base = base;
  }
}
export class AutoBaseMatcher extends matcherBase(AutoBaseMatch) {
  // clang-format on
  matches(node, matching) {
    if (node.name !== "CallExpression" || matching.ast.text(node.getChild("Callee")) !== "-internal-auto-base") {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.length !== 2 || args[0].length === 0 || args[1].length === 0) {
      return null;
    }
    return new AutoBaseMatch(matching.ast.text(node), node, args[0], args[1]);
  }
}
export var LinkableNameProperties = /* @__PURE__ */ ((LinkableNameProperties2) => {
  LinkableNameProperties2["ANIMATION"] = "animation";
  LinkableNameProperties2["ANIMATION_NAME"] = "animation-name";
  LinkableNameProperties2["FONT_PALETTE"] = "font-palette";
  LinkableNameProperties2["POSITION_TRY_FALLBACKS"] = "position-try-fallbacks";
  LinkableNameProperties2["POSITION_TRY"] = "position-try";
  return LinkableNameProperties2;
})(LinkableNameProperties || {});
var AnimationLonghandPart = /* @__PURE__ */ ((AnimationLonghandPart2) => {
  AnimationLonghandPart2["DIRECTION"] = "direction";
  AnimationLonghandPart2["FILL_MODE"] = "fill-mode";
  AnimationLonghandPart2["PLAY_STATE"] = "play-state";
  AnimationLonghandPart2["ITERATION_COUNT"] = "iteration-count";
  AnimationLonghandPart2["EASING_FUNCTION"] = "easing-function";
  return AnimationLonghandPart2;
})(AnimationLonghandPart || {});
export class LinkableNameMatch {
  constructor(text, node, propertyName) {
    this.text = text;
    this.node = node;
    this.propertyName = propertyName;
  }
}
export class LinkableNameMatcher extends matcherBase(LinkableNameMatch) {
  // clang-format on
  static isLinkableNameProperty(propertyName) {
    const names = [
      "animation" /* ANIMATION */,
      "animation-name" /* ANIMATION_NAME */,
      "font-palette" /* FONT_PALETTE */,
      "position-try-fallbacks" /* POSITION_TRY_FALLBACKS */,
      "position-try" /* POSITION_TRY */
    ];
    return names.includes(propertyName);
  }
  static identifierAnimationLonghandMap = new Map(
    Object.entries({
      normal: "direction" /* DIRECTION */,
      alternate: "direction" /* DIRECTION */,
      reverse: "direction" /* DIRECTION */,
      "alternate-reverse": "direction" /* DIRECTION */,
      none: "fill-mode" /* FILL_MODE */,
      forwards: "fill-mode" /* FILL_MODE */,
      backwards: "fill-mode" /* FILL_MODE */,
      both: "fill-mode" /* FILL_MODE */,
      running: "play-state" /* PLAY_STATE */,
      paused: "play-state" /* PLAY_STATE */,
      infinite: "iteration-count" /* ITERATION_COUNT */,
      linear: "easing-function" /* EASING_FUNCTION */,
      ease: "easing-function" /* EASING_FUNCTION */,
      "ease-in": "easing-function" /* EASING_FUNCTION */,
      "ease-out": "easing-function" /* EASING_FUNCTION */,
      "ease-in-out": "easing-function" /* EASING_FUNCTION */,
      steps: "easing-function" /* EASING_FUNCTION */,
      "step-start": "easing-function" /* EASING_FUNCTION */,
      "step-end": "easing-function" /* EASING_FUNCTION */
    })
  );
  matchAnimationNameInShorthand(node, matching) {
    const text = matching.ast.text(node);
    if (!LinkableNameMatcher.identifierAnimationLonghandMap.has(text)) {
      return new LinkableNameMatch(text, node, "animation" /* ANIMATION */);
    }
    const declarations = ASTUtils.split(ASTUtils.siblings(ASTUtils.declValue(matching.ast.tree)));
    const currentDeclarationNodes = declarations.find(
      (declaration) => declaration[0].from <= node.from && declaration[declaration.length - 1].to >= node.to
    );
    if (!currentDeclarationNodes) {
      return null;
    }
    const computedText = matching.getComputedTextRange(currentDeclarationNodes[0], node);
    const tokenized = tokenizeDeclaration("--p", computedText);
    if (!tokenized) {
      return null;
    }
    const identifierCategory = LinkableNameMatcher.identifierAnimationLonghandMap.get(text);
    for (let itNode = ASTUtils.declValue(tokenized.tree); itNode?.nextSibling; itNode = itNode.nextSibling) {
      if (itNode.name === "ValueName") {
        const categoryValue = LinkableNameMatcher.identifierAnimationLonghandMap.get(tokenized.text(itNode));
        if (categoryValue && categoryValue === identifierCategory) {
          return new LinkableNameMatch(text, node, "animation" /* ANIMATION */);
        }
      }
    }
    return null;
  }
  matches(node, matching) {
    const { propertyName } = matching.ast;
    const text = matching.ast.text(node);
    const parentNode = node.parent;
    if (!parentNode) {
      return null;
    }
    if (!(propertyName && LinkableNameMatcher.isLinkableNameProperty(propertyName))) {
      return null;
    }
    const isParentADeclaration = parentNode.name === "Declaration";
    const isInsideVarCall = parentNode.name === "ArgList" && parentNode.prevSibling?.name === "Callee" && matching.ast.text(parentNode.prevSibling) === "var";
    const isAParentDeclarationOrVarCall = isParentADeclaration || isInsideVarCall;
    const shouldMatchOnlyVariableName = propertyName === "position-try" /* POSITION_TRY */ || propertyName === "position-try-fallbacks" /* POSITION_TRY_FALLBACKS */;
    if (!propertyName || node.name !== "ValueName" && node.name !== "VariableName" || !isAParentDeclarationOrVarCall || node.name === "ValueName" && shouldMatchOnlyVariableName) {
      return null;
    }
    if (propertyName === "animation") {
      return this.matchAnimationNameInShorthand(node, matching);
    }
    return new LinkableNameMatch(text, node, propertyName);
  }
}
export class BezierMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
}
export class BezierMatcher extends matcherBase(BezierMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isBezierAwareProperty(propertyName);
  }
  matches(node, matching) {
    const text = matching.ast.text(node);
    const isCubicBezierKeyword = node.name === "ValueName" && CubicBezierKeywordValues.has(text);
    const isCubicBezierOrLinearFunction = node.name === "CallExpression" && ["cubic-bezier", "linear"].includes(matching.ast.text(node.getChild("Callee")));
    if (!isCubicBezierKeyword && !isCubicBezierOrLinearFunction) {
      return null;
    }
    return new BezierMatch(text, node);
  }
}
export class StringMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
}
export class StringMatcher extends matcherBase(StringMatch) {
  // clang-format on
  matches(node, matching) {
    return node.name === "StringLiteral" ? new StringMatch(matching.ast.text(node), node) : null;
  }
}
export var ShadowType = /* @__PURE__ */ ((ShadowType2) => {
  ShadowType2["BOX_SHADOW"] = "boxShadow";
  ShadowType2["TEXT_SHADOW"] = "textShadow";
  return ShadowType2;
})(ShadowType || {});
export class ShadowMatch {
  constructor(text, node, shadowType) {
    this.text = text;
    this.node = node;
    this.shadowType = shadowType;
  }
}
export class ShadowMatcher extends matcherBase(ShadowMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isShadowProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "Declaration") {
      return null;
    }
    const valueNodes = ASTUtils.siblings(ASTUtils.declValue(node));
    if (valueNodes.length === 0) {
      return null;
    }
    const valueText = matching.ast.textRange(valueNodes[0], valueNodes[valueNodes.length - 1]);
    return new ShadowMatch(
      valueText,
      node,
      matching.ast.propertyName === "text-shadow" ? "textShadow" /* TEXT_SHADOW */ : "boxShadow" /* BOX_SHADOW */
    );
  }
}
export class FontMatch {
  constructor(text, node) {
    this.text = text;
    this.node = node;
  }
}
export class FontMatcher extends matcherBase(FontMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isFontAwareProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "Declaration") {
      return null;
    }
    const valueNodes = ASTUtils.siblings(ASTUtils.declValue(node));
    if (valueNodes.length === 0) {
      return null;
    }
    const validNodes = matching.ast.propertyName === "font-family" ? ["ValueName", "StringLiteral", "Comment", ","] : ["Comment", "ValueName", "NumberLiteral"];
    if (valueNodes.some((node2) => !validNodes.includes(node2.name))) {
      return null;
    }
    const valueText = matching.ast.textRange(valueNodes[0], valueNodes[valueNodes.length - 1]);
    return new FontMatch(valueText, node);
  }
}
export class LengthMatch {
  constructor(text, node, unit) {
    this.text = text;
    this.node = node;
    this.unit = unit;
  }
}
export class LengthMatcher extends matcherBase(LengthMatch) {
  // clang-format on
  static LENGTH_UNITS = /* @__PURE__ */ new Set([
    "em",
    "ex",
    "ch",
    "cap",
    "ic",
    "lh",
    "rem",
    "rex",
    "rch",
    "rlh",
    "ric",
    "rcap",
    "pt",
    "pc",
    "in",
    "cm",
    "mm",
    "Q",
    "vw",
    "vh",
    "vi",
    "vb",
    "vmin",
    "vmax",
    "dvw",
    "dvh",
    "dvi",
    "dvb",
    "dvmin",
    "dvmax",
    "svw",
    "svh",
    "svi",
    "svb",
    "svmin",
    "svmax",
    "lvw",
    "lvh",
    "lvi",
    "lvb",
    "lvmin",
    "lvmax",
    "cqw",
    "cqh",
    "cqi",
    "cqb",
    "cqmin",
    "cqmax",
    "cqem",
    "cqlh",
    "cqex",
    "cqch",
    "%"
  ]);
  matches(node, matching) {
    if (node.name !== "NumberLiteral") {
      return null;
    }
    const unit = matching.ast.text(node.getChild("Unit"));
    if (!LengthMatcher.LENGTH_UNITS.has(unit)) {
      return null;
    }
    const text = matching.ast.text(node);
    return new LengthMatch(text, node, unit);
  }
}
export var SelectFunction = /* @__PURE__ */ ((SelectFunction2) => {
  SelectFunction2["MIN"] = "min";
  SelectFunction2["MAX"] = "max";
  SelectFunction2["CLAMP"] = "clamp";
  return SelectFunction2;
})(SelectFunction || {});
export var ArithmeticFunction = /* @__PURE__ */ ((ArithmeticFunction2) => {
  ArithmeticFunction2["CALC"] = "calc";
  ArithmeticFunction2["SIBLING_COUNT"] = "sibling-count";
  ArithmeticFunction2["SIBLING_INDEX"] = "sibling-index";
  ArithmeticFunction2["ROUND"] = "round";
  ArithmeticFunction2["MOD"] = "mod";
  ArithmeticFunction2["REM"] = "rem";
  return ArithmeticFunction2;
})(ArithmeticFunction || {});
export class BaseFunctionMatch {
  constructor(text, node, func, args) {
    this.text = text;
    this.node = node;
    this.func = func;
    this.args = args;
  }
}
export class MathFunctionMatch extends BaseFunctionMatch {
  isArithmeticFunctionCall() {
    const func = this.func;
    switch (func) {
      case "calc" /* CALC */:
      case "sibling-count" /* SIBLING_COUNT */:
      case "sibling-index" /* SIBLING_INDEX */:
      case "round" /* ROUND */:
      case "mod" /* MOD */:
      case "rem" /* REM */:
        return true;
    }
    const catchFallback = func;
    return false;
  }
}
export class MathFunctionMatcher extends matcherBase(MathFunctionMatch) {
  // clang-format on
  static getFunctionType(callee) {
    const maybeFunc = callee;
    switch (maybeFunc) {
      case null:
      case "min" /* MIN */:
      case "max" /* MAX */:
      case "clamp" /* CLAMP */:
      case "calc" /* CALC */:
      case "sibling-count" /* SIBLING_COUNT */:
      case "sibling-index" /* SIBLING_INDEX */:
      case "round" /* ROUND */:
      case "mod" /* MOD */:
      case "rem" /* REM */:
        return maybeFunc;
    }
    const catchFallback = maybeFunc;
    return null;
  }
  matches(node, matching) {
    if (node.name !== "CallExpression") {
      return null;
    }
    const callee = MathFunctionMatcher.getFunctionType(matching.ast.text(node.getChild("Callee")));
    if (!callee) {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.some((arg) => arg.length === 0 || matching.hasUnresolvedSubstitutionsRange(arg[0], arg[arg.length - 1]))) {
      return null;
    }
    const text = matching.ast.text(node);
    const match = new MathFunctionMatch(text, node, callee, args);
    if (!match.isArithmeticFunctionCall() && args.length === 0) {
      return null;
    }
    return match;
  }
}
export class CustomFunctionMatch extends BaseFunctionMatch {
}
export class CustomFunctionMatcher extends matcherBase(CustomFunctionMatch) {
  // clang-format on
  matches(node, matching) {
    if (node.name !== "CallExpression") {
      return null;
    }
    const callee = matching.ast.text(node.getChild("VariableName"));
    if (!callee?.startsWith("--")) {
      return null;
    }
    const args = ASTUtils.callArgs(node);
    if (args.some((arg) => arg.length === 0 || matching.hasUnresolvedSubstitutionsRange(arg[0], arg[arg.length - 1]))) {
      return null;
    }
    const text = matching.ast.text(node);
    return new CustomFunctionMatch(text, node, callee, args);
  }
}
export var LayoutType = /* @__PURE__ */ ((LayoutType2) => {
  LayoutType2["FLEX"] = "flex";
  LayoutType2["GRID"] = "grid";
  LayoutType2["GRID_LANES"] = "grid-lanes";
  return LayoutType2;
})(LayoutType || {});
export class FlexGridGridLanesMatch {
  constructor(text, node, layoutType) {
    this.text = text;
    this.node = node;
    this.layoutType = layoutType;
  }
}
export class FlexGridGridLanesMatcher extends matcherBase(FlexGridGridLanesMatch) {
  // clang-format on
  static FLEX = ["flex", "inline-flex", "block flex", "inline flex"];
  static GRID = ["grid", "inline-grid", "block grid", "inline grid"];
  static GRID_LANES = ["grid-lanes", "inline-grid-lanes", "block grid-lanes", "inline grid-lanes"];
  accepts(propertyName) {
    return propertyName === "display";
  }
  matches(node, matching) {
    if (node.name !== "Declaration") {
      return null;
    }
    const valueNodes = ASTUtils.siblings(ASTUtils.declValue(node));
    if (valueNodes.length < 1) {
      return null;
    }
    const values = valueNodes.filter((node2) => node2.name !== "Important").map((node2) => matching.getComputedText(node2).trim()).filter((value) => value);
    const text = values.join(" ");
    if (FlexGridGridLanesMatcher.FLEX.includes(text)) {
      return new FlexGridGridLanesMatch(matching.ast.text(node), node, "flex" /* FLEX */);
    }
    if (FlexGridGridLanesMatcher.GRID.includes(text)) {
      return new FlexGridGridLanesMatch(matching.ast.text(node), node, "grid" /* GRID */);
    }
    if (FlexGridGridLanesMatcher.GRID_LANES.includes(text)) {
      return new FlexGridGridLanesMatch(matching.ast.text(node), node, "grid-lanes" /* GRID_LANES */);
    }
    return null;
  }
}
export class GridTemplateMatch {
  constructor(text, node, lines) {
    this.text = text;
    this.node = node;
    this.lines = lines;
  }
}
export class GridTemplateMatcher extends matcherBase(GridTemplateMatch) {
  // clang-format on
  accepts(propertyName) {
    return cssMetadata().isGridAreaDefiningProperty(propertyName);
  }
  matches(node, matching) {
    if (node.name !== "Declaration" || matching.hasUnresolvedSubstitutions(node)) {
      return null;
    }
    const lines = [];
    let curLine = [];
    let hasLeadingLineNames = false;
    let needClosingLineNames = false;
    function parseNodes(nodes, varParsingMode = false) {
      for (const curNode of nodes) {
        if (matching.getMatch(curNode) instanceof BaseVariableMatch) {
          const computedValueTree = tokenizeDeclaration("--property", matching.getComputedText(curNode));
          if (!computedValueTree) {
            continue;
          }
          const varNodes = ASTUtils.siblings(ASTUtils.declValue(computedValueTree.tree));
          if (varNodes.length === 0) {
            continue;
          }
          if (varNodes[0].name === "StringLiteral" && !hasLeadingLineNames || varNodes[0].name === "BracketedValue" && !needClosingLineNames) {
            lines.push(curLine);
            curLine = [curNode];
          } else {
            curLine.push(curNode);
          }
          parseNodes(varNodes, true);
        } else if (curNode.name === "BinaryExpression") {
          parseNodes(ASTUtils.siblings(curNode.firstChild));
        } else if (curNode.name === "StringLiteral") {
          if (!varParsingMode) {
            if (hasLeadingLineNames) {
              curLine.push(curNode);
            } else {
              lines.push(curLine);
              curLine = [curNode];
            }
          }
          needClosingLineNames = true;
          hasLeadingLineNames = false;
        } else if (curNode.name === "BracketedValue") {
          if (!varParsingMode) {
            if (needClosingLineNames) {
              curLine.push(curNode);
            } else {
              lines.push(curLine);
              curLine = [curNode];
            }
          }
          hasLeadingLineNames = !needClosingLineNames;
          needClosingLineNames = !needClosingLineNames;
        } else if (!varParsingMode) {
          curLine.push(curNode);
        }
      }
    }
    const valueNodes = ASTUtils.siblings(ASTUtils.declValue(node));
    if (valueNodes.length === 0) {
      return null;
    }
    parseNodes(valueNodes);
    lines.push(curLine);
    const valueText = matching.ast.textRange(valueNodes[0], valueNodes[valueNodes.length - 1]);
    return new GridTemplateMatch(valueText, node, lines.filter((line) => line.length > 0));
  }
}
export class AnchorFunctionMatch {
  constructor(text, node, functionName) {
    this.text = text;
    this.node = node;
    this.functionName = functionName;
  }
}
export class AnchorFunctionMatcher extends matcherBase(AnchorFunctionMatch) {
  // clang-format on
  anchorFunction(node, matching) {
    if (node.name !== "CallExpression") {
      return null;
    }
    const calleeText = matching.ast.text(node.getChild("Callee"));
    if (calleeText === "anchor" || calleeText === "anchor-size") {
      return calleeText;
    }
    return null;
  }
  matches(node, matching) {
    if (node.name === "VariableName") {
      let parent = node.parent;
      if (parent?.name !== "ArgList") {
        return null;
      }
      parent = parent.parent;
      if (!parent || !this.anchorFunction(parent, matching)) {
        return null;
      }
      return new AnchorFunctionMatch(matching.ast.text(node), node, null);
    }
    const calleeText = this.anchorFunction(node, matching);
    if (!calleeText) {
      return null;
    }
    const args = ASTUtils.children(node.getChild("ArgList"));
    if (calleeText === "anchor" && args.length <= 2) {
      return null;
    }
    if (args.find((arg) => arg.name === "VariableName")) {
      return null;
    }
    return new AnchorFunctionMatch(matching.ast.text(node), node, calleeText);
  }
}
export class PositionAnchorMatch {
  constructor(text, matching, node) {
    this.text = text;
    this.matching = matching;
    this.node = node;
  }
}
export class PositionAnchorMatcher extends matcherBase(PositionAnchorMatch) {
  // clang-format on
  accepts(propertyName) {
    return propertyName === "position-anchor";
  }
  matches(node, matching) {
    if (node.name !== "VariableName") {
      return null;
    }
    const dashedIdentifier = matching.ast.text(node);
    return new PositionAnchorMatch(dashedIdentifier, matching, node);
  }
}
export class CSSWideKeywordMatch {
  constructor(text, node, property, matchedStyles) {
    this.text = text;
    this.node = node;
    this.property = property;
    this.matchedStyles = matchedStyles;
  }
  resolveProperty() {
    return this.matchedStyles.resolveGlobalKeyword(this.property, this.text);
  }
  computedText() {
    return this.resolveProperty()?.value ?? null;
  }
}
export class CSSWideKeywordMatcher extends matcherBase(CSSWideKeywordMatch) {
  // clang-format on
  constructor(property, matchedStyles) {
    super();
    this.property = property;
    this.matchedStyles = matchedStyles;
  }
  matches(node, matching) {
    const parentNode = node.parent;
    if (node.name !== "ValueName" || parentNode?.name !== "Declaration") {
      return null;
    }
    if (Array.from(ASTUtils.stripComments(ASTUtils.siblings(ASTUtils.declValue(parentNode)))).some((child) => !ASTUtils.equals(child, node))) {
      return null;
    }
    const text = matching.ast.text(node);
    if (!CSSMetadata.isCSSWideKeyword(text)) {
      return null;
    }
    return new CSSWideKeywordMatch(text, node, this.property, this.matchedStyles);
  }
}
export class PositionTryMatch {
  constructor(text, node, preamble, fallbacks) {
    this.text = text;
    this.node = node;
    this.preamble = preamble;
    this.fallbacks = fallbacks;
  }
}
export class PositionTryMatcher extends matcherBase(PositionTryMatch) {
  // clang-format on
  accepts(propertyName) {
    return propertyName === "position-try" /* POSITION_TRY */ || propertyName === "position-try-fallbacks" /* POSITION_TRY_FALLBACKS */;
  }
  matches(node, matching) {
    if (node.name !== "Declaration") {
      return null;
    }
    let preamble = [];
    const valueNodes = ASTUtils.siblings(ASTUtils.declValue(node));
    const fallbacks = ASTUtils.split(valueNodes);
    if (matching.ast.propertyName === "position-try" /* POSITION_TRY */) {
      for (const [i, n] of fallbacks[0].entries()) {
        const computedText = matching.getComputedText(n);
        if (CSSMetadata.isCSSWideKeyword(computedText)) {
          return null;
        }
        if (CSSMetadata.isPositionTryOrderKeyword(computedText)) {
          preamble = fallbacks[0].splice(0, i + 1);
          break;
        }
      }
    }
    const valueText = matching.ast.textRange(valueNodes[0], valueNodes[valueNodes.length - 1]);
    return new PositionTryMatch(valueText, node, preamble, fallbacks);
  }
}
export class EnvFunctionMatch {
  constructor(text, node, varName, value, varNameIsValid) {
    this.text = text;
    this.node = node;
    this.varName = varName;
    this.value = value;
    this.varNameIsValid = varNameIsValid;
  }
  computedText() {
    return this.value;
  }
}
export class EnvFunctionMatcher extends matcherBase(EnvFunctionMatch) {
  // clang-format on
  constructor(matchedStyles) {
    super();
    this.matchedStyles = matchedStyles;
  }
  matches(node, matching) {
    if (node.name !== "CallExpression" || matching.ast.text(node.getChild("Callee")) !== "env") {
      return null;
    }
    const [valueNodes, ...fallbackNodes] = ASTUtils.callArgs(node);
    if (!valueNodes?.length) {
      return null;
    }
    const fallbackValue = fallbackNodes.length > 0 ? matching.getComputedTextRange(...ASTUtils.range(fallbackNodes.flat())) : void 0;
    const varName = matching.getComputedTextRange(...ASTUtils.range(valueNodes)).trim();
    const value = this.matchedStyles.environmentVariable(varName);
    return new EnvFunctionMatch(matching.ast.text(node), node, varName, value ?? fallbackValue ?? null, Boolean(value));
  }
}
//# sourceMappingURL=CSSPropertyParserMatchers.js.map
