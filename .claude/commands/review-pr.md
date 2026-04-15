---
description: Review the current branch changes against main. Checks code quality, tests, security, and design consistency.
---

Review the current branch changes:

1. Run `git diff main...HEAD --stat` to see changed files
2. For each changed file, check:
   - Does it follow CLAUDE.md conventions?
   - Are there tests covering the changes?
   - Any security concerns? (delegate to security-reviewer agent if needed)
3. Run the test suite and report results
4. Run the linter and report results
5. Summarize: what changed, what's good, what needs fixing
