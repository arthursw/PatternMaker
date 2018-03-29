import * as $ from 'jquery';
import * as datDefault from 'dat.gui';
let dat = datDefault.default;
let gui = null;
export let createGUI = (parameters) => {
    dat.GUI.DEFAULT_WIDTH = '100%';
    gui = new dat.GUI({ autoPlace: false });
    $('#gui-container').hide();
    $('#gui').append(gui.domElement);
    gui.add(parameters, 'generation').options(['animation', 'images']).name('Generation');
    gui.add(parameters, 'speed', 0, 1000).step(10).name('Speed');
    gui.add(parameters, 'nSymbolsPerFrame', 1, 1000).step(1).name('Num. symbols / frame');
    gui.add(parameters.size, 'width').name('Width');
    gui.add(parameters.size, 'height').name('Height');
    gui.add(parameters, 'optimizeWithRaster').name('Optimize with raster');
    return gui;
};
export let emptyFolder = (folder) => {
    for (let controller of folder.__controllers.slice()) {
        folder.remove(controller);
    }
    let folders = Object.assign({}, folder.__folders);
    for (let name in folders) {
        folder.removeFolder(folders[name]);
    }
};
//# sourceMappingURL=GUI.js.map