"""
test_render.py -- smoke + geometry tests for render.py / layout.py

Run from worksheets/:  python -m pytest -q
"""

import xml.etree.ElementTree as ET
from pathlib import Path

import parser as p5parser
import render
import layout

HERE = Path(__file__).parent
SAMPLE = HERE / "basketGrid_lightning_00.p5xml"


def _mini_ir(steps, wrap=True, start=(0, 0), color="#000000",
             rings=5, cols=6, sym=6):
    return {
        "source": "mini.p5xml",
        "canvas": {"width": 600, "height": 600},
        "background": "#f4f1ea",
        "grid": {"rings": rings, "columns": cols, "symmetry": sym},
        "initial_fill_color": color,
        "start": {"ring": start[0], "col": start[1]},
        "wrap_edges": wrap,
        "steps": steps,
        "warnings": [],
    }


# --- simulation ------------------------------------------------------------

def test_simulate_lightning_filled_cells():
    ir = p5parser.parse_file(SAMPLE)
    filled, _ = render.simulate(ir)
    expected = {(0, 0), (0, 1), (1, 1), (2, 1), (2, 2), (2, 3),
                (3, 3), (4, 3), (4, 4), (4, 5)}
    assert set(filled.keys()) == expected
    assert all(v == "#333333" for v in filled.values())


def test_wrap_left_wraps_to_last_column():
    ir = _mini_ir([{"op": "move", "dir": "left"}, {"op": "fill"}], wrap=True)
    filled, _ = render.simulate(ir)
    assert set(filled) == {(0, 5)}          # col -1 -> wraps to localCols-1


def test_clamp_left_stays_at_zero():
    ir = _mini_ir([{"op": "move", "dir": "left"}, {"op": "fill"}], wrap=False)
    filled, _ = render.simulate(ir)
    assert set(filled) == {(0, 0)}          # col -1 -> clamps to 0


def test_wrap_up_past_outer_ring():
    # start on the outer ring, move up -> wraps to ring 0
    ir = _mini_ir([{"op": "move", "dir": "up"}, {"op": "fill"}],
                  wrap=True, start=(4, 2))
    filled, _ = render.simulate(ir)
    assert set(filled) == {(0, 2)}


def test_setcolor_midprogram_changes_fill():
    ir = _mini_ir([{"op": "fill"},
                   {"op": "setcolor", "color": "#ff0000"},
                   {"op": "move", "dir": "right"}, {"op": "fill"}])
    filled, _ = render.simulate(ir)
    assert filled[(0, 0)] == "#000000"
    assert filled[(0, 1)] == "#ff0000"


# --- SVG output ------------------------------------------------------------

def test_pattern_svg_wellformed_and_has_cells():
    ir = p5parser.parse_file(SAMPLE)
    svg = render.render_pattern(ir, "key").tostring()
    root = ET.fromstring(svg)                # raises if malformed
    polys = root.findall(".//{http://www.w3.org/2000/svg}polygon")
    # 10 filled cells x 6 symmetry copies + 1 start star = 61 polygons
    assert len(polys) == 61


def test_blank_pattern_has_no_filled_cells():
    ir = p5parser.parse_file(SAMPLE)
    svg = render.render_pattern(ir, "blank-pattern").tostring()
    root = ET.fromstring(svg)
    polys = root.findall(".//{http://www.w3.org/2000/svg}polygon")
    assert len(polys) == 1                   # only the start star


def test_program_svg_wellformed():
    ir = p5parser.parse_file(SAMPLE)
    svg = render.render_program(ir, "key").tostring()
    root = ET.fromstring(svg)
    rects = root.findall(".//{http://www.w3.org/2000/svg}rect")
    assert len(rects) >= 100                 # 10x10 grid + background


# --- PDF output ------------------------------------------------------------

def test_pdf_is_written(tmp_path):
    ir = p5parser.parse_file(SAMPLE)
    ir["title"] = "Lightning"
    out = tmp_path / "w.pdf"
    layout.build_worksheet(ir, out, "key")
    data = out.read_bytes()
    assert data[:5] == b"%PDF-"
    assert len(data) > 1000


def test_all_modes_render(tmp_path):
    ir = p5parser.parse_file(SAMPLE)
    for mode in ("key", "blank-program", "blank-pattern"):
        out = tmp_path / f"{mode}.pdf"
        layout.build_worksheet(ir, out, mode)
        assert out.read_bytes()[:5] == b"%PDF-"
