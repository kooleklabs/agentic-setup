const cp = require('node:child_process');

jest.mock('node:child_process');

const { openPlanPR, cleanupPlanBranch } = require('../gh-plan-pr.js');

beforeEach(() => jest.clearAllMocks());

const baseOpts = {
  cwd: '/tmp/repo',
  slug: 'browse-books',
  planFilePath: 'docs/plans/browse-books.md',
  planTitle: 'Browse books',
  issueNumber: 42,
  base: 'main',
  draft: true,
  repoName: 'o/r',
};

// Canned responses in the order the production code calls them.
function stubFreshSequence() {
  cp.spawnSync
    .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref: branch doesn't exist
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // checkout -b
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git add
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git commit
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git push
    .mockReturnValueOnce({ status: 0, stdout: 'https://github.com/o/r/pull/7\n', stderr: '' }); // gh pr create
}

describe('openPlanPR', () => {
  test('happy path — creates branch, commits, pushes, opens draft PR', () => {
    stubFreshSequence();
    const r = openPlanPR(baseOpts);
    expect(r).toEqual({ prNumber: 7, url: 'https://github.com/o/r/pull/7', branch: 'plan/browse-books' });
    expect(cp.spawnSync).toHaveBeenCalledTimes(6);
  });

  test('fails fast when the local branch already exists (one spawn call)', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });
    expect(() => openPlanPR(baseOpts)).toThrow(/already exists locally/);
    expect(cp.spawnSync).toHaveBeenCalledTimes(1);
  });

  test('omits --draft when draft is false', () => {
    stubFreshSequence();
    openPlanPR({ ...baseOpts, draft: false });
    const prCall = cp.spawnSync.mock.calls[5];
    const [, args] = prCall;
    expect(args).toContain('pr');
    expect(args).toContain('create');
    expect(args).not.toContain('--draft');
  });

  test('includes --draft by default', () => {
    stubFreshSequence();
    openPlanPR(baseOpts);
    const [, args] = cp.spawnSync.mock.calls[5];
    expect(args).toContain('--draft');
  });

  test('cleans up local branch when git push fails', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // checkout
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // add
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // commit
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'remote rejected' }) // push fails
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // cleanup: checkout -
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // cleanup: branch -D

    expect(() => openPlanPR(baseOpts)).toThrow(/remote rejected|remote branch/);
    // Cleanup attempted: total 7 spawns (up to and incl. the two cleanup calls)
    expect(cp.spawnSync).toHaveBeenCalledTimes(7);
    const cleanupCalls = cp.spawnSync.mock.calls.slice(5);
    expect(cleanupCalls[0][1]).toContain('checkout');
    expect(cleanupCalls[1][1]).toContain('branch');
    expect(cleanupCalls[1][1]).toContain('-D');
  });

  test('throws with guidance when gh pr create fails', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // checkout
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // add
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // commit
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // push
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'GraphQL: draft PRs disabled' });
    expect(() => openPlanPR(baseOpts)).toThrow(/draft PRs disabled|gh pr failed/);
  });

  test('passes --base, --title, and includes --body with Issue reference', () => {
    stubFreshSequence();
    openPlanPR(baseOpts);
    const [, args] = cp.spawnSync.mock.calls[5];
    expect(args).toContain('--base');
    expect(args[args.indexOf('--base') + 1]).toBe('main');
    expect(args).toContain('--title');
    expect(args[args.indexOf('--title') + 1]).toBe('plan: Browse books');
    const bodyIdx = args.indexOf('--body');
    expect(bodyIdx).toBeGreaterThan(-1);
    expect(args[bodyIdx + 1]).toContain('#42');
    expect(args[bodyIdx + 1]).toContain('docs/plans/browse-books.md');
  });
});

describe('cleanupPlanBranch', () => {
  test('best-effort deletes local branch and remote branch for the slug', () => {
    cp.spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });
    cleanupPlanBranch({ cwd: '/tmp/repo', slug: 'browse-books' });
    expect(cp.spawnSync).toHaveBeenCalledTimes(3);
    const calls = cp.spawnSync.mock.calls.map(([cmd, args]) => ({ cmd, args }));
    expect(calls[0].args).toEqual(expect.arrayContaining(['checkout', '-']));
    expect(calls[1].args).toEqual(expect.arrayContaining(['branch', '-D', 'plan/browse-books']));
    expect(calls[2].args).toEqual(expect.arrayContaining(['push', 'origin', '--delete', 'plan/browse-books']));
  });

  test('does not throw when any of the git commands fails (best-effort)', () => {
    cp.spawnSync.mockReturnValue({ status: 1, stdout: '', stderr: 'branch not found' });
    expect(() => cleanupPlanBranch({ cwd: '/tmp/repo', slug: 'missing' })).not.toThrow();
  });
});
