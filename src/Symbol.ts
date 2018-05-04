import * as paper from 'paper';
import { Bounds } from './Bounds';
import { Effect } from './Effect';

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
	effectsFolder: dat.GUI
	addEffectButton: dat.GUIController
	effects: Effect[]
	effectCount: number
	parameters: any
	
	constructor(parameters: { effects?: any }, parent?: Symbol) {
		this.parent = parent
		this.initializeParameters(parameters)
		this.gui = null

		this.effects = []
		this.effectCount = 0

		if(parameters.effects != null) {
			for(let effect of parameters.effects) {
				Effect.createEffect(effect.type, effect.parameters, this)
			}
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
			parameters: { ... this.parameters },
			effects: this.getEffectsJSON()
		}
	}

	getEffects(): Effect[] {
		let effects = this.effects
		if(this.effects.length == 0) {
			if(this.parent != null) {
				effects = this.parent.getEffects()
			} else {
				Effect.createDefaultEffect(this)
				return this.effects
			}
		}
		return effects
	}

	getEffectsJSON(): any[] {
		let effectsJSON: any[] = []
		for(let effect of this.effects) {
			effectsJSON.push(effect.getJSON())
		}
		return effectsJSON
	}

	applyEffects(positions: number[], item: paper.Path, container: Bounds): void {
		for(let effect of this.getEffects()) {
			effect.applyEffect(positions, item, container)
		}
	}

	createGUI(gui: dat.GUI) {
		this.gui = gui
		this.addTypeOnGUI(gui, (<typeof Symbol>this.constructor).type)
		this.addGUIParameters(gui)
		this.createEffectGUI()
	}

	createEffectGUI() {
		this.effectsFolder = this.gui.addFolder('Effects')
		
		if(this.effects.length > 0) {
			this.effectsFolder.open()
		}

		let i = 1
		for(let effect of this.effects) {
			effect.createGUI(this.effectsFolder, ++this.effectCount)
		}

		this.addEffectButton = this.effectsFolder.add(this, 'addEffect').name('Add effect')
	}

	recreateEffectGUI() {
		let gui: any = this.gui
		gui.removeFolder(this.effectsFolder)
		this.effectCount = 0
		this.createEffectGUI()
	}

	addTypeOnGUI(gui: dat.GUI, type: string) {
		gui.add( { type: type }, 'type').options(Symbol.symbolNames).name('Type').onChange( (value: string)=> {
			this.changeSymbol(value)
		} )
	}

	addGUIParameters(gui: dat.GUI) {
	}

	addEffect() {
		let effect = Effect.createEffect('random-hue', {}, this)
		this.updateEffectsJSON()
		this.recreateEffectGUI()
	}

	changeEffect(effect: Effect, type: string) {
		let index = this.effects.indexOf(effect)
		this.effects.splice(index, 1)
		Effect.createEffect(type, {}, this, index)
		this.updateEffectsJSON()
		this.recreateEffectGUI()
	}

	removeEffect(effect: Effect) {
		let effectIndex = this.effects.indexOf(effect)
		this.effects.splice(effectIndex, 1)
		this.updateEffectsJSON()
		this.recreateEffectGUI()
	}

	setEffects(effects: Effect[]) {
		this.effects = effects
		for(let effect of effects) {
			effect.symbol = this
		}
		this.updateEffectsJSON()
	}

	updateEffectsJSON() {
		this.parameters.effects = []
		for(let effect of this.effects) {
			this.parameters.effects.push(effect.getJSON())
		}
	}

	changeSymbol(type: string) {

		if(this.parent == null) {

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
