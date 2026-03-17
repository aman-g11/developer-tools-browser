var Tt=Object.defineProperty;var F=(i,e)=>{for(var t in e)Tt(i,t,{get:e[t],enumerable:!0})};var Ue={};F(Ue,{CSSOverviewUnusedDeclarations:()=>V});import*as we from"./../../core/i18n/i18n.js";var U={topAppliedToAStatically:"`Top` applied to a statically positioned element",leftAppliedToAStatically:"`Left` applied to a statically positioned element",rightAppliedToAStatically:"`Right` applied to a statically positioned element",bottomAppliedToAStatically:"`Bottom` applied to a statically positioned element",widthAppliedToAnInlineElement:"`Width` applied to an inline element",heightAppliedToAnInlineElement:"`Height` applied to an inline element",verticalAlignmentAppliedTo:"Vertical alignment applied to element which is neither `inline` nor `table-cell`"},Mt=we.i18n.registerUIStrings("panels/css_overview/CSSOverviewUnusedDeclarations.ts",U),D=we.i18n.getLocalizedString.bind(void 0,Mt),V=class{static add(e,t,o){let r=e.get(t)||[];r.push(o),e.set(t,r)}static checkForUnusedPositionValues(e,t,o,r,s,n,a,c){if(o[r]==="static"){if(o[s]!=="auto"){let p=D(U.topAppliedToAStatically);this.add(e,p,{declaration:`top: ${o[s]}`,nodeId:t})}if(o[n]!=="auto"){let p=D(U.leftAppliedToAStatically);this.add(e,p,{declaration:`left: ${o[n]}`,nodeId:t})}if(o[a]!=="auto"){let p=D(U.rightAppliedToAStatically);this.add(e,p,{declaration:`right: ${o[a]}`,nodeId:t})}if(o[c]!=="auto"){let p=D(U.bottomAppliedToAStatically);this.add(e,p,{declaration:`bottom: ${o[c]}`,nodeId:t})}}}static checkForUnusedWidthAndHeightValues(e,t,o,r,s,n){if(o[r]==="inline"){if(o[s]!=="auto"){let a=D(U.widthAppliedToAnInlineElement);this.add(e,a,{declaration:`width: ${o[s]}`,nodeId:t})}if(o[n]!=="auto"){let a=D(U.heightAppliedToAnInlineElement);this.add(e,a,{declaration:`height: ${o[n]}`,nodeId:t})}}}static checkForInvalidVerticalAlignment(e,t,o,r,s){if(!(!o[r]||o[r].startsWith("inline")||o[r].startsWith("table"))&&o[s]!=="baseline"){let n=D(U.verticalAlignmentAppliedTo);this.add(e,n,{declaration:`vertical-align: ${o[s]}`,nodeId:t})}}};var Le={};F(Le,{CSSOverviewModel:()=>H});import*as N from"./../../core/common/common.js";import*as re from"./../../core/root/root.js";import*as j from"./../../core/sdk/sdk.js";import*as Ee from"./../../ui/legacy/components/color_picker/color_picker.js";var H=class extends j.SDKModel.SDKModel{#o;#t;#s;constructor(e){super(e),this.#o=e.runtimeAgent(),this.#t=e.cssAgent(),this.#s=e.domsnapshotAgent()}async getNodeStyleStats(){let e=new Map,t=new Map,o=new Map,r=new Map,s=new Map,n=new Map,a=new Map,c={computedStyles:["background-color","color","fill","border-top-width","border-top-color","border-bottom-width","border-bottom-color","border-left-width","border-left-color","border-right-width","border-right-color","font-family","font-size","font-weight","line-height","position","top","right","bottom","left","display","width","height","vertical-align"],includeTextColorOpacities:!0,includeBlendedBackgroundColors:!0},p=h=>h instanceof N.Color.Legacy?h.hasAlpha()?h.asString(N.Color.Format.HEXA):h.asString(N.Color.Format.HEX):h.asString(),f=(h,g,S)=>{if(h===-1)return;let ee=m[h];if(!ee)return;let L=N.Color.parse(ee);if(!L||L.asLegacyColor().rgba()[3]===0)return;let v=p(L);if(!v)return;let R=S.get(v)||new Set;return R.add(g),S.set(v,R),L},C=h=>new Set(["altglyph","circle","ellipse","path","polygon","polyline","rect","svg","text","textpath","tref","tspan"]).has(h.toLowerCase()),K=h=>new Set(["iframe","video","embed","img"]).has(h.toLowerCase()),he=(h,g)=>new Set(["tr","td","thead","tbody"]).has(h.toLowerCase())&&g.startsWith("table"),Z=0,{documents:dt,strings:m}=await this.#s.invoke_captureSnapshot(c);for(let{nodes:h,layout:g}of dt){Z+=g.nodeIndex.length;for(let S=0;S<g.styles.length;S++){let ee=g.styles[S],L=g.nodeIndex[S];if(!h.backendNodeId||!h.nodeName)continue;let v=h.backendNodeId[L],R=h.nodeName[L],[ct,ut,pt,mt,ht,vt,ft,gt,wt,bt,St,ve,te,oe,Te,xt,Ct,yt,$t,kt,fe,It,At,Me]=ee;f(ct,v,e);let ge=f(ut,v,t);if(C(m[R])&&f(pt,v,r),m[mt]!=="0px"&&f(ht,v,s),m[vt]!=="0px"&&f(ft,v,s),m[gt]!=="0px"&&f(wt,v,s),m[bt]!=="0px"&&f(St,v,s),ve&&ve!==-1){let I=m[ve],b=n.get(I)||new Map,se="font-size",ie="font-weight",A="line-height",x=b.get(se)||new Map,T=b.get(ie)||new Map,y=b.get(A)||new Map;if(te!==-1){let w=m[te],M=x.get(w)||[];M.push(v),x.set(w,M)}if(oe!==-1){let w=m[oe],M=T.get(w)||[];M.push(v),T.set(w,M)}if(Te!==-1){let w=m[Te],M=y.get(w)||[];M.push(v),y.set(w,M)}b.set(se,x),b.set(ie,T),b.set(A,y),n.set(I,b)}let Q=ge&&g.blendedBackgroundColors&&g.blendedBackgroundColors[S]!==-1?N.Color.parse(m[g.blendedBackgroundColors[S]]):null;if(ge&&Q){let I=new Ee.ContrastInfo.ContrastInfo({backgroundColors:[Q.asString(N.Color.Format.HEXA)],computedFontSize:te!==-1?m[te]:"",computedFontWeight:oe!==-1?m[oe]:""}),b=ge.asLegacyColor().blendWithAlpha(g.textColorOpacities?g.textColorOpacities[S]:1);I.setColor(b);let se=p(b),ie=p(Q.asLegacyColor()),A=`${se}_${ie}`;if(re.Runtime.experiments.isEnabled(re.ExperimentNames.ExperimentName.APCA)){let x=I.contrastRatioAPCA(),T=I.contrastRatioAPCAThreshold();if(!(x&&T?Math.abs(x)>=T:!1)&&x){let w={nodeId:v,contrastRatio:x,textColor:b,backgroundColor:Q,thresholdsViolated:{aa:!1,aaa:!1,apca:!0}};o.has(A)?o.get(A).push(w):o.set(A,[w])}}else{let x=I.contrastRatioThreshold("aa")||0,T=I.contrastRatioThreshold("aaa")||0,y=I.contrastRatio()||0;if(x>y||T>y){let w={nodeId:v,contrastRatio:y,textColor:b,backgroundColor:Q,thresholdsViolated:{aa:x>y,aaa:T>y,apca:!1}};o.has(A)?o.get(A).push(w):o.set(A,[w])}}}V.checkForUnusedPositionValues(a,v,m,xt,Ct,kt,yt,$t),!C(m[R])&&!K(m[R])&&V.checkForUnusedWidthAndHeightValues(a,v,m,fe,It,At),Me!==-1&&!he(m[R],m[fe])&&V.checkForInvalidVerticalAlignment(a,v,m,fe,Me)}}return{backgroundColors:e,textColors:t,textColorContrastIssues:o,fillColors:r,borderColors:s,fontInfo:n,unusedDeclarations:a,elementCount:Z}}getComputedStyleForNode(e){return this.#t.invoke_getComputedStyleForNode({nodeId:e})}async getMediaQueries(){let e=await this.#t.invoke_getMediaQueries(),t=new Map;if(!e)return t;for(let o of e.medias){if(o.source==="linkedSheet")continue;let r=t.get(o.text)||[];r.push(o),t.set(o.text,r)}return t}async getGlobalStylesheetStats(){let e=`(function() {
      let styleRules = 0;
      let inlineStyles = 0;
      let externalSheets = 0;
      const stats = {
        // Simple.
        type: new Set(),
        class: new Set(),
        id: new Set(),
        universal: new Set(),
        attribute: new Set(),

        // Non-simple.
        nonSimple: new Set()
      };

      for (const styleSheet of document.styleSheets) {
        if (styleSheet.href) {
          externalSheets++;
        } else {
          inlineStyles++;
        }

        // Attempting to grab rules can trigger a DOMException.
        // Try it and if it fails skip to the next stylesheet.
        let rules;
        try {
          rules = styleSheet.rules;
        } catch (err) {
          continue;
        }

        for (const rule of rules) {
          if ('selectorText' in rule) {
            styleRules++;

            // Each group that was used.
            for (const selectorGroup of rule.selectorText.split(',')) {
              // Each selector in the group.
              for (const selector of selectorGroup.split(/[\\t\\n\\f\\r ]+/g)) {
                if (selector.startsWith('.')) {
                  // Class.
                  stats.class.add(selector);
                } else if (selector.startsWith('#')) {
                  // Id.
                  stats.id.add(selector);
                } else if (selector.startsWith('*')) {
                  // Universal.
                  stats.universal.add(selector);
                } else if (selector.startsWith('[')) {
                  // Attribute.
                  stats.attribute.add(selector);
                } else {
                  // Type or non-simple selector.
                  const specialChars = /[#.:\\[\\]|\\+>~]/;
                  if (specialChars.test(selector)) {
                    stats.nonSimple.add(selector);
                  } else {
                    stats.type.add(selector);
                  }
                }
              }
            }
          }
        }
      }

      return {
        styleRules,
        inlineStyles,
        externalSheets,
        stats: {
          // Simple.
          type: stats.type.size,
          class: stats.class.size,
          id: stats.id.size,
          universal: stats.universal.size,
          attribute: stats.attribute.size,

          // Non-simple.
          nonSimple: stats.nonSimple.size
        }
      }
    })()`,{result:t}=await this.#o.invoke_evaluate({expression:e,returnByValue:!0});if(t.type==="object")return t.value}};j.SDKModel.SDKModel.register(H,{capabilities:j.Target.Capability.DOM,autostart:!1});var Oe={};F(Oe,{CSSOverviewProcessingView:()=>G,DEFAULT_VIEW:()=>Pe});import*as be from"./../../core/i18n/i18n.js";import*as De from"./../../ui/components/buttons/buttons.js";import*as Ve from"./../../ui/legacy/legacy.js";import{html as Ut,render as Et}from"./../../ui/lit/lit.js";var Re=`.overview-processing-view{overflow:hidden;padding:16px;justify-content:center;align-items:center;height:100%}.overview-processing-view h1{font-size:16px;text-align:center;font-weight:normal;margin:0;padding:8px}.overview-processing-view h2{font-size:12px;text-align:center;font-weight:normal;margin:0;padding-top:32px}
/*# sourceURL=${import.meta.resolve("./cssOverviewProcessingView.css")} */`;var Ne={cancel:"Cancel"},Lt=be.i18n.registerUIStrings("panels/css_overview/CSSOverviewProcessingView.ts",Ne),Rt=be.i18n.getLocalizedString.bind(void 0,Lt),Pe=(i,e,t)=>{Et(Ut`
    <style>${Re}</style>
    <div style="overflow:auto">
      <div class="vbox overview-processing-view">
        <h1>Processing page</h1>
        <div>
          <devtools-button
              @click=${i.onCancel}
              .jslogContext=${"css-overview.cancel-processing"}
              .variant=${De.Button.Variant.OUTLINED}>${Rt(Ne.cancel)}</devtools-button>
        </div>
      </div>
    </div>`,t)},G=class extends Ve.Widget.Widget{#o=()=>{};#t;constructor(e,t=Pe){super(e),this.#t=t,this.requestUpdate()}set onCancel(e){this.#o=e,this.requestUpdate()}performUpdate(){this.#t({onCancel:this.#o},{},this.element)}};var ot={};F(ot,{CSSOverviewCompletedView:()=>O,DEFAULT_VIEW:()=>et,ELEMENT_DETAILS_DEFAULT_VIEW:()=>tt,ElementDetailsView:()=>le});import"./../../ui/legacy/components/data_grid/data_grid.js";import"./../../ui/kit/kit.js";import*as k from"./../../core/common/common.js";import*as Ce from"./../../core/i18n/i18n.js";import*as je from"./../../core/platform/platform.js";import*as q from"./../../core/root/root.js";import*as J from"./../../core/sdk/sdk.js";import*as Ge from"./../../models/geometry/geometry.js";import*as Xe from"./../../models/text_utils/text_utils.js";import*as Ye from"./../../ui/legacy/components/utils/utils.js";import*as P from"./../../ui/legacy/legacy.js";import{Directives as Ot,html as u,nothing as $,render as Je}from"./../../ui/lit/lit.js";import*as de from"./../../ui/visual_logging/visual_logging.js";import*as Ze from"./../common/common.js";var ne=`@scope to (devtools-widget > *){.overview-completed-view{overflow:auto;--overview-default-padding:28px;--overview-icon-padding:32px}.overview-completed-view .summary ul,
  .overview-completed-view .colors ul{display:flex;flex-wrap:wrap;list-style:none;margin:0;padding:0}.overview-completed-view .summary ul{display:grid;grid-template-columns:repeat(auto-fill,140px);gap:16px}.overview-completed-view .colors ul li{display:inline-block;margin:0 0 16px;padding:0 8px 0 0}.overview-completed-view .summary ul li{display:flex;flex-direction:column;grid-column-start:auto}.overview-completed-view li .label{font-size:12px;padding-bottom:2px}.overview-completed-view li .value{font-size:17px}.overview-completed-view ul li span{font-weight:bold}.unused-rules-grid .header-container,
  .unused-rules-grid .data-container,
  .unused-rules-grid table.data{position:relative}.unused-rules-grid .data-container{top:0;max-height:350px}.unused-rules-grid{border-left:none;border-right:none}.unused-rules-grid .monospace{display:block;height:18px}.element-grid{flex:1;border-left:none;border-right:none;overflow:auto}.block{width:65px;height:25px;border-radius:3px;margin-right:16px;&:focus-visible{outline:2px solid var(--sys-color-state-focus-ring);outline-offset:2px}}.block-title{padding-top:4px;font-size:12px;color:var(--sys-color-on-surface);letter-spacing:0;text-transform:uppercase}.block-title.color-text{text-transform:none;max-width:65px;text-overflow:ellipsis;white-space:nowrap;cursor:text;user-select:text;overflow:hidden}.results-section{flex-shrink:0;border-bottom:1px solid var(--sys-color-divider);padding:var(--overview-default-padding) 0 var(--overview-default-padding) 0}.horizontally-padded{padding-left:var(--overview-default-padding);padding-right:var(--overview-default-padding)}.results-section h1{font-size:15px;font-weight:normal;padding:0;margin:0 0 20px;padding-left:calc(var(--overview-default-padding) + var(--overview-icon-padding));position:relative;height:26px;line-height:26px}.results-section h1::before{content:"";display:block;position:absolute;left:var(--overview-default-padding);top:0;width:26px;height:26px;background-image:var(--image-file-cssoverview_icons_2x);background-size:104px 26px}.results-section.horizontally-padded h1{padding-left:var(--overview-icon-padding)}.results-section.horizontally-padded h1::before{left:0}.results-section.summary h1{padding-left:0}.results-section.summary h1::before{display:none}.results-section.colors h1::before{background-position:0 0}.results-section.font-info h1::before{background-position:-26px 0}.results-section.unused-declarations h1::before{background-position:-52px 0}.results-section.media-queries h1::before{background-position:-78px 0}.results-section.colors h2{margin-top:20px;font-size:13px;font-weight:normal}.overview-completed-view .font-info ul,
  .overview-completed-view .media-queries ul,
  .overview-completed-view .unused-declarations ul{width:100%;list-style:none;margin:0;padding:0 var(--overview-default-padding)}.overview-completed-view .font-info ul li,
  .overview-completed-view .media-queries ul li,
  .overview-completed-view .unused-declarations ul li{display:grid;grid-template-columns:2fr 3fr;gap:12px;margin-bottom:4px;align-items:center}.overview-completed-view .font-info button .details,
  .overview-completed-view .media-queries button .details,
  .overview-completed-view .unused-declarations button .details{min-width:100px;text-align:right;margin-right:8px;color:var(--sys-color-primary);pointer-events:none}.overview-completed-view .font-info button .bar-container,
  .overview-completed-view .media-queries button .bar-container,
  .overview-completed-view .unused-declarations button .bar-container{flex:1;pointer-events:none}.overview-completed-view .font-info button .bar,
  .overview-completed-view .media-queries button .bar,
  .overview-completed-view .unused-declarations button .bar{height:8px;background:var(--sys-color-primary-bright);border-radius:2px;min-width:2px}.overview-completed-view .font-info button,
  .overview-completed-view .media-queries button,
  .overview-completed-view .unused-declarations button{border:none;padding:0;padding-right:10px;margin:0;display:flex;align-items:center;border-radius:2px;cursor:pointer;height:28px;background:none;&:focus-visible{outline:2px solid var(--sys-color-state-focus-ring)}&:hover{border-radius:12px;background:var(--sys-color-state-hover-on-subtle)}&:hover .details,
    &:focus .details{color:color-mix(in srgb,var(--sys-color-primary),var(--sys-color-state-hover-on-prominent) 6%)}&:hover .bar,
    &:focus .bar{background-color:color-mix(in srgb,var(--sys-color-primary-bright),var(--sys-color-state-hover-on-prominent) 6%);color:var(--sys-color-on-primary)}}.overview-completed-view .font-info .font-metric{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.overview-completed-view .font-info ul{padding:0}.overview-completed-view .font-info ul li{grid-template-columns:1fr 4fr}.overview-completed-view .font-info h2{font-size:14px;font-weight:bold;margin:0 0 1em}.overview-completed-view .font-info h3{font-size:13px;font-weight:normal;font-style:italic;margin:0 0 0.5em}.overview-completed-view .font-info{padding-bottom:0}.overview-completed-view .font-family{padding:var(--overview-default-padding)}.overview-completed-view .font-family:nth-child(2n+1){background:var(--sys-color-cdt-base-container)}.overview-completed-view .font-family:first-of-type{padding-top:0}.contrast-warning{display:flex;align-items:center;margin-top:2px}.contrast-warning .threshold-label{font-weight:normal;width:30px}.contrast-warning devtools-icon{margin-left:2px}.contrast-preview{padding:0 5px}.contrast-container-in-grid{display:flex;align-items:center}.contrast-container-in-grid > *{margin-right:5px;min-width:initial}::part(node-id-column){align-items:center;height:20px;--show-element-display:none}::part(node-id-column):focus,
  ::part(node-id-column):hover{--show-element-display:inline-block}::part(show-element){display:var(--show-element-display);height:16px;width:16px}.results-section.colors{forced-color-adjust:none}}
/*# sourceURL=${import.meta.resolve("./cssOverviewCompletedView.css")} */`;var Ke={};F(Ke,{CSSOverviewSidebarPanel:()=>X,DEFAULT_VIEW:()=>Be});import"./../../ui/legacy/legacy.js";import*as xe from"./../../core/i18n/i18n.js";import*as We from"./../../ui/components/buttons/buttons.js";import*as _e from"./../../ui/legacy/legacy.js";import{Directives as Dt,html as Fe,render as Vt}from"./../../ui/lit/lit.js";import*as qe from"./../../ui/visual_logging/visual_logging.js";var ze=`@scope to (devtools-widget > *){.overview-sidebar-panel{display:flex;background:var(--sys-color-cdt-base-container);min-width:fit-content;flex-direction:column}.overview-sidebar-panel-item{height:30px;padding-left:30px;display:flex;align-items:center;color:var(--sys-color-on-surface);white-space:nowrap;&:hover{background:var(--sys-color-state-hover-on-subtle)}&:focus{background:var(--sys-color-state-focus-highlight)}&.selected{background:var(--sys-color-tonal-container);color:var(--sys-color-on-tonal-container)}}.overview-toolbar{border-bottom:1px solid var(--sys-color-divider);flex:0 0 auto}.overview-sidebar-panel-item:focus-visible{outline-width:unset}@media (forced-colors: active){.overview-sidebar-panel-item.selected{forced-color-adjust:none;background:Highlight;color:HighlightText}.overview-sidebar-panel-item:hover{forced-color-adjust:none;background:Highlight;color:HighlightText}}}
/*# sourceURL=${import.meta.resolve("./cssOverviewSidebarPanel.css")} */`;var{classMap:Nt}=Dt,Se={clearOverview:"Clear overview",cssOverviewPanelSidebar:"CSS overview panel sidebar"},Pt=xe.i18n.registerUIStrings("panels/css_overview/CSSOverviewSidebarPanel.ts",Se),He=xe.i18n.getLocalizedString.bind(void 0,Pt),Be=(i,e,t)=>{Vt(Fe`
      <style>${ze}</style>
      <div class="overview-sidebar-panel" @click=${s=>{if(s.target instanceof HTMLElement){let n=s.target.dataset.id;n&&i.onItemClick(n)}}} @keydown=${s=>{if(!(s.key!=="Enter"&&s.key!=="ArrowUp"&&s.key!=="ArrowDown")){if(s.target instanceof HTMLElement){let n=s.target.dataset.id;n&&i.onItemKeyDown(n,s.key)}s.consume(!0)}}}
           aria-label=${He(Se.cssOverviewPanelSidebar)} role="tree">
        <div class="overview-toolbar">
          <devtools-toolbar>
            <devtools-button title=${He(Se.clearOverview)} @click=${i.onReset}
                .iconName=${"clear"} .variant=${We.Button.Variant.TOOLBAR}
                .jslogContext=${"css-overview.clear-overview"}></devtools-button>
          </devtools-toolbar>
        </div>
        ${i.items.map(({id:s,name:n})=>{let a=s===i.selectedId;return Fe`
            <div class="overview-sidebar-panel-item ${Nt({selected:a})}"
                ?autofocus=${a}
                role="treeitem" data-id=${s} tabindex="0"
                jslog=${qe.item(`css-overview.${s}`).track({click:!0,keydown:"Enter|ArrowUp|ArrowDown"})}>
              ${n}
            </div>`})}
      </div>`,t)},X=class extends _e.Widget.VBox{#o;#t=[];#s;#i=(e,t)=>{};#r=()=>{};constructor(e,t=Be){super(e,{useShadowDom:!0,delegatesFocus:!0}),this.#o=t}performUpdate(){let e={items:this.#t,selectedId:this.#s,onReset:this.#r,onItemClick:this.#a.bind(this),onItemKeyDown:this.#n.bind(this)};this.#o(e,{},this.contentElement)}set items(e){this.#t=e,this.requestUpdate()}set selectedId(e){this.#e(e)}set onItemSelected(e){this.#i=e,this.requestUpdate()}set onReset(e){this.#r=e,this.requestUpdate()}#e(e,t=!1){return this.#s=e,this.requestUpdate(),this.#i(e,t),this.updateComplete}#a(e){this.#e(e,!1)}#n(e,t){if(t==="Enter")this.#e(e,!0);else{let o=-1;for(let a=0;a<this.#t.length;a++)if(this.#t[a].id===e){o=a;break}if(o<0)return;let s=(o+(t==="ArrowDown"?1:-1))%this.#t.length,n=this.#t[s].id;if(!n)return;this.#e(n,!1).then(()=>{this.element.blur(),this.element.focus()})}}};var{styleMap:ce,ref:Y}=Ot,{widget:Qe}=P.Widget,l={overviewSummary:"Overview summary",colors:"Colors",fontInfo:"Font info",unusedDeclarations:"Unused declarations",mediaQueries:"Media queries",elements:"Elements",externalStylesheets:"External stylesheets",inlineStyleElements:"Inline style elements",styleRules:"Style rules",typeSelectors:"Type selectors",idSelectors:"ID selectors",classSelectors:"Class selectors",universalSelectors:"Universal selectors",attributeSelectors:"Attribute selectors",nonsimpleSelectors:"Non-simple selectors",backgroundColorsS:"Background colors: {PH1}",textColorsS:"Text colors: {PH1}",fillColorsS:"Fill colors: {PH1}",borderColorsS:"Border colors: {PH1}",thereAreNoFonts:"There are no fonts.",thereAreNoUnusedDeclarations:"There are no unused declarations.",thereAreNoMediaQueries:"There are no media queries.",contrastIssues:"Contrast issues",nOccurrences:"{n, plural, =1 {# occurrence} other {# occurrences}}",contrastIssuesS:"Contrast issues: {PH1}",textColorSOverSBackgroundResults:"Text color {PH1} over {PH2} background results in low contrast for {PH3} elements",aa:"AA",aaa:"AAA",apca:"APCA",element:"Element",declaration:"Declaration",source:"Source",contrastRatio:"Contrast ratio",cssOverviewElements:"CSS overview elements",showElement:"Show element",unableToLink:"(unable to link)",unableToLinkToInlineStyle:"(unable to link to inline style)"},zt=Ce.i18n.registerUIStrings("panels/css_overview/CSSOverviewCompletedView.ts",l),d=Ce.i18n.getLocalizedString.bind(void 0,zt);function ye(i){let{h:e,s:t,l:o}=i.as(k.Color.Format.HSL);return e=Math.round(e*360),t=Math.round(t*100),o=Math.round(o*100),o=Math.max(0,o-15),`1px solid hsl(${e}deg ${t}% ${o}%)`}var Ft=new Intl.NumberFormat("en-US"),et=(i,e,t)=>{function o(r,s){r&&(r.scrollIntoView(),s&&r.querySelector('button, [tabindex="0"]')?.focus())}Je(u`
      <style>${ne}</style>
      <devtools-split-view direction="column" sidebar-position="first" sidebar-initial-size="200">
        <devtools-widget slot="sidebar" ${Qe(X,{minimumSize:new Ge.Size(100,25),items:[{name:d(l.overviewSummary),id:"summary"},{name:d(l.colors),id:"colors"},{name:d(l.fontInfo),id:"font-info"},{name:d(l.unusedDeclarations),id:"unused-declarations"},{name:d(l.mediaQueries),id:"media-queries"}],selectedId:i.selectedSection,onItemSelected:i.onSectionSelected,onReset:i.onReset})}>
        </devtools-widget>
        <devtools-split-view sidebar-position="second" slot="main" direction="row" sidebar-initial-size="minimized">
          <div class="vbox overview-completed-view" slot="main" @click=${i.onClick}>
            <!-- Dupe the styles into the main container because of the shadow root will prevent outer styles. -->
            <style>${ne}</style>
            <div class="results-section horizontally-padded summary"
                  ${Y(r=>{e.revealSection.set("summary",o.bind(null,r))})}>
              <h1>${d(l.overviewSummary)}</h1>
              ${Ht(i.elementCount,i.globalStyleStats,i.mediaQueries)}
            </div>
            <div class="results-section horizontally-padded colors"
                ${Y(r=>{e.revealSection.set("colors",o.bind(null,r))})}>
                <h1>${d(l.colors)}</h1>
                ${Wt(i.backgroundColors,i.textColors,i.textColorContrastIssues,i.fillColors,i.borderColors)}
              </div>
              <div class="results-section font-info"
                    ${Y(r=>{e.revealSection.set("font-info",o.bind(null,r))})}>
                <h1>${d(l.fontInfo)}</h1>
                ${Bt(i.fontInfo)}
              </div>
              <div class="results-section unused-declarations"
                    ${Y(r=>{e.revealSection.set("unused-declarations",o.bind(null,r))})}>
                <h1>${d(l.unusedDeclarations)}</h1>
                ${_t(i.unusedDeclarations)}
              </div>
              <div class="results-section media-queries"
                    ${Y(r=>{e.revealSection.set("media-queries",o.bind(null,r))})}>
              <h1>${d(l.mediaQueries)}</h1>
              ${qt(i.mediaQueries)}
            </div>
          </div>
          <devtools-widget slot="sidebar" ${Qe(r=>{let s=new P.TabbedPane.TabbedPane(r);return e.closeAllTabs=()=>{s.closeTabs(s.tabIds())},e.addTab=(n,a,c,p)=>{s.hasTab(n)||s.appendTab(n,a,c,void 0,void 0,!0,void 0,void 0,p),s.selectTab(n),s.parentWidget().setSidebarMinimized(!1)},s.addEventListener(P.TabbedPane.Events.TabClosed,n=>{s.tabIds().length===0&&s.parentWidget().setSidebarMinimized(!0)}),s})}>
          </devtools-widget>
        </devtools-split-view>
      </devtools-split-view>`,t)};function Ht(i,e,t){let o=(r,s)=>u`
    <li>
      <div class="label">${r}</div>
      <div class="value">${Ft.format(s)}</div>
    </li>`;return u`<ul>
    ${o(d(l.elements),i)}
    ${o(d(l.externalStylesheets),e.externalSheets)}
    ${o(d(l.inlineStyleElements),e.inlineStyles)}
    ${o(d(l.styleRules),e.styleRules)}
    ${o(d(l.mediaQueries),t.length)}
    ${o(d(l.typeSelectors),e.stats.type)}
    ${o(d(l.idSelectors),e.stats.id)}
    ${o(d(l.classSelectors),e.stats.class)}
    ${o(d(l.universalSelectors),e.stats.universal)}
    ${o(d(l.attributeSelectors),e.stats.attribute)}
    ${o(d(l.nonsimpleSelectors),e.stats.nonSimple)}
  </ul>`}function Wt(i,e,t,o,r){return u`
    <h2>${d(l.backgroundColorsS,{PH1:i.length})}</h2>
    <ul>${i.map(s=>ae("background",s))}</ul>

    <h2>${d(l.textColorsS,{PH1:e.length})}</h2>
    <ul>${e.map(s=>ae("text",s))}</ul>

    ${t.size>0?Qt(t):""}

    <h2>${d(l.fillColorsS,{PH1:o.length})}</h2>
    <ul>${o.map(s=>ae("fill",s))}</ul>

    <h2>${d(l.borderColorsS,{PH1:r.length})}</h2>
    <ul>${r.map(s=>ae("border",s))}</ul>`}function _t(i){return i.length>0?$e(i,"unused-declarations"):u`<div class="horizontally-padded">${d(l.thereAreNoUnusedDeclarations)}</div>`}function qt(i){return i.length>0?$e(i,"media-queries"):u`<div class="horizontally-padded">${d(l.thereAreNoMediaQueries)}</div>`}function Bt(i){return i.length>0?u`${i.map(({font:e,fontMetrics:t})=>u`
    <section class="font-family">
      <h2>${e}</h2>
      ${Kt(e,t)}
    </section>`)}`:u`<div>${d(l.thereAreNoFonts)}</div>`}function Kt(i,e){return u`
    <div class="font-metric">
      ${e.map(({label:t,values:o})=>u`
        <div>
          <h3>${t}</h3>
          ${$e(o,"font-info",`${i}/${t}`)}
        </div>`)}
    </div>`}function $e(i,e,t=""){let o=i.reduce((r,s)=>r+s.nodes.length,0);return u`
      <ul aria-label=${e}>
        ${i.map(({title:r,nodes:s})=>{let n=100*s.length/o,a=d(l.nOccurrences,{n:s.length});return u`<li>
            <div class="title">${r}</div>
            <button data-type=${e} data-path=${t} data-label=${r}
            jslog=${de.action().track({click:!0}).context(`css-overview.${e}`)}
            aria-label=${`${r}: ${a}`}>
              <div class="details">${a}</div>
              <div class="bar-container">
                <div class="bar" style=${ce({width:n})}></div>
              </div>
            </button>
          </li>`})}
  </ul>`}function Qt(i){return u`
    <h2>${d(l.contrastIssuesS,{PH1:i.size})}</h2>
    <ul>
      ${[...i.entries()].map(([e,t])=>jt(e,t))}
    </ul>`}function jt(i,e){console.assert(e.length>0);let t=e[0];for(let c of e)Math.abs(c.contrastRatio)<Math.abs(t.contrastRatio)&&(t=c);let o=t.textColor.asString(k.Color.Format.HEXA),r=t.backgroundColor.asString(k.Color.Format.HEXA),s=q.Runtime.experiments.isEnabled(q.ExperimentNames.ExperimentName.APCA),n=d(l.textColorSOverSBackgroundResults,{PH1:o,PH2:r,PH3:e.length}),a=ye(t.backgroundColor.asLegacyColor());return u`<li>
    <button
      title=${n} aria-label=${n}
      data-type="contrast" data-key=${i} data-section="contrast" class="block"
      style=${ce({color:o,backgroundColor:r,border:a})}
      jslog=${de.action("css-overview.contrast").track({click:!0})}>
      Text
    </button>
    <div class="block-title">
      ${s?u`
        <div class="contrast-warning hidden">
          <span class="threshold-label">${d(l.apca)}</span>
          ${t.thresholdsViolated.apca?W():_()}
        </div>`:u`
        <div class="contrast-warning hidden">
          <span class="threshold-label">${d(l.aa)}</span>
          ${t.thresholdsViolated.aa?W():_()}
        </div>
        <div class="contrast-warning hidden">
          <span class="threshold-label">${d(l.aaa)}</span>
          ${t.thresholdsViolated.aaa?W():_()}
        </div>`}
    </div>
  </li>`}function ae(i,e){let t=k.Color.parse(e)?.asLegacyColor();return t?u`<li>
    <button title=${e} data-type="color" data-color=${e}
      data-section=${i} class="block"
      style=${ce({backgroundColor:e,border:ye(t)})}
      jslog=${de.action("css-overview.color").track({click:!0})}>
    </button>
    <div class="block-title color-text">${e}</div>
  </li>`:$}var O=class i extends P.Widget.VBox{onReset=()=>{};#o="summary";#t;#s;#i;#r;#e;#a;#n={revealSection:new Map,closeAllTabs:()=>{},addTab:(e,t,o,r)=>{}};constructor(e,t=et){super(e),this.#a=t,this.registerRequiredCSS(ne),this.#i=new Ye.Linkifier.Linkifier(20,!0),this.#r=new Map,this.#e=null}set target(e){if(!e)return;let t=e.model(J.CSSModel.CSSModel),o=e.model(J.DOMModel.DOMModel);if(!t||!o)throw new Error("Target must provide CSS and DOM models");this.#t=t,this.#s=o}#c(e,t){let o=this.#n.revealSection.get(e);o&&o(t)}#u(){this.#p(),this.onReset()}#p(){this.#n.closeAllTabs(),this.#r=new Map,i.pushedNodes.clear(),this.#o="summary",this.requestUpdate()}#m(e){if(!e.target)return;let o=e.target.dataset,r=o.type;if(!r||!this.#e)return;let s;switch(r){case"contrast":{let n=o.section,a=o.key;if(!a)return;let c=this.#e.textColorContrastIssues.get(a)||[];s={type:r,key:a,nodes:c,section:n};break}case"color":{let n=o.color,a=o.section;if(!n)return;let c;switch(a){case"text":c=this.#e.textColors.get(n);break;case"background":c=this.#e.backgroundColors.get(n);break;case"fill":c=this.#e.fillColors.get(n);break;case"border":c=this.#e.borderColors.get(n);break}if(!c)return;c=Array.from(c).map(p=>({nodeId:p})),s={type:r,color:n,nodes:c,section:a};break}case"unused-declarations":{let n=o.label;if(!n)return;let a=this.#e.unusedDeclarations.get(n);if(!a)return;s={type:r,declaration:n,nodes:a};break}case"media-queries":{let n=o.label;if(!n)return;let a=this.#e.mediaQueries.get(n);if(!a)return;s={type:r,text:n,nodes:a};break}case"font-info":{let n=o.label;if(!o.path)return;let[a,c]=o.path.split("/");if(!n)return;let p=this.#e.fontInfo.get(a);if(!p)return;let f=p.get(c);if(!f)return;let C=f.get(n);if(!C)return;let K=C.map(Z=>({nodeId:Z})),he=`${n} (${a}, ${c})`;s={type:r,name:he,nodes:K};break}default:return}e.consume(),this.#d(s),this.requestUpdate()}performUpdate(){if(!this.#e||!("backgroundColors"in this.#e)||!("textColors"in this.#e))return;let e={elementCount:this.#e.elementCount,backgroundColors:this.#l(this.#e.backgroundColors),textColors:this.#l(this.#e.textColors),textColorContrastIssues:this.#e.textColorContrastIssues,fillColors:this.#l(this.#e.fillColors),borderColors:this.#l(this.#e.borderColors),globalStyleStats:this.#e.globalStyleStats,mediaQueries:this.#h(this.#e.mediaQueries),unusedDeclarations:this.#h(this.#e.unusedDeclarations),fontInfo:this.#f(this.#e.fontInfo),selectedSection:this.#o,onClick:this.#m.bind(this),onSectionSelected:this.#c.bind(this),onReset:this.#u.bind(this)};this.#a(e,this.#n,this.element)}#d(e){let t="",o="";switch(e.type){case"contrast":{let{section:s,key:n}=e;t=`${s}-${n}`,o=d(l.contrastIssues);break}case"color":{let{section:s,color:n}=e;t=`${s}-${n}`,o=`${n.toUpperCase()} (${s})`;break}case"unused-declarations":{let{declaration:s}=e;t=`${s}`,o=`${s}`;break}case"media-queries":{let{text:s}=e;t=`${s}`,o=`${s}`;break}case"font-info":{let{name:s}=e;t=`${s}`,o=`${s}`;break}}let r=this.#r.get(t);if(!r){if(!this.#s||!this.#t)throw new Error("Unable to initialize CSS overview, missing models");r=new le(this.#s,this.#t,this.#i),r.data=e.nodes,this.#r.set(t,r)}this.#n.addTab(t,o,r,e.type)}#l(e){return Array.from(e.keys()).sort((t,o)=>{let r=k.Color.parse(t)?.asLegacyColor(),s=k.Color.parse(o)?.asLegacyColor();return!r||!s?0:k.ColorUtils.luminance(s.rgba())-k.ColorUtils.luminance(r.rgba())})}#f(e){return Array.from(e.entries()).map(([o,r])=>{let s=Array.from(r.entries());return{font:o,fontMetrics:s.map(([n,a])=>({label:n,values:this.#h(a)}))}})}#h(e){return Array.from(e.entries()).sort((t,o)=>{let r=t[1];return o[1].length-r.length}).map(([t,o])=>({title:t,nodes:o}))}set overviewData(e){this.#e=e,this.requestUpdate()}static pushedNodes=new Set},tt=(i,e,t)=>{let{items:o,visibility:r}=i;Je(u`
    <div>
      <devtools-data-grid class="element-grid" striped inline
         name=${d(l.cssOverviewElements)}>
        <table>
          <tr>
            ${r.has("node-id")?u`
              <th id="node-id" weight="50" sortable>
                ${d(l.element)}
              </th>`:$}
            ${r.has("declaration")?u`
              <th id="declaration" weight="50" sortable>
                ${d(l.declaration)}
              </th>`:$}
            ${r.has("source-url")?u`
              <th id="source-url" weight="100">
                ${d(l.source)}
              </th>`:$}
            ${r.has("contrast-ratio")?u`
              <th id="contrast-ratio" weight="25" width="150px" sortable fixed>
                ${d(l.contrastRatio)}
              </th>`:$}
          </tr>
          ${o.map(({data:s,link:n,showNode:a})=>u`
            <tr>
              ${r.has("node-id")?Gt(s,n,a):$}
              ${r.has("declaration")?Xt(s):$}
              ${r.has("source-url")?Yt(s,n):$}
              ${r.has("contrast-ratio")?Jt(s):$}
            </tr>`)}
        </table>
      </devtools-data-grid>
    </div>`,t)},le=class extends P.Widget.Widget{#o;#t;#s;#i;#r;constructor(e,t,o,r=tt){super(),this.#o=e,this.#t=t,this.#s=o,this.#r=r,this.#i=[]}set data(e){this.#i=e,this.requestUpdate()}async performUpdate(){let e=new Set;if(!this.#i.length){this.#r({items:[],visibility:e},{},this.element);return}let[t]=this.#i;"nodeId"in t&&t.nodeId&&e.add("node-id"),"declaration"in t&&t.declaration&&e.add("declaration"),"sourceURL"in t&&t.sourceURL&&e.add("source-url"),"contrastRatio"in t&&t.contrastRatio&&e.add("contrast-ratio");let o;if("nodeId"in t&&e.has("node-id")){let s=this.#i.reduce((n,a)=>{let c=a.nodeId;return O.pushedNodes.has(c)?n:(O.pushedNodes.add(c),n.add(c))},new Set);o=await this.#o.pushNodesByBackendIdsToFrontend(s)}let r=await Promise.all(this.#i.map(async s=>{let n,a;if("nodeId"in s&&e.has("node-id")){let c=o?.get(s.nodeId)??null;c&&(n=Ze.DOMLinkifier.Linkifier.instance().linkify(c),a=()=>c.scrollIntoView())}if("range"in s&&s.range&&s.styleSheetId&&e.has("source-url")){let c=Xe.TextRange.TextRange.fromObject(s.range),p=this.#t.styleSheetHeaderForId(s.styleSheetId);if(p){let f=p.lineNumberInSource(c.startLine),C=p.columnNumberInSource(c.startLine,c.startColumn),K=new J.CSSModel.CSSLocation(p,f,C);n=this.#s.linkifyCSSLocation(K)}}return{data:s,link:n,showNode:a}}));this.#r({items:r,visibility:e},{},this.element)}};function Gt(i,e,t){return e?u`
    <td>
      ${e}
      <devtools-icon part="show-element" name="select-element"
          title=${d(l.showElement)} tabindex="0"
          @click=${()=>t?.()}></devtools-icon>
    </td>`:$}function Xt(i){if(!("declaration"in i))throw new Error("Declaration entry is missing a declaration.");return u`<td>${i.declaration}</td>`}function Yt(i,e){return"range"in i&&i.range?e?u`<td>${e}</td>`:u`<td>${d(l.unableToLink)}</td>`:u`<td>${d(l.unableToLinkToInlineStyle)}</td>`}function Jt(i){if(!("contrastRatio"in i))throw new Error("Contrast ratio entry is missing a contrast ratio.");let e=q.Runtime.experiments.isEnabled(q.ExperimentNames.ExperimentName.APCA),t=je.NumberUtilities.floor(i.contrastRatio,2),o=e?t+"%":t,r=ye(i.backgroundColor),s=i.textColor.asString(),n=i.backgroundColor.asString();return u`
    <td>
      <div class="contrast-container-in-grid">
          <span class="contrast-preview" style=${ce({border:r,color:s,backgroundColor:n})}>Aa</span>
          <span>${o}</span>
          ${e?u`
            <span>${d(l.apca)}</span>${i.thresholdsViolated.apca?W():_()}`:u`
            <span>${d(l.aa)}</span>${i.thresholdsViolated.aa?W():_()}
            <span>${d(l.aaa)}</span>${i.thresholdsViolated.aaa?W():_()}`}
      </div>
    </td>`}function W(){return u`
    <devtools-icon name="clear" class="small" style="color:var(--icon-error);"></devtools-icon>`}function _(){return u`
    <devtools-icon name="checkmark" class="small"
        style="color:var(--icon-checkmark-green);"></devtools-icon>`}var lt={};F(lt,{CSSOverviewPanel:()=>Ae,DEFAULT_VIEW:()=>at});import*as pe from"./../../core/host/host.js";import*as E from"./../../core/sdk/sdk.js";import*as me from"./../../ui/legacy/legacy.js";import{render as io}from"./../../ui/lit/lit.js";import"./../../ui/components/panel_feedback/panel_feedback.js";import"./../../ui/components/panel_introduction_steps/panel_introduction_steps.js";import*as ke from"./../../core/i18n/i18n.js";import*as rt from"./../../ui/components/buttons/buttons.js";import*as nt from"./../../ui/legacy/legacy.js";import{html as Zt,render as eo}from"./../../ui/lit/lit.js";var st=`@scope to (devtools-widget > *){h1{font-weight:normal}.css-overview-start-view{padding:24px;display:flex;flex-direction:column;background-color:var(--sys-color-cdt-base-container);overflow:auto}.start-capture-wrapper{width:fit-content}.preview-feature{padding:12px 16px;border:1px solid var(--sys-color-neutral-outline);color:var(--sys-color-on-surface);font-size:13px;line-height:20px;border-radius:12px;margin:42px 0;letter-spacing:0.01em}.preview-header{color:var(--sys-color-primary);font-size:13px;line-height:20px;letter-spacing:0.01em;margin:9px 0 14px}.preview-icon{vertical-align:middle}.feedback-prompt{margin-bottom:24px}.feedback-prompt .devtools-link{color:-webkit-link;cursor:pointer;text-decoration:underline}.resources{display:flex;flex-direction:row}.thumbnail-wrapper{width:144px;height:92px;margin-right:20px}.video-doc-header{font-size:13px;line-height:20px;letter-spacing:0.04em;color:var(--sys-color-on-surface);margin-bottom:2px}devtools-feedback-button{align-self:flex-end}.resources .devtools-link{font-size:14px;line-height:22px;letter-spacing:0.04em;text-decoration-line:underline;color:var(--sys-color-primary)}}
/*# sourceURL=${import.meta.resolve("./cssOverviewStartView.css")} */`;var z={captureOverview:"Capture overview",identifyCSSImprovements:"Identify potential CSS improvements",capturePageCSSOverview:"Capture an overview of your page\u2019s CSS",identifyCSSImprovementsWithExampleIssues:"Identify potential CSS improvements (e.g. low contrast issues, unused declarations, color or font mismatches)",locateAffectedElements:"Locate the affected elements in the Elements panel",quickStartWithCSSOverview:"Quick start: get started with the new CSS overview panel"},to=ke.i18n.registerUIStrings("panels/css_overview/CSSOverviewStartView.ts",z),B=ke.i18n.getLocalizedString.bind(void 0,to),it="https://g.co/devtools/css-overview-feedback",oo="https://developer.chrome.com/docs/devtools/css-overview",so=(i,e,t)=>{eo(Zt`
    <style>${st}</style>
    <div class="css-overview-start-view">
      <devtools-panel-introduction-steps>
        <span slot="title">${B(z.identifyCSSImprovements)}</span>
        <span slot="step-1">${B(z.capturePageCSSOverview)}</span>
        <span slot="step-2">${B(z.identifyCSSImprovementsWithExampleIssues)}</span>
        <span slot="step-3">${B(z.locateAffectedElements)}</span>
      </devtools-panel-introduction-steps>
      <div class="start-capture-wrapper">
        <devtools-button
          class="start-capture"
          autofocus
          .variant=${rt.Button.Variant.PRIMARY}
          .jslogContext=${"css-overview.capture-overview"}
          @click=${i.onStartCapture}>
          ${B(z.captureOverview)}
        </devtools-button>
      </div>
      <devtools-panel-feedback .data=${{feedbackUrl:it,quickStartUrl:oo,quickStartLinkText:B(z.quickStartWithCSSOverview)}}>
      </devtools-panel-feedback>
      <devtools-feedback-button .data=${{feedbackUrl:it}}>
      </devtools-feedback-button>
    </div>`,t)},ue=class extends nt.Widget.Widget{#o;onStartCapture=()=>{};constructor(e,t=so){super(e,{useShadowDom:!0,delegatesFocus:!0}),this.#o=t,this.performUpdate()}performUpdate(){this.#o({onStartCapture:this.onStartCapture},{},this.contentElement)}};var{widget:Ie}=me.Widget,at=(i,e,t)=>{io(i.state==="start"?Ie(ue,{onStartCapture:i.onStartCapture}):i.state==="processing"?Ie(G,{onCancel:i.onCancel}):Ie(O,{onReset:i.onReset,overviewData:i.overviewData,target:i.target}),t)},Ae=class extends me.Panel.Panel{#o;#t;#s;#i;#r;#e;#a;#n;#c;#u;#p;#m;#d;#l;constructor(e=at){super("css-overview"),this.#o=E.TargetManager.TargetManager.instance().inspectedURL(),E.TargetManager.TargetManager.instance().addEventListener(E.TargetManager.Events.INSPECTED_URL_CHANGED,this.#h,this),this.#l=e,E.TargetManager.TargetManager.instance().observeTargets(this),this.#v()}#f(){pe.userMetrics.actionTaken(pe.UserMetrics.Action.CaptureCssOverviewClicked),this.#x()}#h(){this.#o!==E.TargetManager.TargetManager.instance().inspectedURL()&&(this.#o=E.TargetManager.TargetManager.instance().inspectedURL(),this.#v())}targetAdded(e){e===E.TargetManager.TargetManager.instance().primaryPageTarget()&&(this.#t=e.model(H)??void 0)}targetRemoved(){}#g(){if(!this.#t)throw new Error("Did not retrieve model information yet.");return this.#t}#v(){this.#s=new Map,this.#i=new Map,this.#r=new Map,this.#e=new Map,this.#a=new Map,this.#n=new Map,this.#c=new Map,this.#u=0,this.#p={styleRules:0,inlineStyles:0,externalSheets:0,stats:{type:0,class:0,id:0,universal:0,attribute:0,nonSimple:0}},this.#m=new Map,this.#w()}#w(){this.#d="start",this.performUpdate()}#b(){this.#d="processing",this.performUpdate()}#S(){this.#d="completed",this.performUpdate()}performUpdate(){let e={state:this.#d,onStartCapture:this.#f.bind(this),onCancel:this.#v.bind(this),onReset:this.#v.bind(this),target:this.#t?.target(),overviewData:{backgroundColors:this.#s,textColors:this.#i,textColorContrastIssues:this.#m,fillColors:this.#r,borderColors:this.#e,globalStyleStats:this.#p,fontInfo:this.#a,elementCount:this.#u,mediaQueries:this.#n,unusedDeclarations:this.#c}};this.#l(e,{},this.contentElement)}async#x(){this.#b();let e=this.#g(),[t,{elementCount:o,backgroundColors:r,textColors:s,textColorContrastIssues:n,fillColors:a,borderColors:c,fontInfo:p,unusedDeclarations:f},C]=await Promise.all([e.getGlobalStylesheetStats(),e.getNodeStyleStats(),e.getMediaQueries()]);o&&(this.#u=o),t&&(this.#p=t),C&&(this.#n=C),r&&(this.#s=r),s&&(this.#i=s),n&&(this.#m=n),a&&(this.#r=a),c&&(this.#e=c),p&&(this.#a=p),f&&(this.#c=f),this.#S()}};export{ot as CSSOverviewCompletedView,Le as CSSOverviewModel,lt as CSSOverviewPanel,Oe as CSSOverviewProcessingView,Ke as CSSOverviewSidebarPanel,Ue as CSSOverviewUnusedDeclarations};
//# sourceMappingURL=css_overview.js.map
