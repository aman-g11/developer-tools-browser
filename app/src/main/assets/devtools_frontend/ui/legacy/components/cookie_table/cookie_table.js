var w=Object.defineProperty;var P=(D,e)=>{for(var o in e)w(D,o,{get:e[o],enumerable:!0})};var y={};P(y,{CookiesTable:()=>p});import"./../data_grid/data_grid.js";import*as C from"./../../../../core/common/common.js";import*as c from"./../../../../core/i18n/i18n.js";import*as I from"./../../../../core/root/root.js";import*as t from"./../../../../core/sdk/sdk.js";import*as A from"./../../../../models/issues_manager/issues_manager.js";import*as E from"./../../../../panels/network/forward/forward.js";import{Icon as T}from"./../../../kit/kit.js";import{Directives as U,html as b,render as v}from"./../../../lit/lit.js";import*as R from"./../../legacy.js";var f=`devtools-data-grid{flex:auto}.cookies-table devtools-icon{margin-right:4px}
/*# sourceURL=${import.meta.resolve("./cookiesTable.css")} */`;var{repeat:x,ifDefined:K}=U,n={session:"Session",name:"Name",value:"Value",size:"Size",domain:"Domain",path:"Path",secure:"Secure",partitionKeySite:"Partition Key Site",priority:"Priority",editableCookies:"Editable Cookies",cookies:"Cookies",na:"N/A",showRequestsWithThisCookie:"Show requests with this cookie",showIssueAssociatedWithThis:"Show issue associated with this cookie",sourcePortTooltip:"Shows the source port (range 1-65535) the cookie was set on. If the port is unknown, this shows -1.",sourceSchemeTooltip:"Shows the source scheme (`Secure`, `NonSecure`) the cookie was set on. If the scheme is unknown, this shows `Unset`.",timeAfter:"after {date}",timeAfterTooltip:"The expiration timestamp is {seconds}, which corresponds to a date after {date}",opaquePartitionKey:"(opaque)"},$=c.i18n.registerUIStrings("ui/legacy/components/cookie_table/CookiesTable.ts",n),l=c.i18n.getLocalizedString.bind(void 0,$),O=c.i18n.getLazilyComputedLocalizedString.bind(void 0,$),k=O(n.session),p=class extends R.Widget.VBox{#e;#t;#o;#i;lastEditedColumnId;data=[];cookies=[];#s;cookieToBlockedReasons;cookieToExemptionReason;view;selectedKey;#r;renderInline;schemeBindingEnabled;portBindingEnabled;constructor(e,o,a,i,S,h,d){super(e),d||(d=(r,_,g)=>{v(b`
          <devtools-data-grid
               name=${r.editable?l(n.editableCookies):l(n.cookies)}
               id="cookies-table"
               striped
               ?inline=${r.renderInline}
               @create=${s=>r.onCreate(s.detail)}
               @refresh=${r.onRefresh}
               @deselect=${()=>r.onSelect(void 0)}
          >
            <table>
               <tr>
                 <th id=${t.Cookie.Attribute.NAME} sortable ?disclosure=${r.editable} ?editable=${r.editable} long weight="24">
                   ${l(n.name)}
                 </th>
                 <th id=${t.Cookie.Attribute.VALUE} sortable ?editable=${r.editable} long weight="34">
                   ${l(n.value)}
                 </th>
                 <th id=${t.Cookie.Attribute.DOMAIN} sortable weight="7" ?editable=${r.editable}>
                   ${l(n.domain)}
                 </th>
                 <th id=${t.Cookie.Attribute.PATH} sortable weight="7" ?editable=${r.editable}>
                   ${l(n.path)}
                 </th>
                 <th id=${t.Cookie.Attribute.EXPIRES} sortable weight="7" ?editable=${r.editable}>
                   Expires / Max-Age
                 </th>
                 <th id=${t.Cookie.Attribute.SIZE} sortable align="right" weight="7">
                   ${l(n.size)}
                 </th>
                 <th id=${t.Cookie.Attribute.HTTP_ONLY} sortable align="center" weight="7" ?editable=${r.editable} type="boolean">
                   HttpOnly
                 </th>
                 <th id=${t.Cookie.Attribute.SECURE} sortable align="center" weight="7" ?editable=${r.editable} type="boolean">
                   ${l(n.secure)}
                 </th>
                 <th id=${t.Cookie.Attribute.SAME_SITE} sortable weight="7" ?editable=${r.editable}>
                   SameSite
                 </th>
                 <th id=${t.Cookie.Attribute.PARTITION_KEY_SITE} sortable weight="7" ?editable=${r.editable}>
                   ${l(n.partitionKeySite)}
                 </th>
                 <th id=${t.Cookie.Attribute.HAS_CROSS_SITE_ANCESTOR} sortable align="center" weight="7" ?editable=${r.editable} type="boolean">
                   Cross Site
                 </th>
                 <th id=${t.Cookie.Attribute.PRIORITY} sortable weight="7" ?editable=${r.editable}>
                   ${l(n.priority)}
                 </th>
                 ${r.schemeBindingEnabled?b`
                 <th id=${t.Cookie.Attribute.SOURCE_SCHEME} sortable align="center" weight="7" ?editable=${r.editable} type="string">
                   SourceScheme
                 </th>`:""}
                 ${r.portBindingEnabled?b`
                <th id=${t.Cookie.Attribute.SOURCE_PORT} sortable align="center" weight="7" ?editable=${r.editable} type="number">
                   SourcePort
                </th>`:""}
              </tr>
              ${x(this.data,s=>s.key,s=>b`
                <tr ?selected=${s.key===r.selectedKey}
                    ?inactive=${s.inactive}
                    ?dirty=${s.dirty}
                    ?highlighted=${s.flagged}
                    @edit=${m=>r.onEdit(s,m.detail.columnId,m.detail.valueBeforeEditing,m.detail.newText)}
                    @delete=${()=>r.onDelete(s)}
                    @contextmenu=${m=>r.onContextMenu(s,m.detail)}
                    @select=${()=>r.onSelect(s.key)}>
                  <td>${s.icons?.name}${s.name}</td>
                  <td>${s.value}</td>
                  <td>${s.icons?.domain}${s.domain}</td>
                  <td>${s.icons?.path}${s.path}</td>
                  <td title=${K(s.expiresTooltip)}>${s.expires}</td>
                  <td>${s.size}</td>
                  <td data-value=${!!s["http-only"]}></td>
                  <td data-value=${!!s.secure}>${s.icons?.secure}</td>
                  <td>${s.icons?.["same-site"]}${s["same-site"]}</td>
                  <td>${s["partition-key-site"]}</td>
                  <td data-value=${!!s["has-cross-site-ancestor"]}></td>
                  <td data-value=${K(s.priorityValue)}>${s.priority}</td>
                  ${r.schemeBindingEnabled?b`
                    <td title=${l(n.sourceSchemeTooltip)}>${s["source-scheme"]}</td>`:""}
                  ${r.portBindingEnabled?b`
                    <td title=${l(n.sourcePortTooltip)}>${s["source-port"]}</td>`:""}
                </tr>`)}
                ${r.editable?b`<tr placeholder><tr>`:""}
              </table>
            </devtools-data-grid>`,g,{host:g})}),this.registerRequiredCSS(f),this.element.classList.add("cookies-table"),this.#e=a,this.#t=i,this.#i=h,this.#r=!!a;let{devToolsEnableOriginBoundCookies:u}=I.Runtime.hostConfig;this.schemeBindingEnabled=!!u?.schemeBindingEnabled,this.portBindingEnabled=!!u?.portBindingEnabled,this.view=d,this.renderInline=!!o,this.#o=S,this.lastEditedColumnId=null,this.data=[],this.#s="",this.cookieToBlockedReasons=null,this.cookieToExemptionReason=null,this.requestUpdate()}set cookiesData(e){this.setCookies(e.cookies,e.cookieToBlockedReasons,e.cookieToExemptionReason)}set saveCallback(e){this.#e=e}set refreshCallback(e){this.#t=e}set selectedCallback(e){this.#o=e}set deleteCallback(e){this.#i=e}set editable(e){this.#r=e}set inline(e){this.renderInline=e,this.requestUpdate()}setCookies(e,o,a){this.cookieToBlockedReasons=o||null,this.cookieToExemptionReason=a||null,this.cookies=e;let i=this.data.find(h=>h.key===this.selectedKey),S=this.cookies.find(h=>h.key()===this.selectedKey);this.data=e.sort((h,d)=>h.name().localeCompare(d.name())).map(this.createCookieData.bind(this)),i&&this.lastEditedColumnId&&!S&&(i.inactive=!0,this.data.push(i)),this.requestUpdate()}set cookieDomain(e){this.#s=e}selectedCookie(){return this.cookies.find(e=>e.key()===this.selectedKey)||null}willHide(){super.willHide(),this.lastEditedColumnId=null}performUpdate(){let e={data:this.data,selectedKey:this.selectedKey,editable:this.#r,renderInline:this.renderInline,schemeBindingEnabled:this.schemeBindingEnabled,portBindingEnabled:this.portBindingEnabled,onEdit:this.onUpdateCookie.bind(this),onCreate:this.onCreateCookie.bind(this),onRefresh:this.refresh.bind(this),onDelete:this.onDeleteCookie.bind(this),onSelect:this.onSelect.bind(this),onContextMenu:this.populateContextMenu.bind(this)},o={};this.view(e,o,this.element)}onSelect(e){this.selectedKey=e,this.#o?.(this.selectedCookie())}onDeleteCookie(e){let o=this.cookies.find(a=>a.key()===e.key);o&&this.#i&&this.#i(o,()=>this.refresh())}onUpdateCookie(e,o,a,i){let S=this.cookies.find(d=>d.key()===e.key);if(!S)return;let h={...e,[o]:i};if(!this.isValidCookieData(h)){h.dirty=!0,this.requestUpdate();return}this.lastEditedColumnId=o,this.saveCookie(h,S)}onCreateCookie(e){this.setDefaults(e),this.isValidCookieData(e)?this.saveCookie(e):(e.dirty=!0,this.requestUpdate())}setDefaults(e){e[t.Cookie.Attribute.NAME]===void 0&&(e[t.Cookie.Attribute.NAME]=""),e[t.Cookie.Attribute.VALUE]===void 0&&(e[t.Cookie.Attribute.VALUE]=""),e[t.Cookie.Attribute.DOMAIN]===void 0&&(e[t.Cookie.Attribute.DOMAIN]=this.#s),e[t.Cookie.Attribute.PATH]===void 0&&(e[t.Cookie.Attribute.PATH]="/"),e[t.Cookie.Attribute.EXPIRES]===void 0&&(e[t.Cookie.Attribute.EXPIRES]=k()),e[t.Cookie.Attribute.PARTITION_KEY]===void 0&&(e[t.Cookie.Attribute.PARTITION_KEY]="")}saveCookie(e,o){if(!this.#e)return;let a=this.createCookieFromData(e);this.#e(a,o??null).then(i=>{i||(e.dirty=!0),this.refresh()})}createCookieFromData(e){let o=new t.Cookie.Cookie(e[t.Cookie.Attribute.NAME]||"",e[t.Cookie.Attribute.VALUE]||"",null,e[t.Cookie.Attribute.PRIORITY]);for(let a of[t.Cookie.Attribute.DOMAIN,t.Cookie.Attribute.PATH,t.Cookie.Attribute.HTTP_ONLY,t.Cookie.Attribute.SECURE,t.Cookie.Attribute.SAME_SITE,t.Cookie.Attribute.SOURCE_SCHEME])a in e&&o.addAttribute(a,e[a]);return e.expires&&e.expires!==k()&&o.addAttribute(t.Cookie.Attribute.EXPIRES,new Date(e[t.Cookie.Attribute.EXPIRES]).toUTCString()),t.Cookie.Attribute.SOURCE_PORT in e&&o.addAttribute(t.Cookie.Attribute.SOURCE_PORT,Number.parseInt(e[t.Cookie.Attribute.SOURCE_PORT]||"",10)||void 0),e[t.Cookie.Attribute.PARTITION_KEY_SITE]&&o.setPartitionKey(e[t.Cookie.Attribute.PARTITION_KEY_SITE],!!(e[t.Cookie.Attribute.HAS_CROSS_SITE_ANCESTOR]&&e[t.Cookie.Attribute.HAS_CROSS_SITE_ANCESTOR])),o.setSize(e[t.Cookie.Attribute.NAME].length+e[t.Cookie.Attribute.VALUE].length),o}createCookieData(e){let a=e.type()===t.Cookie.Type.REQUEST,i={name:e.name(),value:e.value()};for(let d of[t.Cookie.Attribute.HTTP_ONLY,t.Cookie.Attribute.SECURE,t.Cookie.Attribute.SAME_SITE,t.Cookie.Attribute.SOURCE_SCHEME,t.Cookie.Attribute.SOURCE_PORT])e.hasAttribute(d)&&(i[d]=String(e.getAttribute(d)??!0));i[t.Cookie.Attribute.DOMAIN]=e.domain()||(a?l(n.na):""),i[t.Cookie.Attribute.PATH]=e.path()||(a?l(n.na):""),i[t.Cookie.Attribute.EXPIRES]=e.maxAge()?c.TimeUtilities.secondsToString(Math.floor(e.maxAge())):e.expires()<0?k():e.expires()>864e13?l(n.timeAfter,{date:new Date(864e13).toISOString()}):e.expires()>0?new Date(e.expires()).toISOString():a?l(n.na):k(),e.expires()>864e13&&(i.expiresTooltip=l(n.timeAfterTooltip,{seconds:e.expires(),date:new Date(864e13).toISOString()})),i[t.Cookie.Attribute.PARTITION_KEY_SITE]=e.partitionKeyOpaque()?l(n.opaquePartitionKey).toString():e.topLevelSite(),i[t.Cookie.Attribute.HAS_CROSS_SITE_ANCESTOR]=e.hasCrossSiteAncestor()?"true":"",i[t.Cookie.Attribute.SIZE]=String(e.size()),i[t.Cookie.Attribute.PRIORITY]=e.priority(),i.priorityValue=["Low","Medium","High"].indexOf(e.priority());let S=this.cookieToBlockedReasons?.get(e)||[];for(let d of S){i.flagged=!0;let u=d.attribute||t.Cookie.Attribute.NAME;i.icons=i.icons||{},u in i.icons?i.icons[u]&&(i.icons[u].title+=`
`+d.uiString):(i.icons[u]=new T,u===t.Cookie.Attribute.NAME&&A.RelatedIssue.hasThirdPartyPhaseoutCookieIssue(e)?(i.icons[u].name="warning-filled",i.icons[u].onclick=()=>A.RelatedIssue.reveal(e),i.icons[u].style.cursor="pointer"):i.icons[u].name="info",i.icons[u].classList.add("small"),i.icons[u].title=d.uiString)}let h=this.cookieToExemptionReason?.get(e)?.uiString;return h&&(i.icons=i.icons||{},i.flagged=!0,i.icons.name=new T,i.icons.name.name="info",i.icons.name.classList.add("small"),i.icons.name.title=h),i.key=e.key(),i}isValidCookieData(e){return(!!e.name||!!e.value)&&this.isValidDomain(e.domain)&&this.isValidPath(e.path)&&this.isValidDate(e.expires)&&this.isValidPartitionKey(e[t.Cookie.Attribute.PARTITION_KEY_SITE])}isValidDomain(e){if(!e)return!0;let o=C.ParsedURL.ParsedURL.fromString("http://"+e);return o!==null&&o.domain()===e}isValidPath(e){if(!e)return!0;let o=C.ParsedURL.ParsedURL.fromString("http://example.com"+e);return o!==null&&o.path===e}isValidDate(e){return!e||e===k()||!isNaN(Date.parse(e))}isValidPartitionKey(e){return e?C.ParsedURL.ParsedURL.fromString(e)!==null:!0}refresh(){this.#t&&this.#t()}populateContextMenu(e,o){let a=this.cookies.find(S=>S.key()===e.key);if(!a)return;let i=a;o.revealSection().appendItem(l(n.showRequestsWithThisCookie),()=>{let S=E.UIFilter.UIRequestFilter.filters([{filterType:E.UIFilter.FilterType.CookieDomain,filterValue:i.domain()},{filterType:E.UIFilter.FilterType.CookieName,filterValue:i.name()}]);C.Revealer.reveal(S)},{jslogContext:"show-requests-with-this-cookie"}),A.RelatedIssue.hasIssues(i)&&o.revealSection().appendItem(l(n.showIssueAssociatedWithThis),()=>{A.RelatedIssue.reveal(i)},{jslogContext:"show-issue-associated-with-this"})}};export{y as CookiesTable};
//# sourceMappingURL=cookie_table.js.map
