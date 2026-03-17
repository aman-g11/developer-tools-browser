var h=Object.defineProperty;var b=(i,t)=>{for(var e in t)h(i,e,{get:t[e],enumerable:!0})};function C(){return!!localStorage.getItem("debugAiCodeCompletionEnabled")}function u(...i){C()&&console.log(...i)}function v(i){i?localStorage.setItem("debugAiCodeCompletionEnabled","true"):localStorage.removeItem("debugAiCodeCompletionEnabled")}globalThis.setDebugAiCodeCompletionEnabled=v;var f={};b(f,{AiCodeCompletion:()=>p,ContextFlavor:()=>m,consoleAdditionalContextFileContent:()=>g});import*as n from"./../../core/host/host.js";import*as r from"./../../core/root/root.js";var g=`/**
 * This file describes the execution environment of the Chrome DevTools Console.
 * The code is JavaScript, but with special global functions and variables.
 * Top-level await is available.
 * The console has direct access to the inspected page's \`window\` and \`document\`.
 */

/**
 * @description Returns the value of the most recently evaluated expression.
 */
let $_;

/**
 * @description A reference to the most recently selected DOM element.
 * $0, $1, $2, $3, $4 can be used to reference the last five selected DOM elements.
 */
let $0;

/**
 * @description A query selector alias. $$('.my-class') is equivalent to document.querySelectorAll('.my-class').
 */
function $$(selector, startNode) {}

/**
 * @description An XPath selector. $x('//p') returns an array of all <p> elements.
 */
function $x(path, startNode) {}

function clear() {}

function copy(object) {}

/**
 * @description Selects and reveals the specified element in the Elements panel.
 */
function inspect(object) {}

function keys(object) {}

function values(object) {}

/**
 * @description When the specified function is called, the debugger is invoked.
 */
function debug(func) {}

/**
 * @description Stops the debugging of the specified function.
 */
function undebug(func) {}

/**
 * @description Logs a message to the console whenever the specified function is called,
 * along with the arguments passed to it.
 */
function monitor(func) {}

/**
 * @description Stops monitoring the specified function.
 */
function unmonitor(func) {}

/**
 * @description Logs all events dispatched to the specified object to the console.
 */
function monitorEvents(object, events) {}

/**
 * @description Returns an object containing all event listeners registered on the specified object.
 */
function getEventListeners(object) {}

/**
 * The global \`console\` object has several helpful methods
 */
const console = {
  log: (...args) => {},
  warn: (...args) => {},
  error: (...args) => {},
  info: (...args) => {},
  debug: (...args) => {},
  assert: (assertion, ...args) => {},
  dir: (object) => {}, // Displays an interactive property listing of an object.
  dirxml: (object) => {}, // Displays an XML/HTML representation of an object.
  table: (data, columns) => {}, // Displays tabular data as a table.
  group: (label) => {}, // Creates a new inline collapsible group.
  groupEnd: () => {},
  time: (label) => {}, // Starts a timer.
  timeEnd: (label) => {} // Stops a timer and logs the elapsed time.
};`,p=class{#i;#o;#e;#s;#n;#l=crypto.randomUUID();#t;#r;constructor(t,e,o,s){this.#t=t.aidaClient,this.#r=t.serverSideLoggingEnabled??!1,this.#s=e,this.#i=s??[],this.#n=o}#c(t,e,o=n.AidaClient.AidaInferenceLanguage.JAVASCRIPT,s){let d=n.AidaClient.convertToUserTierEnum(this.#u);function a(c){return typeof c=="number"&&c>=0?c:void 0}t=`
`+t;let l=s;return l||(l=this.#s==="console"?[{path:"devtools-console-context.js",content:g,included_reason:n.AidaClient.Reason.RELATED_FILE}]:void 0),{client:n.AidaClient.CLIENT_NAME,prefix:t,suffix:e,options:{inference_language:o,temperature:a(this.#a.temperature),model_id:this.#a.modelId||void 0,stop_sequences:this.#i},metadata:{disable_user_content_logging:!(this.#r??!1),string_session_id:this.#l,user_tier:d,client_version:r.Runtime.getChromeVersion()},additional_files:l}}async#d(t){let e=this.#p(t);if(e)return{response:e,fromCache:!0};let o=await this.#t.completeCode(t);return o?(this.#g(t,o),{response:o,fromCache:!1}):{response:null,fromCache:!1}}get#u(){return r.Runtime.hostConfig.devToolsAiCodeCompletion?.userTier}get#a(){let t=r.Runtime.hostConfig.devToolsAiCodeCompletion?.temperature,e=r.Runtime.hostConfig.devToolsAiCodeCompletion?.modelId;return{temperature:t,modelId:e}}#p(t){if(!this.#e||this.#e.request.suffix!==t.suffix||JSON.stringify(this.#e.request.options)!==JSON.stringify(t.options))return null;let e=[];for(let o of this.#e.response.generatedSamples){let s=this.#e.request.prefix+o.generationString;s.startsWith(t.prefix)&&e.push({generationString:s.substring(t.prefix.length),sampleId:o.sampleId,score:o.score,attributionMetadata:o.attributionMetadata})}return e.length===0?null:{generatedSamples:e,metadata:this.#e.response.metadata}}#g(t,e){this.#e={request:t,response:e}}registerUserImpression(t,e,o){let s=Math.floor(e/1e3),d=e%1e3,a=Math.floor(d*1e6);this.#t.registerClientEvent({corresponding_aida_rpc_global_id:t,disable_user_content_logging:!0,complete_code_client_event:{user_impression:{sample:{sample_id:o},latency:{duration:{seconds:s,nanos:a}}}}}),u("Registered user impression with latency {seconds:",s,", nanos:",a,"}"),n.userMetrics.actionTaken(n.UserMetrics.Action.AiCodeCompletionSuggestionDisplayed)}registerUserAcceptance(t,e){this.#t.registerClientEvent({corresponding_aida_rpc_global_id:t,disable_user_content_logging:!0,complete_code_client_event:{user_acceptance:{sample:{sample_id:e}}}}),u("Registered user acceptance"),n.userMetrics.actionTaken(n.UserMetrics.Action.AiCodeCompletionSuggestionAccepted)}clearCachedRequest(){this.#e=void 0}async completeCode(t,e,o,s,d){let a=this.#c(t,e,s,d),{response:l,fromCache:c}=await this.#d(a);return u("At cursor position",o,{request:a,response:l,fromCache:c}),l?{response:l,fromCache:c}:{response:null,fromCache:!1}}remove(){this.#o&&(clearTimeout(this.#o),this.#o=void 0),this.#n?.setAiAutoCompletion(null)}static isAiCodeCompletionEnabled(t){if(!t.startsWith("en-"))return!1;let e=r.Runtime.hostConfig.aidaAvailability;return!e||e.blockedByGeo||e.blockedByAge||e.blockedByEnterprisePolicy?!1:!!(e.enabled&&r.Runtime.hostConfig.devToolsAiCodeCompletion?.enabled)}static isAiCodeCompletionStylesEnabled(t){if(!t.startsWith("en-"))return!1;let e=r.Runtime.hostConfig.aidaAvailability;return!e||e.blockedByGeo||e.blockedByAge||e.blockedByEnterprisePolicy?!1:!!(e.enabled&&r.Runtime.hostConfig.devToolsAiCodeCompletionStyles?.enabled)}},m=(i=>(i.CONSOLE="console",i.SOURCES="sources",i.STYLES="styles",i))(m||{});export{f as AiCodeCompletion,u as debugLog,C as isDebugMode};
//# sourceMappingURL=ai_code_completion.js.map
