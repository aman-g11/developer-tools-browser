"use strict";
import * as Debugging from "./Debugging.js";
import * as LoggingConfig from "./LoggingConfig.js";
import * as LoggingDriver from "./LoggingDriver.js";
import * as LoggingEvents from "./LoggingEvents.js";
import * as NonDomState from "./NonDomState.js";
export { DebugLoggingFormat, setVeDebuggingEnabled, setVeDebugLoggingEnabled } from "./Debugging.js";
export { addDocument, startLogging, stopLogging } from "./LoggingDriver.js";
export { logImpressions, logSettingAccess, logFunctionCall } from "./LoggingEvents.js";
export const logClick = (loggable, event, options = {}) => LoggingEvents.logClick(LoggingDriver.clickLogThrottler)(loggable, event, options);
export const logResize = (l, s) => LoggingEvents.logResize(l, s);
export const logKeyDown = async (l, e, context) => await LoggingEvents.logKeyDown(LoggingDriver.keyboardLogThrottler)(l, e, context);
export { registerParentProvider, setMappedParent } from "./LoggingState.js";
export function registerLoggable(loggable, config, parent, size) {
  if (!LoggingDriver.isLogging()) {
    return;
  }
  NonDomState.registerLoggable(loggable, LoggingConfig.parseJsLog(config), parent || void 0, size);
  void LoggingDriver.scheduleProcessing();
}
export async function isUnderInspection(origin) {
  if (!origin) {
    return false;
  }
  const context = await LoggingEvents.contextAsNumber(origin);
  if (!context) {
    return false;
  }
  return [431010711, -1313957874, -1093325535].includes(context);
}
export function setHighlightedVe(veKey) {
  Debugging.setHighlightedVe(veKey);
  if (veKey) {
    void LoggingDriver.process();
  }
}
export const action = LoggingConfig.makeConfigStringBuilder.bind(null, "Action");
export const adorner = LoggingConfig.makeConfigStringBuilder.bind(null, "Adorner");
export const animationClip = LoggingConfig.makeConfigStringBuilder.bind(null, "AnimationClip");
export const badge = LoggingConfig.makeConfigStringBuilder.bind(null, "Badge");
export const bezierCurveEditor = LoggingConfig.makeConfigStringBuilder.bind(null, "BezierCurveEditor");
export const bezierPresetCategory = LoggingConfig.makeConfigStringBuilder.bind(null, "BezierPresetCategory");
export const breakpointMarker = LoggingConfig.makeConfigStringBuilder.bind(null, "BreakpointMarker");
export const canvas = LoggingConfig.makeConfigStringBuilder.bind(null, "Canvas");
export const close = LoggingConfig.makeConfigStringBuilder.bind(null, "Close");
export const colorEyeDropper = LoggingConfig.makeConfigStringBuilder.bind(null, "ColorEyeDropper");
export const counter = LoggingConfig.makeConfigStringBuilder.bind(null, "Counter");
export const controlPoint = LoggingConfig.makeConfigStringBuilder.bind(null, "ControlPoint");
export const cssColorMix = LoggingConfig.makeConfigStringBuilder.bind(null, "CssColorMix");
export const cssRuleHeader = LoggingConfig.makeConfigStringBuilder.bind(null, "CSSRuleHeader");
export const deviceModeRuler = LoggingConfig.makeConfigStringBuilder.bind(null, "DeviceModeRuler");
export const domBreakpoint = LoggingConfig.makeConfigStringBuilder.bind(null, "DOMBreakpoint");
export const drawer = LoggingConfig.makeConfigStringBuilder.bind(null, "Drawer");
export const dropDown = LoggingConfig.makeConfigStringBuilder.bind(null, "DropDown");
export const elementsBreadcrumbs = LoggingConfig.makeConfigStringBuilder.bind(null, "ElementsBreadcrumbs");
export const expand = LoggingConfig.makeConfigStringBuilder.bind(null, "Expand");
export const filterDropdown = LoggingConfig.makeConfigStringBuilder.bind(null, "FilterDropdown");
export const gutter = LoggingConfig.makeConfigStringBuilder.bind(null, "Gutter");
export const dialog = LoggingConfig.makeConfigStringBuilder.bind(null, "Dialog");
export const item = LoggingConfig.makeConfigStringBuilder.bind(null, "Item");
export const key = LoggingConfig.makeConfigStringBuilder.bind(null, "Key");
export const link = LoggingConfig.makeConfigStringBuilder.bind(null, "Link");
export const mediaInspectorView = LoggingConfig.makeConfigStringBuilder.bind(null, "MediaInspectorView");
export const menu = LoggingConfig.makeConfigStringBuilder.bind(null, "Menu");
export const metricsBox = LoggingConfig.makeConfigStringBuilder.bind(null, "MetricsBox");
export const paletteColorShades = LoggingConfig.makeConfigStringBuilder.bind(null, "PaletteColorShades");
export const pane = LoggingConfig.makeConfigStringBuilder.bind(null, "Pane");
export const panel = LoggingConfig.makeConfigStringBuilder.bind(null, "Panel");
export const panelTabHeader = LoggingConfig.makeConfigStringBuilder.bind(null, "PanelTabHeader");
export const pieChart = LoggingConfig.makeConfigStringBuilder.bind(null, "PieChart");
export const pieChartSlice = LoggingConfig.makeConfigStringBuilder.bind(null, "PieChartSlice");
export const pieChartTotal = LoggingConfig.makeConfigStringBuilder.bind(null, "PieChartTotal");
export const popover = LoggingConfig.makeConfigStringBuilder.bind(null, "Popover");
export const preview = LoggingConfig.makeConfigStringBuilder.bind(null, "Preview");
export const resizer = LoggingConfig.makeConfigStringBuilder.bind(null, "Resizer");
export const responsivePresets = LoggingConfig.makeConfigStringBuilder.bind(null, "ResponsivePresets");
export const showStyleEditor = LoggingConfig.makeConfigStringBuilder.bind(null, "ShowStyleEditor");
export const slider = LoggingConfig.makeConfigStringBuilder.bind(null, "Slider");
export const section = LoggingConfig.makeConfigStringBuilder.bind(null, "Section");
export const sectionHeader = LoggingConfig.makeConfigStringBuilder.bind(null, "SectionHeader");
export const tableRow = LoggingConfig.makeConfigStringBuilder.bind(null, "TableRow");
export const tableCell = LoggingConfig.makeConfigStringBuilder.bind(null, "TableCell");
export const tableHeader = LoggingConfig.makeConfigStringBuilder.bind(null, "TableHeader");
export const textField = LoggingConfig.makeConfigStringBuilder.bind(null, "TextField");
export const timeline = LoggingConfig.makeConfigStringBuilder.bind(null, "Timeline");
export const toggle = LoggingConfig.makeConfigStringBuilder.bind(null, "Toggle");
export const toolbar = LoggingConfig.makeConfigStringBuilder.bind(null, "Toolbar");
export const toggleSubpane = LoggingConfig.makeConfigStringBuilder.bind(null, "ToggleSubpane");
export const tree = LoggingConfig.makeConfigStringBuilder.bind(null, "Tree");
export const treeItem = LoggingConfig.makeConfigStringBuilder.bind(null, "TreeItem");
export const value = LoggingConfig.makeConfigStringBuilder.bind(null, "Value");
//# sourceMappingURL=visual_logging.prebundle.js.map
