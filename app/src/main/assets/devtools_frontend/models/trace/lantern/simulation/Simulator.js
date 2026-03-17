"use strict";
import * as Core from "../core/core.js";
import * as Graph from "../graph/graph.js";
import { ConnectionPool } from "./ConnectionPool.js";
import { Constants } from "./Constants.js";
import { DNSCache } from "./DNSCache.js";
import { SimulatorTimingMap } from "./SimulationTimingMap.js";
import { TCPConnection } from "./TCPConnection.js";
const defaultThrottling = Constants.throttling.mobileSlow4G;
const DEFAULT_MAXIMUM_CONCURRENT_REQUESTS = 10;
const DEFAULT_LAYOUT_TASK_MULTIPLIER = 0.5;
const DEFAULT_MAXIMUM_CPU_TASK_DURATION = 1e4;
const NodeState = {
  NotReadyToStart: 0,
  ReadyToStart: 1,
  InProgress: 2,
  Complete: 3
};
const PriorityStartTimePenalty = {
  VeryHigh: 0,
  High: 0.25,
  Medium: 0.5,
  Low: 1,
  VeryLow: 2
};
const ALL_SIMULATION_NODE_TIMINGS = /* @__PURE__ */ new Map();
class Simulator {
  static createSimulator(settings) {
    const { throttlingMethod, throttling, precomputedLanternData, networkAnalysis } = settings;
    const options = {
      additionalRttByOrigin: networkAnalysis.additionalRttByOrigin,
      serverResponseTimeByOrigin: networkAnalysis.serverResponseTimeByOrigin,
      observedThroughput: networkAnalysis.throughput
    };
    if (precomputedLanternData) {
      options.additionalRttByOrigin = new Map(Object.entries(precomputedLanternData.additionalRttByOrigin));
      options.serverResponseTimeByOrigin = new Map(Object.entries(precomputedLanternData.serverResponseTimeByOrigin));
    }
    switch (throttlingMethod) {
      case "provided":
        options.rtt = networkAnalysis.rtt;
        options.throughput = networkAnalysis.throughput;
        options.cpuSlowdownMultiplier = 1;
        options.layoutTaskMultiplier = 1;
        break;
      case "devtools":
        if (throttling) {
          options.rtt = throttling.requestLatencyMs / Constants.throttling.DEVTOOLS_RTT_ADJUSTMENT_FACTOR;
          options.throughput = throttling.downloadThroughputKbps * 1024 / Constants.throttling.DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR;
        }
        options.cpuSlowdownMultiplier = 1;
        options.layoutTaskMultiplier = 1;
        break;
      case "simulate":
        if (throttling) {
          options.rtt = throttling.rttMs;
          options.throughput = throttling.throughputKbps * 1024;
          options.cpuSlowdownMultiplier = throttling.cpuSlowdownMultiplier;
        }
        break;
      default:
        break;
    }
    return new Simulator(options);
  }
  options;
  _rtt;
  throughput;
  maximumConcurrentRequests;
  cpuSlowdownMultiplier;
  layoutTaskMultiplier;
  cachedNodeListByStartPosition;
  nodeTimings;
  numberInProgressByType;
  nodes;
  dns;
  connectionPool;
  constructor(options) {
    this.options = Object.assign(
      {
        rtt: defaultThrottling.rttMs,
        throughput: defaultThrottling.throughputKbps * 1024,
        maximumConcurrentRequests: DEFAULT_MAXIMUM_CONCURRENT_REQUESTS,
        cpuSlowdownMultiplier: defaultThrottling.cpuSlowdownMultiplier,
        layoutTaskMultiplier: DEFAULT_LAYOUT_TASK_MULTIPLIER,
        additionalRttByOrigin: /* @__PURE__ */ new Map(),
        serverResponseTimeByOrigin: /* @__PURE__ */ new Map()
      },
      options
    );
    this._rtt = this.options.rtt;
    this.throughput = this.options.throughput;
    this.maximumConcurrentRequests = Math.max(
      Math.min(
        TCPConnection.maximumSaturatedConnections(this._rtt, this.throughput),
        this.options.maximumConcurrentRequests
      ),
      1
    );
    this.cpuSlowdownMultiplier = this.options.cpuSlowdownMultiplier;
    this.layoutTaskMultiplier = this.cpuSlowdownMultiplier * this.options.layoutTaskMultiplier;
    this.cachedNodeListByStartPosition = [];
    this.nodeTimings = new SimulatorTimingMap();
    this.numberInProgressByType = /* @__PURE__ */ new Map();
    this.nodes = {};
    this.dns = new DNSCache({ rtt: this._rtt });
    this.connectionPool = null;
    if (!Number.isFinite(this._rtt)) {
      throw new Core.LanternError(`Invalid rtt ${this._rtt}`);
    }
    if (!Number.isFinite(this.throughput)) {
      throw new Core.LanternError(`Invalid throughput ${this.throughput}`);
    }
  }
  get rtt() {
    return this._rtt;
  }
  initializeConnectionPool(graph) {
    const records = [];
    graph.getRootNode().traverse((node) => {
      if (node.type === Graph.BaseNode.types.NETWORK) {
        records.push(node.request);
      }
    });
    this.connectionPool = new ConnectionPool(records, this.options);
  }
  /**
   * Initializes the various state data structures such _nodeTimings and the _node Sets by state.
   */
  initializeAuxiliaryData() {
    this.nodeTimings = new SimulatorTimingMap();
    this.numberInProgressByType = /* @__PURE__ */ new Map();
    this.nodes = {};
    this.cachedNodeListByStartPosition = [];
    for (const state of Object.values(NodeState)) {
      this.nodes[state] = /* @__PURE__ */ new Set();
    }
  }
  numberInProgress(type) {
    return this.numberInProgressByType.get(type) || 0;
  }
  markNodeAsReadyToStart(node, queuedTime) {
    const nodeStartPosition = Simulator.computeNodeStartPosition(node);
    const firstNodeIndexWithGreaterStartPosition = this.cachedNodeListByStartPosition.findIndex(
      (candidate) => Simulator.computeNodeStartPosition(candidate) > nodeStartPosition
    );
    const insertionIndex = firstNodeIndexWithGreaterStartPosition === -1 ? this.cachedNodeListByStartPosition.length : firstNodeIndexWithGreaterStartPosition;
    this.cachedNodeListByStartPosition.splice(insertionIndex, 0, node);
    this.nodes[NodeState.ReadyToStart].add(node);
    this.nodes[NodeState.NotReadyToStart].delete(node);
    this.nodeTimings.setReadyToStart(node, { queuedTime });
  }
  markNodeAsInProgress(node, startTime) {
    const indexOfNodeToStart = this.cachedNodeListByStartPosition.indexOf(node);
    this.cachedNodeListByStartPosition.splice(indexOfNodeToStart, 1);
    this.nodes[NodeState.InProgress].add(node);
    this.nodes[NodeState.ReadyToStart].delete(node);
    this.numberInProgressByType.set(node.type, this.numberInProgress(node.type) + 1);
    this.nodeTimings.setInProgress(node, { startTime });
  }
  markNodeAsComplete(node, endTime, connectionTiming) {
    this.nodes[NodeState.Complete].add(node);
    this.nodes[NodeState.InProgress].delete(node);
    this.numberInProgressByType.set(node.type, this.numberInProgress(node.type) - 1);
    this.nodeTimings.setCompleted(node, { endTime, connectionTiming });
    for (const dependent of node.getDependents()) {
      const dependencies = dependent.getDependencies();
      if (dependencies.some((dep) => !this.nodes[NodeState.Complete].has(dep))) {
        continue;
      }
      this.markNodeAsReadyToStart(dependent, endTime);
    }
  }
  acquireConnection(request) {
    return this.connectionPool.acquire(request);
  }
  getNodesSortedByStartPosition() {
    return Array.from(this.cachedNodeListByStartPosition);
  }
  startNodeIfPossible(node, totalElapsedTime) {
    if (node.type === Graph.BaseNode.types.CPU) {
      if (this.numberInProgress(node.type) === 0) {
        this.markNodeAsInProgress(node, totalElapsedTime);
      }
      return;
    }
    if (node.type !== Graph.BaseNode.types.NETWORK) {
      throw new Core.LanternError("Unsupported");
    }
    if (!node.isConnectionless) {
      const numberOfActiveRequests = this.numberInProgress(node.type);
      if (numberOfActiveRequests >= this.maximumConcurrentRequests) {
        return;
      }
      const connection = this.acquireConnection(node.request);
      if (!connection) {
        return;
      }
    }
    this.markNodeAsInProgress(node, totalElapsedTime);
  }
  /**
   * Updates each connection in use with the available throughput based on the number of network requests
   * currently in flight.
   */
  updateNetworkCapacity() {
    const inFlight = this.numberInProgress(Graph.BaseNode.types.NETWORK);
    if (inFlight === 0) {
      return;
    }
    for (const connection of this.connectionPool.connectionsInUse()) {
      connection.setThroughput(this.throughput / inFlight);
    }
  }
  /**
   * Estimates the number of milliseconds remaining given current conditions before the node is complete.
   */
  estimateTimeRemaining(node) {
    if (node.type === Graph.BaseNode.types.CPU) {
      return this.estimateCPUTimeRemaining(node);
    }
    if (node.type === Graph.BaseNode.types.NETWORK) {
      return this.estimateNetworkTimeRemaining(node);
    }
    throw new Core.LanternError("Unsupported");
  }
  estimateCPUTimeRemaining(cpuNode) {
    const timingData = this.nodeTimings.getCpuStarted(cpuNode);
    const multiplier = cpuNode.didPerformLayout() ? this.layoutTaskMultiplier : this.cpuSlowdownMultiplier;
    const totalDuration = Math.min(
      Math.round(cpuNode.duration / 1e3 * multiplier),
      DEFAULT_MAXIMUM_CPU_TASK_DURATION
    );
    const estimatedTimeElapsed = totalDuration - timingData.timeElapsed;
    this.nodeTimings.setCpuEstimated(cpuNode, { estimatedTimeElapsed });
    return estimatedTimeElapsed;
  }
  estimateNetworkTimeRemaining(networkNode) {
    const request = networkNode.request;
    const timingData = this.nodeTimings.getNetworkStarted(networkNode);
    let timeElapsed = 0;
    if (networkNode.fromDiskCache) {
      const sizeInMb = (request.resourceSize || 0) / 1024 / 1024;
      timeElapsed = 8 + 20 * sizeInMb - timingData.timeElapsed;
    } else if (networkNode.isNonNetworkProtocol) {
      const sizeInMb = (request.resourceSize || 0) / 1024 / 1024;
      timeElapsed = 2 + 10 * sizeInMb - timingData.timeElapsed;
    } else {
      const connection = this.connectionPool.acquireActiveConnectionFromRequest(request);
      const dnsResolutionTime = this.dns.getTimeUntilResolution(request, {
        requestedAt: timingData.startTime,
        shouldUpdateCache: true
      });
      const timeAlreadyElapsed = timingData.timeElapsed;
      const calculation = connection.simulateDownloadUntil(
        request.transferSize - timingData.bytesDownloaded,
        { timeAlreadyElapsed, dnsResolutionTime, maximumTimeToElapse: Infinity }
      );
      timeElapsed = calculation.timeElapsed;
    }
    const estimatedTimeElapsed = timeElapsed + timingData.timeElapsedOvershoot;
    this.nodeTimings.setNetworkEstimated(networkNode, { estimatedTimeElapsed });
    return estimatedTimeElapsed;
  }
  /**
   * Computes and returns the minimum estimated completion time of the nodes currently in progress.
   */
  findNextNodeCompletionTime() {
    let minimumTime = Infinity;
    for (const node of this.nodes[NodeState.InProgress]) {
      minimumTime = Math.min(minimumTime, this.estimateTimeRemaining(node));
    }
    return minimumTime;
  }
  /**
   * Given a time period, computes the progress toward completion that the node made during that time.
   */
  updateProgressMadeInTimePeriod(node, timePeriodLength, totalElapsedTime) {
    const timingData = this.nodeTimings.getInProgress(node);
    const isFinished = timingData.estimatedTimeElapsed === timePeriodLength;
    if (node.type === Graph.BaseNode.types.CPU || node.isConnectionless) {
      if (isFinished) {
        this.markNodeAsComplete(node, totalElapsedTime);
      } else {
        timingData.timeElapsed += timePeriodLength;
      }
      return;
    }
    if (node.type !== Graph.BaseNode.types.NETWORK) {
      throw new Core.LanternError("Unsupported");
    }
    if (!("bytesDownloaded" in timingData)) {
      throw new Core.LanternError("Invalid timing data");
    }
    const request = node.request;
    const connection = this.connectionPool.acquireActiveConnectionFromRequest(request);
    const dnsResolutionTime = this.dns.getTimeUntilResolution(request, {
      requestedAt: timingData.startTime,
      shouldUpdateCache: true
    });
    const calculation = connection.simulateDownloadUntil(
      request.transferSize - timingData.bytesDownloaded,
      {
        dnsResolutionTime,
        timeAlreadyElapsed: timingData.timeElapsed,
        maximumTimeToElapse: timePeriodLength - timingData.timeElapsedOvershoot
      }
    );
    connection.setCongestionWindow(calculation.congestionWindow);
    connection.setH2OverflowBytesDownloaded(calculation.extraBytesDownloaded);
    if (isFinished) {
      connection.setWarmed(true);
      this.connectionPool.release(request);
      this.markNodeAsComplete(node, totalElapsedTime, calculation.connectionTiming);
    } else {
      timingData.timeElapsed += calculation.timeElapsed;
      timingData.timeElapsedOvershoot += calculation.timeElapsed - timePeriodLength;
      timingData.bytesDownloaded += calculation.bytesDownloaded;
    }
  }
  computeFinalNodeTimings() {
    const completeNodeTimingEntries = this.nodeTimings.getNodes().map((node) => {
      return [node, this.nodeTimings.getCompleted(node)];
    });
    completeNodeTimingEntries.sort((a, b) => a[1].startTime - b[1].startTime);
    const nodeTimingEntries = completeNodeTimingEntries.map(([node, timing]) => {
      return [
        node,
        {
          startTime: timing.startTime,
          endTime: timing.endTime,
          duration: timing.endTime - timing.startTime
        }
      ];
    });
    return {
      nodeTimings: new Map(nodeTimingEntries),
      completeNodeTimings: new Map(completeNodeTimingEntries)
    };
  }
  getOptions() {
    return this.options;
  }
  /**
   * Estimates the time taken to process all of the graph's nodes, returns the overall time along with
   * each node annotated by start/end times.
   *
   * Simulator/connection pool are allowed to deviate from what was
   * observed in the trace/devtoolsLog and start requests as soon as they are queued (i.e. do not
   * wait around for a warm connection to be available if the original request was fetched on a warm
   * connection).
   */
  simulate(graph, options) {
    if (Graph.BaseNode.findCycle(graph)) {
      throw new Core.LanternError("Cannot simulate graph with cycle");
    }
    options = Object.assign(
      {
        label: void 0
      },
      options
    );
    this.dns = new DNSCache({ rtt: this._rtt });
    this.initializeConnectionPool(graph);
    this.initializeAuxiliaryData();
    const nodesNotReadyToStart = this.nodes[NodeState.NotReadyToStart];
    const nodesReadyToStart = this.nodes[NodeState.ReadyToStart];
    const nodesInProgress = this.nodes[NodeState.InProgress];
    const rootNode = graph.getRootNode();
    rootNode.traverse((node) => nodesNotReadyToStart.add(node));
    let totalElapsedTime = 0;
    let iteration = 0;
    this.markNodeAsReadyToStart(rootNode, totalElapsedTime);
    while (nodesReadyToStart.size || nodesInProgress.size) {
      for (const node of this.getNodesSortedByStartPosition()) {
        this.startNodeIfPossible(node, totalElapsedTime);
      }
      if (!nodesInProgress.size) {
        throw new Core.LanternError("Failed to start a node");
      }
      this.updateNetworkCapacity();
      const minimumTime = this.findNextNodeCompletionTime();
      totalElapsedTime += minimumTime;
      if (!Number.isFinite(minimumTime) || iteration > 1e5) {
        throw new Core.LanternError("Simulation failed, depth exceeded");
      }
      iteration++;
      for (const node of nodesInProgress) {
        this.updateProgressMadeInTimePeriod(node, minimumTime, totalElapsedTime);
      }
    }
    const { nodeTimings, completeNodeTimings } = this.computeFinalNodeTimings();
    ALL_SIMULATION_NODE_TIMINGS.set(options.label || "unlabeled", completeNodeTimings);
    return {
      timeInMs: totalElapsedTime,
      nodeTimings
    };
  }
  computeWastedMsFromWastedBytes(wastedBytes) {
    const { throughput, observedThroughput } = this.options;
    const bitsPerSecond = throughput === 0 ? observedThroughput : throughput;
    if (bitsPerSecond === 0) {
      return 0;
    }
    const wastedBits = wastedBytes * 8;
    const wastedMs = wastedBits / bitsPerSecond * 1e3;
    return Math.round(wastedMs / 10) * 10;
  }
  // Used by Lighthouse asset-saver
  static get allNodeTimings() {
    return ALL_SIMULATION_NODE_TIMINGS;
  }
  /**
   * We attempt to start nodes by their observed start time using the request priority as a tie breaker.
   * When simulating, just because a low priority image started 5ms before a high priority image doesn't mean
   * it would have happened like that when the network was slower.
   */
  static computeNodeStartPosition(node) {
    if (node.type === "cpu") {
      return node.startTime;
    }
    return node.startTime + (PriorityStartTimePenalty[node.request.priority] * 1e3 * 1e3 || 0);
  }
}
export { Simulator };
//# sourceMappingURL=Simulator.js.map
