---
description: Enter plan mode to decompose a feature into implementation phases with explicit rollback strategies. Creates a structured plan before any code is written.
---

Enter plan mode. Before writing any code:

## Step 1 — Understand the requirement
- Ask clarifying questions if the requirement is ambiguous
- Confirm: what does done look like? How will it be verified?
- Identify who is affected (internal service, external API consumers, end users)

## Step 2 — Audit the blast radius
Run impact analysis before planning any changes:
- Check what imports/depends on the files you intend to touch
- Flag files imported by 5+ modules as HIGH risk — prefer additive over mutating changes
- Check `/contracts/` — any API surface change needs a version consideration

## Step 3 — Build the risk matrix
For each significant change, classify:

| Change | Risk | Mitigation |
|--------|------|------------|
| New endpoint | LOW | Additive, consumers opt in |
| Modify existing endpoint | MEDIUM | Check all callers, bump contract version |
| DB schema change | HIGH | Migration must be reversible, test rollback |
| Shared utility change | HIGH | Run full test suite, check all consumers |
| Auth/permissions change | CRITICAL | Security review, staged rollout |

## Step 4 — Create a phased plan
Structure each phase with:
```
### Phase N: [name]
Goal: [what this phase achieves]
Files: [list of files to create or modify]
Steps:
  - [ ] [action] → [verification command]
  - [ ] [action] → [verification command]
Rollback: [exact command or action to undo this phase if it fails]
Checkpoint: codebase must be in a working state after this phase
```

Rules for phases:
- Each phase must leave the codebase working — no half-implemented states
- Rollback must be possible without losing other phases' work
- DB migrations get their own phase, always with a `down` migration
- Never bundle unrelated changes into one phase

## Step 5 — Define verification
Before implementing, agree on how to verify success:
- Unit test to write (describe the test, not just "add tests")
- Integration scenario to run manually
- For API changes: contract check with `/check-contracts`

## Step 6 — Present and get approval
Show the full plan — phases, risk matrix, rollback steps — and wait for explicit approval before writing any code.

## Rules
- No code before plan approval
- Every phase has a named rollback step — "revert the commit" is not a rollback plan
- If a phase cannot be rolled back independently, split it until it can
- Risk CRITICAL items require human sign-off before proceeding
