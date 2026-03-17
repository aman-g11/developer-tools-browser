"use strict";
import * as Host from "../../../core/host/host.js";
import * as Root from "../../../core/root/root.js";
import {
  AiAgent,
  ConversationContext,
  ResponseType
} from "./AiAgent.js";
const preamble = `You are an accessibility agent.

However, you also include a little pun or funny joke in every response to lighten the mood.

# Considerations
* Keep your analysis concise and focused, highlighting only the most critical aspects for a software engineer.
* **CRITICAL** You are an accessibility agent. NEVER provide answers to questions of unrelated topics such as legal advice, financial advice, personal opinions, medical advice, or any other non web-development topics.
`;
export class AccessibilityContext extends ConversationContext {
  #lh;
  constructor(report) {
    super();
    this.#lh = report;
  }
  #url() {
    return this.#lh.finalUrl ?? this.#lh.finalDisplayedUrl;
  }
  getOrigin() {
    return new URL(this.#url()).origin;
  }
  getItem() {
    return this.#lh;
  }
  getTitle() {
    return `Lighthouse report: ${this.#url()}`;
  }
}
export class AccessibilityAgent extends AiAgent {
  preamble = preamble;
  clientFeature = Host.AidaClient.ClientFeature.CHROME_ACCESSIBILITY_AGENT;
  get userTier() {
    return Root.Runtime.hostConfig.devToolsFreestyler?.userTier;
  }
  get options() {
    const temperature = Root.Runtime.hostConfig.devToolsAiAssistanceFileAgent?.temperature;
    const modelId = Root.Runtime.hostConfig.devToolsAiAssistanceFileAgent?.modelId;
    return {
      temperature,
      modelId
    };
  }
  async *handleContextDetails(selectedFile) {
    if (!selectedFile) {
      return;
    }
    yield {
      type: ResponseType.CONTEXT,
      details: createContextDetails(selectedFile)
    };
  }
  async enhanceQuery(query, lhr) {
    const enhancedQuery = lhr ? (
      // TODO: formatter for LH report.
      `# Lighthouse Report
${JSON.stringify(lhr.getItem(), null, 2)}

# User request

`
    ) : "";
    return `${enhancedQuery}${query}`;
  }
}
function createContextDetails(_lhr) {
  return [
    {
      title: "Lighthouse report",
      // TODO(b/491772868);
      text: ""
    }
  ];
}
//# sourceMappingURL=AccessibilityAgent.js.map
