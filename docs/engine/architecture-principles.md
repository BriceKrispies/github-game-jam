# Architecture Principles

These are non-negotiable rules governing engine code. They are not aspirations. They are constraints. Every engine change must comply with every rule listed here. If a rule needs to change, record the change in an ADR first.

## 1. Engine Core and Game Modules Are Strictly Separated

Engine code lives in `src/engine/`. Game code lives in `src/games/<game-id>/`. The boundary is hard.

- Engine code must never import from any game directory.
- Engine code must never contain `if`/`switch` branches conditioned on a game ID or game-specific type.
- Game code imports engine interfaces and types. Engine code does not know games exist.

This separation is the single most important structural rule. If it is violated, the engine loses its identity as shared infrastructure and becomes entangled with individual games.

## 2. Stable Interfaces Over Clever Abstractions

Engine APIs must be simple, typed, and stable. Prefer:

- Concrete types with clear fields over deeply generic type parameters.
- Functions that do one thing over configurable multi-mode functions.
- Flat interfaces over deeply nested option objects.

```typescript
// ALLOWED: simple, stable
interface Sprite {
  image: ImageAsset;
  x: number;
  y: number;
  width: number;
  height: number;
}

// FORBIDDEN: over-abstracted
interface Renderable<T extends RenderConfig<K>, K extends BackendHint> {
  config: T;
  hints: Partial<K>;
}
```

When choosing between "elegant but abstract" and "obvious but verbose," choose obvious.

## 3. Composition Over Inheritance

Engine types compose behavior through interfaces and data, not class hierarchies. Deep inheritance trees create coupling and make behavior hard to trace.

- Entities are data containers, not deep class trees.
- Scenes implement an interface, not extend a base class with 20 overridable methods.
- Subsystems are standalone modules, not subclasses of a God-object engine.

Inheritance is acceptable only when it is genuinely the simplest correct structure (e.g., a concrete renderer extending an abstract renderer base). Even then, keep the hierarchy to two levels maximum.

## 4. Renderer Abstraction Without Premature Backend Complexity

The renderer exposes a drawing interface. The Canvas 2D backend implements it. That is the current architecture.

- The renderer interface must not contain Canvas2D-specific types (no `CanvasRenderingContext2D` in the interface).
- The renderer interface must not contain WebGL/WebGPU-specific types either.
- Do not build "backend selection" infrastructure until a second backend exists.
- Do not add renderer features speculatively to accommodate hypothetical future backends.

The abstraction exists so a future backend can be added without changing game code. It does not exist to be exercised today with multiple implementations.

## 5. Deterministic Update Flow

The game loop must follow a strict, predictable order each frame:

```
1. Process input (snapshot current input state)
2. Run fixed-timestep update(s)
   a. Scene update
   b. Entity/world update
   c. Collision detection
   d. Collision response (game-side callbacks)
3. Render
   a. Camera transform
   b. Scene render (back-to-front layer order)
4. Debug overlay (if enabled)
```

No subsystem may trigger out-of-order execution. The update phase must not trigger rendering. The render phase must not mutate game state. Input processing must complete before updates begin.

## 6. No Hidden Global Mutable State

Every piece of mutable state must have a single, explicit owner.

- No module-level `let` variables that accumulate state across frames unless they are encapsulated inside a subsystem with a clear reset path.
- No `window.*` globals.
- No singleton modules that silently share state between scenes or between games.
- The engine's subsystems receive their dependencies explicitly through construction or initialization, not through ambient imports of mutable modules.

```typescript
// FORBIDDEN: hidden global state
let _currentScene: Scene | null = null;
export function getCurrentScene() { return _currentScene; }

// ALLOWED: state owned by an explicit manager
class SceneManager {
  private currentScene: Scene | null = null;
  getCurrent(): Scene | null { return this.currentScene; }
}
```

## 7. Explicit Ownership of Time, Input, Assets, and Scene Transitions

These four concerns cross-cut the engine. Their ownership must be unambiguous:

| Concern | Owner | Rule |
|---------|-------|------|
| Time (delta, elapsed, frame count) | Clock subsystem | Games read from the clock. Games never compute their own delta time. |
| Input state | Input subsystem | Games read input snapshots. Games never add `addEventListener` for game input directly. |
| Asset loading | Asset loader | Games declare assets. Games never call `fetch()` or `new Image()` for game assets. |
| Scene transitions | Scene manager | Games request transitions. Games never directly instantiate or swap scenes. |

These ownership rules prevent the "two sources of truth" problem. If two modules both track elapsed time or both listen for keyboard events, behavior becomes unpredictable.

## 8. Every Subsystem Must Justify Its Existence

Before adding a new subsystem to the engine, it must pass this test:

1. Is it needed by more than one game, or is it foundational infrastructure?
2. Does it have a clear, bounded responsibility?
3. Can it be defined with a stable interface that won't churn?
4. Does it avoid duplicating responsibility with an existing subsystem?

If any answer is no, the code belongs in a game module, not the engine.

## 9. Prefer Deletion Over Speculative Extension

When a subsystem or feature is not actively used:

- Delete it. Do not comment it out. Do not gate it behind a flag.
- If it might be needed later, it can be rebuilt. The docs and git history preserve the knowledge.
- Unused abstractions are not "free." They increase the surface area that agents and humans must understand.

When extending a subsystem:

- Add only what is needed now, not what might be needed later.
- If the extension is speculative, do not merge it. Wait until a concrete use case exists.

## 10. Browser-First Constraints Must Be Respected

The engine runs in a browser tab. Not a native window. Not a dedicated GPU process. These constraints are permanent:

- **Single-threaded by default.** The main thread runs the game loop. Web Workers are available for offloading, but the engine's core update/render flow is synchronous and single-threaded.
- **No guaranteed frame budget.** The browser may throttle background tabs, run garbage collection, or yield to other work. The engine must tolerate frame drops gracefully.
- **User gesture requirements.** Audio playback and fullscreen requests require a user gesture. The engine must not attempt to play audio before the user has interacted.
- **Memory and storage limits.** `localStorage` is ~5MB. Total memory is bounded by the browser. Large asset sets must load incrementally.
- **No filesystem access.** Assets are fetched over HTTP. Save data goes to `localStorage` via the shell's storage API.
- **Deployment is static.** The engine runs from static files served by GitHub Pages. No server-side logic. No dynamic asset generation.

These are not problems to solve. They are the environment. Engine design must work within them, not fight them.

## 11. The Engine Is Not a Product

The engine exists to serve games in this repository. It is not a general-purpose engine for external consumers. Design decisions should optimize for:

- Clarity for AI agents working in this repo.
- Simplicity for the games being built here.
- Correctness for browser deployment.

Do not add features, abstractions, or documentation aimed at external users, plugin ecosystems, or marketplace distribution. The engine's audience is this project.
