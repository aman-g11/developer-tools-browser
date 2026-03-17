var se=Object.create;var L=Object.defineProperty;var ie=Object.getOwnPropertyDescriptor;var oe=Object.getOwnPropertyNames;var re=Object.getPrototypeOf,ae=Object.prototype.hasOwnProperty;var ne=(s,e)=>()=>(e||s((e={exports:{}}).exports,e),e.exports),D=(s,e)=>{for(var t in e)L(s,t,{get:e[t],enumerable:!0})},he=(s,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of oe(e))!ae.call(s,i)&&i!==t&&L(s,i,{get:()=>e[i],enumerable:!(o=ie(e,i))||o.enumerable});return s};var le=(s,e,t)=>(t=s!=null?se(re(s)):{},he(e||!s||!s.__esModule?L(t,"default",{value:s,enumerable:!0}):t,s));var j=ne(()=>{"use strict"});var N={};D(N,{DEFAULT_VIEW:()=>W,SearchResultsPane:()=>S,lineSegmentForMatch:()=>V,matchesExpandedByDefault:()=>H,matchesShownAtOnce:()=>O});import*as T from"./../../core/common/common.js";import*as E from"./../../core/i18n/i18n.js";import*as z from"./../../core/platform/platform.js";import*as C from"./../../models/text_utils/text_utils.js";import*as M from"./../../ui/legacy/legacy.js";import{html as b,render as ce}from"./../../ui/lit/lit.js";var K=`:host{padding:0;margin:0;overflow-y:auto}.tree-outline{padding:0}.tree-outline ol{padding:0}.tree-outline li{height:16px}li.search-result{cursor:pointer;font-size:12px;margin-top:8px;padding:2px 0 2px 4px;overflow-wrap:normal;white-space:pre}li.search-result .tree-element-title{display:flex;width:100%}li.search-result:hover{background-color:var(--sys-color-state-hover-on-subtle)}li.search-result .search-result-file-name{color:var(--sys-color-on-surface);flex:1 1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}li.search-result .search-result-matches-count{color:var(--sys-color-token-subtle);margin:0 8px}li.search-result.expanded .search-result-matches-count{display:none}li.show-more-matches{color:var(--sys-color-on-surface);cursor:pointer;margin:8px 0 0 -4px}li.show-more-matches:hover{text-decoration:underline}li.search-match{margin:2px 0;overflow-wrap:normal;white-space:pre}li.search-match .tree-element-title{display:flex}li.search-match.selected:focus-visible{background:var(--sys-color-tonal-container)}li.search-match::before{display:none}li.search-match .search-match-line-number{color:var(--sys-color-token-subtle);text-align:right;vertical-align:top;word-break:normal;padding:2px 4px 2px 6px;margin-right:5px}.tree-outline .devtools-link{text-decoration:none;display:block;flex:auto}li.search-match .search-match-content{color:var(--sys-color-on-surface)}ol.children.expanded{padding-bottom:4px}li.search-match .link-style.search-match-link{overflow:hidden;text-overflow:ellipsis;margin-left:9px;text-align:left}.search-result-qualifier{color:var(--sys-color-token-subtle)}.search-result-dash{color:var(--sys-color-surface-variant);margin:0 4px}
/*# sourceURL=${import.meta.resolve("./searchResultsPane.css")} */`;var k={matchesCountS:"Matches Count {PH1}",lineS:"Line {PH1}",showDMore:"Show {PH1} more"},de=E.i18n.registerUIStrings("panels/search/SearchResultsPane.ts",k),P=E.i18n.getLocalizedString.bind(void 0,de),{ifExpanded:ue}=M.TreeOutline,W=(s,e,t)=>{let{results:o,matches:i,expandedResults:c,onSelectMatch:u,onExpandSearchResult:l,onShowMoreMatches:n}=s,d=(h,{detail:{expanded:p}})=>{p?(c.add(h),l(h)):c.delete(h)};ce(b`
    <devtools-tree hide-overflow .template=${b`
      <ul role="tree">
        ${o.map(h=>b`
          <li @expand=${p=>d(h,p)}
              role="treeitem"
              class="search-result"
              ?open=${c.has(h)}>
            <style>${K}</style>
            ${ge(h)}
            <ul role="group">
              ${ue(pe(h,i,u,n))}
            </ul>
          </li>`)}
      </ul>
    `}></devtools-tree>`,t)},ge=s=>b`
    <span class="search-result-file-name">${s.label()}
      <span class="search-result-dash">${"\u2014"}</span>
      <span class="search-result-qualifier">${s.description()}</span>
    </span>
    <span class="search-result-matches-count"
        aria-label=${P(k.matchesCountS,{PH1:s.matchesCount()})}>
        ${s.matchesCount()}
    </span>`,pe=(s,e,t,o)=>{let i=e.get(s)??[],c=s.matchesCount()-i.length;return b`
      ${i.map(({lineContent:u,matchRanges:l,resultLabel:n},d)=>b`
        <li role="treeitem" class="search-match" @click=${()=>t(s,d)}
          @keydown=${h=>{h.key==="Enter"&&t(s,d)}}
        >
          <button class="devtools-link text-button link-style search-match-link"
                  jslog="Link; context: search-match; track: click" role="link" tabindex="0"
                  @click=${()=>void T.Revealer.reveal(s.matchRevealable(d))}>
            <span class="search-match-line-number"
                aria-label=${typeof n=="number"&&!isNaN(n)?P(k.lineS,{PH1:n}):n}>
              ${n}
            </span>
            <span class="search-match-content" aria-label="${u} line"
                  ${M.TreeOutline.TreeSearch.highlight(l,void 0)}>
              ${u}
            </span>
          </button>
        </li>`)}
      ${c>0?b`
        <li role="treeitem" class="show-more-matches" @click=${()=>o(s)}>
          ${P(k.showDMore,{PH1:c})}
        </li>`:""}`},S=class extends M.Widget.VBox{#o=null;#t=[];#n=!1;#r=new WeakSet;#s=new WeakMap;#a;constructor(e,t=W){super(e,{useShadowDom:!0}),this.#a=t}get searchResults(){return this.#t}set searchResults(e){if(this.#t!==e){if(this.#t.length!==e.length)this.#n=!0;else if(this.#t.length===e.length){for(let t=0;t<this.#t.length;++t)if(this.#t[t]!==e[t]){this.#n=!0;break}}this.#n&&(this.#t=e,this.requestUpdate())}}get searchConfig(){return this.#o}set searchConfig(e){this.#o=e,this.requestUpdate()}showAllMatches(){for(let e of this.#t){let t=this.#s.get(e)?.length??0;this.#h(e,t,e.matchesCount()),this.#r.add(e)}this.requestUpdate()}collapseAllResults(){this.#r=new WeakSet,this.requestUpdate()}#i(e){let t=Math.min(e.matchesCount(),O);this.#h(e,0,t),this.requestUpdate()}#h(e,t,o){if(!this.#o)return;let i=this.#o.queries(),c=[];for(let l=0;l<i.length;++l)c.push(z.StringUtilities.createSearchRegex(i[l],!this.#o.ignoreCase(),this.#o.isRegex()));let u=this.#s.get(e)??[];if(this.#s.set(e,u),!(u.length>=o))for(let l=t;l<o;++l){let n=e.matchLineContent(l),d=[],h=e.matchColumn(l),p=e.matchLength(l);if(h!==void 0&&p!==void 0){let{matchRange:m,lineSegment:R}=V(n,new C.TextRange.SourceRange(h,p));n=R,d=[m]}else{n=n.trim();for(let m=0;m<c.length;++m)d=d.concat(this.#l(n,c[m]));({lineSegment:n,matchRanges:d}=me(n,d))}let w=e.matchLabel(l);u.push({lineContent:n,matchRanges:d,resultLabel:w})}}performUpdate(){if(this.#n){let e=0;for(let t of this.#t)this.#r.has(t)&&(e+=this.#s.get(t)?.length??0);for(let t of this.#t)e<H&&!this.#r.has(t)&&(this.#r.add(t),this.#i(t),e+=this.#s.get(t)?.length??0);this.#n=!1}this.#a({results:this.#t,matches:this.#s,expandedResults:this.#r,onSelectMatch:(e,t)=>{T.Revealer.reveal(e.matchRevealable(t))},onExpandSearchResult:this.#i.bind(this),onShowMoreMatches:this.#m.bind(this)},{},this.contentElement)}#l(e,t){t.lastIndex=0;let o,i=[];for(;t.lastIndex<e.length&&(o=t.exec(e));)i.push(new C.TextRange.SourceRange(o.index,o[0].length));return i}#m(e){let t=this.#s.get(e)?.length??0;this.#h(e,t,e.matchesCount()),this.requestUpdate()}},H=200,O=20,q={prefixLength:25,maxLength:1e3};function V(s,e,t=q){let o={...q,...t},i=s.trimStart(),c=s.length-i.length,u=Math.min(e.offset,c),l=Math.max(u,e.offset-o.prefixLength),n=Math.min(s.length,l+o.maxLength),d=l>u?"\u2026":"",h=d+s.substring(l,n),p=e.offset-l+d.length,w=Math.min(e.length,h.length-p),m=new C.TextRange.SourceRange(p,w);return{lineSegment:h,matchRange:m}}function me(s,e){let t=0,o=e;o.length>0&&o[0].offset>20&&(t=15);let i=s.substring(t,1e3+t);return t&&(o=o.map(c=>new C.TextRange.SourceRange(c.offset-t+1,c.length)),i="\u2026"+i),{lineSegment:i,matchRanges:o}}var Ae=le(j());var J={};D(J,{DEFAULT_VIEW:()=>Y,SearchView:()=>B});import"./../../ui/legacy/legacy.js";import"./../../ui/kit/kit.js";import*as v from"./../../core/common/common.js";import*as G from"./../../core/host/host.js";import*as F from"./../../core/i18n/i18n.js";import*as I from"./../../models/workspace/workspace.js";import*as f from"./../../ui/components/buttons/buttons.js";import*as g from"./../../ui/legacy/legacy.js";import{Directives as fe,html as A,render as xe}from"./../../ui/lit/lit.js";import*as x from"./../../ui/visual_logging/visual_logging.js";var _=`.search-drawer-header{flex-shrink:0;overflow:hidden;display:inline-flex;min-width:150px;.search-container{border-bottom:1px solid var(--sys-color-divider);display:flex;align-items:center;flex-grow:1}.toolbar-item-search{flex-grow:1;box-shadow:inset 0 0 0 2px transparent;box-sizing:border-box;height:var(--sys-size-9);margin-left:var(--sys-size-3);padding:0 var(--sys-size-2) 0 var(--sys-size-5);border-radius:100px;position:relative;display:flex;align-items:center;background-color:var(--sys-color-cdt-base);&:has(input:focus){box-shadow:inset 0 0 0 2px var(--sys-color-state-focus-ring)}&:has(input:hover)::before{content:"";box-sizing:inherit;height:100%;width:100%;position:absolute;border-radius:100px;left:0;background-color:var(--sys-color-state-hover-on-subtle)}& > devtools-icon{color:var(--sys-color-on-surface-subtle);width:var(--sys-size-8);height:var(--sys-size-8);margin-right:var(--sys-size-3)}& > devtools-button:last-child{margin-right:var(--sys-size-4)}}.search-toolbar-input{appearance:none;color:var(--sys-color-on-surface);background-color:transparent;border:0;z-index:1;flex:1;&::placeholder{color:var(--sys-color-on-surface-subtle)}&:placeholder-shown + .clear-button{display:none}&::-webkit-search-cancel-button{display:none}}}.search-toolbar{background-color:var(--sys-color-cdt-base-container);border-bottom:1px solid var(--sys-color-divider)}.search-toolbar-summary{background-color:var(--sys-color-cdt-base-container);border-top:1px solid var(--sys-color-divider);padding-left:5px;flex:0 0 19px;display:flex;padding-right:5px}.search-results:has(.empty-state) + .search-toolbar-summary{display:none}.search-toolbar-summary .search-message{padding-top:2px;padding-left:1ex;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.search-results{overflow-y:auto;display:flex;flex:auto}.search-results > div{flex:auto}
/*# sourceURL=${import.meta.resolve("./searchView.css")} */`;var r={find:"Find",enableCaseSensitive:"Enable case sensitive search",disableCaseSensitive:"Disable case sensitive search",enableRegularExpression:"Enable regular expressions",disableRegularExpression:"Disable regular expressions",refresh:"Refresh",clearInput:"Clear",clear:"Clear search",indexing:"Indexing\u2026",searching:"Searching\u2026",indexingInterrupted:"Indexing interrupted.",foundMatchingLineInFile:"Found 1 matching line in 1 file.",foundDMatchingLinesInFile:"Found {PH1} matching lines in 1 file.",foundDMatchingLinesInDFiles:"Found {PH1} matching lines in {PH2} files.",noMatchesFound:"No matches found",nothingMatchedTheQuery:"Nothing matched your search query",searchFinished:"Search finished.",searchInterrupted:"Search interrupted.",typeAndPressSToSearch:"Type and press {PH1} to search",noSearchResult:"No search results"},ye=F.i18n.registerUIStrings("panels/search/SearchView.ts",r),a=F.i18n.getLocalizedString.bind(void 0,ye),{ref:be,live:ve}=fe,{widget:Q,widgetRef:Se}=g.Widget,Y=(s,e,t)=>{let{query:o,matchCase:i,isRegex:c,searchConfig:u,searchMessage:l,searchResults:n,searchResultsMessage:d,progress:h,onQueryChange:p,onQueryKeyDown:w,onPanelKeyDown:m,onClearSearchInput:R,onToggleRegex:X,onToggleMatchCase:Z,onRefresh:ee,onClearSearch:te}=s,$="",U="";o?h?$=a(r.searching):n.length||($=a(r.noMatchesFound),U=a(r.nothingMatchedTheQuery)):($=a(r.noSearchResult),U=a(r.typeAndPressSToSearch,{PH1:g.KeyboardShortcut.KeyboardShortcut.shortcutToString(g.KeyboardShortcut.Keys.Enter)})),xe(A`
      <style>${g.inspectorCommonStyles}</style>
      <style>${_}</style>
      <div class="search-drawer-header" @keydown=${m}>
        <div class="search-container">
          <div class="toolbar-item-search">
            <devtools-icon name="search"></devtools-icon>
            <input type="text"
                class="search-toolbar-input"
                placeholder=${a(r.find)}
                jslog=${x.textField().track({change:!0,keydown:"ArrowUp|ArrowDown|Enter"})}
                aria-label=${a(r.find)}
                size="100" results="0"
                .value=${ve(o)}
                @keydown=${w}
                @input=${y=>p(y.target.value)}
                ${be(y=>{e.focusSearchInput=()=>{y instanceof HTMLInputElement&&(y.focus(),y.select())}})}>
            <devtools-button class="clear-button" tabindex="-1"
                @click=${R}
                .data=${{variant:f.Button.Variant.ICON,iconName:"cross-circle-filled",jslogContext:"clear-input",size:f.Button.Size.SMALL,title:a(r.clearInput)}}
            ></devtools-button>
            <devtools-button @click=${X} .data=${{variant:f.Button.Variant.ICON_TOGGLE,iconName:"regular-expression",toggledIconName:"regular-expression",toggleType:f.Button.ToggleType.PRIMARY,size:f.Button.Size.SMALL,toggled:c,title:a(c?r.disableRegularExpression:r.enableRegularExpression),jslogContext:"regular-expression"}}
              class="regex-button"
            ></devtools-button>
            <devtools-button @click=${Z} .data=${{variant:f.Button.Variant.ICON_TOGGLE,iconName:"match-case",toggledIconName:"match-case",toggleType:f.Button.ToggleType.PRIMARY,size:f.Button.Size.SMALL,toggled:i,title:a(i?r.disableCaseSensitive:r.enableCaseSensitive),jslogContext:"match-case"}}
              class="match-case-button"
            ></devtools-button>
          </div>
        </div>
        <devtools-toolbar class="search-toolbar" jslog=${x.toolbar()}>
          <devtools-button title=${a(r.refresh)} @click=${ee}
              .data=${{variant:f.Button.Variant.TOOLBAR,iconName:"refresh",jslogContext:"search.refresh"}}></devtools-button>
          <devtools-button title=${a(r.clear)} @click=${te}
              .data=${{variant:f.Button.Variant.TOOLBAR,iconName:"clear",jslogContext:"search.clear"}}></devtools-button>
        </devtools-toolbar>
      </div>
      <div class="search-results" @keydown=${m}>
        ${n.length?A`<devtools-widget ${Q(S,{searchResults:n,searchConfig:u})}
            ${Se(S,y=>{e.showAllMatches=()=>void y.showAllMatches(),e.collapseAllResults=()=>void y.collapseAllResults()})}>
            </devtools-widget>`:Q(g.EmptyWidget.EmptyWidget,{header:$,text:U})}
      </div>
      <div class="search-toolbar-summary" @keydown=${m}>
        <div class="search-message">${l}</div>
        <div class="flex-centered">
          ${h?A`
            <devtools-progress .title=${h.title??""}
                               .worked=${h.worked} .totalWork=${h.totalWork}>
            </devtools-progress>`:""}
        </div>
        <div class="search-message">${d}</div>
      </div>`,t)},B=class extends g.Widget.VBox{#o;#t=()=>{};#n=()=>{};#r=()=>{};#s;#a;#i;#h;#l;#m;#b;#p;#e;#d;#f=!1;#x=!1;#u="";#g="";#v;#c;#y=[];constructor(e,t=Y){super({jslog:`${x.panel("search").track({resize:!0})}`,useShadowDom:!0}),this.#o=t,this.setMinimumSize(0,40),this.#s=!1,this.#a=1,this.#d="",this.#i=0,this.#h=0,this.#l=0,this.#m=null,this.#b=null,this.#p=null,this.#e=null,this.#v=v.Settings.Settings.instance().createLocalSetting(e+"-search-config",new I.SearchConfig.SearchConfig("",!0,!1).toPlainObject()),this.performUpdate(),this.#W(),this.performUpdate(),this.#c=null}performUpdate(){let e={query:this.#d,matchCase:this.#f,isRegex:this.#x,searchConfig:this.#b,searchMessage:this.#u,searchResults:this.#y.filter(i=>i.matchesCount()),searchResultsMessage:this.#g,progress:this.#e,onQueryChange:i=>{this.#d=i},onQueryKeyDown:this.#q.bind(this),onPanelKeyDown:this.#z.bind(this),onClearSearchInput:this.#k.bind(this),onToggleRegex:this.#P.bind(this),onToggleMatchCase:this.#T.bind(this),onRefresh:this.#S.bind(this),onClearSearch:this.#H.bind(this)},t=this,o={set focusSearchInput(i){t.#t=i},set showAllMatches(i){t.#n=i},set collapseAllResults(i){t.#r=i}};this.#o(e,o,this.contentElement)}#P(){this.#x=!this.#x,this.performUpdate()}#T(){this.#f=!this.#f,this.performUpdate()}#w(){return new I.SearchConfig.SearchConfig(this.#d,!this.#f,this.#x)}toggle(e,t){this.#d=e,this.requestUpdate(),this.updateComplete.then(()=>{this.focus()}),this.#C(),t?this.#S():this.#$()}createScope(){throw new Error("Not implemented")}#C(){this.#c=this.createScope()}#M(){if(!this.#e)return;let e=!this.#e.canceled;if(this.#e=null,this.#s=!1,this.#u=e?"":a(r.indexingInterrupted),e||(this.#p=null),this.performUpdate(),!this.#p)return;let t=this.#p;this.#p=null,this.#B(t)}#$(){this.#s=!0,this.#e&&(this.#e.done=!0),this.#e=new v.Progress.ProgressProxy(new v.Progress.Progress,this.#M.bind(this),this.requestUpdate.bind(this)),this.#u=a(r.indexing),this.performUpdate(),this.#c&&this.#c.performIndexing(this.#e)}#k(){this.#d="",this.requestUpdate(),this.#L(),this.focus()}#E(e,t){if(!(e!==this.#a||!this.#e)){if(this.#e?.canceled){this.#M();return}this.#y.push(t),this.#D(t),this.requestUpdate()}}#A(e,t){e!==this.#a||!this.#e||(this.#e=null,this.#K(t),g.ARIAUtils.LiveAnnouncer.alert(this.#u+" "+this.#g))}#B(e){this.#b=e,this.#e&&(this.#e.done=!0),this.#e=new v.Progress.ProgressProxy(new v.Progress.Progress,void 0,this.requestUpdate.bind(this)),this.#F(),this.#c&&this.#c.performSearch(e,this.#e,this.#E.bind(this,this.#a),this.#A.bind(this,this.#a))}#I(){this.#R(),this.#y=[],this.#u="",this.#g="",this.performUpdate()}#R(){this.#e&&!this.#s&&(this.#e.canceled=!0),this.#c&&this.#c.stopSearch()}#F(){this.#i=0,this.#h=0,this.#y=[],this.#l=0,this.#m||(this.#m=new g.EmptyWidget.EmptyWidget(a(r.searching),"")),this.#u=a(r.searching),this.performUpdate(),this.#U()}#U(){this.#i&&this.#h?this.#i===1&&this.#l===1?this.#g=a(r.foundMatchingLineInFile):this.#i>1&&this.#l===1?this.#g=a(r.foundDMatchingLinesInFile,{PH1:this.#i}):this.#g=a(r.foundDMatchingLinesInDFiles,{PH1:this.#i,PH2:this.#l}):this.#g="",this.performUpdate()}#D(e){let t=e.matchesCount();this.#i+=t,this.#h++,t&&this.#l++,this.#U()}#K(e){this.#u=a(e?r.searchFinished:r.searchInterrupted),this.requestUpdate()}focus(){this.#t()}willHide(){super.willHide(),this.#R()}#q(e){switch(this.#L(),e.keyCode){case g.KeyboardShortcut.Keys.Enter.code:this.#S();break}}#z(e){let t=G.Platform.isMac(),o=t&&e.metaKey&&!e.ctrlKey&&e.altKey&&e.code==="BracketRight",i=!t&&e.ctrlKey&&!e.metaKey&&e.shiftKey&&e.code==="BracketRight",c=t&&e.metaKey&&!e.ctrlKey&&e.altKey&&e.code==="BracketLeft",u=!t&&e.ctrlKey&&!e.metaKey&&e.shiftKey&&e.code==="BracketLeft";o||i?(this.#n(),x.logKeyDown(e.currentTarget,e,"show-all-matches")):(c||u)&&(this.#r(),x.logKeyDown(e.currentTarget,e,"collapse-all-results"))}#L(){this.#v.set(this.#w().toPlainObject())}#W(){let e=I.SearchConfig.SearchConfig.fromPlainObject(this.#v.get());this.#d=e.query(),this.#f=!e.ignoreCase(),this.#x=e.isRegex(),this.requestUpdate()}#S(){let e=this.#w();e.query()?.length&&(this.#I(),++this.#a,this.#C(),this.#s||this.#$(),this.#p=e)}#H(){this.#I(),this.#k()}};export{N as SearchResultsPane,Ae as SearchScope,J as SearchView};
//# sourceMappingURL=search.js.map
