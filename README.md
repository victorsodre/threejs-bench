# threejs-bench

Reproducible evaluations of one-shot, AI-generated Three.js scenes.

This repository records browser-based 3D evaluations by [@ovictor](https://x.com/ovictor). Each model receives the same one-shot prompt and returns one self-contained Three.js HTML file. The published scene is the original output: no follow-up generation, manual cleanup, or substituted assets. Known defects remain documented alongside the output.

## Method

The prompt is identical for every model ([PROMPT.md](./PROMPT.md)). Each run consists of a single response without follow-ups or regeneration. The output must be one HTML file using Three.js via CDN, with scene geometry expressed in code and procedural textures. Generation time and observed defects are recorded, while the returned file is preserved unchanged.

## Bench 01 — Medieval village at golden hour

Prompt: [PROMPT.md](./PROMPT.md). It is retained in its original PT-BR form as part of the experimental record.

| Model | Generation time | Live demo | Notes |
|---|---|---|---|
| Claude Fable 5 | 5 min | [run it](https://victorsodre.github.io/threejs-bench/claude/) | Best overall balance of the original run |
| Grok 4.5 | 3 min | [run it](https://victorsodre.github.io/threejs-bench/grok/) | Fastest generation |
| GPT 5.6 Sol | 30 min | [run it](https://victorsodre.github.io/threejs-bench/gpt/) | Most detailed scene — and by far the slowest |
| Grok 4.6 | 7 min | [run it](https://victorsodre.github.io/threejs-bench/grok4.6/) | Added on release day (2026-08-12). Big jump in lighting and textures. Known defects: object placement, decal-looking water, windmill blades clipping the tower |

Full generation recordings and defect notes are available in the original threads:

- Bench 01 — Claude × Grok 4.5 × GPT: https://x.com/ovictor/status/2087174144840405380
- Grok 4.5 → 4.6, same prompt, one day apart: https://x.com/ovictor/status/2087603794678808980

## Run locally

Download any folder's `index.html` and double-click it. No build, no server — that's rule number one of the benchmark.

## Measure the scenes

Eyeballing is subjective. The [`bench/`](./bench) folder has an optional harness that loads each scene in a fixed headless viewport and reports objective, reproducible numbers — draw calls and triangles per frame, load time, runtime errors — auto-verifies the deterministic parts of the prompt checklist, and generates a [scorecard](./bench/results/bench01/SCORECARD.md). Browse the same numbers in the [HTML scorecard](https://victorsodre.github.io/threejs-bench/bench/). It never touches the published scenes.

```bash
cd bench && npm install && npm run bench
```

## Why publish the raw outputs

The source files, prompt, and measured results are public so readers can inspect the procedure and evaluate the scenes independently. The model outputs remain unedited benchmark artifacts.

---

By Victor Sodré · [@ovictor](https://x.com/ovictor)
