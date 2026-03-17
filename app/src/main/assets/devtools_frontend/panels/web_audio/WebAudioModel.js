"use strict";
import * as SDK from "../../core/sdk/sdk.js";
export class WebAudioModel extends SDK.SDKModel.SDKModel {
  enabled;
  agent;
  constructor(target) {
    super(target);
    this.enabled = false;
    this.agent = target.webAudioAgent();
    target.registerWebAudioDispatcher(this);
    SDK.TargetManager.TargetManager.instance().addModelListener(
      SDK.ResourceTreeModel.ResourceTreeModel,
      SDK.ResourceTreeModel.Events.FrameNavigated,
      this.flushContexts,
      this
    );
  }
  flushContexts() {
    this.dispatchEventToListeners("ModelReset" /* MODEL_RESET */);
  }
  async suspendModel() {
    this.dispatchEventToListeners("ModelSuspend" /* MODEL_SUSPEND */);
    await this.agent.invoke_disable();
  }
  async resumeModel() {
    if (!this.enabled) {
      return await Promise.resolve();
    }
    await this.agent.invoke_enable();
  }
  ensureEnabled() {
    if (this.enabled) {
      return;
    }
    void this.agent.invoke_enable();
    this.enabled = true;
  }
  contextCreated({ context }) {
    this.dispatchEventToListeners("ContextCreated" /* CONTEXT_CREATED */, context);
  }
  contextWillBeDestroyed({ contextId }) {
    this.dispatchEventToListeners("ContextDestroyed" /* CONTEXT_DESTROYED */, contextId);
  }
  contextChanged({ context }) {
    this.dispatchEventToListeners("ContextChanged" /* CONTEXT_CHANGED */, context);
  }
  audioListenerCreated({ listener }) {
    this.dispatchEventToListeners("AudioListenerCreated" /* AUDIO_LISTENER_CREATED */, listener);
  }
  audioListenerWillBeDestroyed({ listenerId, contextId }) {
    this.dispatchEventToListeners("AudioListenerWillBeDestroyed" /* AUDIO_LISTENER_WILL_BE_DESTROYED */, { listenerId, contextId });
  }
  audioNodeCreated({ node }) {
    this.dispatchEventToListeners("AudioNodeCreated" /* AUDIO_NODE_CREATED */, node);
  }
  audioNodeWillBeDestroyed({ contextId, nodeId }) {
    this.dispatchEventToListeners("AudioNodeWillBeDestroyed" /* AUDIO_NODE_WILL_BE_DESTROYED */, { contextId, nodeId });
  }
  audioParamCreated({ param }) {
    this.dispatchEventToListeners("AudioParamCreated" /* AUDIO_PARAM_CREATED */, param);
  }
  audioParamWillBeDestroyed({ contextId, nodeId, paramId }) {
    this.dispatchEventToListeners("AudioParamWillBeDestroyed" /* AUDIO_PARAM_WILL_BE_DESTROYED */, { contextId, nodeId, paramId });
  }
  nodesConnected({ contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }) {
    this.dispatchEventToListeners(
      "NodesConnected" /* NODES_CONNECTED */,
      { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }
    );
  }
  nodesDisconnected({ contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }) {
    this.dispatchEventToListeners(
      "NodesDisconnected" /* NODES_DISCONNECTED */,
      { contextId, sourceId, destinationId, sourceOutputIndex, destinationInputIndex }
    );
  }
  nodeParamConnected({ contextId, sourceId, destinationId, sourceOutputIndex }) {
    this.dispatchEventToListeners("NodeParamConnected" /* NODE_PARAM_CONNECTED */, { contextId, sourceId, destinationId, sourceOutputIndex });
  }
  nodeParamDisconnected({ contextId, sourceId, destinationId, sourceOutputIndex }) {
    this.dispatchEventToListeners(
      "NodeParamDisconnected" /* NODE_PARAM_DISCONNECTED */,
      { contextId, sourceId, destinationId, sourceOutputIndex }
    );
  }
  async requestRealtimeData(contextId) {
    const realtimeResponse = await this.agent.invoke_getRealtimeData({ contextId });
    return realtimeResponse.realtimeData;
  }
}
SDK.SDKModel.SDKModel.register(WebAudioModel, { capabilities: SDK.Target.Capability.DOM, autostart: false });
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["CONTEXT_CREATED"] = "ContextCreated";
  Events2["CONTEXT_DESTROYED"] = "ContextDestroyed";
  Events2["CONTEXT_CHANGED"] = "ContextChanged";
  Events2["MODEL_RESET"] = "ModelReset";
  Events2["MODEL_SUSPEND"] = "ModelSuspend";
  Events2["AUDIO_LISTENER_CREATED"] = "AudioListenerCreated";
  Events2["AUDIO_LISTENER_WILL_BE_DESTROYED"] = "AudioListenerWillBeDestroyed";
  Events2["AUDIO_NODE_CREATED"] = "AudioNodeCreated";
  Events2["AUDIO_NODE_WILL_BE_DESTROYED"] = "AudioNodeWillBeDestroyed";
  Events2["AUDIO_PARAM_CREATED"] = "AudioParamCreated";
  Events2["AUDIO_PARAM_WILL_BE_DESTROYED"] = "AudioParamWillBeDestroyed";
  Events2["NODES_CONNECTED"] = "NodesConnected";
  Events2["NODES_DISCONNECTED"] = "NodesDisconnected";
  Events2["NODE_PARAM_CONNECTED"] = "NodeParamConnected";
  Events2["NODE_PARAM_DISCONNECTED"] = "NodeParamDisconnected";
  return Events2;
})(Events || {});
//# sourceMappingURL=WebAudioModel.js.map
