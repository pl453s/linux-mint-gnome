const mod = imports.misc.extensionUtils.getCurrentExtension().imports.src.mod

const Main = imports.ui.main

var Mod = class extends mod.Base {
    enable() {
        this.signalShow=Main.panel.statusArea.activities.actor.connect("show",function () {
            Main.panel.statusArea.activities.actor.hide();
        });
        Main.panel.statusArea.activities.actor.hide();
    }

    disable() {
        Main.panel.statusArea.activities.actor.disconnect(this.signalShow);
        Main.panel.statusArea.activities.actor.show();
    }
}
