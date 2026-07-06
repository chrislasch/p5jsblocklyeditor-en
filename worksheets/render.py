#!/usr/bin/env python3
"""
render.py -- worksheet IR -> two SVGs (pattern panel + program panel)

Geometry is ported *verbatim* from the BasketGrid runtime so the printed
pattern matches what students see in the app. Every constant below cites its
source as `runtime_basketgrid.js:LINE` (the file read from the app working
tree). Angles are in DEGREES (the app runs `angleMode(DEGREES)`,
bloecke_p5funktionen.js:28); screen y points down, so increasing angle sweeps
clockwise.

Pure functions where practical: geometry + simulation are side-effect-free and
return plain data; only the `render_*` builders touch svgwrite.

Usage:
    python render.py INPUT[.p5xml|.ir.json] [--out DIR] [--mode key|blank-program|blank-pattern]
    # writes <stem>.pattern.svg and <stem>.program.svg
"""

import argparse
import json
import math
import sys
from pathlib import Path

import svgwrite

import parser as p5parser  # worksheets/parser.py


# --------------------------------------------------------------------------
# Palette / style constants
# --------------------------------------------------------------------------
# Grid line colors mirror drawGrid (runtime_basketgrid.js:204, 212): black at
# low alpha. Values are alpha/255 from the source.
RING_STROKE = "#000000"
RING_OPACITY = 35 / 255          # runtime:204  stroke(0,0,0,35)
SPOKE_STROKE = "#000000"
SPOKE_OPACITY = 28 / 255         # runtime:212  stroke(0,0,0,28)

# Dashed red symmetry boundaries (runtime:223-238). The app draws the active
# wedge's two borders strong and the rest faded.
BOUNDARY_RED = "#ff0000"
BOUNDARY_ACTIVE_OPACITY = 204 / 255   # runtime:232  stroke(255,0,0,204)
BOUNDARY_FADED_OPACITY = 70 / 255     # runtime:234  stroke(255,0,0,70)
BOUNDARY_DASH = "8,6"                 # runtime:225  setLineDash([8,6])
BOUNDARY_WIDTH = 2                    # runtime:224  strokeWeight(2)

# Non-active wedges are dimmed toward the background (runtime:196-198,
# rgba(bg, 0.33)). This is what makes the active wedge -- the one the student
# programs -- stand out; reference.png confirms it should be kept.
WASH_OPACITY = 0.33                   # runtime:197

# Worksheet-template additions (not in the app, but in reference.png):
START_STAR_FILL = "#FFD400"   # cursor yellow, runtime:261  fill("#FFD400")
START_STAR_STROKE = "#5a4a00"

GLYPH_COLOR = "#111111"
STAR_STROKE = "#7a5b00"

MOVE_DIRS = ("right", "left", "up", "down")

# Program-panel legend (order matches reference.png), with two-line captions.
LEGEND = [
    ("move", "right", ["Move One Cell", "RIGHT"]),
    ("move", "down",  ["Move One Cell", "DOWN"]),
    ("move", "left",  ["Move One Cell", "LEFT"]),
    ("move", "up",    ["Move One Cell", "UP"]),
    ("fill", None,    ["Fill-In Square", "with Color"]),
]

PROGRAM_CAPACITY = 100  # 10x10 grid (SPEC S4)


# --------------------------------------------------------------------------
# Geometry (port of updateDerivedGeometry + drawPolarCell + drawCursor)
# --------------------------------------------------------------------------
def derive_geometry(ir):
    """Port of updateDerivedGeometry (runtime_basketgrid.js:70-81)."""
    w = ir["canvas"]["width"]
    h = ir["canvas"]["height"]
    grid = ir["grid"]
    rings = grid["rings"]
    local_cols = grid["columns"]          # columns PER WEDGE (localCols)
    symmetry = grid["symmetry"]

    radius = 0.45 * min(w, h)             # runtime:74
    wedge_angle = 360.0 / symmetry        # runtime:76
    wedge_start = -90.0 - wedge_angle / 2 # runtime:77  (active wedge centered at top)
    ring_width = radius / (rings + 1)     # runtime:79  (+1 = empty center ring)
    col_angle = wedge_angle / local_cols  # runtime:80

    return {
        "cx": w / 2.0, "cy": h / 2.0,      # runtime:72-73
        "radius": radius,
        "rings": rings,
        "local_cols": local_cols,
        "symmetry": symmetry,
        "total_columns": local_cols * symmetry,   # runtime applySetGrid:298
        "wedge_angle": wedge_angle,
        "wedge_start": wedge_start,
        "ring_width": ring_width,
        "col_angle": col_angle,
    }


def _polar(cx, cy, r, angle_deg):
    """(r, angle) -> (x, y). p5 cos/sin in DEGREES; y increases downward."""
    a = math.radians(angle_deg)
    return (cx + r * math.cos(a), cy + r * math.sin(a))


def cell_polygon(geo, ring, col, angle_offset=0.0):
    """Four straight-edged corners of cell (ring, col), optionally rotated by
    angle_offset degrees (for symmetry copies). Port of drawPolarCell:83-105 --
    note the app uses vertex() (straight chords), NOT arcs, for cells."""
    rw = geo["ring_width"]
    inner_r = (ring + 1) * rw             # runtime:93  logical ring 0 = 2nd physical ring
    outer_r = (ring + 2) * rw             # runtime:94
    a1 = geo["wedge_start"] + col * geo["col_angle"] + angle_offset   # runtime:95
    a2 = a1 + geo["col_angle"]            # runtime:96
    cx, cy = geo["cx"], geo["cy"]
    return [
        _polar(cx, cy, inner_r, a1),
        _polar(cx, cy, inner_r, a2),
        _polar(cx, cy, outer_r, a2),
        _polar(cx, cy, outer_r, a1),
    ]


def cell_center(geo, ring, col):
    """Center point of a cell (for the start marker). Port of drawCursor:250-254."""
    rw = geo["ring_width"]
    r = (ring + 1.5) * rw                                     # runtime:250
    ang = geo["wedge_start"] + (col + 0.5) * geo["col_angle"] # runtime:251-252
    return _polar(geo["cx"], geo["cy"], r, ang)


# --------------------------------------------------------------------------
# Program simulation (port of applyMove / applyFillCell / setStart / setColor)
# --------------------------------------------------------------------------
def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def simulate(ir):
    """Replay the atomic steps to get filled cells (base wedge only), honoring
    wrap vs. clamp. Returns (filled, trail) where:
      filled = dict {(ring, col): color}   -- last write wins (runtime:363)
      trail  = list of (ring, col) cursor positions after each step (for QA)
    Ports applyMove:367-389, applyFillCell:361-365, applySetStart:344-359."""
    grid = ir["grid"]
    rings, local_cols = grid["rings"], grid["columns"]
    wrap = ir["wrap_edges"]
    ring = ir["start"]["ring"]
    col = ir["start"]["col"]
    color = ir["initial_fill_color"]
    filled = {}
    trail = [(ring, col)]

    for step in ir["steps"]:
        op = step["op"]
        if op == "move":
            d = step["dir"]
            if d == "right":
                col += 1
            elif d == "left":
                col -= 1
            elif d == "up":
                ring += 1
            elif d == "down":
                ring -= 1
            if wrap:                       # runtime:380-383  modulo both axes
                col = ((col % local_cols) + local_cols) % local_cols
                ring = ((ring % rings) + rings) % rings
            else:                          # runtime:385-386  clamp both axes
                col = _clamp(col, 0, local_cols - 1)
                ring = _clamp(ring, 0, rings - 1)
        elif op == "fill":
            filled[(ring, col)] = color    # runtime:363
        elif op == "setcolor":
            color = step["color"]
        elif op == "setstart":             # mid-program teleport (clamped)
            ring = _clamp(step["ring"], 0, rings - 1)
            col = _clamp(step["col"], 0, local_cols - 1)
        trail.append((ring, col))

    return filled, trail


# --------------------------------------------------------------------------
# SVG helpers
# --------------------------------------------------------------------------
def _star_points(cx, cy, r_out, r_in, n=5, rot_deg=-90):
    pts = []
    for k in range(2 * n):
        ang = math.radians(rot_deg + k * 180.0 / n)
        r = r_out if k % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def _annular_sector_path(cx, cy, r_inner, r_outer, a_start, a_end):
    """SVG path for an annular sector spanning [a_start, a_end] degrees
    (increasing = clockwise on screen -> SVG sweep flag 1)."""
    p1 = _polar(cx, cy, r_inner, a_start)
    p2 = _polar(cx, cy, r_outer, a_start)
    p3 = _polar(cx, cy, r_outer, a_end)
    p4 = _polar(cx, cy, r_inner, a_end)
    large = 1 if (a_end - a_start) % 360 > 180 else 0
    return (
        f"M {p1[0]:.3f},{p1[1]:.3f} "
        f"L {p2[0]:.3f},{p2[1]:.3f} "
        f"A {r_outer:.3f},{r_outer:.3f} 0 {large} 1 {p3[0]:.3f},{p3[1]:.3f} "
        f"L {p4[0]:.3f},{p4[1]:.3f} "
        f"A {r_inner:.3f},{r_inner:.3f} 0 {large} 0 {p1[0]:.3f},{p1[1]:.3f} Z"
    )


def _draw_arrow(dwg, parent, cx, cy, size, direction, color=GLYPH_COLOR, width=2.2):
    h = size / 2.0
    hd = size * 0.28
    if direction == "right":
        x1, y1, x2, y2 = cx - h, cy, cx + h, cy
        head = [(x2 - hd, y2 - hd), (x2, y2), (x2 - hd, y2 + hd)]
    elif direction == "left":
        x1, y1, x2, y2 = cx + h, cy, cx - h, cy
        head = [(x2 + hd, y2 - hd), (x2, y2), (x2 + hd, y2 + hd)]
    elif direction == "up":
        x1, y1, x2, y2 = cx, cy + h, cx, cy - h
        head = [(x2 - hd, y2 + hd), (x2, y2), (x2 + hd, y2 + hd)]
    else:  # down
        x1, y1, x2, y2 = cx, cy - h, cx, cy + h
        head = [(x2 - hd, y2 - hd), (x2, y2), (x2 + hd, y2 - hd)]
    parent.add(dwg.line((x1, y1), (x2, y2), stroke=color,
                        **{"stroke-width": width, "stroke-linecap": "round"}))
    parent.add(dwg.polyline(head, fill="none", stroke=color,
                            **{"stroke-width": width, "stroke-linecap": "round",
                               "stroke-linejoin": "round"}))


def _draw_bolt(dwg, parent, cx, cy, size, color=GLYPH_COLOR):
    """A filled lightning bolt (the 'fill' glyph)."""
    s = size
    norm = [
        (0.16, -0.50), (-0.30, 0.10), (-0.02, 0.10),
        (-0.16, 0.50), (0.30, -0.12), (0.02, -0.12),
    ]
    pts = [(cx + x * s, cy + y * s) for (x, y) in norm]
    parent.add(dwg.polygon(pts, fill=color, stroke="none"))


def _draw_glyph(dwg, parent, cx, cy, size, op, direction):
    if op == "fill":
        _draw_bolt(dwg, parent, cx, cy, size)
    elif op == "move":
        _draw_arrow(dwg, parent, cx, cy, size, direction)
    else:
        parent.add(dwg.text("?", insert=(cx, cy + size * 0.35),
                            fill=GLYPH_COLOR,
                            **{"text-anchor": "middle",
                               "font-size": size, "font-family": "sans-serif"}))


def _draw_star(dwg, parent, cx, cy, r_out, fill=START_STAR_FILL,
               stroke=STAR_STROKE, width=1.0):
    parent.add(dwg.polygon(_star_points(cx, cy, r_out, r_out * 0.4),
                           fill=fill, stroke=stroke,
                           **{"stroke-width": width, "stroke-linejoin": "round"}))


# --------------------------------------------------------------------------
# Pattern panel
# --------------------------------------------------------------------------
def render_pattern(ir, mode="key"):
    """Return an svgwrite.Drawing of the polar pattern panel."""
    geo = derive_geometry(ir)
    w, h = ir["canvas"]["width"], ir["canvas"]["height"]
    cx, cy = geo["cx"], geo["cy"]
    rw, radius = geo["ring_width"], geo["radius"]
    sym, wa, ws = geo["symmetry"], geo["wedge_angle"], geo["wedge_start"]

    dwg = svgwrite.Drawing(size=(w, h), viewBox=f"0 0 {w} {h}")
    dwg.add(dwg.rect((0, 0), (w, h), fill=ir["background"] or "#ffffff"))

    show_pattern = (mode != "blank-pattern")

    if show_pattern:
        filled, _ = simulate(ir)
        # 1. Filled cells, all symmetry copies, no stroke (drawFilledCells:129-161).
        cells = dwg.g()
        for i in range(sym):
            off = i * wa
            for (ring, col), color in filled.items():
                cells.add(dwg.polygon(cell_polygon(geo, ring, col, off),
                                      fill=color, stroke="none"))
        dwg.add(cells)

        # 2. Wash over non-active wedges (drawOutsideWedgeWash:171-200).
        wash = dwg.g(fill=ir["background"] or "#ffffff",
                     **{"fill-opacity": WASH_OPACITY, "stroke": "none"})
        for i in range(1, sym):
            a0 = ws + i * wa
            wash.add(dwg.path(d=_annular_sector_path(cx, cy, rw, radius, a0, a0 + wa)))
        dwg.add(wash)

    # 3. Concentric rings (runtime:206-209): i = 1..rings+1.
    rings_g = dwg.g(fill="none", stroke=RING_STROKE,
                    **{"stroke-opacity": RING_OPACITY, "stroke-width": 1})
    for i in range(1, geo["rings"] + 2):
        rings_g.add(dwg.circle(center=(cx, cy), r=i * rw))
    dwg.add(rings_g)

    # 4. Full radial spokes (runtime:211-221): from ringWidth to radius.
    spokes = dwg.g(stroke=SPOKE_STROKE,
                   **{"stroke-opacity": SPOKE_OPACITY, "stroke-width": 1})
    for i in range(geo["total_columns"]):
        ang = ws + i * (360.0 / geo["total_columns"])
        spokes.add(dwg.line(_polar(cx, cy, rw, ang), _polar(cx, cy, radius, ang)))
    dwg.add(spokes)

    # 5. Dashed red symmetry boundaries (runtime:223-238). Active wedge borders
    #    (i == 0, 1) strong; others faded.
    for i in range(sym):
        ang = ws + i * wa
        strong = i in (0, 1)
        dwg.add(dwg.line(
            (cx, cy), _polar(cx, cy, radius, ang),
            stroke=BOUNDARY_RED,
            **{"stroke-width": BOUNDARY_WIDTH, "stroke-dasharray": BOUNDARY_DASH,
               "stroke-opacity": BOUNDARY_ACTIVE_OPACITY if strong
               else BOUNDARY_FADED_OPACITY}))

    # 6. Center stays open (no gray hub) so the dashed boundaries read all the
    #    way to the middle, as in the app -- plus the app's small center dot
    #    (runtime:240-243  fill(0,0,0,110); circle diameter 4 -> r 2).
    dwg.add(dwg.circle(center=(cx, cy), r=2, fill="#000000",
                       **{"fill-opacity": 110 / 255}))

    # 7. START star at the true start cell (SPEC S6).
    sx, sy = cell_center(geo, ir["start"]["ring"], ir["start"]["col"])
    _draw_star(dwg, dwg, sx, sy, r_out=rw * 0.31, width=1.0)

    return dwg


# --------------------------------------------------------------------------
# Program panel
# --------------------------------------------------------------------------
def _program_glyphs(ir):
    """Steps -> list of (op, dir) capped at the grid, plus an overflow count."""
    seq = [(s["op"], s.get("dir")) for s in ir["steps"]]
    overflow = max(0, len(seq) - PROGRAM_CAPACITY)
    return seq[:PROGRAM_CAPACITY], overflow


def render_program(ir, mode="key"):
    """Return an svgwrite.Drawing of the 10x10 program grid + legend."""
    CELL = 46
    COLS = ROWS = 10
    gx, gy = 66, 168                       # grid origin (room for legend/headers)
    grid_w, grid_h = COLS * CELL, ROWS * CELL
    W = gx + grid_w + 26
    H = gy + grid_h + 26

    dwg = svgwrite.Drawing(size=(W, H), viewBox=f"0 0 {W} {H}")
    dwg.add(dwg.rect((0, 0), (W, H), fill="#ffffff"))

    # --- Legend row -------------------------------------------------------
    slot = grid_w / len(LEGEND)
    for idx, (op, direction, caption) in enumerate(LEGEND):
        cxl = gx + slot * (idx + 0.5)
        _draw_glyph(dwg, dwg, cxl, 52, 22, op, direction)
        for li, line in enumerate(caption):
            dwg.add(dwg.text(line, insert=(cxl, 82 + li * 12), fill="#333",
                             **{"text-anchor": "middle", "font-size": 9,
                                "font-family": "Helvetica, Arial, sans-serif"}))

    # --- Headers / labels -------------------------------------------------
    dwg.add(dwg.text("Step", insert=(gx - 26, gy - 12), fill="#333",
                     **{"text-anchor": "middle", "font-size": 11,
                        "font-weight": "bold",
                        "font-family": "Helvetica, Arial, sans-serif"}))
    for c in range(COLS):
        dwg.add(dwg.text(str(c), insert=(gx + c * CELL + CELL / 2, gy - 10),
                         fill="#333", **{"text-anchor": "middle", "font-size": 12,
                                         "font-family": "Helvetica, Arial, sans-serif"}))
    for r in range(ROWS):
        yc = gy + r * CELL + CELL / 2
        if r == 0:
            _draw_star(dwg, dwg, gx - 22, yc, r_out=9, width=1.0)   # step-0 marker
        else:
            dwg.add(dwg.text(str(r * 10), insert=(gx - 22, yc + 4), fill="#333",
                             **{"text-anchor": "middle", "font-size": 12,
                                "font-family": "Helvetica, Arial, sans-serif"}))

    # --- Grid cells -------------------------------------------------------
    grid = dwg.g(fill="none", stroke="#333", **{"stroke-width": 1})
    for r in range(ROWS):
        for c in range(COLS):
            grid.add(dwg.rect((gx + c * CELL, gy + r * CELL), (CELL, CELL)))
    dwg.add(grid)

    # --- Glyphs -----------------------------------------------------------
    if mode != "blank-program":
        seq, _ = _program_glyphs(ir)
        for i, (op, direction) in enumerate(seq):
            r, c = divmod(i, COLS)
            cxc = gx + c * CELL + CELL / 2
            cyc = gy + r * CELL + CELL / 2
            _draw_glyph(dwg, dwg, cxc, cyc, CELL * 0.5, op, direction)

    return dwg


# --------------------------------------------------------------------------
# Warnings + driver
# --------------------------------------------------------------------------
def collect_warnings(ir):
    """Loud, non-fatal checks (SPEC constraints)."""
    warns = list(ir.get("warnings", []))
    n = len(ir["steps"])
    if n > PROGRAM_CAPACITY:
        warns.append(
            f"{n} steps exceed the {PROGRAM_CAPACITY}-cell program grid; "
            f"only the first {PROGRAM_CAPACITY} are drawn"
        )
    known = {"move", "fill", "setcolor", "setstart"}
    unknown = sorted({s["op"] for s in ir["steps"]} - known)
    if unknown:
        warns.append(f"unknown step ops (no glyph): {', '.join(unknown)}")
    if ir.get("grid") is None:
        warns.append("no grid geometry; cannot render pattern")
    return warns


def load_ir(path):
    path = Path(path)
    if path.suffix == ".json":
        ir = json.loads(path.read_text(encoding="utf-8"))
        ir.setdefault("title", p5parser.humanize_title(ir.get("source", path.name)))
        return ir
    ir = p5parser.parse_file(path)
    ir["title"] = p5parser.humanize_title(path.name)
    return ir


def render_files(path, out_dir=None, mode="key"):
    ir = load_ir(path)
    out_dir = Path(out_dir) if out_dir else Path(path).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(ir.get("source", path)).stem

    for w in collect_warnings(ir):
        print(f"  ! WARNING: {w}", file=sys.stderr)

    pattern_path = out_dir / f"{stem}.pattern.svg"
    program_path = out_dir / f"{stem}.program.svg"
    render_pattern(ir, mode).saveas(str(pattern_path))
    render_program(ir, mode).saveas(str(program_path))
    return pattern_path, program_path


def main(argv=None):
    ap = argparse.ArgumentParser(description="IR -> pattern.svg + program.svg")
    ap.add_argument("input", help="INPUT.p5xml or INPUT.ir.json")
    ap.add_argument("--out", default=None, help="output directory")
    ap.add_argument("--mode", default="key",
                    choices=["key", "blank-program", "blank-pattern"])
    args = ap.parse_args(argv)
    pat, prog = render_files(args.input, args.out, args.mode)
    print(f"  -> {pat}")
    print(f"  -> {prog}")


if __name__ == "__main__":
    main()
