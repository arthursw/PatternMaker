import * as paper from 'paper'

import { initializeEditor, editor, setFileInEditor } from './Tools'
import { Bounds } from './Bounds';
import { Symbol, SymbolConstructor } from './Symbol';
import './Placer';
import './Shape';
import './Raster';
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
    type: 'rectangle',
    parameters: {
      width: 1,
      height: 1,
      effects: [
        {
          type: 'random-hue',
          parameters: {
            target: 'fill',
            strokeWidth: 1,
            hue: 180,
            hueRange: 360,
            saturation: 1,
            brightness: 0,
            alpha: 1
          }
        }
      ]
    }
  }
}

let raster: paper.Raster = null
let timeoutID: number = null
let gui: dat.GUI = null
let symbolFolder: dat.GUI = null
let symbol: Symbol = null
let container: Bounds = null
let ignoreHashChange = false

let createRootSymbol = (type: string = null, symbolParameters: any = null)=> {
	// if(symbolFolder != null) {
	// 	rootGUI.removeFolder(symbolFolder)
	// 	symbolFolder = null
	// }
	
	let rootGUI: any = gui
	if(rootGUI.__folders['Symbol']) {
		rootGUI.removeFolder(rootGUI.__folders['Symbol'])
	}

	symbolFolder = gui.addFolder('Symbol')
	symbolFolder.open()
	symbol = Symbol.createSymbol(type != null ? type : parameters.symbol.type, symbolParameters != null ? symbolParameters : parameters.symbol.parameters, null)
	symbol.createGUI(symbolFolder)

	w.symbol = symbol

	reset()
	return container
}

let symbolToHash = (symbol: Symbol)=> {
	let json = symbol.getJSON()
	let symbolString = JSON.stringify(json)
	let symbolData = btoa(symbolString)
	return symbolData
}

let checkUpdateHash = ()=> {
	let newHash = symbolToHash(symbol)
	if(newHash != location.hash.substr(1)) {
		ignoreHashChange = true
		location.hash = newHash
	}
}

setInterval(checkUpdateHash, 1000)

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

	if(location.hash.length <= 1) {
		document.addEventListener('defaultFilesLoaded', (event: any) => {
			setFileInEditor('jogl.json')
		})
	}

	initializeEditor(parameters)

	gui = createGUI(parameters)

	readHash()
	createRootSymbol()

	paper.view.onFrame = onFrame
	paper.view.onClick = reset
	paper.view.onResize = reset
});

let readHash = ()=> {
	try {
		let hash = location.hash.substr(1)
		if(hash.length == 0) {
			return false
		}
		let json = atob(hash)
		parameters.symbol = JSON.parse(json)
		editor.ignoreChange = true
		editor.setValue(JSON.stringify(parameters, null, 2));
		editor.clearSelection()
		let event = new CustomEvent('changeParameters', { detail: { parameters: parameters } })
		document.dispatchEvent(event)
	} catch (error) {
		console.log(error)
	}
	return true
}

window.addEventListener('hashchange', (event)=> {
	if(ignoreHashChange) {
		ignoreHashChange = false
		return
	}
	readHash()
})