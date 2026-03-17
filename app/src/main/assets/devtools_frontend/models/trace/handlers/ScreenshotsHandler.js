"use strict";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
let unpairedAsyncEvents = [];
let legacyScreenshotEvents = [];
let modernScreenshotEvents = [];
let syntheticScreenshots = [];
let frameSequenceToTs = {};
export function reset() {
  unpairedAsyncEvents = [];
  legacyScreenshotEvents = [];
  syntheticScreenshots = [];
  modernScreenshotEvents = [];
  frameSequenceToTs = {};
}
export function handleEvent(event) {
  if (Types.Events.isLegacyScreenshot(event)) {
    legacyScreenshotEvents.push(event);
  } else if (Types.Events.isScreenshot(event)) {
    modernScreenshotEvents.push(event);
  } else if (Types.Events.isPipelineReporter(event)) {
    unpairedAsyncEvents.push(event);
  }
}
export async function finalize() {
  const pipelineReporterEvents = Helpers.Trace.createMatchedSortedSyntheticEvents(unpairedAsyncEvents);
  frameSequenceToTs = Object.fromEntries(pipelineReporterEvents.map((evt) => {
    const args = evt.args.data.beginEvent.args;
    const frameReporter = "frame_reporter" in args ? args.frame_reporter : args.chrome_frame_reporter;
    const frameSequenceId = frameReporter.frame_sequence;
    const presentationTs = Types.Timing.Micro(evt.ts + evt.dur);
    return [frameSequenceId, presentationTs];
  }));
  for (const snapshotEvent of legacyScreenshotEvents) {
    const { cat, name, ph, pid, tid } = snapshotEvent;
    const syntheticEvent = Helpers.SyntheticEvents.SyntheticEventsManager.registerSyntheticEvent({
      rawSourceEvent: snapshotEvent,
      cat,
      name,
      ph,
      pid,
      tid,
      // TODO(paulirish, crbug.com/41363012): investigate why getPresentationTimestamp(snapshotEvent) seems less accurate. Resolve screenshot timing inaccuracy.
      // `getPresentationTimestamp(snapshotEvent) - snapshotEvent.ts` is how many microsec the screenshot should be adjusted to the right/later
      ts: snapshotEvent.ts,
      args: {
        dataUri: `data:image/jpg;base64,${snapshotEvent.args.snapshot}`
      }
    });
    syntheticScreenshots.push(syntheticEvent);
  }
}
export function screenshotImageDataUri(event) {
  if (Types.Events.isLegacySyntheticScreenshot(event)) {
    return event.args.dataUri;
  }
  return `data:image/jpg;base64,${event.args.snapshot}`;
}
function getPresentationTimestamp(screenshotEvent) {
  const frameSequence = parseInt(screenshotEvent.id, 16);
  if (frameSequence === 1) {
    return screenshotEvent.ts;
  }
  const updatedTs = frameSequenceToTs[frameSequence];
  return updatedTs ?? screenshotEvent.ts;
}
export function data() {
  return {
    legacySyntheticScreenshots: syntheticScreenshots.length ? syntheticScreenshots : null,
    screenshots: modernScreenshotEvents.length ? modernScreenshotEvents : null
  };
}
export function deps() {
  return ["Meta"];
}
//# sourceMappingURL=ScreenshotsHandler.js.map
