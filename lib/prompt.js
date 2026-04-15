/**
 * Builds the generation prompt that tells Claude how to customize the
 * already-scaffolded framework for a specific project requirement.
 */

function buildGeneratePrompt(requirement) {
  return `You are an expert software architect setting up an agentic development framework.

I will give you a project requirement. Your job is to customize the existing .claude/ framework files (already scaffolded in the current working directory) for this specific project.

## What to do:

### 1. Update CLAUDE.md
Rewrite the CLAUDE.md file with:
- Actual project name and description
- Detected tech stack (infer from the requirement)
- Correct build/test/lint/run commands for that stack
- Project-specific architectural guardrails
- Domain-specific conventions

### 2. Customize agents
Edit these files to be stack-specific:
- \`.claude/agents/api-engineer.md\` — update skills list and rules for the detected backend stack
- \`.claude/agents/frontend-engineer.md\` — update for the detected frontend stack
- \`.claude/agents/devops-engineer.md\` — update for the detected infra/deployment

Do NOT modify these universal agents (they work as-is):
- architect.md
- test-engineer.md
- security-reviewer.md

### 3. Create project-specific skills
For each major domain/module in the requirement, create a SKILL.md file at:
\`.claude/skills/[domain-name]/SKILL.md\`

Each skill should contain:
- YAML frontmatter with name and description
- Domain rules, patterns, and conventions
- Business logic constraints
- Integration patterns

### 4. Create project-specific commands
If the requirement mentions specific workflows (deployment, data migration, etc.), create command files at:
\`.claude/commands/[command-name].md\`

### 5. Update .mcp.json
Add MCP servers relevant to the tech stack:
- PostgreSQL/MySQL if database mentioned
- Figma if UI/design work mentioned
- Sentry if monitoring mentioned
- Stripe/payment MCPs if payments mentioned

### 6. Create contracts
If the requirement describes APIs or multi-service communication, create:
- \`contracts/api-spec.yaml\` — OpenAPI skeleton with key endpoints
- \`contracts/events.md\` — event schemas if async communication mentioned

## Rules:
- Infer the tech stack from the requirement (do not ask)
- If the requirement is vague, make reasonable choices and note them in CLAUDE.md
- Every skill must be actionable — rules Claude can follow, not general advice
- Keep agent files under 50 lines
- Keep skill files under 100 lines
- Use the project's domain language in file names (e.g., recitation-tracking not audio-module)

## How to read existing files
Before overwriting a file that already exists (CLAUDE.md and the files under .claude/agents/), use the Read tool first, then Write. For new files, use Write directly.

## Output:
For each file you create or modify, use the Write or Edit tool to persist it.
When all files are ready, reply with a short summary listing the files you created and the key decisions you made.

## THE REQUIREMENT:

${requirement}
`;
}

module.exports = { buildGeneratePrompt };
