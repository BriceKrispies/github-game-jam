# Engine Implementation Overview

The engine is a shared internal runtime layer under `src/engine/` that owns the common infrastructure for all browser games in this platform. Games define scenes and logic; the engine owns the loop, canvas, input, time, and lifecycle.

## Architecture boundaries

```
Shell (src/shell/)          Engine (src/engine/)          Games (src/games/)
─────────────────           ────────────────────          ──────────────────
Navigation, layout          Game loop (rAF)               Scenes (update/render)
Registry metadata           Canvas surface                Game state & rules
Route handling              Input management              Game-specific rendering
Play view mount point       Time/delta tracking           Game-specific UI overlays
Visibility pause/resume     Scene management              Configuration & assets
                            Asset loading
                            Audio playback
                            Collision helpers
                            Resize handling
```

## Runtime flow

1. User navigates to `#play/<game-id>`
2. Shell looks up the registry entry and calls `mountGame(entry, viewport)`
3. Shell creates a `.game-container` div inside the viewport
4. Shell creates an `EngineHost` via `createEngineHost()`
5. Shell calls `engine.start(container, gameDef)`
6. Engine creates subsystems: clock, render surface (canvas), input manager, asset manager, audio manager
7. Engine creates the scene manager with the game's scene map
8. Engine calls `game.init(ctx)` if provided
9. Engine enters the first scene (first key in the scenes map)
10. Engine starts the `requestAnimationFrame` loop
11. Each frame: `clock.tick()` → `input.update()` → `scene.update(dt)` → `scene.render(surface)`
12. On unmount: `engine.stop()` → disposes scene, input, audio, assets, canvas, observer

## Key contracts

| Contract | Purpose |
|---|---|
| `GameDefinition` | What a game provides: id, scenes map, optional init/dispose/pause/resume |
| `Scene` | A game screen with `update(ctx, dt)` and `render(ctx, surface)` lifecycle methods |
| `EngineContext` | Runtime context passed to scenes: input, assets, audio, time, surface, scenes |
| `RenderSurface` | Canvas wrapper exposing ctx, width, height, dpr |
| `InputManager` | Keyboard + pointer state with per-frame just-pressed/released tracking |
| `AssetManager` | Image loading with caching |
| `AudioManager` | Sound effect playback with volume control |
| `EngineHost` | Shell-facing interface: start/stop/pause/resume |

## How games plug in

A game module exports a default `GameDefinition`:

```typescript
import type { GameDefinition, Scene, EngineContext, RenderSurface } from '../../engine';

const mainScene: Scene = {
  enter(ctx) { /* setup */ },
  update(ctx, dt) { /* logic */ },
  render(ctx, surface) { /* draw */ },
  exit(ctx) { /* cleanup */ },
};

const game: GameDefinition = {
  id: 'my-game',
  scenes: { main: mainScene },
};

export default game;
```

Games can still have their own internal modules for state, config, rendering helpers, UI overlays, and input handling, but they no longer own the animation loop, canvas creation, resize observer, or base lifecycle — the engine does.

## Pause/resume

- Shell listens for `visibilitychange` and calls `engine.pause()` / `engine.resume()`
- Engine sets a `paused` flag; when paused, the frame loop resets the clock but doesn't tick
- Engine calls `game.pause(ctx)` / `game.resume(ctx)` if provided

## Resize handling

- Engine uses a `ResizeObserver` on the container
- On resize: updates the canvas dimensions (accounting for DPR), calls `scene.resize()` if provided
- Games that need custom scaling (e.g., grid-based games) handle it in their scene's `resize` or render methods
