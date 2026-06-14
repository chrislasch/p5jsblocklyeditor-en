// Basket Grid runtime for polar-wedge beginner exercises.

var BasketGrid = (function () {
  var state = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeDefaultState() {
    return {
      rings: 12,
      columns: 48,
      symmetry: 8,
      localCols: 6,
      fillColor: "#000000",
      backgroundColor: "#ffffff",
      gridVisible: true,
      wrapEdges: true,
      cursor: {
        ring: 0,
        localCol: 0,
      },
      filled: {},
      history: [],
      suppressHistory: false,
      replayTimerId: null,
      centerX: 0,
      centerY: 0,
      radius: 0,
      wedgeStartDeg: -90,
      wedgeAngleDeg: 45,
      ringWidth: 10,
      colAngleDeg: 7.5,
    };
  }

  function ensureState() {
    if (!state) {
      state = makeDefaultState();
    }
    return state;
  }

  function keyForCell(ring, localCol) {
    return ring + "," + localCol;
  }

  function stopReplayTimer() {
    var s = ensureState();
    if (s.replayTimerId !== null) {
      window.clearInterval(s.replayTimerId);
      s.replayTimerId = null;
    }
  }

  function recordCommand(command) {
    var s = ensureState();
    if (s.suppressHistory) {
      return;
    }
    s.history.push(command);
  }

  function hasCell(ring, localCol) {
    var s = ensureState();
    return !!s.filled[keyForCell(ring, localCol)];
  }

  function updateDerivedGeometry(p5sketch) {
    var s = ensureState();
    s.centerX = p5sketch.width / 2;
    s.centerY = p5sketch.height / 2;
    s.radius = 0.45 * Math.min(p5sketch.width, p5sketch.height);
    s.wedgeAngleDeg = 360 / s.symmetry;
    // Keep the active wedge centered at the top (-90 degrees).
    s.wedgeStartDeg = -90 - s.wedgeAngleDeg / 2;
    s.ringWidth = s.radius / s.rings;
    s.colAngleDeg = s.wedgeAngleDeg / s.localCols;
  }

  function drawPolarCell(
    p5sketch,
    ringIdx,
    localColIdx,
    fillColor,
    strokeColor,
    strokeWeight
  ) {
    var s = ensureState();
    var innerR = ringIdx * s.ringWidth;
    var outerR = (ringIdx + 1) * s.ringWidth;
    var a1 = s.wedgeStartDeg + localColIdx * s.colAngleDeg;
    var a2 = a1 + s.colAngleDeg;

    var x1 = p5sketch.cos(a1) * innerR;
    var y1 = p5sketch.sin(a1) * innerR;
    var x2 = p5sketch.cos(a2) * innerR;
    var y2 = p5sketch.sin(a2) * innerR;
    var x3 = p5sketch.cos(a2) * outerR;
    var y3 = p5sketch.sin(a2) * outerR;
    var x4 = p5sketch.cos(a1) * outerR;
    var y4 = p5sketch.sin(a1) * outerR;

    p5sketch.push();
    if (fillColor === null) {
      p5sketch.noFill();
    } else {
      p5sketch.fill(fillColor);
    }
    if (strokeColor === null) {
      p5sketch.noStroke();
    } else {
      p5sketch.stroke(strokeColor);
      p5sketch.strokeWeight(strokeWeight || 1);
    }

    p5sketch.beginShape();
    p5sketch.vertex(x1, y1);
    p5sketch.vertex(x2, y2);
    p5sketch.vertex(x3, y3);
    p5sketch.vertex(x4, y4);
    p5sketch.endShape(p5sketch.CLOSE);
    p5sketch.pop();
  }

  function drawFilledCells(p5sketch) {
    var s = ensureState();
    var keys = Object.keys(s.filled);
    if (keys.length === 0) {
      return;
    }

    var rotationStep = s.wedgeAngleDeg;
    var i;
    var j;

    p5sketch.push();
    p5sketch.translate(s.centerX, s.centerY);
    for (i = 0; i < s.symmetry; i++) {
      p5sketch.push();
      p5sketch.rotate(i * rotationStep);

      for (j = 0; j < keys.length; j++) {
        var parts = keys[j].split(",");
        var ring = parseInt(parts[0], 10);
        var localCol = parseInt(parts[1], 10);
        var cellColor = s.filled[keys[j]];
        // Backward compatible fallback for old boolean-only cell values.
        if (cellColor === true) {
          cellColor = s.fillColor || "#000000";
        }
        drawPolarCell(p5sketch, ring, localCol, cellColor, null, 0);
      }

      p5sketch.pop();
    }
    p5sketch.pop();
  }

  function drawGrid(p5sketch) {
    var s = ensureState();
    var i;

    p5sketch.push();
    p5sketch.translate(s.centerX, s.centerY);

    // Highlight the active wedge.
    p5sketch.noStroke();
    p5sketch.fill(0, 0, 0, 18);
    p5sketch.arc(
      0,
      0,
      2 * s.radius,
      2 * s.radius,
      s.wedgeStartDeg,
      s.wedgeStartDeg + s.wedgeAngleDeg,
      p5sketch.PIE
    );

    // Concentric rings.
    p5sketch.noFill();
    p5sketch.stroke(0, 0, 0, 35);
    p5sketch.strokeWeight(1);
    for (i = 1; i <= s.rings; i++) {
      var r = i * s.ringWidth;
      p5sketch.ellipse(0, 0, 2 * r, 2 * r);
    }

    // Full-grid spokes.
    p5sketch.stroke(0, 0, 0, 28);
    for (i = 0; i < s.columns; i++) {
      var angle = s.wedgeStartDeg + i * (360 / s.columns);
      var x = p5sketch.cos(angle) * s.radius;
      var y = p5sketch.sin(angle) * s.radius;
      p5sketch.line(0, 0, x, y);
    }

    // Active wedge boundary.
    p5sketch.stroke(0, 0, 0, 90);
    p5sketch.strokeWeight(2);
    var x1 = p5sketch.cos(s.wedgeStartDeg) * s.radius;
    var y1 = p5sketch.sin(s.wedgeStartDeg) * s.radius;
    var x2 = p5sketch.cos(s.wedgeStartDeg + s.wedgeAngleDeg) * s.radius;
    var y2 = p5sketch.sin(s.wedgeStartDeg + s.wedgeAngleDeg) * s.radius;
    p5sketch.line(0, 0, x1, y1);
    p5sketch.line(0, 0, x2, y2);

    // Center marker.
    p5sketch.noStroke();
    p5sketch.fill(0, 0, 0, 110);
    p5sketch.circle(0, 0, 4);

    p5sketch.pop();
  }

  function drawCursor(p5sketch) {
    var s = ensureState();
    var centerRadius = (s.cursor.ring + 0.5) * s.ringWidth;
    var centerAngle =
      s.wedgeStartDeg + (s.cursor.localCol + 0.5) * s.colAngleDeg;
    var x = p5sketch.cos(centerAngle) * centerRadius;
    var y = p5sketch.sin(centerAngle) * centerRadius;

    p5sketch.push();
    p5sketch.translate(s.centerX, s.centerY);
    p5sketch.noStroke();
    p5sketch.fill("#FFD400");
    p5sketch.circle(x, y, 10);
    p5sketch.pop();
  }

  function render(p5sketch) {
    var s = ensureState();
    updateDerivedGeometry(p5sketch);

    p5sketch.push();
    p5sketch.background(s.backgroundColor || "#ffffff");
    drawFilledCells(p5sketch);
    if (s.gridVisible) {
      drawGrid(p5sketch);
      drawCursor(p5sketch);
    }
    p5sketch.pop();
  }

  function resetCursorAndCells() {
    var s = ensureState();
    s.cursor.ring = 0;
    s.cursor.localCol = 0;
    s.filled = {};
  }

  function applySetGrid(p5sketch, rings, columns, symmetry, backgroundColor) {
    var s = ensureState();
    var nextRings = Math.max(1, parseInt(rings, 10) || 1);
    var nextColumns = Math.max(1, parseInt(columns, 10) || 1);
    var nextSymmetry = Math.max(1, parseInt(symmetry, 10) || 1);
    var localColsRaw = nextColumns / nextSymmetry;
    var nextLocalCols = Math.max(1, Math.floor(localColsRaw));

    if (Math.abs(localColsRaw - Math.round(localColsRaw)) > 0.000001) {
      console.warn(
        "BasketGrid: columns should be divisible by symmetry. Using local columns:",
        nextLocalCols
      );
    }

    s.rings = nextRings;
    s.columns = nextColumns;
    s.symmetry = nextSymmetry;
    s.localCols = nextLocalCols;
    s.fillColor = "#000000";
    if (backgroundColor !== undefined && backgroundColor !== null) {
      s.backgroundColor = backgroundColor;
    } else {
      // Capture the canvas background when grid mode starts.
      var sampledColor = p5sketch.get(1, 1);
      if (sampledColor && sampledColor.length >= 3) {
        s.backgroundColor = [
          sampledColor[0],
          sampledColor[1],
          sampledColor[2],
          sampledColor.length >= 4 ? sampledColor[3] : 255,
        ];
      } else {
        s.backgroundColor = "#ffffff";
      }
    }
    s.gridVisible = true;
    resetCursorAndCells();
    render(p5sketch);
  }

  function applyShowGrid(p5sketch) {
    var s = ensureState();
    s.gridVisible = true;
    render(p5sketch);
  }

  function applyHideGrid(p5sketch) {
    var s = ensureState();
    s.gridVisible = false;
    render(p5sketch);
  }

  function applySetFillColor(p5sketch, colorString) {
    var s = ensureState();
    s.fillColor = colorString;
    render(p5sketch);
  }

  function applyFillCell(p5sketch) {
    var s = ensureState();
    s.filled[keyForCell(s.cursor.ring, s.cursor.localCol)] = s.fillColor;
    render(p5sketch);
  }

  function applyMove(p5sketch, direction) {
    var s = ensureState();

    if (direction === "right") {
      s.cursor.localCol += 1;
    } else if (direction === "left") {
      s.cursor.localCol -= 1;
    } else if (direction === "up") {
      s.cursor.ring += 1;
    } else if (direction === "down") {
      s.cursor.ring -= 1;
    }

    if (s.wrapEdges) {
      s.cursor.localCol =
        ((s.cursor.localCol % s.localCols) + s.localCols) % s.localCols;
      s.cursor.ring = ((s.cursor.ring % s.rings) + s.rings) % s.rings;
    } else {
      s.cursor.localCol = clamp(s.cursor.localCol, 0, s.localCols - 1);
      s.cursor.ring = clamp(s.cursor.ring, 0, s.rings - 1);
    }
    render(p5sketch);
  }

  function applyMoveAndFill(p5sketch, direction) {
    applyMove(p5sketch, direction);
    applyFillCell(p5sketch);
  }

  function applySetWrapEdges(p5sketch, enabled) {
    var s = ensureState();
    s.wrapEdges = !!enabled;
    render(p5sketch);
  }

  function applyRecordedCommand(p5sketch, command) {
    if (command.type === "setGrid") {
      applySetGrid(
        p5sketch,
        command.rings,
        command.columns,
        command.symmetry,
        command.backgroundColor
      );
    } else if (command.type === "showGrid") {
      applyShowGrid(p5sketch);
    } else if (command.type === "hideGrid") {
      applyHideGrid(p5sketch);
    } else if (command.type === "setFillColor") {
      applySetFillColor(p5sketch, command.color);
    } else if (command.type === "move") {
      applyMove(p5sketch, command.direction);
    } else if (command.type === "fillCell") {
      applyFillCell(p5sketch);
    } else if (command.type === "moveAndFill") {
      applyMoveAndFill(p5sketch, command.direction);
    } else if (command.type === "setWrapEdges") {
      applySetWrapEdges(p5sketch, command.enabled);
    }
  }

  return {
    setGrid: function (p5sketch, rings, columns, symmetry) {
      var s = ensureState();
      stopReplayTimer();
      applySetGrid(p5sketch, rings, columns, symmetry);
      if (!s.suppressHistory) {
        s.history = [
          {
            type: "setGrid",
            rings: rings,
            columns: columns,
            symmetry: symmetry,
            backgroundColor: s.backgroundColor,
          },
        ];
      }
    },

    showGrid: function (p5sketch) {
      applyShowGrid(p5sketch);
      recordCommand({ type: "showGrid" });
    },

    hideGrid: function (p5sketch) {
      applyHideGrid(p5sketch);
      recordCommand({ type: "hideGrid" });
    },

    setFillColor: function (p5sketch, colorString) {
      applySetFillColor(p5sketch, colorString);
      recordCommand({ type: "setFillColor", color: colorString });
    },

    setWrapEdges: function (p5sketch, enabled) {
      applySetWrapEdges(p5sketch, enabled);
      recordCommand({ type: "setWrapEdges", enabled: !!enabled });
    },

    fillCell: function (p5sketch) {
      applyFillCell(p5sketch);
      recordCommand({ type: "fillCell" });
    },

    move: function (p5sketch, direction) {
      applyMove(p5sketch, direction);
      recordCommand({ type: "move", direction: direction });
    },

    moveAndFill: function (p5sketch, direction) {
      applyMoveAndFill(p5sketch, direction);
      recordCommand({ type: "moveAndFill", direction: direction });
    },

    clear: function (p5sketch) {
      stopReplayTimer();
      resetCursorAndCells();
      render(p5sketch);
    },

    replay: function (p5sketch, stepMs) {
      var s = ensureState();
      var delay = Math.max(10, parseInt(stepMs, 10) || 150);
      var commands = s.history.slice();
      var index = 0;

      stopReplayTimer();
      if (commands.length === 0) {
        return;
      }

      s.suppressHistory = true;
      s.replayTimerId = window.setInterval(function () {
        if (index >= commands.length) {
          stopReplayTimer();
          s.suppressHistory = false;
          return;
        }
        applyRecordedCommand(p5sketch, commands[index]);
        index += 1;
        if (index >= commands.length) {
          stopReplayTimer();
          s.suppressHistory = false;
        }
      }, delay);
    },

    render: function (p5sketch) {
      render(p5sketch);
    },

    isFilled: function (ring, localCol) {
      return hasCell(ring, localCol);
    },
  };
})();
