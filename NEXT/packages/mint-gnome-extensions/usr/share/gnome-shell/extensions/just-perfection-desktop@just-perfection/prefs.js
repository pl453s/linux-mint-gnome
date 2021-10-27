/**
 * Prefs Dialog
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2021
 * @license    GNU General Public License v3.0
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Prefs} = Me.imports.lib;
const {Gtk, Gio, GObject} = imports.gi;

const Config = imports.misc.config;
const shellVersion = parseFloat(Config.PACKAGE_VERSION);


/**
 * prefs initiation
 *
 * @returns {void}
 */
function init()
{
    ExtensionUtils.initTranslations();
}

/**
 * prefs widget
 *
 * @returns {Gtk.Widget}
 */
function buildPrefsWidget()
{
    let gettextDomain = Me.metadata['gettext-domain'];
    let UIFilePath = Me.dir.get_child('ui/prefs.ui').get_path();
    let binFolderPath = Me.dir.get_child('bin').get_path();

    let builder = new Gtk.Builder();
    let settings = ExtensionUtils.getSettings();
    let prefs = new Prefs.Prefs({
        Builder: builder,
        Settings: settings,
        GObjectBindingFlags: GObject.BindingFlags,
        Gtk,
        Gio,
    }, shellVersion);

    return prefs.getMainPrefs(UIFilePath, binFolderPath, gettextDomain);
}

