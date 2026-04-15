<div align="center">

# Universal Agentic Development Framework

**Drop into any project — one command installs an agent-ready workspace for Claude Code.**

[![npm](https://img.shields.io/npm/v/@kooleklabs/agentic-app.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/@kooleklabs/agentic-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-5B3FFF.svg)](https://docs.claude.com/en/docs/claude-code)
[![CI](https://github.com/kooleklabs/agentic-setup/actions/workflows/ci.yml/badge.svg)](https://github.com/kooleklabs/agentic-setup/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Quick start](#-quick-start) •
[What you'll see](#-what-youll-see) •
[Commands](#-commands) •
[Interactive mode](#-interactive-mode) •
[Cost tracking](#-cost-tracking) •
[Daily workflow](#-daily-workflow) •
[FAQ](#-faq)

</div>

---

## Overview

A batteries-included framework that turns **any codebase into an agent-ready workspace**. It ships the scaffolding — agents, skills, commands, hooks, and guardrails — so Claude Code can plan, build, test, and review alongside you from day one.

|  |  |
|---|---|
| **One command** | `npx @kooleklabs/agentic-app generate --from proposal.docx` — that's the whole install |
| **Universal** | Any stack — Next.js, Go, Laravel, Rails, Django, FastAPI, Rust, anything |
| **Greenfield or legacy** | New project or 10-year-old codebase, both are first-class via `generate` / `migrate` |
| **Autonomous or guided** | Default: Claude makes reasonable choices. `--interactive` pauses for clarification |
| **Cost-aware** | Every run ends with token counts + USD estimate |
| **Transparent** | Every agent, skill, and hook is a plain Markdown file you own and can edit |

---

## 🚀 Quick start

![Framework overview](./docs/framework-overview.png)

<details>
<summary><b>Start here flowchart</b> (click to expand)</summary>

![Start here](./docs/infographic-start-here.svg)

</details>

> **Prerequisites:** Node.js ≥18 and [Claude Code](https://docs.claude.com/en/docs/claude-code) logged in. `pandoc` or `pdftotext` only needed if you feed `.docx` / `.pdf`.

```bash
cd your-project

# Pick one:
npx @kooleklabs/agentic-app init                              # blank scaffolding
npx @kooleklabs/agentic-app generate --from proposal.docx    # from a PRD / spec
npx @kooleklabs/agentic-app migrate                           # existing codebase
```

`npx` pulls the latest release from npm, runs once, and caches it. No clone. No curl. No path juggling.

---

## 👀 What you'll see

`generate` and `migrate` both stream every file Claude writes in real time, then print a cost summary:

```text
╔══════════════════════════════════════════════════╗
║  Agentic Framework Generator                     ║
║  Paste a requirement → get a customized framework║
╚══════════════════════════════════════════════════╝

[✓] Reading requirement from: proposal.docx
[✓] Running base framework setup…
[✓] Requirement captured (2,691 words)
[✓] Starting Claude Agent SDK session…

  Expected duration: 3–8 minutes for a typical requirement.
  You'll see each file Claude writes appear below in real time.

[ 0:02] I'll customize this framework for the Quran memorization platform…
[ 0:05] → Write  CLAUDE.md
[ 0:11] → Read   examples/ecommerce-sme.md
[ 0:18] → Write  .claude/agents/api-engineer.md
[ 0:24] → Write  .claude/agents/frontend-engineer.md
[ 0:31] → Write  .claude/agents/devops-engineer.md
[ 0:42] → Write  .claude/skills/recitation-analysis/SKILL.md
[ 0:51] → Write  .claude/skills/audio-playback/SKILL.md
[ 1:08] → Write  .claude/skills/memorization-tracking/SKILL.md
[ 1:24] → Write  contracts/api-spec.yaml
[ 1:31] → Edit   .mcp.json
[ 1:47] Generated 14 files across 5 domain skills.

  ✓ Generation complete — 14 written, 2 edited, 3 read in 3m 42s
    in 48K  out 12K  cache+28K  cache→142K  ·  ~$0.41 (sonnet-4-6)
```

Every tool call is a single line. Elapsed timer on the left. Cost line at the end.

---

## 📦 Commands

| Command | When to use | What you get |
|---|---|---|
| **`init`** | Blank slate, you know your stack | Universal framework — 6 agents, 5 skills, 10 slash commands, pre-commit hooks. You fill in `CLAUDE.md`. |
| **`generate`** | Have a PRD, proposal, or one-liner idea | Everything `init` gives you, plus stack-specific agents, domain skills per module, and an OpenAPI skeleton if APIs are mentioned. |
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

# Pause for clarifying questions when Claude asks
npx @kooleklabs/agentic-app generate --from spec.md --interactive

# Override the model (default: claude-sonnet-4-6)
npx @kooleklabs/agentic-app generate --from spec.md --model claude-opus-4-6

# Use the legacy bash flow (no Agent SDK)
npx @kooleklabs/agentic-app generate --from spec.md --legacy
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

# Standard depth (explicit — this is the default)
npx @kooleklabs/agentic-app migrate --standard

# Full audit — 20+ files, CI configs, infra
npx @kooleklabs/agentic-app migrate --full

# Target a specific directory
npx @kooleklabs/agentic-app migrate --dir /path/to/your/repo

# Resume from an existing scan (skip Phase 1)
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

<details>
<summary><b><code>init</code> — all flags</b></summary>

```bash
# Default — writes CLAUDE.md, .claude/, contracts/, .mcp.json stub
npx @kooleklabs/agentic-app init

# Interactive — prompts for project name, stack, and conventions
npx @kooleklabs/agentic-app init --interactive
```

Use this when you don't have a PRD yet and want to fill in `CLAUDE.md` yourself.

</details>

---

## 💬 Interactive mode

Default generation is autonomous — Claude makes reasonable choices based on your requirement and the prompt tells it to note any assumptions in `CLAUDE.md`. Pass `--interactive` to pause whenever Claude asks a clarifying question:

```bash
npx @kooleklabs/agentic-app generate --from spec.md --interactive
```

When Claude finishes a turn with a question, you'll see:

```text
Claude is asking for clarification:

  Your requirement mentions both PostgreSQL and MongoDB. Which primary
  datastore should I target for the recitation tracking domain?

Your answer (or "quit" to exit) > PostgreSQL — Mongo is read-only analytics

[ 3:42] I'll use PostgreSQL as the primary datastore…
[ 3:48] → Write .claude/skills/recitation-tracking/SKILL.md
```

The session resumes in the same conversation via the Agent SDK's `continue` mode — Claude doesn't lose context. Safety cap of 5 rounds, `quit`/`exit`/`q` bails at any prompt, Ctrl-C aborts.

---

## 💰 Cost tracking

Every run ends with a one-line cost summary:

```text
✓ Generation complete — 14 written, 2 edited, 3 read in 3m 42s
  in 48K  out 12K  cache+28K  cache→142K  ·  ~$0.41 (sonnet-4-6)
```

|  |  |
|---|---|
| `in` | Input tokens (your prompt + conversation history) |
| `out` | Output tokens (Claude's responses + tool inputs) |
| `cache+` | Cache-creation tokens (system prompt cached for reuse) |
| `cache→` | Cache-read tokens (prompt retrieved from cache at 10% of input cost) |
| `~$` | Estimated USD using current Sonnet/Opus/Haiku pricing |

Pricing table is built in for Sonnet 4.6, Opus 4.6, and Haiku 4.5. Override for Bedrock / Vertex / enterprise rates:

```bash
CLAUDE_PRICE_INPUT=2.5 CLAUDE_PRICE_OUTPUT=12 npx @kooleklabs/agentic-app generate --from spec.md
```

---

## 🗓 Daily workflow

![Daily workflow](./docs/infographic-daily-workflow.svg)

Once the framework is installed, slash commands inside Claude Code drive your daily work:

| Command | When to use | What it does |
|---|---|---|
| `/onboard` | New session, new teammate | Scans `CLAUDE.md`, ADRs, git log, test health → orientation summary |
| `/standup` | Start of day | Generates Yesterday / Today / Blockers from real git data |
| `/plan-feature` | Before any non-trivial change | Blast radius audit + risk matrix + phased plan with rollback steps |
| `/adr` | After a significant architecture decision | Writes a numbered record to `docs/decisions/` |
| `/debug` | Something is broken | Structured loop: reproduce → read error → isolate → hypothesize → fix → verify |
| `/self-review` | Before every commit | Tests → lint → security spot-check, loops until all green |
| `/check-contracts` | After any API change | Audits `/contracts/` against implementation, flags drift and breaking changes |
| `/smart-pr` | Ready to open a PR | Generates What / Why / How / Test plan / Risks from the actual diff |
| `/review-pr` | Reviewing a branch | Code quality + convention check against `CLAUDE.md` |
| `/design-review` | After UI implementation | Compares code against Figma designs (requires Figma MCP) |

---

## 🏗 What gets created

<details>
<summary><b>Full project layout</b> (click to expand)</summary>

```text
your-project/
├── CLAUDE.md                          ← Project constitution (customize this first)
├── .claudeignore                      ← Keeps context window clean
├── .mcp.json                          ← External tool connections
├── docs/
│   └── decisions/                     ← Architecture Decision Records (/adr writes here)
├── contracts/                         ← API specs and event schemas
└── .claude/
    ├── agents/                        ← WHO does the work
    │   ├── architect.md               ← Universal · Opus · leads planning
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
    │   └── [domain-skills]/SKILL.md   ← Generated per project
    ├── commands/                      ← HOW to trigger workflows (10 slash commands)
    └── hooks/                         ← WHEN to auto-verify
        ├── pre-commit.sh              ← Blocks commit if lint or tests fail
        └── post-edit.sh               ← Auto-formats files after every edit
```

</details>

### Scaling levels — same framework, different throttle

| Level | Mode | Agents | Token cost | When to use |
|:-----:|---|---|:-:|---|
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
npx @kooleklabs/agentic-app generate --from fitness-app-prd.md
```

</details>

<details>
<summary><b>Internal enterprise tool</b></summary>

```bash
npx @kooleklabs/agentic-app generate --idea "Internal HR management system with leave tracking, payroll \
calculation, and employee directory. Stack: Laravel + Vue.js + MySQL. Deploy on company K3s cluster."
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
- Existing project: see `examples/legacy-django-api.md`

---

## ➕ Adding domain skills

Skills auto-activate when their topic is relevant. Drop a new one in `.claude/skills/<domain>/SKILL.md`:

```markdown
---
name: payments
description: Auto-activates when working on payment flows, billing, or Stripe integration
---

# Payment rules
- Always use idempotency keys on Stripe charges
- Never log full card numbers or CVVs — mask to last 4 digits
- Webhook handlers must verify signature before processing
- Refund logic lives in PaymentService, never in controllers
```

That's it. Claude Code picks it up on next session.

---

## 🛟 No Node.js? No npm?

<details>
<summary><b>Use the bash scripts directly (curl or clone)</b></summary>

Every release ships the raw bash scripts too, so you can skip npm entirely.

```bash
# One-shot curl (base framework)
curl -fsSL https://raw.githubusercontent.com/kooleklabs/agentic-setup/main/setup.sh | bash

# Generate from a doc via curl
curl -fsSL https://raw.githubusercontent.com/kooleklabs/agentic-setup/main/generate.sh \
  | bash -s -- --from /path/to/proposal.docx

# Or clone if you prefer local scripts
git clone https://github.com/kooleklabs/agentic-setup.git
bash /path/to/agentic-setup/setup.sh
bash /path/to/agentic-setup/migrate.sh --dir /path/to/legacy
```

The bash path uses `claude -p` directly — no Agent SDK, so you'll also need the `claude` CLI installed.

</details>

<details>
<summary><b>No CLI at all? Paste a prompt into Claude Code or claude.ai</b></summary>

Copy [`PROMPT_TEMPLATE.md`](./PROMPT_TEMPLATE.md) for a new project, or [`MIGRATE_TEMPLATE.md`](./MIGRATE_TEMPLATE.md) for an existing one, and paste into Claude Code or claude.ai with your repo attached.

</details>

---

## ❓ FAQ

<details>
<summary><b>Does this work with my stack?</b></summary>

Yes. Universal pieces (plan mode, commit conventions, hooks, testing skill) are stack-agnostic. Stack-specific agents and domain skills are generated by `generate` / `migrate` based on what your requirement (or codebase) actually uses.

</details>

<details>
<summary><b>Do I need the paid Claude plan?</b></summary>

You need access to Claude Code (any plan that includes it). The Agent SDK used under the hood reuses your existing `claude login` OAuth — no separate `ANTHROPIC_API_KEY` needed if Claude Code is logged in. For truly headless / CI use, setting `ANTHROPIC_API_KEY` works too.

</details>

<details>
<summary><b>What changed between v1 and v2?</b></summary>

- **v2.0** — `generate` rewritten to use `@anthropic-ai/claude-agent-sdk` instead of spawning `claude -p`. Eliminates the whole class of issues where user hooks / allowlists silently vetoed writes.
- **v2.1** — `--interactive` flag pauses for clarifying questions; session continues via the SDK's `continue` mode.
- **v2.2** — `migrate` gets the same SDK treatment through a shared runner.
- **v2.3** — Token + estimated USD cost printed at the end of every run.
- **v2.3.2** — SDK passes `ENABLE_SECURITY_REMINDER=0` so security-guidance plugin no longer interferes.
- **v2.3.4** — `canUseTool` override defeats `.claude/` hardcoded write protection.
- **v2.3.5** — Default model is now `claude-sonnet-4-6`; new `--model` flag to override per run.
- **`--legacy`** — still available on `generate` if you want the old bash path for comparison.

</details>

<details>
<summary><b>Can I use this on an existing codebase?</b></summary>

Yes — run `migrate` instead of `init`. The generated `CLAUDE.md` describes your current reality. Gaps between current state and best practices are surfaced in `MIGRATION_PLAN.md` as a prioritized roadmap, not baked into guardrails the codebase can't follow yet.

Patterns consistent across 3+ files are treated as deliberate conventions, not gaps — so you won't get a gap report telling you to change how your team already works.

</details>

<details>
<summary><b>What's the difference between agents, skills, and commands?</b></summary>

- **Agents** (`.claude/agents/`) — *who* does the work. Specialized subagents with a defined role, toolset, and workflow (architect, api-engineer, etc.).
- **Skills** (`.claude/skills/`) — *what* they know. Compact knowledge files that auto-activate based on context. An api-engineer automatically loads `api-design`; a frontend task loads `design-system`.
- **Commands** (`.claude/commands/`) — *how* to trigger workflows. Slash commands you type in Claude Code: `/plan-feature`, `/self-review`, `/debug`, etc.

</details>

<details>
<summary><b>Why did my generate run "hang" on older versions?</b></summary>

If you're on v1.x: `claude -p` runs silently and defaults to interactive permission prompts that can't be answered from a piped script. Plus some Claude Code plugins veto writes based on content substring matching. v2.0+ uses the Agent SDK which bypasses both — upgrade:

```bash
npx -y @kooleklabs/agentic-app@latest generate --from proposal.docx
```

</details>

<details>
<summary><b>How do I keep the context window clean?</b></summary>

Use `/compact` in long sessions. Keep agent files under 50 lines and skill files under 100 lines. `.claudeignore` excludes build artifacts and lockfiles automatically.

</details>

<details>
<summary><b>Is it safe to run autonomously?</b></summary>

Defaults favor plan-first, test-before-commit workflows. The architect agent runs in `plan` permission mode — shows a plan and waits for approval before implementing. For headless / CI modes, review permissions in `.claude/settings.json` before granting write access.

</details>

---

## Contributing

Contributions welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

Guidelines in brief:
- Keep universal files universal — no stack-specific logic in base agents or skills
- Agent files under **50 lines**, skill files under **100 lines**
- Follow Conventional Commits (`feat:`, `fix:`, `refactor:`, …)
- All PRs must pass CI (syntax + shellcheck + `init` smoke test)

See [RELEASING.md](./RELEASING.md) for how new versions reach npm.

---

## License

[MIT](./LICENSE) — use freely, modify, and distribute.

<div align="center">

---

**Built with care by [KoolekLabs](https://github.com/kooleklabs)**

If this saved you time, consider giving the repo a ⭐

</div>
