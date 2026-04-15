---
description: Generate a daily standup summary. Scans today's git activity, open TODOs, and failing checks to produce a concise status report.
---

Generate a standup summary for today:

## Step 1 — Today's git activity
```bash
git log --since="yesterday 5pm" --until="now" --oneline --all --author="$(git config user.name)"
git diff HEAD~1..HEAD --stat 2>/dev/null || true
```

If no commits today, check the last working day:
```bash
git log --since="3 days ago" --oneline -10 --author="$(git config user.name)"
```

## Step 2 — Open TODOs and in-progress markers
Search for work-in-progress signals:
```bash
git stash list
git status --short
```

Grep for inline markers in modified files:
- `TODO`, `FIXME`, `HACK`, `WIP`, `XXX`

## Step 3 — Test and lint health
- Detect and run the project test suite (check package.json, go.mod, Cargo.toml, pytest)
- Report: passing / failing / not run
- If failures exist, list the failing test names (not full output)

## Step 4 — Current branch context
```bash
git branch --show-current
git log main..HEAD --oneline 2>/dev/null || git log --oneline -5
```

Note if the branch is ahead of, behind, or diverged from main.

## Step 5 — Write the standup

Output in this exact format:

```
## Standup — [DATE]

**Yesterday**
- [What was completed — derived from commits]

**Today**
- [What is in progress — derived from current branch / stash / WIP markers]

**Blockers**
- [Failing tests / lint errors / open questions] — or "None"

**Branch**: [branch-name] — [N commits ahead of main | up to date]
**Tests**: [✅ passing | ❌ N failing | ⚠️ not run]
```

## Rules
- Derive everything from actual git data — never invent activity
- If no commits exist yet today, say "No commits yet today" under Yesterday
- Keep bullets concrete: "Implemented self-review loop in api-engineer agent" not "Did some work"
- Blockers section is honest — list real failures, don't omit them
- Output is ready to paste into Slack/Teams/Notion with no edits needed
