# threejs-bench

One prompt. Several AI models. Zero hand-editing.

Real-world 3D benchmarks by [@ovictor](https://x.com/ovictor). Each model gets the exact same one-shot prompt and must deliver a single self-contained Three.js HTML file. No agents, no retries, no asset downloads, no cleanup afterwards. What the model outputs is what gets published — defects included.

## Method

Same prompt, verbatim, for every model ([PROMPT.md](./PROMPT.md)). One shot: a single response, no follow-ups, no regeneration. Model only — no agent scaffolding. Output must be a single HTML file with Three.js via CDN, every model built in code and every texture generated procedurally. Generation time is recorded, honest defects are listed publicly, and the file is published unmodified.

## Bench 01 — Medieval village at golden hour

Prompt: [PROMPT.md](./PROMPT.md) (written in PT-BR — every model handled it fine).

| Model | Generation time | Live demo | Notes |
|---|---|---|---|
| Claude Fable 5 | 5 min | [run it](https://victorsodre.github.io/threejs-bench/claude/) | Best overall balance of the original run |
| Grok 4.5 | 3 min | [run it](https://victorsodre.github.io/threejs-bench/grok/) | Fastest generation |
| GPT 5.6 Sol | 30 min | [run it](https://victorsodre.github.io/threejs-bench/gpt/) | Most detailed scene — and by far the slowest |
| Grok 4.6 | 7 min | [run it](https://victorsodre.github.io/threejs-bench/grok4.6/) | Added on release day (2026-08-12). Big jump in lighting and textures. Known defects: object placement, decal-looking water, windmill blades clipping the tower |

Full video runs and honest defect lists, in the original threads:

- Bench 01 — Claude × Grok 4.5 × GPT: https://x.com/ovictor/status/2087174144840405380
- Grok 4.5 → 4.6, same prompt, one day apart: https://x.com/ovictor/status/2087603794678808980

## Run locally

Download any folder's `index.html` and double-click it. No build, no server — that's rule number one of the benchmark.

## Why publish the raw outputs

A benchmark you can't run yourself is just marketing. These files are the unedited model outputs — judge them with your own eyes.

---

by Victor Sodré · [@ovictor](https://x.com/ovictor) — código, motion e IA em público.
