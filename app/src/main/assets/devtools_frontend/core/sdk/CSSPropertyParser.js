"use strict";
import * as CodeMirror from "../../third_party/codemirror.next/codemirror.next.js";
import { TextMatcher } from "./CSSPropertyParserMatchers.js";
const globalValues = /* @__PURE__ */ new Set(["inherit", "initial", "unset"]);
const tagRegexp = /[\x20-\x7E]{4}/;
const numRegexp = /[+-]?(?:\d*\.)?\d+(?:[eE]\d+)?/;
const fontVariationSettingsRegexp = new RegExp(`(?:'(${tagRegexp.source})')|(?:"(${tagRegexp.source})")\\s+(${numRegexp.source})`);
export function parseFontVariationSettings(value) {
  if (globalValues.has(value.trim()) || value.trim() === "normal") {
    return [];
  }
  const results = [];
  for (const setting of splitByComma(stripComments(value))) {
    const match = setting.match(fontVariationSettingsRegexp);
    if (match) {
      results.push({
        tag: match[1] || match[2],
        value: parseFloat(match[3])
      });
    }
  }
  return results;
}
const fontFamilyRegexp = /^"(.+)"|'(.+)'$/;
export function parseFontFamily(value) {
  if (globalValues.has(value.trim())) {
    return [];
  }
  const results = [];
  for (const family of splitByComma(stripComments(value))) {
    const match = family.match(fontFamilyRegexp);
    if (match) {
      results.push(match[1] || match[2]);
    } else {
      results.push(family);
    }
  }
  return results;
}
export function splitByComma(value) {
  return value.split(",").map((part) => part.trim());
}
export function stripComments(value) {
  return value.replaceAll(/(\/\*(?:.|\s)*?\*\/)/g, "");
}
function nodeText(node, text) {
  return nodeTextRange(node, node, text);
}
function nodeTextRange(from, to, text) {
  return text.substring(from.from, to.to);
}
export class SyntaxTree {
  propertyValue;
  rule;
  tree;
  trailingNodes;
  propertyName;
  constructor(propertyValue, rule, tree, propertyName, trailingNodes = []) {
    this.propertyName = propertyName;
    this.propertyValue = propertyValue;
    this.rule = rule;
    this.tree = tree;
    this.trailingNodes = trailingNodes;
  }
  text(node) {
    if (node === null) {
      return "";
    }
    return nodeText(node ?? this.tree, this.rule);
  }
  textRange(from, to) {
    if (!from || !to) {
      return "";
    }
    return nodeTextRange(from, to, this.rule);
  }
  subtree(node) {
    return new SyntaxTree(this.propertyValue, this.rule, node);
  }
}
export class TreeWalker {
  ast;
  constructor(ast) {
    this.ast = ast;
  }
  static walkExcludingSuccessors(propertyValue, ...args) {
    const instance = new this(propertyValue, ...args);
    if (propertyValue.tree.name === "Declaration") {
      instance.iterateDeclaration(propertyValue.tree);
    } else {
      instance.iterateExcludingSuccessors(propertyValue.tree);
    }
    return instance;
  }
  static walk(propertyValue, ...args) {
    const instance = new this(propertyValue, ...args);
    if (propertyValue.tree.name === "Declaration") {
      instance.iterateDeclaration(propertyValue.tree);
    } else {
      instance.iterate(propertyValue.tree);
    }
    return instance;
  }
  iterateDeclaration(tree) {
    if (tree.name !== "Declaration") {
      return;
    }
    if (this.enter(tree)) {
      for (const sibling of ASTUtils.siblings(ASTUtils.declValue(tree))) {
        sibling.cursor().iterate(this.enter.bind(this), this.leave.bind(this));
      }
    }
    this.leave(tree);
  }
  iterate(tree) {
    for (const sibling of ASTUtils.siblings(tree)) {
      sibling.cursor().iterate(this.enter.bind(this), this.leave.bind(this));
    }
  }
  iterateExcludingSuccessors(tree) {
    tree.cursor().iterate(this.enter.bind(this), this.leave.bind(this));
  }
  enter(_node) {
    return true;
  }
  leave(_node) {
  }
}
export function matcherBase(matchT) {
  class MatcherBase {
    matchType = matchT;
    accepts(_propertyName) {
      return true;
    }
    matches(_node, _matching) {
      return null;
    }
  }
  return MatcherBase;
}
export class BottomUpTreeMatching extends TreeWalker {
  #matchers = [];
  #matchedNodes = /* @__PURE__ */ new Map();
  computedText;
  #key(node) {
    return `${node.from}:${node.to}`;
  }
  constructor(ast, matchers) {
    super(ast);
    this.computedText = new ComputedText(ast.rule.substring(ast.tree.from));
    this.#matchers.push(...matchers.filter((m) => !ast.propertyName || m.accepts(ast.propertyName)));
    this.#matchers.push(new TextMatcher());
  }
  leave({ node }) {
    for (const matcher of this.#matchers) {
      const match = matcher.matches(node, this);
      if (match) {
        this.computedText.push(match, node.from - this.ast.tree.from);
        this.#matchedNodes.set(this.#key(node), match);
        break;
      }
    }
  }
  matchText(node) {
    const matchers = this.#matchers.splice(0);
    this.#matchers.push(new TextMatcher());
    this.iterateExcludingSuccessors(node);
    this.#matchers.push(...matchers);
  }
  hasMatches(...matchTypes) {
    return Boolean(this.#matchedNodes.values().find((match) => matchTypes.some((matchType) => match instanceof matchType)));
  }
  getMatch(node) {
    return this.#matchedNodes.get(this.#key(node));
  }
  hasUnresolvedSubstitutions(node) {
    return this.hasUnresolvedSubstitutionsRange(node, node);
  }
  hasUnresolvedSubstitutionsRange(from, to) {
    return this.computedText.hasUnresolvedSubstitutions(from.from - this.ast.tree.from, to.to - this.ast.tree.from);
  }
  getComputedText(node, substitutionHook) {
    return this.getComputedTextRange(node, node, substitutionHook);
  }
  getLonghandValuesCount() {
    const [from, to] = ASTUtils.range(ASTUtils.siblings(ASTUtils.declValue(this.ast.tree)));
    if (!from || !to) {
      return 0;
    }
    return this.computedText.countTopLevelValues(from.from - this.ast.tree.from, to.to - this.ast.tree.from);
  }
  getComputedLonghandName(to) {
    const from = ASTUtils.declValue(this.ast.tree) ?? this.ast.tree;
    return this.computedText.countTopLevelValues(from.from - this.ast.tree.from, to.from - this.ast.tree.from);
  }
  getComputedPropertyValueText(substitutionHook) {
    const [from, to] = ASTUtils.range(ASTUtils.siblings(ASTUtils.declValue(this.ast.tree)));
    return this.getComputedTextRange(from ?? this.ast.tree, to ?? this.ast.tree, substitutionHook);
  }
  getComputedTextRange(from, to, substitutionHook) {
    if (!from || !to) {
      return "";
    }
    return this.computedText.get(from.from - this.ast.tree.from, to.to - this.ast.tree.from, substitutionHook);
  }
}
class ComputedTextChunk {
  constructor(match, offset) {
    this.match = match;
    this.offset = offset;
  }
  #cachedComputedText = null;
  #topLevelValueCount = null;
  get end() {
    return this.offset + this.length;
  }
  get length() {
    return this.match.text.length;
  }
  get computedText() {
    if (this.#cachedComputedText === null) {
      this.#cachedComputedText = this.match.computedText();
    }
    return this.#cachedComputedText;
  }
  // If the match is top-level, i.e. is an outermost sub-expression in the property value, count the number of outermost
  // sub-expressions after applying any potential substitutions.
  get topLevelValueCount() {
    if (this.match.node.parent?.name !== "Declaration") {
      return 0;
    }
    const computedText = this.computedText;
    if (computedText === "") {
      return 0;
    }
    if (this.#topLevelValueCount === null) {
      this.#topLevelValueCount = ASTUtils.siblings(ASTUtils.declValue(tokenizeDeclaration("--p", computedText ?? this.match.text)?.tree ?? null)).length;
    }
    return this.#topLevelValueCount;
  }
}
export class ComputedText {
  #chunks = [];
  text;
  #topLevelValueCounts = /* @__PURE__ */ new Map();
  #sorted = true;
  constructor(text) {
    this.text = text;
  }
  clear() {
    this.#chunks.splice(0);
    this.#topLevelValueCounts.clear();
  }
  get chunkCount() {
    return this.#chunks.length;
  }
  #sortIfNecessary() {
    if (this.#sorted) {
      return;
    }
    this.#chunks.sort((a, b) => {
      if (a.offset < b.offset) {
        return -1;
      }
      if (b.offset < a.offset) {
        return 1;
      }
      if (a.end > b.end) {
        return -1;
      }
      if (a.end < b.end) {
        return 1;
      }
      return 0;
    });
    this.#sorted = true;
  }
  // Add another substitutable match. The match will either be appended to the list of existing matches or it will
  // be substituted for the last match(es) if it encompasses them.
  push(match, offset) {
    function hasComputedText(match2) {
      return Boolean(match2.computedText);
    }
    if (!hasComputedText(match) || offset < 0 || offset >= this.text.length) {
      return;
    }
    const chunk = new ComputedTextChunk(match, offset);
    if (chunk.end > this.text.length) {
      return;
    }
    this.#sorted = false;
    this.#chunks.push(chunk);
  }
  *#range(begin, end) {
    this.#sortIfNecessary();
    let i = this.#chunks.findIndex((c) => c.offset >= begin);
    while (i >= 0 && i < this.#chunks.length && this.#chunks[i].end > begin && begin < end) {
      if (this.#chunks[i].end > end) {
        i++;
        continue;
      }
      yield this.#chunks[i];
      begin = this.#chunks[i].end;
      while (begin < end && i < this.#chunks.length && this.#chunks[i].offset < begin) {
        i++;
      }
    }
  }
  hasUnresolvedSubstitutions(begin, end) {
    for (const chunk of this.#range(begin, end)) {
      if (chunk.computedText === null) {
        return true;
      }
    }
    return false;
  }
  *#getPieces(begin, end) {
    for (const chunk of this.#range(begin, end)) {
      const piece = this.text.substring(begin, Math.min(chunk.offset, end));
      yield piece;
      if (end >= chunk.end) {
        yield chunk;
      }
      begin = chunk.end;
    }
    if (begin < end) {
      const piece = this.text.substring(begin, end);
      yield piece;
    }
  }
  // Get a slice of the computed text corresponding to the property text in the range [begin, end). The slice may not
  // start within a substitution chunk, e.g., it's invalid to request the computed text for the property value text
  // slice "1px var(--".
  get(begin, end, substitutionHook) {
    const pieces = [];
    const getText = (piece) => {
      if (typeof piece === "string") {
        return piece;
      }
      const substitution = substitutionHook?.(piece.match) ?? null;
      if (substitution !== null) {
        return getText(substitution);
      }
      return piece.computedText ?? piece.match.text;
    };
    for (const piece of this.#getPieces(begin, end)) {
      const text = getText(piece);
      if (text.length === 0) {
        continue;
      }
      if (pieces.length > 0 && requiresSpace(pieces[pieces.length - 1], text)) {
        pieces.push(" ");
      }
      pieces.push(text);
    }
    return pieces.join("");
  }
  #countTopLevelValuesInStringPiece(piece) {
    let count = this.#topLevelValueCounts.get(piece);
    if (count === void 0) {
      count = ASTUtils.siblings(ASTUtils.declValue(tokenizeDeclaration("--p", piece)?.tree ?? null)).length;
      this.#topLevelValueCounts.set(piece, count);
    }
    return count;
  }
  countTopLevelValues(begin, end) {
    const pieces = Array.from(this.#getPieces(begin, end));
    const counts = pieces.map(
      (chunk) => chunk instanceof ComputedTextChunk ? chunk.topLevelValueCount : this.#countTopLevelValuesInStringPiece(chunk)
    );
    const count = counts.reduce((sum, v) => sum + v, 0);
    return count;
  }
}
export function requiresSpace(a, b) {
  const tail = Array.isArray(a) ? a.findLast((node) => node.textContent)?.textContent : a;
  const head = Array.isArray(b) ? b.find((node) => node.textContent)?.textContent : b;
  const trailingChar = tail ? tail[tail.length - 1] : "";
  const leadingChar = head ? head[0] : "";
  const noSpaceAfter = ["", "(", "{", "}", ";", "["];
  const noSpaceBefore = ["", "(", ")", ",", ":", "*", "{", ";", "]"];
  return !/\s/.test(trailingChar) && !/\s/.test(leadingChar) && !noSpaceAfter.includes(trailingChar) && !noSpaceBefore.includes(leadingChar);
}
export const CSSControlMap = Map;
export var ASTUtils;
((ASTUtils2) => {
  function siblings(node) {
    const result = [];
    while (node) {
      result.push(node);
      node = node.nextSibling;
    }
    return result;
  }
  ASTUtils2.siblings = siblings;
  function children(node) {
    return siblings(node?.firstChild ?? null);
  }
  ASTUtils2.children = children;
  function range(node) {
    return [node[0], node[node.length - 1]];
  }
  ASTUtils2.range = range;
  function declValue(node) {
    if (node?.name !== "Declaration") {
      return null;
    }
    return children(node).find((node2) => node2.name === ":")?.nextSibling ?? null;
  }
  ASTUtils2.declValue = declValue;
  function* stripComments2(nodes) {
    for (const node of nodes) {
      if (node.type.name !== "Comment") {
        yield node;
      }
    }
  }
  ASTUtils2.stripComments = stripComments2;
  function split(nodes) {
    const result = [];
    let current = [];
    for (const node of nodes) {
      if (node.name === ",") {
        result.push(current);
        current = [];
      } else {
        current.push(node);
      }
    }
    if (nodes.length > 0) {
      result.push(current);
    }
    return result;
  }
  ASTUtils2.split = split;
  function callArgs(node) {
    const args = children(node?.getChild("ArgList") ?? null);
    const openParen = args.splice(0, 1)[0];
    const closingParen = args.pop();
    if (openParen?.name !== "(" || closingParen?.name !== ")") {
      return [];
    }
    return split(args);
  }
  ASTUtils2.callArgs = callArgs;
  function equals(a, b) {
    return a.name === b.name && a.from === b.from && a.to === b.to;
  }
  ASTUtils2.equals = equals;
})(ASTUtils || (ASTUtils = {}));
function declaration(rule) {
  const cssParser = CodeMirror.css.cssLanguage.parser;
  return cssParser.parse(rule).topNode.getChild("RuleSet")?.getChild("Block")?.getChild("Declaration") ?? null;
}
export function tokenizeDeclaration(propertyName, propertyValue) {
  const name = tokenizePropertyName(propertyName);
  if (!name) {
    return null;
  }
  const rule = `*{${name}: ${propertyValue};}`;
  const decl = declaration(rule);
  if (!decl || decl.type.isError) {
    return null;
  }
  const childNodes = ASTUtils.children(decl);
  if (childNodes.length < 2) {
    return null;
  }
  const [varName, colon, tree] = childNodes;
  if (!varName || varName.type.isError || !colon || colon.type.isError || tree?.type.isError) {
    return null;
  }
  const trailingNodes = ASTUtils.siblings(decl).slice(1);
  const [semicolon, brace] = trailingNodes.splice(trailingNodes.length - 2, 2);
  if (semicolon?.name !== ";" && brace?.name !== "}") {
    return null;
  }
  const ast = new SyntaxTree(propertyValue, rule, decl, name, trailingNodes);
  if (ast.text(varName) !== name || colon.name !== ":") {
    return null;
  }
  return ast;
}
export function tokenizePropertyName(name) {
  const rule = `*{${name}: inherit;}`;
  const decl = declaration(rule);
  if (!decl || decl.type.isError) {
    return null;
  }
  const propertyName = decl.getChild("PropertyName") ?? decl.getChild("VariableName");
  if (!propertyName) {
    return null;
  }
  return nodeText(propertyName, rule);
}
export function matchDeclaration(name, value, matchers) {
  const ast = tokenizeDeclaration(name, value);
  const matchedResult = ast && BottomUpTreeMatching.walk(ast, matchers);
  ast?.trailingNodes.forEach((n) => matchedResult?.matchText(n));
  return matchedResult;
}
export class TreeSearch extends TreeWalker {
  #found = null;
  #predicate;
  constructor(ast, predicate) {
    super(ast);
    this.#predicate = predicate;
  }
  enter({ node }) {
    if (this.#found) {
      return false;
    }
    if (this.#predicate(node)) {
      this.#found = this.#found ?? node;
      return false;
    }
    return true;
  }
  static find(ast, predicate) {
    return TreeSearch.walk(ast, predicate).#found;
  }
  static findAll(ast, predicate) {
    const foundNodes = [];
    TreeSearch.walk(ast, (node) => {
      if (predicate(node)) {
        foundNodes.push(node);
      }
      return false;
    });
    return foundNodes;
  }
}
//# sourceMappingURL=CSSPropertyParser.js.map
