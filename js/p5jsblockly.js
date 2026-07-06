// Pt 2021 - MIT-License

var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');

var canvasWidth = 0;
var canvasHeight = 0;
    
var startWidth = 0.3*$(window).width();
var maxKoord = $(window).width();     

var farbep5SetupDraw = "#ed225d";
var farbep5Funktionen = "#ed225d";
var farbep5Helfer = "#da5a73";
var farbeGrundformen = "#e67e22";
var farbeVarGrundformen = "#e67e22";
var farbeAussehen = "#95a5a6";
var farbep5Werte = "#2f7db7";
var farbep5Text = "#5ba58c";
var farbeObjekte = "#d2b48c";
var farbeKommentar = "#073763";
var farbeTurtle = "#006400";
var farbeMathe = "#5b67a5";

var p5BlocklyTheme = Blockly.Theme.defineTheme('p5Dark', {
            base: Blockly.Themes.Classic,
            blockStyles: {
                colour_blocks: { colourPrimary: '20' },
                list_blocks: { colourPrimary: '260' },
                logic_blocks: { colourPrimary: '210' },
                loop_blocks: { colourPrimary: '120' },
                math_blocks: { colourPrimary: '230' },
                procedure_blocks: { colourPrimary: '290' },
                text_blocks: { colourPrimary: '160' },
                variable_blocks: { colourPrimary: '330' },
                variable_dynamic_blocks: { colourPrimary: '310' },
                hat_blocks: { colourPrimary: '330', hat: 'cap' }
            },
            categoryStyles: {
                colour_category: { colour: '20' },
                list_category: { colour: '260' },
                logic_category: { colour: '210' },
                loop_category: { colour: '120' },
                math_category: { colour: '230' },
                procedure_category: { colour: '290' },
                text_category: { colour: '160' },
                variable_category: { colour: '330' },
                variable_dynamic_category: { colour: '310' }
            },
            componentStyles: {
                workspaceBackgroundColour: '#101218',
                toolboxBackgroundColour: '#151820',
                toolboxForegroundColour: '#e7e9ee',
                flyoutBackgroundColour: '#171a21',
                flyoutForegroundColour: '#e7e9ee',
                flyoutOpacity: 0.98,
                scrollbarColour: '#5f6675',
                scrollbarOpacity: 0.45,
                insertionMarkerColour: '#ed225d',
                insertionMarkerOpacity: 0.36,
                markerColour: '#ed225d',
                cursorColour: '#ed225d'
            },
            fontStyle: {
                family: 'Inter, Segoe UI, system-ui, sans-serif',
                weight: '500',
                size: 12
            }
        });

var workspace = Blockly.inject(blocklyDiv, {
            collapse: true,
            comments: true,
            css: true,
            disable: false,
            grid: {
                spacing: 20,
                length: 2,
                colour: '#242832',
                snap: true
            },   
            horizontalLayout: false,            
            maxBlocks: Infinity,
            media: 'media/',
            move: {
                scrollbars: {
                    horizontal: true,
                    vertical: true
                },
                drag: true,
                wheel: true
            },
            oneBasedIndex: true,
            readOnly: false,
            rtl: false,
            scrollbars: true,
            toolbox: p5jsBlocklyEditorToolbox,            
            toolboxPosition: 'start',            
            trashcan: true,
            sounds: true,
            theme: p5BlocklyTheme,
            zoom: {
                controls: true,
                wheel: true,
                startScale: 0.75,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.02
            } 
        });

Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);

function createSvgElement(tagName, attributes, parent) {
    let element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    Object.keys(attributes).forEach(function(name) {
      element.setAttribute(name, attributes[name]);
    });
    if (parent) {
      parent.appendChild(element);
    }
    return element;
}

function hideBlocklyControlSprites(control) {
    Array.from(control.querySelectorAll('image')).forEach(function(image) {
      image.style.opacity = '0.001';
    });
}

function drawZoomControl(control, type) {
    control.setAttribute('data-zoom-type', type);
    Array.from(control.querySelectorAll('.custom-blockly-control-hit, .custom-blockly-control-icon')).forEach(function(element) {
      element.remove();
    });
    Array.from(control.querySelectorAll('image')).forEach(function(image) {
      image.style.opacity = '';
      if (image.getAttribute('data-zoom-scaled') === 'true') {
        return;
      }
      let originalX = parseFloat(image.getAttribute('x') || 0);
      let originalY = parseFloat(image.getAttribute('y') || 0);
      let originalWidth = parseFloat(image.getAttribute('width') || 0);
      let originalHeight = parseFloat(image.getAttribute('height') || 0);
      let scale = 0.7;
      let offset = 4.8;
      image.setAttribute('width', originalWidth * scale);
      image.setAttribute('height', originalHeight * scale);
      image.setAttribute('x', offset + originalX * scale);
      image.setAttribute('y', offset + originalY * scale);
      image.setAttribute('data-zoom-scaled', 'true');
    });
    Array.from(control.querySelectorAll('clipPath rect')).forEach(function(rect) {
      if (rect.getAttribute('data-zoom-scaled') === 'true') {
        return;
      }
      let originalX = parseFloat(rect.getAttribute('x') || 0);
      let originalY = parseFloat(rect.getAttribute('y') || 0);
      let originalWidth = parseFloat(rect.getAttribute('width') || 0);
      let originalHeight = parseFloat(rect.getAttribute('height') || 0);
      let scale = 0.7;
      let offset = 4.8;
      rect.setAttribute('x', offset + originalX * scale);
      rect.setAttribute('y', offset + originalY * scale);
      rect.setAttribute('width', originalWidth * scale);
      rect.setAttribute('height', originalHeight * scale);
      rect.setAttribute('data-zoom-scaled', 'true');
    });
}

function moveBlocklyZoomControls() {
    let topOffset = 38;
    let iconSize = 32 * 0.7;
    let zoomInY = topOffset + iconSize + 5;
    let zoomOutY = zoomInY + iconSize + 4;
    Array.from(document.querySelectorAll('.blocklyZoom')).forEach(function(control) {
      if (!control.hasAttribute('data-base-transform')) {
        control.setAttribute('data-base-transform', control.getAttribute('transform') || '');
      }
      let baseTransform = control.getAttribute('data-base-transform');
      let match = baseTransform.match(/translate\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?\s*\)/);
      let x = match ? parseFloat(match[1]) : 0;
      let type = control.getAttribute('data-zoom-type');
      let y = topOffset;
      if (type === 'in') {
        y = zoomInY;
      }
      if (type === 'out') {
        y = zoomOutY;
      }
      control.setAttribute('transform', 'translate(' + x + ', ' + y + ')');
    });
}

function drawTrashControl(control) {
    Array.from(control.querySelectorAll('.custom-blockly-control-hit, .custom-blockly-control-icon')).forEach(function(element) {
      element.remove();
    });
    Array.from(control.querySelectorAll('image')).forEach(function(image) {
      image.style.opacity = '';
      if (image.getAttribute('data-trash-scaled') === 'true') {
        return;
      }
      let originalX = parseFloat(image.getAttribute('x') || 0);
      let originalY = parseFloat(image.getAttribute('y') || 0);
      let originalWidth = parseFloat(image.getAttribute('width') || 0);
      let originalHeight = parseFloat(image.getAttribute('height') || 0);
      let scale = 0.8;
      let offsetX = 4.7;
      let offsetY = 6;
      image.setAttribute('width', originalWidth * scale);
      image.setAttribute('height', originalHeight * scale);
      image.setAttribute('x', offsetX + originalX * scale);
      image.setAttribute('y', offsetY + originalY * scale);
      image.setAttribute('data-trash-scaled', 'true');
    });
    Array.from(control.querySelectorAll('clipPath rect')).forEach(function(rect) {
      if (rect.getAttribute('data-trash-scaled') === 'true') {
        return;
      }
      let originalX = parseFloat(rect.getAttribute('x') || 0);
      let originalY = parseFloat(rect.getAttribute('y') || 0);
      let originalWidth = parseFloat(rect.getAttribute('width') || 0);
      let originalHeight = parseFloat(rect.getAttribute('height') || 0);
      let scale = 0.8;
      let offsetX = 4.7;
      let offsetY = 6;
      rect.setAttribute('x', offsetX + originalX * scale);
      rect.setAttribute('y', offsetY + originalY * scale);
      rect.setAttribute('width', originalWidth * scale);
      rect.setAttribute('height', originalHeight * scale);
      rect.setAttribute('data-trash-scaled', 'true');
    });
}

function styleBlocklyControls() {
    Array.from(document.querySelectorAll('.blocklyZoom')).forEach(function(control) {
      let image = control.querySelector('image');
      let spriteX = image ? parseFloat(image.getAttribute('x') || 0) : 0;
      let type = 'reset';
      if (spriteX < -1 && spriteX > -30) {
        type = 'in';
      }
      if (spriteX <= -30) {
        type = 'out';
      }
      drawZoomControl(control, type);
    });
    moveBlocklyZoomControls();

    Array.from(document.querySelectorAll('.blocklyTrash')).forEach(function(control) {
      drawTrashControl(control);
    });
}

function getSketchFitMetrics() {
    let stage = document.querySelector('.canvas-stage');
    let logicalWidth = parseFloat(canvasWidth);
    let logicalHeight = parseFloat(canvasHeight);
    if (!stage || !logicalWidth || !logicalHeight) {
      return null;
    }

    let stageRect = stage.getBoundingClientRect();
    let windowWidth = window.innerWidth || $(window).width();
    let availableHeight = Math.max(120, stageRect.height - 24);
    let maxSketchWidth = Math.max(160, windowWidth - 420);
    let scale = Math.min(1, availableHeight / logicalHeight, maxSketchWidth / logicalWidth);

    return {
      scale: scale,
      displayWidth: Math.max(80, Math.floor(logicalWidth * scale)),
      displayHeight: Math.max(80, Math.floor(logicalHeight * scale))
    };
}

function fitP5CanvasToStage() {
    let container = document.getElementById('p5jsContainer');
    let logicalWidth = parseFloat(canvasWidth);
    let logicalHeight = parseFloat(canvasHeight);
    let metrics = getSketchFitMetrics();
    if (!container || !logicalWidth || !logicalHeight || !metrics) {
      return;
    }

    container.style.width = metrics.displayWidth + 'px';
    container.style.height = metrics.displayHeight + 'px';
    container.setAttribute('data-scale', metrics.scale.toFixed(2));
    container.setAttribute('title', logicalWidth + ' x ' + logicalHeight + ' canvas, shown at ' + Math.round(metrics.scale * 100) + '%');

    let canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.width = metrics.displayWidth + 'px';
      canvas.style.height = metrics.displayHeight + 'px';
    }
}

function resizeSketchPanelToCanvas() {
    let metrics = getSketchFitMetrics();
    let windowWidth = window.innerWidth || $(window).width();
    if (!metrics || !windowWidth) {
      return;
    }

    let panelChromeWidth = 34;
    let desiredLeftWidth = metrics.displayWidth + panelChromeWidth;
    let minBlocklyWidth = Math.min(420, Math.max(300, windowWidth * 0.34));
    let maxLeftWidth = Math.max(220, windowWidth - minBlocklyWidth - 32);
    let leftWidth = Math.min(Math.max(desiredLeftWidth, 220), maxLeftWidth);
    let leftPercent = leftWidth / windowWidth * 100;

    splitInstance.setSizes([leftPercent, 100 - leftPercent]);
}

var onresize = function(e) {
    // Position blocklyDiv inside blocklyArea.
    blocklyDiv.style.left = '0px';
    blocklyDiv.style.top = '0px';
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    fitP5CanvasToStage();
    Blockly.svgResize(workspace);
    styleBlocklyControls();
};

let splitInstance = Split(['#split-0', '#split-1'], {
        minSize: [220, 300],
        snapOffset: 80,
        gutterSize: 8,
    })

let observer = new ResizeObserver(function(mutations) {
    onresize();
});

let child = document.getElementById('split-0');
observer.observe(child, { attributes: true });

window.addEventListener('resize', function() {
    resizeSketchPanelToCanvas();
    onresize();
}, false);
onresize();

var myp5;

function updateP5() {
    let code = Blockly.JavaScript.workspaceToCode(workspace);
    var myblocks = Blockly.mainWorkspace.getAllBlocks()
    for(var i = 0; i < myblocks.length; i++){
      if(myblocks[i].type == 'setup'){
        canvasWidth = myblocks[i].getFieldValue('canvasBreite');
        canvasHeight = myblocks[i].getFieldValue('canvasHoehe');
      }
    }
    document.getElementById('p5jsContainer').setAttribute("style", "width: " + canvasWidth + "px; height: " + canvasHeight + "px;");
    document.getElementById('p5jsContainer').innerHTML = "";
    if (myp5) {
      myp5.remove();
    }
    try {
        var sketch = new Function("p5sketch", code);
        myp5 = new p5(sketch, 'p5jsContainer'); 
        resizeSketchPanelToCanvas();
        fitP5CanvasToStage();
    } catch (e) { 
        $('#loggerDiv').removeClass('alert alert-light').addClass('alert alert-danger');
        let text01 = '<strong>There is an error in the code:<\/strong><br><br>' + e.toString() + '<hr>You can undo the last changes with "right mouse button - Undo".'
        document.getElementById('loggerDiv').innerHTML = text01;        
    }
    onresize();
}

function viewFlems() {
    let codeInstance = Blockly.JavaScript.workspaceToCode(workspace);
    let code = codeInstance.replaceAll("p5sketch.", "");
    let codeToSave = code.replaceAll("p5sketch, ", "");
    // Replace triple newlines
    codeToSave = codeToSave.replace(/\n\s*\n\s*\n/g, '\n\n');
    if(!codeToSave.includes('new p5();')) {
      codeToSave = codeToSave + '\nnew p5();';
    }    
    window.localStorage.setItem("codeLocalStorage", codeToSave);  
    window.open("p5jsflems/index.html",'_blank');
}

function viewCode() {
    let codeInstance = Blockly.JavaScript.workspaceToCode(workspace);
    let code1 = codeInstance.replaceAll("p5sketch.", "");    
    let code = code1.replaceAll("p5sketch, ", "");
    // Replace triple newlines
    code = code.replace(/\n\s*\n\s*\n/g, '\n\n');   
    let codeDiv = document.getElementById('codeDiv');
    let htmlImport = Prism.highlight(code, Prism.languages.javascript, 'javascript');
    codeDiv.innerHTML = htmlImport;
}

function p5Init() {
    Blockly.mainWorkspace.clear();
    let urlString = window.location.hash;
    if (urlString.length > 0) {
        try {
            let triggerCode = urlString.substring(0, 4);
            if (triggerCode == "#LZ=") {
              let compressedCode = urlString.substring(4);
              let string = LZString.decompressFromEncodedURIComponent(compressedCode);
              let xml = Blockly.Xml.textToDom(string);
              Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);              
            }
            if (triggerCode == "#PN=") {
              let programName = urlString.substring(4);
              loadBeispielProgramm('programme/' + programName + '.p5xml');
            }
        }
        catch {
           Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);
        }
    } else {
        Blockly.Xml.domToWorkspace(document.getElementById('startBlocks'), workspace);
    }
    let p5jsWidth = 0.3*$(window).width();
    let width1 = "width: " + p5jsWidth + "px";
    let width2 = p5jsWidth + "px";
    document.getElementById('p5jsContainer').setAttribute("style", width1);
    document.getElementById('p5jsContainer').style.width = width2;
    onresize();
    viewCode();
    updateP5();
    loadTutorial('tutorials/inhalt.html');
}

document.getElementById('p5Run').onclick = function() {
    $('#loggerDiv').removeClass('alert alert-danger').addClass('alert alert-light');
    $("#loggerDiv").removeAttr("style");
    document.getElementById('loggerDiv').innerHTML = '';
    updateP5();
};

document.addEventListener('keydown', function(event) {
    let isRunShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
    if (!isRunShortcut) {
      return;
    }
    event.preventDefault();
    document.getElementById('p5Run').click();
});

let modalConfirm = function(callback){
  $("#p5loeschen").on("click", function(){
    $("#programmLoeschenModal").modal('show');
  });
  $("#btnLoeschJa").on("click", function(){
    callback(true);
    $("#programmLoeschenModal").modal('hide');
  });
  $("#btnLoeschNein").on("click", function(){
    callback(false);
    $("#programmLoeschenModal").modal('hide');
  });
};
modalConfirm(function(confirm){
  if(confirm){
    $('#loggerDiv').removeClass('alert alert-danger').addClass('alert alert-light');
    document.getElementById('loggerDiv').innerHTML = '';    
    if (myp5) {
      myp5.remove();
    }
    p5Init();
  }else{
  }
});

document.getElementById('jsAnzeigen').onclick = function() {
    viewCode();
};

document.getElementById('flemsAnzeigen').onclick = function() {
    viewFlems();
};

let traceButton = document.getElementById('traceAnzeigen');
if (traceButton) {
  traceButton.onclick = function() {
      window.open("blocklytrace/index.html",'_blank');
  };
}