#!/bin/bash
# ============================================================
# Universal Agentic Development Framework — Migration Mode
# Version: 1.0.0 | April 2026
# By: KoolekLabs / AmanLabs
#
# Usage:
#   bash migrate.sh                          # standard depth (default)
#   bash migrate.sh --quick                  # surface scan only
#   bash migrate.sh --standard               # pattern mining (default)
#   bash migrate.sh --full                   # full audit
#   bash migrate.sh --dir /path/to/project   # target directory
#   bash migrate.sh --from-analysis FILE     # skip Phase 1, resume from file
#
# Produces:
#   CODEBASE_ANALYSIS.md   — what the codebase actually is today
#   .claude/               — reality-accurate framework
#   MIGRATION_PLAN.md      — gap report + phased migration roadmap
# ============================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

print_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  ${BOLD}Agentic Framework — Migration Mode${NC}${CYAN}              ║${NC}"
  echo -e "${CYAN}║  Analyze existing codebase → generate framework  ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

log_step()   { echo -e "${GREEN}[✓]${NC} $1"; }
log_info()   { echo -e "${BLUE}[i]${NC} $1"; }
log_warn()   { echo -e "${YELLOW}[!]${NC} $1"; }
log_phase()  { echo -e "\n${PURPLE}━━━ $1 ━━━${NC}\n"; }

# ============================================================
# Argument parsing
# ============================================================
DEPTH="standard"
TARGET_DIR="$(pwd)"
FROM_ANALYSIS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --quick)           DEPTH="quick"; shift ;;
    --standard)        DEPTH="standard"; shift ;;
    --full)            DEPTH="full"; shift ;;
    --dir)
      [[ -z "${2:-}" ]] && { echo "Error: --dir requires an argument" >&2; exit 1; }
      TARGET_DIR="$2"; shift 2 ;;
    --from-analysis)
      [[ -z "${2:-}" ]] && { echo "Error: --from-analysis requires an argument" >&2; exit 1; }
      FROM_ANALYSIS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

print_banner
log_info "Target directory: $TARGET_DIR"
log_info "Analysis depth:   $DEPTH"
[[ -n "$FROM_ANALYSIS" ]] && log_info "Resuming from:    $FROM_ANALYSIS"
echo ""

# Validate target directory
if [[ ! -d "$TARGET_DIR" ]]; then
  echo -e "${RED}✗${NC} Directory not found: $TARGET_DIR"
  exit 1
fi

cd "$TARGET_DIR"

# Check Claude Code CLI
if ! command -v claude &> /dev/null; then
  log_warn "Claude Code CLI not found."
  log_info "Install: npm install -g @anthropic-ai/claude-code"
  log_info "Or use MIGRATE_TEMPLATE.md for manual mode."
  exit 1
fi

ANALYSIS_FILE="${FROM_ANALYSIS:-CODEBASE_ANALYSIS.md}"

# ============================================================
# Phase 1 — Scan
# ============================================================
if [[ -n "$FROM_ANALYSIS" ]]; then
  log_step "Skipping Phase 1 — using existing analysis: $FROM_ANALYSIS"
  if [[ ! -f "$FROM_ANALYSIS" ]]; then
    echo -e "${RED}✗${NC} Analysis file not found: $FROM_ANALYSIS"
    exit 1
  fi
else
  log_phase "Phase 1 of 3 — Scanning codebase ($DEPTH)"

  # ── Gather raw facts the bash way (fast, free) ──────────────
  STACK_CLUES=""

  # Manifest files
  for f in package.json go.mod requirements.txt Cargo.toml Gemfile pyproject.toml pom.xml build.gradle; do
    [[ -f "$f" ]] && STACK_CLUES+="### $f\n$(cat "$f" | head -60)\n\n"
  done

  # CI/CD configs
  for f in .github/workflows/*.yml .github/workflows/*.yaml .gitlab-ci.yml Jenkinsfile; do
    [[ -f "$f" ]] && STACK_CLUES+="### $f\n$(cat "$f" | head -40)\n\n"
  done

  # Makefile
  [[ -f "Makefile" ]] && STACK_CLUES+="### Makefile\n$(cat Makefile | head -50)\n\n"

  # README
  [[ -f "README.md" ]] && STACK_CLUES+="### README.md\n$(cat README.md | head -80)\n\n"

  # Existing CLAUDE.md
  [[ -f "CLAUDE.md" ]] && STACK_CLUES+="### CLAUDE.md (existing)\n$(cat CLAUDE.md)\n\n"

  # Top-level folder structure
  STACK_CLUES+="### Directory tree (top 2 levels)\n$(find . -maxdepth 2 -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' | sort | head -60)\n\n"

  # ── Source file samples (depth-controlled) ──────────────────
  SOURCE_SAMPLES=""

  if [[ "$DEPTH" == "standard" || "$DEPTH" == "full" ]]; then
    SAMPLE_COUNT=10
    [[ "$DEPTH" == "full" ]] && SAMPLE_COUNT=25

    SOURCE_FILES=$(find . \
      -not -path './.git/*' \
      -not -path './node_modules/*' \
      -not -path './.venv/*' \
      -not -path './vendor/*' \
      -not -path './dist/*' \
      -not -path './build/*' \
      \( -name "*.py" -o -name "*.go" -o -name "*.ts" -o -name "*.js" \
         -o -name "*.rb" -o -name "*.java" -o -name "*.rs" -o -name "*.php" \) \
      | head -"$SAMPLE_COUNT")

    for f in $SOURCE_FILES; do
      SOURCE_SAMPLES+="### $f\n$(cat "$f" | head -60)\n\n"
    done
  fi

  if [[ "$DEPTH" == "full" ]]; then
    for f in Dockerfile docker-compose.yml docker-compose.yaml \
              terraform/*.tf kubernetes/*.yaml k8s/*.yaml; do
      [[ -f "$f" ]] && SOURCE_SAMPLES+="### $f\n$(cat "$f" | head -40)\n\n"
    done
  fi

  # ── Build Phase 1 prompt and call Claude ────────────────────
  PHASE1_PROMPT=$(mktemp)
  cat > "$PHASE1_PROMPT" << 'PHASE1EOF'
You are analyzing an existing codebase to produce a structured CODEBASE_ANALYSIS.md document.
This document will be used in the next phase to generate a reality-accurate agentic framework setup.

Your job: read all the provided files and produce a STRUCTURED ANALYSIS — not an essay.

## Output format

Write a markdown document with EXACTLY these sections:

### Tech Stack
List every detected language, framework, and major library with version if visible.

### Build, Test, Lint, Run Commands
Exact commands detected from Makefile, package.json scripts, CI configs, README.
If not found, write "NOT DETECTED — must be added to CLAUDE.md manually".

### Folder Architecture
Describe the top-level structure and what lives where.
Note module boundaries if it's a monorepo.

### Actual Patterns (what the code really does)
For each of these, describe what you OBSERVED in the source files — not what's ideal:
- Where business logic lives (controllers? services? models? mixed?)
- How errors are handled (exceptions? error codes? both? none?)
- Naming conventions (camelCase? snake_case? mixed? PascalCase for what?)
- How config/env vars are used
- How the database is accessed (ORM? raw queries? repository pattern?)
- Test coverage (exists? framework? integration vs unit split?)

### Deliberate Deviations
Patterns that appear consistently across 3+ files — these are CONVENTIONS, not gaps.
Format: "CONVENTION: [what it is] — observed in [files/count]"
Do NOT flag these as problems. They are how this team works.

### Existing CLAUDE.md Assessment
If a CLAUDE.md exists: list what's correct vs placeholder vs wrong.
If none: write "NO CLAUDE.MD — will be created fresh."

### Modules / Domains Detected
List the major business domains or features visible in the code structure.
These become candidate domain skills in the next phase.

## Rules
- Report what IS, not what SHOULD BE
- If something is ambiguous, say so explicitly
- Do not invent patterns — only report what you observed
- Consistent = 3+ occurrences. Occasional = fewer than 3.
PHASE1EOF

  # Append gathered facts
  echo "" >> "$PHASE1_PROMPT"
  echo "## CODEBASE FILES" >> "$PHASE1_PROMPT"
  echo "" >> "$PHASE1_PROMPT"
  printf "%b" "$STACK_CLUES" >> "$PHASE1_PROMPT"
  [[ -n "$SOURCE_SAMPLES" ]] && printf "%b" "$SOURCE_SAMPLES" >> "$PHASE1_PROMPT"

  log_step "Running Phase 1 analysis..."
  claude -p "$(cat "$PHASE1_PROMPT")" > "$ANALYSIS_FILE"
  rm "$PHASE1_PROMPT"

  log_step "Analysis written to: ${BOLD}$ANALYSIS_FILE${NC}"
  log_info "Review and edit this file before continuing if needed."
  echo ""
fi
