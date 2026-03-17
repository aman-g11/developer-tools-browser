"use strict";
import * as UI from "../../ui/legacy/legacy.js";
import { IssuesPane } from "./IssuesPane.js";
export class IssueRevealer {
  async reveal(issue) {
    await UI.ViewManager.ViewManager.instance().showView("issues-pane");
    const view = UI.ViewManager.ViewManager.instance().view("issues-pane");
    if (view) {
      const issuesPane = await view.widget();
      if (issuesPane instanceof IssuesPane) {
        await issuesPane.reveal(issue);
      } else {
        throw new Error("Expected issues pane to be an instance of IssuesPane");
      }
    }
  }
}
//# sourceMappingURL=IssueRevealer.js.map
