import * as paper from 'paper';

interface ColorGeneratorConstructor {
	new (...args: any[]): ColorGenerator;
}

export interface ColorGenerator {
	setColor(positions: number[], item: paper.Path, container: paper.Path): void
}

export let colorGenerators = new Map<string, ColorGeneratorConstructor>()

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

colorGenerators.set('three-stripes', ThreeStripesColor)

export class RandomColorFromPalette implements ColorGenerator {
	colors: string[]

	constructor(parameters: { palette: string[] }) {
		this.colors = parameters.palette
	}

	setColor(positions: number[], item: paper.Path, container: paper.Path): void {	
		item.fillColor = new paper.Color(this.colors[Math.floor(Math.random() * this.colors.length)])
	}
}

colorGenerators.set('random-palette', RandomColorFromPalette)