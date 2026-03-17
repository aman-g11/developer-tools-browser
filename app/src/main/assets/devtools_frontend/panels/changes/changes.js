var ie=Object.defineProperty;var y=(o,e)=>{for(var t in e)ie(o,t,{get:e[t],enumerable:!0})};var Q={};y(Q,{ChangesView:()=>W,DEFAULT_VIEW:()=>K});import"./../../ui/legacy/legacy.js";import*as T from"./../../core/i18n/i18n.js";import*as B from"./../../models/greendev/greendev.js";import*as g from"./../../models/workspace_diff/workspace_diff.js";import*as n from"./../../ui/legacy/legacy.js";import*as L from"./../../ui/lit/lit.js";import*as X from"./../../ui/visual_logging/visual_logging.js";import*as J from"./../common/common.js";var A={};y(A,{ChangesSidebar:()=>d,DEFAULT_VIEW:()=>q,Events:()=>f});import"./../../ui/kit/kit.js";import*as F from"./../../core/common/common.js";import*as w from"./../../core/i18n/i18n.js";import*as a from"./../../models/workspace/workspace.js";import*as C from"./../../models/workspace_diff/workspace_diff.js";import*as _ from"./../../ui/legacy/legacy.js";import*as se from"./../../ui/lit/lit.js";import*as z from"./../../ui/visual_logging/visual_logging.js";import*as M from"./../snippets/snippets.js";var $=`@scope to (devtools-widget > *){.tree-outline li{min-height:20px}devtools-icon{color:var(--icon-file-default);margin-right:var(--sys-size-4)}.tree-element-title > div{display:flex;align-items:center}.navigator-sm-script-tree-item devtools-icon,
.navigator-script-tree-item devtools-icon,
.navigator-snippet-tree-item devtools-icon{color:var(--icon-file-script)}.navigator-sm-stylesheet-tree-item devtools-icon,
.navigator-stylesheet-tree-item devtools-icon{color:var(--icon-file-styles)}.navigator-image-tree-item devtools-icon{color:var(--icon-file-image)}.navigator-font-tree-item devtools-icon{color:var(--icon-file-font)}.tree-outline li:hover:not(.selected) .selection{display:block;& devtools-icon{color:var(--icon-default-hover)}}@media (forced-colors: active){li,
  devtools-icon{forced-color-adjust:none;color:ButtonText!important}}}
/*# sourceURL=${import.meta.resolve("./changesSidebar.css")} */`;var V={sFromSourceMap:"{PH1} (from source map)"},oe=w.i18n.registerUIStrings("panels/changes/ChangesSidebar.ts",V),re=w.i18n.getLocalizedString.bind(void 0,oe),{render:ne,html:U}=se,q=(o,e,t)=>{let i=s=>s.contentType().isFromSourceMap()?re(V.sFromSourceMap,{PH1:s.displayName()}):s.url(),r=s=>M.ScriptSnippetFileSystem.isSnippetsUISourceCode(s)?"snippet":"document";ne(U`<devtools-tree
             navigation-variant
             hide-overflow .template=${U`
               <ul role="tree">
                 ${o.sourceCodes.values().map(s=>U`
                   <li
                     role="treeitem"
                     @select=${()=>o.onSelect(s)}
                     ?selected=${s===o.selectedSourceCode}>
                       <style>${$}</style>
                       <div class=${"navigator-"+s.contentType().name()+"-tree-item"}>
                         <devtools-icon name=${r(s)}></devtools-icon>
                         <span title=${i(s)}>
                           <span ?hidden=${!s.isDirty()}>*</span>
                           ${s.displayName()}
                         </span>
                       </div>
                   </li>`)}
               </ul>`}></devtools-tree>`,t)},d=class extends F.ObjectWrapper.eventMixin(_.Widget.Widget){#i=null;#e;#t=new Set;#s=null;constructor(e,t=q){super(e,{jslog:`${z.pane("sidebar").track({resize:!0})}`}),this.#e=t}set workspaceDiff(e){this.#i&&(this.#i.modifiedUISourceCodes().forEach(this.#n.bind(this)),this.#i.removeEventListener(C.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.uiSourceCodeModifiedStatusChanged,this)),this.#i=e,this.#i.modifiedUISourceCodes().forEach(this.#r.bind(this)),this.#i.addEventListener(C.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.uiSourceCodeModifiedStatusChanged,this),this.requestUpdate()}selectedUISourceCode(){return this.#s}performUpdate(){let e={onSelect:t=>this.#o(t),sourceCodes:this.#t,selectedSourceCode:this.#s};this.#e(e,{},this.contentElement)}#o(e){this.#s=e,this.dispatchEventToListeners("SelectedUISourceCodeChanged"),this.requestUpdate()}#r(e){this.#t.add(e),e.addEventListener(a.UISourceCode.Events.TitleChanged,this.requestUpdate,this),e.addEventListener(a.UISourceCode.Events.WorkingCopyChanged,this.requestUpdate,this),e.addEventListener(a.UISourceCode.Events.WorkingCopyCommitted,this.requestUpdate,this),this.requestUpdate()}#n(e){if(e.removeEventListener(a.UISourceCode.Events.TitleChanged,this.requestUpdate,this),e.removeEventListener(a.UISourceCode.Events.WorkingCopyChanged,this.requestUpdate,this),e.removeEventListener(a.UISourceCode.Events.WorkingCopyCommitted,this.requestUpdate,this),e===this.#s){let t;for(let i of this.#t.values()){if(i===e)break;t=i}this.#t.delete(e),this.#o(t??this.#t.values().next().value??null)}else this.#t.delete(e);this.requestUpdate()}uiSourceCodeModifiedStatusChanged(e){let{isModified:t,uiSourceCode:i}=e.data;t?this.#r(i):this.#n(i),this.requestUpdate()}},f=(o=>(o.SELECTED_UI_SOURCE_CODE_CHANGED="SelectedUISourceCodeChanged",o))(f||{});var N=`[slot="main"]{flex-direction:column;display:flex}[slot="sidebar"]{overflow:auto}.diff-container{flex:1;overflow:auto;& .widget:first-child{height:100%}.combined-diff-view{padding-inline:var(--sys-size-6);padding-block:var(--sys-size-4)}}:focus.selected{background-color:var(--sys-color-tonal-container);color:var(--sys-color-on-tonal-container)}.changes-toolbar{background-color:var(--sys-color-cdt-base-container);border-top:1px solid var(--sys-color-divider)}[hidden]{display:none!important}.copy-to-prompt{margin:var(--sys-size-4);flex-grow:0!important}
/*# sourceURL=${import.meta.resolve("./changesView.css")} */`;var b={};y(b,{CombinedDiffView:()=>c});import"./../../ui/kit/kit.js";import*as O from"./../../core/common/common.js";import*as k from"./../../core/i18n/i18n.js";import*as h from"./../../models/persistence/persistence.js";import*as S from"./../../models/workspace_diff/workspace_diff.js";import*as D from"./../../ui/components/buttons/buttons.js";import*as v from"./../../ui/legacy/legacy.js";import*as p from"./../../ui/lit/lit.js";import*as H from"./../../ui/visual_logging/visual_logging.js";import*as G from"./../utils/utils.js";var P=`.combined-diff-view{display:flex;flex-direction:column;gap:var(--sys-size-5);height:100%;background-color:var(--sys-color-surface3);overflow:auto;details{flex-shrink:0;border-radius:12px;&.selected{outline:var(--sys-size-2) solid var(--sys-color-divider-on-tonal-container)}summary{background-color:var(--sys-color-surface1);border-radius:var(--sys-shape-corner-medium-small);height:var(--sys-size-12);padding:var(--sys-size-3);font:var(--sys-typescale-body5-bold);display:flex;justify-content:space-between;gap:var(--sys-size-2);&:focus-visible{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring);outline-offset:calc(-1 * var(--sys-size-2))}.summary-left{display:flex;align-items:center;min-width:0;flex-grow:0;.file-name-link{margin-left:var(--sys-size-5);width:100%;text-overflow:ellipsis;overflow:hidden;text-wrap-mode:nowrap;border:none;background:none;font:inherit;padding:0;&:hover{color:var(--sys-color-primary);text-decoration:underline;cursor:pointer}&:focus-visible{outline:var(--sys-size-2) solid var(--sys-color-state-focus-ring);outline-offset:var(--sys-size-2)}}devtools-icon{transform:rotate(270deg)}devtools-file-source-icon{height:var(--sys-size-8);width:var(--sys-size-8);flex-shrink:0}}.summary-right{flex-shrink:0;display:flex;align-items:center;gap:var(--sys-size-2);padding-right:var(--sys-size-4);.copied{font:var(--sys-typescale-body5-regular)}}&::marker{content:''}}.diff-view-container{overflow-x:auto;background-color:var(--sys-color-cdt-base-container);border-bottom-left-radius:var(--sys-shape-corner-medium-small);border-bottom-right-radius:var(--sys-shape-corner-medium-small)}&[open]{summary{border-radius:0;border-top-left-radius:var(--sys-shape-corner-medium-small);border-top-right-radius:var(--sys-shape-corner-medium-small);devtools-icon{transform:rotate(0deg)}}}}}
/*# sourceURL=${import.meta.resolve("./combinedDiffView.css")} */`;var ae=1e3,{html:E,Directives:{classMap:de}}=p,m={copied:"Copied to clipboard",copyFile:"Copy file {PH1} to clipboard"},le=k.i18n.registerUIStrings("panels/changes/CombinedDiffView.ts",m),I=k.i18n.getLocalizedString.bind(void 0,le);function ce(o){let{fileName:e,fileUrl:t,mimeType:i,icon:r,diff:s,copied:l,selectedFileUrl:Y,onCopy:Z,onFileNameClick:ee}=o,te=de({selected:Y===t});return E`
    <details open class=${te}>
      <summary>
        <div class="summary-left">
          <devtools-icon class="drop-down-icon" name="arrow-drop-down"></devtools-icon>
          ${r}
          <button class="file-name-link" jslog=${H.action("jump-to-file")} @click=${()=>ee(t)}>${e}</button>
        </div>
        <div class="summary-right">
          <devtools-button
            .title=${I(m.copyFile,{PH1:e})}
            .size=${D.Button.Size.SMALL}
            .iconName=${"copy"}
            .jslogContext=${"combined-diff-view.copy"}
            .variant=${D.Button.Variant.ICON}
            @click=${()=>Z(t)}
          ></devtools-button>
          ${l?E`<span class="copied">${I(m.copied)}</span>`:p.nothing}
        </div>
      </summary>
      <div class="diff-view-container">
        <devtools-diff-view
          .data=${{diff:s,mimeType:i}}>
        </devtools-diff-view>
      </div>
    </details>
  `}var pe=(o,e,t)=>{p.render(E`
      <div class="combined-diff-view">
        ${o.singleDiffViewInputs.map(i=>ce(i))}
      </div>
    `,t)},c=class extends v.Widget.Widget{ignoredUrls=[];#i;#e;#t=[];#s={};#o;#r={};constructor(e,t=pe){super(e),this.registerRequiredCSS(P),this.#o=t}wasShown(){super.wasShown(),this.#e?.addEventListener(S.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.#d,this),this.#a()}willHide(){super.willHide(),this.#e?.removeEventListener(S.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.#d,this)}set workspaceDiff(e){this.#e=e,this.#a()}set selectedFileUrl(e){this.#i=e,this.requestUpdate(),this.updateComplete.then(()=>{this.#r.scrollToSelectedDiff?.()})}async#n(e){let t=this.#t.find(r=>r.url()===e);if(!t)return;let i=t.workingCopyContentData();i.isTextContent&&(v.UIUtils.copyTextToClipboard(i.text,I(m.copied)),this.#s[e]=!0,this.requestUpdate(),setTimeout(()=>{delete this.#s[e],this.requestUpdate()},ae))}#l(e){let t=this.#t.find(i=>i.url()===e);O.Revealer.reveal(t)}async#a(){if(!this.#e)return;let e=this.#t,t=this.#e.modifiedUISourceCodes();e.filter(s=>!t.includes(s)).forEach(s=>this.#e?.unsubscribeFromDiffChange(s,this.requestUpdate,this)),t.filter(s=>!e.includes(s)).forEach(s=>this.#e?.subscribeToDiffChange(s,this.requestUpdate,this)),this.#t=t,this.isShowing()&&this.requestUpdate()}async#d(){this.#e&&await this.#a()}async performUpdate(){let t=(await Promise.all(this.#t.map(async i=>{for(let s of this.ignoredUrls)if(i.url().startsWith(s))return;return{diff:(await this.#e?.requestDiff(i))?.diff??[],uiSourceCode:i}}))).filter(i=>!!i).map(({uiSourceCode:i,diff:r})=>{let s=i.fullDisplayName(),l=h.Persistence.PersistenceImpl.instance().fileSystem(i);return l&&(s=[l.project().displayName(),...h.FileSystemWorkspaceBinding.FileSystemWorkspaceBinding.relativePath(l)].join("/")),{diff:r,fileName:`${i.isDirty()?"*":""}${s}`,fileUrl:i.url(),mimeType:i.mimeType(),icon:G.PanelUtils.getIconForSourceFile(i),copied:this.#s[i.url()],selectedFileUrl:this.#i,onCopy:this.#n.bind(this),onFileNameClick:this.#l.bind(this)}});this.#o({singleDiffViewInputs:t},this.#r,this.contentElement)}};var fe="https://developer.chrome.com/docs/devtools/changes",x={noChanges:"No changes yet",changesViewDescription:"On this page you can track code changes made within DevTools."},me=T.i18n.registerUIStrings("panels/changes/ChangesView.ts",x),R=T.i18n.getLocalizedString.bind(void 0,me),{render:he,html:j}=L,{widget:u}=n.Widget,K=(o,e,t)=>{let i=s=>{s.addEventListener(f.SELECTED_UI_SOURCE_CODE_CHANGED,()=>o.onSelect(s.selectedUISourceCode()))},r=B.Prototypes.instance().isEnabled("copyToGemini");he(j`
      <style>${N}</style>
      <devtools-split-view direction=column>
        <div class=vbox slot="main">
          <devtools-widget
            ?hidden=${o.workspaceDiff.modifiedUISourceCodes().length>0}
            ${u(n.EmptyWidget.EmptyWidget,{header:R(x.noChanges),text:R(x.changesViewDescription),link:fe})}>
          </devtools-widget>
          <div class=diff-container role=tabpanel ?hidden=${o.workspaceDiff.modifiedUISourceCodes().length===0}>
            ${u(c,{selectedFileUrl:o.selectedSourceCode?.url(),workspaceDiff:o.workspaceDiff})}
          </div>
          ${r?j`
            <devtools-widget class="copy-to-prompt"
              ${u(J.CopyChangesToPrompt,{workspaceDiff:o.workspaceDiff,patchAgentCSSChange:null})}
            ></devtools-widget>
          `:L.nothing}
        </div>
        <devtools-widget slot="sidebar" ${u(d,{workspaceDiff:o.workspaceDiff})}
          ${n.Widget.widgetRef(d,i)}>
        </devtools-widget>
      </devtools-split-view>`,t)},W=class o extends n.Widget.VBox{#i;#e=null;#t;constructor(e,t=K){super(e,{jslog:`${X.panel("changes").track({resize:!0})}`,useShadowDom:!0}),this.#i=g.WorkspaceDiff.workspaceDiff(),this.#t=t,this.requestUpdate()}performUpdate(){this.#t({workspaceDiff:this.#i,selectedSourceCode:this.#e,onSelect:e=>{this.#e=e,this.requestUpdate()}},{},this.contentElement)}wasShown(){n.Context.Context.instance().setFlavor(o,this),super.wasShown(),this.requestUpdate(),this.#i.addEventListener(g.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.requestUpdate,this)}willHide(){super.willHide(),n.Context.Context.instance().setFlavor(o,null),this.#i.removeEventListener(g.WorkspaceDiff.Events.MODIFIED_STATUS_CHANGED,this.requestUpdate,this)}};export{A as ChangesSidebar,Q as ChangesView,b as CombinedDiffView};
//# sourceMappingURL=changes.js.map
