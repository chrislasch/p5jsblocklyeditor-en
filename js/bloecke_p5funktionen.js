// Pt 2021 - MIT-License

//Category: p5 Functions
Blockly.Blocks['setup'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("setup()");
    this.appendValueInput("zeichenflaecheVariable")
    this.appendDummyInput()
        .appendField("Width =")
        .appendField(new Blockly.FieldNumber(800, 0, maxKoord, 1), "canvasBreite")
        .appendField("Height =")
        .appendField(new Blockly.FieldNumber(800, 0, maxKoord, 1), "canvasHoehe");
    this.setInputsInline(true);         
    this.appendStatementInput("do")
        .setCheck(null);
    this.setColour(farbep5SetupDraw);
    this.setTooltip("The setup() function is executed once at program start.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/setup");
  }
};

Blockly.JavaScript['setup'] = function(block) {
  var number_breite = block.getFieldValue('canvasBreite');
  var number_hoehe = block.getFieldValue('canvasHoehe');
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var value_varName = Blockly.JavaScript.valueToCode(block, 'zeichenflaecheVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = 'p5sketch.setup = function() {\n  ' + value_varName + ' = p5sketch.createCanvas(' + number_breite + ', ' + number_hoehe + ');\n  p5sketch.angleMode(p5sketch.DEGREES);\n' + statements_do + '};\n';
  return code;
};

Blockly.Blocks['draw'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("draw()");
    this.appendStatementInput("do")
        .setCheck(null)
    this.setColour(farbep5SetupDraw);
    this.setTooltip('The draw() function is continuously executed.');
    this.setHelpUrl('https://p5js.org/reference/#/p5/draw');
  }
};

Blockly.JavaScript['draw'] = function(block) {
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'p5sketch.draw = function() {\n' + statements_do + '};\n';
  return code;
};

Blockly.Blocks['preload'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("preload()");
    this.appendStatementInput("do")
        .setCheck(null)
    this.setColour(farbep5SetupDraw);
    this.setTooltip('The preload() function is executed to load images.');
    this.setHelpUrl('https://p5js.org/reference/#/p5/preload');
  }
};

Blockly.JavaScript['preload'] = function(block) {
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'p5sketch.preload = function() {\n' + statements_do + '};\n';
  return code;
};

Blockly.Blocks['mousepressed'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("When mouse is pressed...");
    this.appendStatementInput("do")
        .setCheck(null)
    this.setColour(farbep5Funktionen);
    this.setTooltip('Execute the following statements when the mouse is pressed.');
    this.setHelpUrl('https://p5js.org/reference/#/p5.Element/mousePressed');
  }
};

Blockly.JavaScript['mousepressed'] = function(block) {
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'p5sketch.mousePressed = function() {\n' + statements_do + '};\n';
  return code;
};

Blockly.Blocks['keypressed'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("When a key is pressed...");
    this.appendStatementInput("do")
        .setCheck(null)
    this.setColour(farbep5Funktionen);
    this.setTooltip('Execute the following statements when a key is pressed.');
    this.setHelpUrl('https://p5js.org/reference/#/p5/keyPressed');
  }
};

Blockly.JavaScript['keypressed'] = function(block) {
  var statements_do = Blockly.JavaScript.statementToCode(block, 'do');
  var code = 'p5sketch.keyPressed = function() {\n' + statements_do + '};\n';
  return code;
};