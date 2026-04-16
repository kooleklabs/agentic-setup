# Design: Phase 1 — Stability + Architecture Design Gate
**Date:** 2026-04-16
**Status:** Approved
**Scope:** `@kooleklabs/agentic-app` — Phase 1 of the autonomous orchestrator roadmap
**Releases:** `v2.5` (Part A — Stability), `v2.6` (Part B — Architecture Design Gate)
**Parent spec:** [`docs/ROADMAP.md`](../../ROADMAP.md)

---

## What We're Building

Phase 1 turns the CLI from a one-shot scaffolder into a trustable foundation for every later phase. It delivers two releases:

- **v2.5 — Stability.** Tests, lint, auto-executable hooks, ADR scaffold, CI gates. This release protects all later code.
- **v2.6 — Architecture Design Gate.** After `generate` scaffolds the framework, an architect agent produces a full system design (ERD, real OpenAPI, user flows, wireframes, ADRs, acceptance criteria) before any feature code is written.

Incremental delivery is deliberate: Part A's tests cover `lib/generate.js`, which Part B modifies. Shipping A first means Part B changes land on a tested base.

---

## Current State (as of v2.4.1)

- `lib/` has 5 files (`generate.js`, `claude-runner.js`, `render.js`, `extract.js`, `prompt.js`) with **no tests**, **no lint**
- `bin/cli.js` routes commands; no coverage
- CI runs syntax checks + shellcheck; no lint or test jobs
- `.claude/hooks/*.sh` are generated but **not `chmod +x`** — user must manually mark executable
- `docs/decisions/` directory does not exist; `/adr` command writes into a missing folder
- `generate` ends after scaffolding — no architecture phase; `contracts/` is a stub
- `.claude/agents/architect.md` exists but is used only for `/plan-feature`

---

## Part A — v2.5 Stability Release

### A.1 Jest test suite for `lib/`

**Deliverables:**
- `jest` added as devDependency (Node builtins + mocks — no external deps)
- `jest.config.js` at repo root: Node test env, coverage from `lib/**/*.js`, coverage thresholds (70% lines, 60% branches)
- One test file per lib module in `lib/__tests__/`:
  - `generate.test.js` — mock SDK's `query`, assert `parseArgs`, `detectQuestion` heuristic, clarifying-question retry loop, exit codes (0, 1, 130)
  - `claude-runner.test.js` — mock `query`, assert prompt routing (file vs stdin), capture buffer, SIGINT handling
  - `render.test.js` — feed canned SDK messages, assert file-op counters, token/cost math for all 3 pricing tiers
  - `prompt.test.js` — assert `buildGeneratePrompt` output for targets `claude`, `copilot`, `both`
  - `extract.test.js` — mock `child_process`, assert format detection (.md/.txt/.docx/.pdf), `wordCount` correctness
- `package.json` script: `"test": "jest"`

**Test approach:** Unit only. Mock the SDK boundary. No network, no shell spawns, no real filesystem outside tmp dirs.

### A.2 ESLint config

**Deliverables:**
- `eslint` + `eslint-config-standard` as devDependencies
- `.eslintrc.json` at repo root, extends `standard`
- Lint scope: `bin/`, `lib/` (not `.claude/` — user-owned content)
- Scripts: `"lint": "eslint bin/ lib/"`, `"lint:fix": "eslint bin/ lib/ --fix"`
- Fix all existing violations before shipping (treat as "clean baseline" commit)

### A.3 Auto `chmod +x` on hooks

**Root cause:** `setup.sh`, `generate.sh`, `migrate.sh` generate hook files but don't mark them executable.

**Fix, three places:**
- `setup.sh` — after hook generation, run `chmod +x .claude/hooks/*.sh`
- `generate.sh` + `lib/generate.js` post-scaffold — same chmod
- `migrate.sh` — same chmod
- Idempotent: safe to re-run

**Verification:** CI smoke test asserts `.claude/hooks/pre-commit.sh` has `-x` bit after `init`.

### A.4 `docs/decisions/` scaffold on `init`

**Deliverables:**
- `setup.sh` creates `docs/decisions/` containing:
  - `README.md` — short text explaining "ADRs live here. Run `/adr` to add one."
  - `000-template.md` — template matching the existing `/adr` command output shape (context, decision, consequences)
- Existing `/adr` command unchanged; this just pre-creates the directory so it doesn't have to `mkdir -p` on first use.

### A.5 CI: lint + test jobs

**Deliverables:**
- Extend `.github/workflows/ci.yml` with two new jobs:
  - `lint` — `npm ci && npm run lint` on Node 20
  - `test` — `npm ci && npm test` on Node 18/20/22 matrix, upload coverage summary
- Existing jobs (syntax-check, pack, shellcheck, smoke) gated on `needs: [lint, test]` where logical
- Release workflow (`release.yml`) also runs `npm test` before publish

### Release criteria v2.5

- All A.1–A.5 complete
- CI green on all matrix Node versions
- Manual smoke: `npx @kooleklabs/agentic-app init` in a fresh dir → hooks are `-x`, `docs/decisions/` exists with template
- CHANGELOG entry: "v2.5 — Stability (tests, lint, auto-chmod hooks, ADR scaffold, CI gates)"

---

## Part B — v2.6 Architecture Design Gate

### B.1 Gate integration

**New file:** `lib/architect-gate.js` exports `runArchitectureGate({ requirement, cwd, sdkOptions })`.

**Called from** `lib/generate.js` after the existing scaffolding SDK query completes successfully.

**Skip conditions (any one triggers skip):**
- `--skip-architecture` CLI flag
- `docs/architecture.md` already exists in cwd (resumed / re-run)
- `--from-analysis` flag (migrate path; user already has design)

**Flow:**
```
scaffolding complete
    ↓
check skip conditions → print "Skipping architecture gate" and exit 0
    ↓
buildArchitectPrompt(requirement) → returns full prompt string
    ↓
SDK query with architect agent (reuses .claude/agents/architect.md)
    ProgressRenderer streams output (reuses lib/render.js)
    ↓
validateArchitectOutputs(cwd) → returns { ok, missing: [...] }
    ↓
if !ok: one retry with "complete these missing outputs: [missing]" prompt
    ↓
if still !ok: print failures, exit 1, leave partial files
    ↓
printReviewBanner() with file paths
```

### B.2 Architect agent enhancements

**New file:** `lib/architect-prompt.js` exports `buildArchitectPrompt({ requirement, stack })`.

Prompt produces a structured request covering:
- **Backend** — ERD / database schema, real OpenAPI contracts (every endpoint, every schema), service layer breakdown, auth approach as ADR
- **Frontend** — user flows & journeys, wireframes (Markdown/ASCII per screen), component structure, design tokens, navigation
- **Integration** — external services, MCP connections needed
- **Acceptance criteria & E2E scenarios** — per feature, Gherkin-lite

**Update `.claude/agents/architect.md`:**
- Add "Design Gate Mode" section explaining: when invoked with a full requirement (not a plan review), produce the full system design and write it to the files listed in B.3
- Keep existing "Plan Review Mode" (used by `/plan-feature`) — no behavioural change there
- Mode is determined by prompt content; no config flag

### B.3 Output spec

| File | Content |
|---|---|
| `docs/architecture.md` | Full system design. Required section headers: `## Backend`, `## Frontend`, `## Integration`, `## Acceptance Criteria` |
| `docs/decisions/001-*.md` .. `NNN-*.md` | One ADR per non-obvious decision (auth, datastore, state mgmt, etc.). Uses existing ADR template. |
| `contracts/api-spec.yaml` | Real OpenAPI 3.x — valid YAML with `openapi:`, `info:`, `paths:` keys. Covers every endpoint identified in the design. |
| `.claude/skills/[domain]/SKILL.md` | (Optional) Calibrated domain skill. Only emitted if architect identifies a clear domain (e.g., `inventory/`, `billing/`). |

Acceptance criteria live as a section inside `docs/architecture.md`. Not a separate file — keeps the design unified.

### B.4 Validation layer

**New file:** `lib/validate-outputs.js` exports `validateArchitectOutputs(cwd)`.

Returns `{ ok: boolean, missing: string[] }`. Checks:
- `docs/architecture.md` exists and contains all four required `##` headers
- `contracts/api-spec.yaml` parses as YAML and has `openapi:` and `paths:` keys
- `docs/decisions/` contains ≥ 1 file matching `/^\d{3}-.+\.md$/`

On fail, a single retry is attempted with a prompt listing the exact missing pieces. Second failure surfaces to human — partial files remain for manual completion.

### B.5 Review banner (write-then-review)

After a successful gate:
```
✓ Architecture design complete. Review these files:
  docs/architecture.md
  docs/decisions/
  contracts/api-spec.yaml

When you're happy with the design, commit it:
  git add docs/ contracts/ && git commit -m "design: initial architecture"

Then begin implementation via TDD.
```

Human reviews files in their IDE, edits if needed, and commits when satisfied. The git commit is the approval mechanism — no separate `/approve-architecture` command needed.

### B.6 Tests for Part B

New test files in `lib/__tests__/`:
- `architect-gate.test.js` — mock SDK + fs, assert skip conditions (all 3), retry logic, banner output, exit codes
- `architect-prompt.test.js` — assert prompt contains all required sections for various requirements
- `validate-outputs.test.js` — fixture file trees (complete, missing architecture.md, invalid yaml, no ADRs) → assert correct `{ok, missing}` results

### B.7 CI addition

Extend smoke test in `.github/workflows/ci.yml`:
- After `init` smoke, run `generate --skip-architecture --idea "..."` to verify skip path works without SDK
- Real-SDK gate test is **not** in CI (too slow, flaky, costs tokens). Manual smoke pre-release covers it.

### Release criteria v2.6

- All B.1–B.7 complete
- CI green including `--skip-architecture` smoke
- Manual E2E: `generate --idea "simple todo app"` produces valid `architecture.md` (4 required headers), `api-spec.yaml` (valid OpenAPI), ≥ 2 ADRs
- README section "Architecture Design Gate" added with flow diagram
- CHANGELOG entry: "v2.6 — Architecture Design Gate (auto-runs after generate; produces full system design)"

---

## Component Boundaries

Each piece owns one responsibility and exposes a clean interface.

| Unit | Purpose | Depends on |
|---|---|---|
| `lib/generate.js` | Orchestrate scaffold + gate | `claude-runner`, `render`, `architect-gate` |
| `lib/architect-gate.js` | Run architect, validate, retry, banner | `claude-runner`, `architect-prompt`, `validate-outputs` |
| `lib/architect-prompt.js` | Build prompt for architect's design gate mode | (none) |
| `lib/validate-outputs.js` | Assert required design files exist & parse | `js-yaml` (new dep, small) |
| `lib/claude-runner.js` | Generic SDK wrapper (unchanged in Phase 1) | SDK |
| `lib/render.js` | ProgressRenderer (unchanged in Phase 1) | (none) |

No unit reaches across boundaries. Each has a narrow test surface.

---

## Open Questions → Resolved

| Question | Decision |
|---|---|
| Release sequencing | Incremental: v2.5 then v2.6 |
| Gate invocation | Auto-run by default; `--skip-architecture` escape hatch |
| Approval flow | Write-then-review (files on disk, git commit = approval) |
| Architect agent | Reuse `.claude/agents/architect.md`, add Design Gate Mode |
| ADR numbering | `001-*.md` .. `NNN-*.md`, kebab-case topic suffix |
| Skills calibration | Optional, emitted only if architect identifies a clear domain |
| Acceptance criteria | Section within `architecture.md`, not separate file |
| ESLint config | `eslint-config-standard` (opinionated, low bikeshed) |
| Coverage target | 70% lines, 60% branches on `lib/` |

---

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Real-SDK test in CI too slow/flaky | Skip it; `--skip-architecture` smoke covers the gate plumbing; manual pre-release smoke covers the real SDK path |
| Architect produces incomplete design | Validation layer + single retry + human-visible failure; partial files preserved |
| Auto-chmod breaks on Windows | Node `fs.chmodSync` noops on Windows for +x bit; bash scripts don't run on Windows anyway — out of scope |
| Breaking change for users who scripted around missing `docs/decisions/` | Directory creation is additive; no existing behaviour removed |
| Users on v2.5 who want the gate immediately | Document "upgrade to v2.6 when shipped" in v2.5 CHANGELOG |

---

## What's Next

After this design is approved:
1. Invoke `writing-plans` skill to produce implementation plans for v2.5 and v2.6
2. Execute v2.5 plan → ship → soak
3. Execute v2.6 plan → ship → update roadmap status
