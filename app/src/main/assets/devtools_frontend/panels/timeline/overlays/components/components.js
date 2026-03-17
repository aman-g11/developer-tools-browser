var ve=Object.defineProperty;var T=(i,e)=>{for(var t in e)ve(i,t,{get:e[t],enumerable:!0})};var Z={};T(Z,{EntriesLinkOverlay:()=>C,EntryLinkStartCreating:()=>S});import"./../../../../ui/kit/kit.js";import*as U from"./../../../../core/i18n/i18n.js";import*as k from"./../../../../models/trace/trace.js";import*as G from"./../../../../ui/legacy/theme_support/theme_support.js";import{html as xe,render as we}from"./../../../../ui/lit/lit.js";import*as Y from"./../../../../ui/visual_logging/visual_logging.js";var W=`.connectorContainer{display:flex;width:100%;height:100%}.entry-wrapper{pointer-events:none;position:absolute;display:block;border:2px solid var(--color-text-primary);box-sizing:border-box;&.cut-off-top{border-top:none}&.cut-off-bottom{border-bottom:none}&.cut-off-right{border-right:none}&.cut-off-left{border-left:none}}.entry-is-not-source{border:2px dashed var(--color-text-primary)}.create-link-icon{pointer-events:auto;cursor:pointer;color:var(--sys-color-on-surface);width:16px;height:16px;position:absolute}
/*# sourceURL=${import.meta.resolve("./entriesLinkOverlay.css")} */`;var j={diagram:"Links between entries"},Le=U.i18n.registerUIStrings("panels/timeline/overlays/components/EntriesLinkOverlay.ts",j),Ae=U.i18n.getLocalizedString.bind(void 0,Le),S=class i extends Event{static eventName="entrylinkstartcreating";constructor(){super(i.eventName,{bubbles:!0,composed:!0})}},C=class extends HTMLElement{#i=this.attachShadow({mode:"open"});#o;#t;#s;#r=null;#n=null;#e=null;#l=null;#c=null;#h=null;#u=null;#d=!0;#a=!0;#f=null;#y=!0;#g=!0;#p=!1;#v;constructor(e,t){super(),this.#b(),this.#o={x:e.x,y:e.y},this.#t={width:e.width,height:e.height},this.#s={x:e.x,y:e.y},this.#n=this.#i.querySelector(".connectorContainer")??null,this.#e=this.#n?.querySelector("line")??null,this.#l=this.#i.querySelector(".from-highlight-wrapper")??null,this.#c=this.#i.querySelector(".to-highlight-wrapper")??null,this.#h=this.#n?.querySelector(".entryFromConnector")??null,this.#u=this.#n?.querySelector(".entryToConnector")??null,this.#v=t,this.#b()}set canvasRect(e){e!==null&&(this.#f&&this.#f.width===e.width&&this.#f.height===e.height||(this.#f=e,this.#b()))}entryFromWrapper(){return this.#l}entryToWrapper(){return this.#c}set hideArrow(e){this.#p=e,this.#e&&(this.#e.style.display=e?"none":"block")}set fromEntryCoordinateAndDimensions(e){this.#o={x:e.x,y:e.y},this.#t={width:e.length,height:e.height},this.#w(),this.#L()}set entriesVisibility(e){this.#d=e.fromEntryVisibility,this.#a=e.toEntryVisibility,this.#L()}set toEntryCoordinateAndDimensions(e){this.#s={x:e.x,y:e.y},e.length&&e.height?this.#r={width:e.length,height:e.height}:this.#r=null,this.#w(),this.#L()}set fromEntryIsSource(e){e!==this.#y&&(this.#y=e,this.#b())}set toEntryIsSource(e){e!==this.#g&&(this.#g=e,this.#b())}#L(){if(!this.#e||!this.#l||!this.#c||!this.#h||!this.#u){console.error("one of the required Entries Link elements is missing.");return}if(this.#v===k.Types.File.EntriesLinkState.CREATION_NOT_STARTED){this.#h.setAttribute("visibility","hidden"),this.#u.setAttribute("visibility","hidden"),this.#e.style.display="none";return}this.#k(),this.#E(),this.#T(),this.#A(),this.#b()}#k(){!this.#l||!this.#c||(this.#l.style.visibility=this.#d?"visible":"hidden",this.#c.style.visibility=this.#a?"visible":"hidden")}#E(){if(!this.#r||!this.#h||!this.#u)return;let e=8,t=this.#d&&!this.#p&&this.#y&&this.#t.width>=e,s=!this.#p&&this.#a&&this.#g&&this.#r?.width>=e&&!this.#p;this.#h.setAttribute("visibility",t?"visible":"hidden"),this.#u.setAttribute("visibility",s?"visible":"hidden")}#T(){if(!this.#e)return;this.#e.style.display=this.#d||this.#a?"block":"none",this.#e.setAttribute("stroke-width","2");let e=G.ThemeSupport.instance().getComputedValue("--color-text-primary");if(!this.#r||this.#d&&this.#a){this.#e.setAttribute("stroke",e);return}this.#d&&!this.#a?this.#e.setAttribute("stroke","url(#fromVisibleLineGradient)"):this.#a&&!this.#d&&this.#e.setAttribute("stroke","url(#toVisibleLineGradient)")}#A(){if(!this.#e||!this.#h||!this.#u)return;let e=this.#t.height/2,t=this.#o.x+this.#t.width,s=this.#o.y+e;this.#e.setAttribute("x1",t.toString()),this.#e.setAttribute("y1",s.toString()),this.#h.setAttribute("cx",t.toString()),this.#h.setAttribute("cy",s.toString());let n=this.#s.x,o=this.#r?this.#s.y+(this.#r?.height??0)/2:this.#s.y;this.#e.setAttribute("x2",n.toString()),this.#e.setAttribute("y2",o.toString()),this.#u.setAttribute("cx",n.toString()),this.#u.setAttribute("cy",o.toString())}#x(){if(!this.#f)return 100;let e=25,t=this.#s.x-(this.#o.x+this.#t.width),s=e*100/t;return s<100?s:100}#w(){let e=this.#i.querySelector(".create-link-box"),t=e?.querySelector(".create-link-icon")??null;if(!e||!t){console.error("creating element is missing.");return}if(this.#v!==k.Types.File.EntriesLinkState.CREATION_NOT_STARTED){t.style.display="none";return}t.style.left=`${this.#o.x+this.#t.width}px`,t.style.top=`${this.#o.y}px`}#S(){this.#v=k.Types.File.EntriesLinkState.PENDING_TO_EVENT,this.dispatchEvent(new S)}#b(){let e=G.ThemeSupport.instance().getComputedValue("--color-text-primary");we(xe`
          <style>${W}</style>
          <svg class="connectorContainer" width="100%" height="100%" role="region" aria-label=${Ae(j.diagram)}>
            <defs>
              <linearGradient
                id="fromVisibleLineGradient"
                x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stop-color=${e}
                  stop-opacity="1" />
                <stop
                  offset="${this.#x()}%"
                  stop-color=${e}
                  stop-opacity="0" />
              </linearGradient>

              <linearGradient
                id="toVisibleLineGradient"
                x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="${100-this.#x()}%"
                  stop-color=${e}
                  stop-opacity="0" />
                <stop
                  offset="100%"
                  stop-color=${e}
                  stop-opacity="1" />
              </linearGradient>
              <marker
                id="arrow"
                orient="auto"
                markerWidth="3"
                markerHeight="4"
                fill-opacity="1"
                refX="4"
                refY="2"
                visibility=${this.#a||!this.#r?"visible":"hidden"}>
                <path d="M0,0 V4 L4,2 Z" fill=${e} />
              </marker>
            </defs>
            <line
              marker-end="url(#arrow)"
              stroke-dasharray=${!this.#y||!this.#g?Ee:"none"}
              visibility=${!this.#d&&!this.#a?"hidden":"visible"}
              />
            <circle class="entryFromConnector" fill="none" stroke=${e} stroke-width=${K} r=${X} />
            <circle class="entryToConnector" fill="none" stroke=${e} stroke-width=${K} r=${X} />
          </svg>
          <div class="entry-wrapper from-highlight-wrapper ${this.#y?"":"entry-is-not-source"}"></div>
          <div class="entry-wrapper to-highlight-wrapper ${this.#g?"":"entry-is-not-source"}"></div>
          <div class="create-link-box ${this.#v?"visible":"hidden"}">
            <devtools-icon
              class='create-link-icon'
              jslog=${Y.action("timeline.annotations.create-entry-link").track({click:!0})}
              @click=${this.#S}
              name='arrow-right-circle'>
            </devtools-icon>
          </div>
        `,this.#i,{host:this})}},X=2,K=1,Ee=4;customElements.define("devtools-entries-link-overlay",C);var ae={};T(ae,{EntryLabelChangeEvent:()=>L,EntryLabelOverlay:()=>$,EntryLabelRemoveEvent:()=>w,LabelAnnotationsConsentDialogVisibilityChange:()=>A});import"./../../../../ui/kit/kit.js";import"./../../../../ui/components/tooltips/tooltips.js";import"./../../../../ui/components/spinners/spinners.js";import*as ee from"./../../../../core/common/common.js";import*as te from"./../../../../core/host/host.js";import*as N from"./../../../../core/i18n/i18n.js";import*as V from"./../../../../core/platform/platform.js";import*as c from"./../../../../core/root/root.js";import*as ie from"./../../../../models/ai_assistance/ai_assistance.js";import*as se from"./../../../../ui/components/buttons/buttons.js";import*as R from"./../../../../ui/components/helpers/helpers.js";import*as ne from"./../../../../ui/helpers/helpers.js";import*as I from"./../../../../ui/legacy/legacy.js";import*as oe from"./../../../../ui/legacy/theme_support/theme_support.js";import*as p from"./../../../../ui/lit/lit.js";import*as f from"./../../../../ui/visual_logging/visual_logging.js";import*as re from"./../../../common/common.js";var J=`.label-parts-wrapper{display:flex;flex-direction:column;align-items:center}.label-button-input-wrapper{display:flex;position:relative;overflow:visible}.ai-label-button-wrapper,
.ai-label-disabled-button-wrapper,
.ai-label-loading,
.ai-label-error{position:absolute;left:100%;display:flex;transform:translateY(-3px);flex-flow:row nowrap;border:none;border-radius:var(--sys-shape-corner-large);background:var(--sys-color-surface3);box-shadow:var(--drop-shadow);align-items:center;gap:var(--sys-size-4);pointer-events:auto;transition:all var(--sys-motion-duration-medium2) var(--sys-motion-easing-emphasized);&.only-pen-wrapper{overflow:hidden;width:var(--sys-size-12);height:var(--sys-size-12)}*{transform:translateX(-2px)}}.delete-button{display:flex;pointer-events:auto;position:absolute;right:0;top:-5px;border-radius:50%;padding:0;border:none;background:var(--color-background-inverted)}.ai-label-loading,
.ai-label-error{gap:var(--sys-size-6);padding:var(--sys-size-5) var(--sys-size-8)}.ai-label-button-wrapper:focus,
.ai-label-button-wrapper:focus-within,
.ai-label-button-wrapper:hover{width:auto;height:var(--sys-size-13);padding:var(--sys-size-3) var(--sys-size-5);transform:translateY(-9px);*{transform:translateX(0)}}.ai-label-button{display:flex;align-items:center;gap:var(--sys-size-4);padding:var(--sys-size-3) var(--sys-size-5);border:1px solid var(--color-primary);border-radius:var(--sys-shape-corner-large);&.enabled{background:var(--sys-color-surface3)}&.disabled{background:var(--sys-color-surface5)}&:hover{background:var(--sys-color-state-hover-on-subtle)}}.generate-label-text{white-space:nowrap;color:var(--color-primary)}.input-field{background-color:var(--color-background-inverted);color:var(--color-background);pointer-events:auto;border-radius:var(--sys-shape-corner-extra-small);white-space:nowrap;padding:var(--sys-size-3) var(--sys-size-4);font-family:var(--default-font-family);font-size:var(--sys-typescale-body2-size);font-weight:var(--ref-typeface-weight-medium);outline:2px solid var(--color-background)}.input-field:focus,
.label-parts-wrapper:focus-within .input-field,
.input-field.fake-focus-state{background-color:var(--color-background);color:var(--color-background-inverted);outline:2px solid var(--color-background-inverted)}.connectorContainer{overflow:visible}.entry-highlight-wrapper{box-sizing:border-box;border:2px solid var(--sys-color-on-surface);&.cut-off-top{border-top:none}&.cut-off-bottom{border-bottom:none}&.cut-off-right{border-right:none}&.cut-off-left{border-left:none}}.info-tooltip-container{max-width:var(--sys-size-28);button.link{cursor:pointer;text-decoration:underline;border:none;padding:0;background:none;font:inherit;font-weight:var(--ref-typeface-weight-medium);display:block;margin-top:var(--sys-size-4);color:var(--sys-color-primary)}}
/*# sourceURL=${import.meta.resolve("./entryLabelOverlay.css")} */`;var{html:g,Directives:Q}=p,b={entryLabel:"Entry label",inputTextPrompt:"Enter an annotation label",generateLabelButton:"Generate label",freDialog:"Get AI-powered annotation suggestions dialog",learnMoreAriaLabel:"Learn more about auto annotations in settings",moreInfoAriaLabel:"More information about this feature"},r={learnMore:"Learn more in settings",generateLabelSecurityDisclaimer:"The selected call stack is sent to Google. This data may be seen by human reviewers to improve this feature. This is an experimental AI feature and won't always get it right.",generateLabelSecurityDisclaimerLoggingOff:"The selected call stack is sent to Google. This data will not be used to improve Google's AI models. Your organization may change these settings at any time. This is an experimental AI feature and won't always get it right.",autoAnnotationNotAvailableDisclaimer:"Auto annotations are not available.",autoAnnotationNotAvailableOfflineDisclaimer:"Auto annotations are not available because you are offline.",freDisclaimerHeader:"Get AI-powered annotation suggestions",generatingLabel:"Generating label",generationFailed:"Generation failed",freDisclaimerAiWontAlwaysGetItRight:"This feature uses AI and won\u2019t always get it right",freDisclaimerPrivacyDataSentToGoogle:"To generate annotation suggestions, your performance trace is sent to Google. This data may be seen by human reviewers to improve this feature.",freDisclaimerPrivacyDataSentToGoogleNoLogging:"To generate annotation suggestions, your performance trace is sent to Google. This data will not be used to improve Google\u2019s AI models. Your organization may change these settings at any time.",learnMoreButton:"Learn more"};var Te=N.i18n.registerUIStrings("panels/timeline/overlays/components/EntryLabelOverlay.ts",b),y=N.i18n.getLocalizedString.bind(void 0,Te),h=N.i18n.lockedString;function ke(){return c.Runtime.hostConfig.devToolsGeminiRebranding?.enabled?!1:!c.Runtime.hostConfig.aidaAvailability?.disallowLogging}var w=class i extends Event{static eventName="entrylabelremoveevent";constructor(){super(i.eventName)}},L=class i extends Event{constructor(e){super(i.eventName),this.newLabel=e}static eventName="entrylabelchangeevent"},A=class i extends Event{constructor(e){super(i.eventName,{bubbles:!0,composed:!0}),this.isVisible=e}static eventName="labelannotationsconsentdialogvisiblitychange"},$=class i extends HTMLElement{static LABEL_AND_CONNECTOR_SHIFT_LENGTH=8;static LABEL_CONNECTOR_HEIGHT=7;static MAX_LABEL_LENGTH=100;#i=this.attachShadow({mode:"open"});#o=!1;#t=!0;#s=null;#r=null;#n=null;#e=null;#l=null;#c;#h;#u=Q.createRef();#d;#a=null;#f=ee.Settings.Settings.instance().createSetting("ai-annotations-enabled",!1);#y=new ie.PerformanceAnnotationsAgent.PerformanceAnnotationsAgent({aidaClient:new te.AidaClient.AidaClient,serverSideLoggingEnabled:ke()});#g=!1;#p="hidden";constructor(e,t=!1){super(),this.#m(),this.#h=t,this.#r=this.#i.querySelector(".label-parts-wrapper"),this.#e=this.#r?.querySelector(".input-field")??null,this.#l=this.#r?.querySelector(".connectorContainer")??null,this.#n=this.#r?.querySelector(".entry-highlight-wrapper")??null,this.#c=e,this.#d=c.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===c.Runtime.GenAiEnterprisePolicyValue.ALLOW_WITHOUT_LOGGING,this.#T(e),e!==""&&this.setLabelEditabilityAndRemoveEmptyLabel(!1);let s=e===""?y(b.inputTextPrompt):e;this.#e?.setAttribute("aria-label",s),this.#E()}overrideAIAgentForTest(e){this.#y=e}entryHighlightWrapper(){return this.#n}#v(){let e=this.#e?.textContent?.trim()??"";e!==this.#c&&(this.#c=e,this.dispatchEvent(new L(this.#c)),this.#e?.dispatchEvent(new Event("change",{bubbles:!0,composed:!0}))),this.#b(),this.#m(),this.#e?.setAttribute("aria-label",e)}#L(e){if(!this.#e)return!1;let t=["Backspace","Delete","ArrowLeft","ArrowRight"];return(e.key===V.KeyboardUtilities.ENTER_KEY||e.key===V.KeyboardUtilities.ESCAPE_KEY)&&this.#t?(this.#e.blur(),this.setLabelEditabilityAndRemoveEmptyLabel(!1),!1):this.#e.textContent!==null&&this.#e.textContent.length<=i.MAX_LABEL_LENGTH||t.includes(e.key)||e.key.length===1&&e.ctrlKey?!0:(e.preventDefault(),!1)}#k(e){e.preventDefault();let t=e.clipboardData;if(!t||!this.#e)return;let s=t.getData("text").replace(/(\r\n|\n|\r)/gm,""),o=(this.#e.textContent+s).slice(0,i.MAX_LABEL_LENGTH+1);this.#e.textContent=o,this.#x()}set entryLabelVisibleHeight(e){this.#s=e,R.ScheduledRender.scheduleRender(this,this.#m),this.#t&&this.#A(),this.#T(),this.#E()}#E(){if(!this.#l){console.error("`connectorLineContainer` element is missing.");return}if(this.#h&&this.#s){let n=this.#s+i.LABEL_CONNECTOR_HEIGHT;this.#l.style.transform=`translateY(${n}px) rotate(180deg)`}let e=this.#l.querySelector("line"),t=this.#l.querySelector("circle");if(!e||!t){console.error("Some entry label elements are missing.");return}this.#l.setAttribute("width",(i.LABEL_AND_CONNECTOR_SHIFT_LENGTH*2).toString()),this.#l.setAttribute("height",i.LABEL_CONNECTOR_HEIGHT.toString()),e.setAttribute("x1","0"),e.setAttribute("y1","0"),e.setAttribute("x2",i.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString()),e.setAttribute("y2",i.LABEL_CONNECTOR_HEIGHT.toString());let s=oe.ThemeSupport.instance().getComputedValue("--color-text-primary");e.setAttribute("stroke",s),e.setAttribute("stroke-width","2"),t.setAttribute("cx",i.LABEL_AND_CONNECTOR_SHIFT_LENGTH.toString()),t.setAttribute("cy",(i.LABEL_CONNECTOR_HEIGHT+1).toString()),t.setAttribute("r","3"),t.setAttribute("fill",s)}#T(e){if(!this.#e){console.error("`labelBox`element is missing.");return}typeof e=="string"&&(this.#e.innerText=e);let t=null,s=null;this.#h?t=i.LABEL_AND_CONNECTOR_SHIFT_LENGTH:t=i.LABEL_AND_CONNECTOR_SHIFT_LENGTH*-1,this.#h&&this.#s&&(s=this.#s+i.LABEL_CONNECTOR_HEIGHT*2+this.#e?.offsetHeight);let n="";t&&(n+=`translateX(${t}px) `),s&&(n+=`translateY(${s}px)`),n.length&&(this.#e.style.transform=n)}#A(){if(!this.#e){console.error("`labelBox` element is missing.");return}this.#e.focus()}setLabelEditabilityAndRemoveEmptyLabel(e){if(this.#g&&e===!1)return;e?this.setAttribute("data-user-editing-label","true"):this.removeAttribute("data-user-editing-label"),this.#t=e,this.#m(),e&&this.#e&&(this.#x(),this.#A());let t=this.#e?.textContent?.trim()??"";!e&&t.length===0&&!this.#o&&(this.#o=!0,this.dispatchEvent(new w))}#x(){if(!this.#e)return;let e=window.getSelection(),t=document.createRange();t.selectNodeContents(this.#e),t.collapse(!1),e?.removeAllRanges(),e?.addRange(t)}set callTree(e){this.#a=e,this.#b()}async#w(){if(this.#f.get()){if(!this.#a||!this.#e)return;try{this.#p="generating_label",I.ARIAUtils.LiveAnnouncer.alert(r.generatingLabel),this.#m(),this.#A(),R.ScheduledRender.scheduleRender(this,this.#m),this.#c=await this.#y.generateAIEntryLabel(this.#a),this.dispatchEvent(new L(this.#c)),this.#e.innerText=this.#c,this.#x(),this.#b(),this.#m()}catch{this.#p="generation_failed",R.ScheduledRender.scheduleRender(this,this.#m)}}else{this.#g=!0,this.#m();let e=await this.#S();this.#g=!1,this.setLabelEditabilityAndRemoveEmptyLabel(!0),e&&await this.#w()}}async#S(){this.dispatchEvent(new A(!0));let e=await re.FreDialog.show({ariaLabel:y(b.freDialog),header:{iconName:"pen-spark",text:h(r.freDisclaimerHeader)},reminderItems:[{iconName:"psychiatry",content:h(r.freDisclaimerAiWontAlwaysGetItRight)},{iconName:"google",content:this.#d?h(r.freDisclaimerPrivacyDataSentToGoogleNoLogging):h(r.freDisclaimerPrivacyDataSentToGoogle)}],onLearnMoreClick:()=>{ne.openInNewTab("https://developer.chrome.com/docs/devtools/performance/annotations#auto-annotations")},learnMoreButtonText:r.learnMoreButton});return this.dispatchEvent(new A(!1)),e&&this.#f.set(!0),this.#f.get()}#b(){let e=!!c.Runtime.hostConfig.devToolsAiGeneratedTimelineLabels?.enabled,t=c.Runtime.hostConfig.aidaAvailability?.enterprisePolicyValue===c.Runtime.GenAiEnterprisePolicyValue.DISABLE,s=this.#a!==null,n=this.#c?.length<=0;!e||t||!s||!n?this.#p="hidden":c.Runtime.hostConfig.aidaAvailability?.enabled&&!c.Runtime.hostConfig.aidaAvailability?.blockedByAge&&!c.Runtime.hostConfig.aidaAvailability?.blockedByGeo&&navigator.onLine?this.#p="enabled":this.#p="disabled"}#C(e){return g`<devtools-tooltip
    variant="rich"
    id="info-tooltip"
    ${Q.ref(this.#u)}>
      <div class="info-tooltip-container">
        ${e.textContent} ${e.includeSettingsButton?g`
          <button
            class="link tooltip-link"
            role="link"
            jslog=${f.link("open-ai-settings").track({click:!0})}
            @click=${this.#N}
            aria-label=${y(b.learnMoreAriaLabel)}
          >${h(r.learnMore)}</button>
        `:p.nothing}
      </div>
    </devtools-tooltip>`}#$(){return g`
      <span
        class="ai-label-loading">
        <devtools-spinner></devtools-spinner>
        <span class="generate-label-text">${h(r.generatingLabel)}</span>
      </span>
    `}#R(){return this.#p==="generation_failed"?g`
        <span
          class="ai-label-error">
          <devtools-icon
            class="warning extra-large"
            name="warning"
            style="color: var(--ref-palette-error50)">
          </devtools-icon>
          <span class="generate-label-text">${h(r.generationFailed)}</span>
        </span>
      `:g`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-button-wrapper only-pen-wrapper"
        @mousedown=${e=>e.preventDefault()}>
        <button
          class="ai-label-button enabled"
          @click=${this.#w}
          jslog=${f.link("timeline.annotations.ai-generate-label").track({click:!0})}>
          <devtools-icon
            class="pen-icon extra-large"
            name="pen-spark"
            style="color: var(--icon-primary);">
          </devtools-icon>
          <span class="generate-label-text">${y(b.generateLabelButton)}</span>
        </button>
        <devtools-button
          aria-details="info-tooltip"
          class="pen-icon"
          .title=${y(b.moreInfoAriaLabel)}
          .iconName=${"info"}
          .variant=${se.Button.Variant.ICON}
          ></devtools-button>
        ${this.#C({textContent:this.#d?h(r.generateLabelSecurityDisclaimerLoggingOff):h(r.generateLabelSecurityDisclaimer),includeSettingsButton:!0})}
      </span>
    `}#N(){this.#u?.value?.hidePopover(),I.ViewManager.ViewManager.instance().showView("chrome-ai")}#I(){let e=navigator.onLine===!1;return g`
      <!-- 'preventDefault' on the AI label button to prevent the label removal on blur  -->
      <span
        class="ai-label-disabled-button-wrapper only-pen-wrapper"
        @mousedown=${t=>t.preventDefault()}>
        <button
          class="ai-label-button disabled"
          ?disabled=${!0}
          @click=${this.#w}>
          <devtools-icon
            aria-details="info-tooltip"
            class="pen-icon extra-large"
            name="pen-spark"
            style="color: var(--sys-color-state-disabled);">
          </devtools-icon>
        </button>
        ${this.#C({textContent:h(e?r.autoAnnotationNotAvailableOfflineDisclaimer:r.autoAnnotationNotAvailableDisclaimer),includeSettingsButton:!e})}
      </span>
    `}#O(e){let t=e.relatedTarget;t&&this.#i.contains(t)||this.setLabelEditabilityAndRemoveEmptyLabel(!1)}#m(){let e=p.Directives.classMap({"input-field":!0,"fake-focus-state":this.#g});p.render(g`
        <style>${J}</style>
        <span class="label-parts-wrapper" role="region" aria-label=${y(b.entryLabel)}
          @focusout=${this.#O}
        >
          <span
            class="label-button-input-wrapper">
            <span
              class=${e}
              role="textbox"
              @focus=${()=>{this.setLabelEditabilityAndRemoveEmptyLabel(!0)}}
              @dblclick=${()=>{this.setLabelEditabilityAndRemoveEmptyLabel(!0)}}
              @keydown=${this.#L}
              @paste=${this.#k}
              @input=${this.#v}
              contenteditable=${this.#t?"plaintext-only":!1}
              jslog=${f.textField("timeline.annotations.entry-label-input").track({keydown:!0,click:!0,change:!0})}
              tabindex="0"
            ></span>
            ${this.#t&&this.#e?.innerText!==""?g`
              <button
                class="delete-button"
                @click=${()=>this.dispatchEvent(new w)}
                jslog=${f.action("timeline.annotations.delete-entry-label").track({click:!0})}>
              <devtools-icon name="cross" class="small" style="color: var(--color-background);"
              ></devtools-icon>
              </button>
            `:p.nothing}
            ${(()=>{switch(this.#p){case"hidden":return p.nothing;case"enabled":return this.#R();case"generating_label":return this.#$();case"generation_failed":return this.#R();case"disabled":return this.#I()}})()}
          </span>
          <svg class="connectorContainer">
            <line/>
            <circle/>
          </svg>
          <div class="entry-highlight-wrapper"></div>
        </span>`,this.#i,{host:this})}};customElements.define("devtools-entry-label-overlay",$);var de={};T(de,{TimeRangeLabelChangeEvent:()=>O,TimeRangeOverlay:()=>B,TimeRangeRemoveEvent:()=>D});import*as E from"./../../../../core/i18n/i18n.js";import*as z from"./../../../../core/platform/platform.js";import{html as Se,render as Ce}from"./../../../../ui/lit/lit.js";import*as he from"./../../../../ui/visual_logging/visual_logging.js";var le=`:host{display:flex;overflow:hidden;flex-direction:column;justify-content:flex-end;width:100%;height:100%;box-sizing:border-box;padding-bottom:5px;background:linear-gradient(180deg,rgb(255 125 210/0%) 0%,rgb(255 125 210/15%) 85%);border-color:var(--ref-palette-pink55);border-width:0 1px 5px;border-style:solid;pointer-events:none}.range-container{display:flex;align-items:center;flex-direction:column;text-align:center;box-sizing:border-box;pointer-events:all;user-select:none;color:var(--sys-color-pink);&.labelHidden{user-select:none;pointer-events:none;visibility:hidden}&.offScreenLeft{align-items:flex-start;text-align:left}&.offScreenRight{align-items:flex-end;text-align:right}}.label-text{width:100%;max-width:70px;min-width:fit-content;text-overflow:ellipsis;overflow:hidden;word-break:normal;overflow-wrap:anywhere;margin-bottom:3px;display:-webkit-box;white-space:break-spaces;background:var(--sys-color-cdt-base-container);line-clamp:2;-webkit-line-clamp:2;-webkit-box-orient:vertical}.duration{background:var(--sys-color-cdt-base-container)}.label-text[contenteditable='true']{outline:none;box-shadow:0 0 0 1px var(--ref-palette-pink55)}.label-text[contenteditable='false']{width:auto}
/*# sourceURL=${import.meta.resolve("./timeRangeOverlay.css")} */`;var ce={timeRange:"Time range"},Re=E.i18n.registerUIStrings("panels/timeline/overlays/components/TimeRangeOverlay.ts",ce),$e=E.i18n.getLocalizedString.bind(void 0,Re),O=class i extends Event{constructor(e){super(i.eventName),this.newLabel=e}static eventName="timerangelabelchange"},D=class i extends Event{static eventName="timerangeremoveevent";constructor(){super(i.eventName)}},B=class extends HTMLElement{#i=this.attachShadow({mode:"open"});#o=null;#t=null;#s;#r=!0;#n=null;#e=null;constructor(e){if(super(),this.#a(),this.#n=this.#i.querySelector(".range-container"),this.#e=this.#n?.querySelector(".label-text")??null,this.#s=e,!this.#e){console.error("`labelBox` element is missing.");return}this.#e.innerText=e,e&&(this.#e?.setAttribute("aria-label",e),this.#h(!1))}set canvasRect(e){e!==null&&(this.#t&&this.#t.width===e.width&&this.#t.height===e.height||(this.#t=e,this.#a()))}set duration(e){e!==this.#o&&(this.#o=e,this.#a())}#l(e){if(!this.#t)return 0;let{x:t,width:s}=e,n=t+s,o=this.#t.x,u=this.#t.x+this.#t.width,a=Math.max(o,t);return Math.min(u,n)-a}updateLabelPositioning(){if(!this.#n||!this.#t||!this.#e)return;let e=9,t=this.getBoundingClientRect(),s=this.#i.activeElement===this.#e,n=this.#n.getBoundingClientRect(),o=this.#l(t)-e,a=(this.#n.querySelector(".duration")??null)?.getBoundingClientRect().width;if(!a)return;let d=o<=a&&!s&&this.#s.length>0;if(this.#n.classList.toggle("labelHidden",d),d)return;let v=(t.width-n.width)/2,m=t.x+v<this.#t.x;this.#n.classList.toggle("offScreenLeft",m);let P=this.#t.x+this.#t.width,x=t.x+v+n.width>P;this.#n.classList.toggle("offScreenRight",x),m?this.#n.style.marginLeft=`${Math.abs(this.#t.x-t.x)+e}px`:x?this.#n.style.marginRight=`${t.right-this.#t.right+e}px`:this.#n.style.margin="0px",this.#e?.innerText===""&&this.#h(!0)}#c(){if(!this.#e){console.error("`labelBox` element is missing.");return}this.#e.focus()}#h(e){if(this.#e?.innerText===""){this.#c();return}this.#r=e,this.#a(),e&&this.#c()}#u(){let e=this.#e?.textContent??"";e!==this.#s&&(this.#s=e,this.dispatchEvent(new O(this.#s)),this.#e?.setAttribute("aria-label",e))}#d(e){return e.key===z.KeyboardUtilities.ENTER_KEY||e.key===z.KeyboardUtilities.ESCAPE_KEY?(e.stopPropagation(),this.#s===""&&this.dispatchEvent(new D),this.#e?.blur(),!1):!0}#a(){let e=this.#o?E.TimeUtilities.formatMicroSecondsTime(this.#o):"";Ce(Se`
          <style>${le}</style>
          <span class="range-container" role="region" aria-label=${$e(ce.timeRange)}>
            <span
             class="label-text"
             role="textbox"
             @focusout=${()=>this.#h(!1)}
             @dblclick=${()=>this.#h(!0)}
             @keydown=${this.#d}
             @keyup=${this.#u}
             contenteditable=${this.#r?"plaintext-only":!1}
             jslog=${he.textField("timeline.annotations.time-range-label-input").track({keydown:!0,click:!0})}
            ></span>
            <span class="duration">${e}</span>
          </span>
          `,this.#i,{host:this}),this.updateLabelPositioning()}};customElements.define("devtools-time-range-overlay",B);var me={};T(me,{DEFAULT_VIEW:()=>fe,TimespanBreakdownOverlay:()=>F});import*as pe from"./../../../../core/i18n/i18n.js";import*as ge from"./../../../../ui/legacy/legacy.js";import{Directives as be,html as M,nothing as Ne,render as Ie}from"./../../../../ui/lit/lit.js";var ue=`@scope to (devtools-widget > *){.timespan-breakdown-overlay-section{border:solid;border-color:var(--sys-color-on-surface);border-width:4px 1px 0;align-content:flex-start;text-align:center;overflow:hidden;text-overflow:ellipsis;background-image:linear-gradient(180deg,var(--sys-color-on-primary),transparent);height:90%;box-sizing:border-box;padding-top:var(--sys-size-2);.is-below &{border-top-width:0;border-bottom-width:4px;align-content:flex-end;padding-bottom:var(--sys-size-2);padding-top:0;.timespan-breakdown-overlay-label{display:flex;flex-direction:column-reverse}}}.timeline-segment-container{display:flex;overflow:hidden;flex-direction:row;justify-content:flex-end;align-items:flex-end;width:100%;box-sizing:border-box;height:100%;max-height:100px;.timespan-breakdown-overlay-section:first-child{border-left-width:1px!important}.timespan-breakdown-overlay-section:last-child{border-right-width:1px!important}}.timeline-segment-container.is-below{align-items:flex-start}.timeline-segment-container.even-number-of-sections{.timespan-breakdown-overlay-section:nth-child(even){height:100%}.timespan-breakdown-overlay-section:nth-child(odd){border-left-width:0;border-right-width:0}}.timeline-segment-container.odd-number-of-sections{.timespan-breakdown-overlay-section:nth-child(odd){height:100%}.timespan-breakdown-overlay-section:nth-child(even){border-left-width:0;border-right-width:0}}.timespan-breakdown-overlay-label{font-family:var(--default-font-family);font-size:var(--sys-typescale-body2-size);line-height:var(--sys-typescale-body4-line-height);font-weight:var(--ref-typeface-weight-medium);color:var(--sys-color-on-surface);text-align:center;box-sizing:border-box;width:max-content;padding:0 3px;overflow:hidden;text-overflow:ellipsis;text-wrap:nowrap;.duration-text{font-size:var(--sys-typescale-body4-size);text-overflow:ellipsis;overflow:hidden;text-wrap:nowrap;display:block}.discovery-time-ms{font-weight:var(--ref-typeface-weight-bold)}&.labelHidden{user-select:none;pointer-events:none;visibility:hidden}&.labelTruncated{max-width:100%}&.offScreenLeft{text-align:left}&.offScreenRight{text-align:right}}}
/*# sourceURL=${import.meta.resolve("./timespanBreakdownOverlay.css")} */`;var Oe=(i,e)=>{let t=be.styleMap({left:e?`${e.left}px`:void 0,width:e?`${e.width}px`:void 0});return M`
      <div class="timespan-breakdown-overlay-section" style=${t}>
        <div class="timespan-breakdown-overlay-label">
          ${i.showDuration?M`<span class="duration-text">${pe.TimeUtilities.formatMicroSecondsAsMillisFixed(i.bounds.range)}</span> `:Ne}
          <span class="section-label-text">${i.label}</span>
        </div>
      </div>`},fe=(i,e,t)=>{let s=be.styleMap({left:i.left?`${i.left}px`:void 0,width:i.width?`${i.width}px`:void 0,top:i.top?`${i.top}px`:void 0,maxHeight:i.maxHeight?`${i.maxHeight}px`:void 0,position:"relative"});Ie(M`
        <style>${ue}</style>
        <div style=${s} class=${i.className}>
          ${i.sections?.map((n,o)=>Oe(n,i.positions[o]))}
        </div>`,t)},F=class extends ge.Widget.Widget{#i=null;#o=null;#t=[];#s=null;#r=null;#n=null;#e=null;#l;constructor(e,t=fe){super(e,{classes:["devtools-timespan-breakdown-overlay"]}),this.#l=t,this.requestUpdate()}set top(e){this.#e=e,this.requestUpdate()}set maxHeight(e){this.#n=e,this.requestUpdate()}set width(e){this.#r=e,this.requestUpdate()}set left(e){this.#s=e,this.requestUpdate()}set isBelowEntry(e){this.element.classList.toggle("is-below",e)}set canvasRect(e){this.#i&&e&&this.#i.width===e.width&&this.#i.height===e.height||(this.#i=e,this.requestUpdate())}set widths(e){e!==this.#t&&(this.#t=e,this.requestUpdate())}set sections(e){e!==this.#o&&(this.#o=e,this.requestUpdate())}checkSectionLabelPositioning(){let e=this.element.querySelectorAll(".timespan-breakdown-overlay-section");if(!e||!this.#i)return;let t=9,s=new Map;for(let o of e){let u=o.querySelector(".timespan-breakdown-overlay-label");if(!u)continue;let a=o.getBoundingClientRect(),l=u.getBoundingClientRect();s.set(o,{sectionRect:a,labelRect:l,label:u})}let n=30;for(let o of e){let u=s.get(o);if(!u)break;let{labelRect:a,sectionRect:l,label:d}=u,v=l.width<n,H=l.width-5<=a.width;if(d.classList.toggle("labelHidden",v),d.classList.toggle("labelTruncated",H),v||H)continue;let m=(l.width-a.width)/2,_=l.x+m<this.#i.x;d.classList.toggle("offScreenLeft",_);let x=this.#i.x+this.#i.width,q=l.x+m+a.width>x;if(d.classList.toggle("offScreenRight",q),_)d.style.marginLeft=`${Math.abs(this.#i.x-l.x)+t}px`;else if(q){let ye=x-a.width-l.x;d.style.marginLeft=`${ye}px`}else d.style.marginLeft=`${m}px`}}performUpdate(){let e="timeline-segment-container";this.#o&&(this.#o.length%2===0?e+=" even-number-of-sections":e+=" odd-number-of-sections"),this.#l({sections:this.#o,positions:this.#t,left:this.#s,width:this.#r,top:this.#e,maxHeight:this.#n,className:e},void 0,this.contentElement),this.checkSectionLabelPositioning()}};export{Z as EntriesLinkOverlay,ae as EntryLabelOverlay,de as TimeRangeOverlay,me as TimespanBreakdownOverlay};
//# sourceMappingURL=components.js.map
