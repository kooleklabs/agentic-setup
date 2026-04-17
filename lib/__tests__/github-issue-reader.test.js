const cp = require('node:child_process');

jest.mock('node:child_process');

const {
  parseFeatureIssueBody,
  fetchFeatureIssue,
} = require('../github-issue-reader.js');

beforeEach(() => jest.clearAllMocks());

describe('parseFeatureIssueBody', () => {
  const body = [
    '## Acceptance criteria',
    '',
    '- Given a visitor on the homepage',
    '- When they scroll the catalog',
    '- Then paginated books are returned from `/api/books`',
    '- And results load within 500ms',
    '',
    'Note: this is not a Given line and should be ignored.',
    '',
    '## Relevant API paths',
    '',
    '- `GET /api/books` — from `contracts/api-spec.yaml`',
    '',
    '## Related architectural decisions',
    '',
    '- [001-pagination-strategy](docs/decisions/001-pagination-strategy.md)',
    '',
    '<!-- agentic-app:feature:browse-books -->',
  ].join('\n');

  test('extracts marker slug, criteria, API paths, and ADR refs from a realistic body', () => {
    const r = parseFeatureIssueBody(body);
    expect(r.markerSlug).toBe('browse-books');
    expect(r.acceptanceCriteria).toEqual([
      'Given a visitor on the homepage',
      'When they scroll the catalog',
      'Then paginated books are returned from `/api/books`',
      'And results load within 500ms',
    ]);
    expect(r.apiPaths).toEqual(['/api/books']);
    expect(r.adrRefs).toEqual([
      { number: '001', slug: 'pagination-strategy', path: 'docs/decisions/001-pagination-strategy.md' },
    ]);
  });

  test('markerSlug is null when the body has no feature marker', () => {
    expect(parseFeatureIssueBody('just some text, no marker').markerSlug).toBeNull();
  });

  test('empty body returns empty fields without throwing', () => {
    expect(parseFeatureIssueBody('')).toEqual({
      markerSlug: null,
      acceptanceCriteria: [],
      apiPaths: [],
      adrRefs: [],
    });
  });

  test('ignores bullet lines that are not Given/When/Then/And', () => {
    const r = parseFeatureIssueBody('- ordinary bullet\n- Given something matters');
    expect(r.acceptanceCriteria).toEqual(['Given something matters']);
  });
});

describe('fetchFeatureIssue', () => {
  const buildIssue = (overrides = {}) => ({
    number: 42,
    title: 'Browse books',
    body: 'Given foo\n<!-- agentic-app:feature:browse-books -->',
    ...overrides,
  });

  test('returns structured context on success', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify(buildIssue()),
      stderr: '',
    });
    const r = fetchFeatureIssue({ owner: 'o', repo: 'r', number: 42 });
    expect(r.number).toBe(42);
    expect(r.title).toBe('Browse books');
    expect(r.markerSlug).toBe('browse-books');
  });

  test('throws when Issue has no feature marker', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify({ number: 42, title: 'plain', body: 'no marker here' }),
      stderr: '',
    });
    expect(() => fetchFeatureIssue({ owner: 'o', repo: 'r', number: 42 }))
      .toThrow(/no agentic-app:feature:\* marker|push-architecture/i);
  });

  test('throws when target is a pull request, not an Issue', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify(buildIssue({ pull_request: { url: 'https://...' } })),
      stderr: '',
    });
    expect(() => fetchFeatureIssue({ owner: 'o', repo: 'r', number: 42 }))
      .toThrow(/pull request/i);
  });

  test('surfaces gh api error with stderr', () => {
    cp.spawnSync.mockReturnValueOnce({ status: 1, stdout: '', stderr: 'Not Found' });
    expect(() => fetchFeatureIssue({ owner: 'o', repo: 'r', number: 99 }))
      .toThrow(/Not Found/);
  });

  test('hits the repos/:owner/:repo/issues/:n endpoint', () => {
    cp.spawnSync.mockReturnValueOnce({
      status: 0,
      stdout: JSON.stringify(buildIssue()),
      stderr: '',
    });
    fetchFeatureIssue({ owner: 'kool', repo: 'booknook', number: 7 });
    const [cmd, args] = cp.spawnSync.mock.calls[0];
    expect(cmd).toBe('gh');
    expect(args).toContain('api');
    expect(args.some((a) => a.includes('repos/kool/booknook/issues/7'))).toBe(true);
  });
});
