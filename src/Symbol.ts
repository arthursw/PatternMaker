import * as paper from 'paper';
import { Bounds } from './Bounds';
import { ColorGenerator } from './ColorGenerator';

export interface SymbolInterface {
	createGUI(gui: dat.GUI): void
	next(bounds: Bounds, container: Bounds, positions?: number[]): paper.Path // generates a paper.Path
	hasFinished(): boolean
	reset(bounds: Bounds): void
}

export class Symbol implements SymbolInterface {
	static type: string
	static symbolGenerators = new Map<string, SymbolConstructor>()
	static symbolNames: string[] = []
	
	static defaultParameters = {}

	static addSymbol(symbolGenerator: SymbolConstructor, name: string) {
		Symbol.symbolGenerators.set(name, symbolGenerator)
		Symbol.symbolNames.push(name)
		symbolGenerator.type = name
	}

	static createSymbol(name: string, parameters: any, parent?: Symbol) {
		let SymbolGenerator = Symbol.symbolGenerators.get(name)
		let symbol = new SymbolGenerator(parameters, parent)
		return symbol
	}

	parent: Symbol
	gui: dat.GUI
	colorGenerator: ColorGenerator
	parameters: any
	
	constructor(parameters: { colors?: any }, parent?: Symbol) {
		this.parent = parent
		this.initializeParameters(parameters)
		this.gui = null

		this.colorGenerator = null

		if(parameters.colors != null) {
			this.colorGenerator = ColorGenerator.createColorGenerator(parameters.colors.type, parameters.colors.parameters, this)
		}
	}

	initializeParameters(parameters: any) {
		this.parameters = parameters
		let defaultParameters: any = (<typeof Symbol>this.constructor).defaultParameters
		this.copyDefaultParameters(defaultParameters, this.parameters)
	}

	copyDefaultParameters(defaultParameters: any, parameters: any) {
		if(defaultParameters == null || typeof defaultParameters != 'object' || Array.isArray(defaultParameters)) {
			return
		}
		for(let name in defaultParameters) {
			if(parameters[name] == null) {
				parameters[name] = defaultParameters[name]
			} else {
				this.copyDefaultParameters(defaultParameters[name], parameters[name])
			}
		}
	}

	getJSON() {
		return { 
			type: (<typeof Symbol>this.constructor).type,
			parameters: this.parameters,
		}
	}

	getColorGenerator(): ColorGenerator {
		let colorGenerator = this.colorGenerator
		if(colorGenerator == null) {
			if(this.parent != null) {
				colorGenerator = this.parent.getColorGenerator()
			} else {
				colorGenerator = new ColorGenerator({}, this)
				colorGenerator.createGUI(this.gui)
				this.colorGenerator = colorGenerator
			}
		}
		return colorGenerator
	}

	createGUI(gui: dat.GUI) {
		this.gui = gui
		this.addTypeOnGUI(gui, (<typeof Symbol>this.constructor).type)
		this.addGUIParameters(gui)
		this.createColorGUI()
	}

	createColorGUI() {
		if(this.colorGenerator != null) {
			this.colorGenerator.createGUI(this.gui)
		}
	}

	addTypeOnGUI(gui: dat.GUI, type: string) {
		gui.add( { type: type }, 'type').options(Symbol.symbolNames).name('Type').onChange( (value: string)=> {
			this.changeSymbol(value)
		} )
	}

	addGUIParameters(gui: dat.GUI) {
	}

	changeColorGenerator(type: string) {
		this.colorGenerator.removeGUI()
		this.colorGenerator = ColorGenerator.createColorGenerator(type, {}, this)
		this.createColorGUI()
	}

	changeSymbol(type: string) {

		if(this.parent == null) {
	
			if(this.colorGenerator != null) {
				this.colorGenerator.parentGUI = null
				this.colorGenerator.gui = null
			}

			let gui: any = this.gui.parent
			gui.removeFolder(this.gui)

			let event = new CustomEvent('changeParameters', { detail: { parameters: { symbol: { type: type, parameters: {} }}} })
			document.dispatchEvent(event)

		} else {
			this.parent.changeChildSymbol(this, type)
		}
	}

	changeChildSymbol(symbol: Symbol, type: string) {

	}

	next(bounds: Bounds, container: Bounds, positions?: number[]): paper.Path {
		return null
	}

	hasFinished(): boolean {
		return true
	}

	reset(bounds: Bounds): void {

	}
}

export interface SymbolConstructor {
	type: string
	new (...args: any[]): Symbol
}
