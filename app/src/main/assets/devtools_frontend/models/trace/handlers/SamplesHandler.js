"use strict";
import * as Platform from "../../../core/platform/platform.js";
import * as CPUProfile from "../../cpu_profile/cpu_profile.js";
import * as Helpers from "../helpers/helpers.js";
import * as Types from "../types/types.js";
let profilesInProcess = /* @__PURE__ */ new Map();
let entryToNode = /* @__PURE__ */ new Map();
let preprocessedData = /* @__PURE__ */ new Map();
const PROFILE_SOURCES_BY_PRIORITY = {
  cpuProfile: ["Inspector"],
  performanceTrace: ["Internal", "Inspector"]
};
function parseCPUProfileData(parseOptions) {
  const priorityList = parseOptions.isCPUProfile ? PROFILE_SOURCES_BY_PRIORITY.cpuProfile : PROFILE_SOURCES_BY_PRIORITY.performanceTrace;
  for (const [processId, profiles] of preprocessedData) {
    const profilesByThread = /* @__PURE__ */ new Map();
    for (const [profileId, preProcessedData] of profiles) {
      const threadId = preProcessedData.threadId;
      if (threadId === void 0) {
        continue;
      }
      const listForThread = Platform.MapUtilities.getWithDefault(profilesByThread, threadId, () => []);
      listForThread.push({ id: profileId, data: preProcessedData });
    }
    for (const [threadId, candidates] of profilesByThread) {
      let buildProfileCallsForCPUProfile2 = function() {
        profileModel.forEachFrame(openFrameCallback, closeFrameCallback);
        function openFrameCallback(depth, node, sampleIndex, timeStampMilliseconds) {
          if (threadId === void 0) {
            return;
          }
          const ts = Helpers.Timing.milliToMicro(Types.Timing.Milli(timeStampMilliseconds));
          const nodeId = node.id;
          const profileCall = Helpers.Trace.makeProfileCall(node, selectedProfileId, sampleIndex, ts, processId, threadId);
          finalizedData.profileCalls.push(profileCall);
          indexStack.push(finalizedData.profileCalls.length - 1);
          const traceEntryNode = Helpers.TreeHelpers.makeEmptyTraceEntryNode(profileCall, nodeId);
          entryToNode.set(profileCall, traceEntryNode);
          traceEntryNode.depth = depth;
          if (indexStack.length === 1) {
            finalizedData.profileTree?.roots.add(traceEntryNode);
          }
        }
        function closeFrameCallback(_depth, _node, _sampleIndex, _timeStampMillis, durMs, selfTimeMs) {
          const profileCallIndex = indexStack.pop();
          const profileCall = profileCallIndex !== void 0 && finalizedData.profileCalls[profileCallIndex];
          if (!profileCall) {
            return;
          }
          const { callFrame, ts, pid, tid } = profileCall;
          const traceEntryNode = entryToNode.get(profileCall);
          if (callFrame === void 0 || ts === void 0 || pid === void 0 || selectedProfileId === void 0 || tid === void 0 || traceEntryNode === void 0) {
            return;
          }
          const dur = Helpers.Timing.milliToMicro(Types.Timing.Milli(durMs));
          const selfTime = Helpers.Timing.milliToMicro(Types.Timing.Milli(selfTimeMs));
          profileCall.dur = dur;
          traceEntryNode.selfTime = selfTime;
          const parentIndex = indexStack.at(-1);
          const parent = parentIndex !== void 0 && finalizedData.profileCalls.at(parentIndex);
          const parentNode = parent && entryToNode.get(parent);
          if (!parentNode) {
            return;
          }
          traceEntryNode.parent = parentNode;
          parentNode.children.push(traceEntryNode);
        }
      };
      var buildProfileCallsForCPUProfile = buildProfileCallsForCPUProfile2;
      if (!candidates.length) {
        continue;
      }
      let chosen = candidates[0];
      for (const source of priorityList) {
        const match = candidates.find((p) => p.data.source === source);
        if (match) {
          chosen = match;
          break;
        }
      }
      const chosenData = chosen.data;
      if (!chosenData.rawProfile.nodes.length) {
        continue;
      }
      const indexStack = [];
      const profileModel = new CPUProfile.CPUProfileDataModel.CPUProfileDataModel(chosenData.rawProfile);
      const profileTree = Helpers.TreeHelpers.makeEmptyTraceEntryTree();
      profileTree.maxDepth = profileModel.maxDepth;
      const selectedProfileId = chosen.id;
      const finalizedData = {
        rawProfile: chosenData.rawProfile,
        parsedProfile: profileModel,
        profileCalls: [],
        profileTree,
        profileId: selectedProfileId
      };
      const dataByThread = Platform.MapUtilities.getWithDefault(profilesInProcess, processId, () => /* @__PURE__ */ new Map());
      dataByThread.set(threadId, finalizedData);
      if (parseOptions.isCPUProfile) {
        buildProfileCallsForCPUProfile2();
      }
    }
  }
}
export function reset() {
  preprocessedData = /* @__PURE__ */ new Map();
  profilesInProcess = /* @__PURE__ */ new Map();
  entryToNode = /* @__PURE__ */ new Map();
}
export function handleEvent(event) {
  if (Types.Events.isSyntheticCpuProfile(event)) {
    const profileData = getOrCreatePreProcessedData(event.pid, event.id);
    profileData.rawProfile = event.args.data.cpuProfile;
    profileData.threadId = event.tid;
    return;
  }
  if (Types.Events.isProfile(event)) {
    const profileData = getOrCreatePreProcessedData(event.pid, event.id);
    profileData.rawProfile.startTime = event.ts;
    profileData.threadId = event.tid;
    assignProfileSourceIfKnown(profileData, event.args?.data?.source);
    return;
  }
  if (Types.Events.isProfileChunk(event)) {
    const profileData = getOrCreatePreProcessedData(event.pid, event.id);
    const cdpProfile = profileData.rawProfile;
    const nodesAndSamples = event.args?.data?.cpuProfile || { samples: [] };
    const samples = nodesAndSamples?.samples || [];
    const traceIds = event.args?.data?.cpuProfile?.trace_ids;
    for (const n of nodesAndSamples?.nodes || []) {
      const lineNumber = typeof n.callFrame.lineNumber === "undefined" ? -1 : n.callFrame.lineNumber;
      const columnNumber = typeof n.callFrame.columnNumber === "undefined" ? -1 : n.callFrame.columnNumber;
      const scriptId = String(n.callFrame.scriptId);
      const url = n.callFrame.url || "";
      const node = {
        ...n,
        callFrame: {
          ...n.callFrame,
          url,
          lineNumber,
          columnNumber,
          scriptId
        }
      };
      cdpProfile.nodes.push(node);
    }
    const timeDeltas = event.args.data?.timeDeltas || [];
    const lines = event.args.data?.lines || Array(samples.length).fill(0);
    const columns = event.args.data?.columns || Array(samples.length).fill(0);
    cdpProfile.samples?.push(...samples);
    cdpProfile.timeDeltas?.push(...timeDeltas);
    cdpProfile.lines?.push(...lines);
    cdpProfile.columns?.push(...columns);
    if (traceIds) {
      cdpProfile.traceIds ??= {};
      for (const key in traceIds) {
        cdpProfile.traceIds[key] = traceIds[key];
      }
    }
    if (cdpProfile.samples && cdpProfile.timeDeltas && cdpProfile.samples.length !== cdpProfile.timeDeltas.length) {
      console.error("Failed to parse CPU profile.");
      return;
    }
    if (!cdpProfile.endTime && cdpProfile.timeDeltas) {
      const timeDeltas2 = cdpProfile.timeDeltas;
      cdpProfile.endTime = timeDeltas2.reduce((x, y) => x + y, cdpProfile.startTime);
    }
    assignProfileSourceIfKnown(profileData, event.args?.data?.source);
    return;
  }
}
export async function finalize(parseOptions = {}) {
  parseCPUProfileData(parseOptions);
}
function assignProfileSourceIfKnown(profileData, source) {
  if (Types.Events.VALID_PROFILE_SOURCES.includes(source)) {
    profileData.source = source;
  }
}
export function data() {
  return {
    profilesInProcess,
    entryToNode
  };
}
function getOrCreatePreProcessedData(processId, profileId) {
  const profileById = Platform.MapUtilities.getWithDefault(preprocessedData, processId, () => /* @__PURE__ */ new Map());
  return Platform.MapUtilities.getWithDefault(
    profileById,
    profileId,
    () => ({
      rawProfile: {
        startTime: 0,
        endTime: 0,
        nodes: [],
        samples: [],
        timeDeltas: [],
        lines: [],
        columns: []
      },
      profileId
    })
  );
}
export function getProfileCallFunctionName(data2, entry) {
  const profile = data2.profilesInProcess.get(entry.pid)?.get(entry.tid);
  const node = profile?.parsedProfile.nodeById(entry.nodeId);
  if (node?.functionName) {
    return node.functionName;
  }
  return entry.callFrame.functionName;
}
//# sourceMappingURL=SamplesHandler.js.map
