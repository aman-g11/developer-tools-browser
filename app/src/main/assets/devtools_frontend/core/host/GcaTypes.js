"use strict";
export var Type = /* @__PURE__ */ ((Type2) => {
  Type2[Type2["TYPE_UNSPECIFIED"] = 0] = "TYPE_UNSPECIFIED";
  Type2[Type2["STRING"] = 1] = "STRING";
  Type2[Type2["NUMBER"] = 2] = "NUMBER";
  Type2[Type2["INTEGER"] = 3] = "INTEGER";
  Type2[Type2["BOOLEAN"] = 4] = "BOOLEAN";
  Type2[Type2["ARRAY"] = 5] = "ARRAY";
  Type2[Type2["OBJECT"] = 6] = "OBJECT";
  Type2[Type2["NULL"] = 7] = "NULL";
  return Type2;
})(Type || {});
export var HarmCategory = /* @__PURE__ */ ((HarmCategory2) => {
  HarmCategory2[HarmCategory2["HARM_CATEGORY_UNSPECIFIED"] = 0] = "HARM_CATEGORY_UNSPECIFIED";
  HarmCategory2[HarmCategory2["HARM_CATEGORY_HARASSMENT"] = 7] = "HARM_CATEGORY_HARASSMENT";
  HarmCategory2[HarmCategory2["HARM_CATEGORY_HATE_SPEECH"] = 8] = "HARM_CATEGORY_HATE_SPEECH";
  HarmCategory2[HarmCategory2["HARM_CATEGORY_SEXUALLY_EXPLICIT"] = 9] = "HARM_CATEGORY_SEXUALLY_EXPLICIT";
  HarmCategory2[HarmCategory2["HARM_CATEGORY_DANGEROUS_CONTENT"] = 10] = "HARM_CATEGORY_DANGEROUS_CONTENT";
  return HarmCategory2;
})(HarmCategory || {});
export var HarmProbability = /* @__PURE__ */ ((HarmProbability2) => {
  HarmProbability2[HarmProbability2["HARM_PROBABILITY_UNSPECIFIED"] = 0] = "HARM_PROBABILITY_UNSPECIFIED";
  HarmProbability2[HarmProbability2["NEGLIGIBLE"] = 1] = "NEGLIGIBLE";
  HarmProbability2[HarmProbability2["LOW"] = 2] = "LOW";
  HarmProbability2[HarmProbability2["MEDIUM"] = 3] = "MEDIUM";
  HarmProbability2[HarmProbability2["HIGH"] = 4] = "HIGH";
  return HarmProbability2;
})(HarmProbability || {});
export var HarmBlockThreshold = /* @__PURE__ */ ((HarmBlockThreshold2) => {
  HarmBlockThreshold2[HarmBlockThreshold2["HARM_BLOCK_THRESHOLD_UNSPECIFIED"] = 0] = "HARM_BLOCK_THRESHOLD_UNSPECIFIED";
  HarmBlockThreshold2[HarmBlockThreshold2["BLOCK_LOW_AND_ABOVE"] = 1] = "BLOCK_LOW_AND_ABOVE";
  HarmBlockThreshold2[HarmBlockThreshold2["BLOCK_MEDIUM_AND_ABOVE"] = 2] = "BLOCK_MEDIUM_AND_ABOVE";
  HarmBlockThreshold2[HarmBlockThreshold2["BLOCK_ONLY_HIGH"] = 3] = "BLOCK_ONLY_HIGH";
  HarmBlockThreshold2[HarmBlockThreshold2["BLOCK_NONE"] = 4] = "BLOCK_NONE";
  HarmBlockThreshold2[HarmBlockThreshold2["OFF"] = 5] = "OFF";
  return HarmBlockThreshold2;
})(HarmBlockThreshold || {});
export var HarmBlockMethod = /* @__PURE__ */ ((HarmBlockMethod2) => {
  HarmBlockMethod2[HarmBlockMethod2["HARM_BLOCK_METHOD_UNSPECIFIED"] = 0] = "HARM_BLOCK_METHOD_UNSPECIFIED";
  HarmBlockMethod2[HarmBlockMethod2["SEVERITY"] = 1] = "SEVERITY";
  HarmBlockMethod2[HarmBlockMethod2["PROBABILITY"] = 2] = "PROBABILITY";
  return HarmBlockMethod2;
})(HarmBlockMethod || {});
export var FinishReason = /* @__PURE__ */ ((FinishReason2) => {
  FinishReason2[FinishReason2["FINISH_REASON_UNSPECIFIED"] = 0] = "FINISH_REASON_UNSPECIFIED";
  FinishReason2[FinishReason2["STOP"] = 1] = "STOP";
  FinishReason2[FinishReason2["MAX_TOKENS"] = 2] = "MAX_TOKENS";
  FinishReason2[FinishReason2["SAFETY"] = 3] = "SAFETY";
  FinishReason2[FinishReason2["RECITATION"] = 4] = "RECITATION";
  FinishReason2[FinishReason2["OTHER"] = 5] = "OTHER";
  FinishReason2[FinishReason2["BLOCKLIST"] = 6] = "BLOCKLIST";
  FinishReason2[FinishReason2["PROHIBITED_CONTENT"] = 7] = "PROHIBITED_CONTENT";
  FinishReason2[FinishReason2["SPII"] = 8] = "SPII";
  FinishReason2[FinishReason2["MALFORMED_FUNCTION_CALL"] = 9] = "MALFORMED_FUNCTION_CALL";
  FinishReason2[FinishReason2["IMAGE_SAFETY"] = 10] = "IMAGE_SAFETY";
  FinishReason2[FinishReason2["IMAGE_PROHIBITED_CONTENT"] = 11] = "IMAGE_PROHIBITED_CONTENT";
  FinishReason2[FinishReason2["IMAGE_RECITATION"] = 12] = "IMAGE_RECITATION";
  FinishReason2[FinishReason2["IMAGE_OTHER"] = 13] = "IMAGE_OTHER";
  FinishReason2[FinishReason2["UNEXPECTED_TOOL_CALL"] = 14] = "UNEXPECTED_TOOL_CALL";
  FinishReason2[FinishReason2["NO_IMAGE"] = 15] = "NO_IMAGE";
  return FinishReason2;
})(FinishReason || {});
export var Method = /* @__PURE__ */ ((Method2) => {
  Method2[Method2["METHOD_UNSPECIFIED"] = 0] = "METHOD_UNSPECIFIED";
  Method2[Method2["GENERATE_CODE"] = 1] = "GENERATE_CODE";
  Method2[Method2["COMPLETE_CODE"] = 2] = "COMPLETE_CODE";
  Method2[Method2["TRANSFORM_CODE"] = 3] = "TRANSFORM_CODE";
  Method2[Method2["CHAT"] = 4] = "CHAT";
  return Method2;
})(Method || {});
export var SuggestionStatus = /* @__PURE__ */ ((SuggestionStatus2) => {
  SuggestionStatus2[SuggestionStatus2["STATUS_UNSPECIFIED"] = 0] = "STATUS_UNSPECIFIED";
  SuggestionStatus2[SuggestionStatus2["NO_ERROR"] = 1] = "NO_ERROR";
  SuggestionStatus2[SuggestionStatus2["ERROR"] = 2] = "ERROR";
  SuggestionStatus2[SuggestionStatus2["CANCELLED"] = 3] = "CANCELLED";
  SuggestionStatus2[SuggestionStatus2["EMPTY"] = 4] = "EMPTY";
  return SuggestionStatus2;
})(SuggestionStatus || {});
export var InteractionType = /* @__PURE__ */ ((InteractionType2) => {
  InteractionType2[InteractionType2["INTERACTION_TYPE_UNSPECIFIED"] = 0] = "INTERACTION_TYPE_UNSPECIFIED";
  InteractionType2[InteractionType2["THUMBS_UP"] = 1] = "THUMBS_UP";
  InteractionType2[InteractionType2["THUMBS_DOWN"] = 2] = "THUMBS_DOWN";
  InteractionType2[InteractionType2["ACCEPT"] = 3] = "ACCEPT";
  InteractionType2[InteractionType2["ACCEPT_PARTIALLY"] = 4] = "ACCEPT_PARTIALLY";
  InteractionType2[InteractionType2["REJECT"] = 5] = "REJECT";
  InteractionType2[InteractionType2["COPY"] = 6] = "COPY";
  return InteractionType2;
})(InteractionType || {});
export var InclusionReason = /* @__PURE__ */ ((InclusionReason2) => {
  InclusionReason2[InclusionReason2["INCLUSION_REASON_UNSPECIFIED"] = 0] = "INCLUSION_REASON_UNSPECIFIED";
  InclusionReason2[InclusionReason2["ACTIVE"] = 1] = "ACTIVE";
  InclusionReason2[InclusionReason2["OPEN"] = 2] = "OPEN";
  InclusionReason2[InclusionReason2["RECENTLY_CLOSED"] = 3] = "RECENTLY_CLOSED";
  InclusionReason2[InclusionReason2["RECENTLY_EDITED"] = 4] = "RECENTLY_EDITED";
  InclusionReason2[InclusionReason2["COLOCATED"] = 5] = "COLOCATED";
  InclusionReason2[InclusionReason2["RELATED"] = 6] = "RELATED";
  InclusionReason2[InclusionReason2["USER_SELECTED"] = 7] = "USER_SELECTED";
  return InclusionReason2;
})(InclusionReason || {});
export var BlockReason = /* @__PURE__ */ ((BlockReason2) => {
  BlockReason2[BlockReason2["BLOCKED_REASON_UNSPECIFIED"] = 0] = "BLOCKED_REASON_UNSPECIFIED";
  BlockReason2[BlockReason2["SAFETY"] = 1] = "SAFETY";
  BlockReason2[BlockReason2["OTHER"] = 2] = "OTHER";
  BlockReason2[BlockReason2["BLOCKLIST"] = 3] = "BLOCKLIST";
  BlockReason2[BlockReason2["PROHIBITED_CONTENT"] = 4] = "PROHIBITED_CONTENT";
  BlockReason2[BlockReason2["IMAGE_SAFETY"] = 5] = "IMAGE_SAFETY";
  return BlockReason2;
})(BlockReason || {});
export var Language = /* @__PURE__ */ ((Language2) => {
  Language2[Language2["LANGUAGE_UNSPECIFIED"] = 0] = "LANGUAGE_UNSPECIFIED";
  Language2[Language2["PYTHON"] = 1] = "PYTHON";
  return Language2;
})(Language || {});
export var Outcome = /* @__PURE__ */ ((Outcome2) => {
  Outcome2[Outcome2["OUTCOME_UNSPECIFIED"] = 0] = "OUTCOME_UNSPECIFIED";
  Outcome2[Outcome2["OUTCOME_OK"] = 1] = "OUTCOME_OK";
  Outcome2[Outcome2["OUTCOME_FAILED"] = 2] = "OUTCOME_FAILED";
  Outcome2[Outcome2["OUTCOME_DEADLINE_EXCEEDED"] = 3] = "OUTCOME_DEADLINE_EXCEEDED";
  return Outcome2;
})(Outcome || {});
export var Mode = /* @__PURE__ */ ((Mode2) => {
  Mode2[Mode2["MODE_UNSPECIFIED"] = 0] = "MODE_UNSPECIFIED";
  Mode2[Mode2["AUTO"] = 1] = "AUTO";
  Mode2[Mode2["ANY"] = 2] = "ANY";
  Mode2[Mode2["NONE"] = 3] = "NONE";
  return Mode2;
})(Mode || {});
//# sourceMappingURL=GcaTypes.js.map
