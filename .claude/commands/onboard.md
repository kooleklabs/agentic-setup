---
description: Orient a new developer or fresh agent session to this codebase. Scans project constitution, architecture decisions, recent activity, and health checks to produce a structured orientation summary.
---

Produce an orientation summary for this codebase. Read in this order — stop and flag if anything is missing or broken.

## Step 1 — Project identity
Read `CLAUDE.md` (or `README.md` if CLAUDE.md is absent):
- What does this project do?
- What is the tech stack?
- What are the build, test, lint, and run commands?
- What guardrails are in place?

## Step 2 — Architecture decisions
```bash
ls docs/decisions/ 2>/dev/null | sort -n | tail -10
```
Read the 3 most recent ADRs. Summarise the key standing decisions (auth approach, DB choice, deployment target, etc.).

If no `docs/decisions/` exists → note as a gap.

## Step 3 — Codebase layout
```bash
find . -maxdepth 3 -type d \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  ! -path "*/dist/*" ! -path "*/__pycache__/*" \
  ! -path "*/.worktrees/*"
```
Identify: entry points, domain modules, test directories, config files.

## Step 4 — Recent activity
```bash
git log --oneline -15
git branch -a | grep -v HEAD | head -10
```
Summarise: what has been worked on recently, any active feature branches.

## Step 5 — Current health
Run the test suite and lint:
```bash
# Detect and run appropriate test command
# Detect and run linter
```
Report: passing / failing / not configured.

Check for open issues in git status:
```bash
git status --short
git stash list
```

## Step 6 — Contracts and integrations
```bash
ls contracts/ 2>/dev/null
ls .mcp.json 2>/dev/null && cat .mcp.json
```
List any API contracts and external MCP tool connections.

## Step 7 — Write the orientation summary

Output in this format:

```
## Codebase Orientation — [project name]

### What it does
[1-2 sentences]

### Stack
[Language, framework, DB, infra — one line each]

### Key commands
- Build:  [command]
- Test:   [command]
- Lint:   [command]
- Run:    [command]

### Architecture (from ADRs)
- [Key decision 1]
- [Key decision 2]

### Recent activity
- [Last 3-5 meaningful commits summarised]
- Active branches: [list]

### Health
- Tests: [✅ N passing | ❌ N failing | ⚠️ not configured]
- Lint:  [✅ clean | ❌ N errors | ⚠️ not configured]
- Uncommitted changes: [yes/no — details]

### Gaps to be aware of
- [Missing ADRs / missing tests / missing contracts / etc.]
```

## Rules
- Read actual files — do not guess or invent project details
- Flag every gap (no tests, no ADRs, no contracts) — don't silently skip them
- If tests fail during onboarding, list the failures — this is important context
- Keep the summary scannable — bullets over paragraphs, facts over adjectives
