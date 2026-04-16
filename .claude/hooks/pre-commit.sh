#!/bin/bash
# Pre-commit hook: blocks commits when lint or tests fail.
# Triggered by: PreToolUse matcher "Bash(git commit*)"
#
# Behaviour:
#   - Lint failure  → blocks commit, shows errors
#   - Test failure  → blocks commit, shows failures
#   - Tool missing  → warns but does not block (graceful degradation)

set -uo pipefail

echo "Running pre-commit checks..."

lint_failed=0
tests_failed=0

# ── Node / TypeScript ─────────────────────────────────────────
if [ -f "package.json" ]; then
  if npm run 2>/dev/null | grep -q "  lint"; then
    echo "  [lint] npm run lint"
    if ! npm run lint; then
      echo "  LINT FAILED — fix errors above before committing"
      lint_failed=1
    fi
  else
    echo "  [lint] not configured in package.json — skipping"
  fi

  echo "  [test] npm test"
  if ! npm test; then
    echo "  TESTS FAILED — fix failures above before committing"
    tests_failed=1
  fi

# ── Go ────────────────────────────────────────────────────────
elif [ -f "go.mod" ]; then
  echo "  [lint] go vet ./..."
  if ! go vet ./...; then
    echo "  GO VET FAILED — fix errors above before committing"
    lint_failed=1
  fi

  echo "  [test] go test ./..."
  if ! go test ./...; then
    echo "  TESTS FAILED — fix failures above before committing"
    tests_failed=1
  fi

# ── Rust ─────────────────────────────────────────────────────
elif [ -f "Cargo.toml" ]; then
  echo "  [lint] cargo clippy -- -D warnings"
  if ! cargo clippy -- -D warnings 2>&1; then
    echo "  CLIPPY FAILED — fix warnings above before committing"
    lint_failed=1
  fi

  echo "  [test] cargo test"
  if ! cargo test; then
    echo "  TESTS FAILED — fix failures above before committing"
    tests_failed=1
  fi

# ── Python ───────────────────────────────────────────────────
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  if command -v ruff &>/dev/null; then
    echo "  [lint] ruff check ."
    if ! ruff check .; then
      echo "  RUFF FAILED — fix errors above before committing"
      lint_failed=1
    fi
  elif command -v flake8 &>/dev/null; then
    echo "  [lint] flake8 ."
    if ! flake8 .; then
      echo "  FLAKE8 FAILED — fix errors above before committing"
      lint_failed=1
    fi
  else
    echo "  [lint] no linter found — install ruff (pip install ruff) to enable"
  fi

  echo "  [test] python -m pytest"
  if ! python -m pytest; then
    echo "  TESTS FAILED — fix failures above before committing"
    tests_failed=1
  fi
fi

# ── Final gate ────────────────────────────────────────────────
if [ "$lint_failed" -eq 1 ] || [ "$tests_failed" -eq 1 ]; then
  echo ""
  echo "Pre-commit checks FAILED. Fix issues above before committing."
  echo "Tip: run /self-review to work through all issues in a loop."
  exit 1
fi

echo "Pre-commit checks passed"
