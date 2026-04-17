const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { readMergedPlan } = require('../plan-reader.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'plan-reader-'));
}

const VALID_PLAN_BODY = [
  '## Problem statement', 'foo', '',
  '## Acceptance criteria', '- Given x', '',
  '## Approach', 'approach', '',
  '## Files to change', '- `a.js`', '',
  '## Implementation steps', '1. do', '',
  '## Test plan', '- unit', '',
  '## Open questions', '- None.', '',
  '## Rollback', 'revert',
].join('\n');

function writePlan(tmp, slug, body) {
  const dir = path.join(tmp, 'docs', 'plans');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.md`), body);
}

let tmp;
beforeEach(() => { tmp = mkTmp(); });
afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

describe('readMergedPlan', () => {
  test('strips the header block before the first `---` separator and returns the body', () => {
    const withHeader = [
      '# Plan: Browse books',
      '',
      '**Source:** Issue #42',
      '',
      '---',
      '',
      VALID_PLAN_BODY,
    ].join('\n');
    writePlan(tmp, 'browse-books', withHeader);
    const r = readMergedPlan({ cwd: tmp, slug: 'browse-books' });
    expect(r.body).toContain('## Problem statement');
    expect(r.body).not.toContain('# Plan: Browse books');
    expect(r.hasRequiredSections).toBe(true);
  });

  test('returns body as-is when no header separator exists (defensive for manually authored plans)', () => {
    writePlan(tmp, 'no-header', VALID_PLAN_BODY);
    const r = readMergedPlan({ cwd: tmp, slug: 'no-header' });
    expect(r.body).toContain('## Problem statement');
    expect(r.hasRequiredSections).toBe(true);
  });

  test('surfaces missing sections via hasRequiredSections=false + missing array', () => {
    const truncated = '## Problem statement\nfoo';
    writePlan(tmp, 'truncated', truncated);
    const r = readMergedPlan({ cwd: tmp, slug: 'truncated' });
    expect(r.hasRequiredSections).toBe(false);
    expect(r.missing).toEqual(expect.arrayContaining(['## Approach', '## Rollback']));
  });

  test('throws with actionable guidance when plan file is absent', () => {
    expect(() => readMergedPlan({ cwd: tmp, slug: 'ghost' }))
      .toThrow(/No plan found.*docs\/plans\/ghost\.md.*github-sync/);
  });
});
