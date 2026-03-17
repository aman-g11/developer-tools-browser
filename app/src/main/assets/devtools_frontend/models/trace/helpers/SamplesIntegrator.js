"use strict";
import * as Types from "../types/types.js";
import { milliToMicro } from "./Timing.js";
import { extractSampleTraceId, makeProfileCall, mergeEventsInOrder, sortTraceEventsInPlace } from "./Trace.js";
export class SamplesIntegrator {
  /**
   * The result of running the samples integrator. Holds the JS calls
   * with their approximated duration after integrating samples into the
   * trace event tree.
   */
  #constructedProfileCalls = [];
  /**
   * tracks the state of the JS stack at each point in time to update
   * the profile call durations as new events arrive. This doesn't only
   * happen with new profile calls (in which case we would compare the
   * stack in them) but also with trace events (in which case we would
   * update the duration of the events we are tracking at the moment).
   */
  #currentJSStack = [];
  /**
   * Process holding the CPU profile and trace events.
   */
  #processId;
  /**
   * Thread holding the CPU profile and trace events.
   */
  #threadId;
  /**
   * Tracks the depth of the JS stack at the moment a trace event starts
   * or ends. It is assumed that for the duration of a trace event, the
   * JS stack's depth cannot decrease, since JS calls that started
   * before a trace event cannot end during the trace event. So as trace
   * events arrive, we store the "locked" amount of JS frames that were
   * in the stack before the event came.
   */
  #lockedJsStackDepth = [];
  /**
   * Used to keep track when samples should be integrated even if they
   * are not children of invocation trace events. This is useful in
   * cases where we can be missing the start of JS invocation events if
   * we start tracing half-way through.
   */
  #fakeJSInvocation = false;
  /**
   * The parsed CPU profile, holding the tree hierarchy of JS frames and
   * the sample data.
   */
  #profileModel;
  /**
   * Because GC nodes don't have a stack, we artificially add a stack to
   * them which corresponds to that of the previous sample. This map
   * tracks which node is used for the stack of a GC call.
   * Note that GC samples are not shown in the flamechart, however they
   * are used during the construction of for profile calls, as we can
   * infer information about the duration of the executed code when a
   * GC node is sampled.
   */
  #nodeForGC = /* @__PURE__ */ new Map();
  #engineConfig;
  #profileId;
  /**
   * Keeps track of the individual samples from the CPU Profile.
   * Only used with Debug Mode experiment enabled.
   */
  jsSampleEvents = [];
  constructor(profileModel, profileId, pid, tid, configuration) {
    this.#profileModel = profileModel;
    this.#threadId = tid;
    this.#processId = pid;
    this.#engineConfig = configuration || Types.Configuration.defaults();
    this.#profileId = profileId;
  }
  buildProfileCalls(traceEvents) {
    const mergedEvents = mergeEventsInOrder(traceEvents, this.callsFromProfileSamples());
    const stack = [];
    for (let i = 0; i < mergedEvents.length; i++) {
      const event = mergedEvents[i];
      if (event.ph === Types.Events.Phase.INSTANT && !extractSampleTraceId(event)) {
        continue;
      }
      if (stack.length === 0) {
        if (Types.Events.isProfileCall(event)) {
          this.#onProfileCall(event);
          continue;
        }
        stack.push(event);
        this.#onTraceEventStart(event);
        continue;
      }
      const parentEvent = stack.at(-1);
      if (parentEvent === void 0) {
        continue;
      }
      const begin = event.ts;
      const parentBegin = parentEvent.ts;
      const parentDuration = parentEvent.dur || 0;
      const parentEnd = parentBegin + parentDuration;
      const startsAfterParent = begin >= parentEnd;
      if (startsAfterParent) {
        this.#onTraceEventEnd(parentEvent);
        stack.pop();
        i--;
        continue;
      }
      if (Types.Events.isProfileCall(event)) {
        this.#onProfileCall(event, parentEvent);
        continue;
      }
      this.#onTraceEventStart(event);
      stack.push(event);
    }
    while (stack.length) {
      const last = stack.pop();
      if (last) {
        this.#onTraceEventEnd(last);
      }
    }
    sortTraceEventsInPlace(this.jsSampleEvents);
    return this.#constructedProfileCalls;
  }
  #onTraceEventStart(event) {
    if (event.name === Types.Events.Name.RUN_MICROTASKS || event.name === Types.Events.Name.RUN_TASK) {
      this.#lockedJsStackDepth = [];
      this.#truncateJSStack(0, event.ts);
      this.#fakeJSInvocation = false;
    }
    if (this.#fakeJSInvocation) {
      this.#truncateJSStack(this.#lockedJsStackDepth.pop() || 0, event.ts);
      this.#fakeJSInvocation = false;
    }
    this.#extractStackTrace(event);
    this.#lockedJsStackDepth.push(this.#currentJSStack.length);
  }
  #onProfileCall(event, parent) {
    if (parent && Types.Events.isJSInvocationEvent(parent) || this.#fakeJSInvocation) {
      this.#extractStackTrace(event);
    } else if (Types.Events.isProfileCall(event) && this.#currentJSStack.length === 0) {
      this.#fakeJSInvocation = true;
      const stackDepthBefore = this.#currentJSStack.length;
      this.#extractStackTrace(event);
      this.#lockedJsStackDepth.push(stackDepthBefore);
    }
  }
  #onTraceEventEnd(event) {
    const endTime = Types.Timing.Micro(event.ts + (event.dur ?? 0));
    this.#truncateJSStack(this.#lockedJsStackDepth.pop() || 0, endTime);
  }
  /**
   * Builds the initial calls with no duration from samples. Their
   * purpose is to be merged with the trace event array being parsed so
   * that they can be traversed in order with them and their duration
   * can be updated as the SampleIntegrator callbacks are invoked.
   */
  callsFromProfileSamples() {
    const samples = this.#profileModel.samples;
    const timestamps = this.#profileModel.timestamps;
    if (!samples) {
      return [];
    }
    const calls = [];
    let prevNode;
    for (let i = 0; i < samples.length; i++) {
      const node = this.#profileModel.nodeByIndex(i);
      const timestamp = milliToMicro(Types.Timing.Milli(timestamps[i]));
      if (!node) {
        continue;
      }
      const call = makeProfileCall(node, this.#profileId, i, timestamp, this.#processId, this.#threadId);
      calls.push(call);
      if (this.#engineConfig.debugMode) {
        const traceId = this.#profileModel.traceIds?.[i];
        this.jsSampleEvents.push(this.#makeJSSampleEvent(call, timestamp, traceId));
      }
      if (node.id === this.#profileModel.gcNode?.id && prevNode) {
        this.#nodeForGC.set(call, prevNode);
        continue;
      }
      prevNode = node;
    }
    return calls;
  }
  /**
   * Given a synthetic profile call, returns an array of profile calls
   * representing the stack trace that profile call belongs to based on
   * its nodeId. The input profile call will be at the top of the
   * returned stack (last position), meaning that any other frames that
   * were effectively above it are omitted.
   * @param profileCall
   * @param overrideTimeStamp a custom timestamp to use for the returned
   * profile calls. If not defined, the timestamp of the input
   * profileCall is used instead. This param is useful for example when
   * creating the profile calls for a sample with a trace id, since the
   * timestamp of the corresponding trace event should be used instead
   * of the sample's.
   */
  #makeProfileCallsForStack(profileCall, overrideTimeStamp) {
    let node = this.#profileModel.nodeById(profileCall.nodeId);
    const isGarbageCollection = node?.id === this.#profileModel.gcNode?.id;
    if (isGarbageCollection) {
      node = this.#nodeForGC.get(profileCall) || null;
    }
    if (!node) {
      return [];
    }
    const callFrames = new Array(node.depth + 1 + Number(isGarbageCollection));
    let i = callFrames.length - 1;
    if (isGarbageCollection) {
      callFrames[i--] = profileCall;
    }
    while (node) {
      callFrames[i--] = makeProfileCall(
        node,
        profileCall.profileId,
        profileCall.sampleIndex,
        overrideTimeStamp ?? profileCall.ts,
        this.#processId,
        this.#threadId
      );
      node = node.parent;
    }
    return callFrames;
  }
  #getStackForSampleTraceId(traceId, timestamp) {
    const nodeId = this.#profileModel.traceIds?.[traceId];
    const node = nodeId && this.#profileModel.nodeById(nodeId);
    const maybeCallForTraceId = node && makeProfileCall(node, this.#profileId, -1, timestamp, this.#processId, this.#threadId);
    if (!maybeCallForTraceId) {
      return null;
    }
    if (this.#engineConfig.debugMode) {
      this.jsSampleEvents.push(this.#makeJSSampleEvent(maybeCallForTraceId, timestamp, traceId));
    }
    return this.#makeProfileCallsForStack(maybeCallForTraceId);
  }
  /**
   * Update tracked stack using this event's call stack.
   */
  #extractStackTrace(event) {
    let stackTrace = this.#currentJSStack;
    if (Types.Events.isProfileCall(event)) {
      stackTrace = this.#makeProfileCallsForStack(event);
    }
    const traceId = extractSampleTraceId(event);
    const maybeCallForTraceId = traceId && this.#getStackForSampleTraceId(traceId, event.ts);
    if (maybeCallForTraceId) {
      stackTrace = maybeCallForTraceId;
    }
    SamplesIntegrator.filterStackFrames(stackTrace, this.#engineConfig);
    const endTime = event.ts + (event.dur || 0);
    const minFrames = Math.min(stackTrace.length, this.#currentJSStack.length);
    let i;
    for (i = this.#lockedJsStackDepth.at(-1) || 0; i < minFrames; ++i) {
      const newFrame = stackTrace[i].callFrame;
      const oldFrame = this.#currentJSStack[i].callFrame;
      if (!SamplesIntegrator.framesAreEqual(newFrame, oldFrame)) {
        break;
      }
      this.#currentJSStack[i].dur = Types.Timing.Micro(Math.max(this.#currentJSStack[i].dur || 0, endTime - this.#currentJSStack[i].ts));
    }
    this.#truncateJSStack(i, event.ts);
    for (; i < stackTrace.length; ++i) {
      const call = stackTrace[i];
      if (call.nodeId === this.#profileModel.programNode?.id || call.nodeId === this.#profileModel.root?.id || call.nodeId === this.#profileModel.idleNode?.id || call.nodeId === this.#profileModel.gcNode?.id) {
        continue;
      }
      this.#currentJSStack.push(call);
      this.#constructedProfileCalls.push(call);
    }
  }
  /**
   * When a call stack that differs from the one we are tracking has
   * been detected in the samples, the latter is "truncated" by
   * setting the ending time of its call frames and removing the top
   * call frames that aren't shared with the new call stack. This way,
   * we can update the tracked stack with the new call frames on top.
   * @param depth the amount of call frames from bottom to top that
   * should be kept in the tracking stack trace. AKA amount of shared
   * call frames between two stacks.
   * @param time the new end of the call frames in the stack.
   */
  #truncateJSStack(depth, time) {
    if (this.#lockedJsStackDepth.length) {
      const lockedDepth = this.#lockedJsStackDepth.at(-1);
      if (lockedDepth && depth < lockedDepth) {
        console.error(`Child stack is shallower (${depth}) than the parent stack (${lockedDepth}) at ${time}`);
        depth = lockedDepth;
      }
    }
    if (this.#currentJSStack.length < depth) {
      console.error(`Trying to truncate higher than the current stack size at ${time}`);
      depth = this.#currentJSStack.length;
    }
    for (let k = 0; k < this.#currentJSStack.length; ++k) {
      this.#currentJSStack[k].dur = Types.Timing.Micro(Math.max(time - this.#currentJSStack[k].ts, 0));
    }
    this.#currentJSStack.length = depth;
  }
  #makeJSSampleEvent(call, timestamp, traceId) {
    const JSSampleEvent = {
      name: Types.Events.Name.JS_SAMPLE,
      cat: "devtools.timeline",
      args: {
        data: { traceId, stackTrace: this.#makeProfileCallsForStack(call).map((e) => e.callFrame) }
      },
      ph: Types.Events.Phase.INSTANT,
      ts: timestamp,
      dur: Types.Timing.Micro(0),
      pid: this.#processId,
      tid: this.#threadId
    };
    return JSSampleEvent;
  }
  static framesAreEqual(frame1, frame2) {
    return frame1.scriptId === frame2.scriptId && frame1.functionName === frame2.functionName && frame1.lineNumber === frame2.lineNumber;
  }
  static showNativeName(name, runtimeCallStatsEnabled) {
    return runtimeCallStatsEnabled && Boolean(SamplesIntegrator.nativeGroup(name));
  }
  static nativeGroup(nativeName) {
    if (nativeName.startsWith("Parse")) {
      return SamplesIntegrator.NativeGroups.PARSE;
    }
    if (nativeName.startsWith("Compile") || nativeName.startsWith("Recompile")) {
      return SamplesIntegrator.NativeGroups.COMPILE;
    }
    return null;
  }
  static isNativeRuntimeFrame(frame) {
    return frame.url === "native V8Runtime";
  }
  static filterStackFrames(stack, engineConfig) {
    const showAllEvents = engineConfig.showAllEvents;
    if (showAllEvents) {
      return;
    }
    let previousNativeFrameName = null;
    let j = 0;
    for (let i = 0; i < stack.length; ++i) {
      const frame = stack[i].callFrame;
      const nativeRuntimeFrame = SamplesIntegrator.isNativeRuntimeFrame(frame);
      if (nativeRuntimeFrame && !SamplesIntegrator.showNativeName(frame.functionName, engineConfig.includeRuntimeCallStats)) {
        continue;
      }
      const nativeFrameName = nativeRuntimeFrame ? SamplesIntegrator.nativeGroup(frame.functionName) : null;
      if (previousNativeFrameName && previousNativeFrameName === nativeFrameName) {
        continue;
      }
      previousNativeFrameName = nativeFrameName;
      stack[j++] = stack[i];
    }
    stack.length = j;
  }
  static createFakeTraceFromCpuProfile(profile, tid) {
    if (!profile) {
      return { traceEvents: [], metadata: {} };
    }
    const cpuProfileEvent = {
      cat: "disabled-by-default-devtools.timeline",
      name: Types.Events.Name.CPU_PROFILE,
      ph: Types.Events.Phase.COMPLETE,
      pid: Types.Events.ProcessID(1),
      tid,
      ts: Types.Timing.Micro(profile.startTime),
      dur: Types.Timing.Micro(profile.endTime - profile.startTime),
      args: { data: { cpuProfile: profile } },
      // Create an arbitrary profile id.
      id: "0x1"
    };
    return {
      traceEvents: [cpuProfileEvent],
      metadata: {
        dataOrigin: Types.File.DataOrigin.CPU_PROFILE
      }
    };
  }
  static extractCpuProfileFromFakeTrace(traceEvents) {
    const profileEvent = traceEvents.find((e) => Types.Events.isSyntheticCpuProfile(e));
    const profile = profileEvent?.args.data.cpuProfile;
    if (!profile) {
      throw new Error("Missing cpuProfile data");
    }
    return profile;
  }
}
((SamplesIntegrator2) => {
  let NativeGroups;
  ((NativeGroups2) => {
    NativeGroups2["COMPILE"] = "Compile";
    NativeGroups2["PARSE"] = "Parse";
  })(NativeGroups = SamplesIntegrator2.NativeGroups || (SamplesIntegrator2.NativeGroups = {}));
})(SamplesIntegrator || (SamplesIntegrator = {}));
//# sourceMappingURL=SamplesIntegrator.js.map
