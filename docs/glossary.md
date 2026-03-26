# Glossary

**Core** — The platform code that is not game-specific. Encompasses the shell, types, and shared styles.

**Game** — A self-contained interactive application that plugs into the shell via the `GameModule` interface. Each game lives in its own directory under `src/games/`.

**Game Container** — The `<div>` element created by the shell and passed to `game.mount()`. The game owns its contents; the shell owns the element itself.

**Game ID** — A unique, lowercase, URL-safe string (e.g., `tetris`, `space-invaders`) that identifies a game. Used for routing, storage namespacing, DOM scoping, and directory naming.

**Game Package** — The complete set of files within a game's directory (`src/games/<game-id>/`). A game package is self-contained and must not reference files from other game packages.

**Game Viewport** — The region of the page where the active game renders. Managed by the shell. Contains the game container.

**GameModule** — The TypeScript interface that every game must implement. Defines `id`, `name`, `description`, `mount()`, `unmount()`, and optionally `pause()` and `resume()`.

**Host** — Synonym for shell when discussed from the game's perspective. The host mounts and unmounts games.

**Lifecycle** — The sequence of events a game goes through: mount → (pause → resume)* → unmount. Managed by the shell's lifecycle manager.

**Manifest** — See Registry.

**Mount** — The act of activating a game: the shell creates a container, calls `game.mount(container, services)`, and the game takes control of rendering.

**Namespaced Storage** — The storage isolation mechanism. Each game's `localStorage` keys are automatically prefixed with `studio:<game-id>:` so games cannot read or write each other's data.

**Pause** — A lifecycle event where the shell signals a game to suspend activity (stop loops, mute audio) without fully unmounting.

**Registry** — The manifest of available games, defined in `src/shell/registry.ts`. Contains metadata and dynamic import functions for each game.

**Resume** — A lifecycle event where the shell signals a paused game to restart activity.

**Runtime** — The active execution environment provided by the shell: lifecycle management, shared services, error isolation.

**Shared Services** — The `SharedServices` object passed to games on mount. Contains namespaced storage, viewport information, and audio context. Explicitly injected, never global.

**Shell** — The host application that provides navigation, layout, lifecycle orchestration, and shared services. The shell does not contain game logic.

**Shell Chrome** — The persistent UI elements owned by the shell: header, navigation, footer. Visible regardless of which game is active.

**Unmount** — The act of deactivating a game: the shell calls `game.unmount()`, the game releases all resources, and the shell removes the container from the DOM.

**Viewport-Safe** — A layout or element that respects the game viewport boundaries and device safe areas, rendering correctly on both desktop and mobile without overflow or clipping.
