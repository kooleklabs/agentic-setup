const cp = require('node:child_process');

jest.mock('node:child_process');

const { openImplPR } = require('../gh-impl-pr.js');

beforeEach(() => jest.clearAllMocks());

const baseOpts = {
  cwd: '/tmp/repo',
  branch: 'impl/browse-books',
  issueNumber: 42,
  featureName: 'Browse books',
  base: 'main',
  draft: true,
  impl: { filesWritten: ['src/foo.js', 'src/bar.js'], commandsRun: ['npm test'], costUsd: 0.17 },
  commitSha: 'abc1234def5678',
};

function stubHappy() {
  cp.spawnSync
    .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' }) // git push
    .mockReturnValueOnce({ status: 0, stdout: 'https://github.com/o/r/pull/12\n', stderr: '' }); // gh pr create
}

describe('openImplPR', () => {
  test('happy path: pushes branch then opens draft PR; returns {prNumber, url}', () => {
    stubHappy();
    const r = openImplPR(baseOpts);
    expect(r).toEqual({ prNumber: 12, url: 'https://github.com/o/r/pull/12' });
    expect(cp.spawnSync).toHaveBeenCalledTimes(2);
    const [pushCmd, pushArgs] = cp.spawnSync.mock.calls[0];
    expect(pushCmd).toBe('git');
    expect(pushArgs).toEqual(expect.arrayContaining(['push', '-u', 'origin', 'impl/browse-books']));
  });

  test('PR title follows "implement: <feature>" format', () => {
    stubHappy();
    openImplPR(baseOpts);
    const [, args] = cp.spawnSync.mock.calls[1];
    expect(args).toContain('--title');
    expect(args[args.indexOf('--title') + 1]).toBe('implement: Browse books');
  });

  test('PR body references Issue #N with "Closes" and lists files + commands + cost', () => {
    stubHappy();
    openImplPR(baseOpts);
    const [, args] = cp.spawnSync.mock.calls[1];
    const body = args[args.indexOf('--body') + 1];
    expect(body).toContain('Closes #42');
    expect(body).toContain('src/foo.js');
    expect(body).toContain('src/bar.js');
    expect(body).toContain('npm test');
    expect(body).toContain('0.17');
    expect(body).toContain('abc1234');
  });

  test('includes --draft by default', () => {
    stubHappy();
    openImplPR(baseOpts);
    const [, args] = cp.spawnSync.mock.calls[1];
    expect(args).toContain('--draft');
  });

  test('omits --draft when draft=false (opt-in to ready-for-review)', () => {
    stubHappy();
    openImplPR({ ...baseOpts, draft: false });
    const [, args] = cp.spawnSync.mock.calls[1];
    expect(args).not.toContain('--draft');
  });

  test('surfaces git push failure with hint about existing remote branch', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'non-fast-forward' });
    expect(() => openImplPR(baseOpts)).toThrow(/non-fast-forward|remote branch/);
  });

  test('surfaces gh pr create failure', () => {
    cp.spawnSync
      .mockReturnValueOnce({ status: 0, stdout: '', stderr: '' })
      .mockReturnValueOnce({ status: 1, stdout: '', stderr: 'GraphQL: validation failed' });
    expect(() => openImplPR(baseOpts)).toThrow(/validation failed/);
  });

  test('notes when no files were written and no tests were run (surfaces thin runs)', () => {
    stubHappy();
    openImplPR({
      ...baseOpts,
      impl: { filesWritten: [], commandsRun: [], costUsd: 0.01 },
    });
    const [, args] = cp.spawnSync.mock.calls[1];
    const body = args[args.indexOf('--body') + 1];
    expect(body).toMatch(/no files.*written|no changes/i);
  });

  test('embeds Verification table when selfReview checks are present', () => {
    stubHappy();
    openImplPR({
      ...baseOpts,
      selfReview: {
        checks: [
          { name: 'test', command: 'npm test --silent', status: 'pass', exitCode: 0, duration: 1234 },
          { name: 'lint', command: 'npm run --silent lint', status: 'pass', exitCode: 0, duration: 500 },
        ],
        hasFailures: false,
      },
    });
    const [, args] = cp.spawnSync.mock.calls[1];
    const body = args[args.indexOf('--body') + 1];
    expect(body).toContain('## Verification');
    expect(body).toContain('✅ pass');
    expect(body).toContain('npm test --silent');
  });

  test('adds failure warning when selfReview has failures', () => {
    stubHappy();
    openImplPR({
      ...baseOpts,
      selfReview: {
        checks: [
          { name: 'test', command: 'npm test', status: 'fail', exitCode: 1, duration: 500 },
        ],
        hasFailures: true,
      },
    });
    const [, args] = cp.spawnSync.mock.calls[1];
    const body = args[args.indexOf('--body') + 1];
    expect(body).toContain('❌ fail');
    expect(body).toMatch(/failed|inspect/i);
  });
});
