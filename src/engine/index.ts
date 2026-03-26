// ── Engine public API ──
// Games and shell import from here.

// Contracts (types)
export type {
  RenderSurface,
  PointerState,
  InputManager,
  AssetManager,
  AudioManager,
  TimeInfo,
  Scene,
  SceneManager,
  EngineContext,
  GameDefinition,
  EngineHost,
} from './contracts';

// Engine host factory (shell uses this)
export { createEngineHost } from './app';

// Render helpers (games use these in their scenes)
export {
  clearSurface,
  drawRect,
  drawCircle,
  drawText,
  drawImage,
  drawRoundRect,
} from './render';

// Collision helpers
export {
  rectsOverlap,
  pointInRect,
  circlesOverlap,
  pointInCircle,
  circleRectOverlap,
} from './collision';
export type { Rect, Circle, Point } from './collision';

// Utils
export { lerp, clamp, smoothstep, randomRange, randomInt } from './utils';
