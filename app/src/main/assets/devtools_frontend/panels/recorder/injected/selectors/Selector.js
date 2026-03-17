"use strict";
export class SelectorPart {
  value;
  optimized;
  constructor(value, optimized) {
    this.value = value;
    this.optimized = optimized || false;
  }
  toString() {
    return this.value;
  }
}
//# sourceMappingURL=Selector.js.map
