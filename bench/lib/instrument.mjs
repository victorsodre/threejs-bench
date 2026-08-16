// Runs in the page BEFORE any scene script. It wraps the WebGL draw entry
// points to count draw calls and triangles, tracks rendered frames via
// requestAnimationFrame, records the time of the first draw, and collects
// uncaught errors. Must be fully self-contained (no closures) so it can be
// serialized and injected with page.evaluateOnNewDocument.
export function instrument() {
  const S = {
    drawCalls: 0,
    triangles: 0,
    frames: 0,
    firstDrawTs: null,
    startTs: performance.now(),
    errors: [],
  };
  window.__BENCH = S;

  const tris = (mode, count) => {
    if (mode === 4) return count / 3; // TRIANGLES
    if (mode === 5 || mode === 6) return Math.max(0, count - 2); // STRIP / FAN
    return 0; // POINTS / LINES contribute no triangles
  };
  const markFirst = () => {
    if (S.firstDrawTs === null) S.firstDrawTs = performance.now();
  };

  const patch = (proto) => {
    if (!proto) return;
    const de = proto.drawElements;
    const da = proto.drawArrays;
    const dei = proto.drawElementsInstanced;
    const dai = proto.drawArraysInstanced;
    if (de)
      proto.drawElements = function (mode, count, type, offset) {
        S.drawCalls++;
        S.triangles += tris(mode, count);
        markFirst();
        return de.call(this, mode, count, type, offset);
      };
    if (da)
      proto.drawArrays = function (mode, first, count) {
        S.drawCalls++;
        S.triangles += tris(mode, count);
        markFirst();
        return da.call(this, mode, first, count);
      };
    if (dei)
      proto.drawElementsInstanced = function (mode, count, type, offset, inst) {
        S.drawCalls++;
        S.triangles += tris(mode, count) * inst;
        markFirst();
        return dei.call(this, mode, count, type, offset, inst);
      };
    if (dai)
      proto.drawArraysInstanced = function (mode, first, count, inst) {
        S.drawCalls++;
        S.triangles += tris(mode, count) * inst;
        markFirst();
        return dai.call(this, mode, first, count, inst);
      };
  };
  patch(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
  patch(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);

  const loop = () => {
    S.frames++;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  window.addEventListener('error', (e) => S.errors.push(String(e.message || e.error || e)));
  window.addEventListener('unhandledrejection', (e) => S.errors.push('unhandledrejection: ' + String(e.reason)));
}

// Reads the WebGL renderer/vendor and canvas size after the scene has loaded.
export function readGlInfo() {
  const c = document.querySelector('canvas');
  if (!c) return { canvas: false };
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const info = { canvas: true, width: c.width, height: c.height };
  if (gl) {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      info.glRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      info.glVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
    }
  }
  return info;
}
