# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), following [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] — 2026-04-18

Second Phase 2 release — the plan-consumer half of the loop.

### Added

- **`github-sync --issue N --execute`** reads a merged plan document from `docs/plans/<slug>.md`, runs ONE implementation pass on a fresh `impl/<slug>` branch with Write / Edit / Read / Bash tools enabled, and commits the result as a single `wip(impl): <feature> (refs #<N>)` commit. **No PR is opened** — human inspects the diff and decides.
- **Pre-flight checks** (all produce clean `{ok: false, error}` with actionable guidance): plan file exists + passes section validator, plan PR is merged (plan branch gone from origin), impl branch doesn't exist locally or remotely, working tree is clean.
- **`--execute` flags:** `--impl-branch <name>` (override default branch name), `--max-cost-usd <n>` (soft cost cap, default $5.00). `--dry-run` short-circuits before the SDK call.
- **Issue comment on success** — `"Implementation pass complete on branch ..."`. Skip with `--no-comment`.

### Changed

- **`--yes` / `-y` flag** on both `push-architecture` and `github-sync`. Skips the interactive approval prompt. Unblocks CI, cron, and scripted flows. Wires the pre-existing `autoApprove` option through to the CLI.
- **`--base` auto-detection** via `gh repo view --json defaultBranchRef`. Fixes repos with `master` / `develop` / custom default branches. Explicit `--base <name>` still wins.
- New modules: `lib/default-branch.js`, `lib/plan-reader.js`, `lib/impl-generator.js`, `lib/gh-impl-branch.js`. Plus `remoteBranchExists` helper added to `gh-impl-branch`.

### Tested

- 289 tests across 28 suites (+41 for v3.1 modules — default-branch, plan-reader, gh-impl-branch, impl-generator, execute-mode orchestrator paths, execute-mode CLI flags, and extended push-architecture / github-sync CLI defaults).
- Real-SDK E2E against a throwaway repo: `push-architecture` seeded → plan PR #5 merged → fresh clone → `github-sync --issue 3 --execute --yes` → produced a WIP commit with 16 files on `impl/search-by-title`, posted the linking Issue comment, cost ~$0.73 via `claude-sonnet-4-6`. Re-run without `--force` correctly failed fast with the branch-exists guidance.

### Known issues (tracked for v3.1.1)

- **Agent may commit `node_modules/` or other transient artifacts** when `git add -A` sweeps up files created during tool-use (`npm install` etc.). The plan prompt doesn't currently enforce `.gitignore` hygiene. Workaround: run `git reset HEAD node_modules/ && git commit --amend` on the WIP commit.
- **Cost-cap tracker is inaccurate** — `--max-cost-usd` reads `message.usage` per assistant message, but the SDK's usage field is only populated on some messages, so the accumulated total is effectively zero in practice. The hard abort therefore does not fire. Cap is a soft documentation promise for v3.1.0; v3.1.1 will wire it to the SDK's authoritative cost tracking.
- **`--dry-run` with `--execute` creates the impl branch** before returning (side-effect of reusing the pre-flight gate). Re-runs need `git branch -D impl/<slug>` between dry-run and real run. Considering for v3.1.1: move branch creation after the dry-run short-circuit.

### Upgrade notes

- **No breaking changes.** All v3.0.x behaviour is preserved. The major release gate stays at v3.0.
- `--execute` requires the plan PR to be **merged** into the base branch before running (enforced by pre-flight).

---

## [3.0.2] — 2026-04-17

### Fixed

Two shipped bugs in `push-architecture` (originally in v2.7.2, audited post-v3.0.1):

- **`push-architecture --force` aborted on milestone collision.** `listMilestones` was skipped when `force=true`, so `createMilestone` ran unconditionally and GitHub returned 422 on duplicate title.
- **`push-architecture --force` duplicated the umbrella Issue.** The same `force ?` gate skipped umbrella marker detection, producing a second umbrella.

Root cause: `--force` conflated feature-duplicate-skip (correctly loosened) with singleton uniqueness (incorrectly loosened). Milestone and umbrella are singletons and should always be idempotent by name.

**Fix:** `listMilestones` and `listOpenIssuesWithMarkers` now run unconditionally; `--force` only affects the per-feature marker check. Singletons are always reused when they exist.

### Tested

- 248 tests (+2) — `--force` with existing milestone does NOT create a duplicate; `--force` with existing umbrella reuses it and refreshes its body in place.

---

## [3.0.1] — 2026-04-17

### Fixed

- **`github-sync` planner options** — `permissionMode: 'bypassPermissions'` + the Claude Code `tools` preset was auto-approving every tool call. `allowedTools: []` did not restrict the agent per SDK semantics ("defaults to all tools"). Removed the bypass + presets; added `canUseTool` that denies every request as a backstop. The planner's intent is now explicit in the config. Residual SDK tool-exposure tracked for v3.1.
- **`github-sync --issue N --force` git push non-fast-forward** — when a prior run had already pushed `plan/<slug>` to origin, `--force` regeneration failed at the push step. New `cleanupPlanBranch` helper best-effort deletes local + remote plan branch before opening the fresh PR.

### Tested

- 246 tests across 22 suites (+4 for cleanupPlanBranch happy-path + best-effort + orchestrator cleanup ordering).

---

## [3.0.0] — 2026-04-17

First Phase 2 release.

### Added

- **`github-sync --issue <N>` command.** Reads a feature Issue created by v2.7's `push-architecture`, extracts context (acceptance criteria, API paths, linked ADR bodies, matching `architecture.md` section), calls Claude via the Agent SDK to generate an implementation plan, writes it to `docs/plans/<slug>.md`, and opens a **draft PR** for human review. Posts a "Plan PR: #N" comment on the source Issue.
- Plan document template: `## Problem statement`, `## Acceptance criteria`, `## Approach`, `## Files to change`, `## Implementation steps`, `## Test plan`, `## Open questions`, `## Rollback`. Required sections are validated; one retry on truncation.
- **Flags:** `--issue <N>` (required), `--dry-run`, `--force`, `--no-comment`, `--model <name>` (default: `claude-sonnet-4-6`), `--base <branch>` (default: `main`), `--ready` (opens as non-draft PR), `--help`.
- New modules: `lib/github-issue-reader.js`, `lib/plan-prompt.js`, `lib/plan-template.js`, `lib/plan-generator.js`, `lib/github-sync.js`, `lib/github-sync-cli.js`, `lib/gh-plan-pr.js`.
- `lib/github-issues.js` gains `commentOnIssue` wrapper.
- CI `verify` smoke asserts all 7 flags are documented in `github-sync --help`.
- README section under `## 📦 Commands`.

### Tested

- 241 unit tests across 17 suites (+59 for v3.0 modules — reader, prompt builder, template renderer, SDK wrapper, PR opener, orchestrator, CLI).
- Real-SDK E2E against a throwaway repo: seeded with `push-architecture`, `github-sync --issue 2` produced a full plan PR (all 8 sections present) attached to Issue #2 with a linking comment. Cost ~$0.60 per plan with `claude-sonnet-4-6`.

### Notes

- **Requires Claude credentials** (env var or Claude Code session). The planner uses the same SDK path as v2.6's architecture gate.
- `push-architecture` Issues are the primary source. Support for ad-hoc Issues without markers is deferred to v3.3+.
- **Known quirk:** despite `allowedTools: []`, the SDK may still invoke read-only tools (Bash, Read) against the target repo's working tree during plan generation. Output correctness is unaffected. Hardening tracked for v3.0.x.
- **What's next:** v3.1 adds `--execute` for agent-driven implementation of a merged plan. v3.2 adds project-board automation.

### Breaking changes

- None. v2.7.x → v3.0.0 is additive — `push-architecture`, `generate`, `init`, etc. all behave as before. The major bump marks Phase 2's arrival, not an API break.

---

## [2.7.2] — 2026-04-17

### Fixed

- **`push-architecture` is now fully idempotent on re-run.** Two gaps from v2.7.0/1 closed:
  - **Milestone reuse.** v2.7.1 correctly passed the milestone name, but still called `createMilestone` unconditionally — a pure re-run against the same repo would 422 on duplicate title. New `listMilestones` looks up an existing milestone by title and reuses it before falling back to create.
  - **Umbrella refresh.** The umbrella Issue was only rendered at initial creation; re-runs that added new features left the listing stale. The marker scan now captures existing feature numbers + the existing umbrella, merges them with newly created feature numbers, and always refreshes the umbrella body (unless `--no-umbrella`).

### Tested

- 182 unit tests across 15 suites (9 new: 4 for `listMilestones`, 5 for milestone reuse / umbrella refresh / no-op re-run / `--no-umbrella` paths).
- Real-E2E against a throwaway repo across 3 passes (fresh → no-op re-run → add feature + re-run). Umbrella body confirmed current via `gh api`.

---

## [2.7.1] — 2026-04-17

### Fixed

- **`push-architecture` — every `createIssue` call failed with `could not add to milestone '1': '1' not found`.** `gh issue create --milestone` expects the milestone *name*, not the number; `lib/github-push.js` was passing `milestone.number`. Unit tests mocked the `gh` CLI so this never surfaced. Caught by a real-E2E run against a throwaway repo shortly after v2.7.0 shipped.
- New regression test asserts every `createIssue` call receives the milestone title string, not a number.

### Known gaps (tracked for v2.7.2)

- `createMilestone` is not idempotent — a pure re-run fails on duplicate milestone title.
- Umbrella body is only rendered at initial creation; re-runs that add new features don't refresh it.

---

## [2.7.0] — 2026-04-17

### Added

- **`push-architecture` command.** Turns v2.6's design artefacts (`docs/architecture.md`, `contracts/api-spec.yaml`, `docs/decisions/`) into GitHub work items in one shot — no LLM, pure parser + `gh` CLI subprocess.
  - **1 Milestone** (default `"<Project> v1.0"`, override with `--milestone <name>`).
  - **1 feature Issue per `### Feature:`** entry under `## Acceptance Criteria`, with acceptance criteria, related API paths from OpenAPI, and links to related ADRs.
  - **1 umbrella Issue** indexing every feature Issue and linked to the Milestone (skip with `--no-umbrella`).
- **Idempotency via HTML-comment markers.** Every Issue body contains a marker (`<!-- agentic-app:TYPE:SLUG -->`) so re-runs detect existing items and skip them — safe to re-run after editing `architecture.md`; only newly added features are created. Bypass with `--force`.
- **Flags.** `--dry-run` (plan only, no writes), `--force`, `--no-umbrella`, `--milestone <name>`, `--help`. Approval prompt before any writes (unless dry-run).
- New modules: `lib/marker.js`, `lib/architecture-parser.js`, `lib/issue-body.js`, `lib/github-repo.js`, `lib/github-issues.js`, `lib/github-push.js`, `lib/github-push-cli.js`.
- `bin/cli.js` routes `push-architecture` to the new CLI wrapper.

### Tested

- 172 unit tests across 15 suites, including 80 new tests for the v2.7 modules (markers, parser, body builders, remote detection, `gh` CLI wrappers, orchestrator with dry-run/idempotency/error paths, CLI arg parsing).
- CI `verify` smoke now asserts `--dry-run`, `--force`, `--no-umbrella`, and `--milestone` are documented in `push-architecture --help`.

### Notes

- **Requires the [`gh` CLI](https://cli.github.com)** authenticated via `gh auth login`. No new runtime dependencies — uses `spawnSync` with array args (no shell, no interpolation).
- `github-push-cli.js` lazy-requires the orchestrator so `push-architecture --help` stays zero-dep (works without `npm install`).
- **Bridge release** between Phase 1 (design artefacts) and Phase 2 (GitHub-native automation). v3.0's `github-sync --issue <n>` will consume the feature Issues this command creates and run the full plan-implement-PR loop.

---

## [2.6.0] — 2026-04-16

### Added

- **Architecture Design Gate.** After `generate` scaffolds the framework, an architect agent (Opus) automatically produces a full system design before any feature code is written.
  - Outputs: `docs/architecture.md` (`## Backend` / `## Frontend` / `## Integration` / `## Acceptance Criteria` — all required), `docs/decisions/NNN-*.md` ADRs (one per non-obvious decision), `contracts/api-spec.yaml` (real OpenAPI 3.x, not a stub), and optionally `.claude/skills/[domain]/SKILL.md` when a clear primary domain exists.
  - Validation + single retry: the gate asserts required sections, valid OpenAPI YAML, and at least one real ADR; if incomplete, a targeted retry lists the gaps. Partial files are preserved on hard failure.
  - Review is file-based — edit in your IDE, then `git add docs/ contracts/ && git commit` is the approval.
- **`--skip-architecture`** flag on `generate` — opt out of the gate for re-runs or when you already have a design.
- **`--from-analysis`** flag on `generate` — migration path, gate is auto-skipped.
- **Auto-skip** when `docs/architecture.md` already exists — resume-safe, won't overwrite your design.
- New modules: `lib/architect-prompt.js` (pure prompt builder), `lib/validate-outputs.js` (YAML + section validation), `lib/architect-gate.js` (orchestrator with skip/retry/banner logic).
- `.claude/agents/architect.md` now supports two modes: Design Gate Mode (produces system design) and Plan Review Mode (existing `/plan-feature` behaviour). `permissionMode: plan` is retained so `/plan-feature` keeps its safety net; Design Gate Mode programmatically overrides via SDK options.

### Changed

- New runtime dependency: `js-yaml` (~15 KB) for OpenAPI validation inside the gate.
- `lib/generate.js` lazy-loads `architect-gate.js` inside `main()` so `generate --help` and non-gate paths don't require runtime deps.
- CI `verify` smoke now asserts `--skip-architecture` and `--from-analysis` are documented in `generate --help`.

### Tested

- 92 unit tests across 8 suites, including 24 new tests for the gate (prompt builder, validator, orchestrator with skip/retry/failure/SDK-error/SIGINT paths).
- End-to-end real-SDK test pre-release (manual): `generate --idea "minimal TODO app with auth…"` produced a valid `architecture.md` (all 4 required sections), 5 ADRs, and `api-spec.yaml` with 7 paths and 4 schemas — no retry needed.

### Notes

Phase 1 of the [autonomous orchestrator roadmap](docs/ROADMAP.md) is now **complete** with v2.5 (Stability) + v2.6 (Architecture Gate). Phase 2 — GitHub-native automation — is next.

---

## [2.5.0] — 2026-04-16

### Added

- **Test suite** — Jest covers `lib/prompt.js`, `lib/extract.js`, `lib/render.js`, `lib/claude-runner.js`, `lib/generate.js` with 62 unit tests. Coverage thresholds enforced in CI (starting floor: 50% lines, 40% branches, 45% functions, 50% statements). Raise over time; never lower.
- **ESLint** — `eslint-config-standard` wired up with `npm run lint` and `npm run lint:fix`. Scope: `bin/` and `lib/`. Clean baseline across the codebase.
- **`docs/decisions/` scaffold** — `init` now creates `docs/decisions/README.md` and `docs/decisions/000-template.md` so the `/adr` slash command has somewhere to write.
- **CI gates** — new `lint` job and `test` matrix job (Node 18 / 20 / 22). The existing `verify` smoke now also asserts `.claude/hooks/*.sh` are executable and the ADR scaffold exists.

### Fixed

- **Hooks reliably executable after `generate` and `migrate`.** `lib/generate.js` now runs a defensive `ensureHooksExecutable()` after `setup.sh` completes, and `migrate.sh` marks `.claude/hooks/*.sh` executable before exiting. This defends against umask and `npm pack` edge cases that could leave hooks non-executable — no more manual `chmod +x` step.

### Changed

- `coverage/` added to `.gitignore` (generated artifact).
- CI uses `npm install --no-audit --no-fund` instead of `npm ci` because `package-lock.json` is intentionally gitignored in this project.

### Notes

- Pure additions to the framework's quality gates. No behaviour change in existing commands. Phase 1 Part A of the [autonomous orchestrator roadmap](docs/ROADMAP.md) — Part B (Architecture Design Gate) lands in v2.6.

---

## [2.4.1] — 2026-04-16

### Fixed

- `setup.sh` generated `.claude/settings.json` with hooks in the wrong shape — each hook entry had a bare `"command"` key instead of a `"hooks": [{"type": "command", "command": "..."}]` array. Claude Code skipped the entire file with `hooks: Expected array, but received undefined`.
- `setup.sh` generated `.claude/settings.local.json` with `"model"` as an object (`{"default": "sonnet", "planning": "opus"}`). Claude Code requires `"model"` to be a plain string; the object caused `model: Expected string, but received object` and the file was skipped entirely.
- The project's own `.claude/settings.json` had a non-standard `"if"` field inside the hook object and an overly broad `"matcher": "Bash"`. Replaced with `"matcher": "Bash(git commit*)"` and removed the unsupported `"if"` key.

All three issues caused the affected settings file to be **skipped entirely**, meaning hooks, model overrides, and permission rules were silently ignored.

---

## [2.4.0] — 2026-04-15

### Added

**GitHub Copilot CLI support**
- New `--target` flag for `init`, `generate`, and `migrate` commands
  - `--target claude` — Claude Code artifacts only (original behavior)
  - `--target copilot` — Copilot CLI artifacts + shared files (CLAUDE.md, .mcp.json)
  - `--target both` — both Claude Code and Copilot CLI artifacts (new default)
- `AGENTS.md` — aggregated agent definitions at repo root, read by Copilot CLI
- `.github/copilot-instructions.md` — project-level Copilot instructions with workflow guidance
- `.github/instructions/*.instructions.md` — 5 skill instruction files (coding-standards, api-design, testing, security-review, design-system)
- `generate` prompt now instructs Claude to also create Copilot artifacts when target includes copilot
- `migrate` Phase 2 extended with Copilot artifact generation

### Changed
- Default target changed from Claude-only to `both` — existing users get Copilot support automatically
- README updated with Copilot CLI badge, `--target` documentation, multi-agent mention
- package.json description and keywords updated for discoverability

## [1.1.0] — 2026-04-15

### Added

**Migration mode** (`migrate.sh`)
- Three-phase migration for existing codebases: scan → generate → gap report
- `--quick`, `--standard`, `--full` depth modes; `--dir` and `--from-analysis` flags
- Produces `CODEBASE_ANALYSIS.md`, a reality-accurate `.claude/` framework, and `MIGRATION_PLAN.md`
- Deliberate deviation detection: patterns consistent across 3+ files classified as CONVENTION, not a gap
- `MIGRATE_TEMPLATE.md` — copy-paste equivalent for users without the CLI
- `examples/legacy-django-api.md` — full walkthrough on a real-world legacy codebase

**New commands (10 total, up from 3)**
- `/self-review` — test → lint → security spot-check loop; loops until all checks are green
- `/smart-pr` — generates structured PR description (What / Why / How / Test plan / Risks) from actual diff
- `/standup` — daily status from git log, stash, WIP markers, and test health
- `/debug` — structured 6-step debugging loop (reproduce → read error → isolate → hypothesis → fix → verify)
- `/check-contracts` — audits `/contracts/` specs against implementations; flags UNDOCUMENTED, DEAD SPEC, schema drift, breaking changes
- `/adr` — records Architecture Decision Records to `docs/decisions/NNNN-<slug>.md` with status lifecycle
- `/onboard` — 7-step orientation scan for new developers or fresh agent sessions

**Agent improvements**
- `architect.md` — added impact analysis step: grep-based blast radius check before planning; flags high-fan-out files and contract changes
- `devops-engineer.md` — fully rebuilt: CI/CD pipeline standards, Docker best practices, zero-downtime deployment checklist, secret management, observability minimums (was 25 generic lines)
- `api-engineer.md`, `frontend-engineer.md` — upgraded with explicit LOOP-until-clean workflow steps and `/self-review` gate before committing

**Command improvements**
- `/plan-feature` — upgraded with blast radius audit, risk matrix (LOW/MEDIUM/HIGH/CRITICAL), and per-phase rollback strategy requirement

### Fixed
- `pre-commit.sh` — lint failures now block commits (previously only warned); output no longer suppressed with `2>/dev/null`; Python projects now get a lint check (ruff preferred, flake8 fallback)
- `api-design` skill — removed project-specific domain terms (`tajweed`, `quizzes`) that leaked from the framework's own development; replaced with generic examples
- `design-system` skill — replaced hardcoded project-specific hex colors with explicit `#REPLACE` placeholders and guidance; users no longer silently inherit wrong brand colors

---

## [1.0.0] — 2026-04-15

### Added
- Initial public release of the Universal Agentic Development Framework
- `setup.sh` — base framework installer (universal + interactive modes)
- `generate.sh` — prompt-driven customizer that reads a PRD/idea and generates a tailored `.claude/` layout
- `PROMPT_TEMPLATE.md` — copy-paste prompt for use inside Claude Code or claude.ai
- 6 subagent templates: `architect`, `api-engineer`, `frontend-engineer`, `test-engineer`, `security-reviewer`, `devops-engineer`
- 5 universal skills: `coding-standards`, `api-design`, `testing`, `security-review`, `design-system`
- 3 slash commands: `/plan-feature`, `/review-pr`, `/design-review`
- 2 hooks: `pre-commit.sh`, `post-edit.sh` (auto-detect stack)
- `CLAUDE.md` constitution template
- `.mcp.json` with sensible defaults (GitHub, context7)
- Example requirement: `examples/ecommerce-sme.md`
