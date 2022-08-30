const mod = imports.misc.extensionUtils.getCurrentExtension().imports.src.mod

const Main = imports.ui.main

var Mod = class extends mod.Base {
    enable() {
        Main.layoutManager.startInOverview = false;
    }

    disable() {
    }
}
