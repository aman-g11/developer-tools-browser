import"./../../ui/components/spinners/spinners.js";import"./../../ui/kit/kit.js";import*as C from"./../../core/common/common.js";import*as n from"./../../core/host/host.js";import*as H from"./../../core/i18n/i18n.js";import*as b from"./../../core/root/root.js";import*as z from"./../../third_party/marked/marked.js";import*as u from"./../../ui/components/buttons/buttons.js";import*as O from"./../../ui/components/input/input.js";import*as B from"./../../ui/components/markdown_view/markdown_view.js";import*as x from"./../../ui/legacy/legacy.js";import*as h from"./../../ui/lit/lit.js";import*as m from"./../../ui/visual_logging/visual_logging.js";import*as A from"./../console/console.js";var E=`@scope to (devtools-widget > *){*{padding:0;margin:0;box-sizing:border-box}:scope{font-family:var(--default-font-family);font-size:inherit;display:block}.wrapper{background-color:var(--sys-color-cdt-base-container);border-radius:16px;container-type:inline-size;display:grid;animation:expand var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized) forwards}.wrapper.closing{animation:collapse var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized) forwards}@keyframes expand{from{grid-template-rows:0fr}to{grid-template-rows:1fr}}@keyframes collapse{from{grid-template-rows:1fr}to{grid-template-rows:0fr;padding-top:0;padding-bottom:0}}.animation-wrapper{overflow:hidden;padding:var(--sys-size-6) var(--sys-size-8)}.wrapper.top{border-radius:16px 16px 4px 4px}.wrapper.bottom{margin-top:5px;border-radius:4px 4px 16px 16px}header{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-on-surface);font-size:13px;font-style:normal;font-weight:500;margin-bottom:var(--sys-size-6);align-items:center}header:focus-visible{outline:none}header > .filler{display:flex;flex-direction:row;gap:var(--sys-size-5);align-items:center;flex:1}.reminder-container{border-radius:var(--sys-size-5);background-color:var(--sys-color-surface4);padding:var(--sys-size-8);font-weight:var(--ref-typeface-weight-medium);h3{font:inherit}}.reminder-items{display:grid;grid-template-columns:var(--sys-size-8) auto;gap:var(--sys-size-5) var(--sys-size-6);margin-top:var(--sys-size-6);line-height:var(--sys-size-8);font-weight:var(--ref-typeface-weight-regular)}main{--override-markdown-view-message-color:var(--sys-color-on-surface);color:var(--sys-color-on-surface);font-size:12px;font-style:normal;font-weight:400;line-height:20px;p{margin-block:1em}ul{list-style-type:none;list-style-position:inside;padding-inline-start:0.2em;li{display:list-item;list-style-type:disc;list-style-position:outside;margin-inline-start:1em}li::marker{font-size:11px;line-height:1}}label{display:inline-flex;flex-direction:row;gap:0.5em;input,
      span{vertical-align:middle}input[type="checkbox"]{margin-top:0.3em}}}.opt-in-teaser{display:flex;gap:var(--sys-size-5)}devtools-markdown-view{margin-bottom:12px}footer{display:flex;flex-direction:row;align-items:center;color:var(--sys-color-on-surface);font-style:normal;font-weight:400;line-height:normal;margin-top:14px;gap:32px}@container (max-width: 600px){footer{gap:8px}}footer > .filler{flex:1}footer .rating{display:flex;flex-direction:row;gap:8px}textarea{height:84px;padding:10px;border-radius:8px;border:1px solid var(--sys-color-neutral-outline);width:100%;font-family:var(--default-font-family);font-size:inherit}.buttons{display:flex;gap:5px}@media (width <= 500px){.buttons{flex-wrap:wrap}}main .buttons{margin-top:12px}.disclaimer{display:flex;gap:2px;color:var(--sys-color-on-surface-subtle);font-size:11px;align-items:flex-start;flex-direction:column}.link{color:var(--sys-color-primary);text-decoration-line:underline;devtools-icon{color:var(--sys-color-primary);width:14px;height:14px}}button.link{border:none;background:none;cursor:pointer;font:inherit}.loader{background:linear-gradient(130deg,transparent 0%,var(--sys-color-gradient-tertiary) 20%,var(--sys-color-gradient-primary) 40%,transparent 60%,var(--sys-color-gradient-tertiary) 80%,var(--sys-color-gradient-primary) 100%);background-position:0% 0%;background-size:250% 250%;animation:gradient 5s infinite linear}@keyframes gradient{0%{background-position:0 0}100%{background-position:100% 100%}}summary{font-size:12px;font-style:normal;font-weight:400;line-height:20px}details{overflow:hidden;margin-top:10px}::details-content{height:0;transition:height var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized),content-visibility var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized) allow-discrete}[open]::details-content{height:auto}details.references{transition:margin-bottom var(--sys-motion-duration-short4) var(--sys-motion-easing-emphasized)}details.references[open]{margin-bottom:var(--sys-size-1)}h2{display:block;font-size:var(--sys-size-7);margin:0;font-weight:var(--ref-typeface-weight-medium);line-height:var(--sys-size-9)}h2:focus-visible{outline:none}.info{width:20px;height:20px}.badge{background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));border-radius:var(--sys-size-3);height:var(--sys-size-9);devtools-icon{margin:var(--sys-size-2)}}.header-icon-container{background:linear-gradient(135deg,var(--sys-color-gradient-primary),var(--sys-color-gradient-tertiary));border-radius:var(--sys-size-4);height:36px;width:36px;display:flex;align-items:center;justify-content:center}.close-button{align-self:flex-start}.sources-list{padding-left:var(--sys-size-6);margin-bottom:var(--sys-size-6);list-style:none;counter-reset:sources;display:grid;grid-template-columns:var(--sys-size-9) auto;list-style-position:inside}.sources-list li{display:contents}.sources-list li::before{counter-increment:sources;content:"[" counter(sources) "]";display:table-cell}.sources-list devtools-link.highlighted{animation:highlight-fadeout 2s}@keyframes highlight-fadeout{from{background-color:var(--sys-color-yellow-container)}to{background-color:transparent}}.references-list{padding-left:var(--sys-size-8)}.references-list li{padding-left:var(--sys-size-3)}details h3{font-size:10px;font-weight:var(--ref-typeface-weight-medium);text-transform:uppercase;color:var(--sys-color-on-surface-subtle);padding-left:var(--sys-size-6)}.error-message{font:var(--sys-typescale-body4-bold)}@scope (.insight-sources){:root{padding:0;margin:0;box-sizing:border-box;display:block}ul{color:var(--sys-color-primary);font-size:12px;font-style:normal;font-weight:400;line-height:18px;margin-top:8px;padding-left:var(--sys-size-6)}li{list-style-type:none}ul .link{color:var(--sys-color-primary);display:inline-flex!important;align-items:center;gap:4px;text-decoration-line:underline}devtools-icon{height:16px;width:16px;margin-right:var(--sys-size-1)}devtools-icon[name="open-externally"]{color:var(--icon-link)}.source-disclaimer{color:var(--sys-color-on-surface-subtle)}}}
/*# sourceURL=${import.meta.resolve("././components/consoleInsight.css")} */`;var l={consoleMessage:"Console message",stackTrace:"Stacktrace",networkRequest:"Network request",relatedCode:"Related code",generating:"Generating explanation\u2026",insight:"Explanation",closeInsight:"Close explanation",inputData:"Data used to understand this message",goodResponse:"Good response",badResponse:"Bad response",report:"Report legal issue",error:"DevTools has encountered an error",errorBody:"Something went wrong. Try again.",opensInNewTab:"(opens in a new tab)",learnMore:"Learn more",notLoggedIn:"This feature is only available when you sign into Chrome with your Google account.",signIn:"Sign in",offlineHeader:"DevTools can\u2019t reach the internet",offline:"Check your internet connection and try again.",signInToUse:"Sign in to use this feature",search:"Use search instead",reloadRecommendation:"Reload the page to capture related network request data for this message in order to create a better insight.",turnOnInSettings:"Turn on {PH1} to receive AI assistance for understanding and addressing console warnings and errors.",settingsLink:"`Console insights` in Settings",references:"Sources and related content",relatedContent:"Related content",timedOut:"Generating a response took too long. Please try again.",notAvailableInIncognitoMode:"AI assistance is not available in Incognito mode or Guest mode"},P=H.i18n.registerUIStrings("panels/explain/components/ConsoleInsight.ts",l),d=H.i18n.getLocalizedString.bind(void 0,P),j=h.i18nTemplate.bind(void 0,P),{render:q,html:c,Directives:I}=h,L=class t extends Event{static eventName="close";constructor(){super(t.eventName,{composed:!0,bubbles:!0})}};function U(t){switch(t){case A.PromptBuilder.SourceType.MESSAGE:return d(l.consoleMessage);case A.PromptBuilder.SourceType.STACKTRACE:return d(l.stackTrace);case A.PromptBuilder.SourceType.NETWORK_REQUEST:return d(l.networkRequest);case A.PromptBuilder.SourceType.RELATED_CODE:return d(l.relatedCode)}}var W="https://policies.google.com/terms",F="https://policies.google.com/privacy",Y="https://support.google.com/legal/answer/13505487",_="https://goo.gle/devtools-console-messages-ai",K="https://support.google.com/legal/troubleshooter/1114905?hl=en#ts=1115658%2C13380504",Q="https://accounts.google.com",J=(t=>(t.INSIGHT="insight",t.LOADING="loading",t.ERROR="error",t.SETTING_IS_NOT_TRUE="setting-is-not-true",t.CONSENT_REMINDER="consent-reminder",t.NOT_LOGGED_IN="not-logged-in",t.SYNC_IS_PAUSED="sync-is-paused",t.OFFLINE="offline",t))(J||{}),X={name:"citation",level:"inline",start(t){return t.match(/\[\^/)?.index},tokenizer(t){let e=t.match(/^\[\^(\d+)\]/);return e?{type:"citation",raw:e[0],linkText:Number(e[1])}:!1},renderer:()=>""};function V(t){return!!t.factualityMetadata?.facts.length}var R=t=>t.stopPropagation();function Z(t){return c`<devtools-button
    @click=${t}
    class="search-button"
    .variant=${u.Button.Variant.OUTLINED}
    .jslogContext=${"search"}
  >
    ${d(l.search)}
  </devtools-button>`}function ee(){return c`<devtools-link href=${_} class="link" jslogcontext="learn-more">
    ${d(l.learnMore)}
  </devtools-link>`}function te(t,e,i,s){return t.length?c`
    <ol class="sources-list">
      ${t.map((o,a)=>c`
        <li>
          <devtools-link
            href=${o}
            class=${I.classMap({link:!0,highlighted:a===e})}
            jslogcontext="references.console-insights"
            ${I.ref(r=>{s.citationLinks[a]=r})}
            @animationend=${i}
          >
            ${o}
          </devtools-link>
        </li>
      `)}
    </ol>
  `:h.nothing}function ie(t,e){return t.length===0?h.nothing:c`
    ${e.length?c`<h3>${d(l.relatedContent)}</h3>`:h.nothing}
    <ul class="references-list">
      ${t.map(i=>c`
        <li>
          <devtools-link
            href=${i}
            class="link"
            jslogcontext="references.console-insights"
          >
            ${i}
          </devtools-link>
        </li>
      `)}
    </ul>
  `}function ne(){return c`
    <div role="presentation" aria-label="Loading" class="loader" style="clip-path: url('#clipPath');">
      <svg width="100%" height="64">
        <clipPath id="clipPath">
          <rect x="0" y="0" width="100%" height="16" rx="8"></rect>
          <rect x="0" y="24" width="100%" height="16" rx="8"></rect>
          <rect x="0" y="48" width="100%" height="16" rx="8"></rect>
        </clipPath>
      </svg>
    </div>`}function se(t,e){return c`
    <div class="insight-sources">
      <ul>
        ${I.repeat(t,i=>i.value,i=>c`<li><devtools-link class="link" title="${U(i.type)} ${d(l.opensInNewTab)}" href="data:text/plain;charset=utf-8,${encodeURIComponent(i.value)}" .jslogContext=${"source-"+i.type}>
            <devtools-icon name="open-externally"></devtools-icon>
            ${U(i.type)}
          </devtools-link></li>`)}
        ${e?c`<li class="source-disclaimer">
          <devtools-icon name="warning"></devtools-icon>
          ${d(l.reloadRecommendation)}</li>`:h.nothing}
      </ul>
    </div>`}function oe(t,{renderer:e,disableAnimations:i,areReferenceDetailsOpen:s,highlightedCitationIndex:o,callbacks:a},r){return c`
        ${t.validMarkdown?c`<devtools-markdown-view
            .data=${{tokens:t.tokens,renderer:e,animationEnabled:!i}}>
          </devtools-markdown-view>`:t.explanation}
        ${t.timedOut?c`<p class="error-message">${d(l.timedOut)}</p>`:h.nothing}
        ${V(t.metadata)?c`
          <details
            class="references"
            ?open=${s}
            jslog=${m.expand("references").track({click:!0})}
            @toggle=${a.onToggleReferenceDetails}
            @transitionend=${a.onReferencesOpen}
          >
            <summary>${d(l.references)}</summary>
            ${te(t.directCitationUrls,o,a.onCitationAnimationEnd,r)}
            ${ie(t.relatedUrls,t.directCitationUrls)}
          </details>
        `:h.nothing}
        <details jslog=${m.expand("sources").track({click:!0})}>
          <summary>${d(l.inputData)}</summary>
          ${se(t.sources,t.isPageReloadRecommended)}
        </details>
        <div class="buttons">
          ${Z(a.onSearch)}
        </div>`}function S(t){return c`<div class="error">${t}</div>`}function re(t){return c`
    <h3>Things to consider</h3>
    <div class="reminder-items">
      <div>
        <devtools-icon name="google" class="medium">
        </devtools-icon>
      </div>
      <div>The console message, associated stack trace, related source code, and the associated network headers are sent to Google to generate explanations. ${t?"The content you submit and that is generated by this feature will not be used to improve Google\u2019s AI models.":"This data may be seen by human reviewers to improve this feature. Avoid sharing sensitive or personal information."}
      </div>
      <div>
        <devtools-icon name="policy" class="medium">
        </devtools-icon>
      </div>
      <div>Use of this feature is subject to the <devtools-link
          href=${W}
          class="link"
          jslogcontext="terms-of-service.console-insights">
        Google Terms of Service
        </devtools-link> and <devtools-link
          href=${F}
          class="link"
          jslogcontext="privacy-policy.console-insights">
        Google Privacy Policy
        </devtools-link>
      </div>
      <div>
        <devtools-icon name="warning" class="medium">
        </devtools-icon>
      </div>
      <div>
        <devtools-link
          href=${Y}
          class="link"
          jslogcontext="code-snippets-explainer.console-insights"
        >Use generated code snippets with caution</devtools-link>
      </div>
    </div>`}function ae(t){let e=c`
    <button
      class="link" role="link"
      jslog=${m.action("open-ai-settings").track({click:!0})}
      @click=${t}
    >${d(l.settingsLink)}</button>`;return c`
    <div class="badge">
      <devtools-icon name="lightbulb-spark" class="medium">
      </devtools-icon>
    </div>
    <div>
      ${j(l.turnOnInSettings,{PH1:e})} ${ee()}
    </div>`}function le(){return S(b.Runtime.hostConfig.isOffTheRecord?d(l.notAvailableInIncognitoMode):d(l.notLoggedIn))}function D(t,e){return c`<span>
    AI tools may generate inaccurate info that doesn't represent Google's views. ${t?"The content you submit and that is generated by this feature will not be used to improve Google\u2019s AI models.":"Data sent to Google may be seen by human reviewers to improve this feature."} <button class="link" role="link" @click=${e}
              jslog=${m.action("open-ai-settings").track({click:!0})}>
      Open settings
    </button> or <devtools-link href=${_}
        class="link" jslogcontext="learn-more">
      learn more
    </devtools-link>
  </span>`}function N(t,e){return c`
    <div class="disclaimer">
      ${D(t,e)}
    </div>`}function ce(t){return b.Runtime.hostConfig.isOffTheRecord?h.nothing:c`
    <div class="filler"></div>
    <div>
      <devtools-button
        @click=${t}
        .variant=${u.Button.Variant.PRIMARY}
        .jslogContext=${"update-settings"}
      >
        ${d(l.signIn)}
      </devtools-button>
    </div>`}function de(t,e){return c`
    <div class="filler"></div>
    <div class="buttons">
      <devtools-button
        @click=${t}
        .variant=${u.Button.Variant.TONAL}
        .jslogContext=${"settings"}
        .title=${"Settings"}
      >
        Settings
      </devtools-button>
      <devtools-button
        class='continue-button'
        @click=${e}
        .variant=${u.Button.Variant.PRIMARY}
        .jslogContext=${"continue"}
        .title=${"continue"}
      >
        Continue
      </devtools-button>
    </div>`}function ge(t,e,i){return c`
  <div class="disclaimer">
    ${D(t,i.onDisclaimerSettingsLink)}
  </div>
  <div class="filler"></div>
  <div class="rating">
    <devtools-button
      data-rating="true"
      .iconName=${"thumb-up"}
      .toggledIconName=${"thumb-up"}
      .variant=${u.Button.Variant.ICON_TOGGLE}
      .size=${u.Button.Size.SMALL}
      .toggleOnClick=${!1}
      .toggleType=${u.Button.ToggleType.PRIMARY}
      .disabled=${e!==void 0}
      .toggled=${e===!0}
      .title=${d(l.goodResponse)}
      .jslogContext=${"thumbs-up"}
      @click=${()=>i.onRating(!0)}
    ></devtools-button>
    <devtools-button
      data-rating="false"
      .iconName=${"thumb-down"}
      .toggledIconName=${"thumb-down"}
      .variant=${u.Button.Variant.ICON_TOGGLE}
      .size=${u.Button.Size.SMALL}
      .toggleOnClick=${!1}
      .toggleType=${u.Button.ToggleType.PRIMARY}
      .disabled=${e!==void 0}
      .toggled=${e===!1}
      .title=${d(l.badResponse)}
      .jslogContext=${"thumbs-down"}
      @click=${()=>i.onRating(!1)}
    ></devtools-button>
    <devtools-button
      .iconName=${"report"}
      .variant=${u.Button.Variant.ICON}
      .size=${u.Button.Size.SMALL}
      .title=${d(l.report)}
      .jslogContext=${"report"}
      @click=${i.onReport}
    ></devtools-button>
  </div>`}function he(){return c`
    <div class="header-icon-container">
      <devtools-icon name="lightbulb-spark" class="large">
      </devtools-icon>
    </div>`}function w({headerText:t,showIcon:e=!1,showSpinner:i=!1,onClose:s},o){return c`
    <header>
      ${e?he():h.nothing}
      <div class="filler">
        <h2 tabindex="-1" ${I.ref(o)}>
          ${t}
        </h2>
        ${i?c`<devtools-spinner></devtools-spinner>`:h.nothing}
      </div>
      <div class="close-button">
        <devtools-button
          .iconName=${"cross"}
          .variant=${u.Button.Variant.ICON}
          .size=${u.Button.Size.SMALL}
          .title=${d(l.closeInsight)}
          jslog=${m.close().track({click:!0})}
          @click=${s}
        ></devtools-button>
      </div>
    </header>
  `}var ue=(t,e,i)=>{let{state:s,noLogging:o,callbacks:a}=t,{onClose:r,onDisclaimerSettingsLink:f}=a,y=`${m.section(s.type).track({resize:!0})}`,p=h.nothing,g=h.nothing,M={},k;switch(s.type){case"loading":p=w({headerText:d(l.generating),onClose:r},e.headerRef),g=ne();break;case"insight":p=w({headerText:d(l.insight),onClose:r,showSpinner:!s.completed},e.headerRef),g=oe(s,t,e),k=ge(o,t.selectedRating,a);break;case"error":p=w({headerText:d(l.error),onClose:r},e.headerRef),g=S(d(l.errorBody)),k=N(o,f);break;case"consent-reminder":p=w({headerText:"Understand console messages with AI",onClose:r,showIcon:!0},e.headerRef),M["reminder-container"]=!0,g=re(o),k=de(a.onReminderSettingsLink,a.onConsentReminderConfirmed);break;case"setting-is-not-true":M["opt-in-teaser"]=!0,g=ae(a.onEnableInsightsInSettingsLink);break;case"not-logged-in":case"sync-is-paused":p=w({headerText:d(l.signInToUse),onClose:r},e.headerRef),g=le(),k=ce(a.onGoToSignIn);break;case"offline":p=w({headerText:d(l.offlineHeader),onClose:r},e.headerRef),g=S(d(l.offline)),k=N(o,f);break}q(c`
    <style>${E}</style>
    <style>${O.checkboxStyles}</style>
    <div
      class=${I.classMap({wrapper:!0,closing:t.closing})}
      jslog=${m.pane("console-insights").track({resize:!0})}
      @animationend=${a.onAnimationEnd}
      @keydown=${R}
      @keyup=${R}
      @keypress=${R}
      @click=${R}
    >
      <div class="animation-wrapper">
        ${p}
        <main jslog=${y} class=${I.classMap(M)}>
          ${g}
        </main>
        ${k?c`<footer jslog=${m.section("footer")}>
          ${k}
        </footer>`:h.nothing}
      </div>
    </div>
  `,i)},T=class t extends x.Widget.Widget{static async create(e,i){let s=await n.AidaClient.AidaClient.checkAccessPreconditions(),o=document.createElement("devtools-widget");return o.classList.add("devtools-console-insight"),o.widgetConfig=x.Widget.widgetConfig(a=>new t(e,i,s,a)),o}disableAnimations=!1;#f;#o;#c;#d;#e;#v=I.createRef();#y=[];#n=-1;#r=!1;#b=!1;#g=!1;#s;#t;#a;#h;#k;constructor(e,i,s,o,a=ue){super(o),this.#f=a,this.#o=e,this.#c=i,this.#a=s,this.#t=this.#A(),this.#d=new B.MarkdownView.MarkdownInsightRenderer(this.#u.bind(this)),this.#k=new z.Marked.Marked({extensions:[X]}),this.#e=this.#p(),this.#h=this.#I.bind(this),this.requestUpdate()}#u(e){if(this.#e.type!=="insight")return;let i=this.#r;this.#r=!0,this.#n=e-1,this.requestUpdate(),i&&this.#x()}#x(){let e=this.#y[this.#n];e&&(e.scrollIntoView({behavior:"auto"}),e.focus())}#p(){switch(this.#a){case n.AidaClient.AidaAccessPreconditions.AVAILABLE:{let e=C.Settings.Settings.instance().createSetting("console-insights-skip-reminder",!1,C.Settings.SettingStorageType.SESSION).get();return{type:"loading",consentOnboardingCompleted:this.#m().get()||e}}case n.AidaClient.AidaAccessPreconditions.NO_ACCOUNT_EMAIL:return{type:"not-logged-in"};case n.AidaClient.AidaAccessPreconditions.SYNC_IS_PAUSED:return{type:"sync-is-paused"};case n.AidaClient.AidaAccessPreconditions.NO_INTERNET:return{type:"offline"}}}#A(){try{return C.Settings.moduleSetting("console-insights-enabled")}catch{return}}#m(){return C.Settings.Settings.instance().createLocalSetting("console-insights-onboarding-finished",!1)}wasShown(){super.wasShown(),this.focus(),this.#t?.addChangeListener(this.#w,this);let e=b.Runtime.hostConfig.aidaAvailability?.blockedByAge===!0;this.#e.type==="loading"&&this.#t?.getIfNotDisabled()===!0&&!e&&this.#e.consentOnboardingCompleted&&n.userMetrics.actionTaken(n.UserMetrics.Action.GeneratingInsightWithoutDisclaimer),n.AidaClient.HostConfigTracker.instance().addEventListener(n.AidaClient.Events.AIDA_AVAILABILITY_CHANGED,this.#h),this.#I(),this.#e.type!=="insight"&&this.#e.type!=="error"&&(this.#e=this.#p()),this.#l()}willHide(){super.willHide(),this.#t?.removeChangeListener(this.#w,this),n.AidaClient.HostConfigTracker.instance().removeEventListener(n.AidaClient.Events.AIDA_AVAILABILITY_CHANGED,this.#h)}async#I(){let e=await n.AidaClient.AidaClient.checkAccessPreconditions();e!==this.#a&&(this.#a=e,this.#e=this.#p(),this.#l())}#w(){this.#t?.getIfNotDisabled()===!0&&this.#m().set(!0),this.#e.type==="setting-is-not-true"&&this.#t?.getIfNotDisabled()===!0&&(this.#i({type:"loading",consentOnboardingCompleted:!0}),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsOptInTeaserConfirmedInSettings),this.#l()),this.#e.type==="consent-reminder"&&this.#t?.getIfNotDisabled()===!1&&(this.#i({type:"loading",consentOnboardingCompleted:!1}),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsReminderTeaserAbortedInSettings),this.#l())}#i(e){this.#b=this.#e.type!==e.type,this.#e=e,this.requestUpdate()}async#l(){if(this.#e.type!=="loading")return;let e=b.Runtime.hostConfig.aidaAvailability?.blockedByAge===!0;if(this.#t?.getIfNotDisabled()!==!0||e){this.#i({type:"setting-is-not-true"}),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsOptInTeaserShown);return}if(!this.#e.consentOnboardingCompleted){let{sources:i,isPageReloadRecommended:s}=await this.#o.buildPrompt();this.#i({type:"consent-reminder",sources:i,isPageReloadRecommended:s}),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsReminderTeaserShown);return}await this.#C()}#R(){this.#e.type==="consent-reminder"&&n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsReminderTeaserCanceled),this.#g=!0,this.requestUpdate()}#T(){if(this.#g){this.contentElement.dispatchEvent(new L);return}this.#b&&this.#v.value?.focus()}#$(){this.#n!==-1&&(this.#n=-1,this.requestUpdate())}#M(e){if(this.#e.type!=="insight")throw new Error("Unexpected state");if(this.#e.metadata?.rpcGlobalId===void 0)throw new Error("RPC Id not in metadata");if(this.#s!==void 0)return;this.#s=e,this.requestUpdate(),this.#s?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightRatedPositive):n.userMetrics.actionTaken(n.UserMetrics.Action.InsightRatedNegative);let i=b.Runtime.hostConfig.aidaAvailability?.disallowLogging??!0;return this.#c.registerClientEvent({corresponding_aida_rpc_global_id:this.#e.metadata.rpcGlobalId,disable_user_content_logging:i,do_conversation_client_event:{user_feedback:{sentiment:this.#s?n.AidaClient.Rating.POSITIVE:n.AidaClient.Rating.NEGATIVE}}})}#L(){n.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(K)}#S(){let e=this.#o.getSearchQuery();n.InspectorFrontendHost.InspectorFrontendHostInstance.openSearchResultsInNewTab(e)}async#H(){this.#m().set(!0),this.#i({type:"loading",consentOnboardingCompleted:!0}),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsReminderTeaserConfirmed),await this.#C()}#E(e,i){let s=[];if(!V(i)||!i.attributionMetadata)return{explanationWithCitations:e,directCitationUrls:s};let{attributionMetadata:o}=i,a=o.citations.filter(f=>f.sourceType===n.AidaClient.CitationSourceType.WORLD_FACTS).sort((f,y)=>(y.endIndex||0)-(f.endIndex||0)),r=e;for(let[f,y]of a.entries()){let p=/[.,:;!?]*\s/g;p.lastIndex=y.endIndex||0;let g=p.exec(r);g&&y.uri&&(r=r.slice(0,g.index)+`[^${a.length-f}]`+r.slice(g.index),s.push(y.uri))}return s.reverse(),{explanationWithCitations:r,directCitationUrls:s}}#U(e){for(let i of e)if(i.type==="code"){let s=i.text.match(/\[\^\d+\]/g);if(i.text=i.text.replace(/\[\^\d+\]/g,""),s?.length){let o=s.map(a=>{let r=parseInt(a.slice(2,-1),10);return{index:r,clickHandler:this.#u.bind(this,r)}});i.citations=o}}}#N(e,i){if(!i.factualityMetadata?.facts.length)return[];let s=i.factualityMetadata.facts.filter(r=>r.sourceUri&&!e.includes(r.sourceUri)).map(r=>r.sourceUri)||[],o=i.attributionMetadata?.citations.filter(r=>r.sourceType===n.AidaClient.CitationSourceType.TRAINING_DATA&&(r.uri||r.repository)).map(r=>r.uri||`https://www.github.com/${r.repository}`)||[],a=[...new Set(o.filter(r=>!s.includes(r)&&!e.includes(r)))];return s.push(...a),s}async#C(){try{for await(let{sources:e,isPageReloadRecommended:i,explanation:s,metadata:o,completed:a}of this.#O()){let{explanationWithCitations:r,directCitationUrls:f}=this.#E(s,o),y=this.#N(f,o),p=this.#z(r),g=p!==!1;g&&this.#U(p),this.#i({type:"insight",tokens:g?p:[],validMarkdown:g,explanation:s,sources:e,metadata:o,isPageReloadRecommended:i,completed:a,directCitationUrls:f,relatedUrls:y})}n.userMetrics.actionTaken(n.UserMetrics.Action.InsightGenerated)}catch(e){console.error("[ConsoleInsight] Error in #generateInsight:",e),n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErrored),e.message==="doAidaConversation timed out"&&this.#e.type==="insight"?(this.#e.timedOut=!0,this.#i({...this.#e,completed:!0,timedOut:!0})):this.#i({type:"error",error:e.message})}}#z(e){try{let i=this.#k.lexer(e);for(let s of i)this.#d.renderToken(s);return i}catch{return n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredMarkdown),!1}}async*#O(){let{prompt:e,sources:i,isPageReloadRecommended:s}=await this.#o.buildPrompt();try{for await(let o of this.#c.doConversation(n.AidaClient.AidaClient.buildConsoleInsightsRequest(e)))yield{sources:i,isPageReloadRecommended:s,...o}}catch(o){throw o.message==="Server responded: permission denied"?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredPermissionDenied):o.message.startsWith("Cannot send request:")?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredCannotSend):o.message.startsWith("Request failed:")?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredRequestFailed):o.message.startsWith("Cannot parse chunk:")?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredCannotParseChunk):o.message==="Unknown chunk result"?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredUnknownChunk):o.message.startsWith("Server responded:")?n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredApi):n.userMetrics.actionTaken(n.UserMetrics.Action.InsightErroredOther),o}}#B(){n.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(Q)}#P(e){let i=e.target;i&&(this.#r=i.open,i.open||(this.#n=-1),this.requestUpdate())}#_(){x.ViewManager.ViewManager.instance().showView("chrome-ai")}#V(){n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsReminderTeaserSettingsLinkClicked),x.ViewManager.ViewManager.instance().showView("chrome-ai")}#D(){n.userMetrics.actionTaken(n.UserMetrics.Action.InsightsOptInTeaserSettingsLinkClicked),x.ViewManager.ViewManager.instance().showView("chrome-ai")}performUpdate(){let e={state:this.#e,closing:this.#g,disableAnimations:this.disableAnimations,renderer:this.#d,citationClickHandler:this.#u.bind(this),selectedRating:this.#s,noLogging:b.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===b.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING,areReferenceDetailsOpen:this.#r,highlightedCitationIndex:this.#n,callbacks:{onClose:this.#R.bind(this),onAnimationEnd:this.#T.bind(this),onCitationAnimationEnd:this.#$.bind(this),onSearch:this.#S.bind(this),onRating:this.#M.bind(this),onReport:this.#L.bind(this),onGoToSignIn:this.#B.bind(this),onConsentReminderConfirmed:this.#H.bind(this),onToggleReferenceDetails:this.#P.bind(this),onDisclaimerSettingsLink:this.#_.bind(this),onReminderSettingsLink:this.#V.bind(this),onEnableInsightsInSettingsLink:this.#D.bind(this),onReferencesOpen:this.#x.bind(this)}},i={headerRef:this.#v,citationLinks:[]};this.#f(e,i,this.contentElement),this.#y=i.citationLinks}};import*as v from"./../../core/host/host.js";import*as $ from"./../console/console.js";var G=class{handleAction(e,i){switch(i){case"explain.console-message.context":case"explain.console-message.context.error":case"explain.console-message.context.warning":case"explain.console-message.context.other":case"explain.console-message.teaser":case"explain.console-message.hover":{let s=e.flavor($.ConsoleViewMessage.ConsoleViewMessage);if(s){i.startsWith("explain.console-message.context")?v.userMetrics.actionTaken(v.UserMetrics.Action.InsightRequestedViaContextMenu):i==="explain.console-message.teaser"?v.userMetrics.actionTaken(v.UserMetrics.Action.InsightRequestedViaTeaser):i==="explain.console-message.hover"&&v.userMetrics.actionTaken(v.UserMetrics.Action.InsightRequestedViaHoverButton);let o=new $.PromptBuilder.PromptBuilder(s),a=new v.AidaClient.AidaClient;return T.create(o,a).then(r=>{s.setInsight(r)}),!0}return!1}}return!1}};export{G as ActionDelegate,L as CloseEvent,T as ConsoleInsight,ue as DEFAULT_VIEW,J as State};
//# sourceMappingURL=explain.js.map
