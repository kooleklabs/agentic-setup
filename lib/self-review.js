/**
 * Lightweight pre-PR verification. Reads package.json scripts and runs
 * `npm test` / `npm run lint` (if defined). Captures exit codes for the
 * orchestrator to embed in the impl PR body.
 *
 * Currently Node/npm only. Cross-language (pytest, cargo, etc.) is
 * deferred — detect project type and dispatch later.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CHECK_SPECS = [
  { name: 'test', pkgScript: 'test', args: ['test', '--silent'] },
  { name: 'lint', pkgScript: 'lint', args: ['run', '--silent', 'lint'] },
];

function runSelfReview({ cwd }) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return { checks: [], hasFailures: false };
  }

  let scripts = {};
  try {
    scripts = (JSON.parse(fs.readFileSync(pkgPath, 'utf8')).scripts) || {};
  } catch (_) {
    return { checks: [], hasFailures: false };
  }

  const checks = [];
  for (const spec of CHECK_SPECS) {
    if (!scripts[spec.pkgScript]) continue;
    const start = Date.now();
    const r = spawnSync('npm', spec.args, { encoding: 'utf8', cwd });
    const duration = Date.now() - start;
    const exitCode = (r.error && r.error.code === 'ENOENT') ? -1 : Number(r.status || 0);
    checks.push({
      name: spec.name,
      command: `npm ${spec.args.join(' ')}`,
      status: exitCode === 0 ? 'pass' : 'fail',
      exitCode,
      duration,
    });
  }

  return {
    checks,
    hasFailures: checks.some((c) => c.status === 'fail'),
  };
}

module.exports = { runSelfReview };
