# Rendering Strategy

## Baseline: Canvas 2D

Canvas 2D is the only renderer backend. All rendering goes through a `<canvas>` element created by the engine inside the game container. The Canvas 2D API (`CanvasRenderingContext2D`) is the implementation behind the renderer interface.

Canvas 2D is chosen because:

- It is universally supported in all target browsers.
- It requires no extensions, flags, or capability detection.
- It is sufficient for 2D sprite-based, shape-based, and text-based games.
- It keeps the engine simple and auditable.

## Renderer Interface

Games and scenes draw through the `Renderer` interface, never through `CanvasRenderingContext2D` directly. This is the abstraction boundary.

```typescript
interface Renderer {
  /** Clear the canvas. Uses background color if no color provided. */
  clear(color?: string): void;

  /** Draw an image asset at world coordinates. */
  drawSprite(image: ImageAsset, x: number, y: number, w: number, h: number): void;

  /** Draw a sub-region of an image (sprite sheet). */
  drawSpriteRegion(
    image: ImageAsset,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number
  ): void;

  /** Draw a filled rectangle at world coordinates. */
  drawRect(x: number, y: number, w: number, h: number, color: string): void;

  /** Draw a rectangle outline at world coordinates. */
  strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth?: number): void;

  /** Draw a filled circle at world coordinates. */
  drawCircle(x: number, y: number, radius: number, color: string): void;

  /** Draw a circle outline at world coordinates. */
  strokeCircle(x: number, y: number, radius: number, color: string, lineWidth?: number): void;

  /** Draw a line between two world-coordinate points. */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth?: number): void;

  /** Draw text at world coordinates. */
  drawText(text: string, x: number, y: number, options?: TextOptions): void;

  /** Set the active camera for world-to-screen transformation. */
  setCamera(camera: Camera): void;

  /** Get the canvas width in CSS pixels. */
  getWidth(): number;

  /** Get the canvas height in CSS pixels. */
  getHeight(): number;

  /** Begin a new frame. Called by the engine loop, not by games. */
  beginFrame(): void;

  /** End the current frame. Called by the engine loop, not by games. */
  endFrame(): void;
}

interface TextOptions {
  font?: string;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
}
```

### Why the Abstraction

Games that program against `Renderer` will continue to work if the backend changes to WebGL or WebGPU. Games that call `ctx.fillRect()` directly will break. The abstraction is the contract; the Canvas 2D implementation is the current backend.

```typescript
// ALLOWED: renderer interface
renderer.drawSprite(playerImage, player.x, player.y, 32, 32);

// FORBIDDEN: direct Canvas2D access
const ctx = canvas.getContext('2d')!;
ctx.drawImage(playerImg, player.x, player.y, 32, 32);
```

## Scene Render Flow

Each frame, the engine's render phase proceeds in this order:

```
1. renderer.beginFrame()
2. renderer.clear()
3. renderer.setCamera(camera)
4. activeScene.render(renderer)
   └─ Scene draws layers back-to-front:
      a. Background layer
      b. World entities layer
      c. Foreground/effects layer
      d. HUD layer (optional — may use screen coordinates)
5. debugOverlay.render(renderer)   [dev builds only]
6. renderer.endFrame()
```

Games control draw order within their scene's `render()` method. The engine does not impose a specific layer system — it provides z-order sorting utilities, but the scene decides what layers exist.

## Camera and View

The camera defines what portion of the game world is visible on screen.

- **Position:** The camera's center in world coordinates.
- **Zoom:** A scale factor. `1.0` = no zoom. `2.0` = 2× magnification.
- **Viewport:** The canvas dimensions in CSS pixels.

The renderer applies the camera transformation before drawing. All coordinates passed to `drawSprite`, `drawRect`, etc. are in world space. The renderer converts them to screen space using the camera.

```
Screen position = (world position - camera position) × zoom + viewport center
```

For HUD elements that should not move with the camera (score displays, health bars), the scene should temporarily reset the camera or draw in screen coordinates:

```typescript
// Draw world content
renderer.setCamera(this.camera);
this.drawWorld(renderer);

// Draw HUD in screen space
renderer.setCamera(null); // or a fixed identity camera
renderer.drawText(`Score: ${this.score}`, 10, 10, { size: 16, color: '#fff' });
```

## Layering and Z-Order

The engine provides z-order sorting as a utility. Within a scene's `render()` method, the game controls draw order. Items drawn later appear on top.

Strategies for layering:

1. **Explicit draw order in code.** Draw background first, then entities sorted by y-position or explicit z-index, then foreground. Simple and predictable.

2. **Entity z-index field.** Entities carry a `z` value. The scene sorts entities by `z` before drawing. The engine may provide a sort utility but does not enforce a z-index scheme.

3. **Named layers.** The game defines an enum of layers (`BACKGROUND`, `ENTITIES`, `EFFECTS`, `HUD`) and draws each in order. This is a game-side pattern, not an engine-enforced structure.

## Sprites and Images

Images are loaded via the asset loader and referenced by handle (`ImageAsset`). The renderer draws them at world coordinates with specified dimensions.

Sprite sheets are supported via `drawSpriteRegion`, which takes a source rectangle (the region of the sheet) and a destination rectangle (where to draw it in world space). Animation frame selection is game logic — the engine provides the drawing primitive.

## Shapes

Rectangles, circles, and lines are drawn with explicit coordinates and colors. These are useful for:

- Debug visualization.
- Simple games that don't use sprites.
- UI elements (health bars, selection boxes).

All shape coordinates are in world space (transformed by the camera) unless the camera is disabled for that draw call.

## Text

Text is drawn via `drawText` with configurable font, size, color, alignment, and baseline. Text rendering uses the Canvas 2D `fillText` API.

Limitations of Canvas 2D text:

- No automatic line wrapping. Games must split text into lines manually.
- Font rendering depends on the browser and OS. Results vary slightly across platforms.
- Custom fonts must be loaded via CSS `@font-face` before use.

For rich text, complex layouts, or interactive text (inputs, buttons), use DOM elements inside the game container instead of canvas text. The renderer is for game-world text, not UI widgets.

## Performance Guidance

- **Minimize draw calls.** Each `drawSprite` / `drawRect` call has overhead. For games with many entities, batch similar draws (e.g., draw all sprites from the same sheet together).
- **Avoid per-frame allocations.** Do not create new objects in the render loop. Reuse vectors, rectangles, and color strings.
- **Use `drawSpriteRegion` for sprite sheets.** One large image with many frames is faster than many small images.
- **Limit canvas size.** Match the canvas size to the container size. Do not create a 4096×4096 canvas for a 800×600 viewport. Use `devicePixelRatio` for crisp rendering on high-DPI screens, but cap the multiplier at 2× to avoid GPU memory issues on mobile.
- **Skip off-screen draws.** Before drawing an entity, check if it's within the camera's visible bounds. The engine may provide a `camera.isVisible(x, y, w, h)` utility for this.

## DOM and Canvas Separation

The engine renderer draws to canvas. DOM elements are a separate concern.

| Use canvas for | Use DOM for |
|---------------|-------------|
| Game world rendering | Menus, dialogs, settings |
| Sprites, shapes, particles | Text inputs, buttons |
| In-world text (labels, damage numbers) | HUD overlays that benefit from CSS layout |
| Backgrounds, tilemaps | Accessibility-critical UI |

Both canvas and DOM elements live inside the game container. They do not conflict as long as the DOM elements are positioned over the canvas with CSS (`position: absolute`).

The engine renderer is not responsible for DOM elements. If a game needs DOM-based UI, it creates and manages those elements directly (inside the container, following [core-boundaries.md](../core-boundaries.md) rules).

## Future Backends

WebGL and WebGPU are potential future renderer backends. When one is introduced:

1. It will implement the same `Renderer` interface.
2. It will be selected at engine creation time, not at runtime per frame.
3. Games will not need to change their render code (they program against the interface).
4. The introduction must go through an ADR.
5. Canvas 2D remains available as a fallback.

Do not add WebGL/WebGPU hooks, capability detection, or conditional paths until an ADR approves a second backend. Speculative abstraction layers for hypothetical backends are forbidden.
