#!/usr/bin/env node
/*
 * Deploy-size guardrail. One script, run in three places:
 *   - Vercel "Ignored Build Step" (vercel.json ignoreCommand, --vercel): an
 *     over-budget commit is never built or stored.
 *   - GitHub Actions (.github/workflows/deploy-budget.yml): red X on the push.
 *   - git pre-commit hook (.githooks/pre-commit): blocks the commit locally.
 *
 * It reads sizes from the git index (what is committed/staged), not the disk,
 * and treats "deployed" as: tracked files minus .vercelignore matches.
 *
 * Why: in Nov 2026 68 deployments x 223 MB of never-loaded screenshots and
 * renders filled 15 GB of Vercel Hobby deployment storage (limit 10 GB).
 * Raise a budget only after confirming the site actually loads the new files.
 */
import { execFileSync } from 'node:child_process';

const MB = 1e6;
const BUDGET = {
  deployTotal: Number(process.env.DEPLOY_BUDGET_MB || 60) * MB,   // whole deploy (now ~41 MB)
  deployFile: Number(process.env.DEPLOY_FILE_MB || 8) * MB,       // any single deployed file (largest now car.glb 5.7 MB)
  repoFile: Number(process.env.REPO_FILE_MB || 10) * MB,          // any single file committed to GitHub at all
};
const vercelMode = process.argv.includes('--vercel');

function git(args, input) {
  return execFileSync('git', args, { encoding: 'utf8', input, maxBuffer: 64 * MB });
}

function main() {
  // path -> blob sha, from the index (staged state in a hook, HEAD in CI/Vercel)
  const entries = git(['ls-files', '-s', '-z']).split('\0').filter(Boolean).map(l => {
    const [meta, path] = l.split('\t');
    return { sha: meta.split(' ')[1], path };
  });
  const sizes = new Map(git(['cat-file', '--batch-check=%(objectname) %(objectsize)'],
    entries.map(e => e.sha).join('\n') + '\n')
    .trim().split('\n').map(l => l.split(' ')).map(([s, n]) => [s, Number(n)]));
  const ignored = new Set(git(['ls-files', '-c', '-i', '--exclude-from=.vercelignore', '-z'])
    .split('\0').filter(Boolean));

  const files = entries.map(e => ({ path: e.path, size: sizes.get(e.sha) || 0, deployed: !ignored.has(e.path) }));
  const deployed = files.filter(f => f.deployed);
  const total = deployed.reduce((s, f) => s + f.size, 0);
  const repoTotal = files.reduce((s, f) => s + f.size, 0);
  const fmt = n => (n / MB).toFixed(1) + ' MB';

  const problems = [];
  if (total > BUDGET.deployTotal)
    problems.push(`Deploy is ${fmt(total)}, budget ${fmt(BUDGET.deployTotal)}.`);
  for (const f of deployed) if (f.size > BUDGET.deployFile)
    problems.push(`Deployed file ${f.path} is ${fmt(f.size)} (limit ${fmt(BUDGET.deployFile)} per file).`);
  for (const f of files) if (f.size > BUDGET.repoFile)
    problems.push(`Committed file ${f.path} is ${fmt(f.size)} (limit ${fmt(BUDGET.repoFile)} per file in GitHub).`);

  console.log(`deploy-budget: ${deployed.length} files / ${fmt(total)} deployed ` +
    `(budget ${fmt(BUDGET.deployTotal)}); ${files.length} files / ${fmt(repoTotal)} in git.`);
  if (!problems.length) return true;

  console.error('\nDEPLOY BUDGET EXCEEDED:\n  - ' + problems.join('\n  - '));
  console.error('\nLargest deployed files:');
  for (const f of deployed.sort((a, b) => b.size - a.size).slice(0, 8)) console.error(`  ${fmt(f.size).padStart(9)}  ${f.path}`);
  console.error(`
Fix: if the site does not load these files (screenshots, renders, captures,
unused models), add them to .vercelignore — or keep them out of git entirely
(Blender/, archive/ and output captures belong outside the repo). Only raise
the budget in tools/deploy-budget.mjs if the live site genuinely needs them.
See "Vercel deploy budget" in AGENTS.md.`);
  return false;
}

let ok;
try {
  ok = main();
} catch (err) {
  // Never let a broken check silently stop production deploys: on Vercel, build.
  console.error('deploy-budget: check could not run:', err.message);
  process.exit(vercelMode ? 1 : 2);
}
// Vercel ignoreCommand semantics: exit 1 = go ahead and build, exit 0 = skip build.
if (vercelMode) {
  if (!ok) console.error('\nVercel build SKIPPED to protect deployment storage.');
  process.exit(ok ? 1 : 0);
}
process.exit(ok ? 0 : 1);
