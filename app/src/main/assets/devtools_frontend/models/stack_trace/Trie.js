"use strict";
export function isBuiltinFrame(rawFrame) {
  return rawFrame.lineNumber === -1 && rawFrame.columnNumber === -1 && !Boolean(rawFrame.scriptId) && !Boolean(rawFrame.url);
}
export class FrameNode {
  parent;
  children = [];
  rawFrame;
  frames = [];
  fragment;
  constructor(rawFrame, parent) {
    this.rawFrame = rawFrame;
    this.parent = parent;
  }
  /**
   * Produces the ancestor chain. Including `this` but excluding the `RootFrameNode`.
   */
  *getCallStack() {
    for (let node = this; node.parent; node = node.parent) {
      yield node;
    }
  }
}
export class Trie {
  #root = { parent: null, children: [] };
  /**
   * Most sources produce stack traces in "top-to-bottom" order, so that is what this method expects.
   *
   * @returns The {@link FrameNode} corresponding to the top-most stack frame.
   */
  insert(frames) {
    if (frames.length === 0) {
      throw new Error("Trie.insert called with an empty frames array.");
    }
    let currentNode = this.#root;
    for (let i = frames.length - 1; i >= 0; --i) {
      currentNode = this.#insert(currentNode, frames[i]);
    }
    return currentNode;
  }
  /**
   * Inserts `rawFrame` into the children of the provided node if not already there.
   *
   * @returns the child node corresponding to `rawFrame`.
   */
  #insert(node, rawFrame) {
    let i = 0;
    for (; i < node.children.length; ++i) {
      const maybeChild = node.children[i];
      const child = maybeChild instanceof WeakRef ? maybeChild.deref() : maybeChild;
      if (!child) {
        continue;
      }
      const compareResult = compareRawFrames(child.rawFrame, rawFrame);
      if (compareResult === 0) {
        return child;
      }
      if (compareResult > 0) {
        break;
      }
    }
    const newNode = new FrameNode(rawFrame, node);
    if (node.parent) {
      node.children.splice(i, 0, newNode);
    } else {
      node.children.splice(i, 0, new WeakRef(newNode));
    }
    return newNode;
  }
  /**
   * Traverses the trie in pre-order.
   *
   * @param node Start at `node` or `null` to start with the children of the root.
   * @param visit Called on each node in the trie. Return `true` if the visitor should descend into child nodes of the provided node.
   */
  walk(node, visit) {
    const stack = node ? [node] : [...this.#root.children].map((ref) => ref.deref()).filter((node2) => Boolean(node2));
    for (let node2 = stack.pop(); node2; node2 = stack.pop()) {
      const visitChildren = visit(node2);
      if (visitChildren) {
        for (let i = node2.children.length - 1; i >= 0; --i) {
          stack.push(node2.children[i]);
        }
      }
    }
  }
}
export function compareRawFrames(a, b) {
  const scriptIdCompare = (a.scriptId ?? "").localeCompare(b.scriptId ?? "");
  if (scriptIdCompare !== 0) {
    return scriptIdCompare;
  }
  const urlCompare = (a.url ?? "").localeCompare(b.url ?? "");
  if (urlCompare !== 0) {
    return urlCompare;
  }
  const nameCompare = (a.functionName ?? "").localeCompare(b.functionName ?? "");
  if (nameCompare !== 0) {
    return nameCompare;
  }
  if (a.lineNumber !== b.lineNumber) {
    return a.lineNumber - b.lineNumber;
  }
  return a.columnNumber - b.columnNumber;
}
//# sourceMappingURL=Trie.js.map
