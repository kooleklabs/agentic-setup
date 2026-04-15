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
RED='\033[0;31m'
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
# Interactive mode: gather project info
# ============================================================
PROJECT_NAME=""
TECH_STACK=""
BUILD_CMD=""
TEST_CMD=""
LINT_CMD=""
RUN_CMD=""

if [[ "${1:-}" == "--interactive" ]]; then
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

# ============================================================
# Create directory structure
# ============================================================
log_step "Creating directory structure..."

mkdir -p .claude/agents
mkdir -p .claude/skills/coding-standards
mkdir -p .claude/skills/api-design
mkdir -p .claude/skills/testing
mkdir -p .claude/skills/security-review
mkdir -p .claude/skills/design-system
mkdir -p .claude/commands
mkdir -p .claude/hooks
mkdir -p contracts

log_create ".claude/agents/"
log_create ".claude/skills/ (5 universal skills)"
log_create ".claude/commands/"
log_create ".claude/hooks/"
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

# ============================================================
# AGENTS — Layer 4
# ============================================================
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

1. READ existing infra configs before adding new ones
2. FOLLOW the project's deployment patterns
3. IMPLEMENT infrastructure-as-code (Dockerfiles, manifests, CI configs)
4. VERIFY all configs are valid before committing
5. TEST deployment in staging before production

## Rules
- Never hardcode secrets — use environment variables or secret managers
- Dockerfiles: multi-stage builds, non-root user, minimal base image
- CI/CD: fail fast, cache dependencies, run tests before deploy
- All infrastructure changes must be reversible
- Monitor: health checks, logging, alerting on all services
- Document deployment steps in README or DEPLOY.md
EOF
log_create "devops-engineer.md (customize per infra)"

# ============================================================
# SKILLS — Layer 5
# ============================================================
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
- Nouns for resources: /users, /sessions, /quizzes
- Plural form: /users not /user
- Nested for ownership: /users/:id/sessions
- Query params for filtering: /sessions?status=completed&level=tajweed
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
<!-- [CUSTOMIZE] Replace with your project colors -->
- Primary: #0F6E56 (teal — trust)
- Accent: #BA7517 (gold — warmth)
- Background: #FFFFFF
- Surface: #F8F9FA
- Text primary: #2C2C2A
- Text secondary: #5F5E5A
- Error: #E24B4A
- Success: #639922

## Typography
<!-- [CUSTOMIZE] Replace with your fonts -->
- Headings: System font stack or project-specific
- Body: 16px base, line-height 1.6
- Code: monospace stack
- Minimum body size: 14px (16px preferred)

## Accessibility (WCAG AA minimum)
- Color contrast ratio: 4.5:1 for text, 3:1 for large text
- Touch targets: minimum 44x44px (48x48px preferred)
- All images need alt text
- All interactive elements need visible focus indicators
- Form inputs need associated labels
- Error messages identify the field and describe the fix
- Support keyboard navigation throughout
- ARIA labels on icon-only buttons

## Component patterns
- Cards: rounded corners (8-12px), subtle border or shadow
- Buttons: primary (filled), secondary (outlined), ghost (text only)
- Forms: labels above inputs, inline validation, error states
- Navigation: bottom tabs for mobile (4 max), sidebar for desktop
- Loading: skeleton screens preferred over spinners
- Empty states: illustration + message + action

## Responsive breakpoints
- Mobile: < 640px (single column)
- Tablet: 640-1024px (flexible grid)
- Desktop: > 1024px (max-width container)
EOF
log_create "design-system/SKILL.md (customize per project)"

# ============================================================
# COMMANDS — Layer 6
# ============================================================
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
description: Enter plan mode to decompose a feature into implementation phases. Creates a structured plan before any code is written.
---

Enter plan mode. Before writing any code:

1. Understand the requirement — ask clarifying questions if ambiguous
2. Check existing codebase for similar patterns (find 2-3 examples)
3. Create a phased plan:
   - Phase 1: [what] → [files to create/modify] → [how to verify]
   - Phase 2: [what] → [files] → [verify]
   - Each phase leaves the codebase in a working state
4. Identify risks and edge cases
5. Present the plan and wait for approval before implementing
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

# ============================================================
# HOOKS — Layer 6
# ============================================================
log_step "Creating hooks..."

cat > .claude/hooks/pre-commit.sh << 'HOOKEOF'
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

# ============================================================
# SETTINGS — Layer 6
# ============================================================
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
        "command": ".claude/hooks/pre-commit.sh"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": ".claude/hooks/post-edit.sh \"$TOOL_INPUT_path\""
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
  "model": {
    "default": "sonnet",
    "planning": "opus"
  }
}
EOF
log_create "settings.local.json (git-ignored)"

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
# Install recommended plugins (if Claude Code available)
# ============================================================
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

# ============================================================
# Summary
# ============================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ${BOLD}Framework installed successfully!${NC}${GREEN}                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BOLD}Files created:${NC}"
echo -e "  ├── CLAUDE.md              ${YELLOW}← customize this first${NC}"
echo -e "  ├── .claudeignore"
echo -e "  ├── .mcp.json              ${YELLOW}← add your MCP servers${NC}"
echo -e "  ├── .claude/"
echo -e "  │   ├── agents/            (6 agents: 3 universal + 3 customizable)"
echo -e "  │   ├── skills/            (5 skills: 4 universal + 1 customizable)"
echo -e "  │   ├── commands/          (6 universal commands)"
echo -e "  │   ├── hooks/             (2 universal hooks)"
echo -e "  │   └── settings.json"
echo -e "  └── contracts/"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  ${CYAN}1.${NC} Edit CLAUDE.md — fill in your project details"
echo -e "  ${CYAN}2.${NC} Edit .claude/skills/design-system/SKILL.md — your brand"
echo -e "  ${CYAN}3.${NC} Add domain skills: .claude/skills/[your-domain]/SKILL.md"
echo -e "  ${CYAN}4.${NC} Add MCP servers to .mcp.json (PostgreSQL, Figma, etc.)"
echo -e "  ${CYAN}5.${NC} Start Claude Code and type: ${BOLD}/plan-feature${NC}"
echo ""
echo -e "  ${PURPLE}Total setup time: ~50 minutes to customize for any project${NC}"
echo ""
