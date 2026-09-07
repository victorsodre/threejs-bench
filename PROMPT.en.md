# Three.js benchmark — medieval village

This is an English translation for readers. The canonical experimental input is
[`PROMPT.md`](./PROMPT.md), which remains in its original PT-BR wording and was
provided verbatim to every model in Bench 01. This translation is explanatory
only and must not replace the source prompt in a reproduction of the recorded
run.

## English translation

Create an interactive 3D scene in Three.js: a **medieval village at golden
hour**.

Rules:

1. **One HTML file**, with no build step or server required — it must open by
   double-clicking. Three.js may be loaded from a CDN.
2. **Do not download assets** (models, textures, or HDRIs). Build every model
   in code and generate every texture procedurally (canvas or shader). Quality
   must come from code, not downloaded assets.
3. The village must include at least: **12 half-timbered houses** with variation
   (size, floors, rotation, and colour), a **church with a tower**, a **windmill
   with rotating blades**, a **central well in a stone plaza**, **market stalls
   with goods**, **a lake or river with animated reflective water**, **fences,
   trees, paths**, and **props** (barrels, a cart, hay bales).
4. **Life in the scene**: simple villagers walking through the village, chimney
   smoke, rotating windmill blades, lit lanterns, birds, fireflies at dusk, and
   moving clouds. Motion should be subtle and believable.
5. **Convincing procedural textures**: plaster, wood grain, straw, roof tile,
   stone, and grass, with bump or normal detail rather than flat colour.
6. **Golden-hour lighting**: a low, warm sun with **high-resolution soft
   shadows**, atmospheric fog, a sunset-gradient sky, and a visible sun near
   the horizon.
7. **Post-processing**: at minimum, bloom (lit windows, lanterns, and the sun
   should glow) and cinematic tone mapping.
8. An **orbital camera** (mouse/trackpad) with a slow automatic tour until the
   user interacts.
9. **Assume a powerful machine (Apple Silicon M4)**: thousands of instanced
   vegetation elements, 4K shadows, and dense geometry. Do not economize on
   detail; visual impact is an evaluation criterion.
10. Invest in **art direction**: a coherent palette, a believable village
    composition, and an appealing horizon silhouette.

Return the complete HTML, working on the first try.
