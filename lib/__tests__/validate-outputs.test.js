const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { validateArchitectOutputs } = require('../validate-outputs.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'validate-'));
}
function write(p, body) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, body);
}
const VALID_ARCH_MD = `# Architecture

## Backend
entities and endpoints...

## Frontend
wireframes...

## Integration
external services...

## Acceptance Criteria
feature: foo...
`;
const VALID_API_YAML = `openapi: 3.0.3
info:
  title: App
  version: 1.0.0
paths:
  /health:
    get:
      responses:
        '200': { description: ok }
`;

describe('validateArchitectOutputs', () => {
  let tmp;
  beforeEach(() => { tmp = mkTmp(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  test('returns ok=true when all outputs present and valid', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    write(path.join(tmp, 'docs/decisions/001-auth.md'), '# 001 Auth');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
  });

  test('reports missing architecture.md', () => {
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    write(path.join(tmp, 'docs/decisions/001-auth.md'), '# x');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('docs/architecture.md'))).toBe(true);
  });

  test('reports architecture.md missing required section headers', () => {
    write(path.join(tmp, 'docs/architecture.md'), '# Architecture\n\n## Backend\nstuff');
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    write(path.join(tmp, 'docs/decisions/001-x.md'), '#');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('architecture.md') && m.includes('Frontend'))).toBe(true);
  });

  test('reports missing api-spec.yaml', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'docs/decisions/001-x.md'), '#');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('contracts/api-spec.yaml'))).toBe(true);
  });

  test('reports invalid YAML in api-spec.yaml', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), 'openapi: 3.0\n  bad: [');
    write(path.join(tmp, 'docs/decisions/001-x.md'), '#');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('api-spec.yaml'))).toBe(true);
  });

  test('reports api-spec.yaml missing openapi/paths keys', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), 'foo: bar\n');
    write(path.join(tmp, 'docs/decisions/001-x.md'), '#');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('api-spec.yaml'))).toBe(true);
  });

  test('reports no ADR files', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    fs.mkdirSync(path.join(tmp, 'docs/decisions'), { recursive: true });
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('docs/decisions/'))).toBe(true);
  });

  test('ignores the 000-template.md ADR (pre-scaffolded, not a real ADR)', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    write(path.join(tmp, 'docs/decisions/000-template.md'), 'template');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(false);
    expect(r.missing.some((m) => m.includes('docs/decisions/'))).toBe(true);
  });

  test('accepts 001-* ADR (numbered, real)', () => {
    write(path.join(tmp, 'docs/architecture.md'), VALID_ARCH_MD);
    write(path.join(tmp, 'contracts/api-spec.yaml'), VALID_API_YAML);
    write(path.join(tmp, 'docs/decisions/001-use-postgres.md'), '# Decision');
    const r = validateArchitectOutputs(tmp);
    expect(r.ok).toBe(true);
  });
});
