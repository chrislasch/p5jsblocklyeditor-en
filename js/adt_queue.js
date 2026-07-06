// Pt 2021 - MIT-License

let farbeADTSchlange = '#6E7C7C';

Blockly.Blocks['adt_queue_neu'] = {
  init: function() {
    this.appendValueInput("queueVariable")
        .appendField("");
    this.appendDummyInput()
        .appendField(" = new Queue()");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTSchlange);
    this.setTooltip("Creates an empty queue.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_neu'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'queueVariable', Blockly.JavaScript.ORDER_ATOMIC);
  var functionName = Blockly.JavaScript.provideFunction_(
    'schlangeKlasse',
    ['function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ +
      '() {',
      '  this.inhalt = [];',
      '  this.isEmpty = function() { if (this.inhalt.length == 0) { return true; } else { return false; } };',
      '  this.head = function() { return this.inhalt[0] };',
      '  this.enqueue = function(val) { this.inhalt.push(val) };',
      '  this.dequeue = function() { return this.inhalt.shift() };',
      '  this.getQueue = function() { return this.inhalt.slice(0) };',
      '}'
    ]);
  var code = value_varName + ' = new ' + functionName + '();\n';  
  return code;
};

Blockly.Blocks['adt_queue_isEmpty'] = {
  init: function() {
    this.appendValueInput("queueVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".isEmpty(): Boolean");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTSchlange);
    this.setTooltip("Returns true if the queue contains no elements, otherwise false.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_isEmpty'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'queueVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.isEmpty()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_queue_head'] = {
  init: function() {
    this.appendValueInput("queueVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".head(): Value");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTSchlange);
    this.setTooltip("Returns the value of the first element of the queue without removing it.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_head'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'queueVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.head()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_queue_enqueue'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Array')
        .appendField("");
    this.appendValueInput("neuesElement")
        .appendField(".enqueue(");
    this.appendDummyInput()
        .appendField(")");        
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeADTSchlange);
    this.setTooltip("Adds a new element with the given value to the end of the queue.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_enqueue'] = function(block) {
  var list = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '[]';
  var neuesElement = Blockly.JavaScript.valueToCode(block, 'neuesElement', Blockly.JavaScript.ORDER_ATOMIC);
  var code = list + '.enqueue(' + neuesElement + ');\n';
  return code;
};

Blockly.Blocks['adt_queue_dequeue'] = {
  init: function() {
    this.appendValueInput("queueVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".dequeue(): Value");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTSchlange);
    this.setTooltip("Returns the value of the first element and removes it from the queue.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_dequeue'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'queueVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.dequeue()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.Blocks['adt_queue_getQueue'] = {
  init: function() {
    this.appendValueInput("queueVariable")
        .appendField("");      
    this.appendDummyInput()
        .appendField(".getQueue(): Content");
    this.setInputsInline(true);
    this.setOutput(true, null);        
    this.setColour(farbeADTSchlange);
    this.setTooltip("Returns the entire content of the queue as an array.");
    this.setHelpUrl("");
  }
};

Blockly.JavaScript['adt_queue_getQueue'] = function(block) {
  var value_varName = Blockly.JavaScript.valueToCode(block, 'queueVariable', Blockly.JavaScript.ORDER_ATOMIC);  
  var code = value_varName + '.getQueue()';
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};