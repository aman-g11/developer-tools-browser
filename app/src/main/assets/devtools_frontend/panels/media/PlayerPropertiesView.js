"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as Platform from "../../core/platform/platform.js";
import * as SourceFrame from "../../ui/legacy/components/source_frame/source_frame.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import playerPropertiesViewStyles from "./playerPropertiesView.css.js";
const UIStrings = {
  /**
   * @description The type of media, for example - video, audio, or text. Capitalized.
   */
  video: "Video",
  /**
   * @description The type of media, for example - video, audio, or text. Capitalized.
   */
  audio: "Audio",
  /**
   * @description A video or audio stream - but capitalized.
   */
  track: "Track",
  /**
   * @description A device that converts media files into playable streams of audio or video.
   */
  decoder: "Decoder",
  /**
   * @description Title of the 'Properties' tool in the sidebar of the elements tool
   */
  properties: "Properties",
  /**
   * @description Menu label for text tracks, it is followed by a number, like 'Text Track #1'
   */
  textTrack: "Text track",
  /**
   * @description Placeholder text stating that there are no text tracks on this player. A text track
   * is all of the text that accompanies a particular video.
   */
  noTextTracks: "No text tracks",
  /**
   * @description Media property giving the width x height of the video
   */
  resolution: "Resolution",
  /**
   * @description Media property giving the file size of the media
   */
  fileSize: "File size",
  /**
   * @description Media property giving the media file bitrate
   */
  bitrate: "Bitrate",
  /**
   * @description Text for the duration of something
   */
  duration: "Duration",
  /**
   * @description The label for a timestamp when a video was started.
   */
  startTime: "Start time",
  /**
   * @description Media property signaling whether the media is streaming
   */
  streaming: "Streaming",
  /**
   * @description Media property describing where the media is playing from.
   */
  playbackFrameUrl: "Playback frame URL",
  /**
   * @description Media property giving the title of the frame where the media is embedded
   */
  playbackFrameTitle: "Playback frame title",
  /**
   * @description Media property describing whether the file is single or cross origin in nature
   */
  singleoriginPlayback: "Single-origin playback",
  /**
   * @description Media property describing support for range http headers
   */
  rangeHeaderSupport: "`Range` header support",
  /**
   * @description Media property giving the media file frame rate
   */
  frameRate: "Frame rate",
  /**
   * @description Media property giving the distance of the playback quality from the ideal playback.
   * Roughness is the opposite to smoothness, i.e. whether each frame of the video was played at the
   * right time so that the video looks smooth when it plays.
   */
  videoPlaybackRoughness: "Video playback roughness",
  /**
   * @description A score describing how choppy the video playback is.
   */
  videoFreezingScore: "Video freezing score",
  /**
   * @description Media property giving the name of the renderer being used
   */
  rendererName: "Renderer name",
  /**
   * @description Media property giving the name of the decoder being used
   */
  decoderName: "Decoder name",
  /**
   * @description There is no decoder
   */
  noDecoder: "No decoder",
  /**
   * @description Media property signaling whether a hardware decoder is being used
   */
  hardwareDecoder: "Hardware decoder",
  /**
   * @description Media property signaling whether the content is encrypted. This is a noun phrase for
   *a demultiplexer that does decryption.
   */
  decryptingDemuxer: "Decrypting demuxer",
  /**
   * @description Media property giving the name of the video encoder being used.
   */
  encoderName: "Encoder name",
  /**
   * @description There is no encoder.
   */
  noEncoder: "No encoder",
  /**
   * @description Media property signaling whether the encoder is hardware accelerated.
   */
  hardwareEncoder: "Hardware encoder",
  /**
   * @description Property for adaptive (HLS) playback which shows the start/end time of the loaded content buffer
   */
  hlsBufferedRanges: "Buffered media ranges"
};
const str_ = i18n.i18n.registerUIStrings("panels/media/PlayerPropertiesView.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
export var PlayerPropertyKeys = /* @__PURE__ */ ((PlayerPropertyKeys2) => {
  PlayerPropertyKeys2["RESOLUTION"] = "kResolution";
  PlayerPropertyKeys2["TOTAL_BYTES"] = "kTotalBytes";
  PlayerPropertyKeys2["BITRATE"] = "kBitrate";
  PlayerPropertyKeys2["MAX_DURATION"] = "kMaxDuration";
  PlayerPropertyKeys2["START_TIME"] = "kStartTime";
  PlayerPropertyKeys2["IS_CDM_ATTACHED"] = "kIsCdmAttached";
  PlayerPropertyKeys2["IS_STREAMING"] = "kIsStreaming";
  PlayerPropertyKeys2["FRAME_URL"] = "kFrameUrl";
  PlayerPropertyKeys2["FRAME_TITLE"] = "kFrameTitle";
  PlayerPropertyKeys2["IS_SINGLE_ORIGIN"] = "kIsSingleOrigin";
  PlayerPropertyKeys2["IS_RANGE_HEADER_SUPPORTED"] = "kIsRangeHeaderSupported";
  PlayerPropertyKeys2["RENDERER_NAME"] = "kRendererName";
  PlayerPropertyKeys2["VIDEO_DECODER_NAME"] = "kVideoDecoderName";
  PlayerPropertyKeys2["AUDIO_DECODER_NAME"] = "kAudioDecoderName";
  PlayerPropertyKeys2["IS_PLATFORM_VIDEO_DECODER"] = "kIsPlatformVideoDecoder";
  PlayerPropertyKeys2["IS_PLATFORM_AUDIO_DECODER"] = "kIsPlatformAudioDecoder";
  PlayerPropertyKeys2["VIDEO_ENCODER_NAME"] = "kVideoEncoderName";
  PlayerPropertyKeys2["IS_PLATFORM_VIDEO_ENCODER"] = "kIsPlatformVideoEncoder";
  PlayerPropertyKeys2["IS_VIDEO_DECRYPTION_DEMUXER_STREAM"] = "kIsVideoDecryptingDemuxerStream";
  PlayerPropertyKeys2["IS_AUDIO_DECRYPTING_DEMUXER_STREAM"] = "kIsAudioDecryptingDemuxerStream";
  PlayerPropertyKeys2["AUDIO_TRACKS"] = "kAudioTracks";
  PlayerPropertyKeys2["TEXT_TRACKS"] = "kTextTracks";
  PlayerPropertyKeys2["VIDEO_TRACKS"] = "kVideoTracks";
  PlayerPropertyKeys2["FRAMERATE"] = "kFramerate";
  PlayerPropertyKeys2["VIDEO_PLAYBACK_ROUGHNESS"] = "kVideoPlaybackRoughness";
  PlayerPropertyKeys2["VIDEO_PLAYBACK_FREEZING"] = "kVideoPlaybackFreezing";
  PlayerPropertyKeys2["HLS_BUFFERED_RANGES"] = "kHlsBufferedRanges";
  return PlayerPropertyKeys2;
})(PlayerPropertyKeys || {});
export class PropertyRenderer extends UI.Widget.VBox {
  contents;
  value;
  pseudoColorProtectionElement;
  constructor(title) {
    super();
    this.contentElement.classList.add("media-property-renderer");
    const titleElement = this.contentElement.createChild("span", "media-property-renderer-title");
    this.contents = this.contentElement.createChild("div", "media-property-renderer-contents");
    UI.UIUtils.createTextChild(titleElement, title);
    this.value = null;
    this.pseudoColorProtectionElement = null;
    this.contentElement.classList.add("media-property-renderer-hidden");
  }
  updateData(propvalue) {
    if (propvalue === "" || propvalue === null) {
      this.changeContents(null);
    } else if (this.value === propvalue) {
      return;
    } else {
      this.value = propvalue;
      this.updateDataInternal(propvalue);
    }
  }
  updateDataInternal(propvalue) {
    try {
      const parsed = JSON.parse(propvalue);
      this.changeContents(parsed);
    } catch {
      this.changeContents(propvalue);
    }
  }
  unsetNestedContents() {
    this.contentElement.classList.add("media-property-renderer-hidden");
    if (this.pseudoColorProtectionElement === null) {
      this.pseudoColorProtectionElement = document.createElement("div");
      this.pseudoColorProtectionElement.classList.add("media-property-renderer");
      this.pseudoColorProtectionElement.classList.add("media-property-renderer-hidden");
      this.contentElement.parentNode.insertBefore(this.pseudoColorProtectionElement, this.contentElement);
    }
  }
  changeNestedContents(value) {
    if (value === null || Object.keys(value).length === 0) {
      this.unsetNestedContents();
    } else {
      if (this.pseudoColorProtectionElement !== null) {
        this.pseudoColorProtectionElement.remove();
        this.pseudoColorProtectionElement = null;
      }
      this.contentElement.classList.remove("media-property-renderer-hidden");
      this.contents.removeChildren();
      const jsonWrapperElement = new SourceFrame.JSONView.JSONView(new SourceFrame.JSONView.ParsedJSON(value, "", ""), true);
      jsonWrapperElement.show(this.contents);
    }
  }
  changeContents(value) {
    if (value === null) {
      this.unsetNestedContents();
    } else {
      if (this.pseudoColorProtectionElement !== null) {
        this.pseudoColorProtectionElement.remove();
        this.pseudoColorProtectionElement = null;
      }
      this.contentElement.classList.remove("media-property-renderer-hidden");
      this.contents.removeChildren();
      const spanElement = document.createElement("span");
      spanElement.textContent = value;
      this.contents.appendChild(spanElement);
    }
  }
}
export class FormattedPropertyRenderer extends PropertyRenderer {
  formatfunction;
  constructor(title, formatfunction) {
    super(title);
    this.formatfunction = formatfunction;
  }
  updateDataInternal(propvalue) {
    try {
      const parsed = JSON.parse(propvalue);
      this.changeContents(this.formatfunction(parsed));
    } catch {
      const unparsed = propvalue;
      this.changeContents(this.formatfunction(unparsed));
    }
  }
}
export class DefaultPropertyRenderer extends PropertyRenderer {
  constructor(title, defaultText) {
    super(title);
    this.changeContents(defaultText);
  }
}
export class NestedPropertyRenderer extends PropertyRenderer {
  constructor(title, content) {
    super(title);
    this.changeNestedContents(content);
  }
}
export class AttributesView extends UI.Widget.VBox {
  contentHash;
  constructor(elements) {
    super();
    this.contentHash = 0;
    this.contentElement.classList.add("media-attributes-view");
    for (const element of elements) {
      element.show(this.contentElement);
      const content = this.contentElement.textContent;
      if (content !== null) {
        this.contentHash += Platform.StringUtilities.hashCode(content);
      }
    }
  }
  getContentHash() {
    return this.contentHash;
  }
}
export class TrackManager {
  type;
  view;
  constructor(propertiesView, type) {
    this.type = type;
    this.view = propertiesView;
  }
  updateData(value) {
    const tabs = this.view.getTabs(this.type);
    const newTabs = JSON.parse(value);
    let enumerate = 1;
    for (const tabData of newTabs) {
      this.addNewTab(tabs, tabData, enumerate);
      enumerate++;
    }
  }
  addNewTab(tabs, tabData, tabNumber) {
    const tabElements = [];
    for (const [name, data] of Object.entries(tabData)) {
      if (typeof data === "object") {
        tabElements.push(new NestedPropertyRenderer(i18n.i18n.lockedString(name), data));
      } else {
        tabElements.push(new DefaultPropertyRenderer(i18n.i18n.lockedString(name), data));
      }
    }
    const newTab = new AttributesView(tabElements);
    tabs.addNewTab(tabNumber, newTab);
  }
}
export class VideoTrackManager extends TrackManager {
  constructor(propertiesView) {
    super(propertiesView, "video");
  }
}
export class TextTrackManager extends TrackManager {
  constructor(propertiesView) {
    super(propertiesView, "text");
  }
}
export class AudioTrackManager extends TrackManager {
  constructor(propertiesView) {
    super(propertiesView, "audio");
  }
}
const TrackTypeLocalized = {
  Video: i18nLazyString(UIStrings.video),
  Audio: i18nLazyString(UIStrings.audio)
};
class GenericTrackMenu extends UI.TabbedPane.TabbedPane {
  decoderName;
  trackName;
  constructor(decoderName, trackName = i18nString(UIStrings.track)) {
    super();
    this.decoderName = decoderName;
    this.trackName = trackName;
  }
  addNewTab(trackNumber, element) {
    const localizedTrackLower = i18nString(UIStrings.track);
    const tabId = `track-${trackNumber}`;
    if (this.hasTab(tabId)) {
      const tabElement = this.tabView(tabId);
      if (tabElement === null) {
        return;
      }
      if (tabElement.getContentHash() === element.getContentHash()) {
        return;
      }
      this.closeTab(
        tabId,
        /* userGesture=*/
        false
      );
    }
    this.appendTab(
      tabId,
      // No need for localizing, internal ID.
      `${this.trackName} #${trackNumber}`,
      element,
      `${this.decoderName} ${localizedTrackLower} #${trackNumber}`
    );
  }
}
class DecoderTrackMenu extends GenericTrackMenu {
  constructor(decoderName, informationalElement) {
    super(decoderName);
    const decoderLocalized = i18nString(UIStrings.decoder);
    const title = `${decoderName} ${decoderLocalized}`;
    const propertiesLocalized = i18nString(UIStrings.properties);
    const hoverText = `${title} ${propertiesLocalized}`;
    this.appendTab("decoder-properties", title, informationalElement, hoverText);
  }
}
class NoTracksPlaceholderMenu extends UI.Widget.VBox {
  isPlaceholder;
  wrapping;
  constructor(wrapping, placeholderText) {
    super();
    this.isPlaceholder = true;
    this.wrapping = wrapping;
    this.wrapping.appendTab("_placeholder", placeholderText, new UI.Widget.VBox(), placeholderText);
    this.wrapping.show(this.contentElement);
  }
  addNewTab(trackNumber, element) {
    if (this.isPlaceholder) {
      this.wrapping.closeTab("_placeholder");
      this.isPlaceholder = false;
    }
    this.wrapping.addNewTab(trackNumber, element);
  }
}
export class PlayerPropertiesView extends UI.Widget.VBox {
  mediaElements;
  videoDecoderElements;
  audioDecoderElements;
  attributeMap;
  videoProperties;
  videoDecoderProperties;
  audioDecoderProperties;
  videoDecoderTabs;
  audioDecoderTabs;
  textTracksTabs;
  constructor() {
    super({ jslog: `${VisualLogging.pane("properties")}` });
    this.registerRequiredCSS(playerPropertiesViewStyles);
    this.contentElement.classList.add("media-properties-frame");
    this.mediaElements = [];
    this.videoDecoderElements = [];
    this.audioDecoderElements = [];
    this.attributeMap = /* @__PURE__ */ new Map();
    this.populateAttributesAndElements();
    this.videoProperties = new AttributesView(this.mediaElements);
    this.videoDecoderProperties = new AttributesView(this.videoDecoderElements);
    this.audioDecoderProperties = new AttributesView(this.audioDecoderElements);
    this.videoProperties.show(this.contentElement);
    this.videoDecoderTabs = new DecoderTrackMenu(TrackTypeLocalized.Video(), this.videoDecoderProperties);
    this.videoDecoderTabs.show(this.contentElement);
    this.audioDecoderTabs = new DecoderTrackMenu(TrackTypeLocalized.Audio(), this.audioDecoderProperties);
    this.audioDecoderTabs.show(this.contentElement);
    this.textTracksTabs = null;
  }
  lazyCreateTrackTabs() {
    let textTracksTabs = this.textTracksTabs;
    if (textTracksTabs === null) {
      const textTracks = new GenericTrackMenu(i18nString(UIStrings.textTrack));
      textTracksTabs = new NoTracksPlaceholderMenu(textTracks, i18nString(UIStrings.noTextTracks));
      textTracksTabs.show(this.contentElement);
      this.textTracksTabs = textTracksTabs;
    }
    return textTracksTabs;
  }
  getTabs(type) {
    if (type === "audio") {
      return this.audioDecoderTabs;
    }
    if (type === "video") {
      return this.videoDecoderTabs;
    }
    if (type === "text") {
      return this.lazyCreateTrackTabs();
    }
    throw new Error("Unreachable");
  }
  onProperty(property) {
    const renderer = this.attributeMap.get(property.name);
    if (!renderer) {
      throw new Error(`Player property "${property.name}" not supported.`);
    }
    renderer.updateData(property.value);
  }
  formatKbps(bitsPerSecond) {
    if (bitsPerSecond === "") {
      return "0 kbps";
    }
    const kbps = Math.floor(Number(bitsPerSecond) / 1e3);
    return `${kbps} kbps`;
  }
  formatTime(seconds) {
    if (seconds === "") {
      return "0:00";
    }
    const date = /* @__PURE__ */ new Date();
    date.setSeconds(Number(seconds));
    return date.toISOString().substr(11, 8);
  }
  formatFileSize(bytes) {
    if (bytes === "") {
      return "0 bytes";
    }
    const actualBytes = Number(bytes);
    if (actualBytes < 1e3) {
      return `${bytes} bytes`;
    }
    const power = Math.floor(Math.log10(actualBytes) / 3);
    const suffix = ["bytes", "kB", "MB", "GB", "TB"][power];
    const bytesDecimal = (actualBytes / Math.pow(1e3, power)).toFixed(2);
    return `${bytesDecimal} ${suffix}`;
  }
  formatBufferedRanges(ranges) {
    return ranges.map((range) => {
      return "[" + range[0] + " \u2192 " + range[1] + "]";
    }).join(", ");
  }
  populateAttributesAndElements() {
    const resolution = new PropertyRenderer(i18nString(UIStrings.resolution));
    this.mediaElements.push(resolution);
    this.attributeMap.set("kResolution" /* RESOLUTION */, resolution);
    const fileSize = new FormattedPropertyRenderer(i18nString(UIStrings.fileSize), this.formatFileSize);
    this.mediaElements.push(fileSize);
    this.attributeMap.set("kTotalBytes" /* TOTAL_BYTES */, fileSize);
    const bitrate = new FormattedPropertyRenderer(i18nString(UIStrings.bitrate), this.formatKbps);
    this.mediaElements.push(bitrate);
    this.attributeMap.set("kBitrate" /* BITRATE */, bitrate);
    const duration = new FormattedPropertyRenderer(i18nString(UIStrings.duration), this.formatTime);
    this.mediaElements.push(duration);
    this.attributeMap.set("kMaxDuration" /* MAX_DURATION */, duration);
    const startTime = new PropertyRenderer(i18nString(UIStrings.startTime));
    this.mediaElements.push(startTime);
    this.attributeMap.set("kStartTime" /* START_TIME */, startTime);
    const streaming = new PropertyRenderer(i18nString(UIStrings.streaming));
    this.mediaElements.push(streaming);
    this.attributeMap.set("kIsStreaming" /* IS_STREAMING */, streaming);
    const frameUrl = new PropertyRenderer(i18nString(UIStrings.playbackFrameUrl));
    this.mediaElements.push(frameUrl);
    this.attributeMap.set("kFrameUrl" /* FRAME_URL */, frameUrl);
    const frameTitle = new PropertyRenderer(i18nString(UIStrings.playbackFrameTitle));
    this.mediaElements.push(frameTitle);
    this.attributeMap.set("kFrameTitle" /* FRAME_TITLE */, frameTitle);
    const singleOrigin = new PropertyRenderer(i18nString(UIStrings.singleoriginPlayback));
    this.mediaElements.push(singleOrigin);
    this.attributeMap.set("kIsSingleOrigin" /* IS_SINGLE_ORIGIN */, singleOrigin);
    const rangeHeaders = new PropertyRenderer(i18nString(UIStrings.rangeHeaderSupport));
    this.mediaElements.push(rangeHeaders);
    this.attributeMap.set("kIsRangeHeaderSupported" /* IS_RANGE_HEADER_SUPPORTED */, rangeHeaders);
    const frameRate = new PropertyRenderer(i18nString(UIStrings.frameRate));
    this.mediaElements.push(frameRate);
    this.attributeMap.set("kFramerate" /* FRAMERATE */, frameRate);
    const roughness = new PropertyRenderer(i18nString(UIStrings.videoPlaybackRoughness));
    this.mediaElements.push(roughness);
    this.attributeMap.set("kVideoPlaybackRoughness" /* VIDEO_PLAYBACK_ROUGHNESS */, roughness);
    const freezingScore = new PropertyRenderer(i18nString(UIStrings.videoFreezingScore));
    this.mediaElements.push(freezingScore);
    this.attributeMap.set("kVideoPlaybackFreezing" /* VIDEO_PLAYBACK_FREEZING */, freezingScore);
    const rendererName = new PropertyRenderer(i18nString(UIStrings.rendererName));
    this.mediaElements.push(rendererName);
    this.attributeMap.set("kRendererName" /* RENDERER_NAME */, rendererName);
    const hlsBufferedRanges = new FormattedPropertyRenderer(i18nString(UIStrings.hlsBufferedRanges), this.formatBufferedRanges);
    this.mediaElements.push(hlsBufferedRanges);
    this.attributeMap.set("kHlsBufferedRanges" /* HLS_BUFFERED_RANGES */, hlsBufferedRanges);
    const decoderName = new DefaultPropertyRenderer(i18nString(UIStrings.decoderName), i18nString(UIStrings.noDecoder));
    this.videoDecoderElements.push(decoderName);
    this.attributeMap.set("kVideoDecoderName" /* VIDEO_DECODER_NAME */, decoderName);
    const videoPlatformDecoder = new PropertyRenderer(i18nString(UIStrings.hardwareDecoder));
    this.videoDecoderElements.push(videoPlatformDecoder);
    this.attributeMap.set("kIsPlatformVideoDecoder" /* IS_PLATFORM_VIDEO_DECODER */, videoPlatformDecoder);
    const encoderName = new DefaultPropertyRenderer(i18nString(UIStrings.encoderName), i18nString(UIStrings.noEncoder));
    this.videoDecoderElements.push(encoderName);
    this.attributeMap.set("kVideoEncoderName" /* VIDEO_ENCODER_NAME */, encoderName);
    const videoPlatformEncoder = new PropertyRenderer(i18nString(UIStrings.hardwareEncoder));
    this.videoDecoderElements.push(videoPlatformEncoder);
    this.attributeMap.set("kIsPlatformVideoEncoder" /* IS_PLATFORM_VIDEO_ENCODER */, videoPlatformEncoder);
    const videoDDS = new PropertyRenderer(i18nString(UIStrings.decryptingDemuxer));
    this.videoDecoderElements.push(videoDDS);
    this.attributeMap.set("kIsVideoDecryptingDemuxerStream" /* IS_VIDEO_DECRYPTION_DEMUXER_STREAM */, videoDDS);
    const videoTrackManager = new VideoTrackManager(this);
    this.attributeMap.set("kVideoTracks" /* VIDEO_TRACKS */, videoTrackManager);
    const audioDecoder = new DefaultPropertyRenderer(i18nString(UIStrings.decoderName), i18nString(UIStrings.noDecoder));
    this.audioDecoderElements.push(audioDecoder);
    this.attributeMap.set("kAudioDecoderName" /* AUDIO_DECODER_NAME */, audioDecoder);
    const audioPlatformDecoder = new PropertyRenderer(i18nString(UIStrings.hardwareDecoder));
    this.audioDecoderElements.push(audioPlatformDecoder);
    this.attributeMap.set("kIsPlatformAudioDecoder" /* IS_PLATFORM_AUDIO_DECODER */, audioPlatformDecoder);
    const audioDDS = new PropertyRenderer(i18nString(UIStrings.decryptingDemuxer));
    this.audioDecoderElements.push(audioDDS);
    this.attributeMap.set("kIsAudioDecryptingDemuxerStream" /* IS_AUDIO_DECRYPTING_DEMUXER_STREAM */, audioDDS);
    const audioTrackManager = new AudioTrackManager(this);
    this.attributeMap.set("kAudioTracks" /* AUDIO_TRACKS */, audioTrackManager);
    const textTrackManager = new TextTrackManager(this);
    this.attributeMap.set("kTextTracks" /* TEXT_TRACKS */, textTrackManager);
  }
}
//# sourceMappingURL=PlayerPropertiesView.js.map
