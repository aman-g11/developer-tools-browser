"use strict";
export var Tag = /* @__PURE__ */ ((Tag2) => {
  Tag2[Tag2["EMPTY"] = 0] = "EMPTY";
  Tag2[Tag2["ORIGINAL_SCOPE_START"] = 1] = "ORIGINAL_SCOPE_START";
  Tag2[Tag2["ORIGINAL_SCOPE_END"] = 2] = "ORIGINAL_SCOPE_END";
  Tag2[Tag2["ORIGINAL_SCOPE_VARIABLES"] = 3] = "ORIGINAL_SCOPE_VARIABLES";
  Tag2[Tag2["GENERATED_RANGE_START"] = 4] = "GENERATED_RANGE_START";
  Tag2[Tag2["GENERATED_RANGE_END"] = 5] = "GENERATED_RANGE_END";
  Tag2[Tag2["GENERATED_RANGE_BINDINGS"] = 6] = "GENERATED_RANGE_BINDINGS";
  Tag2[Tag2["GENERATED_RANGE_SUBRANGE_BINDING"] = 7] = "GENERATED_RANGE_SUBRANGE_BINDING";
  Tag2[Tag2["GENERATED_RANGE_CALL_SITE"] = 8] = "GENERATED_RANGE_CALL_SITE";
  Tag2[Tag2["VENDOR_EXTENSION"] = 99] = "VENDOR_EXTENSION";
  return Tag2;
})(Tag || {});
export var EncodedTag = /* @__PURE__ */ ((EncodedTag2) => {
  EncodedTag2["EMPTY"] = "A";
  EncodedTag2["ORIGINAL_SCOPE_START"] = "B";
  EncodedTag2["ORIGINAL_SCOPE_END"] = "C";
  EncodedTag2["ORIGINAL_SCOPE_VARIABLES"] = "D";
  EncodedTag2["GENERATED_RANGE_START"] = "E";
  EncodedTag2["GENERATED_RANGE_END"] = "F";
  EncodedTag2["GENERATED_RANGE_BINDINGS"] = "G";
  EncodedTag2["GENERATED_RANGE_SUBRANGE_BINDING"] = "H";
  EncodedTag2["GENERATED_RANGE_CALL_SITE"] = "I";
  EncodedTag2["VENDOR_EXTENSION"] = "/";
  return EncodedTag2;
})(EncodedTag || {});
export var OriginalScopeFlags = /* @__PURE__ */ ((OriginalScopeFlags2) => {
  OriginalScopeFlags2[OriginalScopeFlags2["HAS_NAME"] = 1] = "HAS_NAME";
  OriginalScopeFlags2[OriginalScopeFlags2["HAS_KIND"] = 2] = "HAS_KIND";
  OriginalScopeFlags2[OriginalScopeFlags2["IS_STACK_FRAME"] = 4] = "IS_STACK_FRAME";
  return OriginalScopeFlags2;
})(OriginalScopeFlags || {});
export var GeneratedRangeFlags = /* @__PURE__ */ ((GeneratedRangeFlags2) => {
  GeneratedRangeFlags2[GeneratedRangeFlags2["HAS_LINE"] = 1] = "HAS_LINE";
  GeneratedRangeFlags2[GeneratedRangeFlags2["HAS_DEFINITION"] = 2] = "HAS_DEFINITION";
  GeneratedRangeFlags2[GeneratedRangeFlags2["IS_STACK_FRAME"] = 4] = "IS_STACK_FRAME";
  GeneratedRangeFlags2[GeneratedRangeFlags2["IS_HIDDEN"] = 8] = "IS_HIDDEN";
  return GeneratedRangeFlags2;
})(GeneratedRangeFlags || {});
//# sourceMappingURL=codec.js.map
