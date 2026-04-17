const { renderPlanFile, validatePlanBody, REQUIRED_SECTIONS } = require('../plan-template.js');

const fullBody = [
  '## Problem statement',
  'foo',
  '',
  '## Acceptance criteria',
  '- Given ...',
  '',
  '## Approach',
  'approach',
  '',
  '## Files to change',
  '- `path` — desc',
  '',
  '## Implementation steps',
  '1. Step',
  '',
  '## Test plan',
  '- unit',
  '',
  '## Open questions',
  '- None.',
  '',
  '## Rollback',
  'revert.',
].join('\n');

describe('renderPlanFile', () => {
  const base = {
    issueTitle: 'Browse books',
    issueNumber: 42,
    repoName: 'kooleklabs/booknook',
    model: 'claude-sonnet-4-6',
    generatedAt: '2026-04-17',
    planBody: fullBody,
  };

  test('header includes title, Source, Generated, and Model fields', () => {
    const out = renderPlanFile(base);
    expect(out).toMatch(/^# Plan: Browse books\n/);
    expect(out).toContain('**Source:**');
    expect(out).toContain('Issue #42');
    expect(out).toContain('kooleklabs/booknook');
    expect(out).toContain('**Generated:** 2026-04-17');
    expect(out).toContain('**Model:** `claude-sonnet-4-6`');
  });

  test('plan body appears after the header separator', () => {
    const out = renderPlanFile(base);
    const [header, ...rest] = out.split('\n---\n');
    expect(rest.join('\n---\n')).toContain('## Problem statement');
    expect(header).not.toContain('## Problem statement');
  });

  test('is idempotent — same inputs produce byte-identical output', () => {
    expect(renderPlanFile(base)).toBe(renderPlanFile(base));
  });
});

describe('validatePlanBody', () => {
  test('returns {ok: true, missing: []} when all required sections are present', () => {
    expect(validatePlanBody(fullBody)).toEqual({ ok: true, missing: [] });
  });

  test('lists the specific sections missing from the body', () => {
    const partial = '## Problem statement\nfoo\n\n## Acceptance criteria\nbar';
    const r = validatePlanBody(partial);
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(expect.arrayContaining([
      '## Approach',
      '## Files to change',
      '## Implementation steps',
      '## Test plan',
      '## Rollback',
    ]));
    expect(r.missing).not.toContain('## Problem statement');
  });

  test('empty body lists every required section', () => {
    const r = validatePlanBody('');
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(REQUIRED_SECTIONS);
  });
});
