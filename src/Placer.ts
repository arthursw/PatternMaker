import * as paper from 'paper';
import { sizeToPoint } from './Utils';
import { ColorGenerator, ThreeStripesColor, RandomColorFromPalette } from './ColorGenerator';
import { ShapeGenerator, RectangleGenerator, RandomShapeGenerator } from './ShapeGenerator';

export interface Symbol {
	next(item: paper.Path, container: paper.Path, positions?: number[], parameters?: any): paper.Path // generates a paper.Path
	hasFinished(): boolean
	reset(item: paper.Path): void
}


export interface PlacerInterface extends Symbol {
	symbol: Symbol

	createShape(item: paper.Path, container: paper.Path, positions?: number[]): void
	transform(): void
}

export class Placer implements PlacerInterface {

	x: number // current position
	n: number // number of shapes in a row
	currentShape: paper.Path
	symbol: Symbol
	matrix: paper.Matrix

	constructor(n: number, symbol: Symbol) {
		this.x = 0
		this.n = n
		this.symbol = symbol
		this.currentShape = null
		this.matrix = new paper.Matrix(1, 0, 0, 1, 0, 0)
	}

	createShape(item: paper.Path) {
		this.currentShape = new paper.Path.Rectangle(item.bounds)
		// this.matrix.translate(new paper.Point(0, 0))
	}

	initializePosition(item: paper.Path) {
		this.currentShape.position.x = item.bounds.left + this.currentShape.bounds.width / 2
		this.currentShape.position.y = item.bounds.top + this.currentShape.bounds.height / 2
	}

	transform() {
		this.currentShape.transform(this.matrix)
		this.x++
	}

	next(item: paper.Path, container: paper.Path, positions: number[] = [], parameters: any = null): paper.Path {
		if(this.hasFinished()) {
			return null
		}

		if(this.currentShape == null) {
			this.createShape(item)
		}

		positions.push(this.x / this.n)
		let result = this.symbol.next(this.currentShape, container, positions)

		if(this.symbol.hasFinished()) {
			this.transform()
			this.symbol.reset(this.currentShape)
		}
		
		return result
	}

	hasFinished() {
		return this.x == this.n
	}

	reset(item: paper.Path): void {
		this.x = 0
		this.initializePosition(item)
		this.symbol.reset(this.currentShape)
	}
}

export class Line extends Placer {

	constructor(n: number, symbol: Symbol) {
		super(n, symbol)
	}

	createShape(item: paper.Path) {
		let rectangle = item.bounds.clone()
		rectangle.width = rectangle.width / this.n
		this.currentShape = new paper.Path.Rectangle(rectangle)
		this.initializePosition(item)
		this.matrix.translate(new paper.Point(rectangle.width, 0))
	}

	reset(item: paper.Path) {
		this.x = 0
		this.initializePosition(item)
		this.symbol.reset(this.currentShape)
	}
}

export class GridPlacer extends Line {

	constructor(n: number, m: number, symbol: Symbol) {
		super(m, new Line(n, symbol))

	}

	createShape(item: paper.Path) {
		let rectangle = item.bounds.clone()
		rectangle.height = rectangle.height / this.n
		this.currentShape = new paper.Path.Rectangle(rectangle)
		this.initializePosition(item)
		this.matrix.translate(new paper.Point(0, rectangle.height))
	}
}

export class ThreeStripesGrid extends GridPlacer {

	constructor(n: number, m: number) {
		let colorGenerator = new ThreeStripesColor()
		let threeStripes = new Line(3, new RectangleGenerator(colorGenerator))
		super(n, m, threeStripes)
	}
}

export class SymbolsGrid extends GridPlacer {

	constructor(n: number, m: number, o: number, colors: paper.Color[]) {
		let colorGenerator = new RandomColorFromPalette(colors)
		let symbolPlacer = new Placer(o, new RandomShapeGenerator(colorGenerator))
		super(n, m, symbolPlacer)
	}
}
