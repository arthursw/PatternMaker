import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import { ColorGenerator } from './ColorGenerator';

export class ShapeGenerator extends Symbol {
	
	constructor(parameters: { colors?: any }) {
		super(parameters)
		if(this.colorGenerator == null) {
			this.colorGenerator = new ColorGenerator()
		}
	}
}

export let symbolGenerators = new Map<string, SymbolConstructor>()

export class RectangleGenerator extends ShapeGenerator {

	size: paper.Size

	constructor(parameters: { colors?: any, width?: number, height?: number }) {
		super(parameters)
		this.size = new paper.Size(parameters.width != null ? parameters.width : 1, parameters.height != null ? parameters.height : 1)
	}

	intializeSize(rectangle: paper.Rectangle) {
		rectangle.width = this.size.width * rectangle.width
		rectangle.height = this.size.height * rectangle.height
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let rectangle = bounds.rectangle.clone()

		let center = rectangle.center.clone()
		this.intializeSize(rectangle)
		rectangle.x = center.x - rectangle.width / 2
		rectangle.y = center.y - rectangle.height / 2

		let shape = new paper.Path.Rectangle(rectangle)
		this.colorGenerator.setColor(positions, shape, container)
		return shape
	}

}

symbolGenerators.set('rectangle', RectangleGenerator)

export class RectangleAbsoluteGenerator extends RectangleGenerator {

	intializeSize(bounds: paper.Rectangle) {
		bounds.width = this.size.width
		bounds.height = this.size.height
	}
}

symbolGenerators.set('rectangle-absolute', RectangleGenerator)

export class CircleGenerator extends ShapeGenerator {

	radius: number

	constructor(parameters: { colors?: any, radius?: number }) {
		super(parameters)
		this.radius = parameters.radius != null ? parameters.radius : 1
	}

	getRadius(bounds: Bounds) {
		let defaultRadius = Math.min(bounds.rectangle.width, bounds.rectangle.height) / 2
		return this.radius * defaultRadius
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let circle = new paper.Path.Circle(bounds.rectangle.center, this.getRadius(bounds))
		this.colorGenerator.setColor(positions, circle, container)
		return circle
	}

}

symbolGenerators.set('circle', CircleGenerator)

export class CircleAbsoluteGenerator extends CircleGenerator {

	getRadius(bounds: Bounds) {
		return this.radius
	}
}

symbolGenerators.set('circle-absolute', CircleAbsoluteGenerator)

export class PolygonOnBoxGenerator extends ShapeGenerator {
	
	static indexToName = ['topLeft', 'topCenter', 'topRight', 'rightCenter', 'bottomRight', 'bottomCenter', 'bottomLeft', 'leftCenter', 'center']

	vertexIndices: number[]
	vertexNames: string[]
	closed: boolean

	constructor(parameters: { colors?: any, vertexIndices?: number[], vertexNames?: string[], closed?: boolean }) {
		super(parameters)
		this.vertexIndices = parameters.vertexIndices
		this.vertexNames = parameters.vertexNames
		this.closed = parameters.closed
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let polygon = new paper.Path()
		let rectangle: any = bounds.rectangle
		if(this.vertexNames == null && this.vertexIndices == null){
			polygon.add(rectangle.topCenter)
			polygon.add(rectangle.bottomLeft)
			polygon.add(rectangle.bottomRight)
		}
		else if(this.vertexIndices != null) {
			for(let i of this.vertexIndices) {
				polygon.add(rectangle[PolygonOnBoxGenerator.indexToName[i]])
			}
		}
		else if(this.vertexNames != null) {
			for(let name of this.vertexNames) {
				polygon.add(rectangle[name])
			}
		}

		polygon.closed = this.closed != null ? this.closed : true

		this.colorGenerator.setColor(positions, polygon, container)
		return polygon
	}

}

symbolGenerators.set('polygon-on-box', PolygonOnBoxGenerator)

type ShapeProbability = {
	weight: number,
	type: string,
	parameters: any
}

export class RandomShapeGenerator extends Symbol {

	symbols: Symbol[]
	shapeProbabilities: ShapeProbability[]
	totalWeight: number

	constructor(parameters: { colors: { type: string, parameters: any }, shapeProbabilities: ShapeProbability[] }) {
		super(parameters)

		this.symbols = []
		this.shapeProbabilities = parameters.shapeProbabilities
		
		this.totalWeight = 0
		for(let shapeProbability of parameters.shapeProbabilities) {
			let SymbolGenerator = symbolGenerators.get(shapeProbability.type)
			let symbol = new SymbolGenerator(Symbol.passParametersColors(shapeProbability, parameters.colors))
			this.symbols.push(symbol)
			this.totalWeight += shapeProbability.weight
		}
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let random = Math.random() * this.totalWeight
		let sum = 0

		let i = 0
		for(let shapeProbability of this.shapeProbabilities) {
			sum += shapeProbability.weight
			if(sum > random) {
				let symbol = this.symbols[i]
				let result = symbol.next(bounds, container, positions)

				if(symbol.hasFinished()) {
					symbol.reset(bounds)
				}

				return result
			}
			i++
		}

		return null
	}

}

symbolGenerators.set('random-shape', RandomShapeGenerator)