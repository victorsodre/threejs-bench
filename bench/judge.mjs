#!/usr/bin/env node
// Optional visual-quality pass: a vision-language model scores each scene's
// fixed-camera screenshot against a rubric. Following current VLM-as-judge
// guidance, each image is judged in its own independent request (no cross-scene
// ordering, so no position bias), with a strict rubric and JSON-only output.
//
// Providers (auto-detected from env):
//   ANTHROPIC_API_KEY  -> Anthropic Messages API   (--model, default claude-*)
//   OPENAI_API_KEY     -> OpenAI Chat Completions   (--model, default gpt-*)
//
// Usage:
//   node judge.mjs                 # judge all scenes in the bench
//   node judge.mjs --dry-run       # write the exact request payloads, call nothing
//   node judge.mjs --bench bench01 --model <model-id>
//
// Output: results/<bench>/judged.json (scores + ranking). scorecard.mjs folds
// this in automatically if present.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && (process.argv[i + 1] === undefined || process.argv[i + 1].startsWith('--'))) return true; // boolean flag
  return i !== -1 ? process.argv[i + 1] : def;
};

export const DIMENSIONS = [
  ['composition', 'Believable village layout, framing, and horizon silhouette'],
  ['lighting', 'Warm golden-hour light, low sun, soft high-res shadows'],
  ['atmosphere', 'Fog, depth, and cohesive end-of-day mood'],
  ['texture_richness', 'Convincing procedural materials with relief; not flat color'],
  ['postfx', 'Bloom/glow on windows, lanterns, sun; cinematic tone mapping'],
];

const RUBRIC = `You are a strict, calibrated art director scoring a single rendered frame of an
AI-generated real-time 3D "medieval village at golden hour" (Three.js).

Score each dimension on an integer 1-5 scale:
5 = excellent, professional; 4 = good; 3 = acceptable; 2 = weak; 1 = poor/absent.

Dimensions:
${DIMENSIONS.map(([k, d]) => `- ${k}: ${d}`).join('\n')}

Judge ONLY what is visible in this image. Do not reward text overlays or UI.
Return STRICT JSON, no prose, exactly:
{"composition":n,"lighting":n,"atmosphere":n,"texture_richness":n,"postfx":n,"notes":"one short sentence"}`;

const buildAnthropic = (model, b64) => ({
  url: 'https://api.anthropic.com/v1/messages',
  headers: {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: {
    model,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
          { type: 'text', text: RUBRIC },
        ],
      },
    ],
  },
  parse: (j) => j.content?.[0]?.text,
});

const buildOpenAI = (model, b64) => ({
  url: 'https://api.openai.com/v1/chat/completions',
  headers: {
    'content-type': 'application/json',
    authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: {
    model,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: RUBRIC },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  },
  parse: (j) => j.choices?.[0]?.message?.content,
});

const pickProvider = (model) => {
  if (process.env.ANTHROPIC_API_KEY) return { name: 'anthropic', model: model || 'claude-3-7-sonnet-latest', build: buildAnthropic };
  if (process.env.OPENAI_API_KEY) return { name: 'openai', model: model || 'gpt-4o', build: buildOpenAI };
  return null;
};

const extractJson = (text) => {
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : null;
};

const main = async () => {
  const benchId = arg('bench', 'bench01');
  const dryRun = arg('dry-run', false) === true;
  const model = typeof arg('model', null) === 'string' ? arg('model', null) : null;

  const dir = join(__dirname, 'results', benchId);
  const data = JSON.parse(await readFile(join(dir, 'metrics.json'), 'utf8'));

  const provider = pickProvider(model);
  if (!provider && !dryRun) {
    console.error(
      'No VLM provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY, ' +
        'or run with --dry-run to write request payloads without calling an API.'
    );
    process.exit(2);
  }

  const requests = [];
  const scores = [];
  for (const s of data.scenes) {
    const png = await readFile(join(dir, s.screenshot));
    const b64 = png.toString('base64');
    const req = (provider || { build: buildAnthropic, model: model || 'claude-3-7-sonnet-latest', name: 'anthropic' }).build(
      (provider || {}).model || model || 'claude-3-7-sonnet-latest',
      b64
    );

    if (dryRun) {
      // Redact the giant base64 blob so the payload is inspectable.
      const preview = JSON.parse(JSON.stringify(req.body));
      const c = preview.messages[0].content;
      for (const part of c) {
        if (part.source?.data) part.source.data = `<base64 png ${png.length} bytes>`;
        if (part.image_url?.url) part.image_url.url = `<data:image/png;base64 ${png.length} bytes>`;
      }
      requests.push({ scene: s.scene, url: req.url, body: preview });
      continue;
    }

    const res = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
    if (!res.ok) throw new Error(`${provider.name} ${res.status}: ${await res.text()}`);
    const parsed = extractJson(req.parse(await res.json()));
    if (!parsed) throw new Error(`Could not parse judge JSON for ${s.scene}`);
    const overall = +(DIMENSIONS.reduce((a, [k]) => a + Number(parsed[k] || 0), 0) / DIMENSIONS.length).toFixed(2);
    scores.push({ scene: s.scene, model: s.model, ...parsed, overall });
    process.stdout.write(`judged ${s.scene}: overall ${overall}\n`);
  }

  if (dryRun) {
    await writeFile(join(dir, 'judge.request.json'), JSON.stringify({ bench: benchId, provider: provider?.name || 'none', requests }, null, 2));
    console.log(`Dry run — wrote ${join('results', benchId, 'judge.request.json')} (${requests.length} requests, no API called).`);
    return;
  }

  const ranking = [...scores].sort((a, b) => b.overall - a.overall).map((s) => s.scene);
  const out = {
    bench: benchId,
    judge: `${provider.name}:${provider.model}`,
    method: 'per-image absolute rubric (1-5), independent requests to avoid position bias',
    dimensions: DIMENSIONS.map(([k]) => k),
    scores,
    ranking,
  };
  await writeFile(join(dir, 'judged.json'), JSON.stringify(out, null, 2));
  console.log(`Wrote ${join('results', benchId, 'judged.json')}. Re-run scorecard.mjs to include visual quality.`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
