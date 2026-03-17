"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as ProjectSettings from "../project_settings/project_settings.js";
let automaticFileSystemManagerInstance;
export class AutomaticFileSystemManager extends Common.ObjectWrapper.ObjectWrapper {
  #automaticFileSystem;
  #availability = "unavailable";
  #inspectorFrontendHost;
  #projectSettingsModel;
  /**
   * Yields the current `AutomaticFileSystem` (if any).
   *
   * @returns the current automatic file system or `null`.
   */
  get automaticFileSystem() {
    return this.#automaticFileSystem;
  }
  /**
   * Yields the availability of the Automatic Workspace Folders feature.
   *
   * `'available'` means that the feature is enabled and the project settings
   * are also available. It doesn't indicate whether or not the page is actually
   * providing a `com.chrome.devtools.json` or not, and whether or not that file
   * (if it exists) provides workspace information.
   *
   * @returns `'available'` if the feature is available and the project settings
   *         feature is also available, otherwise `'unavailable'`.
   */
  get availability() {
    return this.#availability;
  }
  /**
   * @internal
   */
  constructor(inspectorFrontendHost, projectSettingsModel) {
    super();
    this.#automaticFileSystem = null;
    this.#inspectorFrontendHost = inspectorFrontendHost;
    this.#projectSettingsModel = projectSettingsModel;
    this.#inspectorFrontendHost.events.addEventListener(
      Host.InspectorFrontendHostAPI.Events.FileSystemRemoved,
      this.#fileSystemRemoved,
      this
    );
    this.#projectSettingsModel.addEventListener(
      ProjectSettings.ProjectSettingsModel.Events.AVAILABILITY_CHANGED,
      this.#availabilityChanged,
      this
    );
    this.#availabilityChanged({ data: this.#projectSettingsModel.availability });
    this.#projectSettingsModel.addEventListener(
      ProjectSettings.ProjectSettingsModel.Events.PROJECT_SETTINGS_CHANGED,
      this.#projectSettingsChanged,
      this
    );
    this.#projectSettingsChanged({ data: this.#projectSettingsModel.projectSettings });
  }
  /**
   * Yields the `AutomaticFileSystemManager` singleton.
   *
   * @returns the singleton.
   */
  static instance({ forceNew, inspectorFrontendHost, projectSettingsModel } = { forceNew: false, inspectorFrontendHost: null, projectSettingsModel: null }) {
    if (!automaticFileSystemManagerInstance || forceNew) {
      if (!inspectorFrontendHost || !projectSettingsModel) {
        throw new Error(
          "Unable to create AutomaticFileSystemManager: inspectorFrontendHost, and projectSettingsModel must be provided"
        );
      }
      automaticFileSystemManagerInstance = new AutomaticFileSystemManager(
        inspectorFrontendHost,
        projectSettingsModel
      );
    }
    return automaticFileSystemManagerInstance;
  }
  /**
   * Clears the `AutomaticFileSystemManager` singleton (if any);
   */
  static removeInstance() {
    if (automaticFileSystemManagerInstance) {
      automaticFileSystemManagerInstance.#dispose();
      automaticFileSystemManagerInstance = void 0;
    }
  }
  #dispose() {
    this.#inspectorFrontendHost.events.removeEventListener(
      Host.InspectorFrontendHostAPI.Events.FileSystemRemoved,
      this.#fileSystemRemoved,
      this
    );
    this.#projectSettingsModel.removeEventListener(
      ProjectSettings.ProjectSettingsModel.Events.AVAILABILITY_CHANGED,
      this.#availabilityChanged,
      this
    );
    this.#projectSettingsModel.removeEventListener(
      ProjectSettings.ProjectSettingsModel.Events.PROJECT_SETTINGS_CHANGED,
      this.#projectSettingsChanged,
      this
    );
  }
  #availabilityChanged(event) {
    const availability = event.data;
    if (this.#availability !== availability) {
      this.#availability = availability;
      this.dispatchEventToListeners("AvailabilityChanged" /* AVAILABILITY_CHANGED */, this.#availability);
    }
  }
  #fileSystemRemoved(event) {
    if (this.#automaticFileSystem === null) {
      return;
    }
    if (this.#automaticFileSystem.root === event.data) {
      this.#automaticFileSystem = Object.freeze({
        ...this.#automaticFileSystem,
        state: "disconnected"
      });
      this.dispatchEventToListeners("AutomaticFileSystemChanged" /* AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
    }
  }
  #projectSettingsChanged(event) {
    const projectSettings = event.data;
    let automaticFileSystem = this.#automaticFileSystem;
    if (projectSettings.workspace) {
      const { root, uuid } = projectSettings.workspace;
      if (automaticFileSystem?.root !== root || automaticFileSystem.uuid !== uuid) {
        automaticFileSystem = Object.freeze({ root, uuid, state: "disconnected" });
      }
    } else if (automaticFileSystem !== null) {
      automaticFileSystem = null;
    }
    if (this.#automaticFileSystem !== automaticFileSystem) {
      this.disconnectedAutomaticFileSystem();
      this.#automaticFileSystem = automaticFileSystem;
      this.dispatchEventToListeners("AutomaticFileSystemChanged" /* AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
      void this.connectAutomaticFileSystem(
        /* addIfMissing= */
        false
      );
    }
  }
  /**
   * Attempt to connect the automatic workspace folder (if any).
   *
   * @param addIfMissing if `false` (the default), this will only try to connect
   *                     to a previously connected automatic workspace folder.
   *                     If the folder was never connected before and `true` is
   *                     specified, the user will be asked to grant permission
   *                     to allow Chrome DevTools to access the folder first.
   * @returns `true` if the automatic workspace folder was connected, `false`
   *          if there wasn't any, or the connection attempt failed (e.g. the
   *          user did not grant permission).
   */
  async connectAutomaticFileSystem(addIfMissing = false) {
    if (!this.#automaticFileSystem) {
      return false;
    }
    const { root, uuid, state } = this.#automaticFileSystem;
    if (state === "disconnected") {
      const automaticFileSystem = this.#automaticFileSystem = Object.freeze({ ...this.#automaticFileSystem, state: "connecting" });
      this.dispatchEventToListeners("AutomaticFileSystemChanged" /* AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
      const { success } = await new Promise(
        (resolve) => this.#inspectorFrontendHost.connectAutomaticFileSystem(root, uuid, addIfMissing, resolve)
      );
      if (this.#automaticFileSystem === automaticFileSystem) {
        const state2 = success ? "connected" : "disconnected";
        this.#automaticFileSystem = Object.freeze({ ...automaticFileSystem, state: state2 });
        this.dispatchEventToListeners("AutomaticFileSystemChanged" /* AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
      }
    }
    return this.#automaticFileSystem?.state === "connected";
  }
  /**
   * Disconnects any automatic workspace folder.
   */
  disconnectedAutomaticFileSystem() {
    if (this.#automaticFileSystem && this.#automaticFileSystem.state !== "disconnected") {
      this.#inspectorFrontendHost.disconnectAutomaticFileSystem(this.#automaticFileSystem.root);
      this.#automaticFileSystem = Object.freeze({ ...this.#automaticFileSystem, state: "disconnected" });
      this.dispatchEventToListeners("AutomaticFileSystemChanged" /* AUTOMATIC_FILE_SYSTEM_CHANGED */, this.#automaticFileSystem);
    }
  }
}
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["AUTOMATIC_FILE_SYSTEM_CHANGED"] = "AutomaticFileSystemChanged";
  Events2["AVAILABILITY_CHANGED"] = "AvailabilityChanged";
  return Events2;
})(Events || {});
//# sourceMappingURL=AutomaticFileSystemManager.js.map
