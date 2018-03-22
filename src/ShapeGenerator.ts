import { Symbol } from './Placer'
import { ColorGenerator } from './ColorGenerator'

export interface ShapeGeneratorInterface extends Symbol {
}

export class ShapeGenerator implements ShapeGeneratorInterface {
	colorGenerator: ColorGenerator
	constructor(colorGenerator: ColorGenerator) {
		this.colorGenerator = colorGenerator
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: any = null): paper.Path {
		return null
	}
	hasFinished(): boolean {
		return true
	}
	reset(item: paper.Path): void {
	}
}

export class RectangleGenerator extends ShapeGenerator {
	
	constructor(colorGenerator: ColorGenerator) {
		super(colorGenerator)
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: { width?: number, height?: number, size?: number, widthRatio?: number, heightRatio?: number, sizeRatio?: number } = null): paper.Path {
		let bounds = item.bounds.clone()
		if(parameters != null) {
			let width = bounds.width
			let height = bounds.height
			if((parameters.width != null && parameters.height != null) || parameters.size != null) {
				width = parameters.width != null ? parameters.width : parameters.size
				height = parameters.height != null ? parameters.height : parameters.size
				
			} else if((parameters.widthRatio != null && parameters.heightRatio != null) || parameters.sizeRatio != null) {
				width = parameters.widthRatio != null ? parameters.widthRatio * bounds.width : parameters.sizeRatio * bounds.width
				height = parameters.heightRatio != null ? parameters.heightRatio * bounds.height : parameters.sizeRatio * bounds.width
			}
			let center = bounds.center.clone()
			bounds.x = center.x - width / 2
			bounds.y = center.y - height / 2
			bounds.width = width
			bounds.height = height
		}

		let rectangle = new paper.Path.Rectangle(bounds)
		this.colorGenerator.setColor(positions, rectangle, container)
		return rectangle
	}

}

export class CircleGenerator extends ShapeGenerator {
	
	constructor(colorGenerator: ColorGenerator) {
		super(colorGenerator)
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: { radius?: number, radiusRatio?: number } = null): paper.Path {
		let defaultRadius = Math.min(item.bounds.width, item.bounds.height) / 2
		let radius = defaultRadius
		if(parameters != null) {
			if(parameters.radius != null) {
				radius = parameters.radius
			} else if (parameters.radiusRatio != null) {
				radius = parameters.radiusRatio * defaultRadius
			}
		}

		let circle = new paper.Path.Circle(item.bounds.center, radius)
		this.colorGenerator.setColor(positions, circle, container)
		return circle
	}

}

export class PolygonOnBoxGenerator extends ShapeGenerator {
	
	static indexToName = ['topLeft', 'topCenter', 'topRight', 'rightCenter', 'bottomRight', 'bottomCenter', 'bottomLeft', 'leftCenter', 'center']

	constructor(colorGenerator: ColorGenerator) {
		super(colorGenerator)
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: { vertexIndices?: number[], vertexNames?: string[], closed?: boolean } = null): paper.Path {
		let polygon = new paper.Path()
		let bounds: any = item.bounds
		if(parameters == null){
			polygon.add(bounds.topCenter)
			polygon.add(bounds.bottomLeft)
			polygon.add(bounds.bottomRight)
		}
		else if(parameters.vertexIndices != null) {
			for(let i of parameters.vertexIndices) {
				polygon.add(bounds[PolygonOnBoxGenerator.indexToName[i]])
			}
		}
		else if(parameters.vertexNames != null) {
			for(let name of parameters.vertexNames) {
				polygon.add(bounds[name])
			}
		}

		polygon.closed = parameters != null ? parameters.closed : true

		this.colorGenerator.setColor(positions, polygon, container)
		return polygon
	}

}

type ParameterProbability = {
	parameters: any
	probability: number
}

type ShapeProbability = {
	shape: ShapeGenerator,
	parameterProbabilities: ParameterProbability[]
}

export class RandomShapeGenerator extends ShapeGenerator {

	shapeProbabilities: ShapeProbability[]

	constructor(colorGenerator: ColorGenerator) {
		super(colorGenerator)
		this.shapeProbabilities = []
		
		let rectangleParameterProbabilities: ParameterProbability[] = []
		rectangleParameterProbabilities.push( { parameters: null, probability: 0 } )
		rectangleParameterProbabilities.push( { parameters: {sizeRatio: 0.5 }, probability: 0 } )
		// rectangleParameterProbabilities.push( { parameters: {widthRatio: 1, heightRatio: 0.3333 }, probability: 0 } )
		// rectangleParameterProbabilities.push( { parameters: {widthRatio: 0.3333, heightRatio: 1 }, probability: 0 } )
		this.shapeProbabilities.push( { shape: new RectangleGenerator(colorGenerator), parameterProbabilities: rectangleParameterProbabilities })
		
		let circleParameterProbabilities: ParameterProbability[] = []
		circleParameterProbabilities.push( { parameters: null, probability: 0 } )
		circleParameterProbabilities.push( { parameters: {radiusRatio: 0.5 }, probability: 0 } )
		this.shapeProbabilities.push( { shape: new CircleGenerator(colorGenerator), parameterProbabilities: circleParameterProbabilities })
	
		// 0 1 2 
		// 7 8 3
		// 6 5 4

		let polygonOnBoxParameterProbabilities: ParameterProbability[] = []
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [1, 4, 6]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 2, 5]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 3, 6]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [2, 4, 7]}, probability: 0 } )

		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 2, 6]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [2, 4, 6]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 2, 4]}, probability: 0 } )
		// polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [4, 6, 0]}, probability: 0 } )

		polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 2, 8]}, probability: 0 } )
		polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [2, 4, 8]}, probability: 0 } )
		polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [4, 6, 8]}, probability: 0 } )
		polygonOnBoxParameterProbabilities.push( { parameters: {vertexIndices: [0, 6, 8]}, probability: 0 } )

		this.shapeProbabilities.push( { shape: new PolygonOnBoxGenerator(colorGenerator), parameterProbabilities: polygonOnBoxParameterProbabilities })
		
		for(let shapeProbability of this.shapeProbabilities) {
			let nShapes = shapeProbability.parameterProbabilities.length
			for(let parameterProbability of shapeProbability.parameterProbabilities) {
				parameterProbability.probability = (1 / nShapes) / 3
			}
		}
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: any = null): paper.Path {
		let random = Math.random()
		let sum = 0
		for(let shapeProbability of this.shapeProbabilities) {
			for(let parameterProbability of shapeProbability.parameterProbabilities) {
				sum += parameterProbability.probability
				if(sum > random) {
					let itemShrinked: paper.Path = <any>item.clone()
					itemShrinked.scale(0.8)
					let result = shapeProbability.shape.next(itemShrinked, container, positions, parameterProbability.parameters)
					return result
				}
			}
		}
		return null
	}

}