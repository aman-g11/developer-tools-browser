"use strict";
export function* arrayOfObjectsJsonGenerator(arrayOfObjects) {
  const ITEMS_PER_ITERATION = 1e4;
  yield "[\n";
  if (arrayOfObjects.length > 0) {
    const itemsIterator = arrayOfObjects[Symbol.iterator]();
    const firstItem = itemsIterator.next().value;
    yield `  ${JSON.stringify(firstItem)}`;
    let itemsRemaining = ITEMS_PER_ITERATION;
    let itemsJSON = "";
    for (const item of itemsIterator) {
      itemsJSON += `,
  ${JSON.stringify(item)}`;
      itemsRemaining--;
      if (itemsRemaining === 0) {
        yield itemsJSON;
        itemsRemaining = ITEMS_PER_ITERATION;
        itemsJSON = "";
      }
    }
    yield itemsJSON;
  }
  yield "\n]";
}
export function* traceJsonGenerator(traceEvents, metadata) {
  if (metadata?.enhancedTraceVersion) {
    metadata = {
      enhancedTraceVersion: metadata.enhancedTraceVersion,
      ...metadata
    };
  }
  yield `{"metadata": ${JSON.stringify(metadata || {}, null, 2)}`;
  yield ',\n"traceEvents": ';
  yield* arrayOfObjectsJsonGenerator(traceEvents);
  yield "}\n";
}
//# sourceMappingURL=SaveFileFormatter.js.map
