/**
 * HotCorner Library
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2021
 * @license    GNU General Public License v3.0
 */

/**
 * Add HotCorner to the GNOME Shell
 */
var HotCorner = class
{
    /**
     * Class Constructor
     *
     * @param {Object} dependecies
     *   'API' reference to lib::API
     *   'St' reference to gi::St
     */
    constructor(dependecies)
    {
        this._api = dependecies['API'] || null;
        this._st = dependecies['St'] || null;

        this._isInOverviewButton = false;
        this._overviewButton = null;
    }

    /**
     * get overview button
     *
     * @returns {St.Bin}
     */
    _createOveriewButton()
    {
        let monitorInfo = this._api.monitorGetInfo();

        let btn = new this._st.Bin({
            reactive: true,
            can_focus: false,
            track_hover: true,
            height: 2,
            width: 2,
            x: (monitorInfo) ? monitorInfo.x : 0,
            y: (monitorInfo) ? monitorInfo.y : 0,
        });

        btn.connect('enter-event', () => {
            if (this._isInOverviewButton) {
                return false;
            }
            this._isInOverviewButton = true;
            this._api.overviewToggle();
        });

        btn.connect('leave-event', () => {
            this._isInOverviewButton = false;
        });

        return btn;
    }

    /**
     * add overview button to GNOME Shell Stage
     *
     * @returns {void}
     */
    addOveriewButton()
    {
        if (this._overviewButton) {
            return;
        }

        this._isInOverviewButton = false;
        this._overviewButton = this._createOveriewButton();

        this._api.chromeAdd(this._overviewButton);
    }

    /**
     * remove overview button from GNOME Shell Stage
     *
     * @returns {void}
     */
    removeOveriewButton()
    {
        if (!this._overviewButton) {
            return;
        }

        this._api.chromeRemove(this._overviewButton);
        this._overviewButton.destroy();
        this._overviewButton = null;
    }
}

