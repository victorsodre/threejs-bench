# Scorecard — Medieval village at golden hour

_Generated 2026-08-16T01:13:43.664Z · GL renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`_

> Composite = requirements 50% · performance 30% · correctness 20%. Performance is graded against fixed budgets (draw calls, load time). FPS is reported for information only and is **not** scored — it is meaningless without a known GPU (a headless run uses software rendering).

## Ranking

| Rank | Model | Scene | Composite | Grade | Requirements | Performance | Correctness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | GPT 5.6 Sol | `gpt` | **97** | A | 100% (15/15) | 92 | 100 |
| 2 | Claude Fable 5 | `claude` | **96** | A | 100% (15/15) | 88 | 100 |
| 3 | Grok 4.5 | `grok` | **79** | B | 100% (15/15) | 31 | 100 |
| 4 | Grok 4.6 | `grok4.6` | **75** | B | 100% (15/15) | 17 | 100 |

## Raw metrics

| Scene | three | Draws/frame | Triangles/frame | Load (ms) | First draw (ms) | Render FPS¹ | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claude` | 0.170.0 | 1569 | 192,288 | 618 | 741 | 0.8 | 0 |
| `gpt` | 0.185.1 | 1264 | 181,369 | 976 | 440 | 1 | 0 |
| `grok` | 0.170.0 | 3843 | 408,123 | 8508 | 610 | 0.7 | 0 |
| `grok4.6` | 0.170.0 | 3597 | 427,264 | 11701 | 2306 | 0.5 | 0 |

¹ Software-rendered in headless CI; relative only, not target-hardware FPS.

## Auto-verified requirements

| Requirement | Kind | `claude` | `gpt` | `grok` | `grok4.6` |
| --- | --- | --- | --- | --- | --- |
| No downloaded 3D/texture assets | source | ✅ | ✅ | ✅ | ✅ |
| Procedural textures (canvas/shader) | source | ✅ | ✅ | ✅ | ✅ |
| Shadows enabled | source | ✅ | ✅ | ✅ | ✅ |
| High-resolution shadow maps (>=2048) | source | ✅ | ✅ | ✅ | ✅ |
| Atmospheric fog | source | ✅ | ✅ | ✅ | ✅ |
| Cinematic tone mapping | source | ✅ | ✅ | ✅ | ✅ |
| Bloom / post-processing | source | ✅ | ✅ | ✅ | ✅ |
| Instanced geometry | source | ✅ | ✅ | ✅ | ✅ |
| Orbital camera controls | source | ✅ | ✅ | ✅ | ✅ |
| Renders with no runtime errors | runtime | ✅ | ✅ | ✅ | ✅ |
| Substantial geometry (>10k triangles/frame) | runtime | ✅ | ✅ | ✅ | ✅ |
| Continuous render loop (draws in both halves of window) | runtime | ✅ | ✅ | ✅ | ✅ |
| First draw under 5s | runtime | ✅ | ✅ | ✅ | ✅ |
| Warm golden-hour sky (pixel-verified) | runtime | ✅ | ✅ | ✅ | ✅ |
| Varied shading, not flat color (luma stddev > 25) | runtime | ✅ | ✅ | ✅ | ✅ |

## Visual quality — VLM judge

_Judge: `agent-reference (Opus vision, illustrative)` · per-image absolute rubric (1-5), independent requests to avoid position bias — reference example; run `node judge.mjs` with an API key to regenerate_

| Scene | composition | lighting | atmosphere | texture richness | postfx | Overall | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `gpt` | 4 | 5 | 5 | 3 | 4 | **4.2** | Heavy volumetric fog with a visible sun disc gives outstanding depth and a cinematic mood. |
| `grok4.6` | 3 | 5 | 3 | 4 | 5 | **4** | Dramatic low sun with strong bloom and rich plaster/wood textures, but a foreground tree crops the village. |
| `grok` | 3 | 4 | 3 | 4 | 4 | **3.6** | Warm palette, good material relief, reflective water and fireflies, but the camera sits too close for a village read. |
| `claude` | 4 | 3 | 3 | 2 | 3 | **3** | Clean, readable overview and nice horizon silhouette, but flat low-poly materials and pale, low-contrast light. |

Ranking by visual quality: `gpt` > `grok4.6` > `grok` > `claude`.

## Manual review checklist (not auto-scored)

These require a human or VLM judge with a fixed camera path; counts and art direction cannot be reliably auto-detected without scene cooperation.

- [ ] At least 12 half-timbered houses with variation
- [ ] Church with tower
- [ ] Windmill with turning blades
- [ ] Central well in a stone plaza
- [ ] Market stalls with goods
- [ ] Reflective, animated water
- [ ] Villagers walking, smoke, birds, fireflies, moving clouds
- [ ] Cohesive art direction and horizon silhouette
