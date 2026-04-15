# Universal Agentic Development Framework

> Drop into any project. One command or one prompt. Start building with AI agents.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-5B3FFF.svg)](https://docs.claude.com/en/docs/claude-code)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./CHANGELOG.md)

## Install

```bash
git clone https://github.com/KoolekLabs/agentic-setup.git
cd your-project
bash /path/to/agentic-setup/setup.sh
```

Or one-shot:

```bash
curl -fsSL https://raw.githubusercontent.com/KoolekLabs/agentic-setup/main/setup.sh | bash
```

## 3 ways to use this

### Way 1: One-liner setup (base framework)
```bash
bash setup.sh                      # Creates universal .claude/ framework
bash setup.sh --interactive        # Asks for your project details
```
Then manually add domain-specific skills.

### Way 2: Auto-generate from requirement (recommended)
```bash
# From a document (PRD, proposal, spec)
bash generate.sh --from proposal.docx
bash generate.sh --from requirements.md
bash generate.sh --from spec.pdf

# From an inline idea
bash generate.sh --idea "Build a ride-hailing app with Go Fiber and PostgreSQL"

# Interactive — paste your requirement
bash generate.sh
```
Claude Code reads your requirement, creates the base framework, AND generates project-specific skills, agents, and configs automatically.

### Way 3: Prompt in Claude Code / claude.ai
1. Open `PROMPT_TEMPLATE.md`
2. Copy the prompt
3. Replace `[PASTE YOUR REQUIREMENT HERE]` with your actual requirement
4. Paste into Claude Code CLI or claude.ai chat
5. Claude generates everything

---

## What gets created

```
your-project/
├── CLAUDE.md                          ← Project constitution (customize)
├── .claudeignore                      ← Keep context clean (universal)
├── .mcp.json                          ← External tool connections (customize)
├── .claude/
│   ├── agents/                        ← WHO does the work
│   │   ├── architect.md               ← Universal (Opus, lead)
│   │   ├── test-engineer.md           ← Universal (Sonnet)
│   │   ├── security-reviewer.md       ← Universal (Haiku, read-only)
│   │   ├── api-engineer.md            ← Customize per backend stack
│   │   ├── frontend-engineer.md       ← Customize per frontend stack
│   │   └── devops-engineer.md         ← Customize per infra
│   ├── skills/                        ← WHAT they know
│   │   ├── coding-standards/SKILL.md  ← Universal
│   │   ├── api-design/SKILL.md        ← Universal
│   │   ├── testing/SKILL.md           ← Universal
│   │   ├── security-review/SKILL.md   ← Universal
│   │   ├── design-system/SKILL.md     ← Customize per brand
│   │   └── [domain-skills]/SKILL.md   ← Add per project
│   ├── commands/                      ← HOW to trigger workflows
│   │   ├── review-pr.md               ← Universal
│   │   ├── plan-feature.md            ← Universal
│   │   └── design-review.md           ← Universal
│   └── hooks/                         ← WHEN to auto-verify
│       ├── pre-commit.sh              ← Universal (auto-detects stack)
│       └── post-edit.sh               ← Universal (auto-detects language)
└── contracts/                         ← API specs, event schemas
```

## The 7-layer architecture

| Layer | What | Type |
|-------|------|------|
| 1. You | Define scope, review PRs, sign off designs | Human |
| 2. Design | Cowork → Figma → Claude Code → back to Figma | Tools |
| 3. CLAUDE.md | Tech stack, conventions, guardrails | Customize |
| 4. Agents | 3 universal + 3 customizable subagents | Mixed |
| 5. Skills | 4 universal + domain-specific knowledge | Mixed |
| 6. Automation | Commands, hooks, settings, permissions | Universal |
| 7. External | MCP servers, plugins, CI/headless mode | Customize |

## Scaling levels (same framework, different throttle)

| Level | Mode | Agents | Token cost | When |
|-------|------|--------|------------|------|
| L1 | Solo + subagents | 1 session | 1x | Daily work (80% of tasks) |
| L2 | Agent Teams | 3-7 parallel | 7x | Cross-layer features |
| L3 | Multi-team | 10-30 via orchestrator | 20-35x | Multi-domain projects |
| L4 | Headless/CI | Autonomous | 50x+ | Overnight batch, auto PR fixes |

## Examples

### E-commerce platform
```bash
bash generate.sh --idea "E-commerce platform for Malaysian SMEs with product catalog, shopping cart, Stripe payments, order management, and delivery tracking. Stack: Next.js + Go Fiber + PostgreSQL + Redis. Deploy on AWS."
```

### Mobile fitness app
```bash
bash generate.sh --from fitness-app-prd.md
```

### Internal enterprise tool
```bash
bash generate.sh --idea "Internal HR management system with leave tracking, payroll calculation, and employee directory. Stack: Laravel + Vue.js + MySQL. Deploy on company K3s cluster."
```

## Adding domain skills manually

```bash
mkdir -p .claude/skills/my-domain
cat > .claude/skills/my-domain/SKILL.md << 'EOF'
---
name: my-domain
description: When to auto-activate this skill
---
# My domain rules
- Business rule 1
- Business rule 2
- Integration pattern
- Edge cases to watch for
EOF
```

## Recommended plugins (install in Claude Code)

```
/plugin install dev-workflows@claude-code-workflows
/plugin install comprehensive-review
/plugin install security-scanning
```

## Examples

Working requirement files in [`examples/`](./examples) — run `bash generate.sh --from examples/ecommerce-sme.md` to see the generator in action.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Keep universal files universal, agent files under 50 lines, skill files under 100 lines.

## License

[MIT](./LICENSE) — use freely, modify, distribute.

---

Built by KoolekLabs / AmanLabs
