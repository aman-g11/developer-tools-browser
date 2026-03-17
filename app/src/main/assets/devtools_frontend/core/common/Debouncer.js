"use strict";
export const debounce = function(func, delay) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), testDebounceOverride ? 0 : delay);
  };
  return debounced;
};
let testDebounceOverride = false;
export function enableTestOverride() {
  testDebounceOverride = true;
}
export function disableTestOverride() {
  testDebounceOverride = false;
}
//# sourceMappingURL=Debouncer.js.map
