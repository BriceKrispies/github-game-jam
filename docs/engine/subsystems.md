# Subsystems

The engine is organized into discrete subsystems. Each subsystem has a bounded responsibility, explicit dependencies, and clear rules about what does and does not belong inside it.

No subsystem may reach into another subsystem's internals. Subsystems interact through their public interfaces. If a dependency is not listed as allowed, it is forbidden.

---

## App / Lifecycle

**Responsibility:** Owns the game loop, frame timing, and integration with the shell's mount/unmount/pause/resume lifecycle. This is the top-level coordinator — it starts and stops the engine.

**Allowed dependencies:** Clock, Scene Manager, Input, Renderer, Debug.

**Forbidden dependencies:** Any game module. Collision, Audio, Assets (these are initialized at startup and used by scenes, not by the loop itself).

**Belongs here:**
- `requestAnimationFrame` scheduling.
- Fixed-timestep accumulator logic.
- Loop start/stop/pause/resume.
- Integration with the shell's `GameModule.mount()` and `GameModule.unmount()`.

**Does not belong here:**
- Game initialization logic.
- Scene-specific setup.
- Any rendering or input processing logic (delegate to subsystems).

---

## Scenes

**Responsibility:** Owns scene lifecycle and transitions. A scene is a discrete state of the game (title screen, gameplay, pause menu, game over). Only one scene is active at a time.

**Allowed dependencies:** World/Entities (the scene may own a world), Input (to delegate input), Renderer (to delegate rendering), Audio, Assets, Collision.

**Forbidden dependencies:** App/Lifecycle internals. Other scenes (a scene must not import another scene; transitions go through the scene manager).

**Belongs here:**
- Scene interface definition (`enter`, `update`, `render`, `exit`).
- Scene manager / scene stack.
- Transition requests (push, pop, switch).
- Per-scene resource cleanup on exit.

**Does not belong here:**
- Game-specific scene implementations (those live in game modules).
- Rendering logic (scenes call the renderer; they don't implement drawing primitives).
- Transition animations (if needed, build as a generic engine utility, not inside the scene manager).

### Scene Interface

```typescript
interface Scene {
  /** Called when the scene becomes active. Load assets, initialize state. */
  enter(): void | Promise<void>;

  /** Called each fixed-timestep tick. */
  update(dt: number): void;

  /** Called each render frame. */
  render(renderer: Renderer): void;

  /** Called when the scene is deactivated. Release resources. */
  exit(): void;
}
```

---

## World / Entities

**Responsibility:** Provides a container for game objects (entities) within a scene. Handles adding, removing, querying, and iterating entities.

**Allowed dependencies:** None (pure data structure). May reference engine types (Vector2, AABB) but not subsystem instances.

**Forbidden dependencies:** Renderer, Input, Audio, Scenes, Assets, Collision (the world stores entities; other subsystems operate on them).

**Belongs here:**
- Entity container (list, map, or pool).
- Entity creation and destruction.
- Tagging, grouping, or querying entities by type/component.
- A lightweight component-attachment pattern (typed key-value data on entities).

**Does not belong here:**
- Game-specific entity types or components (games define their own).
- Rendering logic (entities are data; the renderer reads them).
- Collision logic (the collision subsystem reads entity positions/bounds).
- Behavior/AI logic (game code, not engine code).

### Entity Model

Entities are plain data containers. They hold an ID, a position, and an open set of typed components. The engine does not prescribe what components exist — games define their own.

```typescript
interface Entity {
  readonly id: number;
  x: number;
  y: number;
  active: boolean;
  tags: Set<string>;
  components: Map<string, unknown>;
}
```

---

## Input

**Responsibility:** Captures raw browser input events, buffers them, and exposes a per-frame snapshot for deterministic consumption by game logic.

**Allowed dependencies:** Camera (for screen-to-world coordinate conversion).

**Forbidden dependencies:** Renderer, Scenes, World, Audio.

**Belongs here:**
- Keyboard state tracking (down, up, pressed-this-frame, released-this-frame).
- Pointer state tracking (position, buttons, down/up/move).
- Touch state tracking (via PointerEvent unification).
- Per-frame snapshot freezing (input state is locked at the start of each frame).
- Screen-to-world coordinate conversion (using the camera).

**Does not belong here:**
- Gameplay interpretation ("jump," "attack," "select"). That is game-level input mapping.
- UI event handling for DOM elements (games handle their own DOM UI events).
- Shell-level input (Escape to return to menu is shell-owned).

---

## Renderer

**Responsibility:** Draws things to the screen. Provides a drawing interface that game code and scene render methods call. The Canvas 2D implementation is the baseline.

**Allowed dependencies:** Camera (for world-to-screen transformation), Assets (to resolve image handles).

**Forbidden dependencies:** Scenes, World, Input, Collision, Audio.

**Belongs here:**
- The `Renderer` interface (backend-agnostic drawing operations).
- Canvas 2D implementation of the renderer.
- Sprite drawing (from asset handles).
- Shape drawing (rectangles, circles, lines).
- Text drawing.
- Layer/z-order sorting and draw-order management.
- Screen clearing and frame begin/end hooks.
- World-to-screen coordinate transformation using the camera.

**Does not belong here:**
- Game-specific rendering helpers (particle effects for one game, custom shaders for one game).
- DOM manipulation. The renderer draws to canvas. DOM UI is outside the renderer.
- WebGL/WebGPU implementation (until an ADR introduces one).

### Renderer Interface

```typescript
interface Renderer {
  clear(color?: string): void;
  drawSprite(image: ImageAsset, x: number, y: number, w: number, h: number): void;
  drawRect(x: number, y: number, w: number, h: number, color: string): void;
  drawCircle(x: number, y: number, radius: number, color: string): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width?: number): void;
  drawText(text: string, x: number, y: number, options?: TextOptions): void;
  setCamera(camera: Camera): void;
  getWidth(): number;
  getHeight(): number;
}
```

This interface is the abstraction boundary. Games and scenes program against `Renderer`, never against `CanvasRenderingContext2D` directly.

---

## Camera

**Responsibility:** Defines the view into the game world. Transforms between world coordinates and screen coordinates.

**Allowed dependencies:** None (pure math/state).

**Forbidden dependencies:** Renderer, Input, Scenes, World.

**Belongs here:**
- Camera position (x, y) in world space.
- Zoom / scale factor.
- World-to-screen and screen-to-world transformation functions.
- Viewport bounds calculation (what region of the world is visible).
- Optional: smooth follow / lerp toward a target position (generic, not game-specific).

**Does not belong here:**
- Game-specific camera behaviors (cinematic sequences, screen shake tied to game events). Screen shake as a generic utility is acceptable; triggering it based on game events is game code.

---

## Assets

**Responsibility:** Loads, caches, and provides access to game assets (images, audio buffers, JSON data). Assets are loaded once and referenced by handle.

**Allowed dependencies:** Audio (to decode audio buffers into the AudioContext).

**Forbidden dependencies:** Renderer, Scenes, World, Input, Camera.

**Belongs here:**
- Asset loader with fetch-based loading.
- Image loading (`HTMLImageElement` or `ImageBitmap`).
- Audio buffer decoding (via the shell-provided AudioContext).
- JSON/data file loading.
- Asset caching (load once, return cached on subsequent requests).
- Loading state tracking (pending, loaded, failed).
- Asset handle types (`ImageAsset`, `AudioAsset`, `DataAsset`).

**Does not belong here:**
- Asset creation or procedural generation (game code).
- Asset file organization decisions (that is folder governance, not runtime code).
- Texture atlas parsing (acceptable if needed by multiple games; otherwise game code).

---

## Audio

**Responsibility:** Plays sounds and music using the Web Audio API. Wraps the shell-provided AudioContext into a game-friendly API.

**Allowed dependencies:** Assets (to get decoded audio buffers).

**Forbidden dependencies:** Renderer, Scenes, World, Input, Camera.

**Belongs here:**
- Play sound effect (one-shot).
- Play music (looping, with volume control).
- Stop, pause, resume audio playback.
- Master volume control.
- Respecting browser autoplay restrictions (no audio until user gesture).

**Does not belong here:**
- Game-specific audio logic (play "explosion" sound when enemy dies — that decision is game code).
- Audio asset loading (that is the asset loader's job; audio consumes loaded buffers).

---

## Collision

**Responsibility:** Detects overlaps and intersections between geometric primitives. Reports collisions. Does not resolve them — resolution is game logic.

**Allowed dependencies:** World/Entities (to read positions and bounds).

**Forbidden dependencies:** Renderer, Input, Scenes, Audio, Assets.

**Belongs here:**
- AABB vs AABB overlap test.
- Circle vs circle overlap test.
- AABB vs circle overlap test.
- Point-in-AABB / point-in-circle tests.
- Raycast against AABBs (if needed by multiple games).
- Collision pair reporting (which entities overlap this frame).
- Trigger zones (enter/exit/stay events).

**Does not belong here:**
- Collision response (what happens when things collide is game logic).
- Physics forces, joints, constraints.
- Spatial partitioning beyond simple broad-phase (add only when performance requires it, via ADR).

---

## State / Save

**Responsibility:** Provides save/load wiring between game state and the shell's namespaced `GameStorage`. Defines conventions, not formats.

**Allowed dependencies:** Shell's GameStorage interface (via services).

**Forbidden dependencies:** All engine subsystems. State/Save is a bridge to the shell, not an engine-internal concern.

**Belongs here:**
- Save/load function signatures.
- Versioned save data conventions (version field, migration pattern).
- Serialization guidance.

**Does not belong here:**
- Game-specific save data structures (games define their own).
- Auto-save logic (game code decides when to save).

---

## Debug

**Responsibility:** Development-time instrumentation. Provides visual and console-based debugging tools that can be toggled at runtime and stripped in production.

**Allowed dependencies:** Renderer (to draw overlays), Clock (to read frame timing), World/Entities (to count entities), Collision (to visualize bounds).

**Forbidden dependencies:** Scenes (debug observes; it does not participate in scene logic), Input (debug may have its own toggle key, but doesn't process game input), Audio, Assets.

**Belongs here:**
- FPS counter / frame time graph.
- Entity count display.
- Collision bounds visualization (wireframe AABBs and circles).
- Render call count.
- Toggle mechanism (keyboard shortcut or console command).
- Production build gating (`import.meta.env.DEV` checks).

**Does not belong here:**
- Game-specific debug views (custom game state inspectors belong in game code).
- Logging infrastructure (use `console.*` with prefixes as defined in [error-handling.md](../error-handling.md)).

---

## Subsystem Dependency Summary

```
App/Lifecycle ──→ Clock, SceneManager, Input, Renderer, Debug
Scenes        ──→ World, Input, Renderer, Audio, Assets, Collision
World         ──→ (none — pure data)
Input         ──→ Camera
Renderer      ──→ Camera, Assets
Camera        ──→ (none — pure math)
Assets        ──→ Audio (for buffer decoding)
Audio         ──→ Assets
Collision     ──→ World
State/Save    ──→ Shell GameStorage (external)
Debug         ──→ Renderer, Clock, World, Collision
```

Circular dependencies are forbidden. If two subsystems appear to need each other, one of them has the wrong responsibility boundary — fix the boundary, don't add the cycle.
