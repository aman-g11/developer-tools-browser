"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
import { data as metaHandlerData } from "./MetaHandler.js";
let eventsInProcessThread = /* @__PURE__ */ new Map();
let mainGPUThreadTasks = [];
export function reset() {
  eventsInProcessThread = /* @__PURE__ */ new Map();
  mainGPUThreadTasks = [];
}
export function handleEvent(event) {
  if (!Types.Events.isGPUTask(event)) {
    return;
  }
  Helpers.Trace.addEventToProcessThread(event, eventsInProcessThread);
}
export async function finalize() {
  const { gpuProcessId, gpuThreadId } = metaHandlerData();
  const gpuThreadsForProcess = eventsInProcessThread.get(gpuProcessId);
  if (gpuThreadsForProcess && gpuThreadId) {
    mainGPUThreadTasks = gpuThreadsForProcess.get(gpuThreadId) || [];
  }
}
export function data() {
  return {
    mainGPUThreadTasks
  };
}
export function deps() {
  return ["Meta"];
}
//# sourceMappingURL=GPUHandler.js.map
