/**
 * Validates that the architect's design gate outputs are present and well-formed.
 * Returns { ok, missing: string[] } — missing entries are human-readable descriptions
 * of what's missing or invalid, suitable for feeding into the retry prompt.
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const REQUIRED_ARCH_SECTIONS = ['## Backend', '## Frontend', '## Integration', '## Acceptance Criteria'];

function checkArchitectureMd(cwd, missing) {
  const file = path.join(cwd, 'docs/architecture.md');
  if (!fs.existsSync(file)) {
    missing.push('docs/architecture.md (file not created)');
    return;
  }
  const body = fs.readFileSync(file, 'utf8');
  for (const header of REQUIRED_ARCH_SECTIONS) {
    if (!body.includes(header)) {
      missing.push(`docs/architecture.md (missing required section header "${header}")`);
    }
  }
}

function checkApiSpec(cwd, missing) {
  const file = path.join(cwd, 'contracts/api-spec.yaml');
  if (!fs.existsSync(file)) {
    missing.push('contracts/api-spec.yaml (file not created)');
    return;
  }
  let doc;
  try {
    doc = yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    missing.push(`contracts/api-spec.yaml (invalid YAML: ${err.message})`);
    return;
  }
  if (!doc || typeof doc !== 'object') {
    missing.push('contracts/api-spec.yaml (not an object)');
    return;
  }
  if (!doc.openapi) missing.push('contracts/api-spec.yaml (missing "openapi" key)');
  if (!doc.paths || typeof doc.paths !== 'object') {
    missing.push('contracts/api-spec.yaml (missing or empty "paths" key)');
  }
}

function checkAdrs(cwd, missing) {
  const dir = path.join(cwd, 'docs/decisions');
  if (!fs.existsSync(dir)) {
    missing.push('docs/decisions/ (directory missing)');
    return;
  }
  const realAdrs = fs
    .readdirSync(dir)
    .filter((name) => /^\d{3}-.+\.md$/.test(name))
    .filter((name) => !name.startsWith('000-'));
  if (realAdrs.length === 0) {
    missing.push('docs/decisions/ (no ADR file matching NNN-*.md, excluding the 000-template)');
  }
}

function validateArchitectOutputs(cwd) {
  const missing = [];
  checkArchitectureMd(cwd, missing);
  checkApiSpec(cwd, missing);
  checkAdrs(cwd, missing);
  return { ok: missing.length === 0, missing };
}

module.exports = { validateArchitectOutputs };
