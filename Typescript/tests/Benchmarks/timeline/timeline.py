#!/usr/bin/env python3
"""Kernel timeline data: raw runs (raw.jsonl from run-timeline.sh) -> docs/Benchmarks/data/kernel-timeline.json.

  timeline.py build  --raw RAW --out JSON [--machine TEXT] [--node TEXT] [--note TEXT]
      Rebuild the whole file from one interleaved run (every build in builds.json that has runs in RAW).
  timeline.py append --raw RAW --json JSON --build ID [--tolerance 0.15]
      Add one new build (described in builds.json) from a run that also re-measured >= 2 builds already in
      JSON (the anchors). If an anchor's median moved more than --tolerance on a main series, the machine is
      not comparable to the stored run: nothing is written, re-run all builds and use `build`.
  timeline.py annotate --json JSON
      Reload annotations.json (and the series list) into JSON without touching any number.
  timeline.py steps  --json JSON
      Print the change between consecutive builds per series (helps writing annotations).
Only measured values are written; a build/series without runs is left out, never interpolated.
"""
import argparse, json, os, statistics as st, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
# key, name, benchmark, what, expected k (None = no k check), shape (1-4 or 5-11), default visible, warmup flag
SERIES = [
    ("fanout2000_write", "Eager fan-out, 2,000 deps", "Extreme Fan-Out", "one write to master, 2,000 dependents recomputed (write only, p50 of 60)", 2000, "5-11", True, False),
    ("b6_1000", "#6 fan-out 1,000", "#6", "write + read, p50 of 120", 1000, "5-11", False, False),
    ("b6_5000", "#6 fan-out 5,000", "#6", "write + read, p50 of 120", 5000, "5-11", True, False),
    ("b7_1000_steady", "#7 steady, 1,000 nodes", "#7", "[i] broadcast formula, steady write + read, mean of 80", 1000, "5-11", True, False),
    ("b10_eager_1000_write", "#10 eager write, 1,000", "#10", "eager mode, write only, p50 of 150", 1000, "5-11", True, False),
    ("b9_public", "#9 public read, 600", "#9", "lazy, write + read on the public plane, p50 of 120", None, "5-11", False, False),
    ("b9_secret", "#9 secret read, 600", "#9", "lazy, write + read on a secret branch, p50 of 120", None, "5-11", True, False),
    ("b11_secret_read", "#11 secret first read, 600", "#11", "lazy, first read after a write on a secret branch, p50 of 120", None, "5-11", True, False),
    ("single_write", "Steady single write, 2,000", "#3 shape", "one input of an [i] formula, write + read, p50 of 350 after 50 warm-up writes", None, "1-4", True, False),
    ("plain_write", "Plain write (no formula)", "#3 shape", "write to a path no formula reads, p50 of 350", None, "1-4", False, False),
    ("first_write", "First write after build (1-4 style)", "#1-4", "the first write after building 2,000 nodes, one sample per run: dominated by first-write warm-up (lazy compile/JIT), not per-write cost", None, "1-4", False, True),
]
MAIN = ["fanout2000_write", "b6_5000", "b10_eager_1000_write", "b9_secret", "single_write"]
# 3.9.1 resolves references wrongly in the 5-11 shapes and recomputes nothing there (published 5-11 baseline is 2a173b7).
NOT_COMPARABLE = {"1bc5227": ("5-11", "3.9.1 has the reference-resolution bug in these shapes and recomputes nothing (k = 2 or none), so its time is not the same work")}

def load_raw(path):
    runs = {}
    for line in open(path):
        line = line.strip()
        if line:
            r = json.loads(line); runs.setdefault(r["label"], []).append(r)
    return runs

def agg(runs):
    out = {}
    for key, *_ in SERIES:
        vals = [r["m"][key] for r in runs if r["m"].get(key) is not None]
        if not vals: continue
        ks = [r["m"].get(key + ":k") for r in runs]
        ks = [k for k in ks if k is not None]
        out[key] = {"ms": round(st.median(vals), 4), "min": round(min(vals), 4), "max": round(max(vals), 4), "n": len(vals)}
        if ks: out[key]["k"] = st.median(ks)
    return out

def mark(bid, values):
    for key, name, bench, what, k, shape, vis, warm in SERIES:
        v = values.get(key)
        if not v: continue
        nc = NOT_COMPARABLE.get(bid)
        if nc and nc[0] == shape: v["comparable"] = False; v["why"] = nc[1]
        elif k is not None and v.get("k") is not None and v["k"] != k: v["comparable"] = False; v["why"] = f"k = {v['k']}, expected {k}"
    return values

def series_meta():
    return [{"key": k, "name": n, "benchmark": b, "what": w, "k": kk, "shape": s, "visible": vis, "warmup": warm} for k, n, b, w, kk, s, vis, warm in SERIES]

def builds_meta():
    return {b["id"]: b for b in json.load(open(os.path.join(HERE, "builds.json")))["builds"]}

def annotations():
    p = os.path.join(HERE, "annotations.json")
    return json.load(open(p))["annotations"] if os.path.exists(p) else []

def write(doc, path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    json.dump(doc, open(path, "w"), indent=1, ensure_ascii=False); open(path, "a").write("\n")

def cmd_build(a):
    runs, meta = load_raw(a.raw), builds_meta()
    order = [bid for bid in meta if bid in runs]
    rounds = max(r["round"] for rr in runs.values() for r in rr)
    ats = sorted(r["at"] for rr in runs.values() for r in rr)
    doc = {
        "_doc": "Kernel timeline: one row per build, medians over interleaved rounds on one machine. Generated by "
                "Typescript/tests/Benchmarks/timeline/timeline.py from raw runs of timeline.mjs; edit builds.json / "
                "annotations.json there and regenerate, do not hand-edit numbers. How to add a version: "
                "Typescript/tests/Benchmarks/timeline/README.md.",
        "generated": datetime.date.today().isoformat(),
        "run": {"machine": a.machine, "node": a.node, "rounds": rounds, "from": ats[0], "to": ats[-1],
                "method": "run-timeline.sh: every round runs each build once in a fresh node process, in a shuffled order; value = median over rounds (min/max kept).",
                "harness": "Typescript/tests/Benchmarks/timeline/timeline.mjs", "note": a.note},
        "baseline": "Relative values divide by the first comparable build of each series: 3.9.1 for single writes (1-4 shapes), 4.0.2 + ref fix (2a173b7) for fan-out and secret series (5-11 shapes), because 3.9.1 skips that recompute.",
        "series": series_meta(),
        "builds": [{**meta[bid], "values": mark(bid, agg(runs[bid]))} for bid in order],
        "annotations": annotations(),
    }
    write(doc, a.out); print(f"wrote {a.out}: {len(order)} builds, {rounds} rounds")

def cmd_append(a):
    doc, runs, meta = json.load(open(a.json)), load_raw(a.raw), builds_meta()
    if a.build not in meta: sys.exit(f"{a.build} is not in builds.json: describe it there first")
    if a.build not in runs: sys.exit(f"no runs for {a.build} in {a.raw}")
    have = {b["id"]: b for b in doc["builds"]}
    anchors = [bid for bid in runs if bid in have and bid != a.build]
    if len(anchors) < 2: sys.exit("need >= 2 anchor builds already in the file, re-measured in the same run (e.g. 3.9.1 or 2a173b7 and the latest release)")
    bad = []
    for bid in anchors:
        new = agg(runs[bid])
        for key in MAIN:
            o, n = have[bid]["values"].get(key), new.get(key)
            if o and n and abs(n["ms"] / o["ms"] - 1) > a.tolerance: bad.append(f"{bid} {key}: stored {o['ms']} ms, now {n['ms']} ms")
    if bad:
        print("anchors moved more than ±%d%%, not appending (different machine/load?):" % (a.tolerance * 100)); print("\n".join(bad))
        sys.exit("re-run every build with run-timeline.sh and use `timeline.py build`")
    entry = {**meta[a.build], "values": mark(a.build, agg(runs[a.build])),
             "appended": {"raw": os.path.basename(a.raw), "anchors": anchors, "rounds": max(r["round"] for r in runs[a.build])}}
    doc["builds"] = [b for b in doc["builds"] if b["id"] != a.build]
    ids = list(meta)  # keep builds.json order
    doc["builds"].append(entry); doc["builds"].sort(key=lambda b: ids.index(b["id"]) if b["id"] in ids else 1e9)
    doc["series"] = series_meta(); doc["annotations"] = annotations()
    write(doc, a.json); print(f"appended {a.build} (anchors {', '.join(anchors)} within ±{a.tolerance:.0%})")

def cmd_annotate(a):
    doc = json.load(open(a.json)); doc["annotations"] = annotations(); doc["series"] = series_meta()
    write(doc, a.json); print(f"{len(doc['annotations'])} annotations written to {a.json}")

def cmd_steps(a):
    doc = json.load(open(a.json)); B = doc["builds"]
    for key, name, *_ in SERIES:
        print(f"\n{name}")
        prev = None
        for b in B:
            v = b["values"].get(key)
            if not v or v.get("comparable") is False: continue
            ch = "" if prev is None else f"{(v['ms'] / prev['ms'] - 1) * 100:+6.1f}%" + ("  *" if v["min"] > prev["max"] or v["max"] < prev["min"] else "")
            print(f"  {b['label'][:24]:24} {v['ms']:10.4f}  [{v['min']:.4f}..{v['max']:.4f}] {ch}")
            prev = v

p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = p.add_subparsers(dest="cmd", required=True)
b = sp.add_parser("build"); b.add_argument("--raw", required=True); b.add_argument("--out", required=True)
b.add_argument("--machine", default=""); b.add_argument("--node", default=""); b.add_argument("--note", default="")
ap = sp.add_parser("append"); ap.add_argument("--raw", required=True); ap.add_argument("--json", required=True); ap.add_argument("--build", required=True); ap.add_argument("--tolerance", type=float, default=0.15)
s = sp.add_parser("steps"); s.add_argument("--json", required=True)
an = sp.add_parser("annotate"); an.add_argument("--json", required=True)
a = p.parse_args(); {"build": cmd_build, "append": cmd_append, "steps": cmd_steps, "annotate": cmd_annotate}[a.cmd](a)
