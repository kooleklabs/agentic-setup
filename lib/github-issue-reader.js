const { spawnSync } = require('node:child_process');
const { extractMarkers } = require('./marker.js');

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

function parseFeatureIssueBody(body) {
  const text = body || '';

  const featureMarker = extractMarkers(text).find((m) => m.type === 'feature');
  const markerSlug = featureMarker ? featureMarker.slug : null;

  const acceptanceCriteria = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*-\s+((?:Given|When|Then|And)\b.*)$/);
    if (m) acceptanceCriteria.push(m[1].trim());
  }

  const apiPaths = [];
  const pathRe = /\/api\/[A-Za-z0-9/_{}:-]+/g;
  let pm;
  while ((pm = pathRe.exec(text)) !== null) {
    if (!apiPaths.includes(pm[0])) apiPaths.push(pm[0]);
  }

  const adrRefs = [];
  const adrRe = /docs\/decisions\/(\d{3,})-([a-z0-9-]+)\.md/g;
  let am;
  while ((am = adrRe.exec(text)) !== null) {
    adrRefs.push({ number: am[1], slug: am[2], path: am[0] });
  }

  return { markerSlug, acceptanceCriteria, apiPaths, adrRefs };
}

function fetchFeatureIssue({ owner, repo, number }) {
  const stdout = runGh(['api', `repos/${owner}/${repo}/issues/${number}`]);
  const issue = JSON.parse(stdout);

  if (issue.pull_request) {
    throw new Error(`#${number} in ${owner}/${repo} is a pull request, not an Issue.`);
  }

  const parsed = parseFeatureIssueBody(issue.body || '');
  if (!parsed.markerSlug) {
    throw new Error(
      `Issue #${number} has no agentic-app:feature:* marker. ` +
      'This command only syncs Issues created by `push-architecture`.'
    );
  }

  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    markers: extractMarkers(issue.body || ''),
    markerSlug: parsed.markerSlug,
    acceptanceCriteria: parsed.acceptanceCriteria,
    apiPaths: parsed.apiPaths,
    adrRefs: parsed.adrRefs,
  };
}

module.exports = { parseFeatureIssueBody, fetchFeatureIssue };
