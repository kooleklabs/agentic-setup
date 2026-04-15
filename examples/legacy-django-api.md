# Example: Legacy Django REST API Migration

This example shows how to use `migrate.sh` on an existing codebase.
Pass this file as context when testing the migration flow manually.

```bash
bash migrate.sh --standard --dir /path/to/your/django-api
# OR for non-CLI users: copy MIGRATE_TEMPLATE.md and paste the scenario below
```

---

## The Existing Codebase

A 3-year-old Django REST Framework API. Works in production but is painful to extend.

**What it does:**
- User authentication (JWT-based, custom implementation)
- Product catalog with search (raw SQL queries, no ORM abstraction)
- Order management (state machine in views, not services)
- Payment integration (Stripe, hardcoded API key in settings.py for staging)
- Background jobs (Celery tasks mixed with business logic)

**Tech stack:**
- Python 3.9 / Django 3.2 / Django REST Framework 3.13
- PostgreSQL 13
- Celery + Redis
- Deployed on a single EC2 instance with supervisord
- No CI/CD (manual `git pull && restart` deploys)

**The pain points:**
- Business logic is split between `views.py` and `models.py` (no service layer)
- 3 different error response formats across different parts of the codebase
- `settings.py` has a hardcoded Stripe test key (known issue, "will fix later")
- No tests (90% coverage was aspirational, current coverage is ~0%)
- One 800-line `views.py` file handles auth, products, and orders
- Raw SQL in 12 different places instead of ORM

**What we want:**
- Adopt the agentic framework so Claude can reliably work on this codebase
- Know what to fix first (the hardcoded key is the obvious CRITICAL gap)
- A phased plan that doesn't require a big-bang rewrite

**What we can't change (constraints):**
- Must stay on Django for the next 12 months (team expertise)
- PostgreSQL stays (data residency requirement)
- The Celery task signatures can't change (3 external systems depend on them)

---

## Expected Migration Output

Running `migrate.sh --standard` on this codebase should produce:

**CODEBASE_ANALYSIS.md** detecting:
- Stack: Python 3.9, Django 3.2, DRF, PostgreSQL, Celery, Redis
- Commands: `python manage.py runserver`, `celery worker`, no Makefile detected
- Pattern: business logic in views (consistent — CONVENTION)
- Pattern: mixed error formats (inconsistent — actual gap)
- Pattern: raw SQL queries (consistent — CONVENTION, document as accepted)
- Deliberate deviations: 2 (business logic in views, raw SQL)
- Domains: auth, products, orders, payments, background-jobs

**CLAUDE.md** with:
- Stack accurately filled in (no placeholders)
- Build/run commands: actual django commands
- Guardrail: "Error responses: inconsistent format — see MIGRATION_PLAN.md Phase 1"
- Deliberate deviations section: business logic in views + raw SQL accepted

**MIGRATION_PLAN.md** with:
- CRITICAL: hardcoded Stripe key in settings.py → move to env var immediately
- HIGH: no tests → add pytest-django + first tests for auth endpoints
- HIGH: 3 error response formats → standardize to DRF default in Phase 1
- MEDIUM: 800-line views.py → extract service layer in Phase 2
- LOW: raw SQL → document patterns, migrate opportunistically
- Deliberate: business logic in views (team convention, Phase 2 target)
- Phase 1 quick wins: env var for key, CI pipeline, error format standardization
- Phase 2: service layer extraction (use /plan-feature for each endpoint group)
- Phase 3: test coverage ramp-up, observability
