"use strict";
export class ReplayFinishedEvent extends Event {
  static eventName = "replayfinished";
  constructor() {
    super(ReplayFinishedEvent.eventName, { bubbles: true, composed: true });
  }
}
export class RecordingStateChangedEvent extends Event {
  constructor(recording) {
    super(RecordingStateChangedEvent.eventName, {
      bubbles: true,
      composed: true
    });
    this.recording = recording;
  }
  static eventName = "recordingstatechanged";
}
//# sourceMappingURL=RecorderEvents.js.map
