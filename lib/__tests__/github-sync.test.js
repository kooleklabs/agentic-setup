jest.mock('../github-issues.js');
jest.mock('../github-repo.js');
jest.mock('../github-issue-reader.js');
jest.mock('../architecture-parser.js');
jest.mock('../plan-generator.js');
jest.mock('../gh-plan-pr.js');
jest.mock('../default-branch.js');
jest.mock('../plan-reader.js');
jest.mock('../impl-generator.js');
jest.mock('../gh-impl-branch.js');
jest.mock('../gh-impl-pr.js');

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const issues = require('../github-issues.js');
const repo = require('../github-repo.js');
const reader = require('../github-issue-reader.js');
const parser = require('../architecture-parser.js');
const generator = require('../plan-generator.js');
const planPR = require('../gh-plan-pr.js');
const defaultBranch = require('../default-branch.js');
const planReader = require('../plan-reader.js');
const implGen = require('../impl-generator.js');
const implBranch = require('../gh-impl-branch.js');
const implPR = require('../gh-impl-pr.js');

const { runGithubSync } = require('../github-sync.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sync-'));
}

const VALID_PLAN_BODY = [
  '## Problem statement', 'foo', '',
  '## Acceptance criteria', '- Given x', '',
  '## Approach', 'approach', '',
  '## Files to change', '- `a.js` — desc', '',
  '## Implementation steps', '1. do', '',
  '## Test plan', '- unit', '',
  '## Open questions', '- None.', '',
  '## Rollback', 'revert',
].join('\n');

const INCOMPLETE_PLAN_BODY = '## Problem statement\nfoo';

const parsedArch = {
  projectName: 'BookNook',
  features: [
    {
      name: 'Browse books',
      slug: 'browse-books',
      criteria: ['Given a visitor', 'When scrolling', 'Then books load'],
      relatedPaths: ['/api/books'],
      relatedAdrs: [{ number: '001', slug: 'pagination-strategy', path: 'docs/decisions/001-pagination-strategy.md' }],
    },
  ],
  adrs: [],
  openapiPaths: [],
};

const fetchedIssue = {
  number: 42,
  title: 'Browse books',
  body: 'issue body',
  markers: [{ type: 'feature', slug: 'browse-books' }],
  markerSlug: 'browse-books',
  acceptanceCriteria: ['Given a visitor'],
  apiPaths: ['/api/books'],
  adrRefs: [{ number: '001', slug: 'pagination-strategy', path: 'docs/decisions/001-pagination-strategy.md' }],
};

let tmp;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  tmp = mkTmp();
  // seed ADR file so loadAdrs can read it
  fs.mkdirSync(path.join(tmp, 'docs/decisions'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'docs/decisions/001-pagination-strategy.md'), '# 001 — Pagination\n\nCursor-based.');

  issues.checkGhAvailable.mockImplementation(() => {});
  issues.commentOnIssue.mockReturnValue('');
  repo.detectGithubRepo.mockReturnValue({ owner: 'kool', repo: 'booknook' });
  reader.fetchFeatureIssue.mockReturnValue(fetchedIssue);
  parser.parseArchitecture.mockReturnValue(parsedArch);
  generator.generatePlan.mockResolvedValue({ ok: true, body: VALID_PLAN_BODY });
  planPR.openPlanPR.mockReturnValue({
    prNumber: 56,
    url: 'https://github.com/kool/booknook/pull/56',
    branch: 'plan/browse-books',
  });
  planPR.cleanupPlanBranch.mockImplementation(() => {});
  defaultBranch.detectDefaultBranch.mockReturnValue('main');
  planReader.readMergedPlan.mockReturnValue({
    body: 'plan body',
    hasRequiredSections: true,
    missing: [],
  });
  implBranch.remoteBranchExists.mockReturnValue(false);
  implBranch.checkImplBranchPreflight.mockReturnValue({ branch: 'impl/browse-books' });
  implBranch.createImplBranch.mockReturnValue({ branch: 'impl/browse-books' });
  implBranch.commitImplChanges.mockReturnValue({ sha: 'abc1234def5678' });
  implGen.runImplementation.mockResolvedValue({
    ok: true,
    body: 'done',
    filesWritten: ['src/foo.js'],
    commandsRun: ['npm test'],
    costUsd: 0.17,
  });
  implPR.openImplPR.mockReturnValue({
    prNumber: 88,
    url: 'https://github.com/kool/booknook/pull/88',
  });
});
afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('runGithubSync — dry run', () => {
  test('does not call SDK, does not write plan, does not open PR', async () => {
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, dryRun: true, autoApprove: true });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(generator.generatePlan).not.toHaveBeenCalled();
    expect(planPR.openPlanPR).not.toHaveBeenCalled();
    expect(fs.existsSync(path.join(tmp, 'docs/plans/browse-books.md'))).toBe(false);
  });
});

describe('runGithubSync — fresh create', () => {
  test('generates plan, writes file, opens PR, comments on Issue', async () => {
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(true);
    expect(generator.generatePlan).toHaveBeenCalledTimes(1);
    expect(fs.existsSync(path.join(tmp, 'docs/plans/browse-books.md'))).toBe(true);
    expect(planPR.openPlanPR).toHaveBeenCalledTimes(1);
    expect(issues.commentOnIssue).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'kool', repo: 'booknook', number: 42 })
    );
    expect(r.plan.prNumber).toBe(56);
    expect(r.plan.retried).toBe(false);
  });

  test('plan file content includes the header and the LLM body', async () => {
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    const body = fs.readFileSync(path.join(tmp, 'docs/plans/browse-books.md'), 'utf8');
    expect(body).toMatch(/^# Plan: Browse books\n/);
    expect(body).toContain('Issue #42');
    expect(body).toContain('## Problem statement');
    expect(body).toContain('## Rollback');
  });
});

describe('runGithubSync — idempotency & flags', () => {
  test('fails fast when plan file already exists and --force is not set', async () => {
    fs.mkdirSync(path.join(tmp, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/plans/browse-books.md'), 'existing');
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Plan already exists.*--force/);
    expect(generator.generatePlan).not.toHaveBeenCalled();
  });

  test('--force regenerates even when plan file exists', async () => {
    fs.mkdirSync(path.join(tmp, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/plans/browse-books.md'), 'stale');
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true, force: true });
    expect(r.ok).toBe(true);
    expect(generator.generatePlan).toHaveBeenCalledTimes(1);
  });

  test('--force cleans up existing local+remote plan branch before opening a new PR', async () => {
    fs.mkdirSync(path.join(tmp, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'docs/plans/browse-books.md'), 'stale');
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true, force: true });
    expect(planPR.cleanupPlanBranch).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'browse-books' })
    );
    // Cleanup must happen before openPlanPR
    const cleanupOrder = planPR.cleanupPlanBranch.mock.invocationCallOrder[0];
    const openOrder = planPR.openPlanPR.mock.invocationCallOrder[0];
    expect(cleanupOrder).toBeLessThan(openOrder);
  });

  test('cleanupPlanBranch is NOT called without --force', async () => {
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(planPR.cleanupPlanBranch).not.toHaveBeenCalled();
  });

  test('--no-comment skips commentOnIssue', async () => {
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true, noComment: true });
    expect(issues.commentOnIssue).not.toHaveBeenCalled();
  });

  test('--issue required — returns clean error when missing', async () => {
    const r = await runGithubSync({ cwd: tmp, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/--issue.*required/i);
  });
});

describe('runGithubSync — base branch auto-detect', () => {
  test('no --base flag: auto-detects default branch and passes it to openPlanPR', async () => {
    defaultBranch.detectDefaultBranch.mockReturnValue('master');
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(defaultBranch.detectDefaultBranch).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'kool', repo: 'booknook' })
    );
    expect(planPR.openPlanPR).toHaveBeenCalledWith(
      expect.objectContaining({ base: 'master' })
    );
  });

  test('explicit --base overrides auto-detect (detectDefaultBranch NOT called)', async () => {
    await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true, base: 'develop' });
    expect(defaultBranch.detectDefaultBranch).not.toHaveBeenCalled();
    expect(planPR.openPlanPR).toHaveBeenCalledWith(
      expect.objectContaining({ base: 'develop' })
    );
  });

  test('detectDefaultBranch error surfaces as {ok: false, error}', async () => {
    defaultBranch.detectDefaultBranch.mockImplementation(() => {
      throw new Error('gh repo view failed: Not Found');
    });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Not Found/);
  });
});

describe('runGithubSync — error paths', () => {
  test('slug mismatch: Issue marker slug not in architecture.md features', async () => {
    reader.fetchFeatureIssue.mockReturnValue({ ...fetchedIssue, markerSlug: 'orphan-feature' });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/orphan-feature.*architecture\.md|push-architecture/);
    expect(generator.generatePlan).not.toHaveBeenCalled();
  });

  test('reader error (e.g., Issue has no marker) surfaces cleanly', async () => {
    reader.fetchFeatureIssue.mockImplementation(() => {
      throw new Error('Issue #42 has no agentic-app:feature:* marker.');
    });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/marker/);
  });

  test('SDK error: returns {ok: false, error}', async () => {
    generator.generatePlan.mockResolvedValue({ ok: false, error: 'rate limited' });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/rate limited/);
    expect(planPR.openPlanPR).not.toHaveBeenCalled();
  });
});

describe('runGithubSync — truncation retry', () => {
  test('truncated first response triggers one retry; second success returns retried: true', async () => {
    generator.generatePlan
      .mockResolvedValueOnce({ ok: true, body: INCOMPLETE_PLAN_BODY })
      .mockResolvedValueOnce({ ok: true, body: VALID_PLAN_BODY });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(true);
    expect(r.plan.retried).toBe(true);
    expect(generator.generatePlan).toHaveBeenCalledTimes(2);
  });

  test('truncated twice: returns {ok: false, error: "truncated..."} and does not open PR', async () => {
    generator.generatePlan.mockResolvedValue({ ok: true, body: INCOMPLETE_PLAN_BODY });
    const r = await runGithubSync({ cwd: tmp, issueNumber: 42, autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/truncated|missing/);
    expect(generator.generatePlan).toHaveBeenCalledTimes(2);
    expect(planPR.openPlanPR).not.toHaveBeenCalled();
  });
});

describe('runGithubSync — --execute mode', () => {
  test('routes to execute branch: creates impl branch, runs implementation, commits, comments', async () => {
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(true);
    expect(implBranch.createImplBranch).toHaveBeenCalledTimes(1);
    expect(implGen.runImplementation).toHaveBeenCalledTimes(1);
    expect(implBranch.commitImplChanges).toHaveBeenCalledTimes(1);
    expect(issues.commentOnIssue).toHaveBeenCalledTimes(1);
    expect(r.impl.branch).toBe('impl/browse-books');
    expect(r.impl.sha).toBe('abc1234def5678');
    // plan-mode collaborators should NOT run
    expect(generator.generatePlan).not.toHaveBeenCalled();
    expect(planPR.openPlanPR).not.toHaveBeenCalled();
  });

  test('missing plan file: readMergedPlan throws → {ok: false, error} before any branch ops', async () => {
    planReader.readMergedPlan.mockImplementation(() => {
      throw new Error('No plan found at docs/plans/browse-books.md. Run github-sync --issue 42 first.');
    });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/No plan found/);
    expect(implBranch.createImplBranch).not.toHaveBeenCalled();
  });

  test('plan file truncated: returns clean error listing missing sections', async () => {
    planReader.readMergedPlan.mockReturnValue({
      body: 'x',
      hasRequiredSections: false,
      missing: ['## Approach', '## Rollback'],
    });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/## Approach/);
    expect(r.error).toMatch(/## Rollback/);
  });

  test('plan PR still open (remote branch exists): {ok: false, error}', async () => {
    implBranch.remoteBranchExists.mockReturnValue(true);
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/plan\/browse-books.*still exists/);
    expect(implBranch.createImplBranch).not.toHaveBeenCalled();
  });

  test('impl branch pre-flight fails (branch exists) → {ok: false, error}', async () => {
    implBranch.checkImplBranchPreflight.mockImplementation(() => {
      throw new Error('Branch impl/browse-books already exists locally.');
    });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already exists locally/);
    expect(implGen.runImplementation).not.toHaveBeenCalled();
    expect(implBranch.createImplBranch).not.toHaveBeenCalled();
  });

  test('--execute --dry-run: runs pre-flight but does NOT create branch (fixes stranded-branch bug)', async () => {
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, dryRun: true, autoApprove: true,
    });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(implBranch.checkImplBranchPreflight).toHaveBeenCalledTimes(1);
    expect(implBranch.createImplBranch).not.toHaveBeenCalled();
    expect(implGen.runImplementation).not.toHaveBeenCalled();
    expect(implBranch.commitImplChanges).not.toHaveBeenCalled();
  });

  test('SDK error during runImplementation: no commit, no Issue comment', async () => {
    implGen.runImplementation.mockResolvedValue({ ok: false, error: 'rate limited' });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/rate limited/);
    expect(implBranch.commitImplChanges).not.toHaveBeenCalled();
    expect(issues.commentOnIssue).not.toHaveBeenCalled();
  });

  test('--no-comment in execute mode skips commentOnIssue after successful commit', async () => {
    await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true, noComment: true,
    });
    expect(issues.commentOnIssue).not.toHaveBeenCalled();
  });

  test('no file changes: commit returns {sha: null}, still reports success', async () => {
    implBranch.commitImplChanges.mockReturnValue({ sha: null });
    implGen.runImplementation.mockResolvedValue({
      ok: true, body: '', filesWritten: [], commandsRun: [], costUsd: 0.01,
    });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(r.ok).toBe(true);
    expect(r.impl.sha).toBeNull();
  });

  test('--open-pr: pushes and opens PR after commit, Issue comment references PR number', async () => {
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true, openPr: true,
    });
    expect(r.ok).toBe(true);
    expect(implPR.openImplPR).toHaveBeenCalledTimes(1);
    expect(r.impl.pr).toEqual({ prNumber: 88, url: 'https://github.com/kool/booknook/pull/88' });
    const commentBody = issues.commentOnIssue.mock.calls[0][0].body;
    expect(commentBody).toContain('#88');
    expect(commentBody).toContain('https://github.com/kool/booknook/pull/88');
  });

  test('--open-pr: openImplPR failure surfaces as {ok: false, error} with commit sha preserved', async () => {
    implPR.openImplPR.mockImplementation(() => { throw new Error('push rejected: non-fast-forward'); });
    const r = await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true, openPr: true,
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/auto-PR failed.*non-fast-forward/);
    expect(r.impl.sha).toBe('abc1234def5678');
    expect(issues.commentOnIssue).not.toHaveBeenCalled();
  });

  test('--open-pr is NOT triggered when no file changes (nothing to PR)', async () => {
    implBranch.commitImplChanges.mockReturnValue({ sha: null });
    implGen.runImplementation.mockResolvedValue({
      ok: true, body: '', filesWritten: [], commandsRun: [], costUsd: 0.01,
    });
    await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true, openPr: true,
    });
    expect(implPR.openImplPR).not.toHaveBeenCalled();
  });

  test('no --open-pr flag: never calls openImplPR (default opt-out)', async () => {
    await runGithubSync({
      cwd: tmp, issueNumber: 42, execute: true, autoApprove: true,
    });
    expect(implPR.openImplPR).not.toHaveBeenCalled();
  });
});
