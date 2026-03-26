# Mobile & Desktop Guidelines

The platform must work on desktop browsers and mobile browsers (iOS Safari, Android Chrome). "Work" means: usable, legible, and interactive — not merely visible.

## Shell Responsibilities

### Viewport Meta

`index.html` must include:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

No `user-scalable=no`. Users must be able to zoom.

### Shell Layout

The shell uses a vertical layout: shell chrome (header/nav) at the top, game viewport filling the remaining space.

```css
.shell-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100dvh;
}
```

The game viewport element stretches to fill available space. Games receive its dimensions through `services.viewport`.

### Breakpoints

The shell uses two layout modes:

| Mode | Condition | Behavior |
|------|-----------|----------|
| Desktop | `width >= 768px` | Full navigation visible. Game viewport is large. |
| Mobile | `width < 768px` | Navigation collapses (hamburger or bottom nav). Game viewport fills screen width. |

The `768px` threshold is a shell-level decision. Games should not hardcode breakpoints — they should respond to the container dimensions provided by `services.viewport`.

### Safe Areas

On notched/pill devices, the shell must respect safe area insets:

```css
.shell-layout {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```

Games render inside the viewport, which is already inside the safe area. Games do not need to handle safe areas themselves.

## Game Responsibilities

### Container-Relative Sizing

Games must size themselves relative to the container they receive, not the window. Use the `services.viewport` dimensions to make layout decisions.

```typescript
// ALLOWED: using provided viewport
const { width, height } = services.viewport;
const cellSize = Math.floor(Math.min(width, height) / gridSize);

// FORBIDDEN: reading window dimensions directly
const w = window.innerWidth; // NO
```

### Responsive Rendering

Games must handle viewports as small as **320×480** (portrait phone) and as large as **2560×1440** (desktop monitor).

Strategies:

1. **Fluid scaling.** Compute layout from container dimensions. Best for grid-based or board games.
2. **Canvas scaling.** Render to a logical resolution and scale the canvas with CSS `width`/`height` or `transform: scale()`. Best for pixel-art or physics games.
3. **Reflowing layout.** Use CSS Grid/Flexbox inside the container with relative units. Best for card games or menu-heavy games.

Games must not assume a fixed aspect ratio unless they explicitly handle letterboxing within their container.

### Touch and Mouse Input

Games must handle both input modes. Use `PointerEvent` as the primary input API — it unifies mouse and touch.

```typescript
// ALLOWED: PointerEvent (works for both mouse and touch)
element.addEventListener('pointerdown', handlePointerDown);
element.addEventListener('pointermove', handlePointerMove);
element.addEventListener('pointerup', handlePointerUp);

// AVOID: Separate mouse + touch listeners (redundant with PointerEvent)
element.addEventListener('mousedown', ...);
element.addEventListener('touchstart', ...);
```

Rules:

- Never require hover for functionality. Hover can enhance (tooltips, highlights) but must not gate actions.
- Touch targets must be at least **44×44 CSS pixels** (WCAG minimum).
- Handle `pointercancel` to clean up drag/swipe state.
- Use `touch-action: none` on canvas/game-board elements to prevent scroll interference, but only on the specific element, not on the body.

### Keyboard Input

Desktop players may use keyboard controls. Games that support keyboard input must:

- Listen on the game container or `window`, and remove listeners on unmount.
- Not conflict with shell shortcuts (currently: `Escape` returns to menu).
- Document supported keys in the game's UI.

### Orientation

Games must work in both portrait and landscape. If a game strongly prefers one orientation, it may display a suggestion (e.g., "Rotate your device for the best experience") but must remain functional in both.

Do not use the Screen Orientation API to lock orientation. This requires fullscreen mode and creates a poor user experience.

## Performance on Mobile

- Avoid layout thrashing. Batch DOM reads and writes.
- Use `requestAnimationFrame` for animation, never `setInterval`.
- Keep DOM node count low. For games with many elements, prefer `<canvas>`.
- Test with CPU throttling (Chrome DevTools → Performance → 4x slowdown).
- Avoid large images without compression. Use appropriate formats (WebP, SVG where applicable).

## Text and Readability

- Minimum font size: `14px` (`0.875rem`) on mobile.
- Ensure sufficient color contrast (WCAG AA: 4.5:1 for body text, 3:1 for large text).
- Use `rem` units so text scales with user zoom preferences.
