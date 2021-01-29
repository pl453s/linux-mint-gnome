const Main = imports.ui.main;
let appMenu = Main.panel.statusArea.appMenu;

class Extension {
  constructor() {
    this.monitorsChangedEvent = null;
    this.showEvent = null;
  }

  _hideMenu() {
    //Hide the menu if available
    if(appMenu != null) {
      appMenu.hide();
    }
  }

  enable() {
    //Hide menu when something attempts to show it or the ui is reloaded
    this.monitorsChangedEvent = Main.layoutManager.connect('monitors-changed', this._hideMenu);
    this.showEvent = appMenu.connect('show', this._hideMenu);
    //Hide appMenu
    this._hideMenu();
  }

  disable() {
    //Disconnect hiding the app menu from events and show it again
    appMenu.disconnect(this.monitorsChangedEvent);
    appMenu.disconnect(this.showEvent);
    //Show appMenu, if available
    if(appMenu != null) {
      appMenu.show();
    }
  }
}

function init() {
  return new Extension();
}
