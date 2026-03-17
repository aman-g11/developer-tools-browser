var F=Object.defineProperty;var c=(i,e)=>{for(var t in e)F(i,t,{get:e[t],enumerable:!0})};var y={};c(y,{FeedbackButton:()=>s});import*as b from"./../../../core/host/host.js";import*as h from"./../../../core/i18n/i18n.js";import*as w from"./../../../core/platform/platform.js";import*as p from"./../helpers/helpers.js";import{html as C,render as E}from"./../../lit/lit.js";import*as $ from"./../buttons/buttons.js";var S={feedback:"Feedback"},H=h.i18n.registerUIStrings("ui/components/panel_feedback/FeedbackButton.ts",S),I=h.i18n.getLocalizedString.bind(void 0,H),s=class extends HTMLElement{#i=this.attachShadow({mode:"open"});#e={feedbackUrl:w.DevToolsPath.EmptyUrlString};set data(e){this.#e=e,p.ScheduledRender.scheduleRender(this,this.#o)}#t(){b.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(this.#e.feedbackUrl)}#o(){if(!p.ScheduledRender.isScheduledRender(this))throw new Error("FeedbackButton render was not scheduled");E(C`
      <devtools-button
          @click=${this.#t}
          .iconName=${"review"}
          .variant=${$.Button.Variant.OUTLINED}
          .jslogContext=${"feedback"}
      >${I(S.feedback)}</devtools-button>
      `,this.#i,{host:this})}};customElements.define("devtools-feedback-button",s);var U={};c(U,{PanelFeedback:()=>n});import"./../../kit/kit.js";import*as k from"./../../../core/i18n/i18n.js";import*as m from"./../../../core/platform/platform.js";import*as v from"./../helpers/helpers.js";import{html as P,render as _}from"./../../lit/lit.js";var L=`:host{display:block}.preview{padding:12px 16px;border:1px solid var(--sys-color-divider);color:var(--sys-color-on-surface);font-size:13px;line-height:20px;border-radius:12px;margin:42px 0;letter-spacing:0.01em}h2{color:var(--sys-color-primary);font-size:13px;line-height:20px;letter-spacing:0.01em;margin:9px 0 14px;display:flex;align-items:center;gap:5px;font-weight:normal}h3{font-size:13px;line-height:20px;letter-spacing:0.04em;color:var(--sys-color-on-surface);margin-bottom:2px;font-weight:normal}.preview p{margin-bottom:24px}.thumbnail{height:92px}.video{display:flex;flex-flow:row wrap;gap:20px}devtools-link{color:var(--sys-color-primary);text-decoration-line:underline}devtools-link.quick-start-link{font-size:14px;line-height:22px;letter-spacing:0.04em}.video-description{min-width:min-content;flex-basis:min-content;flex-grow:1}@media (forced-colors: active){devtools-link{color:linktext}}
/*# sourceURL=${import.meta.resolve("./panelFeedback.css")} */`;var o={previewText:"Our team is actively working on this feature and we would love to know what you think.",previewTextFeedbackLink:"Send us your feedback.",previewFeature:"Preview feature",videoAndDocumentation:"Video and documentation"},M=k.i18n.registerUIStrings("ui/components/panel_feedback/PanelFeedback.ts",o),r=k.i18n.getLocalizedString.bind(void 0,M),q=new URL("../../../Images/preview_feature_video_thumbnail.svg",import.meta.url).toString(),n=class extends HTMLElement{#i=this.attachShadow({mode:"open"});#e={feedbackUrl:m.DevToolsPath.EmptyUrlString,quickStartUrl:m.DevToolsPath.EmptyUrlString,quickStartLinkText:""};set data(e){this.#e=e,v.ScheduledRender.scheduleRender(this,this.#t)}#t(){if(!v.ScheduledRender.isScheduledRender(this))throw new Error("PanelFeedback render was not scheduled");_(P`
      <style>${L}</style>
      <div class="preview">
        <h2 class="flex">
          <devtools-icon name="experiment" class="extra-large" style="color: var(--icon-primary);"></devtools-icon> ${r(o.previewFeature)}
        </h2>
        <p>${r(o.previewText)} <devtools-link href=${this.#e.feedbackUrl} .jslogContext=${"feedback"}>${r(o.previewTextFeedbackLink)}</devtools-link></p>
        <div class="video">
          <div class="thumbnail">
            <img src=${q} role="presentation" />
          </div>
          <div class="video-description">
            <h3>${r(o.videoAndDocumentation)}</h3>
            <devtools-link class="quick-start-link" href=${this.#e.quickStartUrl} jslogcontext="css-overview.quick-start">${this.#e.quickStartLinkText}</devtools-link>
          </div>
        </div>
      </div>
      `,this.#i,{host:this})}};customElements.define("devtools-panel-feedback",n);var R={};c(R,{PreviewToggle:()=>d});import"./../../kit/kit.js";import"./../../legacy/legacy.js";import*as u from"./../../../core/i18n/i18n.js";import*as g from"./../../../core/root/root.js";import{html as l,nothing as f,render as z}from"./../../lit/lit.js";var T=`:host{display:block}.container{display:flex;flex-wrap:wrap;padding:4px}.feedback,
.learn-more{display:flex;align-items:center}.helper{flex-basis:100%;text-align:center;font-style:italic}.spacer{flex:1}.devtools-link{color:var(--sys-color-primary);text-decoration-line:underline;margin:0 4px}.feedback .devtools-link{color:var(--sys-color-token-subtle)}
/*# sourceURL=${import.meta.resolve("./previewToggle.css")} */`;var a={previewTextFeedbackLink:"Send us your feedback.",shortFeedbackLink:"Send feedback",learnMoreLink:"Learn More"},j=u.i18n.registerUIStrings("ui/components/panel_feedback/PreviewToggle.ts",a),x=u.i18n.getLocalizedString.bind(void 0,j),d=class extends HTMLElement{#i=this.attachShadow({mode:"open"});#e="";#t=null;#o=null;#r;#s="";#n;set data(e){this.#e=e.name,this.#t=e.helperText,this.#o=e.feedbackURL,this.#r=e.learnMoreURL,this.#s=e.experiment,this.#n=e.onChangeCallback,this.#l()}#l(){let e=this.#s&&g.Runtime.experiments.isEnabled(this.#s);z(l`
      <style>${T}</style>
      <div class="container">
          <devtools-checkbox
            ?checked=${e}
            @change=${this.#a}
            aria-label=${this.#e} >
            <devtools-icon name="experiment" class="medium">
          </devtools-icon>${this.#e}
          </devtools-checkbox>
        <div class="spacer"></div>
        ${this.#o&&!this.#t?l`<div class="feedback"><devtools-link class="devtools-link" href=${this.#o} jslogContext=${"feedback"}>${x(a.shortFeedbackLink)}</devtools-link></div>`:f}
        ${this.#r?l`<div class="learn-more"><devtools-link class="devtools-link" href=${this.#r} jslogContext=${"learn-more"}>${x(a.learnMoreLink)}</devtools-link></div>`:f}
        <div class="helper">
          ${this.#t&&this.#o?l`<p>${this.#t} <devtools-link class="devtools-link" href=${this.#o} jslogContext=${"feedback"}>${x(a.previewTextFeedbackLink)}</devtools-link></p>`:f}
        </div>
      </div>`,this.#i,{host:this})}#a(e){let t=e.target.checked;this.#s&&g.Runtime.experiments.setEnabled(this.#s,t),this.#n?.(t)}};customElements.define("devtools-preview-toggle",d);export{y as FeedbackButton,U as PanelFeedback,R as PreviewToggle};
//# sourceMappingURL=panel_feedback.js.map
