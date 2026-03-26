# Engine Source Map

Quick reference for where engine code lives and what each module does.

## src/engine/

```
src/engine/
├── index.ts              # Barrel export — public API surface
├── contracts/
│   └── index.ts          # All TypeScript interfaces (GameDefinition, Scene, EngineContext, etc.)
├── app/
│   └── index.ts          # EngineHost factory — creates and orchestrates all subsystems
├── time/
│   └── index.ts          # Clock: delta tracking, elapsed time, frame count
├── render/
│   └── index.ts          # RenderSurface factory + drawing helpers (rect, circle, text, image, roundRect)
├── input/
│   └── index.ts          # InputManager: keyboard + pointer state with per-frame buffering
├── scenes/
│   └── index.ts          # SceneManager: active scene tracking, enter/exit/update/render/resize
├── assets/
│   └── index.ts          # AssetManager: image loading with Map-based cache
├── audio/
│   └── index.ts          # AudioManager: Web Audio API playback, buffer caching, volume control
├── collision/
│   └── index.ts          # 2D collision helpers: rect-rect, circle-circle, point-in-rect, etc.
└── utils/
    └── index.ts          # Math utilities: lerp, clamp, smoothstep, random helpers
```

## src/shell/

```
src/shell/
├── app.ts                # Main shell controller — routing, lifecycle, visibility handling
├── router.ts             # Hash-based routing (#home, #library, #play/<id>, #about)
├── registry.ts           # Game manifest — metadata + dynamic imports
├── lifecycle.ts          # Engine host management — mountGame/unmountCurrentGame/pause/resume
├── layout.ts             # Shell chrome — header, nav, mobile overlay
├── views.ts              # View renderers — home, library, play, about, error states
└── services.ts           # SharedServices factory — storage, viewport, audio (legacy)
```

## src/games/

Each game folder exports a default `GameDefinition`.

```
src/games/
├── bounce-demo/          # Reference implementation — simple physics demo
├── risk-tap-miner/       # Arcade push-your-luck game
├── courier-in-collapse/  # Grid-based delivery puzzle
├── tunnel-pop/           # Grid-based digging arcade game
└── coming-soon-demo/     # Placeholder (not playable)
```

## Where shell ends and engine begins

- **Shell** creates the `.game-container` DOM element and calls `engine.start(container, gameDef)`
- **Engine** takes ownership of everything inside that container: canvas, loop, input, time
- **Shell** only calls `engine.pause()`, `engine.resume()`, and `engine.stop()` after that
- Shell never touches the canvas or game loop directly

## Adding a new engine feature

1. Define the interface in `src/engine/contracts/index.ts`
2. Implement in a new or existing subsystem folder under `src/engine/`
3. Wire it into `EngineContext` in `src/engine/app/index.ts`
4. Export from `src/engine/index.ts`

## Adding a new game

1. Create `src/games/<game-id>/` with an `index.ts` that exports a `GameDefinition`
2. Add a registry entry in `src/shell/registry.ts` with metadata and a dynamic import
3. The game receives `EngineContext` in its scenes — use `ctx.input`, `ctx.surface`, `ctx.time`, etc.
