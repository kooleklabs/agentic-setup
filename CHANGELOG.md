# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), following [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
