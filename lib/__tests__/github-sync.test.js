jest.mock('../github-issues.js');
jest.mock('../github-repo.js');
jest.mock('../github-issue-reader.js');
jest.mock('../architecture-parser.js');
jest.mock('../plan-generator.js');
jest.mock('../gh-plan-pr.js');
jest.mock('../default-branch.js');

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
