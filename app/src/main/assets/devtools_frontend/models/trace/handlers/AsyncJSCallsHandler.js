"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as Types from "../types/types.js";
import { data as flowsHandlerData } from "./FlowsHandler.js";
import { data as rendererHandlerData } from "./RendererHandler.js";
let schedulerToRunEntryPoints = /* @__PURE__ */ new Map();
let taskScheduleForTaskRunEvent = /* @__PURE__ */ new Map();
let asyncCallToScheduler = /* @__PURE__ */ new Map();
let runEntryPointToScheduler = /* @__PURE__ */ new Map();
export function reset() {
  schedulerToRunEntryPoints = /* @__PURE__ */ new Map();
  asyncCallToScheduler = /* @__PURE__ */ new Map();
  taskScheduleForTaskRunEvent = /* @__PURE__ */ new Map();
  runEntryPointToScheduler = /* @__PURE__ */ new Map();
}
export function handleEvent(_) {
}
export async function finalize() {
  const { flows } = flowsHandlerData();
  const { entryToNode } = rendererHandlerData();
  for (const flow of flows) {
    let maybeAsyncTaskScheduled = flow.at(0);
    if (!maybeAsyncTaskScheduled) {
      continue;
    }
    if (Types.Events.isDebuggerAsyncTaskRun(maybeAsyncTaskScheduled)) {
      maybeAsyncTaskScheduled = taskScheduleForTaskRunEvent.get(maybeAsyncTaskScheduled);
    }
    if (!maybeAsyncTaskScheduled || !Types.Events.isDebuggerAsyncTaskScheduled(maybeAsyncTaskScheduled)) {
      continue;
    }
    const taskName = maybeAsyncTaskScheduled.args.taskName;
    const asyncTaskRun = flow.at(1);
    if (!asyncTaskRun || !Types.Events.isDebuggerAsyncTaskRun(asyncTaskRun)) {
      continue;
    }
    taskScheduleForTaskRunEvent.set(asyncTaskRun, maybeAsyncTaskScheduled);
    const asyncCaller = findNearestJSAncestor(maybeAsyncTaskScheduled, entryToNode);
    const asyncEntryPoint = findFirstJsInvocationForAsyncTaskRun(asyncTaskRun, entryToNode);
    runEntryPointToScheduler.set(
      asyncEntryPoint || asyncTaskRun,
      { taskName, scheduler: asyncCaller || maybeAsyncTaskScheduled }
    );
    if (!asyncCaller || !asyncEntryPoint) {
      continue;
    }
    const entryPoints = Platform.MapUtilities.getWithDefault(schedulerToRunEntryPoints, asyncCaller, () => []);
    entryPoints.push(asyncEntryPoint);
    const scheduledProfileCalls = findFirstJSCallsForAsyncTaskRun(asyncTaskRun, entryToNode);
    for (const call of scheduledProfileCalls) {
      asyncCallToScheduler.set(call, { taskName, scheduler: asyncCaller });
    }
  }
}
function findNearestJSAncestor(asyncTaskScheduled, entryToNode) {
  let node = entryToNode.get(asyncTaskScheduled)?.parent;
  while (node) {
    if (Types.Events.isProfileCall(node.entry) || acceptJSInvocationsPredicate(node.entry)) {
      return node.entry;
    }
    node = node.parent;
  }
  return null;
}
function acceptJSInvocationsPredicate(event) {
  const eventIsConsoleRunTask = Types.Events.isConsoleRunTask(event);
  const eventIsV8EntryPoint = event.name.startsWith("v8") || event.name.startsWith("V8");
  return Types.Events.isJSInvocationEvent(event) && (eventIsConsoleRunTask || !eventIsV8EntryPoint);
}
function findFirstJsInvocationForAsyncTaskRun(asyncTaskRun, entryToNode) {
  return findFirstDescendantsOfType(
    asyncTaskRun,
    entryToNode,
    acceptJSInvocationsPredicate,
    Types.Events.isDebuggerAsyncTaskRun
  ).at(0);
}
function findFirstJSCallsForAsyncTaskRun(asyncTaskRun, entryToNode) {
  return findFirstDescendantsOfType(
    asyncTaskRun,
    entryToNode,
    Types.Events.isProfileCall,
    Types.Events.isDebuggerAsyncTaskRun
  );
}
function findFirstDescendantsOfType(root, entryToNode, predicateAccept, predicateIgnore) {
  const node = entryToNode.get(root);
  if (!node) {
    return [];
  }
  const childrenGroups = [[...node.children]];
  const firstDescendants = [];
  for (let i = 0; i < childrenGroups.length; i++) {
    const siblings = childrenGroups[i];
    for (let j = 0; j < siblings.length; j++) {
      const node2 = siblings[j];
      if (predicateAccept(node2.entry)) {
        firstDescendants.push(node2.entry);
      } else if (!predicateIgnore(node2.entry)) {
        childrenGroups.push([...node2.children]);
      }
    }
  }
  return firstDescendants;
}
export function data() {
  return {
    schedulerToRunEntryPoints,
    asyncCallToScheduler,
    runEntryPointToScheduler
  };
}
export function deps() {
  return ["Renderer", "Flows"];
}
//# sourceMappingURL=AsyncJSCallsHandler.js.map
