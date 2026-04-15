---
description: Verify API contracts in /contracts/ match actual implementations. Detects drift between spec and code before it reaches production. Run before merging any API-touching branch.
---

Audit contract files against the current implementation:

## Step 1 — Discover contracts
```bash
find contracts/ -type f \( -name "*.yaml" -o -name "*.yml" -o -name "*.json" \) 2>/dev/null
ls contracts/ 2>/dev/null || echo "No /contracts/ directory found"
```

If no `/contracts/` directory exists → report as a gap and stop.

## Step 2 — Identify changed API surface
```bash
# Which API-touching files changed in this branch?
git diff main...HEAD --name-only | grep -E "(route|handler|controller|endpoint|api|view)"
```

For each changed file, extract the endpoints it defines (look for HTTP method + path patterns).

## Step 3 — Cross-check each contract

For every contract file, verify:

### Endpoint existence
- Every path in the contract exists in the implementation
- Every path in the implementation is documented in the contract
- Flag missing-from-contract as **UNDOCUMENTED**
- Flag missing-from-implementation as **DEAD SPEC**

### Schema alignment
- Request body fields: required fields present, types match
- Response body fields: documented fields returned, no extra undocumented fields
- Path parameters: match between contract and route definition
- Query parameters: documented params match implementation

### Status codes
- Success codes match (200 vs 201 vs 204)
- Error codes documented (400, 401, 403, 404, 422, 500)
- Implementation returns all documented error codes

## Step 4 — Check version consistency
```bash
# Look for version markers in contract files
grep -r "version:" contracts/ 2>/dev/null
```

If a breaking change is detected (field removed, type changed, required field added):
- Contract version must be bumped
- Flag as **BREAKING — VERSION BUMP REQUIRED**

## Step 5 — Report

Output in this format:

```
## Contract Audit — [date]

### [contract-file.yaml]
✅ Endpoints: all matched
⚠️  UNDOCUMENTED: POST /api/v1/users/bulk (in code, not in spec)
❌ DEAD SPEC: DELETE /api/v1/sessions/{id} (in spec, not in code)
❌ SCHEMA DRIFT: GET /api/v1/users response missing `created_at` field
❌ BREAKING — VERSION BUMP REQUIRED: `email` changed from optional to required

### Summary
- [N] contracts audited
- [N] clean
- [N] drift issues found
- [N] breaking changes requiring version bump
```

## Rules
- UNDOCUMENTED endpoints are a gap, not just noise — they cannot be tested or consumed reliably
- DEAD SPEC entries should be removed from contracts immediately (they mislead consumers)
- Never merge a breaking change without a version bump in the contract file
- If no contracts directory exists, recommend creating one as a gap item
