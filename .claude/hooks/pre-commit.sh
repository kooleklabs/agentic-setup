#!/bin/bash
# Pre-commit hook: runs lint and test before allowing commit
# Triggered by: PreToolUse matcher "Bash(git commit*)"

echo "🔍 Running pre-commit checks..."

# Detect and run appropriate linter
if [ -f "package.json" ]; then
  npm run lint 2>/dev/null || echo "⚠️  Lint not configured"
  npm test 2>/dev/null || { echo "❌ Tests failed — commit blocked"; exit 1; }
elif [ -f "go.mod" ]; then
  go vet ./... 2>/dev/null || echo "⚠️  Go vet issues found"
  go test ./... 2>/dev/null || { echo "❌ Tests failed — commit blocked"; exit 1; }
elif [ -f "Cargo.toml" ]; then
  cargo clippy 2>/dev/null || echo "⚠️  Clippy warnings found"
  cargo test 2>/dev/null || { echo "❌ Tests failed — commit blocked"; exit 1; }
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  python -m pytest 2>/dev/null || { echo "❌ Tests failed — commit blocked"; exit 1; }
fi

echo "✅ Pre-commit checks passed"
