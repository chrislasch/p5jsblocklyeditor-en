#!/usr/bin/env python3
"""
parser.py -- Blockly .p5xml -> worksheet IR (JSON)

XML -> intermediate representation for the polar "graph paper programming"
worksheet generator. Pure stdlib.

The block vocabulary and every semantic choice below is traceable to the app
source (read-only for us):
    js/bloecke_basketgrid.js   -- block definitions + JS generators
    js/runtime_basketgrid.js   -- BasketGrid runtime (geometry + cursor model)
    js/toolbox.js              -- which blocks are exposed to learners
    js/bloecke_p5funktionen.js -- the `setup` block (canvas fields, `do` slot)
    js/bloecke_aussehen.js     -- `background_pick`
Source references are cited inline as `file:line`.

Usage:
    python parser.py sketch.p5xml [more.p5xml ...]
    # writes sketch.ir.json next to each input and prints a text preview
"""

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {"b": "https://developers.google.com/blockly/xml"}

# --- Block vocabulary (confirmed against the repo) --------------------------
#
# Compound "move then fill" blocks. All four directions exist and are wired to
# BasketGrid.moveAndFill(dir). See bloecke_basketgrid.js:170-185 (factory) and
# :207-226 (registration of right/left/up/down).
MOVE_FILL = {
    "basket_move_fill_right": "right",
    "basket_move_fill_left":  "left",
    "basket_move_fill_up":    "up",
    "basket_move_fill_down":  "down",
}

# Plain moves (no fill), wired to BasketGrid.move(dir).
# bloecke_basketgrid.js:153-168 (factory) and :202-205 (registration).
MOVE_ONLY = {
    "basket_move_right": "right",
    "basket_move_left":  "left",
    "basket_move_up":    "up",
    "basket_move_down":  "down",
}

# Blocks that affect the drawing but produce no atomic worksheet step and are
# not errors. show/hide grid only toggle the construction overlay
# (runtime_basketgrid.js:326-336); animate just replays history with a delay
# (bloecke_basketgrid.js:134-151 -> BasketGrid.replay). The printed worksheet
# always shows the grid and is static, so these are intentionally ignored.
NOOP_BLOCKS = {"basket_show_grid", "basket_hide_grid", "basket_animate"}

# Glyphs for the text preview (the SVG renderer has its own vector glyphs).
GLYPHS = {"right": "R", "left": "L", "up": "U", "down": "D", "fill": "*"}


def _field(block, name):
    el = block.find(f'b:field[@name="{name}"]', NS)
    return el.text if el is not None else None


def _next_block(block):
    nxt = block.find("b:next", NS)
    return nxt.find("b:block", NS) if nxt is not None else None


def _literal_number(value_el):
    """Return the int value of a math_number plugged into a <value>, else None.

    Only literal numbers are resolvable at parse time; variables/expressions
    are not (the worksheet is a static unroll)."""
    if value_el is None:
        return None
    num = value_el.find('b:block[@type="math_number"]', NS)
    if num is None:
        num = value_el.find('b:shadow[@type="math_number"]', NS)
    if num is None:
        return None
    try:
        return int(float(_field(num, "NUM")))
    except (TypeError, ValueError):
        return None


def _repeat_count(block):
    """controls_repeat_ext count from its TIMES value. toolbox.js:784-790."""
    return _literal_number(block.find('b:value[@name="TIMES"]', NS))


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def _start_bounds(ir, ring, col):
    """Clamp a 0-based start (ring, col) to the current grid if one is known.
    Mirrors applySetStart's clamp, runtime_basketgrid.js:356-357."""
    grid = ir.get("grid")
    if grid:
        ring = _clamp(ring, 0, max(0, grid["rings"] - 1))
        col = _clamp(col, 0, max(0, grid["columns"] - 1))
    else:
        ring = max(0, ring)
        col = max(0, col)
    return {"ring": ring, "col": col}


def parse_chain(block, ir, drawing_started=False):
    """Walk a <next>-linked chain, appending atomic steps to ir['steps'].
    Returns whether drawing has started (affects setcolor / setstart folding)."""
    while block is not None:
        btype = block.get("type")

        if btype == "background_pick":
            # bloecke_aussehen.js:37-56 -- field name is "farbe".
            ir["background"] = _field(block, "farbe")

        elif btype == "basket_set_grid":
            # bloecke_basketgrid.js:5-39. Field "columns" is columns PER WEDGE
            # (localCols); total columns = columns * symmetry. The center ring
            # is always empty (runtime updateDerivedGeometry:79).
            ir["grid"] = {
                "rings": int(_field(block, "rings")),
                "columns": int(_field(block, "columns")),
                "symmetry": int(_field(block, "symmetry")),
            }
            # setGrid resets the fill color to black (runtime:304). If no
            # set_fill_color follows, cells are black.
            ir["initial_fill_color"] = "#000000"
            # Grid reset moves the cursor home (runtime resetCursorAndCells:280).
            ir["start"] = {"ring": 0, "col": 0}

        elif btype == "basket_set_fill_color":
            # bloecke_basketgrid.js:71-87 -- field "farbe".
            color = _field(block, "farbe")
            if drawing_started:
                # Mid-program color change. The app supports per-cell colors
                # (runtime drawFilledCells:150-155), but the worksheet has a
                # single fill glyph, so this cannot be represented. Record it
                # and warn (SPEC S3.1).
                ir["steps"].append({"op": "setcolor", "color": color})
                ir["warnings"].append(
                    f"mid-program fill-color change to {color}: the worksheet "
                    f"has one fill glyph and cannot show multiple colors"
                )
            else:
                ir["initial_fill_color"] = color

        elif btype == "basket_set_start":
            # bloecke_basketgrid.js:89-112. Fields "ring"/"column" are 1-based
            # in the UI; the generator subtracts 1 and floors at 0.
            ring = max(0, (_literal_field_int(block, "ring") or 1) - 1)
            col = max(0, (_literal_field_int(block, "column") or 1) - 1)
            if drawing_started:
                # A cursor teleport after drawing began: no worksheet glyph.
                ir["steps"].append({"op": "setstart", "ring": ring, "col": col})
                ir["warnings"].append(
                    "mid-program 'Start here' (cursor jump) has no worksheet "
                    "glyph; recorded as a setstart step for the answer key"
                )
            else:
                ir["start"] = _start_bounds(ir, ring, col)

        elif btype == "basket_wrap_edges":
            # bloecke_basketgrid.js:114-132. Checkbox "wrapOff": TRUE turns
            # wrapping OFF. Wrapping is ON by default (runtime makeDefaultState
            # wrapEdges:true, :19; applyMove wrap vs clamp, :380-387).
            wrap_off = (_field(block, "wrapOff") == "TRUE")
            new_wrap = not wrap_off
            if drawing_started and new_wrap != ir["wrap_edges"]:
                ir["warnings"].append(
                    "wrap-edges toggled mid-program; the answer key assumes a "
                    "single boundary mode for the whole run"
                )
            ir["wrap_edges"] = new_wrap

        elif btype == "basket_fill":
            # bloecke_basketgrid.js:187-200 -> BasketGrid.fillCell.
            ir["steps"].append({"op": "fill"})
            drawing_started = True

        elif btype in MOVE_FILL:
            # moveAndFill = move then fill (runtime:391-394): two atomic steps.
            d = MOVE_FILL[btype]
            ir["steps"].append({"op": "move", "dir": d})
            ir["steps"].append({"op": "fill"})
            drawing_started = True

        elif btype in MOVE_ONLY:
            ir["steps"].append({"op": "move", "dir": MOVE_ONLY[btype]})
            drawing_started = True

        elif btype in NOOP_BLOCKS:
            pass  # construction overlay / animation: irrelevant to a static sheet

        elif btype == "controls_repeat_ext":
            # In the toolbox (toolbox.js:783-790). Unroll literal counts.
            count = _repeat_count(block)
            body = block.find('b:statement[@name="DO"]/b:block', NS)
            if count is None or body is None:
                ir["warnings"].append(
                    "repeat block with non-literal count or empty body: skipped"
                )
            else:
                for _ in range(count):
                    drawing_started = parse_chain(body, ir, drawing_started)

        elif btype == "controls_for":
            # In the toolbox (toolbox.js:792-808). Basket blocks take no args,
            # so unrolling by iteration count is faithful. Unroll literal bounds.
            frm = _literal_number(block.find('b:value[@name="FROM"]', NS))
            to = _literal_number(block.find('b:value[@name="TO"]', NS))
            by = _literal_number(block.find('b:value[@name="BY"]', NS))
            body = block.find('b:statement[@name="DO"]/b:block', NS)
            if None in (frm, to) or body is None:
                ir["warnings"].append(
                    "for-loop with non-literal bounds or empty body: skipped"
                )
            else:
                step = by if by else 1
                iters = 0
                if step > 0:
                    iters = max(0, (to - frm) // step + 1)
                elif step < 0:
                    iters = max(0, (frm - to) // (-step) + 1)
                for _ in range(iters):
                    drawing_started = parse_chain(body, ir, drawing_started)

        elif btype in ("controls_whileUntil", "controls_if",
                       "controls_flow_statements"):
            # Present in the toolbox but not statically unrollable (runtime
            # dependent). Warn loudly rather than silently mis-render.
            ir["warnings"].append(
                f"{btype}: control flow cannot be unrolled to a static "
                f"worksheet; body ignored -- simplify the sketch"
            )

        elif btype == "variables_get":
            pass  # canvas variable reference; irrelevant to the worksheet

        else:
            ir["warnings"].append(f"unhandled block type: {btype}")

        block = _next_block(block)
    return drawing_started


def _literal_field_int(block, name):
    """Int value of a direct <field name=...> on a block, or None."""
    txt = _field(block, name)
    try:
        return int(float(txt))
    except (TypeError, ValueError):
        return None


def parse_file(path):
    path = Path(path)
    root = ET.parse(path).getroot()

    setup = root.find('b:block[@type="setup"]', NS)
    if setup is None:
        raise ValueError(f"{path.name}: no <block type='setup'> found")

    ir = {
        "source": path.name,
        "canvas": {
            # setup block fields, bloecke_p5funktionen.js:11-13.
            "width": int(_field(setup, "canvasBreite")),
            "height": int(_field(setup, "canvasHoehe")),
        },
        "background": None,
        "grid": None,
        # Defaults mirror the runtime's initial state:
        "initial_fill_color": "#000000",   # runtime makeDefaultState:14 / :304
        "start": {"ring": 0, "col": 0},    # runtime cursor default :20-23
        "wrap_edges": True,                # runtime makeDefaultState:19
        "steps": [],
        "warnings": [],
    }

    first = setup.find('b:statement[@name="do"]/b:block', NS)
    if first is None:
        ir["warnings"].append("setup has an empty 'do' body: no steps")
    parse_chain(first, ir)

    if ir["grid"] is None:
        ir["warnings"].append(
            "no basket_set_grid block: grid geometry is undefined"
        )

    n = len(ir["steps"])
    if n > 100:
        ir["warnings"].append(
            f"{n} atomic steps exceeds the 100-cell program grid (SPEC S4)"
        )
    return ir


def preview(ir):
    """Text-mode rendering of the Program panel for quick validation."""
    glyphs = []
    for s in ir["steps"]:
        if s["op"] == "move":
            glyphs.append(GLYPHS[s["dir"]])
        elif s["op"] == "fill":
            glyphs.append(GLYPHS["fill"])
        else:
            glyphs.append("?")  # setcolor / setstart / other
    lines = [
        f"{ir['source']}  grid={ir['grid']}  start={ir['start']}  "
        f"wrap={ir['wrap_edges']}  steps={len(glyphs)}"
    ]
    for row in range(0, len(glyphs), 10):
        label = f"{row:>3} "
        lines.append(label + " ".join(glyphs[row:row + 10]))
    for w in ir["warnings"]:
        lines.append(f"  ! {w}")
    return "\n".join(lines)


def humanize_title(filename):
    """basketGrid_lightning_00.p5xml -> 'Lightning'"""
    stem = Path(filename).stem
    stem = re.sub(r"^basketGrid[_-]*", "", stem, flags=re.I)
    stem = re.sub(r"[_-]*\d+$", "", stem)
    return stem.replace("_", " ").strip().title() or stem


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    for arg in sys.argv[1:]:
        ir = parse_file(arg)
        ir["title"] = humanize_title(arg)
        out = Path(arg).with_suffix(".ir.json")
        # Inputs may live in a read-only dir; fall back to cwd.
        try:
            out.write_text(json.dumps(ir, indent=2))
        except OSError:
            out = Path.cwd() / out.name
            out.write_text(json.dumps(ir, indent=2))
        print(preview(ir))
        print(f"  -> {out}\n")
