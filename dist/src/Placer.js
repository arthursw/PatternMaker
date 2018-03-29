import { emptyFolder } from './GUI';
import { Bounds } from './Bounds';
import { Symbol } from './Symbol';
export class Placer extends Symbol {
    constructor(parameters, parent) {
        super(parameters, parent);
        this.symbol = null;
        // let defaultParameters = (<typeof Placer>this.constructor).defaultParameters
        // let childSymbolType = parameters.symbol != null && parameters.symbol.type != null ? parameters.symbol.type : defaultParameters.symbol.type
        // let childParameters = parameters.symbol != null ? (<any>parameters.symbol).parameters : {}
        let symbol = Symbol.createSymbol(this.parameters.symbol.type, this.parameters.symbol.parameters, this);
        this.nCreatedSymbols = 0;
        this.symbol = symbol;
        this.bounds = null;
    }
    getJSON() {
        let json = super.getJSON();
        json.parameters.symbol = this.symbol.getJSON();
        return json;
    }
    addSymbolGUI(gui) {
        this.folder = gui.addFolder('Symbol');
        this.folder.open();
        this.symbol.createGUI(this.folder);
    }
    addGUIParameters(gui) {
        this.addGUIParametersWithoutSymbol(gui);
        this.addSymbolGUI(gui);
    }
    addGUIParametersWithoutSymbol(gui) {
        gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Num. Symbols');
    }
    changeChildSymbol(symbol, type) {
        emptyFolder(this.folder);
        this.symbol = Symbol.createSymbol(type, {}, this);
        this.symbol.createGUI(this.folder);
    }
    initializeBounds(bounds) {
        this.bounds = new Bounds(bounds.rectangle);
    }
    transform() {
        this.nCreatedSymbols++;
    }
    next(bounds, container, positions = [], parameters = null) {
        if (this.hasFinished()) {
            return null;
        }
        if (this.bounds == null) {
            this.initializeBounds(bounds);
        }
        positions.push(this.nCreatedSymbols / this.parameters.nSymbolsToCreate);
        let result = this.symbol.next(this.bounds, container, positions);
        if (this.symbol.hasFinished()) {
            this.transform();
            this.symbol.reset(this.bounds);
        }
        return result;
    }
    hasFinished() {
        return this.nCreatedSymbols >= this.parameters.nSymbolsToCreate;
    }
    reset(bounds) {
        this.nCreatedSymbols = 0;
        this.initializeBounds(bounds);
        this.symbol.reset(this.bounds);
    }
}
Placer.defaultParameters = { nSymbolsToCreate: 3, symbol: { type: 'rectangle', parameters: {} } };
Symbol.addSymbol(Placer, 'placer');
export class PlacerX extends Placer {
    constructor(parameters, parent) {
        super(parameters, parent);
    }
    addGUIParametersWithoutSymbol(gui) {
        gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Width');
    }
    initializeBounds(bounds) {
        super.initializeBounds(bounds);
        this.bounds.setWidth(bounds.rectangle.width / this.parameters.nSymbolsToCreate);
    }
    transform() {
        super.transform();
        this.bounds.setX(this.bounds.rectangle.x + this.bounds.rectangle.width);
    }
}
Symbol.addSymbol(PlacerX, 'placer-x');
export class PlacerY extends Placer {
    constructor(parameters, parent) {
        super(parameters, parent);
    }
    addGUIParametersWithoutSymbol(gui) {
        gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Height');
    }
    initializeBounds(bounds) {
        super.initializeBounds(bounds);
        this.bounds.setHeight(bounds.rectangle.height / this.parameters.nSymbolsToCreate);
    }
    transform() {
        super.transform();
        this.bounds.setY(this.bounds.rectangle.y + this.bounds.rectangle.height);
    }
}
Symbol.addSymbol(PlacerY, 'placer-y');
export class PlacerZ extends Placer {
    constructor(parameters, parent) {
        super(parameters, parent);
    }
    addGUIParametersWithoutSymbol(gui) {
        gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Depth');
        gui.add(this.parameters, 'margin').name('Margin');
        gui.add(this.parameters, 'scale', 0, 1).step(0.01).name('Scale');
    }
    initializeBounds(bounds) {
        super.initializeBounds(bounds);
        if (this.parameters.margin) {
            this.transform();
            this.nCreatedSymbols--;
        }
    }
    transform() {
        super.transform();
        let scale = 1 - this.parameters.scale;
        let center = this.bounds.rectangle.center.clone();
        this.bounds.setWH(this.bounds.rectangle.width * scale, this.bounds.rectangle.height * scale);
        this.bounds.setCenter(center);
    }
    reset(bounds) {
        super.reset(bounds);
        if (bounds != null) {
            this.initializeBounds(bounds);
        }
    }
}
PlacerZ.defaultParameters = Object.assign({}, Placer.defaultParameters, { scale: 0.5, margin: false });
Symbol.addSymbol(PlacerZ, 'placer-z');
export class PlacerXYZ extends PlacerY {
    constructor(parameters, parent) {
        let defaultParameters = PlacerXYZ.defaultParameters;
        let newParameters = {
            nSymbolsToCreate: parameters.height != null ? parameters.height : defaultParameters.height,
            symbol: {
                type: 'placer-x',
                parameters: {
                    nSymbolsToCreate: parameters.width ? parameters.width : defaultParameters.width,
                    symbol: {
                        type: 'placer-z',
                        parameters: {
                            nSymbolsToCreate: parameters.nSymbolsToCreate != null ? parameters.nSymbolsToCreate : defaultParameters.nSymbolsToCreate,
                            margin: parameters.margin != null ? parameters.margin : defaultParameters.margin,
                            scale: parameters.scale != null ? parameters.scale : defaultParameters.scale,
                            symbol: {
                                type: parameters.symbol != null && parameters.symbol.type != null ? parameters.symbol.type : defaultParameters.symbol.type,
                                parameters: parameters.symbol != null ? parameters.symbol.parameters : {},
                            }
                        }
                    }
                }
            }
        };
        super(newParameters, parent);
        // Here this.parameters has both the full hierarchy described above, 
        // and 'with', 'height', 'margin' and 'scale' at the root (but those will not update automatically with the gui)
    }
    getJSON() {
        let symbol = this.symbol;
        let json = super.getJSON();
        json.parameters = {
            height: this.parameters.nSymbolsToCreate,
            width: this.parameters.symbol.parameters.nSymbolsToCreate,
            nSymbolsToCreate: this.parameters.symbol.parameters.symbol.parameters.nSymbolsToCreate,
            margin: this.parameters.symbol.parameters.symbol.parameters.margin,
            scale: this.parameters.symbol.parameters.symbol.parameters.scale,
            symbol: symbol.symbol.symbol.getJSON()
        };
        return json;
    }
    addSymbolGUI(gui) {
        let symbol = this.symbol;
        this.folder = gui.addFolder('Symbol');
        this.folder.open();
        symbol.symbol.symbol.createGUI(this.folder);
        symbol.gui = gui;
        symbol.folder = this.folder;
        symbol.symbol.gui = gui;
        symbol.symbol.folder = this.folder;
    }
    addGUIParametersWithoutSymbol(gui) {
        let symbol = this.symbol;
        gui.add(symbol.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Width');
        gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Height');
        gui.add(symbol.symbol.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Depth');
        gui.add(symbol.symbol.parameters, 'margin').name('Margin');
        gui.add(symbol.symbol.parameters, 'scale', 0, 1).step(0.01).name('Scale');
    }
}
PlacerXYZ.defaultParameters = Object.assign({}, PlacerZ.defaultParameters, { width: 3, height: 3, nSymbolsToCreate: 1 });
Symbol.addSymbol(PlacerXYZ, 'placer-xyz');
export class PlacerMinMax extends Placer {
    constructor(parameters, parent) {
        super(parameters, parent);
        let defaultParameters = this.constructor.defaultParameters;
        this.min = parameters.min != null ? parameters.min : defaultParameters.min;
        this.max = parameters.max != null ? parameters.max : defaultParameters.max;
        this.initializeNSymbolsToCreate();
    }
    initializeNSymbolsToCreate() {
        // this.nSymbolsToCreate = Math.round(this.min + Math.random() * (this.max - this.min))
    }
    reset(bounds) {
        super.reset(bounds);
        this.initializeNSymbolsToCreate();
    }
}
PlacerMinMax.defaultParameters = Object.assign({}, Placer.defaultParameters, { min: 0, max: 10 });
//# sourceMappingURL=Placer.js.map