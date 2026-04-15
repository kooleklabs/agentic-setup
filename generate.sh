#!/bin/bash
# ============================================================
# Agentic Framework Generator — Prompt-Driven Setup
# Version: 1.0.0 | April 2026
#
# HOW IT WORKS:
# 1. You paste your requirement (PRD, proposal, or idea)
# 2. This script feeds it to Claude Code
# 3. Claude Code generates a fully customized .claude/ framework
#
# USAGE:
#   # Interactive — paste your requirement when prompted
#   bash generate.sh
#
#   # From a file — point to your PRD/proposal document
#   bash generate.sh --from requirements.md
#   bash generate.sh --from proposal.docx
#
#   # One-liner — describe your project inline
#   bash generate.sh --idea "E-commerce platform with Go Fiber + PostgreSQL"
#
# PREREQUISITES:
#   - Claude Code CLI installed (npm install -g @anthropic-ai/claude-code)
#   - setup.sh in the same directory (the base framework)
# ============================================================

set -eo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-}")" && pwd 2>/dev/null || echo "")"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${BOLD}Agentic Framework Generator${NC}${CYAN}                     ║${NC}"
echo -e "${CYAN}║  Paste a requirement → get a customized framework║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================
# Step 1: Get the requirement
# ============================================================
REQUIREMENT=""

if [[ "${1:-}" == "--from" ]] && [[ -n "${2:-}" ]]; then
  FILE="$2"
  if [[ ! -f "$FILE" ]]; then
    echo "❌ File not found: $FILE"
    exit 1
  fi
  echo -e "${GREEN}[✓]${NC} Reading requirement from: $FILE"

  EXT="${FILE##*.}"
  case "$EXT" in
    md|txt)
      REQUIREMENT=$(cat "$FILE")
      ;;
    docx)
      if command -v extract-text &> /dev/null; then
        REQUIREMENT=$(extract-text "$FILE")
      elif command -v pandoc &> /dev/null; then
        REQUIREMENT=$(pandoc "$FILE" -t plain)
      else
        echo "❌ Need extract-text or pandoc to read .docx files"
        exit 1
      fi
      ;;
    pdf)
      if command -v pdftotext &> /dev/null; then
        REQUIREMENT=$(pdftotext "$FILE" -)
      else
        echo "❌ Need pdftotext to read .pdf files"
        exit 1
      fi
      ;;
    *)
      REQUIREMENT=$(cat "$FILE")
      ;;
  esac

elif [[ "${1:-}" == "--idea" ]] && [[ -n "${2:-}" ]]; then
  REQUIREMENT="$2"
  echo -e "${GREEN}[✓]${NC} Using inline idea"

else
  echo -e "${BOLD}Paste your requirement below.${NC}"
  echo -e "This can be a PRD, proposal, feature spec, or just an idea."
  echo -e "Press ${YELLOW}Ctrl+D${NC} when done."
  echo ""
  REQUIREMENT=$(cat)
fi

if [[ -z "$REQUIREMENT" ]]; then
  echo "❌ No requirement provided"
  exit 1
fi

# ============================================================
# Step 2: Run base framework setup
# ============================================================
echo ""
echo -e "${GREEN}[✓]${NC} Running base framework setup..."
if [[ -f "$SCRIPT_DIR/setup.sh" ]]; then
  bash "$SCRIPT_DIR/setup.sh" 2>/dev/null
else
  echo -e "${YELLOW}[!]${NC} setup.sh not found locally — fetching from GitHub..."
  curl -fsSL https://raw.githubusercontent.com/KoolekLabs/agentic-setup/main/setup.sh | bash
fi

# ============================================================
# Step 3: Generate the Claude Code prompt
# ============================================================
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" << 'PROMPTEOF'
You are an expert software architect setting up an agentic development framework.

I will give you a project requirement. Your job is to customize the existing .claude/ framework files for this specific project.

## What to do:

### 1. Update CLAUDE.md
Rewrite the CLAUDE.md file with:
- Actual project name and description
- Detected tech stack (infer from the requirement)
- Correct build/test/lint/run commands for that stack
- Project-specific architectural guardrails
- Domain-specific conventions

### 2. Customize agents
Edit these files to be stack-specific:
- `.claude/agents/api-engineer.md` — update skills list and rules for the detected backend stack
- `.claude/agents/frontend-engineer.md` — update for the detected frontend stack
- `.claude/agents/devops-engineer.md` — update for the detected infra/deployment

Do NOT modify these universal agents (they work as-is):
- architect.md
- test-engineer.md
- security-reviewer.md

### 3. Create project-specific skills
For each major domain/module in the requirement, create a SKILL.md file at:
`.claude/skills/[domain-name]/SKILL.md`

Each skill should contain:
- YAML frontmatter with name and description
- Domain rules, patterns, and conventions
- Business logic constraints
- Integration patterns

### 4. Create project-specific commands
If the requirement mentions specific workflows (deployment, data migration, etc.), create command files at:
`.claude/commands/[command-name].md`

### 5. Update .mcp.json
Add MCP servers relevant to the tech stack:
- PostgreSQL/MySQL if database mentioned
- Figma if UI/design work mentioned
- Sentry if monitoring mentioned
- Stripe/payment MCPs if payments mentioned

### 6. Create contracts
If the requirement describes APIs or multi-service communication, create:
- `contracts/api-spec.yaml` — OpenAPI skeleton with key endpoints
- `contracts/events.md` — event schemas if async communication mentioned

## Rules:
- Infer the tech stack from the requirement (don't ask)
- If the requirement is vague, make reasonable choices and note them in CLAUDE.md
- Every skill must be actionable — rules Claude can follow, not general advice
- Keep agent files under 50 lines
- Keep skill files under 100 lines
- Use the project's domain language in file names (e.g., teacher-matching not assignment-module)

## Output:
For each file you create or modify, use the Write tool to write the file directly.
After all files are created, run `find .claude -type f | sort` to show the final tree.

PROMPTEOF

# Append the actual requirement
echo "" >> "$PROMPT_FILE"
echo "## THE REQUIREMENT:" >> "$PROMPT_FILE"
echo "" >> "$PROMPT_FILE"
echo "$REQUIREMENT" >> "$PROMPT_FILE"

# ============================================================
# Step 4: Run Claude Code with the prompt
# ============================================================
echo ""
echo -e "${GREEN}[✓]${NC} Requirement captured ($(echo "$REQUIREMENT" | wc -w) words)"
echo ""

if command -v claude &> /dev/null; then
  echo -e "${GREEN}[✓]${NC} Claude Code detected — generating customized framework..."
  echo ""
  echo -e "  ${BOLD}Expected duration:${NC} 3-8 minutes for a typical requirement."
  echo -e "  Claude runs silently in the background while writing files."
  echo -e "  ${CYAN}Tip:${NC} open another terminal and run ${BOLD}ls -lt .claude/skills/ .claude/agents/${NC}"
  echo -e "  to watch files appear. A dot below = still working."
  echo ""
  printf "  "

  # Background heartbeat — one dot every 5s so the user knows it's alive.
  ( while true; do printf "."; sleep 5; done ) &
  HEARTBEAT_PID=$!
  # Kill the heartbeat if the script exits early (Ctrl-C, error, etc.)
  trap 'kill $HEARTBEAT_PID 2>/dev/null; echo ""' EXIT INT TERM

  claude -p "$(cat "$PROMPT_FILE")"
  CLAUDE_EXIT=$?

  kill $HEARTBEAT_PID 2>/dev/null
  wait $HEARTBEAT_PID 2>/dev/null
  trap - EXIT INT TERM
  echo ""

  rm -f "$PROMPT_FILE"

  if [[ $CLAUDE_EXIT -ne 0 ]]; then
    echo -e "${YELLOW}[!]${NC} claude -p exited with code $CLAUDE_EXIT"
    echo -e "    If files weren't fully generated, open Claude Code interactively"
    echo -e "    in this directory and continue from there."
  fi
else
  # Save prompt for manual use
  SAVED_PROMPT=".claude/GENERATE_PROMPT.md"
  cp "$PROMPT_FILE" "$SAVED_PROMPT"
  rm "$PROMPT_FILE"

  echo -e "${YELLOW}[!]${NC} Claude Code CLI not detected."
  echo ""
  echo -e "  ${BOLD}Option A: Run manually in Claude Code${NC}"
  echo -e "  Open Claude Code in this directory and paste the prompt from:"
  echo -e "  ${CYAN}$SAVED_PROMPT${NC}"
  echo ""
  echo -e "  ${BOLD}Option B: Copy the prompt below${NC}"
  echo ""
  echo "  ─────────────────────────────────────────────"
  cat "$SAVED_PROMPT"
  echo ""
  echo "  ─────────────────────────────────────────────"
  echo ""
  echo -e "  ${BOLD}Option C: Use in Claude.ai chat${NC}"
  echo -e "  Copy the prompt above and paste it in claude.ai"
  echo -e "  along with your project folder as context."
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ${BOLD}Done!${NC}${GREEN} Your framework is customized.               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}What happened:${NC}"
echo -e "  ├── CLAUDE.md          — customized for your project"
echo -e "  ├── agents/            — stack-specific engineers"
echo -e "  ├── skills/            — domain skills generated"
echo -e "  ├── commands/          — project workflows"
echo -e "  ├── .mcp.json          — relevant MCP servers"
echo -e "  └── contracts/         — API specs (if applicable)"
echo ""
echo -e "  ${BOLD}Next:${NC} Open Claude Code and type ${CYAN}/plan-feature${NC}"
echo ""
