"use strict";
import { TracingManager } from "./TracingManager.js";
export class PerformanceTracing {
  #traceEvents = [];
  #tracingManager = null;
  #delegate;
  constructor(target, delegate) {
    this.#tracingManager = target.model(TracingManager);
    this.#delegate = delegate;
  }
  async start() {
    this.#traceEvents.length = 0;
    if (!this.#tracingManager) {
      throw new Error("No tracing manager");
    }
    const categories = [
      "-*",
      "blink.console",
      "blink.user_timing",
      "devtools.timeline",
      "disabled-by-default-devtools.screenshot",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.invalidationTracking",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-devtools.timeline.stack",
      "disabled-by-default-v8.cpu_profiler",
      "disabled-by-default-v8.cpu_profiler.hires",
      "latencyInfo",
      "loading",
      "disabled-by-default-lighthouse",
      "v8.execute",
      "v8"
    ].join(",");
    const started = await this.#tracingManager.start(this, categories);
    if (!started) {
      throw new Error("Unable to start tracing.");
    }
  }
  async stop() {
    return this.#tracingManager?.stop();
  }
  // Start of implementation of SDK.TracingManager.TracingManagerClient
  traceEventsCollected(events) {
    this.#traceEvents.push(...events);
  }
  tracingBufferUsage(usage) {
    this.#delegate.tracingBufferUsage(usage);
  }
  eventsRetrievalProgress(progress) {
    this.#delegate.eventsRetrievalProgress(progress);
  }
  tracingComplete() {
    this.#delegate.tracingComplete(this.#traceEvents);
  }
  // End of implementation of SDK.TracingManager.TracingManagerClient
}
export class RawTraceEvents {
  constructor(events) {
    this.events = events;
  }
  getEvents() {
    return this.events;
  }
}
//# sourceMappingURL=PerformanceTracing.js.map
