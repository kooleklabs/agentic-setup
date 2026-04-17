/**
 * Builds the prompt that turns a feature Issue + architecture context
 * into an implementation plan document. Pure builder — no I/O.
 *
 * @param {object} opts
 * @param {{number: number, title: string, body: string, markerSlug: string}} opts.issue
 * @param {string}  opts.architectureSection - The `### Feature: ...` block matching the Issue's slug
 * @param {string|null} opts.apiSpecYaml     - Full contracts/api-spec.yaml contents, or null
 * @param {Array<{number: string, slug: string, body: string}>} opts.adrs
 * @param {string}  opts.repoName            - "owner/repo", for context
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildPlanPrompt({ issue, architectureSection, apiSpecYaml, adrs, repoName }) {
  const systemPrompt = `You are a planning agent. Your job is to produce a single implementation-plan
Markdown document for one feature. The human will review your plan in a PR
before any code is written.

## Required output structure

Your response MUST be a valid Markdown document containing these top-level sections, in this order:

- \`## Problem statement\` — 2-3 paragraphs paraphrasing the Issue body and acceptance criteria
- \`## Acceptance criteria\` — the Given/When/Then lines, copied verbatim
- \`## Approach\` — recommended design referencing the architecture document and ADRs
- \`## Files to change\` — bullet list of paths with a short description per path. This is the ONLY section allowed to contain fenced code blocks.
- \`## Implementation steps\` — numbered, small, each step independently testable and revertable
- \`## Test plan\` — specific unit, integration, and manual cases
- \`## Open questions\` — anything you were unsure about. Empty list is acceptable: "- None."
- \`## Rollback\` — exactly how to undo this change if it goes wrong

## Rules

- No fenced code blocks outside \`## Files to change\`. Use inline \`code\` for identifiers elsewhere.
- Do NOT invent filesystem state. Only reference files visible in the inputs below OR propose new paths in \`## Files to change\`.
- Do NOT ask clarifying questions. If unsure, add to \`## Open questions\`.
- Keep the document under ~16,000 tokens total.
- Refer to the Issue as \`#<number>\` (e.g. \`#42\`).

Respond with the plan document only — no preamble, no closing commentary.`;

  const apiSpecBlock = apiSpecYaml
    ? ['```yaml', apiSpecYaml.trim(), '```'].join('\n')
    : '_No OpenAPI spec in this project._';

  const adrsBlock = adrs.length === 0
    ? '_No linked ADRs._'
    : adrs.map((adr) => (
      `### ADR ${adr.number}-${adr.slug}\n\n${adr.body.trim()}`
    )).join('\n\n');

  const userPrompt = `Repository: \`${repoName}\`
Feature Issue: #${issue.number} — "${issue.title}"
Marker slug: \`${issue.markerSlug}\`

## Issue body

${issue.body.trim()}

## Matching architecture section (from \`docs/architecture.md\`)

${architectureSection.trim()}

## OpenAPI spec (\`contracts/api-spec.yaml\`)

${apiSpecBlock}

## Linked ADRs

${adrsBlock}

---

Produce the implementation plan for this feature following the structure and rules in the system prompt.`;

  return { systemPrompt, userPrompt };
}

module.exports = { buildPlanPrompt };
