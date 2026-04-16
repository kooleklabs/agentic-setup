const { buildMarker, extractMarkers, slugify } = require('../marker.js');

describe('slugify', () => {
  test('kebab-cases simple words', () => {
    expect(slugify('Low stock alert')).toBe('low-stock-alert');
  });
  test('strips leading/trailing whitespace', () => {
    expect(slugify('  Hello  ')).toBe('hello');
  });
  test('collapses internal whitespace', () => {
    expect(slugify('a   b\tc')).toBe('a-b-c');
  });
  test('drops apostrophes and punctuation', () => {
    expect(slugify("User's profile: edit!")).toBe('users-profile-edit');
  });
  test('preserves digits', () => {
    expect(slugify('Phase 2 workflow')).toBe('phase-2-workflow');
  });
  test('handles empty / null / undefined', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('buildMarker', () => {
  test('produces HTML comment with namespace, type, and slug', () => {
    expect(buildMarker('feature', 'low-stock-alert'))
      .toBe('<!-- agentic-app:feature:low-stock-alert -->');
  });
  test('slugifies the slug argument', () => {
    expect(buildMarker('feature', 'Low Stock Alert'))
      .toBe('<!-- agentic-app:feature:low-stock-alert -->');
  });
  test('throws on unknown type', () => {
    expect(() => buildMarker('nope', 'x')).toThrow(/unknown marker type/i);
  });
  test('accepts feature, umbrella, adr', () => {
    expect(buildMarker('feature', 'x')).toContain('feature:x');
    expect(buildMarker('umbrella', 'x')).toContain('umbrella:x');
    expect(buildMarker('adr', 'x')).toContain('adr:x');
  });
});

describe('extractMarkers', () => {
  test('returns empty array for empty input', () => {
    expect(extractMarkers('')).toEqual([]);
    expect(extractMarkers(null)).toEqual([]);
  });
  test('finds a single marker', () => {
    const body = 'Some body\n\n<!-- agentic-app:feature:low-stock-alert -->';
    expect(extractMarkers(body)).toEqual([{ type: 'feature', slug: 'low-stock-alert' }]);
  });
  test('finds multiple markers', () => {
    const body = '<!-- agentic-app:umbrella:my-app -->\nstuff\n<!-- agentic-app:feature:alerts -->';
    expect(extractMarkers(body)).toEqual([
      { type: 'umbrella', slug: 'my-app' },
      { type: 'feature', slug: 'alerts' },
    ]);
  });
  test('ignores comments that do not match the namespace', () => {
    const body = '<!-- some:other:thing -->\n<!-- agentic-app:feature:x -->';
    expect(extractMarkers(body)).toEqual([{ type: 'feature', slug: 'x' }]);
  });
});
