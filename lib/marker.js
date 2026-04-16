/**
 * HTML-comment markers embedded in Issue bodies so re-runs can detect
 * items this tool created. Format: <!-- agentic-app:TYPE:SLUG -->
 */

const NAMESPACE = 'agentic-app';
const VALID_TYPES = new Set(['feature', 'umbrella', 'adr']);

function slugify(input) {
  if (!input) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/['`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildMarker(type, slug) {
  if (!VALID_TYPES.has(type)) {
    throw new Error(`Unknown marker type: ${type}. Expected one of: ${[...VALID_TYPES].join(', ')}`);
  }
  return `<!-- ${NAMESPACE}:${type}:${slugify(slug)} -->`;
}

function extractMarkers(body) {
  if (!body) return [];
  const re = new RegExp(`<!--\\s*${NAMESPACE}:([a-z]+):([a-z0-9-]+)\\s*-->`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) out.push({ type: m[1], slug: m[2] });
  return out;
}

module.exports = { buildMarker, extractMarkers, slugify, NAMESPACE };
