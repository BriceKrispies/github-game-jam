# Architecture

## Overview

The platform has two layers:

1. **Shell (core)** — The host application. Owns the page, navigation, layout, lifecycle orchestration, and shared services.
2. **Games** — Self-contained modules that plug into the shell through a defined contract. Each game is a directory under `src/games/`.

```
┌─────────────────────────────────────────┐
│  Shell                                  │
│  ┌──────┐ ┌──────────┐ ┌────────────┐  │
│  │Router│ │ Registry │ │ Services   │  │
│  └──┬───┘ └────┬─────┘ └─────┬──────┘  │
│     │          │              │          │
│     ▼          ▼              ▼          │
│  ┌──────────────────────────────────┐   │
│  │       Lifecycle Manager          │   │
│  └──────────┬───────────────────────┘   │
│             │                           │
│     ┌───────┼───────┐                   │
│     ▼       ▼       ▼                   │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │Game │ │Game │ │Game │  (mounted one  │
│  │  A  │ │  B  │ │  C  │   at a time)  │
│  └─────┘ └─────┘ └─────┘               │
└─────────────────────────────────────────┘
```

Only one game is mounted at a time.

## Recommended Directory Shape

```
project-root/
├── index.html                  # Shell entry point
├── vite.config.ts
├── tsconfig.json
├── package.json
├── docs/                       # This documentation
├── public/
│   └── assets/                 # Shell-level static assets (favicon, logo)
├── src/
│   ├── main.ts                 # Shell bootstrap
│   ├── shell/
│   │   ├── router.ts           # URL ↔ game mapping
│   │   ├── registry.ts         # Game manifest loading and lookup
│   │   ├── lifecycle.ts        # Mount/unmount/pause/resume orchestration
│   │   ├── services.ts         # Shared service construction and injection
│   │   ├── layout.ts           # Shell chrome (header, nav, game viewport)
│   │   └── error-boundary.ts   # Game failure isolation
│   ├── types/
│   │   ├── game.ts             # GameModule interface and lifecycle types
│   │   └── services.ts         # SharedServices interface
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (custom properties)
│   │   ├── reset.css           # Minimal reset
│   │   ├── shell.css           # Shell chrome styles
│   │   └── shared.css          # Optional shared utility classes
│   └── games/
│       ├── game-a/
│       │   ├── index.ts        # Exports GameModule
│       │   ├── game-a.css      # Scoped styles
│       │   └── ...             # Internal modules, assets
│       └── game-b/
│           ├── index.ts
│           ├── game-b.css
│           └── ...
```

## Runtime Model

### Bootstrap Sequence

1. `index.html` loads `src/main.ts`.
2. `main.ts` initializes the shell: layout, router, registry, shared services.
3. The registry discovers available games (see [routing-and-registry.md](routing-and-registry.md)).
4. The router resolves the current URL to a game ID.
5. The lifecycle manager mounts the resolved game.

### Lifecycle: Mount

1. Shell creates a fresh container `<div>` inside the game viewport.
2. Shell calls `game.mount(container, services)`.
3. The game owns everything inside `container`. The shell does not touch it.

### Lifecycle: Unmount

1. Shell calls `game.unmount()`.
2. The game must release all resources: event listeners, timers, animation frames, audio, network connections.
3. Shell removes the container `<div>` from the DOM.

### Lifecycle: Pause / Resume

When the shell needs to suspend a game without fully unmounting it (e.g., the browser tab becomes hidden, or a shell-level modal is shown):

1. Shell calls `game.pause()`. The game must stop animation loops, audio, and timers.
2. Shell calls `game.resume()` when activity should continue.

Pause/resume are optional lifecycle hooks. If a game does not implement them, the shell skips the call. Games that use `requestAnimationFrame` loops or audio **should** implement them.

### Lifecycle: Game Switch

1. Call `unmount()` on the current game.
2. Clear the game viewport.
3. Call `mount()` on the new game.

There is no cross-fade, transition, or simultaneous mounting. One game is active at a time.

## Shell Responsibilities

- Page-level HTML structure (header, navigation, game viewport, footer).
- Game discovery and registry.
- URL routing.
- Lifecycle orchestration (mount, unmount, pause, resume).
- Construction and injection of shared services (storage, viewport info, audio context).
- Error isolation: catching game failures and displaying fallback UI.
- Responsive layout: ensuring the game viewport adapts to screen size.

## Game Responsibilities

- All rendering inside the provided container.
- All game-specific logic, state, input handling, and assets.
- Cleaning up fully on unmount.
- Respecting the lifecycle contract (see [game-contract.md](game-contract.md)).

## What Belongs Where

| Concern | Owner |
|---------|-------|
| Page layout, navigation chrome | Shell |
| Game viewport sizing | Shell |
| Rendering inside viewport | Game |
| URL routing | Shell |
| Game-internal routing/screens | Game |
| Storage access | Shell provides namespaced API; game uses it |
| Input handling inside game area | Game |
| Global keyboard shortcuts (e.g., ESC to menu) | Shell |
| Error recovery from game crash | Shell |
| Audio context creation | Shell (provides via services) |
| Audio playback decisions | Game |

## Responsive / Mobile / Desktop

The shell guarantees a game viewport element that fills available space below the shell chrome. The viewport uses CSS that adapts to any screen size. Games receive the viewport dimensions through shared services and must render responsively within their container.

See [mobile-desktop-guidelines.md](mobile-desktop-guidelines.md) for detailed rules.

## GitHub Pages Deployment

The platform deploys as a static site to GitHub Pages. This affects architecture:

- All routing must work with hash-based URLs or a 404.html fallback (see [routing-and-registry.md](routing-and-registry.md)).
- All assets must use relative paths or the Vite `base` config.
- There is no server. No SSR. No API layer. Everything runs client-side.
