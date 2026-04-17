const { spawnSync } = require('node:child_process');

const INSTALL_MSG = 'gh CLI not found. Install from https://cli.github.com.';

function detectDefaultBranch({ owner, repo }) {
  const r = spawnSync('gh', [
    'repo', 'view',
    `${owner}/${repo}`,
    '--json', 'defaultBranchRef',
    '-q', '.defaultBranchRef.name',
  ], { encoding: 'utf8' });

  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(INSTALL_MSG);
  }
  if (r.status !== 0) {
    const stderr = (r.stderr || '').trim();
    throw new Error(`gh repo view failed (exit ${r.status}): ${stderr || '(no stderr)'}`);
  }
  return (r.stdout || '').trim();
}

module.exports = { detectDefaultBranch };
