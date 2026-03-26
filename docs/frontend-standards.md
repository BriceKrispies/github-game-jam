# Frontend Standards

Standards for vanilla TypeScript, semantic HTML, and modern CSS. These apply to both the shell and individual games.

## TypeScript

### General Rules

- Target ES2022 or later. Use modern syntax: optional chaining, nullish coalescing, `using` declarations where applicable.
- Enable `strict: true` in `tsconfig.json`. No `any` casts unless unavoidable and commented.
- Prefer `const` over `let`. Never use `var`.
- Prefer named exports from game-internal modules. Use default export only for the game's `index.ts` (the `GameModule`).
- Keep files under 300 lines. Split when a file handles multiple concerns.

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case.ts` | `particle-system.ts` |
| Directories | `kebab-case` | `src/games/space-invaders/` |
| Interfaces/Types | `PascalCase` | `GameModule`, `SharedServices` |
| Functions | `camelCase` | `createBoard()` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_LIVES` |
| CSS custom properties | `--kebab-case` | `--color-primary` |
| Data attributes | `data-kebab-case` | `data-game`, `data-cell-index` |

### Module Organization

Each game's `index.ts` should be thin — it creates the `GameModule` object and delegates to internal modules. Avoid putting all game logic in one file.

```
src/games/my-game/
├── index.ts          # GameModule export, mount/unmount wiring
├── my-game.css       # Scoped styles
├── renderer.ts       # DOM rendering logic
├── state.ts          # Game state management
├── input.ts          # Input handling
└── constants.ts      # Game-specific constants
```

## HTML

### Semantic Structure

Use semantic elements. The shell and games both must use HTML elements for their intended purpose.

```html
<!-- ALLOWED: semantic -->
<nav aria-label="Game navigation">
  <ul>
    <li><a href="#game-a">Game A</a></li>
  </ul>
</nav>

<main id="game-viewport">
  <section data-game="my-game" aria-label="My Game">
    <!-- game content -->
  </section>
</main>

<!-- FORBIDDEN: div soup -->
<div class="nav">
  <div class="nav-item" onclick="...">Game A</div>
</div>
```

Applicable elements and when to use them:

- `<nav>` — navigation blocks.
- `<main>` — the game viewport (one per page).
- `<section>` — distinct content sections within a game.
- `<header>` / `<footer>` — shell chrome.
- `<button>` — any clickable control that is not a link. Never use `<div onclick>`.
- `<dialog>` — modals and overlays.
- `<canvas>` — rendering surfaces for games that need pixel control.

### Accessibility

- All interactive elements must be keyboard-accessible.
- Use `aria-label` on elements that lack visible text labels.
- Use `role` attributes only when no semantic element fits.
- Game containers must have `aria-label="<game name>"`.
- Canvas-based games must provide an `aria-label` on the canvas describing the game state, or use a visually-hidden live region for screen reader announcements.
- Focus management: when a game mounts, it should receive focus. When it unmounts, focus returns to the shell.

### Data Attributes

Use `data-*` attributes for JS hooks instead of classes. Classes are for styling; data attributes are for behavior.

```html
<!-- ALLOWED -->
<button data-action="restart">Restart</button>

<!-- AVOID using classes for JS hooks -->
<button class="js-restart">Restart</button>
```

## CSS

### Architecture

The shell defines a token layer using CSS custom properties. Games may consume these tokens for visual consistency.

```
src/styles/
├── tokens.css    # --color-*, --space-*, --font-*, --radius-*, --z-*
├── reset.css     # Minimal reset (box-sizing, margin removal)
├── shell.css     # Shell chrome layout
└── shared.css    # Optional utility classes (visually-hidden, etc.)
```

### Design Tokens

All visual values must come from tokens. Hardcoded colors, font sizes, and spacing values are forbidden in both shell and game CSS, except for game-specific values that have no shell equivalent (e.g., a game board grid size).

```css
/* tokens.css */
:root {
  --color-bg: #0a0a0a;
  --color-surface: #1a1a1a;
  --color-text: #e0e0e0;
  --color-accent: #4fc3f7;
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 2rem;
  --font-mono: 'Courier New', monospace;
  --font-sans: system-ui, sans-serif;
  --radius-sm: 4px;
  --radius-md: 8px;
  --z-shell: 100;
  --z-modal: 200;
}
```

### Scoping Rules

Shell styles use class selectors prefixed descriptively (e.g., `.shell-header`, `.shell-nav`).

Game styles must be scoped to `[data-game="<game-id>"]`. See [core-boundaries.md](core-boundaries.md) for details.

### Layout

- Use CSS Grid and Flexbox. No floats. No absolute positioning for layout (acceptable for overlays within a game).
- Use logical properties (`inline-size`, `block-size`, `margin-inline`) where it improves clarity, but standard properties are acceptable.
- Use `rem` for spacing and font sizes. Use `px` only for borders and fine visual details.
- Use `dvh` / `dvw` (dynamic viewport units) for full-viewport layouts to handle mobile browser chrome.

### Forbidden CSS Practices

- No `!important` except in reset styles.
- No ID selectors for styling (IDs are for JS hooks and ARIA only).
- No element selectors without scoping (e.g., bare `div { }` or `button { }` in game CSS).
- No `@import` in CSS files (Vite handles bundling).
- No CSS-in-JS. Styles live in `.css` files.

## Maintainability

- Each game has one CSS file. If the file exceeds 300 lines, split into `<game>-layout.css` and `<game>-theme.css`.
- Delete dead CSS when removing features. Do not comment it out.
- Prefer composing simple selectors over deeply nested structures. Maximum selector depth: 3 levels.
