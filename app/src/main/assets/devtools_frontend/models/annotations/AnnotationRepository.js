"use strict";
import * as Common from "../../core/common/common.js";
import * as GreenDev from "../greendev/greendev.js";
import { AnnotationType } from "./AnnotationType.js";
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ANNOTATION_ADDED"] = "AnnotationAdded";
  Events2["ANNOTATION_DELETED"] = "AnnotationDeleted";
  Events2["ALL_ANNOTATIONS_DELETED"] = "AllAnnotationsDeleted";
  return Events2;
})(Events || {});
export class AnnotationRepository {
  static #instance = null;
  static #hasRepliedGreenDevDisabled = false;
  static #hasShownFlagWarning = false;
  #events = new Common.ObjectWrapper.ObjectWrapper();
  #annotationData = [];
  #nextId = 0;
  static instance() {
    if (!AnnotationRepository.#instance) {
      AnnotationRepository.#instance = new AnnotationRepository();
    }
    return AnnotationRepository.#instance;
  }
  static annotationsEnabled() {
    const enabled = GreenDev.Prototypes.instance().isEnabled("aiAnnotations");
    if (!enabled) {
      this.#hasRepliedGreenDevDisabled = true;
    } else if (this.#hasRepliedGreenDevDisabled && !this.#hasShownFlagWarning) {
      console.warn(
        "Flag controlling GreenDev has flipped from false to true. Only some callers will expect GreenDev to be enabled, which can lead to unexpected results."
      );
      this.#hasShownFlagWarning = true;
    }
    return Boolean(enabled);
  }
  addEventListener(eventType, listener, thisObject) {
    if (!AnnotationRepository.annotationsEnabled()) {
      console.warn("Received request to add event listener with annotations disabled");
    }
    return this.#events.addEventListener(eventType, listener, thisObject);
  }
  getAnnotationDataByType(type) {
    if (!AnnotationRepository.annotationsEnabled()) {
      console.warn("Received query for annotation types with annotations disabled");
      return [];
    }
    const annotations = this.#annotationData.filter((annotation) => annotation.type === type);
    return annotations;
  }
  getAnnotationDataById(id) {
    if (!AnnotationRepository.annotationsEnabled()) {
      console.warn("Received query for annotation type with annotations disabled");
      return void 0;
    }
    return this.#annotationData.find((annotation) => annotation.id === id);
  }
  #getExistingAnnotation(type, anchor) {
    const annotations = this.getAnnotationDataByType(type);
    const annotation = annotations.find((annotation2) => {
      if (typeof anchor === "string") {
        return annotation2.lookupId === anchor;
      }
      switch (type) {
        case AnnotationType.ELEMENT_NODE: {
          const elementAnnotation = annotation2;
          return elementAnnotation.anchor === anchor;
        }
        case AnnotationType.NETWORK_REQUEST_SUBPANEL_HEADERS: {
          const networkRequestDetailsAnnotation = annotation2;
          return networkRequestDetailsAnnotation.anchor === anchor;
        }
        default:
          console.warn("[AnnotationRepository] Unknown AnnotationType", type);
          return false;
      }
    });
    return annotation;
  }
  #updateExistingAnnotationLabel(label, type, anchor) {
    const annotation = this.#getExistingAnnotation(type, anchor);
    if (annotation) {
      annotation.message = label;
      return true;
    }
    return false;
  }
  addElementsAnnotation(label, anchor, anchorToString) {
    if (!AnnotationRepository.annotationsEnabled()) {
      console.warn("Received annotation registration with annotations disabled");
      return;
    }
    if (this.#updateExistingAnnotationLabel(label, AnnotationType.ELEMENT_NODE, anchor)) {
      return;
    }
    const annotationData = {
      id: this.#nextId++,
      type: AnnotationType.ELEMENT_NODE,
      message: label,
      lookupId: typeof anchor === "string" ? anchor : "",
      anchor: typeof anchor !== "string" ? anchor : void 0,
      anchorToString
    };
    this.#annotationData.push(annotationData);
    console.log("[AnnotationRepository] Added element annotation:", label, {
      annotationData,
      annotations: this.#annotationData.length
    });
    this.#events.dispatchEventToListeners("AnnotationAdded" /* ANNOTATION_ADDED */, annotationData);
  }
  addNetworkRequestAnnotation(label, anchor, anchorToString) {
    if (!AnnotationRepository.annotationsEnabled()) {
      console.warn("Received annotation registration with annotations disabled");
      return;
    }
    if (this.#updateExistingAnnotationLabel(label, AnnotationType.NETWORK_REQUEST_SUBPANEL_HEADERS, anchor)) {
      return;
    }
    const annotationData = {
      id: this.#nextId++,
      type: AnnotationType.NETWORK_REQUEST,
      message: "",
      lookupId: typeof anchor === "string" ? anchor : "",
      anchor: typeof anchor !== "string" ? anchor : void 0,
      anchorToString
    };
    this.#annotationData.push(annotationData);
    console.log("[AnnotationRepository] Added annotation:", label, {
      annotationData,
      annotations: this.#annotationData.length
    });
    this.#events.dispatchEventToListeners("AnnotationAdded" /* ANNOTATION_ADDED */, annotationData);
    const annotationDetailsData = {
      id: this.#nextId++,
      type: AnnotationType.NETWORK_REQUEST_SUBPANEL_HEADERS,
      message: label,
      lookupId: typeof anchor === "string" ? anchor : "",
      anchor: typeof anchor !== "string" ? anchor : void 0,
      anchorToString
    };
    this.#annotationData.push(annotationDetailsData);
    this.#events.dispatchEventToListeners("AnnotationAdded" /* ANNOTATION_ADDED */, annotationDetailsData);
  }
  deleteAllAnnotations() {
    this.#annotationData = [];
    this.#events.dispatchEventToListeners("AllAnnotationsDeleted" /* ALL_ANNOTATIONS_DELETED */);
    console.log("[AnnotationRepository] Deleting all annotations");
  }
  deleteAnnotation(id) {
    const index = this.#annotationData.findIndex((annotation) => annotation.id === id);
    if (index === -1) {
      console.warn(`[AnnotationRepository] Could not find annotation with id ${id}`);
      return;
    }
    this.#annotationData.splice(index, 1);
    this.#events.dispatchEventToListeners("AnnotationDeleted" /* ANNOTATION_DELETED */, { id });
    console.log(`[AnnotationRepository] Deleted annotation with id ${id}`);
  }
}
//# sourceMappingURL=AnnotationRepository.js.map
