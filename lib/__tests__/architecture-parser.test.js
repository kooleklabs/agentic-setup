const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { parseArchitecture } = require('../architecture-parser.js');

function mkTmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'parser-')); }
function write(p, body) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}

const FIXT_DIR = path.join(__dirname, 'fixtures');
const FIXT_ARCH = fs.readFileSync(path.join(FIXT_DIR, 'valid-architecture.md'), 'utf8');
const FIXT_API = fs.readFileSync(path.join(FIXT_DIR, 'valid-api-spec.yaml'), 'utf8');

describe('parseArchitecture — happy path', () => {
  let tmp;
  beforeEach(() => {
    tmp = mkTmp();
    write(path.join(tmp, 'docs/architecture.md'), FIXT_ARCH);
    write(path.join(tmp, 'contracts/api-spec.yaml'), FIXT_API);
    write(path.join(tmp, 'docs/decisions/001-auth-approach.md'), '# auth');
    write(path.join(tmp, 'docs/decisions/002-datastore.md'), '# db');
    write(path.join(tmp, 'docs/decisions/000-template.md'), '# template');
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('returns project name from top-level heading', () => {
    const r = parseArchitecture(tmp);
    expect(r.projectName).toBe('Inventory App');
  });
  test('extracts all features in order', () => {
    const r = parseArchitecture(tmp);
    expect(r.features).toHaveLength(2);
    expect(r.features[0].name).toBe('Low stock alert');
    expect(r.features[1].name).toBe('Bulk stock adjustment');
  });
  test('slugifies feature names', () => {
    const r = parseArchitecture(tmp);
    expect(r.features[0].slug).toBe('low-stock-alert');
    expect(r.features[1].slug).toBe('bulk-stock-adjustment');
  });
  test('extracts Gherkin criteria per feature', () => {
    const r = parseArchitecture(tmp);
    expect(r.features[0].criteria).toEqual([
      'Given a product with stock below threshold',
      'When an admin views the dashboard',
      'Then the product appears in the Low Stock panel with a red badge',
    ]);
  });
  test('detects related API paths per feature', () => {
    const r = parseArchitecture(tmp);
    expect(r.features[0].relatedPaths).toContain('/api/v1/products/low-stock');
    expect(r.features[1].relatedPaths).toContain('/api/v1/products/bulk');
  });
  test('detects related ADRs per feature', () => {
    const r = parseArchitecture(tmp);
    expect(r.features[0].relatedAdrs).toEqual([
      { number: '001', slug: 'auth-approach', path: 'docs/decisions/001-auth-approach.md' },
    ]);
  });
  test('returns full openapiPaths with method', () => {
    const r = parseArchitecture(tmp);
    expect(r.openapiPaths).toEqual([
      { method: 'GET', path: '/api/v1/products/low-stock' },
      { method: 'POST', path: '/api/v1/products/bulk' },
    ]);
  });
  test('returns all ADRs except the 000-template', () => {
    const r = parseArchitecture(tmp);
    expect(r.adrs.map((a) => a.number)).toEqual(['001', '002']);
  });
});

describe('parseArchitecture — error paths', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('throws if architecture.md is missing', () => {
    expect(() => parseArchitecture(tmp)).toThrow(/docs\/architecture\.md not found/);
  });
  test('throws if ## Acceptance Criteria missing', () => {
    write(path.join(tmp, 'docs/architecture.md'), '# Title\n\n## Backend\nstuff\n');
    expect(() => parseArchitecture(tmp)).toThrow(/## Acceptance Criteria/);
  });
  test('throws if no features found under Acceptance Criteria', () => {
    write(path.join(tmp, 'docs/architecture.md'), '# T\n\n## Acceptance Criteria\n\nNo features here.\n');
    expect(() => parseArchitecture(tmp)).toThrow(/no ### Feature:/);
  });
  test('handles missing api-spec.yaml gracefully (openapiPaths = [])', () => {
    write(path.join(tmp, 'docs/architecture.md'), FIXT_ARCH);
    const r = parseArchitecture(tmp);
    expect(r.openapiPaths).toEqual([]);
  });
  test('handles missing docs/decisions/ gracefully (adrs = [])', () => {
    write(path.join(tmp, 'docs/architecture.md'), FIXT_ARCH);
    const r = parseArchitecture(tmp);
    expect(r.adrs).toEqual([]);
  });
});

describe('parseArchitecture — edge cases', () => {
  let tmp;
  beforeEach(() => {
    tmp = mkTmp();
    write(path.join(tmp, 'contracts/api-spec.yaml'), FIXT_API);
  });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('deduplicates features with the same name via -2 suffix', () => {
    write(path.join(tmp, 'docs/architecture.md'), '# X\n\n## Acceptance Criteria\n\n### Feature: Login\n- Given x\n\n### Feature: Login\n- Given y\n');
    const r = parseArchitecture(tmp);
    expect(r.features[0].slug).toBe('login');
    expect(r.features[1].slug).toBe('login-2');
  });
  test('feature with no criteria bullets still parses (empty criteria)', () => {
    write(path.join(tmp, 'docs/architecture.md'), '# X\n\n## Acceptance Criteria\n\n### Feature: Empty\n\nno gherkin here\n');
    const r = parseArchitecture(tmp);
    expect(r.features[0].criteria).toEqual([]);
  });
});
