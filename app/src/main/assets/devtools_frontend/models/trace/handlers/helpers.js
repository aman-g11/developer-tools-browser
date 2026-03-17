"use strict";
import * as ThirdPartyWeb from "../../../third_party/third-party-web/third-party-web.js";
import * as Types from "../types/types.js";
export function getEntityForEvent(event, entityMappings) {
  const url = getNonResolvedURL(event);
  if (!url) {
    return;
  }
  return getEntityForUrl(url, entityMappings);
}
export function getEntityForUrl(url, entityMappings) {
  const cachedByUrl = entityMappings.entityByUrlCache.get(url);
  if (cachedByUrl) {
    return cachedByUrl;
  }
  const entity = ThirdPartyWeb.ThirdPartyWeb.getEntity(url) ?? makeUpEntity(entityMappings.createdEntityCache, url);
  if (entity) {
    entityMappings.entityByUrlCache.set(url, entity);
  }
  return entity;
}
export function getNonResolvedURL(entry, handlerData) {
  if (Types.Events.isProfileCall(entry)) {
    return entry.callFrame.url;
  }
  if (Types.Events.isSyntheticNetworkRequest(entry)) {
    return entry.args.data.url;
  }
  if (Types.Events.isParseAuthorStyleSheetEvent(entry) && entry.args) {
    return entry.args.data.stylesheetUrl;
  }
  if (entry.args?.data?.stackTrace && entry.args.data.stackTrace.length > 0) {
    return entry.args.data.stackTrace[0].url;
  }
  if (Types.Events.isParseHTML(entry)) {
    return entry.args.beginData.url;
  }
  if (handlerData) {
    if (Types.Events.isDecodeImage(entry)) {
      const paintEvent = handlerData.ImagePainting.paintImageForEvent.get(entry);
      return paintEvent ? getNonResolvedURL(paintEvent, handlerData) : null;
    }
    if (Types.Events.isDrawLazyPixelRef(entry) && entry.args?.LazyPixelRef) {
      const paintEvent = handlerData.ImagePainting.paintImageByDrawLazyPixelRef.get(entry.args.LazyPixelRef);
      return paintEvent ? getNonResolvedURL(paintEvent, handlerData) : null;
    }
  }
  if (entry.args?.data?.url) {
    return entry.args.data.url;
  }
  const requestId = entry.args?.data?.requestId;
  if (handlerData && requestId) {
    const url = handlerData.NetworkRequests.byId.get(requestId)?.args.data.url;
    if (url) {
      return url;
    }
  }
  return null;
}
export function makeUpEntity(entityCache, url) {
  if (url.startsWith("chrome-extension:")) {
    return makeUpChromeExtensionEntity(entityCache, url);
  }
  if (!url.startsWith("http")) {
    return;
  }
  const rootDomain = ThirdPartyWeb.ThirdPartyWeb.getRootDomain(url);
  if (!rootDomain) {
    return;
  }
  if (entityCache.has(rootDomain)) {
    return entityCache.get(rootDomain);
  }
  const unrecognizedEntity = {
    name: rootDomain,
    company: rootDomain,
    category: "",
    categories: [],
    domains: [rootDomain],
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    totalOccurrences: 0,
    isUnrecognized: true
  };
  entityCache.set(rootDomain, unrecognizedEntity);
  return unrecognizedEntity;
}
function getChromeExtensionOrigin(url) {
  return url.protocol + "//" + url.host;
}
function makeUpChromeExtensionEntity(entityCache, url, extensionName) {
  const parsedUrl = new URL(url);
  const origin = getChromeExtensionOrigin(parsedUrl);
  const host = new URL(origin).host;
  const name = extensionName || host;
  const cachedEntity = entityCache.get(origin);
  if (cachedEntity) {
    return cachedEntity;
  }
  const chromeExtensionEntity = {
    name,
    company: name,
    category: "Chrome Extension",
    homepage: "https://chromewebstore.google.com/detail/" + host,
    categories: [],
    domains: [origin],
    averageExecutionTime: 0,
    totalExecutionTime: 0,
    totalOccurrences: 0
  };
  entityCache.set(origin, chromeExtensionEntity);
  return chromeExtensionEntity;
}
export function addEventToEntityMapping(event, entityMappings) {
  if (entityMappings.entityByEvent.has(event)) {
    return;
  }
  const entity = getEntityForEvent(event, entityMappings);
  if (!entity) {
    return;
  }
  const mappedEvents = entityMappings.eventsByEntity.get(entity);
  if (mappedEvents) {
    mappedEvents.push(event);
  } else {
    entityMappings.eventsByEntity.set(entity, [event]);
  }
  entityMappings.entityByEvent.set(event, entity);
}
export function addNetworkRequestToEntityMapping(networkRequest, entityMappings, requestTraceEvents) {
  const entity = getEntityForEvent(networkRequest, entityMappings);
  if (!entity) {
    return;
  }
  const eventsToMap = [networkRequest, ...Object.values(requestTraceEvents).flat()];
  const mappedEvents = entityMappings.eventsByEntity.get(entity);
  if (mappedEvents) {
    mappedEvents.push(...eventsToMap);
  } else {
    entityMappings.eventsByEntity.set(entity, eventsToMap);
  }
  for (const evt of eventsToMap) {
    entityMappings.entityByEvent.set(evt, entity);
  }
}
//# sourceMappingURL=helpers.js.map
