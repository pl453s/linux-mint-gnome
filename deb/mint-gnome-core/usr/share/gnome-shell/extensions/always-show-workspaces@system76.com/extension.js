
const Main = imports.ui.main;

let controls = !!Main.overview._overview._controls ? Main.overview._overview._controls : Main.overview._controls;
let old;

function init() {}

function enable() {
    old = controls._thumbnailsSlider._getAlwaysZoomOut;
    controls._thumbnailsSlider._getAlwaysZoomOut = function() {
        return true;
    };
}

function disable() {
    controls._thumbnailsSlider._getAlwaysZoomOut = old;
}
