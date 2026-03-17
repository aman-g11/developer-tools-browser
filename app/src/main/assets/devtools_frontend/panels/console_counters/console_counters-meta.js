import*as r from"./../../ui/legacy/legacy.js";var o;async function n(){return o||(o=await import("./console_counters.js")),o}r.Toolbar.registerToolbarItem({async loadItem(){return(await n()).WarningErrorCounter.WarningErrorCounter.instance()},order:1,location:r.Toolbar.ToolbarItemLocation.MAIN_TOOLBAR_RIGHT});
//# sourceMappingURL=console_counters-meta.js.map
