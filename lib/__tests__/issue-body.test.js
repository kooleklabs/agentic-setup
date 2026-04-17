const { buildFeatureBody, buildUmbrellaBody } = require('../issue-body.js');

describe('buildFeatureBody', () => {
  const feature = {
    name: 'Low stock alert',
    slug: 'low-stock-alert',
    criteria: [
      'Given a product with stock below threshold',
      'When an admin views the dashboard',
      'Then the product appears with a red badge',
    ],
    relatedPaths: ['/api/v1/products/low-stock'],
    relatedAdrs: [{ number: '001', slug: 'auth', path: 'docs/decisions/001-auth.md' }],
  };
  const openapiPaths = [
    { method: 'GET', path: '/api/v1/products/low-stock' },
    { method: 'POST', path: '/api/v1/products/bulk' },
  ];

  test('includes all acceptance criteria as bullets', () => {
    const body = buildFeatureBody(feature, openapiPaths);
    expect(body).toContain('- Given a product with stock below threshold');
    expect(body).toContain('- When an admin views the dashboard');
    expect(body).toContain('- Then the product appears with a red badge');
  });
  test('includes related API paths with method', () => {
    const body = buildFeatureBody(feature, openapiPaths);
    expect(body).toContain('`GET /api/v1/products/low-stock`');
  });
  test('does not list unrelated API paths', () => {
    const body = buildFeatureBody(feature, openapiPaths);
    expect(body).not.toContain('/api/v1/products/bulk');
  });
  test('includes related ADR links', () => {
    const body = buildFeatureBody(feature, openapiPaths);
    expect(body).toContain('docs/decisions/001-auth.md');
  });
  test('ends with a feature marker', () => {
    const body = buildFeatureBody(feature, openapiPaths);
    expect(body.trimEnd().endsWith('<!-- agentic-app:feature:low-stock-alert -->')).toBe(true);
  });
  test('omits "Relevant API paths" section when empty', () => {
    const f = { ...feature, relatedPaths: [] };
    const body = buildFeatureBody(f, openapiPaths);
    expect(body).not.toContain('## Relevant API paths');
  });
  test('omits "Related architectural decisions" when no ADRs', () => {
    const f = { ...feature, relatedAdrs: [] };
    const body = buildFeatureBody(f, openapiPaths);
    expect(body).not.toContain('## Related architectural decisions');
  });
});

describe('buildUmbrellaBody', () => {
  const parsed = {
    projectName: 'Inventory App',
    features: [
      { name: 'Low stock alert', slug: 'low-stock-alert' },
      { name: 'Bulk adjustment', slug: 'bulk-adjustment' },
    ],
    adrs: [
      { number: '001', slug: 'auth', path: 'docs/decisions/001-auth.md' },
      { number: '002', slug: 'db', path: 'docs/decisions/002-db.md' },
    ],
    openapiPaths: [
      { method: 'GET', path: '/a' }, { method: 'POST', path: '/b' },
    ],
  };
  const featureIssueNumbers = new Map([
    ['low-stock-alert', 43],
    ['bulk-adjustment', 44],
  ]);

  test('includes project name in body', () => {
    const body = buildUmbrellaBody(parsed, featureIssueNumbers);
    expect(body).toContain('Inventory App');
  });
  test('links to design docs', () => {
    const body = buildUmbrellaBody(parsed, featureIssueNumbers);
    expect(body).toContain('docs/architecture.md');
    expect(body).toContain('contracts/api-spec.yaml');
    expect(body).toContain('docs/decisions/');
  });
  test('counts API paths and ADRs accurately', () => {
    const body = buildUmbrellaBody(parsed, featureIssueNumbers);
    expect(body).toContain('2 paths');
    expect(body).toContain('2 Architecture Decision Records');
  });
  test('lists each feature as a checkbox with its Issue number', () => {
    const body = buildUmbrellaBody(parsed, featureIssueNumbers);
    expect(body).toContain('- [ ] #43 — Low stock alert');
    expect(body).toContain('- [ ] #44 — Bulk adjustment');
  });
  test('ends with an umbrella marker', () => {
    const body = buildUmbrellaBody(parsed, featureIssueNumbers);
    expect(body.trimEnd().endsWith('<!-- agentic-app:umbrella:inventory-app -->')).toBe(true);
  });
});
