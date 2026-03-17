"use strict";
export class TraceLoadEvent extends Event {
  constructor(duration) {
    super(TraceLoadEvent.eventName, { bubbles: true, composed: true });
    this.duration = duration;
  }
  static eventName = "traceload";
}
//# sourceMappingURL=BenchmarkEvents.js.map
