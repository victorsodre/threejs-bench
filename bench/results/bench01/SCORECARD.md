# Scorecard — Medieval village at golden hour

_Generated 2026-08-16T00:19:34.997Z · GL renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`_

> Composite = requirements 50% · performance 30% · correctness 20%. Performance is graded against fixed budgets (draw calls, load time). FPS is reported for information only and is **not** scored — it is meaningless without a known GPU (a headless run uses software rendering).

## Ranking

| Rank | Model | Scene | Composite | Grade | Requirements | Performance | Correctness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Claude Fable 5 | `claude` | **97** | A | 100% (13/13) | 89 | 100 |
| 2 | GPT 5.6 Sol | `gpt` | **97** | A | 100% (13/13) | 92 | 100 |
| 3 | Grok 4.5 | `grok` | **77** | B | 100% (13/13) | 23 | 100 |
| 4 | Grok 4.6 | `grok4.6` | **75** | B | 100% (13/13) | 17 | 100 |

## Raw metrics

| Scene | three | Draws/frame | Triangles/frame | Load (ms) | First draw (ms) | Render FPS¹ | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `claude` | 0.170.0 | 1531 | 189,496 | 691 | 820 | 0.8 | 0 |
| `gpt` | 0.185.1 | 1268 | 181,513 | 821 | 370 | 1 | 0 |
| `grok` | 0.170.0 | 3856 | 407,761 | 10005 | 1214 | 0.7 | 0 |
| `grok4.6` | 0.170.0 | 3586 | 426,577 | 11829 | 2148 | 0.3 | 0 |

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
