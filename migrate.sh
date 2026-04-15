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
    --dir)             TARGET_DIR="$2"; shift 2 ;;
    --from-analysis)   FROM_ANALYSIS="$2"; shift 2 ;;
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
