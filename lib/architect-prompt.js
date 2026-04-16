/**
 * Builds the prompt that drives the architect agent's Design Gate Mode.
 * Produces a full system design (ERD, OpenAPI, wireframes, ADRs, acceptance
 * criteria) — not a plan review of existing work.
 *
 * @param {object} opts
 * @param {string} opts.requirement - Project requirement text
 * @param {string} [opts.stack]     - Optional detected stack hint
 * @param {boolean} [opts.retry]    - If true, builds a retry prompt listing gaps
 * @param {string[]} [opts.missing] - Missing output file paths (retry only)
 */
function buildArchitectPrompt({ requirement, stack, retry = false, missing = [] }) {
  if (retry) {
    return `You are continuing in Design Gate Mode. The previous attempt did not produce all required outputs.

## Missing outputs to complete

${missing.map((m) => `- ${m}`).join('\n')}

Re-read the existing \`docs/architecture.md\` if it exists, then produce the missing pieces. Keep what's already there unless it's incomplete.

## Requirements for each output

- \`docs/architecture.md\` must contain these four sections with exactly these headers: \`## Backend\`, \`## Frontend\`, \`## Integration\`, \`## Acceptance Criteria\`.
- \`contracts/api-spec.yaml\` must be valid OpenAPI 3.x with \`openapi:\`, \`info:\`, and \`paths:\` keys. It must describe every endpoint you identified.
- \`docs/decisions/\` must contain at least one ADR file matching \`NNN-*.md\` (e.g. \`001-use-postgres.md\`), one per non-obvious architectural decision.

## The original requirement

${requirement}
`;
  }

  const stackLine = stack ? `\n**Detected stack hint:** ${stack}\n` : '';

  return `You are the architect agent running in **Design Gate Mode**.

A framework has just been scaffolded in the current working directory. Before any feature code is written, your job is to produce the full system design from the requirement below. This is not a plan review — you are creating the architecture from scratch.

${stackLine}
## What to produce

Write these files directly to disk using the Write tool. Do not ask for confirmation — the human reviews them after you finish.

### 1. \`docs/architecture.md\` — full system design

Single Markdown document with exactly these four top-level sections:

- \`## Backend\`
  - ERD (entity-relationship diagram) — Markdown table or ASCII art listing entities, fields, and relationships
  - API contracts — summary of endpoints (full OpenAPI goes in \`contracts/api-spec.yaml\`)
  - Service layer breakdown — one line per service describing responsibility
  - Auth approach — strategy (session / JWT / OAuth) with rationale (also captured as an ADR)

- \`## Frontend\`
  - User flows & journeys — step-by-step for each primary user path
  - Wireframes — Markdown/ASCII wireframe per primary screen
  - Component structure — tree of components, which screen they appear on
  - Design tokens — colour, spacing, typography scale (real values, not placeholders)
  - Navigation — top-level information architecture

- \`## Integration\`
  - External services (payment, email, analytics, etc.)
  - MCP connections needed (Figma for design, Postgres MCP for DB, etc.)

- \`## Acceptance Criteria\`
  - One subsection per feature: acceptance criteria and Gherkin-lite E2E scenarios.
    Example format:
    \`\`\`
    ### Feature: Low stock alert
    - Given a product with stock below threshold
    - When an admin views the dashboard
    - Then the product appears in the Low Stock panel with a red badge
    \`\`\`

### 2. \`docs/decisions/001-*.md\` onwards — Architecture Decision Records

One ADR per non-obvious decision. At minimum: auth approach, data store, state-management strategy (frontend), any major external dependency choice. Use the template at \`docs/decisions/000-template.md\` (already scaffolded).

Filename pattern: \`001-auth-approach.md\`, \`002-datastore.md\`, etc. — kebab-case, numbered sequentially.

### 3. \`contracts/api-spec.yaml\` — real OpenAPI 3.x

This must be a real OpenAPI document, not a stub. It must parse as valid YAML and include:
- \`openapi: 3.0.x\` or later
- \`info:\` with title and version
- \`paths:\` describing every endpoint from the Backend section — request/response schemas, status codes
- \`components/schemas:\` for shared types

### 4. (Optional) \`.claude/skills/[domain]/SKILL.md\`

If the requirement has a clear primary domain (inventory, billing, scheduling, etc.), create a calibrated skill file with rules specific to that domain. Skip if no clear single domain.

## Rules

- Do **not** write feature code, tests, or implementation — only design artefacts
- Do **not** ask clarifying questions — make reasonable defaults and record them as ADRs
- Keep \`docs/architecture.md\` under ~2000 lines; move detail into ADRs if needed
- Use real values in design tokens (#3B82F6, not #REPLACE)
- Every endpoint in the Backend section must have a matching \`paths:\` entry in the OpenAPI file

## The requirement

${requirement}
`;
}

module.exports = { buildArchitectPrompt };
