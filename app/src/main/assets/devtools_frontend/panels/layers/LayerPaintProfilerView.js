"use strict";
import * as UI from "../../ui/legacy/legacy.js";
import * as VisualLogging from "../../ui/visual_logging/visual_logging.js";
import * as LayerViewer from "../layer_viewer/layer_viewer.js";
export class LayerPaintProfilerView extends UI.SplitWidget.SplitWidget {
  logTreeView;
  paintProfilerView;
  constructor(showImageCallback) {
    super(true, false);
    this.element.setAttribute("jslog", `${VisualLogging.pane("layers.paint-profiler").track({ resize: true })}`);
    this.logTreeView = new LayerViewer.PaintProfilerView.PaintProfilerCommandLogView();
    this.setSidebarWidget(this.logTreeView);
    this.paintProfilerView = new LayerViewer.PaintProfilerView.PaintProfilerView(showImageCallback);
    this.setMainWidget(this.paintProfilerView);
    this.paintProfilerView.addEventListener(
      LayerViewer.PaintProfilerView.Events.WINDOW_CHANGED,
      this.onWindowChanged,
      this
    );
    this.logTreeView.focus();
  }
  reset() {
    void this.paintProfilerView.setSnapshotAndLog(null, [], null);
  }
  profile(snapshot) {
    void snapshot.commandLog().then((log) => setSnapshotAndLog.call(this, snapshot, log));
    function setSnapshotAndLog(snapshot2, log) {
      this.logTreeView.setCommandLog(log || []);
      void this.paintProfilerView.setSnapshotAndLog(snapshot2, log || [], null);
      if (snapshot2) {
        snapshot2.release();
      }
    }
  }
  setScale(scale) {
    this.paintProfilerView.setScale(scale);
  }
  onWindowChanged() {
    this.logTreeView.updateWindow(this.paintProfilerView.selectionWindow());
  }
}
//# sourceMappingURL=LayerPaintProfilerView.js.map
