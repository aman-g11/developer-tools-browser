"use strict";
import * as Common from "../../core/common/common.js";
import * as Platform from "../../core/platform/platform.js";
import * as SDK from "../../core/sdk/sdk.js";
import * as Workspace from "../workspace/workspace.js";
export function resourceForURL(url) {
  return SDK.ResourceTreeModel.ResourceTreeModel.resourceForURL(url);
}
export function displayNameForURL(url) {
  if (!url) {
    return "";
  }
  const uiSourceCode = Workspace.Workspace.WorkspaceImpl.instance().uiSourceCodeForURL(url);
  if (uiSourceCode) {
    return uiSourceCode.displayName();
  }
  const resource = resourceForURL(url);
  if (resource) {
    return resource.displayName;
  }
  const inspectedURL = SDK.TargetManager.TargetManager.instance().inspectedURL();
  if (!inspectedURL) {
    return Platform.StringUtilities.trimURL(url, "");
  }
  const parsedURL = Common.ParsedURL.ParsedURL.fromString(inspectedURL);
  if (!parsedURL) {
    return url;
  }
  const lastPathComponent = parsedURL.lastPathComponent;
  const index = inspectedURL.indexOf(lastPathComponent);
  if (index !== -1 && index + lastPathComponent.length === inspectedURL.length) {
    const baseURL = inspectedURL.substring(0, index);
    if (url.startsWith(baseURL) && url.length > index) {
      return url.substring(index);
    }
  }
  const displayName = Platform.StringUtilities.trimURL(url, parsedURL.host);
  return displayName === "/" ? parsedURL.host + "/" : displayName;
}
export function metadataForURL(target, frameId, url) {
  const resourceTreeModel = target.model(SDK.ResourceTreeModel.ResourceTreeModel);
  if (!resourceTreeModel) {
    return null;
  }
  const frame = resourceTreeModel.frameForId(frameId);
  if (!frame) {
    return null;
  }
  return resourceMetadata(frame.resourceForURL(url));
}
export function resourceMetadata(resource) {
  if (!resource || typeof resource.contentSize() !== "number" && !resource.lastModified()) {
    return null;
  }
  return new Workspace.UISourceCode.UISourceCodeMetadata(resource.lastModified(), resource.contentSize());
}
//# sourceMappingURL=ResourceUtils.js.map
