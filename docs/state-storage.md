# State & Storage

## State Categories

| Category | Lifetime | Storage | Example |
|----------|----------|---------|---------|
| Ephemeral runtime | Current session only, lost on unmount | In-memory variables | Current score, animation frame ID, input state |
| Persisted game state | Survives page reloads | `localStorage` via `services.storage` | High scores, save files, settings |
| Shell state | Managed by the shell | Shell-owned storage | Last played game, UI preferences |

## Ownership Rules

1. **Games own their persisted state.** The shell provides a namespaced `GameStorage` API. Games use it. The shell never reads, writes, or interprets game state.

2. **The shell owns shell state.** Shell preferences (last game, theme, etc.) are stored under the shell's own namespace. Games cannot access shell state.

3. **No game accesses another game's state.** The `GameStorage` API enforces namespace isolation. Direct `localStorage` access is forbidden.

## Storage Namespacing

The shell prefixes all keys with a game-scoped namespace. The game interacts with simple key names; the shell handles prefixing.

```
Internal localStorage key format:
  studio:<game-id>:<key>

Examples:
  studio:tetris:highscore     → game "tetris", key "highscore"
  studio:chess:save-v2        → game "chess", key "save-v2"
  studio:_shell:last-game     → shell-owned, key "last-game"
```

The `_shell` namespace is reserved. No game may use `_shell` as its ID.

## GameStorage API

Games interact only through the `GameStorage` interface provided via `services.storage`. See [game-contract.md](game-contract.md) for the full interface.

```typescript
// Inside a game's mount():
services.storage.set('highscore', 1500);
const score = services.storage.get<number>('highscore'); // 1500
services.storage.remove('highscore');
services.storage.keys();   // []
services.storage.clear();  // removes all keys for this game
```

All values are JSON-serialized. The storage API handles `JSON.stringify` and `JSON.parse` internally. Games must only store JSON-serializable values.

## Ephemeral State

Runtime state that does not survive unmount should be held in plain TypeScript variables or objects within the game's module scope. Do not persist frame counters, animation state, or transient UI state.

```typescript
// ALLOWED: ephemeral state in module scope
let score = 0;
let animationId: number | null = null;

// FORBIDDEN: persisting ephemeral state
services.storage.set('animationId', animationId); // useless and wasteful
```

## Save Data Versioning

Games that persist complex state must version their save format.

### Rules

1. Include a `version` field in the top-level save object.
2. When the save format changes, increment the version.
3. Implement a migration function that upgrades old formats to the current one.
4. Never silently drop old saves. Either migrate them or notify the player.

### Example

```typescript
interface SaveData {
  version: number;
  // ... game-specific fields
}

const CURRENT_VERSION = 2;

function loadSave(storage: GameStorage): SaveData {
  const raw = storage.get<SaveData>('save');
  if (!raw) return createDefaultSave();
  if (raw.version === CURRENT_VERSION) return raw;
  return migrate(raw);
}

function migrate(data: SaveData): SaveData {
  let result = { ...data };
  if (result.version === 1) {
    // v1 → v2: added "inventory" field
    result = { ...result, inventory: [], version: 2 };
  }
  return result;
}
```

### Documenting Migrations

Each game that uses versioned saves should include a comment block or internal doc listing migrations:

```typescript
/**
 * Save format changelog:
 * v1: Initial format. Fields: score, level.
 * v2: Added inventory array. Default: [].
 * v3: Renamed "level" to "stage". Migration: rename key.
 */
```

## Storage Limits

`localStorage` has a ~5MB limit per origin. Games must be conservative:

- Do not store large binary data (images, audio) in storage.
- Keep save data compact. Avoid storing derived/computed values.
- If a game needs large asset caching, use the Cache API (and clean up on unmount if appropriate).

## Shell Storage

The shell uses the reserved `_shell` namespace for its own preferences:

| Key | Value | Purpose |
|-----|-------|---------|
| `last-game` | Game ID string | Resume where the user left off |
| `theme` | `"light"` or `"dark"` | UI preference |

Shell storage keys are an internal implementation detail. Games must not depend on their existence or format.
