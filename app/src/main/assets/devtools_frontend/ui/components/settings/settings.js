var C=Object.defineProperty;var g=(h,t)=>{for(var i in t)C(h,i,{get:t[i],enumerable:!0})};var y={};g(y,{SettingCheckbox:()=>d});import"./../tooltips/tooltips.js";var f={};g(f,{SettingDeprecationWarning:()=>c});import"./../../kit/kit.js";import*as v from"./../../../core/common/common.js";import*as a from"./../../lit/lit.js";var u=`.clickable{cursor:pointer}devtools-icon{vertical-align:text-bottom;padding-left:2px}
/*# sourceURL=${import.meta.resolve("./settingDeprecationWarning.css")} */`;var{html:S}=a,c=class extends HTMLElement{#e=this.attachShadow({mode:"open"});set data(t){this.#t(t)}#t({disabled:t,warning:i,experiment:e}){let o={clickable:!1,medium:!0},s;t&&e&&(o.clickable=!0,s=()=>{v.Revealer.reveal(e)}),a.render(S`
        <style>${u}</style>
        <devtools-icon class=${a.Directives.classMap(o)} name="info" title=${i} @click=${s}></devtools-icon>`,this.#e,{host:this})}};customElements.define("devtools-setting-deprecation-warning",c);import"./../../kit/kit.js";import*as x from"./../../../core/host/host.js";import*as m from"./../../../core/i18n/i18n.js";import*as r from"./../../lit/lit.js";import*as k from"./../../visual_logging/visual_logging.js";import*as l from"./../buttons/buttons.js";import*as L from"./../input/input.js";var b=`:host{padding:0;margin:0}input{height:12px;width:12px;min-height:12px;min-width:12px;margin:6px}label{display:inline-flex;align-items:center;overflow:hidden;text-overflow:ellipsis}p{margin:6px 0}.disabled-reason{box-sizing:border-box;margin-left:var(--sys-size-2);width:var(--sys-size-9);height:var(--sys-size-9)}.info-icon{cursor:pointer;position:relative;margin-left:var(--sys-size-2);top:var(--sys-size-2);width:var(--sys-size-9);height:var(--sys-size-9)}.link{color:var(--text-link);text-decoration:underline}
/*# sourceURL=${import.meta.resolve("./settingCheckbox.css")} */`;var{html:n,Directives:{ifDefined:z}}=r,p={learnMore:"Learn more"},M=m.i18n.registerUIStrings("ui/components/settings/SettingCheckbox.ts",p),$=m.i18n.getLocalizedString.bind(void 0,M),d=class extends HTMLElement{#e=this.attachShadow({mode:"open"});#t;#i;#o;set data(t){this.#i&&this.#t&&this.#t.removeChangeListener(this.#i.listener),this.#t=t.setting,this.#o=t.textOverride,this.#i=this.#t.addChangeListener(()=>{this.#s()}),this.#s()}icon(){if(!this.#t)return;if(this.#t.deprecation)return n`<devtools-setting-deprecation-warning .data=${this.#t.deprecation}></devtools-setting-deprecation-warning>`;let t=this.#t.learnMore();if(t){let i=`${this.#t.name}-documentation`,e={iconName:"info",variant:l.Button.Variant.ICON,size:l.Button.Size.SMALL,jslogContext:i},o=t.url;if(t.tooltip){let s=`${this.#t.name}-information`;return n`
          <devtools-button
            class="info-icon"
            aria-details=${s}
            aria-disabled=true
            accessibleLabel=${t.tooltip()}
            .data=${e}
          ></devtools-button>
          <devtools-tooltip id=${s} variant="rich">
            <span>${t.tooltip()}</span><br />
            ${o?n`<devtools-link
                  href=${o}
                  class="link"
                  .jslogContext=${i}
                  >${$(p.learnMore)}</devtools-link
                >`:r.nothing}
          </devtools-tooltip>
        `}if(o){let s=w=>{x.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(o),w.consume()};return e.iconName="help",e.title=$(p.learnMore),n`<devtools-button
          class="info-icon"
          @click=${s}
          .data=${e}
        ></devtools-button>`}}}get checked(){return!this.#t||this.#t.disabledReasons().length>0?!1:this.#t.get()}#s(){if(!this.#t)throw new Error('No "Setting" object provided for rendering');let t=this.icon(),i=`${this.#t.learnMore()?this.#t.learnMore()?.tooltip?.():""}`,e=this.#t.disabledReasons(),o=e.length?n`
      <devtools-button class="disabled-reason" .iconName=${"info"} .variant=${l.Button.Variant.ICON} .size=${l.Button.Size.SMALL} title=${z(e.join(`
`))} @click=${onclick}></devtools-button>
    `:r.nothing;r.render(n`
      <style>${L.checkboxStyles}</style>
      <style>${b}</style>
      <p>
        <label title=${i}>
          <input
            type="checkbox"
            .checked=${this.checked}
            ?disabled=${this.#t.disabled()}
            @change=${this.#n}
            jslog=${k.toggle().track({change:!0}).context(this.#t.name)}
            aria-label=${this.#t.title()}
          />
          ${this.#o||this.#t.title()}${o}
        </label>
        ${t}
      </p>`,this.#e,{host:this})}#n(t){this.#t?.set(t.target.checked),this.dispatchEvent(new CustomEvent("change",{bubbles:!0,composed:!1}))}};customElements.define("setting-checkbox",d);export{y as SettingCheckbox,f as SettingDeprecationWarning};
//# sourceMappingURL=settings.js.map
