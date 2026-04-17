const fs = require('node:fs');
const path = require('node:path');
const { validatePlanBody } = require('./plan-template.js');

function readMergedPlan({ cwd, slug }) {
  const rel = `docs/plans/${slug}.md`;
  const abs = path.join(cwd, rel);

  if (!fs.existsSync(abs)) {
    throw new Error(
      `No plan found at ${rel}. ` +
      'Run `github-sync --issue <N>` first (without `--execute`) to generate a plan, then merge its PR.'
    );
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const body = stripHeader(raw);
  const validation = validatePlanBody(body);
  return {
    body,
    hasRequiredSections: validation.ok,
    missing: validation.missing,
  };
}

function stripHeader(raw) {
  // Split on the first standalone `---` line. Everything after it is the body.
  // If there's no separator, the whole file is the body.
  const sepMatch = raw.match(/^---\s*$/m);
  if (!sepMatch) return raw.trim();
  const sepIndex = raw.indexOf(sepMatch[0]);
  return raw.slice(sepIndex + sepMatch[0].length).trim();
}

module.exports = { readMergedPlan };
