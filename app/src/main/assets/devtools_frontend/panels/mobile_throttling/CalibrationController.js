"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
const UIStrings = {
  /**
   * @description Text to display to user while a calibration process is running.
   */
  runningCalibration: "Running CPU calibration, please do not leave this tab or close DevTools."
};
const str_ = i18n.i18n.registerUIStrings("panels/mobile_throttling/CalibrationController.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const benchmarkDurationMs = 250;
const midScore = 1e3;
const lowScore = 264;
function truncate(n) {
  return Number(n.toFixed(2));
}
export class CalibrationController {
  #runtimeModel;
  #emulationModel;
  #originalUrl;
  #result;
  #state = "idle";
  /**
   * The provided `benchmarkDuration` is how long each iteration of the Lighthouse BenchmarkIndex
   * benchmark takes to run. This benchmark will run multiple times throughout the calibration process.
   */
  async start() {
    const primaryPageTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!primaryPageTarget) {
      return false;
    }
    const runtimeModel = primaryPageTarget.model(SDK.RuntimeModel.RuntimeModel);
    const emulationModel = primaryPageTarget.model(SDK.EmulationModel.EmulationModel);
    if (!runtimeModel || !emulationModel) {
      return false;
    }
    this.#state = "running";
    this.#runtimeModel = runtimeModel;
    this.#emulationModel = emulationModel;
    this.#originalUrl = primaryPageTarget.inspectedURL();
    function setupTestPage(text) {
      const textEl = document.createElement("span");
      textEl.textContent = text;
      document.body.append(textEl);
      document.body.style.cssText = `
        font-family: system-ui, sans-serif;
        height: 100vh;
        margin: 0;
        background-color: antiquewhite;
        font-size: 18px;
        text-align: center;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      `;
      const moonEl = document.createElement("span");
      document.body.append(moonEl);
      moonEl.id = "moon";
      moonEl.textContent = "\u{1F311}";
      moonEl.style.cssText = "font-size: 5em";
    }
    await primaryPageTarget.pageAgent().invoke_navigate({ url: "about:blank" });
    await runtimeModel.agent.invoke_evaluate({
      expression: `
          (${setupTestPage})(${JSON.stringify(i18nString(UIStrings.runningCalibration))});

          window.runBenchmark = () => {
            window.runs = window.runs ?? 0;
            moon.textContent = ['\u{1F311}', '\u{1F312}', '\u{1F313}', '\u{1F314}', '\u{1F315}', '\u{1F316}', '\u{1F317}', '\u{1F318}'][window.runs++ % 8];
            return (${computeBenchmarkIndex})(${benchmarkDurationMs});
          }`
    });
    await this.#benchmark();
    return true;
  }
  async #throttle(rate) {
    if (this.#state !== "running") {
      this.#result = void 0;
      throw new Error("Calibration has been canceled");
    }
    await this.#emulationModel.setCPUThrottlingRate(rate);
  }
  async #benchmark() {
    if (this.#state !== "running") {
      this.#result = void 0;
      throw new Error("Calibration has been canceled");
    }
    const { result } = await this.#runtimeModel.agent.invoke_evaluate({
      expression: "runBenchmark()"
    });
    if (!Number.isFinite(result.value)) {
      let err = `unexpected score from benchmark: ${result.value}`;
      if (result.description) {
        err += `
${result.description}`;
      }
      throw new Error(err);
    }
    return result.value;
  }
  async *iterator() {
    const controller = this;
    let isHalfwayDone = false;
    yield { progress: 0 };
    const scoreCache = /* @__PURE__ */ new Map();
    async function run(rate) {
      const cached = scoreCache.get(rate);
      if (cached !== void 0) {
        return cached;
      }
      await controller.#throttle(rate);
      const score = await controller.#benchmark();
      scoreCache.set(rate, score);
      return score;
    }
    async function* find(target, lowerRate, upperRate) {
      const lower = { rate: lowerRate, score: await run(lowerRate) };
      const upper = { rate: upperRate, score: await run(upperRate) };
      let rate = 0;
      let iterations = 0;
      const maxIterations = 8;
      while (iterations++ < maxIterations) {
        rate = truncate((upper.rate + lower.rate) / 2);
        const score = await run(rate);
        if (Math.abs(target - score) < 10) {
          break;
        }
        if (score < target) {
          upper.rate = rate;
          upper.score = score;
        } else {
          lower.rate = rate;
          lower.score = score;
        }
        yield { progress: iterations / maxIterations / 2 + (isHalfwayDone ? 0.5 : 0) };
      }
      return truncate(rate);
    }
    this.#result = {};
    let actualScore = await run(1);
    if (actualScore < midScore) {
      scoreCache.clear();
      actualScore = await run(1);
      if (actualScore < midScore) {
        if (actualScore < lowScore) {
          this.#result = {
            low: SDK.CPUThrottlingManager.CalibrationError.DEVICE_TOO_WEAK,
            mid: SDK.CPUThrottlingManager.CalibrationError.DEVICE_TOO_WEAK
          };
          return;
        }
        this.#result = { mid: SDK.CPUThrottlingManager.CalibrationError.DEVICE_TOO_WEAK };
        isHalfwayDone = true;
      }
    }
    const initialLowerRate = 1;
    const initialUpperRate = actualScore / lowScore * 1.5;
    const low = yield* find(lowScore, initialLowerRate, initialUpperRate);
    this.#result.low = low;
    if (!this.#result.mid) {
      isHalfwayDone = true;
      yield { progress: 0.5 };
      const midToLowRatio = midScore / lowScore;
      const r = low / midToLowRatio;
      const mid = yield* find(midScore, r - r / 4, r + r / 4);
      this.#result.mid = mid;
    }
    yield { progress: 1 };
  }
  abort() {
    if (this.#state === "running") {
      this.#state = "aborting";
    }
  }
  result() {
    return this.#result;
  }
  async end() {
    if (this.#state === "idle") {
      return;
    }
    this.#state = "idle";
    if (this.#originalUrl.startsWith("chrome://")) {
      await this.#runtimeModel.agent.invoke_evaluate({
        expression: "history.back()"
      });
    } else {
      await this.#runtimeModel.agent.invoke_evaluate({
        expression: `window.location.href = ${JSON.stringify(this.#originalUrl)}`
      });
    }
  }
}
function computeBenchmarkIndex(duration = 1e3) {
  const halfTime = duration / 2;
  function benchmarkIndexGC() {
    const start = Date.now();
    let iterations = 0;
    while (Date.now() - start < halfTime) {
      let s = "";
      for (let j = 0; j < 1e4; j++) {
        s += "a";
      }
      if (s.length === 1) {
        throw new Error("will never happen, but prevents compiler optimizations");
      }
      iterations++;
    }
    const durationInSeconds = (Date.now() - start) / 1e3;
    return Math.round(iterations / 10 / durationInSeconds);
  }
  function benchmarkIndexNoGC() {
    const arrA = [];
    const arrB = [];
    for (let i = 0; i < 1e5; i++) {
      arrA[i] = arrB[i] = i;
    }
    const start = Date.now();
    let iterations = 0;
    while (iterations % 10 !== 0 || Date.now() - start < halfTime) {
      const src = iterations % 2 === 0 ? arrA : arrB;
      const tgt = iterations % 2 === 0 ? arrB : arrA;
      for (let j = 0; j < src.length; j++) {
        tgt[j] = src[j];
      }
      iterations++;
    }
    const durationInSeconds = (Date.now() - start) / 1e3;
    return Math.round(iterations / 10 / durationInSeconds);
  }
  return (benchmarkIndexGC() + benchmarkIndexNoGC()) / 2;
}
//# sourceMappingURL=CalibrationController.js.map
