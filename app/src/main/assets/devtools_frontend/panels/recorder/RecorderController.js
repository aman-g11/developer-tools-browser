"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _storage, _screenshotStorage, _replayAllowed, _replayState, _fileSelector, _exportMenuButton, _stepBreakpointIndexes, _builtInConverters, _recorderSettings, _shortcutHelper, _disableRecorderImportWarningSetting, _selfXssWarningDisabledSetting, _recordingView, _createRecordingView, _RecorderController_instances, updateExtensions_fn, clearError_fn, importFile_fn, setCurrentRecording_fn, setCurrentPage_fn, buildSettings_fn, getMainTarget_fn, getSectionFromStep_fn, updateScreenshotsForSections_fn, onAbortReplay_fn, onPlayViaExtension_fn, onPlayRecording_fn, disableDeviceModeIfEnabled_fn, setTouchEmulationAllowed_fn, onSetRecording_fn, handleRecordingChanged_fn, handleStepAdded_fn, handleRecordingTitleChanged_fn, handleStepRemoved_fn, onNetworkConditionsChanged_fn, onTimeoutChanged_fn, onDeleteRecording_fn, onCreateNewRecording_fn, onRecordingStarted_fn, onRecordingFinished_fn, onRecordingSelected_fn, onExportOptionSelected_fn, exportContent_fn, handleAddAssertionEvent_fn, acknowledgeImportNotice_fn, onImportRecording_fn, onPlayRecordingByName_fn, _onAddBreakpoint, _onRemoveBreakpoint, onExtensionViewClosed_fn, getShortcutsInfo_fn, renderCurrentPage_fn, renderAllRecordingsPage_fn, renderStartPage_fn, renderRecordingPage_fn, renderCreateRecordingPage_fn, _getExportMenuButton, onExportRecording_fn, onExportMenuClosed_fn;
import "../../ui/kit/kit.js";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Bindings from "../../models/bindings/bindings.js";
import * as PublicExtensions from "../../models/extensions/extensions.js";
import * as PanelCommon from "../../panels/common/common.js";
import * as Emulation from "../../panels/emulation/emulation.js";
import * as Tracing from "../../services/tracing/tracing.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as Lit from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as Components from "./components/components.js";
import * as Converters from "./converters/converters.js";
import * as Extensions from "./extensions/extensions.js";
import * as Models from "./models/models.js";
import * as Actions from "./recorder-actions/recorder-actions.js";
import recorderControllerStyles from "./recorderController.css.js";
import * as Events from "./RecorderEvents.js";
const { html, Decorators, Directives: { ref }, LitElement } = Lit;
const { customElement, state } = Decorators;
const UIStrings = {
  /**
   * @description The title of the button that leads to a page for creating a new recording.
   */
  createRecording: "Create recording",
  /**
   * @description The title of the button that allows importing a recording.
   */
  importRecording: "Import recording",
  /**
   * @description The announcement text for screen readers when a recording is imported.
   */
  recordingImported: "Recording imported",
  /**
   * @description The title of the button that deletes the recording
   */
  deleteRecording: "Delete recording",
  /**
   * @description The announcement text for screen readers when a recording is deleted.
   */
  recordingDeleted: "Recording deleted",
  /**
   * @description The title of the select if user has no saved recordings
   */
  noRecordings: "No recordings",
  /**
   * @description The title of the select option for one or more recording
   * number followed by this text - `1 recording(s)` or `4 recording(s)`
   */
  numberOfRecordings: "recording(s)",
  /**
   * @description The title of the button that continues the replay
   */
  continueReplay: "Continue",
  /**
   * @description The title of the button that executes only one step in the replay
   */
  stepOverReplay: "Execute one step",
  /**
   * @description The title of the button that opens a menu with various options of exporting a recording to file.
   */
  exportRecording: "Export recording",
  /**
   * @description The title of shortcut for starting and stopping recording.
   */
  startStopRecording: "Start/Stop recording",
  /**
   * @description The title of shortcut for replaying recording.
   */
  replayRecording: "Replay recording",
  /**
   * @description The title of shortcut for copying a recording or selected step.
   */
  copyShortcut: "Copy recording or selected step",
  /**
   * @description The title of shortcut for toggling code view.
   */
  toggleCode: "Toggle code view",
  /**
   * @description The title of the menu group in the export menu of the Recorder
   * panel that is followed by the list of built-in export formats.
   */
  export: "Export",
  /**
   * @description The announcement text for screen readers when a recording is exported successfully.
   */
  recordingExported: "Recording exported",
  /**
   * @description The title of the menu group in the export menu of the Recorder
   * panel that is followed by the list of export formats available via browser
   * extensions.
   */
  exportViaExtensions: "Export via extensions",
  /**
   * @description The title of the menu option that leads to a page that lists
   * all browsers extensions available for Recorder.
   */
  getExtensions: "Get extensions\u2026",
  /**
   * @description The button label that leads to the feedback form for Recorder.
   */
  sendFeedback: "Send feedback",
  /**
   * @description The header of the start page in the Recorder panel.
   */
  header: "Nothing recorded yet",
  /**
   * @description Text to explain the usage of the recorder panel.
   */
  recordingDescription: "Use recordings to create automated end-to-end tests or performance traces.",
  /**
   * @description Link text to forward to a documentation page on the recorder.
   */
  learnMore: "Learn more",
  /**
   * @description Headline of warning shown to users when users import a recording into DevTools Recorder.
   */
  doYouTrustThisCode: "Do you trust this recording?",
  /**
   * @description Warning shown to users when imports code into DevTools Recorder.
   * @example {allow importing} PH1
   */
  doNotImport: "Don't import recordings you do not understand or have not reviewed yourself into DevTools. This could allow attackers to steal your identity or take control of your computer. Please type ''{PH1}'' below to allow importing.",
  /**
   * @description Text a user needs to type in order to confirm that they
   *are aware of the danger of import code into the DevTools Recorder.
   */
  allowImporting: "allow importing",
  /**
   * @description Input box placeholder which instructs the user to type 'allow importing' into the input box.
   * @example {allow importing} PH1
   */
  typeAllowImporting: "Type ''{PH1}''"
};
const str_ = i18n.i18n.registerUIStrings("panels/recorder/RecorderController.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const GET_EXTENSIONS_MENU_ITEM = "get-extensions-link";
const GET_EXTENSIONS_URL = "https://goo.gle/recorder-extension-list";
const RECORDER_EXPLANATION_URL = "https://developer.chrome.com/docs/devtools/recorder";
const FEEDBACK_URL = "https://goo.gle/recorder-feedback";
export var Pages = /* @__PURE__ */ ((Pages2) => {
  Pages2["START_PAGE"] = "StartPage";
  Pages2["ALL_RECORDINGS_PAGE"] = "AllRecordingsPage";
  Pages2["CREATE_RECORDING_PAGE"] = "CreateRecordingPage";
  Pages2["RECORDING_PAGE"] = "RecordingPage";
  return Pages2;
})(Pages || {});
const CONVERTER_ID_TO_METRIC = {
  [Models.ConverterIds.ConverterIds.JSON]: Host.UserMetrics.RecordingExported.TO_JSON,
  [Models.ConverterIds.ConverterIds.REPLAY]: Host.UserMetrics.RecordingExported.TO_PUPPETEER_REPLAY,
  [Models.ConverterIds.ConverterIds.PUPPETEER]: Host.UserMetrics.RecordingExported.TO_PUPPETEER,
  [Models.ConverterIds.ConverterIds.PUPPETEER_FIREFOX]: Host.UserMetrics.RecordingExported.TO_PUPPETEER,
  [Models.ConverterIds.ConverterIds.LIGHTHOUSE]: Host.UserMetrics.RecordingExported.TO_LIGHTHOUSE
};
export let RecorderController = class extends LitElement {
  constructor() {
    super();
    __privateAdd(this, _RecorderController_instances);
    __privateAdd(this, _storage, Models.RecordingStorage.RecordingStorage.instance());
    __privateAdd(this, _screenshotStorage, Models.ScreenshotStorage.ScreenshotStorage.instance());
    // TODO: we keep the functionality to allow/disallow replay but right now it's not used.
    // It can be used to decide if we allow replay on a certain target for example.
    __privateAdd(this, _replayAllowed, true);
    __privateAdd(this, _replayState, { isPlaying: false, isPausedOnBreakpoint: false });
    __privateAdd(this, _fileSelector);
    __privateAdd(this, _exportMenuButton);
    __privateAdd(this, _stepBreakpointIndexes, /* @__PURE__ */ new Set());
    __privateAdd(this, _builtInConverters);
    __privateAdd(this, _recorderSettings, new Models.RecorderSettings.RecorderSettings());
    __privateAdd(this, _shortcutHelper, new Models.RecorderShortcutHelper.RecorderShortcutHelper());
    __privateAdd(this, _disableRecorderImportWarningSetting, Common.Settings.Settings.instance().createSetting(
      "disable-recorder-import-warning",
      false,
      Common.Settings.SettingStorageType.SYNCED
    ));
    __privateAdd(this, _selfXssWarningDisabledSetting, Common.Settings.Settings.instance().createSetting(
      "disable-self-xss-warning",
      false,
      Common.Settings.SettingStorageType.SYNCED
    ));
    __privateAdd(this, _recordingView);
    __privateAdd(this, _createRecordingView);
    __privateAdd(this, _onAddBreakpoint, (event) => {
      __privateSet(this, _stepBreakpointIndexes, structuredClone(__privateGet(this, _stepBreakpointIndexes)));
      __privateGet(this, _stepBreakpointIndexes).add(event.index);
      this.recordingPlayer?.updateBreakpointIndexes(__privateGet(this, _stepBreakpointIndexes));
      this.requestUpdate();
    });
    __privateAdd(this, _onRemoveBreakpoint, (event) => {
      __privateSet(this, _stepBreakpointIndexes, structuredClone(__privateGet(this, _stepBreakpointIndexes)));
      __privateGet(this, _stepBreakpointIndexes).delete(event.index);
      this.recordingPlayer?.updateBreakpointIndexes(__privateGet(this, _stepBreakpointIndexes));
      this.requestUpdate();
    });
    __privateAdd(this, _getExportMenuButton, () => {
      if (!__privateGet(this, _exportMenuButton)) {
        throw new Error("#exportMenuButton not found");
      }
      return __privateGet(this, _exportMenuButton);
    });
    this.isRecording = false;
    this.isToggling = false;
    this.exportMenuExpanded = false;
    this.currentPage = "StartPage" /* START_PAGE */;
    if (__privateGet(this, _storage).getRecordings().length) {
      __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */);
    }
    const textEditorIndent = Common.Settings.Settings.instance().moduleSetting("text-editor-indent").get();
    __privateSet(this, _builtInConverters, Object.freeze([
      new Converters.JSONConverter.JSONConverter(textEditorIndent),
      new Converters.PuppeteerReplayConverter.PuppeteerReplayConverter(textEditorIndent),
      new Converters.PuppeteerConverter.PuppeteerConverter(textEditorIndent),
      new Converters.PuppeteerFirefoxConverter.PuppeteerFirefoxConverter(textEditorIndent),
      new Converters.LighthouseConverter.LighthouseConverter(textEditorIndent)
    ]));
    const extensionManager = Extensions.ExtensionManager.ExtensionManager.instance();
    __privateMethod(this, _RecorderController_instances, updateExtensions_fn).call(this, extensionManager.extensions());
    extensionManager.addEventListener(Extensions.ExtensionManager.Events.EXTENSIONS_UPDATED, (event) => {
      __privateMethod(this, _RecorderController_instances, updateExtensions_fn).call(this, event.data);
    });
    this.addEventListener("setrecording", (event) => __privateMethod(this, _RecorderController_instances, onSetRecording_fn).call(this, event));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.currentRecordingSession) {
      void this.currentRecordingSession.stop();
    }
  }
  setIsRecordingStateForTesting(isRecording) {
    this.isRecording = isRecording;
  }
  setRecordingStateForTesting(state2) {
    __privateGet(this, _replayState).isPlaying = state2.isPlaying;
    __privateGet(this, _replayState).isPausedOnBreakpoint = state2.isPausedOnBreakpoint;
  }
  setCurrentPageForTesting(page) {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, page);
  }
  getCurrentPageForTesting() {
    return this.currentPage;
  }
  getCurrentRecordingForTesting() {
    return this.currentRecording;
  }
  getStepBreakpointIndexesForTesting() {
    return [...__privateGet(this, _stepBreakpointIndexes).values()];
  }
  setCurrentRecordingForTesting(recording) {
    __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, recording);
  }
  getSectionsForTesting() {
    return this.sections;
  }
  // Used by e2e tests to inspect the current recording.
  getUserFlow() {
    return this.currentRecording?.flow;
  }
  async onRecordingCancelled() {
    if (this.previousPage) {
      __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, this.previousPage);
    }
  }
  handleActions(actionId) {
    if (!this.isActionPossible(actionId)) {
      return;
    }
    switch (actionId) {
      case Actions.RecorderActions.CREATE_RECORDING:
        __privateMethod(this, _RecorderController_instances, onCreateNewRecording_fn).call(this);
        return;
      case Actions.RecorderActions.START_RECORDING:
        if (this.currentPage !== "CreateRecordingPage" /* CREATE_RECORDING_PAGE */ && !this.isRecording) {
          __privateGet(this, _shortcutHelper).handleShortcut(__privateMethod(this, _RecorderController_instances, onRecordingStarted_fn).bind(this, {
            name: __privateGet(this, _recorderSettings).defaultTitle,
            selectorTypesToRecord: __privateGet(this, _recorderSettings).defaultSelectors,
            selectorAttribute: __privateGet(this, _recorderSettings).selectorAttribute ? __privateGet(this, _recorderSettings).selectorAttribute : void 0
          }));
        } else if (this.currentPage === "CreateRecordingPage" /* CREATE_RECORDING_PAGE */) {
          if (__privateGet(this, _createRecordingView)) {
            __privateGet(this, _shortcutHelper).handleShortcut(() => {
              __privateGet(this, _createRecordingView)?.startRecording();
            });
          }
        } else if (this.isRecording) {
          void __privateMethod(this, _RecorderController_instances, onRecordingFinished_fn).call(this);
        }
        return;
      case Actions.RecorderActions.REPLAY_RECORDING:
        void __privateMethod(this, _RecorderController_instances, onPlayRecording_fn).call(this, { targetPanel: Components.RecordingView.TargetPanel.DEFAULT, speed: __privateGet(this, _recorderSettings).speed });
        return;
      case Actions.RecorderActions.TOGGLE_CODE_VIEW: {
        __privateGet(this, _recordingView)?.showCodeToggle();
        return;
      }
    }
  }
  isActionPossible(actionId) {
    switch (actionId) {
      case Actions.RecorderActions.CREATE_RECORDING:
        return !this.isRecording && !__privateGet(this, _replayState).isPlaying;
      case Actions.RecorderActions.START_RECORDING:
        return !__privateGet(this, _replayState).isPlaying;
      case Actions.RecorderActions.REPLAY_RECORDING:
        return this.currentPage === "RecordingPage" /* RECORDING_PAGE */ && !__privateGet(this, _replayState).isPlaying;
      case Actions.RecorderActions.TOGGLE_CODE_VIEW:
        return this.currentPage === "RecordingPage" /* RECORDING_PAGE */;
      case Actions.RecorderActions.COPY_RECORDING_OR_STEP:
        return false;
    }
  }
  render() {
    const recordings = __privateGet(this, _storage).getRecordings();
    const selectValue = this.currentRecording ? this.currentRecording.storageName : this.currentPage;
    const values = [
      recordings.length === 0 ? {
        value: "StartPage" /* START_PAGE */,
        name: i18nString(UIStrings.noRecordings),
        selected: selectValue === "StartPage" /* START_PAGE */
      } : {
        value: "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */,
        name: `${recordings.length} ${i18nString(UIStrings.numberOfRecordings)}`,
        selected: selectValue === "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */
      },
      ...recordings.map((recording) => ({
        value: recording.storageName,
        name: recording.flow.title,
        selected: selectValue === recording.storageName
      }))
    ];
    return html`
        <style>${UI.inspectorCommonStyles}</style>
        <style>${recorderControllerStyles}</style>
        <div class="wrapper">
          <div class="header" jslog=${VisualLogging.toolbar()}>
            <devtools-button
              @click=${__privateMethod(this, _RecorderController_instances, onCreateNewRecording_fn)}
              .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "plus",
      disabled: __privateGet(this, _replayState).isPlaying || this.isRecording || this.isToggling,
      title: Models.Tooltip.getTooltipForActions(
        i18nString(UIStrings.createRecording),
        Actions.RecorderActions.CREATE_RECORDING
      ),
      jslogContext: Actions.RecorderActions.CREATE_RECORDING
    }}
            ></devtools-button>
            <div class="separator"></div>
            <select
              .disabled=${recordings.length === 0 || __privateGet(this, _replayState).isPlaying || this.isRecording || this.isToggling}
              @click=${(e) => e.stopPropagation()}
              @change=${__privateMethod(this, _RecorderController_instances, onRecordingSelected_fn)}
              jslog=${VisualLogging.dropDown("recordings").track({ change: true })}
            >
              ${Lit.Directives.repeat(
      values,
      (item) => item.value,
      (item) => {
        return html`<option .selected=${item.selected} value=${item.value}>${item.name}</option>`;
      }
    )}
            </select>
            <div class="separator"></div>
            <devtools-button
              @click=${__privateMethod(this, _RecorderController_instances, onImportRecording_fn)}
              .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "import",
      title: i18nString(UIStrings.importRecording),
      jslogContext: "import-recording"
    }}
            ></devtools-button>
            <devtools-button
              id='origin'
              @click=${__privateMethod(this, _RecorderController_instances, onExportRecording_fn)}
              ${ref((el) => {
      if (el instanceof HTMLElement) {
        __privateSet(this, _exportMenuButton, el);
      }
    })}
              .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "download",
      title: i18nString(UIStrings.exportRecording),
      disabled: !this.currentRecording
    }}
              jslog=${VisualLogging.dropDown("export-recording").track({ click: true })}
            ></devtools-button>
            <devtools-menu
              @menucloserequest=${__privateMethod(this, _RecorderController_instances, onExportMenuClosed_fn)}
              @menuitemselected=${__privateMethod(this, _RecorderController_instances, onExportOptionSelected_fn)}
              .origin=${__privateGet(this, _getExportMenuButton)}
              .showDivider=${false}
              .showSelectedItem=${false}
              .open=${this.exportMenuExpanded}
            >
              <devtools-menu-group .name=${i18nString(UIStrings.export)}>
                ${Lit.Directives.repeat(
      __privateGet(this, _builtInConverters),
      (converter) => {
        return html`
                    <devtools-menu-item
                      .value=${converter.getId()}
                      jslog=${VisualLogging.item(`converter-${Platform.StringUtilities.toKebabCase(converter.getId())}`).track({ click: true })}>
                      ${converter.getFormatName()}
                    </devtools-menu-item>
                  `;
      }
    )}
              </devtools-menu-group>
              <devtools-menu-group .name=${i18nString(UIStrings.exportViaExtensions)}>
                ${Lit.Directives.repeat(
      this.extensionConverters,
      (converter) => {
        return html`
                    <devtools-menu-item
                     .value=${converter.getId()}
                      jslog=${VisualLogging.item("converter-extension").track({ click: true })}>
                    ${converter.getFormatName()}
                    </devtools-menu-item>
                  `;
      }
    )}
                <devtools-menu-item .value=${GET_EXTENSIONS_MENU_ITEM}>
                  ${i18nString(UIStrings.getExtensions)}
                </devtools-menu-item>
              </devtools-menu-group>
            </devtools-menu>
            <devtools-button
              @click=${__privateMethod(this, _RecorderController_instances, onDeleteRecording_fn)}
              .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "bin",
      disabled: !this.currentRecording || __privateGet(this, _replayState).isPlaying || this.isRecording || this.isToggling,
      title: i18nString(UIStrings.deleteRecording),
      jslogContext: "delete-recording"
    }}
            ></devtools-button>
            <div class="separator"></div>
            <devtools-button
              @click=${() => this.recordingPlayer?.continue()}
              .data=${{
      variant: Buttons.Button.Variant.PRIMARY_TOOLBAR,
      iconName: "resume",
      disabled: !this.recordingPlayer || !__privateGet(this, _replayState).isPausedOnBreakpoint,
      title: i18nString(UIStrings.continueReplay),
      jslogContext: "continue-replay"
    }}
            ></devtools-button>
            <devtools-button
              @click=${() => this.recordingPlayer?.stepOver()}
              .data=${{
      variant: Buttons.Button.Variant.TOOLBAR,
      iconName: "step-over",
      disabled: !this.recordingPlayer || !__privateGet(this, _replayState).isPausedOnBreakpoint,
      title: i18nString(UIStrings.stepOverReplay),
      jslogContext: "step-over"
    }}
            ></devtools-button>
            <div class="feedback">
              <devtools-link class="devtools-link" title=${i18nString(UIStrings.sendFeedback)} href=${FEEDBACK_URL} jslogcontext="feedback">${i18nString(UIStrings.sendFeedback)}</devtools-link>
            </div>
            <div class="separator"></div>
            <devtools-shortcut-dialog
              .data=${{
      shortcuts: __privateMethod(this, _RecorderController_instances, getShortcutsInfo_fn).call(this)
    }} jslog=${VisualLogging.action("show-shortcuts").track({ click: true })}
            ></devtools-shortcut-dialog>
          </div>
          ${this.importError ? html`<div class='error'>Import error: ${this.importError.message}</div>` : ""}
          ${__privateMethod(this, _RecorderController_instances, renderCurrentPage_fn).call(this)}
        </div>
      `;
  }
};
_storage = new WeakMap();
_screenshotStorage = new WeakMap();
_replayAllowed = new WeakMap();
_replayState = new WeakMap();
_fileSelector = new WeakMap();
_exportMenuButton = new WeakMap();
_stepBreakpointIndexes = new WeakMap();
_builtInConverters = new WeakMap();
_recorderSettings = new WeakMap();
_shortcutHelper = new WeakMap();
_disableRecorderImportWarningSetting = new WeakMap();
_selfXssWarningDisabledSetting = new WeakMap();
_recordingView = new WeakMap();
_createRecordingView = new WeakMap();
_RecorderController_instances = new WeakSet();
updateExtensions_fn = function(extensions) {
  this.extensionConverters = extensions.filter((extension) => extension.getCapabilities().includes("export")).map((extension, idx) => {
    return new Converters.ExtensionConverter.ExtensionConverter(idx, extension);
  });
  this.replayExtensions = extensions.filter((extension) => extension.getCapabilities().includes("replay"));
};
/**
 * We should clear errors on every new action in the controller.
 * TODO: think how to make handle this centrally so that in no case
 * the error remains shown for longer than needed. Maybe a timer?
 */
clearError_fn = function() {
  this.importError = void 0;
};
importFile_fn = async function(file) {
  const outputStream = new Common.StringOutputStream.StringOutputStream();
  const reader = new Bindings.FileUtils.ChunkedFileReader(
    file,
    /* chunkSize */
    1e7
  );
  const success = await reader.read(outputStream);
  if (!success) {
    throw reader.error() ?? new Error("Unknown");
  }
  let flow;
  try {
    flow = Models.SchemaUtils.parse(JSON.parse(outputStream.data()));
  } catch (error) {
    this.importError = error;
    return;
  }
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).saveRecording(flow));
  __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "RecordingPage" /* RECORDING_PAGE */);
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.recordingImported));
};
setCurrentRecording_fn = function(recording, opts = {}) {
  const { keepBreakpoints = false, updateSession = false } = opts;
  this.recordingPlayer?.abort();
  this.currentStep = void 0;
  this.recordingError = void 0;
  this.lastReplayResult = void 0;
  this.recordingPlayer = void 0;
  __privateGet(this, _replayState).isPlaying = false;
  __privateGet(this, _replayState).isPausedOnBreakpoint = false;
  __privateSet(this, _stepBreakpointIndexes, keepBreakpoints ? __privateGet(this, _stepBreakpointIndexes) : /* @__PURE__ */ new Set());
  if (recording) {
    this.currentRecording = recording;
    this.sections = Models.Section.buildSections(recording.flow.steps);
    this.settings = __privateMethod(this, _RecorderController_instances, buildSettings_fn).call(this, recording.flow);
    if (updateSession && this.currentRecordingSession) {
      this.currentRecordingSession.overwriteUserFlow(recording.flow);
    }
  } else {
    this.currentRecording = void 0;
    this.sections = void 0;
    this.settings = void 0;
  }
  __privateMethod(this, _RecorderController_instances, updateScreenshotsForSections_fn).call(this);
};
setCurrentPage_fn = function(page) {
  if (page === this.currentPage) {
    return;
  }
  this.previousPage = this.currentPage;
  this.currentPage = page;
};
buildSettings_fn = function(flow) {
  const steps = flow.steps;
  const navigateStepIdx = steps.findIndex((step) => step.type === "navigate");
  const settings = { timeout: flow.timeout };
  for (let i = navigateStepIdx - 1; i >= 0; i--) {
    const step = steps[i];
    if (!settings.viewportSettings && step.type === "setViewport") {
      settings.viewportSettings = step;
    }
    if (!settings.networkConditionsSettings && step.type === "emulateNetworkConditions") {
      settings.networkConditionsSettings = { ...step };
      for (const preset of [
        SDK.NetworkManager.OfflineConditions,
        SDK.NetworkManager.Slow3GConditions,
        SDK.NetworkManager.Slow4GConditions,
        SDK.NetworkManager.Fast4GConditions
      ]) {
        if (SDK.NetworkManager.networkConditionsEqual(
          { ...preset, title: preset.i18nTitleKey || "" },
          // The key below is not used, but we need it to satisfy TS.
          {
            ...step,
            title: preset.i18nTitleKey || "",
            key: `step_${i}_recorder_key`
          }
        )) {
          settings.networkConditionsSettings.title = preset.title instanceof Function ? preset.title() : preset.title;
          settings.networkConditionsSettings.i18nTitleKey = preset.i18nTitleKey;
        }
      }
    }
  }
  return settings;
};
getMainTarget_fn = function() {
  const target = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
  if (!target) {
    throw new Error("Missing main page target");
  }
  return target;
};
getSectionFromStep_fn = function(step) {
  if (!this.sections) {
    return null;
  }
  for (const section of this.sections) {
    if (section.steps.indexOf(step) !== -1) {
      return section;
    }
  }
  return null;
};
updateScreenshotsForSections_fn = function() {
  if (!this.sections || !this.currentRecording) {
    return;
  }
  const storageName = this.currentRecording.storageName;
  for (let i = 0; i < this.sections.length; i++) {
    const screenshot = __privateGet(this, _screenshotStorage).getScreenshotForSection(storageName, i);
    this.sections[i].screenshot = screenshot || void 0;
  }
  this.requestUpdate();
};
onAbortReplay_fn = function() {
  this.recordingPlayer?.abort();
};
onPlayViaExtension_fn = async function(extension) {
  if (!this.currentRecording || !__privateGet(this, _replayAllowed)) {
    return;
  }
  const pluginManager = PublicExtensions.RecorderPluginManager.RecorderPluginManager.instance();
  const promise = pluginManager.once(PublicExtensions.RecorderPluginManager.Events.SHOW_VIEW_REQUESTED);
  extension.replay(this.currentRecording.flow);
  const descriptor = await promise;
  this.viewDescriptor = descriptor;
  Host.userMetrics.recordingReplayStarted(Host.UserMetrics.RecordingReplayStarted.REPLAY_VIA_EXTENSION);
};
onPlayRecording_fn = async function(event) {
  if (!this.currentRecording || !__privateGet(this, _replayAllowed)) {
    return;
  }
  if (this.viewDescriptor) {
    this.viewDescriptor = void 0;
  }
  if (event.extension) {
    return await __privateMethod(this, _RecorderController_instances, onPlayViaExtension_fn).call(this, event.extension);
  }
  Host.userMetrics.recordingReplayStarted(
    event.targetPanel !== Components.RecordingView.TargetPanel.DEFAULT ? Host.UserMetrics.RecordingReplayStarted.REPLAY_WITH_PERFORMANCE_TRACING : Host.UserMetrics.RecordingReplayStarted.REPLAY_ONLY
  );
  __privateGet(this, _replayState).isPlaying = true;
  this.currentStep = void 0;
  this.recordingError = void 0;
  this.lastReplayResult = void 0;
  const currentRecording = this.currentRecording;
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  await __privateMethod(this, _RecorderController_instances, disableDeviceModeIfEnabled_fn).call(this);
  this.recordingPlayer = new Models.RecordingPlayer.RecordingPlayer(
    this.currentRecording.flow,
    { speed: event.speed, breakpointIndexes: __privateGet(this, _stepBreakpointIndexes) }
  );
  const withPerformanceTrace = event.targetPanel === Components.RecordingView.TargetPanel.PERFORMANCE_PANEL;
  const sectionsWithScreenshot = /* @__PURE__ */ new Set();
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.STEP, async ({ data: { step, resolve } }) => {
    this.currentStep = step;
    const currentSection = __privateMethod(this, _RecorderController_instances, getSectionFromStep_fn).call(this, step);
    if (this.sections && currentSection && !sectionsWithScreenshot.has(currentSection)) {
      sectionsWithScreenshot.add(currentSection);
      const currentSectionIndex = this.sections.indexOf(currentSection);
      const screenshot = await Models.ScreenshotUtils.takeScreenshot();
      currentSection.screenshot = screenshot;
      Models.ScreenshotStorage.ScreenshotStorage.instance().storeScreenshotForSection(
        currentRecording.storageName,
        currentSectionIndex,
        screenshot
      );
    }
    resolve();
  });
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.STOP, () => {
    __privateGet(this, _replayState).isPausedOnBreakpoint = true;
    this.requestUpdate();
  });
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.CONTINUE, () => {
    __privateGet(this, _replayState).isPausedOnBreakpoint = false;
    this.requestUpdate();
  });
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.ERROR, ({ data: error }) => {
    this.recordingError = error;
    if (!withPerformanceTrace) {
      __privateGet(this, _replayState).isPlaying = false;
      this.recordingPlayer = void 0;
    }
    this.lastReplayResult = Models.RecordingPlayer.ReplayResult.FAILURE;
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.startsWith("could not find element")) {
      Host.userMetrics.recordingReplayFinished(Host.UserMetrics.RecordingReplayFinished.TIMEOUT_ERROR_SELECTORS);
    } else if (errorMessage.startsWith("waiting for target failed")) {
      Host.userMetrics.recordingReplayFinished(Host.UserMetrics.RecordingReplayFinished.TIMEOUT_ERROR_TARGET);
    } else {
      Host.userMetrics.recordingReplayFinished(Host.UserMetrics.RecordingReplayFinished.OTHER_ERROR);
    }
    this.dispatchEvent(new Events.ReplayFinishedEvent());
  });
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.DONE, () => {
    if (!withPerformanceTrace) {
      __privateGet(this, _replayState).isPlaying = false;
      this.recordingPlayer = void 0;
    }
    this.lastReplayResult = Models.RecordingPlayer.ReplayResult.SUCCESS;
    this.dispatchEvent(new Events.ReplayFinishedEvent());
    Host.userMetrics.recordingReplayFinished(Host.UserMetrics.RecordingReplayFinished.SUCCESS);
  });
  this.recordingPlayer.addEventListener(Models.RecordingPlayer.Events.ABORT, () => {
    this.currentStep = void 0;
    this.recordingError = void 0;
    this.lastReplayResult = void 0;
    __privateGet(this, _replayState).isPlaying = false;
  });
  let resolveWithEvents = (_events) => {
  };
  const eventsPromise = new Promise((resolve) => {
    resolveWithEvents = resolve;
  });
  let performanceTracing = null;
  switch (event.targetPanel) {
    case Components.RecordingView.TargetPanel.PERFORMANCE_PANEL:
      performanceTracing = new Tracing.PerformanceTracing.PerformanceTracing(__privateMethod(this, _RecorderController_instances, getMainTarget_fn).call(this), {
        tracingBufferUsage() {
        },
        eventsRetrievalProgress() {
        },
        tracingComplete(events) {
          resolveWithEvents(events);
        }
      });
      break;
  }
  if (performanceTracing) {
    await performanceTracing.start();
  }
  __privateMethod(this, _RecorderController_instances, setTouchEmulationAllowed_fn).call(this, false);
  await this.recordingPlayer.play();
  __privateMethod(this, _RecorderController_instances, setTouchEmulationAllowed_fn).call(this, true);
  if (performanceTracing) {
    await performanceTracing.stop();
    const events = await eventsPromise;
    __privateGet(this, _replayState).isPlaying = false;
    this.recordingPlayer = void 0;
    await UI.InspectorView.InspectorView.instance().showPanel(event.targetPanel);
    if (event.targetPanel === Components.RecordingView.TargetPanel.PERFORMANCE_PANEL) {
      const trace = new SDK.TraceObject.TraceObject(events);
      void Common.Revealer.reveal(trace);
    }
  }
};
disableDeviceModeIfEnabled_fn = async function() {
  try {
    const deviceModeWrapper = Emulation.DeviceModeWrapper.DeviceModeWrapper.instance();
    if (deviceModeWrapper.isDeviceModeOn()) {
      deviceModeWrapper.toggleDeviceMode();
      const emulationModel = __privateMethod(this, _RecorderController_instances, getMainTarget_fn).call(this).model(SDK.EmulationModel.EmulationModel);
      await emulationModel?.emulateDevice(null);
    }
  } catch {
  }
};
setTouchEmulationAllowed_fn = function(touchEmulationAllowed) {
  const emulationModel = __privateMethod(this, _RecorderController_instances, getMainTarget_fn).call(this).model(SDK.EmulationModel.EmulationModel);
  emulationModel?.setTouchEmulationAllowed(touchEmulationAllowed);
};
onSetRecording_fn = async function(event) {
  const json = JSON.parse(event.detail);
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).saveRecording(Models.SchemaUtils.parse(json)));
  __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "RecordingPage" /* RECORDING_PAGE */);
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
};
handleRecordingChanged_fn = async function(event) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  const recording = {
    ...this.currentRecording,
    flow: {
      ...this.currentRecording.flow,
      steps: this.currentRecording.flow.steps.map((step) => step === event.currentStep ? event.newStep : step)
    }
  };
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(recording.storageName, recording.flow), { keepBreakpoints: true, updateSession: true });
};
handleStepAdded_fn = async function(event) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  const stepOrSection = event.stepOrSection;
  let step;
  let position = event.position;
  if ("steps" in stepOrSection) {
    const sectionIdx = this.sections?.indexOf(stepOrSection);
    if (sectionIdx === void 0 || sectionIdx === -1) {
      throw new Error("There is no section to add a step to");
    }
    if (event.position === Components.StepView.AddStepPosition.AFTER) {
      if (this.sections?.[sectionIdx].steps.length) {
        step = this.sections?.[sectionIdx].steps[0];
        position = Components.StepView.AddStepPosition.BEFORE;
      } else {
        step = this.sections?.[sectionIdx].causingStep;
        position = Components.StepView.AddStepPosition.AFTER;
      }
    } else {
      if (sectionIdx <= 0) {
        throw new Error("There is no section to add a step to");
      }
      const prevSection = this.sections?.[sectionIdx - 1];
      step = prevSection?.steps[prevSection.steps.length - 1];
      position = Components.StepView.AddStepPosition.AFTER;
    }
  } else {
    step = stepOrSection;
  }
  if (!step) {
    throw new Error("Anchor step is not found when adding a step");
  }
  const steps = this.currentRecording.flow.steps;
  const currentIndex = steps.indexOf(step);
  const indexToInsertAt = currentIndex + (position === Components.StepView.AddStepPosition.BEFORE ? 0 : 1);
  steps.splice(indexToInsertAt, 0, { type: Models.Schema.StepType.WaitForElement, selectors: ["body"] });
  const recording = { ...this.currentRecording, flow: { ...this.currentRecording.flow, steps } };
  __privateSet(this, _stepBreakpointIndexes, new Set([...__privateGet(this, _stepBreakpointIndexes).values()].map((breakpointIndex) => {
    if (indexToInsertAt > breakpointIndex) {
      return breakpointIndex;
    }
    return breakpointIndex + 1;
  })));
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(recording.storageName, recording.flow), { keepBreakpoints: true, updateSession: true });
};
handleRecordingTitleChanged_fn = async function(title) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  const flow = { ...this.currentRecording.flow, title };
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, flow));
};
handleStepRemoved_fn = async function(event) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  const steps = this.currentRecording.flow.steps;
  const currentIndex = steps.indexOf(event.step);
  steps.splice(currentIndex, 1);
  const flow = { ...this.currentRecording.flow, steps };
  __privateSet(this, _stepBreakpointIndexes, new Set([...__privateGet(this, _stepBreakpointIndexes).values()].map((breakpointIndex) => {
    if (currentIndex > breakpointIndex) {
      return breakpointIndex;
    }
    if (currentIndex === breakpointIndex) {
      return -1;
    }
    return breakpointIndex - 1;
  }).filter((index) => index >= 0)));
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, flow), { keepBreakpoints: true, updateSession: true });
};
onNetworkConditionsChanged_fn = async function(data) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  const navigateIdx = this.currentRecording.flow.steps.findIndex((step) => step.type === "navigate");
  if (navigateIdx === -1) {
    throw new Error("Current recording does not have a navigate step");
  }
  const emulateNetworkConditionsIdx = this.currentRecording.flow.steps.findIndex((step, idx) => {
    if (idx >= navigateIdx) {
      return false;
    }
    return step.type === "emulateNetworkConditions";
  });
  if (!data) {
    if (emulateNetworkConditionsIdx !== -1) {
      this.currentRecording.flow.steps.splice(emulateNetworkConditionsIdx, 1);
    }
  } else if (emulateNetworkConditionsIdx === -1) {
    this.currentRecording.flow.steps.splice(
      0,
      0,
      Models.SchemaUtils.createEmulateNetworkConditionsStep(
        { download: data.download, upload: data.upload, latency: data.latency }
      )
    );
  } else {
    const step = this.currentRecording.flow.steps[emulateNetworkConditionsIdx];
    step.download = data.download;
    step.upload = data.upload;
    step.latency = data.latency;
  }
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, this.currentRecording.flow));
};
onTimeoutChanged_fn = async function(timeout) {
  if (!this.currentRecording) {
    throw new Error("Current recording expected to be defined.");
  }
  this.currentRecording.flow.timeout = timeout;
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, this.currentRecording.flow));
};
onDeleteRecording_fn = async function(event) {
  event.stopPropagation();
  if (event instanceof Components.RecordingListView.DeleteRecordingEvent) {
    await __privateGet(this, _storage).deleteRecording(event.storageName);
    __privateGet(this, _screenshotStorage).deleteScreenshotsForRecording(event.storageName);
    this.requestUpdate();
  } else {
    if (!this.currentRecording) {
      return;
    }
    await __privateGet(this, _storage).deleteRecording(this.currentRecording.storageName);
    __privateGet(this, _screenshotStorage).deleteScreenshotsForRecording(this.currentRecording.storageName);
  }
  UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.recordingDeleted));
  if ((await __privateGet(this, _storage).getRecordings()).length) {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */);
  } else {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "StartPage" /* START_PAGE */);
  }
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, void 0);
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
};
onCreateNewRecording_fn = function(event) {
  event?.stopPropagation();
  __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "CreateRecordingPage" /* CREATE_RECORDING_PAGE */);
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
};
onRecordingStarted_fn = async function(data) {
  await __privateMethod(this, _RecorderController_instances, disableDeviceModeIfEnabled_fn).call(this);
  this.isToggling = true;
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  Host.userMetrics.recordingToggled(Host.UserMetrics.RecordingToggled.RECORDING_STARTED);
  this.currentRecordingSession = new Models.RecordingSession.RecordingSession(__privateMethod(this, _RecorderController_instances, getMainTarget_fn).call(this), {
    title: data.name,
    selectorAttribute: data.selectorAttribute,
    selectorTypesToRecord: data.selectorTypesToRecord.length ? data.selectorTypesToRecord : Object.values(Models.Schema.SelectorType)
  });
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).saveRecording(this.currentRecordingSession.cloneUserFlow()));
  let previousSectionIndex = -1;
  let screenshotPromise;
  const takeScreenshot = async (currentRecording) => {
    if (!this.sections) {
      throw new Error("Could not find sections.");
    }
    const currentSectionIndex = this.sections.length - 1;
    const currentSection = this.sections[currentSectionIndex];
    if (screenshotPromise || previousSectionIndex === currentSectionIndex) {
      return;
    }
    screenshotPromise = Models.ScreenshotUtils.takeScreenshot();
    const screenshot = await screenshotPromise;
    screenshotPromise = void 0;
    currentSection.screenshot = screenshot;
    Models.ScreenshotStorage.ScreenshotStorage.instance().storeScreenshotForSection(
      currentRecording.storageName,
      currentSectionIndex,
      screenshot
    );
    previousSectionIndex = currentSectionIndex;
    __privateMethod(this, _RecorderController_instances, updateScreenshotsForSections_fn).call(this);
  };
  this.currentRecordingSession.addEventListener(
    Models.RecordingSession.Events.RECORDING_UPDATED,
    async ({ data: data2 }) => {
      if (!this.currentRecording) {
        throw new Error("No current recording found");
      }
      __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, data2));
      __privateGet(this, _recordingView)?.scrollToBottom();
      await takeScreenshot(this.currentRecording);
    }
  );
  this.currentRecordingSession.addEventListener(
    Models.RecordingSession.Events.RECORDING_STOPPED,
    async ({ data: data2 }) => {
      if (!this.currentRecording) {
        throw new Error("No current recording found");
      }
      Host.userMetrics.keyboardShortcutFired(Actions.RecorderActions.START_RECORDING);
      __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, data2));
      await __privateMethod(this, _RecorderController_instances, onRecordingFinished_fn).call(this);
    }
  );
  await this.currentRecordingSession.start();
  this.isToggling = false;
  this.isRecording = true;
  __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "RecordingPage" /* RECORDING_PAGE */);
  this.dispatchEvent(new Events.RecordingStateChangedEvent(this.currentRecording.flow));
};
onRecordingFinished_fn = async function() {
  if (!this.currentRecording || !this.currentRecordingSession) {
    throw new Error("Recording was never started");
  }
  this.isToggling = true;
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  Host.userMetrics.recordingToggled(Host.UserMetrics.RecordingToggled.RECORDING_FINISHED);
  await this.currentRecordingSession.stop();
  this.currentRecordingSession = void 0;
  this.isToggling = false;
  this.isRecording = false;
  this.dispatchEvent(new Events.RecordingStateChangedEvent(this.currentRecording.flow));
};
onRecordingSelected_fn = async function(event) {
  const storageName = event instanceof Components.RecordingListView.OpenRecordingEvent || event instanceof Components.RecordingListView.PlayRecordingEvent ? event.storageName : event.target?.value;
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).getRecording(storageName));
  if (this.currentRecording) {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "RecordingPage" /* RECORDING_PAGE */);
  } else if (storageName === "StartPage" /* START_PAGE */) {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "StartPage" /* START_PAGE */);
  } else if (storageName === "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */) {
    __privateMethod(this, _RecorderController_instances, setCurrentPage_fn).call(this, "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */);
  }
};
onExportOptionSelected_fn = async function(event) {
  if (typeof event.itemValue !== "string") {
    throw new Error("Invalid export option value");
  }
  if (event.itemValue === GET_EXTENSIONS_MENU_ITEM) {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(GET_EXTENSIONS_URL);
    return;
  }
  if (!this.currentRecording) {
    throw new Error("No recording selected");
  }
  const id = event.itemValue;
  const byId = (converter2) => converter2.getId() === id;
  const converter = __privateGet(this, _builtInConverters).find(byId) || this.extensionConverters.find(byId);
  if (!converter) {
    throw new Error("No recording selected");
  }
  const [content] = await converter.stringify(this.currentRecording.flow);
  await __privateMethod(this, _RecorderController_instances, exportContent_fn).call(this, converter.getFilename(this.currentRecording.flow), content);
  const builtInMetric = CONVERTER_ID_TO_METRIC[converter.getId()];
  if (builtInMetric) {
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.recordingExported));
  } else if (converter.getId().startsWith(Converters.ExtensionConverter.EXTENSION_PREFIX)) {
    UI.ARIAUtils.LiveAnnouncer.alert(i18nString(UIStrings.recordingExported));
  } else {
    throw new Error("Could not find a metric for the export option with id = " + id);
  }
};
exportContent_fn = async function(suggestedName, data) {
  try {
    const handle = await window.showSaveFilePicker({ suggestedName });
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    throw error;
  }
};
handleAddAssertionEvent_fn = async function() {
  if (!this.currentRecordingSession || !this.currentRecording) {
    return;
  }
  const flow = this.currentRecordingSession.cloneUserFlow();
  flow.steps.push({ type: "waitForElement", selectors: [[".cls"]] });
  __privateMethod(this, _RecorderController_instances, setCurrentRecording_fn).call(this, await __privateGet(this, _storage).updateRecording(this.currentRecording.storageName, flow), { keepBreakpoints: true, updateSession: true });
  await this.updateComplete;
  await __privateGet(this, _recordingView)?.updateComplete;
  __privateGet(this, _recordingView)?.contentElement?.querySelector(".section:last-child .step-view-widget:last-of-type")?.shadowRoot?.querySelector(".action")?.click();
};
acknowledgeImportNotice_fn = async function() {
  if (__privateGet(this, _disableRecorderImportWarningSetting).get()) {
    return true;
  }
  if (Root.Runtime.Runtime.queryParam("isChromeForTesting") || Root.Runtime.Runtime.queryParam("disableSelfXssWarnings") || __privateGet(this, _selfXssWarningDisabledSetting).get()) {
    return true;
  }
  const result = await PanelCommon.TypeToAllowDialog.show({
    jslogContext: {
      input: "confirm-import-recording-input",
      dialog: "confirm-import-recording-dialog"
    },
    message: i18nString(UIStrings.doNotImport, { PH1: i18nString(UIStrings.allowImporting) }),
    header: i18nString(UIStrings.doYouTrustThisCode),
    typePhrase: i18nString(UIStrings.allowImporting),
    inputPlaceholder: i18nString(UIStrings.typeAllowImporting, { PH1: i18nString(UIStrings.allowImporting) })
  });
  if (result) {
    __privateGet(this, _disableRecorderImportWarningSetting).set(true);
  }
  return result;
};
onImportRecording_fn = async function(event) {
  event.stopPropagation();
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  if (await __privateMethod(this, _RecorderController_instances, acknowledgeImportNotice_fn).call(this)) {
    __privateSet(this, _fileSelector, UI.UIUtils.createFileSelectorElement(__privateMethod(this, _RecorderController_instances, importFile_fn).bind(this)));
    __privateGet(this, _fileSelector).click();
  }
};
onPlayRecordingByName_fn = async function(event) {
  await __privateMethod(this, _RecorderController_instances, onRecordingSelected_fn).call(this, event);
  await __privateMethod(this, _RecorderController_instances, onPlayRecording_fn).call(this, { targetPanel: Components.RecordingView.TargetPanel.DEFAULT, speed: __privateGet(this, _recorderSettings).speed });
};
_onAddBreakpoint = new WeakMap();
_onRemoveBreakpoint = new WeakMap();
onExtensionViewClosed_fn = function() {
  this.viewDescriptor = void 0;
};
getShortcutsInfo_fn = function() {
  const getBindingForAction = (action) => {
    const shortcuts = UI.ShortcutRegistry.ShortcutRegistry.instance().shortcutsForAction(action);
    const shortcutsWithSplitBindings = shortcuts.map((shortcut) => shortcut.title().split(/[\s+]+/).map((word) => {
      return { key: word.trim() };
    }));
    return shortcutsWithSplitBindings;
  };
  return [
    {
      title: i18nString(UIStrings.startStopRecording),
      rows: getBindingForAction(Actions.RecorderActions.START_RECORDING)
    },
    {
      title: i18nString(UIStrings.replayRecording),
      rows: getBindingForAction(Actions.RecorderActions.REPLAY_RECORDING)
    },
    {
      title: i18nString(UIStrings.copyShortcut),
      rows: Host.Platform.isMac() ? [[{ key: "\u2318" }, { key: "C" }]] : [[{ key: "Ctrl" }, { key: "C" }]]
    },
    {
      title: i18nString(UIStrings.toggleCode),
      rows: getBindingForAction(Actions.RecorderActions.TOGGLE_CODE_VIEW)
    }
  ];
};
renderCurrentPage_fn = function() {
  switch (this.currentPage) {
    case "StartPage" /* START_PAGE */:
      return __privateMethod(this, _RecorderController_instances, renderStartPage_fn).call(this);
    case "AllRecordingsPage" /* ALL_RECORDINGS_PAGE */:
      return __privateMethod(this, _RecorderController_instances, renderAllRecordingsPage_fn).call(this);
    case "RecordingPage" /* RECORDING_PAGE */:
      return __privateMethod(this, _RecorderController_instances, renderRecordingPage_fn).call(this);
    case "CreateRecordingPage" /* CREATE_RECORDING_PAGE */:
      return __privateMethod(this, _RecorderController_instances, renderCreateRecordingPage_fn).call(this);
  }
};
renderAllRecordingsPage_fn = function() {
  const recordings = __privateGet(this, _storage).getRecordings();
  return html`
      <devtools-widget
        .widgetConfig=${UI.Widget.widgetConfig(Components.RecordingListView.RecordingListView, {
    recordings: recordings.map((recording) => ({
      storageName: recording.storageName,
      name: recording.flow.title
    })),
    replayAllowed: __privateGet(this, _replayAllowed)
  })}
        @createrecording=${__privateMethod(this, _RecorderController_instances, onCreateNewRecording_fn)}
        @deleterecording=${__privateMethod(this, _RecorderController_instances, onDeleteRecording_fn)}
        @openrecording=${__privateMethod(this, _RecorderController_instances, onRecordingSelected_fn)}
        @playrecording=${__privateMethod(this, _RecorderController_instances, onPlayRecordingByName_fn)}
      >
      </devtools-widget>
    `;
};
renderStartPage_fn = function() {
  return html`
      <div class="empty-state" jslog=${VisualLogging.section().context("start-view")}>
        <div class="empty-state-header">${i18nString(UIStrings.header)}</div>
        <div class="empty-state-description">
          <span>${i18nString(UIStrings.recordingDescription)}</span>
          <devtools-link
            class="devtools-link"
            href=${RECORDER_EXPLANATION_URL}
            jslogcontext="learn-more"
          >${i18nString(UIStrings.learnMore)}</devtools-link>
        </div>
        <devtools-button .variant=${Buttons.Button.Variant.TONAL} jslogContext=${Actions.RecorderActions.CREATE_RECORDING} @click=${__privateMethod(this, _RecorderController_instances, onCreateNewRecording_fn)}>${i18nString(UIStrings.createRecording)}</devtools-button>
      </div>
    `;
};
renderRecordingPage_fn = function() {
  return html`
      <devtools-widget
          class="recording-view"
          .widgetConfig=${UI.Widget.widgetConfig(Components.RecordingView.RecordingView, {
    recording: this.currentRecording?.flow ?? { title: "", steps: [] },
    replayState: __privateGet(this, _replayState),
    isRecording: this.isRecording,
    recordingTogglingInProgress: this.isToggling,
    currentStep: this.currentStep,
    currentError: this.recordingError,
    sections: this.sections ?? [],
    settings: this.settings,
    recorderSettings: __privateGet(this, _recorderSettings),
    lastReplayResult: this.lastReplayResult,
    replayAllowed: __privateGet(this, _replayAllowed),
    breakpointIndexes: __privateGet(this, _stepBreakpointIndexes),
    builtInConverters: __privateGet(this, _builtInConverters),
    extensionConverters: this.extensionConverters,
    replayExtensions: this.replayExtensions,
    extensionDescriptor: this.viewDescriptor,
    recordingFinished: __privateMethod(this, _RecorderController_instances, onRecordingFinished_fn).bind(this),
    addAssertion: __privateMethod(this, _RecorderController_instances, handleAddAssertionEvent_fn).bind(this),
    abortReplay: __privateMethod(this, _RecorderController_instances, onAbortReplay_fn).bind(this),
    playRecording: __privateMethod(this, _RecorderController_instances, onPlayRecording_fn).bind(this),
    networkConditionsChanged: __privateMethod(this, _RecorderController_instances, onNetworkConditionsChanged_fn).bind(this),
    timeoutChanged: __privateMethod(this, _RecorderController_instances, onTimeoutChanged_fn).bind(this),
    titleChanged: __privateMethod(this, _RecorderController_instances, handleRecordingTitleChanged_fn).bind(this)
  })}
          @requestselectorattribute=${(event) => {
    event.send(this.currentRecording?.flow.selectorAttribute);
  }}
          @stepchanged=${__privateMethod(this, _RecorderController_instances, handleRecordingChanged_fn).bind(this)}
          @addstep=${__privateMethod(this, _RecorderController_instances, handleStepAdded_fn).bind(this)}
          @removestep=${__privateMethod(this, _RecorderController_instances, handleStepRemoved_fn).bind(this)}
          @addbreakpoint=${__privateGet(this, _onAddBreakpoint).bind(this)}
          @removebreakpoint=${__privateGet(this, _onRemoveBreakpoint).bind(this)}
          @recorderextensionviewclosed=${__privateMethod(this, _RecorderController_instances, onExtensionViewClosed_fn).bind(this)}
          ${UI.Widget.widgetRef(Components.RecordingView.RecordingView, (widget) => {
    __privateSet(this, _recordingView, widget);
  })}
        ></devtools-widget>
    `;
};
renderCreateRecordingPage_fn = function() {
  return html`
      <devtools-widget
        class="recording-view"
        .widgetConfig=${UI.Widget.widgetConfig(Components.CreateRecordingView.CreateRecordingView, {
    recorderSettings: __privateGet(this, _recorderSettings),
    onRecordingStarted: __privateMethod(this, _RecorderController_instances, onRecordingStarted_fn).bind(this),
    onRecordingCancelled: this.onRecordingCancelled.bind(this)
  })}
        ${UI.Widget.widgetRef(
    Components.CreateRecordingView.CreateRecordingView,
    (widget) => {
      __privateSet(this, _createRecordingView, widget);
    }
  )}
      ></devtools-widget>
    `;
};
_getExportMenuButton = new WeakMap();
onExportRecording_fn = function(event) {
  event.stopPropagation();
  __privateMethod(this, _RecorderController_instances, clearError_fn).call(this);
  this.exportMenuExpanded = !this.exportMenuExpanded;
};
onExportMenuClosed_fn = function() {
  this.exportMenuExpanded = false;
};
__decorateClass([
  state()
], RecorderController.prototype, "currentRecordingSession", 2);
__decorateClass([
  state()
], RecorderController.prototype, "currentRecording", 2);
__decorateClass([
  state()
], RecorderController.prototype, "currentStep", 2);
__decorateClass([
  state()
], RecorderController.prototype, "recordingError", 2);
__decorateClass([
  state()
], RecorderController.prototype, "isRecording", 2);
__decorateClass([
  state()
], RecorderController.prototype, "isToggling", 2);
__decorateClass([
  state()
], RecorderController.prototype, "recordingPlayer", 2);
__decorateClass([
  state()
], RecorderController.prototype, "lastReplayResult", 2);
__decorateClass([
  state()
], RecorderController.prototype, "currentPage", 2);
__decorateClass([
  state()
], RecorderController.prototype, "previousPage", 2);
__decorateClass([
  state()
], RecorderController.prototype, "sections", 2);
__decorateClass([
  state()
], RecorderController.prototype, "settings", 2);
__decorateClass([
  state()
], RecorderController.prototype, "importError", 2);
__decorateClass([
  state()
], RecorderController.prototype, "exportMenuExpanded", 2);
__decorateClass([
  state()
], RecorderController.prototype, "extensionConverters", 2);
__decorateClass([
  state()
], RecorderController.prototype, "replayExtensions", 2);
__decorateClass([
  state()
], RecorderController.prototype, "viewDescriptor", 2);
RecorderController = __decorateClass([
  customElement("devtools-recorder-controller")
], RecorderController);
//# sourceMappingURL=RecorderController.js.map
