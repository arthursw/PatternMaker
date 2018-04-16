import * as paper from 'paper';
import * as dat from 'dat.gui'
import { sizeToPoint } from './Utils';
import { Bounds } from './Bounds';
import { Symbol } from './Symbol';
import { Effect, RandomColorFromPalette } from './Effect';
import { Shape, Rectangle } from './Shape';

let w:any = <any>window;

export class Placer extends Symbol {

	static defaultParameters = { nSymbolsToCreate: 3, symbol: { type: 'rectangle', parameters: {} } }

	parameters: {
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
	}

	symbol: Symbol
	nCreatedSymbols: number
	
	bounds: Bounds

	folder: dat.GUI

	constructor(parameters: { nSymbolsToCreate: number, symbol: { type: string } , effects?: any }, parent?: Symbol) {
		super(parameters, parent)
		this.symbol = null

		// let defaultParameters = (<typeof Placer>this.constructor).defaultParameters
		// let childSymbolType = parameters.symbol != null && parameters.symbol.type != null ? parameters.symbol.type : defaultParameters.symbol.type
		// let childParameters = parameters.symbol != null ? (<any>parameters.symbol).parameters : {}

		let symbol = Symbol.createSymbol(this.parameters.symbol.type, this.parameters.symbol.parameters, this)

		this.nCreatedSymbols = 0

		this.symbol = symbol
		this.bounds = null
	}

	getJSON() {
		let json = super.getJSON()
		json.parameters.symbol = this.symbol.getJSON()
		return json
	}

	addSymbolGUI(gui: dat.GUI) {
		this.folder = gui.addFolder('Symbol')
		this.folder.open()
		this.symbol.createGUI(this.folder)
	}

	addGUIParameters(gui: dat.GUI) {
		this.addGUIParametersWithoutSymbol(gui)
		this.addSymbolGUI(gui)
	}

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Num. Symbols')
	}
	
	changeChildSymbol(symbol: Symbol, type: string) {
		let effects = this.symbol.effects

		let gui: any = this.gui
		gui.removeFolder(this.folder)

		this.symbol = Symbol.createSymbol(type, {}, this)
		this.symbol.setEffects(effects)
		this.addSymbolGUI(this.gui)

		this.recreateEffectGUI()
	}

	initializeBounds(bounds: Bounds) {
		this.bounds = bounds.clone()
	}

	transform(bounds: Bounds) {
		this.nCreatedSymbols++
	}

	nextSymbol(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		return this.symbol.next(this.bounds, container, positions)
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(this.bounds == null) {
			this.initializeBounds(bounds)
		}

		positions.push(this.nCreatedSymbols / this.parameters.nSymbolsToCreate)
		let result = this.nextSymbol(bounds, container, positions)

		if(this.symbol.hasFinished()) {
			this.transform(bounds)
			this.symbol.reset(this.bounds)
		}
		
		return result
	}

	hasFinished() {
		return this.nCreatedSymbols >= this.parameters.nSymbolsToCreate
	}

	reset(bounds: Bounds): void {
		this.nCreatedSymbols = 0
		this.initializeBounds(bounds)
		this.symbol.reset(this.bounds)
	}
}

Symbol.addSymbol(Placer, 'placer')

export class QuadTree extends Placer {

	static defaultParameters = { ...Placer.defaultParameters, probabilityToDivide: 0.7, maxNumberOfRecursions: 4 }

	parameters: {
		probabilityToDivide: number,
		maxNumberOfRecursions: number,
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
	}

	states: { bounds: Bounds, leafIndex: number }[]
	symbolHasFinished: boolean
	finished: boolean
	currentLeafIndex: number

	constructor(parameters: { nSymbolsToCreate: number, symbol: any, effects?: any }, parent?: Symbol) {
		super(parameters, parent)
		this.states = []
		this.currentLeafIndex = -1
		this.finished = false
		this.symbolHasFinished = true
	}
	
	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'probabilityToDivide', 0, 1).step(0.01).name('Probability to divide')
		gui.add(this.parameters, 'maxNumberOfRecursions', 1, 9).step(1).name('Max number of recursions')
	}

	mustDivide() {
		let depth = this.states.length
		return depth == this.parameters.maxNumberOfRecursions ? false : Math.random() < this.parameters.probabilityToDivide
	}

	nextSymbol(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {

		let result = this.symbol.next(this.bounds, container, positions)

		this.symbolHasFinished = this.symbol.hasFinished()
		
		if(this.symbolHasFinished) {

			while(this.currentLeafIndex == 3) {
				let state = this.states.pop()
				this.bounds = state.bounds
				this.currentLeafIndex = state.leafIndex	
			}

			if(this.currentLeafIndex == -1) {
				this.finished = true
				return result
			}

			if(this.currentLeafIndex == 0 || this.currentLeafIndex == 2) {
				this.bounds.setX(this.bounds.rectangle.x + this.bounds.rectangle.width)
			} else if(this.currentLeafIndex == 1) {
				this.bounds.setXY(this.bounds.rectangle.x - this.bounds.rectangle.width, this.bounds.rectangle.y + this.bounds.rectangle.height)
			}
			this.currentLeafIndex++
			
			this.symbol.reset(this.bounds)
		}

		return result
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(!this.symbolHasFinished) {
			return this.nextSymbol(this.bounds, container, positions)
		}

		if(this.bounds == null) {
			this.initializeBounds(bounds)
		}

		while(this.mustDivide()) {
			this.states.push({ bounds: this.bounds.clone(), leafIndex: this.currentLeafIndex })
			this.bounds.setWH(this.bounds.rectangle.width / 2, this.bounds.rectangle.height / 2)
			this.currentLeafIndex = 0
		}
		
		this.symbol.reset(this.bounds)

		return this.nextSymbol(this.bounds, container, positions)
	}

	hasFinished() {
		return this.finished
	}

	reset(bounds: Bounds) {
		super.reset(bounds)
		this.finished = false
		this.symbolHasFinished = true
		this.states = []
		this.currentLeafIndex = -1
	}
}

Symbol.addSymbol(QuadTree, 'quadtree')

export class PlacerX extends Placer {
	
	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Width')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		this.bounds.setWidth(bounds.rectangle.width / this.parameters.nSymbolsToCreate)
	}

	transform(bounds: Bounds) {
		super.transform(bounds)
		this.bounds.setX(this.bounds.rectangle.x + this.bounds.rectangle.width)
	}
}

Symbol.addSymbol(PlacerX, 'line')

export class PlacerY extends Placer {

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Height')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		this.bounds.setHeight(bounds.rectangle.height / this.parameters.nSymbolsToCreate)
	}

	transform(bounds: Bounds) {
		super.transform(bounds)
		this.bounds.setY(this.bounds.rectangle.y + this.bounds.rectangle.height)
	}
}

Symbol.addSymbol(PlacerY, 'column')

export class RandomPlacerX extends PlacerX {
	
	static defaultParameters = { ...PlacerX.defaultParameters, widthMin: 2, widthMax: 5 }

	parameters: {
		widthMin: number
		widthMax: number
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
	}

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'widthMin', 1, 100).step(1).name('Min width').onChange( () => this.updateNSymbolsToCreate() )
		gui.add(this.parameters, 'widthMax', 1, 100).step(1).name('Max width').onChange( () => this.updateNSymbolsToCreate() )
	}

	updateNSymbolsToCreate() {
		this.parameters.nSymbolsToCreate = this.parameters.widthMin + Math.round(Math.random() * Math.abs(this.parameters.widthMax - this.parameters.widthMin))
	}

	reset(bounds: Bounds) {
		this.updateNSymbolsToCreate()
		super.reset(bounds)
	}
}

Symbol.addSymbol(RandomPlacerX, 'random-line')

export class RandomPlacerY extends PlacerY {
	
	static defaultParameters = { ...PlacerX.defaultParameters, heightMin: 2, heightMax: 5 }

	parameters: {
		heightMin: number
		heightMax: number
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
	}

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'heightMin', 1, 100).step(1).name('Min height').onChange( () => this.updateNSymbolsToCreate() )
		gui.add(this.parameters, 'heightMax', 1, 100).step(1).name('Max height').onChange( () => this.updateNSymbolsToCreate() )
	}

	updateNSymbolsToCreate() {
		this.parameters.nSymbolsToCreate = this.parameters.heightMin + Math.round(Math.random() * Math.abs(this.parameters.heightMax - this.parameters.heightMin))
	}

	reset(bounds: Bounds) {
		this.updateNSymbolsToCreate()
		super.reset(bounds)
	}
}

Symbol.addSymbol(RandomPlacerY, 'random-column')

class IrregularPlacer {

	static initializeRandomValues(nSymbolsToCreate: number): number[] {
		let values = []
		let total = 0
		for(let i=0 ; i<nSymbolsToCreate ; i++) {
			let value = Math.random()
			values.push(value)
			total += value
		}
		for(let i=0 ; i<nSymbolsToCreate ; i++) {
			values[i] /= total
		}
		return values
	}
}

export class IrregularPlacerX extends RandomPlacerX {
	
	values: number[] = []
	
	initializeBounds(bounds: Bounds) {
		this.bounds = bounds.clone()
		this.bounds.setWidth(this.values[0] * bounds.rectangle.width)
	}

	updateNSymbolsToCreate() {
		super.updateNSymbolsToCreate()
		this.values = IrregularPlacer.initializeRandomValues(this.parameters.nSymbolsToCreate)
	}

	transform(bounds: Bounds) {
		super.transform(bounds)
		this.bounds.setWidth(this.values[this.nCreatedSymbols] * bounds.rectangle.width)
	}
}

Symbol.addSymbol(IrregularPlacerX, 'irregular-line')

export class IrregularPlacerY extends RandomPlacerY {
	
	values: number[] = []
	
	initializeBounds(bounds: Bounds) {
		this.bounds = bounds.clone()
		this.bounds.setHeight(this.values[0] * bounds.rectangle.height)
	}
	
	updateNSymbolsToCreate() {
		super.updateNSymbolsToCreate()
		this.values = IrregularPlacer.initializeRandomValues(this.parameters.nSymbolsToCreate)
	}

	transform(bounds: Bounds) {
		super.transform(bounds)
		this.bounds.setHeight(this.values[this.nCreatedSymbols] * bounds.rectangle.height)
	}
}

Symbol.addSymbol(IrregularPlacerY, 'irregular-column')

export class PlacerZ extends Placer {

	static defaultParameters = { ...Placer.defaultParameters,
		scale: 0.5,
		margin: false
	}

	parameters: {
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
		scale: number
		margin: boolean
	}

	constructor(parameters: { nSymbolsToCreate: number, scale: number, margin: boolean, symbol: any, effects?: any }, parent?: Symbol) {
		super(parameters, parent)
	}

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Depth')
		gui.add(this.parameters, 'margin').name('Margin')
		gui.add(this.parameters, 'scale', 0, 1).step(0.01).name('Scale')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		if(this.parameters.margin) {
			this.transform(bounds)
			this.nCreatedSymbols--
		}
	}

	transform(bounds: Bounds) {
		super.transform(bounds)
		let scale = 1 - this.parameters.scale
		let center = this.bounds.rectangle.center.clone()
		this.bounds.setWH(this.bounds.rectangle.width * scale, this.bounds.rectangle.height * scale)
		this.bounds.setCenter(center)
	}

	reset(bounds: Bounds): void {
		super.reset(bounds)
		if(bounds != null) {
			this.initializeBounds(bounds)
		}
	}
}

Symbol.addSymbol(PlacerZ, 'scaler')

export class RecursivePlacer extends Placer {

	states: { bounds: Bounds, parentBounds: Bounds, nCreatedSymbols: number }[]
	symbolHasFinished: boolean
	finished: boolean

	constructor(parameters: { nSymbolsToCreate: number, symbol: any, effects?: any }, parent?: Symbol) {
		super(parameters, parent)
		this.states = []
		this.finished = false
		this.symbolHasFinished = true
	}

	mustDivide() {
		let nRecursions = this.parameters.nSymbolsToCreate
		// We want to have on average n recursions, so we want it to fail dividing 1 time out of n :
		let probabilityToDivide = (nRecursions - 1) / nRecursions
		let nDivisions = this.symbol.parameters.nSymbolsToCreate
		// probabilityToDivide /= Math.pow(nDivisions, this.states.length)
		probabilityToDivide /= this.states.length
		return Math.random() < probabilityToDivide
	}

	computePosition() {
		let position = 0
		let i = 1
		for(let state of this.states) {
			position += state.nCreatedSymbols / Math.pow(this.symbol.parameters.nSymbolsToCreate, i)
			i++
		}
		return position
	}

	nextSymbol(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {

		let placer: Placer = <any>this.symbol

		positions.push(this.computePosition())

		let result = this.symbol.next(this.bounds, container, positions)

		this.symbolHasFinished = this.symbol.hasFinished()
		
		if(this.symbolHasFinished) {
			do {
				let previousState = this.states.pop()
				if(previousState == null) {
					this.finished = true
					this.bounds = bounds.clone()
					return result
				}
				placer.bounds = previousState.bounds
				placer.nCreatedSymbols = previousState.nCreatedSymbols
				placer.transform(bounds)
				placer.symbol.reset(placer.bounds)
				this.bounds = previousState.parentBounds
			} while(placer.hasFinished())
		}

		return result
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {

		if(this.hasFinished()) {
			return null
		}

		if(! (this.symbol instanceof Placer)) {
			this.finished = false
			let result = super.next(bounds, container, positions)
			this.finished = this.symbol.hasFinished()
			return result
		}

		let placer: Placer = <any>this.symbol

		if(this.bounds == null) {
			this.initializeBounds(bounds)
		}

		if(placer.bounds == null) {
			placer.initializeBounds(bounds)
		}

		if(!this.symbolHasFinished) {
			return this.nextSymbol(this.bounds, container, positions)
		}

		let b = placer.bounds.clone()
		while(this.mustDivide()) {
			placer.initializeBounds(b)
			this.states.push({ bounds: b, parentBounds: this.bounds, nCreatedSymbols: placer.nCreatedSymbols })
			this.bounds = b
			b = placer.bounds.clone()
			placer.nCreatedSymbols = 0
		}
		
		placer.symbol.reset(placer.bounds)

		return this.nextSymbol(this.bounds, container, positions)
	}

	hasFinished() {
		return this.finished
	}

	reset(bounds: Bounds) {
		super.reset(bounds)
		this.finished = false
		this.symbolHasFinished = true
		this.states = []
	}

	changeChildSymbol(symbol: Symbol, type: string) {
		super.changeChildSymbol(symbol, type)
		this.finished = false
	}
}

Symbol.addSymbol(RecursivePlacer, 'recursive-placer')

export class PlacerXYZ extends PlacerY {

	static defaultParameters = { ...PlacerZ.defaultParameters,
		width: 3,
		height: 3,
		nSymbolsToCreate: 1
	}

	parameters: {
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
		scale: number
		margin: boolean
		width: number
		height: number
	}

	constructor(parameters: { width: number, height: number, nSymbolsToCreate: number, margin: boolean, scale: number, symbol: any, effects?: any }, parent?: Symbol) {
		let defaultParameters = PlacerXYZ.defaultParameters

		let newParameters = {
			nSymbolsToCreate: parameters.height != null ? parameters.height : defaultParameters.height,
			symbol: {
				type: 'line',
				parameters: {
					nSymbolsToCreate: parameters.width ? parameters.width : defaultParameters.width,
					symbol: {
						type: 'scaler',
						parameters: {
							nSymbolsToCreate: parameters.nSymbolsToCreate != null ?  parameters.nSymbolsToCreate : defaultParameters.nSymbolsToCreate,
							margin: parameters.margin != null ?  parameters.margin : defaultParameters.margin,
							scale: parameters.scale != null ?  parameters.scale : defaultParameters.scale,
							symbol: {
								type: parameters.symbol != null && parameters.symbol.type != null ? parameters.symbol.type : defaultParameters.symbol.type,
								parameters: parameters.symbol != null ? parameters.symbol.parameters : {},
							}
						}
					}
				}
			}
		}
		super(newParameters, parent)

		// Here this.parameters has both the full hierarchy described above, 
		// and 'with', 'height', 'margin' and 'scale' at the root (but those will not update automatically with the gui)

		let symbol: any = this.symbol
		symbol.symbol.symbol.parent = this
	}

	getJSON() {
		let symbol: any = this.symbol
		let json = super.getJSON()
		json.parameters = {
			height: this.parameters.nSymbolsToCreate,
			width: this.parameters.symbol.parameters.nSymbolsToCreate,
			nSymbolsToCreate: this.parameters.symbol.parameters.symbol.parameters.nSymbolsToCreate,
			margin: this.parameters.symbol.parameters.symbol.parameters.margin,
			scale: this.parameters.symbol.parameters.symbol.parameters.scale,
			symbol: symbol.symbol.symbol.getJSON()
		}
		return json
	}

	addSymbolGUI(gui: dat.GUI) {
		let symbol: any = this.symbol
		this.folder = gui.addFolder('Symbol')
		this.folder.open()
		
		symbol.symbol.symbol.createGUI(this.folder)
		
		symbol.gui = gui
		symbol.folder = this.folder
		
		symbol.symbol.gui = gui
		symbol.symbol.folder = this.folder
	}

	changeChildSymbol(symbol: Symbol, type: string) {
		let line: any = this.symbol

		let effects = line.symbol.symbol.effects

		let gui: any = this.gui
		gui.removeFolder(this.folder)

		line.symbol.symbol = Symbol.createSymbol(type, {}, this)
		line.symbol.symbol.setEffects(effects)
		this.addSymbolGUI(this.gui)

		this.recreateEffectGUI()
	}

	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		let symbol: any = this.symbol
		gui.add(symbol.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Width')
		gui.add(this.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Height')
		gui.add(symbol.symbol.parameters, 'nSymbolsToCreate', 1, 100).step(1).name('Depth')
		gui.add(symbol.symbol.parameters, 'margin').name('Margin')
		gui.add(symbol.symbol.parameters, 'scale', 0, 1).step(0.01).name('Scale')
	}
}

w.Placer = Placer
w.PlacerXYZ = PlacerXYZ

Symbol.addSymbol(PlacerXYZ, 'grid')

export class NoiseGrid extends Placer {

	static defaultParameters = { ...PlacerZ.defaultParameters,
		symbol: { type: 'bounds', parameters: {} },
		width: 3,
		height: 3,
		noise: 0.5
	}

	parameters: {
		nSymbolsToCreate: number
		symbol: {
			type: string
			parameters: any
		}
		noise: number
		width: number
		height: number
	}

	grid: paper.Point[][]
	currentX: number
	currentY: number
	currentZ: number
	symbolHasFinished: boolean

	constructor(parameters: { nSymbolsToCreate: number, symbol: any, effects?: any }, parent?: Symbol) {
		super(parameters, parent)
		this.grid = [[]]
		this.currentX = 0
		this.currentY = 0
		this.currentZ = 0
		this.symbolHasFinished = true
	}
	
	addGUIParametersWithoutSymbol(gui: dat.GUI) {
		gui.add(this.parameters, 'width', 0, 100).step(1).name('Width')
		gui.add(this.parameters, 'height', 0, 100).step(1).name('Height')
		gui.add(this.parameters, 'noise', 0, 1).step(0.01).name('Noise')
	}

	nextSymbol(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {

		positions.push(this.currentY / this.parameters.height, this.currentX / this.parameters.width, this.currentZ / 1)

		let result = this.symbol.next(this.bounds, container, positions)

		this.symbolHasFinished = this.symbol.hasFinished()
		
		if(this.symbolHasFinished) {
			this.currentZ++
			if(this.currentZ > 1) {
				this.currentZ = 0
				this.currentX++
				
				if(this.currentX >= this.parameters.width) {
					this.currentX = 0
					this.currentY++
				}
			}
			
			this.symbol.reset(this.bounds)
		}

		return result
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(!this.symbolHasFinished) {
			return this.nextSymbol(this.bounds, container, positions)
		}

		if(this.bounds == null) {
			this.initializeBounds(bounds)
		}

		let path = new paper.Path()
		if(this.currentZ == 0) {
			path.add(this.grid[this.currentY][this.currentX])
			path.add(this.grid[this.currentY+1][this.currentX])
			path.add(this.grid[this.currentY][this.currentX+1])
		} else {
			path.add(this.grid[this.currentY][this.currentX+1])
			path.add(this.grid[this.currentY+1][this.currentX+1])
			path.add(this.grid[this.currentY+1][this.currentX])
		}
		path.closed = true
		this.bounds = new Bounds(path)

		this.symbol.reset(this.bounds)

		return this.nextSymbol(this.bounds, container, positions)
	}

	hasFinished() {
		return this.currentY >= this.parameters.height
	}

	reset(bounds: Bounds) {
		super.reset(bounds)
		let stepX = bounds.rectangle.width / this.parameters.width
		let stepY = bounds.rectangle.height / this.parameters.height
		this.grid = []
		for(let y = 0 ; y <= this.parameters.height ; y++) {
			let line: paper.Point[] = []
			for(let x = 0 ; x <= this.parameters.width ; x++) {
				let p = new paper.Point( x * stepX, y * stepY )
				if(x > 0 && x < this.parameters.width && y > 0 && y < this.parameters.height) {
					p.x += Math.random() * this.parameters.noise * stepX
					p.y += Math.random() * this.parameters.noise * stepY
				}
				line.push(p)
			}
			this.grid.push(line)
		}
		this.symbolHasFinished = true
		this.currentX = 0
		this.currentY = 0
		this.currentZ = 0
	}
}

Symbol.addSymbol(NoiseGrid, 'noise-grid')

export class PlacerMinMax extends Placer {
	
	static defaultParameters = { ...Placer.defaultParameters,
		min: 0, max: 10
	}

	min: number
	max: number

	constructor(parameters: { type: string, min: number, max: number, nSymbolsToCreate: number, symbol: any }, parent?: Symbol) {
		super(parameters, parent)
		let defaultParameters = (<typeof PlacerMinMax>this.constructor).defaultParameters
		this.min = parameters.min != null ? parameters.min : defaultParameters.min
		this.max = parameters.max != null ? parameters.max : defaultParameters.max
		this.initializeNSymbolsToCreate()
	}

	initializeNSymbolsToCreate() {
		// this.nSymbolsToCreate = Math.round(this.min + Math.random() * (this.max - this.min))
	}

	reset(bounds: Bounds): void {
		super.reset(bounds)
		this.initializeNSymbolsToCreate()
	}
}

type ShapeProbability = {
	weight: number,
	type: string,
	parameters: any
}

export class RandomPlacer extends Symbol {

	static defaultParameters = { 
		shapeProbabilities: [{
				weight: 1,
				type: 'rectangle',
				parameters: {}
			}, {
				weight: 1,
				type: 'circle',
				parameters: {}
			}]
	}

	symbols: Symbol[]
	
	parameters: {
		shapeProbabilities: ShapeProbability[]
	}

	folders: dat.GUI[]
	totalWeight: number
	currentSymbol: Symbol
	symbolCount: number

	constructor(parameters: { effects: { type: string, parameters: any }, shapeProbabilities: ShapeProbability[] }, parent?: Symbol) {
		super(parameters, parent)

		this.symbols = []
		this.symbolCount = 0
		this.folders = []
		this.currentSymbol = null
		
		this.totalWeight = 0
		for(let shapeProbability of this.parameters.shapeProbabilities) {
			this.addProbability(shapeProbability)
		}
		
	}

	getJSON() {
		let json = super.getJSON()
		let shapeProbabilities = []
		let i = 0
		for(let symbol of this.symbols) {
			let shapeProbability: any = symbol.getJSON()
			shapeProbability.weight = this.parameters.shapeProbabilities[i].weight
			shapeProbabilities.push(shapeProbability)
			i++
		}
		json.parameters.shapeProbabilities = shapeProbabilities
		return json
	}

	addSymbol() {
		let shapeProbability: ShapeProbability = {
			weight: 1,
			type: 'rectangle',
			parameters: {}
		}

		let index = this.parameters.shapeProbabilities.length
		this.parameters.shapeProbabilities.push(shapeProbability)
		this.addProbability(shapeProbability)
		this.addProbabilityGUI(shapeProbability, this.gui, index)
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this, 'addSymbol').name('Add symbol')
		this.addProbabilitiesGUI()
	}
	
	addProbabilitiesGUI() {
		let i=0
		for(let shapeProbability of this.parameters.shapeProbabilities) {
			this.addProbabilityGUI(shapeProbability, this.gui, i)
			i++
		}
	}

	removeProbabilitiesGUI() {
		let parent: any = this.gui
		for(let folder of this.folders) {
			parent.removeFolder(folder)
		}
		this.folders = []
	}

	recreateProbabilitiesGUI() {
		this.removeProbabilitiesGUI()
		this.addProbabilitiesGUI()
	}

	createDeleteSymbol(shapeProbability: ShapeProbability) {
		return ()=> {
			this.totalWeight -= shapeProbability.weight
			let index = this.parameters.shapeProbabilities.indexOf(shapeProbability)
			this.parameters.shapeProbabilities.splice(index, 1)
			this.symbols.splice(index, 1)
			let gui: any = this.gui
			let folder = this.folders[index]
			gui.removeFolder(folder)
			this.folders.splice(index, 1)
		}
	}

	computeWeight() {
		this.totalWeight = 0
		for(let shapeProbability of this.parameters.shapeProbabilities) {
			this.totalWeight += shapeProbability.weight
		}
	}

	changeChildSymbol(symbol: Symbol, type: string) {

		let index = this.symbols.indexOf(symbol)
		let shapeProbability = this.parameters.shapeProbabilities[index]
		shapeProbability.type = type

		let effects = this.symbols[index].effects

		shapeProbability.parameters  = {}
		this.symbols[index] = Symbol.createSymbol(type, {}, this)
		this.symbols[index].setEffects(effects)

		this.recreateProbabilitiesGUI()
	}

	addProbability(shapeProbability: ShapeProbability) {
		let symbol = Symbol.createSymbol(shapeProbability.type, shapeProbability.parameters, this)
		this.symbols.push(symbol)
		this.totalWeight += shapeProbability.weight
	}

	addProbabilityGUI(shapeProbability: ShapeProbability, gui: dat.GUI, i: number, folder: dat.GUI = null) {
		
		if(folder == null) {
			folder = gui.addFolder('Symbol' + ++this.symbolCount)
			if(gui.__folders.hasOwnProperty('Effects')) {
				$((<any>gui.__folders).Effects.domElement).insertAfter(folder.domElement)
			}
			folder.open()
			this.folders.push(folder)
		}

		folder.add(shapeProbability, 'weight', 0, 100).step(1).name('Weight').onFinishChange( ()=> this.computeWeight() )

		this.symbols[i].createGUI(folder)
		
		folder.add({ deleteSymbol: this.createDeleteSymbol(shapeProbability) }, 'deleteSymbol').name('Delete symbol')
		return folder
	}

	nextCurrentSymbol(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let result = this.currentSymbol.next(bounds, container, positions)

		if(this.currentSymbol.hasFinished()) {
			this.currentSymbol.reset(bounds)
			this.currentSymbol = null
		}

		return result
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		if(this.currentSymbol != null) {
			return this.nextCurrentSymbol(bounds, container, positions)
		}

		let random = Math.random() * this.totalWeight
		let sum = 0

		let i = 0
		for(let shapeProbability of this.parameters.shapeProbabilities) {
			sum += shapeProbability.weight
			if(sum > random) {
				this.currentSymbol = this.symbols[i]
				this.currentSymbol.reset(bounds)
				return this.nextCurrentSymbol(bounds, container, positions)
			}
			i++
		}

		return null
	}
	
	hasFinished(): boolean {
		return this.currentSymbol == null
	}
}

Symbol.addSymbol(RandomPlacer, 'random-symbol')