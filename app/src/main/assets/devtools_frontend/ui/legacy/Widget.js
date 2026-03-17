"use strict";
import "../../core/dom_extension/dom_extension.js";
import * as Platform from "../../core/platform/platform.js";
import * as Geometry from "../../models/geometry/geometry.js";
import * as Lit from "../../ui/lit/lit.js";
import { appendStyle, deepActiveElement } from "./DOMUtilities.js";
import { cloneCustomElement, createShadowRootWithCoreStyles } from "./UIUtils.js";
const { html } = Lit;
const originalAppendChild = Element.prototype.appendChild;
const originalInsertBefore = Element.prototype.insertBefore;
const originalRemoveChild = Element.prototype.removeChild;
const originalRemoveChildren = Element.prototype.removeChildren;
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
export class WidgetConfig {
  constructor(widgetClass, widgetParams) {
    this.widgetClass = widgetClass;
    this.widgetParams = widgetParams;
  }
}
export function widgetConfig(widgetClass, widgetParams) {
  return new WidgetConfig(widgetClass, widgetParams);
}
let currentUpdateQueue = null;
const currentlyProcessed = /* @__PURE__ */ new Set();
let nextUpdateQueue = /* @__PURE__ */ new Map();
let pendingAnimationFrame = null;
let overallUpdatePromise = null;
function enqueueIntoNextUpdateQueue(widget2) {
  const scheduledUpdate = nextUpdateQueue.get(widget2) ?? Promise.withResolvers();
  nextUpdateQueue.delete(widget2);
  nextUpdateQueue.set(widget2, scheduledUpdate);
  if (pendingAnimationFrame === null) {
    pendingAnimationFrame = requestAnimationFrame(runNextUpdate);
  }
  return scheduledUpdate.promise;
}
function enqueueWidgetUpdate(widget2) {
  if (currentUpdateQueue) {
    if (currentlyProcessed.has(widget2)) {
      return enqueueIntoNextUpdateQueue(widget2);
    }
    const scheduledUpdate = currentUpdateQueue.get(widget2) ?? Promise.withResolvers();
    currentUpdateQueue.delete(widget2);
    currentUpdateQueue.set(widget2, scheduledUpdate);
    return scheduledUpdate.promise;
  }
  return enqueueIntoNextUpdateQueue(widget2);
}
function cancelUpdate(widget2) {
  widget2.cancelUpdateController();
  if (currentUpdateQueue) {
    const scheduledUpdate2 = currentUpdateQueue.get(widget2);
    if (scheduledUpdate2) {
      scheduledUpdate2.resolve();
      currentUpdateQueue.delete(widget2);
    }
  }
  const scheduledUpdate = nextUpdateQueue.get(widget2);
  if (scheduledUpdate) {
    scheduledUpdate.resolve();
    nextUpdateQueue.delete(widget2);
  }
}
function runNextUpdate() {
  pendingAnimationFrame = null;
  if (!currentUpdateQueue) {
    currentUpdateQueue = nextUpdateQueue;
    nextUpdateQueue = /* @__PURE__ */ new Map();
  }
  for (const [widget2, { resolve }] of currentUpdateQueue) {
    currentlyProcessed.add(widget2);
    void (async () => {
      try {
        const controller = new AbortController();
        widget2.addUpdateController(controller);
        await widget2.performUpdate(controller.signal);
      } finally {
        resolve();
      }
    })();
  }
  currentUpdateQueue.clear();
  queueMicrotask(() => {
    if (currentUpdateQueue && currentUpdateQueue.size > 0) {
      runNextUpdate();
    } else {
      currentUpdateQueue = null;
      currentlyProcessed.clear();
      if (!pendingAnimationFrame && overallUpdatePromise) {
        overallUpdatePromise.resolve();
        overallUpdatePromise = null;
      }
    }
  });
}
export class WidgetElement extends HTMLElement {
  #widgetClass;
  #widgetParams;
  createWidget() {
    const widget2 = this.#instantiateWidget();
    if (this.#widgetParams) {
      Object.assign(widget2, this.#widgetParams);
    }
    widget2.requestUpdate();
    return widget2;
  }
  #instantiateWidget() {
    if (!this.#widgetClass) {
      throw new Error("No widgetClass defined");
    }
    if (Widget.isPrototypeOf(this.#widgetClass)) {
      const ctor = this.#widgetClass;
      return new ctor(this);
    }
    const factory = this.#widgetClass;
    return factory(this);
  }
  set widgetConfig(config) {
    const widget2 = Widget.get(this);
    if (widget2 && config.widgetParams) {
      let needsUpdate = false;
      for (const key in config.widgetParams) {
        if (Object.prototype.hasOwnProperty.call(config.widgetParams, key) && config.widgetParams[key] !== this.#widgetParams?.[key]) {
          widget2[key] = config.widgetParams[key];
          needsUpdate = true;
        }
      }
      if (needsUpdate) {
        widget2.requestUpdate();
      }
    }
    this.#widgetClass = config.widgetClass;
    this.#widgetParams = config.widgetParams;
  }
  getWidget() {
    return Widget.get(this);
  }
  connectedCallback() {
    const widget2 = Widget.getOrCreateWidget(this);
    if (!widget2.element.parentElement) {
      widget2.markAsRoot();
    }
    widget2.show(
      this.parentElement,
      void 0,
      /* suppressOrphanWidgetError= */
      true
    );
  }
  disconnectedCallback() {
    const widget2 = Widget.get(this);
    if (widget2) {
      widget2.setHideOnDetach();
      widget2.detach();
    }
  }
  appendChild(child) {
    if (child instanceof HTMLElement && child.tagName !== "STYLE") {
      Widget.getOrCreateWidget(child).show(this);
      return child;
    }
    return super.appendChild(child);
  }
  insertBefore(child, referenceChild) {
    if (child instanceof HTMLElement && child.tagName !== "STYLE") {
      Widget.getOrCreateWidget(child).show(this, referenceChild, true);
      return child;
    }
    return super.insertBefore(child, referenceChild);
  }
  removeChild(child) {
    const childWidget = Widget.get(child);
    if (childWidget) {
      childWidget.detach();
      return child;
    }
    return super.removeChild(child);
  }
  removeChildren() {
    for (const child of this.children) {
      const childWidget = Widget.get(child);
      if (childWidget) {
        childWidget.detach();
      }
    }
    super.removeChildren();
  }
  cloneNode(deep) {
    const clone = cloneCustomElement(this, deep);
    if (!this.#widgetClass) {
      throw new Error("No widgetClass defined");
    }
    clone.widgetConfig = {
      widgetClass: this.#widgetClass,
      widgetParams: this.#widgetParams
    };
    return clone;
  }
  focus() {
    const widget2 = Widget.get(this);
    if (widget2) {
      widget2.focus();
    }
  }
}
customElements.define("devtools-widget", WidgetElement);
export class WidgetDirective extends Lit.Directive.Directive {
  #partType;
  constructor(partInfo) {
    super(partInfo);
    this.#partType = partInfo.type;
    if (this.#partType !== Lit.Directive.PartType.CHILD && this.#partType !== Lit.Directive.PartType.ELEMENT) {
      throw new Error("Widget directive must be used as a child or element directive.");
    }
  }
  update(part, [widgetClass, widgetParams]) {
    if (this.#partType === Lit.Directive.PartType.ELEMENT) {
      const element = part.element;
      if (!(element instanceof WidgetElement)) {
        throw new Error("Widget directive must be used on a devtools-widget element.");
      }
      element.widgetConfig = widgetConfig(widgetClass, widgetParams);
      return Lit.nothing;
    }
    return this.render(widgetClass, widgetParams);
  }
  render(widgetClass, widgetParams) {
    if (this.#partType === Lit.Directive.PartType.ELEMENT) {
      return Lit.nothing;
    }
    return Lit.Directives.repeat(
      [widgetClass],
      () => widgetClass,
      () => html`<devtools-widget .widgetConfig=${widgetConfig(widgetClass, widgetParams)}></devtools-widget>`
    );
  }
}
export const widget = Lit.Directive.directive(WidgetDirective);
export function widgetRef(type, callback) {
  return Lit.Directives.ref((e) => {
    if (!(e instanceof HTMLElement)) {
      return;
    }
    const widget2 = Widget.getOrCreateWidget(e);
    if (!(widget2 instanceof type)) {
      throw new Error(`Expected an element with a widget of type ${type.name} but got ${e?.constructor?.name}`);
    }
    callback(widget2);
  });
}
const widgetCounterMap = /* @__PURE__ */ new WeakMap();
const widgetMap = /* @__PURE__ */ new WeakMap();
function incrementWidgetCounter(parentElement, childElement) {
  const count = (widgetCounterMap.get(childElement) || 0) + (widgetMap.get(childElement) ? 1 : 0);
  for (let el = parentElement; el; el = el.parentElementOrShadowHost()) {
    widgetCounterMap.set(el, (widgetCounterMap.get(el) || 0) + count);
  }
}
function decrementWidgetCounter(parentElement, childElement) {
  const count = (widgetCounterMap.get(childElement) || 0) + (widgetMap.get(childElement) ? 1 : 0);
  for (let el = parentElement; el; el = el.parentElementOrShadowHost()) {
    const elCounter = widgetCounterMap.get(el);
    if (elCounter) {
      widgetCounterMap.set(el, elCounter - count);
    }
  }
}
const UPDATE_COMPLETE = Promise.resolve();
export class Widget {
  element;
  contentElement;
  #shadowRoot;
  #visible = false;
  #isRoot = false;
  #isShowing = false;
  #children = [];
  #hideOnDetach = false;
  #notificationDepth = 0;
  #invalidationsSuspended = 0;
  #parentWidget = null;
  #cachedConstraints;
  #constraints;
  #invalidationsRequested;
  #externallyManaged;
  #updateComplete = UPDATE_COMPLETE;
  #updateController;
  constructor(elementOrOptions, options) {
    if (elementOrOptions instanceof HTMLElement) {
      this.element = elementOrOptions;
    } else {
      this.element = document.createElement("div");
      if (elementOrOptions !== void 0) {
        options = elementOrOptions;
      }
    }
    this.#shadowRoot = this.element.shadowRoot;
    if (options?.useShadowDom && !this.#shadowRoot) {
      this.element.classList.add("vbox");
      this.element.classList.add("flex-auto");
      this.#shadowRoot = createShadowRootWithCoreStyles(this.element, {
        delegatesFocus: options?.delegatesFocus
      });
      this.contentElement = document.createElement("div");
      this.#shadowRoot.appendChild(this.contentElement);
    } else {
      this.contentElement = this.element;
    }
    if (options?.classes) {
      this.element.classList.add(...options.classes);
    }
    if (options?.jslog) {
      this.contentElement.setAttribute("jslog", options.jslog);
    }
    this.contentElement.classList.add("widget");
    widgetMap.set(this.element, this);
  }
  /**
   * Returns the {@link Widget} whose element is the given `node`, or `undefined`
   * if the `node` is not an element for a widget.
   *
   * @param node a DOM node.
   * @returns the {@link Widget} that is attached to the `node` or `undefined`.
   */
  static get(node) {
    return widgetMap.get(node);
  }
  static get allUpdatesComplete() {
    if (!pendingAnimationFrame && !currentUpdateQueue) {
      return Promise.resolve();
    }
    if (!overallUpdatePromise) {
      overallUpdatePromise = Promise.withResolvers();
    }
    return overallUpdatePromise.promise;
  }
  static getOrCreateWidget(element) {
    const widget2 = Widget.get(element);
    if (widget2) {
      return widget2;
    }
    if (element instanceof WidgetElement) {
      return element.createWidget();
    }
    return new Widget(element);
  }
  markAsRoot() {
    assert(!this.element.parentElement, "Attempt to mark as root attached node");
    this.#isRoot = true;
  }
  parentWidget() {
    return this.#parentWidget;
  }
  children() {
    return this.#children;
  }
  childWasDetached(_widget) {
  }
  isShowing() {
    return this.#isShowing;
  }
  shouldHideOnDetach() {
    if (!this.element.parentElement) {
      return false;
    }
    if (this.#hideOnDetach) {
      return true;
    }
    for (const child of this.#children) {
      if (child.shouldHideOnDetach()) {
        return true;
      }
    }
    return false;
  }
  setHideOnDetach() {
    this.#hideOnDetach = true;
  }
  inNotification() {
    return Boolean(this.#notificationDepth) || Boolean(this.#parentWidget?.inNotification());
  }
  parentIsShowing() {
    if (this.#isRoot) {
      return true;
    }
    return this.#parentWidget?.isShowing() ?? false;
  }
  callOnVisibleChildren(method) {
    const copy = this.#children.slice();
    for (let i = 0; i < copy.length; ++i) {
      if (copy[i].#parentWidget === this && copy[i].#visible) {
        method.call(copy[i]);
      }
    }
  }
  processWillShow() {
    this.callOnVisibleChildren(this.processWillShow);
    this.#isShowing = true;
  }
  processWasShown() {
    if (this.inNotification()) {
      return;
    }
    this.restoreScrollPositions();
    this.notify(this.wasShown);
    this.callOnVisibleChildren(this.processWasShown);
  }
  processWillHide() {
    if (this.inNotification()) {
      return;
    }
    this.storeScrollPositions();
    this.callOnVisibleChildren(this.processWillHide);
    this.notify(this.willHide);
    this.#isShowing = false;
  }
  processWasHidden() {
    this.callOnVisibleChildren(this.processWasHidden);
    this.notify(this.wasHidden);
  }
  processOnResize() {
    if (this.inNotification()) {
      return;
    }
    if (!this.isShowing()) {
      return;
    }
    this.notify(this.onResize);
    this.callOnVisibleChildren(this.processOnResize);
  }
  notify(notification) {
    ++this.#notificationDepth;
    try {
      notification.call(this);
    } finally {
      --this.#notificationDepth;
    }
  }
  wasShown() {
  }
  willHide() {
  }
  wasHidden() {
  }
  onResize() {
  }
  onLayout() {
  }
  onDetach() {
  }
  async ownerViewDisposed() {
  }
  show(parentElement, insertBefore, suppressOrphanWidgetError = false) {
    assert(parentElement, "Attempt to attach widget with no parent element");
    if (!this.#isRoot) {
      let currentParent = parentElement;
      let currentWidget = void 0;
      while (!currentWidget) {
        if (!currentParent) {
          if (suppressOrphanWidgetError) {
            this.#isRoot = true;
            this.show(parentElement, insertBefore);
            return;
          }
          throw new Error("Attempt to attach widget to orphan node");
        }
        currentWidget = widgetMap.get(currentParent);
        currentParent = currentParent.parentElementOrShadowHost();
      }
      this.attach(currentWidget);
    }
    this.#showWidget(parentElement, insertBefore);
  }
  attach(parentWidget) {
    if (parentWidget === this.#parentWidget) {
      return;
    }
    if (this.#parentWidget) {
      this.detach();
    }
    this.#parentWidget = parentWidget;
    this.#parentWidget.#children.push(this);
    this.#isRoot = false;
  }
  showWidget() {
    if (this.#visible) {
      return;
    }
    if (!this.element.parentElement) {
      throw new Error("Attempt to show widget that is not hidden using hideWidget().");
    }
    this.#showWidget(this.element.parentElement, this.element.nextSibling);
  }
  #showWidget(parentElement, insertBefore) {
    let currentParent = parentElement;
    while (currentParent && !widgetMap.get(currentParent)) {
      currentParent = currentParent.parentElementOrShadowHost();
    }
    if (this.#isRoot) {
      assert(!currentParent, "Attempt to show root widget under another widget");
    } else {
      assert(
        currentParent && widgetMap.get(currentParent) === this.#parentWidget,
        "Attempt to show under node belonging to alien widget"
      );
    }
    const wasVisible = this.#visible;
    if (wasVisible && this.element.parentElement === parentElement) {
      return;
    }
    this.#visible = true;
    if (!wasVisible && this.parentIsShowing()) {
      this.processWillShow();
    }
    this.element.classList.remove("hidden");
    if (this.element.parentElement !== parentElement) {
      if (!this.#externallyManaged) {
        incrementWidgetCounter(parentElement, this.element);
      }
      if (insertBefore) {
        originalInsertBefore.call(parentElement, this.element, insertBefore);
      } else {
        originalAppendChild.call(parentElement, this.element);
      }
    }
    const focusedElementsCount = this.#parentWidget?.getDefaultFocusedElements?.()?.length ?? 0;
    if (this.element.hasAttribute("autofocus") && focusedElementsCount > 1) {
      this.element.removeAttribute("autofocus");
    }
    if (!wasVisible && this.parentIsShowing()) {
      this.processWasShown();
    }
    if (this.#parentWidget && this.hasNonZeroConstraints()) {
      this.#parentWidget.invalidateConstraints();
    } else {
      this.processOnResize();
    }
  }
  hideWidget() {
    if (!this.#visible) {
      return;
    }
    this.#hideWidget(false);
  }
  #hideWidget(removeFromDOM) {
    this.#visible = false;
    const { parentElement } = this.element;
    if (this.parentIsShowing()) {
      this.processWillHide();
    }
    if (removeFromDOM) {
      if (parentElement) {
        decrementWidgetCounter(parentElement, this.element);
        originalRemoveChild.call(parentElement, this.element);
      }
      this.onDetach();
    } else {
      this.element.classList.add("hidden");
    }
    if (this.parentIsShowing()) {
      this.processWasHidden();
    }
    if (this.#parentWidget && this.hasNonZeroConstraints()) {
      this.#parentWidget.invalidateConstraints();
    }
  }
  detach(overrideHideOnDetach) {
    if (!this.#parentWidget && !this.#isRoot) {
      return;
    }
    cancelUpdate(this);
    const removeFromDOM = overrideHideOnDetach || !this.shouldHideOnDetach();
    if (this.#visible) {
      this.#hideWidget(removeFromDOM);
    } else if (removeFromDOM) {
      const { parentElement } = this.element;
      if (parentElement) {
        decrementWidgetCounter(parentElement, this.element);
        originalRemoveChild.call(parentElement, this.element);
      }
    }
    if (this.#parentWidget) {
      const childIndex = this.#parentWidget.#children.indexOf(this);
      assert(childIndex >= 0, "Attempt to remove non-child widget");
      this.#parentWidget.#children.splice(childIndex, 1);
      this.#parentWidget.childWasDetached(this);
      this.#parentWidget = null;
    } else {
      assert(this.#isRoot, "Removing non-root widget from DOM");
    }
  }
  detachChildWidgets() {
    const children = this.#children.slice();
    for (let i = 0; i < children.length; ++i) {
      children[i].detach();
    }
  }
  elementsToRestoreScrollPositionsFor() {
    return [this.element];
  }
  storeScrollPositions() {
    const elements = this.elementsToRestoreScrollPositionsFor();
    for (const container of elements) {
      storedScrollPositions.set(container, { scrollLeft: container.scrollLeft, scrollTop: container.scrollTop });
    }
  }
  restoreScrollPositions() {
    const elements = this.elementsToRestoreScrollPositionsFor();
    for (const container of elements) {
      const storedPositions = storedScrollPositions.get(container);
      if (storedPositions) {
        container.scrollLeft = storedPositions.scrollLeft;
        container.scrollTop = storedPositions.scrollTop;
      }
    }
  }
  doResize() {
    if (!this.isShowing()) {
      return;
    }
    if (!this.inNotification()) {
      this.callOnVisibleChildren(this.processOnResize);
    }
  }
  doLayout() {
    if (!this.isShowing()) {
      return;
    }
    this.notify(this.onLayout);
    this.doResize();
  }
  registerRequiredCSS(...cssFiles) {
    for (const cssFile of cssFiles) {
      appendStyle(this.#shadowRoot ?? this.element, cssFile);
    }
  }
  // Unused, but useful for debugging.
  printWidgetHierarchy() {
    const lines = [];
    this.collectWidgetHierarchy("", lines);
    console.log(lines.join("\n"));
  }
  collectWidgetHierarchy(prefix, lines) {
    lines.push(prefix + "[" + this.element.className + "]" + (this.#children.length ? " {" : ""));
    for (let i = 0; i < this.#children.length; ++i) {
      this.#children[i].collectWidgetHierarchy(prefix + "    ", lines);
    }
    if (this.#children.length) {
      lines.push(prefix + "}");
    }
  }
  setDefaultFocusedElement(element) {
    const defaultFocusedElement = this.getDefaultFocusedElement();
    if (defaultFocusedElement) {
      defaultFocusedElement.removeAttribute("autofocus");
    }
    if (element) {
      element.setAttribute("autofocus", "");
    }
  }
  setDefaultFocusedChild(child) {
    assert(child.#parentWidget === this, "Attempt to set non-child widget as default focused.");
    const defaultFocusedElement = this.getDefaultFocusedElement();
    if (defaultFocusedElement) {
      defaultFocusedElement.removeAttribute("autofocus");
    }
    child.element.setAttribute("autofocus", "");
  }
  getDefaultFocusedElements() {
    const autofocusElements = [...this.contentElement.querySelectorAll("[autofocus]")];
    if (this.contentElement !== this.element) {
      if (this.contentElement.hasAttribute("autofocus")) {
        autofocusElements.push(this.contentElement);
      }
      if (autofocusElements.length === 0) {
        autofocusElements.push(...this.element.querySelectorAll("[autofocus]"));
      }
    }
    return autofocusElements.filter((autofocusElement) => {
      let widgetElement = autofocusElement;
      while (widgetElement) {
        const widget2 = Widget.get(widgetElement);
        if (widget2) {
          if (widgetElement === autofocusElement && widget2.#parentWidget === this && widget2.#visible) {
            return true;
          }
          return widget2 === this;
        }
        widgetElement = widgetElement.parentElementOrShadowHost();
      }
      return false;
    });
  }
  getDefaultFocusedElement() {
    const elements = this.getDefaultFocusedElements();
    if (elements.length > 1) {
      console.error(
        "Multiple autofocus elements found",
        this.constructor.name,
        ...elements.map((e) => Platform.StringUtilities.trimMiddle(e.outerHTML, 250))
      );
    }
    return elements[0] || null;
  }
  focus() {
    if (!this.isShowing()) {
      return;
    }
    const autofocusElement = this.getDefaultFocusedElement();
    if (autofocusElement) {
      const widget2 = Widget.get(autofocusElement);
      if (widget2 && widget2 !== this) {
        widget2.focus();
      } else if (autofocusElement === this.element && autofocusElement instanceof WidgetElement) {
        HTMLElement.prototype.focus.call(autofocusElement);
      } else {
        autofocusElement.focus();
      }
      return;
    }
    for (const child of this.#children) {
      if (child.#visible) {
        child.focus();
        return;
      }
    }
    if (this.element === this.contentElement && this.element.hasAttribute("autofocus")) {
      if (this.element instanceof WidgetElement) {
        HTMLElement.prototype.focus.call(this.element);
      } else {
        this.element.focus();
      }
    }
  }
  hasFocus() {
    return this.element.hasFocus();
  }
  calculateConstraints() {
    return new Geometry.Constraints();
  }
  constraints() {
    if (typeof this.#constraints !== "undefined") {
      return this.#constraints;
    }
    if (typeof this.#cachedConstraints === "undefined") {
      this.#cachedConstraints = this.calculateConstraints();
    }
    return this.#cachedConstraints;
  }
  setMinimumAndPreferredSizes(width, height, preferredWidth, preferredHeight) {
    this.#constraints = new Geometry.Constraints(new Geometry.Size(width, height), new Geometry.Size(preferredWidth, preferredHeight));
    this.invalidateConstraints();
  }
  setMinimumSize(width, height) {
    this.minimumSize = new Geometry.Size(width, height);
  }
  set minimumSize(size) {
    this.#constraints = new Geometry.Constraints(size);
    this.invalidateConstraints();
  }
  hasNonZeroConstraints() {
    const constraints = this.constraints();
    return Boolean(
      constraints.minimum.width || constraints.minimum.height || constraints.preferred.width || constraints.preferred.height
    );
  }
  suspendInvalidations() {
    ++this.#invalidationsSuspended;
  }
  resumeInvalidations() {
    --this.#invalidationsSuspended;
    if (!this.#invalidationsSuspended && this.#invalidationsRequested) {
      this.invalidateConstraints();
    }
  }
  invalidateConstraints() {
    if (this.#invalidationsSuspended) {
      this.#invalidationsRequested = true;
      return;
    }
    this.#invalidationsRequested = false;
    const cached = this.#cachedConstraints;
    this.#cachedConstraints = void 0;
    const actual = this.constraints();
    if (!actual.isEqual(cached || null) && this.#parentWidget) {
      this.#parentWidget.invalidateConstraints();
    } else {
      this.doLayout();
    }
  }
  // Excludes the widget from being tracked by its parents/ancestors via
  // widgetCounter because the widget is being handled by external code.
  // Widgets marked as being externally managed are responsible for
  // finishing out their own lifecycle (i.e. calling detach() before being
  // removed from the DOM). This is e.g. used for CodeMirror.
  //
  // Also note that this must be called before the widget is shown so that
  // so that its ancestor's widgetCounter is not incremented.
  markAsExternallyManaged() {
    assert(!this.#parentWidget, "Attempt to mark widget as externally managed after insertion to the DOM");
    this.#externallyManaged = true;
  }
  performUpdate(_signal) {
  }
  addUpdateController(controller) {
    this.#updateController = controller;
  }
  cancelUpdateController() {
    this.#updateController?.abort();
  }
  /**
   * Schedules an asynchronous update for this widget.
   *
   * The update will be deduplicated and executed with the next animation
   * frame.
   */
  requestUpdate() {
    this.#updateController?.abort();
    this.#updateComplete = enqueueWidgetUpdate(this);
  }
  /**
   * The `updateComplete` promise resolves when the widget has finished updating.
   *
   * Use `updateComplete` to wait for an update:
   * ```js
   * await widget.updateComplete;
   * // do stuff
   * ```
   *
   * This method is primarily useful for unit tests, to wait for widgets to build
   * their DOM. For example:
   * ```js
   * // Set up the test widget, and wait for the initial update cycle to complete.
   * const widget = new SomeWidget(someData);
   * widget.requestUpdate();
   * await widget.updateComplete;
   *
   * // Assert state of the widget.
   * assert.isTrue(widget.someDataLoaded);
   * ```
   *
   * @returns a promise that resolves when the widget has finished updating.
   */
  get updateComplete() {
    return this.#updateComplete;
  }
}
const storedScrollPositions = /* @__PURE__ */ new WeakMap();
export class VBox extends Widget {
  constructor() {
    super(...arguments);
    this.contentElement.classList.add("vbox");
  }
  calculateConstraints() {
    let constraints = new Geometry.Constraints();
    function updateForChild() {
      const child = this.constraints();
      constraints = constraints.widthToMax(child);
      constraints = constraints.addHeight(child);
    }
    this.callOnVisibleChildren(updateForChild);
    return constraints;
  }
}
export class HBox extends Widget {
  constructor() {
    super(...arguments);
    this.contentElement.classList.add("hbox");
  }
  calculateConstraints() {
    let constraints = new Geometry.Constraints();
    function updateForChild() {
      const child = this.constraints();
      constraints = constraints.addWidth(child);
      constraints = constraints.heightToMax(child);
    }
    this.callOnVisibleChildren(updateForChild);
    return constraints;
  }
}
export class VBoxWithResizeCallback extends VBox {
  resizeCallback;
  constructor(resizeCallback) {
    super();
    this.resizeCallback = resizeCallback;
  }
  onResize() {
    this.resizeCallback();
  }
}
export class WidgetFocusRestorer {
  widget;
  previous;
  constructor(widget2) {
    this.widget = widget2;
    this.previous = deepActiveElement(widget2.element.ownerDocument);
    widget2.focus();
  }
  restore() {
    if (!this.widget) {
      return;
    }
    if (this.widget.hasFocus() && this.previous) {
      this.previous.focus();
    }
    this.previous = null;
    this.widget = null;
  }
}
function domOperationError(funcName) {
  return new Error(`Attempt to modify widget with native DOM method \`${funcName}\``);
}
Element.prototype.appendChild = function(node) {
  if (widgetMap.get(node) && node.parentElement !== this) {
    throw domOperationError("appendChild");
  }
  return originalAppendChild.call(this, node);
};
Element.prototype.insertBefore = function(node, child) {
  if (widgetMap.get(node) && node.parentElement !== this) {
    throw domOperationError("insertBefore");
  }
  return originalInsertBefore.call(this, node, child);
};
Element.prototype.removeChild = function(child) {
  if (widgetCounterMap.get(child) || widgetMap.get(child)) {
    throw domOperationError("removeChild");
  }
  return originalRemoveChild.call(this, child);
};
Element.prototype.removeChildren = function() {
  if (widgetCounterMap.get(this)) {
    throw domOperationError("removeChildren");
  }
  return originalRemoveChildren.call(this);
};
//# sourceMappingURL=Widget.js.map
