"use strict";
import * as WebVitals from "../../../third_party/web-vitals/web-vitals.js";
import * as OnEachLayoutShift from "./OnEachLayoutShift.js";
import * as Spec from "./spec/spec.js";
const { onLCP, onCLS, onINP } = WebVitals.Attribution;
const { onEachLayoutShift } = OnEachLayoutShift;
const windowListeners = [];
const documentListeners = [];
const observers = [];
const originalWindowAddListener = Window.prototype.addEventListener;
Window.prototype.addEventListener = function(...args) {
  windowListeners.push(args);
  return originalWindowAddListener.call(this, ...args);
};
const originalDocumentAddListener = Document.prototype.addEventListener;
Document.prototype.addEventListener = function(...args) {
  documentListeners.push(args);
  return originalDocumentAddListener.call(this, ...args);
};
class InternalPerformanceObserver extends PerformanceObserver {
  constructor(...args) {
    super(...args);
    observers.push(this);
  }
}
globalThis.PerformanceObserver = InternalPerformanceObserver;
let killed = false;
window[Spec.INTERNAL_KILL_SWITCH] = () => {
  if (killed) {
    return;
  }
  for (const observer of observers) {
    observer.disconnect();
  }
  for (const args of windowListeners) {
    window.removeEventListener(...args);
  }
  for (const args of documentListeners) {
    document.removeEventListener(...args);
  }
  killed = true;
};
function sendEventToDevTools(event) {
  const payload = JSON.stringify(event);
  window[Spec.EVENT_BINDING_NAME](payload);
}
const nodeList = [];
function establishNodeIndex(node) {
  const index = nodeList.length;
  nodeList.push(new WeakRef(node));
  return index;
}
window.getNodeForIndex = (index) => {
  return nodeList[index].deref();
};
function limitScripts(loafs) {
  return loafs.map((loaf) => {
    const longestScripts = [];
    for (const script of loaf.scripts) {
      if (longestScripts.length < Spec.SCRIPTS_PER_LOAF_LIMIT) {
        longestScripts.push(script);
        continue;
      }
      const shorterIndex = longestScripts.findIndex((s) => s.duration < script.duration);
      if (shorterIndex === -1) {
        continue;
      }
      longestScripts[shorterIndex] = script;
    }
    longestScripts.sort((a, b) => a.startTime - b.startTime);
    loaf.scripts = longestScripts;
    return loaf;
  });
}
function isPrerendered() {
  if (document.prerendering) {
    return true;
  }
  const firstNavStart = self.performance.getEntriesByType?.("navigation")[0]?.activationStart;
  return firstNavStart !== void 0 && firstNavStart > 0;
}
let startedHidden = null;
function initialize() {
  sendEventToDevTools({ name: "reset" });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (startedHidden === null && !isPrerendered()) {
        startedHidden = entry.name === "hidden";
      }
    }
  }).observe({ type: "visibility-state", buffered: true });
  WebVitals.onBFCacheRestore(() => {
    startedHidden = false;
    sendEventToDevTools({ name: "reset" });
  });
  onLCP((metric) => {
    const event = {
      name: "LCP",
      value: metric.value,
      startedHidden: Boolean(startedHidden),
      phases: {
        timeToFirstByte: metric.attribution.timeToFirstByte,
        resourceLoadDelay: metric.attribution.resourceLoadDelay,
        resourceLoadTime: metric.attribution.resourceLoadDuration,
        elementRenderDelay: metric.attribution.elementRenderDelay
      }
    };
    const element = metric.attribution.lcpEntry?.element;
    if (element) {
      event.nodeIndex = establishNodeIndex(element);
    }
    sendEventToDevTools(event);
  }, { reportAllChanges: true });
  onCLS((metric) => {
    const event = {
      name: "CLS",
      value: metric.value,
      clusterShiftIds: metric.entries.map(Spec.getUniqueLayoutShiftId)
    };
    sendEventToDevTools(event);
  }, { reportAllChanges: true });
  function onEachInteraction(interaction) {
    const event = {
      name: "InteractionEntry",
      duration: interaction.value,
      phases: {
        inputDelay: interaction.attribution.inputDelay,
        processingDuration: interaction.attribution.processingDuration,
        presentationDelay: interaction.attribution.presentationDelay
      },
      startTime: interaction.entries[0].startTime,
      entryGroupId: interaction.entries[0].interactionId,
      nextPaintTime: interaction.attribution.nextPaintTime,
      interactionType: interaction.attribution.interactionType,
      eventName: interaction.entries[0].name,
      // To limit the amount of events, just get the last 5 LoAFs
      longAnimationFrameEntries: limitScripts(
        interaction.attribution.longAnimationFrameEntries.slice(-Spec.LOAF_LIMIT).map((loaf) => loaf.toJSON())
      )
    };
    const target = interaction.attribution.interactionTarget;
    if (target) {
      event.nodeIndex = Number(target);
    }
    sendEventToDevTools(event);
  }
  onINP((metric) => {
    const event = {
      name: "INP",
      value: metric.value,
      phases: {
        inputDelay: metric.attribution.inputDelay,
        processingDuration: metric.attribution.processingDuration,
        presentationDelay: metric.attribution.presentationDelay
      },
      startTime: metric.entries[0].startTime,
      entryGroupId: metric.entries[0].interactionId,
      interactionType: metric.attribution.interactionType
    };
    sendEventToDevTools(event);
  }, {
    reportAllChanges: true,
    durationThreshold: 0,
    onEachInteraction,
    generateTarget(el) {
      if (el) {
        return String(establishNodeIndex(el));
      }
      return void 0;
    }
  });
  onEachLayoutShift((layoutShift) => {
    const event = {
      name: "LayoutShift",
      score: layoutShift.value,
      uniqueLayoutShiftId: Spec.getUniqueLayoutShiftId(layoutShift.entry),
      affectedNodeIndices: layoutShift.attribution.affectedNodes.map(establishNodeIndex)
    };
    sendEventToDevTools(event);
  });
}
initialize();
//# sourceMappingURL=web-vitals-injected.js.map
