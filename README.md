<div align="center">

# Universal Agentic Development Framework

**Drop into any project — new or existing. One command, one prompt. Ship with AI agents.**

[![npm](https://img.shields.io/npm/v/@kooleklabs/agentic-app.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@kooleklabs/agentic-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-5B3FFF.svg)](https://docs.claude.com/en/docs/claude-code)
[![CI](https://github.com/kooleklabs/agentic-setup/actions/workflows/ci.yml/badge.svg)](https://github.com/kooleklabs/agentic-setup/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Quick start](#-quick-start) •
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

## 🚀 Quick start

![Framework overview](./docs/framework-overview.png)

> **Prerequisites:** Node.js 16+ and [Claude Code](https://docs.claude.com/en/docs/claude-code). That's it — no clone, no curl, no path juggling.

```bash
cd your-project

# Pick one:
npx @kooleklabs/agentic-app init                              # blank scaffolding
npx @kooleklabs/agentic-app generate --from proposal.docx    # from a PRD / spec
npx @kooleklabs/agentic-app migrate                           # existing codebase
```

`npx` pulls the latest release from npm, runs once, and caches it for next time. The framework lands in your current directory.

---

### Which command?

| Command | When to use | What you get |
|---|---|---|
| **`init`** | Blank slate, known stack | Universal framework — 6 agents, 5 skills, 10 slash commands, pre-commit hooks. You fill in `CLAUDE.md`. |
| **`generate`** | Have a PRD, proposal, or a one-liner idea | Everything `init` gives you, plus stack-specific agents, domain skills per module, and an OpenAPI skeleton if APIs are mentioned. |
| **`migrate`** | Existing codebase | Framework tuned to what your code **actually does today** + `MIGRATION_PLAN.md` gap report (CRITICAL → LOW) with a phased roadmap. |

<details>
<summary><b><code>generate</code> — all flags</b></summary>

```bash
# From a document (.md, .txt, .docx, .pdf)
npx @kooleklabs/agentic-app generate --from /path/to/proposal.docx
npx @kooleklabs/agentic-app generate --from /path/to/requirements.md

# From an inline idea
npx @kooleklabs/agentic-app generate --idea "Ride-hailing app with Go Fiber and PostgreSQL"

# Interactive — paste when prompted
npx @kooleklabs/agentic-app generate
```

**What Claude writes:** a customized `CLAUDE.md`, stack-specific agents, domain skills per major module, an OpenAPI contract skeleton (if APIs), and a `.mcp.json` wired to relevant tools (DB, Figma, Stripe, etc.).

> `.docx` needs `pandoc` on `PATH`. `.pdf` needs `pdftotext` (from `poppler-utils`). Markdown and plain text work with no extras.

</details>

<details>
<summary><b><code>migrate</code> — all flags</b></summary>

```bash
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

**Three durable artifacts you review between phases:**

| Artifact | What it is |
|---|---|
| `CODEBASE_ANALYSIS.md` | Detected stack, commands, patterns, deliberate conventions |
| `.claude/` | Reality-accurate framework — `CLAUDE.md` reflects what the code does today |
| `MIGRATION_PLAN.md` | Gap report (CRITICAL → LOW) + phased roadmap with quick wins first |

See [`examples/legacy-django-api.md`](./examples/legacy-django-api.md) for a full walkthrough.

</details>

---

### Install globally *(optional)*

Skip the `npx` prefix each time:

```bash
npm install -g @kooleklabs/agentic-app

agentic-app init
agentic-app generate --from proposal.docx
agentic-app migrate
```

### No Node.js? Use the bash scripts directly

<details>
<summary>Clone or curl — same scaffolding, no npm dependency</summary>

```bash
# One-shot curl (base framework)
curl -fsSL https://raw.githubusercontent.com/kooleklabs/agentic-setup/main/setup.sh | bash

# Generate from a doc via curl
curl -fsSL https://raw.githubusercontent.com/kooleklabs/agentic-setup/main/generate.sh \
  | bash -s -- --from /path/to/proposal.docx

# Or clone if you prefer local scripts
git clone https://github.com/kooleklabs/agentic-setup.git
bash /path/to/agentic-setup/setup.sh
```

</details>

### No CLI at all?

Copy [`PROMPT_TEMPLATE.md`](./PROMPT_TEMPLATE.md) (new project) or [`MIGRATE_TEMPLATE.md`](./MIGRATE_TEMPLATE.md) (existing project) and paste into Claude Code or claude.ai with your repo attached.

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

**Built with care by [KoolekLabs](https://github.com/kooleklabs)**

If this saved you time, consider giving the repo a ⭐

</div>
