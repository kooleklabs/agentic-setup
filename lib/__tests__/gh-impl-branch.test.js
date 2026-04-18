const cp = require('node:child_process');

jest.mock('node:child_process');

const {
  createImplBranch,
  commitImplChanges,
  checkImplBranchPreflight,
} = require('../gh-impl-branch.js');

beforeEach(() => jest.clearAllMocks());

const baseOpts = { cwd: '/tmp/repo', slug: 'browse-books', base: 'main' };

describe('createImplBranch', () => {
  test('happy path: clean tree, no local/remote branch → checks out base then creates impl branch', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git status --porcelain (empty = clean)
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref: branch doesn't exist locally
      .mockReturnValueOnce({ status: 2, stdout: '', stderr: '' }) // ls-remote: exit 2 = branch doesn't exist remotely
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // checkout main
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // checkout -b impl/browse-books

    const r = createImplBranch(baseOpts);
    expect(r).toEqual({ branch: 'impl/browse-books' });
    expect(cp.spawnSync).toHaveBeenCalledTimes(5);
    const checkoutNew = cp.spawnSync.mock.calls[4][1];
    expect(checkoutNew).toContain('-b');
    expect(checkoutNew).toContain('impl/browse-books');
  });

  test('dirty working tree → throws before any branch operations', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: ' M file.js\n', stderr: '' }); // porcelain non-empty
    expect(() => createImplBranch(baseOpts)).toThrow(/uncommitted changes|clean/i);
    expect(cp.spawnSync).toHaveBeenCalledTimes(1);
  });

  test('local branch already exists → throws with delete guidance', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // clean
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // show-ref: branch exists (status 0)
    expect(() => createImplBranch(baseOpts)).toThrow(/already exists locally/);
    expect(cp.spawnSync).toHaveBeenCalledTimes(2);
  });

  test('remote branch already exists → throws with delete-remote guidance', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // clean
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref: no local
      .mockReturnValueOnce({ status: 0, stdout: 'abc123  refs/heads/impl/browse-books\n', stderr: '' }); // ls-remote: found
    expect(() => createImplBranch(baseOpts)).toThrow(/already exists on origin/);
    expect(cp.spawnSync).toHaveBeenCalledTimes(3);
  });
});

describe('checkImplBranchPreflight', () => {
  test('returns {branch} without any checkout side effect when pre-flight passes', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // status --porcelain clean
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // show-ref: no local
      .mockReturnValueOnce({ status: 2, stdout: '', stderr: '' }); // ls-remote: no remote
    const r = checkImplBranchPreflight({ cwd: '/tmp/repo', slug: 'browse-books' });
    expect(r).toEqual({ branch: 'impl/browse-books' });
    expect(cp.spawnSync).toHaveBeenCalledTimes(3);
    // No checkout / branch-creating command fired
    const cmdNames = cp.spawnSync.mock.calls.map(([, args]) => args[0]);
    expect(cmdNames).not.toContain('checkout');
  });

  test('dirty tree still throws', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: ' M file.js\n', stderr: '' });
    expect(() => checkImplBranchPreflight({ cwd: '/tmp/repo', slug: 'x' }))
      .toThrow(/uncommitted changes/i);
  });
});

describe('commitImplChanges', () => {
  const commitOpts = { cwd: '/tmp/repo', slug: 'browse-books', issueNumber: 42, featureName: 'Browse books' };

  test('stages, commits, and returns SHA when there are changes', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git add
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' }) // git diff --cached --quiet: non-zero = has staged
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git commit
      .mockReturnValueOnce({ status: 0, stdout: 'deadbeef0000000\n', stderr: '' }); // git rev-parse HEAD
    const r = commitImplChanges(commitOpts);
    expect(r.sha).toBe('deadbeef0000000');
    const commitCall = cp.spawnSync.mock.calls[2][1];
    expect(commitCall).toContain('commit');
    const msgIdx = commitCall.indexOf('-m');
    expect(msgIdx).toBeGreaterThan(-1);
    expect(commitCall[msgIdx + 1]).toContain('wip(impl):');
    expect(commitCall[msgIdx + 1]).toContain('Browse books');
    expect(commitCall[msgIdx + 1]).toContain('#42');
  });

  test('git add excludes node_modules, dist, build, coverage, .env (safety net)', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // nothing staged so we short-circuit
    commitImplChanges(commitOpts);
    const addArgs = cp.spawnSync.mock.calls[0][1];
    expect(addArgs).toContain('add');
    expect(addArgs.some((a) => a === ':(exclude)node_modules')).toBe(true);
    expect(addArgs.some((a) => a === ':(exclude)dist')).toBe(true);
    expect(addArgs.some((a) => a === ':(exclude)build')).toBe(true);
    expect(addArgs.some((a) => a === ':(exclude)coverage')).toBe(true);
    expect(addArgs.some((a) => a === ':(exclude).env')).toBe(true);
  });

  test('returns {sha: null} when nothing is staged (agent made no changes)', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // add -A
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // diff --cached --quiet: 0 = nothing staged
    const r = commitImplChanges(commitOpts);
    expect(r).toEqual({ sha: null });
    expect(cp.spawnSync).toHaveBeenCalledTimes(2);
  });
});
