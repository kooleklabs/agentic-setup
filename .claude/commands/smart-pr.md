---
description: Generate a structured PR description from the current branch diff. Run after /self-review passes. Produces title, summary, test plan, and risk notes ready to paste into GitHub/GitLab.
---

Generate a pull request description for the current branch:

## Step 1 — Gather diff data
```bash
git diff main...HEAD --stat
git diff main...HEAD
git log main...HEAD --oneline
```

## Step 2 — Classify changes
Group changed files into categories:
- **Features**: new capabilities added
- **Fixes**: bugs corrected
- **Refactors**: behaviour-preserving restructuring
- **Tests**: test additions or updates
- **Config / Infra**: CI, build, environment changes
- **Docs**: documentation only

## Step 3 — Extract context
- Read CLAUDE.md for project name and stack
- Read commit messages for intent and motivation
- Check if any changed files touch API contracts (`/contracts/`) or DB migrations

## Step 4 — Assess risks
For each changed area, flag:
- **Breaking change**: API contract modified, DB migration required, env var added
- **Side-effect risk**: shared utility touched, auth/permissions changed
- **Test coverage gap**: logic changed but no new tests

## Step 5 — Write the description

Output a PR description in this exact format:

```markdown
## What
[1–3 bullets: what changed, specific and concrete]

## Why
[1–2 sentences: the problem this solves or the goal it achieves]

## How
[Brief: the key technical decision or approach — only if non-obvious]

## Test plan
- [ ] [Specific action to verify the main scenario works]
- [ ] [Edge case or regression to check]
- [ ] Tests pass: `[test command]`

## Risks
- [Risk]: [Mitigation] — or "None" if clean
```

## Rules
- Never invent motivation — derive it from commits and code only
- If a breaking change is detected, say so explicitly in the Risks section
- Keep "What" bullets specific: "Add `/smart-pr` command that generates PR descriptions" not "Improve developer experience"
- Skip the "How" section if the implementation is straightforward
- The description is ready to paste — no placeholders, no [TODO] markers
