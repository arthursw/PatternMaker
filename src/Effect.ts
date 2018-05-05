import * as paper from 'paper';
import { Bounds } from './Bounds';
import { Symbol } from './Symbol';
import { raster } from './Raster';

interface EffectConstructor {
	type: string
	new (...args: any[]): Effect;
}

export class Effect {
	
	static type: string
	static effects = new Map<string, EffectConstructor>()
	static effectNames: string[] = []

	effectsFolder: dat.GUI
	folder: dat.GUI
	gui: dat.GUI
	symbol: Symbol

	static defaultParameters = {}

	parameters: any

	static addEffect(effect: EffectConstructor, name: string) {
		Effect.effects.set(name, effect)
		Effect.effectNames.push(name)
		effect.type = name
	}

	static createEffect(type: string, parameters: any, symbol: Symbol, effectIndex: number = null) {
		let EffectGenerator = Effect.effects.get(type)
		return new EffectGenerator(parameters, symbol, effectIndex)
	}

	static createDefaultEffect(symbol: Symbol) {
		let EffectGenerator = Effect.effects.get('random-hue')
		let effect = new EffectGenerator({}, symbol)
		symbol.recreateEffectGUI()
		return effect
	}

	constructor(parameters: any = {}, symbol: Symbol, effectIndex: number = null) {
		this.symbol = symbol
		this.symbol.effects.splice(effectIndex != null ? effectIndex : this.symbol.effects.length, 0, this)

		let defaultParameters = (<typeof Effect>this.constructor).defaultParameters
		
		this.initializeParameters(parameters)
	}

	initializeParameters(parameters: any) {
		this.parameters = parameters
		let defaultParameters: any = (<typeof Symbol>this.constructor).defaultParameters
		this.copyDefaultParameters(defaultParameters, this.parameters)
	}

	copyDefaultParameters(defaultParameters: any, parameters: any) {
		if(defaultParameters == null || typeof defaultParameters != 'object' || Array.isArray(defaultParameters)) {
			return
		}
		for(let name in defaultParameters) {
			let defaultValue = defaultParameters[name]
			if(parameters[name] == null) {
				if(typeof defaultValue === 'object') {
					parameters[name] = Array.isArray(defaultValue) ? [... defaultValue] : {... defaultValue }
				} else if(typeof defaultValue === 'function'){
					parameters[name] = defaultValue()
				} else {
					parameters[name] = defaultValue
				}
			} else {
				this.copyDefaultParameters(defaultValue, parameters[name])
			}
		}
	}


	getJSON() {
		return { 
			type: (<typeof Symbol>this.constructor).type,
			parameters: {... this.parameters},
		}
	}

	applyEffect(positions: number[], item: paper.Path, container: Bounds): void {
		this.setColor(positions, item, container)
	}

	setColor(positions: number[], item: paper.Path, container: Bounds): void {
	}

	createGUI(effectsFolder: dat.GUI, n: number) {
		this.effectsFolder = effectsFolder

		this.gui = effectsFolder.addFolder('Effect ' + n)
		this.gui.open()

		this.addTypeOnGUI(this.gui, (<typeof Effect>this.constructor).type)

		this.addGUIParameters(this.gui)

		this.addRemoveEffectButton(this.gui)

		this.effectsFolder.open()
	}

	addRemoveEffectButton(gui: dat.GUI) {
		gui.add(this, 'removeEffect').name('Remove effect')
	}

	removeEffect() {
		this.symbol.removeEffect(this)
	}

	addTypeOnGUI(gui: dat.GUI, type: string) {
		gui.add( { type: type }, 'type').options(Effect.effectNames).name('Type').onChange( (value: string)=> {
			this.changeEffect(value)
		} )
	}

	removeGUI() {
		let gui: any = this.effectsFolder
		gui.removeFolder(this.gui)
	}

	changeEffect(type: string) {	
		this.symbol.changeEffect(this, type)
	}
	
	addGUIParameters(gui: dat.GUI) {
	}
}

export class RandomHue extends Effect {

	static defaultParameters = {
		target: 'fill',
		strokeWidth: 1,
		hue: ()=> 360 * Math.random(),
		hueRange: ()=> 100 * Math.random(),
		saturation: ()=> 0.3 + 0.4 * Math.random(),
		brightness: 1,
		alpha: 1
	}

	parameters: {
		target: string,
		strokeWidth: number,
		hue: number
		hueRange: number
		saturation: number
		brightness: number
		alpha: number
	}

	setColor(positions: number[], item: paper.Path, container: Bounds): void {
		let color = new paper.Color({
			hue: this.parameters.hue + ( Math.random() - 0.5 ) * this.parameters.hueRange,
			saturation: this.parameters.saturation,
			brightness: this.parameters.brightness
		})
		if(this.parameters.target == 'fill' || this.parameters.target == 'fillStroke') {
			item.fillColor = color
			item.fillColor.alpha = this.parameters.alpha
		}
		if(this.parameters.target == 'stroke' || this.parameters.target == 'fillStroke') {
			item.strokeColor = color
			item.strokeColor.alpha = this.parameters.alpha
			item.strokeWidth = this.parameters.strokeWidth
		}
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'target').options(['fill', 'stroke', 'fillStroke']).name('Target')
		gui.add(this.parameters, 'strokeWidth', 0, 10).step(0.1).name('Stroke width')
		gui.add(this.parameters, 'hue', 0, 360).step(1).name('Hue')
		gui.add(this.parameters, 'hueRange', 0, 360).step(1).name('Hue range')
		gui.add(this.parameters, 'saturation', 0, 1).step(0.01).name('Saturation')
		gui.add(this.parameters, 'brightness', 0, 1).step(0.01).name('Brightness')
		gui.add(this.parameters, 'alpha', 0, 1).step(0.01).name('Alpha')
	}
}

Effect.addEffect(RandomHue, 'random-hue')

export class Noise extends Effect {

	static defaultParameters = {
		amount: 10
	}

	parameters: {
		amount: number
	}

	applyEffect(positions: number[], item: paper.Path, container: Bounds): void {
		let i = 0
		for(let segment of item.segments) {
			let x = Math.floor(1000 * ( segment.point.x - container.rectangle.x ) / container.rectangle.width)
			let y = Math.floor(1000 * ( segment.point.y - container.rectangle.y ) / container.rectangle.height)

			let direction = (x * 73856093 ^ y * 19349663) % 10000
			let vector = new paper.Point(this.parameters.amount, 0)
			vector.angle = direction

			segment.point = segment.point.add(vector)
			i++
		}
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'amount').name('Amount')
	}
}

Effect.addEffect(Noise, 'noise')

export class Transform extends Effect {

	static defaultParameters = {
		translationX: 0,
		translationY: 0,
		scaleX: 1,
		scaleY: 1,
		rotation: 0
	}

	parameters: {
		translationX: number,
		translationY: number,
		scaleX: number,
		scaleY: number,
		rotation: number
	}

	applyEffect(positions: number[], item: paper.Path, container: Bounds): void {
		item.position.x += this.parameters.translationX
		item.position.x += this.parameters.translationY
		item.scaling.x = this.parameters.scaleX
		item.scaling.y = this.parameters.scaleY
		item.rotation = this.parameters.rotation
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'translationX').name('Transaltion X')
		gui.add(this.parameters, 'translationY').name('Transaltion Y')
		gui.add(this.parameters, 'scaleX').name('Scale X')
		gui.add(this.parameters, 'scaleY').name('Scale Y')
		gui.add(this.parameters, 'rotation', 0, 360).name('Rotation')
	}
}

Effect.addEffect(Transform, 'transform')

export class Smooth extends Effect {

	applyEffect(positions: number[], item: paper.Path, container: Bounds): void {
		item.smooth()
	}
}

Effect.addEffect(Smooth, 'smooth')

export class RasterScale extends Effect {

	static defaultParameters = {
		invert: true,
		amount: 1
	}

	parameters: {
		invert: boolean,
		amount: number
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'invert').name('Invert')
		gui.add(this.parameters, 'amount', 0, 10).step(0.1).name('Amount')
	}

	applyEffect(positions: number[], item: paper.Path, container: Bounds): void {
		if(raster != null && (<any>raster).loaded) {
			let color = raster.getAverageColor(item.bounds.center)
			let brightness = color != null ? color.brightness : 1
			brightness = this.parameters.invert ? 1 - brightness : brightness
			brightness *= this.parameters.amount
			item.scale(brightness)
		}
	}
}

Effect.addEffect(RasterScale, 'raster-scale')

export class ThreeStripesColor extends Effect {

	setColor(positions: number[], item: paper.Path, container: Bounds): void {
		let hue = positions.length > 0 ? positions[0] * 255 : 0
		let saturation = positions.length > 1 ? 0.75 + positions[1] * 0.25 : 0
		let brightness = positions.length > 2 ? 0.75 + positions[2] * 0.25 : 0
		item.fillColor = new paper.Color({hue: hue, saturation: saturation, brightness: brightness})
	}

	addGUIParameters(gui: dat.GUI) {
	}
}

Effect.addEffect(ThreeStripesColor, 'three-stripes')

export class RandomColorFromPalette extends Effect {
	
	folder: dat.GUI

	static defaultParameters = {
		alpha: 1,
		palette: ['black']
	}

	parameters: {
		alpha: number
		palette: string[]
	}

	setColor(positions: number[], item: paper.Path, container: Bounds): void {	
		item.fillColor = new paper.Color(this.parameters.palette.length == 0 ? 'black' : this.parameters.palette[Math.floor(Math.random() * this.parameters.palette.length)])
		item.fillColor.alpha = this.parameters.alpha
	}

	addGUIParameters(gui: dat.GUI) {
		gui.add(this.parameters, 'alpha', 0, 1).step(0.01).name('Alpha')
		this.folder = gui.addFolder('Palette')
		this.folder.open()
		this.folder.add(this, 'addColor').name('Add color')
		this.folder.add(this, 'removeLastColor').name('Remove last color')
		for(let color in this.parameters.palette) {
			this.parameters.palette[color] = new paper.Color(this.parameters.palette[color]).toCSS(false)
			this.folder.addColor(this.parameters.palette, color)
		}
	}

	addColor() {
		let color = new paper.Color({
			hue: Math.random()  * 360,
			saturation: 1,
			brightness: 1
		})
		this.parameters.palette.push(color.toCSS(false))
		this.folder.addColor(this.parameters.palette, ''+(this.parameters.palette.length-1))
	}

	removeLastColor() {
		if(this.parameters.palette.length > 0) {
			this.parameters.palette.pop()
			this.folder.remove(this.folder.__controllers[this.folder.__controllers.length-1])
		}
	}
}

Effect.addEffect(RandomColorFromPalette, 'random-palette')