/**
 * Render the final plan Markdown file and validate that an LLM-produced
 * plan body contains every required section. Pure functions — no I/O.
 */

const REQUIRED_SECTIONS = [
  '## Problem statement',
  '## Acceptance criteria',
  '## Approach',
  '## Files to change',
  '## Implementation steps',
  '## Test plan',
  '## Rollback',
];

function renderPlanFile({ issueTitle, issueNumber, repoName, model, generatedAt, planBody }) {
  const issueUrl = `https://github.com/${repoName}/issues/${issueNumber}`;
  const header = [
    `# Plan: ${issueTitle}`,
    '',
    `**Source:** [Issue #${issueNumber}](${issueUrl}) · \`${repoName}\``,
    `**Generated:** ${generatedAt} by \`@kooleklabs/agentic-app\``,
    `**Model:** \`${model}\``,
    '',
    '---',
    '',
  ].join('\n');

  const body = planBody.trim();
  return `${header}${body}\n`;
}

function validatePlanBody(body) {
  const text = body || '';
  const missing = REQUIRED_SECTIONS.filter((section) => !text.includes(section));
  return { ok: missing.length === 0, missing };
}

module.exports = { renderPlanFile, validatePlanBody, REQUIRED_SECTIONS };
