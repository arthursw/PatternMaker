let w:any = <any>window;
(<any>window).w = w;

export let raster: paper.Raster = null

let handleImage = (image: HTMLImageElement)=> {
	raster = new paper.Raster(image)
	w.raster = raster
	raster.visible = false
	// raster.crossOrigin = 'anonymous'
	raster.on('load', function() {
		// Transform the raster, so it fills the view:
		raster.fitBounds(paper.view.bounds)
	})
}

function onDocumentDrag(event: any) {
	event.preventDefault();
}

function onDocumentDrop(event: any) {
	event.preventDefault();

	var file = event.dataTransfer.files[0];
	var reader = new FileReader();

	reader.onload = function(event: any) {
		var image = document.createElement('img');
		image.crossOrigin = '';
		image.onload = function () {
			handleImage(image);
		};
		image.src = event.target.result;
	};
	reader.readAsDataURL(file);
}

document.addEventListener('drop', onDocumentDrop, false);
document.addEventListener('dragover', onDocumentDrag, false);
document.addEventListener('dragleave', onDocumentDrag, false);