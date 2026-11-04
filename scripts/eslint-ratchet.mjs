// Ratchet ESLint : bloque si le nombre de problèmes dépasse la baseline consignée
// dans .eslint-ratchet.json, encourage à l'abaisser quand il baisse (roadmap Q1/Q3).
// Usage : node scripts/eslint-ratchet.mjs [dossier] — lit le JSON en argv[2] ou stdin.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const target = process.argv[2] ?? '.';
const baseline = JSON.parse(fs.readFileSync('.eslint-ratchet.json', 'utf8'));

// eslint sort avec un code de sortie non nul dès qu'il y a une erreur : on capture
// la sortie quelle que soit ce code, c'est le JSON qui fait foi.
const run = spawnSync('npx', ['eslint', target, '--format', 'json'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (run.error || !run.stdout) {
  console.error(run.stderr || run.error?.message || 'aucune sortie ESLint');
  process.exit(1);
}

const results = JSON.parse(run.stdout);
const errors = results.reduce((sum, file) => sum + file.errorCount, 0);
const warnings = results.reduce((sum, file) => sum + file.warningCount, 0);

console.log(
  `ESLint ratchet : ${errors} erreurs / ${warnings} warnings (baseline ${baseline.errors} / ${baseline.warnings})`,
);

if (errors > baseline.errors) {
  console.error(
    `Ratchet dépassé : +${errors - baseline.errors} erreur(s) par rapport à la baseline. Corrigez-les ou documentez une exceptions dans .eslint-ratchet.json.`,
  );
  process.exit(1);
}

if (warnings > baseline.warnings) {
  console.warn(
    `Attention : ${warnings - baseline.warnings} warning(s) au-dessus de la baseline (non bloquant).`,
  );
}

if (errors < baseline.errors || warnings < baseline.warnings) {
  console.log(
    `Ratchet atteignable : passez .eslint-ratchet.json à { "errors": ${errors}, "warnings": ${warnings} } et commitez-le.`,
  );
}
