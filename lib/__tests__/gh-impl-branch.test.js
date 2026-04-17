const cp = require('node:child_process');

jest.mock('node:child_process');

const { createImplBranch, commitImplChanges } = require('../gh-impl-branch.js');

beforeEach(() => jest.clearAllMocks());

const baseOpts = { cwd: '/tmp/repo', slug: 'browse-books', base: 'main' };

describe('createImplBranch', () => {
  test('happy path: clean tree, no local/remote branch → checks out base then creates impl branch', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })                               // git status --porcelain (empty = clean)
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })                               // show-ref: branch doesn't exist locally
      .mockReturnValueOnce({ status: 2, stdout: '', stderr: '' })                               // ls-remote: exit 2 = branch doesn't exist remotely
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })                               // checkout main
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });                              // checkout -b impl/browse-books

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
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })  // clean
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // show-ref: branch exists (status 0)
    expect(() => createImplBranch(baseOpts)).toThrow(/already exists locally/);
    expect(cp.spawnSync).toHaveBeenCalledTimes(2);
  });

  test('remote branch already exists → throws with delete-remote guidance', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })                          // clean
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })                          // show-ref: no local
      .mockReturnValueOnce({ status: 0, stdout: 'abc123  refs/heads/impl/browse-books\n', stderr: '' }); // ls-remote: found
    expect(() => createImplBranch(baseOpts)).toThrow(/already exists on origin/);
    expect(cp.spawnSync).toHaveBeenCalledTimes(3);
  });
});

describe('commitImplChanges', () => {
  const commitOpts = { cwd: '/tmp/repo', slug: 'browse-books', issueNumber: 42, featureName: 'Browse books' };

  test('stages, commits, and returns SHA when there are changes', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })                           // git add -A
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: '' })                           // git diff --cached --quiet: non-zero = has staged
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })                           // git commit
      .mockReturnValueOnce({ status: 0, stdout: 'deadbeef0000000\n', stderr: '' });         // git rev-parse HEAD
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

  test('returns {sha: null} when nothing is staged (agent made no changes)', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })  // add -A
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }); // diff --cached --quiet: 0 = nothing staged
    const r = commitImplChanges(commitOpts);
    expect(r).toEqual({ sha: null });
    expect(cp.spawnSync).toHaveBeenCalledTimes(2);
  });
});
