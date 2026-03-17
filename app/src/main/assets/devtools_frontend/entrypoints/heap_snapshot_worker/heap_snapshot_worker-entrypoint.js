import*as s from"./heap_snapshot_worker.js";var e=new s.HeapSnapshotWorkerDispatcher.HeapSnapshotWorkerDispatcher(self.postMessage.bind(self));self.addEventListener("message",e.dispatchMessage.bind(e),!1);self.postMessage("workerReady");
//# sourceMappingURL=heap_snapshot_worker-entrypoint.js.map
