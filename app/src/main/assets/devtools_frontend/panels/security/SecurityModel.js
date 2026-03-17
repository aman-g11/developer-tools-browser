"use strict";
import * as i18n from "../../core/i18n/i18n.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Protocol from "../../generated/protocol.js";
const UIStrings = {
  /**
   * @description Text in Security Panel of the Security panel
   */
  theSecurityOfThisPageIsUnknown: "The security of this page is unknown.",
  /**
   * @description Text in Security Panel of the Security panel
   */
  thisPageIsNotSecure: "This page is not secure.",
  /**
   * @description Text in Security Panel of the Security panel
   */
  thisPageIsSecureValidHttps: "This page is secure (valid HTTPS).",
  /**
   * @description Text in Security Panel of the Security panel
   */
  thisPageIsNotSecureBrokenHttps: "This page is not secure (broken HTTPS).",
  /**
   * @description Description of an SSL cipher that contains a separate (bulk) cipher and MAC.
   * @example {AES_256_CBC} PH1
   * @example {HMAC-SHA1} PH2
   */
  cipherWithMAC: "{PH1} with {PH2}",
  /**
   * @description Description of an SSL Key and its Key Exchange Group.
   * @example {ECDHE_RSA} PH1
   * @example {X25519} PH2
   */
  keyExchangeWithGroup: "{PH1} with {PH2}"
};
const str_ = i18n.i18n.registerUIStrings("panels/security/SecurityModel.ts", UIStrings);
const i18nString = i18n.i18n.getLocalizedString.bind(void 0, str_);
const i18nLazyString = i18n.i18n.getLazilyComputedLocalizedString.bind(void 0, str_);
export class SecurityModel extends SDK.SDKModel.SDKModel {
  dispatcher;
  securityAgent;
  constructor(target) {
    super(target);
    this.dispatcher = new SecurityDispatcher(this);
    this.securityAgent = target.securityAgent();
    target.registerSecurityDispatcher(this.dispatcher);
    void this.securityAgent.invoke_enable();
  }
  resourceTreeModel() {
    return this.target().model(SDK.ResourceTreeModel.ResourceTreeModel);
  }
  networkManager() {
    return this.target().model(SDK.NetworkManager.NetworkManager);
  }
}
export function securityStateCompare(a, b) {
  const SECURITY_STATE_ORDER = [
    Protocol.Security.SecurityState.Info,
    Protocol.Security.SecurityState.InsecureBroken,
    Protocol.Security.SecurityState.Insecure,
    Protocol.Security.SecurityState.Neutral,
    Protocol.Security.SecurityState.Secure,
    // Unknown is max so that failed/cancelled requests don't overwrite the origin security state for successful requests,
    // and so that failed/cancelled requests appear at the bottom of the origins list.
    Protocol.Security.SecurityState.Unknown
  ];
  return SECURITY_STATE_ORDER.indexOf(a) - SECURITY_STATE_ORDER.indexOf(b);
}
SDK.SDKModel.SDKModel.register(SecurityModel, { capabilities: SDK.Target.Capability.SECURITY, autostart: false });
export var Events = /* @__PURE__ */ ((Events2) => {
  Events2["VisibleSecurityStateChanged"] = "VisibleSecurityStateChanged";
  return Events2;
})(Events || {});
export const SummaryMessages = {
  [Protocol.Security.SecurityState.Unknown]: i18nLazyString(UIStrings.theSecurityOfThisPageIsUnknown),
  [Protocol.Security.SecurityState.Insecure]: i18nLazyString(UIStrings.thisPageIsNotSecure),
  [Protocol.Security.SecurityState.Neutral]: i18nLazyString(UIStrings.thisPageIsNotSecure),
  [Protocol.Security.SecurityState.Secure]: i18nLazyString(UIStrings.thisPageIsSecureValidHttps),
  [Protocol.Security.SecurityState.InsecureBroken]: i18nLazyString(UIStrings.thisPageIsNotSecureBrokenHttps)
};
export class PageVisibleSecurityState {
  securityState;
  certificateSecurityState;
  safetyTipInfo;
  securityStateIssueIds;
  constructor(securityState, certificateSecurityState, safetyTipInfo, securityStateIssueIds) {
    this.securityState = securityState;
    this.certificateSecurityState = certificateSecurityState ? new CertificateSecurityState(certificateSecurityState) : null;
    this.safetyTipInfo = safetyTipInfo ? new SafetyTipInfo(safetyTipInfo) : null;
    this.securityStateIssueIds = securityStateIssueIds;
  }
}
export class CertificateSecurityState {
  protocol;
  keyExchange;
  keyExchangeGroup;
  cipher;
  mac;
  certificate;
  subjectName;
  issuer;
  validFrom;
  validTo;
  certificateNetworkError;
  certificateHasWeakSignature;
  certificateHasSha1Signature;
  modernSSL;
  obsoleteSslProtocol;
  obsoleteSslKeyExchange;
  obsoleteSslCipher;
  obsoleteSslSignature;
  constructor(certificateSecurityState) {
    this.protocol = certificateSecurityState.protocol;
    this.keyExchange = certificateSecurityState.keyExchange;
    this.keyExchangeGroup = certificateSecurityState.keyExchangeGroup || null;
    this.cipher = certificateSecurityState.cipher;
    this.mac = certificateSecurityState.mac || null;
    this.certificate = certificateSecurityState.certificate;
    this.subjectName = certificateSecurityState.subjectName;
    this.issuer = certificateSecurityState.issuer;
    this.validFrom = certificateSecurityState.validFrom;
    this.validTo = certificateSecurityState.validTo;
    this.certificateNetworkError = certificateSecurityState.certificateNetworkError || null;
    this.certificateHasWeakSignature = certificateSecurityState.certificateHasWeakSignature;
    this.certificateHasSha1Signature = certificateSecurityState.certificateHasSha1Signature;
    this.modernSSL = certificateSecurityState.modernSSL;
    this.obsoleteSslProtocol = certificateSecurityState.obsoleteSslProtocol;
    this.obsoleteSslKeyExchange = certificateSecurityState.obsoleteSslKeyExchange;
    this.obsoleteSslCipher = certificateSecurityState.obsoleteSslCipher;
    this.obsoleteSslSignature = certificateSecurityState.obsoleteSslSignature;
  }
  isCertificateExpiringSoon() {
    const expiryDate = new Date(this.validTo * 1e3).getTime();
    return expiryDate < new Date(Date.now()).setHours(48) && expiryDate > Date.now();
  }
  getKeyExchangeName() {
    if (this.keyExchangeGroup) {
      return this.keyExchange ? i18nString(UIStrings.keyExchangeWithGroup, { PH1: this.keyExchange, PH2: this.keyExchangeGroup }) : this.keyExchangeGroup;
    }
    return this.keyExchange;
  }
  getCipherFullName() {
    return this.mac ? i18nString(UIStrings.cipherWithMAC, { PH1: this.cipher, PH2: this.mac }) : this.cipher;
  }
}
class SafetyTipInfo {
  safetyTipStatus;
  safeUrl;
  constructor(safetyTipInfo) {
    this.safetyTipStatus = safetyTipInfo.safetyTipStatus;
    this.safeUrl = safetyTipInfo.safeUrl || null;
  }
}
export class SecurityStyleExplanation {
  securityState;
  title;
  summary;
  description;
  certificate;
  mixedContentType;
  recommendations;
  constructor(securityState, title, summary, description, certificate = [], mixedContentType = Protocol.Security.MixedContentType.None, recommendations = []) {
    this.securityState = securityState;
    this.title = title;
    this.summary = summary;
    this.description = description;
    this.certificate = certificate;
    this.mixedContentType = mixedContentType;
    this.recommendations = recommendations;
  }
}
class SecurityDispatcher {
  model;
  constructor(model) {
    this.model = model;
  }
  securityStateChanged(_event) {
  }
  visibleSecurityStateChanged({ visibleSecurityState }) {
    const pageVisibleSecurityState = new PageVisibleSecurityState(
      visibleSecurityState.securityState,
      visibleSecurityState.certificateSecurityState || null,
      visibleSecurityState.safetyTipInfo || null,
      visibleSecurityState.securityStateIssueIds
    );
    this.model.dispatchEventToListeners("VisibleSecurityStateChanged" /* VisibleSecurityStateChanged */, pageVisibleSecurityState);
  }
  certificateError(_event) {
  }
}
//# sourceMappingURL=SecurityModel.js.map
