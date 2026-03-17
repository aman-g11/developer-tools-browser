"use strict";
import * as Protocol from "../../generated/protocol.js";
import * as Platform from "../platform/platform.js";
import { CSSMetadata, cssMetadata, CSSWideKeyword } from "./CSSMetadata.js";
import { CSSProperty } from "./CSSProperty.js";
import * as PropertyParser from "./CSSPropertyParser.js";
import {
  AnchorFunctionMatcher,
  AngleMatcher,
  AttributeMatcher,
  AutoBaseMatcher,
  BaseVariableMatcher,
  BezierMatcher,
  BinOpMatcher,
  ColorMatcher,
  ColorMixMatcher,
  ContrastColorMatcher,
  CustomFunctionMatcher,
  defaultValueForCSSType,
  EnvFunctionMatcher,
  FlexGridGridLanesMatcher,
  GridTemplateMatcher,
  LengthMatcher,
  LightDarkColorMatcher,
  LinearGradientMatcher,
  LinkableNameMatcher,
  localEvalCSS,
  MathFunctionMatcher,
  PositionAnchorMatcher,
  PositionTryMatcher,
  RelativeColorChannelMatcher,
  ShadowMatcher,
  StringMatcher,
  URLMatcher,
  VariableMatcher
} from "./CSSPropertyParserMatchers.js";
import {
  CSSAtRule,
  CSSFunctionRule,
  CSSKeyframeRule,
  CSSKeyframesRule,
  CSSPositionTryRule,
  CSSPropertyRule,
  CSSStyleRule
} from "./CSSRule.js";
import { CSSStyleDeclaration, Type } from "./CSSStyleDeclaration.js";
function containsStyle(styles, query) {
  if (!query.styleSheetId || !query.range) {
    return false;
  }
  for (const style of styles) {
    if (query.styleSheetId === style.styleSheetId && style.range && query.range.equal(style.range)) {
      return true;
    }
  }
  return false;
}
function containsCustomProperties(style) {
  const properties = style.allProperties();
  return properties.some((property) => cssMetadata().isCustomProperty(property.name));
}
function containsInherited(style) {
  const properties = style.allProperties();
  for (let i = 0; i < properties.length; ++i) {
    const property = properties[i];
    if (property.activeInStyle() && cssMetadata().isPropertyInherited(property.name)) {
      return true;
    }
  }
  return false;
}
function cleanUserAgentPayload(payload) {
  for (const ruleMatch of payload) {
    cleanUserAgentSelectors(ruleMatch);
  }
  const cleanMatchedPayload = [];
  for (const ruleMatch of payload) {
    const lastMatch = cleanMatchedPayload[cleanMatchedPayload.length - 1];
    if (!lastMatch || ruleMatch.rule.origin !== "user-agent" || lastMatch.rule.origin !== "user-agent" || ruleMatch.rule.selectorList.text !== lastMatch.rule.selectorList.text || mediaText(ruleMatch) !== mediaText(lastMatch)) {
      cleanMatchedPayload.push(ruleMatch);
      continue;
    }
    mergeRule(ruleMatch, lastMatch);
  }
  return cleanMatchedPayload;
  function mergeRule(from, to) {
    const shorthands = /* @__PURE__ */ new Map();
    const properties = /* @__PURE__ */ new Map();
    for (const entry of to.rule.style.shorthandEntries) {
      shorthands.set(entry.name, entry.value);
    }
    for (const entry of to.rule.style.cssProperties) {
      properties.set(entry.name, entry.value);
    }
    for (const entry of from.rule.style.shorthandEntries) {
      shorthands.set(entry.name, entry.value);
    }
    for (const entry of from.rule.style.cssProperties) {
      properties.set(entry.name, entry.value);
    }
    to.rule.style.shorthandEntries = [...shorthands.entries()].map(([name, value]) => ({ name, value }));
    to.rule.style.cssProperties = [...properties.entries()].map(([name, value]) => ({ name, value }));
  }
  function mediaText(ruleMatch) {
    if (!ruleMatch.rule.media) {
      return null;
    }
    return ruleMatch.rule.media.map((media) => media.text).join(", ");
  }
  function cleanUserAgentSelectors(ruleMatch) {
    const { matchingSelectors, rule } = ruleMatch;
    if (rule.origin !== "user-agent" || !matchingSelectors.length) {
      return;
    }
    rule.selectorList.selectors = rule.selectorList.selectors.filter((_, i) => matchingSelectors.includes(i));
    rule.selectorList.text = rule.selectorList.selectors.map((item) => item.text).join(", ");
    ruleMatch.matchingSelectors = matchingSelectors.map((_, i) => i);
  }
}
function customHighlightNamesToMatchingSelectorIndices(ruleMatch) {
  const highlightNamesToMatchingSelectors = /* @__PURE__ */ new Map();
  for (let i = 0; i < ruleMatch.matchingSelectors.length; i++) {
    const matchingSelectorIndex = ruleMatch.matchingSelectors[i];
    const selectorText = ruleMatch.rule.selectorList.selectors[matchingSelectorIndex].text;
    const highlightNameMatch = selectorText.match(/::highlight\((.*)\)/);
    if (highlightNameMatch) {
      const highlightName = highlightNameMatch[1];
      const selectorsForName = highlightNamesToMatchingSelectors.get(highlightName);
      if (selectorsForName) {
        selectorsForName.push(matchingSelectorIndex);
      } else {
        highlightNamesToMatchingSelectors.set(highlightName, [matchingSelectorIndex]);
      }
    }
  }
  return highlightNamesToMatchingSelectors;
}
function queryMatches(style) {
  if (!style.parentRule) {
    return true;
  }
  const parentRule = style.parentRule;
  const queries = [...parentRule.media, ...parentRule.containerQueries, ...parentRule.supports, ...parentRule.scopes];
  for (const query of queries) {
    if (!query.active()) {
      return false;
    }
  }
  return true;
}
export class CSSRegisteredProperty {
  #registration;
  #cssModel;
  #style;
  constructor(cssModel, registration) {
    this.#cssModel = cssModel;
    this.#registration = registration;
  }
  propertyName() {
    return this.#registration instanceof CSSPropertyRule ? this.#registration.propertyName().text : this.#registration.propertyName;
  }
  initialValue() {
    return this.#registration instanceof CSSPropertyRule ? this.#registration.initialValue() : this.#registration.initialValue?.text ?? null;
  }
  inherits() {
    return this.#registration instanceof CSSPropertyRule ? this.#registration.inherits() : this.#registration.inherits;
  }
  syntax() {
    return this.#registration instanceof CSSPropertyRule ? this.#registration.syntax() : `"${this.#registration.syntax}"`;
  }
  parseValue(matchedStyles, computedStyles) {
    const value = this.initialValue();
    if (!value) {
      return null;
    }
    return PropertyParser.matchDeclaration(
      this.propertyName(),
      value,
      matchedStyles.propertyMatchers(this.style(), computedStyles)
    );
  }
  #asCSSProperties() {
    if (this.#registration instanceof CSSPropertyRule) {
      return [];
    }
    const { inherits, initialValue, syntax } = this.#registration;
    const properties = [
      { name: "inherits", value: `${inherits}` },
      { name: "syntax", value: `"${syntax}"` }
    ];
    if (initialValue !== void 0) {
      properties.push({ name: "initial-value", value: initialValue.text });
    }
    return properties;
  }
  style() {
    if (!this.#style) {
      this.#style = this.#registration instanceof CSSPropertyRule ? this.#registration.style : new CSSStyleDeclaration(
        this.#cssModel,
        null,
        { cssProperties: this.#asCSSProperties(), shorthandEntries: [] },
        Type.Pseudo
      );
    }
    return this.#style;
  }
}
export class CSSMatchedStyles {
  #cssModel;
  #node;
  #addedStyles = /* @__PURE__ */ new Map();
  #matchingSelectors = /* @__PURE__ */ new Map();
  #keyframes = [];
  #registeredProperties;
  #registeredPropertyMap = /* @__PURE__ */ new Map();
  #nodeForStyle = /* @__PURE__ */ new Map();
  #inheritedStyles = /* @__PURE__ */ new Set();
  #styleToDOMCascade = /* @__PURE__ */ new Map();
  #parentLayoutNodeId;
  #positionTryRules;
  #activePositionFallbackIndex;
  #mainDOMCascade;
  #pseudoDOMCascades;
  #customHighlightPseudoDOMCascades;
  #functionRules;
  #atRules;
  #functionRuleMap = /* @__PURE__ */ new Map();
  #environmentVariables = {};
  static async create(payload) {
    const cssMatchedStyles = new CSSMatchedStyles(payload);
    await cssMatchedStyles.init(payload);
    return cssMatchedStyles;
  }
  constructor({
    cssModel,
    node,
    animationsPayload,
    parentLayoutNodeId,
    positionTryRules,
    propertyRules,
    cssPropertyRegistrations,
    activePositionFallbackIndex,
    functionRules,
    atRules
  }) {
    this.#cssModel = cssModel;
    this.#node = node;
    this.#registeredProperties = [
      ...propertyRules.map((rule) => new CSSPropertyRule(cssModel, rule)),
      ...cssPropertyRegistrations
    ].map((r) => new CSSRegisteredProperty(cssModel, r));
    if (animationsPayload) {
      this.#keyframes = animationsPayload.map((rule) => new CSSKeyframesRule(cssModel, rule));
    }
    this.#positionTryRules = positionTryRules.map((rule) => new CSSPositionTryRule(cssModel, rule));
    this.#parentLayoutNodeId = parentLayoutNodeId;
    this.#activePositionFallbackIndex = activePositionFallbackIndex;
    this.#functionRules = functionRules.map((rule) => new CSSFunctionRule(cssModel, rule));
    this.#atRules = atRules.map((rule) => new CSSAtRule(cssModel, rule));
  }
  async init({
    matchedPayload,
    inheritedPayload,
    inlinePayload,
    attributesPayload,
    pseudoPayload,
    inheritedPseudoPayload,
    animationStylesPayload,
    transitionsStylePayload,
    inheritedAnimatedPayload
  }) {
    matchedPayload = cleanUserAgentPayload(matchedPayload);
    for (const inheritedResult of inheritedPayload) {
      inheritedResult.matchedCSSRules = cleanUserAgentPayload(inheritedResult.matchedCSSRules);
    }
    this.#environmentVariables = await this.cssModel().getEnvironmentVariables();
    this.#mainDOMCascade = await this.buildMainCascade(
      inlinePayload,
      attributesPayload,
      matchedPayload,
      inheritedPayload,
      animationStylesPayload,
      transitionsStylePayload,
      inheritedAnimatedPayload
    );
    [this.#pseudoDOMCascades, this.#customHighlightPseudoDOMCascades] = this.buildPseudoCascades(pseudoPayload, inheritedPseudoPayload);
    for (const domCascade of Array.from(this.#customHighlightPseudoDOMCascades.values()).concat(Array.from(this.#pseudoDOMCascades.values())).concat(this.#mainDOMCascade)) {
      for (const style of domCascade.styles()) {
        this.#styleToDOMCascade.set(style, domCascade);
      }
    }
    for (const prop of this.#registeredProperties) {
      this.#registeredPropertyMap.set(prop.propertyName(), prop);
    }
    for (const rule of this.#functionRules) {
      this.#functionRuleMap.set(rule.functionName().text, rule);
    }
  }
  async buildMainCascade(inlinePayload, attributesPayload, matchedPayload, inheritedPayload, animationStylesPayload, transitionsStylePayload, inheritedAnimatedPayload) {
    const nodeCascades = [];
    const nodeStyles = [];
    function addAttributesStyle() {
      if (!attributesPayload) {
        return;
      }
      const style = new CSSStyleDeclaration(this.#cssModel, null, attributesPayload, Type.Attributes);
      this.#nodeForStyle.set(style, this.#node);
      nodeStyles.push(style);
    }
    if (transitionsStylePayload) {
      const style = new CSSStyleDeclaration(this.#cssModel, null, transitionsStylePayload, Type.Transition);
      this.#nodeForStyle.set(style, this.#node);
      nodeStyles.push(style);
    }
    for (const animationsStyle of animationStylesPayload) {
      const style = new CSSStyleDeclaration(this.#cssModel, null, animationsStyle.style, Type.Animation, animationsStyle.name);
      this.#nodeForStyle.set(style, this.#node);
      nodeStyles.push(style);
    }
    if (inlinePayload && this.#node.nodeType() === Node.ELEMENT_NODE) {
      const style = new CSSStyleDeclaration(this.#cssModel, null, inlinePayload, Type.Inline);
      this.#nodeForStyle.set(style, this.#node);
      nodeStyles.push(style);
    }
    let addedAttributesStyle;
    for (let i = matchedPayload.length - 1; i >= 0; --i) {
      const rule = new CSSStyleRule(this.#cssModel, matchedPayload[i].rule);
      if ((rule.isInjected() || rule.isUserAgent()) && !addedAttributesStyle) {
        addedAttributesStyle = true;
        addAttributesStyle.call(this);
      }
      this.#nodeForStyle.set(rule.style, this.#node);
      nodeStyles.push(rule.style);
      this.addMatchingSelectors(this.#node, rule, matchedPayload[i].matchingSelectors);
    }
    if (!addedAttributesStyle) {
      addAttributesStyle.call(this);
    }
    nodeCascades.push(new NodeCascade(
      this,
      nodeStyles,
      this.#node,
      false
      /* #isInherited */
    ));
    let parentNode = this.#node.parentNode;
    const traverseParentInFlatTree = async (node) => {
      if (node.hasAssignedSlot()) {
        return await node.assignedSlot?.deferredNode.resolvePromise() ?? null;
      }
      return node.parentNode;
    };
    for (let i = 0; parentNode && inheritedPayload && i < inheritedPayload.length; ++i) {
      const inheritedStyles = [];
      const entryPayload = inheritedPayload[i];
      const inheritedAnimatedEntryPayload = inheritedAnimatedPayload[i];
      const inheritedInlineStyle = entryPayload.inlineStyle ? new CSSStyleDeclaration(this.#cssModel, null, entryPayload.inlineStyle, Type.Inline) : null;
      const inheritedTransitionsStyle = inheritedAnimatedEntryPayload?.transitionsStyle ? new CSSStyleDeclaration(
        this.#cssModel,
        null,
        inheritedAnimatedEntryPayload?.transitionsStyle,
        Type.Transition
      ) : null;
      const inheritedAnimationStyles = inheritedAnimatedEntryPayload?.animationStyles?.map(
        (animationStyle) => new CSSStyleDeclaration(
          this.#cssModel,
          null,
          animationStyle.style,
          Type.Animation,
          animationStyle.name
        )
      ) ?? [];
      if (inheritedTransitionsStyle && containsInherited(inheritedTransitionsStyle)) {
        this.#nodeForStyle.set(inheritedTransitionsStyle, parentNode);
        inheritedStyles.push(inheritedTransitionsStyle);
        this.#inheritedStyles.add(inheritedTransitionsStyle);
      }
      for (const inheritedAnimationsStyle of inheritedAnimationStyles) {
        if (!containsInherited(inheritedAnimationsStyle)) {
          continue;
        }
        this.#nodeForStyle.set(inheritedAnimationsStyle, parentNode);
        inheritedStyles.push(inheritedAnimationsStyle);
        this.#inheritedStyles.add(inheritedAnimationsStyle);
      }
      if (inheritedInlineStyle && containsInherited(inheritedInlineStyle)) {
        this.#nodeForStyle.set(inheritedInlineStyle, parentNode);
        inheritedStyles.push(inheritedInlineStyle);
        this.#inheritedStyles.add(inheritedInlineStyle);
      }
      const inheritedMatchedCSSRules = entryPayload.matchedCSSRules || [];
      for (let j = inheritedMatchedCSSRules.length - 1; j >= 0; --j) {
        const inheritedRule = new CSSStyleRule(this.#cssModel, inheritedMatchedCSSRules[j].rule);
        this.addMatchingSelectors(parentNode, inheritedRule, inheritedMatchedCSSRules[j].matchingSelectors);
        if (!containsInherited(inheritedRule.style)) {
          continue;
        }
        if (!containsCustomProperties(inheritedRule.style)) {
          if (containsStyle(nodeStyles, inheritedRule.style) || containsStyle(this.#inheritedStyles, inheritedRule.style)) {
            continue;
          }
        }
        this.#nodeForStyle.set(inheritedRule.style, parentNode);
        inheritedStyles.push(inheritedRule.style);
        this.#inheritedStyles.add(inheritedRule.style);
      }
      const node = parentNode;
      parentNode = await traverseParentInFlatTree(parentNode);
      nodeCascades.push(new NodeCascade(
        this,
        inheritedStyles,
        node,
        true
        /* #isInherited */
      ));
    }
    return new DOMInheritanceCascade(this, nodeCascades, this.#registeredProperties);
  }
  /**
   * Pseudo rule matches received via the inspector protocol are grouped by pseudo type.
   * For custom highlight pseudos, we need to instead group the rule matches by highlight
   * name in order to produce separate cascades for each highlight name. This is necessary
   * so that styles of ::highlight(foo) are not shown as overriding styles of ::highlight(bar).
   *
   * This helper function takes a list of rule matches and generates separate NodeCascades
   * for each custom highlight name that was matched.
   */
  buildSplitCustomHighlightCascades(rules, node, isInherited, pseudoCascades) {
    const splitHighlightRules = /* @__PURE__ */ new Map();
    for (let j = rules.length - 1; j >= 0; --j) {
      const highlightNamesToMatchingSelectorIndices = customHighlightNamesToMatchingSelectorIndices(rules[j]);
      for (const [highlightName, matchingSelectors] of highlightNamesToMatchingSelectorIndices) {
        const pseudoRule = new CSSStyleRule(this.#cssModel, rules[j].rule);
        this.#nodeForStyle.set(pseudoRule.style, node);
        if (isInherited) {
          this.#inheritedStyles.add(pseudoRule.style);
        }
        this.addMatchingSelectors(node, pseudoRule, matchingSelectors);
        const ruleListForHighlightName = splitHighlightRules.get(highlightName);
        if (ruleListForHighlightName) {
          ruleListForHighlightName.push(pseudoRule.style);
        } else {
          splitHighlightRules.set(highlightName, [pseudoRule.style]);
        }
      }
    }
    for (const [highlightName, highlightStyles] of splitHighlightRules) {
      const nodeCascade = new NodeCascade(
        this,
        highlightStyles,
        node,
        isInherited,
        true
        /* #isHighlightPseudoCascade*/
      );
      const cascadeListForHighlightName = pseudoCascades.get(highlightName);
      if (cascadeListForHighlightName) {
        cascadeListForHighlightName.push(nodeCascade);
      } else {
        pseudoCascades.set(highlightName, [nodeCascade]);
      }
    }
  }
  buildPseudoCascades(pseudoPayload, inheritedPseudoPayload) {
    const pseudoInheritanceCascades = /* @__PURE__ */ new Map();
    const customHighlightPseudoInheritanceCascades = /* @__PURE__ */ new Map();
    if (!pseudoPayload) {
      return [pseudoInheritanceCascades, customHighlightPseudoInheritanceCascades];
    }
    const pseudoCascades = /* @__PURE__ */ new Map();
    const customHighlightPseudoCascades = /* @__PURE__ */ new Map();
    for (let i = 0; i < pseudoPayload.length; ++i) {
      const entryPayload = pseudoPayload[i];
      const pseudoElement = this.#node.pseudoElements().get(entryPayload.pseudoType)?.at(-1) || null;
      const pseudoStyles = [];
      const rules = entryPayload.matches || [];
      if (entryPayload.pseudoType === Protocol.DOM.PseudoType.Highlight) {
        this.buildSplitCustomHighlightCascades(
          rules,
          this.#node,
          false,
          customHighlightPseudoCascades
        );
      } else {
        for (let j = rules.length - 1; j >= 0; --j) {
          const pseudoRule = new CSSStyleRule(this.#cssModel, rules[j].rule);
          pseudoStyles.push(pseudoRule.style);
          const nodeForStyle = cssMetadata().isHighlightPseudoType(entryPayload.pseudoType) ? this.#node : pseudoElement;
          this.#nodeForStyle.set(pseudoRule.style, nodeForStyle);
          if (nodeForStyle) {
            this.addMatchingSelectors(nodeForStyle, pseudoRule, rules[j].matchingSelectors);
          }
        }
        const isHighlightPseudoCascade = cssMetadata().isHighlightPseudoType(entryPayload.pseudoType);
        const nodeCascade = new NodeCascade(
          this,
          pseudoStyles,
          this.#node,
          false,
          isHighlightPseudoCascade
          /* #isHighlightPseudoCascade*/
        );
        pseudoCascades.set(entryPayload.pseudoType, [nodeCascade]);
      }
    }
    if (inheritedPseudoPayload) {
      let parentNode = this.#node.parentNode;
      for (let i = 0; parentNode && i < inheritedPseudoPayload.length; ++i) {
        const inheritedPseudoMatches = inheritedPseudoPayload[i].pseudoElements;
        for (let j = 0; j < inheritedPseudoMatches.length; ++j) {
          const inheritedEntryPayload = inheritedPseudoMatches[j];
          const rules = inheritedEntryPayload.matches || [];
          if (inheritedEntryPayload.pseudoType === Protocol.DOM.PseudoType.Highlight) {
            this.buildSplitCustomHighlightCascades(
              rules,
              parentNode,
              true,
              customHighlightPseudoCascades
            );
          } else {
            const pseudoStyles = [];
            for (let k = rules.length - 1; k >= 0; --k) {
              const pseudoRule = new CSSStyleRule(this.#cssModel, rules[k].rule);
              pseudoStyles.push(pseudoRule.style);
              this.#nodeForStyle.set(pseudoRule.style, parentNode);
              this.#inheritedStyles.add(pseudoRule.style);
              this.addMatchingSelectors(parentNode, pseudoRule, rules[k].matchingSelectors);
            }
            const isHighlightPseudoCascade = cssMetadata().isHighlightPseudoType(inheritedEntryPayload.pseudoType);
            const nodeCascade = new NodeCascade(
              this,
              pseudoStyles,
              parentNode,
              true,
              isHighlightPseudoCascade
              /* #isHighlightPseudoCascade*/
            );
            const cascadeListForPseudoType = pseudoCascades.get(inheritedEntryPayload.pseudoType);
            if (cascadeListForPseudoType) {
              cascadeListForPseudoType.push(nodeCascade);
            } else {
              pseudoCascades.set(inheritedEntryPayload.pseudoType, [nodeCascade]);
            }
          }
        }
        parentNode = parentNode.parentNode;
      }
    }
    for (const [pseudoType, nodeCascade] of pseudoCascades.entries()) {
      pseudoInheritanceCascades.set(
        pseudoType,
        new DOMInheritanceCascade(this, nodeCascade, this.#registeredProperties, this.#mainDOMCascade)
      );
    }
    for (const [highlightName, nodeCascade] of customHighlightPseudoCascades.entries()) {
      customHighlightPseudoInheritanceCascades.set(
        highlightName,
        new DOMInheritanceCascade(this, nodeCascade, this.#registeredProperties, this.#mainDOMCascade)
      );
    }
    return [pseudoInheritanceCascades, customHighlightPseudoInheritanceCascades];
  }
  addMatchingSelectors(node, rule, matchingSelectorIndices) {
    for (const matchingSelectorIndex of matchingSelectorIndices) {
      const selector = rule.selectors[matchingSelectorIndex];
      if (selector) {
        this.setSelectorMatches(node, selector.text, true);
      }
    }
  }
  node() {
    return this.#node;
  }
  cssModel() {
    return this.#cssModel;
  }
  hasMatchingSelectors(rule) {
    return (rule.selectors.length === 0 || this.getMatchingSelectors(rule).length > 0) && queryMatches(rule.style);
  }
  getParentLayoutNodeId() {
    return this.#parentLayoutNodeId;
  }
  getMatchingSelectors(rule) {
    const node = this.nodeForStyle(rule.style);
    if (!node || typeof node.id !== "number") {
      return [];
    }
    const map = this.#matchingSelectors.get(node.id);
    if (!map) {
      return [];
    }
    const result = [];
    for (let i = 0; i < rule.selectors.length; ++i) {
      if (map.get(rule.selectors[i].text)) {
        result.push(i);
      }
    }
    return result;
  }
  async recomputeMatchingSelectors(rule) {
    const node = this.nodeForStyle(rule.style);
    if (!node) {
      return;
    }
    const promises = [];
    for (const selector of rule.selectors) {
      promises.push(querySelector.call(this, node, selector.text));
    }
    await Promise.all(promises);
    async function querySelector(node2, selectorText) {
      const ownerDocument = node2.ownerDocument;
      if (!ownerDocument) {
        return;
      }
      if (typeof node2.id === "number") {
        const map = this.#matchingSelectors.get(node2.id);
        if (map?.has(selectorText)) {
          return;
        }
      }
      if (typeof ownerDocument.id !== "number") {
        return;
      }
      const matchingNodeIds = await this.#node.domModel().querySelectorAll(ownerDocument.id, selectorText);
      if (matchingNodeIds) {
        if (typeof node2.id === "number") {
          this.setSelectorMatches(node2, selectorText, matchingNodeIds.indexOf(node2.id) !== -1);
        } else {
          this.setSelectorMatches(node2, selectorText, false);
        }
      }
    }
  }
  addNewRule(rule, node) {
    this.#addedStyles.set(rule.style, node);
    return this.recomputeMatchingSelectors(rule);
  }
  setSelectorMatches(node, selectorText, value) {
    if (typeof node.id !== "number") {
      return;
    }
    let map = this.#matchingSelectors.get(node.id);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.#matchingSelectors.set(node.id, map);
    }
    map.set(selectorText, value);
  }
  nodeStyles() {
    Platform.assertNotNullOrUndefined(this.#mainDOMCascade);
    return this.#mainDOMCascade.styles();
  }
  inheritedStyles() {
    return this.#mainDOMCascade?.styles().filter((style) => this.isInherited(style)) ?? [];
  }
  animationStyles() {
    return this.#mainDOMCascade?.styles().filter((style) => !this.isInherited(style) && style.type === Type.Animation) ?? [];
  }
  transitionsStyle() {
    return this.#mainDOMCascade?.styles().find((style) => !this.isInherited(style) && style.type === Type.Transition) ?? null;
  }
  registeredProperties() {
    return this.#registeredProperties;
  }
  getRegisteredProperty(name) {
    return this.#registeredPropertyMap.get(name);
  }
  getRegisteredFunction(name) {
    const functionRule = this.#functionRuleMap.get(name);
    return functionRule ? functionRule.nameWithParameters() : void 0;
  }
  functionRules() {
    return this.#functionRules;
  }
  atRules() {
    return this.#atRules;
  }
  keyframes() {
    return this.#keyframes;
  }
  positionTryRules() {
    return this.#positionTryRules;
  }
  activePositionFallbackIndex() {
    return this.#activePositionFallbackIndex;
  }
  pseudoStyles(pseudoType) {
    Platform.assertNotNullOrUndefined(this.#pseudoDOMCascades);
    const domCascade = this.#pseudoDOMCascades.get(pseudoType);
    return domCascade ? domCascade.styles() : [];
  }
  pseudoTypes() {
    Platform.assertNotNullOrUndefined(this.#pseudoDOMCascades);
    return new Set(this.#pseudoDOMCascades.keys());
  }
  customHighlightPseudoStyles(highlightName) {
    Platform.assertNotNullOrUndefined(this.#customHighlightPseudoDOMCascades);
    const domCascade = this.#customHighlightPseudoDOMCascades.get(highlightName);
    return domCascade ? domCascade.styles() : [];
  }
  customHighlightPseudoNames() {
    Platform.assertNotNullOrUndefined(this.#customHighlightPseudoDOMCascades);
    return new Set(this.#customHighlightPseudoDOMCascades.keys());
  }
  nodeForStyle(style) {
    return this.#addedStyles.get(style) || this.#nodeForStyle.get(style) || null;
  }
  availableCSSVariables(style) {
    const domCascade = this.#styleToDOMCascade.get(style);
    return domCascade ? domCascade.findAvailableCSSVariables(style) : [];
  }
  computeCSSVariable(style, variableName) {
    if (style.parentRule instanceof CSSKeyframeRule) {
      const keyframeName = style.parentRule.parentRuleName();
      const activeStyle = this.#mainDOMCascade?.styles().find((searchStyle) => {
        return searchStyle.allProperties().some(
          (property) => property.name === "animation-name" && property.value === keyframeName && this.#mainDOMCascade?.propertyState(property) === "Active" /* ACTIVE */
        );
      });
      if (!activeStyle) {
        return null;
      }
      style = activeStyle;
    }
    const domCascade = this.#styleToDOMCascade.get(style);
    return domCascade ? domCascade.computeCSSVariable(style, variableName) : null;
  }
  computeAttribute(style, attributeName, type) {
    const domCascade = this.#styleToDOMCascade.get(style);
    return domCascade ? domCascade.computeAttribute(style, attributeName, type) : null;
  }
  originatingNodeForStyle(style) {
    let node = this.nodeForStyle(style) ?? this.node();
    while (node?.pseudoType()) {
      node = node.parentNode;
    }
    return node;
  }
  rawAttributeValueFromStyle(style, attributeName) {
    const node = this.originatingNodeForStyle(style);
    if (!node) {
      return null;
    }
    return node.getAttribute(attributeName) ?? null;
  }
  resolveProperty(name, ownerStyle) {
    return this.#styleToDOMCascade.get(ownerStyle)?.resolveProperty(name, ownerStyle) ?? null;
  }
  resolveGlobalKeyword(property, keyword) {
    const resolved = this.#styleToDOMCascade.get(property.ownerStyle)?.resolveGlobalKeyword(property, keyword);
    return resolved ? new CSSValueSource(resolved) : null;
  }
  isInherited(style) {
    return this.#inheritedStyles.has(style);
  }
  propertyState(property) {
    const domCascade = this.#styleToDOMCascade.get(property.ownerStyle);
    return domCascade ? domCascade.propertyState(property) : null;
  }
  isPropertyOverriddenByAnimation(property) {
    const domCascade = this.#styleToDOMCascade.get(property.ownerStyle);
    return domCascade?.isPropertyOverriddenByAnimation(property) ?? false;
  }
  resetActiveProperties() {
    Platform.assertNotNullOrUndefined(this.#mainDOMCascade);
    Platform.assertNotNullOrUndefined(this.#pseudoDOMCascades);
    Platform.assertNotNullOrUndefined(this.#customHighlightPseudoDOMCascades);
    this.#mainDOMCascade.reset();
    for (const domCascade of this.#pseudoDOMCascades.values()) {
      domCascade.reset();
    }
    for (const domCascade of this.#customHighlightPseudoDOMCascades.values()) {
      domCascade.reset();
    }
  }
  propertyMatchers(style, computedStyles) {
    return [
      new VariableMatcher(this, style),
      new ColorMatcher(() => computedStyles?.get("color") ?? null),
      new ColorMixMatcher(),
      new ContrastColorMatcher(),
      new URLMatcher(),
      new AngleMatcher(),
      new LinkableNameMatcher(),
      new BezierMatcher(),
      new StringMatcher(),
      new ShadowMatcher(),
      new LightDarkColorMatcher(style),
      new GridTemplateMatcher(),
      new LinearGradientMatcher(),
      new AnchorFunctionMatcher(),
      new PositionAnchorMatcher(),
      new FlexGridGridLanesMatcher(),
      new PositionTryMatcher(),
      new LengthMatcher(),
      new MathFunctionMatcher(),
      new CustomFunctionMatcher(),
      new AutoBaseMatcher(),
      new BinOpMatcher(),
      new RelativeColorChannelMatcher(),
      new AttributeMatcher(this, style),
      new EnvFunctionMatcher(this)
    ];
  }
  environmentVariable(name) {
    return this.#environmentVariables[name];
  }
}
class NodeCascade {
  constructor(matchedStyles, styles, node, isInherited, isHighlightPseudoCascade = false) {
    this.isHighlightPseudoCascade = isHighlightPseudoCascade;
    this.#matchedStyles = matchedStyles;
    this.styles = styles;
    this.#isInherited = isInherited;
    this.#node = node;
  }
  #matchedStyles;
  styles;
  #isInherited;
  propertiesState = /* @__PURE__ */ new Map();
  propertiesOverriddenByAnimation = /* @__PURE__ */ new Set();
  activeProperties = /* @__PURE__ */ new Map();
  #node;
  computeActiveProperties() {
    this.propertiesState.clear();
    this.propertiesOverriddenByAnimation.clear();
    this.activeProperties.clear();
    for (let i = this.styles.length - 1; i >= 0; i--) {
      const style = this.styles[i];
      const rule = style.parentRule;
      if (rule && !(rule instanceof CSSStyleRule)) {
        continue;
      }
      if (rule && !this.#matchedStyles.hasMatchingSelectors(rule)) {
        continue;
      }
      for (const property of style.allProperties()) {
        const metadata = cssMetadata();
        if (this.#isInherited) {
          if (this.isHighlightPseudoCascade) {
            if (property.name.startsWith("--")) {
              continue;
            }
          } else if (!metadata.isPropertyInherited(property.name)) {
            continue;
          }
        }
        if (style.range && !property.range) {
          continue;
        }
        if (!property.activeInStyle()) {
          this.propertiesState.set(property, "Overloaded" /* OVERLOADED */);
          continue;
        }
        if (this.#isInherited) {
          const registration = this.#matchedStyles.getRegisteredProperty(property.name);
          if (registration && !registration.inherits()) {
            this.propertiesState.set(property, "Overloaded" /* OVERLOADED */);
            continue;
          }
        }
        const canonicalName = metadata.canonicalPropertyName(property.name);
        this.updatePropertyState(property, canonicalName);
        for (const longhand of property.getLonghandProperties()) {
          if (metadata.isCSSPropertyName(longhand.name)) {
            this.updatePropertyState(longhand, longhand.name);
          }
        }
      }
    }
  }
  #treeScopeDistance(property) {
    if (!property.ownerStyle.parentRule && property.ownerStyle.type !== Type.Inline) {
      return -1;
    }
    const root = this.#node.getTreeRoot();
    const nodeId = property.ownerStyle.parentRule?.treeScope ?? root?.backendNodeId();
    if (nodeId === void 0) {
      return -1;
    }
    let distance = 0;
    for (let ancestor = this.#node; ancestor; ancestor = ancestor.parentNode) {
      if (ancestor.backendNodeId() === nodeId) {
        return distance;
      }
      distance++;
    }
    return -1;
  }
  #needsCascadeContextStep() {
    if (!this.#node.isInShadowTree()) {
      return false;
    }
    if (this.#node.ancestorShadowRoot()?.shadowRootType() === "user-agent") {
      const pseudoElement = this.#node.getAttribute("pseudo");
      return !pseudoElement?.startsWith("-webkit-") && !pseudoElement?.startsWith("-internal-");
    }
    return true;
  }
  updatePropertyState(propertyWithHigherSpecificity, canonicalName) {
    const activeProperty = this.activeProperties.get(canonicalName);
    if (activeProperty?.important && !propertyWithHigherSpecificity.important || activeProperty && this.#needsCascadeContextStep() && this.#treeScopeDistance(activeProperty) > this.#treeScopeDistance(propertyWithHigherSpecificity)) {
      this.propertiesState.set(propertyWithHigherSpecificity, "Overloaded" /* OVERLOADED */);
      return;
    }
    if (activeProperty) {
      this.propertiesState.set(activeProperty, "Overloaded" /* OVERLOADED */);
      if (propertyWithHigherSpecificity.ownerStyle.type === Type.Animation || propertyWithHigherSpecificity.ownerStyle.type === Type.Transition) {
        this.propertiesOverriddenByAnimation.add(activeProperty);
      }
    }
    this.propertiesState.set(propertyWithHigherSpecificity, "Active" /* ACTIVE */);
    this.activeProperties.set(canonicalName, propertyWithHigherSpecificity);
  }
}
function isRegular(declaration) {
  return "ownerStyle" in declaration;
}
export class CSSValueSource {
  declaration;
  constructor(declaration) {
    this.declaration = declaration;
  }
  get value() {
    return isRegular(this.declaration) ? this.declaration.value : this.declaration.initialValue();
  }
  get style() {
    return isRegular(this.declaration) ? this.declaration.ownerStyle : this.declaration.style();
  }
  get name() {
    return isRegular(this.declaration) ? this.declaration.name : this.declaration.propertyName();
  }
}
class SCCRecordEntry {
  constructor(nodeCascade, name, discoveryTime) {
    this.nodeCascade = nodeCascade;
    this.name = name;
    this.discoveryTime = discoveryTime;
    this.rootDiscoveryTime = discoveryTime;
  }
  rootDiscoveryTime;
  get isRootEntry() {
    return this.rootDiscoveryTime === this.discoveryTime;
  }
  updateRoot(neighbor) {
    this.rootDiscoveryTime = Math.min(this.rootDiscoveryTime, neighbor.rootDiscoveryTime);
  }
}
class SCCRecord {
  #time = 0;
  #stack = [];
  #entries = /* @__PURE__ */ new Map();
  get(nodeCascade, variable) {
    return this.#entries.get(nodeCascade)?.get(variable);
  }
  add(nodeCascade, variable) {
    const existing = this.get(nodeCascade, variable);
    if (existing) {
      return existing;
    }
    const entry = new SCCRecordEntry(nodeCascade, variable, this.#time++);
    this.#stack.push(entry);
    let map = this.#entries.get(nodeCascade);
    if (!map) {
      map = /* @__PURE__ */ new Map();
      this.#entries.set(nodeCascade, map);
    }
    map.set(variable, entry);
    return entry;
  }
  isInInProgressSCC(childRecord) {
    return this.#stack.includes(childRecord);
  }
  finishSCC(root) {
    const startIndex = this.#stack.lastIndexOf(root);
    console.assert(startIndex >= 0, "Root is not an in-progress scc");
    return this.#stack.splice(startIndex);
  }
}
function* forEach(array, startAfter) {
  const startIdx = startAfter !== void 0 ? array.indexOf(startAfter) + 1 : 0;
  for (let i = startIdx; i < array.length; ++i) {
    yield array[i];
  }
}
class DOMInheritanceCascade {
  #propertiesState = /* @__PURE__ */ new Map();
  #propertiesOverriddenByAnimation = /* @__PURE__ */ new Set();
  #availableCSSVariables = /* @__PURE__ */ new Map();
  #computedCSSVariables = /* @__PURE__ */ new Map();
  #styleToNodeCascade = /* @__PURE__ */ new Map();
  #initialized = false;
  #nodeCascades;
  #registeredProperties;
  #matchedStyles;
  #fallbackCascade = null;
  #styles = [];
  constructor(matchedStyles, nodeCascades, registeredProperties, fallbackCascade = null) {
    this.#nodeCascades = nodeCascades;
    this.#matchedStyles = matchedStyles;
    this.#registeredProperties = registeredProperties;
    this.#fallbackCascade = fallbackCascade;
    for (const nodeCascade of nodeCascades) {
      for (const style of nodeCascade.styles) {
        this.#styleToNodeCascade.set(style, nodeCascade);
        this.#styles.push(style);
      }
    }
    if (fallbackCascade) {
      for (const [style, nodeCascade] of fallbackCascade.#styleToNodeCascade) {
        if (!this.#styles.includes(style)) {
          this.#styleToNodeCascade.set(style, nodeCascade);
        }
      }
    }
  }
  findAvailableCSSVariables(style) {
    const nodeCascade = this.#styleToNodeCascade.get(style);
    if (!nodeCascade) {
      return [];
    }
    this.ensureInitialized();
    const availableCSSVariables = this.#availableCSSVariables.get(nodeCascade);
    if (!availableCSSVariables) {
      return [];
    }
    return Array.from(availableCSSVariables.keys());
  }
  #findPropertyInPreviousStyle(property, filter) {
    const cascade = this.#styleToNodeCascade.get(property.ownerStyle);
    if (!cascade) {
      return null;
    }
    for (const style of forEach(cascade.styles, property.ownerStyle)) {
      const candidate = style.allProperties().findLast((candidate2) => candidate2.name === property.name && filter(candidate2));
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }
  resolveProperty(name, ownerStyle) {
    const cascade = this.#styleToNodeCascade.get(ownerStyle);
    if (!cascade) {
      return null;
    }
    for (const style of cascade.styles) {
      const candidate = style.allProperties().findLast((candidate2) => candidate2.name === name);
      if (candidate) {
        return candidate;
      }
    }
    return this.#findPropertyInParentCascadeIfInherited({ name, ownerStyle });
  }
  #findPropertyInParentCascade(property) {
    const nodeCascade = this.#styleToNodeCascade.get(property.ownerStyle);
    if (!nodeCascade) {
      return null;
    }
    for (const cascade of forEach(this.#nodeCascades, nodeCascade)) {
      for (const style of cascade.styles) {
        const inheritedProperty = style.allProperties().findLast((inheritedProperty2) => inheritedProperty2.name === property.name);
        if (inheritedProperty) {
          return inheritedProperty;
        }
      }
    }
    if (this.#fallbackCascade && (!nodeCascade.isHighlightPseudoCascade || property.name.startsWith("--"))) {
      return this.#fallbackCascade.resolveProperty(property.name, property.ownerStyle);
    }
    return null;
  }
  #findPropertyInParentCascadeIfInherited(property) {
    if (!cssMetadata().isPropertyInherited(property.name) || !(this.#findCustomPropertyRegistration(property.name)?.inherits() ?? true)) {
      return null;
    }
    return this.#findPropertyInParentCascade(property);
  }
  #findCustomPropertyRegistration(property) {
    const registration = this.#registeredProperties.find((registration2) => registration2.propertyName() === property);
    return registration ? registration : null;
  }
  resolveGlobalKeyword(property, keyword) {
    const isPreviousLayer = (other) => {
      if (!(other.ownerStyle.parentRule instanceof CSSStyleRule)) {
        return false;
      }
      if (property.ownerStyle.type === Type.Inline) {
        return true;
      }
      if (property.ownerStyle.parentRule instanceof CSSStyleRule && other.ownerStyle.parentRule?.origin === Protocol.CSS.StyleSheetOrigin.Regular) {
        return JSON.stringify(other.ownerStyle.parentRule.layers) !== JSON.stringify(property.ownerStyle.parentRule.layers);
      }
      return false;
    };
    switch (keyword) {
      case CSSWideKeyword.INITIAL:
        return this.#findCustomPropertyRegistration(property.name);
      case CSSWideKeyword.INHERIT:
        return this.#findPropertyInParentCascade(property) ?? this.#findCustomPropertyRegistration(property.name);
      case CSSWideKeyword.REVERT:
        return this.#findPropertyInPreviousStyle(
          property,
          (other) => other.ownerStyle.parentRule !== null && other.ownerStyle.parentRule.origin !== (property.ownerStyle.parentRule?.origin ?? Protocol.CSS.StyleSheetOrigin.Regular)
        ) ?? this.resolveGlobalKeyword(property, CSSWideKeyword.UNSET);
      case CSSWideKeyword.REVERT_LAYER:
        return this.#findPropertyInPreviousStyle(property, isPreviousLayer) ?? this.resolveGlobalKeyword(property, CSSWideKeyword.REVERT);
      case CSSWideKeyword.REVERT_RULE:
        return this.#findPropertyInPreviousStyle(property, () => true) ?? this.resolveGlobalKeyword(property, CSSWideKeyword.UNSET);
      case CSSWideKeyword.UNSET:
        return this.#findPropertyInParentCascadeIfInherited(property) ?? this.#findCustomPropertyRegistration(property.name);
    }
  }
  computeCSSVariable(style, variableName) {
    this.ensureInitialized();
    const nodeCascade = this.#styleToNodeCascade.get(style);
    if (!nodeCascade) {
      return null;
    }
    return this.#computeCSSVariable(nodeCascade, variableName);
  }
  #computeCSSVariable(nodeCascade, variableName, sccRecord = new SCCRecord()) {
    const availableCSSVariables = this.#availableCSSVariables.get(nodeCascade);
    const computedCSSVariables = this.#computedCSSVariables.get(nodeCascade);
    if (!computedCSSVariables || !availableCSSVariables?.has(variableName)) {
      return null;
    }
    if (computedCSSVariables?.has(variableName)) {
      return computedCSSVariables.get(variableName) || null;
    }
    let definedValue = availableCSSVariables.get(variableName);
    if (definedValue === void 0 || definedValue === null) {
      return null;
    }
    if (definedValue.declaration.declaration instanceof CSSProperty && definedValue.declaration.value && CSSMetadata.isCSSWideKeyword(definedValue.declaration.value)) {
      const resolvedProperty = this.resolveGlobalKeyword(definedValue.declaration.declaration, definedValue.declaration.value);
      if (!resolvedProperty) {
        return definedValue;
      }
      const declaration = new CSSValueSource(resolvedProperty);
      const { value } = declaration;
      if (!value) {
        return definedValue;
      }
      definedValue = { declaration, value };
    }
    const ast = PropertyParser.tokenizeDeclaration(`--${variableName}`, definedValue.value);
    if (!ast) {
      return null;
    }
    return this.#walkTree(
      nodeCascade,
      ast,
      definedValue.declaration.style,
      variableName,
      sccRecord,
      definedValue.declaration
    );
  }
  computeAttribute(style, attributeName, type) {
    this.ensureInitialized();
    const nodeCascade = this.#styleToNodeCascade.get(style);
    if (!nodeCascade) {
      return null;
    }
    return this.#computeAttribute(nodeCascade, style, attributeName, type, new SCCRecord());
  }
  attributeValueAsType(style, attributeName, type) {
    const rawValue = this.#matchedStyles.rawAttributeValueFromStyle(style, attributeName);
    if (rawValue === null) {
      return null;
    }
    return localEvalCSS(rawValue, type);
  }
  attributeValueWithSubstitutions(nodeCascade, style, attributeName, sccRecord) {
    const rawValue = this.#matchedStyles.rawAttributeValueFromStyle(style, attributeName);
    if (rawValue === null) {
      return null;
    }
    const ast = PropertyParser.tokenizeDeclaration("--property", rawValue);
    if (!ast) {
      return null;
    }
    return this.#walkTree(nodeCascade, ast, style, `attr(${attributeName})`, sccRecord)?.value ?? null;
  }
  #computeAttribute(nodeCascade, style, attributeName, type, sccRecord = new SCCRecord()) {
    if (type.isCSSTokens) {
      const value = this.attributeValueWithSubstitutions(nodeCascade, style, attributeName, sccRecord);
      if (value !== null && localEvalCSS(value, type.type) !== null) {
        return value;
      }
      return null;
    }
    return this.attributeValueAsType(style, attributeName, type.type);
  }
  #walkTree(outerNodeCascade, ast, parentStyle, substitutionName, sccRecord, declaration) {
    const record = sccRecord.add(outerNodeCascade, substitutionName);
    const computedCSSVariablesMap = this.#computedCSSVariables;
    const innerNodeCascade = this.#styleToNodeCascade.get(parentStyle);
    const matching = PropertyParser.BottomUpTreeMatching.walk(ast, [
      new BaseVariableMatcher((match) => {
        const { value, mayFallback } = recurseWithCycleDetection(
          match.name,
          (nodeCascade) => this.#computeCSSVariable(nodeCascade, match.name, sccRecord)?.value ?? null
        );
        if (!mayFallback || value !== null) {
          return value;
        }
        if (!match.fallback) {
          return null;
        }
        return evaluateFallback(match.fallback, match.matching);
      }),
      new EnvFunctionMatcher(this.#matchedStyles),
      new AttributeMatcher(
        this.#matchedStyles,
        parentStyle,
        (match) => {
          const recordName = `attr(${match.name})`;
          let attributeValue = null;
          if (!match.isCSSTokens) {
            const { value, mayFallback } = recurseWithCycleDetection(
              recordName,
              () => this.attributeValueAsType(parentStyle, match.name, match.cssType())
            );
            if (value === null && !mayFallback) {
              return null;
            }
            attributeValue = value;
          } else {
            const { value, mayFallback } = recurseWithCycleDetection(
              recordName,
              (nodeCascade) => this.attributeValueWithSubstitutions(nodeCascade, parentStyle, match.name, sccRecord)
            );
            if (value === null && !mayFallback) {
              return null;
            }
            if (value !== null && localEvalCSS(value, match.cssType()) !== null) {
              attributeValue = value;
            }
          }
          if (attributeValue !== null) {
            return attributeValue;
          }
          if (!match.fallback || !match.isValidType) {
            return defaultValueForCSSType(match.type);
          }
          return evaluateFallback(match.fallback, match.matching);
        }
      )
    ]);
    const decl = PropertyParser.ASTUtils.siblings(PropertyParser.ASTUtils.declValue(matching.ast.tree));
    const declText = decl.length > 0 ? matching.getComputedTextRange(decl[0], decl[decl.length - 1]) : "";
    const hasUnresolvedSubstitutions = decl.length > 0 && matching.hasUnresolvedSubstitutionsRange(decl[0], decl[decl.length - 1]);
    const computedText = hasUnresolvedSubstitutions ? null : declText;
    const outerComputedCSSVariables = computedCSSVariablesMap.get(outerNodeCascade);
    if (!outerComputedCSSVariables) {
      return null;
    }
    if (record.isRootEntry) {
      const scc = sccRecord.finishSCC(record);
      if (scc.length > 1) {
        for (const entry of scc) {
          console.assert(entry.nodeCascade === outerNodeCascade, "Circles should be within the cascade");
          outerComputedCSSVariables.set(entry.name, null);
        }
        return null;
      }
    }
    if (computedText === null) {
      outerComputedCSSVariables.set(substitutionName, null);
      return null;
    }
    const cssVariableValue = { value: computedText, declaration };
    outerComputedCSSVariables.set(substitutionName, cssVariableValue);
    return cssVariableValue;
    function recurseWithCycleDetection(recordName, func) {
      if (!innerNodeCascade) {
        return { value: null, mayFallback: false };
      }
      const childRecord = sccRecord.get(innerNodeCascade, recordName);
      if (childRecord) {
        if (sccRecord.isInInProgressSCC(childRecord)) {
          record.updateRoot(childRecord);
          return { value: null, mayFallback: false };
        }
        return {
          value: computedCSSVariablesMap.get(innerNodeCascade)?.get(recordName)?.value ?? null,
          mayFallback: false
        };
      }
      const value = func(innerNodeCascade);
      const newChildRecord = sccRecord.get(innerNodeCascade, recordName);
      newChildRecord && record.updateRoot(newChildRecord);
      return { value, mayFallback: true };
    }
    function evaluateFallback(fallback, matching2) {
      if (fallback.length === 0) {
        return "";
      }
      if (matching2.hasUnresolvedSubstitutionsRange(fallback[0], fallback[fallback.length - 1])) {
        return null;
      }
      return matching2.getComputedTextRange(fallback[0], fallback[fallback.length - 1]);
    }
  }
  styles() {
    return this.#styles;
  }
  propertyState(property) {
    this.ensureInitialized();
    return this.#propertiesState.get(property) || null;
  }
  isPropertyOverriddenByAnimation(property) {
    this.ensureInitialized();
    return this.#propertiesOverriddenByAnimation.has(property);
  }
  reset() {
    this.#initialized = false;
    this.#propertiesState.clear();
    this.#propertiesOverriddenByAnimation.clear();
    this.#availableCSSVariables.clear();
    this.#computedCSSVariables.clear();
  }
  ensureInitialized() {
    if (this.#initialized) {
      return;
    }
    this.#initialized = true;
    const activeProperties = /* @__PURE__ */ new Map();
    for (const nodeCascade of this.#nodeCascades) {
      nodeCascade.computeActiveProperties();
      for (const [property, state] of nodeCascade.propertiesState) {
        if (state === "Overloaded" /* OVERLOADED */) {
          this.#propertiesState.set(property, "Overloaded" /* OVERLOADED */);
          if (nodeCascade.propertiesOverriddenByAnimation.has(property)) {
            this.#propertiesOverriddenByAnimation.add(property);
          }
          continue;
        }
        const canonicalName = cssMetadata().canonicalPropertyName(property.name);
        if (activeProperties.has(canonicalName)) {
          this.#propertiesState.set(property, "Overloaded" /* OVERLOADED */);
          const activeProperty = activeProperties.get(canonicalName);
          if (activeProperty && (activeProperty.ownerStyle.type === Type.Animation || activeProperty.ownerStyle.type === Type.Transition)) {
            this.#propertiesOverriddenByAnimation.add(property);
          }
          continue;
        }
        activeProperties.set(canonicalName, property);
        this.#propertiesState.set(property, "Active" /* ACTIVE */);
      }
    }
    for (const [canonicalName, shorthandProperty] of activeProperties) {
      const shorthandStyle = shorthandProperty.ownerStyle;
      const longhands = shorthandProperty.getLonghandProperties();
      if (!longhands.length) {
        continue;
      }
      let hasActiveLonghands = false;
      for (const longhand of longhands) {
        const longhandCanonicalName = cssMetadata().canonicalPropertyName(longhand.name);
        const longhandActiveProperty = activeProperties.get(longhandCanonicalName);
        if (!longhandActiveProperty) {
          continue;
        }
        if (longhandActiveProperty.ownerStyle === shorthandStyle) {
          hasActiveLonghands = true;
          break;
        }
      }
      if (hasActiveLonghands) {
        continue;
      }
      activeProperties.delete(canonicalName);
      this.#propertiesState.set(shorthandProperty, "Overloaded" /* OVERLOADED */);
    }
    const accumulatedCSSVariables = /* @__PURE__ */ new Map();
    for (const rule of this.#registeredProperties) {
      const initialValue = rule.initialValue();
      accumulatedCSSVariables.set(
        rule.propertyName(),
        initialValue !== null ? { value: initialValue, declaration: new CSSValueSource(rule) } : null
      );
    }
    if (this.#fallbackCascade) {
      this.#fallbackCascade.ensureInitialized();
      for (const [cascade, available] of this.#fallbackCascade.#availableCSSVariables) {
        this.#availableCSSVariables.set(cascade, available);
      }
      for (const [cascade, computed] of this.#fallbackCascade.#computedCSSVariables) {
        this.#computedCSSVariables.set(cascade, computed);
      }
      for (const [key, value] of this.#fallbackCascade.#availableCSSVariables.get(
        this.#fallbackCascade.#nodeCascades[0]
      ) ?? []) {
        accumulatedCSSVariables.set(key, value);
      }
    }
    for (let i = this.#nodeCascades.length - 1; i >= 0; --i) {
      const nodeCascade = this.#nodeCascades[i];
      const variableNames = [];
      for (const entry of nodeCascade.activeProperties.entries()) {
        const propertyName = entry[0];
        const property = entry[1];
        if (propertyName.startsWith("--")) {
          accumulatedCSSVariables.set(propertyName, { value: property.value, declaration: new CSSValueSource(property) });
          variableNames.push(propertyName);
        }
      }
      const availableCSSVariablesMap = new Map(accumulatedCSSVariables);
      const computedVariablesMap = /* @__PURE__ */ new Map();
      this.#availableCSSVariables.set(nodeCascade, availableCSSVariablesMap);
      this.#computedCSSVariables.set(nodeCascade, computedVariablesMap);
      for (const variableName of variableNames) {
        const prevValue = accumulatedCSSVariables.get(variableName);
        accumulatedCSSVariables.delete(variableName);
        const computedValue = this.#computeCSSVariable(nodeCascade, variableName);
        if (prevValue && computedValue?.value === prevValue.value) {
          computedValue.declaration = prevValue.declaration;
        }
        accumulatedCSSVariables.set(variableName, computedValue);
      }
    }
  }
}
export var PropertyState = /* @__PURE__ */ ((PropertyState2) => {
  PropertyState2["ACTIVE"] = "Active";
  PropertyState2["OVERLOADED"] = "Overloaded";
  return PropertyState2;
})(PropertyState || {});
//# sourceMappingURL=CSSMatchedStyles.js.map
