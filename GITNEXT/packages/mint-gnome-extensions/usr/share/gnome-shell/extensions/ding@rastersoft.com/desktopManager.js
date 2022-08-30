/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright (C) 2019 Sergio Costas (rastersoft@gmail.com)
 * Based on code original (C) Carlos Soriano
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Gio = imports.gi.Gio;

const FileItem = imports.fileItem;
const DesktopGrid = imports.desktopGrid;
const DesktopIconsUtil = imports.desktopIconsUtil;
const Prefs = imports.preferences;
const Enums = imports.enums;
const DBusUtils = imports.dbusUtils;
const AskRenamePopup = imports.askRenamePopup;
const ShowErrorPopup = imports.showErrorPopup;
const TemplatesScriptsManager = imports.templatesScriptsManager;
const Thumbnails = imports.thumbnails;
const FileItemMenu = imports.fileItemMenu;

const Gettext = imports.gettext.domain('ding');

const _ = Gettext.gettext;

var DesktopManager = class {
    constructor(mainApp, desktopList, codePath, asDesktop, primaryIndex) {

        this.mainApp = mainApp;

        this._premultiplied = false;
        try {
            for (let f of Prefs.mutterSettings.get_strv('experimental-features')) {
                if (f == 'scale-monitor-framebuffer') {
                    this._premultiplied = true;
                    break;
                }
            }
        } catch(e) {
        }

        this.templatesMonitor = new TemplatesScriptsManager.TemplatesScriptsManager(
            DesktopIconsUtil.getTemplatesDir(),
            TemplatesScriptsManager.TemplatesScriptsManagerFlags.NONE,
            this._newDocument.bind(this));

        this._primaryIndex = primaryIndex;
        this._primaryScreen = desktopList[primaryIndex];
        this._clickX = 0;
        this._clickY = 0;
        this._dragList = null;
        this.dragItem = null;
        this.thumbnailLoader = new Thumbnails.ThumbnailLoader(codePath);
        this._codePath = codePath;
        this._asDesktop = asDesktop;
        this._desktopList = desktopList;
        this._desktops = [];
        this._desktopFilesChanged = false;
        this._readingDesktopFiles = false;
        this._desktopDir = DesktopIconsUtil.getDesktopDir();
        this.desktopFsId = this._desktopDir.query_info('id::filesystem', Gio.FileQueryInfoFlags.NONE, null).get_attribute_string('id::filesystem');
        this._updateWritableByOthers();
        this._monitorDesktopDir = this._desktopDir.monitor_directory(Gio.FileMonitorFlags.WATCH_MOVES, null);
        this._monitorDesktopDir.set_rate_limit(1000);
        this._monitorDesktopDir.connect('changed', (obj, file, otherFile, eventType) => this._updateDesktopIfChanged(file, otherFile, eventType));

        this.fileItemMenu = new FileItemMenu.FileItemMenu(this);

        this._showHidden = Prefs.gtkSettings.get_boolean('show-hidden');
        this.showDropPlace = Prefs.desktopSettings.get_boolean('show-drop-place');
        this._settingsId = Prefs.desktopSettings.connect('changed', (obj, key) => {
            if (key == 'icon-size') {
                this._removeAllFilesFromGrids();
                this._createGrids();
            }
            if (key == Enums.SortOrder.ORDER) {
                this.doArrangeRadioButtons();
                this.doSorts(true);
                return;
            }
            this.showDropPlace = Prefs.desktopSettings.get_boolean('show-drop-place');
            this._updateDesktop().catch((e) => {
                print(`Exception while updating Desktop after Settings Changed: ${e.message}\n${e.stack}`);
            });
        });
        Prefs.gtkSettings.connect('changed', (obj, key) => {
            if (key == 'show-hidden') {
                this._showHidden = Prefs.gtkSettings.get_boolean('show-hidden');
                this._updateDesktop().catch((e) => {
                    print(`Exception while updating Desktop after Hidden Settings Changed: ${e.message}\n${e.stack}`);
                });
            }
        });
        Prefs.nautilusSettings.connect('changed', (obj, key) => {
            if (key == 'show-image-thumbnails') {
                this._updateDesktop().catch((e) => {
                    print(`Exception while updating Desktop after Nautilus Settings Changed: ${e.message}\n${e.stack}`);
                });
            }
        });
        this._gtkIconTheme = Gtk.IconTheme.get_default()
        this._gtkIconTheme.connect('changed', () => {
            this._updateDesktop().catch((e) => {
                    print(`Exception while updating Desktop after Gtk Icon Theme Change: ${e.message}\n${e.stack}`);
                });
        });
        this._volumeMonitor = Gio.VolumeMonitor.get();
        this._volumeMonitor.connect('mount-added', () => { this._updateDesktop().catch((e) => {
                print(`Exception while updating Desktop after mount added: ${e.message}\n${e.stack}`);
            });
        });
        this._volumeMonitor.connect('mount-removed', () => { this._updateDesktop().catch((e) => {
                print(`Exception while updating Desktop after mount removed: ${e.message}\n${e.stack}`);
            });
        });

        this.rubberBand = false;

        let cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_file(Gio.File.new_for_path(GLib.build_filenamev([codePath, "stylesheet.css"])));
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), cssProvider, 600);

        this._configureSelectionColor();
        this._createDesktopBackgroundMenu();
        this._createGrids();

        DBusUtils.NautilusFileOperations2Proxy.connect('g-properties-changed', this._undoStatusChanged.bind(this));
        DBusUtils.GtkVfsMetadataProxy.connectSignal('AttributeChanged', this._metadataChanged.bind(this));
        this._fileList = [];
        this._forcedExit = false;
        this._updateDesktop().catch((e) => {
                    print(`Exception while Initiating Desktop: ${e.message}\n${e.stack}`);
        });

        this._scriptsList = [];

        this.ignoreKeys = [Gdk.KEY_Shift_L,Gdk.KEY_Shift_R,Gdk.KEY_Control_L,Gdk.KEY_Control_R,Gdk.KEY_Caps_Lock,Gdk.KEY_Shift_Lock,Gdk.KEY_Meta_L,Gdk.KEY_Meta_R,Gdk.KEY_Alt_L,Gdk.KEY_Alt_R,Gdk.KEY_Super_L,Gdk.KEY_Super_R,Gdk.KEY_ISO_Level3_Shift,Gdk.KEY_ISO_Level5_Shift];


        // Check if Nautilus is available
        try {
            DesktopIconsUtil.trySpawn(null, ["nautilus", "--version"]);
        } catch(e) {
            this._errorWindow = new ShowErrorPopup.ShowErrorPopup(_("Nautilus File Manager not found"),
                                                                  _("The Nautilus File Manager is mandatory to work with Desktop Icons NG."),
                                                                  null,
                                                                  true);
        }
        this._pendingDropFiles = {};
        if (this._asDesktop) {
            this._sigtermID = GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, 15, () => {
                GLib.source_remove(this._sigtermID);
                for(let desktop of this._desktops) {
                    desktop.destroy();
                }
                this._desktops = [];
                this._forcedExit = true;
                if (this._desktopEnumerateCancellable) {
                    this._desktopEnumerateCancellable.cancel();
                }
                return false;
            });
        }
    }

    _metadataChanged(proxy, nameOwner, args) {
        let filepath = GLib.build_filenamev([GLib.get_home_dir(), args[1]]);
        if (this._desktopDir.get_path() == GLib.path_get_dirname(filepath)) {
            for(let file of this._fileList) {
                if (file.file.get_path() == filepath) {
                    file.updatedMetadata();
                    break;
                }
            }
        }
    }

    _createGrids() {
        for(let desktop of this._desktops) {
            desktop.destroy();
        }
        this._desktops = [];
        for(let desktopIndex in this._desktopList) {
            let desktop = this._desktopList[desktopIndex];
            if (this._asDesktop) {
                var desktopName = `@!${desktop.x},${desktop.y};BDHF`;
            } else {
                var desktopName = `DING ${desktopIndex}`;
            }
            this._desktops.push(new DesktopGrid.DesktopGrid(this, desktopName, desktop, this._asDesktop, this._premultiplied));
        }
    }

    _configureSelectionColor() {
        this._contextWidget = new Gtk.WidgetPath();
        this._contextWidget.append_type(Gtk.Widget);

        this._styleContext = new Gtk.StyleContext();
        this._styleContext.set_path(this._contextWidget);
        this._styleContext.add_class('view');
        this._cssProviderSelection = new Gtk.CssProvider();
        this._styleContext.connect('changed', () => {
            Gtk.StyleContext.remove_provider_for_screen(Gdk.Screen.get_default(), this._cssProviderSelection);
            this._setSelectionColor();
        });
        this._setSelectionColor();
    }

    _setSelectionColor() {
        this.selectColor = this._styleContext.get_background_color(Gtk.StateFlags.SELECTED);
        let style = `.desktop-icons-selected {
            background-color: rgba(${this.selectColor.red * 255},${this.selectColor.green * 255}, ${this.selectColor.blue * 255}, 0.6);
        }`;
        this._cssProviderSelection.load_from_data(style);
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), this._cssProviderSelection, 600);
    }

    clearFileCoordinates(fileList, dropCoordinates) {
        for(let element of fileList) {
            let file = Gio.File.new_for_uri(element);
            if (!file.is_native() || !file.query_exists(null)) {
                if (dropCoordinates != null) {
                    this._pendingDropFiles[file.get_basename()] = dropCoordinates;
                }
                continue;
            }
            let info = new Gio.FileInfo();
            info.set_attribute_string('metadata::nautilus-icon-position', '');
            if (dropCoordinates != null) {
                info.set_attribute_string('metadata::nautilus-drop-position', `${dropCoordinates[0]},${dropCoordinates[1]}`);
            }
            try {
                file.set_attributes_from_info(info, Gio.FileQueryInfoFlags.NONE, null);
            } catch(e) {}
        }
    }

    doMoveWithDragAndDrop(xOrigin, yOrigin, xDestination, yDestination) {
        if ( this.sortSpecialFolders && this.keepArranged ) {
            return;
        }
        // Find the grid where the destination lies
        for(let desktop of this._desktops) {
            let grid = desktop.getGridAt(xDestination, yDestination, true);
            if (grid !== null) {
                xDestination = grid[0];
                yDestination = grid[1];
                break;
            }
        }
        let deltaX = xDestination - xOrigin;
        let deltaY = yDestination - yOrigin;
        let fileItems = [];
        for(let item of this._fileList) {
            if (item.isSelected) {
                if (this.keepArranged) {
                    if (item.isSpecial) {
                        fileItems.push(item);
                        item.removeFromGrid(false);
                        let [x, y, a, b, c] = item.getCoordinates();
                        item.savedCoordinates = [x + deltaX, y + deltaY];
                    } else {
                        continue;
                    }
                } else {
                    fileItems.push(item);
                    item.removeFromGrid(false);
                    let [x, y, a, b, c] = item.getCoordinates();
                    item.savedCoordinates = [x + deltaX, y + deltaY];
                }
            }
        }
        // force to store the new coordinates
        this._addFilesToDesktop(fileItems, Enums.StoredCoordinates.OVERWRITE);
        if (this.keepArranged) {
            this._updateDesktop().catch((e) => {
                print(`Exception while doing move with drag and drop and keeping arranged: ${e.message}\n${e.stack}`);
            });
        }
    }

    onDragBegin(item) {
        this.dragItem = item;
    }

    onDragMotion(x, y) {
        if (this.dragItem === null) {
            for(let desktop of this._desktops) {
                desktop.refreshDrag([[0, 0]], x, y);
            }
            return;
        }
        if (this._dragList === null) {
            let itemList = this.getCurrentSelection(false);
            if (!itemList) {
                return;
            }
            let [x1, y1, x2, y2, c] = this.dragItem.getCoordinates();
            let oX = x1;
            let oY = y1;
            this._dragList = [];
            for (let item of itemList) {
                [x1, y1, x2, y2, c] = item.getCoordinates();
                this._dragList.push([x1 - oX, y1 - oY]);
            }
        }
        for(let desktop of this._desktops) {
            desktop.refreshDrag(this._dragList, x, y);
        }
    }

    onDragLeave() {
        this._dragList = null;
        for(let desktop of this._desktops) {
            desktop.refreshDrag(null, 0, 0);
        }
    }

    onDragEnd() {
        this.dragItem = null;
    }

    onDragDataReceived(xDestination, yDestination, selection, info, forceLocal) {
        this.onDragLeave();
        let fileList = DesktopIconsUtil.getFilesFromNautilusDnD(selection, info);
        if (forceLocal) {
            info = 0;
        }
        switch(info) {
        case 0:
            if (fileList.length != 0) {
                let [xOrigin, yOrigin, a, b, c] = this.dragItem.getCoordinates();
                this.doMoveWithDragAndDrop(xOrigin, yOrigin, xDestination, yDestination);
            }
            break;
        case 1:
        case 2:
            if (fileList.length != 0) {
                this.clearFileCoordinates(fileList, [xDestination, yDestination]);
                let data = Gio.File.new_for_uri(fileList[0]).query_info('id::filesystem', Gio.FileQueryInfoFlags.NONE, null);
                let id_fs = data.get_attribute_string('id::filesystem');
                if (this.desktopFsId == id_fs) {
                    DBusUtils.NautilusFileOperations2Proxy.MoveURIsRemote(
                        fileList,
                        "file://" + GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP),
                        DBusUtils.NautilusFileOperations2Proxy.platformData(),
                        (result, error) => {
                            if (error)
                                throw new Error('Error moving files: ' + error.message);
                            }
                    );
                } else {
                    DBusUtils.NautilusFileOperations2Proxy.CopyURIsRemote(
                        fileList,
                        "file://" + GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP),
                        DBusUtils.NautilusFileOperations2Proxy.platformData(),
                        (result, error) => {
                            if (error)
                                throw new Error('Error moving files: ' + error.message);
                            }
                    );
                }
            }
            break;
        case 3:
            if (fileList.length != 0 ) {
                let dropCoordinates = [ xDestination, yDestination ];
                this.detectURLorText(fileList, dropCoordinates);
            }
            break;
        }
    }

    detectURLorText(fileList, dropCoordinates) {
        function isValidURL(str) {
            var pattern = new RegExp('^(https|http|ftp|rtsp|mms)?:\\/\\/?'+ 
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ 
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ 
            '(\\?[;&a-z\\d%_.~+=-]*)?'+ 
            '(\\#[-a-z\\d_]*)?$','i'); 
            return !!pattern.test(str);
        }
        let text = fileList.toString();
        if (isValidURL(text)) {
            this.writeURLlinktoDesktop(text, dropCoordinates);
        } else {
            let filename = "Dragged Text";
            let now = Date().valueOf().split(" ").join("").replace( /:/g , '-');
            filename = filename + "-" + now;
            DesktopIconsUtil.writeTextFileToDesktop(text, filename, dropCoordinates);
        }
    }

    writeURLlinktoDesktop(link, dropCoordinates) {
        let filename = link.split("?")[0];
        filename = filename.split("//")[1];
        filename = filename.split("/")[0] ;
        let now = Date().valueOf().split(" ").join("").replace( /:/g , '-' );
        filename = filename + "-" + now ;
        this.writeHTMLTypeLink(filename, link, dropCoordinates);
    }


    writeHTMLTypeLink(filename, link, dropCoordinates) {
        filename = filename + ".html";
        let body = [ '<html>', '<head>', '<meta http-equiv="refresh" content="0; url=' + link + '" />', '</head>', '<body>', '</body>', '</html>' ];
        body = body.join('\n');
        DesktopIconsUtil.writeTextFileToDesktop(body, filename, dropCoordinates);
    }

    fillDragDataGet(info) {
        let fileList = this.getCurrentSelection(false);
        if (fileList == null) {
            return null;
        }
        let atom;
        switch(info) {
            case 0:
                atom = Gdk.atom_intern('x-special/ding-icon-list', false);
                break;
            case 1:
                atom = Gdk.atom_intern('x-special/gnome-icon-list', false);
                break;
            case 2:
                atom = Gdk.atom_intern('text/uri-list', false);
                break;
            default:
                return null;
        }
        let data = "";
        for (let fileItem of fileList) {
            data += fileItem.uri;
            if (info == 1) {
                let coordinates = fileItem.getCoordinates();
                if (coordinates != null) {
                    data += `\r${coordinates[0]}:${coordinates[1]}:${coordinates[2] - coordinates[0] + 1}:${coordinates[3] - coordinates[1] + 1}`
                }
            }
            data += '\r\n';
        }
        return [atom, data];
    }

    onPressButton(x, y, event, grid) {

        this._clickX = Math.floor(x);
        this._clickY = Math.floor(y);
        let button = event.get_button()[1];
        let state = event.get_state()[1];
        if (button == 1) {
            let shiftPressed = !!(state & Gdk.ModifierType.SHIFT_MASK);
            let controlPressed = !!(state & Gdk.ModifierType.CONTROL_MASK);
            if (!shiftPressed && !controlPressed) {
                // clear selection
                this.unselectAll();
            }
            this._startRubberband(x, y);
        }
        if (button == 3) {
            let templates = this.templatesMonitor.createMenu();
            if (templates === null) {
                this._newDocumentItem.hide();
            } else {
                this._newDocumentItem.set_submenu(templates);
                this._newDocumentItem.show_all();
            }
            this._syncUndoRedo();
            let atom = Gdk.Atom.intern('CLIPBOARD', false);
            let clipboard = Gtk.Clipboard.get(atom);
            clipboard.request_text((clipboard, text) => {
                let [valid, is_cut, files] = this._parseClipboardText(text);
                this._pasteMenuItem.set_sensitive(valid);
            });
            this._menu.popup_at_pointer(event);
        }
    }

    _syncUndoRedo() {
        switch (DBusUtils.NautilusFileOperations2Proxy.UndoStatus) {
            case Enums.UndoStatus.UNDO:
                this._undoMenuItem.show();
                this._redoMenuItem.hide();
                break;
            case Enums.UndoStatus.REDO:
                this._undoMenuItem.hide();
                this._redoMenuItem.show();
                break;
            default:
                this._undoMenuItem.hide();
                this._redoMenuItem.hide();
                break;
        }
    }

    _undoStatusChanged(proxy, properties, test) {
        if ('UndoStatus' in properties.deep_unpack())
            this._syncUndoRedo();
    }

    _doUndo() {
        DBusUtils.NautilusFileOperations2Proxy.UndoRemote(
            DBusUtils.NautilusFileOperations2Proxy.platformData(),
            (result, error) => {
                if (error)
                    throw new Error('Error performing undo: ' + error.message);
            }
        );
    }

    _doRedo() {
        DBusUtils.NautilusFileOperations2Proxy.RedoRemote(
            DBusUtils.NautilusFileOperations2Proxy.platformData(),
            (result, error) => {
                if (error)
                    throw new Error('Error performing redo: ' + error.message);
            }
        );
    }

    onKeyPress(event, grid) {
        let symbol = event.get_keyval()[1];
        let isCtrl = (event.get_state()[1] & Gdk.ModifierType.CONTROL_MASK) != 0;
        let isShift = (event.get_state()[1] & Gdk.ModifierType.SHIFT_MASK) != 0;
        let isAlt = (event.get_state()[1] & Gdk.ModifierType.MOD1_MASK) != 0;
        let selection = this.getCurrentSelection(false);
        if (isCtrl && isShift && ((symbol == Gdk.KEY_Z) || (symbol == Gdk.KEY_z))) {
            this._doRedo();
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_Z) || (symbol == Gdk.KEY_z))) {
            this._doUndo();
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_C) || (symbol == Gdk.KEY_c))) {
            this.doCopy();
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_X) || (symbol == Gdk.KEY_x))) {
            this.doCut();
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_V) || (symbol == Gdk.KEY_v))) {
            this._doPaste();
            return true;
        } else if (isAlt && (symbol == Gdk.KEY_Return)) {
            let selection = this.getCurrentSelection(true);
            DBusUtils.FreeDesktopFileManagerProxy.ShowItemPropertiesRemote(selection, '',
                (result, error) => {
                    if (error)
                        log('Error showing properties: ' + error.message);
                    }
                );
            return true;
        } else if (symbol == Gdk.KEY_Return) {
            if (selection && (selection.length == 1)) {
                selection[0].doOpen();
                return true;
            }
        } else if (symbol == Gdk.KEY_Delete) {
            if (isShift) {
                this.doDeletePermanently();
            } else {
                this.doTrash();
            }
            return true;
        } else if (symbol == Gdk.KEY_F2) {
            if (selection && (selection.length == 1)) {
                // Support renaming other grids file items.
                this.doRename(selection[0], false);
                return true;
            }
        } else if ((selection) && symbol == Gdk.KEY_space) {
                // Support previewing other grids file items.
                DBusUtils.GnomeNautilusPreviewProxy.ShowFileRemote(selection[0].uri, 0, true);
                return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_A) || (symbol == Gdk.KEY_a))) {
            this._selectAll();
            return true;
        } else if (symbol == Gdk.KEY_F5) {
            this._updateDesktop().catch((e) => {
                    print(`Exception while updating Desktop after pressing F5: ${e.message}\n${e.stack}`);
                });
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_H) || (symbol == Gdk.KEY_h))) {
            Prefs.gtkSettings.set_boolean('show-hidden', !this._showHidden);
            return true;
        } else if (isCtrl && ((symbol == Gdk.KEY_F) || (symbol == Gdk.KEY_f))) {
            this.findFiles();
            return true;
        } else if (symbol == Gdk.KEY_Escape) {
            this.unselectAll();
            if (this.searchString) {
                this.searchString = null;
            }
            return true;
        } else {
            if (this.ignoreKeys.includes(symbol)) {
                return;
            }
            let key = String.fromCharCode(Gdk.keyval_to_unicode(symbol));
            if (this.keypressTimeoutID && this.searchString) {
                this.searchString = this.searchString.concat(key);
            } else {
                this.searchString = key;
            }
            if (this.searchString != '') {
                if ((this.getNumberOfSelectedItems() >= 1) && (! this.keypressTimeoutID)) {
                    let windowError = new ShowErrorPopup.ShowErrorPopup(
                        _("Clear Current Selection before New Search"),
                        null,
                        null,
                        true);
                    windowError.timeoutClose(2000);
                    return true;
                }
                let found = this.scanForFiles(this.searchString);
                if (found) {
                    this.searchEventTime = GLib.get_monotonic_time();
                    if (! this.keypressTimeoutID) {
                        this.keypressTimeoutID = GLib.timeout_add(1, 1000, () => {
                            if (GLib.get_monotonic_time() - this.searchEventTime < 1500000) {
                                return true;
                            }
                            this.searchString = null;
                            this.keypressTimeoutID = null;
                            if (this._findFileWindow) {
                                this._findFileWindow.response(Gtk.ResponseType.OK);
                            }
                            return false;
                        });
                    }
                    this.findFiles(this.searchString)
                }
            }
            return true;
        }
        return false;
    }

    unselectAll() {
        this._fileList.map(f => f.unsetSelected());
    }

    findFiles(text) {
        this._findFileWindow = new Gtk.Dialog({use_header_bar: true,
                                       window_position: Gtk.WindowPosition.CENTER_ON_PARENT,
                                       resizable: false});
        this._findFileButton = this._findFileWindow.add_button(_("OK"), Gtk.ResponseType.OK);
        this._findFileButton.sensitive = false;
        this._findFileWindow.add_button(_("Cancel"), Gtk.ResponseType.CANCEL);
        this._findFileWindow.set_modal(true);
        this._findFileWindow.set_title(_('Find Files on Desktop'));
        DesktopIconsUtil.windowHidePagerTaskbarModal(this._findFileWindow, true);
        let contentArea = this._findFileWindow.get_content_area();
        this._findFileTextArea = new Gtk.Entry();
        contentArea.pack_start(this._findFileTextArea, true, true, 5);
        this._findFileTextArea.connect('activate', () => {
            if (this._findFileButton.sensitive) {
                this._findFileWindow.response(Gtk.ResponseType.OK);
            }
        });
        this._findFileTextArea.connect('changed', () => {
            let context = this._findFileTextArea.get_style_context();
            if (this.scanForFiles(this._findFileTextArea.text)){
                this._findFileButton.sensitive = true;
                if (context.has_class('not-found')) {
                    context.remove_class('not-found');
                }
            } else {
                this._findFileButton.sensitive = false;
                this._findFileTextArea.error_bell();
                if (!context.has_class('not-found')) {
                    context.add_class('not-found');
                }
            }
            this.searchEventTime = GLib.get_monotonic_time();
        });
        this._findFileTextArea.grab_focus_without_selecting();
        if (text) {
            this._findFileTextArea.set_text(text);
            this._findFileTextArea.set_position(text.length);
        } else {
            this.scanForFiles(null);
        }
        this._findFileWindow.show_all();
        let retval = this._findFileWindow.run();
        if (retval == Gtk.ResponseType.CANCEL) {
            this.unselectAll();
        }
        this._findFileWindow.destroy();
        this._findFileWindow = null;
    }

    scanForFiles(text) {
        let found = [];
        this.unselectAll();
        if (text && (text != '')) {
            found = this._fileList.filter(f => (f.fileName.toLowerCase().includes(text.toLowerCase())) || (f._label.get_text().toLowerCase().includes(text.toLowerCase())));
        }
        if (found.length != 0) {
            found.map(f => f.setSelected());
            return true;
        } else {
            return false;
        }
    }

    _createDesktopBackgroundMenu() {
        this._menu = new Gtk.Menu();
        let newFolder = new Gtk.MenuItem({label: _("New Folder")});
        newFolder.connect("activate", () => this.doNewFolder());
        this._menu.add(newFolder);

        this._newDocumentItem = new Gtk.MenuItem({label: _("New Document")});
        this._menu.add(this._newDocumentItem);

        this._menu.add(new Gtk.SeparatorMenuItem());

        this._pasteMenuItem = new Gtk.MenuItem({label: _("Paste")});
        this._pasteMenuItem.connect("activate", () => this._doPaste());
        this._menu.add(this._pasteMenuItem);

        this._undoMenuItem = new Gtk.MenuItem({label: _("Undo")});
        this._undoMenuItem.connect("activate", () => this._doUndo());
        this._menu.add(this._undoMenuItem);

        this._redoMenuItem = new Gtk.MenuItem({label: _("Redo")});
        this._redoMenuItem.connect("activate", () => this._doRedo());
        this._menu.add(this._redoMenuItem);

        this._menu.add(new Gtk.SeparatorMenuItem());

        let selectAll = new Gtk.MenuItem({label: _("Select All")});
        selectAll.connect("activate", () => this._selectAll());
        this._menu.add(selectAll);

        this._addSortingMenu();

        this._menu.add(new Gtk.SeparatorMenuItem());

        this._showDesktopInFilesMenuItem = new Gtk.MenuItem({label: _("Show Desktop in Files")});
        this._showDesktopInFilesMenuItem.connect("activate", () => this._onOpenDesktopInFilesClicked());
        this._menu.add(this._showDesktopInFilesMenuItem);

        this._openTerminalMenuItem = new Gtk.MenuItem({label: _("Open in Terminal")});
        this._openTerminalMenuItem.connect("activate", () => this._onOpenTerminalClicked());
        this._menu.add(this._openTerminalMenuItem);

        this._menu.add(new Gtk.SeparatorMenuItem());

        this._changeBackgroundMenuItem = new Gtk.MenuItem({label: _("Change Background…")});
        this._changeBackgroundMenuItem.connect("activate", () => {
            let desktopFile = Gio.DesktopAppInfo.new('gnome-background-panel.desktop');
            desktopFile.launch([], null);
        });
        this._menu.add(this._changeBackgroundMenuItem);

        this._menu.add(new Gtk.SeparatorMenuItem());

        this._displaySettingsMenuItem = new Gtk.MenuItem({label: _("Display Settings")});
        this._displaySettingsMenuItem.connect("activate", () => {
            let desktopFile = Gio.DesktopAppInfo.new('gnome-display-panel.desktop');
            desktopFile.launch([], null);
        });
        this._menu.add(this._displaySettingsMenuItem);

        this._settingsMenuItem = new Gtk.MenuItem({label: _("Desktop Icons Settings")});
        this._settingsMenuItem.connect("activate", () => Prefs.showPreferences());
        this._menu.add(this._settingsMenuItem);
        this._menu.show_all();
    }

    _selectAll() {
        for(let fileItem of this._fileList) {
            if (fileItem.isAllSelectable) {
                fileItem.setSelected();
            }
        }
    }

    _onOpenDesktopInFilesClicked() {
        Gio.AppInfo.launch_default_for_uri_async(this._desktopDir.get_uri(),
            null, null,
            (source, result) => {
                try {
                    Gio.AppInfo.launch_default_for_uri_finish(result);
                } catch (e) {
                   log('Error opening Desktop in Files: ' + e.message);
                }
            }
        );
    }

    _onOpenTerminalClicked() {
        let desktopPath = this._desktopDir.get_path();
        DesktopIconsUtil.launchTerminal(desktopPath, null);
    }

    _doPaste() {
        let atom = Gdk.Atom.intern('CLIPBOARD', false);
        let clipboard = Gtk.Clipboard.get(atom);
        clipboard.request_text((clipboard, text) => {
            let [valid, is_cut, files] = this._parseClipboardText(text);
            if (!valid) {
                return;
            }

            let desktopDir = this._desktopDir.get_uri();
            if (is_cut) {
                DBusUtils.NautilusFileOperations2Proxy.MoveURIsRemote(files, desktopDir,
                    DBusUtils.NautilusFileOperations2Proxy.platformData(),
                    (result, error) => {
                        if (error)
                            throw new Error('Error moving files: ' + error.message);
                    }
                );
            } else {
                DBusUtils.NautilusFileOperations2Proxy.CopyURIsRemote(files, desktopDir,
                    DBusUtils.NautilusFileOperations2Proxy.platformData(),
                    (result, error) => {
                        if (error)
                            throw new Error('Error copying files: ' + error.message);
                    }
                );
            }
        });
    }

    _parseClipboardText(text) {
        if (text === null)
            return [false, false, null];

        let lines = text.split('\n');
        let [mime, action, ...files] = lines;

        if (mime != 'x-special/nautilus-clipboard')
            return [false, false, null];

        if (!(['copy', 'cut'].includes(action)))
            return [false, false, null];
        let isCut = action == 'cut';

        /* Last line is empty due to the split */
        if (files.length <= 1)
            return [false, false, null];
        /* Remove last line */
        files.pop();

        return [true, isCut, files];
    }

    onMotion(x, y) {
        if (this.rubberBand) {
            this.x1 = Math.min(x, this.rubberBandInitX);
            this.x2 = Math.max(x, this.rubberBandInitX);
            this.y1 = Math.min(y, this.rubberBandInitY);
            this.y2 = Math.max(y, this.rubberBandInitY);
            this.selectionRectangle = new Gdk.Rectangle({'x':this.x1, 'y':this.y1, 'width':(this.x2-this.x1), 'height':(this.y2-this.y1)});
            for(let grid of this._desktops) {
                grid.queue_draw();
            }
            for(let item of this._fileList) {
                let labelintersect = item.labelRectangle.intersect(this.selectionRectangle)[0];
                let iconintersect = item.iconRectangle.intersect(this.selectionRectangle)[0];
                if (labelintersect || iconintersect) {
                    item.setSelected();
                    item.touchedByRubberband = true;
                } else {
                    if (item.touchedByRubberband) {
                        item.unsetSelected();
                    }
                }
            }
        }
        return false;
    }

    onReleaseButton(grid) {
        if (this.rubberBand) {
            this.rubberBand = false;
            this.selectionRectangle = null;
        }
        for(let grid of this._desktops) {
            grid.queue_draw();
        }
        return false;
    }

    _startRubberband(x, y) {
        this.rubberBandInitX = x;
        this.rubberBandInitY = y;
        this.rubberBand = true;
        for(let item of this._fileList) {
            item.touchedByRubberband = false;
        }
    }

    selected(fileItem, action) {
        switch(action) {
        case Enums.Selection.ALONE:
            if (!fileItem.isSelected) {
                for(let item of this._fileList) {
                    if (item === fileItem) {
                        item.setSelected();
                    } else {
                        item.unsetSelected();
                    }
                }
            }
            break;
        case Enums.Selection.WITH_SHIFT:
            fileItem.toggleSelected();
            break;
        case Enums.Selection.RIGHT_BUTTON:
            if (!fileItem.isSelected) {
                for(let item of this._fileList) {
                    if (item === fileItem) {
                        item.setSelected();
                    } else {
                        item.unsetSelected();
                    }
                }
            }
            break;
        case Enums.Selection.ENTER:
            if (this.rubberBand) {
                fileItem.setSelected();
            }
            break;
        case Enums.Selection.RELEASE:
            for(let item of this._fileList) {
                if (item === fileItem) {
                    item.setSelected();
                } else {
                    item.unsetSelected();
                }
            }
            break;
        }
    }

    _removeAllFilesFromGrids() {
        for(let fileItem of this._fileList) {
            fileItem.removeFromGrid(true);
        }
        this._fileList = [];
    }

    async _updateDesktop() {
        if (this._readingDesktopFiles) {
            // just notify that the files changed while being read from the disk.
            this._desktopFilesChanged = true;
            if (this._desktopEnumerateCancellable) {
                this._desktopEnumerateCancellable.cancel();
                this._desktopEnumerateCancellable = null;
            }
            return;
        }

        this._readingDesktopFiles = true;
        let fileList;
        while(true) {
            this._desktopFilesChanged = false;
            if (! this._desktopDir.query_exists(null)) {
                fileList = [];
                break;
            }
            fileList = await this._doReadAsync();
            if (this._forcedExit) {
                return;
            }
            if (!this._desktopFilesChanged && (fileList !== null)) {
                break;
            }
            await DesktopIconsUtil.waitDelayMs(500);
        }
        this._readingDesktopFiles = false;
        this._drawDesktop(fileList);
    }

    _doReadAsync() {
        if (this._desktopEnumerateCancellable) {
            this._desktopEnumerateCancellable.cancel();
        }
        this._desktopEnumerateCancellable = new Gio.Cancellable();
        return new Promise ((resolve, reject) => {
            this._desktopDir.enumerate_children_async(
                Enums.DEFAULT_ATTRIBUTES,
                Gio.FileQueryInfoFlags.NONE,
                GLib.PRIORITY_DEFAULT,
                this._desktopEnumerateCancellable,
                (source, result) => {
                    try {
                        this._desktopEnumerateCancellable = null;
                        let fileEnum = source.enumerate_children_finish(result);
                        if (this._desktopFilesChanged) {
                            resolve(null);
                            return;
                        }
                        let fileList = [];
                        for (let [newFolder, extras] of DesktopIconsUtil.getExtraFolders()) {
                            try {
                                fileList.push(new FileItem.FileItem(this,
                                                                    newFolder,
                                                                    newFolder.query_info(Enums.DEFAULT_ATTRIBUTES, Gio.FileQueryInfoFlags.NONE, null),
                                                                    extras,
                                                                    null));
                            } catch (e) {
                                print(`Failed with ${e.message} while adding extra folder ${newFolder.get_uri()}\n${e.stack}`);
                            }
                        }
                        let info;
                        while ((info = fileEnum.next_file(null))) {
                            let fileItem = new FileItem.FileItem(this,
                                                                 fileEnum.get_child(info),
                                                                 info,
                                                                 Enums.FileType.NONE,
                                                                 null);
                            if (fileItem.isHidden && !this._showHidden) {
                                /* if there are hidden files in the desktop and the user doesn't want to
                                    show them, remove the coordinates. This ensures that if the user enables
                                    showing them, they won't fight with other icons for the same place
                                */
                                if (fileItem.savedCoordinates) {
                                    // only overwrite them if needed
                                    fileItem.savedCoordinates = null;
                                }
                                continue;
                            }
                            fileList.push(fileItem);
                            if (fileItem.dropCoordinates == null) {
                                let basename = fileItem.file.get_basename();
                                if (basename in this._pendingDropFiles) {
                                    fileItem.dropCoordinates = this._pendingDropFiles[basename];
                                    delete this._pendingDropFiles[basename];
                                }
                            }
                        }
                        for (let [newFolder, extras, volume] of DesktopIconsUtil.getMounts(this._volumeMonitor)) {
                            try {
                                fileList.push(new FileItem.FileItem(this,
                                                                    newFolder,
                                                                    newFolder.query_info(Enums.DEFAULT_ATTRIBUTES, Gio.FileQueryInfoFlags.NONE, null),
                                                                    extras,
                                                                    volume));
                            } catch (e) {
                                print(`Failed with ${e} while adding volume ${newFolder}`);
                            }
                        }
                        resolve(fileList);
                        return;
                    } catch(e) {
                        resolve(null);
                        return;
                    }
                }
            );
        });
    }

    _drawDesktop(fileList) {
        this._removeAllFilesFromGrids();
        this._fileList = fileList;
        this.keepArranged = Prefs.desktopSettings.get_boolean('keep-arranged');
        this.sortSpecialFolders = Prefs.desktopSettings.get_boolean('sort-special-folders');
        if (this.keepArranged) {
            this.doSorts();
        } else {
            this._addFilesToDesktop(this._fileList, Enums.StoredCoordinates.PRESERVE);
        }
    }

    _addFilesToDesktop(fileList, storeMode) {
        let outOfDesktops = [];
        let notAssignedYet = [];
        // First, add those icons that fit in the current desktops
        for(let fileItem of fileList) {
            if (fileItem.savedCoordinates == null) {
                notAssignedYet.push(fileItem);
                continue;
            }
            if (fileItem.dropCoordinates != null) {
                fileItem.dropCoordinates = null;
            }
            let [itemX, itemY] = fileItem.savedCoordinates;
            let addedToDesktop = false;
            for(let desktop of this._desktops) {
                if (desktop.getDistance(itemX, itemY) == 0) {
                    addedToDesktop = true;
                    desktop.addFileItemCloseTo(fileItem, itemX, itemY, storeMode);
                    break;
                }
            }
            if (!addedToDesktop) {
                outOfDesktops.push(fileItem);
            }
        }
        // Now, assign those icons that are outside the current desktops,
        // but have assigned coordinates
        for(let fileItem of outOfDesktops) {
            let minDistance = -1;
            let [itemX, itemY] = fileItem.savedCoordinates;
            let newDesktop = null;
            for (let desktop of this._desktops) {
                let distance = desktop.getDistance(itemX, itemY);
                if (distance == -1) {
                    continue;
                }
                if ((minDistance == -1) || (distance < minDistance)) {
                    minDistance = distance;
                    newDesktop = desktop;
                }
            }
            if (newDesktop == null) {
                print("Not enough space to add icons");
                break;
            } else {
                newDesktop.addFileItemCloseTo(fileItem, itemX, itemY, storeMode);
            }
        }
        // Finally, assign those icons that still don't have coordinates
        for (let fileItem of notAssignedYet) {
            let x, y;
            if (fileItem.dropCoordinates == null) {
                x = this._primaryScreen.x;
                y = this._primaryScreen.y;
                storeMode = Enums.StoredCoordinates.ASSIGN;
            } else {
                [x, y] = fileItem.dropCoordinates;
                fileItem.dropCoordinates = null;
                storeMode = Enums.StoredCoordinates.OVERWRITE;
            }
            // try first in the designated desktop
            let assigned = false;
            for (let desktop of this._desktops) {
                if (desktop.getDistance(x, y) == 0) {
                    desktop.addFileItemCloseTo(fileItem, x, y, storeMode);
                    assigned = true;
                    break;
                }
            }
            if (assigned) {
                continue;
            }
            // if there is no space in the designated desktop, try in another
            for (let desktop of this._desktops) {
                if (desktop.getDistance(x, y) != -1) {
                    desktop.addFileItemCloseTo(fileItem, x, y, storeMode);
                    break;
                }
            }
        }
    }

    _updateWritableByOthers() {
        let info = this._desktopDir.query_info(Gio.FILE_ATTRIBUTE_UNIX_MODE,
                                               Gio.FileQueryInfoFlags.NONE,
                                               null);
        this.unixMode = info.get_attribute_uint32(Gio.FILE_ATTRIBUTE_UNIX_MODE);
        let writableByOthers = (this.unixMode & Enums.S_IWOTH) != 0;
        if (writableByOthers != this.writableByOthers) {
            this.writableByOthers = writableByOthers;
            if (this.writableByOthers) {
                print(`desktop-icons: Desktop is writable by others - will not allow launching any desktop files`);
            }
            return true;
        } else {
            return false;
        }
    }

    _updateDesktopIfChanged(file, otherFile, eventType) {
        if (eventType == Gio.FileMonitorEvent.CHANGED) {
            // use only CHANGES_DONE_HINT
            return;
        }
        if (!this._showHidden && (file.get_basename()[0] == '.')) {
            // If the file is not visible, we don't need to refresh the desktop
            // Unless it is a hidden file being renamed to visible
            if (!otherFile || (otherFile.get_basename()[0] == '.')) {
                return;
            }
        }
        switch(eventType) {
            case Gio.FileMonitorEvent.MOVED_IN:
            case Gio.FileMonitorEvent.MOVED_CREATED:
                /* Remove the coordinates that could exist to avoid conflicts between
                   files that are already in the desktop and the new one
                 */
                try {
                    let info = new Gio.FileInfo();
                    info.set_attribute_string('metadata::nautilus-icon-position', '');
                    file.set_attributes_from_info(info, Gio.FileQueryInfoFlags.NONE, null);
                } catch (e) {} // can happen if a file is created and deleted very fast
                break;
            case Gio.FileMonitorEvent.ATTRIBUTE_CHANGED:
                /* The desktop is what changed, and not a file inside it */
                if (file.get_uri() == this._desktopDir.get_uri()) {
                    if (this._updateWritableByOthers()) {
                        this._updateDesktop().catch((e) => {
                            print(`Exception while updating Desktop from Directory Monitor Attribute Change: ${e.message}\n${e.stack}`);
                        });
                    }
                    return;
                }
                break;
        }
        this._updateDesktop().catch((e) => {
                print(`Exception while updating Desktop from Directory Monitor: ${e.message}\n${e.stack}`);
        });
    }

    _getClipboardText(isCopy) {
        let selection = this.getCurrentSelection(true);
        if (selection) {
            let atom = Gdk.Atom.intern('CLIPBOARD', false);
            let clipboard = Gtk.Clipboard.get(atom);
            let text = 'x-special/nautilus-clipboard\n' + (isCopy ? 'copy' : 'cut') + '\n';
            for (let item of selection) {
                text += item + '\n';
            }
            clipboard.set_text(text, -1);
        }
    }

    doCopy() {
        this._getClipboardText(true);
    }

    doCut() {
        this._getClipboardText(false);
    }

    doTrash() {
        const selection = this._fileList.filter(i => i.isSelected && !i.isSpecial).map(i =>
            i.file.get_uri());

        if (selection.length) {
            DBusUtils.NautilusFileOperations2Proxy.TrashURIsRemote(selection,
                DBusUtils.NautilusFileOperations2Proxy.platformData(),
                (source, error) => {
                    if (error)
                        throw new Error('Error trashing files on the desktop: ' + error.message);
                }
            );
        }
    }

    doDeletePermanently() {
        const toDelete = this._fileList.filter(i => i.isSelected && !i.isSpecial).map(i =>
            i.file.get_uri());

        if (!toDelete.length) {
            if (this._fileList.some(i => i.isSelected && i.isTrash))
                this.doEmptyTrash();
            return;
        }

        DBusUtils.NautilusFileOperations2Proxy.DeleteURIsRemote(toDelete,
            DBusUtils.NautilusFileOperations2Proxy.platformData(),
            (_source, error) => {
                if (error)
                    throw new Error('Error deleting files on the desktop: ' + error.message);
            });
    }

    doEmptyTrash(askConfirmation = true) {
        DBusUtils.NautilusFileOperations2Proxy.EmptyTrashRemote(
            askConfirmation,
            DBusUtils.NautilusFileOperations2Proxy.platformData(),
            (source, error) => {
                if (error)
                    throw new Error('Error trashing files on the desktop: ' + error.message);
        });
    }

    checkIfSpecialFilesAreSelected() {
        for(let item of this._fileList) {
            if (item.isSelected && item.isSpecial) {
                return true;
            }
        }
        return false;
    }

    checkIfDirectoryIsSelected() {
        for(let item of this._fileList) {
            if (item.isSelected && item.isDirectory) {
                return true;
            }
        }
        return false;
    }

    getCurrentSelection(getUri) {
        let listToTrash = [];
        for(let fileItem of this._fileList) {
            if (fileItem.isSelected) {
                if (getUri) {
                    listToTrash.push(fileItem.file.get_uri());
                } else {
                    listToTrash.push(fileItem);
                }
            }
        }
        if (listToTrash.length != 0) {
            return listToTrash;
        } else {
            return null;
        }
    }

    getNumberOfSelectedItems() {
        let count = 0;
        for(let item of this._fileList) {
            if (item.isSelected) {
                count++;
            }
        }
        return count;
    }

    doRename(fileItem, allowReturnOnSameName) {
        if (!fileItem.canRename) {
            return;
        }
        this.unselectAll();
        if (!this._renameWindow) {
            this._renameWindow = new AskRenamePopup.AskRenamePopup(fileItem, allowReturnOnSameName, () => {
                this._renameWindow = null;
                this.newFolderDoRename = null;
            });
        }
    }

    doNewFolder(position) {
        let X;
        let Y;
        if (position) {
            [X, Y] = position;
        } else {
            [X, Y] = [this._clickX, this._clickY];
        }
        this.unselectAll();
        let i = 0;
        let baseName = _("New Folder");
        let newName = baseName;
        while ( 0 != this._fileList.filter(file => file.fileName == newName).length) {
            i += 1;
            newName = baseName + " " + i;
        }
        if (newName) {
            let dir = DesktopIconsUtil.getDesktopDir().get_child(newName);
            try {
                dir.make_directory(null);
                let info = new Gio.FileInfo();
                info.set_attribute_string('metadata::nautilus-drop-position', `${X},${Y}`);
                info.set_attribute_string('metadata::nautilus-icon-position', '');
                dir.set_attributes_from_info(info, Gio.FileQueryInfoFlags.NONE, null);
                this.newFolderDoRename = newName;
                if (position) {
                    return dir.get_uri();
                }
            } catch(e) {
                print(`Failed to create folder ${e.message}`);
            }
        }
    }

    _newDocument(template) {
        let file = Gio.File.new_for_path(template);
        if ((file == null) || (!file.query_exists(null))) {
            return;
        }
        let counter = 0;
        let fullName = file.get_basename();
        let offset = DesktopIconsUtil.getFileExtensionOffset(fullName, false);
        let name = fullName.substring(0, offset);
        let extension = fullName.substring(offset);

        let finalName = `${name}${extension}`;
        let destination;
        do {
            if (counter != 0) {
                finalName = `${name} ${counter}${extension}`
            }
            destination = Gio.File.new_for_path(GLib.build_filenamev([GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP), finalName]));
            counter++;
        } while(destination.query_exists(null));
        try {
            file.copy(destination, Gio.FileCopyFlags.NONE, null, null);
            let info = new Gio.FileInfo();
            info.set_attribute_string('metadata::nautilus-drop-position', `${this._clickX},${this._clickY}`);
            info.set_attribute_string('metadata::nautilus-icon-position', '');
            destination.set_attributes_from_info(info, Gio.FileQueryInfoFlags.NONE, null);
        } catch(e) {
            print(`Failed to create template ${e.message}`);
        }
    }

    _addSortingMenu() {
        this._menu.add(new Gtk.SeparatorMenuItem());

        this._cleanUpMenuItem = new Gtk.MenuItem({label: _("Arrange Icons")});
        this._cleanUpMenuItem.connect("activate", () => this._sortAllFilesFromGridsByPosition());
        this._menu.add(this._cleanUpMenuItem);

        this._ArrangeByMenuItem = new Gtk.MenuItem({label: _("Arrange By...")});
        this._menu.add(this._ArrangeByMenuItem);
        this._addSortingSubMenu();
    }

    _addSortingSubMenu() {
        this._arrangeSubMenu = new Gtk.Menu();
        this._ArrangeByMenuItem.set_submenu(this._arrangeSubMenu);

        this._keepArrangedMenuItem = new Gtk.CheckMenuItem({label: _("Keep Arranged...")});
        Prefs.desktopSettings.bind('keep-arranged', this._keepArrangedMenuItem, 'active', 3);
        this._keepArrangedMenuItem.bind_property('active', this._cleanUpMenuItem, 'sensitive', 6);
        this._arrangeSubMenu.add(this._keepArrangedMenuItem);

        this._sortSpecialFilesMenuItem = new Gtk.CheckMenuItem({label: _("Sort Home/Drives/Trash...")});
        Prefs.desktopSettings.bind('sort-special-folders', this._sortSpecialFilesMenuItem, 'active', 3);
        this._arrangeSubMenu.add(this._sortSpecialFilesMenuItem);

        this._arrangeSubMenu.add(new Gtk.SeparatorMenuItem());

        this._radioName = new Gtk.RadioMenuItem({label: _("Sort by Name")});
        this._arrangeSubMenu.add(this._radioName);
        this._radioDescName = new Gtk.RadioMenuItem({label: _("Sort by Name Descending")});
        this._radioDescName.join_group(this._radioName);
        this._arrangeSubMenu.add (this._radioDescName);
        this._radioTimeName = new Gtk.RadioMenuItem({label: _("Sort by Modified Time")});
        this._radioTimeName.join_group(this._radioName);
        this._arrangeSubMenu.add (this._radioTimeName);
        this._radioKindName = new Gtk.RadioMenuItem({label: _("Sort by Type")});
        this._radioKindName.join_group(this._radioName);
        this._arrangeSubMenu.add (this._radioKindName);
        this._radioSizeName = new Gtk.RadioMenuItem({label: _("Sort by Size")});
        this._radioSizeName.join_group(this._radioName);
        this._arrangeSubMenu.add (this._radioSizeName);
        this.doArrangeRadioButtons();
        this._radioName.connect("activate", () => {this.setIfActive(this._radioName, Enums.SortOrder.NAME)});
        this._radioDescName.connect("activate", () => {this.setIfActive(this._radioDescName, Enums.SortOrder.DESCENDINGNAME)});
        this._radioTimeName.connect("activate", () => {this.setIfActive(this._radioTimeName, Enums.SortOrder.MODIFIEDTIME)});
        this._radioKindName.connect("activate", () => {this.setIfActive(this._radioKindName, Enums.SortOrder.KIND)});
        this._radioSizeName.connect("activate", () => {this.setIfActive(this._radioSizeName, Enums.SortOrder.SIZE)});
        this._arrangeSubMenu.show_all();
    }

    setIfActive(buttonname, choice) {
        if(buttonname.get_active()) {
            Prefs.setSortOrder(choice);
        }
    }

    _sortByName(fileList) {
        function byName(a, b) {
            //sort by label name instead of the the fileName or displayName so that the "Home" folder is sorted in the correct order
            //alphabetical sort taking into account accent characters & locale, natural language sort for numbers, ie 10.etc before 2.etc
            //other options for locale are best fit, or by specifying directly in function below for translators
            return a._label.get_text().localeCompare(b._label.get_text(), { sensitivity: 'accent' , numeric: 'true', localeMatcher: 'lookup' } );
        }
        fileList.sort(byName);
    }

    _sortByKindByName(fileList) {
        function byKindByName(a, b) {
            return a._attributeContentType.localeCompare(b._attributeContentType) ||
             a._label.get_text().localeCompare(b._label.get_text(), { sensitivity: 'accent' , numeric: 'true', localeMatcher: 'lookup' } );
        }
        fileList.sort(byKindByName);
    }

    _sortAllFilesFromGridsByName(order) {
        this._sortByName(this._fileList)
        if ( order == Enums.SortOrder.DESCENDINGNAME ) {
            this._fileList.reverse();
        }
        this._reassignFilesToDesktop();
    }

    _sortAllFilesFromGridsByPosition() {
        if (this.keepArranged) {
            return;
        }
        this._fileList.map(f => f.removeFromGrid(false));
        let cornerInversion = Prefs.get_start_corner();
        if (!cornerInversion[0] && !cornerInversion[1]) {
            this._fileList.sort((a, b) =>   {   if (a._x1 < b._x1) return -1;
                                                if (a._x1 > b._x1) return 1;
                                                if (a._y1 < b._y1) return -1;
                                                if (a._y1 > b._y1) return 1;
                                                return 0;
                                            });
        }
        if (cornerInversion[0] && cornerInversion[1]) {
            this._fileList.sort((a, b) =>   {   if (a._x1 < b._x1) return 1;
                                                if (a._x1 > b._x1) return -1;
                                                if (a._y1 < b._y1) return 1;
                                                if (a._y1 > b._y1) return -1;
                                                return 0;
                                            });
        }
        if (cornerInversion[0] && !cornerInversion[1]) {
            this._fileList.sort((a, b) =>   {   if (a._x1 < b._x1) return 1;
                                                if (a._x1 > b._x1) return -1;
                                                if (a._y1 < b._y1) return -1;
                                                if (a._y1 > b._y1) return 1;
                                                return 0;
                                            });
        }
        if (!cornerInversion[0] && cornerInversion[1]) {
            this._fileList.sort((a, b) =>   {   if (a._x1 < b._x1) return -1;
                                                if (a._x1 > b._x1) return 1;
                                                if (a._y1 < b._y1) return 1;
                                                if (a._y1 > b._y1) return -1;
                                                return 0;
                                            });
        }
        this._reassignFilesToDesktop();
    }

    _sortAllFilesFromGridsByModifiedTime() {
        function byTime(a, b) {
            return ( a._modifiedTime - b._modifiedTime )
        }
        this._fileList.sort(byTime);
        this._reassignFilesToDesktop();
    }

    _sortAllFilesFromGridsBySize() {
        function bySize(a, b) {
            return ( a.fileSize - b.fileSize );
        }
        this._fileList.sort(bySize);
        this._reassignFilesToDesktop();
    }

    _sortAllFilesFromGridsByKind() {
        let specialFiles = [];
        let directoryFiles = [];
        let validDesktopFiles = [];
        let otherFiles = [];
        let newFileList = [];
        for(let fileItem of this._fileList) {
            if (fileItem._isSpecial) {
                specialFiles.push(fileItem);
                continue;
            }
            if (fileItem._isDirectory) {
                directoryFiles.push(fileItem);
                continue;
            }
            if (fileItem._isValidDesktopFile) {
                validDesktopFiles.push(fileItem);
                continue;
            } else {
                otherFiles.push(fileItem);
                continue;
            }
        }
        this._sortByName(specialFiles);
        this._sortByName(directoryFiles);
        this._sortByName(validDesktopFiles);
        this._sortByKindByName(otherFiles);
        newFileList.push(...specialFiles);
        newFileList.push(...validDesktopFiles);
        newFileList.push(...directoryFiles);
        newFileList.push(...otherFiles)
        if ( this._fileList.length == newFileList.length) {
            this._fileList = newFileList ;
        }
        this._reassignFilesToDesktop();
    }

    _reassignFilesToDesktop() {
        if ( ! this.sortSpecialFolders) {
            this._reassignFilesToDesktopPreserveSpecialFiles();
            return;
        }
        for(let fileItem of this._fileList){
            fileItem.savedCoordinates = null;
            fileItem.dropCoordinates = null;
        }
        this._addFilesToDesktop(this._fileList, Enums.StoredCoordinates.ASSIGN);
    }

    _reassignFilesToDesktopPreserveSpecialFiles() {
        let specialFiles = [];
        let otherFiles = [];
        let newFileList = [];
        for(let fileItem of this._fileList){
            if ( fileItem._isSpecial) {
                specialFiles.push(fileItem);
                continue;
            }
            if (! fileItem._isSpecial) {
                otherFiles.push(fileItem);
                fileItem.savedCoordinates = null;
                fileItem.dropCoordinates = null;
                continue;
            }
        }
        newFileList.push(...specialFiles);
        newFileList.push(...otherFiles);
        if ( this._fileList.length == newFileList.length) {
            this._fileList = newFileList ;
        }
        this._addFilesToDesktop(this._fileList, Enums.StoredCoordinates.PRESERVE);
    }

    doArrangeRadioButtons() {
        switch(Prefs.getSortOrder()) {
                case Enums.SortOrder.NAME:
                    this._radioName.set_active(true);
                    break;
                case Enums.SortOrder.DESCENDINGNAME:
                    this._radioDescName.set_active(true);
                    break;
                case Enums.SortOrder.MODIFIEDTIME:
                    this._radioTimeName.set_active(true);
                    break;
                case Enums.SortOrder.KIND:
                    this._radioKindName.set_active(true);
                    break;
                case Enums.SortOrder.SIZE:
                    this._radioSizeName.set_active(true);
                    break;
                default:
                    this._radioName.set_active(true);
                    Prefs.setSortOrder(Enums.SortOrder.NAME);
                    break;
        }
    }

    doSorts(cleargrids) {
        if (cleargrids) {
            this._fileList.map(f => f.removeFromGrid());
        }
        switch (Prefs.getSortOrder()) {
            case Enums.SortOrder.NAME:
                this._sortAllFilesFromGridsByName();
                break;
            case Enums.SortOrder.DESCENDINGNAME:
                this._sortAllFilesFromGridsByName(Enums.SortOrder.DESCENDINGNAME);
                break;
            case Enums.SortOrder.MODIFIEDTIME:
                this._sortAllFilesFromGridsByModifiedTime();
                break;
            case Enums.SortOrder.KIND:
                this._sortAllFilesFromGridsByKind();
                break;
            case Enums.SortOrder.SIZE:
                this._sortAllFilesFromGridsBySize();
                break;
            default:
                this._addFilesToDesktop(this._fileList, Enums.StoredCoordinates.PRESERVE);
                break;
        }
    }
}
