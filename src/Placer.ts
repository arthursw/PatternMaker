import * as paper from 'paper';
import * as dat from 'dat.gui'
import { sizeToPoint } from './Utils';
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import { ColorGenerator, RandomColorFromPalette } from './ColorGenerator';
import { ShapeGenerator, RectangleGenerator, symbolGenerators } from './ShapeGenerator';

export class Placer extends Symbol {

	nCreatedSymbols: number
	nSymbolsToCreate: number
	
	bounds: Bounds
	symbol: Symbol

	static createFromJSON(parameters: { type: string, parameters: any }): Symbol {
		let SymbolGenerator = symbolGenerators.get(parameters.type)
		return new SymbolGenerator(parameters.parameters)
	}

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)

		let SymbolGenerator = symbolGenerators.get(parameters.symbol.type)
		
		let symbol = new SymbolGenerator(Symbol.passParameters(parameters))

		this.nCreatedSymbols = 0
		this.nSymbolsToCreate = parameters.count


		this.symbol = symbol
		this.bounds = null
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

symbolGenerators.set('placer', Placer)

export class PlacerX extends Placer {

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)
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

symbolGenerators.set('placer-x', PlacerX)

export class PlacerY extends Placer {

	constructor(parameters: { count: number, symbol: any, colors?: any }) {
		super(parameters)
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

symbolGenerators.set('placer-y', PlacerY)

export class PlacerZ extends Placer {

	scale: number
	margin: boolean

	constructor(parameters: { count: number, scale: number, margin: boolean, symbol: any, colors?: any }) {
		super(parameters)
		this.scale = parameters.scale ? parameters.scale : 0.5
		this.margin = parameters.margin ? parameters.margin : false
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

symbolGenerators.set('placer-z', PlacerZ)

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
}

symbolGenerators.set('placer-xyz', PlacerXYZ)

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