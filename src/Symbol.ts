import * as paper from 'paper';
import { Bounds } from './Bounds';
import { ColorGenerator, colorGenerators } from './ColorGenerator';

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

	static addSymbol(symbolGenerator: SymbolConstructor, name: string) {
		Symbol.symbolGenerators.set(name, symbolGenerator)
		Symbol.symbolNames.push(name)
		symbolGenerator.type = name
	}

	static passParametersColors(symbol: { colors?: any, parameters: any }, colors?: any) {
		return symbol.parameters.colors ? symbol.parameters : {...symbol.parameters, colors: colors }
	}
	
	static passParameters(parameters: { symbol: any, colors?: any }) {
		return Symbol.passParametersColors(parameters.symbol, parameters.colors)
	}

	static CreateSymbol(name: string, parameters: any, parent: Symbol) {
		let SymbolGenerator = Symbol.symbolGenerators.get(name)
		let symbol = new SymbolGenerator(parameters)
		symbol.parent = parent
		return symbol
	}

	parent: Symbol
	gui: dat.GUI
	colorGenerator: ColorGenerator
	
	constructor(parameters: { colors?: any }) {
		this.parent = null
		this.gui = null

		if(parameters.colors != null) {
			let Color = colorGenerators.get(parameters.colors.type)
			this.colorGenerator = new Color(parameters.colors.parameters)
		}
	}

	createGUI(gui: dat.GUI) {
		this.gui = gui
	}

	addTypeOnGUI(gui: dat.GUI) {
		gui.add(this.constructor, 'type').options(Symbol.symbolNames).name('Type').onChange( (value: string)=> {
			if(this.parent == null) {
				this.changeChildSymbol(this, value)
			} else {
				this.parent.changeChildSymbol(this, value)
			}
		} )
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
