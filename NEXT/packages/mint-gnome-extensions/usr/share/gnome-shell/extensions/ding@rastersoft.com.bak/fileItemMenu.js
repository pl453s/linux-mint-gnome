/* DING: Desktop Icons New Generation for GNOME Shell
 *
 * Copyright (C) 2021 Sergio Costas (rastersoft@gmail.com)
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

const DBusUtils = imports.dbusUtils;
const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;

const TemplatesScriptsManager = imports.templatesScriptsManager;
const DesktopIconsUtil = imports.desktopIconsUtil;
const Prefs = imports.preferences;
const ShowErrorPopup = imports.showErrorPopup;

const Gettext = imports.gettext.domain('ding');

const _ = Gettext.gettext;

var FileItemMenu = class {
    constructor(desktopManager) {
        this._desktopManager = desktopManager;
        this._decompressibleTypes = [];
        this._getExtractionSupportedTypes();
        this._scriptsMonitor = new TemplatesScriptsManager.TemplatesScriptsManager(
            DesktopIconsUtil.getScriptsDir(),
            TemplatesScriptsManager.TemplatesScriptsManagerFlags.ONLY_EXECUTABLE,
            this._onScriptClicked.bind(this));

    }

    _getExtractionSupportedTypes() {
        DBusUtils.GnomeArchiveManagerProxy.GetSupportedTypesRemote('extract',
            (result, error) => {
                if (error) {
                    throw new Error('Error getting extractable Types' + error.message);
                }
                for (let key of result.values()) {
                    for (let type of key.values()) {
                        this._decompressibleTypes.push(Object.values(type)[0]);
                    }
                }
            }
        );
    }

    _onScriptClicked(menuItemPath) {
        let pathList = [];
        let uriList = [];
        for (let item of this._desktopManager.getCurrentSelection(false) ) {
            if (!item.isSpecial) {
                pathList.push("'" + item.file.get_path() + "\n'");
                uriList.push("'" + item.file.get_uri() + "\n'");
            }
        }
        pathList = pathList.join("");
        uriList = uriList.join("");
        let deskTop = "'" + DesktopIconsUtil.getDesktopDir().get_uri() + "'";
        let execline = `/bin/bash -c "`;
        execline += `NAUTILUS_SCRIPT_SELECTED_FILE_PATHS=${pathList} `;
        execline += `NAUTILUS_SCRIPT_SELECTED_URIS=${uriList} `;
        execline += `NAUTILUS_SCRIPT_CURRENT_URI=${deskTop} `;
        execline += `'${menuItemPath}'"`;
        DesktopIconsUtil.spawnCommandLine(execline);
    }

    showMenu(fileItem, event) {

        let addElementToMenu = function(label, action = null) {
            let element = new Gtk.MenuItem({label: label});
            this._menu.add(element);
            if (action) {
                element.connect('activate', action);
            }
            return element;
        }.bind(this);

        let addSeparator = function() {
            this._menu.add(new Gtk.SeparatorMenuItem());
        }.bind(this);

        let selectedItemsNum = this._desktopManager.getNumberOfSelectedItems();

        this._menu = new Gtk.Menu();
        this._menu.connect_after('selection-done', () => {
            this._menu.destroy();
            this._menu = null;
        });

        addElementToMenu(
            selectedItemsNum > 1 ? _("Open All...") : _("Open"),
            this._doMultiOpen.bind(this)
        );

        // fileExtra == NONE

        if (fileItem.isAllSelectable) {

            let submenu = this._scriptsMonitor.createMenu();
            if (submenu !== null) {
                addElementToMenu(_("Scripts")).set_submenu(submenu);
                addSeparator();
            }

            if (!fileItem.isDirectory) {
                addElementToMenu(
                    selectedItemsNum > 1 ? _("Open All With Other Application...") : _("Open With Other Application"),
                    this._doOpenWith.bind(this)
                ).set_sensitive(selectedItemsNum > 0);

                if (DBusUtils.discreteGpuAvailable && fileItem.trustedDesktopFile) {
                    addElementToMenu(
                        _('Launch using Dedicated Graphics Card'),
                        () => {fileItem.doDiscreteGpu();}
                    );
                }
            }

            addSeparator();

            let allowCutCopyTrash = this._desktopManager.checkIfSpecialFilesAreSelected();
            addElementToMenu(
                _('Cut'),
                () => {this._desktopManager.doCut();}
            ).set_sensitive(!allowCutCopyTrash);

            addElementToMenu(
                _('Copy'),
                () => {this._desktopManager.doCopy();}
            ).set_sensitive(!allowCutCopyTrash);

            if (fileItem.canRename && (selectedItemsNum == 1)) {
                addElementToMenu(
                    _('Rename…'),
                    () => {this._desktopManager.doRename(fileItem, false);}
                );
            }

            addElementToMenu(
                _('Move to Trash'),
                () => {this._desktopManager.doTrash();}
            ).set_sensitive(!allowCutCopyTrash);

            if (Prefs.nautilusSettings.get_boolean('show-delete-permanently')) {
                addElementToMenu(
                    _('Delete permanently'),
                    () => {this._desktopManager.doDeletePermanently();}
                ).set_sensitive(!allowCutCopyTrash);
            }

            if (fileItem.isValidDesktopFile && !this._desktopManager.writableByOthers && !fileItem.writableByOthers && (selectedItemsNum == 1 )) {
                addSeparator();
                addElementToMenu(
                    fileItem.trustedDesktopFile ? _("Don't Allow Launching") : _("Allow Launching"),
                    () => {fileItem.onAllowDisallowLaunchingClicked();}
                );
            }
        }

        // fileExtra == TRASH

        if (fileItem.isTrash) {
            addSeparator();
            addElementToMenu(
                _('Empty Trash'),
                () => {this._desktopManager.doEmptyTrash();}
            );
        }

        // fileExtra == EXTERNAL_DRIVE

        if (fileItem.isDrive) {
            addSeparator();
            if (fileItem.canEject) {
                addElementToMenu(
                    _('Eject'),
                    () => {fileItem.eject();}
                );
            }
            if (fileItem.canUnmount) {
                addElementToMenu(
                    _('Unmount'),
                    () => {fileItem.unmount();}
                );
            }
        }

        addSeparator();

        if (fileItem.isAllSelectable && (!this._desktopManager.checkIfSpecialFilesAreSelected()) && (selectedItemsNum >= 1 )) {
            if (selectedItemsNum == 1 && this._getExtractable()) {
                addElementToMenu(
                    _("Extract Here"),
                    () => {this._extractFileFromSelection(true);}
                );
                addElementToMenu(
                    _("Extract To..."),
                    () => {this._extractFileFromSelection(false);}
                );
            }

            if (!fileItem.isDirectory) {
                addElementToMenu(
                    _('Send to...'),
                    this._mailFilesFromSelection.bind(this)
                );
            }

            addElementToMenu(
                Gettext.ngettext('Compress {0} file', 'Compress {0} files', selectedItemsNum).replace('{0}', selectedItemsNum),
                this._doCompressFilesFromSelection.bind(this)
            );


            addElementToMenu(
                Gettext.ngettext('New Folder with {0} item', 'New Folder with {0} items' , selectedItemsNum).replace('{0}', selectedItemsNum),
                () => {this._doNewFolderFromSelection(fileItem.savedCoordinates, fileItem);}
            );

            addSeparator();
        }

        addElementToMenu(
            selectedItemsNum > 1 ? _('Common Properties') : _('Properties'),
            this._onPropertiesClicked.bind(this)
        );

        addSeparator();

        addElementToMenu(
            selectedItemsNum > 1 ? _('Show All in Files') : _('Show in Files'),
            this._onShowInFilesClicked.bind(this)
        );


        if (fileItem.isDirectory && (fileItem.path != null) && (selectedItemsNum == 1)) {
            addElementToMenu(
                _('Open in Terminal'),
                () => {DesktopIconsUtil.launchTerminal(fileItem.path, null);}
            );
        }

        this._menu.show_all();
        this._menu.popup_at_pointer(event);
    }

    _onPropertiesClicked() {
        let propertiesFileList = this._desktopManager.getCurrentSelection(true);
        DBusUtils.FreeDesktopFileManagerProxy.ShowItemPropertiesRemote(propertiesFileList, '',
            (result, error) => {
                if (error)
                    log('Error showing properties: ' + error.message);
            }
        );
    }

    _onShowInFilesClicked() {
        let showInFilesList = this._desktopManager.getCurrentSelection(true);
        DBusUtils.FreeDesktopFileManagerProxy.ShowItemsRemote(showInFilesList, '',
            (result, error) => {
                if (error)
                    log('Error showing file on desktop: ' + error.message);
            }
        );
    }

    _doMultiOpen() {
        for (let fileItem of this._desktopManager.getCurrentSelection(false)) {
            fileItem.unsetSelected();
            fileItem.doOpen() ;
        }
    }

    _doOpenWith() {
        let fileItems = this._desktopManager.getCurrentSelection(false);
        if (fileItems) {
            let mimetype = Gio.content_type_guess(fileItems[0].fileName, null)[0];
            let chooser = Gtk.AppChooserDialog.new_for_content_type(null,
                                                                    Gtk.DialogFlags.MODAL + Gtk.DialogFlags.USE_HEADER_BAR,
                                                                    mimetype);
            chooser.show_all();
            let retval = chooser.run();
            chooser.hide();
            if (retval == Gtk.ResponseType.OK) {
                let appInfo = chooser.get_app_info();
                if (appInfo) {
                    let fileList = [];
                    for (let item of fileItems) {
                        fileList.push(item.file);
                    }
                    appInfo.launch(fileList, null);
                }
            }
        }
    }

    _extractFileFromSelection(extractHere) {
        let extractFileItem = '';
        let folder = ''
        for (let fileItem of this._desktopManager.getCurrentSelection(false)) {
            extractFileItem = fileItem.file.get_uri();
            fileItem.unsetSelected();
        }
        if (extractHere) {
            folder = DesktopIconsUtil.getDesktopDir().get_uri();
        } else {
            let dialog = new Gtk.FileChooserDialog({title: _('Select Extract Destination')});
            dialog.set_action(Gtk.FileChooserAction.SELECT_FOLDER);
            dialog.add_button(_('Cancel'), Gtk.ResponseType.CANCEL);
            dialog.add_button(_('Select'), Gtk.ResponseType.ACCEPT);
            DesktopIconsUtil.windowHidePagerTaskbarModal(dialog, true);
            let response = dialog.run();
            if (response === Gtk.ResponseType.ACCEPT) {
                folder = dialog.get_uri();
            }
            dialog.destroy();
        }
        if (folder) {
            DBusUtils.GnomeArchiveManagerProxy.ExtractRemote(extractFileItem, folder, true,
                (result, error) => {
                    if (error) {
                        throw new Error('Error extracting files: ' + error.message);
                    }
                }
            );
        }
    }

    _getExtractable() {
        for (let item of this._desktopManager.getCurrentSelection(false)) {
            return this._decompressibleTypes.includes(item._attributeContentType);
        }
    }

    _mailFilesFromSelection() {
        if (this._desktopManager.checkIfDirectoryIsSelected()) {
            let WindowError = new ShowErrorPopup.ShowErrorPopup(_("Can not email a Directory"),
                                                                _("Selection includes a Directory, compress the directory to a file first."),
                                                                null,
                                                                false);
            WindowError.run();
            return;
        }
        let xdgEmailCommand = [];
        xdgEmailCommand.push('xdg-email')
        for (let fileItem of this._desktopManager.getCurrentSelection(false)) {
            fileItem.unsetSelected;
            xdgEmailCommand.push('--attach');
            xdgEmailCommand.push(fileItem.file.get_path());
        }
        DesktopIconsUtil.trySpawn(null, xdgEmailCommand);
    }

    _doCompressFilesFromSelection() {
        let compressFileItems = this._desktopManager.getCurrentSelection(true);
        this._desktopManager.unselectAll();
        let desktopFolder = DesktopIconsUtil.getDesktopDir().get_uri();
        if (desktopFolder) {
            DBusUtils.GnomeArchiveManagerProxy.CompressRemote(compressFileItems, desktopFolder, true,
                (result, error) => {
                    if (error) {
                        throw new Error('Error compressing files: ' + error.message);
                    }
                }
            );
        }
    }

    _doNewFolderFromSelection(position, clickedItem) {
        let newFolderFileItems = this._desktopManager.getCurrentSelection(true);
        this._desktopManager.unselectAll();
        clickedItem.removeFromGrid(true);
        let newFolder = this._desktopManager.doNewFolder(position);
        if (newFolder) {
            DBusUtils.NautilusFileOperations2Proxy.MoveURIsRemote(
                newFolderFileItems, newFolder,
                DBusUtils.NautilusFileOperations2Proxy.platformData(),
                (result, error) => {
                    if (error) {
                        throw new Error('Error moving files: ' + error.message);
                    }
                }
            );
        }
    }
}
