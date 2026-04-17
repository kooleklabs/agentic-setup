const cp = require('node:child_process');

jest.mock('node:child_process');

const {
  checkGhAvailable,
  listOpenIssuesWithMarkers,
  listMilestones,
  createMilestone,
  createIssue,
  updateIssue,
} = require('../github-issues.js');

beforeEach(() => jest.clearAllMocks());

describe('checkGhAvailable', () => {
  test('returns without throwing when gh auth status exits 0', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '', stderr: '' });
    expect(() => checkGhAvailable()).not.toThrow();
  });

  test('throws install guidance when gh is missing (ENOENT)', () => {
    const err = Object.assign(new Error('spawn gh ENOENT'), { code: 'ENOENT' });
    cp.spawnSync.mockReturnValueOnce({ status: null, stdout: '', stderr: '', error: err });
    expect(() => checkGhAvailable()).toThrow(/Install.*gh|gh CLI not found/i);
  });

  test('throws auth guidance when gh is not authenticated', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 1,
      stdout: '',
      stderr: 'You are not logged into any GitHub hosts.',
    });
    expect(() => checkGhAvailable()).toThrow(/gh auth login/);
  });
});

describe('listOpenIssuesWithMarkers', () => {
  test('returns issues with markers, stripping PRs and markerless ones', () => {
    const issues = [
      { number: 1, title: 'Has marker', body: 'foo <!-- agentic-app:feature:login --> bar' },
      { number: 2, title: 'No marker', body: 'plain body' },
      { number: 3, title: 'Is a PR', body: '<!-- agentic-app:feature:x -->', pull_request: { url: 'x' } },
      { number: 4, title: 'Umbrella', body: '<!-- agentic-app:umbrella:auth-rewrite -->' },
    ];
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: JSON.stringify(issues), stderr: '' });

    const result = listOpenIssuesWithMarkers({ owner: 'o', repo: 'r' });
    expect(result).toEqual([
      { number: 1, title: 'Has marker', markers: [{ type: 'feature', slug: 'login' }] },
      { number: 4, title: 'Umbrella', markers: [{ type: 'umbrella', slug: 'auth-rewrite' }] },
    ]);
  });

  test('returns [] when no issues', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '[]', stderr: '' });
    expect(listOpenIssuesWithMarkers({ owner: 'o', repo: 'r' })).toEqual([]);
  });

  test('throws on gh api error', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'API rate limit' });
    expect(() => listOpenIssuesWithMarkers({ owner: 'o', repo: 'r' })).toThrow(/API rate limit/);
  });

  test('hits the repos/:owner/:repo/issues endpoint', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '[]', stderr: '' });
    listOpenIssuesWithMarkers({ owner: 'kool', repo: 'agentic-setup' });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('api');
    expect(args.some(a => a.includes('repos/kool/agentic-setup/issues'))).toBe(true);
  });
});

describe('createMilestone', () => {
  test('returns {number, title} on success', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ number: 7, title: 'v2.7.0', description: 'release' }),
      stderr: '',
    });
    expect(createMilestone({ owner: 'o', repo: 'r', title: 'v2.7.0', description: 'release' }))
      .toEqual({ number: 7, title: 'v2.7.0' });
  });

  test('throws on error', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'Validation failed' });
    expect(() => createMilestone({ owner: 'o', repo: 'r', title: 'x' })).toThrow(/Validation failed/);
  });
});

describe('listMilestones', () => {
  test('returns [{number, title}] on success', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify([
        { number: 1, title: 'v1.0', description: 'x' },
        { number: 2, title: 'v1.1', description: 'y' },
      ]),
      stderr: '',
    });
    expect(listMilestones({ owner: 'o', repo: 'r' })).toEqual([
      { number: 1, title: 'v1.0' },
      { number: 2, title: 'v1.1' },
    ]);
  });

  test('returns [] when no milestones', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '[]', stderr: '' });
    expect(listMilestones({ owner: 'o', repo: 'r' })).toEqual([]);
  });

  test('hits the repos/:owner/:repo/milestones endpoint', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '[]', stderr: '' });
    listMilestones({ owner: 'kool', repo: 'agentic-setup' });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('api');
    expect(args.some((a) => a.includes('repos/kool/agentic-setup/milestones'))).toBe(true);
  });

  test('throws on error', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'Not Found' });
    expect(() => listMilestones({ owner: 'o', repo: 'r' })).toThrow(/Not Found/);
  });
});

describe('createIssue', () => {
  test('parses issue number from gh issue create stdout URL', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: 'https://github.com/o/r/issues/42\n',
      stderr: '',
    });
    expect(createIssue({ owner: 'o', repo: 'r', title: 't', body: 'b' }))
      .toEqual({ number: 42, url: 'https://github.com/o/r/issues/42' });
  });

  test('omits --milestone flag when milestone not provided', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: 'https://github.com/o/r/issues/1\n',
      stderr: '',
    });
    createIssue({ owner: 'o', repo: 'r', title: 't', body: 'b' });
    const [, args] = cp.spawnSync.mock.calls[0];
    expect(args).not.toContain('--milestone');
  });

  test('includes --milestone flag when provided', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: 'https://github.com/o/r/issues/1\n',
      stderr: '',
    });
    createIssue({ owner: 'o', repo: 'r', title: 't', body: 'b', milestone: 7 });
    const [, args] = cp.spawnSync.mock.calls[0];
    const idx = args.indexOf('--milestone');
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe('7');
  });
});

describe('updateIssue', () => {
  test('sends PATCH to repos/:owner/:repo/issues/:n with body field', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: '{}', stderr: '' });
    updateIssue({ owner: 'o', repo: 'r', number: 5, body: 'new body' });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('api');
    expect(args).toContain('PATCH');
    expect(args.some(a => a.includes('repos/o/r/issues/5'))).toBe(true);
    expect(args.some(a => a.startsWith('body='))).toBe(true);
  });

  test('throws on error', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'Not Found' });
    expect(() => updateIssue({ owner: 'o', repo: 'r', number: 99, body: 'x' }))
      .toThrow(/Not Found/);
  });
});
