"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as StackTrace from "./stack_trace.js";
import {
  AsyncFragmentImpl,
  DebuggableFragmentImpl,
  FragmentImpl,
  FrameImpl,
  StackTraceImpl
} from "./StackTraceImpl.js";
import { Trie } from "./Trie.js";
export class StackTraceModel extends SDK.SDKModel.SDKModel {
  #trie = new Trie();
  #mutex = new Common.Mutex.Mutex();
  /** @returns the {@link StackTraceModel} for the target, or the model for the primaryPageTarget when passing null/undefined */
  static #modelForTarget(target) {
    const model = (target ?? SDK.TargetManager.TargetManager.instance().primaryPageTarget())?.model(StackTraceModel);
    if (!model) {
      throw new Error("Unable to find StackTraceModel");
    }
    return model;
  }
  async createFromProtocolRuntime(stackTrace, rawFramesToUIFrames) {
    const [syncFragment, asyncFragments] = await Promise.all([
      this.#createFragment(stackTrace.callFrames, rawFramesToUIFrames),
      this.#createAsyncFragments(stackTrace, rawFramesToUIFrames)
    ]);
    return new StackTraceImpl(syncFragment, asyncFragments);
  }
  async createFromDebuggerPaused(pausedDetails, rawFramesToUIFrames) {
    const [syncFragment, asyncFragments] = await Promise.all([
      this.#createDebuggableFragment(pausedDetails, rawFramesToUIFrames),
      this.#createAsyncFragments(pausedDetails, rawFramesToUIFrames)
    ]);
    return new StackTraceImpl(syncFragment, asyncFragments);
  }
  /** Trigger re-translation of all fragments with the provide script in their call stack */
  async scriptInfoChanged(script, translateRawFrames) {
    const release = await this.#mutex.acquire();
    try {
      const translatePromises = [];
      let stackTracesToUpdate = /* @__PURE__ */ new Set();
      for (const fragment of this.#affectedFragments(script)) {
        if (fragment.node?.children.length === 0) {
          translatePromises.push(this.#translateFragment(fragment, translateRawFrames));
        }
        stackTracesToUpdate = stackTracesToUpdate.union(fragment.stackTraces);
      }
      await Promise.all(translatePromises);
      for (const stackTrace of stackTracesToUpdate) {
        stackTrace.dispatchEventToListeners(StackTrace.StackTrace.Events.UPDATED);
      }
    } finally {
      release();
    }
  }
  async #createDebuggableFragment(pausedDetails, rawFramesToUIFrames) {
    const fragment = await this.#createFragment(
      pausedDetails.callFrames.map((frame) => ({
        scriptId: frame.script.scriptId,
        url: frame.script.sourceURL,
        functionName: frame.functionName,
        lineNumber: frame.location().lineNumber,
        columnNumber: frame.location().columnNumber
      })),
      rawFramesToUIFrames
    );
    return new DebuggableFragmentImpl(fragment, pausedDetails.callFrames);
  }
  async #createAsyncFragments(stackTraceOrPausedEvent, rawFramesToUIFrames) {
    const asyncFragments = [];
    const debuggerModel = this.target().model(SDK.DebuggerModel.DebuggerModel);
    if (debuggerModel) {
      for await (const { stackTrace: asyncStackTrace, target } of debuggerModel.iterateAsyncParents(stackTraceOrPausedEvent)) {
        if (asyncStackTrace.callFrames.length === 0) {
          continue;
        }
        const model = StackTraceModel.#modelForTarget(target);
        const asyncFragmentPromise = model.#createFragment(asyncStackTrace.callFrames, rawFramesToUIFrames).then((fragment) => new AsyncFragmentImpl(asyncStackTrace.description ?? "", fragment));
        asyncFragments.push(asyncFragmentPromise);
      }
    }
    return await Promise.all(asyncFragments);
  }
  async #createFragment(frames, rawFramesToUIFrames) {
    if (frames.length === 0) {
      return FragmentImpl.EMPTY_FRAGMENT;
    }
    const release = await this.#mutex.acquire();
    try {
      const node = this.#trie.insert(frames);
      const requiresTranslation = !Boolean(node.fragment);
      const fragment = FragmentImpl.getOrCreate(node);
      if (requiresTranslation) {
        await this.#translateFragment(fragment, rawFramesToUIFrames);
      }
      return fragment;
    } finally {
      release();
    }
  }
  async #translateFragment(fragment, rawFramesToUIFrames) {
    if (!fragment.node) {
      return;
    }
    const rawFrames = fragment.node.getCallStack().map((node) => node.rawFrame).toArray();
    const uiFrames = await rawFramesToUIFrames(rawFrames, this.target());
    console.assert(rawFrames.length === uiFrames.length, "Broken rawFramesToUIFrames implementation");
    let i = 0;
    for (const node of fragment.node.getCallStack()) {
      node.frames = uiFrames[i++].map(
        (frame) => new FrameImpl(
          frame.url,
          frame.uiSourceCode,
          frame.name,
          frame.line,
          frame.column,
          frame.missingDebugInfo
        )
      );
    }
  }
  #affectedFragments(script) {
    const affectedBranches = /* @__PURE__ */ new Set();
    this.#trie.walk(null, (node) => {
      if (node.rawFrame.scriptId === script.scriptId || !node.rawFrame.scriptId && node.rawFrame.url === script.sourceURL) {
        affectedBranches.add(node);
        return false;
      }
      return true;
    });
    const fragments = /* @__PURE__ */ new Set();
    for (const branch of affectedBranches) {
      this.#trie.walk(branch, (node) => {
        if (node.fragment) {
          fragments.add(node.fragment);
        }
        return true;
      });
    }
    return fragments;
  }
}
SDK.SDKModel.SDKModel.register(StackTraceModel, { capabilities: SDK.Target.Capability.NONE, autostart: false });
//# sourceMappingURL=StackTraceModel.js.map
