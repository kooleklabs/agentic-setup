# Design documents

Long-form design specs and implementation plans for each phase of the [autonomous orchestrator roadmap](../ROADMAP.md).

These documents capture the **reasoning** behind each release — the options considered, decisions made, trade-offs accepted, and step-by-step implementation plans. Commit-level "what" lives in [CHANGELOG.md](../../CHANGELOG.md); per-PR "how" lives in PR descriptions; this directory is the "why".

## Naming convention

```
YYYY-MM-DD-<scope>-<type>.md
```

- `<scope>` — what the document covers (e.g., `phase-1`, `v2.5`, `v2.6`)
- `<type>` — `design-spec` (approved brainstorm) or `plan` (step-by-step implementation plan)

Date is when the document was written. The document itself stays accurate; newer decisions that supersede it live in a new dated document.

## Index

### Phase 1 — Stability + Architecture Design Gate (shipped 2026-04-16)

- [`2026-04-16-phase-1-design-spec.md`](./2026-04-16-phase-1-design-spec.md) — approved design for both v2.5 and v2.6
- [`2026-04-16-v2.5-plan.md`](./2026-04-16-v2.5-plan.md) — implementation plan for v2.5.0 (14 tasks, ~14 commits)
- [`2026-04-16-v2.6-plan.md`](./2026-04-16-v2.6-plan.md) — implementation plan for v2.6.0 (8 tasks, real-SDK E2E gated)

### v2.7 — Architecture → GitHub Bridge (in design)

- [`2026-04-16-v2.7-design-spec.md`](./2026-04-16-v2.7-design-spec.md) — approved design for the `push-architecture` command that creates Milestone + feature Issues + umbrella Issue from v2.6's design artefacts. Bridges Phase 1 output to Phase 2 input.
- [`2026-04-16-v2.7-plan.md`](./2026-04-16-v2.7-plan.md) — implementation plan (9 tasks across 4 chunks, TDD-driven, ~105+ tests total)

## Relationship to `docs/superpowers/`

The [superpowers](https://github.com/obra/superpowers) skill suite writes its scratch output under `docs/superpowers/` (gitignored). Documents here are the **promoted / curated** subset — once a design spec or plan has been reviewed and committed to, it graduates into `docs/designs/` and becomes part of the project history.

## When to add a new document

- **New design spec** — before any significant release or architectural change. Use the brainstorming skill to produce it, then copy into this directory on PR merge.
- **New implementation plan** — paired with each design spec. Step-by-step, executable by another engineer (human or agent) without additional context.
- **Never** edit a document after it ships its release. Instead, write a new dated document that supersedes it and link from the old one.
