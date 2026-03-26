/** Axis-aligned bounding box. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Check if two axis-aligned rectangles overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Check if a point is inside a rectangle. */
export function pointInRect(p: Point, r: Rect): boolean {
  return (
    p.x >= r.x &&
    p.x <= r.x + r.width &&
    p.y >= r.y &&
    p.y <= r.y + r.height
  );
}

/** Check if two circles overlap. */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dist = dx * dx + dy * dy;
  const radii = a.radius + b.radius;
  return dist < radii * radii;
}

/** Check if a point is inside a circle. */
export function pointInCircle(p: Point, c: Circle): boolean {
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return dx * dx + dy * dy <= c.radius * c.radius;
}

/** Check if a circle and rectangle overlap. */
export function circleRectOverlap(c: Circle, r: Rect): boolean {
  const closestX = Math.max(r.x, Math.min(c.x, r.x + r.width));
  const closestY = Math.max(r.y, Math.min(c.y, r.y + r.height));
  const dx = c.x - closestX;
  const dy = c.y - closestY;
  return dx * dx + dy * dy < c.radius * c.radius;
}
