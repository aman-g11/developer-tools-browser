"use strict";
import * as Platform from "../platform/platform.js";
let runtimePlatform = "";
let runtimeInstance;
let isNode;
let isTraceAppEntry;
export function getRemoteBase(location2 = self.location.toString()) {
  const url = new URL(location2);
  const remoteBase = url.searchParams.get("remoteBase");
  if (!remoteBase) {
    return null;
  }
  const version = /\/serve_file\/(@[0-9a-zA-Z]+)\/?$/.exec(remoteBase);
  if (!version) {
    return null;
  }
  return { base: `devtools://devtools/remote/serve_file/${version[1]}/`, version: version[1] };
}
export function getPathName() {
  return window.location.pathname;
}
export function isNodeEntry(pathname) {
  const nodeEntryPoints = ["node_app", "js_app"];
  return nodeEntryPoints.some((component) => pathname.includes(component));
}
export const getChromeVersion = () => {
  const chromeRegex = /(?:^|\W)(?:Chrome|HeadlessChrome)\/(\S+)/;
  const chromeMatch = navigator.userAgent.match(chromeRegex);
  if (chromeMatch && chromeMatch.length > 1) {
    return chromeMatch[1];
  }
  return "";
};
export class Runtime {
  constructor() {
  }
  static instance(opts = { forceNew: null }) {
    const { forceNew } = opts;
    if (!runtimeInstance || forceNew) {
      runtimeInstance = new Runtime();
    }
    return runtimeInstance;
  }
  static removeInstance() {
    runtimeInstance = void 0;
  }
  static #queryParamsObject;
  static #getSearchParams() {
    if (!Runtime.#queryParamsObject && "location" in globalThis) {
      Runtime.#queryParamsObject = new URLSearchParams(location.search);
    }
    return Runtime.#queryParamsObject;
  }
  static queryParam(name) {
    return Runtime.#getSearchParams()?.get(name) ?? null;
  }
  static setQueryParamForTesting(name, value) {
    Runtime.#getSearchParams()?.set(name, value);
  }
  static isNode() {
    if (isNode === void 0) {
      isNode = isNodeEntry(getPathName());
    }
    return isNode;
  }
  /**
   * Returns true if viewing the slimmed-down devtools meant for just viewing a
   * performance trace, e.g. devtools://devtools/bundled/trace_app.html?traceURL=http://...
   */
  static isTraceApp() {
    if (isTraceAppEntry === void 0) {
      isTraceAppEntry = getPathName().includes("trace_app");
    }
    return isTraceAppEntry;
  }
  static setPlatform(platform) {
    runtimePlatform = platform;
  }
  static platform() {
    return runtimePlatform;
  }
  static isDescriptorEnabled(descriptor) {
    const { experiment } = descriptor;
    if (experiment === "*") {
      return true;
    }
    if (experiment?.startsWith("!")) {
      const experimentName = experiment.substring(1);
      if (experiments.isEnabled(experimentName)) {
        return false;
      }
    }
    if (experiment && !experiment.startsWith("!")) {
      const experimentName = experiment;
      if (!experiments.isEnabled(experimentName)) {
        return false;
      }
    }
    const { condition } = descriptor;
    return condition ? condition(hostConfig) : true;
  }
  loadLegacyModule(modulePath) {
    console.log("Loading legacy module: " + modulePath);
    const importPath = `../../${modulePath}`;
    return import(importPath).then((m) => {
      console.log("Loaded legacy module: " + modulePath);
      return m;
    });
  }
}
export class ExperimentsSupport {
  #experiments = [];
  #hostExperiments = /* @__PURE__ */ new Map();
  #experimentNames = /* @__PURE__ */ new Set();
  #enabledForTests = /* @__PURE__ */ new Set();
  #enabledByDefault = /* @__PURE__ */ new Set();
  #serverEnabled = /* @__PURE__ */ new Set();
  #storage = new ExperimentStorage();
  allConfigurableExperiments() {
    return [...this.#experiments, ...this.#hostExperiments.values()];
  }
  registerHostExperiment(params) {
    if (this.#isHostExperiment(params.name) || this.#isExperiment(params.name)) {
      throw new Error(`Duplicate registration of experiment '${params.name}'`);
    }
    const hostExperiment = new HostExperiment({ ...params, experiments: this });
    this.#hostExperiments.set(params.name, hostExperiment);
    return hostExperiment;
  }
  register(experimentName, experimentTitle, docLink, feedbackLink) {
    if (this.#isHostExperiment(experimentName) || this.#isExperiment(experimentName)) {
      throw new Error(`Duplicate registration of experiment '${experimentName}'`);
    }
    this.#experimentNames.add(experimentName);
    this.#experiments.push(new Experiment(
      this,
      experimentName,
      experimentTitle,
      docLink ?? Platform.DevToolsPath.EmptyUrlString,
      feedbackLink ?? Platform.DevToolsPath.EmptyUrlString
    ));
  }
  isEnabled(experimentName) {
    if (this.#isHostExperiment(experimentName)) {
      return this.#enabledForTests.has(experimentName) || (this.#hostExperiments.get(experimentName)?.isEnabled() ?? false);
    }
    if (this.#isExperiment(experimentName)) {
      if (this.#storage.get(experimentName) === false) {
        return false;
      }
      if (this.#enabledForTests.has(experimentName) || this.#enabledByDefault.has(experimentName)) {
        return true;
      }
      if (this.#serverEnabled.has(experimentName)) {
        return true;
      }
      return Boolean(this.#storage.get(experimentName));
    }
    throw new Error(`Unknown experiment '${experimentName}'`);
  }
  getValueFromStorage(experimentName) {
    return this.#storage.get(experimentName);
  }
  setEnabled(experimentName, enabled) {
    if (this.#isHostExperiment(experimentName)) {
      this.#hostExperiments.get(experimentName)?.setEnabled(enabled);
      return;
    }
    if (this.#isExperiment(experimentName)) {
      this.#storage.set(experimentName, enabled);
      return;
    }
    throw new Error(`Unknown experiment '${experimentName}'`);
  }
  // Only applicable to legacy experiments.
  enableExperimentsByDefault(experimentNames) {
    for (const experimentName of experimentNames) {
      if (!this.#isExperiment(experimentName)) {
        throw new Error(`Unknown (legacy) experiment '${experimentName}'`);
      }
      this.#enabledByDefault.add(experimentName);
    }
  }
  // Only applicable to legacy experiments.
  setServerEnabledExperiments(experiments2) {
    for (const experiment of experiments2) {
      const experimentName = experiment;
      if (!this.#isExperiment(experimentName)) {
        throw new Error(`Unknown (legacy) experiment '${experimentName}'`);
      }
      this.#serverEnabled.add(experimentName);
    }
  }
  enableForTest(experimentName) {
    if (!this.#isHostExperiment(experimentName) && !this.#isExperiment(experimentName)) {
      throw new Error(`Unknown experiment '${experimentName}'`);
    }
    this.#enabledForTests.add(experimentName);
  }
  disableForTest(experimentName) {
    if (!this.#isHostExperiment(experimentName) && !this.#isExperiment(experimentName)) {
      throw new Error(`Unknown experiment '${experimentName}'`);
    }
    this.#enabledForTests.delete(experimentName);
  }
  isEnabledForTest(experimentName) {
    return this.#enabledForTests.has(experimentName);
  }
  clearForTest() {
    this.#experiments = [];
    this.#hostExperiments.clear();
    this.#experimentNames.clear();
    this.#enabledForTests.clear();
    this.#enabledByDefault.clear();
    this.#serverEnabled.clear();
  }
  cleanUpStaleExperiments() {
    this.#storage.cleanUpStaleExperiments(this.#experimentNames);
  }
  #isHostExperiment(experimentName) {
    return this.#hostExperiments.has(experimentName);
  }
  #isExperiment(experimentName) {
    return this.#experimentNames.has(experimentName);
  }
}
class ExperimentStorage {
  #experiments = {};
  constructor() {
    try {
      const storedExperiments = self.localStorage?.getItem("experiments");
      if (storedExperiments) {
        this.#experiments = JSON.parse(storedExperiments);
      }
    } catch {
      console.error("Failed to parse localStorage['experiments']");
    }
  }
  /**
   * Experiments are stored with a tri-state:
   *   - true: Explicitly enabled.
   *   - false: Explicitly disabled.
   *   - undefined: Disabled.
   */
  get(experimentName) {
    return this.#experiments[experimentName];
  }
  set(experimentName, enabled) {
    this.#experiments[experimentName] = enabled;
    this.#syncToLocalStorage();
  }
  cleanUpStaleExperiments(validExperiments) {
    for (const [key] of Object.entries(this.#experiments)) {
      if (!validExperiments.has(key)) {
        delete this.#experiments[key];
      }
    }
    this.#syncToLocalStorage();
  }
  #syncToLocalStorage() {
    self.localStorage?.setItem("experiments", JSON.stringify(this.#experiments));
  }
}
export class Experiment {
  name;
  title;
  docLink;
  feedbackLink;
  #experiments;
  constructor(experiments2, name, title, docLink, feedbackLink) {
    this.name = name;
    this.title = title;
    this.docLink = docLink;
    this.feedbackLink = feedbackLink;
    this.#experiments = experiments2;
  }
  isEnabled() {
    return this.#experiments.isEnabled(this.name);
  }
  setEnabled(enabled) {
    this.#experiments.setEnabled(this.name, enabled);
  }
}
export class HostExperiment {
  name;
  title;
  #experiments;
  // This is the name of the corresponding Chromium flag (in chrome/browser/about_flags.cc).
  // It is NOT the the name of the corresponding Chromium `base::Feature`.
  aboutFlag;
  #isEnabled;
  requiresChromeRestart;
  docLink;
  feedbackLink;
  constructor(params) {
    this.name = params.name;
    this.title = params.title;
    this.#experiments = params.experiments;
    this.aboutFlag = params.aboutFlag;
    this.#isEnabled = params.isEnabled;
    this.requiresChromeRestart = params.requiresChromeRestart;
    this.docLink = params.docLink;
    this.feedbackLink = params.feedbackLink;
  }
  isEnabled() {
    return this.#experiments.isEnabledForTest(this.name) || this.#isEnabled;
  }
  setEnabled(enabled) {
    this.#isEnabled = enabled;
  }
}
export const experiments = new ExperimentsSupport();
export var GenAiEnterprisePolicyValue = /* @__PURE__ */ ((GenAiEnterprisePolicyValue2) => {
  GenAiEnterprisePolicyValue2[GenAiEnterprisePolicyValue2["ALLOW"] = 0] = "ALLOW";
  GenAiEnterprisePolicyValue2[GenAiEnterprisePolicyValue2["ALLOW_WITHOUT_LOGGING"] = 1] = "ALLOW_WITHOUT_LOGGING";
  GenAiEnterprisePolicyValue2[GenAiEnterprisePolicyValue2["DISABLE"] = 2] = "DISABLE";
  return GenAiEnterprisePolicyValue2;
})(GenAiEnterprisePolicyValue || {});
export var HostConfigFreestylerExecutionMode = /* @__PURE__ */ ((HostConfigFreestylerExecutionMode2) => {
  HostConfigFreestylerExecutionMode2["ALL_SCRIPTS"] = "ALL_SCRIPTS";
  HostConfigFreestylerExecutionMode2["SIDE_EFFECT_FREE_SCRIPTS_ONLY"] = "SIDE_EFFECT_FREE_SCRIPTS_ONLY";
  HostConfigFreestylerExecutionMode2["NO_SCRIPTS"] = "NO_SCRIPTS";
  return HostConfigFreestylerExecutionMode2;
})(HostConfigFreestylerExecutionMode || {});
export var GdpProfilesEnterprisePolicyValue = /* @__PURE__ */ ((GdpProfilesEnterprisePolicyValue2) => {
  GdpProfilesEnterprisePolicyValue2[GdpProfilesEnterprisePolicyValue2["ENABLED"] = 0] = "ENABLED";
  GdpProfilesEnterprisePolicyValue2[GdpProfilesEnterprisePolicyValue2["ENABLED_WITHOUT_BADGES"] = 1] = "ENABLED_WITHOUT_BADGES";
  GdpProfilesEnterprisePolicyValue2[GdpProfilesEnterprisePolicyValue2["DISABLED"] = 2] = "DISABLED";
  return GdpProfilesEnterprisePolicyValue2;
})(GdpProfilesEnterprisePolicyValue || {});
export const hostConfig = /* @__PURE__ */ Object.create(null);
export const conditions = {
  canDock: () => Boolean(Runtime.queryParam("can_dock"))
};
//# sourceMappingURL=Runtime.js.map
