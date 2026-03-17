"use strict";
import * as Core from "../core/core.js";
class BaseNode {
  static types = {
    NETWORK: "network",
    CPU: "cpu"
  };
  _id;
  _isMainDocument;
  dependents;
  dependencies;
  constructor(id) {
    this._id = id;
    this._isMainDocument = false;
    this.dependents = [];
    this.dependencies = [];
  }
  get id() {
    return this._id;
  }
  get type() {
    throw new Core.LanternError("Unimplemented");
  }
  /**
   * In microseconds
   */
  get startTime() {
    throw new Core.LanternError("Unimplemented");
  }
  /**
   * In microseconds
   */
  get endTime() {
    throw new Core.LanternError("Unimplemented");
  }
  setIsMainDocument(value) {
    this._isMainDocument = value;
  }
  isMainDocument() {
    return this._isMainDocument;
  }
  getDependents() {
    return this.dependents.slice();
  }
  getNumberOfDependents() {
    return this.dependents.length;
  }
  getDependencies() {
    return this.dependencies.slice();
  }
  getNumberOfDependencies() {
    return this.dependencies.length;
  }
  getRootNode() {
    let rootNode = this;
    while (rootNode.dependencies.length) {
      rootNode = rootNode.dependencies[0];
    }
    return rootNode;
  }
  addDependent(node) {
    node.addDependency(this);
  }
  addDependency(node) {
    if (node === this) {
      throw new Core.LanternError("Cannot add dependency on itself");
    }
    if (this.dependencies.includes(node)) {
      return;
    }
    node.dependents.push(this);
    this.dependencies.push(node);
  }
  removeDependent(node) {
    node.removeDependency(this);
  }
  removeDependency(node) {
    if (!this.dependencies.includes(node)) {
      return;
    }
    const thisIndex = node.dependents.indexOf(this);
    node.dependents.splice(thisIndex, 1);
    this.dependencies.splice(this.dependencies.indexOf(node), 1);
  }
  // Unused in devtools, but used in LH.
  removeAllDependencies() {
    for (const node of this.dependencies.slice()) {
      this.removeDependency(node);
    }
  }
  /**
   * Computes whether the given node is anywhere in the dependency graph of this node.
   * While this method can prevent cycles, it walks the graph and should be used sparingly.
   * Nodes are always considered dependent on themselves for the purposes of cycle detection.
   */
  isDependentOn(node) {
    let isDependentOnNode = false;
    this.traverse(
      (currentNode) => {
        if (isDependentOnNode) {
          return;
        }
        isDependentOnNode = currentNode === node;
      },
      (currentNode) => {
        if (isDependentOnNode) {
          return [];
        }
        return currentNode.getDependencies();
      }
    );
    return isDependentOnNode;
  }
  /**
   * Clones the node's information without adding any dependencies/dependents.
   */
  cloneWithoutRelationships() {
    const node = new BaseNode(this.id);
    node.setIsMainDocument(this._isMainDocument);
    return node;
  }
  /**
   * Clones the entire graph connected to this node filtered by the optional predicate. If a node is
   * included by the predicate, all nodes along the paths between the node and the root will be included. If the
   * node this was called on is not included in the resulting filtered graph, the method will throw.
   *
   * This does not clone NetworkNode's `record` or `rawRecord` fields. It may be reasonable to clone the former,
   * to assist in graph construction, but the latter should never be cloned as one constraint of Lantern is that
   * the underlying data records are accessible for plain object reference equality checks.
   */
  cloneWithRelationships(predicate) {
    const rootNode = this.getRootNode();
    const idsToIncludedClones = /* @__PURE__ */ new Map();
    rootNode.traverse((node) => {
      if (idsToIncludedClones.has(node.id)) {
        return;
      }
      if (predicate === void 0) {
        idsToIncludedClones.set(node.id, node.cloneWithoutRelationships());
        return;
      }
      if (predicate(node)) {
        node.traverse(
          (node2) => idsToIncludedClones.set(node2.id, node2.cloneWithoutRelationships()),
          // Dependencies already cloned have already cloned ancestors, so no need to visit again.
          (node2) => node2.dependencies.filter((parent) => !idsToIncludedClones.has(parent.id))
        );
      }
    });
    rootNode.traverse((originalNode) => {
      const clonedNode = idsToIncludedClones.get(originalNode.id);
      if (!clonedNode) {
        return;
      }
      for (const dependency of originalNode.dependencies) {
        const clonedDependency = idsToIncludedClones.get(dependency.id);
        if (!clonedDependency) {
          throw new Core.LanternError("Dependency somehow not cloned");
        }
        clonedNode.addDependency(clonedDependency);
      }
    });
    const clonedThisNode = idsToIncludedClones.get(this.id);
    if (!clonedThisNode) {
      throw new Core.LanternError("Cloned graph missing node");
    }
    return clonedThisNode;
  }
  /**
   * Traverses all connected nodes in BFS order, calling `callback` exactly once
   * on each. `traversalPath` is the shortest (though not necessarily unique)
   * path from `node` to the root of the iteration.
   *
   * The `getNextNodes` function takes a visited node and returns which nodes to
   * visit next. It defaults to returning the node's dependents.
   */
  traverse(callback, getNextNodes) {
    for (const { node, traversalPath } of this.traverseGenerator(getNextNodes)) {
      callback(node, traversalPath);
    }
  }
  /**
   * @see BaseNode.traverse
   */
  // clang-format off
  *traverseGenerator(getNextNodes) {
    if (!getNextNodes) {
      getNextNodes = (node) => node.getDependents();
    }
    const queue = [[this]];
    const visited = /* @__PURE__ */ new Set([this.id]);
    while (queue.length) {
      const traversalPath = queue.shift();
      const node = traversalPath[0];
      yield { node, traversalPath };
      for (const nextNode of getNextNodes(node)) {
        if (visited.has(nextNode.id)) {
          continue;
        }
        visited.add(nextNode.id);
        queue.push([nextNode, ...traversalPath]);
      }
    }
  }
  /**
   * If the given node has a cycle, returns a path representing that cycle.
   * Else returns null.
   *
   * Does a DFS on in its dependent graph.
   */
  static findCycle(node, direction = "both") {
    if (direction === "both") {
      return BaseNode.findCycle(node, "dependents") || BaseNode.findCycle(node, "dependencies");
    }
    const visited = /* @__PURE__ */ new Set();
    const currentPath = [];
    const toVisit = [node];
    const depthAdded = /* @__PURE__ */ new Map([[node, 0]]);
    while (toVisit.length) {
      const currentNode = toVisit.pop();
      if (currentPath.includes(currentNode)) {
        return currentPath;
      }
      if (visited.has(currentNode)) {
        continue;
      }
      while (currentPath.length > depthAdded.get(currentNode)) {
        currentPath.pop();
      }
      visited.add(currentNode);
      currentPath.push(currentNode);
      const nodesToExplore = direction === "dependents" ? currentNode.dependents : currentNode.dependencies;
      for (const nextNode of nodesToExplore) {
        if (toVisit.includes(nextNode)) {
          continue;
        }
        toVisit.push(nextNode);
        depthAdded.set(nextNode, currentPath.length);
      }
    }
    return null;
  }
  canDependOn(node) {
    return node.startTime <= this.startTime;
  }
}
export { BaseNode };
//# sourceMappingURL=BaseNode.js.map
