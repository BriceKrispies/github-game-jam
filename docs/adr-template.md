# ADR Template

Use this template for Architecture Decision Records. Save each ADR as `docs/adr/NNN-short-title.md`.

---

```markdown
# ADR-NNN: Short Title

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Date:** YYYY-MM-DD
**Author:** Name or agent identifier

## Context

What situation or problem prompted this decision? Be specific. Reference existing docs or code.

## Decision

What was decided? State the decision directly.

## Consequences

What changes as a result of this decision?

- **Positive:** What improves.
- **Negative:** What gets harder or what trade-offs are accepted.
- **Migration:** What existing code or docs need to change.

## Alternatives Considered

What other options were evaluated and why were they rejected? Keep it brief.
```

---

## Rules

- Number ADRs sequentially: `001`, `002`, etc.
- An ADR is immutable once accepted. To reverse a decision, create a new ADR that supersedes it.
- Update the superseded ADR's status to `Superseded by ADR-XXX`.
- Keep ADRs short. If the context section exceeds 10 lines, the decision is probably too large — split it.
- Store ADRs in `docs/adr/`. Create the directory when the first ADR is written.
