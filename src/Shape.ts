import * as paper from 'paper';
import { emptyFolder } from './GUI';
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import { Effect } from './Effect';

export class Shape extends Symbol {
	
	constructor(parameters: { effects?: any }, parent?: Symbol) {
		super(parameters, parent)
	}
}

export class BoundsShape extends Shape {

	static defaultParameters = { }

	next(bounds: Bounds, container: Bounds, positions: number[] = []): paper.Path {
		let path = bounds.getPath()
		this.applyEffects(positions, path, container)
		return path
	}

}

Symbol.addSymbol(BoundsShape, 'bounds')

export class Rectangle extends Shape {

	static defaultParameters = { width: 1, height: 1 }

	parameters: {
		width: number,
		height: number
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

		this.applyEffects(positions, shape, container)
		return shape
	}

}

Symbol.addSymbol(Rectangle, 'rectangle')

export class RectangleAbsolute extends Rectangle {

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

Symbol.addSymbol(RectangleAbsolute, 'rectangle-absolute')

export class Circle extends Shape {

	static defaultParameters = { radius: 1 }

	parameters: {
		radius: number
	}

	constructor(parameters: { effects?: any, radius?: number }, parent?: Symbol) {
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
		
		this.applyEffects(positions, circle, container)
		return circle
	}

}

Symbol.addSymbol(Circle, 'circle')

export class CircleAbsolute extends Circle {

	static defaultParameters = { radius: 100 }

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'radius').name('Radius')
	}

	getRadius(bounds: Bounds) {
		return this.parameters.radius
	}
}

Symbol.addSymbol(CircleAbsolute, 'circle-absolute')

export class PolygonOnBox extends Shape {
	
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

	constructor(parameters: { effects?: any, vertexIndices?: number[], vertexNames?: string[], closed?: boolean }, parent?: Symbol) {
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
				polygon.add(rectangle[PolygonOnBox.indexToName[i]])
			}
		}
		else if(this.parameters.vertexNames != null) {
			for(let name of this.parameters.vertexNames) {
				polygon.add(rectangle[name])
			}
		}

		polygon.closed = this.parameters.closed

		this.applyEffects(positions, polygon, container)
		return polygon
	}

}

Symbol.addSymbol(PolygonOnBox, 'polygon-on-box')
