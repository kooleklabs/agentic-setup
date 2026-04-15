---
description: Structured debugging loop. Reproduce the failure, isolate the cause, fix the root cause, verify no regressions. Use whenever something is broken instead of guessing.
---

Work through this loop — do not skip steps, do not jump to fixes before Step 3.

## Step 1 — Reproduce
Confirm the failure is real and consistent:
- Run the failing test / command / request exactly as reported
- Record: exact error message, stack trace, line number
- Confirm it fails reliably (not flaky) — run 3 times if unsure
- Note: which environment, which branch, which inputs trigger it

If you cannot reproduce it → stop and ask for more context. Do not guess.

## Step 2 — Read the error
Before touching any code:
- Read the full stack trace top to bottom
- Identify the FIRST failure point (not the symptom — the origin)
- Check if the error message names a file/line — read that file
- Look for: null dereference, missing field, wrong type, unhandled state, race condition

Common traps:
- The line that throws is rarely the line that's wrong
- "undefined is not a function" means the caller passed bad data, not that the function is broken
- Timeout errors are usually about upstream dependencies, not the timed-out code

## Step 3 — Isolate
Narrow the failure to the smallest possible scope:
```bash
# Run only the failing test
pytest tests/path/test_name.py::TestClass::test_method -v
npm test -- --testPathPattern="failing-test-name"
go test ./pkg/... -run TestSpecificCase -v
```

Check git history for the last-working commit:
```bash
git log --oneline -20
git bisect start   # if needed
```

Form a hypothesis: "I believe X is wrong because Y." Write it down before touching code.

## Step 4 — Fix the root cause
- Fix the cause identified in Step 3, not the symptom
- Minimal change: touch as few lines as possible
- If the fix requires changing 5+ files, your hypothesis is probably wrong — go back to Step 2

Do NOT:
- Add try/catch to swallow the error
- Add null checks without understanding why null got there
- Hardcode a value to make the test pass

## Step 5 — Verify
```bash
# Run the previously-failing test — must pass
# Run the full test suite — no new failures introduced
# Run lint — clean
```

If any test that was passing now fails: your fix has a side effect. Go back to Step 4 with the new information.

## Step 6 — Document
If the bug was non-obvious, add a comment explaining WHY the fix works:
```python
# Without the null check here, users with no profile crash on /settings.
# Profile is optional — created lazily on first visit.
```

## Rules
- Never skip Step 1 — fix the actual error, not the reported description
- Hypothesis before code — state what you think is wrong before changing anything
- One fix at a time — multiple simultaneous changes make regression detection impossible
- If you've tried 3 hypotheses and none worked, stop and escalate with your findings
