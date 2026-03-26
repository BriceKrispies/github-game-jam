# Runtime Shell — Source Map

## Directory Structure

```
src/
├── main.ts                         # App entry point — imports styles, creates app
├── types/
│   ├── game.ts                     # GameModule, SharedServices, GameStorage interfaces
│   └── registry.ts                 # RegistryEntry type, GameStatus union
├── styles/
│   ├── reset.css                   # Minimal CSS reset
│   ├── tokens.css                  # Design tokens (colors, spacing, fonts, radii, shadows)
│   └── shell.css                   # All shell layout and view styles
├── shell/
│   ├── app.ts                      # Top-level app coordinator — routing, lifecycle, keyboard
│   ├── layout.ts                   # Shell chrome (header, nav, mobile menu, main area)
│   ├── router.ts                   # Hash-based routing — parse, navigate, listen
│   ├── registry.ts                 # Game registry — entries, lookup, filtering
│   ├── lifecycle.ts                # Mount/unmount/pause/resume orchestration
│   ├── services.ts                 # SharedServices factory (storage, viewport, audio)
│   └── views.ts                    # View renderers (Home, Library, Play, About, states)
└── games/
    ├── bounce-demo/
    │   ├── index.ts                # Playable demo — canvas bouncing balls
    │   └── bounce-demo.css         # Scoped styles for bounce-demo
    └── coming-soon-demo/
        └── index.ts                # Non-playable stub
```

## Where to Do Things

### Add a new shell view

1. Add a case to the `ShellView` type in `src/shell/router.ts`.
2. Add route parsing in `parseHash()` in `router.ts`.
3. Create a `render<ViewName>View()` function in `src/shell/views.ts`.
4. Add the case to `handleRoute()` in `src/shell/app.ts`.
5. Add the nav item to `NAV_ITEMS` in `src/shell/layout.ts`.
6. Add styles to `src/styles/shell.css`.

### Register a new game

1. Create a directory: `src/games/<game-id>/`.
2. Create `index.ts` that default-exports a `GameModule`.
3. Create `<game-id>.css` with selectors scoped to `[data-game="<game-id>"]`.
4. Add an entry to the `registry` array in `src/shell/registry.ts`.

This is the **only** file outside the game directory that must change.

### Modify shell styles

All shell styles live in `src/styles/shell.css`. Design tokens live in `src/styles/tokens.css`. Do not add game-specific styles to these files.

### Modify game lifecycle behavior

The lifecycle manager is `src/shell/lifecycle.ts`. It owns mount, unmount, pause, and resume. Changes here affect all games.

### Modify shared services

The services factory is `src/shell/services.ts`. Changes to `GameStorage`, `ViewportService`, or `AudioService` construction happen here. Interface changes go in `src/types/game.ts`.

## Key Boundaries

```
src/types/         ← Both shell and games import from here
src/shell/         ← Only shell code imports from here
src/styles/        ← Imported by main.ts; games do not import shell styles
src/games/<id>/    ← Only that specific game imports from here
```

Games must never import from `src/shell/`. Games import types only from `src/types/`.

## File Roles

| File | Role | Change frequency |
|------|------|-----------------|
| `main.ts` | Entry point | Rarely |
| `types/game.ts` | Contract interfaces | Rarely (breaking change) |
| `types/registry.ts` | Registry types | Rarely |
| `shell/app.ts` | Top-level coordinator | When adding views or global behavior |
| `shell/layout.ts` | Shell chrome rendering | When changing navigation or header |
| `shell/router.ts` | URL parsing and navigation | When adding routes |
| `shell/registry.ts` | Game manifest | Every time a game is added |
| `shell/lifecycle.ts` | Game mount/unmount | When changing lifecycle behavior |
| `shell/services.ts` | SharedServices factory | When adding/changing shared services |
| `shell/views.ts` | View rendering functions | When modifying any shell view |
| `styles/tokens.css` | Design tokens | When changing visual system |
| `styles/shell.css` | Shell layout/component styles | When changing shell UI |
| `styles/reset.css` | CSS reset | Rarely |
