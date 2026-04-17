const { spawnSync } = require('node:child_process');
const { extractMarkers } = require('./marker');

const INSTALL_MSG = 'gh CLI not found. Install from https://cli.github.com then run `gh auth login`.';

function runGh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(INSTALL_MSG);
  }
  if (r.status !== 0) {
    const stderr = (r.stderr || '').trim();
    throw new Error(`gh ${args[0]} failed (exit ${r.status}): ${stderr || '(no stderr)'}`);
  }
  return r.stdout || '';
}

function checkGhAvailable() {
  const r = spawnSync('gh', ['auth', 'status'], { encoding: 'utf8' });
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(INSTALL_MSG);
  }
  if (r.status !== 0) {
    throw new Error('gh is not authenticated. Run `gh auth login` first.');
  }
}

function listOpenIssuesWithMarkers({ owner, repo }) {
  const stdout = runGh([
    'api',
    '-X', 'GET',
    `repos/${owner}/${repo}/issues`,
    '-f', 'state=open',
    '-f', 'per_page=100',
  ]);
  const issues = JSON.parse(stdout);
  return issues
    .filter((i) => !i.pull_request)
    .map((i) => ({
      number: i.number,
      title: i.title,
      markers: extractMarkers(i.body || ''),
    }))
    .filter((i) => i.markers.length > 0);
}

function listMilestones({ owner, repo }) {
  const stdout = runGh([
    'api',
    '-X', 'GET',
    `repos/${owner}/${repo}/milestones`,
    '-f', 'state=open',
    '-f', 'per_page=100',
  ]);
  const milestones = JSON.parse(stdout);
  return milestones.map((m) => ({ number: m.number, title: m.title }));
}

function createMilestone({ owner, repo, title, description }) {
  const args = [
    'api',
    '-X', 'POST',
    `repos/${owner}/${repo}/milestones`,
    '-f', `title=${title}`,
  ];
  if (description) args.push('-f', `description=${description}`);
  const stdout = runGh(args);
  const parsed = JSON.parse(stdout);
  return { number: parsed.number, title: parsed.title };
}

function createIssue({ owner, repo, title, body, milestone }) {
  const args = [
    'issue', 'create',
    '--repo', `${owner}/${repo}`,
    '--title', title,
    '--body', body,
  ];
  if (milestone !== undefined && milestone !== null && milestone !== '') {
    args.push('--milestone', String(milestone));
  }
  const stdout = runGh(args);
  const url = stdout.trim();
  const m = url.match(/\/issues\/(\d+)(?:$|\D)/);
  if (!m) {
    throw new Error(`Could not parse issue number from gh output: ${url}`);
  }
  return { number: Number(m[1]), url };
}

function updateIssue({ owner, repo, number, body }) {
  return runGh([
    'api',
    '-X', 'PATCH',
    `repos/${owner}/${repo}/issues/${number}`,
    '-f', `body=${body}`,
  ]);
}

module.exports = {
  checkGhAvailable,
  listOpenIssuesWithMarkers,
  listMilestones,
  createMilestone,
  createIssue,
  updateIssue,
};
