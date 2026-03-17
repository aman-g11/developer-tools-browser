"use strict";
import * as Platform from "../../core/platform/platform.js";
import * as FormatterActions from "../../entrypoints/formatter_worker/FormatterActions.js";
export { DefinitionKind, ScopeKind } from "../../entrypoints/formatter_worker/FormatterActions.js";
let formatterWorkerPoolInstance;
export class FormatterWorkerPool {
  taskQueue;
  workerTasks;
  entrypointURL;
  constructor(entrypointURL) {
    this.taskQueue = [];
    this.workerTasks = /* @__PURE__ */ new Map();
    this.entrypointURL = entrypointURL ?? import.meta.resolve("../../entrypoints/formatter_worker/formatter_worker-entrypoint.js");
  }
  static instance(opts) {
    if (!formatterWorkerPoolInstance || opts?.forceNew) {
      formatterWorkerPoolInstance = new FormatterWorkerPool(opts?.entrypointURL);
    }
    return formatterWorkerPoolInstance;
  }
  dispose() {
    for (const task of this.taskQueue) {
      console.error("rejecting task");
      task.errorCallback(new Event("Worker terminated"));
    }
    for (const [worker, task] of this.workerTasks.entries()) {
      task?.errorCallback(new Event("Worker terminated"));
      worker.terminate(
        /* immediately=*/
        true
      );
    }
  }
  static removeInstance() {
    formatterWorkerPoolInstance?.dispose();
    formatterWorkerPoolInstance = void 0;
  }
  createWorker() {
    const worker = Platform.HostRuntime.HOST_RUNTIME.createWorker(this.entrypointURL);
    worker.onmessage = this.onWorkerMessage.bind(this, worker);
    worker.onerror = this.onWorkerError.bind(this, worker);
    return worker;
  }
  processNextTask() {
    const maxWorkers = Math.max(2, navigator.hardwareConcurrency - 1);
    if (!this.taskQueue.length) {
      return;
    }
    let freeWorker = [...this.workerTasks.keys()].find((worker) => !this.workerTasks.get(worker));
    if (!freeWorker && this.workerTasks.size < maxWorkers) {
      freeWorker = this.createWorker();
    }
    if (!freeWorker) {
      return;
    }
    const task = this.taskQueue.shift();
    if (task) {
      this.workerTasks.set(freeWorker, task);
      freeWorker.postMessage({ method: task.method, params: task.params });
    }
  }
  onWorkerMessage(worker, event) {
    const task = this.workerTasks.get(worker);
    if (!task) {
      return;
    }
    if (task.isChunked && event.data && !event.data["isLastChunk"]) {
      task.callback(event.data);
      return;
    }
    this.workerTasks.set(worker, null);
    this.processNextTask();
    task.callback(event.data ? event.data : null);
  }
  onWorkerError(worker, event) {
    console.error(event);
    const task = this.workerTasks.get(worker);
    worker.terminate();
    this.workerTasks.delete(worker);
    const newWorker = this.createWorker();
    this.workerTasks.set(newWorker, null);
    this.processNextTask();
    if (task) {
      task.errorCallback(event);
    }
  }
  runChunkedTask(methodName, params, callback) {
    const task = new Task(methodName, params, onData, () => onData(null), true);
    this.taskQueue.push(task);
    this.processNextTask();
    function onData(data) {
      if (!data) {
        callback(true, null);
        return;
      }
      const isLastChunk = "isLastChunk" in data && Boolean(data["isLastChunk"]);
      const chunk = "chunk" in data && data["chunk"];
      callback(isLastChunk, chunk);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  runTask(methodName, params) {
    return new Promise((resolve, reject) => {
      const task = new Task(methodName, params, resolve, reject, false);
      this.taskQueue.push(task);
      this.processNextTask();
    });
  }
  format(mimeType, content, indentString) {
    const parameters = { mimeType, content, indentString };
    return this.runTask(FormatterActions.FormatterActions.FORMAT, parameters);
  }
  javaScriptSubstitute(expression, mapping) {
    if (mapping.size === 0) {
      return Promise.resolve(expression);
    }
    return this.runTask(FormatterActions.FormatterActions.JAVASCRIPT_SUBSTITUTE, { content: expression, mapping }).then((result) => result || "");
  }
  javaScriptScopeTree(expression, sourceType = "script") {
    return this.runTask(FormatterActions.FormatterActions.JAVASCRIPT_SCOPE_TREE, { content: expression, sourceType }).then((result) => result || null);
  }
  parseCSS(content, callback) {
    this.runChunkedTask(FormatterActions.FormatterActions.PARSE_CSS, { content }, onDataChunk);
    function onDataChunk(isLastChunk, data) {
      const rules = data || [];
      callback(isLastChunk, rules);
    }
  }
}
class Task {
  method;
  params;
  callback;
  errorCallback;
  isChunked;
  constructor(method, params, callback, errorCallback, isChunked) {
    this.method = method;
    this.params = params;
    this.callback = callback;
    this.errorCallback = errorCallback;
    this.isChunked = isChunked;
  }
}
export function formatterWorkerPool() {
  return FormatterWorkerPool.instance();
}
//# sourceMappingURL=FormatterWorkerPool.js.map
