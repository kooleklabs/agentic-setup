const { buildMarker, slugify } = require('./marker.js');

function buildFeatureBody(feature, openapiPaths) {
  const parts = [];

  parts.push('## Acceptance criteria');
  parts.push('');
  if (feature.criteria.length === 0) {
    parts.push('_No acceptance criteria listed in architecture.md — edit this issue to add them._');
  } else {
    for (const c of feature.criteria) parts.push(`- ${c}`);
  }
  parts.push('');

  if (feature.relatedPaths.length > 0) {
    parts.push('## Relevant API paths');
    parts.push('');
    for (const p of feature.relatedPaths) {
      const hit = openapiPaths.find((op) => op.path === p);
      const method = hit ? hit.method : 'GET';
      parts.push(`- \`${method} ${p}\` — from \`contracts/api-spec.yaml\``);
    }
    parts.push('');
  }

  if (feature.relatedAdrs.length > 0) {
    parts.push('## Related architectural decisions');
    parts.push('');
    for (const adr of feature.relatedAdrs) {
      parts.push(`- [${adr.number}-${adr.slug}](${adr.path})`);
    }
    parts.push('');
  }

  parts.push('## Source');
  parts.push('');
  parts.push(
    'Generated from [`docs/architecture.md`](docs/architecture.md) by `@kooleklabs/agentic-app push-architecture`. ' +
    'To implement: `npx @kooleklabs/agentic-app github-sync --issue <this number>` (v3.0+).'
  );
  parts.push('');
  parts.push(buildMarker('feature', feature.slug));

  return parts.join('\n');
}

function buildUmbrellaBody(parsed, featureIssueNumbers) {
  const { projectName, features, adrs, openapiPaths } = parsed;
  const parts = [];

  parts.push(`# 🏗 Architecture — ${projectName}`);
  parts.push('');
  parts.push(
    'System design for the initial release. All feature work is tracked here and grouped under the v1.0 milestone.'
  );
  parts.push('');

  parts.push('## Design documents');
  parts.push('');
  parts.push('- [`docs/architecture.md`](docs/architecture.md) — full system design');
  parts.push(
    `- [\`contracts/api-spec.yaml\`](contracts/api-spec.yaml) — OpenAPI 3.x (${openapiPaths.length} paths)`
  );
  parts.push(
    `- [\`docs/decisions/\`](docs/decisions/) — ${adrs.length} Architecture Decision Records`
  );
  parts.push('');

  parts.push('## Features (v1.0)');
  parts.push('');
  for (const f of features) {
    const num = featureIssueNumbers.get(f.slug);
    const ref = num ? `#${num}` : '(pending)';
    parts.push(`- [ ] ${ref} — ${f.name}`);
  }
  parts.push('');

  parts.push('## How we build this');
  parts.push('');
  parts.push(
    'Pick a feature Issue above and run: `npx @kooleklabs/agentic-app github-sync --issue <number>` (v3.0+). ' +
    'The framework will plan, execute, and open a PR.'
  );
  parts.push('');

  parts.push(buildMarker('umbrella', slugify(projectName)));

  return parts.join('\n');
}

module.exports = { buildFeatureBody, buildUmbrellaBody };
