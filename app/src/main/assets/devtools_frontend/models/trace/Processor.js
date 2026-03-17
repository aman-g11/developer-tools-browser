"use strict";
import * as Handlers from "./handlers/handlers.js";
import * as Helpers from "./helpers/helpers.js";
import * as Insights from "./insights/insights.js";
import * as Lantern from "./lantern/lantern.js";
import * as LanternComputationData from "./LanternComputationData.js";
import * as Types from "./types/types.js";
var Status = /* @__PURE__ */ ((Status2) => {
  Status2["IDLE"] = "IDLE";
  Status2["PARSING"] = "PARSING";
  Status2["FINISHED_PARSING"] = "FINISHED_PARSING";
  Status2["ERRORED_WHILE_PARSING"] = "ERRORED_WHILE_PARSING";
  return Status2;
})(Status || {});
export class TraceParseProgressEvent extends Event {
  constructor(data, init = { bubbles: true }) {
    super(TraceParseProgressEvent.eventName, init);
    this.data = data;
  }
  static eventName = "traceparseprogress";
}
var ProgressPhase = /* @__PURE__ */ ((ProgressPhase2) => {
  ProgressPhase2[ProgressPhase2["HANDLE_EVENT"] = 0.2] = "HANDLE_EVENT";
  ProgressPhase2[ProgressPhase2["FINALIZE"] = 0.8] = "FINALIZE";
  ProgressPhase2[ProgressPhase2["CLONE"] = 1] = "CLONE";
  return ProgressPhase2;
})(ProgressPhase || {});
function calculateProgress(value, phase) {
  if (phase === 0.8 /* FINALIZE */) {
    return value * (0.8 /* FINALIZE */ - 0.2 /* HANDLE_EVENT */) + 0.2 /* HANDLE_EVENT */;
  }
  return value * phase;
}
export class TraceProcessor extends EventTarget {
  // We force the Meta handler to be enabled, so the TraceHandlers type here is
  // the model handlers the user passes in and the Meta handler.
  #traceHandlers;
  #status = "IDLE" /* IDLE */;
  #modelConfiguration = Types.Configuration.defaults();
  #data = null;
  #insights = null;
  static createWithAllHandlers() {
    return new TraceProcessor(Handlers.ModelHandlers, Types.Configuration.defaults());
  }
  /**
   * This function is kept for testing with `stub`.
   */
  static getInsightRunners() {
    return { ...Insights.Models };
  }
  constructor(traceHandlers, modelConfiguration) {
    super();
    this.#verifyHandlers(traceHandlers);
    this.#traceHandlers = {
      Meta: Handlers.ModelHandlers.Meta,
      ...traceHandlers
    };
    if (modelConfiguration) {
      this.#modelConfiguration = modelConfiguration;
    }
    this.#passConfigToHandlers();
  }
  #passConfigToHandlers() {
    for (const handler of Object.values(this.#traceHandlers)) {
      if ("handleUserConfig" in handler && handler.handleUserConfig) {
        handler.handleUserConfig(this.#modelConfiguration);
      }
    }
  }
  /**
   * When the user passes in a set of handlers, we want to ensure that we have all
   * the required handlers. Handlers can depend on other handlers, so if the user
   * passes in FooHandler which depends on BarHandler, they must also pass in
   * BarHandler too. This method verifies that all dependencies are met, and
   * throws if not.
   **/
  #verifyHandlers(providedHandlers) {
    if (Object.keys(providedHandlers).length === Object.keys(Handlers.ModelHandlers).length) {
      return;
    }
    const requiredHandlerKeys = /* @__PURE__ */ new Set();
    for (const [handlerName, handler] of Object.entries(providedHandlers)) {
      requiredHandlerKeys.add(handlerName);
      const deps = "deps" in handler ? handler.deps() : [];
      for (const depName of deps) {
        requiredHandlerKeys.add(depName);
      }
    }
    const providedHandlerKeys = new Set(Object.keys(providedHandlers));
    requiredHandlerKeys.delete("Meta");
    for (const requiredKey of requiredHandlerKeys) {
      if (!providedHandlerKeys.has(requiredKey)) {
        throw new Error(`Required handler ${requiredKey} not provided.`);
      }
    }
  }
  reset() {
    if (this.#status === "PARSING" /* PARSING */) {
      throw new Error("Trace processor can't reset while parsing.");
    }
    const handlers = Object.values(this.#traceHandlers);
    for (const handler of handlers) {
      handler.reset();
    }
    this.#data = null;
    this.#insights = null;
    this.#status = "IDLE" /* IDLE */;
  }
  async parse(traceEvents, options) {
    if (this.#status !== "IDLE" /* IDLE */) {
      throw new Error(`Trace processor can't start parsing when not idle. Current state: ${this.#status}`);
    }
    if (typeof options.isCPUProfile === "undefined" && options.metadata) {
      options.isCPUProfile = options.metadata.dataOrigin === Types.File.DataOrigin.CPU_PROFILE;
    }
    options.logger?.start("total");
    try {
      this.#status = "PARSING" /* PARSING */;
      options.logger?.start("parse");
      await this.#computeParsedTrace(traceEvents, options);
      options.logger?.end("parse");
      if (this.#data && !options.isCPUProfile) {
        options.logger?.start("insights");
        this.#computeInsights(this.#data, traceEvents, options);
        options.logger?.end("insights");
      }
      this.#status = "FINISHED_PARSING" /* FINISHED_PARSING */;
    } catch (e) {
      this.#status = "ERRORED_WHILE_PARSING" /* ERRORED_WHILE_PARSING */;
      throw e;
    } finally {
      options.logger?.end("total");
    }
  }
  /**
   * Run all the handlers and set the result to `#data`.
   */
  async #computeParsedTrace(traceEvents, options) {
    const eventsPerChunk = 5e4;
    const sortedHandlers = [...sortHandlers(this.#traceHandlers).entries()];
    for (const [, handler] of sortedHandlers) {
      handler.reset();
    }
    options.logger?.start("parse:handleEvent");
    for (let i = 0; i < traceEvents.length; ++i) {
      if (i % eventsPerChunk === 0 && i) {
        const percent = calculateProgress(i / traceEvents.length, 0.2 /* HANDLE_EVENT */);
        this.dispatchEvent(new TraceParseProgressEvent({ percent }));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const event = traceEvents[i];
      for (let j = 0; j < sortedHandlers.length; ++j) {
        const [, handler] = sortedHandlers[j];
        handler.handleEvent(event);
      }
    }
    options.logger?.end("parse:handleEvent");
    const finalizeOptions = {
      ...options,
      allTraceEvents: traceEvents
    };
    for (let i = 0; i < sortedHandlers.length; i++) {
      const [name, handler] = sortedHandlers[i];
      if (handler.finalize) {
        options.logger?.start(`parse:${name}:finalize`);
        await new Promise((resolve) => setTimeout(resolve, 0));
        await handler.finalize(finalizeOptions);
        options.logger?.end(`parse:${name}:finalize`);
      }
      const percent = calculateProgress(i / sortedHandlers.length, 0.8 /* FINALIZE */);
      this.dispatchEvent(new TraceParseProgressEvent({ percent }));
    }
    options.logger?.start("parse:handler.data()");
    const parsedTrace = {};
    for (const [name, handler] of Object.entries(this.#traceHandlers)) {
      Object.assign(parsedTrace, { [name]: handler.data() });
    }
    options.logger?.end("parse:handler.data()");
    this.dispatchEvent(new TraceParseProgressEvent({ percent: 1 /* CLONE */ }));
    this.#data = parsedTrace;
  }
  get data() {
    if (this.#status !== "FINISHED_PARSING" /* FINISHED_PARSING */) {
      return null;
    }
    return this.#data;
  }
  get insights() {
    if (this.#status !== "FINISHED_PARSING" /* FINISHED_PARSING */) {
      return null;
    }
    return this.#insights;
  }
  #createLanternContext(data, traceEvents, frameId, navigation, options) {
    if (!data.NetworkRequests || !data.Workers || !data.PageLoadMetrics) {
      return;
    }
    if (!data.NetworkRequests.byTime.length) {
      throw new Lantern.Core.LanternError("No network requests found in trace");
    }
    const navStarts = data.Meta.navigationsByFrameId.get(frameId);
    const navStartIndex = navStarts?.findIndex((n) => n === navigation);
    if (!navStarts || navStartIndex === void 0 || navStartIndex === -1) {
      throw new Lantern.Core.LanternError("Could not find navigation start");
    }
    const startTime = navStarts[navStartIndex].ts;
    const endTime = navStartIndex + 1 < navStarts.length ? navStarts[navStartIndex + 1].ts : Number.POSITIVE_INFINITY;
    const boundedTraceEvents = traceEvents.filter((e) => e.ts >= startTime && e.ts < endTime);
    const trace = {
      traceEvents: boundedTraceEvents
    };
    const requests = LanternComputationData.createNetworkRequests(trace, data, startTime, endTime);
    const graph = LanternComputationData.createGraph(requests, trace, data);
    const processedNavigation = LanternComputationData.createProcessedNavigation(data, frameId, navigation);
    const networkAnalysis = Lantern.Core.NetworkAnalyzer.analyze(requests);
    if (!networkAnalysis) {
      return;
    }
    const lanternSettings = {
      // TODO(crbug.com/372674229): if devtools throttling was on, does this network analysis capture
      // that? Do we need to set 'devtools' throttlingMethod?
      networkAnalysis,
      throttlingMethod: "provided",
      ...options.lanternSettings
    };
    const simulator = Lantern.Simulation.Simulator.createSimulator(lanternSettings);
    const computeData = { graph, simulator, processedNavigation };
    const fcpResult = Lantern.Metrics.FirstContentfulPaint.compute(computeData);
    const lcpResult = Lantern.Metrics.LargestContentfulPaint.compute(computeData, { fcpResult });
    const interactiveResult = Lantern.Metrics.Interactive.compute(computeData, { lcpResult });
    const tbtResult = Lantern.Metrics.TotalBlockingTime.compute(computeData, { fcpResult, interactiveResult });
    const metrics = {
      firstContentfulPaint: fcpResult,
      interactive: interactiveResult,
      largestContentfulPaint: lcpResult,
      totalBlockingTime: tbtResult
    };
    return { requests, graph, simulator, metrics };
  }
  /**
   * Sort the insight models based on the impact of each insight's estimated savings, additionally weighted by the
   * worst metrics according to field data (if present).
   */
  sortInsightSet(insightSet, metadata) {
    const baselineOrder = {
      INPBreakdown: null,
      LCPBreakdown: null,
      LCPDiscovery: null,
      CLSCulprits: null,
      RenderBlocking: null,
      NetworkDependencyTree: null,
      ImageDelivery: null,
      DocumentLatency: null,
      FontDisplay: null,
      Viewport: null,
      DOMSize: null,
      ThirdParties: null,
      DuplicatedJavaScript: null,
      SlowCSSSelector: null,
      ForcedReflow: null,
      Cache: null,
      CharacterSet: null,
      ModernHTTP: null,
      LegacyJavaScript: null
    };
    const weights = Insights.Common.calculateMetricWeightsForSorting(insightSet, metadata);
    const observedLcpMicro = Insights.Common.getLCP(insightSet)?.value;
    const observedLcp = observedLcpMicro ? Helpers.Timing.microToMilli(observedLcpMicro) : Types.Timing.Milli(0);
    const observedCls = Insights.Common.getCLS(insightSet).value;
    const observedInpMicro = Insights.Common.getINP(insightSet)?.value;
    const observedInp = observedInpMicro ? Helpers.Timing.microToMilli(observedInpMicro) : Types.Timing.Milli(200);
    const observedLcpScore = observedLcp !== void 0 ? Insights.Common.evaluateLCPMetricScore(observedLcp) : void 0;
    const observedInpScore = Insights.Common.evaluateINPMetricScore(observedInp);
    const observedClsScore = Insights.Common.evaluateCLSMetricScore(observedCls);
    const insightToSortingRank = /* @__PURE__ */ new Map();
    for (const [name, insight] of Object.entries(insightSet.model)) {
      const lcp = insight.metricSavings?.LCP ?? 0;
      const inp = insight.metricSavings?.INP ?? 0;
      const cls = insight.metricSavings?.CLS ?? 0;
      const lcpPostSavings = observedLcp !== void 0 ? Math.max(0, observedLcp - lcp) : void 0;
      const inpPostSavings = Math.max(0, observedInp - inp);
      const clsPostSavings = Math.max(0, observedCls - cls);
      let score = 0;
      if (weights.lcp && lcp && observedLcpScore !== void 0 && lcpPostSavings !== void 0) {
        score += weights.lcp * (Insights.Common.evaluateLCPMetricScore(lcpPostSavings) - observedLcpScore);
      }
      if (weights.inp && inp && observedInpScore !== void 0) {
        score += weights.inp * (Insights.Common.evaluateINPMetricScore(inpPostSavings) - observedInpScore);
      }
      if (weights.cls && cls && observedClsScore !== void 0) {
        score += weights.cls * (Insights.Common.evaluateCLSMetricScore(clsPostSavings) - observedClsScore);
      }
      insightToSortingRank.set(name, score);
    }
    const baselineOrderKeys = Object.keys(baselineOrder);
    const orderedKeys = Object.keys(insightSet.model);
    orderedKeys.sort((a, b) => {
      const a1 = baselineOrderKeys.indexOf(a);
      const b1 = baselineOrderKeys.indexOf(b);
      if (a1 >= 0 && b1 >= 0) {
        return a1 - b1;
      }
      if (a1 >= 0) {
        return -1;
      }
      if (b1 >= 0) {
        return 1;
      }
      return 0;
    });
    orderedKeys.sort((a, b) => (insightToSortingRank.get(b) ?? 0) - (insightToSortingRank.get(a) ?? 0));
    const newModel = {};
    for (const key of orderedKeys) {
      const model = insightSet.model[key];
      newModel[key] = model;
    }
    insightSet.model = newModel;
  }
  #computeInsightSet(data, context) {
    const logger = context.options.logger;
    if (!this.#insights) {
      this.#insights = /* @__PURE__ */ new Map();
    }
    let id, urlString, navigation;
    if (context.navigation) {
      id = `NAVIGATION_${this.#insights.size}`;
      urlString = data.Meta.finalDisplayUrlByNavigationId.get(context.navigationId) ?? data.Meta.mainFrameURL;
      navigation = context.navigation;
    } else {
      id = Types.Events.NO_NAVIGATION;
      urlString = data.Meta.finalDisplayUrlByNavigationId.get("") ?? data.Meta.mainFrameURL;
    }
    const insightSetModel = {};
    const insightSetModelErrors = {};
    for (const [name, insight] of Object.entries(TraceProcessor.getInsightRunners())) {
      try {
        logger?.start(`insights:${name}`);
        const model = insight.generateInsight(data, context);
        model.frameId = context.frameId;
        const navId = context.navigation?.args.data?.navigationId;
        if (navId) {
          model.navigation = context.navigation;
        }
        model.createOverlays = () => {
          return insight.createOverlays(model);
        };
        Object.assign(insightSetModel, { [name]: model });
      } catch (err) {
        Object.assign(insightSetModelErrors, { [name]: err });
      } finally {
        logger?.end(`insights:${name}`);
      }
    }
    const isNavigation = id === Types.Events.NO_NAVIGATION;
    const trivialThreshold = Helpers.Timing.milliToMicro(Types.Timing.Milli(5e3));
    const everyInsightPasses = Object.values(insightSetModel).every((model) => model && model.state === "pass");
    const noLcp = !insightSetModel.LCPBreakdown?.lcpEvent;
    const noInp = !insightSetModel.INPBreakdown?.longestInteractionEvent;
    const noLayoutShifts = insightSetModel.CLSCulprits?.shifts?.size === 0;
    const shouldExclude = isNavigation && context.bounds.range < trivialThreshold && everyInsightPasses && noLcp && noInp && noLayoutShifts;
    if (shouldExclude) {
      return;
    }
    let url;
    try {
      url = new URL(urlString);
    } catch {
      return;
    }
    const insightSet = {
      id,
      url,
      navigation,
      frameId: context.frameId,
      bounds: context.bounds,
      model: insightSetModel,
      modelErrors: insightSetModelErrors
    };
    this.#insights.set(insightSet.id, insightSet);
    this.sortInsightSet(insightSet, context.options.metadata ?? null);
  }
  /**
   * Run all the insights and set the result to `#insights`.
   */
  #computeInsights(data, traceEvents, options) {
    this.#insights = /* @__PURE__ */ new Map();
    const navigations = data.Meta.mainFrameNavigations.filter(
      (navigation) => navigation.args.frame && navigation.args.data?.navigationId
    );
    this.#computeInsightsForInitialTracePeriod(data, navigations, options);
    for (const [index, navigation] of navigations.entries()) {
      const min = navigation.ts;
      const max = index + 1 < navigations.length ? navigations[index + 1].ts : data.Meta.traceBounds.max;
      const bounds = Helpers.Timing.traceWindowFromMicroSeconds(min, max);
      this.#computeInsightsForNavigation(navigation, bounds, data, traceEvents, options);
    }
  }
  /**
   * Computes insights for the period before the first navigation, or for the entire trace if no navigations exist.
   */
  #computeInsightsForInitialTracePeriod(data, navigations, options) {
    const bounds = navigations.length > 0 ? Helpers.Timing.traceWindowFromMicroSeconds(data.Meta.traceBounds.min, navigations[0].ts) : data.Meta.traceBounds;
    const context = {
      options,
      bounds,
      frameId: data.Meta.mainFrameId
      // No navigation or lantern context applies to this initial/no-navigation period.
    };
    this.#computeInsightSet(data, context);
  }
  /**
   * Computes insights for a specific navigation event.
   */
  #computeInsightsForNavigation(navigation, bounds, data, traceEvents, options) {
    const frameId = navigation.args.frame;
    const navigationId = navigation.args.data?.navigationId;
    let lantern;
    try {
      options.logger?.start("insights:createLanternContext");
      lantern = this.#createLanternContext(data, traceEvents, frameId, navigation, options);
    } catch (e) {
      const expectedErrors = [
        "mainDocumentRequest not found",
        "missing metric scores for main frame",
        "missing metric: FCP",
        "missing metric: LCP",
        "No network requests found in trace",
        "Trace is too old"
      ];
      if (!(e instanceof Lantern.Core.LanternError)) {
        console.error(e);
      } else if (!expectedErrors.some((err) => e.message === err)) {
        console.error(e);
      }
    } finally {
      options.logger?.end("insights:createLanternContext");
    }
    const context = {
      options,
      bounds,
      frameId,
      navigation,
      navigationId,
      lantern
    };
    this.#computeInsightSet(data, context);
  }
}
export function sortHandlers(traceHandlers) {
  const sortedMap = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  const visitHandler = (handlerName) => {
    if (sortedMap.has(handlerName)) {
      return;
    }
    if (visited.has(handlerName)) {
      let stackPath = "";
      for (const handler2 of visited) {
        if (stackPath || handler2 === handlerName) {
          stackPath += `${handler2}->`;
        }
      }
      stackPath += handlerName;
      throw new Error(`Found dependency cycle in trace event handlers: ${stackPath}`);
    }
    visited.add(handlerName);
    const handler = traceHandlers[handlerName];
    if (!handler) {
      return;
    }
    const deps = handler.deps?.();
    if (deps) {
      deps.forEach(visitHandler);
    }
    sortedMap.set(handlerName, handler);
  };
  for (const handlerName of Object.keys(traceHandlers)) {
    visitHandler(handlerName);
  }
  return sortedMap;
}
//# sourceMappingURL=Processor.js.map
