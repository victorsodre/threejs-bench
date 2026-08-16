#!/usr/bin/env node
// Generates a scorecard from results/<benchId>/metrics.json.
//
// The composite score is intentionally simple and transparent — every input is
// a raw, auditable number emitted by run.mjs. Weights:
//   requirements 50% · performance 30% · correctness 20%
//
// Performance is graded against fixed budgets (draw calls and load time) rather
// than the cohort, so scores are stable across runs and hardware. FPS is NOT
// scored: without a known GPU it is not comparable (a headless CI uses software
// rendering), so it is reported for information only.
//
// Usage: node scorecard.mjs [--bench bench01]
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};

const WEIGHTS = { requirements: 0.5, performance: 0.3, correctness: 0.2 };
const DRAW_BUDGET = { best: 500, worst: 5000 };
const LOAD_BUDGET = { best: 2000, worst: 12000 };

const lerpScore = (value, best, worst) => {
  if (value <= best) return 100;
  if (value >= worst) return 0;
  return Math.round(((worst - value) / (worst - best)) * 100);
};

const grade = (score) => {
  const s = Math.round(score);
  return s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F';
};

const scoreScene = (m) => {
  const checks = [...m.sourceChecks, ...m.runtimeChecks];
  const passed = checks.filter((c) => c.pass).length;
  const requirements = checks.length ? (passed / checks.length) * 100 : 0;

  const drawScore = lerpScore(m.drawCallsPerFrame, DRAW_BUDGET.best, DRAW_BUDGET.worst);
  const loadScore = lerpScore(m.loadMs, LOAD_BUDGET.best, LOAD_BUDGET.worst);
  const performance = (drawScore + loadScore) / 2;

  const errorCount = m.consoleErrors.length + m.pageErrors.length;
  const correctness = errorCount === 0 ? 100 : 0;

  const composite =
    requirements * WEIGHTS.requirements +
    performance * WEIGHTS.performance +
    correctness * WEIGHTS.correctness;

  return {
    scene: m.scene,
    model: m.model,
    passed,
    total: checks.length,
    requirements: Math.round(requirements),
    drawScore,
    loadScore,
    performance: Math.round(performance),
    correctness,
    composite: Math.round(composite),
    grade: grade(composite),
  };
};

const bar = (n, total) => `${n}/${total}`;

const main = async () => {
  const benchId = arg('bench', 'bench01');
  const dir = join(__dirname, 'results', benchId);
  const data = JSON.parse(await readFile(join(dir, 'metrics.json'), 'utf8'));
  const spec = JSON.parse(await readFile(join(__dirname, 'benches', `${benchId}.json`), 'utf8'));

  const scored = data.scenes.map(scoreScene).sort((a, b) => b.composite - a.composite);

  const L = [];
  L.push(`# Scorecard — ${data.title}`);
  L.push('');
  L.push(`_Generated ${data.measuredAt} · GL renderer: \`${data.glRenderer}\`_`);
  L.push('');
  L.push(
    '> Composite = requirements 50% · performance 30% · correctness 20%. ' +
      'Performance is graded against fixed budgets (draw calls, load time). ' +
      'FPS is reported for information only and is **not** scored — it is meaningless without a known GPU ' +
      '(a headless run uses software rendering).'
  );
  L.push('');

  // Ranking
  L.push('## Ranking');
  L.push('');
  L.push('| Rank | Model | Scene | Composite | Grade | Requirements | Performance | Correctness |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  scored.forEach((s, i) => {
    L.push(
      `| ${i + 1} | ${s.model} | \`${s.scene}\` | **${s.composite}** | ${s.grade} | ` +
        `${s.requirements}% (${bar(s.passed, s.total)}) | ${s.performance} | ${s.correctness} |`
    );
  });
  L.push('');

  // Raw metrics
  L.push('## Raw metrics');
  L.push('');
  L.push('| Scene | three | Draws/frame | Triangles/frame | Load (ms) | First draw (ms) | Render FPS¹ | Errors |');
  L.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const m of data.scenes) {
    const errs = m.consoleErrors.length + m.pageErrors.length;
    L.push(
      `| \`${m.scene}\` | ${m.threeVersion} | ${m.drawCallsPerFrame} | ${m.trianglesPerFrame.toLocaleString()} | ` +
        `${m.loadMs} | ${m.timeToFirstDrawMs ?? 'n/a'} | ${m.renderFps} | ${errs} |`
    );
  }
  L.push('');
  L.push('¹ Software-rendered in headless CI; relative only, not target-hardware FPS.');
  L.push('');

  // Requirement matrix
  const sceneCols = data.scenes.map((m) => m.scene);
  L.push('## Auto-verified requirements');
  L.push('');
  L.push(`| Requirement | Kind | ${sceneCols.map((s) => `\`${s}\``).join(' | ')} |`);
  L.push(`| --- | --- | ${sceneCols.map(() => '---').join(' | ')} |`);
  const allChecks = [...spec.requirements.source.map((id) => ['source', id]), ...spec.requirements.runtime.map((id) => ['runtime', id])];
  for (const [kind, id] of allChecks) {
    const cells = data.scenes.map((m) => {
      const c = [...m.sourceChecks, ...m.runtimeChecks].find((x) => x.id === id);
      return c ? (c.pass ? '✅' : '❌') : '—';
    });
    const label = data.scenes[0][kind === 'source' ? 'sourceChecks' : 'runtimeChecks'].find((x) => x.id === id)?.label || id;
    L.push(`| ${label} | ${kind} | ${cells.join(' | ')} |`);
  }
  L.push('');

  // Manual checklist
  L.push('## Manual review checklist (not auto-scored)');
  L.push('');
  L.push('These require a human or VLM judge with a fixed camera path; counts and art direction cannot be reliably auto-detected without scene cooperation.');
  L.push('');
  for (const item of spec.requirements.manual) L.push(`- [ ] ${item}`);
  L.push('');

  const md = L.join('\n');
  await writeFile(join(dir, 'SCORECARD.md'), md);
  await writeFile(join(dir, 'scorecard.json'), JSON.stringify({ bench: benchId, generatedAt: data.measuredAt, scored }, null, 2));

  console.log(md);
  console.log(`\nWrote ${join('results', benchId, 'SCORECARD.md')} and scorecard.json`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
