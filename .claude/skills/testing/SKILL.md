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
