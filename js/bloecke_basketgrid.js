// Basket Grid blocks and JavaScript generators.

var farbeBasket = "#8B5A2B";

Blockly.Blocks["basket_set_grid"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Set polar grid")
      .appendField("rings")
      .appendField(new Blockly.FieldNumber(12, 1, 200, 1), "rings")
      .appendField("columns")
      .appendField(new Blockly.FieldNumber(48, 1, 360, 1), "columns")
      .appendField("symmetry")
      .appendField(new Blockly.FieldNumber(8, 1, 360, 1), "symmetry");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip(
      "Sets rings, full columns, and symmetry for one programmable wedge."
    );
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_set_grid"] = function (block) {
  var rings = block.getFieldValue("rings");
  var columns = block.getFieldValue("columns");
  var symmetry = block.getFieldValue("symmetry");
  return (
    "BasketGrid.setGrid(p5sketch, " +
    rings +
    ", " +
    columns +
    ", " +
    symmetry +
    ");\n"
  );
};

Blockly.Blocks["basket_show_grid"] = {
  init: function () {
    this.appendDummyInput().appendField("Show grid");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip("Shows the construction grid and cursor.");
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_show_grid"] = function () {
  return "BasketGrid.showGrid(p5sketch);\n";
};

Blockly.Blocks["basket_hide_grid"] = {
  init: function () {
    this.appendDummyInput().appendField("Hide grid");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip("Hides the construction grid and cursor.");
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_hide_grid"] = function () {
  return "BasketGrid.hideGrid(p5sketch);\n";
};

Blockly.Blocks["basket_set_fill_color"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Set fill color")
      .appendField(new Blockly.FieldColour("#000000"), "farbe");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip("Sets the color used for filled basket cells.");
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_set_fill_color"] = function (block) {
  var color = block.getFieldValue("farbe");
  return 'BasketGrid.setFillColor(p5sketch, "' + color + '");\n';
};

Blockly.Blocks["basket_wrap_edges"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Wrap edges")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "wrapOff");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip(
      "Edge wrapping is on by default. Check to turn off wrapping."
    );
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_wrap_edges"] = function (block) {
  var wrapOff = block.getFieldValue("wrapOff") === "TRUE";
  return "BasketGrid.setWrapEdges(p5sketch, " + !wrapOff + ");\n";
};

Blockly.Blocks["basket_animate"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Animate basket drawing every")
      .appendField(new Blockly.FieldNumber(150, 10, 5000, 10), "step_ms")
      .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip("Replays basket drawing steps with a delay.");
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_animate"] = function (block) {
  var stepMs = block.getFieldValue("step_ms");
  return "BasketGrid.replay(p5sketch, " + stepMs + ");\n";
};

function makeMoveBlock(typeName, labelText, direction) {
  Blockly.Blocks[typeName] = {
    init: function () {
      this.appendDummyInput().appendField(labelText);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(farbeBasket);
      this.setTooltip("Moves the basket cursor by one stitch.");
      this.setHelpUrl("");
    },
  };

  Blockly.JavaScript[typeName] = function () {
    return 'BasketGrid.move(p5sketch, "' + direction + '");\n';
  };
}

function makeMoveFillBlock(typeName, labelText, direction) {
  Blockly.Blocks[typeName] = {
    init: function () {
      this.appendDummyInput().appendField(labelText);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(farbeBasket);
      this.setTooltip("Moves first, then fills the new basket cell.");
      this.setHelpUrl("");
    },
  };

  Blockly.JavaScript[typeName] = function () {
    return 'BasketGrid.moveAndFill(p5sketch, "' + direction + '");\n';
  };
}

Blockly.Blocks["basket_fill"] = {
  init: function () {
    this.appendDummyInput().appendField("Fill in");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(farbeBasket);
    this.setTooltip("Fills the current basket cell.");
    this.setHelpUrl("");
  },
};

Blockly.JavaScript["basket_fill"] = function () {
  return "BasketGrid.fillCell(p5sketch);\n";
};

makeMoveBlock("basket_move_right", "Move 1 stitch right", "right");
makeMoveBlock("basket_move_left", "Move 1 stitch left", "left");
makeMoveBlock("basket_move_up", "Move 1 stitch up", "up");
makeMoveBlock("basket_move_down", "Move 1 stitch down", "down");

makeMoveFillBlock(
  "basket_move_fill_right",
  "Move 1 stitch right & fill",
  "right"
);
makeMoveFillBlock(
  "basket_move_fill_left",
  "Move 1 stitch left & fill",
  "left"
);
makeMoveFillBlock(
  "basket_move_fill_up",
  "Move 1 stitch up & fill",
  "up"
);
makeMoveFillBlock(
  "basket_move_fill_down",
  "Move 1 stitch down & fill",
  "down"
);
