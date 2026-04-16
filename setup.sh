#!/bin/bash
# ============================================================
# Universal Agentic Development Framework — Automated Setup
# Version: 1.0.0 | April 2026
# By: KoolekLabs / AmanLabs
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/.../setup.sh | bash
#   OR
#   bash setup.sh
#   OR (interactive mode with project customization)
#   bash setup.sh --interactive
#
# What this does:
#   1. Creates .claude/ directory with all agents, skills, commands, hooks
#   2. Creates CLAUDE.md template
#   3. Creates .claudeignore
#   4. Creates .mcp.json template
#   5. Creates contracts/ directory
#   6. Installs recommended plugins (if Claude Code is available)
#
# Everything marked [UNIVERSAL] works as-is for any project.
# Everything marked [CUSTOMIZE] has sensible defaults you can edit.
# ============================================================

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

print_banner() {
  echo ""
  echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║  ${BOLD}Universal Agentic Development Framework${NC}${CYAN}        ║${NC}"
  echo -e "${CYAN}║  v1.0.0 — Drop into any project, start building ║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

log_step() { echo -e "${GREEN}[✓]${NC} $1"; }
log_info() { echo -e "${BLUE}[i]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_create() { echo -e "  ${PURPLE}→${NC} $1"; }

# ============================================================
# Parse arguments
# ============================================================
TARGET="both"
INTERACTIVE_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --interactive)
      INTERACTIVE_MODE=true
      shift
      ;;
    --target)
      TARGET="${2:-both}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Helper: should we generate Claude artifacts?
wants_claude() { [[ "$TARGET" == "claude" || "$TARGET" == "both" ]]; }
# Helper: should we generate Copilot artifacts?
wants_copilot() { [[ "$TARGET" == "copilot" || "$TARGET" == "both" ]]; }

# ============================================================
# Interactive mode: gather project info
# ============================================================
PROJECT_NAME=""
TECH_STACK=""
BUILD_CMD=""
TEST_CMD=""
LINT_CMD=""
RUN_CMD=""

if [[ "$INTERACTIVE_MODE" == "true" ]]; then
  print_banner
  echo -e "${BOLD}Let's configure your project:${NC}"
  echo ""
  read -p "  Project name: " PROJECT_NAME
  read -p "  Tech stack (e.g., Next.js + Node.js + PostgreSQL): " TECH_STACK
  read -p "  Build command (e.g., npm run build): " BUILD_CMD
  read -p "  Test command (e.g., npm test): " TEST_CMD
  read -p "  Lint command (e.g., npm run lint): " LINT_CMD
  read -p "  Run command (e.g., npm run dev): " RUN_CMD
  echo ""
else
  print_banner
  PROJECT_NAME="${PROJECT_NAME:-[PROJECT_NAME]}"
  TECH_STACK="${TECH_STACK:-[e.g., Next.js + Node.js + PostgreSQL]}"
  BUILD_CMD="${BUILD_CMD:-[YOUR_BUILD_COMMAND]}"
  TEST_CMD="${TEST_CMD:-[YOUR_TEST_COMMAND]}"
  LINT_CMD="${LINT_CMD:-[YOUR_LINT_COMMAND]}"
  RUN_CMD="${RUN_CMD:-[YOUR_RUN_COMMAND]}"
fi

log_info "Target: ${TARGET}"

# ============================================================
# Create directory structure
# ============================================================
log_step "Creating directory structure..."

if wants_claude; then
  mkdir -p .claude/agents
  mkdir -p .claude/skills/coding-standards
  mkdir -p .claude/skills/api-design
  mkdir -p .claude/skills/testing
  mkdir -p .claude/skills/security-review
  mkdir -p .claude/skills/design-system
  mkdir -p .claude/commands
  mkdir -p .claude/hooks
  log_create ".claude/agents/"
  log_create ".claude/skills/ (5 universal skills)"
  log_create ".claude/commands/"
  log_create ".claude/hooks/"
fi

if wants_copilot; then
  mkdir -p .github/instructions
  log_create ".github/instructions/"
fi

mkdir -p contracts

log_create "contracts/"

# ============================================================
# CLAUDE.md — Project Constitution
# ============================================================
log_step "Creating CLAUDE.md..."

cat > CLAUDE.md << 'CLAUDEMD'
# CLAUDE.md — Project Constitution
# Framework: Universal Agentic Development Framework v1.0.0

## 1. Project identity
CLAUDEMD

cat >> CLAUDE.md << EOF
- **Name**: ${PROJECT_NAME}
- **Tech stack**: ${TECH_STACK}
- **Architecture**: [Monolith | Microservices | Modular monolith]
- **Repository layout**: [Describe your folder structure]

## 2. Build and test commands
\`\`\`
# Build
${BUILD_CMD}

# Test (run before every commit)
${TEST_CMD}

# Lint
${LINT_CMD}

# Run locally
${RUN_CMD}
\`\`\`
EOF

cat >> CLAUDE.md << 'CLAUDEMD'

## 3. Architectural guardrails
- Follow existing patterns before introducing new ones — check 3 similar files first
- All API errors must return structured error responses with codes
- Database access through repository/data-access layer only
- Environment-specific config from env vars only, never hardcoded
- Every public API endpoint must have input validation
- No business logic in controllers/handlers — delegate to service layer

## 4. Code style and conventions
- Write self-documenting code; comments explain WHY, not WHAT
- Functions do one thing, under 50 lines when possible
- Fail fast, return errors explicitly, never swallow silently
- No premature abstractions — wait for three occurrences
- When refactoring, run tests after EACH change

## 5. Plan mode
- Enter plan mode for ANY non-trivial task (3+ steps or architecture decisions)
- Show the plan and wait for approval before implementing
- Plans include: files changed, verification steps, rollback strategy
- Large changes broken into phases, each leaving codebase working

## 6. Verification protocol
- Run /self-review before every commit — tests → lint → security, fix each before moving on
- Loop until all checks are green — never commit with failing tests or lint errors
- Never use --no-verify to bypass hooks
- For API changes: verify contracts match the spec
- For DB changes: verify migrations run up AND down
- Never commit secrets, API keys, or credentials

## 7. Skills and subagents
- Load skills from `.claude/skills/` — auto-activate when relevant
- Load subagents from `.claude/agents/`
- Use subagents to keep main context clean
- Prefer feature-specific agents over generic ones

## 8. Context management
- Use `/compact` when context gets long
- When compacting, ALWAYS preserve: modified file list, test results, current plan, unresolved errors
- `.claudeignore` excludes build artifacts and dependencies

## 9. Git workflow
- Conventional commits: feat:, fix:, refactor:, test:, docs:, chore:
- One logical change per commit
- Feature branches, never commit directly to main
- Meaningful PR descriptions: WHAT changed and WHY

## 10. Design workflow
- Design first, code second — get sign-off before implementing
- Use Figma MCP to read approved designs
- Follow design-system skill for brand, tokens, accessibility
- Use /design-review to compare code vs Figma frames
CLAUDEMD

# ============================================================
# .claudeignore
# ============================================================
if wants_claude; then
log_step "Creating .claudeignore..."

cat > .claudeignore << 'EOF'
# Dependencies
node_modules/
.venv/
vendor/
go/pkg/
target/
__pycache__/
*.pyc

# Build artifacts
dist/
build/
.next/
out/
*.min.js
*.min.css
*.map

# Generated
coverage/
.nyc_output/
*.lock

# Assets (binary)
*.png
*.jpg
*.jpeg
*.gif
*.svg
*.ico
*.woff
*.woff2
*.ttf
*.eot

# IDE and OS
.idea/
.vscode/
*.swp
*.swo
.DS_Store
Thumbs.db

# Logs and temp
*.log
tmp/
temp/
.cache/
.docker/
EOF
fi

# ============================================================
# AGENTS — Layer 4
# ============================================================
if wants_claude; then
log_step "Creating agents..."

# --- architect.md (UNIVERSAL) ---
cat > .claude/agents/architect.md << 'EOF'
---
name: architect
description: Senior architect agent. Decomposes complex requirements into tasks, designs system structure, delegates to specialized subagents. Use for any task involving system design, multi-file changes, or architectural decisions.
tools: Read, Grep, Glob, Bash, Agent(api-engineer), Agent(frontend-engineer), Agent(test-engineer), Agent(security-reviewer)
model: opus
permissionMode: plan
---

You are a senior software architect. Your job:

1. DECOMPOSE complex requirements into clear, independent tasks
2. IMPACT ANALYSIS — before touching any file, map what depends on it
3. DESIGN system structure following CLAUDE.md patterns
4. DELEGATE implementation to specialized agents
5. VERIFY all pieces integrate correctly

## Impact analysis (run before every plan)
For each file you intend to modify:
```bash
# Who imports this file?
grep -r "from.*<module>" --include="*.py" -l    # Python
grep -r "require.*<module>" --include="*.js" -l  # JS/TS
grep -r "import.*<package>" --include="*.go" -l  # Go
```
Flag any file that:
- Is imported by 5+ other files → HIGH blast radius, prefer additive changes
- Is part of a public API contract (/contracts/) → must version bump
- Contains shared state (singleton, global config) → test all consumers

## Decision framework
- 1-2 files, low blast radius → handle directly
- 3+ files OR high blast radius → create plan, then delegate to subagents
- Cross-domain changes → check /contracts/ first
- Security-sensitive code → delegate to security-reviewer

## Planning format
```
## Task: [description]
### Phase 1: [name]
- [ ] Step: [action] → [files] → [verification]
### Verification
- [ ] All tests pass
- [ ] Lint clean
- [ ] No security issues
```

## Rules
- Never skip planning for non-trivial work
- Verify existing patterns before proposing new ones
- Prefer boring, proven solutions over clever ones
- Every phase must leave the codebase working
EOF
log_create "architect.md (universal, Opus)"

# --- api-engineer.md (CUSTOMIZE) ---
cat > .claude/agents/api-engineer.md << 'EOF'
---
name: api-engineer
description: Implements API endpoints, service logic, and data access. Use for any backend implementation task.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
skills:
  - coding-standards
  - api-design
---

You are a senior backend engineer. Your workflow:

1. READ existing codebase — find 2-3 similar implementations first
2. FOLLOW existing patterns, do not invent new ones
3. IMPLEMENT with proper error handling and input validation
4. WRITE or update tests for your changes
5. LOOP until clean:
   - Run test suite → fix failures → re-run
   - Run linter → fix issues → re-run
6. RUN /self-review before committing

## Rules
- Check CLAUDE.md section 3 before starting
- Never put business logic in controllers/handlers
- All DB queries through repository layer
- Structured error responses with error codes
- Log at appropriate levels: ERROR/WARN/INFO
- No hardcoded configuration values
EOF
log_create "api-engineer.md (customize per stack)"

# --- frontend-engineer.md (CUSTOMIZE) ---
cat > .claude/agents/frontend-engineer.md << 'EOF'
---
name: frontend-engineer
description: Implements UI components and pages. Reads Figma designs via MCP, follows design-system skill. Use for any frontend/UI implementation task.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
skills:
  - design-system
  - coding-standards
---

You are a senior frontend engineer. Your workflow:

1. CHECK if Figma MCP is connected — read the design frame first
2. READ the design-system skill for brand, tokens, accessibility rules
3. IMPLEMENT components that match the approved design pixel-perfect
4. ENSURE accessibility: ARIA labels, keyboard nav, contrast ratios
5. WRITE component tests (rendering, interaction, edge cases)
6. LOOP until clean:
   - Run tests → fix failures → re-run
   - Run linter → fix issues → re-run
7. VERIFY responsive behavior at mobile/tablet/desktop widths
8. RUN /self-review before committing

## Rules
- Design-system skill overrides your defaults — follow it exactly
- Arabic/RTL text requires explicit direction handling
- Minimum touch target: 48x48px for mobile
- All interactive elements need visible focus indicators
- Images need alt text, icons need aria-labels
- Test with screen reader if building for accessibility-critical users
EOF
log_create "frontend-engineer.md (customize per stack)"

# --- test-engineer.md (UNIVERSAL) ---
cat > .claude/agents/test-engineer.md << 'EOF'
---
name: test-engineer
description: Writes comprehensive tests, identifies edge cases, validates coverage. Use for any testing task.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
skills:
  - testing
  - coding-standards
---

You are a senior test engineer. Your workflow:

1. READ the implementation and understand all code paths
2. IDENTIFY: happy path, error cases, edge cases, boundaries
3. WRITE tests covering each path
4. RUN tests and verify they pass
5. CHECK coverage if tools available

## Test structure
- Follow project's existing test conventions (check 2-3 test files)
- One test file per source file
- Group tests by behavior, not by method
- Names describe scenarios: "should return 404 when user not found"
- Each test independent — no shared mutable state

## Edge cases to ALWAYS consider
- Empty/null/undefined inputs
- Boundary values (0, -1, MAX_INT, empty string)
- Concurrent access (if applicable)
- Network failures and timeouts
- Permission/authorization edge cases
- Malformed input data

## Rules
- Tests must be deterministic — no flaky tests
- Mock external services, never call real APIs in tests
- Test error messages, not just error codes
- Integration tests for cross-module flows
EOF
log_create "test-engineer.md (universal)"

# --- security-reviewer.md (UNIVERSAL) ---
cat > .claude/agents/security-reviewer.md << 'EOF'
---
name: security-reviewer
description: Read-only security auditor. Reviews code for vulnerabilities without modifying files. Use for any security review task.
tools: Read, Grep, Glob
model: haiku
permissionMode: plan
---

You are a senior security engineer. You ONLY review — never edit files.

## What to check
1. INJECTION: SQL, XSS, command injection, path traversal
2. AUTHENTICATION: bypass risks, session handling, JWT validation
3. AUTHORIZATION: privilege escalation, missing access checks
4. SECRETS: hardcoded keys, tokens, passwords, connection strings
5. DATA: unencrypted sensitive data, excessive logging of PII
6. DEPENDENCIES: known vulnerable packages (check package.json/go.mod)
7. INPUT: missing validation, type coercion issues

## Output format
For each finding:
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Location**: file:line
- **Issue**: what's wrong
- **Fix**: specific remediation

## Rules
- NEVER modify files — read-only audit
- Flag ALL findings, even if uncertain
- Check OWASP Top 10 against every endpoint
- Verify role-based access on every protected route
- Check for rate limiting on auth endpoints
EOF
log_create "security-reviewer.md (universal, Haiku, read-only)"

# --- devops-engineer.md (CUSTOMIZE) ---
cat > .claude/agents/devops-engineer.md << 'EOF'
---
name: devops-engineer
description: Handles infrastructure, deployment, CI/CD, and monitoring. Customize for your infra stack.
tools: Read, Grep, Glob, Bash, Write, Edit
model: sonnet
skills:
  - coding-standards
---

You are a senior DevOps engineer. Your workflow:

1. READ existing infra configs before adding new ones — check 2-3 similar files first
2. FOLLOW the project's deployment patterns (check CI configs, Dockerfiles, manifests)
3. IMPLEMENT infrastructure-as-code; all changes must be reversible
4. VALIDATE configs before committing (lint YAML, validate Dockerfile, dry-run CI)
5. TEST in staging before production — never change prod without a verified staging run

## CI/CD standards
- Fail fast: lint and unit tests first, integration tests after, deploy last
- Cache aggressively: deps, build artifacts, Docker layers
- Every pipeline step must have a clear failure message — no silent failures
- Deployment only triggers on passing tests — never bypass
- Rollback must be a single command: git revert + push, or image tag repin

## Docker standards
- Multi-stage builds: builder stage then minimal runtime image
- Non-root user in final stage (USER appuser)
- No secrets in image layers — use runtime env vars or secret mounts
- Pin base image versions (node:20-alpine, not node:latest)
- .dockerignore excludes: node_modules/, .git/, *.env, test files

## Zero-downtime deployment checklist
- Health check endpoint exists and returns 200 when ready
- Graceful shutdown: drain connections before stopping (SIGTERM handler)
- DB migrations run before new code deploys (never after)
- Feature flags for risky changes — dark launch before full rollout
- Readiness probe != liveness probe — configure both separately

## Secret management
- Secrets in env vars, secret managers (Vault, AWS SSM, Doppler), never in code
- Rotate secrets on every suspected exposure — don't wait to confirm
- CI secrets: use platform secret store, never print to logs

## Observability minimum
- Structured logs (JSON) with: timestamp, level, service, trace_id, message
- Health check: GET /health returns { status: "ok", version: "...", uptime: N }
- Metrics: request rate, error rate, p50/p95/p99 latency
- Alerts on: error rate spike, p99 latency breach, disk/memory thresholds

## Rules
- Every infra change must be reversible — document the rollback in the PR
- No manual prod changes — everything through IaC or CI/CD pipeline
- Never expose internal errors or stack traces in production responses
- All services behind health checks before receiving traffic
EOF
log_create "devops-engineer.md (customize per infra)"
fi

# ============================================================
# SKILLS — Layer 5
# ============================================================
if wants_claude; then
log_step "Creating skills..."

# --- coding-standards (UNIVERSAL) ---
cat > .claude/skills/coding-standards/SKILL.md << 'EOF'
---
name: coding-standards
description: Universal clean code principles. Auto-activates during any code implementation task. Covers naming, error handling, function design, and code organization.
---

# Coding standards

## Naming
- Variables/functions: descriptive, verb-based for actions (getUserById, calculateTotal)
- Booleans: prefix with is/has/can/should (isActive, hasPermission)
- Constants: UPPER_SNAKE_CASE
- Files: follow project's existing convention (check 3 files first)

## Functions
- Single responsibility — one function, one job
- Under 50 lines when possible (extract helper functions)
- Maximum 3-4 parameters; use an options object for more
- Return early for guard clauses — avoid deep nesting
- Pure functions preferred — minimize side effects

## Error handling
- Fail fast: validate inputs at the boundary
- Return explicit errors, never swallow silently
- Use typed/custom errors with error codes
- Log errors with context (what failed, why, what input)
- Never catch-all without re-throwing or logging

## Code organization
- Group by feature/domain, not by type
- Keep related code close together
- Extract shared logic only after 3+ duplications
- Delete dead code — don't comment it out

## Comments
- Comments explain WHY, not WHAT
- TODO comments include context and author
- API docs on public interfaces
- No commented-out code blocks
EOF
log_create "coding-standards/SKILL.md (universal)"

# --- api-design (UNIVERSAL) ---
cat > .claude/skills/api-design/SKILL.md << 'EOF'
---
name: api-design
description: REST API design patterns. Auto-activates when building API endpoints, routes, or controllers.
---

# API design patterns

## URL structure
- Nouns for resources: /users, /orders, /products
- Plural form: /users not /user
- Nested for ownership: /users/:id/orders
- Query params for filtering: /orders?status=completed&type=subscription
- Max 3 levels of nesting

## HTTP methods
- GET: read (idempotent, no body)
- POST: create (returns 201 + Location header)
- PUT: full replace (idempotent)
- PATCH: partial update
- DELETE: remove (idempotent, returns 204)

## Response format
```json
{
  "data": {},
  "meta": { "page": 1, "total": 42 },
  "errors": [{ "code": "VALIDATION_ERROR", "field": "email", "message": "..." }]
}
```

## Status codes
- 200: success, 201: created, 204: no content
- 400: bad request, 401: unauthorized, 403: forbidden, 404: not found
- 409: conflict, 422: unprocessable entity
- 500: internal error (never expose stack traces)

## Pagination
- Cursor-based preferred for large datasets
- Offset-based acceptable for small datasets
- Always return: page, limit, total, hasMore

## Validation
- Validate at the API boundary, not deep in business logic
- Return ALL validation errors at once, not one at a time
- Use schema validation (Zod, Joi, or framework validator)
EOF
log_create "api-design/SKILL.md (universal)"

# --- testing (UNIVERSAL) ---
cat > .claude/skills/testing/SKILL.md << 'EOF'
---
name: testing
description: Testing best practices. Auto-activates when writing or modifying tests.
---

# Testing best practices

## Test pyramid
- Unit tests (70%): fast, isolated, test one function
- Integration tests (20%): test module boundaries, DB queries, API calls
- E2E tests (10%): critical user flows only

## Structure
- Arrange → Act → Assert (AAA pattern)
- One assertion per test when possible
- Descriptive names: "should return 404 when user not found"
- Group related tests in describe/context blocks

## What to test
- Happy path (normal successful flow)
- Error cases (invalid input, missing data, unauthorized)
- Edge cases (empty arrays, null values, max lengths)
- Boundary values (0, -1, MAX, empty string)
- State transitions (pending → active → completed)

## What NOT to test
- Framework internals (don't test React renders a div)
- Third-party libraries (mock them instead)
- Private implementation details (test behavior, not internals)
- Trivial getters/setters with no logic

## Mocking rules
- Mock external services (APIs, email, payment)
- Mock the database in unit tests, use real DB in integration tests
- Never mock the thing you're testing
- Reset mocks between tests

## Test data
- Use factory functions for test data (createUser, createSession)
- Avoid shared mutable test state
- Clean up after integration tests
EOF
log_create "testing/SKILL.md (universal)"

# --- security-review (UNIVERSAL) ---
cat > .claude/skills/security-review/SKILL.md << 'EOF'
---
name: security-review
description: Security review checklist. Auto-activates when the security-reviewer agent runs or when reviewing auth, payment, or access control code.
---

# Security review checklist

## OWASP Top 10 checks
1. Injection (SQL, NoSQL, OS command, LDAP)
2. Broken authentication (weak passwords, missing MFA, session fixation)
3. Sensitive data exposure (unencrypted PII, excessive logging)
4. XML external entities (if applicable)
5. Broken access control (IDOR, privilege escalation, missing checks)
6. Security misconfiguration (default creds, verbose errors, open CORS)
7. XSS (reflected, stored, DOM-based)
8. Insecure deserialization
9. Using components with known vulnerabilities
10. Insufficient logging and monitoring

## Auth-specific checks
- Passwords hashed with bcrypt/argon2 (never MD5/SHA)
- JWT: verify signature, check expiry, validate issuer
- Refresh token rotation on use
- Rate limiting on login endpoints (prevent brute force)
- Account lockout after N failed attempts
- Session invalidation on password change

## Data handling
- PII encrypted at rest and in transit
- Minimum data collection principle
- No sensitive data in URL parameters
- No secrets in client-side code or git history
- Database queries parameterized (never string concatenation)

## API security
- Authentication required on all non-public endpoints
- Authorization checked at every endpoint (not just middleware)
- Input validation with strict schemas
- Rate limiting on all endpoints
- CORS restricted to known origins
- No stack traces or internal errors exposed to clients
EOF
log_create "security-review/SKILL.md (universal)"

# --- design-system (CUSTOMIZE) ---
cat > .claude/skills/design-system/SKILL.md << 'EOF'
---
name: design-system
description: Design tokens, component patterns, and accessibility rules. Auto-activates for any frontend/UI work. CUSTOMIZE this for your project's brand and design language.
---

# Design system

## Brand colors
<!-- CUSTOMIZE: Replace all placeholder values with your project's actual design tokens -->
- Primary:          #REPLACE (main action color — buttons, links, highlights)
- Primary dark:     #REPLACE (hover/pressed state of primary)
- Accent:           #REPLACE (secondary emphasis, decorative elements)
- Background:       #REPLACE (page/app background)
- Surface:          #REPLACE (card, modal, panel background)
- Text primary:     #REPLACE (headings and body copy)
- Text secondary:   #REPLACE (captions, placeholders, helper text)
- Error:            #REPLACE (destructive actions, validation errors)
- Success:          #REPLACE (confirmation, positive states)
- Warning:          #REPLACE (caution states, non-blocking alerts)

## Typography
<!-- CUSTOMIZE: Replace with your project's typeface decisions -->
- Heading font:   [project font or system stack]
- Body font:      [project font or system stack]
- Code font:      monospace system stack
- Base size:      16px, line-height 1.6
- Minimum size:   14px (prefer 16px for body copy)

## Accessibility (WCAG AA minimum — non-negotiable)
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Touch targets: minimum 44x44px on mobile (48x48px preferred)
- All images need descriptive alt text (empty alt="" for decorative images)
- All interactive elements need visible focus indicators (not just color change)
- Form inputs need associated labels — no placeholder-as-label
- Error messages identify the field and describe the fix, not just "invalid"
- Full keyboard navigation — no mouse-only interactions
- ARIA labels on icon-only buttons and controls

## Component patterns
- Cards: rounded corners (8-12px radius), subtle border or drop shadow — not both
- Buttons: primary (filled), secondary (outlined), ghost (text only), destructive (red tint)
- Forms: label above input, inline validation on blur, all errors shown at once
- Navigation: bottom tabs for mobile (max 4 items), sidebar or top nav for desktop
- Loading: skeleton screens preferred over spinners for content areas
- Empty states: illustration or icon + short message + single clear action
- Modals: closable via Escape key and backdrop click; trap focus inside

## Responsive breakpoints
- Mobile:  < 640px  — single column, stacked layout
- Tablet:  640-1024px — flexible grid, condensed nav
- Desktop: > 1024px — max-width container, full sidebar/nav

## Spacing scale
<!-- CUSTOMIZE: Replace with your project's spacing tokens -->
Use a consistent scale (e.g., 4px base: 4, 8, 12, 16, 24, 32, 48, 64).
Avoid arbitrary spacing values — pick the nearest scale step.
EOF
log_create "design-system/SKILL.md (customize per project)"
fi

# ============================================================
# COMMANDS — Layer 6
# ============================================================
if wants_claude; then
log_step "Creating commands..."

# --- /self-review (UNIVERSAL) ---
cat > .claude/commands/self-review.md << 'EOF'
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
EOF
log_create "self-review.md (universal)"

# --- /review-pr (UNIVERSAL) ---
cat > .claude/commands/review-pr.md << 'EOF'
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
EOF
log_create "review-pr.md (universal)"

# --- /plan-feature (UNIVERSAL) ---
cat > .claude/commands/plan-feature.md << 'EOF'
---
description: Enter plan mode to decompose a feature into implementation phases with explicit rollback strategies. Creates a structured plan before any code is written.
---

Enter plan mode. Before writing any code:

## Step 1 — Understand the requirement
- Ask clarifying questions if the requirement is ambiguous
- Confirm: what does done look like? How will it be verified?
- Identify who is affected (internal service, external API consumers, end users)

## Step 2 — Audit the blast radius
- Check what imports/depends on the files you intend to touch
- Flag files imported by 5+ modules as HIGH risk — prefer additive over mutating changes
- Check /contracts/ — any API surface change needs a version consideration

## Step 3 — Build the risk matrix
For each significant change, classify risk (LOW / MEDIUM / HIGH / CRITICAL) and mitigation.
DB schema changes and auth/permissions changes are always HIGH or CRITICAL.

## Step 4 — Create a phased plan
Structure each phase with:
- Goal: what this phase achieves
- Files: list of files to create or modify
- Steps with verification commands
- Rollback: exact command or action to undo this phase if it fails
- Checkpoint: codebase must be in a working state after this phase

Rules: each phase leaves the codebase working; DB migrations get their own phase with a down migration.

## Step 5 — Present and get approval
Show the full plan — phases, risk matrix, rollback steps — and wait for explicit approval before writing any code.

## Rules
- No code before plan approval
- Every phase has a named rollback step — "revert the commit" is not a rollback plan
- Risk CRITICAL items require human sign-off before proceeding
EOF
log_create "plan-feature.md (universal)"

# --- /design-review (UNIVERSAL) ---
cat > .claude/commands/design-review.md << 'EOF'
---
description: Compare current UI implementation against approved Figma designs. Requires Figma MCP connection.
---

Compare the current implementation against the design:

1. Check if Figma MCP is connected (run /mcp to verify)
2. Read the Figma frame for the current feature
3. Compare: colors, spacing, typography, component structure
4. Check accessibility: contrast ratios, touch targets, ARIA labels
5. List discrepancies with specific file:line references
6. Suggest fixes for each discrepancy
EOF
log_create "design-review.md (universal)"

# --- /smart-pr (UNIVERSAL) ---
cat > .claude/commands/smart-pr.md << 'EOF'
---
description: Generate a structured PR description from the current branch diff. Run after /self-review passes. Produces title, summary, test plan, and risk notes ready to paste into GitHub/GitLab.
---

Generate a pull request description for the current branch:

## Step 1 — Gather diff data
```bash
git diff main...HEAD --stat
git diff main...HEAD
git log main...HEAD --oneline
```

## Step 2 — Classify changes
Group changed files into categories:
- **Features**: new capabilities added
- **Fixes**: bugs corrected
- **Refactors**: behaviour-preserving restructuring
- **Tests**: test additions or updates
- **Config / Infra**: CI, build, environment changes
- **Docs**: documentation only

## Step 3 — Extract context
- Read CLAUDE.md for project name and stack
- Read commit messages for intent and motivation
- Check if any changed files touch API contracts (/contracts/) or DB migrations

## Step 4 — Assess risks
For each changed area, flag:
- **Breaking change**: API contract modified, DB migration required, env var added
- **Side-effect risk**: shared utility touched, auth/permissions changed
- **Test coverage gap**: logic changed but no new tests

## Step 5 — Write the description

Output a PR description in this exact format:

```markdown
## What
[1–3 bullets: what changed, specific and concrete]

## Why
[1–2 sentences: the problem this solves or the goal it achieves]

## How
[Brief: the key technical decision or approach — only if non-obvious]

## Test plan
- [ ] [Specific action to verify the main scenario works]
- [ ] [Edge case or regression to check]
- [ ] Tests pass: `[test command]`

## Risks
- [Risk]: [Mitigation] — or "None" if clean
```

## Rules
- Never invent motivation — derive it from commits and code only
- If a breaking change is detected, say so explicitly in the Risks section
- Keep "What" bullets specific and concrete, not vague
- Skip the "How" section if the implementation is straightforward
- The description is ready to paste — no placeholders, no [TODO] markers
EOF
log_create "smart-pr.md (universal)"

# --- /standup (UNIVERSAL) ---
cat > .claude/commands/standup.md << 'EOF'
---
description: Generate a daily standup summary. Scans today's git activity, open TODOs, and failing checks to produce a concise status report.
---

Generate a standup summary for today:

## Step 1 — Today's git activity
```bash
git log --since="yesterday 5pm" --until="now" --oneline --all --author="$(git config user.name)"
git diff HEAD~1..HEAD --stat 2>/dev/null || true
```

If no commits today, check the last working day:
```bash
git log --since="3 days ago" --oneline -10 --author="$(git config user.name)"
```

## Step 2 — Open TODOs and in-progress markers
Search for work-in-progress signals:
```bash
git stash list
git status --short
```

Grep for inline markers in modified files:
- TODO, FIXME, HACK, WIP, XXX

## Step 3 — Test and lint health
- Detect and run the project test suite (check package.json, go.mod, Cargo.toml, pytest)
- Report: passing / failing / not run
- If failures exist, list the failing test names (not full output)

## Step 4 — Current branch context
```bash
git branch --show-current
git log main..HEAD --oneline 2>/dev/null || git log --oneline -5
```

Note if the branch is ahead of, behind, or diverged from main.

## Step 5 — Write the standup

Output in this exact format:

```
## Standup — [DATE]

**Yesterday**
- [What was completed — derived from commits]

**Today**
- [What is in progress — derived from current branch / stash / WIP markers]

**Blockers**
- [Failing tests / lint errors / open questions] — or "None"

**Branch**: [branch-name] — [N commits ahead of main | up to date]
**Tests**: [passing | N failing | not run]
```

## Rules
- Derive everything from actual git data — never invent activity
- If no commits exist yet today, say "No commits yet today" under Yesterday
- Keep bullets concrete: "Implemented self-review loop in api-engineer agent" not "Did some work"
- Blockers section is honest — list real failures, don't omit them
- Output is ready to paste into Slack/Teams/Notion with no edits needed
EOF
log_create "standup.md (universal)"

# --- /debug (UNIVERSAL) ---
cat > .claude/commands/debug.md << 'EOF'
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
- Run the previously-failing test — must pass
- Run the full test suite — no new failures introduced
- Run lint — clean

If any test that was passing now fails: your fix has a side effect. Go back to Step 4.

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
EOF
log_create "debug.md (universal)"

# --- /check-contracts (UNIVERSAL) ---
cat > .claude/commands/check-contracts.md << 'EOF'
---
description: Verify API contracts in /contracts/ match actual implementations. Detects drift between spec and code before it reaches production. Run before merging any API-touching branch.
---

Audit contract files against the current implementation:

## Step 1 — Discover contracts
```bash
find contracts/ -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) 2>/dev/null
```

If no /contracts/ directory exists → report as a gap and stop.

## Step 2 — Identify changed API surface
```bash
git diff main...HEAD --name-only | grep -E "(route|handler|controller|endpoint|api|view)"
```

For each changed file, extract the endpoints it defines.

## Step 3 — Cross-check each contract

For every contract file, verify:
- Every path in the contract exists in the implementation (flag DEAD SPEC if not)
- Every path in the implementation is documented (flag UNDOCUMENTED if not)
- Request/response field names and types match
- Status codes match (success AND error codes)

## Step 4 — Check version consistency
If a breaking change is detected (field removed, type changed, required field added):
- Contract version must be bumped
- Flag as BREAKING — VERSION BUMP REQUIRED

## Step 5 — Report

Output in this format:

```
## Contract Audit — [date]

### [contract-file.yaml]
✅ Endpoints: all matched
⚠️  UNDOCUMENTED: POST /api/v1/users/bulk (in code, not in spec)
❌ DEAD SPEC: DELETE /api/v1/sessions/{id} (in spec, not in code)
❌ SCHEMA DRIFT: GET /api/v1/users response missing created_at field
❌ BREAKING — VERSION BUMP REQUIRED: email changed from optional to required

### Summary
- [N] contracts audited
- [N] drift issues found
- [N] breaking changes requiring version bump
```

## Rules
- UNDOCUMENTED endpoints are a gap — they cannot be tested or consumed reliably
- DEAD SPEC entries should be removed immediately
- Never merge a breaking change without a version bump in the contract file
- If no contracts directory exists, recommend creating one as a gap item
EOF
log_create "check-contracts.md (universal)"

# --- /adr (UNIVERSAL) ---
cat > .claude/commands/adr.md << 'EOF'
---
description: Record an Architecture Decision. Captures the context, options considered, decision made, and consequences in docs/decisions/. Prevents re-litigating settled choices in future sessions.
---

Create an Architecture Decision Record (ADR) for a significant technical decision:

## Step 1 — Gather context
- What problem or question triggered this decision?
- What constraints apply (time, budget, team skills, existing stack, compliance)?
- What is the current state — what exists today?

## Step 2 — List options considered
For each option (aim for 2-4):
- What is it?
- Pros, cons, and why it was or wasn't chosen

## Step 3 — State the decision clearly
One unambiguous sentence: "We will use X for Y because Z."

## Step 4 — Document consequences
- What becomes easier? What becomes harder?
- What follow-up decisions does this create?
- What is the trigger to revisit (e.g., "if throughput exceeds 10k req/s")?

## Step 5 — Write the ADR file

Determine the next ADR number:
```bash
ls docs/decisions/ 2>/dev/null | grep "^[0-9]" | sort -n | tail -1
```

Create docs/decisions/NNNN-<slug>.md:

```markdown
# NNNN — [Title]

**Date:** YYYY-MM-DD
**Status:** Accepted
**Deciders:** [who was involved]

## Context
[The problem and constraints that forced a decision]

## Options considered

### Option A: [name]
- **Pros:** ...
- **Cons:** ...

### Option B: [name]
- **Pros:** ...
- **Cons:** ...

## Decision
[One clear sentence: "We will use X for Y because Z."]

## Consequences
- **Easier:** ...
- **Harder:** ...
- **Follow-up decisions:** ...
- **Revisit when:** ...
```

## Step 6 — Commit
```bash
mkdir -p docs/decisions
git add docs/decisions/NNNN-<slug>.md
git commit -m "docs: add ADR NNNN — [title]"
```

## Rules
- Status lifecycle: Proposed → Accepted → Superseded by NNNN (never delete old ADRs)
- When a decision is reversed, create a NEW ADR and update the old one's status
- One decision per ADR — two choices means two ADRs
- Write for someone with zero context on this codebase
EOF
log_create "adr.md (universal)"

# --- /onboard (UNIVERSAL) ---
cat > .claude/commands/onboard.md << 'EOF'
---
description: Orient a new developer or fresh agent session to this codebase. Scans project constitution, architecture decisions, recent activity, and health checks to produce a structured orientation summary.
---

Produce an orientation summary for this codebase. Read in this order — flag anything missing or broken.

## Step 1 — Project identity
Read CLAUDE.md (or README.md if absent):
- What does this project do?
- What is the tech stack?
- What are the build, test, lint, and run commands?
- What guardrails are in place?

## Step 2 — Architecture decisions
```bash
ls docs/decisions/ 2>/dev/null | sort -n | tail -10
```
Read the 3 most recent ADRs. Summarise the key standing decisions.
If no docs/decisions/ exists → note as a gap.

## Step 3 — Codebase layout
```bash
find . -maxdepth 3 -type d \
  ! -path "*/node_modules/*" ! -path "*/.git/*" \
  ! -path "*/dist/*" ! -path "*/__pycache__/*" \
  ! -path "*/.worktrees/*"
```
Identify: entry points, domain modules, test directories, config files.

## Step 4 — Recent activity
```bash
git log --oneline -15
git branch -a | grep -v HEAD | head -10
```

## Step 5 — Current health
Run the test suite and linter. Report: passing / failing / not configured.
```bash
git status --short
git stash list
```

## Step 6 — Contracts and integrations
```bash
ls contracts/ 2>/dev/null
cat .mcp.json 2>/dev/null || true
```

## Step 7 — Write the orientation summary

```
## Codebase Orientation — [project name]

### What it does
[1-2 sentences]

### Stack
[Language, framework, DB, infra — one line each]

### Key commands
- Build:  [command]
- Test:   [command]
- Lint:   [command]
- Run:    [command]

### Architecture (from ADRs)
- [Key decision 1]
- [Key decision 2]

### Recent activity
- [Last 3-5 meaningful commits summarised]
- Active branches: [list]

### Health
- Tests: [passing N | failing N | not configured]
- Lint:  [clean | N errors | not configured]
- Uncommitted changes: [yes/no — details]

### Gaps to be aware of
- [Missing ADRs / missing tests / missing contracts / etc.]
```

## Rules
- Read actual files — do not guess or invent project details
- Flag every gap (no tests, no ADRs, no contracts) — don't silently skip them
- If tests fail during onboarding, list the failures — this is important context
- Keep the summary scannable: bullets over paragraphs, facts over adjectives
EOF
log_create "onboard.md (universal)"
fi

# ============================================================
# HOOKS — Layer 6
# ============================================================
if wants_claude; then
log_step "Creating hooks..."

cat > .claude/hooks/pre-commit.sh << 'HOOKEOF'
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
HOOKEOF
chmod +x .claude/hooks/pre-commit.sh
log_create "pre-commit.sh (universal, auto-detects stack)"

cat > .claude/hooks/post-edit.sh << 'HOOKEOF'
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
HOOKEOF
chmod +x .claude/hooks/post-edit.sh
log_create "post-edit.sh (universal, auto-detects language)"
fi

# ============================================================
# SETTINGS — Layer 6
# ============================================================
if wants_claude; then
log_step "Creating settings..."

cat > .claude/settings.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Read",
      "Grep",
      "Glob",
      "LS",
      "Agent"
    ],
    "deny": []
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(git commit*)",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/pre-commit.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/post-edit.sh \"$TOOL_INPUT_path\""
          }
        ]
      }
    ]
  }
}
EOF
log_create "settings.json"

# Gitignored personal overrides
cat > .claude/settings.local.json << 'EOF'
{
  "_comment": "Personal overrides — this file is git-ignored",
  "model": "claude-sonnet-4-6"
}
EOF
log_create "settings.local.json (git-ignored)"
fi

# ============================================================
# .mcp.json — Layer 7
# ============================================================
log_step "Creating .mcp.json template..."

cat > .mcp.json << 'EOF'
{
  "_comment": "MCP servers — customize URLs and credentials",
  "mcpServers": {
    "github": {
      "_comment": "GitHub MCP — PRs, issues, actions",
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "context7": {
      "_comment": "Live docs lookup — Next.js, React, any framework",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
EOF
log_create ".mcp.json (add more servers as needed)"

# ============================================================
# contracts/ — Layer 3
# ============================================================
log_step "Creating contracts directory..."

cat > contracts/README.md << 'EOF'
# API Contracts

Place your API specifications here:
- OpenAPI/Swagger specs (.yaml/.json)
- Event schemas (for async communication)
- Protobuf definitions (.proto)
- GraphQL schemas (.graphql)

Agents reference these contracts when building or modifying APIs.
Any contract change must update ALL consumers before merging.
EOF
log_create "contracts/README.md"

# ============================================================
# docs/decisions/ — ADR scaffold
# ============================================================
log_step "Creating docs/decisions directory..."

mkdir -p docs/decisions

cat > docs/decisions/README.md << 'EOF'
# Architecture Decision Records

Significant technical decisions live here as numbered markdown files.

- Filename pattern: `NNNN-<kebab-case-title>.md` (e.g. `0001-use-postgres.md`)
- Use the `/adr` slash command to create a new one
- See `000-template.md` for the template structure
- Status lifecycle: Proposed → Accepted → Superseded

Never delete an ADR. When a decision is reversed, create a new ADR and update the old one's status to "Superseded by NNNN".
EOF
log_create "docs/decisions/README.md"

cat > docs/decisions/000-template.md << 'EOF'
# NNNN — [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed
**Deciders:** [who was involved]

## Context

[The problem and the constraints that forced a decision]

## Options considered

### Option A: [name]
- **Pros:** ...
- **Cons:** ...

### Option B: [name]
- **Pros:** ...
- **Cons:** ...

## Decision

[One clear sentence: "We will use X for Y because Z."]

## Consequences

- **Easier:** ...
- **Harder:** ...
- **Follow-up decisions:** ...
- **Revisit when:** ...
EOF
log_create "docs/decisions/000-template.md"

# ============================================================
# .gitignore additions
# ============================================================
log_step "Adding framework entries to .gitignore..."

if [ -f ".gitignore" ]; then
  if ! grep -q "settings.local.json" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Claude Code personal settings" >> .gitignore
    echo ".claude/settings.local.json" >> .gitignore
  fi
else
  cat > .gitignore << 'EOF'
# Claude Code personal settings
.claude/settings.local.json
EOF
fi
log_create ".gitignore updated"

# ============================================================
# COPILOT CLI — .github/copilot-instructions.md
# ============================================================
if wants_copilot; then
  log_step "Creating Copilot CLI artifacts..."

  mkdir -p .github/instructions

  cat > .github/copilot-instructions.md << 'COPILOTMD'
# Copilot Instructions

> This file provides project-level guidance for GitHub Copilot CLI.
> Copilot also reads CLAUDE.md — this file adds Copilot-specific context.

## Project context
See `CLAUDE.md` for full project identity, tech stack, and conventions.

## Agent definitions
Agent roles and responsibilities are defined in `AGENTS.md` at the repository root.

## Skill instructions
Detailed skill instructions are in `.github/instructions/*.instructions.md`.
These cover: coding standards, API design, testing, security review, and design system.

## Copilot-specific workflow
- Use `/plan` to enter plan mode before complex tasks
- Use `/review` to run code review on changes
- Use `/research` for deep investigation tasks
- Use `/diff` to review changes before committing
- Use `/compact` when context gets long

## Verification protocol
Before committing:
1. Run the project test suite
2. Run the project linter
3. Check for security issues in changed files
4. Verify no secrets or credentials in the diff
COPILOTMD
  log_create ".github/copilot-instructions.md"

# ============================================================
# COPILOT CLI — AGENTS.md
# ============================================================
  cat > AGENTS.md << 'AGENTSMD'
# Agents

Agent definitions for this project. Each agent has a specific role, workflow, and set of rules.

## Architect

**Role:** Senior architect. Decomposes complex requirements into tasks, designs system structure, delegates to specialized agents.

**Workflow:**
1. DECOMPOSE complex requirements into clear, independent tasks
2. IMPACT ANALYSIS — before touching any file, map what depends on it
3. DESIGN system structure following project patterns
4. DELEGATE implementation to specialized agents
5. VERIFY all pieces integrate correctly

**Rules:**
- Never skip planning for non-trivial work
- Verify existing patterns before proposing new ones
- Prefer boring, proven solutions over clever ones
- Every phase must leave the codebase working

---

## API Engineer

**Role:** Implements API endpoints, service logic, and data access.

**Workflow:**
1. READ existing codebase — find 2-3 similar implementations first
2. FOLLOW existing patterns, do not invent new ones
3. IMPLEMENT with proper error handling and input validation
4. WRITE or update tests for your changes
5. Run test suite and linter until clean

**Rules:**
- Never put business logic in controllers/handlers
- All DB queries through repository layer
- Structured error responses with error codes
- No hardcoded configuration values

---

## Frontend Engineer

**Role:** Implements UI components and pages. Follows design system.

**Workflow:**
1. Read the design system instructions for brand, tokens, accessibility rules
2. Implement components that match approved designs
3. Ensure accessibility: ARIA labels, keyboard nav, contrast ratios
4. Write component tests
5. Verify responsive behavior at mobile/tablet/desktop widths

**Rules:**
- Design system overrides your defaults — follow it exactly
- Minimum touch target: 48x48px for mobile
- All interactive elements need visible focus indicators
- Images need alt text, icons need aria-labels

---

## Test Engineer

**Role:** Writes comprehensive tests, identifies edge cases, validates coverage.

**Workflow:**
1. Read the implementation and understand all code paths
2. Identify: happy path, error cases, edge cases, boundaries
3. Write tests covering each path
4. Run tests and verify they pass

**Rules:**
- Tests must be deterministic — no flaky tests
- Mock external services, never call real APIs in tests
- Test error messages, not just error codes
- Each test independent — no shared mutable state

---

## Security Reviewer

**Role:** Read-only security auditor. Reviews code for vulnerabilities without modifying files.

**What to check:**
1. INJECTION: SQL, XSS, command injection, path traversal
2. AUTHENTICATION: bypass risks, session handling, JWT validation
3. AUTHORIZATION: privilege escalation, missing access checks
4. SECRETS: hardcoded keys, tokens, passwords, connection strings
5. DATA: unencrypted sensitive data, excessive logging of PII

**Rules:**
- NEVER modify files — read-only audit
- Flag ALL findings, even if uncertain
- Check OWASP Top 10 against every endpoint

---

## DevOps Engineer

**Role:** Handles infrastructure, deployment, CI/CD, and monitoring.

**Workflow:**
1. Read existing infra configs before adding new ones
2. Follow the project's deployment patterns
3. Implement infrastructure-as-code; all changes must be reversible
4. Validate configs before committing

**Rules:**
- Every infra change must be reversible — document the rollback
- No manual prod changes — everything through IaC or CI/CD
- Secrets in env vars or secret managers, never in code
AGENTSMD
  log_create "AGENTS.md"

# ============================================================
# COPILOT CLI — .github/instructions/*.instructions.md
# ============================================================
  cat > .github/instructions/coding-standards.instructions.md << 'EOF'
# Coding Standards

Universal clean code principles. Auto-activates during any code implementation task.

## Naming
- Variables/functions: descriptive, verb-based for actions (getUserById, calculateTotal)
- Booleans: prefix with is/has/can/should (isActive, hasPermission)
- Constants: UPPER_SNAKE_CASE
- Files: follow project's existing convention (check 3 files first)

## Functions
- Single responsibility — one function, one job
- Under 50 lines when possible (extract helper functions)
- Maximum 3-4 parameters; use an options object for more
- Return early for guard clauses — avoid deep nesting
- Pure functions preferred — minimize side effects

## Error handling
- Fail fast: validate inputs at the boundary
- Return explicit errors, never swallow silently
- Use typed/custom errors with error codes
- Log errors with context (what failed, why, what input)
- Never catch-all without re-throwing or logging

## Code organization
- Group by feature/domain, not by type
- Keep related code close together
- Extract shared logic only after 3+ duplications
- Delete dead code — don't comment it out

## Comments
- Comments explain WHY, not WHAT
- TODO comments include context and author
- API docs on public interfaces
- No commented-out code blocks
EOF
  log_create "coding-standards.instructions.md"

  cat > .github/instructions/api-design.instructions.md << 'EOF'
# API Design

REST API design patterns. Auto-activates when building API endpoints, routes, or controllers.

## URL conventions
- Plural nouns for resources: /users, /orders, /products
- Nested for relationships: /users/:id/orders
- kebab-case for multi-word: /order-items
- Version prefix: /api/v1/...

## HTTP methods
- GET: read (never mutate state)
- POST: create new resource
- PUT: full replace
- PATCH: partial update
- DELETE: remove resource

## Response format
- Consistent envelope: { data, error, meta }
- Pagination: { data: [...], meta: { page, perPage, total, totalPages } }
- Errors: { error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }

## Status codes
- 200: success
- 201: created
- 204: no content (successful delete)
- 400: validation error
- 401: not authenticated
- 403: not authorized
- 404: not found
- 409: conflict
- 422: unprocessable entity
- 500: internal server error

## Input validation
- Validate at the boundary (controller/handler level)
- Use schema validation (Zod, Joi, JSON Schema)
- Return all validation errors at once, not one at a time
- Sanitize strings: trim whitespace, escape HTML
EOF
  log_create "api-design.instructions.md"

  cat > .github/instructions/testing.instructions.md << 'EOF'
# Testing

Testing best practices. Auto-activates when writing or modifying tests.

## Test structure
- Follow project's existing test conventions (check 2-3 test files)
- One test file per source file
- Group tests by behavior, not by method
- Names describe scenarios: "should return 404 when user not found"

## Coverage priorities
1. Business logic and domain rules (highest value)
2. API endpoints — request/response contract
3. Error handling paths
4. Edge cases and boundaries
5. Integration points between modules

## Edge cases to ALWAYS consider
- Empty/null/undefined inputs
- Boundary values (0, -1, MAX_INT, empty string)
- Concurrent access (if applicable)
- Network failures and timeouts
- Permission/authorization edge cases
- Malformed input data

## Rules
- Tests must be deterministic — no flaky tests
- Mock external services, never call real APIs in tests
- Each test independent — no shared mutable state
- Test error messages, not just error codes
- Integration tests for cross-module flows
EOF
  log_create "testing.instructions.md"

  cat > .github/instructions/security-review.instructions.md << 'EOF'
# Security Review

Security review checklist. Auto-activates when reviewing auth, payment, or access control code.

## Checklist
1. INJECTION: SQL, XSS, command injection, path traversal
2. AUTHENTICATION: bypass risks, session handling, JWT validation
3. AUTHORIZATION: privilege escalation, missing access checks
4. SECRETS: hardcoded keys, tokens, passwords, connection strings
5. DATA: unencrypted sensitive data, excessive logging of PII
6. DEPENDENCIES: known vulnerable packages
7. INPUT: missing validation, type coercion issues

## Finding format
For each finding:
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW
- **Location**: file:line
- **Issue**: what's wrong
- **Fix**: specific remediation

## Rules
- Flag ALL findings, even if uncertain
- Check OWASP Top 10 against every endpoint
- Verify role-based access on every protected route
- Check for rate limiting on auth endpoints
EOF
  log_create "security-review.instructions.md"

  cat > .github/instructions/design-system.instructions.md << 'EOF'
# Design System

Design tokens, component patterns, and accessibility rules. Auto-activates for any frontend/UI work.

## Colors
- Primary: #REPLACE_PRIMARY
- Secondary: #REPLACE_SECONDARY
- Accent: #REPLACE_ACCENT
- Error: #DC2626
- Warning: #F59E0B
- Success: #16A34A
- Background: #FFFFFF
- Surface: #F9FAFB
- Text primary: #111827
- Text secondary: #6B7280

## Typography
- Font family: Inter, system-ui, sans-serif
- Base size: 16px
- Scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 / 48

## Spacing
- Base unit: 4px
- Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64

## Accessibility
- Minimum contrast ratio: 4.5:1 (text), 3:1 (large text)
- Focus indicators: visible ring on all interactive elements
- Touch targets: minimum 48x48px
- All images need alt text
- ARIA labels on icon-only buttons
- Keyboard navigable: all interactive elements reachable via Tab
- Support prefers-reduced-motion
EOF
  log_create "design-system.instructions.md"
fi

# ============================================================
# Install recommended plugins (if Claude Code available)
# ============================================================
if wants_claude; then
  if command -v claude &> /dev/null; then
    log_step "Claude Code detected — installing recommended plugins..."
    echo ""
    log_info "Run these commands to install plugins:"
    echo ""
    echo -e "  ${CYAN}/plugin install comprehensive-review${NC}"
    echo -e "  ${CYAN}/plugin install security-scanning${NC}"
    echo ""
  else
    log_warn "Claude Code CLI not detected — skip plugin install"
    log_info "Install plugins manually after setting up Claude Code"
  fi
fi

if wants_copilot; then
  if command -v copilot &> /dev/null; then
    log_step "Copilot CLI detected"
    log_info "Run 'copilot' in this directory to start using the framework"
  else
    log_warn "Copilot CLI not detected — install: npm install -g @github/copilot"
  fi
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ${BOLD}Framework installed successfully!${NC}${GREEN}                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Target: ${TARGET}${NC}"
echo ""
echo -e "  ${BOLD}Files created:${NC}"
echo -e "  ├── CLAUDE.md              ${YELLOW}← customize this first${NC}"

if wants_claude; then
  echo -e "  ├── .claudeignore"
  echo -e "  ├── .mcp.json              ${YELLOW}← add your MCP servers${NC}"
  echo -e "  ├── .claude/"
  echo -e "  │   ├── agents/            (6 agents: 3 universal + 3 customizable)"
  echo -e "  │   ├── skills/            (5 skills: 4 universal + 1 customize-per-brand)"
  echo -e "  │   ├── commands/          (10 universal commands)"
  echo -e "  │   ├── hooks/             (2 universal hooks)"
  echo -e "  │   └── settings.json"
fi

if wants_copilot; then
  echo -e "  ├── AGENTS.md              ${YELLOW}← agent definitions for Copilot CLI${NC}"
  echo -e "  ├── .github/"
  echo -e "  │   ├── copilot-instructions.md"
  echo -e "  │   └── instructions/      (5 instruction files)"
fi

echo -e "  ├── .mcp.json              ${YELLOW}← add your MCP servers (shared)${NC}"
echo -e "  └── contracts/"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  ${CYAN}1.${NC} Edit CLAUDE.md — fill in your project details"

if wants_claude; then
  echo -e "  ${CYAN}2.${NC} Edit .claude/skills/design-system/SKILL.md — your brand"
  echo -e "  ${CYAN}3.${NC} Add domain skills: .claude/skills/[your-domain]/SKILL.md"
fi

if wants_copilot; then
  echo -e "  ${CYAN}2.${NC} Edit .github/instructions/design-system.instructions.md — your brand"
  echo -e "  ${CYAN}3.${NC} Add instructions: .github/instructions/[domain].instructions.md"
fi

echo -e "  ${CYAN}4.${NC} Add MCP servers to .mcp.json (PostgreSQL, Figma, etc.)"

if wants_claude; then
  echo -e "  ${CYAN}5.${NC} Start Claude Code and type: ${BOLD}/plan-feature${NC}"
fi

if wants_copilot; then
  echo -e "  ${CYAN}5.${NC} Start Copilot CLI and type: ${BOLD}/plan${NC}"
fi

echo ""
