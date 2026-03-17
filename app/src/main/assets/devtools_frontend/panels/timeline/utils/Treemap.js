"use strict";
import * as Common from "../../../core/common/common.js";
import * as i18n from "../../../core/i18n/i18n.js";
import * as Trace from "../../../models/trace/trace.js";
async function toCompressedBase64(string) {
  const compAb = await Common.Gzip.compress(string);
  const strb64 = await Common.Base64.encode(compAb);
  return strb64;
}
async function openTabWithUrlData(data, urlString, windowName) {
  const url = new URL(urlString);
  url.hash = await toCompressedBase64(JSON.stringify(data));
  url.searchParams.set("gzip", "1");
  window.open(url.toString(), windowName);
}
export function openTreemap(treemapData, mainDocumentUrl, windowNameSuffix) {
  const treemapOptions = {
    lhr: {
      mainDocumentUrl,
      audits: {
        "script-treemap-data": {
          details: {
            type: "treemap-data",
            nodes: treemapData
          }
        }
      },
      configSettings: {
        locale: i18n.DevToolsLocale.DevToolsLocale.instance().locale
      }
    },
    initialView: "duplicate-modules"
  };
  const url = "https://googlechrome.github.io/lighthouse/treemap/";
  const windowName = `treemap-${windowNameSuffix}`;
  void openTabWithUrlData(treemapOptions, url, windowName);
}
export function makeScriptNode(src, sourceRoot, sourcesData) {
  function newNode(name) {
    return {
      name,
      resourceBytes: 0
    };
  }
  const sourceRootNode = newNode(sourceRoot);
  function addAllNodesInSourcePath(source, data) {
    let node = sourceRootNode;
    sourceRootNode.resourceBytes += data.resourceBytes;
    const sourcePathSegments = source.replace(sourceRoot, "").split(/\/+/);
    sourcePathSegments.forEach((sourcePathSegment, i) => {
      if (sourcePathSegment.length === 0) {
        return;
      }
      const isLeaf = i === sourcePathSegments.length - 1;
      let child = node.children?.find((child2) => child2.name === sourcePathSegment);
      if (!child) {
        child = newNode(sourcePathSegment);
        node.children = node.children || [];
        node.children.push(child);
      }
      node = child;
      node.resourceBytes += data.resourceBytes;
      if (isLeaf && data.duplicatedNormalizedModuleName !== void 0) {
        node.duplicatedNormalizedModuleName = data.duplicatedNormalizedModuleName;
      }
    });
  }
  for (const [source, data] of Object.entries(sourcesData)) {
    addAllNodesInSourcePath(source, data);
  }
  function collapseAll(node) {
    while (node.children?.length === 1) {
      const child = node.children[0];
      node.name += "/" + child.name;
      if (child.duplicatedNormalizedModuleName) {
        node.duplicatedNormalizedModuleName = child.duplicatedNormalizedModuleName;
      }
      node.children = child.children;
    }
    if (node.children) {
      for (const child of node.children) {
        collapseAll(child);
      }
    }
  }
  collapseAll(sourceRootNode);
  if (!sourceRootNode.name) {
    return {
      ...sourceRootNode,
      name: src,
      children: sourceRootNode.children
    };
  }
  const scriptNode = { ...sourceRootNode };
  scriptNode.name = src;
  scriptNode.children = [sourceRootNode];
  return scriptNode;
}
function getNetworkRequestSizes(request) {
  const resourceSize = request.args.data.decodedBodyLength;
  const transferSize = request.args.data.encodedDataLength;
  const headersTransferSize = 0;
  return { resourceSize, transferSize, headersTransferSize };
}
export function createTreemapData(scripts, duplication) {
  const nodes = [];
  const htmlNodesByFrameId = /* @__PURE__ */ new Map();
  for (const script of scripts.scripts) {
    if (!script.url) {
      continue;
    }
    const name = script.url;
    const sizes = Trace.Handlers.ModelHandlers.Scripts.getScriptGeneratedSizes(script);
    let node;
    if (script.sourceMap && sizes && !("errorMessage" in sizes)) {
      const sourcesData = {};
      for (const [source, resourceBytes] of Object.entries(sizes.files)) {
        const sourceData = {
          resourceBytes
        };
        const key = Trace.Extras.ScriptDuplication.normalizeSource(source);
        if (duplication.has(key)) {
          sourceData.duplicatedNormalizedModuleName = key;
        }
        sourcesData[source] = sourceData;
      }
      if (sizes.unmappedBytes) {
        const sourceData = {
          resourceBytes: sizes.unmappedBytes
        };
        sourcesData["(unmapped)"] = sourceData;
      }
      node = makeScriptNode(script.url, script.url, sourcesData);
    } else {
      node = {
        name,
        resourceBytes: script.content?.length ?? 0
      };
    }
    if (script.inline) {
      let htmlNode = htmlNodesByFrameId.get(script.frame);
      if (!htmlNode) {
        htmlNode = {
          name,
          resourceBytes: 0,
          children: []
        };
        htmlNodesByFrameId.set(script.frame, htmlNode);
        nodes.push(htmlNode);
      }
      htmlNode.resourceBytes += node.resourceBytes;
      node.name = script.content ? "(inline) " + script.content.trimStart().substring(0, 15) + "\u2026" : "(inline)";
      htmlNode.children?.push(node);
    } else {
      nodes.push(node);
      if (script.request) {
        const { transferSize, headersTransferSize } = getNetworkRequestSizes(script.request);
        const bodyTransferSize = transferSize - headersTransferSize;
        node.encodedBytes = bodyTransferSize;
      } else {
        node.encodedBytes = node.resourceBytes;
      }
    }
  }
  for (const [frameId, node] of htmlNodesByFrameId) {
    const script = scripts.scripts.find(
      (s) => s.request?.args.data.resourceType === "Document" && s.request?.args.data.frame === frameId
    );
    if (script?.request) {
      const { resourceSize, transferSize, headersTransferSize } = getNetworkRequestSizes(script.request);
      const inlineScriptsPct = node.resourceBytes / resourceSize;
      const bodyTransferSize = transferSize - headersTransferSize;
      node.encodedBytes = Math.floor(bodyTransferSize * inlineScriptsPct);
    } else {
      node.encodedBytes = node.resourceBytes;
    }
  }
  return nodes;
}
//# sourceMappingURL=Treemap.js.map
