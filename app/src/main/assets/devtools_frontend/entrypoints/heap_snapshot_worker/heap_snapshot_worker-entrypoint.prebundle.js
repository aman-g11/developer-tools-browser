"use strict";
import * as HeapSnapshotWorker from "./heap_snapshot_worker.js";
const dispatcher = new HeapSnapshotWorker.HeapSnapshotWorkerDispatcher.HeapSnapshotWorkerDispatcher(self.postMessage.bind(self));
self.addEventListener("message", dispatcher.dispatchMessage.bind(dispatcher), false);
self.postMessage("workerReady");
//# sourceMappingURL=heap_snapshot_worker-entrypoint.prebundle.js.map
