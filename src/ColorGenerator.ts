import * as paper from 'paper';
import { Bounds } from './Bounds';

interface ColorGeneratorConstructor {
	new (...args: any[]): ColorGenerator;
}

export class ColorGenerator {
	constructor() {

	}
	
	setColor(positions: number[], item: paper.Path, container: Bounds): void {
		item.fillColor = new paper.Color({
			hue: Math.random() * 360,
			saturation: 1,
			brightness: 1
		})
	}
}

export let colorGenerators = new Map<string, ColorGeneratorConstructor>()

export class ThreeStripesColor extends ColorGenerator {

	constructor() {
		super()
	}

	setColor(positions: number[], item: paper.Path, container: Bounds): void {
		let hue = positions[0] * 255
		let saturation = 0.75 + positions[1] * 0.25
		let brightness = 0.75 + positions[2] * 0.25
		item.fillColor = new paper.Color({hue: hue, saturation: saturation, brightness: brightness})
	}
}

colorGenerators.set('three-stripes', ThreeStripesColor)

export class RandomColorFromPalette extends ColorGenerator {
	colors: string[]

	constructor(parameters: { palette: string[] }) {
		super()
		this.colors = parameters.palette
	}

	setColor(positions: number[], item: paper.Path, container: Bounds): void {	
		item.fillColor = new paper.Color(this.colors[Math.floor(Math.random() * this.colors.length)])
	}
}

colorGenerators.set('random-palette', RandomColorFromPalette)