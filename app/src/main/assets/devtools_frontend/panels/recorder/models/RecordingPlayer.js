"use strict";
import * as Common from "../../../core/common/common.js";
import * as SDK from "../../../core/sdk/sdk.js";
import * as PuppeteerService from "../../../services/puppeteer/puppeteer.js";
import * as PuppeteerReplay from "../../../third_party/puppeteer-replay/puppeteer-replay.js";
export var PlayRecordingSpeed = /* @__PURE__ */ ((PlayRecordingSpeed2) => {
  PlayRecordingSpeed2["NORMAL"] = "normal";
  PlayRecordingSpeed2["SLOW"] = "slow";
  PlayRecordingSpeed2["VERY_SLOW"] = "very_slow";
  PlayRecordingSpeed2["EXTREMELY_SLOW"] = "extremely_slow";
  return PlayRecordingSpeed2;
})(PlayRecordingSpeed || {});
const speedDelayMap = {
  ["normal" /* NORMAL */]: 0,
  ["slow" /* SLOW */]: 500,
  ["very_slow" /* VERY_SLOW */]: 1e3,
  ["extremely_slow" /* EXTREMELY_SLOW */]: 2e3
};
export var ReplayResult = /* @__PURE__ */ ((ReplayResult2) => {
  ReplayResult2["FAILURE"] = "Failure";
  ReplayResult2["SUCCESS"] = "Success";
  return ReplayResult2;
})(ReplayResult || {});
export const defaultTimeout = 5e3;
function isPageTarget(target) {
  return Common.ParsedURL.schemeIs(target.url, "devtools:") || target.type === "page" || target.type === "background_page" || target.type === "webview";
}
export class RecordingPlayer extends Common.ObjectWrapper.ObjectWrapper {
  userFlow;
  speed;
  timeout;
  breakpointIndexes;
  steppingOver = false;
  aborted = false;
  #stopResolver = Promise.withResolvers();
  #abortResolver = Promise.withResolvers();
  #runner;
  constructor(userFlow, {
    speed,
    breakpointIndexes = /* @__PURE__ */ new Set()
  }) {
    super();
    this.userFlow = userFlow;
    this.speed = speed;
    this.timeout = userFlow.timeout || defaultTimeout;
    this.breakpointIndexes = breakpointIndexes;
  }
  #resolveAndRefreshStopPromise() {
    this.#stopResolver.resolve();
    this.#stopResolver = Promise.withResolvers();
  }
  static async connectPuppeteer() {
    const rootTarget = SDK.TargetManager.TargetManager.instance().rootTarget();
    if (!rootTarget) {
      throw new Error("Could not find the root target");
    }
    const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!primaryPageTarget) {
      throw new Error("Could not find the primary page target");
    }
    const childTargetManager = primaryPageTarget.model(
      SDK.ChildTargetManager.ChildTargetManager
    );
    if (!childTargetManager) {
      throw new Error("Could not get childTargetManager");
    }
    const resourceTreeModel = primaryPageTarget.model(
      SDK.ResourceTreeModel.ResourceTreeModel
    );
    if (!resourceTreeModel) {
      throw new Error("Could not get resource tree model");
    }
    const mainFrame = resourceTreeModel.mainFrame;
    if (!mainFrame) {
      throw new Error("Could not find main frame");
    }
    const rootChildTargetManager = rootTarget.model(SDK.ChildTargetManager.ChildTargetManager);
    if (!rootChildTargetManager) {
      throw new Error("Could not find the child target manager class for the root target");
    }
    const connection = rootTarget.router()?.connection;
    if (!connection) {
      throw new Error("Expected root target to have a router");
    }
    const mainTargetId = await childTargetManager.getParentTargetId();
    const rootTargetId = await rootChildTargetManager.getParentTargetId();
    const { sessionId } = await rootTarget.targetAgent().invoke_attachToTarget({ targetId: rootTargetId, flatten: true });
    const { page, browser, puppeteerConnection } = await PuppeteerService.PuppeteerConnection.PuppeteerConnectionHelper.connectPuppeteerToConnectionViaTab(
      {
        connection,
        targetId: rootTargetId,
        sessionId,
        isPageTargetCallback: isPageTarget
      }
    );
    if (!page) {
      throw new Error("could not find main page!");
    }
    browser.on("targetdiscovered", (targetInfo) => {
      if (targetInfo.type !== "page") {
        return;
      }
      if (targetInfo.targetId === mainTargetId) {
        return;
      }
      if (targetInfo.openerId !== mainTargetId) {
        return;
      }
      void puppeteerConnection._createSession(
        targetInfo,
        /* emulateAutoAttach= */
        true
      );
    });
    return { page, browser };
  }
  static async disconnectPuppeteer(browser) {
    try {
      const pages = await browser.pages();
      for (const page of pages) {
        const client = page._client();
        await client.send("Network.disable");
        await client.send("Page.disable");
        await client.send("Log.disable");
        await client.send("Performance.disable");
        await client.send("Runtime.disable");
        await client.send("Emulation.clearDeviceMetricsOverride");
        await client.send("Emulation.setAutomationOverride", { enabled: false });
        for (const frame of page.frames()) {
          const client2 = frame.client;
          await client2.send("Network.disable");
          await client2.send("Page.disable");
          await client2.send("Log.disable");
          await client2.send("Performance.disable");
          await client2.send("Runtime.disable");
          await client2.send("Emulation.setAutomationOverride", { enabled: false });
        }
      }
      await browser.disconnect();
    } catch (err) {
      console.error("Error disconnecting Puppeteer", err.message);
    }
  }
  async stop() {
    await Promise.race([this.#stopResolver.promise, this.#abortResolver.promise]);
  }
  get abortPromise() {
    return this.#abortResolver.promise;
  }
  abort() {
    this.aborted = true;
    this.#abortResolver.resolve();
    this.#runner?.abort();
  }
  disposeForTesting() {
    this.#stopResolver.resolve();
    this.#abortResolver.resolve();
  }
  continue() {
    this.steppingOver = false;
    this.#resolveAndRefreshStopPromise();
  }
  stepOver() {
    this.steppingOver = true;
    this.#resolveAndRefreshStopPromise();
  }
  updateBreakpointIndexes(breakpointIndexes) {
    this.breakpointIndexes = breakpointIndexes;
  }
  async play() {
    const { page, browser } = await RecordingPlayer.connectPuppeteer();
    this.aborted = false;
    const player = this;
    class ExtensionWithBreak extends PuppeteerReplay.PuppeteerRunnerExtension {
      #speed;
      constructor(browser2, page2, {
        timeout,
        speed
      }) {
        super(browser2, page2, { timeout });
        this.#speed = speed;
      }
      async beforeEachStep(step, flow) {
        const { resolve, promise } = Promise.withResolvers();
        player.dispatchEventToListeners("Step" /* STEP */, {
          step,
          resolve
        });
        await promise;
        const currentStepIndex = flow.steps.indexOf(step);
        const shouldStopAtCurrentStep = player.steppingOver || player.breakpointIndexes.has(currentStepIndex);
        const shouldWaitForSpeed = step.type !== "setViewport" && step.type !== "navigate" && !player.aborted;
        if (shouldStopAtCurrentStep) {
          player.dispatchEventToListeners("Stop" /* STOP */);
          await player.stop();
          player.dispatchEventToListeners("Continue" /* CONTINUE */);
        } else if (shouldWaitForSpeed) {
          await Promise.race([
            new Promise(
              (resolve2) => setTimeout(resolve2, speedDelayMap[this.#speed])
            ),
            player.abortPromise
          ]);
        }
      }
      async runStep(step, flow) {
        if (Common.ParsedURL.schemeIs(page?.url(), "devtools:") && (step.type === "setViewport" || step.type === "navigate")) {
          return;
        }
        if (step.type === "navigate" && Common.ParsedURL.schemeIs(step.url, "chrome:")) {
          throw new Error("Not allowed to replay on chrome:// URLs");
        }
        await this.page.bringToFront();
        await super.runStep(step, flow);
      }
    }
    const extension = new ExtensionWithBreak(browser, page, {
      timeout: this.timeout,
      speed: this.speed
    });
    this.#runner = await PuppeteerReplay.createRunner(this.userFlow, extension);
    let error;
    try {
      await this.#runner.run();
    } catch (err) {
      error = err;
      console.error("Replay error", err.message);
    } finally {
      await RecordingPlayer.disconnectPuppeteer(browser);
    }
    if (this.aborted) {
      this.dispatchEventToListeners("Abort" /* ABORT */);
    } else if (error) {
      this.dispatchEventToListeners("Error" /* ERROR */, error);
    } else {
      this.dispatchEventToListeners("Done" /* DONE */);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["ABORT"] = "Abort";
  Events2["DONE"] = "Done";
  Events2["STEP"] = "Step";
  Events2["STOP"] = "Stop";
  Events2["ERROR"] = "Error";
  Events2["CONTINUE"] = "Continue";
  return Events2;
})(Events || {});
//# sourceMappingURL=RecordingPlayer.js.map
