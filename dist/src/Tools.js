import * as $ from 'jquery';
import * as ace from 'brace';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
let files = new Map();
export let editor = null;
let w = window;
w.$ = $;
let setFile = (fileName, content, setContentInEditor = true) => {
    if (setContentInEditor) {
        editor.setValue(content);
    }
    if (files.get(fileName) == null) {
        files.set(fileName, content);
        let optionJ = $('<option value="' + fileName + '">').text(fileName);
        $("#tools .file-select select").append(optionJ);
        saveFilesToLocalStorage();
    }
};
let loadFile = (fileName, ignoreIfAlreadyLoaded = false, setContentInEditor = true) => {
    if (ignoreIfAlreadyLoaded && files.get(fileName) != null) {
        return;
    }
    $.getJSON(location.origin + location.pathname + "/patterns/" + fileName, (data) => {
        setFile(fileName, JSON.stringify(data, null, 2), setContentInEditor);
    });
};
let saveFile = (fileName, mimeType, content) => {
    let blob = new Blob([content], { type: mimeType });
    let url = URL.createObjectURL(blob);
    let link = document.createElement("a");
    document.body.appendChild(link);
    link.download = fileName;
    link.href = url;
    link.click();
    document.body.removeChild(link);
};
let saveFilesToLocalStorage = () => {
    let object = {};
    for (let [fileName, content] of files.entries()) {
        object[fileName] = content;
    }
    localStorage.setItem('files', JSON.stringify(files));
};
let loadFilesFromLocalStorage = () => {
    let object = JSON.parse(localStorage.getItem('files'));
    for (let fileName in object) {
        files.set(fileName, object[fileName]);
    }
};
let defaultFiles = ['flags.json', 'grids.json', 'infinite-squares.json', 'simple.json'];
let loadDefaultFiles = () => {
    loadFilesFromLocalStorage();
    for (let fileName of defaultFiles) {
        loadFile(fileName, true, false);
    }
};
export let initializeEditor = (parameters) => {
    editor = ace.edit('json-editor');
    w.editor = editor;
    editor.getSession().setMode('ace/mode/json');
    editor.setTheme('ace/theme/solarized_light');
    editor.session.setUseWrapMode(true);
    editor.session.setTabSize(2);
    editor.setValue(JSON.stringify(parameters, null, 2));
    editor.clearSelection();
    editor.session.on('change', function (delta) {
        if (editor.ignoreChange) {
            editor.ignoreChange = false;
            return;
        }
        let parameters = null;
        try {
            parameters = JSON.parse(editor.getValue());
        }
        catch (error) {
            console.log(error);
        }
        if (parameters != null) {
            let event = new CustomEvent('changeParameters', { detail: { parameters: parameters } });
            document.dispatchEvent(event);
        }
    });
    let draggingEditorOffsetX = null;
    $('#tools .handle').mousedown((event) => {
        draggingEditorOffsetX = $('#tools').outerWidth() - event.pageX;
    });
    $(window).mousemove((event) => {
        if (draggingEditorOffsetX != null) {
            let width = event.pageX + draggingEditorOffsetX;
            $('#tools').css('width', width);
            $('#canvas').css('left', width);
            paper.view.viewSize.width = window.innerWidth - width;
            paper.view.viewSize.height = window.innerHeight;
        }
    });
    $(window).mouseup((event) => {
        draggingEditorOffsetX = null;
    });
    $('#tools .file-select select').on('change', (event) => {
        let value = event.target.value;
        if (value == 'loadFile') {
            event.preventDefault();
            $('#file-input').trigger('click');
        }
        else {
            setFile(value, files.get(value));
        }
    });
    $('#tools .file-select .file-input').on('change', (event) => {
        var file = event.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = (event) => {
            var content = event.target.result;
            setFile(file.name, content);
        };
        reader.readAsText(file);
    });
    $('#tools .tabs .JSON').on('click', (event) => {
        $('#gui-container').hide();
        $('#json-editor').show();
        let e = new CustomEvent('jsonClicked');
        document.dispatchEvent(e);
    });
    $('#tools .tabs .GUI').on('click', (event) => {
        $('#json-editor').hide();
        $('#gui-container').show();
    });
    $('#tools .save .JSON').on('click', (event) => {
        saveFile('pattern.json', 'application/json', editor.getValue());
    });
    $('#tools .save .SVG').on('click', (event) => {
        let svg = paper.project.exportSVG({ asString: true });
        saveFile('pattern.svg', 'image/svg+xml', svg);
    });
    loadDefaultFiles();
    return editor;
};
//# sourceMappingURL=Tools.js.map