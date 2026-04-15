/**
 * Builds the generation prompt that tells Claude how to customize the
 * already-scaffolded framework for a specific project requirement.
 *
 * @param {string} requirement - The project requirement text
 * @param {string} target - Output target: 'claude', 'copilot', or 'both'
 */

function buildCopilotInstructions(target) {
  if (target === 'claude') return '';

  return `

### 7. Generate Copilot CLI artifacts
The framework must also support GitHub Copilot CLI. Generate these additional files:

#### a) .github/copilot-instructions.md
Create a project-level Copilot instructions file. This should mirror the key content from CLAUDE.md in a format optimized for Copilot CLI:
- Project identity and tech stack
- Build/test/lint commands
- Architectural guardrails
- Code style conventions
- Verification protocol
Do NOT duplicate CLAUDE.md verbatim — Copilot already reads CLAUDE.md. Instead, add Copilot-specific guidance:
- Mention that skills are in \`.github/instructions/\`
- Reference agent definitions in \`AGENTS.md\`
- Note that \`/plan\` (not /plan-feature) is Copilot's planning command

#### b) AGENTS.md
Create an \`AGENTS.md\` file at the repository root that aggregates all agent definitions. Copilot CLI reads this file for agent context. Format:

\`\`\`markdown
# Agents

## Architect
[Role description and rules from .claude/agents/architect.md]

## API Engineer
[Role description and rules from .claude/agents/api-engineer.md]

## Frontend Engineer
[Role description and rules from .claude/agents/frontend-engineer.md]

## Test Engineer
[Role description and rules from .claude/agents/test-engineer.md]

## Security Reviewer
[Role description and rules from .claude/agents/security-reviewer.md]

## DevOps Engineer
[Role description and rules from .claude/agents/devops-engineer.md]
\`\`\`

Each section should contain the agent's role, workflow, and rules — adapted from the corresponding .claude/agents/*.md file.

#### c) .github/instructions/*.instructions.md
For EACH skill in \`.claude/skills/\`, create a corresponding instruction file at:
\`.github/instructions/[skill-name].instructions.md\`

Convert the YAML frontmatter to a markdown header and keep the content. Example:
- \`.claude/skills/coding-standards/SKILL.md\` → \`.github/instructions/coding-standards.instructions.md\`
- \`.claude/skills/api-design/SKILL.md\` → \`.github/instructions/api-design.instructions.md\`

Also create instruction files for any project-specific skills you generate.

#### d) File list verification
After creating all Copilot artifacts, verify by listing:
\`\`\`bash
find .github/instructions -name "*.instructions.md" | sort
ls -la AGENTS.md .github/copilot-instructions.md
\`\`\`
`;
}

function buildGeneratePrompt(requirement, target) {
  target = target || 'both';
  const copilotSection = buildCopilotInstructions(target);

  return `You are an expert software architect setting up an agentic development framework.

I will give you a project requirement. Your job is to customize the existing framework files (already scaffolded in the current working directory) for this specific project.

**Target: ${target}** — ${target === 'claude' ? 'Generate Claude Code artifacts only.' : target === 'copilot' ? 'Generate both Claude Code and Copilot CLI artifacts (Copilot reads CLAUDE.md natively).' : 'Generate artifacts for both Claude Code and Copilot CLI.'}

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
${copilotSection}
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
