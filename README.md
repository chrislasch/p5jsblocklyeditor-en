## Project description

The three editors **p5.js-Blockly-Editor**, **p5.js-Flems-Editor**, and **Blockly-Trace-Editor** are developed for use in [computer science classes](https://www.informatik.gym-wst.de) at [Gymnasium Westerstede](https://www.gymnasium-westerstede.de).

For programming beginners, working in text mode is difficult. In class, a lot of time is spent hunting for typos or syntax errors, and it is easy to lose your bearings among the many available statements. In a **block editor**, typos do not matter, and you find possible statements organized by category in the toolbox. In recent years, many block-based programming environments have been developed, such as [Scratch](https://scratch.mit.edu/) or [Open Roberta](https://lab.open-roberta.org/).

In computer science at this school, students program in text mode during the qualification phase (upper secondary), while in lower secondary, block programming can ease the introduction to programming. However, the transition from block programming to text programming is often abrupt, because Scratch or Open Roberta, for example, are closed systems: the programs you write can only run inside their given infrastructure.

This project develops three editors in which block and text programming are available side by side, and the generated JavaScript programs can also be run in other environments. That way, class can move from block programming to text programming without a sudden break.

**Visual programming** can be motivating for beginners, because changes to the program become visible immediately. Motivation increases further when you can steer a small turtle with code. Visual programming is much easier with the JavaScript library [p5.js](https://p5js.org/), which is integrated in this project. For block programming, this project uses the block editor [Blockly](https://github.com/google/blockly).

![](b01.jpg)

In the **p5.js-Blockly-Editor**, after you build a block program, clicking the “Text Editor” button generates JavaScript from the blocks and opens it in a text editor where it can be run. You can then continue editing the program in the text editor. The text editor is based on the [Flems sandbox](https://github.com/porsager/flems).

![](b02.jpg)

In upper-secondary computer science, algorithms are often given as program code or as a structure diagram (Nassi–Shneiderman). Based on a given algorithm, students fill in a trace table with values. In the **Blockly-Trace-Editor**, algorithms can be built with blocks and executed step by step. During step-by-step execution, values can be entered into a trace table.

A **structure diagram** can be generated automatically from the block program. The structure diagram editor is built on the [Structogram Viewer](https://github.com/nigjo/structogramview) library. JavaScript code can be generated from the block program. The generated JS code can be run in the text editor, and the trace table can be printed to the console.

![](b03.jpg)

---

### Development

The editors are implemented as static client applications without an application framework or package manager. No cookies are set, and no data is stored on the server.

The libraries used are linked statically into the project and are updated manually on an irregular basis.

---

### Tutorial

In each editor, clicking the button with the question mark opens small example programs.

---

### Libraries used

- [Blockly](https://github.com/google/blockly) - [Apache License](https://github.com/google/blockly/blob/master/LICENSE)
- [p5.js](https://p5js.org/) - [GNU LGPL](https://github.com/processing/p5.js/blob/main/license.txt)
- [Flems](https://github.com/porsager/flems) - [DWTFYWTP License](https://github.com/porsager/flems/blob/master/LICENSE)
- [p.turtle](https://github.com/jan-martinek/p.turtle) - [MIT License](https://github.com/jan-martinek/p.turtle/blob/master/LICENSE)
- [Bootstrap](https://getbootstrap.com/) - [MIT License](https://github.com/twbs/bootstrap/blob/main/LICENSE)
- [JQuery](https://jquery.com/) - [MIT License](https://jquery.org/license/)
- [Prism](https://prismjs.com/) - [MIT License](https://github.com/PrismJS/prism/blob/master/LICENSE)
- [LZ_String](https://github.com/pieroxy/lz-string/) - [MIT License](https://github.com/pieroxy/lz-string/blob/master/LICENSE)
- [JS-Interpreter](https://github.com/NeilFraser/JS-Interpreter) - [Apache License](https://github.com/NeilFraser/JS-Interpreter/blob/master/LICENSE)
- [Acorn JS Parser](https://github.com/acornjs/acorn) - [MIT License](https://github.com/acornjs/acorn/blob/master/acorn/LICENSE)
- [Structogram Viewer](https://github.com/nigjo/structogramview) - [Apache License](https://github.com/nigjo/structogramview/blob/main/LICENSE)
- [Dom-to-Image](https://github.com/tsayen/dom-to-image) - [MIT License](https://github.com/tsayen/dom-to-image/blob/master/LICENSE)
- [Bootstrap Table](https://bootstrap-table.com/) - [MIT License](https://github.com/wenzhixin/bootstrap-table/blob/master/LICENSE)
