import * as $ from 'jquery'
import * as ace from 'brace'
import 'brace/mode/json'
import 'brace/theme/solarized_light'

let files: Map<string, string> = new Map<string, string>()
let editor: any = null
let w: any = window
w.$ = <any>$;

let setFile = (fileName: string, content: string)=> {
	editor.setValue(content)

	if( files.get(fileName) == null) {

		files.set(fileName, content)
		let optionJ = $('<option value="' + fileName + '">').text(fileName)
		$("#tools .file-select select").append(optionJ)
		saveFilesToLocalStorage()

	}
}

let loadFile = (fileName: string, ignoreIfAlreadyLoaded = false)=> { 
	if(ignoreIfAlreadyLoaded && files.get(fileName) != null) {
		return
	}

	$.getJSON( location.origin + "/" + fileName, ( data: any )=> {
		setFile(fileName, data)
	});

}

let saveFile = (fileName: string, mimeType: string, content: string)=> {
	let blob = new Blob([content], {type: mimeType});
	let url = URL.createObjectURL(blob);
	let link = document.createElement("a");
	document.body.appendChild(link);
	link.download = fileName;
	link.href = url;
	link.click();
	document.body.removeChild(link);
}

let saveFilesToLocalStorage = ()=> {
	let object: any = {}
	for (let [fileName, content] of files.entries()) {
		object[fileName] = content
	}
	localStorage.setItem('files', JSON.stringify(files))
}

let loadFilesFromLocalStorage = ()=> {
	let object = JSON.parse(localStorage.get('files'))
	for(let fileName in object) {
		files.set(fileName, object[fileName])
	}
}

let defaultFiles = ['flags', 'grids', 'lines']

let loadDefaultFiles = ()=> {

	loadFilesFromLocalStorage()

	for(let fileName of defaultFiles) {
		loadFile(fileName, true)
	}
}

export let initializeEditor = (parameters: any): any => {
	
	editor = ace.edit('json-editor');
	editor.getSession().setMode('ace/mode/json');
	editor.setTheme('ace/theme/solarized_light');
	editor.setValue(JSON.stringify(parameters, null, 2));
	editor.clearSelection();
	editor.session.on('change', function(delta: { start: any, end: any, lines: any, action: any}) {
		

		try {
			let event = new CustomEvent('changeParameters', { detail: { parameters: JSON.parse(editor.getValue()) } })
			document.dispatchEvent(event)
		} catch (error) {
			console.log(error)
		}

	});

	let draggingEditorOffsetX: number = null
	
	$('#tools .handle').mousedown( (event: any )=> {
		draggingEditorOffsetX = $('#tools').outerWidth() - event.pageX
	})
	$(window).mousemove( (event: any )=> {
		if(draggingEditorOffsetX != null) {
			let width = event.pageX + draggingEditorOffsetX
			$('#tools').css('width', width)
			$('#canvas').css('left', width)
			paper.view.viewSize.width = window.innerWidth - width
			paper.view.viewSize.height = window.innerHeight
		}
	})
	$(window).mouseup( (event: any )=> {
		draggingEditorOffsetX = null
	})

	$('#tools .file-select select').on('change', (value: any)=> {
		if(value == 'loadFile') {
			$('#tools .file-select .file-input').click()
		} else {
			 setFile(value, files.get(value))
		}
	})

	$('#tools .file-select .file-input').on('change', (event: any)=> {
		var file = event.target.files[0]
		
		if (!file) {
			return
		}
		
		var reader = new FileReader()
		
		reader.onload = (event: any)=> {
			var content = event.target.result
			setFile(file.name, content)
		};
		
		reader.readAsText(file)
	})

	$('#tools .tabs .JSON').on('click', (event: any)=> {
		$('#gui-container').hide()
		$('#json-editor').show()
	})

	$('#tools .tabs .GUI').on('click', (event: any)=> {
		$('#json-editor').hide()
		$('#gui-container').show()
	})

	$('#tools .save .JSON').on('click', (event: any)=> {
		saveFile('pattern.json', 'application/json', editor.getValue())
	})

	$('#tools .save .SVG').on('click', (event: any)=> {
		let svg: string = <any>paper.project.exportSVG( { asString: true })
		saveFile('pattern.svg', 'image/svg+xml', svg)
	})

	return editor
}