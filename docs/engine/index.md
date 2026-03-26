# Engine Documentation — Index

Governance documentation for the internal game engine. The engine is a browser game runtime that runs inside the studio-platform shell. It provides structured subsystems for building 2D games.

Start with the [README](README.md) for orientation. Read [engine-scope.md](engine-scope.md) to understand what the engine is and is not. Read [architecture-principles.md](architecture-principles.md) before writing any engine code.

## Documents

| Doc | Purpose |
|-----|---------|
| [README.md](README.md) | What the engine is, primary target (2D), deferred scope (3D, WebGPU) |
| [engine-scope.md](engine-scope.md) | In-scope and out-of-scope responsibilities for every subsystem |
| [architecture-principles.md](architecture-principles.md) | Non-negotiable rules governing engine code |
| [subsystems.md](subsystems.md) | Subsystem map: responsibilities, dependencies, belongs/doesn't belong |
| [game-module-contract.md](game-module-contract.md) | Contract between engine and game modules, lifecycle, isolation rules |
| [rendering-strategy.md](rendering-strategy.md) | Canvas 2D baseline, renderer interface, scene render flow, camera, layering |
| [physics-and-collision.md](physics-and-collision.md) | Kinematics, AABB/circle collision, triggers, fixed timestep, deferred features |
| [folder-governance.md](folder-governance.md) | Source layout under `src/engine/`, placement rules, forbidden locations |
| [decision-records.md](decision-records.md) | Engine ADR convention and template |

## Quick Reference

**Adding engine code?** Read [folder-governance.md](folder-governance.md) to know where files go, then [subsystems.md](subsystems.md) to verify your code belongs in the engine.

**Building a game?** Read [game-module-contract.md](game-module-contract.md) for the integration pattern, then the shell-level [agent-rules.md](../agent-rules.md) for the full checklist.

**Changing the renderer?** Read [rendering-strategy.md](rendering-strategy.md). If adding a new backend, write an EADR first (see [decision-records.md](decision-records.md)).

**Adding collision features?** Read [physics-and-collision.md](physics-and-collision.md). If the feature is in the deferred list, write an EADR first.

**Unsure if something belongs in the engine?** Apply the test from [architecture-principles.md](architecture-principles.md), Principle 8: Is it needed by multiple games? Does it have a bounded responsibility? Can it be defined with a stable interface? If any answer is no, it belongs in the game, not the engine.
