"use strict";
import * as Platform from "../../core/platform/platform.js";
import * as Trace from "../../models/trace/trace.js";
import * as PerfUI from "../../ui/legacy/components/perf_ui/perf_ui.js";
import {
  entryIsVisibleInTimeline
} from "./CompatibilityTracksAppender.js";
export class EntriesFilter {
  #parsedTrace;
  // Track the set of invisible entries.
  #invisibleEntries = [];
  // List of entries whose children are hidden. This list is used to
  // keep track of entries that should be identified in the UI as "expandable",
  // since they can be clicked to reveal their hidden children.
  #expandableEntries = [];
  // Cache for descendants of entry that have already been gathered. The descendants
  // will never change so we can avoid running the potentially expensive search again.
  #entryToDescendantsMap = /* @__PURE__ */ new Map();
  constructor(parsedTrace) {
    this.#parsedTrace = parsedTrace;
  }
  #getEntryNode(entry) {
    return this.#parsedTrace.data.Samples.entryToNode.get(entry) ?? this.#parsedTrace.data.Renderer.entryToNode.get(entry);
  }
  /**
   * Checks which actions can be applied on an entry. This allows us to only show possible actions in the Context Menu.
   * For example, if an entry has no children, COLLAPSE_FUNCTION will not change the FlameChart, therefore there is no need to show this action as an option.
   */
  findPossibleActions(entry) {
    const entryNode = this.#getEntryNode(entry);
    if (!entryNode) {
      return {
        [PerfUI.FlameChart.FilterAction.MERGE_FUNCTION]: false,
        [PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION]: false,
        [PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS]: false,
        [PerfUI.FlameChart.FilterAction.RESET_CHILDREN]: false,
        [PerfUI.FlameChart.FilterAction.UNDO_ALL_ACTIONS]: false
      };
    }
    const entryParent = entryNode.parent;
    const allVisibleDescendants = this.#findAllDescendantsOfNode(entryNode).filter((descendant) => !this.#invisibleEntries.includes(descendant));
    const allVisibleRepeatingDescendants = this.#findAllRepeatingDescendantsOfNext(entryNode).filter(
      (descendant) => !this.#invisibleEntries.includes(descendant)
    );
    const allInVisibleDescendants = this.#findAllDescendantsOfNode(entryNode).filter((descendant) => this.#invisibleEntries.includes(descendant));
    const possibleActions = {
      [PerfUI.FlameChart.FilterAction.MERGE_FUNCTION]: entryParent !== null,
      [PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION]: allVisibleDescendants.length > 0,
      [PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS]: allVisibleRepeatingDescendants.length > 0,
      [PerfUI.FlameChart.FilterAction.RESET_CHILDREN]: allInVisibleDescendants.length > 0,
      [PerfUI.FlameChart.FilterAction.UNDO_ALL_ACTIONS]: this.#invisibleEntries.length > 0
    };
    return possibleActions;
  }
  /**
   * Returns the amount of entry descendants that belong to the hidden entries array.
   * */
  findHiddenDescendantsAmount(entry) {
    const entryNode = this.#getEntryNode(entry);
    if (!entryNode) {
      return 0;
    }
    const allDescendants = this.#findAllDescendantsOfNode(entryNode);
    return allDescendants.filter((descendant) => this.invisibleEntries().includes(descendant)).length;
  }
  /**
   * Returns the set of entries that are invisible given the set of applied actions.
   */
  invisibleEntries() {
    return this.#invisibleEntries;
  }
  /**
   * Sets hidden and expandable. Called when a trace with modifications is loaded and some entries are set as hidden and expandable.
   * Both arrays are set together because if there is one, the other must be present too.
   */
  setHiddenAndExpandableEntries(invisibleEntries, expandableEntries) {
    this.#invisibleEntries.push(...invisibleEntries);
    this.#expandableEntries.push(...expandableEntries);
  }
  entryIsInvisible(entry) {
    return this.#invisibleEntries.includes(entry);
  }
  /**
   * Returns the array of entries that have a sign indicating that entries below are hidden,
   * and so that they can be "expanded" to reveal their hidden children.
   */
  expandableEntries() {
    return this.#expandableEntries;
  }
  /**
   * Applies an action to hide entries or removes entries
   * from hidden entries array depending on the action.
   */
  applyFilterAction(action) {
    const entriesToHide = /* @__PURE__ */ new Set();
    switch (action.type) {
      case PerfUI.FlameChart.FilterAction.MERGE_FUNCTION: {
        entriesToHide.add(action.entry);
        const actionNode = this.#getEntryNode(action.entry) || null;
        const parentNode = actionNode && this.#firstVisibleParentNodeForEntryNode(actionNode);
        if (parentNode) {
          this.#addExpandableEntry(parentNode.entry);
        }
        break;
      }
      case PerfUI.FlameChart.FilterAction.COLLAPSE_FUNCTION: {
        const entryNode = this.#getEntryNode(action.entry);
        if (!entryNode) {
          break;
        }
        const allDescendants = this.#findAllDescendantsOfNode(entryNode);
        allDescendants.forEach((descendant) => entriesToHide.add(descendant));
        this.#addExpandableEntry(action.entry);
        break;
      }
      case PerfUI.FlameChart.FilterAction.COLLAPSE_REPEATING_DESCENDANTS: {
        const entryNode = this.#getEntryNode(action.entry);
        if (!entryNode) {
          break;
        }
        const allRepeatingDescendants = this.#findAllRepeatingDescendantsOfNext(entryNode);
        allRepeatingDescendants.forEach((descendant) => entriesToHide.add(descendant));
        if (entriesToHide.size > 0) {
          this.#addExpandableEntry(action.entry);
        }
        break;
      }
      case PerfUI.FlameChart.FilterAction.UNDO_ALL_ACTIONS: {
        this.#invisibleEntries = [];
        this.#expandableEntries = [];
        break;
      }
      case PerfUI.FlameChart.FilterAction.RESET_CHILDREN: {
        this.#makeEntryChildrenVisible(action.entry);
        break;
      }
      default:
        Platform.assertNever(action.type, `Unknown EntriesFilter action: ${action.type}`);
    }
    this.#invisibleEntries.push(...entriesToHide);
    return this.#invisibleEntries;
  }
  /**
   * Add an entry to the array of entries that have a sign indicating that entries below are hidden.
   * Also, remove all of the child entries of the new expandable entry from the expandable array. Do that because
   * to draw the initiator from the closest visible entry, we need to get the closest entry that is
   * marked as expandable and we do not want to get some that are hidden.
   */
  #addExpandableEntry(entry) {
    this.#expandableEntries.push(entry);
    const entryNode = this.#getEntryNode(entry);
    if (!entryNode) {
      return;
    }
    const allDescendants = this.#findAllDescendantsOfNode(entryNode);
    if (allDescendants.length > 0) {
      this.#expandableEntries = this.#expandableEntries.filter((entry2) => {
        return !allDescendants.includes(entry2);
      });
    }
  }
  firstVisibleParentEntryForEntry(entry) {
    const node = this.#getEntryNode(entry);
    if (!node) {
      return null;
    }
    const parent = this.#firstVisibleParentNodeForEntryNode(node);
    return parent ? parent.entry : null;
  }
  // The direct parent might be hidden by other actions, therefore we look for the next visible parent.
  #firstVisibleParentNodeForEntryNode(node) {
    let parent = node.parent;
    while (parent && this.#invisibleEntries.includes(parent.entry) || parent && !entryIsVisibleInTimeline(parent.entry)) {
      parent = parent.parent;
    }
    return parent;
  }
  #findAllDescendantsOfNode(root) {
    const cachedDescendants = this.#entryToDescendantsMap.get(root);
    if (cachedDescendants) {
      return cachedDescendants;
    }
    const descendants = [];
    const children = [...root.children];
    while (children.length > 0) {
      const childNode = children.shift();
      if (childNode) {
        descendants.push(childNode.entry);
        const childNodeCachedDescendants = this.#entryToDescendantsMap.get(childNode);
        if (childNodeCachedDescendants) {
          descendants.push(...childNodeCachedDescendants);
        } else {
          children.push(...childNode.children);
        }
      }
    }
    this.#entryToDescendantsMap.set(root, descendants);
    return descendants;
  }
  #findAllRepeatingDescendantsOfNext(root) {
    const children = [...root.children];
    const repeatingNodes = [];
    const rootIsProfileCall = Trace.Types.Events.isProfileCall(root.entry);
    while (children.length > 0) {
      const childNode = children.shift();
      if (childNode) {
        const childIsProfileCall = Trace.Types.Events.isProfileCall(childNode.entry);
        if (
          /* Handle SyntheticProfileCalls */
          rootIsProfileCall && childIsProfileCall
        ) {
          const rootNodeEntry = root.entry;
          const childNodeEntry = childNode.entry;
          if (Trace.Helpers.SamplesIntegrator.SamplesIntegrator.framesAreEqual(
            rootNodeEntry.callFrame,
            childNodeEntry.callFrame
          )) {
            repeatingNodes.push(childNode.entry);
          }
        } else if (!rootIsProfileCall && !childIsProfileCall) {
          if (root.entry.name === childNode.entry.name) {
            repeatingNodes.push(childNode.entry);
          }
        }
        children.push(...childNode.children);
      }
    }
    return repeatingNodes;
  }
  /**
   * If an entry was selected from a link instead of clicking on it,
   * it might be in the invisible entries array.
   * If it is, reveal it by resetting clidren the closest expandable entry,
   */
  revealEntry(entry) {
    const entryNode = this.#getEntryNode(entry);
    if (!entryNode) {
      return;
    }
    let closestExpandableParent = entryNode;
    while (closestExpandableParent.parent && !this.#expandableEntries.includes(closestExpandableParent.entry)) {
      closestExpandableParent = closestExpandableParent.parent;
    }
    this.#makeEntryChildrenVisible(closestExpandableParent.entry);
  }
  /**
   * Removes all of the entry children from the
   * invisible entries array to make them visible.
   */
  #makeEntryChildrenVisible(entry) {
    const entryNode = this.#getEntryNode(entry);
    if (!entryNode) {
      return;
    }
    const descendants = this.#findAllDescendantsOfNode(entryNode);
    this.#invisibleEntries = this.#invisibleEntries.filter((entry2) => {
      if (descendants.includes(entry2)) {
        return false;
      }
      return true;
    });
    this.#expandableEntries = this.#expandableEntries.filter((iterEntry) => {
      if (descendants.includes(iterEntry) || iterEntry === entry) {
        return false;
      }
      return true;
    });
  }
  isEntryExpandable(event) {
    return this.#expandableEntries.includes(event);
  }
}
//# sourceMappingURL=EntriesFilter.js.map
