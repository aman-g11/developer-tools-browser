"use strict";
import * as Core from "../core/core.js";
import { TCPConnection } from "./TCPConnection.js";
const DEFAULT_SERVER_RESPONSE_TIME = 30;
const TLS_SCHEMES = ["https", "wss"];
const CONNECTIONS_PER_ORIGIN = 6;
export class ConnectionPool {
  options;
  records;
  connectionsByOrigin;
  connectionsByRequest;
  _connectionsInUse;
  connectionReusedByRequestId;
  constructor(records, options) {
    this.options = options;
    this.records = records;
    this.connectionsByOrigin = /* @__PURE__ */ new Map();
    this.connectionsByRequest = /* @__PURE__ */ new Map();
    this._connectionsInUse = /* @__PURE__ */ new Set();
    this.connectionReusedByRequestId = Core.NetworkAnalyzer.estimateIfConnectionWasReused(records, {
      forceCoarseEstimates: true
    });
    this.initializeConnections();
  }
  connectionsInUse() {
    return Array.from(this._connectionsInUse);
  }
  initializeConnections() {
    const connectionReused = this.connectionReusedByRequestId;
    const additionalRttByOrigin = this.options.additionalRttByOrigin;
    const serverResponseTimeByOrigin = this.options.serverResponseTimeByOrigin;
    const recordsByOrigin = Core.NetworkAnalyzer.groupByOrigin(this.records);
    for (const [origin, requests] of recordsByOrigin.entries()) {
      const connections = [];
      const additionalRtt = additionalRttByOrigin.get(origin) || 0;
      const responseTime = serverResponseTimeByOrigin.get(origin) || DEFAULT_SERVER_RESPONSE_TIME;
      for (const request of requests) {
        if (connectionReused.get(request.requestId)) {
          continue;
        }
        const isTLS = TLS_SCHEMES.includes(request.parsedURL.scheme);
        const isH2 = request.protocol === "h2";
        const connection = new TCPConnection(
          this.options.rtt + additionalRtt,
          this.options.throughput,
          responseTime,
          isTLS,
          isH2
        );
        connections.push(connection);
      }
      if (!connections.length) {
        throw new Core.LanternError(`Could not find a connection for origin: ${origin}`);
      }
      const minConnections = connections[0].isH2() ? 1 : CONNECTIONS_PER_ORIGIN;
      while (connections.length < minConnections) {
        connections.push(connections[0].clone());
      }
      this.connectionsByOrigin.set(origin, connections);
    }
  }
  findAvailableConnectionWithLargestCongestionWindow(connections) {
    let maxConnection = null;
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i];
      if (this._connectionsInUse.has(connection)) {
        continue;
      }
      const currentMax = maxConnection?.congestionWindow || -Infinity;
      if (connection.congestionWindow > currentMax) {
        maxConnection = connection;
      }
    }
    return maxConnection;
  }
  /**
   * This method finds an available connection to the origin specified by the network request or null
   * if no connection was available. If returned, connection will not be available for other network
   * records until release is called.
   */
  acquire(request) {
    if (this.connectionsByRequest.has(request)) {
      throw new Core.LanternError("Record already has a connection");
    }
    const origin = request.parsedURL.securityOrigin;
    const connections = this.connectionsByOrigin.get(origin) || [];
    const connectionToUse = this.findAvailableConnectionWithLargestCongestionWindow(connections);
    if (!connectionToUse) {
      return null;
    }
    this._connectionsInUse.add(connectionToUse);
    this.connectionsByRequest.set(request, connectionToUse);
    return connectionToUse;
  }
  /**
   * Return the connection currently being used to fetch a request. If no connection
   * currently being used for this request, an error will be thrown.
   */
  acquireActiveConnectionFromRequest(request) {
    const activeConnection = this.connectionsByRequest.get(request);
    if (!activeConnection) {
      throw new Core.LanternError("Could not find an active connection for request");
    }
    return activeConnection;
  }
  release(request) {
    const connection = this.connectionsByRequest.get(request);
    this.connectionsByRequest.delete(request);
    if (connection) {
      this._connectionsInUse.delete(connection);
    }
  }
}
//# sourceMappingURL=ConnectionPool.js.map
