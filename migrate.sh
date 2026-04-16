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

set -eo pipefail

# Resolve the directory this script lives in (works when run from npm
# package AND when piped via curl where BASH_SOURCE may be empty).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd 2>/dev/null || echo "")"

# Path to the Node Agent SDK runner. When the runner + Node are available
# we use the SDK (no hook-blocking, live streaming, cleaner errors). When
# not, we fall back to plain `claude -p` (the old path, with its caveats).
CLAUDE_RUNNER="$SCRIPT_DIR/lib/claude-runner.js"

run_claude() {
  # Usage: run_claude --prompt-file PROMPT [--capture-to OUT] [--title "Phase N — ..."]
  if [[ -f "$CLAUDE_RUNNER" ]] && command -v node &> /dev/null; then
    node "$CLAUDE_RUNNER" "$@"
    return $?
  fi

  # Fallback: legacy claude -p with the flags we know are needed.
  local prompt_file="" capture_to="" title=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --prompt-file) prompt_file="$2"; shift 2 ;;
      --capture-to)  capture_to="$2";  shift 2 ;;
      --title)       title="$2";       shift 2 ;;
      *)             shift ;;
    esac
  done

  [[ -n "$title" ]] && echo "$title"

  if [[ -n "$capture_to" ]]; then
    ENABLE_SECURITY_REMINDER=0 claude -p "$(cat "$prompt_file")" \
      --permission-mode bypassPermissions \
      --allowedTools "Write Edit MultiEdit Read Bash Glob Grep TodoWrite" \
      > "$capture_to"
  else
    ENABLE_SECURITY_REMINDER=0 claude -p "$(cat "$prompt_file")" \
      --permission-mode bypassPermissions \
      --allowedTools "Write Edit MultiEdit Read Bash Glob Grep TodoWrite"
  fi
}

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
AGENT_TARGET="both"

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
    --target)
      [[ -z "${2:-}" ]] && { echo "Error: --target requires an argument" >&2; exit 1; }
      AGENT_TARGET="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

print_banner
log_info "Target directory: $TARGET_DIR"
log_info "Analysis depth:   $DEPTH"
log_info "Agent target:     $AGENT_TARGET"
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
  run_claude --prompt-file "$PHASE1_PROMPT" --capture-to "$ANALYSIS_FILE" --title "Phase 1 — Scanning codebase"
  rm "$PHASE1_PROMPT"

  log_step "Analysis written to: ${BOLD}$ANALYSIS_FILE${NC}"
  log_info "Review and edit this file before continuing if needed."
  echo ""
fi

# Guard: ensure analysis file is non-empty before Phase 2
if [[ ! -s "$ANALYSIS_FILE" ]]; then
  echo -e "${RED}✗${NC} Analysis file is empty: $ANALYSIS_FILE" >&2
  log_info "Re-run Phase 1 or provide a valid analysis with --from-analysis"
  exit 1
fi

# ============================================================
# Phase 2 — Generate .claude/ framework
# ============================================================
log_phase "Phase 2 of 3 — Generating reality-accurate framework"

PHASE2_PROMPT=$(mktemp)
cat > "$PHASE2_PROMPT" << 'PHASE2EOF'
You are setting up an agentic development framework for an EXISTING codebase.

You have been given a CODEBASE_ANALYSIS.md that describes what the codebase actually is today.
Your job is to generate a .claude/ framework that is accurate to this reality — not aspirational.

## Critical rule: Reality first

CLAUDE.md guardrails must describe what the code DOES TODAY, not what it should do.
If the codebase puts business logic in controllers, the guardrail says: "Business logic currently lives in controllers — see MIGRATION_PLAN.md for the path to service layer extraction."
Do NOT write guardrails the codebase violates. That creates friction and loses trust.

## What to create:

### 1. CLAUDE.md
Fill in every section with REAL values from the analysis:
- Project name and stack: exact, from the analysis
- Build/test/lint/run commands: exact commands detected, no placeholders
- Architectural guardrails: describe current reality, flag aspirational items with "TARGET:"
- Deliberate deviations section: list every CONVENTION from the analysis as an accepted pattern

### 2. Customize agents (stack-specific only)
Modify these to match the detected stack:
- `.claude/agents/api-engineer.md` — update skills + rules for the actual backend stack
- `.claude/agents/frontend-engineer.md` — update for the actual frontend stack
- `.claude/agents/devops-engineer.md` — update for the actual infra

DO NOT modify these universal agents (they work as-is):
- `architect.md`, `test-engineer.md`, `security-reviewer.md`

### 3. Domain skills
For each module/domain detected in the analysis, create `.claude/skills/[domain]/SKILL.md`
Skills must contain patterns observed in the actual code, not generic advice.
Include: "Current pattern:" (what code does now) and optionally "Target pattern:" (where it's going)

### 4. Merge behavior
- If CLAUDE.md exists: preserve any sections that are accurate, update what's wrong or placeholder
- If .claude/ files exist: update them, don't overwrite blindly
- If no tests detected: add a note in CLAUDE.md under "Test infrastructure: MISSING — see MIGRATION_PLAN.md"

## Output
Use the Write tool to write each file directly.
After all files written, run: find .claude -type f | sort
PHASE2EOF

# Add Copilot instructions to Phase 2 prompt when target includes copilot
if [[ "$AGENT_TARGET" == "copilot" || "$AGENT_TARGET" == "both" ]]; then
  cat >> "$PHASE2_PROMPT" << 'COPILOT_PHASE2'

### 5. Generate Copilot CLI artifacts
Also generate these files for GitHub Copilot CLI compatibility:

#### a) .github/copilot-instructions.md
Project-level Copilot instructions. Mirror key CLAUDE.md content but add Copilot-specific guidance:
- Reference agent definitions in AGENTS.md
- Reference skill instructions in .github/instructions/
- Note that /plan (not /plan-feature) is Copilot's planning command

#### b) AGENTS.md
Aggregate all agent definitions into a single AGENTS.md file at the repo root.
Each agent gets a section with: role, workflow, and rules (adapted from .claude/agents/*.md).

#### c) .github/instructions/*.instructions.md
For each skill in .claude/skills/, create a corresponding .github/instructions/[skill-name].instructions.md.
Convert YAML frontmatter to a markdown header and keep the content.

After creating Copilot artifacts, also verify:
find .github/instructions -name "*.instructions.md" | sort
ls -la AGENTS.md .github/copilot-instructions.md
COPILOT_PHASE2
fi

# Append the analysis
echo "" >> "$PHASE2_PROMPT"
echo "## CODEBASE_ANALYSIS.md" >> "$PHASE2_PROMPT"
echo "" >> "$PHASE2_PROMPT"
cat "$ANALYSIS_FILE" >> "$PHASE2_PROMPT"

log_step "Running Phase 2 framework generation..."
run_claude --prompt-file "$PHASE2_PROMPT" --title "Phase 2 — Generating framework to match codebase reality"
rm "$PHASE2_PROMPT"

log_step "Framework generated in .claude/"
echo ""

# ============================================================
# Phase 3 — Gap Report + Migration Plan
# ============================================================
log_phase "Phase 3 of 3 — Generating gap report and migration roadmap"

PHASE3_PROMPT=$(mktemp)
cat > "$PHASE3_PROMPT" << 'PHASE3EOF'
You are producing a MIGRATION_PLAN.md for an existing codebase adopting the agentic development framework.

You have two inputs:
1. CODEBASE_ANALYSIS.md — what the codebase is today
2. The .claude/ framework just generated — what the agentic ideal looks like

Your job: compare them, identify gaps, then produce a phased migration roadmap.

## Gap classification

For each gap found:
- CRITICAL: security vulnerabilities, correctness risks, missing auth/validation
- HIGH: architectural violations that cause real pain (god objects, business logic in wrong layer)
- MEDIUM: convention drift, inconsistent patterns, missing tests for key flows
- LOW: hygiene, naming, comments, minor style issues

## Deliberate deviation rule
If CODEBASE_ANALYSIS.md marks something as a CONVENTION (consistent across 3+ files):
→ Place it in "Deliberate Deviations", NOT in the gap list
→ The framework works around these, not against them

## Output: MIGRATION_PLAN.md

Write a document with EXACTLY these sections:

---

# Migration Plan — [Project Name]
Generated: [today's date]

## Gap Report

### Critical Gaps
[Each gap: severity badge, file:line if known, what's wrong, specific fix]

### High Gaps
[same format]

### Medium Gaps
[same format]

### Low Gaps
[same format]

### Deliberate Deviations (not gaps)
[Each: "CONVENTION: [description] — framework respects this, no action needed"]

---

## Migration Roadmap

### Phase 1: Quick Wins (no structural change, can do in a day)
- [ ] [Specific action] — [why it matters]

### Phase 2: Structural Refactors (requires planning, days to weeks)
- [ ] [Specific action] — [why it matters] — use /plan-feature for each

### Phase 3: Hardening (tests, observability, security — ongoing)
- [ ] [Specific action] — [why it matters]

---

## What NOT to Change
[Explicit list of things the framework is designed to work around]
[Include all deliberate deviations + any compliance/legacy constraints visible in the analysis]

---

## Special rules
- If NO TESTS detected in analysis: Phase 1 item #1 must be "Add test infrastructure"
- If NO CI/CD detected: Phase 1 must include "Add CI pipeline"
- Be specific — "refactor UserController" beats "improve code quality"
- Each roadmap item should be executable by one developer in one sprint
PHASE3EOF

# Append both inputs
echo "" >> "$PHASE3_PROMPT"
echo "## CODEBASE_ANALYSIS.md" >> "$PHASE3_PROMPT"
echo "" >> "$PHASE3_PROMPT"
cat "$ANALYSIS_FILE" >> "$PHASE3_PROMPT"

echo "" >> "$PHASE3_PROMPT"
echo "## Generated .claude/ framework (find output)" >> "$PHASE3_PROMPT"
echo "" >> "$PHASE3_PROMPT"
if [[ -d ".claude" ]]; then
  find .claude -type f | sort >> "$PHASE3_PROMPT"
else
  echo "(no .claude/ directory found — Phase 2 may not have created framework files)" >> "$PHASE3_PROMPT"
fi
echo "" >> "$PHASE3_PROMPT"
echo "CLAUDE.md content:" >> "$PHASE3_PROMPT"
[[ -f "CLAUDE.md" ]] && cat CLAUDE.md >> "$PHASE3_PROMPT"

log_step "Running Phase 3 gap analysis..."
run_claude --prompt-file "$PHASE3_PROMPT" --capture-to "MIGRATION_PLAN.md" --title "Phase 3 — Building migration roadmap"
rm "$PHASE3_PROMPT"

log_step "Migration plan written to: ${BOLD}MIGRATION_PLAN.md${NC}"

# Ensure hooks are executable — defends against npm-pack / umask edge cases
if [ -d ".claude/hooks" ]; then
  find .claude/hooks -name "*.sh" -type f -exec chmod +x {} +
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ${BOLD}Migration complete!${NC}${GREEN}                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Artifacts produced:${NC}"
echo -e "  ├── ${CYAN}$ANALYSIS_FILE${NC}    ← what your codebase actually is"
echo -e "  ├── ${CYAN}.claude/${NC}              ← reality-accurate framework"
echo -e "  └── ${CYAN}MIGRATION_PLAN.md${NC}     ← gap report + roadmap"
echo ""
echo -e "  ${BOLD}Recommended next steps:${NC}"
echo -e "  ${CYAN}1.${NC} Review CODEBASE_ANALYSIS.md — correct any misdetections"
echo -e "  ${CYAN}2.${NC} Review CLAUDE.md — verify it reflects your project accurately"
echo -e "  ${CYAN}3.${NC} Open MIGRATION_PLAN.md — start with Phase 1 quick wins"
echo -e "  ${CYAN}4.${NC} Open Claude Code and type: ${BOLD}/plan-feature${NC}"
echo ""
