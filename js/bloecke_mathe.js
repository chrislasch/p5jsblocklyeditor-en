// Pt 2021 - MIT-License

Blockly.Blocks['decToBin'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Convert integer to binary:");
    this.appendValueInput("ganzZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
    this.setTooltip("Converts a decimal number to a binary number.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['decToBin'] = function(block) {
  var value_ganzZahl = Blockly.JavaScript.valueToCode(block, 'ganzZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = '(' + value_ganzZahl + ' >>> 0).toString(2)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['binToDec'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Convert binary to integer:");
    this.appendValueInput("binZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
    this.setTooltip("Converts a binary number to an integer.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['binToDec'] = function(block) {
  var value_binZahl = Blockly.JavaScript.valueToCode(block, 'binZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_binZahl + ', 2)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['decToHex'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Convert integer to hexadecimal:");
    this.appendValueInput("ganzZahl")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
    this.setTooltip("Converts a decimal number to a hexadecimal number.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['decToHex'] = function(block) {
  var value_ganzZahl = Blockly.JavaScript.valueToCode(block, 'ganzZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_ganzZahl + ', 10)' + '.toString(16)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['hexToDec'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Convert hexadecimal to integer:");
    this.appendValueInput("hexZahl")
        .setCheck("String");    
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(farbeMathe);
    this.setTooltip("Converts a hexadecimal number to an integer.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['hexToDec'] = function(block) {
  var value_hexZahl = Blockly.JavaScript.valueToCode(block, 'hexZahl', Blockly.JavaScript.ORDER_ATOMIC);
  var code = 'parseInt(' + value_hexZahl + ', 16)';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};