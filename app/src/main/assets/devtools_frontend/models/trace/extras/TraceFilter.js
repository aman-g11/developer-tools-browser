"use strict";
import * as Types from "../types/types.js";
export class TraceFilter {
}
export class VisibleEventsFilter extends TraceFilter {
  visibleTypes;
  constructor(visibleTypes) {
    super();
    this.visibleTypes = new Set(visibleTypes);
  }
  accept(event) {
    if (Types.Extensions.isSyntheticExtensionEntry(event)) {
      return true;
    }
    return this.visibleTypes.has(VisibleEventsFilter.eventType(event));
  }
  static eventType(event) {
    if (event.cat.includes("blink.console")) {
      return Types.Events.Name.CONSOLE_TIME;
    }
    if (event.cat.includes("blink.user_timing")) {
      return Types.Events.Name.USER_TIMING;
    }
    return event.name;
  }
}
export class InvisibleEventsFilter extends TraceFilter {
  #invisibleTypes;
  constructor(invisibleTypes) {
    super();
    this.#invisibleTypes = new Set(invisibleTypes);
  }
  accept(event) {
    return !this.#invisibleTypes.has(VisibleEventsFilter.eventType(event));
  }
}
export class ExclusiveNameFilter extends TraceFilter {
  #excludeNames;
  constructor(excludeNames) {
    super();
    this.#excludeNames = new Set(excludeNames);
  }
  accept(event) {
    return !this.#excludeNames.has(event.name);
  }
}
//# sourceMappingURL=TraceFilter.js.map
