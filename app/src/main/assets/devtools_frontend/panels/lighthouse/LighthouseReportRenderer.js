"use strict";
import * as Common from "../../core/common/common.js";
import * as Host from "../../core/host/host.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as TextUtils from "../../models/text_utils/text_utils.js";
import * as Workspace from "../../models/workspace/workspace.js";
import * as LighthouseReport from "../../third_party/lighthouse/report/report.js";
import * as Components from "../../ui/legacy/components/utils/utils.js";
import * as UI from "../../ui/legacy/legacy.js";
import * as ThemeSupport from "../../ui/legacy/theme_support/theme_support.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as PanelsCommon from "../common/common.js";
const MaxLengthForLinks = 40;
export class LighthouseReportRenderer {
  static renderLighthouseReport(lhr, artifacts, opts) {
    let onViewTrace = void 0;
    if (artifacts) {
      onViewTrace = async () => {
        Host.userMetrics.actionTaken(Host.UserMetrics.Action.LighthouseViewTrace);
        const trace = new SDK.TraceObject.TraceObject(artifacts.Trace.traceEvents);
        void Common.Revealer.reveal(trace);
      };
    }
    async function onSaveFileOverride(blob) {
      const domain = new Common.ParsedURL.ParsedURL(lhr.finalUrl || lhr.finalDisplayedUrl).domain();
      const sanitizedDomain = domain.replace(/[^a-z0-9.-]+/gi, "_");
      const timestamp = Platform.DateUtilities.toISO8601Compact(new Date(lhr.fetchTime));
      const ext = blob.type.match("json") ? ".json" : ".html";
      const basename = `${sanitizedDomain}-${timestamp}${ext}`;
      const base64 = await blob.arrayBuffer().then(Common.Base64.encode);
      await Workspace.FileManager.FileManager.instance().save(
        basename,
        new TextUtils.ContentData.ContentData(
          base64,
          /* isBase64= */
          true,
          blob.type
        ),
        /* forceSaveAs=*/
        true
      );
      Workspace.FileManager.FileManager.instance().close(basename);
    }
    async function onPrintOverride(rootEl) {
      const clonedReport = rootEl.cloneNode(true);
      const printWindow = window.open("", "_blank", "channelmode=1,status=1,resizable=1");
      if (!printWindow) {
        return;
      }
      printWindow.document.body.replaceWith(clonedReport);
      await LighthouseReportRenderer.linkifyNodeDetails(clonedReport);
      opts?.beforePrint?.();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      opts?.afterPrint?.();
    }
    function getStandaloneReportHTML() {
      return Lighthouse.ReportGenerator.ReportGenerator.generateReportHtml(lhr);
    }
    const reportEl = LighthouseReport.renderReport(lhr, {
      // Disable dark mode so we can manually adjust it.
      disableDarkMode: true,
      onViewTrace,
      onSaveFileOverride,
      onPrintOverride,
      getStandaloneReportHTML
    });
    reportEl.classList.add("lh-devtools");
    const updateDarkModeIfNecessary = () => {
      reportEl.classList.toggle("lh-dark", ThemeSupport.ThemeSupport.instance().themeName() === "dark");
    };
    ThemeSupport.ThemeSupport.instance().addEventListener(
      ThemeSupport.ThemeChangeEvent.eventName,
      updateDarkModeIfNecessary
    );
    updateDarkModeIfNecessary();
    reportEl._lighthouseResultForTesting = lhr;
    reportEl._lighthouseArtifactsForTesting = artifacts;
    LighthouseReportRenderer.installVisualLogging(reportEl);
    void LighthouseReportRenderer.waitForMainTargetLoad().then(() => {
      void LighthouseReportRenderer.linkifyNodeDetails(reportEl);
      void LighthouseReportRenderer.linkifySourceLocationDetails(reportEl);
    });
    return reportEl;
  }
  static async waitForMainTargetLoad() {
    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      return;
    }
    const resourceTreeModel = mainTarget.model(SDK.ResourceTreeModel.ResourceTreeModel);
    if (!resourceTreeModel) {
      return;
    }
    await resourceTreeModel.once(SDK.ResourceTreeModel.Events.Load);
  }
  static async linkifyNodeDetails(el) {
    const mainTarget = SDK.TargetManager.TargetManager.instance().primaryPageTarget();
    if (!mainTarget) {
      return;
    }
    const domModel = mainTarget.model(SDK.DOMModel.DOMModel);
    if (!domModel) {
      return;
    }
    for (const origElement of el.getElementsByClassName("lh-node")) {
      const origHTMLElement = origElement;
      const detailsItem = origHTMLElement.dataset;
      if (!detailsItem.path) {
        continue;
      }
      const nodeId = await domModel.pushNodeByPathToFrontend(detailsItem.path);
      if (!nodeId) {
        continue;
      }
      const node = domModel.nodeForId(nodeId);
      if (!node) {
        continue;
      }
      const element = PanelsCommon.DOMLinkifier.Linkifier.instance().linkify(
        node,
        { tooltip: detailsItem.snippet, preventKeyboardFocus: void 0 }
      );
      UI.Tooltip.Tooltip.install(origHTMLElement, "");
      const screenshotElement = origHTMLElement.querySelector(".lh-element-screenshot");
      origHTMLElement.textContent = "";
      if (screenshotElement) {
        origHTMLElement.append(screenshotElement);
      }
      origHTMLElement.appendChild(element);
    }
  }
  static async linkifySourceLocationDetails(el) {
    for (const origElement of el.getElementsByClassName("lh-source-location")) {
      const origHTMLElement = origElement;
      const detailsItem = origHTMLElement.dataset;
      if (!detailsItem.sourceUrl || !detailsItem.sourceLine || !detailsItem.sourceColumn) {
        continue;
      }
      const url = detailsItem.sourceUrl;
      const line = Number(detailsItem.sourceLine);
      const column = Number(detailsItem.sourceColumn);
      const element = await Components.Linkifier.Linkifier.linkifyURL(url, {
        lineNumber: line,
        columnNumber: column,
        showColumnNumber: false,
        inlineFrameIndex: 0,
        maxLength: MaxLengthForLinks
      });
      UI.Tooltip.Tooltip.install(origHTMLElement, "");
      origHTMLElement.textContent = "";
      origHTMLElement.appendChild(element);
    }
  }
  static installVisualLogging(el) {
    for (const auditEl of el.getElementsByClassName("lh-audit")) {
      const summaryEl = auditEl.querySelector("summary");
      if (!summaryEl) {
        continue;
      }
      const id = auditEl.id;
      if (!id) {
        continue;
      }
      auditEl.setAttribute("jslog", `${VisualLogging.item(`lighthouse.audit.${id}`).track({ resize: true })}`);
      let state;
      for (const className of auditEl.classList) {
        switch (className) {
          case "lh-audit--pass":
            state = "pass";
            break;
          case "lh-audit--average":
            state = "average";
            break;
          case "lh-audit--fail":
            state = "fail";
            break;
          case "lh-audit--informative":
            state = "informative";
            break;
        }
      }
      if (!state) {
        continue;
      }
      summaryEl.setAttribute(
        "jslog",
        `${VisualLogging.expand(`lighthouse.audit-summary.${state}`).track({ click: true })}`
      );
    }
  }
}
//# sourceMappingURL=LighthouseReportRenderer.js.map
