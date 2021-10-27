/**
 * Extension
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2021
 * @license    GNU General Public License v3.0
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {API, Manager, HotCorner} = Me.imports.lib;
const {GLib, Gio, St, Clutter, Meta} = imports.gi;

const Util = imports.misc.util;
const Config = imports.misc.config;
const shellVersion = parseFloat(Config.PACKAGE_VERSION);

const Main = imports.ui.main;
const BackgroundMenu = imports.ui.backgroundMenu;
const OverviewControls = imports.ui.overviewControls;
const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const ViewSelector = (shellVersion < 40) ? imports.ui.viewSelector : null;
const WorkspaceThumbnail = imports.ui.workspaceThumbnail;
const SearchController = (shellVersion >= 40) ? imports.ui.searchController : null;
const Panel = imports.ui.panel;
const WorkspacesView = imports.ui.workspacesView;
const WindowPreview = (shellVersion >= 3.38) ? imports.ui.windowPreview : null;
const Workspace = imports.ui.workspace;
const LookingGlass = imports.ui.lookingGlass;

let manager;
let api;

/**
 * initiate extension
 *
 * @returns {void}
 */
function init()
{
}

/**
 * enable extension
 *
 * @returns {void}
 */
function enable()
{
    // <3.36 can crash by enabling the extension
    // since <3.36 is not supported we simply return
    // to avoid bad experience for <3.36 users.
    if (shellVersion < 3.36) {
        return;
    }

    let InterfaceSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});

    api = new API.API({
        Main,
        BackgroundMenu,
        OverviewControls,
        WorkspaceSwitcherPopup,
        InterfaceSettings,
        SearchController,
        ViewSelector,
        WorkspaceThumbnail,
        WorkspacesView,
        Panel,
        WindowPreview,
        Workspace,
        LookingGlass,
        St,
        Gio,
        GLib,
        Clutter,
        Util,
        Meta,
    }, shellVersion);

    api.open();

    let settings = ExtensionUtils.getSettings();
    let hotCorner = new HotCorner.HotCorner({API: api, St});

    manager = new Manager.Manager({
        API: api,
        Settings: settings,
        HotCorner: hotCorner,
        InterfaceSettings,
    }, shellVersion);

    manager.registerSettingsSignals();
    manager.applyAll();
}

/**
 * disable extension
 *
 * @returns {void}
 */
function disable()
{
    if (manager) {
        manager.revertAll();
        manager = null;
    }

    if (api) {
        api.close();
    }
}

