const { buildPlanPrompt } = require('../plan-prompt.js');

const baseInput = {
  issue: {
    number: 42,
    title: 'Browse books',
    body: 'Issue body with acceptance criteria...',
    markerSlug: 'browse-books',
  },
  architectureSection: '### Feature: Browse books\n\n- Given a visitor ...\n',
  apiSpecYaml: 'openapi: 3.0.0\npaths:\n  /api/books: {}\n',
  adrs: [
    { number: '001', slug: 'pagination-strategy', body: '# 001 — Pagination\n\nCursor-based.' },
  ],
  repoName: 'kooleklabs/booknook',
};

describe('buildPlanPrompt', () => {
  test('returns both systemPrompt and userPrompt as non-empty strings', () => {
    const r = buildPlanPrompt(baseInput);
    expect(typeof r.systemPrompt).toBe('string');
    expect(typeof r.userPrompt).toBe('string');
    expect(r.systemPrompt.length).toBeGreaterThan(100);
    expect(r.userPrompt.length).toBeGreaterThan(100);
  });

  test('system prompt lists every required output section from the plan template', () => {
    const { systemPrompt } = buildPlanPrompt(baseInput);
    for (const section of [
      '## Problem statement',
      '## Acceptance criteria',
      '## Approach',
      '## Files to change',
      '## Implementation steps',
      '## Test plan',
      '## Rollback',
    ]) {
      expect(systemPrompt).toContain(section);
    }
  });

  test('user prompt embeds the issue, architecture section, API spec, and ADRs', () => {
    const { userPrompt } = buildPlanPrompt(baseInput);
    expect(userPrompt).toContain('kooleklabs/booknook');
    expect(userPrompt).toContain('Browse books');
    expect(userPrompt).toContain('Issue body with acceptance criteria');
    expect(userPrompt).toContain('### Feature: Browse books');
    expect(userPrompt).toContain('openapi: 3.0.0');
    expect(userPrompt).toContain('Pagination');
    expect(userPrompt).toContain('001');
  });

  test('user prompt explicitly says when there is no OpenAPI spec', () => {
    const { userPrompt } = buildPlanPrompt({ ...baseInput, apiSpecYaml: null });
    expect(userPrompt).toMatch(/no openapi spec/i);
    expect(userPrompt).not.toContain('openapi: 3.0.0');
  });

  test('user prompt explicitly says when there are no linked ADRs', () => {
    const { userPrompt } = buildPlanPrompt({ ...baseInput, adrs: [] });
    expect(userPrompt).toMatch(/no linked adrs/i);
  });

  test('system prompt forbids code blocks outside Files to change', () => {
    const { systemPrompt } = buildPlanPrompt(baseInput);
    expect(systemPrompt).toMatch(/no code blocks|no fenced code/i);
  });
});
