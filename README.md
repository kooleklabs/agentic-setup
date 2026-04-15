<div align="center">

# Universal Agentic Development Framework

**Drop into any project — new or existing. One command, one prompt. Ship with AI agents.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-5B3FFF.svg)](https://docs.claude.com/en/docs/claude-code)
[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](./CHANGELOG.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![Maintained](https://img.shields.io/badge/maintained-yes-success.svg)](https://github.com/KoolekLabs/agentic-setup/commits/main)

[Start here](#-start-here) •
[Daily workflow](#-daily-workflow) •
[Command reference](#-command-reference) •
[Architecture](#-architecture) •
[Examples](#-examples) •
[FAQ](#-faq) •
[Contributing](./CONTRIBUTING.md)

</div>

---

## Overview

A batteries-included framework that turns any codebase into an **agent-ready** workspace. It ships the scaffolding — agents, skills, commands, hooks, and guardrails — so Claude Code can plan, build, test, and review alongside you from day one.

| | |
|---|---|
| **Universal** | Works with any stack — Next.js, Go, Laravel, Rails, Django, and more |
| **Greenfield or existing** | New project or legacy codebase — both are first-class |
| **Opinionated defaults** | Plan-first workflow, impact analysis, test-before-ship, rollback in every plan |
| **Progressive** | Start solo, scale to multi-agent teams when you need throughput |
| **Transparent** | Every agent, skill, and hook is a plain Markdown file you own and can edit |

---

## 🚀 Start here

![Framework overview](./docs/framework-overview.png)

> **Prerequisites:** `bash`, `git`, and [Claude Code](https://docs.claude.com/en/docs/claude-code) installed. The npm path additionally needs Node.js 16+.

---

### Path 1 — Base framework only *(fastest)*

```bash
cd your-project

# Recommended — via npx (no clone, no curl, auto-updates)
npx @kooleklabs/agentic-app init

# Interactive — prompts for project name, stack, and conventions
npx @kooleklabs/agentic-app init --interactive
```

<details>
<summary>Alternative install methods (clone or curl)</summary>

```bash
# Clone + run
git clone https://github.com/KoolekLabs/agentic-setup.git
bash /path/to/agentic-setup/setup.sh

# One-shot curl (no clone required)
curl -fsSL https://raw.githubusercontent.com/KoolekLabs/agentic-setup/main/setup.sh | bash
```

</details>

Use this when you want the scaffolding now and will add domain skills manually.

---

### Path 2 — Auto-generate from a requirement *(recommended for new projects)*

Feed Claude a PRD, spec, or one-liner idea. It generates the full framework with domain-specific agents, skills, and API contracts.

```bash
cd your-project

# From a document
npx @kooleklabs/agentic-app generate --from /path/to/proposal.docx
npx @kooleklabs/agentic-app generate --from /path/to/requirements.md

# From an inline idea
npx @kooleklabs/agentic-app generate --idea "Ride-hailing app with Go Fiber and PostgreSQL"

# Interactive — paste your requirement when prompted
npx @kooleklabs/agentic-app generate
```

<details>
<summary>Alternative install methods (clone or curl)</summary>

```bash
# Clone + run
bash /path/to/agentic-setup/generate.sh --from /path/to/proposal.docx

# One-shot curl
curl -fsSL https://raw.githubusercontent.com/KoolekLabs/agentic-setup/main/generate.sh \
  | bash -s -- --from /path/to/proposal.docx
```

</details>

**What Claude generates for you:**
- `CLAUDE.md` filled with your actual stack and guardrails
- Stack-specific agent configurations
- Domain skills for each major module
- OpenAPI contract skeleton (if APIs mentioned)
- `.mcp.json` wired to relevant tools (DB, Figma, Stripe, etc.)

---

### Path 3 — Migrate an existing codebase *(reality-accurate setup + gap report)*

Already have a project? `migrate` analyzes your repo, generates a framework that reflects what your code **actually does today**, and produces a prioritized gap report.

```bash
cd your-project

# Standard depth (recommended)
npx @kooleklabs/agentic-app migrate

# Quick — manifests + README only
npx @kooleklabs/agentic-app migrate --quick

# Full audit — 20+ files, CI configs, infra
npx @kooleklabs/agentic-app migrate --full

# Target a specific directory
npx @kooleklabs/agentic-app migrate --dir /path/to/your/repo

# Resume from an existing scan
npx @kooleklabs/agentic-app migrate --from-analysis CODEBASE_ANALYSIS.md
```

**Three durable artifacts — review each before the next phase runs:**

| Artifact | What it is |
|----------|------------|
| `CODEBASE_ANALYSIS.md` | Detected stack, commands, patterns, deliberate conventions |
| `.claude/` | Reality-accurate framework — CLAUDE.md reflects what code does today |
| `MIGRATION_PLAN.md` | Gap report (CRITICAL → LOW) + phased roadmap with quick wins first |

> No CLI? Copy [`MIGRATE_TEMPLATE.md`](./MIGRATE_TEMPLATE.md) and paste into claude.ai with your files attached.

See [`examples/legacy-django-api.md`](./examples/legacy-django-api.md) for a full walkthrough.

---

### Path 4 — Paste into Claude Code or claude.ai *(no CLI needed)*

Open [`PROMPT_TEMPLATE.md`](./PROMPT_TEMPLATE.md), copy the prompt, fill in your requirement, and paste it into Claude Code or claude.ai. Claude creates the full framework directly.

---

## 🗓 Daily workflow

The infographic above covers the full workflow — from picking your setup path to shipping. Here's a quick reference for each phase:

---

## 📋 Command reference

All commands are invoked with `/` inside Claude Code (e.g. `/plan-feature`).

| Command | When to use | What it does |
|---------|-------------|--------------|
| `/onboard` | New session, new teammate | Scans CLAUDE.md, ADRs, git log, test health → orientation summary |
| `/standup` | Start of day | Generates Yesterday / Today / Blockers from real git data |
| `/plan-feature` | Before any non-trivial change | Blast radius audit + risk matrix + phased plan with rollback steps |
| `/adr` | After a significant architecture decision | Writes a numbered record to `docs/decisions/` — prevents re-litigating settled choices |
| `/debug` | Something is broken | Structured loop: reproduce → read error → isolate → hypothesize → fix → verify |
| `/self-review` | Before every commit | Tests → lint → security spot-check, loops until all green |
| `/check-contracts` | After any API change | Audits `/contracts/` against implementation — flags drift and breaking changes |
| `/smart-pr` | Ready to open a PR | Generates What / Why / How / Test plan / Risks from the actual diff |
| `/review-pr` | Reviewing a branch | Code quality + convention check against CLAUDE.md |
| `/design-review` | After UI implementation | Compares code against Figma designs (requires Figma MCP) |

---

## 🏗 Architecture

### What gets created

<details>
<summary><b>Full project layout</b> (click to expand)</summary>

```
your-project/
├── CLAUDE.md                          ← Project constitution (customize this first)
├── .claudeignore                      ← Keeps context window clean
├── .mcp.json                          ← External tool connections (customize)
├── docs/
│   └── decisions/                     ← Architecture Decision Records (/adr writes here)
├── contracts/                         ← API specs and event schemas
└── .claude/
    ├── agents/                        ← WHO does the work
    │   ├── architect.md               ← Universal · Opus · leads planning + impact analysis
    │   ├── test-engineer.md           ← Universal · Sonnet
    │   ├── security-reviewer.md       ← Universal · Haiku · read-only
    │   ├── api-engineer.md            ← Customize per backend stack
    │   ├── frontend-engineer.md       ← Customize per frontend stack
    │   └── devops-engineer.md         ← Customize per infra
    ├── skills/                        ← WHAT they know (auto-activate when relevant)
    │   ├── coding-standards/SKILL.md  ← Universal
    │   ├── api-design/SKILL.md        ← Universal
    │   ├── testing/SKILL.md           ← Universal
    │   ├── security-review/SKILL.md   ← Universal
    │   ├── design-system/SKILL.md     ← Customize per brand
    │   └── [domain-skills]/SKILL.md   ← Add per project
    ├── commands/                      ← HOW to trigger workflows (the 10 slash commands)
    └── hooks/                         ← WHEN to auto-verify
        ├── pre-commit.sh              ← Blocks commit if lint or tests fail
        └── post-edit.sh               ← Auto-formats files after every edit
```

</details>

---

### The 7-layer architecture

| # | Layer | Responsibility | Type |
|:-:|-------|----------------|:----:|
| 1 | **You** | Define scope, review PRs, sign off on designs | Human |
| 2 | **Design** | Figma → Claude Code → back to Figma | Tools |
| 3 | **CLAUDE.md** | Tech stack, conventions, guardrails | Customize |
| 4 | **Agents** | 3 universal + 3 customizable subagents | Mixed |
| 5 | **Skills** | 5 universal + domain-specific knowledge | Mixed |
| 6 | **Automation** | 10 commands + 2 hooks + settings | Universal |
| 7 | **External** | MCP servers, CI, headless mode | Customize |

---

### Scaling levels — same framework, different throttle

| Level | Mode | Agents | Token cost | When to use |
|:-----:|------|--------|:----------:|-------------|
| **L1** | Solo + subagents | 1 session | 1× | Daily work (80% of tasks) |
| **L2** | Agent teams | 3–7 parallel | 7× | Cross-layer features |
| **L3** | Multi-team | 10–30 via orchestrator | 20–35× | Multi-domain projects |
| **L4** | Headless / CI | Autonomous | 50×+ | Overnight batch, auto PR fixes |

---

## 💡 Examples

<details>
<summary><b>E-commerce platform</b></summary>

```bash
npx @kooleklabs/agentic-app generate --idea "E-commerce platform for Malaysian SMEs with product catalog, \
shopping cart, Stripe payments, order management, and delivery tracking. \
Stack: Next.js + Go Fiber + PostgreSQL + Redis. Deploy on AWS."
```

</details>

<details>
<summary><b>Mobile fitness app</b></summary>

```bash
npx @kooleklabs/agentic-app generate --from /path/to/fitness-app-prd.md
```

</details>

<details>
<summary><b>Internal enterprise tool</b></summary>

```bash
npx @kooleklabs/agentic-app generate --idea "Internal HR management system with leave tracking, payroll \
calculation, and employee directory. Stack: Laravel + Vue.js + MySQL. \
Deploy on company K3s cluster."
```

</details>

<details>
<summary><b>Legacy Django REST API migration</b></summary>

```bash
npx @kooleklabs/agentic-app migrate --dir /path/to/your/django-api
```

See the full scenario in [`examples/legacy-django-api.md`](./examples/legacy-django-api.md).

</details>

Working requirement files live in [`examples/`](./examples):
- New project: `npx @kooleklabs/agentic-app generate --from ./examples/ecommerce-sme.md`
- Existing project: see `examples/legacy-django-api.md` *(point `--dir` at your actual repo)*

---

## ➕ Adding domain skills

```bash
mkdir -p .claude/skills/payments
cat > .claude/skills/payments/SKILL.md << 'EOF'
---
name: payments
description: Auto-activates when working on payment flows, billing, or Stripe integration
---
# Payment rules
- Always use idempotency keys on Stripe charges
- Never log full card numbers or CVVs — mask to last 4 digits
- Webhook handlers must verify signature before processing
- Refund logic lives in PaymentService, never in controllers
EOF
```

---

## ❓ FAQ

<details>
<summary><b>Does this work with my stack?</b></summary>

Yes. The universal pieces (plan mode, commit conventions, hooks, testing skill) are stack-agnostic. Agents and domain skills are generated or customized for your specific tech stack by `generate.sh` or `migrate.sh`.

</details>

<details>
<summary><b>Do I need the paid Claude plan?</b></summary>

You need access to Claude Code — any plan that includes it will work. Higher scaling levels (L3, L4) benefit from higher token budgets.

</details>

<details>
<summary><b>Can I use this on an existing codebase?</b></summary>

Yes — run `migrate.sh` instead of `setup.sh`. The key difference: the generated CLAUDE.md describes your current reality. Gaps between current state and best practices are surfaced in `MIGRATION_PLAN.md` rather than baked into guardrails the codebase can't follow yet.

Patterns consistent across 3+ files are treated as deliberate conventions, not gaps — so you won't get a gap report telling you to change how your team already works.

</details>

<details>
<summary><b>What's the difference between agents, skills, and commands?</b></summary>

- **Agents** (`/agents`) — *who* does the work. Specialized subagents with a defined role, toolset, and workflow (architect, api-engineer, etc.). Invoked by Claude when delegating tasks.
- **Skills** (`/skills`) — *what* they know. Compact knowledge files that auto-activate based on context. An api-engineer automatically loads the `api-design` skill; a frontend task loads `design-system`.
- **Commands** (`/commands`) — *how* to trigger workflows. The 10 slash commands you type directly: `/plan-feature`, `/self-review`, `/debug`, etc.

</details>

<details>
<summary><b>How do I keep the context window clean?</b></summary>

Use `/compact` in long sessions. Keep agent files under 50 lines and skill files under 100 lines. `.claudeignore` excludes build artifacts and lockfiles automatically.

</details>

<details>
<summary><b>Is it safe to run agents autonomously?</b></summary>

The defaults favor plan-first, test-before-commit workflows. The architect agent runs in `plan` permission mode — it shows a plan and waits for approval before implementing. For headless / CI modes, review permissions in `.claude/settings.json` before granting write access.

</details>

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you start.

Guidelines in brief:
- Keep universal files universal — no stack-specific logic in base agents or skills
- Agent files under **50 lines**, skill files under **100 lines**
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, …)

---

## License

[MIT](./LICENSE) — use freely, modify, and distribute.

<div align="center">

---

**Built with care by [KoolekLabs](https://github.com/KoolekLabs)**

If this saved you time, consider giving the repo a ⭐

</div>
