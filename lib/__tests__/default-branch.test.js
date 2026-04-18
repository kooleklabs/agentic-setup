const cp = require('node:child_process');

jest.mock('node:child_process');

const { detectDefaultBranch } = require('../default-branch.js');

beforeEach(() => jest.clearAllMocks());

describe('detectDefaultBranch', () => {
  test('returns "main" when gh reports main', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: 'main\n', stderr: '' });
    expect(detectDefaultBranch({ owner: 'o', repo: 'r' })).toBe('main');
  });

  test('returns "master" when gh reports master', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: 'master\n', stderr: '' });
    expect(detectDefaultBranch({ owner: 'o', repo: 'r' })).toBe('master');
  });

  test('returns a custom default like "develop" or "trunk"', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: 'trunk\n', stderr: '' });
    expect(detectDefaultBranch({ owner: 'o', repo: 'r' })).toBe('trunk');
  });

  test('calls gh with the repo argument and defaultBranchRef JSON query', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 0, stdout: 'main\n', stderr: '' });
    detectDefaultBranch({ owner: 'kool', repo: 'booknook' });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('repo');
    expect(args).toContain('view');
    expect(args).toContain('kool/booknook');
    expect(args.some((a) => a.includes('defaultBranchRef'))).toBe(true);
  });

  test('throws on gh error with stderr surfaced', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'HTTP 404: Not Found' });
    expect(() => detectDefaultBranch({ owner: 'o', repo: 'missing' })).toThrow(/Not Found/);
  });
});
