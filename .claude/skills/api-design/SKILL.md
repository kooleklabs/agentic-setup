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
