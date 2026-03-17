"use strict";
import { SelectorPart } from "./Selector.js";
const idSelector = (id) => {
  return `#${CSS.escape(id)}`;
};
const attributeSelector = (name, value) => {
  return `[${name}='${CSS.escape(value)}']`;
};
const classSelector = (selector, className) => {
  return `${selector}.${CSS.escape(className)}`;
};
const nthTypeSelector = (selector, index) => {
  return `${selector}:nth-of-type(${index + 1})`;
};
const typeSelector = (selector, type) => {
  return `${selector}${attributeSelector("type", type)}`;
};
const hasUniqueId = (node) => {
  return Boolean(node.id) && node.getRootNode().querySelectorAll(idSelector(node.id)).length === 1;
};
const isUniqueAmongTagNames = (node, children) => {
  for (const child of children) {
    if (child !== node && child.tagName === node.tagName) {
      return false;
    }
  }
  return true;
};
const isUniqueAmongInputTypes = (node, children) => {
  for (const child of children) {
    if (child !== node && child instanceof HTMLInputElement && child.type === node.type) {
      return false;
    }
  }
  return true;
};
const getUniqueClassName = (node, children) => {
  const classNames = new Set(node.classList);
  for (const child of children) {
    if (child !== node) {
      for (const className of child.classList) {
        classNames.delete(className);
      }
      if (classNames.size === 0) {
        break;
      }
    }
  }
  if (classNames.size > 0) {
    return classNames.values().next().value;
  }
  return void 0;
};
const getTypeIndex = (node, children) => {
  let nthTypeIndex = 0;
  for (const child of children) {
    if (child === node) {
      return nthTypeIndex;
    }
    if (child.tagName === node.tagName) {
      ++nthTypeIndex;
    }
  }
  throw new Error("Node not found in children");
};
export const getSelectorPart = (node, attributes = []) => {
  if (!(node instanceof Element)) {
    return;
  }
  for (const attribute of attributes) {
    const value = node.getAttribute(attribute);
    if (value) {
      return new SelectorPart(attributeSelector(attribute, value), true);
    }
  }
  if (hasUniqueId(node)) {
    return new SelectorPart(idSelector(node.id), true);
  }
  const selector = node.tagName.toLowerCase();
  switch (node.tagName) {
    case "BODY":
    case "HEAD":
    case "HTML":
      return new SelectorPart(selector, true);
  }
  const parent = node.parentNode;
  if (!parent) {
    return new SelectorPart(selector, true);
  }
  const children = parent.children;
  if (isUniqueAmongTagNames(node, children)) {
    return new SelectorPart(selector, true);
  }
  if (node instanceof HTMLInputElement && isUniqueAmongInputTypes(node, children)) {
    return new SelectorPart(typeSelector(selector, node.type), true);
  }
  const className = getUniqueClassName(node, children);
  if (className !== void 0) {
    return new SelectorPart(classSelector(selector, className), true);
  }
  return new SelectorPart(
    nthTypeSelector(selector, getTypeIndex(node, children)),
    false
  );
};
export const findMinMax = ([min, max], fns) => {
  fns.self ??= (i) => i;
  let index = fns.inc(min);
  let value;
  let isMax;
  do {
    value = fns.valueOf(min);
    isMax = true;
    while (index !== max) {
      min = fns.self(index);
      index = fns.inc(min);
      if (!fns.gte(value, index)) {
        isMax = false;
        break;
      }
    }
  } while (!isMax);
  return value;
};
export class SelectorRangeOps {
  // Close chains (using `>`) are stored in inner arrays.
  #buffer = [[]];
  #attributes;
  #depth = 0;
  constructor(attributes = []) {
    this.#attributes = attributes;
  }
  inc(node) {
    return node.parentNode ?? node.getRootNode();
  }
  valueOf(node) {
    const part = getSelectorPart(node, this.#attributes);
    if (!part) {
      throw new Error("Node is not an element");
    }
    if (this.#depth > 1) {
      this.#buffer.unshift([part]);
    } else {
      this.#buffer[0].unshift(part);
    }
    this.#depth = 0;
    return this.#buffer.map((parts) => parts.join(" > ")).join(" ");
  }
  gte(selector, node) {
    ++this.#depth;
    return node.querySelectorAll(selector).length === 1;
  }
}
export const computeCSSSelector = (node, attributes) => {
  const selectors = [];
  try {
    let root;
    while (node instanceof Element) {
      root = node.getRootNode();
      selectors.unshift(
        findMinMax(
          [node, root],
          new SelectorRangeOps(attributes)
        )
      );
      node = root instanceof ShadowRoot ? root.host : root;
    }
  } catch {
    return void 0;
  }
  return selectors;
};
export const queryCSSSelectorAll = (selectors) => {
  if (typeof selectors === "string") {
    selectors = [selectors];
  } else if (selectors.length === 0) {
    return [];
  }
  let lists = [
    [document.documentElement]
  ];
  do {
    const selector = selectors.shift();
    const roots = [];
    for (const nodes of lists) {
      for (const node of nodes) {
        const list = (node.shadowRoot ?? node).querySelectorAll(selector);
        if (list.length > 0) {
          roots.push(list);
        }
      }
    }
    lists = roots;
  } while (selectors.length > 0 && lists.length > 0);
  return lists.flatMap((list) => [...list]);
};
//# sourceMappingURL=CSSSelector.js.map
