import { ColorGenerator } from './ColorGenerator';
export class Symbol {
    constructor(parameters, parent) {
        this.parent = parent;
        this.initializeParameters(parameters);
        this.gui = null;
        this.colorGenerator = null;
        if (parameters.colors != null) {
            this.colorGenerator = ColorGenerator.createColorGenerator(parameters.colors.type, parameters.colors.parameters, this);
        }
    }
    static addSymbol(symbolGenerator, name) {
        Symbol.symbolGenerators.set(name, symbolGenerator);
        Symbol.symbolNames.push(name);
        symbolGenerator.type = name;
    }
    static createSymbol(name, parameters, parent) {
        let SymbolGenerator = Symbol.symbolGenerators.get(name);
        let symbol = new SymbolGenerator(parameters, parent);
        return symbol;
    }
    initializeParameters(parameters) {
        this.parameters = parameters;
        let defaultParameters = this.constructor.defaultParameters;
        this.copyDefaultParameters(defaultParameters, this.parameters);
    }
    copyDefaultParameters(defaultParameters, parameters) {
        if (defaultParameters == null || typeof defaultParameters != 'object' || Array.isArray(defaultParameters)) {
            return;
        }
        for (let name in defaultParameters) {
            if (parameters[name] == null) {
                parameters[name] = defaultParameters[name];
            }
            else {
                this.copyDefaultParameters(defaultParameters[name], parameters[name]);
            }
        }
    }
    getJSON() {
        return {
            type: this.constructor.type,
            parameters: this.parameters,
        };
    }
    getColorGenerator() {
        let colorGenerator = this.colorGenerator;
        if (colorGenerator == null) {
            if (this.parent != null) {
                colorGenerator = this.parent.getColorGenerator();
            }
            else {
                colorGenerator = new ColorGenerator({}, this);
                colorGenerator.createGUI(this.gui);
                this.colorGenerator = colorGenerator;
            }
        }
        return colorGenerator;
    }
    createGUI(gui) {
        this.gui = gui;
        this.addTypeOnGUI(gui, this.constructor.type);
        this.addGUIParameters(gui);
        this.createColorGUI();
    }
    createColorGUI() {
        if (this.colorGenerator != null) {
            this.colorGenerator.createGUI(this.gui);
        }
    }
    addTypeOnGUI(gui, type) {
        gui.add({ type: type }, 'type').options(Symbol.symbolNames).name('Type').onChange((value) => {
            this.changeSymbol(value);
        });
    }
    addGUIParameters(gui) {
    }
    changeColorGenerator(type) {
        this.colorGenerator.removeGUI();
        this.colorGenerator = ColorGenerator.createColorGenerator(type, {}, this);
        this.createColorGUI();
    }
    changeSymbol(type) {
        if (this.parent == null) {
            if (this.colorGenerator != null) {
                this.colorGenerator.parentGUI = null;
                this.colorGenerator.gui = null;
            }
            let gui = this.gui.parent;
            gui.removeFolder(this.gui);
            let event = new CustomEvent('changeParameters', { detail: { parameters: { symbol: { type: type, parameters: {} } } } });
            document.dispatchEvent(event);
        }
        else {
            this.parent.changeChildSymbol(this, type);
        }
    }
    changeChildSymbol(symbol, type) {
    }
    next(bounds, container, positions) {
        return null;
    }
    hasFinished() {
        return true;
    }
    reset(bounds) {
    }
}
Symbol.symbolGenerators = new Map();
Symbol.symbolNames = [];
Symbol.defaultParameters = {};
//# sourceMappingURL=Symbol.js.map