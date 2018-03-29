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

	createGUI(gui: dat.GUI) {
		this.addTypeOnGUI(gui)
	}
}

export class RectangleGenerator extends ShapeGenerator {

	size: paper.Size

	constructor(parameters: { colors?: any, width?: number, height?: number }) {
		super(parameters)
		this.size = new paper.Size(parameters.width != null ? parameters.width : 1, parameters.height != null ? parameters.height : 1)
	}

	createGUI(gui: dat.GUI) {
		super.createGUI(gui)
		gui.add(this.size, 'width', 0, 1).step(0.01).name('Width')
		gui.add(this.size, 'height', 0, 1).step(0.01).name('Height')
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

Symbol.addSymbol(RectangleGenerator, 'rectangle')

export class RectangleAbsoluteGenerator extends RectangleGenerator {

	intializeSize(bounds: paper.Rectangle) {
		bounds.width = this.size.width
		bounds.height = this.size.height
	}
}

Symbol.addSymbol(RectangleAbsoluteGenerator, 'rectangle-absolute')

export class CircleGenerator extends ShapeGenerator {

	radius: number

	constructor(parameters: { colors?: any, radius?: number }) {
		super(parameters)
		this.radius = parameters.radius != null ? parameters.radius : 1
	}

	createGUI(gui: dat.GUI) {
		super.createGUI(gui)
		gui.add(this, 'radius', 0, 1).step(0.01).name('Radius')
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

Symbol.addSymbol(CircleGenerator, 'circle')

export class CircleAbsoluteGenerator extends CircleGenerator {

	getRadius(bounds: Bounds) {
		return this.radius
	}
}

Symbol.addSymbol(CircleAbsoluteGenerator, 'circle-absolute')

export class PolygonOnBoxGenerator extends ShapeGenerator {
	
	static indexToName = ['topLeft', 'topCenter', 'topRight', 'rightCenter', 'bottomRight', 'bottomCenter', 'bottomLeft', 'leftCenter', 'center']

	vertexIndices: number[]
	vertexNames: string[]
	closed: boolean

	constructor(parameters: { colors?: any, vertexIndices?: number[], vertexNames?: string[], closed?: boolean }) {
		super(parameters)
		this.vertexIndices = parameters.vertexIndices ? parameters.vertexIndices : [4, 6, 1]
		this.vertexNames = parameters.vertexNames
		this.closed = parameters.closed ? parameters.closed : true
	}

	createGUI(gui: dat.GUI) {
		super.createGUI(gui)
		let object = {
			indices: JSON.stringify(this.vertexIndices)
		}
		gui.add(object, 'indices').name('Vertex indices').onFinishChange( (value: string)=> {
			try {
				let newVertices = JSON.parse(value)
				if(newVertices instanceof Array) {
					let allIndices = true
					for(let i = 0 ; i < newVertices.length ; i++) {
						if(isFinite(newVertices[i]) && newVertices[i] >= 0 && newVertices[i] < 9) {
							newVertices[i] = Math.floor(newVertices[i])
						} else {
							allIndices = false
							break
						}
					}
					if(allIndices) {
						this.vertexIndices = newVertices
					}
				}
			} catch (error) {
				console.log(error)
			}
		} )
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

Symbol.addSymbol(PolygonOnBoxGenerator, 'polygon-on-box')

type ShapeProbability = {
	weight: number,
	type: string,
	parameters: any
}

export class RandomShapeGenerator extends Symbol {

	symbols: Symbol[]
	shapeProbabilities: ShapeProbability[]
	folders: dat.GUI[]
	totalWeight: number

	constructor(parameters: { colors: { type: string, parameters: any }, shapeProbabilities: ShapeProbability[] }) {
		super(parameters)

		this.symbols = []
		this.folders = []
		this.shapeProbabilities = parameters.shapeProbabilities
		
		this.totalWeight = 0
		for(let shapeProbability of parameters.shapeProbabilities) {
			this.addProbability(shapeProbability, parameters)
		}

		
	}

	addSymbol() {
		let shapeProbability: ShapeProbability = {
			weight: 1,
			type: 'rectangle',
			parameters: {}
		}

		let index = this.shapeProbabilities.length
		this.shapeProbabilities.push(shapeProbability)
		this.addProbability(shapeProbability, {})
		this.addProbabilityGUI(shapeProbability, this.gui, index)
	}

	createGUI(gui: dat.GUI) {
		super.createGUI(gui)
		gui.add(this, 'addSymbol').name('Add symbol')
		let i=0
		for(let shapeProbability of this.shapeProbabilities) {
			this.addProbabilityGUI(shapeProbability, gui, i)
			i++
		}
	}
	
	createDeleteSymbol(shapeProbability: ShapeProbability, folder: dat.GUI) {
		return ()=> {
			this.totalWeight -= shapeProbability.weight
			let index = this.shapeProbabilities.indexOf(shapeProbability)
			this.shapeProbabilities.splice(index, 1)
			let gui: any = this.gui
			gui.removeFolder(folder)
		}
	}

	computeWeight() {
		this.totalWeight = 0
		for(let shapeProbability of this.shapeProbabilities) {
			this.totalWeight += shapeProbability.weight
		}
	}

	changeChildSymbol(symbol: Symbol, type: string) {

		let index = this.symbols.indexOf(symbol)
		let shapeProbability = this.shapeProbabilities[index]

		let gui: any = this.gui
		gui.removeFolder(this.folders[index])
		this.folders[index] = this.gui.addFolder('Symbol' + index)
		let folder = this.folders[index]
		folder.add(shapeProbability, 'weight', 0, 100).step(1).name('Weight').onFinishChange( ()=> this.computeWeight() )

		folder.add({ deleteSymbol: this.createDeleteSymbol(shapeProbability, folder) }, 'deleteSymbol').name('Delete symbol')

		this.symbols[index] = Symbol.CreateSymbol(type, {}, this)
		this.symbols[index].createGUI(folder)
	}

	addProbability(shapeProbability: ShapeProbability, parameters: any) {
		let symbol = Symbol.CreateSymbol(shapeProbability.type, Symbol.passParametersColors(shapeProbability, parameters.colors), this)
		this.symbols.push(symbol)
		this.totalWeight += shapeProbability.weight
	}

	addProbabilityGUI(shapeProbability: ShapeProbability, gui: dat.GUI, i: number) {
		let folder = gui.addFolder('Symbol' + i)
		this.folders.push(folder)
		folder.add(shapeProbability, 'weight', 0, 100).step(1).name('Weight').onFinishChange( ()=> this.computeWeight() )

		this.symbols[i].createGUI(folder)
		
		folder.add({ deleteSymbol: this.createDeleteSymbol(shapeProbability, folder) }, 'deleteSymbol').name('Delete symbol')
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

Symbol.addSymbol(RandomShapeGenerator, 'random-shape')