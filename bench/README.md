# bench — measurement harness & scorecard

A reproducible harness for the `threejs-bench` scenes. It loads each scene in a
fixed headless Chrome viewport, instruments WebGL to count **draw calls** and
**triangles per frame**, records **load time** and **runtime errors**, captures
a **screenshot** from a fixed camera, auto-verifies the deterministic parts of
the prompt's requirement checklist, and produces a **scorecard**.

The published scenes stay exactly as they are — single self-contained HTML
files with no build. This tool is optional developer tooling and lives entirely
under `bench/`.

## Why these metrics

Human eyeballing is subjective and single-viewpoint. This harness adds an
objective, auditable layer:

- **Draw calls / triangles per frame** — hardware-independent complexity, hooked
  straight from the WebGL draw entry points, so it works for any scene without
  cooperation. (Community guidance: aim for well under a few hundred draw calls.)
- **Load time & time-to-first-draw** — startup cost of procedural generation.
- **Correctness gate** — the run fails a scene that logs runtime errors.
- **Requirement coverage** — deterministic source + runtime checks (see below).

> **FPS is deliberately not scored.** Without a known GPU it is not comparable —
> a headless/CI machine renders with software WebGL (SwiftShader). Run on real
> target hardware if you want meaningful frame rates; the harness still reports
> FPS for information.

## Usage

```bash
cd bench
npm install                 # installs puppeteer-core (uses your local Chrome)
npm run bench               # measure all scenes + generate the scorecard
# or step by step:
npm run run                 # writes results/<bench>/metrics.json + screenshots
npm run scorecard           # writes results/<bench>/SCORECARD.md + scorecard.json
```

`puppeteer-core` does not download a browser. The harness auto-detects Google
Chrome / Chromium in the usual locations; override with:

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run bench
```

Select a specific bench (default `bench01`):

```bash
node run.mjs --bench bench01 && node scorecard.mjs --bench bench01
```

## Layout

```
bench/
  run.mjs            # harness: serve → load → measure → screenshot → checks → metrics.json
  scorecard.mjs      # metrics.json → SCORECARD.md + scorecard.json
  benches/
    bench01.json     # bench definition: scenes + requirement checklist
  lib/
    server.mjs       # tiny static file server (serves the repo root)
    chrome.mjs       # Chrome executable resolver
    instrument.mjs   # in-page WebGL instrumentation
    checks.mjs       # source + runtime requirement checks
  results/
    bench01/         # generated: metrics.json, scorecard.json, SCORECARD.md, *.png
```

## Adding a bench

Create `benches/<id>.json` with the scene folders and the requirement ids to
check, then run `node run.mjs --bench <id>`. Requirement ids must exist in
`lib/checks.mjs` (`SOURCE_CHECKS` / `RUNTIME_CHECKS`); anything that can't be
auto-detected reliably (e.g. "12+ houses", art direction) goes under `manual`
and is listed in the scorecard for a human or VLM judge.

## Limitations & honest notes

- Draw-call counts include post-processing full-screen passes (bloom, output) —
  consistent across scenes, but not identical to `renderer.info.render.calls`.
- Source checks are pattern-based; they confirm an API is *used*, not that it is
  used well.
- Counting scene objects (houses, stalls) reliably needs scene cooperation
  (exposing the scene graph) or a VLM judge — those stay in the manual list.
