document.addEventListener("DOMContentLoaded", function(event) { 
	
	let canvas = document.getElementById('canvas');
	paper.setup(<HTMLCanvasElement>canvas);

	let circle = new paper.Path.Circle(paper.view.bounds.center, 5)
	circle.fillColor = 'red'
	
});
