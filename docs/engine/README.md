# Game Engine — Overview

This is the governance documentation for the internal game engine that runs inside the studio-platform shell. The engine is a browser game runtime, not a standalone application. It exists to provide structured, shared infrastructure for building 2D browser games that plug into the shell's lifecycle.

## What the Engine Is

A strict runtime layer that provides:

- A deterministic game loop with fixed-timestep updates and variable-rate rendering.
- Scene management with explicit transitions.
- An entity/world model for organizing game objects.
- Input abstraction for pointer, keyboard, and touch.
- A renderer abstraction with Canvas 2D as the baseline backend.
- Camera/viewport management.
- Asset loading (images, audio, data).
- Simple collision detection and lightweight kinematics.
- Audio playback coordination with the shell's AudioContext.
- Namespaced state persistence via the shell's storage API.
- Debug instrumentation for development builds.

The engine does not contain game-specific logic. It provides the runtime contract and subsystems that games compose to build their own behavior.

## Primary Target: 2D

The engine is designed for 2D games. All core subsystems, rendering abstractions, coordinate systems, and collision primitives assume 2D space. This is not a limitation to apologize for — it is a deliberate scope constraint that keeps the engine small, auditable, and correct.

## 3D: Deferred

3D rendering, 3D physics, and 3D scene graphs are not in scope. If 3D support becomes necessary, it will be designed through an ADR process and built as an opt-in extension, not retrofitted into the 2D core. No current engine design should anticipate or accommodate 3D concerns.

## WebGPU: Optional Future Backend

WebGPU may eventually serve as an alternative renderer backend behind the renderer abstraction. The engine must not be defined around WebGPU. No subsystem should require WebGPU. No API should expose WebGPU types. The renderer interface exists precisely so that backends can be swapped without engine-wide changes. Until a WebGPU backend is built via an ADR, Canvas 2D is the only renderer.

## Relationship to the Shell

The engine runs inside the shell's game viewport. The shell owns the page, navigation, lifecycle orchestration, and shared services. The engine receives its execution context from the shell and must respect the shell's mount/unmount/pause/resume lifecycle. See the [shell-level game contract](../game-contract.md) for the hosting interface.

The engine is infrastructure that a game imports. The shell is the host that mounts the game. They are separate layers with a clean boundary between them.

## Documentation Map

See [index.md](index.md) for a navigable list of all engine governance docs.
