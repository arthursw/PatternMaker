import * as paper from 'paper';
import * as dat from 'dat.gui'
import { sizeToPoint } from './Utils';
import { Bounds } from './Bounds';
import { Symbol } from './Symbol';
import { ColorGenerator, RandomColorFromPalette } from './ColorGenerator';
import { ShapeGenerator, RectangleGenerator } from './ShapeGenerator';

export class Placer extends Symbol {

	nCreatedSymbols: number
	nSymbolsToCreate: number
	
	bounds: Bounds
	symbol: Symbol

	folder: dat.GUI

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)

		let symbol = Symbol.CreateSymbol(parameters.symbol.type, Symbol.passParameters(parameters), this)

		this.nCreatedSymbols = 0
		this.nSymbolsToCreate = parameters.count


		this.symbol = symbol
		this.bounds = null
	}

	createGUI(gui: dat.GUI) {
		this.gui = gui
		this.addTypeOnGUI(gui)
		this.addGUIParameters(gui)
		this.folder = gui.addFolder('Symbol')
		this.symbol.createGUI(this.folder)
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this, 'nSymbolsToCreate', 1, 100).step(1).name('Num. Symbols')
	}
	
	changeChildSymbol(symbol: Symbol, type: string) {
		let gui: any = this.gui
		gui.removeFolder(this.folder)
		this.folder = this.gui.addFolder('Symbol')

		this.symbol = Symbol.CreateSymbol(type, {}, this)
		this.symbol.createGUI(this.folder)
	}

	initializeBounds(bounds: Bounds) {
		this.bounds = new Bounds(bounds.rectangle)
	}

	transform() {
		this.nCreatedSymbols++
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = [], parameters: any = null): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(this.bounds == null) {
			this.initializeBounds(bounds)
		}

		positions.push(this.nCreatedSymbols / this.nSymbolsToCreate)
		let result = this.symbol.next(this.bounds, container, positions)

		if(this.symbol.hasFinished()) {
			this.transform()
			this.symbol.reset(this.bounds)
		}
		
		return result
	}

	hasFinished() {
		return this.nCreatedSymbols == this.nSymbolsToCreate
	}

	reset(bounds: Bounds): void {
		this.nCreatedSymbols = 0
		this.initializeBounds(bounds)
		this.symbol.reset(this.bounds)
	}
}

Symbol.addSymbol(Placer, 'placer')

export class PlacerX extends Placer {

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)
	}
	
	addGUIParameters(gui: dat.GUI) {
		gui.add(this, 'nSymbolsToCreate', 1, 100).step(1).name('Width')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		this.bounds.setWidth(bounds.rectangle.width / this.nSymbolsToCreate)
	}

	transform() {
		super.transform()
		this.bounds.setX(this.bounds.rectangle.x + this.bounds.rectangle.width)
	}
}

Symbol.addSymbol(PlacerX, 'placer-x')

export class PlacerY extends Placer {

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)
	}
	
	addGUIParameters(gui: dat.GUI) {
		gui.add(this, 'nSymbolsToCreate', 1, 100).step(1).name('Height')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		this.bounds.setHeight(bounds.rectangle.height / this.nSymbolsToCreate)
	}

	transform() {
		super.transform()
		this.bounds.setY(this.bounds.rectangle.y + this.bounds.rectangle.height)
	}
}

Symbol.addSymbol(PlacerY, 'placer-y')

export class PlacerZ extends Placer {

	scale: number
	margin: boolean

	constructor(parameters: { count: number, scale: number, margin: boolean, symbol: any, colors?: any }) {
		super(parameters)
		this.scale = parameters.scale ? parameters.scale : 0.5
		this.margin = parameters.margin ? parameters.margin : false
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this, 'nSymbolsToCreate', 1, 100).step(1).name('Depth')
		gui.add(this, 'margin').name('Margin')
		gui.add(this, 'scale', 0, 1).step(0.01).name('Scale')
	}

	initializeBounds(bounds: Bounds) {
		super.initializeBounds(bounds)
		if(this.margin) {
			this.transform()
			this.nCreatedSymbols--
		}
	}

	transform() {
		super.transform()
		let scale = 1 - this.scale
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

Symbol.addSymbol(PlacerZ, 'placer-z')

export class PlacerXYZ extends PlacerY {

	constructor(parameters: { width: number, height: number, count: number, margin: boolean, scale: number, symbol: any, colors?: any }) {
		let newParameters = {
			count: parameters.height,
			symbol: {
				type: 'placer-x',
				parameters: {
					count: parameters.width,
					symbol: {
						type: 'placer-z',
						parameters: {
							count: parameters.count,
							margin: parameters.margin,
							scale: parameters.scale,
							symbol: {
								type: parameters.symbol.type,
								parameters: Placer.passParameters(parameters)
							}
						}
					}
				}
			}
		}
		super(newParameters)
	}

	getSymbol() {
		return (<any>this.symbol).symbol
	}

	createGUI(gui: dat.GUI) {
		this.gui = gui
		this.addTypeOnGUI(gui)
		this.addGUIParameters(gui)
		this.folder = gui.addFolder('Symbol')
		this.getSymbol().symbol.createGUI(this.folder)
	}

	addGUIParameters(gui: dat.GUI) {
		let childSymbol = this.getSymbol()
		gui.add(this.symbol, 'nSymbolsToCreate', 1, 100).step(1).name('Width')
		gui.add(this, 'nSymbolsToCreate', 1, 100).step(1).name('Height')
		gui.add(childSymbol, 'nSymbolsToCreate', 1, 100).step(1).name('Depth')
		gui.add(childSymbol, 'margin').name('Margin')
		gui.add(childSymbol, 'scale', 0, 1).step(0.01).name('Scale')
	}
}

Symbol.addSymbol(PlacerXYZ, 'placer-xyz')

export class PlacerMinMax extends Placer {
	
	count: any

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

	reset(bounds: Bounds): void {
		super.reset(bounds)
		this.initializeNSymbolsToCreate()
	}
}

Symbol.addSymbol(PlacerMinMax, 'placer-min-max')