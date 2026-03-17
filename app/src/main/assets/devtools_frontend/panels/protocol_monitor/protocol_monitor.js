var Se=Object.defineProperty;var Z=(s,e)=>{for(var o in e)Se(s,o,{get:e[o],enumerable:!0})};var ie={};Z(ie,{DEFAULT_VIEW:()=>ne,Events:()=>L,JSONEditor:()=>B,ParameterType:()=>se,suggestionFilter:()=>re});import"./../../ui/kit/kit.js";import"./../../ui/components/menus/menus.js";import*as te from"./../../core/common/common.js";import*as O from"./../../core/host/host.js";import*as _ from"./../../core/i18n/i18n.js";import*as P from"./../../core/sdk/sdk.js";import*as N from"./../../ui/components/buttons/buttons.js";import*as x from"./../../ui/components/suggestion_input/suggestion_input.js";import*as q from"./../../ui/legacy/legacy.js";import*as Te from"./../../ui/lit/lit.js";import*as M from"./../../ui/visual_logging/visual_logging.js";import*as oe from"./../elements/components/components.js";var ee=`*{box-sizing:border-box;padding:0;margin:0;font-size:inherit}:host{display:flex;flex-direction:column;height:100%}.target-selector{max-width:var(--sys-size-21)}.warning-icon{margin-left:-18px;margin-right:4px}.row{flex-wrap:wrap}.row,
.row-icons{display:flex;flex-direction:row;color:var(--sys-color-token-property-special);font-family:var(--monospace-font-family);font-size:var(--monospace-font-size);align-items:center;line-height:18px;margin-top:3px}.separator{margin-right:0.5em;color:var(--sys-color-on-surface)}ul{padding-left:2em}.optional-parameter{color:var(--sys-color-token-attribute-value);--override-color-recorder-input:var(--sys-color-on-surface)}.undefined-parameter{color:var(--sys-color-state-disabled)}.wrapper{display:flex;flex-direction:column;height:100%}.editor-wrapper{padding-left:1em;overflow-x:hidden;flex-grow:1;padding-bottom:50px;padding-top:0.5em}.clear-button,
.add-button,
.delete-button{opacity:0%;transition:opacity 0.3s ease-in-out}.clear-button,
.delete-button{margin-left:5px}.row:focus-within .delete-button,
.row:focus-within .add-button,
.row:focus-within .clear-button,
.row:hover .delete-button,
.row:hover .add-button,
.row:hover .clear-button{opacity:100%}.protocol-monitor-sidebar-toolbar{border-top:1px solid var(--sys-color-divider)}
/*# sourceURL=${import.meta.resolve("./JSONEditor.css")} */`;var{html:p,render:Ie,Directives:Pe,nothing:g}=Te,{live:w,classMap:k,repeat:xe}=Pe,u={deleteParameter:"Delete parameter",addParameter:"Add a parameter",resetDefaultValue:"Reset to default value",addCustomProperty:"Add custom property",sendCommandCtrlEnter:"Send command - Ctrl+Enter",sendCommandCmdEnter:"Send command - \u2318+Enter",copyCommand:"Copy command",selectTarget:"Select a target"},Be=_.i18n.registerUIStrings("panels/protocol_monitor/JSONEditor.ts",u),h=_.i18n.getLocalizedString.bind(void 0,Be),se=(s=>(s.STRING="string",s.NUMBER="number",s.BOOLEAN="boolean",s.ARRAY="array",s.OBJECT="object",s))(se||{}),Me=s=>{if(s.length>150){let[e,o]=s.split(".");return e+"",[e,o]}return[s,""]},b=new Map([["string",""],["number",0],["boolean",!1]]),I="dummy",U="<empty_string>";function re(s,e){return s.toLowerCase().includes(e.toLowerCase())}var L=(s=>(s.SUBMIT_EDITOR="submiteditor",s))(L||{}),B=class extends te.ObjectWrapper.eventMixin(q.Widget.VBox){#t=new Map;#e=new Map;#a=new Map;#i=[];#s=[];#l="";#n;#o;#c;constructor(e,o=ne){super(e,{useShadowDom:!0}),this.#c=o,this.registerRequiredCSS(ee)}get metadataByCommand(){return this.#t}set metadataByCommand(e){this.#t=e,this.requestUpdate()}get typesByName(){return this.#e}set typesByName(e){this.#e=e,this.requestUpdate()}get enumsByName(){return this.#a}set enumsByName(e){this.#a=e,this.requestUpdate()}get parameters(){return this.#i}set parameters(e){this.#i=e,this.requestUpdate()}get targets(){return this.#s}set targets(e){this.#s=e,this.requestUpdate()}get command(){return this.#l}set command(e){this.#l!==e&&(this.#l=e,this.requestUpdate())}get targetId(){return this.#n}set targetId(e){this.#n!==e&&(this.#n=e,this.requestUpdate())}wasShown(){super.wasShown(),this.#o=new q.PopoverHelper.PopoverHelper(this.contentElement,o=>this.#S(o),"protocol-monitor.hint"),this.#o.setDisableOnClick(!0),this.#o.setTimeout(300),P.TargetManager.TargetManager.instance().addEventListener(P.TargetManager.Events.AVAILABLE_TARGETS_CHANGED,this.#r,this),this.#r(),this.requestUpdate()}willHide(){super.willHide(),this.#o?.hidePopover(),this.#o?.dispose(),P.TargetManager.TargetManager.instance().removeEventListener(P.TargetManager.Events.AVAILABLE_TARGETS_CHANGED,this.#r,this)}#r(){this.targets=P.TargetManager.TargetManager.instance().targets(),this.targets.length&&this.targetId===void 0&&(this.targetId=this.targets[0].id())}getParameters(){let e=t=>{if(t.value!==void 0)switch(t.type){case"number":return Number(t.value);case"boolean":return!!t.value;case"object":{let a={};for(let r of t.value)e(r)!==void 0&&(a[r.name]=e(r));return Object.keys(a).length===0?void 0:a}case"array":{let a=[];for(let r of t.value)a.push(e(r));return a.length===0?[]:a}default:return t.value}},o={};for(let t of this.parameters)o[t.name]=e(t);return e({type:"object",name:I,optional:!0,value:this.parameters,description:""})}displayCommand(e,o,t){this.targetId=t,this.command=e;let a=this.metadataByCommand.get(this.command);if(!a?.parameters)return;this.populateParametersForCommandWithDefaultValues();let r=this.#d("",o,{typeRef:I,type:"object",name:"",description:"",optional:!0,value:[]},a.parameters).value,n=new Map(this.parameters.map(d=>[d.name,d]));for(let d of r){let c=n.get(d.name);c&&(c.value=d.value)}this.requestUpdate()}#d(e,o,t,a){let r=t?.type||typeof o,n=t?.description??"",d=t?.optional??!0;switch(r){case"string":case"boolean":case"number":return this.#u(e,o,t);case"object":return this.#g(e,o,t,a);case"array":return this.#C(e,o,t)}return{type:r,name:e,optional:d,typeRef:t?.typeRef,value:o,description:n}}#u(e,o,t){let a=t?.type||typeof o,r=t?.description??"",n=t?.optional??!0;return{type:a,name:e,optional:n,typeRef:t?.typeRef,value:o,description:r,isCorrectType:t?this.#f(t,String(o)):!0}}#g(e,o,t,a){let r=t?.description??"";if(typeof o!="object"||o===null)throw new Error("The value is not an object");let n=t?.typeRef;if(!n)throw new Error("Every object parameters should have a type ref");let d=n===I?a:this.typesByName.get(n);if(!d)throw new Error("No nested type for keys were found");let c=[];for(let m of Object.keys(o)){let f=d.find(H=>H.name===m);c.push(this.#d(m,o[m],f))}return{type:"object",name:e,optional:t.optional,typeRef:t.typeRef,value:c,description:r,isCorrectType:!0}}#C(e,o,t){let a=t?.description??"",r=t?.optional??!0,n=t?.typeRef;if(!n)throw new Error("Every array parameters should have a type ref");if(!Array.isArray(o))throw new Error("The value is not an array");let d=J(n)?void 0:{optional:!0,type:"object",value:[],typeRef:n,description:"",name:""},c=[];for(let m=0;m<o.length;m++){let f=this.#d(`${m}`,o[m],d);c.push(f)}return{type:"array",name:e,optional:r,typeRef:t?.typeRef,value:c,description:a,isCorrectType:!0}}#S(e){let o=e.composedPath()[0],t=this.#T(o);if(!t?.description)return null;let[a,r]=Me(t.description),n=t.type,d=t.replyArgs,c="";return d&&d.length>0?c=r+`Returns: ${d}<br>`:n?c=r+`<br>Type: ${n}<br>`:c=r,{box:o.boxInWindow(),show:async m=>{let f=new oe.CSSHintDetailsView.CSSHintDetailsView({getMessage:()=>`<span>${a}</span>`,getPossibleFixMessage:()=>c,getLearnMoreLink:()=>`https://chromedevtools.github.io/devtools-protocol/tot/${this.command.split(".")[0]}/`});return m.contentElement.appendChild(f),!0}}}#T(e){if(e.matches(".command")){let o=this.metadataByCommand.get(this.command);if(o)return{description:o.description,replyArgs:o.replyArgs}}if(e.matches(".parameter")){let o=e.dataset.paramid;if(!o)return;let t=o.split("."),{parameter:a}=this.#m(t);return a.description?{description:a.description,type:a.type}:void 0}}getCommandJson(){return this.command!==""?JSON.stringify({command:this.command,parameters:this.getParameters()}):""}#I(){let e=this.getCommandJson();O.InspectorFrontendHost.InspectorFrontendHostInstance.copyText(e)}#y(){this.dispatchEventToListeners("submiteditor",{command:this.command,parameters:this.getParameters(),targetId:this.targetId})}populateParametersForCommandWithDefaultValues(){let e=this.metadataByCommand.get(this.command)?.parameters;e&&(this.parameters=e.map(o=>this.#p(o)))}#p(e){if(e.type==="object"){let o=e.typeRef;o||(o=I);let a=(this.typesByName.get(o)??[]).map(r=>this.#p(r));return{...e,value:e.optional?void 0:a,isCorrectType:!0}}return e.type==="array"?{...e,value:e?.optional?void 0:e.value?.map(o=>this.#p(o))||[],isCorrectType:!0}:{...e,value:e.optional?void 0:b.get(e.type),isCorrectType:!0}}#m(e){let o=this.parameters,t;for(let a=0;a<e.length;a++){let r=e[a],n=o.find(d=>d.name===r);if(a===e.length-1)return{parameter:n,parentParameter:t};if(n?.type==="array"||n?.type==="object")n.value&&(o=n.value);else throw new Error("Parameter on the path in not an object or an array");t=n}throw new Error("Not found")}#f(e,o){if(e.type==="number"&&isNaN(Number(o)))return!1;let t=this.#w(e);return!(t.length!==0&&!t.includes(o))}#v=e=>{if(!(e.target instanceof x.SuggestionInput.SuggestionInput))return;let o;if(e instanceof KeyboardEvent){let n=e.target.renderRoot.querySelector("devtools-editable-content");if(!n)return;o=n.innerText}else o=e.target.value;let t=e.target.getAttribute("data-paramid");if(!t)return;let a=t.split("."),r=this.#m(a).parameter;o===""?r.value=b.get(r.type):(r.value=o,r.isCorrectType=this.#f(r,o)),this.requestUpdate()};#P=e=>{if(!(e.target instanceof x.SuggestionInput.SuggestionInput))return;let o=e.target.value,t=e.target.getAttribute("data-paramid");if(!t)return;let a=t.split("."),{parameter:r}=this.#m(a);r.name=o,this.requestUpdate()};#b=e=>{e.target instanceof x.SuggestionInput.SuggestionInput&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&this.#v(e)};#x(e){if(!(e.target instanceof x.SuggestionInput.SuggestionInput))return;let o=e.target.getAttribute("data-paramid");if(!o)return;let t=o.split("."),a=this.#m(t).parameter;a.isCorrectType=!0,this.requestUpdate()}#B=async e=>{e.target instanceof x.SuggestionInput.SuggestionInput&&(this.command=e.target.value),this.populateParametersForCommandWithDefaultValues();let o=e.target;await this.updateComplete,this.#M(o)};#M(e){let o=this.contentElement.querySelectorAll("devtools-suggestion-input,.add-button"),t=[...o].findIndex(a=>a===e.shadowRoot?.host);t>=0&&t+1<o.length?o[t+1].focus():this.contentElement.querySelector('devtools-button[jslogcontext="protocol-monitor.send-command"]')?.focus()}#h(e,o){if(e.type==="object"){let t=e.typeRef;t||(t=I);let r=(this.typesByName.get(t)??[]).map(n=>this.#h(n,n.name));return{type:"object",name:o,optional:e.optional,typeRef:t,value:r,isCorrectType:!0,description:e.description}}return{type:e.type,name:o,optional:e.optional,isCorrectType:!0,typeRef:e.typeRef,value:e.optional?void 0:b.get(e.type),description:e.description}}#E(e){let o=e.split("."),{parameter:t,parentParameter:a}=this.#m(o);if(t){switch(t.type){case"array":{let r=t.typeRef;if(!r)throw new Error("Every array parameter must have a typeRef");let n=this.typesByName.get(r)??[],d=n.map(m=>this.#h(m,m.name)),c=J(r)?r:"object";n.length===0&&this.enumsByName.get(r)&&(c="string"),t.value||(t.value=[]),t.value.push({type:c,name:String(t.value.length),optional:!0,typeRef:r,value:d.length!==0?d:"",description:"",isCorrectType:!0});break}case"object":{let r=t.typeRef;if(r||(r=I),t.value||(t.value=[]),!this.typesByName.get(r)){t.value.push({type:"string",name:"",optional:!0,value:"",isCorrectType:!0,description:"",isKeyEditable:!0});break}let n=this.typesByName.get(r)??[],d=n.map(m=>this.#h(m,m.name)),c=n.map(m=>this.#p(m));a?t.value.push({type:"object",name:"",optional:!0,typeRef:r,value:d,isCorrectType:!0,description:""}):t.value=c;break}default:t.value=b.get(t.type);break}this.requestUpdate()}}#$(e,o){if(e?.value!==void 0){switch(e.type){case"object":if(e.optional&&!o){e.value=void 0;break}!e.typeRef||!this.typesByName.get(e.typeRef)?e.value=[]:e.value.forEach(t=>this.#$(t,o));break;case"array":e.value=e.optional?void 0:[];break;default:e.value=e.optional?void 0:b.get(e.type),e.isCorrectType=!0;break}this.requestUpdate()}}#R(e,o){if(e&&Array.isArray(o.value)){if(o.value.splice(o.value.findIndex(t=>t===e),1),o.type==="array")for(let t=0;t<o.value.length;t++)o.value[t].name=String(t);this.requestUpdate()}}#j(e){e.target instanceof HTMLSelectElement&&(this.targetId=e.target.value),this.requestUpdate()}#w(e){if(e.type==="string"){let o=this.enumsByName.get(`${e.typeRef}`)??{};return Object.values(o)}return e.type==="boolean"?["true","false"]:[]}performUpdate(){let e={onParameterValueBlur:t=>{this.#v(t)},onParameterKeydown:t=>{this.#b(t)},onParameterFocus:t=>{this.#x(t)},onParameterKeyBlur:t=>{this.#P(t)},onKeydown:t=>{t.key==="Enter"&&(t.ctrlKey||t.metaKey)&&(this.#b(t),this.#y())},parameters:this.parameters,metadataByCommand:this.metadataByCommand,command:this.command,typesByName:this.typesByName,onCommandInputBlur:t=>this.#B(t),onCommandSend:()=>this.#y(),onCopyToClipboard:()=>this.#I(),targets:this.targets,targetId:this.targetId,onAddParameter:t=>{this.#E(t)},onClearParameter:(t,a)=>{this.#$(t,a)},onDeleteParameter:(t,a)=>{this.#R(t,a)},onTargetSelected:t=>{this.#j(t)},computeDropdownValues:t=>this.#w(t)},o={};this.#c(e,o,this.contentElement)}};function J(s){return s==="string"||s==="boolean"||s==="number"}function Ee(s){return p`
  <div class="row attribute padded">
    <div>target<span class="separator">:</span></div>
    <select class="target-selector"
            title=${h(u.selectTarget)}
            jslog=${M.dropDown("target-selector").track({change:!0})}
            @change=${s.onTargetSelected}>
      ${s.targets.map(e=>p`
        <option jslog=${M.item("target").track({click:!0,resize:!0})}
                value=${e.id()} ?selected=${e.id()===s.targetId}>
          ${e.name()} (${e.inspectedURL()})
        </option>`)}
    </select>
  </div>
`}function $(s){return p`
          <devtools-button
            title=${s.title}
            .size=${N.Button.Size.SMALL}
            .iconName=${s.iconName}
            .variant=${N.Button.Variant.ICON}
            class=${k(s.classMap)}
            @click=${s.onClick}
            .jslogContext=${s.jslogContext}
          ></devtools-button>
      `}function Re(){return p`<devtools-icon name='warning-filled' class='warning-icon small'>
  </devtools-icon>`}function ae(s,e,o,t,a){return e.sort((r,n)=>Number(r.optional)-Number(n.optional)),p`
    <ul>
      ${xe(e,r=>{let n=t?`${a}.${r.name}`:r.name,d=r.type==="array"||r.type==="object"?r.value??[]:[],c=J(r.type),m=r.type==="array",f=t&&t.type==="array",H=t&&t.type==="object",j=r.type==="object",T=r.value===void 0,D=r.optional,X=j&&r.typeRef&&s.typesByName.get(r.typeRef)!==void 0,V=r.isKeyEditable,be=j&&!X,A=r.type==="string"||r.type==="boolean",$e=m&&!T&&r.value?.length!==0||j&&!T,we={"optional-parameter":r.optional,parameter:!0,"undefined-parameter":r.value===void 0&&r.optional},Ce={"json-input":!0};return p`
              <li class="row">
                <div class="row-icons">
                    ${r.isCorrectType?g:p`${Re()}`}

                    <!-- If an object parameter has no predefined keys, show an input to enter the key, otherwise show the name of the parameter -->
                    <div class=${k(we)} data-paramId=${n}>
                        ${V?p`<devtools-suggestion-input
                            data-paramId=${n}
                            .isKey=${!0}
                            .isCorrectInput=${w(r.isCorrectType)}
                            .options=${A?s.computeDropdownValues(r):[]}
                            .autocomplete=${!1}
                            .value=${w(r.name??"")}
                            .placeholder=${r.value===""?U:`<${b.get(r.type)}>`}
                            @blur=${s.onParameterKeyBlur}
                            @focus=${s.onParameterFocus}
                            @keydown=${s.onParameterKeydown}
                          ></devtools-suggestion-input>`:p`${r.name}`} <span class="separator">:</span>
                    </div>

                    <!-- Render button to add values inside an array parameter -->
                    ${m?p`
                      ${$({title:h(u.addParameter),iconName:"plus",onClick:()=>s.onAddParameter(n),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}
                    `:g}

                    <!-- Render button to complete reset an array parameter or an object parameter-->
                    ${$e?$({title:h(u.resetDefaultValue),iconName:"clear",onClick:()=>s.onClearParameter(r,f),classMap:{"clear-button":!0},jslogContext:"protocol-monitor.reset-to-default-value"}):g}

                    <!-- Render the buttons to change the value from undefined to empty string for optional primitive parameters -->
                    ${c&&!f&&D&&T?p`  ${$({title:h(u.addParameter),iconName:"plus",onClick:()=>s.onAddParameter(n),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}`:g}

                    <!-- Render the buttons to change the value from undefined to populate the values inside object with their default values -->
                    ${j&&D&&T&&X?p`  ${$({title:h(u.addParameter),iconName:"plus",onClick:()=>s.onAddParameter(n),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-parameter"})}`:g}
                </div>

                <div class="row-icons">
                    <!-- If an object has no predefined keys, show an input to enter the value, and a delete icon to delete the whole key/value pair -->
                    ${V&&H?p`
                    <!-- @ts-ignore -->
                    <devtools-suggestion-input
                        data-paramId=${n}
                        .isCorrectInput=${w(r.isCorrectType)}
                        .options=${A?s.computeDropdownValues(r):[]}
                        .autocomplete=${!1}
                        .value=${w(r.value??"")}
                        .placeholder=${r.value===""?U:`<${b.get(r.type)}>`}
                        .jslogContext=${"parameter-value"}
                        @blur=${s.onParameterValueBlur}
                        @focus=${s.onParameterFocus}
                        @keydown=${s.onParameterKeydown}
                      ></devtools-suggestion-input>

                      ${$({title:h(u.deleteParameter),iconName:"bin",onClick:()=>s.onDeleteParameter(r,t),classMap:{deleteButton:!0,deleteIcon:!0},jslogContext:"protocol-monitor.delete-parameter"})}`:g}

                  <!-- In case  the parameter is not optional or its value is not undefined render the input -->
                  ${c&&!V&&(!T||!D)&&!f?p`
                      <!-- @ts-ignore -->
                      <devtools-suggestion-input
                        data-paramId=${n}
                        .strikethrough=${w(r.isCorrectType)}
                        .options=${A?s.computeDropdownValues(r):[]}
                        .autocomplete=${!1}
                        .value=${w(r.value??"")}
                        .placeholder=${r.value===""?U:`<${b.get(r.type)}>`}
                        .jslogContext=${"parameter-value"}
                        @blur=${s.onParameterValueBlur}
                        @focus=${s.onParameterFocus}
                        @keydown=${s.onParameterKeydown}
                      ></devtools-suggestion-input>`:g}

                  <!-- Render the buttons to change the value from empty string to undefined for optional primitive parameters -->
                  ${c&&!V&&!f&&D&&!T?p`  ${$({title:h(u.resetDefaultValue),iconName:"clear",onClick:()=>s.onClearParameter(r),classMap:{"clear-button":!0},jslogContext:"protocol-monitor.reset-to-default-value"})}`:g}

                  <!-- If the parameter is an object with no predefined keys, renders a button to add key/value pairs to it's value -->
                  ${be?p`
                    ${$({title:h(u.addCustomProperty),iconName:"plus",onClick:()=>s.onAddParameter(n),classMap:{"add-button":!0},jslogContext:"protocol-monitor.add-custom-property"})}
                  `:g}

                  <!-- In case the parameter is nested inside an array we render the input field as well as a delete button -->
                  ${f?p`
                  <!-- If the parameter is an object we don't want to display the input field we just want the delete button-->
                  ${j?g:p`
                  <!-- @ts-ignore -->
                  <devtools-suggestion-input
                    data-paramId=${n}
                    .options=${A?s.computeDropdownValues(r):[]}
                    .autocomplete=${!1}
                    .value=${w(r.value??"")}
                    .placeholder=${r.value===""?U:`<${b.get(r.type)}>`}
                    .jslogContext=${"parameter"}
                    @blur=${s.onParameterValueBlur}
                    @keydown=${s.onParameterKeydown}
                    class=${k(Ce)}
                  ></devtools-suggestion-input>`}

                  ${$({title:h(u.deleteParameter),iconName:"bin",onClick:()=>s.onDeleteParameter(r,t),classMap:{"delete-button":!0},jslogContext:"protocol-monitor.delete-parameter"})}`:g}
                </div>
              </li>
              ${ae(s,d,o,r,n)}
            `})}
    </ul>
  `}var ne=(s,e,o)=>{Ie(p`
    <div class="wrapper" @keydown=${s.onKeydown} jslog=${M.pane("command-editor").track({resize:!0})}>
      <div class="editor-wrapper">
        ${Ee(s)}
        <div class="row attribute padded">
          <div class="command">command<span class="separator">:</span></div>
          <devtools-suggestion-input
            .options=${[...s.metadataByCommand.keys()]}
            .value=${s.command}
            .placeholder=${"Enter your command\u2026"}
            .suggestionFilter=${re}
            .jslogContext=${"command"}
            @blur=${s.onCommandInputBlur}
            class=${k({"json-input":!0})}
          ></devtools-suggestion-input>
        </div>
        ${s.parameters.length?p`
        <div class="row attribute padded">
          <div>parameters<span class="separator">:</span></div>
        </div>
          ${ae(s,s.parameters)}
        `:g}
      </div>
      <devtools-toolbar class="protocol-monitor-sidebar-toolbar">
        <devtools-button title=${h(u.copyCommand)}
                        .iconName=${"copy"}
                        .jslogContext=${"protocol-monitor.copy-command"}
                        .variant=${N.Button.Variant.TOOLBAR}
                        @click=${s.onCopyToClipboard}></devtools-button>
          <div class=toolbar-spacer></div>
        <devtools-button title=${O.Platform.isMac()?h(u.sendCommandCmdEnter):h(u.sendCommandCtrlEnter)}
                        .iconName=${"send"}
                        jslogContext="protocol-monitor.send-command"
                        .variant=${N.Button.Variant.PRIMARY_TOOLBAR}
                        @click=${s.onCommandSend}></devtools-button>
      </devtools-toolbar>
    </div>`,o)};var ve={};Z(ve,{CommandAutocompleteSuggestionProvider:()=>F,DEFAULT_VIEW:()=>fe,InfoWidget:()=>K,ProtocolMonitorImpl:()=>G,buildProtocolMetadata:()=>he,parseCommandInput:()=>Y});import"./../../ui/legacy/legacy.js";import"./../../ui/legacy/components/data_grid/data_grid.js";import*as ce from"./../../core/host/host.js";import*as Q from"./../../core/i18n/i18n.js";import*as me from"./../../core/platform/platform.js";import*as R from"./../../core/protocol_client/protocol_client.js";import*as C from"./../../core/sdk/sdk.js";import*as pe from"./../../models/bindings/bindings.js";import*as ue from"./../../models/text_utils/text_utils.js";import*as E from"./../../ui/components/buttons/buttons.js";import*as W from"./../../ui/legacy/components/source_frame/source_frame.js";import*as y from"./../../ui/legacy/legacy.js";import{Directives as je,html as v,render as ge}from"./../../ui/lit/lit.js";import*as S from"./../../ui/visual_logging/visual_logging.js";var de=`@scope to (devtools-widget > *){.protocol-monitor-toolbar{border-bottom:1px solid var(--sys-color-divider)}.protocol-monitor-bottom-toolbar{border-top:1px solid var(--sys-color-divider)}.target-selector{max-width:120px}.protocol-monitor-main{flex-grow:1}}
/*# sourceURL=${import.meta.resolve("./protocolMonitor.css")} */`;var{styleMap:le}=je,{widget:z,widgetRef:Ne}=y.Widget,i={method:"Method",type:"Type",request:"Request",response:"Response",timestamp:"Timestamp",elapsedTime:"Elapsed time",target:"Target",record:"Record",clearAll:"Clear all",filter:"Filter",documentation:"Documentation",editAndResend:"Edit and resend",sMs:"{PH1} ms",noMessageSelected:"No message selected",selectAMessageToView:"Select a message to see its details",save:"Save",session:"Session",sendRawCDPCommand:"Send a raw `CDP` command",sendRawCDPCommandExplanation:"Format: `'Domain.commandName'` for a command without parameters, or `'{\"command\":\"Domain.commandName\", \"parameters\": {...}}'` as a JSON object for a command with parameters. `'cmd'`/`'method'` and `'args'`/`'params'`/`'arguments'` are also supported as alternative keys for the `JSON` object.",selectTarget:"Select a target",showCDPCommandEditor:"Show CDP command editor",hideCDPCommandEditor:"Hide  CDP command editor"},De=Q.i18n.registerUIStrings("panels/protocol_monitor/ProtocolMonitor.ts",i),l=Q.i18n.getLocalizedString.bind(void 0,De),he=s=>{let e=new Map;for(let o of s)for(let t of Object.keys(o.metadata))e.set(t,o.metadata[t]);return e},ye=he(R.InspectorBackend.inspectorBackend.agentPrototypes.values()),Ve=R.InspectorBackend.inspectorBackend.typeMap,Ae=R.InspectorBackend.inspectorBackend.enumMap,fe=(s,e,o)=>{ge(v`
        <style>${y.inspectorCommonStyles}</style>
        <style>${de}</style>
        <devtools-split-view name="protocol-monitor-split-container"
                             direction="column"
                             sidebar-initial-size="400"
                             sidebar-visibility=${s.sidebarVisible?"visible":"hidden"}
                             @change=${t=>s.onSplitChange(t.detail==="OnlyMain")}>
          <div slot="main" class="vbox protocol-monitor-main">
            <devtools-toolbar class="protocol-monitor-toolbar"
                               jslog=${S.toolbar("top")}>
               <devtools-button title=${l(i.record)}
                                .iconName=${"record-start"}
                                .toggledIconName=${"record-stop"}
                                .jslogContext=${"protocol-monitor.toggle-recording"}
                                .variant=${E.Button.Variant.ICON_TOGGLE}
                                .toggleType=${E.Button.ToggleType.RED}
                                .toggled=${!0}
                                @click=${t=>s.onRecord(t.target.toggled)}>
               </devtools-button>
              <devtools-button title=${l(i.clearAll)}
                               .iconName=${"clear"}
                               .variant=${E.Button.Variant.TOOLBAR}
                               .jslogContext=${"protocol-monitor.clear-all"}
                               @click=${()=>s.onClear()}></devtools-button>
              <devtools-button title=${l(i.save)}
                               .iconName=${"download"}
                               .variant=${E.Button.Variant.TOOLBAR}
                               .jslogContext=${"protocol-monitor.save"}
                               @click=${()=>s.onSave()}></devtools-button>
              <devtools-toolbar-input type="filter"
                                      list="filter-suggestions"
                                      style="flex-grow: 1"
                                      value=${s.filter}
                                      @change=${t=>s.onFilterChanged(t.detail)}>
                <datalist id="filter-suggestions">
                  ${s.filterKeys.map(t=>v`
                        <option value=${t+":"}></option>
                        <option value=${"-"+t+":"}></option>`)}
                </datalist>
              </devtools-toolbar-input>
            </devtools-toolbar>
            <devtools-split-view direction="column" sidebar-position="second"
                                 name="protocol-monitor-panel-split" sidebar-initial-size="250">
              <devtools-data-grid
                  striped
                  slot="main"
                  .filters=${s.parseFilter(s.filter)}>
                <table>
                    <tr>
                      <th id="type" sortable style="text-align: center" hideable weight="1">
                        ${l(i.type)}
                      </th>
                      <th id="method" weight="5">
                        ${l(i.method)}
                      </th>
                      <th id="request" hideable weight="5">
                        ${l(i.request)}
                      </th>
                      <th id="response" hideable weight="5">
                        ${l(i.response)}
                      </th>
                      <th id="elapsed-time" sortable hideable weight="2">
                        ${l(i.elapsedTime)}
                      </th>
                      <th id="timestamp" sortable hideable weight="5">
                        ${l(i.timestamp)}
                      </th>
                      <th id="target" sortable hideable weight="5">
                        ${l(i.target)}
                      </th>
                      <th id="session" sortable hideable weight="5">
                        ${l(i.session)}
                      </th>
                    </tr>
                    ${s.messages.map(t=>v`
                      <tr @select=${()=>s.onSelect(t)}
                          @contextmenu=${a=>s.onContextMenu(t,a.detail)}
                          style="--override-data-grid-row-background-color: var(--sys-color-surface3)">
                        ${"id"in t?v`
                          <td title="sent">
                            <devtools-icon name="arrow-up-down" class="medium" style="color: var(--icon-request-response);">
                            </devtools-icon>
                          </td>`:v`
                          <td title="received">
                            <devtools-icon name="arrow-down" class="medium" style="color: var(--icon-request);">
                            </devtools-icon>
                          </td>`}
                        <td>${t.method}</td>
                        <td>${t.params?v`<code>${JSON.stringify(t.params)}</code>`:""}</td>
                        <td>
                          ${t.result?v`<code>${JSON.stringify(t.result)}</code>`:t.error?v`<code>${JSON.stringify(t.error)}</code>`:"id"in t?"(pending)":""}
                        </td>
                        <td data-value=${t.elapsedTime||0}>
                          ${"id"in t?t.elapsedTime?l(i.sMs,{PH1:String(t.elapsedTime)}):"(pending)":""}
                        </td>
                        <td data-value=${t.requestTime}>${l(i.sMs,{PH1:String(t.requestTime)})}</td>
                        <td>${ke(t.target)}</td>
                        <td>${t.sessionId||""}</td>
                      </tr>`)}
                  </table>
              </devtools-data-grid>
              <devtools-widget ${z(K,{request:s.selectedMessage?.params,response:s.selectedMessage?.result||s.selectedMessage?.error,type:s.selectedMessage?"id"in s?.selectedMessage?"sent":"received":void 0})}
                  class="protocol-monitor-info"
                  slot="sidebar"></devtools-widget>
            </devtools-split-view>
            <devtools-toolbar class="protocol-monitor-bottom-toolbar"
               jslog=${S.toolbar("bottom")}>
              <devtools-button .title=${s.sidebarVisible?l(i.hideCDPCommandEditor):l(i.showCDPCommandEditor)}
                               .iconName=${s.sidebarVisible?"left-panel-close":"left-panel-open"}
                               .variant=${E.Button.Variant.TOOLBAR}
                               .jslogContext=${"protocol-monitor.toggle-command-editor"}
                               @click=${()=>s.onToggleSidebar()}></devtools-button>
              </devtools-button>
              <devtools-toolbar-input id="command-input"
                                      style=${le({"flex-grow":1,display:s.sidebarVisible?"none":"flex"})}
                                      value=${s.command}
                                      list="command-input-suggestions"
                                      placeholder=${l(i.sendRawCDPCommand)}
                                      title=${l(i.sendRawCDPCommandExplanation)}
                                      @change=${t=>s.onCommandChange(t.detail)}
                                      @submit=${t=>s.onCommandSubmitted(t.detail)}>
                <datalist id="command-input-suggestions">
                  ${s.commandSuggestions.map(t=>v`<option value=${t}></option>`)}
                </datalist>
              </devtools-toolbar-input>
              <select class="target-selector"
                      title=${l(i.selectTarget)}
                      style=${le({display:s.sidebarVisible?"none":"flex"})}
                      jslog=${S.dropDown("target-selector").track({change:!0})}
                      @change=${t=>s.onTargetChange(t.target.value)}>
                ${s.targets.map(t=>v`
                  <option jslog=${S.item("target").track({click:!0})}
                          value=${t.id()} ?selected=${t.id()===s.selectedTargetId}>
                    ${t.name()} (${t.inspectedURL()})
                  </option>`)}
              </select>
            </devtools-toolbar>
          </div>
          <devtools-widget slot="sidebar"
              ${z(B,{metadataByCommand:ye,typesByName:Ve,enumsByName:Ae})}
              ${Ne(B,t=>{e.editorWidget=t})}>
          </devtools-widget>
        </devtools-split-view>`,o)},G=class extends y.Panel.Panel{started;startTime;messageForId=new Map;filterParser;#t=["method","request","response","target","session"];#e=new F;#a;#i="";#s=!1;#l;#n=[];#o;#c="";#r;#d=new Map;constructor(e=fe){super("protocol-monitor",!0),this.#l=e,this.started=!1,this.startTime=0,this.#t=["method","request","response","type","target","session"],this.filterParser=new ue.TextUtils.FilterParser(this.#t),this.#a="main",this.performUpdate(),this.#r.addEventListener(L.SUBMIT_EDITOR,o=>{this.onCommandSend(o.data.command,o.data.parameters,o.data.targetId)}),C.TargetManager.TargetManager.instance().addEventListener(C.TargetManager.Events.AVAILABLE_TARGETS_CHANGED,()=>{this.requestUpdate()}),C.TargetManager.TargetManager.instance().observeTargets(this)}targetAdded(e){this.#d.set(e.sessionId,e)}targetRemoved(e){this.#d.delete(e.sessionId)}#u(){let e=this.#r.getCommandJson(),o=this.#r.targetId;o&&(this.#a=o),e&&(this.#i=e,this.requestUpdate())}performUpdate(){let e={messages:this.#n,selectedMessage:this.#o,sidebarVisible:this.#s,command:this.#i,commandSuggestions:this.#e.allSuggestions(),filterKeys:this.#t,filter:this.#c,parseFilter:this.filterParser.parse.bind(this.filterParser),onSplitChange:a=>{if(a)this.#u(),this.#s=!1;else{let{command:r,parameters:n}=Y(this.#i);this.#r.displayCommand(r,n,this.#a),this.#s=!0}this.requestUpdate()},onRecord:a=>{this.setRecording(a)},onClear:()=>{this.#n=[],this.messageForId.clear(),this.requestUpdate()},onSave:()=>{this.saveAsFile()},onSelect:a=>{this.#o=a,this.requestUpdate()},onContextMenu:this.#g.bind(this),onCommandChange:a=>{this.#i=a},onCommandSubmitted:a=>{this.#e.addEntry(a);let{command:r,parameters:n}=Y(a);this.onCommandSend(r,n,this.#a)},onFilterChanged:a=>{this.#c=a,this.requestUpdate()},onTargetChange:a=>{this.#a=a},onToggleSidebar:()=>{this.#s=!this.#s,this.requestUpdate()},targets:C.TargetManager.TargetManager.instance().targets(),selectedTargetId:this.#a},o=this,t={set editorWidget(a){o.#r=a}};this.#l(e,t,this.contentElement)}#g(e,o){o.editSection().appendItem(l(i.editAndResend),()=>{if(!this.#o)return;let t=this.#o.params,a=this.#o.target?.id()||"",r=e.method;this.#i=JSON.stringify({command:r,parameters:t}),this.#s?this.#r.displayCommand(r,t,a):(this.#s=!0,this.requestUpdate())},{jslogContext:"edit-and-resend",disabled:!("id"in e)}),o.editSection().appendItem(l(i.filter),()=>{this.#c=`method:${e.method}`,this.requestUpdate()},{jslogContext:"filter"}),o.footerSection().appendItem(l(i.documentation),()=>{let[t,a]=e.method.split("."),r="id"in e?"method":"event";ce.InspectorFrontendHost.InspectorFrontendHostInstance.openInNewTab(`https://chromedevtools.github.io/devtools-protocol/tot/${t}#${r}-${a}`)},{jslogContext:"documentation"})}onCommandSend(e,o,t){let a=R.InspectorBackend.test,r=C.TargetManager.TargetManager.instance(),n=t?r.targetById(t):null,d=n?n.sessionId:"";a.sendRawMessage(e,o,()=>{},d)}wasShown(){super.wasShown(),!this.started&&(this.started=!0,this.startTime=Date.now(),this.setRecording(!0))}setRecording(e){let o=R.InspectorBackend.test;e?(o.onMessageSent=this.messageSent.bind(this),o.onMessageReceived=this.messageReceived.bind(this)):(o.onMessageSent=null,o.onMessageReceived=null)}messageReceived(e){if("id"in e&&e.id){let t=this.messageForId.get(e.id);if(!t)return;t.result=e.result,t.error=e.error,t.elapsedTime=Date.now()-this.startTime-t.requestTime,this.messageForId.delete(e.id),this.requestUpdate();return}let o=e.sessionId!==void 0?this.#d.get(e.sessionId):void 0;this.#n.push({method:e.method,sessionId:e.sessionId,target:o,requestTime:Date.now()-this.startTime,result:e.params}),this.requestUpdate()}messageSent(e){let o=e.sessionId!==void 0?this.#d.get(e.sessionId):void 0,t={method:e.method,params:e.params,id:e.id,sessionId:e.sessionId,target:o,requestTime:Date.now()-this.startTime};this.#n.push(t),this.requestUpdate(),this.messageForId.set(e.id,t)}async saveAsFile(){let e=new Date,o="ProtocolMonitor-"+me.DateUtilities.toISO8601Compact(e)+".json",t=new pe.FileUtils.FileOutputStream;if(!await t.open(o))return;let r=this.#n.map(n=>({...n,target:n.target?.id()}));t.write(JSON.stringify(r,null,"  ")),t.close()}},F=class{#t=200;#e=new Set;constructor(e){e!==void 0&&(this.#t=e)}allSuggestions(){let e=[...this.#e].reverse();return e.push(...ye.keys()),e}buildTextPromptCompletions=async(e,o,t)=>!o&&!t&&e?[]:this.allSuggestions().filter(r=>r.startsWith(o)).map(r=>({text:r}));addEntry(e){if(this.#e.has(e)&&this.#e.delete(e),this.#e.add(e),this.#e.size>this.#t){let o=this.#e.values().next().value;this.#e.delete(o)}}},Ue=(s,e,o)=>{ge(z(y.TabbedPane.TabbedPane,{tabs:[{id:"request",title:l(i.request),view:s.type===void 0?new y.EmptyWidget.EmptyWidget(l(i.noMessageSelected),l(i.selectAMessageToView)):W.JSONView.JSONView.createViewSync(s.request||null),enabled:s.type==="sent",selected:s.selectedTab==="request"},{id:"response",title:l(i.response),view:s.type===void 0?new y.EmptyWidget.EmptyWidget(l(i.noMessageSelected),l(i.selectAMessageToView)):W.JSONView.JSONView.createViewSync(s.response||null),selected:s.selectedTab==="response"}]}),o)},K=class extends y.Widget.VBox{#t;request;response;type;constructor(e,o=Ue){super(e),this.#t=o,this.requestUpdate()}performUpdate(){this.#t({request:this.request,response:this.response,type:this.type,selectedTab:this.type!=="sent"?"response":void 0},void 0,this.contentElement)}};function Y(s){let e=null;try{e=JSON.parse(s)}catch{}let o=e?e.command||e.method||e.cmd||"":s,t=e?.parameters||e?.params||e?.args||e?.arguments||{};return{command:o,parameters:t}}function ke(s){return s?s.decorateLabel(`${s.name()} ${s===C.TargetManager.TargetManager.instance().rootTarget()?"":s.id()}`):""}export{ie as JSONEditor,ve as ProtocolMonitor};
//# sourceMappingURL=protocol_monitor.js.map
