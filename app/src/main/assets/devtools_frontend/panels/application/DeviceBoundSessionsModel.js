"use strict";
import * as Common from "../../core/common/common.js";
import * as SDK from "../../core/sdk/sdk.js";
export class DeviceBoundSessionsModel extends Common.ObjectWrapper.ObjectWrapper {
  #siteSessions = /* @__PURE__ */ new Map();
  #visibleSites = /* @__PURE__ */ new Set();
  constructor() {
    super();
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.NetworkManager.NetworkManager, this, { scoped: true });
  }
  modelAdded(networkManager) {
    networkManager.addEventListener(SDK.NetworkManager.Events.DeviceBoundSessionsAdded, this.#onSessionsSet, this);
    networkManager.addEventListener(
      SDK.NetworkManager.Events.DeviceBoundSessionEventOccurred,
      this.#onEventOccurred,
      this
    );
    void networkManager.enableDeviceBoundSessions();
  }
  modelRemoved(networkManager) {
    networkManager.removeEventListener(SDK.NetworkManager.Events.DeviceBoundSessionsAdded, this.#onSessionsSet, this);
    networkManager.removeEventListener(
      SDK.NetworkManager.Events.DeviceBoundSessionEventOccurred,
      this.#onEventOccurred,
      this
    );
  }
  addVisibleSite(site) {
    if (this.#visibleSites.has(site)) {
      return;
    }
    this.#visibleSites.add(site);
    this.dispatchEventToListeners("ADD_VISIBLE_SITE" /* ADD_VISIBLE_SITE */, { site });
  }
  clearVisibleSites() {
    if (this.getPreserveLogSetting().get()) {
      return;
    }
    this.#visibleSites.clear();
    this.dispatchEventToListeners("CLEAR_VISIBLE_SITES" /* CLEAR_VISIBLE_SITES */);
  }
  clearEvents() {
    if (this.getPreserveLogSetting().get()) {
      return;
    }
    const emptySessions = /* @__PURE__ */ new Map();
    const noLongerFailedSessions = /* @__PURE__ */ new Map();
    const emptySites = /* @__PURE__ */ new Set();
    for (const [site, sessionIdToSessionMap] of [...this.#siteSessions]) {
      let emptySessionsSiteEntry = emptySessions.get(site);
      let noLongerFailedSessionsSiteEntry = noLongerFailedSessions.get(site);
      for (const [sessionId, sessionAndEvents] of sessionIdToSessionMap) {
        sessionAndEvents.eventsById.clear();
        if (sessionAndEvents.hasErrors) {
          sessionAndEvents.hasErrors = false;
          if (!noLongerFailedSessionsSiteEntry) {
            noLongerFailedSessionsSiteEntry = [];
            noLongerFailedSessions.set(site, noLongerFailedSessionsSiteEntry);
          }
          noLongerFailedSessionsSiteEntry.push(sessionId);
        }
        if (sessionAndEvents.session) {
          continue;
        }
        sessionIdToSessionMap.delete(sessionId);
        if (!emptySessionsSiteEntry) {
          emptySessionsSiteEntry = [];
          emptySessions.set(site, emptySessionsSiteEntry);
        }
        emptySessionsSiteEntry.push(sessionId);
      }
      if (sessionIdToSessionMap.size === 0) {
        this.#siteSessions.delete(site);
        emptySites.add(site);
      }
    }
    this.dispatchEventToListeners(
      "CLEAR_EVENTS" /* CLEAR_EVENTS */,
      { emptySessions, emptySites, noLongerFailedSessions }
    );
  }
  isSiteVisible(site) {
    return this.#visibleSites.has(site);
  }
  isSessionTerminated(site, sessionId) {
    const session = this.getSession(site, sessionId);
    if (session === void 0) {
      return false;
    }
    return session.isSessionTerminated;
  }
  sessionHasErrors(site, sessionId) {
    const session = this.getSession(site, sessionId);
    if (session === void 0) {
      return false;
    }
    return session.hasErrors;
  }
  getSession(site, sessionId) {
    return this.#siteSessions.get(site)?.get(sessionId);
  }
  getPreserveLogSetting() {
    return Common.Settings.Settings.instance().createSetting("device-bound-sessions-preserve-log", false);
  }
  #onSessionsSet({ data: sessions }) {
    for (const session of sessions) {
      const sessionAndEvents = this.#ensureSiteAndSessionInitialized(session.key.site, session.key.id);
      sessionAndEvents.session = session;
    }
    this.dispatchEventToListeners("INITIALIZE_SESSIONS" /* INITIALIZE_SESSIONS */, { sessions });
  }
  #ensureSiteAndSessionInitialized(site, sessionId) {
    let sessionIdToSessionMap = this.#siteSessions.get(site);
    if (!sessionIdToSessionMap) {
      sessionIdToSessionMap = /* @__PURE__ */ new Map();
      this.#siteSessions.set(site, sessionIdToSessionMap);
    }
    let sessionAndEvent = sessionIdToSessionMap.get(sessionId);
    if (!sessionAndEvent) {
      sessionAndEvent = {
        isSessionTerminated: false,
        hasErrors: false,
        eventsById: /* @__PURE__ */ new Map()
      };
      sessionIdToSessionMap.set(sessionId, sessionAndEvent);
    }
    return sessionAndEvent;
  }
  #onEventOccurred({ data: event }) {
    const sessionAndEvent = this.#ensureSiteAndSessionInitialized(event.site, event.sessionId);
    if (sessionAndEvent.eventsById.has(event.eventId)) {
      return;
    }
    const eventWithTimestamp = { event, timestamp: /* @__PURE__ */ new Date() };
    sessionAndEvent.eventsById.set(event.eventId, eventWithTimestamp);
    const newSession = event.creationEventDetails?.newSession || event.refreshEventDetails?.newSession;
    if (newSession) {
      sessionAndEvent.session = newSession;
    }
    if (event.succeeded && sessionAndEvent.session && event.challengeEventDetails) {
      sessionAndEvent.session.cachedChallenge = event.challengeEventDetails.challenge;
    }
    if (event.succeeded) {
      if (event.terminationEventDetails) {
        sessionAndEvent.isSessionTerminated = true;
      } else if (event.creationEventDetails) {
        sessionAndEvent.isSessionTerminated = false;
      }
    }
    if (!event.succeeded) {
      sessionAndEvent.hasErrors = true;
    }
    this.dispatchEventToListeners(
      "EVENT_OCCURRED" /* EVENT_OCCURRED */,
      { site: eventWithTimestamp.event.site, sessionId: eventWithTimestamp.event.sessionId }
    );
  }
}
export var DeviceBoundSessionModelEvents = /* @__PURE__ */ ((DeviceBoundSessionModelEvents2) => {
  DeviceBoundSessionModelEvents2["INITIALIZE_SESSIONS"] = "INITIALIZE_SESSIONS";
  DeviceBoundSessionModelEvents2["ADD_VISIBLE_SITE"] = "ADD_VISIBLE_SITE";
  DeviceBoundSessionModelEvents2["CLEAR_VISIBLE_SITES"] = "CLEAR_VISIBLE_SITES";
  DeviceBoundSessionModelEvents2["EVENT_OCCURRED"] = "EVENT_OCCURRED";
  DeviceBoundSessionModelEvents2["CLEAR_EVENTS"] = "CLEAR_EVENTS";
  return DeviceBoundSessionModelEvents2;
})(DeviceBoundSessionModelEvents || {});
//# sourceMappingURL=DeviceBoundSessionsModel.js.map
