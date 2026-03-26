# Folder Governance

This document defines the source layout for the engine and the rules for what goes where. Agents adding or modifying engine code must follow this structure exactly.

## Engine Directory Structure

```
src/engine/
├── index.ts                # Public API — createEngine() and re-exports
├── types.ts                # Shared engine types (Vector2, AABB, etc.)
├── core/
│   ├── engine.ts           # Engine instance construction and wiring
│   ├── loop.ts             # Game loop (rAF scheduling, fixed timestep)
│   └── clock.ts            # Frame clock (dt, elapsed, frame count, time scale)
├── scenes/
│   ├── scene.ts            # Scene interface definition
│   └── scene-manager.ts    # Scene registration, switching, stack
├── world/
│   ├── entity.ts           # Entity type and factory
│   └── world.ts            # Entity container (add, remove, query, iterate)
├── input/
│   ├── input-manager.ts    # Input capture, buffering, per-frame snapshot
│   ├── keyboard.ts         # Keyboard state tracking
│   └── pointer.ts          # Pointer/touch state tracking
├── renderer/
│   ├── renderer.ts         # Renderer interface definition
│   ├── canvas2d.ts         # Canvas 2D backend implementation
│   └── text.ts             # Text rendering options and helpers
├── camera/
│   └── camera.ts           # Camera state, world-to-screen transforms
├── assets/
│   ├── asset-loader.ts     # Fetch, cache, and provide asset handles
│   └── asset-types.ts      # ImageAsset, AudioAsset, DataAsset types
├── audio/
│   └── audio-manager.ts    # Sound/music playback via Web Audio API
├── collision/
│   ├── primitives.ts       # AABB, Circle, Point type definitions
│   ├── tests.ts            # Pure collision test functions
│   ├── collision-system.ts # Entity-level collision detection
│   └── triggers.ts         # Trigger zone enter/stay/exit tracking
├── math/
│   ├── vector2.ts          # Vector2 operations
│   └── util.ts             # Clamp, lerp, remap, random range
├── debug/
│   └── debug-overlay.ts    # FPS, entity count, collision visualization
└── state/
    └── save.ts             # Save/load conventions and helpers
```

## Placement Rules

### `src/engine/index.ts`

The public entry point. This file exports `createEngine()` and re-exports types that games need to import.

- Games import from `../../engine` (which resolves to `index.ts`).
- Games must never import from `../../engine/core/loop.ts` or any other internal path.
- If a type or function is needed by games, it must be re-exported from `index.ts`.

### `src/engine/types.ts`

Shared value types used across multiple subsystems: `Vector2`, `AABB`, `Circle`, `Rect`, `Color`, etc. These are plain data types with no behavior (or minimal utility methods).

**Belongs here:** Data structures used by two or more subsystems.
**Does not belong here:** Types specific to one subsystem (put those in the subsystem's directory).

### `src/engine/core/`

The engine lifecycle: construction, the game loop, and the frame clock.

**Belongs here:** `createEngine()` wiring, `requestAnimationFrame` scheduling, fixed-timestep accumulator, frame timing.
**Does not belong here:** Scene logic, rendering, input processing, collision detection.

### `src/engine/scenes/`

Scene abstraction and scene management.

**Belongs here:** `Scene` interface, `SceneManager` (register, switch, push, pop).
**Does not belong here:** Concrete scene implementations (those are game code in `src/games/<game-id>/`).

### `src/engine/world/`

Entity container and entity type definitions.

**Belongs here:** Entity creation, destruction, tagging, querying, iteration.
**Does not belong here:** Game-specific components, behavior logic, AI, spawning rules.

### `src/engine/input/`

Input capture and abstraction.

**Belongs here:** Keyboard tracking, pointer tracking, per-frame snapshotting, coordinate conversion.
**Does not belong here:** Input mapping ("WASD = move"), game-specific gesture recognition.

### `src/engine/renderer/`

Drawing interface and implementations.

**Belongs here:** `Renderer` interface, Canvas 2D backend, sprite/shape/text drawing.
**Does not belong here:** Game-specific rendering helpers, DOM UI code, future backends (until approved by ADR).

### `src/engine/camera/`

View transformation.

**Belongs here:** Camera position, zoom, world-to-screen / screen-to-world math, viewport bounds.
**Does not belong here:** Game-specific camera behaviors (follow-player, screen shake triggered by game events).

### `src/engine/assets/`

Asset loading and caching.

**Belongs here:** Fetch-based loaders for images, audio, JSON. Caching. Asset handle types. Loading state.
**Does not belong here:** Game-specific asset manifests, procedural asset generation.

### `src/engine/audio/`

Audio playback.

**Belongs here:** Play, stop, loop, volume. Sound and music management. AudioContext integration.
**Does not belong here:** Game-specific audio cues (play explosion on hit).

### `src/engine/collision/`

Collision detection and trigger tracking.

**Belongs here:** Primitive types, overlap tests, entity-level detection, trigger events.
**Does not belong here:** Collision response logic, game-specific hit resolution.

### `src/engine/math/`

Math utilities.

**Belongs here:** Vector2 operations, clamp, lerp, remap, random range, angle utilities.
**Does not belong here:** Game-specific formulas (damage calculation, XP curves).

### `src/engine/debug/`

Development instrumentation.

**Belongs here:** FPS display, collision wireframes, entity count, render stats.
**Does not belong here:** Game-specific debug panels, cheat commands, level skipping.

### `src/engine/state/`

Persistence bridge.

**Belongs here:** Save/load function signatures, versioned-save conventions, serialization helpers.
**Does not belong here:** Game-specific save formats, auto-save timers.

## Forbidden Locations

| File/Pattern | Why it's forbidden |
|--------------|--------------------|
| `src/engine/games/` | Engine must not contain game code. Games live in `src/games/`. |
| `src/engine/ui/` | The engine is not a UI framework. DOM UI is game-level code. |
| `src/engine/network/` | Networking is out of scope (see [engine-scope.md](engine-scope.md)). |
| `src/engine/editor/` | An editor is a separate project, not an engine subsystem. |
| `src/engine/physics/` | The engine has `collision/` for detection and `math/` for kinematics. There is no physics engine. Naming a folder "physics" implies scope the engine does not have. |
| `src/engine/**/*.css` | The engine is a runtime. It does not own styles. Debug overlay styles, if needed, are inline or minimal. |
| `src/engine/**/*.html` | The engine creates DOM elements programmatically. No HTML templates. |

## Adding a New File

1. Determine which subsystem the file belongs to.
2. Place it in that subsystem's directory.
3. If it's needed by games, re-export it from `src/engine/index.ts`.
4. If it doesn't fit any existing subsystem, ask whether a new subsystem is justified (see [architecture-principles.md](architecture-principles.md), Principle 8).

## Adding a New Subsystem

A new directory under `src/engine/` requires:

1. Justification that it serves multiple games or is foundational infrastructure.
2. A clear responsibility statement.
3. Defined allowed/forbidden dependencies.
4. An update to this document and to [subsystems.md](subsystems.md).
5. An ADR if the subsystem changes architectural assumptions.

Do not create directories speculatively. A subsystem with one file and one consumer is not a subsystem — it's premature organization.
