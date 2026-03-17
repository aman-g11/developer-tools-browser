"use strict";
import * as Host from "../../core/host/host.js";
import * as Root from "../../core/root/root.js";
import { DebugLoggingFormat } from "./Debugging.js";
import { knownContextValues } from "./KnownContextValues.js";
const LOGGING_ATTRIBUTE = "jslog";
export function needsLogging(element) {
  return element.hasAttribute(LOGGING_ATTRIBUTE);
}
export function getLoggingConfig(element) {
  return parseJsLog(element.getAttribute(LOGGING_ATTRIBUTE) || "");
}
export var VisualElements = /* @__PURE__ */ ((VisualElements2) => {
  VisualElements2[VisualElements2["TreeItem"] = 1] = "TreeItem";
  VisualElements2[VisualElements2["Close"] = 2] = "Close";
  VisualElements2[VisualElements2["Counter"] = 3] = "Counter";
  VisualElements2[VisualElements2["Drawer"] = 4] = "Drawer";
  VisualElements2[VisualElements2["Resizer"] = 5] = "Resizer";
  VisualElements2[VisualElements2["Toggle"] = 6] = "Toggle";
  VisualElements2[VisualElements2["Tree"] = 7] = "Tree";
  VisualElements2[VisualElements2["TextField"] = 8] = "TextField";
  VisualElements2[VisualElements2["AnimationClip"] = 9] = "AnimationClip";
  VisualElements2[VisualElements2["Section"] = 10] = "Section";
  VisualElements2[VisualElements2["SectionHeader"] = 11] = "SectionHeader";
  VisualElements2[VisualElements2["Timeline"] = 12] = "Timeline";
  VisualElements2[VisualElements2["CSSRuleHeader"] = 13] = "CSSRuleHeader";
  VisualElements2[VisualElements2["Expand"] = 14] = "Expand";
  VisualElements2[VisualElements2["ToggleSubpane"] = 15] = "ToggleSubpane";
  VisualElements2[VisualElements2["ControlPoint"] = 16] = "ControlPoint";
  VisualElements2[VisualElements2["Toolbar"] = 17] = "Toolbar";
  VisualElements2[VisualElements2["Popover"] = 18] = "Popover";
  VisualElements2[VisualElements2["BreakpointMarker"] = 19] = "BreakpointMarker";
  VisualElements2[VisualElements2["DropDown"] = 20] = "DropDown";
  VisualElements2[VisualElements2["Adorner"] = 21] = "Adorner";
  VisualElements2[VisualElements2["Gutter"] = 22] = "Gutter";
  VisualElements2[VisualElements2["MetricsBox"] = 23] = "MetricsBox";
  VisualElements2[VisualElements2["MetricsBoxPart"] = 24] = "MetricsBoxPart";
  VisualElements2[VisualElements2["Badge"] = 25] = "Badge";
  VisualElements2[VisualElements2["DOMBreakpoint"] = 26] = "DOMBreakpoint";
  VisualElements2[VisualElements2["Action"] = 29] = "Action";
  VisualElements2[VisualElements2["FilterDropdown"] = 30] = "FilterDropdown";
  VisualElements2[VisualElements2["Dialog"] = 31] = "Dialog";
  VisualElements2[VisualElements2["BezierCurveEditor"] = 32] = "BezierCurveEditor";
  VisualElements2[VisualElements2["BezierPresetCategory"] = 34] = "BezierPresetCategory";
  VisualElements2[VisualElements2["Preview"] = 35] = "Preview";
  VisualElements2[VisualElements2["Canvas"] = 36] = "Canvas";
  VisualElements2[VisualElements2["ColorEyeDropper"] = 37] = "ColorEyeDropper";
  VisualElements2[VisualElements2["Link"] = 44] = "Link";
  VisualElements2[VisualElements2["Item"] = 46] = "Item";
  VisualElements2[VisualElements2["PaletteColorShades"] = 47] = "PaletteColorShades";
  VisualElements2[VisualElements2["Panel"] = 48] = "Panel";
  VisualElements2[VisualElements2["ShowStyleEditor"] = 50] = "ShowStyleEditor";
  VisualElements2[VisualElements2["Slider"] = 51] = "Slider";
  VisualElements2[VisualElements2["CssColorMix"] = 52] = "CssColorMix";
  VisualElements2[VisualElements2["Value"] = 53] = "Value";
  VisualElements2[VisualElements2["Key"] = 54] = "Key";
  VisualElements2[VisualElements2["PieChart"] = 59] = "PieChart";
  VisualElements2[VisualElements2["PieChartSlice"] = 60] = "PieChartSlice";
  VisualElements2[VisualElements2["PieChartTotal"] = 61] = "PieChartTotal";
  VisualElements2[VisualElements2["ElementsBreadcrumbs"] = 62] = "ElementsBreadcrumbs";
  VisualElements2[VisualElements2["PanelTabHeader"] = 66] = "PanelTabHeader";
  VisualElements2[VisualElements2["Menu"] = 67] = "Menu";
  VisualElements2[VisualElements2["TableRow"] = 68] = "TableRow";
  VisualElements2[VisualElements2["TableHeader"] = 69] = "TableHeader";
  VisualElements2[VisualElements2["TableCell"] = 70] = "TableCell";
  VisualElements2[VisualElements2["Pane"] = 72] = "Pane";
  VisualElements2[VisualElements2["ResponsivePresets"] = 73] = "ResponsivePresets";
  VisualElements2[VisualElements2["DeviceModeRuler"] = 74] = "DeviceModeRuler";
  VisualElements2[VisualElements2["MediaInspectorView"] = 75] = "MediaInspectorView";
  return VisualElements2;
})(VisualElements || {});
function resolveVe(ve) {
  return VisualElements[ve] ?? 0;
}
const reportedUnknownVeContext = /* @__PURE__ */ new Set();
function checkContextValue(context) {
  if (typeof context !== "string" || !context.length || knownContextValues.has(context) || reportedUnknownVeContext.has(context)) {
    return;
  }
  if (Root.Runtime.Runtime.queryParam("debugFrontend") || Host.InspectorFrontendHost.isUnderTest() || localStorage.getItem("veDebugLoggingEnabled") === DebugLoggingFormat.TEST) {
    const stack = (new Error().stack || "").split("\n").slice(3).join("\n");
    console.error(`Unknown VE context: '${context}'
${stack}
Please add it to front_end/ui/visual_logging/KnownContextValues.ts if you think that's a valid context value.`);
  }
  reportedUnknownVeContext.add(context);
}
export function parseJsLog(jslog) {
  const components = jslog.replace(/ /g, "").split(";");
  const getComponent = (name) => components.find((c) => c.startsWith(name))?.substr(name.length);
  const ve = resolveVe(components[0]);
  if (ve === 0) {
    throw new Error("Unkown VE: " + jslog);
  }
  const config = { ve };
  const context = getComponent("context:");
  if (context?.trim().length) {
    checkContextValue(context);
    config.context = context;
  }
  const parent = getComponent("parent:");
  if (parent) {
    config.parent = parent;
  }
  const trackString = getComponent("track:");
  if (trackString) {
    config.track = {};
    for (const track of trackString.split(",")) {
      if (track.startsWith("keydown:")) {
        config.track.keydown = track.substr("keydown:".length);
      } else {
        config.track[track] = true;
      }
    }
  }
  return config;
}
export function makeConfigStringBuilder(veName, context) {
  const components = [veName];
  if (typeof context === "string" && context.trim().length) {
    components.push(`context: ${context}`);
    checkContextValue(context);
  }
  return {
    context: function(value) {
      if (typeof value === "number" || typeof value === "string" && value.length) {
        components.push(`context: ${value}`);
      }
      checkContextValue(context);
      return this;
    },
    parent: function(value) {
      components.push(`parent: ${value}`);
      return this;
    },
    track: function(options) {
      components.push(`track: ${Object.entries(options).map(([key, value]) => value !== true ? `${key}: ${value}` : key).join(", ")}`);
      return this;
    },
    toString: function() {
      return components.join("; ");
    }
  };
}
//# sourceMappingURL=LoggingConfig.js.map
