"use strict";
export function buildPersistedConfig(groups, indexesInVisualOrder) {
  return groups.map((group, index) => {
    const newVisualIndex = indexesInVisualOrder.indexOf(index);
    return {
      expanded: Boolean(group.expanded),
      hidden: Boolean(group.hidden),
      originalIndex: index,
      visualIndex: newVisualIndex,
      trackName: group.name
    };
  });
}
export function keyForTraceConfig(trace) {
  return trace.Meta.traceBounds.min;
}
//# sourceMappingURL=TrackConfiguration.js.map
