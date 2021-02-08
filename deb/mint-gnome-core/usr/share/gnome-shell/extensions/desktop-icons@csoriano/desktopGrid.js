/* Desktop Icons GNOME Shell extension
 *
 * Copyright (C) 2017 Carlos Soriano <csoriano@redhat.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Gtk = imports.gi.Gtk;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Shell = imports.gi.Shell;

const Layout = imports.ui.layout;
const Main = imports.ui.main;
const BoxPointer = imports.ui.boxpointer;
const PopupMenu = imports.ui.popupMenu;
const GrabHelper = imports.ui.grabHelper;
const Config = imports.misc.config;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const CreateFolderDialog = Me.imports.createFolderDialog;
const Extension = Me.imports.extension;
const FileItem = Me.imports.fileItem;
const Prefs = Me.imports.prefs;
const DBusUtils = Me.imports.dbusUtils;
const DesktopIconsUtil = Me.imports.desktopIconsUtil;
const Util = imports.misc.util;

const Clipboard = St.Clipboard.get_default();
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;
const Gettext = imports.gettext.domain('desktop-icons');

const _ = Gettext.gettext;


/* From NautilusFileUndoManagerState */
var UndoStatus = {
    NONE: 0,
    UNDO: 1,
    REDO: 2,
};

var StoredCoordinates = {
    PRESERVE: 0,
    OVERWRITE:1,
    ASSIGN:2,
};

var Placeholder = GObject.registerClass({
    GTypeName: 'DesktopIcons_Placeholder',
}, class Placeholder extends St.Bin {
});

var DesktopGrid = GObject.registerClass({
    GTypeName: 'DesktopIcons_DesktopGrid',
}, class DesktopGrid extends St.Widget {
    _init(bgManager) {
        this._bgManager = bgManager;

        this._fileItemHandlers = new Map();
        this._fileItems = [];

        this.layout = new Clutter.GridLayout({
            orientation: Clutter.Orientation.VERTICAL,
            column_homogeneous: true,
            row_homogeneous: true
        });

        this._actorLayout = new Clutter.BinLayout({
            x_align: Clutter.BinAlignment.FIXED,
            y_align: Clutter.BinAlignment.FIXED
        });

        super._init({
            layout_manager: this._actorLayout
        });
        this._delegate = this;

        this.connect('style-changed', () => {
            if (this.isFirst)
                Extension.desktopManager.scheduleReLayoutChildren();
        });

        this._grid = new St.Widget({
            name: 'DesktopGrid',
            layout_manager: this.layout,
            reactive: true,
            x_expand: true,
            y_expand: true,
            can_focus: true,
            opacity: 255
        });
        this.add_child(this._grid);

        this._menuManager = new PopupMenu.PopupMenuManager(this);

        this._bgManager._container.add_child(this);

        let monitorIndex = bgManager._monitorIndex;
        this._monitorConstraint = new Layout.MonitorConstraint({
            index: monitorIndex,
            work_area: true
        });
        this.add_constraint(this._monitorConstraint);

        this._addDesktopBackgroundMenu();

        this._bgDestroyedId = bgManager.backgroundActor.connect('destroy',
            () => this._backgroundDestroyed());

        this._grid.connect('button-press-event', (actor, event) => this._onPressButton(actor, event));

        this._grid.connect('key-press-event', this._onKeyPress.bind(this));

        this._grid.connect('allocation-changed', () => Extension.desktopManager.scheduleReLayoutChildren());

        let themeNodeBase = this.get_theme_node();
        let themeContext = St.ThemeContext.get_for_stage(global.stage);
        let themeNode = St.ThemeNode.new(themeContext, null,
            themeNodeBase.get_theme(), themeNodeBase.get_element_type(),
            null, "file-item", null, "fake-id {}");
        this._extra_width =  themeNode.get_margin(St.Side.LEFT) +
                             themeNode.get_margin(St.Side.RIGHT) +
                             themeNode.get_border_width(St.Side.LEFT) +
                             themeNode.get_border_width(St.Side.RIGHT) +
                             themeNode.get_horizontal_padding();
        this._extra_height = themeNode.get_margin(St.Side.TOP) +
                             themeNode.get_margin(St.Side.BOTTOM) +
                             themeNode.get_border_width(St.Side.TOP) +
                             themeNode.get_border_width(St.Side.BOTTOM) +
                             themeNode.get_vertical_padding();

        this.connect('destroy', () => this._onDestroy());
    }

    _onKeyPress(actor, event) {
        if (global.stage.get_key_focus() != actor)
            return Clutter.EVENT_PROPAGATE;

        let symbol = event.get_key_symbol();
        let isCtrl = (event.get_state() & Clutter.ModifierType.CONTROL_MASK) != 0;
        let isShift = (event.get_state() & Clutter.ModifierType.SHIFT_MASK) != 0;

        if (isCtrl && isShift && [Clutter.KEY_Z, Clutter.KEY_z].indexOf(symbol) > -1) {
            this._doRedo();
            return Clutter.EVENT_STOP;
        }
        else if (isCtrl && [Clutter.KEY_Z, Clutter.KEY_z].indexOf(symbol) > -1) {
            this._doUndo();
            return Clutter.EVENT_STOP;
        }
        else if (isCtrl && [Clutter.KEY_C, Clutter.KEY_c].indexOf(symbol) > -1) {
            Extension.desktopManager.doCopy();
            return Clutter.EVENT_STOP;
        }
        else if (isCtrl && [Clutter.KEY_X, Clutter.KEY_x].indexOf(symbol) > -1) {
            Extension.desktopManager.doCut();
            return Clutter.EVENT_STOP;
        }
        else if (isCtrl && [Clutter.KEY_V, Clutter.KEY_v].indexOf(symbol) > -1) {
            this._doPaste();
            return Clutter.EVENT_STOP;
        }
        else if (symbol == Clutter.KEY_Return) {
            Extension.desktopManager.doOpen();
            return Clutter.EVENT_STOP;
        }
        else if (symbol == Clutter.KEY_Delete) {
            Extension.desktopManager.doTrash();
            return Clutter.EVENT_STOP;
        } else if (symbol == Clutter.KEY_F2) {
            // Support renaming other grids file items.
            Extension.desktopManager.doRename();
            return Clutter.EVENT_STOP;
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _backgroundDestroyed() {
        this._bgDestroyedId = 0;
        if (this._bgManager == null)
            return;

        if (this._bgManager._backgroundSource) {
            this._bgDestroyedId = this._bgManager.backgroundActor.connect('destroy',
                () => this._backgroundDestroyed());
        } else {
            this.destroy();
        }
    }

    _onDestroy() {
        if (this._bgDestroyedId && this._bgManager.backgroundActor)
            this._bgManager.backgroundActor.disconnect(this._bgDestroyedId);
        this._bgDestroyedId = 0;
        this._bgManager = null;
        this._menuManager = null;
    }

    _onNewFolderClicked() {

        let dialog = new CreateFolderDialog.CreateFolderDialog();

        dialog.connect('response', (dialog, name) => {
            let dir = DesktopIconsUtil.getDesktopDir().get_child(name);
            DBusUtils.NautilusFileOperationsProxy.CreateFolderRemote(dir.get_uri(),
                (result, error) => {
                    if (error)
                        throw new Error('Error creating new folder: ' + error.message);
                }
            );
        });

        dialog.open();
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

    _doPaste() {
        Clipboard.get_text(CLIPBOARD_TYPE,
            (clipboard, text) => {
                let [valid, is_cut, files] = this._parseClipboardText(text);
                if (!valid)
                    return;

                let desktopDir = `${DesktopIconsUtil.getDesktopDir().get_uri()}`;
                if (is_cut) {
                    DBusUtils.NautilusFileOperationsProxy.MoveURIsRemote(files, desktopDir,
                        (result, error) => {
                            if (error)
                                throw new Error('Error moving files: ' + error.message);
                        }
                    );
                } else {
                    DBusUtils.NautilusFileOperationsProxy.CopyURIsRemote(files, desktopDir,
                        (result, error) => {
                            if (error)
                                throw new Error('Error copying files: ' + error.message);
                        }
                    );
                }
            }
        );
    }

    _onPasteClicked() {
        this._doPaste();
    }

    _doUndo() {
        DBusUtils.NautilusFileOperationsProxy.UndoRemote(
            (result, error) => {
                if (error)
                    throw new Error('Error performing undo: ' + error.message);
            }
        );
    }

    _onUndoClicked() {
        this._doUndo();
    }

    _doRedo() {
        DBusUtils.NautilusFileOperationsProxy.RedoRemote(
            (result, error) => {
                if (error)
                    throw new Error('Error performing redo: ' + error.message);
            }
        );
    }

    _onRedoClicked() {
        this._doRedo();
    }

    _onOpenDesktopInFilesClicked() {
        Gio.AppInfo.launch_default_for_uri_async(DesktopIconsUtil.getDesktopDir().get_uri(),
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
        let desktopPath = DesktopIconsUtil.getDesktopDir().get_path();
        DesktopIconsUtil.launchTerminal(desktopPath);
    }

    _syncUndoRedo() {
        this._undoMenuItem.visible = DBusUtils.NautilusFileOperationsProxy.UndoStatus == UndoStatus.UNDO;
        this._redoMenuItem.visible = DBusUtils.NautilusFileOperationsProxy.UndoStatus == UndoStatus.REDO;
    }

    _undoStatusChanged(proxy, properties, test) {
        if ('UndoStatus' in properties.deep_unpack())
            this._syncUndoRedo();
    }

    _createDesktopBackgroundMenu() {
        let menu = new PopupMenu.PopupMenu(Main.layoutManager.dummyCursor,
                                           0, St.Side.TOP);
        menu.addAction(_("New Folder"), () => this._onNewFolderClicked());
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._pasteMenuItem = menu.addAction(_("Paste"), () => this._onPasteClicked());
        this._undoMenuItem = menu.addAction(_("Undo"), () => this._onUndoClicked());
        this._redoMenuItem = menu.addAction(_("Redo"), () => this._onRedoClicked());
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        menu.addAction(_("Show Desktop in Files"), () => this._onOpenDesktopInFilesClicked());
        menu.addAction(_("Open in Terminal"), () => this._onOpenTerminalClicked());
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        menu.addSettingsAction(_("Change Background…"), 'gnome-background-panel.desktop');
        menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        menu.addSettingsAction(_("Display Settings"), 'gnome-display-panel.desktop');
        menu.addSettingsAction(_("Settings"), 'gnome-control-center.desktop');

        menu.actor.add_style_class_name('background-menu');

        Main.layoutManager.uiGroup.add_child(menu.actor);
        menu.actor.hide();

        menu._propertiesChangedId = DBusUtils.NautilusFileOperationsProxy.connect('g-properties-changed',
            this._undoStatusChanged.bind(this));
        this._syncUndoRedo();

        menu.connect('destroy',
            () => DBusUtils.NautilusFileOperationsProxy.disconnect(menu._propertiesChangedId));
        menu.connect('open-state-changed',
            (popupm, isOpen) => {
                if (isOpen) {
                    Clipboard.get_text(CLIPBOARD_TYPE,
                        (clipBoard, text) => {
                            let [valid, is_cut, files] = this._parseClipboardText(text);
                            this._pasteMenuItem.setSensitive(valid);
                        }
                    );
                }
            }
        );
        this._pasteMenuItem.setSensitive(false);

        return menu;
    }

    _openMenu(x, y) {
        Main.layoutManager.setDummyCursorGeometry(x, y, 0, 0);
        this._desktopBackgroundMenu.open(BoxPointer.PopupAnimation.NONE);
        /* Since the handler is in the press event it needs to ignore the release event
         * to not immediately close the menu on release
         */
        this._menuManager.ignoreRelease();
    }

    _addFileItemTo(fileItem, column, row, coordinatesAction) {
        let placeholder = this.layout.get_child_at(column, row);
        placeholder.child = fileItem;
        this._fileItems.push(fileItem);
        let fileItemHandler = {};
        fileItemHandler.selectedId = fileItem.connect('selected',
            this._onFileItemSelected.bind(this));
        fileItemHandler.renameId = fileItem.connect('rename-clicked',
            this._onRenameClicked.bind(this));
        fileItemHandler.destroyId = fileItem.connect('destroy', () => {
            this._fileItemHandlers.delete(fileItem);
        });
        this._fileItemHandlers.set(fileItem, fileItemHandler);

        /* If this file is new in the Desktop and hasn't yet
         * fixed coordinates, store the new possition to ensure
         * that the next time it will be shown in the same possition.
         * Also store the new possition if it has been moved by the user,
         * and not triggered by a screen change.
         */
        if ((fileItem.savedCoordinates == null) || (coordinatesAction == StoredCoordinates.OVERWRITE)) {
            let [fileX, fileY] = placeholder.get_transformed_position();
            fileItem.savedCoordinates = [Math.round(fileX), Math.round(fileY)];
        }
    }

    addFileItemCloseTo(fileItem, x, y, coordinatesAction) {
        let [column, row] = this._getEmptyPlaceClosestTo(x, y, coordinatesAction);
        fileItem.set_margins(this._extra_width, this._extra_height);
        this._addFileItemTo(fileItem, column, row, coordinatesAction);
    }

    _getEmptyPlaceClosestTo(x, y, coordinatesAction) {

        let [actorX, actorY] = this._grid.get_transformed_position();
        let actorWidth = this._grid.allocation.x2 - this._grid.allocation.x1;
        let actorHeight = this._grid.allocation.y2 - this._grid.allocation.y1;
        let placeX = Math.round((x - actorX) * this._columns / actorWidth);
        let placeY = Math.round((y - actorY) * this._rows / actorHeight);

        placeX = DesktopIconsUtil.clamp(placeX, 0, this._columns - 1);
        placeY = DesktopIconsUtil.clamp(placeY, 0, this._rows - 1);
        if (this.layout.get_child_at(placeX, placeY).child == null)
            return [placeX, placeY];
        let found = false;
        let resColumn = null;
        let resRow = null;
        let minDistance = Infinity;
        for (let column = 0; column < this._columns; column++) {
            for (let row = 0; row < this._rows; row++) {
                let placeholder = this.layout.get_child_at(column, row);
                if (placeholder.child != null)
                    continue;

                let [proposedX, proposedY] = placeholder.get_transformed_position();
                if (coordinatesAction == StoredCoordinates.ASSIGN)
                    return [column, row];
                let distance = DesktopIconsUtil.distanceBetweenPoints(proposedX, proposedY, x, y);
                if (distance < minDistance) {
                    found = true;
                    minDistance = distance;
                    resColumn = column;
                    resRow = row;
                }
            }
        }

        if (!found)
            throw new Error(`Not enough place at monitor ${this._bgManager._monitorIndex}`);

        return [resColumn, resRow];
    }

    removeFileItem(fileItem) {
        let index = this._fileItems.indexOf(fileItem);
        if (index > -1)
            this._fileItems.splice(index, 1);
        else
            throw new Error('Error removing children from container');

        let [column, row] = this._getPosOfFileItem(fileItem);
        let placeholder = this.layout.get_child_at(column, row);
        placeholder.child = null;
        let fileItemHandler = this._fileItemHandlers.get(fileItem);
        Object.values(fileItemHandler).forEach(id => fileItem.disconnect(id));
        this._fileItemHandlers.delete(fileItem);
    }

    _fillPlaceholders() {
        this._rows = this._getMaxRows();
        this._columns = this._getMaxColumns();
        for (let column = 0; column < this._columns; column++) {
            for (let row = 0; row < this._rows; row++) {
                this.layout.attach(new Placeholder(), column, row, 1, 1);
            }
        }
    }

    reset() {
        let tmpFileItemsCopy = this._fileItems.slice();
        for (let fileItem of tmpFileItemsCopy)
            this.removeFileItem(fileItem);
        this._grid.remove_all_children();

        this._fillPlaceholders();
    }

    _onStageMotion(actor, event) {
        if (this._drawingRubberBand) {
            let [x, y] = event.get_coords();
            this._updateRubberBand(x, y);
            this._selectFromRubberband(x, y);
        }
        return Clutter.EVENT_PROPAGATE;
    }

    _onPressButton(actor, event) {
        let button = event.get_button();
        let [x, y] = event.get_coords();

        this._grid.grab_key_focus();

        if (button == 1) {
            let shiftPressed = !!(event.get_state() & Clutter.ModifierType.SHIFT_MASK);
            let controlPressed = !!(event.get_state() & Clutter.ModifierType.CONTROL_MASK);
            if (!shiftPressed && !controlPressed)
                Extension.desktopManager.clearSelection();
            let [gridX, gridY] = this._grid.get_transformed_position();
            Extension.desktopManager.startRubberBand(x, y, gridX, gridY);
            return Clutter.EVENT_STOP;
        }

        if (button == 3) {
            this._openMenu(x, y);

            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _addDesktopBackgroundMenu() {
        this._desktopBackgroundMenu = this._createDesktopBackgroundMenu();
        this._menuManager.addMenu(this._desktopBackgroundMenu);

        this.connect('destroy', () => {
            this._desktopBackgroundMenu.destroy();
            this._desktopBackgroundMenu = null;
        });
    }

    _getMaxColumns() {
        let gridWidth = this._grid.allocation.x2 - this._grid.allocation.x1;
        let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let desiredWidth = Prefs.getDesiredWidth(scaleFactor, this._extra_width);
        return Math.floor(gridWidth / desiredWidth);
    }

    _getMaxRows() {
        let gridHeight = this._grid.allocation.y2 - this._grid.allocation.y1;
        let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let desiredHeight = Prefs.getDesiredHeight(scaleFactor, this._extra_height);
        return Math.floor(gridHeight / desiredHeight);
    }

    acceptDrop(source, actor, x, y, time) {
        /* Coordinates are relative to the grid, we want to transform them to
         * absolute coordinates to work across monitors */
        let [gridX, gridY] = this.get_transformed_position();
        let [absoluteX, absoluteY] = [x + gridX, y + gridY];
        return Extension.desktopManager.acceptDrop(absoluteX, absoluteY);
    }

    _getPosOfFileItem(itemToFind) {
        if (itemToFind == null)
            throw new Error('Error at _getPosOfFileItem: child cannot be null');

        let found = false;
        let column = 0;
        let row = 0;
        for (column = 0; column < this._columns; column++) {
            for (row = 0; row < this._rows; row++) {
                let item = this.layout.get_child_at(column, row);
                if (item.child && item.child.file.equal(itemToFind.file)) {
                    found = true;
                    break;
                }
            }

            if (found)
                break;
        }

        if (!found)
            throw new Error('Position of file item was not found');

        return [column, row];
    }

    _onFileItemSelected(fileItem, keepCurrentSelection, rubberBandSelection, addToSelection) {
        this._grid.grab_key_focus();
    }

    _onRenameClicked(fileItem) {
        if (fileItem.menu && fileItem.menu.isOpen) {
            let id = fileItem.menu.connect('menu-closed', () => {
                fileItem.menu.disconnect(id);
                this.doRename(fileItem);
            });
        } else {
            this.doRename(fileItem);
        }
    }

    doRename(fileItem) {
        let renamePopup = new RenamePopup(fileItem);
        this._menuManager.addMenu(renamePopup);
        this._menuManager.ignoreRelease();

        renamePopup.connect('menu-closed', () => renamePopup.destroy());
        renamePopup.open();
    }
});

var RenamePopupMenuItem = GObject.registerClass(
class RenamePopupMenuItem extends PopupMenu.PopupBaseMenuItem {
    _init(fileItem) {
        super._init({
            style_class: 'rename-popup-item',
            reactive: false,
        });

        if (PopupMenu.Ornament.HIDDEN !== undefined)
            this.setOrnament(PopupMenu.Ornament.HIDDEN);
        else /* Support version prior 3.34.1 */
            this._ornamentLabel.visible = false;

        this._fileItem = fileItem;

        // Entry
        this._entry = new St.Entry({
            x_expand: true,
            width: 200,
        });
        this.add_child(this._entry);

        this._entry.clutter_text.connect(
            'notify::text', this._validate.bind(this));
        this._entry.clutter_text.connect(
            'activate', this._onRenameAccepted.bind(this));

        // Rename button
        this._button = new St.Button({
            style_class: 'button',
            reactive: true,
            button_mask: St.ButtonMask.ONE | St.ButtonMask.TWO,
            can_focus: true,
            label: _('Rename'),
        });
        this.add_child(this._button);
        this._button.connect('clicked', this._onRenameAccepted.bind(this));
    }

    vfunc_map() {
        this._entry.text = this._fileItem.displayName;
        this._entry.clutter_text.set_selection(0, -1);
        super.vfunc_map();
    }

    vfunc_key_focus_in() {
        super.vfunc_key_focus_in();
        this._entry.clutter_text.grab_key_focus();
    }

    _isValidFolderName() {
        let newName = this._entry.text.trim();

        return newName.length > 0 && newName.indexOf('/') === -1 &&
               newName != this._fileItem.displayName;
    }

    _validate() {
        this._button.reactive = this._isValidFolderName();
    }

    _onRenameAccepted() {
        if (!this._isValidFolderName())
            return;

        DBusUtils.NautilusFileOperationsProxy.RenameFileRemote(
            this._fileItem.file.get_uri(),
            this._entry.text.trim(),
            (result, error) => {
                if (error)
                    throw new Error('Error renaming file: ' + error.message);
            }
        );

        this.activate(Clutter.get_current_event());
    }
});

var RenamePopup = class RenameFolderMenu extends PopupMenu.PopupMenu {
    constructor(fileItem) {
        super(fileItem, 0.5, St.Side.TOP);
        this.actor.add_style_class_name('rename-popup');

        // We want to keep the item hovered while the menu is up
        this.blockSourceEvents = true;

        let menuItem = new RenamePopupMenuItem(fileItem);
        this.addMenuItem(menuItem);

        if (this.focusActor !== undefined) {
            // Focus the text entry on menu pop-up, works starting 3.34.1
            this.focusActor = menuItem;
        } else {
            this.connect('open-state-changed', (_menu, state) => {
                if (state)
                    this._openId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                        delete this._openId;
                        menuItem.grab_key_focus()
                    });
                else if (this._openId)
                    GLib.source_remove(this._openId);
            });
        }

        // Chain our visibility and lifecycle to that of the fileItem source
        this._fileItemMappedId = fileItem.connect('notify::mapped', () => {
            if (!fileItem.mapped)
                this.close();
        });
        fileItem.connect('destroy', () => {
            fileItem.disconnect(this._fileItemMappedId);
            this.destroy();
        });

        Main.uiGroup.add_actor(this.actor);
    }
};
