"use strict";
import * as Common from "../../core/common/common.js";
import * as Platform from "../../core/platform/platform.js";
import { assertNotNullOrUndefined } from "../../core/platform/platform.js";
const SUMMARY_ELEMENT_SELECTOR = "summary";
const domNodeIsTree = (domNode) => {
  return domNode.getAttribute("role") === "tree";
};
const domNodeIsBreakpointItemNode = (domNode) => {
  return domNode.getAttribute("role") === "treeitem";
};
const domNodeIsPauseOnExceptionsNode = (domNode) => {
  return domNode.getAttribute("data-first-pause") !== null || domNode.getAttribute("data-last-pause") !== null;
};
const domNodeIsSummaryNode = (domNode) => {
  return !domNodeIsBreakpointItemNode(domNode);
};
const groupIsExpanded = (detailsElement) => {
  return detailsElement.getAttribute("open") !== null;
};
const getFirstBreakpointItemInGroup = (detailsElement) => {
  return detailsElement.querySelector("[data-first-breakpoint]");
};
const getLastBreakpointItemInGroup = (detailsElement) => {
  return detailsElement.querySelector("[data-last-breakpoint]");
};
const getNextGroupsSummaryNode = (detailsElement) => {
  const nextDetailsElement = getNextDetailsElement(detailsElement);
  if (nextDetailsElement && nextDetailsElement instanceof HTMLDetailsElement) {
    return nextDetailsElement?.querySelector("summary");
  }
  return null;
};
const getCurrentSummaryNode = (detailsElement) => {
  return detailsElement.querySelector(SUMMARY_ELEMENT_SELECTOR);
};
const getNextDetailsElement = (detailsElement) => {
  const nextDetailsElement = detailsElement.nextElementSibling;
  if (nextDetailsElement && nextDetailsElement instanceof HTMLDetailsElement) {
    return nextDetailsElement;
  }
  return null;
};
const getPreviousDetailsElement = (detailsElement) => {
  const previousDetailsElement = detailsElement.previousElementSibling;
  if (previousDetailsElement && previousDetailsElement instanceof HTMLDetailsElement) {
    return previousDetailsElement;
  }
  return null;
};
function findNextNodeForPauseOnExceptions(target, key) {
  console.assert(domNodeIsPauseOnExceptionsNode(target));
  let nextNode = null;
  switch (key) {
    case Platform.KeyboardUtilities.ArrowKey.UP: {
      const previousElementSibling = target.previousElementSibling;
      if (previousElementSibling instanceof HTMLElement) {
        nextNode = previousElementSibling;
        console.assert(domNodeIsPauseOnExceptionsNode(nextNode));
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.DOWN: {
      const nextElementSibling = target.nextElementSibling;
      if (nextElementSibling instanceof HTMLElement) {
        if (domNodeIsTree(nextElementSibling)) {
          const detailsElement = nextElementSibling.querySelector("[data-first-group]");
          if (detailsElement) {
            nextNode = getCurrentSummaryNode(detailsElement);
          }
        } else {
          nextNode = nextElementSibling;
          console.assert(domNodeIsPauseOnExceptionsNode(nextNode));
        }
      }
      break;
    }
    default:
      break;
  }
  return nextNode;
}
export async function findNextNodeForKeyboardNavigation(target, key, setGroupExpandedStateCallback) {
  if (domNodeIsPauseOnExceptionsNode(target)) {
    return findNextNodeForPauseOnExceptions(target, key);
  }
  const detailsElement = target.parentElement;
  if (!detailsElement || !(detailsElement instanceof HTMLDetailsElement)) {
    throw new Error("The selected nodes should be direct children of an HTMLDetails element.");
  }
  let nextNode = null;
  switch (key) {
    case Platform.KeyboardUtilities.ArrowKey.LEFT: {
      if (domNodeIsSummaryNode(target)) {
        if (groupIsExpanded(detailsElement)) {
          await setGroupExpandedStateCallback(detailsElement, false);
        }
      } else {
        return getCurrentSummaryNode(detailsElement);
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.RIGHT: {
      if (domNodeIsSummaryNode(target)) {
        if (groupIsExpanded(detailsElement)) {
          return getFirstBreakpointItemInGroup(detailsElement);
        }
        await setGroupExpandedStateCallback(detailsElement, true);
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.DOWN: {
      if (domNodeIsSummaryNode(target)) {
        if (groupIsExpanded(detailsElement)) {
          nextNode = getFirstBreakpointItemInGroup(detailsElement);
        } else {
          nextNode = getNextGroupsSummaryNode(detailsElement);
        }
      } else {
        const nextSibling = target.nextElementSibling;
        if (nextSibling && nextSibling instanceof HTMLDivElement) {
          nextNode = nextSibling;
        } else {
          nextNode = getNextGroupsSummaryNode(detailsElement);
        }
      }
      break;
    }
    case Platform.KeyboardUtilities.ArrowKey.UP: {
      if (domNodeIsSummaryNode(target)) {
        const previousDetailsElement = getPreviousDetailsElement(detailsElement);
        if (previousDetailsElement) {
          if (groupIsExpanded(previousDetailsElement)) {
            nextNode = getLastBreakpointItemInGroup(previousDetailsElement);
          } else {
            nextNode = getCurrentSummaryNode(previousDetailsElement);
          }
        } else {
          const pauseOnExceptions = detailsElement.parentElement?.previousElementSibling;
          if (pauseOnExceptions instanceof HTMLElement) {
            nextNode = pauseOnExceptions;
          }
        }
      } else {
        const previousSibling = target.previousElementSibling;
        if (previousSibling instanceof HTMLElement) {
          nextNode = previousSibling;
        }
      }
      break;
    }
  }
  return nextNode;
}
function findFirstDifferingSegmentIndex(splitUrls) {
  const firstUrl = splitUrls[0];
  let firstDifferingIndex = -1;
  for (let segmentIndex = 0; segmentIndex < firstUrl.length && firstDifferingIndex === -1; ++segmentIndex) {
    const segment = firstUrl[segmentIndex];
    for (let urlIndex = 1; urlIndex < splitUrls.length; ++urlIndex) {
      const url = splitUrls[urlIndex];
      if (url.length <= segmentIndex || url[segmentIndex] !== segment) {
        firstDifferingIndex = segmentIndex;
        break;
      }
    }
  }
  return firstDifferingIndex === -1 ? firstUrl.length : firstDifferingIndex;
}
function findDifferentiatingPath(url, allUrls, startIndex) {
  const differentiatingPath = [];
  let remainingUrlsToDifferentiate = allUrls.filter((other) => other !== url);
  for (let segmentIndex = startIndex; segmentIndex < url.length; ++segmentIndex) {
    const segment = url[segmentIndex];
    differentiatingPath.push(segment);
    remainingUrlsToDifferentiate = remainingUrlsToDifferentiate.filter((url2) => url2.length > segmentIndex && url2[segmentIndex] === segment);
    if (remainingUrlsToDifferentiate.length === 0) {
      break;
    }
  }
  return differentiatingPath;
}
function populateDifferentiatingPathMap(urls, urlToDifferentiator) {
  const splitReversedUrls = urls.map((url) => {
    const paths = Common.ParsedURL.ParsedURL.fromString(url)?.folderPathComponents.slice(1);
    assertNotNullOrUndefined(paths);
    return paths.split("/").reverse();
  });
  const startIndex = findFirstDifferingSegmentIndex(splitReversedUrls);
  for (let i = 0; i < splitReversedUrls.length; ++i) {
    const splitUrl = splitReversedUrls[i];
    const differentiator = findDifferentiatingPath(splitUrl, splitReversedUrls, startIndex);
    const reversed = differentiator.reverse().join("/");
    if (startIndex === 0) {
      urlToDifferentiator.set(urls[i], reversed + "/");
    } else {
      urlToDifferentiator.set(urls[i], reversed + "/\u2026/");
    }
  }
  console.assert(new Set(urlToDifferentiator.values()).size === urls.length, "Differentiators should be unique.");
}
export function getDifferentiatingPathMap(titleInfos) {
  const nameToUrl = /* @__PURE__ */ new Map();
  const urlToDifferentiatingPath = /* @__PURE__ */ new Map();
  for (const { name, url } of titleInfos) {
    if (!nameToUrl.has(name)) {
      nameToUrl.set(name, []);
    }
    nameToUrl.get(name)?.push(url);
  }
  for (const urlsGroupedByName of nameToUrl.values()) {
    if (urlsGroupedByName.length > 1) {
      populateDifferentiatingPathMap(urlsGroupedByName, urlToDifferentiatingPath);
    }
  }
  return urlToDifferentiatingPath;
}
//# sourceMappingURL=BreakpointsViewUtils.js.map
