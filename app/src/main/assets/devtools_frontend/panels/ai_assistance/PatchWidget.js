"use strict";
import "../../ui/legacy/legacy.js";
import "../../ui/components/markdown_view/markdown_view.js";
import "../../ui/components/spinners/spinners.js";
import "../../ui/kit/kit.js";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as Root from "../../core/root/root.js";
import * as AiAssistanceModel from "../../models/ai_assistance/ai_assistance.js";
import * as GreenDev from "../../models/greendev/greendev.js";
import * as Persistence from "../../models/persistence/persistence.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as WorkspaceDiff from "../../models/workspace_diff/workspace_diff.js";
import * as Buttons from "../../ui/components/buttons/buttons.js";
import * as UI from "../../ui/legacy/legacy.js";
import { Directives, html, nothing, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as ChangesPanel from "../changes/changes.js";
import * as PanelCommon from "../common/common.js";
import { SelectWorkspaceDialog } from "./SelectWorkspaceDialog.js";
const UIStringsNotTranslate = {
  /**
   * @description Text displayed for showing patch widget view.
   */
  unsavedChanges: "Unsaved changes",
  /**
   * @description Loading text displayed as a summary title when the patch suggestion is getting loaded
   */
  applyingToWorkspace: "Applying to workspace\u2026",
  /**
   * @description Button text for staging changes to workspace.
   */
  applyToWorkspace: "Apply to workspace",
  /**
   * @description Button text to change the selected workspace
   */
  change: "Change",
  /**
   * @description Accessible title of the Change button to indicate that
   * the button can be used to change the root folder.
   */
  changeRootFolder: "Change project root folder",
  /**
   * @description Button text to cancel applying to workspace
   */
  cancel: "Cancel",
  /**
   * @description Button text to discard the suggested changes and not save them to file system
   */
  discard: "Discard",
  /**
   * @description Button text to save all the suggested changes to file system
   */
  saveAll: "Save all",
  /**
   * @description Header text after the user saved the changes to the disk.
   */
  savedToDisk: "Saved to disk",
  /**
   * @description Disclaimer text shown for using code snippets with caution
   */
  codeDisclaimer: "Use code snippets with caution",
  /**
   * @description Tooltip text for the info icon beside the "Apply to workspace" button
   */
  applyToWorkspaceTooltip: "Source code from the selected folder is sent to Google to generate code suggestions.",
  /**
   * @description Tooltip text for the info icon beside the "Apply to workspace" button when enterprise logging is off
   */
  applyToWorkspaceTooltipNoLogging: "Source code from the selected folder is sent to Google to generate code suggestions. This data will not be used to improve Google\u2019s AI models.",
  /**
   * @description The footer disclaimer that links to more information
   * about the AI feature. Same text as in ChatView.
   */
  learnMore: "Learn more",
  /**
   * @description Header text for the AI-powered code suggestions disclaimer dialog.
   */
  freDisclaimerHeader: "Apply changes directly to your project\u2019s source code",
  /**
   * @description First disclaimer item text for the fre dialog.
   */
  freDisclaimerTextAiWontAlwaysGetItRight: "This feature uses AI and won\u2019t always get it right",
  /**
   * @description Second disclaimer item text for the fre dialog.
   */
  freDisclaimerTextPrivacy: "To generate code suggestions, source code from the selected folder is sent to Google. This data may be seen by human reviewers to improve this feature.",
  /**
   * @description Second disclaimer item text for the fre dialog when enterprise logging is off.
   */
  freDisclaimerTextPrivacyNoLogging: "To generate code suggestions, source code from the selected folder is sent to Google. This data will not be used to improve Google\u2019s AI models. Your organization may change these settings at any time.",
  /**
   * @description Third disclaimer item text for the fre dialog.
   */
  freDisclaimerTextUseWithCaution: "Use generated code snippets with caution",
  /**
   * @description Title of the link opening data that was used to
   * produce a code suggestion.
   */
  viewUploadedFiles: "View data sent to Google",
  /**
   * @description Text indicating that a link opens in a new tab (for a11y).
   */
  opensInNewTab: "(opens in a new tab)",
  /**
   * @description Generic error text for the case the changes were not applied to the workspace.
   */
  genericErrorMessage: "Changes couldn\u2019t be applied to your workspace."
};
const lockedString = i18n.i18n.lockedString;
const CODE_SNIPPET_WARNING_URL = "https://support.google.com/legal/answer/13505487";
const { widget } = UI.Widget;
export var PatchSuggestionState = /* @__PURE__ */ ((PatchSuggestionState2) => {
  PatchSuggestionState2["INITIAL"] = "initial";
  PatchSuggestionState2["LOADING"] = "loading";
  PatchSuggestionState2["SUCCESS"] = "success";
  PatchSuggestionState2["ERROR"] = "error";
  return PatchSuggestionState2;
})(PatchSuggestionState || {});
var SelectedProjectType = /* @__PURE__ */ ((SelectedProjectType2) => {
  SelectedProjectType2["NONE"] = "none";
  SelectedProjectType2["REGULAR"] = "regular";
  SelectedProjectType2["AUTOMATIC_DISCONNECTED"] = "automaticDisconnected";
  SelectedProjectType2["AUTOMATIC_CONNECTED"] = "automaticConnected";
  return SelectedProjectType2;
})(SelectedProjectType || {});
const DEFAULT_VIEW = (input, output, target) => {
  if (!input.changeSummary && input.patchSuggestionState === "initial" /* INITIAL */) {
    return;
  }
  output.changeRef = output.changeRef ?? Directives.createRef();
  output.summaryRef = output.summaryRef ?? Directives.createRef();
  function renderSourcesLink() {
    if (!input.sources) {
      return nothing;
    }
    return html`<devtools-link
          class="link"
          title="${UIStringsNotTranslate.viewUploadedFiles} ${UIStringsNotTranslate.opensInNewTab}"
          href="data:text/plain;charset=utf-8,${encodeURIComponent(input.sources)}"
          jslogcontext="files-used-in-patching">
          ${UIStringsNotTranslate.viewUploadedFiles}
        </devtools-link>`;
  }
  function renderHeader() {
    if (input.savedToDisk) {
      return html`
            <devtools-icon class="green-bright-icon summary-badge" name="check-circle"></devtools-icon>
            <span class="header-text">
              ${lockedString(UIStringsNotTranslate.savedToDisk)}
            </span>
          `;
    }
    if (input.patchSuggestionState === "success" /* SUCCESS */) {
      return html`
            <devtools-icon class="on-tonal-icon summary-badge" name="difference"></devtools-icon>
            <span class="header-text">
              ${lockedString(`File changes in ${input.projectName}`)}
            </span>
            <devtools-icon
              class="arrow"
              name="chevron-down"
            ></devtools-icon>
          `;
    }
    return html`
          <devtools-icon class="on-tonal-icon summary-badge" name="pen-spark"></devtools-icon>
          <span class="header-text">
            ${lockedString(UIStringsNotTranslate.unsavedChanges)}
          </span>
          <devtools-icon
            class="arrow"
            name="chevron-down"
          ></devtools-icon>
        `;
  }
  function renderContent() {
    if (!input.changeSummary && input.patchSuggestionState === "initial" /* INITIAL */ || input.savedToDisk) {
      return nothing;
    }
    if (input.patchSuggestionState === "success" /* SUCCESS */) {
      return html`${widget(ChangesPanel.CombinedDiffView.CombinedDiffView, {
        workspaceDiff: input.workspaceDiff,
        // Ignore user creates inspector-stylesheets
        ignoredUrls: ["inspector://"]
      })}`;
    }
    return html`<devtools-code-block
          .code=${input.changeSummary ?? ""}
          .codeLang=${"css"}
          .displayNotice=${true}
        ></devtools-code-block>
        ${input.patchSuggestionState === "error" /* ERROR */ ? html`<div class="error-container">
              <devtools-icon name="cross-circle-filled"></devtools-icon>${lockedString(UIStringsNotTranslate.genericErrorMessage)} ${renderSourcesLink()}
            </div>` : nothing}`;
  }
  function renderCopyPrompt(changedCode) {
    if (!GreenDev.Prototypes.instance().isEnabled("copyToGemini") || !changedCode) {
      return nothing;
    }
    return html`<devtools-widget class="copy-to-prompt"
      ${widget(PanelCommon.CopyChangesToPrompt, {
      workspaceDiff: input.workspaceDiff,
      patchAgentCSSChange: changedCode
    })}></devtools-widget>`;
  }
  function renderFooter() {
    if (input.savedToDisk) {
      return nothing;
    }
    if (input.patchSuggestionState === "success" /* SUCCESS */) {
      return html`
          <div class="footer">
            <div class="left-side">
              <devtools-link class="link disclaimer-link" href="https://support.google.com/legal/answer/13505487" jslogcontext="code-disclaimer">
                ${lockedString(UIStringsNotTranslate.codeDisclaimer)}
              </devtools-link>
              ${renderSourcesLink()}
            </div>
            <div class="save-or-discard-buttons">
              <devtools-button
                @click=${input.onDiscard}
                .jslogContext=${"patch-widget.discard"}
                .variant=${Buttons.Button.Variant.OUTLINED}>
                  ${lockedString(UIStringsNotTranslate.discard)}
              </devtools-button>
              <devtools-button
                @click=${input.onSaveAll}
                .jslogContext=${"patch-widget.save-all"}
                .variant=${Buttons.Button.Variant.PRIMARY}>
                  ${lockedString(UIStringsNotTranslate.saveAll)}
              </devtools-button>
            </div>
          </div>
          `;
    }
    const iconName = input.projectType === "automaticDisconnected" /* AUTOMATIC_DISCONNECTED */ ? "folder-off" : input.projectType === "automaticConnected" /* AUTOMATIC_CONNECTED */ ? "folder-asterisk" : "folder";
    return html`
        <div class="footer">
          ${input.projectName ? html`
            <div class="change-workspace" jslog=${VisualLogging.section("patch-widget.workspace")}>
                <devtools-icon .name=${iconName}></devtools-icon>
                <span class="folder-name" title=${input.projectPath}>${input.projectName}</span>
              ${input.onChangeWorkspaceClick ? html`
                <devtools-button
                  @click=${input.onChangeWorkspaceClick}
                  .jslogContext=${"change-workspace"}
                  .variant=${Buttons.Button.Variant.TEXT}
                  .title=${lockedString(UIStringsNotTranslate.changeRootFolder)}
                  .disabled=${input.patchSuggestionState === "loading" /* LOADING */}
                  ${Directives.ref(output.changeRef)}
                >${lockedString(UIStringsNotTranslate.change)}</devtools-button>
              ` : nothing}
            </div>
          ` : nothing}
          <div class="apply-to-workspace-container" aria-live="polite">
            ${input.patchSuggestionState === "loading" /* LOADING */ ? html`
              <div class="loading-text-container" jslog=${VisualLogging.section("patch-widget.apply-to-workspace-loading")}>
                <devtools-spinner></devtools-spinner>
                <span>
                  ${lockedString(UIStringsNotTranslate.applyingToWorkspace)}
                </span>
              </div>
            ` : html`
               ${renderCopyPrompt(input.changeSummary)}
                <devtools-button
                @click=${input.onApplyToWorkspace}
                .jslogContext=${"patch-widget.apply-to-workspace"}
                .variant=${Buttons.Button.Variant.OUTLINED}>
                ${lockedString(UIStringsNotTranslate.applyToWorkspace)}
              </devtools-button>
            `}
            ${input.patchSuggestionState === "loading" /* LOADING */ ? html`<devtools-button
              @click=${input.onCancel}
              .jslogContext=${"cancel"}
              .variant=${Buttons.Button.Variant.OUTLINED}>
              ${lockedString(UIStringsNotTranslate.cancel)}
            </devtools-button>` : nothing}
            <devtools-button
              aria-details="info-tooltip"
              .jslogContext=${"patch-widget.info-tooltip-trigger"}
              .iconName=${"info"}
              .variant=${Buttons.Button.Variant.ICON}
            ></devtools-button>
            <devtools-tooltip
                id="info-tooltip"
                variant="rich"
              >
             <div class="info-tooltip-container">
               ${input.applyToWorkspaceTooltipText}
               <button
                 class="link tooltip-link"
                 role="link"
                 jslog=${VisualLogging.link("open-ai-settings").track({
      click: true
    })}
                 @click=${input.onLearnMoreTooltipClick}
               >${lockedString(UIStringsNotTranslate.learnMore)}</button>
             </div>
            </devtools-tooltip>
          </div>
        </div>`;
  }
  const template = input.savedToDisk ? html`
          <div class="change-summary saved-to-disk" role="status" aria-live="polite">
            <div class="header-container">
             ${renderHeader()}
             </div>
          </div>` : html`
          <details class="change-summary" jslog=${VisualLogging.section("patch-widget")}>
            <summary class="header-container" ${Directives.ref(output.summaryRef)}>
              ${renderHeader()}
            </summary>
            ${renderContent()}
            ${renderFooter()}
          </details>
        `;
  render(template, target);
};
export class PatchWidget extends UI.Widget.Widget {
  changeSummary = "";
  changeManager;
  // Whether the user completed first run experience dialog or not.
  #aiPatchingFreCompletedSetting = Common.Settings.Settings.instance().createSetting("ai-assistance-patching-fre-completed", false);
  #projectIdSetting = Common.Settings.Settings.instance().createSetting("ai-assistance-patching-selected-project-id", "");
  #view;
  #viewOutput = {};
  #aidaClient;
  #applyPatchAbortController;
  #project;
  #patchSources;
  #savedToDisk;
  #noLogging;
  // Whether the enterprise setting is `ALLOW_WITHOUT_LOGGING` or not.
  #patchSuggestionState = "initial" /* INITIAL */;
  #workspaceDiff = WorkspaceDiff.WorkspaceDiff.workspaceDiff();
  #workspace = Workspace.Workspace.WorkspaceImpl.instance();
  #automaticFileSystem = Persistence.AutomaticFileSystemManager.AutomaticFileSystemManager.instance().automaticFileSystem;
  #applyToDisconnectedAutomaticWorkspace = false;
  // `rpcId` from the `applyPatch` request
  #rpcId = null;
  constructor(element, view = DEFAULT_VIEW, opts) {
    super(element);
    this.#aidaClient = opts?.aidaClient ?? new Host.AidaClient.AidaClient();
    this.#noLogging = Root.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue === Root.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING;
    this.#view = view;
    this.requestUpdate();
  }
  #onLearnMoreTooltipClick() {
    void UI.ViewManager.ViewManager.instance().showView("chrome-ai");
  }
  #getDisplayedProject() {
    if (this.#project) {
      return {
        projectName: Common.ParsedURL.ParsedURL.encodedPathToRawPathString(
          this.#project.displayName()
        ),
        projectPath: Common.ParsedURL.ParsedURL.urlToRawPathString(
          this.#project.id(),
          Host.Platform.isWin()
        )
      };
    }
    if (this.#automaticFileSystem) {
      return {
        projectName: Common.ParsedURL.ParsedURL.extractName(this.#automaticFileSystem.root),
        projectPath: this.#automaticFileSystem.root
      };
    }
    return {
      projectName: "",
      projectPath: Platform.DevToolsPath.EmptyRawPathString
    };
  }
  #shouldShowChangeButton() {
    const automaticFileSystemProject = this.#automaticFileSystem ? this.#workspace.projectForFileSystemRoot(this.#automaticFileSystem.root) : null;
    const regularProjects = this.#workspace.projectsForType(Workspace.Workspace.projectTypes.FileSystem).filter(
      (project) => project instanceof Persistence.FileSystemWorkspaceBinding.FileSystem && project.fileSystem().type() === Persistence.PlatformFileSystem.PlatformFileSystemType.WORKSPACE_PROJECT
    ).filter((project) => project !== automaticFileSystemProject);
    return regularProjects.length > 0;
  }
  #getSelectedProjectType(projectPath) {
    if (this.#automaticFileSystem && this.#automaticFileSystem.root === projectPath) {
      return this.#project ? "automaticConnected" /* AUTOMATIC_CONNECTED */ : "automaticDisconnected" /* AUTOMATIC_DISCONNECTED */;
    }
    return this.#project ? "none" /* NONE */ : "regular" /* REGULAR */;
  }
  performUpdate() {
    const { projectName, projectPath } = this.#getDisplayedProject();
    this.#view(
      {
        workspaceDiff: this.#workspaceDiff,
        changeSummary: this.changeSummary,
        patchSuggestionState: this.#patchSuggestionState,
        sources: this.#patchSources,
        projectName,
        projectPath,
        projectType: this.#getSelectedProjectType(projectPath),
        savedToDisk: this.#savedToDisk,
        applyToWorkspaceTooltipText: this.#noLogging ? lockedString(UIStringsNotTranslate.applyToWorkspaceTooltipNoLogging) : lockedString(UIStringsNotTranslate.applyToWorkspaceTooltip),
        onLearnMoreTooltipClick: this.#onLearnMoreTooltipClick.bind(this),
        onApplyToWorkspace: this.#onApplyToWorkspace.bind(this),
        onCancel: () => {
          this.#applyPatchAbortController?.abort();
        },
        onDiscard: this.#onDiscard.bind(this),
        onSaveAll: this.#onSaveAll.bind(this),
        onChangeWorkspaceClick: this.#shouldShowChangeButton() ? this.#showSelectWorkspaceDialog.bind(this, { applyPatch: false }) : void 0
      },
      this.#viewOutput,
      this.contentElement
    );
  }
  wasShown() {
    super.wasShown();
    this.#selectDefaultProject();
    if (isAiAssistancePatchingEnabled()) {
      this.#workspace.addEventListener(Workspace.Workspace.Events.ProjectAdded, this.#onProjectAdded, this);
      this.#workspace.addEventListener(Workspace.Workspace.Events.ProjectRemoved, this.#onProjectRemoved, this);
    }
  }
  willHide() {
    super.willHide();
    this.#applyToDisconnectedAutomaticWorkspace = false;
    if (isAiAssistancePatchingEnabled()) {
      this.#workspace.removeEventListener(Workspace.Workspace.Events.ProjectAdded, this.#onProjectAdded, this);
      this.#workspace.removeEventListener(Workspace.Workspace.Events.ProjectRemoved, this.#onProjectRemoved, this);
    }
  }
  async #showFreDisclaimerIfNeeded() {
    const isAiPatchingFreCompleted = this.#aiPatchingFreCompletedSetting.get();
    if (isAiPatchingFreCompleted) {
      return true;
    }
    const iconName = AiAssistanceModel.AiUtils.getIconName();
    const result = await PanelCommon.FreDialog.show({
      header: { iconName, text: lockedString(UIStringsNotTranslate.freDisclaimerHeader) },
      reminderItems: [
        {
          iconName: "psychiatry",
          content: lockedString(UIStringsNotTranslate.freDisclaimerTextAiWontAlwaysGetItRight)
        },
        {
          iconName: "google",
          content: this.#noLogging ? lockedString(UIStringsNotTranslate.freDisclaimerTextPrivacyNoLogging) : lockedString(UIStringsNotTranslate.freDisclaimerTextPrivacy)
        },
        {
          iconName: "warning",
          // clang-format off
          content: html`<devtools-link
            href=${CODE_SNIPPET_WARNING_URL}
            class="link devtools-link"
            jslogcontext="code-snippets-explainer.patch-widget"
          >${lockedString(UIStringsNotTranslate.freDisclaimerTextUseWithCaution)}</devtools-link>`
          // clang-format on
        }
      ],
      onLearnMoreClick: () => {
        void UI.ViewManager.ViewManager.instance().showView("chrome-ai");
      },
      ariaLabel: lockedString(UIStringsNotTranslate.freDisclaimerHeader),
      learnMoreButtonText: lockedString(UIStringsNotTranslate.learnMore)
    });
    if (result) {
      this.#aiPatchingFreCompletedSetting.set(true);
    }
    return result;
  }
  #selectDefaultProject() {
    const project = this.#automaticFileSystem ? this.#workspace.projectForFileSystemRoot(this.#automaticFileSystem.root) : this.#workspace.project(this.#projectIdSetting.get());
    if (project) {
      this.#project = project;
    } else {
      this.#project = void 0;
      this.#projectIdSetting.set("");
    }
    this.requestUpdate();
  }
  #onProjectAdded(event) {
    const addedProject = event.data;
    if (this.#applyToDisconnectedAutomaticWorkspace && this.#automaticFileSystem && addedProject === this.#workspace.projectForFileSystemRoot(this.#automaticFileSystem.root)) {
      this.#applyToDisconnectedAutomaticWorkspace = false;
      this.#project = addedProject;
      void this.#applyPatchAndUpdateUI();
    } else if (this.#project === void 0) {
      this.#selectDefaultProject();
    }
  }
  #onProjectRemoved() {
    if (this.#project && !this.#workspace.project(this.#project.id())) {
      this.#projectIdSetting.set("");
      this.#project = void 0;
      this.requestUpdate();
    }
  }
  #showSelectWorkspaceDialog(options = { applyPatch: false }) {
    const onProjectSelected = (project) => {
      this.#project = project;
      this.#projectIdSetting.set(project.id());
      if (options.applyPatch) {
        void this.#applyPatchAndUpdateUI();
      } else {
        this.requestUpdate();
        void this.updateComplete.then(() => {
          this.contentElement?.querySelector(".apply-to-workspace-container devtools-button")?.shadowRoot?.querySelector("button")?.focus();
        });
      }
    };
    SelectWorkspaceDialog.show(onProjectSelected, this.#project);
  }
  async #onApplyToWorkspace() {
    if (!isAiAssistancePatchingEnabled()) {
      return;
    }
    const freDisclaimerCompleted = await this.#showFreDisclaimerIfNeeded();
    if (!freDisclaimerCompleted) {
      return;
    }
    if (this.#project) {
      await this.#applyPatchAndUpdateUI();
    } else if (this.#automaticFileSystem) {
      this.#applyToDisconnectedAutomaticWorkspace = true;
      await Persistence.AutomaticFileSystemManager.AutomaticFileSystemManager.instance().connectAutomaticFileSystem(
        /* addIfMissing= */
        true
      );
    } else {
      this.#showSelectWorkspaceDialog({ applyPatch: true });
    }
  }
  /**
   * The modified files excluding inspector stylesheets
   */
  get #modifiedFiles() {
    return this.#workspaceDiff.modifiedUISourceCodes().filter((modifiedUISourceCode) => {
      return !modifiedUISourceCode.url().startsWith("inspector://");
    });
  }
  async #applyPatchAndUpdateUI() {
    const changeSummary = this.changeSummary;
    if (!changeSummary) {
      throw new Error("Change summary does not exist");
    }
    this.#patchSuggestionState = "loading" /* LOADING */;
    this.#rpcId = null;
    this.requestUpdate();
    const { response, processedFiles } = await this.#applyPatch(changeSummary);
    if (response && "rpcId" in response && response.rpcId) {
      this.#rpcId = response.rpcId;
    }
    const hasChanges = this.#modifiedFiles.length > 0;
    if (response?.type === AiAssistanceModel.AiAgent.ResponseType.ANSWER && hasChanges) {
      this.#patchSuggestionState = "success" /* SUCCESS */;
    } else if (response?.type === AiAssistanceModel.AiAgent.ResponseType.ERROR && response.error === AiAssistanceModel.AiAgent.ErrorType.ABORT) {
      this.#patchSuggestionState = "initial" /* INITIAL */;
    } else {
      this.#patchSuggestionState = "error" /* ERROR */;
    }
    this.#patchSources = `Filenames in ${this.#project?.displayName()}.
Files:
${processedFiles.map((filename) => `* ${filename}`).join("\n")}`;
    this.requestUpdate();
    if (this.#patchSuggestionState === "success" /* SUCCESS */) {
      void this.updateComplete.then(() => {
        this.#viewOutput.summaryRef?.value?.focus();
      });
    }
  }
  #onDiscard() {
    for (const modifiedUISourceCode of this.#modifiedFiles) {
      modifiedUISourceCode.resetWorkingCopy();
    }
    this.#patchSuggestionState = "initial" /* INITIAL */;
    this.#patchSources = void 0;
    void this.changeManager?.popStashedChanges();
    this.#submitRating(Host.AidaClient.Rating.NEGATIVE);
    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.#viewOutput.changeRef?.value?.focus();
    });
  }
  #onSaveAll() {
    for (const modifiedUISourceCode of this.#modifiedFiles) {
      modifiedUISourceCode.commitWorkingCopy();
    }
    void this.changeManager?.stashChanges().then(() => {
      this.changeManager?.dropStashedChanges();
    });
    this.#savedToDisk = true;
    this.#submitRating(Host.AidaClient.Rating.POSITIVE);
    this.requestUpdate();
  }
  #submitRating(rating) {
    if (!this.#rpcId) {
      return;
    }
    void this.#aidaClient.registerClientEvent({
      corresponding_aida_rpc_global_id: this.#rpcId,
      disable_user_content_logging: true,
      do_conversation_client_event: {
        user_feedback: {
          sentiment: rating
        }
      }
    });
  }
  async #applyPatch(changeSummary) {
    if (!this.#project) {
      throw new Error("Project does not exist");
    }
    this.#applyPatchAbortController = new AbortController();
    const agent = new AiAssistanceModel.PatchAgent.PatchAgent({
      aidaClient: this.#aidaClient,
      serverSideLoggingEnabled: false,
      project: this.#project
    });
    const { responses, processedFiles } = await agent.applyChanges(changeSummary, { signal: this.#applyPatchAbortController.signal });
    return {
      response: responses.at(-1),
      processedFiles
    };
  }
}
export function isAiAssistancePatchingEnabled() {
  return Boolean(Root.Runtime.hostConfig.devToolsFreestyler?.patching);
}
window.aiAssistanceTestPatchPrompt = async (projectName, changeSummary, expectedChanges) => {
  if (!isAiAssistancePatchingEnabled()) {
    return;
  }
  const workspaceDiff = WorkspaceDiff.WorkspaceDiff.workspaceDiff();
  const workspace = Workspace.Workspace.WorkspaceImpl.instance();
  const project = workspace.projectsForType(Workspace.Workspace.projectTypes.FileSystem).filter(
    (project2) => project2 instanceof Persistence.FileSystemWorkspaceBinding.FileSystem && project2.fileSystem().type() === Persistence.PlatformFileSystem.PlatformFileSystemType.WORKSPACE_PROJECT
  ).find((project2) => project2.displayName() === projectName);
  if (!project) {
    throw new Error("project not found");
  }
  const aidaClient = new Host.AidaClient.AidaClient();
  const agent = new AiAssistanceModel.PatchAgent.PatchAgent({
    aidaClient,
    serverSideLoggingEnabled: false,
    project
  });
  try {
    const assertionFailures = [];
    const { processedFiles, responses } = await agent.applyChanges(changeSummary);
    if (responses.at(-1)?.type === AiAssistanceModel.AiAgent.ResponseType.ERROR) {
      return {
        error: "failed to patch",
        debugInfo: {
          responses,
          processedFiles
        }
      };
    }
    for (const file of processedFiles) {
      const change = expectedChanges.find((change2) => change2.path === file);
      if (!change) {
        assertionFailures.push(`Patched ${file} that was not expected`);
        break;
      }
      const agentProject = agent.agentProject;
      const content = await agentProject.readFile(file);
      if (!content) {
        throw new Error(`${file} has no content`);
      }
      for (const m of change.matches) {
        if (!content.match(new RegExp(m, "gm"))) {
          assertionFailures.push({
            message: `Did not match ${m} in ${file}`,
            file,
            content
          });
        }
      }
      for (const m of change.doesNotMatch || []) {
        if (content.match(new RegExp(m, "gm"))) {
          assertionFailures.push({
            message: `Unexpectedly matched ${m} in ${file}`,
            file,
            content
          });
        }
      }
    }
    return {
      assertionFailures,
      debugInfo: {
        responses,
        processedFiles
      }
    };
  } finally {
    workspaceDiff.modifiedUISourceCodes().forEach((modifiedUISourceCode) => {
      modifiedUISourceCode.resetWorkingCopy();
    });
  }
};
//# sourceMappingURL=PatchWidget.js.map
