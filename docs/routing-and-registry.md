# Routing & Registry

## Game Registry

The registry is how the shell discovers available games. It is a static manifest — a TypeScript array of game registration entries.

### Registry File

```
src/shell/registry.ts
```

The registry imports each game module and exports a list:

```typescript
import type { GameModule } from '../types/game';

// Dynamic imports for code splitting
const registry: Array<{
  id: string;
  name: string;
  description: string;
  load: () => Promise<{ default: GameModule }>;
}> = [
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Classic block-stacking game.',
    load: () => import('../games/tetris/index'),
  },
  {
    id: 'snake',
    name: 'Snake',
    description: 'Eat, grow, survive.',
    load: () => import('../games/snake/index'),
  },
];

export default registry;
```

### Why Dynamic Imports

Each game is loaded on demand via `import()`. This gives Vite automatic code splitting — the browser downloads a game's code only when the player selects it. The registry metadata (`id`, `name`, `description`) is available synchronously for rendering the game list.

### Adding a Game to the Registry

When a new game is created, it must be added to the registry array. This is the **only** file outside `src/games/<game-id>/` that needs to change when adding a game. See [agent-rules.md](agent-rules.md) for the full checklist.

## Game Metadata

Each registry entry must include:

| Field | Type | Purpose |
|-------|------|---------|
| `id` | `string` | URL-safe slug. Must match the directory name under `src/games/`. |
| `name` | `string` | Display name shown in the game selector. |
| `description` | `string` | One-line description for the game list. |
| `load` | `() => Promise<{ default: GameModule }>` | Dynamic import function. |

The `id` must be unique, lowercase, and contain only `a-z`, `0-9`, and hyphens. It is used for:

- URL routing (`#tetris`)
- Storage namespacing (`studio:tetris:*`)
- DOM scoping (`data-game="tetris"`)
- Directory naming (`src/games/tetris/`)

## URL Routing

### Hash-Based Routing

The platform uses hash-based routing because GitHub Pages does not support server-side URL rewriting for arbitrary paths.

```
https://<user>.github.io/<repo>/         → Game selector (home)
https://<user>.github.io/<repo>/#tetris  → Loads the "tetris" game
https://<user>.github.io/<repo>/#snake   → Loads the "snake" game
```

### Router Behavior

1. On page load, the router reads `location.hash`.
2. If the hash matches a registered game ID, the shell mounts that game.
3. If the hash is empty or unrecognized, the shell shows the game selector (home screen).
4. When the user selects a game, the router updates `location.hash` and triggers a game switch.
5. The router listens for `hashchange` to handle back/forward navigation.

### Route Ownership

The URL hash is owned by the shell router. Games must not read or write `location.hash`. If a game needs internal screens (e.g., a settings page within the game), it must manage them with internal state, not URL manipulation.

## GitHub Pages Constraints

### Base Path

When deployed to `https://<user>.github.io/<repo>/`, all assets must be served relative to `/<repo>/`. Configure Vite:

```typescript
// vite.config.ts
export default defineConfig({
  base: '/<repo-name>/',
});
```

For local development, Vite serves from `/` by default. The `base` config only affects the production build.

### No Server-Side Routing

GitHub Pages serves static files. There is no server to rewrite URLs. Consequences:

- Path-based routing (e.g., `/games/tetris`) would return 404 on direct navigation.
- Hash-based routing (`/#tetris`) works because the hash is never sent to the server.
- A `404.html` trick exists (redirect to `index.html` with the path encoded in the URL) but adds complexity. Hash routing is simpler and sufficient.

### Asset Paths

All asset references in HTML and CSS must work with the Vite `base` config. Use relative paths or Vite's asset handling (`import` for processed assets, `public/` for static assets).

```typescript
// ALLOWED: Vite-processed import
import boardImage from './assets/board.png';

// ALLOWED: Public directory reference (resolved at build time)
const img = new Image();
img.src = new URL('/assets/logo.png', import.meta.url).href;

// FORBIDDEN: Absolute path (breaks on GitHub Pages)
img.src = '/assets/logo.png';
```

## Deep Linking

Hash-based URLs are shareable. A link to `https://<user>.github.io/<repo>/#tetris` will load the tetris game directly.

Games cannot support internal deep links (e.g., linking to a specific level) because the hash is reserved for game selection. If internal deep linking becomes necessary, a future ADR should evaluate encoding game-internal state as a query parameter or hash suffix (e.g., `#tetris/level-5`), but this is not supported in the initial architecture.

## Home Screen / Game Selector

When no game is selected (empty hash), the shell renders a game selector showing all registered games with their `name` and `description`. The selector is part of the shell, not a game.
