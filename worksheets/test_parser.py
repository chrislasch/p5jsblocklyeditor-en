"""
test_parser.py -- pytest coverage for parser.py

Run from the worksheets/ directory:
    python -m pytest -q

The headline test parses the reconstructed lightning sample
(basketGrid_lightning_00.p5xml) and locks its IR. The rest are focused unit
tests for the block behaviors that the draft parser did not yet handle
(set_start, wrap_edges, loop unrolling, unknown-block warnings).
"""

from pathlib import Path

import parser  # worksheets/parser.py (Python's stdlib `parser` was removed in 3.10)

HERE = Path(__file__).parent
SAMPLE = HERE / "basketGrid_lightning_00.p5xml"


# --- helpers ---------------------------------------------------------------

_SETUP_OPEN = (
    '<xml xmlns="https://developers.google.com/blockly/xml">'
    '<block type="setup">'
    '<field name="canvasBreite">600</field>'
    '<field name="canvasHoehe">600</field>'
    '<statement name="do">'
)
_SETUP_CLOSE = "</statement></block></xml>"


def _build(do_blocks):
    """do_blocks: list of (type, inner_fields_xml). Returns full .p5xml text
    with the blocks linked through <next> in order."""
    inner = ""
    for btype, fields in reversed(do_blocks):
        nxt = f"<next>{inner}</next>" if inner else ""
        inner = f'<block type="{btype}">{fields}{nxt}</block>'
    return _SETUP_OPEN + inner + _SETUP_CLOSE


def _parse(tmp_path, do_blocks):
    p = tmp_path / "case.p5xml"
    p.write_text(_build(do_blocks), encoding="utf-8")
    return parser.parse_file(p)


_GRID = ("basket_set_grid",
         '<field name="rings">5</field>'
         '<field name="columns">6</field>'
         '<field name="symmetry">6</field>')


# --- the sample ------------------------------------------------------------

def test_lightning_sample_ir():
    ir = parser.parse_file(SAMPLE)

    assert ir["canvas"] == {"width": 600, "height": 600}
    assert ir["background"] == "#f4f1ea"
    assert ir["grid"] == {"rings": 5, "columns": 6, "symmetry": 6}
    assert ir["initial_fill_color"] == "#333333"
    assert ir["start"] == {"ring": 0, "col": 0}      # default cursor home
    assert ir["wrap_edges"] is True                  # default (no wrap block)
    assert ir["warnings"] == []

    expected = [{"op": "fill"}]
    for d in ["right", "up", "up", "right", "right", "up", "up", "right", "right"]:
        expected.append({"op": "move", "dir": d})
        expected.append({"op": "fill"})
    assert ir["steps"] == expected
    assert len(ir["steps"]) == 19
    assert sum(1 for s in ir["steps"] if s["op"] == "fill") == 10


def test_humanize_title():
    assert parser.humanize_title("basketGrid_lightning_00.p5xml") == "Lightning"


# --- newly-supported blocks ------------------------------------------------

def test_wrap_edges_off(tmp_path):
    ir = _parse(tmp_path, [
        _GRID,
        ("basket_wrap_edges", '<field name="wrapOff">TRUE</field>'),
        ("basket_fill", ""),
    ])
    assert ir["wrap_edges"] is False
    assert ir["steps"] == [{"op": "fill"}]
    assert ir["warnings"] == []


def test_wrap_edges_explicit_on(tmp_path):
    ir = _parse(tmp_path, [
        _GRID,
        ("basket_wrap_edges", '<field name="wrapOff">FALSE</field>'),
        ("basket_fill", ""),
    ])
    assert ir["wrap_edges"] is True


def test_set_start_is_one_based(tmp_path):
    # UI ring/stitch are 1-based; generator stores 0-based (block gen :108-111).
    ir = _parse(tmp_path, [
        _GRID,
        ("basket_set_start",
         '<field name="ring">3</field><field name="column">2</field>'),
        ("basket_fill", ""),
    ])
    assert ir["start"] == {"ring": 2, "col": 1}
    assert ir["warnings"] == []


def test_set_start_clamped_to_grid(tmp_path):
    ir = _parse(tmp_path, [
        _GRID,  # rings=5 (0..4), columns=6 (0..5)
        ("basket_set_start",
         '<field name="ring">99</field><field name="column">99</field>'),
    ])
    assert ir["start"] == {"ring": 4, "col": 5}


def test_plain_moves_and_noops(tmp_path):
    ir = _parse(tmp_path, [
        _GRID,
        ("basket_show_grid", ""),
        ("basket_move_up", ""),
        ("basket_fill", ""),
        ("basket_animate", '<field name="step_ms">150</field>'),
    ])
    assert ir["steps"] == [{"op": "move", "dir": "up"}, {"op": "fill"}]
    assert ir["warnings"] == []


# --- loops -----------------------------------------------------------------

def _repeat(times, body_blocks_xml):
    return ("controls_repeat_ext",
            f'<value name="TIMES"><shadow type="math_number">'
            f'<field name="NUM">{times}</field></shadow></value>'
            f'<statement name="DO">{body_blocks_xml}</statement>')


def test_repeat_unroll(tmp_path):
    body = '<block type="basket_move_fill_right"></block>'
    ir = _parse(tmp_path, [_GRID, _repeat(3, body)])
    assert ir["steps"] == [
        {"op": "move", "dir": "right"}, {"op": "fill"},
        {"op": "move", "dir": "right"}, {"op": "fill"},
        {"op": "move", "dir": "right"}, {"op": "fill"},
    ]
    assert ir["warnings"] == []


def test_over_100_steps_warns(tmp_path):
    body = '<block type="basket_move_fill_right"></block>'  # 2 steps each
    ir = _parse(tmp_path, [_GRID, _repeat(60, body)])       # -> 120 steps
    assert len(ir["steps"]) == 120
    assert any("exceeds the 100-cell" in w for w in ir["warnings"])


def test_for_loop_unroll(tmp_path):
    body = '<block type="basket_fill"></block>'
    forblk = ("controls_for",
              '<field name="VAR">i</field>'
              '<value name="FROM"><shadow type="math_number">'
              '<field name="NUM">1</field></shadow></value>'
              '<value name="TO"><shadow type="math_number">'
              '<field name="NUM">4</field></shadow></value>'
              '<value name="BY"><shadow type="math_number">'
              '<field name="NUM">1</field></shadow></value>'
              f'<statement name="DO">{body}</statement>')
    ir = _parse(tmp_path, [_GRID, forblk])
    assert ir["steps"] == [{"op": "fill"}] * 4  # i = 1,2,3,4


def test_while_loop_warns_not_unrolled(tmp_path):
    whileblk = ("controls_whileUntil",
                '<field name="MODE">WHILE</field>'
                '<statement name="DO">'
                '<block type="basket_fill"></block></statement>')
    ir = _parse(tmp_path, [_GRID, whileblk])
    assert ir["steps"] == []
    assert any("controls_whileUntil" in w for w in ir["warnings"])


# --- error / warning surfaces ---------------------------------------------

def test_unknown_block_warns(tmp_path):
    ir = _parse(tmp_path, [_GRID, ("totally_made_up_block", "")])
    assert any("unhandled block type: totally_made_up_block" in w
               for w in ir["warnings"])


def test_missing_grid_warns(tmp_path):
    ir = _parse(tmp_path, [("basket_fill", "")])
    assert ir["grid"] is None
    assert any("no basket_set_grid" in w for w in ir["warnings"])


def test_no_setup_raises(tmp_path):
    p = tmp_path / "nosetup.p5xml"
    p.write_text('<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
                 encoding="utf-8")
    import pytest
    with pytest.raises(ValueError):
        parser.parse_file(p)
