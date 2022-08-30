const mod = imports.misc.extensionUtils.getCurrentExtension().imports.src.mod

const Main = imports.ui.main

var Mod = class extends mod.Base {
    enable() {
        this.signalShow=Main.panel.statusArea.appMenu.actor.connect("show",function () {
            Main.panel.statusArea.appMenu.actor.hide();
        });
        Main.panel.statusArea.appMenu.actor.hide();
    }

    disable() {
        Main.panel.statusArea.appMenu.actor.disconnect(this.signalShow);
        Main.panel.statusArea.appMenu.actor.show();
    }
}
