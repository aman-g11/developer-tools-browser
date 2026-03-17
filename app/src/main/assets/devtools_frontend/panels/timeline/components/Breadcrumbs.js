"use strict";
import * as TraceBounds from "../../../services/trace_bounds/trace_bounds.js";
export function flattenBreadcrumbs(initialBreadcrumb) {
  const allBreadcrumbs = [initialBreadcrumb];
  let breadcrumbsIter = initialBreadcrumb;
  while (breadcrumbsIter.child !== null) {
    const iterChild = breadcrumbsIter.child;
    if (iterChild !== null) {
      allBreadcrumbs.push(iterChild);
      breadcrumbsIter = iterChild;
    }
  }
  return allBreadcrumbs;
}
export class Breadcrumbs {
  initialBreadcrumb;
  activeBreadcrumb;
  constructor(initialTraceWindow) {
    this.initialBreadcrumb = {
      window: initialTraceWindow,
      child: null
    };
    let lastBreadcrumb = this.initialBreadcrumb;
    while (lastBreadcrumb.child !== null) {
      lastBreadcrumb = lastBreadcrumb.child;
    }
    this.activeBreadcrumb = lastBreadcrumb;
  }
  add(newBreadcrumbTraceWindow) {
    if (!this.isTraceWindowWithinTraceWindow(newBreadcrumbTraceWindow, this.activeBreadcrumb.window)) {
      throw new Error("Can not add a breadcrumb that is equal to or is outside of the parent breadcrumb TimeWindow");
    }
    const newBreadcrumb = {
      window: newBreadcrumbTraceWindow,
      child: null
    };
    this.activeBreadcrumb.child = newBreadcrumb;
    this.setActiveBreadcrumb(newBreadcrumb, { removeChildBreadcrumbs: false, updateVisibleWindow: true });
    return newBreadcrumb;
  }
  // Breadcumb should be within the bounds of the parent and can not have both start and end be equal to the parent
  isTraceWindowWithinTraceWindow(child, parent) {
    return child.min >= parent.min && child.max <= parent.max && !(child.min === parent.min && child.max === parent.max);
  }
  // Used to set an initial breadcrumbs from modifications loaded from a file
  setInitialBreadcrumbFromLoadedModifications(initialBreadcrumb) {
    this.initialBreadcrumb = initialBreadcrumb;
    let lastBreadcrumb = initialBreadcrumb;
    while (lastBreadcrumb.child !== null) {
      lastBreadcrumb = lastBreadcrumb.child;
    }
    this.setActiveBreadcrumb(lastBreadcrumb, { removeChildBreadcrumbs: false, updateVisibleWindow: true });
  }
  /**
   * Sets a breadcrumb to be active.
   * Doing this will update the minimap bounds and optionally based on the
   * `updateVisibleWindow` parameter, it will also update the active window.
   * The reason `updateVisibleWindow` is configurable is because if we are
   * changing which breadcrumb is active because we want to reveal something to
   * the user, we may have already updated the visible timeline window, but we
   * are activating the breadcrumb to show the user that they are now within
   * this breadcrumb. This is used when revealing insights and annotations.
   */
  setActiveBreadcrumb(activeBreadcrumb, options) {
    if (options.removeChildBreadcrumbs) {
      activeBreadcrumb.child = null;
    }
    this.activeBreadcrumb = activeBreadcrumb;
    TraceBounds.TraceBounds.BoundsManager.instance().setMiniMapBounds(
      activeBreadcrumb.window
    );
    if (options.updateVisibleWindow) {
      TraceBounds.TraceBounds.BoundsManager.instance().setTimelineVisibleWindow(
        activeBreadcrumb.window
      );
    }
  }
}
//# sourceMappingURL=Breadcrumbs.js.map
