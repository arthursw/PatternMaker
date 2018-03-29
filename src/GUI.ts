import * as $ from 'jquery'
import * as datDefault from 'dat.gui'

let dat: any = (<any>datDefault).default
let gui: dat.GUI = null

// let emptyGUI = ()=> {
// 	for(let controller of gui.__controllers) {
// 		gui.remove(controller)
// 	}
// 	for(let foldlerToRemove in gui.__folders) {
// 		gui.__folders[foldlerToRemove].domElement.remove()
// 	}

// }

// let parameterChanged = (value: any)=> {
// 	let event = new CustomEvent('changeParameters', { detail: { createGUI: false } })
// 	document.dispatchEvent(event)
// }

let CSS_COLOR_NAMES = ["aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgrey", "darkgreen", "darkkhaki", "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray", "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite", "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "grey", "green", "greenyellow", "honeydew", "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgrey", "lightgreen", "lightpink", "lightsalmon", "lightseagreen", "lightskyblue", "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen", "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise", "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "red", "rosybrown", "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"]

// export let createGUI = (parameters: any, folder: dat.GUI = null) => {
	
// 	let guiExists = gui != null
	
// 	if(!guiExists) {
// 		dat.GUI.DEFAULT_WIDTH = '100%'
// 		gui = new dat.GUI({ autoPlace: false })
		
// 		$('#gui-container').hide()
// 		$('#gui').append(gui.domElement)
// 	}

// 	if(folder == null) {
// 		folder = gui

// 		if(guiExists) {
// 			emptyGUI()
// 		}
// 	}

// 	for(let name in parameters) {
// 		let value = parameters[name]
// 		let type = typeof value
// 		if(type == 'object') {
// 			let childFolder = folder.addFolder(name)
// 			childFolder.open()
// 			createGUI(value, childFolder)
// 		} else if(type == 'number') {
// 			folder.add(parameters, name).onFinishChange(parameterChanged)
// 		} else if(type == 'string' && (
// 					value.startsWith('#') || 
// 					value.startsWith('rgb(') || 
// 					value.startsWith('rgba(') || 
// 					value.startsWith('hsl(') || 
// 					value.startsWith('hsla(') ||
// 					CSS_COLOR_NAMES.indexOf(value.toLowerCase()) >= 0) ) {
// 			parameters[name] = new paper.Color(parameters[name]).toCSS(false)
// 			folder.addColor(parameters, name).onFinishChange(parameterChanged)
// 		} else {
// 			folder.add(parameters, name).onFinishChange(parameterChanged)
// 		}
// 	}

// 	return
// }

export let createGUI = (parameters: { generation: string, speed: number, nSymbolsPerFrame: number, size: { width: number, height: number}, optimizeWithRaster: boolean })=> {
	dat.GUI.DEFAULT_WIDTH = '100%'
	gui = new dat.GUI({ autoPlace: false })
	
	$('#gui-container').hide()
	$('#gui').append(gui.domElement)

	gui.add(parameters, 'generation').options(['animation', 'static']).name('Generation')
	gui.add(parameters, 'speed', 0, 1000).step(10).name('Speed')
	gui.add(parameters, 'nSymbolsPerFrame', 0, 1000).step(10).name('Num. symbols / frame')
	gui.add(parameters.size, 'width').name('Width')
	gui.add(parameters.size, 'height').name('Height')
	gui.add(parameters, 'optimizeWithRaster').name('Optimize with raster')

	return gui
}
