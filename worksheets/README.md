# Polar Graph-Paper Programming — Worksheet Generator

Turns a sketch saved from the Blockly/p5.js app (a `.p5xml` file using the
**Basket Grid** blocks) into a printable US-Letter worksheet PDF: a polar
**pattern** panel + a 10×10 **program** panel with glyph legend.

Everything here is **read-only** with respect to the app; geometry is ported
verbatim from `js/runtime_basketgrid.js`. See [SPEC.md](SPEC.md) for the full
spec and every source citation.

## Pipeline

```
*.p5xml ──parse──▶ IR (JSON) ──render──▶ pattern.svg + program.svg ──layout──▶ worksheet.pdf
```

| File | Role | Deps |
|---|---|---|
| `parser.py` | `.p5xml` → IR (JSON) | stdlib only |
| `render.py` | IR → two SVGs (geometry + program-simulation live here) | `svgwrite` |
| `layout.py` | IR → PDF, drawn directly from `render.py`'s geometry | `reportlab` |
| `make_worksheet.py` | CLI: parse → render → PDF | the above |

`layout.py` draws the PDF from the **same** geometry functions the SVG uses, so
the two can never drift apart. Both `svgwrite` and `reportlab` are pure Python
(no Cairo/GTK) for hassle-free Windows print output.

## Setup

Python 3.12. Put the venv **outside** this folder — Dropbox sync corrupts an
in-tree venv, and `AppData\Local` can be redirected under sandboxed hosts. The
user-profile root is a safe, non-redirected home:

```powershell
python -m venv "$env:USERPROFILE\p5worksheets-venv"
& "$env:USERPROFILE\p5worksheets-venv\Scripts\python.exe" -m pip install -r requirements.txt
```

`$env:USERPROFILE\p5worksheets-venv` is `C:\Users\<you>\p5worksheets-venv`.

## Usage

```powershell
cd "<repo>\worksheets"
$py = "$env:USERPROFILE\p5worksheets-venv\Scripts\python.exe"

# one worksheet (answer key) next to the input
& $py make_worksheet.py basketGrid_lightning_00.p5xml

# all three modes into ./out
& $py make_worksheet.py basketGrid_lightning_00.p5xml --mode all --out out
```

Outputs `<stem>_<mode>.pdf` (+ `.pattern.svg` / `.program.svg` unless
`--no-svg`).

### Modes (`--mode`)

| Mode | Pattern | Program | Use |
|---|---|---|---|
| `key` (default) | filled | filled | answer key |
| `blank-program` | filled | empty | student writes the program from the pattern |
| `blank-pattern` | empty grid | filled | student draws the pattern from the program |
| `all` | — | — | emit all three |

## Warnings (never silent)

Printed to stderr: programs over 100 atomic steps (only the first 100 fit the
grid), unknown block/step types, mid-program color or start changes, and a
fatal error if there's no `basket_set_grid`.

## Tests

```powershell
& "$env:USERPROFILE\p5worksheets-venv\Scripts\python.exe" -m pytest -q
```

24 cases: parser vocabulary/loops/warnings (`test_parser.py`) and
simulation-geometry + SVG/PDF smoke (`test_render.py`).
