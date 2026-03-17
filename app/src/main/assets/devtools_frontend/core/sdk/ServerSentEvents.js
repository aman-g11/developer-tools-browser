"use strict";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import { Events } from "./NetworkRequest.js";
import { ServerSentEventsParser } from "./ServerSentEventsProtocol.js";
export class ServerSentEvents {
  #request;
  #parser;
  // In the case where we parse the events ourselves we use the time of the last 'dataReceived'
  // event for all the events that come out of the corresponding chunk of data.
  #lastDataReceivedTime = 0;
  #eventSourceMessages = [];
  constructor(request, parseFromStreamedData) {
    this.#request = request;
    if (parseFromStreamedData) {
      this.#lastDataReceivedTime = request.pseudoWallTime(request.startTime);
      this.#parser = new ServerSentEventsParser(this.#onParserEvent.bind(this), request.charset() ?? void 0);
      void this.#request.requestStreamingContent().then((streamingContentData) => {
        if (!TextUtils.StreamingContentData.isError(streamingContentData)) {
          void this.#parser?.addBase64Chunk(streamingContentData.content().base64);
          streamingContentData.addEventListener(
            TextUtils.StreamingContentData.Events.CHUNK_ADDED,
            ({ data: { chunk } }) => {
              this.#lastDataReceivedTime = request.pseudoWallTime(request.endTime);
              void this.#parser?.addBase64Chunk(chunk);
            }
          );
        }
      });
    }
  }
  get eventSourceMessages() {
    return this.#eventSourceMessages;
  }
  /** Forwarded Network.eventSourceMessage received */
  onProtocolEventSourceMessageReceived(eventName, data, eventId, time) {
    this.#recordMessageAndDispatchEvent({
      eventName,
      eventId,
      data,
      time
    });
  }
  #onParserEvent(eventName, data, eventId) {
    this.#recordMessageAndDispatchEvent({
      eventName,
      eventId,
      data,
      time: this.#lastDataReceivedTime
    });
  }
  #recordMessageAndDispatchEvent(message) {
    this.#eventSourceMessages.push(message);
    this.#request.dispatchEventToListeners(Events.EVENT_SOURCE_MESSAGE_ADDED, message);
  }
}
//# sourceMappingURL=ServerSentEvents.js.map
