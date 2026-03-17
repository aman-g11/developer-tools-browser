"use strict";
export class InsightActivated extends Event {
  constructor(model, insightSetKey) {
    super(InsightActivated.eventName, { bubbles: true, composed: true });
    this.model = model;
    this.insightSetKey = insightSetKey;
  }
  static eventName = "insightactivated";
}
export class InsightDeactivated extends Event {
  static eventName = "insightdeactivated";
  constructor() {
    super(InsightDeactivated.eventName, { bubbles: true, composed: true });
  }
}
export class InsightSetHovered extends Event {
  constructor(bounds) {
    super(InsightSetHovered.eventName, { bubbles: true, composed: true });
    this.bounds = bounds;
  }
  static eventName = "insightsethovered";
}
export class InsightSetZoom extends Event {
  constructor(bounds) {
    super(InsightSetZoom.eventName, { bubbles: true, composed: true });
    this.bounds = bounds;
  }
  static eventName = "insightsetzoom";
}
export class InsightProvideOverlays extends Event {
  constructor(overlays, options) {
    super(InsightProvideOverlays.eventName, { bubbles: true, composed: true });
    this.overlays = overlays;
    this.options = options;
  }
  static eventName = "insightprovideoverlays";
}
//# sourceMappingURL=SidebarInsight.js.map
