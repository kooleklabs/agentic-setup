# CLAUDE.md — Project Constitution
# Framework: Universal Agentic Development Framework v1.0.0

## 1. Project identity
- **Name**: [PROJECT_NAME]
- **Tech stack**: [e.g., Next.js + Node.js + PostgreSQL]
- **Architecture**: [Monolith | Microservices | Modular monolith]
- **Repository layout**: [Describe your folder structure]

## 2. Build and test commands
```
# Build
[YOUR_BUILD_COMMAND]

# Test (run before every commit)
[YOUR_TEST_COMMAND]

# Lint
[YOUR_LINT_COMMAND]

# Run locally
[YOUR_RUN_COMMAND]
```

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
