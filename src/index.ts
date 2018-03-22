import * as paper from 'paper';
import { ThreeStripesGrid, SymbolsGrid } from './Placer'

let w:any = <any>window;
(<any>window).w = w;

document.addEventListener("DOMContentLoaded", function(event) { 
	
	let canvas = document.getElementById('canvas');
	paper.setup(<HTMLCanvasElement>canvas);

	w.paper = paper

	// let circle = new paper.Path.Circle(paper.view.bounds.center, paper.view.bounds.height/2)
	// circle.fillColor = 'red'
	// w.circle = circle

	let container = new paper.Path.Rectangle(paper.view.bounds)
	let colors: paper.Color[] = []
	colors.push(new paper.Color('#df768e'))
	colors.push(new paper.Color('#b48fc0'))
	colors.push(new paper.Color('#86a4d3'))
	// colors.push(new paper.Color('#71bfbe'))
	// colors.push(new paper.Color('#9bce6d'))
	// colors.push(new paper.Color('#e5de45'))
	// colors.push(new paper.Color('#fdc13d'))
	// colors.push(new paper.Color('#f2825b'))

	let grid = new SymbolsGrid(5, 3, 3, colors)
	// let grid = new ThreeStripesGrid(40, 50)

	let raster: paper.Raster = null
	paper.view.onFrame = ()=> {
		// if(raster != null) {
		// 	paper.project.clear()
		// 	paper.project.activeLayer.addChild(raster)
		// }
		for(let i=0 ; i<100 ; i++) {
			grid.next(container, container)
		}
		// raster = paper.project.activeLayer.rasterize()
	}

	paper.view.onClick = ()=> {
		paper.project.clear()
		grid.reset(container)
	}
});
