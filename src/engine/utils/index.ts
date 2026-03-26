/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Smoothstep interpolation. */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Random float in range [min, max). */
export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in range [min, max] (inclusive). */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}
