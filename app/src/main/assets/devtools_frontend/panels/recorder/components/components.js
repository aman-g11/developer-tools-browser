var to=Object.defineProperty;var Y=(t,e)=>{for(var s in e)to(t,s,{get:e[s],enumerable:!0})};var Jt={};Y(Jt,{ControlButton:()=>le,DEFAULT_VIEW:()=>Yt});import*as Xt from"./../../../ui/legacy/legacy.js";import*as at from"./../../../ui/lit/lit.js";var Ht=`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.control{background:none;border:none;display:flex;flex-direction:column;align-items:center}.control[disabled]{filter:grayscale(100%);cursor:auto}.icon{display:flex;width:40px;height:40px;border-radius:50%;background:var(--sys-color-error-bright);margin-bottom:8px;position:relative;transition:background 200ms;place-content:center center;align-items:center}.icon::before{--override-white:#fff;box-sizing:border-box;content:"";display:block;width:14px;height:14px;border:1px solid var(--override-white);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background-color:var(--override-white)}.icon.square::before{border-radius:0}.icon.circle::before{border-radius:50%}.icon:hover{background:color-mix(in srgb,var(--sys-color-error-bright),var(--sys-color-state-hover-on-prominent) 10%)}.icon:active{background:color-mix(in srgb,var(--sys-color-error-bright),var(--sys-color-state-ripple-neutral-on-prominent) 16%)}.control[disabled] .icon:hover{background:var(--sys-color-error)}.label{font-size:12px;line-height:16px;text-align:center;letter-spacing:0.02em;color:var(--sys-color-on-surface)}
/*# sourceURL=${import.meta.resolve("./controlButton.css")} */`;var{html:so}=at,Yt=(t,e,s)=>{let{label:o,shape:i,disabled:r,onClick:n}=t;at.render(so`
    <style>${Ht}</style>
    <button
        @click=${d=>{r?(d.stopPropagation(),d.preventDefault()):n(d)}}
        .disabled=${r}
        class="control">
      <div class="icon ${i}"></div>
      <div class="label">${o}</div>
    </button>
  `,s)},le=class extends Xt.Widget.Widget{#o="";#e="square";#t=!1;#s=()=>{};#i;constructor(e,s){super(e,{useShadowDom:!0,classes:["flex-none"]}),this.#i=s||Yt}set label(e){this.#o=e,this.requestUpdate()}set shape(e){this.#e=e,this.requestUpdate()}set disabled(e){this.#t=e,this.requestUpdate()}set onClick(e){this.#s=e,this.requestUpdate()}performUpdate(){this.#i({label:this.#o,shape:this.#e,disabled:this.#t,onClick:this.#s},{},this.contentElement)}};var es={};Y(es,{CreateRecordingView:()=>pt,DEFAULT_VIEW:()=>Qt});import"./../../../ui/kit/kit.js";import*as ut from"./../../../core/i18n/i18n.js";import*as Ve from"./../../../models/badges/badges.js";import*as ct from"./../../../ui/components/buttons/buttons.js";import*as Be from"./../../../ui/components/input/input.js";import*as ht from"./../../../ui/legacy/legacy.js";import*as gt from"./../../../ui/lit/lit.js";import*as j from"./../../../ui/visual_logging/visual_logging.js";import*as P from"./../models/models.js";import*as dt from"./../recorder-actions/recorder-actions.js";var Zt=`*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.wrapper{padding:24px;flex:1}h1{font-size:18px;line-height:24px;letter-spacing:0.02em;color:var(--sys-color-on-surface);margin:0;font-weight:normal}.row-label{font-weight:500;font-size:11px;line-height:16px;letter-spacing:0.8px;text-transform:uppercase;color:var(--sys-color-secondary);margin-bottom:8px;margin-top:32px;display:flex;align-items:center;gap:3px}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container)}.controls{display:flex}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error)}.row-label .link:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}.header-wrapper{display:flex;align-items:baseline;justify-content:space-between}.checkbox-label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis;gap:4px;line-height:1.1;padding:4px}.checkbox-container{display:flex;flex-flow:row wrap;gap:10px}input[type="checkbox"]:focus-visible{outline:var(--sys-color-state-focus-ring) auto 1px}devtools-icon[name="help"]{width:16px;height:16px}
/*# sourceURL=${import.meta.resolve("./createRecordingView.css")} */`;var{html:lt,Directives:{ref:oo,createRef:io,repeat:ro}}=gt,L={recordingName:"Recording name",startRecording:"Start recording",createRecording:"Create a new recording",recordingNameIsRequired:"Recording name is required",selectorAttribute:"Selector attribute",cancelRecording:"Cancel recording",selectorTypeCSS:"CSS",selectorTypePierce:"Pierce",selectorTypeARIA:"ARIA",selectorTypeText:"Text",selectorTypeXPath:"XPath",selectorTypes:"Selector types to record",includeNecessarySelectors:"You must choose CSS, Pierce, or XPath as one of your options. Only these selectors are guaranteed to be recorded since ARIA and text selectors may not be unique.",learnMore:"Learn more"},no=ut.i18n.registerUIStrings("panels/recorder/components/CreateRecordingView.ts",L),N=ut.i18n.getLocalizedString.bind(void 0,no),Qt=(t,e,s)=>{let{name:o,selectorAttribute:i,selectorTypes:r,error:n,onUpdate:c,onRecordingStarted:d,onRecordingCancelled:E,onErrorReset:w}=t,b=io(),x=y=>{n&&w(),y.key==="Enter"&&(d(),y.stopPropagation(),y.preventDefault())};e.focusInput=()=>{b.value?.focus()};let I=new Map([[P.Schema.SelectorType.ARIA,N(L.selectorTypeARIA)],[P.Schema.SelectorType.CSS,N(L.selectorTypeCSS)],[P.Schema.SelectorType.Text,N(L.selectorTypeText)],[P.Schema.SelectorType.XPath,N(L.selectorTypeXPath)],[P.Schema.SelectorType.Pierce,N(L.selectorTypePierce)]]);gt.render(lt`
      <style>${Zt}</style>
      <style>${Be.textInputStyles}</style>
      <style>${Be.checkboxStyles}</style>
      <div class="wrapper" jslog=${j.section("create-recording-view")}>
        <div class="header-wrapper">
          <h1>${N(L.createRecording)}</h1>
          <devtools-button
            title=${N(L.cancelRecording)}
            jslog=${j.close().track({click:!0})}
            .data=${{variant:ct.Button.Variant.ICON,size:ct.Button.Size.SMALL,iconName:"cross"}}
            @click=${E}
          ></devtools-button>
        </div>
        <label class="row-label" for="user-flow-name">${N(L.recordingName)}</label>
        <input
          value=${o}
          @focus=${()=>b.value?.select()}
          @keydown=${x}
          jslog=${j.textField("user-flow-name").track({change:!0})}
          class="devtools-text-input"
          id="user-flow-name"
          ${oo(b)}
          @input=${y=>c({name:y.target.value.trim()})}
        />
        <label class="row-label" for="selector-attribute">
          <span>${N(L.selectorAttribute)}</span>
          <devtools-link
            class="link" href="https://g.co/devtools/recorder#selector"
            title=${N(L.learnMore)}
            .jslogContext=${"recorder-selector-help"}>
            <devtools-icon name="help">
            </devtools-icon>
          </devtools-link>
        </label>
        <input
          value=${i}
          placeholder="data-testid"
          @keydown=${x}
          jslog=${j.textField("selector-attribute").track({change:!0})}
          class="devtools-text-input"
          id="selector-attribute"
          @input=${y=>c({selectorAttribute:y.target.value.trim()})}
        />
        <label class="row-label">
          <span>${N(L.selectorTypes)}</span>
          <devtools-link
            class="link" href="https://g.co/devtools/recorder#selector"
            title=${N(L.learnMore)}
            .jslogContext=${"recorder-selector-help"}>
            <devtools-icon name="help">
            </devtools-icon>
          </devtools-link>
        </label>
        <div class="checkbox-container">
          ${ro(r,y=>lt`
              <label class="checkbox-label selector-type">
                <input
                  @keydown=${x}
                  .value=${y.selectorType}
                  jslog=${j.toggle().track({click:!0}).context(`selector-${y.selectorType}`)}
                  ?checked=${y.checked}
                  type="checkbox"
                  @change=${X=>c({selectorType:y.selectorType,checked:X.target.checked})}
                />
                ${I.get(y.selectorType)||y.selectorType}
              </label>
            `)}
        </div>
        ${n&&lt` <div class="error" role="alert"> ${n.message} </div>`}
      </div>
      <div class="footer">
        <div class="controls">
          <devtools-widget
            class="control-button"
            .widgetConfig=${ht.Widget.widgetConfig(le,{label:N(L.startRecording),shape:"circle",onClick:d})}
            jslog=${j.action(dt.RecorderActions.START_RECORDING).track({click:!0})}
            title=${P.Tooltip.getTooltipForActions(N(L.startRecording),dt.RecorderActions.START_RECORDING)}
          ></devtools-widget>
        </div>
      </div>
    `,s)},pt=class extends ht.Widget.Widget{#o;#e="";#t="";#s=[];#i;#n={};#r;onRecordingStarted=()=>{};onRecordingCancelled=()=>{};set recorderSettings(e){this.#r=e,this.#e=this.#r.defaultTitle,this.#t=this.#r.selectorAttribute,this.#s=Object.values(P.Schema.SelectorType).map(s=>({selectorType:s,checked:this.#r?.getSelectorByType(s)??!0})),this.requestUpdate()}constructor(e,s){super(e,{useShadowDom:!0}),this.#i=s||Qt}wasShown(){super.wasShown(),this.requestUpdate(),this.updateComplete.then(()=>this.#n.focusInput?.())}startRecording(){if(!this.#r)throw new Error("settings not set");if(!this.#e.trim()){this.#o=new Error(N(L.recordingNameIsRequired)),this.requestUpdate();return}let e=this.#s.filter(o=>o.checked).map(o=>o.selectorType);if(!e.includes(P.Schema.SelectorType.CSS)&&!e.includes(P.Schema.SelectorType.XPath)&&!e.includes(P.Schema.SelectorType.Pierce)){this.#o=new Error(N(L.includeNecessarySelectors)),this.requestUpdate();return}for(let o of Object.values(P.Schema.SelectorType))this.#r.setSelectorByType(o,e.includes(o));let s=this.#t.trim();s&&(this.#r.selectorAttribute=s),this.onRecordingStarted({name:this.#e,selectorTypesToRecord:e,selectorAttribute:this.#t?this.#t:void 0}),Ve.UserBadges.instance().recordAction(Ve.BadgeAction.RECORDER_RECORDING_STARTED)}performUpdate(){this.#i({name:this.#e,selectorAttribute:this.#t,selectorTypes:this.#s,error:this.#o,onRecordingCancelled:this.onRecordingCancelled,onUpdate:e=>{"name"in e?this.#e=e.name:"selectorAttribute"in e?this.#t=e.selectorAttribute:this.#s=this.#s.map(s=>s.selectorType===e.selectorType?{...s,checked:e.checked}:s),this.requestUpdate()},onRecordingStarted:()=>{this.startRecording()},onErrorReset:()=>{this.#o=void 0,this.requestUpdate()}},this.#n,this.contentElement)}};var as={};Y(as,{CreateRecordingEvent:()=>je,DEFAULT_VIEW:()=>ns,DeleteRecordingEvent:()=>_e,OpenRecordingEvent:()=>ze,PlayRecordingEvent:()=>qe,RecordingListView:()=>vt});import"./../../../ui/kit/kit.js";import*as ft from"./../../../core/i18n/i18n.js";import*as Fe from"./../../../ui/components/buttons/buttons.js";import*as ss from"./../../../ui/legacy/legacy.js";import*as bt from"./../../../ui/lit/lit.js";import*as os from"./../../../ui/visual_logging/visual_logging.js";import*as is from"./../models/models.js";import*as rs from"./../recorder-actions/recorder-actions.js";var ts=`@scope to (devtools-widget > *){*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}*:focus,
  *:focus-visible{outline:none}.wrapper{padding:24px}.header{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}h1{font-size:16px;line-height:19px;color:var(--sys-color-on-surface);font-weight:normal}.icon,
  .icon devtools-icon{width:20px;height:20px;color:var(--sys-color-primary)}.table{margin-top:35px}.title{font-size:13px;color:var(--sys-color-on-surface);margin-left:10px;flex:1;overflow-x:hidden;white-space:nowrap;text-overflow:ellipsis}.row{display:flex;align-items:center;padding-right:5px;height:28px;border-bottom:1px solid var(--sys-color-divider)}.row:focus-within,
  .row:hover{background-color:var(--sys-color-state-hover-on-subtle)}.row:last-child{border-bottom:none}.actions{display:flex;align-items:center}.actions button{border:none;background-color:transparent;width:24px;height:24px;border-radius:50%}.actions .divider{width:1px;height:17px;background-color:var(--sys-color-divider);margin:0 6px}}
/*# sourceURL=${import.meta.resolve("./recordingListView.css")} */`;var{html:mt}=bt,ce={savedRecordings:"Saved recordings",createRecording:"Create a new recording",playRecording:"Play recording",deleteRecording:"Delete recording",openRecording:"Open recording"},ao=ft.i18n.registerUIStrings("panels/recorder/components/RecordingListView.ts",ce),ge=ft.i18n.getLocalizedString.bind(void 0,ao),je=class t extends Event{static eventName="createrecording";constructor(){super(t.eventName,{composed:!0,bubbles:!0})}},_e=class t extends Event{constructor(e){super(t.eventName,{composed:!0,bubbles:!0}),this.storageName=e}static eventName="deleterecording"},ze=class t extends Event{constructor(e){super(t.eventName,{composed:!0,bubbles:!0}),this.storageName=e}static eventName="openrecording"},qe=class t extends Event{constructor(e){super(t.eventName,{composed:!0,bubbles:!0}),this.storageName=e}static eventName="playrecording"},ns=(t,e,s)=>{let{recordings:o,replayAllowed:i,onCreateClick:r,onDeleteClick:n,onOpenClick:c,onPlayRecordingClick:d,onKeyDown:E}=t;bt.render(mt`
      <style>${ts}</style>
      <div class="wrapper">
        <div class="header">
          <h1>${ge(ce.savedRecordings)}</h1>
          <devtools-button
            .variant=${Fe.Button.Variant.PRIMARY}
            @click=${r}
            title=${is.Tooltip.getTooltipForActions(ge(ce.createRecording),rs.RecorderActions.CREATE_RECORDING)}
            .jslogContext=${"create-recording"}
          >
            ${ge(ce.createRecording)}
          </devtools-button>
        </div>
        <div class="table">
          ${o.map(w=>mt`
                <div
                  role="button"
                  tabindex="0"
                  aria-label=${ge(ce.openRecording)}
                  class="row"
                  @keydown=${b=>E(w.storageName,b)}
                  @click=${b=>c(w.storageName,b)}
                  jslog=${os.item().track({click:!0,resize:!0}).context("recording")}>
                  <div class="icon">
                    <devtools-icon name="flow">
                    </devtools-icon>
                  </div>
                  <div class="title">${w.name}</div>
                  <div class="actions">
                    ${i?mt`
                              <devtools-button
                                title=${ge(ce.playRecording)}
                                .data=${{variant:Fe.Button.Variant.ICON,iconName:"play",jslogContext:"play-recording"}}
                                @click=${b=>d(w.storageName,b)}
                                @keydown=${b=>b.stopPropagation()}
                              ></devtools-button>
                              <div class="divider"></div>`:""}
                    <devtools-button
                      class="delete-recording-button"
                      title=${ge(ce.deleteRecording)}
                      .data=${{variant:Fe.Button.Variant.ICON,iconName:"bin",jslogContext:"delete-recording"}}
                      @click=${b=>n(w.storageName,b)}
                      @keydown=${b=>b.stopPropagation()}
                    ></devtools-button>
                  </div>
                </div>
              `)}
        </div>
      </div>
    `,s)},vt=class extends ss.Widget.Widget{#o=[];#e=!0;#t;constructor(e,s){super(e,{useShadowDom:!0}),this.#t=s||ns}set recordings(e){this.#o=e,this.performUpdate()}set replayAllowed(e){this.#e=e,this.performUpdate()}#s(){this.contentElement.dispatchEvent(new je)}#i(e,s){s.stopPropagation(),this.contentElement.dispatchEvent(new _e(e))}#n(e,s){s.stopPropagation(),this.contentElement.dispatchEvent(new ze(e))}#r(e,s){s.stopPropagation(),this.contentElement.dispatchEvent(new qe(e))}#a(e,s){s.key==="Enter"&&this.#n(e,s)}performUpdate(){this.#t({recordings:this.#o,replayAllowed:this.#e,onCreateClick:this.#s.bind(this),onDeleteClick:this.#i.bind(this),onOpenClick:this.#n.bind(this),onPlayRecordingClick:this.#r.bind(this),onKeyDown:this.#a.bind(this)},{},this.contentElement)}wasShown(){super.wasShown(),this.performUpdate()}};var eo={};Y(eo,{DEFAULT_VIEW:()=>Qs,RecordingView:()=>Wt,TargetPanel:()=>Zs});import"./../../../ui/kit/kit.js";import"./../../../ui/legacy/legacy.js";import"./../../../ui/kit/kit.js";import*as $t from"./../../../core/i18n/i18n.js";import*as yt from"./../../../ui/components/buttons/buttons.js";import*as kt from"./../../../ui/lit/lit.js";import*as Ke from"./../../../ui/visual_logging/visual_logging.js";import*as We from"./../extensions/extensions.js";var ls=`*{margin:0;padding:0;outline:none;box-sizing:border-box;font-size:inherit}.extension-view{display:flex;flex-direction:column;height:100%}main{flex:1}iframe{border:none;height:100%;width:100%}header{display:flex;padding:3px 8px;justify-content:space-between;border-bottom:1px solid var(--sys-color-divider)}header > div{align-self:center}.icon{display:block;width:16px;height:16px;color:var(--sys-color-secondary)}.title{display:flex;flex-direction:row;gap:6px;color:var(--sys-color-secondary);align-items:center;font-weight:500}
/*# sourceURL=${import.meta.resolve("./extensionView.css")} */`;var{html:lo}=kt,wt={closeView:"Close",extension:"Content provided by a browser extension"},co=$t.i18n.registerUIStrings("panels/recorder/components/ExtensionView.ts",wt),cs=$t.i18n.getLocalizedString.bind(void 0,co),St=class t extends Event{static eventName="recorderextensionviewclosed";constructor(){super(t.eventName,{bubbles:!0,composed:!0})}},xt=class extends HTMLElement{#o=this.attachShadow({mode:"open"});#e;constructor(){super(),this.setAttribute("jslog",`${Ke.section("extension-view")}`)}connectedCallback(){this.#s()}disconnectedCallback(){this.#e&&We.ExtensionManager.ExtensionManager.instance().getView(this.#e.id).hide()}set descriptor(e){this.#e=e,this.#s(),We.ExtensionManager.ExtensionManager.instance().getView(e.id).show()}#t(){this.dispatchEvent(new St)}#s(){if(!this.#e)return;let e=We.ExtensionManager.ExtensionManager.instance().getView(this.#e.id).frame();kt.render(lo`
        <style>${ls}</style>
        <div class="extension-view">
          <header>
            <div class="title">
              <devtools-icon
                class="icon"
                title=${cs(wt.extension)}
                name="extension">
              </devtools-icon>
              ${this.#e.title}
            </div>
            <devtools-button
              title=${cs(wt.closeView)}
              jslog=${Ke.close().track({click:!0})}
              .data=${{variant:yt.Button.Variant.ICON,size:yt.Button.Size.SMALL,iconName:"cross"}}
              @click=${this.#t}
            ></devtools-button>
          </header>
          <main>
            ${e}
          </main>
      </div>
    `,this.#o,{host:this})}};customElements.define("devtools-recorder-extension-view",xt);import*as rt from"./../../../core/host/host.js";import*as $e from"./../../../core/i18n/i18n.js";import*as Kt from"./../../../core/platform/platform.js";import*as z from"./../../../core/sdk/sdk.js";import*as ke from"./../../../third_party/codemirror.next/codemirror.next.js";import*as ae from"./../../../ui/components/buttons/buttons.js";import*as Hs from"./../../../ui/components/code_highlighter/code_highlighter.js";import*as Xs from"./../../../ui/components/dialogs/dialogs.js";import*as Ys from"./../../../ui/components/input/input.js";import*as nt from"./../../../ui/components/text_editor/text_editor.js";import*as H from"./../../../ui/legacy/legacy.js";import*as R from"./../../../ui/lit/lit.js";import*as S from"./../../../ui/visual_logging/visual_logging.js";import*as F from"./../models/models.js";import*as me from"./../../../core/common/common.js";import*as se from"./../../../core/sdk/sdk.js";import*as ps from"./../../../services/puppeteer/puppeteer.js";import*as Ge from"./../../../third_party/puppeteer-replay/puppeteer-replay.js";var q=(t=>(t.NORMAL="normal",t.SLOW="slow",t.VERY_SLOW="very_slow",t.EXTREMELY_SLOW="extremely_slow",t))(q||{}),po={normal:0,slow:500,very_slow:1e3,extremely_slow:2e3};var uo=5e3;function ho(t){return me.ParsedURL.schemeIs(t.url,"devtools:")||t.type==="page"||t.type==="background_page"||t.type==="webview"}var ds=class t extends me.ObjectWrapper.ObjectWrapper{userFlow;speed;timeout;breakpointIndexes;steppingOver=!1;aborted=!1;#o=Promise.withResolvers();#e=Promise.withResolvers();#t;constructor(e,{speed:s,breakpointIndexes:o=new Set}){super(),this.userFlow=e,this.speed=s,this.timeout=e.timeout||uo,this.breakpointIndexes=o}#s(){this.#o.resolve(),this.#o=Promise.withResolvers()}static async connectPuppeteer(){let e=se.TargetManager.TargetManager.instance().rootTarget();if(!e)throw new Error("Could not find the root target");let s=se.TargetManager.TargetManager.instance().primaryPageTarget();if(!s)throw new Error("Could not find the primary page target");let o=s.model(se.ChildTargetManager.ChildTargetManager);if(!o)throw new Error("Could not get childTargetManager");let i=s.model(se.ResourceTreeModel.ResourceTreeModel);if(!i)throw new Error("Could not get resource tree model");if(!i.mainFrame)throw new Error("Could not find main frame");let n=e.model(se.ChildTargetManager.ChildTargetManager);if(!n)throw new Error("Could not find the child target manager class for the root target");let c=e.router()?.connection;if(!c)throw new Error("Expected root target to have a router");let d=await o.getParentTargetId(),E=await n.getParentTargetId(),{sessionId:w}=await e.targetAgent().invoke_attachToTarget({targetId:E,flatten:!0}),{page:b,browser:x,puppeteerConnection:I}=await ps.PuppeteerConnection.PuppeteerConnectionHelper.connectPuppeteerToConnectionViaTab({connection:c,targetId:E,sessionId:w,isPageTargetCallback:ho});if(!b)throw new Error("could not find main page!");return x.on("targetdiscovered",y=>{y.type==="page"&&y.targetId!==d&&y.openerId===d&&I._createSession(y,!0)}),{page:b,browser:x}}static async disconnectPuppeteer(e){try{let s=await e.pages();for(let o of s){let i=o._client();await i.send("Network.disable"),await i.send("Page.disable"),await i.send("Log.disable"),await i.send("Performance.disable"),await i.send("Runtime.disable"),await i.send("Emulation.clearDeviceMetricsOverride"),await i.send("Emulation.setAutomationOverride",{enabled:!1});for(let r of o.frames()){let n=r.client;await n.send("Network.disable"),await n.send("Page.disable"),await n.send("Log.disable"),await n.send("Performance.disable"),await n.send("Runtime.disable"),await n.send("Emulation.setAutomationOverride",{enabled:!1})}}await e.disconnect()}catch(s){console.error("Error disconnecting Puppeteer",s.message)}}async stop(){await Promise.race([this.#o.promise,this.#e.promise])}get abortPromise(){return this.#e.promise}abort(){this.aborted=!0,this.#e.resolve(),this.#t?.abort()}disposeForTesting(){this.#o.resolve(),this.#e.resolve()}continue(){this.steppingOver=!1,this.#s()}stepOver(){this.steppingOver=!0,this.#s()}updateBreakpointIndexes(e){this.breakpointIndexes=e}async play(){let{page:e,browser:s}=await t.connectPuppeteer();this.aborted=!1;let o=this;class i extends Ge.PuppeteerRunnerExtension{#i;constructor(d,E,{timeout:w,speed:b}){super(d,E,{timeout:w}),this.#i=b}async beforeEachStep(d,E){let{resolve:w,promise:b}=Promise.withResolvers();o.dispatchEventToListeners("Step",{step:d,resolve:w}),await b;let x=E.steps.indexOf(d),I=o.steppingOver||o.breakpointIndexes.has(x),y=d.type!=="setViewport"&&d.type!=="navigate"&&!o.aborted;I?(o.dispatchEventToListeners("Stop"),await o.stop(),o.dispatchEventToListeners("Continue")):y&&await Promise.race([new Promise(X=>setTimeout(X,po[this.#i])),o.abortPromise])}async runStep(d,E){if(!(me.ParsedURL.schemeIs(e?.url(),"devtools:")&&(d.type==="setViewport"||d.type==="navigate"))){if(d.type==="navigate"&&me.ParsedURL.schemeIs(d.url,"chrome:"))throw new Error("Not allowed to replay on chrome:// URLs");await this.page.bringToFront(),await super.runStep(d,E)}}}let r=new i(s,e,{timeout:this.timeout,speed:this.speed});this.#t=await Ge.createRunner(this.userFlow,r);let n;try{await this.#t.run()}catch(c){n=c,console.error("Replay error",c.message)}finally{await t.disconnectPuppeteer(s)}this.aborted?this.dispatchEventToListeners("Abort"):n?this.dispatchEventToListeners("Error",n):this.dispatchEventToListeners("Done")}};import*as Ee from"./../recorder-actions/recorder-actions.js";var us=`@scope to (devtools-widget > *){*{padding:0;margin:0;box-sizing:border-box;font-size:inherit}.wrapper{display:flex;flex-direction:row;flex:1;height:100%}.main{overflow:hidden;display:flex;flex-direction:column;flex:1}.sections{min-height:0;overflow:hidden;background-color:var(--sys-color-cdt-base-container);z-index:0;position:relative;container:sections/inline-size}.section{display:flex;padding:0 16px;gap:8px;position:relative}.section::after{content:'';border-bottom:1px solid var(--sys-color-divider);position:absolute;left:0;right:0;bottom:0;z-index:-1}.section:last-child::after{content:none}.screenshot-wrapper{flex:0 0 80px;padding-top:32px;z-index:2}@container sections (max-width: 400px){.screenshot-wrapper{display:none}}.screenshot{object-fit:cover;object-position:top center;max-width:100%;width:200px;height:auto;border:1px solid var(--sys-color-divider);border-radius:1px}.content{flex:1;min-width:0}.steps{flex:1;position:relative;align-self:flex-start;overflow:visible}.step{position:relative;padding-left:40px;margin:16px 0}.step .action{font-size:13px;line-height:16px;letter-spacing:0.03em}.recording{color:var(--sys-color-primary);font-style:italic;margin-top:8px;margin-bottom:0}.add-assertion-button{margin-top:8px}.details{max-width:240px;display:flex;flex-direction:column;align-items:flex-end}.url{font-size:12px;line-height:16px;letter-spacing:0.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--sys-color-secondary);max-width:100%;margin-bottom:16px}.header{flex-shrink:0;align-items:center;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;padding:16px}.header-title-wrapper{max-width:100%}.header-title{align-items:center;display:flex;flex:1;max-width:100%}.header-title::before{content:'';min-width:12px;height:12px;display:inline-block;background:var(--sys-color-primary);border-radius:50%;margin-right:7px}#title-input{font-family:inherit;field-sizing:content;font-size:18px;line-height:22px;letter-spacing:0.02em;padding:1px 4px;border:1px solid transparent;border-radius:1px;word-break:break-all}#title-input:hover,
  #title-input:focus-visible{border-color:var(--input-outline)}#title-input.has-error{border-color:var(--sys-color-error)}#title-input.disabled{color:var(--sys-color-state-disabled)}.title-input-error-text{margin-top:4px;margin-left:19px;color:var(--sys-color-error)}.title-button-bar{flex-shrink:0;padding-left:2px;display:flex}#title-input:focus + .title-button-bar{display:none}.settings-row{padding:16px 28px;border-bottom:1px solid var(--sys-color-divider);display:flex;flex-flow:row wrap;justify-content:space-between}.settings-title{font-size:14px;line-height:24px;letter-spacing:0.03em;color:var(--sys-color-on-surface);display:flex;align-items:center;align-content:center;gap:5px;width:fit-content}.settings-title:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px}.settings{margin-top:4px;display:flex;flex-wrap:wrap;font-size:12px;line-height:20px;letter-spacing:0.03em;color:var(--sys-color-on-surface-subtle)}.settings.expanded{gap:10px}.settings .separator{width:1px;height:20px;background-color:var(--sys-color-divider);margin:0 5px}.actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.actions .separator{width:1px;height:24px;background-color:var(--sys-color-divider)}.is-recording .header-title::before{background:var(--sys-color-error-bright)}.footer{display:flex;justify-content:center;border-top:1px solid var(--sys-color-divider);padding:12px;background:var(--sys-color-cdt-base-container);z-index:1}.controls{align-items:center;display:flex;justify-content:center;position:relative;width:100%}.chevron{width:14px;height:14px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0)}.editable-setting{display:flex;flex-direction:row;gap:12px;align-items:center}.editable-setting .devtools-text-input{width:fit-content;height:var(--sys-size-9)}.wrapping-label{display:inline-flex;align-items:center;gap:12px}.text-editor{height:100%;overflow:auto}.section-toolbar{display:flex;align-items:center;padding:3px 5px;justify-content:space-between;gap:3px}.section-toolbar > devtools-select-menu{height:24px;min-width:50px}.sections .section-toolbar{justify-content:flex-end}devtools-split-view{flex:1 1 0%;min-height:0}[slot='main']{overflow:hidden auto}[slot='sidebar']{display:flex;flex-direction:column;overflow:auto;height:100%;width:100%}[slot='sidebar'] .section-toolbar{border-bottom:1px solid var(--sys-color-divider)}.show-code{margin-right:14px;margin-top:8px}devtools-recorder-extension-view{flex:1}}
/*# sourceURL=${import.meta.resolve("./recordingView.css")} */`;var ys={};Y(ys,{DEFAULT_VIEW:()=>bs,ReplaySection:()=>Te});import*as Et from"./../../../core/i18n/i18n.js";import*as ms from"./../../../core/platform/platform.js";import*as vs from"./../../../ui/components/buttons/buttons.js";import*as Ye from"./../../../ui/legacy/legacy.js";import*as Ce from"./../../../ui/lit/lit.js";import*as ve from"./../../../ui/visual_logging/visual_logging.js";import*as fs from"./../models/models.js";import*as Tt from"./../recorder-actions/recorder-actions.js";var hs=`.select-button{display:flex;gap:var(--sys-size-6)}.groups-label{display:inline-block;padding:0 var(--sys-size-4) var(--sys-size-4) 0}.select-button devtools-button{position:relative}
/*# sourceURL=${import.meta.resolve("./replaySection.css")} */`;var{html:He,Directives:{ifDefined:go,repeat:gs}}=Ce,D={Replay:"Replay",ReplayNormalButtonLabel:"Normal speed",ReplayNormalItemLabel:"Normal (Default)",ReplaySlowButtonLabel:"Slow speed",ReplaySlowItemLabel:"Slow",ReplayVerySlowButtonLabel:"Very slow speed",ReplayVerySlowItemLabel:"Very slow",ReplayExtremelySlowButtonLabel:"Extremely slow speed",ReplayExtremelySlowItemLabel:"Extremely slow",speedGroup:"Speed",extensionGroup:"Extensions"},mo=Et.i18n.registerUIStrings("panels/recorder/components/ReplaySection.ts",D),_=Et.i18n.getLocalizedString.bind(void 0,mo),Xe="extension",bs=(t,e,s)=>{let{disabled:o,groups:i,selectedItem:r,actionTitle:n,onButtonClick:c,onItemSelected:d}=t,E=vs.Button.Variant.PRIMARY,w=x=>{x.stopPropagation(),c()},b=x=>{x.target instanceof HTMLSelectElement&&d(x.target.value)};Ce.render(He`
      <style>
        ${Ye.inspectorCommonStyles}
      </style>
      <style>
        ${hs}
      </style>
      <div
        class="select-button"
        title=${go(n)}
      >
        <label>
          ${i.length>1?He`
                <div
                  class="groups-label"
                  >${i.map(x=>x.name).join(" & ")}</div>`:Ce.nothing}
          <select
            class="primary"
            ?disabled=${o}
            jslog=${ve.dropDown("network-conditions").track({change:!0})}
            @change=${b}
          >
            ${gs(i,x=>x.name,x=>He`
                <optgroup label=${x.name}>
                  ${gs(x.items,I=>I.value,I=>{let y=I.value===r.value;return He`
                      <option
                        .title=${I.label()}
                        value=${I.value}
                        ?selected=${y}
                        jslog=${ve.item(ms.StringUtilities.toKebabCase(I.value)).track({click:!0})}
                      >
                        ${y&&I.buttonLabel?I.buttonLabel():I.label()}
                      </option>
                    `})}
                </optgroup>
              `)}
          </select>
        </label>
        <devtools-button
          .disabled=${o}
          .variant=${E}
          .iconName=${r.buttonIconName}
          @click=${w}
          jslog=${ve.action(Tt.RecorderActions.REPLAY_RECORDING).track({click:!0})}
        >
          ${_(D.Replay)}
        </devtools-button>
      </div>`,s)},Te=class extends Ye.Widget.Widget{onStartReplay;#o=!1;#e;#t=[];#s;#i=[];constructor(e,s){super(e,{useShadowDom:!0}),this.#s=s||bs,this.#i=this.#n()}set settings(e){this.#e=e,this.performUpdate()}set replayExtensions(e){this.#t=e,this.#i=this.#n(),this.performUpdate()}get disabled(){return this.#o}set disabled(e){this.#o=e,this.performUpdate()}wasShown(){super.wasShown(),this.performUpdate()}performUpdate(){let e=this.#r();this.#s({disabled:this.#o,groups:this.#i,selectedItem:e,actionTitle:fs.Tooltip.getTooltipForActions(e.label(),Tt.RecorderActions.REPLAY_RECORDING),onButtonClick:()=>this.#a(),onItemSelected:s=>this.#l(s)},void 0,this.contentElement)}#n(){let e=[{name:_(D.speedGroup),items:[{value:q.NORMAL,buttonIconName:"play",buttonLabel:()=>_(D.ReplayNormalButtonLabel),label:()=>_(D.ReplayNormalItemLabel)},{value:q.SLOW,buttonIconName:"play",buttonLabel:()=>_(D.ReplaySlowButtonLabel),label:()=>_(D.ReplaySlowItemLabel)},{value:q.VERY_SLOW,buttonIconName:"play",buttonLabel:()=>_(D.ReplayVerySlowButtonLabel),label:()=>_(D.ReplayVerySlowItemLabel)},{value:q.EXTREMELY_SLOW,buttonIconName:"play",buttonLabel:()=>_(D.ReplayExtremelySlowButtonLabel),label:()=>_(D.ReplayExtremelySlowItemLabel)}]}];return this.#t.length&&e.push({name:_(D.extensionGroup),items:this.#t.map((s,o)=>({value:Xe+o,buttonIconName:"play",buttonLabel:()=>s.getName(),label:()=>s.getName()}))}),e}#r(){let e=this.#e?.replayExtension||this.#e?.speed||"";for(let s of this.#i)for(let o of s.items)if(o.value===e)return o;return this.#i[0].items[0]}#a(){let e=this.#e?.replayExtension||this.#e?.speed||"";if(e?.startsWith(Xe)){let s=Number(e.substring(Xe.length)),o=this.#t[s];this.#e&&(this.#e.replayExtension=Xe+s),this.onStartReplay&&this.onStartReplay(q.NORMAL,o)}else this.onStartReplay&&this.onStartReplay(this.#e?this.#e.speed:q.NORMAL);this.performUpdate()}#l(e){let s=e;this.#e&&s&&(this.#e.speed=s,this.#e.replayExtension=""),this.performUpdate()}};var Gs={};Y(Gs,{AddBreakpointEvent:()=>Ue,AddStep:()=>Ne,AddStepPosition:()=>Ws,CaptureSelectorsEvent:()=>_t,CopyStepEvent:()=>st,DEFAULT_VIEW:()=>Ks,RemoveBreakpointEvent:()=>Pe,RemoveStep:()=>it,State:()=>A,StepChanged:()=>ot,StepView:()=>xe});import"./../../../ui/kit/kit.js";var Bs={};Y(Bs,{EditorState:()=>pe,StepEditedEvent:()=>et,StepEditor:()=>ue});import*as Vt from"./../../../core/i18n/i18n.js";import*as Bt from"./../../../core/platform/platform.js";import*as we from"./../../../ui/components/buttons/buttons.js";import*as Qe from"./../../../ui/components/suggestion_input/suggestion_input.js";import*as Ps from"./../../../ui/legacy/legacy.js";import*as xo from"./../../../ui/lit/lit.js";import*as T from"./../../../ui/visual_logging/visual_logging.js";import*as $ from"./../models/models.js";import*as Os from"./../util/util.js";var Es={};Y(Es,{DEFAULT_VIEW:()=>ks,RequestSelectorAttributeEvent:()=>Re,SelectorPicker:()=>Ie});import*as Rt from"./../../../core/common/common.js";import*as Lt from"./../../../core/i18n/i18n.js";import*as Je from"./../../../core/platform/platform.js";import*as V from"./../../../core/sdk/sdk.js";import*as It from"./../../../ui/components/buttons/buttons.js";import*as Ss from"./../../../ui/legacy/legacy.js";import*as Mt from"./../../../ui/lit/lit.js";import*as xs from"./../../../ui/visual_logging/visual_logging.js";import*as fe from"./../models/models.js";import*as J from"./../util/util.js";var ws=`:host{display:inline-block}.selector-picker{width:18px;height:18px}
/*# sourceURL=${import.meta.resolve("./selectorPicker.css")} */`;var{html:vo}=Mt,Ct="captureSelectors",Re=class t extends Event{static eventName="requestselectorattribute";send;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.send=e}},$s={selectorPicker:"Select an element in the page to update selectors"},fo=Lt.i18n.registerUIStrings("panels/recorder/components/SelectorPicker.ts",$s),bo=Lt.i18n.getLocalizedString.bind(void 0,fo),ks=(t,e,s)=>{let{active:o,disabled:i,onClick:r}=t;Mt.render(vo`
      <style>${ws}</style>
      <devtools-button
        @click=${r}
        .title=${bo($s.selectorPicker)}
        class="selector-picker"
        .size=${It.Button.Size.SMALL}
        .iconName=${"select-element"}
        .active=${o}
        .disabled=${i}
        .variant=${It.Button.Variant.ICON}
        jslog=${xs.toggle("selector-picker").track({click:!0})}
      ></devtools-button>
    `,s)},Ie=class t extends Ss.Widget.Widget{#o;#e=!1;#t=!1;#s;#i=new Rt.Mutex.Mutex;#n=new Map;#r=new Map;onSelectorPicked;onAttributeRequested;constructor(e,s){super(e,{useShadowDom:!0}),this.#o=s||ks}static get#a(){return V.TargetManager.TargetManager.instance()}set disabled(e){this.#e=e,this.requestUpdate()}performUpdate(){this.#o({active:this.#t,disabled:this.#e,onClick:this.#l.bind(this)},{},this.contentElement)}#l(e){e.preventDefault(),e.stopPropagation(),this.#c()}async#c(){return this.#t?await this.#d():await this.#u()}#u=()=>this.#i.run(async()=>{this.#t||(this.#t=!0,this.#s=await new Promise((e,s)=>{let o=setTimeout(s,1e3);this.onAttributeRequested?this.onAttributeRequested(i=>{clearTimeout(o),e(i)}):(clearTimeout(o),e(void 0))}),t.#a.observeTargets(this),this.requestUpdate())});#d=()=>this.#i.run(async()=>{this.#t&&(this.#t=!1,t.#a.unobserveTargets(this),t.#a.targets().map(this.targetRemoved.bind(this)),this.#s=void 0,this.requestUpdate())});targetAdded(e){if(e.type()!==V.Target.Type.FRAME)return;let s=this.#n.get(e);s||(s=new Rt.Mutex.Mutex,this.#n.set(e,s)),s.run(async()=>{await this.#v(e),await this.#g(e)})}targetRemoved(e){let s=this.#n.get(e);s&&s.run(async()=>{try{await this.#m(e),await this.#f(e)}catch{}})}#p=e=>{if(e.data.name!==Ct)return;let s=e.data.executionContextId,o=V.TargetManager.TargetManager.instance().targets(),i=fe.SDKUtils.findTargetByExecutionContext(o,s),r=fe.SDKUtils.findFrameIdByExecutionContext(o,s);if(!i||!r)throw new Error(`No execution context found for the binding call + ${JSON.stringify(e.data)}`);let n=i.model(V.ResourceTreeModel.ResourceTreeModel);if(!n)throw new Error(`ResourceTreeModel instance is missing for the target: ${i.id()}`);let c=n.frameForId(r);if(!c)throw new Error("Frame is not found");this.onSelectorPicked&&this.onSelectorPicked({...JSON.parse(e.data.payload),...fe.SDKUtils.getTargetFrameContext(i,c)}),this.#d()};async#g(e){let o=`${await J.InjectedScript.get()};DevToolsRecorder.startSelectorPicker({getAccessibleName, getAccessibleRole}, ${JSON.stringify(this.#s?this.#s:void 0)}, ${J.isDebugBuild})`,[{identifier:i}]=await Promise.all([e.pageAgent().invoke_addScriptToEvaluateOnNewDocument({source:o,worldName:J.DEVTOOLS_RECORDER_WORLD_NAME,includeCommandLineAPI:!0}),fe.SDKUtils.evaluateInAllFrames(J.DEVTOOLS_RECORDER_WORLD_NAME,e,o)]);this.#r.set(e,i)}async#m(e){let s=this.#r.get(e);Je.assertNotNullOrUndefined(s),this.#r.delete(e),await e.pageAgent().invoke_removeScriptToEvaluateOnNewDocument({identifier:s}),await fe.SDKUtils.evaluateInAllFrames(J.DEVTOOLS_RECORDER_WORLD_NAME,e,"DevToolsRecorder.stopSelectorPicker()")}async#v(e){let s=e.model(V.RuntimeModel.RuntimeModel);Je.assertNotNullOrUndefined(s),s.addEventListener(V.RuntimeModel.Events.BindingCalled,this.#p),await s.addBinding({name:Ct,executionContextName:J.DEVTOOLS_RECORDER_WORLD_NAME})}async#f(e){await e.runtimeAgent().invoke_removeBinding({name:Ct});let s=e.model(V.RuntimeModel.RuntimeModel);Je.assertNotNullOrUndefined(s),s.removeEventListener(V.RuntimeModel.Events.BindingCalled,this.#p)}wasShown(){super.wasShown(),this.requestUpdate()}wasHidden(){super.wasHidden(),this.#d()}};var Ts=`*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:block}.row{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.row devtools-button{line-height:1;margin-left:0.5em}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}.padded{margin-left:2em}.padded.double{margin-left:4em}.inline-button{width:18px;height:18px;opacity:0%;visibility:hidden;transition:opacity 200ms;flex-shrink:0}.row:focus-within .inline-button,
.row:hover .inline-button{opacity:100%;visibility:visible}.wrapped.row{flex-wrap:wrap}.gap.row{gap:5px}.gap.row devtools-button{margin-left:0}.regular-font{font-family:inherit;font-size:inherit}.no-margin{margin:0}.row-buttons{margin-top:3px}.error{margin:3px 0 6px;padding:8px 12px;background:var(--sys-color-error-container);color:var(--sys-color-error)}
/*# sourceURL=${import.meta.resolve("./stepEditor.css")} */`;function be(t,e="Assertion failed!"){if(!t)throw new Error(e)}var ye=t=>{for(let e of Reflect.ownKeys(t)){let s=t[e];(s&&typeof s=="object"||typeof s=="function")&&ye(s)}return Object.freeze(t)},oe=class{value;constructor(e){this.value=e}},k=class{value;constructor(e){this.value=e}},Z=(t,e)=>{if(e instanceof k){be(Array.isArray(t),`Expected an array. Got ${typeof t}.`);let s=[...t],o=Object.keys(e.value).sort((i,r)=>Number(r)-Number(i));for(let i of o){let r=e.value[Number(i)];r===void 0?s.splice(Number(i),1):r instanceof oe?s.splice(Number(i),0,r.value):s[Number(i)]=Z(s[i],r)}return Object.freeze(s)}if(typeof e=="object"&&!Array.isArray(e)){be(!Array.isArray(t),"Expected an object. Got an array.");let s={...t},o=Object.keys(e);for(let i of o){let r=e[i];r===void 0?delete s[i]:s[i]=Z(s[i],r)}return Object.freeze(s)}return e};var yo=Object.defineProperty,wo=Object.getOwnPropertyDescriptor,Rs=t=>{throw TypeError(t)},Le=(t,e,s,o)=>{for(var i=o>1?void 0:o?wo(e,s):e,r=t.length-1,n;r>=0;r--)(n=t[r])&&(i=(o?n(e,s,i):n(i))||i);return o&&i&&yo(e,s,i),i},Nt=(t,e,s)=>e.has(t)||Rs("Cannot "+s),f=(t,e,s)=>(Nt(t,e,"read from private field"),s?s.call(t):e.get(t)),W=(t,e,s)=>e.has(t)?Rs("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,s),So=(t,e,s,o)=>(Nt(t,e,"write to private field"),o?o.call(t,s):e.set(t,s),s),l=(t,e,s)=>(Nt(t,e,"access private method"),s),G,a,de,Ut,Pt,K,At,ee,Ot,Dt,Q,Se,Is,v,Ls,Ms,As,Ns,Us,Ze,{html:M,Decorators:$o,Directives:ko,LitElement:Eo}=xo,{customElement:To,property:Ds,state:Vs}=$o,{live:ie}=ko,{widget:Co}=Ps.Widget,Ro=Object.freeze({string:t=>t.trim(),number:t=>{let e=parseFloat(t);return Number.isNaN(e)?0:e},boolean:t=>t.toLowerCase()==="true"}),Cs=Object.freeze({selectors:"string",offsetX:"number",offsetY:"number",target:"string",frame:"number",assertedEvents:"string",value:"string",key:"string",operator:"string",count:"number",expression:"string",x:"number",y:"number",url:"string",type:"string",timeout:"number",duration:"number",button:"string",deviceType:"string",width:"number",height:"number",deviceScaleFactor:"number",isMobile:"boolean",hasTouch:"boolean",isLandscape:"boolean",download:"number",upload:"number",latency:"number",name:"string",parameters:"string",visible:"boolean",properties:"string",attributes:"string"}),C=ye({selectors:[[".cls"]],offsetX:1,offsetY:1,target:"main",frame:[0],assertedEvents:[{type:"navigation",url:"https://example.com",title:"Title"}],value:"Value",key:"Enter",operator:">=",count:1,expression:"true",x:0,y:0,url:"https://example.com",timeout:5e3,duration:50,deviceType:"mouse",button:"primary",type:"click",width:800,height:600,deviceScaleFactor:1,isMobile:!1,hasTouch:!1,isLandscape:!0,download:1e3,upload:1e3,latency:25,name:"customParam",parameters:"{}",properties:"{}",attributes:[{name:"attribute",value:"value"}],visible:!0}),Ft=ye({[$.Schema.StepType.Click]:{required:["selectors","offsetX","offsetY"],optional:["assertedEvents","button","deviceType","duration","frame","target","timeout"]},[$.Schema.StepType.DoubleClick]:{required:["offsetX","offsetY","selectors"],optional:["assertedEvents","button","deviceType","frame","target","timeout"]},[$.Schema.StepType.Hover]:{required:["selectors"],optional:["assertedEvents","frame","target","timeout"]},[$.Schema.StepType.Change]:{required:["selectors","value"],optional:["assertedEvents","frame","target","timeout"]},[$.Schema.StepType.KeyDown]:{required:["key"],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.KeyUp]:{required:["key"],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.Scroll]:{required:[],optional:["assertedEvents","frame","target","timeout","x","y"]},[$.Schema.StepType.Close]:{required:[],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.Navigate]:{required:["url"],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.WaitForElement]:{required:["selectors"],optional:["assertedEvents","attributes","count","frame","operator","properties","target","timeout","visible"]},[$.Schema.StepType.WaitForExpression]:{required:["expression"],optional:["assertedEvents","frame","target","timeout"]},[$.Schema.StepType.CustomStep]:{required:["name","parameters"],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.EmulateNetworkConditions]:{required:["download","latency","upload"],optional:["assertedEvents","target","timeout"]},[$.Schema.StepType.SetViewport]:{required:["deviceScaleFactor","hasTouch","height","isLandscape","isMobile","width"],optional:["assertedEvents","target","timeout"]}}),O={notSaved:"Not saved: {error}",addAttribute:"Add {attributeName}",deleteRow:"Delete row",addFrameIndex:"Add frame index within the frame tree",removeFrameIndex:"Remove frame index",addSelectorPart:"Add a selector part",removeSelectorPart:"Remove a selector part",addSelector:"Add a selector",removeSelector:"Remove a selector",unknownActionType:"Unknown action type."},Io=Vt.i18n.registerUIStrings("panels/recorder/components/StepEditor.ts",O),B=Vt.i18n.getLocalizedString.bind(void 0,Io),et=class t extends Event{static eventName="stepedited";data;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.data=e}},Lo=t=>JSON.parse(JSON.stringify(t)),pe=class{static#o=new Os.SharedObject.SharedObject(()=>$.RecordingPlayer.RecordingPlayer.connectPuppeteer(),({browser:e})=>$.RecordingPlayer.RecordingPlayer.disconnectPuppeteer(e));static async default(e){let s={type:e},o=Ft[s.type],i=Promise.resolve();for(let r of o.required)i=Promise.all([i,(async()=>Object.assign(s,{[r]:await this.defaultByAttribute(s,r)}))()]);return await i,Object.freeze(s)}static async defaultByAttribute(e,s){return await this.#o.run(o=>{switch(s){case"assertedEvents":return Z(C.assertedEvents,new k({0:{url:o.page.url()||C.assertedEvents[0].url}}));case"url":return o.page.url()||C.url;case"height":return o.page.evaluate(()=>visualViewport.height)||C.height;case"width":return o.page.evaluate(()=>visualViewport.width)||C.width;default:return C[s]}})}static fromStep(e){let s=structuredClone(e);for(let o of["parameters","properties"])o in e&&e[o]!==void 0&&(s[o]=JSON.stringify(e[o]));if("attributes"in e&&e.attributes){s.attributes=[];for(let[o,i]of Object.entries(e.attributes))s.attributes.push({name:o,value:i})}return"selectors"in e&&(s.selectors=e.selectors.map(o=>typeof o=="string"?[o]:[...o])),ye(s)}static toStep(e){let s=structuredClone(e);for(let o of["parameters","properties"]){let i=e[o];i&&Object.assign(s,{[o]:JSON.parse(i)})}if(e.attributes)if(e.attributes.length!==0){let o={};for(let{name:i,value:r}of e.attributes)Object.assign(o,{[i]:r});Object.assign(s,{attributes:o})}else"attributes"in s&&delete s.attributes;if(e.selectors){let o=e.selectors.filter(i=>i.length>0).map(i=>i.length===1?i[0]:[...i]);o.length!==0?Object.assign(s,{selectors:o}):"selectors"in s&&delete s.selectors}return e.frame?.length===0&&"frame"in s&&delete s.frame,Lo($.SchemaUtils.parseStep(s))}},ue=class extends Eo{constructor(){super(),W(this,a),W(this,G,new Set),W(this,Ut,t=>{l(this,a,de).call(this,Z(this.state,{target:t.target,frame:t.frame,selectors:t.selectors.map(e=>typeof e=="string"?[e]:e),offsetX:t.offsetX,offsetY:t.offsetY}))}),W(this,Pt,t=>{this.dispatchEvent(new Re(t))}),W(this,K,(t,e)=>s=>{s.preventDefault(),s.stopPropagation(),l(this,a,de).call(this,Z(this.state,t)),f(this,Ze).call(this,e)}),W(this,At,t=>{if(be(t instanceof KeyboardEvent),t.target instanceof Qe.SuggestionInput.SuggestionInput&&t.key==="Enter"){t.preventDefault(),t.stopPropagation();let e=this.renderRoot.querySelectorAll("devtools-suggestion-input"),s=[...e].findIndex(o=>o===t.target);s>=0&&s+1<e.length?e[s+1].focus():t.target.blur()}}),W(this,ee,t=>e=>{if(be(e.target instanceof Qe.SuggestionInput.SuggestionInput),e.target.disabled)return;let s=Cs[t.attribute],o=Ro[s](e.target.value),i=t.from.bind(this)(o);i&&l(this,a,de).call(this,Z(this.state,i))}),W(this,Ot,async t=>{if(be(t.target instanceof Qe.SuggestionInput.SuggestionInput),t.target.disabled)return;let e=t.target.value;if(e!==this.state.type){if(!Object.values($.Schema.StepType).includes(e)){this.error=B(O.unknownActionType);return}l(this,a,de).call(this,await pe.default(e))}}),W(this,Dt,async t=>{t.preventDefault(),t.stopPropagation();let e=t.target.dataset.attribute;l(this,a,de).call(this,Z(this.state,{[e]:await pe.defaultByAttribute(this.state,e)})),f(this,Ze).call(this,`[data-attribute=${e}].attribute devtools-suggestion-input`)}),W(this,Ze,t=>{this.updateComplete.then(()=>{this.renderRoot.querySelector(t)?.focus()})}),this.state={type:$.Schema.StepType.WaitForElement},this.isTypeEditable=!0,this.disabled=!1}createRenderRoot(){let t=super.createRenderRoot();return t.addEventListener("keydown",f(this,At)),t}set step(t){this.state=ye(pe.fromStep(t)),this.error=void 0}render(){So(this,G,new Set);let t=M`
      <style>${Ts}</style>
      <div class="wrapper" jslog=${T.tree("step-editor")} >
        ${l(this,a,Is).call(this,this.isTypeEditable)} ${l(this,a,v).call(this,"target")}
        ${l(this,a,Ls).call(this)} ${l(this,a,Ms).call(this)}
        ${l(this,a,v).call(this,"deviceType")} ${l(this,a,v).call(this,"button")}
        ${l(this,a,v).call(this,"url")} ${l(this,a,v).call(this,"x")}
        ${l(this,a,v).call(this,"y")} ${l(this,a,v).call(this,"offsetX")}
        ${l(this,a,v).call(this,"offsetY")} ${l(this,a,v).call(this,"value")}
        ${l(this,a,v).call(this,"key")} ${l(this,a,v).call(this,"operator")}
        ${l(this,a,v).call(this,"count")} ${l(this,a,v).call(this,"expression")}
        ${l(this,a,v).call(this,"duration")} ${l(this,a,As).call(this)}
        ${l(this,a,v).call(this,"timeout")} ${l(this,a,v).call(this,"width")}
        ${l(this,a,v).call(this,"height")} ${l(this,a,v).call(this,"deviceScaleFactor")}
        ${l(this,a,v).call(this,"isMobile")} ${l(this,a,v).call(this,"hasTouch")}
        ${l(this,a,v).call(this,"isLandscape")} ${l(this,a,v).call(this,"download")}
        ${l(this,a,v).call(this,"upload")} ${l(this,a,v).call(this,"latency")}
        ${l(this,a,v).call(this,"name")} ${l(this,a,v).call(this,"parameters")}
        ${l(this,a,v).call(this,"visible")} ${l(this,a,v).call(this,"properties")}
        ${l(this,a,Ns).call(this)}
        ${this.error?M`
              <div class="error">
                ${B(O.notSaved,{error:this.error})}
              </div>
            `:void 0}
        ${this.disabled?void 0:M`<div
              class="row-buttons wrapped gap row regular-font no-margin"
            >
              ${l(this,a,Us).call(this)}
            </div>`}
      </div>
    `;for(let e of Object.keys(Cs))if(!f(this,G).has(e))throw new Error(`The editable attribute ${e} does not have UI`);return t}};G=new WeakMap;a=new WeakSet;de=function(t){try{this.dispatchEvent(new et(pe.toStep(t))),this.state=t}catch(e){this.error=e.message}};Ut=new WeakMap;Pt=new WeakMap;K=new WeakMap;At=new WeakMap;ee=new WeakMap;Ot=new WeakMap;Dt=new WeakMap;Q=function(t){if(!this.disabled)return M`
      <devtools-button
        title=${t.title}
        .accessibleLabel=${t.title}
        .size=${we.Button.Size.SMALL}
        .iconName=${t.iconName}
        .variant=${we.Button.Variant.ICON}
        jslog=${T.action(t.class).track({click:!0})}
        class="inline-button ${t.class}"
        @click=${t.onClick}
      ></devtools-button>
    `};Se=function(t){if(!(this.disabled||![...Ft[this.state.type].optional].includes(t)||this.disabled))return M`<devtools-button
      .size=${we.Button.Size.SMALL}
      .iconName=${"bin"}
      .variant=${we.Button.Variant.ICON}
      .title=${B(O.deleteRow)}
      class="inline-button delete-row"
      data-attribute=${t}
      jslog=${T.action("delete").track({click:!0})}
      @click=${o=>{o.preventDefault(),o.stopPropagation(),l(this,a,de).call(this,Z(this.state,{[t]:void 0}))}}
    ></devtools-button>`};Is=function(t){return f(this,G).add("type"),M`<div class="row attribute" data-attribute="type" jslog=${T.treeItem("type").track({resize:!0})}>
      <div id="type">type<span class="separator">:</span></div>
      <devtools-suggestion-input
        aria-labelledby="type"
        .disabled=${!t||this.disabled}
        .options=${Object.values($.Schema.StepType)}
        .placeholder=${C.type}
        .value=${ie(this.state.type)}
        @blur=${f(this,Ot)}
      ></devtools-suggestion-input>
    </div>`};v=function(t){f(this,G).add(t);let e=this.state[t]?.toString();if(e!==void 0)return M`<div class="row attribute" data-attribute=${t} jslog=${T.treeItem(Bt.StringUtilities.toKebabCase(t)).track({resize:!0})}>
      <div id=${t}>${t}<span class="separator">:</span></div>
      <devtools-suggestion-input
        .disabled=${this.disabled}
        aria-labelledby=${t}
        .placeholder=${C[t].toString()}
        .value=${ie(e)}
        .mimeType=${(()=>{switch(t){case"expression":return"text/javascript";case"properties":return"application/json";default:return""}})()}
        @blur=${f(this,ee).call(this,{attribute:t,from(s){if(this.state[t]!==void 0)return{[t]:s}}})}
      ></devtools-suggestion-input>
      ${l(this,a,Se).call(this,t)}
    </div>`};Ls=function(){if(f(this,G).add("frame"),this.state.frame!==void 0)return M`
      <div class="attribute" data-attribute="frame" jslog=${T.treeItem("frame").track({resize:!0})}>
        <div class="row">
          <div id="frame">frame<span class="separator">:</span></div>
          ${l(this,a,Se).call(this,"frame")}
        </div>
        ${this.state.frame.map((t,e,s)=>M`
            <div class="padded row">
              <devtools-suggestion-input
                aria-labelledby="frame"
                .disabled=${this.disabled}
                .placeholder=${C.frame[0].toString()}
                .value=${ie(t.toString())}
                data-path=${`frame.${e}`}
                @blur=${f(this,ee).call(this,{attribute:"frame",from(o){if(this.state.frame?.[e]!==void 0)return{frame:new k({[e]:o})}}})}
              ></devtools-suggestion-input>
              ${l(this,a,Q).call(this,{class:"add-frame",title:B(O.addFrameIndex),iconName:"plus",onClick:f(this,K).call(this,{frame:new k({[e+1]:new oe(C.frame[0])})},`devtools-suggestion-input[data-path="frame.${e+1}"]`)})}
              ${l(this,a,Q).call(this,{class:"remove-frame",title:B(O.removeFrameIndex),iconName:"minus",onClick:f(this,K).call(this,{frame:new k({[e]:void 0})},`devtools-suggestion-input[data-path="frame.${Math.min(e,s.length-2)}"]`)})}
            </div>
          `)}
      </div>
    `};Ms=function(){if(f(this,G).add("selectors"),this.state.selectors!==void 0)return M`<div class="attribute" data-attribute="selectors" jslog=${T.treeItem("selectors")}>
      <div class="row">
        <div>selectors<span class="separator">:</span></div>
        ${Co(Ie,{disabled:this.disabled,onSelectorPicked:f(this,Ut),onAttributeRequested:f(this,Pt)})}
        ${l(this,a,Se).call(this,"selectors")}
      </div>
      ${this.state.selectors.map((t,e,s)=>M`<div class="padded row" data-selector-path=${e}>
            <div id="selector-${e}">selector #${e+1}<span class="separator">:</span></div>
            ${l(this,a,Q).call(this,{class:"add-selector",title:B(O.addSelector),iconName:"plus",onClick:f(this,K).call(this,{selectors:new k({[e+1]:new oe(structuredClone(C.selectors[0]))})},`devtools-suggestion-input[data-path="selectors.${e+1}.0"]`)})}
            ${l(this,a,Q).call(this,{class:"remove-selector",title:B(O.removeSelector),iconName:"minus",onClick:f(this,K).call(this,{selectors:new k({[e]:void 0})},`devtools-suggestion-input[data-path="selectors.${Math.min(e,s.length-2)}.0"]`)})}
          </div>
          ${t.map((o,i,r)=>M`<div
              class="double padded row"
              data-selector-path="${e}.${i}"
            >
              <devtools-suggestion-input
                aria-labelledby="selector-${e}"
                .disabled=${this.disabled}
                .placeholder=${C.selectors[0][0]}
                .value=${ie(o)}
                data-path=${`selectors.${e}.${i}`}
                @blur=${f(this,ee).call(this,{attribute:"selectors",from(n){if(this.state.selectors?.[e]?.[i]!==void 0)return{selectors:new k({[e]:new k({[i]:n})})}}})}
              ></devtools-suggestion-input>
              ${l(this,a,Q).call(this,{class:"add-selector-part",title:B(O.addSelectorPart),iconName:"plus",onClick:f(this,K).call(this,{selectors:new k({[e]:new k({[i+1]:new oe(C.selectors[0][0])})})},`devtools-suggestion-input[data-path="selectors.${e}.${i+1}"]`)})}
              ${l(this,a,Q).call(this,{class:"remove-selector-part",title:B(O.removeSelectorPart),iconName:"minus",onClick:f(this,K).call(this,{selectors:new k({[e]:new k({[i]:void 0})})},`devtools-suggestion-input[data-path="selectors.${e}.${Math.min(i,r.length-2)}"]`)})}
            </div>`)}`)}
    </div>`};As=function(){if(f(this,G).add("assertedEvents"),this.state.assertedEvents!==void 0)return M`<div class="attribute" data-attribute="assertedEvents" jslog=${T.treeItem("asserted-events")}>
      <div class="row">
        <div>asserted events<span class="separator">:</span></div>
        ${l(this,a,Se).call(this,"assertedEvents")}
      </div>
      ${this.state.assertedEvents.map((t,e)=>M` <div class="padded row" jslog=${T.treeItem("event-type")}>
            <div id="event-type">type<span class="separator">:</span></div>
            <div aria-labelledby="event-type">${t.type}</div>
          </div>
          <div class="padded row" jslog=${T.treeItem("event-title")}>
            <div id="event-title">title<span class="separator">:</span></div>
            <devtools-suggestion-input
              aria-labelledby="event-title"
              .disabled=${this.disabled}
              .placeholder=${C.assertedEvents[0].title}
              .value=${ie(t.title??"")}
              @blur=${f(this,ee).call(this,{attribute:"assertedEvents",from(s){if(this.state.assertedEvents?.[e]?.title!==void 0)return{assertedEvents:new k({[e]:{title:s}})}}})}
            ></devtools-suggestion-input>
          </div>
          <div  id="event-url" class="padded row" jslog=${T.treeItem("event-url")}>
            <div>url<span class="separator">:</span></div>
            <devtools-suggestion-input
              aria-labelledby="event-url"
              .disabled=${this.disabled}
              .placeholder=${C.assertedEvents[0].url}
              .value=${ie(t.url??"")}
              @blur=${f(this,ee).call(this,{attribute:"url",from(s){if(this.state.assertedEvents?.[e]?.url!==void 0)return{assertedEvents:new k({[e]:{url:s}})}}})}
            ></devtools-suggestion-input>
          </div>`)}
    </div> `};Ns=function(){if(f(this,G).add("attributes"),this.state.attributes!==void 0)return M`<div class="attribute" data-attribute="attributes" jslog=${T.treeItem("attributes")}>
      <div class="row">
        <div>attributes<span class="separator">:</span></div>
        ${l(this,a,Se).call(this,"attributes")}
      </div>
      ${this.state.attributes.map(({name:t,value:e},s,o)=>M`<div class="padded row" jslog=${T.treeItem("attribute")}>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${C.attributes[0].name}
            .value=${ie(t)}
            data-path=${`attributes.${s}.name`}
            jslog=${T.key().track({change:!0})}
            @blur=${f(this,ee).call(this,{attribute:"attributes",from(i){if(this.state.attributes?.[s]?.name!==void 0)return{attributes:new k({[s]:{name:i}})}}})}
          ></devtools-suggestion-input>
          <span class="separator">:</span>
          <devtools-suggestion-input
            .disabled=${this.disabled}
            .placeholder=${C.attributes[0].value}
            .value=${ie(e)}
            data-path=${`attributes.${s}.value`}
            @blur=${f(this,ee).call(this,{attribute:"attributes",from(i){if(this.state.attributes?.[s]?.value!==void 0)return{attributes:new k({[s]:{value:i}})}}})}
          ></devtools-suggestion-input>
          ${l(this,a,Q).call(this,{class:"add-attribute-assertion",title:B(O.addSelectorPart),iconName:"plus",onClick:f(this,K).call(this,{attributes:new k({[s+1]:new oe((()=>{{let i=new Set(o.map(({name:d})=>d)),r=C.attributes[0],n=r.name,c=0;for(;i.has(n);)++c,n=`${r.name}-${c}`;return{...r,name:n}}})())})},`devtools-suggestion-input[data-path="attributes.${s+1}.name"]`)})}
          ${l(this,a,Q).call(this,{class:"remove-attribute-assertion",title:B(O.removeSelectorPart),iconName:"minus",onClick:f(this,K).call(this,{attributes:new k({[s]:void 0})},`devtools-suggestion-input[data-path="attributes.${Math.min(s,o.length-2)}.value"]`)})}
        </div>`)}
    </div>`};Us=function(){return[...Ft[this.state.type].optional].filter(e=>this.state[e]===void 0).map(e=>M`<devtools-button
          .variant=${we.Button.Variant.OUTLINED}
          class="add-row"
          data-attribute=${e}
          jslog=${T.action(`add-${Bt.StringUtilities.toKebabCase(e)}`)}
          @click=${f(this,Dt)}
        >
          ${B(O.addAttribute,{attributeName:e})}
        </devtools-button>`)};Ze=new WeakMap;Le([Vs()],ue.prototype,"state",2);Le([Vs()],ue.prototype,"error",2);Le([Ds({type:Boolean})],ue.prototype,"isTypeEditable",2);Le([Ds({type:Boolean})],ue.prototype,"disabled",2);ue=Le([To("devtools-recorder-step-editor")],ue);import*as zt from"./../../../core/i18n/i18n.js";import*as jt from"./../../../core/platform/platform.js";import*as tt from"./../../../ui/components/menus/menus.js";import*as Oe from"./../../../ui/legacy/legacy.js";import*as De from"./../../../ui/lit/lit.js";import*as ne from"./../../../ui/visual_logging/visual_logging.js";import*as U from"./../models/models.js";var Fs=`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.title-container{min-width:0;font-size:var(--sys-size-7);display:flex;flex-direction:row;gap:var(--sys-size-2);outline-offset:var(--sys-size-2);flex-grow:1;align-items:center}.action{display:flex;align-items:center}.title{flex:1;min-width:0}.is-start-of-group .title{font-weight:bold}.error-icon{display:none}.breakpoint-icon{visibility:hidden;cursor:pointer;opacity:0%;fill:var(--sys-color-primary);stroke:#1a73e8;transform:translate(-1.92px,-3px)}.circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-cdt-base-container);stroke-width:4px;r:5px;cx:8px;cy:8px}.is-start-of-group:not(:first-of-type) .circle-icon{r:7px;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.step.is-success .circle-icon{fill:var(--sys-color-primary);stroke:var(--sys-color-primary)}.step.is-current .circle-icon{stroke-dasharray:24 10;animation:rotate 1s linear infinite;fill:var(--sys-color-cdt-base-container);stroke:var(--sys-color-primary);stroke-width:2px}.error{margin:16px 0 0;padding:8px;background:var(--sys-color-error-container);color:var(--sys-color-error);position:relative}@keyframes rotate{0%{transform:translate(8px,8px) rotate(0) translate(-8px,-8px)}100%{transform:translate(8px,8px) rotate(360deg) translate(-8px,-8px)}}.step.is-error .circle-icon{fill:var(--sys-color-error);stroke:var(--sys-color-error)}.step.is-error .error-icon{display:block;transform:translate(4px,4px)}:host-context(.was-successful) .circle-icon{animation:flash-circle 2s}:host-context(.was-successful) .breakpoint-icon{animation:flash-breakpoint-icon 2s}@keyframes flash-circle{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}@keyframes flash-breakpoint-icon{25%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text);stroke:var(--override-color-recording-successful-text)}}.chevron{width:14px;height:14px;transition:200ms;position:absolute;top:14px;left:24px;transform:rotate(-90deg);color:var(--sys-color-on-surface)}.expanded .chevron{transform:rotate(0deg)}.is-start-of-group .chevron{top:34px}.details{display:none;margin-top:8px;position:relative}.expanded .details{display:block}.step-details{overflow:auto}devtools-recorder-step-editor{border:1px solid var(--sys-color-neutral-outline);padding:3px 6px 6px;margin-left:-6px;border-radius:3px}devtools-recorder-step-editor:hover{border:1px solid var(--sys-color-neutral-outline)}devtools-recorder-step-editor.is-selected{background-color:color-mix(in srgb,var(--sys-color-tonal-container),var(--sys-color-cdt-base-container) 50%);border:1px solid var(--sys-color-tonal-outline)}.summary{display:flex;flex-flow:row nowrap}.subtitle{font-weight:normal;color:var(--sys-color-on-surface-subtle);word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.main-title{word-break:break-all;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.step-actions{border:none;border-radius:0;height:24px;--override-select-menu-show-button-border-radius:0;--override-select-menu-show-button-outline:none;--override-select-menu-show-button-padding:0}.step.has-breakpoint .circle-icon{visibility:hidden}.step:not(.is-start-of-group).has-breakpoint .breakpoint-icon{visibility:visible;opacity:100%}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .circle-icon{transition:opacity 0.2s;opacity:0%}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .error-icon{visibility:hidden}.step:not(.is-start-of-group, .has-breakpoint) .icon:hover .breakpoint-icon{transition:opacity 0.2s;visibility:visible;opacity:50%}
/*# sourceURL=${import.meta.resolve("./stepView.css")} */`;var qs={};Y(qs,{DEFAULT_VIEW:()=>zs,TimelineSection:()=>Me});import*as _s from"./../../../ui/legacy/legacy.js";import*as Ae from"./../../../ui/lit/lit.js";var js=`*{margin:0;padding:0;box-sizing:border-box;font-size:inherit}.timeline-section{position:relative;padding:8px 0 8px 40px;margin-left:8px;--override-color-recording-successful-text:#36a854;--override-color-recording-successful-background:#e6f4ea}.overlay{position:absolute;width:100vw;height:100%;left:calc(-32px - 80px);top:0;z-index:-1;pointer-events:none}@container (max-width: 400px){.overlay{left:-32px}}:hover .overlay{background:var(--sys-color-state-hover-on-subtle)}.is-selected .overlay{background:var(--sys-color-tonal-container)}:host-context(.is-stopped) .overlay{background:var(--sys-color-state-ripple-primary);outline:1px solid var(--sys-color-state-focus-ring);z-index:4}.is-start-of-group:not(:first-of-type){padding-top:16px}.is-end-of-group{padding-bottom:16px}.icon{position:absolute;left:4px;transform:translateX(-50%);z-index:2}.bar{position:absolute;left:4px;display:block;transform:translateX(-50%);top:18px;height:100%;z-index:1}.bar .background{fill:var(--sys-color-state-hover-on-subtle)}.bar .line{fill:var(--sys-color-primary)}.is-first-section .bar{height:100%;display:none}.is-first-section:not(.is-last-section) .bar{display:block}.is-last-section .bar .line{display:none}.is-last-section .bar .background{display:none}:host-context(.is-error) .bar .line{fill:var(--sys-color-error)}:host-context(.is-error) .bar .background{fill:var(--sys-color-error-container)}:host-context(.was-successful) .bar .background{animation:flash-background 2s}:host-context(.was-successful) .bar .line{animation:flash-line 2s}@keyframes flash-background{25%{fill:var(--override-color-recording-successful-background)}75%{fill:var(--override-color-recording-successful-background)}}@keyframes flash-line{25%{fill:var(--override-color-recording-successful-text)}75%{fill:var(--override-color-recording-successful-text)}}
/*# sourceURL=${import.meta.resolve("./timelineSection.css")} */`;var{html:Mo}=Ae,zs=(t,e,s)=>{let o={"timeline-section":!0,"is-end-of-group":t.isEndOfGroup,"is-start-of-group":t.isStartOfGroup,"is-first-section":t.isFirstSection,"is-last-section":t.isLastSection,"is-selected":t.isSelected};Ae.render(Mo`
    <style>${js}</style>
    <div class=${Ae.Directives.classMap(o)}>
      <div class="overlay"></div>
      <div class="icon"><slot name="icon"></slot></div>
      <svg width="24" height="100%" class="bar">
        <rect class="line" x="7" y="0" width="2" height="100%" />
      </svg>
      <slot></slot>
    </div>
  `,s)},Me=class extends _s.Widget.Widget{#o=!1;#e=!1;#t=!1;#s=!1;#i=!1;#n;constructor(e,s=zs){super(e,{useShadowDom:!0}),this.#n=s}set isEndOfGroup(e){this.#o=e,this.requestUpdate()}set isStartOfGroup(e){this.#e=e,this.requestUpdate()}set isFirstSection(e){this.#t=e,this.requestUpdate()}set isLastSection(e){this.#s=e,this.requestUpdate()}set isSelected(e){this.#i=e,this.requestUpdate()}performUpdate(){this.#n({isEndOfGroup:this.#o,isStartOfGroup:this.#e,isFirstSection:this.#t,isLastSection:this.#s,isSelected:this.#i},{},this.contentElement)}};var{html:he}=De,{widget:Ao}=Oe.Widget,u={setViewportClickTitle:"Set viewport",customStepTitle:"Custom step",clickStepTitle:"Click",doubleClickStepTitle:"Double click",hoverStepTitle:"Hover",emulateNetworkConditionsStepTitle:"Emulate network conditions",changeStepTitle:"Change",closeStepTitle:"Close",scrollStepTitle:"Scroll",keyUpStepTitle:"Key up",navigateStepTitle:"Navigate",keyDownStepTitle:"Key down",waitForElementStepTitle:"Wait for element",waitForExpressionStepTitle:"Wait for expression",elementRoleButton:"Button",elementRoleInput:"Input",elementRoleFallback:"Element",addStepBefore:"Add step before",addStepAfter:"Add step after",removeStep:"Remove step",openStepActions:"Open step actions",addBreakpoint:"Add breakpoint",removeBreakpoint:"Remove breakpoint",copyAs:"Copy as",stepManagement:"Manage steps",breakpoints:"Breakpoints"},No=zt.i18n.registerUIStrings("panels/recorder/components/StepView.ts",u),h=zt.i18n.getLocalizedString.bind(void 0,No),A=(t=>(t.DEFAULT="default",t.SUCCESS="success",t.CURRENT="current",t.OUTSTANDING="outstanding",t.ERROR="error",t.STOPPED="stopped",t))(A||{}),_t=class t extends Event{static eventName="captureselectors";data;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.data=e}},st=class t extends Event{static eventName="copystep";step;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.step=e}},ot=class t extends Event{static eventName="stepchanged";currentStep;newStep;constructor(e,s){super(t.eventName,{bubbles:!0,composed:!0}),this.currentStep=e,this.newStep=s}},Ws=(t=>(t.BEFORE="before",t.AFTER="after",t))(Ws||{}),Ne=class t extends Event{static eventName="addstep";position;stepOrSection;constructor(e,s){super(t.eventName,{bubbles:!0,composed:!0}),this.stepOrSection=e,this.position=s}},it=class t extends Event{static eventName="removestep";step;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.step=e}},Ue=class t extends Event{static eventName="addbreakpoint";index;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.index=e}},Pe=class t extends Event{static eventName="removebreakpoint";index;constructor(e){super(t.eventName,{bubbles:!0,composed:!0}),this.index=e}},re="copy-step-as-";function Uo(t){if(t.section)return t.section.title?t.section.title:he`<span class="fallback">(No Title)</span>`;if(!t.step)throw new Error("Missing both step and section");switch(t.step.type){case U.Schema.StepType.CustomStep:return h(u.customStepTitle);case U.Schema.StepType.SetViewport:return h(u.setViewportClickTitle);case U.Schema.StepType.Click:return h(u.clickStepTitle);case U.Schema.StepType.DoubleClick:return h(u.doubleClickStepTitle);case U.Schema.StepType.Hover:return h(u.hoverStepTitle);case U.Schema.StepType.EmulateNetworkConditions:return h(u.emulateNetworkConditionsStepTitle);case U.Schema.StepType.Change:return h(u.changeStepTitle);case U.Schema.StepType.Close:return h(u.closeStepTitle);case U.Schema.StepType.Scroll:return h(u.scrollStepTitle);case U.Schema.StepType.KeyUp:return h(u.keyUpStepTitle);case U.Schema.StepType.KeyDown:return h(u.keyDownStepTitle);case U.Schema.StepType.WaitForElement:return h(u.waitForElementStepTitle);case U.Schema.StepType.WaitForExpression:return h(u.waitForExpressionStepTitle);case U.Schema.StepType.Navigate:return h(u.navigateStepTitle)}}function Po(t){switch(t){case"button":return h(u.elementRoleButton);case"input":return h(u.elementRoleInput);default:return h(u.elementRoleFallback)}}function Oo(t){if(!("selectors"in t))return"";let e=t.selectors.flat().find(o=>o.startsWith("aria/"));if(!e)return"";let s=e.match(/^aria\/(.+?)(\[role="(.+)"\])?$/);return s?`${Po(s[3])} "${s[1]}"`:""}function Do(t){return t?t.url:""}function Vo(t){return he`
    <devtools-menu-button
      class="step-actions"
      title=${h(u.openStepActions)}
      aria-label=${h(u.openStepActions)}
      .populateMenuCall=${t.populateStepContextMenu}
      @keydown=${e=>{e.stopPropagation()}}
      jslog=${ne.dropDown("step-actions").track({click:!0})}
      .iconName=${"dots-vertical"}
    ></devtools-menu-button>
  `}var Ks=(t,e,s)=>{if(!t.step&&!t.section)return;let o={step:!0,expanded:t.showDetails,"is-success":t.state==="success","is-current":t.state==="current","is-outstanding":t.state==="outstanding","is-error":t.state==="error","is-stopped":t.state==="stopped","is-start-of-group":t.isStartOfGroup,"is-first-section":t.isFirstSection,"has-breakpoint":t.hasBreakpoint},i=!!t.step,r=Uo({step:t.step,section:t.section}),n=t.step?Oo(t.step):Do(t.section);De.render(he`
    <style>${Fs}</style>
    <div>
      <devtools-widget ${Ao(Me,{isFirstSection:t.isFirstSection,isLastSection:t.isLastSection,isStartOfGroup:t.isStartOfGroup,isEndOfGroup:t.isEndOfGroup,isSelected:t.isSelected})}
        @contextmenu=${c=>{let d=new Oe.ContextMenu.ContextMenu(c);t.populateStepContextMenu(d),d.show()}}
        data-step-index=${t.stepIndex}
        data-section-index=${t.sectionIndex}
        @click=${c=>{c.stopPropagation();let d=t.step||t.section;d&&t.onStepClick(d)}}
        @mouseover=${()=>{let c=t.step||t.section;c&&t.onStepHover(c)}}
        class=${De.Directives.classMap(o)}>
        <svg slot="icon" width="24" height="24" class="icon">
          <circle class="circle-icon"/>
          <g class="error-icon">
            <path d="M1.5 1.5L6.5 6.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.5 6.5L6.5 1.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <path @click=${t.onBreakpointClick} jslog=${ne.action("breakpoint").track({click:!0})} class="breakpoint-icon" d="M2.5 5.5H17.7098L21.4241 12L17.7098 18.5H2.5V5.5Z"/>
        </svg>
        <div class="summary">
          <div class="title-container ${i?"action":""}"
            @click=${i?t.toggleShowDetails:void 0}
            @keydown=${i?t.onToggleShowDetailsKeydown:void 0}
            tabindex="0"
            jslog=${ne.sectionHeader().track({click:!0})}
            aria-role=${i?"button":""}
            aria-label=${i?"Show details for step":""}
          >
            ${i?he`<devtools-icon
                    class="chevron"
                    jslog=${ne.expand().track({click:!0})}
                    name="triangle-down">
                  </devtools-icon>`:""}
            <div class="title">
              <div class="main-title" title=${r}>${r}</div>
              <div class="subtitle" title=${n}>${n}</div>
            </div>
          </div>
          ${Vo(t)}
        </div>
        <div class="details">
          ${t.step&&he`<devtools-recorder-step-editor
            class=${t.isSelected?"is-selected":""}
            .step=${t.step}
            .disabled=${t.isPlaying}
            @stepedited=${t.stepEdited}>
          </devtools-recorder-step-editor>`}
          ${t.section?.causingStep&&he`<devtools-recorder-step-editor
            .step=${t.section.causingStep}
            .isTypeEditable=${!1}
            .disabled=${t.isPlaying}
            @stepedited=${t.stepEdited}>
          </devtools-recorder-step-editor>`}
        </div>
        ${t.error&&he`
          <div class="error" role="alert">
            ${t.error.message}
          </div>
        `}
      </devtools-widget>
    </div>
  `,s)},xe=class extends Oe.Widget.Widget{#o=new IntersectionObserver(e=>{this.#e.isVisible=e[0].isIntersecting});#e={state:"default",showDetails:!1,isEndOfGroup:!1,isStartOfGroup:!1,stepIndex:0,sectionIndex:0,isFirstSection:!1,isLastSection:!1,isRecording:!1,isPlaying:!1,isVisible:!1,hasBreakpoint:!1,removable:!0,builtInConverters:[],extensionConverters:[],isSelected:!1,actions:[],stepEdited:this.#n.bind(this),onBreakpointClick:this.#a.bind(this),handleStepAction:this.#r.bind(this),toggleShowDetails:this.#s.bind(this),onToggleShowDetailsKeydown:this.#i.bind(this),populateStepContextMenu:this.#c.bind(this),onStepClick:()=>{},onStepHover:()=>{}};#t;constructor(e,s){super(e,{useShadowDom:!0,classes:["step-view-widget"]}),this.#t=s||Ks}set step(e){this.#e.step=e,this.requestUpdate()}set section(e){this.#e.section=e,this.requestUpdate()}set state(e){let s=this.#e.state;this.#e.state=e,this.performUpdate(),this.#e.state!==s&&this.#e.state==="current"&&!this.#e.isVisible&&this.contentElement.scrollIntoView()}set error(e){this.#e.error=e,this.requestUpdate()}set isEndOfGroup(e){this.#e.isEndOfGroup=e,this.requestUpdate()}set isStartOfGroup(e){this.#e.isStartOfGroup=e,this.requestUpdate()}set stepIndex(e){this.#e.stepIndex=e,this.requestUpdate()}set sectionIndex(e){this.#e.sectionIndex=e,this.requestUpdate()}set isFirstSection(e){this.#e.isFirstSection=e,this.requestUpdate()}set isLastSection(e){this.#e.isLastSection=e,this.requestUpdate()}set isRecording(e){this.#e.isRecording=e,this.requestUpdate()}set isPlaying(e){this.#e.isPlaying=e,this.requestUpdate()}set hasBreakpoint(e){this.#e.hasBreakpoint=e,this.requestUpdate()}set removable(e){this.#e.removable=e,this.requestUpdate()}set builtInConverters(e){this.#e.builtInConverters=e,this.requestUpdate()}set extensionConverters(e){this.#e.extensionConverters=e,this.requestUpdate()}set isSelected(e){this.#e.isSelected=e,this.requestUpdate()}set recorderSettings(e){this.#e.recorderSettings=e,this.requestUpdate()}set onStepClick(e){this.#e.onStepClick=e,this.requestUpdate()}set onStepHover(e){this.#e.onStepHover=e,this.requestUpdate()}get step(){return this.#e.step}get section(){return this.#e.section}wasShown(){super.wasShown(),this.#o.observe(this.contentElement),this.requestUpdate()}willHide(){super.willHide(),this.#o.unobserve(this.contentElement)}#s(){this.#e.showDetails=!this.#e.showDetails,this.requestUpdate()}#i(e){let s=e;(s.key==="Enter"||s.key===" ")&&(this.#s(),e.stopPropagation(),e.preventDefault())}#n(e){let s=this.#e.step||this.#e.section?.causingStep;if(!s)throw new Error("Expected step.");this.contentElement.dispatchEvent(new ot(s,e.data))}#r(e){switch(e.itemValue){case"add-step-before":{let s=this.#e.step||this.#e.section;if(!s)throw new Error("Expected step or section.");this.contentElement.dispatchEvent(new Ne(s,"before"));break}case"add-step-after":{let s=this.#e.step||this.#e.section;if(!s)throw new Error("Expected step or section.");this.contentElement.dispatchEvent(new Ne(s,"after"));break}case"remove-step":{let s=this.#e.section?.causingStep;if(!this.#e.step&&!s)throw new Error("Expected step.");this.contentElement.dispatchEvent(new it(this.#e.step||s));break}case"add-breakpoint":{if(!this.#e.step)throw new Error("Expected step");this.contentElement.dispatchEvent(new Ue(this.#e.stepIndex));break}case"remove-breakpoint":{if(!this.#e.step)throw new Error("Expected step");this.contentElement.dispatchEvent(new Pe(this.#e.stepIndex));break}default:{let s=e.itemValue;if(!s.startsWith(re))throw new Error("Unknown step action.");let o=this.#e.step||this.#e.section?.causingStep;if(!o)throw new Error("Step not found.");let i=s.substring(re.length);this.#e.recorderSettings&&(this.#e.recorderSettings.preferredCopyFormat=i),this.contentElement.dispatchEvent(new st(structuredClone(o)))}}}#a(){this.#e.hasBreakpoint?this.contentElement.dispatchEvent(new Pe(this.#e.stepIndex)):this.contentElement.dispatchEvent(new Ue(this.#e.stepIndex)),this.requestUpdate()}#l=()=>{let e=[];if(this.#e.isPlaying||(this.#e.step&&e.push({id:"add-step-before",label:h(u.addStepBefore),group:"stepManagement",groupTitle:h(u.stepManagement)}),e.push({id:"add-step-after",label:h(u.addStepAfter),group:"stepManagement",groupTitle:h(u.stepManagement)}),this.#e.removable&&e.push({id:"remove-step",group:"stepManagement",groupTitle:h(u.stepManagement),label:h(u.removeStep)})),this.#e.step&&!this.#e.isRecording&&(this.#e.hasBreakpoint?e.push({id:"remove-breakpoint",label:h(u.removeBreakpoint),group:"breakPointManagement",groupTitle:h(u.breakpoints)}):e.push({id:"add-breakpoint",label:h(u.addBreakpoint),group:"breakPointManagement",groupTitle:h(u.breakpoints)})),this.#e.step){for(let s of this.#e.builtInConverters||[])e.push({id:re+jt.StringUtilities.toKebabCase(s.getId()),label:s.getFormatName(),group:"copy",groupTitle:h(u.copyAs)});for(let s of this.#e.extensionConverters||[])e.push({id:re+jt.StringUtilities.toKebabCase(s.getId()),label:s.getFormatName(),group:"copy",groupTitle:h(u.copyAs),jslogContext:re+"extension"})}return e};#c(e){let s=this.#l(),o=s.filter(n=>n.id.startsWith(re)),i=s.filter(n=>!n.id.startsWith(re));for(let n of i)e.section(n.group).appendItem(n.label,()=>{this.#r(new tt.Menu.MenuItemSelectedEvent(n.id))},{jslogContext:n.id});let r=o.find(n=>n.id===re+this.#e.recorderSettings?.preferredCopyFormat);if(r&&e.section("copy").appendItem(r.label,()=>{this.#r(new tt.Menu.MenuItemSelectedEvent(r.id))},{jslogContext:r.id}),o.length){let n=e.section("copy").appendSubMenuItem(h(u.copyAs),!1,"copy");for(let c of o)c!==r&&n.section(c.group).appendItem(c.label,()=>{this.#r(new tt.Menu.MenuItemSelectedEvent(c.id))},{jslogContext:c.id})}}performUpdate(){this.#e.actions=this.#l(),this.#t(this.#e,void 0,this.contentElement)}};var{html:p}=R,{widget:Js}=H.Widget,g={mobile:"Mobile",desktop:"Desktop",latency:"Latency: {value} ms",upload:"Upload: {value}",download:"Download: {value}",editReplaySettings:"Edit replay settings",replaySettings:"Replay settings",default:"Default",environment:"Environment",screenshotForSection:"Screenshot for this section",editTitle:"Edit title",requiredTitleError:"Title is required",recording:"Recording\u2026",endRecording:"End recording",recordingIsBeingStopped:"Stopping recording\u2026",timeout:"Timeout: {value} ms",network:"Network",timeoutLabel:"Timeout",timeoutExplanation:"The timeout setting (in milliseconds) applies to every action when replaying the recording. For example, if a DOM element identified by a CSS selector does not appear on the page within the specified timeout, the replay fails with an error.",cancelReplay:"Cancel replay",showCode:"Show code",hideCode:"Hide code",addAssertion:"Add assertion",performancePanel:"Performance panel",codeSidebarOpened:"Code sidebar opened",codeSidebarClosed:"Code sidebar closed"},Bo=$e.i18n.registerUIStrings("panels/recorder/components/RecordingView.ts",g),m=$e.i18n.getLocalizedString.bind(void 0,Bo),Zs=(t=>(t.PERFORMANCE_PANEL="timeline",t.DEFAULT="chrome-recorder",t))(Zs||{}),qt=[z.NetworkManager.NoThrottlingConditions,z.NetworkManager.OfflineConditions,z.NetworkManager.Slow3GConditions,z.NetworkManager.Slow4GConditions,z.NetworkManager.Fast4GConditions];function Fo({settings:t,replaySettingsExpanded:e,onSelectMenuLabelClick:s,onNetworkConditionsChange:o,onTimeoutInput:i,isRecording:r,replayState:n,onReplaySettingsKeydown:c,onToggleReplaySettings:d}){if(!t)return R.nothing;let E=[];t.viewportSettings&&(E.push(p`<div>${t.viewportSettings.isMobile?m(g.mobile):m(g.desktop)}</div>`),E.push(p`<div class="separator"></div>`),E.push(p`<div>${t.viewportSettings.width}×${t.viewportSettings.height} px</div>`));let w=[];if(!e)t.networkConditionsSettings?t.networkConditionsSettings.title?w.push(p`<div>${t.networkConditionsSettings.title}</div>`):w.push(p`<div>
          ${m(g.download,{value:$e.ByteUtilities.bytesToString(t.networkConditionsSettings.download)})},
          ${m(g.upload,{value:$e.ByteUtilities.bytesToString(t.networkConditionsSettings.upload)})},
          ${m(g.latency,{value:t.networkConditionsSettings.latency})}
        </div>`):w.push(p`<div>${z.NetworkManager.NoThrottlingConditions.title instanceof Function?z.NetworkManager.NoThrottlingConditions.title():z.NetworkManager.NoThrottlingConditions.title}</div>`),w.push(p`<div class="separator"></div>`),w.push(p`<div>${m(g.timeout,{value:t.timeout||F.RecordingPlayer.defaultTimeout})}</div>`);else{let y=t.networkConditionsSettings?.i18nTitleKey||z.NetworkManager.NoThrottlingConditions.i18nTitleKey,X=qt.find(te=>te.i18nTitleKey===y),Gt="";X&&(Gt=X.title instanceof Function?X.title():X.title),w.push(p`<div class="editable-setting">
      <label class="wrapping-label" @click=${s}>
        ${m(g.network)}
        <select
            title=${Gt}
            jslog=${S.dropDown("network-conditions").track({change:!0})}
            @change=${o}>
      ${qt.map(te=>p`
        <option jslog=${S.item(Kt.StringUtilities.toKebabCase(te.i18nTitleKey||""))}
                value=${te.i18nTitleKey||""} ?selected=${y===te.i18nTitleKey}>
                ${te.title instanceof Function?te.title():te.title}
        </option>`)}
    </select>
      </label>
    </div>`),w.push(p`<div class="editable-setting">
      <label class="wrapping-label" title=${m(g.timeoutExplanation)}>
        ${m(g.timeoutLabel)}
        <input
          @input=${i}
          required
          min=${F.SchemaUtils.minTimeout}
          max=${F.SchemaUtils.maxTimeout}
          value=${t.timeout||F.RecordingPlayer.defaultTimeout}
          jslog=${S.textField("timeout").track({change:!0})}
          class="devtools-text-input"
          type="number">
      </label>
    </div>`)}let b=!r&&!n.isPlaying,x={"settings-title":!0,expanded:e},I={expanded:e,settings:!0};return p`
    <div class="settings-row">
      <div class="settings-container">
        <div
          class=${R.Directives.classMap(x)}
          @keydown=${b&&c}
          @click=${b&&d}
          aria-expanded=${x.expanded??!1}
          tabindex="0"
          role="button"
          jslog=${S.action("replay-settings").track({click:!0})}
          aria-label=${m(g.editReplaySettings)}>
          <span>${m(g.replaySettings)}</span>
          ${b?p`<devtools-icon
                  class="chevron"
                  name="triangle-down">
                </devtools-icon>`:""}
        </div>
        <div class=${R.Directives.classMap(I)}>
          ${w.length?w:p`<div>${m(g.default)}</div>`}
        </div>
      </div>
      <div class="settings-container">
        <div class="settings-title">${m(g.environment)}</div>
        <div class="settings">
          ${E.length?E:p`<div>${m(g.default)}</div>`}
        </div>
      </div>
    </div>
  `}function jo(t,e){return t.extensionDescriptor?p`
        <devtools-recorder-extension-view .descriptor=${t.extensionDescriptor}>
        </devtools-recorder-extension-view>
      `:p`
        <devtools-split-view
          direction="auto"
          sidebar-position="second"
          sidebar-initial-size="300"
          sidebar-visibility=${t.showCodeView?"":"hidden"}
        >
          <div slot="main">
            ${Wo(t)}
          </div>
          <div slot="sidebar" jslog=${S.pane("source-code").track({resize:!0})}>
            ${t.showCodeView?p`
            <div class="section-toolbar" jslog=${S.toolbar()}>
              <devtools-select-menu
                @selectmenuselected=${t.onCodeFormatChange}
                .showDivider=${!0}
                .showArrow=${!0}
                .sideButton=${!1}
                .showSelectedItem=${!0}
                .position=${Xs.Dialog.DialogVerticalPosition.BOTTOM}
                .buttonTitle=${t.converterName||""}
                .jslogContext=${"code-format"}
              >
                ${t.builtInConverters.map(s=>p`<devtools-menu-item
                    .value=${s.getId()}
                    .selected=${t.converterId===s.getId()}
                    jslog=${S.action().track({click:!0}).context(`converter-${Kt.StringUtilities.toKebabCase(s.getId())}`)}
                  >
                    ${s.getFormatName()}
                  </devtools-menu-item>`)}
                ${t.extensionConverters.map(s=>p`<devtools-menu-item
                    .value=${s.getId()}
                    .selected=${t.converterId===s.getId()}
                    jslog=${S.action().track({click:!0}).context("converter-extension")}
                  >
                    ${s.getFormatName()}
                  </devtools-menu-item>`)}
              </devtools-select-menu>
              <devtools-button
                title=${F.Tooltip.getTooltipForActions(m(g.hideCode),Ee.RecorderActions.TOGGLE_CODE_VIEW)}
                .data=${{variant:ae.Button.Variant.ICON,size:ae.Button.Size.SMALL,iconName:"cross"}}
                @click=${t.showCodeToggle}
                jslog=${S.close().track({click:!0})}
              ></devtools-button>
            </div>
            ${_o(t,e)}`:R.nothing}
          </div>
        </devtools-split-view>
      `}function _o(t,e){if(!t.editorState)throw new Error("Unexpected: trying to render the text editor without editorState");return p`
    <div class="text-editor" jslog=${S.textField().track({change:!0})}>
      <devtools-text-editor .state=${t.editorState} ${R.Directives.ref(s=>{!s||!(s instanceof nt.TextEditor.TextEditor)||(e.highlightLinesInEditor=(o,i,r=!1)=>{let n=s.editor,c=s.createSelection({lineNumber:o+i,columnNumber:0},{lineNumber:o,columnNumber:0}),d=s.state.doc.lineAt(c.main.anchor);c=s.createSelection({lineNumber:o+i-1,columnNumber:d.length+1},{lineNumber:o,columnNumber:0}),n.dispatch({selection:c,effects:r?[ke.EditorView.scrollIntoView(c.main,{y:"nearest"})]:void 0})})})}></devtools-text-editor>
    </div>
  `}function zo(t){return t.screenshot?p`
      <img class="screenshot" src=${t.screenshot} alt=${m(g.screenshotForSection)} />
    `:null}function qo(t){return t.replayState.isPlaying?p`
        <devtools-button .jslogContext=${"abort-replay"} @click=${t.onAbortReplay} .iconName=${"pause"} .variant=${ae.Button.Variant.OUTLINED}>
          ${m(g.cancelReplay)}
        </devtools-button>`:t.recorderSettings?p`${Js(Te,{settings:t.recorderSettings,replayExtensions:t.replayExtensions,onStartReplay:t.onTogglePlaying,disabled:t.replayState.isPlaying})}`:R.nothing}function Wo(t){return p`
      <div class="sections">
      ${t.showCodeView?"":p`<div class="section-toolbar">
        <devtools-button
          @click=${t.showCodeToggle}
          class="show-code"
          .data=${{variant:ae.Button.Variant.OUTLINED,title:F.Tooltip.getTooltipForActions(m(g.showCode),Ee.RecorderActions.TOGGLE_CODE_VIEW)}}
          jslog=${S.toggleSubpane(Ee.RecorderActions.TOGGLE_CODE_VIEW).track({click:!0})}
        >
          ${m(g.showCode)}
        </devtools-button>
      </div>`}
      ${t.sections.map((e,s)=>p`
            <div class="section">
              <div class="screenshot-wrapper">
                ${zo(e)}
              </div>
              <div class="content">
                <div class="steps">
                  ${Js(xe,{section:e,state:t.getSectionState(e),isStartOfGroup:!0,isEndOfGroup:e.steps.length===0,isFirstSection:s===0,isLastSection:s===t.sections.length-1&&e.steps.length===0,isSelected:t.selectedStep===(e.causingStep||null),sectionIndex:s,isRecording:t.isRecording,isPlaying:t.replayState.isPlaying,error:t.getSectionState(e)===A.ERROR?t.currentError??void 0:void 0,hasBreakpoint:!1,removable:t.recording.steps.length>1&&!!e.causingStep,onStepClick:t.onStepClick,onStepHover:t.onStepHover})}
                  ${e.steps.map(o=>{let i=t.recording.steps.indexOf(o);return p`
                      <devtools-widget
                      @copystep=${t.onCopyStep}
                      .widgetConfig=${H.Widget.widgetConfig(xe,{step:o,state:t.getStepState(o),error:t.currentStep===o?t.currentError??void 0:void 0,isFirstSection:!1,isLastSection:s===t.sections.length-1&&t.recording.steps[t.recording.steps.length-1]===o,isStartOfGroup:!1,isEndOfGroup:e.steps[e.steps.length-1]===o,stepIndex:i,hasBreakpoint:t.breakpointIndexes.has(i),sectionIndex:-1,isRecording:t.isRecording,isPlaying:t.replayState.isPlaying,removable:t.recording.steps.length>1,builtInConverters:t.builtInConverters,extensionConverters:t.extensionConverters,isSelected:t.selectedStep===o,recorderSettings:t.recorderSettings??void 0,onStepClick:t.onStepClick,onStepHover:t.onStepHover})}
                      jslog=${S.section("step").track({click:!0})}
                      ></devtools-widget>
                    `})}
                  ${!t.recordingTogglingInProgress&&t.isRecording&&s===t.sections.length-1?p`<devtools-button
                    class="step add-assertion-button"
                    .data=${{variant:ae.Button.Variant.OUTLINED,title:m(g.addAssertion),jslogContext:"add-assertion"}}
                    @click=${t.onAddAssertion}
                  >${m(g.addAssertion)}</devtools-button>`:void 0}
                  ${t.isRecording&&s===t.sections.length-1?p`<div class="step recording">${m(g.recording)}</div>`:null}
                </div>
              </div>
            </div>
      `)}
      </div>
    `}function Ko(t){if(!t.recording)return R.nothing;let{title:e}=t.recording,s=!t.replayState.isPlaying&&!t.isRecording;return p`
    <div class="header">
      <div class="header-title-wrapper">
        <div class="header-title">
          <input @blur=${t.onTitleBlur}
                @keydown=${t.onTitleInputKeyDown}
                id="title-input"
                jslog=${S.value("title").track({change:!0})}
                class=${R.Directives.classMap({"has-error":t.isTitleInvalid,disabled:!s})}
                .value=${R.Directives.live(e)}
                .disabled=${!s}
                >
          <div class="title-button-bar">
            <devtools-button
              @click=${t.onEditTitleButtonClick}
              .data=${{disabled:!s,variant:ae.Button.Variant.TOOLBAR,iconName:"edit",title:m(g.editTitle),jslogContext:"edit-title"}}
            ></devtools-button>
          </div>
        </div>
        ${t.isTitleInvalid?p`<div class="title-input-error-text">
          ${m(g.requiredTitleError)}
        </div>`:R.nothing}
      </div>
      ${!t.isRecording&&t.replayAllowed?p`<div class="actions">
              <devtools-button
                @click=${t.onMeasurePerformanceClick}
                .data=${{disabled:t.replayState.isPlaying,variant:ae.Button.Variant.OUTLINED,iconName:"performance",title:m(g.performancePanel),jslogContext:"measure-performance"}}
              >
                ${m(g.performancePanel)}
              </devtools-button>
              <div class="separator"></div>
              ${qo(t)}
            </div>`:R.nothing}
    </div>`}var Qs=(t,e,s)=>{let o={wrapper:!0,"is-recording":t.isRecording,"is-playing":t.replayState.isPlaying,"was-successful":t.lastReplayResult===F.RecordingPlayer.ReplayResult.SUCCESS,"was-failure":t.lastReplayResult===F.RecordingPlayer.ReplayResult.FAILURE},i=t.recordingTogglingInProgress?m(g.recordingIsBeingStopped):m(g.endRecording);R.render(p`
    <style>${H.inspectorCommonStyles}</style>
    <style>${us}</style>
    <style>${Ys.textInputStyles}</style>
    <div @click=${t.onWrapperClick} class=${R.Directives.classMap(o)}>
      <div class="recording-view main">
        ${Ko(t)}
        ${t.extensionDescriptor?p`
            <devtools-recorder-extension-view .descriptor=${t.extensionDescriptor}></devtools-recorder-extension-view>`:p`
          ${Fo(t)}
          ${jo(t,e)}
        `}
        ${t.isRecording?p`<div class="footer">
          <div class="controls">
            <devtools-widget
              class="control-button"
              .widgetConfig=${H.Widget.widgetConfig(le,{label:i,shape:"square",disabled:t.recordingTogglingInProgress,onClick:t.onRecordingFinished})}
              jslog=${S.toggle("toggle-recording").track({click:!0})}
              title=${F.Tooltip.getTooltipForActions(i,Ee.RecorderActions.START_RECORDING)}
            >
            </devtools-widget>
          </div>
        </div>`:R.nothing}
      </div>
    </div>
  `,s)},Wt=class extends H.Widget.Widget{replayState={isPlaying:!1,isPausedOnBreakpoint:!1};isRecording=!1;recordingTogglingInProgress=!1;recording={title:"",steps:[]};currentStep;currentError;sections=[];settings;lastReplayResult;replayAllowed=!1;breakpointIndexes=new Set;extensionConverters=[];replayExtensions;extensionDescriptor;addAssertion;abortReplay;recordingFinished;playRecording;networkConditionsChanged;timeoutChanged;titleChanged;#o;get recorderSettings(){return this.#o}set recorderSettings(e){this.#o=e,this.#a=this.recorderSettings?.preferredCopyFormat??this.#e[0]?.getId(),this.#h()}#e=[];get builtInConverters(){return this.#e}set builtInConverters(e){this.#e=e,this.#a=this.recorderSettings?.preferredCopyFormat??this.#e[0]?.getId(),this.#h()}#t=!1;#s=null;#i=!1;#n=!1;#r="";#a="";#l;#c;#u=this.#L.bind(this);#d;#p={};constructor(e,s){super(e,{useShadowDom:!0}),this.#d=s||Qs}performUpdate(){let e=[...this.builtInConverters||[],...this.extensionConverters||[]].find(s=>s.getId()===this.#a)??this.builtInConverters[0];this.#d({breakpointIndexes:this.breakpointIndexes,builtInConverters:this.builtInConverters,converterId:this.#a,converterName:e?.getFormatName(),currentError:this.currentError??null,currentStep:this.currentStep??null,editorState:this.#c??null,extensionConverters:this.extensionConverters,extensionDescriptor:this.extensionDescriptor,isRecording:this.isRecording,isTitleInvalid:this.#t,lastReplayResult:this.lastReplayResult??null,recorderSettings:this.#o??null,recording:this.recording,recordingTogglingInProgress:this.recordingTogglingInProgress,replayAllowed:this.replayAllowed,replayExtensions:this.replayExtensions??[],replaySettingsExpanded:this.#i,replayState:this.replayState,sections:this.sections,selectedStep:this.#s??null,settings:this.settings??null,showCodeView:this.#n,onAddAssertion:()=>{this.addAssertion?.()},onRecordingFinished:()=>{this.recordingFinished?.()},getSectionState:this.#m.bind(this),getStepState:this.#g.bind(this),onAbortReplay:()=>{this.abortReplay?.()},onMeasurePerformanceClick:this.#M.bind(this),onTogglePlaying:(s,o)=>{this.playRecording?.({targetPanel:"chrome-recorder",speed:s,extension:o})},onCodeFormatChange:this.#A.bind(this),onCopyStep:this.#I.bind(this),onEditTitleButtonClick:this.#C.bind(this),onNetworkConditionsChange:this.#$.bind(this),onReplaySettingsKeydown:this.#x.bind(this),onSelectMenuLabelClick:this.#R.bind(this),onStepClick:this.#f.bind(this),onStepHover:this.#v.bind(this),onTimeoutInput:this.#k.bind(this),onTitleBlur:this.#E.bind(this),onTitleInputKeyDown:this.#T.bind(this),onToggleReplaySettings:this.#b.bind(this),onWrapperClick:this.#S.bind(this),showCodeToggle:this.showCodeToggle.bind(this)},this.#p,this.contentElement)}wasShown(){super.wasShown(),document.addEventListener("copy",this.#u),this.performUpdate()}willHide(){super.willHide(),document.removeEventListener("copy",this.#u)}scrollToBottom(){let e=this.contentElement?.querySelector(".sections");e&&(e.scrollTop=e.scrollHeight)}#g(e){if(!this.currentStep)return A.DEFAULT;if(e===this.currentStep)return this.currentError?A.ERROR:this.replayState?.isPlaying?this.replayState?.isPausedOnBreakpoint?A.STOPPED:A.CURRENT:A.SUCCESS;let s=this.recording.steps.indexOf(this.currentStep);return s===-1?A.DEFAULT:this.recording.steps.indexOf(e)<s?A.SUCCESS:A.OUTSTANDING}#m(e){let s=this.currentStep;if(!s)return A.DEFAULT;let o=this.sections.find(n=>n.steps.includes(s));if(!o&&this.currentError)return A.ERROR;if(e===o)return A.SUCCESS;let i=this.sections.indexOf(o),r=this.sections.indexOf(e);return i>=r?A.SUCCESS:A.OUTSTANDING}#v=e=>{let s="type"in e?e:e.causingStep;!s||this.#s||this.#w(s)};#f(e){let s="type"in e?e:e.causingStep||null;this.#s!==s&&(this.#s=s,this.performUpdate(),s&&this.#w(s,!0))}#S(){this.#s&&(this.#s=null,this.performUpdate())}#x(e){e.key==="Enter"&&(e.preventDefault(),this.#b(e))}#b(e){e.stopPropagation(),this.#i=!this.#i,this.performUpdate()}#$(e){let s=e.target;if(s instanceof HTMLSelectElement){let o=qt.find(i=>i.i18nTitleKey===s.value);this.networkConditionsChanged?.(o?.i18nTitleKey===z.NetworkManager.NoThrottlingConditions.i18nTitleKey?void 0:o)}}#k(e){let s=e.target;if(!s.checkValidity()){s.reportValidity();return}this.timeoutChanged?.(Number(s.value))}#E=e=>{let o=e.target.value.trim();if(!o){this.#t=!0,this.performUpdate();return}this.titleChanged?.(o)};#T=e=>{switch(e.code){case"Escape":case"Enter":e.target.blur(),e.stopPropagation();break}};#C=()=>{let e=this.contentElement.querySelector("#title-input");if(!e)throw new Error("Missing #title-input");e.focus()};#R=e=>{let s=e.target;s.matches(".wrapping-label")&&s.querySelector("devtools-select-menu")?.click()};async#y(e){let s=[...this.builtInConverters,...this.extensionConverters].find(i=>i.getId()===this.recorderSettings?.preferredCopyFormat);if(s||(s=this.builtInConverters[0]),!s)throw new Error("No default converter found");let o="";e?o=await s.stringifyStep(e):this.recording&&([o]=await s.stringify(this.recording)),rt.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(o)}#I(e){e.stopPropagation(),this.#y(e.step)}async#L(e){e.target===document.body&&(e.preventDefault(),await this.#y(this.#s),rt.userMetrics.keyboardShortcutFired(Ee.RecorderActions.COPY_RECORDING_OR_STEP))}#M(e){e.stopPropagation(),this.playRecording?.({targetPanel:"timeline",speed:q.NORMAL})}showCodeToggle=()=>{this.#n=!this.#n,this.#n?H.ARIAUtils.LiveAnnouncer.alert(m(g.codeSidebarOpened)):H.ARIAUtils.LiveAnnouncer.alert(m(g.codeSidebarClosed)),this.#h()};#h=async()=>{if(!this.recording)return;let e=[...this.builtInConverters||[],...this.extensionConverters||[]].find(n=>n.getId()===this.#a)??this.builtInConverters[0];if(!e)return;let[s,o]=await e.stringify(this.recording);this.#r=s,this.#l=o,this.#l?.shift();let i=e.getMediaType(),r=i?await Hs.CodeHighlighter.languageFromMIME(i):null;this.#c=ke.EditorState.create({doc:this.#r,extensions:[nt.Config.baseConfiguration(this.#r),ke.EditorState.readOnly.of(!0),ke.EditorView.lineWrapping,r||[]]}),this.performUpdate(),this.contentElement.dispatchEvent(new Event("code-generated"))};#w=(e,s=!1)=>{if(!this.#l)return;let o=this.recording.steps.indexOf(e);if(o===-1)return;let i=this.#l[o*2],r=this.#l[o*2+1];this.#p.highlightLinesInEditor?.(i,r,s)};#A=e=>{this.#a=e.itemValue,this.recorderSettings&&(this.recorderSettings.preferredCopyFormat=e.itemValue),this.#h()}};export{Jt as ControlButton,es as CreateRecordingView,as as RecordingListView,eo as RecordingView,ys as ReplaySection,Es as SelectorPicker,Bs as StepEditor,Gs as StepView,qs as TimelineSection};
//# sourceMappingURL=components.js.map
