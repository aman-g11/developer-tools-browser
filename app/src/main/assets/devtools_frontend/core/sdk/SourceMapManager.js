"use strict";
import * as Common from "../common/common.js";
import * as Platform from "../platform/platform.js";
import { PageResourceLoader } from "./PageResourceLoader.js";
import { parseSourceMap, SourceMap } from "./SourceMap.js";
import { SourceMapCache } from "./SourceMapCache.js";
import { Type } from "./Target.js";
export class SourceMapManager extends Common.ObjectWrapper.ObjectWrapper {
  #target;
  #factory;
  #isEnabled = true;
  #clientData = /* @__PURE__ */ new Map();
  #sourceMaps = /* @__PURE__ */ new Map();
  #attachingClient = null;
  constructor(target, factory) {
    super();
    this.#target = target;
    this.#factory = factory ?? ((compiledURL, sourceMappingURL, payload) => new SourceMap(compiledURL, sourceMappingURL, payload));
  }
  setEnabled(isEnabled) {
    if (isEnabled === this.#isEnabled) {
      return;
    }
    const clientData = [...this.#clientData.entries()];
    for (const [client] of clientData) {
      this.detachSourceMap(client);
    }
    this.#isEnabled = isEnabled;
    for (const [client, { relativeSourceURL, relativeSourceMapURL }] of clientData) {
      this.attachSourceMap(client, relativeSourceURL, relativeSourceMapURL);
    }
  }
  static getBaseUrl(target) {
    while (target && target.type() !== Type.FRAME) {
      target = target.parentTarget();
    }
    return target?.inspectedURL() ?? Platform.DevToolsPath.EmptyUrlString;
  }
  static resolveRelativeSourceURL(target, url) {
    url = Common.ParsedURL.ParsedURL.completeURL(SourceMapManager.getBaseUrl(target), url) ?? url;
    return url;
  }
  sourceMapForClient(client) {
    return this.#clientData.get(client)?.sourceMap;
  }
  // This method actively awaits the source map, if still loading.
  sourceMapForClientPromise(client) {
    const clientData = this.#clientData.get(client);
    if (!clientData) {
      return Promise.resolve(void 0);
    }
    return clientData.sourceMapPromise;
  }
  clientForSourceMap(sourceMap) {
    return this.#sourceMaps.get(sourceMap);
  }
  // TODO(bmeurer): We are lying about the type of |relativeSourceURL| here.
  attachSourceMap(client, relativeSourceURL, relativeSourceMapURL) {
    if (this.#clientData.has(client)) {
      throw new Error("SourceMap is already attached or being attached to client");
    }
    if (!relativeSourceMapURL) {
      return;
    }
    let clientData = {
      relativeSourceURL,
      relativeSourceMapURL,
      sourceMapPromise: Promise.resolve(void 0)
    };
    if (this.#isEnabled) {
      const sourceURL = SourceMapManager.resolveRelativeSourceURL(this.#target, relativeSourceURL);
      const sourceMapURL = Common.ParsedURL.ParsedURL.completeURL(sourceURL, relativeSourceMapURL);
      if (sourceMapURL) {
        if (this.#attachingClient) {
          console.error("Attaching source map may cancel previously attaching source map");
        }
        this.#attachingClient = client;
        this.dispatchEventToListeners("SourceMapWillAttach" /* SourceMapWillAttach */, { client });
        if (this.#attachingClient === client) {
          this.#attachingClient = null;
          const initiator = client.createPageResourceLoadInitiator();
          const resourceLoader = this.#target.targetManager().context.get(PageResourceLoader);
          clientData.sourceMapPromise = loadSourceMap(resourceLoader, sourceMapURL, client.debugId(), initiator).then(
            (payload) => {
              const sourceMap = this.#factory(sourceURL, sourceMapURL, payload, client);
              if (this.#clientData.get(client) === clientData) {
                clientData.sourceMap = sourceMap;
                this.#sourceMaps.set(sourceMap, client);
                this.dispatchEventToListeners("SourceMapAttached" /* SourceMapAttached */, { client, sourceMap });
              }
              return sourceMap;
            },
            () => {
              if (this.#clientData.get(client) === clientData) {
                this.dispatchEventToListeners("SourceMapFailedToAttach" /* SourceMapFailedToAttach */, { client });
              }
              return void 0;
            }
          );
        } else {
          if (this.#attachingClient) {
            console.error("Cancelling source map attach because another source map is attaching");
          }
          clientData = null;
          this.dispatchEventToListeners("SourceMapFailedToAttach" /* SourceMapFailedToAttach */, { client });
        }
      }
    }
    if (clientData) {
      this.#clientData.set(client, clientData);
    }
  }
  cancelAttachSourceMap(client) {
    if (client === this.#attachingClient) {
      this.#attachingClient = null;
    } else if (this.#attachingClient) {
      console.error("cancel attach source map requested but a different source map was being attached");
    } else {
      console.error("cancel attach source map requested but no source map was being attached");
    }
  }
  detachSourceMap(client) {
    const clientData = this.#clientData.get(client);
    if (!clientData) {
      return;
    }
    this.#clientData.delete(client);
    if (!this.#isEnabled) {
      return;
    }
    const { sourceMap } = clientData;
    if (sourceMap) {
      this.#sourceMaps.delete(sourceMap);
      this.dispatchEventToListeners("SourceMapDetached" /* SourceMapDetached */, { client, sourceMap });
    } else {
      this.dispatchEventToListeners("SourceMapFailedToAttach" /* SourceMapFailedToAttach */, { client });
    }
  }
  waitForSourceMapsProcessedForTest() {
    return Promise.all(this.#sourceMaps.keys().map((sourceMap) => sourceMap.waitForScopeInfo()));
  }
}
async function loadSourceMap(resourceLoader, url, debugId, initiator) {
  try {
    if (debugId) {
      const cachedSourceMap = await SourceMapCache.instance().get(debugId);
      if (cachedSourceMap) {
        return cachedSourceMap;
      }
    }
    const { content } = await resourceLoader.loadResource(url, initiator);
    const sourceMap = parseSourceMap(content);
    if ("debugId" in sourceMap && sourceMap.debugId) {
      await SourceMapCache.instance().set(sourceMap.debugId, sourceMap).catch();
    }
    return sourceMap;
  } catch (cause) {
    throw new Error(`Could not load content for ${url}: ${cause.message}`, { cause });
  }
}
export async function tryLoadSourceMap(resourceLoader, url, initiator) {
  try {
    return await loadSourceMap(resourceLoader, url, null, initiator);
  } catch (cause) {
    console.error(cause);
    return null;
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["SourceMapWillAttach"] = "SourceMapWillAttach";
  Events2["SourceMapFailedToAttach"] = "SourceMapFailedToAttach";
  Events2["SourceMapAttached"] = "SourceMapAttached";
  Events2["SourceMapDetached"] = "SourceMapDetached";
  return Events2;
})(Events || {});
//# sourceMappingURL=SourceMapManager.js.map
