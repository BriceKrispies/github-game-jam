# Core Boundaries

This document defines ownership rules and forbidden behaviors. When in doubt, the answer is: **the shell owns shared concerns, games own game concerns, and nothing else crosses the boundary.**

## Shell Owns

- `index.html` and its top-level structure.
- All files under `src/shell/`.
- All files under `src/types/`.
- All files under `src/styles/` (design tokens, reset, shell chrome styles, shared utilities).
- The game viewport container element.
- URL routing and navigation.
- The game registry and discovery mechanism.
- Lifecycle orchestration (mount/unmount/pause/resume).
- Construction of `SharedServices`.
- Error boundary and fallback UI.
- Global keyboard shortcuts (e.g., ESC returns to menu).

## Games Own

- Everything inside their `src/games/<game-id>/` directory.
- All DOM nodes inside the container passed to `mount()`.
- All game-specific CSS (scoped to their elements).
- All game-specific state (via `services.storage`).
- All internal logic, rendering, input handling, and assets.
- Their own `index.ts` export conforming to the `GameModule` interface.

## Forbidden Behaviors

### Games Must Not

1. **Read or write another game's storage.** Storage is namespaced per game. Direct `localStorage`/`sessionStorage` access is banned.

2. **Import from another game's directory.** No cross-game imports. Each game is a closed module boundary.

3. **Import from `src/shell/`.** Games depend only on types from `src/types/`. The shell's internal modules are not a public API.

4. **Modify the shell's DOM.** The shell chrome (header, nav, footer) is off-limits. Games render only inside their container.

5. **Add global CSS rules.** No `<style>` injection into `<head>`. No modification of CSS custom properties defined by the shell (games may read them, never write them).

6. **Register global event listeners that survive unmount.** Any listener on `window` or `document` must be removed in `unmount()`.

7. **Mutate shared service objects.** `SharedServices` is a read-only contract. Games must not reassign properties, monkey-patch methods, or extend the object.

8. **Store references to other games' data.** Even if a reference is accidentally available, using it is a contract violation.

### The Shell Must Not

1. **Contain game-specific logic.** No `if (gameId === 'tetris')` branches. The shell is game-agnostic.

2. **Reach inside a game's container.** After calling `mount()`, the container's subtree belongs to the game.

3. **Expose mutable global state.** All shared services must be constructed per-game or use immutable/read-only patterns.

4. **Import from any game directory.** The shell loads games dynamically through the registry, never with static imports.

## Isolation Model

```
┌──────────────────────────────┐
│         Shell Scope          │
│  - Shell DOM                 │
│  - Shell CSS                 │
│  - Router, Registry          │
│  - SharedServices factory    │
│                              │
│  ┌────────────────────────┐  │
│  │    Game Viewport       │  │
│  │  ┌──────────────────┐  │  │
│  │  │  Game Container   │  │  │
│  │  │  (game-owned DOM) │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

- The shell creates the Game Viewport.
- The shell creates a Game Container inside the viewport and passes it to the game.
- The game owns the container's contents. The shell owns everything else.

## Preventing Shared Mutable State

- `SharedServices` is constructed fresh for each game mount. Games cannot leak state to the next game through services.
- The `GameStorage` instance provided to each game is pre-namespaced. There is no way to access another game's keys.
- The `AudioContext` is shared (browsers limit the number of contexts), but games must not store persistent state on it.

## CSS Isolation Strategy

Games must scope their CSS using one of these approaches:

1. **Data-attribute scoping.** Prefix all selectors with `[data-game="<game-id>"]`. The shell adds this attribute to the game container.

```css
/* game-a.css — ALLOWED */
[data-game="game-a"] .board { display: grid; }

/* FORBIDDEN — unscoped selector */
.board { display: grid; }
```

2. **Container-only inline styles.** Use `element.style` on elements the game creates. Acceptable for dynamic styling.

3. **Shadow DOM.** A game may attach a shadow root to its container for hard isolation. This is optional, not required.

Games may read shell CSS custom properties (e.g., `var(--color-bg)`) for visual consistency but must never redefine them.

## Dependency Rules

```
src/types/        ← Games and Shell both import from here
src/shell/        ← Only Shell code imports from here
src/games/game-a/ ← Only game-a imports from here
src/games/game-b/ ← Only game-b imports from here
```

No arrows cross between `src/games/*` directories. No arrows go from `src/games/*` to `src/shell/`. The only shared dependency is `src/types/`.
