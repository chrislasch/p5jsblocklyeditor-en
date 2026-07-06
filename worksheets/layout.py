#!/usr/bin/env python3
"""
layout.py -- compose a worksheet IR onto a US Letter portrait PDF (reportlab).

The PDF is drawn *directly* with reportlab vector primitives, reusing the exact
geometry + simulation from render.py (derive_geometry / simulate / cell_polygon
/ cell_center / _polar / _star_points) so the printed pattern can never diverge
from the SVG. No native (Cairo) dependency.

Coordinate note: reportlab's origin is bottom-left, y-up. All layout math here
is done in a familiar top-down "layout space" (y grows downward) and mapped to
the page with Y(yd) = PAGE_H - yd. Shapes computed in render.py's SVG space are
mapped through a per-panel transform T(); glyphs are drawn natively in
reportlab space (y-up) so an "up" arrow points up the page.
"""

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor

import render
from render import (
    derive_geometry, simulate, cell_polygon, cell_center, _polar, _star_points,
    LEGEND, PROGRAM_CAPACITY,
    RING_STROKE, RING_OPACITY, SPOKE_STROKE, SPOKE_OPACITY,
    BOUNDARY_RED, BOUNDARY_ACTIVE_OPACITY, BOUNDARY_FADED_OPACITY,
    BOUNDARY_WIDTH, WASH_OPACITY,
    START_STAR_FILL, STAR_STROKE, GLYPH_COLOR,
)

PAGE_W, PAGE_H = letter          # (612, 792) points
MARGIN = 44
MARGIN_BOTTOM = 36

FONT_TITLE = "Times-Italic"
FONT_LABEL = "Helvetica-Bold"
FONT_TEXT = "Helvetica"

INK = HexColor("#333333")
BLACK = HexColor("#000000")


def _Y(yd):
    """layout-space (y down) -> reportlab page y (y up)."""
    return PAGE_H - yd


# --------------------------------------------------------------------------
# Pattern panel (SVG-space geometry mapped through T)
# --------------------------------------------------------------------------
def draw_pattern(c, ir, box_x, box_top, box_size, mode):
    geo = derive_geometry(ir)
    cw = max(ir["canvas"]["width"], ir["canvas"]["height"])
    scale = box_size / cw

    def T(sx, sy):
        return (box_x + sx * scale, _Y(box_top + sy * scale))

    cx, cy = geo["cx"], geo["cy"]
    rw, radius = geo["ring_width"], geo["radius"]
    sym, wa, ws = geo["symmetry"], geo["wedge_angle"], geo["wedge_start"]
    bg = ir["background"] or "#ffffff"

    def poly(pts_svg, fill=None, stroke=None, width=1, alpha=1,
             stroke_alpha=1, closed=True):
        pts = [T(*p) for p in pts_svg]
        path = c.beginPath()
        path.moveTo(*pts[0])
        for p in pts[1:]:
            path.lineTo(*p)
        if closed:
            path.close()
        if fill is not None:
            c.setFillColor(HexColor(fill)); c.setFillAlpha(alpha)
        if stroke is not None:
            c.setStrokeColor(HexColor(stroke)); c.setStrokeAlpha(stroke_alpha)
            c.setLineWidth(width)
        c.drawPath(path, fill=1 if fill is not None else 0,
                   stroke=1 if stroke is not None else 0)
        c.setFillAlpha(1); c.setStrokeAlpha(1)

    # 0. Panel background (the sketch's canvas color).
    c.setFillColor(HexColor(bg)); c.setFillAlpha(1)
    c.rect(box_x, _Y(box_top + box_size), box_size, box_size, fill=1, stroke=0)

    if mode != "blank-pattern":
        filled, _ = simulate(ir)
        # 1. Filled cells, all symmetry copies (pure rotation), no stroke.
        for i in range(sym):
            off = i * wa
            for (ring, col), color in filled.items():
                poly(cell_polygon(geo, ring, col, off), fill=color)
        # 2. Wash dimming non-active wedges (polygonal annular sectors).
        for i in range(1, sym):
            a0 = ws + i * wa
            steps = 24
            arc = [_polar(cx, cy, radius, a0 + wa * k / steps) for k in range(steps + 1)]
            arc += [_polar(cx, cy, rw, a0 + wa - wa * k / steps) for k in range(steps + 1)]
            poly(arc, fill=bg, alpha=WASH_OPACITY)

    # 3. Concentric rings.
    ccx, ccy = T(cx, cy)
    c.setStrokeColor(HexColor(RING_STROKE)); c.setStrokeAlpha(RING_OPACITY)
    c.setLineWidth(1); c.setDash([])
    for i in range(1, geo["rings"] + 2):
        c.circle(ccx, ccy, i * rw * scale, stroke=1, fill=0)

    # 4. Full radial spokes (ringWidth -> radius).
    c.setStrokeColor(HexColor(SPOKE_STROKE)); c.setStrokeAlpha(SPOKE_OPACITY)
    for i in range(geo["total_columns"]):
        ang = ws + i * (360.0 / geo["total_columns"])
        p1 = T(*_polar(cx, cy, rw, ang)); p2 = T(*_polar(cx, cy, radius, ang))
        c.line(p1[0], p1[1], p2[0], p2[1])

    # 5. Dashed red symmetry boundaries to the center; active pair strong.
    c.setStrokeColor(HexColor(BOUNDARY_RED)); c.setLineWidth(BOUNDARY_WIDTH)
    c.setDash([8 * scale, 6 * scale])
    for i in range(sym):
        ang = ws + i * wa
        c.setStrokeAlpha(BOUNDARY_ACTIVE_OPACITY if i in (0, 1)
                         else BOUNDARY_FADED_OPACITY)
        pc = T(cx, cy); pe = T(*_polar(cx, cy, radius, ang))
        c.line(pc[0], pc[1], pe[0], pe[1])
    c.setDash([]); c.setStrokeAlpha(1)

    # 6. Small center dot (center stays open, app-style).
    c.setFillColor(BLACK); c.setFillAlpha(110 / 255)
    c.circle(ccx, ccy, 2 * scale, fill=1, stroke=0)
    c.setFillAlpha(1)

    # 7. START star at the true start cell (half-size).
    sx, sy = cell_center(geo, ir["start"]["ring"], ir["start"]["col"])
    star = _star_points(sx, sy, rw * 0.31, rw * 0.31 * 0.4, rot_deg=-90)
    poly(star, fill=START_STAR_FILL, stroke=STAR_STROKE, width=1.0)


# --------------------------------------------------------------------------
# Program panel (native reportlab, y-up glyphs)
# --------------------------------------------------------------------------
def _rl_arrow(c, X, Y, size, direction, color=GLYPH_COLOR, width=2.2):
    h, hd = size / 2.0, size * 0.28
    if direction == "right":
        x1, y1, x2, y2 = X - h, Y, X + h, Y
        head = [(x2 - hd, y2 + hd), (x2, y2), (x2 - hd, y2 - hd)]
    elif direction == "left":
        x1, y1, x2, y2 = X + h, Y, X - h, Y
        head = [(x2 + hd, y2 + hd), (x2, y2), (x2 + hd, y2 - hd)]
    elif direction == "up":                       # up = +Y (up the page)
        x1, y1, x2, y2 = X, Y - h, X, Y + h
        head = [(x2 - hd, y2 - hd), (x2, y2), (x2 + hd, y2 - hd)]
    else:  # down
        x1, y1, x2, y2 = X, Y + h, X, Y - h
        head = [(x2 - hd, y2 + hd), (x2, y2), (x2 + hd, y2 + hd)]
    c.setStrokeColor(HexColor(color)); c.setLineWidth(width)
    c.setLineCap(1); c.setLineJoin(1)
    c.line(x1, y1, x2, y2)
    path = c.beginPath(); path.moveTo(*head[0])
    for p in head[1:]:
        path.lineTo(*p)
    c.drawPath(path, fill=0, stroke=1)
    c.setLineCap(0); c.setLineJoin(0)


def _rl_bolt(c, X, Y, size, color=GLYPH_COLOR):
    # render.py's bolt is y-down; negate y for reportlab's y-up.
    norm = [(0.16, 0.50), (-0.30, -0.10), (-0.02, -0.10),
            (-0.16, -0.50), (0.30, 0.12), (0.02, 0.12)]
    pts = [(X + x * size, Y + y * size) for (x, y) in norm]
    c.setFillColor(HexColor(color)); c.setFillAlpha(1)
    path = c.beginPath(); path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    path.close()
    c.drawPath(path, fill=1, stroke=0)


def _rl_star(c, X, Y, r_out, fill=START_STAR_FILL, stroke=STAR_STROKE, width=1.0):
    pts = _star_points(X, Y, r_out, r_out * 0.4, rot_deg=90)   # +Y up
    c.setFillColor(HexColor(fill)); c.setStrokeColor(HexColor(stroke))
    c.setLineWidth(width); c.setLineJoin(1); c.setFillAlpha(1); c.setStrokeAlpha(1)
    path = c.beginPath(); path.moveTo(*pts[0])
    for p in pts[1:]:
        path.lineTo(*p)
    path.close()
    c.drawPath(path, fill=1, stroke=1)
    c.setLineJoin(0)


def _rl_glyph(c, X, Y, size, op, direction):
    if op == "fill":
        _rl_bolt(c, X, Y, size)
    elif op == "move":
        _rl_arrow(c, X, Y, size, direction)
    else:
        c.setFillColor(INK); c.setFont(FONT_TEXT, size)
        c.drawCentredString(X, Y - size * 0.35, "?")


def draw_program(c, ir, area_x, area_top, area_w, area_h, mode):
    COLS = ROWS = 10
    legend_h, header_h, label_w = 64, 18, 26

    cell = min((area_w - label_w) / COLS, (area_h - legend_h - header_h) / ROWS)
    grid_w = cell * COLS
    gx = area_x + (area_w - (grid_w + label_w)) / 2 + label_w   # grid left edge (yd)
    grid_top = area_top + legend_h + header_h                    # yd of grid top

    # --- Legend (spans the grid block; slots wide enough for the captions) --
    legend_left = gx - label_w
    slot = (grid_w + label_w) / len(LEGEND)
    for idx, (op, direction, caption) in enumerate(LEGEND):
        gcx = legend_left + slot * (idx + 0.5)
        _rl_glyph(c, gcx, _Y(area_top + 18), 20, op, direction)
        c.setFillColor(INK); c.setFont(FONT_TEXT, 8)
        for li, line in enumerate(caption):
            c.drawCentredString(gcx, _Y(area_top + 38 + li * 9.5), line)

    # --- Headers / labels -------------------------------------------------
    c.setFillColor(INK)
    c.setFont(FONT_LABEL, 10)
    c.drawCentredString(gx - label_w / 2, _Y(grid_top - 9), "Step")
    c.setFont(FONT_TEXT, 11)
    for cc in range(COLS):
        c.drawCentredString(gx + cc * cell + cell / 2, _Y(grid_top - 9), str(cc))
    for r in range(ROWS):
        yc = grid_top + r * cell + cell / 2
        if r == 0:
            _rl_star(c, gx - label_w / 2, _Y(yc), 8, width=1.0)
        else:
            c.setFillColor(INK); c.setFont(FONT_TEXT, 11)
            c.drawCentredString(gx - label_w / 2, _Y(yc) - 4, str(r * 10))

    # --- Grid -------------------------------------------------------------
    c.setStrokeColor(INK); c.setLineWidth(1); c.setStrokeAlpha(1); c.setDash([])
    for r in range(ROWS):
        for cc in range(COLS):
            x = gx + cc * cell
            c.rect(x, _Y(grid_top + (r + 1) * cell), cell, cell, stroke=1, fill=0)

    # --- Glyphs -----------------------------------------------------------
    if mode != "blank-program":
        seq = [(s["op"], s.get("dir")) for s in ir["steps"]][:PROGRAM_CAPACITY]
        for i, (op, direction) in enumerate(seq):
            r, cc = divmod(i, COLS)
            X = gx + cc * cell + cell / 2
            Y = _Y(grid_top + r * cell + cell / 2)
            _rl_glyph(c, X, Y, cell * 0.5, op, direction)


# --------------------------------------------------------------------------
# Page composition
# --------------------------------------------------------------------------
def draw_start_header(c, center_x, top):
    """The decorative 'START HERE' label + yellow star above the pattern."""
    c.setFillColor(INK); c.setFont(FONT_TITLE, 10)
    c.drawRightString(center_x + 6, _Y(top + 4), "START")
    c.drawRightString(center_x + 6, _Y(top + 15), "HERE")
    _rl_star(c, center_x + 26, _Y(top + 9), 9, width=1.0)


def build_worksheet(ir, out_path, mode="key"):
    c = canvas.Canvas(str(out_path), pagesize=letter)

    # Title (top-left, italic).
    c.setFillColor(INK); c.setFont(FONT_TITLE, 26)
    c.drawString(MARGIN, _Y(66), ir.get("title", "Worksheet"))

    # START HERE header, above the pattern, right of center.
    draw_start_header(c, PAGE_W / 2 + 6, 66)

    # "Pattern" section label + panel.
    pattern_box = 300
    pattern_x = (PAGE_W - pattern_box) / 2
    pattern_top = 100
    c.setFillColor(INK); c.setFont(FONT_LABEL, 13)
    c.drawString(MARGIN, _Y(124), "Pattern")
    draw_pattern(c, ir, pattern_x, pattern_top, pattern_box, mode)

    # "Program" section label + panel.
    program_top = pattern_top + pattern_box + 18       # 418
    c.setFillColor(INK); c.setFont(FONT_LABEL, 13)
    c.drawString(MARGIN, _Y(program_top - 6), "Program")
    draw_program(c, ir, MARGIN, program_top,
                 PAGE_W - 2 * MARGIN, PAGE_H - MARGIN_BOTTOM - program_top, mode)

    c.showPage()
    c.save()
    return out_path


if __name__ == "__main__":
    import sys
    ir = render.load_ir(sys.argv[1])
    out = build_worksheet(ir, sys.argv[2] if len(sys.argv) > 2 else "worksheet.pdf")
    print(f"  -> {out}")
