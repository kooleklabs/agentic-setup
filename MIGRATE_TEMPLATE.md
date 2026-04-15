# Agentic Framework Migration — Prompt Template
# ================================================
#
# HOW TO USE:
# 1. Copy everything below the --- line
# 2. Fill in the "MY EXISTING CODEBASE" section
# 3. Paste into Claude Code CLI or claude.ai
# 4. Share key files when Claude asks for them
#
# PRODUCES:
# - CODEBASE_ANALYSIS.md  (what your codebase actually is)
# - .claude/              (reality-accurate framework)
# - MIGRATION_PLAN.md     (gap report + migration roadmap)
#
# WORKS WITH:
# - Any language or framework
# - Projects with existing .claude/ (merges, doesn't overwrite)
# - Monorepos (generates per-service sections)
# - Projects with or without existing CLAUDE.md
# ================================================

---

I need you to migrate my existing codebase to the Universal Agentic Development Framework.
This is NOT a new project. Run the three-phase migration flow below.

## Phase 1 — Scan: Produce CODEBASE_ANALYSIS.md

Read all the files I share and write a structured CODEBASE_ANALYSIS.md with:

### Tech Stack
All detected languages, frameworks, major libraries with versions.

### Build, Test, Lint, Run Commands
Exact commands from Makefile, package.json scripts, CI configs, README.
If not found: "NOT DETECTED — must be confirmed manually".

### Folder Architecture
Top-level structure, module boundaries, what lives where.

### Actual Patterns (what the code really does)
For each: where business logic lives, error handling, naming conventions,
config/env var usage, database access pattern, test coverage.
Report WHAT IS, not what's ideal.

### Deliberate Deviations
Patterns consistent across 3+ files = CONVENTIONS, not gaps.
Format: "CONVENTION: [what] — observed in [files/count]"

### Modules / Domains Detected
Major business domains visible in the structure → become domain skills.

---

## Phase 2 — Generate: Create reality-accurate .claude/ framework

Using CODEBASE_ANALYSIS.md:

1. **CLAUDE.md** — fill every field with REAL values from the analysis.
   Guardrails describe what the code does TODAY. Aspirational items get "TARGET:" prefix.
   Add a "Deliberate Deviations" section listing every CONVENTION as an accepted pattern.

2. **Customize agents** — update stack-specific agents (api-engineer, frontend-engineer, devops-engineer)
   for the actual detected stack. NEVER modify architect.md, test-engineer.md, security-reviewer.md.

3. **Domain skills** — for each detected domain, create `.claude/skills/[domain]/SKILL.md`
   with patterns observed in the actual code (not generic advice).

4. **Merge behavior** — if CLAUDE.md or .claude/ files exist, merge rather than overwrite.
   Preserve correct content, update wrong or placeholder content.

Use the Write tool for each file. After all files written, run: find .claude -type f | sort

---

## Phase 3 — Gap: Produce MIGRATION_PLAN.md

Compare CODEBASE_ANALYSIS.md (current) against the generated .claude/ framework (ideal).

Write MIGRATION_PLAN.md with:
- Gap Report: CRITICAL / HIGH / MEDIUM / LOW gaps, each with specific fix
- Deliberate Deviations: conventions the framework respects (not treated as gaps)
- Migration Roadmap: Phase 1 quick wins, Phase 2 structural refactors, Phase 3 hardening
- What NOT to Change: explicit list of things the framework works around

Special rules:
- No tests found → Phase 1 item #1 is "Add test infrastructure"
- No CI/CD found → Phase 1 must include "Add CI pipeline"
- Each roadmap item: one developer, one sprint

---

## MY EXISTING CODEBASE

**Tech stack (if known):** [optional — Claude will detect if blank]

**Main pain points:** [what's broken, slow, or hard to work with]

**Off-limits (cannot change):** [legacy constraints, compliance, third-party lock-in]

**Target state:** [what "done" looks like for this reengineering effort]

---

*Paste your key files below, or share your project folder:*
- package.json / go.mod / requirements.txt (whichever applies)
- A sample controller or route handler
- A sample service or business logic file
- Your folder structure (`find . -maxdepth 2 | sort`)
- Your Makefile or CI config if you have one
