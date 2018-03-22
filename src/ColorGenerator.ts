import * as paper from 'paper';

export interface ColorGenerator {
	setColor(positions: number[], item: paper.Path, container: paper.Path): void
}

export class ThreeStripesColor implements ColorGenerator {
	constructor() {

	}

	setColor(positions: number[], item: paper.Path, container: paper.Path): void {
		let hue = positions[0] * 255
		let saturation = 0.75 + positions[1] * 0.25
		let brightness = 0.75 + positions[2] * 0.25
		item.fillColor = new paper.Color({hue: hue, saturation: saturation, brightness: brightness})
	}
}

export class RandomColorFromPalette implements ColorGenerator {
	colors: paper.Color[]

	constructor(colors: paper.Color[]) {
		this.colors = colors
	}

	setColor(positions: number[], item: paper.Path, container: paper.Path): void {	
		item.fillColor = this.colors[Math.floor(Math.random() * this.colors.length)]
		item.fillColor.alpha = 0.5
	}
}
