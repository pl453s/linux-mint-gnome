/**
 * API Library
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2021
 * @license    GNU General Public License v3.0
 */

const NOTIFICATION_BANNER_POSITION = {
    TOP_START: 0,
    TOP_CENTER: 1,
    TOP_END: 2,
};

const PANEL_POSITION = {
    TOP: 0,
    BOTTOM: 1,
};

const PANEL_BOX_POSITION = {
    CENTER: 0,
    RIGHT: 1,
    LEFT: 2,
};

const SHELL_STATUS = {
    NONE: 0,
    OVERVIEW: 1,
};

const ICON_TYPE = {
    NAME: 0,
    URI: 1,
};

const DASH_ICON_SIZES = [16, 22, 24, 32, 48, 64];

/**
 * API to avoid calling GNOME Shell directly
 * and make all parts compatible with different GNOME Shell versions 
 */
var API = class
{
    /**
     * Class Constructor
     *
     * @param {Object} dependecies
     *   'Main' reference to ui::main
     *   'BackgroundMenu' reference to ui::backgroundMenu
     *   'OverviewControls' reference to ui::overviewControls
     *   'WorkspaceSwitcherPopup' reference to ui::workspaceSwitcherPopup
     *   'InterfaceSettings' reference to Gio::Settings for 'org.gnome.desktop.interface'
     *   'SearchController' reference to ui::searchController
     *   'ViewSelector' reference to ui::viewSelector
     *   'WorkspaceThumbnail' reference to ui::workspaceThumbnail
     *   'WorkspacesView' reference to ui::workspacesView
     *   'Panel' reference to ui::panel
     *   'WindowPreview' reference to ui::windowPreview
     *   'Workspace' reference to ui::workspace
     *   'LookingGlass' reference to ui::lookingGlass
     *   'St' reference to St
     *   'Gio' reference to Gio
     *   'GLib' reference to GLib
     *   'Clutter' reference to Clutter
     *   'Util' reference to misc::util
     *   'Meta' reference to Meta
     * @param {number} shellVersion float in major.minor format
     */
    constructor(dependecies, shellVersion)
    {
        this._main = dependecies['Main'] || null;
        this._backgroundMenu = dependecies['BackgroundMenu'] || null;
        this._overviewControls = dependecies['OverviewControls'] || null;
        this._workspaceSwitcherPopup = dependecies['WorkspaceSwitcherPopup'] || null;
        this._interfaceSettings = dependecies['InterfaceSettings'] || null;
        this._searchController = dependecies['SearchController'] || null;
        this._viewSelector = dependecies['ViewSelector'] || null;
        this._workspaceThumbnail = dependecies['WorkspaceThumbnail'] || null;
        this._workspacesView = dependecies['WorkspacesView'] || null;
        this._panel = dependecies['Panel'] || null;
        this._windowPreview = dependecies['WindowPreview'] || null;
        this._workspace = dependecies['Workspace'] || null;
        this._lookingGlass = dependecies['LookingGlass'] || null;
        this._st = dependecies['St'] || null;
        this._gio = dependecies['Gio'] || null;
        this._glib = dependecies['GLib'] || null;
        this._clutter = dependecies['Clutter'] || null;
        this._util = dependecies['Util'] || null;
        this._meta = dependecies['Meta'] || null;

        this._shellVersion = shellVersion;
        this._originals = {};

        /**
         * whether seach entry is visible
         *
         * @member {boolean}
         */
        this._searchEntryVisible = true;

        /**
         * last workspace switcher size in float
         *
         * @member {number}
         */
        this._workspaceSwitcherLastSize
        = (this._workspaceThumbnail && this._shellVersion >= 40)
        ? this._workspaceThumbnail.MAX_THUMBNAIL_SCALE
        : 0.0;
    }

    /**
     * prepare everything needed for API
     *
     * @returns {void}
     */
    open()
    {
        this.UIstyleClassAdd(this._getAPIClassname('shell-version'));
    }

    /**
     * remove everything from GNOME Shell been added by this class 
     *
     * @returns {void}
     */
    close()
    {
        this.UIStyleClassRemove(this._getAPIClassname('shell-version'));
        this._startSearchSignal(false);
    }

    /**
     * get the css classname for API
     *
     * @param {string} type possible types
     *  shell-version
     *  no-search
     *  no-workspace
     *  no-panel
     *  panel-corner
     *  no-window-picker-icon
     *  type-to-search
     *  no-power-icon
     *  bottom-panel
     *  no-panel-arrow
     *  no-panel-notification-icon
     *  no-app-menu-icon
     *  no-show-apps-button
     *  activities-button-icon
     *  activities-button-icon-monochrome
     *  activities-button-no-label
     *  dash-icon-size
     *  panel-button-padding-size
     *  panel-indicator-padding-size
     *  no-window-caption
     *  workspace-background-radius-size
     *  no-window-close
     *
     * @returns {string}
     */
    _getAPIClassname(type)
    {
        let starter = 'just-perfection-api-';

        let possibleTypes = [
            'shell-version',
            'no-search',
            'no-workspace',
            'no-panel',
            'panel-corner',
            'no-window-picker-icon',
            'type-to-search',
            'no-power-icon',
            'bottom-panel',
            'no-panel-arrow',
            'no-panel-notification-icon',
            'no-app-menu-icon',
            'no-show-apps-button',
            'activities-button-icon',
            'activities-button-icon-monochrome',
            'activities-button-no-label',
            'dash-icon-size',
            'panel-button-padding-size',
            'panel-indicator-padding-size',
            'no-window-caption',
            'workspace-background-radius-size',
            'no-window-close',
        ];

        if (!possibleTypes.includes(type)) {
            return '';
        }

        if (type === 'shell-version') {
            let shellVerMajor = Math.trunc(this._shellVersion);
            return `${starter}gnome${shellVerMajor}`;
        }

        return starter + type;
    }

    /**
     * allow shell theme use its own panel corner
     *
     * @returns {void}
     */
    panelCornerSetDefault()
    {
        let classnameStarter = this._getAPIClassname('panel-corner');

        for (let size = 0; size <= 60; size++) {
            this.UIStyleClassRemove(classnameStarter + size);
        }
    }

    /**
     * change panel corner size
     *
     * @param {number} size 0 to 60
     *
     * @returns {void}
     */
    panelCornerSetSize(size)
    {
        this.panelCornerSetDefault();

        if (size > 60 || size < 0) {
            return;
        }

        let classnameStarter = this._getAPIClassname('panel-corner');

        this.UIstyleClassAdd(classnameStarter + size);
    }

    /**
     * set panel size to default
     *
     * @returns {void}
     */
    panelSetDefaultSize()
    {
        if (!this._originals['panelHeight']) {
            return;
        }
        
        this.panelSetSize(this._originals['panelHeight'], false);
    }

    /**
     * change panel size
     *
     * @param {number} size 0 to 100
     * @param {boolean} fake true means it shouldn't change the last size,
     *   false otherwise
     *
     * @returns {void}
     */
    panelSetSize(size, fake)
    {
        if (!this._originals['panelHeight']) {
            this._originals['panelHeight'] = this._main.panel.height;
        }

        if (size > 100 || size < 0) {
            return;
        }

        this._main.panel.height = size;

        if (!fake) {
            this._panelSize = size;
        }

        // to fix bottom panel not geting out of the display area
        if (this.panelGetPosition() === PANEL_POSITION.BOTTOM) {
            this.panelSetPosition(PANEL_POSITION.BOTTOM);
        }
    }

    /**
     * get the last size of the panel
     *
     * @returns {number}
     */
    panelGetSize()
    {
        if (this._panelSize !== undefined) {
            return this._panelSize;
        }
        
        if (this._originals['panelHeight']) {
            return this._originals['panelHeight'];
        }

        return this._main.panel.height;
    }

    /**
     * show panel
     *
     * @returns {void}
     */
    panelShow()
    {
        let classname = this._getAPIClassname('no-panel');

        if (!this.UIStyleClassContain(classname)) {
            return;
        }

        this._main.panel.show();
        this.panelSetSize(this.panelGetSize(), false);

        this.UIStyleClassRemove(classname);

        if (this._panelHideTimeoutId) {
            this._glib.source_remove(this._panelHideTimeoutId);
            delete(this._panelHideTimeoutId);
        }

        // setting panel position will fix
        // the panelBox.set_position(1, 1) hack we did on this.panelHide() 
        this.panelSetPosition(this.panelGetPosition());
    }

    /**
     * hide panel
     *
     * @returns {void}
     */
    panelHide()
    {
        let classname = this._getAPIClassname('no-panel');

        if (this.UIStyleClassContain(classname)) {
            return;
        }

        this._main.panel.hide();
        this.panelSetSize(0, true);

        // when panel is hidden and search entry is visible,
        // the search entry gets too close to the top, so we fix it with margin
        // on GNOME 3 we need to have top and bottom margin for correct proportion
        // but on GNOME 40 we don't need to keep proportion but give it more
        // top margin to keep it less close to top
        this.UIstyleClassAdd(classname);

        // we have window maximize issue on Wayland
        // only the focused window will have correct maximized area
        // the other ones will have panel gap at top
        // to fix that we need to change panelbox position after a short delay
        // set_position will emit 'notify::allocation'
        // and can fix the bad window positioning
        // since panel is hidden it won't cause any issues for window position
        if (this._meta.is_wayland_compositor()) {
            this._panelHideTimeoutId = this._glib.timeout_add(
                this._glib.PRIORITY_DEFAULT, 150, () => {
                    let panelBox = this._main.layoutManager.panelBox;
                    panelBox.set_position(1, 1);
                    
                    delete this._panelHideTimeoutId;

                    return this._glib.SOURCE_REMOVE;
                });
        }
    }

    /**
     * check whether panel is visible
     *
     * @returns {boolean}
     */
    isPanelVisible()
    {
        return this._main.panel.visible;
    }

    /**
     * check whether dash is visible
     *
     * @returns {boolean}
     */
    isDashVisible()
    {
        return this._dashVisiblity === undefined || this._dashVisiblity;
    }

    /**
     * show dash
     *
     * @returns {void}
     */
    dashShow()
    {
        if (!this._main.overview.dash || this.isDashVisible()) {
            return;
        }

        this._dashVisiblity = true;

        this._main.overview.dash.show();

        if (this._shellVersion >= 40) {
            this._main.overview.dash.height = -1;
            this._main.overview.dash.setMaxSize(-1, -1);
        } else {
            this._main.overview.dash.width = -1;
            this._main.overview.dash._maxHeight = -1;
        }
    }

    /**
     * hide dash
     *
     * @returns {void}
     */
    dashHide()
    {
        if (!this._main.overview.dash || !this.isDashVisible()) {
            return;
        }

        this._dashVisiblity = false;

        this._main.overview.dash.hide();

        if (this._shellVersion >= 40) {
            this._main.overview.dash.height = 0;
        } else {
            this._main.overview.dash.width = 0;
        }
    }

    /**
     * enable gesture
     *
     * @returns {void}
     */
    gestureEnable()
    {
        global.stage.get_actions().forEach(a => {
            a.enabled = true;
        });
    }

    /**
     * disable gesture
     *
     * @returns {void}
     */
    gestureDisable()
    {
        global.stage.get_actions().forEach(a => {
            a.enabled = false;
        });
    }

    /**
     * add class name to the UI group
     *
     * @param {string} classname class name
     *
     * @returns {void}
     */
    UIstyleClassAdd(classname)
    {
        this._main.layoutManager.uiGroup.add_style_class_name(classname);
    }

    /**
     * remove class name from UI group
     *
     * @param {string} classname class name
     *
     * @returns {void}
     */
    UIStyleClassRemove(classname)
    {
        this._main.layoutManager.uiGroup.remove_style_class_name(classname);
    }

    /**
     * check whether UI group has class name
     *
     * @param {string} classname class name
     *
     * @returns {boolean}
     */
    UIStyleClassContain(classname)
    {
        return this._main.layoutManager.uiGroup.has_style_class_name(classname);
    }

    /**
     * enable background menu
     *
     * @returns {void}
     */
    backgroundMenuEnable()
    {
        if (!this._originals['backgroundMenu']) {
            return;
        }

        this._backgroundMenu.BackgroundMenu.prototype.open
        = this._originals['backgroundMenu'];
    }

    /**
     * disable background menu
     *
     * @returns {void}
     */
    backgroundMenuDisable()
    {
        if (!this._originals['backgroundMenu']) {
            this._originals['backgroundMenu']
            = this._backgroundMenu.BackgroundMenu.prototype.open;
        }

        this._backgroundMenu.BackgroundMenu.prototype.open = () => {};
    }

    /**
     * show search
     *
     * @param {boolean} fake true means it just needs to do the job but
     *   don't need to change the search visiblity status
     *
     * @returns {void}
     */
    searchEntryShow(fake)
    {
        let classname = this._getAPIClassname('no-search');

        if (!this.UIStyleClassContain(classname)) {
            return;
        }

        this.UIStyleClassRemove(classname);

        let searchEntry = this._main.overview.searchEntry;
        let searchEntryParent = searchEntry.get_parent();

        searchEntryParent.ease({
            height: searchEntry.height,
            opacity: 255,
            mode: this._clutter.AnimationMode.EASE,
            duration: 150,
            onComplete: () => {
                searchEntry.ease({
                    opacity: 255,
                    mode: this._clutter.AnimationMode.EASE,
                    duration: 150,
                });
            },
        });

        if (!fake) {
            this._searchEntryVisible = true;
        }
    }

    /**
     * hide search
     *
     * @param {boolean} fake true means it just needs to do the job
     *   but don't need to change the search visiblity status
     *
     * @returns {void}
     */
    searchEntryHide(fake)
    {
        this.UIstyleClassAdd(this._getAPIClassname('no-search'));

        let searchEntry = this._main.overview.searchEntry;
        let searchEntryParent = searchEntry.get_parent();

        searchEntryParent.ease({
            height: 0,
            opacity: 0,
            mode: this._clutter.AnimationMode.EASE,
            duration: 150,
        });

        searchEntry.ease({
            opacity: 0,
            mode: this._clutter.AnimationMode.EASE,
            duration: 70,
        });

        if (!fake) {
            this._searchEntryVisible = false;
        }
    }

    /**
     * enable start search
     *
     * @returns {void}
     */
    startSearchEnable()
    {
        this._startSearchSignal(true);

        if (!this._originals['startSearch']) {
            return;
        }

        let viewSelector
        = this._main.overview.viewSelector || this._main.overview._overview.viewSelector;

        if (this._shellVersion >= 40 && this._searchController) {
            this._searchController.SearchController.prototype.startSearch
            = this._originals['startSearch'];
        } else {
            viewSelector.startSearch = this._originals['startSearch'];
        }
    }

    /**
     * disable start search
     *
     * @returns {void}
     */
    startSearchDisable()
    {
        this._startSearchSignal(false);

        let overview = this._main.overview;
        let viewSelector = overview.viewSelector || overview.viewSelector;

        if (!this._originals['startSearch']) {
            this._originals['startSearch']
            = (this._shellVersion >= 40 && this._searchController)
            ? this._searchController.SearchController.prototype.startSearch
            : viewSelector.startSearch;
        }

        if (this._shellVersion >= 40 && this._searchController) {
            this._searchController.SearchController.prototype.startSearch = () => {};
        } else {
            viewSelector.startSearch = () => {};
        }
    }

    /**
     * add search signals that needs to be show search entry when the
     * search entry is hidden
     *
     * @param {boolean} add true means add the signal, false means remove 
     *   the signal
     *
     * @returns {void}
     */
    _startSearchSignal(add)
    {
        let controller
        = this._main.overview.viewSelector ||
          this._main.overview._overview.viewSelector ||
          this._main.overview._overview.controls._searchController;

        // remove
        if (!add) {
            if (this._searchActiveSignal) {
                controller.disconnect(this._searchActiveSignal);
                this._searchActiveSignal = null;
            }
            return;
        }

        // add
        if (this._searchActiveSignal) {
            return;
        }

        let bySearchController = this._shellVersion >= 40;

        let signalName = (bySearchController) ? 'notify::search-active' : 'page-changed';

        this._searchActiveSignal = controller.connect(signalName, () => {

            if (this._searchEntryVisible) {
                return;
            }

            let inSearch
            = (bySearchController)
            ? controller.searchActive
            : (controller.getActivePage() === this._viewSelector.ViewPage.SEARCH);

            if (inSearch) {
                this.UIstyleClassAdd(this._getAPIClassname('type-to-search'));
                this.searchEntryShow(true);
            } else {
                this.UIStyleClassRemove(this._getAPIClassname('type-to-search'));
                this.searchEntryHide(true);
            }
        });
    }

    /**
     * enable OSD
     *
     * @returns {void}
     */
    OSDEnable()
    {
        if (!this._originals['osdWindowManager']) {
            return;
        }

        this._main.osdWindowManager.show = this._originals['osdWindowManager'];
    }

    /**
     * disable OSD
     *
     * @returns {void}
     */
    OSDDisable()
    {
        if (!this._originals['osdWindowManager']) {
            this._originals['osdWindowManager']
            = this._main.osdWindowManager.show;
        }

        this._main.osdWindowManager.show = () => {};
    }

    /**
     * enable workspace popup
     *
     * @returns {void}
     */
    workspacePopupEnable()
    {
        if (!this._originals['workspaceSwitcherPopup']) {
            return;
        }

        this._workspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype._show
        = this._originals['workspaceSwitcherPopup'];
    }

    /**
     * disable workspace popup
     *
     * @returns {void}
     */
    workspacePopupDisable()
    {
        if (!this._originals['workspaceSwitcherPopup']) {
            this._originals['workspaceSwitcherPopup']
            = this._workspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype._show;
        }

        this._workspaceSwitcherPopup.WorkspaceSwitcherPopup.prototype._show = () => {
           return false;
        };
    }

    /**
     * show workspace switcher
     *
     * @returns {void}
     */
    workspaceSwitcherShow()
    {
        if (this._shellVersion < 40) {

            if (!this._originals['getAlwaysZoomOut'] ||
                !this._originals['getNonExpandedWidth'])
            {
                return;
            }

            let TSProto = this._overviewControls.ThumbnailsSlider.prototype;

            TSProto._getAlwaysZoomOut = this._originals['getAlwaysZoomOut'];
            TSProto.getNonExpandedWidth = this._originals['getNonExpandedWidth'];
        }

        // it should be before setting the switcher size
        // because the size can be changed by removing the api class
        this.UIStyleClassRemove(this._getAPIClassname('no-workspace'));

        if (this._workspaceSwitcherLastSize) {
            this.workspaceSwitcherSetSize(this._workspaceSwitcherLastSize, false);
        } else {
            this.workspaceSwitcherSetDefaultSize();
        }
    }

    /**
     * hide workspace switcher
     *
     * @returns {void}
     */
    workspaceSwitcherHide()
    {
        if (this._shellVersion < 40) {

            let TSProto = this._overviewControls.ThumbnailsSlider.prototype;

            if (!this._originals['getAlwaysZoomOut']) {
                this._originals['getAlwaysZoomOut'] = TSProto._getAlwaysZoomOut;
            }

            if (!this._originals['getNonExpandedWidth']) {
                this._originals['getNonExpandedWidth'] = TSProto.getNonExpandedWidth;
            }

            TSProto._getAlwaysZoomOut = () => {
                return false;
            };
            TSProto.getNonExpandedWidth = () => {
                return 0;
            };
        }

        this.workspaceSwitcherSetSize(0.0, true);

        // on GNOME 3.38
        //   fix extra space that 3.38 leaves for no workspace with css
        // on GNOME 40
        //   we can hide the workspace only with css by scale=0 and
        //   no padding
        this.UIstyleClassAdd(this._getAPIClassname('no-workspace'));
    }

    /**
     * check whether workspace switcher is visible
     *
     * @returns {boolean}
     */
    isWorkspaceSwitcherVisible()
    {
        return !this.UIStyleClassContain(this._getAPIClassname('no-workspace'));
    }

    /**
     * set workspace switcher to its default size
     *
     * @returns {void}
     */
    workspaceSwitcherSetDefaultSize()
    {
        if (this._shellVersion < 40) {
            return;
        }

        if (this._originals['MAX_THUMBNAIL_SCALE'] === undefined) {
            return;
        }

        let size = this._originals['MAX_THUMBNAIL_SCALE'];

        if (this.isWorkspaceSwitcherVisible()) {
            this._workspaceThumbnail.MAX_THUMBNAIL_SCALE = size;
        }

        if (this._originals['smd_getThumbnailsHeight'] !== undefined) {
            let smd = this._workspacesView.SecondaryMonitorDisplay;
            smd._getThumbnailsHeight = this._originals['smd_getThumbnailsHeight'];
        }

        this._workspaceSwitcherLastSize = size;
    }

    /**
     * set workspace switcher size
     *
     * @param {number} size in float
     * @param {boolean} fake true means don't change 
     *   this._workspaceSwitcherLastSize, false otherwise
     *
     * @returns {void}
     */
    workspaceSwitcherSetSize(size, fake)
    {
        if (this._shellVersion < 40) {
            return;
        }

        if (this._originals['MAX_THUMBNAIL_SCALE'] === undefined) {
            this._originals['MAX_THUMBNAIL_SCALE']
            = this._workspaceThumbnail.MAX_THUMBNAIL_SCALE;
        }

        if (this.isWorkspaceSwitcherVisible()) {

            this._workspaceThumbnail.MAX_THUMBNAIL_SCALE = size;

            // >>
            // we are overriding the _getThumbnailsHeight() here with the same
            // function as original but we change the MAX_THUMBNAIL_SCALE to our
            // custom size.
            // we do this because MAX_THUMBNAIL_SCALE is const and cannot be cahnged
            let smd = this._workspacesView.SecondaryMonitorDisplay;

            if (this._originals['smd_getThumbnailsHeight'] === undefined) {
                this._originals['smd_getThumbnailsHeight'] = smd._getThumbnailsHeight;
            }
            
            smd.prototype._getThumbnailsHeight = function(box) {
                if (!this._thumbnails.visible)
                    return 0;

                const [width, height] = box.get_size();
                const {expandFraction} = this._thumbnails;
                const [thumbnailsHeight] = this._thumbnails.get_preferred_height(width);

                return Math.min(
                    thumbnailsHeight * expandFraction,
                    height * size);
            }
            // <<
        }

        if (!fake) {
            this._workspaceSwitcherLastSize = size;
        }
    }

    /**
     * toggle overview visiblity
     *
     * @returns {void}
     */
    overviewToggle()
    {
        this._main.overview.toggle();
    }

    /**
     * add element to stage
     *
     * @param {St.Widget} element widget 
     *
     * @returns {void}
     */
    chromeAdd(element)
    {
        this._main.layoutManager.addChrome(element, {
            affectsInputRegion : true,
            affectsStruts : false,
            trackFullscreen : true,
        });
    }

    /**
     * remove element from stage
     *
     * @param {St.Widget} element widget 
     *
     * @returns {void}
     */
    chromeRemove(element)
    {
        this._main.layoutManager.removeChrome(element);
    }

    /**
     * show activities button
     *
     * @returns {void}
     */
    activitiesButtonShow()
    {
        if (!this.isLocked()) {
            this._main.panel.statusArea['activities'].container.show();
        }
    }

    /**
     * hide activities button
     *
     * @returns {void}
     */
    activitiesButtonHide()
    {
        this._main.panel.statusArea['activities'].container.hide();
    }

    /**
     * show app menu
     *
     * @returns {void}
     */
    appMenuShow()
    {
        if (!this.isLocked()) {
            this._main.panel.statusArea['appMenu'].container.show();
        }
    }

    /**
     * hide app menu
     *
     * @returns {void}
     */
    appMenuHide()
    {
        this._main.panel.statusArea['appMenu'].container.hide();
    }

    /**
     * show date menu
     *
     * @returns {void}
     */
    dateMenuShow()
    {
        if (!this.isLocked()) {
            this._main.panel.statusArea['dateMenu'].container.show();
        }
    }

    /**
     * hide date menu
     *
     * @returns {void}
     */
    dateMenuHide()
    {
        this._main.panel.statusArea['dateMenu'].container.hide();
    }

    /**
     * show keyboard layout
     *
     * @returns {void}
     */
    keyboardLayoutShow()
    {
        this._main.panel.statusArea['keyboard'].container.show();
    }

    /**
     * hide keyboard layout
     *
     * @returns {void}
     */
    keyboardLayoutHide()
    {
        this._main.panel.statusArea['keyboard'].container.hide();
    }

    /**
     * show accessibility menu
     *
     * @returns {void}
     */
    accessibilityMenuShow()
    {
        this._main.panel.statusArea['a11y'].container.show();
    }

    /**
     * hide accessibility menu
     *
     * @returns {void}
     */
    accessibilityMenuHide()
    {
        this._main.panel.statusArea['a11y'].container.hide();
    }

    /**
     * show aggregate menu
     *
     * @returns {void}
     */
    aggregateMenuShow()
    {
        this._main.panel.statusArea['aggregateMenu'].container.show();
    }

    /**
     * hide aggregate menu
     *
     * @returns {void}
     */
    aggregateMenuHide()
    {
        this._main.panel.statusArea['aggregateMenu'].container.hide();
    }

    /**
     * set 'enableHotCorners' original value
     *
     * @returns {void}
     */
    _setEnableHotCornersOriginal()
    {
        if (this._originals['enableHotCorners'] !== undefined) {
            return;
        }

        this._originals['enableHotCorners']
        = this._interfaceSettings.get_boolean('enable-hot-corners');
    }

    /**
     * enable hot corners
     *
     * @returns {void}
     */
    hotCornersEnable()
    {
        this._setEnableHotCornersOriginal();
        this._interfaceSettings.set_boolean('enable-hot-corners', true);
    }

    /**
     * disable hot corners
     *
     * @returns {void}
     */
    hotCornersDisable()
    {
        this._setEnableHotCornersOriginal();
        this._interfaceSettings.set_boolean('enable-hot-corners', false);
    }

    /**
     * set the hot corners to default value
     *
     * @returns {void}
     */
    hotCornersDefault()
    {
        this._setEnableHotCornersOriginal();

        this._interfaceSettings.set_boolean('enable-hot-corners',
            this._originals['enableHotCorners']);
    }

    /**
     * check whether lock dialog is currently showing
     *
     * @returns {boolean}
     */
    isLocked()
    {
        if (this._main.sessionMode.currentMode === 'unlock-dialog') {
            return true;
        }

        return false;
    }

    /**
     * enable window picker icon
     *
     * @returns {void}
     */
    windowPickerIconEnable()
    {
        if (this._shellVersion < 40) {
            return;
        }

        this.UIStyleClassRemove(this._getAPIClassname('no-window-picker-icon'));
    }

    /**
     * disable window picker icon
     *
     * @returns {void}
     */
    windowPickerIconDisable()
    {
        if (this._shellVersion < 40) {
            return;
        }

        this.UIstyleClassAdd(this._getAPIClassname('no-window-picker-icon'));
    }

    /**
     * show power icon
     *
     * @returns {void}
     */
    powerIconShow()
    {
        this.UIStyleClassRemove(this._getAPIClassname('no-power-icon'));
    }

    /**
     * hide power icon
     *
     * @returns {void}
     */
    powerIconHide()
    {
        this.UIstyleClassAdd(this._getAPIClassname('no-power-icon'));
    }

    /**
     * get primary monitor information
     *
     * @returns {false|Object} false when monitor does not exist | object
     *  x: int
     *  y: int
     *  width: int
     *  height: int
     *  geometryScale: float
     */
    monitorGetInfo()
    {
        let pMonitor = this._main.layoutManager.primaryMonitor;

        if (!pMonitor) {
            return false;
        }

        return {
            'x': pMonitor.x,
            'y': pMonitor.y,
            'width': pMonitor.width,
            'height': pMonitor.height,
            'geometryScale': pMonitor.geometry_scale,
        };
    }

    /**
     * get panel position
     *
     * @returns {number} see PANEL_POSITION
     */
    panelGetPosition()
    {
        if (this._panelPosition === undefined) {
            return PANEL_POSITION.TOP;
        }

        return this._panelPosition;
    }

    /**
     * move panel position
     *
     * @param {number} position see PANEL_POSITION
     *
     * @returns {void}
     */
    panelSetPosition(position)
    {
        let monitorInfo = this.monitorGetInfo();
        let panelBox = this._main.layoutManager.panelBox;

        if (position === PANEL_POSITION.TOP) {
            this._panelPosition = PANEL_POSITION.TOP;
            if (this._workareasChangedSignal) {
                global.display.disconnect(this._workareasChangedSignal);
                this._workareasChangedSignal = null;
            }
            let topX = (monitorInfo) ? monitorInfo.x : 0;
            let topY = (monitorInfo) ? monitorInfo.y : 0;
            panelBox.set_position(topX, topY);
            this.UIStyleClassRemove(this._getAPIClassname('bottom-panel'));
            this._fixLookingGlassPosition();
            return;
        }

        this._panelPosition = PANEL_POSITION.BOTTOM;

        // only change it when a monitor detected
        // 'workareas-changed' signal will do the job on next monitor detection
        if (monitorInfo) {
            let BottomX = monitorInfo.x;
            let BottomY = monitorInfo.y + monitorInfo.height - this.panelGetSize();

            panelBox.set_position(BottomX, BottomY);
            this.UIstyleClassAdd(this._getAPIClassname('bottom-panel'));
        }

        if (!this._workareasChangedSignal) {
            this._workareasChangedSignal
            = global.display.connect('workareas-changed', () => {
                this.panelSetPosition('bottom');
            });
        }

        this._fixLookingGlassPosition();
    }

    /**
     * fix looking glass position
     *
     * @returns {void}
     */
    _fixLookingGlassPosition()
    {
        if (this._shellVersion < 40) {
            return;
        }

        let lookingGlassProto = this._lookingGlass.LookingGlass.prototype;

        if (this._panelPosition === PANEL_POSITION.TOP) {

            if (!this._originals['lookingGlassResize']) {
                return;
            }

            lookingGlassProto._resize = this._originals['lookingGlassResize'];
            delete(lookingGlassProto._oldResize);
            delete(this._originals['lookingGlassResize']);

            return;
        }

        if (!this._originals['lookingGlassResize']) {
            this._originals['lookingGlassResize'] = lookingGlassProto._resize;
        }

        const Main = this._main;

        lookingGlassProto._oldResize = this._originals['lookingGlassResize'];
        lookingGlassProto._resize = function () {
            let panelHeight = Main.layoutManager.panelBox.height;
            this._oldResize();
            this._targetY -= panelHeight;
            this._hiddenY -= panelHeight;
        };
    }

    /**
     * enable panel arrow
     *
     * @returns {void}
     */
    panelArrowEnable()
    {
        if (this._shellVersion >= 40) {
            return;
        }

        this.UIStyleClassRemove(this._getAPIClassname('no-panel-arrow'));
    }

    /**
     * disable panel arrow
     *
     * @returns {void}
     */
    panelArrowDisable()
    {
        if (this._shellVersion >= 40) {
            return;
        }

        this.UIstyleClassAdd(this._getAPIClassname('no-panel-arrow'));
    }

    /**
     * disable panel notifiction icon
     *
     * @returns {void}
     */
    panelNotificationIconEnable()
    {
        this.UIStyleClassRemove(this._getAPIClassname('no-panel-notification-icon'));
    }

    /**
     * disable panel notifiction icon
     *
     * @returns {void}
     */
    panelNotificationIconDisable()
    {
        this.UIstyleClassAdd(this._getAPIClassname('no-panel-notification-icon'));
    }

    /**
     * disable app menu icon
     *
     * @returns {void}
     */
    appMenuIconEnable()
    {
        this.UIStyleClassRemove(this._getAPIClassname('no-app-menu-icon'));
    }

    /**
     * disable app menu icon
     *
     * @returns {void}
     */
    appMenuIconDisable()
    {
        this.UIstyleClassAdd(this._getAPIClassname('no-app-menu-icon'));
    }

    /**
     * set the clock menu position
     *
     * @param {number} pos see PANEL_BOX_POSITION
     * @param {number} offset starts from 0 
     *
     * @returns {void}
     */
    clockMenuPositionSet(pos, offset)
    {
        let dateMenu = this._main.panel.statusArea['dateMenu'];

        let panelBoxs = [
            this._main.panel._centerBox,
            this._main.panel._rightBox,
            this._main.panel._leftBox,
        ];

        let fromPos = -1;
        let fromIndex = -1;
        let toIndex = -1;
        let childLength = 0;
        for (let i = 0; i <= 2; i++) {
            let child = panelBoxs[i].get_children();
            let childIndex = child.indexOf(dateMenu.container);
            if (childIndex !== -1) {
                fromPos = i;
                fromIndex = childIndex;
                childLength = panelBoxs[pos].get_children().length;
                toIndex = (offset > childLength) ? childLength : offset;
                break;
            }
        }

        // couldn't find the from and to position because it has been removed
        if (fromPos === -1 || fromIndex === -1 || toIndex === -1) {
            return;
        }

        if (pos === fromPos && toIndex === fromIndex) {
            return;
        }

        panelBoxs[fromPos].remove_actor(dateMenu.container);
        panelBoxs[pos].insert_child_at_index(dateMenu.container, toIndex);
    }

    /**
     * enable show apps button
     *
     * @returns {void}
     */
    showAppsButtonEnable()
    {
        if (!this._main.overview.dash) {
            return;
        }

        let container = this._main.overview.dash.showAppsButton.get_parent();
        container.remove_style_class_name(this._getAPIClassname('no-show-apps-button'));
    }

    /**
     * disable show apps button
     *
     * @returns {void}
     */
    showAppsButtonDisable()
    {
        if (!this._main.overview.dash) {
            return;
        }

        let container = this._main.overview.dash.showAppsButton.get_parent();
        container.add_style_class_name(this._getAPIClassname('no-show-apps-button'));
    }

    /**
     * set animation speed as default
     *
     * @returns {void}
     */
    animationSpeedSetDefault()
    {
        if (this._originals['StSlowDownFactor'] === undefined) {
            return;
        }

        this._st.Settings.get().slow_down_factor = this._originals['StSlowDownFactor'];
    }

    /**
     * change animation speed
     *
     * @param {number} factor in float. bigger number means slower
     *
     * @returns {void}
     */
    animationSpeedSet(factor)
    {
        if (this._originals['StSlowDownFactor'] === undefined) {
            this._originals['StSlowDownFactor']
            = this._st.Settings.get().slow_down_factor;
        }

        this._st.Settings.get().slow_down_factor = factor;
    }

    /**
     * set the enable animation as default
     *
     * @returns {void}
     */
    enablenAimationsSetDefault()
    {
        if (this._originals['enableAnimations'] === undefined) {
            return;
        }

        let status = this._originals['enableAnimations'];

        this._interfaceSettings.set_boolean('enable-animations', status);
    }

    /**
     * set the enable animation status
     *
     * @param {boolean} status true to enable, false otherwise
     *
     * @returns {void}
     */
    enablenAimationsSet(status)
    {
        if (this._originals['enableAnimations'] ===  undefined) {
            this._originals['enableAnimations']
            = this._interfaceSettings.get_boolean('enable-animations');
        }

        this._interfaceSettings.set_boolean('enable-animations', status);
    }

    /**
     * add icon to the activities button
     *
     * @param {number} type see ICON_TYPE
     * @param {string} icon file URI or icon name 
     * @param {boolean} monochrome to show icon in monochrome
     * @param {boolean} holdLabel whether label should be available
     *
     * @returns {void}
     */
    ativitiesButtonAddIcon(type, icon, monochrome, holdLabel)
    {
        let iconSize = this._panel.PANEL_ICON_SIZE - this._panel.APP_MENU_ICON_MARGIN;
        let activities = this._main.panel.statusArea['activities'];

        this.ativitiesButtonRemoveIcon();

        if (!this._activitiesBtn) { 
            this._activitiesBtn = {};
        }

        let iconClassname
        = (monochrome)
        ? this._getAPIClassname('activities-button-icon-monochrome')
        : this._getAPIClassname('activities-button-icon');

        this._activitiesBtn.icon = new this._st.Icon({
            icon_size: iconSize,
            style_class: iconClassname,
            y_align: this._clutter.ActorAlign.CENTER,
        });

        if (monochrome) {
            let effect = new this._clutter.DesaturateEffect();
            this._activitiesBtn.icon.add_effect(effect);

            this._activitiesBtn.icon.connect('style-changed', () => {
                let themeNode = this._activitiesBtn.icon.get_theme_node();
                effect.enabled
                = themeNode.get_icon_style() == this._st.IconStyle.SYMBOLIC;
            });
        }

        switch (type) {

            case ICON_TYPE.NAME:
                if (!icon) {
                    return;
                }
                this._activitiesBtn.icon.set_icon_name(icon);
                break;
            
            case ICON_TYPE.URI:
                let file = this._gio.File.new_for_uri(icon);
                let filePathExists = file.query_exists(null);
                if (!filePathExists) {
                    return;
                }
                let gicon = this._gio.icon_new_for_string(file.get_path());
                this._activitiesBtn.icon.set_gicon(gicon);
                break;
                
            default:
                return;
        }
        
        activities.remove_actor(activities.label_actor);

        // add as icon
        if (!holdLabel) {
            this.UIstyleClassAdd(this._getAPIClassname('activities-button-no-label'));
            activities.add_actor(this._activitiesBtn.icon);
            return;
        }

        // add as container (icon and text)
        this._activitiesBtn.container = new this._st.BoxLayout();
        this._activitiesBtn.container.add_actor(this._activitiesBtn.icon);
        this._activitiesBtn.container.add_actor(activities.label_actor);

        activities.add_actor(this._activitiesBtn.container);
    }

    /**
     * remove icon from activities button if it has been added before
     *
     * @returns {void}
     */
    ativitiesButtonRemoveIcon()
    {
        let activities = this._main.panel.statusArea['activities'];

        if (!this._activitiesBtn) {
            return;
        }

        if (this._activitiesBtn.container) {
            this._activitiesBtn.container.remove_actor(this._activitiesBtn.icon);
            this._activitiesBtn.container.remove_actor(activities.label_actor);
            activities.remove_actor(this._activitiesBtn.container);
            this._activitiesBtn.icon = null;
            this._activitiesBtn.container = null;
        }

        if (this._activitiesBtn.icon && activities.contains(this._activitiesBtn.icon)) {
            activities.remove_actor(this._activitiesBtn.icon);
            this._activitiesBtn.icon = null;
        }

        if (!activities.contains(activities.label_actor)) {
            activities.add_actor(activities.label_actor);
        }

        this.UIStyleClassRemove(this._getAPIClassname('activities-button-no-label'));
    }

    /**
     * enable focus when window demands attention happens
     *
     * @returns {void}
     */
    windowDemandsAttentionFocusEnable()
    {
        if (this._displayWindowDemandsAttentionSignal) {
            return;
        }
        
        let display = global.display;

        this._displayWindowDemandsAttentionSignal
        = display.connect('window-demands-attention', (display, window) => {
            if (!window || window.has_focus() || window.is_skip_taskbar()) {
                return;
            }
            this._main.activateWindow(window);
        });

        // since removing '_windowDemandsAttentionId' doesn't have any effect
        // we remove the original signal and re-connect it on disable
        display.disconnect(
            this._main.windowAttentionHandler._windowDemandsAttentionId);
    }

    /**
     * disable focus when window demands attention happens
     *
     * @returns {void}
     */
    windowDemandsAttentionFocusDisable()
    {
        if (!this._displayWindowDemandsAttentionSignal) {
            return;
        }

        let display = global.display;

        display.disconnect(this._displayWindowDemandsAttentionSignal);
        this._displayWindowDemandsAttentionSignal = null;

        let wah = this._main.windowAttentionHandler;
        wah._windowDemandsAttentionId = display.connect('window-demands-attention',
            wah._onWindowDemandsAttention.bind(wah));
    }

    /**
     * set startup status
     *
     * @param {number} status see SHELL_STATUS for available status
     *
     * @returns {void}
     */
    startupStatusSet(status)
    {
        if (this._shellVersion < 40) {
            return;
        }

        if (!this._main.layoutManager._startingUp) {
            return;
        }

        if (this._originals['sessionModeHasOverview'] === undefined) {
            this._originals['sessionModeHasOverview']
            = this._main.sessionMode.hasOverview;
        }

        let ControlsState = this._overviewControls.ControlsState;
        let Controls = this._main.overview._overview.controls;

        switch (status) {

            case SHELL_STATUS.NONE:
                this._main.sessionMode.hasOverview = false;
                Controls._stateAdjustment.value = ControlsState.HIDDEN;
                break;

            case SHELL_STATUS.OVERVIEW:
                this._main.sessionMode.hasOverview = true;
                break;
        }

        if (!this._startupCompleteSignal) {
            this._startupCompleteSignal
            = this._main.layoutManager.connect('startup-complete', () => {
                this._main.sessionMode.hasOverview
                = this._originals['sessionModeHasOverview'];
            });
        }
    }

    /**
     * set startup status to default
     *
     * @returns {void}
     */
    startupStatusSetDefault()
    {
        if (this._originals['sessionModeHasOverview'] === undefined) {
            return;
        }

        if (this._startupCompleteSignal) {
            this._main.layoutManager.disconnect(this._startupCompleteSignal);
        }
    }

    /**
     * set dash icon size to default
     *
     * @returns {void}
     */
    dashIconSizeSetDefault()
    {
        let classnameStarter = this._getAPIClassname('dash-icon-size');

        DASH_ICON_SIZES.forEach(size => {
            this.UIStyleClassRemove(classnameStarter + size);
        });
    }

    /**
     * set dash icon size
     *
     * @param {number} size in pixels
     *   see DASH_ICON_SIZES for available sizes
     *
     * @returns {void}
     */
    dashIconSizeSet(size)
    {
        this.dashIconSizeSetDefault();

        if (!DASH_ICON_SIZES.includes(size)) {
            return;
        }

        let classnameStarter = this._getAPIClassname('dash-icon-size');

        this.UIstyleClassAdd(classnameStarter + size);
    }

    /**
     * disable workspaces in app grid
     *
     * @returns {void}
     */
    workspacesInAppGridDisable()
    {
        if (this._shellVersion < 40) {
            return;
        }

        if (!this._originals['computeWorkspacesBoxForState']) {
            let ControlsManagerLayout = this._overviewControls.ControlsManagerLayout;
            this._originals['computeWorkspacesBoxForState']
            = ControlsManagerLayout.prototype._computeWorkspacesBoxForState;
        }

        let controlsLayout = this._main.overview._overview._controls.layout_manager;

        controlsLayout._computeWorkspacesBoxForState = (state, ...args) => {

            let box = this._originals['computeWorkspacesBoxForState'].call(
                controlsLayout, state, ...args);

            if (state === this._overviewControls.ControlsState.APP_GRID) {
                box.set_size(box.get_width(), 0);
            }

            return box;
        };
    }

    /**
     * enable workspaces in app grid
     *
     * @returns {void}
     */
    workspacesInAppGridEnable()
    {
        if (!this._originals['computeWorkspacesBoxForState']) {
            return;
        }

        let controlsLayout = this._main.overview._overview._controls.layout_manager;

        controlsLayout._computeWorkspacesBoxForState
        = this._originals['computeWorkspacesBoxForState'];
    }

    /**
     * change notification banner position
     *
     * @param {number} pos
     *   see NOTIFICATION_BANNER_POSITION for available positions
     *
     * @returns {void}
     */
    notificationBannerPositionSet(pos)
    {
        let messageTray = this._main.messageTray;

        if (this._originals['bannerAlignment'] === undefined) {
            this._originals['bannerAlignment'] = messageTray.bannerAlignment;
        }

        if (pos === NOTIFICATION_BANNER_POSITION.TOP_START) {
            messageTray.bannerAlignment = this._clutter.ActorAlign.START;
            return;
        }

        if (pos === NOTIFICATION_BANNER_POSITION.TOP_END) {
            messageTray.bannerAlignment = this._clutter.ActorAlign.END;
            return;
        }

        if (pos === NOTIFICATION_BANNER_POSITION.TOP_CENTER) {
            messageTray.bannerAlignment = this._clutter.ActorAlign.CENTER;
            return;
        }
    }

    /**
     * set notification banner position to default position
     *
     * @returns {void}
     */
    notificationBannerPositionSetDefault()
    {
        if (this._originals['bannerAlignment'] === undefined) {
            return;
        }

        let messageTray = this._main.messageTray;
        messageTray.bannerAlignment = this._originals['bannerAlignment'];
    }

    /**
     * always show the workspace switcher
     *
     * @returns {void}
     */
    workspaceSwitcherShouldShowSetAlways()
    {
        if (this._shellVersion < 40) {
            return;
        }

        let ThumbnailsBoxProto = this._workspaceThumbnail.ThumbnailsBox.prototype;

        if (!this._originals['updateShouldShow']) {
            this._originals['updateShouldShow'] = ThumbnailsBoxProto._updateShouldShow;
        }

        ThumbnailsBoxProto._updateShouldShow = function () {
            if (this._shouldShow === true) {
                return;
            }
            this._shouldShow = true;
            this.notify('should-show');
        };
    }

    /**
     * set the always show workspace switcher status to default
     *
     * @returns {void}
     */
    workspaceSwitcherShouldShowSetDefault()
    {
        if (!this._originals['updateShouldShow']) {
            return;
        }

        let ThumbnailsBoxProto = this._workspaceThumbnail.ThumbnailsBox.prototype;
        ThumbnailsBoxProto._updateShouldShow = this._originals['updateShouldShow'];
    }

    /**
     * emit panel style changed
     *
     * @returns {void}
     */
    _panelEmitStyleChanged()
    {
        if (!this.isPanelVisible()) {
            return;
        }

        this.panelHide();
        this.panelShow();
    }

    /**
     * set panel button hpadding to default
     *
     * @returns {void}
     */
    panelButtonHpaddingSetDefault()
    {
        if (this._panelButtonHpaddingSize === undefined) {
            return;
        }

        let classnameStarter = this._getAPIClassname('panel-button-padding-size');
        this.UIStyleClassRemove(classnameStarter + this._panelButtonHpaddingSize);
        this._panelEmitStyleChanged();

        delete this._panelButtonHpaddingSize;
    }

    /**
     * set panel button hpadding size
     *
     * @param {number} size in pixels (0 - 60)
     *
     * @returns {void}
     */
    panelButtonHpaddingSizeSet(size)
    {
        this.panelButtonHpaddingSetDefault();

        if (size < 0 || size > 60) {
            return;
        }

        this._panelButtonHpaddingSize = size;

        let classnameStarter = this._getAPIClassname('panel-button-padding-size');
        this.UIstyleClassAdd(classnameStarter + size);
        this._panelEmitStyleChanged();
    }

    /**
     * set panel indicator padding to default
     *
     * @returns {void}
     */
    panelIndicatorPaddingSetDefault()
    {
        if (this._panelIndicatorPaddingSize === undefined) {
            return;
        }

        let classnameStarter = this._getAPIClassname('panel-indicator-padding-size');
        this.UIStyleClassRemove(classnameStarter + this._panelIndicatorPaddingSize);
        this._panelEmitStyleChanged();

        delete this._panelIndicatorPaddingSize;
    }

    /**
     * set panel indicator padding size
     *
     * @param {number} size in pixels (0 - 60)
     *
     * @returns {void}
     */
    panelIndicatorPaddingSizeSet(size)
    {
        this.panelIndicatorPaddingSetDefault();

        if (size < 0 || size > 60) {
            return;
        }

        this._panelIndicatorPaddingSize = size;

        let classnameStarter = this._getAPIClassname('panel-indicator-padding-size');
        this.UIstyleClassAdd(classnameStarter + size);
        this._panelEmitStyleChanged();
    }

    /**
     * get window preview prototype
     *
     * @returns {Object}
     */
    _windowPreviewGetPrototype()
    {
        if (this._shellVersion <= 3.36) {
            return this._workspace.WindowOverlay.prototype;
        }

        return this._windowPreview.WindowPreview.prototype;
    }

    /**
     * enable window preview caption
     *
     * @returns {void}
     */
    windowPreviewCaptionEnable()
    {
        if (!this._originals['windowPreviewGetCaption']) {
            return;
        }

        let windowPreviewProto = this._windowPreviewGetPrototype();
        windowPreviewProto._getCaption = this._originals['windowPreviewGetCaption'];

        this.UIStyleClassRemove(this._getAPIClassname('no-window-caption'));
    }

    /**
     * disable window preview caption
     *
     * @returns {void}
     */
    windowPreviewCaptionDisable()
    {
        let windowPreviewProto = this._windowPreviewGetPrototype();

        if (!this._originals['windowPreviewGetCaption']) {
            this._originals['windowPreviewGetCaption'] = windowPreviewProto._getCaption;
        }

        windowPreviewProto._getCaption = () => {
            return '';
        };

        this.UIstyleClassAdd(this._getAPIClassname('no-window-caption'));
    }

    /**
     * set workspace background border radius to default size
     *
     * @returns {void}
     */
    workspaceBackgroundRadiusSetDefault()
    {
        if (this._workspaceBackgroundRadiusSize === undefined) {
            return;
        }

        let workspaceBackgroundProto = this._workspace.WorkspaceBackground.prototype;

        workspaceBackgroundProto._updateBorderRadius
        = this._originals['workspaceBackgroundUpdateBorderRadius'];

        let classnameStarter = this._getAPIClassname('workspace-background-radius-size');
        this.UIStyleClassRemove(classnameStarter + this._workspaceBackgroundRadiusSize);

        delete this._workspaceBackgroundRadiusSize;
    }

    /**
     * set workspace background border radius size
     *
     * @param {number} size in pixels (0 - 60)
     *
     * @returns {void}
     */
    workspaceBackgroundRadiusSet(size)
    {
        if (this._shellVersion < 40) {
            return;
        }

        if (size < 0 || size > 60) {
            return;
        }

        this.workspaceBackgroundRadiusSetDefault();

        let workspaceBackgroundProto = this._workspace.WorkspaceBackground.prototype;

        if (!this._originals['workspaceBackgroundUpdateBorderRadius']) {
            this._originals['workspaceBackgroundUpdateBorderRadius']
            = workspaceBackgroundProto._updateBorderRadius;
        }

        const Util = this._util;
        const St = this._st;

        workspaceBackgroundProto._updateBorderRadius = function () {
            const {scaleFactor} = St.ThemeContext.get_for_stage(global.stage);
            const cornerRadius = scaleFactor * size;

            const backgroundContent = this._bgManager.backgroundActor.content;
            backgroundContent.rounded_clip_radius = 
                Util.lerp(0, cornerRadius, this._stateAdjustment.value);
        }

        this._workspaceBackgroundRadiusSize = size;

        let classnameStarter = this._getAPIClassname('workspace-background-radius-size');
        this.UIstyleClassAdd(classnameStarter + size);
    }

    /**
     * enable workspace wraparound
     *
     * @returns {void}
     */
    workspaceWraparoundEnable()
    {
        let metaWorkspaceProto = this._meta.Workspace.prototype;

        if (!this._originals['metaWorkspaceGetNeighbor']) {
            this._originals['metaWorkspaceGetNeighbor']
            = metaWorkspaceProto.get_neighbor;
        }

        const Meta = this._meta;

        metaWorkspaceProto.get_neighbor = function (dir) {

            let index = this.index();
            let lastIndex = global.workspace_manager.n_workspaces - 1;
            let neighborIndex;

	        if (dir === Meta.MotionDirection.UP || dir === Meta.MotionDirection.LEFT) {
	            // prev
	            neighborIndex = (index > 0) ? index - 1 : lastIndex;
	        } else {
	            // next
		        neighborIndex = (index < lastIndex) ? index + 1 : 0;
	        }

	        return global.workspace_manager.get_workspace_by_index(neighborIndex);
        };
    }

    /**
     * disable workspace wraparound
     *
     * @returns {void}
     */
    workspaceWraparoundDisable()
    {
        if (!this._originals['metaWorkspaceGetNeighbor']) {
            return;
        }

        let metaWorkspaceProto = this._meta.Workspace.prototype;
        metaWorkspaceProto.get_neighbor = this._originals['metaWorkspaceGetNeighbor'];
    }

    /**
     * enable window preview close button
     *
     * @returns {void}
     */
    windowPreviewCloseButtonEnable()
    {
        this.UIStyleClassRemove(this._getAPIClassname('no-window-close'));
    }

    /**
     * disable window preview close button
     *
     * @returns {void}
     */
    windowPreviewCloseButtonDisable()
    {
        this.UIstyleClassAdd(this._getAPIClassname('no-window-close'));
    }
}

