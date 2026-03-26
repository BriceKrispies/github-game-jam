# Runtime Shell — Implementation Overview

## What Was Built

The runtime shell is the host application for the game studio platform. It provides:

- App bootstrapping and layout rendering
- Hash-based routing between four shell views (Home, Library, Play, About)
- A game registry with typed metadata entries
- Lifecycle orchestration: mount, unmount, pause, resume
- SharedServices construction (namespaced storage, viewport, audio)
- A game viewport with empty, unavailable, and error states
- Responsive layout for desktop and mobile
- Visibility-based pause/resume (browser tab switching)
- ESC key shortcut to return from a playing game to the library

## Shell Views

| View | Route | Purpose |
|------|-------|---------|
| Home | `#home` or empty | Landing page with stats and CTA |
| Library | `#library` | Card grid of all registered games |
| Play | `#play/<game-id>` | Game viewport with mounted game |
| About | `#about` | Platform description and tech stack |

## How Routing Works

The shell uses hash-based routing for GitHub Pages compatibility. The router module (`src/shell/router.ts`) parses `location.hash` into a `Route` object with a `view` field and optional `gameId`. Navigation triggers a `hashchange` listener which notifies registered callbacks.

Route format:
- `#home` → `{ view: 'home' }`
- `#library` → `{ view: 'library' }`
- `#play/bounce-demo` → `{ view: 'play', gameId: 'bounce-demo' }`
- `#about` → `{ view: 'about' }`

## How Game Mounting Works

1. User clicks "Play" on a game card in the Library view, or navigates directly to `#play/<id>`.
2. The app routes to the Play view and calls `handlePlayView(gameId)`.
3. The shell looks up the game in the registry. If not found or not playable, a state screen is shown.
4. If playable, `mountGame(entry, viewport)` is called:
   - The current game (if any) is unmounted first.
   - A fresh container `<div>` is created with `data-game="<id>"`.
   - `SharedServices` are constructed for this game (fresh storage, viewport observer, audio context).
   - The game module is dynamically imported and `mount(container, services)` is called.
5. On unmount (navigation away, game switch, or ESC key), `unmountCurrentGame()` calls the game's `unmount()` and removes the container.

## How SharedServices Are Built

Each game mount creates a fresh `SharedServices` object:

- **GameStorage**: Wraps `localStorage` with key prefix `studio:<game-id>:`. All get/set/remove/keys/clear operations are scoped.
- **ViewportService**: Uses `ResizeObserver` on the game container. Provides current width/height and an `onResize` subscription.
- **AudioService**: Provides a shared `AudioContext` (created once, reused across mounts to respect browser limits).

## Error Handling

- If `game.mount()` throws, the shell catches it, clears the viewport, and shows an error state with a "Back to Library" button.
- If `game.unmount()` throws, the shell logs the error and forcibly removes the container.
- If `pause()` or `resume()` throws, the shell logs and continues.

## Mobile Behavior

- Below 768px, the top navigation collapses to a hamburger menu with a fullscreen overlay.
- The game viewport fills available width with a minimum height of 400px.
- Touch input works through PointerEvent (unified mouse/touch).
- Safe area insets are applied to the shell layout.
