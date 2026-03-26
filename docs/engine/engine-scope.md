# Engine Scope

This document defines what the engine is responsible for and what it is not. Every subsystem, every file, and every interface in the engine must trace back to an in-scope responsibility listed here. If it cannot, it does not belong in the engine.

## In-Scope Responsibilities

### Lifecycle

The engine owns the game loop. It provides:

- A fixed-timestep `update()` tick for deterministic game logic.
- A variable-rate `render()` call for drawing.
- Start, stop, pause, and resume controls that integrate with the shell's lifecycle.
- Frame timing: delta time, elapsed time, frame count.

### Scene Management

The engine owns scene transitions. It provides:

- A scene abstraction with `enter`, `update`, `render`, and `exit` hooks.
- A scene stack or scene switcher for transitioning between scenes.
- Cleanup guarantees: exiting a scene releases its resources.

Scenes are engine infrastructure. What a scene contains is game logic.

### Entity / World Model

The engine provides a lightweight world model for organizing game objects. It provides:

- An entity container that the scene owns.
- A way to add, remove, query, and iterate entities.
- Optional component-like data attachment (prefer simple typed objects over ECS formalism).

The engine does not dictate what components exist. Games define their own entity data.

### Input

The engine owns input abstraction. It provides:

- Unified pointer input (mouse + touch via PointerEvent).
- Keyboard state (key-down, key-up, is-pressed).
- Input buffering per frame so game logic reads a consistent snapshot.
- Coordinate transformation from screen space to world space (via camera).

The engine does not interpret input as gameplay actions. "W key is pressed" is engine. "Player moves north" is game.

### Rendering

The engine owns the render pipeline. It provides:

- A renderer interface that abstracts the drawing backend.
- A Canvas 2D renderer as the baseline implementation.
- Sprite, shape, and text drawing primitives.
- Layer/z-order management.
- Camera-relative rendering (world-to-screen transformation).

The engine does not decide what to draw. Games tell the renderer what to draw during the render phase.

### Timing

The engine owns time. It provides:

- A clock that tracks elapsed time, delta time, and frame count.
- Fixed-timestep accumulation for deterministic updates.
- Time scale control (pause, slow-motion) if needed.

Games read time from the engine. Games do not call `performance.now()` or `Date.now()` for frame timing.

### Asset Loading

The engine owns asset loading infrastructure. It provides:

- An asset loader that fetches and caches images, audio buffers, and JSON/data files.
- A loading lifecycle: request, progress, complete, error.
- Asset handles that the renderer and audio subsystems can consume.

Games declare what assets they need. The engine loads them. Games do not call `fetch()` for game assets directly.

### Audio

The engine provides audio playback coordination. It provides:

- A thin wrapper over the Web Audio API using the shell-provided AudioContext.
- Play, stop, loop, and volume control for sound effects and music.
- Asset-loader integration for audio buffers.

The engine does not own the AudioContext (the shell does). The engine provides a usable audio API on top of it.

### Collision / Physics

The engine provides simple collision detection and lightweight kinematics. It provides:

- AABB (axis-aligned bounding box) collision detection.
- Circle collision detection.
- Overlap/trigger detection (did A and B intersect this frame?).
- Simple velocity/acceleration integration for movement.

See [physics-and-collision.md](physics-and-collision.md) for detailed governance.

### Persistence / State

The engine provides state persistence wiring. It provides:

- A save/load interface that delegates to the shell's namespaced `GameStorage`.
- Conventions for serializing and versioning game state.

The engine does not define save formats. Games define their own. See the shell's [state-storage.md](../state-storage.md).

### Debug Tooling

The engine provides development-time debug instrumentation. It provides:

- FPS counter / frame timing display.
- Collision box visualization.
- Entity count and render call metrics.
- A debug overlay that can be toggled at runtime.

Debug tooling is stripped or gated in production builds.

### UI Boundary

The engine defines the boundary between game rendering (canvas) and UI overlays (DOM). It provides:

- Guidance on when to use canvas rendering vs DOM elements.
- A clear rule: the engine renderer draws to canvas; HUD/menu UI may use DOM elements inside the game container.

The engine does not provide a DOM UI framework. Games that need DOM-based menus or HUD elements build them with vanilla HTML/CSS inside their container.

---

## Out of Scope — Not This

### Game-Specific Rules

The engine never contains game-specific logic. No "if this is a platformer, apply gravity." No enemy AI. No scoring. No level design data. No win/lose conditions. These belong in game modules.

### Bespoke One-Off Systems in Engine Core

If a system is used by exactly one game, it is not engine infrastructure. It is game code. Do not promote single-use systems into the engine to make them feel official. The bar for engine inclusion is: at least two games need it, or it is foundational infrastructure (loop, renderer, input, scenes).

### Full Editor Ambitions

The engine is a runtime, not a level editor, not a visual scene editor, not a drag-and-drop tool. If an editor is ever built, it is a separate project that consumes the engine — it is not part of the engine.

### MMO / Networking Assumptions

The engine assumes single-player, local-only execution. No networking, no multiplayer synchronization, no server authority model. If multiplayer is added later, it will be a separate subsystem designed through an ADR, not grafted onto the core loop.

### Full Physics Simulation

The engine provides simple kinematics and overlap detection. It does not provide rigid body dynamics, joints, constraints, continuous collision detection, or physics materials. If a game needs advanced physics, it should bring its own solver as game-level code or a game-level dependency. The engine will not grow into a physics engine.

### 2D and 3D Parity

The engine does not maintain parallel 2D and 3D implementations. 2D is the target. There is no "3D version" of each subsystem. See [README.md](README.md).

### Framework / Library Wrapping

The engine does not wrap external game frameworks (Phaser, PixiJS, Three.js, etc.). It is its own minimal runtime. If external libraries are ever used, they must be isolated behind engine interfaces and adopted through an ADR.
