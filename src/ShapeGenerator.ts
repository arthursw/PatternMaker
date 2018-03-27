import { Symbol, SymbolConstructor } from './Placer'
import { ColorGenerator, colorGenerators } from './ColorGenerator'

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

export let symbolGenerators = new Map<string, SymbolConstructor>()

export class RectangleGenerator extends ShapeGenerator {
	
	static parameters = {
		width: 0.5,
		height: 0.5
	}

	static createGUI(gui: dat.GUI) {
		gui.add(this.parameters, 'width').name('Width')
		gui.add(this.parameters, 'height').name('Height')
	}

	constructor(parameters: { colorGenerator?: ColorGenerator }) {
		super(parameters.colorGenerator)
	}

	intializeSize(bounds: paper.Rectangle, parameters: any) {
		bounds.width = parameters.width * bounds.width
		bounds.height = parameters.height * bounds.height
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: { width?: number, height?: number, size?: number, widthRatio?: number, heightRatio?: number, sizeRatio?: number } = null): paper.Path {
		let bounds = item.bounds.clone()
		if(parameters != null) {
			let center = bounds.center.clone()
			this.intializeSize(bounds, parameters)
			bounds.x = center.x - bounds.width / 2
			bounds.y = center.y - bounds.height / 2
		}

		let rectangle = new paper.Path.Rectangle(bounds)
		this.colorGenerator.setColor(positions, rectangle, container)
		return rectangle
	}

}

symbolGenerators.set('rectangle', RectangleGenerator)

export class RectangleAbsoluteGenerator extends ShapeGenerator {

	intializeSize(bounds: paper.Rectangle, parameters: any) {
		bounds.width = parameters.width
		bounds.height = parameters.height
	}
}

symbolGenerators.set('rectangle-absolute', RectangleGenerator)

export class CircleGenerator extends ShapeGenerator {
	
	static parameters = {
		radius: 0.5
	}

	static createGUI(gui: dat.GUI) {
		gui.add(this.parameters, 'radius').name('Radius')
	}

	constructor(parameters: { colorGenerator?: ColorGenerator }) {
		super(parameters.colorGenerator)
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

symbolGenerators.set('circle', CircleGenerator)

export class PolygonOnBoxGenerator extends ShapeGenerator {
	
	static parameters = {
		vertexIndices: ''
	}

	static createGUI(gui: dat.GUI) {
		gui.add(this.parameters, 'vertexIndices').name('Vertex indices')
	}

	static indexToName = ['topLeft', 'topCenter', 'topRight', 'rightCenter', 'bottomRight', 'bottomCenter', 'bottomLeft', 'leftCenter', 'center']

	constructor(parameters: { colorGenerator?: ColorGenerator }) {
		super(parameters.colorGenerator)
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

symbolGenerators.set('polygon-on-box', PolygonOnBoxGenerator)

type ShapeProbability = {
	weight: number,
	type: string,
	parameters: any
}

export class RandomShapeGenerator extends ShapeGenerator {

	symbols: Map<string, Symbol>
	shapeProbabilities: ShapeProbability[]
	totalWeight: number

	static shapeFolders: Map<dat.GUI, dat.GUI> = new Map<dat.GUI, dat.GUI>()
	static folder: dat.GUI = null

	static parameters = {
		addShape: ()=> {
			let folder = RandomShapeGenerator.folder.addFolder('Shape ' + RandomShapeGenerator.shapeFolders.size)
			RandomShapeGenerator.shapeFolders.set(folder, null)
			let parameters = {
				weight: 1,
				type: 'rectangle'
			}
			folder.add(parameters, 'weight').name('Weight')
			RandomShapeGenerator.parameters.shapes.push({
				weight: 1,
				type: 'rectangle',
				parameters: {}
			})
			folder.add(parameters, 'type').name('Type').onChange( (value: string)=> {
				let SymbolGenerator = symbolGenerators.get(value)
				let parametersFolder = RandomShapeGenerator.shapeFolders.get(folder)
				if(parametersFolder != null) {
					folder.remove(<any>parametersFolder)
				}
				parametersFolder = folder.addFolder('Parameters')
				RandomShapeGenerator.shapeFolders.set(folder, parametersFolder)
				SymbolGenerator.createGUI(parametersFolder)
				parametersFolder.add({'delete': ()=> {
					RandomShapeGenerator.folder.remove(<any>folder)
				}}, 'delete').name('Delete shape')
			} )
		},
		shapes: <ShapeProbability[]>[]
	}

	static createGUI(gui: dat.GUI) {
		this.folder = gui.addFolder('Shape probabilities')
		this.folder.open()
		this.folder.add(this.parameters, 'addShape')
	}

	constructor(parameters: { colors: { type: string, parameters: any }, shapeProbabilities: ShapeProbability[] }) {
		let ColorGen = colorGenerators.get(parameters.colors.type)
		let colorGenerator = new ColorGen(parameters.colors.parameters)
		super(colorGenerator)

		this.symbols = new Map<string, Symbol>()
		this.shapeProbabilities = parameters.shapeProbabilities
		
		this.totalWeight = 0
		for(let shapeProbability of parameters.shapeProbabilities) {
			let Symbol = symbolGenerators.get(shapeProbability.type)
			let symbolParameters = {...shapeProbability.parameters, colorGenerator: colorGenerator}
			let symbol = new Symbol(symbolParameters)
			this.symbols.set(shapeProbability.type, symbol)
			this.totalWeight += shapeProbability.weight
		}
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: any = null): paper.Path {
		let random = Math.random() * this.totalWeight
		let sum = 0

		for(let shapeProbability of this.shapeProbabilities) {
			sum += shapeProbability.weight
			if(sum > random) {
				return this.symbols.get(shapeProbability.type).next(item, container, positions, shapeProbability.parameters)
			}
		}

		return null
	}

}

symbolGenerators.set('random-shape', RandomShapeGenerator)