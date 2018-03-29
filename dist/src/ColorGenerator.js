import * as paper from 'paper';
export class ColorGenerator {
    constructor(parameters = {}, symbol) {
        this.symbol = symbol;
        let defaultParameters = this.constructor.defaultParameters;
        this.hue = parameters.hue != null ? parameters.hue : defaultParameters.hue;
        this.hueRange = parameters.hueRange != null ? parameters.hueRange : defaultParameters.hueRange;
        this.saturation = parameters.saturation != null ? parameters.saturation : defaultParameters.saturation;
        this.brightness = parameters.brightness != null ? parameters.brightness : defaultParameters.brightness;
        this.alpha = parameters.alpha != null ? parameters.alpha : defaultParameters.alpha;
    }
    static addColorGenerator(colorGenerator, name) {
        ColorGenerator.colorGenerators.set(name, colorGenerator);
        ColorGenerator.colorGeneratorNames.push(name);
        colorGenerator.type = name;
    }
    static createColorGenerator(type, parameters, symbol) {
        let ColorCreator = ColorGenerator.colorGenerators.get(type);
        return new ColorCreator(parameters, symbol);
    }
    setColor(positions, item, container) {
        item.fillColor = new paper.Color({
            hue: this.hue + (Math.random() - 0.5) * this.hueRange,
            saturation: this.saturation,
            brightness: this.brightness
        });
        item.fillColor.alpha = this.alpha;
    }
    createGUI(parentGUI) {
        if (this.parentGUI == null) {
            this.parentGUI = parentGUI;
            this.gui = parentGUI.addFolder('Colors');
            this.gui.open();
            this.addTypeOnGUI(this.gui, this.constructor.type);
            this.addGUIParameters(this.gui);
        }
    }
    addTypeOnGUI(gui, type) {
        gui.add({ type: type }, 'type').options(ColorGenerator.colorGeneratorNames).name('Type').onChange((value) => {
            this.changeColorGenerator(value);
        });
    }
    removeGUI() {
        let gui = this.parentGUI;
        gui.removeFolder(this.gui);
        this.parentGUI = null;
        this.gui = null;
    }
    changeColorGenerator(type) {
        this.symbol.changeColorGenerator(type);
    }
    addGUIParameters(gui) {
        gui.add(this, 'hue', 0, 360).step(1).name('Hue');
        gui.add(this, 'hueRange', 0, 360).step(1).name('Hue range');
        gui.add(this, 'saturation', 0, 1).step(0.01).name('Saturation');
        gui.add(this, 'brightness', 0, 1).step(0.01).name('Brightness');
        gui.add(this, 'alpha', 0, 1).step(0.01).name('Alpha');
    }
}
ColorGenerator.colorGenerators = new Map();
ColorGenerator.colorGeneratorNames = [];
ColorGenerator.defaultParameters = {
    hue: 180,
    hueRange: 360,
    saturation: 1,
    brightness: 1,
    alpha: 1
};
ColorGenerator.addColorGenerator(ColorGenerator, 'random-hue');
export class ThreeStripesColor extends ColorGenerator {
    constructor(parameters, symbol) {
        super(parameters, symbol);
    }
    setColor(positions, item, container) {
        let hue = positions[0] * 255;
        let saturation = 0.75 + positions[1] * 0.25;
        let brightness = 0.75 + positions[2] * 0.25;
        item.fillColor = new paper.Color({ hue: hue, saturation: saturation, brightness: brightness });
    }
}
// ColorGenerator.addColorGenerator(ThreeStripesColor, 'three-stripes')
export class RandomColorFromPalette extends ColorGenerator {
    constructor(parameters, symbol) {
        super(parameters, symbol);
        this.colors = parameters.palette != null && Array.isArray(parameters.palette) && parameters.palette.length > 0 ? parameters.palette : [];
    }
    setColor(positions, item, container) {
        item.fillColor = new paper.Color(this.colors.length == 0 ? 'black' : this.colors[Math.floor(Math.random() * this.colors.length)]);
        item.fillColor.alpha = this.alpha;
    }
    addGUIParameters(gui) {
        gui.add(this, 'alpha', 0, 1).step(0.01).name('Alpha');
        this.folder = gui.addFolder('Palette');
        this.folder.open();
        this.folder.add(this, 'addColor').name('Add color');
        this.folder.add(this, 'removeLastColor').name('Remove last color');
        for (let color in this.colors) {
            this.colors[color] = new paper.Color(this.colors[color]).toCSS(false);
            this.folder.addColor(this.colors, color);
        }
    }
    addColor() {
        let color = new paper.Color({
            hue: Math.random() * 360,
            saturation: 1,
            brightness: 1
        });
        this.colors.push(color.toCSS(false));
        this.folder.addColor(this.colors, '' + (this.colors.length - 1));
    }
    removeLastColor() {
        if (this.colors.length > 0) {
            this.colors.pop();
            this.folder.remove(this.folder.__controllers[this.folder.__controllers.length - 1]);
        }
    }
}
ColorGenerator.addColorGenerator(RandomColorFromPalette, 'random-palette');
//# sourceMappingURL=ColorGenerator.js.map