---
description: Run a full self-review-and-fix loop on the current changes. Checks tests, lint, and security — fixing each issue before moving to the next. Run before every commit or PR.
---

Run a self-review-and-fix loop on the current working changes:

## Step 1 — Tests
1. Detect and run the project test suite (check package.json, go.mod, Cargo.toml, pytest)
2. If tests fail:
   - Read each failure carefully
   - Fix the root cause (not the test)
   - Re-run until all pass
3. If no test suite exists: flag as a gap, continue

## Step 2 — Lint
1. Detect and run the project linter
2. If lint errors found:
   - Fix each error
   - Re-run until clean
3. If no linter configured: flag as a gap, continue

## Step 3 — Security spot-check
1. Delegate to the security-reviewer agent for any changed files
2. For CRITICAL or HIGH findings: fix immediately, re-check
3. For MEDIUM/LOW: log for follow-up, do not block

## Step 4 — Report
Summarise the outcome:
- ✅ All checks passed — safe to commit
- ⚠️ Gaps found (no tests / no linter) — list them
- ❌ Unresolved issues — list what remains and why it was not fixed

## Rules
- Never use --no-verify or skip a check to make it "pass"
- Fix root causes, not symptoms
- If a fix introduces a new failure, loop again
- Loop exits only when all checks are green or explicitly deferred with a reason
