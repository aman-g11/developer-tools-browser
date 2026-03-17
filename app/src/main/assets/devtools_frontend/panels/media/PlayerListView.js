"use strict";
import "../../ui/kit/kit.js";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as UI from "../../ui/legacy/legacy.js";
import { Directives, html, render } from "../../ui/lit/lit.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import playerListViewStyles from "./playerListView.css.js";
import { PlayerPropertyKeys } from "./PlayerPropertiesView.js";
const { classMap } = Directives;
const UIStrings = {
  /**
   * @description A right-click context menu entry which when clicked causes the menu entry for that player to be removed.
   */
  hidePlayer: "Hide player",
  /**
   * @description A right-click context menu entry which should keep the element selected, while hiding all other entries.
   */
  hideAllOthers: "Hide all others",
  /**
   * @description Context menu entry which downloads the json dump when clicked
   */
  savePlayerInfo: "Save player info",
  /**
   * @description Side-panel entry title text for the players section.
   */
  players: "Players"
};
const str_ = i18n.i18n.registerUIStrings("panels/media/PlayerListView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const DEFAULT_VIEW = (input, _output, target) => {
  render(
    html`
      <style>${playerListViewStyles}</style>
      <div class="player-entry-header" id="players-header">${i18nString(UIStrings.players)}</div>
      <div role="listbox" aria-labelledby="players-header">
      ${input.players.map((player) => {
      const isSelected = player.playerID === input.selectedPlayerID;
      return html`
          <div class=${classMap({
        "player-entry-row": true,
        hbox: true,
        selected: isSelected,
        "force-white-icons": isSelected
      })}
               tabindex="0"
               @click=${() => input.onPlayerClick(player.playerID)}
               @keydown=${(e) => {
        if (Platform.KeyboardUtilities.isEnterOrSpaceKey(e)) {
          e.preventDefault();
          input.onPlayerClick(player.playerID);
        }
      }}
               @contextmenu=${(e) => input.onPlayerContextMenu(player.playerID, e)}
               role="option"
               aria-selected=${isSelected}
               jslog=${VisualLogging.item("player").track({ click: true, resize: true })}>
            <div class="player-entry-status-icon vbox">
              <div class="player-entry-status-icon-centering">
                <devtools-icon name=${player.iconName}></devtools-icon>
              </div>
            </div>
            <div class="player-entry-frame-title">${player.frameTitle}</div>
            <div class="player-entry-player-title">${player.playerTitle}</div>
          </div>
        `;
    })}
      </div>
    `,
    target
  );
};
export class PlayerListView extends UI.Widget.VBox {
  #view;
  playerStatuses;
  playerEntriesWithHostnameFrameTitle;
  mainContainer;
  currentlySelectedPlayerID;
  constructor(mainContainer, view = DEFAULT_VIEW) {
    super({ useShadowDom: true });
    this.#view = view;
    this.playerStatuses = /* @__PURE__ */ new Map();
    this.playerEntriesWithHostnameFrameTitle = /* @__PURE__ */ new Set();
    this.mainContainer = mainContainer;
    this.currentlySelectedPlayerID = null;
    this.requestUpdate();
  }
  performUpdate() {
    const input = {
      players: Array.from(this.playerStatuses.values()),
      selectedPlayerID: this.currentlySelectedPlayerID,
      onPlayerClick: this.selectPlayer.bind(this),
      onPlayerContextMenu: this.rightClickPlayer.bind(this)
    };
    this.#view(input, {}, this.contentElement);
  }
  selectPlayerById(playerID) {
    if (this.playerStatuses.has(playerID)) {
      this.selectPlayer(playerID);
    }
  }
  selectPlayer(playerID) {
    this.mainContainer.renderMainPanel(playerID);
    this.currentlySelectedPlayerID = playerID;
    this.requestUpdate();
  }
  rightClickPlayer(playerID, event) {
    const contextMenu = new UI.ContextMenu.ContextMenu(event);
    contextMenu.headerSection().appendItem(
      i18nString(UIStrings.hidePlayer),
      this.mainContainer.markPlayerForDeletion.bind(this.mainContainer, playerID),
      { jslogContext: "hide-player" }
    );
    contextMenu.headerSection().appendItem(
      i18nString(UIStrings.hideAllOthers),
      this.mainContainer.markOtherPlayersForDeletion.bind(this.mainContainer, playerID),
      { jslogContext: "hide-all-others" }
    );
    contextMenu.headerSection().appendItem(
      i18nString(UIStrings.savePlayerInfo),
      this.mainContainer.exportPlayerData.bind(this.mainContainer, playerID),
      { jslogContext: "save-player-info" }
    );
    void contextMenu.show();
  }
  setMediaElementFrameTitle(playerID, frameTitle, isHostname) {
    if (this.playerEntriesWithHostnameFrameTitle.has(playerID)) {
      if (!isHostname) {
        this.playerEntriesWithHostnameFrameTitle.delete(playerID);
      }
    } else if (isHostname) {
      return;
    }
    if (!this.playerStatuses.has(playerID)) {
      return;
    }
    const playerStatus = this.playerStatuses.get(playerID);
    if (playerStatus) {
      playerStatus.frameTitle = frameTitle;
      this.requestUpdate();
    }
  }
  setMediaElementPlayerTitle(playerID, playerTitle) {
    if (!this.playerStatuses.has(playerID)) {
      return;
    }
    const playerStatus = this.playerStatuses.get(playerID);
    if (playerStatus) {
      playerStatus.playerTitle = playerTitle;
      this.requestUpdate();
    }
  }
  setMediaElementPlayerIcon(playerID, iconName) {
    if (!this.playerStatuses.has(playerID)) {
      return;
    }
    const playerStatus = this.playerStatuses.get(playerID);
    if (playerStatus) {
      playerStatus.iconName = iconName;
      this.requestUpdate();
    }
  }
  formatAndEvaluate(playerID, func, candidate, min, max) {
    if (candidate.length <= min) {
      return;
    }
    if (candidate.length >= max) {
      candidate = candidate.substring(0, max - 1) + "\u2026";
    }
    func.bind(this)(playerID, candidate);
  }
  addMediaElementItem(playerID) {
    this.playerStatuses.set(playerID, {
      playerTitle: "PlayerTitle",
      frameTitle: "FrameTitle",
      playerID,
      exists: true,
      playing: false,
      titleEdited: false,
      iconName: "pause"
    });
    this.playerEntriesWithHostnameFrameTitle.add(playerID);
    this.requestUpdate();
  }
  deletePlayer(playerID) {
    if (!this.playerStatuses.has(playerID)) {
      return;
    }
    this.playerStatuses.delete(playerID);
    this.requestUpdate();
  }
  onEvent(playerID, event) {
    const parsed = JSON.parse(event.value);
    const eventType = parsed.event;
    if (eventType === "kLoad") {
      const url = parsed.url;
      const videoName = url.substring(url.lastIndexOf("/") + 1);
      this.formatAndEvaluate(playerID, this.setMediaElementPlayerTitle, videoName, 1, 20);
      return;
    }
    if (eventType === "kPlay") {
      this.setMediaElementPlayerIcon(playerID, "play");
      return;
    }
    if (eventType === "kPause" || eventType === "kEnded") {
      this.setMediaElementPlayerIcon(playerID, "pause");
      return;
    }
    if (eventType === "kWebMediaPlayerDestroyed") {
      this.setMediaElementPlayerIcon(playerID, "cross");
      return;
    }
  }
  onProperty(playerID, property) {
    if (property.name === PlayerPropertyKeys.FRAME_URL) {
      const frameTitle = new URL(property.value).hostname;
      this.formatAndEvaluate(playerID, this.setMediaElementFrameTitle, frameTitle, 1, 20);
      return;
    }
    if (property.name === PlayerPropertyKeys.FRAME_TITLE && property.value) {
      this.formatAndEvaluate(playerID, this.setMediaElementFrameTitle, property.value, 1, 20);
      return;
    }
  }
  onError(_playerID, _error) {
  }
  onMessage(_playerID, _message) {
  }
}
//# sourceMappingURL=PlayerListView.js.map
