"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
let lastId = 1;
export class ProtocolService {
  mainSessionId;
  rootTargetId;
  rootTarget;
  lighthouseWorkerPromise;
  lighthouseMessageUpdateCallback;
  removeDialogHandler;
  configForTesting;
  connection;
  async attach() {
    await SDK.TargetManager.TargetManager.instance().suspendAllTargets();
    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      throw new Error("Unable to find main target required for Lighthouse");
    }
    const rootTarget = SDK.TargetManager.TargetManager.instance().rootTarget();
    if (!rootTarget) {
      throw new Error("Could not find the root target");
    }
    const childTargetManager = mainTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!childTargetManager) {
      throw new Error("Unable to find child target manager required for Lighthouse");
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      throw new Error("Unable to find resource tree model required for Lighthouse");
    }
    const rootChildTargetManager = rootTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!rootChildTargetManager) {
      throw new Error("Could not find the child target manager class for the root target");
    }
    const connection = rootTarget.router()?.connection;
    if (!connection) {
      throw new Error("Expected root target to have a session router");
    }
    const rootTargetId = await rootChildTargetManager.getParentTargetId();
    const { sessionId } = await rootTarget.targetAgent().invoke_attachToTarget({ targetId: rootTargetId, flatten: true });
    this.connection = connection;
    this.connection.observe(this);
    const dialogHandler = () => {
      void mainTarget.pageAgent().invoke_handleJavaScriptDialog({ accept: true });
    };
    resourceTreeModel.addEventListener(SDK.ResourceTreeModel.Events.JavaScriptDialogOpening, dialogHandler);
    this.removeDialogHandler = () => resourceTreeModel.removeEventListener(SDK.ResourceTreeModel.Events.JavaScriptDialogOpening, dialogHandler);
    this.rootTargetId = rootTargetId;
    this.rootTarget = rootTarget;
    this.mainSessionId = sessionId;
  }
  getLocales() {
    return [i18n.DevToolsLocale.DevToolsLocale.instance().locale];
  }
  async startTimespan(currentLighthouseRun) {
    const { inspectedURL, categoryIDs, flags } = currentLighthouseRun;
    if (!this.mainSessionId || !this.rootTargetId) {
      throw new Error("Unable to get target info required for Lighthouse");
    }
    await this.sendWithResponse("startTimespan", {
      url: inspectedURL,
      categoryIDs,
      flags,
      config: this.configForTesting,
      locales: this.getLocales(),
      mainSessionId: this.mainSessionId,
      rootTargetId: this.rootTargetId
    });
  }
  async collectLighthouseResults(currentLighthouseRun) {
    const { inspectedURL, categoryIDs, flags } = currentLighthouseRun;
    if (!this.mainSessionId || !this.rootTargetId) {
      throw new Error("Unable to get target info required for Lighthouse");
    }
    let mode = flags.mode;
    if (mode === "timespan") {
      mode = "endTimespan";
    }
    return await this.sendWithResponse(mode, {
      url: inspectedURL,
      categoryIDs,
      flags,
      config: this.configForTesting,
      locales: this.getLocales(),
      mainSessionId: this.mainSessionId,
      rootTargetId: this.rootTargetId
    });
  }
  async detach() {
    const oldLighthouseWorker = this.lighthouseWorkerPromise;
    const oldRootTarget = this.rootTarget;
    this.lighthouseWorkerPromise = void 0;
    this.rootTarget = void 0;
    this.connection?.unobserve(this);
    this.connection = void 0;
    if (oldLighthouseWorker) {
      (await oldLighthouseWorker).terminate();
    }
    if (oldRootTarget && this.mainSessionId) {
      await oldRootTarget.targetAgent().invoke_detachFromTarget({ sessionId: this.mainSessionId });
    }
    await SDK.TargetManager.TargetManager.instance().resumeAllTargets();
    this.removeDialogHandler?.();
  }
  registerStatusCallback(callback) {
    this.lighthouseMessageUpdateCallback = callback;
  }
  onEvent(event) {
    this.dispatchProtocolMessage(event);
  }
  dispatchProtocolMessage(message) {
    if (message.sessionId || "method" in message && message.method?.startsWith("Target")) {
      void this.send("dispatchProtocolMessage", { message });
    }
  }
  onDisconnect() {
  }
  initWorker() {
    this.lighthouseWorkerPromise = new Promise((resolve) => {
      const workerUrl = new URL("../../entrypoints/lighthouse_worker/lighthouse_worker.js", import.meta.url);
      const remoteBaseSearchParam = new URL(self.location.href).searchParams.get("remoteBase");
      if (remoteBaseSearchParam) {
        workerUrl.searchParams.set("remoteBase", remoteBaseSearchParam);
      }
      const worker = new Worker(workerUrl, { type: "module" });
      worker.addEventListener("message", (event) => {
        if (event.data === "workerReady") {
          resolve(worker);
          return;
        }
        this.onWorkerMessage(event);
      });
    });
    return this.lighthouseWorkerPromise;
  }
  async ensureWorkerExists() {
    let worker;
    if (!this.lighthouseWorkerPromise) {
      worker = await this.initWorker();
    } else {
      worker = await this.lighthouseWorkerPromise;
    }
    return worker;
  }
  onWorkerMessage(event) {
    const lighthouseMessage = event.data;
    if (lighthouseMessage.action === "statusUpdate") {
      if (this.lighthouseMessageUpdateCallback && lighthouseMessage.args && "message" in lighthouseMessage.args) {
        this.lighthouseMessageUpdateCallback(lighthouseMessage.args.message);
      }
    } else if (lighthouseMessage.action === "sendProtocolMessage") {
      if (lighthouseMessage.args && "message" in lighthouseMessage.args) {
        this.sendProtocolMessage(lighthouseMessage.args.message);
      }
    }
  }
  sendProtocolMessage(message) {
    const { id, method, params, sessionId } = JSON.parse(message);
    void this.connection?.send(method, params, sessionId).then((response) => {
      const message2 = "result" in response ? { id, sessionId, result: response.result } : { id, sessionId, error: response.error };
      this.dispatchProtocolMessage(message2);
    });
  }
  async send(action, args = {}) {
    const worker = await this.ensureWorkerExists();
    const messageId = lastId++;
    worker.postMessage({ id: messageId, action, args: { ...args, id: messageId } });
  }
  /** sendWithResponse currently only handles the original startLighthouse request and LHR-filled response. */
  async sendWithResponse(action, args = {}) {
    const worker = await this.ensureWorkerExists();
    const messageId = lastId++;
    const messageResult = new Promise((resolve) => {
      const workerListener = (event) => {
        const lighthouseMessage = event.data;
        if (lighthouseMessage.id === messageId) {
          worker.removeEventListener("message", workerListener);
          resolve(lighthouseMessage.result);
        }
      };
      worker.addEventListener("message", workerListener);
    });
    worker.postMessage({ id: messageId, action, args: { ...args, id: messageId } });
    return await messageResult;
  }
}
//# sourceMappingURL=LighthouseProtocolService.js.map
