"use strict";
import * as i18n from "../i18n/i18n.js";
import { DebuggerModel, Location } from "./DebuggerModel.js";
import { SDKModel } from "./SDKModel.js";
import { Capability } from "./Target.js";
const UIStrings = {
  /**
   * @description Name of a profile. Placeholder is either a user-supplied name or a number automatically assigned to the profile.
   * @example {2} PH1
   */
  profileD: "Profile {PH1}"
};
const str_ = i18n.i18n.registerUIStrings("core/sdk/CPUProfilerModel.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
export class CPUProfilerModel extends SDKModel {
  #nextAnonymousConsoleProfileNumber;
  #anonymousConsoleProfileIdToTitle;
  #profilerAgent;
  #preciseCoverageDeltaUpdateCallback;
  #debuggerModel;
  registeredConsoleProfileMessages = [];
  constructor(target) {
    super(target);
    this.#nextAnonymousConsoleProfileNumber = 1;
    this.#anonymousConsoleProfileIdToTitle = /* @__PURE__ */ new Map();
    this.#profilerAgent = target.profilerAgent();
    this.#preciseCoverageDeltaUpdateCallback = null;
    target.registerProfilerDispatcher(this);
    void this.#profilerAgent.invoke_enable();
    this.#debuggerModel = target.model(DebuggerModel);
  }
  runtimeModel() {
    return this.#debuggerModel.runtimeModel();
  }
  debuggerModel() {
    return this.#debuggerModel;
  }
  consoleProfileStarted({ id, location, title }) {
    if (!title) {
      title = i18nString(UIStrings.profileD, { PH1: this.#nextAnonymousConsoleProfileNumber++ });
      this.#anonymousConsoleProfileIdToTitle.set(id, title);
    }
    const eventData = this.createEventDataFrom(id, location, title);
    this.dispatchEventToListeners("ConsoleProfileStarted" /* CONSOLE_PROFILE_STARTED */, eventData);
  }
  consoleProfileFinished({ id, location, profile, title }) {
    if (!title) {
      title = this.#anonymousConsoleProfileIdToTitle.get(id);
      this.#anonymousConsoleProfileIdToTitle.delete(id);
    }
    const eventData = {
      ...this.createEventDataFrom(id, location, title),
      cpuProfile: profile
    };
    this.registeredConsoleProfileMessages.push(eventData);
    this.dispatchEventToListeners("ConsoleProfileFinished" /* CONSOLE_PROFILE_FINISHED */, eventData);
  }
  createEventDataFrom(id, scriptLocation, title) {
    const debuggerLocation = Location.fromPayload(this.#debuggerModel, scriptLocation);
    const globalId = this.target().id() + "." + id;
    return {
      id: globalId,
      scriptLocation: debuggerLocation,
      title: title || "",
      cpuProfilerModel: this
    };
  }
  startRecording() {
    const intervalUs = 100;
    void this.#profilerAgent.invoke_setSamplingInterval({ interval: intervalUs });
    return this.#profilerAgent.invoke_start();
  }
  stopRecording() {
    return this.#profilerAgent.invoke_stop().then((response) => response.profile || null);
  }
  startPreciseCoverage(jsCoveragePerBlock, preciseCoverageDeltaUpdateCallback) {
    const callCount = false;
    this.#preciseCoverageDeltaUpdateCallback = preciseCoverageDeltaUpdateCallback;
    const allowUpdatesTriggeredByBackend = true;
    return this.#profilerAgent.invoke_startPreciseCoverage(
      { callCount, detailed: jsCoveragePerBlock, allowTriggeredUpdates: allowUpdatesTriggeredByBackend }
    );
  }
  async takePreciseCoverage() {
    const r = await this.#profilerAgent.invoke_takePreciseCoverage();
    const timestamp = r?.timestamp || 0;
    const coverage = r?.result || [];
    return { timestamp, coverage };
  }
  stopPreciseCoverage() {
    this.#preciseCoverageDeltaUpdateCallback = null;
    return this.#profilerAgent.invoke_stopPreciseCoverage();
  }
  preciseCoverageDeltaUpdate({ timestamp, result }) {
    if (this.#preciseCoverageDeltaUpdateCallback) {
      void this.#preciseCoverageDeltaUpdateCallback(timestamp, result);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["CONSOLE_PROFILE_STARTED"] = "ConsoleProfileStarted";
  Events2["CONSOLE_PROFILE_FINISHED"] = "ConsoleProfileFinished";
  return Events2;
})(Events || {});
SDKModel.register(CPUProfilerModel, { capabilities: Capability.JS, autostart: true });
//# sourceMappingURL=CPUProfilerModel.js.map
