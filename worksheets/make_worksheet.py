#!/usr/bin/env python3
"""
make_worksheet.py -- parse -> render -> PDF, end to end.

    python make_worksheet.py INPUT.p5xml [--mode key|blank-program|blank-pattern]
                             [--out DIR] [--no-svg]

Produces (in --out, default = alongside INPUT):
    <stem>_<mode>.pdf                      the worksheet
    <stem>_<mode>.pattern.svg              (unless --no-svg)
    <stem>_<mode>.program.svg              (unless --no-svg)

Warnings (over-100-step programs, unknown blocks/ops, missing grid) are printed
loudly to stderr -- nothing fails silently.
"""

import argparse
import sys
from pathlib import Path

import parser as p5parser
import render
import layout

MODES = ("key", "blank-program", "blank-pattern")


def make(input_path, mode="key", out_dir=None, write_svg=True):
    ir = render.load_ir(input_path)
    out_dir = Path(out_dir) if out_dir else Path(input_path).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(ir.get("source", input_path)).stem

    for w in render.collect_warnings(ir):
        print(f"  ! WARNING [{stem}/{mode}]: {w}", file=sys.stderr)
    if ir.get("grid") is None:
        raise SystemExit(f"  ! FATAL: {stem} has no grid; cannot render a pattern.")

    outputs = []
    if write_svg:
        pat = out_dir / f"{stem}_{mode}.pattern.svg"
        prog = out_dir / f"{stem}_{mode}.program.svg"
        render.render_pattern(ir, mode).saveas(str(pat))
        render.render_program(ir, mode).saveas(str(prog))
        outputs += [pat, prog]

    pdf = out_dir / f"{stem}_{mode}.pdf"
    layout.build_worksheet(ir, pdf, mode)
    outputs.append(pdf)
    return outputs


def main(argv=None):
    ap = argparse.ArgumentParser(description="Blockly .p5xml -> worksheet PDF")
    ap.add_argument("input", help="INPUT.p5xml (or an .ir.json)")
    ap.add_argument("--mode", default="key", choices=MODES + ("all",),
                    help="which worksheet variant (default: key). 'all' = every mode")
    ap.add_argument("--out", default=None, help="output directory")
    ap.add_argument("--no-svg", action="store_true", help="PDF only, skip SVGs")
    args = ap.parse_args(argv)

    modes = MODES if args.mode == "all" else (args.mode,)
    for mode in modes:
        for out in make(args.input, mode, args.out, not args.no_svg):
            print(f"  -> {out}")


if __name__ == "__main__":
    main()
