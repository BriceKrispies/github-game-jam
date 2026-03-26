# Game Module Contract

This document defines the contract between the engine and individual game modules. It extends the shell-level [game-contract.md](../game-contract.md) with engine-specific integration rules.

## What a Game Module Is

A game module is a self-contained unit of game logic that uses the engine's subsystems to run. It lives in `src/games/<game-id>/` and exports a `GameModule` that the shell mounts. Internally, it creates scenes, entities, and logic that compose engine subsystems into a playable game.

A game module is not an engine extension. It does not add subsystems, modify engine internals, or provide shared infrastructure to other games.

## Layered Contract

The game module sits between two contracts:

```
Shell ──mounts──→ GameModule ──uses──→ Engine Subsystems
```

1. **Shell contract** ([game-contract.md](../game-contract.md)): The shell calls `mount(container, services)` and `unmount()`. The game module implements these.
2. **Engine contract** (this document): Inside `mount()`, the game module creates an engine instance, initializes subsystems, defines scenes, and starts the game loop. On `unmount()`, it stops the loop and cleans up.

## Engine Integration Pattern

The game module is the place where the engine is instantiated and wired together. The engine does not auto-start. The game explicitly creates and configures it.

```typescript
import type { GameModule, SharedServices } from '../../types/game';
import { createEngine } from '../../engine';
import { TitleScene } from './scenes/title';
import { GameplayScene } from './scenes/gameplay';

let engine: ReturnType<typeof createEngine> | null = null;

const game: GameModule = {
  id: 'my-game',
  name: 'My Game',
  description: 'A short description.',

  mount(container: HTMLElement, services: SharedServices) {
    engine = createEngine(container, services);

    engine.scenes.register('title', () => new TitleScene(engine!));
    engine.scenes.register('gameplay', () => new GameplayScene(engine!));

    engine.scenes.switchTo('title');
    engine.start();
  },

  unmount() {
    if (engine) {
      engine.stop();
      engine.destroy();
      engine = null;
    }
  },

  pause() {
    engine?.pause();
  },

  resume() {
    engine?.resume();
  },
};

export default game;
```

## Engine Factory

The engine is created via a factory function, not a global singleton. Each game mount creates a fresh engine instance. This guarantees no state leaks between games or between mount/unmount cycles.

```typescript
interface EngineInstance {
  /** Scene management. */
  scenes: SceneManager;

  /** Input state for the current frame. */
  input: InputManager;

  /** Drawing interface. */
  renderer: Renderer;

  /** Camera/view control. */
  camera: Camera;

  /** Asset loading. */
  assets: AssetLoader;

  /** Audio playback. */
  audio: AudioManager;

  /** Collision detection. */
  collision: CollisionSystem;

  /** Frame clock. */
  clock: Clock;

  /** Debug overlay (dev builds only). */
  debug: DebugOverlay;

  /** Start the game loop. */
  start(): void;

  /** Stop the game loop. */
  stop(): void;

  /** Pause the game loop (freezes updates and rendering). */
  pause(): void;

  /** Resume after pause. */
  resume(): void;

  /** Release all resources. Call on unmount. */
  destroy(): void;
}

function createEngine(container: HTMLElement, services: SharedServices): EngineInstance;
```

## Lifecycle Integration

| Shell calls | Game module does | Engine does |
|------------|-----------------|-------------|
| `mount(container, services)` | Creates engine, registers scenes, calls `engine.start()` | Initializes subsystems, begins game loop |
| `unmount()` | Calls `engine.stop()` then `engine.destroy()` | Stops loop, releases all listeners/timers/resources |
| `pause()` | Calls `engine.pause()` | Pauses loop, freezes clock, mutes audio |
| `resume()` | Calls `engine.resume()` | Resumes loop, unfreezes clock, unmutes audio |

## Isolation Rules

### What the Game Owns

- All files in `src/games/<game-id>/`.
- All scenes, entities, components, and gameplay logic.
- The decision of what scenes to register and in what order.
- All game-specific assets (stored in the game's directory or a known public path).
- All game-specific UI (DOM elements inside the container, canvas rendering calls).

### What the Engine Owns

- The game loop and frame timing.
- The renderer and canvas element.
- Input capture and buffering.
- Asset loading infrastructure.
- Audio playback infrastructure.
- Collision detection algorithms.
- Camera transformation math.
- Scene transition mechanics.

### What Neither Owns (Shared Surface)

- The `container` element: created by the shell, passed to the game, used by the engine to attach a canvas. The game module must not remove or replace the container. The engine must not leak elements outside the container.
- The `SharedServices` object: created by the shell, passed to the game, forwarded to the engine. The engine reads from it but must not modify it.

## Rules for Game Modules

1. **One engine instance per mount.** Create it in `mount()`, destroy it in `unmount()`. Never reuse across mounts.
2. **No engine modification.** Games use the engine's public API. They do not monkey-patch, subclass, or extend engine internals.
3. **No cross-game imports.** A game must not import from another game's directory.
4. **No engine singleton access.** If a scene or entity needs the engine, pass it explicitly (constructor injection or method parameter). Do not store the engine on `window` or in a module-level export accessible to other games.
5. **Scenes are game code.** Scene implementations live in the game directory. The engine provides the `Scene` interface; the game implements it.
6. **Entity components are game code.** The engine provides the entity container. The game defines what data entities carry.
7. **Input mapping is game code.** The engine provides "key X is pressed." The game maps that to "player jumps."
8. **Save format is game code.** The engine provides save/load wiring. The game defines the data structure and versioning.

## Forbidden Patterns

```typescript
// FORBIDDEN: Accessing engine internals
(engine as any)._renderer.ctx.fillRect(0, 0, 100, 100);

// FORBIDDEN: Modifying the engine prototype
Renderer.prototype.drawParticle = function() { ... };

// FORBIDDEN: Storing engine globally
(window as any).engine = engine;

// FORBIDDEN: Importing another game's scene
import { BossScene } from '../other-game/scenes/boss';

// FORBIDDEN: Creating a second canvas outside the container
const extraCanvas = document.createElement('canvas');
document.body.appendChild(extraCanvas);
```

## Allowed Patterns

```typescript
// ALLOWED: Using engine subsystems through public API
engine.renderer.drawSprite(sprite, x, y, w, h);
engine.input.isKeyDown('ArrowLeft');
engine.audio.playSound(explosionSound);
engine.scenes.switchTo('game-over');

// ALLOWED: Passing engine to scene constructors
class GameplayScene implements Scene {
  constructor(private engine: EngineInstance) {}
  update(dt: number) {
    if (this.engine.input.isKeyDown('Space')) {
      this.jump();
    }
  }
}

// ALLOWED: Game-specific entity components
entity.components.set('health', { current: 100, max: 100 });
entity.components.set('velocity', { vx: 0, vy: -200 });
```
