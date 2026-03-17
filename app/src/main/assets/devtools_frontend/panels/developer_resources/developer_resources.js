var P=Object.defineProperty;var C=(r,t)=>{for(var s in t)P(r,s,{get:t[s],enumerable:!0})};var V={};C(V,{DEFAULT_VIEW:()=>M,DeveloperResourcesRevealer:()=>$,DeveloperResourcesView:()=>U});import"./../../ui/legacy/legacy.js";import*as I from"./../../core/i18n/i18n.js";import*as T from"./../../core/platform/platform.js";import*as x from"./../../core/sdk/sdk.js";import*as n from"./../../ui/legacy/legacy.js";import{html as z,render as B}from"./../../ui/lit/lit.js";import*as w from"./../../ui/visual_logging/visual_logging.js";import"./../../ui/legacy/components/data_grid/data_grid.js";import"./../../ui/components/highlighting/highlighting.js";import*as y from"./../../core/host/host.js";import*as u from"./../../core/i18n/i18n.js";import*as L from"./../../core/platform/platform.js";import*as m from"./../../core/sdk/sdk.js";import*as f from"./../../ui/legacy/legacy.js";import{html as h,nothing as l,render as F}from"./../../ui/lit/lit.js";var S=`@scope to (devtools-widget > *){.data-grid{border:none}::part(url-outer){width:100%;display:inline-flex;justify-content:flex-start}::part(filter-highlight){font-weight:bold}::part(url-prefix){overflow-x:hidden;text-overflow:ellipsis}::part(url-suffix){flex:none}}
/*# sourceURL=${import.meta.resolve("./developerResourcesListView.css")} */`;var i={status:"Status",url:"URL",initiator:"Initiator",totalBytes:"Total Bytes",duration:"Duration",error:"Error",developerResources:"Developer resources",copyUrl:"Copy URL",copyInitiatorUrl:"Copy initiator URL",pending:"pending",success:"success",failure:"failure",sBytes:"{n, plural, =1 {# byte} other {# bytes}}",numberOfResourceMatch:"{n, plural, =1 {# resource matches} other {# resources match}}",noResourceMatches:"No resource matches"},H=u.i18n.registerUIStrings("panels/developer_resources/DeveloperResourcesListView.ts",i),a=u.i18n.getLocalizedString.bind(void 0,H),{withThousandsSeparator:E}=L.NumberUtilities,q=(r,t,s)=>{function o(e,d){if(!e)return"";let c=r.filters.find(D=>D.key?.split(",")?.includes(d));if(!c?.regex)return"";let b=c.regex.exec(e);return b?.length?`${b.index},${b[0].length}`:""}F(h`
      <style>${S}</style>
      <devtools-data-grid name=${a(i.developerResources)} striped class="flex-auto"
         .filters=${r.filters} @contextmenu=${r.onContextMenu} @selected=${r.onSelect}>
        <table>
          <tr>
            <th id="status" sortable fixed width="60px">
              ${a(i.status)}
            </th>
            <th id="url" sortable width="250px">
              ${a(i.url)}
            </th>
            <th id="initiator" sortable width="80px">
              ${a(i.initiator)}
            </th>
            <th id="size" sortable fixed width="80px" align="right">
              ${a(i.totalBytes)}
            </th>
            <th id="duration" sortable fixed width="80px" align="right">
              ${a(i.duration)}
            </th>
            <th id="error-message" sortable width="200px">
              ${a(i.error)}
            </th>
          </tr>
          ${r.items.map((e,d)=>{let c=/^(.*)(\/[^/]*)$/.exec(e.url);return h`
            <tr selected=${e===r.selectedItem||l}
                data-url=${e.url??l}
                data-initiator-url=${e.initiator.initiatorUrl??l}
                data-index=${d}>
              <td>${e.success===!0?a(i.success):e.success===!1?a(i.failure):a(i.pending)}</td>
              <td title=${e.url} aria-label=${e.url}>
                <devtools-highlight aria-hidden="true" part="url-outer"
                                    ranges=${o(e.url,"url")}>
                  <div part="url-prefix">${c?c[1]:e.url}</div>
                  <div part="url-suffix">${c?c[2]:""}</div>
                </devtools-highlight>
              </td>
              <td title=${e.initiator.initiatorUrl||""}
                  aria-label=${e.initiator.initiatorUrl||""}
                  @mouseenter=${()=>r.onInitiatorMouseEnter(e.initiator.frameId)}
                  @mouseleave=${r.onInitiatorMouseLeave}
              >${e.initiator.initiatorUrl||""}</td>
              <td aria-label=${e.size!==null?a(i.sBytes,{n:e.size}):l}
                  data-value=${e.size??l}>${e.size!==null?h`<span>${E(e.size)}</span>`:""}</td>
              <td aria-label=${e.duration!==null?u.TimeUtilities.millisToString(e.duration):l}
                  data-value=${e.duration??l}>${e.duration!==null?h`<span>${u.TimeUtilities.millisToString(e.duration)}</span>`:""}</td>
              <td class="error-message">
                ${e.errorMessage?h`
                <devtools-highlight ranges=${o(e.errorMessage,"error-message")}>
                  ${e.errorMessage}
                </devtools-highlight>`:l}
              </td>
            </tr>`})}
          </table>
        </devtools-data-grid>`,s)},v=class extends f.Widget.VBox{#e=[];#t=null;#r=null;#o;#s=[];constructor(t,s=q){super(t,{useShadowDom:!0}),this.#o=s}set selectedItem(t){this.#t=t,this.requestUpdate()}set onSelect(t){this.#r=t}#i(t,s){let o=s.dataset.url;o&&t.clipboardSection().appendItem(a(i.copyUrl),()=>{y.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(o)},{jslogContext:"copy-url"});let e=s.dataset.initiatorUrl;e&&t.clipboardSection().appendItem(a(i.copyInitiatorUrl),()=>{y.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(e)},{jslogContext:"copy-initiator-url"})}set items(t){this.#e=[...t],this.requestUpdate()}reset(){this.items=[],this.requestUpdate()}set filters(t){this.#s=t,this.requestUpdate(),this.updateComplete.then(()=>{let s=Number(this.contentElement.querySelector("devtools-data-grid")?.getAttribute("aria-rowcount"))??0,o="";s===0?o=a(i.noResourceMatches):o=a(i.numberOfResourceMatch,{n:s}),f.ARIAUtils.LiveAnnouncer.alert(o)})}performUpdate(){let t={items:this.#e,selectedItem:this.#t,filters:this.#s,onContextMenu:o=>{o.detail?.element&&this.#i(o.detail.menu,o.detail.element)},onSelect:o=>{this.#t=o.detail?this.#e[Number(o.detail.dataset.index)]:null,this.#r?.(this.#t)},onInitiatorMouseEnter:o=>{let e=o?m.FrameManager.FrameManager.instance().getFrame(o):null;e&&e.highlight()},onInitiatorMouseLeave:()=>{m.OverlayModel.OverlayModel.hideDOMNodeHighlight()}},s={};this.#o(t,s,this.contentElement)}};var R=`@scope to (devtools-widget > *){:scope{overflow:hidden}.developer-resource-view-toolbar-container{display:flex;border-bottom:1px solid var(--sys-color-divider);flex:0 0 auto}.developer-resource-view-toolbar{width:100%}.developer-resource-view-toolbar-summary{background-color:var(--sys-color-cdt-base-container);border-top:1px solid var(--sys-color-divider);padding-left:5px;flex:0 0 19px;display:flex;padding-right:5px}.developer-resource-view-toolbar-summary .developer-resource-view-message{padding-top:2px;padding-left:1ex;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.developer-resource-view-results{overflow-y:auto;display:flex;flex:auto}}
/*# sourceURL=${import.meta.resolve("./developerResourcesView.css")} */`;var{widget:_}=n.Widget,{bindToSetting:k}=n.UIUtils,p={filterByText:"Filter by URL and error",loadHttpsDeveloperResources:"Load `HTTP(S)` developer resources through the website you inspect, not through DevTools",enableLoadingThroughTarget:"Load through website",resourcesCurrentlyLoading:"{PH1} resources, {PH2} currently loading",resources:"{n, plural, =1 {# resource} other {# resources}}"},A=I.i18n.registerUIStrings("panels/developer_resources/DeveloperResourcesView.ts",p),g=I.i18n.getLocalizedString.bind(void 0,A),$=class{async reveal(t){let o=x.PageResourceLoader.PageResourceLoader.instance().getResourcesLoaded().get(t.key);if(o)return await n.ViewManager.ViewManager.instance().showView("developer-resources"),await(await n.ViewManager.ViewManager.instance().view("developer-resources").widget()).select(o)}},M=(r,t,s)=>{B(z`
    <style>
      ${R}
    </style>
    <div class="vbox flex-auto" jslog=${w.panel("developer-resources").track({resize:!0})}>
      <div class="developer-resource-view-toolbar-container" jslog=${w.toolbar()}
          role="toolbar">
        <devtools-toolbar class="developer-resource-view-toolbar" role="presentation">
          <devtools-toolbar-input type="filter" placeholder=${g(p.filterByText)}
              @change=${r.onFilterChanged} style="flex-grow:1">
          </devtools-toolbar-input>
          <devtools-checkbox
              title=${g(p.loadHttpsDeveloperResources)}
              ${k(r.loadThroughTargetSetting)}>
            ${g(p.enableLoadingThroughTarget)}
          </devtools-checkbox>
        </devtools-toolbar>
      </div>
      <div class="developer-resource-view-results">
        ${_(v,{items:r.items,selectedItem:r.selectedItem,onSelect:r.onSelect,filters:r.filters})}
      </div>
      <div class="developer-resource-view-toolbar-summary">
        <div class="developer-resource-view-message">
          ${r.numLoading>0?g(p.resourcesCurrentlyLoading,{PH1:r.numResources,PH2:r.numLoading}):g(p.resources,{n:r.numResources})}
         </div>
      </div>
    </div>`,s)},U=class extends n.Widget.VBox{#e;#t;#r=null;#o=[];constructor(t=M){super({useShadowDom:!0}),this.#t=t,this.#e=x.PageResourceLoader.PageResourceLoader.instance(),this.#e.addEventListener(x.PageResourceLoader.Events.UPDATE,this.requestUpdate,this),this.requestUpdate()}async performUpdate(){let{loading:t,resources:s}=this.#e.getScopedNumberOfResources(),o={onFilterChanged:d=>{this.onFilterChanged(d.detail)},items:this.#e.getResourcesLoaded().values(),selectedItem:this.#r,onSelect:d=>{this.#r=d},filters:this.#o,numResources:s,numLoading:t,loadThroughTargetSetting:this.#e.getLoadThroughTargetSetting()},e={};this.#t(o,e,this.contentElement)}async select(t){await this.updateComplete,this.#r=t,this.requestUpdate()}async selectedItem(){return await this.updateComplete,this.#r}onFilterChanged(t){let s=t?T.StringUtilities.createPlainTextSearchRegex(t,"i"):null;s?this.#o=[{key:"url,error-message",regex:s,negative:!1}]:this.#o=[],this.requestUpdate()}};export{V as DeveloperResourcesView};
//# sourceMappingURL=developer_resources.js.map
