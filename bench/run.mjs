#!/usr/bin/env node
// Measurement harness for threejs-bench.
//
// Serves the repository over a local static server, loads each scene in a fresh
// headless Chrome page with WebGL instrumentation, measures draw calls,
// triangles, render throughput, load timing and errors over a fixed window,
// captures a screenshot from a fixed viewport, runs the deterministic source +
// runtime requirement checks, and writes per-scene JSON plus a combined
// metrics file under results/<benchId>/.
//
// Usage:
//   node run.mjs [--bench bench01]
//   CHROME_PATH=/path/to/chrome node run.mjs
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './lib/server.mjs';
import { resolveChrome } from './lib/chrome.mjs';
import { instrument, readGlInfo } from './lib/instrument.mjs';
import { runSourceChecks, runRuntimeChecks } from './lib/checks.mjs';
import { analyzeScreenshot } from './lib/pixels.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const loadBench = async (benchId) => {
  const spec = JSON.parse(await readFile(join(__dirname, 'benches', `${benchId}.json`), 'utf8'));
  return spec;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const measureScene = async (browser, baseUrl, scene, spec) => {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !/favicon/i.test(m.text())) consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('requestfailed', (r) => {
    if (!/favicon/i.test(r.url())) pageErrors.push(`requestfailed ${r.url()} ${r.failure()?.errorText || ''}`);
  });

  await page.evaluateOnNewDocument(instrument);

  const { viewport, warmupMs, measureMs } = spec.measurement;
  await page.setViewport(viewport);

  const t0 = Date.now();
  await page.goto(`${baseUrl}/${scene.folder}/`, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - t0;

  await sleep(warmupMs);
  const a = await page.evaluate(() => ({ ...window.__BENCH }));
  await sleep(measureMs / 2);
  const mid = await page.evaluate(() => ({ ...window.__BENCH }));
  await sleep(measureMs / 2);
  const b = await page.evaluate(() => ({ ...window.__BENCH }));
  const gl = await page.evaluate(readGlInfo);

  const dFrames = b.frames - a.frames;
  const dDraw = b.drawCalls - a.drawCalls;
  const dTris = b.triangles - a.triangles;
  const drawsFirstHalf = mid.drawCalls - a.drawCalls;
  const drawsSecondHalf = b.drawCalls - mid.drawCalls;
  const secs = measureMs / 1000;

  const outDir = join(__dirname, 'results', spec.id);
  await mkdir(outDir, { recursive: true });
  const screenshotName = `${scene.folder.replace(/\./g, '_')}.png`;
  const shotBuf = await page.screenshot({ path: join(outDir, screenshotName) });
  const pixels = analyzeScreenshot(Buffer.from(shotBuf));

  const inPageErrors = [...(b.errors || [])];
  await page.close();

  const metrics = {
    scene: scene.folder,
    model: scene.model,
    generationTime: scene.generationTime,
    loadMs,
    timeToFirstDrawMs: a.firstDrawTs ? Math.round(a.firstDrawTs - a.startTs) : null,
    renderFps: +(dFrames / secs).toFixed(1),
    framesMeasured: dFrames,
    drawsFirstHalf,
    drawsSecondHalf,
    drawCallsPerFrame: dFrames ? Math.round(dDraw / dFrames) : 0,
    trianglesPerFrame: dFrames ? Math.round(dTris / dFrames) : 0,
    glRenderer: gl.glRenderer || 'unknown',
    canvas: gl.canvas ? `${gl.width}x${gl.height}` : 'none',
    consoleErrors,
    pageErrors: [...pageErrors, ...inPageErrors],
    screenshot: screenshotName,
    pixels,
  };

  const src = await readFile(join(REPO_ROOT, scene.folder, 'index.html'), 'utf8');
  metrics.threeVersion = (src.match(/three@([0-9.]+)/) || [])[1] || 'unknown';
  metrics.sourceBytes = Buffer.byteLength(src);
  metrics.sourceChecks = runSourceChecks(spec.requirements.source, src);
  metrics.runtimeChecks = runRuntimeChecks(spec.requirements.runtime, metrics);

  return metrics;
};

const main = async () => {
  const benchId = arg('bench', 'bench01');
  const spec = await loadBench(benchId);

  const { server, url } = await startServer(REPO_ROOT);
  const executablePath = resolveChrome();
  console.log(`Chrome:      ${executablePath}`);
  console.log(`Serving:     ${REPO_ROOT} at ${url}`);
  console.log(`Bench:       ${spec.id} — ${spec.title}\n`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const results = [];
  for (const scene of spec.scenes) {
    process.stdout.write(`Measuring ${scene.folder} … `);
    const m = await measureScene(browser, url, scene, spec);
    results.push(m);
    console.log(
      `${m.drawCallsPerFrame} draws/frame, ${Math.round(m.trianglesPerFrame / 1000)}k tris, load ${m.loadMs}ms` +
        `${m.pageErrors.length ? ` — ${m.pageErrors.length} error(s)` : ''}`
    );
  }

  await browser.close();
  server.close();

  const outDir = join(__dirname, 'results', spec.id);
  await mkdir(outDir, { recursive: true });
  const combined = {
    bench: spec.id,
    title: spec.title,
    measuredAt: new Date().toISOString(),
    glRenderer: results[0]?.glRenderer || 'unknown',
    scenes: results,
  };
  await writeFile(join(outDir, 'metrics.json'), JSON.stringify(combined, null, 2));
  console.log(`\nWrote ${join('results', spec.id, 'metrics.json')} (${results.length} scenes).`);
  console.log('Run "node scorecard.mjs" to generate the scorecard.');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
