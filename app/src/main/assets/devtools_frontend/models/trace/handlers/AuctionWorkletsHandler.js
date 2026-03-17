"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
let runningInProcessEvents = /* @__PURE__ */ new Map();
let doneWithProcessEvents = /* @__PURE__ */ new Map();
let createdSyntheticEvents = /* @__PURE__ */ new Map();
let utilityThreads = /* @__PURE__ */ new Map();
let v8HelperThreads = /* @__PURE__ */ new Map();
export function reset() {
  runningInProcessEvents = /* @__PURE__ */ new Map();
  doneWithProcessEvents = /* @__PURE__ */ new Map();
  createdSyntheticEvents = /* @__PURE__ */ new Map();
  utilityThreads = /* @__PURE__ */ new Map();
  v8HelperThreads = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isAuctionWorkletRunningInProcess(event)) {
    runningInProcessEvents.set(event.args.data.pid, event);
    return;
  }
  if (Types.Events.isAuctionWorkletDoneWithProcess(event)) {
    doneWithProcessEvents.set(event.args.data.pid, event);
    return;
  }
  if (Types.Events.isThreadName(event)) {
    if (event.args.name === "auction_worklet.CrUtilityMain") {
      utilityThreads.set(event.pid, event);
      return;
    }
    if (event.args.name === "AuctionV8HelperThread") {
      v8HelperThreads.set(event.pid, event);
    }
  }
}
function workletType(input) {
  switch (input) {
    case "seller":
      return Types.Events.AuctionWorkletType.SELLER;
    case "bidder":
      return Types.Events.AuctionWorkletType.BIDDER;
    default:
      return Types.Events.AuctionWorkletType.UNKNOWN;
  }
}
function makeSyntheticEventBase(event) {
  return Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
    rawSourceEvent: event,
    name: "SyntheticAuctionWorklet",
    s: Types.Events.Scope.THREAD,
    cat: event.cat,
    tid: event.tid,
    ts: event.ts,
    ph: Types.Events.Phase.INSTANT,
    pid: event.args.data.pid,
    host: event.args.data.host,
    target: event.args.data.target,
    type: workletType(event.args.data.type)
  });
}
export async function finalize() {
  for (const [pid, utilityThreadNameEvent] of utilityThreads) {
    const v8HelperEvent = v8HelperThreads.get(pid);
    if (!v8HelperEvent) {
      continue;
    }
    const runningEvent = runningInProcessEvents.get(pid);
    const doneWithEvent = doneWithProcessEvents.get(pid);
    let syntheticEvent = null;
    if (runningEvent) {
      syntheticEvent = {
        ...makeSyntheticEventBase(runningEvent),
        args: {
          data: {
            runningInProcessEvent: runningEvent,
            utilityThread: utilityThreadNameEvent,
            v8HelperThread: v8HelperEvent
          }
        }
      };
      if (doneWithEvent) {
        syntheticEvent.args.data.doneWithProcessEvent = doneWithEvent;
      }
    } else if (doneWithEvent) {
      syntheticEvent = {
        ...makeSyntheticEventBase(doneWithEvent),
        args: {
          data: {
            doneWithProcessEvent: doneWithEvent,
            utilityThread: utilityThreadNameEvent,
            v8HelperThread: v8HelperEvent
          }
        }
      };
      if (runningEvent) {
        syntheticEvent.args.data.runningInProcessEvent = runningEvent;
      }
    }
    if (syntheticEvent === null) {
      continue;
    }
    createdSyntheticEvents.set(pid, syntheticEvent);
  }
}
export function data() {
  return {
    worklets: createdSyntheticEvents
  };
}
//# sourceMappingURL=AuctionWorkletsHandler.js.map
