# Agentic Framework Generator — Prompt Template
# ================================================
#
# HOW TO USE:
# 1. Copy everything below the --- line
# 2. Replace [PASTE YOUR REQUIREMENT HERE] with your actual requirement
# 3. Paste into Claude Code CLI or claude.ai
#
# WORKS WITH:
# - A full PRD document
# - A proposal or spec
# - A rough idea ("Build an e-commerce platform for Malaysian SMEs")
# - A list of features
# - Even a screenshot description
#
# ================================================

---

I need you to set up a complete agentic development framework for a new project. First, run the base setup, then customize everything based on my requirement.

## Step 1: Create base framework

Create this exact directory structure with all files:

```
.claude/
├── agents/
│   ├── architect.md
│   ├── api-engineer.md
│   ├── frontend-engineer.md
│   ├── test-engineer.md
│   ├── security-reviewer.md
│   └── devops-engineer.md
├── skills/
│   ├── coding-standards/SKILL.md
│   ├── api-design/SKILL.md
│   ├── testing/SKILL.md
│   ├── security-review/SKILL.md
│   └── design-system/SKILL.md
├── commands/
│   ├── self-review.md
│   ├── smart-pr.md
│   ├── standup.md
│   ├── debug.md
│   ├── check-contracts.md
│   ├── adr.md
│   ├── onboard.md
│   ├── review-pr.md
│   ├── plan-feature.md
│   └── design-review.md
├── hooks/
│   ├── pre-commit.sh
│   └── post-edit.sh
├── settings.json
└── settings.local.json
.claudeignore
.mcp.json
CLAUDE.md
contracts/
docs/decisions/
```

For the universal files (architect.md, test-engineer.md, security-reviewer.md, all 5 universal skills, all 10 commands, hooks), use the standard Universal Agentic Development Framework v1.1.0 templates — you know these patterns.

## Step 2: Customize for my project

Read my requirement below and:

1. **CLAUDE.md** — Fill in: project name, tech stack (infer from requirement), build/test/lint/run commands, architectural guardrails specific to this project

2. **api-engineer.md** — Customize skills and rules for the detected backend stack

3. **frontend-engineer.md** — Customize for detected frontend framework + add design-system skill

4. **devops-engineer.md** — Customize for the deployment target (Docker, K8s, serverless, etc.)

5. **design-system/SKILL.md** — Replace `#REPLACE` color placeholders with colors appropriate for the project's target users and brand; fill in typography choices

6. **Domain skills** — For each major module/feature in the requirement, create a new `.claude/skills/[domain]/SKILL.md` with:
   - Business rules and constraints
   - Integration patterns
   - Domain-specific conventions
   - Edge cases to watch for

7. **.mcp.json** — Add MCP servers for: database (if mentioned), Figma (if UI work), payment gateway (if payments), and Context7 for live docs

8. **contracts/** — If APIs are described, create an OpenAPI skeleton at `contracts/api-spec.yaml`

## Step 3: Show me the result

After creating all files, run:
```bash
find . \( -name "*.md" -o -name "*.json" -o -name "*.sh" -o -name "*.yaml" \) \
  | grep -E "\.claude|CLAUDE|claudeignore|mcp\.json|contracts|docs/decisions" \
  | sort
```

Then give me a summary: what was created, what's universal vs customized, and what I should review first.

## MY REQUIREMENT:

[PASTE YOUR REQUIREMENT HERE]
