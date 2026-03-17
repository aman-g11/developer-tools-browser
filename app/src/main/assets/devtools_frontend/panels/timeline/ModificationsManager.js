"use strict";
import * as Common from "../../core/common/common.js";
import * as Platform from "../../core/platform/platform.js";
import * as Trace from "../../models/trace/trace.js";
import * as TimelineComponents from "../../panels/timeline/components/components.js";
import * as AnnotationHelpers from "./AnnotationHelpers.js";
import { EntriesFilter } from "./EntriesFilter.js";
const modificationsManagerByTraceIndex = [];
let activeManager;
export class AnnotationModifiedEvent extends Event {
  constructor(overlay, action, muteAriaNotifications = false) {
    super(AnnotationModifiedEvent.eventName);
    this.overlay = overlay;
    this.action = action;
    this.muteAriaNotifications = muteAriaNotifications;
  }
  static eventName = "annotationmodifiedevent";
}
export class ModificationsManager extends EventTarget {
  #entriesFilter;
  #timelineBreadcrumbs;
  #modifications = null;
  #parsedTrace;
  #eventsSerializer;
  #overlayForAnnotation;
  #annotationsHiddenSetting;
  /**
   * Gets the ModificationsManager instance corresponding to a trace
   * given its index used in Model#traces. If no index is passed gets
   * the manager instance for the last trace. If no instance is found,
   * throws.
   */
  static activeManager() {
    return activeManager;
  }
  static reset() {
    modificationsManagerByTraceIndex.length = 0;
    activeManager = null;
  }
  /**
   * Initializes a ModificationsManager instance for a parsed trace or changes the active manager for an existing one.
   * This needs to be called if and a trace has been parsed or switched to.
   */
  static initAndActivateModificationsManager(traceModel, traceIndex) {
    if (modificationsManagerByTraceIndex[traceIndex]) {
      if (activeManager === modificationsManagerByTraceIndex[traceIndex]) {
        return activeManager;
      }
      activeManager = modificationsManagerByTraceIndex[traceIndex];
      ModificationsManager.activeManager()?.applyModificationsIfPresent();
    }
    const parsedTrace = traceModel.parsedTrace(traceIndex);
    if (!parsedTrace) {
      throw new Error("ModificationsManager was initialized without a corresponding trace data");
    }
    const traceBounds = parsedTrace.data.Meta.traceBounds;
    const newModificationsManager = new ModificationsManager({
      parsedTrace,
      traceBounds,
      rawTraceEvents: parsedTrace.traceEvents,
      modifications: parsedTrace.metadata.modifications,
      syntheticEvents: parsedTrace.syntheticEventsManager.getSyntheticTraces()
    });
    modificationsManagerByTraceIndex[traceIndex] = newModificationsManager;
    activeManager = newModificationsManager;
    ModificationsManager.activeManager()?.applyModificationsIfPresent();
    return this.activeManager();
  }
  constructor({ parsedTrace, traceBounds, modifications }) {
    super();
    this.#entriesFilter = new EntriesFilter(parsedTrace);
    this.#timelineBreadcrumbs = new TimelineComponents.Breadcrumbs.Breadcrumbs(traceBounds);
    this.#modifications = modifications || null;
    this.#parsedTrace = parsedTrace;
    this.#eventsSerializer = new Trace.EventsSerializer.EventsSerializer();
    this.#annotationsHiddenSetting = Common.Settings.Settings.instance().moduleSetting("annotations-hidden");
    this.#overlayForAnnotation = /* @__PURE__ */ new Map();
  }
  getEntriesFilter() {
    return this.#entriesFilter;
  }
  getTimelineBreadcrumbs() {
    return this.#timelineBreadcrumbs;
  }
  deleteEmptyRangeAnnotations() {
    for (const annotation of this.#overlayForAnnotation.keys()) {
      if (annotation.type === "TIME_RANGE" && annotation.label.length === 0) {
        this.removeAnnotation(annotation);
      }
    }
  }
  /**
   * Stores the annotation and creates its overlay.
   * @returns the Overlay that gets created and associated with this annotation.
   */
  createAnnotation(newAnnotation, opts) {
    if (newAnnotation.type === "ENTRY_LABEL") {
      const overlay = this.#findLabelOverlayForEntry(newAnnotation.entry);
      if (overlay) {
        this.dispatchEvent(new AnnotationModifiedEvent(overlay, "EnterLabelEditState"));
        return overlay;
      }
    }
    if (!opts.loadedFromFile) {
      if (newAnnotation.type !== "TIME_RANGE") {
        this.#annotationsHiddenSetting.set(false);
      }
    }
    const newOverlay = this.#createOverlayFromAnnotation(newAnnotation);
    this.#overlayForAnnotation.set(newAnnotation, newOverlay);
    this.dispatchEvent(new AnnotationModifiedEvent(newOverlay, "Add", opts.muteAriaNotifications));
    return newOverlay;
  }
  linkAnnotationBetweenEntriesExists(entryFrom, entryTo) {
    for (const annotation of this.#overlayForAnnotation.keys()) {
      if (annotation.type === "ENTRIES_LINK" && (annotation.entryFrom === entryFrom && annotation.entryTo === entryTo || annotation.entryFrom === entryTo && annotation.entryTo === entryFrom)) {
        return true;
      }
    }
    return false;
  }
  #findLabelOverlayForEntry(entry) {
    for (const [annotation, overlay] of this.#overlayForAnnotation.entries()) {
      if (annotation.type === "ENTRY_LABEL" && annotation.entry === entry) {
        return overlay;
      }
    }
    return null;
  }
  bringEntryLabelForwardIfExists(entry) {
    const overlay = this.#findLabelOverlayForEntry(entry);
    if (overlay?.type === "ENTRY_LABEL") {
      this.dispatchEvent(new AnnotationModifiedEvent(overlay, "LabelBringForward"));
    }
  }
  #createOverlayFromAnnotation(annotation) {
    switch (annotation.type) {
      case "ENTRY_LABEL":
        return {
          type: "ENTRY_LABEL",
          entry: annotation.entry,
          label: annotation.label
        };
      case "TIME_RANGE":
        return {
          type: "TIME_RANGE",
          label: annotation.label,
          showDuration: true,
          bounds: annotation.bounds
        };
      case "ENTRIES_LINK":
        return {
          type: "ENTRIES_LINK",
          state: annotation.state,
          entryFrom: annotation.entryFrom,
          entryTo: annotation.entryTo
        };
      default:
        Platform.assertNever(annotation, "Overlay for provided annotation cannot be created");
    }
  }
  removeAnnotation(removedAnnotation) {
    const overlayToRemove = this.#overlayForAnnotation.get(removedAnnotation);
    if (!overlayToRemove) {
      console.warn("Overlay for deleted Annotation does not exist", removedAnnotation);
      return;
    }
    this.#overlayForAnnotation.delete(removedAnnotation);
    this.dispatchEvent(new AnnotationModifiedEvent(overlayToRemove, "Remove"));
  }
  removeAnnotationOverlay(removedOverlay) {
    const annotationForRemovedOverlay = this.getAnnotationByOverlay(removedOverlay);
    if (!annotationForRemovedOverlay) {
      console.warn("Annotation for deleted Overlay does not exist", removedOverlay);
      return;
    }
    this.removeAnnotation(annotationForRemovedOverlay);
  }
  updateAnnotation(updatedAnnotation) {
    const overlay = this.#overlayForAnnotation.get(updatedAnnotation);
    if (overlay && AnnotationHelpers.isTimeRangeLabel(overlay) && Trace.Types.File.isTimeRangeAnnotation(updatedAnnotation)) {
      overlay.label = updatedAnnotation.label;
      overlay.bounds = updatedAnnotation.bounds;
      this.dispatchEvent(new AnnotationModifiedEvent(overlay, "UpdateTimeRange"));
    } else if (overlay && AnnotationHelpers.isEntriesLink(overlay) && Trace.Types.File.isEntriesLinkAnnotation(updatedAnnotation)) {
      overlay.state = updatedAnnotation.state;
      overlay.entryFrom = updatedAnnotation.entryFrom;
      overlay.entryTo = updatedAnnotation.entryTo;
      this.dispatchEvent(new AnnotationModifiedEvent(overlay, "UpdateLinkToEntry"));
    } else {
      console.error("Annotation could not be updated");
    }
  }
  updateAnnotationOverlay(updatedOverlay) {
    const annotationForUpdatedOverlay = this.getAnnotationByOverlay(updatedOverlay);
    if (!annotationForUpdatedOverlay) {
      console.warn("Annotation for updated Overlay does not exist");
      return;
    }
    if (updatedOverlay.type === "ENTRY_LABEL" && annotationForUpdatedOverlay.type === "ENTRY_LABEL" || updatedOverlay.type === "TIME_RANGE" && annotationForUpdatedOverlay.type === "TIME_RANGE") {
      this.#annotationsHiddenSetting.set(false);
      annotationForUpdatedOverlay.label = updatedOverlay.label;
      this.dispatchEvent(new AnnotationModifiedEvent(updatedOverlay, "UpdateLabel"));
    }
    if (updatedOverlay.type === "ENTRIES_LINK" && annotationForUpdatedOverlay.type === "ENTRIES_LINK") {
      this.#annotationsHiddenSetting.set(false);
      annotationForUpdatedOverlay.state = updatedOverlay.state;
    }
  }
  getAnnotationByOverlay(overlay) {
    for (const [annotation, currOverlay] of this.#overlayForAnnotation.entries()) {
      if (currOverlay === overlay) {
        return annotation;
      }
    }
    return null;
  }
  getOverlaybyAnnotation(annotation) {
    return this.#overlayForAnnotation.get(annotation) || null;
  }
  getAnnotations() {
    return [...this.#overlayForAnnotation.keys()];
  }
  getOverlays() {
    return [...this.#overlayForAnnotation.values()];
  }
  applyAnnotationsFromCache(opts) {
    this.#modifications = this.toJSON();
    this.#overlayForAnnotation.clear();
    this.#applyStoredAnnotations(this.#modifications.annotations, opts);
  }
  /**
   * Builds all modifications into a serializable object written into
   * the 'modifications' trace file metadata field.
   */
  toJSON() {
    const hiddenEntries = this.#entriesFilter.invisibleEntries().map((entry) => this.#eventsSerializer.keyForEvent(entry)).filter((entry) => entry !== null);
    const expandableEntries = this.#entriesFilter.expandableEntries().map((entry) => this.#eventsSerializer.keyForEvent(entry)).filter((entry) => entry !== null);
    this.#modifications = {
      entriesModifications: {
        hiddenEntries,
        expandableEntries
      },
      initialBreadcrumb: this.#timelineBreadcrumbs.initialBreadcrumb,
      annotations: this.#annotationsJSON()
    };
    return this.#modifications;
  }
  #annotationsJSON() {
    const annotations = this.getAnnotations();
    const entryLabelsSerialized = [];
    const labelledTimeRangesSerialized = [];
    const linksBetweenEntriesSerialized = [];
    for (let i = 0; i < annotations.length; i++) {
      const currAnnotation = annotations[i];
      if (Trace.Types.File.isEntryLabelAnnotation(currAnnotation)) {
        const serializedEvent = this.#eventsSerializer.keyForEvent(currAnnotation.entry);
        if (serializedEvent) {
          entryLabelsSerialized.push({
            entry: serializedEvent,
            label: currAnnotation.label
          });
        }
      } else if (Trace.Types.File.isTimeRangeAnnotation(currAnnotation)) {
        labelledTimeRangesSerialized.push({
          bounds: currAnnotation.bounds,
          label: currAnnotation.label
        });
      } else if (Trace.Types.File.isEntriesLinkAnnotation(currAnnotation)) {
        if (currAnnotation.entryTo) {
          const serializedFromEvent = this.#eventsSerializer.keyForEvent(currAnnotation.entryFrom);
          const serializedToEvent = this.#eventsSerializer.keyForEvent(currAnnotation.entryTo);
          if (serializedFromEvent && serializedToEvent) {
            linksBetweenEntriesSerialized.push({
              entryFrom: serializedFromEvent,
              entryTo: serializedToEvent
            });
          }
        }
      }
    }
    return {
      entryLabels: entryLabelsSerialized,
      labelledTimeRanges: labelledTimeRangesSerialized,
      linksBetweenEntries: linksBetweenEntriesSerialized
    };
  }
  applyModificationsIfPresent() {
    if (!this.#modifications || !this.#modifications.annotations) {
      return;
    }
    const hiddenEntries = this.#modifications.entriesModifications.hiddenEntries;
    const expandableEntries = this.#modifications.entriesModifications.expandableEntries;
    this.#timelineBreadcrumbs.setInitialBreadcrumbFromLoadedModifications(this.#modifications.initialBreadcrumb);
    this.#applyEntriesFilterModifications(hiddenEntries, expandableEntries);
    this.#applyStoredAnnotations(this.#modifications.annotations, {
      muteAriaNotifications: false
    });
  }
  #applyStoredAnnotations(annotations, opts) {
    try {
      const entryLabels = annotations.entryLabels ?? [];
      entryLabels.forEach((entryLabel) => {
        this.createAnnotation(
          {
            type: "ENTRY_LABEL",
            entry: this.#eventsSerializer.eventForKey(entryLabel.entry, this.#parsedTrace),
            label: entryLabel.label
          },
          {
            loadedFromFile: true,
            muteAriaNotifications: opts.muteAriaNotifications
          }
        );
      });
      const timeRanges = annotations.labelledTimeRanges ?? [];
      timeRanges.forEach((timeRange) => {
        this.createAnnotation(
          {
            type: "TIME_RANGE",
            bounds: timeRange.bounds,
            label: timeRange.label
          },
          {
            loadedFromFile: true,
            muteAriaNotifications: opts.muteAriaNotifications
          }
        );
      });
      const linksBetweenEntries = annotations.linksBetweenEntries ?? [];
      linksBetweenEntries.forEach((linkBetweenEntries) => {
        this.createAnnotation(
          {
            type: "ENTRIES_LINK",
            state: Trace.Types.File.EntriesLinkState.CONNECTED,
            entryFrom: this.#eventsSerializer.eventForKey(linkBetweenEntries.entryFrom, this.#parsedTrace),
            entryTo: this.#eventsSerializer.eventForKey(linkBetweenEntries.entryTo, this.#parsedTrace)
          },
          {
            loadedFromFile: true,
            muteAriaNotifications: opts.muteAriaNotifications
          }
        );
      });
    } catch (err) {
      console.warn("Failed to apply stored annotations", err);
    }
  }
  #applyEntriesFilterModifications(hiddenEntriesKeys, expandableEntriesKeys) {
    try {
      const hiddenEntries = hiddenEntriesKeys.map((key) => this.#eventsSerializer.eventForKey(key, this.#parsedTrace));
      const expandableEntries = expandableEntriesKeys.map((key) => this.#eventsSerializer.eventForKey(key, this.#parsedTrace));
      this.#entriesFilter.setHiddenAndExpandableEntries(hiddenEntries, expandableEntries);
    } catch (err) {
      console.warn("Failed to apply entriesFilter modifications", err);
      this.#entriesFilter.setHiddenAndExpandableEntries([], []);
    }
  }
}
//# sourceMappingURL=ModificationsManager.js.map
