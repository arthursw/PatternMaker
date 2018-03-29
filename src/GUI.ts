import * as $ from 'jquery'
import * as datDefault from 'dat.gui'

let dat: any = (<any>datDefault).default
let gui: dat.GUI = null

export let createGUI = (parameters: { generation: string, speed: number, nSymbolsPerFrame: number, size: { width: number, height: number}, optimizeWithRaster: boolean })=> {
	dat.GUI.DEFAULT_WIDTH = '100%'
	gui = new dat.GUI({ autoPlace: false })
	
	$('#gui-container').hide()
	$('#gui').append(gui.domElement)

	gui.add(parameters, 'generation').options(['animation', 'images']).name('Generation')
	gui.add(parameters, 'speed', 0, 1000).step(10).name('Speed')
	gui.add(parameters, 'nSymbolsPerFrame', 1, 1000).step(1).name('Num. symbols / frame')
	gui.add(parameters.size, 'width').name('Width')
	gui.add(parameters.size, 'height').name('Height')
	gui.add(parameters, 'optimizeWithRaster').name('Optimize with raster')

	return gui
}

export let emptyFolder = (folder: dat.GUI)=> {
	
	for(let controller of folder.__controllers.slice()) {
		folder.remove(controller)
	}

	let folders = { ...folder.__folders }
	for(let name in folders) {
		(<any>folder).removeFolder(folders[name])
	}	
}