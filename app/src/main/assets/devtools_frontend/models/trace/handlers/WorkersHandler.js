"use strict";
import * as Types from "../types/types.js";
let sessionIdEvents = [];
let workerIdByThread = /* @__PURE__ */ new Map();
let workerURLById = /* @__PURE__ */ new Map();
export function reset() {
  sessionIdEvents = [];
  workerIdByThread = /* @__PURE__ */ new Map();
  workerURLById = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isTracingSessionIdForWorker(event)) {
    sessionIdEvents.push(event);
  }
}
export async function finalize() {
  for (const sessionIdEvent of sessionIdEvents) {
    if (!sessionIdEvent.args.data) {
      continue;
    }
    workerIdByThread.set(sessionIdEvent.args.data.workerThreadId, sessionIdEvent.args.data.workerId);
    workerURLById.set(sessionIdEvent.args.data.workerId, sessionIdEvent.args.data.url);
  }
}
export function data() {
  return {
    workerSessionIdEvents: sessionIdEvents,
    workerIdByThread,
    workerURLById
  };
}
//# sourceMappingURL=WorkersHandler.js.map
