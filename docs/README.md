# Game Studio Platform — Documentation

This is the governance documentation for a browser-based game studio platform. The platform is a lightweight shell that hosts multiple self-contained games, deployed to GitHub Pages.

## What This Project Is

A Vite-built, vanilla TypeScript web application that acts as a "game shell." The shell provides navigation, layout, lifecycle orchestration, and shared services. Individual games plug into the shell through a strict contract and run in isolation from one another.

The stack is intentionally framework-free: vanilla TypeScript, semantic HTML, and modern CSS. This choice exists because:

- Games are self-contained units that do not benefit from shared component trees.
- Framework abstractions add coupling between the shell and games.
- AI agents can generate and modify vanilla TS/HTML/CSS with fewer coordination problems than framework code.
- The platform is simple enough that a framework would add weight without reducing complexity.

## Audience

These docs serve two audiences:

1. **AI agents** that will build games, modify the shell, or extend the platform.
2. **Humans** reviewing, auditing, or onboarding onto the project.

Every doc is written for fast mechanical parsing. Rules are explicit. Boundaries are hard. Ambiguity is treated as a defect.

## How to Navigate

| Doc | Purpose |
|-----|---------|
| [architecture.md](architecture.md) | System structure, runtime model, shell vs game separation |
| [game-contract.md](game-contract.md) | The exact integration interface every game must implement |
| [core-boundaries.md](core-boundaries.md) | Ownership rules, forbidden behaviors, isolation enforcement |
| [frontend-standards.md](frontend-standards.md) | TypeScript, HTML, and CSS standards |
| [mobile-desktop-guidelines.md](mobile-desktop-guidelines.md) | Responsive layout, input, viewport, and orientation rules |
| [state-storage.md](state-storage.md) | State ownership, persistence, namespacing, versioning |
| [routing-and-registry.md](routing-and-registry.md) | Game discovery, manifests, URL routing, GitHub Pages constraints |
| [error-handling.md](error-handling.md) | Failure isolation, fallback UI, logging |
| [agent-rules.md](agent-rules.md) | **Start here if you are an AI agent.** Checklists and rules for safe modification |
| [adr-template.md](adr-template.md) | Template for recording architecture decisions |
| [glossary.md](glossary.md) | Definitions of all key terms |
| **[engine/index.md](engine/index.md)** | **Game engine governance — subsystems, rendering, collision, folder structure** |

## Architectural Philosophy

1. **The shell is small and stable.** It orchestrates; it does not contain game logic.
2. **Games are isolated.** No game knows about, depends on, or communicates with another game.
3. **Contracts are explicit.** Games integrate through a typed interface, not convention or magic.
4. **Shared services are injected.** Nothing is reached through ambient globals.
5. **The platform is AI-friendly.** A new game can be added by an agent that reads only the contract and agent rules — it never needs to understand other games.
