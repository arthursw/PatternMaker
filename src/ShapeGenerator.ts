import * as paper from 'paper';
import { emptyFolder } from './GUI';
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import { ColorGenerator } from './ColorGenerator';

export class ShapeGenerator extends Symbol {
	
	constructor(parameters: { colors?: any }, parent?: Symbol) {
		super(parameters, parent)
	}
}

export class RectangleGenerator extends ShapeGenerator {

	static defaultParameters = { width: 1, height: 1 }

	parameters: {
		width: number,
		height: number
	}

	constructor(parameters: { colors?: any, width?: number, height?: number }, parent?: Symbol) {
		super(parameters, parent)
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'width', 0, 1).step(0.01).name('Width')
		gui.add(this.parameters, 'height', 0, 1).step(0.01).name('Height')
	}

	intializeSize(rectangle: paper.Rectangle) {
		rectangle.width = this.parameters.width * rectangle.width
		rectangle.height = this.parameters.height * rectangle.height
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let rectangle = bounds.rectangle.clone()

		let center = rectangle.center.clone()
		this.intializeSize(rectangle)
		rectangle.x = center.x - rectangle.width / 2
		rectangle.y = center.y - rectangle.height / 2

		let shape = new paper.Path.Rectangle(rectangle)
		this.getColorGenerator().setColor(positions, shape, container)
		return shape
	}

}

Symbol.addSymbol(RectangleGenerator, 'rectangle')

export class RectangleAbsoluteGenerator extends RectangleGenerator {

	static defaultParameters = { width: 100, height: 100 }

	intializeSize(bounds: paper.Rectangle) {
		bounds.width = this.parameters.width
		bounds.height = this.parameters.height
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'width').name('Width')
		gui.add(this.parameters, 'height').name('Height')
	}
}

Symbol.addSymbol(RectangleAbsoluteGenerator, 'rectangle-absolute')

export class CircleGenerator extends ShapeGenerator {

	static defaultParameters = { radius: 1 }

	parameters: {
		radius: number
	}

	constructor(parameters: { colors?: any, radius?: number }, parent?: Symbol) {
		super(parameters, parent)
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'radius', 0, 1).step(0.01).name('Radius')
	}

	getRadius(bounds: Bounds) {
		let defaultRadius = Math.min(bounds.rectangle.width, bounds.rectangle.height) / 2
		return this.parameters.radius * defaultRadius
	}

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let circle = new paper.Path.Circle(bounds.rectangle.center, this.getRadius(bounds))
		this.getColorGenerator().setColor(positions, circle, container)
		return circle
	}

}

Symbol.addSymbol(CircleGenerator, 'circle')

export class CircleAbsoluteGenerator extends CircleGenerator {

	static defaultParameters = { radius: 100 }

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'radius').name('Radius')
	}

	getRadius(bounds: Bounds) {
		return this.parameters.radius
	}
}

Symbol.addSymbol(CircleAbsoluteGenerator, 'circle-absolute')

export class PolygonOnBoxGenerator extends ShapeGenerator {
	
	static indexToName = ['topLeft', 'topCenter', 'topRight', 'rightCenter', 'bottomRight', 'bottomCenter', 'bottomLeft', 'leftCenter', 'center']

	static defaultParameters = { 
		vertexIndices: [4, 6, 8],
		closed: true
	}

	parameters: {
		vertexIndices: number[]
		vertexNames: string[]
		closed: boolean
	}

	constructor(parameters: { colors?: any, vertexIndices?: number[], vertexNames?: string[], closed?: boolean }, parent?: Symbol) {
		super(parameters, parent)
	}

	addGUIParameters(gui: dat.GUI) {
		let object = {
			indices: JSON.stringify(this.parameters.vertexIndices)
		}
		gui.add(object, 'indices').name('Vertex indices').onFinishChange( (value: string)=> {
			try {
				let newVertices = JSON.parse(value)
				if(Array.isArray(newVertices)) {
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
						this.parameters.vertexIndices = newVertices
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
		if(this.parameters.vertexNames == null && this.parameters.vertexIndices == null){
			polygon.add(rectangle.topCenter)
			polygon.add(rectangle.bottomLeft)
			polygon.add(rectangle.bottomRight)
		}
		else if(this.parameters.vertexIndices != null) {
			for(let i of this.parameters.vertexIndices) {
				polygon.add(rectangle[PolygonOnBoxGenerator.indexToName[i]])
			}
		}
		else if(this.parameters.vertexNames != null) {
			for(let name of this.parameters.vertexNames) {
				polygon.add(rectangle[name])
			}
		}

		polygon.closed = this.parameters.closed

		this.getColorGenerator().setColor(positions, polygon, container)
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

	constructor(parameters: { colors: { type: string, parameters: any }, shapeProbabilities: ShapeProbability[] }, parent?: Symbol) {
		super(parameters, parent)

		this.symbols = []
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
		let i=0
		for(let shapeProbability of this.parameters.shapeProbabilities) {
			this.addProbabilityGUI(shapeProbability, gui, i)
			i++
		}
	}
	
	createDeleteSymbol(shapeProbability: ShapeProbability, folder: dat.GUI) {
		return ()=> {
			this.totalWeight -= shapeProbability.weight
			let index = this.parameters.shapeProbabilities.indexOf(shapeProbability)
			this.parameters.shapeProbabilities.splice(index, 1)
			let gui: any = this.gui
			gui.removeFolder(folder)
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

		let folder = this.folders[index]

		emptyFolder(folder)

		shapeProbability.parameters  = {}
		this.symbols[index] = Symbol.createSymbol(type, {}, this)
		
		this.addProbabilityGUI(shapeProbability, this.gui, index, folder)
	}

	addProbability(shapeProbability: ShapeProbability) {
		let symbol = Symbol.createSymbol(shapeProbability.type, shapeProbability.parameters, this)
		this.symbols.push(symbol)
		this.totalWeight += shapeProbability.weight
	}

	addProbabilityGUI(shapeProbability: ShapeProbability, gui: dat.GUI, i: number, folder: dat.GUI = null) {
		
		if(folder == null) {
			folder = gui.addFolder('Symbol' + i)
			folder.open()
			this.folders.push(folder)
		}

		folder.add(shapeProbability, 'weight', 0, 100).step(1).name('Weight').onFinishChange( ()=> this.computeWeight() )

		this.symbols[i].createGUI(folder)
		
		folder.add({ deleteSymbol: this.createDeleteSymbol(shapeProbability, folder) }, 'deleteSymbol').name('Delete symbol')
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

Symbol.addSymbol(RandomShapeGenerator, 'random-shape')