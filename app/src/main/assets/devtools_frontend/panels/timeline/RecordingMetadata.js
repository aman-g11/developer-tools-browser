"use strict";
import * as SDK from "../../core/sdk/sdk.js";
import * as EmulationModel from "../../models/emulation/emulation.js";
import * as Trace from "../../models/trace/trace.js";
export function forCPUProfile() {
  return {
    dataOrigin: Trace.Types.File.DataOrigin.CPU_PROFILE
  };
}
export async function forTrace(dataFromController = {}) {
  try {
    return await innerForTraceCalculate(dataFromController);
  } catch {
    return {};
  }
}
async function innerForTraceCalculate({ recordingStartTime, cruxFieldData } = {}) {
  const deviceModeModel = EmulationModel.DeviceModeModel.DeviceModeModel.tryInstance();
  let emulatedDeviceTitle;
  if (deviceModeModel?.type() === EmulationModel.DeviceModeModel.Type.Device) {
    emulatedDeviceTitle = deviceModeModel.device()?.title;
  } else if (deviceModeModel?.type() === EmulationModel.DeviceModeModel.Type.Responsive) {
    emulatedDeviceTitle = "Responsive";
  }
  const cpuThrottling = SDK.CPUThrottlingManager.CPUThrottlingManager.instance().cpuThrottlingRate();
  const networkConditions = SDK.NetworkManager.MultitargetNetworkManager.instance().isThrottling() ? SDK.NetworkManager.MultitargetNetworkManager.instance().networkConditions() : void 0;
  let networkThrottlingConditions;
  let networkTitle;
  if (networkConditions) {
    networkThrottlingConditions = {
      download: networkConditions.download,
      upload: networkConditions.upload,
      latency: networkConditions.latency,
      packetLoss: networkConditions.packetLoss,
      packetQueueLength: networkConditions.packetQueueLength,
      packetReordering: networkConditions.packetReordering,
      targetLatency: networkConditions.targetLatency,
      key: networkConditions.key
    };
    networkTitle = typeof networkConditions.title === "function" ? networkConditions.title() : networkConditions.title;
  }
  return {
    source: "DevTools",
    startTime: recordingStartTime ? new Date(recordingStartTime).toJSON() : void 0,
    // ISO-8601 timestamp
    emulatedDeviceTitle,
    cpuThrottling: cpuThrottling !== 1 ? cpuThrottling : void 0,
    networkThrottling: networkTitle,
    networkThrottlingConditions,
    dataOrigin: Trace.Types.File.DataOrigin.TRACE_EVENTS,
    cruxFieldData: cruxFieldData ?? void 0,
    hostDPR: window.devicePixelRatio
  };
}
//# sourceMappingURL=RecordingMetadata.js.map
