"use strict";
import * as Types from "../types/types.js";
import { eventIsInBounds } from "./Timing.js";
let nodeIdCount = 0;
export const makeTraceEntryNodeId = () => ++nodeIdCount;
export const makeEmptyTraceEntryTree = () => ({
  roots: /* @__PURE__ */ new Set(),
  maxDepth: 0
});
export const makeEmptyTraceEntryNode = (entry, id) => ({
  entry,
  id,
  parent: null,
  children: [],
  depth: 0
});
export function treify(entries, options) {
  const entryToNode = /* @__PURE__ */ new Map();
  const stack = [];
  nodeIdCount = -1;
  const tree = makeEmptyTraceEntryTree();
  for (let i = 0; i < entries.length; i++) {
    const event = entries[i];
    if (options && !options.filter.has(event.name)) {
      continue;
    }
    const duration = event.dur || 0;
    const nodeId = makeTraceEntryNodeId();
    const node = makeEmptyTraceEntryNode(event, nodeId);
    if (stack.length === 0) {
      tree.roots.add(node);
      node.selfTime = Types.Timing.Micro(duration);
      stack.push(node);
      tree.maxDepth = Math.max(tree.maxDepth, stack.length);
      entryToNode.set(event, node);
      continue;
    }
    const parentNode = stack.at(-1);
    if (parentNode === void 0) {
      throw new Error("Impossible: no parent node found in the stack");
    }
    const parentEvent = parentNode.entry;
    const begin = event.ts;
    const parentBegin = parentEvent.ts;
    const parentDuration = parentEvent.dur || 0;
    const end = begin + duration;
    const parentEnd = parentBegin + parentDuration;
    const startsBeforeParent = begin < parentBegin;
    if (startsBeforeParent) {
      throw new Error("Impossible: current event starts before the parent event");
    }
    const startsAfterParent = begin >= parentEnd;
    if (startsAfterParent) {
      stack.pop();
      i--;
      nodeIdCount--;
      continue;
    }
    const endsAfterParent = end > parentEnd;
    if (endsAfterParent) {
      continue;
    }
    node.depth = stack.length;
    node.parent = parentNode;
    parentNode.children.push(node);
    node.selfTime = Types.Timing.Micro(duration);
    if (parentNode.selfTime !== void 0) {
      parentNode.selfTime = Types.Timing.Micro(parentNode.selfTime - (event.dur || 0));
    }
    stack.push(node);
    tree.maxDepth = Math.max(tree.maxDepth, stack.length);
    entryToNode.set(event, node);
  }
  return { tree, entryToNode };
}
export function walkTreeFromEntry(entryToNode, rootEntry, onEntryStart, onEntryEnd) {
  const startNode = entryToNode.get(rootEntry);
  if (!startNode) {
    return;
  }
  walkTreeByNode(entryToNode, startNode, onEntryStart, onEntryEnd);
}
export function walkEntireTree(entryToNode, tree, onEntryStart, onEntryEnd, traceWindowToInclude, minDuration) {
  for (const rootNode of tree.roots) {
    walkTreeByNode(entryToNode, rootNode, onEntryStart, onEntryEnd, traceWindowToInclude, minDuration);
  }
}
function walkTreeByNode(entryToNode, rootNode, onEntryStart, onEntryEnd, traceWindowToInclude, minDuration) {
  if (traceWindowToInclude && !treeNodeIsInWindow(rootNode, traceWindowToInclude)) {
    return;
  }
  if (typeof minDuration !== "undefined") {
    const duration = Types.Timing.Micro(
      rootNode.entry.ts + Types.Timing.Micro(rootNode.entry.dur ?? 0)
    );
    if (duration < minDuration) {
      return;
    }
  }
  onEntryStart(rootNode.entry);
  for (const child of rootNode.children) {
    walkTreeByNode(entryToNode, child, onEntryStart, onEntryEnd, traceWindowToInclude, minDuration);
  }
  onEntryEnd(rootNode.entry);
}
function treeNodeIsInWindow(node, traceWindow) {
  return eventIsInBounds(node.entry, traceWindow);
}
export function canBuildTreesFromEvents(events) {
  const stack = [];
  for (const event of events) {
    const startTime = event.ts;
    const endTime = event.ts + (event.dur ?? 0);
    let parent = stack.at(-1);
    if (parent === void 0) {
      stack.push(event);
      continue;
    }
    let parentEndTime = parent.ts + (parent.dur ?? 0);
    while (stack.length && startTime >= parentEndTime) {
      stack.pop();
      parent = stack.at(-1);
      if (parent === void 0) {
        break;
      }
      parentEndTime = parent.ts + (parent.dur ?? 0);
    }
    if (stack.length && endTime > parentEndTime) {
      return false;
    }
    stack.push(event);
  }
  return true;
}
//# sourceMappingURL=TreeHelpers.js.map
