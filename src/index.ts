import * as paper from 'paper'

import { initializeEditor } from './Tools'
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import './Placer';
import './ShapeGenerator';
import { createGUI } from './GUI';

let w:any = <any>window;
(<any>window).w = w;

let parameters = {
	generation: 'animation',
	speed: 500,
	nSymbolsPerFrame: 100,
	size: {
		width: 1000,
		height: 1000
	},
	optimizeWithRaster: false,
	symbol: {
		type: 'placer-xyz',
		parameters: {
			width: 10,
			height: 10,
			count: 1,
			scale: 0.2,
			margin: true,
			symbol: {
				type: 'random-shape',
				parameters: {		
					shapeProbabilities: [{
						weight: 1,
						type: 'circle',
						parameters: {
							radius: 1
						}
					}, {
						weight: 1,
						type: 'rectangle',
						parameters: {
							width: 1,
							height: 1
						}
					}],
					colors: {
						type: 'random-palette',
						parameters: {
							palette: [
							'red',
							'blue',
							'green',
							'black'
							]
						}
					}
				}
			}
		}
	}
}

let symbol: Symbol = null
let container: Bounds = null
let raster: paper.Raster = null
let timeoutID: number = null
let gui: dat.GUI = null

let createSymbol = (doCreateGUI = true)=> {
	symbol = Symbol.CreateSymbol(parameters.symbol.type, parameters.symbol.parameters, null)
	symbol.createGUI(gui)

	reset()
}

let reset = ()=> {

	paper.project.clear()

	let rectangle = new paper.Rectangle(0, 0, parameters.size.width, parameters.size.height)
	container = new Bounds(rectangle)

	paper.view.zoom = 1

	let viewRatio = paper.view.viewSize.width / paper.view.viewSize.height
	let rectangleRatio = rectangle.width / rectangle.height

	if(viewRatio > rectangleRatio) {
		paper.view.zoom = paper.view.bounds.height / rectangle.height
	} else {
		paper.view.zoom = paper.view.bounds.width / rectangle.width
	}

	paper.view.center = rectangle.center

	symbol.reset(container)
}

let onFrame = ()=> {

	if(parameters.optimizeWithRaster && raster != null) {
		paper.project.clear()
		paper.project.activeLayer.addChild(raster)
	}

	for(let i = 0 ; i < parameters.nSymbolsPerFrame ; i++) {
		symbol.next(container, container)
		if(symbol.hasFinished() && parameters.generation == 'animation') {
			if(timeoutID == null) {
				timeoutID = setTimeout(()=> {
					reset()
					timeoutID = null
				}, parameters.speed)
			}
			break
		}
	}

	if(parameters.optimizeWithRaster) {
		raster = paper.project.activeLayer.rasterize()
	}
}

document.addEventListener('changeParameters', (event: any) => {
	if(event.detail != null && event.detail.parameters != null) {
		parameters = event.detail.parameters
	}
	let doCreateGUI = event.detail != null && event.detail.createGUI != null ? event.detail.createGUI : null
	clearTimeout(timeoutID)
	timeoutID = null
	createSymbol(doCreateGUI)
})

document.addEventListener("DOMContentLoaded", function(event) { 
	
	let canvas = document.getElementById('canvas');
	paper.setup(<HTMLCanvasElement>canvas);
	paper.view.viewSize.height = window.innerHeight

	w.paper = paper

	initializeEditor(parameters)

	gui = createGUI(parameters)

	createSymbol()
	paper.view.onFrame = onFrame
	paper.view.onClick = reset
	paper.view.onResize = reset
});
