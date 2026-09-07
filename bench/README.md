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
- **Requirement coverage** — deterministic source + runtime checks (see below),
  including pixel checks over the screenshot (warm golden-hour sky, varied
  shading) via `lib/pixels.mjs`.
- **Visual quality (optional)** — a VLM-as-judge rubric pass, kept separate from
  the composite score (see below).

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
npm run scorecard           # writes SCORECARD.md + scorecard.json + report.json
```

Open the HTML scorecard (ranking, raw metrics, requirement matrix, VLM judge) at [`index.html`](./index.html). It reads `results/<bench>/report.json`, so any new bench that the harness measures shows up there. Serve the repo over HTTP:

```bash
python3 -m http.server 8000
# then http://localhost:8000/bench/
```

On GitHub Pages: https://victorsodre.github.io/threejs-bench/bench/

The harness requires Node.js 22.12 or later. `npm test` checks the local server's
file and origin restrictions.

`puppeteer-core` does not download a browser. The harness auto-detects Google
Chrome / Chromium in the usual locations; override with:

```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run bench
```

Select a specific bench (default `bench01`):

```bash
node run.mjs --bench bench01 && node scorecard.mjs --bench bench01
```

### Visual quality (VLM judge)

`judge.mjs` scores each scene's fixed-camera screenshot against a 1–5 rubric
(composition, lighting, atmosphere, texture richness, post-fx). Each image is
judged in its own request, so there is no cross-scene position bias. Results go
to `judged.json`, which `scorecard.mjs` folds into the scorecard automatically.
It is deliberately **not** part of the composite score — treat it as a
supplementary critic.

```bash
node judge.mjs --dry-run          # write request payloads, call nothing
ANTHROPIC_API_KEY=... node judge.mjs
OPENAI_API_KEY=...    node judge.mjs --model gpt-4o
```

The committed `results/bench01/judged.json` is an illustrative reference; run
the command with an API key to regenerate it for a bench.

### Continuous integration

`.github/workflows/bench.yml` runs the harness on every push/PR, publishes the
scorecard to the job summary, and uploads results as an artifact. GitHub runners
have no GPU (software WebGL), so the same FPS caveat applies — counts,
requirement checks and the scorecard are stable; use a self-hosted GPU runner
for real frame rates.

## Layout

```
bench/
  index.html         # HTML scorecard (reads report.json)
  run.mjs            # harness: serve → load → measure → screenshot → checks → metrics.json
  judge.mjs          # optional VLM-as-judge visual-quality pass → judged.json
  scorecard.mjs      # metrics.json (+ judged.json) → SCORECARD.md + scorecard.json + report.json
  benches.json       # discovered bench ids (written by scorecard.mjs)
  benches/
    bench01.json     # bench definition: scenes + requirement checklist
  lib/
    server.mjs       # tiny static file server (serves the repo root)
    chrome.mjs       # Chrome executable resolver
    instrument.mjs   # in-page WebGL instrumentation
    pixels.mjs       # screenshot pixel statistics (sky warmth, brightness, variety)
    checks.mjs       # source + runtime requirement checks
  results/
    bench01/         # generated: metrics.json, scorecard.json, report.json, SCORECARD.md, judged.json, *.png
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
