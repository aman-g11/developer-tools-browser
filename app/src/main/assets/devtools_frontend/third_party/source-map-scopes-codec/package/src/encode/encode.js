"use strict";
import { Encoder } from "./encoder.js";
export function encode(scopesInfo, inputSourceMap) {
  inputSourceMap ||= {
    version: 3,
    mappings: "",
    sources: new Array(scopesInfo.scopes.length).fill(null)
  };
  inputSourceMap.names ||= [];
  if (inputSourceMap.sources.length !== scopesInfo.scopes.length) {
    throw new Error(
      `SourceMapJson.sources.length must match ScopesInfo.scopes! ${inputSourceMap.sources.length} vs ${scopesInfo.scopes.length}`
    );
  }
  inputSourceMap.scopes = new Encoder(scopesInfo, inputSourceMap.names).encode();
  return inputSourceMap;
}
//# sourceMappingURL=encode.js.map
