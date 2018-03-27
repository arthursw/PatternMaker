import * as paper from 'paper';
import * as dat from 'dat.gui'
import { sizeToPoint } from './Utils';
import { ColorGenerator, RandomColorFromPalette } from './ColorGenerator';
import { ShapeGenerator, RectangleGenerator, symbolGenerators } from './ShapeGenerator';

export interface Symbol {
	next(item: paper.Path | paper.Rectangle, container: paper.Path, positions?: number[], parameters?: any): paper.Path // generates a paper.Path
	hasFinished(): boolean
	reset(item: paper.Path | paper.Rectangle): void
}

export interface SymbolConstructor {
	createGUI(gui: dat.GUI): void
	new (...args: any[]): Symbol;
}

export interface PlacerInterface extends Symbol {
	symbol: Symbol
}

export class SimpleInstanciator implements PlacerInterface {

	symbol: Symbol
	x: number
	n: number

	constructor(parameters: {count: number, symbol: any }) {

		let SymbolConstructor = symbolGenerators.get(parameters.symbol.type)
		let symbol = new SymbolConstructor(parameters.symbol.parameters)

		this.n = parameters.count

		this.symbol = symbol
	}

	next(item: paper.Rectangle, container: paper.Path, positions?: number[], parameters?: any): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		positions.push(this.x)

		let result = this.symbol.next(item, container, positions)

		if(this.symbol.hasFinished()) {
			this.x++
			if(this.x == this.n) {
				
			}
			this.symbol.reset(item)
		}
		
		return result
	}

	hasFinished(): boolean {
		return this.x == this.n
	}

	reset(item: paper.Rectangle): void {
		this.x = 0
	}
}

export class SimpleGrid implements PlacerInterface {

	symbol: Symbol
	x: number
	y: number
	nWidth: number
	nHeight: number
	rectangle: paper.Rectangle

	constructor(parameters: {count: number, symbol: any, nWidth: number, nHeight: number }) {

		let SymbolConstructor = symbolGenerators.get(parameters.symbol.type)
		let symbol = new SymbolConstructor(parameters.symbol.parameters)

		this.nWidth = parameters.nWidth
		this.nHeight = parameters.nHeight

		this.rectangle = null

		this.symbol = symbol
	}

	next(item: paper.Rectangle, container: paper.Path, positions?: number[], parameters?: any): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(this.rectangle == null) {
			this.rectangle = item.clone()
			this.rectangle.width /= this.nWidth
			this.rectangle.height /= this.nHeight
		}

		positions.push(this.x / this.nWidth, this.y / this.nHeight)

		let result = this.symbol.next(this.rectangle, container, positions)

		if(this.symbol.hasFinished()) {
			this.x++
			this.rectangle.x += this.rectangle.width
			if(this.x == this.nWidth) {
				this.x = 0
				this.rectangle.x = 0
				this.y++
				this.rectangle.y += this.rectangle.height
				if(this.y == this.nHeight) {
					
				}
			}
			this.symbol.reset(this.rectangle)
		}
		
		return result
	}

	hasFinished(): boolean {
		return this.y == this.nHeight
	}

	reset(item: paper.Rectangle): void {
		this.x = 0
		this.y = 0
		this.rectangle.x = 0
		this.rectangle.y = 0
	}
}

export class Placer implements PlacerInterface {
	
	static parameters = {
		type: '',
		count: 10,
		countMin: 0,
		countMax: 20,
	}

	type: string
	nCreatedSymbols: number
	nSymbolsToCreate: number
	
	currentShape: paper.Path
	symbol: Symbol
	matrix: paper.Matrix

	static createFromJSON(parameters: { type: string, parameters: any }): Symbol {
		let SymbolConstructor = symbolGenerators.get(parameters.type)
		return new SymbolConstructor(parameters.parameters)
	}

	static createSymbolGUI(gui: dat.GUI) {
		gui.addFolder('Symbol')
		gui.add(this.parameters, 'type').name('Type').onChange( (value: string)=> {
			let SymbolConstructor = symbolGenerators.get(value)
			SymbolConstructor.createGUI(gui)
		})
	}

	static createGUI(gui: dat.GUI) {
		gui.add(this.parameters, 'count').name('Count')
		this.createSymbolGUI(gui)
	}

	constructor(parameters: { type: string, count: number, symbol: any }) {

		let SymbolConstructor = symbolGenerators.get(parameters.symbol.type)
		let symbol = new SymbolConstructor(parameters.symbol.parameters)

		this.type = parameters.type

		this.nCreatedSymbols = 0
		this.nSymbolsToCreate = parameters.count


		this.symbol = symbol
		this.currentShape = null
		this.matrix = new paper.Matrix(1, 0, 0, 1, 0, 0)
	}


	createShape(item: paper.Path) {
		let rectangle = item.bounds.clone()
		
		if(this.type == 'x') {
			rectangle.width = rectangle.width / this.nSymbolsToCreate
			this.matrix.translate(new paper.Point(rectangle.width, 0))
		} else if (this.type == 'y') {
			rectangle.height = rectangle.height / this.nSymbolsToCreate
			this.matrix.translate(new paper.Point(0, rectangle.height))
		} else if (this.type == 'static') {
		}
		
		this.currentShape = new paper.Path.Rectangle(rectangle)
		this.initializePosition(item)
	}

	initializePosition(item: paper.Path) {
		if(this.currentShape != null) {
			this.currentShape.position.x = item.bounds.left + this.currentShape.bounds.width / 2
			this.currentShape.position.y = item.bounds.top + this.currentShape.bounds.height / 2
		}
	}

	transform() {
		this.currentShape.transform(this.matrix)
		this.nCreatedSymbols++
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: any = null): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(this.currentShape == null) {
			this.createShape(item)
		}

		positions.push(this.nCreatedSymbols / this.nSymbolsToCreate)
		let result = this.symbol.next(this.currentShape, container, positions)

		if(this.symbol.hasFinished()) {
			this.transform()
			this.symbol.reset(this.currentShape)
		}
		
		return result
	}

	hasFinished() {
		return this.nCreatedSymbols == this.nSymbolsToCreate
	}

	reset(item: paper.Path): void {
		this.nCreatedSymbols = 0
		this.initializePosition(item)
		this.symbol.reset(this.currentShape)
	}
}

symbolGenerators.set('placer', Placer)


export class PlacerMinMax extends Placer {
	
	count: any

	static createGUI(gui: dat.GUI) {
		gui.add(this.parameters, 'countMin').name('Count min')
		gui.add(this.parameters, 'countMax').name('Count max')
		this.createSymbolGUI(gui)
	}

	constructor(parameters: { type: string, count: any, symbol: any }) {
		super(parameters)
		this.count = parameters.count
		this.initializeNSymbolsToCreate()
	}

	initializeNSymbolsToCreate() {
		this.nSymbolsToCreate = 1
		if(Number.isFinite(this.count)) {
			this.nSymbolsToCreate = this.count
		} else if(Number.isFinite(this.count.min) && Number.isFinite(this.count.max)) {
			this.nSymbolsToCreate = Math.round(this.count.min + Math.random() * (this.count.max - this.count.min))
		}
	}

	reset(item: paper.Path): void {
		super.reset(item)
		this.initializeNSymbolsToCreate()
	}
}