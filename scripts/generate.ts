/**
 * CLI: bun scripts/generate.ts --scale starter|full [--seed 20261022] [--out data/<scale>] [--publish]
 * Generates the dataset twice with the same seed, proves identical checksums, runs the validation suite,
 * scores detection against ground truth, and exports JSON + CSV + SQL seed + manifest.
 * --publish also copies the output into public/data (the bundled sample the app falls back to).
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_SEED, PRIORITY_WEIGHTS, SCALES, detectAnomalies, generateDataset, scoreDetection, type GeneratedDataset, type ScaleName } from '../src/generator/generate';
import { runPlanningValidationSuite } from '../src/domain/validation';

const args = process.argv.slice(2);
const arg = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const scale = (arg('scale') ?? 'starter') as ScaleName;
if (!(scale in SCALES)) throw new Error(`Unknown scale "${scale}". Use: ${Object.keys(SCALES).join(', ')}`);
const seed = Number(arg('seed') ?? DEFAULT_SEED);
const out = arg('out') ?? join('data', scale);
const publish = args.includes('--publish');

const TABLES = ['skus', 'locations', 'suppliers', 'sku_substitutes', 'bom', 'forecast_demand', 'inventory', 'supplier_capacity', 'lead_times', 'purchase_orders', 'po_events', 'pab_weekly', 'shortages', 'shortage_events', 'mitigations', 'production_plans'] as const;
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const serialise = (d: GeneratedDataset) => Object.fromEntries([...TABLES, 'ground_truth' as const].map((t) => [t, JSON.stringify(d[t])]));

const t0 = Date.now();
const runA = generateDataset(scale, seed); const runB = generateDataset(scale, seed);
const sA = serialise(runA); const sB = serialise(runB);
const checksumsA = Object.fromEntries(Object.entries(sA).map(([k, v]) => [`${k}.json`, sha(v)]));
const checksumsB = Object.fromEntries(Object.entries(sB).map(([k, v]) => [`${k}.json`, sha(v)]));
const rowCounts = Object.fromEntries([...TABLES, 'ground_truth' as const].map((t) => [t, runA[t].length]));
const reproducible = Object.keys(checksumsA).every((k) => checksumsA[k] === checksumsB[k]);
if (!reproducible) throw new Error('Reproducibility failed: checksums differ between runs.');

// Validation suite (ground truth is NOT an input: only planning tables are passed).
const v = runPlanningValidationSuite({ skus: runA.skus, locations: runA.locations, suppliers: runA.suppliers, pabRows: runA.pab_weekly, shortages: runA.shortages, mitigations: runA.mitigations, purchaseOrders: runA.purchase_orders, poEvents: runA.po_events, shortageEvents: runA.shortage_events, skuSubstitutes: runA.sku_substitutes });
const checks = [...v.cleanBaseline.map((c) => ({ ...c, group: 'CLEAN_BASELINE' as const })), ...v.injectedAnomalies.map((c) => ({ ...c, group: 'INJECTED_ANOMALY' as const }))];
const failing = checks.filter((c) => c.status === 'FAIL');
const score = scoreDetection(detectAnomalies(runA), runA.ground_truth);
const expectedChecks = new Set(runA.ground_truth.map((g) => g.expected_detection));
const unexpected = failing.filter((c) => !expectedChecks.has(c.name) && !(c.name.startsWith('Duplicate') && expectedChecks.has('PAB Weekly Reconciliation Check')));
const explained = runA.shortages.filter((s) => s.cause_code && s.source_refs.demand_id).length / Math.max(1, runA.shortages.length);
const metrics = { evaluated_at_label: `Seed ${seed} · ${scale}`, total_injected: runA.ground_truth.length, detected_count: score.tp, detection_recall: score.recall, detection_precision: score.precision, unexpected_failures: unexpected.length + score.fp, explained_shortage_share: explained };

// ---- export ----
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true }); mkdirSync(join(out, 'csv'), { recursive: true });
const csvCell = (x: unknown) => { const s = x === null || x === undefined ? '' : typeof x === 'object' ? JSON.stringify(x) : String(x); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const sqlVal = (x: unknown) => x === null || x === undefined ? 'NULL' : typeof x === 'number' || typeof x === 'boolean' ? String(x) : `'${(typeof x === 'object' ? JSON.stringify(x) : String(x)).replace(/'/g, "''")}'`;
const sql: string[] = [`-- ORYVA synthetic seed · scale=${scale} · seed=${seed}`, '-- Load into the staging schema created by docs/schema.sql', 'BEGIN;'];
for (const t of [...TABLES, 'ground_truth' as const]) {
  const rows = runA[t] as Record<string, unknown>[];
  writeFileSync(join(out, `${t}.json`), sA[t] as string);
  const cols = rows[0] ? Object.keys(rows[0]) : [];
  writeFileSync(join(out, 'csv', `${t}.csv`), [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n'));
  if (t !== 'ground_truth') for (let i = 0; i < rows.length; i += 500) sql.push(`INSERT INTO oryva_seed.${t} (${cols.join(',')}) VALUES\n${rows.slice(i, i + 500).map((r) => `(${cols.map((c) => sqlVal(r[c])).join(',')})`).join(',\n')};`);
}
sql.push('COMMIT;');
writeFileSync(join(out, 'seed.sql'), sql.join('\n'));
const manifest = { seed, generated_at_label: `Generated · Seed ${seed} · ${scale} scale`, is_fixture: false, scale, scale_config: SCALES[scale], generator_command: `bun scripts/generate.ts --scale ${scale} --seed ${seed}`, priority_weights: PRIORITY_WEIGHTS, row_counts: rowCounts, checksums: checksumsA, sources: [{ name: 'Synthetic (this generator)', license: 'MIT / original work', note: 'No external rows used. Public datasets cited for schema inspiration only (see docs/SOURCE_MANIFEST.md).' }] };
writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(out, 'validation_report.json'), JSON.stringify({ checks }, null, 2));
writeFileSync(join(out, 'evaluation_metrics.json'), JSON.stringify(metrics, null, 2));
writeFileSync(join(out, 'reproducibility.json'), JSON.stringify({ run_a: { run_label: 'Run A', seed, row_counts: rowCounts, checksums: checksumsA }, run_b: { run_label: 'Run B', seed, row_counts: rowCounts, checksums: checksumsB } }, null, 2));
writeFileSync(join(out, 'validation_summary.md'), [`# Validation summary (${scale}, seed ${seed})`, '', `Reproducible: **${reproducible ? 'YES' : 'NO'}** (two runs, ${Object.keys(checksumsA).length} files, identical SHA-256)`, '', '| Group | Check | Status | Rows | Details |', '|---|---|---|---|---|', ...checks.map((c) => `| ${c.group} | ${c.name} | ${c.status} | ${c.rows_checked} | ${c.details.slice(0, 140).replace(/\|/g, '/')} |`), '', `Ground truth: ${metrics.detected_count}/${metrics.total_injected} injected anomalies detected (recall ${metrics.detection_recall.toFixed(2)}), unexpected failures: ${metrics.unexpected_failures}.`].join('\n'));

if (publish) {
  const pub = join('public', 'data'); rmSync(pub, { recursive: true, force: true }); mkdirSync(join(pub, 'pab'), { recursive: true });
  for (const f of [...TABLES, 'ground_truth']) writeFileSync(join(pub, `${f}.json`), sA[f] as string);
  for (const f of ['manifest', 'validation_report', 'evaluation_metrics', 'reproducibility']) writeFileSync(join(pub, `${f}.json`), JSON.stringify(f === 'manifest' ? manifest : f === 'validation_report' ? { checks } : f === 'evaluation_metrics' ? metrics : { run_a: { run_label: 'Run A', seed, row_counts: rowCounts, checksums: checksumsA }, run_b: { run_label: 'Run B', seed, row_counts: rowCounts, checksums: checksumsB } }));
  const index: { sku_id: string; location_id: string; file: string; pab_rows: number; forecast_rows: number }[] = [];
  const byPair = new Map<string, { pab: unknown[]; fc: unknown[]; sku: string; loc: string }>();
  for (const r of runA.pab_weekly) { const k = `${r.sku_id}__${r.location_id}`; const e = byPair.get(k) ?? { pab: [], fc: [], sku: r.sku_id, loc: r.location_id }; e.pab.push(r); byPair.set(k, e); }
  for (const r of runA.forecast_demand) byPair.get(`${r.sku_id}__${r.location_id}`)?.fc.push(r);
  for (const [k, e] of byPair) { writeFileSync(join(pub, 'pab', `${k}.json`), JSON.stringify({ sku_id: e.sku, location_id: e.loc, pab_weekly: e.pab, forecast_demand: e.fc })); index.push({ sku_id: e.sku, location_id: e.loc, file: `${k}.json`, pab_rows: e.pab.length, forecast_rows: e.fc.length }); }
  writeFileSync(join(pub, 'pab', 'index.json'), JSON.stringify(index));
}
console.log(JSON.stringify({ scale, seed, out, reproducible, row_counts: rowCounts, metrics, failing: failing.map((c) => c.name), ms: Date.now() - t0 }, null, 2));
