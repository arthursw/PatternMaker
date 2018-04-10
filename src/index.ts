import * as paper from 'paper'

import { initializeEditor, editor } from './Tools'
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import './Placer';
import './Shape';
import './Raster';
import { createGUI } from './GUI';

let w:any = <any>window;
(<any>window).w = w;

let parametersOld = {
	generation: 'animation',
	speed: 500,
	nSymbolsPerFrame: 100,
	size: {
		width: 1000,
		height: 1000
	},
	optimizeWithRaster: false,
	symbol: {
		type: 'grid',
		parameters: {
			width: 10,
			height: 10,
			count: 1,
			scale: 0.2,
			margin: true,
			symbol: {
				type: 'random-symbol',
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
					effects:[ {
						type: 'random-palette',
						parameters: {
							palette: [
							'red',
							'blue',
							'green',
							'black'
							]
						}
					} ]
				}
			}
		}
	}
}

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
    type: 'grid',
    parameters: {
      height: 50,
      width: 50,
      nSymbolsToCreate: 1,
      margin: true,
      scale: 0.13,
      symbol: {
        type: 'random-symbol',
        parameters: {
          shapeProbabilities: [
            {
              type: 'circle',
              parameters: {
                radius: 0.75
              },
              weight: 1
            },
            {
              type: 'rectangle',
              parameters: {
                width: 1,
                height: 1
              },
              weight: 1
            }
          ],
          effects: [{
            type: 'random-palette',
            parameters: {
              palette: [
                'rgb(107,30,20)',
                'rgb(178,59,23)'
              ]
            }
          }]
        }
      }
    }
  }
}

let raster: paper.Raster = null
let timeoutID: number = null
let gui: dat.GUI = null
let symbol: Symbol = null
let container: Bounds = null

let createRootSymbol = (type: string = null, symbolParameters: any = null)=> {
	let rootGUI: any = gui
	if(rootGUI.__folders['Symbol']) {
		rootGUI.removeFolder(rootGUI.__folders['Symbol'])
	}

	let folder = gui.addFolder('Symbol')
	folder.open()
	symbol = Symbol.createSymbol(type != null ? type : parameters.symbol.type, symbolParameters != null ? symbolParameters : parameters.symbol.parameters, null)
	symbol.createGUI(folder)

	w.symbol = symbol

	reset()
	return container
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

	if(raster != null) {
		raster = paper.project.activeLayer.rasterize()
	}
}

let onFrame = ()=> {

	if(parameters.optimizeWithRaster && raster != null) {
		paper.project.clear()
		paper.project.activeLayer.addChild(raster)
	}

	if(timeoutID == null) {
		for(let i = 0 ; i < parameters.nSymbolsPerFrame ; i++) {
			symbol.next(container, container)
			if(symbol.hasFinished() && parameters.generation == 'animation') {
				timeoutID = setTimeout(()=> {
					reset()
					timeoutID = null
				}, parameters.speed)
				break
			}
		}
	}

	if(parameters.optimizeWithRaster) {
		raster = paper.project.activeLayer.rasterize()
	}
}

document.addEventListener('changeParameters', (event: any) => {
	if(event.detail != null && event.detail.parameters != null) {
		for(let name in event.detail.parameters) {
			(<any>parameters)[name] = event.detail.parameters[name]
		}
	}
	clearTimeout(timeoutID)
	timeoutID = null
	createRootSymbol(parameters.symbol.type, parameters.symbol.parameters)
})

document.addEventListener('jsonClicked', (event: any) => {
	parameters.symbol = symbol.getJSON()
	editor.ignoreChange = true
	editor.setValue(JSON.stringify(parameters, null, 2));
	editor.clearSelection()
})

document.addEventListener("DOMContentLoaded", function(event) { 
	
	let canvas = document.getElementById('canvas');
	paper.setup(<HTMLCanvasElement>canvas);
	paper.view.viewSize.height = window.innerHeight

	w.paper = paper

	initializeEditor(parameters)

	gui = createGUI(parameters)
	createRootSymbol()

	paper.view.onFrame = onFrame
	paper.view.onClick = reset
	paper.view.onResize = reset
});
