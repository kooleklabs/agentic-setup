const { spawnSync } = require('node:child_process');

function runCmd(cmd, args, opts) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...(opts || {}) });
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(`${cmd} not found on PATH.`);
  }
  if (r.status !== 0) {
    const stderr = (r.stderr || '').trim();
    throw new Error(`${cmd} ${args[0]} failed (exit ${r.status}): ${stderr || '(no stderr)'}`);
  }
  return r.stdout || '';
}

function branchExistsLocally(branch, cwd) {
  const r = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], { encoding: 'utf8', cwd });
  return r.status === 0;
}

function bestEffort(cmd, args, cwd) {
  try {
    spawnSync(cmd, args, { encoding: 'utf8', cwd });
  } catch (_) { /* intentional: cleanup must not mask the original error */ }
}

function buildPRBody({ slug, issueNumber }) {
  const planPath = `docs/plans/${slug}.md`;
  return [
    `Generated plan for Issue #${issueNumber}.`,
    '',
    `See [\`${planPath}\`](${planPath}).`,
    '',
    'Review and merge this PR before implementing.',
    '',
    `Refs #${issueNumber}.`,
  ].join('\n');
}

function openPlanPR({ cwd, slug, planFilePath, planTitle, issueNumber, base = 'main', draft = true }) {
  const branch = `plan/${slug}`;

  if (branchExistsLocally(branch, cwd)) {
    throw new Error(
      `Branch ${branch} already exists locally. ` +
      `Delete it (\`git branch -D ${branch}\`) or re-run against a different Issue.`
    );
  }

  runCmd('git', ['checkout', '-b', branch], { cwd });

  try {
    runCmd('git', ['add', planFilePath], { cwd });
    runCmd('git', ['commit', '-m', `plan: ${slug}`], { cwd });
  } catch (err) {
    bestEffort('git', ['checkout', '-'], cwd);
    bestEffort('git', ['branch', '-D', branch], cwd);
    throw err;
  }

  try {
    runCmd('git', ['push', '-u', 'origin', branch], { cwd });
  } catch (err) {
    bestEffort('git', ['checkout', '-'], cwd);
    bestEffort('git', ['branch', '-D', branch], cwd);
    throw new Error(
      `${err.message}\n` +
      `Hint: if the remote branch already exists, delete it with \`git push origin :${branch}\`.`
    );
  }

  const prArgs = [
    'pr', 'create',
    '--base', base,
    '--title', `plan: ${planTitle}`,
    '--body', buildPRBody({ slug, issueNumber }),
  ];
  if (draft) prArgs.push('--draft');

  const prOutput = runCmd('gh', prArgs, { cwd });
  const url = prOutput.trim();
  const match = url.match(/\/pull\/(\d+)/);
  if (!match) {
    throw new Error(`Could not parse PR number from gh output: ${url}`);
  }

  return { prNumber: Number(match[1]), url, branch };
}

module.exports = { openPlanPR };
