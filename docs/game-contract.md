# Game Contract

Every game must implement this contract. The shell depends on it. No exceptions.

## GameModule Interface

```typescript
interface GameModule {
  /** Unique identifier. Must match the game's directory name. */
  id: string;

  /** Human-readable display name. */
  name: string;

  /** One-line description shown in the game selector. */
  description: string;

  /**
   * Called when the shell activates this game.
   * @param container — Empty <div> owned entirely by the game.
   * @param services — Shared platform services. See SharedServices.
   */
  mount(container: HTMLElement, services: SharedServices): void | Promise<void>;

  /**
   * Called when the shell deactivates this game.
   * The game MUST release all resources: listeners, timers, rAF, audio, network.
   * After this returns, the shell removes the container from the DOM.
   */
  unmount(): void | Promise<void>;

  /**
   * Optional. Called when the game should freeze (tab hidden, shell modal open).
   * Stop animation loops, audio, and timers.
   */
  pause?(): void;

  /**
   * Optional. Called when the game should resume after a pause.
   */
  resume?(): void;
}
```

## SharedServices Interface

```typescript
interface SharedServices {
  /** Namespaced storage scoped to this game. See state-storage.md. */
  storage: GameStorage;

  /** Current viewport dimensions of the game container. */
  viewport: {
    readonly width: number;
    readonly height: number;
    /** Subscribe to resize events. Returns an unsubscribe function. */
    onResize(callback: (width: number, height: number) => void): () => void;
  };

  /** Shared AudioContext, suspended until user gesture. */
  audio: {
    readonly context: AudioContext;
  };
}

interface GameStorage {
  /** Get a value. Returns null if not found. */
  get<T>(key: string): T | null;

  /** Set a value. Serializes to JSON internally. */
  set<T>(key: string, value: T): void;

  /** Remove a key. */
  remove(key: string): void;

  /** List all keys owned by this game. */
  keys(): string[];

  /** Remove all data for this game. */
  clear(): void;
}
```

## How a Game Exports Itself

Each game directory must have an `index.ts` that default-exports a `GameModule`:

```typescript
// src/games/my-game/index.ts
import type { GameModule } from '../../types/game';

const game: GameModule = {
  id: 'my-game',
  name: 'My Game',
  description: 'A short description.',

  mount(container, services) {
    // Build your DOM inside container.
    // Use services.storage for persistence.
    // Use services.viewport for sizing.
  },

  unmount() {
    // Tear down everything. Remove listeners. Cancel timers.
  },

  pause() {
    // Optional: stop loops, mute audio.
  },

  resume() {
    // Optional: restart loops, unmute audio.
  },
};

export default game;
```

## Lifecycle Rules

1. `mount` is called exactly once per activation. The `container` is empty and attached to the DOM.
2. `unmount` is called exactly once per deactivation. After it returns, the game must hold zero references to DOM nodes, timers, or listeners.
3. `pause` and `resume` may be called zero or more times between mount and unmount.
4. `pause` is always followed by either `resume` or `unmount`, never another `pause`.
5. `mount` will not be called again without a preceding `unmount`.

## Non-Negotiables

These rules are absolute. Violating any of them is a blocking defect.

1. **A game must not touch DOM outside its container.** No `document.body.appendChild`. No `document.getElementById` for shell elements. No `document.querySelector` reaching outside the container.

2. **A game must not create global CSS.** No `<style>` tags appended to `<head>`. No modification of `document.styleSheets`. All styles must be scoped (CSS file with scoped selectors, or inline styles on elements inside the container).

3. **A game must not pollute the global namespace.** No `window.myGame = ...`. No global event listeners that persist after unmount.

4. **A game must not import from another game.** No `import { thing } from '../other-game/...'`.

5. **A game must not access storage outside its namespace.** Use only the `services.storage` API. Never call `localStorage` or `sessionStorage` directly.

6. **A game must fully clean up on unmount.** Zero dangling listeners, timers, animation frames, audio nodes, or network requests.

7. **A game must not modify or depend on URL hash/path.** Routing is owned by the shell. If a game needs internal screens, it must manage them with internal state, not the URL.

8. **A game must not call `alert()`, `confirm()`, or `prompt()`.** These block the main thread and break the shell.

## Allowed Patterns

- Creating any DOM structure inside the provided `container`.
- Using `requestAnimationFrame` (cancel it on unmount/pause).
- Using `setTimeout` / `setInterval` (clear them on unmount/pause).
- Using `fetch` for game-specific assets in `public/` or external APIs (abort on unmount).
- Creating `<canvas>` elements inside the container.
- Using Web Audio API via the provided `services.audio.context`.
- Using `PointerEvent`, `KeyboardEvent`, `TouchEvent` listeners on elements inside the container or on `window` (remove on unmount).
- Dynamically importing game-internal modules.

## Forbidden Patterns

```typescript
// FORBIDDEN: Reaching outside the container
document.body.classList.add('my-game-active');

// FORBIDDEN: Global style injection
const style = document.createElement('style');
document.head.appendChild(style);

// FORBIDDEN: Direct storage access
localStorage.setItem('score', '100');

// FORBIDDEN: Cross-game import
import { utils } from '../other-game/helpers';

// FORBIDDEN: Global namespace pollution
(window as any).gameState = { score: 0 };

// FORBIDDEN: Blocking dialogs
alert('Game over!');
```
