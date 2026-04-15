# Migration Mode — Design Spec
**Date:** 2026-04-15
**Status:** Approved
**Framework:** Universal Agentic Development Framework v1.0.0

---

## Problem

The current framework (`setup.sh` + `generate.sh` + `PROMPT_TEMPLATE.md`) is 100% greenfield-first. It scaffolds from nothing, fills in `[PROJECT_NAME]` placeholders, and invents domain skills from a requirements document. There is no support for existing codebases that need restructuring or reengineering to follow the agentic setup.

Running `setup.sh` on an existing project would overwrite real CLAUDE.md content with placeholders. Running `generate.sh` would invent domain skills from a spec rather than discover them from the code. The architectural guardrails in CLAUDE.md might contradict what the codebase actually does today.

---

## Solution

A **Layered Migration Mode** — three new files that give existing codebases full parity with the greenfield tooling, without touching any existing scripts.

---

## New Files

```
migrate.sh              ← new entry point (parallel to setup.sh + generate.sh)
MIGRATE_TEMPLATE.md     ← copy-paste prompt for non-CLI users (parallel to PROMPT_TEMPLATE.md)
examples/
  legacy-django-api.md  ← example existing codebase scenario (parallel to ecommerce-sme.md)
```

Nothing in `setup.sh`, `generate.sh`, or `PROMPT_TEMPLATE.md` changes.

---

## Entry Point: `migrate.sh`

### Usage

```bash
# Standard depth (default)
bash migrate.sh

# Depth flags
bash migrate.sh --quick          # surface scan: manifests + README only
bash migrate.sh --standard       # pattern mining: manifests + 5-10 source files (default)
bash migrate.sh --full           # full audit: manifests + 20+ files + CI + infra

# Point at a specific directory
bash migrate.sh --dir /path/to/project

# Resume from existing analysis (skip Phase 1)
bash migrate.sh --from-analysis CODEBASE_ANALYSIS.md
```

### Output Artifacts

```
CODEBASE_ANALYSIS.md    ← Phase 1: what the codebase actually is today
.claude/                ← Phase 2: reality-accurate framework
MIGRATION_PLAN.md       ← Phase 3: gap report + phased migration roadmap
```

Each artifact is durable and reviewable before the next phase runs. The `--from-analysis` flag allows teams to re-run Phase 2 after manually editing the analysis.

---

## The Three Phases

### Phase 1 — Scan (produces `CODEBASE_ANALYSIS.md`)

Claude reads the codebase and writes a structured analysis. What it detects:

| What | How detected |
|------|-------------|
| Tech stack | package.json, go.mod, requirements.txt, Cargo.toml, Gemfile |
| Build/test/lint commands | Makefile, package.json scripts, CI configs (.github/, .gitlab-ci.yml) |
| Folder architecture | Top-level structure, module boundaries |
| Actual patterns | Where business logic lives, error handling style, naming conventions |
| Deliberate deviations | Patterns consistent across ≥3 files = intentional convention, not a gap |
| Existing docs | README, CONTRIBUTING, any existing CLAUDE.md |

**Depth flag controls source file sampling:**
- `--quick`: manifest files + README only
- `--standard`: manifests + 5-10 source files across key directories
- `--full`: manifests + 20+ files + CI + infra configs

---

### Phase 2 — Generate (produces `.claude/`)

Feeds `CODEBASE_ANALYSIS.md` into the same Claude prompt pattern as `generate.sh`, with one critical difference: **reality-first instructions**.

The prompt instructs Claude to:
- Write CLAUDE.md guardrails that reflect what the codebase *does today*, not ideals
- Discover domain skills from actual modules, not invent them from specs
- Match agent stacks to the detected stack, not guesses
- Carry deliberate deviations from `CODEBASE_ANALYSIS.md` into CLAUDE.md as documented exceptions, not gaps

**Merge behavior for existing setups:**

| Situation | Handling |
|-----------|----------|
| Existing CLAUDE.md | Read first, merge rather than overwrite — preserve correct content |
| `.claude/` partially set up | Diff against existing files, only update what's missing or wrong |
| Monorepo | Detect multiple manifests, generate one CLAUDE.md with per-service sections |

**Universal agents are never modified:**
- `architect.md` — unchanged
- `test-engineer.md` — unchanged
- `security-reviewer.md` — unchanged

---

### Phase 3 — Gap (produces `MIGRATION_PLAN.md`)

Compares the generated `.claude/` framework (ideal state) against `CODEBASE_ANALYSIS.md` (current state).

**Gap Report structure:**
```
## Gap Report
### Critical gaps      ← security/correctness risks (fix first)
### High gaps          ← architectural violations
### Medium gaps        ← conventions and patterns
### Low gaps           ← hygiene and style
### Deliberate deviations  ← consistent patterns inferred as intentional

## Migration Roadmap
### Phase 1: Quick wins (no structural change needed)
### Phase 2: Structural refactors (requires planning)
### Phase 3: Hardening (tests, observability, security)

## What NOT to change
← explicit list of things the framework works around, not against
```

**Deliberate deviation detection:** A pattern appearing consistently across ≥3 files is inferred as intentional and placed in the "Deliberate Deviations" section rather than flagged as a gap. This prevents noise from intentional architectural choices.

**Special cases:**
- No tests found → flagged as CRITICAL gap; Phase 1 of migration roadmap is "add test infrastructure"

---

## `MIGRATE_TEMPLATE.md` Structure

Parallel to `PROMPT_TEMPLATE.md` for non-CLI users. The copy-paste prompt:

1. Instructs Claude to run the three-phase flow manually
2. Asks the user to share key files when context is limited (package.json, a sample controller, folder tree)
3. Produces the same three artifacts

**User-filled section:**
```
## MY EXISTING CODEBASE

Tech stack (if known): [optional — Claude will detect if blank]
Main pain points: [what's broken or hard to work with]
Off-limits (cannot change): [legacy constraints, compliance, third-party lock-in]
Target state: [what "done" looks like for this reengineering]
```

---

## Greenfield vs Migration Comparison

| File | Greenfield (`generate.sh`) | Migration (`migrate.sh`) |
|------|---------------------------|--------------------------|
| `architect.md` | Universal template | Unchanged — still universal |
| `test-engineer.md` | Universal template | Unchanged |
| `security-reviewer.md` | Universal template | Unchanged |
| `CLAUDE.md` | Placeholder-filled from spec | Reality-accurate from scan |
| `api-engineer.md` | Stack inferred from spec | Stack confirmed from actual code |
| Domain skills | Invented from requirements | Discovered from actual modules |
| `MIGRATION_PLAN.md` | Does not exist | New artifact — migration mode only |

---

## Success Criteria

- [ ] Running `migrate.sh` on an existing project produces a CLAUDE.md that accurately reflects the real stack, real commands, and real patterns
- [ ] Deliberate deviations are separated from actual gaps in the report
- [ ] `--from-analysis` flag skips Phase 1 when `CODEBASE_ANALYSIS.md` already exists
- [ ] Existing `.claude/` content is merged, not overwritten
- [ ] Non-CLI users get the full three-phase experience via `MIGRATE_TEMPLATE.md`
- [ ] The example `legacy-django-api.md` demonstrates the full flow end-to-end
