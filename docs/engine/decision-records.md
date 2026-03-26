# Engine Decision Records

Architectural decisions affecting the engine are recorded as lightweight ADRs in `docs/engine/adr/`. Each decision gets its own file.

## When to Write an Engine ADR

Write an ADR when a change:

- Adds or removes an engine subsystem.
- Changes a subsystem's responsibility boundary.
- Introduces a new renderer backend.
- Adds a dependency on an external library.
- Changes the game loop's execution model.
- Modifies the `Renderer`, `Scene`, `Entity`, or `EngineInstance` interfaces in a breaking way.
- Moves a feature from game code into the engine (promotion).
- Defers or un-defers a feature listed in [physics-and-collision.md](physics-and-collision.md) or [engine-scope.md](engine-scope.md).

Do not write an ADR for:

- Bug fixes.
- Internal implementation changes that don't alter interfaces or subsystem boundaries.
- Adding a new game.
- Documentation updates.

## File Location and Naming

```
docs/engine/adr/
├── 001-canvas2d-as-baseline-renderer.md
├── 002-fixed-timestep-game-loop.md
└── ...
```

Create the `docs/engine/adr/` directory when the first ADR is written.

Number ADRs sequentially: `001`, `002`, etc. Use lowercase kebab-case titles.

## Template

```markdown
# EADR-NNN: Short Title

**Status:** Proposed | Accepted | Deprecated | Superseded by EADR-XXX
**Date:** YYYY-MM-DD
**Author:** Name or agent identifier

## Context

What problem or situation prompted this decision? Reference specific subsystems, interfaces, or constraints.

## Decision

What was decided? State it directly. Include interface changes or structural changes if applicable.

## Consequences

- **Positive:** What improves or becomes possible.
- **Negative:** What trade-offs are accepted.
- **Migration:** What existing code must change.

## Alternatives Considered

What other options were evaluated? Why were they rejected? Keep it brief.
```

## Rules

- Use the `EADR` prefix (Engine ADR) to distinguish from shell-level ADRs.
- An accepted ADR is immutable. To reverse it, create a new ADR that supersedes it and update the original's status.
- Keep ADRs short. If the context exceeds 15 lines, the decision may be too broad — consider splitting.
- Reference affected docs: update [subsystems.md](subsystems.md), [engine-scope.md](engine-scope.md), or [folder-governance.md](folder-governance.md) when an ADR changes their content.

## Relationship to Shell ADRs

Shell-level architectural decisions use the template in [../adr-template.md](../adr-template.md) and live in `docs/adr/`. Engine ADRs live in `docs/engine/adr/`. The two are separate decision logs because the engine and shell have different change cadences and different audiences.

If a decision affects both the shell and the engine (e.g., changing the `SharedServices` interface), record it as a shell-level ADR and reference it from the engine docs.
