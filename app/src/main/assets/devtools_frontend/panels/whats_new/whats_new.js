var j=Object.defineProperty;var v=(s,t)=>{for(var e in t)j(s,e,{get:t[e],enumerable:!0})};var T={};v(T,{VideoType:()=>n,getReleaseNote:()=>i,setReleaseNoteForTest:()=>G});import*as I from"./../../ui/components/markdown_view/markdown_view.js";var S=!1,n=(s=>(s.WHATS_NEW="WhatsNew",s.DEVTOOLS_TIPS="DevtoolsTips",s.OTHER="Other",s))(n||{});function G(s){p=s}function i(){if(!S){for(let{key:s,link:t}of p.markdownLinks)I.MarkdownLinksMap.markdownLinks.set(s,t);S=!0}return p}var p={version:146,header:"What's new in DevTools 146",markdownLinks:[{key:"mcp-server",link:"https://developer.chrome.com/blog/new-in-devtools-146/#mcp-server"},{key:"console-history",link:"https://developer.chrome.com/blog/new-in-devtools-146/#console-history"},{key:"adopted-stylesheets",link:"https://developer.chrome.com/blog/new-in-devtools-146/#adopted-stylesheets"}],videoLinks:[],link:"https://developer.chrome.com/blog/new-in-devtools-146/"};var C={};v(C,{DEVTOOLS_TIPS_THUMBNAIL:()=>_,GENERAL_THUMBNAIL:()=>A,ReleaseNoteView:()=>c,WHATS_NEW_THUMBNAIL:()=>H,getMarkdownContent:()=>$});import"./../../ui/components/markdown_view/markdown_view.js";import"./../../ui/kit/kit.js";import*as u from"./../../core/i18n/i18n.js";import*as L from"./../../third_party/marked/marked.js";import*as U from"./../../ui/components/buttons/buttons.js";import*as V from"./../../ui/helpers/helpers.js";import*as M from"./../../ui/legacy/legacy.js";import{html as g,render as q}from"./../../ui/lit/lit.js";import*as E from"./../../ui/visual_logging/visual_logging.js";var z=`@scope to (devtools-widget > *){.whatsnew{background:var(--sys-color-header-container);flex-grow:1;flex-shrink:0;display:flex;width:100%;height:100%;overflow:auto;justify-content:center}.whatsnew-content{max-width:var(--sys-size-35);padding:var(--sys-size-9) 0 0;>*{padding:0 var(--sys-size-9) var(--sys-size-9) var(--sys-size-9)}}.header{display:flex;align-items:center;font:var(--sys-typescale-headline4);&::before{content:"";width:var(--sys-size-9);height:var(--sys-size-9);transform:scale(1.6);margin:0 var(--sys-size-8) 0 var(--sys-size-4);background-image:var(--image-file-devtools);flex-shrink:0}}.feature-container{flex-grow:1;padding:0;background-color:var(--sys-color-surface);border-radius:var(--sys-shape-corner-large) var(--sys-shape-corner-large) 0 0;display:flex;flex-direction:column}.feature{background-color:var(--sys-color-surface3);padding:0 var(--sys-size-8) var(--sys-size-8);border-radius:var(--sys-shape-corner-medium);margin:0 var(--sys-size-9) var(--sys-size-9)}.video-container{margin-bottom:var(--sys-size-9);&:has(.video){--video-bottom-padding:var(--sys-size-6);overflow:auto;display:flex;flex-direction:row;gap:var(--sys-size-5);padding:var(--sys-size-9) var(--sys-size-9) var(--video-bottom-padding);margin-bottom:calc(var(--sys-size-9) - var(--video-bottom-padding));> *{min-width:auto}}}.video{align-items:center;display:flex;flex-direction:row;border-radius:var(--sys-shape-corner-medium);background-color:var(--sys-color-surface3);font:var(--sys-typescale-body5-regular);min-width:var(--sys-size-29);max-width:var(--sys-size-32);overflow:hidden;height:72px;&:hover{box-shadow:var(--sys-elevation-level3)}.thumbnail{border-radius:var(--sys-shape-corner-medium) 0 0 var(--sys-shape-corner-medium);flex-shrink:0}.thumbnail-description{--description-margin:var(--sys-size-6);margin:var(--description-margin);height:calc(100% - var(--description-margin) * 2);overflow:hidden}}devtools-link:focus .video{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring)}@media (forced-colors: active){.feature,
    .video{border:var(--sys-size-1) solid ButtonText}}}
/*# sourceURL=${import.meta.resolve("./releaseNoteView.css")} */`;var R={seeFeatures:"See all new features"},X=u.i18n.registerUIStrings("panels/whats_new/ReleaseNoteView.ts",R),Y=u.i18n.getLocalizedString.bind(void 0,X),H="../../Images/whatsnew.svg",_="../../Images/devtools-tips.svg",A="../../Images/devtools-thumbnail.svg";async function $(){let s=await c.getFileContent(),t=L.Marked.lexer(s),e=[],o=Number.MAX_SAFE_INTEGER;return t.forEach(r=>{r.type==="heading"&&o>=r.depth?(e.push([r]),o=r.depth):e.length>0?e[e.length-1].push(r):e.push([r])}),e}var c=class extends M.Panel.Panel{#e;constructor(t=(e,o,r)=>{let m=e.getReleaseNote(),F=e.markdownContent;q(g`
      <style>${z}</style>
      <div class="whatsnew" jslog=${E.section().context("release-notes")}>
        <div class="whatsnew-content">
          <div class="header">
            ${m.header}
          </div>
          <div>
            <devtools-button
                  .variant=${U.Button.Variant.PRIMARY}
                  .jslogContext=${"learn-more"}
                  @click=${()=>e.openNewTab(m.link)}
              >${Y(R.seeFeatures)}</devtools-button>
          </div>

          <div class="feature-container">
            <div class="video-container">
              ${m.videoLinks.map(a=>g`
                  <devtools-link
                  href=${a.link}
                  jslogcontext="learn-more">
                    <div class="video">
                      <img class="thumbnail" src=${e.getThumbnailPath(a.type??n.WHATS_NEW)}>
                      <div class="thumbnail-description"><span>${a.description}</span></div>
                    </div>
                </devtools-link>
                `)}
            </div>
            ${F.map(a=>g`
                  <div class="feature">
                    <devtools-markdown-view slot="content" .data=${{tokens:a}}>
                    </devtools-markdown-view>
                  </div>`)}
          </div>
        </div>
      </div>
    `,r)}){super("whats-new",!0),this.#e=t,this.requestUpdate()}static async getFileContent(){let t=new URL("./resources/WNDT.md",import.meta.url);try{return await(await fetch(t.toString())).text()}catch{throw new Error(`Markdown file ${t.toString()} not found. Make sure it is correctly listed in the relevant BUILD.gn files.`)}}async performUpdate(){let t=await $();this.#e({getReleaseNote:i,openNewTab:V.openInNewTab,markdownContent:t,getThumbnailPath:this.#t},this,this.contentElement)}#t(t){let e;switch(t){case n.WHATS_NEW:e=H;break;case n.DEVTOOLS_TIPS:e=_;break;case n.OTHER:e=A;break}return new URL(e,import.meta.url).toString()}};var D={};v(D,{HelpLateInitialization:()=>k,ReleaseNotesActionDelegate:()=>N,ReportIssueActionDelegate:()=>x,getReleaseNoteVersionSetting:()=>J,releaseNoteViewId:()=>P,releaseVersionSeen:()=>d,showReleaseNoteIfNeeded:()=>B});import*as l from"./../../core/common/common.js";import*as W from"./../../core/host/host.js";import*as b from"./../../ui/helpers/helpers.js";import*as O from"./../../ui/legacy/legacy.js";var d="releaseNoteVersionSeen",P="release-note",h;function B(){let t=l.Settings.Settings.instance().createSetting(d,0).get(),e=i();return K(t,e.version,l.Settings.Settings.instance().moduleSetting("help.show-release-note").get())}function J(){return h||(h=l.Settings.Settings.instance().createSetting(d,0)),h}function K(s,t,e){let o=l.Settings.Settings.instance().createSetting(d,0);return s?!e||s>=t?!1:(o.set(t),O.ViewManager.ViewManager.instance().showView(P,!0),!0):(o.set(t),!1)}var w,k=class s{static instance(t={forceNew:null}){let{forceNew:e}=t;return(!w||e)&&(w=new s),w}async run(){W.InspectorFrontendHost.isUnderTest()||B()}},f,N=class s{handleAction(t,e){let o=i();return b.openInNewTab(o.link),!0}static instance(t={forceNew:null}){let{forceNew:e}=t;return(!f||e)&&(f=new s),f}},y,x=class s{handleAction(t,e){return b.openInNewTab("https://goo.gle/devtools-bug"),!0}static instance(t={forceNew:null}){let{forceNew:e}=t;return(!y||e)&&(y=new s),y}};export{T as ReleaseNoteText,C as ReleaseNoteView,D as WhatsNew};
//# sourceMappingURL=whats_new.js.map
