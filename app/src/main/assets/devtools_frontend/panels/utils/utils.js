import"./../../ui/kit/kit.js";import"./../../ui/components/icon_button/icon_button.js";import*as n from"./../../core/common/common.js";import*as P from"./../../core/i18n/i18n.js";import*as O from"./../../core/sdk/sdk.js";import*as M from"./../../models/formatter/formatter.js";import*as v from"./../../models/persistence/persistence.js";import*as h from"./../../ui/components/diff_view/diff_view.js";import{Directives as x,html as u}from"./../../ui/lit/lit.js";import*as H from"./../common/common.js";import*as D from"./../snippets/snippets.js";var{ref:j,styleMap:U,ifDefined:W}=x,f={requestContentHeadersOverridden:"Both request content and headers are overridden",requestContentOverridden:"Request content is overridden",requestHeadersOverridden:"Request headers are overridden",thirdPartyPhaseout:"Cookies for this request are blocked either because of Chrome flags or browser configuration. Learn more in the Issues panel.",resourceTypeWithThrottling:"{PH1} (throttled to {PH2})",requestFailed:"{PH1} request failed",prefetchFailed:"{PH1} prefetch request failed"},B=P.i18n.registerUIStrings("panels/utils/utils.ts",f),p=P.i18n.getLocalizedString.bind(void 0,B),F=class R{static isFailedNetworkRequest(e){if(!e)return!1;if(e.failed&&!e.statusCode||e.statusCode>=400)return!0;let t=e.signedExchangeInfo();return!!(t!==null&&t.errors||e.corsErrorStatus())}static getIconForNetworkRequest(e){let t=e.resourceType();if(R.isFailedNetworkRequest(e)){let r,a;return e.resourceType()===n.ResourceType.resourceTypes.Prefetch?(a=p(f.prefetchFailed,{PH1:t.title()}),r="warning-filled"):(a=p(f.requestFailed,{PH1:t.title()}),r="cross-circle-filled"),u`<devtools-icon
          class="icon"
          name=${r}
          title=${a}
          role=img
        ></devtools-icon>`}if(e.hasThirdPartyCookiePhaseoutIssue())return u`<devtools-icon
        class="icon"
        name="warning-filled"
        role=img
        title=${p(f.thirdPartyPhaseout)}
      ></devtools-icon>`;let c=e.hasOverriddenHeaders(),o=e.hasOverriddenContent;if(c||o){let r;return c&&o?r=p(f.requestContentHeadersOverridden):o?r=p(f.requestContentOverridden):r=p(f.requestHeadersOverridden),u`<div class="network-override-marker">
          <devtools-icon class="icon" name="document" role=img title=${r}></devtools-icon>
        </div>`}let i=n.ResourceType.ResourceType.fromMimeType(e.mimeType);if(i!==t&&i!==n.ResourceType.resourceTypes.Other&&(t===n.ResourceType.resourceTypes.Fetch||i===n.ResourceType.resourceTypes.Image||t===n.ResourceType.resourceTypes.Other&&i===n.ResourceType.resourceTypes.Script)&&(t=i),t===n.ResourceType.resourceTypes.Image)return u`<div class="image icon">
        <img
          class="image-network-icon-preview"
          title=${m(e)}
          alt=${m(e)}
          ${j(r=>{r&&e.populateImageSource(r)})}
        />
      </div>`;if(t!==n.ResourceType.resourceTypes.Manifest&&n.ResourceType.ResourceType.simplifyContentType(e.mimeType)==="application/json")return u`<devtools-icon
          class="icon" name="file-json" title=${m(e)} role=img
          style="color:var(--icon-file-script)">
        </devtools-icon>`;let{iconName:s,color:l}=R.iconDataForResourceType(t);return u`<devtools-icon
        class="icon" name=${s} title=${m(e)}
        style=${U({color:l})}>
      </devtools-icon>`;function m(r){let a=O.NetworkManager.MultitargetNetworkManager.instance().appliedRequestConditions(r);if(!a?.urlPattern)return r.resourceType().title();let d=typeof a?.conditions.title=="string"?a?.conditions.title:a?.conditions.title();return p(f.resourceTypeWithThrottling,{PH1:r.resourceType().title(),PH2:d})}}static iconDataForResourceType(e){return e.isDocument()?{iconName:"file-document"}:e.isImage()?{iconName:"file-image",color:"var(--icon-file-image)"}:e.isFont()?{iconName:"file-font"}:e.isScript()?{iconName:"file-script"}:e.isStyleSheet()?{iconName:"file-stylesheet"}:e.name()===n.ResourceType.resourceTypes.Manifest.name()?{iconName:"file-manifest"}:e.name()===n.ResourceType.resourceTypes.Wasm.name()?{iconName:"file-wasm"}:e.name()===n.ResourceType.resourceTypes.WebSocket.name()||e.name()===n.ResourceType.resourceTypes.DirectSocket.name()?{iconName:"file-websocket"}:e.name()===n.ResourceType.resourceTypes.Media.name()?{iconName:"file-media"}:e.name()===n.ResourceType.resourceTypes.Fetch.name()||e.name()===n.ResourceType.resourceTypes.XHR.name()?{iconName:"file-fetch-xhr"}:{iconName:"file-generic"}}static getIconForSourceFile(e){let t=v.Persistence.PersistenceImpl.instance().binding(e),c=v.NetworkPersistenceManager.NetworkPersistenceManager.instance(),o="document",i=!1,s=!1;t?(D.ScriptSnippetFileSystem.isSnippetsUISourceCode(t.fileSystem)&&(o="snippet"),i=!0,s=c.project()===t.fileSystem.project()):c.isActiveHeaderOverrides(e)?(i=!0,s=!0):D.ScriptSnippetFileSystem.isSnippetsUISourceCode(e)&&(o="snippet");let l=t?H.PersistenceUtils.PersistenceUtils.tooltipForUISourceCode(e):void 0;return u`<devtools-file-source-icon
        class="icon"
        name=${o} 
        title=${W(l)} 
        .data=${{contentType:e.contentType().name(),hasDotBadge:i,isDotPurple:s,iconType:o}}></devtools-file-source-icon>`}static async formatCSSChangesFromDiff(e){let t="  ",{originalLines:c,currentLines:o,rows:i}=h.DiffView.buildDiffRows(e),s=await b(c.join(`
`)),l=await b(o.join(`
`)),m="",r,a,d=!1;for(let{currentLineNumber:$,originalLineNumber:L,type:S}of i){if(S!==h.DiffView.RowType.DELETION&&S!==h.DiffView.RowType.ADDITION)continue;let y=S===h.DiffView.RowType.DELETION,V=y?c:o,g=y?L-1:$-1,I=V[g].trim(),{declarationIDToStyleRule:N,styleRuleIDToStyleRule:k}=y?s:l,T,C="";if(N.has(g)){T=N.get(g);let w=T.selector;w!==r&&w!==a&&(C+=`${w} {
`),C+=t,d=!0}else d&&(C=`}

`,d=!1),k.has(g)&&(T=k.get(g));let E=y?`/* ${I} */`:I;m+=C+E+`
`,y?r=T?.selector:a=T?.selector}return m.length>0&&(m+="}"),m}static highlightElement(e){e.scrollIntoViewIfNeeded(),e.animate([{offset:0,backgroundColor:"rgba(255, 255, 0, 0.2)"},{offset:.1,backgroundColor:"rgba(255, 255, 0, 0.7)"},{offset:1,backgroundColor:"transparent"}],{duration:2e3,easing:"cubic-bezier(0, 0, 0.2, 1)"})}};async function b(R){let e=await new Promise(o=>{let i=[];M.FormatterWorkerPool.formatterWorkerPool().parseCSS(R,(s,l)=>{i.push(...l),s&&o(i)})}),t=new Map,c=new Map;for(let o of e)if("styleRange"in o){let i=o.selectorText.split(`
`).pop()?.trim();if(!i)continue;let s={rule:o,selector:i};c.set(o.styleRange.startLine,s);for(let l of o.properties)t.set(l.range.startLine,s)}return{declarationIDToStyleRule:t,styleRuleIDToStyleRule:c}}export{F as PanelUtils};
//# sourceMappingURL=utils.js.map
