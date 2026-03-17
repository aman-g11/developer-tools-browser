"use strict";
import * as Handlers from "../handlers/handlers.js";
const ABSOLUTE_SIZE_THRESHOLD_BYTES = 1024 * 0.5;
const RELATIVE_SIZE_THRESHOLD = 0.1;
export function normalizeSource(source) {
  source = source.replace(/\?$/, "");
  const lastNodeModulesIndex = source.lastIndexOf("node_modules");
  if (lastNodeModulesIndex !== -1) {
    source = source.substring(lastNodeModulesIndex);
  }
  return source;
}
function shouldIgnoreSource(source) {
  if (source.includes("webpack/bootstrap")) {
    return true;
  }
  if (source.includes("(webpack)/buildin")) {
    return true;
  }
  if (source.includes("external ")) {
    return true;
  }
  return false;
}
export function normalizeDuplication(duplication) {
  for (const [key, data] of duplication) {
    data.duplicates.sort((a, b) => b.attributedSize - a.attributedSize);
    if (data.duplicates.length > 1) {
      const largestResourceSize = data.duplicates[0].attributedSize;
      data.duplicates = data.duplicates.filter((duplicate) => {
        const percentSize = duplicate.attributedSize / largestResourceSize;
        return percentSize >= RELATIVE_SIZE_THRESHOLD;
      });
    }
    data.duplicates = data.duplicates.filter((duplicate) => duplicate.attributedSize >= ABSOLUTE_SIZE_THRESHOLD_BYTES);
    if (data.duplicates.length <= 1) {
      duplication.delete(key);
      continue;
    }
    data.estimatedDuplicateBytes = data.duplicates.slice(1).reduce((acc, cur) => acc + cur.attributedSize, 0);
  }
}
function indexOfOrLength(haystack, needle, startPosition = 0) {
  const index = haystack.indexOf(needle, startPosition);
  return index === -1 ? haystack.length : index;
}
export function getNodeModuleName(source) {
  const sourceSplit = source.split("node_modules/");
  source = sourceSplit[sourceSplit.length - 1];
  const indexFirstSlash = indexOfOrLength(source, "/");
  if (source[0] === "@") {
    return source.slice(0, indexOfOrLength(source, "/", indexFirstSlash + 1));
  }
  return source.slice(0, indexFirstSlash);
}
function groupByNodeModules(duplication) {
  const groupedDuplication = /* @__PURE__ */ new Map();
  for (const [source, data] of duplication) {
    if (!source.includes("node_modules")) {
      groupedDuplication.set(source, data);
      continue;
    }
    const nodeModuleKey = "node_modules/" + getNodeModuleName(source);
    const aggregatedData = groupedDuplication.get(nodeModuleKey) ?? {
      duplicates: [],
      // This is calculated in normalizeDuplication.
      estimatedDuplicateBytes: 0
    };
    groupedDuplication.set(nodeModuleKey, aggregatedData);
    for (const { script, attributedSize } of data.duplicates) {
      let duplicate = aggregatedData.duplicates.find((d) => d.script === script);
      if (!duplicate) {
        duplicate = { script, attributedSize: 0 };
        aggregatedData.duplicates.push(duplicate);
      }
      duplicate.attributedSize += attributedSize;
    }
  }
  return groupedDuplication;
}
function sorted(duplication) {
  return new Map([...duplication].sort((a, b) => b[1].estimatedDuplicateBytes - a[1].estimatedDuplicateBytes));
}
export function computeScriptDuplication(scriptsData, compressionRatios) {
  const sourceDatasMap = /* @__PURE__ */ new Map();
  for (const script of scriptsData.scripts) {
    if (!script.content || !script.sourceMap) {
      continue;
    }
    const sizes = Handlers.ModelHandlers.Scripts.getScriptGeneratedSizes(script);
    if (!sizes) {
      continue;
    }
    if ("errorMessage" in sizes) {
      console.error(sizes.errorMessage);
      continue;
    }
    const sourceDataArray = [];
    sourceDatasMap.set(script, sourceDataArray);
    const sources = script.sourceMap.sourceURLs();
    for (let i = 0; i < sources.length; i++) {
      if (shouldIgnoreSource(sources[i])) {
        continue;
      }
      const sourceSize = sizes.files[sources[i]];
      sourceDataArray.push({
        source: normalizeSource(sources[i]),
        resourceSize: sourceSize
      });
    }
  }
  const duplication = /* @__PURE__ */ new Map();
  for (const [script, sourceDataArray] of sourceDatasMap) {
    for (const sourceData of sourceDataArray) {
      let data = duplication.get(sourceData.source);
      if (!data) {
        data = { estimatedDuplicateBytes: 0, duplicates: [] };
        duplication.set(sourceData.source, data);
      }
      const compressionRatio = script.request ? compressionRatios.get(script.request?.args.data.requestId) ?? 1 : 1;
      const transferSize = Math.round(sourceData.resourceSize * compressionRatio);
      data.duplicates.push({
        script,
        attributedSize: transferSize
      });
    }
  }
  const duplicationGroupedByNodeModules = groupByNodeModules(duplication);
  normalizeDuplication(duplication);
  normalizeDuplication(duplicationGroupedByNodeModules);
  return {
    duplication: sorted(duplication),
    duplicationGroupedByNodeModules: sorted(duplicationGroupedByNodeModules)
  };
}
//# sourceMappingURL=ScriptDuplication.js.map
