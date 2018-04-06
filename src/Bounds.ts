import * as paper from 'paper';

export class Bounds {
	
	path: paper.Path
	rectangle: paper.Rectangle
	rotation: number

	constructor(bounds: paper.Path | paper.Rectangle, rotation: number = 0) {
		this.set(bounds, rotation)
	}

	set(bounds: paper.Path | paper.Rectangle, rotation: number = 0) {
		this.rectangle = bounds instanceof paper.Path ? bounds.bounds.clone() : bounds.clone()
		this.path = bounds instanceof paper.Path ? bounds : null
		this.rotation = rotation
	}

	setPosition(position: paper.Point) {
		if(this.path != null) {
			let delta = this.rectangle.point.subtract(this.path.position)
			this.path.position = position.clone()
			this.rectangle.point = position.add(delta)
		} else {
			this.rectangle.point = position.clone()
		}
	}
	
	setX(x: number) {
		this.setXY(x, this.rectangle.y)
	}
	
	setY(y: number) {
		this.setXY(this.rectangle.x, y)
	}

	setXY(x: number, y: number) {
		this.setPosition(new paper.Point(x, y))
	}

	setCenter(position: paper.Point) {
		let delta = this.rectangle.topLeft.subtract(this.rectangle.center)
		this.setPosition(position.add(delta))
	}

	setSize(size: paper.Size) {
		if(this.path != null) {
			this.path.bounds.size = size
		}
		this.rectangle.size = size
	}
	
	setWidth(width: number) {
		this.setWH(width, this.rectangle.height)
	}
	
	setHeight(height: number) {
		this.setWH(this.rectangle.width, height)
	}

	setWH(width: number, height: number) {
		this.setSize(new paper.Size(width, height))
	}

	getRectangle() {
		return this.rectangle.clone()
	}

	getPath() {
		if(this.path == null) {
			this.path = new paper.Path.Rectangle(this.rectangle)
		}
		return this.path
	}

	clone() {
		return this.path == null ? new Bounds(this.rectangle, this.rotation) : new Bounds(this.path, this.rotation)
	}

	getRectangleString() {
		return this.rectangle.toString()
	}
}