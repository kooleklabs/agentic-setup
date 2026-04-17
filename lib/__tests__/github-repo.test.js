const cp = require('node:child_process');

jest.mock('node:child_process');

const { detectGithubRepo, parseRemoteUrl } = require('../github-repo.js');

describe('parseRemoteUrl', () => {
  test('parses https URL with .git suffix', () => {
    expect(parseRemoteUrl('https://github.com/kooleklabs/agentic-setup.git'))
      .toEqual({ owner: 'kooleklabs', repo: 'agentic-setup' });
  });
  test('parses https URL without .git suffix', () => {
    expect(parseRemoteUrl('https://github.com/kooleklabs/agentic-setup'))
      .toEqual({ owner: 'kooleklabs', repo: 'agentic-setup' });
  });
  test('parses ssh URL', () => {
    expect(parseRemoteUrl('git@github.com:kooleklabs/agentic-setup.git'))
      .toEqual({ owner: 'kooleklabs', repo: 'agentic-setup' });
  });
  test('returns null for non-github URL', () => {
    expect(parseRemoteUrl('https://gitlab.com/foo/bar.git')).toBeNull();
  });
  test('returns null for malformed input', () => {
    expect(parseRemoteUrl('')).toBeNull();
    expect(parseRemoteUrl('not-a-url')).toBeNull();
  });
});

describe('detectGithubRepo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns {owner, repo} when origin is GitHub', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: 'https://github.com/kooleklabs/agentic-setup.git\n',
      stderr: '',
    });
    expect(detectGithubRepo()).toEqual({ owner: 'kooleklabs', repo: 'agentic-setup' });
  });
  test('throws with clear message when not a git repo', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 128,
      stdout: '',
      stderr: 'fatal: not a git repository',
    });
    expect(() => detectGithubRepo()).toThrow(/No GitHub origin detected/);
  });
  test('throws when origin is not github', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: 'https://gitlab.com/foo/bar.git\n',
      stderr: '',
    });
    expect(() => detectGithubRepo()).toThrow(/Origin is not GitHub/);
  });
});
