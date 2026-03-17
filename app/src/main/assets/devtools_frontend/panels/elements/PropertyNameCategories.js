"use strict";
import * as SDK from "../../core/sdk/sdk.js";
export var Category = /* @__PURE__ */ ((Category2) => {
  Category2["LAYOUT"] = "Layout";
  Category2["TEXT"] = "Text";
  Category2["APPEARANCE"] = "Appearance";
  Category2["ANIMATION"] = "Animation";
  Category2["GRID"] = "Grid";
  Category2["FLEX"] = "Flex";
  Category2["TABLE"] = "Table";
  Category2["CSS_VARIABLES"] = "CSS Variables";
  Category2["GENERATED_CONTENT"] = "Generated Content";
  Category2["OTHER"] = "Other";
  return Category2;
})(Category || {});
export const DefaultCategoryOrder = [
  "Layout" /* LAYOUT */,
  "Text" /* TEXT */,
  "Appearance" /* APPEARANCE */,
  "Animation" /* ANIMATION */,
  "CSS Variables" /* CSS_VARIABLES */,
  "Grid" /* GRID */,
  "Flex" /* FLEX */,
  "Table" /* TABLE */,
  "Generated Content" /* GENERATED_CONTENT */,
  "Other" /* OTHER */
];
const CategorizedProperties = /* @__PURE__ */ new Map([
  [
    "Layout" /* LAYOUT */,
    [
      "display",
      "margin",
      "padding",
      "height",
      "width",
      "position",
      "top",
      "right",
      "bottom",
      "left",
      "z-index",
      "float",
      "clear",
      "overflow",
      "resize",
      "clip",
      "visibility",
      "box-sizing",
      "align-content",
      "align-items",
      "align-self",
      "flex",
      "flex-basis",
      "flex-direction",
      "flex-flow",
      "flex-grow",
      "flex-shrink",
      "flex-wrap",
      "justify-content",
      "order",
      "inline-size",
      "block-size",
      "min-inline-size",
      "min-block-size",
      "max-inline-size",
      "max-block-size",
      "min-width",
      "max-width",
      "min-height",
      "max-height"
    ]
  ],
  [
    "Text" /* TEXT */,
    [
      "font",
      "font-family",
      "font-size",
      "font-size-adjust",
      "font-stretch",
      "font-style",
      "font-variant",
      "font-weight",
      "font-smoothing",
      "direction",
      "tab-size",
      "text-align",
      "text-align-last",
      "text-decoration",
      "text-decoration-color",
      "text-decoration-line",
      "text-decoration-style",
      "text-indent",
      "text-justify",
      "text-overflow",
      "text-shadow",
      "text-transform",
      "text-size-adjust",
      "line-height",
      "vertical-align",
      "letter-spacing",
      "word-spacing",
      "white-space",
      "word-break",
      "word-wrap"
    ]
  ],
  [
    "Appearance" /* APPEARANCE */,
    [
      "color",
      "outline",
      "outline-color",
      "outline-offset",
      "outline-style",
      "Outline-width",
      "border",
      "border-image",
      "background",
      "cursor",
      "box-shadow",
      "\u2248",
      "tap-highlight-color"
    ]
  ],
  [
    "Animation" /* ANIMATION */,
    [
      "animation",
      "animation-delay",
      "animation-direction",
      "animation-duration",
      "animation-fill-mode",
      "animation-iteration-count",
      "animation-name",
      "animation-play-state",
      "animation-timing-function",
      "transition",
      "transition-delay",
      "transition-duration",
      "transition-property",
      "transition-timing-function"
    ]
  ],
  [
    "Grid" /* GRID */,
    [
      "grid",
      "grid-column",
      "grid-row",
      "order",
      "place-items",
      "place-content",
      "place-self"
    ]
  ],
  [
    "Flex" /* FLEX */,
    [
      "flex",
      "order",
      "place-items",
      "place-content",
      "place-self"
    ]
  ],
  [
    "Table" /* TABLE */,
    [
      "border-collapse",
      "border-spacing",
      "caption-side",
      "empty-cells",
      "table-layout"
    ]
  ],
  [
    "Generated Content" /* GENERATED_CONTENT */,
    [
      "content",
      "quotes",
      "counter-reset",
      "counter-increment"
    ]
  ]
]);
const CategoriesByPropertyName = /* @__PURE__ */ new Map();
for (const [category, styleNames] of CategorizedProperties) {
  for (const styleName of styleNames) {
    if (!CategoriesByPropertyName.has(styleName)) {
      CategoriesByPropertyName.set(styleName, []);
    }
    const categories = CategoriesByPropertyName.get(styleName);
    categories.push(category);
  }
}
const matchCategoriesByPropertyName = (propertyName) => {
  if (CategoriesByPropertyName.has(propertyName)) {
    return CategoriesByPropertyName.get(propertyName);
  }
  if (propertyName.startsWith("--")) {
    return ["CSS Variables" /* CSS_VARIABLES */];
  }
  return [];
};
export const categorizePropertyName = (propertyName) => {
  const cssMetadata = SDK.CSSMetadata.cssMetadata();
  const canonicalName = cssMetadata.canonicalPropertyName(propertyName);
  const categories = matchCategoriesByPropertyName(canonicalName);
  if (categories.length > 0) {
    return categories;
  }
  const shorthands = cssMetadata.getShorthands(canonicalName);
  if (shorthands) {
    for (const shorthand of shorthands) {
      const shorthandCategories = matchCategoriesByPropertyName(shorthand);
      if (shorthandCategories.length > 0) {
        return shorthandCategories;
      }
    }
  }
  return ["Other" /* OTHER */];
};
//# sourceMappingURL=PropertyNameCategories.js.map
