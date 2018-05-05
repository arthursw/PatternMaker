import * as $ from 'jquery'
import * as ace from 'brace'
import 'brace/mode/json'
import 'brace/theme/solarized_light'

let files: Map<string, string> = new Map<string, string>()
export let editor: any = null
let w: any = window
w.$ = <any>$;

export let setFileInEditor = (fileName: string)=> {
	let content = files.get(fileName)
	if(content != null) {
		editor.setValue(content)
		editor.clearSelection()
	}
}

let setFile = (fileName: string, content: string, setContentInEditor = true)=> {
	if(setContentInEditor) {
		editor.setValue(content)
		editor.clearSelection()
	}

	if( files.get(fileName) == null) {

		files.set(fileName, content)
		let optionJ = $('<option value="' + fileName + '">').text(fileName)
		$("#tools .file-select select").append(optionJ)
		saveFilesToLocalStorage()

	}
}

let checkAllDefaultFilesLoaded = ()=> {
	if(!defaultFilesLoaded) {
		for(let defaultFile of defaultFiles) {
			if(files.get(defaultFile) == null) {
				return false
			}
		}
		defaultFilesLoaded = true
		document.dispatchEvent(new Event('defaultFilesLoaded'))
	}
	return true
}
let loadFile = (fileName: string, ignoreIfAlreadyLoaded = false, setContentInEditor = true)=> { 
	if(ignoreIfAlreadyLoaded && files.get(fileName) != null) {
		return
	}

	$.getJSON( location.origin + location.pathname + "/patterns/" + fileName, ( data: any )=> {
		setFile(fileName, JSON.stringify(data, null, 2), setContentInEditor)
		checkAllDefaultFilesLoaded()
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
	let object = JSON.parse(localStorage.getItem('files'))
	for(let fileName in object) {
		files.set(fileName, object[fileName])
	}
}

let defaultFiles = ['flags.json', 'grids.json', 'infinite-squares.json', 'simple.json', 'jogl.json']
let defaultFilesLoaded = false

let loadDefaultFiles = ()=> {

	loadFilesFromLocalStorage()

	for(let fileName of defaultFiles) {
		loadFile(fileName, true, false)
	}
}

export let initializeEditor = (parameters: any): any => {
	$('#json-editor').hide()
	editor = ace.edit('json-editor');
	w.editor = editor
	editor.getSession().setMode('ace/mode/json');
	editor.setTheme('ace/theme/solarized_light');
	editor.session.setUseWrapMode(true);
	editor.session.setTabSize(2);
	editor.setValue(JSON.stringify(parameters, null, 2));
	editor.clearSelection();
	editor.session.on('change', function(delta: { start: any, end: any, lines: any, action: any}) {
		if(editor.ignoreChange) {
			editor.ignoreChange = false
			if(editor.saveFile) {
				editor.saveFile = false
				saveFile('pattern.json', 'application/json', editor.getValue())
			}
			return
		}
		let parameters = null
		try {
			parameters = JSON.parse(editor.getValue())
		} catch (error) {
			console.log(error)
		}

		if(parameters != null) {
			let event = new CustomEvent('changeParameters', { detail: { parameters: parameters } })
			document.dispatchEvent(event)
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
	$(window).resize( (event: any) => {
		let width = $('#tools').outerWidth()
		paper.view.viewSize.width = window.innerWidth - width
		paper.view.viewSize.height = window.innerHeight
	})

	$('#tools .file-select select').on('change', (event: any)=> {
		let value = event.target.value
		if(value == 'loadFile') {
			event.preventDefault()
			$('#file-input').trigger('click');
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

		let e = new CustomEvent('jsonClicked')
		document.dispatchEvent(e)
	})

	$('#tools .tabs .GUI').on('click', (event: any)=> {
		$('#json-editor').hide()
		$('#gui-container').show()
	})

	$('#tools .save .JSON').on('click', (event: any)=> {
		editor.saveFile = true
		let e = new CustomEvent('jsonClicked')
		document.dispatchEvent(e)
	})

	$('#tools .save .SVG').on('click', (event: any)=> {
		let svg: string = <any>paper.project.exportSVG( { asString: true })
		saveFile('pattern.svg', 'image/svg+xml', svg)
	})

	loadDefaultFiles()
	
	return editor
}
