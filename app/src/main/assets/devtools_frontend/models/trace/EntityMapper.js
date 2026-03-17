"use strict";
import * as Handlers from "./handlers/handlers.js";
import * as Helpers from "./helpers/helpers.js";
export class EntityMapper {
  #parsedTrace;
  #entityMappings;
  #firstPartyEntity;
  #thirdPartyEvents = [];
  /**
   * When resolving urls and updating our entity mapping in the
   * SourceMapsResolver, a single call frame can appear multiple times
   * as different cpu profile nodes. To avoid duplicate work on the
   * same CallFrame, we can keep track of them.
   */
  #resolvedCallFrames = /* @__PURE__ */ new Set();
  constructor(parsedTrace) {
    this.#parsedTrace = parsedTrace;
    this.#entityMappings = this.#parsedTrace.data.Renderer.entityMappings;
    this.#firstPartyEntity = this.#findFirstPartyEntity();
    this.#thirdPartyEvents = this.#getThirdPartyEvents();
  }
  #findFirstPartyEntity() {
    const nav = Array.from(this.#parsedTrace.data.Meta.navigationsByNavigationId.values()).sort((a, b) => a.ts - b.ts)[0];
    const firstPartyUrl = nav?.args.data?.documentLoaderURL ?? this.#parsedTrace.data.Meta.mainFrameURL;
    if (!firstPartyUrl) {
      return null;
    }
    return Handlers.Helpers.getEntityForUrl(firstPartyUrl, this.#entityMappings) ?? null;
  }
  #getThirdPartyEvents() {
    const entries = Array.from(this.#entityMappings.eventsByEntity.entries());
    const thirdPartyEvents = entries.flatMap(([entity, events]) => {
      return entity !== this.#firstPartyEntity ? events : [];
    });
    return thirdPartyEvents;
  }
  /**
   * Returns an entity for a given event if any.
   */
  entityForEvent(event) {
    return this.#entityMappings.entityByEvent.get(event) ?? null;
  }
  /**
   * Returns trace events that correspond with a given entity if any.
   */
  eventsForEntity(entity) {
    return this.#entityMappings.eventsByEntity.get(entity) ?? [];
  }
  firstPartyEntity() {
    return this.#firstPartyEntity;
  }
  thirdPartyEvents() {
    return this.#thirdPartyEvents;
  }
  mappings() {
    return this.#entityMappings;
  }
  /**
   * This updates entity mapping given a callFrame and sourceURL (newly resolved),
   * updating both eventsByEntity and entityByEvent. The call frame provides us the
   * URL and sourcemap source location that events map to. This describes the exact events we
   * want to update. We then update the events with the new sourceURL.
   *
   * compiledURLs -> the actual file's url (e.g. my-big-bundle.min.js)
   * sourceURLs -> the resolved urls (e.g. react.development.js, my-app.ts)
   * @param callFrame
   * @param sourceURL
   */
  updateSourceMapEntities(callFrame, sourceURL) {
    if (this.#resolvedCallFrames.has(callFrame)) {
      return;
    }
    const compiledURL = callFrame.url;
    const currentEntity = Handlers.Helpers.getEntityForUrl(compiledURL, this.#entityMappings);
    const resolvedEntity = Handlers.Helpers.getEntityForUrl(sourceURL, this.#entityMappings);
    if (resolvedEntity === currentEntity || (!currentEntity || !resolvedEntity)) {
      return;
    }
    const currentEntityEvents = (currentEntity && this.#entityMappings.eventsByEntity.get(currentEntity)) ?? [];
    const sourceLocationEvents = [];
    const unrelatedEvents = [];
    currentEntityEvents?.forEach((e) => {
      const cf = Helpers.Trace.getStackTraceTopCallFrameInEventPayload(e);
      const matchesCallFrame = cf && Helpers.Trace.isMatchingCallFrame(cf, callFrame);
      if (matchesCallFrame) {
        sourceLocationEvents.push(e);
      } else {
        unrelatedEvents.push(e);
      }
    });
    this.#entityMappings.eventsByEntity.set(currentEntity, unrelatedEvents);
    this.#entityMappings.eventsByEntity.set(resolvedEntity, sourceLocationEvents);
    sourceLocationEvents.forEach((e) => {
      this.#entityMappings.entityByEvent.set(e, resolvedEntity);
    });
    this.#resolvedCallFrames.add(callFrame);
  }
  // Update entities with proper Chrome Extension names.
  updateExtensionEntitiesWithName(executionContextNamesByOrigin) {
    const entities = Array.from(this.#entityMappings.eventsByEntity.keys());
    for (const [origin, name] of executionContextNamesByOrigin) {
      const entity = entities.find((e) => e.domains[0] === origin);
      if (entity) {
        entity.name = entity.company = name;
      }
    }
  }
}
//# sourceMappingURL=EntityMapper.js.map
