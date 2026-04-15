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
