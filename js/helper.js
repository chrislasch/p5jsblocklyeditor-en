// Pt 2021 - MIT-License

document.getElementById('p5saveDateiname').value = 'BlocklyCode';

function showAppToast(message) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    return;
  }
  window.clearTimeout(window.appToastTimer);
  toast.textContent = message;
  toast.setAttribute('data-state', 'visible');
  window.appToastTimer = window.setTimeout(function() {
    toast.setAttribute('data-state', 'hidden');
  }, 2400);
}

function getSaveFilename() {
  let filename = document.getElementById('p5saveDateiname').value.trim() || 'BlocklyCode';
  return /\.p5xml$/i.test(filename) ? filename : filename + '.p5xml';
}

function downloadProgramFile(filename, xmlText) {
  let blob = new Blob([xmlText], { type: 'application/xml' });
  let link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

async function saveProgramFile(filename, xmlText) {
  if (!window.showSaveFilePicker) {
    downloadProgramFile(filename, xmlText);
    return;
  }

  let fileHandle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [{
      description: 'p5 Blockly program',
      accept: {
        'application/xml': ['.p5xml'],
      },
    }],
  });
  let writable = await fileHandle.createWritable();
  await writable.write(new Blob([xmlText], { type: 'application/xml' }));
  await writable.close();
}

document.getElementById('p5Save').onclick = async function() {
  try {
    let xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    let xmlText = Blockly.Xml.domToText(xml);
    let filename = getSaveFilename();
    await saveProgramFile(filename, xmlText);
    showAppToast('Program saved as a .p5xml file.');
  } catch (error) {
    if (!error || error.name !== 'AbortError') {
      showAppToast('Unable to save program.');
    }
  }
};

let urlSaveButton = document.getElementById('URLSave');
if (urlSaveButton) {
  urlSaveButton.onclick = function() {
    try {
      let xml = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
      var xml_text = Blockly.Xml.domToText(xml);
      let compressed = LZString.compressToEncodedURIComponent(xml_text);
      let URL_text = "#LZ=" + compressed;
      let URLDiv = document.getElementById('URLDiv');
      URLDiv.innerHTML = URL_text;
      showAppToast('Share link generated.');
    } catch { }
  };
}

const fileSelector = document.getElementById('p5Dateiwahl');
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  let file = fileList[0];
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (event) {
    Blockly.mainWorkspace.clear();
    var xml = Blockly.Xml.textToDom(event.target.result);
    Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace);   
    document.getElementById('p5Dateiwahl').value = null; 
    showAppToast('Program loaded into the workspace.');
  };  
});

async function loadTutorial(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    $("#divTutorials").html(data);
  } catch (err) { }
}

document.getElementById('backToContent').onclick = function() {
  loadTutorial('tutorials/inhalt.html');
};

async function loadBeispielProgramm(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
      Blockly.mainWorkspace.clear();
      var xml = Blockly.Xml.textToDom(data);
      Blockly.Xml.domToWorkspace(xml, Blockly.mainWorkspace); 
      updateP5();
  } catch (err) { }
}