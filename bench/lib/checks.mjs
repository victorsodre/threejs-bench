// Requirement checks come in three kinds:
//   - source:  a predicate over the scene's HTML source (deterministic).
//   - runtime: a predicate over the measured runtime metrics.
//   - manual:  listed for completeness but not auto-scored (needs a human or a
//              VLM judge). These are reported, never counted as pass/fail.
//
// Each check id used by a bench spec must exist in SOURCE_CHECKS or
// RUNTIME_CHECKS below. Keeping checks conservative and honest matters more
// than pretending to auto-verify things (like "12+ houses") that cannot be
// reliably detected without scene cooperation.

const has = (src, re) => re.test(src);

export const SOURCE_CHECKS = {
  shadows_enabled: {
    label: 'Shadows enabled',
    test: (src) => has(src, /shadowMap|castShadow/),
  },
  high_res_shadows: {
    label: 'High-resolution shadow maps (>=2048)',
    test: (src) => {
      const m = src.match(/mapSize[.\s]*(?:\.set\(|=|\.width\s*=)\s*(\d+)/i);
      return m ? Number(m[1]) >= 2048 : false;
    },
  },
  atmospheric_fog: {
    label: 'Atmospheric fog',
    test: (src) => has(src, /new\s+THREE\.Fog(Exp2)?|\.fog\s*=/),
  },
  cinematic_tone_mapping: {
    label: 'Cinematic tone mapping',
    test: (src) => has(src, /ToneMapping/),
  },
  bloom_postprocessing: {
    label: 'Bloom / post-processing',
    test: (src) => has(src, /UnrealBloomPass|EffectComposer|BloomPass|postprocessing/i),
  },
  procedural_textures: {
    label: 'Procedural textures (canvas/shader)',
    test: (src) => has(src, /CanvasTexture|createElement\(\s*['"]canvas['"]\s*\)|ShaderMaterial|onBeforeCompile/),
  },
  instanced_geometry: {
    label: 'Instanced geometry',
    test: (src) => has(src, /InstancedMesh|instanceMatrix/),
  },
  orbit_controls: {
    label: 'Orbital camera controls',
    test: (src) => has(src, /OrbitControls/),
  },
  no_downloaded_assets: {
    label: 'No downloaded 3D/texture assets',
    // Fails if the source references external binary asset files (glb/gltf/hdr/
    // exr/image files) over http(s). data: URIs and CDN script modules are fine.
    test: (src) => !has(src, /https?:\/\/[^"')\s]+\.(glb|gltf|hdr|exr|ktx2?|fbx|obj|jpe?g|png|webp)\b/i),
  },
};

export const RUNTIME_CHECKS = {
  renders_without_error: {
    label: 'Renders with no runtime errors',
    test: (m) => m.consoleErrors.length === 0 && m.pageErrors.length === 0,
  },
  geometry_present: {
    label: 'Substantial geometry (>10k triangles/frame)',
    test: (m) => m.trianglesPerFrame > 10000,
  },
  render_loop_active: {
    label: 'Continuous render loop (draws in both halves of window)',
    // Draws in two disjoint halves of the window prove the scene keeps
    // rendering (an animation loop), not a single one-shot render at load.
    // Robust even under slow software rendering with few total frames.
    test: (m) => m.drawsFirstHalf > 0 && m.drawsSecondHalf > 0,
  },
  interactive_first_draw: {
    label: 'First draw under 5s',
    test: (m) => m.timeToFirstDrawMs != null && m.timeToFirstDrawMs < 5000,
  },
  warm_lighting: {
    label: 'Warm golden-hour sky (pixel-verified)',
    test: (m) => !!(m.pixels && m.pixels.warm),
  },
  // NOTE: available but not enabled by default in bench01 — a single
  // software-rendered, fogged frame suppresses bright pixels, so this is an
  // unreliable gate. The `bloom_postprocessing` source check covers the
  // requirement; `brightFraction` is still reported in metrics for info.
  emissive_highlights: {
    label: 'Emissive highlights / bloom (bright pixels present)',
    test: (m) => !!(m.pixels && m.pixels.brightFraction > 0.001),
  },
  varied_shading: {
    label: 'Varied shading, not flat color (luma stddev > 25)',
    test: (m) => !!(m.pixels && m.pixels.lumaStdDev > 25),
  },
};

export const runSourceChecks = (ids, src) =>
  ids.map((id) => {
    const c = SOURCE_CHECKS[id];
    if (!c) return { id, label: id, kind: 'source', pass: false, error: 'unknown check' };
    return { id, label: c.label, kind: 'source', pass: !!c.test(src) };
  });

export const runRuntimeChecks = (ids, metrics) =>
  ids.map((id) => {
    const c = RUNTIME_CHECKS[id];
    if (!c) return { id, label: id, kind: 'runtime', pass: false, error: 'unknown check' };
    return { id, label: c.label, kind: 'runtime', pass: !!c.test(metrics) };
  });
