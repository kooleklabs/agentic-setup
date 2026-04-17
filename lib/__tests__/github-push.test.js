jest.mock('../github-repo.js');
jest.mock('../github-issues.js');
jest.mock('../architecture-parser.js');

const repo = require('../github-repo.js');
const issues = require('../github-issues.js');
const parser = require('../architecture-parser.js');

const { runGithubPush } = require('../github-push.js');

const mockParsed = {
  projectName: 'MyApp',
  features: [
    { name: 'Low stock alert', slug: 'low-stock-alert', criteria: ['Given X'], relatedPaths: [], relatedAdrs: [] },
    { name: 'Bulk adjustment', slug: 'bulk-adjustment', criteria: [], relatedPaths: [], relatedAdrs: [] },
  ],
  adrs: [],
  openapiPaths: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});

  issues.checkGhAvailable.mockImplementation(() => {});
  repo.detectGithubRepo.mockReturnValue({ owner: 'o', repo: 'r' });
  parser.parseArchitecture.mockReturnValue(mockParsed);
  issues.listOpenIssuesWithMarkers.mockReturnValue([]);
  issues.listMilestones.mockReturnValue([]);
  issues.createMilestone.mockReturnValue({ number: 1, title: 'MyApp v1.0' });

  let n = 100;
  issues.createIssue.mockImplementation(({ title }) => {
    n += 1;
    return { number: n, url: `https://github.com/o/r/issues/${n}`, title };
  });
  issues.updateIssue.mockReturnValue('');
});

afterEach(() => {
  console.log.mockRestore && console.log.mockRestore();
});

describe('runGithubPush', () => {
  test('dry run returns ok without creating anything', async () => {
    const r = await runGithubPush({ cwd: '.', dryRun: true, autoApprove: true });
    expect(r.ok).toBe(true);
    expect(r.dryRun).toBe(true);
    expect(issues.createMilestone).not.toHaveBeenCalled();
    expect(issues.createIssue).not.toHaveBeenCalled();
    expect(issues.updateIssue).not.toHaveBeenCalled();
  });

  test('fresh create: milestone 1x, createIssue 3x (umbrella + 2 features), updateIssue 1x', async () => {
    const r = await runGithubPush({ cwd: '.', autoApprove: true });
    expect(r.ok).toBe(true);
    expect(issues.createMilestone).toHaveBeenCalledTimes(1);
    expect(issues.createIssue).toHaveBeenCalledTimes(3);
    expect(issues.updateIssue).toHaveBeenCalledTimes(1);
  });

  test('--no-umbrella omits umbrella: 2 createIssue, no updateIssue', async () => {
    const r = await runGithubPush({ cwd: '.', autoApprove: true, noUmbrella: true });
    expect(r.ok).toBe(true);
    expect(issues.createIssue).toHaveBeenCalledTimes(2);
    expect(issues.updateIssue).not.toHaveBeenCalled();
  });

  test('skips features whose slug already has a marker (idempotent re-run)', async () => {
    issues.listOpenIssuesWithMarkers.mockReturnValue([
      { number: 7, title: 'Low stock alert', markers: [{ type: 'feature', slug: 'low-stock-alert' }] },
    ]);
    const r = await runGithubPush({ cwd: '.', autoApprove: true });
    expect(r.ok).toBe(true);
    expect(r.skipped).toEqual(['low-stock-alert']);
    expect(issues.createIssue).toHaveBeenCalledTimes(2);
  });

  test('--force ignores existing markers and creates everything fresh', async () => {
    issues.listOpenIssuesWithMarkers.mockReturnValue([
      { number: 7, title: 'Low stock alert', markers: [{ type: 'feature', slug: 'low-stock-alert' }] },
    ]);
    const r = await runGithubPush({ cwd: '.', autoApprove: true, force: true });
    expect(r.ok).toBe(true);
    expect(issues.createIssue).toHaveBeenCalledTimes(3);
  });

  test('checkGhAvailable failure returns {ok: false, error}', async () => {
    issues.checkGhAvailable.mockImplementation(() => { throw new Error('gh CLI not found'); });
    const r = await runGithubPush({ cwd: '.', autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/gh CLI not found/);
  });

  test('repo detection failure returns {ok: false, error}', async () => {
    repo.detectGithubRepo.mockImplementation(() => { throw new Error('No GitHub origin detected'); });
    const r = await runGithubPush({ cwd: '.', autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/No GitHub origin/);
  });

  test('parseArchitecture failure returns {ok: false, error}', async () => {
    parser.parseArchitecture.mockImplementation(() => { throw new Error('docs/architecture.md not found'); });
    const r = await runGithubPush({ cwd: '.', autoApprove: true });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/architecture\.md/);
  });

  test('custom milestoneTitle overrides default', async () => {
    await runGithubPush({ cwd: '.', autoApprove: true, milestoneTitle: 'v2.7.0' });
    expect(issues.createMilestone).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'v2.7.0' })
    );
  });

  test('createIssue receives the milestone TITLE (not number) — gh --milestone expects a name', async () => {
    issues.createMilestone.mockReturnValue({ number: 42, title: 'BookNook v1.0' });
    await runGithubPush({ cwd: '.', autoApprove: true });
    for (const [args] of issues.createIssue.mock.calls) {
      expect(args.milestone).toBe('BookNook v1.0');
    }
  });

  test('milestone is reused when a milestone with the same title already exists', async () => {
    issues.listMilestones.mockReturnValue([{ number: 42, title: 'MyApp v1.0' }]);
    await runGithubPush({ cwd: '.', autoApprove: true });
    expect(issues.createMilestone).not.toHaveBeenCalled();
    expect(issues.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ milestone: 'MyApp v1.0' })
    );
  });

  test('milestone is created when no matching title exists in the repo', async () => {
    issues.listMilestones.mockReturnValue([{ number: 99, title: 'unrelated' }]);
    await runGithubPush({ cwd: '.', autoApprove: true });
    expect(issues.createMilestone).toHaveBeenCalledTimes(1);
  });

  test('re-run: reuses milestone, refreshes existing umbrella body with merged feature numbers', async () => {
    issues.listOpenIssuesWithMarkers.mockReturnValue([
      { number: 10, title: 'Low stock alert', markers: [{ type: 'feature', slug: 'low-stock-alert' }] },
      { number: 11, title: '🏗 Architecture — MyApp', markers: [{ type: 'umbrella', slug: 'myapp' }] },
    ]);
    issues.listMilestones.mockReturnValue([{ number: 5, title: 'MyApp v1.0' }]);
    issues.createIssue.mockReturnValueOnce({ number: 102, url: 'https://github.com/o/r/issues/102' });

    await runGithubPush({ cwd: '.', autoApprove: true });

    expect(issues.createMilestone).not.toHaveBeenCalled();
    expect(issues.createIssue).toHaveBeenCalledTimes(1);
    expect(issues.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Bulk adjustment', milestone: 'MyApp v1.0' })
    );
    expect(issues.updateIssue).toHaveBeenCalledTimes(1);
    const update = issues.updateIssue.mock.calls[0][0];
    expect(update.number).toBe(11);
    expect(update.body).toMatch(/#10/);
    expect(update.body).toMatch(/#102/);
  });

  test('no-op re-run: all features exist + umbrella exists → no createIssue, but umbrella still refreshed', async () => {
    issues.listOpenIssuesWithMarkers.mockReturnValue([
      { number: 10, title: 'Low stock alert', markers: [{ type: 'feature', slug: 'low-stock-alert' }] },
      { number: 11, title: 'Bulk adjustment', markers: [{ type: 'feature', slug: 'bulk-adjustment' }] },
      { number: 12, title: 'Umbrella', markers: [{ type: 'umbrella', slug: 'myapp' }] },
    ]);
    issues.listMilestones.mockReturnValue([{ number: 5, title: 'MyApp v1.0' }]);

    const r = await runGithubPush({ cwd: '.', autoApprove: true });

    expect(r.ok).toBe(true);
    expect(r.skipped).toEqual(['low-stock-alert', 'bulk-adjustment']);
    expect(issues.createMilestone).not.toHaveBeenCalled();
    expect(issues.createIssue).not.toHaveBeenCalled();
    expect(issues.updateIssue).toHaveBeenCalledTimes(1);
    expect(issues.updateIssue.mock.calls[0][0].number).toBe(12);
  });

  test('--no-umbrella does NOT refresh an existing umbrella even when one is present', async () => {
    issues.listOpenIssuesWithMarkers.mockReturnValue([
      { number: 11, title: 'Existing umbrella', markers: [{ type: 'umbrella', slug: 'myapp' }] },
    ]);
    await runGithubPush({ cwd: '.', autoApprove: true, noUmbrella: true });
    expect(issues.updateIssue).not.toHaveBeenCalled();
  });

  test('umbrella body is updated with feature numbers after features are created', async () => {
    // createIssue mock returns 101 (umbrella), 102 (feat1), 103 (feat2)
    await runGithubPush({ cwd: '.', autoApprove: true });
    const umbrellaCall = issues.createIssue.mock.calls[0][0];
    expect(umbrellaCall.title).toMatch(/Architecture/);
    const update = issues.updateIssue.mock.calls[0][0];
    expect(update.number).toBe(101);
    expect(update.body).toMatch(/#102/);
    expect(update.body).toMatch(/#103/);
  });
});
