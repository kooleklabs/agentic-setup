#!/bin/bash
# Post-edit hook: auto-format files after Claude edits them
# Triggered by: PostToolUse matcher "Write|Edit"

FILE="$1"

if [ -z "$FILE" ]; then exit 0; fi

# Auto-format based on file type
case "$FILE" in
  *.js|*.jsx|*.ts|*.tsx|*.json|*.css|*.md)
    npx prettier --write "$FILE" 2>/dev/null
    ;;
  *.go)
    gofmt -w "$FILE" 2>/dev/null
    ;;
  *.rs)
    rustfmt "$FILE" 2>/dev/null
    ;;
  *.py)
    python -m black "$FILE" 2>/dev/null
    ;;
esac
