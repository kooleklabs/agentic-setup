const { buildArchitectPrompt } = require('../architect-prompt.js');

describe('buildArchitectPrompt', () => {
  test('includes requirement verbatim', () => {
    const p = buildArchitectPrompt({ requirement: 'inventory app with alerts' });
    expect(p).toContain('inventory app with alerts');
  });

  test('instructs Design Gate Mode explicitly', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toMatch(/design gate mode/i);
  });

  test('enumerates all required output files', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toContain('docs/architecture.md');
    expect(p).toContain('docs/decisions/');
    expect(p).toContain('contracts/api-spec.yaml');
  });

  test('requires all four architecture.md section headers', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toContain('## Backend');
    expect(p).toContain('## Frontend');
    expect(p).toContain('## Integration');
    expect(p).toContain('## Acceptance Criteria');
  });

  test('lists required backend artefacts (ERD, OpenAPI, service breakdown, auth)', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toMatch(/ERD|entity.relationship/i);
    expect(p).toMatch(/OpenAPI/i);
    expect(p).toMatch(/service layer/i);
    expect(p).toMatch(/auth/i);
  });

  test('lists required frontend artefacts (user flows, wireframes, components, tokens)', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toMatch(/user flow/i);
    expect(p).toMatch(/wireframe/i);
    expect(p).toMatch(/component/i);
    expect(p).toMatch(/design token/i);
  });

  test('requires ADRs for non-obvious decisions', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toMatch(/ADR/i);
    expect(p).toContain('docs/decisions/001-');
  });

  test('requires real OpenAPI (not stub)', () => {
    const p = buildArchitectPrompt({ requirement: 'x' });
    expect(p).toMatch(/real OpenAPI|not a stub|not stub/i);
  });

  test('includes optional stack hint when provided', () => {
    const p = buildArchitectPrompt({ requirement: 'x', stack: 'Next.js + Postgres' });
    expect(p).toContain('Next.js + Postgres');
  });

  test('retry mode lists specific missing outputs', () => {
    const p = buildArchitectPrompt({
      requirement: 'x',
      retry: true,
      missing: ['docs/architecture.md', 'contracts/api-spec.yaml'],
    });
    expect(p).toMatch(/retry|complete|missing/i);
    expect(p).toContain('docs/architecture.md');
    expect(p).toContain('contracts/api-spec.yaml');
  });
});
