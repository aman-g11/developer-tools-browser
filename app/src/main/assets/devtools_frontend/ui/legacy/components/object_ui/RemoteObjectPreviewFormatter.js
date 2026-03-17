"use strict";
import * as i18n from "../../../../core/i18n/i18n.js";
import * as Platform from "../../../../core/platform/platform.js";
import * as SDK from "../../../../core/sdk/sdk.js";
import * as Protocol from "../../../../generated/protocol.js";
import { Directives, html, nothing, render } from "../../../lit/lit.js";
const { ifDefined, repeat } = Directives;
const UIStrings = {
  /**
   * @description Text shown in the console object preview. Shown when the user is inspecting a
   * JavaScript object and there are multiple empty properties on the object (x =
   * 'times'/'multiply').
   * @example {3} PH1
   */
  emptyD: "empty \xD7 {PH1}",
  /**
   * @description Shown when the user is inspecting a JavaScript object in the console and there is
   * an empty property on the object..
   */
  empty: "empty",
  /**
   * @description Text shown when the user is inspecting a JavaScript object, but of the properties
   * is not immediately available because it is a JavaScript 'getter' function, which means we have
   * to run some code first in order to compute this property.
   */
  thePropertyIsComputedWithAGetter: "The property is computed with a getter"
};
const str_ = i18n.i18n.registerUIStrings("ui/legacy/components/object_ui/RemoteObjectPreviewFormatter.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class RemoteObjectPreviewFormatter {
  static objectPropertyComparator(a, b) {
    return sortValue(a) - sortValue(b);
    function sortValue(property) {
      if (property.name === "[[PromiseState]]" /* PROMISE_STATE */) {
        return 1;
      }
      if (property.name === "[[PromiseResult]]" /* PROMISE_RESULT */) {
        return 2;
      }
      if (property.name === "[[GeneratorState]]" /* GENERATOR_STATE */ || property.name === "[[PrimitiveValue]]" /* PRIMITIVE_VALUE */ || property.name === "[[WeakRefTarget]]" /* WEAK_REF_TARGET */) {
        return 3;
      }
      if (property.type !== Protocol.Runtime.PropertyPreviewType.Function && !property.name.startsWith("#")) {
        return 4;
      }
      return 5;
    }
  }
  renderObjectPreview(preview, includeNullOrUndefined = true) {
    const description = preview.description;
    const subTypesWithoutValuePreview = /* @__PURE__ */ new Set([
      Protocol.Runtime.ObjectPreviewSubtype.Arraybuffer,
      Protocol.Runtime.ObjectPreviewSubtype.Dataview,
      Protocol.Runtime.ObjectPreviewSubtype.Error,
      Protocol.Runtime.ObjectPreviewSubtype.Null,
      Protocol.Runtime.ObjectPreviewSubtype.Regexp,
      Protocol.Runtime.ObjectPreviewSubtype.Webassemblymemory,
      "internal#entry",
      "trustedtype"
    ]);
    if (preview.type !== Protocol.Runtime.ObjectPreviewType.Object || preview.subtype && subTypesWithoutValuePreview.has(preview.subtype)) {
      return this.renderPropertyPreview(preview.type, preview.subtype, void 0, description);
    }
    const isArrayOrTypedArray = preview.subtype === Protocol.Runtime.ObjectPreviewSubtype.Array || preview.subtype === Protocol.Runtime.ObjectPreviewSubtype.Typedarray;
    let objectDescription = "";
    if (description) {
      if (isArrayOrTypedArray) {
        const arrayLength = SDK.RemoteObject.RemoteObject.arrayLength(preview);
        const arrayLengthText = arrayLength > 1 ? "(" + arrayLength + ")" : "";
        const arrayName = SDK.RemoteObject.RemoteObject.arrayNameFromDescription(description);
        objectDescription = arrayName === "Array" ? arrayLengthText : arrayName + arrayLengthText;
      } else {
        const hideDescription = description === "Object";
        objectDescription = hideDescription ? "" : description;
      }
    }
    const items = Array.from(
      preview.entries ? this.renderEntries(preview) : isArrayOrTypedArray ? this.renderArrayProperties(preview) : this.renderObjectProperties(preview, includeNullOrUndefined)
    );
    const renderName = (name) => html`<span class=name>${/^\s|\s$|^$|\n/.test(name) ? '"' + name.replace(/\n/g, "\u21B5") + '"' : name}</span>`;
    const renderPlaceholder = (placeholder) => html`<span class=object-value-undefined>${placeholder}</span>`;
    const renderValue = (value) => this.renderPropertyPreview(value.type, value.subtype, value.name, value.value);
    const renderEntry = (entry) => html`${entry.key && html`${this.renderPropertyPreview(entry.key.type, entry.key.subtype, void 0, entry.key.description)} => `}
          ${this.renderPropertyPreview(entry.value.type, entry.value.subtype, void 0, entry.value.description)}`;
    const renderItem = ({ name, entry, value, placeholder }, index) => html`${index > 0 ? ", " : ""}${placeholder !== void 0 ? renderPlaceholder(placeholder) : nothing}${name !== void 0 ? renderName(name) : nothing}${name !== void 0 && value ? ": " : ""}${value ? renderValue(value) : nothing}${entry ? renderEntry(entry) : nothing}`;
    return html`${objectDescription.length > 0 ? html`<span class=object-description>${objectDescription + "\xA0"}</span>` : nothing}<span class=object-properties-preview>${isArrayOrTypedArray ? "[" : "{"}${repeat(items, renderItem)}${preview.overflow ? html`<span>${items.length > 0 ? ",\xA0\u2026" : "\u2026"}</span>` : ""}
    ${isArrayOrTypedArray ? "]" : "}"}</span>`;
  }
  *renderObjectProperties(preview, includeNullOrUndefined) {
    const properties = preview.properties.filter((p) => p.type !== "accessor").sort(RemoteObjectPreviewFormatter.objectPropertyComparator);
    for (let i = 0; i < properties.length; ++i) {
      const property = properties[i];
      const name = property.name;
      if (!includeNullOrUndefined && (property.type === "undefined" || property.type === "object" && property.subtype === "null")) {
        continue;
      }
      if (preview.subtype === Protocol.Runtime.ObjectPreviewSubtype.Promise && name === "[[PromiseState]]" /* PROMISE_STATE */) {
        const promiseResult = properties.at(i + 1)?.name === "[[PromiseResult]]" /* PROMISE_RESULT */ ? properties.at(i + 1) : void 0;
        if (promiseResult) {
          i++;
        }
        yield { name: "<" + property.value + ">", value: property.value !== "pending" ? promiseResult : void 0 };
      } else if (preview.subtype === "generator" && name === "[[GeneratorState]]" /* GENERATOR_STATE */) {
        yield { name: "<" + property.value + ">" };
      } else if (name === "[[PrimitiveValue]]" /* PRIMITIVE_VALUE */) {
        yield { value: property };
      } else if (name === "[[WeakRefTarget]]" /* WEAK_REF_TARGET */) {
        if (property.type === Protocol.Runtime.PropertyPreviewType.Undefined) {
          yield { name: "<cleared>" };
        } else {
          yield { value: property };
        }
      } else {
        yield { name, value: property };
      }
    }
  }
  *renderArrayProperties(preview) {
    const arrayLength = SDK.RemoteObject.RemoteObject.arrayLength(preview);
    const indexProperties = preview.properties.filter((p) => toArrayIndex(p.name) !== -1).sort(arrayEntryComparator);
    const otherProperties = preview.properties.filter((p) => toArrayIndex(p.name) === -1).sort(RemoteObjectPreviewFormatter.objectPropertyComparator);
    function arrayEntryComparator(a, b) {
      return toArrayIndex(a.name) - toArrayIndex(b.name);
    }
    function toArrayIndex(name) {
      const index = Number(name) >>> 0;
      if (String(index) === name && index < arrayLength) {
        return index;
      }
      return -1;
    }
    const canShowGaps = !preview.overflow;
    const indexedProperties = [];
    for (const property of indexProperties) {
      const index = toArrayIndex(property.name);
      const gap = index - (indexedProperties.at(-1)?.index ?? -1) - 1;
      const hasGaps = index !== indexedProperties.length;
      indexedProperties.push({ property, index, gap, hasGaps });
    }
    const trailingGap = arrayLength - (indexedProperties.at(-1)?.index ?? -1) - 1;
    const renderGap = (count) => ({ placeholder: count !== 1 ? i18nString(UIStrings.emptyD, { PH1: count }) : i18nString(UIStrings.empty) });
    for (const { property, gap, hasGaps } of indexedProperties) {
      if (canShowGaps && gap > 0) {
        yield renderGap(gap);
      }
      yield { name: !canShowGaps && hasGaps ? property.name : void 0, value: property };
    }
    if (canShowGaps && trailingGap > 0) {
      yield renderGap(trailingGap);
    }
    for (const property of otherProperties) {
      yield { name: property.name, value: property };
    }
  }
  *renderEntries(preview) {
    for (const entry of preview.entries ?? []) {
      yield { entry };
    }
  }
  renderPropertyPreview(type, subtype, className, description) {
    const title = type === "accessor" ? i18nString(UIStrings.thePropertyIsComputedWithAGetter) : type === "object" && !subtype ? description : void 0;
    const abbreviateFullQualifiedClassName = (description2) => {
      const abbreviatedDescription = description2.split(".");
      for (let i = 0; i < abbreviatedDescription.length - 1; ++i) {
        abbreviatedDescription[i] = Platform.StringUtilities.trimMiddle(abbreviatedDescription[i], 3);
      }
      return abbreviatedDescription.length === 1 && abbreviatedDescription[0] === "Object" ? "{\u2026}" : abbreviatedDescription.join(".");
    };
    const preview = () => type === "accessor" ? "(...)" : type === "function" ? "\u0192" : type === "object" && subtype === "trustedtype" && className ? renderTrustedType(description ?? "", className) : type === "object" && subtype === "node" && description ? renderNodeTitle(description) : type === "string" ? Platform.StringUtilities.formatAsJSLiteral(description ?? "") : type === "object" && !subtype ? abbreviateFullQualifiedClassName(description ?? "") : description;
    return html`<span class='object-value-${subtype || type}' title=${ifDefined(title)}>${preview()}</span>`;
  }
  renderEvaluationResultPreview(result, allowErrors) {
    if ("error" in result) {
      return nothing;
    }
    if (result.exceptionDetails?.exception?.description) {
      const exception = result.exceptionDetails.exception.description;
      if (exception.startsWith("TypeError: ") || allowErrors) {
        return html`<span>${result.exceptionDetails.text} ${exception}</span>`;
      }
      return nothing;
    }
    const { preview, type, subtype, className, description } = result.object;
    if (preview && type === "object" && subtype !== "node" && subtype !== "trustedtype") {
      return this.renderObjectPreview(preview);
    }
    return this.renderPropertyPreview(
      type,
      subtype,
      className,
      Platform.StringUtilities.trimEndWithMaxLength(description || "", 400)
    );
  }
  /** @deprecated (crbug.com/457388389) Use lit version instead */
  renderEvaluationResultPreviewFragment(result, allowErrors) {
    const fragment = document.createDocumentFragment();
    render(this.renderEvaluationResultPreview(result, allowErrors), fragment);
    return fragment;
  }
}
var InternalName = /* @__PURE__ */ ((InternalName2) => {
  InternalName2["GENERATOR_STATE"] = "[[GeneratorState]]";
  InternalName2["PRIMITIVE_VALUE"] = "[[PrimitiveValue]]";
  InternalName2["PROMISE_STATE"] = "[[PromiseState]]";
  InternalName2["PROMISE_RESULT"] = "[[PromiseResult]]";
  InternalName2["WEAK_REF_TARGET"] = "[[WeakRefTarget]]";
  return InternalName2;
})(InternalName || {});
export function renderNodeTitle(nodeTitle) {
  const match = nodeTitle.match(/([^#.]+)(#[^.]+)?(\..*)?/);
  if (!match) {
    return null;
  }
  return html`<span class=webkit-html-tag-name>${match[1]}</span>${match[2] && html`<span class=webkit-html-attribute-value>${match[2]}</span>`}${match[3] && html`<span class=webkit-html-attribute-name>${match[3]}</span>`}`;
}
export function renderTrustedType(description, className) {
  return html`${className} <span class=object-value-string>"${description.replace(/\n/g, "\u21B5")}"</span>`;
}
//# sourceMappingURL=RemoteObjectPreviewFormatter.js.map
