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
- What are the pros?
- What are the cons?
- Why was it not chosen (or why was it chosen)?

## Step 3 — State the decision clearly
One unambiguous sentence: "We will use X for Y because Z."

## Step 4 — Document consequences
- What becomes easier because of this decision?
- What becomes harder?
- What follow-up decisions does this create?
- What is the trigger to revisit this decision (e.g., "if throughput exceeds 10k req/s")?

## Step 5 — Write the ADR file

Determine the next ADR number:
```bash
ls docs/decisions/ 2>/dev/null | grep "^[0-9]" | sort -n | tail -1
```

Create `docs/decisions/NNNN-<slug>.md` with this format:

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

## Step 6 — Create the directory and commit
```bash
mkdir -p docs/decisions
# write the file, then:
git add docs/decisions/NNNN-<slug>.md
git commit -m "docs: add ADR NNNN — [title]"
```

## Rules
- ADR status lifecycle: `Proposed` → `Accepted` → `Superseded by NNNN` (never delete)
- When a decision is reversed, create a NEW ADR that supersedes the old one — update the old one's status to `Superseded by NNNN`
- One decision per ADR — if you're making two choices, write two ADRs
- "We didn't have time to evaluate X" is a valid con — document the real reason, not the ideal one
- Future agents and developers will read these; write for someone who has zero context
