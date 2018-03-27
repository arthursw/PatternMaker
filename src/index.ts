import * as paper from 'paper'

import { initializeEditor } from './Tools'
import { Placer, Symbol } from './Placer'
import { createGUI } from './GUI'

let w:any = <any>window;
(<any>window).w = w;

// 0 1 2
// 7 8 3
// 6 5 4

let parameters = {
	generation: 'animation',
	speed: 500,
	numberOfSymbolPerFrame: 100,
	size: {
		width: 1000,
		height: 1000
	},
	optimizeWithRaster: false,
	symbol: {
		type: 'placer',
		parameters: {
			type: 'y',
			count: 10,
			symbol: {
				type: 'placer',
				parameters: {
					type: 'x',
					count: 10,
					symbol: {
						type: 'placer',
						parameters: {
							type: 'static',
							count: 2,
							symbol: {
								type: 'random-shape',
								parameters: {		
									shapeProbabilities: [{ 
										weight: 1,
										type: 'polygon-on-box',
										parameters: {
											vertexIndices: [0, 2, 8]
										}
									}, {
										weight: 1,
										type: 'polygon-on-box',
										parameters: {
											vertexIndices: [2, 4, 8]
										}
									}, {
										weight: 1,
										type: 'polygon-on-box',
										parameters: {
											vertexIndices: [6, 4, 8]
										}
									}, {
										weight: 1,
										type: 'polygon-on-box',
										parameters: {
											vertexIndices: [0, 6, 8]
										}
									}, {
										weight: 1,
										type: 'circle',
										parameters: {
											radiusRatio: 0.5
										}
									}, {
										weight: 1,
										type: 'rectangle',
										parameters: {
											width: 0.5,
											height: 0.5
										}
									}],
									colors: {
										type: 'random-palette',
										parameters: {
											palette: [
												'#df768e',
												'#b48fc0',
												'#86a4d3',
												'#71bfbe',
												'#9bce6d',
												'#e5de45',
												'#fdc13d',
												'#f2825b'
											]
										}
									}
								}
							}
						}
					}
				}
			}	
		}
	}
}


let symbol2Parameters = {
	type: 'grid-n',
	parameters: {
		countX: 10,
		countY: 10,
		countN: 3,
		symbol: {
			type: 'random-shape',
			parameters: {
				shapes: [{
					type: 'polygon',
					parameters: [ { vertices: [1, 0, 3] }, { vertices: [2, 1, 4] }, { vertices: [1, 4, 3] }],
					probability: 0.5
				}, {
					type: 'circle',
					parameters: {
						radiusRatio: 0.5
					},
					probability: 0.2
				}, {
					type: 'square',
					parameters: {
						sizeRatio: 0.5
					},
					probability: 0.2
				}]	
			}
		}
	}
}

let symbol3Parameters = {
	type: 'lines',
	parameters: {
		countX: 10,
		countY: 10,
		symbol: {
			type: 'random-line-shape',
			parameters: {
				shapes: [{
					type: 'polygon',
					parameters: [ { vertices: [1, 0, 3] }, { vertices: [2, 1, 4] }, { vertices: [1, 4, 3] }],
				}]
			}
		}
	}
}

let symbol: Symbol = null
let container: paper.Path = null
let raster: paper.Raster = null
let timeoutID: number = null

let createSymbol = (doCreateGUI = true)=> {
	symbol = Placer.createFromJSON(parameters.symbol)
	
	if(doCreateGUI) {
		createGUI(parameters)
	}

	reset()
}

let reset = ()=> {

	paper.project.clear()

	let rectangle = new paper.Rectangle(0, 0, parameters.size.width, parameters.size.height)
	container = new paper.Path.Rectangle(rectangle)

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

	for(let i = 0 ; i < parameters.numberOfSymbolPerFrame ; i++) {
		let finished = symbol.next(<any>container.clone(), <any>container.clone())
		if(finished == null) {
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
	createSymbol(doCreateGUI)
})

document.addEventListener("DOMContentLoaded", function(event) { 
	
	let canvas = document.getElementById('canvas');
	paper.setup(<HTMLCanvasElement>canvas);
	paper.view.viewSize.height = window.innerHeight

	w.paper = paper

	initializeEditor(parameters)

	createSymbol()
	paper.view.onFrame = onFrame
	paper.view.onClick = reset
	paper.view.onResize = reset
});
