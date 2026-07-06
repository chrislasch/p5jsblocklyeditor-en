# Polar Graph Paper Programming — Worksheet Generator Spec

Draft v0.2 — **Phase 1 verification complete**. Every item previously marked
**[VERIFY]** has been resolved against the app source and is now marked
**[CONFIRMED]** with a `file:line` pointer. Contradictions between draft v0.1
and the actual code are called out inline as **⚠ CONTRADICTION**.

Authoritative sources (read-only for the generator):

- `js/runtime_basketgrid.js` — `BasketGrid` runtime: geometry + cursor model.
- `js/bloecke_basketgrid.js` — block definitions + JavaScript generators.
- `js/toolbox.js` — which blocks are exposed to learners.
- `js/bloecke_p5funktionen.js` — the `setup` block (canvas fields, `do` slot,
  `angleMode(DEGREES)`).
- `js/bloecke_aussehen.js` — `background_pick`.

---

## 1. Purpose

Convert sketches saved from the Blockly/p5.js creative-coding app into
printable worksheet PDFs for a graph-paper-programming exercise on a
polar grid, matching the reference layout (`Fret` example):

- **Pattern panel** — the rendered polar-grid design, with dashed
  symmetry spokes and a START HERE marker.
- **Program panel** — a 10×10 step grid (steps 0–99, rows labeled
  0/10/20…90) filled with glyphs, plus a legend.

The translation from sketch to program is **deterministic**: the saved
`.p5xml` file *is* the program. No interpretation of images is involved.

> **Note on the sample.** The `.p5xml` was initially reconstructed from the IR
> (only the `.ir.json` was supplied first), then **replaced with the genuine
> file**. The two are structurally identical — same 13 blocks, fields, values,
> and order — differing only in Blockly `id` attributes and the canvas variable
> name (`canvas`). All 14 parser tests pass against the genuine file and it
> reproduces the IR exactly (background `#f4f1ea`, grid 5×6×6, fill `#333333`,
> `fill` + 9×`move+fill`, `start` (0,0), `wrap_edges` true, 0 warnings).

---

## 2. Input format (`.p5xml`)

Standard Blockly serialization XML, namespace
`https://developers.google.com/blockly/xml`.

Structure: a root `setup` block whose `<statement name="do">` contains a
singly-linked chain of blocks connected via `<next>`. Parameters live in
`<field name="…">` elements. The `setup` block also carries the canvas size
and a `zeichenflaeche` (canvas) variable value input that the worksheet
ignores. (`bloecke_p5funktionen.js:4-30`.)

### 2.1 Block vocabulary — **[CONFIRMED]**

The complete Basket-Grid category, in toolbox order (`toolbox.js:165-193`),
plus the supporting blocks:

| Block type | Fields | Meaning | Source |
|---|---|---|---|
| `setup` | `canvasBreite`, `canvasHoehe` | Canvas size (px); `do` holds the program | `bloecke_p5funktionen.js:4-30` |
| `background_pick` | `farbe` | Background color (hex) | `bloecke_aussehen.js:37-56` |
| `basket_set_grid` | `rings`, `columns`, `symmetry` | Rings; **columns *per wedge*** (= `localCols`); wedge count. Total columns = `columns × symmetry`. **Resets fill color → `#000000` and cursor → (0,0).** | `bloecke_basketgrid.js:5-39`; runtime `287-324` |
| `basket_show_grid` | — | Show construction overlay (no effect on print) | `:41-54`; runtime `326-330` |
| `basket_hide_grid` | — | Hide overlay (no effect on print) | `:56-69`; runtime `332-336` |
| `basket_set_fill_color` | `farbe` | Set current fill color | `:71-87` |
| `basket_set_start` | `ring`, `column` | Set cursor start. **UI is 1-based**; generator stores `max(0, n-1)`, clamped to grid | `:89-112`; runtime `344-359` |
| `basket_wrap_edges` | `wrapOff` (checkbox) | **Wrap is ON by default**; checking the box turns it OFF | `:114-132`; runtime `396-400` |
| `basket_fill` | — | Fill the current cell | `:187-200`; runtime `361-365` |
| `basket_move_right` / `_left` / `_up` / `_down` | — | Move cursor one cell | `:153-168, 202-205`; runtime `367-389` |
| `basket_move_fill_right` / `_left` / `_up` / `_down` | — | Move one cell, **then** fill | `:170-185, 207-226`; runtime `391-394` |
| `basket_animate` | `step_ms` | Replay drawing with a delay (no effect on a static print) | `:134-151`; runtime `498-523` |

Colour field name is **`farbe`** on every color block. Move/fill blocks take
no fields — direction is baked into the block type.

### 2.2 Presumed blocks — **[CONFIRMED / RESOLVED]**

- `basket_move_fill_left`, `basket_move_fill_down` — **exist**
  (`bloecke_basketgrid.js:212-226`).
- Plain moves `basket_move_{right,left,up,down}` — **exist**
  (`:202-205`). Both plain-move and move+fill variants are in the toolbox.
- **Loops — exposed to learners.** The toolbox includes `controls_repeat_ext`,
  `controls_for`, `controls_whileUntil`, and `controls_flow_statements`
  (`toolbox.js:783-810`), plus `controls_if`/logic (`:811-817`). Because basket
  blocks take no arguments, a loop body is just a fixed sequence, so the parser
  **unrolls** literal-count `controls_repeat_ext` and literal-bounds
  `controls_for` into atomic steps. `controls_whileUntil` / `controls_if`
  cannot be resolved statically and are **warned, not unrolled**.
- **Pen/eraser, randomization** — none in the Basket category. There is no
  erase/undo block and no basket-specific randomizer. (The general `p5_random`
  exists but is not wired to the grid.)
- **Multi-color** — supported by the *app* (each filled cell stores its color:
  runtime `363, 150-155`), but see §3.1 for worksheet policy.

---

## 3. Intermediate representation (IR)

The parser emits one JSON object per sketch. Everything downstream consumes
only the IR.

```json
{
  "source": "basketGrid_lightning_00.p5xml",
  "canvas": { "width": 600, "height": 600 },
  "background": "#f4f1ea",
  "grid": { "rings": 5, "columns": 6, "symmetry": 6 },
  "initial_fill_color": "#333333",
  "start": { "ring": 0, "col": 0 },
  "wrap_edges": true,
  "steps": [
    { "op": "fill" },
    { "op": "move", "dir": "right" },
    { "op": "fill" }
  ],
  "warnings": [],
  "title": "Lightning"
}
```

New fields vs. draft v0.1 (both needed by the renderer/answer key):

- **`start`** — 0-based `{ring, col}` where drawing begins (the START HERE
  cell). Defaults to `{0,0}`; set by `basket_set_start`. `grid.columns` is
  columns **per wedge**, so `col` ranges `0 … columns-1`.
- **`wrap_edges`** — boolean boundary mode for the whole run (default `true`).
- **`initial_fill_color`** — defaults to `#000000` (the app's post-`setGrid`
  fill color, runtime `:304`), overridden by a leading `basket_set_fill_color`.

### 3.1 Step semantics

- Compound blocks unroll to **atomic worksheet steps**:
  `basket_move_fill_right` → `move right` + `fill` (2 cells in the program
  grid). This matches the alternating arrow/⚡ rhythm in the reference.
- A **plain** `basket_move_*` → a single `move` step (arrow, no ⚡).
- **`basket_set_fill_color` — [CONFIRMED policy].** A *leading* setcolor
  (before any drawing) folds into `initial_fill_color`. A *mid-program*
  setcolor is recorded as a `{op:"setcolor"}` step **and raises a warning**:
  the worksheet has a single fill glyph and cannot depict multiple colors, so
  multi-color sketches are effectively out of scope for this exercise. (The app
  itself renders them fine.)
- **`basket_set_start` mid-program** (a cursor teleport after drawing began) is
  recorded as `{op:"setstart", ring, col}` with a warning — it has no glyph but
  the answer key needs it to reproduce subsequent cell positions.
- **Loops** unroll in place (§2.2). `basket_show_grid` / `_hide_grid` /
  `basket_animate` are no-ops for a static sheet.

---

## 4. Glyph mapping (Program panel)

| Step op | Glyph | Legend text |
|---|---|---|
| `move right` | → | Move One Cell RIGHT |
| `move down` | ↓ | Move One Cell DOWN |
| `move left` | ← | Move One Cell LEFT |
| `move up` | ↑ | Move One Cell UP |
| `fill` | ⚡ (double-slash bolt) | Fill-In Square with Color |

"Right/left/up/down" are the cursor's **grid** directions, not screen
directions — see §5.1. Program grid: 10 columns (headers 0–9) × 10 rows
(labels 0, 10, … 90), START star marks the first cell. Programs longer than
100 atomic steps trigger a warning (`parser.py` / SPEC §4).

---

## 5. Geometry conventions — **[CONFIRMED]**

All angles are in **degrees** — `setup` calls `angleMode(DEGREES)`
(`bloecke_p5funktionen.js:28`), so every `cos`/`sin`/`rotate` in `BasketGrid`
is degree-based. Screen coordinates are p5 default (x→right, y→**down**), so
**increasing angle sweeps clockwise** on screen. Derived geometry is computed
in `updateDerivedGeometry` (`runtime_basketgrid.js:70-81`):

```
centerX, centerY = width/2, height/2
radius           = 0.45 * min(width, height)
wedgeAngleDeg    = 360 / symmetry
wedgeStartDeg    = -90 - wedgeAngleDeg/2      # active wedge centered at top (12 o'clock)
ringWidth        = radius / (rings + 1)       # +1 reserves an empty center ring
colAngleDeg      = wedgeAngleDeg / localCols  # localCols = grid.columns (per wedge)
```

A cell `(ring, col)` occupies (`drawPolarCell:83-127`):

```
innerR = (ring + 1) * ringWidth              # logical ring 0 = 2nd physical ring
outerR = (ring + 2) * ringWidth
a1     = wedgeStartDeg + col * colAngleDeg
a2     = a1 + colAngleDeg
```

Its center (for the START star / cursor) is (`drawCursor:248-254`):

```
r_center     = (ring + 1.5) * ringWidth
angle_center = wedgeStartDeg + (col + 0.5) * colAngleDeg
```

1. **Direction semantics — [CONFIRMED]** (`applyMove:367-389`). `up` = `ring+1`
   (outward, toward the rim); `down` = `ring-1` (inward, toward center);
   `right` = `col+1` (increasing angle ⇒ **clockwise** on screen); `left` =
   `col-1` (counterclockwise). Directions are angle-relative *within the
   top-centered wedge*, and — because replication is pure rotation (§5.3) —
   the same convention holds in every copy.

2. **Start cell — [CONFIRMED].** Default cursor is `ring 0, col 0`
   (`runtime:21-22`; reset on `setGrid` via `resetCursorAndCells:280-285`).
   `basket_set_start` sets it from 1-based UI values to 0-based, clamped to the
   grid (`applySetStart:356-357`; block gen `:108-111`). For the lightning
   sample (symmetry 6, so `wedgeAngle=60`, `wedgeStart=-120`, `colAngle=10`),
   the default start `(0,0)` sits at `angle_center = -120 + 5 = -115°` — i.e.
   **25° counterclockwise of 12 o'clock (up-and-to-the-left)**, on the
   innermost drawable ring.

   > **⚠ CONTRADICTION with draft §5.2 — resolved via `reference.png`.** The
   > draft says the reference star "sits just clockwise of vertical." Per the
   > code, `col 0` is always the **counterclockwise** edge of the top-centered
   > wedge. In `reference.png` the two markers are *distinct*: the decorative
   > **START HERE** label-star floats at the top of the page slightly right of
   > the vertical centerline, while the **actual start-cell marker** (the small
   > cursor at the hub) sits at the counterclockwise edge of the top wedge — as
   > the code predicts. So the draft described the *label* position, not the
   > start cell. The generator places the label-star near top-center and draws
   > the true start marker at `ir.start` (default `col 0`, CCW edge).

3. **Symmetry replication — [CONFIRMED]: pure rotation, no mirror.**
   `drawFilledCells:129-161` draws the wedge's filled cells `symmetry` times,
   each rotated by `i * wedgeAngleDeg` about the center. There is **no**
   reflection or alternating flip.

   > **⚠ CONTRADICTION with draft §5.3.** The draft hypothesized basketry
   > patterns "often alternate (mirror)." The app does **pure rotation**. Dashed
   > red spokes mark the `symmetry` wedge boundaries.

4. **Radial spacing — [CONFIRMED]: linear.** `ringWidth` is constant =
   `radius/(rings+1)`, `radius = 0.45·min(w,h)` (`:74, 79`). **Not**
   area-compensated. The inner hub is a single **empty center ring** of width
   `ringWidth` (logical ring 0 starts at physical ring 1, since
   `innerR=(ring+1)·ringWidth`). There are `rings` drawable rings (0…rings-1)
   plus that empty center; the outer edge of ring `rings-1` reaches `radius`.

5. **Wrapping / clamping — [CONFIRMED]: wrap ON by default.** (`applyMove:380-387`.)
   With `wrapEdges` true (default), **both** axes wrap modulo:
   `col mod localCols`, `ring mod rings` — a toroidal wedge. So `up` past the
   outer ring returns to `ring 0`; `right` past the wedge's last column returns
   to `col 0`. With wrapping off (via `basket_wrap_edges` checked), both axes
   **clamp** to `[0, rings-1]` / `[0, localCols-1]`. The answer key must honor
   `ir.wrap_edges`. *(For the lightning sample the path never crosses a
   boundary, so wrap vs. clamp is moot there — but the flag still matters in
   general.)*

6. **Base-grid styling — [CONFIRMED]: the app draws NO alternating cell
   shading.** `drawGrid:163-246` renders, on top of the solid background:
   concentric ring circles (black, α≈35), full-circle radial spokes (black,
   α≈28, one per *total* column), **dashed red symmetry-boundary spokes**
   (α≈204 on the active wedge's two borders, α≈70 elsewhere), a translucent
   **wash** over the non-active wedges (the background color at α≈0.33), and a
   small center dot.

   > **⚠ CONTRADICTION with draft §5.6 — refined via `reference.png`.** The
   > draft read the outer wedges as a deliberate cream/white "woven-basket"
   > texture. Inspecting `reference.png`, that texture is actually **the motif
   > itself, replicated `symmetry` times, with the non-active wedges dimmed by
   > the wash** — there is *no* separate per-cell shading rule. This corrects my
   > own earlier guess: the wash should be **kept, not dropped**. Faithful
   > worksheet recipe (matches the reference):
   >
   > - Fill the active (top) wedge's cells at the true fill color; fill every
   >   rotated copy the same, then lay the background-colored wash (α≈0.33) over
   >   all **non-active** wedges so the wedge the student programs stands out.
   > - Draw **all** `symmetry` wedge boundaries as dashed red; the active
   >   wedge's two borders slightly stronger (as the app/reference do).
   > - The solid **gray center hub disk** (radius ≈ `ringWidth`, the empty
   >   center ring) is a worksheet-template addition — the app draws only a tiny
   >   center dot. Reproduce the gray disk to match the reference.
   > - Thin gray concentric rings + full radial spokes as the graph-paper grid.

---

## 6. Worksheet page spec (from `Fret` reference)

`reference.png` is the **Fret** sketch (a *different* program — tan fill, its
own motif) used purely as a **layout template**. Lightning's page will use the
same composition with lightning's geometry/colors. Top-to-bottom:

- **Page:** US Letter, portrait (612×792 pt).
- **Title:** top-left, large italic serif (e.g. "Fret" / "Lightning"). Sketch
  name humanized from filename — the app exports **no** title/metadata sidecar
  (§8.5); allow a `--title` override.
- **START HERE:** small italic caps label + yellow 5-point **outline star**,
  centered above the pattern (slightly right of the vertical centerline, per
  the reference). This is decorative; the *true* start cell is marked in the
  pattern at `ir.start` (§5.2).
- **"Pattern"** — bold sans label at the left margin, aligned with the top of
  the circle.
- **Pattern panel:** full polar grid as **SVG** (crisp print linework — do not
  screenshot the p5 canvas). Per §5: thin gray concentric rings + radial
  spokes; **dashed red** boundaries on all `symmetry` wedges (active pair
  stronger); filled cells in the fill color with the **wash** dimming
  non-active wedges; solid **gray center-hub disk**; small start-cursor marker
  at `ir.start`. No separate base cell-shading (§5.6).
- **"Program"** — bold sans label at the left margin.
- **Legend row:** the five glyphs (→ ↓ ← ↑ ⚡) each with a two-line caption
  (§4), centered above the program grid. The fill glyph is the double-slash
  lightning bolt.
- **Program panel:** 10×10 grid. `Step` label; column headers **0–9**; row
  labels **0,10,…,90**; a yellow **star in the step-0 cell**. Each used step
  shows its glyph; unused cells blank. >100 steps → warning (§4).
- **Modes** (`--mode`): `key` (both panels filled), `blank-program` (pattern
  given, empty program grid for the student to write), `blank-pattern` (program
  given, empty grid for the student to draw).

---

## 7. Pipeline

```
*.p5xml ──parse──▶ IR (JSON) ──render──▶ pattern.svg + program.svg ──layout──▶ worksheet.pdf
```

- `parser.py` — XML → IR. Pure stdlib. **[Phase 1 — done, unit-tested]**
- `render.py` — IR → SVG (`svgwrite`), geometry ported verbatim from §5.
  **[Phase 2 — done]**
- `layout.py` — compose the page + emit PDF (`reportlab`, drawn directly from
  the same geometry module so SVG and PDF cannot diverge; no Cairo).
  **[Phase 3 — done]**
- CLI `make_worksheet.py INPUT.p5xml [--mode key|blank-program|blank-pattern|all]
  [--out DIR] [--no-svg]`. **[Phase 3 — done]**

Tested with `python -m pytest` (24 cases across `test_parser.py` +
`test_render.py`). See `worksheets/README.md` for setup/usage.

---

## 8. Open questions — **[RESOLVED]**

1. **Full basket vocabulary + toolbox** — resolved (§2.1). The draft table was
   missing `basket_show_grid`, `basket_hide_grid`, `basket_set_start`,
   `basket_wrap_edges`, `basket_animate`, the plain moves, and `move_fill_left`
   / `move_fill_down`.
2. **Geometry conventions** — all resolved (§5), with three contradictions
   flagged (start angle, rotation-not-mirror, base shading).
3. **Loops exposed?** Yes (§2.2). Policy: unroll literal `controls_repeat_ext`
   and `controls_for`; warn on `controls_whileUntil` / `controls_if`. A later
   worksheet series could introduce an explicit repeat notation instead of
   unrolling.
4. **Multi-color policy** — resolved (§3.1): single-glyph worksheet; fold
   leading setcolor, warn on mid-program color.
5. **Canonical title/metadata?** No. The `.p5xml` is raw Blockly XML with no
   title, author, or date. Worksheets self-title by humanizing the filename
   (`basketGrid_lightning_00` → "Lightning"); allow a `--title`/prompt override
   in the CLI.
