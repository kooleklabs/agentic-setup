# Design: Autonomous Orchestrator Roadmap
**Date:** 2026-04-16
**Status:** Approved
**Scope:** `@kooleklabs/agentic-app` — Full roadmap from v2.4.1 to autonomous orchestrator

---

## What We're Building

Transform `@kooleklabs/agentic-app` from a one-shot scaffolding CLI into a fully autonomous software development orchestrator — where GitHub is the coordination backbone, agents work in parallel, and the framework improves itself over time.

---

## Current State — v2.4.1

- 3 commands: `init`, `generate`, `migrate`
- 6 agents, 5 skills, 10 slash commands, 2 hooks
- Claude Agent SDK under the hood
- GitHub MCP already wired in `.mcp.json`
- **Gaps:** no tests, no lint, no ADRs, hooks require manual `chmod +x`, `generate` produces stub contracts not real architecture

---

## Phase 1 — Stability + Full Architecture Design Gate `v2.5 / v2.6`
**Estimated: 2–3 weeks** — Part A shipped as v2.5.0 (2026-04-16); Part B lands as v2.6.

### Part A — Framework Stability ✅ Shipped in v2.5.0

- Test suite (Jest) for `lib/` — unit tests for `generate.js`, `migrate.js`, `claude-runner.js`, `render.js`
- ESLint — enforce code style across `bin/` and `lib/`
- Auto `chmod +x` hooks on `init`/`generate`/`migrate` (permanent fix, no more manual step)
- `docs/decisions/` scaffold created automatically on `init`
- CI: add lint + test jobs alongside existing syntax check

### Part B — Architecture Design Gate (new step after `generate`)

After `generate` completes scaffolding, the **architect agent** runs automatically in plan mode and produces a full system design before any development begins.

**Gate flow:**

```
npx @kooleklabs/agentic-app generate --idea "..."
        ↓
Scaffolding (CLAUDE.md, agents, skills, .mcp.json)
        ↓
ARCHITECTURE DESIGN GATE (architect agent, plan mode)
├── Backend
│   ├── ERD / database schema
│   ├── API contracts (real OpenAPI — not stub)
│   ├── Service layer breakdown
│   └── Auth approach + key decisions (written as ADRs)
├── Frontend / UI/UX
│   ├── User flows & journeys
│   ├── Wireframes (per screen)
│   ├── Component structure
│   ├── Design system / tokens
│   └── Navigation structure
├── Integration points
│   ├── External services
│   └── MCP connections needed
└── Acceptance criteria & E2E scenarios
    (defines what "done" looks like per feature — not a full test plan)
        ↓
Human reviews & approves
        ↓
Development begins (TDD — tests written alongside code, per feature)
```

**Outputs saved to:**
```
docs/architecture.md          ← full system design
docs/decisions/001-*.md       ← ADRs for key decisions
contracts/api-spec.yaml       ← real OpenAPI (not stub)
.claude/skills/[domain]/      ← domain skills calibrated to real design
```

### Testing Approach (TDD throughout development)

No separate upfront test plan. Instead:
- Acceptance criteria and E2E scenarios defined in the architecture gate
- Unit and integration tests written **during** development (test first, then code)
- E2E tests implemented as each user flow completes
- Coverage targets enforced by CI

---

## Phase 2 — GitHub-Native Automation `v3.0`
**Estimated: 3–4 weeks**

GitHub becomes the coordination backbone. The framework reads from and writes to GitHub automatically.

**Core loop:**
```
GitHub Issue created
        ↓
Framework reads issue → runs /plan-feature
        ↓
Plan posted as comment on Issue for human approval
        ↓
Human approves (reaction or comment)
        ↓
Agents execute the plan
        ↓
/self-review runs → tests pass, lint clean
        ↓
PR opened automatically (via /smart-pr)
        ↓
CI gates run
        ↓
Issue moves: To Do → In Review on Project Board
        ↓
Human reviews & merges → Issue closes automatically
```

**New capabilities:**
- GitHub Issue → auto plan generation
- Auto PR creation with structured description
- PR review — Claude leaves comments, flags issues
- Project board sync (status updates automatically)
- CI/CD gates enforced before merge
- New slash command: `/github-sync` — links current session to a GitHub Issue

**Sample (inventory app):**
```
Issue #12: "Add low stock alert notifications"
  → plan generated & posted as comment
  → human approves
  → api-engineer builds alert service + endpoint
  → frontend-engineer builds alert UI
  → /self-review passes
  → PR #34 opened: "feat: low stock alert notifications (#12)"
  → CI green → board updated → ready for merge
```

---

## Phase 3 — Master Orchestrator Engine `v3.5`
**Estimated: 4–6 weeks**

You give a goal. The orchestrator decomposes it into GitHub Issues, sequences them, assigns agents, and executes with human gates.

**New command:**
```bash
npx @kooleklabs/agentic-app orchestrate --goal "Build supplier management module"
```

**What it does:**
1. Breaks goal into discrete GitHub Issues
2. Sequences them (API first → UI → tests → docs)
3. Assigns each to the right agent
4. Executes phase by phase with human approval gates
5. Tracks blocked / in-progress / done across issues

**Sample (inventory app):**
```
orchestrate --goal "Build full purchase order workflow"
  → 8 issues created and sequenced
  → Phase 1: API + DB layer (issues #20–22)
  → Human approves
  → Phase 2: Frontend (issues #23–25)
  → Human approves
  → Phase 3: Tests + docs (issues #26–27)
  → Done
```

---

## Phase 4 — Parallel Multi-Agent Factory `v4.0`
**Estimated: 4–6 weeks**

Multiple agents work simultaneously on the same goal without conflicts.

**Agent coordination model:**
```
Goal received
        ↓
Architect Agent → designs the system
        ↓ (parallel execution)
Coder Agent ×N  │  Security Agent  │  Tester Agent
(worktree each) │  (read-only)     │  (validates)
        ↓
Self-review & fix loop (agents check each other's output)
        ↓
PR opened → all checks green → human final review
```

**New capabilities:**
- Worktree isolation per agent (no file conflicts)
- Agent handoff protocol (architect → coder → security → tester)
- Self-review loop between agents before PR
- Cost tracking per agent, per feature

---

## Phase 5 — aman-agent Core `v4.5`
**Estimated: 6–8 weeks**

Persistent identity and memory across sessions. The framework learns from its own history.

**Capabilities:**
- Long-term memory + knowledge graph per project
- Remembers past decisions, patterns, and mistakes
- Skill crystallization — learns from repeated tasks, generates new skills automatically
- Post-mortem after every run — logs what worked / what failed
- Identity engine — consistent behavior and personality across sessions
- `aman-agent dev mode` — full autonomous dev cycle

**Sample (inventory app):**
```
"We always use optimistic UI for stock updates"
  → stored in knowledge graph
  → applied automatically to all future stock-related features
  → no need to repeat the instruction
```

---

## Phase 6 — Enterprise Self-Improvement Layer `v5.0`
**Estimated: 6–8 weeks**

Production-grade autonomous operation with compliance and safety guardrails.

**Capabilities:**
- SAST/DAST scanning integrated into every PR
- Mandatory human approval gates for destructive operations
- Compliance & audit logs — full trail of every agent action
- Policy enforcement — rules that agents cannot override
- Self-improvement loop — framework improves its own agents and skills over time

---

## Full Timeline

```
Phase 1 — Stability + Architecture Gate    Week 1–3
Phase 2 — GitHub-Native Automation        Week 4–7
Phase 3 — Master Orchestrator Engine      Week 8–13
Phase 4 — Parallel Multi-Agent Factory    Week 14–19
Phase 5 — aman-agent Core                Week 20–27
Phase 6 — Enterprise Self-Improvement    Week 28–36

Total: ~8–9 months
```

---

## Build Order Rationale

Each phase is a prerequisite for the next:

- **Phase 1** — stable foundation + real architecture means agents have something reliable to build on
- **Phase 2** — GitHub backbone gives orchestrator somewhere to track state
- **Phase 3** — orchestrator needs GitHub issues to decompose tasks into
- **Phase 4** — parallel agents need orchestrator to coordinate them
- **Phase 5** — memory needs a history of real runs to learn from
- **Phase 6** — self-improvement needs all lower layers working reliably

---

## Sample Use Case — Inventory App

Stack: Next.js + Node.js + PostgreSQL

```
Phase 1: npx @kooleklabs/agentic-app generate --idea "Inventory app..."
          → Architecture gate produces: ERD (Product, Supplier, PO, StockMovement),
            real OpenAPI contracts, Next.js wireframes, acceptance criteria
          → Development via TDD (test first, code second)

Phase 2: Issue #12 "Add low stock alerts"
          → Auto plan → approved → built → PR opened → merged

Phase 3: orchestrate --goal "Build full supplier module"
          → 8 issues → sequenced → executed phase by phase

Phase 4: "Add PO approval workflow"
          → Architect + 3 Coders + Security + Tester in parallel
          → Self-review loop → PR → green → merge

Phase 5: "Use optimistic UI for stock" remembered forever
          → Applied automatically to all future stock features

Phase 6: Every PR scanned → audit trail maintained → policies enforced
```
