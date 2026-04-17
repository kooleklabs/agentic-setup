const { spawnSync } = require('node:child_process');

function parseRemoteUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/.]+)(?:\.git)?\/?$/);
  if (m) return { owner: m[1], repo: m[2] };
  m = url.match(/^git@github\.com:([^/]+)\/([^/.]+)(?:\.git)?$/);
  if (m) return { owner: m[1], repo: m[2] };
  return null;
}

function detectGithubRepo() {
  const r = spawnSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(
      'No GitHub origin detected. Run `git init` and add a GitHub remote first.\n' +
      `(git remote get-url origin exited ${r.status}: ${(r.stderr || '').trim()})`
    );
  }
  const url = (r.stdout || '').trim();
  const parsed = parseRemoteUrl(url);
  if (!parsed) {
    throw new Error(
      `Origin is not GitHub (found: ${url}). This tool targets GitHub. Use your host's native tooling instead.`
    );
  }
  return parsed;
}

module.exports = { detectGithubRepo, parseRemoteUrl };
