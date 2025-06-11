// Pt 2021 - MIT-License

//Text
Blockly.Blocks['p5text_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Text output:")
        .appendField(new Blockly.FieldTextInput("Hello!"), "text")
        .appendField("at position: x =")
        .appendField(new Blockly.FieldNumber(0, -maxKoord, maxKoord, 1), "xkoord")
        .appendField("y =")
        .appendField(new Blockly.FieldNumber(0, -maxKoord, maxKoord, 1), "ykoord");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Displays text at the given position.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/text");
  }
};

Blockly.JavaScript['p5text_number'] = function(block) {
  var text_text = block.getFieldValue('text');
  var number_xkoord = block.getFieldValue('xkoord');
  var number_ykoord = block.getFieldValue('ykoord');
  var code = 'p5sketch.text(\"' + text_text + '\", '+ number_xkoord + ', '+ number_ykoord + ');\n';
  return code;
};

Blockly.Blocks['p5textbox_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Textbox:")
        .appendField(new Blockly.FieldTextInput("Hello!"), "text")
        .appendField("at position: x =")
        .appendField(new Blockly.FieldNumber(0, -maxKoord, maxKoord, 1), "xkoord")
        .appendField("y =")
        .appendField(new Blockly.FieldNumber(0, -maxKoord, maxKoord, 1), "ykoord")
        .appendField("| width: ")
        .appendField(new Blockly.FieldNumber(0, 0, maxKoord, 1), "breite")
        .appendField("height:")
        .appendField(new Blockly.FieldNumber(0, 0, maxKoord, 1), "hoehe");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Displays a textbox at the given position.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/text");
  }
};

Blockly.JavaScript['p5textbox_number'] = function(block) {
  var text_text = block.getFieldValue('text');
  var number_xkoord = block.getFieldValue('xkoord');
  var number_ykoord = block.getFieldValue('ykoord');
  var number_breite = block.getFieldValue('breite');
  var number_hoehe = block.getFieldValue('hoehe');
  var code = 'p5sketch.text(\"' + text_text + '\", '+ number_xkoord + ', ' + number_ykoord + ', ' + number_breite + ', ' + number_hoehe + ');\n';
  return code;
};

Blockly.Blocks['p5textsize_number'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Text size:")
        .appendField(new Blockly.FieldNumber(0, 0, maxKoord, 1), "textsize");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Sets the text size.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/textSize");
  }
};

Blockly.JavaScript['p5textsize_number'] = function(block) {
  var number_textsize = block.getFieldValue('textsize');
  var code = 'p5sketch.textSize(' + number_textsize + ');\n';
  return code;
};


Blockly.Blocks['p5textalign'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Text alignment:")
        .appendField(new Blockly.FieldDropdown([["centered","p5sketch.CENTER"], ["left aligned","p5sketch.LEFT"], ["right aligned","p5sketch.RIGHT"]]), "align");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Text alignment (left, center, right)");
    this.setHelpUrl("https://p5js.org/reference/#/p5/textAlign");
  }
};

Blockly.JavaScript['p5textalign'] = function(block) {
  var dropdown_align = block.getFieldValue('align');
  var code = 'p5sketch.textAlign(' + dropdown_align + ');\n';
  return code;
};

Blockly.Blocks['p5text_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Text output:");
    this.appendValueInput("text_eingabe")
        .setCheck("String")
    this.appendValueInput("xKoord")
        .setCheck("Number")
        .appendField("at position: x =");
    this.appendValueInput("yKoord")
        .setCheck("Number")
        .appendField("y =");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Displays text at the given position.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/text");
  }
};

Blockly.JavaScript['p5text_var'] = function(block) {
  var value_text = Blockly.JavaScript.valueToCode(block, 'text_eingabe', Blockly.JavaScript.ORDER_ATOMIC);
  var value_xkoord = Blockly.JavaScript.valueToCode(block, 'xKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_ykoord = Blockly.JavaScript.valueToCode(block, 'yKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.text(' + value_text + ', '+ value_xkoord + ', '+ value_ykoord + ');\n';
  return code;
};

Blockly.Blocks['p5textbox_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Textbox:");
    this.appendValueInput("text_eingabe")
        .setCheck("String")
    this.appendValueInput("xKoord")
        .setCheck("Number")
        .appendField("at position: x =");
    this.appendValueInput("yKoord")
        .setCheck("Number")
        .appendField("y =");
    this.appendValueInput("breite")
        .setCheck("Number")
        .appendField("| width:");
    this.appendValueInput("hoehe")
        .setCheck("Number")
        .appendField("height:");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Displays a textbox at the given position.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/text");
  }
};

Blockly.JavaScript['p5textbox_var'] = function(block) {
  var value_text = Blockly.JavaScript.valueToCode(block, 'text_eingabe', Blockly.JavaScript.ORDER_ATOMIC);
  var value_xkoord = Blockly.JavaScript.valueToCode(block, 'xKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_ykoord = Blockly.JavaScript.valueToCode(block, 'yKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_breite = Blockly.JavaScript.valueToCode(block, 'breite', Blockly.JavaScript.ORDER_ATOMIC);
  var value_hoehe = Blockly.JavaScript.valueToCode(block, 'hoehe', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = 'p5sketch.text(' + value_text + ', '+ value_xkoord + ', '+ value_ykoord + ', '+ value_breite + ', '+ value_hoehe + ');\n';
  return code;
};

Blockly.Blocks['p5textsize_var'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Text size:");
    this.appendValueInput("text_groesse")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Sets the text size.");
    this.setHelpUrl("https://p5js.org/reference/#/p5/textSize");
  }
};

Blockly.JavaScript['p5textsize_var'] = function(block) {
  var value_textgroesse = Blockly.JavaScript.valueToCode(block, 'text_groesse', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'p5sketch.textSize(' + value_textgroesse + ');\n';
  return code;
};

Blockly.Blocks['text_input'] = {
  init: function() {
    this.appendDummyInput()
    this.appendValueInput("textFeldVariable")
        .appendField("Text input: ");      
    this.appendValueInput("xKoord")
        .setCheck("Number")
        .appendField("| x =");
    this.appendValueInput("yKoord")
        .setCheck("Number")
        .appendField("y =");
    this.appendValueInput("breite")
        .setCheck("Number")
        .appendField("| width:");
    this.appendValueInput("speicherVariable")
        .setCheck("String")
        .appendField("| storage variable");
    this.appendValueInput("zeichenflaecheVariable")
        .appendField("| ");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Input field for entering text, which is stored in a variable.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['text_input'] = function(block) {
  var value_eingabefeldVarName = Blockly.JavaScript.valueToCode(block, 'textFeldVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var value_xkoord = Blockly.JavaScript.valueToCode(block, 'xKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_ykoord = Blockly.JavaScript.valueToCode(block, 'yKoord', Blockly.JavaScript.ORDER_ATOMIC);
  var value_breite = Blockly.JavaScript.valueToCode(block, 'breite', Blockly.JavaScript.ORDER_ATOMIC);
  var value_varname = Blockly.JavaScript.valueToCode(block, 'speicherVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var value_canvasvarName = Blockly.JavaScript.valueToCode(block, 'zeichenflaecheVariable', Blockly.JavaScript.ORDER_ATOMIC);   
  var code = value_eingabefeldVarName + ' = p5sketch.createInput(\"\");\n' + value_eingabefeldVarName + '.position(' + value_canvasvarName + '.position().x+' + value_xkoord + ', ' + value_canvasvarName + '.position().y+' + value_ykoord + ');\n' + value_eingabefeldVarName + '.size(' + value_breite + ');\n' + value_eingabefeldVarName + '.input(function e() {'+ value_varname + ' = this.value(); });\n';
  return code;
};

Blockly.Blocks['anzeige_stellen'] = {
  init: function() {
    this.appendValueInput("zahl")
        .setCheck("Number")
    this.appendDummyInput()
        .appendField("with");
    this.appendValueInput("anzahlstellen")
        .setCheck("Number")
    this.appendDummyInput()
        .appendField("decimal places");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Sets the number of decimal places.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['anzeige_stellen'] = function(block) {
  var value_zahl = Blockly.JavaScript.valueToCode(block, 'zahl', Blockly.JavaScript.ORDER_ATOMIC);
  var value_anzahlstellen = Blockly.JavaScript.valueToCode(block, 'anzahlstellen', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_zahl + '.toFixed(' + value_anzahlstellen + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['text_unicodezeichen'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Unicode: ")
        .appendField(new Blockly.FieldTextInput("1F642"), "uniCode");
    this.setInputsInline(false);
    this.setOutput(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Enter a Unicode and output the character.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['text_unicodezeichen'] = function(block) {
  var text_unicode = block.getFieldValue('uniCode');
  var code = 'String.fromCodePoint(0x' + text_unicode + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['zeichen_an_stelle_aus_string'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Character from");    
    this.appendValueInput("zeichenfolge")
        .setCheck("String")
    this.appendDummyInput()
        .appendField("at index:");
    this.appendValueInput("stelle")
        .setCheck("Number")
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Gets a character from a string at the given position.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['zeichen_an_stelle_aus_string'] = function(block) {
  var value_zeichenfolge = Blockly.JavaScript.valueToCode(block, 'zeichenfolge', Blockly.JavaScript.ORDER_ATOMIC);
  var value_stelle = Blockly.JavaScript.valueToCode(block, 'stelle', Blockly.JavaScript.ORDER_ATOMIC);
  var code = value_zeichenfolge + '.charAt(' + value_stelle + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['string_in_ganzzahl'] = {
  init: function() {
    this.appendValueInput("zeichenfolge")
        .setCheck("String")
    this.appendDummyInput()
        .appendField("convert to integer");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbep5Text);
    this.setTooltip("Converts the string to an integer.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['string_in_ganzzahl'] = function(block) {
  var value_zeichenfolge = Blockly.JavaScript.valueToCode(block, 'zeichenfolge', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_zeichenfolge + ')';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};