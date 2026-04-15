<div align="center">

# Universal Agentic Development Framework

**Drop into any project — new or existing. One command, one prompt. Ship with AI agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-5B3FFF.svg)](https://docs.claude.com/en/docs/claude-code)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](./CHANGELOG.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/maintained-yes-success.svg)](https://github.com/KoolekLabs/agentic-setup/commits/main)

[Quick start](#quick-start) •
[Existing codebases](#existing-codebases) •
[How it works](#how-it-works) •
[Architecture](#the-7-layer-architecture) •
[Examples](#examples) •
[FAQ](#faq) •
[Contributing](./CONTRIBUTING.md)

</div>

---

## Overview

A batteries-included framework that turns any codebase into an **agent-ready** workspace. It ships the scaffolding — agents, skills, commands, hooks, and guardrails — so Claude Code can plan, build, test, and review alongside you from day one.

- **Universal** — works with any stack (Next.js, Go, Laravel, Rails, Django, …)
- **Greenfield or existing** — spin up a new project OR migrate a legacy codebase with a gap report and phased plan
- **Opinionated defaults** — plan-first workflow, structured commits, test-before-ship
- **Progressive** — start solo, scale to multi-agent teams when you need throughput
- **Transparent** — every agent, skill, and hook is a plain Markdown file you can read and edit

---

## Quick start

<table>
<tr>
<td width="50%">

**Option A — Clone and run**

```bash
git clone https://github.com/KoolekLabs/agentic-setup.git
cd your-project
bash /path/to/agentic-setup/setup.sh
```

</td>
<td width="50%">

**Option B — One-shot install**

```bash
curl -fsSL https://raw.githubusercontent.com/\
KoolekLabs/agentic-setup/main/setup.sh | bash
```

</td>
</tr>
</table>

> **Prerequisites:** `bash`, `git`, and [Claude Code](https://docs.claude.com/en/docs/claude-code) installed.

---

## Existing codebases

Already have a project? `migrate.sh` analyzes your repo, generates a reality-accurate framework, and produces a prioritized gap report — no big-bang rewrite required.

```bash
# Standard depth (recommended) — samples source files to detect real patterns
bash migrate.sh

# Quick — manifests + README only
bash migrate.sh --quick

# Full audit — 20+ files, CI configs, infra
bash migrate.sh --full

# Target a specific directory
bash migrate.sh --dir /path/to/your/repo

# Resume from an existing analysis (skip Phase 1)
bash migrate.sh --from-analysis CODEBASE_ANALYSIS.md
```

**What it produces:**

| Artifact | What it is |
|----------|-----------|
| `CODEBASE_ANALYSIS.md` | Detected stack, commands, patterns, deliberate conventions |
| `.claude/` | Reality-accurate framework — CLAUDE.md reflects what code does today, not ideals |
| `MIGRATION_PLAN.md` | Gap report (CRITICAL → LOW) + phased roadmap with quick wins first |

> No CLI? Copy [`MIGRATE_TEMPLATE.md`](./MIGRATE_TEMPLATE.md) and paste into claude.ai with your files attached.

See [`examples/legacy-django-api.md`](./examples/legacy-django-api.md) for a full walkthrough on a real-world legacy codebase.

---

## How it works

Pick the path that matches your workflow. Expand each panel for details.

<details>
<summary><b>Path 1 — One-liner setup</b> &nbsp;·&nbsp; <i>fastest, base framework only</i></summary>

```bash
bash setup.sh                 # Creates the universal .claude/ framework
bash setup.sh --interactive   # Prompts for project name, stack, and conventions
```

Use this when you want the scaffolding now and will add domain skills manually later.

</details>

<details open>
<summary><b>Path 2 — Auto-generate from a requirement</b> &nbsp;·&nbsp; <i>recommended for new projects</i></summary>

Feed Claude a PRD, spec, or one-liner idea and it builds the entire framework plus domain-specific skills, agents, and configs.

```bash
# From a document
bash generate.sh --from proposal.docx
bash generate.sh --from requirements.md
bash generate.sh --from spec.pdf

# From an inline idea
bash generate.sh --idea "Ride-hailing app with Go Fiber and PostgreSQL"

# Interactive — paste your requirement when prompted
bash generate.sh
```

</details>

<details>
<summary><b>Path 3 — Migrate an existing codebase</b> &nbsp;·&nbsp; <i>reality-accurate setup + gap report</i></summary>

```bash
bash migrate.sh               # Scan → generate framework → gap report
bash migrate.sh --quick       # Surface scan only (manifests + README)
bash migrate.sh --full        # Deep audit (20+ files, CI, infra)
```

Three durable artifacts are produced — review and edit each before the next phase runs. Use `--from-analysis` to resume from a saved scan.

</details>

<details>
<summary><b>Path 4 — Prompt in Claude Code or claude.ai</b> &nbsp;·&nbsp; <i>no CLI needed</i></summary>

**New project:** Open [`PROMPT_TEMPLATE.md`](./PROMPT_TEMPLATE.md), copy the prompt, fill in your requirement, paste into Claude Code or claude.ai.

**Existing project:** Open [`MIGRATE_TEMPLATE.md`](./MIGRATE_TEMPLATE.md), fill in the four fields at the bottom, paste with your key files attached.

</details>

---

## What gets created

<details>
<summary><b>Project layout</b> (click to expand)</summary>

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
│   │   ├── self-review.md             ← Universal (test → lint → security fix loop)
│   │   ├── smart-pr.md                ← Universal (auto-generate PR description from diff)
│   │   ├── standup.md                 ← Universal (daily status from git + TODOs + tests)
│   │   ├── debug.md                   ← Universal (reproduce → isolate → fix → verify loop)
│   │   ├── check-contracts.md         ← Universal (verify /contracts/ match implementations)
│   │   ├── adr.md                     ← Universal (record architecture decisions to docs/decisions/)
│   │   ├── onboard.md                 ← Universal (orient new dev/agent to this codebase)
│   │   ├── review-pr.md               ← Universal
│   │   ├── plan-feature.md            ← Universal (phased plan with rollback strategies)
│   │   └── design-review.md           ← Universal
│   └── hooks/                         ← WHEN to auto-verify
│       ├── pre-commit.sh              ← Universal (auto-detects stack)
│       └── post-edit.sh               ← Universal (auto-detects language)
└── contracts/                         ← API specs, event schemas
```

</details>

---

## The 7-layer architecture

| # | Layer | Responsibility | Type |
|:-:|-------|----------------|:----:|
| 1 | **You** | Define scope, review PRs, sign off on designs | Human |
| 2 | **Design** | Cowork → Figma → Claude Code → back to Figma | Tools |
| 3 | **CLAUDE.md** | Tech stack, conventions, guardrails | Customize |
| 4 | **Agents** | 3 universal + 3 customizable subagents | Mixed |
| 5 | **Skills** | 4 universal + domain-specific knowledge | Mixed |
| 6 | **Automation** | Commands, hooks, settings, permissions | Universal |
| 7 | **External** | MCP servers, plugins, CI, headless mode | Customize |

### Scaling levels — same framework, different throttle

| Level | Mode | Agents | Token cost | When to use |
|:-----:|------|--------|:----------:|-------------|
| **L1** | Solo + subagents | 1 session | 1× | Daily work (80% of tasks) |
| **L2** | Agent teams | 3–7 parallel | 7× | Cross-layer features |
| **L3** | Multi-team | 10–30 via orchestrator | 20–35× | Multi-domain projects |
| **L4** | Headless / CI | Autonomous | 50×+ | Overnight batch, auto PR fixes |

---

## Examples

<details>
<summary><b>E-commerce platform</b></summary>

```bash
bash generate.sh --idea "E-commerce platform for Malaysian SMEs with product catalog, \
shopping cart, Stripe payments, order management, and delivery tracking. \
Stack: Next.js + Go Fiber + PostgreSQL + Redis. Deploy on AWS."
```

</details>

<details>
<summary><b>Mobile fitness app</b></summary>

```bash
bash generate.sh --from fitness-app-prd.md
```

</details>

<details>
<summary><b>Internal enterprise tool</b></summary>

```bash
bash generate.sh --idea "Internal HR management system with leave tracking, payroll \
calculation, and employee directory. Stack: Laravel + Vue.js + MySQL. \
Deploy on company K3s cluster."
```

</details>

<details>
<summary><b>Legacy Django REST API migration</b></summary>

```bash
bash migrate.sh --standard --dir /path/to/your/django-api
```

See the full scenario (pain points, expected output, phase-by-phase breakdown) in [`examples/legacy-django-api.md`](./examples/legacy-django-api.md).

</details>

Working requirement files live in [`examples/`](./examples):
- New project: `bash generate.sh --from examples/ecommerce-sme.md`
- Existing project: `bash migrate.sh --from examples/legacy-django-api.md` *(as a reference — point `--dir` at your actual repo)*

---

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

---

## Recommended plugins

Install directly inside Claude Code:

```text
/plugin install comprehensive-review
/plugin install security-scanning
```

---

## FAQ

<details>
<summary><b>Does this work with my stack?</b></summary>

Yes. The universal pieces (plan mode, commit conventions, hooks, testing skill) are stack-agnostic. Agents and domain skills are generated or customized for your specific tech stack.

</details>

<details>
<summary><b>Do I need the paid Claude plan?</b></summary>

You need access to Claude Code — any plan that includes it will work. Higher scaling levels (L3, L4) benefit from higher token budgets.

</details>

<details>
<summary><b>Can I use this on an existing codebase?</b></summary>

Yes — and there's a dedicated path for it. Run `migrate.sh` instead of `setup.sh`. It scans your repo, generates a framework that reflects what your code actually does today (not aspirational guardrails), and produces a `MIGRATION_PLAN.md` with a prioritized gap report and phased roadmap.

Key difference from `setup.sh`: the generated CLAUDE.md describes your current reality. Gaps between current state and best practices are surfaced in `MIGRATION_PLAN.md` rather than baked into guardrails the codebase can't follow yet.

</details>

<details>
<summary><b>How do I keep the context window clean?</b></summary>

Use `/compact` in long sessions, keep agent files under 50 lines and skill files under 100 lines, and rely on `.claudeignore` to exclude build artifacts and lockfiles.

</details>

<details>
<summary><b>Is it safe to run agents autonomously?</b></summary>

The defaults favor plan-first, test-before-commit workflows. For headless / CI modes, review permissions in `.claude/settings.json` and add repo-specific guardrails before granting write access.

</details>

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you start.

Guidelines in brief:

- Keep universal files universal
- Agent files under **50 lines**
- Skill files under **100 lines**
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, …)

---

## License

[MIT](./LICENSE) — use freely, modify, and distribute.

<div align="center">

---

**Built with care by [KoolekLabs](https://github.com/KoolekLabs)

If this saved you time, consider giving the repo a star.

</div>
