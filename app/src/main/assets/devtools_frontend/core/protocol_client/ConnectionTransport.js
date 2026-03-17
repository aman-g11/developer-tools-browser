"use strict";
let connectionFactory;
export class ConnectionTransport {
  static setFactory(factory) {
    connectionFactory = factory;
  }
  static getFactory() {
    return connectionFactory;
  }
}
//# sourceMappingURL=ConnectionTransport.js.map
