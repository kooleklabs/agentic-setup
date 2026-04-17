/**
 * Parses v2.6's design artefacts into a normalised structure.
 * Returns { projectName, features, adrs, openapiPaths }.
 */

const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { slugify } = require('./marker.js');

function readArchitectureMd(cwd) {
  const file = path.join(cwd, 'docs', 'architecture.md');
  if (!fs.existsSync(file)) {
    throw new Error(
      `docs/architecture.md not found in ${cwd}. Run \`npx @kooleklabs/agentic-app generate\` first.`
    );
  }
  return fs.readFileSync(file, 'utf8');
}

function extractProjectName(body) {
  const m = body.match(/^#\s+(?:Architecture\s*[—-]\s*)?(.+?)\s*$/m);
  if (!m) return 'project';
  return m[1].trim();
}

function extractAcceptanceSection(body) {
  const idx = body.indexOf('## Acceptance Criteria');
  if (idx === -1) {
    throw new Error('architecture.md is missing required `## Acceptance Criteria` section.');
  }
  const rest = body.slice(idx);
  const nextSec = rest.slice('## Acceptance Criteria'.length).search(/\n## (?!#)/);
  return nextSec === -1 ? rest : rest.slice(0, '## Acceptance Criteria'.length + nextSec);
}

function parseFeatures(acceptanceBody) {
  const blocks = acceptanceBody.split(/\n### Feature:\s*/).slice(1);
  if (blocks.length === 0) {
    throw new Error('architecture.md has no ### Feature: entries under `## Acceptance Criteria`.');
  }

  const slugCounts = new Map();
  return blocks.map((block) => {
    const firstLineEnd = block.indexOf('\n');
    const name = (firstLineEnd === -1 ? block : block.slice(0, firstLineEnd)).trim();
    const body = firstLineEnd === -1 ? '' : block.slice(firstLineEnd + 1);

    let slug = slugify(name);
    const count = (slugCounts.get(slug) || 0) + 1;
    slugCounts.set(slug, count);
    if (count > 1) slug = `${slug}-${count}`;

    const criteria = [];
    for (const line of body.split('\n')) {
      const m = line.match(/^\s*-\s+((?:Given|When|Then|And)\b.*)$/);
      if (m) criteria.push(m[1].trim());
    }

    const relatedPaths = [];
    const pathRe = /\/api\/[A-Za-z0-9/_{}:-]+/g;
    let pm;
    while ((pm = pathRe.exec(body)) !== null) {
      if (!relatedPaths.includes(pm[0])) relatedPaths.push(pm[0]);
    }

    const relatedAdrs = [];
    const adrRe = /docs\/decisions\/(\d{3,})-([a-z0-9-]+)\.md/g;
    let am;
    while ((am = adrRe.exec(body)) !== null) {
      relatedAdrs.push({ number: am[1], slug: am[2], path: am[0] });
    }

    return { name, slug, criteria, relatedPaths, relatedAdrs };
  });
}

function parseOpenApiPaths(cwd) {
  const file = path.join(cwd, 'contracts', 'api-spec.yaml');
  if (!fs.existsSync(file)) return [];
  let doc;
  try {
    doc = yaml.load(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
  if (!doc || typeof doc.paths !== 'object') return [];
  const out = [];
  for (const [p, methods] of Object.entries(doc.paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const m of Object.keys(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(m.toLowerCase())) {
        out.push({ method: m.toUpperCase(), path: p });
      }
    }
  }
  return out;
}

function parseAdrs(cwd) {
  const dir = path.join(cwd, 'docs', 'decisions');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((name) => {
      const m = name.match(/^(\d{3,})-([a-z0-9-]+)\.md$/);
      if (!m) return null;
      if (name.startsWith('000-')) return null;
      return { number: m[1], slug: m[2], path: `docs/decisions/${name}` };
    })
    .filter(Boolean)
    .sort((a, b) => a.number.localeCompare(b.number));
}

function parseArchitecture(cwd) {
  const body = readArchitectureMd(cwd);
  const projectName = extractProjectName(body);
  const acceptanceBody = extractAcceptanceSection(body);
  const features = parseFeatures(acceptanceBody);
  const adrs = parseAdrs(cwd);
  const openapiPaths = parseOpenApiPaths(cwd);
  return { projectName, features, adrs, openapiPaths };
}

module.exports = { parseArchitecture };
