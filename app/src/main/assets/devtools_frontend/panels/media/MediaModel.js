"use strict";
import * as SDK from "../../core/sdk/sdk.js";
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["PLAYER_PROPERTIES_CHANGED"] = "PlayerPropertiesChanged";
  Events2["PLAYER_EVENTS_ADDED"] = "PlayerEventsAdded";
  Events2["PLAYER_MESSAGES_LOGGED"] = "PlayerMessagesLogged";
  Events2["PLAYER_ERRORS_RAISED"] = "PlayerErrorsRaised";
  Events2["PLAYER_CREATED"] = "PlayerCreated";
  return Events2;
})(Events || {});
export class MediaModel extends SDK.SDKModel.SDKModel {
  enabled;
  agent;
  constructor(target) {
    super(target);
    this.enabled = false;
    this.agent = target.mediaAgent();
    target.registerMediaDispatcher(this);
  }
  async resumeModel() {
    if (!this.enabled) {
      return await Promise.resolve();
    }
    await this.agent.invoke_enable();
  }
  ensureEnabled() {
    void this.agent.invoke_enable();
    this.enabled = true;
  }
  playerPropertiesChanged(event) {
    this.dispatchEventToListeners("PlayerPropertiesChanged" /* PLAYER_PROPERTIES_CHANGED */, event);
  }
  playerEventsAdded(event) {
    this.dispatchEventToListeners("PlayerEventsAdded" /* PLAYER_EVENTS_ADDED */, event);
  }
  playerMessagesLogged(event) {
    this.dispatchEventToListeners("PlayerMessagesLogged" /* PLAYER_MESSAGES_LOGGED */, event);
  }
  playerErrorsRaised(event) {
    this.dispatchEventToListeners("PlayerErrorsRaised" /* PLAYER_ERRORS_RAISED */, event);
  }
  playerCreated({ player }) {
    this.dispatchEventToListeners("PlayerCreated" /* PLAYER_CREATED */, player);
  }
}
SDK.SDKModel.SDKModel.register(MediaModel, { capabilities: SDK.Target.Capability.MEDIA, autostart: false });
//# sourceMappingURL=MediaModel.js.map
